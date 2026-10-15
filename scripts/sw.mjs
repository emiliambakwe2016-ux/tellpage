import fs from 'node:fs/promises';
import crypto from 'node:crypto';
async function walk(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
const all=(await walk('dist')).map(p=>'/'+p.slice(5)).filter(p=>!['/sw.js','/release.json','/_headers','/_redirects','/_routes.json'].includes(p)&&!p.endsWith('.map'));
const core=all.filter(p=>!p.startsWith('/ocr/')&&!p.startsWith('/pdf/')&&!p.startsWith('/licences/'));
const digest=crypto.createHash('sha256').update(await fs.readFile('scripts/sw.mjs'));for(const f of [...all].sort()){digest.update(f);digest.update(await fs.readFile('dist'+f));}
const version=digest.digest('hex').slice(0,12);
const worker=`
const CACHE='tellpage-${version}',CORE=${JSON.stringify(core)},ALL=${JSON.stringify(all)};
// Pages canonicalises index.html to /. A followed redirect cannot be returned
// for a navigation's manual redirect mode. Normalise legacy responses as well.
function navigationResponse(r){return r.redirected?new Response(r.body,{status:r.status,statusText:r.statusText,headers:r.headers}):r;}
function valid(r,path){return r?.ok&&r.status===200&&!(/\\.(m?js|css|wasm)$/.test(path)&&(r.headers.get('Content-Type')||'').includes('text/html'));}
async function store(cache,path){
 const response=await fetch(new Request(path==='/index.html'?'/':path,{cache:'reload'}));
 if(!valid(response,path))throw Error('An offline file could not be downloaded. Please try again online.');
 await cache.put(path,navigationResponse(response));
}
async function cached(path,previous=false){try{const cache=await caches.open(CACHE);const r=await cache.match(path);if(valid(r,typeof path==='string'?path:new URL(path.url).pathname))return r;if(previous){for(const name of (await caches.keys()).filter(k=>k.startsWith('tellpage-')&&k!==CACHE).reverse()){const hit=await (await caches.open(name)).match(path);if(valid(hit,new URL(path.url).pathname))return hit;}}}catch{}return null;}
const unavailable=()=>new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>TellPage</title><body><h1>TellPage could not connect</h1><p>The offline application files are unavailable. Your saved projects have not been removed. Reconnect and reopen TellPage.</p><a href="/">Try again</a></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const path of CORE)await store(cache,path);await self.skipWaiting();})()));
// Keep previous hashed assets for open tabs. No IndexedDB access or cache purge.
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  if(event.request.mode==='navigate'){
   const shell=await cached('/index.html');if(shell)return navigationResponse(shell);
   try{return navigationResponse(await fetch(event.request));}catch{return unavailable();}
  }
  const hit=await cached(event.request,/^\\/assets\\//.test(url.pathname));if(hit)return hit;
  let response;try{response=await fetch(event.request);}catch{return new Response('This TellPage tool is unavailable offline. Reconnect and try again.',{status:503,headers:{'Content-Type':'text/plain'}});}
  // A cache failure must never turn a successful network response into ERR_FAILED.
  if(ALL.includes(url.pathname)&&valid(response,url.pathname)){try{await (await caches.open(CACHE)).put(event.request,response.clone());}catch{}}
  return response;
 })().catch(()=>unavailable()));
});
self.addEventListener('message',event=>{
 const type=event.data?.type||event.data;
 if(type==='ACTIVATE'){event.waitUntil(self.skipWaiting());return;}
 const reply=data=>event.ports[0]?.postMessage(data);
 if(!['PREPARE','VERIFY','CACHE_ALL'].includes(type))return;
 event.waitUntil((async()=>{try{
 const cache=await caches.open(CACHE);
 if(type==='VERIFY'){let complete=true;for(const path of ALL)if(!valid(await cache.match(path),path)){complete=false;break;}reply({type:'VERIFIED',complete,version:CACHE});return;}
 let done=0;for(const path of ALL){if(!valid(await cache.match(path),path))await store(cache,path);reply({type:'PROGRESS',done:++done,total:ALL.length});}
 reply({type:'READY',complete:true,version:CACHE});
 if(type==='CACHE_ALL')event.source?.postMessage('OFFLINE_READY');
 }catch(error){reply({type:'ERROR',message:error.message||'Offline storage is unavailable. Reconnect and retry.'});if(type==='CACHE_ALL')event.source?.postMessage('OFFLINE_FAILED');}})());
});
`;
await fs.writeFile('dist/sw.js',worker);
await fs.writeFile('dist/release.json',JSON.stringify({version,assetCount:all.length}));

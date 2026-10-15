import fs from 'node:fs/promises';
import crypto from 'node:crypto';
async function walk(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
// Deployment configuration is not a published asset on Cloudflare Pages.
const all=(await walk('dist')).map(p=>'/'+p.slice(5)).filter(p=>!['/sw.js','/_headers','/_redirects','/_routes.json'].includes(p)&&!p.endsWith('.map'));
const core=all.filter(p=>!p.startsWith('/ocr/')&&!p.startsWith('/pdf/')&&!p.startsWith('/licences/'));
const digest=crypto.createHash('sha256');for(const f of [...all].sort()){digest.update(f);digest.update(await fs.readFile('dist'+f));}
const version=digest.digest('hex').slice(0,12);
const worker=`
const CACHE='tellpage-${version}',CORE=${JSON.stringify(core)},ALL=${JSON.stringify(all)};
async function store(cache,path){
 const response=await fetch(new Request(path,{cache:'reload'}));
 if(!response.ok)throw Error('An offline file could not be downloaded. Please try again online.');
 const type=response.headers.get('Content-Type')||'';
 if((/\\.(m?js|css|wasm)$/.test(path))&&type.includes('text/html'))throw Error('An offline tool returned an invalid file. Please try again online.');
 await cache.put(path,response);
}
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const path of CORE)await store(cache,path);})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=(await caches.keys()).filter(k=>k.startsWith('tellpage-'));
 // Retain one prior app cache for already-open windows. IndexedDB is untouched.
 const old=keys.filter(k=>k!==CACHE);for(const key of old.slice(0,-1))await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(event.request.mode==='navigate'){
   const shell=await cache.match('/index.html');if(shell)return shell;
   try{return await fetch(event.request);}catch{return new Response('TellPage is not prepared for offline use yet. Open it online once and prepare offline tools in Settings.',{status:503,headers:{'Content-Type':'text/plain'}});}
  }
  const hit=await cache.match(event.request);if(hit)return hit;
  const prior=await caches.match(event.request);if(prior)return prior;
  try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}catch{return Response.error();}
 })());
});
self.addEventListener('message',event=>{
 const type=event.data?.type||event.data;
 if(type==='ACTIVATE'){self.skipWaiting();return;}
 const reply=data=>event.ports[0]?.postMessage(data);
 if(!['PREPARE','VERIFY','CACHE_ALL'].includes(type))return;
 event.waitUntil((async()=>{try{
 const cache=await caches.open(CACHE);
 if(type==='VERIFY'){let complete=true;for(const path of ALL)if(!await cache.match(path)){complete=false;break;}reply({type:'VERIFIED',complete,version:CACHE});return;}
 let done=0;for(const path of ALL){if(!await cache.match(path))await store(cache,path);reply({type:'PROGRESS',done:++done,total:ALL.length});}
 reply({type:'READY',complete:true,version:CACHE});
 // Compatibility with an already-open window from the first TellPage release.
 if(type==='CACHE_ALL')event.source?.postMessage('OFFLINE_READY');
 }catch(error){reply({type:'ERROR',message:error.message});if(type==='CACHE_ALL')event.source?.postMessage('OFFLINE_FAILED');}})());
});
`;
await fs.writeFile('dist/sw.js',worker);
await fs.writeFile('dist/release.json',JSON.stringify({version,assetCount:all.length}));

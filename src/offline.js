export const offlineState={text:'Prepare offline tools before disconnecting.',busy:false,ready:false};
let registrationPromise;
function refresh(){const status=document.querySelector('#offline-state'),button=document.querySelector('#cache-offline');if(status)status.textContent=offlineState.text;if(button){button.disabled=offlineState.busy;button.textContent=offlineState.busy?'Preparing offline tools…':'Prepare all tools for offline use';}}
function timeout(promise,message,ms=20000){let t;return Promise.race([promise,new Promise((_,reject)=>t=setTimeout(()=>reject(Error(message)),ms))]).finally(()=>clearTimeout(t));}
export async function registration(){
 if(!('serviceWorker'in navigator))throw Error('This browser does not support offline access.');
 if(!registrationPromise)registrationPromise=navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(e=>{registrationPromise=null;throw e;});
 return timeout(registrationPromise,'Offline access could not start. Check your connection and try again.');
}
function installed(reg){return timeout(new Promise((resolve,reject)=>{
 const check=()=>{if(reg.waiting)return resolve(reg.waiting);const w=reg.installing;if(w){if(w.state==='installed')return resolve(w);if(w.state==='redundant')return reject(Error('Offline assets could not be installed. Try again online.'));w.addEventListener('statechange',check,{once:true});return;}if(reg.active)resolve(reg.active);};
 check();reg.addEventListener('updatefound',check,{once:true});
 }),'Offline assets did not finish installing. Try again while connected.',45000);}
function message(worker,type,onProgress){return timeout(new Promise((resolve,reject)=>{
 const channel=new MessageChannel();channel.port1.onmessage=e=>{const data=e.data;if(data.type==='PROGRESS'){onProgress?.(data);return;}channel.port1.close();if(data.type==='ERROR')reject(Error(data.message));else resolve(data);};
 worker.postMessage({type},[channel.port2]);
 }),'Offline preparation took too long. Keep your connection on and try again.',type==='VERIFY'?8000:180000);}
export async function prepareOffline(notice){
 if(offlineState.busy)return;offlineState.busy=true;offlineState.ready=false;offlineState.text='Starting offline preparation…';refresh();
 try{
 const reg=await registration();await reg.update();const worker=await installed(reg);
 await message(worker,'PREPARE',d=>{offlineState.text=`Preparing offline tools: ${d.done} of ${d.total}`;refresh();});
 if(worker.state==='installed'){const activated=timeout(new Promise((resolve,reject)=>{const check=()=>{if(worker.state==='activated')resolve();else if(worker.state==='redundant')reject(Error('The offline update could not activate.'));else worker.addEventListener('statechange',check,{once:true});};check();}),'Offline access could not activate.',25000);worker.postMessage({type:'ACTIVATE'});await activated;}
 await timeout(navigator.serviceWorker.ready,'Offline access could not be activated.',20000);
 if(!navigator.serviceWorker.controller)await timeout(new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true})),'Offline access has not taken control. Reopen TellPage online and try again.',15000);
 const current=(await navigator.serviceWorker.getRegistration())?.active;
 if(!current)throw Error('Offline access is not active. Please try again.');
 const check=await message(current,'VERIFY');if(!check.complete)throw Error('Some offline files are missing. Please try preparation again.');
 offlineState.ready=true;offlineState.text='Ready for offline use. You can disconnect, refresh and open your saved documents.';notice('Offline tools are ready.');
 }catch(e){offlineState.text=e.message||'Offline preparation did not finish. Please try again online.';notice('Offline preparation did not finish. See the status beside the button.');}
 finally{offlineState.busy=false;refresh();}
}
export async function startOffline(){try{const reg=await registration();if(reg.active){const result=await message(reg.active,'VERIFY');if(result.complete){offlineState.ready=true;offlineState.text='Ready for offline use.';refresh();}}}catch{/* The preparation control gives an explicit retry and actionable status. */}}

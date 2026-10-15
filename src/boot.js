import {registration} from './offline.js';
// This small entry remains usable when an application chunk fails to load.
const app=document.querySelector('#app');
const recovery=()=>{if(app.querySelector('.app-header'))return;app.innerHTML='<main style="max-width:640px;margin:12vh auto;padding:24px;font-family:system-ui;line-height:1.6"><h1>TellPage could not open</h1><p>Reconnect and try again. Your saved documents and recordings have not been removed.</p><button id="retry-app" style="min-height:44px">Reload TellPage</button></main>';document.querySelector('#retry-app').onclick=async()=>{try{const reg=await navigator.serviceWorker?.getRegistration();await reg?.update();}catch{}location.reload();};};
const timer=setTimeout(recovery,12000);
if(!import.meta.env.DEV&&'serviceWorker'in navigator)registration().catch(()=>{});
window.addEventListener('vite:preloadError',e=>{e.preventDefault();recovery();});
import('./main.js').then(()=>clearTimeout(timer)).catch(error=>{clearTimeout(timer);console.error(error);recovery();});

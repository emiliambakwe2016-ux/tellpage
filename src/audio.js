// A stored MediaRecorder duration is useful even when the browser reports NaN,
// Infinity, or no metadata yet. Native controls cannot accept a duration override.
export function enhanceAudio(root) {
  root.querySelectorAll('audio[data-duration]').forEach(audio=>{
    if(audio.dataset.enhanced)return;audio.dataset.enhanced='true';
    const player=document.createElement('div');player.className='audio-player';
    const button=document.createElement('button');button.type='button';button.textContent='Play';button.setAttribute('aria-label','Play recording');
    const seek=document.createElement('input');seek.type='range';seek.min='0';seek.step='0.1';seek.value='0';seek.setAttribute('aria-label','Recording position');
    const time=document.createElement('span');time.className='audio-time';time.setAttribute('role','timer');
    const error=document.createElement('span');error.className='audio-error';error.setAttribute('role','alert');
    player.append(button,seek,time,error);audio.after(player);audio.controls=false;audio.hidden=true;audio.preload='metadata';
    const format=n=>`${Math.floor(Math.max(0,n)/60)}:${String(Math.floor(Math.max(0,n)%60)).padStart(2,'0')}`;
    const totalText=n=>n<1?'<0:01':format(n);
    const duration=()=>Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:Number(audio.dataset.duration)>0?Number(audio.dataset.duration):null;
    const update=()=>{const total=duration(),current=Number.isFinite(audio.currentTime)?audio.currentTime:0;seek.max=String(total||1);seek.disabled=!total;seek.value=String(Math.min(current,total||current));time.textContent=`${format(current)} / ${total?totalText(total):'—'}`;seek.setAttribute('aria-valuetext',`${format(current)} of ${total?totalText(total):'unknown duration'}`);button.textContent=audio.paused?'Play':'Pause';button.setAttribute('aria-label',audio.paused?'Play recording':'Pause recording');};
    button.onclick=()=>{if(audio.paused){audio.play().catch(()=>{error.textContent='Unable to play this recording in this browser.';});}else audio.pause();};
    seek.oninput=()=>{try{audio.currentTime=Number(seek.value);}catch{}update();};
    for(const event of ['loadedmetadata','durationchange','timeupdate','play','pause','ended','emptied'])audio.addEventListener(event,update);
    audio.addEventListener('error',()=>{error.textContent='Unable to play this recording in this browser.';});update();
  });
}
export const audioCSS='.audio-player{display:grid;grid-template-columns:auto minmax(40px,1fr);gap:6px 10px;align-items:center;margin:8px 0}.audio-player button{min-height:44px}.audio-player input{width:100%;min-width:0;accent-color:#6d28d9;padding:0}.audio-time{grid-column:1/-1;font:13px system-ui,sans-serif;font-variant-numeric:tabular-nums}.audio-error{grid-column:1/-1;font:13px system-ui,sans-serif}.audio-error:empty{display:none}';

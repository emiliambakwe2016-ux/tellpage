let lastHeight=innerHeight;
export function updateViewport(){
 const v=window.visualViewport;
 const height=v?.height||innerHeight,top=v?.offsetTop||0;
 const editing=document.activeElement?.matches('input,textarea,[contenteditable=true]');
 const keyboard=!!editing && lastHeight-height>140;
 if(!editing)lastHeight=Math.max(innerHeight,height);
 document.documentElement.style.setProperty('--vv-height',height+'px');
 document.documentElement.style.setProperty('--vv-top',top+'px');
 document.body.classList.toggle('keyboard-open',keyboard);
 const toast=document.querySelector('#notice');
 if(toast)toast.style.top=(top+height-(innerWidth<=760&&!keyboard?92:22))+'px';
 const d=document.querySelector('dialog[open]');
 if(d)d.style.maxHeight=Math.max(220,height-24)+'px';
}
export function scrollSnapshot(){return {x:scrollX,y:scrollY,panels:[...document.querySelectorAll('.page-wrap')].map(el=>({el,x:el.scrollLeft,y:el.scrollTop}))};}
export function restoreScroll(s){
 const apply=()=>{window.scrollTo({left:s.x,top:s.y,behavior:'instant'});s.panels.forEach(p=>{if(p.el.isConnected)p.el.scrollTo({left:p.x,top:p.y,behavior:'instant'});});};
 apply();requestAnimationFrame(()=>requestAnimationFrame(apply));
}
export function openDialog(d){const previous=document.activeElement;d.addEventListener('close',()=>{document.body.classList.remove('dialog-open');if(previous?.isConnected)previous.focus({preventScroll:true});updateViewport();},{once:true});document.body.classList.add('dialog-open');d.showModal();updateViewport();}
window.visualViewport?.addEventListener('resize',updateViewport);
window.visualViewport?.addEventListener('scroll',updateViewport);
window.addEventListener('resize',updateViewport);
document.addEventListener('focusin',updateViewport);
document.addEventListener('focusout',()=>requestAnimationFrame(updateViewport));
updateViewport();

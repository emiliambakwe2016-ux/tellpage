let lastHeight=innerHeight,lastWidth=innerWidth,caretFrame;
export function updateViewport(){
 const v=window.visualViewport;
 const height=v?.height||innerHeight,top=v?.offsetTop||0;
 const editing=document.activeElement?.matches('input,textarea,[contenteditable=true]');
 if(Math.abs(innerWidth-lastWidth)>80){lastHeight=Math.max(innerHeight,height);lastWidth=innerWidth;}else lastHeight=Math.max(lastHeight,innerHeight,height);
 const keyboard=innerWidth<=760&&(!!editing||document.body.classList.contains('keyboard-open'))&&lastHeight-height>140;
 document.documentElement.style.setProperty('--vv-height',height+'px');
 document.documentElement.style.setProperty('--vv-top',top+'px');
 document.body.classList.toggle('keyboard-open',keyboard);
 const toast=document.querySelector('#notice');
 if(toast)toast.style.top=(top+height-(innerWidth<=760?82:22))+'px';
 const d=document.querySelector('dialog[open]');
 if(d)d.style.maxHeight=Math.max(180,height-24)+'px';
 cancelAnimationFrame(caretFrame);if(keyboard)caretFrame=requestAnimationFrame(keepCaretVisible);
}
function keepCaretVisible(){
 const editor=document.querySelector('#editor');if(document.activeElement!==editor||document.querySelector('dialog[open]'))return;
 const selection=getSelection();if(!selection?.rangeCount||!selection.isCollapsed)return;
 const range=selection.getRangeAt(0).cloneRange();if(!editor.contains(range.startContainer))return;
 const rect=range.getClientRects()[0];if(!rect?.height)return;
 const viewport=window.visualViewport,nav=document.querySelector('.nav'),tools=document.querySelector('.editor-tools');
 const top=(viewport?.offsetTop||0)+Math.max(12,tools?.getBoundingClientRect().height||0)+8;
 const bottom=nav?nav.getBoundingClientRect().top-12:(viewport?.height||innerHeight)-16;
 const delta=rect.bottom>bottom?rect.bottom-bottom:rect.top<top?rect.top-top:0;
 if(delta)window.scrollBy({top:delta,behavior:'instant'});
}
export function scrollSnapshot(){return {x:scrollX,y:scrollY,panels:[...document.querySelectorAll('.page-wrap')].map(el=>({el,x:el.scrollLeft,y:el.scrollTop}))};}
export function restoreScroll(s){
 const apply=()=>{window.scrollTo({left:s.x,top:s.y,behavior:'instant'});s.panels.forEach(p=>{if(p.el.isConnected)p.el.scrollTo({left:p.x,top:p.y,behavior:'instant'});});};
 apply();requestAnimationFrame(()=>requestAnimationFrame(apply));
}
export function openDialog(d){const previous=document.activeElement;d.addEventListener('close',()=>{document.body.classList.remove('dialog-open');if(previous?.isConnected)previous.focus({preventScroll:true});updateViewport();},{once:true});document.body.classList.add('dialog-open');d.showModal();updateViewport();}
document.addEventListener('input',()=>{if(document.body.classList.contains('keyboard-open')){cancelAnimationFrame(caretFrame);caretFrame=requestAnimationFrame(keepCaretVisible);}});
window.visualViewport?.addEventListener('resize',updateViewport);
window.visualViewport?.addEventListener('scroll',updateViewport);
window.addEventListener('resize',updateViewport);
document.addEventListener('focusin',updateViewport);
document.addEventListener('focusout',()=>requestAnimationFrame(updateViewport));
updateViewport();

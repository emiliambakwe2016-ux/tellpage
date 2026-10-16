// Move existing controls rather than duplicate them: handlers, selection anchors
// and desktop order remain the same across breakpoint changes.
export function organiseMobileWorkspace(){
 const bar=document.querySelector('.actionbar'),header=document.querySelector('.app-header');if(!bar||!header)return;
 let menu=document.querySelector('#document-menu');
 if(!menu){menu=document.createElement('details');menu.id='document-menu';menu.className='mobile-document-actions';menu.innerHTML='<summary aria-label="Document actions">Document <span aria-hidden="true">⌄</span></summary><div class="document-action-list" aria-label="Document actions"></div>';header.append(menu);}
 const ids=['new','upload','restore','save','preview','backup','intro-shortcut','toggle-index','export'];
 if(innerWidth<=760&&bar.dataset.compact!=='true'){
  for(const id of ids){const button=document.getElementById(id);if(button)menu.querySelector('.document-action-list').append(button);}bar.dataset.compact='true';
 }else if(innerWidth>760&&bar.dataset.compact==='true'){
  const buttons=ids.map(id=>document.getElementById(id)),spacer=bar.querySelector('.spacer');bar.replaceChildren(...buttons.slice(0,3),spacer,...buttons.slice(3));bar.dataset.compact='false';menu.open=false;
 }
}
document.addEventListener('click',e=>{const menu=document.querySelector('#document-menu');if(menu?.open&&(!menu.contains(e.target)||e.target.closest('.document-action-list button')))menu.open=false;});
document.addEventListener('keydown',e=>{const menu=document.querySelector('#document-menu');if(e.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary').focus({preventScroll:true});e.preventDefault();}});

// Shared by the editor and the self-contained reader. Controls contain no text
// nodes, so they cannot change text-quote anchors or saved document contents.
export function layoutPDFText(root) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  root.querySelectorAll('.text-layer span[data-box]').forEach(span => {
    const box = JSON.parse(span.dataset.box);
    const page = span.closest('.pdf-page');
    if (!page || !context || !page.clientWidth) return;
    const style = getComputedStyle(span);
    context.font = `${style.fontSize} ${style.fontFamily}`;
    const measured = context.measureText(span.textContent).width;
    span.style.transform = measured ? `scaleX(${box[2] * page.clientWidth / measured})` : '';
  });
}

export function pdfSelectionAnchor(page, range) {
  const layer = page.querySelector('.text-layer');
  if (!layer || range.collapsed || !layer.contains(range.startContainer) || !layer.contains(range.endContainer)) return null;
  const bounds = page.getBoundingClientRect();
  const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
  const rects = [];
  let node;
  while ((node = walker.nextNode())) {
    if (!range.intersectsNode(node)) continue;
    const part = document.createRange();
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.length;
    if (end <= start) continue;
    part.setStart(node, start); part.setEnd(node, end);
    for (const r of part.getClientRects()) {
      if (!r.width || !r.height) continue;
      const left = Math.max(0, (r.left - bounds.left) / bounds.width);
      const top = Math.max(0, (r.top - bounds.top) / bounds.height);
      const right = Math.min(1, (r.right - bounds.left) / bounds.width);
      const bottom = Math.min(1, (r.bottom - bounds.top) / bounds.height);
      if (right > left && bottom > top) rects.push([left, top, right - left, bottom - top]);
    }
  }
  if (!rects.length) return null;
  // Merge only touching fragments on the SAME line, never across a paragraph.
  const lines = [];
  for (const r of rects) {
    const last = lines.at(-1);
    if (last && Math.abs(last[1] - r[1]) < .002 && Math.abs(last[3] - r[3]) < .002 && Math.abs(last[0] + last[2] - r[0]) < .003) {
      last[2] = r[0] + r[2] - last[0];
    } else lines.push([...r]);
  }
  const before = document.createRange(); before.selectNodeContents(layer); before.setEnd(range.startContainer, range.startOffset);
  const start = before.toString().length;
  const quote = range.toString();
  const all = layer.textContent;
  return {type:'region', page:Number(page.dataset.page), quote:quote.trim(), rect:lines[0], rects:lines, textRange:{start, end:start + quote.length, quote, prefix:all.slice(Math.max(0,start-40),start), suffix:all.slice(start+quote.length,start+quote.length+40)}};
}

export function resolvePDFAnchor(page, anchor, selectionFunction) {
  const layer = page?.querySelector('.text-layer');
  if (!layer || !anchor.quote) return anchor;
  const text = layer.textContent;
  const quote = anchor.textRange?.quote || anchor.quote;
  const positions = [];
  let at = text.indexOf(quote);
  while (at >= 0) { positions.push(at); at = text.indexOf(quote, at + 1); }
  const saved = anchor.textRange;
  let start = saved && text.slice(saved.start,saved.end) === quote ? saved.start : null;
  if (start === null && positions.length === 1) start = positions[0];
  if (start === null) return anchor; // Legacy/ambiguous regions remain intact.
  const walker = document.createTreeWalker(layer,NodeFilter.SHOW_TEXT);
  let node, offset = 0, first, last, firstOffset, lastOffset;
  while ((node=walker.nextNode())) {
    const end = offset + node.length;
    if (!first && start >= offset && start < end) { first=node;firstOffset=start-offset; }
    if (start + quote.length > offset && start + quote.length <= end) { last=node;lastOffset=start+quote.length-offset;break; }
    offset=end;
  }
  if (!first || !last) return anchor;
  const range=document.createRange();range.setStart(first,firstOffset);range.setEnd(last,lastOffset);
  return selectionFunction(page,range) || anchor;
}

// Find a clear touch-sized gap closest to the final selected glyph. Text geometry
// is measured after zoom/layout; saved anchors remain independent of screen size.
export function placePDFControl(page, rects, taken) {
  const bounds=page.getBoundingClientRect(), width=bounds.width, height=bounds.height;
  const w=42,h=44,gap=4,last=rects.at(-1);
  const end=last?{x:(last[0]+last[2])*width,y:(last[1]+last[3]/2)*height}:{x:8,y:26};
  const obstacles=[];
  for(const span of page.querySelectorAll('.text-layer span')){
    const range=document.createRange();range.selectNodeContents(span);
    for(const r of range.getClientRects())if(r.width&&r.height)obstacles.push({x:r.left-bounds.left,y:r.top-bounds.top,w:r.width,h:r.height});
  }
  if(!obstacles.length)for(const r of rects)obstacles.push({x:r[0]*width,y:r[1]*height,w:r[2]*width,h:r[3]*height});
  const candidates=[{x:end.x+gap,y:end.y-h/2}];
  for(const r of obstacles)candidates.push({x:r.x+r.w+gap,y:end.y-h/2},{x:r.x-w-gap,y:end.y-h/2},{x:end.x+gap,y:r.y+r.h+gap},{x:end.x+gap,y:r.y-h-gap},{x:Math.max(0,Math.min(width-w,end.x)),y:r.y+r.h+gap});
  candidates.push({x:4,y:4},{x:width-w-4,y:4},{x:4,y:height-h-4},{x:width-w-4,y:height-h-4});
  const overlaps=(a,b)=>a.x<b.x+b.w+gap&&a.x+w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+h+gap>b.y;
  const distance=a=>Math.hypot(Math.max(a.x-end.x,0,end.x-(a.x+w)),a.y+h/2-end.y);
  const clear=a=>a.x>=0&&a.y>=0&&a.x+w<=width&&a.y+h<=height&&!obstacles.some(b=>overlaps(a,b))&&!taken.some(b=>overlaps(a,b));
  let chosen=candidates.sort((a,b)=>distance(a)-distance(b)).find(clear);
  // A crowded line can use the nearest clear outside margin, linked to its end.
  if(!chosen){const margin=[{x:width+4,y:Math.max(0,Math.min(height-h,end.y-h/2))}];for(let d=46;d<height;d+=46)margin.push({x:width+4,y:end.y-h/2+d},{x:width+4,y:end.y-h/2-d});chosen=margin.find(a=>a.y>=0&&a.y+h<=height&&!taken.some(b=>overlaps(a,b)))||{x:width+4,y:height+taken.length*46};}
  taken.push({...chosen,w,h});
  return {...chosen,end,width,height};
}

export function mountAnnotations(root, annotations, resolveText, play, selectPDF, resolvePDF, placePDF) {
  root.querySelectorAll('[data-voice-control],.pdf-highlight,.pdf-voice-link').forEach(e=>e.remove());
  const textRanges=[];
  const positions=new Map();
  for (const a of annotations) {
    let range, target, position;
    if (a.anchor.type==='text') {
      range=resolveText(root,a.anchor);
      if (!range) continue;
      textRanges.push(range.cloneRange());
    } else if (['region','page'].includes(a.anchor.type)) {
      const page=root.querySelector(`[data-page="${a.anchor.page}"]`);
      if (!page) continue;
      const resolved=resolvePDF(page,a.anchor,selectPDF);
      const rects=resolved.rects || (resolved.rect?[resolved.rect]:[]);
      for(const rect of rects){
        const mark=document.createElement('span');mark.className='pdf-highlight';mark.setAttribute('aria-hidden','true');
        mark.style.cssText=`left:${rect[0]*100}%;top:${rect[1]*100}%;width:${rect[2]*100}%;height:${rect[3]*100}%`;
        page.append(mark);
      }
      target=page.closest('.pdf-sheet') || page;
      const taken=positions.get(target)||[];
      position=placePDF(page,rects,taken);positions.set(target,taken);
      const parent=target.getBoundingClientRect(),bounds=page.getBoundingClientRect();
      position.x+=bounds.left-parent.left;position.y+=bounds.top-parent.top;
      position.end.x+=bounds.left-parent.left;position.end.y+=bounds.top-parent.top;
      const x=position.end.x,y=position.end.y,bx=position.x+21,by=position.y+22;
      if(Math.hypot(bx-x,by-y)>34){const link=document.createElement('span');link.className='pdf-voice-link';link.setAttribute('aria-hidden','true');link.style.cssText=`left:${x}px;top:${y}px;width:${Math.hypot(bx-x,by-y)}px;transform:rotate(${Math.atan2(by-y,bx-x)}rad)`;target.append(link);}
    } else continue;
    const button=document.createElement('button');
    button.type='button';button.dataset.voiceControl=a.id;button.className=range?'voice-inline':'pdf-pin';
    button.contentEditable='false';button.setAttribute('aria-label',a.title?`Play ${a.title}`:'Play voice explanation');button.title=button.getAttribute('aria-label');
    button.onmousedown=e=>e.preventDefault();
    button.onclick=e=>{e.preventDefault();e.stopPropagation();play(a);};
    if(range){const end=range.cloneRange();end.collapse(false);end.insertNode(button);}else{button.style.left=`${position.x}px`;button.style.top=`${position.y}px`;target.append(button);}
  }
  if (globalThis.CSS?.highlights && globalThis.Highlight) CSS.highlights.set('voice',new Highlight(...textRanges));
  return textRanges;
}

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

export function mountAnnotations(root, annotations, resolveText, play, selectPDF, resolvePDF) {
  root.querySelectorAll('[data-voice-control],.pdf-highlight').forEach(e=>e.remove());
  const textRanges=[];
  const markerTops=new Map();
  for (const a of annotations) {
    let range, target, top;
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
      const last=rects.at(-1);top=last ? last[1] : .015;
      target=page.closest('.pdf-sheet') || page;
      // Margin markers may move down to avoid each other, but highlights never move.
      const taken=markerTops.get(target)||[];
      let y=top*page.clientHeight;
      while(taken.some(t=>Math.abs(t-y)<46))y+=46;
      y=Math.min(y,Math.max(0,page.clientHeight-44));taken.push(y);markerTops.set(target,taken);top=page.clientHeight?y/page.clientHeight:top;
    } else continue;
    const button=document.createElement('button');
    button.type='button';button.dataset.voiceControl=a.id;button.className=range?'voice-inline':'pdf-pin';
    button.contentEditable='false';button.setAttribute('aria-label',a.title?`Play ${a.title}`:'Play voice explanation');button.title=button.getAttribute('aria-label');
    button.onmousedown=e=>e.preventDefault();
    button.onclick=e=>{e.preventDefault();e.stopPropagation();play(a);};
    if(range){const end=range.cloneRange();end.collapse(false);end.insertNode(button);}else{button.style.top=`min(calc(100% - 44px), ${top*100}%)`;target.append(button);}
  }
  if (globalThis.CSS?.highlights && globalThis.Highlight) CSS.highlights.set('voice',new Highlight(...textRanges));
  return textRanges;
}

import fs from 'node:fs/promises';
const copy=async(a,b)=>{await fs.mkdir(b.substring(0,b.lastIndexOf('/')),{recursive:true});await fs.cp(a,b,{recursive:true});};
await copy('node_modules/tesseract.js/dist/worker.min.js','public/ocr/worker.min.js');
await fs.rm('public/ocr/core',{recursive:true,force:true});await fs.mkdir('public/ocr/core',{recursive:true});for(const f of await fs.readdir('node_modules/tesseract.js-core'))if(/lstm\.wasm\.js$/.test(f))await copy('node_modules/tesseract.js-core/'+f,'public/ocr/core/'+f);
await copy('node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz','public/ocr/eng.traineddata.gz');
for(const dir of ['cmaps','standard_fonts','wasm'])await copy('node_modules/pdfjs-dist/'+dir,'public/pdf/'+dir);
// Keep redistributed upstream notices with the static build.
for(const name of ['mammoth','dompurify','pdfjs-dist','tesseract.js','tesseract.js-core','@tesseract.js-data/eng']){
 const dir='node_modules/'+name;
 for(const f of await fs.readdir(dir))if(/licen[cs]e|notice|copying/i.test(f))await copy(dir+'/'+f,'public/licences/'+name.replaceAll('/','-')+'-'+f);
}

import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5173}});await server.listen();
import {launch} from './browser.mjs';import fs from 'node:fs/promises';
const b=await launch();const page=await b.newPage();await page.goto('http://127.0.0.1:5173');
console.log('browser',await b.version());
const audio=await fs.readFile('/tmp/hello.ogg');
const html=await page.evaluate(async a=>{const {readerHTML}=await import('/src/reader.js');return readerHTML({title:'Portable feasibility test',kind:'text',html:'<p data-block="one">First passage</p><p data-block="two">Second passage</p>',annotations:[{id:'one',title:'First recording',audio:a,duration:.5,anchor:{type:'text',block:'one',quote:'First passage'}},{id:'two',title:'Second recording',audio:a,duration:.5,anchor:{type:'text',block:'two',quote:'Second passage'}}]});},'data:audio/ogg;base64,'+audio.toString('base64'));
await fs.writeFile('/tmp/tellpage-feasibility.html',html);const reader=await b.newPage();const requests=[];reader.on('request',r=>requests.push(r.url()));await reader.goto('file:///tmp/tellpage-feasibility.html');await reader.context().setOffline(true);console.log('marks',await reader.locator('mark').count());for(const a of await reader.locator('audio').all()){console.log('audio',await a.evaluate(async e=>{e.load();await e.play();return {playing:!e.paused,duration:e.duration};}));}console.log('network',requests);await b.close();await server.close();

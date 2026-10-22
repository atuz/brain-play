// Snapshot the current local site for offline WKWebView integration tests.
// No server, GitHub publication or production test endpoint is required.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://atuz.github.io/brain-play/';
const html=await readFile(path.join(root,'index.html'),'utf8');
const entry=new URL(html.match(/<script type="module" src="([^"]+)"/)[1],origin).href;
const pending=[entry],modules=new Map();
const imports=/\bfrom\s*(['"])(\.{1,2}\/[^'"]+)\1|\bimport\s*\(\s*(['"])(\.{1,2}\/[^'"]+)\3\s*\)|\bimport\s*(['"])(\.{1,2}\/[^'"]+)\5/g;
while(pending.length){
  const url=pending.shift();if(modules.has(url))continue;
  const filename=path.resolve(root,decodeURIComponent(new URL(url).pathname.slice(new URL(origin).pathname.length)));
  if(!filename.startsWith(root+path.sep))throw Error('Module outside site');
  const source=(await readFile(filename,'utf8')).replace(imports,(match,q,from,dq,dynamic,sq,sideEffect)=>{
    const relative=from||dynamic||sideEffect,target=new URL(relative,url).href;
    if(!target.startsWith(origin))throw Error('External module');
    pending.push(target);return match.replace(relative,target);
  });
  modules.set(url,'data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const map='<script type="importmap">'+JSON.stringify({imports:Object.fromEntries(modules)})+'</script>';
let output=html.replace(/<link[^>]+rel="icon"[^>]*>/g,'');
for(const match of [...output.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)]){
  const css=await readFile(path.join(root,match[1].split('?')[0]),'utf8');
  output=output.replace(match[0],'<style>'+css+'</style>');
}
output=output.replace(/<script type="module" src="[^"]+"><\/script>/,map+'<script type="module">import '+JSON.stringify(entry)+';</script>');
if(!process.argv[2])throw Error('Provide an output HTML path');
await writeFile(process.argv[2],output);
console.log(`Snapshotted ${modules.size} local modules; ${Buffer.byteLength(output)} bytes`);

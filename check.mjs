import {readdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
async function walk(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()&&!['.git','artifacts','node_modules'].includes(e.name)?walk(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
const files=(await readdir('.')).filter(f=>/\.(html|css|js|svg)$/.test(f)&&!f.endsWith('.test.js'));let bytes=0;
for(const file of files){const text=await readFile(file);bytes+=text.length;if(file.endsWith('.js')){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status){console.error(result.stderr);process.exit(1);}for(const [,relative]of text.toString().matchAll(/(?:from\s*|import\s*\()['"]([^'"]+)['"]/g)){if(relative.startsWith('.'))await readFile(path.resolve(path.dirname(file),relative));}}}
console.log(`Checked ${files.length} static files; ${Math.round(bytes/1024)} KB total; all JS syntax and module paths valid.`);

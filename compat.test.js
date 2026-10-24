import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('./compat.js',import.meta.url),'utf8');
function context(legacy=true){
  const sandbox=vm.createContext({});
  if(legacy)vm.runInContext('delete Object.hasOwn; delete Array.prototype.at; delete Array.prototype.findLastIndex; delete String.prototype.replaceAll;',sandbox);
  vm.runInContext(source,sandbox);
  return expression=>vm.runInContext(expression,sandbox);
}
test('compatibility shims preserve native functions and are non-enumerable and repeatable',()=>{
  const native=vm.createContext({});
  vm.runInContext('globalThis.original=[Object.hasOwn,Array.prototype.at,Array.prototype.findLastIndex,String.prototype.replaceAll]',native);
  vm.runInContext(source,native);vm.runInContext(source,native);
  assert.equal(vm.runInContext('original.every((fn,i)=>fn===[Object.hasOwn,Array.prototype.at,Array.prototype.findLastIndex,String.prototype.replaceAll][i])',native),true);
  const run=context();
  assert.equal(run('Object.getOwnPropertyDescriptor(Array.prototype,"at").enumerable'),false);
  assert.equal(run('Object.hasOwn(Object.create({inherited:1}),"inherited")'),false);
  assert.equal(run('Object.hasOwn({hasOwnProperty:null,x:1},"x")'),true);
  assert.throws(()=>run('Object.hasOwn(null,"x")'));
});
test('legacy at and findLastIndex preserve indexes, sparse arrays and callback receivers',()=>{
  const run=context();
  for(const [expression,expected] of [
    ['[10,20,30].at(-1)',30],['[10,20,30].at(-1.8)',30],['[10,20,30].at(1.8)',20],
    ['[10,20,30].at(Infinity)',undefined],['[10,20,30].at(-Infinity)',undefined],
    ['Array.prototype.at.call({0:"a",length:1},0)','a'],
    ['[,7,,].findLastIndex(v=>v===undefined)',2],['[1,2,3].findLastIndex(v=>v===9)',-1],
    ['[1,2,3].findLastIndex(function(v){return v===this.n},{n:2})',1],
  ])assert.equal(run(expression),expected,expression);
  assert.throws(()=>run('Array.prototype.at.call(null,0)'));
  assert.throws(()=>run('[1].findLastIndex(null)'));
});
test('legacy replaceAll handles literal punctuation, empty patterns, regex and replacement tokens',()=>{
  const run=context();
  for(const [expression,expected] of [
    ['"a.b.a".replaceAll(".","-")','a-b-a'],['"ab".replaceAll("","_")','_a_b_'],
    ['"a-a".replaceAll("a","$&$&")','aa-aa'],['"a-a".replaceAll("a",(s,i)=>i)', '0-2'],
    ['"aba".replaceAll(/a/g,"x")','xbx'],['"aba".replaceAll({[Symbol.replace](s){return s+"!"}},"x")','aba!'],
  ])assert.equal(run(expression),expected,expression);
  assert.throws(()=>run('"aba".replaceAll(/a/,"x")'));
});
test('legacy roundRect preserves paths, scales corners and rejects invalid radii',()=>{
  const sandbox=vm.createContext({});
  vm.runInContext('class CanvasRenderingContext2D { constructor(){this.calls=[];} moveTo(...v){this.calls.push(["move",...v]);} lineTo(...v){this.calls.push(["line",...v]);} ellipse(...v){this.calls.push(["ellipse",...v]);} closePath(){this.calls.push(["close"]);} } globalThis.c=new CanvasRenderingContext2D()',sandbox);
  vm.runInContext(source,sandbox);
  const run=expression=>vm.runInContext(expression,sandbox);
  run('c.roundRect(0,0,10,20,20)');
  assert.equal(run('c.calls.filter(x=>x[0]==="ellipse").length'),4);
  assert.equal(run('c.calls.find(x=>x[0]==="ellipse")[3]'),5);
  run('c.calls=[];c.roundRect(5,5,20,30,[4,6,0,0])');
  assert.equal(run('c.calls.filter(x=>x[0]==="ellipse").length'),2);
  run('c.calls=[];c.roundRect(0,0,10,10,{x:NaN,y:1})');assert.equal(run('c.calls.length'),0);
  assert.throws(()=>run('c.roundRect(0,0,10,10,-1)'));
  assert.throws(()=>run('c.roundRect(0,0,10,10,[])'));
});

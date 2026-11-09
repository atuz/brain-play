import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from './domino-engine.js';
import {levels} from './domino-levels.js';
import {dominoTiming} from './domino-timing.js';
import {ceilingContactAngle} from './domino-ascender-contact.js';
const ms=f=>f.time*dominoTiming.beat;
const first=(sim,id,state)=>sim.trace.find(f=>f.pieces.find(p=>p.id===id).state===state);

for(const dir of [-1,1])test(`Delay waits 1105ms then tips for 275ms before contact, direction ${dir}`,()=>{
  const level={width:10,height:8,rules:'dos',platforms:[[5,0,9]],ladders:[]};
  const sim=simulate(level,[{id:'a',type:'normal',x:5-dir,y:5},{id:'d',type:'delay',x:5,y:5},{id:'b',type:'normal',x:5+dir,y:5}],'a',dir,{},dominoTiming);
  const hit=first(sim,'d','waiting'),start=first(sim,'d','falling'),next=first(sim,'b','falling');
  assert.equal(ms(hit),275,'ordinary contact stays unchanged');
  assert.equal(ms(start)-ms(hit),1105);
  assert.equal(ms(next)-ms(start),275);
  assert.equal(ms(next)-ms(hit),1380);
});

for(const dir of [-1,1])for(const type of ['normal','trigger'])test(`Ascender contacts ${type} before horizontal without reversing, direction ${dir}`,()=>{
  const level={width:10,height:9,rules:'dos',platforms:[[2,0,9],[4,0,9],[6,5+dir,5+dir],[7,0,9]],ladders:[]};
  const pieces=[{id:'a',type:'ascender',x:5,y:7},{id:'b',type,x:5+dir,y:6}];
  const sim=simulate(level,pieces,'a',dir,{},dominoTiming);
  const ceiling=first(sim,'a','ceiling'),hit=first(sim,'b','falling');
  const atTop=ceiling.pieces.find(p=>p.id==='a');
  const angle=ceilingContactAngle(level,atTop,pieces[1],dir);
  assert.ok(angle>0&&angle<90);
  assert.ok(Math.abs(ms(hit)-ms(ceiling)-550*angle/90)<1e-5);
  assert.ok(ms(hit)<ms(ceiling)+550);
  assert.ok(sim.trace.every(f=>{const p=f.pieces.find(p=>p.id==='a');return p.dir===dir&&!['ceiling-return','ceiling-reversing'].includes(p.state);}));
});

test('Level 64 gate falls at contact while the ascender continues the same swing',()=>{
  const level=levels[63],pieces=level.pieces.filter(p=>!['p0','p1'].includes(p.id)).map(p=>p.id==='p3'?{...p,x:6,y:7}:p);
  const sim=simulate(level,pieces,'p6',-1,{},dominoTiming);
  const ceiling=first(sim,'p4','ceiling'),gate=first(sim,'p2','falling');
  assert.ok(ms(gate)-ms(ceiling)<550);
  assert.equal(gate.pieces.find(p=>p.id==='p4').dir,-1);
  const top=ceiling.pieces.find(p=>p.id==='p4');
  assert.ok(Math.abs(ms(gate)-ms(ceiling)-550*ceilingContactAngle(level,top,pieces.find(p=>p.id==='p2'),-1)/90)<1e-5);
});

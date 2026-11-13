import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from './domino-engine.js';
import {levels} from './domino-levels.js';
import {dominoTiming,dosFrameTiming} from './domino-timing.js';
import {dominoContactPhase} from './domino-contact-motion.js';

for(const dir of [-1,1])test(`A landing tile checks the opened floor when becoming flat, direction ${dir}`,()=>{
  const level={width:13,height:10,rules:'dos',platforms:[[2,6-dir,6-dir],[4,0,12],[6,0,12]],ladders:[]};
  const pieces=[{id:'a',type:'normal',x:6-dir,y:2},{id:'bomb',type:'exploder',x:6+dir,y:4},
    {id:'gate',type:'trigger',x:6+2*dir,y:6}];
  const sim=simulate(level,pieces,'a',dir,{},dominoTiming);
  const blast=sim.trace.find(f=>f.effects.some(e=>e.kind==='explode'));
  const source=blast.pieces.find(p=>p.id==='a');
  assert.equal(source.state,'dropping');
  assert.equal(source.finish,null);
  assert.deepEqual([source.dropX,source.dropY],[6+dir,6]);
  assert.equal(sim.reason,'clear');
});

for(const dir of [-1,1])for(const type of ['normal','tumbler'])test(`${type} explodes a contacted bomb immediately and falls through, direction ${dir}`,()=>{
  const level={width:11,height:12,rules:'dos',platforms:[[3,1,9],[7,0,10]],ladders:[]};
  const pieces=[{id:'a',type,x:5-dir,y:3},{id:'bomb',type:'exploder',x:5,y:3}];
  const sim=simulate(level,pieces,'a',dir,{},dominoTiming);
  const blast=sim.trace.find(f=>f.effects.some(e=>e.kind==='explode'));
  assert.ok(blast);
  const contactMs=type==='normal'?dominoTiming.contact:dominoContactPhase*dominoTiming.quarter;
  assert.ok(Math.abs(blast.time*200-contactMs)<1e-6,'explode on the contact beat');
  assert.equal(blast.pieces.find(p=>p.id==='bomb').state,'vanished');
  assert.deepEqual(blast.holes,[{x:5,y:3}]);
  const source=blast.pieces.find(p=>p.id==='a');
  assert.equal(source.state,'dropping');assert.equal(source.dropX,5);assert.equal(source.dropY,7);
  const land=sim.trace.find(f=>f.time>blast.time&&f.pieces.find(p=>p.id==='a').y===7);
  assert.ok(land);
  assert.ok(sim.trace.filter(f=>f.time>blast.time&&f.time<land.time).every(f=>f.pieces.find(p=>p.id==='a').state==='dropping'),'old roll events cannot carry it past the hole');
  assert.equal(sim.trace.filter(f=>f.effects.some(e=>e.kind==='explode')).length,1);
});

test('A domino landing on an exploder opens the floor immediately instead of crashing',()=>{
  const level={width:9,height:11,rules:'dos',platforms:[[1,3,3],[4,4,4],[8,0,8]],ladders:[]};
  const sim=simulate(level,[{id:'a',type:'normal',x:3,y:1},{id:'bomb',type:'exploder',x:4,y:4}],'a',1,{},dominoTiming);
  const blast=sim.trace.find(f=>f.effects.some(e=>e.kind==='explode'));
  assert.ok(blast);assert.equal(blast.crashed,false);
  assert.equal(blast.pieces.find(p=>p.id==='a').dropY,8);
  assert.ok(sim.trace.some(f=>f.pieces.find(p=>p.id==='a').y===8));
});

test('Level 64 tumbler drops through the moved bomb hole without hitting the tile beyond it',()=>{
  const level=levels[63],pieces=level.pieces.map(p=>p.id==='p1'?{...p,x:8,y:5}:p);
  const sim=simulate(level,pieces,'p0',-1,{},dominoTiming);
  const blast=sim.trace.find(f=>f.effects.some(e=>e.sourceId==='p1'&&e.kind==='explode'));
  assert.ok(blast);
  assert.equal(blast.pieces.find(p=>p.id==='p0').state,'dropping');
  assert.equal(blast.pieces.find(p=>p.id==='p0').dropX,8);
  assert.equal(blast.pieces.find(p=>p.id==='p0').dropY,7);
  assert.equal(sim.pieces.find(p=>p.id==='p3').state,'upright','the tumbler must not skip over the hole to the neighbouring normal tile');
});

for(const dir of [-1,1])test(`A tumbler starts the bomb at contact without rolling into its cell, direction ${dir}`,()=>{
  const level={width:11,height:12,rules:'dos',platforms:[[3,1,9],[7,0,10]],ladders:[]};
  const pieces=[{id:'a',type:'tumbler',x:5-dir,y:3},{id:'bomb',type:'exploder',x:5,y:3}];
  const sim=simulate(level,pieces,'a',dir,{},dosFrameTiming);
  const fuse=sim.trace.find(f=>f.pieces.find(p=>p.id==='bomb').state==='exploding');
  assert.ok(fuse,'the fuse starts at contact');
  const roller=fuse.pieces.find(p=>p.id==='a');
  assert.equal(roller.x,5-dir,'the roller is still outside the bomb cell');
  assert.equal(roller.state,'flat');
  assert.ok(Math.abs(fuse.time*dosFrameTiming.beat-dominoContactPhase*dosFrameTiming.quarter)<1e-6);
  const blast=sim.trace.find(f=>f.effects.some(e=>e.kind==='explode'));
  assert.ok(blast.time>fuse.time,'the bomb explodes after its six-frame fuse');
  assert.ok(sim.trace.filter(f=>f.time<=blast.time).every(f=>f.pieces.find(p=>p.id==='a').x===5-dir),'no extra turn into the bomb cell');
  assert.equal(blast.pieces.find(p=>p.id==='a').state,'dropping');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from './domino-engine.js';
import {levels} from './domino-levels.js';

for(const dir of [-1,1])for(const rows of [1,6])test(`Tumbler turns, falls fully, then rolls: ${rows} rows, direction ${dir}`,()=>{
  const level={width:9,height:12,rules:'dos',platforms:[[2,4,4],[2+rows,0,8]],ladders:[]};
  const sim=simulate(level,[{id:'a',type:'tumbler',x:4,y:2}],'a',dir);
  const drop=sim.trace.find(f=>f.pieces[0].state==='dropping');
  const landing=sim.trace.find(f=>f.time>drop.time&&f.pieces[0].state==='rolling');
  assert.equal(landing.time-drop.time,Math.max(2,rows));
  assert.equal(landing.pieces[0].y,2+rows);
  assert.equal(landing.pieces[0].x,4+dir);
  assert.ok(sim.trace.filter(f=>f.time>drop.time&&f.time<landing.time).every(f=>f.pieces[0].state==='dropping'));
  const next=sim.trace.find(f=>f.time>landing.time);
  assert.equal(next.pieces[0].x,4+2*dir);
});

test('Level 50 tumbler lands on the bottom platform before continuing to the trigger',()=>{
  const level=levels[49],pieces=structuredClone(level.pieces);
  pieces.find(p=>p.id==='p2').x=8;
  const sim=simulate(level,pieces,'p2',1);
  const drop=sim.trace.find(f=>f.pieces.find(p=>p.id==='p2').state==='dropping');
  const land=sim.trace.find(f=>f.time>drop.time&&f.pieces.find(p=>p.id==='p2').state==='rolling');
  assert.equal(land.time-drop.time,6);
  assert.deepEqual([land.pieces.find(p=>p.id==='p2').x,land.pieces.find(p=>p.id==='p2').y],[11,11]);
  assert.notEqual(sim.pieces.find(p=>p.id==='p3').state,'upright');
});

for(const dir of [-1,1])for(const type of ['normal','trigger','tumbler','splitter'])test(`Tumbler stops after contact with ${type}, direction ${dir}`,()=>{
  const level={width:13,height:10,rules:'dos',platforms:[[5,0,12]],ladders:[]};
  const pieces=[{id:'a',type:'tumbler',x:6-dir,y:5},{id:'b',type,x:6,y:5}];
  const sim=simulate(level,pieces,'a',dir);
  const stopped=sim.trace.find(f=>f.pieces.find(p=>p.id==='a').state==='flat');
  assert.ok(stopped);
  assert.equal(stopped.pieces.find(p=>p.id==='a').x,6-dir);
  // A roller waiting behind another roller follows it once that cell is free.
  if(type==='tumbler')assert.ok(sim.trace.some(f=>f.time>stopped.time&&f.pieces.find(p=>p.id==='a').state==='rolling'),'follows the vacated cell');
  else assert.ok(sim.trace.filter(f=>f.time>=stopped.time).every(f=>f.pieces.find(p=>p.id==='a').state==='flat'));
  assert.equal(stopped.pieces.find(p=>p.id==='b').state,type==='splitter'?'upright':type==='delay'?'waiting':type==='ascender'?'ascending':type==='tumbler'?'rolling':'falling');
});

for(const dir of [-1,1])for(const type of ['vanish','ascender'])test(`Tumbler continues through ${type}, direction ${dir}`,()=>{
  const level={width:13,height:10,rules:'dos',platforms:[[5,0,12]],ladders:[]};
  const sim=simulate(level,[{id:'a',type:'tumbler',x:6-dir,y:5},{id:'b',type,x:6,y:5}],'a',dir);
  assert.ok(sim.trace.some(f=>{const p=f.pieces.find(p=>p.id==='a');return p.x===6+dir&&p.state==='rolling';}));
});

for(const dir of [-1,1])test(`A bridge on solid ground topples like a normal tile, direction ${dir}`,()=>{
  const level={width:13,height:10,rules:'dos',platforms:[[5,0,12]],ladders:[]};
  const sim=simulate(level,[{id:'a',type:'tumbler',x:6-dir,y:5},{id:'b',type:'bridge',x:6,y:5}],'a',dir);
  const roller=sim.trace.find(f=>f.pieces.find(p=>p.id==='a').state==='flat');
  assert.ok(roller);
  assert.equal(roller.pieces.find(p=>p.id==='a').x,6-dir,'the roller stops instead of passing through');
  assert.equal(sim.bridges.length,0,'no bridge is built without a gap');
  const bridgeStates=new Set(sim.trace.map(f=>f.pieces.find(p=>p.id==='b').state));
  assert.ok(bridgeStates.has('falling'),'the bridge topples like an ordinary domino');
  assert.ok(!bridgeStates.has('crashed'),'the bridge does not crash together with the roller');
});

for(const dir of [-1,1])test(`A bridge over a one-cell gap still lets the tumbler through, direction ${dir}`,()=>{
  // The gap sits in the bridge's falling direction.
  const near=dir===1?6:4,far=dir===1?8:6;
  const level={width:13,height:10,rules:'dos',platforms:[[5,0,near],[5,far,12]],ladders:[]};
  const sim=simulate(level,[{id:'a',type:'tumbler',x:6-dir,y:5},{id:'b',type:'bridge',x:6,y:5}],'a',dir);
  assert.deepEqual(sim.bridges.map(b=>[b.x,b.y]),[[6+dir,5]],'the bridge spans the gap');
  assert.equal(sim.pieces.find(p=>p.id==='b').state,'vanished');
  assert.ok(sim.trace.some(f=>{const p=f.pieces.find(p=>p.id==='a');return p.x===6+dir&&p.state==='rolling';}));
});

for(const dir of [-1,1])test(`Stopper reverses the tumbler instead of stopping it, direction ${dir}`,()=>{
  const level={width:13,height:10,rules:'dos',platforms:[[5,0,12]],ladders:[]};
  const sim=simulate(level,[{id:'a',type:'tumbler',x:6-dir,y:5},{id:'b',type:'stopper',x:6,y:5}],'a',dir);
  const bounced=sim.trace.find(f=>f.effects.some(e=>e.kind==='rebound'));
  assert.ok(bounced);
  assert.equal(bounced.pieces.find(p=>p.id==='a').dir,-dir);
  assert.equal(bounced.pieces.find(p=>p.id==='a').state,'rolling');
  assert.ok(sim.trace.some(f=>f.pieces.find(p=>p.id==='a').x===6-2*dir));
});

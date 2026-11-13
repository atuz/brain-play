import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from './domino-engine.js';
import {levels} from './domino-levels.js';
import {dominoContactPhase} from './domino-contact-motion.js';
import {dosFrameTiming} from './domino-timing.js';

test('Level 49 retains airborne landing, then transmits the reverse chain and reaches the splitter',()=>{
  const level=levels[48],pieces=structuredClone(level.pieces);
  pieces[0].x=16;pieces[1].x=13;
  const sim=simulate(level,pieces,'p0',1);
  const poses=sim.trace.map(f=>({time:f.time,piece:f.pieces.find(p=>p.id==='p0')}));
  const land=poses.find(f=>f.piece.state==='landing');
  const rebound=poses.find(f=>f.piece.state==='returning');
  assert.equal(land.piece.inverted,undefined);
  assert.deepEqual({x:land.piece.x,y:land.piece.y},{x:17,y:7});
  const drop=poses.find(f=>f.piece.state==='dropping');
  assert.equal(land.time-drop.time,3,'all three rows must be traversed before landing');
  assert.equal(land.piece.landingAngle,undefined);
  assert.equal(land.piece.landingTravel,undefined);
  assert.equal(land.piece.finish,land.time);
  assert.equal(rebound.time-land.time,1);
  assert.ok(poses.filter(f=>f.time>=land.time).every(f=>!f.piece.inverted));
  assert.ok(sim.trace.some(f=>f.effects.some(e=>e.kind==='explode')));
  assert.ok(sim.trace.some(f=>f.impacts.some(e=>e.kind==='splitter-hit'&&e.sourceId==='p3')));
  assert.equal(sim.pieces.find(p=>p.id==='p3').state,'vanished');
  assert.notEqual(sim.reason,'crash');
});

for(const dir of [-1,1])test(`Two ordinary landings retain v145 event timing, direction ${dir}`,()=>{
  const x=dir===1?1:5;
  const level={width:8,height:8,rules:'dos',ladders:[],platforms:[[1,x,x],[3,x+dir,x+dir],[5,x+2*dir,x+2*dir]]};
  const sim=simulate(level,[{id:'a',type:'normal',x,y:1}],'a',dir);
  const lands=sim.trace.filter(f=>f.pieces[0].state==='landing');
  assert.equal(lands.length,2);
  assert.deepEqual(lands.map(f=>f.pieces[0].inverted),[undefined,undefined]);
  for(const land of lands){
    assert.equal(land.pieces[0].landingTravel,undefined);
    assert.equal(land.pieces[0].landingAngle,undefined);
    const next=sim.trace.find(f=>f.time>land.time&&f.pieces[0].state!=='landing');
    assert.equal(next.time-land.time,1);
  }
  // The last pedestal is one cell wide: the tile tips into the void below
  // and leaves the board instead of hanging in the air.
  assert.equal(sim.pieces[0].state,'vanished');
});


test('Level 49 starts the next tile at reverse contact, before the source is flat',()=>{
  const level=levels[48],pieces=structuredClone(level.pieces);
  pieces[0].x=16;pieces[1].x=13;
  const sim=simulate(level,pieces,'p0',1);
  const turn=sim.trace.find(f=>f.pieces.find(p=>p.id==='p0').state==='reversing');
  const hit=sim.trace.find(f=>f.pieces.find(p=>p.id==='p3').state==='falling');
  const rest=sim.trace.find(f=>f.pieces.find(p=>p.id==='p0').state==='flat'&&f.time>turn.time);
  assert.ok(Math.abs(hit.time-turn.time-dominoContactPhase*2)<1e-6);
  assert.equal(hit.pieces.find(p=>p.id==='p0').state,'reversing');
  assert.equal(rest.time-turn.time,2);
});

for(const type of ['normal','delay','splitter'])test(`Reverse contact uses ordinary collision rules for ${type}`,()=>{
  const level={width:9,height:8,rules:'dos',platforms:[[5,0,8]],ladders:[]};
  const source={id:'a',type:'normal',x:4,y:5};
  const target={id:'b',type,x:3,y:5};
  const forward=simulate(level,[source,target],'a',-1);
  const reverse=simulate(level,[source,target,{id:'s',type:'stopper',x:5,y:5}],'a',1);
  assert.equal(reverse.crashed,forward.crashed);
  assert.equal(reverse.pieces.find(p=>p.id==='b').state,forward.pieces.find(p=>p.id==='b').state);
  assert.equal(reverse.pieces.find(p=>p.id==='b').dir,forward.pieces.find(p=>p.id==='b').dir);
});

test('Reverse contact at an edge starts an ordinary drop without a stale rest interrupting it',()=>{
  const level={width:9,height:10,rules:'dos',platforms:[[3,4,5],[7,0,8]],ladders:[]};
  const sim=simulate(level,[{id:'a',type:'normal',x:4,y:3},{id:'s',type:'stopper',x:5,y:3}],'a',1);
  const drop=sim.trace.find(f=>f.pieces[0].state==='dropping');
  assert.ok(drop);
  assert.equal(sim.trace.find(f=>f.time===drop.time+1).pieces[0].state,'dropping');
  const land=sim.trace.find(f=>f.pieces[0].state==='landing');
  assert.equal(land.time-drop.time,4);
  assert.equal(land.pieces[0].y,7);
});

test('A tile falling onto a splitter vanishes when its bottom touches the splitter top',()=>{
  const level={width:9,height:10,rules:'dos',ladders:[],platforms:[[2,0,2],[4,0,8]]};
  const pieces=[{id:'a',type:'normal',x:2,y:2},{id:'s',type:'splitter',x:3,y:4}];
  const sim=simulate(level,pieces,'a',1,{},dosFrameTiming);
  const drop=sim.trace.find(f=>f.pieces.find(p=>p.id==='a').state==='dropping');
  const vanish=sim.trace.find(f=>f.pieces.find(p=>p.id==='a').state==='vanished');
  const split=sim.trace.find(f=>f.pieces.find(p=>p.id==='s').state==='falling');
  assert.ok(drop&&vanish&&split);
  assert.equal(vanish.time,split.time,'the split starts at the touch, not later');
  assert.equal(vanish.pieces.find(p=>p.id==='a').y,3,'the upper tile is one row above the splitter');
  const ms=(vanish.time-drop.time)*dosFrameTiming.beat;
  assert.ok(Math.abs(ms-3*dosFrameTiming.frame)<1e-6,'the touch happens halfway down a five-frame two-row drop');
  assert.ok(!sim.trace.some(f=>f.pieces.find(p=>p.id==='a').state==='impact'),'the upper tile is consumed at once');
});

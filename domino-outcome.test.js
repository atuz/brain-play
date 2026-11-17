import test from 'node:test';
import assert from 'node:assert/strict';
import {dominoOutcome,recordDominoCompletion,dominoSessionOutcome,dominoSessionPieces} from './domino-outcome.js';
import {createChain,simulate} from './domino-engine.js';
import {restore} from './domino.js';
import {levels} from './domino-levels.js';

const expected=[{id:'a',type:'normal'},{id:'v',type:'vanish'},{id:'t',type:'trigger'},{id:'s',type:'stopper'}];
const complete=()=>expected.map((p,i)=>({...p,state:p.type==='stopper'?'upright':p.type==='vanish'?'vanished':'flat',finish:p.type==='stopper'?null:i+1}));

test('A fallen domino on the exit allows completion in simulation and live play',()=>{
  const pieces=[{id:'source',type:'normal',x:4,y:5},{id:'trigger',type:'trigger',x:5,y:5}];
  for(const exit of [{x:4,y:5},{x:5,y:5}]){
    const level={width:9,height:7,rules:'dos',platforms:[[5,0,8]],ladders:[],pieces,exit};
    const sim=simulate(level,pieces,'source',1);
    assert.equal(sim.reason,'clear');
    const state={position:{pieces:[],carrying:null},completion:{time:sim.trace.at(-1).time,pieces:sim.pieces}};
    assert.deepEqual(dominoSessionOutcome(level,state),{won:true,reason:'clear',problemIds:[]});
  }
  const sim=simulate({width:9,height:7,rules:'dos',platforms:[[5,0,8]],ladders:[],pieces,exit:{x:6,y:5}},pieces,'source',1);
  assert.equal(sim.won,true);
  const vanished=[{id:'v',type:'vanish',x:4,y:5,state:'vanished',finish:1},{id:'t',type:'trigger',x:7,y:5,state:'flat',dir:1,finish:2}];
  assert.equal(dominoOutcome({pieces:vanished,exit:{x:4,y:5}}).won,true);
  assert.equal(dominoOutcome({pieces:vanished,exit:{x:7,y:4}}).won,true);
});

test('The trigger may tie the last domino, but not fall while the chain is still running',()=>{
  assert.equal(dominoOutcome({pieces:complete(),expectedPieces:expected}).won,true);
  const tied=complete();tied.find(p=>p.id==='t').finish=2;
  assert.equal(dominoOutcome({pieces:tied,expectedPieces:expected}).won,true);
  const early=complete();early.find(p=>p.id==='t').finish=0.5;
  assert.equal(dominoOutcome({pieces:early,expectedPieces:expected}).reason,'early');
});

test('Held pieces, missing pieces, a dead ant and a broken domino cannot pass',()=>{
  for(const id of ['a','s']){
    const pieces=complete().filter(p=>p.id!==id),carrying=expected.find(p=>p.id===id);
    assert.equal(dominoOutcome({pieces,expectedPieces:expected,carrying}).reason,'carrying');
  }
  assert.equal(dominoOutcome({pieces:complete().filter(p=>p.id!=='v'),expectedPieces:expected}).reason,'remaining');
  assert.equal(dominoOutcome({pieces:complete(),expectedPieces:expected,dead:true}).reason,'dead');
  const broken=complete();broken[0].state='crashed';
  assert.equal(dominoOutcome({pieces:broken,expectedPieces:expected}).reason,'crash');
});

test('Successive live chains retain vanished pieces and cannot erase an early trigger',()=>{
  const level={pieces:expected},state={position:{pieces:[],carrying:null},completion:null};
  state.completion=recordDominoCompletion(state,{time:5,pieces:complete().filter(p=>p.id!=='a'),crashed:false,overflow:false});
  state.completion=recordDominoCompletion(state,{time:2,pieces:[{...expected[0],state:'flat',finish:2}],crashed:false,overflow:false});
  assert.equal(state.completion.time,7);
  assert.equal(state.completion.pieces.find(p=>p.id==='a').finish,7);
  assert.equal(dominoSessionOutcome(level,state).reason,'early');
  assert.ok(state.completion.pieces.some(p=>p.id==='v'&&p.state==='vanished'));
});

test('A held stopper stays held after chain recording; putting it down can unlock a valid door',()=>{
  const level={pieces:expected},stopper={...expected[3],x:1,y:5};
  const state={position:{pieces:[],carrying:stopper},completion:null};
  state.completion=recordDominoCompletion(state,{time:5,pieces:complete().filter(p=>p.id!=='s'),crashed:false,overflow:false});
  assert.deepEqual(state.position.carrying,stopper);
  assert.equal(dominoSessionOutcome(level,state).reason,'carrying');
  state.position={pieces:[stopper],carrying:null};
  assert.equal(dominoSessionOutcome(level,state).won,true);
  assert.ok(dominoSessionPieces(state).some(p=>p.id==='s'),'the placed stopper remains visible');
});

test('Restoring a DOS exit rechecks ordering, carrying and death instead of trusting the phase',()=>{
  const level=levels[40],pieces=level.pieces.map((p,i)=>({...p,state:p.type==='stopper'?'upright':'flat',finish:p.type==='trigger'?100:i+1}));
  const saved={version:1,level:40,position:{player:{...level.player},pieces:level.pieces.filter(p=>p.type==='stopper'),carrying:null,moves:1},history:[],attempt:null,phase:'exit',death:false,walker:null,postHistory:[],fallen:pieces.filter(p=>p.type!=='stopper'),completion:{time:100,pieces,crashed:false,overflow:false}};
  assert.equal(restore(saved).phase,'exit');
  for(const mutate of [s=>{s.completion.pieces.find(p=>p.type==='trigger').finish=0;},s=>{s.death=true;},s=>{s.completion=null;for(const p of s.fallen)delete p.finish;}]){
    const invalid=structuredClone(saved);mutate(invalid);
    assert.equal(restore(invalid).phase,'arrange');
  }
});

test('The shared live outcome exactly matches simulation for early, simultaneous and final triggers',()=>{
  const cases=[
    {reason:'clear',pieces:[{id:'source',type:'normal',x:4,y:5},{id:'trigger',type:'trigger',x:5,y:5}]},
    {reason:'early',pieces:[{id:'source',type:'trigger',x:4,y:5},{id:'normal',type:'normal',x:5,y:5},{id:'more',type:'normal',x:6,y:5}]},
    {reason:'clear',platforms:[[1,0,2],[5,0,8]],pieces:[{id:'source',type:'normal',x:2,y:1},
      {id:'split',type:'splitter',x:3,y:5},{id:'left',type:'normal',x:2,y:5},{id:'trigger',type:'trigger',x:4,y:5}]},
  ];
  for(const fixture of cases){
    const pieces=fixture.pieces;
    const level={width:9,height:7,rules:'dos',platforms:fixture.platforms||[[5,0,8]],ladders:[],pieces};
    const sim=simulate(level,pieces,'source',1),live=createChain(level,pieces);
    live.activateStone('source',1);while(!live.done())live.tick();
    assert.equal(sim.reason,fixture.reason);
    const state={position:{pieces:[],carrying:null},completion:null};
    state.completion=recordDominoCompletion(state,live.snapshot());
    assert.deepEqual(dominoSessionOutcome(level,state),{won:sim.won,reason:sim.reason,problemIds:sim.problemIds});
  }
});

test('Only a vanished bridge tile may finish after the trigger',()=>{
  const base=[{id:'a',type:'normal',state:'flat',finish:1},{id:'t',type:'trigger',state:'flat',finish:2}];
  const vanished=[...base,{id:'b',type:'bridge',state:'vanished',finish:2.3,hitBy:'t'}];
  const flat=[...base,{id:'b',type:'bridge',state:'flat',finish:3.3,hitBy:'t'}];
  assert.equal(dominoOutcome({pieces:vanished,expectedPieces:vanished}).won,true);
  const lost=dominoOutcome({pieces:flat,expectedPieces:flat});
  assert.equal(lost.won,false);
  assert.equal(lost.reason,'early');
});

test('A riser still hanging at the ceiling does not finish after the trigger',()=>{
  const pieces=[
    {id:'a',type:'normal',state:'flat',finish:90},
    {id:'r',type:'ascender',state:'ceiling',finish:101.837,hitTime:42.39,leftAt:42.39},
    {id:'t',type:'trigger',state:'flat',finish:100.56},
  ];
  assert.equal(dominoOutcome({pieces,expectedPieces:pieces}).won,true);
  const lateRiser=pieces.map(p=>p.id==='r'?{...p,hitTime:102.2,leftAt:102.2}:p);
  const lost=dominoOutcome({pieces:lateRiser,expectedPieces:lateRiser});
  assert.equal(lost.won,false);
  assert.equal(lost.reason,'early');
});

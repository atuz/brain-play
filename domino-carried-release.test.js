import test from 'node:test';
import assert from 'node:assert/strict';
import {createChain,initialPosition} from './domino-engine.js';
import {dominoTiming} from './domino-timing.js';
import {useManualPush,carriedDropTiming} from './domino-actions.js';
import {restore} from './domino.js';
import {levels} from './domino-levels.js';

const level={width:12,height:10,rules:'dos',platforms:[[2,3,4],[5,0,11]],ladders:[]};
const drop={id:'carried',type:'normal',x:4,y:2};
const run=chain=>{while(!chain.done())chain.step();return chain.snapshot();};

test('A released ascender lands upright and only rises after a later push',()=>{
  const chain=createChain(level,[],{},dominoTiming);
  chain.dropCarriedStone({...drop,type:'ascender'},{from:{x:4,y:2},to:{x:5,y:5}});
  const p=run(chain).pieces[0];
  assert.deepEqual([p.state,p.x,p.y,p.carriedDrop],['upright',5,5,false]);
  assert.equal(chain.activateStone(p.id,1),true);
  assert.equal(chain.stones[0].state,'ascending');
});

test('A released ascender uses the shared splitter landing and is consumed',()=>{
  const chain=createChain(level,[{id:'split',type:'splitter',x:5,y:5}],{},dominoTiming);
  chain.dropCarriedStone({...drop,type:'ascender'},{from:{x:4,y:2},to:{x:5,y:5}});
  const snap=run(chain);
  assert.equal(snap.crashed,false);
  assert.equal(snap.pieces.find(p=>p.id==='carried').state,'vanished');
  assert.equal(snap.pieces.find(p=>p.id==='split').state,'flat');
});

test('Released brick lands upright on empty floor without consuming the manual push',()=>{
  const state={pushUsed:false},chain=createChain(level,[],{},dominoTiming);
  assert.equal(chain.dropCarriedStone(drop,{from:{x:4,y:2},to:{x:5,y:5}}),true);
  const snap=run(chain),p=snap.pieces[0];
  assert.equal(p.state,'upright');assert.equal(p.finish,null);assert.equal(p.dir,0);
  assert.deepEqual([p.x,p.y],[5,5]);assert.equal(state.pushUsed,false);
  assert.equal(useManualPush(state,()=>chain.activateStone(p.id,1)),true);
  assert.equal(useManualPush(state,()=>true),false);
});

for(const targetState of ['upright','flat'])test(`Landing on an ordinary ${targetState} tile makes a broken pile`,()=>{
  const target={id:'target',type:'normal',x:5,y:5};
  const chain=createChain(level,targetState==='upright'?[target]:[],targetState==='flat'?{settledPieces:[{...target,state:'flat',dir:1,finish:-2}]}:{},dominoTiming);
  chain.dropCarriedStone(drop,{from:{x:4,y:2},to:{x:5,y:5}});
  const snap=run(chain);assert.equal(snap.crashed,true);
  assert.ok(snap.pieces.every(p=>p.state==='crashed'));
  assert.equal(snap.pieces.find(p=>p.id==='carried').crashPile,true);
});

for(const alreadyPushed of [false,true])test(`A released brick splits the target with pushUsed=${alreadyPushed}`,()=>{
  const state={pushUsed:alreadyPushed},chain=createChain(level,[
    {id:'split',type:'splitter',x:5,y:5},{id:'left',type:'normal',x:4,y:5},{id:'right',type:'normal',x:6,y:5},
  ],{},dominoTiming);
  chain.dropCarriedStone(drop,{from:{x:4,y:2},to:{x:5,y:5}});
  const snap=run(chain);
  assert.equal(snap.crashed,false);
  for(const id of ['split','left','right'])assert.equal(snap.pieces.find(p=>p.id===id).state,'flat');
  assert.equal(snap.pieces.find(p=>p.id==='carried').state,'vanished');
  assert.equal(state.pushUsed,alreadyPushed);
});

test('One manual push can be combined with multiple separate carried drops',()=>{
  const state={pushUsed:false},chain=createChain(level,[{id:'manual',type:'normal',x:9,y:5}],{},dominoTiming);
  assert.equal(useManualPush(state,()=>chain.activateStone('manual',1)),true);run(chain);
  for(const [i,x]of [[1,3],[2,5]]){
    assert.equal(chain.dropCarriedStone({...drop,id:`drop-${i}`},{from:{x:x-1,y:2},to:{x,y:5}}),true);
    run(chain);assert.equal(chain.stones.find(p=>p.id===`drop-${i}`).state,'upright');
  }
  assert.equal(useManualPush(state,()=>chain.activateStone('drop-1',1)),false);
});

test('A failed activation does not spend the one push, and the brick lands before the ant starts falling',()=>{
  const state={pushUsed:false};assert.equal(useManualPush(state,()=>false),false);assert.equal(state.pushUsed,false);
  const t=carriedDropTiming(2,dominoTiming);
  assert.deepEqual(t,{brickMs:200,antLeadMs:300,antMs:400});
  assert.ok(t.brickMs<t.antLeadMs);
});

test('Restoring a session preserves the spent manual push',()=>{
  const saved={version:1,level:65,position:initialPosition(levels[65]),history:[],attempt:null,phase:'arrange',pushUsed:true};
  assert.equal(restore(saved).pushUsed,true);
  assert.equal(restore({...saved,pushUsed:false}).pushUsed,false);
});

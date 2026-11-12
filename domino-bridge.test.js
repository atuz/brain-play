import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from './domino-engine.js';

// A bridge can fall off the platform it started on. It lands on the platform
// below, topples on, and must still connect the next one-cell gap there.
for(const dir of [-1,1])test(`A bridge dropped onto a lower platform still spans the next gap, direction ${dir}`,()=>{
  const level=dir===1
    ?{width:14,height:13,rules:'dos',ladders:[],platforms:[[7,0,7],[9,8,8],[9,10,12]]}
    :{width:14,height:13,rules:'dos',ladders:[],platforms:[[7,7,13],[9,6,6],[9,4,4]]};
  const sim=simulate(level,[{id:'b',type:'bridge',x:7,y:7}],'b',dir);
  assert.deepEqual(sim.bridges.map(b=>[b.x,b.y]),[[7+2*dir,9]],'the bridge spans the gap on the lower platform');
  const bridge=sim.pieces.find(p=>p.id==='b');
  assert.equal(bridge.state,'vanished');
  assert.equal(bridge.y,9,'it reaches the lower platform before building');
});

test('A bridge dropped onto solid ground simply lies flat',()=>{
  const level={width:14,height:13,rules:'dos',ladders:[],platforms:[[7,0,7],[9,8,12]]};
  const sim=simulate(level,[{id:'b',type:'bridge',x:7,y:7}],'b',1);
  assert.deepEqual(sim.bridges,[]);
  assert.equal(sim.pieces.find(p=>p.id==='b').state,'flat');
  assert.equal(sim.pieces.find(p=>p.id==='b').y,9);
});

// A bridge knocked into a stopper swings back the other way. The return swing
// must still connect a one-cell gap instead of just lying down or dropping.
for(const dir of [-1,1])test(`A rebounding bridge spans the gap behind it, direction ${dir}`,()=>{
  const level=dir===1
    ?{width:8,height:10,rules:'dos',ladders:[],platforms:[[5,0,0],[5,2,5]]}
    :{width:10,height:10,rules:'dos',ladders:[],platforms:[[5,2,5],[5,7,9]]};
  const pieces=dir===1
    ?[{id:'b',type:'bridge',x:2,y:5},{id:'s',type:'stopper',x:3,y:5}]
    :[{id:'b',type:'bridge',x:5,y:5},{id:'s',type:'stopper',x:4,y:5}];
  const sim=simulate(level,pieces,'b',dir);
  assert.deepEqual(sim.bridges.map(b=>[b.x,b.y]),[[dir===1?1:6,5]],'the return swing bridges the gap');
  assert.equal(sim.pieces.find(p=>p.id==='b').state,'vanished');
});

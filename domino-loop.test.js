import test from 'node:test';
import assert from 'node:assert/strict';
import {createChain} from './domino-engine.js';
import {dominoTiming} from './domino-timing.js';
import {levels} from './domino-levels.js';

const level=levels.find(l=>l.name==='地牢 78');

test('live chains keep looping past the simulation step budget',()=>{
  const chain=createChain(level,level.pieces,{},dominoTiming,{maxSteps:Infinity});
  chain.activateStone('p2',1);
  for(let i=0;i<400;i++)chain.step();
  assert.equal(chain.overflow,false);
  assert.equal(chain.done(),false,'a tile bouncing between stoppers is still running');
  const rolling=chain.stones.find(p=>p.id==='p2');
  assert.equal(rolling.state,'rolling');

  // Moving one of the two stoppers away lets the loop finish instead of
  // stalling the whole chain.
  chain.removeStone('p14');
  let steps=0;while(!chain.done()&&steps++<3000)chain.step();
  assert.equal(chain.overflow,false);
  assert.equal(chain.done(),true);
});

test('simulation-style chains still stop at the safety budget',()=>{
  const chain=createChain(level,level.pieces,{},dominoTiming);
  chain.activateStone('p2',1);
  let steps=0;while(!chain.done()&&steps++<1000)chain.step();
  assert.equal(chain.overflow,true);
  assert.ok(steps<=201,'stops right after the step budget');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {antFallTarget} from './domino-ant-gravity.js';
import {createChain} from './domino-engine.js';
import {levels} from './domino-levels.js';
import {dominoTiming} from './domino-timing.js';

const level={width:12,height:13,rules:'dos',platforms:[[5,0,11],[7,0,11],[10,0,11]],ladders:[]};
test('Opening the floor starts a fall immediately, while the domino chain is still active',()=>{
  const pieces=[{id:'roll',type:'tumbler',x:6,y:5},{id:'bomb',type:'exploder',x:5,y:5}];
  const chain=createChain(level,pieces,{},dominoTiming),player={x:5,y:5};
  assert.equal(antFallTarget(level,player,chain.snapshot()),null);
  chain.activateStone('roll',-1);
  while(!chain.holes.length)chain.step();
  assert.equal(chain.done(),false);
  assert.deepEqual(antFallTarget(level,player,chain.snapshot()),{
    from:player,to:{x:5,y:7},rows:2,fatal:false,
  });
});

test('Space 27 uses the same explosion-time support check',()=>{
  const level=levels[66],holes=[{x:6,y:7}],player={x:6,y:7};
  assert.deepEqual(antFallTarget(level,player,{holes}),{from:player,to:{x:6,y:9},rows:2,fatal:false});
  assert.equal(antFallTarget(level,{x:7,y:7},{holes}),null,'an adjacent supported ant stays put');
});

test('A broken support under a gap drops into the hole instead of snapping sideways onto the surviving tile',()=>{
  const player={x:5,y:5,side:1};
  assert.deepEqual(antFallTarget(level,player,{holes:[{x:5,y:5}]}).to,{x:5,y:7});
  assert.deepEqual(antFallTarget(level,player,{holes:[{x:6,y:5}]}).to,{x:6,y:7});
});

test('Gravity skips another hole below, and marks excessive falls fatal',()=>{
  const fall=antFallTarget(level,{x:5,y:5},{holes:[{x:5,y:5},{x:5,y:7}]});
  assert.deepEqual(fall.to,{x:5,y:10});assert.equal(fall.fatal,true);
  assert.equal(antFallTarget(level,{x:5,y:10},{holes:[{x:5,y:10}]}).fatal,true);
});

test('A bridge or ladder supports the ant without creating an extra fall',()=>{
  const gap={...level,platforms:[[7,0,11]]};
  assert.ok(antFallTarget(gap,{x:5,y:5}));
  assert.equal(antFallTarget(gap,{x:5,y:5},{bridges:[{x:5,y:5}]}),null);
  const ladder={...gap,ladders:[{x:5,from:3,to:7}]};
  assert.equal(antFallTarget(ladder,{x:5,y:5}),null);
});

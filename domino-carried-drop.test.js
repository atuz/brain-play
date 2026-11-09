import test from 'node:test';
import assert from 'node:assert/strict';
import {isLedgeDrop,pathTo} from './domino-engine.js';
import {levels} from './domino-levels.js';

test('Short and tall ledge drops release a carried piece, without treating stair descent as a jump',()=>{
  const level={ladders:[],ramps:[]};
  assert.equal(isLedgeDrop(level,{x:4,y:3},{x:5,y:4}),true);
  assert.equal(isLedgeDrop(level,{x:4,y:3},{x:5,y:6}),true);
  assert.equal(isLedgeDrop(level,{x:4,y:3},{x:5,y:3.5}),false);
  assert.equal(isLedgeDrop(level,{x:4,y:3},{x:5,y:3}),false);
  assert.equal(isLedgeDrop(level,{x:4,y:3},{x:5,y:2}),false);
});

test('Connected ladders and integer ramps keep the piece in the ant’s arms',()=>{
  assert.equal(isLedgeDrop({ladders:[{x:4,from:2,to:6}],ramps:[]},{x:4,y:3},{x:4,y:4}),false);
  assert.equal(isLedgeDrop({ladders:[],ramps:[[4,3],[5,4]]},{x:4,y:3},{x:5,y:4}),false);
});

test('DOS level 24 descent keeps carrying on every tread and releases only at a real ledge',()=>{
  const level=levels[63];
  const path=pathTo(level,{x:15,y:2},{x:9,y:5});let from={x:15,y:2};
  for(const to of path){assert.equal(isLedgeDrop(level,from,to),false);from=to;}
  assert.equal(isLedgeDrop(level,{x:7,y:5},{x:6,y:7}),true);
});

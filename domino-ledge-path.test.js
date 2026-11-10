import test from 'node:test';
import assert from 'node:assert/strict';
import {neighbors,antPathTo,isLedgeDrop} from './domino-engine.js';
import {levels} from './domino-levels.js';

test('Electronic 35 cannot drop from the left stopper onto the recessed platform below',()=>{
  const level=levels[74],from={x:5,y:6};
  assert.ok(!neighbors(level,from).some(p=>p.y===8),'the next platform does not extend into the left edge column');
  const path=antPathTo(level,level.player,level.exit);
  assert.ok(path);
  let previous=level.player;
  for(const next of path){
    if(isLedgeDrop(level,previous,next))assert.equal(Math.abs(next.x-previous.x),1);
    previous=next;
  }
});

for(const dir of [-1,1])test(`Ledge descent lands straight below the edge, direction ${dir}`,()=>{
  const level={width:12,height:8,rules:'dos',platforms:[[2,5,5],[4,4,6]],ladders:[]};
  const drops=neighbors(level,{x:5,y:2}).filter(p=>p.y>2);
  assert.ok(drops.some(p=>p.x===5+dir&&p.y===4));
  assert.ok(!drops.some(p=>p.x===5));
  assert.ok(!drops.some(p=>Math.abs(p.x-5)>1));
});

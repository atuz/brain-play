import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from './domino-levels.js';
import {initialPosition,edit,antStepTarget,antNeighbors,antPathTo,pushPieceAt,walkable,validPosition} from './domino-engine.js';
import {nextGuide} from './domino-guide.js';
import {restore} from './domino.js';

const level=levels[0],front={x:2,y:5};
test('Left and right walking stay in front and stop at whole cells',()=>{
  assert.deepEqual(antStepTarget(level,front,'left',1),{x:1,y:5});
  assert.deepEqual(antStepTarget(level,front,'right',1),{x:3,y:5});
  assert.deepEqual(antPathTo(level,{x:1,y:5},{x:4,y:5}),[{x:2,y:5},{x:3,y:5},{x:4,y:5}]);
});

test('Up prefers a ladder over entering the gap beside a domino',()=>{
  const ladder={...level,platforms:[[3,0,8],[5,0,8]],ladders:[{x:2,from:3,to:5}]};
  assert.deepEqual(antStepTarget(ladder,front,'up',1),{x:2,y:4});
});

for(const dir of [-1,1])test(`Up prefers the ascending stair over an available gap, direction=${dir}`,()=>{
  const stairs={width:9,height:8,rules:'dos',platforms:[[5,dir>0?1:3,dir>0?2:4],[4.5,dir>0?3:2,dir>0?3:2]],ladders:[]};
  const p={x:dir>0?2:3,y:5};
  assert.ok(antNeighbors(stairs,p).some(q=>q.side===1));
  assert.deepEqual(antStepTarget(stairs,p,'up',dir),{x:p.x+dir,y:4.5});
});

for(const facing of [-1,1])test(`Up enters the arrival side and down returns to the front, facing=${facing}`,()=>{
  const gap={x:facing>0?1:2,y:5,side:1};
  assert.deepEqual(antStepTarget(level,front,'up',facing),gap);
  assert.deepEqual(antStepTarget(level,gap,'down',facing),front);
  assert.equal(antStepTarget(level,gap,'right',facing),null);
  assert.equal(antStepTarget(level,gap,'left',facing),null);
  assert.equal(pushPieceAt(level.pieces,gap,facing).id,'p0');
  assert.equal(pushPieceAt(level.pieces,front,facing),null);
});

test('Moving between gaps requires returning to the front; no rear walking is legal',()=>{
  const gap={x:2,y:5,side:1},next={x:3,y:5,side:1};
  assert.ok(antNeighbors(level,gap).every(p=>p.side!==1));
  assert.equal(edit(level,{...initialPosition(level),player:gap},{type:'ant-walk',to:next}),null);
  const path=antPathTo(level,gap,next);
  assert.ok(path.slice(0,-1).every(p=>p.side!==1));
});

test('Only the front position allows taking and placing',()=>{
  const initial={...initialPosition(level),player:front};
  const held=edit(level,initial,{type:'take'});assert.equal(held.carrying.id,'p0');
  const gap={x:1,y:5,side:1};
  assert.equal(edit(level,{...initial,player:gap},{type:'take'}),null);
  assert.equal(edit(level,{...held,player:gap},{type:'place'}),null);
  assert.ok(edit(level,held,{type:'place'}));
});

test('Gap positions require support, allow board-edge pushing, and do not cross a hole',()=>{
  const gap={x:1,y:5,side:1};
  assert.ok(walkable(level,gap));
  assert.equal(walkable(level,gap,[],[{x:2,y:5}]),false);
  assert.ok(walkable(level,{x:8,y:5,side:1}));
  assert.ok(walkable(level,{x:-1,y:5,side:1}));
  assert.equal(walkable(level,{x:9,y:5,side:1}),false);
  assert.equal(walkable(level,{x:2,y:5,side:2}),false);
});

test('The first domino at a board boundary remains pushable from the arrival side',()=>{
  const level=levels[3],front={x:0,y:1},gap=antStepTarget(level,front,'up',1);
  assert.deepEqual(gap,{x:-1,y:1,side:1});
  assert.ok(pushPieceAt(level.pieces,gap,1));
});

test('Saving and restoring retains the gap lane and incoming direction',()=>{
  const position={...initialPosition(level),player:{x:2,y:5,side:1}};
  assert.ok(validPosition(level,position));
  const saved={version:1,level:0,position,history:[],attempt:null,phase:'arrange',facing:-1};
  const loaded=restore(saved);assert.deepEqual(loaded.position.player,position.player);assert.equal(loaded.facing,-1);
});

test('The guide routes to the pushing gap rather than the carrying position',()=>{
  const position=initialPosition(level),guide=nextGuide(level,position);
  assert.equal(guide.kind,'walk-push');assert.deepEqual(guide.target,{x:1,y:5,side:1});
  assert.equal(nextGuide(level,{...position,player:guide.target}).kind,'push');
});

for(const facing of [-1,1])test(`Each push targets only its own adjacent side, facing=${facing}`,()=>{
  const player={x:3,y:5,side:1,facing};
  const left={id:'left',type:'normal',x:3,y:5,state:'upright'},right={id:'right',type:'trigger',x:4,y:5,state:'upright'};
  for(const pieces of [[],[left],[right],[left,right]]){
    assert.equal(pushPieceAt(pieces,player,-1)?.id,pieces.some(p=>p.id==='left')?'left':undefined);
    assert.equal(pushPieceAt(pieces,player,1)?.id,pieces.some(p=>p.id==='right')?'right':undefined);
  }
  for(const unavailable of [{...left,state:'falling'},{...left,state:'flat'},{...left,y:4},
    {...left,x:2},{...left,type:'stopper'},{...left,type:'splitter'}]){
    assert.equal(pushPieceAt([unavailable,right],player,-1),null);
    assert.equal(pushPieceAt([unavailable,right],player,1).id,'right');
  }
  assert.equal(pushPieceAt([left,right],player,0),null);
});

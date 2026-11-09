import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from './domino-levels.js';
import {neighbors,pathTo} from './domino-engine.js';

const level=levels[62];
test('Level 63 descends every tread, then uses the ladder instead of dropping through stairs',()=>{
  const path=pathTo(level,{x:5,y:3},{x:6,y:10});
  assert.ok(path);
  assert.deepEqual(path.slice(0,13),[
    {x:6,y:3},{x:7,y:3.5},{x:8,y:4},{x:9,y:4.5},{x:10,y:5},
    {x:11,y:5.5},{x:12,y:6},{x:13,y:6.5},{x:14,y:7},
    {x:15,y:7.5},{x:16,y:8},{x:16,y:9},{x:16,y:10},
  ]);
});

test('Every interior stair tread connects only to adjacent treads, in both directions',()=>{
  for(let x=7;x<=15;x++){
    const p={x,y:3+(x-6)*.5};
    assert.deepEqual(neighbors(level,p).sort((a,b)=>a.x-b.x),[
      {x:x-1,y:p.y-.5},{x:x+1,y:p.y+.5},
    ]);
  }
});

test('A real ledge and a missing tread still permit a drop',()=>{
  const ledge={width:9,height:8,rules:'dos',ladders:[],platforms:[[2,0,1],[5,0,8]]};
  assert.ok(neighbors(ledge,{x:1,y:2}).some(p=>p.x===2&&p.y===5));
  const broken={...level,platforms:level.platforms.filter(([y])=>y!==5.5)};
  assert.ok(neighbors(broken,{x:10,y:5}).some(p=>p.y===10));
  assert.ok(neighbors(level,{x:10,y:5},[],[{x:11,y:5.5}]).some(p=>p.y===10));
});

test('Integer ramp connections also take precedence over a ledge drop',()=>{
  const ramp={width:8,height:8,rules:'dos',ladders:[],ramps:[[2,2],[3,3]],platforms:[[2,1,2],[3,3,4],[5,0,7]]};
  const out=neighbors(ramp,{x:2,y:2});
  assert.ok(out.some(p=>p.x===3&&p.y===3));
  assert.ok(!out.some(p=>p.x>=2&&p.y===5));
});

test('Level 64 follows every DOS half-row tread downhill and uphill',()=>{
  const level=levels[63];
  const descent=[{x:15,y:2},{x:14,y:2.5},{x:13,y:3},{x:12,y:3.5},{x:11,y:4},{x:10,y:4.5},{x:9,y:5}];
  assert.deepEqual(pathTo(level,descent[0],descent.at(-1)),descent.slice(1));
  assert.deepEqual(pathTo(level,descent.at(-1),descent[0]),descent.slice(0,-1).reverse());
  for(const p of descent.slice(1,-1)){
    const i=descent.indexOf(p),out=neighbors(level,p);
    assert.deepEqual(out.sort((a,b)=>a.x-b.x),[descent[i+1],descent[i-1]].sort((a,b)=>a.x-b.x));
  }
});


test('Level 64 preserves the flat approach beside the bomb before the first step',()=>{
  const level=levels[63];
  assert.deepEqual(pathTo(level,{x:7,y:5},{x:10,y:4.5}),[{x:8,y:5},{x:9,y:5},{x:10,y:4.5}]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from './domino-levels.js';
import {hasFloor,neighbors,pathTo,edit,initialPosition} from './domino-engine.js';
import {spawnSync} from 'node:child_process';

test('All open gaps use terrain support, independent of ladder presence or level number',()=>{
  for(const ladders of [[],[{x:2,from:0,to:4}]]){
    const level={width:5,height:6,rules:'dos',ladders,platforms:[[2,0,1],[2,3,4],[4,0,4]]};
    for(const x of [1,3]){
      const out=neighbors(level,{x,y:2});
      assert.ok(!out.some(p=>p.x===2&&p.y===2));
      assert.ok(out.some(p=>p.y===4));
    }
    assert.equal(hasFloor(level,2,2),false);
    const bridged=neighbors(level,{x:1,y:2},[{x:2,y:2}]);
    assert.ok(bridged.some(p=>p.x===2&&p.y===2));
  }
});

test('The generator never fills ladder gaps from adjoining platforms',()=>{
  const result=spawnSync('python3',['-B','-c',`
import runpy
build=runpy.run_path('scripts/build_pushover_levels.py')['build']
for number in (1,25,50,101):
    for ladder in ('H','V'):
        grid=[' '*20 for _ in range(13)]
        grid[3]=' _'+ladder+'_'.ljust(17)
        grid[2]='  '+ladder+' '*17
        grid[4]='  '+ladder+' '*17
        platforms,ladders,*_=build({'level':number,'grid':grid})
        assert [3,1,1] in platforms and [3,3,3] in platforms
        assert not any(y==3 and a<=2<=b for y,a,b in platforms)
        assert ladders==[{'x':2,'from':2,'to':4}]
`],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
});

test('DOS 25 blocks horizontal passage through the open ladder shaft',()=>{
  const level=levels[64],shaft={x:13,y:5};
  assert.equal(hasFloor(level,13,5),false);
  assert.equal(hasFloor(level,12,5),true);
  assert.equal(hasFloor(level,14,5),true);
  for(const x of [12,14]){
    assert.ok(!neighbors(level,shaft).some(p=>p.x===x&&p.y===5));
    assert.ok(!neighbors(level,{x,y:5}).some(p=>p.x===13&&p.y===5));
  }
  // Reaching the left platform from the shaft requires going back upstairs
  // and dropping from the upper ledge, rather than walking across the gap.
  const detour=pathTo(level,shaft,level.exit);
  assert.ok(detour);
  assert.deepEqual(detour[0],{x:13,y:4});
  const across=pathTo(level,{x:12,y:5},{x:14,y:5});
  assert.ok(across.some(p=>p.y!==5));
  assert.deepEqual(pathTo(level,shaft,{x:13,y:7}),[{x:13,y:6},{x:13,y:7}]);
  const position=initialPosition(level);
  const carried=position.pieces.find(p=>p.type==='normal');
  position.pieces=position.pieces.filter(p=>p.id!==carried.id);
  position.player=shaft;position.carrying=carried;
  assert.equal(edit(level,position,{type:'place'}),null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {hitPart} from './machine-hit.js';
import {canPlace} from './machine-engine.js';
import {machineLevels} from './machine-levels.js';
import {worldSize} from './machine-parts.js';

test('全景扩大触区不挡住齿轮换向关的合法啮合位置',()=>{
  const level=machineLevels[14],point={x:280,y:200};
  const candidate={id:'new',type:'gear',...point,angle:0};
  const placeable=canPlace(candidate,level.fixed,level.target,worldSize(level));
  assert.equal(placeable,true);
  assert.equal(hitPart(point,level.fixed,'g',{placeable}),null);
  assert.equal(hitPart(point,level.fixed,'g')?.id,'g');
  assert.equal(hitPart({x:326,y:200},level.fixed,'g',{placeable:true})?.id,'g');
});

test('重叠触区优先选点中的实体，连接和返回都不误选旁边的风扇',()=>{
  const pieces=[{id:'gen',type:'generator',x:720,y:510},{id:'fan',type:'fan',x:800,y:510}];
  assert.equal(hitPart({x:720,y:510},pieces,'fan')?.id,'gen');
  assert.equal(hitPart({x:800,y:510},pieces,'gen')?.id,'fan');
  assert.equal(hitPart({x:720,y:510},pieces,'fan',{placeable:true})?.id,'gen');
});

test('旋转道具按画面倾角命中，空处放不了时保留触区容错',()=>{
  const ramp={id:'r',type:'ramp',x:200,y:200,angle:90};
  assert.equal(hitPart({x:200,y:250},[ramp],null)?.id,'r');
  assert.equal(hitPart({x:250,y:200},[ramp],null),null);
  assert.equal(hitPart({x:225,y:200},[ramp],'r')?.id,'r');
  assert.equal(hitPart({x:225,y:200},[ramp],'r',{placeable:true}),null);
});

test('最终关全景中的引爆线不会被引爆器的隐形触区抢走',()=>{
  const level=machineLevels[36],pieces=[...level.fixed,...level.solution.pieces];
  const detonator=pieces.find(p=>p.type==='detonator');
  // Visible wire at t=.25: the 44 CSS-pixel target around its endpoint covers
  // this position at overview scale, but the detonator's actual body does not.
  const point={x:862.5,y:398.4375};
  assert.equal(hitPart(point,pieces,detonator.id)?.id,detonator.id);
  assert.equal(hitPart(point,pieces,detonator.id,{preferConnection:true}),null);
  assert.equal(hitPart({x:detonator.x,y:detonator.y},pieces,detonator.id,{preferConnection:true})?.id,detonator.id);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from './domino-engine.js';
import {levels} from './domino-levels.js';

for(const dir of [-1,1])for(const rows of [1,6])test(`Tumbler turns, falls fully, then rolls: ${rows} rows, direction ${dir}`,()=>{
  const level={width:9,height:12,rules:'dos',platforms:[[2,4,4],[2+rows,0,8]],ladders:[]};
  const sim=simulate(level,[{id:'a',type:'tumbler',x:4,y:2}],'a',dir);
  const drop=sim.trace.find(f=>f.pieces[0].state==='dropping');
  const landing=sim.trace.find(f=>f.time>drop.time&&f.pieces[0].state==='rolling');
  assert.equal(landing.time-drop.time,Math.max(2,rows));
  assert.equal(landing.pieces[0].y,2+rows);
  assert.equal(landing.pieces[0].x,4+dir);
  assert.ok(sim.trace.filter(f=>f.time>drop.time&&f.time<landing.time).every(f=>f.pieces[0].state==='dropping'));
  const next=sim.trace.find(f=>f.time>landing.time);
  assert.equal(next.pieces[0].x,4+2*dir);
});

test('Level 50 tumbler lands on the bottom platform before continuing to the trigger',()=>{
  const level=levels[49],pieces=structuredClone(level.pieces);
  pieces.find(p=>p.id==='p2').x=8;
  const sim=simulate(level,pieces,'p2',1);
  const drop=sim.trace.find(f=>f.pieces.find(p=>p.id==='p2').state==='dropping');
  const land=sim.trace.find(f=>f.time>drop.time&&f.pieces.find(p=>p.id==='p2').state==='rolling');
  assert.equal(land.time-drop.time,6);
  assert.deepEqual([land.pieces.find(p=>p.id==='p2').x,land.pieces.find(p=>p.id==='p2').y],[11,11]);
  assert.notEqual(sim.pieces.find(p=>p.id==='p3').state,'upright');
});

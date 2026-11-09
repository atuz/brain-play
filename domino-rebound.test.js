import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,pathTo,createChain} from './domino-engine.js';
import {levels} from './domino-levels.js';
import {baseDominoTiming} from './domino-timing.js';
import {dominoContactPhase} from './domino-contact-motion.js';
import {ceilingContactAngle} from './domino-ascender-contact.js';

for(const dir of [-1,1])for(const ceiling of [false,true])for(const obstacle of ['stopper','normal',null])for(const behind of [false,true]){
  test(`${ceiling?'Top':'Bottom'} pivot dir ${dir}, obstacle ${obstacle}, reverse neighbour ${behind}`,()=>{
    const y=ceiling?2:5;
    const level={width:9,height:8,platforms:[[0,0,8],[5,0,8]],ladders:[],rules:'dos'};
    const pieces=[{id:'a',type:ceiling?'ascender':'normal',x:4,y:5}];
    if(obstacle)pieces.push({id:'s',type:obstacle,x:4+dir,y});
    if(behind)pieces.push({id:'b',type:'normal',x:4-dir,y:ceiling?y:5});
    // Ascender reaches y=1 beneath the y=0 platform; the hanging body
    // can contact standing tiles in the following row, y=2.
    const sim=simulate(level,pieces,'a',dir),a=sim.pieces.find(p=>p.id==='a');
    assert.equal(a.dir,obstacle==='stopper'?-dir:dir);
    assert.equal(a.state,ceiling?'ceiling':'flat');
    assert.ok(a.finish!==null);
    const returning=sim.trace.find(f=>f.pieces.some(p=>p.id==='a'&&p.state===(ceiling?'ceiling-return':'returning')));
    assert.equal(!!returning,obstacle==='stopper');
    if(returning){
      assert.equal(returning.pieces.find(p=>p.id==='a').dir,dir,'near corner retained until upright');
      if(behind)assert.equal(returning.pieces.find(p=>p.id==='b').state,'upright','reverse contact must wait');
    }
    if(behind)assert.equal(sim.pieces.find(p=>p.id==='b').state,obstacle==='stopper'?'flat':'upright');
  });
}

test('Level 63 ascender remains attached to ceiling after rebounding, with no invented neighbour',()=>{
  const level=levels[62],a=level.pieces.find(p=>p.type==='ascender');
  const sim=simulate(level,level.pieces,a.id,-1);
  const final=sim.pieces.find(p=>p.id===a.id);
  assert.equal(final.state,'ceiling');assert.equal(final.dir,1);assert.equal(final.y,2);
  assert.equal(sim.pieces.find(p=>p.type==='normal'&&p.x===6&&p.y===3).state,'upright');
});

test('Level 63: relocate the bottom right tile, push the remaining row left, then reach the exit',()=>{
  const level=levels[62],pieces=structuredClone(level.pieces);
  const moved=pieces.find(p=>p.x===17&&p.y===10);
  moved.x=5;moved.y=3;
  const start=pieces.find(p=>p.x===16&&p.y===10);
  const sim=simulate(level,pieces,start.id,-1);
  assert.notEqual(sim.reason,'crash');assert.notEqual(sim.reason,'overflow');
  assert.ok(sim.pieces.every(p=>p.type==='stopper'||['flat','ceiling','vanished'].includes(p.state)));
  assert.ok(pathTo(level,{x:16,y:10},level.exit,sim.bridges,sim.holes));
  const rise=sim.pieces.find(p=>p.type==='ascender');
  assert.equal(rise.state,'ceiling');assert.equal(rise.dir,1);
  assert.ok(sim.pieces.find(p=>p.type==='trigger').finish>sim.pieces.find(p=>p.id===moved.id).finish);
});


for(const type of ['normal','ascender'])test(`Live clock preserves declared ${type} rebound stage durations`,()=>{
  const y=type==='ascender'?2:5;
  const level={width:9,height:8,platforms:[[1,0,8],[5,0,8]],rules:'dos'};
  const chain=createChain(level,[{id:'a',type,x:4,y:5},{id:'s',type:'stopper',x:3,y}]);
  chain.activateStone('a',-1);
  const stages=new Map();
  while(!chain.done()){
    const before=chain.time,delta=chain.nextTickBeats;chain.tick();
    assert.ok(Math.abs(chain.time-before-delta)<1e-6,'live playback preserves partial contact beats');
    const a=chain.stones.find(p=>p.id==='a');
    if(!stages.has(a.state))stages.set(a.state,chain.time);
  }
  const prefix=type==='ascender'?'ceiling-':'';
  const returnBeats=type==='ascender'?1:dominoContactPhase*baseDominoTiming.quarter/baseDominoTiming.beat;
  assert.ok(Math.abs(stages.get(prefix+'reversing')-stages.get(prefix+(type==='ascender'?'return':'returning'))-returnBeats)<1e-6);
  assert.equal(chain.stones.find(p=>p.id==='a').finish-stages.get(prefix+'reversing'),2);
});

test('A new push during an event gap uses the live clock',()=>{
  const level={width:9,height:7,platforms:[[5,0,8]],rules:'dos'};
  const chain=createChain(level,[{id:'a',type:'normal',x:2,y:5},{id:'s',type:'stopper',x:3,y:5},{id:'b',type:'normal',x:6,y:5}]);
  chain.activateStone('a',1);chain.tick();chain.tick();
  const pushedAt=chain.time;
  chain.activateStone('b',1);
  while(chain.stones.find(p=>p.id==='b').finish===null)chain.tick();
  assert.ok(Math.abs(chain.stones.find(p=>p.id==='b').finish-pushedAt-1-140/200)<1e-6);
});


test('Level 63 contacts the stopper before horizontal, and hits the reverse neighbour during the swing',()=>{
  const level=levels[62],pieces=structuredClone(level.pieces),a=pieces.find(p=>p.type==='ascender');
  // Use a separate neighbour to keep this contact check independent of IDs.
  pieces.push({id:'contact-target',type:'normal',x:5,y:3});
  const sim=simulate(level,pieces,a.id,-1);
  const approach=sim.trace.find(f=>f.pieces.find(p=>p.id===a.id).state==='ceiling');
  const contact=sim.trace.find(f=>f.pieces.find(p=>p.id===a.id).state==='ceiling-return');
  const turn=sim.trace.find(f=>f.pieces.find(p=>p.id===a.id).state==='ceiling-reversing');
  const angle=approach.pieces.find(p=>p.id===a.id).ceilingAngle;
  assert.ok(Math.abs(angle-Math.asin(.68)*180/Math.PI)<.001);
  assert.ok(angle<45,'reverse at the stopper, without reaching horizontal');
  assert.equal(contact.time-approach.time,1);
  assert.equal(turn.time-contact.time,1);
  const hit=sim.trace.find(f=>f.pieces.find(p=>p.id==='contact-target').state==='falling');
  assert.equal(hit.time-turn.time,1);
  assert.equal(hit.pieces.find(p=>p.id===a.id).state,'ceiling-reversing');
});


for(const dir of [-1,1])test(`Ceiling contact geometry mirrors direction ${dir} and rejects unreachable rows`,()=>{
  const level={platforms:[[1,0,8]]},source={x:4,y:2};
  const next={x:4+dir,y:3};
  assert.ok(Math.abs(ceilingContactAngle(level,source,next,dir)-Math.asin(.68)*180/Math.PI)<.001);
  assert.ok(Math.abs(ceilingContactAngle(level,source,{...next,y:2},dir)-Math.atan2(.68,.55)*180/Math.PI)<.001);
  assert.equal(ceilingContactAngle(level,source,{...next,y:4},dir),null);
});

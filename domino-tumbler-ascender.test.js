import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from './domino-engine.js';
import {dominoTiming} from './domino-timing.js';
import {dominoContactPhase} from './domino-contact-motion.js';

for(const dir of [-1,1])for(const ceiling of [1,4])for(const obstacle of ['normal','stopper']){
  test(`Tumbler activates and passes an ascender before ${obstacle}: dir=${dir}, ceiling=${ceiling}`,()=>{
    const level={width:16,height:9,rules:'dos',platforms:[[ceiling,0,15],[5,0,15]],ladders:[]};
    const pieces=[{id:'roll',type:'tumbler',x:6-dir,y:5},{id:'rise',type:'ascender',x:6,y:5},
      {id:'obstacle',type:obstacle,x:6+2*dir,y:5}];
    const sim=simulate(level,pieces,'roll',dir,{},dominoTiming);
    const hit=sim.trace.find(f=>f.pieces.find(p=>p.id==='rise').state==='ascending');
    assert.ok(hit);
    assert.ok(Math.abs(hit.time*200-720*dominoContactPhase/2)<1e-5);
    const before=sim.trace[0].pieces.find(p=>p.id==='roll'),after=hit.pieces.find(p=>p.id==='roll');
    assert.equal(after.state,'rolling');assert.equal(after.rollSerial,before.rollSerial);
    assert.equal(after.rollFrom,before.rollFrom);assert.equal(after.rollTo,before.rollTo);
    for(const [x,ms]of [[6,720],[6+dir,1440]]){
      const atCell=sim.trace.find(f=>{const p=f.pieces.find(p=>p.id==='roll');return p.x===x&&p.state==='rolling';});
      assert.ok(atCell);assert.ok(Math.abs(atCell.time*200-ms)<1e-5);
    }
    if(obstacle==='normal'){
      const stopped=sim.trace.find(f=>f.pieces.find(p=>p.id==='roll').state==='flat');
      assert.equal(stopped.pieces.find(p=>p.id==='roll').x,6+dir);
      assert.equal(stopped.pieces.find(p=>p.id==='obstacle').state,'falling');
    }else{
      assert.ok(sim.trace.some(f=>f.effects.some(e=>e.kind==='rebound'&&e.targetId==='obstacle')));
    }
    assert.notEqual(sim.reason,'crash');
  });
}

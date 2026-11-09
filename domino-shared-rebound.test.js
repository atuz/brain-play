import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from './domino-engine.js';
import {dominoTiming} from './domino-timing.js';
import {dominoContactPhase,reboundDuration,advanceContactMotion} from './domino-contact-motion.js';

for(const dir of [-1,1])test(`Ordinary and rolling landings rebound at the same angular speed, direction ${dir}`,()=>{
  const x=dir>0?4:7;
  const level={width:12,height:9,rules:'dos',platforms:[[2,x,x],[5,0,11]],ladders:[]};
  const pieces=type=>[
    {id:'source',type,x,y:2},
    {id:'stop',type:'stopper',x:x+2*dir,y:5},
    {id:'delay',type:'delay',x,y:5},
  ];
  const traces={};
  for(const type of ['normal','tumbler']){
    const timing={...dominoTiming,delayContact:4000};
    const sim=simulate(level,pieces(type),'source',dir,{},timing);
    assert.ok(!['crash','overflow'].includes(sim.reason));
    const contacts=sim.trace.filter(f=>f.effects.some(e=>e.kind==='rebound'&&e.sourceId==='source'));
    assert.ok(contacts.filter(f=>f.effects.some(e=>e.targetId==='delay')).length>=2,'both kinds return from a waiting delay repeatedly');
    const first=contacts[0],source=first.pieces.find(p=>p.id==='source');
    if(type==='normal'){
      const upright=sim.trace.find(f=>f.time>first.time&&f.pieces.find(p=>p.id==='source').state==='reversing');
      assert.ok(Math.abs((upright.time-first.time)*timing.beat-source.returnDuration)<1e-5);
      traces[type]=source.returnDuration;
      const flat=sim.trace.find(f=>f.time>first.time&&f.pieces.find(p=>p.id==='source').state==='flat');
      assert.ok(flat.time>contacts[2].time,'old rest events must not interrupt subsequent rebounds');
    }else{
      traces[type]=source.rollReturnDuration;
      const view={from:source.rollFrom,to:source.rollTo,via:source.rollVia,returnDuration:source.rollReturnDuration,
        duration:source.rollDuration,elapsed:0,phase:source.rollFrom};
      advanceContactMotion(view,source.rollReturnDuration);
      assert.ok(Math.abs(view.phase-source.rollVia)<1e-6,'upright at the same instant as the ordinary tile');
    }
  }
  assert.ok(Math.abs(traces.normal-traces.tumbler)<1e-6);
  assert.ok(Math.abs(traces.normal-reboundDuration(dominoContactPhase,dominoTiming))<1e-6);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,createChain} from './domino-engine.js';
import {dominoTiming} from './domino-timing.js';

for(const dir of [-1,1])test(`Tumbler keeps measured 720ms cell cadence, direction ${dir}`,()=>{
  const level={width:20,height:8,rules:'dos',platforms:[[5,0,19]],ladders:[]};
  const chain=createChain(level,[{id:'roll',type:'tumbler',x:9,y:5}],{},dominoTiming);
  chain.activateStone('roll',dir);
  const arrivals=[];
  while(arrivals.length<4){
    if(chain.tick())arrivals.push(chain.snapshot());
  }
  arrivals.forEach((f,i)=>{
    assert.ok(Math.abs(f.time*dominoTiming.beat-(i+1)*720)<1e-5);
    assert.equal(f.pieces[0].x,9+(i+1)*dir);
  });
});

for(const dir of [-1,1])test(`Delay resists repeated tumbler hits until flat, direction ${dir}`,()=>{
  const level={width:11,height:8,rules:'dos',platforms:[[5,0,10]],ladders:[]};
  const timing={...dominoTiming,delayContact:5000};
  const sim=simulate(level,[
    {id:'roll',type:'tumbler',x:5,y:5},
    {id:'delay',type:'delay',x:5+dir,y:5},
    {id:'wall',type:'stopper',x:5-2*dir,y:5},
  ],'roll',dir,{},timing);
  const hits=sim.trace.filter(f=>f.effects.some(e=>e.kind==='rebound'&&e.targetId==='delay'));
  assert.ok(hits.length>=2,'the tumbler must return and bounce again during the delay');
  for(const hit of hits){
    assert.equal(hit.pieces.find(p=>p.id==='roll').state,'rolling');
    assert.equal(hit.pieces.find(p=>p.id==='roll').dir,-dir);
  }
  const delayFlat=sim.trace.find(f=>f.pieces.find(p=>p.id==='delay').state==='flat');
  assert.ok(Math.abs((delayFlat.time-hits[0].time)*timing.beat-5000)<1e-5,'repeat hits do not reset the timer');
  assert.ok(sim.trace.filter(f=>f.time<delayFlat.time).every(f=>f.pieces.find(p=>p.id==='roll').state==='rolling'));
  const rollFlat=sim.trace.find(f=>f.pieces.find(p=>p.id==='roll').state==='flat');
  assert.ok(rollFlat.time>=delayFlat.time);
  assert.ok(!['overflow','crash'].includes(sim.reason));
});

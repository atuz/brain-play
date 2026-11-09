import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {simulate} from './domino-engine.js';
import {dominoTiming} from './domino-timing.js';
import {dominoContactPhase,tumblerRollTransform,advanceContactMotion} from './domino-contact-motion.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
for(const type of ['stopper','delay'])for(const dir of [-1,1])test(`${type} contact reverses from the current pose without moving the origin, direction ${dir}`,()=>{
  const level={width:20,height:8,rules:'dos',platforms:[[5,0,19]],ladders:[]};
  const sim=simulate(level,[{id:'r',type:'tumbler',x:9,y:5},{id:'target',type,x:9+3*dir,y:5}],'r',dir,{},dominoTiming);
  const contact=sim.trace.find(f=>f.effects.some(e=>e.sourceId==='r'&&e.kind==='rebound'));
  assert.ok(contact);
  const before=sim.trace[sim.trace.indexOf(contact)-1].pieces.find(p=>p.id==='r');
  const after=contact.pieces.find(p=>p.id==='r');
  near(before.rollTo,after.rollFrom);
  near(after.rollFrom,4+dominoContactPhase);
  assert.equal(after.rollOriginX,9);
  assert.equal(after.rollBaseDir,dir);
  assert.ok(after.rollTo<after.rollFrom,'return along the existing rotation path');
  assert.ok(dominoContactPhase<1,'touch before horizontal');
  const oldTransform=tumblerRollTransform({phase:before.rollTo,dir});
  const newTransform=tumblerRollTransform({phase:after.rollFrom,dir});
  assert.equal(newTransform,oldTransform,'all four body corners stay in place at reversal');
  const view={from:after.rollFrom,to:after.rollTo,phase:after.rollFrom,elapsed:0,duration:after.rollDuration};
  advanceContactMotion(view,1);
  assert.ok(view.phase<after.rollFrom,'the very next frame moves back, with no horizontal hold');
});

test('Reverse rolling remains continuous when passing the original starting cell',()=>{
  for(const dir of [-1,1])for(const phase of [-4,-3,-2,-1,0,1,2,3,4]){
    const coords=p=>tumblerRollTransform({phase:p,dir}).match(/translate\(([-\d.e+]+)px,([-\d.e+]+)px\) rotate\(([-\d.e+]+)rad\)/).slice(1).map(Number);
    const a=coords(phase-1e-8),b=coords(phase+1e-8);
    a.forEach((value,i)=>assert.ok(Math.abs(value-b[i])<1e-5));
  }
});

test('The generic rebound keyframe cannot override a rolling tumbler transform',()=>{
  const css=readFileSync(new URL('./style.css',import.meta.url),'utf8');
  assert.match(css,/\.dc-rebounded:not\(\.dc-tumbler\) \.dc-stone-face/);
  assert.doesNotMatch(css,/\.dc-rebounded \.dc-stone-face/);
});

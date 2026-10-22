import test from 'node:test';
import assert from 'node:assert/strict';
import {createAntActor} from './domino-actor.js';

function fixture(t,reduced=false){
  const original=globalThis.matchMedia;
  globalThis.matchMedia=()=>({matches:reduced});
  t.after(()=>{if(original===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=original;});
  const playing=[];
  const parts=new Map();
  const node={dataset:{},style:{setProperty(){}},querySelector(selector){
    if(!parts.has(selector))parts.set(selector,{
      dataset:{},setAttribute(){},ownerSVGElement:{getScreenCTM:()=>null},
      animate(){
        let resolve,reject;
        const animation={finished:new Promise((ok,no)=>{resolve=ok;reject=no;}),finish:()=>resolve(),cancel:()=>reject(new Error('cancelled'))};
        playing.push(animation);return animation;
      },
    });
    return parts.get(selector);
  }};
  return {node,playing,actor:createAntActor(node)};
}
test('Cancelling a transfer cannot finish or clear the next character action',async t=>{
  const {node,playing,actor}=fixture(t);
  const transfer=actor.take(null);
  assert.equal(playing.length,3);assert.equal(node.dataset.action,'take');
  actor.cancel();
  const entering=actor.enter();
  assert.equal(await transfer,false);
  assert.equal(node.dataset.action,'enter');
  playing.at(-1).finish();
  assert.equal(await entering,true);
  assert.equal(node.dataset.action,undefined);
});
test('Reduced motion completes handoffs without starting visual animations',async t=>{
  const {node,playing,actor}=fixture(t,true);
  assert.equal(await actor.take(null),true);
  assert.equal(await actor.place(null),true);
  assert.equal(await actor.reach(),true);
  assert.equal(await actor.enter(),true);
  assert.equal(playing.length,0);assert.equal(node.dataset.action,undefined);
});

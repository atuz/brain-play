import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameRuntime,bindGameLifecycle} from './game-runtime.js';
import {createGameAudio} from './game-audio.js';

function fixture(){
  let time=0,serial=0;const jobs=new Map();
  const runtime=createGameRuntime({now:()=>time,schedule:(fn,ms)=>{jobs.set(++serial,{fn,at:time+ms});return serial;},cancel:id=>jobs.delete(id)});
  const tick=ms=>{const end=time+ms;for(;;){const next=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;time=next[1].at;jobs.delete(next[0]);next[1].fn();}time=end;};
  return {runtime,tick,jobs};
}
test('foreground, ad and navigation reasons overlap atomically and exclude interrupted time',()=>{
  const {runtime:r,tick}=fixture(),states=[];r.subscribe(paused=>states.push(paused));
  tick(100);r.update({ad:true,app:false});tick(5000);assert.equal(r.now(),100);
  r.update({ad:false,app:true});tick(3000);assert.equal(r.paused,true);
  r.setPaused('navigation',true);r.setPaused('app',false);assert.equal(r.paused,true);
  r.setPaused('navigation',false);tick(40);assert.equal(r.now(),140);assert.deepEqual(states,[false,true,false]);
});
test('a domino-style delay retains its remaining time across repeated interruptions',async()=>{
  const {runtime:r,tick,jobs}=fixture();let done=false;const timer=r.delay(200);timer.finished.then(()=>done=true);
  tick(70);r.setPaused('ad',true);assert.equal(jobs.size,0);tick(5000);await Promise.resolve();assert.equal(done,false);
  r.setPaused('ad',false);tick(100);r.setPaused('app',true);tick(2000);r.setPaused('app',false);
  tick(29);await Promise.resolve();assert.equal(done,false);tick(1);assert.equal(await timer.finished,true);
});
test('delays created while paused wait, and leaving a game cancels them without replay',async()=>{
  const {runtime:r,tick,jobs}=fixture();r.setPaused('ad',true);const first=r.delay(0),cancelled=r.delay(80);
  tick(1000);assert.equal(jobs.size,0);cancelled.cancel();cancelled.cancel();assert.equal(await cancelled.finished,false);
  r.setPaused('ad',false);tick(0);assert.equal(await first.finished,true);assert.equal(jobs.size,0);
});
const animation=(state='running')=>({playState:state,pending:false,plays:0,pause(){this.playState='paused';},play(){this.plays++;this.playState='running';}});
test('running and newly created animations freeze; manually paused and cancelled ones stay stopped',()=>{
  const {runtime:r}=fixture(),running=animation(),manual=animation('paused'),cancelled=animation();
  r.trackAnimation(running);r.trackAnimation(manual);const release=r.trackAnimation(cancelled);
  r.setPaused('ad',true);assert.equal(running.playState,'paused');
  const newAnimation=animation();r.trackAnimation(newAnimation);assert.equal(newAnimation.playState,'paused');
  cancelled.playState='idle';release();r.setPaused('ad',false);
  assert.equal(running.plays,1);assert.equal(newAnimation.plays,1);assert.equal(manual.plays,0);assert.equal(cancelled.plays,0);
});
function surface(){
  const host=new EventTarget(),doc=new EventTarget();host.__brainPlayHost={activity:{version:1,active:true,ad:true}};
  doc.documentElement={dataset:{}};doc.hidden=false;doc.getAnimations=()=>[];
  const notify=state=>{const event=new Event('brainPlayActivity');event.detail=state;host.dispatchEvent(event);};
  return {host,doc,notify};
}
test('native initial state and live snapshots share one interface, independent of browser visibility',()=>{
  const {runtime:r}=fixture(),{host,doc,notify}=surface();const dispose=bindGameLifecycle(host,doc,r,true);
  assert.equal(doc.documentElement.dataset.gamePaused,'true');
  notify({version:1,active:false,ad:false});assert.equal(r.paused,true);
  notify({version:1,active:true,ad:false});assert.equal(r.paused,false);
  doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));notify({version:1,active:true,ad:false});assert.equal(r.paused,true);
  doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(r.paused,false);
  notify({version:2,active:false,ad:true});notify({version:1,active:'no',ad:true});assert.equal(r.paused,false);
  dispose();notify({version:1,active:false,ad:true});assert.equal(r.paused,false);
});
test('ordinary browsers use visibility alone and ignore App messages',()=>{
  const {runtime:r}=fixture(),{host,doc,notify}=surface();bindGameLifecycle(host,doc,r,false);
  notify({version:1,active:false,ad:true});assert.equal(r.paused,false);
  doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(r.paused,true);
});
test('an interruption stops active sound, suppresses new notes and never replays old notes',()=>{
  const {runtime:r}=fixture(),notes=[];let suspends=0,resumes=0;
  const context={currentTime:0,destination:{},suspend:async()=>suspends++,resume:async()=>resumes++,
    createOscillator(){const note={stops:0,frequency:{setValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){this.stops++;}};notes.push(note);return note;},
    createGain:()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}})};
  const sound=createGameAudio(r,()=>context);sound(true);assert.equal(notes.length,1);assert.equal(notes[0].stops,1);
  r.setPaused('ad',true);assert.equal(suspends,1);assert.equal(notes[0].stops,2);sound();assert.equal(notes.length,1);
  r.setPaused('ad',false);assert.equal(notes.length,1);assert.equal(resumes,1);
  sound();assert.equal(notes.length,2);assert.equal(resumes,2);
});

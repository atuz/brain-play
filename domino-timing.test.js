import test from 'node:test';
import assert from 'node:assert/strict';
import {createChain,simulate} from './domino-engine.js';
import {levels} from './domino-levels.js';
import {dominoTiming} from './domino-timing.js';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-5,`${actual} should equal ${expected}`);
const arranged63=()=>levels[62].pieces.map(p=>p.id==='p16'?{...p,x:5,y:3}:{...p});

test('Level 77 gap turn and second ascent take 1.30 seconds and leave the trigger strictly last',()=>{
  const level=levels[76],pieces=level.pieces.map(p=>p.id==='p43'?{...p,x:13,y:6}:p.id==='p35'?{...p,x:9,y:8}:{...p});
  const sim=simulate(level,pieces,'p27',1,{},dominoTiming);
  const first=sim.trace.find(f=>{const p=f.pieces.find(p=>p.id==='p43');return p.state==='ceiling'&&p.x===13&&p.y===5;});
  const second=sim.trace.find(f=>{const p=f.pieces.find(p=>p.id==='p43');return p.state==='ceiling'&&p.x===14&&p.y===3;});
  near((second.time-first.time)*200,1300);
  assert.equal(sim.won,true);
  const gate=sim.pieces.find(p=>p.id==='p65');
  assert.ok(sim.pieces.filter(p=>p.type!=='stopper'&&p.id!==gate.id).every(p=>p.finish<gate.finish));
});

test('Recorded level 63 timing keeps contacts, ascent and stair travel on their own clocks',()=>{
  const level=levels[62],pieces=arranged63();
  const sim=simulate(level,pieces,'p15',-1,{},dominoTiming);
  const first=(id,predicate)=>sim.trace.find(f=>predicate(f.pieces.find(p=>p.id===id)));
  const ms=f=>f.time*dominoTiming.beat;
  for(let id=15;id>=4;id--){
    near(ms(first(`p${id}`,p=>p.state==='flat')),(16-id)*275);
  }
  const start=first('p3',p=>p.state==='ascending');
  const firstMove=first('p3',p=>p.state==='ascending'&&p.y===9);
  const top=first('p3',p=>p.state==='ceiling');
  near(ms(start),3300);
  near(ms(firstMove)-ms(start),120);
  near(ms(top)-ms(firstMove),8*410);
  near(ms(first('p16',p=>p.state==='falling'))-ms(top),3*275);
  const stair=first('p1',p=>p.state==='falling');
  const trigger=first('p2',p=>p.state==='falling');
  near(ms(trigger)-ms(stair),21*275);
  assert.equal(sim.won,true);
  const old=simulate(level,pieces,'p15',-1);
  const pose=p=>({id:p.id,state:p.state,x:p.x,y:p.y,inverted:p.inverted});
  assert.deepEqual(sim.pieces.map(pose),old.pieces.map(pose),'timing does not change this chain’s final poses');
});

test('Live tick delay follows partial beats exactly, including shared event boundaries',()=>{
  const level=levels[62],pieces=arranged63();
  const chain=createChain(level,pieces,{},dominoTiming);
  chain.activateStone('p15',-1);
  let elapsed=0,ticks=0;
  while(!chain.done()){
    const delay=chain.nextTickBeats;
    assert.ok(delay>0&&delay<=1);
    elapsed+=delay;
    chain.tick();
    near(chain.time,elapsed);
    assert.ok(++ticks<300);
  }
  const sim=simulate(level,pieces,'p15',-1,{},dominoTiming);
  near(elapsed,sim.trace.at(-1).time);
  assert.deepEqual(chain.snapshot().pieces,sim.pieces);
});

test('Unrequested special tile clocks keep their timing; the trigger falls on the ordinary clock',()=>{
  const run=(type,timing)=>{
    const level={width:8,height:7,rules:'dos',platforms:[[5,0,7]],ladders:[],ramps:[],pieces:[{id:'source',type,x:2,y:5},{id:'stop',type:'stopper',x:6,y:5}]};
    return simulate(level,level.pieces,'source',1,{},timing);
  };
  for(const type of ['vanish','bridge','exploder']){
    assert.deepEqual(run(type,dominoTiming).trace,run(type).trace,type);
  }
  assert.equal(run('trigger',dominoTiming).pieces.find(p=>p.id==='source').finish,
    run('normal',dominoTiming).pieces.find(p=>p.id==='source').finish);
});

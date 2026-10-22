import test from 'node:test';
import assert from 'node:assert/strict';
import {createMachine,canPlace,validateDraft} from './machine-engine.js';
import {machineLevels,sandbox} from './machine-levels.js';
import {parts,copy,worldSize} from './machine-parts.js';
import {restoreMachine} from './machine.js';
import {createStorage} from './storage.js?v=27';
import {setLanguage,t} from './i18n.js?v=16';
import {games} from './catalog.js';
const empty=()=>({pieces:[],links:[]});
const run=(sim,seconds)=>{for(let i=0;i<seconds*120;i++)sim.step();return sim;};
const p=(id,type,x,y,extra={})=>({id,type,x,y,...extra});
const experiment=(fixed,links=[])=>createMachine({...sandbox,fixed},{pieces:[],links});

for(const level of machineLevels)test(`authored puzzle ${level.id}: legal solution wins, empty setup does not`,()=>{
  assert.equal(validateDraft(level,level.solution),true);
  const draft=copy(level.solution),before=copy(draft),sim=createMachine(level,draft);
  while(!sim.won&&sim.time<(level.timeLimit||16))sim.step();
  assert.equal(sim.won,true,JSON.stringify(sim.snapshot()));
  assert.deepEqual(draft,before,'running never mutates the arrangement');
  assert.equal(sim.events.filter(e=>e.type==='win').length,1);
  sim.dispose();
  const without=createMachine(level,empty());run(without,level.timeLimit||16);
  assert.equal(without.won,false,'the puzzle must require the supplied tool');without.dispose();
});

test('fixed-step physics reproduces the same result with different frame batches and on reset',()=>{
  const level=machineLevels[1],a=createMachine(level,level.solution),b=createMachine(level,level.solution);
  a.step(360);for(let i=0;i<120;i++)b.step(3);
  assert.deepEqual(a.snapshot(),b.snapshot());assert.ok(a.events.some(e=>e.type==='bounce'));
  const first=copy(a.snapshot());a.dispose();b.dispose();
  const reset=createMachine(level,level.solution);reset.step(360);assert.deepEqual(reset.snapshot(),first);reset.dispose();
});

test('trampoline tilt launches to the visible side; flat beds launch straight up',()=>{
  const flights=[];
  for(const angle of [-30,-15,0,15,30]){
    const sim=experiment([p('b','ball',400,90),p('bed','trampoline',400,420,{angle})]);
    while(!sim.events.some(e=>e.type==='bounce')&&sim.time<2)sim.step();
    assert.equal(sim.events.filter(e=>e.type==='bounce').length,1,`no bounce at ${angle}°`);
    const body=sim.entities.get('b').body;
    assert.ok(body.velocity.y<-5,'the ball leaves the bed upward');
    if(angle===0)assert.ok(Math.abs(body.velocity.x)<.02);
    else assert.equal(Math.sign(body.velocity.x),Math.sign(angle));
    const start={...body.position};run(sim,.2);
    assert.ok(body.position.y<start.y-40);
    if(angle===0)assert.ok(Math.abs(body.position.x-start.x)<1);
    else assert.ok((body.position.x-start.x)*Math.sign(angle)>40);
    flights.push(body.position.x-400);sim.dispose();
  }
  assert.ok(Math.abs(flights[0]+flights[4])<.1,'mirrored 30° beds produce mirrored flights');
  assert.ok(Math.abs(flights[1]+flights[3])<.1,'mirrored 15° beds produce mirrored flights');
});

test('a trampoline preserves sideways travel and only powers impacts on its front',()=>{
  const moving=experiment([p('b','ball',365,350),p('bed','trampoline',400,420)]);
  Matter.Body.setVelocity(moving.entities.get('b').body,{x:2,y:0});
  while(!moving.events.some(e=>e.type==='bounce')&&moving.time<2)moving.step();
  assert.equal(moving.events.filter(e=>e.type==='bounce').length,1);
  assert.ok(moving.entities.get('b').body.velocity.x>.5,'the ball retains sideways travel after contact friction');moving.dispose();
  for(const [x,y,velocity]of [[400,350,{x:0,y:-10}],[320,300,{x:12,y:0}],[400,278,{x:0,y:-5}]]){
    const sim=experiment([p('b','ball',x,y),p('bed','trampoline',400,300)]);
    Matter.Body.setVelocity(sim.entities.get('b').body,velocity);run(sim,.25);
    assert.equal(sim.events.filter(e=>e.type==='bounce').length,0,'underside, side and departing contacts get no powered bounce');sim.dispose();
  }
});

test('electrical input drives belts, reversing gears and a generator; a loop cannot power itself',()=>{
  const fixed=[p('hit','ball',80,70),p('power','switch',80,200),p('m','motor',150,200),p('a','gear',230,200),
    p('b','gear',276,200),p('g','generator',350,200),p('f','fan',420,240)];
  const links=[{id:'l1',type:'belt',a:'m',b:'a'},{id:'l2',type:'belt',a:'b',b:'g'}];
  const sim=experiment(fixed,links);run(sim,1);
  assert.equal(sim.entities.get('m').active,true);assert.ok(sim.entities.get('a').spin>0);
  assert.ok(sim.entities.get('b').spin<0);assert.equal(sim.entities.get('g').active,true);assert.equal(sim.entities.get('f').active,true);
  const phase=sim.entities.get('a').phase;sim.step();assert.ok(sim.entities.get('a').phase>phase);sim.dispose();
  const idle=experiment(fixed.filter(e=>e.id!=='hit'),[...links,{id:'l3',type:'belt',a:'g',b:'m'}]);run(idle,3);
  assert.ok([...idle.entities.values()].every(e=>!e.spin&&!e.active));idle.dispose();
});

test('a press produces one puff from the bellows and moves a balloon sideways',()=>{
  const sim=experiment([p('hit','ball',180,100),p('pump','bellows',200,300),p('a','balloon',320,330)]);
  run(sim,1);assert.equal(sim.entities.get('pump').spent,true);
  assert.equal(sim.events.filter(e=>e.type==='bellows').length,1);assert.ok(sim.entities.get('a').x>325);sim.dispose();
});

test('scissors cut a real rope constraint; disconnected weight falls away',()=>{
  const sim=experiment([p('l','light',100,100),p('k','bucket',100,400),p('s','scissors',100,250),p('b','ball',100,160)],
    [{id:'rope',type:'rope',a:'l',b:'k'}]);run(sim,1.5);
  assert.equal(sim.connections[0].cut,true);assert.equal(sim.events.filter(e=>e.type==='rope-cut').length,1);
  assert.ok(sim.entities.get('k').y>550);sim.dispose();
});

test('the visible floor supports falling objects in the sandbox',()=>{
  const sim=experiment([p('b','ball',100,100)]);run(sim,3);
  const ball=sim.entities.get('b'),height=worldSize(sandbox).height;assert.ok(ball.y>height-30&&ball.y<height-20);assert.ok(ball.body.speed<.5);sim.dispose();
});

test('rope tension can pull upward with a balloon; slack rope cannot trigger a light',()=>{
  const links=[{id:'r',type:'rope',a:'l',b:'a'}];
  const taut=experiment([p('l','light',100,300),p('a','balloon',100,100)],links);run(taut,1);
  assert.equal(taut.entities.get('l').active,true);taut.dispose();
  const slack=experiment([p('l','light',100,100),p('a','balloon',100,350)],links);run(slack,1);
  assert.equal(slack.entities.get('l').active,false);slack.dispose();
});

test('pulling launches once, shatters glass and cannot retrigger',()=>{
  const level=machineLevels[5],sim=createMachine(level,level.solution);run(sim,2);
  assert.equal(sim.entities.get('f').broken,true);assert.equal(sim.entities.get('s1').spent,true);
  assert.equal(sim.events.filter(e=>e.type==='shot').length,1);
  assert.equal([...sim.entities.values()].filter(e=>e.projectile).length,1);sim.dispose();
});

test('sunlight needs a live source and the rocket needs sustained ignition',()=>{
  const solar=machineLevels[4],dark=createMachine(solar,{...copy(solar.solution),links:[]});run(dark,3);
  assert.equal(dark.entities.get('s1').active,false);assert.equal(dark.entities.get('s2').active,false);
  assert.ok(dark.entities.get('a').x<301);dark.dispose();
  const fire=machineLevels[6],sim=createMachine(fire,fire.solution);run(sim,.3);
  assert.equal(sim.entities.get('r').active,false);run(sim,.5);assert.equal(sim.entities.get('r').active,true);
  run(sim,.2);assert.ok(sim.entities.get('r').y<350);sim.dispose();
});

test('placement and restore reject overlap, extra tools, invalid connections and corrupted data',()=>{
  const level=machineLevels[0];
  assert.equal(canPlace(p('r','ramp',110,100),level.fixed,level.target),false);
  assert.equal(canPlace(p('r','ramp',330,470),level.fixed,level.target),false);
  assert.equal(canPlace(p('r','ramp',5,150),level.fixed,level.target),false);
  assert.equal(validateDraft(level,{pieces:[p('x','fan',250,250)],links:[]}),false);
  for(const draft of [null,{}, {pieces:[null],links:[]},{pieces:[p('x','toString',100,100)],links:[]},
    {pieces:[p('x','ball',NaN,100)],links:[]},{pieces:[],links:[null]},
    {pieces:[],links:[{id:'x',type:'belt',a:'a',b:'a'}]}])assert.equal(validateDraft(sandbox,draft,{free:true}),false);
  const corrupt=restoreMachine({version:1,level:999,completed:[0,0,500],drafts:{'first-drop':{pieces:[null],links:[]}},freeDraft:{pieces:[null],links:[]}});
  assert.equal(corrupt.level,0);assert.deepEqual(corrupt.completed,[0]);assert.deepEqual(corrupt.freeDraft,empty());assert.deepEqual(corrupt.drafts,{});
});

test('arrangements, completed puzzles and sandbox round-trip through coded App storage',()=>{
  const state={version:1,level:4,free:true,completed:[0,1,2],drafts:{[machineLevels[0].id]:copy(machineLevels[0].solution)},
    freeDraft:{pieces:[p('p1','ball',100,100)],links:[]}};
  const store=createStorage({nativeSave:null});store.write('game:machine',state);
  const snapshot=store.snapshot();assert.deepEqual(snapshot.games.g011.state,state);
  const recovered=restoreMachine(createStorage({nativeSave:snapshot}).read('game:machine'));
  assert.deepEqual(recovered,state);recovered.freeDraft.pieces[0].x=400;assert.equal(state.freeDraft.pieces[0].x,100);
});

test('every part, puzzle, hint and rule has English and Traditional Chinese copy',()=>{
  const game=games.find(g=>g.id==='machine');
  const strings=[game.name,game.summary,...game.rules.map(r=>r.text),...Object.values(parts).flatMap(d=>[d.name,d.tip]),
    ...machineLevels.flatMap(l=>[l.name,l.goal,l.hint]),sandbox.name,sandbox.goal];
  setLanguage('en');for(const text of strings)assert.doesNotMatch(t(text),/[\u4e00-\u9fff]/,text);
  setLanguage('zh-TW');assert.equal(t('机关工坊'),'機關工坊');assert.equal(t('传送带'),'輸送帶');setLanguage('zh-CN');
});

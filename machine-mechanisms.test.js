import test from 'node:test';
import assert from 'node:assert/strict';
import {createMachine,validateDraft} from './machine-engine.js';
import {parts,copy} from './machine-parts.js';
import {ropeLength,ropePoints} from './machine-rope.js';
import {returnToTray,connectionPaths} from './machine-links.js';
import {expansionLevels} from './machine-levels-expansion.js';
import {restoreMachine} from './machine.js';
const p=(id,type,x,y,extra={})=>({id,type,x,y,...extra});
const link=(type,a,b,extra={})=>({id:`${type}-${a}-${b}`,type,a,b,...extra});
const make=(fixed,links=[])=>createMachine({width:1400,height:1000,fixed,target:null},{pieces:[],links});
const run=(sim,seconds)=>sim.step(Math.round(seconds*120));
const event=(s,type)=>s.events.filter(e=>e.type===type);

test('new balls have distinct mass and actual hard-surface rebound heights',()=>{
  const results={};
  for(const type of ['tennis','baseball','cannonball']){
    const s=make([p('b',type,400,100),p('floor','pipe',400,500,{w:300})]);let rebound=0;
    for(let i=0;i<180;i++){s.step();rebound=Math.max(rebound,-s.entities.get('b').body.velocity.y);}
    results[type]={mass:s.entities.get('b').body.mass,rebound};s.dispose();
  }
  assert.ok(results.cannonball.mass>results.baseball.mass*10);
  assert.ok(results.baseball.mass>results.tennis.mass*2);
  assert.ok(results.tennis.rebound>results.baseball.rebound*1.5);
  assert.ok(results.baseball.rebound>results.cannonball.rebound*2);
});

test('one routed rope transfers counterweight travel in either direction and preserves its total length',()=>{
  for(const right of [false,true]){
    const l=copy(expansionLevels[0]);if(right)l.fixed.find(p=>p.id==='weight').x=500;
    const s=createMachine(l,l.solution);run(s,2);
    const up=s.entities.get(right?'a':'b'),down=s.entities.get(right?'b':'a'),r=s.connections[0];
    assert.ok(up.y<240&&down.y>600);
    assert.ok(Math.abs(ropeLength(ropePoints(r,s.entities))-r.span-5)<2);
    assert.ok(Math.abs(up.x-(right?220:500))<2);s.dispose();
  }
});

test('slack routed rope never pushes endpoints apart or turns on a light',()=>{
  const s=make([p('l','light',100,100),p('wheel','pulley',250,100),p('b','bucket',250,450)], [link('rope','l','b',{via:['wheel']})]);
  Matter.Body.setPosition(s.entities.get('b').body,{x:250,y:250});run(s,.1);
  assert.equal(s.entities.get('l').active,false);assert.ok(s.connections[0].slack>150);s.dispose();
});

test('scissors cut a later routed segment and release its suspended weight',()=>{
  const s=make([p('h','hook',100,100),p('wheel','pulley',250,100),p('b','bucket',250,450),p('cut','scissors',250,300),p('hit','ball',250,180)],
    [link('rope','h','b',{via:['wheel']})]);run(s,2);
  assert.equal(s.connections[0].cut,true);assert.equal(event(s,'rope-cut').length,1);assert.ok(s.entities.get('b').y>850);s.dispose();
});

test('routed rope validation, rendering, return and save restoration keep the same route',()=>{
  const l=expansionLevels[0],draft=copy(l.solution),r=draft.links[0];
  assert.equal(validateDraft(l,draft),true);
  const saved=restoreMachine({version:1,level:25,drafts:{[l.id]:draft}});assert.deepEqual(saved.drafts[l.id],draft);
  const paths=connectionPaths(r,[...l.fixed,...draft.pieces]);assert.equal(paths.length,3);
  assert.deepEqual(paths[1],{from:{x:220,y:150},to:{x:500,y:150}});
  for(const via of [['s1','s1'],['missing'],['a'],new Array(7).fill('s1')]){
    assert.equal(validateDraft(l,{pieces:draft.pieces,links:[{...r,via}]}),false);
  }
  assert.deepEqual(returnToTray(draft,'s1').links,[],'returning a wheel must return its rope too');
  assert.deepEqual(returnToTray(draft,r.id).pieces,draft.pieces,'returning a rope keeps the wheels');
  assert.deepEqual(draft,l.solution,'neither operation mutates the undo arrangement');
});

test('a seesaw stays on its pivot, launches by rotation, and a tether can hold one end',()=>{
  const l=expansionLevels[1],free=createMachine(l,l.solution);run(free,1.3);
  const seesaw=free.entities.get('s1');assert.ok(Math.abs(seesaw.body.position.x-240)<1&&Math.abs(seesaw.body.position.y-470)<1);
  assert.ok(Math.abs(seesaw.body.angle)<=Math.PI/6+.001);assert.ok(free.entities.get('b').y<300);free.dispose();
  const held=make([...l.fixed,p('s1','seesaw',240,470,{flip:true}),p('h','hook',100,200)],[link('rope','h','s1')]);run(held,1.3);
  assert.ok(held.entities.get('s1').body.angle>-.12,'the tether limits downward travel of the attached end');
  const r=held.connections[0];assert.ok(ropeLength(ropePoints(r,held.entities))<r.span+7);held.dispose();
});

test('boxing glove mirrors, needs a rear-button impact and only strikes objects reached by the fist',()=>{
  for(const flip of [false,true]){
    const d=flip?-1:1,s=make([p('g','boxing',400,300,{flip}),p('hit','ball',400-d*30,140),p('b','baseball',400+d*85,300),
      p('floor','pipe',400+d*85,330),p('far','baseball',400+d*210,300),p('far-floor','pipe',400+d*210,330)]);
    run(s,.8);assert.equal(event(s,'punch').length,1);assert.ok(event(s,'launch').some(e=>e.target==='b'));
    assert.equal(event(s,'launch').some(e=>e.target==='far'),false);assert.ok((s.entities.get('b').x-(400+d*85))*d>30);
    run(s,1);assert.equal(s.entities.get('g').active,false);assert.equal(event(s,'punch').length,1);s.dispose();
  }
  const idle=make([p('g','boxing',400,300),p('near','ball',360,230)]);run(idle,.01);assert.equal(event(idle,'punch').length,0);idle.dispose();
});

test('spring box winds with power, holds partial charge when stopped and fires only once',()=>{
  const s=make([p('power','switch',100,300),p('m','motor',180,300),p('j','jack',400,300),p('b','baseball',400,250)], [link('belt','m','j')]);
  s.entities.get('power').active=true;run(s,1);const charge=s.entities.get('j').charge;assert.ok(charge>0&&charge<Math.PI*2);
  assert.equal(event(s,'spring').length,0);s.entities.get('power').active=false;run(s,2);assert.equal(s.entities.get('j').charge,charge);
  s.entities.get('power').active=true;run(s,1.5);assert.equal(event(s,'spring').length,1);assert.ok(event(s,'launch').some(e=>e.target==='b'));
  run(s,5);assert.equal(event(s,'spring').length,1);assert.equal(s.entities.get('j').active,false);s.dispose();
});

test('flashlight switches on by contact and illuminates only its forward cone in either orientation',()=>{
  for(const flip of [false,true]){
    const d=flip?-1:1,s=make([p('f','flashlight',400,300,{flip}),p('b','ball',400,100),p('front','solar',400+d*150,300),p('back','solar',400-d*150,300),p('side','solar',400+d*150,420)]);
    run(s,1);assert.equal(event(s,'flashlight').length,1);assert.equal(s.entities.get('front').active,true);
    assert.equal(s.entities.get('back').active,false);assert.equal(s.entities.get('side').active,false);run(s,2);assert.equal(s.entities.get('f').active,true);s.dispose();
  }
  const below=make([p('f','flashlight',400,300),p('b','ball',400,350)]);Matter.Body.setVelocity(below.entities.get('b').body,{x:0,y:-10});run(below,.25);
  assert.equal(below.entities.get('f').active,false);below.dispose();
});

test('cannon aim and flip control the actual shot; one lit fuse fires one heavy ball',()=>{
  for(const flip of [false,true])for(const angle of [-15,0,15]){
    const s=make([p('c','cannon',500,400,{flip,angle})]);s.entities.get('c').active=true;s.step();
    const ball=s.entities.get('cannonball-c'),d=flip?-1:1;assert.ok(ball.body.velocity.x*d>10);assert.ok(ball.body.mass>10);
    if(angle)assert.equal(Math.sign(ball.body.velocity.y),Math.sign(angle)*d);
    run(s,2);assert.equal(event(s,'cannon').length,1);assert.equal([...s.entities.values()].filter(e=>e.type==='cannonball').length,1);s.dispose();
  }
});

test('dynamite requires continuous focused heating, then waits before its single explosion',()=>{
  const s=make([p('light','light',100,300),p('lens','lens',200,300),p('d','dynamite',300,319),p('floor','pipe',300,350)]);
  s.entities.get('light').active=true;run(s,.4);assert.equal(s.entities.get('d').active,false);
  Matter.Body.setPosition(s.entities.get('lens').body,{x:900,y:300});run(s,.2);assert.equal(s.entities.get('d').warm,0);
  Matter.Body.setPosition(s.entities.get('lens').body,{x:200,y:300});run(s,.5);assert.equal(s.entities.get('d').active,false);
  run(s,.3);assert.equal(s.entities.get('d').active,true);assert.equal(event(s,'explode').length,0);
  run(s,1);assert.equal(event(s,'explode').length,1);assert.equal(s.entities.get('d').broken,true);s.dispose();
});

test('wired detonator burns its fuse before a blast, breaks weak materials and preserves steel',()=>{
  const s=make([p('btn','detonator',100,250),p('hit','ball',100,80),p('d','dynamite',400,350),p('stand','pipe',400,378),
    p('brick','brick',500,350),p('glass','fishbowl',400,450),p('steel','pipe',300,350),p('elbow','elbow',400,230)], [link('wire','btn','d')]);
  run(s,.9);assert.equal(event(s,'detonate').length,1);assert.equal(event(s,'explode').length,0);assert.equal(s.entities.get('brick').broken,false);
  run(s,.6);assert.equal(event(s,'explode').length,1);assert.equal(s.entities.get('brick').broken,true);assert.equal(s.entities.get('glass').broken,true);
  assert.equal(s.entities.get('steel').broken,false);assert.equal(s.entities.get('elbow').broken,false);run(s,2);assert.equal(event(s,'explode').length,1);s.dispose();
});

test('an explosion starts a delayed chain only within its radius',()=>{
  const s=make([p('a','dynamite',400,350),p('b','dynamite',500,350),p('far','dynamite',900,350),p('floor','pipe',650,378,{w:700})]);
  Object.assign(s.entities.get('a'),{active:true,started:0});run(s,.8);
  assert.equal(event(s,'explode').length,1);assert.equal(s.entities.get('b').active,true);assert.equal(s.entities.get('far').active,false);
  run(s,.8);assert.equal(event(s,'explode').length,2);s.dispose();
});

test('brick walls resist light balls but break from a heavy impact; steel remains solid',()=>{
  for(const type of ['ball','tennis','baseball','cannonball']){
    const s=make([p('b',type,400,100),p('wall','brick',400,450)]);run(s,1);
    assert.equal(s.entities.get('wall').broken,type==='cannonball',type);s.dispose();
  }
  const steel=make([p('b','cannonball',400,100),p('wall','pipe',400,450)]);run(steel,2);assert.equal(steel.entities.get('wall').broken,false);assert.ok(steel.entities.get('b').y<450);steel.dispose();
});

test('wire rejects other endpoints and never supports the weight of the dynamite',()=>{
  const s=make([p('d','dynamite',400,100),p('btn','detonator',100,100)], [link('wire','btn','d')]);run(s,1);
  assert.ok(s.entities.get('d').y>500);assert.equal(s.entities.get('d').active,false);s.dispose();
  const level={width:1000,height:1000,fixed:[],tools:{detonator:1,dynamite:1,wire:1}};
  const draft={pieces:[p('a','detonator',100,100),p('b','dynamite',400,100)],links:[link('wire','a','b')]};
  assert.equal(validateDraft(level,draft),true);assert.equal(validateDraft(level,{...draft,links:[link('wire','a','b',{via:['a']})]}),false);
  assert.equal(Object.keys(parts).length,41);
});

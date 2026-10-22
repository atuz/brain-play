import test from 'node:test';
import assert from 'node:assert/strict';
import {createMachine,canPlace,validateDraft} from './machine-engine.js';
import {parts,compatible,copy} from './machine-parts.js';
import {sandbox} from './machine-levels.js';
import {restoreMachine} from './machine.js';
import {auditCases} from './dev/machine-cases.js';

const p=(id,type,x,y,extra={})=>({id,type,x,y,...extra});
const belt=(a,b)=>({id:`belt-${a}-${b}`,type:'belt',a,b});
const rope=(a,b)=>({id:`rope-${a}-${b}`,type:'rope',a,b});
const make=(fixed,links=[])=>createMachine({...sandbox,fixed},{pieces:[],links});
const run=(s,t)=>{s.step(Math.round(t*120));return s;};
const events=(s,type)=>s.events.filter(e=>e.type===type);
const body=(s,id)=>s.entities.get(id).body;
const lamp=(x=100,y=300)=>[p('lamp','light',x,y),p('weight','bucket',x-20,y+160)];
const optics=(flip=false)=>make([...lamp(),p('lens','lens',200,300,{flip}),
  p('c','candle',flip?120:300,319),p('floor','plank',flip?120:300,345)], [rope('lamp','weight')]);

test('the visual audit includes a working scenario for every selectable item',()=>{
  assert.deepEqual(auditCases.map(c=>c.type),Object.keys(parts));
  for(const item of auditCases){const {level,draft}=item.make(),s=createMachine(level,draft);run(s,item.seconds||3);assert.equal(!!item.check(s),true,item.type);s.dispose();}
});

// Every selectable item gets its own legal-placement, save and long-run check.
for(const [type,d]of Object.entries(parts))test(`part ${type}: legal setup survives save/reset and a 30-second run`,()=>{
  let draft;
  if(d.link){
    const pair=type==='belt'?[p('a','motor',300,200),p('b','gear',420,200)]:type==='wire'?[p('a','detonator',300,200),p('b','dynamite',420,200)]:[p('a','light',300,150),p('b','bucket',300,400)];
    draft={pieces:pair,links:[{id:'connection',type,a:'a',b:'b'}]};
  }else draft={pieces:[p('part',type,400,300,{angle:d.rotate?15:0,flip:!!d.flip})],links:[]};
  assert.equal(validateDraft(sandbox,draft,{free:true}),true);
  const restored=restoreMachine({version:1,free:true,freeDraft:copy(draft)});
  assert.deepEqual(restored.freeDraft,draft);
  const before=copy(draft),sim=createMachine(sandbox,draft);run(sim,30);
  for(const e of sim.entities.values())assert.ok([e.x,e.y,e.body?.velocity.x??0,e.body?.velocity.y??0,e.phase].every(Number.isFinite),`${type} produced invalid motion`);
  assert.deepEqual(draft,before);sim.dispose();
  if(!d.link){
    if(!d.rotate)assert.equal(validateDraft(sandbox,{pieces:[p('x',type,400,300,{angle:15})],links:[]},{free:true}),false,'unsupported rotations cannot reappear from a damaged save');
    if(!d.flip)assert.equal(validateDraft(sandbox,{pieces:[p('x',type,400,300,{flip:true})],links:[]},{free:true}),false,'unsupported flips cannot reappear from a damaged save');
  }
});

test('ball and bowling ball fall, rebound, settle on a platform; the heavy ball has greater mass',()=>{
  const s=make([p('a','ball',350,100),p('b','bowling',450,100),p('floor','plank',400,400,{w:220})]);
  run(s,.8);assert.ok(body(s,'a').velocity.y<0);assert.ok(body(s,'b').velocity.y<0);
  assert.ok(body(s,'b').mass>body(s,'a').mass*4);run(s,3);
  assert.ok(Math.abs(s.entities.get('a').y-378)<2);assert.ok(Math.abs(s.entities.get('b').y-374)<2);
  assert.ok(body(s,'a').speed<.2&&body(s,'b').speed<.2);s.dispose();
});

test('balloon rises, meets the ceiling at its visible top, and cannot pass through it',()=>{
  const s=make([p('a','balloon',400,600),p('roof','plank',400,400,{w:220})]);
  run(s,1);assert.ok(s.entities.get('a').y<595);run(s,10);
  assert.ok(s.entities.get('a').y>=429&&s.entities.get('a').y<434,'the drawn balloon must stay below the ceiling');s.dispose();
});

test('bucket weight tensions its rope, triggers the lamp once, and stays suspended',()=>{
  const s=make(lamp(),[rope('lamp','weight')]);run(s,3);
  assert.equal(s.entities.get('lamp').active,true);assert.equal(events(s,'light').length,1);
  assert.ok(s.entities.get('weight').y<490);assert.ok(s.connections[0].constraint.stiffness>0);s.dispose();
});

test('both ramp directions move a falling ball downhill; a flat platform does not',()=>{
  for(const angle of [-30,0,30]){
    const s=make([p('b','ball',400,180),p('r',angle?'ramp':'plank',400,300,{angle})]);run(s,.9);
    const x=s.entities.get('b').x;
    if(angle)assert.ok((x-400)*Math.sign(angle)>25);else assert.ok(Math.abs(x-400)<1);s.dispose();
  }
});

test('two balls can bounce from one trampoline at the same time',()=>{
  const s=make([p('a','ball',380,100),p('b','ball',420,100),p('bed','trampoline',400,400)]);
  while(!events(s,'bounce').length&&s.time<2)s.step();
  assert.ok(body(s,'a').velocity.y<-5&&body(s,'b').velocity.y<-5,'neither ball loses its bounce to a shared cooldown');s.dispose();
});

test('switch requires contact with the top, not a nearby ball or a hit from below',()=>{
  const gap=make([p('b','ball',400,261),p('s','switch',400,300)]);gap.step();
  assert.equal(gap.entities.get('s').active,false,'a 4px gap must not press the switch');run(gap,.2);assert.equal(gap.entities.get('s').active,true);gap.dispose();
  const under=make([p('b','ball',400,350),p('s','switch',400,300)]);Matter.Body.setVelocity(body(under,'b'),{x:0,y:-10});run(under,.3);
  assert.equal(under.entities.get('s').active,false);under.dispose();
});

test('fan blows only in front, mirrors correctly, and windmill/generator stop when power is lost',()=>{
  for(const flip of [false,true]){
    const d=flip?-1:1;
    const s=make([...lamp(320,200),p('solar','solar',380,200),p('fan','fan',440,240,{flip}),
      p('front','balloon',440+d*70,270),p('back','balloon',440-d*70,270),p('wind','windmill',440+d*200,220),p('gen','generator',440+d*340,450)],
      [rope('lamp','weight'),belt('wind','gen')]);
    run(s,.3);assert.equal(s.entities.get('fan').active,true);assert.equal(Math.sign(s.entities.get('wind').spin),d);assert.equal(s.entities.get('gen').active,true);
    assert.ok(body(s,'front').velocity.x*d>.1);assert.ok(Math.abs(body(s,'back').velocity.x)<.01);
    s.entities.get('lamp').active=false;
    // The lamp is latched by the rope; sever it before removing the light input.
    s.connections[0].cut=true;run(s,.1);
    assert.equal(s.entities.get('solar').active,false);assert.equal(s.entities.get('fan').active,false);
    assert.equal(s.entities.get('wind').spin,0);assert.equal(s.entities.get('gen').active,false);
    const phase=s.entities.get('wind').phase;run(s,.2);assert.equal(s.entities.get('wind').phase,phase);s.dispose();
  }
});

test('motor flip and conveyor flip agree with the direction of the carried ball',()=>{
  for(const motorFlip of [false,true])for(const conveyorFlip of [false,true]){
    const s=make([p('hit','ball',100,100),p('power','switch',100,240),p('m','motor',180,240,{flip:motorFlip}),
      p('c','conveyor',400,400,{flip:conveyorFlip}),p('b','ball',400,370)], [belt('m','c')]);
    run(s,.6);const expected=(motorFlip?-1:1)*(conveyorFlip?-1:1);
    assert.equal(Math.sign(s.entities.get('m').spin),motorFlip?-1:1);
    assert.ok((s.entities.get('b').x-400)*expected>10);s.dispose();
  }
});

test('conveyor does not move a ball across an air gap or one touching its underside',()=>{
  const s=make([p('s','switch',100,240),p('m','motor',180,240),p('c','conveyor',400,400),p('b','ball',400,368)], [belt('m','c')]);
  s.entities.get('s').active=true;s.step();assert.ok(Math.abs(body(s,'b').velocity.x)<.01,'the belt must first touch the ball');s.dispose();
  const below=make([p('s','switch',100,240),p('m','motor',180,240),p('c','conveyor',400,400),p('b','ball',400,435)], [belt('m','c')]);
  below.entities.get('s').active=true;Matter.Body.setVelocity(body(below,'b'),{x:0,y:-3});run(below,.2);
  assert.ok(Math.abs(body(below,'b').velocity.x)<.02,'touching from below does not get carried');below.dispose();
});

test('opposing motors jam a connected transmission; long power chains do not depend on part order',()=>{
  const locked=make([p('s','switch',100,200),p('a','motor',180,200),p('b','motor',100,280,{flip:true})], [belt('a','b')]);
  locked.entities.get('s').active=true;run(locked,.2);
  assert.ok(locked.entities.get('a').jammed&&locked.entities.get('b').jammed);assert.equal(locked.entities.get('a').spin,0);locked.dispose();
  const fixed=[p('s','switch',100,100)],links=[];
  for(let i=0;i<7;i++){fixed.push(p(`m${i}`,'motor',160+i*180,100),p(`g${i}`,'generator',280+i*180,100));links.push(belt(`m${i}`,`g${i}`));}
  fixed.push(p('fan','fan',1360,190));
  for(const order of [fixed,[...fixed].reverse()]){
    const s=make(order,links);s.entities.get('s').active=true;run(s,.1);
    assert.equal(s.entities.get('fan').active,true);assert.ok([...s.entities.values()].filter(e=>e.type==='generator').every(e=>e.active));s.dispose();
  }
});

test('meshed gears reverse at each contact and an odd closed gear loop cannot rotate',()=>{
  const s=make([p('s','switch',100,200),p('m','motor',180,200),p('a','gear',350,300),p('b','gear',396,300),p('c','gear',442,300)], [belt('m','a')]);
  s.entities.get('s').active=true;run(s,.1);
  assert.ok(s.entities.get('a').spin>0&&s.entities.get('b').spin<0&&s.entities.get('c').spin>0);s.dispose();
  const locked=make([p('s','switch',100,200),p('m','motor',180,200),p('a','gear',350,300),p('b','gear',396,300),p('c','gear',373,340)], [belt('m','a')]);
  locked.entities.get('s').active=true;run(locked,.1);
  assert.ok(['a','b','c'].every(id=>locked.entities.get(id).spin===0),'three mutually meshed gears must jam');locked.dispose();
});

test('solar panel needs nearby light; an unconnected lamp stays dark',()=>{
  const s=make([p('lamp','light',100,200),p('solar','solar',200,200),p('far','solar',600,200)]);run(s,.2);
  assert.equal(s.entities.get('lamp').active,false);assert.equal(s.entities.get('solar').active,false);
  s.entities.get('lamp').active=true;s.step();assert.equal(s.entities.get('solar').active,true);assert.equal(s.entities.get('far').active,false);s.dispose();
});

test('lens flip selects the facing side and ignition requires continuous focused light',()=>{
  for(const flip of [false,true]){const s=optics(flip);run(s,1);assert.equal(s.entities.get('c').active,true);assert.equal(events(s,'ignite').length,1);s.dispose();}
  const s=optics();run(s,.3);assert.equal(s.entities.get('c').active,false);
  Matter.Body.setPosition(body(s,'lens'),{x:900,y:300});run(s,.5);
  assert.equal(s.entities.get('c').warm,0,'interrupted heating must cool down');
  Matter.Body.setPosition(body(s,'lens'),{x:200,y:300});run(s,.4);assert.equal(s.entities.get('c').active,false);
  run(s,.3);assert.equal(s.entities.get('c').active,true);s.dispose();
});

test('candle is extinguished by wind and can be relit only after sustained heating',()=>{
  const s=make([...lamp(),p('lens','lens',200,300),p('c','candle',300,319),p('floor','plank',300,345),
    p('fan','fan',400,319,{flip:true}),p('s','switch',480,319)], [rope('lamp','weight')]);
  run(s,1);assert.equal(s.entities.get('c').active,true);
  s.entities.get('s').active=true;run(s,.1);assert.equal(s.entities.get('c').active,false);assert.equal(events(s,'extinguish').length,1);
  s.entities.get('s').active=false;run(s,.3);assert.equal(s.entities.get('c').active,false);
  run(s,.8);assert.equal(s.entities.get('c').active,true);assert.equal(events(s,'ignite').length,2);s.dispose();
});

test('two lenses cannot double the ignition timer',()=>{
  const s=make([...lamp(),p('a','lens',200,285),p('b','lens',230,315),p('c','candle',300,319),p('floor','plank',300,345)], [rope('lamp','weight')]);
  run(s,.5);assert.equal(s.entities.get('c').active,false);run(s,.4);assert.equal(s.entities.get('c').active,true);s.dispose();
});

test('rocket needs heating, flies upward once, and retires after leaving the scene',()=>{
  const s=make([...lamp(),p('lens','lens',200,300),p('r','rocket',300,275),p('floor','plank',300,310)], [rope('lamp','weight')]);
  run(s,.4);assert.equal(s.entities.get('r').active,false);run(s,.5);assert.equal(s.entities.get('r').active,true);
  run(s,3);assert.equal(s.entities.get('r').spent,true);assert.equal(s.entities.get('r').active,false,'retired rockets do not keep firing');
  assert.equal(events(s,'ignite').length,1);s.dispose();
});

test('fishbowl requires a real fast impact; nearby or slow objects do not break it',()=>{
  const near=make([p('f','fishbowl',400,300),p('b','ball',400,255)]);Matter.Body.setVelocity(body(near,'b'),{x:0,y:2});near.step();
  assert.equal(near.entities.get('f').broken,false,'the visible ball has not touched the glass yet');run(near,.2);assert.equal(near.entities.get('f').broken,true);near.dispose();
  const slow=make([p('f','fishbowl',400,300),p('b','ball',400,261)]);slow.step();assert.equal(slow.entities.get('f').broken,false);slow.dispose();
});

test('bellows mirrors its handle and requires a press rather than a nearby object',()=>{
  for(const flip of [false,true]){
    const d=flip?-1:1,s=make([p('pump','bellows',400,300,{flip}),p('b','ball',400-d*20,260),p('a','balloon',400+d*120,320)]);
    s.step();assert.equal(s.entities.get('pump').spent,false,'the ball is still above the handle');run(s,.4);
    assert.equal(events(s,'bellows').length,1);assert.ok(body(s,'a').velocity.x*d>.1);run(s,.5);assert.equal(events(s,'bellows').length,1);s.dispose();
  }
});

test('pistol fires once in either direction; a wall stops the projectile',()=>{
  for(const flip of [false,true]){
    const d=flip?-1:1,s=make([p('gun','pistol',400,240,{flip}),p('k','bucket',400,450),p('wall','plank',400+d*130,240,{angle:90})], [rope('gun','k')]);
    run(s,.5);const shot=[...s.entities.values()].find(e=>e.projectile);assert.ok(shot);assert.equal(events(s,'shot').length,1);
    assert.ok((shot.x-400)*d<125,'the projectile cannot pass through the wall');
    assert.ok(shot.body.circleRadius===5,'collision radius must match the 5px artwork');run(s,2);
    assert.ok((shot.x-400)*d<125,'the stopped projectile never regains its launch speed');assert.equal(events(s,'shot').length,1);s.dispose();
  }
});

test('scissors require a real collision and cut only ropes at their blades, once',()=>{
  const s=make([p('lamp','light',400,100),p('k','bucket',400,500),p('cut','scissors',400,300),p('b','ball',400,258)], [rope('lamp','k')]);
  Matter.Body.setVelocity(body(s,'b'),{x:0,y:1});s.step();assert.equal(s.entities.get('cut').spent,false,'ball is still 6px above the blades');
  run(s,.4);assert.equal(s.connections[0].cut,true);assert.equal(events(s,'cut').length,1);assert.equal(events(s,'rope-cut').length,1);s.dispose();
});

test('belt and rope endpoint rules reject incompatible, duplicate, self and overlong links',()=>{
  for(const [a,A]of Object.entries(parts))for(const [b,B]of Object.entries(parts)){
    const x=p('a',a,200,200),y=p('b',b,300,200);
    assert.equal(compatible(x,y,'belt'),!!A.rotary&&!!B.rotary,`${a}/${b} belt`);
    assert.equal(compatible(x,y,'rope'),!!A.rope&&!!B.rope&&(!!A.dynamic||!!B.dynamic),`${a}/${b} rope`);
  }
  const a=p('a','motor',200,200),b=p('b','gear',600,200);
  assert.equal(compatible(a,b,'belt'),false);assert.equal(compatible(a,a,'belt'),false);
  const draft={pieces:[a,{...b,x:300}],links:[belt('a','b'),{...belt('b','a'),id:'duplicate'}]};
  assert.equal(validateDraft(sandbox,draft,{free:true}),false);
  assert.equal(canPlace(p('x','gear',2,200),[],null),false);
});

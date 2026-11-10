import test from 'node:test';
import assert from 'node:assert/strict';
import {createAscenderMechanic} from './domino-ascender-engine.js';
import {renderAscender,createAscenderNode,ascenderEscapePose} from './domino-ascender-view.js';
import {simulate,createChain} from './domino-engine.js';
import {levels} from './domino-levels.js';
import {dominoTiming} from './domino-timing.js';

for(const dir of [-1,1])test(`Ascender rebounds from a delay and reverses again at the opposite stopper, direction ${dir}`,()=>{
  const level={width:12,height:8,rules:'dos',platforms:[[2,0,11],[4,0,11]],ladders:[]};
  const sim=simulate(level,[{id:'rise',type:'ascender',x:5,y:4},
    {id:'delay',type:'delay',x:5+dir,y:4},{id:'stop',type:'stopper',x:5-dir,y:4}],'rise',dir);
  const hits=sim.trace.filter(f=>f.effects.some(e=>e.kind==='rebound'));
  assert.ok(hits.some(f=>f.effects.some(e=>e.targetId==='delay')));
  assert.ok(hits.some(f=>f.effects.some(e=>e.targetId==='stop')));
  for(const frame of hits)assert.equal(frame.pieces.find(p=>p.id==='rise').state,'ceiling-return');
  assert.equal(sim.pieces.find(p=>p.id==='delay').state,'flat');
  assert.equal(sim.pieces.find(p=>p.id==='rise').dir,dir);
});

test('Opposing stoppers repeatedly reverse the ascender instead of merely recording a second contact',()=>{
  const level={width:12,height:8,rules:'dos',platforms:[[2,0,11],[4,0,11]],ladders:[]};
  const chain=createChain(level,[{id:'rise',type:'ascender',x:5,y:4},
    {id:'left',type:'stopper',x:4,y:4},{id:'right',type:'stopper',x:6,y:4}]);
  chain.activateStone('rise',1);
  for(let i=0;i<20&&!chain.done();i++)chain.step();
  const hits=chain.trace.filter(f=>f.effects.some(e=>e.kind==='rebound'));
  assert.ok(hits.length>=3);
  assert.deepEqual(hits.slice(0,3).map(f=>f.effects[0].targetId),['right','left','right']);
  assert.ok(hits.every(f=>f.pieces.find(p=>p.id==='rise').state==='ceiling-return'));
});

test('A released ascender paints the lower landing coordinate using the shared brick clock',()=>{
  const face={style:{}},places=[];
  const node={dataset:{stage:'upright'},style:{setProperty(){}},classList:{toggle(){}},querySelector:s=>s==='.dc-ascender-face'?face:{}};
  const piece={type:'ascender',x:5,y:2,state:'dropping',carriedDrop:true,dropX:5,dropY:5};
  const options={level:{platforms:[]},place:p=>places.push(p)};
  assert.deepEqual(renderAscender(node,piece,options),{x:5,y:5});
  assert.deepEqual(places,[{x:5,y:2}]);
  assert.equal(node.style.transition,'top 300ms linear');
  assert.deepEqual(renderAscender(node,{...piece,state:'upright',y:5,carriedDrop:false},options),{x:5,y:5});
});

for(const dir of [-1,1])test(`Escape continues past horizontal at the gap and finishes at its upright position, direction ${dir}`,()=>{
  const w=12.8,h=40,px=(w+dir*h)/2,py=(w-h)/2;
  const matrix=angle=>ascenderEscapePose(w,h,dir,angle).slice(7,-1).split(',').map(Number);
  const point=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
  const near=(a,b)=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-8,`${a} versus ${b}`));
  for(const angle of [90,105,120,135,150,165,180])near(point(matrix(angle),px,-py),[px,py]);
  assert.ok(matrix(135)[0]<0,'continue from 90 toward 180 degrees, rather than return to zero');
  let previousCenter=Infinity;
  for(let phase=90;phase<=180;phase++){
    const center=point(matrix(phase),w/2,h/2)[1];
    assert.ok(center<=previousCenter+1e-8,'the centre must keep moving upward throughout the turn');
    previousCenter=center;
  }
  // Switching away from the previous top-corner origin must not move any
  // corner of the horizontal body.
  for(const [x,y] of [[0,0],[w,0],[w,h],[0,h]]){
    const ox=dir>0?w:0;
    near(point(matrix(90),x,y),[ox+dir*y,-dir*(x-ox)]);
  }
  // The 180-degree artwork can be re-anchored without resetting orientation:
  // next cell and one row up, preserving the completed half-turn.
  const end=matrix(180);
  for(const [x,y] of [[0,0],[w,0],[w,h],[0,h]])near(point(end,x,y),[dir*h+w-x,-y]);
});

test('A simulation resume waits for the actual last rotation frame before re-anchoring',async t=>{
  const oldStyle=globalThis.getComputedStyle;
  globalThis.getComputedStyle=()=>({width:'12.8px',height:'40px'});
  t.after(()=>{if(oldStyle===undefined)delete globalThis.getComputedStyle;else globalThis.getComputedStyle=oldStyle;});
  let finish,frames,duration,cancelled=false;
  const face={style:{},offsetHeight:40,animate(keyframes,options){frames=keyframes;duration=options.duration;return {finished:new Promise(resolve=>finish=resolve),cancel(){cancelled=true;}};}};
  const node={dataset:{stage:'ceiling'},style:{setProperty(){}},classList:{toggle(){}},querySelector:s=>s==='.dc-ascender-face'?face:{}};
  const level={width:11,platforms:[[5,4,6]]};let placed;const placements=[];
  const options={level,timing:dominoTiming,place:p=>{placed=p;placements.push(p);}};
  renderAscender(node,{type:'ascender',x:6,y:6,state:'ceiling-escape',dir:1},options);
  assert.equal(frames.length,91);
  assert.equal(duration,650,'the 240ms gap turn includes the existing 410ms first rise beat');
  const deferred=renderAscender(node,{type:'ascender',x:7,y:5,state:'ascending',dir:1,inverted:true},options);
  assert.deepEqual(deferred,{x:6,y:6},'hold the old anchor while rotation is still active');
  assert.equal(node.dataset.stage,'ceiling-escape');
  assert.equal(cancelled,false,'never truncate the last few degrees');
  renderAscender(node,{type:'ascender',x:7,y:4,state:'ascending',dir:1,inverted:true},options);
  finish();await Promise.resolve();
  assert.deepEqual(placements,[{x:7,y:5},{x:7,y:4}],'re-anchor at the turn endpoint before continuing upward');
  assert.deepEqual(placed,{x:7,y:4});
  assert.equal(node.dataset.stage,'ascending');
  assert.equal(node.dataset.inverted,'true');
  assert.equal(face.style.transform,'rotate(0deg)');
  assert.equal(node.style.transition,'top 410ms linear');
});

test('DOS level 13 ascender rebounds, clears three edges and reaches the top chain',()=>{
  const level=levels[52],sim=simulate(level,level.pieces,'p31',1);
  const poses=sim.trace.map(f=>f.pieces.find(p=>p.id==='p36'));
  assert.ok(poses.some(p=>p.state==='ceiling-reversing'&&p.dir===-1));
  for(const [x,y] of [[15,7],[14,5],[13,3]]){
    assert.ok(poses.some(p=>p.state==='ascending'&&p.x===x&&p.y===y&&p.finish===null));
  }
  assert.ok(sim.pieces.filter(p=>p.y===3).every(p=>p.state==='flat'));
  assert.deepEqual([sim.pieces.find(p=>p.id==='p36').x,sim.pieces.find(p=>p.id==='p36').y],[13,2]);
});

for(const dir of [-1,1])test(`Ascender resumes rising after flattening beyond a ceiling edge, direction ${dir}`,()=>{
  const level={width:11,height:10,rules:'dos',platforms:[[1,0,10],[5,4,6],[8,0,10]],ladders:[]};
  const x=dir===1?6:4;
  const sim=simulate(level,[{id:'a',type:'ascender',x,y:8}],'a',dir);
  const flat=sim.trace.find(f=>f.pieces[0].state==='ceiling'&&f.pieces[0].y===6);
  assert.ok(flat,'touch the first platform and flatten before rising again');
  const resumed=sim.trace.find(f=>f.time>flat.time&&f.pieces[0].state==='ascending');
  assert.equal(resumed.pieces[0].x,x+dir);
  assert.equal(resumed.pieces[0].y,5,'vertical travel starts in the same event that completes the turn');
  const escape=sim.trace.find(f=>f.pieces[0].state==='ceiling-escape');
  assert.equal(escape.time-flat.time,2);
  assert.equal(resumed.time-escape.time,2);
  assert.equal(!!resumed.pieces[0].inverted,true);
  assert.equal(resumed.pieces[0].finish,null);
  assert.equal(sim.pieces[0].state,'ceiling');
  assert.equal(sim.pieces[0].y,2,'reach the higher platform');
});

test('A fully supported horizontal ascender remains under its platform',()=>{
  const level={width:11,height:10,rules:'dos',platforms:[[5,4,7],[8,0,10]],ladders:[]};
  const sim=simulate(level,[{id:'a',type:'ascender',x:5,y:8}],'a',1);
  assert.equal(sim.pieces[0].state,'ceiling');
  assert.deepEqual([sim.pieces[0].x,sim.pieces[0].y],[5,6]);
});

test('An ascender with no higher ceiling exits through the top',()=>{
  const level={width:11,height:10,rules:'dos',platforms:[[5,4,6],[8,0,10]],ladders:[]};
  const sim=simulate(level,[{id:'a',type:'ascender',x:6,y:8}],'a',1);
  assert.equal(sim.pieces[0].state,'vanished');
});

test('Ascender mechanics reject ordinary tiles and never schedule ordinary motion events',()=>{
  const events=[],normal={id:'n',type:'normal',state:'upright'},rise={id:'a',type:'ascender',x:4,y:3,state:'upright'};
  const mechanic=createAscenderMechanic({level:{platforms:[]},stones:[normal,rise],
    floor:()=>false,getTime:()=>0,activate:()=>{},schedule:(kind,...rest)=>events.push({kind,rest}),
  });
  assert.equal(mechanic.begin(normal,1),false);
  assert.equal(mechanic.handle({kind:'ascender-rise',dir:1},normal,[]),false);
  assert.deepEqual(normal,{id:'n',type:'normal',state:'upright'});
  assert.equal(events.length,0);
  assert.equal(mechanic.begin(rise,1),true);
  assert.equal(mechanic.handle({kind:'ascender-rise',dir:1},rise,[]),true);
  assert.ok(events.every(e=>e.kind.startsWith('ascender-')));
  assert.equal(rise.y,2);
});

test('Ascender rendering rejects normal tiles without changing their view',()=>{
  const node={untouched:true};
  assert.equal(renderAscender(node,{type:'normal'},{}),false);
  assert.deepEqual(node,{untouched:true});
  assert.throws(()=>createAscenderNode({type:'normal'}),TypeError);
});

test('Ascender poses use their own node classes and motion variables',()=>{
  const properties=new Map(),classes=new Set(),label={};
  const node={dataset:{},style:{setProperty:(name,value)=>properties.set(name,value)},
    classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)},querySelector:()=>label,
  };
  const piece={type:'ascender',x:4,y:2,state:'ceiling-return',dir:-1,ceilingAngle:43};
  renderAscender(node,piece,{level:{width:9,platforms:[[1,3,5]]},problemText:'!'});
  assert.ok(node.className.split(' ').includes('dc-ascender-piece'));
  assert.ok(!node.className.split(' ').some(c=>['dc-stone','dc-returning','dc-ceiling','dc-ceiling-return'].includes(c)));
  assert.ok(classes.has('da-mounted'));
  assert.ok([...properties.keys()].every(name=>name.startsWith('--da-')));
  assert.equal(properties.get('--da-angle'),'43deg');
  assert.equal(properties.get('--da-duration'),'200ms');
});

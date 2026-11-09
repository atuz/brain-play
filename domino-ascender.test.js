import test from 'node:test';
import assert from 'node:assert/strict';
import {createAscenderMechanic} from './domino-ascender-engine.js';
import {renderAscender,createAscenderNode,ascenderEscapePose} from './domino-ascender-view.js';
import {simulate} from './domino-engine.js';
import {levels} from './domino-levels.js';

for(const dir of [-1,1])test(`Extra quarter-turn preserves its outer pivot and ends at the rising pose, direction ${dir}`,()=>{
  const w=12.8,h=40,cornerX=dir>0?0:w;
  const matrix=angle=>ascenderEscapePose(w,h,dir,angle).slice(7,-1).split(',').map(Number);
  const point=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
  const near=(a,b)=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-8,`${a} versus ${b}`));
  const pivot=point(matrix(90),cornerX,h);
  for(const angle of [90,105,120,135,150,165,180])near(point(matrix(angle),cornerX,h),pivot);
  // Switching away from the previous top-corner origin must not move any
  // corner of the horizontal body.
  for(const [x,y] of [[0,0],[w,0],[w,h],[0,h]]){
    const ox=dir>0?w:0;
    near(point(matrix(90),x,y),[ox+dir*y,-dir*(x-ox)]);
  }
  // The 180-degree artwork can be re-anchored without resetting orientation:
  // next cell, one thickness lower, with the artwork inverted.
  const end=matrix(180);
  for(const [x,y] of [[0,0],[w,0],[w,h],[0,h]])near(point(end,x,y),[dir*h+w-x,w+h-y]);
});

test('A simulation resume waits for the actual last rotation frame before re-anchoring',async t=>{
  const oldStyle=globalThis.getComputedStyle;
  globalThis.getComputedStyle=()=>({width:'12.8px',height:'40px'});
  t.after(()=>{if(oldStyle===undefined)delete globalThis.getComputedStyle;else globalThis.getComputedStyle=oldStyle;});
  let finish,frames,cancelled=false;
  const face={style:{},offsetHeight:40,animate(keyframes){frames=keyframes;return {finished:new Promise(resolve=>finish=resolve),cancel(){cancelled=true;}};}};
  const node={dataset:{stage:'ceiling'},style:{setProperty(){}},classList:{toggle(){}},querySelector:s=>s==='.dc-ascender-face'?face:{}};
  const level={width:11,platforms:[[5,4,6]]};let placed;
  const options={level,place:p=>placed=p};
  renderAscender(node,{type:'ascender',x:6,y:6,state:'ceiling-escape',dir:1},options);
  assert.equal(frames.length,91);
  const deferred=renderAscender(node,{type:'ascender',x:7,y:5,state:'ascending',dir:1,inverted:true},options);
  assert.deepEqual(deferred,{x:6,y:6},'hold the old anchor while rotation is still active');
  assert.equal(node.dataset.stage,'ceiling-escape');
  assert.equal(cancelled,false,'never truncate the last few degrees');
  finish();await Promise.resolve();
  assert.deepEqual(placed,{x:7,y:5});
  assert.equal(node.dataset.stage,'ascending');
  assert.equal(node.dataset.inverted,'true');
  assert.equal(face.style.transform,'translateY(12.8px)');
  assert.equal(node.style.transition,'top 200ms linear');
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
  assert.equal(resumed.pieces[0].inverted,true);
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

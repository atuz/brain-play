import test from 'node:test';
import assert from 'node:assert/strict';
import {edgePan,overviewScale,worldPoint} from './machine-camera.js';
import {worldSize} from './machine-parts.js';
import {canPlace,validateDraft,createMachine} from './machine-engine.js';
import {restoreMachine} from './machine.js';
import {sandbox,machineLevels} from './machine-levels.js';
const view={width:320,height:400},limit={x:640,y:200};
const pan=(pointer,scroll,elapsed=16)=>edgePan({pointer,scroll,view,limit},elapsed);

test('dragging in the center or away from the board never scrolls the scene',()=>{
  const start={x:100,y:80};
  for(const p of [{x:160,y:200},{x:-40,y:200},{x:400,y:200},{x:100,y:450}])assert.deepEqual(pan(p,start),start);
  assert.deepEqual(pan({x:319,y:399},start,0),start);
});

test('all four corners scroll on both axes; holding a still pointer keeps scrolling',()=>{
  for(const [p,sx,sy] of [[{x:2,y:2},-1,-1],[{x:318,y:2},1,-1],[{x:2,y:398},-1,1],[{x:318,y:398},1,1]]){
    let scroll={x:320,y:100};const first=pan(p,scroll);assert.equal(Math.sign(first.x-scroll.x),sx);assert.equal(Math.sign(first.y-scroll.y),sy);
    for(let frame=0;frame<120;frame++)scroll=pan(p,scroll);
    assert.equal(scroll.x,sx===1?limit.x:0);assert.equal(scroll.y,sy===1?limit.y:0);
  }
});

test('edge speed ramps up smoothly, is frame-rate independent and never crosses a boundary',()=>{
  const start={x:10,y:10};assert.ok(pan({x:319,y:200},start).x>pan({x:290,y:200},start).x);
  let split=start;for(let i=0;i<10;i++)split=pan({x:319,y:399},split,10);
  const once=pan({x:319,y:399},start,100);assert.ok(Math.abs(split.x-once.x)<1e-8);assert.ok(Math.abs(split.y-once.y)<1e-8);
  assert.deepEqual(pan({x:319,y:399},{x:640,y:200}),{x:640,y:200});
  assert.deepEqual(pan({x:0,y:0},{x:0,y:0}),{x:0,y:0});
});

test('scrolling beneath a dragged part changes world coordinates while preserving the finger position',()=>{
  const finger={x:200,y:250},scale=.625;
  const before=worldPoint(finger,{left:20,top:80},scale),after=worldPoint(finger,{left:-105,top:30},scale);
  assert.equal(after.x-before.x,200);assert.equal(after.y-before.y,80);
  assert.equal(after.x*scale-105,finger.x);assert.equal(after.y*scale+30,finger.y);
  const zoom=overviewScale(view,worldSize(sandbox));assert.ok(zoom*1440<=view.width);assert.ok(zoom*900<=view.height);
});

test('far-side placement, saved drafts and collision floor use the large world bounds',()=>{
  const piece={id:'far','type':'ball',x:1320,y:800},draft={pieces:[piece],links:[]};
  assert.equal(canPlace(piece,[],null),false);assert.equal(canPlace(piece,[],null,worldSize(sandbox)),true);
  assert.equal(validateDraft(sandbox,draft,{free:true}),true);
  const saved=restoreMachine({version:1,free:true,freeDraft:draft});assert.deepEqual(saved.freeDraft,draft);
  const sim=createMachine(sandbox,draft);sim.step(360);const ball=sim.entities.get('far');
  assert.ok(ball.y>870&&ball.y<880);assert.ok(Math.abs(ball.x-1320)<1);sim.dispose();
  for(const level of machineLevels.filter(l=>l.tutorial))assert.deepEqual(worldSize(level),{width:480,height:600});
  assert.ok(machineLevels.some(l=>worldSize(l).width>=1200&&worldSize(l).height>=900));
});

test('saved camera centers survive reopening; invalid views do not discard valid game drafts',()=>{
  const views={sandbox:{x:1050,y:600,overview:true},'first-drop':{x:240,y:300,overview:false},bad:{x:1,y:1,overview:false}};
  const save=restoreMachine({version:1,free:true,views});assert.deepEqual(save.views,{sandbox:views.sandbox,'first-drop':views['first-drop']});
  const invalid=restoreMachine({version:1,views:{sandbox:{x:9999,y:0,overview:false}}});assert.equal(invalid.views,undefined);
});

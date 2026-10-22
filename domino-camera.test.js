import test from 'node:test';
import assert from 'node:assert/strict';
import {constrainCamera,fitScale,zoomCamera,followCamera,mountCamera} from './domino-camera.js';
const stage={width:1000,height:1000},view={width:330,height:346};
test('Large-stage camera clamps all four edges and centers a fitted map',()=>{
  assert.deepEqual(constrainCamera({x:120,y:90,scale:1},stage,view),{x:0,y:0,scale:1});
  assert.deepEqual(constrainCamera({x:-2000,y:-2000,scale:1},stage,view),{x:-670,y:-654,scale:1});
  const scale=fitScale(stage,view),camera=constrainCamera({x:-200,y:-200,scale},stage,view);
  assert.equal(camera.x,0);assert.equal(camera.y,8);assert.equal(scale,.33);
});
test('Zoom preserves the touched world point while away from a boundary',()=>{
  const before={x:-350,y:-350,scale:1},anchor={x:160,y:170};
  const after=zoomCamera(before,1.5,anchor,stage,view);
  for(const axis of ['x','y'])assert.equal((anchor[axis]-before[axis])/before.scale,(anchor[axis]-after[axis])/after.scale);
  assert.equal(after.scale,1.5);
});
test('Following keeps the ant inside the safe area without moving a stable view',()=>{
  const origin={x:0,y:0,scale:1};
  assert.deepEqual(followCamera(origin,{x:160,y:170},stage,view),origin);
  const lower=followCamera(origin,{x:940,y:940},stage,view);
  assert.ok(lower.x<0&&lower.y<0);
  assert.ok(940+lower.x<=view.width&&940+lower.y<=view.height);
  const upper=followCamera(lower,{x:20,y:20},stage,view);
  assert.equal(upper.x,0);assert.equal(upper.y,0);
});
test('A fully zoomed character stays visible while climbing in a short phone viewport',()=>{
  const phone={width:260,height:200};
  let camera={x:0,y:0,scale:2};
  for(const point of [{x:500,y:500},{x:200,y:100}]){
    camera=followCamera(camera,point,stage,phone);
    const center={x:point.x*camera.scale+camera.x,y:point.y*camera.scale+camera.y};
    assert.ok(center.y-68>=0&&center.y+68<=phone.height);
    assert.ok(center.x-70>=0&&center.x+10<=phone.width);
  }
});

test('Moving resumes vertical tracking after manually zooming a large map',t=>{
  // Exercise the mounted camera's mode transitions as well as the geometry.
  class Node {
    style={};dataset={};children=[];events={};clientWidth=330;clientHeight=294;
    classList={toggle(){}};
    setAttribute(){}
    append(node){this.children.push(node);}
    before(node){this.tools=node;}
    addEventListener(name,fn){this.events[name]=fn;}
    removeEventListener(){}
    remove(){}
  }
  const globals={document:globalThis.document,window:globalThis.window,ResizeObserver:globalThis.ResizeObserver,matchMedia:globalThis.matchMedia};
  globalThis.document={createElement:()=>new Node()};
  globalThis.window={innerHeight:844,addEventListener(){},removeEventListener(){}};
  globalThis.ResizeObserver=class {observe(){} disconnect(){}};
  globalThis.matchMedia=()=>({matches:false});
  let camera;
  t.after(()=>{camera?.dispose();for(const [key,value]of Object.entries(globals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}});
  const viewport=new Node(),world=new Node();
  camera=mountCamera(viewport,world,{focusPoint:()=>({x:140,y:100}),onSwipe(){}});
  camera.setStage(25,25);
  viewport.tools.children[2].events.click(); // Zooming pauses follow while inspecting.
  assert.equal(viewport.dataset.camera,'manual');
  const stopped=world.style.transform;
  camera.follow({x:140,y:900});
  assert.equal(world.style.transform,stopped);
  camera.resume();camera.follow({x:140,y:900});
  assert.equal(viewport.dataset.camera,'follow');
  assert.notEqual(world.style.transform,stopped);
  const position=()=>{
    const [,x,y,scale]=world.style.transform.match(/translate\(([-\d.]+)px,([-\d.]+)px\) scale\(([-\d.]+)\)/);
    return {x:Number(x),y:Number(y),scale:Number(scale)};
  };
  const down=position();
  assert.ok(900*down.scale+down.y>=0&&900*down.scale+down.y<=viewport.clientHeight);
  camera.follow({x:140,y:100});
  const up=position();
  assert.ok(100*up.scale+up.y>=0&&100*up.scale+up.y<=viewport.clientHeight);
});

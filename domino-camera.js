import {el} from './shared.js?v=46';
import {t} from './i18n.js?v=46';
import {motionEnabled} from './motion.js?v=46';
import {gameRuntime} from './game-runtime.js?v=46';

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function constrainCamera(camera,stage,view){
  const axis=(offset,size,visible)=>size<=visible?(visible-size)/2:clamp(offset,visible-size,0);
  return {...camera,x:axis(camera.x,stage.width*camera.scale,view.width),y:axis(camera.y,stage.height*camera.scale,view.height)};
}
export function fitScale(stage,view){return Math.min(view.width/stage.width,view.height/stage.height);}
export function zoomCamera(camera,scale,anchor,stage,view){
  const ratio=scale/camera.scale;
  return constrainCamera({scale,x:anchor.x-(anchor.x-camera.x)*ratio,y:anchor.y-(anchor.y-camera.y)*ratio},stage,view);
}
export function followCamera(camera,point,stage,view,center=false){
  let {x,y,scale}=camera;
  for(const [axis,size]of [['x','width'],['y','height']]){
    // At maximum zoom the ant is taller than a tile; reserve room for its
    // antennae, feet and held bone even in a short phone viewport.
    const screen=point[axis]*scale+camera[axis],margin=Math.min(view[size]/2,Math.max(view[size]*.24,38*scale));
    const shift=center?view[size]/2-screen:screen<margin?margin-screen:screen>view[size]-margin?view[size]-margin-screen:0;
    if(axis==='x')x+=shift;else y+=shift;
  }
  return constrainCamera({x,y,scale},stage,view);
}

export function mountCamera(viewport,world,{focusPoint,onSwipe}){
  let cols=9,rows=7,stage={width:360,height:280},view={width:360,height:280};
  let camera={x:0,y:0,scale:1},automatic=true,ready=false,large=false,lastWidth=0,lastHeight=0;
  let suppressClick=false,gesture=null;
  const pointers=new Map();
  const minus=el('button',{type:'button',text:'−','aria-label':'缩小场地',onclick:()=>zoomBy(.8)});
  const overview=el('button',{type:'button',text:'全景',onclick:()=>isOverview()?locate():showOverview()});
  const plus=el('button',{type:'button',text:'+','aria-label':'放大场地',onclick:()=>zoomBy(1.25)});
  const locateButton=el('button',{type:'button',text:'◎','aria-label':'跟随蚂蚁',onclick:locate});
  const tools=el('div',{class:'dc-camera-tools','aria-label':'场地视角'},[minus,overview,plus,locateButton]);
  viewport.before(tools);
  const isOverview=()=>Math.abs(camera.scale-fitScale(stage,view))<.005;
  const defaultScale=()=>Math.min(1,view.width/(Math.min(cols,9)*40));
  const localPoint=e=>{const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left-viewport.clientLeft,y:e.clientY-r.top-viewport.clientTop};};
  function draw(animate=false){
    world.style.transition=animate&&motionEnabled()?'transform 160ms ease-out':'none';
    world.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
    viewport.dataset.camera=automatic?'follow':'manual';
    overview.textContent=t(isOverview()?'近看':'全景');overview.setAttribute('aria-pressed',String(isOverview()));
    locateButton.setAttribute('aria-pressed',String(automatic));
    minus.disabled=camera.scale<=fitScale(stage,view)+.005;plus.disabled=camera.scale>=2-.005;
  }
  function resize(force=false){
    const width=viewport.clientWidth,height=window.innerHeight;
    if(!width||!force&&width===lastWidth&&height===lastHeight)return;
    const wasOverview=ready&&isOverview();
    lastWidth=width;lastHeight=height;
    const unit=Math.min(40,width/Math.min(cols,9));
    viewport.style.height=`${Math.min(rows*unit,large?Math.max(200,Math.min(width*1.05,height*.45)-52):Infinity)+2}px`;
    view={width:viewport.clientWidth,height:viewport.clientHeight};
    if(!ready){camera={x:0,y:0,scale:defaultScale()};automatic=true;ready=true;camera=followCamera(camera,focusPoint(),stage,view,true);}
    else {
      if(wasOverview)camera.scale=fitScale(stage,view);
      else if(automatic)camera.scale=defaultScale();
      camera=automatic?followCamera(camera,focusPoint(),stage,view,true):constrainCamera(camera,stage,view);
    }
    draw();
  }
  function zoomBy(factor,anchor={x:view.width/2,y:view.height/2}){
    automatic=false;camera=zoomCamera(camera,clamp(camera.scale*factor,fitScale(stage,view),2),anchor,stage,view);draw(true);
  }
  function showOverview(){automatic=false;camera=constrainCamera({x:0,y:0,scale:fitScale(stage,view)},stage,view);draw(true);}
  function locate(){automatic=true;camera=followCamera({...camera,scale:defaultScale()},focusPoint(),stage,view,true);draw(true);}
  const distance=points=>Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
  const midpoint=points=>({x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2});
  function pointerDown(e){
    if(e.button>0||pointers.size>=2||e.target.closest('.dc-camera-tools'))return;
    pointers.set(e.pointerId,localPoint(e));
    if(pointers.size===1){suppressClick=false;gesture={start:localPoint(e),camera:{...camera},dragged:false};}
    else if(pointers.size===2){const points=[...pointers.values()];gesture={pinch:distance(points),anchor:midpoint(points),camera:{...camera},dragged:true};suppressClick=true;}
  }
  function pointerMove(e){
    if(!pointers.has(e.pointerId)||!gesture)return;
    pointers.set(e.pointerId,localPoint(e));
    if(pointers.size===2){
      const points=[...pointers.values()],anchor=midpoint(points);
      const scale=clamp(gesture.camera.scale*distance(points)/Math.max(1,gesture.pinch),fitScale(stage,view),2);
      camera=zoomCamera(gesture.camera,scale,gesture.anchor,stage,view);
      camera=constrainCamera({...camera,x:camera.x+anchor.x-gesture.anchor.x,y:camera.y+anchor.y-gesture.anchor.y},stage,view);
      automatic=false;suppressClick=true;draw();e.preventDefault();return;
    }
    if(gesture.pinch)return;
    const p=localPoint(e),dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;
    if(Math.hypot(dx,dy)<8&&!gesture.dragged)return;
    gesture.dragged=true;suppressClick=true;
    if(large||camera.scale>fitScale(stage,view)+.01){
      automatic=false;camera=constrainCamera({...gesture.camera,x:gesture.camera.x+dx,y:gesture.camera.y+dy},stage,view);draw();
    }
    viewport.setPointerCapture?.(e.pointerId);e.preventDefault();
  }
  function pointerUp(e){
    if(!pointers.has(e.pointerId))return;
    if(gesture?.dragged&&!gesture.pinch&&!large&&camera.scale<=fitScale(stage,view)+.01){
      const p=localPoint(e),dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;
      if(Math.max(Math.abs(dx),Math.abs(dy))>=25)onSwipe(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');
    }
    pointers.delete(e.pointerId);
    if(!pointers.size)gesture=null;
    else gesture={pinch:true,dragged:true,camera:{...camera}};
  }
  const cancel=()=>{pointers.clear();gesture=null;suppressClick=false;};
  const unsubscribe=gameRuntime.subscribe(paused=>{if(paused)cancel();});
  const click=e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}};
  const wheel=e=>{e.preventDefault();zoomBy(e.deltaY<0?1.1:1/1.1,localPoint(e));};
  viewport.addEventListener('pointerdown',pointerDown);viewport.addEventListener('pointermove',pointerMove);
  viewport.addEventListener('pointerup',pointerUp);viewport.addEventListener('pointercancel',cancel);viewport.addEventListener('click',click,true);
  viewport.addEventListener('wheel',wheel,{passive:false});
  const observer=new ResizeObserver(()=>resize());observer.observe(viewport);
  const onResize=()=>resize(true);window.addEventListener('resize',onResize);
  return {
    setStage(nextCols,nextRows){
      cols=nextCols;rows=nextRows;stage={width:cols*40,height:rows*40};large=cols>9||rows>7;
      world.style.width=`${stage.width}px`;world.style.height=`${stage.height}px`;tools.hidden=!large;
      viewport.classList.toggle('dc-large-stage',large);ready=false;resize(true);
    },
    // Inspecting the map pauses tracking only until the next player action.
    resume(){automatic=true;},
    follow(point){if(!automatic)return;camera=followCamera(camera,point,stage,view);draw(true);},
    show(point){camera=followCamera(camera,point,stage,view,true);draw(true);},
    dispose(){unsubscribe();observer.disconnect();window.removeEventListener('resize',onResize);
      viewport.removeEventListener('pointerdown',pointerDown);viewport.removeEventListener('pointermove',pointerMove);
      viewport.removeEventListener('pointerup',pointerUp);viewport.removeEventListener('pointercancel',cancel);
      viewport.removeEventListener('click',click,true);viewport.removeEventListener('wheel',wheel);tools.remove();},
  };
}

import './vendor/matter-0.20.0.js';
import {parts,dimensions,direction,anchor,compatible,worldSize,WIDTH,HEIGHT,STEP,copy} from './machine-parts.js';
import {createDrive} from './machine-drive.js';
import {goalsOf,goalDuration,goalSatisfied} from './machine-goals.js';
import {ropePoints,ropeLength,solveRoutedRope} from './machine-rope.js';
import {createMechanisms,combustible,fusePoint,illuminates} from './machine-mechanisms.js';
const {Engine,Body,Bodies,Composite,Constraint,Query,Events}=globalThis.Matter;
const radians=a=>(a||0)*Math.PI/180;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function shape(p,options={}) {
  const {w,h}=dimensions(p),opts={friction:.08,frictionStatic:.12,frictionAir:.001,restitution:.35,...options};
  if(p.type==='elbow'){
    const body=Body.create({...opts,parts:[Bodies.rectangle(p.x-14,p.y-14,16,72,opts),Bodies.rectangle(p.x+14,p.y+14,72,16,opts)]});
    Body.setAngle(body,radians(p.angle));for(const bit of body.parts)bit.plugin.partId=p.id;return body;
  }
  const body=parts[p.type].r||p.type==='fishbowl'
    ? Bodies.circle(p.x,p.y,parts[p.type].r||25,opts)
    : Bodies.rectangle(p.x,p.y,w,h,{...opts,angle:radians(p.angle),chamfer:{radius:2}});
  if(p.type==='balloon')Body.scale(body,1,23/18);
  body.plugin.partId=p.id;
  return body;
}
// The same collision check is used by pointer drops, keyboard nudges and saves.
export function canPlace(part,others,target,{width:worldW=WIDTH,height:worldH=HEIGHT}={}) {
  if (!part || !Object.hasOwn(parts,part.type) || parts[part.type].link || ![part.x,part.y,part.angle??0].every(Number.isFinite)) return false;
  if((part.angle&&!parts[part.type].rotate)||(part.flip&&!parts[part.type].flip))return false;
  if(['seesaw','cannon'].includes(part.type)&&Math.abs(part.angle||0)>30)return false;
  const {w,h}=dimensions(part),angle=radians(part.angle);
  const bw=Math.abs(w*Math.cos(angle))+Math.abs(h*Math.sin(angle));
  const bh=Math.abs(w*Math.sin(angle))+Math.abs(h*Math.cos(angle));
  if(part.x-bw/2<6 || part.x+bw/2>worldW-6 || part.y-bh/2<10 || part.y+bh/2>worldH-12)return false;
  const test=shape(part,{isStatic:true});
  const collision=Query.collides(test,others.filter(p=>p.id!==part.id).map(p=>shape(p,{isStatic:true})))
    .some(c=>c.depth>3);
  if(collision)return false;
  if(goalsOf(target).some(t=>t.type==='cup'&&Math.abs(part.x-t.x)<t.w/2+w/2&&Math.abs(part.y-t.y)<t.h/2+h/2))return false;
  return true;
}
export function validateDraft(level,draft,{free=false}={}) {
  if(!draft || !Array.isArray(draft.pieces)||!Array.isArray(draft.links)||draft.pieces.length>40||draft.links.length>50)return false;
  const ids=new Set([...level.fixed,...(level.links||[])].map(p=>p.id)),counts={};
  const all=[...level.fixed];
  for(const p of draft.pieces){
    if(!p||typeof p.id!=='string'||p.id.length>60||ids.has(p.id)||!Object.hasOwn(parts,p.type)||parts[p.type].link||![p.x,p.y,p.angle??0].every(Number.isFinite)
      ||(p.angle??0)%15 || Math.abs(p.angle??0)>180 || !canPlace(p,all,level.target,worldSize(level)))return false;
    // Dimensions and all behavior flags belong to authored levels, never saves.
    if(Object.keys(p).some(k=>!['id','type','x','y','angle','flip'].includes(k)) || (p.flip!==undefined&&typeof p.flip!=='boolean'))return false;
    ids.add(p.id);all.push(p);counts[p.type]=(counts[p.type]||0)+1;
  }
  const links=new Set((level.links||[]).map(l=>[l.a,l.b].sort().join(':')+l.type));
  for(const l of draft.links){
    if(!l||typeof l.id!=='string'||l.id.length>60||ids.has(l.id)||Object.keys(l).some(k=>!['id','type','a','b','via'].includes(k))
      ||!['belt','rope','wire'].includes(l.type)||l.via!==undefined&&(!Array.isArray(l.via)||l.type!=='rope'||l.via.some(id=>typeof id!=='string'))
      ||!compatible(all.find(p=>p.id===l.a),all.find(p=>p.id===l.b),l.type,(l.via||[]).map(id=>all.find(p=>p.id===id))))return false;
    ids.add(l.id);
    const key=[l.a,l.b].sort().join(':')+l.type;
    if(links.has(key))return false;links.add(key);counts[l.type]=(counts[l.type]||0)+1;
  }
  return free || Object.entries(counts).every(([type,n])=>n<=(level.tools[type]||0));
}

export function createMachine(level,draft={pieces:[],links:[]}) {
  const {width:worldW,height:worldH}=worldSize(level);
  const engine=Engine.create({gravity:{x:0,y:1,scale:.001},positionIterations:8,velocityIterations:8});
  const entities=new Map(),connections=copy([...(level.links||[]),...draft.links]),events=[],effects=[];
  const goals=goalsOf(level.target),goalStates=goals.map(()=>({done:false,time:0}));
  let time=0,won=false,disposed=false,steps=0;
  const push=(type,e,extra={})=>{events.push({type,id:e?.id,time,...extra});if(events.length>200)events.shift();};
  const add=p=>{
    const e={...copy(p),base:{x:p.x,y:p.y},active:p.type==='candle'&&p.lit===true,spin:0,rotation:radians(p.angle),phase:0,warm:0,spent:false,bump:0,broken:false};
    const dynamic=!!parts[p.type].dynamic;
    if(!parts[p.type].link) {
      e.body=shape(p,{isStatic:!dynamic,restitution:parts[p.type].restitution??(p.type==='ball'?.22:p.type==='bowling'?.18:.12),frictionAir:p.type==='balloon'?.02:.001,
        density:parts[p.type].density??(p.type==='bowling'?.008:p.type==='balloon'?.0003:.0015)});
      if(['bucket','candle','rocket','balloon','dynamite'].includes(p.type))Body.setInertia(e.body,Infinity);
      Composite.add(engine.world,e.body);
    }
    entities.set(p.id,e);return e;
  };
  [...level.fixed,...draft.pieces].forEach(add);
  Composite.add(engine.world,Bodies.rectangle(worldW/2,worldH+1,worldW+80,20,{isStatic:true,friction:.15,restitution:.1}));
  for(const t of goals.filter(t=>t.type==='cup')) {
    Composite.add(engine.world,[Bodies.rectangle(t.x-t.w/2,t.y+3,8,t.h),Bodies.rectangle(t.x+t.w/2,t.y+3,8,t.h),Bodies.rectangle(t.x,t.y+t.h/2,t.w,9)]
      .map(b=>{Body.setStatic(b,true);return b;}));
  }
  for(const link of connections) {
    if(link.type!=='rope')continue;
    const a=entities.get(link.a),b=entities.get(link.b);if(!a||!b)continue;
    const A=anchor(a),B=anchor(b);
    link.span=ropeLength(ropePoints(link,entities));
    if(link.via?.length)continue;
    link.constraint=Constraint.create({bodyA:a.body,bodyB:b.body,
      pointA:a.body?{x:A.x-a.x,y:A.y-a.y}:A,pointB:b.body?{x:B.x-b.x,y:B.y-b.y}:B,
      length:dist(A,B)+5,stiffness:.82,damping:.04});
    Composite.add(engine.world,link.constraint);
  }
  const drive=createDrive(entities,connections);
  const moving=()=>[...entities.values()].filter(e=>e.body&&!e.body.isStatic&&!e.broken);
  function breakBowl(e){
    if(e.broken)return;e.broken=true;if(e.body)Composite.remove(engine.world,e.body);push('break',e);effects.push({type:e.type==='brick'?'rubble':'glass',x:e.x,y:e.y,at:time});
  }
  function ignite(e){
    if(e.active||e.spent||e.broken)return;
    e.warm+=STEP/1000;
    if(e.warm>=.65){e.active=true;e.started=time;push('ignite',e);}
  }
  function shot(e){
    if(e.spent)return;e.spent=true;e.active=true;e.started=time;push('shot',e);
    const id=`projectile-${e.id}`,d=direction(e);
    const bullet=add({id,type:'ball',x:e.x+d*40,y:e.y-5});
    bullet.projectile=true;bullet.radius=5;
    Body.scale(bullet.body,1/3,1/3);Body.setVelocity(bullet.body,{x:d*16,y:0});
  }
  function cutScissors(e){
    e.spent=true;e.started=time;push('cut',e);
    for(const l of connections){if(l.type!=='rope'||l.cut)continue;
      const points=ropePoints(l,entities);
      if(points.slice(1).some((b,i)=>{const a=points[i],u=clamp(((e.x-a.x)*(b.x-a.x)+(e.y-a.y)*(b.y-a.y))/Math.max(1,dist(a,b)**2),0,1);return dist(e,{x:a.x+u*(b.x-a.x),y:a.y+u*(b.y-a.y)})<34;})){
        l.cut=true;if(l.constraint)Composite.remove(engine.world,l.constraint);push('rope-cut',e);}
    }
  }
  const mechanisms=createMechanisms({entities,connections,engine,push,effects,add,breakPart:breakBowl,time:()=>time});
  function onImpact(a,b){
    const e=entities.get(a.plugin.partId),hit=entities.get(b.plugin.partId);if(!e||!hit||!hit.body||hit.body.isStatic||hit.broken)return;
    const dx=hit.body.position.x-a.position.x,dy=hit.body.position.y-a.position.y;
    const impactSpeed=Math.hypot(b.velocity.x-a.velocity.x,b.velocity.y-a.velocity.y);
    mechanisms.impact(e,hit,impactSpeed,dx,dy);
    if(e.type==='switch'&&!e.active&&dy<-10&&Math.abs(dx)<25&&b.velocity.y>=0){e.active=true;push('switch',e);}
    if(e.type==='bellows'&&!e.spent&&dx*direction(e)<-6&&dy<-dimensions(e).h/2&&b.velocity.y>=0){e.spent=true;e.started=time;push('bellows',e);}
    if(e.type==='fishbowl'&&!e.broken&&impactSpeed>1)breakBowl(e);
    if(e.type==='scissors'&&!e.spent&&impactSpeed>.5)cutScissors(e);
    if(e.type==='trampoline'&&time-(e.bounces?.get(hit.id)??-10)>.12){
      // Canvas and Matter angles both turn clockwise: a lower right edge
      // gives an upward/right-facing normal. Only the bed's front can launch.
      const angle=radians(e.angle),n={x:Math.sin(angle),y:-Math.cos(angle)},v=hit.body.velocity;
      const incoming=v.x*n.x+v.y*n.y;
      const front=(hit.body.position.x-e.body.position.x)*n.x+(hit.body.position.y-e.body.position.y)*n.y;
      if(incoming>=-.1||front<dimensions(e).h/2)return;
      const impulse=Math.max(9.5,-incoming*1.12)-incoming;
      // Reverse the normal component while preserving travel along the bed.
      Body.setVelocity(hit.body,{x:v.x+n.x*impulse,y:v.y+n.y*impulse});
      (e.bounces??=new Map()).set(hit.id,time);e.bump=time;push('bounce',e);
    }
  }
  const contacts=event=>{for(const pair of event.pairs){
    for(const b of [pair.bodyA,pair.bodyB]){const e=entities.get(b.plugin.partId);if(e?.projectile)e.spent=true;}
    onImpact(pair.bodyA,pair.bodyB);onImpact(pair.bodyB,pair.bodyA);
  }};
  Events.on(engine,'collisionStart collisionActive',contacts);
  const touching=(a,b)=>engine.pairs.list.some(pair=>pair.isActive&&
    (pair.bodyA===a.body&&pair.bodyB===b.body||pair.bodyB===a.body&&pair.bodyA===b.body));

  function wind(source,strength){
    const d=direction(source);
    for(const e of moving()) {
      if(e.id===source.id)continue;
      const dx=(e.x-source.x)*d,dy=e.y-source.y;
      if(dx>18&&dx<230&&Math.abs(dy)<55) {
        const factor=(1-dx/290)*(e.type==='balloon'?3:1);
        Body.applyForce(e.body,e.body.position,{x:d*e.body.mass*strength*factor,y:0});
      }
    }
    for(const e of entities.values()) {
      const dx=(e.x-source.x)*d;
      if(dx<20||dx>230||Math.abs(e.y-source.y)>65)continue;
      if(e.type==='windmill')e.drive=d*3;
      if(e.type==='candle'&&e.active){e.active=false;e.warm=0;e.coolUntil=time+.35;push('extinguish',e);}
    }
  }
  function tick() {
    if(disposed)return;
    time+=STEP/1000;steps++;
    for(const e of entities.values()) {
      if(e.body){e.x=e.body.position.x;e.y=e.body.position.y;e.rotation=e.body.angle;}
      if(parts[e.type]?.rotary){e.spin=0;e.drive=0;}
      if(e.type==='balloon')Body.applyForce(e.body,e.body.position,{x:0,y:-e.body.mass*.00112});
      if(e.projectile&&!e.spent)Body.applyForce(e.body,e.body.position,{x:0,y:-e.body.mass*.001});
      if(e.type==='rocket'&&e.active){
        Body.applyForce(e.body,e.body.position,{x:0,y:-e.body.mass*.0035});
        if(e.y<-80){e.spent=true;e.active=false;e.body.collisionFilter.mask=0;Body.setStatic(e.body,true);}
      }
    }
    const movers=moving();
    for(const e of entities.values()) {
      if(e.type==='bellows'&&e.spent&&time-e.started<.2)wind(e,.002);
    }
    for(const l of connections){
      if(l.type!=='rope'||l.cut)continue;
      const a=entities.get(l.a),b=entities.get(l.b);
      // Rope resists pulling apart, never pushes endpoints apart like a rod.
      const separation=ropeLength(ropePoints(l,entities));
      l.slack=Math.max(0,l.span+5-separation);
      if(l.constraint)l.constraint.stiffness=separation>l.span+4?.82:0;
      for(const [device,weight] of [[a,b],[b,a]]){
        if(!weight.body||weight.body.isStatic||separation<=l.span+4)continue;
        if(device.type==='light'&&!device.active){device.active=true;push('light',device);}
        if(device.type==='pistol')shot(device);
        if(device.type==='detonator')mechanisms.trigger(device);
      }
    }
    const lights=[...entities.values()].filter(e=>e.active&&['light','candle','flashlight'].includes(e.type));
    for(const e of entities.values())if(e.type==='solar')e.active=lights.some(l=>illuminates(l,e,135));
    const powered=e=>[...entities.values()].some(s=>['switch','solar','generator'].includes(s.type)&&s.active&&dist(e,s)<102);
    // Recompute from physical inputs every step. A closed belt circuit cannot
    // keep itself powered after its source goes away or start itself from rest.
    for(const e of entities.values())if(['generator','fan','motor'].includes(e.type))e.active=false;
    const windmills=[...entities.values()].filter(e=>e.type==='windmill'),gust=new Map(windmills.map(e=>[e.id,e.drive]));
    drive.reset();
    for(let pass=0;pass<=entities.size;pass++){
      const before=[...entities.values()].map(e=>`${e.active}:${e.spin}`).join(',');
      for(const e of windmills)e.drive=gust.get(e.id);
      for(const e of entities.values()){
        if(e.type==='fan'){
          e.active=powered(e);
          if(e.active)for(const w of windmills)if((w.x-e.x)*direction(e)>20&&(w.x-e.x)*direction(e)<230&&Math.abs(w.y-e.y)<65)w.drive=direction(e)*3;
        }
        if(e.type==='motor'){e.active=powered(e);e.drive=e.active?direction(e)*2.8:0;}
      }
      drive.update();
      for(const e of entities.values())if(e.type==='generator')e.active=!!e.spin;
      if(before===[...entities.values()].map(e=>`${e.active}:${e.spin}`).join(','))break;
    }
    for(const e of entities.values())if(e.type==='fan'&&e.active)wind(e,.00018);
    const heated=new Set();
    for(const e of entities.values()) {
      if(e.spin)e.phase+=e.spin*STEP/1000;
      if(e.type==='fan'&&e.active)e.phase+=16*STEP/1000;
      if(e.type==='conveyor'&&e.spin)for(const b of movers){
        if(b.y<e.y&&touching(e,b))
          Body.setVelocity(b.body,{x:direction(e)*Math.sign(e.spin)*2.5,y:b.body.velocity.y});
      }
      if(e.type==='lens'){
        e.active=false;e.focus=null;
        const lit=lights.some(l=>illuminates(l,e,155));
        if(lit)for(const f of entities.values()){
          const point=fusePoint(f);
          if(combustible(f)&&!f.active&&!f.spent&&!f.broken&&time>(f.coolUntil||0)
            &&(point.x-e.x)*direction(e)>0&&dist(e,point)<140&&Math.abs(point.y-e.y)<34){
            e.active=true;e.focus=point;heated.add(f.id);break;
          }
        }
      }
    }
    for(const e of entities.values())if(combustible(e)&&!e.active&&!e.spent&&!e.broken){
      if(heated.has(e.id))ignite(e);else e.warm=0;
    }
    mechanisms.tick();mechanisms.limitPivots();
    Engine.update(engine,STEP);
    mechanisms.after();
    for(const e of entities.values())if(e.body){e.x=e.body.position.x;e.y=e.body.position.y;e.rotation=e.body.angle;}
    for(const l of connections)if(l.type==='rope'&&!l.cut&&l.via?.length)solveRoutedRope(l,entities);
    mechanisms.limitPivots();
    if(goals.length&&!won){
      goals.forEach((goal,i)=>{const state=goalStates[i];if(state.done)return;
        state.time=goalSatisfied(goal,entities,events)?state.time+STEP/1000:0;
        if(state.time>goalDuration(goal))state.done=true;
      });
      if(goalStates.every(g=>g.done)){won=true;push('win');}
    }
  }
  return {entities,connections,events,effects,level,goalStates,get time(){return time;},get won(){return won;},get steps(){return steps;},
    step(n=1){for(let i=0;i<n;i++)tick();return won;},
    snapshot(){return [...entities.values()].map(({id,type,x,y,active,spin,broken,spent})=>({id,type,x,y,active,spin,broken,spent}));},
    dispose(){disposed=true;Events.off(engine);Composite.clear(engine.world,false);Engine.clear(engine);}};
}

import {dimensions,direction,STEP} from './machine-parts.js?v=48';
const dt=STEP/1000;
export const combustible=e=>['candle','rocket','cannon','dynamite'].includes(e.type);
export const fusePoint=e=>{
  if(e.type==='cannon'){const a=(e.angle||0)*Math.PI/180;return {x:e.x-26*direction(e)*Math.cos(a)+24*Math.sin(a),y:e.y-26*direction(e)*Math.sin(a)-24*Math.cos(a)};}
  return {x:e.x,y:e.y+(e.type==='rocket'?25:-18)};
};
export function illuminates(source,target,range){
  if(source.type!=='flashlight')return Math.hypot(source.x-target.x,source.y-target.y)<range;
  const dx=(target.x-source.x)*direction(source);
  return dx>18&&dx<260&&Math.abs(target.y-source.y)<22+dx*.12;
}

export function createMechanisms({entities,connections,engine,push,effects,add,breakPart,time}){
  const {Body,Bodies,Composite,Constraint,Query}=globalThis.Matter;
  const breaches=new Map();
  for(const e of entities.values())if(e.type==='seesaw'){
    e.pivot=Constraint.create({bodyA:e.body,pointA:{x:0,y:0},pointB:{...e.base},length:0,stiffness:1,damping:.05});
    Composite.add(engine.world,e.pivot);
  }
  function trigger(e){
    if(e.spent||e.broken)return;
    if(e.type==='flashlight'){if(!e.active){e.active=true;push('flashlight',e);}return;}
    if(e.type==='detonator'){
      e.spent=true;e.active=true;e.started=time();push('detonate',e);
      for(const l of connections)if(l.type==='wire'&&[l.a,l.b].includes(e.id)){
        const target=entities.get(l.a===e.id?l.b:l.a);
        if(target?.type==='dynamite'&&!target.spent){target.active=true;target.started=time();push('ignite',target);}
      }return;
    }
    if(e.type==='boxing'){e.spent=true;e.active=true;e.started=time();e.hitIds=new Set();push('punch',e);}
  }
  function explode(e){
    if(e.broken)return;e.spent=true;e.active=false;e.broken=true;
    Composite.remove(engine.world,e.body);push('explode',e);effects.push({type:'blast',x:e.x,y:e.y,at:time()});
    for(const other of entities.values()){
      if(other.id===e.id||other.broken)continue;
      const dx=other.x-e.x,dy=other.y-e.y,d=Math.hypot(dx,dy);
      if(d>145)continue;
      if(['brick','fishbowl'].includes(other.type)&&d<125){breakPart(other);continue;}
      if(other.type==='dynamite'&&!other.active){other.active=true;other.started=time();push('ignite',other);}
      if(other.body&&!other.body.isStatic){
        const force=(1-d/150)*12/Math.sqrt(Math.max(.5,other.body.mass));
        Body.setVelocity(other.body,{x:other.body.velocity.x+dx/Math.max(10,d)*force,y:other.body.velocity.y+dy/Math.max(10,d)*force});
      }
    }
  }
  function fire(e){
    if(e.spent)return;e.spent=true;e.started=time();push('cannon',e);
    const a=(e.angle||0)*Math.PI/180,d=direction(e),nx=Math.cos(a)*d,ny=Math.sin(a)*d;
    const ball=add({id:`cannonball-${e.id}`,type:'cannonball',x:e.x+nx*64,y:e.y+ny*64-8});
    ball.launched=true;Body.setVelocity(ball.body,{x:nx*12,y:ny*12});
    effects.push({type:'smoke',x:ball.x,y:ball.y,at:time()});
  }
  function impact(e,hit,speed,dx,dy){
    if(e.type==='brick'&&!e.broken&&speed*hit.body.mass>42){breaches.set(hit.id,{x:hit.body.velocity.x*.65,y:hit.body.velocity.y*.65});breakPart(e);}
    if(e.type==='flashlight'&&!e.active&&dy<-10&&Math.abs(dx)<31&&hit.body.velocity.y>=0)trigger(e);
    if(e.type==='detonator'&&!e.spent&&dy<-15&&Math.abs(dx)<28&&hit.body.velocity.y>=0)trigger(e);
    if(e.type==='boxing'&&!e.spent&&dx*direction(e)<-18&&Math.abs(dy)<32&&speed>.35)trigger(e);
  }
  function strike(e,rect,velocity){
    const test=Bodies.rectangle(rect.x,rect.y,rect.w,rect.h,{isStatic:true});
    for(const hit of entities.values()){
      if(!hit.body||hit.body.isStatic||hit.broken||hit.id===e.id||e.hitIds?.has(hit.id))continue;
      if(!Query.collides(test,[hit.body]).length)continue;
      if(e.type==='jack'&&hit.y>rect.y)continue;
      Body.setVelocity(hit.body,velocity(hit));if(e.hitIds==null)e.hitIds=new Set();e.hitIds.add(hit.id);push('launch',e,{target:hit.id});
    }
  }
  function tick(){
    for(const e of entities.values()){
      if(e.broken)continue;
      if(e.type==='cannon'&&e.active&&!e.spent)fire(e);
      if(e.type==='dynamite'&&e.active&&time()-e.started>=.7)explode(e);
      if(e.type==='jack'&&!e.spent){
        e.charge=(e.charge||0)+Math.abs(e.spin)*dt;
        if(e.charge>=Math.PI*2){e.spent=true;e.active=true;e.started=time();e.hitIds=new Set();push('spring',e);}
      }
      if(e.type==='boxing'&&e.spent){
        const elapsed=time()-e.started,reach=elapsed<.13?elapsed/.13:Math.max(0,1-(elapsed-.13)/.18);
        e.extension=Math.min(1,reach)*90;
        if(elapsed<.14)strike(e,{x:e.x+direction(e)*(18+e.extension),y:e.y,w:27,h:30},hit=>({x:direction(e)*10,y:Math.min(hit.body.velocity.y,-1.5)}));
        if(elapsed>.31)e.active=false;
      }
      if(e.type==='jack'&&e.spent){
        const elapsed=time()-e.started;e.extension=elapsed<.16?elapsed/.16*85:Math.max(0,85*(1-(elapsed-.16)/.45));
        if(elapsed<.18)strike(e,{x:e.x,y:e.y-32-e.extension,w:62,h:14},()=>({x:direction(e)*1.5,y:-12}));
        if(elapsed>.65)e.active=false;
      }
    }
  }
  function limitPivots(){
    for(const e of entities.values())if(e.type==='seesaw'){
      const limit=Math.PI/6;if(Math.abs(e.body.angle)>limit){Body.setAngle(e.body,Math.sign(e.body.angle)*limit);if(e.body.angularVelocity*e.body.angle>0)Body.setAngularVelocity(e.body,0);}
      e.x=e.body.position.x;e.y=e.body.position.y;e.rotation=e.body.angle;
    }
  }
  function after(){for(const [id,v]of breaches){const e=entities.get(id);if(e?.body&&!e.broken)Body.setVelocity(e.body,v);}breaches.clear();}
  return {impact,trigger,tick,limitPivots,explode,after};
}

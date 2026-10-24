import {anchor} from './machine-parts.js?v=46';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function ropePoints(link,pieces){
  const get=id=>pieces instanceof Map?pieces.get(id):pieces.find(p=>p.id===id);
  const a=get(link.a),b=get(link.b),via=(link.via||[]).map(get);
  return !a||!b||via.some(p=>!p)?[]:[anchor(a),...via.map(p=>({x:p.x,y:p.y})),anchor(b)];
}
export const ropeLength=points=>points.slice(1).reduce((sum,p,i)=>sum+distance(p,points[i]),0);

// One rope has one total length, even across several fixed wheels. Independent
// constraints on each leg would pin both weights instead of transferring motion.
export function solveRoutedRope(link,entities){
  const {Body}=globalThis.Matter;
  const sync=e=>{e.x=e.body.position.x;e.y=e.body.position.y;e.rotation=e.body.angle;};
  let tension=0;
  for(let pass=0;pass<6;pass++){
    const points=ropePoints(link,entities),length=ropeLength(points),excess=length-link.span-5;
    if(excess<=0)break;
    const end=(id,p,next)=>{
      const e=entities.get(id),body=e.body,dx=p.x-next.x,dy=p.y-next.y,d=Math.max(.001,distance(p,next));
      const gx=dx/d,gy=dy/d,rx=p.x-body.position.x,ry=p.y-body.position.y,cross=rx*gy-ry*gx;
      const im=body.isStatic||e.type==='seesaw'?0:body.inverseMass,ii=body.isStatic?0:body.inverseInertia;
      return {e,body,gx,gy,cross,im,ii,weight:im+cross*cross*ii};
    };
    const ends=[end(link.a,points[0],points[1]),end(link.b,points.at(-1),points.at(-2))];
    const inverseMass=ends.reduce((sum,e)=>sum+e.weight,0);if(inverseMass<1e-10)break;
    const correction=excess*.9/inverseMass;
    const speed=ends.reduce((sum,e)=>sum+e.gx*e.body.velocity.x+e.gy*e.body.velocity.y+e.cross*e.body.angularVelocity,0);
    for(const e of ends){
      if(e.im){Body.setPosition(e.body,{x:e.body.position.x-e.gx*correction*e.im,y:e.body.position.y-e.gy*correction*e.im});}
      if(e.ii)Body.setAngle(e.body,e.body.angle-e.cross*correction*e.ii);
      if(speed>0){
        if(e.im)Body.setVelocity(e.body,{x:e.body.velocity.x-e.gx*speed*e.im/inverseMass,y:e.body.velocity.y-e.gy*speed*e.im/inverseMass});
        if(e.ii)Body.setAngularVelocity(e.body,e.body.angularVelocity-e.cross*speed*e.ii/inverseMass);
      }sync(e.e);
    }tension=Math.max(tension,excess);
  }
  link.tension=tension;link.slack=Math.max(0,link.span+5-ropeLength(ropePoints(link,entities)));
  for(const id of link.via||[]){const e=entities.get(id);e.phase+=(entities.get(link.a).body.velocity.y||0)*.01;}
}

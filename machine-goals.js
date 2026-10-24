import {parts} from './machine-parts.js?v=46';
export const goalsOf=target=>!target?[]:target.type==='all'?target.goals.flatMap(goalsOf):[target];
export const goalDuration=goal=>goal.type==='cup'?.45:['zone','activate','extinguish'].includes(goal.type)?.2:0;
export function goalSatisfied(goal,entities,events=[]){
  const entity=goal.id?entities.get(goal.id):null;
  if(goal.type==='break')return !!entity?.broken;
  if(goal.type==='activate')return !!(entity?.active||entity?.spin);
  if(goal.type==='extinguish')return !!entity&&!entity.active&&events.some(e=>e.type==='extinguish'&&e.id===goal.id);
  return [...entities.values()].some(e=>{
    if(!e.body||e.body.isStatic||e.broken||e.projectile||goal.entity&&e.id!==goal.entity)return false;
    if(goal.type==='cup')return ['ball','bowling','tennis','baseball','cannonball'].includes(e.type)&&(!goal.accept||goal.accept===e.type)&&Math.abs(e.x-goal.x)<goal.w/2-(['ball','bowling'].includes(e.type)?13:parts[e.type].r)&&e.y>goal.y-goal.h/2+10&&e.y<goal.y+goal.h/2-8&&e.body.speed<2;
    if(goal.type==='ring')return e.type===(goal.accept||'balloon')&&Math.hypot(e.x-goal.x,e.y-goal.y)<goal.w/2-10;
    if(goal.type==='zone')return e.type===(goal.accept||'bucket')&&Math.abs(e.x-goal.x)<goal.w/2&&Math.abs(e.y-goal.y)<goal.h/2;
    return false;
  });
}

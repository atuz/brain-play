// Verification routes for the original maps, independent of the UI. They never
// teleport creatures, change terrain directly, add skills or change the result.
import {createLemmingState,startLemmings,tickLemmings,assignLemming,recallLemmings} from '../lemmings-engine.js';
const one=(skill,x,y,dir=1,id=1)=>({skill,x,y,dir,id});
const all=skill=>({skill,all:true});
export const rescueRoutes=[
 [one('digger',[98,104],[68,68])],
 [one('basher',[163,167],[126,126])],
 [all('floater')],
 [all('climber')],
 [one('builder',[150,154],[126,126])],
 [one('blocker',[238,242],[126,126])],
 [one('miner',[110,114],[90,90])],
 [one('blocker',[138,142],[80,80]),{skill:'bomber',id:1,action:'block'}],
 [one('builder',[138,142],[160,160]),one('basher',[315,319],[160,160])],
 [all('climber'),all('floater')],
 [one('basher',[259,263],[160,160])],
 [all('floater'),one('builder',[158,162],[74,74])],
 [one('builder',[200,204],[160,160])],
 [one('builder',[222,226],[160,160]),one('basher',[369,373],[160,160])],
 [one('miner',[112,116],[82,82]),one('builder',[290,294],[182,182])],
 [all('floater'),one('blocker',[256,260],[180,180])],
 [one('basher',[189,193],[174,174]),one('builder',[404,408],[174,174]),one('basher',[625,629],[174,174])],
 [one('digger',[128,132],[68,68]),one('digger',[258,262],[120,120]),one('builder',[452,456],[184,184])],
 [{skill:'climber',id:1},{skill:'climber',id:2},one('builder',[260,264],[174,174]),one('blocker',[650,654],[174,174]),one('basher',[552,556],[174,174],-1,2),{skill:'bomber',id:1,action:'block',after:'basher'}],
 [one('builder',[220,224],[178,178]),one('builder',[380,384],[178,178]),one('basher',[573,577],[178,178])],
 [all('floater'),one('digger',[138,142],[70,70]),one('builder',[420,424],[176,176])],
 [one('blocker',[138,142],[82,82]),{skill:'bomber',id:1,action:'block'},one('digger',[278,282],[132,132],1,2),one('builder',[528,532],[190,190],1,2)],
 [one('builder',[200,204],[176,176]),one('builder',[450,454],[176,176]),one('basher',[599,603],[176,176]),one('builder',[720,724],[176,176])],
 [one('miner',[138,142],[78,78]),one('builder',[240,244],[174,174]),one('builder',[380,384],[174,174]),one('builder',[614,618],[174,174]),one('basher',[813,817],[174,174])],
];
export function runRescueRoute(level,route=rescueRoutes[Number(level.id.slice(1))-1]){
 const s=createLemmingState(level),pending=route.map(r=>({...r,done:false,ids:new Set()})),log=[];startLemmings(s);
 while(s.phase==='playing'){
  for(const task of pending){
   if(task.done||(task.after&&!log.some(v=>v.skill===task.after)))continue;
   const candidates=s.agents.filter(a=>(task.all||a.id===(task.id||1))&&!task.ids.has(a.id)
    &&(!task.action||a.action===task.action)&&(!task.x||(a.x>=task.x[0]&&a.x<=task.x[1]))
    &&(!task.y||(a.y>=task.y[0]&&a.y<=task.y[1]))&&(!task.dir||a.dir===task.dir));
   for(const a of candidates){const result=assignLemming(s,a.id,task.skill);if(result.ok){task.ids.add(a.id);if(!task.all)task.done=true;log.push({tick:s.tick,id:a.id,skill:task.skill,x:a.x,y:a.y,dir:a.dir});}}
  }
  if(s.saved>=level.need&&s.agents.length&&s.agents.every(a=>a.action==='block'))recallLemmings(s);
  tickLemmings(s,level);
 }
 return {state:s,log,pending:pending.filter(t=>!t.all&&!t.done).map(({skill,x,y,dir,id})=>({skill,x,y,dir,id}))};
}

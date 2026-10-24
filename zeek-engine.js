// Original grid simulation. One deterministic beat, shared by thinking/realtime UI.
export const gardenDirections={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
const directions=Object.keys(gardenDirections);
export const gardenTypes=['wall','barrel','stone','apple','rotten','flower','poison','goal','toxic','key','door','egg','pill','chest','crystal','bomb','plant','laser','grazer'];
const pushable=new Set(['stone','apple','rotten','crystal','bomb']);
const edible=new Set(['apple','rotten','flower','poison','goal','toxic','egg','pill','plant']);
const immune=new Set(['wall','barrel','stone','crystal']);
export const gardenCopy=value=>JSON.parse(JSON.stringify(value));
const at=(s,x,y)=>s.objects.find(o=>o.x===x&&o.y===y);
const near=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1;
export function createGardenState(level){return {version:1,player:{...level.player,dir:'down',invisible:0},objects:level.objects.map((o,i)=>({id:`o${i}`,timer:0,...gardenCopy(o)})),moves:0,score:0,beat:0,phase:'playing',cause:'',effects:[]};}
export function validGardenState(s,l){
  if(!s||s.version!==1||!['playing','won','lost'].includes(s.phase)||!s.player||!Array.isArray(s.objects)||s.objects.length>l.w*l.h||!['moves','score','beat'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0))return false;
  const inside=o=>Number.isInteger(o.x)&&Number.isInteger(o.y)&&o.x>=0&&o.x<l.w&&o.y>=0&&o.y<l.h;
  if(!inside(s.player)||!directions.includes(s.player.dir)||!Number.isInteger(s.player.invisible)||s.player.invisible<0||s.player.invisible>1000||!Number.isInteger(s.keys??0)||(s.keys??0)<0)return false;
  const ids=new Set(),positions=new Set();
  for(const o of s.objects){const p=`${o.x},${o.y}`;if(!inside(o)||!gardenTypes.includes(o.type)||typeof o.id!=='string'||ids.has(o.id)||positions.has(p)||!Number.isInteger(o.timer)||o.timer<0||o.timer>1000)return false;if(o.type==='plant'&&!['bud','opening','open','digest'].includes(o.state))return false;if(o.type==='grazer'&&!directions.includes(o.dir))return false;ids.add(o.id);positions.add(p);}
  // Fixed terrain cannot be removed or moved through an edited/corrupt save.
  return l.objects.filter(o=>immune.has(o.type)&&o.type!=='stone'&&o.type!=='crystal').every(o=>s.objects.some(p=>p.type===o.type&&p.x===o.x&&p.y===o.y))&&(!at(s,s.player.x,s.player.y)||s.phase==='lost'&&s.cause==='grazer'&&at(s,s.player.x,s.player.y)?.type==='grazer');
}
export function gardenStep(level,input,action='wait'){
  if(input.phase!=='playing'||!['wait',...directions].includes(action))return {state:input,changed:false,events:[]};
  const s=gardenCopy(input),events=[],p=s.player; s.effects=[];if(s.keys==null)s.keys=0;
  const event=(type,data={})=>{const e={type,...data};events.push(e);s.effects.push(e);};
  const remove=o=>{const i=s.objects.indexOf(o);if(i>=0)s.objects.splice(i,1);};
  const die=cause=>{if(s.phase==='playing'){s.phase='lost';s.cause=cause;event('death',{cause,x:p.x,y:p.y});}};
  const valid=(x,y)=>x>=0&&y>=0&&x<level.w&&y<level.h;
  const setMove=(o,x,y)=>{const from={x:o.x,y:o.y};o.x=x;o.y=y;event('move',{id:o.id??'player',from,to:{x,y}});};
  if(action!=='wait'){
    const [dx,dy]=gardenDirections[action],x=p.x+dx,y=p.y+dy,o=at(s,x,y);p.dir=action;
    if(!valid(x,y))return {state:input,changed:false,events:[]};
    if(o&&pushable.has(o.type)){
      const nx=x+dx,ny=y+dy;
      if(!valid(nx,ny)||at(s,nx,ny)||(o.type==='crystal'&&o.timer))return {state:input,changed:false,events:[]};
      setMove(o,nx,ny);if(o.type==='bomb'&&!o.timer){o.timer=8;event('ignite',{id:o.id});}
    }else if(o){
      if(o.type==='door'&&s.keys){s.keys--;remove(o);event('unlock',{x,y});}
      else if(['flower','poison','goal','toxic','key','egg','pill','chest'].includes(o.type)){
        remove(o);event('pickup',{kind:o.type,x,y});
        if(o.type==='flower')s.score+=50;
        if(o.type==='poison'||o.type==='toxic')die('poison');
        if(o.type==='key')s.keys++;
        if(o.type==='chest')s.score+=1000;
        if(o.type==='pill')p.invisible+=14;
        if(o.type==='egg'){s.score+=100;for(const f of s.objects)if(['flower','poison'].includes(f.type))f.type=f.type==='flower'?'poison':'flower';}
        if(o.type==='goal'){s.score+=500;s.phase='won';event('win',{x,y});}
      }else if(o.type==='grazer'){die('grazer');}
      else return {state:input,changed:false,events:[]};
    }
    setMove(p,x,y);s.moves++;
  }
  s.beat++;
  if(s.phase!=='playing')return {state:s,changed:true,events};
  // Existing countdowns finish before newly triggered items start their countdown.
  const due=[],ignited=new Set(events.filter(e=>e.type==='ignite').map(e=>e.id));
  for(const o of [...s.objects])if(o.timer>0&&!ignited.has(o.id)){o.timer--;if(o.timer===0)due.push(o);}
  for(const o of due){
    if(!s.objects.includes(o))continue;
    if(o.type==='crystal'){remove(o);s.score+=200;event('spark',{x:o.x,y:o.y});}
    if(o.type==='plant'){o.state=o.state==='opening'?'open':'bud';event('plant',{id:o.id,state:o.state});}
    if(o.type==='bomb'){
      remove(o);event('blast',{x:o.x,y:o.y});
      for(const [dx,dy]of [[0,0],...Object.values(gardenDirections)]){
        const x=o.x+dx,y=o.y+dy,target=at(s,x,y);
        if(p.x===x&&p.y===y)die('bomb');
        if(target){if(target.type==='bomb'){if(!target.timer){target.timer=8;event('ignite',{id:target.id});}}else if(!immune.has(target.type)){remove(target);event('destroy',{id:target.id,x,y});}}
      }
    }
  }
  // Adjacent crystals latch together and may no longer be pushed.
  const unlit=s.objects.filter(o=>o.type==='crystal'&&!o.timer);
  const activate=new Set();for(const a of unlit)for(const b of unlit)if(a!==b&&near(a,b)){activate.add(a);activate.add(b);}
  for(const o of activate){o.timer=2;event('charge',{id:o.id});}
  for(const o of s.objects.filter(o=>o.type==='plant')){
    const playerNearby=near(o,p)&&p.invisible===0&&s.phase==='playing';
    if(o.state==='bud'&&playerNearby){o.state='opening';o.timer=2;event('plant',{id:o.id,state:'opening'});}
    else if(o.state==='open'){
      if(playerNearby){die('plant');o.state='digest';o.timer=0;event('grab',{id:o.id,target:{x:p.x,y:p.y}});}
      else {const food=s.objects.find(a=>['apple','rotten'].includes(a.type)&&near(o,a));if(food){remove(food);o.state='digest';o.timer=food.type==='rotten'?24:7;event('grab',{id:o.id,target:{x:food.x,y:food.y},food:food.type});}}
    }
  }
  // Predictable autonomous patrol: forward, left, right, reverse. One cell per beat.
  for(const o of s.objects.filter(o=>o.type==='grazer')){
    const d=directions.indexOf(o.dir);for(const delta of [0,3,1,2]){
      const dir=directions[(d+delta)%4],[dx,dy]=gardenDirections[dir],x=o.x+dx,y=o.y+dy,target=at(s,x,y);
      if(!valid(x,y)||target&&!edible.has(target.type))continue;
      o.dir=dir;if(target){remove(target);event('eat',{x,y,kind:target.type});}setMove(o,x,y);
      if(p.x===x&&p.y===y)die('grazer');break;
    }
  }
  for(const o of s.objects.filter(o=>o.type==='laser'))for(const [dx,dy]of Object.values(gardenDirections)){
    const cells=[];for(let x=o.x+dx,y=o.y+dy;valid(x,y);x+=dx,y+=dy){
      if(at(s,x,y))break;cells.push({x,y});
      if(x===p.x&&y===p.y&&p.invisible===0){event('beam',{from:{x:o.x,y:o.y},to:{x,y}});die('laser');break;}
    }
  }
  if(p.invisible>0)p.invisible--;
  // If the patrol ate or a bomb destroyed the only goal, make failure explicit.
  if(s.phase==='playing'&&!s.objects.some(o=>o.type==='goal'))die('goal');
  return {state:s,changed:true,events};
}
export function gardenDanger(level,s){
  const cells=new Map(),add=(x,y,kind)=>{if(x>=0&&y>=0&&x<level.w&&y<level.h&&!at(s,x,y))cells.set(`${x},${y}`,{x,y,kind});};
  for(const o of s.objects){
    if(o.type==='plant'&&['open','opening'].includes(o.state))for(const [dx,dy]of Object.values(gardenDirections))add(o.x+dx,o.y+dy,'plant');
    if(o.type==='bomb'&&o.timer>0)for(const [dx,dy]of [[0,0],...Object.values(gardenDirections)])add(o.x+dx,o.y+dy,'bomb');
    if(o.type==='laser')for(const [dx,dy]of Object.values(gardenDirections))for(let x=o.x+dx,y=o.y+dy;x>=0&&y>=0&&x<level.w&&y<level.h&&!at(s,x,y);x+=dx,y+=dy)add(x,y,'laser');
  }return [...cells.values()];
}

// A blocked command cannot stop the clock in real time.
export function gardenRealtimeStep(level,state,action='wait'){const result=gardenStep(level,state,action);return result.changed?result:gardenStep(level,state,'wait');}

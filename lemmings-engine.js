// Original rescue-puzzle simulation. Coordinates are terrain pixels; y is the
// first ground pixel under a creature's feet. No wall-clock time enters the model.
export const LEM_FPS=30;
export const lemmingSkills=['climber','floater','blocker','builder','basher','miner','digger','bomber'];
const actions=new Set(['walk','fall','float','climb','hoist','block','build','bash','mine','dig','shrug','exit','dead','gone']);
export const copyLemmings=value=>JSON.parse(JSON.stringify(value));
export function terrainAt(s,x,y){x=Math.floor(x);y=Math.floor(y);return x<0||x>=s.width||y<0||y>=s.height?0:s.terrain[y*s.width+x];}
function fill(s,x,y,w,h,value,emptyOnly=false){
  for(let yy=Math.max(0,Math.floor(y));yy<Math.min(s.height,y+h);yy++)for(let xx=Math.max(0,Math.floor(x));xx<Math.min(s.width,x+w);xx++){
    const p=yy*s.width+xx;if(!emptyOnly||!s.terrain[p])s.terrain[p]=value;
  }s.terrainRevision++;
}
function region(x,y,w,h){return {x,y,w,h};}
function probe(s,r,predicate){for(let yy=Math.max(0,r.y|0);yy<Math.min(s.height,r.y+r.h);yy++)for(let xx=Math.max(0,r.x|0);xx<Math.min(s.width,r.x+r.w);xx++)if(predicate(terrainAt(s,xx,yy)))return true;return false;}
function forbidden(value,dir=0){return value===2||(dir>0&&value===3)||(dir<0&&value===4);}
function carve(s,r,dir=0){
  if(probe(s,r,v=>forbidden(v,dir)))return false;
  fill(s,r.x,r.y,r.w,r.h,0);return true;
}
export function createLemmingState(level){
  const s={version:1,revision:level.revision||1,level:level.id,width:level.width,height:level.height,terrain:new Uint8Array(level.width*level.height),terrainRevision:0,
    tick:0,phase:'ready',released:0,saved:0,lost:0,nextSpawn:24,interval:level.interval||24,time:level.time*LEM_FPS,
    stock:Object.fromEntries(lemmingSkills.map(k=>[k,level.skills[k]||0])),agents:[],hazards:level.hazards.map(()=>0),retired:false,used:0,effects:[]};
  for(const [x,y,w,h,material=1]of level.terrain)fill(s,x,y,w,h,material);
  return s;
}
function change(a,action){a.action=action;a.frame=0;}
function effect(s,type,x,y){s.effects.push({type,x,y,age:0});}
function die(s,a,cause){if(['dead','gone','exit'].includes(a.action))return;change(a,'dead');a.cause=cause;effect(s,cause,a.x,a.y);}
function walk(a){change(a,'walk');a.fallen=0;a.velocity=0;}
function fall(a){change(a,'fall');a.fallen=0;a.velocity=0;}
function skillRect(a,skill){
  if(skill==='basher')return region(a.dir>0?a.x+2:a.x-12,a.y-13,11,13);
  if(skill==='miner')return region(a.dir>0?a.x-4:a.x-11,a.y-12,16,14);
  return region(a.x-5,a.y,11,3);
}
export function lemmingAssignment(s,id,skill){
  const a=s.agents.find(a=>a.id===id);
  if(!lemmingSkills.includes(skill)||!a||['dead','gone','exit'].includes(a.action)||!['playing','ready'].includes(s.phase))return {ok:false,reason:'请点仍在场上的小旅鼠。'};
  if(!s.stock[skill])return {ok:false,reason:'这个技能用完了。'};
  if((skill==='climber'&&a.climber)||(skill==='floater'&&a.floater)||(skill==='bomber'&&a.bomb>=0))return {ok:false,reason:'它已经有这个能力了。'};
  if(['climber','floater','bomber'].includes(skill))return {ok:true};
  if(a.action===({blocker:'block',builder:'build',basher:'bash',miner:'mine',digger:'dig'}[skill]))return {ok:false,reason:'它正在做这个动作。'};
  if(!terrainAt(s,a.x,a.y)||['fall','float','climb','hoist','block'].includes(a.action))return {ok:false,reason:'这个动作要站在地面上才能做。'};
  if(skill==='blocker'&&s.agents.some(b=>b!==a&&b.action==='block'&&Math.abs(b.x-a.x)<18&&Math.abs(b.y-a.y)<10))return {ok:false,reason:'离另一只阻挡者太近了。'};
  if(skill==='builder'&&(terrainAt(s,a.x,a.y-17)||terrainAt(s,a.x+a.dir*5,a.y-15)))return {ok:false,reason:'头顶太低，无法搭桥。'};
  if(['basher','miner','digger'].includes(skill)){
    const r=skillRect(a,skill),dir=skill==='digger'?0:a.dir;
    if(probe(s,r,v=>forbidden(v,dir)))return {ok:false,reason:'钢板不能挖；箭头墙只能顺着箭头挖。'};
    if(!probe(s,r,v=>v>0))return {ok:false,reason:'这个方向没有可挖的泥土。'};
  }
  return {ok:true};
}
export function assignLemming(s,id,skill){
  const check=lemmingAssignment(s,id,skill);if(!check.ok)return check;
  const a=s.agents.find(a=>a.id===id);s.stock[skill]--;s.used++;
  if(skill==='climber'||skill==='floater')a[skill]=true;
  else if(skill==='bomber')a.bomb=5*LEM_FPS;
  else{change(a,{blocker:'block',builder:'build',basher:'bash',miner:'mine',digger:'dig'}[skill]);if(skill==='builder')a.bricks=12;}
  effect(s,'assign',a.x,a.y-10);return {ok:true};
}
export function startLemmings(s){if(s.phase==='ready')s.phase='playing';}
export function recallLemmings(s){if(s.phase!=='playing')return;s.retired=true;let delay=0;for(const a of s.agents)if(!['exit','dead','gone'].includes(a.action)&&a.bomb<0)a.bomb=90+(delay++*3);}
function explode(s,a){
  for(let y=a.y-26;y<a.y+8;y++)for(let x=a.x-17;x<a.x+18;x++)if((x-a.x)**2+(y-a.y+9)**2<17**2&&terrainAt(s,x,y)!==2&&x>=0&&x<s.width&&y>=0&&y<s.height)s.terrain[y*s.width+x]=0;
  s.terrainRevision++;die(s,a,'blast');
}
function gravity(s,a){
  if(a.action==='fall'&&a.floater&&a.fallen>20)change(a,'float');
  const dy=a.action==='float'?1:(a.velocity=Math.min(3,a.velocity+.35));
  a.fallRemainder=(a.fallRemainder||0)+dy;let steps=Math.floor(a.fallRemainder);a.fallRemainder-=steps;
  while(steps-->0){
    if(terrainAt(s,a.x,a.y+1)){a.y++;if(a.action!=='float'&&a.fallen>64)die(s,a,'splat');else walk(a);return;}
    a.y++;a.fallen++;
  }
}
function stepAgent(s,a,level){
  a.frame++;
  if(a.action==='gone')return;
  if(a.action==='dead'){if(a.frame>=20){a.action='gone';s.lost++;}return;}
  if(a.action==='exit'){if(a.frame>=16){a.action='gone';s.saved++;effect(s,'saved',a.x,a.y);}return;}
  if(a.bomb>=0&&--a.bomb===0){explode(s,a);return;}
  if(a.y>s.height+10||a.x<2||a.x>=s.width-2){die(s,a,'fallout');return;}
  for(let i=0;i<level.hazards.length;i++){
    const h=level.hazards[i];
    if(a.x>=h.x&&a.x<h.x+h.w&&a.y>=h.y&&a.y<=h.y+h.h&&!s.hazards[i]){
      if(h.type==='trap')s.hazards[i]=45;die(s,a,h.type);return;
    }
  }
  const exit=level.exit;if(Math.abs(a.x-exit.x)<9&&Math.abs(a.y-exit.y)<8){change(a,'exit');return;}
  if(['fall','float'].includes(a.action)){gravity(s,a);return;}
  if(a.action==='block'){if(!terrainAt(s,a.x,a.y))fall(a);return;}
  if(a.action==='hoist'){if(a.frame>=8)walk(a);return;}
  if(a.action==='climb'){
    if(terrainAt(s,a.x,a.y-17)){a.dir*=-1;fall(a);return;}
    const front=a.x+a.dir*4;
    if(!terrainAt(s,front,a.y-13)){
      let top=a.y;for(let y=a.y-13;y<=a.y;y++)if(terrainAt(s,front,y)){top=y;break;}
      a.x+=a.dir*7;a.y=top;change(a,'hoist');return;
    }
    a.y--;return;
  }
  if(a.action==='shrug'){if(a.frame>=12)walk(a);return;}
  if(a.action==='build'){
    if(a.frame%10===5){
      const nx=a.x+a.dir*4,ny=a.y-2;
      if(terrainAt(s,nx,ny-1)||terrainAt(s,nx,ny-13)||terrainAt(s,a.x,a.y-16)){walk(a);return;}
      fill(s,a.dir>0?a.x-1:a.x-6,ny,8,2,1,true);a.x=nx;a.y=ny;a.bricks--;
      effect(s,'brick',a.x,a.y);
      if(a.bricks<=0)change(a,'shrug');
    }return;
  }
  if(['bash','mine','dig'].includes(a.action)){
    if(a.frame%10!==5)return;
    const skill={bash:'basher',mine:'miner',dig:'digger'}[a.action],r=skillRect(a,skill),dir=skill==='digger'?0:a.dir;
    if(!probe(s,r,v=>v>0)){walk(a);return;}
    if(!carve(s,r,dir)){a.dir*=skill==='digger'?1:-1;walk(a);effect(s,'steel',a.x,a.y-5);return;}
    effect(s,'dust',a.x+a.dir*4,a.y-3);
    if(skill==='basher')a.x+=a.dir*3;
    else if(skill==='miner'){a.x+=a.dir*3;a.y+=2;}
    else a.y+=3;
    if(!terrainAt(s,a.x,a.y)){fall(a);}return;
  }
  if(!terrainAt(s,a.x,a.y)){fall(a);return;}
  const blocker=s.agents.find(b=>b.id!==a.id&&b.action==='block'&&Math.abs(b.y-a.y)<7&&Math.abs(b.x-a.x)<=11&&(b.x-a.x)*a.dir>0);
  if(blocker){a.dir*=-1;return;}
  const nx=a.x+a.dir,front=nx+a.dir*3;
  if(front<=7||front>=s.width-8){a.dir*=-1;return;}
  if(terrainAt(s,front,a.y-1)||terrainAt(s,front,a.y-8)){
    let step=0;
    for(let up=1;up<=4;up++)if(!terrainAt(s,front,a.y-up-1)&&!terrainAt(s,front,a.y-up-13)&&terrainAt(s,front,a.y-up)){step=up;break;}
    if(step){a.x=nx;a.y-=step;}
    else if(a.climber)change(a,'climb');else a.dir*=-1;
  }else{a.x=nx;if(!terrainAt(s,a.x,a.y))fall(a);}
}
export function tickLemmings(s,level,count=1){
  for(let t=0;t<count&&s.phase==='playing';t++){
    s.tick++;s.time--;s.effects=s.effects.filter(e=>++e.age<24);s.hazards=s.hazards.map(n=>Math.max(0,n-1));
    if(!s.retired&&s.released<level.total&&s.tick>=s.nextSpawn){
      s.released++;s.nextSpawn=s.tick+s.interval;
      s.agents.push({id:s.released,x:level.entry.x,y:level.entry.y,dir:level.entry.dir||1,action:'fall',frame:0,climber:false,floater:false,bomb:-1,fallen:0,velocity:0,bricks:0});
    }
    for(const a of s.agents)stepAgent(s,a,level);
    s.agents=s.agents.filter(a=>a.action!=='gone');
    if(s.time<=0){s.released=level.total;s.lost=level.total-s.saved;s.agents=[];s.phase=s.saved>=level.need?'won':'lost';}
    else if(!s.agents.length&&(s.released>=level.total||s.retired))s.phase=s.saved>=level.need?'won':'lost';
  }return s;
}
function encodeTerrain(terrain){
  const runs=[];for(let i=0;i<terrain.length;){if(!terrain[i]){i++;continue;}const start=i,value=terrain[i];while(i<terrain.length&&terrain[i]===value)i++;runs.push(start,i-start,value);}return runs;
}
export function saveLemmingState(s){const {terrain,effects,terrainRevision,...data}=s;return {...copyLemmings(data),terrain:encodeTerrain(terrain)};}
export function restoreLemmingState(raw,level){
  if(!raw||raw.version!==1||raw.revision!==(level.revision||1)||raw.level!==level.id||raw.width!==level.width||raw.height!==level.height||!['ready','playing','won','lost'].includes(raw.phase))return null;
  const integer=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
  if(!integer(raw.tick,level.time*LEM_FPS)||!integer(raw.time,level.time*LEM_FPS)||!integer(raw.released,level.total)||!integer(raw.saved,raw.released)||!integer(raw.lost,level.total)||raw.saved+raw.lost>raw.released||!integer(raw.nextSpawn,level.time*LEM_FPS+120)||!integer(raw.interval,120)||raw.interval<8||typeof raw.retired!=='boolean'||!integer(raw.used,1000))return null;
  if(!Array.isArray(raw.agents)||raw.agents.length>level.total||!Array.isArray(raw.hazards)||raw.hazards.length!==level.hazards.length||!raw.hazards.every(n=>integer(n,45)))return null;
  if(!raw.stock||!lemmingSkills.every(k=>integer(raw.stock[k],level.skills[k]||0)))return null;
  const ids=new Set();for(const a of raw.agents){
    if(!integer(a.id,raw.released)||!a.id||ids.has(a.id)||!Number.isInteger(a.x)||a.x<0||a.x>level.width+10||!Number.isInteger(a.y)||a.y<0||a.y>level.height+20||![1,-1].includes(a.dir)||!actions.has(a.action)||!integer(a.frame,1e6)||typeof a.climber!=='boolean'||typeof a.floater!=='boolean'||!Number.isInteger(a.bomb)||a.bomb< -1||a.bomb>1000||!integer(a.fallen,1e5)||!Number.isFinite(a.velocity)||a.velocity<0||a.velocity>3||!integer(a.bricks,12)||(a.fallRemainder!==undefined&&(!Number.isFinite(a.fallRemainder)||a.fallRemainder<0||a.fallRemainder>=1)))return null;ids.add(a.id);
  }
  if(raw.agents.length+raw.saved+raw.lost!==raw.released)return null;
  const runs=raw.terrain;if(!Array.isArray(runs)||runs.length%3||runs.length>level.width*level.height*3)return null;
  const terrain=new Uint8Array(level.width*level.height);let end=0;
  for(let i=0;i<runs.length;i+=3){const [at,length,value]=runs.slice(i,i+3);if(!integer(at,terrain.length-1)||at<end||!integer(length,terrain.length-at)||!length||![1,2,3,4].includes(value))return null;terrain.fill(value,at,at+length);end=at+length;}
  return {...copyLemmings(raw),terrain,effects:[],terrainRevision:1};
}

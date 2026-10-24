// Grid rules derived from the observations in research/lasertank/.
// Rendering consumes an ordered list of snapshots; it never advances the rules.
export const laserDirs = ['up','right','down','left'];
const vectors = [[0,-1],[1,0],[0,1],[-1,0]];
export const laserCopy = value => JSON.parse(JSON.stringify(value));
export const mirrorOutputs = {NW:{1:0,2:3},NE:{2:1,3:0},SE:{0:1,3:2},SW:{0:3,1:2}};
const faces = ['NW','NE','SE','SW'];
const blocked = t => ['wall','brick','crystal'].includes(t);
const portal = t => typeof t === 'string' && t.startsWith('portal:');
export function createLaserState(level) {
  return {version:1,revision:level.revision||1,level:level.id,w:level.w,h:level.h,tiles:[...level.tiles],
    tank:{...level.tank},actors:level.actors.map((a,i)=>({id:`a${i}`,...a})),moves:0,shots:0,phase:'playing',reason:'',waiting:false};
}
export function validLaserState(s,level) {
  const inside=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<level.w&&p.y>=0&&p.y<level.h;
  const types=['box','mirror','rotary','enemy','wreck'];
  const tile=t=>['ground','wall','brick','crystal','water','bridge','ice','thin','flag'].includes(t)||/^mover:[0-3]$/.test(t)||/^portal:[0-7]$/.test(t);
  return s?.version===1&&(s.revision||1)===(level.revision||1)&&s.level===level.id&&s.w===level.w&&s.h===level.h&&Array.isArray(s.tiles)&&s.tiles.length===level.w*level.h&&s.tiles.every(tile)
    &&inside(s.tank)&&Number.isInteger(s.tank.dir)&&s.tank.dir>=0&&s.tank.dir<4&&Array.isArray(s.actors)&&s.actors.length<=level.actors.length
    &&s.actors.every(a=>inside(a)&&types.includes(a.type)&&typeof a.id==='string'&&(a.type!=='enemy'||Number.isInteger(a.dir)&&a.dir>=0&&a.dir<4)&&(!['mirror','rotary'].includes(a.type)||faces.includes(a.face)))
    &&new Set(s.actors.map(a=>`${a.x},${a.y}`)).size===s.actors.length&&new Set(s.actors.map(a=>a.id)).size===s.actors.length
    &&!s.actors.some(a=>a.x===s.tank.x&&a.y===s.tank.y)&&['playing','won','lost'].includes(s.phase)
    &&['moves','shots'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0&&s[k]<=1e7)&&typeof s.waiting==='boolean';
}

export function laserAction(input,command,{frames=true}={}) {
  const s=laserCopy(input),out=[];
  if(s.phase!=='playing')return {state:s,frames:out,changed:false};
  const inside=(x,y)=>x>=0&&x<s.w&&y>=0&&y<s.h;
  const tile=(x,y)=>inside(x,y)?s.tiles[y*s.w+x]:'wall';
  const set=(x,y,t)=>{s.tiles[y*s.w+x]=t;};
  const actor=(x,y)=>s.actors.find(a=>a.x===x&&a.y===y);
  const mark=(kind,extra={})=>{if(frames)out.push({kind,...extra,state:laserCopy(s)});};
  const fatal=(reason,beam)=>{s.phase='lost';s.reason=reason;mark('lost',beam?{beam}:{});};
  const removed=a=>{s.actors=s.actors.filter(o=>o.id!==a.id);};
  const cellFree=(x,y,who)=>inside(x,y)&&!blocked(tile(x,y))&&!actor(x,y)&&(who===s.tank||s.tank.x!==x||s.tank.y!==y);
  function enemySight() {
    if(s.phase!=='playing')return;
    for(const enemy of s.actors.filter(a=>a.type==='enemy')){
      const [dx,dy]=vectors[enemy.dir];let x=enemy.x+dx,y=enemy.y+dy;
      while(inside(x,y)&&!blocked(tile(x,y))&&!actor(x,y)){
        if(x===s.tank.x&&y===s.tank.y){fatal('enemy',[{x:enemy.x,y:enemy.y},{x,y}]);return;}
        x+=dx;y+=dy;
      }
    }
  }
  function teleport(who) {
    const color=tile(who.x,who.y);if(!portal(color))return false;
    const options=s.tiles.flatMap((t,i)=>t===color?[{x:i%s.w,y:Math.floor(i/s.w)}]:[])
      .filter(p=>p.x!==who.x||p.y!==who.y);
    const exit=options.find(p=>cellFree(p.x,p.y,who));
    who.waiting=!exit;
    if(!exit)return false;
    const from={x:who.x,y:who.y};Object.assign(who,exit,{waiting:false});mark('teleport',{from,to:{...exit},actor:who===s.tank?'tank':who.id});return true;
  }
  function releaseWaiting() {
    // One pass is enough for the authored maps; repeat only while a waiting
    // occupant actually exits, with a finite cap for cyclic custom layouts.
    for(let pass=0;pass<s.actors.length+1;pass++){
      let changed=false;
      for(const who of [...s.actors,s.tank])if(who.waiting&&portal(tile(who.x,who.y)))changed=teleport(who)||changed;
      if(!changed)break;
    }
  }
  function settleObject(a,dir) {
    const seen=new Set();
    while(s.actors.includes(a)){
      const key=`${a.x},${a.y},${dir}`;if(seen.has(key))break;seen.add(key);
      const t=tile(a.x,a.y);
      if(t==='water'){
        if(a.type==='box')set(a.x,a.y,'bridge');removed(a);mark(a.type==='box'?'bridge':'sink',{at:{x:a.x,y:a.y}});break;
      }
      if(portal(t)){teleport(a);break;}
      if(t!=='ice'&&t!=='thin')break;
      const [dx,dy]=vectors[dir],nx=a.x+dx,ny=a.y+dy;
      if(t==='thin')set(a.x,a.y,'water');
      if(!cellFree(nx,ny,a)){
        if(t==='thin'){if(a.type==='box')set(a.x,a.y,'bridge');removed(a);mark(a.type==='box'?'bridge':'sink',{at:{x:a.x,y:a.y}});}
        break;
      }
      a.x=nx;a.y=ny;mark('slide',{actor:a.id});
    }
    releaseWaiting();enemySight();
  }
  function push(a,dir) {
    const [dx,dy]=vectors[dir],nx=a.x+dx,ny=a.y+dy;
    if(!cellFree(nx,ny,a))return false;
    const t=tile(a.x,a.y);if(t==='thin')set(a.x,a.y,'water');
    a.x=nx;a.y=ny;a.waiting=false;mark('push',{actor:a.id});settleObject(a,dir);return true;
  }
  function settleTank(dir) {
    const seen=new Set();
    while(s.phase==='playing'){
      const t=tile(s.tank.x,s.tank.y);
      if(t==='water'){fatal('water');break;}
      if(t==='flag'){s.phase='won';mark('won');break;}
      enemySight();if(s.phase!=='playing')break;
      if(portal(t)){teleport(s.tank);enemySight();break;}
      let movement=t.startsWith('mover:')?Number(t.slice(-1)):(t==='ice'||t==='thin'?dir:null);
      if(movement===null)break;
      const key=`${s.tank.x},${s.tank.y},${movement}`;
      // A conveyor loop is a recoverable stopped action here. Undo remains
      // available without running an endless browser animation.
      if(seen.has(key)){s.reason='cycle';mark('cycle');break;}seen.add(key);
      const [dx,dy]=vectors[movement],nx=s.tank.x+dx,ny=s.tank.y+dy;
      if(t==='thin')set(s.tank.x,s.tank.y,'water');
      if(!cellFree(nx,ny,s.tank)){if(t==='thin')fatal('water');break;}
      s.tank.x=nx;s.tank.y=ny;s.tank.waiting=false;dir=movement;mark('slide',{actor:'tank'});
    }
  }
  const dir=laserDirs.indexOf(command);
  if(dir>=0){
    s.reason='';
    if(s.tank.dir!==dir){s.tank.dir=dir;mark('turn');enemySight();}
    else{
      const [dx,dy]=vectors[dir],nx=s.tank.x+dx,ny=s.tank.y+dy;
      if(cellFree(nx,ny,s.tank)){
        if(tile(s.tank.x,s.tank.y)==='thin')set(s.tank.x,s.tank.y,'water');
        s.tank.x=nx;s.tank.y=ny;s.tank.waiting=false;s.moves++;mark('move',{actor:'tank'});settleTank(dir);
      }
    }
  }else if(command==='fire'){
    s.reason='';s.shots++;let x=s.tank.x,y=s.tank.y,d=s.tank.dir,beam=[{x,y}],seen=new Set();
    mark('fire');
    for(let n=0;n<s.w*s.h*4&&s.phase==='playing';n++){
      const [dx,dy]=vectors[d];x+=dx;y+=dy;
      if(!inside(x,y))break;
      const key=`${x},${y},${d}`;if(seen.has(key)){s.reason='beam-cycle';break;}seen.add(key);
      beam.push({x,y});mark('beam',{beam:laserCopy(beam)});
      if(x===s.tank.x&&y===s.tank.y){fatal('self',beam);break;}
      const t=tile(x,y);if(t==='wall')break;
      if(t==='brick'){set(x,y,'ground');mark('break',{at:{x,y},beam});break;}
      const a=actor(x,y);if(!a)continue;
      if(a.type==='wreck')break;
      if(a.type==='mirror'||a.type==='rotary'){
        const result=mirrorOutputs[a.face][d];
        if(result!==undefined){d=result;continue;}
        if(a.type==='rotary'){a.face=faces[(faces.indexOf(a.face)+1)%4];mark('rotate',{actor:a.id,beam});}
        else push(a,d);
      }else if(a.type==='enemy'&&d===(a.dir+2)%4){a.type='wreck';mark('destroy',{actor:a.id,beam});}
      else push(a,d);
      break;
    }
    releaseWaiting();enemySight();
  }
  const changed=JSON.stringify(s)!==JSON.stringify(input);
  if(changed)mark('rest');
  return {state:s,frames:out,changed};
}

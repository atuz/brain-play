import {baseDominoTiming,eventBeatDuration} from './domino-timing.js?v=11';
import {dominoContactPhase,resistsDomino,reboundDuration} from './domino-contact-motion.js?v=2';
import {dominoOutcome} from './domino-outcome.js?v=4';
import {carriedDropTiming} from './domino-actions.js';
import {createAscenderMechanic} from './domino-ascender-engine.js?v=20';
// Independent, discrete JavaScript rules for the original Brain Play domino puzzles.
// No Domino-Chain/Pushover program, graphics, sounds or levels are included.
export const TYPES = ['normal', 'stopper', 'tumbler', 'delay', 'splitter', 'exploder', 'bridge', 'vanish', 'trigger', 'ascender'];
export const at = (a, b) => a.x === b.x && a.y === b.y;
export const clone = value => JSON.parse(JSON.stringify(value));
export const hasFloor = (level, x, y, bridges = [], holes = []) =>
  x >= 0 && x < level.width && y >= 0 && y < level.height &&
  (bridges.some(p => p.x === x && p.y === y) ||
    (!holes.some(p => p.x === x && p.y === y) && level.platforms.some(([row, from, to]) => row === y && x >= from && x <= to)));
const onLadder = (level, x, y) => level.ladders.some(l => l.x === x && y >= l.from && y <= l.to);
// Rows may be fractional: stair treads are stored half a row apart so a step
// is one cell long and half a row tall.
export const walkable = (level, p, bridges = [], holes = []) => Number.isInteger(p.x) && Number.isFinite(p.y) &&
  (p.side===1?(hasFloor(level,p.x,p.y,bridges,holes)||p.x===-1)&&
      (hasFloor(level,p.x+1,p.y,bridges,holes)||p.x===level.width-1)
    :(p.side===undefined||p.side===0)&&(hasFloor(level,p.x,p.y,bridges,holes)||onLadder(level,p.x,p.y)));

export const antPoint=p=>({x:p.x+(p.side===1 ? .5 : 0),y:p.y});
export const antAt=(a,b)=>at(a,b)&&(a.side===1)===(b.side===1);
export function pushPieceAt(pieces,player,dir){
  if(player.side!==1||![-1,1].includes(dir))return null;
  return pieces.find(p=>p.x===player.x+(dir===1?1:0)&&p.y===player.y&&
    (p.state===undefined||p.state==='upright')&&!['stopper','splitter'].includes(p.type))||null;
}
export function neighbors(level, p, bridges = [], holes = []) {
  const out = [];
  for (const dx of [-1, 1]) {
    const q = {x:p.x + dx, y:p.y};
    if (hasFloor(level, p.x, p.y, bridges, holes) && hasFloor(level, q.x, q.y, bridges, holes)) out.push(q);
  }
  for (const dy of [-1, 1]) {
    const q = {x:p.x, y:p.y + dy};
    if (level.ladders.some(l => l.x === p.x && Math.min(p.y,q.y) >= l.from && Math.max(p.y,q.y) <= l.to)) out.push(q);
  }
  // Half-row stair treads: a cell stored on a fractional row is a step and may
  // be entered diagonally from its neighbours (one cell across, half a row up
  // or down). Levels without fractional rows are unaffected.
  const halfRow = q => !Number.isInteger(q.y);
  for (const dx of [-1, 1]) {
    for (const dy of [-1, -0.5, 0.5, 1]) {
      const q = {x: p.x + dx, y: p.y + dy};
      if (!halfRow(p) && !halfRow(q)) continue;
      if (hasFloor(level, p.x, p.y, bridges, holes) && hasFloor(level, q.x, q.y, bridges, holes)) out.push(q);
    }
  }
  // Stair ramps (the platform steps from '/' and '\' in the original levels)
  // let the ant change row diagonally.
  const ramps = level.ramps || [];
  if (ramps.length) {
    const onRamp = q => ramps.some(r => r[0] === q.x && r[1] === q.y);
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const q = {x:p.x + dx, y:p.y + dy};
      if ((onRamp(p) || onRamp(q)) && hasFloor(level, p.x, p.y, bridges, holes) && hasFloor(level, q.x, q.y, bridges, holes)) out.push(q);
    }
    for (const [dx, dy] of [[-2, -1], [2, -1], [-2, 1], [2, 1]]) {
      const q = {x:p.x + dx, y:p.y + dy};
      const mid = {x:p.x + dx / 2, y:p.y};
      if ((onRamp(p) || onRamp(q)) && !hasFloor(level, mid.x, mid.y, bridges, holes) && hasFloor(level, p.x, p.y, bridges, holes) && hasFloor(level, q.x, q.y, bridges, holes)) out.push(q);
    }
  }
  // In the original game the ant may walk off a ledge and drop straight down
  // to the next platform. Original Pushover levels rely on this constantly.
  if (level.rules === 'dos' && hasFloor(level, p.x, p.y, bridges, holes)) {
    for (const dx of [-1, 1]) {
      const x = p.x + dx;
      if (hasFloor(level, x, p.y, bridges, holes)) continue;
      // A connected tread is supported at a different height. It is not a
      // ledge: neither falling nor sideways drift may bypass that stair.
      if (out.some(q => (q.x-p.x)*dx > 0 && Math.abs(q.y-p.y) <= 1)) continue;
      // Step off the edge, then fall vertically. A recessed lower platform
      // cannot be reached by drifting back underneath the current platform.
      // A bridge is a floor too: stepping off a ledge above one must land on
      // the bridge instead of falling past it to a lower platform.
      const landing = [...level.platforms, ...bridges.map(b => [b.y, b.x, b.x])]
        .filter(([y, a, b]) => y > p.y && x >= a && x <= b && hasFloor(level, x, y, bridges, holes))
        .sort((a, b) => a[0] - b[0])[0];
      if (landing && !out.some(q => q.x === x && q.y === landing[0])) out.push({x, y: landing[0]});
    }
  }
  return out;
}
// A ledge descent is different from walking down a connected stair or ladder.
export function isLedgeDrop(level,from,to){
  const dy=to.y-from.y,dx=Math.abs(to.x-from.x);
  if(dy<=0)return false;
  if(from.x===to.x&&level.ladders.some(l=>l.x===from.x&&from.y>=l.from&&to.y<=l.to))return false;
  if(dx===1&&dy===.5)return false;
  const onRamp=p=>(level.ramps||[]).some(([x,y])=>x===p.x&&y===p.y);
  if(dy<=1&&dx>=1&&dx<=2&&(onRamp(from)||onRamp(to)))return false;
  return true;
}

export function pathTo(level, start, target, bridges = [], holes = []) {
  if (!walkable(level, start, bridges, holes) || !walkable(level, target, bridges, holes)) return null;
  const key = p => `${p.x},${p.y}`, queue = [start], previous = new Map([[key(start), null]]);
  for (let i=0;i<queue.length;i++) {
    const p = queue[i];
    if (at(p,target)) {
      const path=[]; let cursor=p;
      while (previous.get(key(cursor))) {path.push(cursor);cursor=previous.get(key(cursor));}
      return path.reverse();
    }
    for (const q of neighbors(level,p,bridges,holes)) {
      // Auto-pathing must not choose a drop that would kill the ant.
      if (level.rules==='dos' && q.y - p.y > 3) continue;
      if (!previous.has(key(q))) {previous.set(key(q),p);queue.push(q);}
    }
  }
  return null;
}

// The ant has a front lane for carrying and a gap lane for pushing.
// Walking stays in front. A gap is a fixed pushing stop; leave it to walk.
export function antNeighbors(level,p,bridges=[],holes=[]){
  if(!walkable(level,p,bridges,holes))return [];
  if(p.side===1)return [{x:p.x,y:p.y},{x:p.x+1,y:p.y}]
    .filter(q=>walkable(level,q,bridges,holes));
  return [...neighbors(level,p,bridges,holes),...[{x:p.x-1,y:p.y,side:1},{x:p.x,y:p.y,side:1}]
    .filter(q=>walkable(level,q,bridges,holes))];
}

export function antPathTo(level,start,target,bridges=[],holes=[]){
  if(!walkable(level,start,bridges,holes)||!walkable(level,target,bridges,holes))return null;
  const key=p=>`${p.x},${p.y},${p.side===1?1:0}`,queue=[start],previous=new Map([[key(start),null]]);
  for(let i=0;i<queue.length;i++){
    const p=queue[i];
    if(antAt(p,target)){
      const path=[];let cursor=p;
      while(previous.get(key(cursor))){path.push(cursor);cursor=previous.get(key(cursor));}
      return path.reverse();
    }
    for(const q of antNeighbors(level,p,bridges,holes)){
      if(level.rules==='dos'&&q.y-p.y>3)continue;
      if(!previous.has(key(q))){previous.set(key(q),p);queue.push(q);}
    }
  }
  return null;
}

export function antStepTarget(level,p,direction,facing=1,bridges=[],holes=[]){
  const delta=({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})[direction];if(!delta)return null;
  const opts=antNeighbors(level,p,bridges,holes);
  if(delta[0]){
    if(p.side===1)return null;
    const ahead=q=>(antPoint(q).x-antPoint(p).x)*delta[0]>0;
    const lane=opts.filter(q=>(q.side===1)===(p.side===1));
    return lane.find(q=>q.y===p.y&&ahead(q))||lane.find(q=>Math.abs(q.y-p.y)===.5&&ahead(q))||lane.find(q=>q.y>p.y&&ahead(q))||null;
  }
  if(p.side===1)return direction==='down'?opts.find(q=>q.side!==1&&q.x===p.x+(facing>0?1:0))||null:null;
  const climb=opts.find(q=>q.side!==1&&q.x===p.x&&q.y===p.y+delta[1])||opts.find(q=>q.side!==1&&Math.abs(q.y-p.y)===.5&&Math.sign(q.y-p.y)===delta[1])||opts.find(q=>q.side!==1&&q.y===p.y+delta[1]&&q.x!==p.x)||null;
  if(direction==='up'){
    if(climb)return climb;
    const gap=opts.find(q=>q.side===1&&q.x===p.x-(facing>0?1:0));
    if(gap)return gap;
  }
  return climb;
}
export function entryCell(level) {
  if (level.entry && Number.isInteger(level.entry.x)) return {x: level.entry.x, y: level.player.y};
  return [{x: level.player.x - 1, y: level.player.y}, {x: level.player.x + 1, y: level.player.y}].find(q => hasFloor(level, q.x, q.y)) || null;
}
export function doorBlocked(level, p) {
  const cells = [];
  const push = (x, y) => { if (Number.isFinite(x) && Number.isFinite(y)) cells.push({x, y}); };
  if (level.exit) push(level.exit.x, level.exit.y);
  const spawn = entryCell(level);
  if (spawn) push(spawn.x, spawn.y);
  return cells.some(c => c.x === p.x && c.y === p.y);
}
export function initialPosition(level) {
  return {player:clone(level.player),pieces:clone(level.pieces),carrying:null,moves:0};
}
export function edit(level, position, action) {
  const next=clone(position);
  if (action.type==='walk'||action.type==='ant-walk') {
    const options=action.type==='ant-walk'?antNeighbors(level,position.player):neighbors(level,position.player);
    if (!options.some(p=>antAt(p,action.to))) return null;
    next.player=clone(action.to);next.moves++;return next;
  }
  if (action.type==='take') {
    if (position.carrying||position.player.side===1) return null;
    const piece=next.pieces.find(p=>at(p,position.player));
    if (!piece || piece.type==='trigger') return null;
    next.carrying=piece;next.pieces=next.pieces.filter(p=>p.id!==piece.id);next.moves++;return next;
  }
  if (action.type==='place') {
    if (position.player.side===1||!position.carrying || !hasFloor(level,position.player.x,position.player.y) || position.pieces.some(p=>at(p,position.player))) return null;
    if (doorBlocked(level, position.player) && position.carrying.type !== 'vanish') return null;
    next.pieces.push({...next.carrying,x:position.player.x,y:position.player.y});next.carrying=null;next.moves++;return next;
  }
  return null;
}

// Event time is measured in base clock beats. Equal-time events are resolved together so
// "trigger last" cannot depend on the iteration order of the domino array.
export function createChain(level, pieces, structures = {}, timing = baseDominoTiming, {maxSteps = 200} = {}) {
  const stones=clone(pieces).map(p=>({...p,state:'upright',dir:0,finish:null}));
  for(const p of clone(structures.settledPieces||[]))if(!stones.some(q=>q.id===p.id))stones.push(p);
  const bridges=clone(structures.bridges||[]),holes=clone(structures.holes||[]),events=[],trace=[];
  let time=0,crashed=false,overflow=false,collisionEffects=null;
  const find=id=>stones.find(p=>p.id===id);
  const schedule=(kind,id,dir,when,extra={})=>{
    const elapsed=(when-time)*eventBeatDuration(kind,find(id)?.type,timing)/timing.beat;
    events.push({kind,id,dir,time:Math.round((time+elapsed)*1e9)/1e9,...extra});
  };
  // A tile that tips over an edge with nothing below leaves the board. It
  // counts as vanished at once; a short tail event keeps the live chain alive
  // long enough for the flip-and-drop animation to play.
  const fallOut=(p,dir)=>{
    // Rules-wise it is gone at once, but the board still plays the ordinary
    // drop animation towards a row just below the level.
    p.state='vanished';p.finish=time;p.fallOut=true;
    p.dropX=p.x+dir;p.dropY=level.height+1;
    schedule('fall-out-end',p.id,dir,time+3);
  };
  // A tile whose swing carries it past the platform edge keeps falling: it
  // drops to the next platform, or leaves the board when there is none.
  const dropOverEdge=(p,dir)=>{
    const x=p.x+dir;
    if(x<0||x>=level.width||floor(x,p.y))return false;
    if(floor(x,p.y-.5)){p.lean=45;p.state='flat';p.finish=time;return true;}
    const landingY=landingRow(x,p.y);
    if(landingY!==undefined){
      const rows=Math.max(1,landingY-p.y);
      p.state='dropping';p.finish=null;p.dropStart=time;p.dropX=x;p.dropY=landingY;
      for(let k=1;k<rows;k++)schedule('drop-tick',p.id,dir,time+k);
      schedule('land',p.id,dir,time+rows,{x,y:landingY});
      return true;
    }
    fallOut(p,dir);
    return true;
  };
  // A bridge that is toppling after a drop must still span a one-cell gap.
  function spanBridge(piece,dir){
    const x=piece.x+dir;
    if(piece.type!=='bridge'||piece.state==='vanished'||floor(x,piece.y)||
      x<0||x>=level.width||!floor(x+dir,piece.y))return false;
    bridges.push({x,y:piece.y,dir});
    piece.state='vanished';piece.finish=time;
    catchDroppingOnBridge(x,piece.y);
    const above=stones.find(s=>s.type==='ascender'&&s.x===x&&s.y===piece.y-1&&s.state==='ceiling');
    if(above)ascenders.nudge(above,dir);
    return true;
  }
  function finishFall(piece,fromLanding=false){
    piece.state='flat';piece.finish=time;
    if(fromLanding){
      const x=piece.x+piece.dir;
      if(!floor(x,piece.y)){
        // A half-row stair riser in the target column: rest leaning on the
        // step edge instead of dropping past it.
        if(floor(x,piece.y-.5)){piece.lean=45;return;}
        const landingY=landingRow(x,piece.y);
        if(landingY!==undefined){
          const rows=Math.max(1,landingY-piece.y);
          piece.state='dropping';piece.finish=null;piece.dropStart=time;piece.dropX=x;piece.dropY=landingY;
          for(let k=1;k<rows;k++)schedule('drop-tick',piece.id,piece.dir,time+k);
          schedule('land',piece.id,piece.dir,time+rows,{x,y:landingY});
          return;
        }
        fallOut(piece,piece.dir);
        return;
      }
    }
    if(!['normal','trigger'].includes(piece.type)||(fromLanding&&piece.type!=='normal'))return;
    // Contact starts the neighbour, while the displayed body still has its
    // final swing to play. Compare completion at rest for both pivot types.
    const restMs=fromLanding&&piece.type==='normal'?timing.contact:140;
    piece.finish=null;
    piece.restSerial=(piece.restSerial||0)+1;
    schedule('fall-rest',piece.id,piece.dir,time+restMs/timing.beat,{restSerial:piece.restSerial});
  }
  const capture=(impacts=[],effects=[])=>trace.push({time,pieces:clone(stones),bridges:clone(bridges),holes:clone(holes),crashed,impacts:clone(impacts),effects:clone(effects)});
  const bridged=(x,y)=>bridges.some(b=>b.x===x&&b.y===y);
  // A bridge covers a blown hole: the cell is walkable again.
  const floor=(x,y)=>bridged(x,y)||(hasFloor(level,x,y,bridges)&&!holes.some(h=>h.x===x&&h.y===y));
  // A landing can be a platform row or a bridge cell; both stop a falling tile.
  const landingRow=(x,fromY)=>{
    const rows=level.platforms.filter(([,from,to])=>x>=from&&x<=to).map(([y])=>y);
    for(const b of bridges)if(b.x===x)rows.push(b.y);
    return rows.filter(y=>y>fromY&&(bridged(x,y)||!holes.some(h=>h.x===x&&h.y===y))).sort((a,b)=>a-b)[0];
  };
  // A bridge that appears while a tile is still falling through that column
  // catches the tile at the bridge row instead of letting it drop past.
  const catchDroppingOnBridge=(bx,by)=>{
    for(const q of stones){
      if(q.state!=='dropping'||q.dropX!==bx||q.dropY<=by||q.y>=by)continue;
      const rowBeats=eventBeatDuration('land',q.type,timing)/timing.beat;
      const current=q.dropStart===undefined?q.y:q.y+(time-q.dropStart)/rowBeats;
      if(current>=by)continue;
      for(let i=events.length-1;i>=0;i--)if(events[i].id===q.id&&['drop-tick','land'].includes(events[i].kind))events.splice(i,1);
      const remaining=Math.max(1,by-current);
      q.dropY=by;
      schedule('land',q.id,q.dir,time+remaining,{x:bx,y:by});
    }
  };
  let rollSerial=0;
  // A flat tile covers its own cell plus the cell it fell towards; a roller
  // meets that body, not only the tile's anchor cell.
  const rollTarget=(p,dir,x)=>{
    const y=p.y;
    return stones.find(s=>s.id!==p.id&&s.y===y&&s.state!=='vanished'&&
      (s.x===x||(s.state==='flat'&&s.x+(s.dir||0)===x)));
  };
  // A bridge only lets a roller pass while it will actually span a gap; on
  // solid ground it is an ordinary domino that has to be knocked over.
  const bridgeSpans=(p,dir)=>{const x=p.x+dir;return !floor(x,p.y)&&x+dir>=0&&x+dir<level.width&&floor(x+dir,p.y);};
  function queueRoll(p,dir,resume=false){
    const x=p.x+dir,target=rollTarget(p,dir,x);
    const resisting=resistsDomino(target)||target?.type==='delay'&&target.state==='upright';
    const passThrough=target&&(['exploder','vanish','ascender'].includes(target.type)||
      target.type==='bridge'&&target.state==='upright'&&bridgeSpans(target,dir));
    const solid=target&&!passThrough;
    const contact=resisting||solid;
    const upright=(p.x-p.rollOriginX)*2*p.rollBaseDir;
    const relativeDir=dir*p.rollBaseDir,rollMs=timing.roll??timing.beat;
    // A resumed roller first lies flat on the vacated cell (its support is
    // gone), then rolls on from there. It must never swing back up to the old
    // pressed angle.
    p.rollFrom=resume?upright+relativeDir:p.rollPhase;
    p.rollTo=upright+relativeDir*(contact?dominoContactPhase:!floor(x,p.y)?1:2);
    const returnMs=resume?0:reboundDuration(p.rollFrom-upright,timing);
    p.rollReturnDuration=returnMs;p.rollVia=resume?p.rollFrom:upright;
    p.rollDuration=contact?returnMs+reboundDuration(p.rollTo-upright,timing)
      :resume?Math.max(1,rollMs*Math.abs(p.rollTo-p.rollFrom)/2):rollMs+returnMs;
    p.rollSerial=++rollSerial;
    if(target?.type==='ascender'&&target.state==='upright'){
      // Touch the ascender during the existing roll, without shortening or
      // restarting that roll. It rises clear while the tumbler keeps moving.
      const hitMs=returnMs+rollMs*dominoContactPhase/2;
      schedule('roll-ascender-hit',p.id,dir,time+hitMs/timing.beat,{targetId:target.id,rollSerial:p.rollSerial});
    }
    schedule('roll',p.id,dir,time+p.rollDuration/rollMs);
  }
  function beginRoll(p,dir,resume=false){
    p.dir=dir;p.state='rolling';p.resumeRoll=0;
    // A resumed roller keeps its original pivot and the pose it was pressed
    // in, so it continues rolling from that angle instead of snapping upright.
    if(!resume){p.rollOriginX=p.x;p.rollOriginY=p.y;p.rollBaseDir=dir;p.rollPhase=0;}
    queueRoll(p,dir,resume);
  }
  function rebound(source,target,dir,effects){
    if(!source){effects.push({kind:'rebound',targetId:target.id});return;}
    // A vanisher has already been consumed by its fall; the neighbour it
    // pushed must not turn it back into a returning, flattened tile.
    if(source.state==='vanished')return;
    const pressed=source.type==='normal'&&stones.some(p=>p.id!==source.id&&p.state==='flat'&&p.y===source.y&&
      (p.type==='splitter'?Math.abs(p.x-source.x)===1:p.x+p.dir===source.x));
    if(pressed){
      // A fallen upstream tile rests on this tile. Resistance cannot lift
      // that load: keep the ordinary tile down instead of returning upright.
      for(let i=events.length-1;i>=0;i--)if(events[i].id===source.id&&['reverse-turn','reverse-hit','normal-reverse-rest'].includes(events[i].kind))events.splice(i,1);
      source.state='flat';source.finish=time;return;
    }
    effects.push({kind:'rebound',sourceId:source.id,targetId:target.id});
    source.finish=null;
    if(source.type==='tumbler'){
      source.dir=-dir;queueRoll(source,-dir);
    }else{
      // Interrupt the previous swing, including its pending rest event, so a
      // second resisting neighbour cannot silently flatten a returning tile.
      for(let i=events.length-1;i>=0;i--)if(events[i].id===source.id&&['reverse-turn','reverse-hit','normal-reverse-rest'].includes(events[i].kind))events.splice(i,1);
      source.returnDuration=reboundDuration(dominoContactPhase,timing);
      source.state='returning';schedule('reverse-turn',source.id,-dir,time+dominoContactPhase);
    }
  }
  const activate=(piece,dir,fromAbove=false,sourceId=null)=>{
    if (!piece || piece.state!=='upright') return;
    if(piece.type==='bridge'&&sourceId)piece.hitBy=sourceId;
    if (piece.type==='splitter' && !fromAbove) {crashed=true;piece.state='crashed';return;}
    if(piece.type==='exploder'&&level.rules==='dos'&&collisionEffects){
      piece.dir=dir;explode(piece,collisionEffects);return;
    }
    if (piece.type==='tumbler') {
      beginRoll(piece,dir);return;
    }
    if (piece.type==='ascender') {
      ascenders.begin(piece,dir);return;
    }
    piece.dir=dir;
    if(piece.type==='delay'){
      piece.state='waiting';
      piece.delayStart=time+eventBeatDuration('delay-start','delay',timing)/timing.beat;
      schedule('delay-start',piece.id,dir,time+1);return;
    }
    piece.state='falling';schedule('settle',piece.id,dir,time+1);
  };
  const ascenders=createAscenderMechanic({level,stones,floor,schedule,activate,getTime:()=>time,timing});
  // An exploder tears a hole in the floor under itself.  It does not knock
  // the neighbour in its falling direction (original rule); instead a domino
  // already leaning over the new hole loses its support and drops through.
  const explode = (piece, effects) => {
    const hx=piece.x, hy=piece.y;
    piece.state='vanished';piece.finish=time;
    if(!holes.some(h=>h.x===hx&&h.y===hy))holes.push({x:hx,y:hy});
    effects.push({kind:'explode',sourceId:piece.id,x:hx,y:hy});
    // A bridge tile already lying over the new hole spans it immediately.
    for(const q of stones){
      if(q.type!=='bridge'||q.state==='vanished'||q.y!==hy)continue;
      const covering=(q.state==='flat'||q.state==='falling'||q.state==='landing')&&q.x+(q.dir||0)===hx;
      if(!(q.x===hx||covering))continue;
      bridges.push({x:hx,y:hy,dir:q.dir||1});
      q.state='vanished';q.finish=time;
    }
    for(const q of stones){
      // A hole that was just bridged keeps carrying the tiles above it.
      if(bridged(hx,hy)||q===piece||q.type==='ascender'||q.y!==hy)continue;
      const leaning=q.state==='flat'&&q.x+q.dir===hx;
      const rolling=q.state==='rolling'&&(q.x===hx||q.x+q.dir===hx);
      const arriving=q.state==='dropping'&&q.x===hx;
      if(!leaning&&!rolling&&!arriving)continue;
      // The removed support wins over previously queued rolling/topple events.
      for(let i=events.length-1;i>=0;i--)if(events[i].id===q.id)events.splice(i,1);
      const landing=level.platforms
        .filter(([y,from,to])=>y>hy&&hx>=from&&hx<=to&&!holes.some(h=>h.x===hx&&h.y===y))
        .sort((a,b)=>a[0]-b[0])[0];
      if(landing){
        const rows=Math.max(q.type==='tumbler'?2:1,landing[0]-hy);
        q.finish=null;q.state='dropping';q.dropX=hx;q.dropY=landing[0];
        for(let k=1;k<rows;k++)schedule('drop-tick',q.id,q.dir,time+k);
        schedule('land',q.id,q.dir,time+rows,{x:hx,y:landing[0]});
      }
      else {q.state='vanished';q.finish=time;}
    }
    // An ascender resting under a platform may climb again once a bomb opens
    // that ceiling. Test the whole flat body, not one anchor cell: a lying
    // ascender covers two cells and the opening can be over either half.
    for(const q of stones){
      if(q.type!=='ascender'||q.state!=='ceiling')continue;
      const dir=q.dir||1,min=Math.min(q.x,q.x+dir),max=Math.max(q.x,q.x+dir);
      if(hy!==q.y-1||hx<min||hx>max)continue;
      schedule('ascender-ceiling-gone',q.id,dir,time+1,{x:hx});
    }
  };
  let rounds=0;
  function step(){
    if(!events.length||crashed||overflow)return false;
    if(++rounds>maxSteps){overflow=true;return false;}
    time=Math.min(...events.map(e=>e.time));
    const batch=events.filter(e=>e.time===time);
    const impacts=[],effects=[];collisionEffects=effects;
    for (let i=events.length-1;i>=0;i--) if(events[i].time===time) events.splice(i,1);
    const hits=[];
    for (const event of batch) {
      const p=find(event.id);
      if(!p||p.state==='vanished')continue;
      // Rising motion is separate; a brick released from the ant still uses
      // the shared carried landing and impact cleanup.
      if(p?.type==='ascender'&&!['carried-land','impact-end'].includes(event.kind)){ascenders.handle(event,p,effects);continue;}
      if(event.kind==='fall-rest'){
        if(p.state==='flat'&&p.restSerial===event.restSerial&&p.finish===null)p.finish=time;
        continue;
      }
      if (event.kind==='drop-tick') continue;
      if (event.kind==='impact-end') {p.state='vanished';continue;}
      if(event.kind==='delay-start'){
        if(p.state==='waiting'){
          p.state='falling';schedule('settle',p.id,event.dir,time+1);
        }
        continue;
      }
      if(event.kind==='roll-ascender-hit'){
        if(p.state==='rolling'&&p.rollSerial===event.rollSerial&&p.dir===event.dir){
          const target=find(event.targetId);
          if(target?.type==='ascender'&&target.x===p.x+event.dir&&target.y===p.y&&target.state==='upright')activate(target,event.dir,false,p.id);
        }
        continue;
      }
      if (event.kind==='roll') {
        if(p.state!=='rolling')continue;
        p.rollPhase=p.rollTo;
        const x=p.x+event.dir;
        if(x<0||x>=level.width){fallOut(p,event.dir);continue;}
        const target=rollTarget(p,event.dir,x);
        if(target){
          if(target.type==='stopper'){
            rebound(p,target,event.dir,effects);
            continue;
          }
          if(target.type==='splitter'){
            // A side contact cannot activate a splitter; the tumbler stops.
            if(level.rules!=='dos'){crashed=true;target.state='crashed';p.state='crashed';}
            else {p.state='flat';p.finish=time;p.resumeRoll=event.dir;}
            continue;
          }
          if(target.state==='upright')activate(target,event.dir,false,p.id);
          if(p.state==='dropping'||p.state==='vanished')continue;
          if(target.type==='delay'&&['waiting','falling'].includes(target.state)){
            // A delayed domino still resists contact until it lies down.
            // Repeated hits bounce without restarting its pending fall.
            rebound(p,target,event.dir,effects);
            continue;
          }
          if(target.type==='ascender'||level.rules==='dos'&&['exploder','vanish'].includes(target.type)||
            level.rules==='dos'&&target.type==='bridge'&&target.state==='upright'&&bridgeSpans(target,event.dir)){
            p.x=x;queueRoll(p,event.dir);continue;
          }
          // Stopped against a body: remember the direction so the roller can
          // continue once that body has moved away.
          p.state='flat';p.finish=time;p.resumeRoll=event.dir;continue;
        }
        if(!floor(x,p.y)){
          const landingY=landingRow(x,p.y);
          if(landingY!==undefined){
            const rows=Math.max(1,landingY-p.y);
            p.state='dropping';p.dropStart=time;p.dropX=x;p.dropY=landingY;
            // Reserve one beat for the airborne half-turn, then fall upright.
            const beats=Math.max(2,rows);
            for(let k=1;k<beats;k++)schedule('drop-tick',p.id,event.dir,time+k);
            schedule('land',p.id,event.dir,time+beats,{x,y:landingY});
          }
          else fallOut(p,event.dir);
          continue;
        }
        p.x=x;queueRoll(p,event.dir);continue;
      }
      if (event.kind==='topple') {
        const dir=p.dir||event.dir;
        const nx=p.x+dir;
        const next=stones.find(s=>s.id!==p.id&&s.x===nx&&s.y===p.y&&s.state!=='vanished');
        if(next){
          if(next.type==='delay'&&next.state==='upright')activate(next,dir,false,p.id);
          if(resistsDomino(next)){
            rebound(p,next,dir,effects);
          }
          else if(next.type==='splitter'){crashed=true;next.state='crashed';p.state='crashed';}
          else {if(next.state==='upright')activate(next,dir,false,p.id);finishFall(p,true);}
        } else if(!spanBridge(p,dir)) finishFall(p,true);
        continue;
      }
      if (event.kind==='reverse-turn') {
        p.dir=event.dir;p.state='reversing';
        // A normal tile contacts its neighbour halfway through the swing;
        // finishing its own motion is a separate event.
        schedule('reverse-hit',p.id,event.dir,time+(p.type==='normal'?dominoContactPhase:2));
        if(p.type==='normal')schedule('normal-reverse-rest',p.id,event.dir,time+1);
        continue;
      }
      if (event.kind==='reverse-hit') {
        if(p.type==='normal'){
          // Deliver the contact through the ordinary collision path. The
          // source keeps rotating until its separate rest event.
          hits.push({x:p.x+event.dir,y:p.y,dir:event.dir,source:p});
          continue;
        }
        const back=stones.find(s=>s.id!==p.id&&s.x===p.x+(p.dir||event.dir)&&s.y===p.y&&s.state!=='vanished');
        if(back&&back.type==='stopper')effects.push({kind:'rebound',sourceId:p.id,targetId:back.id});
        else if(back&&back.state==='upright')activate(back,p.dir||event.dir,false,p.id);
        if(p.type!=='normal'&&!dropOverEdge(p,p.dir||event.dir)){p.state='flat';p.finish=time;}
        continue;
      }
      if (event.kind==='normal-reverse-rest') {
        // A collision may already have started another rebound or a drop.
        if(p.state==='reversing'){p.state='flat';p.finish=time;}
        continue;
      }
      if (event.kind==='land'||event.kind==='carried-land') {
        p.x=event.x;p.y=event.y;p.finish=time;
        const target=stones.find(s=>s.id!==p.id&&s.x===event.x&&s.y===event.y&&s.state!=='vanished');
        // A vanishing tile is consumed by its own fall; it never breaks the
        // tile it lands on.
        if(p.type==='vanish'&&event.kind==='land'){p.state='vanished';continue;}
        if(event.kind==='carried-land'){
          p.carriedDrop=false;
          if(!target){
            // A released riser climbs out of the ant's hands; a placed one
            // stays upright.
            if(p.type==='ascender'){p.finish=null;ascenders.begin(p,event.dir,true);continue;}
            p.state='upright';p.dir=0;p.finish=null;continue;
          }
          if(target.type!=='splitter'||target.state!=='upright'){
            crashed=true;p.state='crashed';p.crashPile=true;
            target.state='crashed';target.crashCovered=true;continue;
          }
          // Released bricks are a falling impact, not a manual push. They
          // are consumed above the splitter and start both branches.
          p.state='impact';schedule('impact-end',p.id,event.dir,time+1);
          hits.push({target,dir:event.dir,above:true,sourceId:p.id});continue;
        }
        if(p.type==='exploder'){
        if(level.rules==='dos'){ explode(p, effects); }
        else {
          p.state='vanished';p.finish=time;holes.push({x:p.x,y:p.y});
          effects.push({kind:'explode',sourceId:p.id,x:p.x,y:p.y});
          hits.push({x:p.x+event.dir,y:p.y,dir:event.dir,source:p});
        }
        continue;
      }
        if(target?.type==='exploder'&&target.state==='upright'&&level.rules==='dos'){
          activate(target,event.dir,true,p.id);continue;
        }
        if (target?.type==='splitter'&&target.state==='upright') {
          // Hold the falling domino at the point of contact for one animation beat.
          // The following impact-end event removes it after the collision is visible.
          p.state='impact';
          schedule('impact-end',p.id,event.dir,time+1);
          hits.push({target,dir:event.dir,above:true,sourceId:p.id});
        }
        else if (target) {crashed=true;target.state='crashed';p.state='crashed';}
        else if (p.type==='tumbler') {
          beginRoll(p,p.dir||event.dir);
        }
        else if ((p.type==='normal'||p.type==='delay')&&level.rules==='dos') {
          // Ordinary tile landing restored from the v145 source snapshot.
          p.state='landing';
          schedule('topple',p.id,event.dir,time+1);
        }
        else if (level.rules==='dos') {
          // Ordinary tiles fall upright with no airborne rotation. Start the
          // bottom-pivot topple only at the lower floor's landing event.
          // Other special tiles retain their own drop orientation.
          const next=stones.find(s=>s.id!==p.id&&s.x===p.x+event.dir&&s.y===p.y&&s.state!=='vanished');
          const stopped=next?.type==='stopper';
          p.inverted=p.type==='normal'?!!p.inverted:!p.inverted;p.state='landing';p.finish=null;
          p.landingAngle=stopped?43:90;p.landingTravel=stopped?200:400;
          schedule('topple',p.id,event.dir,time+(stopped?1:2));
        }
        else p.state='vanished';
        continue;
      }
      if(p.type==='exploder'){
        if(level.rules==='dos'){ explode(p, effects); }
        else {
          p.state='vanished';p.finish=time;holes.push({x:p.x,y:p.y});
          effects.push({kind:'explode',sourceId:p.id,x:p.x,y:p.y});
          hits.push({x:p.x+event.dir,y:p.y,dir:event.dir,source:p});
        }
        continue;
      }
      if(p.type==='tumbler'){
        beginRoll(p,event.dir);continue;
      }
      if(p.type==='vanish'){p.state='vanished';p.finish=time;}
      else finishFall(p);
      if(p.type==='splitter') {
        for(const dir of [-1,1]) hits.push({x:p.x+dir,y:p.y,dir});
        continue;
      }
      // The bridge spans the gap, then the bridge domino vanishes.
      if(spanBridge(p,event.dir))continue;
      const x=p.x+event.dir;
      hits.push({x,y:p.y,dir:event.dir,source:p});
    }
    // First finish every domino for this tick, then deliver all impacts.
    for (const hit of hits) {
      if (hit.target) {
        if(hit.target.type==='splitter'&&hit.above)impacts.push({kind:'splitter-hit',sourceId:hit.sourceId,targetId:hit.target.id});
        activate(hit.target,hit.dir,hit.above,hit.sourceId||hit.source?.id||null);continue;
      }
      const target=stones.find(p=>p.x===hit.x&&p.y===hit.y&&p.state!=='vanished');
      if (target) {
        if(target.type==='delay'&&target.state==='upright')activate(target,hit.dir,false,hit.sourceId||hit.source?.id||null);
        if(resistsDomino(target)){
          rebound(hit.source,target,hit.dir,effects);
          continue;
        }
        if(target.state==='upright') activate(target,hit.dir,false,hit.sourceId||hit.source?.id||null);
        else if(target.state==='falling'||target.state==='waiting') {
          if(target.dir!==hit.dir){target.state='crashed';crashed=true;}
        }
      } else if (hit.source&&!floor(hit.x,hit.y)&&hit.x>=0&&hit.x<level.width) {
        // A half-row stair riser in the target column blocks the fall.
        if(floor(hit.x,hit.y-.5)){hit.source.lean=45;hit.source.state='flat';hit.source.finish=time;continue;}
        // A falling domino can start a lower chain only by landing on a splitter.
        const landingY=landingRow(hit.x,hit.y);
        if (landingY!==undefined) {
          const rows=Math.max(1,landingY-hit.y);
          hit.source.state='dropping';hit.source.dropStart=time;
          hit.source.dropX=hit.x;hit.source.dropY=landingY;
          for(let k=1;k<rows;k++)schedule('drop-tick',hit.source.id,hit.dir,time+k);
          schedule('land',hit.source.id,hit.dir,time+rows,{x:hit.x,y:landingY});
        }
        // Same rule as a rolling tile: nothing below means it leaves the level.
        else fallOut(hit.source,hit.dir);
      }
    }
    // A queue of rollers unravels one after another: a stopped roller rolls
    // again as soon as the cell it was pressing against is free.
    for(const p of stones){
      if(p.type!=='tumbler'||p.state!=='flat'||!p.resumeRoll)continue;
      const dir=p.resumeRoll,x=p.x+dir;
      if(!floor(x,p.y))continue;
      const blocked=stones.some(s=>s.id!==p.id&&s.y===p.y&&s.state!=='vanished'&&
        (s.x===x||(s.state==='flat'&&s.x+(s.dir||0)===x)));
      if(blocked)continue;
      p.resumeRoll=0;
      beginRoll(p,dir,true);
    }
    capture(impacts,effects);
    collisionEffects=null;
    return true;
  }
  return {
    get stones(){return stones;}, get bridges(){return bridges;}, get holes(){return holes;},
    get crashed(){return crashed;}, get overflow(){return overflow;}, get time(){return time;},
    get trace(){return trace;},
    activateStone(id,dir){const p=find(id);if(!p||p.state!=='upright'||p.type==='splitter')return false;activate(p,dir);return true;},
    addStone(piece){stones.push({...clone(piece),state:'upright',dir:0,finish:null,dropX:undefined,dropY:undefined});},
    dropCarriedStone(piece,{from,to,dir=1}){
      if(crashed||overflow||find(piece.id)||to.y<=from.y||!floor(to.x,to.y))return false;
      // Dropping into a vertical riser: the two bodies meet in the gap and
      // both fall to the landing platform as broken rubble.
      const riser=stones.find(s=>s.type==='ascender'&&s.x===to.x&&(s.y===from.y||s.y===from.y-1)&&
        s.state==='ceiling'&&!s.ceilingAngle);
      if(riser){
        stones.push({...clone(piece),x:to.x,y:to.y,state:'crashed',dir,finish:time,crashCovered:true});
        riser.x=to.x;riser.y=to.y;riser.state='crashed';riser.crashPile=true;
        riser.passiveRise=false;riser.finish=time;
        crashed=true;
        return true;
      }
      if(piece.type==='ascender'){
        // A riser released over a ledge never lands: it starts climbing from
        // the ant's height and hangs under the ceiling above.
        const p={...clone(piece),x:to.x,y:from.y,state:'upright',dir:0,finish:null};
        stones.push(p);
        ascenders.begin(p,dir,true);
        return true;
      }
      stones.push({...clone(piece),x:to.x,y:from.y,state:'dropping',dir,finish:null,
        dropX:to.x,dropY:to.y,carriedDrop:true});
      schedule('carried-land',piece.id,dir,time+carriedDropTiming(to.y-from.y,timing).brickMs/timing.beat,{x:to.x,y:to.y});
      return true;
    },
    removeStone(id){const i=stones.findIndex(p=>p.id===id);if(i<0)return null;return stones.splice(i,1)[0];},
    step,
    get nextTickBeats(){return events.length?Math.min(1,Math.max(0,Math.min(...events.map(e=>e.time))-time)):0;},
    tick(){
      // Live playback advances one clock beat, including gaps between events.
      // New pushes during a gap are scheduled from the current live time.
      if(!events.length||crashed||overflow)return false;
      if(Math.min(...events.map(e=>e.time))>time+1){time++;return false;}
      return step();
    },
    done(){return events.length===0||crashed||overflow;},
    capture,
    snapshot(){return {time,pieces:clone(stones),bridges:clone(bridges),holes:clone(holes),crashed,overflow};},
  };
}

export function simulate(level, pieces, starterId, direction, structures = {}, timing = baseDominoTiming) {
  const chain=createChain(level,pieces,structures,timing);
  const starter=chain.stones.find(p=>p.id===starterId);
  if (!starter || ['splitter','stopper'].includes(starter.type) || ![-1,1].includes(direction)) return {valid:false,won:false,reason:'invalid',trace:[],pieces:chain.stones,bridges:chain.bridges};
  chain.activateStone(starterId,direction);chain.capture();
  while(!chain.done())chain.step();
  const {pieces:stones,bridges,holes,crashed,overflow}=chain.snapshot();
  const {trace}=chain;
  const outcome=dominoOutcome({pieces:stones,expectedPieces:level.pieces||pieces,crashed,overflow});
  return {valid:true,...outcome,trace,pieces:stones,bridges,holes};
}

export function validPosition(level, position, {resolvedPieces=[],bridges=[],holes=[]}={}) {
  if(!position || !Array.isArray(position.pieces)||!Number.isSafeInteger(position.moves)||position.moves<0 || !walkable(level,position.player||{},bridges,holes)) return false;
  const all=[...(Array.isArray(position.pieces)?position.pieces:[]),...(position.carrying?[position.carrying]:[])];
  if(level.rules==='dos'?all.length>level.pieces.length:all.length!==level.pieces.length)return false;
  if(new Set(all.map(p=>p.id)).size!==all.length)return false;
  if(!all.every(p=>level.pieces.some(q=>q.id===p.id&&q.type===p.type)))return false;
  if(position.carrying?.type==='trigger')return false;
  if(!position.pieces.every(p=>Number.isInteger(p.x)&&Number.isFinite(p.y)&&hasFloor(level,p.x,p.y,bridges,holes)))return false;
  if(new Set(position.pieces.map(p=>`${p.x},${p.y}`)).size!==position.pieces.length)return false;
  if(level.rules!=='dos'&&position.pieces.some(p=>at(p,level.exit)&&p.type!=='vanish'))return false;
  return level.pieces.filter(p=>p.type==='trigger').every(p=>position.pieces.some(q=>q.id===p.id&&at(p,q))||
    level.rules==='dos'&&resolvedPieces.some(q=>q.id===p.id&&q.type===p.type&&at(p,q)&&['flat','vanished','ceiling'].includes(q.state)));
}

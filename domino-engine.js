import {baseDominoTiming,eventBeatDuration} from './domino-timing.js?v=2';
import {createAscenderMechanic} from './domino-ascender-engine.js?v=5';
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
export const walkable = (level, p, bridges = [], holes = []) => Number.isInteger(p.x) && Number.isFinite(p.y) && (hasFloor(level, p.x, p.y, bridges, holes) || onLadder(level, p.x, p.y));
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
      // The ant can drift one column while falling, so consider the three
      // columns around the edge; a fall of more than three rows is fatal.
      for (const drift of [0, dx, -dx]) {
        const lx = x + drift;
        const landing = level.platforms
          .filter(([y, a, b]) => y > p.y && lx >= a && lx <= b && !holes.some(h => h.x === lx && h.y === y))
          .sort((a, b) => a[0] - b[0])[0];
        if (landing && !out.some(q => q.x === lx && q.y === landing[0])) out.push({x: lx, y: landing[0]});
      }
    }
  }
  return out;
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
export function entryCell(level) {
  if (level.entry && Number.isInteger(level.entry.x)) return {x: level.entry.x, y: level.player.y};
  return [{x: level.player.x - 1, y: level.player.y}, {x: level.player.x + 1, y: level.player.y}].find(q => hasFloor(level, q.x, q.y)) || null;
}
export function doorBlocked(level, p) {
  const cells = [];
  const push = (x, y) => { if (Number.isInteger(x) && Number.isInteger(y)) cells.push({x, y}); };
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
  if (action.type==='walk') {
    if (!neighbors(level,position.player).some(p=>at(p,action.to))) return null;
    next.player=clone(action.to);next.moves++;return next;
  }
  if (action.type==='take') {
    if (position.carrying) return null;
    const piece=next.pieces.find(p=>at(p,position.player));
    if (!piece || piece.type==='trigger') return null;
    next.carrying=piece;next.pieces=next.pieces.filter(p=>p.id!==piece.id);next.moves++;return next;
  }
  if (action.type==='place') {
    if (!position.carrying || !hasFloor(level,position.player.x,position.player.y) || position.pieces.some(p=>at(p,position.player))) return null;
    if (doorBlocked(level, position.player)) {
      const entry = entryCell(level);
      const atEntry = entry && at(position.player, entry);
      if (atEntry || position.carrying.type !== 'vanish') return null;
    }
    next.pieces.push({...next.carrying,...position.player});next.carrying=null;next.moves++;return next;
  }
  return null;
}

// Event time is measured in base clock beats. Equal-time events are resolved together so
// "trigger last" cannot depend on the iteration order of the domino array.
export function createChain(level, pieces, structures = {}, timing = baseDominoTiming) {
  const stones=clone(pieces).map(p=>({...p,state:'upright',dir:0,finish:null}));
  const bridges=clone(structures.bridges||[]),holes=clone(structures.holes||[]),events=[],trace=[];
  let time=0,crashed=false,overflow=false;
  const find=id=>stones.find(p=>p.id===id);
  const schedule=(kind,id,dir,when,extra={})=>{
    const elapsed=(when-time)*eventBeatDuration(kind,find(id)?.type,timing)/timing.beat;
    events.push({kind,id,dir,time:Math.round((time+elapsed)*1e9)/1e9,...extra});
  };
  const capture=(impacts=[],effects=[])=>trace.push({time,pieces:clone(stones),bridges:clone(bridges),holes:clone(holes),crashed,impacts:clone(impacts),effects:clone(effects)});
  const floor=(x,y)=>hasFloor(level,x,y,bridges)&&!holes.some(h=>h.x===x&&h.y===y);
  const activate=(piece,dir,fromAbove=false)=>{
    if (!piece || piece.state!=='upright') return;
    if (piece.type==='splitter' && !fromAbove) {crashed=true;piece.state='crashed';return;}
    if (piece.type==='tumbler') {
      piece.dir=dir;piece.state='rolling';schedule('roll',piece.id,dir,time+1);return;
    }
    if (piece.type==='ascender') {
      ascenders.begin(piece,dir);return;
    }
    piece.dir=dir;piece.state=piece.type==='delay'?'waiting':'falling';
    schedule('settle',piece.id,dir,time+(piece.type==='delay'?3:1));
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
    for(const q of stones){
      if(q===piece||q.state!=='flat'||q.y!==hy||q.x+q.dir!==hx)continue;
      const landing=level.platforms
        .filter(([y,from,to])=>y>hy&&hx>=from&&hx<=to&&!holes.some(h=>h.x===hx&&h.y===y))
        .sort((a,b)=>a[0]-b[0])[0];
      if(landing){
        const rows=Math.max(1,landing[0]-hy);
        q.state='dropping';q.dropX=hx;q.dropY=landing[0];
        for(let k=1;k<rows;k++)schedule('drop-tick',q.id,q.dir,time+k);
        schedule('land',q.id,q.dir,time+rows,{x:hx,y:landing[0]});
      }
      else {q.state='vanished';q.finish=time;}
    }
  };
  let rounds=0;
  function step(){
    if(!events.length||crashed||overflow)return false;
    if(++rounds>200){overflow=true;return false;}
    time=Math.min(...events.map(e=>e.time));
    const batch=events.filter(e=>e.time===time);
    const impacts=[],effects=[];
    for (let i=events.length-1;i>=0;i--) if(events[i].time===time) events.splice(i,1);
    const hits=[];
    for (const event of batch) {
      const p=find(event.id);
      // Ascenders never enter the ordinary fall, landing or rebound handlers.
      if(p?.type==='ascender'){ascenders.handle(event,p,effects);continue;}
      if (event.kind==='drop-tick') continue;
      if (event.kind==='impact-end') {p.state='vanished';continue;}
      if (event.kind==='roll') {
        const x=p.x+event.dir;
        if(x<0||x>=level.width){p.state='vanished';p.finish=time;continue;}
        const target=stones.find(s=>s.id!==p.id&&s.x===x&&s.y===p.y&&s.state!=='vanished');
        if(target){
          if(target.type==='stopper'){
            effects.push({kind:'rebound',sourceId:p.id,targetId:target.id});
            p.dir=-event.dir;
            schedule('roll',p.id,-event.dir,time+1);
            continue;
          }
          if(target.type==='splitter'){crashed=true;target.state='crashed';p.state='crashed';continue;}
          if(target.state==='upright')activate(target,event.dir);
          if(level.rules==='dos'){
            // Pushover tumbler: it shoves the standing domino out of the way
            // and keeps rolling.
            p.x=x;schedule('roll',p.id,event.dir,time+1);continue;
          }
          p.state='flat';p.finish=time;continue;
        }
        if(!floor(x,p.y)){
          const landing=level.platforms.filter(([y,from,to])=>y>p.y&&x>=from&&x<=to&&!holes.some(h=>h.x===x&&h.y===y)).sort((a,b)=>a[0]-b[0])[0];
          if(landing){
            const rows=Math.max(1,landing[0]-p.y);
            p.state='dropping';p.dropX=x;p.dropY=landing[0];
            // Reserve one beat for the airborne half-turn, then fall upright.
            const beats=Math.max(2,rows);
            for(let k=1;k<beats;k++)schedule('drop-tick',p.id,event.dir,time+k);
            schedule('land',p.id,event.dir,time+beats,{x,y:landing[0]});
          }
          else {p.state='vanished';p.finish=time;}
          continue;
        }
        p.x=x;schedule('roll',p.id,event.dir,time+1);continue;
      }
      if (event.kind==='topple') {
        const dir=p.dir||event.dir;
        const nx=p.x+dir;
        const next=stones.find(s=>s.id!==p.id&&s.x===nx&&s.y===p.y&&s.state!=='vanished');
        if(next){
          if(next.type==='stopper'){
            effects.push({kind:'rebound',sourceId:p.id,targetId:next.id});
            p.state='returning';p.finish=null;
            schedule('reverse-turn',p.id,-dir,time+2);
          }
          else if(next.type==='splitter'){crashed=true;next.state='crashed';p.state='crashed';}
          else {if(next.state==='upright')activate(next,dir);p.state='flat';p.finish=time;}
        } else if(!floor(nx,p.y)){
          const l2=level.platforms.filter(([y,from,to])=>y>p.y&&nx>=from&&nx<=to&&!holes.some(h=>h.x===nx&&h.y===y)).sort((a,b)=>a[0]-b[0])[0];
          if(l2){
            const rows=Math.max(1,l2[0]-p.y);
            p.state='dropping';p.dropX=nx;p.dropY=l2[0];
            for(let k=1;k<rows;k++)schedule('drop-tick',p.id,dir,time+k);
            schedule('land',p.id,dir,time+rows,{x:nx,y:l2[0]});
          } else {p.state='flat';p.finish=time;}
        } else {p.state='flat';p.finish=time;}
        continue;
      }
      if (event.kind==='reverse-turn') {
        p.dir=event.dir;p.state='reversing';
        // A normal tile contacts its neighbour halfway through the swing;
        // finishing its own motion is a separate event.
        schedule('reverse-hit',p.id,event.dir,time+(p.type==='normal'?1:2));
        if(p.type==='normal')schedule('normal-reverse-rest',p.id,event.dir,time+2);
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
        else if(back&&back.state==='upright')activate(back,p.dir||event.dir);
        if(p.type!=='normal'){p.state='flat';p.finish=time;}
        continue;
      }
      if (event.kind==='normal-reverse-rest') {
        // A collision may already have started another rebound or a drop.
        if(p.state==='reversing'){p.state='flat';p.finish=time;}
        continue;
      }
      if (event.kind==='land') {
        p.x=event.x;p.y=event.y;p.finish=time;
        if(p.type==='exploder'){
        if(level.rules==='dos'){ explode(p, effects); }
        else {
          p.state='vanished';p.finish=time;holes.push({x:p.x,y:p.y});
          effects.push({kind:'explode',sourceId:p.id,x:p.x,y:p.y});
          hits.push({x:p.x+event.dir,y:p.y,dir:event.dir,source:p});
        }
        continue;
      }
        const target=stones.find(s=>s.id!==p.id&&s.x===event.x&&s.y===event.y&&s.state!=='vanished');
        if (target?.type==='splitter'&&target.state==='upright') {
          // Hold the falling domino at the point of contact for one animation beat.
          // The following impact-end event removes it after the collision is visible.
          p.state='impact';
          schedule('impact-end',p.id,event.dir,time+1);
          hits.push({target,dir:event.dir,above:true,sourceId:p.id});
        }
        else if (target) {crashed=true;target.state='crashed';p.state='crashed';}
        else if (p.type==='tumbler') {
          p.state='rolling';schedule('roll',p.id,p.dir||event.dir,time+1);
        }
        else if (p.type==='normal'&&level.rules==='dos') {
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
        p.state='rolling';schedule('roll',p.id,event.dir,time+1);continue;
      }
      p.state=p.type==='vanish'?'vanished':'flat';p.finish=time;
      if(p.type==='splitter') {
        for(const dir of [-1,1]) hits.push({x:p.x+dir,y:p.y,dir});
        continue;
      }
      let x=p.x+event.dir;
      if (p.type==='bridge'&&!floor(x,p.y)&&x>=0&&x<level.width&&floor(x+event.dir,p.y)) {
        // The bridge spans the gap, then the bridge domino vanishes.
        bridges.push({x,y:p.y,dir:event.dir});
        p.state='vanished';p.finish=time;
        continue;
      }
      hits.push({x,y:p.y,dir:event.dir,source:p});
    }
    // First finish every domino for this tick, then deliver all impacts.
    for (const hit of hits) {
      if (hit.target) {
        if(hit.target.type==='splitter'&&hit.above)impacts.push({kind:'splitter-hit',sourceId:hit.sourceId,targetId:hit.target.id});
        activate(hit.target,hit.dir,hit.above);continue;
      }
      const target=stones.find(p=>p.x===hit.x&&p.y===hit.y&&p.state!=='vanished');
      if (target) {
        if(target.type==='stopper'){
          effects.push({kind:'rebound',sourceId:hit.source?.id,targetId:target.id});
          if(hit.source){
            hit.source.state='returning';hit.source.finish=null;
            schedule('reverse-turn',hit.source.id,-hit.dir,time+2);
          }
          continue;
        }
        if(target.state==='upright') activate(target,hit.dir);
        else if(target.state==='falling'||target.state==='waiting') {
          if(target.dir!==hit.dir){target.state='crashed';crashed=true;}
        }
      } else if (hit.source&&!floor(hit.x,hit.y)&&hit.x>=0&&hit.x<level.width) {
        // A falling domino can start a lower chain only by landing on a splitter.
        const landing=level.platforms.filter(([y,from,to])=>y>hit.y&&hit.x>=from&&hit.x<=to&&!holes.some(h=>h.x===hit.x&&h.y===y)).sort((a,b)=>a[0]-b[0])[0];
        if (landing) {
          const rows=Math.max(1,landing[0]-hit.y);
          hit.source.state='dropping';
          hit.source.dropX=hit.x;hit.source.dropY=landing[0];
          for(let k=1;k<rows;k++)schedule('drop-tick',hit.source.id,hit.dir,time+k);
          schedule('land',hit.source.id,hit.dir,time+rows,{x:hit.x,y:landing[0]});
        }
      }
    }
    capture(impacts,effects);
    return true;
  }
  return {
    get stones(){return stones;}, get bridges(){return bridges;}, get holes(){return holes;},
    get crashed(){return crashed;}, get overflow(){return overflow;}, get time(){return time;},
    get trace(){return trace;},
    activateStone(id,dir){const p=find(id);if(!p||p.state!=='upright'||p.type==='splitter')return false;activate(p,dir);return true;},
    addStone(piece){stones.push({...clone(piece),state:'upright',dir:0,finish:null,dropX:undefined,dropY:undefined});},
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
  const trigger=stones.find(p=>p.type==='trigger');
  const triggers=stones.filter(p=>p.type==='trigger');
  const others=stones.filter(p=>p!==trigger);
  const allDown=stones.every(p=>p.type==='stopper'||['flat','vanished','ceiling'].includes(p.state));
  // A domino that drops onto the splitter is consumed at impact, before it fires.
  const last=!!trigger&&trigger.finish!==null&&others.filter(p=>p.type!=='stopper').every(p=>p.finish!==null&&p.finish<trigger.finish);
  const won=!crashed&&!overflow&&allDown&&last;
  const tied=allDown&&!last&&others.some(p=>p.type!=='stopper'&&p.finish===trigger?.finish)&&!others.some(p=>p.type!=='stopper'&&p.finish>trigger?.finish);
  const reason=crashed?'crash':overflow?'overflow':!allDown?'remaining':!last?(tied?'tie':'early'):'clear';
  const problemIds=reason==='crash'?stones.filter(p=>p.state==='crashed').map(p=>p.id)
    :reason==='remaining'?stones.filter(p=>p.type!=='stopper'&&!['flat','vanished','ceiling'].includes(p.state)).map(p=>p.id)
    :['tie','early'].includes(reason)&&trigger?stones.filter(p=>p===trigger||p.finish>=trigger.finish).map(p=>p.id):[];
  return {valid:true,won,reason,problemIds,trace,pieces:stones,bridges,holes};
}

export function validPosition(level, position) {
  if(!position || !Array.isArray(position.pieces)||!Number.isSafeInteger(position.moves)||position.moves<0 || !walkable(level,position.player||{})) return false;
  const all=[...(Array.isArray(position.pieces)?position.pieces:[]),...(position.carrying?[position.carrying]:[])];
  if(level.rules==='dos'?all.length>level.pieces.length:all.length!==level.pieces.length)return false;
  if(new Set(all.map(p=>p.id)).size!==all.length)return false;
  if(!all.every(p=>level.pieces.some(q=>q.id===p.id&&q.type===p.type)))return false;
  if(position.carrying?.type==='trigger')return false;
  if(!position.pieces.every(p=>Number.isInteger(p.x)&&Number.isFinite(p.y)&&hasFloor(level,p.x,p.y)))return false;
  if(new Set(position.pieces.map(p=>`${p.x},${p.y}`)).size!==position.pieces.length)return false;
  if(level.rules!=='dos'&&position.pieces.some(p=>at(p,level.exit)&&p.type!=='vanish'))return false;
  return level.pieces.filter(p=>p.type==='trigger').every(p=>position.pieces.some(q=>q.id===p.id&&at(p,q)));
}

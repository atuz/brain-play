// Independent, discrete JavaScript rules for the original Brain Play domino puzzles.
// No Domino-Chain/Pushover program, graphics, sounds or levels are included.
export const TYPES = ['normal', 'delay', 'bridge', 'vanish', 'splitter', 'trigger'];
export const at = (a, b) => a.x === b.x && a.y === b.y;
export const clone = value => JSON.parse(JSON.stringify(value));
export const hasFloor = (level, x, y, bridges = []) =>
  x >= 0 && x < level.width && y >= 0 && y < level.height &&
  (level.platforms.some(([row, from, to]) => row === y && x >= from && x <= to) || bridges.some(p => p.x === x && p.y === y));
const onLadder = (level, x, y) => level.ladders.some(l => l.x === x && y >= l.from && y <= l.to);
export const walkable = (level, p, bridges = []) => Number.isInteger(p.x) && Number.isInteger(p.y) && (hasFloor(level, p.x, p.y, bridges) || onLadder(level, p.x, p.y));
export function neighbors(level, p, bridges = []) {
  const out = [];
  for (const dx of [-1, 1]) {
    const q = {x:p.x + dx, y:p.y};
    if (hasFloor(level, p.x, p.y, bridges) && hasFloor(level, q.x, q.y, bridges)) out.push(q);
  }
  for (const dy of [-1, 1]) {
    const q = {x:p.x, y:p.y + dy};
    if (level.ladders.some(l => l.x === p.x && Math.min(p.y,q.y) >= l.from && Math.max(p.y,q.y) <= l.to)) out.push(q);
  }
  return out;
}
export function pathTo(level, start, target, bridges = []) {
  if (!walkable(level, start, bridges) || !walkable(level, target, bridges)) return null;
  const key = p => `${p.x},${p.y}`, queue = [start], previous = new Map([[key(start), null]]);
  for (let i=0;i<queue.length;i++) {
    const p = queue[i];
    if (at(p,target)) {
      const path=[]; let cursor=p;
      while (previous.get(key(cursor))) {path.push(cursor);cursor=previous.get(key(cursor));}
      return path.reverse();
    }
    for (const q of neighbors(level,p,bridges)) if (!previous.has(key(q))) {previous.set(key(q),p);queue.push(q);}
  }
  return null;
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
    if (at(position.player,level.exit) && position.carrying.type!=='vanish') return null;
    next.pieces.push({...next.carrying,...position.player});next.carrying=null;next.moves++;return next;
  }
  return null;
}

// Each event has an integer time. Equal-time events are resolved together so
// "trigger last" cannot depend on the iteration order of the domino array.
export function simulate(level, pieces, starterId, direction) {
  const stones=clone(pieces).map(p=>({...p,state:'upright',dir:0,finish:null}));
  const bridges=[],events=[],trace=[];
  let time=0,crashed=false,overflow=false;
  const find=id=>stones.find(p=>p.id===id);
  const schedule=(kind,id,dir,when,extra={})=>events.push({kind,id,dir,time:when,...extra});
  const capture=()=>trace.push({time,pieces:clone(stones),bridges:clone(bridges),crashed});
  const activate=(piece,dir,fromAbove=false)=>{
    if (!piece || piece.state!=='upright') return;
    if (piece.type==='splitter' && !fromAbove) {crashed=true;piece.state='crashed';return;}
    piece.dir=dir;piece.state=piece.type==='delay'?'waiting':'falling';
    schedule('settle',piece.id,dir,time+(piece.type==='delay'?3:1));
  };
  const starter=find(starterId);
  if (!starter || starter.type==='splitter' || ![-1,1].includes(direction)) return {valid:false,won:false,reason:'invalid',trace:[],pieces:stones,bridges};
  activate(starter,direction);capture();
  let rounds=0;
  while (events.length && !crashed) {
    if (++rounds>200) {overflow=true;break;}
    time=Math.min(...events.map(e=>e.time));
    const batch=events.filter(e=>e.time===time);
    for (let i=events.length-1;i>=0;i--) if(events[i].time===time) events.splice(i,1);
    const hits=[];
    for (const event of batch) {
      const p=find(event.id);
      if (event.kind==='land') {
        p.x=event.x;p.y=event.y;p.state='vanished';p.finish=time;
        const target=stones.find(s=>s.id!==p.id&&s.x===event.x&&s.y===event.y&&s.state!=='vanished');
        if (target?.type==='splitter'&&target.state==='upright') hits.push({target,dir:event.dir,above:true});
        else if (target) {crashed=true;target.state='crashed';p.state='crashed';}
        continue;
      }
      p.state=p.type==='vanish'?'vanished':'flat';p.finish=time;
      if(p.type==='splitter') {
        for(const dir of [-1,1]) hits.push({x:p.x+dir,y:p.y,dir});
        continue;
      }
      let x=p.x+event.dir;
      if (p.type==='bridge'&&!hasFloor(level,x,p.y,bridges)&&x>=0&&x<level.width&&hasFloor(level,x+event.dir,p.y,bridges)) {
        bridges.push({x,y:p.y,dir:event.dir});x+=event.dir;
      }
      hits.push({x,y:p.y,dir:event.dir,source:p});
    }
    // First finish every domino for this tick, then deliver all impacts.
    for (const hit of hits) {
      if (hit.target) {activate(hit.target,hit.dir,hit.above);continue;}
      const target=stones.find(p=>p.x===hit.x&&p.y===hit.y&&p.state!=='vanished');
      if (target) {
        if(target.state==='upright') activate(target,hit.dir);
        else if(target.state==='falling'||target.state==='waiting') {
          if(target.dir!==hit.dir){target.state='crashed';crashed=true;}
        }
      } else if (hit.source&&!hasFloor(level,hit.x,hit.y,bridges)&&hit.x>=0&&hit.x<level.width) {
        // A falling domino can start a lower chain only by landing on a splitter.
        const landing=level.platforms.filter(([y,from,to])=>y>hit.y&&hit.x>=from&&hit.x<=to).sort((a,b)=>a[0]-b[0])[0];
        if (landing) {
          hit.source.state='dropping';
          hit.source.dropX=hit.x;hit.source.dropY=landing[0];
          schedule('land',hit.source.id,hit.dir,time+Math.max(1,landing[0]-hit.y),{x:hit.x,y:landing[0]});
        }
      }
    }
    capture();
  }
  const trigger=stones.find(p=>p.type==='trigger');
  const others=stones.filter(p=>p!==trigger);
  const allDown=stones.every(p=>['flat','vanished'].includes(p.state));
  // A domino that drops onto the splitter is consumed at impact, before it fires.
  const last=trigger?.finish!==null&&others.every(p=>p.finish!==null&&p.finish<trigger.finish);
  const won=!crashed&&!overflow&&allDown&&last;
  const tied=allDown&&!last&&others.some(p=>p.finish===trigger?.finish)&&!others.some(p=>p.finish>trigger?.finish);
  const reason=crashed?'crash':overflow?'overflow':!allDown?'remaining':!last?(tied?'tie':'early'):'clear';
  const problemIds=reason==='crash'?stones.filter(p=>p.state==='crashed').map(p=>p.id)
    :reason==='remaining'?stones.filter(p=>!['flat','vanished'].includes(p.state)).map(p=>p.id)
    :['tie','early'].includes(reason)?stones.filter(p=>p===trigger||p.finish>=trigger.finish).map(p=>p.id):[];
  return {valid:true,won,reason,problemIds,trace,pieces:stones,bridges};
}

export function validPosition(level, position) {
  if(!position || !Array.isArray(position.pieces)||!Number.isSafeInteger(position.moves)||position.moves<0 || !walkable(level,position.player||{})) return false;
  const all=[...(Array.isArray(position.pieces)?position.pieces:[]),...(position.carrying?[position.carrying]:[])];
  if(all.length!==level.pieces.length||new Set(all.map(p=>p.id)).size!==all.length)return false;
  if(!all.every(p=>level.pieces.some(q=>q.id===p.id&&q.type===p.type)))return false;
  if(position.carrying?.type==='trigger')return false;
  if(!position.pieces.every(p=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&hasFloor(level,p.x,p.y)))return false;
  if(new Set(position.pieces.map(p=>`${p.x},${p.y}`)).size!==position.pieces.length)return false;
  if(position.pieces.some(p=>at(p,level.exit)&&p.type!=='vanish'))return false;
  return level.pieces.filter(p=>p.type==='trigger').every(p=>position.pieces.some(q=>q.id===p.id&&at(p,q)));
}

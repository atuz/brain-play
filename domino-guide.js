import {at,clone,hasFloor,pathTo} from './domino-engine.js?v=13';

export function failureSummary(result){
  return ({tie:'开门牌和标出的骨牌同时倒下；开门牌必须更晚。',
    early:'开门牌先倒了，标出的骨牌还在后面。',
    remaining:'还有骨牌没倒，已在棋盘上标出。',
    crash:'标出的骨牌撞坏了，落下的牌需要分叉牌接住。',
  })[result?.reason]||'连锁没有完成，再调整一下。';
}
// This is a route toward a verified reference arrangement, not a shortest-path
// solver. Identical regular dominoes are interchangeable; existing edits remain.
export function referenceLayout(level){
  const pieces=clone(level.pieces);
  for(const transfer of level.plan){
    const piece=pieces.find(p=>at(p,transfer.from));
    if(!piece)throw new Error(`Invalid domino plan: ${level.id}`);
    Object.assign(piece,transfer.to);
  }
  return pieces;
}
export function nextGuide(level,position){
  const goal=referenceLayout(level),pieces=position.pieces,key=p=>`${p.x},${p.y}`;
  const occupied=p=>pieces.some(q=>at(p,q));
  const correct=p=>goal.some(q=>q.type===p.type&&at(p,q));
  const reachable=p=>pathTo(level,position.player,p)!==null;
  const floor=[];
  for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++)if(hasFloor(level,x,y))floor.push({x,y});
  const buffer=()=>floor.find(p=>!occupied(p)&&!at(p,level.exit)&&!goal.some(q=>at(p,q))&&reachable(p));
  const destinations=type=>goal.filter(p=>p.type===type&&!occupied(p)&&reachable(p));
  if(position.carrying){
    const target=destinations(position.carrying.type)[0]||buffer();
    if(!target)return {kind:'unavailable'};
    return {kind:at(position.player,target)?'place':'walk-place',type:position.carrying.type,target:{x:target.x,y:target.y}};
  }
  const wrong=pieces.filter(p=>!correct(p)&&p.type!=='trigger');
  if(!wrong.length){
    const target={x:level.push.x,y:level.push.y};
    return {kind:at(position.player,target)?'push':'walk-push',target,dir:level.push.dir};
  }
  for(const source of wrong){
    const target=destinations(source.type)[0];
    if(target&&reachable(source))return {kind:at(position.player,source)?'take':'walk-take',type:source.type,source:{x:source.x,y:source.y},target:{x:target.x,y:target.y}};
  }
  // A cycle such as normal↔delay needs an unused floor tile as temporary storage.
  const source=wrong.find(p=>goal.some(q=>at(p,q))&&reachable(p)),target=buffer();
  if(!source||!target)return {kind:'unavailable'};
  return {kind:at(position.player,source)?'take-buffer':'walk-buffer',type:source.type,source:{x:source.x,y:source.y},target};
}

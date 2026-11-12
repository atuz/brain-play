import {hasFloor,walkable} from './domino-engine.js?v=177';

// Re-evaluate after every terrain change, rather than at chain completion.
export function antFallTarget(level,player,{bridges=[],holes=[]}={}){
  if(walkable(level,player,bridges,holes))return null;
  let x=player.x;
  if(player.side===1){
    const hole=holes.find(h=>h.y===player.y&&(h.x===player.x||h.x===player.x+1));
    x=hole?.x??Math.max(0,Math.min(level.width-1,player.x));
  }
  const floors=[...level.platforms,...bridges.map(p=>[p.y,p.x,p.x])];
  const landing=floors.filter(([y,a,b])=>y>player.y&&x>=a&&x<=b&&hasFloor(level,x,y,bridges,holes))
    .sort((a,b)=>a[0]-b[0])[0];
  const to={x,y:landing?.[0]??level.height+1},rows=to.y-player.y;
  return {from:{...player},to,rows,fatal:!landing||rows>3};
}

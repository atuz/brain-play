import {anchor,shaft} from './machine-parts.js';
import {ropePoints} from './machine-rope.js';

// Canvas rendering and the touch targets share the same attachment points/curves.
export function connectionPaths(link,pieces,mode='edit'){
  const a=pieces.find(p=>p.id===link.a),b=pieces.find(p=>p.id===link.b);
  if(!a||!b)return [];
  if(link.type==='belt'){
    const A=shaft(a),B=shaft(b),angle=Math.atan2(B.y-A.y,B.x-A.x),nx=-Math.sin(angle)*7,ny=Math.cos(angle)*7;
    return [-1,1].map(sign=>({from:{x:A.x+nx*sign,y:A.y+ny*sign},to:{x:B.x+nx*sign,y:B.y+ny*sign}}));
  }
  if(link.type==='wire')return [{from:{x:a.x,y:a.y+15},control:{x:(a.x+b.x)/2,y:Math.max(a.y,b.y)+35},to:{x:b.x,y:b.y}}];
  const A=anchor(a),B=anchor(b);
  if(link.via?.length&&!link.cut){const points=ropePoints(link,pieces);return points.slice(1).map((to,i)=>({from:points[i],to}));}
  return [link.cut?{from:A,control:{x:A.x+12,y:A.y+30},to:{x:A.x,y:A.y+40}}:
    {from:A,control:{x:(A.x+B.x)/2,y:(A.y+B.y)/2+(mode==='edit'?12:Math.max(2,Math.min(55,(link.slack||0)*.35)))},to:B}];
}

export function connectionPathData(paths){
  return paths.map(({from,control,to})=>`M ${from.x} ${from.y} ${control?`Q ${control.x} ${control.y}`:'L'} ${to.x} ${to.y}`).join(' ');
}

export function traceConnection(c,paths){
  c.beginPath();for(const {from,control,to} of paths){c.moveTo(from.x,from.y);if(control)c.quadraticCurveTo(control.x,control.y,to.x,to.y);else c.lineTo(to.x,to.y);}
}

// Returning a connection preserves both endpoints; returning a part removes its
// incident connections too. Only items in the editable draft can be returned.
export function returnToTray(draft,id){
  const piece=draft.pieces.some(p=>p.id===id);
  if(!piece&&!draft.links.some(l=>l.id===id))return null;
  return {pieces:draft.pieces.filter(p=>p.id!==id),links:draft.links.filter(l=>l.id!==id&&(!piece||l.a!==id&&l.b!==id&&!l.via?.includes(id)))};
}

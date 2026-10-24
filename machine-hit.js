import {dimensions} from './machine-parts.js?v=48';

function contains(point,part,padding=0,minHalf=0){
  const {w,h}=dimensions(part),a=-(part.angle||0)*Math.PI/180;
  const dx=point.x-part.x,dy=point.y-part.y;
  return Math.abs(dx*Math.cos(a)-dy*Math.sin(a))<=Math.max(minHalf,w/2+padding)
    &&Math.abs(dx*Math.sin(a)+dy*Math.cos(a))<=Math.max(minHalf,h/2+padding);
}

// Keep generous touch targets, but do not let their invisible margins cover a
// neighbouring part or an empty position where the armed tool can legally fit.
export function hitPart(point,pieces,directId,{placeable=false,preferConnection=false}={}){
  const frontToBack=[...pieces].reverse();
  const visible=frontToBack.find(part=>contains(point,part));
  if(visible)return visible;
  if(placeable||preferConnection)return null;
  return pieces.find(part=>part.id===directId)
    ||frontToBack.find(part=>contains(point,part,4,22))||null;
}

// One tile is two quarter turns. The leading top corner touches the next
// upright tile before the rolling body reaches the horizontal pose.
export const dominoContactAngle=Math.asin(1-.32)*180/Math.PI;
export const dominoContactPhase=dominoContactAngle/90;
export const resistsDomino=target=>target?.type==='stopper'||target?.type==='delay'&&['waiting','falling'].includes(target.state);

export const reboundDuration=(phaseDistance,timing)=>Math.abs(phaseDistance)*timing.quarter;

export function tumblerRollTransform({phase,dir=1,width:cellWidth=40,height:cellHeight=40}){
  const w=.32*cellWidth,h=cellHeight,offX=.34*cellWidth,offY=-.10*cellHeight;
  const q=Math.floor(phase),fraction=phase-q,parity=((q%2)+2)%2,index=((q%4)+4)%4;
  const angle=phase*Math.PI/2*dir;
  let px=.66*cellWidth+Math.ceil(q/2)*h+Math.floor(q/2)*w,py=.90*cellHeight;
  const corners=[[w,h],[w,0],[0,0],[0,h]];
  let [lx,ly]=corners[index];
  if(dir<0){lx=w-lx;px=cellWidth-px;}
  const c=Math.cos(angle),s=Math.sin(angle);
  let x=px-(c*lx-s*ly)-offX,y=py-(s*lx+c*ly)-offY;
  const shift=parity===0?w*(q/2):w*((q-1)/2+fraction);
  x+=dir>0?-shift:shift;
  return `translate(${x}px,${y}px) rotate(${angle}rad)`;
}

export function advanceContactMotion(view,elapsed){
  view.elapsed=Math.min(view.duration,view.elapsed+elapsed);
  const progress=view.duration?view.elapsed/view.duration:1;
  if(view.returnDuration>0){
    view.phase=view.elapsed<view.returnDuration
      ?view.from+(view.via-view.from)*view.elapsed/view.returnDuration
      :view.via+(view.to-view.via)*(view.elapsed-view.returnDuration)/(view.duration-view.returnDuration);
  }else view.phase=view.from+(view.to-view.from)*progress;
  return progress===1;
}

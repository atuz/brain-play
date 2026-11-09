// One tile is two quarter turns. The leading top corner touches the next
// upright tile before the rolling body reaches the horizontal pose.
export const dominoContactAngle=Math.asin(1-.32)*180/Math.PI;
export const dominoContactPhase=dominoContactAngle/90;
export const resistsDomino=target=>target?.type==='stopper'||target?.type==='delay'&&['waiting','falling'].includes(target.state);

export const reboundDuration=(phaseDistance,timing)=>Math.abs(phaseDistance)*timing.quarter;

export function tumblerRollTransform({phase,dir=1,width:cellWidth=40,height:cellHeight=40}){
  // After a rebound crosses its original starting cell, the negative phase
  // is the same roll from upright in the opposite direction. Flooring a
  // negative quarter index applies the thickness correction to the wrong
  // half-turn, shifting the intermediate horizontal pose by one width.
  if(phase<0)return tumblerRollTransform({phase:-phase,dir:-dir,width:cellWidth,height:cellHeight});
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

// Keep the rolling anchor and artwork orientation, but seat the stopped
// body at its logical cell using the same bottom pivot as an ordinary tile.
export function tumblerRestTransform({phase,baseDir,dir,cellOffset,angle,lift=0,width=40,height=40}){
  const w=.32*width,h=height;
  const halfTurns=Math.round((phase*baseDir-dir)/2);
  const inverted=Math.abs(halfTurns%2)===1;
  const degrees=dir*angle+halfTurns*180,a=degrees*Math.PI/180;
  const c=Math.cos(a),s=Math.sin(a),ox=dir>0?w:0;
  const cornerX=inverted?w-ox:ox,cornerY=inverted?0:h;
  const px=cellOffset*width+ox,py=h-lift;
  return `matrix(${c},${s},${-s},${c},${px-c*cornerX+s*cornerY},${py-s*cornerX-c*cornerY})`;
}

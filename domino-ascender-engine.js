import {baseDominoTiming} from './domino-timing.js?v=3';
// Upward-moving domino rules. No ordinary falling/landing/rebound code is used.
import {ceilingContactAngle} from './domino-ascender-contact.js';

export function createAscenderMechanic({level,stones,floor,schedule,activate,getTime,timing=baseDominoTiming}) {
  function restOrRise(piece,dir,time) {
    // Once horizontal, the centre of the body lies in the next cell.
    // A ceiling over the old upright cell alone cannot hold it there.
    const nextX=piece.x+dir;
    if(!floor(nextX,piece.y-1)){
      piece.finish=null;piece.state='ceiling-escape';
      // Continue through horizontal, rotating another quarter-turn around
      // the outer corner before re-anchoring the now vertical body.
      schedule('ascender-resume',piece.id,dir,time+2);
    }else piece.finish=time;
  }
  function begin(piece,dir) {
    if(piece?.type!=='ascender')return false;
    piece.dir=dir;piece.state='ascending';
    schedule('ascender-rise',piece.id,dir,getTime()+timing.riseStart/timing.rise);
    return true;
  }
  function handle(event,p,effects) {
    if(p?.type!=='ascender')return false;
    const time=getTime();
    if(event.kind==='settle')return begin(p,event.dir);
    if(event.kind==='ascender-resume'){
      p.x+=event.dir;p.inverted=!p.inverted;
      if(p.x<0||p.x>=level.width){p.state='vanished';p.finish=time;return true;}
      p.state='ascending';
      // Start vertical travel immediately; do not insert an upright hold.
      return handle({...event,kind:'ascender-rise'},p,effects);
    }
    if (event.kind==='ascender-rise') {
      // The ascender climbs straight up one row at a time.  When the cell
      // above is a platform its top touches the underside; it then topples
      // in the push direction and stays flat under the ceiling.
      const above=p.y-1;
      const ceiling=above>=0&&floor(p.x,above);
      if(above<0){p.state='vanished';p.finish=time;return true;}
      if(ceiling){
        const target=stones.find(s=>s.id!==p.id&&s.x===p.x+event.dir&&[p.y,p.y+1].includes(s.y)&&s.type==='stopper');
        const contact=target?ceilingContactAngle(level,p,target,event.dir):null;
        p.state='ceiling';p.dir=event.dir;
        p.ceilingAngle=contact??90;
        p.ceilingTravel=contact!==null?timing.contact:timing.quarter;
        schedule('ascender-contact',p.id,event.dir,time+(contact!==null?1:2));
        // A non-stopper is activated on first overlap; the ascender keeps
        // playing the same swing through horizontal without changing direction.
        for(const other of stones){
          if(other.id===p.id||other.type==='stopper'||other.state==='vanished'||other.x!==p.x+event.dir||![p.y,p.y+1].includes(other.y))continue;
          const angle=ceilingContactAngle(level,p,other,event.dir);
          if(angle===null||(contact!==null&&angle>=contact))continue;
          schedule('ascender-forward-hit',p.id,event.dir,time+angle/45,{targetId:other.id});
        }
        return true;
      }
      p.y=above;schedule('ascender-rise',p.id,event.dir,time+1);return true;
    }
    if(event.kind==='ascender-forward-hit'){
      if(p.state!=='ceiling'||p.dir!==event.dir)return true;
      const target=stones.find(s=>s.id===event.targetId&&s.x===p.x+event.dir&&[p.y,p.y+1].includes(s.y));
      if(target?.state==='upright')activate(target,event.dir);
      return true;
    }
    if (event.kind==='ascender-contact') {
      if(p.state!=='ceiling')return true;
      const dir=p.dir||event.dir,hx=p.x+dir;
      const target=stones.find(s=>s.id!==p.id&&s.x===hx&&s.y===p.y&&s.state!=='vanished')
        ||stones.find(s=>s.id!==p.id&&s.x===hx&&s.y===p.y+1&&s.state!=='vanished');
      if(target&&target.type==='stopper'&&ceilingContactAngle(level,p,target,dir)!==null){
        // Only contact with a stopper starts the ascender's top-pivot rebound.
        effects.push({kind:'rebound',sourceId:p.id,targetId:target.id});
        p.state='ceiling-return';
        schedule('ascender-turn',p.id,-dir,time+1);
      }else{
        p.ceilingAngle=90;
        restOrRise(p,dir,time);
      }
      return true;
    }
    if (event.kind==='ascender-turn') {
      // Upright against the underside: switch from the near top corner
      // to the far top corner before swinging into the other neighbour.
      p.dir=event.dir;p.state='ceiling-reversing';p.ceilingAngle=90;p.ceilingTravel=timing.quarter;
      schedule('ascender-reverse-contact',p.id,event.dir,time+1);
      schedule('ascender-rest',p.id,event.dir,time+2);
      return true;
    }
    if (event.kind==='ascender-reverse-contact') {
      const hx=p.x+event.dir;
      const target=stones.find(s=>s.id!==p.id&&s.x===hx&&s.y===p.y&&s.state!=='vanished')
        ||stones.find(s=>s.id!==p.id&&s.x===hx&&s.y===p.y+1&&s.state!=='vanished');
      if(target?.type==='stopper')effects.push({kind:'rebound',sourceId:p.id,targetId:target.id});
      else if(target?.state==='upright')activate(target,event.dir);
      return true;
    }
    if (event.kind==='ascender-rest') {
      p.state='ceiling';
      restOrRise(p,p.dir||event.dir,time);
      return true;
    }
    return false;
  }
  return {begin,handle};
}

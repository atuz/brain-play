import {baseDominoTiming} from './domino-timing.js?v=3';
// Upward-moving domino rules. No ordinary falling/landing/rebound code is used.
import {ceilingContactAngle} from './domino-ascender-contact.js';
import {resistsDomino} from './domino-contact-motion.js?v=2';

export function createAscenderMechanic({level,stones,floor,schedule,activate,getTime,timing=baseDominoTiming}) {
  // A delay that is about to start moving no longer blocks: the last hit in
  // the original game lands just as its timer expires, so the riser lies flat.
  const delayGrace=0.1;
  const resists=piece=>{
    if(!piece)return false;
    if(piece.type==='delay'&&piece.state==='waiting'&&Number.isFinite(piece.delayStart)&&
      getTime()>=piece.delayStart-delayGrace)return false;
    return resistsDomino(piece)||piece.type==='delay'&&piece.state==='upright';
  };
  const gapTurn=timing.ascenderGapTurn??timing.quarter;
  // Half-row stair treads count as ceilings too: the body must not pass
  // through a short step while rising.
  const ceilingAbove=(piece,y)=>floor(piece.x,y-1)||floor(piece.x,y-0.5);
  const swingDuration=(piece,dir)=>floor(piece.x+dir,piece.y-1)||floor(piece.x+dir,piece.y-0.5)
    ?(timing.ascenderSwing??timing.quarter):gapTurn;
  function rebound(piece,target,dir,time,effects){
    effects.push({kind:'rebound',sourceId:piece.id,targetId:target.id});
    piece.finish=null;piece.state='ceiling-return';
    schedule('ascender-turn',piece.id,-dir,time+1);
  }
  function restOrRise(piece,dir,time) {
    // Once horizontal, the centre of the body lies in the next cell.
    // A ceiling over the old upright cell alone cannot hold it there.
    const nextX=piece.x+dir;
    if(!floor(nextX,piece.y-1)&&!floor(nextX,piece.y-0.5)){
      piece.finish=null;piece.state='ceiling-escape';
      // Continue through horizontal, rotating another quarter-turn around
      // the outer corner before re-anchoring the now vertical body.
      schedule('ascender-resume',piece.id,dir,time+gapTurn/timing.contact);
    }else piece.finish=time;
  }
  // The ordinary ceiling swing: schedule the pivot contact and every
  // neighbour the body overlaps while it tips over. The hanging state is the
  // same pose held at angle 0, so a knock can start this identical swing.
  function startCeilingSwing(p,dir,time){
    const target=stones.find(s=>s.id!==p.id&&s.x===p.x+dir&&[p.y,p.y+1].includes(s.y)&&resists(s));
    const contact=target?ceilingContactAngle(level,p,target,dir):null;
    p.state='ceiling';p.dir=dir;
    p.ceilingAngle=contact??90;
    p.ceilingTravel=contact!==null?timing.contact:swingDuration(p,dir);
    schedule('ascender-contact',p.id,dir,time+p.ceilingTravel/timing.contact);
    // A non-stopper is activated on first overlap; the ascender keeps playing
    // the same swing through horizontal without changing direction.
    for(const other of stones){
      if(other.id===p.id||other.type==='stopper'||other.state==='vanished'||other.x!==p.x+dir||![p.y,p.y+1].includes(other.y))continue;
      const angle=ceilingContactAngle(level,p,other,dir);
      if(angle===null||(contact!==null&&angle>=contact))continue;
      schedule('ascender-forward-hit',p.id,dir,time+angle/90*p.ceilingTravel/timing.contact,{targetId:other.id});
    }
  }
  function begin(piece,dir,passive=false) {
    if(piece?.type!=='ascender')return false;
    piece.dir=dir;piece.state='ascending';piece.passiveRise=!!passive;
    // The riser leaves the floor here; its ceiling rest may finish much later.
    if(!Number.isFinite(piece.leftAt))piece.leftAt=getTime();
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
      const ceiling=above>=0&&ceilingAbove(p,p.y);
      if(above<0){p.state='vanished';p.finish=time;return true;}
      if(ceiling){
        if(p.passiveRise){
          // Dropped from the ant's hands: it climbs straight up and hangs
          // vertically under the platform instead of toppling sideways.
          p.state='ceiling';p.dir=event.dir;p.ceilingAngle=0;p.finish=time;
          return true;
        }
        startCeilingSwing(p,event.dir,time);
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
      if(target?.type==='delay'&&target.state==='upright')activate(target,dir);
      if(resists(target)&&ceilingContactAngle(level,p,target,dir)!==null){
        rebound(p,target,dir,time,effects);
      }else{
        p.ceilingAngle=90;
        restOrRise(p,dir,time);
      }
      return true;
    }
    if (event.kind==='ascender-turn') {
      // Upright against the underside: switch from the near top corner
      // to the far top corner before swinging into the other neighbour.
      const target=stones.find(s=>s.id!==p.id&&s.x===p.x+event.dir&&[p.y,p.y+1].includes(s.y)&&resists(s));
      const contact=target?ceilingContactAngle(level,p,target,event.dir):null;
      p.dir=event.dir;p.state='ceiling-reversing';p.ceilingAngle=contact??90;p.ceilingTravel=contact!==null?timing.contact:swingDuration(p,event.dir);
      schedule('ascender-reverse-contact',p.id,event.dir,time+(contact!==null?1:p.ceilingTravel/timing.contact/2));
      schedule('ascender-rest',p.id,event.dir,time+(contact!==null?2:p.ceilingTravel/timing.contact));
      return true;
    }
    if (event.kind==='ascender-reverse-contact') {
      if(p.state!=='ceiling-reversing'||p.dir!==event.dir)return true;
      const hx=p.x+event.dir;
      const target=stones.find(s=>s.id!==p.id&&s.x===hx&&s.y===p.y&&s.state!=='vanished')
        ||stones.find(s=>s.id!==p.id&&s.x===hx&&s.y===p.y+1&&s.state!=='vanished');
      if(target?.type==='delay'&&target.state==='upright')activate(target,event.dir);
      if(resists(target)&&ceilingContactAngle(level,p,target,event.dir)!==null)rebound(p,target,event.dir,time,effects);
      else {
        if(target?.state==='upright')activate(target,event.dir);
        p.ceilingAngle=90;
      }
      return true;
    }
    if (event.kind==='ascender-rest') {
      if(p.state!=='ceiling-reversing'||p.dir!==event.dir)return true;
      p.state='ceiling';
      restOrRise(p,p.dir||event.dir,time);
      return true;
    }
    if (event.kind==='ascender-ceiling-gone') {
      // The platform it was resting under has just been blown open. Keep the
      // swing direction and re-anchor to the far half, so the shared rise path
      // lifts the body through the opening without swinging the other way.
      if(p.state!=='ceiling')return true;
      if(event.x===p.x)p.x-=p.dir||1;
      restOrRise(p,p.dir||event.dir,time);
      return true;
    }
    return false;
  }
  // A bridge landing under a hanging riser knocks it loose: the riser swings
  // over in the collision direction instead of staying vertical.
  function nudge(piece,dir){
    if(piece?.type!=='ascender'||piece.state!=='ceiling'||!piece.passiveRise)return false;
    piece.passiveRise=false;
    startCeilingSwing(piece,dir||piece.dir||1,getTime());
    return true;
  }
  return {begin,handle,nudge};
}

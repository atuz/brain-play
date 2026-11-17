const down=p=>p&&(['flat','vanished','ceiling'].includes(p.state)||(p.type==='ascender'&&p.state!=='upright'));
// A riser is fallen once it leaves the floor; its ceiling swing keeps playing
// and must not be compared as if it finished after the trigger.
const doneAt=p=>{
  if(p?.type==='ascender'){
    for(const t of [p.leftAt,p.hitTime])if(Number.isFinite(t))return t;
    return 0;
  }
  return Number.isFinite(p?.finish)?p.finish:0;
};
// A neighbour landing within one clock beat of the trigger still counts as
// the trigger falling last (the trigger itself falls one frame faster when
// it is knocked to the right).
const TRIGGER_TOLERANCE=0.5;

// Shared by simulation, live play and restored sessions. A trigger boolean
// cannot prove ordering: every required tile needs its actual finish time.
export function dominoOutcome({pieces,expectedPieces=pieces,carrying=null,dead=false,crashed=false,overflow=false}){
  const actual=new Map(pieces.map(p=>[p.id,p]));
  if(carrying)actual.delete(carrying.id);
  const required=expectedPieces.filter(p=>p.type!=='stopper');
  const resolved=p=>{const q=actual.get(p.id);return q?.type===p.type&&down(q);};
  const allDown=required.every(resolved);
  const trigger=actual.get(expectedPieces.find(p=>p.type==='trigger')?.id);
  const others=required.filter(p=>p.id!==trigger?.id).map(p=>actual.get(p.id));
  const triggerDone=down(trigger)&&Number.isFinite(trigger.finish);
  const last=triggerDone&&others.every(p=>down(p)&&doneAt(p)<=trigger.finish+TRIGGER_TOLERANCE);
  // A bridge tile knocked over by the trigger itself vanishes a fraction of a
  // beat later; that still counts as the trigger falling last.
  const late=others.filter(p=>down(p)&&doneAt(p)>trigger?.finish+TRIGGER_TOLERANCE);
  const bridgeTail=triggerDone&&late.length===1&&late[0].type==='bridge'&&late[0].state==='vanished'&&late[0].hitBy===trigger?.id&&
    others.every(p=>p===late[0]||(down(p)&&doneAt(p)<=trigger.finish+TRIGGER_TOLERANCE));
  const tied=allDown&&triggerDone&&!last&&others.some(p=>doneAt(p)===trigger.finish)&&
    others.every(p=>down(p)&&doneAt(p)<=trigger.finish);
  const broken=crashed||pieces.some(p=>p.state==='crashed');
  const reason=broken?'crash':overflow?'overflow':dead?'dead':carrying?'carrying':!allDown?'remaining':(last||bridgeTail)?'clear':(tied?'tie':'early');
  const problemIds=reason==='crash'?pieces.filter(p=>p.state==='crashed').map(p=>p.id)
    :reason==='carrying'?[carrying.id]
    :reason==='remaining'?required.filter(p=>!resolved(p)).map(p=>p.id)
    :['tie','early'].includes(reason)?required.filter(p=>{const q=actual.get(p.id);return p.id===trigger?.id||!down(q)||doneAt(q)>trigger?.finish+TRIGGER_TOLERANCE;}).map(p=>p.id):[];
  return {won:reason==='clear',reason,problemIds};
}

// Keep one monotonic clock over successive live chains. Resolved/vanished
// tiles survive later pushes, and a tile in the ant's arms never disappears.
export function recordDominoCompletion(state,snapshot){
  const previous=state.completion;
  const offset=previous?.time||0;
  const pieces=new Map((previous?.pieces||state.fallen||[]).map(p=>[p.id,{...p}]));
  for(const p of snapshot.pieces)pieces.set(p.id,{...p,finish:Number.isFinite(p.finish)?p.finish+offset:null});
  if(state.position.carrying)pieces.delete(state.position.carrying.id);
  return {time:offset+snapshot.time,pieces:[...pieces.values()],
    crashed:!!previous?.crashed||!!snapshot.crashed,overflow:!!previous?.overflow||!!snapshot.overflow};
}

export function dominoSessionPieces(state){
  const pieces=new Map((state.completion?.pieces||state.fallen||[]).map(p=>[p.id,p]));
  for(const p of state.position.pieces)pieces.set(p.id,{...p,state:'upright',finish:null});
  if(state.position.carrying)pieces.delete(state.position.carrying.id);
  return [...pieces.values()];
}

export function dominoSessionOutcome(level,state){
  return dominoOutcome({pieces:dominoSessionPieces(state),expectedPieces:level.pieces,carrying:state.position.carrying,
    dead:!!state.death,crashed:!!state.completion?.crashed,overflow:!!state.completion?.overflow});
}

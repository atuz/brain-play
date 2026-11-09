const down=p=>p&&['flat','vanished','ceiling'].includes(p.state);

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
  const last=triggerDone&&others.every(p=>down(p)&&Number.isFinite(p.finish)&&p.finish<trigger.finish);
  const tied=allDown&&triggerDone&&!last&&others.some(p=>p?.finish===trigger.finish)&&
    others.every(p=>Number.isFinite(p?.finish)&&p.finish<=trigger.finish);
  const broken=crashed||pieces.some(p=>p.state==='crashed');
  const reason=broken?'crash':overflow?'overflow':dead?'dead':carrying?'carrying':!allDown?'remaining':!last?(tied?'tie':'early'):'clear';
  const problemIds=reason==='crash'?pieces.filter(p=>p.state==='crashed').map(p=>p.id)
    :reason==='carrying'?[carrying.id]
    :reason==='remaining'?required.filter(p=>!resolved(p)).map(p=>p.id)
    :['tie','early'].includes(reason)?required.filter(p=>p.id===trigger?.id||!Number.isFinite(actual.get(p.id)?.finish)||actual.get(p.id).finish>=trigger?.finish).map(p=>p.id):[];
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

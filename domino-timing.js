// Milliseconds, measured against the supplied DOS level 23 recording.
// Mechanics retain their own paths; only their clocks share these values.
export const baseDominoTiming=Object.freeze({beat:200,contact:200,quarter:400,rise:200,riseStart:200,delayContact:600,roll:200});
// DOS 26: rolling repeats one tile later in 43/60 s; successive delayed
// falls repeat at 1.37–1.40 s (four intervals average 1.383 s).
export const dominoTiming=Object.freeze({beat:200,contact:275,quarter:550,rise:410,riseStart:120,delayContact:1380,roll:720});
export function eventBeatDuration(kind,type,timing=baseDominoTiming){
  if(kind==='carried-land')return timing.beat;
  if(kind==='reverse-turn'||type==='normal'&&['reverse-hit','normal-reverse-rest'].includes(kind))return timing.quarter;
  if(type==='tumbler'&&kind==='roll')return timing.roll??timing.beat;
  if(type==='delay'&&kind==='delay-start')return timing.delayContact-timing.contact;
  if(type==='delay'&&kind==='settle')return timing.contact;
  if(type==='ascender')return kind==='ascender-rise'?timing.rise:timing.contact;
  return type==='normal'?timing.contact:timing.beat;
}

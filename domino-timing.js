// Milliseconds, measured against the supplied DOS level 23 recording.
// Mechanics retain their own paths; only their clocks share these values.
export const baseDominoTiming=Object.freeze({beat:200,contact:200,quarter:400,rise:200,riseStart:200});
export const dominoTiming=Object.freeze({beat:200,contact:275,quarter:550,rise:410,riseStart:120});
export function eventBeatDuration(kind,type,timing=baseDominoTiming){
  if(type==='ascender')return kind==='ascender-rise'?timing.rise:timing.contact;
  return type==='normal'?timing.contact:timing.beat;
}

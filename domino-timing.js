// Milliseconds. The original DOS game runs at a fixed 18 fps, so every
// animation step is a whole number of frames (1000/18 = 55.56 ms).
const FRAME = 1000 / 18;

export const baseDominoTiming=Object.freeze({beat:200,contact:200,quarter:400,rise:200,riseStart:200,delayContact:600,roll:200});
// The previous video-calibrated profile. Kept for the recorded-timing tests.
export const dominoTiming=Object.freeze({beat:200,contact:275,quarter:550,rise:410,riseStart:120,delayContact:1380,roll:720,ascenderGapTurn:240});
// The original DOS frame counts. Used by the playable game.
//   normal fall 6-7 frames, contact at 4-5, delay waits 20 frames then falls
//   6, tumbler first cell 7 and later cells 13, exploder opens after 6,
//   a drop takes 2-3 frames per row, a riser climbs its first row in 5
//   frames and later rows in 4, and the ceiling flip takes 7.
export const dosFrameTiming=Object.freeze({
  beat: 200,                 // internal clock unit for event scheduling
  frame: FRAME,              // one DOS animation frame
  contact: 5 * FRAME,        // 277.8  push the next domino (state 13)
  // The original engine scans the level left to right. A domino that is
  // pushed to the right is reached again in the same frame and takes one
  // extra animation step, so right-going chains link every four frames
  // while left-going chains link every five.
  chainRight: 4 * FRAME,     // 222.2  right-going chain link
  quarter: 10 * FRAME,       // 555.6  reverse swing
  flat: 7 * FRAME,           // 388.9  upright -> fully flat (state 15)
  // The riser climbs one level row in four frames; the first row takes five
  // because of the startup beat.
  rise: 4 * FRAME,           // 222.2  riser, each row after the first
  riseStart: 1 * FRAME,      // 55.6   riser start delay
  delayWait: 20 * FRAME,     // 1111.1 delay timer before it starts falling
  delayFall: 5 * FRAME,      // 277.8  delay fall after the timer expires
  delayContact: 25 * FRAME,  // 1388.9 push -> next tile (20 + 5 frames)
  roll: 13 * FRAME,          // 722.2  tumbler, each cell after the first
  rollFirst: 7 * FRAME,      // 388.9  tumbler, first cell from upright
  exploder: 6 * FRAME,       // 333.3  exploder animation before the hole opens
  dropRow: 2 * FRAME,        // 111.1  one row of a drop (plus one frame on some rows)
  ascenderSwing: 7 * FRAME,  // 388.9  free ceiling flip
  ascenderGapTurn: 4 * FRAME // 222.2  swing past a ceiling edge
});
export function eventBeatDuration(kind,type,timing=baseDominoTiming){
  if(kind==='fall-rest')return timing.flat?timing.flat-timing.contact:timing.beat;
  if(kind==='carried-land')return timing.beat;
  if(kind==='reverse-turn'||type==='normal'&&['reverse-hit','normal-reverse-rest'].includes(kind))return timing.quarter;
  if(type==='tumbler'&&kind==='roll')return timing.roll??timing.beat;
  if(kind==='explode')return timing.exploder??timing.beat;
  if(kind==='delay-start')return timing.delayWait??Math.max(0,timing.delayContact-timing.contact);
  if(type==='delay'&&kind==='settle')return timing.delayFall??timing.contact;
  if(type==='ascender')return kind==='ascender-rise'?timing.rise:(timing.ascenderSwing??timing.contact);
  if(kind==='land'||kind==='split-contact'||kind==='fall-out-end')return timing.frame??timing.dropRow??timing.beat;
  return ['normal','trigger','delay'].includes(type)?timing.contact:timing.beat;
}

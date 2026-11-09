export function useManualPush(state,activate){
  if(state.pushUsed||!activate())return false;
  state.pushUsed=true;
  return true;
}

export function carriedDropTiming(rows,timing){
  const fallRows=Math.max(1,rows),brickMs=fallRows*timing.beat/2;
  return {brickMs,antLeadMs:brickMs+100,antMs:fallRows*timing.beat};
}

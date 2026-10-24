// Current effects are short notes: interruption discards them instead of
// replaying an old success/move sound when the person returns.
export function createGameAudio(runtime,createContext){
  let context;const notes=new Set();
  runtime.subscribe(paused=>{if(paused&&context){for(const note of notes){try{note.stop();}catch{}}notes.clear();void context.suspend().catch(()=>{});}});
  return win=>{
    if(runtime.paused)return;
    try{
      if(context==null)context=createContext();void context.resume().catch(()=>{});
      const oscillator=context.createOscillator(),gain=context.createGain();notes.add(oscillator);
      oscillator.onended=()=>{notes.delete(oscillator);oscillator.disconnect();gain.disconnect();};
      oscillator.connect(gain);gain.connect(context.destination);oscillator.type='sine';
      oscillator.frequency.setValueAtTime(win?523:440,context.currentTime);
      if(win)oscillator.frequency.setValueAtTime(784,context.currentTime+.12);
      gain.gain.setValueAtTime(.035,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+(win ? .4 : .08));
      oscillator.start();oscillator.stop(context.currentTime+(win ? .4 : .08));
    }catch{}
  };
}

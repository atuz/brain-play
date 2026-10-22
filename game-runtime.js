// One active clock for all games. Overlapping interruptions must all end before
// play resumes; this never changes a game's own manual pause or writes a save.
export function createGameRuntime({now=()=>performance.now(),schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id)}={}){
  const reasons=new Set(),listeners=new Set(),timers=new Set(),animations=new Set(),tracked=new Set();
  let pausedAt=null,excluded=0;
  const clock=()=> (pausedAt??now())-excluded;
  function suspendAnimation(animation){
    if(animation.playState==='running'||animation.pending){animation.pause();animations.add(animation);}
  }
  function update(changes){
    const before=reasons.size>0;
    for(const [reason,paused]of Object.entries(changes))paused?reasons.add(reason):reasons.delete(reason);
    const paused=reasons.size>0;if(before===paused)return;
    if(paused){pausedAt=now();for(const timer of timers)timer.pause();for(const animation of tracked)suspendAnimation(animation);}
    else{
      excluded+=now()-pausedAt;pausedAt=null;
      for(const animation of animations)if(animation.playState==='paused')animation.play();
      animations.clear();for(const timer of timers)timer.resume();
    }
    for(const listener of listeners)listener(paused);
  }
  return {
    get paused(){return reasons.size>0;},now:clock,update,
    setPaused:(reason,paused)=>update({[reason]:paused}),
    subscribe(listener){listeners.add(listener);listener(reasons.size>0);return()=>listeners.delete(listener);},
    trackAnimation(animation){
      tracked.add(animation);
      if(reasons.size)suspendAnimation(animation);
      return()=>{tracked.delete(animation);animations.delete(animation);};
    },
    suspendAnimation,
    delay(ms){
      let remaining=Math.max(0,ms),started=0,id=null,resolve;
      const finished=new Promise(done=>resolve=done);
      const finish=value=>{if(id!==null)cancel(id);id=null;timers.delete(timer);resolve(value);};
      const timer={
        pause(){if(id===null)return;remaining=Math.max(0,remaining-(now()-started));cancel(id);id=null;},
        resume(){started=now();id=schedule(()=>finish(true),remaining);},
      };
      timers.add(timer);if(!reasons.size)timer.resume();
      return {finished,cancel:()=>finish(false)};
    },
  };
}

export const gameRuntime=createGameRuntime();

export function bindGameLifecycle(host,doc,runtime=gameRuntime,embedded=false){
  const native=event=>{
    const state=event.detail;
    if(!embedded||!state||state.version!==1||typeof state.active!=='boolean'||typeof state.ad!=='boolean')return;
    runtime.update({app:!state.active,ad:state.ad});
  };
  const visibility=()=>runtime.setPaused('hidden',doc.hidden===true);
  // CSS animations include newly mounted content. WAAPI and transitions are
  // frozen at their current time, including animations created while paused.
  const freeze=()=>{
    for(const animation of doc.getAnimations?.()||[]){
      if(animation.constructor?.name!=='CSSAnimation')runtime.suspendAnimation(animation);
    }
  };
  const observer=host.MutationObserver?new host.MutationObserver(()=>{if(runtime.paused)freeze();}):null;
  const unsubscribe=runtime.subscribe(paused=>{
    doc.documentElement.dataset.gamePaused=String(paused);
    if(paused){freeze();observer?.observe(doc.body,{subtree:true,childList:true,attributes:true});}
    else observer?.disconnect();
  });
  doc.addEventListener('visibilitychange',visibility);
  host.addEventListener('brainPlayActivity',native);
  visibility();native({detail:host.__brainPlayHost?.activity});
  return()=>{unsubscribe();observer?.disconnect();doc.removeEventListener('visibilitychange',visibility);host.removeEventListener('brainPlayActivity',native);};
}

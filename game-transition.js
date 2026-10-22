// A boundary is reported before its new state, timer or animation starts.
// Standalone game harnesses can omit the App transition callback.
export function startGame(ctx,reason,action,info={}){
  if(ctx.transition)return ctx.transition(reason,info,action);
  ctx.navigate?.(reason,info);return action();
}

import {startGame} from './game-transition.js?v=48';
import {el,button,stat,statusNode,sound,finish} from './shared.js?v=48';
import {createMotion,floatScore} from './motion.js?v=48';
export function groupAt(board,index,size=8){const color=board[index];if(!color)return [];const seen=new Set([index]),queue=[index];while(queue.length){const i=queue.pop(),r=Math.floor(i/size),c=i%size;for(const [dr,dc]of [[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+dr,cc=c+dc,j=rr*size+cc;if(rr>=0&&rr<size&&cc>=0&&cc<size&&!seen.has(j)&&board[j]===color){seen.add(j);queue.push(j);}}}return [...seen];}
export function collapseTrace(board,size=8){
  const out=Array(board.length).fill(0),movements=[];let column=0;
  for(let c=0;c<size;c++){
    const sources=Array.from({length:size},(_,r)=>r*size+c).filter(i=>board[i]);
    if(!sources.length)continue;
    sources.forEach((from,k)=>{const to=(size-sources.length+k)*size+column;out[to]=board[from];movements.push({from,to,via:true});});column++;
  }
  return {board:out,movements};
}
export const collapse=(board,size=8)=>collapseTrace(board,size).board;
export function hasGroups(board,size=8){return board.some((v,i)=>v&&((i%size<size-1&&v===board[i+1])||(i+size<board.length&&v===board[i+size])));}
export function mount(root,ctx){
  let state=ctx.load()||fresh(),selected=[],busy=false;
  const motion=createMotion(),score=stat('得分'),best=stat('本机最高',ctx.read('best:stars',0)),status=statusNode();
  const board=el('div',{class:'board board-stars','aria-label':'消灭星星棋盘'});
  const undo=button('撤销',()=>{if(busy)return;const old=state.history.pop();if(old){state.board=old.board;state.score=old.score;state.done=false;selected=[];render();}});
  const restart=button('新一局',()=>{if(!busy)motion.confirmRestart(state.history.length>0&&!state.done,()=>startGame(ctx,'new-round',()=>{state=fresh();selected=[];render();}));},'plain');
  root.append(el('div',{class:'game-toolbar'},[el('div',{class:'stats'},[score.node,best.node]),el('div',{class:'actions'},[undo,restart])]),board,status.node);
  function fresh(){const b=Array.from({length:64},()=>1+Math.floor(ctx.rng()*5));b[1]=b[0];return {board:b,score:0,done:false,history:[]};}
  async function choose(i){
    if(busy||state.done)return;
    const group=groupAt(state.board,i);
    if(group.length<2){selected=[];render();motion.shake(board.children[i]);status.set('至少两个相邻的同色星星才能消除。');return;}
    if(!selected.includes(i)){selected=group;render();status.set(`选中 ${group.length} 颗，再点一次得 ${group.length*group.length*5} 分。`);return;}
    busy=true;undo.disabled=restart.disabled=true;
    state.history.push({board:[...state.board],score:state.score});
    const remaining=[...state.board];for(const j of group)remaining[j]=0;
    const fallen=collapseTrace(remaining),gained=group.length*group.length*5;
    state.board=fallen.board;state.score+=gained;selected=[];
    if(!hasGroups(state.board)){state.done=true;const left=state.board.filter(Boolean).length;state.score+=Math.max(0,2000-left*left*20);ctx.result?.('finished',{score:state.score});finish('stars');}
    ctx.save(state);sound();
    await Promise.all(group.map(j=>motion.play(board.children[j],[{transform:'scale(1)',opacity:1},{transform:'scale(1.25)',opacity:.8,offset:.3},{transform:'scale(0)',opacity:0}],180)));
    if(!motion.alive)return;
    // Removed cells disappear before survivors fall, then columns close from the left.
    for(const j of group)board.children[j].style.visibility='hidden';
    await motion.grid(board,fallen.movements,render,300);
    if(!motion.alive)return;
    busy=false;undo.disabled=!state.history.length;restart.disabled=false;floatScore(score.node,gained,motion);
    if(!state.done)status.set(`消除了 ${group.length} 颗星星，获得 ${gained} 分！`);
  }
  function render(){
    const labels=['','绿','黄','橙','蓝','紫'],shapes=['','●','★','◆','✿','✦'];
    board.replaceChildren(...state.board.map((v,i)=>el('button',{type:'button',class:`cell c${v} ${v?'':'empty'} ${selected.includes(i)?'group-selected':''}`,text:shapes[v]||'','aria-label':v?`第${Math.floor(i/8)+1}行第${i%8+1}列 ${labels[v]}色星星`:'空格','aria-pressed':selected.includes(i),disabled:!v,onclick:()=>choose(i)})));
    score.set(state.score);const record=Math.max(state.score,ctx.read('best:stars',0));ctx.write('best:stars',record);best.set(record);undo.disabled=busy||!state.history.length;restart.disabled=busy;
    status.set(state.done?`本局结束！剩 ${state.board.filter(Boolean).length} 颗星星，最终得分 ${state.score}。`:'',state.done?'success':'');ctx.save(state);
  }
  render();return()=>motion.dispose();
}

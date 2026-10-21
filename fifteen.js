import {el,button,stat,statusNode,controls,keyboardAndSwipe,sound,finish} from './shared.js?v=12';
import {createMotion} from './motion.js?v=12';
export const solvedBoard=()=>Array.from({length:16},(_,i)=>(i+1)%16);
export function isSolved(board){return board.every((v,i)=>v===(i+1)%16);}
export function adjacent(board,index){const z=board.indexOf(0);return Math.abs(Math.floor(z/4)-Math.floor(index/4))+Math.abs(z%4-index%4)===1;}
export function shufflePuzzle(rng=Math.random){let board=solvedBoard(),previous=-1;for(let k=0;k<180;k++){const z=board.indexOf(0),options=board.map((_,i)=>i).filter(i=>i!==previous&&adjacent(board,i));const i=options[Math.floor(rng()*options.length)];[board[z],board[i]]=[board[i],board[z]];previous=z;}if(isSolved(board))[board[14],board[15]]=[board[15],board[14]];return board;}
// Direction always describes the numbered tile, never the empty square.
export function tileInDirection(board, direction) {
  const z=board.indexOf(0),r=Math.floor(z/4),c=z%4;
  const delta={up:[1,0],down:[-1,0],left:[0,1],right:[0,-1]}[direction];
  if(!delta)return -1;
  const rr=r+delta[0],cc=c+delta[1];
  return rr>=0&&rr<4&&cc>=0&&cc<4?rr*4+cc:-1;
}
export function mount(root,ctx) {
  let state=ctx.load()||fresh(),busy=false,queued=[];
  const motion=createMotion(),moves=stat('步数'),placed=stat('已归位'),status=statusNode();
  const board=el('div',{class:'board board-fifteen','aria-label':'数字拼图棋盘'});
  const pad=controls(directionMove);
  const goal=el('details',{class:'puzzle-goal'},[
    el('summary',{text:'目标排列'}),
    el('div',{class:'goal-grid','aria-label':'按从左到右、从上到下的顺序，排好 1—15。'},solvedBoard().map(v=>el('span',{class:v?'':'empty',text:v||''}))),
  ]);
  const undo=button('撤销',()=>{if(busy)return;const old=state.history.pop();if(old){const before=[...state.board];state.board=old;state.moves--;state.done=false;transition(before);}});
  const restart=button('新一局',()=>{if(!busy)motion.confirmRestart(state.moves>0&&!state.done,()=>{state=fresh();render();});},'plain');
  root.append(el('div',{class:'game-toolbar'},[el('div',{class:'stats'},[moves.node,placed.node]),el('div',{class:'actions'},[undo,restart])]),goal,board,pad,status.node);
  function fresh(){return {board:shufflePuzzle(ctx.rng),moves:0,history:[],done:false};}
  async function transition(before) {
    busy=true; updateControls();
    const movements=before.flatMap((v,from)=>v&&state.board.indexOf(v)!==from?[{from,to:state.board.indexOf(v)}]:[]);
    await motion.grid(board,movements,render,150);
    if(!motion.alive)return;
    busy=false;updateControls();
    if(state.done)motion.pop(status.node);
    const next=queued.shift();if(next)directionMove(next);
  }
  function move(i){
    if(busy||state.done)return;
    if(!adjacent(state.board,i)){motion.shake(board.children[i]);return;}
    const before=[...state.board];state.history.push(before);if(state.history.length>200)state.history.shift();
    const z=state.board.indexOf(0);[state.board[z],state.board[i]]=[state.board[i],state.board[z]];state.moves++;
    if(isSolved(state.board)){state.done=true;finish('fifteen');}
    sound();transition(before);
  }
  function directionMove(dir){if(state.done){queued=[];return;}if(busy){if(queued.length<3)queued.push(dir);return;}const i=tileInDirection(state.board,dir);if(i>=0)move(i);else{const next=queued.shift();if(next)directionMove(next);}}
  function updateControls(){
    undo.disabled=busy||!state.history.length;restart.disabled=busy;
    for(const key of pad.children)key.disabled=state.done||tileInDirection(state.board,key.dataset.direction)<0;
  }
  function render(){
    board.replaceChildren(...state.board.map((v,i)=>el('button',{type:'button',class:`cell ${v?'':'empty'} ${v===i+1?'correct':''} ${v&&adjacent(state.board,i)?'movable':''}`,text:v||'','aria-label':v?`数字 ${v}`:'空格',disabled:!v,onclick:()=>move(i)})));
    moves.set(state.moves);placed.set(`${state.board.filter((v,i)=>v&&v===i+1).length}/15`);updateControls();
    status.set(state.done?`排列完成！用了 ${state.moves} 步。`:'',state.done?'success':'');ctx.save(state);
  }
  render();const removeInput=keyboardAndSwipe(board,directionMove);
  return()=>{queued=[];removeInput();motion.dispose();};
}

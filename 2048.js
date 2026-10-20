import {el,button,stat,statusNode,controls,keyboardAndSwipe,read,saveGame,copy,sound,finish} from './shared.js?v=2';
export function slideLine(line) { const values=line.filter(Boolean), out=[]; let score=0; for(let i=0;i<values.length;i++){if(values[i]===values[i+1]){const v=values[i]*2;out.push(v);score+=v;i++;}else out.push(values[i]);}while(out.length<line.length)out.push(0);return {line:out,score}; }
export function slideBoard(board,direction) { const out=[...board];let score=0;for(let a=0;a<4;a++){const indices=Array.from({length:4},(_,b)=>direction==='left'?a*4+b:direction==='right'?a*4+3-b:direction==='up'?b*4+a:(3-b)*4+a);const result=slideLine(indices.map(i=>board[i]));indices.forEach((i,j)=>out[i]=result.line[j]);score+=result.score;}return {board:out,score,moved:out.some((v,i)=>v!==board[i])}; }
export function hasMoves(board) {return board.includes(0)||['left','up'].some(dir=>slideBoard(board,dir).moved);}
export function spawn(board,rng=Math.random) {const free=board.map((v,i)=>v===0?i:-1).filter(i=>i>=0);if(free.length)board[free[Math.floor(rng()*free.length)]]=rng()<.9?2:4;return board;}
export function mount(root,ctx) {
  let state=ctx.load()||{board:spawn(spawn(Array(16).fill(0),ctx.rng),ctx.rng),score:0,won:false,history:[]};
  const score=stat('得分'),best=stat('本机最高',read('best:2048',0)),status=statusNode();let record=read('best:2048',0);
  const board=el('div',{class:'board board-2048','aria-label':'2048 棋盘'});
  const undo=button('撤销',()=>{if(!state.history.length)return;const old=state.history.pop();state={...state,...old};render();});
  const reset=()=>{state={board:spawn(spawn(Array(16).fill(0),ctx.rng),ctx.rng),score:0,won:false,history:[]};render();};
  root.append(el('div',{class:'game-toolbar'},[el('div',{class:'stats'},[score.node,best.node]),el('div',{class:'actions'},[undo,button('新一局',reset,'plain')])]),board,controls(move),status.node,el('p',{class:'keyboard-help',text:'滑动棋盘，或使用方向键 / WASD'}));
  function move(direction){const next=slideBoard(state.board,direction);if(!next.moved)return;state.history.push({board:[...state.board],score:state.score,won:state.won});if(state.history.length>30)state.history.shift();state.board=spawn(next.board,ctx.rng);state.score+=next.score;if(!state.won&&state.board.some(v=>v>=2048)){state.won=true;finish('2048');}sound();render();}
  function render(){board.replaceChildren(...state.board.map(v=>el('div',{class:`tile ${v===0?'empty':v>=128?'high':'v'+v}`,text:v||'','aria-label':v?String(v):'空格'})));score.set(state.score);record=Math.max(record,state.score);ctx.write('best:2048',record);best.set(record);undo.disabled=!state.history.length;if(!hasMoves(state.board))status.set('没有可以移动的格子了，试试撤销或新开一局。');else if(state.won)status.set('达到 2048！你也可以继续挑战更大的数字。','success');else status.set('把相同数字合在一起，慢慢向 2048 前进。');ctx.save(state);}
  render();return keyboardAndSwipe(board,move);
}

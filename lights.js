import {el,button,stat,statusNode,copy,sound,finish} from './shared.js?v=10';
import {createMotion} from './motion.js?v=10';
import {t} from './i18n.js?v=10';
export function flip(board,index,size=5){const out=[...board],r=Math.floor(index/size),c=index%size;for(const [dr,dc] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<size&&cc>=0&&cc<size)out[rr*size+cc]=1-out[rr*size+cc];}return out;}
export function solveLights(board,size=5){const n=size*size,m=board.map((v,i)=>{const influence=flip(Array(n).fill(0),i,size);return [...influence,v];});let row=0;const pivots=[];for(let c=0;c<n&&row<n;c++){let p=row;while(p<n&&!m[p][c])p++;if(p===n)continue;[m[p],m[row]]=[m[row],m[p]];for(let r=0;r<n;r++)if(r!==row&&m[r][c])for(let j=c;j<=n;j++)m[r][j]^=m[row][j];pivots.push(c);row++;}for(let r=row;r<n;r++)if(m[r][n])return null;const result=Array(n).fill(0);for(let r=0;r<pivots.length;r++)result[pivots[r]]=m[r][n];return result.map((v,i)=>v?i:-1).filter(i=>i>=0);}
export function generateLights(rng=Math.random){let board=Array(25).fill(0);for(let i=0;i<25;i++)if(rng()<.4)board=flip(board,i);if(!board.some(Boolean))board=flip(board,12);return board;}
export function mount(root,ctx){
  let state=ctx.load()||fresh(),hinted=-1;
  const motion=createMotion(),moves=stat('步数'),lit=stat('亮灯'),status=statusNode();
  const board=el('div',{class:'board board-lights','aria-label':'熄灯棋盘'});
  const cells=Array.from({length:25},(_,i)=>el('button',{type:'button',class:'cell',onclick:()=>choose(i)}));board.append(...cells);
  const undo=button('撤销',()=>{const old=state.history.pop();if(old){const before=state.board;state.board=old;state.moves--;state.done=false;hinted=-1;render();wave(before);}});
  const hint=button('提示',()=>{if(state.done)return;const solution=solveLights(state.board);if(solution?.length){hinted=solution[0];render();status.set('试试闪亮的格子。');}},'plain');
  const restart=button('新一局',()=>motion.confirmRestart(state.moves>0&&!state.done,()=>{state=fresh();hinted=-1;render();}),'plain');
  root.append(el('div',{class:'game-toolbar'},[el('div',{class:'stats'},[moves.node,lit.node]),el('div',{class:'actions'},[undo,hint,restart])]),board,status.node);
  function fresh(){return {board:generateLights(ctx.rng),moves:0,done:false,history:[]};}
  function wave(before,center=-1){
    cells.forEach((cell,i)=>{if(before[i]!==state.board[i])motion.play(cell,[{transform:'scale(1)'},{transform:'scale(.86)',offset:.35},{transform:'scale(1)'}],220,{delay:i===center?0:35});});
  }
  function choose(i){
    if(state.done)return;const before=[...state.board];state.history.push(before);if(state.history.length>250)state.history.shift();
    state.board=flip(state.board,i);state.moves++;hinted=-1;
    if(!state.board.some(Boolean)){state.done=true;finish('lights');}
    sound();render();wave(before,i);
  }
  function render(){
    cells.forEach((cell,i)=>{const v=state.board[i];cell.className=`cell ${v?'on':''} ${i===hinted?'hinted':''}`;cell.setAttribute('aria-label',t(`第${Math.floor(i/5)+1}行第${i%5+1}列，${v?'亮':'灭'}`));cell.setAttribute('aria-pressed',String(!!v));});
    moves.set(state.moves);lit.set(state.board.reduce((a,b)=>a+b,0));undo.disabled=!state.history.length;hint.disabled=state.done;
    status.set(state.done?`全部熄灭！用了 ${state.moves} 步。`:'',state.done?'success':'');ctx.save(state);
  }
  render();return()=>motion.dispose();
}

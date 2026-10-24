import {startGame} from './game-transition.js?v=48';
import {el,button,stat,statusNode,shuffle,sound,finish} from './shared.js?v=48';
import {createMotion} from './motion.js?v=48';
export const symbols=['🍋','🍒','🍇','🍊','🥝','🍓','🍐','🍉','🫐'];
export function findPath(board,a,b,rows=6,cols=6){if(a===b||!board[a]||board[a]!==board[b])return null;const sr=Math.floor(a/cols)+1,sc=a%cols+1,tr=Math.floor(b/cols)+1,tc=b%cols+1;const queue=[{r:sr,c:sc,d:-1,t:0,path:[[sr,sc]]}],seen=new Map();const directions=[[-1,0],[0,1],[1,0],[0,-1]];for(let h=0;h<queue.length;h++){const cur=queue[h];for(let d=0;d<4;d++){const turns=cur.t+(cur.d!==-1&&cur.d!==d?1:0);if(turns>2)continue;const r=cur.r+directions[d][0],c=cur.c+directions[d][1];if(r<0||r>rows+1||c<0||c>cols+1)continue;if(r===tr&&c===tc)return [...cur.path,[r,c]];if(r>=1&&r<=rows&&c>=1&&c<=cols&&board[(r-1)*cols+c-1])continue;const key=`${r},${c},${d}`;if((seen.get(key)??3)<=turns)continue;seen.set(key,turns);queue.push({r,c,d,t:turns,path:[...cur.path,[r,c]]});}}return null;}
export function findPair(board,rows=6,cols=6){for(let i=0;i<board.length;i++)if(board[i])for(let j=i+1;j<board.length;j++)if(board[i]===board[j]&&findPath(board,i,j,rows,cols))return [i,j];return null;}
export function reshuffle(board,rng=Math.random){const positions=board.map((v,i)=>v?i:-1).filter(i=>i>=0),values=positions.map(i=>board[i]);if(!values.length)return [...board];for(let trial=0;trial<50;trial++){const out=[...board],mixed=shuffle(values,rng);positions.forEach((p,i)=>out[p]=mixed[i]);if(findPair(out))return out;} // Force one geometrically valid pair, retaining every empty position.
const out=[...board],mixed=shuffle(values,rng);positions.forEach((p,i)=>out[p]=mixed[i]);
const pair=findPair(board.map(v=>v?1:0)),value=values[0];
for(const target of pair){if(out[target]===value)continue;const source=positions.find(i=>!pair.includes(i)&&out[i]===value);[out[target],out[source]]=[out[source],out[target]];}
return out;}
export function mount(root,ctx) {
  let state=ctx.load()||fresh(),selected=-1,hinted=[],busy=false;
  const motion=createMotion(),remain=stat('剩余对数'),moves=stat('已消除'),status=statusNode();
  const board=el('div',{class:'board board-link','aria-label':'连连看棋盘'}),stage=el('div',{class:'link-stage'},board);
  const undo=button('撤销',()=>{if(busy)return;const old=state.history.pop();if(old){state.board=old;state.matches--;state.done=false;selected=-1;hinted=[];render();}});
  const hint=button('提示',()=>{if(busy||state.done)return;hinted=findPair(state.board)||[];selected=-1;render();status.set('点选闪亮的两个水果。');},'plain');
  const restart=button('新一局',()=>{if(!busy)motion.confirmRestart(state.matches>0&&!state.done,()=>startGame(ctx,'new-round',()=>{state=fresh();selected=-1;hinted=[];render();}));},'plain');
  root.append(el('div',{class:'game-toolbar'},[el('div',{class:'stats'},[remain.node,moves.node]),el('div',{class:'actions'},[undo,hint,restart])]),stage,status.node);
  function fresh(){const values=Array.from({length:18},(_,i)=>[i%9+1,i%9+1]).flat();return {board:reshuffle(values,ctx.rng),matches:0,history:[],done:false};}
  function drawPath(path){
    const box=stage.getBoundingClientRect(),base=board.getBoundingClientRect(),cells=[...board.children];
    const a={left:base.left+cells[0].offsetLeft,top:base.top+cells[0].offsetTop,width:cells[0].offsetWidth,height:cells[0].offsetHeight};
    const stepX=cells[1].offsetLeft-cells[0].offsetLeft,stepY=cells[6].offsetTop-cells[0].offsetTop;
    const points=path.map(([r,c])=>[a.left-box.left+a.width/2+(c-1)*stepX,a.top-box.top+a.height/2+(r-1)*stepY]);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','link-path');svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);svg.setAttribute('aria-hidden','true');
    const line=document.createElementNS(svg.namespaceURI,'polyline');line.setAttribute('points',points.map(p=>p.join(',')).join(' '));svg.append(line);stage.append(svg);return {svg,line};
  }
  async function choose(i){
    if(busy||!state.board[i]||state.done)return;
    if(selected===i){selected=-1;render();return;}
    if(selected<0){selected=i;render();motion.pop(board.children[i]);return;}
    const first=selected,path=findPath(state.board,first,i);
    if(!path){selected=i;hinted=[];render();motion.shake(board.children[i]);status.set('这两枚还连不上：路径最多转两次弯，途中不能有水果。');return;}
    busy=true;undo.disabled=hint.disabled=restart.disabled=true;
    board.children[i].classList.add('selected');
    state.history.push([...state.board]);state.board[i]=state.board[first]=0;state.matches++;selected=-1;hinted=[];
    let reshuffled=false;
    if(!state.board.some(Boolean)){state.done=true;ctx.result?.('won',{moves:state.matches});finish('link');}
    else if(!findPair(state.board)){state.board=reshuffle(state.board,ctx.rng);reshuffled=true;}
    ctx.save(state);sound();
    const {svg,line}=drawPath(path),length=line.getTotalLength();
    await motion.play(line,[{strokeDasharray:`${length}`,strokeDashoffset:length},{strokeDasharray:`${length}`,strokeDashoffset:0}],170);
    await Promise.all([first,i].map(j=>motion.play(board.children[j],[{transform:'scale(1)',opacity:1},{transform:'scale(.3)',opacity:0}],150)));
    svg.remove();if(!motion.alive)return;
    busy=false;render();
    if(reshuffled){for(const cell of board.children)if(!cell.disabled)motion.pop(cell);status.set('暂时没有可消除的组合，已自动重新排列剩余水果。');}
    if(state.done)motion.pop(board);
  }
  function render(){
    board.replaceChildren(...state.board.map((v,i)=>el('button',{type:'button',class:`cell ${v?'':'empty'} ${selected===i?'selected':''} ${hinted.includes(i)?'hinted':''}`,text:v?symbols[v-1]:'','aria-label':v?`第${Math.floor(i/6)+1}行第${i%6+1}列 ${symbols[v-1]}`:'空格','aria-pressed':selected===i,disabled:!v,onclick:()=>choose(i)})));
    remain.set(state.board.filter(Boolean).length/2);moves.set(state.matches);undo.disabled=busy||!state.history.length;hint.disabled=busy||state.done;restart.disabled=busy;
    status.set(state.done?'全部配对成功！再来一盘？':'',state.done?'success':'');ctx.save(state);
  }
  render();return()=>motion.dispose();
}

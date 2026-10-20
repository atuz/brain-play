import {el,button,stat,statusNode,sound,finish} from './shared.js?v=7';
import {createMotion} from './motion.js?v=7';
export const dirs=[[-1,0,1,4,'n'],[0,1,2,8,'e'],[1,0,4,1,'s'],[0,-1,8,2,'w']];
export const rotate=mask=>((mask<<1)&15)|((mask>>3)&1);
export function generatePipes(rng=Math.random,size=5){const board=Array(size*size).fill(0),seen=new Set([0]);function visit(i){const neighbors=dirs.map(d=>({d,rank:rng()})).sort((a,b)=>a.rank-b.rank);for(const {d:[dr,dc,bit,back]}of neighbors){const r=Math.floor(i/size)+dr,c=i%size+dc,j=r*size+c;if(r<0||r>=size||c<0||c>=size||seen.has(j))continue;seen.add(j);board[i]|=bit;board[j]|=back;visit(j);}}visit(0);const solution=[...board];for(let i=0;i<board.length;i++)for(let k=Math.floor(rng()*4);k>0;k--)board[i]=rotate(board[i]);if(checkPipes(board,size).won)board[0]=rotate(board[0]);return {board,solution};}
export function checkPipes(board,size=5,source=Math.floor(size*size/2)){const connected=new Set([source]),queue=[source];let leaks=0;while(queue.length){const i=queue.shift();for(const [dr,dc,bit,back]of dirs){if(!(board[i]&bit))continue;const r=Math.floor(i/size)+dr,c=i%size+dc,j=r*size+c;if(r<0||r>=size||c<0||c>=size||!(board[j]&back)){leaks++;continue;}if(!connected.has(j)){connected.add(j);queue.push(j);}}}return {connected,leaks,won:connected.size===board.length&&leaks===0};}
export function mount(root,ctx){
  let state=ctx.load()||fresh(),hinted=-1,busy=false,queued=-1;
  const motion=createMotion(),moves=stat('旋转'),count=stat('已连通'),status=statusNode();
  const board=el('div',{class:'board board-pipes','aria-label':'接水管棋盘'});
  const undo=button('撤销',()=>{if(busy)return;const old=state.history.pop();if(old){state.board=old;state.moves--;state.done=false;hinted=-1;render();}});
  const hint=button('提示',()=>{if(busy||state.done)return;hinted=state.board.findIndex((v,i)=>v!==state.solution[i]);render();status.set('转动闪亮的管道，试着接通它。');},'plain');
  const restart=button('新一局',()=>{if(!busy)motion.confirmRestart(state.moves>0&&!state.done,()=>{state=fresh();hinted=-1;render();});},'plain');
  root.append(el('div',{class:'game-toolbar'},[el('div',{class:'stats'},[moves.node,count.node]),el('div',{class:'actions'},[undo,hint,restart])]),board,status.node);
  function fresh(){return {...generatePipes(ctx.rng),moves:0,history:[],done:false};}
  async function choose(i){
    if(state.done)return;if(busy){queued=i;return;}
    const mask=state.board[i];if(rotate(mask)===mask){motion.pop(board.children[i]);return;}
    busy=true;undo.disabled=hint.disabled=restart.disabled=true;
    const before=checkPipes(state.board).connected;
    state.history.push([...state.board]);if(state.history.length>150)state.history.shift();
    state.board[i]=rotate(mask);state.moves++;hinted=-1;
    const result=checkPipes(state.board);if(result.won){state.done=true;finish('pipes');}ctx.save(state);sound();
    await motion.play(board.children[i].firstElementChild,[{transform:'rotate(0)'},{transform:'rotate(90deg)'}],160);
    if(!motion.alive)return;busy=false;render();
    let delay=0;for(const j of result.connected)if(!before.has(j)){motion.play(board.children[j],[{opacity:.4},{opacity:1}],180,{delay:Math.min(delay++*25,180)});}
    const next=queued;queued=-1;if(next>=0)choose(next);
  }
  function render(){
    const result=checkPipes(state.board);
    board.replaceChildren(...state.board.map((mask,i)=>{
      const art=el('span',{class:'pipe-drawing','aria-hidden':'true'});
      for(const [dr,dc,bit,back,name]of dirs)if(mask&bit){
        const r=Math.floor(i/5)+dr,c=i%5+dc,j=r*5+c;
        const leak=result.connected.has(i)&&(r<0||r>=5||c<0||c>=5||!(state.board[j]&back));
        art.append(el('span',{class:`pipe-arm ${name} ${leak?'leak':''}`}));
      }
      art.append(el('span',{class:`pipe-center ${i===12?'source':''}`}));
      return el('button',{type:'button',class:`cell ${result.connected.has(i)?'connected':''} ${i===hinted?'hinted':''}`,'aria-label':`第${Math.floor(i/5)+1}行第${i%5+1}列${i===12?'，水源':''}，${result.connected.has(i)?'已连通':'未连通'}`,onclick:()=>choose(i)},art);
    }));
    moves.set(state.moves);count.set(`${result.connected.size}/25`);undo.disabled=busy||!state.history.length;hint.disabled=busy||state.done;restart.disabled=busy;
    status.set(state.done?`所有管道都连通了！用了 ${state.moves} 次旋转。`:'转动管道接通水源，红点表示漏口。',state.done?'success':'');ctx.save(state);
  }
  render();return()=>{queued=-1;motion.dispose();};
}

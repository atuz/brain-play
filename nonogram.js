import {el,button,stat,statusNode,sound,finish} from './shared.js?v=11';
import {createMotion} from './motion.js?v=11';
import {t} from './i18n.js?v=11';
// Original hand-drawn 5×5 puzzles. Clue uniqueness is verified in tests.
export const patterns=[
{name:'小小爱心',rows:['01010','11111','11111','01110','00100']},
{name:'一棵小树',rows:['00100','01110','11111','00100','00100']},
{name:'小房子',rows:['00100','01110','11111','11011','11011']},
{name:'小帆船',rows:['00100','01100','11100','00100','11111']},
{name:'一枚箭头',rows:['00100','00010','11111','00010','00100']},
{name:'菱形',rows:['00100','01110','11111','01110','00100']},
{name:'一杯热茶',rows:['10100','01000','11110','10011','11110']},
{name:'一朵小花',rows:['01110','11111','01110','00100','01100']}
];
export const patternBits=p=>p.rows.join('').split('').map(Number);
export function runs(values){const result=[];let n=0;for(const v of [...values,0])if(v)n++;else if(n){result.push(n);n=0;}return result.length?result:[0];}
export function clues(board,size=5){return {rows:Array.from({length:size},(_,r)=>runs(board.slice(r*size,(r+1)*size))),cols:Array.from({length:size},(_,c)=>runs(Array.from({length:size},(_,r)=>board[r*size+c])))};}
// A stroke locks to its first row or column; all cells use the starting paint value.
export function strokeCells(start,end,size=5,axis=null){
  const r=Math.floor(start/size),c=start%size,rr=Math.floor(end/size),cc=end%size;
  axis??=Math.abs(cc-c)>=Math.abs(rr-r)?'row':'col';
  const target=axis==='row'?r*size+cc:rr*size+c,step=target===start?1:Math.sign(target-start)*(axis==='row'?1:size),out=[];
  for(let i=start;;i+=step){out.push(i);if(i===target)break;}return out;
}
export function mount(root,ctx){
  let state=ctx.load()||fresh(),mode=1,stroke=null;
  const motion=createMotion(),filled=stat('已涂格'),status=statusNode(),board=el('div',{class:'nonogram','aria-label':'数织棋盘'});
  const cells=[],rows=[],cols=[];board.append(el('div',{'aria-hidden':'true'}));
  for(let c=0;c<5;c++){cols[c]=el('div',{class:'clue col'});board.append(cols[c]);}
  for(let r=0;r<5;r++){
    rows[r]=el('div',{class:'clue'});board.append(rows[r]);
    for(let c=0;c<5;c++){const i=r*5+c;cells[i]=el('button',{type:'button',class:'cell','data-index':i,onclick:e=>{if(e.detail===0)single(i,mode);},oncontextmenu:e=>{e.preventDefault();if(!stroke)single(i,-1);}});board.append(cells[i]);}
  }
  const select=el('select',{class:'level-select','aria-label':'选择数织关卡',onchange:e=>{const level=Number(e.target.value);select.value=state.level;motion.confirmRestart(state.history.length>0&&!state.done,()=>{state=fresh(level);render();});}});
  patterns.forEach((_,i)=>select.append(el('option',{value:i,text:`第 ${i+1} 关`})));
  const undo=button('撤销',()=>{const old=state.history.pop();if(old){state.cells=old;state.done=false;render();}});
  const paint=button('■ 涂色',()=>{mode=1;render();}),cross=button('× 标空',()=>{mode=-1;render();});
  const next=button('下一关',()=>{state=fresh((state.level+1)%patterns.length);render();});
  root.append(el('div',{class:'game-toolbar'},[el('div',{class:'stats'},[filled.node]),el('div',{class:'actions'},[select,undo,button('重置',()=>motion.confirmRestart(state.history.length>0&&!state.done,()=>{state=fresh(state.level);render();}),'plain')])]),board,el('div',{class:'mode-switch'},[paint,cross]),status.node,next);
  function fresh(level=ctx.daily?ctx.seed%patterns.length:0){return {level,cells:Array(25).fill(0),history:[],done:false};}
  function remember(){state.history.push([...state.cells]);if(state.history.length>80)state.history.shift();}
  function complete(){if(!state.done&&patternBits(patterns[state.level]).every((v,i)=>v===Number(state.cells[i]===1))){state.done=true;finish('nonogram');motion.pop(board);}render();}
  function setCell(i,value){if(state.cells[i]===value)return;state.cells[i]=value;render();motion.pop(cells[i]);}
  function single(i,value){if(state.done)return;remember();setCell(i,state.cells[i]===value?0:value);sound();complete();}
  const down=e=>{
    const cell=e.target.closest('button[data-index]');if(!cell||state.done||!e.isPrimary||e.button>0)return;
    e.preventDefault();const i=Number(cell.dataset.index);remember();
    stroke={id:e.pointerId,start:i,value:state.cells[i]===mode?0:mode,axis:null,visited:new Set([i])};
    board.setPointerCapture(e.pointerId);setCell(i,stroke.value);sound();
  };
  const move=e=>{
    if(!stroke||e.pointerId!==stroke.id)return;e.preventDefault();
    const rect=cells[0].getBoundingClientRect(),last=cells[6].getBoundingClientRect(),dx=last.left-rect.left,dy=last.top-rect.top;
    const c=Math.max(0,Math.min(4,Math.floor((e.clientX-rect.left)/dx))),r=Math.max(0,Math.min(4,Math.floor((e.clientY-rect.top)/dy))),end=r*5+c;
    if(end!==stroke.start&&!stroke.axis){const startCell=cells[stroke.start].getBoundingClientRect();stroke.axis=Math.abs(e.clientX-startCell.left-startCell.width/2)>=Math.abs(e.clientY-startCell.top-startCell.height/2)?'row':'col';}
    for(const i of strokeCells(stroke.start,end,5,stroke.axis))if(!stroke.visited.has(i)){stroke.visited.add(i);setCell(i,stroke.value);}
  };
  const up=e=>{if(!stroke||e.pointerId!==stroke.id)return;stroke=null;complete();};
  board.addEventListener('pointerdown',down);board.addEventListener('pointermove',move);board.addEventListener('pointerup',up);board.addEventListener('pointercancel',up);
  function render(){
    select.value=state.level;const hints=clues(patternBits(patterns[state.level])),current=clues(state.cells.map(v=>Number(v===1)));
    for(let i=0;i<5;i++)for(const [nodes,wanted,got,word]of [[rows,hints.rows,current.rows,'行'],[cols,hints.cols,current.cols,'列']]){
      nodes[i].textContent=wanted[i].join(' ');nodes[i].setAttribute('aria-label',t(`第${i+1}${word}提示 ${wanted[i].join('、')}`));nodes[i].classList.toggle('clue-complete',wanted[i].join()===got[i].join());
    }
    cells.forEach((cell,i)=>{const v=state.cells[i];cell.className=`cell ${v===1?'filled':v===-1?'cross':''}`;cell.textContent=v===-1?'×':'';cell.setAttribute('aria-label',t(`第${Math.floor(i/5)+1}行第${i%5+1}列，${v===1?'已涂色':v===-1?'标为空':'未标记'}`));});
    filled.set(state.cells.filter(v=>v===1).length);undo.disabled=!state.history.length;paint.classList.toggle('active',mode===1);cross.classList.toggle('active',mode===-1);paint.setAttribute('aria-pressed',String(mode===1));cross.setAttribute('aria-pressed',String(mode===-1));
    next.hidden=!state.done;next.className='btn next-puzzle';
    status.set(state.done?`图案揭晓：${patterns[state.level].name}。完成了！`:'',state.done?'success':'');ctx.save(state);
  }
  complete();return()=>{stroke=null;board.removeEventListener('pointerdown',down);board.removeEventListener('pointermove',move);board.removeEventListener('pointerup',up);board.removeEventListener('pointercancel',up);motion.dispose();};
}

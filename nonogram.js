import {startGame} from './game-transition.js?v=48';
import {el,button,stat,statusNode,sound,finish} from './shared.js?v=48';
import {createMotion} from './motion.js?v=48';
import {t} from './i18n.js?v=48';

// Original 5×5 pixel-art puzzles. Symmetries and enlarged boards form the
// larger fixed banks; each bank keeps its own stable level ordering.
export const patterns=[
  {name:'小小爱心',rows:['01010','11111','11111','01110','00100']},
  {name:'一棵小树',rows:['00100','01110','11111','00100','00100']},
  {name:'小房子',rows:['00100','01110','11111','11011','11011']},
  {name:'小帆船',rows:['00100','01100','11100','00100','11111']},
  {name:'一枚箭头',rows:['00100','00010','11111','00010','00100']},
  {name:'菱形',rows:['00100','01110','11111','01110','00100']},
  {name:'一杯热茶',rows:['10100','01000','11110','10011','11110']},
  {name:'一朵小花',rows:['01110','11111','01110','00100','01100']},
];
const extraPatterns=[
  {name:'蘑菇',rows:['00100','01110','11111','00100','01110']},
  {name:'小鱼',rows:['00100','11110','11111','01110','00100']},
  {name:'火箭',rows:['00100','01110','01110','11111','10101']},
  {name:'钥匙',rows:['01110','01000','01110','00010','00010']},
  {name:'皇冠',rows:['10101','11111','01010','01010','11111']},
  {name:'小幽灵',rows:['01110','11111','10101','11111','10101']},
  {name:'蝴蝶',rows:['11011','11111','01110','11111','11011']},
  {name:'音符',rows:['00110','00101','00101','11101','11100']},
];
const templates=[...patterns,...extraPatterns];
export const boardSizes=[5,10,15];
const symmetryNames=['原图','转向右','倒过来','转向左','左右镜像','镜像转右','镜像倒置','镜像转左'];
function transform(rows,flip,turns){
  let grid=rows.map(row=>row.split('').map(Number));
  if(flip)grid=grid.map(row=>row.slice().reverse());
  for(let k=0;k<turns;k++){
    const n=grid.length;
    grid=Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>grid[n-1-c][r]));
  }
  return grid.map(row=>row.join(''));
}
function largeArtwork(size,index){
  const grid=Array.from({length:size},()=>Array(size).fill(0)),scale=(size-1)/14;
  const family=(index+(size===15?7:0))%16,variant=Math.floor(index/16);
  const point=(x,y)=>[x*scale,y*scale];
  const set=(x,y,on=true)=>{const [px,py]=point(x,y),cx=Math.round(px),cy=Math.round(py);if(cx>=0&&cx<size&&cy>=0&&cy<size)grid[cy][cx]=on?1:0;};
  const line=(x1,y1,x2,y2,width=1)=>{
    const [ax,ay]=point(x1,y1),[bx,by]=point(x2,y2),radius=width*scale/2;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const vx=bx-ax,vy=by-ay,l=vx*vx+vy*vy,t=l?Math.max(0,Math.min(1,((x-ax)*vx+(y-ay)*vy)/l)):0;
      if((x-(ax+t*vx))**2+(y-(ay+t*vy))**2<=radius*radius)set(x/scale,y/scale);
    }
  };
  const ellipse=(cx,cy,rx,ry,fill=true)=>{
    const [x0,y0]=point(cx,cy),sx=rx*scale,sy=ry*scale;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const d=((x-x0)/Math.max(sx,.01))**2+((y-y0)/Math.max(sy,.01))**2;
      if(fill?d<=1:d<=1&&d>=.48)set(x/scale,y/scale);
    }
  };
  const polygon=(points)=>{
    const pts=points.map(([x,y])=>point(x,y));
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      let inside=false;
      for(let i=0,j=pts.length-1;i<pts.length;j=i++){
        const [xi,yi]=pts[i],[xj,yj]=pts[j];
        if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;
      }
      if(inside)set(x/scale,y/scale);
    }
  };
  const rect=(x1,y1,x2,y2)=>polygon([[x1,y1],[x2,y1],[x2,y2],[x1,y2]]);
  const ring=(cx,cy,outer,inner)=>{ellipse(cx,cy,outer,outer,true);ellipse(cx,cy,inner,inner,false);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const [px,py]=point(cx,cy);if(((x-px)/scale)**2+((y-py)/scale)**2<inner*inner)set(x/scale,y/scale,false);}};
  switch(family){
    case 0: ellipse(7,7,5,3);polygon([[2,7],[0,4],[0,10]]);ellipse(10,6,1,1);break; // fish
    case 1: polygon([[7,0],[11,5],[10,12],[7,14],[4,12],[3,5]]);polygon([[4,10],[1,14],[5,13]]);polygon([[10,10],[13,14],[9,13]]);ring(7,7,2,1);line(5,14,4,15);line(9,14,10,15);break; // rocket
    case 2: polygon([[1,6],[7,1],[13,6]]);rect(3,6,11,13);rect(5,9,6,10);rect(8,9,9,10);rect(6,11,8,13);break; // house
    case 3: polygon([[7,0],[2,6],[5,6],[0,11],[5,10],[2,13],[12,13],[9,10],[14,11],[9,6],[12,6]]);rect(6,12,8,15);break; // tree
    case 4: ellipse(7,9,4,4);ellipse(7,4,3,3);polygon([[5,2],[5,0],[7,2]]);polygon([[9,2],[10,0],[10,3]]);line(10,10,14,7,2);ellipse(6,4,1,1);ellipse(8,4,1,1);break; // cat
    case 5: polygon([[1,9],[13,9],[11,13],[4,13]]);line(7,2,7,10);polygon([[7,2],[2,8],[7,8]]);polygon([[8,3],[12,8],[8,8]]);break; // sailboat
    case 6: ellipse(7,5,6,4);rect(4,5,10,11);line(4,11,10,11,2);break; // mushroom
    case 7: ellipse(3,4,3,4);ellipse(11,4,3,4);ellipse(3,10,3,4);ellipse(11,10,3,4);line(7,2,7,13,2);line(5,5,4,7);line(9,5,10,7);break; // butterfly
    case 8: ring(4,5,4,2);line(7,5,14,12,2);line(11,9,9,11,2);line(13,11,11,13,2);break; // key
    case 9: ellipse(6,8,4,5);ring(11,8,3,2);polygon([[3,4],[5,3],[8,4],[7,5]]);polygon([[2,8],[0,6],[1,10]]);break; // teapot
    case 10: ellipse(6,8,5,3);ellipse(4,7,2,2);polygon([[1,7],[0,5],[3,6]]);polygon([[10,7],[14,5],[11,9]]);line(5,11,4,14,2);line(8,11,9,14,2);ellipse(4,6,1,1);break; // bird
    case 11: for(let a=0;a<8;a++){const ang=a*Math.PI/4;ellipse(7+Math.cos(ang)*3.5,5+Math.sin(ang)*3.5,2,2);}ellipse(7,5,2,2);line(7,7,7,14,2);line(7,11,4,9,2);line(7,12,10,10,2);break; // flower
    case 12: polygon([[4,5],[10,5],[9,14],[5,14]]);rect(5,2,9,5);line(2,1,0,0);line(11,1,14,0);ring(7,3,2,1);break; // lighthouse
    case 13: ellipse(7,8,5,4);ellipse(12,8,2,2);ellipse(3,3,2,2);ellipse(11,3,2,2);ellipse(3,13,2,2);ellipse(11,13,2,2);line(4,7,10,7,2);break; // turtle
    case 14: rect(1,5,12,11);rect(8,2,12,5);rect(3,3,5,5);ellipse(4,12,2,2);ellipse(10,12,2,2);line(0,11,14,11,1);break; // train
    default: polygon([[0,12],[4,6],[7,9],[10,3],[14,12]]);ellipse(10,3,2,2);line(0,13,14,13,1);break; // mountain
  }
  if(variant){
    // A second authored arrangement per motif adds a small, clearly visible detail.
    const p=[[2,2],[12,2],[2,12],[12,12]][family%4];ellipse(p[0],p[1],1,1);
  }
  return grid.map(row=>row.join(''));
}
function makeBank(size){
  const bank=[],seen=new Set(),source=size===5?templates.map(p=>p.rows):Array.from({length:32},(_,i)=>largeArtwork(size,i));
  for(const rows of source)for(let flip=0;flip<2;flip++)for(let turns=0;turns<4;turns++){
    const art=transform(rows,!!flip,turns),key=art.join('');
    if(seen.has(key))continue;
    seen.add(key);bank.push({name:`图案 ${String(bank.length+1).padStart(3,'0')}`,rows:art});
  }
  return bank;
}
export const puzzleBanks=Object.fromEntries(boardSizes.map(size=>[size,makeBank(size)]));
export const puzzles=puzzleBanks[5];
export const patternBits=p=>p.rows.join('').split('').map(Number);
export function runs(values){const result=[];let n=0;for(const v of [...values,0])if(v)n++;else if(n){result.push(n);n=0;}return result.length?result:[0];}
export function clues(board,size=5){return {rows:Array.from({length:size},(_,r)=>runs(board.slice(r*size,(r+1)*size))),cols:Array.from({length:size},(_,c)=>runs(Array.from({length:size},(_,r)=>board[r*size+c])))};}
// A stroke locks to its first row or column; all cells use the starting paint value.
export function strokeCells(start,end,size=5,axis=null){
  const r=Math.floor(start/size),c=start%size,rr=Math.floor(end/size),cc=end%size;
  if(axis==null)axis=Math.abs(cc-c)>=Math.abs(rr-r)?'row':'col';
  const target=axis==='row'?r*size+cc:rr*size+c,step=target===start?1:Math.sign(target-start)*(axis==='row'?1:size),out=[];
  for(let i=start;;i+=step){out.push(i);if(i===target)break;}return out;
}
function validSize(size){return boardSizes.includes(size)?size:5;}
function validLevel(level,size){return Number.isInteger(level)&&level>=0&&level<puzzleBanks[size].length?level:0;}
function variant(size){return `nonogram:${size}x${size}`;}
export const pageInfo=ctx=>{
  const saved=ctx.load()||{},size=validSize(saved.size),level=validLevel(saved.level,size);
  return {level:String(level+1),...(size===5?{}:{variant:variant(size)})};
};

export function mount(root,ctx){
  const loaded=ctx.load()||{};
  let size=validSize(loaded.size),level=Number.isInteger(loaded.level)?validLevel(loaded.level,size):(ctx.daily?ctx.seed%puzzleBanks[size].length:0),mode=1,stroke=null;
  let state={size,level,cells:Array.isArray(loaded.cells)&&loaded.cells.length===size*size?loaded.cells.map(v=>[-1,0,1].includes(v)?v:0):Array(size*size).fill(0),history:Array.isArray(loaded.history)?loaded.history.filter(x=>Array.isArray(x)&&x.length===size*size).slice(-80):[],done:!!loaded.done};
  const motion=createMotion(),filled=stat('已涂格'),status=statusNode(),board=el('div',{class:'nonogram','aria-label':'数织棋盘'});
  let cells=[],rows=[],cols=[],builtSize=0;
  const sizeSelect=el('select',{class:'nonogram-size','aria-label':'棋盘规格',onchange:e=>{
    const nextSize=validSize(Number(e.target.value));
    if(nextSize===state.size)return;
    motion.confirmRestart(state.history.length>0&&!state.done,()=>startGame(ctx,'settings',()=>{state=fresh(0,nextSize);buildLevels();render();},{level:'1',variant:variant(nextSize)}));
    sizeSelect.value=String(state.size);
  }});
  for(const n of boardSizes)sizeSelect.append(el('option',{value:n,text:`${n}×${n}`}));
  const select=el('select',{class:'level-select','aria-label':'选择数织关卡',onchange:e=>{
    const nextLevel=validLevel(Number(e.target.value),state.size);select.value=String(state.level);
    if(nextLevel===state.level)return;
    motion.confirmRestart(state.history.length>0&&!state.done,()=>startGame(ctx,'select',()=>{state=fresh(nextLevel);render();},{level:String(nextLevel+1),variant:variant(state.size)}));
  }});
  const undo=button('撤销',()=>{const old=state.history.pop();if(old){state.cells=old;state.done=false;render();}});
  const paint=button('■ 涂色',()=>{mode=1;render();}),cross=button('× 标空',()=>{mode=-1;render();});
  const reset=button('重置',()=>motion.confirmRestart(state.history.length>0&&!state.done,()=>startGame(ctx,'restart',()=>{state=fresh(state.level,state.size);render();},{level:String(state.level+1),variant:variant(state.size)})),'plain');
  const next=button('下一关',()=>{const level=(state.level+1)%puzzleBanks[state.size].length;return startGame(ctx,'next',()=>{state=fresh(level,state.size);render();},{level:String(level+1),variant:variant(state.size)});});
  root.append(el('div',{class:'game-toolbar'},[el('div',{class:'stats'},[filled.node]),el('div',{class:'actions nonogram-actions'},[sizeSelect,select,undo,reset])]),board,el('div',{class:'mode-switch'},[paint,cross]),status.node,next);

  function fresh(nextLevel=ctx.daily?ctx.seed%puzzleBanks[state.size].length:0,nextSize=state.size){return {size:nextSize,level:validLevel(nextLevel,nextSize),cells:Array(nextSize*nextSize).fill(0),history:[],done:false};}
  function buildLevels(){
    const bank=puzzleBanks[state.size];select.replaceChildren(...bank.map((_,i)=>el('option',{value:i,text:`第 ${i+1} 题`})));
    sizeSelect.value=String(state.size);select.value=String(state.level);
  }
  function buildGrid(){
    const n=state.size,clueWidth=n>=15?36:n>=10?54:43;
    board.dataset.size=String(n);
    board.style.width=`min(100%, ${n>=15?440:n>=10?420:350}px)`;
    board.style.gridTemplateColumns=`${clueWidth}px repeat(${n}, minmax(0, 1fr))`;
    board.style.rowGap=n>=15?'3px':n>=10?'5px':'8px';
    cells=[];rows=[];cols=[];
    const children=[el('div',{'aria-hidden':'true'})];
    for(let c=0;c<n;c++){cols[c]=el('div',{class:'clue col'});children.push(cols[c]);}
    for(let r=0;r<n;r++){
      rows[r]=el('div',{class:'clue'});children.push(rows[r]);
      for(let c=0;c<n;c++){
        const i=r*n+c;
        cells[i]=el('button',{type:'button',class:'cell','data-index':i,onclick:e=>{if(e.detail===0)single(i,mode);},oncontextmenu:e=>{e.preventDefault();if(!stroke)single(i,-1);}});
        children.push(cells[i]);
      }
    }
    board.replaceChildren(...children);builtSize=n;
  }
  function remember(){state.history.push([...state.cells]);if(state.history.length>80)state.history.shift();}
  function sameRuns(a,b){return a.length===b.length&&a.every((line,i)=>line.length===b[i].length&&line.every((v,j)=>v===b[i][j]));}
  function meetsClues(){
    const n=state.size,target=clues(patternBits(puzzleBanks[n][state.level]),n),current=clues(state.cells.map(v=>Number(v===1)),n);
    return sameRuns(target.rows,current.rows)&&sameRuns(target.cols,current.cols);
  }
  function complete(){if(!state.done&&meetsClues()){state.done=true;ctx.result?.('won');finish('nonogram');motion.pop(board);}render();}
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
    const n=state.size,first=cells[0].getBoundingClientRect(),right=cells[1].getBoundingClientRect(),below=cells[n].getBoundingClientRect();
    const dx=right.left-first.left,dy=below.top-first.top;
    const c=Math.max(0,Math.min(n-1,Math.floor((e.clientX-first.left)/dx))),r=Math.max(0,Math.min(n-1,Math.floor((e.clientY-first.top)/dy))),end=r*n+c;
    if(end!==stroke.start&&!stroke.axis){const startCell=cells[stroke.start].getBoundingClientRect();stroke.axis=Math.abs(e.clientX-startCell.left-startCell.width/2)>=Math.abs(e.clientY-startCell.top-startCell.height/2)?'row':'col';}
    for(const i of strokeCells(stroke.start,end,n,stroke.axis))if(!stroke.visited.has(i)){stroke.visited.add(i);setCell(i,stroke.value);}
  };
  const up=e=>{if(!stroke||e.pointerId!==stroke.id)return;stroke=null;complete();};
  board.addEventListener('pointerdown',down);board.addEventListener('pointermove',move);board.addEventListener('pointerup',up);board.addEventListener('pointercancel',up);
  function render(){
    if(builtSize!==state.size)buildGrid();
    if(sizeSelect.value!==String(state.size))sizeSelect.value=String(state.size);
    if(select.options.length!==puzzleBanks[state.size].length)buildLevels();
    select.value=String(state.level);
    const n=state.size,hints=clues(patternBits(puzzleBanks[n][state.level]),n),current=clues(state.cells.map(v=>Number(v===1)),n);
    for(let i=0;i<n;i++){
      rows[i].replaceChildren(...hints.rows[i].flatMap((value,index)=>index?[el('span',{class:'clue-separator',text:'·'}),el('span',{text:String(value)})]:[el('span',{text:String(value)})]));
      rows[i].setAttribute('aria-label',t(`第${i+1}行提示 ${hints.rows[i].join('、')}`));
      rows[i].classList.toggle('clue-complete',hints.rows[i].join()===current.rows[i].join());
      cols[i].textContent=hints.cols[i].join(' ');
      cols[i].setAttribute('aria-label',t(`第${i+1}列提示 ${hints.cols[i].join('、')}`));
      cols[i].classList.toggle('clue-complete',hints.cols[i].join()===current.cols[i].join());
    }
    cells.forEach((cell,i)=>{const v=state.cells[i];cell.className=`cell ${v===1?'filled':v===-1?'cross':''}`;cell.textContent='';cell.setAttribute('aria-label',t(`第${Math.floor(i/n)+1}行第${i%n+1}列，${v===1?'已涂色':v===-1?'标为空':'未标记'}`));});
    filled.set(state.cells.filter(v=>v===1).length);undo.disabled=!state.history.length;reset.disabled=false;paint.classList.toggle('active',mode===1);cross.classList.toggle('active',mode===-1);paint.setAttribute('aria-pressed',String(mode===1));cross.setAttribute('aria-pressed',String(mode===-1));
    next.hidden=!state.done;next.className='btn next-puzzle';
    status.set(state.done?'行列提示全部吻合！完成了！':'',state.done?'success':'');ctx.save(state);
  }
  buildLevels();render();return()=>{stroke=null;board.removeEventListener('pointerdown',down);board.removeEventListener('pointermove',move);board.removeEventListener('pointerup',up);board.removeEventListener('pointercancel',up);motion.dispose();};
}

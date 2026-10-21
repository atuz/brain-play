import {el,button,sound,finish,keyboardAndSwipe} from './shared.js?v=11';
import {createMotion,motionEnabled} from './motion.js?v=11';
import {t} from './i18n.js?v=11';
import {levels} from './domino-levels.js?v=11';
import {at,clone,hasFloor,neighbors,pathTo,edit,initialPosition,simulate,validPosition,walkable} from './domino-engine.js?v=11';

const types={
  normal:['普通牌','碰到下一张牌，继续连锁。',''],
  delay:['延时牌','停顿一下，再向同一方向倒下。','⌛'],
  bridge:['搭桥牌','朝一格宽的断口倒下，搭桥并碰到对面的牌。','━'],
  vanish:['消失牌','倒下后消失；只有它可以放在门口。','═'],
  splitter:['分叉牌','必须被上方落下的骨牌击中，才会向左右分开。','↔'],
  trigger:['出口牌','不能搬动，必须最后倒下，才能打开出口。','≡'],
};
const antArt='<svg viewBox="0 0 70 80" aria-hidden="true"><g class="dc-ant-body" fill="none" stroke="#553c2a" stroke-width="3.2" stroke-linecap="round"><path d="M27 46L15 53 11 64M32 49L23 62 27 69M39 49L48 57 47 68M37 41L51 39 56 31M39 15L35 6M47 15L52 6"/><ellipse cx="23" cy="43" rx="12" ry="15" fill="#805634" transform="rotate(-25 23 43)"/><ellipse cx="36" cy="41" rx="8" ry="11" fill="#aa7745"/><ellipse cx="43" cy="24" rx="13" ry="14" fill="#bd8b50"/><path d="M45 37L35 37 28 42 39 44" fill="#5a8066" stroke="#5a8066"/><ellipse cx="48" cy="21" rx="3" ry="4.5" fill="#fff7df" stroke="none"/><circle cx="49" cy="22" r="1.8" fill="#302c22" stroke="none"/><path d="M48 30Q53 32 56 28" stroke-width="2"/></g></svg>';

function fresh(index=0){return {version:1,level:index,position:initialPosition(levels[index]),history:[],attempt:null,phase:'arrange',walker:null,postHistory:[]};}
export function restore(saved){
  try {
    if(saved?.version!==1||!Number.isInteger(saved.level)||!levels[saved.level])return fresh();
    const level=levels[saved.level];
    if(!validPosition(level,saved.position)||!Array.isArray(saved.history)||saved.history.length>100||!saved.history.every(p=>validPosition(level,p)))return fresh(saved.level);
    if(!['arrange','failed','exit','won'].includes(saved.phase))return fresh(saved.level);
    if(!saved.attempt)return saved.phase==='arrange'?clone(saved):fresh(saved.level);
    if(saved.position.carrying||!saved.position.pieces.some(p=>p.id===saved.attempt.id&&at(p,saved.position.player)))return fresh(saved.level);
    const result=simulate(level,saved.position.pieces,saved.attempt.id,saved.attempt.dir);
    if(!result.valid||saved.phase==='arrange'||(saved.phase==='failed')===result.won)return fresh(saved.level);
    if(!Array.isArray(saved.postHistory)||saved.postHistory.length>500)return fresh(saved.level);
    if(result.won&&(!walkable(level,saved.walker||{},result.bridges)||!pathTo(level,saved.position.player,saved.walker,result.bridges)))return fresh(saved.level);
    if(!saved.postHistory.every(p=>walkable(level,p,result.bridges)))return fresh(saved.level);
    if(saved.phase==='won'&&!at(saved.walker,level.exit))return fresh(saved.level);
    return clone(saved);
  } catch {return fresh();}
}

export function mount(root,ctx){
  root.classList.add('play-domino');
  let state=restore(ctx.load()),level=levels[state.level],result=null,frame=null,running=false,walking=false,facing=1;
  let runToken=0,walkToken=0,alive=true,notice='';
  const timers=new Map(),dialogs=new Set(),motion=createMotion(),stoneNodes=new Map();
  let records=ctx.read('domino:records',{});
  if(!records||typeof records!=='object'||Array.isArray(records))records={};
  const wait=ms=>new Promise(resolve=>{const id=setTimeout(()=>{timers.delete(id);resolve();},ms);timers.set(id,resolve);});
  function stop(){runToken++;walkToken++;walking=false;running=false;for(const [id,resolve]of timers){clearTimeout(id);resolve();}timers.clear();}
  const levelNumber=el('span',{class:'dc-level-number'}),levelName=el('span',{class:'dc-level-name'}),progress=el('span',{class:'dc-progress',title:'已完成关卡'});
  const levelButton=el('button',{type:'button',class:'dc-level-button','aria-label':'选择骨牌关卡',onclick:chooseLevel},[levelNumber,levelName,el('span',{text:'⌄','aria-hidden':'true'})]);
  const hint=button('提示',()=>{notice=level.hint;renderText();},'plain');
  const world=el('div',{class:'dc-world','aria-label':'骨牌棋盘'});
  const scenery=el('div',{class:'dc-scenery','aria-hidden':'true'}),surfaces=el('div',{class:'dc-surfaces','aria-hidden':'true'}),tileLayer=el('div',{class:'dc-tiles'}),stones=el('div',{class:'dc-stones','aria-hidden':'true'});
  const door=el('div',{class:'dc-door','aria-hidden':'true'},[el('i'),el('span',{text:'↗'})]);
  const ant=el('div',{class:'dc-ant','aria-hidden':'true'});ant.innerHTML=antArt;
  const carried=el('span',{class:'dc-carried',hidden:'hidden'});ant.append(carried);
  world.append(scenery,surfaces,door,stones,ant,tileLayer);
  const badge=el('span',{class:'dc-badge'}),instruction=el('span',{class:'dc-instruction'}),readout=el('div',{class:'dc-readout','aria-live':'polite'},[badge,instruction]);
  const pad=el('div',{class:'direction-pad dc-pad','aria-label':'方向控制'});
  for(const [dir,label,arrow]of [['up','向上','↑'],['left','向左','←'],['down','向下','↓'],['right','向右','→']])pad.append(el('button',{type:'button',text:arrow,'aria-label':label,'data-direction':dir,onclick:()=>step(dir)}));
  const carry=button('搬起',carryOrPlace,'dc-carry');
  const pushLeft=button('← 推倒',()=>push(-1),'dc-push'),pushRight=button('推倒 →',()=>push(1),'dc-push');
  const actions=el('div',{class:'dc-action-pad'},[carry,el('div',{class:'dc-push-row'},[pushLeft,pushRight])]);
  const undo=button('撤销',undoAction,'plain'),retry=button('回到摆放',retryAction,'plain');
  const restart=button('重开',()=>motion.confirmRestart(state.history.length>0||!!state.attempt,()=>loadLevel(state.level)),'plain');
  const status=el('p',{class:'dc-status','aria-live':'polite'});
  const next=button('下一关',()=>loadLevel((state.level+1)%levels.length));
  const celebration=el('section',{class:'dc-complete',hidden:'hidden'},[el('span',{text:'✓','aria-hidden':'true'}),el('h2',{text:'连锁完成！'}),next]);
  const legend=el('details',{class:'dc-legend'},[el('summary',{text:'骨牌图鉴'})]);
  const legendItems=el('div',{class:'dc-legend-items'});
  for(const [type,[name,description,mark]]of Object.entries(types))legendItems.append(el('div',{class:'dc-legend-item'},[
    el('span',{class:`dc-mini-stone dc-${type}`,text:mark,'aria-hidden':'true'}),el('div',{},[el('strong',{text:name}),el('p',{text:description})]),
  ]));
  legend.append(legendItems);
  root.append(el('div',{class:'game-toolbar dc-toolbar'},[levelButton,el('div',{class:'dc-toolbar-right'},[progress,hint])]),world,readout,
    el('div',{class:'dc-controls'},[pad,actions]),el('div',{class:'dc-tools'},[undo,retry,restart]),status,celebration,legend);

  function save(){ctx.save(state);}
  function player(){return state.attempt?state.walker||state.position.player:state.position.player;}
  function playingPieces(){return frame?.pieces||result?.pieces||state.position.pieces;}
  function currentPiece(){return !state.attempt&&state.position.pieces.find(p=>at(p,state.position.player));}
  const viewTop=()=>level.ladders.length?0:3,viewRows=()=>level.height-viewTop();
  function placeNode(node,p){node.style.left=`${p.x/level.width*100}%`;node.style.top=`${(p.y-viewTop())/viewRows()*100}%`;}
  function buildWorld(){
    world.style.setProperty('--dc-cols',level.width);world.style.setProperty('--dc-rows',viewRows());
    world.style.aspectRatio=`${level.width}/${viewRows()}`;
    surfaces.replaceChildren();tileLayer.replaceChildren();stones.replaceChildren();stoneNodes.clear();
    for(const [y,from,to]of level.platforms){
      const surface=el('div',{class:'dc-platform',style:`left:${from/level.width*100}%;top:${(y-viewTop()+.9)/viewRows()*100}%;width:${(to-from+1)/level.width*100}%`});surfaces.append(surface);
    }
    for(const l of level.ladders)surfaces.append(el('div',{class:'dc-ladder',style:`left:${(l.x+.36)/level.width*100}%;top:${(l.from-viewTop()+.7)/viewRows()*100}%;height:${(l.to-l.from+.2)/viewRows()*100}%`}));
    for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++){
      if(!hasFloor(level,x,y)&&!level.ladders.some(l=>l.x===x&&y>=l.from&&y<=l.to))continue;
      const cell=el('button',{type:'button',class:'dc-cell','data-x':x,'data-y':y,onclick:()=>walkTo({x,y})});placeNode(cell,{x,y});tileLayer.append(cell);
    }
    placeNode(door,level.exit);
    for(const p of level.pieces){const node=el('div',{class:`dc-stone dc-${p.type}`,'data-stone-id':p.id},[el('span',{class:'dc-stone-face',text:types[p.type][2]})]);stoneNodes.set(p.id,node);stones.append(node);}
  }
  function renderScene(){
    const p=player(),visible=playingPieces();placeNode(ant,p);ant.style.setProperty('--dc-facing',facing);ant.classList.toggle('walking',walking);
    const held=state.attempt?null:state.position.carrying;
    carried.hidden=!held;carried.className=`dc-carried dc-mini-stone dc-${held?.type||'normal'}`;carried.textContent=held?types[held.type][2]:'';
    for(const original of level.pieces){
      const stone=visible.find(q=>q.id===original.id),node=stoneNodes.get(original.id);
      node.hidden=!stone;if(!stone)continue;
      const stage=stone.state||'upright';
      node.className=`dc-stone dc-${stone.type} dc-${stage}`;
      node.classList.toggle('dc-selected',!state.attempt&&at(stone,p));
      node.style.setProperty('--dc-dir',stone.dir||1);
      node.style.setProperty('--dc-travel',stage==='dropping'?`${Math.max(1,stone.dropY-stone.y)*200}ms`:'150ms');
      placeNode(node,stage==='dropping'?{x:stone.dropX,y:stone.dropY}:stone);
    }
    surfaces.querySelectorAll('.dc-bridge-floor').forEach(n=>n.remove());
    for(const bridge of frame?.bridges||result?.bridges||[]){
      surfaces.append(el('div',{class:'dc-platform dc-bridge-floor',style:`left:${bridge.x/level.width*100}%;top:${(bridge.y-viewTop()+.9)/viewRows()*100}%;width:${100/level.width}%`}));
      if(!tileLayer.querySelector(`[data-x="${bridge.x}"][data-y="${bridge.y}"]`)){
        const cell=el('button',{type:'button',class:'dc-cell dc-bridge-cell','data-x':bridge.x,'data-y':bridge.y,onclick:()=>walkTo(bridge)});placeNode(cell,bridge);tileLayer.append(cell);
      }
    }
    if(!state.attempt)tileLayer.querySelectorAll('.dc-bridge-cell').forEach(n=>n.remove());
    for(const cell of tileLayer.children){
      const q={x:Number(cell.dataset.x),y:Number(cell.dataset.y)},stone=visible.find(s=>at(s,q)&&s.state!=='vanished');
      const word=at(q,p)?'蚂蚁':at(q,level.exit)?'出口':stone?types[stone.type][0]:hasFloor(level,q.x,q.y,frame?.bridges||result?.bridges||[])?'地面':'梯子';
      cell.setAttribute('aria-label',t(`第${q.y+1}行第${q.x+1}列，${t(word)}`));cell.classList.toggle('dc-current',at(q,p));
      cell.disabled=running||state.phase==='failed'||state.phase==='won';
    }
    door.classList.toggle('dc-door-open',!!result?.won&&!running);
    world.dataset.phase=running?'running':state.phase;
  }
  function renderText(){
    const piece=currentPiece(),held=state.position.carrying;
    levelNumber.textContent=String(state.level+1).padStart(2,'0');levelName.textContent=t(level.name);
    progress.textContent=`${Object.keys(records).filter(k=>levels[Number(k)]&&Number.isSafeInteger(records[k])).length}/${levels.length}`;
    if(running){badge.textContent='↝';instruction.textContent=t('连锁进行中…');}
    else if(state.phase==='exit'){badge.textContent='↗';instruction.textContent=t('门开了，走进出口！');}
    else if(state.phase==='won'){badge.textContent='✓';instruction.textContent=t('连锁完成！');}
    else if(state.phase==='failed'){badge.textContent='↶';instruction.textContent=t('回到摆放，再试一次。');}
    else {
      badge.textContent=held?types[held.type][2]||'▮':piece?types[piece.type][2]||'▮':'•';
      instruction.textContent=t(held?'搬着骨牌，走到空位后放下。':piece?types[piece.type][1]:'点地面走路；走到牌上可搬起或推倒。');
    }
    badge.className=`dc-badge dc-${held?.type||piece?.type||'normal'}`;
    carry.textContent=t(held?'放下':'搬起');
    carry.disabled=running||walking||!!state.attempt||(!held&&(!piece||piece.type==='trigger'));
    pushLeft.disabled=pushRight.disabled=running||walking||!!state.attempt||!!held||!piece||piece.type==='splitter';
    const deltas={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},p=player(),reachable=neighbors(level,p,result?.bridges||[]);
    for(const cell of pad.children){const delta=deltas[cell.dataset.direction];cell.disabled=running||state.phase==='failed'||state.phase==='won'||!reachable.some(q=>q.x===p.x+delta[0]&&q.y===p.y+delta[1]);}
    undo.disabled=!(state.history.length||state.attempt);retry.disabled=!state.attempt;hint.disabled=running||walking;levelButton.disabled=running;
    status.textContent=t(notice);status.classList.toggle('dc-error',state.phase==='failed');
    celebration.hidden=state.phase!=='won';
    next.textContent=t(state.level===levels.length-1?'再玩一轮':'下一关');
  }
  function render(){if(!alive)return;renderScene();renderText();}
  function remember(){state.history.push(clone(state.position));if(state.history.length>100)state.history.shift();}
  function markWon(){
    if(state.phase!=='exit'||!at(state.walker,level.exit))return;
    state.phase='won';notice='';
    const moves=state.position.moves+state.postHistory.length;
    records[state.level]=Math.min(Number.isSafeInteger(records[state.level])?records[state.level]:Infinity,moves);
    ctx.write('domino:records',records);finish('domino');
  }
  function walkOne(to){
    if(running||['failed','won'].includes(state.phase))return false;
    const before=player();if(to.x!==before.x)facing=Math.sign(to.x-before.x);
    if(state.attempt){
      if(!neighbors(level,before,result.bridges).some(p=>at(p,to)))return false;
      state.postHistory.push(clone(before));if(state.postHistory.length>500)state.postHistory.shift();state.walker=clone(to);markWon();
    }else{
      const next=edit(level,state.position,{type:'walk',to});if(!next)return false;remember();state.position=next;
    }
    notice='';save();render();return true;
  }
  async function walkTo(target){
    if(running||['failed','won'].includes(state.phase))return;
    const path=pathTo(level,player(),target,result?.bridges||[]);if(!path){notice='这里走不到，可以找梯子绕行。';renderText();return;}
    const token=++walkToken;walking=true;
    for(const cell of path){if(!alive||token!==walkToken)break;if(!walkOne(cell))break;await wait(motionEnabled()?115:0);}
    if(alive&&token===walkToken){walking=false;render();}
  }
  function step(direction){
    if(running)return;
    if(walking){walkToken++;walking=false;}
    const delta={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[direction],p=player();
    if(delta)walkOne({x:p.x+delta[0],y:p.y+delta[1]});
  }
  function carryOrPlace(){
    if(running||walking||state.attempt)return;
    const next=edit(level,state.position,{type:state.position.carrying?'place':'take'});
    if(!next){notice='这里不能放牌：需要空的地面，门口只允许消失牌。';renderText();return;}
    remember();state.position=next;notice='';sound();save();render();
  }
  async function push(dir){
    const starter=currentPiece();
    if(!starter||starter.type==='splitter'||running||walking||state.attempt||state.position.carrying)return;
    const simulation=simulate(level,state.position.pieces,starter.id,dir);if(!simulation.valid)return;
    stop();const token=++runToken;result=simulation;state.attempt={id:starter.id,dir};state.walker=clone(state.position.player);state.postHistory=[];
    state.phase=result.won?'exit':'failed';save();notice='';running=true;frame=result.trace[0];render();sound();
    if(motionEnabled())for(let i=1;i<result.trace.length;i++){
      await wait((result.trace[i].time-result.trace[i-1].time)*200);
      if(!alive||token!==runToken)return;
      frame=result.trace[i];renderScene();
    }
    if(motionEnabled())await wait(200);
    if(!alive||token!==runToken)return;
    frame=null;running=false;
    notice=result.won?'':({remaining:'还有骨牌站着。回到摆放，补上断开的连锁。',early:'出口牌倒得太早了，试着调整两边的顺序。',crash:'骨牌撞坏了。落下的骨牌需要由分叉牌接住。'}[result.reason]||'连锁没有完成，再调整一下。');
    save();render();if(result.won)sound(true);
  }
  function retryAction(){
    if(!state.attempt)return;stop();state.attempt=null;state.walker=null;state.postHistory=[];state.phase='arrange';result=null;frame=null;notice='';save();render();
  }
  function undoAction(){
    if(state.attempt){
      if(!running&&state.postHistory.length){state.walker=state.postHistory.pop();state.phase='exit';notice='';save();render();return;}
      retryAction();return;
    }
    if(state.history.length){stop();state.position=state.history.pop();notice='';save();render();}
  }
  function loadLevel(index){stop();state=fresh(index);level=levels[index];result=null;frame=null;notice='';buildWorld();save();render();}
  function chooseLevel(){
    const modal=el('dialog',{class:'app-dialog dc-level-dialog','aria-label':'选择骨牌关卡'});
    const close=()=>modal.close();
    modal.append(el('div',{class:'dialog-header'},[el('h2',{text:'关卡'}),el('button',{class:'app-icon',type:'button',text:'×','aria-label':'关闭',onclick:close})]));
    const grid=el('div',{class:'dc-level-grid'});
    levels.forEach((item,index)=>grid.append(el('button',{type:'button',class:`dc-level-option${index===state.level?' active':''}`,'aria-label':`${t(`第 ${index+1} 关`)} ${t(item.name)}`,onclick:()=>{
      close();motion.confirmRestart(state.phase!=='won'&&(state.history.length>0||!!state.attempt),()=>loadLevel(index));
    }},[el('span',{text:`${index+1}${Number.isSafeInteger(records[index])?' ✓':''}`}),el('small',{text:item.name})])));
    modal.append(grid);dialogs.add(modal);modal.addEventListener('close',()=>{dialogs.delete(modal);modal.remove();},{once:true});document.body.append(modal);modal.showModal();
  }
  const shortcuts=e=>{
    if(document.querySelector('dialog[open]')||e.target.closest('input,select,textarea')||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key.toLowerCase()==='z'){e.preventDefault();undoAction();}
    if(e.code==='Space'&&e.target===document.body){e.preventDefault();carryOrPlace();}
  };
  window.addEventListener('keydown',shortcuts);
  const detach=keyboardAndSwipe(world,step);
  if(state.attempt)result=simulate(level,state.position.pieces,state.attempt.id,state.attempt.dir);
  buildWorld();render();
  return()=>{alive=false;stop();detach();window.removeEventListener('keydown',shortcuts);for(const modal of dialogs)modal.close();dialogs.clear();motion.dispose();};
}

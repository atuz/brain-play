import {startGame} from './game-transition.js?v=27';
import {gameRuntime} from './game-runtime.js?v=26';
import {el,button,sound,finish,keyboardAndSwipe} from './shared.js?v=27';
import {createMotion,motionEnabled} from './motion.js?v=27';
import {t} from './i18n.js?v=16';
import {levels,chapters} from './domino-levels.js?v=22';
import {at,clone,hasFloor,neighbors,pathTo,edit,initialPosition,simulate,validPosition,walkable} from './domino-engine.js?v=16';
import {failureSummary,nextGuide} from './domino-guide.js?v=16';
import {mountCamera} from './domino-camera.js?v=27';
import {antArtwork,createAntActor} from './domino-actor.js?v=27';
import {sceneryForLevel,chapterSceneries} from './domino-scenery.js?v=22';
import {dominoArtwork} from './domino-material.js?v=20';
import {restingDominoes} from './domino-resting.js?v=21';

const types={
  normal:['普通牌','碰到下一张牌，继续连锁。',''],
  delay:['延时牌','停顿一下，再向同一方向倒下。','⌛'],
  bridge:['搭桥牌','朝一格宽的断口倒下，搭桥并碰到对面的牌。','━'],
  vanish:['消失牌','倒下后消失；只有它可以放在门口。','═'],
  splitter:['分叉牌','必须被上方落下的骨牌击中，才会向左右分开。','↔'],
  trigger:['开门牌','不能搬动；最后倒下时远程开门，和门不必相邻。','≡'],
};

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

export const pageInfo=ctx=>{const i=ctx.load()?.level;return {level:String(Number.isInteger(i)&&i>=0&&i<levels.length?i+1:1)};};
export function mount(root,ctx){
  root.classList.add('play-domino');
  let state=restore(ctx.load()),level=levels[state.level],result=null,frame=null,running=false,walking=false,facing=1;
  let runToken=0,walkToken=0,alive=true,notice='',guideActive=false,guide=null;
  let actor,acting=false,transfer=null,actionToken=0,queuedWalk=null,moveKind='idle',moveDuration=180;
  const timers=new Set(),dialogs=new Set(),motion=createMotion(),stoneNodes=new Map();
  let records=ctx.read('domino:records',{});
  if(!records||typeof records!=='object'||Array.isArray(records))records={};
  const wait=ms=>{const timer=gameRuntime.delay(ms);timers.add(timer);return timer.finished.finally(()=>timers.delete(timer));};
  function stop(){runToken++;walkToken++;actionToken++;walking=false;running=false;acting=false;transfer=null;queuedWalk=null;moveKind='idle';actor?.cancel();for(const timer of timers)timer.cancel();timers.clear();}
  const levelNumber=el('span',{class:'dc-level-number'}),levelName=el('span',{class:'dc-level-name'}),progress=el('span',{class:'dc-progress',title:'已完成关卡'});
  const levelButton=el('button',{type:'button',class:'dc-level-button','aria-label':'选择骨牌关卡',onclick:chooseLevel},[levelNumber,levelName,el('span',{text:'⌄','aria-hidden':'true'})]);
  const hint=button('提示',()=>{guideActive=true;notice='';render();const target=guide?.source||guide?.target;if(target)stageCamera.show(stagePoint(target));},'plain');
  const viewport=el('div',{class:'dc-viewport'});
  const world=el('div',{class:'dc-world','aria-label':'骨牌棋盘'});
  const scenery=el('div',{class:'dc-scenery','aria-hidden':'true'}),surfaces=el('div',{class:'dc-surfaces','aria-hidden':'true'}),tileLayer=el('div',{class:'dc-tiles'}),stones=el('div',{class:'dc-stones','aria-hidden':'true'});
  const door=el('div',{class:'dc-door','aria-hidden':'true'},[el('i'),el('span',{text:'↗'}),el('small',{class:'dc-door-label',text:'出口'})]);
  const signal=document.createElementNS('http://www.w3.org/2000/svg','svg');signal.setAttribute('class','dc-signal');signal.setAttribute('aria-hidden','true');signal.setAttribute('preserveAspectRatio','none');
  const signalPath=document.createElementNS('http://www.w3.org/2000/svg','path');signal.append(signalPath);
  const ant=el('div',{class:'dc-ant','aria-hidden':'true'});ant.innerHTML=antArtwork;actor=createAntActor(ant);
  world.append(surfaces,signal,door,stones,ant,tileLayer);
  viewport.append(scenery,world);
  const badge=el('span',{class:'dc-badge'}),instruction=el('span',{class:'dc-instruction'}),readout=el('div',{class:'dc-readout','aria-live':'polite'},[badge,instruction]);
  const guideTextNode=el('span'),guideBox=el('div',{class:'dc-guide-box',hidden:'hidden','aria-live':'polite'},[guideTextNode,el('button',{type:'button',text:'×','aria-label':'关闭提示',onclick:()=>{guideActive=false;render();}})]);
  const pad=el('div',{class:'direction-pad dc-pad','aria-label':'方向控制'});
  for(const [dir,label,arrow]of [['up','向上','↑'],['left','向左','←'],['down','向下','↓'],['right','向右','→']])pad.append(el('button',{type:'button',text:arrow,'aria-label':label,'data-direction':dir,onclick:()=>step(dir)}));
  const carry=button('搬起',carryOrPlace,'dc-carry');
  const pushLeft=button('← 推倒',()=>push(-1),'dc-push'),pushRight=button('推倒 →',()=>push(1),'dc-push');
  const actions=el('div',{class:'dc-action-pad'},[carry,el('div',{class:'dc-push-row'},[pushLeft,pushRight])]);
  const undo=button('撤销',undoAction,'plain'),retry=button('回到摆放',retryAction,'plain');
  const restart=button('重开',()=>motion.confirmRestart(state.history.length>0||!!state.attempt,()=>loadLevel(state.level,'restart')),'plain');
  const status=el('p',{class:'dc-status','aria-live':'polite'});
  const next=button('下一关',()=>loadLevel((state.level+1)%levels.length,'next'));
  const celebration=el('section',{class:'dc-complete',hidden:'hidden'},[el('span',{text:'✓','aria-hidden':'true'}),el('h2',{text:'连锁完成！'}),next]);
  const legend=el('details',{class:'dc-legend'},[el('summary',{text:'骨牌图鉴'})]);
  const legendItems=el('div',{class:'dc-legend-items'});
  for(const [type,[name,description]]of Object.entries(types)){
    const sample=el('span',{class:`dc-mini-stone dc-${type}`,'aria-hidden':'true'});sample.innerHTML=dominoArtwork({type});
    legendItems.append(el('div',{class:'dc-legend-item'},[sample,el('div',{},[el('strong',{text:name}),el('p',{text:description})])]));
  }
  legend.append(legendItems);
  root.append(el('div',{class:'game-toolbar dc-toolbar'},[levelButton,el('div',{class:'dc-toolbar-right'},[progress,hint])]),viewport,readout,guideBox,
    el('div',{class:'dc-controls'},[pad,actions]),el('div',{class:'dc-tools'},[undo,retry,restart]),status,celebration,legend);
  const stageCamera=mountCamera(viewport,world,{focusPoint:playerFocusPoint,onSwipe:step});

  function save(){ctx.save(state);}
  function player(){return state.attempt?state.walker||state.position.player:state.position.player;}
  function playingPieces(){return frame?.pieces||result?.pieces||state.position.pieces;}
  function currentPiece(){return !state.attempt&&state.position.pieces.find(p=>at(p,state.position.player));}
  const viewTop=()=>level.ladders.length?0:3,viewRows=()=>level.height-viewTop();
  function stagePoint(p){return {x:(p.x+.5)*40,y:(p.y-viewTop()+.5)*40};}
  function playerFocusPoint(){const p=stagePoint(player());return {...p,y:p.y-18};}
  function placeNode(node,p){node.style.left=`${p.x/level.width*100}%`;node.style.top=`${(p.y-viewTop())/viewRows()*100}%`;}
  function buildWorld(){
    // A new stage has a different coordinate system. Snap its first frame;
    // only subsequent player/piece moves should interpolate from old positions.
    world.classList.add('dc-reset');
    world.style.setProperty('--dc-cols',level.width);world.style.setProperty('--dc-rows',viewRows());
    world.style.aspectRatio=`${level.width}/${viewRows()}`;
    const landscape=sceneryForLevel(level);
    viewport.dataset.scene=landscape.kind;
    viewport.dataset.evening=String(landscape.evening);
    scenery.innerHTML=landscape.artwork;
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
    for(const p of level.pieces){
      const face=el('span',{class:'dc-stone-face'});face.innerHTML=dominoArtwork({type:p.type});
      const node=el('div',{class:`dc-stone dc-${p.type}`,'data-stone-id':p.id},[face,el('small',{class:'dc-problem-label',hidden:'hidden'})]);
      if(p.type==='splitter')for(const side of ['left','right']){
        const half=el('span',{class:`dc-split-half dc-split-${side}`});half.innerHTML=dominoArtwork({width:6.5,half:true});node.append(half);
      }
      if(p.type==='trigger')node.append(el('small',{class:'dc-trigger-label',text:'机关'}));
      stoneNodes.set(p.id,node);stones.append(node);
    }
    const trigger=level.pieces.find(p=>p.type==='trigger'),sx=(trigger.x+.5)*100,sy=(trigger.y-viewTop()+.25)*100,ex=(level.exit.x+.5)*100,ey=(level.exit.y-viewTop()+.25)*100;
    signal.setAttribute('viewBox',`0 0 ${level.width*100} ${viewRows()*100}`);
    signalPath.setAttribute('d',`M${sx},${sy} C${sx},${sy-90} ${ex},${ey-90} ${ex},${ey}`);
    stageCamera.setStage(level.width,viewRows());
  }
  function settleStage(){world.scrollTop=world.scrollLeft=0;void world.offsetHeight;world.classList.remove('dc-reset');}
  function renderScene(){
    const p=player(),visible=playingPieces(),resting=restingDominoes(visible);
    // Stand in the gap beside the selected domino instead of drawing through it.
    // Keep the grid position as the interaction target so existing saves still fit.
    const held=state.attempt?null:state.position.carrying||(transfer?.kind==='place'?transfer.piece:null);
    const beside=!(walking&&moveKind==='climb')&&(held||state.position.pieces.some(q=>at(q,p)))
      ?[-facing,facing].find(dx=>hasFloor(level,p.x+dx,p.y,result?.bridges||[])):0;
    const visualX=Math.max(.16,Math.min(level.width-1.16,p.x+(beside||0)*.5));
    placeNode(ant,{x:visualX,y:p.y});
    actor.update({facing:beside?-beside:facing,held,move:walking?moveKind:'idle',exited:state.phase==='won'});
    for(const original of level.pieces){
      const stone=visible.find(q=>q.id===original.id),node=stoneNodes.get(original.id);
      node.hidden=!stone;if(!stone)continue;
      node.style.visibility=transfer?.kind==='place'&&transfer.piece.id===stone.id?'hidden':'';
      const stage=stone.state||'upright';
      node.className=`dc-stone dc-${stone.type} dc-${stage}`;
      node.classList.toggle('dc-selected',!state.attempt&&at(stone,p));
      const problem=!running&&state.phase==='failed'&&result?.problemIds?.includes(stone.id);
      node.classList.toggle('dc-problem',!!problem);
      node.classList.toggle('dc-guide-source',!!guide&&(guide.source?at(stone,guide.source):['push','walk-push'].includes(guide.kind)&&at(stone,guide.target)));
      node.dataset.edge=stone.x===0?'left':stone.x===level.width-1?'right':'';
      const pose=resting.get(stone.id);
      node.style.zIndex=pose.layer;
      if(pose.body){
        node.style.setProperty('--dc-rest-angle',`${pose.body.angle}deg`);
        node.style.setProperty('--dc-rest-lift',`${pose.body.lift}px`);
      }else{
        for(const [side,part]of [['left',pose.left],['right',pose.right]]){
          node.style.setProperty(`--dc-rest-${side}-angle`,`${part.angle}deg`);
          node.style.setProperty(`--dc-rest-${side}-lift`,`${part.lift}px`);
        }
      }
      const label=node.querySelector('.dc-problem-label');label.hidden=!problem;label.textContent=t(result?.reason==='tie'?(stone.type==='trigger'?'机关·同刻':'同刻'):'!');
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
      cell.classList.toggle('dc-guide-target',!!guide?.target&&at(q,guide.target));
      cell.disabled=acting||running||state.phase==='failed'||state.phase==='won';
    }
    door.classList.toggle('dc-door-open',!!result?.won&&!running);
    signal.classList.toggle('is-visible',!running&&(currentPiece()?.type==='trigger'||['exit','won'].includes(state.phase)||!!guide&&!!state.attempt));
    signal.classList.toggle('is-open',!!result?.won);
    world.dataset.phase=running?'running':state.phase;
    const active=visible.filter(s=>['falling','dropping','waiting'].includes(s.state));
    const target=running?(active.find(s=>s.state==='dropping')||active.find(s=>s.type==='trigger')||active.at(-1)):null;
    stageCamera.follow(target?stagePoint(target.state==='dropping'?{x:target.dropX,y:target.dropY}:target):playerFocusPoint());
  }
  function renderText(){
    const piece=currentPiece(),held=state.position.carrying;
    levelNumber.textContent=String(state.level+1).padStart(2,'0');levelName.textContent=t(level.name);
    progress.textContent=`${Object.keys(records).filter(k=>levels[Number(k)]&&Number.isSafeInteger(records[k])).length}/${levels.length}`;
    if(running){badge.textContent='↝';instruction.textContent=t('连锁进行中…');}
    else if(state.phase==='exit'){badge.textContent='↗';instruction.textContent=t('门开了，走进出口！');}
    else if(state.phase==='won'){badge.textContent='✓';instruction.textContent=t('连锁完成！');}
    else if(state.phase==='failed'){badge.textContent='!';instruction.textContent=t(failureSummary(result));}
    else {
      badge.textContent=held?types[held.type][2]||'▮':piece?types[piece.type][2]||'▮':'•';
      instruction.textContent=t(held?'搬着骨牌，走到空位后放下。':piece?types[piece.type][1]:'点地面走路；点骨牌，再搬起或推倒。');
    }
    badge.className=`dc-badge dc-${held?.type||piece?.type||'normal'}`;
    readout.classList.toggle('dc-readout-error',!running&&state.phase==='failed');
    guideBox.hidden=!guide;guideTextNode.textContent=guide?guideText(guide):'';
    hint.setAttribute('aria-pressed',String(guideActive));
    carry.classList.toggle('dc-guide-action',!!guide&&['take','take-buffer','place'].includes(guide.kind));
    retry.classList.toggle('dc-guide-action',guide?.kind==='retry');
    pushLeft.classList.toggle('dc-guide-action',guide?.kind==='push'&&guide.dir===-1);
    pushRight.classList.toggle('dc-guide-action',guide?.kind==='push'&&guide.dir===1);
    carry.textContent=t(held?'放下':'搬起');
    carry.disabled=acting||running||walking||!!state.attempt||(!held&&(!piece||piece.type==='trigger'));
    pushLeft.disabled=pushRight.disabled=acting||running||walking||!!state.attempt||!!held||!piece||piece.type==='splitter';
    const deltas={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},p=player(),reachable=neighbors(level,p,result?.bridges||[]);
    for(const cell of pad.children){const delta=deltas[cell.dataset.direction];cell.disabled=acting||running||state.phase==='failed'||state.phase==='won'||!reachable.some(q=>q.x===p.x+delta[0]&&q.y===p.y+delta[1]);}
    undo.disabled=!(state.history.length||state.attempt);retry.disabled=!state.attempt;hint.disabled=acting||running||walking||state.phase==='won';levelButton.disabled=acting||running;
    status.textContent=t(notice);status.classList.toggle('dc-error',state.phase==='failed');
    celebration.hidden=state.phase!=='won';
    next.textContent=t(state.level===levels.length-1?'再玩一轮':'下一关');
  }
  function guideText(step){
    const text=({retry:'先点“回到摆放”，保留安排后继续下一步提示。',exit:'开门牌已远程打开门。点标出的出口，蚂蚁走进去才过关。',
      'walk-take':'走到圈出的{piece}，再点“搬起”；闪亮格是要放的位置。',take:'点“搬起”，把这张{piece}搬到闪亮格。',
      'walk-buffer':'先把圈出的{piece}搬到闪亮空位，暂时腾出位置。','take-buffer':'点“搬起”，先把{piece}搬到闪亮空位暂存。',
      'walk-place':'搬着{piece}走到闪亮空位，再点“放下”。',place:'点“放下”，把{piece}放在这里。',
      'walk-push':'摆好了。走到圈出的起始牌，不需要把牌接到门口。',
      push:step.dir===1?'点“推倒 →”。开门牌最后倒下后会远程开门。':'点“← 推倒”。开门牌最后倒下后会远程开门。',
      unavailable:'请重开本关，再查看下一步提示。'})[step.kind];
    return t(text).replace('{piece}',t(types[step.type]?.[0]||''));
  }
  function render(){
    if(!alive)return;
    guide=!guideActive||running||state.phase==='won'?null:state.attempt?(state.phase==='exit'?{kind:'exit',target:level.exit}:{kind:'retry'}):nextGuide(level,state.position);
    renderScene();renderText();
  }
  function remember(){state.history.push(clone(state.position));if(state.history.length>100)state.history.shift();}
  function markWon(){
    if(state.phase!=='exit'||!at(state.walker,level.exit))return;
    state.phase='won';notice='';
    const moves=state.position.moves+state.postHistory.length;
    ctx.result?.('won',{moves});
    records[state.level]=Math.min(Number.isSafeInteger(records[state.level])?records[state.level]:Infinity,moves);
    ctx.write('domino:records',records);finish('domino');
  }
  function walkOne(to){
    if(running||['failed','won'].includes(state.phase))return false;
    const before=player();
    if(state.attempt){
      if(!neighbors(level,before,result.bridges).some(p=>at(p,to)))return false;
      state.postHistory.push(clone(before));if(state.postHistory.length>500)state.postHistory.shift();state.walker=clone(to);
    }else{
      const next=edit(level,state.position,{type:'walk',to});if(!next)return false;remember();state.position=next;
    }
    if(to.x!==before.x)facing=Math.sign(to.x-before.x);
    moveKind=to.y!==before.y?'climb':'walk';moveDuration=moveKind==='climb'?220:180;
    ant.style.setProperty('--dc-step-ms',`${moveDuration}ms`);
    stageCamera.resume();notice='';save();render();return true;
  }
  function walkTo(target){
    if(acting||running||['failed','won'].includes(state.phase))return;
    const path=pathTo(level,player(),target,result?.bridges||[]);if(!path){notice='这里走不到，可以找梯子绕行。';renderText();return;}
    if(walking){queuedWalk={target};return;}
    void runWalk(path);
  }
  const deltas={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  async function runWalk(path){
    const token=++walkToken;walking=true;
    while(path.length&&alive&&token===walkToken){
      if(!walkOne(path.shift()))break;
      await wait(motionEnabled()?moveDuration:0);
      if(!alive||token!==walkToken)return;
      if(state.phase==='exit'&&at(player(),level.exit)){walking=false;queuedWalk=null;moveKind='idle';await enterExit();return;}
      if(queuedWalk){
        const next=queuedWalk;queuedWalk=null;
        if(next.target)path=pathTo(level,player(),next.target,result?.bridges||[])||[];
        else {const p=player(),delta=deltas[next.direction];path=[{x:p.x+delta[0],y:p.y+delta[1]}];}
      }
    }
    if(alive&&token===walkToken){walking=false;moveKind='idle';render();}
  }
  function step(direction){
    if(acting||running||!deltas[direction]||['failed','won'].includes(state.phase))return;
    if(walking){queuedWalk={direction};return;}
    const delta=deltas[direction],p=player();void runWalk([{x:p.x+delta[0],y:p.y+delta[1]}]);
  }
  async function carryOrPlace(){
    if(acting||running||walking||state.attempt)return;
    const piece=state.position.carrying||currentPiece(),kind=state.position.carrying?'place':'take';
    const next=edit(level,state.position,{type:kind});
    if(!next){notice='这里不能放牌：需要空的地面，门口只允许消失牌。';renderText();return;}
    const from=stoneNodes.get(piece.id)?.querySelector('.dc-stone-face').getBoundingClientRect();
    const token=++actionToken;acting=true;transfer={kind,piece};remember();state.position=next;notice='';save();render();
    const complete=kind==='take'?await actor.take(from):await actor.place(stoneNodes.get(piece.id).querySelector('.dc-stone-face').getBoundingClientRect());
    if(!alive||token!==actionToken||!complete)return;
    acting=false;transfer=null;sound();render();
  }
  async function enterExit(){
    if(acting||state.phase!=='exit'||!at(player(),level.exit))return;
    const token=++actionToken;acting=true;moveKind='idle';render();
    if(!await actor.enter()||!alive||token!==actionToken)return;
    acting=false;markWon();save();render();
  }
  async function push(dir){
    const starter=currentPiece();
    if(!starter||starter.type==='splitter'||acting||running||walking||state.attempt||state.position.carrying)return;
    const simulation=simulate(level,state.position.pieces,starter.id,dir);if(!simulation.valid)return;
    stop();facing=dir;const token=++runToken;acting=true;render();
    if(!await actor.reach()||!alive||token!==runToken)return;
    acting=false;result=simulation;state.attempt={id:starter.id,dir};state.walker=clone(state.position.player);state.postHistory=[];
    state.phase=result.won?'exit':'failed';save();notice='';running=true;frame=result.trace[0];stageCamera.resume();render();sound();
    void actor.recoil();
    if(motionEnabled())for(let i=1;i<result.trace.length;i++){
      await wait((result.trace[i].time-result.trace[i-1].time)*200);
      if(!alive||token!==runToken)return;
      frame=result.trace[i];renderScene();
    }
    if(motionEnabled())await wait(200);
    if(!alive||token!==runToken)return;
    frame=null;running=false;
    if(!result.won)ctx.result?.('lost',{moves:state.position.moves});
    notice='';
    save();render();if(result.won)sound(true);
  }
  function retryAction(notify=true){
    if(!state.attempt)return;stop();
    const reset=()=>{state.attempt=null;state.walker=null;state.postHistory=[];state.phase='arrange';result=null;frame=null;notice='';save();render();};
    return notify?startGame(ctx,'restart',reset,{level:String(state.level+1)}):reset();
  }
  function undoAction(){
    if(state.attempt){
      if(!running&&state.postHistory.length){stop();state.walker=state.postHistory.pop();state.phase='exit';notice='';save();render();return;}
      retryAction(false);return;
    }
    if(state.history.length){stop();state.position=state.history.pop();notice='';save();render();}
  }
  function loadLevel(index,reason='select'){stop();return startGame(ctx,reason,()=>{state=fresh(index);level=levels[index];result=null;frame=null;notice='';guideActive=false;facing=1;buildWorld();save();render();settleStage();void motion.play(viewport,[{opacity:.25,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],280);},{level:String(index+1)});}
  function chooseLevel(){
    const modal=el('dialog',{class:'app-dialog dc-level-dialog','aria-label':'选择骨牌关卡'});
    const close=()=>modal.close();
    modal.append(el('div',{class:'dialog-header'},[el('h2',{text:'关卡'}),el('button',{class:'app-icon',type:'button',text:'×','aria-label':'关闭',onclick:close})]));
    chapters.forEach((chapter,chapterIndex)=>{
      const grid=el('div',{class:'dc-level-grid'});
      levels.forEach((item,index)=>{if(item.chapter!==chapterIndex)return;grid.append(el('button',{type:'button',class:`dc-level-option${index===state.level?' active':''}`,'aria-label':`${t(`第 ${index+1} 关`)} ${t(item.name)}`,onclick:()=>{
        close();motion.confirmRestart(state.phase!=='won'&&(state.history.length>0||!!state.attempt),()=>loadLevel(index));
      }},[el('span',{text:`${index+1}${Number.isSafeInteger(records[index])?' ✓':''}`}),el('small',{text:item.name}),...(chapterIndex?[el('small',{class:'dc-level-size',text:`${item.width}×${item.height}`})]:[])]));});
      modal.append(el('h3',{class:'dc-chapter-title'},[
        el('span',{text:chapter}),el('span',{class:'dc-chapter-scene',text:chapterSceneries[chapterIndex].label}),
      ]),grid);
    });
    dialogs.add(modal);modal.addEventListener('close',()=>{dialogs.delete(modal);modal.remove();},{once:true});document.body.append(modal);modal.showModal();
  }
  const shortcuts=e=>{
    if(document.querySelector('dialog[open]')||e.target.closest('input,select,textarea')||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key.toLowerCase()==='z'){e.preventDefault();undoAction();}
    if(e.code==='Space'&&e.target===document.body){e.preventDefault();carryOrPlace();}
  };
  window.addEventListener('keydown',shortcuts);
  const detach=keyboardAndSwipe(world,step,{swipe:false});
  if(state.attempt)result=simulate(level,state.position.pieces,state.attempt.id,state.attempt.dir);
  buildWorld();render();settleStage();
  if(state.phase==='exit'&&at(player(),level.exit))void enterExit();
  return()=>{alive=false;stop();detach();stageCamera.dispose();window.removeEventListener('keydown',shortcuts);for(const modal of dialogs)modal.close();dialogs.clear();motion.dispose();};
}

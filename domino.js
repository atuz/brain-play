import {tumblerDropMotion} from './domino-tumbler-motion.js';
import {dominoContactAngle,tumblerRollTransform,tumblerRestTransform,advanceContactMotion} from './domino-contact-motion.js?v=5';
import {dominoSessionOutcome,dominoSessionPieces,recordDominoCompletion} from './domino-outcome.js?v=4';
import {useManualPush,carriedDropTiming} from './domino-actions.js';
import {antFallTarget} from './domino-ant-gravity.js';
import {dominoTiming} from './domino-timing.js?v=11';
import {createAscenderNode,renderAscender} from './domino-ascender-view.js?v=14';
import {startGame} from './game-transition.js?v=48';
import {gameRuntime} from './game-runtime.js?v=48';
import {el,button,sound,finish,keyboardAndSwipe} from './shared.js?v=48';
import {createMotion,motionEnabled} from './motion.js?v=48';
import {t} from './i18n.js?v=65';
import {levels,chapters} from './domino-levels.js?v=72';
import {at,antAt,antPoint,antStepTarget,pushPieceAt,clone,hasFloor,antNeighbors as neighbors,antPathTo as pathTo,edit,initialPosition,simulate,createChain,validPosition,walkable,doorBlocked,entryCell,isLedgeDrop} from './domino-engine.js?v=168';
import {failureSummary,nextGuide} from './domino-guide.js?v=51';
import {mountCamera} from './domino-camera.js?v=51';
import {antArtwork,createAntActor} from './domino-actor.js?v=59';
import {sceneryForLevel,chapterSceneries} from './domino-scenery.js?v=53';
import {dominoArtwork} from './domino-material.js?v=53';
import {restingDominoes} from './domino-resting.js?v=52';

const types={
  normal:['普通牌','碰到下一张牌，继续连锁。',''],
  stopper:['阻挡牌','可以搬动，但不会倒下；它会挡住倒下的骨牌。','■'],
  tumbler:['翻滚牌','被碰倒后会一路翻滚，直到遇到障碍或倒下的骨牌。','▤'],
  delay:['延时牌','停顿一下，再向同一方向倒下。','⌛'],
  bridge:['搭桥牌','朝一格宽的断口倒下，搭好桥后消失，不会碰到对面的牌。','━'],
  vanish:['消失牌','倒下后消失。','═'],
  splitter:['分叉牌','必须被上方落下的骨牌击中，才会向左右分开。','↔'],
  exploder:['爆炸牌','被碰倒后爆炸，炸掉脚下的一格地面。','✹'],
  trigger:['开门牌','不能搬动；最后倒下时远程开门，和门不必相邻。','≡'],
  ascender:['上升牌','被碰倒后竖着升到上方平台底部，再以顶部为支点按推倒方向翻倒。','↑'],
};

function fresh(index=0){return {version:1,level:index,position:initialPosition(levels[index]),history:[],attempt:null,phase:'arrange',death:false,walker:null,postHistory:[],fallen:[],structures:{bridges:[],holes:[]},triggerDown:false,completion:null,pushUsed:false};}
export function restore(saved){
  try {
    if(saved?.version!==1||!Number.isInteger(saved.level)||!levels[saved.level])return fresh();
    const level=levels[saved.level];
    const context={resolvedPieces:[...(saved.completion?.pieces||[]),...(saved.fallen||[])],bridges:saved.structures?.bridges||[],holes:saved.structures?.holes||[]};
    if(!validPosition(level,saved.position,context)||!Array.isArray(saved.history)||saved.history.length>100||!saved.history.every(p=>validPosition(level,p,context)))return fresh(saved.level);
    if(!['arrange','failed','exit','won'].includes(saved.phase))return fresh(saved.level);
    if(!saved.attempt){
      if(!['arrange','exit'].includes(saved.phase))return fresh(saved.level);
      const restored=clone(saved);
      if(level.rules==='dos')restored.pushUsed=typeof saved.pushUsed==='boolean'?saved.pushUsed:!!saved.completion;
      // Old exit saves without a complete ordering proof must not reopen a
      // door merely because they previously stored phase='exit'.
      if(level.rules==='dos'&&restored.phase==='exit'&&!dominoSessionOutcome(level,restored).won)restored.phase='arrange';
      return restored;
    }
    if(saved.position.carrying||!saved.position.pieces.some(p=>p.id===saved.attempt.id&&
      (saved.position.player.side===1?pushPieceAt(saved.position.pieces,saved.position.player,saved.attempt.dir)?.id===p.id:at(p,saved.position.player))))return fresh(saved.level);
    const result=simulate(level,saved.position.pieces,saved.attempt.id,saved.attempt.dir,saved.structures||{},dominoTiming);
    const won=result.won;
    if(!result.valid||saved.phase==='arrange'||(saved.phase==='failed')===won)return fresh(saved.level);
    if(!Array.isArray(saved.postHistory)||saved.postHistory.length>500)return fresh(saved.level);
    if(won&&(!walkable(level,saved.walker||{},result.bridges,result.holes)||!pathTo(level,saved.position.player,saved.walker,result.bridges,result.holes)))return fresh(saved.level);
    if(!saved.postHistory.every(p=>walkable(level,p,result.bridges,result.holes)))return fresh(saved.level);
    if(saved.phase==='won'&&!antAt(saved.walker,level.exit))return fresh(saved.level);
    return clone(saved);
  } catch {return fresh();}
}

export const pageInfo=ctx=>{const i=ctx.load()?.level;return {level:String(Number.isInteger(i)&&i>=0&&i<levels.length?i+1:1)};};
export function mount(root,ctx){
  root.classList.add('play-domino');
  let state=restore(ctx.load()),level=levels[state.level],result=null,frame=null,running=false,walking=false,facing=state.facing===-1?-1:1;
  if(state.phase==='exit'&&!result)result={won:true,bridges:state.structures?.bridges||[],holes:state.structures?.holes||[],pieces:level.rules==='dos'?dominoSessionPieces(state):[]};
  let runToken=0,walkToken=0,alive=true,notice='',guideActive=false,guide=null,intro=false,liveChain=null,chainWalker=null;
  const bridgesNow=()=>liveChain?liveChain.bridges:frame?.bridges??result?.bridges??state.structures?.bridges??[];
  const holesNow=()=>liveChain?liveChain.holes:frame?.holes??result?.holes??state.structures?.holes??[];
  let actor,acting=false,transfer=null,actionToken=0,queuedWalk=null,moveKind='idle',moveDuration=180,ledgeFlight=false,gravityFall=null;
  const timers=new Set(),dialogs=new Set(),motion=createMotion(),stoneNodes=new Map();
  // Tumbler rolling: the block pivots 90 degrees at a time around its own
  // corners (right-bottom -> right-top -> left-top -> left-bottom) and keeps
  // going until the chain stops it against another domino.
  const rollViews=new Map(),frozenRolls=new Map();
  let rollRaf=0;
  function rollPose(rs,phase,node){
    return tumblerRollTransform({phase,dir:rs.dir,width:node?.offsetWidth||40,height:node?.offsetHeight||40});
  }
  function paintRoll(rs){
    if(!rs.face)return;
    rs.face.style.transformOrigin='0 0';
    rs.face.style.transition='none';
    rs.face.style.transform=rollPose(rs,rs.phase,rs.node);
  }
  function paintRest(rs){
    if(!rs.rest)return paintRoll(rs);
    const {stone,pose}=rs.rest;
    rs.face.style.transformOrigin='0 0';
    rs.face.style.transition='transform 140ms ease-out';
    rs.face.style.transform=tumblerRestTransform({phase:rs.to,baseDir:rs.dir,dir:stone.dir,
      cellOffset:stone.x-rs.startX,angle:pose.angle,lift:pose.lift,
      width:rs.node.offsetWidth||40,height:rs.node.offsetHeight||40});
  }
  function tickRoll(){
    rollRaf=0;
    const now=performance.now();
    for(const [id,rv] of [...rollViews]){
      const dt=now-(rv.last||now);rv.last=now;
      const complete=advanceContactMotion(rv,dt);
      paintRoll(rv);
      if(rv.freezing&&complete){paintRest(rv);frozenRolls.set(id,{...rv,frozen:true});rollViews.delete(id);}
    }
    if(rollViews.size)rollRaf=requestAnimationFrame(tickRoll);
  }
  function startRollLoop(){if(!rollRaf)rollRaf=requestAnimationFrame(tickRoll);}
  function clearRolls(){if(rollRaf){cancelAnimationFrame(rollRaf);rollRaf=0;}rollViews.clear();frozenRolls.clear();}
  let records=ctx.read('domino:records',{});
  if(!records||typeof records!=='object'||Array.isArray(records))records={};
  const wait=ms=>{const timer=gameRuntime.delay(ms);timers.add(timer);return timer.finished.finally(()=>timers.delete(timer));};
  function stop(){clearRolls();runToken++;walkToken++;actionToken++;walking=false;running=false;acting=false;intro=false;ledgeFlight=false;gravityFall=null;liveChain=null;chainWalker=null;transfer=null;queuedWalk=null;moveKind='idle';ant.style.transition='';actor?.cancel();for(const timer of timers)timer.cancel();timers.clear();}
  const levelNumber=el('span',{class:'dc-level-number'}),levelName=el('span',{class:'dc-level-name'}),progress=el('span',{class:'dc-progress',title:'已完成关卡'});
  const levelButton=el('button',{type:'button',class:'dc-level-button','aria-label':'选择骨牌关卡',onclick:chooseLevel},[levelNumber,levelName,el('span',{text:'⌄','aria-hidden':'true'})]);
  const hint=button('提示',()=>{guideActive=true;notice='';render();const target=guide?.source||guide?.target;if(target)stageCamera.show(stagePoint(target));},'plain');
  const viewport=el('div',{class:'dc-viewport'});
  const world=el('div',{class:'dc-world','aria-label':'骨牌棋盘'});
  const scenery=el('div',{class:'dc-scenery','aria-hidden':'true'}),surfaces=el('div',{class:'dc-surfaces','aria-hidden':'true'}),tileLayer=el('div',{class:'dc-tiles'}),stones=el('div',{class:'dc-stones','aria-hidden':'true'});
  const door=el('div',{class:'dc-door','aria-hidden':'true'},[el('i'),el('span',{text:'↗'}),el('small',{class:'dc-door-label',text:t('出口')})]);
  const entryDoor=el('div',{class:'dc-door dc-entry','aria-hidden':'true'},[el('i'),el('span',{text:'↘'}),el('small',{class:'dc-door-label',text:t('入口')})]);
  const signal=document.createElementNS('http://www.w3.org/2000/svg','svg');signal.setAttribute('class','dc-signal');signal.setAttribute('aria-hidden','true');signal.setAttribute('preserveAspectRatio','none');
  const signalPath=document.createElementNS('http://www.w3.org/2000/svg','path');signal.append(signalPath);
  const ant=el('div',{class:'dc-ant','aria-hidden':'true'});ant.innerHTML=antArtwork;actor=createAntActor(ant);
  world.append(surfaces,signal,entryDoor,door,stones,ant,tileLayer);
  viewport.append(scenery,world);
  const badge=el('span',{class:'dc-badge'}),instruction=el('span',{class:'dc-instruction'}),readout=el('div',{class:'dc-readout','aria-live':'polite'},[badge,instruction]);
  const guideTextNode=el('span'),guideBox=el('div',{class:'dc-guide-box',hidden:'hidden','aria-live':'polite'},[guideTextNode,el('button',{type:'button',text:'×','aria-label':'关闭提示',onclick:()=>{guideActive=false;render();}})]);
  const pad=el('div',{class:'direction-pad dc-pad','aria-label':'方向控制'});
  for(const [dir,label,arrow]of [['up','向上','↑'],['left','向左','←'],['down','向下','↓'],['right','向右','→']])pad.append(el('button',{type:'button',text:arrow,'aria-label':label,'data-direction':dir,onclick:()=>step(dir)}));
  const carry=button('搬起',carryOrPlace,'dc-carry');
  const pushLeft=button('← 推倒',()=>push(-1),'dc-push'),pushRight=button('推倒 →',()=>push(1),'dc-push');
  const actions=el('div',{class:'dc-action-pad'},[carry,el('div',{class:'dc-push-row'},[pushLeft,pushRight])]);
  const undo=button('撤销',undoAction,'plain'),retry=button('回到摆放',retryAction,'plain');
  const restart=button('重开',()=>motion.confirmRestart(state.history.length>0||!!state.attempt||!!state.chainBackup,()=>loadLevel(state.level,'restart')),'plain');
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

  function save(){state.facing=facing;ctx.save(state);}
  function player(){return liveChain?chainWalker:(state.attempt?state.walker||state.position.player:state.position.player);}
  function playingPieces(){return frame?.pieces||result?.pieces||state.position.pieces;}
  function currentPiece(){if(player().side===1)return null;if(liveChain){const p=player();return liveChain.stones.find(q=>q.x===p.x&&q.y===p.y&&q.state==='upright');}return !state.attempt&&state.position.pieces.find(p=>at(p,state.position.player));}
  function pushPiece(dir){return !state.attempt&&pushPieceAt(liveChain?liveChain.stones:state.position.pieces,player(),dir);}
  const viewTop=()=>Number.isInteger(level.viewTop)?level.viewTop:(level.ladders.length?0:3),viewRows=()=>level.height-viewTop();
  function stagePoint(p){return {x:(p.x+.5)*40,y:(p.y-viewTop()+.5)*40};}
  function playerFocusPoint(){const p=stagePoint(antPoint(player()));return {...p,y:p.y-18};}
  function placeNode(node,p){node.style.left=`${p.x/level.width*100}%`;node.style.top=`${(p.y-viewTop())/viewRows()*100}%`;}
  function placeDoorNode(node,p){node.style.left=`${p.x/level.width*100}%`;node.style.top=`${(p.y-.1-viewTop())/viewRows()*100}%`;}
  function renderSurfaces(){
    surfaces.replaceChildren();
    const holes=holesNow();
    const addPlatform=(y,a,b,bridge=false,raise=0)=>{
      if(b<a)return;
      const pct=`${(y-viewTop()+.9)/viewRows()*100}%`;
      const top=raise?`calc(${pct} - ${raise}px)`:pct;
      surfaces.append(el('div',{class:`dc-platform${bridge?' dc-bridge-floor':''}`,style:`left:${a/level.width*100}%;top:${top};width:${(b-a+1)/level.width*100}%`}));
    };
    for(const [y,from,to,raise]of level.platforms){
      let start=from;
      for(const hx of holes.filter(h=>h.y===y).map(h=>h.x).sort((a,b)=>a-b)){
        if(hx<from||hx>to)continue;
        addPlatform(y,start,hx-1,false,raise);start=hx+1;
      }
      addPlatform(y,start,to,false,raise);
    }
    for(const l of level.ladders)surfaces.append(el('div',{class:'dc-ladder',style:`left:${(l.x+.36)/level.width*100}%;top:${(l.from-viewTop()+.7)/viewRows()*100}%;height:${(l.to-l.from+.2)/viewRows()*100}%`}));
    // Half-row stair treads get a riser down to the next tread so the flight
    // reads as one connected staircase instead of floating strips.
    const treadAt=(x,y)=>level.platforms.some(([py,a,b])=>py===y&&x>=a&&x<=b)&&!holes.some(h=>h.x===x&&h.y===y);
    for(const [y,a,b]of level.platforms){
      for(let x=a;x<=b;x++)for(const dx of [-1,1]){
        if(!treadAt(x+dx,y+.5))continue;
        const top=(y-viewTop()+.9)/viewRows()*100,boundary=dx>0?x+1:x;
        surfaces.append(el('div',{class:'dc-riser',style:`left:calc(${boundary/level.width*100}% - 2px);top:calc(${top}% + 17px);height:calc(100% / var(--dc-rows) * .5 - 17px)`}));
      }
    }
    for(const bridge of bridgesNow())addPlatform(bridge.y,bridge.x,bridge.x,true);
  }
  function entryPoint(){
    if(level.entry&&Number.isInteger(level.entry.x))return {x:level.entry.x,y:level.player.y};
    const p=level.player;
    return [{x:p.x-1,y:p.y},{x:p.x+1,y:p.y}].find(q=>hasFloor(level,q.x,q.y))||{x:p.x,y:p.y};
  }
  function entryStart(){const e=entryPoint();return {x:e.x,y:e.y-.55};}
  async function playIntro(){
    if(!alive||state.phase!=='arrange'||state.death)return;
    // Only play the entrance walk on a fresh level; a restored save keeps the
    // ant where the player left it.
    if((state.position.moves||0)>0)return;
    const from=entryStart(),to=state.position.player;
    if(at(from,to))return;
    intro=true;acting=true;
    entryDoor.classList.add('dc-door-open');
    ant.style.transition='none';placeNode(ant,from);
    renderText();
    await wait(40);
    if(!alive)return;
    ant.style.transition='left 460ms ease, top 460ms ease';
    placeNode(ant,to);
    await wait(500);
    if(!alive)return;
    ant.style.transition='';intro=false;acting=false;
    entryDoor.classList.remove('dc-door-open');
    render();
    await settleSpawnFall();
  }
  // The doorway can sit above the next platform. Once the ant steps out of
  // the door it falls, exactly like it does when walking off a ledge.
  async function settleSpawnFall(){
    if(!alive||state.death||state.phase!=='arrange'||state.attempt||liveChain)return;
    const plan=antFallTarget(level,state.position.player,{bridges:bridgesNow(),holes:holesNow()});
    if(!plan)return;
    if(plan.fatal){die();return;}
    const token=++walkToken;
    walking=true;acting=true;moveKind='falling';gravityFall=plan;
    const duration=Math.min(800,Math.max(200,plan.rows*dominoTiming.beat));
    actor.update({facing,held:state.position.carrying,move:'falling'});
    ant.style.transition=`top ${duration}ms cubic-bezier(.3,0,.8,1)`;
    placeNode(ant,plan.to);
    await wait(duration);
    if(!alive||token!==walkToken)return;
    ant.style.transition='';walking=false;acting=false;moveKind='idle';gravityFall=null;
    state.position={...state.position,player:clone(plan.to)};
    notice='';save();render();
  }
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
    surfaces.replaceChildren();tileLayer.replaceChildren();stones.replaceChildren();stoneNodes.clear();ant.dataset.dead='false';
    renderSurfaces();
    for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++){
      if(!hasFloor(level,x,y)&&!level.ladders.some(l=>l.x===x&&y>=l.from&&y<=l.to))continue;
      const cell=el('button',{type:'button',class:'dc-cell','data-x':x,'data-y':y,onclick:()=>walkTo({x,y})});placeNode(cell,{x,y});tileLayer.append(cell);
    }
    placeDoorNode(door,level.exit);placeDoorNode(entryDoor,entryPoint());
    for(const p of level.pieces){
      if(p.type==='ascender'){
        const node=createAscenderNode(p);stoneNodes.set(p.id,node);stones.append(node);continue;
      }
      const face=el('span',{class:'dc-stone-face'});
      face.innerHTML=`<span class="dc-art">${dominoArtwork({type:p.type})}</span>`;
      const node=el('div',{class:`dc-stone dc-${p.type}`,'data-stone-id':p.id},[face,el('small',{class:'dc-problem-label',hidden:'hidden'})]);
      if(p.type==='splitter')for(const side of ['left','right']){
        const half=el('span',{class:`dc-split-half dc-split-${side}`});half.innerHTML=dominoArtwork({width:6.5,half:true});node.append(half);
      }
      if(p.type==='splitter')node.append(el('span',{class:'dc-impact-flash','aria-hidden':'true'}));
      if(p.type==='exploder')node.append(el('span',{class:'dc-explosion','aria-hidden':'true'}));
      if(p.type==='trigger')node.append(el('small',{class:'dc-trigger-label',text:'机关'}));
      stoneNodes.set(p.id,node);stones.append(node);
    }
    // Stair treads that sit on half rows need their own click targets.
    for(const [y,from,to]of level.platforms){
      if(Number.isInteger(y))continue;
      for(let x=from;x<=to;x++){
        if(!hasFloor(level,x,y))continue;
        const cell=el('button',{type:'button',class:'dc-cell','data-x':x,'data-y':y,onclick:()=>walkTo({x,y})});placeNode(cell,{x,y});tileLayer.append(cell);
      }
    }
    const trigger=level.pieces.find(p=>p.type==='trigger'),sx=(trigger.x+.5)*100,sy=(trigger.y-viewTop()+.25)*100,ex=(level.exit.x+.5)*100,ey=(level.exit.y-viewTop()+.25)*100;
    signal.setAttribute('viewBox',`0 0 ${level.width*100} ${viewRows()*100}`);
    signalPath.setAttribute('d',`M${sx},${sy} C${sx},${sy-90} ${ex},${ey-90} ${ex},${ey}`);
    stageCamera.setStage(level.width,viewRows());
  }
  function settleStage(){world.scrollTop=world.scrollLeft=0;void world.offsetHeight;world.classList.remove('dc-reset');}
  function renderScene(){
    const p=player(),upright=playingPieces(),fallen=state.fallen||[];
    const finishes=new Map((state.completion?.pieces||[]).map(q=>[q.id,q.finish]));
    const visible=[...upright,...fallen.filter(f=>!upright.some(q=>q.id===f.id))]
      .map(q=>q.finish==null&&finishes.has(q.id)?{...q,finish:finishes.get(q.id)}:q);
    const resting=restingDominoes(visible);
    const held=state.attempt?null:state.position.carrying||(transfer?.kind==='place'?transfer.piece:null);
    if(!ledgeFlight){
      if(!intro)placeNode(ant,antPoint(p));
      ant.dataset.stance=p.side===1?'side':'front';
      actor.update({facing,held,move:walking?moveKind:'idle',exited:state.phase==='won'});
    }
    for(const original of level.pieces){
      const stone=visible.find(q=>q.id===original.id),node=stoneNodes.get(original.id);
      node.hidden=!stone;if(!stone)continue;
      const transferring=transfer?.kind==='place'&&transfer.piece.id===stone.id;
      node.style.visibility=transferring?'hidden':'';
      node.style.transition=transferring?'none':'';
      node.style.opacity=transferring?'0':'';
      // A tile that leaves the board keeps a playing node and drops towards
      // the row below the level, so the motion matches a normal fall.
      const stage=stone.fallOut?'dropping':stone.state||'upright';
      if(stone.type==='ascender'){
        const problem=!running&&state.phase==='failed'&&result?.problemIds?.includes(stone.id);
        const placement=renderAscender(node,stone,{level,timing:dominoTiming,
          selected:!state.attempt&&p.side!==1&&at(stone,p),
          guideSource:!!guide&&(guide.source?at(stone,guide.source):['push','walk-push'].includes(guide.kind)&&at(stone,guide.target)),
          problem,problemText:t(result?.reason==='tie'?'同刻':'!'),place:p=>placeNode(node,p),
        });
        placeNode(node,placement||stone);continue;
      }
      const faceNode=node.querySelector('.dc-stone-face');
      node.style.setProperty('--dc-contact-angle',`${dominoContactAngle}deg`);
      node.style.setProperty('--dc-return-duration',`${stone.returnDuration??dominoTiming.quarter}ms`);
      const contactMs=['normal','delay','trigger'].includes(stone.type)?dominoTiming.contact:dominoTiming.beat;
      if(stone.type==='delay'){
        node.style.setProperty('--dc-delay-fall-duration',`${dominoTiming.contact}ms`);
      }
      if(stone.type==='normal'||stone.type==='delay'){
        node.style.setProperty('--dc-contact-duration',`${contactMs}ms`);
        node.style.setProperty('--dc-quarter-duration',`${dominoTiming.quarter}ms`);
        // A short stair drop must finish its airborne half-turn before landing.
        const flightMs=Math.max(1,(stone.dropY??stone.y)-stone.y)*contactMs;
        node.style.setProperty('--dc-drop-duration',`${Math.min(320*contactMs/dominoTiming.beat,flightMs)}ms`);
      }
      const prevStage=node.dataset.stage||'upright';
      if(stone.type==='normal'||stone.type==='delay'){
        // Preserve the actual half-turn from the airborne flip across all
        // landing/rebound poses; switching pivots must not reset the artwork.
        if(stage==='upright')node.dataset.normalInverted='false';
        else if(stone.normalInverted!==undefined)node.dataset.normalInverted=String(stone.normalInverted);
        else if(stage==='landing'&&prevStage==='dropping')node.dataset.normalInverted=String(node.dataset.normalInverted!=='true');
        if(stage==='returning'&&prevStage!==stage){
          // Capture the displayed landing angle before removing its keyframe.
          const pose=getComputedStyle(faceNode).transform;
          faceNode.style.setProperty('--dc-normal-return-from',pose==='none'?'rotate(0deg)':pose);
        }
        if((stage==='dropping'&&prevStage!=='dropping')||(prevStage==='landing'&&stage==='flat')){
          // Continue from the painted contact pose, including a landing on a
          // stair. Never restart a partly tipped tile at zero degrees.
          const pose=getComputedStyle(faceNode).transform;
          const values=pose.startsWith('matrix(')?pose.slice(7,-1).split(',').map(Number):null;
          const angle=values?Math.atan2(values[1],values[0])*180/Math.PI:0;
          faceNode.style.setProperty('--dc-drop-from',`${angle}deg`);
          if(prevStage==='landing'&&stage==='flat')faceNode.style.setProperty('--dc-normal-contact-pose',pose==='none'?'rotate(0deg)':pose);
        }
        if(prevStage==='landing'&&stage==='flat')node.dataset.landed='1';
        else if(stage!=='flat'&&stage!=='landing')delete node.dataset.landed;
        delete node.dataset.inverted;
      }else{
        if((stage==='dropping'||stage==='returning')&&prevStage!==stage){
          // Preserve the displayed pose when a landing animation is interrupted
          // by a drop or rebound. Resetting its class first loses that angle.
          const transform=getComputedStyle(faceNode).transform;
          if(stage==='returning')faceNode.style.setProperty('--dc-return-from',transform==='none'?'rotate(0deg)':transform);
          else{
            const values=transform.startsWith('matrix(')?transform.slice(7,-1).split(',').map(Number):null;
            const angle=values?Math.atan2(values[1],values[0])*180/Math.PI:0;
            faceNode.style.setProperty('--dc-drop-from',`${angle}deg`);
            if(stone.type==='tumbler'){
              const rollingAngle=faceNode.style.transform.match(/rotate\(([-\d.e+]+)rad\)/);
              const continuousAngle=rollingAngle?Number(rollingAngle[1])*180/Math.PI:angle;
              const root=getComputedStyle(node),face=getComputedStyle(faceNode);
              const motion=tumblerDropMotion({matrix:values||[1,0,0,1,0,0],angle:continuousAngle,dir:stone.dir||1,
                width:parseFloat(face.width),height:parseFloat(face.height),
                dx:parseFloat(root.left)-stone.x*node.offsetWidth,
                dy:parseFloat(root.top)-(stone.y-viewTop())*node.offsetHeight});
              faceNode.style.setProperty('--dc-tumbler-drop-from',motion.from);
              faceNode.style.setProperty('--dc-tumbler-drop-to',motion.to);
              node.dataset.tumblerDropInverted=String(motion.inverted);
            }
          }
        }
        node.dataset.inverted=String(!!stone.inverted);
        node.style.setProperty('--dc-landing-angle',`${stone.landingAngle??90}deg`);
        node.style.setProperty('--dc-landing-duration',`${stone.landingTravel||400}ms`);
      }
      if(stone.type==='tumbler'){
        if(stage==='upright')node.dataset.tumblerInverted='false';
        else if(prevStage==='dropping'&&stage==='rolling'&&node.dataset.tumblerDropInverted==='true'){
          node.dataset.tumblerInverted=String(node.dataset.tumblerInverted!=='true');
        }
      }
      node.dataset.stage=stage;
      node.className=`dc-stone dc-${stone.type} dc-${stage}${stone.carriedDrop?' dc-carried-drop':''}${stone.crashPile?' dc-rubble-pile':''}${stone.crashCovered?' dc-rubble-covered':''}`;
      if(stone.crashPile&&!node.querySelector('.dc-rubble'))node.append(el('span',{class:'dc-rubble','aria-hidden':'true'},[el('i'),el('i'),el('i'),el('i')]));

      const rolling=stone.type==='tumbler'&&stone.state==='rolling';
      const pose=resting.get(stone.id);
      let rollView=rollViews.get(stone.id);
      if(rollView&&rollView.startY!==stone.y){
        rollViews.delete(stone.id);rollView=null;
      }
      if(rolling){
        if(!rollView){
          rollView={startX:stone.rollOriginX,startY:stone.rollOriginY,dir:stone.rollBaseDir,node,face:faceNode};
          rollViews.set(stone.id,rollView);frozenRolls.delete(stone.id);
        }
        rollView.node=node;rollView.face=faceNode;
        if(rollView.serial!==stone.rollSerial){
          Object.assign(rollView,{serial:stone.rollSerial,from:stone.rollFrom,to:stone.rollTo,
            phase:stone.rollFrom,elapsed:0,duration:stone.rollDuration,via:stone.rollVia,
            returnDuration:stone.rollReturnDuration,last:performance.now()});
        }
        rollView.freezing=false;
        startRollLoop();
      }else if(stone.state==='dropping'){
        if(rollView)rollViews.delete(stone.id);
        frozenRolls.delete(stone.id);
      }else if(rollView&&!rollView.freezing){
        rollView.freezing=true;rollView.node=node;rollView.face=faceNode;rollView.last=performance.now();
        startRollLoop();
      }
      if(stage==='flat'&&stone.type==='tumbler'&&!rollView&&!frozenRolls.has(stone.id)&&Number.isFinite(stone.rollPhase)){
        frozenRolls.set(stone.id,{node,face:faceNode,startX:stone.rollOriginX,startY:stone.rollOriginY,
          dir:stone.rollBaseDir,phase:stone.rollPhase,to:stone.rollPhase,frozen:true});
      }
      const frozen=rolling?null:frozenRolls.get(stone.id);
      if(stage==='flat'){
        const view=frozen||rollView;
        if(view)view.rest={stone:{...stone},pose:pose.body};
      }
      if(rolling||frozen||rollView?.freezing){
        if(frozen)paintRest(frozen);else paintRoll(rollView);
      }else if(stone.type==='tumbler'){
        faceNode.style.transform='';faceNode.style.transformOrigin='';faceNode.style.transition='';
      }
      const impact=frame?.impacts?.find(event=>event.targetId===stone.id&&event.kind==='splitter-hit');
      node.classList.toggle('dc-split-hit',!!impact);
      const effects=frame?.effects||[];
      node.classList.toggle('dc-stopper-hit',effects.some(event=>event.kind==='rebound'&&event.targetId===stone.id));
      node.classList.toggle('dc-rebounded',effects.some(event=>event.kind==='rebound'&&event.sourceId===stone.id));
      node.classList.toggle('dc-exploding',effects.some(event=>event.kind==='explode'&&event.sourceId===stone.id));
      node.classList.toggle('dc-selected',!state.attempt&&p.side!==1&&at(stone,p));
      const problem=!running&&state.phase==='failed'&&result?.problemIds?.includes(stone.id);
      node.classList.toggle('dc-problem',!!problem);
      node.classList.toggle('dc-guide-source',!!guide&&(guide.source?at(stone,guide.source):['push','walk-push'].includes(guide.kind)&&at(stone,guide.target)));
      node.dataset.edge=stone.x===0?'left':stone.x===level.width-1?'right':'';
      node.style.zIndex=stage==='impact'?9:impact?10:pose.layer;
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
      node.style.setProperty('--dc-travel',stage==='dropping'?`${Math.max(1,stone.dropY-stone.y)*contactMs}ms`:stage==='ascending'?'180ms':'150ms');
      if(stage==='dropping'&&!transferring){
        const rows=Math.max(1,stone.dropY-stone.y);
        node.style.transition=rows>1?`left ${contactMs}ms ease, top ${(rows-1)*contactMs}ms ease ${contactMs}ms`:`left ${contactMs}ms ease, top ${contactMs}ms ease`;
      }
      const heldView=rollViews.get(stone.id)||frozenRolls.get(stone.id);
      let placeAt=stage==='dropping'?{x:stone.dropX,y:stone.dropY}:heldView?{x:heldView.startX,y:heldView.startY}:stone;
      if(stage==='dropping'&&stone.carriedDrop){
        if(!node.dataset.releaseCommit){
          node.dataset.releaseCommit='1';node.style.transition='none';placeNode(node,stone);void node.offsetHeight;
        }
        const {brickMs}=carriedDropTiming(stone.dropY-stone.y,dominoTiming);
        node.style.transition=`top ${brickMs}ms linear`;
      }else if(stage==='dropping'&&stone.type==='tumbler'&&!node.dataset.dropCommit){
        // Re-anchor the rolling body, finish the half-turn for one beat,
        // then move vertically. Commit now, rather than waiting for a tick.
        node.dataset.dropCommit='1';
        node.style.transition='none';
        placeNode(node,{x:stone.x,y:stone.y});
        void node.offsetHeight;
        const beats=Math.max(2,stone.dropY-stone.y);
        node.style.transition=`left 200ms linear, top ${(beats-1)*200}ms linear 200ms`;
      }else if(stage==='dropping'&&stone.type==='tumbler'){
        const beats=Math.max(2,stone.dropY-stone.y);
        node.style.transition=`left 200ms linear, top ${(beats-1)*200}ms linear 200ms`;
      }else if(stage!=='dropping'&&node.dataset.dropCommit){
        delete node.dataset.dropCommit;
      }
      if(stage!=='dropping')delete node.dataset.releaseCommit;
      placeNode(node,placeAt);
    }
    renderSurfaces();
    for(const bridge of bridgesNow()){
      if(!tileLayer.querySelector(`[data-x="${bridge.x}"][data-y="${bridge.y}"]`)){
        const cell=el('button',{type:'button',class:'dc-cell dc-bridge-cell','data-x':bridge.x,'data-y':bridge.y,onclick:()=>walkTo(bridge)});placeNode(cell,bridge);tileLayer.append(cell);
      }
    }
    for(const cell of tileLayer.children){
      const q={x:Number(cell.dataset.x),y:Number(cell.dataset.y),...(cell.dataset.side==='1'?{side:1}:{})},stone=q.side?null:visible.find(s=>at(s,q)&&s.state!=='vanished');
      const word=antAt(q,p)?'蚂蚁':q.side?'旁边':at(q,level.exit)?'出口':stone?types[stone.type][0]:hasFloor(level,q.x,q.y,bridgesNow(),holesNow())?'地面':'梯子';
      cell.setAttribute('aria-label',t(`第${q.y+1}行第${q.x+1+(q.side?.5:0)}列，${t(word)}`));
      cell.classList.toggle('dc-guide-target',!!guide?.target&&antAt(q,guide.target));
      cell.disabled=acting||!!gravityFall||(running&&level.rules!=='dos')||state.phase==='failed'||state.phase==='won';
    }
    door.classList.toggle('dc-door-open',!!result?.won&&!running);
    signal.classList.toggle('is-visible',!running&&(currentPiece()?.type==='trigger'||['exit','won'].includes(state.phase)||!!guide&&!!state.attempt));
    signal.classList.toggle('is-open',!!result?.won);
    world.dataset.phase=running?'running':state.phase;
    const active=visible.filter(s=>['falling','dropping','waiting','rolling','ascending'].includes(s.state));
    const target=running?(active.find(s=>['dropping','rolling','ascending'].includes(s.state))||active.find(s=>s.type==='trigger')||active.at(-1)):null;
    stageCamera.follow(target?stagePoint(target.state==='dropping'?{x:target.dropX,y:target.dropY}:target):playerFocusPoint());
  }
  function renderText(){
    const piece=currentPiece(),held=state.position.carrying;
    levelNumber.textContent=String(state.level+1).padStart(2,'0');levelName.textContent=t(level.name);
    progress.textContent=`${Object.keys(records).filter(k=>levels[Number(k)]&&Number.isSafeInteger(records[k])).length}/${levels.length}`;
    if(running){badge.textContent='↝';instruction.textContent=t(level.rules==='dos'&&!state.pushUsed?'连锁进行中…可以继续走或推。':'连锁进行中…');}
    else if(state.phase==='exit'){badge.textContent='↗';instruction.textContent=t('门开了，走进出口！');}
    else if(state.phase==='won'){badge.textContent='✓';instruction.textContent=t('连锁完成！');}
    else if(state.death){badge.textContent='☠';instruction.textContent=t('蚂蚁摔死了：落差太大，点“重开”重试。');}
    else if(state.phase==='failed'){badge.textContent='!';instruction.textContent=t(failureSummary(result));}
    else {
      badge.textContent=held?types[held.type][2]||'▮':piece?types[piece.type][2]||'▮':'•';
      instruction.textContent=t(held?'搬着骨牌，走到空位后放下。':piece?types[piece.type][1]:player().side===1?'间隙中，← → 只转身；↓ 回到正前方。':'左右走到正前方搬起；↑ 到旁边推倒，↓ 返回。');
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
    carry.disabled=acting||!!gravityFall||(running&&level.rules!=='dos')||walking||!!state.attempt||state.phase==='failed'||state.phase==='won'||player().side===1||(!held&&(!piece||piece.type==='trigger'));
    carry.title=player().side===1?t('到骨牌正前方才能搬起或放下。'):'';
    for(const [node,dir]of [[pushLeft,-1],[pushRight,1]]){
      const target=pushPiece(dir);
      node.disabled=acting||!!gravityFall||(running&&level.rules!=='dos')||walking||!!state.attempt||state.phase==='failed'||state.phase==='won'||!!held||!target||['splitter','stopper'].includes(target.type)||(level.rules==='dos'&&state.pushUsed);
      node.title=level.rules==='dos'&&state.pushUsed?t('本关只能手推一次，仍可抱牌跳下启动连锁。'):player().side!==1?t('站到骨牌旁边才能推倒。'):'';
    }
    for(const cell of pad.children){
      const ok=player().side===1&&['left','right'].includes(cell.dataset.direction)||!!stepTarget(cell.dataset.direction);
      cell.disabled=acting||!!gravityFall||(running&&level.rules!=='dos')||state.phase==='failed'||state.phase==='won'||!ok;
    }
    undo.disabled=!(state.history.length||state.attempt||state.chainBackup);retry.disabled=!state.attempt&&!state.chainBackup;hint.disabled=acting||running||walking||state.phase==='won';levelButton.disabled=acting||running;
    status.textContent=t(notice);status.classList.toggle('dc-error',state.phase==='failed');
    celebration.hidden=state.phase!=='won';
    next.textContent=t(state.level===levels.length-1?'再玩一轮':'下一关');
  }
  function guideText(step){
    const text=({retry:'先点“回到摆放”，保留安排后继续下一步提示。',exit:'开门牌已远程打开门。点标出的出口，蚂蚁走进去才过关。',
      'walk-take':'走到圈出的{piece}，再点“搬起”；闪亮格是要放的位置。',take:'点“搬起”，把这张{piece}搬到闪亮格。',
      'walk-buffer':'先把圈出的{piece}搬到闪亮空位，暂时腾出位置。','take-buffer':'点“搬起”，先把{piece}搬到闪亮空位暂存。',
      'walk-place':'搬着{piece}走到闪亮空位，再点“放下”。',place:'点“放下”，把{piece}放在这里。',
      'walk-push':'摆好了。走到起始牌旁边，再推倒。',
      push:step.dir===1?'点“推倒 →”。开门牌最后倒下后会远程开门。':'点“← 推倒”。开门牌最后倒下后会远程开门。',
      unavailable:'请重开本关，再查看下一步提示。',
      text:step.text||''})[step.kind];
    return t(text).replace('{piece}',t(types[step.type]?.[0]||''));
  }
  function render(){
    if(!alive)return;
    if(!guideActive||running||state.phase==='won')guide=null;
    else if(state.attempt)guide=state.phase==='exit'?{kind:'exit',target:level.exit}:{kind:'retry'};
    else {
      const next=nextGuide(level,state.position);
      // The 101 original levels have no recorded step plan; show their written solution instead.
      guide=next.kind==='unavailable'&&level.hint?{kind:'text',text:level.hint}:next;
    }
    renderScene();renderText();
  }
  function remember(){state.history.push(clone(state.position));if(state.history.length>100)state.history.shift();}
  function markWon(){
    if(state.phase!=='exit'||!antAt(player(),level.exit)||!exitReady())return;
    state.phase='won';notice='';
    const moves=state.position.moves+state.postHistory.length;
    ctx.result?.('won',{moves});
    records[state.level]=Math.min(Number.isSafeInteger(records[state.level])?records[state.level]:Infinity,moves);
    ctx.write('domino:records',records);finish('domino');
  }
  function walkOne(to,{landed=false,released=false}={}){
    if(['failed','won'].includes(state.phase)&&!(released&&state.phase==='failed'&&!state.death))return false;
    if(running&&level.rules!=='dos')return false;
    const before=player();
    if(!neighbors(level,before,bridgesNow(),holesNow()).some(q=>antAt(q,to)))return false;
    if(liveChain){
      const fall=to.y-before.y;
      if(!neighbors(level,before,liveChain.bridges,liveChain.holes).some(p=>antAt(p,to)))return false;
      chainWalker=clone(to);
      if(fall>3){liveChain=null;running=false;chainWalker=null;die();return true;}
    } else if(state.attempt){
      if(!neighbors(level,before,result.bridges,result.holes).some(p=>antAt(p,to)))return false;
      state.postHistory.push(clone(before));if(state.postHistory.length>500)state.postHistory.shift();state.walker=clone(to);
    }else{
      const fall=to.y-state.position.player.y;
      let next=edit(level,state.position,{type:'ant-walk',to});
      if(!next&&level.rules==='dos'&&neighbors(level,state.position.player,bridgesNow(),holesNow()).some(p=>antAt(p,to))){
        next=clone(state.position);next.player=clone(to);next.moves++;
      }
      if(!next)return false;remember();state.position=next;
      if(fall>3){die();return true;}
    }
    if((to.side===1)===(before.side===1)&&antPoint(to).x!==antPoint(before).x)facing=Math.sign(antPoint(to).x-antPoint(before).x);
    // The flight has already reached the lower floor. Commit the logical
    // step without starting a second vertical (ladder) animation.
    moveKind=landed?'idle':to.y!==before.y?'climb':'walk';moveDuration=landed?0:moveKind==='climb'?220:180*Math.abs(antPoint(to).x-antPoint(before).x);
    ant.style.setProperty('--dc-step-ms',`${moveDuration}ms`);
    stageCamera.resume();notice='';save();render();return true;
  }
  function walkTo(target){
    if(acting||gravityFall||(running&&level.rules!=='dos')||['failed','won'].includes(state.phase))return;
    const path=pathTo(level,player(),target,bridgesNow(),holesNow());if(!path){notice='这里走不到，可以找梯子绕行。';renderText();return;}
    if(walking){queuedWalk={target};return;}
    void runWalk(path);
  }
  const deltas={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  async function runWalk(path){
    const token=++walkToken;walking=true;
    while(path.length&&alive&&token===walkToken){
      const to=path[0],before=player(),drop=to.y-before.y;
      const releasing=level.rules==='dos'&&!!state.position.carrying&&isLedgeDrop(level,before,to);
      if(releasing&&!neighbors(level,before,bridgesNow(),holesNow()).some(p=>antAt(p,to)))break;
      const animatedDrop=(drop>1||releasing)&&motionEnabled();
      if(animatedDrop){
        // Chain ticks still render the dominoes, but the flight owns the
        // ant's position and complete pose until the landing is committed.
        ledgeFlight=true;
        if(antPoint(to).x!==antPoint(before).x)facing=Math.sign(antPoint(to).x-antPoint(before).x);
        actor.update({facing,held:state.position.carrying,move:'scared'});
        ant.style.transition='left 140ms ease';
        placeNode(ant,{x:to.x,y:before.y});
        await wait(250);
        if(!alive||token!==walkToken)return;
      }
      if(releasing){
        if(!releaseCarriedBrick(before,to))break;
        if(animatedDrop){
          actor.update({facing,held:null,move:'scared'});
          await wait(carriedDropTiming(drop,dominoTiming).antLeadMs);
          if(!alive||token!==walkToken)return;
        }
      }
      if(animatedDrop){
        const antMs=releasing?carriedDropTiming(drop,dominoTiming).antMs:280;
        ant.style.transition=`top ${antMs}ms cubic-bezier(.3,0,.8,1)`;
        placeNode(ant,to);
        ant.dataset.move='falling';
        await wait(antMs+20);
        if(!alive||token!==walkToken)return;
        ant.style.transition='';
      }
      ledgeFlight=false;
      if(!walkOne(path.shift(),{landed:animatedDrop,released:releasing}))break;
      await wait(motionEnabled()?moveDuration:0);
      if(!alive||token!==walkToken)return;
      if(!releasing&&isLedgeDrop(level,before,to)&&state.position.carrying&&state.phase!=='failed'){
        moveKind='idle';
        await carryOrPlace({afterDrop:true});
        if(!alive||token!==walkToken)return;
      }
      if(state.phase==='exit'&&antAt(player(),level.exit)){walking=false;queuedWalk=null;moveKind='idle';await enterExit();return;}
      if(queuedWalk){
        const next=queuedWalk;queuedWalk=null;
        if(next.target)path=pathTo(level,player(),next.target,bridgesNow(),holesNow())||[];
        else if(turnInGap(next.direction))path=[];
        else {const to=stepTarget(next.direction);path=to?[to]:[];}
      }
    }
    if(alive&&token===walkToken){walking=false;moveKind='idle';startAntFall();render();}
  }
  function stepTarget(direction){return antStepTarget(level,player(),direction,facing,bridgesNow(),holesNow());}
  function turnInGap(direction){
    if(player().side!==1||!['left','right'].includes(direction))return false;
    facing=direction==='left'?-1:1;notice='';save();render();return true;
  }
  function step(direction){
    if(acting||gravityFall||(running&&level.rules!=='dos')||!deltas[direction]||['failed','won'].includes(state.phase))return;
    if(turnInGap(direction))return;
    if(walking){queuedWalk={direction};return;}
    const target=stepTarget(direction);if(target)void runWalk([target]);
  }
  async function carryOrPlace({afterDrop=false}={}){
    if(acting||gravityFall||(running&&level.rules!=='dos')||(walking&&!afterDrop)||state.attempt||state.phase==='failed')return;
    if(player().side===1)return;
    if(afterDrop&&!state.position.carrying)return;
    if(!liveChain&&(state.fallen||[]).some(q=>at(q,player()))){notice='这里躺着牌，先换个位置。';renderText();return;}
    if(liveChain){
      if(state.position.carrying){
        const p=player();
        const carried=state.position.carrying;
        if(!hasFloor(level,p.x,p.y,liveChain.bridges,liveChain.holes)||(doorBlocked(level,p)&&carried.type!=='vanish')||liveChain.stones.some(q=>q.x===p.x&&q.y===p.y&&q.state!=='vanished')||(state.fallen||[]).some(q=>q.x===p.x&&q.y===p.y)){notice='这里不能放牌。';renderText();return;}
        liveChain.addStone({...carried,...p});
        state.position={...state.position,carrying:null};
      }else{
        const stone=liveChain.stones.find(q=>q.x===player().x&&q.y===player().y&&q.state==='upright');
        if(!stone||stone.type==='trigger')return;
        liveChain.removeStone(stone.id);
        state.position={...state.position,carrying:stone};
      }
      // Live edits must be visible immediately, even during a delay beat.
      frame={...frame,...liveChain.snapshot()};
      notice='';save();render();return;
    }
    const piece=state.position.carrying||currentPiece(),kind=state.position.carrying?'place':'take';
    const next=edit(level,state.position,{type:kind});
    if(!next){notice='这里不能放牌：需要空的地面，门口那一格也不能放。';renderText();return;}
    const from=kind==='take'?stoneNodes.get(piece.id)?.querySelector('.dc-stone-face,.dc-ascender-face')?.getBoundingClientRect():null;
    const token=++actionToken;acting=true;transfer={kind,piece};remember();state.position=next;notice='';refreshCompletedDoor();save();render();
    const complete=kind==='take'?await actor.take(from):await actor.place(()=>{
      const boardStone=stoneNodes.get(piece.id);
      if(!boardStone)return;
      boardStone.style.visibility='';
      boardStone.style.transition='opacity 240ms ease-out';
      boardStone.style.opacity='0';
      requestAnimationFrame(()=>{if(alive&&transfer?.piece.id===piece.id)boardStone.style.opacity='1';});
    });
    if(!alive||token!==actionToken||!complete)return;
    acting=false;transfer=null;sound();render();
  }
  function die(){
    state.phase='failed';state.death=true;state.attempt=null;state.walker=null;state.postHistory=[];
    ant.dataset.dead='true';result=null;frame=null;notice='';save();render();
  }
  async function enterExit(){
    if(acting||state.phase!=='exit'||!antAt(player(),level.exit)||!exitReady())return;
    const token=++actionToken;acting=true;moveKind='idle';render();
    if(!await actor.enter()||!alive||token!==actionToken)return;
    acting=false;markWon();save();render();
  }
  async function push(dir){
    const starter=pushPiece(dir);
    if(!starter||acting||gravityFall||walking||state.attempt||state.position.carrying||['failed','won'].includes(state.phase))return;
    if(level.rules==='dos'){
      if(!starter||['splitter','stopper'].includes(starter.type)||acting||walking||state.position.carrying)return;
      if(liveChain){
        if(useManualPush(state,()=>liveChain.activateStone(starter.id,dir))){facing=dir;save();sound();render();}
        return;
      }
      const chain=newLiveChain(),backup=chainBackup();
      if(!useManualPush(state,()=>chain.activateStone(starter.id,dir)))return;
      state.chainBackup=backup;
      liveChain=chain;chainWalker=clone(state.position.player);
      result=null;frame=chain.snapshot();running=true;facing=dir;
      const token=++runToken;save();render();sound();
      void runLiveChain(token);
      return;
    }
    if(!starter||['splitter','stopper'].includes(starter.type)||acting||running||walking||state.attempt||state.phase==='failed'||state.position.carrying)return;
    const simulation=simulate(level,state.position.pieces,starter.id,dir,state.structures||{},dominoTiming);
    if(!simulation.valid)return;
    const won=simulation.won;
    stop();facing=dir;const token=++runToken;acting=true;render();
    if(!await actor.reach()||!alive||token!==runToken)return;
    acting=false;result=simulation;state.attempt={id:starter.id,dir};state.walker=clone(state.position.player);state.postHistory=[];
    state.phase=won?'exit':'failed';
    save();notice='';running=true;frame=result.trace[0];stageCamera.resume();render();sound();
    void actor.recoil();
    if(motionEnabled())for(let i=1;i<result.trace.length;i++){
      await wait((result.trace[i].time-result.trace[i-1].time)*200);
      if(!alive||token!==runToken)return;
      frame=result.trace[i];renderScene();
    }
    if(motionEnabled())await wait(200);
    if(!alive||token!==runToken)return;
    frame=null;running=false;
    if(!won)ctx.result?.('lost',{moves:state.position.moves});
    notice='';
    save();render();if(won)sound(true);
  }
  function chainBackup(){
    return {position:clone(state.position),fallen:clone(state.fallen||[]),structures:clone(state.structures||{}),
      triggerDown:!!state.triggerDown,completion:clone(state.completion||null),pushUsed:!!state.pushUsed};
  }
  function newLiveChain(){
    const offset=state.completion?.time||0;
    const settledPieces=dominoSessionPieces(state).filter(p=>p.state!=='upright').map(p=>({...p,finish:Number.isFinite(p.finish)?p.finish-offset:null}));
    // Live play has no step budget: a rolling tile may bounce between stoppers
    // indefinitely, and the player has to move one away. Stalling is not a loss.
    return createChain(level,state.position.pieces,{...state.structures,settledPieces},dominoTiming,{maxSteps:Infinity});
  }
  function releaseCarriedBrick(from,to){
    const piece=state.position.carrying;if(!piece)return false;
    const chain=liveChain||newLiveChain(),backup=liveChain?null:chainBackup();
    if(!chain.dropCarriedStone(piece,{from,to,dir:facing}))return false;
    const starting=!liveChain;
    if(starting){state.chainBackup=backup;liveChain=chain;chainWalker=clone(from);result=null;running=true;}
    state.position={...state.position,carrying:null};frame=chain.snapshot();save();render();
    if(starting){const token=++runToken;void runLiveChain(token);}
    return true;
  }
  function startAntFall(){
    if(!liveChain||gravityFall||ledgeFlight||state.death)return false;
    const plan=antFallTarget(level,chainWalker,liveChain.snapshot());
    if(!plan)return false;
    const fall={...plan,finished:null};gravityFall=fall;ledgeFlight=true;
    walkToken++;actionToken++;walking=false;acting=false;queuedWalk=null;transfer=null;actor.cancel();
    const held=state.position.carrying;
    const released=held&&releaseCarriedBrick(plan.from,plan.to);
    const leadMs=released?carriedDropTiming(plan.rows,dominoTiming).antLeadMs:0;
    actor.update({facing,held:state.position.carrying,move:leadMs?'scared':'falling'});
    const displayed=getComputedStyle(ant);
    ant.style.transition='none';ant.style.left=displayed.left;ant.style.top=displayed.top;
    void ant.offsetHeight;
    fall.finished=(async()=>{
      if(leadMs)await wait(leadMs);
      if(!alive||gravityFall!==fall||!liveChain)return;
      const duration=Math.min(800,Math.max(200,plan.rows*dominoTiming.beat));
      ant.dataset.stance='front';actor.update({facing,held:state.position.carrying,move:'falling'});
      ant.style.transition=`left 140ms linear,top ${duration}ms cubic-bezier(.3,0,.8,1),transform 140ms linear`;
      placeNode(ant,plan.to);
      await wait(duration);
      if(!alive||gravityFall!==fall||!liveChain)return;
      chainWalker=clone(plan.to);gravityFall=null;ledgeFlight=false;ant.style.transition='';moveKind='idle';
      if(plan.fatal){state.death=true;ant.dataset.dead='true';}
      else startAntFall();
      save();render();
    })();
    return true;
  }
  async function runLiveChain(token){
    let deadline=gameRuntime.now();
    while(liveChain){
      if(state.death)break;
      if(liveChain.done()){
        startAntFall();
        if(gravityFall){await gravityFall.finished;continue;}
        break;
      }
      deadline+=liveChain.nextTickBeats*dominoTiming.beat;
      await wait(Math.max(0,deadline-gameRuntime.now()));
      if(!alive||token!==runToken||!liveChain)return;
      if(state.death)break;
      if(!liveChain.tick())continue;
      frame=liveChain.snapshot();
      startAntFall();
      renderScene();renderText();
    }
    if(!alive||token!==runToken||!liveChain)return;
    frame=null;running=false;
    finishLiveChain();
  }
  function finishLiveChain(){
    const snap=liveChain.snapshot(),pieces=snap.pieces;
    const trigDown=!!state.triggerDown||pieces.some(p=>p.type==='trigger'&&['flat','vanished','ceiling'].includes(p.state));
    state.completion=recordDominoCompletion(state,snap);
    const structures={bridges:snap.bridges,holes:snap.holes};
    const pos=clone(chainWalker);
    const remaining=pieces.filter(p=>p.state==='upright');
    const byId=new Map((state.fallen||[]).map(p=>[p.id,p]));
    for(const p of pieces)if(['flat','crashed','dropping','ceiling'].includes(p.state))byId.set(p.id,{id:p.id,type:p.type,x:p.x,y:p.y,state:p.state,dir:p.dir,
      ...(p.type==='ascender'?{ceilingAngle:p.ceilingAngle,ceilingTravel:p.ceilingTravel,passiveRise:p.passiveRise}:{}),
      ...(p.type==='normal'||p.type==='delay'?{normalInverted:stoneNodes.get(p.id)?.dataset.normalInverted==='true'}:{inverted:!!p.inverted})});
    state.fallen=[...byId.values()];
    liveChain=null;chainWalker=null;
    state.structures=structures;state.triggerDown=trigDown;
    state.position={...state.position,pieces:remaining,player:pos};
    state.history=[];
    const outcome=dominoSessionOutcome(level,state);
    if(outcome.won){state.phase='exit';result={...snap,...outcome,pieces:state.completion.pieces};notice='';}
    else if(['crash','overflow','early','tie','dead'].includes(outcome.reason)){state.phase='failed';result={...snap,...outcome,pieces:state.completion.pieces};}
    else if(outcome.reason==='carrying'){state.phase='arrange';result=null;notice='搬着骨牌，走到空位后放下。';}
    else {state.phase='arrange';result=null;notice=state.pushUsed?'连锁结束：还有骨牌没倒，可以继续走、搬或抱牌跳下。':'连锁结束：还有骨牌没倒，可以继续走、搬或推。';}
    save();render();if(outcome.won)sound(true);
  }
  function exitReady(){
    return !state.death&&!state.position.carrying&&(level.rules==='dos'?dominoSessionOutcome(level,state).won:!!result?.won);
  }
  function refreshCompletedDoor(){
    if(level.rules!=='dos'||!state.completion||state.phase==='won'||state.phase==='failed')return;
    const outcome=dominoSessionOutcome(level,state);
    if(outcome.won){state.phase='exit';result={...state.completion,...outcome,pieces:dominoSessionPieces(state),bridges:bridgesNow(),holes:holesNow()};}
    else if(state.phase==='exit'){state.phase='arrange';result=null;}
  }
  function retryAction(notify=true){
    if(!state.attempt&&!state.chainBackup)return;stop();
    const reset=()=>{
      if(state.chainBackup){
        const b=state.chainBackup;
        state.position=clone(b.position);state.fallen=clone(b.fallen);state.structures=clone(b.structures);state.triggerDown=b.triggerDown;
        state.completion=clone(b.completion||null);
        state.pushUsed=typeof b.pushUsed==='boolean'?b.pushUsed:!!b.completion;
        state.chainBackup=null;
      }
      state.attempt=null;state.walker=null;state.postHistory=[];state.phase='arrange';state.death=false;result=null;frame=null;notice='';save();render();
    };
    return notify?startGame(ctx,'restart',reset,{level:String(state.level+1)}):reset();
  }
  function undoAction(){
    if(state.chainBackup&&(running||state.phase==='failed'||state.phase==='exit'||!state.history.length)){retryAction(false);return;}
    if(state.attempt){
      if(!running&&state.postHistory.length){stop();state.walker=state.postHistory.pop();state.phase='exit';notice='';save();render();return;}
      retryAction(false);return;
    }
    if(state.history.length){stop();state.position=state.history.pop();state.phase='arrange';state.death=false;ant.dataset.dead='false';notice='';refreshCompletedDoor();save();render();}
  }
  function loadLevel(index,reason='select'){stop();return startGame(ctx,reason,()=>{state=fresh(index);level=levels[index];result=null;frame=null;notice='';guideActive=false;facing=1;buildWorld();save();render();settleStage();void playIntro();void motion.play(viewport,[{opacity:.25,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],280);},{level:String(index+1)});}
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
  if(state.attempt)result=simulate(level,state.position.pieces,state.attempt.id,state.attempt.dir,{},dominoTiming);
  buildWorld();render();settleStage();void playIntro();
  if(state.phase==='exit'&&antAt(player(),level.exit))void enterExit();
  return()=>{alive=false;stop();detach();stageCamera.dispose();window.removeEventListener('keydown',shortcuts);for(const modal of dialogs)modal.close();dialogs.clear();motion.dispose();};
}

import {el,button,controls,keyboardAndSwipe,sound,finish} from './shared.js?v=46';
import {t} from './i18n.js?v=46';
import {createMotion} from './motion.js?v=46';
import {gameRuntime} from './game-runtime.js?v=46';
import {startGame} from './game-transition.js?v=46';
import {gardenLevels} from './zeek-levels.js?v=46';
import {createGardenState,validGardenState,gardenCopy,gardenStep,gardenRealtimeStep,gardenDanger} from './zeek-engine.js?v=46';
import {gardenArt,gardenSVG} from './zeek-art.js?v=46';
export const gardenObjects={
 wall:['苔石墙','固定的墙，不能推动或炸毁。'],barrel:['木桶','固定障碍，不能推动或炸毁。'],stone:['圆石','一次推一格，能挡激光，炸不坏。'],apple:['苹果','推到张嘴花的四邻，让花消化 7 回合。'],rotten:['烂苹果','花吃下后会消化 24 回合。'],flower:['黄花','吃掉加 50 分。'],poison:['蓝色毒花','碰到就中毒；彩蛋能把它变成黄花。'],goal:['出口蘑菇','走到这里即获胜。'],toxic:['毒蘑菇','碰到就中毒；彩蛋不会改变它。'],key:['钥匙','自动收起，每把开一扇门。'],door:['锁门','有钥匙时，走过去就能开门。'],egg:['变色蛋','黄花与蓝色毒花互换，加 100 分。'],pill:['隐身药','保护 14 回合，可叠加；不防毒和炸弹。'],chest:['宝箱','吃掉加 1000 分。'],crystal:['晶石','四邻相接后闪烁，两回合后消失，各加 200 分。'],bomb:['炸弹','第一次推动点燃，8 回合后炸十字一格。'],plant:['食人花','张嘴时抓四邻的人或苹果，斜角安全。花蕾两回合后张嘴。'],laser:['激光炮台','四向直线看到你就射击，物品和隐身能保护你。'],grazer:['巡游小兽','每回合前进一步，受阻按左、右、后转向，会吃植物。'],
};
const causes={poison:'中毒了，可以撤销。',plant:'被食人花抓住了，可以撤销。',bomb:'离炸弹太近了，可以撤销。',laser:'进入激光直线了，可以撤销。',grazer:'撞上巡游小兽了，可以撤销。',goal:'出口蘑菇没了，可以撤销。'};
export function restoreGarden(saved){
 const level=Number.isInteger(saved?.level)&&gardenLevels[saved.level]?saved.level:0,l=gardenLevels[level];
 return {version:1,level,state:validGardenState(saved?.state,l)?gardenCopy(saved.state):createGardenState(l),history:Array.isArray(saved?.history)?saved.history.filter(s=>validGardenState(s,l)).slice(-80):[],completed:Array.isArray(saved?.completed)?[...new Set(saved.completed.filter(n=>Number.isInteger(n)&&gardenLevels[n]))]:[]};
}
export const pageInfo=ctx=>({level:String(restoreGarden(ctx.load()).level+1)});
export function settings({read,write}){return {value:{mode:read('options:zeek',{})?.mode??'thinking'},fields:[{key:'mode',label:'节奏',options:[{value:'thinking',label:'思考模式'},{value:'realtime',label:'实时模式'}]}],note:'思考模式走一步推进一回合；实时模式每 0.65 秒推进。更改节奏保留当前布局。',save:value=>write('options:zeek',{mode:value.mode==='realtime'?'realtime':'thinking'})};}
export function mount(root,ctx){
 root.classList.add('play-zeek');let data=restoreGarden(ctx.load()),level=gardenLevels[data.level],state=data.state,alive=true,busy=false,epoch=0,manualPause=false,queue=null,timer=null,started=false,wide=false;
 const realtime=ctx.read('options:zeek',{})?.mode==='realtime',motion=createMotion(),tokens=new Map(),dialogs=new Set(),manuallyStopped=new Set();
 const levelButton=el('button',{type:'button',class:'classic-level','aria-label':'选择花园关卡',onclick:choose});
 const restart=button('重来',()=>void switchLevel(data.level,'restart'),'plain');
 const toolbar=el('div',{class:'game-toolbar classic-toolbar'},[levelButton,el('div',{class:'classic-actions'},restart)]);
 const moves=el('strong'),score=el('strong'),inventory=el('span',{class:'garden-inventory'}),tempo=el('span',{class:'garden-tempo',text:realtime?'实时模式':'思考模式'});
 const hud=el('div',{class:'garden-hud'},[el('div',{},[el('small',{text:'步数'}),moves]),el('div',{},[el('small',{text:'得分'}),score]),inventory,tempo]);
 const viewport=el('div',{class:'garden-viewport'}),board=el('div',{class:'garden-board','data-testid':'garden-board','aria-label':'蘑菇花园棋盘',tabindex:0}),terrain=el('div'),danger=el('div',{class:'garden-danger'}),effects=el('div',{class:'garden-effects'});board.append(terrain,danger,effects);viewport.append(board);
 const stage=el('div',{class:'classic-stage garden-stage'},viewport),overlay=el('div',{class:'classic-overlay',hidden:true});stage.append(overlay);
 const pad=controls(input),undo=button('撤销',rewind,'plain'),wait=button('等待',()=>input('wait'),'secondary'),pause=button('暂停',togglePause,'plain'),overview=button('全景',()=>{wide=!wide;resize();},'plain');
 const note=el('p',{class:'classic-note','aria-live':'polite'});
 root.append(toolbar,hud,stage,el('div',{class:'classic-footer garden-footer'},[pad,el('div',{class:'garden-tools'},[el('div',{},[undo,wait]),el('div',{},[pause,overview])])]),note);
 function save(){data.state=state;ctx.save(data);}
 function cancel(){epoch++;busy=false;queue=null;for(const a of board.getAnimations({subtree:true}))a.cancel();manuallyStopped.clear();}
 function rewind(){if(!data.history.length||gameRuntime.paused)return;cancel();state=data.history.pop();draw();save();focusPlayer();}
 function togglePause(){
  if(state.phase!=='playing')return;manualPause=!manualPause;ctx.roundPause?.(manualPause);queue=null;
  if(manualPause){for(const animation of board.getAnimations({subtree:true}))if(animation.playState==='running'||animation.pending){animation.pause();manuallyStopped.add(animation);}}
  else{for(const animation of manuallyStopped)if(animation.playState==='paused')animation.play();manuallyStopped.clear();}
  draw();
 }
 function resize(){board.style.setProperty('--cell',wide?`${Math.min(52,viewport.clientWidth/level.w)}px`:`${Math.max(36,Math.min(52,viewport.clientWidth/Math.min(level.w,9)))}px`);viewport.style.maxHeight=wide?'420px':'min(52dvh,420px)';overview.textContent=t(wide?'跟随':'全景');focusPlayer();}
 function focusPlayer(){if(wide)return;const cell=board.getBoundingClientRect().width/level.w;viewport.scrollTo({left:Math.max(0,(state.player.x+.5)*cell-viewport.clientWidth/2),top:Math.max(0,(state.player.y+.5)*cell-viewport.clientHeight/2),behavior:'auto'});}
 async function switchLevel(index,reason='select'){
  if(!gardenLevels[index])return;await startGame(ctx,reason,()=>{cancel();manualPause=false;ctx.roundPause?.(false);started=false;data.level=index;level=gardenLevels[index];state=createGardenState(level);data.history=[];wide=false;draw();resize();save();},{level:String(index+1)});
 }
 function dialog(title,body){const d=el('dialog',{class:'app-dialog','aria-label':title});d.append(el('h2',{text:title}),body,button('关闭',()=>d.close(),'plain'));dialogs.add(d);document.body.append(d);d.addEventListener('close',()=>{dialogs.delete(d);d.remove();},{once:true});d.showModal();return d;}
 function choose(){const grid=el('div',{class:'classic-pick'});gardenLevels.forEach((l,i)=>grid.append(el('button',{type:'button','aria-current':String(i===data.level),onclick:()=>{for(const d of dialogs)d.close();void switchLevel(i);}},[el('strong',{text:`${data.completed.includes(i)?'✓ ':''}${i+1}`}),el('small',{text:l.name})])));dialog('蘑菇花园',grid);}
 function describe(o){if(gameRuntime.paused)return;const [name,text]=gardenObjects[o.type];const body=el('div',{class:'garden-object-help'},[el('div',{class:'garden-object-icon'}),el('p',{text}),o.timer?el('p',{text:`${t('剩余回合')} ${o.timer}`}):null]);body.firstChild.innerHTML=gardenSVG(gardenArt(o));dialog(name,body);}
 function draw(){
  root.dataset.gardenTheme=level.theme;board.style.setProperty('--garden-w',level.w);board.style.setProperty('--garden-h',level.h);
  levelButton.replaceChildren(el('strong',{text:String(data.level+1).padStart(2,'0')}),el('span',{text:level.name}),el('small',{text:`${data.completed.length}/${gardenLevels.length}⌄`}));moves.textContent=state.moves;score.textContent=state.score;inventory.textContent=`⚿ ${state.keys??0}${state.player.invisible?` · ◌ ${state.player.invisible}`:''}`;
  terrain.innerHTML=`<svg class="garden-ground" viewBox="0 0 ${level.w*50} ${level.h*50}" aria-hidden="true">${Array.from({length:level.w*level.h},(_,i)=>`<g transform="translate(${i%level.w*50} ${Math.floor(i/level.w)*50})"><rect width="50" height="50" fill="${(i%level.w+Math.floor(i/level.w))%2?'var(--garden-floor-b)':'var(--garden-floor-a)'}"/><path d="M6 39l2-4 2 4m25-27l2-3 2 3" fill="none" stroke="var(--garden-grass)" opacity=".3"/></g>`).join('')}</svg>`;
  danger.innerHTML=`<svg viewBox="0 0 ${level.w*50} ${level.h*50}" aria-hidden="true">${gardenDanger(level,state).map(o=>`<rect x="${o.x*50+3}" y="${o.y*50+3}" width="44" height="44" rx="8" fill="${o.kind==='laser'?'#c89d78':'#bc7c87'}" opacity=".12"/>`).join('')}</svg>`;
  const actors=[...state.objects,{id:'player',type:'player',...state.player}],ids=new Set(actors.map(o=>o.id));for(const [id,node]of tokens)if(!ids.has(id)){node.remove();tokens.delete(id);}
  for(const o of actors){let node=tokens.get(o.id);if(!node){node=el('button',{type:'button',class:'garden-piece','data-garden-id':o.id,onclick:()=>{if(o.id!=='player')describe(state.objects.find(a=>a.id===o.id)??o);}});tokens.set(o.id,node);board.append(node);}node.dataset.type=o.type;node.dataset.state=o.state??'';node.dataset.charging=String(o.type==='crystal'&&o.timer>0||o.type==='bomb'&&o.timer>0);node.style.cssText=`left:calc(${o.x} * var(--cell));top:calc(${o.y} * var(--cell));z-index:${10+o.y}`;node.setAttribute('aria-label',`${t(o.type==='player'?'探险者':gardenObjects[o.type][0])} · ${o.x+1},${o.y+1}${o.timer?` · ${t('剩余回合')} ${o.timer}`:''}`);node.innerHTML=gardenSVG(gardenArt(o))+(o.timer?`<span class="garden-countdown">${o.timer}</span>`:'');node.disabled=busy;}
  const player=tokens.get('player');player.dataset.phase=state.phase;
  undo.disabled=!data.history.length;for(const b of pad.children)b.disabled=busy||state.phase!=='playing'||manualPause;wait.disabled=busy||state.phase!=='playing'||manualPause;pause.textContent=t(manualPause?'继续':'暂停');pause.disabled=state.phase!=='playing';board.classList.toggle('garden-manual-paused',manualPause);
  note.textContent=t(manualPause?'已暂停':state.phase==='lost'?causes[state.cause]:state.phase==='won'?'找到出口了！':level.hint);
  overlay.hidden=busy||state.phase==='playing';if(!overlay.hidden)overlay.replaceChildren(el('div',{class:'classic-outcome'},[el('h2',{text:state.phase==='won'?'找到出口了！':'再试一次'}),el('p',{text:state.phase==='won'?`${t('得分')} ${state.score}`:causes[state.cause]}),state.phase==='lost'?button('撤销',rewind):button(data.level+1<gardenLevels.length?'下一关':'再玩一次',()=>void switchLevel(data.level+1<gardenLevels.length?data.level+1:0,'next'))]));
 }
 async function act(action){
  if(!alive||busy||gameRuntime.paused||manualPause||dialogs.size||state.phase!=='playing')return;
  const result=(realtime?gardenRealtimeStep:gardenStep)(level,state,action);if(!result.changed)return;
  started=true;data.history.push(gardenCopy(state));if(data.history.length>80)data.history.shift();state=result.state;busy=true;const ticket=++epoch;draw();save();sound();
  const animations=[];
  for(const e of result.events){
   if(e.type==='move'){const node=tokens.get(e.id);if(node){node.classList.add('garden-walking');const cell=board.getBoundingClientRect().width/level.w;animations.push(motion.play(node,[{transform:`translate(${(e.from.x-e.to.x)*cell}px,${(e.from.y-e.to.y)*cell}px)`},{transform:'translate(0,0)'}],220).then(()=>node.classList.remove('garden-walking')));}}
   if(e.type==='grab'){const node=tokens.get(e.id);if(node)animations.push(motion.play(node,[{transform:'scale(1)'},{transform:'scale(1.2,.85)'},{transform:'scale(1)'}],320));}
   if(['spark','blast','pickup','beam','unlock'].includes(e.type)){
    const node=el('div',{class:`garden-effect garden-effect-${e.type}`});node.style.cssText=`left:calc(${e.x??e.from?.x??0} * var(--cell));top:calc(${e.y??e.from?.y??0} * var(--cell))`;node.innerHTML=e.type==='beam'?gardenSVG(`<path d="M25 25L${25+(e.to.x-e.from.x)*50} ${25+(e.to.y-e.from.y)*50}" stroke="#da9778" stroke-width="4"/>`):e.type==='blast'?'✺':'✦';effects.append(node);animations.push(motion.play(node,[{opacity:1,transform:'scale(.4)'},{opacity:0,transform:'scale(2)'}],e.type==='blast'?420:260).then(()=>node.remove()));
   }
  }
  await Promise.all(animations);if(!alive||ticket!==epoch)return;busy=false;focusPlayer();
  if(state.phase==='won'){if(!data.completed.includes(data.level))data.completed.push(data.level);ctx.result?.('won',{moves:state.moves,score:state.score,assisted:false});finish('zeek');save();}
  else if(state.phase==='lost')ctx.result?.('lost',{moves:state.moves,score:state.score,assisted:false});draw();
 }
 function input(d){if(gameRuntime.paused||manualPause||dialogs.size||state.phase!=='playing')return;if(realtime){if(!started){started=true;void act(d);}else queue=d;}else void act(d);}
 let nextTick=gameRuntime.now()+650;
 async function loop(){if(!alive)return;timer=gameRuntime.delay(Math.max(0,nextTick-gameRuntime.now()));if(!await timer.finished||!alive)return;nextTick=gameRuntime.now()+650;if(realtime&&started&&!manualPause&&!dialogs.size&&!busy){const a=queue??'wait';queue=null;await act(a);}void loop();}
 const inputOff=keyboardAndSwipe(board,input),resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);
 const keys=e=>{if(gameRuntime.paused||dialogs.size||e.target.closest('input,select,textarea')||e.ctrlKey||e.metaKey||e.altKey)return;if(e.code==='Space'){if(e.target.closest('button,a,summary,[role="button"]'))return;e.preventDefault();input('wait');}if(e.key.toLowerCase()==='z'){e.preventDefault();rewind();}if(e.key.toLowerCase()==='p'){e.preventDefault();togglePause();}};
 let drag=null;const down=e=>{if(e.button>0||!wide)return;drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};};const move=e=>{if(drag){viewport.scrollLeft=drag.left-(e.clientX-drag.x);viewport.scrollTop=drag.top-(e.clientY-drag.y);}};const up=()=>{drag=null;};
 const runtimeOff=gameRuntime.subscribe(paused=>{if(paused){queue=null;drag=null;}});window.addEventListener('keydown',keys);viewport.addEventListener('pointerdown',down);viewport.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
 draw();resize();save();void loop();
 return()=>{alive=false;cancel();timer?.cancel();inputOff();runtimeOff();resizeObserver.disconnect();motion.dispose();ctx.roundPause?.(false);window.removeEventListener('keydown',keys);viewport.removeEventListener('pointerdown',down);viewport.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);for(const d of dialogs)d.close();};
}

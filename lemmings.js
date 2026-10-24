import {el,button,sound,finish} from './shared.js?v=48';
import {t} from './i18n.js?v=48';
import {gameRuntime} from './game-runtime.js?v=48';
import {startGame} from './game-transition.js?v=48';
import {lemmingLevels,lemmingChapters} from './lemmings-levels.js?v=48';
import {LEM_FPS,lemmingSkills,createLemmingState,restoreLemmingState,saveLemmingState,startLemmings,tickLemmings,assignLemming,lemmingAssignment,recallLemmings} from './lemmings-engine.js?v=48';
import {createRescuePainter,rescueSkillIcon} from './lemmings-art.js?v=48';
export const rescueSkills={
 climber:['攀爬','碰到墙会攀爬；遇到顶檐会掉下来。'],floater:['降落伞','高处落下会自动撑伞；能力永久保留。'],
 blocker:['阻挡','原地张开双臂，让后来者掉头。'],builder:['搭桥','沿面朝方向铺 12 块砖，形成上升的斜桥。'],
 basher:['横挖','向面朝方向挖穿泥土；钢板不能挖。'],miner:['斜挖','向面朝方向斜着往下挖。'],
 digger:['下挖','在脚下垂直挖洞。'],bomber:['爆破','倒数五秒后炸开周围泥土，自己也会消失。'],
};
const actionNames={walk:'行走',fall:'下落',float:'撑伞',climb:'爬墙',hoist:'翻上平台',block:'阻挡',build:'搭桥',bash:'横挖',mine:'斜挖',dig:'下挖',shrug:'收工',exit:'进门',dead:'离场'};
export function restoreRescue(saved){
 const level=Number.isInteger(saved?.level)&&lemmingLevels[saved.level]?saved.level:0,l=lemmingLevels[level];
 const records={};for(const [id,r]of Object.entries(saved?.records||{}))if(lemmingLevels.some(l=>l.id===id)&&Number.isInteger(r?.saved)&&r.saved>=0&&r.saved<=20&&Number.isInteger(r.used)&&r.used>=0&&r.used<=1000)records[id]={saved:r.saved,used:r.used};
 return {version:1,level,state:restoreLemmingState(saved?.state,l)||createLemmingState(l),completed:Array.isArray(saved?.completed)?[...new Set(saved.completed.filter(id=>lemmingLevels.some(l=>l.id===id)))]:[],records,
   paused:saved?.paused===true,history:Array.isArray(saved?.history)?saved.history.filter(s=>restoreLemmingState(s,l)).slice(-8):[]};
}
export const pageInfo=ctx=>({level:String(restoreRescue(ctx.load()).level+1)});
export function settings({read,write}){
 const value=read('options:lemmings',{});
 return {value:{aim:value.aim==='live'?'live':'pause'},fields:[{key:'aim',label:'技能瞄准',options:[{value:'pause',label:'选技能时暂停'},{value:'live',label:'保持实时'}]}],note:'暂停时可以分配技能；成功分配后恢复原来的节奏。',save:value=>write('options:lemmings',{aim:value.aim==='live'?'live':'pause'})};
}
export function mount(root,ctx){
 root.classList.add('play-lemmings');const data=restoreRescue(ctx.load());let level=lemmingLevels[data.level],state=data.state,manual=data.paused||state.phase==='ready',selectedSkill=null,selected=0,aimPaused=false,alive=true,reported=['won','lost'].includes(state.phase),hintUsed=false,undoCount=0;
 let camera=0,viewWidth=320,overview=false,follow=true,speed=1,drag=null,accumulator=0,last=gameRuntime.now(),frameID,hudKey='',targetKey='';
 const dialogs=new Set(),targets=new Map(),aimSetting=ctx.read('options:lemmings',{})?.aim!=='live';
 const picker=el('button',{type:'button',class:'rescue-level','aria-label':'选择营救关卡',onclick:choose});
 const restart=button('重来',()=>void switchLevel(data.level,'restart'),'plain');
 const toolbar=el('div',{class:'game-toolbar rescue-toolbar'},[picker,el('div',{class:'rescue-actions'},[button('技能图鉴',showSkills,'plain'),restart])]);
 const rescued=el('strong',{'data-testid':'rescue-saved'}),active=el('strong'),waiting=el('span'),clock=el('strong');
 const hud=el('div',{class:'rescue-hud'},[el('div',{},[el('small',{text:'获救／目标'}),rescued]),el('div',{},[el('small',{text:'场上'}),active,waiting]),el('div',{},[el('small',{text:'剩余时间'}),clock])]);
 const canvas=el('canvas',{class:'rescue-canvas','aria-label':'营救场地'}),layer=el('div',{class:'rescue-targets'}),overlay=el('div',{class:'rescue-overlay',hidden:true});
 const stage=el('div',{class:'rescue-stage',tabindex:0,'data-testid':'rescue-stage','aria-label':'拖动查看营救场地'},[canvas,layer,overlay]);
 const minimap=el('canvas',{class:'rescue-minimap','aria-label':'小地图，拖动查看场地',tabindex:0,role:'slider','aria-valuemin':0,'aria-valuemax':level.width});
 const mapBar=el('div',{class:'rescue-mapbar'},[button('‹',()=>pan(-viewWidth*.6),'plain'),minimap,button('›',()=>pan(viewWidth*.6),'plain')]);
 mapBar.firstChild.setAttribute('aria-label',t('向左查看'));mapBar.lastChild.setAttribute('aria-label',t('向右查看'));
 const pause=button('开始营救',togglePause,'rescue-start'),fast=button('×1',()=>{speed=speed===1?2:1;drawHUD();},'plain'),undo=button('撤销',rewind,'plain'),wide=button('全景',()=>{overview=!overview;follow=!overview;resize();},'plain'),home=button('◎',()=>{follow=true;overview=false;resize();},'plain'),recall=button('收队',confirmRecall,'plain');
 fast.setAttribute('aria-label',t('切换快进'));home.setAttribute('aria-label',t('跟随小旅鼠'));
 const transport=el('div',{class:'rescue-transport'},[pause,fast,undo,wide,home,recall]);
 const tools=el('div',{class:'rescue-skills','aria-label':'选择技能'}),toolButtons=new Map();
 for(const skill of lemmingSkills){const b=el('button',{type:'button',class:'rescue-skill','data-skill':skill,onclick:()=>selectSkill(skill)});b.innerHTML=rescueSkillIcon(skill);b.append(el('span',{text:rescueSkills[skill][0]}),el('strong'));tools.append(b);toolButtons.set(skill,b);}
 const note=el('p',{class:'rescue-note','aria-live':'polite'}),detail=el('span',{class:'rescue-target-detail'}),hint=button('提示',()=>{hintUsed=true;note.textContent=t(level.hint);},'plain');
 const step=button('单步',()=>{if(gameRuntime.paused||!manual||state.phase!=='playing')return;tickLemmings(state,level);settle();save();paint();},'plain');step.setAttribute('aria-label',t('前进一步'));
 const info=el('div',{class:'rescue-info'},[note,step,hint]);
 const pace=el('input',{type:'range',min:0,max:4,step:1,value:0,'aria-label':'出发速度'});
 const paceLabel=el('span');const paceRow=el('label',{class:'rescue-release'},[el('span',{text:'出发速度'}),pace,paceLabel]);
 pace.addEventListener('input',()=>{state.interval=Math.max(8,level.interval-Number(pace.value)*10);paceLabel.textContent=String(Number(pace.value)+1);save();});
 root.append(toolbar,hud,stage,mapBar,transport,tools,info,detail,paceRow);
 const painter=createRescuePainter(canvas,minimap);
 function save(){ctx.save({version:1,level:data.level,state:saveLemmingState(state),completed:data.completed,records:data.records,paused:manual,history:data.history});}
 function setManual(value){manual=value;ctx.roundPause?.(value||state.phase==='ready');last=gameRuntime.now();accumulator=0;}
 function targetText(a){return `${t('小旅鼠')} ${a.id} · ${t(a.dir===1?'向右':'向左')} · ${t(actionNames[a.action]||'行走')}${a.action==='build'?` · ${t('余砖')} ${a.bricks}`:''}${a.climber?` · ${t('攀爬')}`:''}${a.floater?` · ${t('降落伞')}`:''}`;}
 function updateTargets(){
   const keep=new Set();
   for(const a of state.agents){if(a.action==='gone')continue;keep.add(a.id);let b=targets.get(a.id);
    if(!b){b=el('button',{type:'button',class:'rescue-target','data-lemming':a.id,onclick:event=>{if(event.detail===0)apply(a.id);},onfocus:()=>{selected=a.id;}});layer.append(b);targets.set(a.id,b);}
    b.hidden=a.x<camera-8||a.x>camera+viewWidth+8||a.action==='dead';b.disabled=a.action==='exit'||a.action==='dead';
    b.setAttribute('aria-label',targetText(a));b.style.left=`${(a.x-camera)/viewWidth*100}%`;b.style.top=`${(a.y-9)/224*100}%`;b.dataset.action=a.action;b.dataset.direction=String(a.dir);b.dataset.x=String(a.x);b.dataset.y=String(a.y);
   }
   for(const [id,b]of targets)if(!keep.has(id)){b.remove();targets.delete(id);}
 }
 function drawHUD(){
   root.dataset.rescueTheme=level.theme;stage.dataset.phase=state.phase;stage.dataset.paused=String(manual||gameRuntime.paused);stage.dataset.tick=String(state.tick);stage.dataset.camera=String(Math.round(camera));
   picker.replaceChildren(el('strong',{text:String(data.level+1).padStart(2,'0')}),el('span',{text:level.name}),el('small',{text:`${data.completed.length}/${lemmingLevels.length}⌄`}));
   rescued.textContent=`${state.saved} / ${level.need}`;active.textContent=String(state.agents.filter(a=>!['exit','dead'].includes(a.action)).length);waiting.textContent=`${t('待出发')} ${state.retired?0:level.total-state.released}`;
   const seconds=Math.max(0,Math.ceil(state.time/LEM_FPS));clock.textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
   pause.textContent=t(state.phase==='ready'?'开始营救':manual?'继续':'暂停');pause.disabled=['won','lost'].includes(state.phase);pause.setAttribute('aria-pressed',String(manual));fast.textContent=`×${speed}`;
   wide.textContent=t(overview?'放大':'全景');home.setAttribute('aria-pressed',String(follow));undo.disabled=!data.history.length||state.phase!=='playing';recall.disabled=state.phase!=='playing'||state.retired;
   for(const [skill,b]of toolButtons){b.lastChild.textContent=String(state.stock[skill]);b.disabled=state.stock[skill]===0||['won','lost'].includes(state.phase);b.setAttribute('aria-pressed',String(selectedSkill===skill));b.setAttribute('aria-label',`${t(rescueSkills[skill][0])} · ${state.stock[skill]}`);}
   const a=state.agents.find(a=>a.id===selected);detail.textContent=a?targetText(a):t('拖动场地或小地图查看；先选技能，再点目标。');
   const rate=Math.max(0,Math.min(4,Math.round((level.interval-state.interval)/10)));
   pace.value=String(rate);paceLabel.textContent=String(rate+1);pace.disabled=state.retired||['won','lost'].includes(state.phase);
   step.hidden=!manual||state.phase!=='playing';
   minimap.setAttribute('aria-valuenow',String(Math.round(camera)));minimap.setAttribute('aria-valuemax',String(Math.max(0,level.width-viewWidth)));
 }
 function setNote(){note.textContent=selectedSkill?`${t(rescueSkills[selectedSkill][0])} · ${t(rescueSkills[selectedSkill][1])}`:t(level.hint);}
 function paint(){
   // Pointer focus can land on an overlapping hit area. Keep the camera fixed
   // through the gesture so focus cannot move the world beneath the touch.
   if(follow&&!overview&&!drag){const focus=state.agents.find(a=>a.id===selected&&!['dead','exit'].includes(a.action))||state.agents.find(a=>!['dead','exit'].includes(a.action));if(focus)camera=Math.max(0,Math.min(level.width-viewWidth,focus.x-viewWidth*.4));}
   painter.paint(state,level,{camera,viewWidth,selected,motion:ctx.read('animations',true)});
   stage.dataset.tick=String(state.tick);stage.dataset.camera=String(Math.round(camera));
   const nextTargets=`${data.level}:${state.tick}:${camera}:${viewWidth}`;if(nextTargets!==targetKey){targetKey=nextTargets;updateTargets();}
   const nextHUD=[data.level,Math.floor(state.tick/15),state.phase,state.used,state.saved,state.released,manual,gameRuntime.paused,selectedSkill,selected,speed,overview,follow,data.history.length].join(':');
   if(nextHUD!==hudKey){hudKey=nextHUD;drawHUD();}
 }
 function resize(){
   const width=stage.clientWidth||360;viewWidth=overview?level.width:Math.min(level.width,width>=600?560:320);
   stage.style.height=`${width/viewWidth*224}px`;const dpr=Math.min(2,window.devicePixelRatio||1);
   canvas.width=Math.round(width*dpr);canvas.height=Math.round(width/viewWidth*224*dpr);minimap.width=Math.round(minimap.clientWidth*dpr);minimap.height=Math.round(36*dpr);
   camera=Math.max(0,Math.min(level.width-viewWidth,camera));paint();
 }
 function pan(amount){follow=false;camera=Math.max(0,Math.min(level.width-viewWidth,camera+amount));paint();}
 function selectSkill(skill){
   if(gameRuntime.paused||!state.stock[skill]||['won','lost'].includes(state.phase))return;
   if(selectedSkill===skill){selectedSkill=null;if(aimPaused){aimPaused=false;setManual(false);}setNote();paint();return;}
   selectedSkill=skill;if(aimSetting&&!manual&&state.phase==='playing'&&state.agents.some(a=>!['dead','exit'].includes(a.action))){aimPaused=true;setManual(true);}setNote();paint();
 }
 function apply(id){
   if(gameRuntime.paused||['won','lost'].includes(state.phase))return;
   selected=id;if(!selectedSkill){note.textContent=t('先选一个技能，再点这只小旅鼠。');paint();return;}
   const check=lemmingAssignment(state,id,selectedSkill);if(!check.ok){note.textContent=t(check.reason);paint();return;}
   data.history.push(saveLemmingState(state));if(data.history.length>8)data.history.shift();assignLemming(state,id,selectedSkill);targetKey='';sound();
   if(aimPaused){aimPaused=false;setManual(false);}save();setNote();paint();
 }
 function togglePause(){if(gameRuntime.paused||['won','lost'].includes(state.phase))return;if(state.phase==='ready'){startLemmings(state);setManual(false);}else{aimPaused=false;setManual(!manual);}save();paint();}
 function rewind(){if(gameRuntime.paused||state.phase!=='playing'||!data.history.length)return;state=restoreLemmingState(data.history.pop(),level);data.state=state;undoCount++;selected=0;aimPaused=false;targetKey='';hudKey='';setManual(true);painter.invalidate();overlay.hidden=true;save();setNote();paint();}
 async function switchLevel(index,reason='select'){
   if(!lemmingLevels[index])return;await startGame(ctx,reason,()=>{
    data.level=index;level=lemmingLevels[index];state=createLemmingState(level);data.history=[];data.state=state;reported=false;hintUsed=false;undoCount=0;selected=0;selectedSkill=null;aimPaused=false;camera=0;follow=true;overview=false;speed=1;overlay.hidden=true;pace.value='0';setManual(true);painter.invalidate();save();setNote();resize();
   },{level:String(index+1)});
 }
 function modal(title,body){const d=el('dialog',{class:'app-dialog rescue-dialog','aria-label':title});d.append(el('h2',{text:title}),body,button('关闭',()=>d.close(),'plain'));document.body.append(d);dialogs.add(d);d.addEventListener('close',()=>{dialogs.delete(d);d.remove();},{once:true});d.showModal();return d;}
 function choose(){const contents=el('div');for(let chapter=0;chapter<3;chapter++){const grid=el('div',{class:'rescue-level-grid'});contents.append(el('h3',{text:lemmingChapters[chapter]}),grid);lemmingLevels.slice(chapter*8,chapter*8+8).forEach((l,i)=>{const index=chapter*8+i;grid.append(el('button',{type:'button','aria-current':String(index===data.level),'data-level':index+1,onclick:()=>{for(const d of dialogs)d.close();void switchLevel(index);}},[el('strong',{text:`${data.completed.includes(l.id)?'✓ ':''}${index+1}`}),el('span',{text:l.name})]));});}modal('选择营救关卡',contents);}
 function showSkills(){const list=el('div',{class:'rescue-skill-guide'});for(const skill of lemmingSkills){const icon=el('span');icon.innerHTML=rescueSkillIcon(skill);list.append(el('div',{},[icon,el('div',{},[el('strong',{text:rescueSkills[skill][0]}),el('p',{text:rescueSkills[skill][1]})])]));}list.append(el('p',{text:'钢板不能挖。箭头墙只能顺着箭头横挖或斜挖。阻挡者脚下被挖空，会恢复移动。'}));modal('技能图鉴',list);}
 function confirmRecall(){
   if(gameRuntime.paused||state.phase!=='playing'||state.retired)return;
   const body=el('div',{},[el('p',{text:state.saved>=level.need?'已经达到营救目标，可以结束剩余行动。':'还没有达到营救目标，现在收队可能失败。'})]);
   const d=modal('确定收队？',body);body.append(button('收队',()=>{d.close();data.history.push(saveLemmingState(state));data.history=data.history.slice(-8);recallLemmings(state);setManual(false);save();},'secondary'));
 }
 function showResult(){
   overlay.hidden=false;const won=state.phase==='won';overlay.replaceChildren(el('span',{class:'rescue-result-symbol',text:won?'✦':'↶'}),el('h2',{text:won?'营救成功！':'再试一次'}),el('p',{text:`${t('获救')} ${state.saved} / ${level.total} · ${t('目标')} ${level.need}`}),
    el('div',{class:'rescue-result-actions'},[button('重来',()=>void switchLevel(data.level,'restart'),'plain'),won&&data.level+1<lemmingLevels.length?button('下一关',()=>void switchLevel(data.level+1,'next')):button('选择营救关卡',choose)]));
 }
 function settle(){
   if(!['won','lost'].includes(state.phase)||reported)return;reported=true;
   if(state.phase==='won'){
    if(!data.completed.includes(level.id))data.completed.push(level.id);
    const old=data.records[level.id];if(!old||state.saved>old.saved||(state.saved===old.saved&&state.used<old.used))data.records[level.id]={saved:state.saved,used:state.used};finish('lemmings');
   }
   ctx.result?.(state.phase,{score:state.saved*100+Math.max(0,Math.floor(state.time/30)-state.used*5),moves:state.used,attempts:1+undoCount,assisted:hintUsed});save();showResult();
 }
 function loop(){
   if(!alive)return;const now=gameRuntime.now(),dt=Math.min(100,Math.max(0,now-last));last=now;
   if(!gameRuntime.paused&&!manual&&state.phase==='playing'){
    accumulator+=dt*speed;let steps=0;while(accumulator>=1000/LEM_FPS&&steps++<8){tickLemmings(state,level);accumulator-=1000/LEM_FPS;if(state.tick%30===0)save();}settle();
   }else accumulator=0;
   paint();frameID=requestAnimationFrame(loop);
 }
 stage.addEventListener('pointerdown',e=>{if(e.button>0||!e.isPrimary||gameRuntime.paused||e.target.closest('.rescue-overlay'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,camera,moved:false};stage.setPointerCapture(e.pointerId);});
 stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>6){drag.moved=true;follow=false;camera=Math.max(0,Math.min(level.width-viewWidth,drag.camera-dx/stage.clientWidth*viewWidth));paint();}});
 stage.addEventListener('pointerup',e=>{
   if(!drag||e.pointerId!==drag.id)return;const start=drag;drag=null;if(start.moved||gameRuntime.paused)return;
   const r=stage.getBoundingClientRect(),x=camera+(e.clientX-r.left)/r.width*viewWidth,y=(e.clientY-r.top)/r.height*224;
   const candidates=state.agents.filter(a=>!['dead','gone','exit'].includes(a.action)&&Math.abs(a.x-x)<21/viewWidth*320&&Math.abs(a.y-9-y)<24/viewWidth*320);
   candidates.sort((a,b)=>{const valid=a=>selectedSkill?lemmingAssignment(state,a.id,selectedSkill).ok:false;return Number(valid(b))-Number(valid(a))||Math.hypot(a.x-x,a.y-9-y)-Math.hypot(b.x-x,b.y-9-y);});
   if(candidates.length)apply(candidates[0].id);
 });
 stage.addEventListener('pointercancel',()=>{drag=null;});
 const miniPosition=e=>{const r=minimap.getBoundingClientRect();follow=false;camera=Math.max(0,Math.min(level.width-viewWidth,(e.clientX-r.left)/r.width*level.width-viewWidth/2));paint();};
 minimap.addEventListener('pointerdown',e=>{minimap.setPointerCapture(e.pointerId);miniPosition(e);});minimap.addEventListener('pointermove',e=>{if(e.buttons)miniPosition(e);});
 const keys=e=>{if(gameRuntime.paused||document.querySelector('dialog[open]')||e.target.closest('input,select,textarea')||e.ctrlKey||e.metaKey||e.altKey)return;if(e.code==='Space'){e.preventDefault();togglePause();}else if(e.key==='ArrowLeft'){e.preventDefault();pan(-40);}else if(e.key==='ArrowRight'){e.preventDefault();pan(40);}else if(/^[1-8]$/.test(e.key))selectSkill(lemmingSkills[Number(e.key)-1]);else if(e.key.toLowerCase()==='z')rewind();};
 window.addEventListener('keydown',keys);const observer=new ResizeObserver(resize);observer.observe(stage);
 setManual(manual);setNote();resize();if(reported)showResult();save();frameID=requestAnimationFrame(loop);
 return()=>{alive=false;cancelAnimationFrame(frameID);observer.disconnect();window.removeEventListener('keydown',keys);for(const d of dialogs)d.close();save();};
}

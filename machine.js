import {startGame} from './game-transition.js?v=46';
import {gameRuntime} from './game-runtime.js?v=46';
import {el,sound,finish} from './shared.js?v=46';
import {t} from './i18n.js?v=46';
import {parts,copy,dimensions,compatible,worldSize,WIDTH,HEIGHT,STEP} from './machine-parts.js?v=46';
import {machineLevels,machineChapters,sandbox} from './machine-levels.js?v=46';
import {createMachine,canPlace,validateDraft} from './machine-engine.js?v=46';
import {drawMachine,drawIcon} from './machine-art.js?v=46';
import {edgePan,overviewScale,worldPoint} from './machine-camera.js?v=46';
import {connectionPaths,connectionPathData,returnToTray,hitConnection} from './machine-links.js?v=46';
import {hitPart} from './machine-hit.js?v=46';

const empty=()=>({pieces:[],links:[]});
const defaults=type=>({angle:type==='ramp'?30:0,flip:false});
export function restoreMachine(saved){
  const fresh={version:1,level:0,free:false,completed:[],drafts:{},freeDraft:empty()};
  if(saved?.version!==1)return fresh;
  if(Number.isInteger(saved.level)&&machineLevels[saved.level])fresh.level=saved.level;
  fresh.free=saved.free===true;
  fresh.completed=Array.isArray(saved.completed)?[...new Set(saved.completed.filter(n=>Number.isInteger(n)&&machineLevels[n]))]:[];
  for(const level of machineLevels){
    let draft=saved.drafts?.[level.id];
    // These introductory components are now pre-installed. Keep old fan/rope/belt
    // arrangements and retarget their links rather than discarding the draft.
    const fixedType=level.id==='drive'?'motor':level.id==='sunlight'?'solar':null;
    if(fixedType&&Array.isArray(draft?.pieces)&&Array.isArray(draft?.links)){
      draft=copy(draft);const fixed=level.fixed.find(p=>p.type===fixedType);
      const moved=draft.pieces.filter(p=>p.type===fixedType);
      for(const piece of moved)for(const link of draft.links){if(link.a===piece.id)link.a=fixed.id;if(link.b===piece.id)link.b=fixed.id;}
      draft.pieces=draft.pieces.filter(p=>p.type!==fixedType);
    }
    if(validateDraft(level,draft))fresh.drafts[level.id]=copy(draft);
  }
  if(validateDraft(sandbox,saved.freeDraft,{free:true}))fresh.freeDraft=copy(saved.freeDraft);
  const views={};
  for(const l of [...machineLevels,sandbox]){const v=saved.views?.[l.id],size=worldSize(l);
    if(v&&[v.x,v.y].every(Number.isFinite)&&v.x>=0&&v.y>=0&&v.x<=size.width&&v.y<=size.height&&typeof v.overview==='boolean')views[l.id]={x:v.x,y:v.y,overview:v.overview};}
  if(Object.keys(views).length)fresh.views=views;
  return fresh;
}
export const summary=({read})=>{
  const s=restoreMachine(read('game:machine'));return s.free?sandbox.goal:machineLevels[s.level].goal;
};
export const pageInfo=ctx=>{const s=restoreMachine(ctx.load());return {level:s.free?'sandbox':String(s.level+1)};};
export function mount(root,ctx){
  root.classList.add('play-machine');root.parentElement.classList.add('machine-layout');
  let state=restoreMachine(ctx.load()),level=state.free?sandbox:machineLevels[state.level];
  let draft=copy(state.free?state.freeDraft:state.drafts[level.id]||empty()),history=[];
  let sim=null,mode='edit',selected=null,activeTool=null,drag=null,pointer=null,ghost=null,linkStart=null,linkVia=[],guide=false,alive=true;
  let frame=0,last=0,accumulator=0,announced=false,wonAt=0,nextId=1,trail=new Map(),showTrail=true,speed=1,tab='全部';
  let scale=1,overview=false,clientPointer=null,overviewFocus={x:WIDTH/2,y:HEIGHT/2},editingView=null,completedGoals=0;
  const dialogs=new Set();
  const toolbar=el('div',{class:'game-toolbar mw-toolbar'});
  const levelButton=el('button',{type:'button',class:'mw-level','aria-label':'选择机关关卡',onclick:chooseLevel});
  const hintButton=el('button',{type:'button',class:'mw-small',text:'提示',onclick:()=>{guide=!guide;note(guide?level.hint||'自由实验没有固定解法。':'从道具箱选道具，放到场地中。');refresh();}});
  const freeButton=el('button',{type:'button',class:'mw-small',onclick:()=>switchLevel(state.level,!state.free)});
  const progressBadge=el('span',{class:'mw-goal-progress','aria-label':'目标进度',role:'status'});
  toolbar.append(levelButton,el('div',{class:'mw-toolbar-end'},[progressBadge,hintButton,freeButton]));
  const stage=el('div',{class:'mw-stage','data-testid':'machine-stage'});
  const canvas=el('canvas',{'aria-label':'机关工坊实验场地',role:'img',tabindex:0}),hitLayer=el('div',{class:'mw-hit-layer'});
  const world=el('div',{class:'mw-world'},[canvas,hitLayer]);
  const viewport=el('div',{class:'mw-viewport','aria-label':'可滚动的机关场地'},world);
  const viewButton=el('button',{type:'button',class:'mw-view',text:'全景','aria-label':'查看整个场地',onclick:toggleOverview});
  const outcome=el('div',{class:'mw-outcome',hidden:true});
  stage.append(viewport,viewButton,outcome);
  const inspector=el('div',{class:'mw-inspector','aria-label':'选中道具的设置'});
  const status=el('p',{class:'mw-note','aria-live':'polite',text:'从道具箱选道具，放到场地中。'});
  const shelf=el('div',{class:'mw-shelf'}),categories=el('div',{class:'mw-categories','aria-label':'道具分类'}),tools=el('div',{class:'mw-tools','aria-label':'道具箱'});
  shelf.append(categories,tools);
  const undoButton=el('button',{type:'button',class:'mw-action mw-undo',text:'↶','aria-label':'撤销',onclick:()=>{if(mode!=='edit'||!history.length)return;draft=history.pop();selected=null;activeTool=null;linkStart=null;ghost=null;guide=false;save();refresh();}});
  const runButton=el('button',{type:'button',class:'mw-action mw-run',text:'▶ 试运行','data-testid':'machine-run',onclick:toggleRun});
  const pauseButton=el('button',{type:'button',class:'mw-action mw-pause',text:'Ⅱ','aria-label':'暂停',onclick:()=>{if(!sim)return;mode=mode==='paused'?'running':'paused';ctx.roundPause?.(mode==='paused');last=0;note(mode==='paused'?'实验已暂停，可以返回摆放继续修改。':'机关运行中…');refresh();}});
  const moreButton=el('button',{type:'button',class:'mw-action',text:'⋯','aria-label':'实验选项',onclick:options});
  const bar=el('div',{class:'mw-actionbar'},[undoButton,runButton,pauseButton,moreButton]);
  root.append(toolbar,stage,inspector,status,shelf,bar);
  const c=canvas.getContext('2d');
  function save(){
    const r=viewport.getBoundingClientRect(),focus=overview?overviewFocus:point({clientX:r.left+r.width/2,clientY:r.top+r.height/2});
    const size=worldSize(level);state.views??={};state.views[level.id]=editingView||{x:Math.max(0,Math.min(size.width,focus.x)),y:Math.max(0,Math.min(size.height,focus.y)),overview};
    if(state.free)state.freeDraft=copy(draft);else state.drafts[level.id]=copy(draft);ctx.save(copy(state));
  }
  function all(){return [...level.fixed.map(p=>({...p,fixed:true})),...draft.pieces];}
  function allLinks(){return [...(level.links||[]).map(l=>({...l,fixed:true})),...draft.links];}
  function note(s){status.textContent=t(s);}
  function remember(){history.push(copy(draft));if(history.length>60)history.shift();}
  function unique(){let id;do{id=`p${nextId++}`;}while([...all(),...allLinks()].some(p=>p.id===id));return id;}
  function count(type){const used=draft.pieces.filter(p=>p.type===type).length+draft.links.filter(p=>p.type===type).length;return state.free?(parts[type].link?50-draft.links.length:40-draft.pieces.length):(level.tools[type]||0)-used;}
  function point(event){return worldPoint({x:event.clientX,y:event.clientY},world.getBoundingClientRect(),scale);}
  function inView(event){const r=viewport.getBoundingClientRect();return event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;}
  const inside=p=>{const size=worldSize(level);return p.x>=0&&p.x<=size.width&&p.y>=0&&p.y<=size.height;};
  const fits=p=>canPlace(p,all(),level.target,worldSize(level));
  const snap=p=>({x:Math.round(p.x/10)*10,y:Math.round(p.y/10)*10});
  function hit(p,event,preferConnection=false){
    const direct=event?.target.closest?.('[data-part-id]')?.dataset.partId;
    const placeable=activeTool&&!parts[activeTool].link&&fits({type:activeTool,...snap(p),...defaults(activeTool)});
    return hitPart(p,all(),direct,{placeable,preferConnection});
  }
  function chooseTool(type){if(mode!=='edit'||count(type)<=0)return;activeTool=activeTool===type?null:type;selected=null;linkStart=null;linkVia=[];ghost=null;
    note(activeTool?parts[type].tip:'从道具箱选道具，放到场地中。');refresh();}
  function selectPart(e){
    selected=e.id;activeTool=null;linkStart=null;linkVia=[];ghost=null;note(parts[e.type].tip);
  }
  function place(type,p){
    const candidate={id:unique(),type,...snap(p),...defaults(type)};
    if(count(type)<=0)return false;
    if(!fits(candidate)){note('这里放不下，请避开其他道具和杯子。');return false;}
    remember();draft.pieces.push(candidate);selected=candidate.id;activeTool=null;guide=false;save();sound();note('拖动调整位置，选中后可以旋转或翻转。');refresh();return true;
  }
  function connect(e){
    if(!e||count(activeTool)<=0)return;
    if(activeTool==='rope'&&e.type==='pulley'){
      if(!linkStart){note('先点绳索端点，再依次点滑轮，最后点另一个端点。');return;}
      const last=all().find(p=>p.id===linkVia.at(-1))||linkStart;
      if(linkVia.includes(e.id)||linkVia.length>=6||Math.hypot(e.x-last.x,e.y-last.y)>380){note('滑轮不能重复，每段绳索不能太长。');return;}
      linkVia.push(e.id);selected=e.id;note('已绕过滑轮，继续点滑轮或另一个端点。');refresh();return;
    }
    if(!linkStart){linkStart=e;linkVia=[];selected=e.id;note(activeTool==='rope'?'再点滑轮改变方向，或直接点另一个端点。':'再点另一个可以连接的道具。');refresh();return;}
    if(e.id===linkStart.id){linkStart=null;linkVia=[];selected=null;refresh();return;}
    if(!compatible(linkStart,e,activeTool,linkVia.map(id=>all().find(p=>p.id===id)))){note('这两个道具不能这样连接，或相隔太远。');return;}
    if(allLinks().some(l=>l.type===activeTool&&[l.a,l.b].includes(e.id)&&[l.a,l.b].includes(linkStart.id))){note('这两个道具已经连好了。');return;}
    remember();const link={id:unique(),type:activeTool,a:linkStart.id,b:e.id,...(linkVia.length?{via:[...linkVia]}:{})};draft.links.push(link);linkStart=null;linkVia=[];activeTool=null;selected=link.id;save();sound();note('已连接，试运行看看。');refresh();
  }
  function down(event){
    if(event.button>0||!event.isPrimary||event.target.closest('button:not(.mw-part-hit)'))return;
    event.preventDefault();clientPointer={clientX:event.clientX,clientY:event.clientY};pointer=point(event);
    const nearbyLink=mode==='edit'&&(!activeTool||parts[activeTool].link)?hitConnection(pointer,allLinks(),all(),8/Math.max(.01,scale)):null;
    const e=mode==='edit'?hit(pointer,event,!!nearbyLink):null;
    if(activeTool&&parts[activeTool].link&&e){connect(e);return;}
    const linkId=event.target.closest?.('[data-link-id]')?.dataset.linkId,link=mode==='edit'&&!e&&(nearbyLink||allLinks().find(l=>l.id===linkId));
    // Connections do not occupy space: a selected physical tool may be placed
    // across one (notably scissors on a rope). With no tool armed, tap to select.
    if(link&&(!activeTool||parts[activeTool].link)){selectPart(link);refresh();return;}
    // A placed part stays selectable even while a different tray item is armed.
    if(!e&&activeTool&&!parts[activeTool].link){place(activeTool,pointer);return;}
    if(!e){selected=null;ghost=null;drag={pan:true,start:{x:event.clientX,y:event.clientY},scroll:{x:viewport.scrollLeft,y:viewport.scrollTop},moved:false};stage.setPointerCapture(event.pointerId);refresh();return;}
    selectPart(e);
    if(e.fixed){refresh();return;}
    drag={id:e.id,origin:copy(e),start:{x:event.clientX,y:event.clientY},offset:{x:pointer.x-e.x,y:pointer.y-e.y},moved:false,armed:true};
    stage.setPointerCapture(event.pointerId);refresh();
  }
  function move(event){
    if(gameRuntime.paused)return;
    clientPointer={clientX:event.clientX,clientY:event.clientY};
    if(drag?.pan){drag.moved ||= Math.hypot(event.clientX-drag.start.x,event.clientY-drag.start.y)>6;
      viewport.scrollLeft=drag.scroll.x+drag.start.x-event.clientX;viewport.scrollTop=drag.scroll.y+drag.start.y-event.clientY;pointer=point(event);return;}
    if(mode!=='edit')return;
    pointer=point(event);
    if(!drag){if(activeTool&&!parts[activeTool].link&&inView(event)&&inside(pointer)){ghost={type:activeTool,...snap(pointer),...defaults(activeTool)};ghost.valid=fits(ghost);}else ghost=null;return;}
    drag.moved ||= Math.hypot(event.clientX-drag.start.x,event.clientY-drag.start.y)>6;
    if(drag.tool){ghost={type:drag.tool,...snap(pointer),...defaults(drag.tool)};ghost.valid=inView(event)&&inside(pointer)&&fits(ghost);}
    else if(drag.moved){ghost={...drag.origin,...snap({x:pointer.x-drag.offset.x,y:pointer.y-drag.offset.y})};ghost.valid=inView(event)&&inside(pointer)&&fits(ghost);}
  }
  function up(event){
    if(!drag)return;if(!drag.pan)move(event);const action=drag;drag=null;
    if(action.pan){if(action.moved)save();refresh();return;}
    if(action.tool){if(action.moved&&inView(event)&&inside(point(event)))place(action.tool,point(event));else chooseTool(action.tool);}
    else if(action.moved&&ghost){if(ghost.valid){remember();const {valid,...value}=ghost;draft.pieces[draft.pieces.findIndex(p=>p.id===action.id)]=value;save();note('位置已调整。');}else note('这里放不下，已回到原来的位置。');}
    ghost=null;save();refresh();
  }
  function cancel(){drag=null;ghost=null;pointer=null;clientPointer=null;save();refresh();}
  stage.addEventListener('pointerdown',down);
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);
  function changeSelected(update){
    const e=draft.pieces.find(p=>p.id===selected);if(!e||mode!=='edit')return;
    const next={...e,...update};if(!fits(next)){note('调整后会重叠，请先挪开一点。');return;}
    remember();Object.assign(e,next);save();refresh();
  }
  function removeSelected(){if(mode!=='edit'||!selected)return;const next=returnToTray(draft,selected);if(!next)return;
    remember();draft=next;
    selected=null;activeTool=null;linkStart=null;linkVia=[];ghost=null;note('移回道具箱');save();refresh();}
  function key(event){
    if(gameRuntime.paused)return;
    if(document.querySelector('dialog[open]')||event.target.closest('input,select,textarea')||event.metaKey||event.ctrlKey)return;
    if(event.key==='Escape'){activeTool=null;selected=null;linkStart=null;linkVia=[];ghost=null;refresh();return;}
    if(event.key===' '&&event.target===canvas){event.preventDefault();toggleRun();return;}
    if(mode!=='edit')return;
    if(['Delete','Backspace'].includes(event.key)&&selected){event.preventDefault();removeSelected();return;}
    const e=draft.pieces.find(p=>p.id===selected),offset={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[event.key];
    if(e&&offset){event.preventDefault();changeSelected({x:e.x+offset[0],y:e.y+offset[1]});}
    else if(offset&&!activeTool){event.preventDefault();viewport.scrollLeft+=offset[0]*4*scale;viewport.scrollTop+=offset[1]*4*scale;}
  }
  window.addEventListener('keydown',key);
  function edit(){sim?.dispose();sim=null;return startGame(ctx,'restart',()=>{mode='edit';editingView=null;restoreView();selected=null;activeTool=null;linkStart=null;ghost=null;last=0;accumulator=0;trail.clear();outcome.hidden=true;note('摆法已保留，调整后可以再试。');refresh();});}
  function toggleRun(){
    if(mode!=='edit'){edit();return;}
    save();editingView=copy(state.views[level.id]);sim=createMachine(level,draft);mode='running';completedGoals=0;selected=null;activeTool=null;linkStart=null;ghost=null;guide=false;announced=false;trail.clear();last=0;accumulator=0;
    const size=worldSize(level);if(size.width>WIDTH||size.height>HEIGHT){overview=true;resize();viewport.scrollLeft=0;viewport.scrollTop=0;}
    note('机关运行中…');refresh();
  }
  function showWin(){
    if(announced)return;announced=true;mode='won';wonAt=sim.time;
    if(!state.free)ctx.result?.('won');
    if(!state.free&&!state.completed.includes(state.level)){state.completed.push(state.level);finish('machine');save();}else sound(true);
    const next=el('button',{type:'button',class:'btn',text:state.level<machineLevels.length-1?'下一关':'自由实验',onclick:()=>switchLevel(Math.min(state.level+1,machineLevels.length-1),state.level===machineLevels.length-1,'next')});
    outcome.replaceChildren(el('span',{class:'mw-win-mark',text:'✓'}),el('strong',{text:'机关成功！'}),next);outcome.hidden=false;note('目标完成。摆法和关卡进度已保存。');refresh();
  }
  function refresh(){
    levelButton.replaceChildren(el('span',{class:'mw-number',text:state.free?'∞':String(state.level+1).padStart(2,'0')}),el('span',{text:level.name}),el('span',{text:'⌄'}));
    freeButton.textContent=t(state.free?'关卡挑战':'自由实验');hintButton.hidden=state.free;hintButton.disabled=mode!=='edit';freeButton.disabled=false;
    hintButton.setAttribute('aria-pressed',String(guide));undoButton.disabled=mode!=='edit'||!history.length;
    progressBadge.hidden=!sim||sim.goalStates.length<2;if(sim)progressBadge.textContent=`${sim.goalStates.filter(g=>g.done).length} / ${sim.goalStates.length}`;
    runButton.textContent=t(mode==='edit'?'▶ 试运行':'↶ 返回摆放');pauseButton.hidden=!['running','paused'].includes(mode);pauseButton.textContent=mode==='paused'?'▶':'Ⅱ';pauseButton.setAttribute('aria-label',t(mode==='paused'?'继续运行':'暂停'));
    stage.dataset.mode=mode;stage.dataset.goal=level.target?.type||'';hitLayer.hidden=mode!=='edit';shelf.dataset.free=String(state.free);shelf.classList.toggle('mw-disabled',mode!=='edit');
    const size=worldSize(level);viewButton.hidden=size.width<=WIDTH&&size.height<=HEIGHT;viewButton.textContent=t(overview?'近看':'全景');viewButton.setAttribute('aria-label',t(overview?'返回局部视图':'查看整个场地'));
    inspector.replaceChildren();const e=[...all(),...allLinks()].find(p=>p.id===selected);
    if(e){const d=parts[e.type],heading=el('div',{class:'mw-selection'},el('strong',{text:d.name}));inspector.append(heading);
      if(e.fixed)heading.append(el('small',{text:'固定'}));
      if(!e.fixed&&mode==='edit'){
        heading.append(el('button',{type:'button',class:'mw-delete',text:'移回道具箱',onclick:removeSelected}));
        if(d.rotate){const limited=['seesaw','cannon'].includes(e.type);inspector.append(el('button',{type:'button',text:'↶ 15°','aria-label':'逆时针旋转',disabled:limited&&(e.angle||0)<=-30,onclick:()=>changeSelected({angle:((e.angle||0)-15+540)%360-180})}),el('span',{class:'mw-angle',text:`${e.angle||0}°`}),el('button',{type:'button',text:'↷ 15°','aria-label':'顺时针旋转',disabled:limited&&(e.angle||0)>=30,onclick:()=>changeSelected({angle:((e.angle||0)+15+540)%360-180})}));}
        if(d.flip)inspector.append(el('button',{type:'button',text:'⇄','aria-label':'翻转',onclick:()=>changeSelected({flip:!e.flip})}));
      }
      if(mode==='edit'&&draft.links.some(l=>l.a===e.id||l.b===e.id||l.via?.includes(e.id)))inspector.append(el('button',{type:'button',text:'断开连接',onclick:()=>{remember();draft.links=draft.links.filter(l=>l.a!==e.id&&l.b!==e.id&&!l.via?.includes(e.id));linkStart=null;linkVia=[];activeTool=null;save();refresh();}}));
    }else if(activeTool)inspector.append(el('strong',{text:parts[activeTool].name}),el('small',{text:activeTool==='rope'?'端点 → 滑轮 → 端点':parts[activeTool].link?'依次点两个道具':'点场地放下'}),el('button',{type:'button',text:'取消',onclick:()=>{activeTool=null;linkStart=null;linkVia=[];ghost=null;refresh();}}));
    else inspector.append(el('small',{text:mode==='edit'?(size.width>WIDTH||size.height>HEIGHT?'拖空白查看 · 道具靠边滚动':'拖动摆放 · 点选调整'):'返回摆放后可以继续调整'}));
    categories.replaceChildren();
    if(state.free)for(const name of ['全部','物体','结构','动力','连锁','连接'])categories.append(el('button',{type:'button',text:name,'aria-pressed':String(tab===name),onclick:()=>{tab=name;refresh();}}));
    tools.replaceChildren();
    const available=state.free?Object.keys(parts):Object.keys(level.tools);
    for(const type of available){const d=parts[type];if(state.free&&tab!=='全部'&&d.category!==tab)continue;
      const icon=el('canvas',{'aria-hidden':'true'});drawIcon(icon,type);
      const item=el('button',{type:'button',class:'mw-tool','aria-label':d.name,title:d.tip,'aria-pressed':String(activeTool===type),disabled:mode!=='edit'||count(type)<=0,'data-tool':type,
        onpointerdown:event=>{if(mode!=='edit'||count(type)<=0||event.button>0)return;event.preventDefault();clientPointer={clientX:event.clientX,clientY:event.clientY};drag={tool:type,start:{x:event.clientX,y:event.clientY},moved:false};},
        onclick:event=>{if(event.detail===0)chooseTool(type);}},[icon,el('span',{text:d.name}),el('small',{text:state.free?'':`×${count(type)}`})]);
      tools.append(item);
    }
    hitLayer.replaceChildren();
    const linkHits=document.createElementNS('http://www.w3.org/2000/svg','svg');
    for(const [name,value] of Object.entries({class:'mw-link-hits',viewBox:`0 0 ${size.width} ${size.height}`,role:'group','aria-label':t('连接'),'aria-hidden':String(!allLinks().length)}))linkHits.setAttribute(name,value);
    for(const link of allLinks()){
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      for(const [name,value] of Object.entries({d:connectionPathData(connectionPaths(link,all())),class:'mw-link-hit','data-link-id':link.id,role:'button',tabindex:'0','aria-label':t(parts[link.type].name),'aria-pressed':String(selected===link.id)}))path.setAttribute(name,value);
      const activate=()=>{if(mode==='edit'){selectPart(link);refresh();}};
      path.addEventListener('click',event=>{if(event.detail===0)activate();});
      path.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();activate();}});
      linkHits.append(path);
    }
    hitLayer.append(linkHits);
    for(const p of all()){
      const {w,h}=dimensions(p),hit=el('button',{type:'button',class:'mw-part-hit','data-part-id':p.id,'aria-pressed':String(selected===p.id),'aria-label':`${t(parts[p.type].name)}${p.fixed?' · '+t('固定'):''}`,
        style:`left:${p.x/size.width*100}%;top:${p.y/size.height*100}%;width:${Math.max(w,42)/size.width*100}%;height:${Math.max(h,42)/size.height*100}%;--part-angle:${parts[p.type].rotate?p.angle||0:0}deg`,
        onclick:event=>{if(event.detail===0){if(activeTool&&parts[activeTool].link)connect(p);else{selectPart(p);refresh();}}}});
      hitLayer.append(hit);
    }
    const strip=root.querySelector('.rule-summary');if(strip)strip.textContent=t(level.goal);
  }
  function modal(title){const d=el('dialog',{class:'app-dialog mw-dialog','aria-label':title});d.append(el('div',{class:'dialog-header'},[el('h2',{text:title}),el('button',{type:'button',class:'app-icon',text:'×','aria-label':'关闭',onclick:()=>d.close()})]));
    d.addEventListener('close',()=>{dialogs.delete(d);d.remove();});dialogs.add(d);document.body.append(d);return d;}
  function chooseLevel(){const d=modal('选择机关关卡'),list=el('div',{class:'mw-chapters'});
    for(const chapter of machineChapters){const entries=machineLevels.map((l,index)=>({l,index})).filter(({l})=>l.chapter===chapter.id),grid=el('div',{class:'mw-level-grid'});
      const done=entries.filter(({index})=>state.completed.includes(index)).length;
      list.append(el('h3',{class:'mw-chapter-heading'},[el('span',{text:chapter.name}),el('small',{text:`${done} / ${entries.length}`})]));
      for(const {l,index} of entries)grid.append(el('button',{type:'button',class:'mw-level-option','aria-pressed':String(!state.free&&state.level===index),onclick:()=>{d.close();switchLevel(index,false);}},[
        el('span',{text:String(index+1).padStart(2,'0')}),el('strong',{text:l.name}),el('small',{text:state.completed.includes(index)?'✓':'○'})]));list.append(grid);
    }d.append(list);d.showModal();d.querySelector('[aria-pressed="true"]')?.scrollIntoView({block:'nearest'});}
  function switchLevel(index,free,reason='select'){save();sim?.dispose();sim=null;return startGame(ctx,reason,()=>{mode='edit';editingView=null;state.level=index;state.free=free;level=free?sandbox:machineLevels[index];draft=copy(free?state.freeDraft:state.drafts[level.id]||empty());history=[];selected=null;activeTool=null;ghost=null;drag=null;linkStart=null;linkVia=[];guide=false;trail.clear();last=0;outcome.hidden=true;tab='全部';restoreView();save();refresh();note('从道具箱选道具，放到场地中。');},{level:free?'sandbox':String(index+1)});}
  function options(){const d=modal('实验选项');
    const slow=el('input',{type:'checkbox',checked:speed===.5}),path=el('input',{type:'checkbox',checked:showTrail});
    slow.addEventListener('change',()=>{speed=slow.checked?.5:1;});path.addEventListener('change',()=>{showTrail=path.checked;});
    d.append(el('label',{class:'settings-toggle'},[el('span',{text:'慢动作'}),slow]),el('label',{class:'settings-toggle'},[el('span',{text:'显示运动轨迹'}),path]));
    if(mode==='edit'){
      if(!state.free)d.append(el('button',{type:'button',class:'btn secondary mw-option',text:'查看参考摆法',onclick:()=>{d.close();remember();draft=copy(level.solution);selected=null;activeTool=null;linkStart=null;ghost=null;guide=false;save();refresh();note('这是已验证的参考摆法，也可以自己继续调整。');}}));
      d.append(el('button',{type:'button',class:'btn plain mw-option',text:'清空摆放',onclick:()=>{d.close();return startGame(ctx,'restart',()=>{remember();draft=empty();selected=null;activeTool=null;linkStart=null;save();refresh();});}}));
    }d.showModal();}
  function resize(){
    const size=worldSize(level),view={width:viewport.clientWidth,height:viewport.clientHeight},ratio=Math.min(window.devicePixelRatio||1,2);
    scale=overview?overviewScale(view,size):view.width/WIDTH;
    world.style.width=`${size.width*scale}px`;world.style.height=`${size.height*scale}px`;
    world.style.marginLeft=`${Math.max(0,(view.width-size.width*scale)/2)}px`;world.style.marginTop=`${Math.max(0,(view.height-size.height*scale)/2)}px`;
    canvas.width=Math.round(size.width*scale*ratio);canvas.height=Math.round(size.height*scale*ratio);
    c.setTransform(canvas.width/size.width,0,0,canvas.height/size.height,0,0);
  }
  function toggleOverview(){
    if(!overview){const r=viewport.getBoundingClientRect();overviewFocus=point({clientX:r.left+r.width/2,clientY:r.top+r.height/2});}
    overview=!overview;ghost=null;drag=null;resize();
    viewport.scrollLeft=overview?0:overviewFocus.x*scale-viewport.clientWidth/2;
    viewport.scrollTop=overview?0:overviewFocus.y*scale-viewport.clientHeight/2;
    save();refresh();
  }
  function restoreView(){
    const view=state.views?.[level.id],size=worldSize(level);overview=view?.overview??(!state.free&&(size.width>WIDTH||size.height>HEIGHT));overviewFocus=view?{x:view.x,y:view.y}:{x:WIDTH/2,y:HEIGHT/2};resize();
    viewport.scrollLeft=overview?0:overviewFocus.x*scale-viewport.clientWidth/2;
    viewport.scrollTop=overview?0:overviewFocus.y*scale-viewport.clientHeight/2;
  }
  const observer=new ResizeObserver(resize);observer.observe(stage);
  function animate(now){
    if(!alive||gameRuntime.paused)return;now=gameRuntime.now();const elapsed=last?Math.min(now-last,64):0;last=now;
    if(mode==='edit'&&drag?.moved&&!drag.pan&&!overview&&clientPointer){
      const r=viewport.getBoundingClientRect(),local={x:clientPointer.clientX-r.left,y:clientPointer.clientY-r.top};
      if(local.x>48&&local.x<r.width-48&&local.y>48&&local.y<r.height-48)drag.armed=true;
      drag.edgeWait=(inView(clientPointer)?(drag.edgeWait||0)+elapsed:0);
      if(drag.edgeWait>180)drag.armed=true;
      const next=edgePan({pointer:drag.armed?local:null,
        view:{width:r.width,height:r.height},scroll:{x:viewport.scrollLeft,y:viewport.scrollTop},
        limit:{x:Math.max(0,viewport.scrollWidth-viewport.clientWidth),y:Math.max(0,viewport.scrollHeight-viewport.clientHeight)}},elapsed);
      const changed=Math.abs(next.x-viewport.scrollLeft)+Math.abs(next.y-viewport.scrollTop)>.01;
      viewport.scrollLeft=next.x;viewport.scrollTop=next.y;if(changed)move(clientPointer);
      stage.classList.toggle('mw-edge-pan',changed);
    }else stage.classList.remove('mw-edge-pan');
    if(mode==='running'||mode==='won'&&sim.time<wonAt+3){accumulator+=elapsed*speed;let n=0;while(accumulator>=STEP&&n++<10){sim.step();accumulator-=STEP;}
      if(showTrail&&sim.steps%4<2)for(const e of sim.entities.values())if(e.body&&!e.body.isStatic){const pts=trail.get(e.id)||[];pts.push({x:e.x,y:e.y});if(pts.length>160)pts.shift();trail.set(e.id,pts);}
      const progress=sim.goalStates.filter(g=>g.done).length;
      if(progress!==completedGoals&&mode==='running'){completedGoals=progress;progressBadge.textContent=`${progress} / ${sim.goalStates.length}`;if(sim.goalStates.length>1)status.textContent=`${t('目标进度')} ${progress} / ${sim.goalStates.length}`;}
      if(sim.won&&mode==='running')showWin();else if(!sim.won&&sim.time>(level.timeLimit||16)&&!state.free){mode='finished';ctx.result?.('lost');note('还没有完成目标，返回摆放再调整一下。');refresh();}
      if(state.free&&sim.time>30){mode='paused';note('实验已暂停，可以返回摆放继续修改。');refresh();}
    }
    const decorativeMotion=document.documentElement.dataset.motion!=='off'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock=sim?.time||(decorativeMotion?now/1000:0);
    const pieces=sim?[...sim.entities.values()]:all().filter(e=>!drag?.moved||e.id!==drag.id);
    const guides=guide&&level.tutorial?level.solution.pieces.filter(p=>!draft.pieces.some(q=>q.type===p.type&&Math.hypot(q.x-p.x,q.y-p.y)<16)).map(p=>({...p,id:'guide-'+p.id})):[];
    drawMachine(c,{...worldSize(level),scene:level.scene,pieces,links:sim?sim.connections:allLinks(),effects:sim?.effects||[],target:level.target,goalStates:sim?.goalStates,time:clock,won:!!sim?.won,selected,ghost,guide:guides,mode:sim?'run':'edit',linkStart,linkVia,pointer,trail:showTrail?[...trail.values()]:[]});
    frame=requestAnimationFrame(animate);
  }
  restoreView();refresh();
  const unsubscribe=gameRuntime.subscribe(paused=>{
    cancelAnimationFrame(frame);last=0;accumulator=0;
    // Discard an interrupted drag, preserving the arrangement and manual pause.
    if(paused){drag=null;ghost=null;pointer=null;clientPointer=null;stage.classList.remove('mw-edge-pan');}
    else if(alive)frame=requestAnimationFrame(animate);
  });
  return()=>{alive=false;unsubscribe();cancelAnimationFrame(frame);sim?.dispose();save();observer.disconnect();stage.removeEventListener('pointerdown',down);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);window.removeEventListener('keydown',key);for(const d of dialogs)d.close();};
}

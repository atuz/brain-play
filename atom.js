import {el,button,controls,keyboardAndSwipe,sound,finish} from './shared.js?v=48';
import {t} from './i18n.js?v=48';
import {createMotion,motionEnabled} from './motion.js?v=48';
import {gameRuntime} from './game-runtime.js?v=48';
import {startGame} from './game-transition.js?v=48';
import {atomLevels} from './atom-levels.js?v=48';
import {createAtomState,validAtomState,atomSlide,atomDestination,atomCopy,atomGuideFits,bondDirections} from './atom-engine.js?v=48';
import {atomArt,atomModelSVG} from './atom-art.js?v=48';
import {laserTileArt,laserSVG} from './laser-art.js?v=48';

export function restoreAtom(saved){
  const level=Number.isInteger(saved?.level)&&atomLevels[saved.level]?saved.level:0,l=atomLevels[level];
  const history=key=>Array.isArray(saved?.[key])?saved[key].filter(s=>validAtomState(s,l)).slice(-80):[];
  return {version:1,level,state:validAtomState(saved?.state,l)?atomCopy(saved.state):createAtomState(l),history:history('history'),future:history('future'),completed:Array.isArray(saved?.completed)?[...new Set(saved.completed.filter(n=>Number.isInteger(n)&&atomLevels[n]))]:[]};
}
export const pageInfo=ctx=>({level:String(restoreAtom(ctx.load()).level+1)});
export function mount(root,ctx){
  root.classList.add('play-atom');
  let data=restoreAtom(ctx.load()),level=atomLevels[data.level],state=data.state,alive=true,busy=false,epoch=0,guide=false,guideAnchor={x:1,y:1},pointer=null,suppressClick=false;
  const motion=createMotion(),dialogs=new Set(),tokens=new Map();
  const levelButton=el('button',{type:'button',class:'classic-level','aria-label':'选择分子关卡',onclick:choose});
  const restart=button('重来',()=>void switchLevel(data.level,'restart'),'plain');
  const undo=button('撤销',()=>rewind(false),'plain'),redo=button('重做',()=>rewind(true),'plain');
  const toolbar=el('div',{class:'game-toolbar classic-toolbar'},[levelButton,el('div',{class:'classic-actions'},restart)]);
  const model=el('button',{type:'button',class:'atom-model','aria-label':'显示目标比对',onclick:()=>{guide=!guide;draw();}});
  const count=el('strong'),best=el('span',{class:'atom-minimum'});
  const goalBar=el('div',{class:'atom-goalbar'},[el('div',{},[el('span',{class:'atom-goal-label',text:'目标图案'}),model]),el('div',{class:'atom-counters'},[el('div',{},[el('span',{text:'步数'}),count]),best])]);
  const board=el('div',{class:'classic-board atom-board','data-testid':'atom-board','aria-label':'分子拼图棋盘',tabindex:0});
  const terrain=el('div'),destinations=el('div',{class:'atom-destinations'}),guideLayer=el('div',{class:'atom-guide'});board.append(terrain,destinations,guideLayer);
  const stage=el('div',{class:'classic-stage'},board),outcome=el('div',{class:'classic-overlay',hidden:true});stage.append(outcome);
  const pad=controls(d=>void act(d)),compare=button('比对模型',()=>{guide=!guide;draw();},'plain');
  const note=el('p',{class:'classic-note','aria-live':'polite'});
  root.append(toolbar,goalBar,stage,el('div',{class:'classic-footer'},[pad,el('div',{class:'atom-tools'},[el('div',{},[undo,redo]),compare])]),note);
  function save(){data.state=state;ctx.save(data);}
  function cancel(){epoch++;busy=false;pointer=null;for(const a of gameRuntime.animationsFor(board,{subtree:true}))a.cancel();}
  function rewind(forward){const source=forward?data.future:data.history,target=forward?data.history:data.future;if(!source.length)return;cancel();target.push(atomCopy(state));state=source.pop();draw();save();}
  async function switchLevel(index,reason='select'){
    if(!atomLevels[index])return;
    await startGame(ctx,reason,()=>{cancel();data.level=index;level=atomLevels[index];state=createAtomState(level);data.history=[];data.future=[];guide=false;guideAnchor={x:1,y:1};draw();save();},{level:String(index+1)});
  }
  function choose(){
    if(dialogs.size)return;const modal=el('dialog',{class:'app-dialog','aria-label':'选择分子关卡'}),grid=el('div',{class:'classic-pick'});
    atomLevels.forEach((l,i)=>grid.append(el('button',{type:'button','aria-current':String(i===data.level),onclick:()=>{modal.close();void switchLevel(i);}},[el('strong',{text:`${data.completed.includes(i)?'✓ ':''}${i+1}`}),el('small',{text:l.name})])));
    modal.append(el('h2',{text:'分子拼图'}),grid,button('关闭',()=>modal.close(),'plain'));dialogs.add(modal);document.body.append(modal);modal.addEventListener('close',()=>{dialogs.delete(modal);modal.remove();},{once:true});modal.showModal();
  }
  function select(id){if(busy||state.phase!=='playing'||gameRuntime.paused)return;state.selected=id;draw();save();}
  function draw(){
    levelButton.replaceChildren(el('strong',{text:String(data.level+1).padStart(2,'0')}),el('span',{text:level.name}),el('small',{text:`${data.completed.length}/${atomLevels.length}⌄`}));
    model.innerHTML=atomModelSVG(level.goal);model.style.height=Math.max(...level.goal.map(a=>a.y))>=2?'96px':'68px';model.setAttribute('aria-pressed',String(guide));
    count.textContent=state.moves;best.textContent=level.minimum!==undefined?`${t('最少')} ${level.minimum}`:'';
    board.style.setProperty('--columns',level.w);board.style.setProperty('--rows',level.h);
    const connections=[];
    for(const a of state.atoms)for(let d=0;d<8;d++)if(a.bonds[d]){
      const [dx,dy]=bondDirections[d],b=state.atoms.find(b=>b.x===a.x+dx&&b.y===a.y+dy&&b.bonds[(d+4)%8]===a.bonds[d]);
      if(b&&a.id<b.id)connections.push(`<path d="M${a.x*50+25} ${a.y*50+25}L${b.x*50+25} ${b.y*50+25}" stroke="#739c78" stroke-width="8" opacity=".4" stroke-linecap="round"/>`);
    }
    terrain.innerHTML=`<svg class="classic-tiles" viewBox="0 0 ${level.w*50} ${level.h*50}" aria-hidden="true">${level.tiles.map((type,i)=>`<g transform="translate(${i%level.w*50} ${Math.floor(i/level.w)*50})">${laserTileArt(type,i%level.w,Math.floor(i/level.w))}</g>`).join('')}${connections.join('')}</svg>`;
    const ids=new Set(state.atoms.map(a=>a.id));for(const [id,node]of tokens)if(!ids.has(id)){node.remove();tokens.delete(id);}
    for(const a of state.atoms){let node=tokens.get(a.id);if(!node){node=el('button',{type:'button',class:'classic-piece atom-piece','data-atom':a.id,onclick:()=>{if(suppressClick){suppressClick=false;return;}select(a.id);}});tokens.set(a.id,node);board.append(node);}
      node.style.cssText=`width:${100/level.w}%;height:${100/level.h}%;left:${a.x/level.w*100}%;top:${a.y/level.h*100}%`;
      node.setAttribute('aria-label',`${a.element} · ${a.id.slice(1)} · ${a.bonds.map((n,i)=>n?`${['↑','↗','→','↘','↓','↙','←','↖'][i]}${n}`:'').filter(Boolean).join(' ')}`);
      node.setAttribute('aria-pressed',String(a.id===state.selected));node.innerHTML=laserSVG(atomArt(a));node.disabled=busy||state.phase!=='playing';
    }
    destinations.replaceChildren();
    for(const key of pad.children){const d=key.dataset.direction,end=atomDestination(level,state.atoms,state.selected,d);key.disabled=busy||state.phase!=='playing'||!end;
      if(end&&state.phase==='playing'&&!busy){const arrow=el('button',{type:'button',class:'atom-end',text:{up:'↑',right:'→',down:'↓',left:'←'}[d],'aria-label':{up:'向上',right:'向右',down:'向下',left:'向左'}[d],onclick:()=>void act(d)});arrow.style.cssText=`left:${end.x/level.w*100}%;top:${end.y/level.h*100}%;width:${100/level.w}%;height:${100/level.h}%`;destinations.append(arrow);}}
    guideLayer.replaceChildren();
    if(guide){const fit=atomGuideFits(level,guideAnchor),w=Math.max(...level.goal.map(a=>a.x))+1,h=Math.max(...level.goal.map(a=>a.y))+1;
      guideLayer.innerHTML=`<svg class="classic-tiles" viewBox="0 0 ${level.w*50} ${level.h*50}" aria-hidden="true"><g opacity=".4" transform="translate(${guideAnchor.x*50} ${guideAnchor.y*50})"><rect x="-1" y="-1" width="${w*50+2}" height="${h*50+2}" rx="8" fill="${fit?'#b7d8a5':'#e9b7a1'}" stroke="${fit?'#547e5c':'#ad6654'}" stroke-width="2" stroke-dasharray="5 4"/>${level.goal.map(a=>`<g transform="translate(${a.x*50} ${a.y*50})">${atomArt(a,{ghost:true})}</g>`).join('')}</g></svg>`;
      const handle=el('button',{type:'button',class:'atom-guide-handle',text:'✥','aria-label':'移动比对模型','data-guide':'true'});handle.style.cssText=`left:${guideAnchor.x/level.w*100}%;top:${guideAnchor.y/level.h*100}%`;guideLayer.append(handle);
    }
    compare.textContent=t(guide?'收起比对':'比对模型');undo.disabled=!data.history.length;redo.disabled=!data.future.length;
    note.textContent=t(state.phase==='won'?'分子拼好了！':guide?'拖动 ✥ 比对目标；比对不计步。':state.selected?'选一个方向，滑到高亮位置。':'点一颗原子，再滑动或点方向。');
    outcome.hidden=busy||state.phase!=='won';
    if(!outcome.hidden)outcome.replaceChildren(el('div',{class:'classic-outcome'},[el('h2',{text:'分子拼好了！'}),el('p',{text:level.formula}),button(data.level+1<atomLevels.length?'下一关':'再玩一次',()=>void switchLevel(data.level+1<atomLevels.length?data.level+1:0,'next'))]));
  }
  async function act(direction){
    if(busy||!alive||gameRuntime.paused||!state.selected)return;
    const id=state.selected,result=atomSlide(level,state,id,direction);if(!result.changed)return;
    data.history.push(atomCopy(state));if(data.history.length>80)data.history.shift();data.future=[];state=result.state;save();busy=true;
    const ticket=++epoch;draw();sound();
    const rect=board.getBoundingClientRect();await motion.play(tokens.get(id),[{transform:`translate(${(result.from.x-result.to.x)*rect.width/level.w}px,${(result.from.y-result.to.y)*rect.height/level.h}px)`},{transform:'translate(0,0)'}],Math.min(480,130+result.distance*55));
    if(!alive||ticket!==epoch)return;busy=false;
    if(state.phase==='won'){if(!data.completed.includes(data.level))data.completed.push(data.level);ctx.result?.('won',{moves:state.moves,assisted:false,score:Math.max(0,1000-state.moves*10)});finish('atom');save();}
    draw();
  }
  const removeInput=keyboardAndSwipe(board,d=>void act(d),{swipe:false});
  const down=e=>{if(gameRuntime.paused||busy||e.button>0)return;const guideMove=e.target.closest('[data-guide]');pointer={x:e.clientX,y:e.clientY,id:e.pointerId,guide:!!guideMove,anchor:{...guideAnchor},atom:e.target.closest('[data-atom]')?.dataset.atom};(guideMove?board:e.target).setPointerCapture?.(e.pointerId);};
  const move=e=>{if(!pointer||e.pointerId!==pointer.id||!pointer.guide)return;const r=board.getBoundingClientRect();guideAnchor={x:Math.max(0,Math.min(level.w-1,pointer.anchor.x+Math.round((e.clientX-pointer.x)/r.width*level.w))),y:Math.max(0,Math.min(level.h-1,pointer.anchor.y+Math.round((e.clientY-pointer.y)/r.height*level.h)))};draw();};
  const up=e=>{if(!pointer||e.pointerId!==pointer.id)return;const p=pointer;pointer=null;if(p.guide)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.max(Math.abs(dx),Math.abs(dy))<18)return;suppressClick=true;if(p.atom)state.selected=p.atom;void act(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up').finally(()=>{suppressClick=false;});};
  const cancelPointer=()=>{pointer=null;suppressClick=false;};
  board.addEventListener('pointerdown',down);board.addEventListener('pointermove',move);board.addEventListener('pointerup',up);board.addEventListener('pointercancel',cancelPointer);
  const pause=gameRuntime.subscribe(paused=>{if(paused)cancelPointer();});
  const keys=e=>{if(gameRuntime.paused||document.querySelector('dialog[open]')||e.target.closest('input,select,textarea')||e.ctrlKey||e.metaKey||e.altKey)return;if(['z','Z'].includes(e.key)){e.preventDefault();rewind(false);}if(['y','Y'].includes(e.key)){e.preventDefault();rewind(true);}};
  window.addEventListener('keydown',keys);draw();save();
  return()=>{alive=false;cancel();pause();removeInput();motion.dispose();window.removeEventListener('keydown',keys);for(const [name,fn]of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancelPointer]])board.removeEventListener(name,fn);for(const d of dialogs)d.close();};
}

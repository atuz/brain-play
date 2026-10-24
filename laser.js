import {el,button,controls,keyboardAndSwipe,sound,finish} from './shared.js?v=48';
import {t} from './i18n.js?v=48';
import {createMotion,motionEnabled} from './motion.js?v=48';
import {gameRuntime} from './game-runtime.js?v=48';
import {startGame} from './game-transition.js?v=48';
import {laserLevels} from './laser-levels.js?v=48';
import {createLaserState,validLaserState,laserAction,laserCopy} from './laser-engine.js?v=48';
import {laserTileArt,laserActorArt,laserSVG} from './laser-art.js?v=48';

export function restoreLaser(saved){
  const level=Number.isInteger(saved?.level)&&laserLevels[saved.level]?saved.level:0;
  const current=laserLevels[level],state=validLaserState(saved?.state,current)?laserCopy(saved.state):createLaserState(current);
  return {version:1,level,state,history:Array.isArray(saved?.history)?saved.history.filter(s=>validLaserState(s,current)).slice(-80):[],
    completed:Array.isArray(saved?.completed)?[...new Set(saved.completed.filter(n=>Number.isInteger(n)&&laserLevels[n]))]:[]};
}
export const pageInfo=ctx=>({level:String(restoreLaser(ctx.load()).level+1)});
export function mount(root,ctx){
  root.classList.add('play-laser');
  let data=restoreLaser(ctx.load()),state=data.state,level=laserLevels[data.level],epoch=0,busy=false,alive=true,delay=null,hint=false;
  const motion=createMotion(),dialogs=new Set(),pieces=new Map();
  const levelButton=el('button',{type:'button',class:'classic-level','aria-label':'选择激光关卡',onclick:choose});
  const undo=button('撤销',()=>{if(!data.history.length)return;cancel();state=data.history.pop();data.state=state;draw(state);save();});
  const restart=button('重来',()=>switchLevel(data.level,'restart'),'plain');
  const hintButton=button('提示',()=>{hint=!hint;hintNode.hidden=!hint;hintNode.textContent=t(level.hint);},'plain');
  const toolbar=el('div',{class:'game-toolbar classic-toolbar'},[levelButton,el('div',{class:'classic-actions'},[hintButton,restart])]);
  const hintNode=el('p',{class:'classic-hint',hidden:true});
  const moves=el('strong'),shots=el('strong');
  const stats=el('div',{class:'classic-stats'},[el('span',{},[el('span',{text:'步数'}),moves]),el('span',{},[el('span',{text:'发射'}),shots])]);
  const stage=el('div',{class:'classic-stage','data-testid':'laser-stage'});
  const board=el('div',{class:'classic-board',role:'img','aria-label':'激光坦克棋盘',tabindex:0});
  const terrain=el('div'),beamLayer=el('div');board.append(terrain,beamLayer);
  const outcome=el('div',{class:'classic-overlay',hidden:true});stage.append(board,outcome);
  const pad=controls(command=>void act(command));
  const fire=button('◎ 发射',()=>void act('fire'),'classic-fire');fire.dataset.testid='laser-fire';
  const note=el('p',{class:'classic-note','aria-live':'polite'});
  const legend=el('details',{class:'classic-legend'},[el('summary',{text:'机关图鉴'})]);
  const descriptions=[
    ['brick','砖墙','一发摧毁一格，光束就此停止。'],['box','方块','射击推动；落水变成桥。'],
    ['mirror','普通镜','银面反射，背面受击会平移。'],['rotary','旋转镜','银面反射，背面受击顺时针转动。'],
    ['crystal','水晶','坦克不能通过；你的光能穿过，敌炮视线被挡住。'],['enemy','敌炮','正面射毁，侧后方射击推动；进入视线会被击中。'],
    ['ice','普通冰','持续滑行，直到离开冰面或被挡住。'],['thin','薄冰','经过后变水，停在薄冰上也会下沉。'],
    ['mover:1','运送格','只运送坦克，保留炮管朝向。'],['portal:0','传送门','同色相连；出口被占用就等在入口。'],
  ];
  const objects=el('div',{class:'classic-object-list'});
  for(const [type,name,text]of descriptions){const icon=el('span');icon.innerHTML=laserSVG(['box','mirror','rotary','enemy'].includes(type)?laserActorArt({type,face:'SE',dir:2}):laserTileArt(type,0,0));objects.append(el('div',{class:'classic-object'},[icon,el('span',{},[el('strong',{text:name}),el('span',{text})])]));}
  legend.append(objects);
  root.append(toolbar,hintNode,stats,stage,el('div',{class:'classic-footer'},[pad,el('div',{},[fire,el('div',{style:'margin-top:10px;text-align:right'},undo)])]),note,legend);
  function save(){data.state=state;ctx.save(data);}
  function cancel(){epoch++;delay?.cancel();delay=null;busy=false;for(const a of gameRuntime.animationsFor(board,{subtree:true}))a.cancel();}
  async function switchLevel(index,reason='select'){
    if(!laserLevels[index])return;
    await startGame(ctx,reason,()=>{cancel();data.level=index;level=laserLevels[index];state=createLaserState(level);data.history=[];hint=false;hintNode.hidden=true;draw(state);save();},{level:String(index+1)});
  }
  function choose(){
    if(dialogs.size)return;
    const modal=el('dialog',{class:'app-dialog','aria-label':'选择激光关卡'}),close=button('关闭',()=>modal.close(),'plain');
    const grid=el('div',{class:'classic-pick'});
    laserLevels.forEach((l,i)=>grid.append(el('button',{type:'button','aria-current':String(i===data.level),onclick:()=>{modal.close();void switchLevel(i);}},[el('strong',{text:`${data.completed.includes(i)?'✓ ':''}${i+1}`}),el('small',{text:l.name})])));
    modal.append(el('h2',{text:'激光坦克'}),grid,close);document.body.append(modal);dialogs.add(modal);
    modal.addEventListener('close',()=>{dialogs.delete(modal);modal.remove();},{once:true});modal.showModal();
  }
  function draw(s,frame){
    levelButton.replaceChildren(el('strong',{text:String(data.level+1).padStart(2,'0')}),el('span',{text:level.name}),el('small',{text:`${data.completed.length}/${laserLevels.length}⌄`}));
    board.style.setProperty('--columns',s.w);board.style.setProperty('--rows',s.h);
    terrain.innerHTML=`<svg class="classic-tiles" viewBox="0 0 ${s.w*50} ${s.h*50}" aria-hidden="true">${s.tiles.map((tile,i)=>`<g transform="translate(${i%s.w*50} ${Math.floor(i/s.w)*50})">${laserTileArt(tile,i%s.w,Math.floor(i/s.w))}</g>`).join('')}</svg>`;
    const visible=[{...s.tank,id:'tank',type:'tank'},...s.actors],ids=new Set(visible.map(a=>a.id));
    for(const [id,node]of pieces)if(!ids.has(id)){node.remove();pieces.delete(id);}
    const moving=[];
    for(const a of visible){
      let node=pieces.get(a.id);const before=node?{x:Number(node.dataset.x),y:Number(node.dataset.y)}:null;
      if(!node){node=el('div',{class:'classic-piece','data-actor':a.id});pieces.set(a.id,node);board.append(node);}
      node.style.cssText=`width:${100/s.w}%;height:${100/s.h}%;left:${a.x/s.w*100}%;top:${a.y/s.h*100}%`;
      node.dataset.x=a.x;node.dataset.y=a.y;node.innerHTML=laserSVG(laserActorArt(a));
      if(frame&&before&&(before.x!==a.x||before.y!==a.y)){
        const rect=board.getBoundingClientRect(),teleport=frame.kind==='teleport';
        moving.push(motion.play(node,teleport?[{opacity:.1,transform:'scale(.45)'},{opacity:1,transform:'scale(1)'}]:[{transform:`translate(${(before.x-a.x)*rect.width/s.w}px,${(before.y-a.y)*rect.height/s.h}px)`},{transform:'translate(0,0)'}],teleport?180:100));
      }
    }
    beamLayer.innerHTML=frame?.beam?`<svg class="classic-beams" viewBox="0 0 ${s.w*50} ${s.h*50}" aria-hidden="true"><polyline points="${frame.beam.map(p=>`${p.x*50+25},${p.y*50+25}`).join(' ')}" fill="none" stroke="${s.reason==='enemy'?'#c35e4d':'#f5d25e'}" stroke-width="7" opacity=".3" stroke-linejoin="round"/><polyline points="${frame.beam.map(p=>`${p.x*50+25},${p.y*50+25}`).join(' ')}" fill="none" stroke="${s.reason==='enemy'?'#b74e40':'#fbf0a1'}" stroke-width="3" stroke-linejoin="round"/></svg>`:'';
    moves.textContent=s.moves;shots.textContent=s.shots;undo.disabled=!data.history.length;
    fire.disabled=busy||s.phase!=='playing';for(const b of pad.children)b.disabled=busy||s.phase!=='playing';
    outcome.hidden=busy||s.phase==='playing';
    if(!outcome.hidden){
      const won=s.phase==='won';
      const actions=won?[button(data.level+1<laserLevels.length?'下一关':'再玩一次',()=>void switchLevel(data.level+1<laserLevels.length?data.level+1:0,'next'))]:[button('撤销',()=>undo.click()),button('重来',()=>void switchLevel(data.level,'restart'),'plain')];
      outcome.replaceChildren(el('div',{class:'classic-outcome'},[el('h2',{text:won?'到达终点！':'再试一次'}),el('p',{text:won?'光路接通，任务完成。':failure(s.reason)}),...actions]));
    }
    const msg=s.phase==='lost'?failure(s.reason):s.reason==='cycle'?'运送路线形成循环，可以撤销。':s.phase==='won'?'到达终点！':s.tank.waiting?'出口被占用，先把另一端清空。':data.level===0?'方向不同先转向，再按前进；◎ 发射。':'';
    note.textContent=t(msg);note.className=`classic-note${s.phase==='won'?' success':''}`;
    return moving;
  }
  function failure(reason){return {water:'落水了，撤销后换条路线。',enemy:'进入敌炮视线了。',self:'反射的激光击中了自己。'}[reason]||'再试一次';}
  async function act(command){
    if(busy||!alive||gameRuntime.paused||state.phase!=='playing')return;
    const result=laserAction(state,command);if(!result.changed)return;
    data.history.push(laserCopy(state));if(data.history.length>80)data.history.shift();state=result.state;save();
    const ticket=++epoch;busy=true;sound();
    for(const frame of result.frames){
      if(ticket!==epoch||!alive)return;
      const animations=draw(frame.state,frame);
      if(motionEnabled()){
        delay=gameRuntime.delay(frame.kind==='beam'?35:frame.kind==='rotate'||frame.kind==='break'?130:animations.length?0:45);
        await Promise.all([...animations,delay.finished]);delay=null;
      }
    }
    if(ticket!==epoch||!alive)return;
    busy=false;
    if(state.phase==='won'){
      if(!data.completed.includes(data.level))data.completed.push(data.level);
      ctx.result?.('won',{moves:state.moves,score:Math.max(0,1000-state.moves*5-state.shots*15),assisted:hint});finish('laser');save();
    }
    draw(state);
  }
  const removeInput=keyboardAndSwipe(board,c=>void act(c));
  const key=e=>{if(!gameRuntime.paused&&!document.querySelector('dialog[open]')&&!e.target.closest('input,select,textarea')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){if([' ','f','F'].includes(e.key)){if(e.key===' '&&e.target.closest('button,a,summary,[role="button"]'))return;e.preventDefault();void act('fire');}if(['u','U','z','Z'].includes(e.key)){e.preventDefault();undo.click();}}};
  window.addEventListener('keydown',key);draw(state);save();
  return()=>{alive=false;cancel();removeInput();window.removeEventListener('keydown',key);motion.dispose();for(const d of dialogs)d.close();};
}

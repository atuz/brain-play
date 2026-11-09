import {baseDominoTiming} from './domino-timing.js?v=2';
// Ascender-only DOM and animation parameters. Ordinary tile classes are not
// attached here, so edits to their fall/landing CSS cannot animate this tile.
import {el} from './shared.js?v=48';
import {dominoArtwork} from './domino-material.js?v=53';

// Matrices use a fixed outer corner and an origin at the face's top left.
// At 90 degrees this exactly matches the mounted top-corner pose. At 180
// degrees its bounds are one body-height sideways and one thickness down.
export function ascenderEscapePose(width,height,dir,degrees){
  const angle=-dir*degrees*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const cornerX=dir>0?0:width;
  const pivotX=dir>0?width+height:-height,pivotY=width;
  return `matrix(${c},${s},${-s},${c},${pivotX-c*cornerX+s*height},${pivotY-s*cornerX-c*height})`;
}
const escapes=new WeakMap();

export function createAscenderNode(piece) {
  if(piece?.type!=='ascender')throw new TypeError('Ascender view requires an ascender');
  const face=el('span',{class:'dc-ascender-face'});
  face.innerHTML=`<span class="dc-ascender-art">${dominoArtwork({type:'ascender'})}</span>`;
  return el('div',{class:'dc-ascender-piece dc-ascender','data-stone-id':piece.id},[
    face,el('small',{class:'dc-problem-label',hidden:'hidden'}),
  ]);
}

export function renderAscender(node,piece,{level,selected,guideSource,problem,problemText,place,timing=baseDominoTiming}) {
  if(piece?.type!=='ascender')return false;
  const stage=piece.state||'upright';
  const previous=node.dataset.stage;
  const face=node.querySelector('.dc-ascender-face');
  const activeEscape=escapes.get(node);
  if(stage==='ascending'&&previous==='ceiling-escape'&&activeEscape&&!activeEscape.complete){
    // The simulation can cross a beat before the browser paints the final
    // rotation frame. Keep the old anchor until that frame actually finishes.
    activeEscape.pending={piece:{...piece},options:{level,selected,guideSource,problem,problemText,place,timing}};
    return {x:activeEscape.x,y:activeEscape.y};
  }
  if(stage==='upright')delete node.dataset.risen;
  if(face?.style&&stage==='ceiling-escape'&&previous!==stage){
    const dimensions=getComputedStyle(face);
    const width=parseFloat(dimensions.width),height=parseFloat(dimensions.height);
    const escape={width,height,x:piece.x,y:piece.y,animation:null,complete:false,pending:null};
    escapes.set(node,escape);
    face.style.transformOrigin='0 0';face.style.transition='none';
    const to=ascenderEscapePose(width,height,piece.dir||1,180);
    face.style.transform=to;
    // Interpolating only two matrices moves the pivot: translation must
    // follow the same circular arc as rotation throughout the quarter-turn.
    const keyframes=Array.from({length:91},(_,i)=>({transform:ascenderEscapePose(width,height,piece.dir||1,90+i),offset:i/90}));
    const animation=face.animate(keyframes,{duration:timing.quarter,easing:'linear',fill:'both'});
    // WAAPI otherwise starts on the next painted frame, while the engine's
    // two beats start now. Keep both clocks aligned through the re-anchor.
    animation.startTime=performance.now();
    escape.animation=animation;
    animation.finished.then(()=>{
      escape.complete=true;
      if(escapes.get(node)!==escape||node.dataset.stage!=='ceiling-escape'||!escape.pending)return;
      const pending=escape.pending;escape.pending=null;
      const placement=renderAscender(node,pending.piece,pending.options);
      pending.options.place?.(placement);
    }).catch(()=>{});
  }else if(face?.style&&previous==='ceiling-escape'&&stage==='ascending'){
    const escape=escapes.get(node);
    escape?.animation?.cancel();
    node.dataset.risen='true';
    face.style.transformOrigin='';face.style.transition='none';
    face.style.transform=`translateY(${escape?.width||0}px)`;
    // The rotation has already moved the body sideways. Snap only its
    // invisible coordinate anchor, while vertical travel starts at once.
    node.style.transition=`top ${timing.rise}ms linear`;
    void face.offsetHeight;
  }else if(face?.style&&stage!=='ascending'&&stage!=='ceiling-escape'){
    escapes.get(node)?.animation?.cancel();
    face.style.transform='';face.style.transformOrigin='';face.style.transition='';
  }
  node.dataset.stage=stage;
  node.dataset.inverted=String(!!piece.inverted);
  node.className=`dc-ascender-piece dc-ascender da-${stage}`;
  node.classList.toggle('da-mounted',['ceiling','ceiling-return','ceiling-reversing','ceiling-escape'].includes(stage)||(stage==='ascending'&&node.dataset.risen==='true'));
  node.classList.toggle('dc-selected',!!selected);
  node.classList.toggle('dc-guide-source',!!guideSource);
  node.classList.toggle('dc-problem',!!problem);
  node.dataset.edge=piece.x===0?'left':piece.x===level.width-1?'right':'';
  node.style.zIndex=10;
  node.style.setProperty('--da-dir',piece.dir||1);
  node.style.setProperty('--da-rise-duration',`${timing.rise}ms`);
  node.style.setProperty('--da-travel',stage==='ascending'?`${timing.rise}ms`:'150ms');
  if(['ceiling','ceiling-return','ceiling-reversing'].includes(stage)) {
    const up=level.platforms.find(([y,a,b])=>y===piece.y-1&&piece.x>=a&&piece.x<=b);
    node.style.setProperty('--da-ceiling-shift',`${18-(up?.[3]||0)}px`);
    node.style.setProperty('--da-angle',`${piece.ceilingAngle??90}deg`);
    node.style.setProperty('--da-duration',`${stage==='ceiling-return'?timing.contact:piece.ceilingTravel||timing.quarter}ms`);
  }
  const label=node.querySelector('.dc-problem-label');
  label.hidden=!problem;label.textContent=problemText;
  return {x:piece.x,y:piece.y};
}

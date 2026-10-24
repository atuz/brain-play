import {motionEnabled} from './motion.js?v=48';
import {gameRuntime,animationFinished} from './game-runtime.js?v=48';
import {dominoMaterial} from './domino-material.js?v=48';

// Original vector character: four walking legs and two working arms.
export const antArtwork=`<div class="dc-ant-facing"><svg class="dc-ant-art" viewBox="0 0 80 100" aria-hidden="true">
<defs><linearGradient id="dc-ant-shell" x2=".9" y2="1"><stop stop-color="#d6a569"/><stop offset="1" stop-color="#a56a3d"/></linearGradient><linearGradient id="dc-ant-abdomen" x2=".7" y2="1"><stop stop-color="#a87849"/><stop offset="1" stop-color="#6c482f"/></linearGradient></defs>
<ellipse class="dc-ant-shadow" cx="38" cy="94" rx="19" ry="3" fill="#4b3629" opacity=".16"/>
<g class="dc-ant-doll" stroke="#513c2d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">
 <g class="dc-leg dc-leg-far"><path d="M29 64Q39 73 42 83L37 92 43 93"/></g>
 <g class="dc-leg dc-leg-back"><path d="M26 65L17 78 13 91 8 93"/></g>
 <g class="dc-ant-torso"><ellipse cx="23" cy="66" rx="16" ry="12" transform="rotate(-23 23 66)" fill="url(#dc-ant-abdomen)"/><path d="M14 63Q19 57 25 58" stroke="#d5ac72" stroke-width="2" opacity=".7"/><ellipse cx="36" cy="55" rx="9" ry="14" fill="url(#dc-ant-shell)"/></g>
 <g class="dc-leg dc-leg-middle"><path d="M33 65L26 78 29 92 35 93"/></g>
 <g class="dc-leg dc-leg-near"><path d="M39 64L49 76 48 91 55 93"/></g>
 <g class="dc-arm-free dc-arm-back"><path d="M37 49Q42 56 50 61L55 59" stroke="#87603d"/></g>
 <g class="dc-ant-head"><path class="dc-antenna-back" d="M43 17Q41 7 34 6"/><path class="dc-antenna-front" d="M51 17Q53 5 60 5"/><circle cx="34" cy="6" r="2" fill="#bc8750" stroke="none"/><circle cx="60" cy="5" r="2" fill="#bc8750" stroke="none"/><ellipse cx="47" cy="31" rx="14" ry="16" fill="url(#dc-ant-shell)"/><path d="M37 27Q38 20 44 19" stroke="#f2cf91" stroke-width="2.5"/><ellipse class="dc-eye-far" cx="45" cy="27" rx="3.5" ry="5" fill="#fff6dd" stroke="none"/><ellipse cx="54" cy="28" rx="4.5" ry="6" fill="#fff9e7" stroke="none"/><ellipse cx="55" cy="29" rx="2.2" ry="3.4" fill="#302b22" stroke="none"/><circle cx="55.7" cy="27.5" r=".9" fill="white" stroke="none"/><path d="M50 39Q55 42 59 37" stroke-width="2"/></g>
 <g class="dc-ant-scarf"><path d="M33 43L45 44 41 49 32 48Z" fill="#628a70" stroke="#416451" stroke-width="1.5"/><path d="M34 46Q26 48 20 44L24 51 35 48" fill="#6e9477" stroke="#416451" stroke-width="1.5"/></g>
 <g class="dc-held-bone dc-normal"><g transform="translate(60.6 28.3) scale(.984615 .995)">${dominoMaterial()}</g></g>
 <g class="dc-arm-free dc-arm-front"><path d="M40 50Q48 44 54 51L53 57"/><path d="M51 57L55 57" stroke-width="4"/></g>
 <g class="dc-arms-hold"><path class="dc-hold-back" d="M37 48Q47 38 63 43" stroke="#87603d"/><path d="M40 51Q48 61 63 57"/><path d="M62 54L65 54 65 58 62 59" stroke-width="2.7"/></g>
 <g class="dc-arms-push"><path d="M37 47Q48 42 67 42" stroke="#87603d"/><path d="M40 52Q53 56 67 52"/><path d="M67 49V55" stroke-width="4"/></g>
 <g class="dc-arms-climb"><path class="dc-climb-hand-a" d="M36 49L26 38 27 24 32 24"/><path class="dc-climb-hand-b" d="M40 49L51 36 51 21 46 21"/></g>
 <g class="dc-arms-carry-climb"><path d="M40 51Q48 59 60 54"/><path class="dc-climb-hand-a" d="M34 49L26 37 29 24 34 24"/></g>
</g></svg></div>`;

export function createAntActor(node){
  const art=node.querySelector('.dc-ant-art'),body=node.querySelector('.dc-ant-doll');
  const bone=node.querySelector('.dc-held-bone');
  const hold=node.querySelector('.dc-arms-hold'),arms=node.querySelector('.dc-arms-push');
  let generation=0;
  const animations=new Set();
  function cancel(){generation++;for(const animation of animations)animation.cancel();animations.clear();delete node.dataset.action;}
  async function animate(target,frames,duration){
    if(!motionEnabled()||!target?.animate)return;
    const animation=target.animate(frames,{duration,easing:'cubic-bezier(.25,.7,.25,1)',fill:'both'});
    const release=gameRuntime.trackAnimation(animation);
    animations.add(animation);
    try{await animationFinished(animation);}catch{}finally{release();animations.delete(animation);animation.cancel();}
  }
  async function action(name,jobs){
    cancel();const token=generation;node.dataset.action=name;
    await Promise.all(jobs.map(([target,frames,ms])=>animate(target,frames,ms)));
    if(token!==generation)return false;
    delete node.dataset.action;return true;
  }
  function groundTransform(rect){
    const matrix=bone.ownerSVGElement.getScreenCTM();
    if(!rect||!matrix)return 'translate(0px, 6px) rotate(0deg)';
    const point=new DOMPoint(rect.left+rect.width/2,rect.top+rect.height/2).matrixTransform(matrix.inverse());
    return `translate(${point.x-67}px, ${point.y-58.15}px) rotate(0deg)`;
  }
  const heldTransform='translate(-1px, -2px) rotate(-7deg)';
  return {
    update({facing,held,move='idle',exited=false}){
      node.style.setProperty('--dc-facing',facing);node.dataset.carrying=String(!!held);node.dataset.move=move;
      node.dataset.exited=String(exited);bone.setAttribute('class',`dc-held-bone dc-${held?.type||'normal'}`);
      bone.dataset.type=held?.type||'normal';
    },
    take(rect){return action('take',[
      [bone,[{transform:groundTransform(rect)},{transform:'translate(0px, 8px) rotate(5deg)',offset:.25},{transform:heldTransform}],400],
      [body,[{transform:'translateY(0)'},{transform:'translateY(4px) rotate(5deg)',offset:.27},{transform:'translateY(0)'}],400],
      [hold,[{transform:'translate(-4px, 7px)'},{transform:'translate(0, 0)'}],400],
    ]);},
    place(rect){return action('place',[
      [bone,[{transform:heldTransform},{transform:'translate(0px, 2px) rotate(2deg)',offset:.65},{transform:groundTransform(rect)}],360],
      [body,[{transform:'translateY(0)'},{transform:'translateY(3px) rotate(4deg)',offset:.72},{transform:'translateY(0)'}],360],
      [hold,[{transform:'translate(0, 0)'},{transform:'translate(-3px, 5px)'}],360],
    ]);},
    reach(){return action('reach',[
      [body,[{transform:'rotate(0deg)'},{transform:'rotate(7deg)'}],230],
      [arms,[{transform:'translate(-9px, 3px)'},{transform:'translate(0, 0)'}],230],
    ]);},
    recoil(){return action('recoil',[
      [body,[{transform:'rotate(7deg)'},{transform:'rotate(-3deg)',offset:.55},{transform:'rotate(0deg)'}],300],
      [arms,[{transform:'translate(0, 0)'},{transform:'translate(-8px, 3px)'}],300],
    ]);},
    enter(){return action('enter',[
      [art,[{opacity:1,transform:'scale(1)'},{opacity:1,transform:'translateY(-3px) scale(.95)',offset:.3},{opacity:0,transform:'translateY(-5px) scale(.55)'}],480],
    ]);},
    cancel,
  };
}

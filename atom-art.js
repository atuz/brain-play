import {bondDirections} from './atom-engine.js?v=46';
const colors={H:['#e8d9a7','#bba36f'],C:['#638e96','#3e6974'],O:['#d18d77','#aa6555'],N:['#8a91b6','#656d94'],F:['#b393b2','#876a90'],Cl:['#9db078','#728b54'],red:['#cc8c79','#9b6255'],blue:['#83acbd','#588b9d'],gold:['#dac17d','#a88f55'],green:['#9bb68d','#6e8f6a'],purple:['#b09fbf','#817092'],white:['#e8e9d8','#adb69c']};
export function atomArt(a,{ghost=false}={}){
  const [fill,edge]=colors[a.element]||colors.C,bonus=a.element.length>2;
  let bonds='';
  a.bonds.forEach((order,d)=>{
    if(!order)return;const [dx,dy]=bondDirections[d],scale=Math.hypot(dx,dy),vx=dx/scale,vy=dy/scale;
    for(let i=0;i<order;i++){
      const offset=(i-(order-1)/2)*3.3;
      bonds+=`<path d="M${25+vx*12-vy*offset} ${25+vy*12+vx*offset}L${25+vx*26-vy*offset} ${25+vy*26+vx*offset}" stroke="${ghost?'#668d79':'#788b7b'}" stroke-width="2.3" stroke-linecap="round"/>`;
    }
  });
  return `${bonds}<ellipse cx="26" cy="41" rx="15" ry="4" fill="#6b856d" opacity=".15"/>${bonus?`<path d="M25 7L43 25L25 44L7 25Z" fill="${fill}" stroke="${edge}" stroke-width="2"/><path d="M25 10L10 25L25 23Z" fill="#fff9d4" opacity=".45"/>`:`<circle cx="25" cy="26" r="15" fill="${edge}"/><circle cx="24.2" cy="24" r="14.5" fill="${fill}"/><ellipse cx="20" cy="18" rx="7" ry="4" fill="#fff9dc" opacity=".38"/><text x="25" y="30" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${a.element==='Cl'?16:18}" font-weight="750" fill="${a.element==='H'?'#746542':'#fcf9e9'}">${a.element}</text>`}`;
}
export function atomModelSVG(goal){const w=Math.max(...goal.map(a=>a.x))+1,h=Math.max(...goal.map(a=>a.y))+1;return `<svg viewBox="-3 -3 ${w*50+6} ${h*50+6}" aria-hidden="true">${goal.map(a=>`<g transform="translate(${a.x*50} ${a.y*50})">${atomArt(a)}</g>`).join('')}</svg>`;}

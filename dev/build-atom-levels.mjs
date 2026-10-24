// Build-time authoring aid. Reverse legal slides guarantee a playable route.
// No reference-game maps or assets are read by this script.
import {writeFile} from 'node:fs/promises';
import {atomModel,atomDirections,atomCopy,atomSolved,atomSlide,createAtomState} from '../atom-engine.js';
const models=[
 ['氢气','H₂',[['H',0,0],['H',1,0]],[[0,1]]],
 ['水','H₂O',[['H',0,0],['O',1,0],['H',2,0]],[[0,1],[1,2]]],
 ['二氧化碳','CO₂',[['O',0,0],['C',1,0],['O',2,0]],[[0,1,2],[1,2,2]]],
 ['氨','NH₃',[['N',1,1],['H',0,1],['H',2,0],['H',2,2]],[[0,1],[0,2],[0,3]]],
 ['甲烷','CH₄',[['C',1,1],['H',1,0],['H',2,1],['H',1,2],['H',0,1]],[[0,1],[0,2],[0,3],[0,4]]],
 ['氧气','O₂',[['O',0,0],['O',0,1]],[[0,1,2]]],
 ['氮气','N₂',[['N',0,0],['N',1,0]],[[0,1,3]]],
 ['氯化氢','HCl',[['H',0,0],['Cl',1,0]],[[0,1]]],
 ['过氧化氢','H₂O₂',[['H',0,0],['O',1,0],['O',1,1],['H',2,1]],[[0,1],[1,2],[2,3]]],
 ['乙炔','C₂H₂',[['H',0,0],['C',1,0],['C',2,0],['H',3,0]],[[0,1],[1,2,3],[2,3]]],
 ['甲醛','CH₂O',[['C',1,1],['O',2,1],['H',0,0],['H',0,2]],[[0,1,2],[0,2],[0,3]]],
 ['甲醇','CH₃OH',[['C',1,1],['O',2,1],['H',3,1],['H',0,1],['H',1,0],['H',1,2]],[[0,1],[1,2],[0,3],[0,4],[0,5]]],
 ['乙烯','C₂H₄',[['C',1,1],['C',2,1],['H',0,0],['H',0,2],['H',3,0],['H',3,2]],[[0,1,2],[0,2],[0,3],[1,4],[1,5]]],
 ['四氟化碳','CF₄',[['C',1,1],['F',1,0],['F',2,1],['F',1,2],['F',0,1]],[[0,1],[0,2],[0,3],[0,4]]],
 ['彩晶十字','◆',[['red',1,1],['blue',1,0],['gold',2,1],['green',1,2],['purple',0,1]],[]],
 ['乙烷','C₂H₆',[['C',1,1],['C',2,1],['H',0,1],['H',1,0],['H',1,2],['H',3,1],['H',2,0],['H',2,2]],[[0,1],[0,2],[0,3],[0,4],[1,5],[1,6],[1,7]]],
 ['弯曲水桥','H₂O',[['O',0,0],['H',1,0],['H',0,1]],[[0,1],[0,2]]],
 ['彩晶阶梯','◆',[['red',0,0],['gold',1,0],['green',1,1],['blue',2,1],['purple',2,2],['white',3,2]],[]],
];
const sets=[[[3,3]],[[2,2],[4,4]],[[2,3],[4,2]],[[2,2],[4,4],[2,4]],[[3,2],[5,4],[1,3]],[[2,2],[3,3],[4,4]],[[2,3],[4,3]],[[2,2],[4,2],[3,4]],[[2,2],[4,4],[5,2]],[[3,2],[4,4],[1,4]],[[2,3],[4,2],[5,4]],[[2,2],[5,4],[3,5]],[[2,4],[5,2],[4,5]],[[2,2],[5,4],[2,5]],[[3,3],[5,2],[1,4]],[[2,2],[5,5],[6,3],[3,6]],[[2,2],[4,4],[5,2]],[[2,2],[5,4],[3,5],[6,2]]];
function rng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
const levels=[];
function smallPuzzle(level,solved,random,wanted){
 const queue=[],seen=new Set(),key=atoms=>atoms.map(a=>`${a.x},${a.y}`).join('|');
 const maxX=Math.max(...level.goal.map(a=>a.x)),maxY=Math.max(...level.goal.map(a=>a.y));
 for(let y=1;y<level.h-1-maxY;y++)for(let x=1;x<level.w-1-maxX;x++){
  const atoms=level.goal.map(a=>({...atomCopy(a),x:a.x+x,y:a.y+y}));
  if(atoms.some(a=>level.tiles[a.y*level.w+a.x]==='wall'))continue;
  seen.add(key(atoms));queue.push({atoms,solution:[],depth:0});
 }
 for(let head=0;head<queue.length;head++){
  const old=queue[head];
  for(const a of old.atoms)for(const [direction,[dx,dy]]of Object.entries(atomDirections)){
   const free=(x,y)=>x>0&&x<level.w-1&&y>0&&y<level.h-1&&level.tiles[y*level.w+x]!=='wall'&&!old.atoms.some(p=>p.id!==a.id&&p.x===x&&p.y===y);
   if(free(a.x+dx,a.y+dy))continue;
   let x=a.x-dx,y=a.y-dy;
   while(free(x,y)){
    const atoms=atomCopy(old.atoms);Object.assign(atoms.find(p=>p.id===a.id),{x,y});const k=key(atoms);
    if(!seen.has(k)){seen.add(k);queue.push({atoms,solution:[{id:a.id,direction},...old.solution],depth:old.depth+1});}
    x-=dx;y-=dy;
   }
  }
 }
 const maximum=Math.max(...queue.map(n=>n.depth)),depth=Math.min(wanted,maximum),options=queue.filter(n=>n.depth===depth);
 const chosen=options[Math.floor(random()*options.length)];return {...chosen,minimum:depth,explored:queue.length};
}
for(let index=0;index<models.length;index++){
 const [name,formula,nodes,edges]=models[index],goal=atomModel(nodes,edges),w=index<3?6:index<11?7:8,h=w;
 const tiles=Array.from({length:w*h},(_,i)=>i%w===0||i%w===w-1||i<w||i>=w*(h-1)?'wall':'ground');
 const solved=goal.map(a=>({...a,x:a.x+1,y:a.y+1}));
 for(const [x,y]of sets[index])if(!solved.some(a=>a.x===x&&a.y===y)&&x<w-1&&y<h-1)tiles[y*w+x]='wall';
 const level={id:`a${String(index+1).padStart(2,'0')}`,name,formula,w,h,tiles,goal,atoms:[],solution:[],chapter:index<6?'初识':index<12?'连接':'实验室'};
 const random=rng(1457+index*931),seen=new Set(),steps=index<2?5:index<6?9:index<11?13:18;
 let atoms=atomCopy(solved),solution=[];
 for(let n=0;n<steps;n++){
  const candidates=[];
  for(const a of atoms)for(const [direction,[dx,dy]]of Object.entries(atomDirections)){
   const free=(x,y)=>x>0&&x<w-1&&y>0&&y<h-1&&tiles[y*w+x]!=='wall'&&!atoms.some(p=>p.id!==a.id&&p.x===x&&p.y===y);
   if(free(a.x+dx,a.y+dy))continue;
   let x=a.x-dx,y=a.y-dy;
   while(free(x,y)){
    const next=atomCopy(atoms);Object.assign(next.find(p=>p.id===a.id),{x,y});
    const key=next.map(p=>`${p.x},${p.y}`).join('|');
    if(!seen.has(key)&&!atomSolved(level,next))candidates.push({atoms:next,move:{id:a.id,direction},key});
    x-=dx;y-=dy;
   }
  }
  if(!candidates.length)break;
  const chosen=candidates[Math.floor(random()*candidates.length)];atoms=chosen.atoms;solution.unshift(chosen.move);seen.add(chosen.key);
 }
 if(goal.length<=3){const chosen=smallPuzzle(level,solved,random,index===0?2:index===1?4:index===2?5:index===5?6:index===6?7:index===7?8:11);atoms=chosen.atoms;solution=chosen.solution;level.minimum=chosen.minimum;level.reachableStates=chosen.explored;}
 level.atoms=atoms;level.solution=solution;
 let state=createAtomState(level);for(const move of solution)state=atomSlide(level,state,move.id,move.direction).state;
 if(state.phase!=='won'||!solution.length)throw Error(`Invalid generated route ${level.id}`);
 levels.push(level);
}
await writeFile(new URL('../atom-levels.js',import.meta.url),`// Original, fixed puzzles. Rebuild with node dev/build-atom-levels.mjs.\nexport const atomLevels=${JSON.stringify(levels,null,2)};\n`);
console.log(levels.map(l=>`${l.id} ${l.name}: ${l.atoms.length} atoms, ${l.solution.length} verified slides`).join('\n'));

export const atomDirections={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
export const atomCopy=value=>JSON.parse(JSON.stringify(value));
export const bondDirections=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
export const atomKey=a=>`${a.element}:${a.bonds.join(',')}`;
export function atomModel(nodes,edges){
  const minX=Math.min(...nodes.map(n=>n[1])),minY=Math.min(...nodes.map(n=>n[2]));
  const atoms=nodes.map(([element,x,y],i)=>({id:`a${i}`,element,x:x-minX,y:y-minY,bonds:Array(8).fill(0)}));
  for(const [from,to,order=1]of edges){
    const a=atoms[from],b=atoms[to],dx=Math.sign(b.x-a.x),dy=Math.sign(b.y-a.y),dir=bondDirections.findIndex(v=>v[0]===dx&&v[1]===dy);
    if(dir<0||Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))!==1)throw Error('A model bond must join neighboring cells');
    a.bonds[dir]=order;b.bonds[(dir+4)%8]=order;
  }
  return atoms;
}
export function createAtomState(level){return {version:1,level:level.id,atoms:atomCopy(level.atoms),selected:null,moves:0,phase:'playing'};}
export function atomDestination(level,atoms,id,direction){
  const a=atoms.find(p=>p.id===id),v=atomDirections[direction];if(!a||!v)return null;
  let x=a.x,y=a.y,distance=0;
  const free=(x,y)=>x>=0&&x<level.w&&y>=0&&y<level.h&&level.tiles[y*level.w+x]!=='wall'&&!atoms.some(p=>p.id!==id&&p.x===x&&p.y===y);
  while(free(x+v[0],y+v[1])){x+=v[0];y+=v[1];distance++;}
  return distance?{x,y,distance}:null;
}
export function atomSolved(level,atoms){
  if(atoms.length!==level.goal.length)return false;
  const first=level.goal[0];
  for(const anchor of atoms.filter(a=>atomKey(a)===atomKey(first))){
    const dx=anchor.x-first.x,dy=anchor.y-first.y;
    if(level.goal.every(g=>atoms.some(a=>a.x===g.x+dx&&a.y===g.y+dy&&atomKey(a)===atomKey(g))))return true;
  }
  return false;
}
export function atomSlide(level,input,id,direction){
  const end=input.phase==='playing'&&atomDestination(level,input.atoms,id,direction);
  if(!end)return {state:input,changed:false};
  const state=atomCopy(input),a=state.atoms.find(p=>p.id===id),from={x:a.x,y:a.y};
  Object.assign(a,{x:end.x,y:end.y});state.selected=id;state.moves++;
  if(atomSolved(level,state.atoms))state.phase='won';
  return {state,changed:true,from,to:{x:a.x,y:a.y},distance:end.distance};
}
export function validAtomState(s,level){
  return s?.version===1&&s.level===level.id&&Array.isArray(s.atoms)&&s.atoms.length===level.atoms.length
    &&s.atoms.every(a=>{const source=level.atoms.find(p=>p.id===a.id);return source&&Array.isArray(a.bonds)&&atomKey(a)===atomKey(source)&&Number.isInteger(a.x)&&Number.isInteger(a.y)&&a.x>=0&&a.x<level.w&&a.y>=0&&a.y<level.h&&level.tiles[a.y*level.w+a.x]!=='wall';})
    &&new Set(s.atoms.map(a=>a.id)).size===s.atoms.length&&new Set(s.atoms.map(a=>`${a.x},${a.y}`)).size===s.atoms.length
    &&(s.selected===null||s.atoms.some(a=>a.id===s.selected))&&Number.isSafeInteger(s.moves)&&s.moves>=0&&s.moves<1e7
    &&['playing','won'].includes(s.phase)&&(s.phase!=='won'||atomSolved(level,s.atoms));
}
export function atomGuideFits(level,anchor){return level.goal.every(g=>{const x=anchor.x+g.x,y=anchor.y+g.y;return x>=0&&x<level.w&&y>=0&&y<level.h&&level.tiles[y*level.w+x]!=='wall';});}

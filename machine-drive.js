import {parts} from './machine-parts.js?v=46';

// Belts preserve direction; meshed gears reverse it. Solve whole connected
// components so a closed contradictory loop cannot spin through itself.
export function createDrive(entities,connections){
  const rotors=[...entities.values()].filter(e=>parts[e.type].rotary),graph=new Map(rotors.map(e=>[e.id,[]]));
  const edge=(a,b,sign)=>{graph.get(a)?.push([b,sign]);graph.get(b)?.push([a,sign]);};
  for(const l of connections)if(l.type==='belt')edge(l.a,l.b,1);
  const gears=rotors.filter(e=>e.type==='gear');
  for(let i=0;i<gears.length;i++)for(let j=i+1;j<gears.length;j++){
    const a=gears[i],b=gears[j],distance=Math.hypot(a.x-b.x,a.y-b.y);
    if(distance>39&&distance<53)edge(a.id,b.id,-1);
  }
  const seen=new Set(),groups=[];
  for(const start of rotors){
    if(seen.has(start.id))continue;
    const group={members:[],signs:new Map([[start.id,1]]),inconsistent:false,blocked:false},queue=[start.id];seen.add(start.id);
    for(let i=0;i<queue.length;i++){
      const id=queue[i];group.members.push(entities.get(id));
      for(const [next,sign]of graph.get(id)){
        const expected=group.signs.get(id)*sign;
        if(group.signs.has(next)){if(group.signs.get(next)!==expected)group.inconsistent=true;}
        else{group.signs.set(next,expected);seen.add(next);queue.push(next);}
      }
    }
    groups.push(group);
  }
  return {
    reset(){for(const g of groups)g.blocked=false;},
    update(){for(const g of groups){
      const inputs=g.members.filter(e=>e.drive).map(e=>e.drive*g.signs.get(e.id));
      if(inputs.length&&(g.inconsistent||inputs.some(v=>Math.sign(v)!==Math.sign(inputs[0]))))g.blocked=true;
      const speed=!g.blocked&&inputs.length?Math.sign(inputs[0])*Math.min(...inputs.map(Math.abs)):0;
      for(const e of g.members){e.spin=speed*g.signs.get(e.id);e.jammed=g.blocked;}
    }},
  };
}

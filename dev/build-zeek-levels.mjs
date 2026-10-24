import fs from 'node:fs';
import {createGardenState,gardenStep} from '../zeek-engine.js';
const defs=[
['花园入口','走到橙色蘑菇就过关，黄花和宝箱是加分。',[
'#########','#@.f...G#','#.###.#.#','#...c...#','#########']],
['借一步路','圆石一次推一格；两块连在一起推不动。',[
'#########','#@..#..G#','#..o...##','#.##.#..#','#..#....#','#########']],
['苹果午餐','苹果推到张嘴花的四邻，让它忙着消化。',[
'#########','#####O###','#@.a...G#','#########']],
['花蕾转角','花蕾要两回合才张嘴；别在四邻停太久。',[
'#########','#####C###','#@.....G#','#########']],
['一钥一门','一把钥匙开一扇门。',[
'#########','#@..#..G#','#.#kD.#.#','#...#...#','#########']],
['换个颜色','彩蛋会把黄花与蓝色毒花互换。',[
'#########','#@.e.p.G#','#########']],
['晶石相会','把两颗晶石推到四邻，闪两回合后消失。',[
'#########','#@.X.X.G#','#########']],
['引信响起','炸弹推后点燃；爆炸只到上下左右一格。',[
'#########','#...#..G#','#@.B.L..#','#...#...#','#########']],
['药效之内','隐身能避开激光和食人花；毒花仍有毒。',[
'#########','####O####','#@i....G#','#######L#','#########']],
['光的掩体','任何物品都能挡光；圆石不会被炸掉。',[
'#########','#....L..#','#@.o....#','#...#...#','#......G#','#########']],
['烂苹果晚餐','烂苹果让花消化更久，绕行前先喂它。',[
'#########','#####O###','#@.r...G#','###.#.###','#...#...#','#########']],
['双门花房','要留下第二把钥匙，才能开第二扇门。',[
'###########','#@k.D.k.DG#','###########']],
['消除之后','两组晶石分别相会，腾出走廊。',[
'###########','#@X.X.X.XG#','###########']],
['巡游小兽','绿色小兽每回合走一步，前路受阻才转向。',[
'#########','#..>...o#','#.#####.#','#@..#..G#','#.......#','#########']],
['炮台花房','推苹果喂花，留意炮台射线和墙角。',[
'###########','#....#....#','#@.a...G..#','#####O#L###','#....#....#','###########']],
['回廊换色','先拿彩蛋，再穿过原本的蓝花。',[
'###########','#@..#....G#','#.#e#.###p#','#...#.....#','###.#####.#','#.........#','###########']],
['炸弹接力','炸弹能点燃邻炸弹；躲远一点，或点等待。',[
'###########','#....#...G#','#@.B.B.L..#','#....#....#','###########']],
['温室密钥','开门、消除晶石，再把苹果送到花旁。',[
'#############','#@kD.X.Xa..G#','##########O##','#############']],
['玻璃天桥','隐身药给你一段安全路，宝箱可以之后再拿。',[
'#############','#@i....#....#','#.###..#L...#','#...#..#....#','###.#.....G.#','#c..#.O#.##.#','#...#..#....#','#############']],
['月光植物园','点全景查看大地图；角色走动时镜头会跟随。',[
'###############','#@k..#.....#c.#','#.##.#.###.#..#','#....D.X.Xa..G#','###########O###','#....#.....#..#','#.>..o.....#..#','###############']],
];
const types={'#':'wall',b:'barrel',o:'stone',a:'apple',r:'rotten',f:'flower',p:'poison',G:'goal',T:'toxic',k:'key',D:'door',e:'egg',i:'pill',c:'chest',X:'crystal',B:'bomb',O:'plant',C:'plant',L:'laser','>':'grazer'};
export const levels=defs.map(([name,hint,map],i)=>{
 const w=map[0].length,h=map.length,objects=[];let player;
 map.forEach((row,y)=>{if(row.length!==w)throw Error(`${i+1} width ${row}`);[...row].forEach((c,x)=>{if(c==='@')player={x,y};else if(types[c])objects.push({type:types[c],x,y,...(c==='O'||c==='C'?{state:c==='O'?'open':'bud'}:{}),...(c==='>'?{dir:'right'}:{})});});});
 return {id:i+1,name,hint,w,h,theme:i<7?'meadow':i<14?'greenhouse':'moon',player,objects};
});
const key=s=>[s.player.x,s.player.y,s.player.invisible,s.keys??0,s.objects.filter(o=>!['wall','barrel'].includes(o.type)).map(o=>[o.id,o.type,o.x,o.y,o.timer,o.state??'',o.dir??''].join(',')).join(';')].join('|');
function solve(l){
 const initial=createGardenState(l),q=[{s:initial,parent:-1,action:''}],seen=new Set([key(initial)]);
 for(let i=0;i<q.length&&i<65000;i++){
  const {s}=q[i];for(const a of ['up','right','down','left','wait']){
   const r=gardenStep(l,s,a);if(!r.changed||r.state.phase==='lost')continue;
   if(r.state.phase==='won'){const route=[a];let j=i;while(q[j].parent>=0){route.push(q[j].action);j=q[j].parent;}return {solution:route.reverse(),searched:i};}
   const k=key(r.state);if(!seen.has(k)){seen.add(k);q.push({s:r.state,parent:i,action:a});}
  }
 }return {solution:null,searched:q.length};
}
// Four deterministic maze challenges. Keys sit in side branches before their gates.
function challenge(seed,w,h,name){
 let n=seed;const random=()=>((n=Math.imul(n,1664525)+1013904223)>>>0)/4294967296;
 const grid=Array.from({length:h},()=>Array(w).fill('#')),stack=[[1,1]];grid[1][1]='.';
 while(stack.length){const [x,y]=stack.at(-1),next=[[0,-2],[2,0],[0,2],[-2,0]].map(([dx,dy])=>[x+dx,y+dy,dx,dy]).filter(([a,b])=>a>0&&b>0&&a<w-1&&b<h-1&&grid[b][a]==='#');if(!next.length){stack.pop();continue;}const [a,b,dx,dy]=next[Math.floor(random()*next.length)];grid[y+dy/2][x+dx/2]='.';grid[b][a]='.';stack.push([a,b]);}
 const prev=new Map([['1,1',null]]),q=[[1,1]];
 for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const a=x+dx,b=y+dy,k=`${a},${b}`;if(grid[b]?.[a]==='.'&&!prev.has(k)){prev.set(k,[x,y]);q.push([a,b]);}}}
 const route=[];let pos=q.at(-1);while(pos){route.push(pos);pos=prev.get(pos.join(','));}route.reverse();
 const gateIndex=Math.floor(route.length*.55),[gx,gy]=route[gateIndex];grid[gy][gx]='D';grid[1][1]='@';const goal=route.at(-1);grid[goal[1]][goal[0]]='G';
 // Search the pre-gate component for a distant dead end, forcing a return trip.
 const before=new Map([['1,1',0]]),bq=[[1,1]];for(let i=0;i<bq.length;i++){const [x,y]=bq[i];for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const a=x+dx,b=y+dy,k=`${a},${b}`;if(grid[b]?.[a]&&grid[b][a]!=='#'&&grid[b][a]!=='D'&&!before.has(k)){before.set(k,before.get(`${x},${y}`)+1);bq.push([a,b]);}}}
 const routeKeys=new Set(route.map(p=>p.join(','))),side=bq.filter(p=>!routeKeys.has(p.join(','))),keyPos=(side.length?side:bq).at(-1);grid[keyPos[1]][keyPos[0]]='k';
 const eggIndex=Math.floor(gateIndex*.5),[ex,ey]=route[eggIndex];if(grid[ey][ex]==='.')grid[ey][ex]='e';const [px,py]=route[Math.min(route.length-2,gateIndex+4)];if(grid[py][px]==='.')grid[py][px]='p';
 const chest=q.find(p=>!routeKeys.has(p.join(','))&&grid[p[1]][p[0]]==='.');if(chest)grid[chest[1]][chest[0]]='c';
 const objects=[];let player;grid.forEach((row,y)=>row.forEach((c,x)=>{if(c==='@')player={x,y};else if(types[c])objects.push({type:types[c],x,y});}));
 return {id:levels.length+1,name,hint:'钥匙藏在岔路里；先看全景，规划回来开门的路线。',w,h,theme:'moon',player,objects};
}
for(const [seed,w,h,name]of [[13,13,9,'迷园回声'],[27,13,11,'月下岔路'],[53,15,11,'钥匙远行'],[91,17,13,'最后的温室']])levels.push(challenge(seed,w,h,name));
const output=[];
for(const l of levels){const r=solve(l);console.log(l.id,l.name,r.solution?.length??'FAILED',r.searched);if(!r.solution)throw Error(`Unsolved ${l.id}`);output.push({...l,solution:r.solution});}
fs.writeFileSync(new URL('../zeek-levels.js',import.meta.url),'// Original authored maps; verified routes, no uniqueness claim.\nexport const gardenLevels='+JSON.stringify(output,null,2)+';\n');
fs.writeFileSync(new URL('../research/zeek/local-play/plans.json',import.meta.url),JSON.stringify(output.map(l=>({level:l.id,name:l.name,actions:l.solution})),null,2));

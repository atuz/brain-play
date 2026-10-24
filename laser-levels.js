// Original maps; the reference games' campaign data and artwork are not used.
function map(id,name,hint,{w=9,h=9,paths=[],tiles=[],actors=[],tank=[1,7,0],flag=[7,1],solution=[]}){
  const ground=Array(w*h).fill('wall');
  for(const [x1,y1,x2=x1,y2=y1] of paths)for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)ground[y*w+x]='ground';
  for(const [x,y,t] of tiles)ground[y*w+x]=t;
  ground[flag[1]*w+flag[0]]='flag';ground[tank[1]*w+tank[0]]='ground';
  return {id,revision:['l03','l06','l07'].includes(id)?2:1,name,hint,w,h,tiles:ground,actors:actors.map(([type,x,y,orientation])=>({type,x,y,...(['mirror','rotary'].includes(type)?{face:orientation}:type==='enemy'?{dir:orientation}:{})})),tank:{x:tank[0],y:tank[1],dir:tank[2]},solution};
}
const U='up',R='right',D='down',L='left',F='fire';
const repeat=(d,n)=>Array(n).fill(d);
export const laserLevels=[
  map('l01','第一束光','先朝砖墙开火，再沿通道走到旗帜。',{w:7,h:7,tank:[1,5,0],flag:[5,1],paths:[[1,1,1,5],[1,1,5,1]],tiles:[[1,3,'brick']],solution:[F,...repeat(U,4),...repeat(R,5)]}),
  map('l02','一座小桥','把方块射进水里，填成一座桥。',{w:7,h:7,tank:[1,5,1],flag:[5,1],paths:[[1,5,5,5],[5,1,5,5]],tiles:[[4,5,'water']],actors:[['box',3,5]],solution:[F,...repeat(R,4),...repeat(U,5)]}),
  map('l03','转过光角','朝上开火，让镜子把光转向右边，把箱子推入水中搭桥。',{w:7,h:7,tank:[1,5,0],flag:[3,1],paths:[[1,2,1,5],[1,2,3,2],[1,5,3,5],[3,1,3,5]],tiles:[[3,2,'water']],actors:[['mirror',1,2,'SE'],['box',2,2]],solution:[F,R,R,R,U,U,U,U,U]}),
  map('l04','镜背可以推','从没有银色斜面的背后射击，镜子会被推开。',{w:7,h:7,tank:[1,5,1],flag:[3,1],paths:[[1,5,5,5],[3,1,3,5]],actors:[['mirror',3,5,'NE']],solution:[F,R,R,...repeat(U,5)]}),
  map('l05','砖墙之后','一发只打掉一块砖。站稳后连续开火。',{w:7,h:7,tank:[1,5,0],flag:[5,1],paths:[[1,1,1,5],[1,1,5,1]],tiles:[[1,4,'brick'],[1,3,'brick'],[1,2,'brick']],solution:[F,F,F,...repeat(U,4),...repeat(R,5)]}),
  map('l06','固定转轴','朝上连续开火，先转动镜面，再反射激光，把箱子推入水中。',{w:7,h:7,tank:[1,5,0],flag:[3,1],paths:[[1,2,1,5],[1,2,3,2],[1,5,3,5],[3,1,3,5]],tiles:[[3,2,'water']],actors:[['rotary',1,2,'NW'],['box',2,2]],solution:[F,F,F,R,R,R,U,U,U,U,U]}),
  map('l07','水晶后的敌炮','水晶挡住敌炮视线，你的激光却能穿过去。先摧毁敌炮再绕行。',{w:7,h:7,tank:[1,5,0],flag:[1,2],paths:[[1,1,1,5],[2,3,2,5]],tiles:[[1,4,'crystal']],actors:[['enemy',1,1,2]],solution:[F,R,R,U,U,U,L,L,U,U]}),
  map('l08','推入深水','从敌炮侧面或背后射击会推动它；敌炮落水不会变成桥。',{w:7,h:7,tank:[1,5,0],flag:[1,1],paths:[[1,1,1,5],[2,1,2,3]],tiles:[[1,2,'water']],actors:[['enemy',1,3,0]],solution:[F,U,U,R,R,U,U,U,L,L]}),
  map('l09','冰面急停','普通冰一直滑到地面或障碍前。停下后可以换方向。',{w:7,h:7,tank:[1,5,0],flag:[5,2],paths:[[1,2,1,5],[1,2,5,2]],tiles:[[1,4,'ice'],[1,3,'ice'],[1,2,'ice']],solution:[U,...repeat(R,5)]}),
  map('l10','一次通过','薄冰经过就裂成水；出口被堵时也会落水。',{w:7,h:7,tank:[1,5,0],flag:[5,1],paths:[[1,1,1,5],[1,1,5,1]],tiles:[[1,4,'thin'],[1,3,'thin'],[1,2,'thin']],solution:[U,...repeat(R,5)]}),
  map('l11','运送路线','箭头只自动运送坦克，运送时炮管朝向不变。',{w:7,h:7,tank:[1,5,0],flag:[5,1],paths:[[1,2,1,5],[1,2,3,2],[3,2,3,4],[3,4,5,4],[5,1,5,4]],tiles:[[1,4,'mover:0'],[1,3,'mover:0'],[1,2,'mover:1'],[2,2,'mover:1'],[3,2,'mover:2'],[3,3,'mover:2'],[3,4,'mover:1'],[4,4,'mover:1']],solution:[U,U,U,U]}),
  map('l12','另一端','同色光环相连；走进去，朝向保持不变。激光不会传送。',{w:7,h:7,tank:[1,5,0],flag:[5,1],paths:[[1,4,1,5],[5,1,5,2]],tiles:[[1,4,'portal:0'],[5,2,'portal:0']],solution:[U,U]}),
  map('l13','等待出口','箱子先到另一端。站进入口，再用三面镜子推开出口箱子。',{w:9,h:8,tank:[1,5,1],flag:[6,2],paths:[[1,5,7,5],[7,1,7,5],[5,1,7,1],[5,1,5,3],[5,2,6,2]],tiles:[[4,5,'portal:0'],[5,2,'portal:0']],actors:[['box',3,5],['mirror',7,5,'NW'],['mirror',7,1,'SW'],['mirror',5,1,'SE']],solution:[F,R,R,R,F,R]}),
  map('l14','三次折返','看清三面镜子的银色斜面，让光从远处打开回程通道。',{tank:[1,7,0],flag:[3,5],paths:[[1,3,1,7],[1,3,6,3],[6,3,6,6],[3,6,6,6],[1,7,3,7],[3,5,3,7]],tiles:[[3,6,'brick']],actors:[['mirror',1,3,'SE'],['mirror',6,3,'SW'],['mirror',6,6,'NW']],solution:[F,R,R,R,U,U,U]}),
  map('l15','转轴与水桥','转镜、反射，再让远处的箱子落水。也可以寻找自己的路线。',{tank:[1,7,0],flag:[7,1],paths:[[1,2,1,7],[1,2,7,2],[1,7,3,7],[3,2,3,7],[7,1,7,2]],tiles:[[6,2,'water']],actors:[['rotary',1,2,'NW'],['box',5,2]],solution:[F,F,F,R,R,R,...repeat(U,6),...repeat(R,5),U,U]}),
  map('l16','中转站','先搭桥，再滑行推炮，穿过传送门，用水晶后的光打开终点。',{w:11,h:11,tank:[1,9,1],flag:[5,1],paths:[[1,9,7,9],[7,4,7,9],[7,5,8,5],[2,2,5,2],[2,3,4,3],[5,1,5,2]],tiles:[[4,9,'water'],[7,8,'ice'],[7,7,'ice'],[7,4,'water'],[8,5,'portal:1'],[2,2,'portal:1'],[3,2,'crystal'],[4,2,'brick']],actors:[['box',3,9],['enemy',7,5,0]],solution:[F,...repeat(R,6),U,U,F,U,R,R,F,D,D,R,R,R,U,U,R,R,U,U]}),
];

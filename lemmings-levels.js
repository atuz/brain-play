// Authored for this site. These maps use no original Lemmings artwork or levels.
const R=(x,y,w,h,m=1)=>[x,y,w,h,m];
const skills=(values)=>Object.fromEntries(Object.entries(values));
function level(n,name,theme,width,entry,exit,terrain,stock,hint,extra={}){
  return {id:`r${String(n).padStart(2,'0')}`,revision:1,name,theme,width,height:224,entry:{x:entry[0],y:entry[1],dir:entry[2]||1},exit:{x:exit[0],y:exit[1]},
    terrain:[R(0,0,8,224,2),R(width-8,0,8,224,2),...terrain],skills:skills(stock),hint,total:8,need:8,time:120,interval:54,hazards:[],...extra};
}
const water=(x,y,w)=>({type:'water',x,y,w,h:224-y});
const fire=(x,y,w)=>({type:'fire',x,y,w,h:12});
const trap=(x,y)=>({type:'trap',x,y,w:14,h:12});
export const lemmingChapters=['林间学堂','云岩峡谷','暮光矿城'];
export const lemmingLevels=[
  level(1,'向下的捷径','forest',384,[54,62],[324,126],
    [R(8,68,368,12),R(8,126,368,98)],{digger:1},'在上层选一只向下挖，打通地板。下层的发光小屋是出口。'),
  level(2,'穿过石墙','forest',384,[54,104],[324,126],
    [R(8,126,368,98),R(174,64,22,62)],{basher:2},'等领头的小旅鼠靠近石墙，面朝墙时让它横挖。'),
  level(3,'把落差变轻','forest',384,[62,22],[324,150],
    [R(8,150,368,74)],{floater:5},'给正在下落的小旅鼠分配降落伞。能力会一直保留。',{total:5,need:4,interval:50}),
  level(4,'爬上高台','forest',416,[54,124],[356,110],
    [R(8,146,400,78),R(210,110,198,114)],{climber:5},'每只小旅鼠都需要攀爬能力。碰到墙才会开始爬。',{total:5,need:5}),
  level(5,'桥上的第一块砖','forest',416,[54,104],[356,126],
    [R(8,126,164,98),R(196,126,212,98)],{builder:2},'在断崖前约一只旅鼠身长处搭桥。一份技能可以连续铺 12 块砖。',{interval:70,hazards:[water(172,184,24)]}),
  level(6,'请往这边走','forest',416,[168,104],[42,126],
    [R(8,126,302,98)],{blocker:1},'让领头者站住挡路，后来者就会转身。救够后点收队。',{need:7,hazards:[water(310,172,98)]}),
  level(7,'斜坡通道','forest',416,[54,72],[356,174],
    [R(8,90,400,48),R(8,174,400,50)],{miner:2},'斜挖会一边向前、一边向下。开出通道后，大家会沿着斜坡走。',{interval:66}),
  level(8,'炸开封口','forest',416,[54,62],[356,150],
    [R(8,80,400,6),R(8,150,400,74)],{blocker:1,bomber:1},'先让一只站住，再分配爆破。五秒后地板会炸开；爆破者无法获救。',{total:10,need:9,interval:45}),
  level(9,'桥那头的高墙','canyon',560,[54,138],[510,160],
    [R(8,160,152,64),R(184,160,368,64),R(326,100,24,60)],{builder:2,basher:2},'先跨过裂缝，再让领头者挖穿右边的高墙。',{total:10,need:9,interval:70,hazards:[water(160,190,24)]}),
  level(10,'先爬再落','canyon',560,[54,162],[510,184],
    [R(8,184,544,40),R(174,90,140,134)],{climber:5,floater:5},'攀爬和降落伞可以给同一只。翻过高台后，另一侧的落差也很大。',{total:5,need:5}),
  level(11,'单向的山门','canyon',560,[54,138],[510,160],
    [R(8,160,544,64),R(270,96,16,64,4)],{basher:2},'箭头墙只能向右挖。等它面朝箭头方向时再开路。'),
  level(12,'安全的落脚点','canyon',560,[54,56],[510,174],
    [R(8,174,172,50),R(204,174,348,50),R(8,74,172,8,2),R(204,84,104,10,2)],{builder:2,floater:5},'钢板不能挖。搭桥到对岸，再用降落伞安全落到下层。',{total:5,need:5,interval:76,hazards:[water(180,190,24)]}),
  level(13,'挡住火道','canyon',560,[54,138],[510,160],
    [R(8,160,544,64)],{builder:2},'桥要提前开始，让脚底从火焰上方经过，落地点也要越过火道。',{hazards:[fire(230,150,12)],interval:76}),
  level(14,'机关的冷却时间','canyon',600,[54,138],[550,160],
    [R(8,160,584,64),R(380,108,20,52)],{builder:2,basher:2},'用斜桥从夹子上方跨过，再挖开出口前的墙。',{total:10,need:10,interval:76,hazards:[trap(252,148)]}),
  level(15,'矿车下方','canyon',680,[54,64],[630,182],
    [R(8,82,664,48),R(280,0,16,142,2),R(8,182,302,42),R(334,182,338,42)],{miner:2,builder:2},'上层需要斜挖，下层还有一道裂缝。先看小地图规划两段路线。',{total:10,need:9,interval:76,hazards:[water(310,208,24)]}),
  level(16,'回家的方向','canyon',640,[80,82],[42,180],
    [R(8,180,624,44),R(8,100,162,8,2)],{floater:6,blocker:1,bomber:1},'出口在出发点下方。先安全下落，再放一只阻挡者，让后来者往左走。',{total:6,need:5,time:45}),
  level(17,'漫长的隧道','foundry',840,[54,152],[790,174],
    [R(8,174,412,50),R(452,174,380,50),R(200,110,32,64),R(636,118,24,56)],{basher:3,builder:2},'两道墙之间有深水。不要把横挖和造桥的次数用在同一个地方。',{total:10,need:9,interval:76,time:180,hazards:[water(420,200,32)]}),
  level(18,'双层天井','foundry',760,[54,48],[710,184],
    [R(8,68,744,12),R(210,0,14,95,2),R(8,120,744,12),R(360,86,14,61,2),R(8,184,744,40)],{digger:2,builder:2},'分别挖通两层地板；到最下层后，还要从夹子上方跨过去。',{total:12,need:10,interval:76,time:180,hazards:[trap(482,172)]}),
  level(19,'钢城绕行','foundry',840,[54,152],[790,174],
    [R(8,174,824,50),R(290,162,18,12,2),R(530,110,16,64,3)],{builder:2,climber:2,basher:2,blocker:1,bomber:1},'先跨钢墩，派两只翻墙。第一只阻挡，让第二只回头横挖；通路打开后炸掉阻挡者。',{time:180,interval:76,need:7}),
  level(20,'离开熔炉','foundry',840,[54,156],[790,178],
    [R(8,178,232,46),R(264,178,568,46),R(584,130,20,48)],{builder:3,basher:2},'第一座桥跨水，第二座桥跨火；最后挖通出口前的石墙。',{total:10,need:9,interval:80,time:180,hazards:[water(240,206,24),fire(410,168,12)]}),
  level(21,'救援小分队','foundry',840,[54,52],[790,176],
    [R(8,70,824,18),R(244,0,16,110,2),R(8,176,824,48),R(450,164,18,12,2)],{digger:1,floater:6,builder:2},'地板下面的落差很大。先备好降落伞，再挖通地板；钢墩需要搭桥。',{total:6,need:6,interval:70,time:180}),
  level(22,'倒数五秒','foundry',880,[54,60],[830,190],
    [R(8,82,864,6),R(218,0,14,110,2),R(8,132,252,10,2),R(260,132,40,10),R(300,132,572,10,2),R(8,190,864,34)],{blocker:1,bomber:1,digger:1,builder:2},'炸开上层封口后，找到中层钢板之间的泥土窗口，再挖到下层。',{total:10,need:9,interval:70,time:180,hazards:[trap(558,178)]}),
  level(23,'跨越三道峡谷','foundry',960,[54,154],[910,176],
    [R(8,176,212,48),R(244,176,226,48),R(494,176,246,48),R(764,176,188,48),R(610,130,20,46)],{builder:4,basher:2},'这是一条很长的路线。三道裂缝各留一次搭桥机会，中间的墙需要横挖。',{total:12,need:10,interval:80,time:210,hazards:[water(220,208,24),water(470,208,24),water(740,208,24)]}),
  level(24,'最后一班归途','foundry',1040,[54,60],[990,174],
    [R(8,78,1024,44),R(250,0,16,138,2),R(8,174,392,50),R(424,174,608,50),R(270,162,18,12,2),R(824,120,22,54,4)],{miner:2,builder:4,basher:2,floater:2,bomber:1},'先斜挖下楼，再跨钢墩、跨水、跨火，顺着箭头挖开最后一道门。',{total:12,need:10,interval:80,time:240,hazards:[water(400,208,24),fire(644,164,14)]}),
];

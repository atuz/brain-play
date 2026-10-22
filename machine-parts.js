// Original game rules and artwork; the physics library is the only vendored code.
export const WIDTH = 480, HEIGHT = 600, STEP = 1000 / 120;
export const worldSize=(level={})=>({width:level.width||WIDTH,height:level.height||HEIGHT});
export const parts = {
  ball:       {name:'小球',w:30,h:30,r:15,category:'物体',color:'#d6a34c',dynamic:true},
  bowling:    {name:'重球',w:38,h:38,r:19,category:'物体',color:'#4a6585',dynamic:true},
  balloon:    {name:'气球',w:36,h:48,r:18,category:'物体',color:'#d47764',dynamic:true,rope:true},
  bucket:     {name:'吊桶',w:48,h:48,category:'物体',color:'#91a3a5',dynamic:true,rope:true},
  plank:      {name:'平台',w:112,h:14,category:'结构',color:'#b48b56',rotate:true},
  ramp:       {name:'斜坡',w:128,h:14,category:'结构',color:'#b48b56',rotate:true},
  trampoline: {name:'弹床',w:82,h:20,category:'结构',color:'#497f79',rotate:true},
  switch:     {name:'电源开关',w:50,h:40,category:'动力',color:'#b68a4b'},
  fan:        {name:'风扇',w:48,h:56,category:'动力',color:'#4d8186',flip:true,electric:true},
  windmill:   {name:'风车',w:60,h:66,category:'动力',color:'#c89c55',rotary:true},
  generator:  {name:'发电机',w:56,h:46,category:'动力',color:'#708f84',rotary:true},
  motor:      {name:'电动机',w:56,h:40,category:'动力',color:'#668b88',rotary:true,electric:true,flip:true},
  gear:       {name:'齿轮',w:48,h:48,r:24,category:'动力',color:'#8a9fa3',rotary:true},
  conveyor:   {name:'传送带',w:116,h:24,category:'动力',color:'#718d7a',rotary:true,flip:true},
  light:      {name:'拉绳灯',w:38,h:52,category:'连锁',color:'#c7a458',rope:true},
  solar:      {name:'太阳能板',w:68,h:38,category:'连锁',color:'#62889c'},
  lens:       {name:'放大镜',w:26,h:48,category:'连锁',color:'#cfa654',flip:true},
  candle:     {name:'蜡烛',w:30,h:38,category:'连锁',color:'#cc8060',dynamic:true},
  rocket:     {name:'小火箭',w:26,h:56,category:'连锁',color:'#b87561',dynamic:true},
  fishbowl:   {name:'鱼缸',w:54,h:48,category:'连锁',color:'#76a7ad'},
  bellows:    {name:'风箱',w:70,h:46,category:'连锁',color:'#b68b5d',flip:true},
  pistol:     {name:'弹丸发射器',w:64,h:30,category:'连锁',color:'#8c9a9d',rope:true,flip:true},
  scissors:   {name:'剪刀',w:44,h:42,category:'连锁',color:'#b77e65'},
  belt:       {name:'皮带',category:'连接',color:'#73847a',link:true},
  rope:       {name:'绳索',category:'连接',color:'#b48a54',link:true},
  tennis:     {name:'网球',w:24,h:24,r:12,category:'物体',color:'#acbc61',dynamic:true,restitution:.82,density:.00065},
  baseball:   {name:'棒球',w:24,h:24,r:12,category:'物体',color:'#e7e0cd',dynamic:true,restitution:.38,density:.002},
  cannonball: {name:'炮弹',w:34,h:34,r:17,category:'物体',color:'#59636e',dynamic:true,restitution:.04,density:.012},
  pulley:     {name:'滑轮',w:40,h:40,r:20,category:'结构',color:'#9d9c7d'},
  hook:       {name:'固定挂环',w:28,h:32,category:'结构',color:'#8b9991',rope:true},
  seesaw:     {name:'跷跷板',w:144,h:14,category:'结构',color:'#a98460',dynamic:true,rotate:true,flip:true,rope:true},
  brick:      {name:'砖墙',w:112,h:24,category:'结构',color:'#b57560',rotate:true},
  pipe:       {name:'金属直管',w:112,h:18,category:'结构',color:'#8ba1a2',rotate:true},
  elbow:      {name:'金属弯管',w:100,h:100,category:'结构',color:'#8ba1a2',rotate:true},
  boxing:     {name:'拳击手套',w:74,h:38,category:'连锁',color:'#bc7560',flip:true},
  jack:       {name:'弹簧盒',w:64,h:60,category:'动力',color:'#ac9874',rotary:true,flip:true},
  flashlight: {name:'手电筒',w:64,h:34,category:'连锁',color:'#bfa86d',flip:true},
  cannon:     {name:'大炮',w:76,h:48,category:'连锁',color:'#73888b',rotate:true,flip:true},
  dynamite:   {name:'炸药',w:30,h:38,category:'连锁',color:'#bf715c',dynamic:true},
  detonator:  {name:'压杆引爆器',w:52,h:54,category:'连锁',color:'#a97b5b',rope:true},
  wire:       {name:'引爆线',category:'连接',color:'#b66653',link:true},
};
export const copy = v => JSON.parse(JSON.stringify(v));
const tips={
  ball:'受重力下落，会滚动和反弹。',bowling:'更重的球，可以撞击机关。',balloon:'会慢慢上升，也会被风吹走。',bucket:'吊桶下落时，可以拉动绳索另一端的机关。',
  plank:'挡住或承接物体，可以旋转。',ramp:'让球沿斜面滚动，可以旋转。',trampoline:'球落在床面会弹起；右端低，弹向右上；左端低，弹向左上。',
  switch:'物体碰到顶部按钮后，开关持续供电。',fan:'靠近电源自动接线，向前吹风；可以翻转。',windmill:'风吹动叶片，转轴可以连接皮带。',
  generator:'用皮带带动转轴，为附近电器供电。',motor:'靠近电源自动接线，再用皮带输出动力。',gear:'相邻齿轮反向转动，方向冲突会卡住；也可连接皮带。',conveyor:'用皮带带动，运送接触上表面的物体；可翻转方向。',
  light:'用绳索接吊桶，拉动后持续发光。',solar:'附近有亮灯或烛光时，为电器供电。',lens:'靠近光源，朝向蜡烛或火箭尾部聚光点火。',candle:'聚光可以点燃，风可以吹灭。',
  rocket:'用聚光点燃尾部，火箭会向上飞。',fishbowl:'受到快速撞击会破碎。',bellows:'物体压到左侧把手，会喷出一阵风。',pistol:'用绳索接吊桶，拉动后发射一颗弹丸。',scissors:'物体撞到剪刀，会剪断附近的绳索。',
  belt:'依次点两个转轴，连接并传递动力。',rope:'连接两个可系绳道具；可在中间依次点滑轮，改变拉力方向。',
  tennis:'轻而弹，落在硬表面会弹得很高。',baseball:'比网球重，弹跳较低，适合滚动输送。',cannonball:'很重、几乎不弹，快速撞击可以击碎砖墙。',
  pulley:'连接绳索时，在两个端点之间依次点滑轮，改变拉力方向。',hook:'固定绳索的一端，可以悬挂吊桶或气球。',
  seesaw:'中间有转轴，落下的重物会压低一端、抬起另一端；翻转选择系绳端。',brick:'挡住物体；重物高速撞击或附近爆炸会击碎它。',
  pipe:'坚固的金属挡板，可以旋转；爆炸不会破坏。',elbow:'两段金属构成直角，可旋转引导或挡住物体，不能炸毁。',
  boxing:'物体压到后端按钮后，拳套向前伸出，把接触的物体打出去。',jack:'连接皮带蓄力，转够一圈后弹起上面的物体；只能弹射一次。',
  flashlight:'物体压下顶部按钮后，持续向前照明；可翻转照射方向。',cannon:'聚光点燃后发射一颗重炮弹；旋转调整仰角，翻转调整朝向。',
  dynamite:'聚光点燃或用引爆线触发后爆炸，会推动物体、击碎砖墙和鱼缸。',detonator:'落物压下横杆，或绳索拉动后，通过引爆线点燃炸药。',
  wire:'先点压杆引爆器，再点炸药；只传递引爆信号，不拉动物体。',
};
for(const [type,tip] of Object.entries(tips))parts[type].tip=tip;
export const dimensions = p => ({w:p.w || parts[p.type].w,h:p.h || parts[p.type].h});
export const direction = p => p.flip ? -1 : 1;
export const anchor = p => p.type==='seesaw'?{
  x:p.x+direction(p)*(dimensions(p).w/2-12)*Math.cos(p.rotation??(p.angle||0)*Math.PI/180),
  y:p.y+direction(p)*(dimensions(p).w/2-12)*Math.sin(p.rotation??(p.angle||0)*Math.PI/180),
}:({
  x:p.x+(p.type==='light'?8:p.type==='pistol'?-5*direction(p):0),
  y:p.y+(p.type==='light'?31:p.type==='bucket'?-32:p.type==='balloon'?23:p.type==='pistol'?8:0),
});
export const shaft = p => ({x:p.x+(['motor','generator'].includes(p.type)?-19*direction(p):p.type==='conveyor'?(-dimensions(p).w/2+12)*direction(p):0),y:p.y});
export function compatible(a,b,type,via=[]) {
  if (!a || !b || a.id===b.id) return false;
  if(type==='wire')return !via.length&&Math.hypot(a.x-b.x,a.y-b.y)<=500
    &&[a.type,b.type].sort().join(':')==='detonator:dynamite';
  if(type!=='rope'&&via.length)return false;
  const nodes=[a,...via,b];
  if(via.length>6||via.some(p=>!p||p.type!=='pulley')||new Set(nodes.map(p=>p.id)).size!==nodes.length)return false;
  if(nodes.slice(1).some((p,i)=>Math.hypot(p.x-nodes[i].x,p.y-nodes[i].y)>380))return false;
  if(nodes.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-nodes[i].x,p.y-nodes[i].y),0)>1600)return false;
  if (type==='belt') return !!parts[a.type]?.rotary && !!parts[b.type]?.rotary;
  if (type==='rope') return !!parts[a.type]?.rope && !!parts[b.type]?.rope
    && !!(parts[a.type].dynamic || parts[b.type].dynamic);
  return false;
}

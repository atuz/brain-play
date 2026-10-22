import {parts,copy} from '../machine-parts.js';
import {machineLevels} from '../machine-levels.js';
const p=(id,type,x,y,extra={})=>({id,type,x,y,...extra});
const link=(type,a,b)=>({id:`${type}-${a}-${b}`,type,a,b});
const scene=(fixed,links=[])=>({level:{id:'audit',scene:'atelier',width:480,height:600,fixed,target:null},draft:{pieces:[],links}});
const puzzle=n=>({level:copy(machineLevels[n]),draft:copy(machineLevels[n].solution)});
const event=(s,type)=>s.events.some(e=>e.type===type);
const e=(s,id)=>s.entities.get(id);
const optics=()=>scene([p('l','light',70,260),p('k','bucket',70,470),p('lens','lens',170,260),p('c','candle',270,279),p('floor','plank',270,305)], [link('rope','l','k')]);
const wind=()=>scene([p('hit','ball',60,60),p('s','switch',60,250),p('fan','fan',140,270),p('w','windmill',280,270),p('g','generator',380,270)], [link('belt','w','g')]);
const gears=()=>scene([p('hit','ball',60,60),p('s','switch',60,200),p('m','motor',140,200),p('a','gear',240,200),p('b','gear',286,200),p('c','gear',332,200)], [link('belt','m','a')]);
const handlers={
  ball:{focus:'b',make:()=>scene([p('b','ball',240,100),p('floor','plank',240,400)]),check:s=>e(s,'b').y>370&&e(s,'b').y<380&&e(s,'b').body.speed<.2,note:'下落、反弹、落稳'},
  bowling:{focus:'b',make:()=>scene([p('b','bowling',240,100),p('floor','plank',240,400)]),check:s=>e(s,'b').y>370&&e(s,'b').y<378&&e(s,'b').body.mass>8,note:'重球下落与碰撞'},
  balloon:{focus:'b',make:()=>scene([p('b','balloon',240,400),p('roof','plank',240,150)]),check:s=>e(s,'b').y<390,note:'上浮、气球顶部碰撞边界'},
  bucket:{focus:'k',make:()=>scene([p('l','light',220,100),p('k','bucket',220,400)], [link('rope','l','k')]),check:s=>e(s,'l').active&&e(s,'k').y<430,note:'下落拉绳、吊住重物'},
  plank:{focus:'floor',make:()=>scene([p('b','ball',240,100),p('floor','plank',240,400)]),check:s=>e(s,'b').body.speed<.2&&e(s,'b').y<380,note:'平台承接与停止'},
  ramp:{focus:'s1',seconds:6,make:()=>puzzle(0),check:s=>s.won,note:'斜面滚动、实际落杯'},
  trampoline:{focus:'bed',make:()=>scene([p('a','ball',220,100),p('b','ball',260,100),p('bed','trampoline',240,400)]),check:s=>s.events.filter(e=>e.type==='bounce').length>=2,note:'双球同时接触与床面形变'},
  switch:{focus:'s',make:()=>puzzle(2),check:s=>event(s,'switch')&&e(s,'s').active,note:'接触后按下、持续供电'},
  fan:{focus:'s1',make:()=>puzzle(2),check:s=>e(s,'s1').active&&e(s,'a').x>280,note:'叶片启动、风线、吹动气球'},
  windmill:{focus:'w',make:wind,check:s=>e(s,'w').phase>0&&e(s,'g').active,note:'风车转轴驱动皮带'},
  generator:{focus:'g',make:wind,check:s=>e(s,'g').active&&e(s,'g').phase>0,note:'皮带输入后发电'},
  motor:{focus:'s1',make:()=>puzzle(3),check:s=>e(s,'s1').active&&e(s,'s1').phase>0,note:'供电后输出旋转'},
  gear:{focus:'b',make:gears,check:s=>e(s,'a').spin>0&&e(s,'b').spin<0&&e(s,'c').spin>0,note:'三齿轮逐级反向'},
  conveyor:{focus:'c',make:()=>puzzle(3),check:s=>s.won,note:'接触输送、落杯、带面方向'},
  light:{focus:'l',make:()=>puzzle(4),check:s=>e(s,'l').active&&event(s,'light'),note:'拉绳点亮、灯光持续'},
  solar:{focus:'s1',make:()=>puzzle(4),check:s=>e(s,'s1').active&&e(s,'s2').active,note:'感光与风扇供电'},
  lens:{focus:'lens',make:optics,check:s=>event(s,'ignite')&&e(s,'c').active,note:'聚光、连续加热后点火'},
  candle:{focus:'c',make:optics,check:s=>e(s,'c').active,note:'烛火启动与持续燃烧'},
  rocket:{focus:'r',make:()=>puzzle(6),check:s=>s.won&&event(s,'ignite'),note:'预热、尾焰、上升、离场停止'},
  fishbowl:{focus:'f',make:()=>puzzle(5),check:s=>e(s,'f').broken&&event(s,'break'),note:'碰到弹丸后破碎'},
  bellows:{focus:'pump',make:()=>scene([p('b','ball',160,80),p('pump','bellows',180,300),p('a','balloon',300,310)]),check:s=>e(s,'pump').spent&&e(s,'a').x>330,note:'按压、风箱收缩、一次喷气'},
  pistol:{focus:'s1',make:()=>puzzle(5),check:s=>event(s,'shot')&&e(s,'f').broken,note:'绳索拉动、一次发射、撞击'},
  scissors:{focus:'cut',make:()=>scene([p('l','light',240,100),p('k','bucket',240,500),p('cut','scissors',240,300),p('b','ball',240,200)], [link('rope','l','k')]),check:s=>event(s,'cut')&&event(s,'rope-cut'),note:'接触闭合、剪绳、重物释放'},
  belt:{focus:'b',make:gears,check:s=>e(s,'a').phase>0&&e(s,'b').phase<0,note:'皮带传动与相邻齿轮换向'},
  rope:{focus:'k',make:()=>scene([p('l','light',220,100),p('k','bucket',220,400)], [link('rope','l','k')]),check:s=>e(s,'l').active&&s.connections[0].slack<8,note:'拉紧、受力、保持悬挂'},
  tennis:{focus:'b',seconds:1.2,make:()=>scene([p('b','tennis',240,100),p('floor','pipe',240,400)]),check:s=>e(s,'b').y<300,note:'轻球接触硬面后高弹跳'},
  baseball:{focus:'b',make:()=>scene([p('b','baseball',240,100),p('floor','pipe',240,400)]),check:s=>e(s,'b').y>370&&e(s,'b').body.speed<.2,note:'较低的弹跳、滚动与落稳'},
  cannonball:{focus:'b',make:()=>scene([p('b','cannonball',240,100),p('floor','pipe',240,400)]),check:s=>e(s,'b').body.mass>10&&e(s,'b').body.speed<.2,note:'重炮弹几乎不弹，接触后停止'},
  pulley:{focus:'s1',make:()=>puzzle(25),check:s=>s.won&&e(s,'b').y<240,note:'双滑轮转向、重球压低左桶提起右桶'},
  hook:{focus:'s1',make:()=>puzzle(34),check:s=>s.won&&e(s,'s2').y<430,note:'挂环、绳索悬挂重物，保持炸药高度'},
  seesaw:{focus:'s1',make:()=>puzzle(26),check:s=>s.won,note:'真实支点转动、落物压杆、另一端弹射'},
  brick:{focus:'wall',make:()=>puzzle(32),check:s=>e(s,'wall').broken,note:'重炮弹击碎砖墙，带出碎块'},
  pipe:{focus:'s2',make:()=>puzzle(27),check:s=>s.won&&!e(s,'s2').broken,note:'金属管承接棒球，不被撞碎'},
  elbow:{focus:'s1',make:()=>puzzle(30),check:s=>s.won,note:'弯管与实际直角碰撞体一致，旋转后改变落向'},
  boxing:{focus:'s1',make:()=>puzzle(27),check:s=>event(s,'punch')&&event(s,'launch')&&s.won,note:'后端受压、弹簧伸出、拳套接触、回缩停止'},
  jack:{focus:'s1',seconds:4,make:()=>puzzle(28),check:s=>event(s,'spring')&&s.won,note:'皮带转一圈蓄力，弹簧伸展、物体发射、回缩'},
  flashlight:{focus:'s1',make:()=>puzzle(29),check:s=>e(s,'s1').active&&s.won,note:'落球按亮，朝前持续照明并为光电板供能'},
  cannon:{focus:'s2',make:()=>puzzle(32),check:s=>event(s,'cannon')&&s.won,note:'引信点燃、后坐与烟尘、重炮弹破墙'},
  dynamite:{focus:'s2',seconds:5,make:()=>puzzle(31),check:s=>event(s,'explode')&&s.won,note:'引信燃烧、延迟爆炸、砖块碎裂、落球入杯'},
  detonator:{focus:'s1',seconds:5,make:()=>puzzle(31),check:s=>event(s,'detonate')&&s.won,note:'压杆下压，通过引爆线启动远处炸药'},
  wire:{focus:'s2',seconds:5,make:()=>puzzle(31),check:s=>event(s,'ignite')&&event(s,'explode')&&s.won,note:'连接引爆器与炸药，只传信号、不传拉力'},
};
export const auditCases=Object.entries(parts).map(([type,d])=>({type,name:d.name,...handlers[type]}));

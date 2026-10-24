const p=(id,type,x,y,extra={})=>({id,type,x,y,...extra});
const cup=(x,y)=>({type:'cup',x,y,w:70,h:64});
export const machineLevels = [
  {id:'first-drop',name:'接住第一颗球',scene:'atelier',goal:'让金色小球落进接球杯。',
    hint:'在小球下方搭一段向右下倾斜的斜坡。',tools:{ramp:1},
    fixed:[p('b','ball',110,100)],target:cup(330,470),
    solution:{pieces:[p('s1','ramp',160,250,{angle:30})],links:[]}},
  {id:'bounce',name:'弹起来',scene:'atelier',goal:'借助弹床，让小球进入高处的杯子。',
    hint:'把弹床放在小球下方，右端放低，让球弹向右上方。',tools:{trampoline:1},
    fixed:[p('b','ball',110,90)],target:cup(330,350),
    solution:{pieces:[p('s1','trampoline',110,420,{angle:15})],links:[]}},
  {id:'wind',name:'借一阵风',scene:'atelier',goal:'打开电源，用风把气球送进右上方圆环。',
    hint:'风扇放在开关右侧、气球左侧；开关被落球碰到后供电。',tools:{fan:1},
    fixed:[p('b','ball',100,100),p('s','switch',100,300),p('a','balloon',240,470)],
    target:{type:'ring',x:385,y:280,w:80,h:80},
    solution:{pieces:[p('s1','fan',180,330)],links:[]}},
  {id:'drive',name:'接上传动',scene:'rooftop',goal:'用电动机带动传送带，把球送进杯子。',
    hint:'电动机已经装好。选皮带，依次点电动机和传送带。',tools:{belt:1},
    fixed:[p('b','ball',190,315),p('hit','ball',80,90),p('s','switch',80,250),p('c','conveyor',220,360),p('s1','motor',150,250)],
    target:cup(365,480),
    solution:{pieces:[],links:[{id:'l1',type:'belt',a:'s1',b:'c'}]}},
  {id:'sunlight',name:'把光变成风',scene:'rooftop',goal:'点亮拉绳灯，让太阳能风扇吹动气球穿过圆环。',
    hint:'太阳能板已经装好。用绳索连接灯和吊桶，再把风扇放在太阳能板右边。',tools:{fan:1,rope:1},
    fixed:[p('l','light',100,220),p('k','bucket',80,420),p('a','balloon',300,470),p('s1','solar',165,240)],
    target:{type:'ring',x:400,y:280,w:76,h:76},
    solution:{pieces:[p('s2','fan',235,300)],links:[{id:'l1',type:'rope',a:'l',b:'k'}]}},
  {id:'glass',name:'一发命中',scene:'rooftop',goal:'用拉绳发射弹丸，打碎鱼缸。',
    hint:'发射器对准鱼缸，再把扳机和下方吊桶用绳索连接。',tools:{pistol:1,rope:1},
    fixed:[p('f','fishbowl',360,240),p('k','bucket',90,410)],target:{type:'break',id:'f',x:360,y:240},
    solution:{pieces:[p('s1','pistol',100,240)],links:[{id:'l1',type:'rope',a:'s1',b:'k'}]}},
  {id:'fire',name:'点火升空',scene:'harbor',goal:'聚光点燃火箭，让它穿过上方圆环。',
    hint:'把放大镜放在灯与火箭尾部之间，再用吊桶拉亮灯。',tools:{lens:1,rope:1},
    fixed:[p('l','light',110,415),p('k','bucket',100,510),p('r','rocket',300,380),p('floor','plank',300,420,{w:100})],
    target:{type:'ring',x:300,y:100,w:82,h:82,accept:'rocket'},
    solution:{pieces:[p('s1','lens',220,410)],links:[{id:'l1',type:'rope',a:'l',b:'k'}]}},
].map(level=>({...level,chapter:'practice',tutorial:true,scene:'atelier'})).concat(formalLevels,expansionLevels);
export const machineChapters=[
  {id:'practice',name:'入门练习'}, {id:'gravity',name:'重力车间'}, {id:'power',name:'屋顶动力'}, {id:'harbor',name:'港湾连锁'},
  {id:'mechanisms',name:'机械实验室'}, {id:'demolition',name:'重型机库'},
];
export const sandbox = {id:'sandbox',name:'自由实验',scene:'harbor',width:1440,height:900,goal:'自由搭建，看看会发生什么。',tools:{},fixed:[],target:null};
import {formalLevels} from './machine-levels-formal.js?v=48';
import {expansionLevels} from './machine-levels-expansion.js?v=48';

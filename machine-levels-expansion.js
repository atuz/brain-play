const p=(id,type,x,y,extra={})=>({id,type,x,y,...extra});
const rope=(id,a,b,via=[])=>({id,type:'rope',a,b,...(via.length?{via}:{})});
const belt=(id,a,b)=>({id,type:'belt',a,b});
const wire=(id,a,b)=>({id,type:'wire',a,b});
const ring=(x,y,accept,entity)=>({type:'ring',x,y,w:90,h:90,accept,entity});
const cup=(x,y,entity)=>({type:'cup',x,y,w:90,h:76,entity});
const broken=(id,x,y)=>({type:'break',id,x,y});
const all=(...goals)=>({type:'all',goals});
const lift=(id,x,y)=>({type:'zone',x,y,w:100,h:90,accept:'bucket',entity:id});

// New non-animal mechanisms, with fixed resources and progressive combinations.
// Existing indices and IDs stay intact. Each layout uses the actual editor grid.
export const expansionLevels=[
  {id:'counterweight-lift',name:'绕轮提桶',chapter:'mechanisms',scene:'foundry',width:800,height:900,timeLimit:30,
    goal:'用重球压低左桶，把右桶提到上方虚线区。',hint:'两个滑轮放在桶的正上方，连接时依次点左桶、两个滑轮、右桶。',tools:{pulley:2,rope:1},
    fixed:[p('a','bucket',220,420),p('b','bucket',500,420),p('weight','bowling',220,270)],target:lift('b',500,200),
    solution:{pieces:[p('s1','pulley',220,150),p('s2','pulley',500,150)],links:[rope('l1','a','b',['s1','s2'])]}},
  {id:'lever-flight',name:'杠杆弹射',chapter:'mechanisms',scene:'foundry',width:800,height:800,timeLimit:30,
    goal:'让重球压跷跷板，把网球弹过高处圆环。',hint:'把支点放在两球之间；网球靠近右端，重球落在左端。',tools:{seesaw:1},
    fixed:[p('heavy','bowling',180,120),p('b','tennis',300,450),p('wall','brick',360,470,{w:18,h:130})],target:ring(410,230,'tennis','b'),
    solution:{pieces:[p('s1','seesaw',240,470)],links:[]}},
  {id:'punch-pass',name:'拳套传球',chapter:'mechanisms',scene:'foundry',width:800,height:700,timeLimit:30,
    goal:'接住棒球，用拳套把它打向鱼缸。',hint:'先用金属直管托住棒球，再让落球压中拳套后端的按钮。',tools:{boxing:1,pipe:1},
    fixed:[p('hit','ball',170,140),p('b','baseball',280,300),p('f','fishbowl',450,330)],target:broken('f',450,330),
    solution:{pieces:[p('s1','boxing',200,300),p('s2','pipe',280,330)],links:[]}},
  {id:'wind-up-launch',name:'蓄力升空',chapter:'mechanisms',scene:'foundry',width:800,height:800,timeLimit:30,
    goal:'用电机给弹簧盒蓄力，把棒球弹过高处圆环。',hint:'弹簧盒放在棒球下方；接上电机后，需要转够一圈才弹射。',tools:{jack:1,motor:1,belt:1},
    fixed:[p('b','baseball',400,450),p('hit','ball',60,100),p('s','switch',60,280)],target:ring(460,210,'baseball','b'),
    solution:{pieces:[p('s1','jack',400,500),p('s2','motor',140,280)],links:[belt('l1','s2','s1')]}},
  {id:'beam-delivery',name:'定向照明',chapter:'mechanisms',scene:'foundry',width:900,height:750,timeLimit:35,
    goal:'按亮手电筒，用光驱动传送带，把球送进杯子。',hint:'手电筒只朝前照；太阳能板要在光束内，电机要靠近太阳能板。',tools:{flashlight:1,solar:1,motor:1,belt:1},
    fixed:[p('hit','ball',100,80),p('c','conveyor',500,420),p('b','ball',480,330)],target:cup(650,580,'b'),
    solution:{pieces:[p('s1','flashlight',100,250),p('s2','solar',280,250),p('s3','motor',360,270)],links:[belt('l1','s3','c')]}},
  {id:'steel-corner',name:'转角反弹',chapter:'mechanisms',scene:'foundry',width:800,height:800,timeLimit:30,
    goal:'用弯管改变重炮弹的落下方向，让它穿过左侧圆环。',hint:'弯管旋转后会形成斜挡面，炮弹很重，弹跳很低。',tools:{elbow:1},
    fixed:[p('b','cannonball',300,100)],target:ring(160,550,'cannonball','b'),
    solution:{pieces:[p('s1','elbow',300,450,{angle:30})],links:[]}},

  {id:'remote-demolition',name:'遥控破障',chapter:'demolition',scene:'hangar',width:800,height:850,timeLimit:35,
    goal:'引爆砖墙上的炸药，让小球落进下方杯子。',hint:'落球压引爆器，用引爆线接到炸药；炸药放在砖墙上，小球会先等在那里。',tools:{detonator:1,dynamite:1,wire:1},
    fixed:[p('hit','ball',100,80),p('b','ball',400,100),p('wall','brick',400,430,{w:180})],target:cup(400,700,'b'),
    solution:{pieces:[p('s1','detonator',100,250),p('s2','dynamite',400,400)],links:[wire('l1','s1','s2')]}},
  {id:'cannon-breach',name:'炮击开路',chapter:'demolition',scene:'hangar',width:900,height:900,timeLimit:35,
    goal:'炮弹先击碎砖墙，再打碎后面的鱼缸。',hint:'用灯和放大镜点燃炮引信；破墙会消耗速度，鱼缸要在后续落点上。',tools:{cannon:1,lens:1,rope:1},
    fixed:[p('l','light',100,200),p('k','bucket',100,430),p('wall','brick',530,240,{angle:90}),p('f','fishbowl',650,500)],target:all(broken('wall',530,240),broken('f',650,500)),
    solution:{pieces:[p('s1','lens',200,200),p('s2','cannon',300,220)],links:[rope('l1','l','k')]}},
  {id:'lift-and-blast',name:'提桶与爆破',chapter:'demolition',scene:'hangar',width:900,height:950,timeLimit:40,
    goal:'提起右桶，同时让左桶落下引爆远处砖墙。',hint:'重球让左桶变重；滑轮提起右桶，左桶继续向下压到引爆器。',tools:{pulley:2,rope:1,detonator:1,dynamite:1,wire:1},
    fixed:[p('a','bucket',220,420),p('b','bucket',500,420),p('weight','bowling',220,270),p('wall','brick',700,650,{angle:90}),p('stand','pipe',600,680)],target:all(lift('b',500,200),broken('wall',700,650)),
    solution:{pieces:[p('s1','pulley',220,150),p('s2','pulley',500,150),p('s3','detonator',220,710),p('s4','dynamite',600,650)],links:[rope('l1','a','b',['s1','s2']),wire('l2','s3','s4')]}},
  {id:'suspended-charge',name:'吊装爆破',chapter:'demolition',scene:'hangar',width:850,height:900,timeLimit:40,
    goal:'把炸药保持在高处，引爆右侧砖墙。',hint:'挂环用绳索吊住桶，把炸药放在桶上；没有悬挂，点火前炸药就掉远了。',tools:{hook:1,bucket:1,rope:1,dynamite:1,detonator:1,wire:1},
    fixed:[p('hit','ball',100,80),p('wall','brick',600,370,{angle:90})],target:broken('wall',600,370),
    solution:{pieces:[p('s1','hook',500,150),p('s2','bucket',500,420),p('s3','dynamite',500,370),p('s4','detonator',100,250)],links:[rope('l1','s1','s2'),wire('l2','s4','s3')]}},
  {id:'spring-powered-line',name:'弹射接通流水线',chapter:'demolition',scene:'hangar',width:1300,height:850,timeLimit:50,
    goal:'弹起棒球，压亮高处手电筒，再运送远处小球入杯。',hint:'先给弹簧盒蓄力；手电筒放在棒球回落的地方，光电动力再接向远端。',tools:{jack:1,motor:2,belt:2,flashlight:1,solar:1},
    fixed:[p('b','baseball',400,450),p('hit','ball',60,100),p('s','switch',60,280),p('c','conveyor',940,420),p('cargo','ball',920,330)],target:cup(1100,580,'cargo'),
    solution:{pieces:[p('s1','jack',400,500),p('s2','motor',140,280),p('s3','flashlight',480,300),p('s4','solar',660,300),p('s5','motor',740,340)],links:[belt('l1','s2','s1'),belt('l2','s5','c')]}},
  {id:'high-shot-demolition',name:'越墙引爆总装',chapter:'demolition',scene:'hangar',width:1500,height:1050,timeLimit:60,
    goal:'炮弹越过金属墙，压下引爆器，炸开远处两面砖墙。',hint:'大炮需要抬高炮口越墙；远端炸药要用吊桶悬在两面砖墙之间。',tools:{cannon:1,lens:1,rope:2,detonator:1,wire:1,dynamite:1,hook:1,bucket:1},
    fixed:[p('l','light',100,200),p('k','bucket',100,430),p('steel','pipe',600,430,{w:400,angle:90}),p('guard','pipe',920,430,{w:600,angle:90}),p('w1','brick',1150,450,{angle:90}),p('w2','brick',1120,550,{angle:90})],target:all(broken('w1',1150,450),broken('w2',1120,550)),
    solution:{pieces:[p('s1','lens',200,200),p('s2','cannon',300,220,{angle:-15}),p('s3','detonator',800,320),p('s4','hook',1050,250),p('s5','bucket',1050,500),p('s6','dynamite',1050,450)],links:[rope('l1','l','k'),rope('l2','s4','s5'),wire('l3','s3','s6')]}},
];

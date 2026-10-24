import {dimensions,direction} from './machine-parts.js?v=48';
const TAU=Math.PI*2;
const round=(c,x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
const line=(c,x,y,X,Y,color,width=2)=>{c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=color;c.lineWidth=width;c.stroke();};
const circle=(c,x,y,r,fill,stroke)=>{c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
const extras=new Set(['tennis','baseball','cannonball','pulley','hook','seesaw','brick','pipe','elbow','boxing','jack','flashlight','cannon','dynamite','detonator']);
function coil(c,x,y,length,vertical=false){c.save();c.translate(x,y);if(vertical)c.rotate(-Math.PI/2);c.beginPath();c.moveTo(0,0);for(let i=1;i<=18;i++)c.lineTo(length*i/18,i===18?0:(i%2?5:-5));c.strokeStyle='#7e928c';c.lineWidth=2;c.stroke();c.restore();}
export function drawExtra(c,e,time,{directionCue=false}={}){
  if(!extras.has(e.type))return false;
  const {w,h}=dimensions(e),d=direction(e),elapsed=time-(e.started??-10);
  if(['brick','pipe','elbow','cannon'].includes(e.type))c.rotate((e.angle||0)*Math.PI/180);
  if(['tennis','baseball','cannonball'].includes(e.type))c.rotate(e.rotation||0);
  switch(e.type){
    case 'tennis':case 'baseball':case 'cannonball':{
      const r=e.type==='cannonball'?17:12,g=c.createRadialGradient(-r*.4,-r*.5,1,0,0,r);
      const colors=e.type==='tennis'?['#e8eba4','#a6b854','#778b42']:e.type==='baseball'?['#fff9e7','#e5dfca','#b6b2a2']:['#adb6b5','#66737b','#394b57'];
      g.addColorStop(0,colors[0]);g.addColorStop(.7,colors[1]);g.addColorStop(1,colors[2]);circle(c,1,3,r,'#596f6b22');circle(c,0,0,r,g,colors[2]);
      if(e.type!=='cannonball')for(const side of [-1,1]){c.beginPath();c.arc(side*15,0,15,side===1?2.4:-.75,side===1?3.9:.75);c.strokeStyle=e.type==='tennis'?'#f8f1c9':'#b86e59';c.lineWidth=e.type==='tennis'?2:1.3;c.stroke();}break;}
    case 'pulley':{
      round(c,-6,-26,12,28,4,'#a6aa91','#75877a');circle(c,0,0,20,'#a4b8ae','#5e7c78');circle(c,0,0,16,'#d8d9bb','#8e9e85');c.save();c.rotate(e.phase||0);for(let i=0;i<4;i++){c.rotate(Math.PI/2);line(c,0,4,0,14,'#8d9c83',3);}c.restore();circle(c,0,0,5,'#c5a167','#7b8368');break;}
    case 'hook':round(c,-13,-15,26,8,3,'#a5b6ab','#6b867e');line(c,0,-6,0,4,'#748c83',5);c.beginPath();c.arc(-4,7,9,-Math.PI/2,Math.PI*.85);c.strokeStyle='#819b92';c.lineWidth=5;c.stroke();break;
    case 'seesaw':{
      c.beginPath();c.moveTo(0,3);c.lineTo(-18,29);c.lineTo(18,29);c.closePath();c.fillStyle='#79938d';c.fill();c.strokeStyle='#567a74';c.stroke();
      c.save();c.rotate(e.rotation??(e.angle||0)*Math.PI/180);round(c,-w/2,-7,w,14,4,'#c9a772','#8f7653');line(c,-w/2+6,-3,w/2-6,-3,'#e9cf9a',2);circle(c,d*(w/2-12),0,4,null,'#7d8c77');c.restore();circle(c,0,2,6,'#adbdb0','#6e8c80');circle(c,0,2,2,'#d7bb7e');break;}
    case 'brick':{
      if(e.broken)break;
      round(c,-w/2,-h/2,w,h,3,'#b77e64','#986b56');line(c,-w/2+2,0,w/2-2,0,'#e1b29b',2);for(let row=0;row<2;row++)for(let x=-w/2+18+row*18;x<w/2;x+=36)line(c,x,row?1:-h/2,x,row?h/2:-1,'#dfb098',2);line(c,-w/2+3,-h/2+2,w/2-3,-h/2+2,'#d7a089');break;}
    case 'pipe':round(c,-w/2,-9,w,18,5,'#8fa6a3','#5a7a78');line(c,-w/2+4,-4,w/2-4,-4,'#d6e0cf',3);for(const x of [-w/2+10,w/2-10])round(c,x-4,-11,8,22,3,'#bdc9ba','#6c8b82');break;
    case 'elbow':{
      round(c,-22,-50,16,72,5,'#91a9a5','#5b7b78');round(c,-22,6,72,16,5,'#91a9a5','#5b7b78');line(c,-17,-45,-17,10,'#d7e1d2',3);line(c,-17,10,45,10,'#d7e1d2',3);round(c,-25,-47,22,8,3,'#b8c7b9','#6c8b82');round(c,37,3,8,22,3,'#b8c7b9','#6c8b82');break;}
    case 'boxing':{
      c.scale(d,1);const reach=e.extension||0;round(c,-35,-18,35,36,5,'#b4a782','#857f61');round(c,-38,-12,8,24,3,e.spent?'#b99166':'#d1b376','#8f805e');coil(c,-4,0,20+reach);round(c,6+reach,-15,27,30,9,'#c57e68','#955d50');round(c,8+reach,-15,21,12,7,'#e5ac8c');circle(c,5+reach,6,8,'#bd755f','#955d50');break;}
    case 'jack':{
      const ext=e.extension||0;round(c,-31,-15,62,45,5,'#acaa83','#7c8567');round(c,-26,-10,52,34,3,'#c8c296');for(let x=-20;x<25;x+=13)circle(c,x,17,2,'#a09e75');coil(c,0,-17,15+ext,true);round(c,-32,-36-ext,64,10,4,'#9eaf99','#637f72');circle(c,-20,5,9,'#d4b77a','#8b8965');line(c,-20,5,-20+Math.cos(e.phase||0)*7,5+Math.sin(e.phase||0)*7,'#728a7b',2);
      if(!e.spent){c.beginPath();c.arc(15,5,10,-Math.PI/2,-Math.PI/2+Math.min(1,(e.charge||0)/TAU)*TAU);c.strokeStyle='#547f71';c.lineWidth=3;c.stroke();}break;}
    case 'flashlight':{
      c.scale(d,1);if(e.active){const g=c.createLinearGradient(25,0,260,0);g.addColorStop(0,'#f5df8d50');g.addColorStop(1,'#f5df8d00');c.beginPath();c.moveTo(24,-10);c.lineTo(260,-53);c.lineTo(260,53);c.lineTo(24,10);c.closePath();c.fillStyle=g;c.fill();}
      round(c,-31,-13,49,26,6,'#bda874','#8b835b');round(c,-13,-18,17,7,3,e.active?'#7f9876':'#d3bd85','#89916e');round(c,14,-17,18,34,5,'#7f9a8d','#597b72');line(c,29,-12,29,12,e.active?'#fff0ad':'#cbd6bc',4);break;}
    case 'cannon':{
      c.scale(d,1);const recoil=e.spent&&elapsed<.2?-Math.sin(elapsed/.2*Math.PI)*7:0;
      for(const x of [-22,20]){circle(c,x,17,13,'#899c8d','#546f6b');circle(c,x,17,6,'#c8ba89','#81917b');}round(c,-29,-15,62,24,8,'#8a9c96','#536f70');round(c,-14+recoil,-22,51,22,5,'#a0b1a6','#607e77');round(c,30+recoil,-24,10,26,4,'#b8c5b6','#607e77');line(c,-26,-16,-26,-24,'#9c865d',2);if(e.active&&!e.spent)circle(c,-26,-25,4,'#f2cb71');break;}
    case 'dynamite':{
      if(e.broken)break;for(const x of [-8,0,8])round(c,x-5,-13,10,31,3,x===0?'#d38c69':'#b96e59','#975c4b');round(c,-15,-1,30,8,1,'#d6b48a');line(c,0,-14,4,-22,'#897953',2);if(e.active){circle(c,4,-22,3+Math.sin(time*30),'#f8d880');line(c,0,-24,7,-19,'#e8af59',2);}break;}
    case 'detonator':{
      round(c,-25,-4,50,30,4,'#ba9167','#876f52');round(c,-19,2,38,18,2,'#d0b78b');line(c,0,-6,0,e.spent?-11:-25,'#667f79',7);round(c,-22,e.spent?-14:-28,44,7,3,'#ab7458','#805e49');circle(c,0,10,6,e.spent?'#d08a62':'#a49b70','#8d8061');break;}
  }
  if(directionCue&&['boxing','flashlight','cannon'].includes(e.type)){line(c,44,0,71,0,'#4d8a79',2);line(c,64,-5,71,0,'#4d8a79',2);line(c,64,5,71,0,'#4d8a79',2);}
  return true;
}

export function drawEffects(c,effects,time){
  for(const fx of effects){const age=time-fx.at;if(age<0||age>.8||fx.type==='glass')continue;
    c.save();c.translate(fx.x,fx.y);c.globalAlpha=Math.max(0,1-age/.8);
    if(fx.type==='blast'){circle(c,0,0,15+age*160,'#e8b26833','#ce9960');circle(c,0,0,10+age*90,'#f7dc9770');}
    for(let i=0;i<12;i++){const angle=i/12*TAU,speed=(fx.type==='blast'?100:45)+(i%3)*20,x=Math.cos(angle)*age*speed,y=Math.sin(angle)*age*speed+age*age*75;
      if(fx.type==='smoke')circle(c,x,y,5+age*10,'#9bada744');else round(c,x,y,fx.type==='rubble'?7:4,5,1,fx.type==='rubble'?'#b78366':'#d6ad64');}
    c.restore();
  }
}

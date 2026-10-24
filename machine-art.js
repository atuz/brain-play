import {parts,dimensions,direction,WIDTH,HEIGHT} from './machine-parts.js?v=48';
import {connectionPaths,traceConnection} from './machine-links.js?v=48';
import {goalsOf} from './machine-goals.js?v=48';
import {drawExtra,drawEffects} from './machine-extra-art.js?v=48';
const TAU=Math.PI*2;
const rr=(c,x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
function line(c,x,y,X,Y,color,width=2){c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function circle(c,x,y,r,fill,stroke){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function cog(c,r,rotation,color='#9aafb0'){
  c.save();c.rotate(rotation);c.beginPath();
  for(let i=0;i<48;i++){const a=i/48*TAU,R=i%4<2?r:r*.82;const x=Math.cos(a)*R,y=Math.sin(a)*R;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fillStyle=color;c.fill();c.strokeStyle='#526d72';c.lineWidth=1.5;c.stroke();
  circle(c,0,0,r*.58,'#e5eeea','#627d80');for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);line(c,r*.16,0,r*.52,0,'#8a9fa1',5);c.restore();}circle(c,0,0,r*.18,'#647d7e');circle(c,-r*.05,-r*.05,r*.05,'#dbe6e0');c.restore();
}
function flame(c,x,y,time,size=13){
  c.save();c.translate(x,y);const sway=Math.sin(time*15)*2;c.fillStyle='#e4af50';c.beginPath();c.moveTo(-5,0);c.quadraticCurveTo(-10,-size*.5,sway,-size);c.quadraticCurveTo(8,-size*.4,5,0);c.fill();c.fillStyle='#fff4ba';c.beginPath();c.ellipse(0,-3,3,6,0,0,TAU);c.fill();c.restore();
}
function fish(c,x,y,time){c.save();c.translate(x,y);c.scale(Math.cos(time*2)>0?1:-1,1);c.fillStyle='#dca754';c.beginPath();c.ellipse(0,0,10,5,0,0,TAU);c.fill();c.beginPath();c.moveTo(-8,0);c.lineTo(-15,-6);c.lineTo(-15,6);c.closePath();c.fill();circle(c,5,-1,1.5,'#364f55');c.restore();}

export function drawPart(c,e,time=0,{ghost=false,icon=false,directionCue=false}={}){
  const d=parts[e.type];if(!d)return;
  const {w,h}=dimensions(e),D=direction(e),motion=e.phase??(e.spin?time*e.spin:e.rotation||0);
  c.save();c.translate(e.x,e.y);c.globalAlpha=ghost?.38:1;c.lineWidth=1.5;c.lineCap='round';c.lineJoin='round';
  if(drawExtra(c,e,time,{directionCue})){c.restore();return;}
  if(['plank','ramp','trampoline'].includes(e.type))c.rotate((e.angle||0)*Math.PI/180);
  if(['ball','bowling'].includes(e.type))c.rotate(e.rotation||0);
  switch(e.type){
    case 'ball':case 'bowling':{
      const r=e.projectile?5:d.r,g=c.createRadialGradient(-r*.4,-r*.45,1,0,0,r);g.addColorStop(0,e.type==='ball'?'#f6d997':'#90a7bf');g.addColorStop(.7,d.color);g.addColorStop(1,e.type==='ball'?'#a57635':'#344d67');circle(c,1,3,r,'#65796e25');circle(c,0,0,r,g,e.type==='ball'?'#9b763e':'#344d67');
      if(e.type==='ball'&&!e.projectile){c.strokeStyle='#aa7a3f88';c.beginPath();c.arc(-10,0,15,-1.1,1.1);c.stroke();}else if(!e.projectile){for(const [x,y]of [[-4,-5],[4,-5],[0,2]])circle(c,x,y,2,'#253c52');}break;}
    case 'balloon':{
      const g=c.createRadialGradient(-7,-10,2,0,0,25);g.addColorStop(0,'#e8a18b');g.addColorStop(1,'#b35f52');c.fillStyle=g;c.beginPath();c.ellipse(0,0,18,23,Math.sin(time*2)*.025,0,TAU);c.fill();c.strokeStyle='#984e47';c.stroke();c.fillStyle='#b96454';c.beginPath();c.moveTo(-3,22);c.lineTo(3,22);c.lineTo(0,17);c.fill();c.beginPath();c.moveTo(0,23);c.bezierCurveTo(6,27,-6,30,1,35);c.strokeStyle='#a29175';c.stroke();c.beginPath();c.ellipse(-6,-12,4,7,-.4,0,TAU);c.fillStyle='#fff0d5aa';c.fill();break;}
    case 'plank':case 'ramp':{
      rr(c,-w/2,-h/2+4,w,h,3,'#8a6b49');const g=c.createLinearGradient(0,-h/2,0,h/2);g.addColorStop(0,'#d7b782');g.addColorStop(1,'#b58d59');rr(c,-w/2,-h/2,w,h-3,3,g,'#9b794e');line(c,-w/2+5,-2,w/2-5,-2,'#e9cc9c',1);for(const x of [-w/2+8,w/2-8]){circle(c,x,0,1.6,'#786c59');}break;}
    case 'trampoline':{
      const bump=e.bump&&time-e.bump<.3?Math.sin((time-e.bump)*Math.PI/.3)*8:0;
      line(c,-w/2+6,6,-w/2+2,18,'#687e7c',4);line(c,w/2-6,6,w/2-2,18,'#687e7c',4);
      rr(c,-w/2,-7,w,14,6,'#8aaf9b','#557e75');c.beginPath();c.moveTo(-w/2+8,-3);c.quadraticCurveTo(0,bump,w/2-8,-3);c.strokeStyle='#e8efdc';c.lineWidth=4;c.stroke();for(let x=-w/2+10;x<w/2-7;x+=9)line(c,x,4,x,9,'#476b67',1);break;}
    case 'bucket':{
      c.beginPath();c.arc(0,-12,20,Math.PI,TAU);c.strokeStyle='#708b8e';c.lineWidth=3;c.stroke();c.beginPath();c.moveTo(-22,-9);c.lineTo(22,-9);c.lineTo(15,23);c.lineTo(-15,23);c.closePath();const g=c.createLinearGradient(-20,0,20,0);g.addColorStop(0,'#8fa3a2');g.addColorStop(.3,'#c4d4cc');g.addColorStop(1,'#768e90');c.fillStyle=g;c.fill();c.strokeStyle='#577679';c.lineWidth=1.5;c.stroke();line(c,-9,-5,-6,18,'#e1e8d8',2);rr(c,-24,-11,48,5,2,'#bed0c5','#718c8c');break;}
    case 'switch':{
      rr(c,-25,-18,50,39,7,'#adac92','#7d8b77');rr(c,-23,-20,46,36,6,'#e7e8d7','#9da98f');rr(c,-17,-12,13,22,3,'#5a716a');rr(c,-15,e.active?0:-10,9,10,2,e.active?'#e4ad57':'#a7b6a3');for(const y of [-7,7]){circle(c,12,y,6,'#b9c5ae');line(c,10,y-2,10,y+2,'#567265',1);line(c,14,y-2,14,y+2,'#567265',1);}circle(c,0,-13,2,e.active?'#e6ae55':'#a8b3a0');break;}
    case 'fan':{
      c.scale(D,1);line(c,-3,11,-3,24,'#53777c',6);rr(c,-18,23,33,5,2,'#749695','#4d7076');rr(c,-23,-8,20,16,5,'#92abaa','#527d80');circle(c,4,-3,23,'#d9e5dc','#527d80');c.save();c.translate(4,-3);c.rotate(e.phase??(e.active?time*16:0));for(let i=0;i<3;i++){c.rotate(TAU/3);c.beginPath();c.ellipse(0,-10,7,12,.4,0,TAU);c.fillStyle='#5a8b8c';c.fill();}c.restore();for(const r of [12,20])circle(c,4,-3,r,null,'#8aa8a333');line(c,-17,-3,25,-3,'#afc1b5',1);line(c,4,-25,4,19,'#afc1b5',1);circle(c,4,-3,4,'#d9b566','#8f8c63');if(e.active){c.save();c.globalAlpha=.35;for(const y of [-18,0,18]){const x=40+((time*65+y+40)%65);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+16,y-7,x+32,y);c.strokeStyle='#689b98';c.lineWidth=1.6;c.stroke();}c.restore();}break;}
    case 'windmill':{
      line(c,0,0,0,31,'#9b865e',6);rr(c,-14,29,28,4,2,'#b69c6a');c.save();c.rotate(motion);for(let i=0;i<4;i++){c.rotate(Math.PI/2);rr(c,-5,-29,10,24,2,'#d7b777','#9d895b');line(c,-4,-18,4,-18,'#ab925e');}c.restore();circle(c,0,0,7,'#6a8f86','#4c756e');circle(c,0,0,3,'#bcd0b7');break;}
    case 'gear':cog(c,24,motion);break;
    case 'motor':case 'generator':{
      c.scale(D,1);rr(c,-27,-17,54,34,6,e.type==='motor'?'#789c96':'#9ea88a','#4d7672');rr(c,-20,-21,27,6,2,'#b6c4ad');for(let x=-8;x<18;x+=6)line(c,x,-11,x,11,'#4e7d77',2);rr(c,-28,17,56,4,2,'#8c9e87');c.save();c.translate(-19,0);cog(c,11,motion*D,'#d5b574');c.restore();circle(c,20,-12,3,e.active?'#e3b65f':'#b4bfaa');break;}
    case 'conveyor':{
      rr(c,-w/2,-11,w,22,10,'#b7c7ac','#587b70');rr(c,-w/2+4,-7,w-8,14,7,'#6f9380');for(let i=-w/2+12;i<w/2-5;i+=14){const x=i+((motion*D*5)%14);line(c,x,-6,x-4,6,'#adc2a6',1.5);}for(const x of [-w/2+12,w/2-12]){c.save();c.translate(x,0);cog(c,7,motion*D);c.restore();}const travel=D*(Math.sign(e.spin)||Math.sign(e.phase)||1);for(const x of [-14,0,14]){line(c,x-3*travel,-3,x+2*travel,0,'#d4dfc6',1.7);line(c,x-3*travel,3,x+2*travel,0,'#d4dfc6',1.7);}break;}
    case 'light':{
      if(e.active){const g=c.createRadialGradient(0,-6,3,0,-6,65);g.addColorStop(0,'#efd47b77');g.addColorStop(1,'#efd47b00');circle(c,0,-6,65,g);}
      line(c,8,15,8,30,'#a39169',1);circle(c,8,31,3,'#b19556');rr(c,-19,12,38,5,2,'#8aa296','#5c8078');circle(c,0,-6,15,e.active?'#ffe6a0':'#d6ddd0','#9cae98');line(c,-5,4,-2,13,'#a7a37a');line(c,5,4,2,13,'#a7a37a');line(c,-5,-3,0,0,'#c6a466');line(c,0,0,5,-3,'#c6a466');break;}
    case 'solar':{
      rr(c,-34,-19,68,38,5,'#899b92','#597d79');rr(c,-31,-16,43,31,2,e.active?'#598c94':'#416778');for(let x=-28;x<12;x+=13)for(let y=-13;y<13;y+=13)rr(c,x,y,10,10,1,e.active?'#85b2b0':'#688e9b','#a6b9b044');for(const y of [-8,8])circle(c,24,y,5,'#d5ddcc','#718b7f');circle(c,24,-8,1.5,e.active?'#e2b866':'#70867a');break;}
    case 'lens':{
      if(directionCue){line(c,D*20,0,D*49,0,'#558b7c',2);line(c,D*42,-5,D*49,0,'#558b7c',2);line(c,D*42,5,D*49,0,'#558b7c',2);}
      line(c,0,9,0,25,'#718b86',5);circle(c,0,-6,12,'#b0d6cc66','#c9a65f');circle(c,0,-6,9,null,'#eff4df');line(c,-5,-11,4,-16,'#fff8da',2);break;}
    case 'candle':{
      rr(c,-15,12,30,7,3,'#c5a365','#958357');rr(c,-6,-15,12,29,3,'#d28e6e','#a97255');line(c,-3,-11,-3,8,'#e9b291',1);line(c,0,-15,1,-20,'#685f45',1);if(e.active??e.lit)flame(c,0,-19,time);break;}
    case 'rocket':{
      if(e.active&&!e.spent){c.save();c.translate(0,31);c.rotate(Math.PI);flame(c,0,0,time,22+Math.sin(time*31)*6);c.restore();}
      c.fillStyle='#b97561';c.beginPath();c.moveTo(-7,13);c.lineTo(-15,27);c.lineTo(-5,24);c.lineTo(5,24);c.lineTo(15,27);c.lineTo(7,13);c.fill();rr(c,-9,-14,18,38,6,'#dfc992','#a98a58');c.beginPath();c.moveTo(-9,-13);c.quadraticCurveTo(-6,-25,0,-29);c.quadraticCurveTo(8,-23,9,-13);c.fillStyle='#c27d63';c.fill();circle(c,0,0,5,'#80aaa5','#687f74');line(c,-4,-11,-4,16,'#f3e7bd',2);break;}
    case 'fishbowl':{
      if(e.broken){c.fillStyle='#8abcb387';c.beginPath();c.ellipse(0,20,40,6,0,0,TAU);c.fill();for(let i=0;i<7;i++){c.beginPath();c.moveTo(-22+i*7,20);c.lineTo(-26+i*7,9-(i%3)*3);c.lineTo(-15+i*7,18);c.fillStyle='#b9dbd4';c.fill();c.strokeStyle='#719b9b';c.stroke();}fish(c,0,12-Math.abs(Math.sin(time*9))*6,time);break;}
      circle(c,0,1,25,'#d7ebe454','#8aacaa');c.save();c.beginPath();c.arc(0,1,23,0,TAU);c.clip();c.fillStyle='#9ec6bf6b';c.fillRect(-25,-7,50,40);fish(c,Math.sin(time*1.8)*7,6,time);line(c,-23,-7,23,-7,'#bcd6c3',1);c.restore();rr(c,-15,-24,30,5,2,'#c7dcd1','#729a97');line(c,-17,-13,-20,-5,'#ffffffa0',3);break;}
    case 'bellows':{
      c.scale(D,1);const elapsed=time-(e.started||0),open=e.spent?20-14*Math.max(0,1-Math.abs(elapsed-.1)/.15):20;c.beginPath();c.moveTo(-30,-open);c.lineTo(17,-4);c.lineTo(17,4);c.lineTo(-30,open);c.closePath();c.fillStyle='#c3b99d';c.fill();c.strokeStyle='#7e846d';c.stroke();for(let x=-20;x<15;x+=7){const h=(15-x)/45*open;line(c,x,-h,x+3,h,'#718576',1.5);}line(c,-35,-open,-22,-open+4,'#be855e',6);line(c,-35,open,-22,open-4,'#be855e',6);rr(c,16,-5,19,10,2,'#ceb078','#98865e');break;}
    case 'pistol':{
      c.scale(D,1);rr(c,-29,-10,59,15,4,'#8ca3a5','#537b7e');rr(c,1,-7,31,8,2,'#bdcdc6','#739692');rr(c,-19,2,11,17,3,'#b58a63','#8e7958');circle(c,-5,8,7,null,'#758d86');line(c,-1,5,-1,11,'#9a7e53',2);if(e.spent&&time-e.started<.12){c.strokeStyle='#e5bd6a';for(let a=0;a<TAU;a+=TAU/8)line(c,36+Math.cos(a)*4,Math.sin(a)*4,36+Math.cos(a)*12,Math.sin(a)*12,'#e5bd6a',2);}break;}
    case 'scissors':{
      const a=e.spent?.45-.62*Math.min(1,(time-e.started)/.12):.45;
      for(const side of [-1,1]){c.save();c.rotate(-side*a);circle(c,side*11,15,7,null,'#be8667');line(c,side*8,9,0,0,side===-1?'#719292':'#afc2b8',4);line(c,0,0,-side*4,-23,side===-1?'#719292':'#afc2b8',4);c.restore();}
      circle(c,0,0,3,'#cbb279');break;}
  }
  if(e.type==='trampoline'&&directionCue){
    // Draw in the same rotated frame as the bed, so the force preview cannot
    // acquire the opposite angle from the visible surface.
    c.globalAlpha=ghost?.65:1;
    for(const [color,width]of [['#fff9e8',7],['#397d73',3]]){
      line(c,0,-20,0,-56,color,width);
      line(c,-7,-47,0,-56,color,width);line(c,7,-47,0,-56,color,width);
    }
  }
  c.restore();
}
function background(c,scene,time,width=WIDTH,height=HEIGHT){
  const palettes={atelier:['#f6efdf','#e7e7d6'],rooftop:['#e9eee6','#d4e2dc'],harbor:['#eef1e5','#cfddd9'],foundry:['#edeadd','#d3dcd3'],hangar:['#e7ebea','#c5d4d4']};
  const [top,bottom]=palettes[scene]||palettes.atelier;
  const g=c.createLinearGradient(0,0,0,height);g.addColorStop(0,top);g.addColorStop(1,bottom);c.fillStyle=g;c.fillRect(0,0,width,height);
  c.save();c.globalAlpha=.2;c.strokeStyle='#829b88';c.lineWidth=.6;
  c.beginPath();for(let x=20;x<width;x+=20)for(let y=20;y<height;y+=20){c.moveTo(x-1,y);c.lineTo(x+1,y);c.moveTo(x,y-1);c.lineTo(x,y+1);}c.stroke();c.restore();
  // Quiet, original chapter scenery stays behind the working surface.
  c.save();c.globalAlpha=.35;
  if(scene==='atelier'){
    rr(c,width-132,26,100,125,35,'#d1dcc6');rr(c,width-123,35,82,105,29,'#e8edda');line(c,width-82,37,width-82,140,'#c4d1bc',4);line(c,width-121,88,width-41,88,'#c4d1bc',4);
    circle(c,width-62,64,18,'#ead39b');
  }else if(scene==='rooftop'){
    circle(c,380,70,28,'#e6cf98');for(let i=0;i<9;i++){const h=30+(i*37)%85;rr(c,i*65-10,height-h-22,44,h,2,'#9db4aa');for(let y=height-h-10;y<height-40;y+=15)for(let x=i*65;x<i*65+30;x+=12)rr(c,x,y,4,6,1,'#e5ead9');}
  }else if(scene==='foundry'||scene==='hangar'){
    const step=scene==='foundry'?260:340;
    for(let x=40;x<width;x+=step){roundSupport(c,x,height,scene);}
    line(c,0,50,width,50,'#a8b6ab',8);line(c,0,height-130,width,height-130,'#b1bcae',6);
    if(scene==='hangar'){rr(c,width-260,height-290,170,210,14,'#a4b9b2','#8aa89c');for(let y=height-270;y<height-90;y+=24)line(c,width-250,y,width-100,y,'#ccdbce',3);}
  }else{
    for(let y=height-120;y<height;y+=20){c.beginPath();c.moveTo(0,y);for(let x=0;x<=width;x+=10)c.lineTo(x,y+Math.sin(x/40+time*.2)*3);c.strokeStyle='#a5bdb4';c.stroke();}
    c.beginPath();c.moveTo(340,height-70);c.lineTo(425,height-70);c.lineTo(410,height-52);c.lineTo(355,height-52);c.closePath();c.fillStyle='#a1b6a6';c.fill();line(c,380,height-72,380,height-150,'#9bad96',3);c.beginPath();c.moveTo(374,height-145);c.lineTo(342,height-80);c.lineTo(374,height-80);c.fillStyle='#ecdfb4';c.fill();
  }c.restore();
  line(c,0,height-9,width,height-9,'#bdcbb7',3);line(c,0,height-5,width,height-5,'#e7ecd9',3);
}
function roundSupport(c,x,height,scene){rr(c,x,45,12,height-70,2,scene==='foundry'?'#bdc3ae':'#aebfba');for(let y=70;y<height-60;y+=90)line(c,x-15,y,x+27,y+45,'#b2bca8',4);}
function target(c,t,time,won){if(!t)return;
  if(t.type==='cup'){
    c.save();c.translate(t.x,t.y);rr(c,-t.w/2-5,-t.h/2,t.w+10,t.h+7,7,'#477b7240');rr(c,-t.w/2-4,-t.h/2,9,t.h,4,'#5c8f80','#497a6b');rr(c,t.w/2-5,-t.h/2,9,t.h,4,'#5c8f80','#497a6b');rr(c,-t.w/2,t.h/2-5,t.w,10,4,'#528373','#426f63');c.setLineDash([4,5]);line(c,-t.w/2+8,-t.h/2+1,t.w/2-8,-t.h/2+1,'#6b968075',1);c.setLineDash([]);c.fillStyle='#5f8b74';c.font='22px system-ui';c.textAlign='center';c.fillText(won?'✓':'↓',0,9);c.restore();
  }else if(t.type==='ring'){
    c.save();c.translate(t.x,t.y);circle(c,0,0,t.w/2,'#e8d59f24',won?'#739e79':'#c8a55c');c.lineWidth=4;circle(c,0,0,t.w/2-3,null,won?'#739e7980':'#e5c77f88');c.fillStyle=won?'#58836b':'#b79755';c.font='20px system-ui';c.textAlign='center';c.fillText(won?'✓':'↑',0,7);c.restore();
  }else if(t.type==='zone'){
    c.save();c.setLineDash([7,5]);rr(c,t.x-t.w/2,t.y-t.h/2,t.w,t.h,10,won?'#8bb38a35':'#8bb38a16',won?'#5e956d':'#8caa8a');c.setLineDash([]);c.fillStyle='#668b6a';c.font='24px system-ui';c.textAlign='center';c.fillText(won?'✓':'↓',t.x,t.y+8);c.restore();
  }else if(['activate','extinguish','break'].includes(t.type)){
    c.save();c.setLineDash([5,4]);circle(c,t.x,t.y,36,null,won?'#79a17b':'#c2ad78');c.setLineDash([]);circle(c,t.x,t.y-43,12,won?'#dcebd1':'#f3ead3',won?'#79a17b':'#c2ad78');c.fillStyle=won?'#4c835c':'#ad914f';c.font='bold 16px system-ui';c.textAlign='center';c.fillText(won?'✓':'•',t.x,t.y-37);c.restore();
  }
}
export function drawMachine(c,{scene='atelier',pieces=[],links=[],effects=[],target:goal,goalStates=[],time=0,won=false,selected,ghost,guide=[],mode='edit',linkStart,linkVia=[],pointer,trail=[],width=WIDTH,height=HEIGHT}){
  c.clearRect(0,0,width,height);background(c,scene,time,width,height);goalsOf(goal).forEach((g,i)=>target(c,g,time,won||goalStates[i]?.done));
  if(trail.length){c.save();c.lineWidth=2;c.setLineDash([2,6]);for(const pts of trail){if(pts.length<2)continue;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle='#b3955c50';c.stroke();}c.restore();}
  for(const e of pieces.filter(e=>parts[e.type]?.electric)){
    const source=pieces.filter(s=>['switch','solar','generator'].includes(s.type)&&Math.hypot(s.x-e.x,s.y-e.y)<102).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
    if(source){c.beginPath();c.moveTo(source.x+17,source.y+5);c.bezierCurveTo(source.x+25,source.y+25,e.x-20,e.y+25,e.x-17,e.y+5);c.strokeStyle=source.active?'#b89b59':'#8e9f86';c.lineWidth=1.8;c.stroke();circle(c,source.x+17,source.y+5,3,'#657b70');}
  }
  for(const l of links){const a=pieces.find(e=>e.id===l.a),b=pieces.find(e=>e.id===l.b);if(!a||!b)continue;
    const paths=connectionPaths(l,pieces,mode);
    if(mode==='edit'&&l.id===selected){c.save();traceConnection(c,paths);c.lineCap='round';c.strokeStyle='#477f7966';c.lineWidth=13;c.stroke();c.restore();}
    c.save();if(l.type==='belt'){
      for(const {from,to} of paths)line(c,from.x,from.y,to.x,to.y,'#6c8376',2.7);
      if(a.spin||b.spin){const {from,to}=paths[1];c.setLineDash([3,12]);c.lineDashOffset=-(a.phase||0)*8;line(c,from.x,from.y,to.x,to.y,'#e2ce96',1);}
    }else{
      traceConnection(c,paths);c.strokeStyle=l.type==='wire'?'#b97058':'#ae8d55';c.lineWidth=l.type==='wire'?2:2.5;c.stroke();
    }c.restore();
  }
  drawEffects(c,effects,time);
  for(const e of pieces){
    if(e.y>height+80||e.y<-90)continue;
    drawPart(c,e,time,{directionCue:mode==='edit'&&e.id===selected});
    if(e.jammed){circle(c,e.x,e.y-25,8,'#fff1dd','#b8795c');c.fillStyle='#a9654e';c.font='bold 12px system-ui';c.textAlign='center';c.fillText('!',e.x,e.y-21);}
    if(e.type==='lens'&&e.active&&e.focus){c.save();c.beginPath();c.moveTo(e.x,e.y-9);c.lineTo(e.focus.x,e.focus.y);c.lineTo(e.x,e.y+9);c.closePath();c.fillStyle='#e5c66066';c.fill();c.restore();}
    if(mode==='edit'&&e.fixed){circle(c,e.x+dimensions(e).w/2-3,e.y+dimensions(e).h/2+4,2,'#77937b70');}
    if(e.id===selected){const {w,h}=dimensions(e);c.save();c.translate(e.x,e.y);c.rotate((e.angle||0)*Math.PI/180);c.setLineDash([4,3]);rr(c,-w/2-7,-h/2-7,w+14,h+14,6,null,'#477f79');c.restore();}
  }
  for(const g of guide)drawPart(c,g,time,{ghost:true});
  if(ghost){drawPart(c,ghost,time,{ghost:true,directionCue:true});const {w,h}=dimensions(ghost);c.save();c.translate(ghost.x,ghost.y);c.rotate((ghost.angle||0)*Math.PI/180);c.setLineDash([4,4]);rr(c,-w/2-5,-h/2-5,w+10,h+10,5,null,ghost.valid?'#568f7d':'#be7564');c.restore();}
  if(linkStart&&pointer){const nodes=[linkStart,...linkVia.map(id=>pieces.find(p=>p.id===id)).filter(Boolean),pointer];c.setLineDash([5,5]);for(let i=1;i<nodes.length;i++)line(c,nodes[i-1].x,nodes[i-1].y,nodes[i].x,nodes[i].y,'#b28d51',2);c.setLineDash([]);}
}
export function drawIcon(canvas,type){const d=parts[type],c=canvas.getContext('2d');canvas.width=120;canvas.height=76;c.scale(1.35,1.35);
  if(d.link){c.strokeStyle=d.color;c.lineWidth=4;c.lineCap='round';if(type==='belt'){rr(c,13,18,62,17,9,null,d.color);}else{c.beginPath();c.moveTo(12,30);c.bezierCurveTo(28,6,60,52,76,23);c.stroke();}return;}
  const scale=Math.min(1,75/(d.w||60));c.translate(44,28);c.scale(scale,scale);drawPart(c,{type,x:0,y:0,rotation:0,spin:0},0,{icon:true});}

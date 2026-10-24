// Canvas illustrations and character poses drawn specifically for Brain Play.
export const rescuePalettes={
 forest:{sky:['#dcefe6','#f4f3db'],far:'#bdd4c1',hill:'#9ebda7',soil:[111,99,74],rim:[112,158,103],dark:'#294c43',accent:'#eebc62'},
 canyon:{sky:['#f3dac1','#f8edce'],far:'#dbc3a4',hill:'#c7a786',soil:[152,104,75],rim:[197,157,103],dark:'#614e45',accent:'#eab65b'},
 foundry:{sky:['#263d50','#697b83'],far:'#354f60',hill:'#476477',soil:[79,91,99],rim:[169,147,101],dark:'#203b47',accent:'#f4c67b'},
};
const skillPaths={climber:'M9 25V5m14 20V5M9 8h14M9 14h14M9 20h14m-7-19-4 4m4-4 4 4',floater:'M3 15C4-1 28-1 29 15M3 15q4-5 9 0 4-5 8 0 5-5 9 0M16 15v12q-5 4-6-2',blocker:'M6 16H0m32 0h-6M10 12l-4 4 4 4m12-8 4 4-4 4M12 27V14h8v13M16 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8',builder:'M2 27h8v-7h7v-7h7V6h7M3 31h28',basher:'M3 24l19-16M17 4q9 0 12 9M24 7l3-4M2 5v9m5-7v5',miner:'M8 4l15 22M3 13q10-9 21-8M24 17l5 8m-7 1h7',digger:'M16 2v21M9 17l7 7 7-7M7 28h18M9 31h14',bomber:'M22 9l4-5m0-3v6m-3-3h6M16 11a9 9 0 1 0 0 18 9 9 0 0 0 0-18M16 8v3'};
export const rescueSkillIcon=skill=>`<svg viewBox="-2 -2 36 36" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="${skillPaths[skill]}"/></svg>`;
export const rescuePreview=`<svg width="130" height="100" viewBox="0 0 130 100" preserveAspectRatio="xMidYMid meet" class="mini-machine" aria-hidden="true"><path fill="#c6dcca" d="M0 78Q30 44 62 72T130 61v39H0"/><path fill="#728a67" d="M6 82h49v18H6zm86-9h32v27H92"/><path fill="#c39d64" d="m46 79 8-2 0-4 8-2v-4l8-2v-4l8-2v4l-8 2v4l-8 2v4l-8 2v4z"/><g stroke="#355e52" stroke-width="3" stroke-linecap="round"><path d="m30 78 2-7 4 8m-4-7v-9m0 4-5 3m5-3 6 2"/><path d="m73 55 2-7 4 8m-4-7v-9m0 4-5 3m5-3 6 2"/></g><g fill="#e8b65d"><circle cx="32" cy="59" r="5"/><circle cx="75" cy="36" r="5"/></g><path fill="#456e59" d="M107 73V58a9 9 0 0 1 18 0v15z"/><path fill="#f5d99d" d="M111 73V58a5 5 0 0 1 10 0v15z"/></svg>`;
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function stroke(c,points,color,width=1.5){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function creature(c,a,selected,t){
 c.save();c.translate(a.x,a.y);c.scale(a.dir,1);
 const action=a.action,cycle=a.frame%10,leg=Math.sin(a.frame*.65)*2,dead=action==='dead';
 if(action==='exit'){const k=Math.max(.1,1-a.frame/19);c.scale(k,k);c.globalAlpha=k;}
 if(dead){
   c.globalAlpha=Math.max(0,1-a.frame/20);
   if(a.cause==='water'){c.translate(0,a.frame*.45);c.rotate(Math.sin(a.frame)*.2);}else if(a.cause==='splat'){c.scale(1.3,.45);}else {c.rotate(a.frame*.13);c.translate(0,-a.frame*.4);}
 }
 if(selected&&!dead){c.strokeStyle='#ffdb7b';c.lineWidth=1.4;c.beginPath();c.ellipse(0,-8,8,12,0,0,Math.PI*2);c.stroke();}
 ellipse(c,0,1,5,1.4,'#163b3528');
 const climbing=action==='climb',working=['build','bash','mine','dig'].includes(action),crouch=working&&cycle>=3&&cycle<=6?2:0;
 const jacket=a.id%3===0?'#d97f62':a.id%3===1?'#347f72':'#547b98';
 c.translate(0,crouch);
 if(climbing){stroke(c,[[-2,-6],[-5+leg,-3],[-3,0]],'#384b4c',2.2);stroke(c,[[1,-6],[4-leg,-3],[3,0]],'#384b4c',2.2);}
 else if(['fall','float'].includes(action)){stroke(c,[[-1,-5],[-4,-1],[-5,0]],'#384b4c',2.2);stroke(c,[[1,-5],[4,-2],[6,-1]],'#384b4c',2.2);}
 else {stroke(c,[[-1,-5],[-2+leg*.7,0],[-4+leg*.7,0]],'#384b4c',2.2);stroke(c,[[1,-5],[2-leg*.7,0],[4-leg*.7,0]],'#384b4c',2.2);}
 c.fillStyle=jacket;c.beginPath();c.roundRect(-3.5,-11,7,7,1.5);c.fill();
 c.fillStyle='#f3d3a4';c.fillRect(-2.6,-15,6,5);c.fillRect(3,-13,1.8,1.6);
 c.fillStyle='#344442';c.fillRect(1,-13.5,1,1);
 c.fillStyle='#edbe62';c.beginPath();c.ellipse(0,-15.5,4.4,2.7,0,Math.PI,Math.PI*2);c.fill();c.fillRect(-4.7,-15.7,10,1.3);
 c.fillStyle='#f0d08b';c.fillRect(-1.3,-18,2.6,1.5);
 c.fillStyle='#e9866c';c.fillRect(-3.5,-10.3,6.8,1.5);c.fillRect(-5,-10.3,2.8,3);
 const hand='#e7be8d';
 if(action==='block'){stroke(c,[[-3,-9],[-7,-10],[-8,-8]],hand,2);stroke(c,[[3,-9],[7,-10],[8,-8]],hand,2);}
 else if(action==='float'){
   stroke(c,[[-3,-9],[-6,-20]],hand,1);stroke(c,[[3,-9],[6,-20]],hand,1);
   c.strokeStyle='#456a71';c.lineWidth=.7;c.beginPath();c.moveTo(-12,-24);c.lineTo(-6,-9);c.moveTo(12,-24);c.lineTo(6,-9);c.stroke();
   c.fillStyle='#63acb6';c.beginPath();c.arc(0,-23,12,Math.PI,Math.PI*2);c.lineTo(12,-23);c.quadraticCurveTo(6,-27,0,-23);c.quadraticCurveTo(-6,-27,-12,-23);c.fill();
   c.strokeStyle='#d8f3e1';c.lineWidth=.8;c.beginPath();c.moveTo(0,-35);c.quadraticCurveTo(-5,-30,-4,-24);c.moveTo(0,-35);c.quadraticCurveTo(5,-30,4,-24);c.stroke();
 }else if(action==='climb'){stroke(c,[[-3,-9],[4,-12+leg]],hand,1.8);stroke(c,[[2,-10],[5,-16-leg]],hand,1.8);}
 else if(action==='build'){
   stroke(c,[[2,-9],[6,-8+(cycle>4?4:0)]],hand,1.8);c.fillStyle='#dcac62';c.fillRect(5,-9+(cycle>4?4:0),5,2);
 }else if(['bash','mine','dig'].includes(action)){
   const angle=(action==='dig'?1.2:action==='mine'?.65:0)+Math.sin(cycle/10*Math.PI*2)*.75;
   c.save();c.translate(3,-8);c.rotate(angle);stroke(c,[[0,0],[9,0]],'#ba8c57',1.8);stroke(c,[[7,-3],[10,-2],[11,2]],'#cfdbd6',1.6);c.restore();stroke(c,[[2,-9],[6,-8]],hand,2);
 }else if(action==='shrug'){stroke(c,[[-3,-9],[-6,-13]],hand,1.8);stroke(c,[[3,-9],[6,-13]],hand,1.8);}
 else{stroke(c,[[-2,-10],[-4+leg,-7]],hand,1.7);stroke(c,[[2,-10],[4-leg,-7]],hand,1.7);}
 c.restore();
 if(a.bomb>=0&&!dead){c.save();ellipse(c,a.x,a.y-30,6,6,'#c85e52');c.fillStyle='#fff9e4';c.font='bold 8px system-ui';c.textAlign='center';c.fillText(String(Math.max(1,Math.ceil(a.bomb/30))),a.x,a.y-27);c.restore();}
 else if(action==='build'&&a.bricks<=3){c.save();ellipse(c,a.x,a.y-28,5,5,'#e2b96b');c.fillStyle='#4b5141';c.font='bold 7px system-ui';c.textAlign='center';c.fillText(String(a.bricks),a.x,a.y-25.5);c.restore();}
}
export function createRescuePainter(canvas,minimap){
 const c=canvas.getContext('2d'),mini=minimap.getContext('2d'),surface=document.createElement('canvas'),tc=surface.getContext('2d');let revision=-1,theme='';
 function terrain(s,l){
   if(revision===s.terrainRevision&&theme===l.theme)return;revision=s.terrainRevision;theme=l.theme;surface.width=s.width;surface.height=s.height;
   const image=tc.createImageData(s.width,s.height),p=rescuePalettes[l.theme];
   for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
     const n=y*s.width+x,v=s.terrain[n];if(!v)continue;const top=y===0||!s.terrain[n-s.width],noise=((x*17+y*43+(x*y)%31)%13)-6;
     let color=top?p.rim:p.soil;
     if(v===2)color=(x%24<2||y%18<2)?[86,112,118]:[134,156,156];
     if(v===3||v===4)color=[139,133,100];
     const at=n*4;image.data[at]=color[0]+noise;image.data[at+1]=color[1]+noise;image.data[at+2]=color[2]+noise;image.data[at+3]=255;
     if((v===3||v===4)&&y%14>=5&&y%14<=9&&((x%14>=5&&x%14<=8)||(v===4?x%14-8:8-x%14)===Math.abs(y%14-7))){image.data[at]=236;image.data[at+1]=211;image.data[at+2]=144;}
   }tc.putImageData(image,0,0);
 }
 function paint(s,l,{camera=0,viewWidth=l.width,selected=0,motion=true}={}){
   terrain(s,l);const p=rescuePalettes[l.theme],scale=canvas.width/viewWidth,clock=motion?s.tick:0;
   c.setTransform(scale,0,0,scale,0,0);c.clearRect(0,0,viewWidth,l.height);
   const g=c.createLinearGradient(0,0,0,l.height);g.addColorStop(0,p.sky[0]);g.addColorStop(1,p.sky[1]);c.fillStyle=g;c.fillRect(0,0,viewWidth,l.height);
   ellipse(c,viewWidth*.77-camera*.035,36,20,20,l.theme==='foundry'?'#f1dcac':'#fff5d0');
   for(let k=0;k<7;k++){
     const x=k*115-camera*.16;c.fillStyle=p.far;c.beginPath();c.moveTo(x-65,224);c.lineTo(x+16,62+(k%3)*17);c.lineTo(x+100,224);c.fill();
     if(l.theme==='foundry'){c.fillStyle=p.hill;c.fillRect(x+4,93,30,131);c.fillRect(x+34,133,24,91);for(let j=0;j<5;j++)for(let n=0;n<2;n++){c.fillStyle=(j+n+k)%3?'#d3bc7b80':'#6f8e90';c.fillRect(x+9+n*12,106+j*18,4,6);}}
     else if(l.theme==='forest'){c.fillStyle=p.hill;c.fillRect(x+57,108,3,90);for(let j=0;j<3;j++){c.beginPath();c.moveTo(x+58,76+j*20);c.lineTo(x+32+j*4,130+j*15);c.lineTo(x+84-j*4,130+j*15);c.fill();}}
   }
   c.save();c.translate(-camera,0);c.imageSmoothingEnabled=false;c.drawImage(surface,0,0);
   for(let i=0;i<l.hazards.length;i++){
     const h=l.hazards[i];
     if(h.type==='water'){
       const water=c.createLinearGradient(0,h.y,0,224);water.addColorStop(0,'#65b3b8');water.addColorStop(1,'#3e8294');c.fillStyle=water;c.fillRect(h.x,h.y,h.w,h.h);
       for(let x=h.x;x<h.x+h.w;x+=9)stroke(c,[[x,h.y+Math.sin((clock+x)*.14)*1.4],[x+5,h.y+Math.sin((clock+x+5)*.14)*1.4]],'#c3efdf',.9);
     }else if(h.type==='fire'){
       c.fillStyle='#8d5948';c.fillRect(h.x-2,h.y+h.h-3,h.w+4,4);
       for(let x=h.x+2;x<h.x+h.w;x+=5){const f=Math.sin(clock*.35+x)*2;c.fillStyle='#e77e45';c.beginPath();c.moveTo(x-3,h.y+h.h);c.quadraticCurveTo(x-5,h.y+5,x+f,h.y);c.quadraticCurveTo(x+5,h.y+6,x+3,h.y+h.h);c.fill();c.fillStyle='#f6d57a';c.fillRect(x-1,h.y+6,2,5);}
     }else{
       c.fillStyle='#51676b';c.fillRect(h.x-2,h.y+h.h-3,h.w+4,4);const active=s.hazards[i]>22,angle=active?0:1;
       stroke(c,[[h.x,h.y+10],[h.x+3,h.y+3*angle],[h.x+7,h.y+8],[h.x+11,h.y+3*angle],[h.x+14,h.y+10]],'#bcc9c3',2);if(s.hazards[i])ellipse(c,h.x+7,h.y+8,4,2,'#f3bd69');
     }
   }
   const e=l.entry,open=Math.min(1,s.tick/22);c.fillStyle=p.dark;c.fillRect(e.x-13,e.y-13,26,14);c.fillStyle='#d6b381';c.fillRect(e.x-15,e.y-15,30,4);c.fillRect(e.x-12,e.y-11,24*(1-open),10);ellipse(c,e.x,e.y-10,2,2,'#f2ce7c');
   const x=l.exit.x,y=l.exit.y;
   c.fillStyle=p.dark;c.beginPath();c.roundRect(x-13,y-29,26,30,[12,12,0,0]);c.fill();c.fillStyle='#d9b66c';c.beginPath();c.roundRect(x-9,y-25,18,26,[8,8,0,0]);c.fill();c.fillStyle='#fff0b4';c.beginPath();c.roundRect(x-6,y-22,12,23,[5,5,0,0]);c.fill();stroke(c,[[x-3,y-15],[x+3,y-15],[x,y-18],[x+3,y-15],[x,y-12]],'#926d43',1);
   for(const a of s.agents)if(a.x>camera-20&&a.x<camera+viewWidth+20)creature(c,a,a.id===selected,clock);
   for(const e of s.effects){const k=e.age/24;if(e.type==='blast'){ellipse(c,e.x,e.y-9,4+20*k,4+20*k,`rgba(245,184,85,${1-k})`);}else if(e.type==='assign'||e.type==='saved'){c.strokeStyle=`rgba(253,220,124,${1-k})`;c.lineWidth=1;c.beginPath();c.arc(e.x,e.y-6,4+k*11,0,Math.PI*2);c.stroke();}else if(motion){for(let i=0;i<4;i++)ellipse(c,e.x+(i-1.5)*k*9,e.y-k*7+(k*k*17),1,1,e.type==='steel'?'#f9e1a7':'#d3b98c');}}
   c.restore();
   mini.setTransform(minimap.width/s.width,0,0,minimap.height/s.height,0,0);mini.fillStyle=p.far;mini.fillRect(0,0,s.width,s.height);mini.drawImage(surface,0,0);
   mini.fillStyle='#f5f3dc';mini.fillRect(l.exit.x-4,l.exit.y-24,8,24);mini.fillStyle='#f0d08d';for(const a of s.agents)mini.fillRect(a.x-2,a.y-7,4,7);
   mini.strokeStyle=p.dark;mini.lineWidth=s.width/minimap.width*1.8;mini.strokeRect(camera+1,1,Math.min(viewWidth,s.width)-2,s.height-2);
 }
 return {paint,invalidate(){revision=-1;}};
}

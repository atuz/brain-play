import test from 'node:test';
import assert from 'node:assert/strict';
import {tumblerRestTransform,tumblerRollTransform} from './domino-contact-motion.js';
import {restingDominoes,dominoDimensions as size} from './domino-resting.js';
import {createChain} from './domino-engine.js';
import {dominoTiming} from './domino-timing.js';
import {dominoContactPhase} from './domino-contact-motion.js';

const matrix=text=>text.slice(7,-1).split(',').map(Number);
const point=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} differs from ${b}`);

test('Rolling past the starting cell follows the same geometry in either initial direction',()=>{
  for(const dir of [-1,1])for(let i=1;i<=120;i++){
    const phase=i/20;
    assert.equal(tumblerRollTransform({phase:-phase,dir}),tumblerRollTransform({phase,dir:-dir}));
  }
});

for(const dir of [-1,1])for(const type of ['normal','trigger'])test(`A rebound meets the final ${type} at contact, not horizontal, dir=${dir}`,()=>{
  const level={width:14,height:8,rules:'dos',platforms:[[5,0,13]],ladders:[]};
  const chain=createChain(level,[{id:'r',type:'tumbler',x:6,y:5},
    {id:'stop',type:'stopper',x:6-2*dir,y:5},{id:'next',type,x:6+dir,y:5}],{},dominoTiming);
  chain.activateStone('r',-dir);
  while(!chain.done()&&chain.stones.find(p=>p.id==='r').state!=='flat')chain.step();
  const r=chain.stones.find(p=>p.id==='r'),next=chain.stones.find(p=>p.id==='next');
  assert.equal(r.state,'flat');assert.equal(next.state,'falling');
  near(r.rollPhase,-dominoContactPhase);
  assert.ok(Math.abs(r.rollPhase*90)<45,'stop the rolling swing on first touch');
});

for(const baseDir of [-1,1])for(const dir of [-1,1])for(const turns of [-2,-1,0,1,2]){
  test(`Stopped tumbler seats on the ordinary pivot: base=${baseDir}, final=${dir}, turns=${turns}`,()=>{
    const phase=(turns*2+dir)/baseDir,cellOffset=turns;
    const a={id:'roll',type:'tumbler',x:6,y:5,state:'flat',dir};
    const b={id:'normal',type:'normal',x:6+dir,y:5,state:'flat',dir};
    const poses=restingDominoes([a,b]),pose=poses.get('roll').body;
    assert.equal(pose.supportedBy,'normal');
    const m=matrix(tumblerRestTransform({phase,baseDir,dir,cellOffset,angle:pose.angle,lift:pose.lift}));
    const contactPhase=(turns*2+dir*dominoContactPhase)/baseDir;
    const contactMatrix=matrix(tumblerRestTransform({phase:contactPhase,baseDir,dir,cellOffset,angle:pose.angle,lift:pose.lift}));
    m.forEach((value,i)=>near(value,contactMatrix[i]));
    const ox=dir>0?size.width:0,theta=dir*pose.angle*Math.PI/180;
    const inverted=Math.abs(turns%2)===1;
    for(const [x,y] of [[0,0],[size.width,0],[0,size.length],[size.width,size.length]]){
      const px=inverted?size.width-x:x,py=inverted?size.length-y:y;
      const actual=point(m,x,y);
      near(actual[0],cellOffset*40+ox+Math.cos(theta)*(px-ox)-Math.sin(theta)*(py-40));
      near(actual[1],40-pose.lift+Math.sin(theta)*(px-ox)+Math.cos(theta)*(py-40));
    }
  });
}

test('The reproduced rightward return removes the one-width gap at the old rolling anchor',()=>{
  const pieces=[{id:'roll',type:'tumbler',x:6,y:9,state:'flat',dir:1},
    {id:'ordinary',type:'normal',x:7,y:9,state:'flat',dir:1},
    {id:'delay',type:'delay',x:8,y:9,state:'flat',dir:1}];
  const poses=restingDominoes(pieces),pose=poses.get('roll').body,target=poses.get('ordinary').body;
  const m=matrix(tumblerRestTransform({phase:-1,baseDir:-1,dir:1,cellOffset:0,angle:pose.angle,lift:pose.lift}));
  const tip=point(m,size.width,0),beta=target.angle*Math.PI/180;
  const dx=tip[0]-(40+size.width),dy=tip[1]-(40-target.lift);
  near(dx*Math.cos(beta)+dy*Math.sin(beta),-size.width);
  assert.ok(pose.angle<90,'the stopped rolling tile must lean on its neighbour');
});

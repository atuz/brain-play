import test from 'node:test';
import assert from 'node:assert/strict';
import {tumblerDropMotion} from './domino-tumbler-motion.js';

for(const dir of [-1,1])for(const degrees of [89.8,270,450,810])test(`Tumbler airborne turn keeps direction ${dir} at ${degrees} degrees`,()=>{
  const angle=dir*degrees,w=12.8,h=40;
  const c=Math.cos(angle*Math.PI/180),s=Math.sin(angle*Math.PI/180);
  const matrix=[c,s,-s,c,36,-17];
  const motion=tumblerDropMotion({matrix,angle,dir,width:w,height:h,dx:-80,dy:0});
  assert.ok((motion.end-angle)*dir>=0);
  assert.ok((motion.end-angle)*dir<=180,'no extra full turn or reverse swing');
  const values=motion.from.match(/translate\(([-\d.]+)px,([-\d.]+)px\) rotate\(([-\d.]+)deg\)/).slice(1).map(Number);
  for(const [x,y] of [[0,0],[w,0],[w,h],[0,h]]){
    assert.ok(Math.abs((c*x-s*y+values[0])-(matrix[0]*x+matrix[2]*y+matrix[4]-80))<1e-8);
    assert.ok(Math.abs((s*x+c*y+values[1])-(matrix[1]*x+matrix[3]*y+matrix[5]))<1e-8);
  }
  assert.equal(motion.inverted,Math.abs(Math.round(motion.end/180)%2)===1);
});

test('Left-going 270-degree roll continues to 360, rather than spinning back 270 degrees',()=>{
  const motion=tumblerDropMotion({matrix:[0,1,-1,0,-40,12.8],angle:-270,dir:-1,width:12.8,height:40});
  assert.equal(motion.end,-360);
  assert.equal(motion.inverted,false,'a complete turn preserves the artwork at landing');
});

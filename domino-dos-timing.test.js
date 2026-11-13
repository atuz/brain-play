import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from './domino-engine.js';
import {dosFrameTiming as T} from './domino-timing.js';

const ms=f=>f.time*T.beat;
const first=(sim,id,state)=>sim.trace.find(f=>f.pieces.find(p=>p.id===id).state===state);

test('DOS timing: tumbler first cell is 7 frames and later cells 13 frames',()=>{
  const level={width:20,height:8,rules:'dos',platforms:[[5,0,19]],ladders:[]};
  const sim=simulate(level,[{id:'r',type:'tumbler',x:5,y:5}],'r',1,{},T);
  const cells=[];
  for(const f of sim.trace){const p=f.pieces[0];if(p.state==='rolling'&&!cells.some(c=>c.x===p.x))cells.push({x:p.x,t:ms(f)});}
  assert.ok(Math.abs(cells[1].t-T.rollFirst)<1e-6,'first cell');
  assert.ok(Math.abs(cells[2].t-(T.rollFirst+T.roll))<1e-6,'second cell');
  assert.ok(Math.abs(cells[3].t-(T.rollFirst+2*T.roll))<1e-6,'third cell');
});

test('DOS timing: exploder opens its hole after six frames',()=>{
  const level={width:11,height:10,rules:'dos',platforms:[[5,0,10]],ladders:[]};
  const sim=simulate(level,[{id:'a',type:'normal',x:4,y:5},{id:'x',type:'exploder',x:5,y:5}],'a',1,{},T);
  const blast=sim.trace.find(f=>f.effects.some(e=>e.kind==='explode'));
  assert.ok(Math.abs(ms(blast)-(T.contact+T.exploder))<1e-6);
});

test('DOS timing: a drop takes 3n-1 frames for n level rows',()=>{
  for(const [rows,family] of [[1,2],[2,5],[3,8]]){
    const level={width:9,height:14,rules:'dos',platforms:[[5,4,4],[5+rows,0,8]],ladders:[]};
    const sim=simulate(level,[{id:'a',type:'normal',x:4,y:5}],'a',1,{},T);
    const land=sim.trace.find(f=>f.pieces[0].state==='landing'&&f.pieces[0].y===5+rows);
    const drop=sim.trace.find(f=>f.pieces[0].state==='dropping');
    assert.ok(Math.abs(ms(land)-ms(drop)-family*T.frame)<1e-6,`${rows} rows`);
  }
});

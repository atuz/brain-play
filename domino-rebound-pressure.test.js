import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,createChain} from './domino-engine.js';
import {dominoTiming} from './domino-timing.js';

for(const dir of [-1,1])for(const obstacle of ['stopper','delay']){
  const level={width:12,height:8,rules:'dos',platforms:[[5,0,11]],ladders:[]};
  const pieces=[{id:'upstream',type:'normal',x:5-dir,y:5},
    {id:'source',type:'normal',x:5,y:5},{id:'obstacle',type:obstacle,x:5+dir,y:5}];
  test(`A pressed ordinary tile cannot rebound from ${obstacle}, direction ${dir}`,()=>{
    const sim=simulate(level,pieces,'upstream',dir,{},dominoTiming);
    assert.ok(sim.trace.some(f=>f.pieces.find(p=>p.id==='upstream').state==='flat'));
    assert.ok(sim.trace.every(f=>!['returning','reversing'].includes(f.pieces.find(p=>p.id==='source').state)));
    assert.ok(sim.trace.every(f=>!f.effects.some(e=>e.kind==='rebound'&&e.sourceId==='source')));
    const source=sim.pieces.find(p=>p.id==='source');
    assert.equal(source.state,'flat');assert.equal(source.dir,dir);
  });
  test(`An upright tile behind does not press the independent source at ${obstacle}, direction ${dir}`,()=>{
    const sim=simulate(level,pieces,'source',dir,{},dominoTiming);
    assert.ok(sim.trace.some(f=>f.pieces.find(p=>p.id==='source').state==='returning'));
  });
  test(`Removing the upstream load restores rebound at ${obstacle}, direction ${dir}`,()=>{
    const chain=createChain(level,pieces,{},dominoTiming);
    chain.activateStone('upstream',dir);chain.step();
    assert.equal(chain.stones.find(p=>p.id==='upstream').state,'flat');
    chain.removeStone('upstream');
    while(!chain.done())chain.step();
    assert.ok(chain.trace.some(f=>f.pieces.find(p=>p.id==='source').state==='returning'));
  });
}

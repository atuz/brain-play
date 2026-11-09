import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from './domino-engine.js';
import {dominoTiming} from './domino-timing.js';
import {renderAscender} from './domino-ascender-view.js';

for(const dir of [-1,1])for(const rebound of [false,true])for(const targetY of [3,4]){
  test(`Ascender rests before the final trigger: dir=${dir}, rebound=${rebound}, row=${targetY}`,()=>{
    const level={width:12,height:9,rules:'dos',platforms:[[2,0,11],[targetY,0,11],[6,0,11]],ladders:[]};
    // The target's platform is adjacent, leaving the ascender column open.
    level.platforms[1]=[targetY,dir>0?6:0,dir>0?11:4];
    const pieces=[{id:'a',type:'ascender',x:5,y:6},{id:'gate',type:'trigger',x:5+dir,y:targetY}];
    if(rebound)pieces.push({id:'stop',type:'stopper',x:5-dir,y:3});
    const sim=simulate(level,pieces,'a',rebound?-dir:dir,{},dominoTiming);
    const ascender=sim.pieces.find(p=>p.id==='a'),gate=sim.pieces.find(p=>p.id==='gate');
    assert.equal(sim.won,true);
    assert.ok(ascender.finish<gate.finish,`${ascender.finish} must precede ${gate.finish}`);
    const contact=sim.trace.find(f=>f.pieces.find(p=>p.id==='gate').state==='falling');
    const partial=sim.trace.find(f=>{const p=f.pieces.find(p=>p.id==='gate');return p.state==='flat'&&p.finish===null;});
    assert.ok(contact&&partial,'contact and finishing the final swing are distinct');
    assert.ok(Math.abs((gate.finish-partial.time)*200-140)<1e-6);
    assert.ok(contact.time<ascender.finish);
  });
}

test('The rising pose already includes platform thickness before the top-pivot swing',()=>{
  const properties=new Map(),classes=new Set(),label={};
  const node={dataset:{stage:'ascending'},style:{setProperty:(k,v)=>properties.set(k,v)},
    classList:{toggle:(k,on)=>on?classes.add(k):classes.delete(k)},querySelector:()=>label};
  const options={level:{width:12,platforms:[[2,0,11,3]]}};
  renderAscender(node,{type:'ascender',x:5,y:3,state:'ascending',dir:1},options);
  assert.ok(classes.has('da-contact-rise'));
  assert.ok(!classes.has('da-mounted'),'rising body has not started its swing');
  assert.equal(properties.get('--da-ceiling-shift'),'15px');
  renderAscender(node,{type:'ascender',x:5,y:3,state:'ceiling',dir:1},options);
  assert.ok(classes.has('da-mounted'));
  assert.ok(!classes.has('da-contact-rise'));
  assert.equal(properties.get('--da-ceiling-shift'),'15px','no new vertical shift on rotation');
});

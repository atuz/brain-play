import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from './domino-levels.js';
import {at,clone,edit,initialPosition,pathTo,simulate,validPosition} from './domino-engine.js';
import {restore} from './domino.js';
import {dominoEnglish} from './domino-i18n.js';
import {translate} from './i18n.js';
import {games} from './catalog.js';
import {nextGuide,failureSummary,referenceLayout} from './domino-guide.js';

function walk(level,position,target) {
  const path=pathTo(level,position.player,target);
  assert.ok(path,`Level ${level.id}: route to ${JSON.stringify(target)}`);
  for(const to of path) {position=edit(level,position,{type:'walk',to});assert.ok(position);}
  return position;
}
for(const level of levels) test(`Domino ${level.id}: original recorded plan is playable, wins and reaches the exit`,()=>{
  let position=initialPosition(level);
  assert.ok(validPosition(level,position));
  for(const transfer of level.plan) {
    position=walk(level,position,transfer.from);
    position=edit(level,position,{type:'take'});assert.ok(position);
    position=walk(level,position,transfer.to);
    position=edit(level,position,{type:'place'});assert.ok(position);
    assert.ok(validPosition(level,position));
  }
  position=walk(level,position,level.push);
  const starter=position.pieces.find(p=>at(p,position.player));
  const result=simulate(level,position.pieces,starter.id,level.push.dir);
  assert.equal(result.won,true,`Level ${level.id}: ${result.reason}`);
  assert.ok(result.trace.length>1);
  assert.ok(pathTo(level,position.player,level.exit,result.bridges),'Door must be reachable after the chain');
  // The outcome must not depend on DOM/render order, nor mutate the edit state.
  assert.equal(simulate(level,[...position.pieces].reverse(),starter.id,level.push.dir).won,true);
  assert.equal(position.pieces.some(p=>p.state),false);
});
test('Only the opening tutorial is already arranged; later levels need edits',()=>{
  for(const level of levels.slice(1)) {
    const starter=level.pieces.find(p=>at(p,level.push));
    if(starter) assert.equal(simulate(level,level.pieces,starter.id,level.push.dir).won,false,`Level ${level.id}`);
  }
});
test('Advanced chapters grow in area, relay depth and recorded rearrangements, with a real timing constraint',()=>{
  for(let chapter=1;chapter<=4;chapter++){
    const group=levels.filter(level=>level.chapter===chapter);
    assert.equal(group.length,6);
    for(const level of group){
      assert.equal(level.width,9+chapter*4);assert.equal(level.height,level.width);
      assert.ok(level.plan.length>=chapter*3+1);
      const arranged=referenceLayout(level),starter=arranged.find(p=>at(p,level.push));
      assert.ok(arranged.filter(p=>p.type==='splitter').length>=chapter+1);
      assert.ok(arranged.some(p=>p.type==='bridge'));
      const withoutDelays=arranged.map(p=>p.type==='delay'?{...p,type:'normal'}:p);
      const timingFailure=simulate(level,withoutDelays,starter.id,level.push.dir);
      assert.ok(['early','tie'].includes(timingFailure.reason),`Level ${level.id} should need a delayed trigger branch`);
      assert.ok(timingFailure.pieces.every(p=>['flat','vanished'].includes(p.state)));
    }
  }
});
test('Trigger cannot be carried, illegal placement cannot overlap or block a door',()=>{
  const level=levels[1];let position=initialPosition(level);
  position.player=clone(level.pieces.find(p=>p.type==='trigger'));
  assert.equal(edit(level,position,{type:'take'}),null);
  position.player={x:7,y:5};position=edit(level,position,{type:'take'});
  position.player={x:1,y:5};assert.equal(edit(level,position,{type:'place'}),null);
  position.player=clone(level.exit);assert.equal(edit(level,position,{type:'place'}),null);
  assert.equal(edit(level,position,{type:'take'}),null);
});
test('Delay changes which branch finishes last; simultaneous trigger is too early',()=>{
  const level={width:9,height:7,platforms:[[1,0,2],[5,0,8]],ladders:[],exit:{x:8,y:5}};
  const pieces=[{id:'a',type:'normal',x:2,y:1},{id:'s',type:'splitter',x:3,y:5},{id:'l',type:'normal',x:2,y:5},{id:'t',type:'trigger',x:4,y:5}];
  const simultaneous=simulate(level,pieces,'a',1);
  assert.equal(simultaneous.reason,'tie');
  assert.equal(simulate(level,pieces.slice().reverse(),'a',1).reason,'tie');
  pieces[3].type='delay';pieces.push({id:'door',type:'trigger',x:5,y:5});
  assert.equal(simulate(level,pieces,'a',1).won,true);
});
test('Splitter needs a falling domino; landing on an ordinary domino crashes',()=>{
  const level=levels[6];const splitter=level.pieces.find(p=>p.type==='splitter');
  assert.equal(simulate(level,level.pieces,splitter.id,1).valid,false);
  const wrong=clone(level.pieces);wrong.find(p=>p.type==='normal'&&p.y===5).x=3;
  assert.equal(simulate(level,wrong,'p0',1).reason,'crash');
});
test('Bridges create a route across an actual platform gap in either direction',()=>{
  const level=levels[5];
  assert.equal(pathTo({...level,ladders:[]},{x:2,y:5},{x:4,y:5}),null);
  assert.ok(pathTo({...level,ladders:[]},{x:2,y:5},{x:4,y:5},[{x:3,y:5}]));
  for(const dir of [-1,1]) {
    const pieces=[{id:'b',type:'bridge',x:dir===1?2:4,y:5},{id:'t',type:'trigger',x:dir===1?4:2,y:5}];
    const result=simulate(level,pieces,'b',dir);
    assert.equal(result.won,true);assert.deepEqual(result.bridges,[{x:3,y:5,dir}]);
  }
});
test('Saved positions reject missing/duplicate pieces, moved triggers and invalid player cells',()=>{
  const level=levels[0],position=initialPosition(level);
  const missing=clone(position);missing.pieces.pop();assert.equal(validPosition(level,missing),false);
  const duplicate=clone(position);duplicate.pieces[0]=duplicate.pieces[1];assert.equal(validPosition(level,duplicate),false);
  const moved=clone(position);moved.pieces.find(p=>p.type==='trigger').x=6;assert.equal(validPosition(level,moved),false);
  const outside=clone(position);outside.player.y=0;assert.equal(validPosition(level,outside),false);
  assert.equal(validPosition(level,{...position,player:{x:1.5,y:5}}),false);
  assert.equal(validPosition(level,{...position,pieces:null}),false);
});
test('Carry, undo and completed-chain sessions restore, including walking on a new bridge',()=>{
  const level=levels[5];let position=initialPosition(level);
  position=walk(level,position,{x:7,y:5});position=edit(level,position,{type:'take'});
  let saved={version:1,level:5,position,history:[],phase:'arrange',attempt:null,walker:null,postHistory:[]};
  assert.deepEqual(restore(saved),saved);
  position=walk(level,position,{x:2,y:5});position=edit(level,position,{type:'place'});position=walk(level,position,{x:1,y:5});
  saved={...saved,position,attempt:{id:'p0',dir:1},phase:'exit',walker:{x:3,y:5}};
  assert.deepEqual(restore(saved),saved);
  saved.phase='won';assert.equal(restore(saved).phase,'arrange','Walking through the door is required');
  saved.walker=clone(level.exit);assert.deepEqual(restore(saved),saved);
  saved.attempt.dir=0;assert.equal(restore(saved).attempt,null);
});
test('Every domino rule, level, hint and control has complete English and Traditional text',()=>{
  for(const text of [...Object.keys(dominoEnglish),...levels.flatMap(level=>[level.name,level.hint]),...games.find(g=>g.id==='domino').rules.map(r=>r.text)]) {
    assert.doesNotMatch(translate(text,'en'),/[\u3400-\u9fff]/,text);
    assert.ok(translate(text,'zh-TW').length);
  }
  assert.equal(translate('蚂蚁多米诺','zh-TW'),'螞蟻多米諾');
});

function followGuide(level,start){
  let position=clone(start);
  for(let i=0;i<Math.max(600,level.width*level.height*4);i++){
    const step=nextGuide(level,position);assert.notEqual(step.kind,'unavailable',`Level ${level.id} needs a guide`);
    if(step.kind==='push'){
      const piece=position.pieces.find(p=>at(p,position.player));
      const result=simulate(level,position.pieces,piece.id,step.dir);
      assert.equal(result.won,true,`Guided level ${level.id}: ${result.reason}`);
      assert.ok(pathTo(level,position.player,level.exit,result.bridges));return position;
    }
    const action=step.kind.startsWith('walk')?{type:'walk',to:pathTo(level,position.player,step.kind==='walk-take'||step.kind==='walk-buffer'?step.source:step.target)?.[0]}
      :{type:step.kind==='place'?'place':'take'};
    assert.ok(action.type!=='walk'||action.to,'The guide must give a reachable next step');
    position=edit(level,position,action);assert.ok(position,`Guided action must be legal: ${JSON.stringify(step)}`);
  }
  assert.fail(`Guide did not finish level ${level.id}`);
}
test('Screenshot regression: moved upper domino makes the trigger simultaneous; guidance repairs the current layout',()=>{
  const level=levels[6];let position=initialPosition(level);
  for(const transfer of [{from:{x:7,y:5},to:{x:3,y:5}},{from:{x:1,y:1},to:{x:1,y:5}}]){
    position=walk(level,position,transfer.from);position=edit(level,position,{type:'take'});
    position=walk(level,position,transfer.to);position=edit(level,position,{type:'place'});
  }
  position=walk(level,position,{x:2,y:1});
  const result=simulate(level,position.pieces,'p1',1);
  assert.equal(result.won,false);assert.equal(result.reason,'tie');
  assert.deepEqual([...result.problemIds].sort(),['p0','p4']);
  assert.ok(result.pieces.every(p=>['flat','vanished'].includes(p.state)),'Every visible domino has fallen, so a generic retry message is insufficient');
  assert.equal(failureSummary(result),'开门牌必须最后一个倒');
  const repaired=followGuide(level,position);
  assert.ok(repaired.pieces.some(p=>p.type==='normal'&&p.x===1&&p.y===1));
});
test('Guidance solves every original puzzle and legal scrambled layouts, including carried pieces and swaps',()=>{
  let seed=91823;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(const level of levels){
    followGuide(level,initialPosition(level));
    for(let run=0;run<8;run++){
      let position=initialPosition(level);
      for(let turn=0;turn<80;turn++){
        const options=[...['take','place'].map(type=>edit(level,position,{type})),
          ...[{x:position.player.x-1,y:position.player.y},{x:position.player.x+1,y:position.player.y},{x:position.player.x,y:position.player.y-1},{x:position.player.x,y:position.player.y+1}].map(to=>edit(level,position,{type:'walk',to}))].filter(Boolean);
        position=options[Math.floor(random()*options.length)]||position;
      }
      followGuide(level,position);
    }
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {atomLevels} from './atom-levels.js';
import {atomModel,atomSolved,atomSlide,atomDestination,createAtomState,validAtomState,atomCopy,atomGuideFits} from './atom-engine.js';
import {restoreAtom,pageInfo} from './atom.js';
for(const level of atomLevels)test(`atom ${level.id}: fixed original puzzle has a legal winning route`,()=>{
  let state=createAtomState(level);assert.equal(atomSolved(level,state.atoms),false);
  for(const move of level.solution){const result=atomSlide(level,state,move.id,move.direction);assert.equal(result.changed,true);state=result.state;assert.equal(validAtomState(state,level),true);}
  assert.equal(state.phase,'won');assert.equal(state.moves,level.solution.length);
});
function room(goal,atoms=goal){return {id:'room',w:7,h:7,tiles:Array.from({length:49},(_,i)=>i<7||i>=42||i%7===0||i%7===6?'wall':'ground'),goal,atoms:atomCopy(atoms)};}
test('bond direction and multiplicity matter; a translated target fits, its mirror does not',()=>{
  const goal=atomModel([['H',0,0],['O',1,0],['H',2,0]],[[0,1],[1,2]]),level=room(goal);
  const translated=goal.map(a=>({...a,x:a.x+2,y:3}));assert.equal(atomSolved(level,translated),true);
  const swapped=atomCopy(translated);[swapped[0].x,swapped[2].x]=[swapped[2].x,swapped[0].x];assert.equal(atomSolved(level,swapped),false);
  const changed=atomCopy(translated);changed[1].bonds[2]=2;assert.equal(atomSolved(level,changed),false);
});
test('identical atoms are interchangeable; identities do not determine victory',()=>{
  const goal=atomModel([['red',0,0],['red',1,0],['blue',1,1]],[]),level=room(goal);
  const atoms=goal.map(a=>({...a,x:a.x+1,y:a.y+1}));[atoms[0].id,atoms[1].id]=[atoms[1].id,atoms[0].id];assert.equal(atomSolved(level,atoms),true);
});
test('a slide stops before another atom without moving it, and counts once over several cells',()=>{
  const goal=atomModel([['H',0,0],['H',1,0]],[[0,1]]),level=room(goal,[{...goal[0],x:1,y:3},{...goal[1],x:5,y:3}]);
  const state=createAtomState(level),original=JSON.stringify(state),result=atomSlide(level,state,'a0','right');
  assert.equal(result.distance,3);assert.equal(result.state.atoms[0].x,4);assert.equal(result.state.atoms[1].x,5);assert.equal(result.state.moves,1);assert.equal(JSON.stringify(state),original);
});
test('blocked commands do not count; there is no mid-slide stopping or rotation',()=>{
  const goal=atomModel([['N',0,0],['N',1,0]],[[0,1,3]]),level=room(goal,[{...goal[0],x:1,y:1},{...goal[1],x:4,y:4}]),s=createAtomState(level);
  assert.equal(atomSlide(level,s,'a0','up').changed,false);assert.equal(atomSlide(level,s,'a0','diagonal').changed,false);
  const moved=atomSlide(level,s,'a0','right').state;assert.equal(moved.atoms[0].x,5);assert.deepEqual(moved.atoms[0].bonds,s.atoms[0].bonds);
});
test('diagonal bonds do not add diagonal movement; triple bonds remain fixed',()=>{
  const goal=atomModel([['N',1,1],['H',0,1],['H',2,0],['H',2,2]],[[0,1],[0,2],[0,3]]);
  assert.deepEqual(goal[0].bonds,[0,1,0,1,0,0,1,0]);
  const triple=atomModel([['C',0,0],['C',1,0]],[[0,1,3]]);assert.equal(triple[0].bonds[2],3);assert.equal(triple[1].bonds[6],3);
});
test('a model can fit at different translations; wall overlap is invalid and does not affect play state',()=>{
  const goal=atomModel([['H',0,0],['H',1,0]],[[0,1]]),level=room(goal),before=JSON.stringify(level);
  assert.equal(atomGuideFits(level,{x:1,y:1}),true);assert.equal(atomGuideFits(level,{x:2,y:4}),true);assert.equal(atomGuideFits(level,{x:5,y:2}),false);assert.equal(JSON.stringify(level),before);
});
test('restoring validates species, bonds, positions and level-specific histories',()=>{
  const l=atomLevels[2],s=createAtomState(l),bad=atomCopy(s);bad.atoms[0].bonds[0]=99;
  assert.equal(validAtomState(bad,l),false);bad.atoms=atomCopy(s.atoms);bad.atoms[0].x=-1;assert.equal(validAtomState(bad,l),false);
  const restored=restoreAtom({level:2,state:bad,history:[bad,s],future:[bad],completed:[0,17,100]});assert.deepEqual(restored.state,s);assert.equal(restored.history.length,1);assert.equal(restored.future.length,0);assert.deepEqual(restored.completed,[0,17]);assert.deepEqual(pageInfo({load:()=>restored}),{level:'3'});
});
test('small-map minimum counts agree with an independent forward breadth-first search',()=>{
  for(const l of atomLevels.filter(l=>l.atoms.length===2)){
    const initial=createAtomState(l),q=[initial],seen=new Set([initial.atoms.map(a=>`${a.x},${a.y}`).join('|')]);let found;
    for(let head=0;head<q.length;head++){
      const s=q[head];if(s.phase==='won'){found=s.moves;break;}
      for(const a of s.atoms)for(const direction of ['up','right','down','left']){
        if(!atomDestination(l,s.atoms,a.id,direction))continue;
        const next=atomSlide(l,s,a.id,direction).state,key=next.atoms.map(a=>`${a.x},${a.y}`).join('|');
        if(!seen.has(key)){seen.add(key);q.push(next);}
      }
    }
    assert.equal(found,l.minimum,l.id);
  }
});

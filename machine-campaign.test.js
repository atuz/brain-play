import test from 'node:test';
import assert from 'node:assert/strict';
import {machineLevels,machineChapters} from './machine-levels.js';
import {createMachine,validateDraft,canPlace} from './machine-engine.js';
import {parts,copy,compatible,worldSize} from './machine-parts.js';
import {goalsOf,goalSatisfied} from './machine-goals.js';
import {restoreMachine} from './machine.js';

test('campaign keeps the original 25 indices, adds two chapters and uses all 41 tools',()=>{
  assert.equal(machineLevels.length,37);
  assert.deepEqual(machineLevels.slice(0,7).map(l=>l.id),['first-drop','bounce','wind','drive','sunlight','glass','fire']);
  assert.equal(machineLevels[24].id,'harbor-masterwork');
  assert.deepEqual(machineChapters.map(c=>machineLevels.filter(l=>l.chapter===c.id).length),[7,6,6,6,6,6]);
  assert.equal(new Set(machineLevels.map(l=>l.id)).size,37);
  const used=new Set(machineLevels.flatMap(l=>[...l.fixed,...l.solution.pieces,...l.solution.links].map(p=>p.type)));
  assert.deepEqual([...used].sort(),Object.keys(parts).sort());
  for(const chapter of machineChapters)assert.equal(new Set(machineLevels.filter(l=>l.chapter===chapter.id).map(l=>l.scene)).size,1);
});

test('authored boards have legal fixed parts, goals and fixed ropes; every example fits the editor grid',()=>{
  for(const level of machineLevels){
    const before=copy(level),size=worldSize(level);
    for(const p of level.fixed)assert.equal(canPlace(p,level.fixed,level.target,size),true,`${level.id}: fixed ${p.id}`);
    for(const goal of goalsOf(level.target)){
      assert.ok(Number.isFinite(goal.x)&&Number.isFinite(goal.y));assert.ok(goal.x>0&&goal.x<size.width&&goal.y>0&&goal.y<size.height);
      if(['activate','extinguish','break'].includes(goal.type))assert.ok(level.fixed.some(p=>p.id===goal.id));
    }
    for(const l of level.links||[])assert.ok(compatible(level.fixed.find(p=>p.id===l.a),level.fixed.find(p=>p.id===l.b),l.type),level.id);
    assert.equal(validateDraft(level,level.solution),true,level.id);
    if(!level.tutorial)for(const p of level.solution.pieces){assert.equal(p.x%10,0);assert.equal(p.y%10,0);assert.equal(Math.abs((p.angle||0)%15),0);}
    assert.deepEqual(level,before);
  }
});

for(const level of machineLevels)test(`campaign ${level.id}: every example item contributes to completing all goals`,()=>{
  for(const removed of [...level.solution.pieces,...level.solution.links]){
    const draft={pieces:level.solution.pieces.filter(p=>p.id!==removed.id),links:level.solution.links.filter(l=>l.id!==removed.id&&l.a!==removed.id&&l.b!==removed.id&&!l.via?.includes(removed.id))};
    const sim=createMachine(level,draft);while(!sim.won&&sim.time<(level.timeLimit||16))sim.step();
    assert.equal(sim.won,false,`${level.id}: removing ${removed.type} ${removed.id} still wins`);sim.dispose();
  }
});

test('one completed objective cannot finish a two-objective puzzle',()=>{
  const base=copy(machineLevels[5]),level={...base,fixed:[...base.fixed,{id:'other','type':'fishbowl',x:350,y:450}],target:{type:'all',goals:[base.target,{type:'break',id:'other',x:350,y:450}]}};
  const sim=createMachine(level,base.solution);sim.step(600);
  assert.equal(sim.won,false);assert.deepEqual(sim.goalStates.map(g=>g.done),[true,false]);assert.equal(sim.events.some(e=>e.type==='win'),false);sim.dispose();
});

test('cups validate placement for every objective and identify the requested ball',()=>{
  const target=machineLevels[7].target,goal=target.goals[0];
  for(const g of target.goals)assert.equal(canPlace({id:'bad',type:'ball',x:g.x,y:g.y},[],target,worldSize(machineLevels[7])),false);
  const body={isStatic:false,speed:0},a={id:'a',type:'ball',x:goal.x,y:goal.y,body},b={...a,id:'b'};
  assert.equal(goalSatisfied(goal,new Map([['b',b]])),false);assert.equal(goalSatisfied(goal,new Map([['a',a]])),true);
});

test('fixed rope IDs cannot be overwritten or duplicated by a draft connection',()=>{
  const l=machineLevels[11],existing=l.links[0];
  assert.equal(validateDraft(l,{pieces:[],links:[{...existing,id:'new'}]}),false);
  assert.equal(validateDraft({...l,tools:{rope:1}},{pieces:[],links:[{...existing,id:'new'}]}),false);
  const saved=restoreMachine({version:1,level:24,completed:[0,6,24],drafts:{fire:machineLevels[6].solution,'harbor-masterwork':machineLevels[24].solution}});
  assert.equal(saved.level,24);assert.deepEqual(saved.completed,[0,6,24]);assert.deepEqual(saved.drafts.fire,machineLevels[6].solution);
  assert.deepEqual(saved.drafts['harbor-masterwork'],machineLevels[24].solution);
});

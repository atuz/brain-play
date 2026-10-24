import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from './domino-levels.js';
import {at,hasFloor,pathTo,simulate} from './domino-engine.js';
import {referenceLayout} from './domino-guide.js';
import {machineLevels} from './machine-levels.js';
import {restoreMachine} from './machine.js';
import {laserLevels} from './laser-levels.js';
import {createLaserState,laserAction,validLaserState} from './laser-engine.js';
import {lemmingLevels} from './lemmings-levels.js';
import {rescueRoutes,runRescueRoute} from './dev/lemmings-solutions.mjs';
import {gardenLevels} from './zeek-levels.js';
import {createGardenState,gardenStep,validGardenState} from './zeek-engine.js';

// Enumerate arrangements, treating equal-type dominoes as interchangeable.
// This searches a superset of reachable edit sequences: if even this set has no
// solution, carrying pieces in a different order cannot bypass the lesson.
function solveWithoutDominoAbility(level,type){
  const trigger=level.pieces.find(p=>p.type==='trigger'),groups=new Map();
  for(const p of level.pieces.filter(p=>p!==trigger)){
    const kind=p.type===type?'normal':p.type;
    groups.set(kind,(groups.get(kind)||0)+1);
  }
  const slots=[];
  for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++)if(hasFloor(level,x,y)&&!at({x,y},trigger))slots.push({x,y});
  const entries=[...groups],pieces=[{...trigger}];let winner=null,arrangements=0;
  function arrange(group,available){
    if(group===entries.length){
      arrangements++;
      for(const p of pieces)if(pathTo(level,level.player,p))for(const dir of [-1,1]){
        const r=simulate(level,pieces,p.id,dir);
        if(r.won&&pathTo(level,p,level.exit,r.bridges)){winner={pieces:structuredClone(pieces),starter:p.id,dir};return true;}
      }
      return false;
    }
    const [kind,count]=entries[group];
    function choose(start,left,chosen){
      if(!left){
        const n=pieces.length;
        for(const i of chosen)pieces.push({id:`e${pieces.length}`,type:kind,...available[i]});
        const used=new Set(chosen),found=arrange(group+1,available.filter((_,i)=>!used.has(i)));
        pieces.length=n;return found;
      }
      for(let i=start;i<=available.length-left;i++){
        if(kind!=='vanish'&&at(available[i],level.exit))continue;
        if(choose(i+1,left-1,[...chosen,i]))return true;
      }
      return false;
    }
    return choose(0,count,[]);
  }
  arrange(0,slots);return {winner,arrangements};
}

test('domino lessons introduce splitting before a genuinely necessary delay',()=>{
  const known=new Set(['normal','trigger']),introductions=[];
  for(const level of levels.slice(0,8)){
    const added=[...new Set(level.pieces.map(p=>p.type))].filter(t=>!known.has(t));
    assert.ok(added.length<=1,`Level ${level.id} introduces multiple abilities`);
    introductions.push(...added.map(type=>[level.id,type]));added.forEach(t=>known.add(t));
  }
  assert.deepEqual(introductions,[[4,'splitter'],[5,'vanish'],[6,'bridge'],[7,'delay']]);
});
for(const [number,type]of [[4,'splitter'],[5,'vanish'],[6,'bridge'],[7,'delay']])test(`domino lesson ${number}: no legal arrangement can win with ${type} replaced by normal`,()=>{
  const level=levels[number-1],pieces=referenceLayout(level),starter=pieces.find(p=>at(p,level.push));
  assert.equal(simulate(level,pieces,starter.id,level.push.dir).won,true);
  const search=solveWithoutDominoAbility(level,type);
  assert.ok(search.arrangements>0);assert.equal(search.winner,null,JSON.stringify(search.winner));
});

test('machine introductory inventory adds exactly one operable tool each time',()=>{
  const known=new Set(),introduced=[];
  for(const level of machineLevels.filter(l=>l.tutorial)){
    const added=Object.keys(level.tools).filter(t=>!known.has(t));
    assert.equal(added.length,1,level.id);introduced.push(added[0]);Object.keys(level.tools).forEach(t=>known.add(t));
  }
  assert.deepEqual(introduced,['ramp','trampoline','fan','belt','rope','pistol','lens']);
});
test('machine old introductory drafts keep links when motor and panel become pre-installed',()=>{
  const old={version:1,level:4,completed:[0,3],drafts:{
    drive:{pieces:[{id:'old-motor',type:'motor',x:150,y:250}],links:[{id:'l1',type:'belt',a:'old-motor',b:'c'}]},
    sunlight:{pieces:[{id:'old-panel',type:'solar',x:165,y:240},{id:'s2',type:'fan',x:235,y:300}],links:[{id:'l1',type:'rope',a:'l',b:'k'}]},
  }};
  const restored=restoreMachine(old);
  assert.deepEqual(restored.drafts.drive,machineLevels[3].solution);
  assert.deepEqual(restored.drafts.sunlight,machineLevels[4].solution);
  assert.deepEqual(restored.completed,[0,3]);assert.equal(restored.level,4);assert.equal(old.drafts.drive.pieces.length,1);
});

function solveLaserWithout(level,forbidden){
  const initial=createLaserState(level),queue=[initial],seen=new Set();
  const key=s=>JSON.stringify([s.tiles,s.tank,s.actors]);
  seen.add(key(initial));
  for(let i=0;i<queue.length;i++){
    assert.ok(queue.length<10000,'search must exhaust the finite tutorial, not stop at a depth limit');
    const s=queue[i];if(s.phase==='won')return true;
    for(const action of ['up','right','down','left','fire']){
      const result=laserAction(s,action);
      if(result.state.phase==='lost'||forbidden(result.frames))continue;
      const k=key(result.state);if(!seen.has(k)){seen.add(k);queue.push(result.state);}
    }
  }
  return false;
}
function reflected(frames){
  return frames.some(f=>f.kind==='beam'&&f.beam.some((p,i,b)=>i>1&&(p.x-b[i-1].x!==b[i-1].x-b[i-2].x||p.y-b[i-1].y!==b[i-1].y-b[i-2].y)));
}
for(const number of [3,6])test(`laser lesson ${number}: all routes require reflection${number===6?' and rotation':''}`,()=>{
  const l=laserLevels[number-1];
  assert.equal(solveLaserWithout(l,()=>false),true,'a normal route exists');
  assert.equal(solveLaserWithout(l,reflected),false,'cannot walk around and shoot directly');
  if(number===6)assert.equal(solveLaserWithout(l,frames=>frames.some(f=>f.kind==='rotate')),false);
  const stale=createLaserState({...l,revision:1});assert.equal(validLaserState(stale,l),false,'old geometry must restart this level');
});
for(const [number,event]of [[1,'break'],[2,'bridge'],[4,'push'],[7,'destroy'],[8,'push']])test(`laser lesson ${number}: no route skips ${event}`,()=>{
  const level=laserLevels[number-1];
  assert.equal(solveLaserWithout(level,()=>false),true);
  assert.equal(solveLaserWithout(level,frames=>frames.some(f=>f.kind===event)),false);
});
test('the added garden wall restarts a stale layout without accepting a route through it',()=>{
  const level=gardenLevels[1],old={...level,objects:level.objects.filter(o=>!(o.type==='wall'&&o.x===3&&o.y===4))};
  assert.equal(validGardenState(createGardenState(old),level),false);
});
test('rescue first eight lessons each add one skill, with no premature bomber stock',()=>{
  const known=new Set(),introduced=[];
  for(const level of lemmingLevels.slice(0,8)){
    const added=Object.keys(level.skills).filter(k=>!known.has(k));
    assert.equal(added.length,1,level.id);introduced.push(added[0]);Object.keys(level.skills).forEach(k=>known.add(k));
  }
  assert.deepEqual(introduced,['digger','basher','floater','climber','builder','blocker','miner','bomber']);
});
for(const level of lemmingLevels.slice(0,8))test(`rescue ${level.id}: omitting its taught skill fails the recorded route`,()=>{
  const route=rescueRoutes[Number(level.id.slice(1))-1],skill=route.at(-1).skill;
  assert.equal(runRescueRoute(level,route.filter(t=>t.skill!==skill)).state.phase,'lost');
});

// Finite state search includes waits, timers, plant states and item positions;
// score, direction and total beats do not affect the next thinking-mode action.
const skippedGardenMechanics={
  2:(r,s)=>r.events.some(e=>e.type==='move'&&s.objects.find(o=>o.id===e.id)?.type==='stone'),
  3:r=>r.events.some(e=>e.type==='grab'&&e.food==='apple'),
  5:r=>r.events.some(e=>e.type==='unlock'),
  6:r=>r.events.some(e=>e.type==='pickup'&&e.kind==='egg'),
  7:r=>r.events.some(e=>e.type==='charge'),
  8:r=>r.events.some(e=>e.type==='blast'),
  9:r=>r.events.some(e=>e.type==='pickup'&&e.kind==='pill'),
  10:(r,s)=>r.events.some(e=>e.type==='move'&&s.objects.find(o=>o.id===e.id)?.type==='stone'),
  11:r=>r.events.some(e=>e.type==='grab'&&e.food==='rotten'),
};
for(const [number,skip]of Object.entries(skippedGardenMechanics))test(`garden lesson ${number}: no thinking-mode route skips the taught mechanic`,()=>{
  const level=gardenLevels[Number(number)-1],initial=createGardenState(level),queue=[initial];
  const key=s=>JSON.stringify([s.player.x,s.player.y,s.player.invisible,s.keys||0,s.objects]);
  const seen=new Set([key(initial)]);
  for(let i=0;i<queue.length;i++){
    assert.ok(queue.length<50000,'must exhaust states instead of stopping at a search limit');
    const s=queue[i];assert.notEqual(s.phase,'won');
    for(const action of ['up','right','down','left','wait']){
      const result=gardenStep(level,s,action);
      if(!result.changed||result.state.phase==='lost'||skip(result,s))continue;
      const k=key(result.state);if(!seen.has(k)){seen.add(k);queue.push(result.state);}
    }
  }
});

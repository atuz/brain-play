import {writeFile} from 'node:fs/promises';
import {machineLevels} from '../machine-levels.js';
import {createMachine,validateDraft} from '../machine-engine.js';
const results=[];
for(const level of machineLevels){
  const sim=createMachine(level,level.solution),limit=level.timeLimit||16;
  while(!sim.won&&sim.time<limit)sim.step();
  const result={id:level.id,valid:validateDraft(level,level.solution),won:sim.won,time:+sim.time.toFixed(2),goals:sim.goalStates.map(g=>g.done),
    events:sim.events.map(({type,id,time})=>({type,id,time:+time.toFixed(2)})),positions:sim.snapshot()};
  results.push(result);console.log(`${String(machineLevels.indexOf(level)+1).padStart(2)} ${level.id}: ${result.valid?'legal':'ILLEGAL'} ${result.won?'WON':'FAILED'} ${result.time}s ${result.goals}`);sim.dispose();
}
await writeFile('/tmp/brain-play-machine-level-check.json',JSON.stringify(results,null,2));
if(process.argv.includes('--ablate')){
  const bypasses=[];
  for(const level of machineLevels.filter(l=>!l.tutorial))for(const removed of [...level.solution.pieces,...level.solution.links]){
    const draft={pieces:level.solution.pieces.filter(p=>p.id!==removed.id),links:level.solution.links.filter(l=>l.id!==removed.id&&l.a!==removed.id&&l.b!==removed.id)};
    const sim=createMachine(level,draft);while(!sim.won&&sim.time<(level.timeLimit||16))sim.step();
    if(sim.won){bypasses.push({level:level.id,removed:removed.id,type:removed.type});console.log('BYPASS',level.id,removed.id,removed.type);}
    sim.dispose();
  }
  await writeFile('/tmp/brain-play-machine-level-ablation.json',JSON.stringify(bypasses,null,2));
  console.log('Redundant items:',bypasses.length);
}

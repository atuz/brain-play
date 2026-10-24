import test from 'node:test';
import assert from 'node:assert/strict';
import {createLaserState,laserAction,validLaserState} from './laser-engine.js';
import {laserLevels} from './laser-levels.js';
import {restoreLaser,pageInfo} from './laser.js';
const run=(state,...commands)=>commands.reduce((s,c)=>laserAction(s,c,{frames:false}).state,state);
function lab({tank=[1,4,1],tiles=[],actors=[]}={}){
  const l={id:'lab',w:9,h:9,tiles:Array(81).fill('ground'),tank:{x:tank[0],y:tank[1],dir:tank[2]},actors};
  for(const [x,y,t]of tiles)l.tiles[y*9+x]=t;
  return createLaserState(l);
}
for(const level of laserLevels)test(`laser ${level.id}: authored route reaches the flag without failure`,()=>{
  let s=createLaserState(level);
  for(const command of level.solution){s=laserAction(s,command,{frames:false}).state;assert.notEqual(s.phase,'lost');assert.ok(validLaserState(s,level));}
  assert.equal(s.phase,'won');assert.ok(s.moves>0);
});
test('turning does not move; blocked movement does not count; input state stays immutable',()=>{
  const before=lab({tiles:[[2,4,'wall']]}),json=JSON.stringify(before);
  const turned=run(before,'up');assert.equal(turned.moves,0);assert.equal(turned.tank.y,4);
  assert.equal(run(before,'right').moves,0);assert.equal(JSON.stringify(before),json);
});
test('a laser destroys only the first brick and passes through crystal',()=>{
  const s=run(lab({tiles:[[2,4,'crystal'],[3,4,'brick'],[4,4,'brick']]}),'fire');
  assert.equal(s.tiles[4*9+3],'ground');assert.equal(s.tiles[4*9+4],'brick');assert.equal(s.shots,1);
});
test('a second box blocks the first; the tank cannot body-push a crate',()=>{
  const s=lab({tank:[3,4,1],actors:[{type:'box',x:4,y:4},{type:'box',x:5,y:4}]});
  assert.deepEqual(run(s,'fire').actors,s.actors);assert.equal(run(s,'right').tank.x,3);
});
for(const type of ['box','mirror','enemy'])test(`${type} on thin ice against a wall: only the box becomes a bridge`,()=>{
  const s=run(lab({actors:[{type,x:3,y:4,face:'NE',dir:0}],tiles:[[4,4,'thin'],[5,4,'wall']]}),'fire');
  assert.equal(s.actors.length,0);assert.equal(s.tiles[4*9+4],type==='box'?'bridge':'water');
});
test('all movable object types slide over normal ice',()=>{
  for(const type of ['box','mirror','enemy']){
    const s=run(lab({actors:[{type,x:3,y:4,face:'NE',dir:0}],tiles:[[4,4,'ice'],[5,4,'ice'],[6,4,'ice']]}),'fire');
    assert.equal(s.actors[0].x,7);assert.equal(s.tiles[4*9+4],'ice');
  }
});
test('blocked ice is safe, blocked thin ice kills the tank; an automatic chain counts once',()=>{
  for(const type of ['ice','thin']){
    const s=run(lab({tank:[1,4,1],tiles:[[2,4,type],[3,4,type],[4,4,'wall']]}),'right');
    assert.equal(s.moves,1);assert.equal(s.phase,type==='thin'?'lost':'playing');
    if(type==='ice')assert.equal(run(s,'down','down').tank.y,5);
  }
});
test('enemy front becomes an indestructible wreck; crystal shields its sight',()=>{
  const s=run(lab({actors:[{type:'enemy',x:4,y:4,dir:3}],tiles:[[2,4,'crystal']]}),'fire','fire');
  assert.equal(s.phase,'playing');assert.equal(s.actors[0].type,'wreck');assert.equal(s.actors[0].x,4);
});
test('entering enemy sight and reflected own fire can both kill the player',()=>{
  assert.equal(run(lab({tank:[1,5,0],actors:[{type:'enemy',x:4,y:4,dir:3}]}),'up').reason,'enemy');
  const reflected=run(lab({tank:[2,2,1],actors:[{type:'mirror',x:6,y:2,face:'SW'},{type:'mirror',x:6,y:6,face:'NW'},{type:'mirror',x:2,y:6,face:'NE'}]}),'fire');
  assert.equal(reflected.reason,'self');assert.equal(reflected.phase,'lost');
});
const reflections={NW:{right:'up',down:'left'},NE:{down:'right',left:'up'},SE:{up:'right',left:'down'},SW:{up:'left',right:'down'}};
const delta={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]},names=['up','right','down','left'];
for(const face of Object.keys(reflections))for(const direction of names)test(`mirror ${face}, incoming ${direction}: reference incidence matrix`,()=>{
  const [dx,dy]=delta[direction],output=reflections[face][direction],tiles=[];
  if(output){const [ex,ey]=delta[output];tiles.push([4+ex*2,4+ey*2,'brick']);}
  else tiles.push([4+dx,4+dy,'water']);
  const s=run(lab({tank:[4-dx*3,4-dy*3,names.indexOf(direction)],actors:[{type:'mirror',x:4,y:4,face}],tiles}),'fire');
  if(output){const [ex,ey]=delta[output];assert.equal(s.tiles[(4+ey*2)*9+4+ex*2],'ground');assert.equal(s.actors[0].x,4);assert.equal(s.actors[0].y,4);}
  else{assert.equal(s.actors.length,0);assert.equal(s.tiles[(4+dy)*9+4+dx],'water');}
});
test('rotary mirror turns in place on a back hit and reflects only on a later shot',()=>{
  const s=lab({tank:[4,1,2],actors:[{type:'rotary',x:4,y:4,face:'SW'}],tiles:[[4,5,'water'],[2,4,'brick']]});
  const once=run(s,'fire');assert.equal(once.actors[0].face,'NW');assert.equal(once.tiles[4*9+2],'brick');
  assert.equal(run(once,'fire').tiles[4*9+2],'ground');
});
test('conveyors preserve heading, stop before obstacles, carry tanks but not boxes',()=>{
  const s=run(lab({tank:[1,4,1],tiles:[[2,4,'mover:1'],[3,4,'mover:1'],[4,4,'wall']]}),'right');
  assert.deepEqual([s.tank.x,s.tank.y,s.tank.dir,s.moves],[3,4,1,1]);
  const box=run(lab({actors:[{type:'box',x:3,y:4}],tiles:[[4,4,'mover:1'],[5,4,'mover:1']]}),'fire');assert.equal(box.actors[0].x,4);
});
test('conveyor cycles terminate a recoverable action instead of blocking the browser',()=>{
  const s=run(lab({tiles:[[2,4,'mover:1'],[3,4,'mover:2'],[3,5,'mover:3'],[2,5,'mover:0']]}),'right');
  assert.equal(s.phase,'playing');assert.equal(s.reason,'cycle');assert.equal(s.moves,1);
});
test('portal occupants wait and automatically exit after their blocking crate moves',()=>{
  const l=laserLevels[12];let s=createLaserState(l);s=run(s,'fire','right','right','right');
  assert.equal(s.tank.waiting,true);assert.deepEqual([s.tank.x,s.tank.y],[4,5]);
  s=run(s,'fire');assert.deepEqual([s.tank.x,s.tank.y,s.moves,s.tank.dir],[5,2,3,1]);assert.equal(s.actors.find(a=>a.type==='box').y,3);
});
test('multiple same-color portals skip occupied exits; lasers never teleport',()=>{
  const s=lab({tank:[3,4,1],actors:[{type:'box',x:4,y:4}],tiles:[[1,4,'portal:0'],[5,4,'portal:0'],[7,4,'portal:0'],[8,4,'brick']]});
  const moved=run(s,'fire','right','right');assert.equal(moved.actors[0].x,1);assert.equal(moved.tank.x,7);
  const beam=run(s,'fire','fire');assert.equal(beam.tiles[4*9+8],'ground');
});
test('restore rejects corrupt positions and histories; level identity is stable for host navigation',()=>{
  const saved=restoreLaser({level:12,state:{version:1},history:[{}],completed:[0,12,99]});
  assert.equal(saved.state.level,'l13');assert.equal(saved.history.length,0);assert.deepEqual(saved.completed,[0,12]);assert.deepEqual(pageInfo({load:()=>saved}),{level:'13'});
});

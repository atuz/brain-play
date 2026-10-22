import test from 'node:test';
import assert from 'node:assert/strict';
import {connectionPaths,connectionPathData,traceConnection,returnToTray} from './machine-links.js';
import {copy} from './machine-parts.js';
import {machineLevels,sandbox} from './machine-levels.js';
import {validateDraft} from './machine-engine.js';
import {restoreMachine} from './machine.js';

test('a rope between fixed parts can be returned alone and the valid draft survives save/restore',()=>{
  const level=machineLevels[6],draft=copy(level.solution),before=copy(draft),next=returnToTray(draft,'l1');
  assert.deepEqual(next.pieces,draft.pieces);assert.deepEqual(next.links,[]);
  assert.equal(validateDraft(level,next),true);
  assert.deepEqual(restoreMachine({version:1,level:6,drafts:{[level.id]:next}}).drafts[level.id],next);
  assert.deepEqual(draft,before,'returning a connection must not mutate the undo snapshot');
  assert.equal(returnToTray(draft,'l'),null,'the fixed light is not a returnable draft item');
  assert.equal(returnToTray(draft,'missing'),null);
});

test('returning one rope preserves another rope on the same endpoint and both connected parts',()=>{
  const draft={pieces:[{id:'lamp','type':'light',x:100,y:100},{id:'bucket','type':'bucket',x:100,y:300},{id:'other','type':'light',x:300,y:100}],
    links:[{id:'rope1',type:'rope',a:'lamp',b:'bucket'},{id:'rope2',type:'rope',a:'other',b:'bucket'}]};
  assert.equal(validateDraft(sandbox,draft,{free:true}),true);
  const next=returnToTray(draft,'rope1');assert.deepEqual(next.pieces,draft.pieces);assert.deepEqual(next.links,[draft.links[1]]);
  assert.equal(validateDraft(sandbox,next,{free:true}),true);
  const withoutBucket=returnToTray(draft,'bucket');assert.equal(withoutBucket.pieces.length,2);assert.deepEqual(withoutBucket.links,[]);
});

test('a belt can be returned without moving its motor or fixed conveyor',()=>{
  const level=machineLevels[3],draft=copy(level.solution),next=returnToTray(draft,'l1');
  assert.deepEqual(next,{pieces:draft.pieces,links:[]});assert.equal(validateDraft(level,next),true);
  assert.deepEqual(returnToTray(draft,'s1'),{pieces:[],links:[]});
});

test('rope touch paths use the visible attachment points and quadratic sag, including cut/run states',()=>{
  const pieces=[{id:'lamp',type:'light',x:100,y:100},{id:'bucket',type:'bucket',x:80,y:400}],link={type:'rope',a:'lamp',b:'bucket'};
  const paths=connectionPaths(link,pieces);
  assert.deepEqual(paths,[{from:{x:108,y:131},control:{x:94,y:261.5},to:{x:80,y:368}}]);
  assert.equal(connectionPathData(paths),'M 108 131 Q 94 261.5 80 368');
  const calls=[],c={beginPath:()=>calls.push('begin'),moveTo:(...v)=>calls.push(['move',...v]),quadraticCurveTo:(...v)=>calls.push(['curve',...v])};
  traceConnection(c,paths);assert.deepEqual(calls,['begin',['move',108,131],['curve',94,261.5,80,368]]);
  assert.equal(connectionPaths({...link,slack:1000},pieces,'run')[0].control.y,304.5);
  assert.deepEqual(connectionPaths({...link,cut:true},pieces,'run'),[{from:{x:108,y:131},control:{x:120,y:161},to:{x:108,y:171}}]);
  assert.deepEqual(connectionPaths({...link,a:'missing'},pieces),[]);
});

test('belt touch paths follow both visible rails, mirrored shafts and the real conveyor shaft',()=>{
  const pieces=[{id:'motor',type:'motor',x:100,y:200,flip:true},{id:'conveyor',type:'conveyor',x:300,y:200}],link={type:'belt',a:'motor',b:'conveyor'};
  const paths=connectionPaths(link,pieces);
  assert.deepEqual(paths,[{from:{x:119,y:193},to:{x:254,y:193}},{from:{x:119,y:207},to:{x:254,y:207}}]);
  assert.equal(connectionPathData(paths),'M 119 193 L 254 193 M 119 207 L 254 207');
  const calls=[],c={beginPath:()=>{},moveTo:(...v)=>calls.push(['move',...v]),lineTo:(...v)=>calls.push(['line',...v])};
  traceConnection(c,paths);assert.deepEqual(calls,[['move',119,193],['line',254,193],['move',119,207],['line',254,207]]);
});

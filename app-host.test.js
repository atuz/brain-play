import test from 'node:test';
import assert from 'node:assert/strict';
import {connectAppHost,validNavigation} from './app-host.js';
import {gameCodes} from './storage.js?v=27';
import {pageInfo as mergePage} from './2048.js';
import {pageInfo as dominoPage} from './domino.js';
import {pageInfo as nonogramPage} from './nonogram.js';
import {pageInfo as machinePage} from './machine.js';
import {startGame} from './game-transition.js';

function gatedHost(){
  const messages=[],listeners=new Map();
  const host={__brainPlayHost:{version:1,navigationGate:true},addEventListener:(name,fn)=>listeners.set(name,fn),
    webkit:{messageHandlers:{brainPlay:{postMessage:m=>messages.push(m)}}}};
  return {host,messages,resume:id=>listeners.get('brainPlayResume')({detail:{id}})};
}
test('a gated boundary waits for its matching App response, never an old ad response',async()=>{
  const {host,messages,resume}=gatedHost(),bridge=connectAppHost('https://atuz.github.io/brain-play/',host);
  let started=false;
  const wait=bridge.begin({screen:'game',game:'g001',level:'round',reason:'enter'}).then(allowed=>{started=allowed;});
  await Promise.resolve();assert.equal(started,false);
  resume('old_document:1');await Promise.resolve();assert.equal(started,false);
  resume(messages[0].navigation.id);await wait;assert.equal(started,true);
  resume(messages[0].navigation.id);assert.equal(messages.length,1);
});
test('leaving or replacing a gated boundary cancels its stale start',async()=>{
  const {host,messages,resume}=gatedHost(),bridge=connectAppHost('https://atuz.github.io/brain-play/',host);
  const page={screen:'game',game:'g010',level:'1',reason:'enter'};
  const first=bridge.begin(page),second=bridge.begin({...page,level:'2'});
  assert.equal(await first,false);resume(messages[0].navigation.id);
  bridge.navigate({screen:'home',reason:'back'});assert.equal(await second,false);
});
test('legacy, ordinary and broken bridges immediately allow loading and playing',async()=>{
  const page={screen:'game',game:'g011',level:'1',reason:'enter'};
  assert.equal(await connectAppHost('https://example.com').begin(page),true);
  const {host}=gatedHost();host.webkit.messageHandlers.brainPlay.postMessage=()=>{throw Error('unavailable');};
  assert.equal(await connectAppHost('https://example.com',host).begin(page),true);
});
test('a restart action and its new timer only begin after permission',async()=>{
  let run=0,permit;
  const ctx={transition:async(reason,info,action)=>{assert.equal(reason,'restart');assert.deepEqual(info,{level:'7'});if(await new Promise(resolve=>permit=resolve))action();}};
  const wait=startGame(ctx,'restart',()=>run++,{level:'7'});assert.equal(run,0);
  permit(true);await wait;assert.equal(run,1);
  const cancelled=startGame(ctx,'restart',()=>run++,{level:'7'});permit(false);await cancelled;assert.equal(run,1);
});

test('all eleven game codes report entry and repeat-round navigation without save data',()=>{
  const messages=[],handler={postMessage(message){assert.equal(this,handler);messages.push(message);}};
  const bridge=connectAppHost('https://atuz.github.io/brain-play/?app=1',{webkit:{messageHandlers:{brainPlay:handler}}});
  for(const game of Object.values(gameCodes))for(const reason of ['enter','restart','new-round','next','previous','select','reload']){
    assert.equal(bridge.navigate({screen:'game',game,level:'1',reason}),true);
  }
  assert.equal(messages.length,77);assert.equal(new Set(messages.map(m=>m.navigation.id)).size,77);
  for(const message of messages){assert.equal(message.type,'navigation');assert.equal(message.source,'brain-play');assert.equal(message.version,1);assert.equal('save' in message,false);assert.match(message.navigation.id,/^[a-zA-Z0-9_-]{8,80}:[1-9]\d*$/);}
  assert.equal(bridge.navigate({screen:'home',reason:'back'}),true);
});

test('navigation IDs distinguish real reloads and preserve metadata for variants and daily games',()=>{
  const messages=[],host={webkit:{messageHandlers:{brainPlay:{postMessage:m=>messages.push(m)}}}};
  const page={screen:'game',game:'g001',level:'round',variant:'fibonacci:5',reason:'reload',daily:true,day:'20261021'};
  connectAppHost('https://atuz.github.io/brain-play/?app=1',host).navigate(page);
  connectAppHost('https://atuz.github.io/brain-play/?app=1',host).navigate(page);
  assert.notEqual(messages[0].navigation.id,messages[1].navigation.id);
  const {id,...payload}=messages[0].navigation;assert.deepEqual(payload,page);assert.equal('id' in page,false);
});

test('ordinary browsers and unavailable bridges are silent and cannot interrupt gameplay',()=>{
  const page={screen:'game',game:'g010',level:'7',reason:'next'};
  assert.equal(connectAppHost('https://example.com/').navigate(page),false);
  assert.equal(connectAppHost('https://example.com/?app=1').navigate(page),false);
  const host={webkit:{messageHandlers:{brainPlay:{postMessage(){throw Error('Unavailable');}}}}};
  assert.equal(connectAppHost('https://example.com/?app=1',host).navigate(page),false);
  assert.equal(connectAppHost('https://example.com/?app=0',host).navigate(page),false);
});

test('move events, corrupt game names and accidental save fields cannot become ad opportunities',()=>{
  const page={screen:'game',game:'g011',level:'sandbox',reason:'enter'};
  for(const change of [{reason:'move'},{game:'machine'},{level:{}},{save:{}},{daily:'yes'},{day:'today'}, {variant:'<script>'}])assert.equal(validNavigation({...page,...change}),false);
  assert.equal(validNavigation(null),false);assert.equal(validNavigation({screen:'home',reason:'back',game:'g001'}),false);
  assert.equal(validNavigation({screen:'home',reason:'enter'}),true);
});

test('level descriptors match restored numbered levels, sandbox and all six merge variants',()=>{
  for(const mode of ['classic','fibonacci'])for(const size of [3,4,5])assert.deepEqual(mergePage({read:()=>({size,mode})}),{level:'round',variant:`${mode}:${size}`});
  assert.deepEqual(dominoPage({load:()=>({level:35})}),{level:'36'});
  assert.deepEqual(nonogramPage({load:()=>({level:7})}),{level:'8'});
  assert.deepEqual(machinePage({load:()=>({version:1,level:4})}),{level:'5'});
  assert.deepEqual(machinePage({load:()=>({version:1,free:true})}),{level:'sandbox'});
  for(const level of [-1,999,{},'2',null])for(const describe of [dominoPage,nonogramPage])assert.deepEqual(describe({load:()=>({level})}),{level:'1'});
});

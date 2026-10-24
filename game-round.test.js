import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoundSession,validResult} from './game-round.js';
import {readHostConfiguration,webClient} from './host-config.js?v=27';
import {connectAppHost} from './app-host.js';
import {createGameRuntime} from './game-runtime.js';
import {resolvePreferences} from './preferences.js';

const page={game:'g010',level:'7',daily:false};
function fixture(saved){let time=0,id=0;const results=[];const runtime=createGameRuntime({now:()=>time});
 const round=createRoundSession({saved,now:runtime.now,makeID:()=>`round_test_${++id}`,describe:()=>page,send:r=>results.push(r)});
 return {round,runtime,results,tick:ms=>time+=ms};}
test('one result per round, new attempts get new IDs, and ordinary moves only update metadata',()=>{
 const {round,results,tick}=fixture();tick(100);assert.equal(round.stamp({moves:1}).__round.activeMs,100);assert.equal(results.length,0);
 assert.equal(round.finish('won',{moves:6}),true);tick(500);assert.equal(round.finish('won',{moves:6}),false);
 assert.equal(round.stamp({}).__round.activeMs,100);assert.equal(results[0].moves,6);
 const first=results[0].id;round.reset();tick(20);round.finish('lost');assert.notEqual(results[1].id,first);assert.equal(results[1].activeMs,20);
});
test('ad, background and manual pause time is excluded; resume metadata continues the same round',()=>{
 const {round,runtime,results,tick}=fixture();tick(100);runtime.setPaused('ad',true);tick(10000);runtime.update({app:true,ad:false});tick(5000);runtime.setPaused('app',false);
 round.pause(true);tick(4000);round.pause(false);tick(40);
 const saved=round.stamp({}).__round;assert.equal(saved.activeMs,140);
 const resumed=createRoundSession({saved,now:runtime.now,makeID:()=>{throw Error('must reuse ID');},describe:()=>page,send:r=>results.push(r)});
 tick(60);resumed.finish('won');assert.equal(results[0].activeMs,200);assert.equal(results[0].id,saved.id);
 const done=createRoundSession({saved:resumed.stamp({}).__round,now:runtime.now,describe:()=>page,send:r=>results.push(r)});
 assert.equal(done.finish('won'),false);assert.equal(results.length,1);
});
test('legacy completed saves do not replay results, invalid metadata starts a fresh round',()=>{
 const results=[];const round=createRoundSession({legacyFinished:true,now:()=>0,makeID:()=> 'legacy_round_1',describe:()=>page,send:r=>results.push(r)});
 assert.equal(round.finish('won'),false);round.reset();assert.equal(round.finish('won'),true);
 for(const saved of [null,{id:'bad'}, {version:1,id:'round_test_1',activeMs:-1,reported:false}])assert.equal(fixture(saved).round.finish('won'),true);
});
test('all coded games accept supported result fields and reject state dumps and corrupt metrics',()=>{
 const base={id:'round_test_1',...page,outcome:'won',activeMs:100};
 for(let i=1;i<=15;i++)assert.equal(validResult({...base,game:`g${String(i).padStart(3,'0')}`,assisted:false,score:0,moves:4}),true);
 for(const change of [{id:'x'},{game:'g099'},{score:true},{moves:NaN},{attempts:-1},{activeMs:Infinity},{level:{}},{save:{}},{outcome:'abandoned'},{assisted:1}])assert.equal(validResult({...base,...change}),false);
});
test('initial configuration validates capabilities and preserves URL / saved preferences above App defaults',()=>{
 const host={__brainPlayHost:{version:1,navigationGate:true,app:{platform:'ios',version:'1.0',build:'12'},capabilities:{result:true,save:false,fake:true,close:'yes'},config:{language:'zh-TW',sound:false,animations:true,theme:'light'}}};
 const config=readHostConfiguration('https://example.com',host);
 assert.deepEqual(config.capabilities,{result:true,save:false,navigationGate:true});assert.equal(config.app.build,'12');assert.equal(config.config.sound,false);
 assert.equal(resolvePreferences('https://example.com',{},['en-US'],'',config.config).language,'zh-TW');
 assert.equal(resolvePreferences('https://example.com',{language:'en'},['zh-CN'],'',config.config).language,'en');
 assert.equal(resolvePreferences('https://example.com?lang=zh-CN',{language:'en'},['en'],'',config.config).language,'zh-CN');
 assert.deepEqual(readHostConfiguration('https://example.com?app=0',host).config,{});
 assert.deepEqual(readHostConfiguration('https://example.com',{__brainPlayHost:{version:2}}).capabilities,{});
});
test('ready negotiates web capabilities; results require native support and never become ad navigation',()=>{
 const messages=[],host={__brainPlayHost:{version:1,capabilities:{result:true}},webkit:{messageHandlers:{brainPlay:{postMessage:m=>messages.push(m)}}}};
 const bridge=connectAppHost('https://example.com',host);bridge.ready();assert.deepEqual(messages[0].client,webClient);
 assert.equal(bridge.result({id:'round_test_1',...page,outcome:'won',activeMs:20}),true);
 assert.equal(messages[1].type,'result');assert.equal('save' in messages[1],false);assert.equal('navigation' in messages[1],false);
 host.__brainPlayHost.capabilities.result=false;
 assert.equal(connectAppHost('https://example.com',host).result({id:'round_test_2',...page,outcome:'won',activeMs:20}),false);assert.equal(messages.length,2);
});
test('explicitly unavailable native capabilities fall back without sending unsupported messages',async()=>{
 const messages=[],host={__brainPlayHost:{version:1,navigationGate:true,capabilities:{navigation:false,save:false,close:false}},webkit:{messageHandlers:{brainPlay:{postMessage:m=>messages.push(m)}}}};
 const bridge=connectAppHost('https://example.com',host);
 assert.equal(await bridge.begin({screen:'game',game:'g001',level:'round',reason:'enter'}),true);
 assert.equal(bridge.checkpoint({}),false);assert.equal(bridge.close(),false);assert.equal(messages.length,0);
});

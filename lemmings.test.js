import test from 'node:test';
import assert from 'node:assert/strict';
import {lemmingLevels} from './lemmings-levels.js';
import {LEM_FPS,lemmingSkills,createLemmingState,terrainAt,startLemmings,tickLemmings,assignLemming,recallLemmings,saveLemmingState,restoreLemmingState} from './lemmings-engine.js';
import {restoreRescue,pageInfo} from './lemmings.js';
import {gameCodes,createStorage} from './storage.js';
import {translate} from './i18n.js';
import {rescueEnglish} from './lemmings-i18n.js';
import {rescuePreview} from './lemmings-art.js';
import {runRescueRoute} from './dev/lemmings-solutions.mjs';
function advance(s,l,condition,max=10000){while(s.phase==='playing'&&!condition(s)&&max-->0)tickLemmings(s,l);assert.ok(max>=0,'simulation must reach its condition');return s;}
function lab(extra={}){return {id:'lab',width:160,height:140,entry:{x:32,y:78,dir:1},exit:{x:140,y:100},terrain:[[0,100,160,40]],skills:Object.fromEntries(lemmingSkills.map(k=>[k,2])),total:1,need:1,time:30,interval:20,hazards:[],...extra};}
function begin(l){const s=createLemmingState(l);startLemmings(s);advance(s,l,s=>s.agents.some(a=>a.action==='walk'));return s;}
test('rescue launcher SVG has intrinsic dimensions instead of relying on flex auto sizing',()=>{
 assert.match(rescuePreview,/^<svg width="130" height="100" viewBox="0 0 130 100" preserveAspectRatio="xMidYMid meet"/);
 assert.match(rescuePreview,/class="mini-machine"/);
});
for(const l of lemmingLevels)test(`rescue ${l.id}: authored route actually rescues enough and survives saving`,()=>{
 const r=runRescueRoute(l),s=r.state;assert.equal(s.phase,'won');assert.ok(s.saved>=l.need);assert.equal(s.saved+s.lost,l.total);assert.equal(r.pending.length,0);
 const json=saveLemmingState(s);assert.deepEqual(saveLemmingState(restoreLemmingState(JSON.parse(JSON.stringify(json)),l)),json);
 assert.ok(Buffer.byteLength(JSON.stringify(json))<150000,'bounded terrain and crowd save');
 const untouched=createLemmingState(l);startLemmings(untouched);advance(untouched,l,()=>false);assert.equal(untouched.phase,'lost','an untouched map must not play itself to victory');
});
test('stable game code, current campaign progress and histories round-trip through opaque native storage',()=>{
 assert.equal(gameCodes.lemmings,'g015');const store=createStorage({nativeSave:null}),l=lemmingLevels[23],s=createLemmingState(l),history=[saveLemmingState(s)];
 store.write('game:lemmings',{version:1,level:23,state:saveLemmingState(s),history,completed:['r01','r17'],records:{r17:{saved:9,used:3}},paused:true});
 const next=restoreRescue(createStorage({nativeSave:store.snapshot()}).read('game:lemmings'));assert.equal(next.level,23);assert.equal(next.history.length,1);assert.deepEqual(next.completed,['r01','r17']);assert.equal(next.state.level,'r24');assert.deepEqual(pageInfo({load:()=>({level:23})}),{level:'24'});
});
test('invalid targets and duplicate permanent skills never consume stock',()=>{
 const l=lab(),s=begin(l),a=s.agents[0];const stock=s.stock.basher;
 assert.equal(assignLemming(s,a.id,'basher').ok,false);assert.equal(s.stock.basher,stock);
 for(const k of ['climber','floater']){assert.equal(assignLemming(s,a.id,k).ok,true);const n=s.stock[k];assert.equal(assignLemming(s,a.id,k).ok,false);assert.equal(s.stock[k],n);}
 assert.equal(assignLemming(s,999,'builder').ok,false);
});
test('the first tutorial is forgiving when a beginner digs directly below the entrance',()=>{
 const l=lemmingLevels[0],s=begin(l);assert.equal(assignLemming(s,1,'digger').ok,true);advance(s,l,()=>false);assert.equal(s.saved,l.total);assert.equal(s.phase,'won');
});
test('steel rejects digging and blast masks preserve steel',()=>{
 const l=lab({exit:{x:140,y:50},terrain:[[0,100,160,40,2],[40,96,3,4]],skills:{digger:1,bomber:1}}),s=begin(l),a=s.agents[0];
 assert.equal(assignLemming(s,a.id,'digger').ok,false);assert.equal(s.stock.digger,1);
 assert.equal(assignLemming(s,a.id,'bomber').ok,true);tickLemmings(s,l,5*LEM_FPS);assert.equal(a.cause,'blast');assert.equal(terrainAt(s,40,100),2);assert.equal(s.lost,0,'death animation finishes before counting loss');
});
test('one-way walls reject reverse horizontal work before stock is charged',()=>{
 const l=lab({entry:{x:80,y:78,dir:-1},terrain:[[0,100,160,40],[60,68,12,32,4]],skills:{basher:1}}),s=begin(l);
 advance(s,l,s=>s.agents[0].x<=80);assert.equal(assignLemming(s,1,'basher').ok,false);assert.equal(s.stock.basher,1);
});
test('a blocker returns to falling when its support is removed',()=>{
 const l=lab(),s=begin(l),a=s.agents[0];assert.equal(assignLemming(s,a.id,'blocker').ok,true);const y=a.y;
 for(let x=a.x-5;x<=a.x+5;x++)s.terrain[y*s.width+x]=0;
 tickLemmings(s,l);assert.equal(a.action,'fall');tickLemmings(s,l,10);assert.notEqual(a.action,'block');
});
test('construction lays rising steps; reassigning the same worker is rejected',()=>{
 const l=lab(),s=begin(l),a=s.agents[0],x=a.x,y=a.y;assert.equal(assignLemming(s,1,'builder').ok,true);
 const remaining=s.stock.builder;assert.equal(assignLemming(s,1,'builder').ok,false);assert.equal(s.stock.builder,remaining);tickLemmings(s,l,115);assert.equal(a.bricks,0);assert.equal(a.x,x+48);assert.equal(a.y,y-24);assert.equal(a.action,'shrug');
});
test('falling without a parachute loses the actual tutorial, with one every creature survives',()=>{
 const l=lemmingLevels[2],s=createLemmingState(l);startLemmings(s);advance(s,l,()=>false);assert.equal(s.saved,0);assert.equal(s.lost,l.total);assert.equal(runRescueRoute(l).state.saved,l.total);
});
test('trap cooldown lets following creatures pass instead of instantly killing the crowd',()=>{
 const l=lab({entry:{x:32,y:78,dir:1},total:3,need:2,interval:8,hazards:[{type:'trap',x:70,y:88,w:14,h:12}]}),s=begin(l);advance(s,l,()=>false);assert.equal(s.saved,2);assert.equal(s.lost,1);assert.equal(s.phase,'won');
});
test('recall stops new releases and performs a countdown instead of fabricating instant completion',()=>{
 const l=lab({total:10,need:9}),s=begin(l);recallLemmings(s);const released=s.released;assert.equal(s.phase,'playing');assert.equal(s.saved,0);assert.ok(s.agents[0].bomb>0);
 tickLemmings(s,l,200);assert.equal(s.released,released);assert.equal(s.phase,'lost');
});
test('restoring mid-dig is deterministic, including terrain, active bomb timers and release intervals',()=>{
 const l=lemmingLevels[0],s=createLemmingState(l);startLemmings(s);advance(s,l,s=>s.agents[0]?.x>=98);assignLemming(s,1,'digger');tickLemmings(s,l,13);
 const restored=restoreLemmingState(saveLemmingState(s),l);assert.ok(restored);tickLemmings(s,l,120);tickLemmings(restored,l,120);assert.deepEqual(saveLemmingState(restored),saveLemmingState(s));
});
test('corrupt terrain, wrong level, invalid agents and resource counts cannot restore',()=>{
 const l=lemmingLevels[0],s=begin(l),raw=saveLemmingState(s);
 for(const patch of [{level:'other'},{terrain:[0,999999,2]},{terrain:[0,10,1,5,10,1]},{agents:[{...raw.agents[0],x:NaN}]},{stock:{...raw.stock,digger:999}},{time:-1},{released:999}])assert.equal(restoreLemmingState({...raw,...patch},l),null);
 assert.equal(restoreRescue({level:99,state:raw}).level,0);
});
test('all level names, hints and skill descriptions have English translations',()=>{
 for(const l of lemmingLevels)for(const text of [l.name,l.hint])assert.notEqual(translate(text,'en'),text,text);
 for(const key of Object.keys(rescueEnglish))assert.notEqual(translate(key,'en'),key,key);
 assert.equal(translate('百战小旅鼠','zh-TW'),'百戰小旅鼠');assert.equal(translate('降落伞','zh-TW'),'降落傘');
 assert.equal(translate('技能图鉴','zh-TW'),'技能圖鑑');assert.equal(translate('搭桥','zh-TW'),'搭橋');assert.equal(translate('阻挡','zh-TW'),'阻擋');
});
for(const [number,omitted]of [[12,'builder'],[15,'builder'],[16,'blocker'],[18,'builder'],[21,'builder'],[22,'builder'],[24,'builder']])test(`rescue r${number}: skipping ${omitted} cannot bypass the authored obstacle`,()=>{
 const level=lemmingLevels[number-1];
 const routes={12:[{skill:'floater',all:true}],15:[{skill:'miner',x:[112,116],y:[82,82],dir:1,id:1}],16:[{skill:'floater',all:true}],18:[{skill:'digger',x:[128,132],y:[68,68],dir:1,id:1},{skill:'digger',x:[258,262],y:[120,120],dir:1,id:1}],21:[{skill:'floater',all:true},{skill:'digger',x:[138,142],y:[70,70],dir:1,id:1}],22:[{skill:'blocker',x:[138,142],y:[82,82],dir:1,id:1},{skill:'bomber',id:1,action:'block'},{skill:'digger',x:[278,282],y:[132,132],dir:1,id:2}],24:[{skill:'miner',x:[138,142],y:[78,78],dir:1,id:1}]};
 assert.equal(runRescueRoute(level,routes[number]).state.phase,'lost');
});

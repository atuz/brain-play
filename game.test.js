import test from 'node:test';
import assert from 'node:assert/strict';
import {seeded} from './shared.js?v=3';
import {slideLine,slideBoard,hasMoves} from './2048.js?v=3';
import {parseExpression,solve24,generate24} from './twentyfour.js?v=3';
import {flip,solveLights,generateLights} from './lights.js?v=3';
import {shufflePuzzle,solvedBoard,isSolved} from './fifteen.js?v=3';
import {rotate,generatePipes,checkPipes} from './pipes.js?v=3';
import {findPath,findPair,reshuffle} from './link.js?v=3';
import {groupAt,collapse,hasGroups} from './stars.js?v=3';
import {runs,clues,patterns,patternBits} from './nonogram.js?v=3';
import {compareGuess,validGuess} from './guess.js?v=3';

test('2048 merges each tile only once per move',()=>{
  assert.deepEqual(slideLine([2,2,2,2]),{line:[4,4,0,0],score:8});
  assert.deepEqual(slideLine([2,2,4,0]),{line:[4,4,0,0],score:4});
  assert.deepEqual(slideLine([4,0,4,8]),{line:[8,8,0,0],score:8});
});
test('2048 preserves direction, detects ineffective moves and game over',()=>{
  const b=[2,2,0,0,...Array(12).fill(0)];
  assert.deepEqual(slideBoard(b,'right').board.slice(0,4),[0,0,0,4]);
  assert.deepEqual(slideBoard(b,'down').board.slice(12),[2,2,0,0]);
  assert.equal(slideBoard([2,...Array(15).fill(0)],'left').moved,false);
  assert.equal(hasMoves([2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2]),false);
});
test('24 point parser respects precedence, fractions, and safe syntax',()=>{
  assert.equal(parseExpression('8÷(3−8÷3)').value.toFixed(6),'24.000000');
  assert.equal(parseExpression('(3+5)×(4−1)').value,24);
  assert.deepEqual(parseExpression(' (3+5) * (4-1) ').used,[3,5,4,1]);
  for(const text of ['alert(1)','2**3','1/0','(1+2','1 2+3','-3+27','NaN',''])assert.throws(()=>parseExpression(text),text);
});
test('24 point generator always supplies a verified solution using the cards',()=>{
  assert.equal(solve24([1,1,1,1]),null);
  const rng=seeded(20261020);
  for(let i=0;i<100;i++){const puzzle=generate24(rng),parsed=parseExpression(puzzle.solution);assert.ok(Math.abs(parsed.value-24)<1e-7);assert.deepEqual(parsed.used.sort((a,b)=>a-b),[...puzzle.numbers].sort((a,b)=>a-b));}
});
test('lights generator and GF(2) hints solve every generated board',()=>{
  const rng=seeded(5);
  for(let i=0;i<100;i++){let b=generateLights(rng);const solution=solveLights(b);assert.ok(solution);for(const click of solution)b=flip(b,click);assert.equal(b.reduce((a,b)=>a+b,0),0);}
  assert.deepEqual(flip(flip(Array(25).fill(0),0),0),Array(25).fill(0));
});
function parity(board){const v=board.filter(Boolean);let n=0;for(let i=0;i<v.length;i++)for(let j=i+1;j<v.length;j++)if(v[i]>v[j])n++;return (n+4-Math.floor(board.indexOf(0)/4))%2;}
test('fifteen puzzle shuffles are solvable permutations and not already solved',()=>{
  const rng=seeded(15);
  for(let i=0;i<100;i++){const b=shufflePuzzle(rng);assert.equal(parity(b),parity(solvedBoard()));assert.equal(isSolved(b),false);assert.deepEqual([...b].sort((a,b)=>a-b),Array.from({length:16},(_,i)=>i));}
});
test('pipe generation has a complete leak-free solution; rotations preserve tile shape',()=>{
  const rng=seeded(25);
  for(let i=0;i<100;i++){const p=generatePipes(rng);assert.equal(checkPipes(p.solution).won,true);assert.equal(checkPipes(p.board).won,false);for(let j=0;j<25;j++){let m=p.board[j];assert.ok([0,1,2,3].some(k=>{let v=p.solution[j];for(let x=0;x<k;x++)v=rotate(v);return v===m;}));for(let k=0;k<4;k++)m=rotate(m);assert.equal(m,p.board[j]);}}
  assert.equal(checkPipes(Array(25).fill(15)).won,false);
});
// Independent oracle enumerates all routes with at most two bends, including the outside border.
function linkOracle(board,a,b,rows=6,cols=6){if(a===b||!board[a]||board[a]!==board[b])return false;const A=[Math.floor(a/cols),a%cols],B=[Math.floor(b/cols),b%cols];function clear(P,Q){if(P[0]!==Q[0]&&P[1]!==Q[1])return false;const d=[Math.sign(Q[0]-P[0]),Math.sign(Q[1]-P[1])];let r=P[0],c=P[1];for(;;){if(r>=0&&r<rows&&c>=0&&c<cols){const i=r*cols+c;if(i!==a&&i!==b&&board[i])return false;}if(r===Q[0]&&c===Q[1])return true;r+=d[0];c+=d[1];}}
  if(clear(A,B))return true;for(let r=-1;r<=rows;r++)if(clear(A,[r,A[1]])&&clear([r,A[1]],[r,B[1]])&&clear([r,B[1]],B))return true;for(let c=-1;c<=cols;c++)if(clear(A,[A[0],c])&&clear([A[0],c],[B[0],c])&&clear([B[0],c],B))return true;return false;
}
test('link paths agree with an independent two-bend oracle',()=>{
 const rng=seeded(42);for(let trial=0;trial<30;trial++){const b=Array.from({length:36},()=>rng()<.3?0:1+Math.floor(rng()*4));for(let i=0;i<36;i++)for(let j=i+1;j<36;j++)if(b[i]===b[j])assert.equal(!!findPath(b,i,j),linkOracle(b,i,j),`${i},${j}`);}
});
test('link finds outer-border paths and reshuffles without losing pairs',()=>{
 const b=Array(36).fill(2);b[0]=b[5]=1;assert.ok(findPath(b,0,5));assert.equal(findPath(b,0,0),null);
 const rng=seeded(9),values=Array.from({length:18},(_,i)=>[i%9+1,i%9+1]).flat();for(let i=0;i<50;i++){const out=reshuffle(values,rng);assert.equal(out.length,36);assert.deepEqual([...out].sort(),[...values].sort());assert.ok(findPair(out));}
});
test('star groups connect orthogonally and collapse down then left',()=>{
 const b=[1,0,2,1,1,2,0,0,0];assert.equal(groupAt(b,0,3).length,3);assert.deepEqual(collapse(b,3),[0,0,0,1,0,2,1,1,2]);assert.equal(hasGroups(b,3),true);assert.equal(hasGroups([1,2,3,2,3,1,3,1,2],3),false);
});
function countNonogramSolutions(target){const targetClues=clues(target),options=targetClues.rows.map(clue=>Array.from({length:32},(_,mask)=>Array.from({length:5},(_,i)=>(mask>>i)&1)).filter(row=>runs(row).join(',')===clue.join(',')));let count=0;function recurse(rows){if(count>1)return;if(rows.length===5){const c=clues(rows.flat());if(JSON.stringify(c.cols)===JSON.stringify(targetClues.cols))count++;return;}for(const row of options[rows.length])recurse([...rows,row]);}recurse([]);return count;}
test('every published nonogram has exactly one solution',()=>{for(const p of patterns)assert.equal(countNonogramSolutions(patternBits(p)),1,p.name);});
test('guess feedback handles leading zeros and disallows repeated digits',()=>{
 assert.deepEqual(compareGuess('1234','1356'),{a:1,b:1});assert.deepEqual(compareGuess('0123','3210'),{a:0,b:4});assert.equal(validGuess('0123'),true);assert.equal(validGuess('1123'),false);assert.equal(validGuess('123'),false);
});


import {calculate,createRound,formatFraction,mergeRound,plan24,resetRound,restoreRound,undoRound} from './twentyfour-engine.js?v=3';
import {browserCountry,resolvePreferences,updatePreferenceURL} from './preferences.js?v=3';
import {translate} from './i18n.js?v=3';

test('24 card merges preserve exact fractions and use all four original cards',()=>{
  let r=createRound([3,3,8,8]);
  const initial=JSON.stringify(r);
  r=mergeRound(r,2,0,'÷');
  assert.equal(formatFraction(r.cards.find(c=>c.id===4)),'8/3');
  assert.equal(JSON.stringify(createRound([3,3,8,8])),initial);
  r=mergeRound(r,1,4,'-');
  assert.equal(formatFraction(r.cards.find(c=>c.id===5)),'1/3');
  r=mergeRound(r,3,5,'÷');
  assert.equal(r.done,true);assert.equal(formatFraction(r.cards[0]),'24');
  assert.equal(r.cards[0].mask,15);assert.equal(r.steps.length,3);
  assert.equal(restoreRound(JSON.parse(JSON.stringify(r))).done,true);
});
test('24 invalid merges leave the round intact and respect operand order',()=>{
  let r=mergeRound(createRound([3,3,8,8]),0,1,'-');
  const before=JSON.stringify(r);
  assert.throws(()=>mergeRound(r,2,4,'÷'),/0/);
  assert.throws(()=>mergeRound(r,2,2,'+'));
  assert.throws(()=>mergeRound(r,0,2,'+'));
  assert.equal(JSON.stringify(r),before);
  assert.deepEqual(calculate({n:2,d:1},{n:7,d:1},'-'),{n:-5,d:1});
  assert.deepEqual(calculate({n:0,d:1},{n:2,d:3},'÷'),{n:0,d:1});
});
test('24 undo, reset and resume retain solve credit and hint usage',()=>{
  let r=createRound([7,6,9,2]);r.assisted=true;r.claimed=true;
  const start=JSON.stringify(r);
  r=mergeRound(r,0,1,'+');
  const restored=restoreRound(JSON.parse(JSON.stringify(r)));
  assert.deepEqual(restored,r);assert.equal(JSON.stringify(undoRound(restored)),start);
  const reset=resetRound(restored);
  assert.equal(reset.claimed,true);assert.equal(reset.assisted,true);assert.equal(reset.history.length,0);
  const legacy=restoreRound({numbers:[3,3,8,8],done:true,revealed:true});
  assert.equal(legacy.claimed,true);assert.equal(legacy.assisted,true);assert.equal(legacy.cards.length,4);
  const corrupt=restoreRound({numbers:[1,1,1,1],version:2,cards:null});
  assert.equal(corrupt.cards.length,4);
});
test('24 hints form legal plans from intermediate positions',()=>{
  const rng=seeded(243);
  for(let trial=0;trial<50;trial++){
    let r=createRound(generate24(rng).numbers);
    while(r.cards.length>1){
      const plan=plan24(r.cards);assert.ok(plan?.length);
      const step=plan[0];r=mergeRound(r,step.first,step.second,step.op);
      assert.equal(r.cards.reduce((mask,c)=>mask|c.mask,0),15);
    }
    assert.equal(r.done,true);
  }
  assert.equal(plan24(createRound([1,1,1,1]).cards),null);
});
test('app URL country overrides browser region; missing country uses browser without IP lookup',()=>{
  const result=resolvePreferences('https://atuz.github.io/brain-play/?country=jp&lang=en&source=app#/game/twentyfour', {language:'zh-CN',country:'US'},['zh-TW'],'en-CA');
  assert.equal(result.country,'JP');assert.equal(result.language,'en');
  assert.equal(result.url.hash,'#/game/twentyfour');assert.equal(result.url.searchParams.get('source'),'app');
  assert.equal(result.url.searchParams.get('country'),'JP');
  const fallback=resolvePreferences('https://example.com/?country=bad#/',{country:'US'},['zh-Hant-TW','en-CA']);
  assert.equal(fallback.country,'TW');assert.equal(fallback.language,'zh-TW');
  assert.equal(browserCountry(['en','fr-CA']),'CA');
  const unknown=resolvePreferences('https://example.com/#/',{},['zh']);
  assert.equal(unknown.country,'');assert.equal(unknown.url.searchParams.has('country'),false);
});
test('language changes preserve country, query parameters and game route',()=>{
  const url=updatePreferenceURL('https://example.com/?country=CA&source=app#/game/link','zh-TW','CA');
  assert.equal(url.searchParams.get('lang'),'zh-TW');assert.equal(url.searchParams.get('country'),'CA');
  assert.equal(url.searchParams.get('source'),'app');assert.equal(url.hash,'#/game/link');
  assert.equal(resolvePreferences('https://example.com/',{language:'en'},['zh-CN']).language,'en');
});
test('UI translations include dynamic game feedback and accessible labels',()=>{
  assert.equal(translate('帮助 选择 撤销 减 灯','zh-TW'),'幫助 選擇 撤銷 減 燈');
  assert.equal(translate('设置','en'),'Settings');assert.equal(translate('设置','zh-TW'),'設定');
  assert.equal(translate('合成了 8/3，还剩 3 张牌。','en'),'Made 8/3. 3 cards left.');
  assert.equal(translate('已合并 2 步，共 3 步','en'),'2 of 3 merges complete');
  assert.equal(translate('第1行第2列，水源，已连通','en'),'Row 1, column 2, source, Connected');
  assert.equal(translate('第1张牌：8/3，来自(8÷3)','en'),'Card 1: 8/3, from (8÷3)');
});


import {mergeTarget,mergeValue,createMergeState,restoreMergeState,normalizeMergeSettings,mergeSlot,spawn} from './merge-engine.js?v=3';

test('Fibonacci merges consecutive values in either order; only 1 can merge with itself',()=>{
  for(const [a,b,value] of [[1,1,2],[1,2,3],[2,3,5],[3,5,8],[5,8,13],[987,1597,2584]]){
    assert.equal(mergeValue(a,b,'fibonacci'),value);assert.equal(mergeValue(b,a,'fibonacci'),value);
  }
  for(const [a,b] of [[2,2],[3,3],[1,3],[2,5],[0,1],[4,5]])assert.equal(mergeValue(a,b,'fibonacci'),0);
  assert.deepEqual(slideLine([1,1,2,0],'fibonacci'),{line:[2,2,0,0],score:2});
  assert.deepEqual(slideLine([1,2,3,5,0],'fibonacci'),{line:[3,8,0,0,0],score:11});
  assert.deepEqual(slideLine([5,0,3,2,1],'fibonacci'),{line:[8,3,0,0,0],score:11});
});
test('3x3 and 5x5 boards preserve direction, sum and input board',()=>{
  for(const size of [3,5])for(const mode of ['classic','fibonacci']){
    const a=mode==='classic'?2:3,b=mode==='classic'?2:5;
    const board=Array(size*size).fill(0);board[0]=a;board[1]=b;
    const before=[...board];
    const left=slideBoard(board,'left',size,mode),right=slideBoard(board,'right',size,mode);
    assert.equal(left.board[0],a+b);assert.equal(right.board[size-1],a+b);
    assert.deepEqual(board,before);
    const vertical=Array(size*size).fill(0);vertical[0]=a;vertical[size]=b;
    assert.equal(slideBoard(vertical,'up',size,mode).board[0],a+b);
    assert.equal(slideBoard(vertical,'down',size,mode).board[(size-1)*size],a+b);
    assert.equal(left.board.reduce((a,b)=>a+b,0),board.reduce((a,b)=>a+b,0));
    assert.equal(hasMoves(Array(size*size).fill(3),size,'fibonacci'),false);
  }
});
test('variants start with the correct tiles and restore separate compatible progress',()=>{
  for(const size of [3,4,5])for(const mode of ['classic','fibonacci']){
    const rng=seeded(size),state=createMergeState(size,mode,rng);
    assert.equal(state.board.length,size*size);assert.equal(state.board.filter(Boolean).length,2);
    const allowed=mode==='classic'?[0,2,4]:[0,1,2];assert.ok(state.board.every(v=>allowed.includes(v)));
    state.score=42;state.history=[{board:[...state.board],score:10,won:false}];
    assert.deepEqual(restoreMergeState(state,size,mode,rng),state);
    const otherSize=size===3?5:3;
    assert.equal(restoreMergeState(state,otherSize,mode,rng).board.length,otherSize*otherSize);
    assert.equal(restoreMergeState(state,otherSize,mode,rng).score,0);
  }
  const legacy={board:[2048,...Array(15).fill(0)],score:2048,won:true,history:[]};
  assert.equal(restoreMergeState(legacy,4,'classic').claimed,true);
  assert.equal(restoreMergeState(legacy,4,'fibonacci').score,0);
  assert.deepEqual(spawn([0,0,0],()=>0,'fibonacci'),[1,0,0]);
});
test('mode and board settings normalize safely and identify six independent save slots',()=>{
  const slots=new Set();for(const size of [3,4,5])for(const mode of ['classic','fibonacci'])slots.add(mergeSlot({size,mode}));
  assert.equal(slots.size,6);
  assert.equal(mergeTarget('classic',3),512);assert.equal(mergeTarget('classic',4),2048);assert.equal(mergeTarget('fibonacci',3),2584);
  assert.deepEqual(normalizeMergeSettings({size:'5',mode:'fibonacci'}),{size:5,mode:'fibonacci'});
  assert.deepEqual(normalizeMergeSettings(null),{size:4,mode:'classic'});
  assert.deepEqual(normalizeMergeSettings({size:99,mode:'unknown'}),{size:4,mode:'classic'});
});

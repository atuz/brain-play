import test from 'node:test';
import assert from 'node:assert/strict';
import {seeded} from './shared.js';
import {slideLine,slideBoard,hasMoves} from './2048.js';
import {parseExpression,solve24,generate24} from './twentyfour.js';
import {flip,solveLights,generateLights} from './lights.js';
import {shufflePuzzle,solvedBoard,isSolved} from './fifteen.js';
import {rotate,generatePipes,checkPipes} from './pipes.js';
import {findPath,findPair,reshuffle} from './link.js';
import {groupAt,collapse,hasGroups} from './stars.js';
import {runs,clues,patterns,patternBits} from './nonogram.js';
import {compareGuess,validGuess} from './guess.js';

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

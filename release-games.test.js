import test from 'node:test';
import assert from 'node:assert/strict';
import {games} from './catalog.js';
import {isGameReleased} from './release-games.js';
import {createStorage,gameCodes} from './storage.js';

const released=['2048','twentyfour','link','stars','lights','fifteen','pipes','nonogram','guess'];
const hidden=['lemmings','zeek','atom','laser','domino','machine'];

test('main release exposes only the nine simple games',()=>{
  assert.deepEqual(games.filter(game=>isGameReleased(game.id)).map(game=>game.id),released);
  for(const id of [...hidden,'unknown',undefined])assert.equal(isGameReleased(id),false);
});

test('release filtering preserves the complete catalog order and daily seed offsets',()=>{
  assert.equal(games.length,15);
  for(const id of hidden)assert(games.some(game=>game.id===id));
  assert.deepEqual(released.map(id=>games.findIndex(game=>game.id===id)),[5,6,7,8,9,10,11,12,13]);
});

test('temporarily hidden games retain their saved progress and stable native codes',()=>{
  const storage=createStorage({nativeSave:null});
  for(const id of hidden)assert.equal(storage.write(`game:${id}`,{level:3,completed:['saved']}),true);
  const saved=storage.snapshot(),restored=createStorage({nativeSave:saved});
  for(const id of hidden){
    assert(saved.games[gameCodes[id]]);
    assert.deepEqual(restored.read(`game:${id}`),{level:3,completed:['saved']});
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, gameCodes, validSave } from './storage.js?v=27';
import { connectAppHost } from './app-host.js?v=16';

function localStorage() {
  const values = new Map();
  return { get length() { return values.size; }, key: i => [...values.keys()][i],
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key) };
}

test('all eleven games, variants, daily games and records round-trip under stable codes', () => {
  const store = createStorage({ nativeSave: null });
  const entries = [];
  for (const [id, code] of Object.entries(gameCodes)) {
    assert.match(code, /^g\d{3}$/);
    entries.push([`game:${id}`, { board: [code], moves: 7, history: [{ moves: 6 }] }]);
    entries.push([`game:${id}:daily:20261021`, { daily: code }]);
  }
  for (const mode of ['classic', 'fibonacci']) for (const size of [3, 4, 5]) {
    entries.push([`game:2048:${mode}:${size}`, { board: Array(size * size).fill(size), mode }]);
    entries.push([`best:2048:${mode}:${size}`, 123 * size]);
  }
  entries.push(['options:2048', { size: 5, mode: 'fibonacci' }], ['best:2048', 900],
    ['best:stars', 750], ['solved:24', 8], ['solved:guess', 9],
    ['domino:records', { 12: { moves: 5 } }], ['preferences', { language: 'zh-TW', country: 'CA' }],
    ['sound', true], ['animations', false], ['completed', Object.fromEntries(Object.keys(gameCodes).map(id => [id, 4]))]);
  for (const [key, value] of entries) assert.equal(store.write(key, value), true, key);
  const save = store.snapshot();
  assert.equal(validSave(save), true);
  assert.equal(new Set(Object.values(gameCodes)).size, 11);
  assert.equal(gameCodes.machine, 'g011');
  assert.deepEqual(Object.keys(save.games).sort(), Object.values(gameCodes).sort());
  assert.deepEqual(save.games.g001.options, { size: 5, mode: 'fibonacci' });
  assert.equal(save.games.g010.completed, 4);
  const restored = createStorage({ nativeSave: JSON.parse(JSON.stringify(save)) });
  for (const [key, value] of entries) assert.deepEqual(restored.read(key), value, key);
});

test('App moves stay in memory; only return checkpoints and close transmit snapshots', () => {
  const local = localStorage(), messages = [];
  const host = connectAppHost('https://atuz.github.io/brain-play/?app=1', {
    webkit: { messageHandlers: { brainPlay: { postMessage: message => messages.push(message) } } },
  });
  const store = createStorage({ storage: local, nativeSave: null });
  for (let moves = 1; moves <= 50; moves++) store.write('game:domino', { moves });
  assert.equal(local.length, 0);
  assert.equal(messages.length, 0);
  host.checkpoint(store.snapshot());
  assert.equal(messages.length, 1);
  assert.equal(messages[0].type, 'save');
  assert.deepEqual(messages[0].save.games.g010.state, { moves: 50 });
  store.write('game:domino', { moves: 51 });
  assert.deepEqual(messages[0].save.games.g010.state, { moves: 50 });
  host.close(store.snapshot());
  assert.equal(messages[1].type, 'close');
  assert.deepEqual(messages[1].save.games.g010.state, { moves: 51 });
  // Without a return the next launch sees the last native checkpoint.
  assert.deepEqual(createStorage({ nativeSave: messages[0].save }).read('game:domino'), { moves: 50 });
});

test('first App launch adopts browser saves; later launches restore only native saves', () => {
  const local = localStorage(), browser = createStorage({ storage: local });
  browser.write('game:twentyfour', { cards: [3, 8] });
  browser.write('game:fifteen', { moves: 17 });
  browser.write('sound', true);
  local.setItem('unrelated-secret', 'never exported');
  local.setItem('brain-play:v1:unrelated', '"never exported"');
  local.setItem('brain-play:v1:game:pipes', 'broken JSON');
  const app = createStorage({ storage: local, nativeSave: null });
  assert.deepEqual(app.read('game:twentyfour'), { cards: [3, 8] });
  assert.equal(app.read('game:pipes'), null);
  assert.ok(!JSON.stringify(app.snapshot()).includes('never exported'));
  app.write('game:fifteen', { moves: 18 });
  assert.deepEqual(browser.read('game:fifteen'), { moves: 17 });
  browser.write('game:fifteen', { moves: 99 });
  const next = createStorage({ storage: local, nativeSave: app.snapshot() });
  assert.deepEqual(next.read('game:fifteen'), { moves: 18 });
  next.remove('game:fifteen');
  assert.equal(createStorage({ nativeSave: next.snapshot() }).read('game:fifteen'), null);
  assert.equal(browser.native, false);
});

test('snapshot and reads are detached, unsupported keys fail and blocked browser storage is safe', () => {
  const store = createStorage({ nativeSave: null });
  const state = { board: [1, 2] };
  store.write('game:link', state); state.board.push(3);
  store.read('game:link').board.push(4);
  store.snapshot().games.g003.state.board.push(5);
  assert.deepEqual(store.read('game:link'), { board: [1, 2] });
  assert.equal(store.write('game:toString', {}), false);
  assert.equal(store.write('game:domino:wrong', {}), false);
  assert.equal(store.write('unrelated', {}), false);
  assert.equal(validSave({ version: 99, games: {}, settings: {} }), false);
  assert.equal(validSave({ version: 1, games: { domino: {} }, settings: {} }), false);
  const blocked = createStorage({ storage: { getItem() { throw Error(); }, setItem() { throw Error(); } } });
  assert.equal(blocked.read('sound', false), false);
  assert.equal(blocked.write('sound', true), false);
  blocked.remove('sound');
});

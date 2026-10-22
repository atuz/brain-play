import test from 'node:test';
import assert from 'node:assert/strict';
import { restingDominoes, dominoDimensions as size } from './domino-resting.js';

const stone = (id, x, dir = 1, extra = {}) => ({ id, x, y: 5, dir, type: 'normal', state: 'flat', ...extra });
const rad = angle => angle * Math.PI / 180;
function contact(source, target, dir, targetWidth = size.width) {
  const a = rad(source.angle), b = rad(target.angle);
  const tipX = size.length * Math.sin(a) - size.pitch;
  const tipY = -size.length * Math.cos(a) - source.lift + target.lift;
  // The tip lies on the supporting tile's upper face, within the face bounds.
  const normal = tipX * Math.cos(b) + dir * tipY * Math.sin(b);
  assert.ok(Math.abs(normal + targetWidth) < 1e-5, `contact error ${normal + targetWidth}`);
}

test('right-going rows overlap with the upstream tile above the next, independent of storage order', () => {
  const pieces = [stone('a', 1), stone('b', 2), stone('c', 3), stone('last', 4)];
  const before = structuredClone(pieces), poses = restingDominoes(pieces);
  assert.equal(poses.get('last').body.angle, 90);
  for (let i = 0; i < pieces.length - 1; i++) {
    const here = poses.get(pieces[i].id), next = poses.get(pieces[i + 1].id);
    assert.ok(here.body.angle > 70 && here.body.angle < 90);
    assert.ok(here.layer > next.layer);
    contact(here.body, next.body, 1);
  }
  assert.deepEqual(restingDominoes([...pieces].reverse()), new Map([...poses].reverse()));
  assert.deepEqual(pieces, before);
});

test('left-going rows mirror the support and drawing order', () => {
  const pieces = [stone('a', 4, -1), stone('b', 3, -1), stone('last', 2, -1)];
  const poses = restingDominoes(pieces);
  assert.equal(poses.get('last').body.angle, 90);
  for (let i = 0; i < pieces.length - 1; i++) {
    const here = poses.get(pieces[i].id), next = poses.get(pieces[i + 1].id);
    assert.ok(here.layer > next.layer);
    // Coordinates are mirrored horizontally; vertical lift stays zero.
    assert.equal(here.body.lift, 0);
    const a = rad(here.body.angle), b = rad(next.body.angle);
    const normal = (size.length * Math.sin(a) - size.pitch) * Math.cos(b) - size.length * Math.cos(a) * Math.sin(b);
    assert.ok(Math.abs(normal + size.width) < 1e-7);
  }
});

test('a disappearing tile, gap, another floor or opposite chain cannot support a tile', () => {
  for (const target of [stone('b', 3), stone('b', 2, 1, { y: 9 }),
    stone('b', 2, 1, { state: 'vanished' }), stone('b', 2, 1, { state: 'dropping' }), stone('b', 2, -1)]) {
    const pose = restingDominoes([stone('a', 1), target]).get('a').body;
    assert.equal(pose.angle, 90);
    assert.equal(pose.supportedBy, null);
  }
});

test('splitter halves rest independently on their outward branches', () => {
  const pieces = [stone('fork', 3, 1, { type: 'splitter' }), stone('left', 2, -1),
    stone('right', 4), stone('right-end', 5)];
  const poses = restingDominoes(pieces), fork = poses.get('fork');
  assert.equal(fork.left.supportedBy, 'left');
  assert.equal(fork.right.supportedBy, 'right');
  assert.notEqual(fork.left.angle, fork.right.angle);
  assert.ok(fork.layer > poses.get('left').layer && fork.layer > poses.get('right').layer);
  contact(fork.right, poses.get('right').body, 1);
});

test('a previous tile leans on a waiting or currently tipping neighbor while the chain advances', () => {
  for (const state of ['upright', 'waiting', 'falling']) {
    const poses = restingDominoes([stone('a', 1), stone('b', 2, 1, { state })]);
    const a = poses.get('a'), b = poses.get('b');
    assert.ok(a.body.angle > 40 && a.body.angle < 75);
    assert.ok(a.layer > b.layer);
    contact(a.body, b.body, 1);
  }
});

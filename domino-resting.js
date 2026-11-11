// Render geometry only. Match the 32%-wide, 100%-high face on the 40px grid.
// An upstream tile rests on the long edge of the next tile, rather than
// passing through it or lying flat underneath it. Puzzle states stay intact.
export const dominoDimensions = Object.freeze({ pitch: 40, length: 40, width: 12.8, depth: 2.2 });
const radians = degrees => degrees * Math.PI / 180;
const degrees = radians => radians * 180 / Math.PI;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lift = (angle, dir) => dir === 1
  ? dominoDimensions.depth * Math.max(0, Math.sin(radians(angle)) - Math.cos(radians(angle))) : 0;

export function restingDominoes(pieces) {
  const live = pieces.filter(p => !['vanished', 'dropping'].includes(p.state));
  const occupied = new Map(live.map(p => [`${p.x},${p.y}`, p]));
  const cache = new Map();
  const bodyAt = (x, y, self) => live.find(p => p !== self && p.state === 'flat' && p.y === y && p.x + (p.dir || 0) === x);
  function pose(piece, dir) {
    const key = `${piece.id}:${dir}`;
    if (cache.has(key)) return cache.get(key);
    let angle = piece.state === 'falling' ? 43 : ['upright', 'waiting'].includes(piece.state) ? 0 : 90;
    // A tile that toppled against a stair riser stays leaning on the step
    // edge instead of lying flat on either level.
    if (piece.state === 'flat' && Number.isFinite(piece.lean)) angle = piece.lean;
    let depth = 0, supportedBy = null;
    if (piece.state === 'flat' && !Number.isFinite(piece.lean)) {
      const next = occupied.get(`${piece.x + dir},${piece.y}`) || bodyAt(piece.x + dir, piece.y, piece);
      // A tile that arrives after another one has settled leans on it even
      // when the two bodies face each other; the earlier tile stays flat.
      const later = Number.isFinite(piece.finish) && Number.isFinite(next?.finish) && piece.finish > next.finish;
      if (next && ['flat', 'falling', 'waiting', 'upright'].includes(next.state)
          && (next.type === 'splitter' || !next.dir || next.dir === dir || later)) {
        const target = pose(next, dir), beta = radians(target.angle);
        const width = next.type === 'splitter' ? dominoDimensions.width / 2 : dominoDimensions.width;
        // Dot the source tip onto the next tile's upper surface. Re-evaluate
        // the tiny base-height correction for the projected side thickness.
        angle = target.angle;
        for (let i = 0; i < 7; i++) {
          const offset = (dominoDimensions.pitch * Math.cos(beta) - width
            + (lift(angle, dir) - target.lift) * Math.sin(beta)) / dominoDimensions.length;
          angle = clamp(target.angle + degrees(Math.asin(clamp(offset, -1, 1))), 0, 90);
        }
        depth = target.depth + 1;
        supportedBy = next.id;
      }
    }
    const result = { angle, lift: lift(angle, dir), depth, supportedBy };
    cache.set(key, result);
    return result;
  }
  return new Map(pieces.map(piece => {
    if (piece.type === 'splitter') {
      const left = pose(piece, -1), right = pose(piece, 1);
      return [piece.id, { left, right, layer: 10 + Math.max(left.depth, right.depth) }];
    }
    const body = pose(piece, piece.dir === -1 ? -1 : 1);
    return [piece.id, { body, layer: 10 + body.depth }];
  }));
}

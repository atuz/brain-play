export const boardSizes = [3, 4, 5];
export function normalizeMergeSettings(value = {}) {
  return {
    size: boardSizes.includes(Number(value?.size)) ? Number(value.size) : 4,
    mode: value?.mode === 'fibonacci' ? 'fibonacci' : 'classic',
  };
}
export const mergeTarget = (mode, size = 4) => mode === 'fibonacci' ? 2584 : size === 3 ? 512 : 2048;
export const mergeSlot = ({ size, mode }) => {
  const settings = normalizeMergeSettings({ size, mode });
  return `2048:${settings.mode}:${settings.size}`;
};
const fibonacci = [1, 2];
while (Number.isSafeInteger(fibonacci.at(-1) + fibonacci.at(-2))) fibonacci.push(fibonacci.at(-1) + fibonacci.at(-2));
export function tileRank(value, mode = 'classic') {
  return mode === 'fibonacci' ? fibonacci.indexOf(value) : Math.log2(value) - 1;
}
export function mergeValue(a, b, mode = 'classic') {
  if (!a || !b || !Number.isSafeInteger(a + b)) return 0;
  if (mode !== 'fibonacci') return a === b ? a + b : 0;
  if (a === 1 && b === 1) return 2;
  const first = fibonacci.indexOf(a), second = fibonacci.indexOf(b);
  return first >= 0 && second >= 0 && Math.abs(first - second) === 1 ? a + b : 0;
}
export function slideLine(line, mode = 'classic') {
  const values = line.filter(Boolean), out = [];
  let score = 0;
  for (let i = 0; i < values.length; i++) {
    const merged = mergeValue(values[i], values[i + 1], mode);
    if (merged) { out.push(merged); score += merged; i++; }
    else out.push(values[i]);
  }
  while (out.length < line.length) out.push(0);
  return { line: out, score };
}
export function slideBoard(board, direction, size = Math.sqrt(board.length), mode = 'classic') {
  if (!boardSizes.includes(size) || board.length !== size * size) throw Error('Invalid board size');
  if (!['left', 'right', 'up', 'down'].includes(direction)) throw Error('Invalid direction');
  const out = Array(board.length).fill(0), movements = [], merged = [];
  let score = 0;
  for (let row = 0; row < size; row++) {
    const indices = Array.from({ length: size }, (_, col) => direction === 'left' ? row * size + col
      : direction === 'right' ? row * size + size - 1 - col
      : direction === 'up' ? col * size + row : (size - 1 - col) * size + row);
    const sources=indices.filter(i=>board[i]);
    let dest=0;
    for(let k=0;k<sources.length;k++) {
      const from=sources[k],other=sources[k+1],value=mergeValue(board[from],board[other],mode),to=indices[dest++];
      movements.push({from,to});
      if(value){out[to]=value;score+=value;merged.push(to);movements.push({from:other,to});k++;}
      else out[to]=board[from];
    }
  }
  return { board: out, score, moved: out.some((value, i) => value !== board[i]), movements, merged };
}
export function hasMoves(board, size = Math.sqrt(board.length), mode = 'classic') {
  return board.includes(0) || ['left', 'up'].some(direction => slideBoard(board, direction, size, mode).moved);
}
export function spawn(board, rng = Math.random, mode = 'classic') {
  const free = board.map((value, i) => value === 0 ? i : -1).filter(i => i >= 0);
  if (free.length) board[free[Math.floor(rng() * free.length)]] = (rng() < .9 ? 1 : 2) * (mode === 'fibonacci' ? 1 : 2);
  return board;
}
export function createMergeState(size, mode, rng = Math.random) {
  return { board: spawn(spawn(Array(size * size).fill(0), rng, mode), rng, mode), score: 0, won: false, claimed: false, history: [] };
}
export function restoreMergeState(saved, size, mode, rng = Math.random) {
  function valid(snapshot) {
    return snapshot && Array.isArray(snapshot.board) && snapshot.board.length === size * size
      && snapshot.board.every(value => value === 0 || (Number.isSafeInteger(value) && value > 0 && Number.isInteger(tileRank(value, mode)) && tileRank(value, mode) >= 0 && (mode === 'fibonacci' || 2 ** (tileRank(value, mode) + 1) === value)))
      && Number.isFinite(snapshot.score) && snapshot.score >= 0;
  }
  if (!valid(saved)) return createMergeState(size, mode, rng);
  return {
    board: [...saved.board], score: saved.score,
    won: !!saved.won, claimed: !!saved.claimed || !!saved.won,
    history: Array.isArray(saved.history) ? saved.history.filter(valid).slice(-30).map(item => ({ board: [...item.board], score: item.score, won: !!item.won })) : [],
  };
}

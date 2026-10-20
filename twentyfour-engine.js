// Exact fractions keep hands such as 3, 3, 8, 8 playable without rounding.
const operations = ['+', '-', '×', '÷'];
const clone = value => JSON.parse(JSON.stringify(value));

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function fraction(n, d = 1) {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) throw Error('这个结果超出了计算范围。');
  if (d === 0) throw Error('不能除以 0，换一张牌或换个运算吧。');
  const sign = d < 0 ? -1 : 1;
  const divisor = gcd(Math.abs(n), Math.abs(d));
  return { n: sign * n / divisor, d: Math.abs(d) / divisor };
}

export const formatFraction = value => value.d === 1 ? String(value.n) : `${value.n}/${value.d}`;
export const displayOp = op => op === '-' ? '−' : op;
export const is24 = value => value.n === 24 * value.d;

export function calculate(a, b, op) {
  if (op === '+') return fraction(a.n * b.d + b.n * a.d, a.d * b.d);
  if (op === '-') return fraction(a.n * b.d - b.n * a.d, a.d * b.d);
  if (op === '×') return fraction(a.n * b.n, a.d * b.d);
  if (op === '÷') return fraction(a.n * b.d, a.d * b.n);
  throw Error('请选择加、减、乘、除中的一种运算。');
}

const seedCards = numbers => numbers.map((number, id) => ({
  id, ...fraction(number), expr: String(number), mask: 1 << id,
}));

// Return a sequence of legal merges, starting from the currently visible cards.
export function plan24(cards) {
  const failed = new Set();
  function search(items, nextId) {
    if (items.length === 1) return is24(items[0]) ? [] : null;
    const key = items.map(v => `${v.n}/${v.d}`).sort().join('|');
    if (failed.has(key)) return null;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const options = [
          [items[i], items[j], '+'], [items[i], items[j], '×'],
          [items[i], items[j], '-'], [items[j], items[i], '-'],
          [items[i], items[j], '÷'], [items[j], items[i], '÷'],
        ];
        const tried = new Set();
        for (const [a, b, op] of options) {
          if (op === '÷' && b.n === 0) continue;
          const value = calculate(a, b, op);
          const resultKey = `${value.n}/${value.d}`;
          if (tried.has(resultKey)) continue;
          tried.add(resultKey);
          const expression = `(${a.expr}${displayOp(op)}${b.expr})`;
          const merged = { id: nextId, ...value, expr: expression, mask: a.mask | b.mask };
          const rest = items.filter((_, k) => k !== i && k !== j);
          const tail = search([...rest, merged], nextId + 1);
          if (tail !== null) return [{ first: a.id, second: b.id, op, value, expression }, ...tail];
        }
      }
    }
    failed.add(key);
    return null;
  }
  return search(cards, Math.max(...cards.map(v => v.id)) + 1);
}

export function solve24(numbers) {
  const cards = seedCards(numbers);
  const plan = plan24(cards);
  return plan === null ? null : plan.at(-1)?.expression || cards[0].expr;
}

export function generate24(rng = Math.random) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const numbers = Array.from({ length: 4 }, () => 1 + Math.floor(rng() * 10));
    const solution = solve24(numbers);
    if (solution) return { numbers, solution };
  }
  return { numbers: [3, 3, 8, 8], solution: '(8÷(3−(8÷3)))' };
}

export function createRound(numbers) {
  if (!Array.isArray(numbers) || numbers.length !== 4 || numbers.some(n => !Number.isInteger(n) || n < 1 || n > 13)) {
    throw Error('一局需要四张 1—13 的数字牌。');
  }
  return {
    version: 2, numbers: [...numbers], cards: seedCards(numbers), nextId: 4,
    steps: [], history: [], done: false, assisted: false, claimed: false,
  };
}

function validCards(cards) {
  if (!Array.isArray(cards) || cards.length < 1 || cards.length > 4) return false;
  let used = 0;
  const ids = new Set();
  for (const card of cards) {
    if (!Number.isInteger(card.id) || ids.has(card.id) || !Number.isSafeInteger(card.n) || !Number.isSafeInteger(card.d) || card.d < 1 || typeof card.expr !== 'string') return false;
    if (!Number.isInteger(card.mask) || card.mask < 1 || card.mask > 15 || (used & card.mask)) return false;
    ids.add(card.id);
    used |= card.mask;
  }
  return used === 15;
}

export function restoreRound(saved, rng = Math.random) {
  try {
    const base = createRound(saved?.numbers);
    if (saved.version === 2 && validCards(saved.cards) && Number.isInteger(saved.nextId) && saved.nextId >= 4 && saved.nextId <= 7 && Array.isArray(saved.steps) && saved.steps.length === 4 - saved.cards.length && Array.isArray(saved.history) && saved.history.every(h => validCards(h.cards) && Array.isArray(h.steps))) {
      const restored = clone(saved);
      restored.done = restored.cards.length === 1 && is24(restored.cards[0]);
      return restored;
    }
    // Keep the previous version's hand and solve credit, without replaying its text input.
    base.claimed = !!saved.done || !!saved.claimed;
    base.assisted = !!saved.revealed || !!saved.assisted;
    return base;
  } catch {
    return createRound(generate24(rng).numbers);
  }
}

export function mergeRound(round, firstId, secondId, op) {
  if (!operations.includes(op)) throw Error('先选择一个运算符。');
  if (firstId === secondId) throw Error('同一张牌不能使用两次。');
  const a = round.cards.find(card => card.id === firstId);
  const b = round.cards.find(card => card.id === secondId);
  if (!a || !b) throw Error('这张牌已经合并过了，请选择桌上的牌。');
  const value = calculate(a, b, op);
  const expression = `(${a.expr}${displayOp(op)}${b.expr})`;
  const result = { id: round.nextId, ...value, expr: expression, mask: a.mask | b.mask };
  const cards = round.cards.flatMap(card => card.id === secondId ? [] : card.id === firstId ? [result] : [card]);
  const snapshot = clone({ cards: round.cards, nextId: round.nextId, steps: round.steps });
  return {
    ...round, cards, nextId: round.nextId + 1,
    steps: [...round.steps, { a: formatFraction(a), b: formatFraction(b), op, result: formatFraction(value), expression }],
    history: [...round.history, snapshot], done: cards.length === 1 && is24(cards[0]),
  };
}

export function undoRound(round) {
  if (!round.history.length) return round;
  const snapshot = clone(round.history.at(-1));
  return { ...round, ...snapshot, history: round.history.slice(0, -1), done: false };
}

export function resetRound(round) {
  return { ...createRound(round.numbers), assisted: round.assisted, claimed: round.claimed };
}

// Retained for saved expressions and verification; text is never evaluated as JS.
export function parseExpression(text) {
  const input = text.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
  const tokens = input.match(/\d+|[()+\-*/]/g) || [];
  if (tokens.join('') !== input.replace(/\s/g, '')) throw Error('请只使用数字、加减乘除和括号。');
  let pos = 0;
  const used = [];
  function factor() {
    const token = tokens[pos++];
    if (token === '(') {
      const value = sum();
      if (tokens[pos++] !== ')') throw Error('括号没有配对。');
      return value;
    }
    if (!/^\d+$/.test(token || '')) throw Error('算式还没写完整。');
    used.push(Number(token));
    return Number(token);
  }
  function product() {
    let value = factor();
    while (tokens[pos] === '*' || tokens[pos] === '/') {
      const op = tokens[pos++], b = factor();
      if (op === '/' && Math.abs(b) < 1e-12) throw Error('不能除以 0。');
      value = op === '*' ? value * b : value / b;
    }
    return value;
  }
  function sum() {
    let value = product();
    while (tokens[pos] === '+' || tokens[pos] === '-') {
      const op = tokens[pos++], b = product();
      value = op === '+' ? value + b : value - b;
    }
    return value;
  }
  const value = sum();
  if (pos !== tokens.length || !Number.isFinite(value)) throw Error('请检查算式。');
  return { value, used };
}

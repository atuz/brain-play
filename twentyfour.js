import {startGame} from './game-transition.js?v=46';
import {gameRuntime} from './game-runtime.js?v=46';
import {createMotion} from './motion.js?v=46';
import { t } from './i18n.js?v=46';
import { el, button, stat, statusNode, sound, finish } from './shared.js?v=46';
import {
  calculate, createRound, displayOp, formatFraction, generate24,
  mergeRound, plan24, resetRound, restoreRound, undoRound,
} from './twentyfour-engine.js?v=46';
export { parseExpression, solve24, generate24 } from './twentyfour-engine.js?v=46';

export function mount(root, ctx) {
  let round = restoreRound(ctx.load(), ctx.rng);
  let selected = [], operation = null, hintId = null, busy = false, alive = true;
  const animations = new Set(), motion=createMotion();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const layout = root.closest('.game-layout');
  layout?.classList.add('layout-twentyfour');
  root.classList.add('play-twentyfour');

  const solved = stat('独立完成', ctx.read('solved:24', 0));
  const moves = stat('本局合并', '0 / 3');
  const status = statusNode();
  const pile = el('span', { class: 'tf-pile', 'aria-hidden': 'true' });
  const newDeal = button('', () => motion.confirmRestart(round.history.length>0&&!round.done,()=>startNewRound()), 'plain tf-new-deal');
  newDeal.append(pile, el('span', { text: '发新牌' }));
  const table = el('div', { class: 'tf-table', 'aria-label': '24 点牌桌' });
  const goal = el('div', { class: 'tf-goal' }, [
    el('span', { class: 'tf-kicker', text: 'MAKE IT' }),
    el('strong', { text: '24' }),
    el('span', { class: 'tf-goal-note', text: '四张牌，每张用一次' }),
  ]);
  const progress = el('div', { class: 'tf-progress' });
  const stage = el('div', { class: 'tf-stage', 'aria-label': '桌上的数字牌' });
  const equation = el('div', { class: 'tf-equation', 'aria-live': 'off' });
  const operators = el('div', { class: 'tf-operators', 'aria-label': '选择运算' });
  const opButtons = new Map();
  const opNames = { '+': '加', '-': '减', '×': '乘', '÷': '除' };
  for (const op of ['+', '-', '×', '÷']) {
    const node = el('button', {
      type: 'button', class: 'tf-op', 'aria-label': opNames[op], 'aria-pressed': 'false',
      onclick: () => chooseOperation(op),
    }, [el('span', { text: displayOp(op), 'aria-hidden': 'true' }), el('small', { text: opNames[op], 'aria-hidden': 'true' })]);
    opButtons.set(op, node);
    operators.append(node);
  }
  const swap = button('⇄ 交换两张牌的顺序', () => {
    selected.reverse();
    updateSelection();
  }, 'plain tf-swap');
  table.append(goal, progress, stage, equation, operators, swap);

  const undo = button('↶ 撤销', () => {
    if (busy) return;
    round = undoRound(round);
    clearSelection();
    render();
    status.set('已撤销上一步，可以换个思路。');
  }, 'plain');
  const reset = button('↺ 重来', () => {
    if (busy) return;
    motion.confirmRestart(round.history.length>0&&!round.done,()=>startGame(ctx,'restart',async()=>{
      round=resetRound(round);clearSelection();render();await deal();
    }));
  }, 'plain');
  const hint = button('✧ 提示一步', showHint, 'plain');
  const tools = el('div', { class: 'tf-tools' }, [undo, reset, hint]);
  const history = el('details', { class: 'tf-history' });
  const historyTitle = el('summary');
  const historyList = el('ol');
  history.append(historyTitle, historyList);
  const celebration = el('section', { class: 'tf-celebration', 'aria-label': '本局完成', hidden: '' });
  const next = button('再来一局 →', () => startNewRound(), '');
  celebration.append(el('div', { class: 'tf-win-mark', text: '✦', 'aria-hidden': 'true' }),
    el('h2', { text: '漂亮，正好 24！' }), el('p'), next);

  root.append(el('div', { class: 'game-toolbar tf-toolbar' }, [
    el('div', { class: 'stats' }, [solved.node, moves.node]), newDeal,
  ]), table, tools, status.node, celebration, history);

  function clearSelection() {
    selected = [];
    operation = null;
    hintId = null;
  }

  function cardNode(card, index) {
    const red = card.id < 2;
    const suit = card.id < 4 ? ['♥', '♦', '♣', '♠'][card.id] : '✦';
    const value = formatFraction(card);
    const longValue = Math.abs(card.n) >= 10000 ? ' tf-very-long' : Math.abs(card.n) >= 1000 ? ' tf-long' : '';
    const number = card.d === 1
      ? el('span', { class: 'tf-value' + longValue, text: value })
      : el('span', { class: 'tf-value tf-fraction', 'aria-hidden': 'true' }, [
        el('span', { text: card.n }), el('span', { text: card.d }),
      ]);
    const front = el('span', { class: `tf-face tf-front ${red ? 'tf-red' : ''}` }, [
      el('span', { class: 'tf-corner', text: `${value} ${suit}`, 'aria-hidden': 'true' }),
      number,
      el('span', { class: 'tf-card-expression', text: card.id < 4 ? suit : card.expr, 'aria-hidden': 'true' }),
      el('span', { class: 'tf-corner tf-corner-bottom', text: suit, 'aria-hidden': 'true' }),
    ]);
    const back = el('span', { class: 'tf-face tf-back', 'aria-hidden': 'true' }, [
      el('span', { text: '✦' }), el('small', { text: 'BRAIN PLAY' }),
    ]);
    return el('button', {
      type: 'button', class: `tf-card ${card.id >= 4 ? 'tf-combined' : ''}`,
      'data-card-id': card.id, 'data-value': value,
      'aria-label': `第${index + 1}张牌：${value}${card.id >= 4 ? '，来自' + card.expr : ''}`,
      'aria-pressed': 'false', onclick: () => chooseCard(card.id),
    }, [el('span', { class: 'tf-flipper' }, [front, back]), el('span', { class: 'tf-order', 'aria-hidden': 'true' })]);
  }

  function render() {
    stage.replaceChildren(...round.cards.map(cardNode));
    stage.dataset.count = round.cards.length;
    moves.set(`${round.steps.length} / 3`);
    progress.replaceChildren(...[0, 1, 2].map(i => el('span', { class: i < round.steps.length ? 'complete' : '', 'aria-hidden': 'true' })));
    progress.setAttribute('aria-label', t(`已合并 ${round.steps.length} 步，共 3 步`));
    historyTitle.textContent = t(round.steps.length ? `计算过程 · ${round.steps.length} 步` : '计算过程 · 还没开始');
    historyList.replaceChildren(...round.steps.map(step => el('li', {}, [
      el('span', { text: `${step.a} ${displayOp(step.op)} ${step.b}` }),
      el('strong', { text: `= ${step.result}` }),
    ])));
    if (!round.steps.length) historyList.append(el('li', { class: 'tf-empty-step', text: '每次合并的结果会记录在这里。' }));
    table.classList.toggle('tf-won', round.done);
    celebration.hidden = !round.done;
    if (round.done) {
      celebration.querySelector('p').textContent = round.cards[0].expr + ' = 24';
      status.set(round.assisted ? '借助提示完成了这一局，下一局试试自己解出来。' : '四张牌，三次合并，完成！', 'success');
    } else if (round.cards.length === 1) {
      status.set(`最后是 ${formatFraction(round.cards[0])}，还没到 24。撤销一步，再试一种运算。`);
    } else {
      status.set('先点一张牌，再选运算和另一张牌。');
    }
    updateSelection();
    ctx.save(round);
  }

  function updateSelection() {
    for (const node of stage.querySelectorAll('.tf-card')) {
      const id = Number(node.dataset.cardId), order = selected.indexOf(id);
      node.classList.toggle('tf-selected', order >= 0);
      node.classList.toggle('tf-hinted', id === hintId);
      node.querySelector('.tf-order').textContent = order >= 0 ? String(order + 1) : '';
      node.setAttribute('aria-pressed', String(order >= 0));
    }
    for (const [op, node] of opButtons) {
      node.classList.toggle('active', op === operation);
      node.setAttribute('aria-pressed', String(op === operation));
    }
    equation.replaceChildren();
    if (selected.length) {
      const a = round.cards.find(c => c.id === selected[0]);
      const b = round.cards.find(c => c.id === selected[1]);
      equation.append(el('span', { class: 'tf-equation-value', text: formatFraction(a) }),
        el('span', { class: 'tf-equation-op', text: operation ? displayOp(operation) : '?' }),
        el('span', { class: `tf-equation-value ${b ? '' : 'tf-placeholder'}`, text: b ? formatFraction(b) : '另一张牌' }));
      if (b && operation) {
        try { equation.append(el('span', { text: '= ' + formatFraction(calculate(a, b, operation)) })); } catch {}
      }
    } else if (round.steps.length) {
      const last = round.steps.at(-1);
      equation.append(el('span', { text: `${last.a} ${displayOp(last.op)} ${last.b} = ` }), el('strong', { text: last.result }));
    } else equation.append(el('span', { class: 'tf-placeholder', text: '点一张牌，开始你的第一步' }));
    updateButtons();
  }

  function updateButtons() {
    table.dataset.busy = String(busy);
    table.setAttribute('aria-busy', String(busy));
    newDeal.disabled = reset.disabled = busy;
    next.disabled = busy;
    undo.disabled = busy || !round.history.length;
    hint.disabled = busy || round.cards.length < 2 || round.done;
    swap.disabled = busy || selected.length !== 2;
    for (const node of stage.querySelectorAll('.tf-card')) node.disabled = busy || round.cards.length === 1;
    for (const node of opButtons.values()) node.disabled = busy || !selected.length || round.cards.length === 1;
  }

  function chooseCard(id) {
    if (busy || round.cards.length < 2) return;
    hintId = null;
    if (selected.includes(id)) {
      selected = selected.filter(value => value !== id);
      if (!selected.length) operation = null;
    } else if (selected.length < 2) selected.push(id);
    else { selected = [id]; operation = null; }
    updateSelection();
    if (selected.length === 2 && operation) void combine();
    else status.set(selected.length === 2 ? '选一个运算符，把这两张牌合成一张。' : operation ? '再点另一张牌，就会按这个顺序合并。' : '可以选运算，也可以再选一张牌。');
  }

  function chooseOperation(op) {
    if (busy || !selected.length) return;
    operation = op;
    hintId = null;
    updateSelection();
    if (selected.length === 2) void combine();
    else status.set(`${displayOp(op)} 已选好，再点另一张数字牌。`);
  }

  async function animate(node, frames, options) {
    if (reduceMotion.matches || ctx.read('animations', true) === false || !node.animate || !alive) return;
    const animation = node.animate(frames, options);
    const release=gameRuntime.trackAnimation(animation);
    animations.add(animation);
    try { await animation.finished; } catch {} finally { release();animations.delete(animation); if(options.fill!=='forwards')animation.cancel(); }
  }

  async function deal() {
    busy = true;
    updateButtons();
    status.set('正在发牌…');
    const origin = pile.getBoundingClientRect();
    const cards = [...stage.querySelectorAll('.tf-card')];
    await Promise.all(cards.flatMap((card, index) => {
      const rect = card.getBoundingClientRect();
      const dx = origin.left + origin.width / 2 - rect.left - rect.width / 2;
      const dy = origin.top + origin.height / 2 - rect.top - rect.height / 2;
      return [
        animate(card, [
          { transform: `translate(${dx}px, ${dy}px) scale(.32) rotate(-18deg)`, opacity: 0 },
          { transform: 'translate(0, 0) scale(1) rotate(0)', opacity: 1 },
        ], { duration: 430, delay: index * 95, easing: 'cubic-bezier(.18,.75,.28,1)', fill: 'backwards' }),
        animate(card.querySelector('.tf-flipper'), [{ transform: 'rotateY(180deg)' }, { transform: 'rotateY(0)' }],
          { duration: 340, delay: index * 95 + 110, easing: 'ease-out', fill: 'backwards' }),
      ];
    }));
    if (!alive) return;
    busy = false;
    updateButtons();
    status.set('牌发好了。点数字 → 选运算 → 点另一张牌。');
  }

  async function combine() {
    if (busy) return;
    const [first, second] = selected;
    let nextRound;
    try { nextRound = mergeRound(round, first, second, operation); }
    catch (error) { status.set(error.message, 'error'); sound(); return; }
    const creditCompletion = nextRound.done && !nextRound.claimed;
    const oldPositions = new Map([...stage.querySelectorAll('.tf-card')].map(node => [Number(node.dataset.cardId), node.getBoundingClientRect()]));
    const ghosts = [first, second].map(id => {
      const node = stage.querySelector(`[data-card-id="${id}"]`).cloneNode(true);
      node.classList.remove('tf-selected', 'tf-hinted');
      node.classList.add('tf-ghost');
      node.removeAttribute('data-card-id');
      node.removeAttribute('aria-pressed');
      node.setAttribute('aria-hidden', 'true');
      node.tabIndex = -1;
      node.disabled = true;
      node.querySelector('.tf-order').textContent = '';
      return { node, rect: oldPositions.get(id) };
    });
    const resultId = round.nextId;
    busy = true;
    round = nextRound;
    if (round.done && !round.claimed) {
      if (!round.assisted) {
        const count = ctx.read('solved:24', 0) + 1;
        ctx.write('solved:24', count);
        solved.set(count);
      }
      round.claimed = true;
    }
    clearSelection();
    render();
    const result = stage.querySelector(`[data-card-id="${resultId}"]`);
    result.classList.add('tf-result-pending');
    const target = result.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();
    const shifts = [...stage.querySelectorAll('.tf-card')].filter(node => Number(node.dataset.cardId) !== resultId).map(node => {
      const old = oldPositions.get(Number(node.dataset.cardId)), current = node.getBoundingClientRect();
      return animate(node, [{ transform: `translate(${old.left - current.left}px, ${old.top - current.top}px)` }, { transform: 'translate(0, 0)' }],
        { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' });
    });
    const flights = ghosts.map(({ node, rect }, index) => {
      Object.assign(node.style, { left: `${rect.left - tableRect.left}px`, top: `${rect.top - tableRect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
      table.append(node);
      return animate(node, [
        { transform: 'translate(0, 0) rotate(0)', opacity: 1 },
        { transform: `translate(${target.left - rect.left}px, ${target.top - rect.top}px) scale(.75) rotate(${index ? 9 : -9}deg)`, opacity: .25 },
      ], { duration: 310, easing: 'cubic-bezier(.3,0,.5,1)', fill: 'forwards' });
    });
    status.set('两张牌正在合并…');
    await Promise.all([...flights, ...shifts]);
    ghosts.forEach(({node})=>{for(const animation of node.getAnimations())animation.cancel();node.remove();});
    if (!alive) return;
    result.classList.remove('tf-result-pending');
    if (!round.done) sound();
    await animate(result, [{ transform: 'scale(.72)', opacity: .3 }, { transform: 'scale(1.09)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 270, easing: 'ease-out' });
    if (!alive) return;
    busy = false;
    updateButtons();
    if (round.done) {
      if (creditCompletion) finish('twentyfour');
      else sound(true);
      ctx.result?.('won',{moves:round.steps.length,assisted:round.assisted});
      status.set(round.assisted ? '借助提示完成了，下一局试试独立解出来。' : '漂亮！三次合并，正好 24。', 'success');
      celebrate();
      next.focus({ preventScroll: true });
    } else if (round.cards.length === 1) status.set(`最后是 ${formatFraction(round.cards[0])}。点「撤销」换个思路，或重来这副牌。`);
    else {
      status.set(`合成了 ${formatFraction(round.cards.find(card => card.id === resultId))}，还剩 ${round.cards.length} 张牌。`);
      result.focus({ preventScroll: true });
    }
  }

  function celebrate() {
    const colors = ['#e8b95d', '#fff4d2', '#a4c9a6'];
    const confetti = el('div', { class: 'tf-confetti', 'aria-hidden': 'true' });
    for (let i = 0; i < 18; i++) confetti.append(el('i', { style: `--i:${i};--color:${colors[i % 3]};--x:${(i * 47) % 100}%;--r:${i * 51}deg;--delay:${(i % 5) * 35}ms` }));
    table.querySelector('.tf-confetti')?.remove();
    table.append(confetti);
  }

  function showHint() {
    if (busy || round.cards.length < 2) return;
    const plan = plan24(round.cards);
    round.assisted = true;
    ctx.save(round);
    if (!plan?.length) { status.set('当前这一步之后算不到 24 了。撤销一步，再试一条路。'); return; }
    const step = plan[0];
    selected = [step.first];
    operation = step.op;
    hintId = step.second;
    updateSelection();
    const a = round.cards.find(card => card.id === step.first), b = round.cards.find(card => card.id === step.second);
    status.set(`试试 ${formatFraction(a)} ${displayOp(step.op)} ${formatFraction(b)}。再点闪亮的那张牌完成这一步。`);
  }

  async function startNewRound() {
    if (busy) return;
    return startGame(ctx,'new-round',async()=>{
    round = createRound(generate24(ctx.rng).numbers);
    clearSelection();
    table.querySelector('.tf-confetti')?.remove();
    render();
    await deal();
    });
  }

  function keyboard(event) {
    if (document.querySelector('dialog[open]') || event.target.closest('input,textarea,select') || event.ctrlKey || event.metaKey || event.altKey || busy) return;
    if (/^[1-4]$/.test(event.key)) {
      const card = round.cards[Number(event.key) - 1];
      if (card) { event.preventDefault(); chooseCard(card.id); }
    } else if (['+', '-', '*', '/', 'x'].includes(event.key)) {
      event.preventDefault();
      chooseOperation({ '*': '×', x: '×', '/': '÷' }[event.key] || event.key);
    } else if (event.key === 'Escape') { clearSelection(); updateSelection(); }
    else if ((event.key === 'z' || event.key === 'Backspace') && round.history.length) { event.preventDefault(); undo.click(); }
  }
  window.addEventListener('keydown', keyboard);
  render();
  if (round.cards.length === 4) void deal();
  return () => {
    alive = false;motion.dispose();
    for (const animation of animations) animation.cancel();
    window.removeEventListener('keydown', keyboard);
    layout?.classList.remove('layout-twentyfour');
  };
}

import { el, button, stat, statusNode, controls, keyboardAndSwipe, sound, finish } from './shared.js?v=13';
import { normalizeMergeSettings, mergeTarget, mergeSlot, tileRank, slideBoard, hasMoves, spawn, createMergeState, restoreMergeState } from './merge-engine.js?v=13';
import {createMotion,floatScore} from './motion.js?v=13';
export { slideLine, slideBoard, hasMoves, spawn } from './merge-engine.js?v=13';

export function settings(ctx) {
  return {
    value: normalizeMergeSettings(ctx.read('options:2048')),
    fields: [
      { key: 'size', label: '棋盘大小', options: [3, 4, 5].map(size => ({ value: String(size), label: `${size} × ${size}` })) },
      { key: 'mode', label: '玩法', options: [{ value: 'classic', label: '经典 2048' }, { value: 'fibonacci', label: '斐波那契 2584' }] },
    ],
    note: '每种玩法和尺寸分别保存进度与最高分。',
    save: value => ctx.write('options:2048', normalizeMergeSettings(value)),
  };
}
export const title = ctx => normalizeMergeSettings(ctx.read('options:2048')).mode === 'fibonacci' ? '2584' : '2048';
export function help(ctx) {
  const { size, mode } = normalizeMergeSettings(ctx.read('options:2048'));
  return mode === 'fibonacci'
    ? ['合并相邻的斐波那契数，例如 2＋3＝5、3＋5＝8。', '1＋1＝2，其他相同数字不能合并。目标是 2584。', '可以撤销上一步。']
    : [`滑动合并相同数字，目标是 ${mergeTarget(mode, size)}。`, '可以撤销上一步。'];
}
export function summary(ctx){
  const {size,mode}=normalizeMergeSettings(ctx.read('options:2048'));
  return mode==='fibonacci'?'相邻斐波那契数可合并，合出 2584 达标。':`滑动合并相同数字，合出 ${mergeTarget(mode,size)} 达标。`;
}
export function rules(ctx){
  const {size,mode}=normalizeMergeSettings(ctx.read('options:2048')),target=mergeTarget(mode,size);
  return [
    {title:'怎么玩',text:'向上下左右滑动，整盘数字一起移动。有效移动后会出现一个新数字。'},
    {title:'规则与限制',text:mode==='fibonacci'
      ?'按 1、2、3、5、8、13… 数列，只能合并相邻两数，例如 2＋3＝5。1＋1＝2；其他相同数不能合并。每个数字每次滑动仅合并一次。'
      :'两个相同数字相碰会合成它们的和，例如 2＋2＝4。每个数字在一次滑动中只能合并一次。'},
    {title:'怎么算赢',text:`合出 ${target} 即达成目标；达标后可以继续玩。没有合法移动时本局结束，可以撤销或新开一局。`},
  ];
}
export function mount(root, ctx) {
  const motion=createMotion();let busy=false,queued=[];
  const options = normalizeMergeSettings(ctx.read('options:2048'));
  const { size, mode } = options;
  const slot = mergeSlot(options), target = mergeTarget(mode, size);
  const legacy = mode === 'classic' && size === 4;
  const saved = ctx.read(`game:${slot}`) ?? (legacy ? ctx.load() : null);
  let state = restoreMergeState(saved, size, mode, ctx.rng);
  let record = ctx.read(`best:${slot}`, legacy ? ctx.read('best:2048', 0) : 0);
  const score = stat('得分'), best = stat('本机最高', record), status = statusNode();
  const board = el('div', { class: 'board board-2048', 'data-size': size, style: `--board-size:${size}`, 'aria-label': mode === 'fibonacci' ? '2584 棋盘' : '2048 棋盘' });
  const undo = button('撤销', () => {
    if (busy || !state.history.length) return;
    const old = state.history.pop();
    state = { ...state, ...old };
    render();
  });
  const reset = () => { if(!busy)motion.confirmRestart(state.history.length>0,()=>{state=createMergeState(size,mode,ctx.rng);render();}); };
  const restart=button('新一局',reset,'plain');
  root.append(
    el('div', { class: 'game-toolbar' }, [el('div', { class: 'stats' }, [score.node, best.node]), el('div', { class: 'actions' }, [undo, restart])]),
    el('div', { class: 'merge-meta' }, [el('span', { text: `${size} × ${size}` }), el('span', { text: mode === 'fibonacci' ? '斐波那契' : '经典' }), el('span', { text: `目标 ${target}` })]),
    board, controls(move), status.node,
    el('p', { class: 'keyboard-help', text: '滑动棋盘，或使用方向键 / WASD' }),
  );
  async function move(direction) {
    if(busy){if(queued.length<3)queued.push(direction);return;}
    if(!motion.alive)return;
    const next = slideBoard(state.board, direction, size, mode);
    if (!next.moved) {const pending=queued.shift();if(pending)move(pending);return;}
    state.history.push({ board: [...state.board], score: state.score, won: state.won });
    if (state.history.length > 30) state.history.shift();
    state.board = spawn([...next.board], ctx.rng, mode);
    const spawned=state.board.findIndex((v,i)=>v!==next.board[i]);
    state.score += next.score;
    if (!state.won && state.board.some(value => value >= target)) {
      state.won = true;
      if (!state.claimed) { state.claimed = true; finish(slot); }
    }
    sound();busy=true;undo.disabled=true;restart.disabled=true;
    await motion.grid(board,next.movements,render,150,[spawned]);
    if(!motion.alive)return;
    await Promise.all([...next.merged,spawned].filter(i=>i>=0).map(i=>motion.play(board.children[i],[{transform:'scale(.8)'},{transform:'scale(1.12)',offset:.65},{transform:'scale(1)'}],120)));
    if(!motion.alive)return;
    floatScore(score.node,next.score,motion);
    busy=false;undo.disabled=!state.history.length;restart.disabled=false;
    const pending=queued.shift();if(pending)move(pending);
  }
  function render() {
    board.replaceChildren(...state.board.map(value => el('div', {
      class: `tile ${value ? 'merge-r' + Math.min(11, tileRank(value, mode)) : 'empty'}`,
      'data-digits': String(value).length, text: value || '', 'aria-label': value ? String(value) : '空格',
    })));
    score.set(state.score);
    record = Math.max(record, state.score);
    best.set(record);
    ctx.write(`best:${slot}`, record);
    ctx.write(`game:${slot}`, state);
    // Retain the original save slot for existing 4 × 4 classic players.
    if (legacy) { ctx.save(state); ctx.write('best:2048', record); }
    undo.disabled = busy || !state.history.length;
    restart.disabled=busy;
    if (!hasMoves(state.board, size, mode)) status.set('没有可以移动的格子了，试试撤销或新开一局。');
    else if (state.won) status.set(`达到 ${target}！你也可以继续挑战更大的数字。`, 'success');
    else status.set('');
  }
  render();
  const removeInput=keyboardAndSwipe(board,move);
  return()=>{queued=[];removeInput();motion.dispose();};
}

// Short, cancellable motion shared by the small games. Game state is saved first.
import { read, el, button } from './shared.js?v=46';
import {gameRuntime} from './game-runtime.js?v=46';
export const motionEnabled = () => read('animations', true) && !matchMedia('(prefers-reduced-motion: reduce)').matches;
export function createMotion() {
  let alive = true;
  const active = new Set(), dialogs = new Set();
  async function play(node, frames, duration = 180, extra = {}) {
    if (!alive || !motionEnabled() || !node?.animate) return;
    const animation = node.animate(frames, { duration, easing: 'cubic-bezier(.2,.75,.3,1)', fill: 'both', ...extra });
    const release=gameRuntime.trackAnimation(animation);
    active.add(animation);
    try { await animation.finished; } catch {} finally { release();active.delete(animation); animation.cancel(); }
  }
  async function grid(board, moves, commit, duration = 180, concealed = []) {
    if (!alive) return;
    if (!motionEnabled()) { commit(); return; }
    const bounds = board.getBoundingClientRect(), cells = [...board.children];
    for(const cell of cells)for(const animation of cell.getAnimations())animation.cancel();
    const snapshots = moves.map(move => {
      const source = cells[move.from], destination = cells[move.to];
      const a = source.getBoundingClientRect(), b = destination.getBoundingClientRect();
      const ghost = source.cloneNode(true);
      ghost.removeAttribute('id'); ghost.removeAttribute('aria-label'); ghost.setAttribute('aria-hidden', 'true');
      ghost.classList.add('motion-ghost'); ghost.tabIndex = -1;
      Object.assign(ghost.style, { left: `${a.left-bounds.left}px`, top: `${a.top-bounds.top}px`, width: `${a.width}px`, height: `${a.height}px` });
      return { ...move, ghost, dx: b.left-a.left, dy: b.top-a.top };
    });
    commit();
    const current = [...board.children];
    for (const to of [...moves.map(m=>m.to),...concealed].filter(i=>i>=0)) current[to].style.visibility = 'hidden';
    board.append(...snapshots.map(x => x.ghost));
    await Promise.all(snapshots.map(({ghost,dx,dy,via}) => play(ghost,
      via ? [{transform:'translate(0,0)'}, {transform:`translate(0,${dy}px)`,offset:.65}, {transform:`translate(${dx}px,${dy}px)`}]
          : [{transform:'translate(0,0)'},{transform:`translate(${dx}px,${dy}px)`}], duration)));
    for (const {ghost} of snapshots) ghost.remove();
    for (const to of [...moves.map(m=>m.to),...concealed].filter(i=>i>=0)) current[to].style.visibility = '';
  }
  function shake(node) { return play(node, [{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}], 180); }
  function pop(node) { return play(node, [{transform:'scale(.75)',opacity:.5},{transform:'scale(1.12)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}], 200); }
  function confirmRestart(needed, action) {
    if (!needed) { action(); return; }
    if (dialogs.size || !alive) return;
    const modal = el('dialog', {class:'app-dialog restart-dialog','aria-label':'重新开始？'});
    const close = () => modal.close();
    modal.append(el('h2',{text:'重新开始？'}), el('p',{text:'本局进度将重新开始。'}),el('div',{class:'restart-actions'},[
      button('继续玩',close,'plain'), button('重新开始',()=>{close();if(alive)action();},'secondary'),
    ]));
    modal.addEventListener('close',()=>{dialogs.delete(modal);modal.remove();},{once:true});
    dialogs.add(modal); document.body.append(modal); modal.showModal();
  }
  return { get alive(){return alive;}, play, grid, shake, pop, confirmRestart,
    dispose(){alive=false;for(const a of active)a.cancel();active.clear();for(const d of dialogs){d.close();d.remove();}dialogs.clear();},
  };
}
export function floatScore(container, value, motion) {
  if (!value || !motionEnabled()) return;
  const label=el('span',{class:'score-float',text:`+${value}`,'aria-hidden':'true'});
  container.append(label);
  motion.play(label,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-30px)'}],650).then(()=>label.remove());
}

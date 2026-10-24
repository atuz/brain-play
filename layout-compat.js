// Observe sizes only on engines without aspect-ratio; modern browsers do no extra work.
export function layoutFallback(root) {
  if (CSS.supports('aspect-ratio', '1')) return () => {};
  const items = new Set();
  const selector = '.home-game-art,.cell,.tile,.goal-grid span,.classic-board,.mw-stage';
  function resize(node) {
    const width = node.getBoundingClientRect().width;
    if (!width) return;
    const style = getComputedStyle(node);
    const ratio = node.matches('.home-game-art') ? (matchMedia('(max-width:680px)').matches ? 1 : 1.15)
      : node.matches('.classic-board') ? Number(style.getPropertyValue('--columns')) / Number(style.getPropertyValue('--rows'))
      : node.matches('.mw-stage') ? 4 / 5 : 1;
    if (!(ratio > 0)) return;
    const height = `${Math.round(width / ratio * 100) / 100}px`;
    if (node.style.height !== height) node.style.height = height;
  }
  const sizes = new ResizeObserver(entries => entries.forEach(entry => resize(entry.target)));
  function sync() {
    for (const item of items) if (!root.contains(item)) { sizes.unobserve(item); items.delete(item); }
    for (const item of root.querySelectorAll(selector)) {
      if (!items.has(item)) { items.add(item); sizes.observe(item); }
      resize(item);
    }
  }
  // Only grid child replacement, not per-frame canvas/score mutations, needs rescanning.
  const children = new MutationObserver(sync);
  for (const grid of root.querySelectorAll('.board,.nonogram,.goal-grid')) children.observe(grid, { childList: true });
  sync();
  return () => { children.disconnect(); sizes.disconnect(); items.clear(); };
}

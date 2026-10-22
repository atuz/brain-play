// One original vector material for the board, the ant's hands and the legend.
// The front stays 13×60; its projected top/right faces add visible thickness.
let materialID = 0;
export function dominoMaterial({ width = 13, half = false, type } = {}) {
  const id = `dc-piece-light-${++materialID}`, depth = 3, r = half ? 1.7 : 2.3;
  const symbols = {
    normal: [19, 30, 41].map(y => `<circle cx="6.5" cy="${y + .55}" r="1.7" fill="#fff2c5" opacity=".65"/><circle cx="6.5" cy="${y}" r="1.55"/><path d="M5.4 ${y}a1.1 1.1 0 0 1 2.1-.4" fill="none" stroke="#49311d" stroke-width=".65" opacity=".5"/>`).join(''),
    delay: '<path d="M3.5 20h6m-6 20h6M4 21v4l5 10v4m0-18v4L4 35v4M4.5 38l2-4 2 4Z"/>',
    bridge: '<path d="M2.5 29h8M3 25v8m7-8v8m-6-6h5"/>',
    vanish: '<path d="M3 27h7m-7 6h7"/>',
    splitter: '<path d="M2 30h9m-6-4-4 4 4 4m3-8 4 4-4 4"/>',
    trigger: '<path d="M3 25h7m-7 5h7m-7 5h7"/>',
  };
  const marks = half ? '' : Object.entries(symbols).filter(([kind]) => !type || kind === type)
    .map(([kind, shape]) => `<g class="dc-piece-symbol dc-mark-${kind}">${shape}</g>`).join('');
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#ffffff" stop-opacity=".48"/><stop offset=".42" stop-color="#ffffff" stop-opacity=".08"/><stop offset="1" stop-color="#52321f" stop-opacity=".13"/></linearGradient></defs>
    <g class="dc-piece-material" stroke-linejoin="round">
      <path class="dc-piece-side" d="M${width - r} 0 ${width - r + depth} -${depth}Q${width + depth} -${depth} ${width + depth} 0V${60 - depth - r}Q${width + depth} ${60 - depth} ${width} 60V${r}Q${width} 0 ${width - r} 0Z"/>
      <path d="M${width - r} 0 ${width - r + depth} -${depth}Q${width + depth} -${depth} ${width + depth} 0V${60 - depth - r}Q${width + depth} ${60 - depth} ${width} 60V${r}Q${width} 0 ${width - r} 0Z" fill="#513623" opacity=".22" stroke="none"/>
      <path class="dc-piece-cap" d="M${r} 0 ${r + depth} -${depth}H${width - r + depth}Q${width + depth} -${depth} ${width + depth} 0L${width} ${r}Q${width} 0 ${width - r} 0Z"/>
      <path d="M${r} 0 ${r + depth} -${depth}H${width - r + depth}Q${width + depth} -${depth} ${width + depth} 0L${width} ${r}Q${width} 0 ${width - r} 0Z" fill="#fff5d6" opacity=".48" stroke="none"/>
      <rect class="dc-piece-front" width="${width}" height="60" rx="${r}"/>
      <rect width="${width}" height="60" rx="${r}" fill="url(#${id})" stroke="none"/>
      <path d="M1.5 55V4q0-2.5 2.5-2.5h${Math.max(0, width - 8)}" fill="none" stroke="#fff7dc" stroke-width=".9" opacity=".72" stroke-linecap="round"/>
      <path d="M${width - 1.3} 5v50q0 3-2.5 3H${r}" fill="none" stroke="#80582e" stroke-width=".65" opacity=".22" stroke-linecap="round"/>
      ${half ? '' : `<path d="M2.2 30h${width - 4.4}" fill="none" stroke="#fff5d9" stroke-width=".65" opacity=".52"/>`}
      ${marks}
    </g>`;
}

export function dominoArtwork(options) {
  return `<svg class="dc-piece-art" viewBox="0 0 ${options?.width || 13} 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${dominoMaterial(options)}</svg>`;
}

import type { Grid } from '../types';

function measureCell(el: HTMLPreElement): { width: number; height: number } {
  const probe = document.createElement('span');
  probe.textContent = 'M';
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;';
  el.appendChild(probe);
  const r = probe.getBoundingClientRect();
  el.removeChild(probe);
  return { width: r.width || 8, height: r.height || 16 };
}

export function createGrid(el: HTMLPreElement): Grid {
  const listeners = new Set<() => void>();

  const grid: Grid = {
    el,
    cols: 1,
    rows: 1,
    cellWidth: 8,
    cellHeight: 16,
    onResize(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    dispose() {
      ro.disconnect();
      listeners.clear();
    },
  };

  const recompute = () => {
    const { width, height } = measureCell(el);
    grid.cellWidth = width;
    grid.cellHeight = height;
    const r = el.getBoundingClientRect();
    grid.cols = Math.max(1, Math.floor(r.width / width));
    grid.rows = Math.max(1, Math.floor(r.height / height));
  };

  recompute();

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      recompute();
      listeners.forEach((fn) => fn());
    });
  }

  const ro = new ResizeObserver(() => {
    recompute();
    listeners.forEach((fn) => fn());
  });
  ro.observe(el);

  return grid;
}

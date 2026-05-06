import type { Frame, Grid, Scene, SceneParams } from '../types';

function escapeChar(ch: string): string {
  if (ch === '<') return '&lt;';
  if (ch === '>') return '&gt;';
  if (ch === '&') return '&amp;';
  return ch;
}

function renderHTML(frame: Frame): string {
  const { cells, colors, cols, rows } = frame;
  const lines: string[] = new Array(rows);
  for (let r = 0; r < rows; r++) {
    let line = '';
    let curColor = 0;
    let buf = '';
    const base = r * cols;
    for (let c = 0; c < cols; c++) {
      const i = base + c;
      const col = colors[i];
      if (col !== curColor) {
        if (buf.length > 0) {
          line += curColor === 0 ? buf : `<span class="c${curColor}">${buf}</span>`;
        }
        buf = '';
        curColor = col;
      }
      buf += escapeChar(cells[i]);
    }
    if (buf.length > 0) {
      line += curColor === 0 ? buf : `<span class="c${curColor}">${buf}</span>`;
    }
    lines[r] = line;
  }
  return lines.join('\n');
}

export function startLoop(
  grid: Grid,
  scene: Scene,
  opts?: Partial<SceneParams>,
): () => void {
  const params: SceneParams = {
    wind: 0,
    intensity: 0.5,
    ...opts,
  };

  let raf = 0;
  const start = performance.now();

  const frame: Frame = {
    cells: new Array(grid.cols * grid.rows).fill(' '),
    colors: new Uint8Array(grid.cols * grid.rows),
    cols: grid.cols,
    rows: grid.rows,
  };

  const resync = () => {
    const total = grid.cols * grid.rows;
    frame.cells = new Array(total).fill(' ');
    frame.colors = new Uint8Array(total);
    frame.cols = grid.cols;
    frame.rows = grid.rows;
  };
  const offResize = grid.onResize(resync);

  const tick = (now: number) => {
    const t = (now - start) / 1000;

    const total = grid.cols * grid.rows;
    if (frame.cells.length !== total) {
      frame.cells = new Array(total).fill(' ');
      frame.colors = new Uint8Array(total);
    } else {
      frame.cells.fill(' ');
      frame.colors.fill(0);
    }
    frame.cols = grid.cols;
    frame.rows = grid.rows;

    scene.draw(frame, t, params);
    grid.el.innerHTML = renderHTML(frame);

    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    offResize();
  };
}

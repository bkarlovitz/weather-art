import type { Grid, Scene, SceneFactory } from './types';

interface Flake {
  x: number;
  y: number;
  vy: number;
  drift: number;
  phase: number;
  driftFreq: number;
  depth: number;
  char: string;
  colorBin: number;
}

const charForDepth = (d: number): string => (d < 0.35 ? '.' : '*');

const colorForDepth = (d: number): number => {
  if (d < 0.35) return 1;
  if (d < 0.78) return 0;
  return 2;
};

function spawnFlake(grid: Grid, fromTop: boolean): Flake {
  const depth = Math.random();
  return {
    x: Math.random() * grid.cols,
    y: fromTop ? -Math.random() * 4 : Math.random() * grid.rows,
    vy: 4 + depth * 12,
    drift: 0.4 + depth * 1.2,
    phase: Math.random() * Math.PI * 2,
    driftFreq: 0.5 + Math.random() * 1.2,
    depth,
    char: charForDepth(depth),
    colorBin: colorForDepth(depth),
  };
}

export const createSnowScene: SceneFactory = (grid: Grid): Scene => {
  const flakes: Flake[] = [];
  let ground = new Uint8Array(grid.cols);
  let lastT = -1;

  const offResize = grid.onResize(() => {
    ground = new Uint8Array(grid.cols);
  });

  return {
    draw(frame, t, params) {
      const { cells, colors, cols, rows } = frame;
      const dt = lastT < 0 ? 1 / 60 : Math.min(0.1, t - lastT);
      lastT = t;

      const target = Math.floor(cols * (0.2 + 0.5 * params.intensity));
      while (flakes.length < target) flakes.push(spawnFlake(grid, true));
      while (flakes.length > target) flakes.pop();

      const windPx = params.wind * 8;
      const groundCap = Math.max(2, Math.min(6, Math.floor(rows * 0.12)));
      const accumChance = 0.04 + params.intensity * 0.05;

      for (const f of flakes) {
        const driftVx = Math.sin(t * f.driftFreq + f.phase) * f.drift;
        f.x += (driftVx + windPx * (0.4 + f.depth * 0.6)) * dt;
        f.y += f.vy * dt;

        if (f.x < 0) f.x += cols;
        else if (f.x >= cols) f.x -= cols;

        const ix = Math.floor(f.x);
        const colHeight = ix >= 0 && ix < cols ? (ground[ix] ?? 0) : 0;
        const groundLevel = rows - colHeight;

        if (f.y >= groundLevel) {
          if (ix >= 0 && ix < cols && colHeight < groundCap && Math.random() < accumChance) {
            ground[ix] = colHeight + 1;
          }
          const fresh = spawnFlake(grid, true);
          f.x = fresh.x;
          f.y = fresh.y;
          f.vy = fresh.vy;
          f.drift = fresh.drift;
          f.phase = fresh.phase;
          f.driftFreq = fresh.driftFreq;
          f.depth = fresh.depth;
          f.char = fresh.char;
          f.colorBin = fresh.colorBin;
          continue;
        }

        const iy = Math.floor(f.y);
        if (ix < 0 || ix >= cols || iy < 0 || iy >= rows) continue;
        const idx = iy * cols + ix;
        cells[idx] = f.char;
        colors[idx] = f.colorBin;
      }

      for (let x = 0; x < cols; x++) {
        const h = ground[x] ?? 0;
        if (h === 0) continue;
        for (let dy = 0; dy < h; dy++) {
          const y = rows - 1 - dy;
          if (y < 0) break;
          const idx = y * cols + x;
          cells[idx] = dy === h - 1 ? '*' : '#';
          colors[idx] = 2;
        }
      }
    },
    dispose() {
      offResize();
    },
  };
};

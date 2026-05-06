import type { Grid, Scene, SceneFactory } from './types';

interface Drop {
  x: number;
  y: number;
  vy: number;
  vx: number;
  char: string;
  depth: number;
  colorBin: number;
}

interface Splash {
  x: number;
  age: number;
  ttl: number;
}

const DEPTH_BINS = 6;
const SPLASH_COLOR = 7;

const charForSpeed = (speed: number): string =>
  speed > 1.4 ? '|' : speed > 0.9 ? "'" : '.';

const colorForDepth = (depth: number): number =>
  1 + Math.min(DEPTH_BINS - 1, Math.floor(depth * DEPTH_BINS));

const SPLASH_FRAMES: { dx: number; ch: string }[][] = [
  [{ dx: 0, ch: '*' }],
  [
    { dx: -1, ch: '.' },
    { dx: 1, ch: '.' },
  ],
];

function spawnDrop(grid: Grid, fromTop: boolean): Drop {
  const depth = Math.random();
  const speed = 0.6 + depth * 1.4;
  return {
    x: Math.random() * grid.cols,
    y: fromTop ? -Math.random() * grid.rows : Math.random() * grid.rows,
    vy: speed * 35,
    vx: 0,
    char: charForSpeed(speed),
    depth,
    colorBin: colorForDepth(depth),
  };
}

export const createRainScene: SceneFactory = (grid: Grid): Scene => {
  const drops: Drop[] = [];
  const splashes: Splash[] = [];
  let lastT = -1;

  return {
    draw(frame, t, params) {
      const { cells, colors, cols, rows } = frame;
      const dt = lastT < 0 ? 1 / 60 : Math.min(0.1, t - lastT);
      lastT = t;

      const target = Math.floor(cols * (0.15 + 0.35 * params.intensity));
      while (drops.length < target) drops.push(spawnDrop(grid, true));
      while (drops.length > target) drops.pop();

      const windPx = params.wind * 18;
      const groundRow = rows - 1;

      for (const d of drops) {
        d.x += (d.vx + windPx * (0.5 + d.depth)) * dt;
        d.y += d.vy * dt;

        if (d.y >= rows || d.x < 0 || d.x >= cols) {
          if (d.y >= rows && d.x >= 0 && d.x < cols && d.depth > 0.5) {
            splashes.push({ x: d.x, age: 0, ttl: 0.16 });
          }
          const fresh = spawnDrop(grid, true);
          d.x = fresh.x;
          d.y = fresh.y;
          d.vy = fresh.vy;
          d.char = fresh.char;
          d.depth = fresh.depth;
          d.colorBin = fresh.colorBin;
        }

        const ix = Math.floor(d.x);
        const iy = Math.floor(d.y);
        if (ix < 0 || ix >= cols || iy < 0 || iy >= rows) continue;

        let ch = d.char;
        if (ch === '|') {
          if (params.wind > 0.4) ch = '\\';
          else if (params.wind < -0.4) ch = '/';
        }
        const idx = iy * cols + ix;
        cells[idx] = ch;
        colors[idx] = d.colorBin;
      }

      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.age += dt;
        if (s.age >= s.ttl) {
          splashes.splice(i, 1);
          continue;
        }
        const phase = s.age / s.ttl;
        const frameIdx = Math.min(
          SPLASH_FRAMES.length - 1,
          Math.floor(phase * SPLASH_FRAMES.length),
        );
        const baseX = Math.floor(s.x);
        const base = groundRow * cols;
        for (const cell of SPLASH_FRAMES[frameIdx]) {
          const x = baseX + cell.dx;
          if (x < 0 || x >= cols) continue;
          const idx = base + x;
          cells[idx] = cell.ch;
          colors[idx] = SPLASH_COLOR;
        }
      }
    },
  };
};

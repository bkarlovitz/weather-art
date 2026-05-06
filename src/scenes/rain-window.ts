import type { Grid, Scene, SceneFactory } from './types';

interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

interface Droplet {
  x: number;
  y: number;
  size: number;
  vy: number;
}

interface MistDot {
  x: number;
  y: number;
  ch: string;
}

const glyphForSize = (s: number): string => {
  if (s < 0.18) return '.';
  if (s < 0.3) return ',';
  if (s < 0.45) return ':';
  if (s < 0.62) return 'o';
  if (s < 0.85) return 'O';
  return 'Q';
};

const colorForSize = (s: number): number => {
  if (s < 0.28) return 1;
  if (s < 0.72) return 0;
  return 2;
};

function spawnDroplet(grid: Grid, fresh: boolean): Droplet {
  return {
    x: Math.random() * grid.cols,
    y: fresh ? -Math.random() * 4 : Math.random() * grid.rows,
    size: Math.pow(Math.random(), 2) * 0.55,
    vy: 0,
  };
}

function generateMist(grid: Grid, density: number): MistDot[] {
  const total = grid.cols * grid.rows;
  const count = Math.floor(total * density);
  const dots: MistDot[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    const ch = r < 0.7 ? '.' : r < 0.92 ? "'" : ',';
    dots.push({
      x: Math.floor(Math.random() * grid.cols),
      y: Math.floor(Math.random() * grid.rows),
      ch,
    });
  }
  return dots;
}

export const createRainWindowScene: SceneFactory = (grid: Grid): Scene => {
  const droplets: Droplet[] = [];
  const trails: TrailPoint[] = [];
  let mist: MistDot[] = generateMist(grid, 0.22);
  let lastT = -1;

  const offResize = grid.onResize(() => {
    mist = generateMist(grid, 0.22);
  });

  return {
    draw(frame, t, params) {
      const { cells, colors, cols, rows } = frame;
      const dt = lastT < 0 ? 1 / 60 : Math.min(0.1, t - lastT);
      lastT = t;

      const target = Math.floor(cols * rows * 0.06 * (0.4 + params.intensity * 1.3));
      while (droplets.length < target) droplets.push(spawnDroplet(grid, false));
      while (droplets.length > target) droplets.pop();

      const growChance = 0.003 + params.intensity * 0.008;
      const slideChance = 0.0015 + params.intensity * 0.004;

      for (let i = trails.length - 1; i >= 0; i--) {
        trails[i]!.life -= 0.4 * dt;
        if (trails[i]!.life <= 0) trails.splice(i, 1);
      }

      for (const d of droplets) {
        if (d.vy === 0) {
          if (Math.random() < growChance) {
            d.size = Math.min(1, d.size + 0.05);
          }
          if (d.size > 0.55 && Math.random() < slideChance) {
            d.vy = 1 + Math.random() * 2 + d.size * 4;
          }
        } else {
          d.vy += 1.2 * dt;
          const ix = Math.floor(d.x);
          const oldY = Math.floor(d.y);
          d.y += d.vy * dt;
          const newY = Math.floor(d.y);
          for (let yy = oldY; yy < newY; yy++) {
            if (yy >= 0 && yy < rows && ix >= 0 && ix < cols) {
              trails.push({ x: ix, y: yy, life: 1 });
            }
          }
          d.size = Math.max(0.2, d.size - 0.2 * dt);
        }

        if (d.y >= rows) {
          const fresh = spawnDroplet(grid, true);
          d.x = fresh.x;
          d.y = fresh.y;
          d.size = fresh.size;
          d.vy = 0;
        }
      }

      for (const m of mist) {
        if (m.x < 0 || m.x >= cols || m.y < 0 || m.y >= rows) continue;
        const idx = m.y * cols + m.x;
        cells[idx] = m.ch;
        colors[idx] = 1;
      }

      for (const tp of trails) {
        if (tp.x < 0 || tp.x >= cols || tp.y < 0 || tp.y >= rows) continue;
        let ch: string;
        if (tp.life > 0.75) ch = ':';
        else if (tp.life > 0.45) ch = ';';
        else if (tp.life > 0.2) ch = '.';
        else continue;
        const idx = tp.y * cols + tp.x;
        cells[idx] = ch;
        colors[idx] = tp.life > 0.55 ? 0 : 1;
      }

      for (const d of droplets) {
        const ix = Math.floor(d.x);
        const iy = Math.floor(d.y);
        if (ix < 0 || ix >= cols || iy < 0 || iy >= rows) continue;
        const idx = iy * cols + ix;
        cells[idx] = glyphForSize(d.size);
        colors[idx] = colorForSize(d.size);
      }
    },
    dispose() {
      offResize();
    },
  };
};

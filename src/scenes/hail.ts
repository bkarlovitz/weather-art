import type { Grid, Scene, SceneFactory } from './types';

interface Stone {
  x: number;
  y: number;
  vy: number;
  size: number;
  bouncesLeft: number;
}

const STONE_GLYPHS = ['o', 'O', '@'];
const STONE_COLORS = [1, 0, 2];
const GRAVITY = 60;

function spawnStone(cols: number): Stone {
  const r = Math.random();
  const size = r < 0.6 ? 0 : r < 0.85 ? 1 : 2;
  return {
    x: Math.random() * cols,
    y: -Math.random() * 5,
    vy: 20 + size * 5,
    size,
    bouncesLeft: 2,
  };
}

export const createHailScene: SceneFactory = (_grid: Grid): Scene => {
  const stones: Stone[] = [];
  let lastT = -1;

  return {
    draw(frame, t, params) {
      const { cells, colors, cols, rows } = frame;
      const dt = lastT < 0 ? 1 / 60 : Math.min(0.1, t - lastT);
      lastT = t;

      const target = Math.floor(cols * (0.1 + 0.25 * params.intensity));
      while (stones.length < target) stones.push(spawnStone(cols));
      while (stones.length > target) stones.pop();

      for (const s of stones) {
        s.vy += GRAVITY * dt;
        s.y += s.vy * dt;

        if (s.y >= rows - 0.5 && s.vy > 0) {
          if (s.bouncesLeft > 0) {
            s.vy = -s.vy * 0.45;
            s.y = rows - 0.5;
            s.bouncesLeft -= 1;
          } else {
            const fresh = spawnStone(cols);
            s.x = fresh.x;
            s.y = fresh.y;
            s.vy = fresh.vy;
            s.size = fresh.size;
            s.bouncesLeft = fresh.bouncesLeft;
            continue;
          }
        }

        const ix = Math.floor(s.x);
        const iy = Math.floor(s.y);
        if (ix < 0 || ix >= cols || iy < 0 || iy >= rows) continue;

        const idx = iy * cols + ix;
        cells[idx] = STONE_GLYPHS[s.size]!;
        colors[idx] = STONE_COLORS[s.size]!;
      }
    },
  };
};

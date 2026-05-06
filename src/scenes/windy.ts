import type { Grid, Scene, SceneFactory } from './types';
import { createCloudsScene } from './clouds';

interface Debris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ch: string;
}

const DEBRIS_GLYPHS = ['~', ',', "'", '.', '`'];

function spawnDebris(cols: number, rows: number, wind: number): Debris {
  const fromLeft = wind >= 0;
  const speed = (35 + Math.random() * 35) * Math.max(0.3, Math.abs(wind));
  return {
    x: fromLeft ? -2 - Math.random() * 5 : cols + 2 + Math.random() * 5,
    y: Math.random() * rows * 0.85,
    vx: fromLeft ? speed : -speed,
    vy: (Math.random() - 0.5) * 6,
    ch: DEBRIS_GLYPHS[Math.floor(Math.random() * DEBRIS_GLYPHS.length)]!,
  };
}

export const createWindyScene: SceneFactory = (grid: Grid): Scene => {
  const cloudsScene = createCloudsScene(grid);
  const debris: Debris[] = [];
  let lastT = -1;

  return {
    draw(frame, t, params) {
      const { cells, colors, cols, rows } = frame;
      const dt = lastT < 0 ? 1 / 60 : Math.min(0.1, t - lastT);
      lastT = t;

      const cloudParams = {
        intensity: 0.35 + 0.4 * params.intensity,
        wind: params.wind * 1.5,
      };
      cloudsScene.draw(frame, t, cloudParams);

      const target = Math.floor(8 + params.intensity * 30);
      while (debris.length < target) debris.push(spawnDebris(cols, rows, params.wind));
      while (debris.length > target) debris.pop();

      for (const d of debris) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;

        if (d.x < -3 || d.x > cols + 3 || d.y < -3 || d.y > rows + 3) {
          const fresh = spawnDebris(cols, rows, params.wind);
          d.x = fresh.x;
          d.y = fresh.y;
          d.vx = fresh.vx;
          d.vy = fresh.vy;
          d.ch = fresh.ch;
          continue;
        }

        const ix = Math.floor(d.x);
        const iy = Math.floor(d.y);
        if (ix < 0 || ix >= cols || iy < 0 || iy >= rows) continue;

        const idx = iy * cols + ix;
        cells[idx] = d.ch;
        colors[idx] = 3;
      }
    },
    dispose() {
      cloudsScene.dispose?.();
    },
  };
};

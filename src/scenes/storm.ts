import type { Grid, Scene, SceneFactory } from './types';
import { createCloudsScene } from './clouds';
import { createRainScene } from './rain';
import { ValueNoise } from './core/noise';

interface BoltPoint {
  x: number;
  y: number;
}

interface Bolt {
  points: BoltPoint[];
  life: number;
}

function generateBolt(cols: number, rows: number): Bolt {
  const points: BoltPoint[] = [];
  let x = cols * 0.15 + Math.random() * cols * 0.7;
  let y = 0;

  while (y < rows) {
    points.push({ x: Math.floor(x), y });
    y += 1;
    x += (Math.random() - 0.5) * 2.5;
    if (Math.random() < 0.12) {
      x += (Math.random() - 0.5) * 5;
    }
  }
  return { points, life: 0.13 };
}

export const createStormScene: SceneFactory = (grid: Grid): Scene => {
  const cloudsScene = createCloudsScene(grid);
  const rainScene = createRainScene(grid);
  const windNoise = new ValueNoise(13);

  const bolts: Bolt[] = [];
  let nextBoltAt = 1.2;
  let lastT = -1;

  return {
    draw(frame, t, params) {
      const { cells, colors, cols, rows } = frame;
      const dt = lastT < 0 ? 1 / 60 : Math.min(0.1, t - lastT);
      lastT = t;

      const stormIntensity = Math.min(1, 0.7 + params.intensity * 0.35);
      const gustyWind = (windNoise.noise2(t * 0.18, 0) - 0.5) * 1.6 + params.wind;
      const stormParams = {
        intensity: stormIntensity,
        wind: gustyWind,
      };

      cloudsScene.draw(frame, t, stormParams);
      rainScene.draw(frame, t, stormParams);

      if (t >= nextBoltAt) {
        bolts.push(generateBolt(cols, rows));
        const cooldown = 2.5 + Math.random() * 4 - stormIntensity * 2;
        nextBoltAt = t + Math.max(0.4, cooldown);
      }

      for (let i = bolts.length - 1; i >= 0; i--) {
        bolts[i]!.life -= dt;
        if (bolts[i]!.life <= 0) bolts.splice(i, 1);
      }

      for (const bolt of bolts) {
        for (let i = 0; i < bolt.points.length; i++) {
          const p = bolt.points[i]!;
          if (p.x < 0 || p.x >= cols || p.y < 0 || p.y >= rows) continue;

          let ch = '|';
          if (i < bolt.points.length - 1) {
            const next = bolt.points[i + 1]!;
            const dx = next.x - p.x;
            if (dx > 0) ch = '\\';
            else if (dx < 0) ch = '/';
          }

          const idx = p.y * cols + p.x;
          cells[idx] = ch;
          colors[idx] = 3;
        }
      }
    },
    dispose() {
      cloudsScene.dispose?.();
      rainScene.dispose?.();
    },
  };
};

import type { Grid, Scene, SceneFactory } from './types';
import { ValueNoise } from './core/noise';

export const createCloudsScene: SceneFactory = (_grid: Grid): Scene => {
  const noiseA = new ValueNoise(42);
  const noiseB = new ValueNoise(99);

  return {
    draw(frame, t, params) {
      const { cells, colors, cols, rows } = frame;

      const threshold = 0.62 - 0.32 * params.intensity;

      const direction = params.wind >= 0 ? 1 : -1;
      const speedA = (0.04 + Math.abs(params.wind) * 0.08) * direction;
      const speedB = (0.1 + Math.abs(params.wind) * 0.15) * direction;

      const scaleA = 0.07;
      const scaleB = 0.18;

      for (let y = 0; y < rows; y++) {
        const yA = y * scaleA * 2;
        const yB = y * scaleB * 2;
        for (let x = 0; x < cols; x++) {
          const vA = noiseA.noise2(x * scaleA + t * speedA, yA);
          const vB = noiseB.noise2(x * scaleB + t * speedB, yB);
          const v = vA * 0.7 + vB * 0.3;

          if (v < threshold) continue;

          const d = (v - threshold) / (1 - threshold);

          let ch: string;
          let col: number;
          if (d < 0.2) {
            ch = '.';
            col = 1;
          } else if (d < 0.4) {
            ch = ':';
            col = 1;
          } else if (d < 0.6) {
            ch = '*';
            col = 0;
          } else if (d < 0.8) {
            ch = '#';
            col = 0;
          } else {
            ch = '@';
            col = 2;
          }

          const idx = y * cols + x;
          cells[idx] = ch;
          colors[idx] = col;
        }
      }
    },
  };
};

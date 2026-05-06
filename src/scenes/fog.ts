import type { Grid, Scene, SceneFactory } from './types';
import { ValueNoise } from './core/noise';

export const createFogScene: SceneFactory = (_grid: Grid): Scene => {
  const noiseA = new ValueNoise(11);
  const noiseB = new ValueNoise(23);

  return {
    draw(frame, t, params) {
      const { cells, colors, cols, rows } = frame;

      const direction = params.wind >= 0 ? 1 : -1;
      const speedA = (0.025 + Math.abs(params.wind) * 0.04) * direction;
      const speedB = (0.06 + Math.abs(params.wind) * 0.06) * direction;

      const scaleA = 0.04;
      const scaleB = 0.12;

      const baseDensity = 0.4 + 0.35 * params.intensity;

      for (let y = 0; y < rows; y++) {
        const yA = y * scaleA * 2;
        const yB = y * scaleB * 2;
        const vBias = 0.7 + 0.5 * (y / rows);
        for (let x = 0; x < cols; x++) {
          const vA = noiseA.noise2(x * scaleA + t * speedA, yA);
          const vB = noiseB.noise2(x * scaleB + t * speedB, yB);
          const v = (vA * 0.65 + vB * 0.35) * baseDensity * vBias * 1.5;

          if (v < 0.18) continue;

          let ch: string;
          let col: number;
          if (v < 0.3) {
            ch = '.';
            col = 1;
          } else if (v < 0.45) {
            ch = ':';
            col = 1;
          } else if (v < 0.6) {
            ch = '+';
            col = 0;
          } else if (v < 0.8) {
            ch = '*';
            col = 0;
          } else {
            ch = '#';
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

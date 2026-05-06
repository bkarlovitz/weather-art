import type { Grid, Scene, SceneFactory } from './types';
import { ValueNoise } from './core/noise';

export const createClearDayScene: SceneFactory = (_grid: Grid): Scene => {
  const noise = new ValueNoise(33);

  return {
    draw(frame, t, params) {
      const { cells, colors, cols, rows } = frame;

      const direction = params.wind >= 0 ? 1 : -1;
      const speed = (0.025 + Math.abs(params.wind) * 0.04) * direction;
      const scale = 0.05;

      const threshold = 0.7 - 0.1 * params.intensity;
      const maxY = Math.floor(rows * 0.65);

      for (let y = 0; y < maxY; y++) {
        const yN = y * scale * 1.6;
        for (let x = 0; x < cols; x++) {
          const v = noise.noise2(x * scale + t * speed, yN);
          if (v < threshold) continue;

          const d = (v - threshold) / (1 - threshold);

          let ch: string;
          let col: number;
          if (d < 0.3) {
            ch = '.';
            col = 1;
          } else if (d < 0.6) {
            ch = '-';
            col = 1;
          } else if (d < 0.85) {
            ch = '~';
            col = 0;
          } else {
            ch = '=';
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

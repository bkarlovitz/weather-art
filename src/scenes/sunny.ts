import type { Grid, Scene, SceneFactory } from './types';
import { ValueNoise } from './core/noise';

interface GrassBlade {
  x: number;
  y: number;
  ch: string;
  color: number;
}

function generateGrass(grid: Grid, startRow: number): GrassBlade[] {
  const blades: GrassBlade[] = [];
  const span = grid.rows - startRow;
  if (span <= 0) return blades;

  for (let y = startRow; y < grid.rows; y++) {
    const t = (y - startRow) / span;
    const density = 0.06 + t * 0.55;
    for (let x = 0; x < grid.cols; x++) {
      if (Math.random() >= density) continue;
      const r = Math.random();
      const ch = r < 0.5 ? ',' : r < 0.85 ? "'" : '.';
      const color = Math.random() < 0.25 ? 1 : 0;
      blades.push({ x, y, ch, color });
    }
  }
  return blades;
}

export const createSunnyScene: SceneFactory = (grid: Grid): Scene => {
  const hillNoise = new ValueNoise(7);

  const computeLayout = () => {
    const horizonRow = Math.floor(grid.rows * 0.6);
    const hillAmp = Math.max(2, Math.floor(grid.rows * 0.07));
    const grassStartRow = horizonRow + 1;
    return { horizonRow, hillAmp, grassStartRow };
  };

  let layout = computeLayout();
  let grass = generateGrass(grid, layout.grassStartRow);

  const offResize = grid.onResize(() => {
    layout = computeLayout();
    grass = generateGrass(grid, layout.grassStartRow);
  });

  return {
    draw(frame, _t, _params) {
      const { cells, colors, cols, rows } = frame;
      const { horizonRow, hillAmp } = layout;

      const hillScale = 0.045;
      for (let x = 0; x < cols; x++) {
        const n = hillNoise.noise2(x * hillScale, 0);
        const offset = Math.floor(n * hillAmp);
        const crestY = horizonRow - offset;
        if (crestY < 0 || crestY >= rows) continue;

        const nL = hillNoise.noise2((x - 1) * hillScale, 0);
        const nR = hillNoise.noise2((x + 1) * hillScale, 0);
        const slope = nR - nL;

        let crestCh: string;
        if (slope > 0.02) crestCh = '/';
        else if (slope < -0.02) crestCh = '\\';
        else crestCh = '_';

        const idx = crestY * cols + x;
        cells[idx] = crestCh;
        colors[idx] = 1;
      }

      for (const blade of grass) {
        if (blade.x < cols && blade.y < rows) {
          const idx = blade.y * cols + blade.x;
          cells[idx] = blade.ch;
          colors[idx] = blade.color;
        }
      }

      const sx = cols * 0.72;
      const sy = rows * 0.2;
      const sunR = Math.max(3, Math.min(cols, rows * 2) * 0.05);

      const yMin = Math.max(0, Math.floor(sy - sunR / 2 - 1));
      const yMax = Math.min(rows, Math.ceil(sy + sunR / 2 + 1));
      const xMin = Math.max(0, Math.floor(sx - sunR - 1));
      const xMax = Math.min(cols, Math.ceil(sx + sunR + 1));

      for (let y = yMin; y < yMax; y++) {
        const dy = (y - sy) * 2;
        for (let x = xMin; x < xMax; x++) {
          const dx = x - sx;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d >= sunR) continue;
          const idx = y * cols + x;
          cells[idx] = d < sunR * 0.65 ? '@' : 'O';
          colors[idx] = 2;
        }
      }
    },
    dispose() {
      offResize();
    },
  };
};

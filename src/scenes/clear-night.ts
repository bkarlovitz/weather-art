import type { Grid, Scene, SceneFactory } from './types';

interface Star {
  x: number;
  y: number;
  phase: number;
  freq: number;
  baseBrightness: number;
}

interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: TrailPoint[];
  alive: boolean;
}

function generateStars(grid: Grid): Star[] {
  const total = grid.cols * grid.rows;
  const count = Math.floor(total * 0.022);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.floor(Math.random() * grid.cols),
      y: Math.floor(Math.random() * grid.rows * 0.85),
      phase: Math.random() * Math.PI * 2,
      freq: 0.4 + Math.random() * 1.4,
      baseBrightness: 0.4 + Math.random() * 0.6,
    });
  }
  return stars;
}

export const createClearNightScene: SceneFactory = (grid: Grid): Scene => {
  let stars = generateStars(grid);
  const shootingStars: ShootingStar[] = [];
  let nextShootingAt = 4 + Math.random() * 8;
  let lastT = -1;

  const offResize = grid.onResize(() => {
    stars = generateStars(grid);
  });

  return {
    draw(frame, t, _params) {
      const { cells, colors, cols, rows } = frame;
      const dt = lastT < 0 ? 1 / 60 : Math.min(0.1, t - lastT);
      lastT = t;

      for (const star of stars) {
        if (star.x < 0 || star.x >= cols || star.y < 0 || star.y >= rows) continue;
        const brightness =
          star.baseBrightness * (0.5 + 0.5 * Math.sin(t * star.freq + star.phase));

        let ch: string;
        let col: number;
        if (brightness < 0.2) continue;
        else if (brightness < 0.45) {
          ch = '.';
          col = 1;
        } else if (brightness < 0.7) {
          ch = '*';
          col = 0;
        } else {
          ch = '+';
          col = 2;
        }

        const idx = star.y * cols + star.x;
        cells[idx] = ch;
        colors[idx] = col;
      }

      const mx = cols * 0.78;
      const my = rows * 0.22;
      const moonR = Math.max(3, Math.min(cols, rows * 2) * 0.06);
      const shadowOffset = -moonR * 0.4;

      const yStart = Math.max(0, Math.floor(my - moonR / 2 - 1));
      const yEnd = Math.min(rows, Math.ceil(my + moonR / 2 + 1));
      const xStart = Math.max(0, Math.floor(mx - moonR - 1));
      const xEnd = Math.min(cols, Math.ceil(mx + moonR + 1));

      for (let y = yStart; y < yEnd; y++) {
        const dy = (y - my) * 2;
        for (let x = xStart; x < xEnd; x++) {
          const dx = x - mx;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d >= moonR) continue;
          const sdx = dx - shadowOffset;
          const sd = Math.sqrt(sdx * sdx + dy * dy);
          if (sd < moonR * 0.95) continue;
          const idx = y * cols + x;
          cells[idx] = '@';
          colors[idx] = 2;
        }
      }

      if (t >= nextShootingAt) {
        shootingStars.push({
          x: Math.random() * cols * 0.4,
          y: Math.random() * rows * 0.4,
          vx: 50 + Math.random() * 40,
          vy: 25 + Math.random() * 20,
          trail: [],
          alive: true,
        });
        nextShootingAt = t + 8 + Math.random() * 18;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i]!;
        if (ss.alive) {
          const ix = Math.floor(ss.x);
          const iy = Math.floor(ss.y);
          ss.trail.push({ x: ix, y: iy, life: 1 });
          ss.x += ss.vx * dt;
          ss.y += ss.vy * dt;
          if (ss.x > cols + 5 || ss.y > rows + 5) ss.alive = false;
        }

        for (const tp of ss.trail) tp.life -= 1.8 * dt;
        while (ss.trail.length > 0 && ss.trail[0]!.life <= 0) ss.trail.shift();

        for (const tp of ss.trail) {
          if (tp.x < 0 || tp.x >= cols || tp.y < 0 || tp.y >= rows) continue;
          const idx = tp.y * cols + tp.x;
          let ch: string;
          if (tp.life > 0.7) ch = '*';
          else if (tp.life > 0.35) ch = '+';
          else ch = '.';
          cells[idx] = ch;
          colors[idx] = tp.life > 0.5 ? 2 : 1;
        }

        if (!ss.alive && ss.trail.length === 0) {
          shootingStars.splice(i, 1);
        }
      }
    },
    dispose() {
      offResize();
    },
  };
};

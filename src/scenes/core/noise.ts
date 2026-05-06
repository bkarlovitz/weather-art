export class ValueNoise {
  private perm: Uint8Array;

  constructor(seed = 1) {
    const base = new Uint8Array(256);
    for (let i = 0; i < 256; i++) base[i] = i;

    let s = (seed * 1664525 + 1013904223) >>> 0;
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      const tmp = base[i]!;
      base[i] = base[j]!;
      base[j] = tmp;
    }

    const p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) p[i] = base[i & 255]!;
    this.perm = p;
  }

  noise2(x: number, y: number): number {
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const xi = fx & 255;
    const yi = fy & 255;
    const xf = x - fx;
    const yf = y - fy;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    const p = this.perm;
    const a = p[p[xi]! + yi]! / 255;
    const b = p[p[xi + 1]! + yi]! / 255;
    const c = p[p[xi]! + yi + 1]! / 255;
    const d = p[p[xi + 1]! + yi + 1]! / 255;

    const ab = a + (b - a) * u;
    const cd = c + (d - c) * u;
    return ab + (cd - ab) * v;
  }
}

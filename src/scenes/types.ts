export interface Grid {
  el: HTMLPreElement;
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  onResize(cb: () => void): () => void;
  dispose(): void;
}

export interface SceneParams {
  wind: number;
  intensity: number;
}

export interface Frame {
  cells: string[];
  colors: Uint8Array;
  cols: number;
  rows: number;
}

export interface Scene {
  draw(frame: Frame, t: number, params: SceneParams): void;
  dispose?(): void;
}

export type SceneFactory = (grid: Grid) => Scene;

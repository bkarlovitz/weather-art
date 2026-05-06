import { scenes } from '../index';
import type { SceneName } from '../index';
import type { SceneParams } from '../types';
import { createGrid } from './grid';
import { startLoop } from './loop';

export function mountScene(
  el: HTMLPreElement,
  name: SceneName,
  opts?: Partial<SceneParams>,
): () => void {
  const grid = createGrid(el);
  const scene = scenes[name](grid);
  const stop = startLoop(grid, scene, opts);
  return () => {
    stop();
    scene.dispose?.();
    grid.dispose();
  };
}

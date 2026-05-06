import type { SceneFactory } from './types';
import { createClearDayScene } from './clear-day';
import { createClearNightScene } from './clear-night';
import { createCloudsScene } from './clouds';
import { createFogScene } from './fog';
import { createHailScene } from './hail';
import { createRainScene } from './rain';
import { createRainWindowScene } from './rain-window';
import { createSnowScene } from './snow';
import { createStormScene } from './storm';
import { createSunnyScene } from './sunny';
import { createWindyScene } from './windy';

export const scenes = {
  rain: createRainScene,
  'rain-window': createRainWindowScene,
  snow: createSnowScene,
  clouds: createCloudsScene,
  sunny: createSunnyScene,
  storm: createStormScene,
  fog: createFogScene,
  'clear-night': createClearNightScene,
  'clear-day': createClearDayScene,
  windy: createWindyScene,
  hail: createHailScene,
} satisfies Record<string, SceneFactory>;

export type SceneName = keyof typeof scenes;

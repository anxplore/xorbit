import type { GameMode, SpeedLevel, GameConfig } from '../types/game.types';
import { SPEED_CONFIGS, EASY_MODE_SPEEDS, ADVANCED_MODE_SPEEDS } from './speeds';
import { EASY_MODE_KEYMAP, ADVANCED_MODE_KEYMAP } from './keymaps';

export function buildGameConfig(mode: GameMode, speed: SpeedLevel): GameConfig {
  const speedCfg = SPEED_CONFIGS[speed];
  const modeCfg = mode === 'EASY'
    ? EASY_MODE_SPEEDS[speed]
    : ADVANCED_MODE_SPEEDS[speed];

  return {
    mode,
    speed,
    keymap: mode === 'EASY' ? EASY_MODE_KEYMAP : ADVANCED_MODE_KEYMAP,
    hitWindow: modeCfg.hitWindow_ms / 1000,
    maxLives: modeCfg.maxLives,
    bitPeriod: speedCfg.bitPeriod_ms / 1000,
    trlLabel: speedCfg.trlLabel,
  };
}

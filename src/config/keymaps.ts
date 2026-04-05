import type { EasyKeymap, AdvancedKeymap } from '../types/game.types';

export const EASY_MODE_KEYMAP: EasyKeymap = {
  TOGGLE: ['Space'],
} as const;

export const ADVANCED_MODE_KEYMAP: AdvancedKeymap = {
  SET_HIGH: ['ArrowUp', 'KeyW'],
  SET_LOW: ['ArrowDown', 'KeyS'],
} as const;

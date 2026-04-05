import { describe, it, expect } from 'vitest';
import { buildGameConfig } from '../gameConfig';
import type { GameMode, SpeedLevel, EasyKeymap, AdvancedKeymap } from '../../types/game.types';

const MODES: GameMode[] = ['EASY', 'ADVANCED'];
const SPEEDS: SpeedLevel[] = ['SPEED_1', 'SPEED_2', 'SPEED_3'];

describe('buildGameConfig', () => {
  describe.each(MODES)('%s mode', (mode) => {
    it.each(SPEEDS)('produces complete config for %s', (speed) => {
      const config = buildGameConfig(mode, speed);

      expect(config.mode).toBe(mode);
      expect(config.speed).toBe(speed);
      expect(config.hitWindow).toBeGreaterThan(0);
      expect(config.maxLives).toBeGreaterThanOrEqual(3);
      expect(config.bitPeriod).toBeGreaterThan(0);
      expect(config.trlLabel).toBeTruthy();
      expect(config.keymap).toBeDefined();
    });
  });

  it('Easy Speed 3 hitWindow = 0.1s', () => {
    const config = buildGameConfig('EASY', 'SPEED_3');
    expect(config.hitWindow).toBe(0.1);
  });

  it('Advanced Speed 3 hitWindow = 0.08s', () => {
    const config = buildGameConfig('ADVANCED', 'SPEED_3');
    expect(config.hitWindow).toBe(0.08);
  });

  it('Easy mode uses TOGGLE keymap', () => {
    const config = buildGameConfig('EASY', 'SPEED_1');
    const keymap = config.keymap as EasyKeymap;
    expect(keymap.TOGGLE).toContain('Space');
  });

  it('Advanced mode uses SET_HIGH / SET_LOW keymap', () => {
    const config = buildGameConfig('ADVANCED', 'SPEED_1');
    const keymap = config.keymap as AdvancedKeymap;
    expect(keymap.SET_HIGH).toContain('ArrowUp');
    expect(keymap.SET_LOW).toContain('ArrowDown');
  });

  it('bitPeriod comes from SPEED_CONFIGS (seconds)', () => {
    const s1 = buildGameConfig('EASY', 'SPEED_1');
    expect(s1.bitPeriod).toBe(0.8);

    const s3 = buildGameConfig('ADVANCED', 'SPEED_3');
    expect(s3.bitPeriod).toBe(0.5);
  });

  it('hitWindow narrows as speed increases for both modes', () => {
    for (const mode of MODES) {
      const hw1 = buildGameConfig(mode, 'SPEED_1').hitWindow;
      const hw2 = buildGameConfig(mode, 'SPEED_2').hitWindow;
      const hw3 = buildGameConfig(mode, 'SPEED_3').hitWindow;
      expect(hw1).toBeGreaterThan(hw2);
      expect(hw2).toBeGreaterThan(hw3);
    }
  });
});

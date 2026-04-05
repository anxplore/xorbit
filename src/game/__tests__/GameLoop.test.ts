import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameLoop } from '../GameLoop';
import { buildGameConfig } from '../../config/gameConfig';
import type { GameConfig } from '../../types/game.types';

function createLoop(mode: 'EASY' | 'ADVANCED' = 'EASY', speed: 'SPEED_1' | 'SPEED_2' | 'SPEED_3' = 'SPEED_1'): { loop: GameLoop; config: GameConfig } {
  const config = buildGameConfig(mode, speed);
  const loop = new GameLoop(config);
  return { loop, config };
}

describe('GameLoop', () => {
  describe('initialization', () => {
    it('creates initial state with correct lives', () => {
      const { loop, config } = createLoop('EASY', 'SPEED_1');
      const state = loop.getState();
      expect(state.lives).toBe(config.maxLives);
      expect(state.maxLives).toBe(config.maxLives);
      expect(state.running).toBe(false);
      expect(state.finished).toBe(false);
    });

    it('generates data sequence of correct length', () => {
      const { loop } = createLoop();
      const state = loop.getState();
      expect(state.dataSequence.length).toBe(64);
      expect(state.dataSequence.every((d) => d === 0 || d === 1)).toBe(true);
    });

    it('builds cues from data sequence (length = beats - 1)', () => {
      const { loop } = createLoop();
      const state = loop.getState();
      expect(state.cues.length).toBe(63);
    });

    it('every cue is either TOGGLE_REQUIRED or HOLD_REQUIRED', () => {
      const { loop } = createLoop();
      const state = loop.getState();
      for (const cue of state.cues) {
        expect(['TOGGLE_REQUIRED', 'HOLD_REQUIRED']).toContain(cue.type);
      }
    });

    it('cue types follow DS encoding rule', () => {
      const { loop } = createLoop();
      const state = loop.getState();
      const seq = state.dataSequence;

      for (const cue of state.cues) {
        const i = cue.index;
        const dataToggled = seq[i] !== seq[i - 1];
        if (dataToggled) {
          expect(cue.type).toBe('HOLD_REQUIRED');
        } else {
          expect(cue.type).toBe('TOGGLE_REQUIRED');
        }
      }
    });
  });

  describe('input handling', () => {
    it('records correct TOGGLE for Easy mode', () => {
      const { loop, config } = createLoop('EASY');
      const state = loop.getState();

      // Find first TOGGLE_REQUIRED cue
      const toggleCue = state.cues.find((c) => c.type === 'TOGGLE_REQUIRED');
      if (!toggleCue) return;

      // Manually set running state
      (state as any).running = true;
      (state as any).currentTime = toggleCue.idealTime;

      loop.handleInput({ type: 'TOGGLE_STROBE', timestamp: performance.now() });

      expect(toggleCue.consumed).toBe(true);
      expect(toggleCue.result).toBeDefined();
    });

    it('marks WRONG_ACTION when pressing during HOLD_REQUIRED', () => {
      const { loop, config } = createLoop('EASY');
      const state = loop.getState();

      // Find a HOLD cue that has no neighboring TOGGLE cue within the hit window
      const hw = config.hitWindow;
      const holdCue = state.cues.find((c) => {
        if (c.type !== 'HOLD_REQUIRED') return false;
        const hasNearbyToggle = state.cues.some(
          (other) =>
            other.type === 'TOGGLE_REQUIRED' &&
            !other.consumed &&
            Math.abs(other.idealTime - c.idealTime) <= hw,
        );
        return !hasNearbyToggle;
      });
      if (!holdCue) return;

      (state as any).running = true;
      (state as any).currentTime = holdCue.idealTime;

      loop.handleInput({ type: 'TOGGLE_STROBE', timestamp: performance.now() });

      expect(holdCue.consumed).toBe(true);
      expect(holdCue.result).toBe('WRONG_ACTION');
    });
  });

  describe('Advanced mode direction check', () => {
    it('WRONG_ACTION when pressing wrong direction', () => {
      const { loop } = createLoop('ADVANCED');
      const state = loop.getState();

      const toggleCue = state.cues.find((c) => c.type === 'TOGGLE_REQUIRED');
      if (!toggleCue) return;

      (state as any).running = true;
      (state as any).currentTime = toggleCue.idealTime;

      const wrongDir = toggleCue.expectedStrobeLevel === 1 ? 'SET_STROBE_LOW' : 'SET_STROBE_HIGH';
      loop.handleInput({ type: wrongDir, timestamp: performance.now() });

      expect(toggleCue.consumed).toBe(true);
      expect(toggleCue.result).toBe('WRONG_ACTION');
    });
  });

  describe('collector integration', () => {
    it('collector is accessible and starts empty', () => {
      const { loop } = createLoop();
      const collector = loop.getCollector();
      expect(collector.getRecords()).toHaveLength(0);
      expect(collector.getSummary().totalOpportunities).toBe(0);
    });
  });

  describe('config for all 6 combinations', () => {
    const modes = ['EASY', 'ADVANCED'] as const;
    const speeds = ['SPEED_1', 'SPEED_2', 'SPEED_3'] as const;

    for (const mode of modes) {
      for (const speed of speeds) {
        it(`${mode} ${speed} initializes without error`, () => {
          const { loop } = createLoop(mode, speed);
          const state = loop.getState();
          expect(state.cues.length).toBeGreaterThan(0);
          expect(state.lives).toBeGreaterThan(0);
        });
      }
    }
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputHandler } from '../InputHandler';
import { buildGameConfig } from '../../config/gameConfig';
import type { InputEvent } from '../../types/game.types';

function fireKeyDown(code: string, repeat = false) {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, repeat, bubbles: true }));
}

function fireKeyUp(code: string) {
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
}

describe('InputHandler', () => {
  let events: InputEvent[];
  let handler: InputHandler;

  beforeEach(() => {
    events = [];
  });

  afterEach(() => {
    handler?.stop();
  });

  describe('Easy Mode', () => {
    beforeEach(() => {
      const config = buildGameConfig('EASY', 'SPEED_1');
      handler = new InputHandler(config, (e) => events.push(e));
      handler.start();
    });

    it('emits TOGGLE_STROBE on Space keydown', () => {
      fireKeyDown('Space');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('TOGGLE_STROBE');
      expect(events[0].timestamp).toBeGreaterThan(0);
    });

    it('does not emit on repeat keydown', () => {
      fireKeyDown('Space');
      fireKeyDown('Space', true);
      fireKeyDown('Space', true);
      expect(events).toHaveLength(1);
    });

    it('emits again after keyup + keydown', () => {
      fireKeyDown('Space');
      fireKeyUp('Space');
      fireKeyDown('Space');
      expect(events).toHaveLength(2);
    });

    it('ignores non-mapped keys', () => {
      fireKeyDown('ArrowUp');
      fireKeyDown('KeyA');
      expect(events).toHaveLength(0);
    });

    it('10 rapid presses produce exactly 10 events', () => {
      for (let i = 0; i < 10; i++) {
        fireKeyDown('Space');
        fireKeyUp('Space');
      }
      expect(events).toHaveLength(10);
      expect(events.every((e) => e.type === 'TOGGLE_STROBE')).toBe(true);
    });
  });

  describe('Advanced Mode', () => {
    beforeEach(() => {
      const config = buildGameConfig('ADVANCED', 'SPEED_1');
      handler = new InputHandler(config, (e) => events.push(e));
      handler.start();
    });

    it('emits SET_STROBE_HIGH on ArrowUp', () => {
      fireKeyDown('ArrowUp');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('SET_STROBE_HIGH');
    });

    it('emits SET_STROBE_LOW on ArrowDown', () => {
      fireKeyDown('ArrowDown');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('SET_STROBE_LOW');
    });

    it('supports alternate keys (KeyW / KeyS)', () => {
      fireKeyDown('KeyW');
      fireKeyDown('KeyS');
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('SET_STROBE_HIGH');
      expect(events[1].type).toBe('SET_STROBE_LOW');
    });

    it('ignores Space in advanced mode', () => {
      fireKeyDown('Space');
      expect(events).toHaveLength(0);
    });
  });

  describe('Lifecycle', () => {
    it('stop() removes all listeners (no memory leak)', () => {
      const config = buildGameConfig('EASY', 'SPEED_1');
      handler = new InputHandler(config, (e) => events.push(e));
      handler.start();
      handler.stop();

      fireKeyDown('Space');
      expect(events).toHaveLength(0);
    });

    it('updateConfig switches keymap correctly', () => {
      const easyConfig = buildGameConfig('EASY', 'SPEED_1');
      handler = new InputHandler(easyConfig, (e) => events.push(e));
      handler.start();

      fireKeyDown('Space');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('TOGGLE_STROBE');
      fireKeyUp('Space');

      const advancedConfig = buildGameConfig('ADVANCED', 'SPEED_1');
      handler.updateConfig(advancedConfig);

      fireKeyDown('Space');
      expect(events).toHaveLength(1);

      fireKeyDown('ArrowUp');
      expect(events).toHaveLength(2);
      expect(events[1].type).toBe('SET_STROBE_HIGH');
    });

    it('double start() is idempotent', () => {
      const config = buildGameConfig('EASY', 'SPEED_1');
      handler = new InputHandler(config, (e) => events.push(e));
      handler.start();
      handler.start();

      fireKeyDown('Space');
      expect(events).toHaveLength(1);
    });
  });
});

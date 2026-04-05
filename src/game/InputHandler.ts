import type { GameConfig, InputEvent, EasyKeymap, AdvancedKeymap } from '../types/game.types';

type InputCallback = (event: InputEvent) => void;

export class InputHandler {
  private config: GameConfig;
  private callback: InputCallback;
  private pressedKeys = new Set<string>();
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundTouchStart: ((e: TouchEvent) => void) | null = null;
  private canvas: HTMLElement | null = null;
  private active = false;

  constructor(config: GameConfig, callback: InputCallback) {
    this.config = config;
    this.callback = callback;
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
  }

  start(canvas?: HTMLElement): void {
    if (this.active) return;
    this.active = true;
    this.pressedKeys.clear();

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    if (canvas && this.config.mode === 'EASY') {
      this.canvas = canvas;
      this.boundTouchStart = this.handleTouchStart.bind(this);
      canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    }
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    this.pressedKeys.clear();

    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);

    if (this.canvas && this.boundTouchStart) {
      this.canvas.removeEventListener('touchstart', this.boundTouchStart);
      this.canvas = null;
      this.boundTouchStart = null;
    }
  }

  updateConfig(config: GameConfig): void {
    const wasActive = this.active;
    if (wasActive) this.stop();
    this.config = config;
    if (wasActive) this.start(this.canvas ?? undefined);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.active) return;
    if (e.repeat) return;
    if (this.pressedKeys.has(e.code)) return;

    this.pressedKeys.add(e.code);
    const timestamp = performance.now();

    if (this.config.mode === 'EASY') {
      const keymap = this.config.keymap as EasyKeymap;
      if (keymap.TOGGLE.includes(e.code)) {
        e.preventDefault();
        this.callback({ type: 'TOGGLE_STROBE', timestamp });
      }
    } else {
      const keymap = this.config.keymap as AdvancedKeymap;
      if (keymap.SET_HIGH.includes(e.code)) {
        e.preventDefault();
        this.callback({ type: 'SET_STROBE_HIGH', timestamp });
      } else if (keymap.SET_LOW.includes(e.code)) {
        e.preventDefault();
        this.callback({ type: 'SET_STROBE_LOW', timestamp });
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.pressedKeys.delete(e.code);
  }

  private handleTouchStart(e: TouchEvent): void {
    if (!this.active) return;
    e.preventDefault();
    const timestamp = performance.now();
    this.callback({ type: 'TOGGLE_STROBE', timestamp });
  }
}

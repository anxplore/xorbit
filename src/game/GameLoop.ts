import type { GameConfig, CueType, InputEvent, StrobeLevel } from '../types/game.types';
import { HitCollector } from './HitCollector';

export interface Cue {
  index: number;
  type: CueType;
  idealTime: number;
  dataLevel: number;
  expectedStrobeLevel: number;
  consumed: boolean;
  result?: 'PERFECT' | 'GOOD' | 'MARGINAL' | 'LINK_WARNING' | 'MISS' | 'WRONG_ACTION';
}

export interface GameState {
  running: boolean;
  paused: boolean;
  currentTime: number;
  lives: number;
  maxLives: number;
  strobeLevel: number;
  dataSequence: number[];
  cues: Cue[];
  currentCueIndex: number;
  consecutiveMisses: number;
  invincibleUntil: number;
  totalBeats: number;
  finished: boolean;
  hitFeedback: { grade: string; time: number } | null;
}

export type GameEventType =
  | 'cue_hit'
  | 'cue_miss'
  | 'wrong_action'
  | 'life_lost'
  | 'game_over'
  | 'game_complete'
  | 'state_update';

export type GameEventCallback = (type: GameEventType, data?: unknown) => void;

const TOTAL_BEATS = 64;
const MISS_WINDOW_S = 0.15;
const CONSECUTIVE_MISS_THRESHOLD = 3;
const INVINCIBILITY_DURATION_S = 1.0;

export class GameLoop {
  private config: GameConfig;
  private collector: HitCollector;
  private state: GameState;
  private rafId: number | null = null;
  private startTimestamp: number | null = null;
  private listener: GameEventCallback | null = null;

  constructor(config: GameConfig) {
    this.config = config;
    this.collector = new HitCollector();

    const dataSequence = this.generateDataSequence(TOTAL_BEATS);
    const cues = this.buildCues(dataSequence);

    this.state = {
      running: false,
      paused: false,
      currentTime: 0,
      lives: config.maxLives,
      maxLives: config.maxLives,
      strobeLevel: 0,
      dataSequence,
      cues,
      currentCueIndex: 0,
      consecutiveMisses: 0,
      invincibleUntil: 0,
      totalBeats: TOTAL_BEATS,
      finished: false,
      hitFeedback: null,
    };
  }

  onEvent(callback: GameEventCallback): void {
    this.listener = callback;
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  getCollector(): HitCollector {
    return this.collector;
  }

  getConfig(): GameConfig {
    return this.config;
  }

  start(): void {
    if (this.state.running) return;
    this.state.running = true;
    this.state.finished = false;
    this.startTimestamp = null;
    this.tick(performance.now());
  }

  pause(): void {
    this.state.paused = true;
  }

  resume(): void {
    this.state.paused = false;
    this.startTimestamp = null;
    this.tick(performance.now());
  }

  stop(): void {
    this.state.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  handleInput(event: InputEvent): void {
    if (!this.state.running || this.state.paused || this.state.finished) return;

    const currentTime = this.state.currentTime;
    const cue = this.findActiveCue(currentTime);

    if (!cue) {
      // Input outside any cue window — check if it's a HOLD_REQUIRED cue's window
      const holdCue = this.findHoldCueInWindow(currentTime);
      if (holdCue && !holdCue.consumed) {
        holdCue.consumed = true;
        holdCue.result = 'WRONG_ACTION';
        const delta = currentTime - holdCue.idealTime;
        this.collector.recordHit(holdCue.idealTime, currentTime, 'HOLD', false);
        this.applyWrongAction();
      }
      return;
    }

    if (cue.consumed) return;

    if (cue.type === 'HOLD_REQUIRED') {
      cue.consumed = true;
      cue.result = 'WRONG_ACTION';
      this.collector.recordHit(cue.idealTime, currentTime, 'HOLD', false);
      this.applyWrongAction();
      return;
    }

    // TOGGLE_REQUIRED — check timing and direction
    if (this.config.mode === 'ADVANCED') {
      const expectedLevel: StrobeLevel = cue.expectedStrobeLevel === 1 ? 'HIGH' : 'LOW';
      if (
        (event.type === 'SET_STROBE_HIGH' && expectedLevel === 'LOW') ||
        (event.type === 'SET_STROBE_LOW' && expectedLevel === 'HIGH')
      ) {
        cue.consumed = true;
        cue.result = 'WRONG_ACTION';
        this.collector.recordHit(cue.idealTime, currentTime, 'TOGGLE', false);
        this.applyWrongAction();
        return;
      }
    }

    const delta = Math.abs(currentTime - cue.idealTime);
    const bp = this.config.bitPeriod;
    const normalized = delta / bp;

    let grade: 'PERFECT' | 'GOOD' | 'MARGINAL' | 'LINK_WARNING';
    if (normalized <= 0.05) grade = 'PERFECT';
    else if (normalized <= 0.15) grade = 'GOOD';
    else if (normalized <= 0.25) grade = 'MARGINAL';
    else grade = 'LINK_WARNING';

    cue.consumed = true;
    cue.result = grade;

    this.state.strobeLevel = cue.expectedStrobeLevel;
    this.state.consecutiveMisses = 0;
    this.state.hitFeedback = { grade, time: currentTime };

    const isCorrect = grade !== 'LINK_WARNING';
    this.collector.recordHit(cue.idealTime, currentTime, 'TOGGLE', isCorrect);
    this.emit('cue_hit', { grade, cueIndex: cue.index });
  }

  private tick(timestamp: number): void {
    if (!this.state.running || this.state.finished) return;
    if (this.state.paused) return;

    if (this.startTimestamp === null) {
      this.startTimestamp = timestamp;
    }

    this.state.currentTime = (timestamp - this.startTimestamp) / 1000;

    this.checkMisses();
    this.checkCompletion();

    this.emit('state_update');

    if (this.state.running && !this.state.finished) {
      this.rafId = requestAnimationFrame((t) => this.tick(t));
    }
  }

  private checkMisses(): void {
    const time = this.state.currentTime;

    for (const cue of this.state.cues) {
      if (cue.consumed) continue;
      if (time <= cue.idealTime + MISS_WINDOW_S) continue;

      cue.consumed = true;

      if (cue.type === 'HOLD_REQUIRED') {
        // Player correctly held — auto-resolve as PERFECT
        cue.result = 'PERFECT';
        this.collector.recordHit(cue.idealTime, cue.idealTime, 'HOLD', true);
        this.state.consecutiveMisses = 0;
        continue;
      }

      // TOGGLE_REQUIRED but player didn't press
      cue.result = 'MISS';
      this.collector.recordMiss(cue.idealTime);
      this.state.consecutiveMisses++;
      this.emit('cue_miss', { cueIndex: cue.index });

      if (this.state.consecutiveMisses >= CONSECUTIVE_MISS_THRESHOLD) {
        this.state.consecutiveMisses = 0;
        this.applyLifeLoss();
      }
    }
  }

  private checkCompletion(): void {
    const allConsumed = this.state.cues.every((c) => c.consumed);
    const lastCue = this.state.cues[this.state.cues.length - 1];
    const pastEnd = lastCue && this.state.currentTime > lastCue.idealTime + MISS_WINDOW_S + 0.5;

    if (allConsumed || pastEnd) {
      this.state.finished = true;
      this.state.running = false;
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.emit('game_complete');
    }
  }

  private applyWrongAction(): void {
    this.state.consecutiveMisses = 0;
    this.state.hitFeedback = { grade: 'WRONG_ACTION', time: this.state.currentTime };
    this.emit('wrong_action');
    this.applyLifeLoss();
  }

  private applyLifeLoss(): void {
    if (this.state.currentTime < this.state.invincibleUntil) return;

    this.state.lives--;
    this.state.invincibleUntil = this.state.currentTime + INVINCIBILITY_DURATION_S;
    this.emit('life_lost', { lives: this.state.lives });

    if (this.state.lives <= 0) {
      this.state.finished = true;
      this.state.running = false;
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.emit('game_over');
    }
  }

  private findActiveCue(time: number): Cue | undefined {
    return this.state.cues.find(
      (c) =>
        !c.consumed &&
        c.type === 'TOGGLE_REQUIRED' &&
        Math.abs(time - c.idealTime) <= this.config.hitWindow,
    );
  }

  private findHoldCueInWindow(time: number): Cue | undefined {
    return this.state.cues.find(
      (c) =>
        !c.consumed &&
        c.type === 'HOLD_REQUIRED' &&
        Math.abs(time - c.idealTime) <= this.config.hitWindow,
    );
  }

  private generateDataSequence(length: number): number[] {
    const seq: number[] = [0];
    for (let i = 1; i < length; i++) {
      seq.push(Math.random() < 0.5 ? seq[i - 1] : 1 - seq[i - 1]);
    }
    return seq;
  }

  private buildCues(dataSequence: number[]): Cue[] {
    const cues: Cue[] = [];
    let strobeLevel = 0;

    for (let i = 1; i < dataSequence.length; i++) {
      const prevData = dataSequence[i - 1];
      const currData = dataSequence[i];
      const dataToggled = currData !== prevData;

      let cueType: CueType;
      let expectedStrobe: number;

      if (dataToggled) {
        cueType = 'HOLD_REQUIRED';
        expectedStrobe = strobeLevel;
      } else {
        cueType = 'TOGGLE_REQUIRED';
        strobeLevel = 1 - strobeLevel;
        expectedStrobe = strobeLevel;
      }

      cues.push({
        index: i,
        type: cueType,
        idealTime: i * this.config.bitPeriod,
        dataLevel: currData,
        expectedStrobeLevel: expectedStrobe,
        consumed: false,
      });
    }

    return cues;
  }

  private emit(type: GameEventType, data?: unknown): void {
    this.listener?.(type, data);
  }
}

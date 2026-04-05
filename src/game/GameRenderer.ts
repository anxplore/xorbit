import type { GameConfig } from '../types/game.types';
import type { GameState, Cue } from './GameLoop';
import { resolveCssColorForCanvas, cssColorWithAlpha } from '../lib/canvasColor';

const PADDING = { top: 40, bottom: 40, left: 16, right: 16 };
const VISIBLE_BEATS = 12;

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  private dpr: number;
  private w = 0;
  private h = 0;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = config;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  render(state: GameState): void {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;

    const lane = {
      data: resolveCssColorForCanvas('var(--color-static-grey)'),
      strobe: resolveCssColorForCanvas('var(--color-industrial-blue)'),
      clock: resolveCssColorForCanvas('var(--color-space-purple)'),
      cueToggle: '#FFFFFF',
      cueHold: cssColorWithAlpha('var(--color-static-grey)', 0.5),
    };
    const feedback: Record<string, string> = {
      PERFECT: resolveCssColorForCanvas('var(--color-space-purple)'),
      GOOD: resolveCssColorForCanvas('var(--color-industrial-blue)'),
      MARGINAL: resolveCssColorForCanvas('var(--color-prototype-amber)'),
      LINK_WARNING: resolveCssColorForCanvas('var(--color-breadboard-red)'),
      WRONG_ACTION: resolveCssColorForCanvas('var(--color-breadboard-red)'),
      MISS: '#374151',
    };

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, w, h);

    const plotH = h - PADDING.top - PADDING.bottom;
    const laneH = plotH / 3;
    const amp = laneH * 0.3;
    const plotW = w - PADDING.left - PADDING.right;

    const bp = this.config.bitPeriod;
    const currentTime = state.currentTime;

    // Waveform travels left-to-right: upcoming cues enter from the left,
    // the hit line sits at ~75% from left, consumed cues exit to the right.
    const lookAhead = bp * (VISIBLE_BEATS - 3);
    const lookBehind = bp * 3;
    const pxPerSec = plotW / (lookAhead + lookBehind);
    const hitLineX = PADDING.left + plotW * 0.75;
    const timeToX = (t: number) => hitLineX - (t - currentTime) * pxPerSec;

    // Lane definitions: y-center for each lane
    const dataY = PADDING.top + laneH * 0.5;
    const strobeY = PADDING.top + laneH * 1.5;
    const clockY = PADDING.top + laneH * 2.5;

    // Lane labels (positioned above each lane, left-aligned to lane center)
    ctx.font = '11px Inter, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.fillStyle = lane.data;
    ctx.fillText('DATA', PADDING.left + plotW * 0.15, PADDING.top - 16);
    ctx.fillStyle = lane.strobe;
    ctx.fillText('STROBE (YOU)', PADDING.left + plotW * 0.5, PADDING.top - 16);
    ctx.fillStyle = lane.clock;
    ctx.fillText('D ⊕ S', PADDING.left + plotW * 0.85, PADDING.top - 16);

    // Lane separator lines
    ctx.strokeStyle = resolveCssColorForCanvas('var(--color-border)');
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 3; i++) {
      const y = PADDING.top + laneH * i;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + plotW, y);
      ctx.stroke();
    }

    // Hit line (current time marker)
    ctx.strokeStyle = '#ffffff30';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(hitLineX, PADDING.top);
    ctx.lineTo(hitLineX, h - PADDING.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Visible time window (used for culling off-screen beats)
    const visibleTimeMin = currentTime - lookBehind;
    const visibleTimeMax = currentTime + lookAhead;

    // Draw waveforms
    const seq = state.dataSequence;

    // Helper to draw a waveform across beats.
    // With left-to-right scroll, earlier beats have larger X (right) and
    // later beats have smaller X (left). We draw each beat from its right
    // edge (tStart → larger X) to left edge (tEnd → smaller X).
    const drawWave = (
      levels: (i: number) => number,
      yCenter: number,
      color: string,
      lineWidth: number,
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      let started = false;

      for (let i = 0; i < seq.length; i++) {
        const tStart = i * bp;
        const tEnd = (i + 1) * bp;
        if (tEnd < visibleTimeMin || tStart > visibleTimeMax) continue;

        const lvl = levels(i);
        const y = yCenter + (lvl === 1 ? -amp : amp);
        const xRight = Math.min(timeToX(tStart), PADDING.left + plotW);
        const xLeft = Math.max(timeToX(tEnd), PADDING.left);

        if (!started) {
          ctx.moveTo(xRight, y);
          started = true;
        } else {
          ctx.lineTo(xRight, y);
        }
        ctx.lineTo(xLeft, y);
      }
      ctx.stroke();
    };

    // Data lane
    drawWave((i) => seq[i], dataY, lane.data, 2);

    // Compute strobe from cues + state
    const strobeLevels = this.computeStrobeLevels(state);
    drawWave((i) => strobeLevels[i] ?? 0, strobeY, lane.strobe, 2.5);

    // Clock = Data XOR Strobe
    drawWave((i) => (seq[i] ?? 0) ^ (strobeLevels[i] ?? 0), clockY, lane.clock, 2);

    // Draw cue markers on strobe lane
    for (const cue of state.cues) {
      const x = timeToX(cue.idealTime);
      if (x < PADDING.left - 20 || x > PADDING.left + plotW + 20) continue;

      if (cue.consumed && cue.result) {
        this.drawConsumedCue(ctx, x, strobeY, cue, feedback);
      } else if (!cue.consumed) {
        this.drawPendingCue(ctx, x, strobeY, cue, lane);
      }
    }

    // Hit feedback flash
    if (state.hitFeedback) {
      const age = currentTime - state.hitFeedback.time;
      if (age < 0.4) {
        const fade = 1 - age / 0.4;
        const base = feedback[state.hitFeedback.grade] ?? '#FFFFFF';
        ctx.fillStyle = cssColorWithAlpha(base, fade * (40 / 255));
        ctx.fillRect(0, 0, w, h);
      }
    }

    // Lives display
    this.drawLives(ctx, state, w);
  }

  private computeStrobeLevels(state: GameState): number[] {
    const levels: number[] = [0];
    let strobe = 0;

    for (const cue of state.cues) {
      if (cue.consumed && cue.type === 'TOGGLE_REQUIRED' && cue.result !== 'MISS') {
        strobe = cue.expectedStrobeLevel;
      } else if (cue.type === 'HOLD_REQUIRED') {
        // strobe doesn't change
      } else if (!cue.consumed && cue.idealTime <= state.currentTime) {
        // Not yet consumed but time has not expired — keep current
      }

      while (levels.length <= cue.index) {
        levels.push(strobe);
      }
    }

    while (levels.length < state.dataSequence.length) {
      levels.push(strobe);
    }

    return levels;
  }

  private drawPendingCue(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cue: Cue,
    lane: { cueToggle: string; cueHold: string },
  ): void {
    if (cue.type === 'TOGGLE_REQUIRED') {
      // Filled circle
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = lane.cueToggle;
      ctx.fill();
    } else {
      // Diamond outline
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x + 8, y);
      ctx.lineTo(x, y + 8);
      ctx.lineTo(x - 8, y);
      ctx.closePath();
      ctx.strokeStyle = lane.cueHold;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  private drawConsumedCue(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cue: Cue,
    feedback: Record<string, string>,
  ): void {
    const color = feedback[cue.result ?? 'MISS'] ?? feedback.MISS;
    const alpha = 0.6;

    ctx.globalAlpha = alpha;
    if (cue.type === 'TOGGLE_REQUIRED') {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 6, y);
      ctx.lineTo(x, y + 6);
      ctx.lineTo(x - 6, y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawLives(ctx: CanvasRenderingContext2D, state: GameState, w: number): void {
    const x = w - PADDING.right - 10;
    const y = 14;
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    const color =
      state.lives <= 1
        ? resolveCssColorForCanvas('var(--color-breadboard-red)')
        : state.lives <= 2
          ? resolveCssColorForCanvas('var(--color-prototype-amber)')
          : resolveCssColorForCanvas('var(--color-mars-orange)');
    ctx.fillStyle = color;

    let text = '';
    for (let i = 0; i < state.maxLives; i++) {
      text += i < state.lives ? '♥' : '♡';
    }
    ctx.fillText(text, x, y);
  }
}

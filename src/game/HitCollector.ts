import type { HitRecord, SessionSummary } from '../types/game.types';

export class HitCollector {
  private records: HitRecord[] = [];
  private consecutiveCurrent = 0;
  private consecutivePeak = 0;
  private correctHits = 0;
  private wrongActions = 0;
  private misses = 0;

  reset(): void {
    this.records = [];
    this.consecutiveCurrent = 0;
    this.consecutivePeak = 0;
    this.correctHits = 0;
    this.wrongActions = 0;
    this.misses = 0;
  }

  /**
   * Record a player action (TOGGLE or HOLD) against an ideal edge.
   * Delta is in seconds, signed: positive = late, negative = early.
   */
  recordHit(idealEdgeTime: number, playerInputTime: number, action: 'TOGGLE' | 'HOLD', isCorrect: boolean): void {
    const delta = playerInputTime - idealEdgeTime;

    this.records.push({
      idealEdgeTime,
      playerInputTime,
      delta,
      action,
      isCorrect,
    });

    if (isCorrect) {
      this.correctHits++;
      this.consecutiveCurrent++;
      if (this.consecutiveCurrent > this.consecutivePeak) {
        this.consecutivePeak = this.consecutiveCurrent;
      }
    } else {
      this.wrongActions++;
      this.consecutiveCurrent = 0;
    }
  }

  /**
   * Record a MISS — no player input within the hit window.
   * Delta is NaN by spec so it's excluded from Jitter/Skew calculations.
   */
  recordMiss(idealEdgeTime: number): void {
    this.records.push({
      idealEdgeTime,
      playerInputTime: NaN,
      delta: NaN,
      action: 'MISS',
      isCorrect: false,
    });

    this.misses++;
    this.consecutiveCurrent = 0;
  }

  getRecords(): readonly HitRecord[] {
    return this.records;
  }

  getSummary(): SessionSummary {
    return {
      totalOpportunities: this.records.length,
      correctHits: this.correctHits,
      wrongActions: this.wrongActions,
      misses: this.misses,
      consecutiveCorrectPeak: this.consecutivePeak,
    };
  }
}

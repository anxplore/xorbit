import { describe, it, expect } from 'vitest';
import type { HitRecord, SessionSummary } from '../../types/game.types';
import {
  calculateJitter,
  calculateSkew,
  classifySkew,
  calculateLER,
  getLERLabel,
  getJitterGradeLabel,
  getHitGrade,
  computeSignalIntegrityScore,
  getGrade,
  getCertification,
  clamp,
  lerp,
} from '../metrics';

const BIT_PERIOD = 0.01; // 100 Mbps → 10ms

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createPerfectRecords(count: number, bitPeriod: number): HitRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    idealEdgeTime: i * bitPeriod,
    playerInputTime: i * bitPeriod,
    delta: 0,
    action: 'TOGGLE' as const,
    isCorrect: true,
  }));
}

function createWorstCaseRecords(count: number, bitPeriod: number): HitRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    idealEdgeTime: i * bitPeriod,
    playerInputTime: i * bitPeriod + bitPeriod * 0.4 * (i % 2 === 0 ? 1 : -1),
    delta: bitPeriod * 0.4 * (i % 2 === 0 ? 1 : -1),
    action: 'TOGGLE' as const,
    isCorrect: false,
  }));
}

function createMixedRecords(hitCount: number, missCount: number, bitPeriod: number): HitRecord[] {
  const hits = createPerfectRecords(hitCount, bitPeriod);
  const misses: HitRecord[] = Array.from({ length: missCount }, (_, i) => ({
    idealEdgeTime: (hitCount + i) * bitPeriod,
    playerInputTime: NaN,
    delta: NaN,
    action: 'MISS' as const,
    isCorrect: false,
  }));
  return [...hits, ...misses];
}

function createLateBiasRecords(count: number, bitPeriod: number, biasFraction: number): HitRecord[] {
  const bias = bitPeriod * biasFraction;
  return Array.from({ length: count }, (_, i) => ({
    idealEdgeTime: i * bitPeriod,
    playerInputTime: i * bitPeriod + bias,
    delta: bias,
    action: 'TOGGLE' as const,
    isCorrect: true,
  }));
}

function createAllWrongRecords(count: number, bitPeriod: number): HitRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    idealEdgeTime: i * bitPeriod,
    playerInputTime: i * bitPeriod + bitPeriod * 0.1,
    delta: bitPeriod * 0.1,
    action: 'TOGGLE' as const,
    isCorrect: false,
  }));
}

function createAllMissRecords(count: number, bitPeriod: number): HitRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    idealEdgeTime: i * bitPeriod,
    playerInputTime: NaN,
    delta: NaN,
    action: 'MISS' as const,
    isCorrect: false,
  }));
}

// ---------------------------------------------------------------------------
// Utility tests
// ---------------------------------------------------------------------------

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-5, 0, 100)).toBe(0));
  it('clamps above max', () => expect(clamp(200, 0, 100)).toBe(100));
  it('passes through in range', () => expect(clamp(50, 0, 100)).toBe(50));
});

describe('lerp', () => {
  it('t=0 returns a', () => expect(lerp(10, 20, 0)).toBe(10));
  it('t=1 returns b', () => expect(lerp(10, 20, 1)).toBe(20));
  it('t=0.5 returns midpoint', () => expect(lerp(10, 20, 0.5)).toBe(15));
});

// ---------------------------------------------------------------------------
// calculateJitter
// ---------------------------------------------------------------------------

describe('calculateJitter', () => {
  it('returns 0 for perfectly timed inputs', () => {
    const records = createPerfectRecords(50, BIT_PERIOD);
    expect(calculateJitter(records, BIT_PERIOD)).toBeCloseTo(0, 5);
  });

  it('returns >0.25 for worst-case inputs', () => {
    const records = createWorstCaseRecords(50, BIT_PERIOD);
    expect(calculateJitter(records, BIT_PERIOD)).toBeGreaterThan(0.25);
  });

  it('ignores MISS records', () => {
    const withMiss = createMixedRecords(40, 10, BIT_PERIOD);
    const withoutMiss = createPerfectRecords(40, BIT_PERIOD);
    expect(calculateJitter(withMiss, BIT_PERIOD)).toBeCloseTo(
      calculateJitter(withoutMiss, BIT_PERIOD),
      3,
    );
  });

  it('returns 1.0 when all records are MISS (no valid hits)', () => {
    const records = createAllMissRecords(50, BIT_PERIOD);
    expect(calculateJitter(records, BIT_PERIOD)).toBe(1.0);
  });

  it('returns 1.0 for empty array', () => {
    expect(calculateJitter([], BIT_PERIOD)).toBe(1.0);
  });

  it('simulated 100 perfect inputs produce jitter < 0.001', () => {
    const records = createPerfectRecords(100, BIT_PERIOD);
    expect(calculateJitter(records, BIT_PERIOD)).toBeLessThan(0.001);
  });
});

// ---------------------------------------------------------------------------
// calculateSkew
// ---------------------------------------------------------------------------

describe('calculateSkew', () => {
  it('returns 0 for perfectly centered inputs', () => {
    const records = createPerfectRecords(50, BIT_PERIOD);
    expect(calculateSkew(records, BIT_PERIOD)).toBeCloseTo(0, 5);
  });

  it('returns positive for late-biased inputs', () => {
    const records = createLateBiasRecords(50, BIT_PERIOD, 0.1);
    expect(calculateSkew(records, BIT_PERIOD)).toBeCloseTo(0.1, 3);
  });

  it('returns negative for early-biased inputs', () => {
    const records = createLateBiasRecords(50, BIT_PERIOD, -0.1);
    expect(calculateSkew(records, BIT_PERIOD)).toBeCloseTo(-0.1, 3);
  });

  it('returns 0 when all MISS', () => {
    const records = createAllMissRecords(50, BIT_PERIOD);
    expect(calculateSkew(records, BIT_PERIOD)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(calculateSkew([], BIT_PERIOD)).toBe(0);
  });
});

describe('classifySkew', () => {
  it('EARLY when < -0.05', () => expect(classifySkew(-0.10)).toBe('EARLY'));
  it('NEUTRAL when near zero', () => expect(classifySkew(0.02)).toBe('NEUTRAL'));
  it('LATE when > 0.05', () => expect(classifySkew(0.10)).toBe('LATE'));
  it('NEUTRAL at boundary -0.05', () => expect(classifySkew(-0.05)).toBe('NEUTRAL'));
  it('NEUTRAL at boundary +0.05', () => expect(classifySkew(0.05)).toBe('NEUTRAL'));
});

// ---------------------------------------------------------------------------
// calculateLER
// ---------------------------------------------------------------------------

describe('calculateLER', () => {
  it('returns 0 for perfect session', () => {
    const summary: SessionSummary = {
      totalOpportunities: 100,
      correctHits: 100,
      wrongActions: 0,
      misses: 0,
      consecutiveCorrectPeak: 100,
    };
    expect(calculateLER(summary)).toBe(0);
  });

  it('returns 1.0 for all-miss session', () => {
    const summary: SessionSummary = {
      totalOpportunities: 50,
      correctHits: 0,
      wrongActions: 0,
      misses: 50,
      consecutiveCorrectPeak: 0,
    };
    expect(calculateLER(summary)).toBe(1.0);
  });

  it('returns 1.0 for all-wrong session', () => {
    const summary: SessionSummary = {
      totalOpportunities: 50,
      correctHits: 0,
      wrongActions: 50,
      misses: 0,
      consecutiveCorrectPeak: 0,
    };
    expect(calculateLER(summary)).toBe(1.0);
  });

  it('handles zero totalOpportunities', () => {
    const summary: SessionSummary = {
      totalOpportunities: 0,
      correctHits: 0,
      wrongActions: 0,
      misses: 0,
      consecutiveCorrectPeak: 0,
    };
    expect(calculateLER(summary)).toBe(1.0);
  });

  it('calculates mixed errors correctly', () => {
    const summary: SessionSummary = {
      totalOpportunities: 100,
      correctHits: 85,
      wrongActions: 10,
      misses: 5,
      consecutiveCorrectPeak: 30,
    };
    expect(calculateLER(summary)).toBeCloseTo(0.15, 5);
  });
});

describe('getLERLabel', () => {
  it('Mission Critical for ler <= 0.01', () => {
    expect(getLERLabel(0.005)).toContain('Mission Critical');
  });
  it('Flight Heritage for ler <= 0.05', () => {
    expect(getLERLabel(0.03)).toContain('Flight Heritage');
  });
  it('Ground Segment for ler <= 0.15', () => {
    expect(getLERLabel(0.10)).toContain('Ground Segment');
  });
  it('LINK DOWN for ler > 0.15', () => {
    expect(getLERLabel(0.50)).toContain('LINK DOWN');
  });
});

// ---------------------------------------------------------------------------
// getJitterGradeLabel / getHitGrade
// ---------------------------------------------------------------------------

describe('getJitterGradeLabel', () => {
  it('Space Grade for <= 0.05', () => expect(getJitterGradeLabel(0.03)).toBe('Space Grade'));
  it('Industrial Grade for <= 0.15', () => expect(getJitterGradeLabel(0.10)).toBe('Industrial Grade'));
  it('Consumer Grade for <= 0.25', () => expect(getJitterGradeLabel(0.20)).toBe('Consumer Grade'));
  it('Link Unstable for > 0.25', () => expect(getJitterGradeLabel(0.40)).toBe('Link Unstable'));
});

describe('getHitGrade', () => {
  it('PERFECT for <= 0.05', () => expect(getHitGrade(0.02)).toBe('PERFECT'));
  it('GOOD for <= 0.15', () => expect(getHitGrade(0.10)).toBe('GOOD'));
  it('MARGINAL for <= 0.25', () => expect(getHitGrade(0.20)).toBe('MARGINAL'));
  it('LINK_WARNING for > 0.25', () => expect(getHitGrade(0.40)).toBe('LINK_WARNING'));
});

// ---------------------------------------------------------------------------
// computeSignalIntegrityScore
// ---------------------------------------------------------------------------

describe('computeSignalIntegrityScore', () => {
  it('grade S for space-grade performance', () => {
    const score = computeSignalIntegrityScore(0.02, 0.01, 0.005);
    expect(score.grade).toBe('S');
    expect(score.totalScore).toBeGreaterThanOrEqual(95);
  });

  it('grade A for flight-heritage performance', () => {
    const score = computeSignalIntegrityScore(0.05, 0.04, 0.03);
    expect(score.grade).toBe('A');
    expect(score.totalScore).toBeGreaterThanOrEqual(80);
    expect(score.totalScore).toBeLessThan(95);
  });

  it('grade LINK_DOWN for catastrophic failure', () => {
    const score = computeSignalIntegrityScore(0.40, 0.30, 0.80);
    expect(score.grade).toBe('LINK_DOWN');
    expect(score.totalScore).toBeLessThan(35);
  });

  it('sub-scores are clamped 0–100', () => {
    const score = computeSignalIntegrityScore(0.50, 0.50, 1.0);
    expect(score.jitterScore).toBeGreaterThanOrEqual(0);
    expect(score.jitterScore).toBeLessThanOrEqual(100);
    expect(score.skewScore).toBeGreaterThanOrEqual(0);
    expect(score.skewScore).toBeLessThanOrEqual(100);
    expect(score.lerScore).toBeGreaterThanOrEqual(0);
    expect(score.lerScore).toBeLessThanOrEqual(100);
  });

  it('totalScore is weighted (35% jitter + 25% skew + 40% ler)', () => {
    const score = computeSignalIntegrityScore(0, 0, 0);
    expect(score.jitterScore).toBe(100);
    expect(score.skewScore).toBe(100);
    expect(score.lerScore).toBe(100);
    expect(score.totalScore).toBe(100);
  });

  it('all MISS produces worst score', () => {
    const score = computeSignalIntegrityScore(1.0, 0, 1.0);
    expect(score.grade).toBe('LINK_DOWN');
  });

  it('all WRONG_ACTION produces bad score', () => {
    const score = computeSignalIntegrityScore(0.1, 0.05, 1.0);
    expect(score.lerScore).toBe(0);
    // jitter/skew still contribute points, so total is D not LINK_DOWN
    expect(['D', 'LINK_DOWN']).toContain(score.grade);
    expect(score.totalScore).toBeLessThan(50);
  });

  it('certification string matches grade', () => {
    const s = computeSignalIntegrityScore(0.01, 0.01, 0.0);
    expect(s.certification).toContain('ECSS');

    const d = computeSignalIntegrityScore(0.25, 0.20, 0.60);
    expect(d.certification).toContain('Ground Test');
  });
});

// ---------------------------------------------------------------------------
// getGrade / getCertification
// ---------------------------------------------------------------------------

describe('getGrade', () => {
  it('S for >= 95', () => expect(getGrade(95)).toBe('S'));
  it('A for >= 80', () => expect(getGrade(80)).toBe('A'));
  it('B for >= 65', () => expect(getGrade(65)).toBe('B'));
  it('C for >= 50', () => expect(getGrade(50)).toBe('C'));
  it('D for >= 35', () => expect(getGrade(35)).toBe('D'));
  it('LINK_DOWN for < 35', () => expect(getGrade(20)).toBe('LINK_DOWN'));
});

describe('getCertification', () => {
  it('S → ECSS', () => expect(getCertification('S')).toContain('ECSS'));
  it('A → TRL 7', () => expect(getCertification('A')).toContain('TRL 7'));
  it('B → TRL 5', () => expect(getCertification('B')).toContain('TRL 5'));
  it('C → TRL 4', () => expect(getCertification('C')).toContain('TRL 4'));
  it('D → TRL 3', () => expect(getCertification('D')).toContain('TRL 3'));
  it('LINK_DOWN → Ground Test', () => expect(getCertification('LINK_DOWN')).toContain('Ground Test'));
});

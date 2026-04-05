import { describe, it, expect, beforeEach } from 'vitest';
import { HitCollector } from '../HitCollector';

const BIT_PERIOD = 0.01;

describe('HitCollector', () => {
  let collector: HitCollector;

  beforeEach(() => {
    collector = new HitCollector();
  });

  it('starts empty', () => {
    expect(collector.getRecords()).toHaveLength(0);
    const summary = collector.getSummary();
    expect(summary.totalOpportunities).toBe(0);
    expect(summary.correctHits).toBe(0);
    expect(summary.wrongActions).toBe(0);
    expect(summary.misses).toBe(0);
    expect(summary.consecutiveCorrectPeak).toBe(0);
  });

  it('records hits with correct delta', () => {
    collector.recordHit(1.0, 1.005, 'TOGGLE', true);
    const records = collector.getRecords();
    expect(records).toHaveLength(1);
    expect(records[0].delta).toBeCloseTo(0.005, 6);
    expect(records[0].action).toBe('TOGGLE');
    expect(records[0].isCorrect).toBe(true);
  });

  it('records MISS with NaN delta', () => {
    collector.recordMiss(1.0);
    const records = collector.getRecords();
    expect(records).toHaveLength(1);
    expect(records[0].action).toBe('MISS');
    expect(Number.isNaN(records[0].delta)).toBe(true);
    expect(Number.isNaN(records[0].playerInputTime)).toBe(true);
    expect(records[0].isCorrect).toBe(false);
  });

  it('summary counts correct hits, wrong actions, and misses', () => {
    collector.recordHit(0.0, 0.001, 'TOGGLE', true);
    collector.recordHit(0.01, 0.012, 'TOGGLE', true);
    collector.recordHit(0.02, 0.025, 'TOGGLE', false);
    collector.recordMiss(0.03);
    collector.recordHit(0.04, 0.041, 'HOLD', true);

    const summary = collector.getSummary();
    expect(summary.totalOpportunities).toBe(5);
    expect(summary.correctHits).toBe(3);
    expect(summary.wrongActions).toBe(1);
    expect(summary.misses).toBe(1);
  });

  it('tracks consecutive correct peak', () => {
    collector.recordHit(0, 0, 'TOGGLE', true);
    collector.recordHit(1, 1, 'TOGGLE', true);
    collector.recordHit(2, 2, 'TOGGLE', true);
    collector.recordHit(3, 3, 'TOGGLE', false);
    collector.recordHit(4, 4, 'TOGGLE', true);
    collector.recordHit(5, 5, 'TOGGLE', true);

    expect(collector.getSummary().consecutiveCorrectPeak).toBe(3);
  });

  it('consecutive peak resets on MISS', () => {
    collector.recordHit(0, 0, 'TOGGLE', true);
    collector.recordHit(1, 1, 'TOGGLE', true);
    collector.recordMiss(2);
    collector.recordHit(3, 3, 'TOGGLE', true);

    expect(collector.getSummary().consecutiveCorrectPeak).toBe(2);
  });

  it('record length equals totalOpportunities (including MISS)', () => {
    for (let i = 0; i < 10; i++) {
      if (i % 3 === 0) {
        collector.recordMiss(i * BIT_PERIOD);
      } else {
        collector.recordHit(i * BIT_PERIOD, i * BIT_PERIOD + 0.001, 'TOGGLE', true);
      }
    }
    const summary = collector.getSummary();
    expect(collector.getRecords().length).toBe(summary.totalOpportunities);
  });

  it('delta unit is seconds (not milliseconds)', () => {
    collector.recordHit(1.0, 1.005, 'TOGGLE', true);
    const delta = collector.getRecords()[0].delta;
    expect(delta).toBeCloseTo(0.005, 6);
    expect(delta).toBeLessThan(1);
  });

  it('reset clears everything', () => {
    collector.recordHit(0, 0.001, 'TOGGLE', true);
    collector.recordHit(1, 1.001, 'TOGGLE', true);
    collector.recordMiss(2);

    collector.reset();

    expect(collector.getRecords()).toHaveLength(0);
    const summary = collector.getSummary();
    expect(summary.totalOpportunities).toBe(0);
    expect(summary.correctHits).toBe(0);
    expect(summary.wrongActions).toBe(0);
    expect(summary.misses).toBe(0);
    expect(summary.consecutiveCorrectPeak).toBe(0);
  });

  it('100 perfect inputs produce records for jitter < 0.001', () => {
    for (let i = 0; i < 100; i++) {
      collector.recordHit(i * BIT_PERIOD, i * BIT_PERIOD, 'TOGGLE', true);
    }
    const records = collector.getRecords();
    expect(records).toHaveLength(100);
    expect(records.every((r) => r.delta === 0)).toBe(true);
  });
});

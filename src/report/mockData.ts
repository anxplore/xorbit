import type { GameConfig } from '../types/game.types';
import type { ReportPayload } from '../types/report.types';
import {
  calculateJitter,
  calculateSkew,
  classifySkew,
  calculateLER,
  computeSignalIntegrityScore,
  getJitterGradeLabel,
  getLERLabel,
  getHitGrade,
} from '../workers/metrics';
import { generateAssessment } from '../workers/assessment';
import type { HitRecord, SessionSummary } from '../types/game.types';

/**
 * Generate a realistic mock ReportPayload for UI development / preview.
 * The mock simulates a mid-range player (Grade A–B).
 */
export function createMockReportPayload(config: GameConfig): ReportPayload {
  const bitPeriod = config.bitPeriod;
  const totalBeats = 80;

  const records: HitRecord[] = [];
  let correctHits = 0;
  let wrongActions = 0;
  let misses = 0;
  let consecutiveCurrent = 0;
  let consecutivePeak = 0;

  for (let i = 0; i < totalBeats; i++) {
    const idealTime = i * bitPeriod;
    const rand = Math.random();

    if (rand < 0.05) {
      // 5% miss
      records.push({
        idealEdgeTime: idealTime,
        playerInputTime: NaN,
        delta: NaN,
        action: 'MISS',
        isCorrect: false,
      });
      misses++;
      consecutiveCurrent = 0;
    } else if (rand < 0.10) {
      // 5% wrong action
      const delta = (Math.random() - 0.5) * bitPeriod * 0.3;
      records.push({
        idealEdgeTime: idealTime,
        playerInputTime: idealTime + delta,
        delta,
        action: 'TOGGLE',
        isCorrect: false,
      });
      wrongActions++;
      consecutiveCurrent = 0;
    } else {
      // 90% correct with some jitter
      const jitterSigma = bitPeriod * 0.08;
      const delta = gaussianRandom() * jitterSigma + bitPeriod * 0.02;
      records.push({
        idealEdgeTime: idealTime,
        playerInputTime: idealTime + delta,
        delta,
        action: i % 2 === 0 ? 'TOGGLE' : 'HOLD',
        isCorrect: true,
      });
      correctHits++;
      consecutiveCurrent++;
      if (consecutiveCurrent > consecutivePeak) consecutivePeak = consecutiveCurrent;
    }
  }

  const summary: SessionSummary = {
    totalOpportunities: totalBeats,
    correctHits,
    wrongActions,
    misses,
    consecutiveCorrectPeak: consecutivePeak,
  };

  const normalizedJitter = calculateJitter(records, bitPeriod);
  const normalizedSkew = calculateSkew(records, bitPeriod);
  const ler = calculateLER(summary);
  const score = computeSignalIntegrityScore(normalizedJitter, normalizedSkew, ler);

  return {
    metrics: {
      jitter: {
        normalized: normalizedJitter,
        rms_ms: normalizedJitter * bitPeriod * 1000,
        grade: getJitterGradeLabel(normalizedJitter),
      },
      skew: {
        normalized: normalizedSkew,
        bias: classifySkew(normalizedSkew),
        suggestedOffset_ms: -normalizedSkew * bitPeriod * 1000,
      },
      ler: {
        value: ler,
        wrongActions: summary.wrongActions,
        misses: summary.misses,
        label: getLERLabel(ler),
      },
    },
    score,
    assessment: generateAssessment({
      jitterGrade: normalizedJitter < 0.10 ? 'LOW' : normalizedJitter < 0.20 ? 'MID' : 'HIGH',
      skewBias: classifySkew(normalizedSkew),
      lerGrade: ler < 0.05 ? 'LOW' : ler < 0.15 ? 'MID' : 'HIGH',
      consecutivePeak: summary.consecutiveCorrectPeak,
    }),
    distribution: records.map((r) => ({
      time: r.idealEdgeTime,
      delta: r.action === 'MISS' ? 0 : r.delta / bitPeriod,
      grade: r.action === 'MISS' ? 'MISS' : getHitGrade(Math.abs(r.delta) / bitPeriod),
    })),
    gameConfig: {
      mode: config.mode,
      speed: config.speed,
      trlLabel: config.trlLabel,
    },
  };
}

function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

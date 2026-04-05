import type { HitRecord, SessionSummary } from '../types/game.types';
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
} from './metrics';
import { generateAssessment } from './assessment';

export interface WorkerInput {
  hitRecords: HitRecord[];
  sessionSummary: SessionSummary;
  bitPeriod: number;
  gameConfig: { mode: 'EASY' | 'ADVANCED'; speed: string; trlLabel: string };
}

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  const { hitRecords, sessionSummary, bitPeriod, gameConfig } = event.data;

  const normalizedJitter = calculateJitter(hitRecords, bitPeriod);
  const normalizedSkew = calculateSkew(hitRecords, bitPeriod);
  const ler = calculateLER(sessionSummary);
  const score = computeSignalIntegrityScore(normalizedJitter, normalizedSkew, ler);

  const payload: ReportPayload = {
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
        wrongActions: sessionSummary.wrongActions,
        misses: sessionSummary.misses,
        label: getLERLabel(ler),
      },
    },
    score,
    assessment: generateAssessment({
      jitterGrade: normalizedJitter < 0.10 ? 'LOW' : normalizedJitter < 0.20 ? 'MID' : 'HIGH',
      skewBias: classifySkew(normalizedSkew),
      lerGrade: ler < 0.05 ? 'LOW' : ler < 0.15 ? 'MID' : 'HIGH',
      consecutivePeak: sessionSummary.consecutiveCorrectPeak,
    }),
    distribution: hitRecords.map((r) => ({
      time: r.idealEdgeTime,
      delta: r.action === 'MISS' ? 0 : r.delta / bitPeriod,
      grade: r.action === 'MISS' ? 'MISS' : getHitGrade(Math.abs(r.delta) / bitPeriod),
    })),
    gameConfig: {
      mode: gameConfig.mode,
      speed: gameConfig.speed as ReportPayload['gameConfig']['speed'],
      trlLabel: gameConfig.trlLabel,
    },
  };

  self.postMessage(payload);
};

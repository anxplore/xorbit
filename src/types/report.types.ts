import type { GameConfig, MissionGrade, SkewBias, SpeedLevel } from './game.types';

export interface SignalIntegrityScore {
  jitterScore: number;
  skewScore: number;
  lerScore: number;
  totalScore: number;
  grade: MissionGrade;
  certification: string;
}

export interface ReportPayload {
  metrics: {
    jitter: { normalized: number; rms_ms: number; grade: string };
    skew: { normalized: number; bias: SkewBias; suggestedOffset_ms: number };
    ler: { value: number; wrongActions: number; misses: number; label: string };
  };
  score: SignalIntegrityScore;
  assessment: string;
  distribution: { time: number; delta: number; grade: string }[];
  gameConfig: Pick<GameConfig, 'mode' | 'speed' | 'trlLabel'>;
}

export interface AssessmentContext {
  jitterGrade: 'LOW' | 'MID' | 'HIGH';
  skewBias: SkewBias;
  lerGrade: 'LOW' | 'MID' | 'HIGH';
  consecutivePeak: number;
}

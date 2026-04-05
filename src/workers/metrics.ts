import type {
  HitRecord,
  SessionSummary,
  MissionGrade,
  SkewBias,
} from '../types/game.types';
import type { SignalIntegrityScore } from '../types/report.types';

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

export const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

// ---------------------------------------------------------------------------
// Jitter — RMS of deltas, normalized to bitPeriod
// ---------------------------------------------------------------------------

export function calculateJitter(records: readonly HitRecord[], bitPeriod: number): number {
  const validHits = records.filter((r) => r.action !== 'MISS');
  if (validHits.length === 0) return 1.0;

  const rms = Math.sqrt(
    validHits.reduce((sum, r) => sum + r.delta ** 2, 0) / validHits.length,
  );

  return rms / bitPeriod;
}

// ---------------------------------------------------------------------------
// Skew — mean of deltas, normalized to bitPeriod (signed)
// ---------------------------------------------------------------------------

export function calculateSkew(records: readonly HitRecord[], bitPeriod: number): number {
  const validHits = records.filter((r) => r.action !== 'MISS');
  if (validHits.length === 0) return 0;

  const mean = validHits.reduce((sum, r) => sum + r.delta, 0) / validHits.length;
  return mean / bitPeriod;
}

export function classifySkew(normalizedSkew: number): SkewBias {
  if (normalizedSkew < -0.05) return 'EARLY';
  if (normalizedSkew > 0.05) return 'LATE';
  return 'NEUTRAL';
}

// ---------------------------------------------------------------------------
// Link Error Rate
// ---------------------------------------------------------------------------

export function calculateLER(summary: SessionSummary): number {
  if (summary.totalOpportunities === 0) return 1.0;
  const errors = summary.wrongActions + summary.misses;
  return errors / summary.totalOpportunities;
}

export function getLERLabel(ler: number): string {
  if (ler <= 0.01) return 'BER < 10⁻²  — Mission Critical Eligible';
  if (ler <= 0.05) return 'BER < 5×10⁻² — Flight Heritage Candidate';
  if (ler <= 0.15) return 'BER < 1.5×10⁻¹ — Ground Segment Only';
  return 'LINK DOWN — Retransmission Required';
}

// ---------------------------------------------------------------------------
// Jitter grade label (for scatter-plot dot coloring)
// ---------------------------------------------------------------------------

export function getJitterGradeLabel(normalizedJitter: number): string {
  if (normalizedJitter <= 0.05) return 'Space Grade';
  if (normalizedJitter <= 0.15) return 'Industrial Grade';
  if (normalizedJitter <= 0.25) return 'Consumer Grade';
  return 'Link Unstable';
}

// ---------------------------------------------------------------------------
// Hit grade (per-hit, for scatter-plot)
// ---------------------------------------------------------------------------

export function getHitGrade(normalizedAbsDelta: number): string {
  if (normalizedAbsDelta <= 0.05) return 'PERFECT';
  if (normalizedAbsDelta <= 0.15) return 'GOOD';
  if (normalizedAbsDelta <= 0.25) return 'MARGINAL';
  return 'LINK_WARNING';
}

// ---------------------------------------------------------------------------
// Composite score
// ---------------------------------------------------------------------------

export function getGrade(total: number): MissionGrade {
  if (total >= 95) return 'S';
  if (total >= 80) return 'A';
  if (total >= 65) return 'B';
  if (total >= 50) return 'C';
  if (total >= 35) return 'D';
  return 'LINK_DOWN';
}

export function getCertification(grade: MissionGrade): string {
  const certs: Record<MissionGrade, string> = {
    S: 'ECSS-E-ST-50-12C Compliant · Space Segment Qualified',
    A: 'Flight Heritage Candidate · TRL 7',
    B: 'Engineering Model · TRL 5',
    C: 'Prototype · TRL 4',
    D: 'Breadboard · TRL 3',
    LINK_DOWN: 'Link Synchronization Failed · Ground Test Required',
  };
  return certs[grade];
}

export function computeSignalIntegrityScore(
  normalizedJitter: number,
  normalizedSkew: number,
  ler: number,
): SignalIntegrityScore {
  const jitterScore = clamp(lerp(100, 0, normalizedJitter / 0.30), 0, 100);
  const skewScore = clamp(lerp(100, 0, Math.abs(normalizedSkew) / 0.25), 0, 100);
  const lerScore = clamp((1 - ler) * 100, 0, 100);

  const totalScore = jitterScore * 0.35 + skewScore * 0.25 + lerScore * 0.40;

  const grade = getGrade(totalScore);

  return {
    jitterScore: Math.round(jitterScore),
    skewScore: Math.round(skewScore),
    lerScore: Math.round(lerScore),
    totalScore: Math.round(totalScore),
    grade,
    certification: getCertification(grade),
  };
}

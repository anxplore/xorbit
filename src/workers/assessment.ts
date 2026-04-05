import type { AssessmentContext } from '../types/report.types';

export function generateAssessment(ctx: AssessmentContext): string {
  const lines: string[] = [];

  if (ctx.lerGrade === 'LOW' && ctx.jitterGrade === 'LOW') {
    lines.push(
      'Link synchronization maintained throughout the session. DS encoder logic executed with high fidelity.',
    );
  } else if (ctx.lerGrade === 'HIGH') {
    lines.push(
      'Multiple DS encoding violations detected. Strobe toggling logic requires review — the XOR rule was frequently misapplied.',
    );
  } else {
    lines.push(
      'Partial link integrity achieved. DS encoding logic was largely correct, but timing stability showed degradation.',
    );
  }

  if (ctx.skewBias !== 'NEUTRAL') {
    const direction = ctx.skewBias === 'LATE' ? 'positive' : 'negative';
    const correction = ctx.skewBias === 'LATE' ? 'reduce' : 'increase';
    lines.push(
      `Systematic ${direction} skew detected. This resembles propagation delay mismatch on a PCB trace. Consider adjusting your input offset to ${correction} latency compensation.`,
    );
  } else if (ctx.jitterGrade === 'HIGH') {
    lines.push(
      'High random jitter observed with no systematic bias — consistent with thermal noise or unstable clock source behavior in a real SpaceWire node.',
    );
  } else {
    lines.push(
      'Timing distribution centered near ideal edge with minimal systematic offset. Clock recovery would be stable in a real link.',
    );
  }

  if (ctx.consecutivePeak >= 20) {
    lines.push(
      `Peak of ${ctx.consecutivePeak} consecutive correct encodings — equivalent to ${(ctx.consecutivePeak * 10).toLocaleString()} error-free bits at 200Mbps.`,
    );
  }

  return lines.join(' ');
}

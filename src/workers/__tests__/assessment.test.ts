import { describe, it, expect } from 'vitest';
import { generateAssessment } from '../assessment';
import type { AssessmentContext } from '../../types/report.types';

describe('generateAssessment', () => {
  it('good LER + good jitter → high fidelity message', () => {
    const ctx: AssessmentContext = {
      jitterGrade: 'LOW',
      skewBias: 'NEUTRAL',
      lerGrade: 'LOW',
      consecutivePeak: 10,
    };
    const result = generateAssessment(ctx);
    expect(result).toContain('high fidelity');
    expect(result).toContain('Clock recovery would be stable');
  });

  it('high LER → encoding violations message', () => {
    const ctx: AssessmentContext = {
      jitterGrade: 'MID',
      skewBias: 'NEUTRAL',
      lerGrade: 'HIGH',
      consecutivePeak: 5,
    };
    const result = generateAssessment(ctx);
    expect(result).toContain('encoding violations');
  });

  it('mid-range → partial integrity message', () => {
    const ctx: AssessmentContext = {
      jitterGrade: 'MID',
      skewBias: 'NEUTRAL',
      lerGrade: 'MID',
      consecutivePeak: 10,
    };
    const result = generateAssessment(ctx);
    expect(result).toContain('Partial link integrity');
  });

  it('LATE skew → positive skew + reduce latency', () => {
    const ctx: AssessmentContext = {
      jitterGrade: 'LOW',
      skewBias: 'LATE',
      lerGrade: 'LOW',
      consecutivePeak: 10,
    };
    const result = generateAssessment(ctx);
    expect(result).toContain('positive skew');
    expect(result).toContain('reduce latency');
  });

  it('EARLY skew → negative skew + increase latency', () => {
    const ctx: AssessmentContext = {
      jitterGrade: 'LOW',
      skewBias: 'EARLY',
      lerGrade: 'LOW',
      consecutivePeak: 10,
    };
    const result = generateAssessment(ctx);
    expect(result).toContain('negative skew');
    expect(result).toContain('increase latency');
  });

  it('neutral skew + high jitter → thermal noise message', () => {
    const ctx: AssessmentContext = {
      jitterGrade: 'HIGH',
      skewBias: 'NEUTRAL',
      lerGrade: 'MID',
      consecutivePeak: 5,
    };
    const result = generateAssessment(ctx);
    expect(result).toContain('thermal noise');
  });

  it('consecutive peak >= 20 → bonus line with bit count', () => {
    const ctx: AssessmentContext = {
      jitterGrade: 'LOW',
      skewBias: 'NEUTRAL',
      lerGrade: 'LOW',
      consecutivePeak: 25,
    };
    const result = generateAssessment(ctx);
    expect(result).toContain('25 consecutive correct');
    expect(result).toContain('error-free bits');
  });

  it('consecutive peak < 20 → no bonus line', () => {
    const ctx: AssessmentContext = {
      jitterGrade: 'LOW',
      skewBias: 'NEUTRAL',
      lerGrade: 'LOW',
      consecutivePeak: 15,
    };
    const result = generateAssessment(ctx);
    expect(result).not.toContain('consecutive correct');
  });
});

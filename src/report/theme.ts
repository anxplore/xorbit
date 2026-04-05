import type { MissionGrade } from '../types/game.types';

export const REPORT_THEME = {
  background: '#0A0E1A',
  surface: 'var(--color-surface)',
  border: 'var(--color-border)',

  gradeColors: {
    S: 'var(--color-space-purple)',
    A: 'var(--color-industrial-blue)',
    B: 'var(--color-mars-orange)',
    C: 'var(--color-prototype-amber)',
    D: 'var(--color-breadboard-red)',
    LINK_DOWN: 'var(--color-static-grey)',
  } satisfies Record<MissionGrade, string>,

  dotColors: {
    PERFECT: 'var(--color-space-purple)',
    GOOD: 'var(--color-industrial-blue)',
    MARGINAL: 'var(--color-prototype-amber)',
    LINK_WARNING: 'var(--color-breadboard-red)',
    MISS: '#374151',
  },
} as const;

export function getGradeColor(grade: MissionGrade): string {
  return REPORT_THEME.gradeColors[grade];
}

export function getDotColor(hitGrade: string): string {
  return (REPORT_THEME.dotColors as Record<string, string>)[hitGrade] ?? REPORT_THEME.dotColors.MISS;
}

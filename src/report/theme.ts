import type { MissionGrade } from '../types/game.types';

export const REPORT_THEME = {
  background: '#0A0E1A',
  surface: '#111827',
  border: '#1E293B',

  gradeColors: {
    S: '#A855F7',
    A: '#3B82F6',
    B: '#10B981',
    C: '#F59E0B',
    D: '#EF4444',
    LINK_DOWN: '#6B7280',
  } satisfies Record<MissionGrade, string>,

  dotColors: {
    PERFECT: '#A855F7',
    GOOD: '#3B82F6',
    MARGINAL: '#F59E0B',
    LINK_WARNING: '#EF4444',
    MISS: '#374151',
  },
} as const;

export function getGradeColor(grade: MissionGrade): string {
  return REPORT_THEME.gradeColors[grade];
}

export function getDotColor(hitGrade: string): string {
  return (REPORT_THEME.dotColors as Record<string, string>)[hitGrade] ?? REPORT_THEME.dotColors.MISS;
}

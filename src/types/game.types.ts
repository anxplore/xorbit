export type GameMode = 'EASY' | 'ADVANCED';

export type SpeedLevel = 'SPEED_1' | 'SPEED_2' | 'SPEED_3';

export type StrobeLevel = 'HIGH' | 'LOW';

export type CueType = 'TOGGLE_REQUIRED' | 'HOLD_REQUIRED';

export type MissionGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'LINK_DOWN';

export type SkewBias = 'EARLY' | 'NEUTRAL' | 'LATE';

export interface SpeedConfig {
  label: string;
  trlLabel: string;
  bitRate_Mbps: number;
  bitPeriod_ms: number;
  scrollSpeed_px: number;
  bpm_equiv: number;
}

export interface EasyModeConfig {
  hitWindow_ms: number;
  maxLives: number;
  showNextCue: boolean;
  showStrobeLevel: boolean;
}

export interface AdvancedModeConfig {
  hitWindow_ms: number;
  maxLives: number;
  showDirectionHint: boolean;
  showStrobeLevel: boolean;
}

export interface CueMarker {
  type: CueType;
  idealTime: number;
  laneY: number;
  hitWindow: number;
}

export interface AdvancedCueMarker extends CueMarker {
  targetStrobeLevel: StrobeLevel;
  directionLabel: '↑' | '↓';
}

export interface GameConfig {
  mode: GameMode;
  speed: SpeedLevel;
  keymap: EasyKeymap | AdvancedKeymap;
  hitWindow: number;
  maxLives: number;
  bitPeriod: number;
  trlLabel: string;
}

export interface EasyKeymap {
  readonly TOGGLE: readonly string[];
}

export interface AdvancedKeymap {
  readonly SET_HIGH: readonly string[];
  readonly SET_LOW: readonly string[];
}

export interface HitRecord {
  idealEdgeTime: number;
  playerInputTime: number;
  delta: number;
  action: 'TOGGLE' | 'HOLD' | 'MISS';
  isCorrect: boolean;
}

export interface SessionSummary {
  totalOpportunities: number;
  correctHits: number;
  wrongActions: number;
  misses: number;
  consecutiveCorrectPeak: number;
}

export interface LivesSystem {
  maxLives: number;
  currentLives: number;
  errorTypes: {
    WRONG_ACTION: number;
    CONSECUTIVE_MISS: number;
  };
}

export type InputEvent =
  | { type: 'TOGGLE_STROBE'; timestamp: number }
  | { type: 'SET_STROBE_HIGH'; timestamp: number }
  | { type: 'SET_STROBE_LOW'; timestamp: number }
  | { type: 'REDUNDANT_INPUT'; timestamp: number };

import type {
  SpeedLevel,
  SpeedConfig,
  EasyModeConfig,
  AdvancedModeConfig,
} from '../types/game.types';

/**
 * bitPeriod_ms is the *gameplay* interval between beats (human-playable tempo).
 * The SpaceWire bit-rate labels are thematic only — real 100 Mbps = 10ns periods,
 * far too fast for human input. We scale to ~75–120 BPM rhythm range.
 */
export const SPEED_CONFIGS: Record<SpeedLevel, SpeedConfig> = {
  SPEED_1: {
    label: '100 Mbps',
    trlLabel: 'TRL-3  Prototype',
    bitRate_Mbps: 100,
    bitPeriod_ms: 800,
    scrollSpeed_px: 384,
    bpm_equiv: 75,
  },
  SPEED_2: {
    label: '150 Mbps',
    trlLabel: 'TRL-5  Engineering Model',
    bitRate_Mbps: 150,
    bitPeriod_ms: 600,
    scrollSpeed_px: 576,
    bpm_equiv: 100,
  },
  SPEED_3: {
    label: '200 Mbps',
    trlLabel: 'TRL-7 / ECSS  Flight Grade',
    bitRate_Mbps: 200,
    bitPeriod_ms: 500,
    scrollSpeed_px: 768,
    bpm_equiv: 120,
  },
};

export const EASY_MODE_SPEEDS: Record<SpeedLevel, EasyModeConfig> = {
  SPEED_1: { hitWindow_ms: 150, maxLives: 5, showNextCue: true, showStrobeLevel: true },
  SPEED_2: { hitWindow_ms: 120, maxLives: 4, showNextCue: true, showStrobeLevel: false },
  SPEED_3: { hitWindow_ms: 100, maxLives: 3, showNextCue: false, showStrobeLevel: false },
};

export const ADVANCED_MODE_SPEEDS: Record<SpeedLevel, AdvancedModeConfig> = {
  SPEED_1: { hitWindow_ms: 130, maxLives: 4, showDirectionHint: true, showStrobeLevel: true },
  SPEED_2: { hitWindow_ms: 100, maxLives: 3, showDirectionHint: true, showStrobeLevel: false },
  SPEED_3: { hitWindow_ms: 80, maxLives: 3, showDirectionHint: false, showStrobeLevel: false },
};

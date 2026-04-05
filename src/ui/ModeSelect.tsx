import type { GameMode, SpeedLevel, GameConfig } from '../types/game.types';
import { buildGameConfig } from '../config/gameConfig';
import ModeCard from './ModeCard';

interface ModeSelectProps {
  onStart: (config: GameConfig) => void;
}

const EASY_SPEEDS = [
  { speed: 'SPEED_1' as SpeedLevel, trlLabel: 'TRL-3  Prototype' },
  { speed: 'SPEED_2' as SpeedLevel, trlLabel: 'TRL-5  Engineering Model' },
  { speed: 'SPEED_3' as SpeedLevel, trlLabel: 'TRL-7  Flight Heritage' },
];

const ADVANCED_SPEEDS = [
  { speed: 'SPEED_1' as SpeedLevel, trlLabel: 'TRL-5  Engineering Model' },
  { speed: 'SPEED_2' as SpeedLevel, trlLabel: 'TRL-7  Flight Heritage' },
  { speed: 'SPEED_3' as SpeedLevel, trlLabel: 'ECSS  Space Grade' },
];

const showOnboardingHint = () => {
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem('xor_onboarding_done');
};

export default function ModeSelect({ onStart }: ModeSelectProps) {
  const handleSelect = (mode: GameMode, speed: SpeedLevel) => {
    const config = buildGameConfig(mode, speed);
    onStart(config);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <h1 className="mb-2 text-center font-orbitron text-3xl font-bold tracking-widest text-white md:text-4xl">
        SELECT MISSION PROFILE
      </h1>
      <p className="mb-10 text-center text-sm text-gray-400">
        Choose your control scheme and link speed
      </p>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        <ModeCard
          mode="EASY"
          title="EASY MODE"
          subtitle="空白鍵翻轉"
          keyBadge="[SPACE] = Toggle"
          accentColor="#3B82F6"
          speedOptions={EASY_SPEEDS}
          defaultSpeed="SPEED_1"
          onSelect={handleSelect}
        />
        <ModeCard
          mode="ADVANCED"
          title="ADVANCED MODE"
          subtitle="上下鍵控制電位"
          keyBadge="[↑] = HIGH  [↓] = LOW"
          accentColor="#A855F7"
          speedOptions={ADVANCED_SPEEDS}
          defaultSpeed="SPEED_1"
          onSelect={handleSelect}
        />
      </div>

      {showOnboardingHint() && (
        <p className="mt-6 text-center text-sm text-gray-500">
          💡 建議新手從 Easy · 100 Mbps 開始
        </p>
      )}
    </div>
  );
}

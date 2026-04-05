import { useState } from 'react';
import type { GameMode, SpeedLevel } from '../types/game.types';
import SpeedSelector from './SpeedSelector';

interface SpeedOption {
  speed: SpeedLevel;
  trlLabel: string;
}

interface ModeCardProps {
  mode: GameMode;
  title: string;
  subtitle: string;
  keyBadge: string;
  accentColor: string;
  speedOptions: SpeedOption[];
  defaultSpeed: SpeedLevel;
  onSelect: (mode: GameMode, speed: SpeedLevel) => void;
}

export default function ModeCard({
  mode,
  title,
  subtitle,
  keyBadge,
  accentColor,
  speedOptions,
  defaultSpeed,
  onSelect,
}: ModeCardProps) {
  const [selectedSpeed, setSelectedSpeed] = useState<SpeedLevel>(defaultSpeed);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative flex flex-col rounded-2xl border p-6 transition-all duration-300 bg-surface"
      style={{
        borderColor: isHovered ? accentColor : '#1E293B',
        boxShadow: isHovered ? `0 0 30px ${accentColor}30, 0 0 60px ${accentColor}15` : 'none',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2
        className="text-xl font-bold font-orbitron tracking-wider mb-1"
        style={{ color: accentColor }}
      >
        {title}
      </h2>
      <p className="text-sm text-gray-400 mb-4">{subtitle}</p>

      <div
        className="inline-flex items-center gap-2 self-start rounded-lg border px-3 py-1.5 mb-6 font-mono text-sm"
        style={{ borderColor: `${accentColor}50`, color: accentColor }}
      >
        {keyBadge}
      </div>

      <SpeedSelector
        options={speedOptions}
        selected={selectedSpeed}
        accentColor={accentColor}
        onChange={setSelectedSpeed}
      />

      <button
        className="mt-6 w-full rounded-xl py-3 font-orbitron text-sm font-bold tracking-widest
                   text-white transition-all duration-200 hover:brightness-110
                   focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          backgroundColor: accentColor,
          outlineColor: accentColor,
        }}
        onClick={() => onSelect(mode, selectedSpeed)}
      >
        SELECT
      </button>
    </div>
  );
}

import { useRef, useEffect } from 'react';
import type { SpeedLevel } from '../types/game.types';
import { SPEED_CONFIGS } from '../config/speeds';

interface SpeedOption {
  speed: SpeedLevel;
  trlLabel: string;
}

interface SpeedSelectorProps {
  options: SpeedOption[];
  selected: SpeedLevel;
  accentColor: string;
  onChange: (speed: SpeedLevel) => void;
}

export default function SpeedSelector({
  options,
  selected,
  accentColor,
  onChange,
}: SpeedSelectorProps) {
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const idx = options.findIndex((o) => o.speed === selected);
    if (idx >= 0) radioRefs.current[idx]?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Speed selection">
      {options.map((opt, i) => {
        const speedCfg = SPEED_CONFIGS[opt.speed];
        const isSelected = opt.speed === selected;

        return (
          <button
            key={opt.speed}
            ref={(el) => { radioRefs.current[i] = el; }}
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-left
                       hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              outlineColor: isSelected ? accentColor : undefined,
              backgroundColor: isSelected ? `${accentColor}15` : undefined,
            }}
            onClick={() => onChange(opt.speed)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                const next = (i + 1) % options.length;
                onChange(options[next].speed);
                radioRefs.current[next]?.focus();
              } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev = (i - 1 + options.length) % options.length;
                onChange(options[prev].speed);
                radioRefs.current[prev]?.focus();
              }
            }}
          >
            <span
              className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200"
              style={{ borderColor: isSelected ? accentColor : '#4B5563' }}
            >
              {isSelected && (
                <span
                  className="w-2 h-2 rounded-full transition-transform duration-200 scale-100"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-white">{speedCfg.label}</span>
              <span className="text-xs text-gray-400">{opt.trlLabel}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

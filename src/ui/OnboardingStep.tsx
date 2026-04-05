import { useEffect, useRef } from 'react';

interface OnboardingStepProps {
  stepIndex: number;
  title: string;
  description: string;
  highlightLane?: 'data' | 'strobe' | 'clock';
  accentColor: string;
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
  isLast?: boolean;
  children?: React.ReactNode;
}

export default function OnboardingStep({
  stepIndex,
  title,
  description,
  highlightLane,
  accentColor,
  isActive,
  onNext,
  onSkip,
  isLast = false,
  children,
}: OnboardingStepProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isActive]);

  if (!isActive) return null;

  const laneLabels: Record<string, string> = {
    data: 'DATA LANE',
    strobe: 'STROBE LANE',
    clock: 'RECOVERED CLOCK',
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-50 flex items-center justify-center"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNext();
        } else if (e.key === 'Escape') {
          onSkip();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Highlighted lane indicator */}
      {highlightLane && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
          style={{
            top: highlightLane === 'data' ? '15%' : highlightLane === 'strobe' ? '45%' : '75%',
            height: '60px',
          }}
        >
          <div
            className="w-full max-w-4xl h-full rounded-lg border-2 opacity-80"
            style={{
              borderColor: accentColor,
              boxShadow: `0 0 20px ${accentColor}40, inset 0 0 20px ${accentColor}10`,
            }}
          />
          <span
            className="absolute left-8 font-orbitron text-xs tracking-widest"
            style={{ color: accentColor }}
          >
            {laneLabels[highlightLane]}
          </span>
        </div>
      )}

      {/* Content card */}
      <div className="relative z-10 max-w-lg rounded-2xl border border-white/10 bg-surface/95 p-8 backdrop-blur-sm shadow-2xl">
        <span
          className="mb-2 inline-block font-orbitron text-xs tracking-widest"
          style={{ color: accentColor }}
        >
          STEP {stepIndex + 1}
        </span>
        <h3 className="mb-3 font-orbitron text-xl font-bold text-white">{title}</h3>
        <p className="mb-6 text-sm leading-relaxed text-gray-300">{description}</p>

        {children && <div className="mb-6">{children}</div>}

        <div className="flex items-center justify-between">
          <button
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            onClick={onSkip}
          >
            Skip Tutorial [ESC]
          </button>
          <button
            className="rounded-lg px-6 py-2 font-orbitron text-sm font-bold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: accentColor }}
            onClick={onNext}
          >
            {isLast ? 'START MISSION' : 'NEXT'}
          </button>
        </div>
      </div>
    </div>
  );
}

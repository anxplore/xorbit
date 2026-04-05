import { useEffect, useRef, useState } from 'react';
import type { ReportPayload } from '../types/report.types';
import GradeBadge from './GradeBadge';
import MetricPill from './MetricPill';
import { getGradeColor } from './theme';

interface ScoreCardProps {
  payload: ReportPayload;
  animate?: boolean;
  onAnimationComplete?: () => void;
}

function useCountUp(target: number, duration: number, startDelay: number, enabled: boolean): number {
  const [current, setCurrent] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      setCurrent(target);
      return;
    }

    let startTime: number | null = null;
    let raf: number;
    let delayTimer: ReturnType<typeof setTimeout>;

    delayTimer = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        setCurrent(Math.round(eased * target));

        if (progress < 1) {
          raf = requestAnimationFrame(step);
        }
      };
      raf = requestAnimationFrame(step);
    }, startDelay);

    return () => {
      clearTimeout(delayTimer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, startDelay, enabled]);

  return current;
}

export default function ScoreCard({ payload, animate = true, onAnimationComplete }: ScoreCardProps) {
  const { score, metrics, gameConfig } = payload;
  const gradeColor = getGradeColor(score.grade);
  const [animDone, setAnimDone] = useState(!animate);

  const displayScore = useCountUp(score.totalScore, 1200, 600, animate);

  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => {
      setAnimDone(true);
      onAnimationComplete?.();
    }, 2500);
    return () => clearTimeout(timer);
  }, [animate, onAnimationComplete]);

  const modeLabel = gameConfig.mode === 'EASY' ? 'Easy' : 'Advanced';
  const isLinkDown = score.grade === 'LINK_DOWN';
  const statusText = isLinkDown ? 'LINK DOWN' : 'MISSION COMPLETE';

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status banner */}
      <div
        className="font-orbitron text-sm tracking-[0.3em] transition-opacity duration-500"
        style={{ color: gradeColor, opacity: animate ? (animDone ? 1 : 0.7) : 1 }}
      >
        {statusText}
      </div>

      {/* Grade badge */}
      <GradeBadge grade={score.grade} animate={animate} />

      {/* Title + score */}
      <div className="text-center">
        <h2 className="mb-1 font-orbitron text-lg tracking-wider text-gray-300">
          SIGNAL INTEGRITY REPORT
        </h2>
        <p className="text-xs text-gray-500">
          {modeLabel} · {gameConfig.trlLabel}
        </p>
        <p
          className="mt-3 font-orbitron text-4xl font-bold transition-colors duration-300"
          style={{ color: gradeColor }}
        >
          {displayScore}
          <span className="text-lg text-gray-500"> / 100</span>
        </p>
      </div>

      {/* Metric pills */}
      <div className="grid w-full max-w-lg grid-cols-3 gap-3">
        <MetricPill
          label="JITTER"
          value={`${(metrics.jitter.normalized * 100).toFixed(1)}%`}
          subValue={`${score.jitterScore} pts`}
          accentColor={gradeColor}
          delay={800}
          animate={animate}
        />
        <MetricPill
          label="SKEW"
          value={`${metrics.skew.normalized >= 0 ? '+' : ''}${(metrics.skew.normalized * 100).toFixed(1)}%`}
          subValue={`${score.skewScore} pts`}
          accentColor={gradeColor}
          delay={950}
          animate={animate}
        />
        <MetricPill
          label="LER"
          value={`${(metrics.ler.value * 100).toFixed(1)}%`}
          subValue={`${score.lerScore} pts`}
          accentColor={gradeColor}
          delay={1100}
          animate={animate}
        />
      </div>
    </div>
  );
}

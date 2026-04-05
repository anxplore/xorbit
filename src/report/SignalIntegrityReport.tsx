import { useState, useCallback } from 'react';
import type { ReportPayload } from '../types/report.types';
import ScoreCard from './ScoreCard';
import JitterScatterPlot from './JitterScatterPlot';
import SkewAnalysis from './SkewAnalysis';
import { shareReport } from './ShareReport';

interface SignalIntegrityReportProps {
  payload: ReportPayload;
  onRetry: () => void;
  onBack: () => void;
}

export default function SignalIntegrityReport({ payload, onRetry, onBack }: SignalIntegrityReportProps) {
  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      await shareReport(payload);
    } catch {
      // Silently fail — user likely cancelled
    } finally {
      setSharing(false);
    }
  }, [payload]);

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-10">
        {/* Score card with grade badge and metric pills */}
        <ScoreCard
          payload={payload}
          animate
          onAnimationComplete={() => setCtaEnabled(true)}
        />

        {/* Jitter scatter plot */}
        <JitterScatterPlot data={payload.distribution} animate />

        {/* Skew analysis */}
        <SkewAnalysis
          normalizedSkew={payload.metrics.skew.normalized}
          bias={payload.metrics.skew.bias}
          suggestedOffset_ms={payload.metrics.skew.suggestedOffset_ms}
          animate
        />

        {/* Engineer's assessment */}
        <div
          className="rounded-xl border border-white/5 bg-surface/50 p-6"
          style={{ animation: 'fadeSlideUp 0.6s 2.2s both' }}
        >
          <h3 className="mb-3 font-orbitron text-xs tracking-widest text-gray-400">
            ENGINEER&apos;S ASSESSMENT
          </h3>
          <p className="text-sm leading-relaxed text-gray-300">
            {payload.assessment}
          </p>
        </div>

        {/* Certification */}
        <div
          className="text-center"
          style={{ animation: 'fadeSlideUp 0.6s 2.4s both' }}
        >
          <h3 className="mb-2 font-orbitron text-xs tracking-widest text-gray-400">
            CERTIFICATION
          </h3>
          <p className="font-orbitron text-sm tracking-wide text-gray-300">
            {payload.score.certification}
          </p>
        </div>

        {/* CTA buttons */}
        <div
          className="flex flex-wrap items-center justify-center gap-4 pb-8"
          style={{ animation: 'fadeSlideUp 0.5s 2.5s both' }}
        >
          <button
            className="rounded-lg border border-white/10 px-8 py-3 font-orbitron text-sm tracking-wider
                       text-white transition-all hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={!ctaEnabled}
            onClick={onRetry}
          >
            RETRY
          </button>
          <button
            className="rounded-lg border border-space-purple/30 bg-space-purple/10 px-8 py-3 font-orbitron text-sm
                       tracking-wider text-space-purple transition-all hover:bg-space-purple/20
                       disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={!ctaEnabled || sharing}
            onClick={handleShare}
          >
            {sharing ? 'GENERATING...' : 'SHARE REPORT'}
          </button>
          <button
            className="rounded-lg border border-white/5 px-8 py-3 font-orbitron text-sm tracking-wider
                       text-gray-500 transition-all hover:text-gray-300 hover:bg-white/5
                       disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={!ctaEnabled}
            onClick={onBack}
          >
            MODE SELECT
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

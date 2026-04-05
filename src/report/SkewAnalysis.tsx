import type { SkewBias } from '../types/game.types';

interface SkewAnalysisProps {
  normalizedSkew: number;
  bias: SkewBias;
  suggestedOffset_ms: number;
  animate?: boolean;
}

const BIAS_COLORS: Record<SkewBias, string> = {
  EARLY: 'var(--color-industrial-blue)',
  NEUTRAL: 'var(--color-mars-orange)',
  LATE: 'var(--color-prototype-amber)',
};

const BIAS_LABELS: Record<SkewBias, string> = {
  EARLY: 'Early Bias',
  NEUTRAL: 'Centered',
  LATE: 'Late Bias',
};

export default function SkewAnalysis({
  normalizedSkew,
  bias,
  suggestedOffset_ms,
  animate = true,
}: SkewAnalysisProps) {
  const color = BIAS_COLORS[bias];
  const svgW = 480;
  const svgH = 100;
  const centerX = svgW / 2;
  const scaleY = 55;
  const trackY = scaleY;
  const trackLeft = 60;
  const trackRight = svgW - 60;
  const trackW = trackRight - trackLeft;

  const clampedSkew = Math.max(-0.5, Math.min(0.5, normalizedSkew));
  const arrowX = centerX + (clampedSkew / 0.5) * (trackW / 2);

  const showArrow = bias !== 'NEUTRAL';
  const skewPercent = (normalizedSkew * 100).toFixed(1);
  const sign = normalizedSkew >= 0 ? '+' : '';

  return (
    <div className="w-full">
      <h3 className="mb-3 font-orbitron text-xs tracking-widest text-gray-400">
        SKEW ANALYSIS
      </h3>

      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full max-w-lg"
        style={{ overflow: 'visible' }}
      >
        {/* Track line */}
        <line
          x1={trackLeft} y1={trackY} x2={trackRight} y2={trackY}
          stroke="#374151" strokeWidth="2"
        />

        {/* Center marker */}
        <line
          x1={centerX} y1={trackY - 12} x2={centerX} y2={trackY + 12}
          stroke="var(--color-static-grey)" strokeWidth="1.5"
        />

        {/* Edge markers */}
        <line x1={trackLeft} y1={trackY - 8} x2={trackLeft} y2={trackY + 8} stroke="#374151" strokeWidth="1" />
        <line x1={trackRight} y1={trackY - 8} x2={trackRight} y2={trackY + 8} stroke="#374151" strokeWidth="1" />

        {/* Labels */}
        <text x={trackLeft} y={trackY - 16} textAnchor="middle" fill="var(--color-static-grey)" fontSize="11" fontFamily="Inter, sans-serif">
          EARLY
        </text>
        <text x={centerX} y={trackY - 16} textAnchor="middle" fill="#9CA3AF" fontSize="11" fontFamily="Inter, sans-serif">
          IDEAL
        </text>
        <text x={trackRight} y={trackY - 16} textAnchor="middle" fill="var(--color-static-grey)" fontSize="11" fontFamily="Inter, sans-serif">
          LATE
        </text>

        {/* Arrow / dot indicator */}
        {showArrow ? (
          <g
            style={{
              opacity: animate ? undefined : 1,
              animation: animate ? 'skewFadeIn 0.6s 2.0s both' : undefined,
            }}
          >
            {/* Arrow line from center to skew position */}
            <line
              x1={centerX} y1={trackY}
              x2={arrowX} y2={trackY}
              stroke={color} strokeWidth="3" strokeLinecap="round"
            />
            {/* Arrowhead */}
            <polygon
              points={
                normalizedSkew > 0
                  ? `${arrowX + 8},${trackY} ${arrowX - 2},${trackY - 5} ${arrowX - 2},${trackY + 5}`
                  : `${arrowX - 8},${trackY} ${arrowX + 2},${trackY - 5} ${arrowX + 2},${trackY + 5}`
              }
              fill={color}
            />
            {/* Dot at arrow tip */}
            <circle cx={arrowX} cy={trackY} r="4" fill={color} />
          </g>
        ) : (
          <circle
            cx={centerX} cy={trackY} r="5" fill={color}
            style={{
              animation: animate ? 'skewFadeIn 0.6s 2.0s both' : undefined,
            }}
          />
        )}

        {/* Value annotation */}
        <text
          x={centerX} y={trackY + 32}
          textAnchor="middle" fill={color} fontSize="13"
          fontFamily="'Orbitron', monospace" fontWeight="bold"
          style={{
            animation: animate ? 'skewFadeIn 0.6s 2.2s both' : undefined,
          }}
        >
          Skew: {sign}{skewPercent}% Bit Period ({BIAS_LABELS[bias]})
        </text>
      </svg>

      {/* Offset suggestion */}
      {bias !== 'NEUTRAL' && (
        <p
          className="mt-2 text-center text-xs text-gray-500"
          style={{ animation: animate ? 'skewFadeIn 0.6s 2.4s both' : undefined }}
        >
          Suggested Input Offset adjustment: {suggestedOffset_ms > 0 ? '+' : ''}{suggestedOffset_ms.toFixed(1)} ms
        </p>
      )}

      {bias === 'NEUTRAL' && (
        <p
          className="mt-2 text-center text-xs text-orange-400/70"
          style={{ animation: animate ? 'skewFadeIn 0.6s 2.4s both' : undefined }}
        >
          Timing Centered — no offset compensation needed
        </p>
      )}

      <style>{`
        @keyframes skewFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

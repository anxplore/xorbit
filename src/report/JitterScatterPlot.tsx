import { useEffect, useRef } from 'react';
import { resolveCssColorForCanvas } from '../lib/canvasColor';
import { getDotColor } from './theme';

interface DataPoint {
  time: number;
  delta: number;
  grade: string;
}

interface JitterScatterPlotProps {
  data: DataPoint[];
  animate?: boolean;
}

const PADDING = { top: 24, right: 60, bottom: 36, left: 56 };
const Y_RANGE = 0.5; // ±0.5 bit periods
const GRADE_LINE_VARS = [
  { y: 0.05, css: 'var(--color-space-purple)', label: 'Space' },
  { y: 0.15, css: 'var(--color-industrial-blue)', label: 'Industrial' },
  { y: 0.25, css: 'var(--color-prototype-amber)', label: 'Warning' },
] as const;

export default function JitterScatterPlot({ data, animate = true }: JitterScatterPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const plotW = w - PADDING.left - PADDING.right;
    const plotH = h - PADDING.top - PADDING.bottom;
    const maxTime = data.length > 0 ? Math.max(...data.map((d) => d.time)) : 1;

    const toX = (t: number) => PADDING.left + (t / maxTime) * plotW;
    const toY = (d: number) => PADDING.top + ((Y_RANGE - d) / (2 * Y_RANGE)) * plotH;

    let revealProgress = animate ? 0 : 1;
    const animSpeed = 0.025;

    function drawFrame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0A0E1A';
      ctx.fillRect(0, 0, w, h);

      const surface = resolveCssColorForCanvas('var(--color-surface)');
      const labelMuted = resolveCssColorForCanvas('var(--color-static-grey)');
      const gradeLines = GRADE_LINE_VARS.map((g) => ({ ...g, color: resolveCssColorForCanvas(g.css) }));

      // Grid area
      ctx.fillStyle = surface;
      ctx.fillRect(PADDING.left, PADDING.top, plotW, plotH);

      // Center line (ideal edge)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, toY(0));
      ctx.lineTo(PADDING.left + plotW, toY(0));
      ctx.stroke();

      // Grade boundary lines (±)
      for (const gl of gradeLines) {
        ctx.strokeStyle = gl.color;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 4]);

        for (const sign of [1, -1]) {
          const y = toY(gl.y * sign);
          ctx.beginPath();
          ctx.moveTo(PADDING.left, y);
          ctx.lineTo(PADDING.left + plotW, y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // Y-axis labels
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = labelMuted;
      for (const val of [-0.25, -0.15, -0.05, 0, 0.05, 0.15, 0.25]) {
        const y = toY(val);
        const label = val === 0 ? '0' : `${val > 0 ? '+' : ''}${(val * 100).toFixed(0)}%`;
        ctx.fillText(label, PADDING.left - 6, y);
      }

      // X-axis label
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#4B5563';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('Time →', PADDING.left + plotW / 2, PADDING.top + plotH + 14);

      // Y-axis title
      ctx.save();
      ctx.translate(12, PADDING.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4B5563';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('δ / Bit Period', 0, 0);
      ctx.restore();

      // Grade labels on right side
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (const gl of gradeLines) {
        ctx.fillStyle = gl.color;
        ctx.font = '9px Inter, sans-serif';
        const y = toY(gl.y);
        ctx.fillText(gl.label, PADDING.left + plotW + 4, y);
      }

      // Data points
      const visibleCount = Math.floor(revealProgress * data.length);
      for (let i = 0; i < visibleCount; i++) {
        const pt = data[i];
        if (pt.grade === 'MISS') continue;

        const x = toX(pt.time);
        const y = toY(Math.max(-Y_RANGE, Math.min(Y_RANGE, pt.delta)));
        const dotColor = resolveCssColorForCanvas(getDotColor(pt.grade));

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      }

      if (revealProgress < 1) {
        revealProgress = Math.min(1, revealProgress + animSpeed);
        animRef.current = requestAnimationFrame(drawFrame);
      }
    }

    animRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(animRef.current);
  }, [data, animate]);

  return (
    <div className="w-full">
      <h3 className="mb-3 font-orbitron text-xs tracking-widest text-gray-400">
        JITTER DISTRIBUTION
      </h3>
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border border-white/5"
        style={{ height: 220 }}
      />
    </div>
  );
}

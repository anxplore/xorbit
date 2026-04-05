import { useEffect, useRef } from 'react';

interface WaveformDemoProps {
  scenario: 'data-hold-strobe-toggle' | 'data-toggle-strobe-hold';
  width?: number;
  height?: number;
}

/**
 * Draws a simple animated DS waveform demonstration.
 * Two scenarios illustrate the core XOR rule.
 */
export default function WaveformDemo({
  scenario,
  width = 400,
  height = 160,
}: WaveformDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let progress = 0;
    const speed = 0.015;

    const dataHold = scenario === 'data-hold-strobe-toggle';

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const laneH = height / 3;
      const midY = laneH / 2;
      const amp = laneH * 0.3;
      const segW = width / 4;
      const maxX = progress * width;

      const drawWave = (yBase: number, levels: number[]) => {
        ctx.beginPath();
        for (let i = 0; i < levels.length; i++) {
          const x0 = i * segW;
          const x1 = (i + 1) * segW;
          const y = yBase + midY + (levels[i] === 1 ? -amp : amp);

          if (x0 > maxX) break;
          const clampedX1 = Math.min(x1, maxX);

          if (i === 0) ctx.moveTo(x0, y);
          else ctx.lineTo(x0, y);
          ctx.lineTo(clampedX1, y);

          if (i < levels.length - 1 && clampedX1 >= x1) {
            const nextY = yBase + midY + (levels[i + 1] === 1 ? -amp : amp);
            if (nextY !== y) {
              ctx.lineTo(x1, nextY);
            }
          }
        }
        ctx.stroke();
      };

      const dataLevels = dataHold ? [1, 1, 1, 1] : [0, 1, 1, 0];
      const strobeLevels = dataHold ? [0, 1, 0, 1] : [0, 0, 0, 0];
      const clockLevels: number[] = [];
      for (let i = 0; i < 4; i++) {
        clockLevels.push(dataLevels[i] ^ strobeLevels[i]);
      }

      // Data lane
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 2;
      drawWave(0, dataLevels);

      // Strobe lane
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2.5;
      drawWave(laneH, strobeLevels);

      // Clock lane
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 2;
      drawWave(laneH * 2, clockLevels);

      // Labels
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Data', 4, 14);
      ctx.fillStyle = '#3B82F6';
      ctx.fillText('Strobe', 4, laneH + 14);
      ctx.fillStyle = '#A855F7';
      ctx.fillText('D ⊕ S', 4, laneH * 2 + 14);

      if (progress < 1) {
        progress += speed;
        animRef.current = requestAnimationFrame(draw);
      }
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [scenario, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="rounded-lg border border-white/10 bg-black/30"
    />
  );
}

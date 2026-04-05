import { useEffect, useRef, useState } from 'react';
import type { MissionGrade } from '../types/game.types';
import { getGradeColor } from './theme';

interface GradeBadgeProps {
  grade: MissionGrade;
  animate?: boolean;
}

export default function GradeBadge({ grade, animate = true }: GradeBadgeProps) {
  const color = getGradeColor(grade);
  const [visible, setVisible] = useState(!animate);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, [animate]);

  const isLinkDown = grade === 'LINK_DOWN';
  const label = isLinkDown ? 'LINK DOWN' : grade;

  return (
    <div className="relative flex items-center justify-center">
      {/* Full-screen glow for grade S */}
      {grade === 'S' && visible && (
        <div
          className="pointer-events-none fixed inset-0 z-0 animate-pulse"
          style={{
            background: `radial-gradient(ellipse at center, ${color}18 0%, transparent 70%)`,
          }}
        />
      )}

      <div
        ref={badgeRef}
        className="relative z-10 flex items-center justify-center rounded-2xl border-2 px-8 py-4 font-orbitron font-black transition-all duration-600"
        style={{
          borderColor: color,
          color,
          fontSize: isLinkDown ? '1.5rem' : '3rem',
          boxShadow: visible ? `0 0 40px ${color}50, 0 0 80px ${color}25` : 'none',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0)',
          letterSpacing: '0.15em',
        }}
      >
        {/* Static noise overlay for LINK_DOWN */}
        {isLinkDown && visible && (
          <div
            className="absolute inset-0 rounded-2xl opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: '100px',
              animation: 'noiseShift 0.15s steps(3) infinite',
            }}
          />
        )}
        {label}
      </div>

      <style>{`
        @keyframes noiseShift {
          0% { background-position: 0 0; }
          33% { background-position: 30px -20px; }
          66% { background-position: -15px 25px; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
}

import { useEffect, useState } from 'react';

interface MetricPillProps {
  label: string;
  value: string;
  subValue: string;
  accentColor: string;
  delay?: number;
  animate?: boolean;
}

export default function MetricPill({
  label,
  value,
  subValue,
  accentColor,
  delay = 0,
  animate = true,
}: MetricPillProps) {
  const [visible, setVisible] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [animate, delay]);

  return (
    <div
      className="flex flex-col items-center rounded-xl border px-6 py-4 transition-all duration-500"
      style={{
        borderColor: visible ? `${accentColor}40` : 'transparent',
        backgroundColor: visible ? `${accentColor}08` : 'transparent',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <span
        className="mb-1 font-orbitron text-xs tracking-widest"
        style={{ color: accentColor }}
      >
        {label}
      </span>
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="mt-1 text-xs text-gray-400">{subValue}</span>
    </div>
  );
}

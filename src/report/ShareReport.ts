import type { ReportPayload } from '../types/report.types';
import { getGradeColor } from './theme';

const CARD_W = 1200;
const CARD_H = 630;

export async function generateShareImage(payload: ReportPayload): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0A0E1A';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Subtle gradient overlay
  const grad = ctx.createRadialGradient(CARD_W / 2, CARD_H / 2, 0, CARD_W / 2, CARD_H / 2, 500);
  const gradeColor = getGradeColor(payload.score.grade);
  grad.addColorStop(0, gradeColor + '15');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Border
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, CARD_W - 2, CARD_H - 2);

  const cx = CARD_W / 2;

  // Grade badge
  ctx.font = 'bold 96px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = gradeColor;
  const gradeLabel = payload.score.grade === 'LINK_DOWN' ? 'LINK DOWN' : payload.score.grade;
  if (payload.score.grade === 'LINK_DOWN') {
    ctx.font = 'bold 56px Orbitron, monospace';
  }
  ctx.fillText(gradeLabel, cx, 130);

  // Title
  ctx.font = '18px Orbitron, monospace';
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('SIGNAL INTEGRITY REPORT', cx, 200);

  // Mode label
  const modeLabel = `${payload.gameConfig.mode === 'EASY' ? 'Easy' : 'Advanced'} · ${payload.gameConfig.trlLabel}`;
  ctx.font = '14px Inter, sans-serif';
  ctx.fillStyle = '#6B7280';
  ctx.fillText(modeLabel, cx, 230);

  // Score
  ctx.font = 'bold 64px Orbitron, monospace';
  ctx.fillStyle = gradeColor;
  ctx.fillText(`${payload.score.totalScore}`, cx - 30, 310);
  ctx.font = '24px Orbitron, monospace';
  ctx.fillStyle = '#6B7280';
  ctx.fillText('/ 100', cx + 60, 310);

  // Three metric cards
  const metrics = [
    { label: 'JITTER', value: `${(payload.metrics.jitter.normalized * 100).toFixed(1)}%`, pts: `${payload.score.jitterScore} pts` },
    { label: 'SKEW', value: `${payload.metrics.skew.normalized >= 0 ? '+' : ''}${(payload.metrics.skew.normalized * 100).toFixed(1)}%`, pts: `${payload.score.skewScore} pts` },
    { label: 'LER', value: `${(payload.metrics.ler.value * 100).toFixed(1)}%`, pts: `${payload.score.lerScore} pts` },
  ];

  const cardW = 280;
  const cardGap = 40;
  const totalW = cardW * 3 + cardGap * 2;
  const startX = (CARD_W - totalW) / 2;

  for (let i = 0; i < metrics.length; i++) {
    const m = metrics[i];
    const x = startX + i * (cardW + cardGap);
    const y = 370;

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, 100, 12);
    ctx.fill();
    ctx.strokeStyle = gradeColor + '30';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, 100, 12);
    ctx.stroke();

    ctx.font = '12px Orbitron, monospace';
    ctx.fillStyle = gradeColor;
    ctx.textAlign = 'center';
    ctx.fillText(m.label, x + cardW / 2, y + 28);

    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(m.value, x + cardW / 2, y + 58);

    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(m.pts, x + cardW / 2, y + 82);
  }

  // Certification
  ctx.font = '14px Orbitron, monospace';
  ctx.fillStyle = '#9CA3AF';
  ctx.textAlign = 'center';
  ctx.fillText(payload.score.certification, cx, 520);

  // Watermark
  ctx.font = '12px Inter, sans-serif';
  ctx.fillStyle = '#4B556340';
  ctx.fillText('XORbit · anxplore.space/lab/xorbit', cx, CARD_H - 30);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png',
    );
  });
}

export async function shareReport(payload: ReportPayload): Promise<void> {
  const blob = await generateShareImage(payload);
  const filename = buildFilename(payload);

  // Try Web Share API first (mobile)
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: 'image/png' });
    const shareData: ShareData = {
      title: `XORbit Report — Grade ${payload.score.grade}`,
      text: `Signal Integrity Score: ${payload.score.totalScore}/100 — ${payload.score.certification}`,
      files: [file],
    };

    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share failed — fall through to download
      }
    }
  }

  // Fallback: download PNG
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildFilename(payload: ReportPayload): string {
  const grade = payload.score.grade.replace('_', '-');
  const score = payload.score.totalScore;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `XORbit-report-${grade}-${score}-${date}.png`;
}

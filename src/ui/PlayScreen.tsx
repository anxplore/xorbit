import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameConfig } from '../types/game.types';
import type { ReportPayload } from '../types/report.types';
import { GameLoop } from '../game/GameLoop';
import { GameRenderer } from '../game/GameRenderer';
import { InputHandler } from '../game/InputHandler';
import {
  calculateJitter,
  calculateSkew,
  classifySkew,
  calculateLER,
  computeSignalIntegrityScore,
  getJitterGradeLabel,
  getLERLabel,
  getHitGrade,
} from '../workers/metrics';
import { generateAssessment } from '../workers/assessment';

interface PlayScreenProps {
  config: GameConfig;
  onGameEnd: (payload: ReportPayload) => void;
  onQuit: () => void;
}

export default function PlayScreen({ config, onGameEnd, onQuit }: PlayScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const inputRef = useRef<InputHandler | null>(null);
  const rafRef = useRef<number>(0);
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const [lives, setLives] = useState(config.maxLives);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Build report payload from game data
  const buildReport = useCallback((loop: GameLoop): ReportPayload => {
    const collector = loop.getCollector();
    const records = [...collector.getRecords()];
    const summary = collector.getSummary();
    const bp = config.bitPeriod;

    // Detect zero player input: no TOGGLE actions recorded at all
    const playerActed = records.some((r) => r.action === 'TOGGLE');

    const normalizedJitter = playerActed ? calculateJitter(records, bp) : 1.0;
    const normalizedSkew = playerActed ? calculateSkew(records, bp) : 0;
    const ler = playerActed ? calculateLER(summary) : 1.0;
    const score = playerActed
      ? computeSignalIntegrityScore(normalizedJitter, normalizedSkew, ler)
      : { jitterScore: 0, skewScore: 0, lerScore: 0, totalScore: 0, grade: 'LINK_DOWN' as const, certification: 'No Input Detected — Encoder Offline' };

    return {
      metrics: {
        jitter: {
          normalized: normalizedJitter,
          rms_ms: normalizedJitter * bp * 1000,
          grade: getJitterGradeLabel(normalizedJitter),
        },
        skew: {
          normalized: normalizedSkew,
          bias: classifySkew(normalizedSkew),
          suggestedOffset_ms: -normalizedSkew * bp * 1000,
        },
        ler: {
          value: ler,
          wrongActions: summary.wrongActions,
          misses: summary.misses,
          label: getLERLabel(ler),
        },
      },
      score,
      assessment: playerActed
        ? generateAssessment({
            jitterGrade: normalizedJitter < 0.10 ? 'LOW' : normalizedJitter < 0.20 ? 'MID' : 'HIGH',
            skewBias: classifySkew(normalizedSkew),
            lerGrade: ler < 0.05 ? 'LOW' : ler < 0.15 ? 'MID' : 'HIGH',
            consecutivePeak: summary.consecutiveCorrectPeak,
          })
        : 'No encoder activity detected. The DS link remained idle throughout the test window. Recommend verifying input connections and retrying the calibration sequence.',
      distribution: records.map((r) => ({
        time: r.idealEdgeTime,
        delta: r.action === 'MISS' ? 0 : r.delta / bp,
        grade: r.action === 'MISS' ? 'MISS' : getHitGrade(Math.abs(r.delta) / bp),
      })),
      gameConfig: {
        mode: config.mode,
        speed: config.speed,
        trlLabel: config.trlLabel,
      },
    };
  }, [config]);

  // Initialize game loop, renderer, input handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = new GameLoop(config);
    const renderer = new GameRenderer(canvas, config);
    const input = new InputHandler(config, (event) => {
      loop.handleInput(event);
    });

    loopRef.current = loop;
    rendererRef.current = renderer;
    inputRef.current = input;

    loop.onEvent((type, data) => {
      const state = loop.getState();
      setLives(state.lives);

      if (type === 'cue_hit') {
        const d = data as { grade: string };
        setFeedback(d.grade);
        setTimeout(() => setFeedback(null), 300);
      } else if (type === 'wrong_action') {
        setFeedback('WRONG');
        setTimeout(() => setFeedback(null), 400);
      } else if (type === 'cue_miss') {
        setFeedback('MISS');
        setTimeout(() => setFeedback(null), 300);
      } else if (type === 'game_over' || type === 'game_complete') {
        input.stop();
        cancelAnimationFrame(rafRef.current);
        setTimeout(() => {
          const payload = buildReport(loop);
          onGameEnd(payload);
        }, 800);
      }
    });

    // Render loop
    const renderLoop = () => {
      renderer.render(loop.getState());
      rafRef.current = requestAnimationFrame(renderLoop);
    };
    rafRef.current = requestAnimationFrame(renderLoop);

    // Handle resize
    const handleResize = () => renderer.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      loop.stop();
      input.stop();
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [config, buildReport, onGameEnd]);

  // Countdown then start
  useEffect(() => {
    if (started) return;

    if (countdown <= 0) {
      setStarted(true);
      loopRef.current?.start();
      inputRef.current?.start(canvasRef.current ?? undefined);
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, started]);

  const modeLabel = config.mode === 'EASY' ? 'Easy' : 'Advanced';
  const keyHint = config.mode === 'EASY'
    ? 'SPACE = Toggle Strobe'
    : '↑ = HIGH   ↓ = LOW';

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-[#0A0E1A]">
      {/* HUD top bar */}
      <div className="flex w-full max-w-4xl items-center justify-between px-4 py-3">
        <div className="text-xs text-gray-500">
          <span className="font-orbitron tracking-wider text-gray-400">{modeLabel}</span>
          {' · '}
          {config.trlLabel}
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-gray-500">{keyHint}</span>
          <button
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            onClick={() => {
              loopRef.current?.stop();
              inputRef.current?.stop();
              cancelAnimationFrame(rafRef.current);
              onQuit();
            }}
          >
            [ESC] ABORT
          </button>
        </div>
      </div>

      {/* Game canvas */}
      <div className="relative flex-1 w-full max-w-4xl px-4">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg border border-white/5"
          style={{ height: 320 }}
        />

        {/* Hit feedback overlay */}
        {feedback && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="font-orbitron text-2xl font-bold tracking-widest animate-bounce"
              style={{
                color:
                  feedback === 'PERFECT' ? '#A855F7' :
                  feedback === 'GOOD' ? '#3B82F6' :
                  feedback === 'MARGINAL' ? '#F59E0B' :
                  feedback === 'WRONG' ? '#EF4444' :
                  feedback === 'MISS' ? '#6B7280' :
                  '#EF4444',
              }}
            >
              {feedback === 'WRONG' ? 'WRONG ACTION' : feedback}
            </span>
          </div>
        )}

        {/* Countdown overlay */}
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
            <div className="text-center">
              {countdown > 0 ? (
                <span className="font-orbitron text-6xl font-black text-white animate-pulse">
                  {countdown}
                </span>
              ) : (
                <span className="font-orbitron text-3xl font-bold text-space-purple animate-pulse">
                  GO!
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="flex w-full max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: config.maxLives }, (_, i) => (
            <span
              key={i}
              className="text-lg transition-all duration-200"
              style={{
                color: i < lives ? (lives <= 1 ? '#EF4444' : '#10B981') : '#374151',
                transform: i < lives ? 'scale(1)' : 'scale(0.7)',
              }}
            >
              {i < lives ? '♥' : '♡'}
            </span>
          ))}
        </div>
        <div className="font-mono text-xs text-gray-600">
          XORbit · DS Encoder
        </div>
      </div>
    </div>
  );
}

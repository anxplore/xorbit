import { useState, useCallback } from 'react';
import type { GameConfig } from '../types/game.types';
import type { ReportPayload } from '../types/report.types';
import ModeSelect from './ModeSelect';
import Onboarding, { shouldShowOnboarding } from './Onboarding';
import PlayScreen from './PlayScreen';
import SignalIntegrityReport from '../report/SignalIntegrityReport';

type AppPhase = 'MODE_SELECT' | 'ONBOARDING' | 'PLAYING' | 'REPORT';

export default function GameApp() {
  const [phase, setPhase] = useState<AppPhase>('MODE_SELECT');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [reportPayload, setReportPayload] = useState<ReportPayload | null>(null);

  const handleStart = useCallback((config: GameConfig) => {
    setGameConfig(config);

    if (config.mode === 'EASY' && config.speed === 'SPEED_1' && shouldShowOnboarding()) {
      setPhase('ONBOARDING');
    } else {
      setPhase('PLAYING');
    }
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setPhase('PLAYING');
  }, []);

  const handleReturnToSelect = useCallback(() => {
    setPhase('MODE_SELECT');
    setGameConfig(null);
    setReportPayload(null);
  }, []);

  const handleGameEnd = useCallback((payload: ReportPayload) => {
    setReportPayload(payload);
    setPhase('REPORT');
  }, []);

  const handleRetry = useCallback(() => {
    setReportPayload(null);
    setPhase('PLAYING');
  }, []);

  switch (phase) {
    case 'MODE_SELECT':
      return <ModeSelect onStart={handleStart} />;

    case 'ONBOARDING':
      return (
        <div className="relative min-h-screen">
          <Onboarding onComplete={handleOnboardingComplete} />
        </div>
      );

    case 'PLAYING':
      return gameConfig ? (
        <PlayScreen
          key={`${gameConfig.mode}-${gameConfig.speed}-${Date.now()}`}
          config={gameConfig}
          onGameEnd={handleGameEnd}
          onQuit={handleReturnToSelect}
        />
      ) : null;

    case 'REPORT':
      return reportPayload ? (
        <SignalIntegrityReport
          payload={reportPayload}
          onRetry={handleRetry}
          onBack={handleReturnToSelect}
        />
      ) : null;
  }
}

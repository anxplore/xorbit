import { useState, useCallback } from 'react';
import OnboardingStep from './OnboardingStep';
import WaveformDemo from './WaveformDemo';

const ACCENT = '#3B82F6';
const STORAGE_KEY = 'xor_onboarding_done';

interface OnboardingProps {
  onComplete: () => void;
}

interface StepDef {
  title: string;
  description: string;
  highlightLane?: 'data' | 'strobe' | 'clock';
  demo?: 'data-hold-strobe-toggle' | 'data-toggle-strobe-hold';
}

const STEPS: StepDef[] = [
  {
    title: 'The Data Stream',
    description:
      'This is the Data lane — a stream of digital bits generated automatically by the system. You do not control it, but you must watch it closely.',
    highlightLane: 'data',
  },
  {
    title: 'Your Strobe Signal',
    description:
      'This is the Strobe lane — YOUR signal. You control when it toggles. The timing of your input directly affects link stability.',
    highlightLane: 'strobe',
  },
  {
    title: 'Recovered Clock = D ⊕ S',
    description:
      'The bottom lane shows the Recovered Clock — the XOR of Data and Strobe. When both lanes change in sync, the receiver sees a stable clock. Your mission: keep this clock ticking.',
    highlightLane: 'clock',
  },
  {
    title: 'When Data Holds → Toggle Strobe',
    description:
      'When Data stays at the same level (no transition), you must press SPACE to toggle Strobe. This creates the clock edge the receiver needs.',
    demo: 'data-hold-strobe-toggle',
  },
  {
    title: 'When Data Toggles → Hold Strobe',
    description:
      'When Data transitions (changes level), do NOT press anything. The Data transition itself creates the clock edge. Resist the impulse!',
    demo: 'data-toggle-strobe-hold',
  },
  {
    title: 'Your Mission Begins',
    description:
      'Watch for cue markers on the Strobe lane: ● means TOGGLE (press Space), ◇ means HOLD (do nothing). Keep the Recovered Clock stable. Good luck, operator.',
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep >= STEPS.length - 1) {
      finish();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, finish]);

  const step = STEPS[currentStep];

  return (
    <OnboardingStep
      stepIndex={currentStep}
      title={step.title}
      description={step.description}
      highlightLane={step.highlightLane}
      accentColor={ACCENT}
      isActive
      onNext={handleNext}
      onSkip={finish}
      isLast={currentStep === STEPS.length - 1}
    >
      {step.demo && <WaveformDemo scenario={step.demo} />}
    </OnboardingStep>
  );
}

export function shouldShowOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem(STORAGE_KEY);
}

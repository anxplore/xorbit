# Contributing

## Tech Stack

- [Astro](https://astro.build) 6 — Static site framework
- [React](https://react.dev) 19 — UI islands
- [Tailwind CSS](https://tailwindcss.com) v4 — Styling
- [@anxplore/ui](https://github.com/anxplore/anxplore-ui) — Brand tokens, components, and layout
- [Vitest](https://vitest.dev) — Unit testing
- Web Workers — Off-thread report calculations

## Project Structure

```
src/
├── config/              # Game configuration
│   ├── gameConfig.ts    #   buildGameConfig() factory
│   ├── keymaps.ts       #   Easy / Advanced keymaps
│   └── speeds.ts        #   Speed configs & mode parameters
│
├── game/                # Game engine
│   ├── GameLoop.ts      #   Core engine: DS sequence, cues, arbiter, lives
│   ├── GameRenderer.ts  #   Canvas waveform renderer (3-lane + cues + HUD)
│   ├── HitCollector.ts  #   Records player inputs per session
│   └── InputHandler.ts  #   Dual-mode keyboard/touch handler
│
├── ui/                  # React UI components
│   ├── ModeSelect.tsx   #   Mission profile selection screen
│   ├── ModeCard.tsx     #   Easy / Advanced mode card
│   ├── SpeedSelector.tsx#   3-speed radio group
│   ├── Onboarding.tsx   #   Interactive tutorial (Easy Speed 1)
│   ├── OnboardingStep.tsx
│   ├── WaveformDemo.tsx #   Canvas DS waveform animation
│   ├── GameApp.tsx      #   Top-level app state (phase routing)
│   └── PlayScreen.tsx   #   Game play screen (wires Loop + Renderer + Input)
│
├── report/              # Signal Integrity Report components
│   ├── SignalIntegrityReport.tsx  # Report page container
│   ├── ScoreCard.tsx    #   Grade + total score + metric pills
│   ├── GradeBadge.tsx   #   Animated grade badge (S/A/B/C/D/LINK_DOWN)
│   ├── MetricPill.tsx   #   Single metric display card
│   ├── JitterScatterPlot.tsx  # Canvas scatter plot
│   ├── SkewAnalysis.tsx #   SVG skew arrow visualization
│   ├── ShareReport.ts   #   Canvas-based share card + download/Web Share API
│   ├── theme.ts         #   Report color constants
│   └── mockData.ts      #   Mock data generator for preview
│
├── workers/             # Web Worker modules
│   ├── metrics.ts       #   Pure functions: jitter, skew, LER, scoring
│   ├── assessment.ts    #   Engineer's diagnosis generator
│   └── reportCalculator.worker.ts
│
├── types/               # TypeScript definitions
│   ├── game.types.ts    #   GameConfig, HitRecord, InputEvent, etc.
│   └── report.types.ts  #   ReportPayload, SignalIntegrityScore
│
├── layouts/
│   └── MainLayout.astro #   Wraps @anxplore/ui BaseLayout
│
├── styles/
│   └── global.css       #   Tailwind + @anxplore/ui tokens + XORbit theme
│
└── pages/
    └── index.astro      #   Entry page
```

## Getting Started

### Prerequisites

- Node.js ≥ 22.12
- `GITHUB_TOKEN` environment variable with read access to `@anxplore` GitHub Packages

> **Note:** `GITHUB_TOKEN` must be a GitHub Personal Access Token (classic) with at least the `read:packages` scope. Set it as an environment variable or replace it inline for local development.

### Install

```bash
# Ensure GITHUB_TOKEN is set for @anxplore/ui from GitHub Packages
export GITHUB_TOKEN=<your-token>
npm install
```

### Development

```bash
npm run dev        # Start dev server at http://localhost:4321/
npm run build      # Production build to ./dist/
npm run preview    # Preview production build
```

### Testing

```bash
npm test           # Run all tests once
npm run test:watch # Watch mode
```

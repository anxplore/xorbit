# 🛰️ XORbit — SpaceWire DS Pulse

A rhythm-based web game that teaches **SpaceWire DS (Data-Strobe) encoding** through signal integrity challenges. Built by [Anxplore Lab](https://anxplore.space).

> "You're not playing rhythm. You're keeping a satellite awake."

## 📜 Overview

Players act as a DS Encoder logic circuit inside an orbiting spacecraft chip. The goal is to maintain Recovered Clock stability by toggling the Strobe signal at the right moment — following the XOR rule: `D ⊕ S = Clock`.

## 🕹️ Game Modes

| Mode | Control | Description |
|------|---------|-------------|
| **Easy** | `Space` to toggle | Focus on learning the DS logic |
| **Advanced** | `↑` = HIGH, `↓` = LOW | Full dual-rail voltage control |

Each mode has 3 speed levels (100 / 150 / 200 Mbps) mapped to TRL ratings.

### 🔍 Mode Selection

![Mode Selection](docs/screenshots/mode-select.png)

### 🎮 Gameplay

The game canvas renders three lanes in real time — Data, Strobe, and Recovered Clock (`D ⊕ S`). Cue markers scroll from left to right; hit the timing window to keep the link alive.

![Gameplay](docs/screenshots/gameplay.png)

## 📊 Signal Integrity Report

After each session, players receive an engineering-grade report:

- **Jitter** — RMS timing deviation (normalized to Bit Period)
- **Skew** — Systematic bias (early / late tendency)
- **Link Error Rate** — Logic error ratio (wrong action + miss)
- **Grade** — S / A / B / C / D / LINK_DOWN (mapped to TRL certifications)
- **Engineer's Assessment** — Natural language diagnosis in SpaceWire terminology

![Signal Integrity Report](docs/screenshots/report.jpeg)

## 🤝 Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for tech stack, project structure, and local development setup.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

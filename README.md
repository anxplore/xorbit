# 🛰️ XORbit — SpaceWire DS Pulse

**Master the heartbeat of satellite communication.**

## 📜 The Mission
In the vacuum of space, data is life. But data is chaotic. To make it travel across the stars, we need order. We need the **Recovered Clock**.

**XORbit** is a high-stakes rhythm web game where you step into the role of a Strobe Controller. \
Your objective is simple but critical: Maintain the link. Extract the clock. Prevent the disconnect.

## 🕹️ Gameplay Mechanics: The SpaceWire Data-Strobe (DS) Encoding Rule
You are the DS Encoder logic circuit inside an orbiting spacecraft chip.

The game follows the official **SpaceWire (ECSS-E-ST-50-12C)** standard. \
Data (D) flows automatically, but the link requires a transition every cycle to keep the clock alive.

* **When Data stays the same:** You must toggle the **Strobe (S)**.
* **When Data changes:** You must stay still.

If you miss a beat, the clock stops. If the clock stops, the link is lost.

![Gameplay](docs/screenshots/gameplay.png)

## ⚡ Core Features

### 📐 Precision Jitter Analysis
Your performance isn't just a score; it's **Signal Integrity**. Every hit is measured as a **Percentage of the Bit Period**. 
* Can you hit the **Space Grade** (< 5% Jitter)? 
* Or are you just a noisy **Consumer Grade** circuit?

### 🎮 Game Modes
| Mode | Control | Description |
|------|---------|-------------|
| **Easy** | `Space` to toggle | Focus on learning the DS logic |
| **Advanced** | `↑` = HIGH, `↓` = LOW | Full dual-rail voltage control |

### 🚀 Scaling Bitrates
Experience the pressure of deep-space telemetry.
* **100 Mbps**: Systematic calibration.
* **150 Mbps**: High-speed stability.
* **200 Mbps**: The edge of physics. Your reflexes must be as fast as electrons.

![Mode Selection](docs/screenshots/mode-select.png)

## 🏆 The Grading Scale
How reliable is your logic?

* **Space Grade (S)**: Flawless synchronization. Ready for Mars missions.
* **Military Grade (A)**: Highly reliable under extreme conditions.
* **Industrial Grade (B)**: Stable for terrestrial applications.
* **Consumer Grade (C)**: Functional, but watch out for interference.
* **Prototype (D) / LINK_DOWN**: Link Disconnected. Back to the lab.

### 📊 Signal Integrity Report
At the end of every mission, receive a comprehensive **Link Analysis Report**.
* **Jitter Scatter Plot**: Visualize your timing consistency.
* **Skew Distribution**: Identify if your logic is leading or lagging.
* **Link Error Rate (LER)**: Analyze exactly where the synchronization failed.

![Signal Integrity Report](docs/screenshots/report.jpeg)

## 🌌 Why XORbit?
Most people see code; engineers see pulses. **XORbit** turns the abstract math of DS encoding into a visceral, rhythmic experience. \
It's not just a game — it's a physical intuition for the protocol that powers modern space exploration.

> You're not playing rhythm. You're keeping a satellite awake.

**Are you ready to sync?**

---
*Built by [Anxplore](https://anxplore.space). Inspired by the ECSS-E-ST-50-12C Standard.*

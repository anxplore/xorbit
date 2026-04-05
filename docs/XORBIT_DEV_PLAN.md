# XORbit: SpaceWire DS Pulse
## 完整開發計畫 — Signal Integrity Report 功能模組

```
document_type: development_plan
version: 0.2.0
target_feature: game_rules + game_modes + signal_integrity_report
language: Traditional Chinese (人類閱讀) + English (程式規格)
intended_readers: [human_developer, ai_agent]
project: XORbit / Anxplore Lab
last_updated: 2026-04-05
changelog:
  v0.2.0: 新增遊戲規則說明（§2）、遊戲模式定義（§3）、對應 TASK XOR-CORE-001~003
  v0.1.0: 初版，Signal Integrity Report 功能規格
status: READY_FOR_IMPLEMENTATION
```

---

## 📌 文件使用說明（給 AI Agent）

本文件採用雙語雙格式設計：
- **中文段落** = 給人類開發者閱讀的設計意圖與背景脈絡
- **英文程式碼區塊** = 給 AI Agent 執行的精確規格、型別定義與驗收條件
- 所有 `TASK_ID` 格式為 `XOR-REPORT-XXX`，可作為任務追蹤的唯一鍵值
- 每個任務區塊末尾的 `acceptance_criteria` 為機器可驗證的通過條件

---

## 1. 專案背景與功能定位

XORbit 是一款以 SpaceWire DS（Data-Strobe）編碼協議為主題的節奏網頁遊戲。
玩家透過鍵盤/觸控輸入，在正確時機翻轉 Strobe 信號，維持 Recovered Clock 的穩定。

**Signal Integrity Report（信號完整度報告）** 是遊戲結束後的分析畫面。
它的核心價值不在於「給分」，而在於把玩家的操作行為翻譯成真實的硬體工程語言，
讓玩家在娛樂之後，帶著一份真實的自我評估離開。

---

## 2. 遊戲規則介紹（Game Rules）

### 2.1 核心世界觀

玩家扮演一顆在軌航太晶片內部的 **DS Encoder 邏輯電路**。
你的任務是維持 SpaceWire 鏈路的同步——
因為如果 Recovered Clock 頻率不穩，衛星的通訊模組將失去連線，任務中止。

> **「你不是在打節奏。你在讓衛星保持清醒。」**

---

### 2.2 三條賽道（Lane）說明

```
┌─────────────────────────────────────────────────────┐
│  TOP LANE     [Data]           自動流動的方波         │
│               ▔▔▔▔▔▔╗   ╔▔▔▔▔▔▔▔▔▔╗   ╔▔▔▔▔▔▔       │
│                     ║   ║         ║   ║             │
│               ______╝   ╚_________╝   ╚_____        │
│                                                     │
│  MID LANE     [Strobe]         玩家操控的賽道 ← YOU  │
│               ▔▔▔▔▔╗     ╔▔▔▔▔▔▔╗     ╔▔▔▔▔▔        │
│                    ║     ║      ║     ║             │
│               _____╝     ╚______╝     ╚_____        │
│                   ↑       ↑    ↑       ↑            │
│               [提示點出現在此]                       │
│                                                     │
│  BOTTOM LANE  [Recovered Clock]  D ⊕ S 實時合成     │
│               ▔╗ ╔▔╗ ╔▔╗ ╔▔╗ ╔▔╗ ╔▔╗ ╔▔╗ ╔▔        │
│                ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║       │
│               _╝ ╚_╝ ╚_╝ ╚_╝ ╚_╝ ╚_╝ ╚_╝ ╚_        │
│               └── 穩定的時鐘 = 鏈路正常 ──────────┘  │
└─────────────────────────────────────────────────────┘
```

| 賽道 | 控制者 | 說明 |
|------|--------|------|
| **Data（頂部）** | 系統自動 | 隨機生成的數位資料流，代表真實傳輸的 bit 序列 |
| **Strobe（中部）** | **玩家** | 你的操控目標。必須讓 `D ⊕ S` 保持穩定時鐘節奏 |
| **Recovered Clock（底部）** | 系統計算 | `D XOR S` 的即時結果。這就是接收端看到的時鐘 |

---

### 2.3 判定規則（DS 編碼邏輯）

DS 編碼的核心法則只有一條，但要在高速下執行：

```
Next_S = Prev_S ⊕ (Next_D ≡ Prev_D)

白話版：
  Data 翻轉了（0→1 或 1→0）→ Strobe 保持不動
  Data 沒有翻轉（維持相同電位）→ Strobe 必須翻轉
```

**實際操作對照：**

```
情境 A：Data 翻轉
  Data:   ___╔▔▔▔    ← Data 從 0 變 1
  Strobe: ▔▔▔▔▔▔▔    ← 玩家「什麼都不做」= 正確
  Clock:  ___╔▔▔╗    ← 時鐘正常跳動 ✓

情境 B：Data 不變
  Data:   ▔▔▔▔▔▔▔    ← Data 持續為 1
  Strobe: ▔▔▔╗___    ← 玩家「翻轉 Strobe」= 正確
  Clock:  ___╔▔▔╗    ← 時鐘正常跳動 ✓

情境 C：玩家判斷錯誤
  Data:   ▔▔▔▔▔▔▔    ← Data 持續為 1（應翻轉 Strobe）
  Strobe: ▔▔▔▔▔▔▔    ← 玩家「沒動」= 錯誤！
  Clock:  ▔▔▔▔▔▔▔    ← 時鐘停擺，Link Error 觸發 ✗
```

---

### 2.4 提示點（Cue）設計

玩家不需要自行計算 Data 是否翻轉。遊戲在 Strobe 賽道上會顯示**提示點（Cue Marker）**：

```typescript
type CueType = 'TOGGLE_REQUIRED' | 'HOLD_REQUIRED';

/**
 * TOGGLE_REQUIRED（圓形提示）：
 *   Data 在本 Bit Period 沒有翻轉 → 玩家必須翻轉 Strobe
 *   視覺：白色實心圓，出現在 Strobe 賽道中線
 *
 * HOLD_REQUIRED（菱形提示）：
 *   Data 在本 Bit Period 發生翻轉 → 玩家必須什麼都不做
 *   視覺：空心菱形，提醒玩家「抑制手指衝動」
 *   設計意圖：克服「看到提示就想按」的直覺衝動，
 *             對應工程上「被動等待時鐘」的概念
 */

interface CueMarker {
  type:         CueType;
  idealTime:    number;   // audioCtx 時間，精確排程
  laneY:        number;   // 固定為 Strobe 賽道 Y 座標
  hitWindow:    number;   // 可接受的時間窗口（秒），依難度決定
}
```

**判定窗口與反饋：**

| 時間偏差 | 判定 | 視覺反饋 |
|---------|------|---------|
| 0% – 5% Bit Period | **PERFECT** | 亮紫色光芒爆炸 |
| 5% – 15% Bit Period | **GOOD** | 藍色穩定光波 |
| 15% – 25% Bit Period | **MARGINAL** | 橘色微弱閃爍 |
| > 25% Bit Period | **LINK WARNING** | 波形抖動 + 雜訊 |
| 超出 ±150ms | **MISS** | 波形中斷，靜電效果 |
| HOLD_REQUIRED 時卻按鍵 | **WRONG ACTION** | 立即 Link Error |

---

### 2.5 Link Error 與生命值系統

```typescript
interface LivesSystem {
  maxLives:    number;   // 依難度設定（見 §3）
  currentLives: number;
  errorTypes: {
    WRONG_ACTION: number;   // 邏輯錯誤，扣 1 命
    CONSECUTIVE_MISS: number; // 連續 3 次 MISS，扣 1 命
  };
}

/**
 * Link Error 觸發條件：
 *   1. WRONG_ACTION（按錯 or 應按卻未按）→ 立即扣血
 *   2. 連續 3 次 MISS → 視為「鏈路同步失敗」，扣血
 *
 * 歸零效果：
 *   - 畫面觸發 Glitch Effect（DisplacementFilter）
 *   - Recovered Clock 賽道顯示靜電亂碼 0.5 秒
 *   - 短暫無敵幀（invincibility frame）1.0 秒，避免連鎖懲罰
 */
```

---

## 3. 遊戲模式定義（Game Modes）

### 3.1 模式總覽

```
XORbit 模式矩陣（2 模式 × 3 速度 = 6 組合）

               ┌──────────────┬──────────────────────┐
               │  EASY MODE   │   ADVANCED MODE      │
               │  空白鍵翻轉  │   上下鍵分別控制      │
  ┌────────────┼──────────────┼──────────────────────┤
  │ Speed 1    │ TRL-3        │ TRL-5                │
  │ 100 Mbps   │ Prototype    │ Engineering Model    │
  ├────────────┼──────────────┼──────────────────────┤
  │ Speed 2    │ TRL-5        │ TRL-7                │
  │ 150 Mbps   │ Eng. Model   │ Flight Heritage      │
  ├────────────┼──────────────┼──────────────────────┤
  │ Speed 3    │ TRL-7        │ ECSS               │
  │ 200 Mbps   │ Flight       │ Space Grade          │
  └────────────┴──────────────┴──────────────────────┘
```

---

### 3.2 Easy Mode — 空白鍵翻轉

**設計意圖：** 讓玩家專注理解 DS 邏輯本身，降低操作複雜度。
`TOGGLE_REQUIRED` 時按空白鍵，`HOLD_REQUIRED` 時克制不按。

```typescript
/**
 * EASY MODE CONTROL SCHEME
 *
 * 核心機制：Strobe 只有一個控制鍵，每次按下均翻轉電位
 *
 * 按鍵映射：
 *   SPACE → toggleStrobe()
 *   （觸控裝置：全螢幕點擊）
 *
 * 簡化設計：
 *   - 不區分「Strobe 目前是 High 還是 Low」
 *   - 玩家只需判斷「該不該按」，不需判斷「該按到哪個電位」
 *   - Strobe 初始電位固定為 LOW（0），每局開始時重置
 */

const EASY_MODE_KEYMAP = {
  TOGGLE: ['Space'],
  // 觸控：any tap on game canvas
} as const;

interface EasyModeConfig {
  hitWindow_ms:     number;   // 判定窗口寬度（毫秒）
  maxLives:         number;
  showNextCue:      boolean;  // 是否預覽下一個提示點（教學輔助）
  showStrobeLevel:  boolean;  // 是否顯示 Strobe 目前電位（教學輔助）
}

const EASY_MODE_SPEEDS: Record<SpeedLevel, EasyModeConfig> = {
  SPEED_1: { hitWindow_ms: 150, maxLives: 5, showNextCue: true,  showStrobeLevel: true  },
  SPEED_2: { hitWindow_ms: 120, maxLives: 4, showNextCue: true,  showStrobeLevel: false },
  SPEED_3: { hitWindow_ms: 100, maxLives: 3, showNextCue: false, showStrobeLevel: false },
};
```

**教學流程（Easy Mode Speed 1 限定）：**

```
首次進入 Easy Mode Speed 1 時，觸發互動教學（Onboarding）：
  Step 1: 凍結遊戲，高亮 Data 賽道，說明「這是系統的數據流」
  Step 2: 高亮 Strobe 賽道，說明「這是你要控制的信號」
  Step 3: 高亮 Recovered Clock，說明「D ⊕ S 的結果就是接收端的時鐘」
  Step 4: 示範一次 Data 不變 → Strobe 翻轉 → Clock 跳動的動畫
  Step 5: 示範一次 Data 翻轉 → Strobe 不動 → Clock 跳動的動畫
  Step 6: 「現在換你了！按下空白鍵開始」

教學期間所有輸入不計入 Signal Integrity Report。
onboarding_completed 以 localStorage 標記，之後進場直接跳過。
```

---

### 3.3 Advanced Mode — 上下鍵控制

**設計意圖：** 模擬真實電路中 Strobe 信號的雙向電位控制。
玩家需同時掌握「何時按」與「按到哪個電位」，對應工程師設計 DS 電路時的精確控制感。

```typescript
/**
 * ADVANCED MODE CONTROL SCHEME
 *
 * 核心機制：上下鍵分別對應 Strobe 的 High / Low 電位
 * 玩家必須在正確時機，將 Strobe「按到正確的電位」
 *
 * 按鍵映射：
 *   ArrowUp   → setStrobe(HIGH)   // Strobe 拉高
 *   ArrowDown → setStrobe(LOW)    // Strobe 拉低
 *
 * 與 Easy Mode 的關鍵差異：
 *   - 按錯方向（應拉高卻拉低）= WRONG_ACTION，即使時機正確也不算分
 *   - 需要玩家追蹤 Strobe 目前電位，決定下一步要按上還是下
 *   - 等同於真實電路設計中的「主動驅動信號電位」
 *
 * 視覺輔助：
 *   Cue Marker 的箭頭方向指示應按上鍵（↑）還是下鍵（↓）
 */

const ADVANCED_MODE_KEYMAP = {
  SET_HIGH: ['ArrowUp',   'KeyW'],
  SET_LOW:  ['ArrowDown', 'KeyS'],
} as const;

type StrobeLevel = 'HIGH' | 'LOW';

interface AdvancedModeConfig {
  hitWindow_ms:     number;
  maxLives:         number;
  showDirectionHint: boolean;  // Cue 是否顯示方向箭頭
  showStrobeLevel:   boolean;  // 是否顯示目前 Strobe 電位指示燈
}

const ADVANCED_MODE_SPEEDS: Record<SpeedLevel, AdvancedModeConfig> = {
  SPEED_1: { hitWindow_ms: 130, maxLives: 4, showDirectionHint: true,  showStrobeLevel: true  },
  SPEED_2: { hitWindow_ms: 100, maxLives: 3, showDirectionHint: true,  showStrobeLevel: false },
  SPEED_3: { hitWindow_ms: 80,  maxLives: 3, showDirectionHint: false, showStrobeLevel: false },
};

/**
 * Advanced Mode 的 Cue Marker 擴充：
 *   TOGGLE_REQUIRED Cue 需攜帶目標電位資訊
 */
interface AdvancedCueMarker extends CueMarker {
  targetStrobeLevel: StrobeLevel;  // 玩家應將 Strobe 按到此電位
  directionLabel:    '↑' | '↓';   // 視覺提示箭頭
}
```

---

### 3.4 速度參數表（共用）

```typescript
type SpeedLevel = 'SPEED_1' | 'SPEED_2' | 'SPEED_3';

/**
 * 速度以 SpaceWire 標準比特率為參照
 * Bit Period = 1 / BitRate
 *
 * 視覺滾動速度（scroll_speed）以「賽道每秒滾動的像素數」表示，
 * 確保螢幕寬度（1920px）對應約 2 Bit Period 的可視範圍。
 */

const SPEED_CONFIGS: Record<SpeedLevel, SpeedConfig> = {
  SPEED_1: {
    label:          '100 Mbps',
    trlLabel:       'TRL-3  Prototype',
    bitRate_Mbps:   100,
    bitPeriod_ms:   10,       // 1 / 100MHz = 10ns → 遊戲縮放至 10ms
    scrollSpeed_px: 384,      // px/s（1920px = 5s = 50 Bit Periods）
    bpm_equiv:      6000,     // 每分鐘 Bit 數，供音樂節奏參考
  },
  SPEED_2: {
    label:          '150 Mbps',
    trlLabel:       'TRL-5  Engineering Model',
    bitRate_Mbps:   150,
    bitPeriod_ms:   6.67,
    scrollSpeed_px: 576,
    bpm_equiv:      9000,
  },
  SPEED_3: {
    label:          '200 Mbps',
    trlLabel:       'TRL-7 / ECSS  Flight Grade',
    bitRate_Mbps:   200,
    bitPeriod_ms:   5,
    scrollSpeed_px: 768,
    bpm_equiv:      12000,
  },
};
```

---

### 3.5 模式選擇畫面（Mode Select UI）規格

```
┌──────────────────────────────────────────────────────────┐
│              SELECT MISSION PROFILE                      │
│                                                          │
│  ┌─────────────────────┐  ┌───────────────────────────┐  │
│  │    EASY MODE        │  │    ADVANCED MODE          │  │
│  │    空白鍵翻轉        │  │    上下鍵控制電位          │  │
│  │                     │  │                           │  │
│  │  [SPACE] = Toggle   │  │  [↑] = Set HIGH           │  │
│  │                     │  │  [↓] = Set LOW            │  │
│  │                     │  │                           │  │
│  │  ○ 100 Mbps TRL-3   │  │  ○ 100 Mbps TRL-5        │  │
│  │  ○ 150 Mbps TRL-5   │  │  ○ 150 Mbps TRL-7        │  │
│  │  ○ 200 Mbps TRL-7   │  │  ○ 200 Mbps ECSS         │  │
│  │                     │  │                           │  │
│  │     [SELECT]        │  │       [SELECT]            │  │
│  └─────────────────────┘  └───────────────────────────┘  │
│                                                          │
│  💡 建議新手從 Easy · 100 Mbps 開始                       │
└──────────────────────────────────────────────────────────┘
```

```typescript
/**
 * MODE SELECT STATE
 * 選擇後寫入 GameConfig，傳入 GameLoop 初始化
 */

interface GameConfig {
  mode:      'EASY' | 'ADVANCED';
  speed:     SpeedLevel;
  // 以下由 mode + speed 自動推導
  keymap:    typeof EASY_MODE_KEYMAP | typeof ADVANCED_MODE_KEYMAP;
  hitWindow: number;     // ms
  maxLives:  number;
  bitPeriod: number;     // 秒（供 TimingClock 與 Report 共用）
  trlLabel:  string;
}

function buildGameConfig(mode: 'EASY' | 'ADVANCED', speed: SpeedLevel): GameConfig {
  const speedCfg = SPEED_CONFIGS[speed];
  const modeCfg  = mode === 'EASY'
    ? EASY_MODE_SPEEDS[speed]
    : ADVANCED_MODE_SPEEDS[speed];

  return {
    mode,
    speed,
    keymap:    mode === 'EASY' ? EASY_MODE_KEYMAP : ADVANCED_MODE_KEYMAP,
    hitWindow: modeCfg.hitWindow_ms / 1000,
    maxLives:  modeCfg.maxLives,
    bitPeriod: speedCfg.bitPeriod_ms / 1000,
    trlLabel:  speedCfg.trlLabel,
  };
}
```

---

### 3.6 模式對 Signal Integrity Report 的影響

```typescript
/**
 * Report 呈現需帶入模式與速度資訊，影響以下計算與顯示：
 *
 * 1. hitWindow 影響 Jitter 基準：
 *    Advanced Mode 的 hitWindow 更窄，相同 delta 在 Advanced 下
 *    對應的 normalized Jitter 更高，呈現更嚴苛的評估。
 *
 * 2. Report 標題列顯示模式標籤：
 *    「EASY · 150 Mbps TRL-5」或「ADVANCED · 200 Mbps ECSS」
 *
 * 3. Engineer's Assessment 文字加入模式語境：
 *    Easy: 「Operating in single-wire toggle mode...」
 *    Advanced: 「Dual-rail voltage control demonstrated...」
 *
 * 4. Certification 標籤依模式上限：
 *    Easy Mode 最高認證 = TRL-7（即使表現完美，不給 ECSS 認證）
 *    Advanced Mode Speed 3 完美表現 → ECSS-E-ST-50-12C Compliant
 */

interface ReportPayload {
  // ...（原有欄位）
  gameConfig: Pick<GameConfig, 'mode' | 'speed' | 'trlLabel'>;
}
```

---

## 4. 三大量測指標定義

### 4.1 Jitter（抖動） — 計時隨機誤差

**工程定義：** 玩家輸入時間點與理想邊緣（Ideal Edge）之間，誤差的**隨機分佈程度**（標準差）。

```typescript
/**
 * METRIC: Jitter
 * 
 * 計算方式：對每一次有效輸入，記錄 delta = playerTime - idealEdgeTime
 * Jitter = RMS（均方根）of all deltas, normalized to Bit Period
 * 
 * 為何用 RMS 而非 StdDev？
 * RMS 同時懲罰系統性偏移（Skew）和隨機抖動，
 * 更貼近真實 Link Training 的 BER 計算方式。
 * StdDev 則用於獨立計算 Jitter（排除 Skew 成份）。
 */

interface HitRecord {
  idealEdgeTime: number;    // audioCtx.currentTime，單位：秒
  playerInputTime: number;  // performance.now() 換算後，單位：秒
  delta: number;            // playerInputTime - idealEdgeTime（帶正負號）
  action: 'TOGGLE' | 'HOLD' | 'MISS';
  isCorrect: boolean;
}

function calculateJitter(records: HitRecord[], bitPeriod: number): number {
  const validHits = records.filter(r => r.action !== 'MISS');
  if (validHits.length === 0) return 1.0; // worst case

  const rms = Math.sqrt(
    validHits.reduce((sum, r) => sum + r.delta ** 2, 0) / validHits.length
  );

  return rms / bitPeriod; // 回傳 0.0 ~ 1.0+ 的比值（normalized）
}
```

**等級對應表（與遊戲中即時反饋一致）：**

| Jitter（Normalized） | 等級標籤 | 工程解讀 |
|---|---|---|
| 0.00 – 0.05 | Space Grade | 符合 SpaceWire ECSS-E-ST-50-12C 時序規範 |
| 0.05 – 0.15 | Industrial Grade | 適用工業級 LVDS 應用 |
| 0.15 – 0.25 | Consumer Grade | 短距傳輸邊緣可用 |
| > 0.25 | Link Unstable | Recovered Clock 頻率漂移，鏈路中斷風險 |

---

### 4.2 Skew（偏移） — 系統性時序偏差

**工程定義：** 所有 delta 值的**算術平均數**。代表玩家是否存在系統性的「習慣性搶拍」或「習慣性慢拍」。

```typescript
/**
 * METRIC: Skew
 *
 * Skew = mean(delta) / bitPeriod
 *
 * 解讀：
 *   Skew > 0  → 玩家習慣性「晚打」（Late Bias）
 *   Skew < 0  → 玩家習慣性「搶拍」（Early Bias）
 *   |Skew| ≈ 0 → 無系統性偏移，純隨機 Jitter
 *
 * 工程對應：
 *   類似 PCB 走線不等長導致的 Propagation Delay Mismatch。
 *   可透過 Delay Compensation 校正（即節奏遊戲的 Offset 設定）。
 */

function calculateSkew(records: HitRecord[], bitPeriod: number): number {
  const validHits = records.filter(r => r.action !== 'MISS');
  if (validHits.length === 0) return 0;

  const mean = validHits.reduce((sum, r) => sum + r.delta, 0) / validHits.length;
  return mean / bitPeriod; // 帶正負號，單位：Bit Period
}

type SkewBias = 'EARLY' | 'NEUTRAL' | 'LATE';

function classifySkew(normalizedSkew: number): SkewBias {
  if (normalizedSkew < -0.05) return 'EARLY';
  if (normalizedSkew > 0.05)  return 'LATE';
  return 'NEUTRAL';
}
```

**Skew 的獨特教育價值：**
Skew 是這三個指標中最有「可修正性」的。報告應告訴玩家：
「你的 Skew 是 +8.3%（Late Bias），建議在設定中將 Input Offset 調前 40ms。」
這讓玩家學到 **Calibration** 的概念，而不只是知道自己「打得不準」。

---

### 4.3 Link Error Rate（斷線率） — 邏輯錯誤比率

**工程定義：** 在所有應當動作的時機中，玩家選擇錯誤（TOGGLE/HOLD 判斷錯）或完全 MISS 的比例。

```typescript
/**
 * METRIC: Link Error Rate (LER)
 *
 * LER = (wrongActions + misses) / totalOpportunities
 *
 * 工程對應：
 *   類似 Bit Error Rate（BER）——在 SpaceWire 規範中，
 *   要求 BER < 10^-12（每兆億個 bit 最多一個錯）。
 *   玩家的 LER 直接對應 DS Encoder 邏輯電路的可靠度。
 *
 * 分類：
 *   WRONG_ACTION: 輸入了動作但動作類型錯誤（應 HOLD 卻 TOGGLE，反之亦然）
 *   MISS:         在時間窗口（±150ms）內完全無輸入
 */

interface SessionSummary {
  totalOpportunities: number;
  correctHits: number;
  wrongActions: number;
  misses: number;
  consecutiveCorrectPeak: number; // 最長連續正確串
}

function calculateLER(summary: SessionSummary): number {
  const errors = summary.wrongActions + summary.misses;
  return errors / summary.totalOpportunities; // 0.0 ~ 1.0
}

// LER 的工程語言對照
function getLERLabel(ler: number): string {
  if (ler <= 0.01)  return 'BER < 10⁻²  — Mission Critical Eligible';
  if (ler <= 0.05)  return 'BER < 5×10⁻² — Flight Heritage Candidate';
  if (ler <= 0.15)  return 'BER < 1.5×10⁻¹ — Ground Segment Only';
  return                   'LINK DOWN — Retransmission Required';
}
```

---

## 5. 綜合評分公式

```typescript
/**
 * SCORING ALGORITHM: Signal Integrity Score (SIS)
 *
 * 設計原則：
 *   - LER 權重最高（40%）：打對比打準更重要，呼應 DS 編碼「邏輯正確性優先」
 *   - Jitter 權重次之（35%）：計時穩定性是信號品質的核心
 *   - Skew 權重最低（25%）：系統性偏移可校正，懲罰應輕於隨機誤差
 *
 * 各子分計算：
 *   - 均為 0 ~ 100 的線性映射，邊界由工程規範決定
 *   - 滿分條件對應 Space Grade 規格
 */

interface SignalIntegrityScore {
  jitterScore: number;    // 0 ~ 100
  skewScore: number;      // 0 ~ 100
  lerScore: number;       // 0 ~ 100
  totalScore: number;     // 0 ~ 100（加權）
  grade: MissionGrade;
  certification: string;  // 可展示的工程認證標籤
}

type MissionGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'LINK_DOWN';

function computeSignalIntegrityScore(
  normalizedJitter: number,  // from calculateJitter()
  normalizedSkew: number,    // abs(calculateSkew())
  ler: number                // from calculateLER()
): SignalIntegrityScore {

  // Sub-scores: linear interpolation, clamped to [0, 100]
  const jitterScore = clamp(lerp(100, 0, normalizedJitter / 0.30), 0, 100);
  const skewScore   = clamp(lerp(100, 0, Math.abs(normalizedSkew) / 0.25), 0, 100);
  const lerScore    = clamp((1 - ler) * 100, 0, 100);

  // Weighted total
  const totalScore = (
    jitterScore * 0.35 +
    skewScore   * 0.25 +
    lerScore    * 0.40
  );

  const grade = getGrade(totalScore);

  return {
    jitterScore: Math.round(jitterScore),
    skewScore:   Math.round(skewScore),
    lerScore:    Math.round(lerScore),
    totalScore:  Math.round(totalScore),
    grade,
    certification: getCertification(grade),
  };
}

function getGrade(total: number): MissionGrade {
  if (total >= 95) return 'S';          // Space Grade — ECSS Compliant
  if (total >= 80) return 'A';          // Flight Heritage
  if (total >= 65) return 'B';          // Engineering Model
  if (total >= 50) return 'C';          // Prototype
  if (total >= 35) return 'D';          // Breadboard
  return 'LINK_DOWN';
}

function getCertification(grade: MissionGrade): string {
  const certs: Record<MissionGrade, string> = {
    'S':         'ECSS-E-ST-50-12C Compliant · Space Segment Qualified',
    'A':         'Flight Heritage Candidate · TRL 7',
    'B':         'Engineering Model · TRL 5',
    'C':         'Prototype · TRL 4',
    'D':         'Breadboard · TRL 3',
    'LINK_DOWN': 'Link Synchronization Failed · Ground Test Required',
  };
  return certs[grade];
}

// 工具函式
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;
```

---

## 6. UI/UX 規格

### 6.1 報告畫面結構

```
┌──────────────────────────────────────────────────┐
│  [MISSION COMPLETE / LINK DOWN]   頂部狀態橫幅   │
│                                                  │
│  ┌─────────────────────────────┐                 │
│  │  SIGNAL INTEGRITY REPORT    │  主標題區        │
│  │  Grade: [S/A/B/C/D]         │                 │
│  │  Total Score: XXX / 100     │                 │
│  └─────────────────────────────┘                 │
│                                                  │
│  ┌──────────┬──────────┬────────────┐            │
│  │  JITTER  │   SKEW   │    LER     │  三欄指標   │
│  │  XX.X%   │  ±X.X%   │   X.X%     │  儀表板    │
│  │  XX pts  │  XX pts  │   XX pts   │            │
│  └──────────┴──────────┴────────────┘            │
│                                                  │
│  ── JITTER DISTRIBUTION ──────────────────────── │
│  [散點圖：x = 時間軸, y = delta/bitPeriod]       │  視覺化區
│  [直方圖：delta 分佈，高斯曲線疊加]              │
│                                                  │
│  ── SKEW ANALYSIS ─────────────────────────────  │
│  [時序偏移箭頭圖：早/中/晚 三段標示]             │
│  [文字建議：「建議將 Input Offset 調整 +XXms」]  │
│                                                  │
│  ── ENGINEER'S ASSESSMENT ──────────────────────  │
│  [2-3 行工程師口吻的文字診斷]                    │  文字診斷區
│                                                  │
│  ── CERTIFICATION ─────────────────────────────  │
│  [認證印章視覺元素]                              │
│  ECSS-E-ST-50-12C Compliant · TRL X             │
│                                                  │
│       [RETRY]          [SHARE REPORT]            │  CTA 按鈕
└──────────────────────────────────────────────────┘
```

### 6.2 視覺語言規格

```typescript
/**
 * VISUAL SPEC
  * 基於 anxplore.space 主視覺：深海軍藍底 + Mars Orange 強調色
  * 優先使用 @anxplore/ui
 */

const REPORT_THEME = {
  background:    '#0A0E1A',   // 深宇宙黑藍
  surface:       '#111827',   // 儀表板卡片背景
  border:        '#1E293B',   // 卡片邊框

  // Grade 對應色（與遊戲 Jitter 回饋色系一致）
  gradeColors: {
    S:         '#A855F7',  // Space Purple — Perfect 的紫色光芒
    A:         '#3B82F6',  // Industrial Blue
    B:         '#10B981',  // Engineering Green
    C:         '#F59E0B',  // Prototype Amber
    D:         '#EF4444',  // Breadboard Red
    LINK_DOWN: '#6B7280',  // Static Grey
  },

  // 散點圖顏色映射（依 Jitter 等級著色）
  dotColors: {
    PERFECT:      '#A855F7',
    GOOD:         '#3B82F6',
    MARGINAL:     '#F59E0B',
    LINK_WARNING: '#EF4444',
    MISS:         '#374151',
  },
};
```

### 6.3 入場動畫序列

```
動畫序列（總時長約 2.5 秒）：

T+0.0s  背景從遊戲畫面 fade to 報告背景
T+0.3s  頂部 Grade 徽章從上方飛入（彈跳緩動）
T+0.6s  Total Score 數字從 0 計數至最終值（1.2s 過渡）
T+0.8s  三欄指標卡片依序 slide-in（stagger 0.15s）
T+1.5s  散點圖資料點逐一浮現（依時間軸順序，總計 0.5s）
T+2.0s  Engineer's Assessment 文字逐字打印效果
T+2.5s  CTA 按鈕 fade in
```

---

## 7. 工程師診斷文字生成邏輯

```typescript
/**
 * ENGINEER'S ASSESSMENT GENERATOR
 *
 * 根據三項指標的組合，生成有工程意義的自然語言診斷。
 * 共 12 個組合情境（每個指標 high/low × 3 個指標）。
 */

interface AssessmentContext {
  jitterGrade:  'LOW' | 'MID' | 'HIGH';  // LOW = 好
  skewBias:     'EARLY' | 'NEUTRAL' | 'LATE';
  lerGrade:     'LOW' | 'MID' | 'HIGH';
  consecutivePeak: number;
}

function generateAssessment(ctx: AssessmentContext): string {
  const lines: string[] = [];

  // 第一句：整體鏈路狀態
  if (ctx.lerGrade === 'LOW' && ctx.jitterGrade === 'LOW') {
    lines.push('Link synchronization maintained throughout the session. DS encoder logic executed with high fidelity.');
  } else if (ctx.lerGrade === 'HIGH') {
    lines.push('Multiple DS encoding violations detected. Strobe toggling logic requires review — the XOR rule was frequently misapplied.');
  } else {
    lines.push('Partial link integrity achieved. DS encoding logic was largely correct, but timing stability showed degradation.');
  }

  // 第二句：Jitter / Skew 的工程解讀
  if (ctx.skewBias !== 'NEUTRAL') {
    const direction = ctx.skewBias === 'LATE' ? 'positive' : 'negative';
    const correction = ctx.skewBias === 'LATE' ? 'reduce' : 'increase';
    lines.push(
      `Systematic ${direction} skew detected. This resembles propagation delay mismatch ` +
      `on a PCB trace. Consider adjusting your input offset to ${correction} latency compensation.`
    );
  } else if (ctx.jitterGrade === 'HIGH') {
    lines.push('High random jitter observed with no systematic bias — consistent with thermal noise or unstable clock source behavior in a real SpaceWire node.');
  } else {
    lines.push('Timing distribution centered near ideal edge with minimal systematic offset. Clock recovery would be stable in a real link.');
  }

  // 第三句：最長連擊的正面強化
  if (ctx.consecutivePeak >= 20) {
    lines.push(`Peak of ${ctx.consecutivePeak} consecutive correct encodings — equivalent to ${(ctx.consecutivePeak * 10).toLocaleString()} error-free bits at 200Mbps.`);
  }

  return lines.join(' ');
}
```

---

## 8. 資料流與狀態管理

```typescript
/**
 * DATA FLOW
 *
 * 遊戲結束 → 計算 → 渲染報告
 * 所有計算在 Web Worker 執行，不阻塞主執行緒
 */

// 遊戲期間持續累積
interface LiveSessionData {
  hitRecords: HitRecord[];
  sessionSummary: SessionSummary;
  bitPeriod: number;          // 1 / selectedBitRate（秒）
  totalDuration: number;      // 遊戲總時長（秒）
  selectedDifficulty: 'TRL3' | 'TRL5' | 'TRL7' | 'ECSS';
}

// 計算完成後的靜態快照（傳給 Report 元件）
interface ReportPayload {
  metrics: {
    jitter:    { normalized: number; rms_ms: number; grade: string };
    skew:      { normalized: number; bias: SkewBias; suggestedOffset_ms: number };
    ler:       { value: number; wrongActions: number; misses: number; label: string };
  };
  score:       SignalIntegrityScore;
  assessment:  string;
  distribution: { time: number; delta: number; grade: string }[];  // 給散點圖用
}

// Web Worker 介面
// file: src/workers/reportCalculator.worker.ts
self.onmessage = (event: MessageEvent<LiveSessionData>) => {
  const { hitRecords, sessionSummary, bitPeriod } = event.data;

  const normalizedJitter = calculateJitter(hitRecords, bitPeriod);
  const normalizedSkew   = calculateSkew(hitRecords, bitPeriod);
  const ler              = calculateLER(sessionSummary);
  const score            = computeSignalIntegrityScore(normalizedJitter, normalizedSkew, ler);

  const payload: ReportPayload = {
    metrics: {
      jitter: {
        normalized: normalizedJitter,
        rms_ms:     normalizedJitter * bitPeriod * 1000,
        grade:      getJitterGradeLabel(normalizedJitter),
      },
      skew: {
        normalized:          normalizedSkew,
        bias:                classifySkew(normalizedSkew),
        suggestedOffset_ms:  -normalizedSkew * bitPeriod * 1000,
      },
      ler: {
        value:        ler,
        wrongActions: sessionSummary.wrongActions,
        misses:       sessionSummary.misses,
        label:        getLERLabel(ler),
      },
    },
    score,
    assessment: generateAssessment({
      jitterGrade:     normalizedJitter < 0.10 ? 'LOW' : normalizedJitter < 0.20 ? 'MID' : 'HIGH',
      skewBias:        classifySkew(normalizedSkew),
      lerGrade:        ler < 0.05 ? 'LOW' : ler < 0.15 ? 'MID' : 'HIGH',
      consecutivePeak: sessionSummary.consecutiveCorrectPeak,
    }),
    distribution: hitRecords.map(r => ({
      time:  r.idealEdgeTime,
      delta: r.delta / bitPeriod,
      grade: getHitGrade(Math.abs(r.delta) / bitPeriod),
    })),
  };

  self.postMessage(payload);
};
```

---

## 9. 實作任務清單

### TASK XOR-CORE-001 — GameConfig 與模式系統

```yaml
task_id: XOR-CORE-001
title: 建立 GameConfig 型別與 buildGameConfig() 工廠函式
priority: P0
depends_on: []
estimated_effort: 2h

files_to_create:
  - src/types/game.types.ts     # GameConfig, SpeedLevel, SpeedConfig 等型別
  - src/config/speeds.ts        # SPEED_CONFIGS, EASY_MODE_SPEEDS, ADVANCED_MODE_SPEEDS
  - src/config/keymaps.ts       # EASY_MODE_KEYMAP, ADVANCED_MODE_KEYMAP

implementation_notes: |
  - buildGameConfig() 為純函式，輸入 mode + speed，輸出完整 GameConfig
  - hitWindow 以秒為單位儲存（不是毫秒），避免後續換算錯誤
  - bitPeriod 來自 SPEED_CONFIGS，供 TimingClock 與 ReportCalculator 共用同一來源

acceptance_criteria:
  - 6 種組合（2 mode × 3 speed）的 buildGameConfig() 輸出完整無缺漏欄位
  - Easy Speed 3 的 hitWindow = 0.1（秒）
  - Advanced Speed 3 的 hitWindow = 0.08（秒）
  - 單元測試覆蓋所有 6 種組合
```

---

### TASK XOR-CORE-002 — 輸入系統（雙模式鍵盤處理）

```yaml
task_id: XOR-CORE-002
title: 實作 InputHandler，支援 Easy / Advanced 雙模式
priority: P0
depends_on: [XOR-CORE-001]
estimated_effort: 3h

files_to_create:
  - src/game/InputHandler.ts

implementation_notes: |
  Easy Mode：
    - Space keydown → emit('TOGGLE_STROBE', timestamp)
    - 忽略 keyup，防止 keydown 重複觸發（需節流）
    - 觸控：touchstart on canvas → 同上

  Advanced Mode：
    - ArrowUp / KeyW keydown → emit('SET_STROBE_HIGH', timestamp)
    - ArrowDown / KeyS keydown → emit('SET_STROBE_LOW', timestamp)
    - 若目前 Strobe 已在目標電位，emit('REDUNDANT_INPUT') → 不計分但不扣分

  共用：
    - timestamp 使用 performance.now()，不使用 event.timeStamp（精度差異）
    - 所有輸入事件在 GameLoop 的判定器中處理，InputHandler 只做 emit
    - keydown 期間若持續壓鍵，不重複 emit（防止連發）

acceptance_criteria:
  - Easy Mode：連續快速按壓 Space 10 次，emit 恰好 10 次（無重複無漏發）
  - Advanced Mode：ArrowUp 正確 emit SET_STROBE_HIGH，ArrowDown emit SET_STROBE_LOW
  - 切換 GameConfig 後，InputHandler 自動切換監聽的按鍵集合
  - 遊戲結束後 removeEventListener 完整清除（無記憶體洩漏）
```

---

### TASK XOR-CORE-003 — Mode Select UI 元件

```yaml
task_id: XOR-CORE-003
title: 實作 ModeSelect 選擇畫面（React + GSAP）
priority: P1
depends_on: [XOR-CORE-001]
estimated_effort: 3h

files_to_create:
  - src/ui/ModeSelect.tsx
  - src/ui/ModeCard.tsx       # Easy / Advanced 各一張卡片
  - src/ui/SpeedSelector.tsx  # 每張卡片內的三速度選擇器

visual_spec:
  layout: 左右兩欄，各一張 ModeCard
  ModeCard_Easy:
    accent_color: '#3B82F6'    # Industrial Blue（與 Good 判定色一致）
    key_badge: '[SPACE]'
    speed_labels: ['100 Mbps  TRL-3', '150 Mbps  TRL-5', '200 Mbps  TRL-7']
  ModeCard_Advanced:
    accent_color: '#A855F7'    # Space Purple（與 Perfect 判定色一致）
    key_badge: '[↑] [↓]'
    speed_labels: ['100 Mbps  TRL-5', '150 Mbps  TRL-7', '200 Mbps  ECSS']
  animation:
    - 頁面進入：兩張卡片從左右飛入，stagger 0.2s
    - 懸停：卡片微微上浮 + 邊框發光（accent_color glow）
    - 選中速度：radio 圓點填色動畫

onboarding_hint:
  顯示條件: Easy Mode + SPEED_1 且 !localStorage.getItem('xor_onboarding_done')
  樣式: 底部小字「💡 建議新手從此開始」+ 箭頭指向 100 Mbps 選項

acceptance_criteria:
  - 點擊 SELECT 後正確傳入對應 GameConfig 給父層 onStart(config) callback
  - 行動裝置（375px 寬）兩欄改為上下堆疊
  - keyboard navigation 可用（Tab 切換 + Enter 選擇）
```

---

### TASK XOR-CORE-004 — 互動教學（Onboarding）系統

```yaml
task_id: XOR-CORE-004
title: 實作 Easy Mode Speed 1 的互動式教學流程
priority: P2
depends_on: [XOR-CORE-002, XOR-CORE-003]
estimated_effort: 4h

files_to_create:
  - src/ui/Onboarding.tsx
  - src/ui/OnboardingStep.tsx

steps:
  1: 高亮 Data 賽道 + 文字說明（凍結遊戲）
  2: 高亮 Strobe 賽道 + 文字說明
  3: 高亮 Recovered Clock + 公式「D ⊕ S」動畫展示
  4: 示範動畫：Data 不變 → 按 SPACE → Strobe 翻轉 → Clock 跳動
  5: 示範動畫：Data 翻轉 → 不按 → Strobe 靜止 → Clock 跳動
  6: 釋放控制權：「你的任務開始了」

implementation_notes: |
  - 教學期間 GameLoop 暫停（isPaused = true），不收集 HitRecord
  - 示範動畫用 GSAP 控制假波形，不走真實 AudioContext
  - 完成後寫入 localStorage('xor_onboarding_done', 'true')
  - 提供「跳過教學」按鈕（右上角小字）

acceptance_criteria:
  - 教學完成後 localStorage 有對應 key
  - 第二次進入 Easy Speed 1 直接略過教學
  - 教學期間 HitCollector 的 records 長度為 0
```

---

### TASK XOR-REPORT-001 — HitRecord 累積機制

```yaml
task_id: XOR-REPORT-001
title: 在遊戲 Loop 中建立 HitRecord 收集器
priority: P0
depends_on: []
estimated_effort: 2h

files_to_create:
  - src/game/HitCollector.ts

files_to_modify:
  - src/game/GameLoop.ts       # 每次 DS 動作時機，呼叫 HitCollector.record()
  - src/game/DSArbiter.ts      # 在判定時傳入 idealEdgeTime

implementation_notes: |
  - idealEdgeTime 必須來自 AudioContext.currentTime（排程時記錄），不可在判定時計算
  - playerInputTime 使用 performance.now() 換算至 audioCtx 時間域
  - MISS 判定：時間窗口 ±150ms 內無輸入（可設為 config 參數）
  - HitCollector 以陣列儲存，每局遊戲開始時清空

acceptance_criteria:
  - HitRecord 陣列長度 = totalOpportunities（含 MISS）
  - 所有 delta 值的單位為秒（非毫秒）
  - MISS record 的 delta 設為 NaN，不參與 Jitter/Skew 計算
  - 單元測試：模擬 100 次完美輸入，jitter 結果應 < 0.001
```

---

### TASK XOR-REPORT-002 — Report Calculator Web Worker

```yaml
task_id: XOR-REPORT-002
title: 建立 reportCalculator.worker.ts
priority: P0
depends_on: [XOR-REPORT-001]
estimated_effort: 3h

files_to_create:
  - src/workers/reportCalculator.worker.ts
  - src/workers/metrics.ts      # 所有計算函式（可獨立單元測試）
  - src/workers/assessment.ts   # generateAssessment()

implementation_notes: |
  - 使用 Vite 的 ?worker import 語法載入
  - metrics.ts 中的所有函式需為純函式（pure functions），無副作用
  - 計算完成後以 postMessage 回傳 ReportPayload

acceptance_criteria:
  - Worker 在 UI thread 凍結情況下仍可完成計算
  - 輸入 100 筆 HitRecord，計算時間 < 10ms
  - 單元測試覆蓋率 > 90%（metrics.ts）
  - 邊界測試：全 MISS、全 PERFECT、全 WRONG_ACTION 各一組
```

---

### TASK XOR-REPORT-003 — 散點圖視覺化元件

```yaml
task_id: XOR-REPORT-003
title: 實作 Jitter Distribution 散點圖（PixiJS）
priority: P1
depends_on: [XOR-REPORT-002]
estimated_effort: 4h

files_to_create:
  - src/report/JitterScatterPlot.ts   # PixiJS Graphics 繪製
  - src/report/GaussianOverlay.ts     # 疊加高斯分佈曲線

visual_spec:
  x_axis: 時間（0 ~ 遊戲總時長）
  y_axis: delta / bitPeriod（-0.5 ~ +0.5，中線為 0）
  dot_color: 依 Jitter Grade 著色（參見 REPORT_THEME.dotColors）
  dot_size: 4px
  y_axis_lines:
    - y=0:    白色實線（Ideal Edge）
    - y=±0.05: 紫色虛線（Space Grade 邊界）
    - y=±0.15: 藍色虛線（Industrial Grade 邊界）
    - y=±0.25: 橘色虛線（Link Warning 邊界）
  animation: 資料點從左至右依序浮現，duration 500ms

acceptance_criteria:
  - 散點圖在 1920×1080 視窗下不出現資料點溢出
  - 動畫在 60fps 下流暢執行
  - y 軸邊界線標籤清晰可讀（14px 以上）
```

---

### TASK XOR-REPORT-004 — Skew 分析視覺化元件

```yaml
task_id: XOR-REPORT-004
title: 實作 Skew Analysis 時序偏移圖
priority: P1
depends_on: [XOR-REPORT-002]
estimated_effort: 2h

files_to_create:
  - src/report/SkewAnalysis.tsx   # React 元件（SVG-based）

visual_spec:
  layout: |
    [EARLY] ←————[IDEAL]————→ [LATE]
              ↑（玩家偏移箭頭）
  arrow_color: 依 bias 方向著色（EARLY=藍, NEUTRAL=綠, LATE=橘）
  annotation: |
    箭頭下方顯示：「Skew: +X.X% Bit Period（Late Bias）」
    若 bias 非 NEUTRAL，顯示：「建議調整 Input Offset: −XXms」

acceptance_criteria:
  - 箭頭方向與 Skew 正負號一致（正值 = 向右）
  - Offset 建議值計算正確（suggestedOffset = −skew_ms）
  - 中性偏移時箭頭不顯示，僅顯示「Timing Centered」
```

---

### TASK XOR-REPORT-005 — 評分卡與 Grade 徽章

```yaml
task_id: XOR-REPORT-005
title: 實作 ScoreCard 與 Grade Badge 元件
priority: P1
depends_on: [XOR-REPORT-002]
estimated_effort: 3h

files_to_create:
  - src/report/ScoreCard.tsx
  - src/report/GradeBadge.tsx
  - src/report/MetricPill.tsx    # 三個指標的小卡元件

animation_spec:
  score_counter:
    from: 0
    to: totalScore
    duration: 1200ms
    easing: easeOutCubic
    library: GSAP CountTo
  grade_badge:
    entrance: scale(0) → scale(1.2) → scale(1.0)
    duration: 600ms
    delay: 300ms
    add_glow: true（使用 gradeColors 的對應顏色）

acceptance_criteria:
  - Grade S 時觸發全螢幕紫色光暈效果（CSS radial-gradient animation）
  - Grade LINK_DOWN 時 Badge 顯示靜電干擾效果（CSS noise animation）
  - 分數計數器動畫期間，按鈕為 disabled 狀態
```

---

### TASK XOR-REPORT-006 — Share Report 功能

```yaml
task_id: XOR-REPORT-006
title: 實作報告分享功能
priority: P2
depends_on: [XOR-REPORT-005]
estimated_effort: 3h

files_to_create:
  - src/report/ShareReport.ts

implementation_spec:
  step_1: |
    使用 html2canvas 將報告卡片截圖為 PNG
    截圖區域：Score Card + 三項指標 + Grade Badge + Certification
    不包含：散點圖（資料量大，截圖品質差）
  step_2: |
    在截圖底部加入浮水印：
    「XORbit · anxplore.space/lab/XORbit」
  step_3: |
    優先使用 Web Share API（行動裝置）
    Fallback：下載 PNG 檔案
  filename_format: |
    XORbit-report-[GRADE]-[SCORE]-[YYYYMMDD].png

share_card_content:
  - Grade 大字
  - Total Score
  - 三項指標數值（一行顯示）
  - Certification 文字
  - 品牌浮水印

acceptance_criteria:
  - PNG 解析度 ≥ 1200×630px（符合 OG Image 標準）
  - 行動裝置上 Share API 可正常調用
  - 桌面端 Fallback 下載功能正常
  - 浮水印位置不遮蓋分數資訊
```

---

### TASK XOR-REPORT-007 — 報告頁面整合與動畫序列

```yaml
task_id: XOR-REPORT-007
title: 整合所有元件，實作入場動畫序列
priority: P1
depends_on: [XOR-REPORT-003, XOR-REPORT-004, XOR-REPORT-005]
estimated_effort: 3h

files_to_create:
  - src/report/SignalIntegrityReport.tsx   # 主容器元件
  - src/report/ReportAnimator.ts           # GSAP Timeline 控制器

animation_timeline:
  - T+0.0s: 背景 fade（從遊戲畫面 blur + darken → 報告背景）
  - T+0.3s: GradeBadge 飛入
  - T+0.6s: ScoreCard 出現，分數開始計數
  - T+0.8s: MetricPill ×3 stagger slide-in（間隔 150ms）
  - T+1.5s: JitterScatterPlot 資料點逐一浮現
  - T+2.0s: SkewAnalysis 箭頭動畫
  - T+2.2s: Assessment 文字打字效果
  - T+2.5s: CTA 按鈕 fade in，Share 按鈕 enabled

state_management:
  - 使用 React useState 管理 ReportPayload
  - 元件 mount 時發送 message 至 Web Worker
  - Worker 回傳後更新 state，觸發動畫序列

acceptance_criteria:
  - 整體動畫不卡頓（Chrome Performance 面板 > 50fps）
  - Worker 計算期間顯示 loading 骨架畫面
  - Retry 按鈕重置 GameLoop，不重新載入頁面
```

---

## 10. 檔案結構總覽

```
src/
├── config/
│   ├── speeds.ts                # ★ NEW: SPEED_CONFIGS, EASY/ADVANCED_MODE_SPEEDS
│   └── keymaps.ts               # ★ NEW: EASY/ADVANCED_MODE_KEYMAP
│
├── game/
│   ├── GameLoop.ts              # 主遊戲迴圈（修改：接受 GameConfig，整合雙模式）
│   ├── DSArbiter.ts             # DS 編碼仲裁器（修改：傳入 idealEdgeTime）
│   ├── InputHandler.ts          # ★ NEW: 雙模式輸入處理器
│   ├── HitCollector.ts          # ★ NEW: HitRecord 累積器
│   └── TimingClock.ts           # Web Audio 計時器（修改：bitPeriod 來自 GameConfig）
│
├── ui/
│   ├── ModeSelect.tsx           # ★ NEW: 模式選擇畫面
│   ├── ModeCard.tsx             # ★ NEW: Easy / Advanced 卡片
│   ├── SpeedSelector.tsx        # ★ NEW: 三速度選擇器
│   ├── Onboarding.tsx           # ★ NEW: 互動教學流程
│   └── OnboardingStep.tsx       # ★ NEW: 單步教學元件
│
├── workers/
│   ├── reportCalculator.worker.ts  # ★ NEW: Web Worker 入口
│   ├── metrics.ts                  # ★ NEW: 純函式計算模組
│   └── assessment.ts               # ★ NEW: 診斷文字生成器
│
├── report/
│   ├── SignalIntegrityReport.tsx   # ★ NEW: 主容器
│   ├── ReportAnimator.ts           # ★ NEW: GSAP Timeline
│   ├── ScoreCard.tsx               # ★ NEW
│   ├── GradeBadge.tsx              # ★ NEW
│   ├── MetricPill.tsx              # ★ NEW
│   ├── JitterScatterPlot.ts        # ★ NEW (PixiJS)
│   ├── GaussianOverlay.ts          # ★ NEW (PixiJS)
│   ├── SkewAnalysis.tsx            # ★ NEW (SVG)
│   └── ShareReport.ts              # ★ NEW
│
└── types/
    ├── game.types.ts               # ★ NEW: GameConfig, SpeedLevel, CueMarker 等
    └── report.types.ts             # ★ NEW: ReportPayload, SignalIntegrityScore 等
```

---

## 11. 測試策略

```typescript
// src/workers/__tests__/metrics.test.ts

describe('calculateJitter', () => {
  it('should return 0 for perfectly timed inputs', () => {
    const records = createPerfectRecords(50, bitPeriod);
    expect(calculateJitter(records, bitPeriod)).toBeCloseTo(0, 5);
  });

  it('should return ~1.0 for worst-case inputs', () => {
    const records = createWorstCaseRecords(50, bitPeriod);
    expect(calculateJitter(records, bitPeriod)).toBeGreaterThan(0.25);
  });

  it('should ignore MISS records', () => {
    const withMiss    = createMixedRecords(40, 10, bitPeriod); // 40 hit, 10 miss
    const withoutMiss = createPerfectRecords(40, bitPeriod);
    expect(calculateJitter(withMiss, bitPeriod))
      .toBeCloseTo(calculateJitter(withoutMiss, bitPeriod), 3);
  });
});

describe('computeSignalIntegrityScore', () => {
  it('should return grade S for space-grade performance', () => {
    const score = computeSignalIntegrityScore(0.02, 0.01, 0.005);
    expect(score.grade).toBe('S');
    expect(score.totalScore).toBeGreaterThanOrEqual(95);
  });

  it('should return LINK_DOWN for catastrophic failure', () => {
    const score = computeSignalIntegrityScore(0.40, 0.30, 0.80);
    expect(score.grade).toBe('LINK_DOWN');
  });
});
```

---

## 12. 實作優先順序與里程碑

```
Sprint 0（Week 0）— 核心基礎層（新增）
  ✅ XOR-CORE-001: GameConfig 型別與工廠函式
  ✅ XOR-CORE-002: InputHandler 雙模式輸入系統
  ✅ XOR-CORE-003: ModeSelect UI 元件

Sprint 1（Week 1）— 遊戲邏輯層
  ✅ XOR-CORE-004: Onboarding 互動教學
  ✅ XOR-REPORT-001: HitRecord 累積機制
  ✅ XOR-REPORT-002: Web Worker + 所有 metrics 函式
  ✅ 單元測試建立（6 種 GameConfig 組合 + metrics 邊界測試）

Sprint 2（Week 2）— 視覺元件層
  ✅ XOR-REPORT-005: ScoreCard + GradeBadge
  ✅ XOR-REPORT-004: SkewAnalysis
  ✅ XOR-REPORT-003: JitterScatterPlot

Sprint 3（Week 3）— 整合與發布
  ✅ XOR-REPORT-007: 動畫序列整合
  ✅ XOR-REPORT-006: Share 功能
  ✅ End-to-end 測試（含 Advanced Mode WRONG_DIRECTION 邊界案例）
```

---

*文件結束 · XORbit Dev Plan v0.2.0*
*Generated for Anxplore Lab · anxplore.space*
*Sections: §1 背景 · §2 遊戲規則 · §3 遊戲模式 · §4 量測指標 · §5 評分公式 · §6 UI/UX · §7 診斷文字 · §8 資料流 · §9 任務清單（XOR-CORE-001~004 + XOR-REPORT-001~007） · §10 檔案結構 · §11 測試策略 · §12 里程碑*

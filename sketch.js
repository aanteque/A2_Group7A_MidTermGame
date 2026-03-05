// FUZZY BET - p5.js
// ACT 1: Tutorial  — 5 rounds, single number, remember & guess
// ACT 2: Sum Blitz — 6 rounds, multiple scattered numbers, guess the sum

const C = {
  bg: [8, 10, 15],
  card: [13, 16, 23],
  bord: [26, 32, 48],
  red: [255, 45, 74],
  amber: [255, 170, 0],
  cyan: [0, 229, 255],
  green: [0, 255, 136],
  muted: [58, 69, 96],
  text: [200, 212, 240],
  white: [238, 242, 255],
  purple: [180, 80, 255],
};

// ── Layout ────────────────────────────────────────────────────────────────────
const PAD = 20;
const GAP = 16;
const CW = 520;

const H_HEADER = 100;
const H_STATS = 62;
const H_ARENA = 220;
const H_BET = 100;
const H_ANSWER_COLLAPSED = 36;
const H_ANSWER_EXPANDED = 92;
const H_LOG = 24;
const H_REVEAL = 52;

const CH =
  PAD +
  H_HEADER +
  GAP +
  H_STATS +
  GAP +
  H_ARENA +
  GAP +
  H_BET +
  GAP +
  H_ANSWER_EXPANDED +
  GAP +
  H_LOG +
  GAP +
  H_REVEAL +
  PAD;

const Y_HEADER = PAD;
const Y_STATS = Y_HEADER + H_HEADER + GAP;
const Y_ARENA = Y_STATS + H_STATS + GAP;
const Y_BET = Y_ARENA + H_ARENA + GAP;
const Y_ANSWER = Y_BET + H_BET + GAP;
const Y_LOG = Y_ANSWER + H_ANSWER_EXPANDED + GAP;
const Y_REVEAL = Y_LOG + H_LOG + GAP;

// ── Game state ────────────────────────────────────────────────────────────────
let chips = 50,
  streak = 0,
  currentBet = 0;
let act = 1; // 1 = Tutorial, 2 = Sum Blitz
let actRound = 1; // 1-5 for act 1, 1-6 for act 2
let finalChips = 0; // stored when game ends

let correctAnswer = 0;
let sumNumbers = []; // act 2 numbers to sum
let numPositions = []; // act 2 screen positions
let numFlips = []; // act 2: flip type per number: 0=normal, 1=h-mirror, 2=v-flip, 3=both
let act1Pos = { x: 0, y: 0 }; // act 1 number position (randomised each flash)
let state = "SPLASH"; // SPLASH | BET | FLASH | ANSWER | RESULT | ACT_TRANSITION | GAME_OVER
let isMirrored = false;
let flipType = 0; // act 1: 0=normal, 1=h-mirror, 2=v-flip, 3=both

let flashTimer = 0,
  flashDuration = 0;
let resultTimer = 0,
  transitionTimer = 0;
let choices = [];
let selectedAnswer = -1;
let logMsg = "Select a wager, then hit REVEAL.";
let logType = "muted";
let glitching = false;
let answerTimer = 0; // counts down 6000ms while in ANSWER state
const ANSWER_TIME = 6000;

const CHIP_VALUES = [5, 10, 25, 50, "ALL"];
let chipBtns = [];
let answerBtns = [];
let revealBtn = null;
let startBtn = null; // splash screen
let playAgainBtn = null; // game over screen
let revealHover = false;
let revealFill = 0;
let answerHover = -1;
let answerH = H_ANSWER_COLLAPSED;

// ── Difficulty tables ─────────────────────────────────────────────────────────
function getA1Diff() {
  // All rounds always have some flip — mirror/vflip/both weights shift each round
  // 4 rounds total
  const tiers = [
    { ms: 1600, label: "EASY", mult: 1.5 },
    { ms: 1000, label: "SHAKY", mult: 2.0 },
    { ms: 650, label: "BLURRED", mult: 2.5 },
    { ms: 380, label: "FUZZY", mult: 3.5 },
  ];
  return tiers[min(actRound - 1, tiers.length - 1)];
}

function getA2Diff() {
  // Every number is always flipped (flipChance: 1.0 across all rounds)
  const tiers = [
    {
      ms: 2200,
      count: 2,
      scatter: false,
      flipChance: 1.0,
      label: "CALM",
      mult: 1.5,
    },
    {
      ms: 1600,
      count: 2,
      scatter: true,
      flipChance: 1.0,
      label: "DRIFTING",
      mult: 1.8,
    },
    {
      ms: 1100,
      count: 3,
      scatter: true,
      flipChance: 1.0,
      label: "SPREAD",
      mult: 2.2,
    },
    {
      ms: 3000,
      count: 3,
      scatter: true,
      flipChance: 1.0,
      label: "CHAOS",
      mult: 2.8,
    },
    {
      ms: 3000,
      count: 4,
      scatter: true,
      flipChance: 1.0,
      label: "FRENZY",
      mult: 3.5,
    },
    {
      ms: 3000,
      count: 5,
      scatter: true,
      flipChance: 1.0,
      label: "MAYHEM",
      mult: 4.5,
    },
  ];
  return tiers[min(actRound - 1, tiers.length - 1)];
}

function getDiff() {
  return act === 1 ? getA1Diff() : getA2Diff();
}

// ── p5 helpers ────────────────────────────────────────────────────────────────
function col(key, a) {
  let c = C[key] || C.white;
  return a !== undefined ? color(c[0], c[1], c[2], a) : color(c[0], c[1], c[2]);
}
function setShadow(c, blur) {
  drawingContext.shadowColor = c;
  drawingContext.shadowBlur = blur;
}
function clearShadow() {
  drawingContext.shadowColor = "transparent";
  drawingContext.shadowBlur = 0;
}
function setFont(size, style) {
  textSize(size);
  if (style === "display") {
    drawingContext.font = size + 'px "Bebas Neue", sans-serif';
  } else {
    drawingContext.font = size + 'px "Share Tech Mono", monospace';
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  SETUP & DRAW
// ═════════════════════════════════════════════════════════════════════════════
function setup() {
  createCanvas(CW, CH);
  textFont("Share Tech Mono");
}

function draw() {
  background(col("bg"));
  drawScanlines();

  noStroke();
  fill(255, 45, 74, 8);
  ellipse(100, 60, 500, 260);
  fill(0, 229, 255, 6);
  ellipse(430, CH - 60, 400, 260);

  // Full-screen overlay states
  if (state === "SPLASH") {
    drawSplash();
    return;
  }
  if (state === "GAME_OVER") {
    drawGameOver();
    return;
  }

  // ACT TRANSITION takes over the whole canvas
  if (state === "ACT_TRANSITION") {
    drawActTransition();
    transitionTimer -= deltaTime;
    if (transitionTimer <= 0) beginAct2();
    return;
  }

  drawHeader();
  drawStats();
  drawArena();
  drawBetSection();
  drawAnswerSection();
  drawLog();
  drawRevealBtn();

  // timers
  if (state === "FLASH") {
    flashTimer -= deltaTime;
    if (flashTimer <= 0) endFlash();
    if (flashTimer < flashDuration * 0.3) glitching = true;
  }
  if (state === "ANSWER") {
    answerTimer -= deltaTime;
    if (answerTimer <= 0) handleTimeout();
  }
  if (state === "RESULT") {
    resultTimer -= deltaTime;
    if (resultTimer <= 0) nextRound();
  }

  // smooth animations
  let targetFill = revealHover && !revealBtn?.disabled ? 1 : 0;
  revealFill += (targetFill - revealFill) * 0.15;

  let targetH =
    state === "ANSWER" || state === "RESULT"
      ? H_ANSWER_EXPANDED
      : H_ANSWER_COLLAPSED;
  answerH += (targetH - answerH) * 0.18;
}

function drawScanlines() {
  stroke(0, 0, 0, 28);
  strokeWeight(1);
  for (let y = 0; y < height; y += 4) line(0, y, width, y);
  noStroke();
}

// ═════════════════════════════════════════════════════════════════════════════
//  HEADER
// ═════════════════════════════════════════════════════════════════════════════
function drawHeader() {
  textAlign(CENTER, TOP);
  // layered glow
  setShadow("rgba(255,45,74,0.2)", 80);
  fill(col("white"));
  setFont(64, "display");
  text("F U Z Z Y  B E T", CW / 2, Y_HEADER);
  setShadow("rgba(255,45,74,0.4)", 40);
  text("F U Z Z Y  B E T", CW / 2, Y_HEADER);
  setShadow("rgba(255,45,74,0.8)", 20);
  text("F U Z Z Y  B E T", CW / 2, Y_HEADER);
  clearShadow();
  fill(col("white"));
  text("F U Z Z Y  B E T", CW / 2, Y_HEADER);

  setFont(13, "ui");
  fill(col(act === 2 ? "purple" : "muted"));
  text(
    act === 1
      ? "ACT I  \u2014  TUTORIAL: Remember the number"
      : "ACT II \u2014  SUM BLITZ: Guess the total",
    CW / 2,
    Y_HEADER + 72,
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  STATS
// ═════════════════════════════════════════════════════════════════════════════
function drawStats() {
  let totalRounds = act === 1 ? 4 : 6;
  let labels = ["CHIPS", "ROUND", "STREAK"];
  let values = [chips, actRound + "/" + totalRounds, streak];
  let tints = ["amber", "cyan", "green"];
  let cw3 = (CW - PAD * 2 - GAP * 2) / 3;

  for (let i = 0; i < 3; i++) {
    let x = PAD + i * (cw3 + GAP);
    drawCard(x, Y_STATS, cw3, H_STATS);
    fill(col("muted"));
    setFont(9, "ui");
    textAlign(CENTER, TOP);
    text(labels[i], x + cw3 / 2, Y_STATS + 10);
    let tc = C[tints[i]];
    setShadow(`rgba(${tc[0]},${tc[1]},${tc[2]},0.55)`, 16);
    fill(col(tints[i]));
    setFont(28, "display");
    textAlign(CENTER, TOP);
    text(values[i], x + cw3 / 2, Y_STATS + 26);
    clearShadow();
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  ARENA
// ═════════════════════════════════════════════════════════════════════════════
function drawArena() {
  let ax = PAD,
    aw = CW - PAD * 2;
  drawCard(ax, Y_ARENA, aw, H_ARENA);
  let diff = getDiff();

  // top-left round label
  fill(col("muted"));
  setFont(9, "ui");
  textAlign(LEFT, TOP);
  text(
    (act === 1 ? "ACT I" : "ACT II") + "  RND " + actRound,
    ax + 12,
    Y_ARENA + 12,
  );

  // top-right multiplier
  textAlign(RIGHT, TOP);
  fill(act === 2 ? col("purple") : col("amber"));
  setFont(14, "display");
  text("\xd7" + diff.mult, ax + aw - 12, Y_ARENA + 11);
  clearShadow();

  // bottom-right difficulty label
  fill(col("muted"));
  setFont(9, "ui");
  textAlign(RIGHT, BOTTOM);
  text(diff.label, ax + aw - 12, Y_ARENA + H_ARENA - 10);

  // idle prompt
  if (state === "BET") {
    fill(col("muted"));
    setFont(13, "ui");
    textAlign(CENTER, CENTER);
    text(
      act === 1
        ? "Place your bet,\nthen reveal the number."
        : "Place your bet,\nthen watch the numbers flash.\nSome may be mirrored or flipped.\nGuess their SUM.",
      ax + aw / 2,
      Y_ARENA + H_ARENA / 2,
    );
  }

  // answer prompt
  if (state === "ANSWER" || state === "RESULT") {
    fill(col("muted"));
    setFont(13, "ui");
    textAlign(CENTER, CENTER);
    text(
      act === 1
        ? isMirrored
          ? "What was the REAL number?"
          : "What did you see?"
        : "What was the SUM?",
      ax + aw / 2,
      Y_ARENA + H_ARENA / 2,
    );
  }

  // flash
  if (state === "FLASH") {
    let pct01 = constrain(flashTimer / flashDuration, 0, 1);
    let fadeA = map(flashTimer, 0, flashDuration * 0.12, 0, 255);
    fadeA = constrain(fadeA, 0, 255);

    if (act === 1) drawAct1Flash(ax, aw, fadeA);
    else drawAct2Flash(ax, aw, fadeA);

    // timer bar
    let barRgb =
      pct01 < 0.3 ? "255,45,74" : act === 2 ? "180,80,255" : "0,229,255";
    let bc = pct01 < 0.3 ? col("red") : act === 2 ? col("purple") : col("cyan");
    setShadow(`rgba(${barRgb},0.8)`, 8);
    fill(bc);
    noStroke();
    rect(ax, Y_ARENA + H_ARENA - 3, aw * pct01, 3);
    clearShadow();
  }
}

// ─── Act 1 flash: single number, optionally mirrored / flipped ───────────────
function drawAct1Flash(ax, aw, fadeA) {
  // Use randomised position stored in act1Pos
  let cx = act1Pos.x;
  let cy = act1Pos.y;
  let a01 = fadeA / 255;
  let ox = 0,
    oy = 0;
  if (glitching && frameCount % 3 === 0) {
    ox = random(-6, 6);
    oy = random(-3, 3);
  }

  let isH = flipType === 1 || flipType === 3;
  let isV = flipType === 2 || flipType === 3;

  // Always red-tinted since there's always a transform
  let gr = "255,45,74";
  let gc = "255,45,74";

  push();
  translate(cx + ox, cy + oy);
  if (isH) scale(-1, 1);
  if (isV) scale(1, -1);

  setShadow(`rgba(${gr},${(a01 * 0.6).toFixed(2)})`, 30);
  fill(col("red", fadeA));
  setFont(120, "display");
  textAlign(CENTER, CENTER);
  text(correctAnswer, 0, 0);
  setShadow(`rgba(${gc},${(a01 * 0.3).toFixed(2)})`, 60);
  text(correctAnswer, 0, 0);
  clearShadow();
  text(correctAnswer, 0, 0);
  pop();
}

// ─── Act 2 flash: scattered numbers, each independently flipped ───────────────
function drawAct2Flash(ax, aw, fadeA) {
  let a01 = fadeA / 255;
  let diff = getA2Diff();
  const hues = [
    "255,255,255",
    "0,229,255",
    "180,80,255",
    "255,170,0",
    "0,255,136",
  ];
  let sz = diff.count <= 2 ? 90 : diff.count <= 3 ? 72 : 56;

  for (let i = 0; i < sumNumbers.length; i++) {
    let pos = numPositions[i];
    if (!pos) continue;

    // gentle drift when scatter is on
    let wobble = diff.scatter ? sin(frameCount * 0.08 + i * 1.3) * 4 : 0;
    let nx = ax + pos.x + wobble;
    let ny =
      Y_ARENA +
      pos.y +
      cos(frameCount * 0.06 + i * 0.9) * (diff.scatter ? 3 : 0);

    let ox = 0,
      oy = 0;
    if (glitching && frameCount % 3 === 0) {
      ox = random(-4, 4);
      oy = random(-2, 2);
    }

    let ft = numFlips[i] || 0;
    let isH = ft === 1 || ft === 3;
    let isV = ft === 2 || ft === 3;
    let isAny = ft !== 0;

    // flipped numbers draw in red, clean ones in their hue
    let h = isAny ? "255,45,74" : hues[i % hues.length];

    push();
    translate(nx + ox, ny + oy);
    if (isH) scale(-1, 1);
    if (isV) scale(1, -1);

    setShadow(`rgba(${h},${(a01 * 0.55).toFixed(2)})`, 20);
    fill(color(...h.split(",").map(Number), fadeA));
    setFont(sz, "display");
    textAlign(CENTER, CENTER);
    text(sumNumbers[i], 0, 0);
    clearShadow();
    pop();
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  BET SECTION
// ═════════════════════════════════════════════════════════════════════════════
function drawBetSection() {
  let x = PAD,
    w = CW - PAD * 2;
  drawCard(x, Y_BET, w, H_BET);

  fill(col("muted"));
  setFont(9, "ui");
  textAlign(LEFT, TOP);
  text("WAGER", x + 16, Y_BET + 12);

  chipBtns = [];
  let bh = 30,
    gap = 8;
  let bw = (w - 32 - gap * (CHIP_VALUES.length - 1)) / CHIP_VALUES.length;
  let bx = x + 16,
    by = Y_BET + 28;

  for (let i = 0; i < CHIP_VALUES.length; i++) {
    let val = CHIP_VALUES[i];
    let realVal = val === "ALL" ? 50 : val;
    let active = currentBet === realVal && state === "BET";
    let disabled = state !== "BET";
    chipBtns.push({ x: bx, y: by, w: bw, h: bh, realVal });
    drawChipBtn(bx, by, bw, bh, String(val), active, disabled);
    bx += bw + gap;
  }

  fill(col("muted"));
  setFont(9, "ui");
  textAlign(LEFT, TOP);
  text("BETTING:", x + 16, Y_BET + 68);
  setShadow("rgba(255,170,0,0.5)", 10);
  fill(col("amber"));
  setFont(22, "display");
  textAlign(LEFT, TOP);
  text(currentBet || "-", x + 78, Y_BET + 64);
  clearShadow();
}

function drawChipBtn(x, y, w, h, label, active, disabled) {
  let bc = disabled ? col("bord") : active ? col("amber") : col("muted");
  if (active) setShadow("rgba(255,170,0,0.3)", 10);
  noFill();
  stroke(bc);
  strokeWeight(1);
  rect(x, y, w, h);
  clearShadow();
  if (active) {
    fill(255, 170, 0, 38);
    noStroke();
    rect(x, y, w, h);
  }
  noStroke();
  fill(bc);
  setFont(12, "ui");
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2 + 1);
}

// ═════════════════════════════════════════════════════════════════════════════
//  ANSWER SECTION
// ═════════════════════════════════════════════════════════════════════════════
function drawAnswerSection() {
  let x = PAD,
    w = CW - PAD * 2;
  drawCard(x, Y_ANSWER, w, answerH);

  let flipLabel =
    flipType === 3
      ? "MIRRORED + FLIPPED \u2014 REAL NUMBER?"
      : flipType === 2
        ? "UPSIDE DOWN \u2014 REAL NUMBER?"
        : "IT WAS MIRRORED \u2014 WHAT WAS THE REAL NUMBER?";
  let lbl = act === 1 ? flipLabel : "WHAT WAS THE SUM?";
  fill(col("muted"));
  setFont(10, "ui");
  textAlign(LEFT, TOP);
  text(lbl, x + 16, Y_ANSWER + 12);

  answerBtns = [];
  let gap = 8;
  let bw = (w - 32 - gap * 3) / 4;
  let bh = 52,
    bx = x + 16,
    by = Y_ANSWER + 28;
  let btnAlpha = map(answerH, H_ANSWER_COLLAPSED, H_ANSWER_EXPANDED, 0, 255);
  btnAlpha = constrain(btnAlpha, 0, 255);

  for (let i = 0; i < 4; i++) {
    let val = choices[i] !== undefined ? choices[i] : null;
    let btnState = "idle";
    if (state === "RESULT" && val !== null) {
      if (val === correctAnswer) btnState = "correct";
      else if (val === selectedAnswer) btnState = "wrong";
    }
    // act 2: tint "close" answers differently in result
    let isClose =
      act === 2 &&
      state === "RESULT" &&
      val !== null &&
      val !== correctAnswer &&
      Math.abs(val - correctAnswer) <= 2;

    let hovered = answerHover === i && state === "ANSWER";
    answerBtns.push({ x: bx, y: by, w: bw, h: bh, val });
    if (val !== null && btnAlpha > 10) {
      drawAnswerBtn(bx, by, bw, bh, val, btnState, hovered, btnAlpha, isClose);
    }
    bx += bw + gap;
  }

  // countdown bar — only visible during ANSWER state
  if (state === "ANSWER") {
    let pct = constrain(answerTimer / ANSWER_TIME, 0, 1);
    let urgent = pct < 0.35;
    let barRgb = urgent ? "255,45,74" : "0,229,255";
    let bc = urgent ? col("red") : col("cyan");
    // track
    fill(col("bord"));
    noStroke();
    rect(x, Y_ANSWER + answerH - 3, w, 3);
    // fill
    setShadow(`rgba(${barRgb},0.8)`, urgent ? 10 : 6);
    fill(bc);
    noStroke();
    rect(x, Y_ANSWER + answerH - 3, w * pct, 3);
    clearShadow();
  }
}

function drawAnswerBtn(x, y, w, h, val, btnState, hovered, alpha, isClose) {
  if (alpha === undefined) alpha = 255;
  let a = alpha / 255;

  let bc =
    btnState === "correct"
      ? col("green", alpha)
      : btnState === "wrong"
        ? col("red", alpha)
        : isClose
          ? col("amber", alpha)
          : hovered
            ? col("cyan", alpha)
            : col("bord", alpha);
  let glowRgb =
    btnState === "correct"
      ? "0,255,136"
      : btnState === "wrong"
        ? "255,45,74"
        : isClose
          ? "255,170,0"
          : hovered
            ? "0,229,255"
            : null;

  if (glowRgb)
    setShadow(`rgba(${glowRgb},${(0.45 * a).toFixed(2)})`, hovered ? 15 : 18);
  noFill();
  stroke(bc);
  strokeWeight(1);
  rect(x, y, w, h);
  clearShadow();

  if (hovered) {
    fill(0, 229, 255, 13 * a);
    noStroke();
    rect(x, y, w, h);
  } else if (btnState !== "idle" || isClose) {
    fill(red(bc), green(bc), blue(bc), 26 * a);
    noStroke();
    rect(x, y, w, h);
  }

  noStroke();
  let tc = hovered
    ? col("cyan", alpha)
    : btnState === "idle"
      ? col("text", alpha)
      : btnState === "correct"
        ? col("green", alpha)
        : isClose
          ? col("amber", alpha)
          : col("red", alpha);
  fill(tc);
  setFont(28, "display");
  textAlign(CENTER, CENTER);
  text(val, x + w / 2, y + h / 2 + 2);
}

// ═════════════════════════════════════════════════════════════════════════════
//  LOG
// ═════════════════════════════════════════════════════════════════════════════
function drawLog() {
  let tints = {
    muted: "muted",
    good: "green",
    bad: "red",
    info: "cyan",
    special: "purple",
  };
  let key = tints[logType] || "muted";
  let tc = C[key];
  if (logType !== "muted")
    setShadow(`rgba(${tc[0]},${tc[1]},${tc[2]},0.45)`, 10);
  fill(col(key));
  setFont(11, "ui");
  textAlign(CENTER, CENTER);
  text(logMsg, CW / 2, Y_LOG + H_LOG / 2);
  clearShadow();
}

// ═════════════════════════════════════════════════════════════════════════════
//  REVEAL BUTTON
// ═════════════════════════════════════════════════════════════════════════════
function drawRevealBtn() {
  let x = PAD,
    w = CW - PAD * 2,
    h = H_REVEAL;
  let disabled = state !== "BET" || currentBet === 0;

  let borderCol = disabled ? color(120, 20, 35) : col("red");
  if (!disabled) setShadow("rgba(255,45,74,0.35)", 14);
  noFill();
  stroke(borderCol);
  strokeWeight(1);
  rect(x, Y_REVEAL, w, h);
  clearShadow();

  fill(disabled ? color(60, 10, 18) : color(30, 5, 10));
  noStroke();
  rect(x, Y_REVEAL, w, h);

  if (!disabled && revealFill > 0.001) {
    fill(col("red"));
    noStroke();
    rect(x, Y_REVEAL, w * revealFill, h);
  }

  let textFilled = !disabled && revealFill > 0.5;
  noStroke();
  fill(disabled ? color(120, 20, 35) : textFilled ? col("bg") : col("red"));
  setFont(22, "display");
  textAlign(CENTER, CENTER);
  text("REVEAL", x + w / 2, Y_REVEAL + h / 2 + 1);
  revealBtn = { x, y: Y_REVEAL, w, h, disabled };
}

// ═════════════════════════════════════════════════════════════════════════════
//  ACT TRANSITION SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function drawActTransition() {
  background(col("bg"));
  drawScanlines();

  let fadeIn = constrain(map(transitionTimer, 3000, 2400, 0, 255), 0, 255);
  let elapsed = 1 - transitionTimer / 3000;

  textAlign(CENTER, CENTER);
  setShadow("rgba(180,80,255,0.6)", 60);
  fill(col("purple", fadeIn));
  setFont(90, "display");
  text("ACT  II", CW / 2, CH / 2 - 60);
  clearShadow();

  setShadow("rgba(180,80,255,0.3)", 30);
  fill(col("purple", fadeIn));
  setFont(28, "display");
  text("S U M  B L I T Z", CW / 2, CH / 2 + 10);
  clearShadow();

  fill(col("muted", fadeIn));
  setFont(13, "ui");
  text(
    "Numbers scatter across the screen.\nYour job: guess their sum.\nClose counts \u2014 but perfection pays.",
    CW / 2,
    CH / 2 + 72,
  );

  // progress bar
  let bw = 300;
  noFill();
  stroke(col("bord"));
  strokeWeight(1);
  rect(CW / 2 - bw / 2, CH - 80, bw, 6);
  setShadow("rgba(180,80,255,0.8)", 8);
  fill(col("purple"));
  noStroke();
  rect(CW / 2 - bw / 2, CH - 80, bw * elapsed, 6);
  clearShadow();
}

// ═════════════════════════════════════════════════════════════════════════════
//  SPLASH SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function drawSplash() {
  // Title
  textAlign(CENTER, TOP);
  setShadow("rgba(255,45,74,0.2)", 80);
  fill(col("white"));
  setFont(64, "display");
  text("F U Z Z Y  B E T", CW / 2, Y_HEADER);
  setShadow("rgba(255,45,74,0.4)", 40);
  text("F U Z Z Y  B E T", CW / 2, Y_HEADER);
  setShadow("rgba(255,45,74,0.8)", 20);
  text("F U Z Z Y  B E T", CW / 2, Y_HEADER);
  clearShadow();
  fill(col("white"));
  text("F U Z Z Y  B E T", CW / 2, Y_HEADER);

  setFont(13, "ui");
  fill(col("muted"));
  text("A game about numbers you can't trust", CW / 2, Y_HEADER + 72);

  // Instructions card
  let cx = PAD,
    cw = CW - PAD * 2,
    cy = Y_STATS,
    ch = CH - Y_STATS - PAD - 68;
  drawCard(cx, cy, cw, ch);

  let tx = CW / 2,
    ty = cy + 24;
  setFont(18, "display");
  fill(col("amber"));
  textAlign(CENTER, TOP);
  setShadow("rgba(255,170,0,0.4)", 12);
  text("HOW TO PLAY", tx, ty);
  clearShadow();

  setFont(11, "ui");
  fill(col("muted"));
  textAlign(LEFT, TOP);
  let lx = cx + 24,
    lw = cw - 48;
  let lines = [
    { label: "ACT I  \u2014  TUTORIAL  (4 rounds)", color: "cyan" },
    {
      text: "A number flashes somewhere on screen. It will always be mirrored, flipped upside-down, or both. Bet chips, then pick the real number from four choices.",
    },
    { spacer: true },
    { label: "ACT II \u2014  SUM BLITZ  (6 rounds)", color: "purple" },
    {
      text: "Multiple numbers appear scattered across the screen. Add them up in your head, then pick the correct sum. Some numbers may be flipped. In later rounds, numbers stay longer but there are more of them.",
    },
    { spacer: true },
    { label: "SCORING", color: "amber" },
    { text: "Correct: win your bet \xd7 the round multiplier." },
    { text: "Act II close (\xb12): win half the multiplier." },
    { text: "Act II off by \u22645: break even." },
    { text: "Wrong: lose DOUBLE your bet. Chips CAN go negative." },
    { spacer: true },
    { label: "GOAL", color: "green" },
    {
      text: "Survive all 10 rounds and finish with as many chips as possible. You start with 50.",
    },
  ];

  let lineY = ty + 32;
  let lineH = 16;
  for (let l of lines) {
    if (l.spacer) {
      lineY += 8;
      continue;
    }
    if (l.label) {
      let lc = C[l.color] || C.cyan;
      setShadow(`rgba(${lc[0]},${lc[1]},${lc[2]},0.4)`, 8);
      fill(col(l.color));
      setFont(13, "display");
      textAlign(LEFT, TOP);
      text(l.label, lx, lineY);
      clearShadow();
      lineY += 18;
    } else {
      fill(col("text"));
      setFont(11, "ui");
      textAlign(LEFT, TOP);
      // word-wrap manually
      let words = l.text.split(" ");
      let line = "";
      for (let w of words) {
        let test = line + (line ? " " : "") + w;
        if (textWidth(test) > lw - 10) {
          text(line, lx + 10, lineY);
          lineY += lineH;
          line = w;
        } else {
          line = test;
        }
      }
      if (line) {
        text(line, lx + 10, lineY);
        lineY += lineH;
      }
    }
  }

  // Start button
  let bw = 240,
    bh = H_REVEAL;
  let bx = CW / 2 - bw / 2,
    by = CH - PAD - bh;
  let hovered = startBtn ? inBtn(mouseX, mouseY, startBtn) : false;
  let fill01 = hovered ? 1 : 0;

  setShadow("rgba(0,229,255,0.35)", 14);
  noFill();
  stroke(col("cyan"));
  strokeWeight(1);
  rect(bx, by, bw, bh);
  clearShadow();

  fill(color(0, 15, 20));
  noStroke();
  rect(bx, by, bw, bh);
  if (hovered) {
    fill(col("cyan"));
    noStroke();
    rect(bx, by, bw, bh);
  }

  noStroke();
  fill(hovered ? col("bg") : col("cyan"));
  setFont(22, "display");
  textAlign(CENTER, CENTER);
  text("START GAME", CW / 2, by + bh / 2 + 1);

  startBtn = { x: bx, y: by, w: bw, h: bh };
}

// ═════════════════════════════════════════════════════════════════════════════
//  GAME OVER SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function drawGameOver() {
  let chipColor =
    finalChips >= 100 ? "green" : finalChips >= 0 ? "amber" : "red";
  let chipRgb = C[chipColor];

  // Big centred card
  let cardW = CW - PAD * 2,
    cardH = 300;
  let cardX = PAD,
    cardY = CH / 2 - cardH / 2 - 20;
  drawCard(cardX, cardY, cardW, cardH);

  textAlign(CENTER, CENTER);
  let midX = CW / 2,
    midY = cardY + cardH / 2;

  // GAME OVER text — layered glow in red
  setShadow("rgba(255,45,74,0.25)", 80);
  fill(col("white"));
  setFont(80, "display");
  text("GAME OVER!", midX, midY - 60);
  setShadow("rgba(255,45,74,0.5)", 40);
  text("GAME OVER!", midX, midY - 60);
  setShadow("rgba(255,45,74,0.9)", 18);
  text("GAME OVER!", midX, midY - 60);
  clearShadow();
  fill(col("white"));
  text("GAME OVER!", midX, midY - 60);

  // divider
  stroke(col("bord"));
  strokeWeight(1);
  line(cardX + 40, midY, cardX + cardW - 40, midY);
  noStroke();

  // Chip count
  setFont(13, "ui");
  fill(col("muted"));
  textAlign(CENTER, CENTER);
  text("FINAL CHIPS", midX, midY + 24);

  setShadow(`rgba(${chipRgb[0]},${chipRgb[1]},${chipRgb[2]},0.6)`, 24);
  fill(col(chipColor));
  setFont(64, "display");
  text(finalChips, midX, midY + 68);
  clearShadow();

  // Play again button
  let bw = 220,
    bh = H_REVEAL;
  let bx = CW / 2 - bw / 2,
    by = cardY + cardH + GAP * 2;
  let hovered = playAgainBtn ? inBtn(mouseX, mouseY, playAgainBtn) : false;

  setShadow("rgba(255,45,74,0.35)", 14);
  noFill();
  stroke(col("red"));
  strokeWeight(1);
  rect(bx, by, bw, bh);
  clearShadow();

  fill(color(30, 5, 10));
  noStroke();
  rect(bx, by, bw, bh);
  if (hovered) {
    fill(col("red"));
    noStroke();
    rect(bx, by, bw, bh);
  }

  noStroke();
  fill(hovered ? col("bg") : col("red"));
  setFont(22, "display");
  textAlign(CENTER, CENTER);
  text("PLAY AGAIN", CW / 2, by + bh / 2 + 1);

  playAgainBtn = { x: bx, y: by, w: bw, h: bh };
}

// ═════════════════════════════════════════════════════════════════════════════
//  FULL RESET
// ═════════════════════════════════════════════════════════════════════════════
function fullReset() {
  chips = 50;
  streak = 0;
  act = 1;
  actRound = 1;
  finalChips = 0;
  startBtn = null;
  playAgainBtn = null;
  resetRound();
  state = "BET";
}

// ═════════════════════════════════════════════════════════════════════════════
//  CARD
// ═════════════════════════════════════════════════════════════════════════════
function drawCard(x, y, w, h) {
  fill(col("card"));
  stroke(col("bord"));
  strokeWeight(1);
  rect(x, y, w, h);
  noStroke();
}

// ═════════════════════════════════════════════════════════════════════════════
//  INPUT
// ═════════════════════════════════════════════════════════════════════════════
function mouseMoved() {
  updateHover();
}
function mouseDragged() {
  updateHover();
}

function updateHover() {
  if (state === "SPLASH" || state === "GAME_OVER" || state === "ACT_TRANSITION")
    return;
  revealHover = revealBtn ? inBtn(mouseX, mouseY, revealBtn) : false;
  answerHover = -1;
  if (state === "ANSWER") {
    for (let i = 0; i < answerBtns.length; i++) {
      if (answerBtns[i] && inBtn(mouseX, mouseY, answerBtns[i])) {
        answerHover = i;
        break;
      }
    }
  }
}

function mousePressed() {
  if (state === "SPLASH") {
    if (startBtn && inBtn(mouseX, mouseY, startBtn)) {
      fullReset();
    }
    return;
  }
  if (state === "GAME_OVER") {
    if (playAgainBtn && inBtn(mouseX, mouseY, playAgainBtn)) {
      state = "SPLASH";
    }
    return;
  }
  if (state === "ACT_TRANSITION") return;
  updateHover();
  if (revealBtn && !revealBtn.disabled && inBtn(mouseX, mouseY, revealBtn)) {
    startFlash();
    return;
  }
  if (state === "BET") {
    for (let b of chipBtns) {
      if (inBtn(mouseX, mouseY, b)) {
        currentBet = b.realVal;
        setLog("Wagering " + currentBet + " chips. Hit REVEAL.", "info");
        return;
      }
    }
  }
  if (state === "ANSWER") {
    for (let b of answerBtns) {
      if (inBtn(mouseX, mouseY, b)) {
        handleAnswer(b.val);
        return;
      }
    }
  }
}

function inBtn(mx, my, b) {
  return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
}

// ═════════════════════════════════════════════════════════════════════════════
//  GAME LOGIC
// ═════════════════════════════════════════════════════════════════════════════
function startFlash() {
  let diff = getDiff();

  if (act === 1) {
    // Always apply some transform — pick randomly from h-mirror, v-flip, or both
    flipType = floor(random(1, 4)); // 1=h, 2=v, 3=both — never 0
    isMirrored = flipType === 1 || flipType === 3;

    // Random position within the arena (with margin so number stays visible)
    let margin = 70,
      aw = CW - PAD * 2;
    act1Pos = {
      x: PAD + random(margin, aw - margin),
      y: Y_ARENA + random(margin, H_ARENA - margin),
    };

    let maxN = actRound <= 2 ? 9 : 99;
    let minN = actRound <= 2 ? 1 : 10;
    correctAnswer = floor(random(minN, maxN + 1));
    choices = generateChoicesAct1(correctAnswer, isMirrored);
  } else {
    isMirrored = false;
    sumNumbers = [];
    numFlips = [];
    let diff2 = getA2Diff();
    let maxEach = actRound <= 2 ? 9 : actRound <= 4 ? 15 : 20;
    for (let i = 0; i < diff2.count; i++) {
      sumNumbers.push(floor(random(1, maxEach + 1)));
      // each number independently rolled for a random flip type
      if (random() < diff2.flipChance) {
        numFlips.push(floor(random(1, 4))); // 1=h, 2=v, 3=both
      } else {
        numFlips.push(0);
      }
    }
    correctAnswer = sumNumbers.reduce((a, b) => a + b, 0);
    choices = generateChoicesAct2(correctAnswer);
    numPositions = generatePositions(diff2.count, diff2.scatter);
  }

  flashDuration = diff.ms;
  flashTimer = diff.ms;
  glitching = false;
  selectedAnswer = -1;
  state = "FLASH";

  // log message hints at what kind of trickery is happening
  if (act === 1) {
    if (flipType === 3)
      setLog("MIRRORED + FLIPPED \u2014 trust nothing.", "bad");
    else if (flipType === 2) setLog("UPSIDE DOWN \u2014 stay sharp.", "bad");
    else setLog("MIRRORED \u2014 trust nothing.", "bad");
  } else {
    setLog("Watch the numbers!", "info");
  }
}

// Scatter positions for act 2
function generatePositions(count, scatter) {
  let aw = CW - PAD * 2;
  let positions = [];

  if (!scatter) {
    // evenly spaced horizontally
    let spacing = aw / (count + 1);
    for (let i = 0; i < count; i++) {
      positions.push({ x: spacing * (i + 1), y: H_ARENA / 2 });
    }
  } else {
    let margin = 60,
      tries = 0;
    while (positions.length < count && tries++ < 300) {
      let px = random(margin, aw - margin);
      let py = random(margin, H_ARENA - margin);
      let ok = true;
      for (let p of positions) {
        if (dist(px, py, p.x, p.y) < 90) {
          ok = false;
          break;
        }
      }
      if (ok) positions.push({ x: px, y: py });
    }
  }
  return positions;
}

function endFlash() {
  state = "ANSWER";
  glitching = false;
  answerTimer = ANSWER_TIME;
  setLog(
    act === 1 ? "Pick your answer!" : "What was the sum? Close counts!",
    "info",
  );
}

function handleAnswer(val) {
  selectedAnswer = val;
  let diff = getDiff();

  if (act === 1) {
    if (val === correctAnswer) {
      let win = floor(currentBet * diff.mult);
      chips += win;
      streak++;
      setLog("+" + win + " chips! Correct!  (\xd7" + diff.mult + ")", "good");
    } else {
      chips -= currentBet * 2;
      streak = 0;
      setLog(
        "-" + currentBet * 2 + " chips.  It was " + correctAnswer + ".",
        "bad",
      );
    }
  } else {
    // Act 2 — partial credit / partial loss
    let delta = abs(val - correctAnswer);
    if (delta === 0) {
      let win = floor(currentBet * diff.mult);
      chips += win;
      streak++;
      setLog("+" + win + " chips!  EXACT!  (\xd7" + diff.mult + ")", "good");
    } else if (delta <= 2) {
      let win = floor(currentBet * diff.mult * 0.5);
      chips += win;
      streak++;
      setLog(
        "+" +
          win +
          " chips!  Close!  (\xd7" +
          (diff.mult * 0.5).toFixed(1) +
          ")",
        "good",
      );
    } else if (delta <= 5) {
      setLog(
        "Off by " + delta + ".  Break even.  Sum was " + correctAnswer + ".",
        "muted",
      );
    } else {
      let loss = floor(currentBet * 0.5);
      chips -= currentBet * 2;
      streak = 0;
      setLog(
        "-" + currentBet * 2 + " chips.  Sum was " + correctAnswer + ".",
        "bad",
      );
    }
  }

  state = "RESULT";
  resultTimer = 2000;
}

function handleTimeout() {
  // Time's up — lose double the bet, same as a wrong answer
  selectedAnswer = -1;
  chips -= currentBet * 2;
  streak = 0;
  setLog(
    "TIME'S UP! -" + currentBet * 2 + " chips.  It was " + correctAnswer + ".",
    "bad",
  );
  state = "RESULT";
  resultTimer = 2000;
}

function nextRound() {
  let maxRounds = act === 1 ? 4 : 6;

  if (actRound >= maxRounds) {
    if (act === 1) {
      state = "ACT_TRANSITION";
      transitionTimer = 3000;
      return;
    } else {
      // All rounds done — game over
      finalChips = chips;
      state = "GAME_OVER";
      return;
    }
  }

  actRound++;
  setLog("Select a wager to begin.", "muted");
  resetRound();
}

function beginAct2() {
  act = 2;
  actRound = 1;
  setLog("ACT II \u2014 Guess the sum of the numbers!", "special");
  resetRound();
}

function resetRound() {
  currentBet = 0;
  choices = [];
  selectedAnswer = -1;
  sumNumbers = [];
  numPositions = [];
  numFlips = [];
  flipType = 0;
  state = "BET";
}

// ── Choice generation ─────────────────────────────────────────────────────────
function generateChoicesAct1(correct, mirrored) {
  let set = new Set([correct]);
  if (mirrored) {
    let m = correct < 10 ? mirrorDigit(correct) : reverseNum(correct);
    if (m !== correct && m > 0) set.add(m);
  }
  let tries = 0;
  while (set.size < 4 && tries++ < 80) {
    let d,
      r = random();
    if (r < 0.4) d = correct + (random() > 0.5 ? 1 : -1) * floor(random(1, 6));
    else if (r < 0.7) d = reverseNum(correct);
    else d = floor(random(1, 100));
    if (d > 0 && d <= 99 && d !== correct) set.add(d);
  }
  return shuffle([...set].slice(0, 4));
}

function generateChoicesAct2(correct) {
  let set = new Set([correct]);
  let tries = 0;
  while (set.size < 4 && tries++ < 100) {
    let delta = floor(random(1, 11));
    let d = correct + (random() > 0.5 ? 1 : -1) * delta;
    if (d > 0 && d <= 200) set.add(d);
  }
  return shuffle([...set].slice(0, 4));
}

function mirrorDigit(n) {
  let m = { 6: 9, 9: 6, 2: 5, 5: 2, 1: 1, 8: 8, 3: 8, 4: 7, 7: 4 };
  return m[n] !== undefined ? m[n] : n > 5 ? n - 3 : n + 3;
}

function reverseNum(n) {
  let rev = parseInt(String(n).split("").reverse().join(""));
  return !rev || rev <= 0 ? n + 1 : rev;
}

function setLog(msg, type) {
  logMsg = msg;
  logType = type || "muted";
}

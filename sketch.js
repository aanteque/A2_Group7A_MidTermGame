// CALCUCINO - p5.js  (Casino UI Restyle)
// ACT 1: Tutorial  — 4 rounds, single number, remember & guess
// ACT 2: Sum Blitz — 6 rounds, multiple scattered numbers, guess the sum

// ── Colour palette (casino theme) ────────────────────────────────────────────
const C = {
  bg: [0, 0, 0], // pure black background
  card: [28, 22, 60], // dark purple card fill
  bord: [200, 140, 20], // gold/amber border
  red: [176, 24, 24], // casino red #B01818
  redHi: [210, 45, 45], // lighter red for hover
  amber: [220, 155, 10], // gold
  cyan: [17, 68, 177], // chips blue #1144B1
  green: [12, 139, 33], // streak green #0C8B21
  purple: [156, 29, 176], // round purple #9C1DB0
  muted: [130, 110, 170], // muted purple-grey
  text: [240, 235, 255], // near-white
  white: [255, 255, 255],
  shadow: [90, 30, 120], // purple offset shadow for title
};

// ── Layout ────────────────────────────────────────────────────────────────────
const PAD = 20;
const GAP = 14;
const CW = 520;

const H_HEADER = 110;
const H_STATS = 70;
const H_ARENA = 210;
const H_BET = 70;
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
  H_LOG +
  GAP +
  H_REVEAL +
  PAD;

const Y_HEADER = PAD;
const Y_STATS = Y_HEADER + H_HEADER + GAP;
const Y_ARENA = Y_STATS + H_STATS + GAP;
const Y_BET = Y_ARENA + H_ARENA + GAP;
const Y_ANSWER = Y_BET + H_BET + GAP;
const Y_LOG = Y_BET + H_BET + GAP;
const Y_REVEAL = Y_LOG + H_LOG + GAP;

// ── Game state ────────────────────────────────────────────────────────────────
let chips = 50,
  streak = 0,
  currentBet = 0;
let act = 1;
let actRound = 1;
let finalChips = 0;

let correctAnswer = 0;
let sumNumbers = [],
  numPositions = [],
  numFlips = [];
let act1Pos = { x: 0, y: 0 };
let state = "SPLASH";
let isMirrored = false;
let flipType = 0;

let flashTimer = 0,
  flashDuration = 0;
let resultTimer = 0,
  transitionTimer = 0;
let choices = [];
let selectedAnswer = -1;
let logMsg = "Select a wager, then hit REVEAL.";
let logType = "muted";
let glitching = false;
let answerTimer = 0;
const ANSWER_TIME = 6000;

let CHIP_VALUES = [5, 10, 25, 50, "ALL"];

function updateChipValues() {
  let c = Math.abs(chips);
  if (c >= 300) CHIP_VALUES = [50, 100, 150, 300, "ALL"];
  else if (c >= 150) CHIP_VALUES = [25, 50, 75, 150, "ALL"];
  else if (c >= 75) CHIP_VALUES = [10, 25, 50, 75, "ALL"];
  else CHIP_VALUES = [5, 10, 25, 50, "ALL"];
}

let chipBtns = [],
  answerBtns = [];
let revealBtn = null,
  startBtn = null,
  playAgainBtn = null;
let revealHover = false,
  revealFill = 0;
let answerHover = -1;
let answerH = H_ANSWER_COLLAPSED;
let allSelected = false;
let lastBet = 0;
let wagerPulse = 0;

// ── Difficulty ────────────────────────────────────────────────────────────────
function getA1Diff() {
  const t = [
    { ms: 1600, label: "EASY", mult: 1.5 },
    { ms: 1000, label: "SHAKY", mult: 2.0 },
    { ms: 650, label: "BLURRED", mult: 2.5 },
    { ms: 380, label: "FUZZY", mult: 3.5 },
  ];
  return t[min(actRound - 1, t.length - 1)];
}

function getA2Diff() {
  const t = [
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
  return t[min(actRound - 1, t.length - 1)];
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
    drawingContext.font = `900 ${size}px "Black Han Sans", "Impact", sans-serif`;
  } else {
    drawingContext.font = `700 ${size}px "Black Han Sans", "Arial Black", sans-serif`;
  }
}

// ── Outlined text helper ──────────────────────────────────────────────────────
// Draws text with a 2px black outline. Call with fill() already set to white.
function outlineText(str, x, y) {
  clearShadow();
  drawingContext.lineJoin = "round";
  stroke(0);
  strokeWeight(4);
  text(str, x, y);
  noStroke();
  text(str, x, y);
}

// ── Gold border card ──────────────────────────────────────────────────────────
function drawCard(x, y, w, h, fillColor) {
  // outer gold border
  fill(col("bord"));
  noStroke();
  rect(x - 3, y - 3, w + 6, h + 6, 4);
  // inner fill
  fill(fillColor || col("card"));
  noStroke();
  rect(x, y, w, h, 2);
}

// ═════════════════════════════════════════════════════════════════════════════
//  SETUP & DRAW
// ═════════════════════════════════════════════════════════════════════════════
let logoImg = null;

function preload() {
  logoImg = loadImage("assets/Calcusino_p.png");
}

function setup() {
  createCanvas(CW, CH);
  textFont("Impact");
}

function draw() {
  background(col("bg"));

  if (state === "SPLASH") {
    drawSplash();
    return;
  }
  if (state === "GAME_OVER") {
    drawGameOver();
    return;
  }
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

  if (state === "BET" && currentBet === 0) {
    wagerPulse = (sin(frameCount * 0.07) + 1) / 2;
  } else {
    wagerPulse = 0;
  }

  let targetFill = revealHover && !revealBtn?.disabled ? 1 : 0;
  revealFill += (targetFill - revealFill) * 0.15;
}

// ═════════════════════════════════════════════════════════════════════════════
//  HEADER  — logo image
// ═════════════════════════════════════════════════════════════════════════════
function drawHeader() {
  let ty = Y_HEADER;
  if (logoImg) {
    // scale to fit width with padding, preserve aspect ratio
    let imgW = CW - PAD * 2;
    let imgH = imgW * (logoImg.height / logoImg.width);
    image(logoImg, PAD, ty, imgW, imgH);
  }

  // act subtitle
  setFont(12, "ui");
  fill(col("muted"));
  textAlign(CENTER, TOP);
  text(
    act === 1
      ? "ACT I  —  TUTORIAL: Remember the number"
      : "ACT II —  SUM BLITZ: Guess the total",
    CW / 2,
    ty + 86,
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  STATS — coloured filled boxes with gold borders
// ═════════════════════════════════════════════════════════════════════════════
function drawStats() {
  let totalRounds = act === 1 ? 4 : 6;
  let labels = ["CHIPS", "ROUND", "STREAK"];
  let values = [chips, actRound + "/" + totalRounds, streak];
  // [light colour, dark colour] for each box
  let gradients = [
    ["#1144B1", "#113789"],
    ["#9C1DB0", "#650E73"],
    ["#0C8B21", "#096C1A"],
  ];
  let cw3 = (CW - PAD * 2 - GAP * 2) / 3;

  for (let i = 0; i < 3; i++) {
    let x = PAD + i * (cw3 + GAP);

    // gold border
    fill(col("bord"));
    noStroke();
    rect(x - 3, Y_STATS - 3, cw3 + 6, H_STATS + 6, 4);

    // diagonal gradient fill (top-left light → bottom-right dark)
    let grad = drawingContext.createLinearGradient(
      x,
      Y_STATS,
      x + cw3,
      Y_STATS + H_STATS,
    );
    grad.addColorStop(0, gradients[i][0]);
    grad.addColorStop(1, gradients[i][1]);
    drawingContext.fillStyle = grad;
    drawingContext.fillRect(x, Y_STATS, cw3, H_STATS);

    // label
    fill(col("white"));
    setFont(12, "ui");
    textAlign(CENTER, TOP);
    outlineText(labels[i], x + cw3 / 2, Y_STATS + 10);

    // value
    fill(col("white"));
    setFont(34, "display");
    textAlign(CENTER, TOP);
    outlineText(values[i], x + cw3 / 2, Y_STATS + 26);
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
  answerBtns = [];

  fill(col("muted"));
  setFont(10, "ui");
  textAlign(LEFT, TOP);
  text(
    (act === 1 ? "ACT I" : "ACT II") + "  RND " + actRound,
    ax + 12,
    Y_ARENA + 10,
  );

  textAlign(RIGHT, TOP);
  fill(col("amber"));
  setFont(14, "display");
  text("×" + diff.mult, ax + aw - 12, Y_ARENA + 10);

  fill(col("muted"));
  setFont(10, "ui");
  textAlign(RIGHT, BOTTOM);
  text(diff.label, ax + aw - 12, Y_ARENA + H_ARENA - 10);

  if (state === "BET") {
    fill(col("muted"));
    setFont(12, "ui");
    textAlign(CENTER, CENTER);
    text(
      act === 1
        ? "Place your bet,\nthen reveal the number."
        : "Place your bet,\nthen watch the numbers flash.\nSome may be mirrored or flipped.\nGuess their SUM.",
      ax + aw / 2,
      Y_ARENA + H_ARENA / 2,
    );
  }

  if (state === "ANSWER" || state === "RESULT") {
    // Draw answer buttons inside the arena
    let gap = 8,
      bw = (aw - 32 - gap * 3) / 4,
      bh = 52;
    let bx = ax + 16;
    let by = Y_ARENA + H_ARENA / 2 - bh / 2;

    for (let i = 0; i < 4; i++) {
      let val = choices[i] !== undefined ? choices[i] : null;
      let btnState = "idle";
      if (state === "RESULT" && val !== null) {
        if (val === correctAnswer) btnState = "correct";
        else if (val === selectedAnswer) btnState = "wrong";
      }
      let hovered = answerHover === i && state === "ANSWER";
      answerBtns.push({ x: bx, y: by, w: bw, h: bh, val });
      if (val !== null)
        drawAnswerBtn(bx, by, bw, bh, val, btnState, hovered, 255);
      bx += bw + gap;
    }

    if (state === "ANSWER") {
      let pct = constrain(answerTimer / ANSWER_TIME, 0, 1);
      let urgent = pct < 0.35;
      let bc = urgent ? col("red") : col("amber");
      let barRgb = urgent ? "210,35,45" : "220,155,10";
      fill(color(40, 30, 10));
      noStroke();
      rect(ax, Y_ARENA + H_ARENA - 5, aw, 5);
      setShadow(`rgba(${barRgb},0.8)`, urgent ? 10 : 6);
      fill(bc);
      noStroke();
      rect(ax, Y_ARENA + H_ARENA - 5, aw * pct, 5);
      clearShadow();
    }
  }

  if (state === "FLASH") {
    let pct01 = constrain(flashTimer / flashDuration, 0, 1);
    let fadeA = map(flashTimer, 0, flashDuration * 0.12, 0, 255);
    fadeA = constrain(fadeA, 0, 255);

    if (act === 1) drawAct1Flash(ax, aw, fadeA);
    else drawAct2Flash(ax, aw, fadeA);

    let bc = pct01 < 0.3 ? col("red") : col("amber");
    let barRgb = pct01 < 0.3 ? "210,35,45" : "220,155,10";
    setShadow(`rgba(${barRgb},0.8)`, 8);
    fill(bc);
    noStroke();
    rect(ax, Y_ARENA + H_ARENA - 3, aw * pct01, 3);
    clearShadow();
  }
}

function drawAct1Flash(ax, aw, fadeA) {
  let cx = act1Pos.x,
    cy = act1Pos.y;
  let a01 = fadeA / 255;
  let ox = 0,
    oy = 0;
  if (glitching && frameCount % 3 === 0) {
    ox = random(-6, 6);
    oy = random(-3, 3);
  }
  let isH = flipType === 1 || flipType === 3;
  let isV = flipType === 2 || flipType === 3;

  push();
  translate(cx + ox, cy + oy);
  if (isH) scale(-1, 1);
  if (isV) scale(1, -1);

  setShadow(`rgba(210,35,45,${(a01 * 0.6).toFixed(2)})`, 30);
  fill(col("red", fadeA));
  setFont(120, "display");
  textAlign(CENTER, CENTER);
  text(correctAnswer, 0, 0);
  clearShadow();
  pop();
}

function drawAct2Flash(ax, aw, fadeA) {
  let a01 = fadeA / 255;
  let diff = getA2Diff();
  const hues = [
    "255,255,255",
    "80,160,255",
    "200,100,255",
    "220,155,10",
    "60,200,100",
  ];
  let sz = diff.count <= 2 ? 90 : diff.count <= 3 ? 72 : 56;

  for (let i = 0; i < sumNumbers.length; i++) {
    let pos = numPositions[i];
    if (!pos) continue;
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
    let h = ft !== 0 ? "210,35,45" : hues[i % hues.length];

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

  // WAGER! label — bold white, casino style
  fill(col("white"));
  setFont(18, "display");
  textAlign(CENTER, TOP);
  outlineText("WAGER!", x + w / 2, Y_BET + 8);

  chipBtns = [];
  let bh = 32,
    gap = 8;
  let bw = (w - 32 - gap * (CHIP_VALUES.length - 1)) / CHIP_VALUES.length;
  let bx = x + 16,
    by = Y_BET + 30;

  for (let i = 0; i < CHIP_VALUES.length; i++) {
    let val = CHIP_VALUES[i];
    let realVal = val === "ALL" ? chips : val;
    let active =
      (val === "ALL" ? allSelected : !allSelected && currentBet === realVal) ||
      (state !== "BET" &&
        (val === "ALL" ? allSelected : !allSelected && lastBet === realVal));
    let disabled = state !== "BET" && !active;
    chipBtns.push({
      x: bx,
      y: by,
      w: bw,
      h: bh,
      realVal,
      isAll: val === "ALL",
    });
    drawChipBtn(bx, by, bw, bh, String(val), active, disabled);
    bx += bw + gap;
  }
}

function drawChipBtn(x, y, w, h, label, active, disabled) {
  if (disabled) {
    // dim state
    fill(color(120, 12, 12));
    noStroke();
    rect(x, y, w, h, 2);
    fill(color(160, 60, 60));
    noStroke();
    rect(x, y, w, h - 4, 2);
  } else {
    // gold outer border
    fill(active ? col("amber") : col("bord"));
    noStroke();
    rect(x - 2, y - 2, w + 4, h + 4, 4);
    // red fill (bottom shadow layer)
    fill(active ? color(160, 100, 0) : color(120, 12, 12));
    noStroke();
    rect(x, y + 3, w, h - 1, 2);
    // red fill (main)
    fill(active ? color(200, 140, 0) : col("red"));
    noStroke();
    rect(x, y, w, h - 3, 2);
  }

  fill(disabled ? color(160, 60, 60) : col("white"));
  setFont(13, "ui");
  textAlign(CENTER, CENTER);
  if (disabled) text(label, x + w / 2, y + h / 2 - 1);
  else outlineText(label, x + w / 2, y + h / 2 - 1);
}

function drawAnswerBtn(x, y, w, h, val, btnState, hovered, alpha) {
  if (alpha === undefined) alpha = 255;
  let a = alpha / 255;

  let fillTop, fillBot, borderC;
  if (btnState === "correct") {
    borderC = col("amber", alpha);
    fillTop = color(30, 160, 60, alpha);
    fillBot = color(15, 100, 40, alpha);
  } else if (btnState === "wrong") {
    borderC = col("amber", alpha);
    fillTop = color(176, 24, 24, alpha);
    fillBot = color(100, 10, 10, alpha);
  } else if (hovered) {
    borderC = col("amber", alpha);
    fillTop = color(210, 45, 45, alpha);
    fillBot = color(130, 20, 20, alpha);
  } else {
    borderC = col("bord", alpha);
    fillTop = color(176, 24, 24, alpha);
    fillBot = color(110, 10, 10, alpha);
  }

  // border
  fill(borderC);
  noStroke();
  rect(x - 2, y - 2, w + 4, h + 4, 4);
  // shadow bottom
  fill(fillBot);
  noStroke();
  rect(x, y + 3, w, h - 1, 2);
  // main fill
  fill(fillTop);
  noStroke();
  rect(x, y, w, h - 3, 2);

  // number
  fill(col("white", alpha));
  setFont(28, "display");
  textAlign(CENTER, CENTER);
  outlineText(val, x + w / 2, y + h / 2 - 1);
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
  fill(col(key));
  setFont(11, "ui");
  textAlign(CENTER, CENTER);
  text(logMsg, CW / 2, Y_LOG + H_LOG / 2);
}

// ═════════════════════════════════════════════════════════════════════════════
//  REVEAL / START button — casino red with gold border
// ═════════════════════════════════════════════════════════════════════════════
function drawRevealBtn() {
  let x = PAD,
    w = CW - PAD * 2,
    h = H_REVEAL;
  let disabled = state !== "BET" || currentBet === 0;

  if (!disabled) {
    // gold border
    fill(col("amber"));
    noStroke();
    rect(x - 3, Y_REVEAL - 3, w + 6, h + 6, 4);
    // bottom shadow
    fill(color(120, 12, 12));
    noStroke();
    rect(x, Y_REVEAL + 4, w, h, 2);
    // main fill
    fill(revealHover ? col("redHi") : col("red"));
    noStroke();
    rect(x, Y_REVEAL, w, h - 4, 2);
  } else {
    fill(color(60, 10, 10));
    noStroke();
    rect(x, Y_REVEAL, w, h, 2);
  }

  fill(disabled ? color(120, 40, 40) : col("white"));
  setFont(24, "display");
  textAlign(CENTER, CENTER);
  if (disabled) text("REVEAL", x + w / 2, Y_REVEAL + h / 2 - 1);
  else outlineText("REVEAL", x + w / 2, Y_REVEAL + h / 2 - 1);
  revealBtn = { x, y: Y_REVEAL, w, h, disabled };
}

// ═════════════════════════════════════════════════════════════════════════════
//  ACT TRANSITION
// ═════════════════════════════════════════════════════════════════════════════
function drawActTransition() {
  background(col("bg"));

  let fadeIn = constrain(map(transitionTimer, 3000, 2400, 0, 255), 0, 255);
  let elapsed = 1 - transitionTimer / 3000;

  textAlign(CENTER, CENTER);

  // purple shadow offset
  fill(col("shadow", fadeIn));
  setFont(90, "display");
  text("ACT  II", CW / 2 + 5, CH / 2 - 55);

  setShadow("rgba(210,35,45,0.5)", 30);
  fill(col("red", fadeIn));
  setFont(90, "display");
  text("ACT  II", CW / 2, CH / 2 - 60);
  clearShadow();

  fill(col("amber", fadeIn));
  setFont(28, "display");
  text("S U M   B L I T Z", CW / 2, CH / 2 + 14);

  fill(col("muted", fadeIn));
  setFont(12, "ui");
  text(
    "Numbers scatter across the screen.\nYour job: guess their sum.\nOnly the exact answer wins.",
    CW / 2,
    CH / 2 + 72,
  );

  let bw = 300;
  fill(color(40, 30, 10));
  noStroke();
  rect(CW / 2 - bw / 2, CH - 76, bw, 8, 4);
  setShadow("rgba(220,155,10,0.8)", 8);
  fill(col("amber"));
  noStroke();
  rect(CW / 2 - bw / 2, CH - 76, bw * elapsed, 8, 4);
  clearShadow();
}

// ═════════════════════════════════════════════════════════════════════════════
//  SPLASH SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function drawSplash() {
  // Logo image
  if (logoImg) {
    let imgW = CW - PAD * 2;
    let imgH = imgW * (logoImg.height / logoImg.width);
    image(logoImg, PAD, Y_HEADER, imgW, imgH);
  }

  setFont(12, "ui");
  fill(col("muted"));
  textAlign(CENTER, TOP);
  text("A game about numbers you can't trust", CW / 2, Y_HEADER + 86);

  // How-to-play card
  let cx = PAD,
    cw = CW - PAD * 2,
    cy = Y_STATS,
    ch = CH - Y_STATS - PAD - 72;
  drawCard(cx, cy, cw, ch);

  let tx = CW / 2,
    ty = cy + 20;
  setFont(20, "display");
  fill(col("amber"));
  textAlign(CENTER, TOP);
  text("HOW TO PLAY", tx, ty);

  setFont(11, "ui");
  fill(col("muted"));
  textAlign(LEFT, TOP);
  let lx = cx + 20,
    lw = cw - 40;
  let lines = [
    { label: "ACT I  —  TUTORIAL  (4 rounds)", color: "cyan" },
    {
      text: "A number flashes somewhere on screen. It will always be mirrored, flipped, or both. Bet chips, then pick the real number from four choices.",
    },
    { spacer: true },
    { label: "ACT II —  SUM BLITZ  (6 rounds)", color: "purple" },
    {
      text: "Multiple numbers appear scattered across the screen. Add them up in your head, then pick the correct sum. Some numbers may be flipped.",
    },
    { spacer: true },
    { label: "SCORING", color: "amber" },
    { text: "Correct: win your bet × the round multiplier." },
    { text: "Wrong or timeout: lose your bet. Chips CAN go negative." },
    { spacer: true },
    { label: "GOAL", color: "green" },
    {
      text: "Survive all 10 rounds and finish with as many chips as possible. You start with 50.",
    },
  ];

  let lineY = ty + 36,
    lineH = 15;
  for (let l of lines) {
    if (l.spacer) {
      lineY += 6;
      continue;
    }
    if (l.label) {
      let lc = C[l.color] || C.cyan;
      fill(col(l.color));
      setFont(13, "display");
      textAlign(LEFT, TOP);
      text(l.label, lx, lineY);
      lineY += 17;
    } else {
      fill(col("text"));
      setFont(11, "ui");
      textAlign(LEFT, TOP);
      let words = l.text.split(" ");
      let line = "";
      for (let ww of words) {
        let test = line + (line ? " " : "") + ww;
        if (textWidth(test) > lw - 10) {
          text(line, lx + 8, lineY);
          lineY += lineH;
          line = ww;
        } else line = test;
      }
      if (line) {
        text(line, lx + 8, lineY);
        lineY += lineH;
      }
    }
  }

  // START button
  let bw = 240,
    bh = H_REVEAL;
  let bx = CW / 2 - bw / 2,
    by = CH - PAD - bh;
  let hov = startBtn ? inBtn(mouseX, mouseY, startBtn) : false;

  fill(col("amber"));
  noStroke();
  rect(bx - 3, by - 3, bw + 6, bh + 6, 4);
  fill(color(120, 12, 12));
  noStroke();
  rect(bx, by + 4, bw, bh, 2);
  fill(hov ? col("redHi") : col("red"));
  noStroke();
  rect(bx, by, bw, bh - 4, 2);

  fill(col("white"));
  setFont(24, "display");
  textAlign(CENTER, CENTER);
  outlineText("START GAME", CW / 2, by + bh / 2 - 1);

  startBtn = { x: bx, y: by, w: bw, h: bh };
}

// ═════════════════════════════════════════════════════════════════════════════
//  GAME OVER
// ═════════════════════════════════════════════════════════════════════════════
function drawGameOver() {
  let chipColor =
    finalChips >= 100 ? "green" : finalChips >= 0 ? "amber" : "red";
  let cardW = CW - PAD * 2,
    cardH = 290;
  let cardX = PAD,
    cardY = CH / 2 - cardH / 2 - 20;
  drawCard(cardX, cardY, cardW, cardH);

  textAlign(CENTER, CENTER);
  let midX = CW / 2,
    midY = cardY + cardH / 2;

  fill(col("shadow"));
  setFont(80, "display");
  text("GAME OVER!", midX + 4, midY - 58);
  setShadow("rgba(210,35,45,0.5)", 20);
  fill(col("red"));
  text("GAME OVER!", midX, midY - 62);
  clearShadow();

  stroke(col("bord"));
  strokeWeight(2);
  line(cardX + 30, midY - 8, cardX + cardW - 30, midY - 8);
  noStroke();

  setFont(13, "ui");
  fill(col("muted"));
  text("FINAL CHIPS", midX, midY + 20);

  fill(col(chipColor));
  setFont(64, "display");
  text(finalChips, midX, midY + 65);

  // Play Again button
  let bw = 220,
    bh = H_REVEAL;
  let bx = CW / 2 - bw / 2,
    by = cardY + cardH + GAP * 2;
  let hov = playAgainBtn ? inBtn(mouseX, mouseY, playAgainBtn) : false;

  fill(col("amber"));
  noStroke();
  rect(bx - 3, by - 3, bw + 6, bh + 6, 4);
  fill(color(120, 12, 12));
  noStroke();
  rect(bx, by + 4, bw, bh, 2);
  fill(hov ? col("redHi") : col("red"));
  noStroke();
  rect(bx, by, bw, bh - 4, 2);

  fill(col("white"));
  setFont(24, "display");
  textAlign(CENTER, CENTER);
  outlineText("PLAY AGAIN", CW / 2, by + bh / 2 - 1);

  playAgainBtn = { x: bx, y: by, w: bw, h: bh };
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
    if (startBtn && inBtn(mouseX, mouseY, startBtn)) fullReset();
    return;
  }
  if (state === "GAME_OVER") {
    if (playAgainBtn && inBtn(mouseX, mouseY, playAgainBtn)) state = "SPLASH";
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
        if (b.isAll) {
          currentBet = Math.abs(chips);
          allSelected = true;
        } else {
          currentBet = b.realVal;
          allSelected = false;
        }
        setLog("Hit REVEAL when ready.", "muted");
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
//  GAME LOGIC  (unchanged from original)
// ═════════════════════════════════════════════════════════════════════════════
function fullReset() {
  chips = 50;
  streak = 0;
  act = 1;
  actRound = 1;
  finalChips = 0;
  startBtn = null;
  playAgainBtn = null;
  logMsg = "Select a wager, then hit REVEAL.";
  logType = "muted";
  CHIP_VALUES = [5, 10, 25, 50, "ALL"];
  resetRound();
  state = "BET";
}

function startFlash() {
  if (currentBet <= 0) return;
  lastBet = Math.abs(currentBet);
  chips -= lastBet;
  let diff = getDiff();

  if (act === 1) {
    flipType = floor(random(1, 4));
    isMirrored = flipType === 1 || flipType === 3;
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
      numFlips.push(random() < diff2.flipChance ? floor(random(1, 4)) : 0);
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
  if (act === 1) {
    if (flipType === 3) setLog("MIRRORED + FLIPPED — trust nothing.", "bad");
    else if (flipType === 2) setLog("UPSIDE DOWN — stay sharp.", "bad");
    else setLog("MIRRORED — trust nothing.", "bad");
  } else {
    setLog("Watch the numbers!", "info");
  }
}

function generatePositions(count, scatter) {
  let aw = CW - PAD * 2,
    positions = [];
  if (!scatter) {
    let spacing = aw / (count + 1);
    for (let i = 0; i < count; i++)
      positions.push({ x: spacing * (i + 1), y: H_ARENA / 2 });
  } else {
    let margin = 60,
      tries = 0;
    while (positions.length < count && tries++ < 300) {
      let px = random(margin, aw - margin),
        py = random(margin, H_ARENA - margin);
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
  setLog(act === 1 ? "Pick your answer!" : "What was the sum?", "info");
}

function handleAnswer(val) {
  selectedAnswer = val;
  let diff = getDiff(),
    bet = lastBet;
  if (act === 1) {
    if (val === correctAnswer) {
      let profit = floor(bet * diff.mult);
      chips += bet + profit;
      streak++;
      setLog("+" + profit + " chips! Correct!  (×" + diff.mult + ")", "good");
    } else {
      streak = 0;
      setLog("-" + bet + " chips.  It was " + correctAnswer + ".", "bad");
    }
  } else {
    if (Math.abs(val - correctAnswer) === 0) {
      let profit = floor(bet * diff.mult);
      chips += bet + profit;
      streak++;
      setLog("+" + profit + " chips!  EXACT!  (×" + diff.mult + ")", "good");
    } else {
      streak = 0;
      setLog("-" + bet + " chips.  Sum was " + correctAnswer + ".", "bad");
    }
  }
  state = "RESULT";
  resultTimer = 2000;
}

function handleTimeout() {
  selectedAnswer = -1;
  streak = 0;
  setLog(
    "TIME'S UP! -" + lastBet + " chips.  It was " + correctAnswer + ".",
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
  setLog("ACT II — Guess the sum of the numbers!", "special");
  resetRound();
}

function resetRound() {
  updateChipValues();
  currentBet = 0;
  lastBet = 0;
  choices = [];
  selectedAnswer = -1;
  sumNumbers = [];
  numPositions = [];
  numFlips = [];
  flipType = 0;
  allSelected = false;
  state = "BET";
}

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

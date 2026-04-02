/*
Week 5 — Example 4: Data-driven world with JSON + Smooth Camera

Course: GBDA302 | Instructors: Dr. Karen Cochrane & David Han
Date: Feb. 12, 2026

Move: WASD/Arrows

Learning goals:
- Extend the JSON-driven world to include camera parameters
- Implement smooth camera follow using interpolation (lerp)
- Separate camera behavior from player/world logic
- Tune motion and feel using external data instead of hard-coded values
- Maintain player visibility with soft camera clamping
- Explore how small math changes affect “game feel”
*/

const VIEW_W = 800;
const VIEW_H = 480;

let worldData;
let level;
let player;

let camX = 0;
let camY = 0;

<<<<<<< Updated upstream
// images
let enemyIMG;

function preload() {
  worldData = loadJSON("world.json"); // load JSON before setup [web:122]
  
  enemyIMG = loadImage('assets/images/ENEMY.png');
}

function setup() {
  createCanvas(VIEW_W, VIEW_H);
  textFont("sans-serif");
  textSize(14);

  level = new WorldLevel(worldData);

  const start = worldData.playerStart ?? { x: 300, y: 300, speed: 3 };
  player = new Player(start.x, start.y, start.speed);

  camX = player.x - width / 2;
  camY = player.y - height / 2;
}

function draw() {
  player.updateInput();
=======
function spawnWinConfetti(bigWin) {
  confettiParticles = [];
  let count = bigWin ? 120 : 70;
  // Left cannon
  for (let i = 0; i < count / 2; i++) {
    confettiParticles.push(makeChip(PAD + 10, CH * 0.55, true));
  }
  // Right cannon
  for (let i = 0; i < count / 2; i++) {
    confettiParticles.push(makeChip(CW - PAD - 10, CH * 0.55, false));
  }
}

function makeChip(x, y, goRight) {
  let angle = goRight
    ? random(-PI * 0.85, -PI * 0.15) // fires left→up→right
    : random(-PI * 0.85, -PI * 0.15); // mirror handled via speed sign
  let spd = random(6, 14);
  let col_key = CONFETTI_COLS[floor(random(CONFETTI_COLS.length))];
  let isCircle = random() > 0.5;
  return {
    x,
    y,
    vx: (goRight ? 1 : -1) * cos(angle) * spd,
    vy: sin(angle) * spd,
    rot: random(TWO_PI),
    rotV: random(-0.25, 0.25),
    sz: random(7, 15),
    colKey: col_key,
    alpha: 255,
    gravity: random(0.28, 0.45),
    isCircle,
    wobble: random(TWO_PI),
    wobbleSpd: random(0.08, 0.18),
  };
}

function updateDrawConfetti() {
  if (confettiParticles.length === 0) return;
  let alive = [];
  for (let p of confettiParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.98;
    p.rot += p.rotV;
    p.wobble += p.wobbleSpd;
    p.alpha -= 2.2;
    if (p.alpha <= 0 || p.y > CH + 40) continue;
    alive.push(p);

    let c = C[p.colKey] || C.white;
    push();
    translate(p.x + sin(p.wobble) * 3, p.y);
    rotate(p.rot);
    let a = constrain(p.alpha, 0, 255);
    fill(color(c[0], c[1], c[2], a));
    noStroke();
    if (p.isCircle) {
      ellipse(0, 0, p.sz * 0.8, p.sz);
    } else {
      // chip-like rectangle
      rect(-p.sz / 2, -p.sz * 0.35, p.sz, p.sz * 0.7, 2);
      // shine line
      fill(color(255, 255, 255, a * 0.4));
      rect(-p.sz * 0.3, -p.sz * 0.25, p.sz * 0.15, p.sz * 0.5, 1);
    }
    pop();
  }
  confettiParticles = alive;
}

// ── High Score ────────────────────────────────────────────────────────────────
const HS_KEY = "calcucino_hs_v1";
const HS_MAX = 5;
let highScores = [];

function loadHighScores() {
  try {
    let raw = localStorage.getItem(HS_KEY);
    highScores = raw ? JSON.parse(raw) : [];
  } catch (e) {
    highScores = [];
  }
}

function saveHighScore(chipsAmt, diffLabel) {
  loadHighScores();
  highScores.push({
    chips: chipsAmt,
    diff: diffLabel,
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  });
  highScores.sort((a, b) => b.chips - a.chips);
  highScores = highScores.slice(0, HS_MAX);
  try {
    localStorage.setItem(HS_KEY, JSON.stringify(highScores));
  } catch (e) {}
}

function isNewRecord(chipsAmt) {
  loadHighScores();
  return highScores.length === 0 || chipsAmt > highScores[0].chips;
}

// ── Layout ────────────────────────────────────────────────────────────────────
const PAD = 20;
const GAP = 14;
const CW = 520;

// Easy controls for stat icon sizing and spacing:
const STAT_ICON_SCALE_CHIPS = 2.8; // scale for chips icon
const STAT_ICON_SCALE_LEVEL = 1.7; // scale for level icon
const STAT_ICON_SCALE_STREAK = 2.8; // scale for streak icon
const STAT_ICON_PADDING = 7; // padding inside each stat column
const STAT_GAP_CHIPS_LEVEL = 40; // horizontal gap between chips and level
const STAT_GAP_LEVEL_STREAK = 40; // horizontal gap between level and streak

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
let kakeguruiChan = [];
let textContent = "hello my name is kakegurui chan! welcome to my casino.";

// ── Difficulty ────────────────────────────────────────────────────────────────
function getA1Diff() {
  const t = [
    { ms: 1600, label: "EASY", mult: 1.5 },
    { ms: 1000, label: "SHAKY", mult: 2.0 },
    { ms: 650, label: "BLURRED", mult: 2.5 },
    { ms: 380, label: "FUZZY", mult: 3.5 },
  ];
  return applyDifficulty(t[min(actRound - 1, t.length - 1)]);
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
  return applyDifficulty(t[min(actRound - 1, t.length - 1)]);
}

function getDifficultySettings() {
  return DIFF_SETTINGS[constrain(difficulty, 0, DIFF_SETTINGS.length - 1)];
}

function applyDifficulty(diff) {
  let settings = getDifficultySettings();
  return {
    ...diff,
    ms: max(200, floor(diff.ms * settings.timeScale)),
    mult: parseFloat((diff.mult * settings.rewardMult).toFixed(2)),
  };
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
  chipsImg = loadImage("assets/images/Chips.png");
  levelImg = loadImage("assets/images/Level.png");
  streakImg = loadImage("assets/images/Streak.png");
  kakeguruiChan[0] = loadImage("assets/images/kakegurui chan.png");
  kakeguruiChan[1] = loadImage("assets/images/KAKEGURUIMASHOOO!.png");
  kakeguruiChan[2] = loadImage("assets/images/kakegurui chan happy.png");
  kakeguruiChan[3] = loadImage("assets/images/kakegurui chan pity.png");

  countdownSound = loadSound(
    "assets/sounds/lesiakower-countdown-sound-effect-8-bit-151797.mp3",
  );
  winSound = loadSound(
    "assets/sounds/floraphonic-slot-machine-coin-payout-2-182547.mp3",
  );
  loseSound = loadSound(
    "assets/sounds/freesound_community-game-over-arcade-6435.mp3",
  );
  jackpotSound = loadSound(
    "assets/sounds/floraphonic-playful-casino-slot-machine-jackpot-3-183921.mp3",
  );
  levelUpSound = loadSound(
    "assets/sounds/lesiakower-level-up-enhancement-8-bit-retro-sound-effect-153002.mp3",
  );
  dropCoinSound = loadSound(
    "assets/sounds/dragon-studio-dropping-a-coin-478359.mp3",
  );
  revealSound = loadSound("assets/sounds/universfield-interface-124464.mp3");
  failTrumpetSound = loadSound(
    "assets/sounds/universfield-cartoon-fail-trumpet-278822.mp3",
  );
}

function setup() {
  createCanvas(CW + 400, CH);
  textFont("Impact");
}

function draw() {
  fill(0);
  drawKakegurui();
  rect(0, 0, CW, CH);
  //background(col("bg"));
>>>>>>> Stashed changes

  // Keep player inside world
  player.x = constrain(player.x, 0, level.w);
  player.y = constrain(player.y, 0, level.h);

  // Target camera (center on player)
  let targetX = player.x - width / 2;
  let targetY = player.y - height / 2;

  // Clamp target camera safely
  const maxCamX = max(0, level.w - width);
  const maxCamY = max(0, level.h - height);
  targetX = constrain(targetX, 0, maxCamX);
  targetY = constrain(targetY, 0, maxCamY);

  // Smooth follow using the JSON knob
  const camLerp = level.camLerp; // ← data-driven now
  camX = lerp(camX, targetX, camLerp);
  camY = lerp(camY, targetY, camLerp);

  level.drawBackground();

  push();
  translate(-camX, -camY);
  level.drawWorld();
  player.draw();
  pop();

  level.drawHUD(player, camX, camY);
  level.obstacleInteraction(player);
}

function keyPressed() {
  if (key === "r" || key === "R") {
    const start = worldData.playerStart ?? { x: 300, y: 300, speed: 3 };
    player = new Player(start.x, start.y, start.speed);
  }
}
<<<<<<< Updated upstream
=======

// ═════════════════════════════════════════════════════════════════════════════
//  KAKEGURUI CHAN SPEECHBUBBLE
// ═════════════════════════════════════════════════════════════════════════════
function drawKakegurui() {
  clear();
  fill(255);
  ellipse(CW + 200, 200, 300, 150);
  triangle(CW + 180, 190, CW + 220, 190, CW + 200, 300);
  fill(0);
  textAlign(CENTER);
  let textX = 200;
  let textY = 100;
  textSize(20);
  text(textContent, CW + 100, 150, textX, textY);

  if (state === "SPLASH") {
    if (difficulty === 0) {
      image(kakeguruiChan[3], CW, CH - 400, 400, 400);
      textContent = "Whaaaat? easy mode? how am I supposed to bankrupt you?";
    } else if (difficulty === 2) {
      image(kakeguruiChan[1], CW, CH - 400, 400, 400);
      textContent = "NOW WE ARE TALKING! let the madness begin!";
    } else {
      image(kakeguruiChan[0], CW, CH - 400, 400, 400);
      textContent = "Hello my name is kakegurui chan! welcome to my casino.";
    }
  }
  if (state === "GAME_OVER") {
    if (chips === 0) {
      image(kakeguruiChan[2], CW, CH - 400, 400, 400);
      textContent = "Oh no! anyways, thank you for your patronage!";
    } else if (chips > 500 && chips < 1000) {
      image(kakeguruiChan[0], CW, CH - 400, 400, 400);
      textContent = "Not a bad haul! You should try more!";
    } else if (chips > 1000 && chips < 2000) {
      image(kakeguruiChan[2], CW, CH - 400, 400, 400);
      textContent = "That's some good earnings!";
    } else if (chips > 2000 && chips < 5000) {
      image(kakeguruiChan[1], CW, CH - 400, 400, 400);
      textContent = "Now, don't you crave for some more?";
    } else if (chips > 5000 && chips < 10000) {
      image(kakeguruiChan[3], CW, CH - 400, 400, 400);
      textContent = "...Well, it's good you got lucky.";
    } else if (chips > 10000) {
      image(kakeguruiChan[3], CW, CH - 400, 400, 400);
      textContent = "get out of my casino.";
    }
  }
  if (state === "BET") {
    image(kakeguruiChan[2], CW, CH - 400, 400, 400);
    textContent = "Oh? lets see how much you bet!";
  }
  if (state === "FLASH") {
    image(kakeguruiChan[0], CW, CH - 400, 400, 400);
    textContent = "Pay close attention!";
  }
  if (state === "ANSWER") {
    image(kakeguruiChan[0], CW, CH - 400, 400, 400);
    textContent = "What was it? did you see?";
  }
  if (state === "RESULT") {
    if (selectedAnswer === correctAnswer) {
      image(kakeguruiChan[3], CW, CH - 400, 400, 400);
      textContent = "Congratulations. I guess.";
    } else {
      image(kakeguruiChan[2], CW, CH - 400, 400, 400);
      textContent = "aw, don't worry! You'll get it next time!";
    }
  }
  if (state === "SHOP") {
    image(kakeguruiChan[0], CW, CH - 400, 400, 400);
    textContent = "Welcome to the shop! Try out some upgrades!";
  }
  if (state === "ACT_TRANSITION") {
    image(kakeguruiChan[1], CW, CH - 400, 400, 400);
    textContent = "HAHAHA! Lets try something new!";
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
  rect(0, 0, CW, CH);
  //background(col("bg"));

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

function drawShop() {
  rect(0, 0, CW, CH);
  //background(col("bg"));
  let cardX = PAD,
    cardY = PAD,
    cardW = CW - PAD * 2,
    cardH = CH - PAD * 2;
  drawCard(cardX, cardY, cardW, cardH);

  setFont(28, "display");
  fill(col("amber"));
  textAlign(CENTER, TOP);
  text("POWER-UP SHOP", CW / 2, cardY + 32);

  shopBtns = [];
  let itemY = cardY + 90;
  let itemH = 92;
  let itemW = cardW - PAD * 2;
  let itemX = cardX + PAD;
  let itemGap = 16;

  const items = [
    {
      key: "streakShield",
      title: "Streak Shield",
      description: "Keep your streak after one miss.",
      cost: 40,
      owned: hasStreakShield,
    },
    {
      key: "timeSurge",
      title: "Time Surge",
      description: "Extra answer time on the next round.",
      cost: 30,
      owned: hasTimeSurge,
    },
  ];

  for (let item of items) {
    drawCard(itemX, itemY, itemW, itemH, col("bg"));
    fill(col("white"));
    setFont(16, "display");
    textAlign(LEFT, TOP);
    text(item.title, itemX + 16, itemY + 14);

    setFont(11, "ui");
    fill(col("muted"));
    text(item.description, itemX + 16, itemY + 42);

    let statusText = item.owned ? "OWNED" : `COST: ${item.cost} chips`;
    fill(item.owned ? col("green") : col("amber"));
    setFont(12, "ui");
    textAlign(RIGHT, TOP);
    text(statusText, itemX + itemW - 16, itemY + 16);

    if (!item.owned) {
      let btnW = 100,
        btnH = 28;
      let btnX = itemX + itemW - btnW - 16,
        btnY = itemY + itemH - btnH - 16;
      drawCard(btnX, btnY, btnW, btnH, col("red"));
      fill(col("white"));
      setFont(12, "ui");
      textAlign(CENTER, CENTER);
      text("BUY", btnX + btnW / 2, btnY + btnH / 2);
      shopBtns.push({ x: btnX, y: btnY, w: btnW, h: btnH, key: item.key });
    }

    itemY += itemH + itemGap;
  }

  let bw = 220,
    bh = H_REVEAL;
  let bx = CW / 2 - bw / 2,
    by = itemY + 10;
  fill(col("amber"));
  noStroke();
  rect(bx - 3, by - 3, bw + 6, bh + 6, 4);
  fill(color(120, 12, 12));
  noStroke();
  rect(bx, by + 4, bw, bh, 2);
  fill(col("red"));
  noStroke();
  rect(bx, by, bw, bh - 4, 2);
  fill(col("white"));
  setFont(20, "display");
  textAlign(CENTER, CENTER);
  outlineText("CONTINUE", CW / 2, by + bh / 2 - 1);
  continueBtn = { x: bx, y: by, w: bw, h: bh };
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
    { label: "ACT I  —  TUTORIAL  (4 rounds)", color: "actI" },
    {
      text: "A number flashes somewhere on screen. It will always be mirrored, flipped, or both. Bet chips, then pick the real number from four choices.",
    },
    { spacer: true },
    { label: "ACT II —  SUM BLITZ  (6 rounds)", color: "actII" },
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
      if (l.color === "actI") {
        fill(color(31, 191, 255));
      } else if (l.color === "actII") {
        fill(color(248, 31, 255));
      } else {
        fill(col(l.color));
      }
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

  // Difficulty selection
  let diffLabelY = lineY + 20;
  setFont(16, "display");
  fill(color(31, 191, 255));
  textAlign(CENTER, TOP);
  text("SELECT DIFFICULTY", CW / 2, diffLabelY);

  let diffY = diffLabelY + 30;
  let dbW = 100;
  let dbH = 38;
  let dbGap = 10;
  let dbTotal = DIFF_SETTINGS.length * dbW + (DIFF_SETTINGS.length - 1) * dbGap;
  let dbX = CW / 2 - dbTotal / 2;
  diffBtns = [];
  for (let i = 0; i < DIFF_SETTINGS.length; i++) {
    let diff = DIFF_SETTINGS[i];
    let x = dbX + i * (dbW + dbGap);
    let active = i === difficulty;
    fill(active ? col("purple") : col(diff.color));
    noStroke();
    rect(x, diffY, dbW, dbH, 4);
    fill(col("white"));
    setFont(13, "ui");
    textAlign(CENTER, CENTER);
    text(diff.label, x + dbW / 2, diffY + dbH / 2);
    diffBtns.push({ x, y: diffY, w: dbW, h: dbH, index: i });
  }

  setFont(11, "ui");
  fill(col("muted"));
  textAlign(CENTER, TOP);
  text(DIFF_SETTINGS[difficulty].desc, CW / 2, diffY + dbH + 12);

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
  let isWinner = finalChips > 0;
  let cardW = CW - PAD * 2,
    cardH = 270;
  let cardX = PAD,
    cardY = CH / 2 - cardH / 2 - 10;
  drawCard(cardX, cardY, cardW, cardH);

  textAlign(CENTER, CENTER);
  let midX = CW / 2,
    midY = cardY + cardH / 2 - 20;

  let titleSize = isWinner ? 48 : 80;
  fill(col("shadow"));
  setFont(titleSize, "display");
  text(isWinner ? "YOU DID NOT LOSE!" : "GAME OVER", midX + 4, midY - 38);
  setShadow("rgba(210,35,45,0.5)", 20);
  fill(col("red"));
  text(isWinner ? "YOU DID NOT LOSE!" : "GAME OVER", midX, midY - 42);
  clearShadow();

  let buttonLabel = finalChips <= 0 ? "RESET GAME" : "PLAY AGAIN";

  if (finalChips <= 0) {
    setFont(18, "ui");
    fill(col("muted"));
    textAlign(CENTER, TOP);
    text("YOU LOST ALL YOUR MONEY!", midX, midY + 20);
  } else {
    let chipColor =
      finalChips >= 100 ? "green" : finalChips >= 0 ? "amber" : "red";
    setFont(13, "ui");
    fill(col("muted"));
    text("FINAL CHIPS", midX, midY + 20);

    fill(col(chipColor));
    setFont(64, "display");
    text(finalChips, midX, midY + 70);
  }

  // Reset button
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
  outlineText(buttonLabel, CW / 2, by + bh / 2 - 1);

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
    for (let b of diffBtns) {
      if (inBtn(mouseX, mouseY, b)) {
        difficulty = b.index;
        return;
      }
    }
    if (startBtn && inBtn(mouseX, mouseY, startBtn)) fullReset();
    return;
  }
  if (state === "SHOP") {
    for (let b of shopBtns) {
      if (inBtn(mouseX, mouseY, b)) {
        handleShopPurchase(b.key);
        return;
      }
    }
    if (continueBtn && inBtn(mouseX, mouseY, continueBtn)) {
      stopAllGameSounds();
      playRevealSound();
      state = "ACT_TRANSITION";
      transitionTimer = 3000;
    }
    return;
  }
  if (state === "GAME_OVER") {
    if (playAgainBtn && inBtn(mouseX, mouseY, playAgainBtn)) {
      stopAllGameSounds();
      playAgainBtn = null;
      state = "SPLASH";
    }
    return;
  }
  if (state === "ACT_TRANSITION") return;
  updateHover();
  if (revealBtn && !revealBtn.disabled && inBtn(mouseX, mouseY, revealBtn)) {
    stopAllGameSounds();
    playRevealSound();
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
        playDropCoinSound();
        setLog("Hit REVEAL when ready.", "muted");
        return;
      }
    }
  }
  if (state === "ANSWER") {
    for (let b of answerBtns) {
      if (inBtn(mouseX, mouseY, b)) {
        stopCountdownSound();
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
  hasStreakShield = false;
  hasTimeSurge = false;
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

function clearCountdownSoundSchedule() {
  if (countdownSoundTimeout !== null) {
    clearTimeout(countdownSoundTimeout);
    countdownSoundTimeout = null;
  }
}

function stopAllGameSounds() {
  clearCountdownSoundSchedule();
  [
    countdownSound,
    winSound,
    loseSound,
    jackpotSound,
    levelUpSound,
    dropCoinSound,
    revealSound,
    failTrumpetSound,
  ].forEach((sound) => {
    if (sound && sound.isLoaded && sound.isPlaying && sound.isPlaying()) {
      sound.stop();
    }
  });
}

function stopCountdownSound() {
  clearCountdownSoundSchedule();
  if (
    countdownSound &&
    countdownSound.isLoaded &&
    countdownSound.isPlaying &&
    countdownSound.isPlaying()
  ) {
    countdownSound.stop();
  }
}

function playSound(sound) {
  if (sound && sound.isLoaded && sound.isLoaded()) {
    stopAllGameSounds();
    sound.playMode("restart");
    sound.play();
  }
}

function playCountdownSound() {
  if (!countdownSound || !countdownSound.isLoaded || !countdownSound.isLoaded())
    return;
  clearCountdownSoundSchedule();

  let soundMs = countdownSound.duration() * 1000;
  let timeMs = answerTimer > 0 ? answerTimer : ANSWER_TIME;

  if (timeMs > soundMs) {
    let delay = timeMs - soundMs;
    countdownSoundTimeout = setTimeout(() => {
      countdownSoundTimeout = null;
      if (
        countdownSound &&
        countdownSound.isLoaded &&
        countdownSound.isLoaded()
      ) {
        countdownSound.playMode("restart");
        countdownSound.play();
      }
    }, delay);
  } else {
    let cueStart = max(0, soundMs - timeMs) / 1000;
    countdownSound.playMode("restart");
    countdownSound.play(0, 1, 1, cueStart, timeMs / 1000);
  }
}

function playWinSound() {
  playSound(winSound);
}

function playLoseSound() {
  playSound(loseSound);
}

function playJackpotSound() {
  playSound(jackpotSound);
}

function playLevelUpSound() {
  playSound(levelUpSound);
}

function playRevealSound() {
  if (revealSound && revealSound.isLoaded && revealSound.isLoaded()) {
    revealSound.playMode("restart");
    revealSound.play();
  }
}

function playDropCoinSound() {
  playSound(dropCoinSound);
}

function playFailTrumpetSound() {
  if (
    failTrumpetSound &&
    failTrumpetSound.isLoaded &&
    failTrumpetSound.isLoaded()
  ) {
    stopAllGameSounds();
    failTrumpetSound.playMode("restart");
    failTrumpetSound.play();
  }
}

function handleShopPurchase(key) {
  stopAllGameSounds();
  if (key === "streakShield") {
    if (hasStreakShield) {
      setLog("You already have Streak Shield.", "muted");
      return;
    }
    if (chips < 40) {
      setLog("Not enough chips for Streak Shield.", "bad");
      return;
    }
    chips -= 40;
    hasStreakShield = true;
    playDropCoinSound();
    setLog("Streak Shield purchased!", "good");
    return;
  }
  if (key === "timeSurge") {
    if (hasTimeSurge) {
      setLog("You already have Time Surge.", "muted");
      return;
    }
    if (chips < 30) {
      setLog("Not enough chips for Time Surge.", "bad");
      return;
    }
    chips -= 30;
    hasTimeSurge = true;
    playDropCoinSound();
    setLog("Time Surge purchased!", "good");
    return;
  }
}

function endFlash() {
  state = "ANSWER";
  glitching = false;
  answerTimer = ANSWER_TIME * (hasTimeSurge ? 1.5 : 1);
  if (hasTimeSurge) {
    hasTimeSurge = false;
    setLog("Time Surge activated! More time this round.", "special");
  } else {
    setLog(act === 1 ? "Pick your answer!" : "What was the sum?", "info");
  }
  playCountdownSound();
}

function handleAnswer(val) {
  selectedAnswer = val;
  let diff = getDiff(),
    bet = lastBet;
  if (act === 1) {
    if (val === correctAnswer) {
      let profit = floor(bet * diff.mult);
      chips += profit;
      streak++;
      setLog("+" + profit + " chips! Correct!  (×" + diff.mult + ")", "good");
      playJackpotSound();
    } else {
      chips -= bet;
      if (hasStreakShield) {
        hasStreakShield = false;
        setLog(
          "-" +
            bet +
            " chips. Streak preserved by shield! It was " +
            correctAnswer +
            ".",
          "good",
        );
      } else {
        streak = 0;
        setLog("-" + bet + " chips.  It was " + correctAnswer + ".", "bad");
      }
      if (chips > 0) playLoseSound();
    }
  } else {
    if (Math.abs(val - correctAnswer) === 0) {
      let profit = floor(bet * diff.mult);
      chips += profit;
      streak++;
      setLog("+" + profit + " chips!  EXACT!  (×" + diff.mult + ")", "good");
      playJackpotSound();
    } else {
      chips -= bet;
      if (hasStreakShield) {
        hasStreakShield = false;
        setLog(
          "-" +
            bet +
            " chips. Streak preserved by shield! Sum was " +
            correctAnswer +
            ".",
          "good",
        );
      } else {
        streak = 0;
        setLog("-" + bet + " chips.  Sum was " + correctAnswer + ".", "bad");
      }
      if (chips > 0) playLoseSound();
    }
  }

  if (chips <= 0) {
    gameOverNow();
    return;
  }

  state = "RESULT";
  resultTimer = 2000;
}

function handleTimeout() {
  selectedAnswer = -1;
  if (hasStreakShield) {
    hasStreakShield = false;
    setLog(
      "TIME'S UP! -" +
        lastBet +
        " chips. Streak preserved by shield! It was " +
        correctAnswer +
        ".",
      "good",
    );
  } else {
    streak = 0;
    setLog(
      "TIME'S UP! -" + lastBet + " chips.  It was " + correctAnswer + ".",
      "bad",
    );
  }
  chips -= lastBet;

  if (chips > 0) playLoseSound();

  if (chips <= 0) {
    gameOverNow();
    return;
  }

  state = "RESULT";
  resultTimer = 2000;
}

function gameOverNow() {
  stopAllGameSounds();
  finalChips = chips;
  if (finalChips <= 0) {
    playFailTrumpetSound();
  } else {
    playLoseSound();
  }
  state = "GAME_OVER";
}

function nextRound() {
  let maxRounds = act === 1 ? 4 : 6;
  if (actRound >= maxRounds) {
    if (act === 1) {
      stopAllGameSounds();
      playLevelUpSound();
      state = "SHOP";
      setLog("Shop before Act II — buy a boost or continue.", "special");
      return;
    } else {
      stopAllGameSounds();
      finalChips = chips;
      if (finalChips > 0) playWinSound();
      else playLoseSound();
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
>>>>>>> Stashed changes

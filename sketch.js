// CALCUCINO - p5.js  (Casino UI Restyle)
// ACT 1: Tutorial  — 4 rounds, single number, remember & guess
// ACT 2: Sum Blitz — 6 rounds, multiple scattered numbers, guess the sum

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  bg: [0, 0, 0],
  card: [28, 22, 60],
  bord: [200, 140, 20],
  red: [176, 24, 24],
  redHi: [210, 45, 45],
  amber: [220, 155, 10],
  cyan: [17, 68, 177],
  green: [12, 139, 33],
  purple: [156, 29, 176],
  muted: [130, 110, 170],
  text: [240, 235, 255],
  white: [255, 255, 255],
  shadow: [90, 30, 120],
};

// ── Difficulty ────────────────────────────────────────────────────────────────
let difficulty = 1;
const DIFF_SETTINGS = [
  { label: "EASY",   color: "green",  desc: "Longer flash times. Forgiving.",    timeScale: 1.6, choiceSpread: 8 },
  { label: "NORMAL", color: "amber",  desc: "Balanced. The intended experience.", timeScale: 1.0, choiceSpread: 5 },
  { label: "HARD",   color: "red",    desc: "Brutal flash times. Tight choices.", timeScale: 0.6, choiceSpread: 2 },
];
let diffBtns = [];

// ── Power-ups ─────────────────────────────────────────────────────────────────
let hasStreakShield = false;
let hasTimeSurge    = false;
let powerupFlash    = null;   // { label, colorKey, timer, duration }
const FLASH_DUR     = 1800;

let shopBtns    = [];
let continueBtn = null;

// ── High Score ────────────────────────────────────────────────────────────────
const HS_KEY   = "calcucino_hs_v1";
const HS_MAX   = 5;
let highScores = [];

function loadHighScores() {
  try {
    let raw = localStorage.getItem(HS_KEY);
    highScores = raw ? JSON.parse(raw) : [];
  } catch(e) { highScores = []; }
}

function saveHighScore(chipsAmt, diffLabel) {
  loadHighScores();
  highScores.push({ chips: chipsAmt, diff: diffLabel, date: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}) });
  highScores.sort((a,b) => b.chips - a.chips);
  highScores = highScores.slice(0, HS_MAX);
  try { localStorage.setItem(HS_KEY, JSON.stringify(highScores)); } catch(e) {}
}

function isNewRecord(chipsAmt) {
  loadHighScores();
  return highScores.length === 0 || chipsAmt > highScores[0].chips;
}

// ── Layout ────────────────────────────────────────────────────────────────────
const PAD = 20;
const GAP = 14;
const CW  = 520;

const H_HEADER = 110;
const H_STATS  = 70;
const H_ARENA  = 210;
const H_BET    = 70;
const H_LOG    = 24;
const H_REVEAL = 52;

const CH =
  PAD + H_HEADER + GAP + H_STATS + GAP + H_ARENA + GAP +
  H_BET + GAP + H_LOG + GAP + H_REVEAL + PAD;

const Y_HEADER = PAD;
const Y_STATS  = Y_HEADER + H_HEADER + GAP;
const Y_ARENA  = Y_STATS  + H_STATS  + GAP;
const Y_BET    = Y_ARENA  + H_ARENA  + GAP;
const Y_LOG    = Y_BET    + H_BET    + GAP;
const Y_REVEAL = Y_LOG    + H_LOG    + GAP;

// ── Game state ────────────────────────────────────────────────────────────────
let chips = 50, streak = 0, currentBet = 0;
let act = 1, actRound = 1, finalChips = 0;
let correctAnswer = 0;
let sumNumbers = [], numPositions = [], numFlips = [];
let act1Pos = { x: 0, y: 0 };
let state = "SPLASH";
let isMirrored = false, flipType = 0;
let flashTimer = 0, flashDuration = 0;
let resultTimer = 0, transitionTimer = 0;
let choices = [], selectedAnswer = -1;
let logMsg = "Select a wager, then hit REVEAL.";
let logType = "muted";
let glitching = false;
let answerTimer = 0;
const ANSWER_TIME = 6000;

let CHIP_VALUES = [5, 10, 25, 50, "ALL"];
function updateChipValues() {
  let c = Math.abs(chips);
  if      (c >= 300) CHIP_VALUES = [50, 100, 150, 300, "ALL"];
  else if (c >= 150) CHIP_VALUES = [25,  50,  75, 150, "ALL"];
  else if (c >=  75) CHIP_VALUES = [10,  25,  50,  75, "ALL"];
  else               CHIP_VALUES = [ 5,  10,  25,  50, "ALL"];
}

let chipBtns = [], answerBtns = [];
let revealBtn = null, startBtn = null, playAgainBtn = null;
let revealHover = false, revealFill = 0;
let answerHover = -1;
let allSelected = false, lastBet = 0, wagerPulse = 0;

// ── Difficulty helpers ────────────────────────────────────────────────────────
function getA1Diff() {
  const s = DIFF_SETTINGS[difficulty].timeScale;
  const t = [
    { ms: 1600*s, label: "EASY",    mult: 1.5 },
    { ms: 1000*s, label: "SHAKY",   mult: 2.0 },
    { ms:  650*s, label: "BLURRED", mult: 2.5 },
    { ms:  380*s, label: "FUZZY",   mult: 3.5 },
  ];
  return t[min(actRound - 1, t.length - 1)];
}
function getA2Diff() {
  const s = DIFF_SETTINGS[difficulty].timeScale;
  const t = [
    { ms: 2200*s, count: 2, scatter: false, flipChance: 1.0, label: "CALM",     mult: 1.5 },
    { ms: 1600*s, count: 2, scatter: true,  flipChance: 1.0, label: "DRIFTING", mult: 1.8 },
    { ms: 1100*s, count: 3, scatter: true,  flipChance: 1.0, label: "SPREAD",   mult: 2.2 },
    { ms: 3000*s, count: 3, scatter: true,  flipChance: 1.0, label: "CHAOS",    mult: 2.8 },
    { ms: 3000*s, count: 4, scatter: true,  flipChance: 1.0, label: "FRENZY",   mult: 3.5 },
    { ms: 3000*s, count: 5, scatter: true,  flipChance: 1.0, label: "MAYHEM",   mult: 4.5 },
  ];
  return t[min(actRound - 1, t.length - 1)];
}
function getDiff() { return act === 1 ? getA1Diff() : getA2Diff(); }

// ── Shop pricing (scales with current chips) ──────────────────────────────────
function shieldPrice() { return max(10, floor(chips * 0.40)); }
function surgePrice()  { return max(8,  floor(chips * 0.28)); }

// ── p5 helpers ────────────────────────────────────────────────────────────────
function col(key, a) {
  let c = C[key] || C.white;
  return a !== undefined ? color(c[0],c[1],c[2],a) : color(c[0],c[1],c[2]);
}
function setShadow(c, blur) { drawingContext.shadowColor = c; drawingContext.shadowBlur = blur; }
function clearShadow()      { drawingContext.shadowColor = "transparent"; drawingContext.shadowBlur = 0; }
function setFont(size, style) {
  textSize(size);
  drawingContext.font = style === "display"
    ? `900 ${size}px "Black Han Sans","Impact",sans-serif`
    : `700 ${size}px "Black Han Sans","Arial Black",sans-serif`;
}
function outlineText(str, x, y) {
  clearShadow();
  drawingContext.lineJoin = "round";
  stroke(0); strokeWeight(4); text(str, x, y);
  noStroke(); text(str, x, y);
}
function drawCard(x, y, w, h, fillColor) {
  fill(col("bord")); noStroke(); rect(x-3, y-3, w+6, h+6, 4);
  fill(fillColor || col("card")); noStroke(); rect(x, y, w, h, 2);
}

// ═════════════════════════════════════════════════════════════════════════════
//  SETUP & DRAW
// ═════════════════════════════════════════════════════════════════════════════
let logoImg = null;
function preload() { logoImg = loadImage("assets/Calcusino_p.png"); }
function setup()   { createCanvas(CW, CH); textFont("Impact"); loadHighScores(); }

function draw() {
  background(col("bg"));

  if (state === "SPLASH")         { drawSplash(); return; }
  if (state === "GAME_OVER")      { drawGameOver(); return; }
  if (state === "SHOP")           { drawShop(); return; }
  if (state === "ACT_TRANSITION") {
    drawActTransition();
    transitionTimer -= deltaTime;
    if (transitionTimer <= 0) beginAct2();
    return;
  }

  drawHeader(); drawStats(); drawArena();
  drawBetSection(); drawLog(); drawRevealBtn();
  drawPowerupHUD();

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

  if (state === "BET" && currentBet === 0) wagerPulse = (sin(frameCount * 0.07) + 1) / 2;
  else wagerPulse = 0;

  revealFill += ((revealHover && !revealBtn?.disabled ? 1 : 0) - revealFill) * 0.15;

  // Big power-up activation flash drawn on top of everything
  if (powerupFlash) {
    powerupFlash.timer -= deltaTime;
    if (powerupFlash.timer <= 0) powerupFlash = null;
    else drawPowerupFlash();
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  POWER-UP HUD  — icon badges inside top-right of arena
// ═════════════════════════════════════════════════════════════════════════════
function drawPowerupHUD() {
  let ax = PAD, aw = CW - PAD * 2;
  let bx = ax + aw - 14;
  let by = Y_ARENA + 28;
  let sz = 26, gap = 6;

  if (hasTimeSurge) {
    bx -= sz;
    drawHUDBadge("⚡", bx, by, sz, col("amber", 210));
    bx -= gap;
  }
  if (hasStreakShield) {
    bx -= sz;
    drawHUDBadge("🛡", bx, by, sz, col("cyan", 210));
  }
}

function drawHUDBadge(icon, x, y, sz, bgColor) {
  setShadow("rgba(220,155,10,0.7)", 10);
  fill(bgColor); noStroke(); rect(x, y, sz, sz, 4);
  clearShadow();
  setFont(15, "display"); textAlign(CENTER, CENTER); noStroke();
  fill(col("white")); text(icon, x + sz/2, y + sz/2);
}

// ═════════════════════════════════════════════════════════════════════════════
//  POWER-UP ACTIVATION FLASH  — dramatic full-arena overlay
// ═════════════════════════════════════════════════════════════════════════════
function triggerPowerupFlash(label, colorKey) {
  powerupFlash = { label, colorKey, timer: FLASH_DUR, duration: FLASH_DUR };
}

function drawPowerupFlash() {
  let f   = powerupFlash;
  let pct = f.timer / f.duration;   // 1 → 0

  let alpha, sc;
  if      (pct > 0.65) { alpha = map(pct, 1.0, 0.65, 0, 255); sc = map(pct, 1.0, 0.65, 2.4, 1.0); }
  else if (pct > 0.20) { alpha = 255; sc = 1.0; }
  else                 { alpha = map(pct, 0.20, 0.0, 255, 0);  sc = map(pct, 0.20, 0.0, 1.0, 0.75); }

  let cRgb = C[f.colorKey] || C.white;

  // Dark vignette over arena only
  fill(color(0, 0, 0, alpha * 0.50));
  noStroke(); rect(PAD, Y_ARENA, CW - PAD*2, H_ARENA);

  push();
  translate(CW/2, Y_ARENA + H_ARENA/2);
  drawingContext.scale(sc, sc);

  // Scan lines for extra drama
  fill(color(255, 255, 255, alpha * 0.10)); noStroke();
  for (let sy = -80; sy < 80; sy += 7) rect(-220, sy, 440, 3);

  // Colored glow shadow
  setShadow(`rgba(${cRgb[0]},${cRgb[1]},${cRgb[2]},0.8)`, 50);
  fill(color(cRgb[0], cRgb[1], cRgb[2], alpha));
  setFont(50, "display"); textAlign(CENTER, CENTER);
  text(f.label, 4, 4);

  // White outline text on top
  clearShadow();
  fill(color(255, 255, 255, alpha));
  outlineText(f.label, 0, 0);
  pop();
}

// ═════════════════════════════════════════════════════════════════════════════
//  SHOP  — between Act I and Act II
// ═════════════════════════════════════════════════════════════════════════════
function drawShop() {
  background(col("bg"));

  // Logo
  if (logoImg) {
    let iw = CW - PAD*2;
    image(logoImg, PAD, Y_HEADER, iw, iw*(logoImg.height/logoImg.width));
  }

  // Shop title
  let hY = Y_STATS - 4;
  fill(col("shadow")); setFont(46, "display"); textAlign(CENTER, TOP);
  text("THE  HOUSE  SHOP", CW/2 + 3, hY + 3);
  setShadow("rgba(220,155,10,0.5)", 20);
  fill(col("amber")); setFont(46, "display"); textAlign(CENTER, TOP);
  text("THE  HOUSE  SHOP", CW/2, hY);
  clearShadow();

  setFont(11, "ui"); fill(col("muted")); textAlign(CENTER, TOP);
  text("One last chance before SUM BLITZ.  Spend wisely.", CW/2, hY + 54);

  // Chip count
  let chipY = hY + 74;
  setFont(13, "display"); fill(col("cyan")); textAlign(CENTER, TOP);
  text("YOUR CHIPS:  " + chips, CW/2, chipY);

  // Two item cards
  shopBtns = [];
  let items = [
    {
      key:        "shield",
      icon:       "🛡",
      name:       "STREAK SHIELD",
      desc:       "Your streak survives\none wrong answer.",
      price:      shieldPrice(),
      owned:      hasStreakShield,
      borderKey:  "cyan",
      glowRgb:    "17,68,177",
    },
    {
      key:        "surge",
      icon:       "⚡",
      name:       "TIME SURGE",
      desc:       "Double answer time\nfor one round.",
      price:      surgePrice(),
      owned:      hasTimeSurge,
      borderKey:  "amber",
      glowRgb:    "220,155,10",
    },
  ];

  let cardW = (CW - PAD*2 - GAP) / 2;
  let cardH = 202;
  let cardY = chipY + 26;

  for (let i = 0; i < items.length; i++) {
    drawShopCard(PAD + i*(cardW + GAP), cardY, cardW, cardH, items[i]);
  }

  // CONTINUE button
  let bw = 260, bh = H_REVEAL;
  let bx = CW/2 - bw/2, by = cardY + cardH + GAP*2;
  let hov = continueBtn ? inBtn(mouseX, mouseY, continueBtn) : false;

  fill(col("amber")); noStroke(); rect(bx-3, by-3, bw+6, bh+6, 4);
  fill(color(120,12,12)); noStroke(); rect(bx, by+4, bw, bh, 2);
  fill(hov ? col("redHi") : col("red")); noStroke(); rect(bx, by, bw, bh-4, 2);
  fill(col("white")); setFont(22, "display"); textAlign(CENTER, CENTER);
  outlineText("ENTER ACT II  →", CW/2, by + bh/2 - 1);
  continueBtn = { x:bx, y:by, w:bw, h:bh };
}

function drawShopCard(x, y, w, h, item) {
  let canAfford = chips >= item.price && !item.owned;

  if (canAfford) { setShadow(`rgba(${item.glowRgb},0.45)`, 18); }
  let borderC = item.owned ? col("green") : canAfford ? col(item.borderKey) : col("muted", 100);
  fill(borderC); noStroke(); rect(x-3, y-3, w+6, h+6, 6);
  clearShadow();
  fill(col("card")); noStroke(); rect(x, y, w, h, 4);

  // Icon
  setFont(44, "display"); textAlign(CENTER, TOP); noStroke();
  fill(col("white")); text(item.icon, x+w/2, y+12);

  // Name
  let nameCol = item.owned ? "green" : canAfford ? item.borderKey : "muted";
  setFont(14, "display"); fill(col(nameCol)); textAlign(CENTER, TOP);
  text(item.name, x+w/2, y+66);

  // Desc
  setFont(10, "ui"); fill(col("text")); textAlign(CENTER, TOP);
  text(item.desc, x+w/2, y+86);

  // Divider
  stroke(col("bord", 70)); strokeWeight(1);
  line(x+16, y+120, x+w-16, y+120); noStroke();

  if (item.owned) {
    setFont(14, "display"); fill(col("green")); textAlign(CENTER, CENTER);
    outlineText("✓  OWNED", x+w/2, y+155);
  } else {
    setFont(11, "ui"); fill(col("amber")); textAlign(CENTER, TOP);
    text(item.price + " chips", x+w/2, y+128);

    let bw2 = w-32, bh2 = 30, bx2 = x+16, by2 = y+150;

    if (canAfford) {
      fill(col("amber")); noStroke(); rect(bx2-2, by2-2, bw2+4, bh2+4, 4);
      fill(color(120,12,12)); noStroke(); rect(bx2, by2+3, bw2, bh2-1, 2);
      let hov2 = mouseX>=bx2 && mouseX<=bx2+bw2 && mouseY>=by2 && mouseY<=by2+bh2;
      fill(hov2 ? col("redHi") : col("red")); noStroke(); rect(bx2, by2, bw2, bh2-3, 2);
      fill(col("white")); setFont(13, "display"); textAlign(CENTER, CENTER);
      outlineText("BUY", bx2+bw2/2, by2+bh2/2-1);
      shopBtns.push({ x:bx2, y:by2, w:bw2, h:bh2, key:item.key, price:item.price });
    } else {
      fill(color(60,20,20)); noStroke(); rect(bx2, by2, bw2, bh2, 3);
      fill(col("muted", 150)); setFont(11, "display"); textAlign(CENTER, CENTER);
      text(chips < item.price ? "CAN'T AFFORD" : "SOLD OUT", bx2+bw2/2, by2+bh2/2);
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  HEADER
// ═════════════════════════════════════════════════════════════════════════════
function drawHeader() {
  if (logoImg) {
    let iw = CW-PAD*2; image(logoImg, PAD, Y_HEADER, iw, iw*(logoImg.height/logoImg.width));
  }
  setFont(12, "ui"); fill(col("muted")); textAlign(CENTER, TOP);
  text(act===1 ? "ACT I  —  TUTORIAL: Remember the number"
               : "ACT II —  SUM BLITZ: Guess the total",
    CW/2, Y_HEADER + 86);
}

// ═════════════════════════════════════════════════════════════════════════════
//  STATS
// ═════════════════════════════════════════════════════════════════════════════
function drawStats() {
  let labels    = ["CHIPS","ROUND","STREAK"];
  let values    = [chips, actRound+"/"+(act===1?4:6), streak];
  let gradients = [["#1144B1","#113789"],["#9C1DB0","#650E73"],["#0C8B21","#096C1A"]];
  let cw3 = (CW - PAD*2 - GAP*2) / 3;
  for (let i = 0; i < 3; i++) {
    let x = PAD + i*(cw3+GAP);
    fill(col("bord")); noStroke(); rect(x-3, Y_STATS-3, cw3+6, H_STATS+6, 4);
    let g = drawingContext.createLinearGradient(x,Y_STATS, x+cw3,Y_STATS+H_STATS);
    g.addColorStop(0, gradients[i][0]); g.addColorStop(1, gradients[i][1]);
    drawingContext.fillStyle = g; drawingContext.fillRect(x, Y_STATS, cw3, H_STATS);
    fill(col("white")); setFont(12, "ui"); textAlign(CENTER, TOP);
    outlineText(labels[i], x+cw3/2, Y_STATS+10);
    fill(col("white")); setFont(34, "display"); textAlign(CENTER, TOP);
    outlineText(values[i], x+cw3/2, Y_STATS+26);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  ARENA
// ═════════════════════════════════════════════════════════════════════════════
function drawArena() {
  let ax = PAD, aw = CW - PAD*2;
  drawCard(ax, Y_ARENA, aw, H_ARENA);
  let diff = getDiff();
  answerBtns = [];

  fill(col("muted")); setFont(10,"ui"); textAlign(LEFT,TOP);
  text((act===1?"ACT I":"ACT II")+"  RND "+actRound, ax+12, Y_ARENA+10);
  textAlign(RIGHT,TOP); fill(col("amber")); setFont(14,"display");
  text("×"+diff.mult, ax+aw-12, Y_ARENA+10);
  fill(col("muted")); setFont(10,"ui"); textAlign(RIGHT,BOTTOM);
  text(diff.label, ax+aw-12, Y_ARENA+H_ARENA-10);

  if (state === "BET") {
    fill(col("muted")); setFont(12,"ui"); textAlign(CENTER,CENTER);
    text(act===1 ? "Place your bet,\nthen reveal the number."
                 : "Place your bet,\nthen watch the numbers flash.\nSome may be mirrored or flipped.\nGuess their SUM.",
      ax+aw/2, Y_ARENA+H_ARENA/2);
  }

  if (state === "ANSWER" || state === "RESULT") {
    let gap=8, bw=(aw-32-gap*3)/4, bh=52;
    let bx=ax+16, by=Y_ARENA+H_ARENA/2-bh/2;
    for (let i = 0; i < 4; i++) {
      let val = choices[i] !== undefined ? choices[i] : null;
      let btnState = "idle";
      if (state==="RESULT" && val!==null) {
        if (val===correctAnswer) btnState="correct";
        else if (val===selectedAnswer) btnState="wrong";
      }
      let hovered = answerHover===i && state==="ANSWER";
      answerBtns.push({x:bx,y:by,w:bw,h:bh,val});
      if (val!==null) drawAnswerBtn(bx,by,bw,bh,val,btnState,hovered,255);
      bx += bw+gap;
    }
    if (state==="ANSWER") {
      let pct = constrain(answerTimer/ANSWER_TIME, 0, 1);
      let urgent  = pct < 0.35;
      let barRgb  = urgent ? "210,35,45" : "220,155,10";
      fill(color(40,30,10)); noStroke(); rect(ax, Y_ARENA+H_ARENA-5, aw, 5);
      setShadow(`rgba(${barRgb},0.8)`, urgent?10:6);
      fill(urgent ? col("red") : col("amber")); noStroke();
      rect(ax, Y_ARENA+H_ARENA-5, aw*pct, 5);
      clearShadow();
    }
  }

  if (state === "FLASH") {
    let pct01 = constrain(flashTimer/flashDuration, 0, 1);
    let fadeA  = constrain(map(flashTimer, 0, flashDuration*0.12, 0, 255), 0, 255);
    if (act===1) drawAct1Flash(ax, aw, fadeA);
    else         drawAct2Flash(ax, aw, fadeA);
    let barRgb = pct01<0.3 ? "210,35,45" : "220,155,10";
    setShadow(`rgba(${barRgb},0.8)`, 8);
    fill(pct01<0.3 ? col("red") : col("amber")); noStroke();
    rect(ax, Y_ARENA+H_ARENA-3, aw*pct01, 3);
    clearShadow();
  }
}

function drawAct1Flash(ax, aw, fadeA) {
  let a01=fadeA/255, ox=0, oy=0;
  if (glitching && frameCount%3===0) { ox=random(-6,6); oy=random(-3,3); }
  push();
  translate(act1Pos.x+ox, act1Pos.y+oy);
  if (flipType===1||flipType===3) scale(-1,1);
  if (flipType===2||flipType===3) scale(1,-1);
  setShadow(`rgba(210,35,45,${(a01*0.6).toFixed(2)})`, 30);
  fill(col("red",fadeA)); setFont(120,"display"); textAlign(CENTER,CENTER);
  text(correctAnswer, 0, 0); clearShadow(); pop();
}

function drawAct2Flash(ax, aw, fadeA) {
  let a01=fadeA/255, diff=getA2Diff();
  const hues=["255,255,255","80,160,255","200,100,255","220,155,10","60,200,100"];
  let sz = diff.count<=2 ? 90 : diff.count<=3 ? 72 : 56;
  for (let i=0; i<sumNumbers.length; i++) {
    let pos=numPositions[i]; if(!pos) continue;
    let wobble = diff.scatter ? sin(frameCount*0.08+i*1.3)*4 : 0;
    let nx = ax+pos.x+wobble;
    let ny = Y_ARENA+pos.y+cos(frameCount*0.06+i*0.9)*(diff.scatter?3:0);
    let ox=0, oy=0;
    if (glitching&&frameCount%3===0) { ox=random(-4,4); oy=random(-2,2); }
    let ft = numFlips[i]||0;
    let h  = ft!==0 ? "210,35,45" : hues[i%hues.length];
    push(); translate(nx+ox, ny+oy);
    if(ft===1||ft===3) scale(-1,1); if(ft===2||ft===3) scale(1,-1);
    setShadow(`rgba(${h},${(a01*0.55).toFixed(2)})`, 20);
    fill(color(...h.split(",").map(Number), fadeA));
    setFont(sz,"display"); textAlign(CENTER,CENTER); text(sumNumbers[i],0,0);
    clearShadow(); pop();
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  BET SECTION
// ═════════════════════════════════════════════════════════════════════════════
function drawBetSection() {
  let x=PAD, w=CW-PAD*2;
  drawCard(x, Y_BET, w, H_BET);
  fill(col("white")); setFont(18,"display"); textAlign(CENTER,TOP);
  outlineText("WAGER!", x+w/2, Y_BET+8);
  chipBtns=[];
  let bh=32, gap=8;
  let bw=(w-32-gap*(CHIP_VALUES.length-1))/CHIP_VALUES.length;
  let bx=x+16, by=Y_BET+30;
  for (let i=0; i<CHIP_VALUES.length; i++) {
    let val=CHIP_VALUES[i], realVal=val==="ALL"?chips:val;
    let active=(val==="ALL"?allSelected:!allSelected&&currentBet===realVal)||
      (state!=="BET"&&(val==="ALL"?allSelected:!allSelected&&lastBet===realVal));
    let disabled=state!=="BET"&&!active;
    chipBtns.push({x:bx,y:by,w:bw,h:bh,realVal,isAll:val==="ALL"});
    drawChipBtn(bx,by,bw,bh,String(val),active,disabled);
    bx+=bw+gap;
  }
}

function drawChipBtn(x,y,w,h,label,active,disabled) {
  if (disabled) {
    fill(color(120,12,12)); noStroke(); rect(x,y,w,h,2);
    fill(color(160,60,60)); noStroke(); rect(x,y,w,h-4,2);
  } else {
    fill(active?col("amber"):col("bord")); noStroke(); rect(x-2,y-2,w+4,h+4,4);
    fill(active?color(160,100,0):color(120,12,12)); noStroke(); rect(x,y+3,w,h-1,2);
    fill(active?color(200,140,0):col("red")); noStroke(); rect(x,y,w,h-3,2);
  }
  fill(disabled?color(160,60,60):col("white")); setFont(13,"ui"); textAlign(CENTER,CENTER);
  if(disabled) text(label,x+w/2,y+h/2-1); else outlineText(label,x+w/2,y+h/2-1);
}

function drawAnswerBtn(x,y,w,h,val,btnState,hovered,alpha) {
  if(alpha===undefined) alpha=255;
  let fillTop,fillBot,borderC;
  if(btnState==="correct")    { borderC=col("amber",alpha); fillTop=color(30,160,60,alpha);  fillBot=color(15,100,40,alpha);  }
  else if(btnState==="wrong") { borderC=col("amber",alpha); fillTop=color(176,24,24,alpha);  fillBot=color(100,10,10,alpha);  }
  else if(hovered)            { borderC=col("amber",alpha); fillTop=color(210,45,45,alpha);  fillBot=color(130,20,20,alpha);  }
  else                        { borderC=col("bord",alpha);  fillTop=color(176,24,24,alpha);  fillBot=color(110,10,10,alpha);  }
  fill(borderC); noStroke(); rect(x-2,y-2,w+4,h+4,4);
  fill(fillBot);  noStroke(); rect(x,y+3,w,h-1,2);
  fill(fillTop);  noStroke(); rect(x,y,w,h-3,2);
  fill(col("white",alpha)); setFont(28,"display"); textAlign(CENTER,CENTER);
  outlineText(val, x+w/2, y+h/2-1);
}

// ═════════════════════════════════════════════════════════════════════════════
//  LOG
// ═════════════════════════════════════════════════════════════════════════════
function drawLog() {
  let tints={muted:"muted",good:"green",bad:"red",info:"cyan",special:"purple"};
  fill(col(tints[logType]||"muted")); setFont(11,"ui"); textAlign(CENTER,CENTER);
  text(logMsg, CW/2, Y_LOG+H_LOG/2);
}

// ═════════════════════════════════════════════════════════════════════════════
//  REVEAL BUTTON
// ═════════════════════════════════════════════════════════════════════════════
function drawRevealBtn() {
  let x=PAD, w=CW-PAD*2, h=H_REVEAL;
  let disabled = state!=="BET"||currentBet===0;
  if (!disabled) {
    fill(col("amber")); noStroke(); rect(x-3,Y_REVEAL-3,w+6,h+6,4);
    fill(color(120,12,12)); noStroke(); rect(x,Y_REVEAL+4,w,h,2);
    fill(revealHover?col("redHi"):col("red")); noStroke(); rect(x,Y_REVEAL,w,h-4,2);
  } else {
    fill(color(60,10,10)); noStroke(); rect(x,Y_REVEAL,w,h,2);
  }
  fill(disabled?color(120,40,40):col("white")); setFont(24,"display"); textAlign(CENTER,CENTER);
  if(disabled) text("REVEAL",x+w/2,Y_REVEAL+h/2-1);
  else outlineText("REVEAL",x+w/2,Y_REVEAL+h/2-1);
  revealBtn={x,y:Y_REVEAL,w,h,disabled};
}

// ═════════════════════════════════════════════════════════════════════════════
//  ACT TRANSITION
// ═════════════════════════════════════════════════════════════════════════════
function drawActTransition() {
  background(col("bg"));
  let fadeIn  = constrain(map(transitionTimer,3000,2400,0,255),0,255);
  let elapsed = 1 - transitionTimer/3000;
  textAlign(CENTER,CENTER);
  fill(col("shadow",fadeIn)); setFont(90,"display"); text("ACT  II",CW/2+5,CH/2-55);
  setShadow("rgba(210,35,45,0.5)",30); fill(col("red",fadeIn)); setFont(90,"display");
  text("ACT  II",CW/2,CH/2-60); clearShadow();
  fill(col("amber",fadeIn)); setFont(28,"display"); text("S U M   B L I T Z",CW/2,CH/2+14);
  fill(col("muted",fadeIn)); setFont(12,"ui");
  text("Numbers scatter across the screen.\nYour job: guess their sum.\nOnly the exact answer wins.",CW/2,CH/2+72);
  let bw=300;
  fill(color(40,30,10)); noStroke(); rect(CW/2-bw/2,CH-76,bw,8,4);
  setShadow("rgba(220,155,10,0.8)",8); fill(col("amber")); noStroke();
  rect(CW/2-bw/2,CH-76,bw*elapsed,8,4); clearShadow();
}

// ═════════════════════════════════════════════════════════════════════════════
//  SPLASH SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function drawSplash() {
  if (logoImg) {
    let iw=CW-PAD*2; image(logoImg,PAD,Y_HEADER,iw,iw*(logoImg.height/logoImg.width));
  }
  setFont(12,"ui"); fill(col("muted")); textAlign(CENTER,TOP);
  text("A game about numbers you can't trust",CW/2,Y_HEADER+86);

  let cx=PAD, cw=CW-PAD*2, cy=Y_STATS;
  let diffSectionH=90;
  let ch=CH-Y_STATS-PAD-72-GAP-diffSectionH;
  drawCard(cx,cy,cw,ch);

  setFont(18,"display"); fill(col("amber")); textAlign(CENTER,TOP);
  text("HOW TO PLAY",CW/2,cy+16);

  setFont(11,"ui"); fill(col("muted")); textAlign(LEFT,TOP);
  let lx=cx+20, lw=cw-40;
  let lines=[
    {label:"ACT I  —  TUTORIAL  (4 rounds)", color:"cyan"},
    {text:"A number flashes on screen — mirrored, flipped, or both. Pick the real number."},
    {spacer:true},
    {label:"ACT II —  SUM BLITZ  (6 rounds)", color:"purple"},
    {text:"Multiple numbers scatter across the screen. Add them up. Pick the correct sum."},
    {spacer:true},
    {label:"SCORING", color:"amber"},
    {text:"Correct: win bet × multiplier.  Wrong or timeout: lose your bet."},
    {text:"Run out of chips and it's game over. Visit the Shop between acts!"},
  ];
  let lineY=cy+48, lineH=14;
  for (let l of lines) {
    if (l.spacer) { lineY+=5; continue; }
    if (l.label) {
      fill(col(l.color)); setFont(12,"display"); textAlign(LEFT,TOP);
      text(l.label,lx,lineY); lineY+=16;
    } else {
      fill(col("text")); setFont(11,"ui"); textAlign(LEFT,TOP);
      let words=l.text.split(" "), line="";
      for (let ww of words) {
        let test=line+(line?" ":"")+ww;
        if(textWidth(test)>lw-10){text(line,lx+8,lineY);lineY+=lineH;line=ww;}
        else line=test;
      }
      if(line){text(line,lx+8,lineY);lineY+=lineH;}
    }
  }

  // Difficulty selector
  let dy=cy+ch+GAP;
  drawCard(cx,dy,cw,diffSectionH);
  setFont(14,"display"); fill(col("amber")); textAlign(CENTER,TOP);
  outlineText("DIFFICULTY",CW/2,dy+10);
  let ds=DIFF_SETTINGS[difficulty];
  setFont(10,"ui"); fill(col(ds.color)); textAlign(CENTER,TOP);
  text(ds.desc,CW/2,dy+30);
  diffBtns=[];
  let bw3=(cw-32-GAP*2)/3, bx3=cx+16, by3=dy+46, bh3=28;
  for (let i=0; i<3; i++) {
    let d=DIFF_SETTINGS[i], active=difficulty===i;
    let hov=mouseY>=by3&&mouseY<=by3+bh3&&mouseX>=bx3&&mouseX<=bx3+bw3;
    fill(active?col(d.color):col("bord")); noStroke(); rect(bx3-2,by3-2,bw3+4,bh3+4,4);
    fill(active?color(80,60,0):color(80,10,10)); noStroke(); rect(bx3,by3+3,bw3,bh3-1,2);
    let mf;
    if(active){if(i===0)mf=color(12,139,33);else if(i===1)mf=color(200,140,0);else mf=color(176,24,24);}
    else mf=hov?color(60,20,20):color(30,10,10);
    fill(mf); noStroke(); rect(bx3,by3,bw3,bh3-3,2);
    fill(active?col("white"):col("muted")); setFont(13,"display"); textAlign(CENTER,CENTER);
    if(active) outlineText(d.label,bx3+bw3/2,by3+bh3/2-1); else text(d.label,bx3+bw3/2,by3+bh3/2-1);
    diffBtns.push({x:bx3,y:by3,w:bw3,h:bh3,index:i});
    bx3+=bw3+GAP;
  }

  // START button
  let sbw=240, sbh=H_REVEAL, sbx=CW/2-sbw/2, sby=CH-PAD-sbh;
  let hov=startBtn?inBtn(mouseX,mouseY,startBtn):false;
  fill(col("amber")); noStroke(); rect(sbx-3,sby-3,sbw+6,sbh+6,4);
  fill(color(120,12,12)); noStroke(); rect(sbx,sby+4,sbw,sbh,2);
  fill(hov?col("redHi"):col("red")); noStroke(); rect(sbx,sby,sbw,sbh-4,2);
  fill(col("white")); setFont(24,"display"); textAlign(CENTER,CENTER);
  outlineText("START GAME",CW/2,sby+sbh/2-1);
  startBtn={x:sbx,y:sby,w:sbw,h:sbh};
}

// ═════════════════════════════════════════════════════════════════════════════
//  GAME OVER
// ═════════════════════════════════════════════════════════════════════════════
function drawGameOver() {
  loadHighScores();
  let isRecord = highScores.length === 0 || finalChips > highScores[0].chips;
  let chipColor = finalChips>=100?"green":finalChips>=50?"amber":"red";

  // ── Result card (compact, top half) ───────────────────────────────────────
  let cardW=CW-PAD*2, cardH=220, cardX=PAD, cardY=PAD+H_HEADER-10;
  drawCard(cardX,cardY,cardW,cardH);
  textAlign(CENTER,CENTER);
  let midX=CW/2, midY=cardY+cardH/2;

  // NEW RECORD banner
  if (isRecord && finalChips > 0) {
    setShadow("rgba(220,155,10,0.8)",16);
    fill(col("amber")); setFont(13,"display"); textAlign(CENTER,TOP);
    text("★  NEW RECORD  ★", midX, cardY+10);
    clearShadow();
  }

  fill(col("shadow")); setFont(62,"display"); textAlign(CENTER,CENTER);
  text("GAME OVER!",midX+3,midY-46);
  setShadow("rgba(210,35,45,0.5)",18); fill(col("red"));
  text("GAME OVER!",midX,midY-49); clearShadow();

  stroke(col("bord")); strokeWeight(1);
  line(cardX+24,midY-2,cardX+cardW-24,midY-2); noStroke();

  setFont(11,"ui"); fill(col("muted")); textAlign(CENTER,CENTER);
  text("FINAL CHIPS", midX, midY+16);
  fill(col(chipColor)); setFont(52,"display");
  text(finalChips, midX, midY+52);

  // Difficulty badge
  let ds = DIFF_SETTINGS[difficulty];
  setFont(11,"display"); fill(col(ds.color)); textAlign(CENTER,CENTER);
  text(ds.label + "  MODE", midX, midY+88);

  // ── Leaderboard card ────────────────────────────────────────────────────────
  let lbY = cardY + cardH + GAP;
  let lbH = 160;
  drawCard(cardX, lbY, cardW, lbH);

  // Title row
  setShadow("rgba(220,155,10,0.4)",8);
  fill(col("amber")); setFont(14,"display"); textAlign(CENTER,TOP);
  text("★  HIGH SCORES  ★", midX, lbY+10);
  clearShadow();

  // Column headers
  let col1=cardX+20, col2=cardX+cardW-130, col3=cardX+cardW-60;
  setFont(9,"ui"); fill(col("muted")); textAlign(LEFT,TOP);
  text("RANK  CHIPS", col1, lbY+30);
  textAlign(LEFT,TOP); text("MODE", col2, lbY+30);
  textAlign(LEFT,TOP); text("DATE", col3, lbY+30);

  stroke(col("bord",50)); strokeWeight(1);
  line(cardX+12, lbY+42, cardX+cardW-12, lbY+42); noStroke();

  // Rows
  let medals = ["🥇","🥈","🥉","④","⑤"];
  let rowY = lbY+48;
  for (let i=0; i<min(HS_MAX, max(highScores.length,1)); i++) {
    let entry = highScores[i];
    let isThisRun = entry && entry.chips===finalChips && i===0 && isRecord;
    let rowAlpha = entry ? 255 : 60;

    if (isThisRun) {
      // Highlight row
      fill(color(200,140,0,30)); noStroke();
      rect(cardX+10, rowY-2, cardW-20, 18, 2);
    }

    setFont(12,"display"); textAlign(LEFT,CENTER);
    fill(col("white",rowAlpha));
    text(medals[i], col1, rowY+7);

    if (entry) {
      let entryColor = entry.chips>=100?"green":entry.chips>=50?"amber":"red";
      fill(col(entryColor)); setFont(13,"display"); textAlign(LEFT,CENTER);
      text(entry.chips, col1+28, rowY+7);

      // Diff badge
      let dColor = entry.diff==="EASY"?"green":entry.diff==="NORMAL"?"amber":"red";
      fill(col(dColor,200)); setFont(9,"display"); textAlign(LEFT,CENTER);
      text(entry.diff, col2, rowY+7);

      fill(col("muted")); setFont(9,"ui"); textAlign(LEFT,CENTER);
      text(entry.date, col3, rowY+7);
    } else {
      fill(col("muted",60)); setFont(10,"ui"); textAlign(LEFT,CENTER);
      text("—", col1+28, rowY+7);
    }
    rowY += 20;
  }

  // ── Play Again button ────────────────────────────────────────────────────────
  let bw=220, bh=H_REVEAL, bx=CW/2-bw/2, by=lbY+lbH+GAP;
  let hov=playAgainBtn?inBtn(mouseX,mouseY,playAgainBtn):false;
  fill(col("amber")); noStroke(); rect(bx-3,by-3,bw+6,bh+6,4);
  fill(color(120,12,12)); noStroke(); rect(bx,by+4,bw,bh,2);
  fill(hov?col("redHi"):col("red")); noStroke(); rect(bx,by,bw,bh-4,2);
  fill(col("white")); setFont(24,"display"); textAlign(CENTER,CENTER);
  outlineText("PLAY AGAIN",CW/2,by+bh/2-1);
  playAgainBtn={x:bx,y:by,w:bw,h:bh};
}

// ═════════════════════════════════════════════════════════════════════════════
//  INPUT
// ═════════════════════════════════════════════════════════════════════════════
function mouseMoved()   { updateHover(); }
function mouseDragged() { updateHover(); }

function updateHover() {
  if(state==="SPLASH"||state==="GAME_OVER"||state==="ACT_TRANSITION"||state==="SHOP") return;
  revealHover = revealBtn ? inBtn(mouseX,mouseY,revealBtn) : false;
  answerHover = -1;
  if (state==="ANSWER") {
    for (let i=0; i<answerBtns.length; i++) {
      if(answerBtns[i]&&inBtn(mouseX,mouseY,answerBtns[i])){answerHover=i;break;}
    }
  }
}

function mousePressed() {
  if (state==="SPLASH") {
    for (let b of diffBtns) { if(inBtn(mouseX,mouseY,b)){difficulty=b.index;return;} }
    if(startBtn&&inBtn(mouseX,mouseY,startBtn)) fullReset();
    return;
  }
  if (state==="GAME_OVER") {
    if(playAgainBtn&&inBtn(mouseX,mouseY,playAgainBtn)) state="SPLASH";
    return;
  }
  if (state==="SHOP") {
    for (let b of shopBtns) {
      if (inBtn(mouseX,mouseY,b)) {
        if (b.key==="shield" && chips>=b.price && !hasStreakShield) {
          chips-=b.price; hasStreakShield=true;
        } else if (b.key==="surge" && chips>=b.price && !hasTimeSurge) {
          chips-=b.price; hasTimeSurge=true;
        }
        return;
      }
    }
    if(continueBtn&&inBtn(mouseX,mouseY,continueBtn)){
      act=2; actRound=1;
      state="ACT_TRANSITION"; transitionTimer=3000;
    }
    return;
  }
  if(state==="ACT_TRANSITION") return;
  updateHover();
  if(revealBtn&&!revealBtn.disabled&&inBtn(mouseX,mouseY,revealBtn)){startFlash();return;}
  if(state==="BET") {
    for(let b of chipBtns){
      if(inBtn(mouseX,mouseY,b)){
        if(b.isAll){currentBet=Math.abs(chips);allSelected=true;}
        else{currentBet=b.realVal;allSelected=false;}
        setLog("Hit REVEAL when ready.","muted"); return;
      }
    }
  }
  if(state==="ANSWER"){
    for(let b of answerBtns){
      if(inBtn(mouseX,mouseY,b)){handleAnswer(b.val);return;}
    }
  }
}

function inBtn(mx,my,b){ return mx>=b.x&&mx<=b.x+b.w&&my>=b.y&&my<=b.y+b.h; }

// ═════════════════════════════════════════════════════════════════════════════
//  GAME LOGIC
// ═════════════════════════════════════════════════════════════════════════════
function fullReset() {
  chips=50; streak=0; act=1; actRound=1; finalChips=0;
  hasStreakShield=false; hasTimeSurge=false; powerupFlash=null;
  startBtn=null; playAgainBtn=null; continueBtn=null; shopBtns=[];
  logMsg="Select a wager, then hit REVEAL."; logType="muted";
  CHIP_VALUES=[5,10,25,50,"ALL"];
  resetRound(); state="BET";
}

function startFlash() {
  if(currentBet<=0) return;
  lastBet=Math.abs(currentBet);
  chips-=lastBet;
  let diff=getDiff();

  // Time Surge: consume & double flash duration
  let surgeActive=false;
  if(hasTimeSurge){
    hasTimeSurge=false; surgeActive=true;
    triggerPowerupFlash("⚡  TIME SURGE!","amber");
  }

  if(act===1){
    flipType=floor(random(1,4));
    isMirrored=flipType===1||flipType===3;
    let margin=70, aw=CW-PAD*2;
    act1Pos={x:PAD+random(margin,aw-margin),y:Y_ARENA+random(margin,H_ARENA-margin)};
    let maxN=actRound<=2?9:99, minN=actRound<=2?1:10;
    correctAnswer=floor(random(minN,maxN+1));
    choices=generateChoicesAct1(correctAnswer,isMirrored);
  } else {
    isMirrored=false; sumNumbers=[]; numFlips=[];
    let diff2=getA2Diff();
    let maxEach=actRound<=2?9:actRound<=4?15:20;
    for(let i=0;i<diff2.count;i++){
      sumNumbers.push(floor(random(1,maxEach+1)));
      numFlips.push(random()<diff2.flipChance?floor(random(1,4)):0);
    }
    correctAnswer=sumNumbers.reduce((a,b)=>a+b,0);
    choices=generateChoicesAct2(correctAnswer);
    numPositions=generatePositions(diff2.count,diff2.scatter);
  }

  flashDuration=surgeActive?diff.ms*2:diff.ms;
  flashTimer=flashDuration;
  glitching=false; selectedAnswer=-1; state="FLASH";
  if(act===1){
    if(flipType===3)      setLog("MIRRORED + FLIPPED — trust nothing.","bad");
    else if(flipType===2) setLog("UPSIDE DOWN — stay sharp.","bad");
    else                  setLog("MIRRORED — trust nothing.","bad");
  } else setLog("Watch the numbers!","info");
}

function generatePositions(count,scatter){
  let aw=CW-PAD*2, positions=[];
  if(!scatter){
    let spacing=aw/(count+1);
    for(let i=0;i<count;i++) positions.push({x:spacing*(i+1),y:H_ARENA/2});
  } else {
    let margin=60, tries=0;
    while(positions.length<count&&tries++<300){
      let px=random(margin,aw-margin), py=random(margin,H_ARENA-margin);
      let ok=true;
      for(let p of positions){if(dist(px,py,p.x,p.y)<90){ok=false;break;}}
      if(ok) positions.push({x:px,y:py});
    }
  }
  return positions;
}

function endFlash(){
  state="ANSWER"; glitching=false; answerTimer=ANSWER_TIME;
  setLog(act===1?"Pick your answer!":"What was the sum?","info");
}

function handleAnswer(val){
  selectedAnswer=val;
  let diff=getDiff(), bet=lastBet;
  let correct = (act===1) ? val===correctAnswer : Math.abs(val-correctAnswer)===0;

  if(correct){
    let profit=floor(bet*diff.mult);
    chips+=bet+profit; streak++;
    setLog("+"+profit+" chips! "+(act===1?"Correct":"EXACT")+"!  (×"+diff.mult+")","good");
  } else {
    if(hasStreakShield){
      hasStreakShield=false;
      triggerPowerupFlash("🛡  STREAK SAVED!","cyan");
      setLog("-"+bet+" chips.  "+(act===1?"It was "+correctAnswer:"Sum was "+correctAnswer)+".  SHIELD USED!","info");
    } else {
      streak=0;
      setLog("-"+bet+" chips.  "+(act===1?"It was "+correctAnswer:"Sum was "+correctAnswer)+".","bad");
    }
  }
  if(chips<=0){chips=0;finalChips=0;setLog("BUST! You're out of chips.","bad");}
  state="RESULT"; resultTimer=2000;
}

function handleTimeout(){
  selectedAnswer=-1;
  if(hasStreakShield){
    hasStreakShield=false;
    triggerPowerupFlash("🛡  STREAK SAVED!","cyan");
    setLog("TIME'S UP!  -"+lastBet+" chips.  SHIELD USED!","info");
  } else {
    streak=0;
    setLog("TIME'S UP!  -"+lastBet+" chips.  It was "+correctAnswer+".","bad");
  }
  if(chips<=0){chips=0;finalChips=0;setLog("TIME'S UP! BUST — out of chips.","bad");}
  state="RESULT"; resultTimer=2000;
}

function nextRound(){
  if(chips<=0){finalChips=0;saveHighScore(0,DIFF_SETTINGS[difficulty].label);state="GAME_OVER";return;}
  let maxRounds=act===1?4:6;
  if(actRound>=maxRounds){
    if(act===1){
      // Route to Shop instead of direct transition
      state="SHOP"; shopBtns=[]; continueBtn=null;
      return;
    } else {
      finalChips=chips; saveHighScore(chips,DIFF_SETTINGS[difficulty].label); state="GAME_OVER"; return;
    }
  }
  actRound++;
  setLog("Select a wager to begin.","muted");
  resetRound();
}

function beginAct2(){
  act=2; actRound=1;
  resetRound();
}

function resetRound(){
  updateChipValues(); currentBet=0; lastBet=0; choices=[];
  selectedAnswer=-1; sumNumbers=[]; numPositions=[]; numFlips=[];
  flipType=0; allSelected=false; state="BET";
}

function generateChoicesAct1(correct,mirrored){
  let spread=DIFF_SETTINGS[difficulty].choiceSpread;
  let set=new Set([correct]);
  if(mirrored){
    let m=correct<10?mirrorDigit(correct):reverseNum(correct);
    if(m!==correct&&m>0) set.add(m);
  }
  let tries=0;
  while(set.size<4&&tries++<80){
    let d,r=random();
    if(r<0.4) d=correct+(random()>0.5?1:-1)*floor(random(1,spread+1));
    else if(r<0.7) d=reverseNum(correct);
    else d=floor(random(1,100));
    if(d>0&&d<=99&&d!==correct) set.add(d);
  }
  return shuffle([...set].slice(0,4));
}

function generateChoicesAct2(correct){
  let spread=DIFF_SETTINGS[difficulty].choiceSpread;
  let set=new Set([correct]);
  let tries=0;
  while(set.size<4&&tries++<100){
    let delta=floor(random(1,spread+1));
    let d=correct+(random()>0.5?1:-1)*delta;
    if(d>0&&d<=200) set.add(d);
  }
  return shuffle([...set].slice(0,4));
}

function mirrorDigit(n){
  let m={6:9,9:6,2:5,5:2,1:1,8:8,3:8,4:7,7:4};
  return m[n]!==undefined?m[n]:n>5?n-3:n+3;
}
function reverseNum(n){
  let rev=parseInt(String(n).split("").reverse().join(""));
  return !rev||rev<=0?n+1:rev;
}
function setLog(msg,type){ logMsg=msg; logType=type||"muted"; }
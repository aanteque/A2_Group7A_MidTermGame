// FUZZY BET - p5.js
// Layout matched to original HTML: padding=16, arena h=200, gap=16 between sections

let chips = 100, round = 1, streak = 0, currentBet = 0;
let correctAnswer = 0;
let state = 'BET';
let isMirrored = false;
let flashTimer = 0, flashDuration = 0;
let resultTimer = 0;
let choices = [];
let selectedAnswer = -1;
let logMsg = 'Select a wager, then hit REVEAL.';
let logType = 'muted';
let glitching = false;

const CHIP_VALUES = [5, 10, 25, 50, 'ALL'];
let chipBtns = [];
let answerBtns = [];
let revealBtn = null;
let revealHover = false;   // is mouse over reveal btn
let revealFill = 0;        // 0-1 animated fill progress
let answerHover = -1;      // index of hovered answer btn
let answerH = 36;          // animated height of answer section (collapsed=36, expanded=92)

const C = {
  bg:    [8,  10, 15],
  card:  [13, 16, 23],
  bord:  [26, 32, 48],
  red:   [255, 45,  74],
  amber: [255, 170,  0],
  cyan:  [0,  229, 255],
  green: [0,  255, 136],
  muted: [58,  69,  96],
  text:  [200, 212, 240],
  white: [238, 242, 255],
};

// ── Layout constants matching original HTML exactly ───────────────────────────
const PAD   = 20;   // wrapper padding
const GAP   = 16;   // gap between sections
const CW    = 520;  // canvas width

// Section heights (derived from original CSS)
const H_HEADER  = 100; // title ~64px + subtitle + breathing room
const H_STATS   =  62; // stat boxes: padding 10px top+bot + label 14px + value 32px
const H_ARENA   = 200; // original .arena height: 200px
const H_BET     = 100; // label + chip row + betting line, 16px padding each side
const H_ANSWER_COLLAPSED = 36;  // just the label
const H_ANSWER_EXPANDED  = 92;  // label + buttons
const H_LOG     =  24;
const H_REVEAL  =  52; // 14px padding top+bot + ~22px text

const CH = PAD
         + H_HEADER + GAP
         + H_STATS  + GAP
         + H_ARENA  + GAP
         + H_BET    + GAP
         + H_ANSWER_EXPANDED + GAP
         + H_LOG    + GAP
         + H_REVEAL
         + PAD;

// Compute Y positions for each section
const Y_HEADER = PAD;
const Y_STATS  = Y_HEADER + H_HEADER + GAP;
const Y_ARENA  = Y_STATS  + H_STATS  + GAP;
const Y_BET    = Y_ARENA  + H_ARENA  + GAP;
const Y_ANSWER = Y_BET    + H_BET    + GAP;
const Y_LOG    = Y_ANSWER + H_ANSWER_EXPANDED + GAP;
const Y_REVEAL = Y_LOG    + H_LOG    + GAP;

function col(key, a) {
  let c = C[key];
  return a !== undefined ? color(c[0], c[1], c[2], a) : color(c[0], c[1], c[2]);
}

function getDiff() {
  if (round <= 3)  return { ms: 1800, mirror: 0.00, label: 'EASY',    mult: 1.5 };
  if (round <= 6)  return { ms: 1200, mirror: 0.20, label: 'SHAKY',   mult: 2.0 };
  if (round <= 10) return { ms: 800,  mirror: 0.40, label: 'BLURRED', mult: 2.5 };
  if (round <= 15) return { ms: 500,  mirror: 0.60, label: 'FUZZY',   mult: 3.0 };
  return                   { ms: 300,  mirror: 0.75, label: 'CHAOS',   mult: 4.0 };
}

function setShadow(c, blur) {
  drawingContext.shadowColor = c;
  drawingContext.shadowBlur  = blur;
}
function clearShadow() {
  drawingContext.shadowColor = 'transparent';
  drawingContext.shadowBlur  = 0;
}

// ─── SETUP ────────────────────────────────────────────────────────────────────
function setup() {
  createCanvas(CW, CH);
  textFont("Share Tech Mono");
}

// setFont(size, 'display') = Bebas Neue  — titles, numbers, buttons
// setFont(size, 'ui')      = Share Tech Mono — labels, log, small text
function setFont(size, style) {
  textSize(size);
  if (style === 'display') {
    drawingContext.font = size + 'px "Bebas Neue", sans-serif';
  } else {
    drawingContext.font = size + 'px "Share Tech Mono", monospace';
  }
}

// ─── DRAW ─────────────────────────────────────────────────────────────────────
function draw() {
  background(col('bg'));
  drawScanlines();

  noStroke();
  fill(255, 45, 74, 8);  ellipse(100, 60, 500, 260);
  fill(0, 229, 255, 6);  ellipse(430, CH - 60, 400, 260);

  drawHeader();
  drawStats();
  drawArena();
  drawBetSection();
  drawAnswerSection();
  drawLog();
  drawRevealBtn();

  if (state === 'FLASH') {
    flashTimer -= deltaTime;
    if (flashTimer <= 0) endFlash();
    if (flashTimer < flashDuration * 0.3) glitching = true;
  }
  if (state === 'RESULT') {
    resultTimer -= deltaTime;
    if (resultTimer <= 0) nextRound();
  }

  // animate reveal button fill slide
  let targetFill = (revealHover && !revealBtn?.disabled) ? 1 : 0;
  revealFill += (targetFill - revealFill) * 0.15;

  // animate answer section height
  let targetH = (state === 'ANSWER' || state === 'RESULT') ? H_ANSWER_EXPANDED : H_ANSWER_COLLAPSED;
  answerH += (targetH - answerH) * 0.18;
}

function drawScanlines() {
  stroke(0, 0, 0, 28);
  strokeWeight(1);
  for (let y = 0; y < height; y += 4) line(0, y, width, y);
  noStroke();
}

// ─── HEADER ──────────────────────────────────────────────────────────────────
function drawHeader() {
  textAlign(CENTER, TOP);
  setFont(64, 'display'); // thin weight for title
  setShadow('rgba(255,45,74,0.2)', 80); fill(col('white')); text('F U Z Z Y  B E T', CW / 2, Y_HEADER);
  setShadow('rgba(255,45,74,0.4)', 40);                     text('F U Z Z Y  B E T', CW / 2, Y_HEADER);
  setShadow('rgba(255,45,74,0.8)', 20);                     text('F U Z Z Y  B E T', CW / 2, Y_HEADER);
  clearShadow();                        fill(col('white')); text('F U Z Z Y  B E T', CW / 2, Y_HEADER);

  setFont(18, 'ui');
  fill(col('muted'));
  text("A game about numbers you can't trust", CW / 2, Y_HEADER + 72);
}

// ─── STATS ────────────────────────────────────────────────────────────────────
function drawStats() {
  let labels = ['CHIPS', 'ROUND', 'STREAK'];
  let values = [chips, round, streak];
  let tints  = ['amber', 'cyan', 'green'];
  let cw = (CW - PAD * 2 - GAP * 2) / 3; // 3 equal cols with gaps
  for (let i = 0; i < 3; i++) {
    let x = PAD + i * (cw + GAP);
    drawCard(x, Y_STATS, cw, H_STATS);
    // label
    fill(col('muted')); setFont(9, 'ui'); textAlign(CENTER, TOP);
    text(labels[i], x + cw / 2, Y_STATS + 10);
    let tc = C[tints[i]];
    setShadow(`rgba(${tc[0]},${tc[1]},${tc[2]},0.55)`, 16);
    fill(col(tints[i])); setFont(28, 'display'); textAlign(CENTER, TOP);
    text(values[i], x + cw / 2, Y_STATS + 26);
    clearShadow();
  }
}

// ─── ARENA ────────────────────────────────────────────────────────────────────
function drawArena() {
  let ax = PAD, aw = CW - PAD * 2;
  drawCard(ax, Y_ARENA, aw, H_ARENA);
  let diff = getDiff();

  fill(col('muted')); setFont(9, 'ui'); textAlign(LEFT, TOP);
  text('RND ' + round, ax + 12, Y_ARENA + 12);
  textAlign(RIGHT, TOP); fill(col('amber')); setFont(14, 'display');
  text('\xd7' + diff.mult, ax + aw - 12, Y_ARENA + 11);
  clearShadow();
  fill(col('muted')); setFont(9, 'ui'); textAlign(RIGHT, BOTTOM);
  text(diff.label, ax + aw - 12, Y_ARENA + H_ARENA - 10);

  if (state === 'BET') {
    fill(col('muted')); setFont(13, 'ui'); textAlign(CENTER, CENTER);
    text('Place your bet,\nthen reveal the number.', ax + aw / 2, Y_ARENA + H_ARENA / 2);
  }
  if (state === 'ANSWER' || state === 'RESULT') {
    fill(col('muted')); setFont(13, 'ui'); textAlign(CENTER, CENTER);
    text('What did you see?', ax + aw / 2, Y_ARENA + H_ARENA / 2);
  }

  // flashing number
  if (state === 'FLASH') {
    let cx = ax + aw / 2;
    let cy = Y_ARENA + H_ARENA / 2 + 8;
    let fadeA = map(flashTimer, 0, flashDuration * 0.15, 0, 255);
    fadeA = constrain(fadeA, 0, 255);
    let a01 = fadeA / 255;
    let ox = 0, oy = 0;
    if (glitching && frameCount % 3 === 0) { ox = random(-5, 5); oy = random(-2, 2); }

    push();
    translate(cx + ox, cy + oy);
    if (isMirrored) scale(-1, 1);

    let gr = isMirrored ? '255,45,74' : '255,255,255';
    let gc = isMirrored ? '255,45,74' : '0,229,255';
    // glow layers matching original: 0 0 30px 0.6white, 0 0 60px 0.3cyan
    setShadow(`rgba(${gr},${(a01*0.6).toFixed(2)})`, 30);
    fill(isMirrored ? col('red', fadeA) : col('white', fadeA));
    setFont(120, 'display'); textAlign(CENTER, CENTER);
    text(correctAnswer, 0, 0);
    setShadow(`rgba(${gc},${(a01*0.3).toFixed(2)})`, 60);
    text(correctAnswer, 0, 0);
    clearShadow();
    text(correctAnswer, 0, 0);
    pop();

    // timer bar with glow
    let pct = constrain(flashTimer / flashDuration, 0, 1);
    let barRgb = pct < 0.3 ? '255,45,74' : '0,229,255';
    let bc = pct < 0.3 ? col('red') : col('cyan');
    setShadow(`rgba(${barRgb},0.8)`, 8);
    fill(bc); noStroke();
    rect(ax, Y_ARENA + H_ARENA - 3, aw * pct, 3);
    clearShadow();
  }
}

// ─── BET SECTION ─────────────────────────────────────────────────────────────
function drawBetSection() {
  let x = PAD, w = CW - PAD * 2;
  drawCard(x, Y_BET, w, H_BET);

  // "Wager" label
  fill(col('muted')); setFont(9, 'ui'); textAlign(LEFT, TOP);
  text('WAGER', x + 16, Y_BET + 12);

  // chip buttons — spread evenly with 8px gap
  chipBtns = [];
  let bh = 30, gap = 8;
  let bw = (w - 32 - gap * (CHIP_VALUES.length - 1)) / CHIP_VALUES.length;
  let bx = x + 16;
  let by = Y_BET + 28;
  for (let i = 0; i < CHIP_VALUES.length; i++) {
    let val = CHIP_VALUES[i];
    let realVal = val === 'ALL' ? chips : val;
    let active   = (currentBet === realVal && realVal > 0 && state === 'BET');
    let disabled = (state !== 'BET');
    chipBtns.push({ x: bx, y: by, w: bw, h: bh, realVal });
    drawChipBtn(bx, by, bw, bh, String(val), active, disabled);
    bx += bw + gap;
  }

  // "Betting: X" line
  fill(col('muted')); setFont(9, 'ui'); textAlign(LEFT, TOP);
  text('BETTING:', x + 16, Y_BET + 68);
  setShadow('rgba(255,170,0,0.5)', 10);
  fill(col('amber')); setFont(22, 'display'); textAlign(LEFT, TOP);
  text(currentBet || '-', x + 78, Y_BET + 64);
  clearShadow();
}

function drawChipBtn(x, y, w, h, label, active, disabled) {
  let bc = disabled ? col('bord') : active ? col('amber') : col('muted');
  if (active) setShadow('rgba(255,170,0,0.3)', 10);
  noFill(); stroke(bc); strokeWeight(1); rect(x, y, w, h);
  clearShadow();
  if (active) { fill(255, 170, 0, 38); noStroke(); rect(x, y, w, h); }
  noStroke(); fill(bc);
  setFont(12, 'ui'); textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2 + 1);
}

// ─── ANSWER SECTION ──────────────────────────────────────────────────────────
function drawAnswerSection() {
  let x = PAD, w = CW - PAD * 2;
  drawCard(x, Y_ANSWER, w, answerH);

  fill(col('muted')); setFont(10, 'ui'); textAlign(LEFT, TOP);
  text(
    isMirrored ? 'IT WAS MIRRORED \u2014 WHAT WAS THE REAL NUMBER?' : 'WHAT NUMBER DID YOU SEE?',
    x + 16, Y_ANSWER + 12
  );

  answerBtns = [];
  let gap = 8;
  let bw = (w - 32 - gap * 3) / 4;
  let bh = 52;
  let bx = x + 16;
  let by = Y_ANSWER + 28;

  // fade buttons in as section expands
  let btnAlpha = map(answerH, H_ANSWER_COLLAPSED, H_ANSWER_EXPANDED, 0, 255);
  btnAlpha = constrain(btnAlpha, 0, 255);

  for (let i = 0; i < 4; i++) {
    let val = choices[i] !== undefined ? choices[i] : null;
    let btnState = 'idle';
    if (state === 'RESULT' && val !== null) {
      if (val === correctAnswer)       btnState = 'correct';
      else if (val === selectedAnswer) btnState = 'wrong';
    }
    let hovered = (answerHover === i && state === 'ANSWER');
    answerBtns.push({ x: bx, y: by, w: bw, h: bh, val });
    if (val !== null && btnAlpha > 10) {
      drawAnswerBtn(bx, by, bw, bh, val, btnState, hovered, btnAlpha);
    }
    bx += bw + gap;
  }
}

function drawAnswerBtn(x, y, w, h, val, btnState, hovered, alpha) {
  if (alpha === undefined) alpha = 255;
  let a = alpha / 255;
  let bc = btnState === 'correct' ? col('green', alpha)
         : btnState === 'wrong'   ? col('red',   alpha)
         : hovered                ? col('cyan',  alpha)
                                  : col('bord',  alpha);
  let glowRgb = btnState === 'correct' ? '0,255,136'
              : btnState === 'wrong'   ? '255,45,74'
              : hovered                ? '0,229,255' : null;
  if (glowRgb) setShadow(`rgba(${glowRgb},${(0.45*a).toFixed(2)})`, hovered ? 15 : 18);
  noFill(); stroke(bc); strokeWeight(1); rect(x, y, w, h);
  clearShadow();
  if (hovered) { fill(0, 229, 255, 13 * a); noStroke(); rect(x, y, w, h); }
  else if (btnState !== 'idle') { fill(red(bc), green(bc), blue(bc), 26 * a); noStroke(); rect(x, y, w, h); }
  noStroke();
  let tc = hovered ? col('cyan', alpha) : btnState === 'idle' ? col('text', alpha) : col(btnState === 'correct' ? 'green' : 'red', alpha);
  fill(tc);
  setFont(28, 'display'); textAlign(CENTER, CENTER);
  text(val, x + w / 2, y + h / 2 + 2);
}

// ─── LOG ─────────────────────────────────────────────────────────────────────
function drawLog() {
  let tints = { muted: 'muted', good: 'green', bad: 'red', info: 'cyan' };
  let key = tints[logType] || 'muted';
  let tc = C[key];
  if (logType !== 'muted') setShadow(`rgba(${tc[0]},${tc[1]},${tc[2]},0.45)`, 10);
  fill(col(key));
  setFont(11, 'ui'); textAlign(CENTER, CENTER);
  text(logMsg, CW / 2, Y_LOG + H_LOG / 2);
  clearShadow();
}

// ─── REVEAL BUTTON ───────────────────────────────────────────────────────────
function drawRevealBtn() {
  let x = PAD, w = CW - PAD * 2, h = H_REVEAL;
  let disabled = (state !== 'BET' || currentBet === 0);

  // border + dark base
  let borderCol = disabled ? color(120, 20, 35) : col('red');
  if (!disabled) setShadow('rgba(255,45,74,0.35)', 14);
  noFill(); stroke(borderCol); strokeWeight(1); rect(x, Y_REVEAL, w, h);
  clearShadow();

  // dark red base fill always visible
  fill(disabled ? color(60, 10, 18) : color(30, 5, 10));
  noStroke(); rect(x, Y_REVEAL, w, h);

  // sliding red fill from left (only when active)
  if (!disabled && revealFill > 0.001) {
    fill(col('red'));
    noStroke();
    // clip to button bounds manually
    let fillW = w * revealFill;
    rect(x, Y_REVEAL, fillW, h);
  }

  // text: dark bg colour when filled, red when not
  let textFilled = !disabled && revealFill > 0.5;
  noStroke();
  fill(disabled ? color(120, 20, 35) : textFilled ? col('bg') : col('red'));
  setFont(22, 'display'); textAlign(CENTER, CENTER);
  text('REVEAL', x + w / 2, Y_REVEAL + h / 2 + 1);
  revealBtn = { x, y: Y_REVEAL, w, h, disabled };
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
function drawCard(x, y, w, h) {
  fill(col('card')); stroke(col('bord')); strokeWeight(1);
  rect(x, y, w, h);
  noStroke();
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
function mouseMoved() { updateHover(); }
function mouseDragged() { updateHover(); }

function updateHover() {
  revealHover = revealBtn ? inBtn(mouseX, mouseY, revealBtn) : false;
  answerHover = -1;
  if (state === 'ANSWER') {
    for (let i = 0; i < answerBtns.length; i++) {
      if (answerBtns[i] && inBtn(mouseX, mouseY, answerBtns[i])) { answerHover = i; break; }
    }
  }
}

function mousePressed() {
  updateHover();
  if (revealBtn && !revealBtn.disabled && inBtn(mouseX, mouseY, revealBtn)) {
    startFlash(); return;
  }
  if (state === 'BET') {
    for (let b of chipBtns) {
      if (inBtn(mouseX, mouseY, b)) {
        let v = min(b.realVal, chips);
        if (v <= 0) return;
        currentBet = v;
        setLog('Wagering ' + currentBet + ' chips. Hit REVEAL.', 'info');
        return;
      }
    }
  }
  if (state === 'ANSWER') {
    for (let b of answerBtns) {
      if (inBtn(mouseX, mouseY, b)) { handleAnswer(b.val); return; }
    }
  }
}

function inBtn(mx, my, b) {
  return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
}

// ─── GAME LOGIC ──────────────────────────────────────────────────────────────
function startFlash() {
  let diff = getDiff();
  isMirrored    = random() < diff.mirror;
  let maxN      = round <= 5 ? 9 : 99;
  let minN      = round <= 5 ? 1 : 10;
  correctAnswer = floor(random(minN, maxN + 1));
  choices       = generateChoices(correctAnswer, isMirrored);
  flashDuration = diff.ms;
  flashTimer    = diff.ms;
  glitching     = false;
  selectedAnswer = -1;
  state = 'FLASH';
  setLog(isMirrored ? 'MIRRORED \u2014 trust nothing.' : 'Focus...', isMirrored ? 'bad' : 'info');
}

function endFlash() {
  state = 'ANSWER';
  glitching = false;
  setLog('Pick your answer!', 'info');
}

function handleAnswer(val) {
  selectedAnswer = val;
  let diff = getDiff();
  if (val === correctAnswer) {
    let win = floor(currentBet * diff.mult);
    chips += win;
    streak++;
    setLog('+' + win + ' chips! Correct!  (\xd7' + diff.mult + ')', 'good');
  } else {
    chips -= currentBet;
    streak = 0;
    setLog('-' + currentBet + ' chips.  It was ' + correctAnswer + '.', 'bad');
  }
  state = 'RESULT';
  resultTimer = 1800;
}

function nextRound() {
  if (chips <= 0) {
    chips = 100; round = 1; streak = 0;
    setLog('BUST! Back to 100 chips.', 'bad');
  } else {
    round++;
    setLog('Select a wager to begin.', 'muted');
  }
  currentBet = 0; choices = []; selectedAnswer = -1;
  state = 'BET';
}

function generateChoices(correct, mirrored) {
  let set = new Set([correct]);
  if (mirrored) {
    let m = correct < 10 ? mirrorDigit(correct) : reverseNum(correct);
    if (m !== correct && m > 0) set.add(m);
  }
  let tries = 0;
  while (set.size < 4 && tries++ < 60) {
    let d, r = random();
    if      (r < 0.4) d = correct + (random() > 0.5 ? 1 : -1) * floor(random(1, 6));
    else if (r < 0.7) d = reverseNum(correct);
    else              d = floor(random(1, 100));
    if (d > 0 && d <= 99 && d !== correct) set.add(d);
  }
  return shuffle([...set].slice(0, 4));
}

function mirrorDigit(n) {
  let m = { 6:9, 9:6, 2:5, 5:2, 1:1, 8:8, 3:8, 4:7, 7:4 };
  return m[n] !== undefined ? m[n] : (n > 5 ? n - 3 : n + 3);
}

function reverseNum(n) {
  let rev = parseInt(String(n).split('').reverse().join(''));
  return (!rev || rev <= 0) ? n + 1 : rev;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function setLog(msg, type) { logMsg = msg; logType = type || 'muted'; }
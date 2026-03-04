// FUZZY BET - p5.js

let chips = 100, round = 1, streak = 0, currentBet = 0;
let correctAnswer = 0;
let state = 'BET'; // BET | FLASH | ANSWER | RESULT
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

function setup() {
  createCanvas(520, 680);
  textFont('monospace');
}

function draw() {
  background(col('bg'));
  drawScanlines();

  noStroke();
  fill(255, 45, 74, 9);  ellipse(100, 60,  500, 280);
  fill(0, 229, 255,  7); ellipse(430, 630, 400, 280);

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
}

function drawScanlines() {
  stroke(0, 0, 0, 28);
  strokeWeight(1);
  for (let y = 0; y < height; y += 4) line(0, y, width, y);
  noStroke();
}

function drawHeader() {
  textAlign(CENTER, TOP);
  for (let i = 3; i >= 1; i--) {
    fill(255, 45, 74, i * 16);
    textSize(62 + i * 5);
    textStyle(BOLD);
    text('FUZZY BET', width / 2, 18);
  }
  fill(col('white'));
  textSize(62);
  textStyle(BOLD);
  text('FUZZY BET', width / 2, 18);
  textStyle(NORMAL);
  fill(col('muted'));
  textSize(9);
  text("A GAME ABOUT NUMBERS YOU CAN'T TRUST", width / 2, 88);
}

function drawStats() {
  let y = 110, h = 54;
  let labels = ['CHIPS', 'ROUND', 'STREAK'];
  let values = [chips, round, streak];
  let tints  = ['amber', 'cyan', 'green'];
  let cw = (width - 48) / 3;
  for (let i = 0; i < 3; i++) {
    let x = 16 + i * (cw + 8);
    drawCard(x, y, cw, h);
    fill(col('muted')); textSize(9); textStyle(NORMAL); textAlign(CENTER, TOP);
    text(labels[i], x + cw / 2, y + 8);
    fill(col(tints[i])); textSize(26); textStyle(BOLD); textAlign(CENTER, TOP);
    text(values[i], x + cw / 2, y + 22);
  }
}

function drawArena() {
  let ax = 16, ay = 176, aw = width - 32, ah = 168;
  drawCard(ax, ay, aw, ah);
  let diff = getDiff();

  fill(col('muted')); textSize(9); textStyle(NORMAL); textAlign(LEFT, TOP);
  text('RND ' + round, ax + 10, ay + 10);
  textAlign(RIGHT, TOP);
  fill(col('amber'));
  text('\xd7' + diff.mult + '   ' + diff.label, ax + aw - 10, ay + 10);

  if (state === 'BET') {
    fill(col('muted')); textSize(11); textStyle(NORMAL); textAlign(CENTER, CENTER);
    text('PLACE BET  \u2014  THEN HIT REVEAL', ax + aw / 2, ay + ah / 2);
  }
  if (state === 'ANSWER' || state === 'RESULT') {
    fill(col('muted')); textSize(11); textStyle(NORMAL); textAlign(CENTER, CENTER);
    text('WHAT DID YOU SEE?', ax + aw / 2, ay + ah / 2);
  }

  if (state === 'FLASH') {
    let cx = ax + aw / 2;
    let cy = ay + ah / 2 + 12;
    let fadeA = map(flashTimer, 0, flashDuration * 0.15, 0, 255);
    fadeA = constrain(fadeA, 0, 255);
    let ox = 0, oy = 0;
    if (glitching && frameCount % 3 === 0) { ox = random(-5, 5); oy = random(-2, 2); }

    push();
    translate(cx + ox, cy + oy);
    if (isMirrored) scale(-1, 1);
    let gc = isMirrored ? col('red') : col('cyan');
    for (let g = 3; g >= 1; g--) {
      fill(red(gc), green(gc), blue(gc), fadeA * 0.12);
      textSize(108 + g * 10); textStyle(BOLD); textAlign(CENTER, CENTER);
      text(correctAnswer, 0, 0);
    }
    let fc = isMirrored ? col('red', fadeA) : col('white', fadeA);
    fill(fc); textSize(108); textStyle(BOLD); textAlign(CENTER, CENTER);
    text(correctAnswer, 0, 0);
    pop();

    let pct = constrain(flashTimer / flashDuration, 0, 1);
    let bc = pct < 0.3 ? col('red') : col('cyan');
    noStroke();
    fill(red(bc), green(bc), blue(bc), 45);
    rect(ax, ay + ah - 6, aw * pct, 6);
    fill(bc);
    rect(ax, ay + ah - 3, aw * pct, 3);
  }
}

function drawBetSection() {
  let x = 16, y = 356, w = width - 32, h = 90;
  drawCard(x, y, w, h);
  fill(col('muted')); textSize(9); textStyle(NORMAL); textAlign(LEFT, TOP);
  text('WAGER', x + 14, y + 10);

  chipBtns = [];
  let bw = 62, bh = 28, gap = 8;
  let totalW = CHIP_VALUES.length * (bw + gap) - gap;
  let bx = x + (w - totalW) / 2;
  let by = y + 26;
  for (let i = 0; i < CHIP_VALUES.length; i++) {
    let val = CHIP_VALUES[i];
    let realVal = val === 'ALL' ? chips : val;
    let active = (currentBet === realVal && realVal > 0 && state === 'BET');
    let disabled = (state !== 'BET');
    chipBtns.push({ x: bx, y: by, w: bw, h: bh, realVal });
    drawChipBtn(bx, by, bw, bh, String(val), active, disabled);
    bx += bw + gap;
  }

  fill(col('muted')); textSize(9); textStyle(NORMAL); textAlign(LEFT, BOTTOM);
  text('BETTING:', x + 14, y + h - 10);
  fill(col('amber')); textSize(22); textStyle(BOLD); textAlign(LEFT, BOTTOM);
  text(currentBet || '-', x + 82, y + h - 7);
}

function drawChipBtn(x, y, w, h, label, active, disabled) {
  let bc = disabled ? col('bord') : active ? col('amber') : col('muted');
  noFill(); stroke(bc); strokeWeight(1);
  rect(x, y, w, h);
  if (active) { fill(255, 170, 0, 35); noStroke(); rect(x, y, w, h); }
  noStroke(); fill(bc);
  textSize(11); textStyle(NORMAL); textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2 + 1);
}

function drawAnswerSection() {
  let x = 16, y = 458, w = width - 32, h = 92;
  drawCard(x, y, w, h);
  fill(col('muted')); textSize(9); textStyle(NORMAL); textAlign(LEFT, TOP);
  text(
    isMirrored ? 'IT WAS MIRRORED \u2014 WHAT WAS THE REAL NUMBER?' : 'WHAT NUMBER DID YOU SEE?',
    x + 14, y + 10
  );

  answerBtns = [];
  if (state === 'ANSWER' || state === 'RESULT') {
    let bw = (w - 40) / 4, bh = 50, gap = 8;
    let bx = x + 12, by = y + 28;
    for (let i = 0; i < choices.length; i++) {
      let val = choices[i];
      let btnState = 'idle';
      if (state === 'RESULT') {
        if (val === correctAnswer)       btnState = 'correct';
        else if (val === selectedAnswer) btnState = 'wrong';
      }
      answerBtns.push({ x: bx, y: by, w: bw, h: bh, val });
      drawAnswerBtn(bx, by, bw, bh, val, btnState);
      bx += bw + gap;
    }
  }
}

function drawAnswerBtn(x, y, w, h, val, btnState) {
  let bc = btnState === 'correct' ? col('green')
         : btnState === 'wrong'   ? col('red')
                                  : col('bord');
  noFill(); stroke(bc); strokeWeight(1);
  rect(x, y, w, h);
  if (btnState !== 'idle') { fill(red(bc), green(bc), blue(bc), 30); noStroke(); rect(x, y, w, h); }
  noStroke();
  fill(btnState === 'idle' ? col('text') : bc);
  textSize(26); textStyle(BOLD); textAlign(CENTER, CENTER);
  text(val, x + w / 2, y + h / 2 + 2);
}

function drawLog() {
  let tints = { muted: 'muted', good: 'green', bad: 'red', info: 'cyan' };
  fill(col(tints[logType] || 'muted'));
  textSize(10); textStyle(NORMAL); textAlign(CENTER, TOP);
  text(logMsg, width / 2, 562);
}

function drawRevealBtn() {
  let x = 16, y = 582, w = width - 32, h = 46;
  let disabled = (state !== 'BET' || currentBet === 0);
  let bc = disabled ? col('bord') : col('red');
  noFill(); stroke(bc); strokeWeight(1);
  rect(x, y, w, h);
  if (!disabled) { fill(255, 45, 74, 20); noStroke(); rect(x, y, w, h); }
  noStroke(); fill(bc);
  textSize(18); textStyle(BOLD); textAlign(CENTER, CENTER);
  text('REVEAL', x + w / 2, y + h / 2 + 1);
  revealBtn = { x, y, w, h, disabled };
}

function drawCard(x, y, w, h) {
  fill(col('card')); stroke(col('bord')); strokeWeight(1);
  rect(x, y, w, h);
  noStroke();
}

function mousePressed() {
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

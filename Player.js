class Player {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.r = 10;

    // wobble visuals
    this.t = 0;
    this.s = speed ?? 3;
    this.wobble = 7;
    this.points = 48;
    this.wobbleFreq = 0.9;

    // colour
    this.rC = 255;
    this.gC = 255;
    this.bC = 255;
  }



  updateInput() {
    const dx =
      (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) -
      (keyIsDown(LEFT_ARROW) || keyIsDown(65));

    const dy =
      (keyIsDown(DOWN_ARROW) || keyIsDown(83)) -
      (keyIsDown(UP_ARROW) || keyIsDown(87));

    const len = max(1, abs(dx) + abs(dy));
    this.x += (dx / len) * this.s;
    this.y += (dy / len) * this.s;
  }


  draw() {
    this.t += 0.02;
    fill(player.rC, player.gC, player.bC);
    noStroke();
    beginShape();
    for (let i = 0; i < this.points; i++) {
      const a = (i / this.points) * TAU;
      const n = noise(
        cos(a) * this.wobbleFreq + 100,
        sin(a) * this.wobbleFreq + 100,
        this.t,
      );
      const rr = this.r + map(n, 0, 1, -this.wobble, this.wobble);
      vertex(this.x + cos(a) * rr, this.y + sin(a) * rr);
    }
    endShape(CLOSE);
  }
}

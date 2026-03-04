class WorldLevel {
  constructor(json) {
    this.schemaVersion = json.schemaVersion ?? 1;

    this.w = json.world?.w ?? 1200;
    this.h = json.world?.h ?? 800;
    this.bg = json.world?.bg ?? [235, 235, 235];
    this.gridStep = json.world?.gridStep ?? 160;

    this.obstacles = json.obstacles ?? [];

    // NEW: camera tuning knob from JSON (data-driven)
    this.camLerp = json.camera?.lerp ?? 0.12;
  }

  obstacleInteraction(player) {
    for (const o of this.obstacles) {

      if (player.x > o.x && player.x < o.x + o.w && player.y > o.y && player.y < o.y + o.h) {
        player.r++;
        player.gC--;
        player.bC--;
        player.s = 10;
        player.wobbleFreq++;
        player.wobble++;

      if (player.gC <= 0 && player.bC <= 0 && player.rC > 141) {
        player.rC -= 1; 
      }

      }
    }
  }

  drawBackground() {
    background(0);
  }

  drawWorld() {
    noStroke();
    fill(this.bg[0], this.bg[1], this.bg[2]);
    rect(0, 0, this.w, this.h);

    stroke(245);
    for (let x = 0; x <= this.w; x += this.gridStep) line(x, 0, x, this.h);
    for (let y = 0; y <= this.h; y += this.gridStep) line(0, y, this.w, y);

    noStroke();
    fill(170, 190, 210);
    for (const o of this.obstacles) image(enemyIMG, o.x, o.y, o.w, o.h, o.r ?? 0);

  }

  drawHUD(player, camX, camY) {
    noStroke();
    textSize(10);
    fill(250);
    text("Sad Lonely Little Blob - Press r to reset once the anxiety consumes you", 12, 20);

    //text(
      //"camLerp(JSON): " +
        //this.camLerp +
        //"  Player: " +
        //(player.x | 0) +
        //"," +
        //(player.y | 0) +
        //"  Cam: " +
        //(camX | 0) +
        //"," +
        //(camY | 0),
      //12,
      //40,
    //);
    fill(0);

    if (player.r >= 500) {
      fill(255, 40, 0);
      textSize(50);
      stroke(255, 255, 255);
      strokeWeight(2);
      text("you are consumed by anxiety", 80, 250);
    }
  }
}

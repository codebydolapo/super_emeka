import {
  BOSS_ATTACK_INTERVAL_SECONDS,
  BOSS_PROJECTILE_SPEED,
  COLORS,
  FIXED_DT,
  MAX_HEALTH,
  THROW_COOLDOWN_SECONDS,
  TILE_SIZE,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from "./constants";
import { EndSummary, GamePhase, HudState, StageBanner } from "../types";
import { BLOCK_TILES, blockContentForIndex, createLevel, isSolidTile, LevelData } from "./Level";
import { aabbOverlap } from "./Physics";
import { Player } from "./Player";
import { Camera } from "./Camera";
import { InputController } from "./Input";
import { Enemy, FloatingCoin, Pickup, Projectile, tileCenter } from "./Entities";
import { drawBackground, drawRoadStrip } from "./Background";
import { GOAL_ARROW, QUESTION_GLYPH, drawMonoGlyph, drawSprite } from "./Sprites";
import { AudioManager } from "../audio/AudioManager";
import { getHighScore, setHighScoreIfBetter } from "../utils/storage";

interface ScorePopup {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
}

export interface GameEngineCallbacks {
  onHud: (hud: HudState) => void;
  onEnd: (phase: "gameover" | "levelclear", summary: EndSummary) => void;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private level: LevelData;
  private player: Player;
  private camera = new Camera();
  private input = new InputController();
  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];
  private coins: FloatingCoin[] = [];
  private projectiles: Projectile[] = [];
  private popups: ScorePopup[] = [];

  private naira = 0;
  private score = 0;
  private timeLeft = 0;
  private highScore = 0;
  private phase: GamePhase = "playing";
  // A short trailing history of verified-safe grounded positions, sampled
  // periodically, instead of a single point updated every grounded frame.
  // The old approach saved the checkpoint at literally the last tile the
  // player stood on — including the one right before they walked into a
  // gap or an enemy — so dying there respawned them right back at the
  // edge of the same hazard with zero reaction time. Looking a fixed
  // distance back through this history guarantees actual breathing room,
  // while still only ever landing on ground the player already stood on
  // safely (never mid-air over a hazard).
  private checkpointHistory: { x: number; y: number }[] = [];
  private checkpointSampleTimer = 0;
  private static readonly CHECKPOINT_SAMPLE_INTERVAL = 0.1; // seconds between samples
  private static readonly CHECKPOINT_MAX_SAMPLES = 30; // ~3s of lookback, comfortably more than needed
  private static readonly CHECKPOINT_BUFFER_PX = 48; // ~3 tiles of breathing room on respawn
  private globalTime = 0;
  private timeAccumForSeconds = 0;
  private throwCooldown = 0;
  private bossAttackTimer = BOSS_ATTACK_INTERVAL_SECONDS;
  private banner: StageBanner | null = null;
  private transitioning = false;
  private transitionTimer = 0;

  private running = false;
  private raf = 0;
  private lastTime = 0;
  private accumulator = 0;
  private endedAlready = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private audio: AudioManager,
    private callbacks: GameEngineCallbacks
  ) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;

    this.level = createLevel(1);
    this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
    this.checkpointHistory = [{ x: this.player.x, y: this.player.y }];
    this.timeLeft = this.level.timeLimitSeconds;
    this.highScore = getHighScore();

    this.spawnEntitiesFromLevel();
  }

  private spawnEntitiesFromLevel() {
    for (const spawn of this.level.entities) {
      const worldX = spawn.col * TILE_SIZE;
      if (
        spawn.kind === "hawker" ||
        spawn.kind === "agbero" ||
        spawn.kind === "okada" ||
        spawn.kind === "boss"
      ) {
        // Ground-based enemies: `row` is the tile they occupy, so their
        // feet line up with the bottom of that tile.
        const feetY = (spawn.row + 1) * TILE_SIZE;
        this.enemies.push(
          new Enemy(spawn.kind, worldX, feetY, this.level.enemySpeedMultiplier)
        );
      } else if (spawn.kind === "mosquito") {
        // Flying enemies hover around a center point instead of standing
        // on a tile, so `row`/`col` describe the center of their tile.
        const centerX = worldX + TILE_SIZE / 2;
        const centerY = spawn.row * TILE_SIZE + TILE_SIZE / 2;
        this.enemies.push(
          new Enemy(spawn.kind, centerX, centerY, this.level.enemySpeedMultiplier)
        );
      } else if (spawn.kind === "coin") {
        // Floating collectibles are centered inside the authored tile
        // instead of hanging off its bottom edge.
        const coin = new FloatingCoin(worldX, spawn.row * TILE_SIZE);
        coin.x += (TILE_SIZE - coin.bounds.width) / 2;
        coin.y += (TILE_SIZE - coin.bounds.height) / 2;
        coin.baseY = coin.y;
        this.coins.push(coin);
      } else if (spawn.kind === "suya" || spawn.kind === "zobo") {
        const pickup = new Pickup(spawn.kind, worldX, spawn.row * TILE_SIZE);
        pickup.x += (TILE_SIZE - pickup.width) / 2;
        pickup.y += (TILE_SIZE - pickup.height) / 2;
        this.pickups.push(pickup);
      }
    }
  }

  start() {
    this.input.attach();
    this.running = true;
    this.lastTime = performance.now();
    this.audio.startMusic();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
    this.input.detach();
    cancelAnimationFrame(this.raf);
    this.audio.stopMusic();
  }

  pause() {
    if (this.phase === "playing") this.phase = "paused";
  }

  resume() {
    if (this.phase === "paused") {
      this.phase = "playing";
      this.lastTime = performance.now();
    }
  }

  get currentPhase() {
    return this.phase;
  }

  private loop = (t: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    let dt = (t - this.lastTime) / 1000;
    this.lastTime = t;
    dt = Math.min(dt, 0.05);
    this.accumulator += dt;

    while (this.accumulator >= FIXED_DT) {
      this.update(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    this.render();
    this.emitHud();
  };

  private emitHud() {
    const hud: HudState = {
      lives: this.player.lives,
      health: this.player.health,
      naira: this.naira,
      timeLeft: Math.ceil(this.timeLeft),
      highScore: this.highScore,
      score: this.score,
      speedBoostActive: this.player.isSpeedBoosted,
      levelName: this.level.name,
      stage: this.level.stageNumber,
      stageCount: this.level.stageCount,
      throwReadyRatio: 1 - this.throwCooldown / THROW_COOLDOWN_SECONDS,
      banner: this.banner,
    };
    this.callbacks.onHud(hud);
  }

  /** Regenerates the world for the next stage while keeping score, naira
   * and lives — only health and the clock reset. */
  private loadStage(stageNumber: number) {
    this.level = createLevel(stageNumber);
    this.enemies = [];
    this.pickups = [];
    this.coins = [];
    this.projectiles = [];
    this.popups = [];
    this.spawnEntitiesFromLevel();

    this.player.health = MAX_HEALTH;
    this.player.respawnAt(this.level.playerStart.x, this.level.playerStart.y);
    this.player.vx = 0;
    this.player.vy = 0;
    this.checkpointHistory = [{ x: this.level.playerStart.x, y: this.level.playerStart.y }];
    this.checkpointSampleTimer = 0;

    this.timeLeft = this.level.timeLimitSeconds;
    this.timeAccumForSeconds = 0;
    this.throwCooldown = 0;
    this.bossAttackTimer = BOSS_ATTACK_INTERVAL_SECONDS;
    this.banner = null;
    this.camera.x = 0;
    this.camera.y = 0;
  }

  private update(dt: number) {
    this.globalTime += dt;
    if (this.phase !== "playing") return;

    if (this.transitioning) {
      this.transitionTimer -= dt;
      if (this.transitionTimer <= 0) {
        this.transitioning = false;
        this.loadStage(this.level.stageNumber + 1);
      }
      return;
    }

    this.input.update();

    const willJump =
      this.input.state.jumpPressed && this.player.onGround && !this.player.crouching;
    if (willJump) this.audio.playJump();

    this.player.update(dt, this.input.state, this.level, (col, row) =>
      this.handleBlockHit(col, row)
    );

    if (this.throwCooldown > 0) this.throwCooldown = Math.max(0, this.throwCooldown - dt);
    if (this.input.state.throwPressed && this.throwCooldown <= 0) {
      this.throwSlipper();
    }

    for (const enemy of this.enemies) enemy.update(dt, this.level);
    for (const pickup of this.pickups) pickup.update(dt, this.level);
    for (const coin of this.coins) coin.update(dt);
    for (const projectile of this.projectiles) projectile.update(dt, this.level);
    this.updateBossAttack(dt);

    this.handlePlayerEnemyCollisions();
    this.handlePlayerPickupCollisions();
    this.handlePlayerCoinCollisions();
    this.handleProjectileEnemyCollisions();
    this.handleBossProjectilePlayerCollisions();
    this.handleFallDeath();
    this.handleDanfoGoal();

    if (this.player.onGround) {
      this.checkpointSampleTimer += dt;
      if (this.checkpointSampleTimer >= GameEngine.CHECKPOINT_SAMPLE_INTERVAL) {
        this.checkpointSampleTimer = 0;
        this.checkpointHistory.push({ x: this.player.x, y: this.player.y });
        if (this.checkpointHistory.length > GameEngine.CHECKPOINT_MAX_SAMPLES) {
          this.checkpointHistory.shift();
        }
      }
    }

    this.timeAccumForSeconds += dt;
    if (this.timeAccumForSeconds >= 1) {
      this.timeAccumForSeconds -= 1;
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.endGame("gameover", "time");
      }
    }

    this.popups = this.popups.filter((p) => {
      p.life -= dt;
      p.y -= dt * 12;
      return p.life > 0;
    });

    this.enemies = this.enemies.filter((e) => !e.isDefeated);
    this.pickups = this.pickups.filter((p) => !p.collected);
    this.coins = this.coins.filter((c) => !c.collected);
    this.projectiles = this.projectiles.filter((p) => p.active);

    this.camera.follow(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
      this.level.widthPx,
      this.level.heightPx
    );
  }

  private throwSlipper() {
    const dir = this.player.facing;
    const x = dir === 1 ? this.player.x + this.player.width : this.player.x - 8;
    const y = this.player.y + this.player.height * 0.35;
    this.projectiles.push(new Projectile(x, y, dir, "player"));
    this.throwCooldown = THROW_COOLDOWN_SECONDS;
    this.audio.playThrow();
  }

  /** Chief Agbero throws a bottle at the player on a fixed interval while
   * alive — the only enemy that fights back at range. */
  private updateBossAttack(dt: number) {
    const boss = this.enemies.find((e) => e.kind === "boss" && e.alive);
    if (!boss) return;
    this.bossAttackTimer -= dt;
    if (this.bossAttackTimer > 0) return;
    this.bossAttackTimer = BOSS_ATTACK_INTERVAL_SECONDS;

    const dir: 1 | -1 = this.player.x < boss.x ? -1 : 1;
    const x = dir === 1 ? boss.x + boss.width : boss.x - 8;
    const y = boss.y + boss.height * 0.3;
    this.projectiles.push(new Projectile(x, y, dir, "boss", BOSS_PROJECTILE_SPEED));
    this.audio.playThrow();
  }

  private handleProjectileEnemyCollisions() {
    for (const projectile of this.projectiles) {
      if (!projectile.active || projectile.owner !== "player") continue;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (!aabbOverlap(projectile, enemy)) continue;
        enemy.hit();
        projectile.active = false;
        const points = pointsForEnemy(enemy.kind);
        this.score += points;
        this.audio.playStomp();
        this.spawnPopup(`+${points}`, enemy.x, enemy.y - 4, "#ffffff");
        break;
      }
    }
  }

  private handleBossProjectilePlayerCollisions() {
    for (const projectile of this.projectiles) {
      if (!projectile.active || projectile.owner !== "boss") continue;
      if (!aabbOverlap(projectile, this.player)) continue;
      projectile.active = false;
      if (this.player.takeDamage()) {
        this.audio.playHurt();
        this.player.vx = this.player.x < projectile.x ? -90 : 90;
        this.player.vy = -90;
        if (this.player.health <= 0) this.loseLife();
      }
    }
  }

  private handleBlockHit(col: number, row: number) {
    const tile = this.level.grid[row]?.[col];
    if (!tile || !BLOCK_TILES.has(tile)) return;
    this.level.grid[row][col] = "X";
    const content = blockContentForIndex(col * 31 + row * 7);
    const center = tileCenter(col, row);

    if (content === "coin") {
      this.naira += 10;
      this.score += 10;
      this.audio.playCoin();
      this.spawnPopup("+10 ₦", center.x, center.y, "#ffd400");
    } else {
      const pickup = new Pickup(content, col * TILE_SIZE, row * TILE_SIZE);
      pickup.x += (TILE_SIZE - pickup.width) / 2;
      this.pickups.push(pickup);
      this.audio.playBlockBump();
    }
  }

  private spawnPopup(text: string, x: number, y: number, color: string) {
    this.popups.push({ text, x, y, life: 0.8, color });
  }

  private handlePlayerEnemyCollisions() {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (!aabbOverlap(this.player, enemy)) continue;

      const playerBottom = this.player.y + this.player.height;
      const stompZone = enemy.y + enemy.height * 0.5;
      const isStomp = this.player.vy > 0 && playerBottom <= stompZone + 4;

      if (isStomp) {
        enemy.hit();
        // Snap the player just above the enemy so the AABBs no longer
        // overlap this frame — otherwise, once the bounce reverses vy to
        // negative, the very next physics step would see the same overlap
        // with vy <= 0 and misread it as a side hit, damaging the player
        // immediately after a successful stomp.
        this.player.y = enemy.y - this.player.height;
        this.player.vy = -140;
        const points = pointsForEnemy(enemy.kind);
        this.score += points;
        this.audio.playStomp();
        this.spawnPopup(`+${points}`, enemy.x, enemy.y - 4, "#ffffff");
      } else if (this.player.takeDamage()) {
        this.audio.playHurt();
        this.player.vx = this.player.x < enemy.x ? -90 : 90;
        this.player.vy = -90;
        if (this.player.health <= 0) this.loseLife();
      }
    }
  }

  private handlePlayerPickupCollisions() {
    for (const pickup of this.pickups) {
      if (pickup.collected) continue;
      if (!aabbOverlap(this.player, pickup)) continue;
      pickup.collected = true;
      if (pickup.kind === "suya") {
        this.player.heal(1);
        this.spawnPopup("Suya! +1 HP", pickup.x - 6, pickup.y - 4, "#ff7a00");
      } else {
        this.player.applySpeedBoost();
        this.spawnPopup("Cold Zobo!", pickup.x - 8, pickup.y - 4, "#7a1f4b");
      }
      this.score += 20;
      this.audio.playPowerUp();
    }
  }

  private handlePlayerCoinCollisions() {
    for (const coin of this.coins) {
      if (coin.collected) continue;
      if (!aabbOverlap(this.player, coin.bounds)) continue;
      coin.collected = true;
      this.naira += 10;
      this.score += 10;
      this.audio.playCoin();
      this.spawnPopup("+10 ₦", coin.x, coin.y - 4, "#ffd400");
    }
  }

  private handleFallDeath() {
    if (this.player.y > this.level.heightPx + 40) {
      this.audio.playHurt();
      this.loseLife();
    }
  }

  private loseLife() {
    this.player.lives -= 1;
    if (this.player.lives <= 0) {
      this.endGame("gameover", "lives");
      return;
    }
    this.player.health = MAX_HEALTH;
    const spot = this.resolveCheckpoint();
    this.player.respawnAt(spot.x, spot.y);
  }

  /** Picks the most recent sampled position that's at least
   * `CHECKPOINT_BUFFER_PX` further back (smaller x — "behind" always
   * means "less progress toward the Danfo," never just "wherever they
   * came from a moment ago") than where the player currently is, scanning
   * newest-to-oldest. A deliberately one-sided (not `Math.abs`) check: if
   * the player had backtracked left before dying, we still want a spot
   * behind their overall progress, not one further ahead that a naive
   * distance check could otherwise match. Falls back to the oldest
   * sample on hand if they haven't gone far enough yet for a full
   * buffer's worth. */
  private resolveCheckpoint(): { x: number; y: number } {
    const history = this.checkpointHistory;
    if (history.length === 0) return this.level.playerStart;
    for (let i = history.length - 1; i >= 0; i--) {
      if (this.player.x - history[i].x >= GameEngine.CHECKPOINT_BUFFER_PX) {
        return history[i];
      }
    }
    return history[0];
  }

  private handleDanfoGoal() {
    const danfoX = this.level.danfoCol * TILE_SIZE;
    if (this.player.x + this.player.width < danfoX || !this.player.onGround) return;

    const timeBonus = Math.floor(this.timeLeft) * 2;
    this.score += timeBonus;

    if (this.level.stageNumber >= this.level.stageCount) {
      this.endGame("levelclear", "danfo");
      return;
    }

    this.audio.playLevelComplete();
    this.banner = {
      title: `STAGE ${this.level.stageNumber} CLEAR!`,
      subtitle: `+${timeBonus} time bonus — get ready for Stage ${this.level.stageNumber + 1}...`,
    };
    this.transitioning = true;
    this.transitionTimer = 2.6;
  }

  private endGame(phase: "gameover" | "levelclear", reason: EndSummary["reason"]) {
    if (this.endedAlready) return;
    this.endedAlready = true;
    this.phase = phase;
    if (phase === "gameover") this.audio.playGameOver();
    else this.audio.playLevelComplete();
    this.audio.stopMusic();

    const isNewHighScore = setHighScoreIfBetter(this.score);
    this.highScore = getHighScore();

    this.callbacks.onEnd(phase, {
      score: this.score,
      naira: this.naira,
      timeLeft: Math.ceil(this.timeLeft),
      isNewHighScore,
      reason,
      stage: this.level.stageNumber,
      stageCount: this.level.stageCount,
    });
  }

  setTouch(part: "left" | "right" | "jump" | "crouch" | "throw", pressed: boolean) {
    if (pressed) this.audio.ensureContext();
    this.input.setTouch(part, pressed);
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  private render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    drawBackground(ctx, this.camera.x, this.globalTime);

    const camX = this.camera.x;
    const camY = this.camera.y;

    this.drawTiles(camX, camY);
    drawRoadStrip(ctx, camX);

    // Ground-contact shadows, drawn under everything that stands or hovers
    // above the tiles — the single biggest cue for "this is above the
    // ground" vs. "this is flat on the ground" in a 2D scene with no real
    // lighting. A flying enemy's shadow staying put on the ground while it
    // bobs overhead is what actually sells its height.
    for (const enemy of this.enemies) {
      if (enemy.alive) this.drawGroundShadow(camX, camY, enemy.x + enemy.width / 2, enemy.y + enemy.height);
    }
    this.drawGroundShadow(camX, camY, this.player.x + this.player.width / 2, this.player.y + this.player.height);

    for (const coin of this.coins) coin.draw(ctx, camX, camY);
    for (const pickup of this.pickups) pickup.draw(ctx, camX, camY);
    for (const projectile of this.projectiles) projectile.draw(ctx, camX, camY);
    for (const enemy of this.enemies) enemy.draw(ctx, camX, camY);
    this.player.draw(ctx, camX, camY);
    this.drawThrowMeter(camX, camY);

    this.drawDanfoBus(camX, camY);
    this.drawPopups(camX, camY);
    this.drawBossHealthBar();
  }

  /** Finds the top of the nearest solid tile at `x` at or below `fromY`,
   * in world pixels — used to project a shadow onto the actual ground
   * rather than just stamping it under an entity's feet (which wouldn't
   * show height at all for anything airborne). Returns null over a gap. */
  private groundYBelow(x: number, fromY: number): number | null {
    const col = Math.floor(x / TILE_SIZE);
    const startRow = Math.max(0, Math.floor(fromY / TILE_SIZE));
    for (let row = startRow; row < this.level.rows; row++) {
      if (isSolidTile(this.level.grid[row]?.[col])) return row * TILE_SIZE;
    }
    return null;
  }

  private drawGroundShadow(camX: number, camY: number, footX: number, footY: number) {
    const groundY = this.groundYBelow(footX, footY);
    if (groundY === null) return; // over a pothole/drainage — nothing to cast onto
    const ctx = this.ctx;
    const heightAbove = Math.max(0, groundY - footY);
    const scale = Math.max(0.35, 1 - heightAbove / 70);
    const alpha = Math.max(0.12, 0.32 - heightAbove / 250);
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(footX - camX, groundY - camY - 1, 6 * scale, 2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Fixed to the screen (not the world), like a classic boss bar, so it
   * stays put regardless of camera scroll. */
  private drawBossHealthBar() {
    const boss = this.enemies.find((e) => e.kind === "boss" && e.alive);
    if (!boss) return;
    const ctx = this.ctx;
    const w = 120;
    const x = VIEW_WIDTH / 2 - w / 2;
    const y = 12;
    const ratio = Math.max(0, boss.health / boss.maxHealth);

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x - 3, y - 11, w + 6, 19);
    ctx.textAlign = "center";
    ctx.font = "8px monospace";
    ctx.fillStyle = "#ffd400";
    ctx.fillText("CHIEF AGBERO", VIEW_WIDTH / 2, y - 2);
    ctx.fillStyle = "#3a2020";
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = ratio > 0.3 ? "#e0453a" : "#ff8a65";
    ctx.fillRect(x, y, Math.round(w * ratio), 5);
  }

  private drawThrowMeter(camX: number, camY: number) {
    const ctx = this.ctx;
    const ratio = 1 - this.throwCooldown / THROW_COOLDOWN_SECONDS;
    const w = 14;
    const x = this.player.x + this.player.width / 2 - w / 2 - camX;
    const y = this.player.y - 8 - camY;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - 1, y - 1, w + 2, 4);
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = ratio >= 1 ? "#5ad65a" : "#ff9d2e";
    ctx.fillRect(x, y, Math.round(w * ratio), 2);
  }

  private drawTiles(camX: number, camY: number) {
    const ctx = this.ctx;
    const firstCol = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
    const lastCol = Math.min(
      this.level.cols - 1,
      Math.ceil((camX + VIEW_WIDTH) / TILE_SIZE) + 1
    );

    for (let row = 0; row < this.level.rows; row++) {
      for (let col = firstCol; col <= lastCol; col++) {
        const tile = this.level.grid[row][col];
        if (tile === " ") continue;
        const x = col * TILE_SIZE - camX;
        const y = row * TILE_SIZE - camY;
        this.drawTile(tile, x, y, col);
      }
    }
  }

  private drawTile(tile: string, x: number, y: number, col: number) {
    const ctx = this.ctx;
    switch (tile) {
      case "G": {
        // Grass top with a few blades poking up, then layered soil bands
        // with scattered pebbles for texture instead of a flat fill.
        ctx.fillStyle = COLORS.groundTop;
        ctx.fillRect(x, y, TILE_SIZE, 5);
        ctx.fillStyle = "#5aa53d";
        for (let i = 0; i < TILE_SIZE; i += 4) {
          const bladeH = (col + i) % 8 < 4 ? 2 : 3;
          ctx.fillRect(x + i + 1, y - bladeH + 1, 1, bladeH);
        }
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(x, y + 4, TILE_SIZE, 1);

        ctx.fillStyle = COLORS.ground;
        ctx.fillRect(x, y + 5, TILE_SIZE, TILE_SIZE - 5);
        ctx.fillStyle = "rgba(0,0,0,0.14)";
        ctx.fillRect(x, y + 9, TILE_SIZE, 1);
        ctx.fillRect(x, y + 13, TILE_SIZE, 1);
        const pebbleSeed = (col * 7) % TILE_SIZE;
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(x + pebbleSeed, y + 7, 2, 1);
        ctx.fillRect(x + ((pebbleSeed + 8) % TILE_SIZE), y + 11, 1, 1);
        break;
      }
      case "P": {
        ctx.fillStyle = COLORS.groundTop;
        ctx.fillRect(x, y, TILE_SIZE, 4);
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(x, y + 3, TILE_SIZE, 1);
        ctx.fillStyle = COLORS.ground;
        ctx.fillRect(x, y + 4, TILE_SIZE, 5);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(x, y + 8, TILE_SIZE, 1);
        break;
      }
      case "B": {
        // Running-bond brick pattern: alternating half-offset rows with
        // mortar lines and a soft top-left highlight for depth.
        ctx.fillStyle = COLORS.brick;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(x, y, TILE_SIZE, 1);
        ctx.fillRect(x, y, 1, TILE_SIZE);

        ctx.strokeStyle = COLORS.brickLine;
        ctx.lineWidth = 1;
        const rowH = TILE_SIZE / 2;
        for (let ry = 0; ry <= TILE_SIZE; ry += rowH) {
          ctx.beginPath();
          ctx.moveTo(x, y + ry + 0.5);
          ctx.lineTo(x + TILE_SIZE, y + ry + 0.5);
          ctx.stroke();
        }
        const offsetRow = Math.floor(y / rowH) % 2 !== 0;
        const midX = offsetRow ? TILE_SIZE / 4 : TILE_SIZE * 0.75;
        ctx.beginPath();
        ctx.moveTo(x + midX + 0.5, y);
        ctx.lineTo(x + midX + 0.5, y + rowH);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + (TILE_SIZE - midX) + 0.5, y + rowH);
        ctx.lineTo(x + (TILE_SIZE - midX) + 0.5, y + TILE_SIZE);
        ctx.stroke();
        ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        break;
      }
      case "?": {
        drawBevelBlock(ctx, x, y, COLORS.question, "#ffe08a", "#a05a00");
        drawMonoGlyph(ctx, QUESTION_GLYPH, x + 5, y + 4, "#7a3d00");
        break;
      }
      case "X": {
        drawBevelBlock(ctx, x, y, COLORS.questionUsed, "#8a6a4a", "#3a2414");
        break;
      }
      case "O": {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE - 2, TILE_SIZE / 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.pothole;
        ctx.beginPath();
        ctx.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE - 4, TILE_SIZE / 2 - 1, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + TILE_SIZE - 6);
        ctx.lineTo(x + 6, y + TILE_SIZE - 3);
        ctx.moveTo(x + TILE_SIZE - 4, y + TILE_SIZE - 7);
        ctx.lineTo(x + TILE_SIZE - 7, y + TILE_SIZE - 3);
        ctx.stroke();
        break;
      }
      case "D": {
        ctx.fillStyle = "#3a3f45";
        ctx.fillRect(x, y + TILE_SIZE - 12, TILE_SIZE, 12);
        ctx.fillStyle = COLORS.drainage;
        ctx.fillRect(x, y + TILE_SIZE - 9, TILE_SIZE, 9);
        ctx.fillStyle = COLORS.drainageWater;
        const wobble = Math.sin(this.globalTime * 3 + col) * 1;
        ctx.fillRect(x, y + TILE_SIZE - 5 + wobble, TILE_SIZE, 4);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(x + 2, y + TILE_SIZE - 4 + wobble, TILE_SIZE - 4, 1);
        // Grate bars over the trench mouth.
        ctx.fillStyle = "#22262b";
        for (let i = 2; i < TILE_SIZE; i += 4) ctx.fillRect(x + i, y + TILE_SIZE - 12, 2, 3);
        break;
      }
      default:
        break;
    }
  }

  private drawDanfoBus(camX: number, camY: number) {
    const ctx = this.ctx;
    const w = 40;
    const h = 26;
    const x = this.level.danfoCol * TILE_SIZE - camX;
    const groundTop = (this.level.rows - 1) * TILE_SIZE - camY;
    const y = groundTop - h;

    // Grounding shadow.
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, groundTop + 1, w / 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body.
    ctx.fillStyle = COLORS.danfoYellow;
    ctx.fillRect(x, y + 4, w, h - 8);
    ctx.fillStyle = "#e0b400";
    ctx.fillRect(x, y + h - 8, w, 4);

    // Roofline + destination board.
    ctx.fillStyle = "#d9b300";
    ctx.fillRect(x + 2, y + 2, w - 4, 3);
    ctx.fillStyle = COLORS.danfoBlack;
    ctx.fillRect(x + w - 13, y + 3, 10, 5);
    ctx.fillStyle = "#ffd94a";
    ctx.fillRect(x + w - 11, y + 5, 2, 1);
    ctx.fillRect(x + w - 8, y + 5, 4, 1);

    // Window band with black mullions.
    ctx.fillStyle = COLORS.danfoBlack;
    ctx.fillRect(x + 2, y + 6, w - 4, 8);
    ctx.fillStyle = "#bfe4f2";
    for (let wx = 4; wx < w - 6; wx += 9) {
      ctx.fillRect(x + wx, y + 7, 6, 6);
    }

    // Racing stripe.
    ctx.fillStyle = COLORS.danfoBlack;
    ctx.fillRect(x, y + 15, w, 3);

    // Door seam + handle.
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + 6);
    ctx.lineTo(x + w * 0.5, y + h - 8);
    ctx.stroke();
    ctx.fillStyle = "#3a3a42";
    ctx.fillRect(x + w * 0.5 - 3, y + h - 12, 2, 2);

    // Bumpers, lights.
    ctx.fillStyle = "#3a3a42";
    ctx.fillRect(x - 1, y + h - 6, 4, 3);
    ctx.fillRect(x + w - 3, y + h - 6, 4, 3);
    ctx.fillStyle = "#ffef9e";
    ctx.fillRect(x + w - 3, y + 9, 2, 3);
    ctx.fillStyle = "#c22";
    ctx.fillRect(x, y + 9, 2, 3);
    ctx.fillStyle = "#2c2c34";
    ctx.fillRect(x + w - 1, y + 6, 3, 2);

    // Wheels.
    drawWheel(ctx, x + 9, groundTop);
    drawWheel(ctx, x + w - 12, groundTop);

    // Bouncing "this is the goal" marker.
    const bob = Math.sin(this.globalTime * 4) * 3;
    drawSprite(ctx, GOAL_ARROW, x + w / 2 - 3, y - 14 + bob);
  }

  private drawPopups(camX: number, camY: number) {
    const ctx = this.ctx;
    ctx.textAlign = "center";
    ctx.font = "8px monospace";
    for (const popup of this.popups) {
      ctx.globalAlpha = Math.max(0, popup.life);
      ctx.fillStyle = popup.color;
      ctx.fillText(popup.text, popup.x - camX, popup.y - camY);
    }
    ctx.globalAlpha = 1;
  }
}

function pointsForEnemy(kind: Enemy["kind"]): number {
  switch (kind) {
    case "boss":
      return 300;
    case "agbero":
      return 100;
    default:
      return 50;
  }
}

function drawBevelBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  base: string,
  light: string,
  dark: string
) {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = light;
  ctx.fillRect(x, y, TILE_SIZE, 2);
  ctx.fillRect(x, y, 2, TILE_SIZE);
  ctx.fillStyle = dark;
  ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
  ctx.fillRect(x + TILE_SIZE - 2, y, 2, TILE_SIZE);
  // Corner rivets, like the classic bolted block sprites.
  ctx.fillStyle = dark;
  ctx.fillRect(x + 2, y + 2, 2, 2);
  ctx.fillRect(x + TILE_SIZE - 4, y + 2, 2, 2);
  ctx.fillRect(x + 2, y + TILE_SIZE - 4, 2, 2);
  ctx.fillRect(x + TILE_SIZE - 4, y + TILE_SIZE - 4, 2, 2);
}

function drawWheel(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
  const r = 5;
  const cy = groundY - r + 2;
  ctx.fillStyle = "#141414";
  ctx.beginPath();
  ctx.arc(x, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8a8a8a";
  ctx.beginPath();
  ctx.arc(x, cy, 2, 0, Math.PI * 2);
  ctx.fill();
}

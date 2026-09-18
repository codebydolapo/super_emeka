import {
  GRAVITY,
  MAX_FALL_SPEED,
  PROJECTILE_HEIGHT,
  PROJECTILE_LIFETIME_SECONDS,
  PROJECTILE_SPEED,
  PROJECTILE_WIDTH,
  TILE_SIZE,
} from "./constants";
import { isWallAhead, isStandingOnLedgeEnd, moveAndCollide } from "./Physics";
import { isSolidTile, LevelData } from "./Level";
import {
  AGBERO,
  COIN_0,
  COIN_1,
  HAWKER,
  SLIPPER,
  SUYA,
  ZOBO,
  drawSprite,
} from "./Sprites";

export type EnemyKind = "hawker" | "agbero";

const ENEMY_SPEED: Record<EnemyKind, number> = {
  hawker: 24,
  agbero: 14,
};

const ENEMY_HEALTH: Record<EnemyKind, number> = {
  hawker: 1,
  agbero: 2,
};

const ENEMY_SIZE: Record<EnemyKind, { w: number; h: number }> = {
  hawker: { w: 14, h: 18 },
  agbero: { w: 14, h: 20 },
};

export class Enemy {
  x: number;
  y: number;
  vx: number;
  vy = 0;
  width: number;
  height: number;
  onGround = false;
  alive = true;
  squishTimer = 0;
  health: number;
  kind: EnemyKind;
  private speedMultiplier: number;
  private dir: 1 | -1 = -1;
  private hitFlash = 0;

  constructor(kind: EnemyKind, x: number, y: number, speedMultiplier = 1) {
    this.kind = kind;
    const size = ENEMY_SIZE[kind];
    this.width = size.w;
    this.height = size.h;
    this.x = x;
    this.y = y - this.height;
    this.health = ENEMY_HEALTH[kind];
    this.speedMultiplier = speedMultiplier;
    this.vx = -ENEMY_SPEED[kind] * speedMultiplier;
  }

  get isDefeated() {
    return !this.alive && this.squishTimer <= 0;
  }

  /** Used by both a player stomp and a slipper hit. */
  hit() {
    this.health -= 1;
    this.hitFlash = 0.15;
    if (this.health <= 0) {
      this.alive = false;
      this.squishTimer = 0.35;
      this.vx = 0;
    } else {
      // knocked back briefly, still alive
      this.dir = this.dir === 1 ? -1 : 1;
      this.vx = ENEMY_SPEED[this.kind] * this.speedMultiplier * this.dir;
    }
  }

  update(dt: number, level: LevelData) {
    if (!this.alive) {
      this.squishTimer -= dt;
      return;
    }
    if (this.hitFlash > 0) this.hitFlash -= dt;

    if (isWallAhead(level, this, this.dir) || isStandingOnLedgeEnd(level, this, this.dir)) {
      this.dir = this.dir === 1 ? -1 : 1;
    }
    this.vx = ENEMY_SPEED[this.kind] * this.speedMultiplier * this.dir;
    this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);
    moveAndCollide(this, dt, level);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    if (this.isDefeated) return;
    const sprite = this.kind === "hawker" ? HAWKER : AGBERO;
    ctx.save();
    if (!this.alive) {
      // squashed death animation
      ctx.translate(this.x - camX, this.y - camY + this.height * 0.6);
      ctx.scale(1, 0.3);
      drawSprite(ctx, sprite, 0, 0, this.dir === -1);
    } else {
      if (this.hitFlash > 0) ctx.globalAlpha = 0.5;
      drawSprite(ctx, sprite, this.x - camX, this.y - camY, this.dir === -1);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

export type PickupKind = "suya" | "zobo";

const PICKUP_SIZE: Record<PickupKind, { w: number; h: number }> = {
  suya: { w: 12, h: 10 },
  zobo: { w: 10, h: 12 },
};

export class Pickup {
  x: number;
  y: number;
  vx: number;
  vy = -60;
  width: number;
  height: number;
  onGround = false;
  collected = false;
  kind: PickupKind;
  private popTimer = 0.25;

  constructor(kind: PickupKind, x: number, y: number) {
    this.kind = kind;
    const size = PICKUP_SIZE[kind];
    this.width = size.w;
    this.height = size.h;
    this.x = x;
    this.y = y;
    this.vx = kind === "zobo" ? 20 : 0;
  }

  update(dt: number, level: LevelData) {
    if (this.popTimer > 0) {
      this.popTimer -= dt;
      this.y -= 20 * dt;
      return;
    }
    this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);
    if (this.kind === "zobo") {
      if (isWallAhead(level, this, this.vx >= 0 ? 1 : -1)) this.vx *= -1;
    }
    moveAndCollide(this, dt, level);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    const sprite = this.kind === "suya" ? SUYA : ZOBO;
    drawSprite(ctx, sprite, this.x - camX, this.y - camY);
  }
}

export class FloatingCoin {
  x: number;
  y: number;
  baseY: number;
  collected = false;
  private t: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.t = (x * 13) % 100;
  }

  update(dt: number) {
    this.t += dt * 4;
    this.y = this.baseY + Math.sin(this.t) * 2;
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    const frame = Math.floor(this.t) % 2 === 0 ? COIN_0 : COIN_1;
    drawSprite(ctx, frame, this.x - camX, this.y - camY);
  }

  get bounds() {
    return { x: this.x, y: this.y, width: 10, height: 10 };
  }
}

export function tileCenter(col: number, row: number) {
  return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
}

/** The player's thrown slipper — a flat, gravity-free projectile with a
 * short lifetime so it can't be used to snipe the whole level from afar. */
export class Projectile {
  x: number;
  y: number;
  vx: number;
  width = PROJECTILE_WIDTH;
  height = PROJECTILE_HEIGHT;
  active = true;
  private life = PROJECTILE_LIFETIME_SECONDS;
  private spin = 0;

  constructor(x: number, y: number, dir: 1 | -1) {
    this.x = x;
    this.y = y;
    this.vx = PROJECTILE_SPEED * dir;
  }

  update(dt: number, level: LevelData) {
    this.life -= dt;
    this.spin += dt * 20;
    if (this.life <= 0) {
      this.active = false;
      return;
    }
    this.x += this.vx * dt;
    const col = Math.floor((this.x + this.width / 2) / TILE_SIZE);
    const row = Math.floor((this.y + this.height / 2) / TILE_SIZE);
    if (isSolidTile(level.grid[row]?.[col])) this.active = false;
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    ctx.save();
    const cx = this.x - camX + this.width / 2;
    const cy = this.y - camY + this.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(this.spin);
    drawSprite(ctx, SLIPPER, -this.width / 2, -this.height / 2);
    ctx.restore();
  }
}

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
  BOTTLE,
  CHIEF_AGBERO,
  COIN_0,
  COIN_1,
  HAWKER,
  MOSQUITO,
  OKADA,
  SLIPPER,
  SUYA,
  ZOBO,
  drawSprite,
} from "./Sprites";

export type EnemyKind = "hawker" | "agbero" | "okada" | "mosquito" | "boss";

const FLYING_KINDS = new Set<EnemyKind>(["mosquito"]);

const ENEMY_SPEED: Record<EnemyKind, number> = {
  hawker: 24,
  agbero: 14,
  okada: 55,
  mosquito: 26,
  boss: 16,
};

const ENEMY_HEALTH: Record<EnemyKind, number> = {
  hawker: 1,
  agbero: 2,
  okada: 1,
  mosquito: 1,
  boss: 5,
};

// Chief Agbero reuses the regular Agbero's pixel art, just drawn bigger —
// see Sprites.ts for why.
export const BOSS_SPRITE_SCALE = 1.5;

const ENEMY_SIZE: Record<EnemyKind, { w: number; h: number }> = {
  hawker: { w: 14, h: 18 },
  agbero: { w: 14, h: 20 },
  okada: { w: 20, h: 16 },
  mosquito: { w: 12, h: 10 },
  boss: { w: 14 * BOSS_SPRITE_SCALE, h: 20 * BOSS_SPRITE_SCALE },
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
  maxHealth: number;
  kind: EnemyKind;
  private flying: boolean;
  private speedMultiplier: number;
  private dir: 1 | -1 = -1;
  private hitFlash = 0;
  private originX: number;
  private originY: number;
  private hoverRangeX: number;
  private flightTime: number;

  /**
   * `x`/`y` mean slightly different things depending on the enemy: for
   * ground-based kinds it's the feet position (matching how the level
   * generator places entities), for flying kinds it's the hover center.
   */
  constructor(kind: EnemyKind, x: number, y: number, speedMultiplier = 1) {
    this.kind = kind;
    this.flying = FLYING_KINDS.has(kind);
    const size = ENEMY_SIZE[kind];
    this.width = size.w;
    this.height = size.h;
    this.health = ENEMY_HEALTH[kind];
    this.maxHealth = this.health;
    this.speedMultiplier = speedMultiplier;
    this.vx = -ENEMY_SPEED[kind] * speedMultiplier;

    if (this.flying) {
      this.x = x - this.width / 2;
      this.y = y - this.height / 2;
      this.originX = this.x;
      this.originY = this.y;
      this.hoverRangeX = 26;
      this.flightTime = (x * 7) % 100; // desync multiple mosquitoes
    } else {
      this.x = x;
      this.y = y - this.height;
      this.originX = this.x;
      this.originY = this.y;
      this.hoverRangeX = 0;
      this.flightTime = 0;
    }
  }

  get isDefeated() {
    return !this.alive && this.squishTimer <= 0;
  }

  /** Used by a player stomp, a slipper hit, or the player's own thrown item. */
  hit() {
    this.health -= 1;
    this.hitFlash = 0.15;
    if (this.health <= 0) {
      this.alive = false;
      this.squishTimer = 0.35;
      this.vx = 0;
    } else if (!this.flying) {
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

    if (this.flying) {
      this.flightTime += dt;
      this.x = this.originX + Math.sin(this.flightTime * 1.4) * this.hoverRangeX;
      this.y = this.originY + Math.sin(this.flightTime * 3.1) * 6;
      this.dir = Math.cos(this.flightTime * 1.4) >= 0 ? 1 : -1;
      return;
    }

    if (isWallAhead(level, this, this.dir) || isStandingOnLedgeEnd(level, this, this.dir)) {
      this.dir = this.dir === 1 ? -1 : 1;
    }
    this.vx = ENEMY_SPEED[this.kind] * this.speedMultiplier * this.dir;
    this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);
    moveAndCollide(this, dt, level);
  }

  private sprite() {
    switch (this.kind) {
      case "hawker":
        return HAWKER;
      case "okada":
        return OKADA;
      case "mosquito":
        return MOSQUITO;
      case "boss":
        return CHIEF_AGBERO;
      default:
        return AGBERO;
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    if (this.isDefeated) return;
    const sprite = this.sprite();
    const scale = this.kind === "boss" ? BOSS_SPRITE_SCALE : 1;
    ctx.save();
    if (!this.alive) {
      // squashed death animation
      ctx.translate(this.x - camX, this.y - camY + this.height * 0.6);
      ctx.scale(1, 0.3);
      drawSprite(ctx, sprite, 0, 0, this.dir === -1, 1, scale);
    } else {
      if (this.hitFlash > 0) ctx.globalAlpha = 0.5;
      drawSprite(ctx, sprite, this.x - camX, this.y - camY, this.dir === -1, 1, scale);
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

export type ProjectileOwner = "player" | "boss";

/** A thrown item — the player's slipper (flat, gravity-free, short-lived so
 * it can't snipe the whole level) or the boss's bottle (same shape of
 * flight, but with a touch of gravity so it arcs and has to be dodged
 * rather than just outrun). `owner` is how GameEngine tells the two apart
 * for collision purposes — player projectiles hurt enemies, boss
 * projectiles hurt the player. */
export class Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width = PROJECTILE_WIDTH;
  height = PROJECTILE_HEIGHT;
  active = true;
  owner: ProjectileOwner;
  private gravity: number;
  private life = PROJECTILE_LIFETIME_SECONDS;
  private spin = 0;

  constructor(
    x: number,
    y: number,
    dir: 1 | -1,
    owner: ProjectileOwner = "player",
    speed: number = PROJECTILE_SPEED
  ) {
    this.x = x;
    this.y = y;
    this.owner = owner;
    this.vx = speed * dir;
    this.vy = 0;
    this.gravity = owner === "boss" ? GRAVITY * 0.5 : 0;
    // The bottle sprite is square (8x8), unlike the flatter 8x6 slipper —
    // match the hitbox to whichever sprite is actually being drawn.
    if (owner === "boss") this.height = 8;
  }

  update(dt: number, level: LevelData) {
    this.life -= dt;
    this.spin += dt * 20;
    if (this.life <= 0) {
      this.active = false;
      return;
    }
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
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
    const sprite = this.owner === "boss" ? BOTTLE : SLIPPER;
    drawSprite(ctx, sprite, -this.width / 2, -this.height / 2);
    ctx.restore();
  }
}

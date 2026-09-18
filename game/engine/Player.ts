import {
  ACCELERATION,
  FRICTION,
  GRAVITY,
  INVULNERABILITY_SECONDS,
  JUMP_CUT_MULTIPLIER,
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  MAX_HEALTH,
  MOVE_SPEED,
  PLAYER_CROUCH_HEIGHT,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SPEED_BOOST_MULTIPLIER,
  SPEED_BOOST_SECONDS,
} from "./constants";
import { InputState } from "../types";
import { moveAndCollide } from "./Physics";
import { LevelData } from "./Level";
import {
  PLAYER_CROUCH,
  PLAYER_IDLE,
  PLAYER_JUMP,
  PLAYER_RUN_0,
  PLAYER_RUN_1,
  drawSprite,
} from "./Sprites";

export type PlayerAnim = "idle" | "run" | "jump" | "crouch" | "hurt";

export class Player {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  width = PLAYER_WIDTH;
  height = PLAYER_HEIGHT;
  onGround = false;
  facing: 1 | -1 = 1;
  crouching = false;

  health = MAX_HEALTH;
  lives = 3;
  invulnerableTimer = 0;
  speedBoostTimer = 0;

  private animTimer = 0;
  private animFrame = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get isSpeedBoosted() {
    return this.speedBoostTimer > 0;
  }

  get isInvulnerable() {
    return this.invulnerableTimer > 0;
  }

  respawnAt(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.invulnerableTimer = INVULNERABILITY_SECONDS;
  }

  takeDamage(): boolean {
    if (this.isInvulnerable) return false;
    this.health -= 1;
    this.invulnerableTimer = INVULNERABILITY_SECONDS;
    return true;
  }

  heal(amount: number) {
    this.health = Math.min(MAX_HEALTH, this.health + amount);
  }

  applySpeedBoost() {
    this.speedBoostTimer = SPEED_BOOST_SECONDS;
  }

  update(
    dt: number,
    input: InputState,
    level: LevelData,
    onBlockHit: (col: number, row: number) => void
  ) {
    this.crouching = input.crouch && this.onGround;

    // Crouching plants Emeka in place (classic duck-and-hold behavior), so
    // the speed multiplier only ever matters for the Zobo speed boost.
    const speedMul = this.isSpeedBoosted ? SPEED_BOOST_MULTIPLIER : 1;
    const maxSpeed = MOVE_SPEED * speedMul;

    let targetVx = 0;
    if (!this.crouching) {
      if (input.left) {
        targetVx -= maxSpeed;
        this.facing = -1;
      }
      if (input.right) {
        targetVx += maxSpeed;
        this.facing = 1;
      }
    }

    if (targetVx !== 0) {
      const accel = ACCELERATION * speedMul;
      if (this.vx < targetVx) this.vx = Math.min(targetVx, this.vx + accel * dt);
      else if (this.vx > targetVx)
        this.vx = Math.max(targetVx, this.vx - accel * dt);
    } else {
      if (this.vx > 0) this.vx = Math.max(0, this.vx - FRICTION * dt);
      else if (this.vx < 0) this.vx = Math.min(0, this.vx + FRICTION * dt);
    }

    if (input.jumpPressed && this.onGround && !this.crouching) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
    }
    if (!input.jump && this.vy < JUMP_VELOCITY * JUMP_CUT_MULTIPLIER) {
      this.vy = JUMP_VELOCITY * JUMP_CUT_MULTIPLIER;
    }

    this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);

    const prevHeight = this.height;
    this.height = this.crouching ? PLAYER_CROUCH_HEIGHT : PLAYER_HEIGHT;
    if (this.height !== prevHeight) {
      // Keep feet planted when height changes (crouch/stand).
      this.y += prevHeight - this.height;
    }

    moveAndCollide(this, dt, level, (col, row) => onBlockHit(col, row));

    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.speedBoostTimer > 0) this.speedBoostTimer -= dt;

    this.updateAnimation(dt);
  }

  private updateAnimation(dt: number) {
    if (Math.abs(this.vx) > 4 && this.onGround) {
      this.animTimer += dt;
      const frameTime = Math.max(0.06, 0.16 - Math.abs(this.vx) / 400);
      if (this.animTimer >= frameTime) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
    } else {
      this.animTimer = 0;
    }
  }

  private currentSprite() {
    if (this.crouching) return PLAYER_CROUCH;
    if (!this.onGround) return PLAYER_JUMP;
    if (Math.abs(this.vx) > 4) return this.animFrame === 0 ? PLAYER_RUN_0 : PLAYER_RUN_1;
    return PLAYER_IDLE;
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    const blinking = this.isInvulnerable && Math.floor(this.invulnerableTimer * 10) % 2 === 0;
    if (blinking) return;
    const sprite = this.currentSprite();
    drawSprite(ctx, sprite, this.x - camX, this.y - camY, this.facing === -1);
  }
}

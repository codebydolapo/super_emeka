// Internal render resolution. The canvas is scaled up (with pixelated
// rendering) to fit whatever screen it's displayed on, so all game logic
// works in these fixed "virtual pixel" units.
export const VIEW_WIDTH = 320;
export const VIEW_HEIGHT = 180;

export const TILE_SIZE = 16;

// Physics
//
// Max jump height = JUMP_VELOCITY^2 / (2 * GRAVITY). With these numbers
// that's ~53px (~3.3 tiles at TILE_SIZE=16) of head-rise from a standing
// jump, and ~0.81s of hang time -> ~63px (~4 tiles) of horizontal travel at
// MOVE_SPEED. Level geometry (Level.ts) is authored against these figures:
// blocks/coins sit 1-3 tiles above standing head height, and gaps are at
// most 3 tiles wide, so everything placed in the level is actually reachable.
export const GRAVITY = 640; // px / s^2
export const MAX_FALL_SPEED = 340; // px / s
export const MOVE_SPEED = 78; // px / s
export const SPEED_BOOST_MULTIPLIER = 1.6;
export const CROUCH_SPEED_MULTIPLIER = 0.45;
export const ACCELERATION = 620; // px / s^2
export const FRICTION = 560; // px / s^2
export const JUMP_VELOCITY = -260; // px / s
// Even the lightest tap still clamps to this fraction of full jump speed —
// kept high enough that a quick tap alone clears a 2-tile pothole.
export const JUMP_CUT_MULTIPLIER = 0.58;
export const STOMP_BOUNCE_VELOCITY = -160;

export const PLAYER_WIDTH = 14;
export const PLAYER_HEIGHT = 20;
export const PLAYER_CROUCH_HEIGHT = 14;

export const MAX_LIVES = 3;
export const MAX_HEALTH = 3;
export const STAGE_TIME_SECONDS = 200; // fallback; real per-stage limits come from Level.ts
export const INVULNERABILITY_SECONDS = 1.5;
export const SPEED_BOOST_SECONDS = 8;

export const FIXED_DT = 1 / 60;

// Stages
export const STAGE_COUNT = 10;

// Slipper throw
export const THROW_COOLDOWN_SECONDS = 1.6;
export const PROJECTILE_SPEED = 210; // px / s
export const PROJECTILE_LIFETIME_SECONDS = 1.1;
export const PROJECTILE_WIDTH = 8;
export const PROJECTILE_HEIGHT = 6;

// Chief Agbero (stage 10 boss)
export const BOSS_ATTACK_INTERVAL_SECONDS = 2.2;
export const BOSS_PROJECTILE_SPEED = 130; // slower than the player's slipper — it arcs, so it needs to be dodgeable

export const STORAGE_KEYS = {
  highScore: "super-emeka:high-score",
  muted: "super-emeka:muted",
};

export type TileType =
  | "empty"
  | "ground"
  | "platform"
  | "brick"
  | "question"
  | "question-used"
  | "pothole"
  | "drainage"
  | "flagpole"
  | "danfo";

export const COLORS = {
  sky: "#4fb8e8",
  skyHorizon: "#8fd3ec",
  sunYellow: "#ffe066",
  road: "#3a3a42",
  roadLine: "#e8d94a",
  ground: "#8a5a3b",
  groundTop: "#6fbf4a",
  brick: "#c1552c",
  brickLine: "#8a3a1c",
  question: "#ffb703",
  questionUsed: "#7a5230",
  pothole: "#101014",
  drainage: "#1b3a3f",
  drainageWater: "#2e7d8c",
  flagpole: "#d9d9d9",
  danfoYellow: "#ffcc00",
  danfoBlack: "#161616",
  white: "#ffffff",
  black: "#000000",
};

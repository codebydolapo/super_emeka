import { TILE_SIZE } from "./constants";
import { isSolidTile, LevelData } from "./Level";

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export interface Movable extends AABB {
  vx: number;
  vy: number;
  onGround: boolean;
}

/**
 * Resolves horizontal movement against the solid tile grid using
 * axis-separated AABB sweeping: move on X, resolve X; then move on Y,
 * resolve Y. This is the standard tile-platformer approach and keeps
 * corner cases (landing exactly on a tile edge) stable.
 */
export function moveAndCollide(
  body: Movable,
  dt: number,
  level: LevelData,
  onBlockHitFromBelow?: (col: number, row: number) => void
) {
  // --- Horizontal ---
  body.x += body.vx * dt;
  const colDir = Math.sign(body.vx);
  if (colDir !== 0) {
    const top = Math.floor(body.y / TILE_SIZE);
    const bottom = Math.floor((body.y + body.height - 0.01) / TILE_SIZE);
    const edgeX = colDir > 0 ? body.x + body.width : body.x;
    const col = Math.floor(edgeX / TILE_SIZE);
    for (let row = top; row <= bottom; row++) {
      const tile = tileAt(level, col, row);
      if (isSolidTile(tile)) {
        if (colDir > 0) {
          body.x = col * TILE_SIZE - body.width;
        } else {
          body.x = (col + 1) * TILE_SIZE;
        }
        body.vx = 0;
        break;
      }
    }
  }

  // --- Vertical ---
  body.y += body.vy * dt;
  body.onGround = false;
  const rowDir = Math.sign(body.vy);
  if (rowDir !== 0) {
    const left = Math.floor((body.x + 1) / TILE_SIZE);
    const right = Math.floor((body.x + body.width - 1.01) / TILE_SIZE);
    const edgeY = rowDir > 0 ? body.y + body.height : body.y;
    const row = Math.floor(edgeY / TILE_SIZE);
    for (let col = left; col <= right; col++) {
      const tile = tileAt(level, col, row);
      if (isSolidTile(tile)) {
        if (rowDir > 0) {
          body.y = row * TILE_SIZE - body.height;
          body.onGround = true;
        } else {
          body.y = (row + 1) * TILE_SIZE;
          onBlockHitFromBelow?.(col, row);
        }
        body.vy = 0;
        break;
      }
    }
  }
}

function tileAt(level: LevelData, col: number, row: number): string {
  if (col < 0 || col >= level.cols) return "G"; // invisible walls at the level edges
  if (row < 0 || row >= level.rows) return " "; // open sky above / open void below
  return level.grid[row][col];
}

export function isStandingOnLedgeEnd(
  level: LevelData,
  body: AABB,
  dir: 1 | -1
): boolean {
  const footRow = Math.floor((body.y + body.height + 1) / TILE_SIZE);
  const edgeX = dir > 0 ? body.x + body.width + 1 : body.x - 1;
  const col = Math.floor(edgeX / TILE_SIZE);
  return !isSolidTile(tileAt(level, col, footRow));
}

export function isWallAhead(
  level: LevelData,
  body: AABB,
  dir: 1 | -1
): boolean {
  const midRow = Math.floor((body.y + body.height / 2) / TILE_SIZE);
  const edgeX = dir > 0 ? body.x + body.width + 1 : body.x - 1;
  const col = Math.floor(edgeX / TILE_SIZE);
  return isSolidTile(tileAt(level, col, midRow));
}

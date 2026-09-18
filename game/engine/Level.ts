import { STAGE_COUNT, TILE_SIZE } from "./constants";

export const LEVEL_ROWS = 12;

export type EntityKind = "hawker" | "agbero" | "okada" | "mosquito" | "boss" | "coin" | "suya" | "zobo";

export interface EntitySpawn {
  kind: EntityKind;
  col: number;
  row: number;
}

export interface LevelData {
  name: string;
  stageNumber: number;
  stageCount: number;
  cols: number;
  rows: number;
  grid: string[][]; // mutable tile grid, [row][col]
  entities: EntitySpawn[];
  playerStart: { x: number; y: number };
  danfoCol: number;
  widthPx: number;
  heightPx: number;
  timeLimitSeconds: number;
  enemySpeedMultiplier: number;
}

const SOLID_TILES = new Set(["G", "P", "B", "?", "X", "#"]);
export const BLOCK_TILES = new Set(["?"]);

export function isSolidTile(ch: string | undefined): boolean {
  if (!ch) return false;
  return SOLID_TILES.has(ch);
}

export function isHazardTile(ch: string | undefined): boolean {
  return ch === "O" || ch === "D";
}

// Deterministic block contents so a given stage is reproducible.
const BLOCK_CYCLE: Array<"coin" | "suya" | "zobo"> = [
  "coin",
  "coin",
  "suya",
  "coin",
  "zobo",
  "coin",
  "coin",
  "suya",
  "coin",
  "coin",
  "zobo",
  "coin",
];

export function blockContentForIndex(i: number): "coin" | "suya" | "zobo" {
  return BLOCK_CYCLE[i % BLOCK_CYCLE.length];
}

// A small seeded PRNG (mulberry32) so each stage's layout is fixed and
// reproducible instead of re-rolling on every render.
function mulberry32(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

const STOMP_ROW = (rows: number) => rows - 2; // ground-level entity spawn row
const BLOCK_ROW_LOW = (rows: number) => rows - 4; // easy single-hop height
const BLOCK_ROW_MID = (rows: number) => rows - 5; // a fuller jump
const BONUS_ROW = (rows: number) => rows - 6; // near max jump height — bonus
const BYPASS_ROW = (rows: number) => rows - 3; // low bridge over a barricade
const HOVER_ROW = (rows: number) => rows - 6; // mosquito hover height — needs a real jump to reach

// Difficulty gates for when new enemy types start appearing, expressed as a
// minimum `t` (the same 0..1 ramp everything else uses). Hawkers are always
// available; Okadas and Mosquitoes are introduced gradually so early stages
// stay simple.
const OKADA_UNLOCK_T = 0.2; // stage ~3+
const MOSQUITO_UNLOCK_T = 0.45; // stage ~5+

/**
 * Builds one procedurally generated stage. Reachability is guaranteed by
 * construction, not by luck: gaps never exceed 3 tiles (well inside the
 * ~4-tile jump range — see constants.ts), every block/coin sits 1-3 rows
 * above standing-head height, and every Agbero barricade is paired with a
 * low bridge the player can hop onto instead of fighting through.
 */
export function createLevel(stageNumber: number): LevelData {
  const stage = Math.max(1, Math.min(STAGE_COUNT, stageNumber));
  const t = (stage - 1) / Math.max(1, STAGE_COUNT - 1); // 0..1 difficulty ramp
  const rng = mulberry32(stage * 104729 + 17);

  const rows = LEVEL_ROWS;
  const cols = Math.round(110 + t * 190); // stage1 ~110, stage10 ~300
  const grid: string[][] = Array.from({ length: rows }, () => new Array(cols).fill(" "));
  grid[rows - 1].fill("G");

  const entities: EntitySpawn[] = [];
  const enemySpeedMultiplier = 1 + t * 0.6;

  const drainageChance = 0.3 + t * 0.4;
  const minSafe = Math.max(4, Math.round(9 - t * 5));
  const maxSafe = Math.max(minSafe + 3, Math.round(15 - t * 6));
  const hawkerChance = 0.35 + t * 0.35;
  const gateCount = 1 + Math.round(t * 2); // extra Agbero barricades on harder stages

  const placeBlockCluster = (col: number): number => {
    const row = rng() < 0.65 ? BLOCK_ROW_LOW(rows) : BLOCK_ROW_MID(rows);
    const pattern = rng() < 0.5 ? ["B", "?", "B", "?", "B"] : ["?", "B", "B", "?"];
    pattern.forEach((ch, i) => {
      grid[row][col + i] = ch;
    });
    return pattern.length;
  };

  const placeCoinArc = (col: number): number => {
    const bonus = rng() < 0.2;
    const row = bonus ? BONUS_ROW(rows) : rng() < 0.5 ? BLOCK_ROW_LOW(rows) : BLOCK_ROW_MID(rows);
    const count = randInt(rng, 3, 5);
    for (let i = 0; i < count; i++) entities.push({ kind: "coin", col: col + i, row });
    return count;
  };

  const placeAgberoGate = (col: number): number => {
    const width = 13;
    entities.push({ kind: "agbero", col: col + 6, row: STOMP_ROW(rows) });
    const bridgeRow = BYPASS_ROW(rows);
    for (let i = 0; i < width - 2; i++) grid[bridgeRow][col + i] = "P";
    return width;
  };

  // The stage-10 finale: a wider arena with nowhere to hop over the fight —
  // deliberately no bypass bridge, since a boss is meant to be fought, not
  // skipped. Ground stays solid the whole way through.
  const placeBossArena = (col: number): number => {
    const width = 18;
    entities.push({ kind: "boss", col: col + 9, row: STOMP_ROW(rows) });
    return width;
  };

  const placePatrolEnemy = (col: number) => {
    if (t >= OKADA_UNLOCK_T && rng() < 0.4) {
      entities.push({ kind: "okada", col, row: STOMP_ROW(rows) });
    } else {
      entities.push({ kind: "hawker", col, row: STOMP_ROW(rows) });
    }
  };

  const placeMosquito = (col: number) => {
    entities.push({ kind: "mosquito", col, row: HOVER_ROW(rows) });
  };

  const placeGap = (col: number): number => {
    const isDrainage = rng() < drainageChance;
    const width = isDrainage ? 3 : 2;
    const ch = isDrainage ? "D" : "O";
    for (let i = 0; i < width; i++) grid[rows - 1][col + i] = ch;
    return width;
  };

  // Evenly spread any extra Agbero gates (beyond the guaranteed final one)
  // across the middle of the level. Stage 10 gets a boss arena instead of a
  // regular gate at the very end, which needs a bit more room.
  const isFinalStage = stage === STAGE_COUNT;
  const startBuffer = 6;
  const finalGateWidth = isFinalStage ? 18 : 13;
  const tailReserve = finalGateWidth + 4 /* landing */ + 6 /* trailing */;
  const mainEnd = cols - tailReserve;
  const extraGates = gateCount - 1;
  const extraGateCols: number[] = [];
  for (let i = 1; i <= extraGates; i++) {
    extraGateCols.push(Math.round(startBuffer + ((mainEnd - startBuffer) * i) / (extraGates + 1)));
  }

  let col = startBuffer;
  let sinceGap = 0;
  while (col < mainEnd) {
    const nextGateCol = extraGateCols.find((g) => g >= col && g <= col + maxSafe);
    if (nextGateCol !== undefined) {
      const safeLen = nextGateCol - col;
      if (safeLen >= 3 && rng() < hawkerChance) placePatrolEnemy(col + 2);
      col = nextGateCol;
      col += placeAgberoGate(col);
      col += 4; // forced safe landing after a gate
      sinceGap = 0;
      extraGateCols.splice(extraGateCols.indexOf(nextGateCol), 1);
      continue;
    }

    const stretch = randInt(rng, minSafe, maxSafe);
    const safeLen = Math.min(stretch, mainEnd - col);
    if (safeLen >= 3) {
      const roll = rng();
      if (safeLen >= 5 && roll < 0.4) {
        placeBlockCluster(col + 1);
      } else if (safeLen >= 4 && roll < 0.75) {
        placeCoinArc(col + 1);
      }
      if (safeLen >= 4 && rng() < hawkerChance) {
        placePatrolEnemy(col + Math.floor(safeLen / 2));
      }
      if (t >= MOSQUITO_UNLOCK_T && safeLen >= 5 && rng() < 0.3) {
        placeMosquito(col + Math.floor(safeLen / 2));
      }
    }
    col += safeLen;
    sinceGap += safeLen;

    if (col < mainEnd && sinceGap >= 3) {
      col += placeGap(col);
      col += 3; // forced landing buffer so gaps never chain back-to-back
      sinceGap = 0;
    }
  }

  // Guaranteed final gate right before the goal, then a clean run-up. Stage
  // 10 gets the boss arena instead of a regular Agbero gate.
  col = Math.max(col, mainEnd);
  col += isFinalStage ? placeBossArena(col) : placeAgberoGate(col);
  col += 4;
  const danfoCol = Math.min(cols - 4, col + 1);

  const minTraverseSeconds = (cols * TILE_SIZE) / 78; // at base MOVE_SPEED
  const timeLimitSeconds = Math.round(minTraverseSeconds * 5 + 20);

  return {
    name: `Lagos Mainland Rush ${stage}`,
    stageNumber: stage,
    stageCount: STAGE_COUNT,
    cols,
    rows,
    grid,
    entities,
    playerStart: { x: 2 * TILE_SIZE, y: (rows - 3) * TILE_SIZE },
    danfoCol,
    widthPx: cols * TILE_SIZE,
    heightPx: rows * TILE_SIZE,
    timeLimitSeconds,
    enemySpeedMultiplier,
  };
}

export function tileAtWorld(level: LevelData, worldX: number, worldY: number): string {
  const col = Math.floor(worldX / TILE_SIZE);
  const row = Math.floor(worldY / TILE_SIZE);
  if (row < 0 || row >= level.rows || col < 0 || col >= level.cols) return " ";
  return level.grid[row][col];
}

export function setTileAt(level: LevelData, col: number, row: number, ch: string) {
  if (row < 0 || row >= level.rows || col < 0 || col >= level.cols) return;
  level.grid[row][col] = ch;
}

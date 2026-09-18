// Procedural pixel-art sprites.
//
// Each sprite is authored as a small grid of characters (a "pixel matrix").
// Every character maps to a color in PALETTE; '.' is transparent. This lets
// us ship crisp, hand-authored retro sprites without any binary image
// assets — everything is drawn with ctx.fillRect, and the canvas has
// image smoothing disabled so it stays perfectly crisp at any scale.
//
// Rows are built from `seg(...)` — a list of [count, char] runs — instead
// of hand-typed strings, so row widths are verified by addition rather
// than by eye (a single miscounted string silently breaks alignment).

export type PixelMatrix = string[];

export const PALETTE: Record<string, string> = {
  k: "#141414", // outline
  r: "#e2352b", // cap main
  R: "#a8241c", // cap shade / brim
  b: "#b5794a", // skin
  B: "#8a5a34", // skin shade
  w: "#ffffff", // eye highlight
  g: "#00954f", // jersey main (naija green)
  G: "#00703c", // jersey shade
  y: "#ffd400", // yellow trim / wristband / belt
  n: "#2c3d63", // trouser navy
  N: "#1f2c48", // trouser shade
  s: "#1a1a1a", // shoe
  S: "#3a3a3a", // shoe highlight
  o: "#f08a2c", // hawker shirt main
  O: "#c96a15", // hawker shirt shade
  t: "#c7c7c7", // tray
  T: "#8f8f8f", // tray shade
  v: "#565b66", // agbero vest main
  V: "#3d414a", // agbero vest shade
  c: "#ffd94a", // coin gold
  C: "#c98f00", // coin shade
  l: "#7a4a10", // coin symbol line
  p: "#8a2a5a", // zobo drink
  P: "#5c1a3c", // zobo drink shade
  i: "#dff3ff", // ice / highlight
  x: "#7a4a1c", // suya char/wood
  X: "#4a2a10", // suya dark char
  f: "#ff7a1a", // slipper sole
  F: "#3a2414", // slipper strap
};

function seg(...parts: Array<[number, string]>): string {
  return parts.map(([count, ch]) => ch.repeat(count)).join("");
}

// ---------------------------------------------------------------------
// Player — Emeka. 14 wide x 20 tall (14 tall while crouching).
//
// Proportions are deliberately spread out over more rows than a minimal
// blocky sprite would need — a narrow neck row separates the head from the
// shoulders, hands are a full 2px wider than the forearm, and the legs get
// six rows of their own — so the character reads as a person with a head,
// torso and legs instead of a single stump-shaped blob.
// ---------------------------------------------------------------------

export const PLAYER_IDLE: PixelMatrix = [
  seg([3, "."], [8, "r"], [3, "."]),
  seg([2, "."], [1, "k"], [8, "r"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "r"], [2, "R"], [3, "r"], [1, "k"], [2, "."]),
  seg([1, "."], [1, "k"], [10, "R"], [1, "k"], [1, "."]),
  seg([2, "."], [1, "k"], [8, "B"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [2, "b"], [1, "w"], [1, "k"], [4, "b"], [1, "k"], [2, "."]),
  seg([4, "."], [1, "k"], [4, "b"], [1, "k"], [4, "."]),
  seg([1, "."], [1, "k"], [1, "b"], [1, "k"], [6, "g"], [1, "k"], [1, "b"], [1, "k"], [1, "."]),
  seg([1, "."], [1, "k"], [1, "b"], [1, "k"], [2, "g"], [2, "G"], [2, "g"], [1, "k"], [1, "b"], [1, "k"], [1, "."]),
  seg([1, "."], [1, "k"], [2, "b"], [2, "g"], [2, "G"], [2, "g"], [2, "b"], [1, "k"], [1, "."]),
  seg([1, "."], [1, "k"], [1, "y"], [1, "k"], [2, "g"], [2, "G"], [2, "g"], [1, "k"], [1, "y"], [1, "k"], [1, "."]),
  seg([2, "."], [1, "k"], [8, "g"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [8, "y"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [8, "n"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "n"], [2, "."], [3, "n"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "n"], [2, "."], [3, "n"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "n"], [2, "."], [3, "n"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "N"], [2, "."], [3, "N"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "N"], [2, "."], [3, "N"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "s"], [2, "."], [3, "s"], [1, "k"], [2, "."]),
];

const PLAYER_UPPER = PLAYER_IDLE.slice(0, 14);

export const PLAYER_RUN_0: PixelMatrix = [
  ...PLAYER_UPPER,
  seg([2, "."], [1, "k"], [3, "n"], [3, "."], [3, "n"], [1, "k"], [1, "."]),
  seg([1, "."], [1, "k"], [3, "n"], [3, "."], [3, "n"], [1, "k"], [2, "."]),
  seg([1, "."], [1, "k"], [3, "n"], [3, "."], [3, "n"], [1, "k"], [2, "."]),
  seg([1, "."], [1, "k"], [3, "N"], [3, "."], [3, "N"], [1, "k"], [2, "."]),
  seg([1, "."], [1, "k"], [3, "N"], [3, "."], [3, "N"], [1, "k"], [2, "."]),
  seg([1, "."], [1, "k"], [3, "s"], [3, "."], [3, "s"], [1, "k"], [2, "."]),
];

export const PLAYER_RUN_1: PixelMatrix = [
  ...PLAYER_UPPER,
  seg([3, "."], [1, "k"], [6, "n"], [1, "k"], [3, "."]),
  seg([3, "."], [1, "k"], [6, "n"], [1, "k"], [3, "."]),
  seg([3, "."], [1, "k"], [6, "n"], [1, "k"], [3, "."]),
  seg([3, "."], [1, "k"], [6, "N"], [1, "k"], [3, "."]),
  seg([3, "."], [1, "k"], [6, "N"], [1, "k"], [3, "."]),
  seg([4, "."], [1, "k"], [4, "s"], [1, "k"], [4, "."]),
];

export const PLAYER_JUMP: PixelMatrix = [
  ...PLAYER_UPPER,
  seg([3, "."], [1, "k"], [6, "n"], [1, "k"], [3, "."]),
  seg([4, "."], [1, "k"], [4, "n"], [1, "k"], [4, "."]),
  seg([4, "."], [1, "k"], [4, "n"], [1, "k"], [4, "."]),
  seg([4, "."], [1, "k"], [4, "N"], [1, "k"], [4, "."]),
  seg([4, "."], [1, "k"], [4, "N"], [1, "k"], [4, "."]),
  seg([5, "."], [1, "k"], [2, "s"], [1, "k"], [5, "."]),
];

export const PLAYER_CROUCH: PixelMatrix = [
  seg([2, "."], [1, "k"], [8, "r"], [1, "k"], [2, "."]),
  seg([1, "."], [1, "k"], [10, "R"], [1, "k"], [1, "."]),
  seg([2, "."], [1, "k"], [2, "b"], [1, "w"], [1, "k"], [4, "b"], [1, "k"], [2, "."]),
  seg([3, "."], [1, "k"], [6, "b"], [1, "k"], [3, "."]),
  seg([1, "."], [1, "k"], [1, "b"], [1, "k"], [6, "g"], [1, "k"], [1, "b"], [1, "k"], [1, "."]),
  seg([1, "."], [1, "k"], [2, "b"], [2, "g"], [2, "G"], [2, "g"], [2, "b"], [1, "k"], [1, "."]),
  seg([1, "."], [1, "k"], [1, "y"], [1, "k"], [2, "g"], [2, "G"], [2, "g"], [1, "k"], [1, "y"], [1, "k"], [1, "."]),
  seg([2, "."], [1, "k"], [8, "y"], [1, "k"], [2, "."]),
  seg([1, "."], [1, "k"], [10, "n"], [1, "k"], [1, "."]),
  seg([1, "."], [1, "k"], [4, "n"], [2, "."], [4, "n"], [1, "k"], [1, "."]),
  seg([1, "."], [1, "k"], [4, "N"], [2, "."], [4, "N"], [1, "k"], [1, "."]),
  seg([1, "."], [1, "k"], [4, "s"], [2, "."], [4, "s"], [1, "k"], [1, "."]),
  seg([14, "."]),
  seg([14, "."]),
];

// ---------------------------------------------------------------------
// Hawker — 14 wide x 18 tall. Street food tray balanced on the head.
// ---------------------------------------------------------------------

export const HAWKER: PixelMatrix = [
  seg([2, "."], [1, "k"], [8, "t"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [1, "y"], [1, "o"], [1, "y"], [1, "o"], [1, "y"], [1, "o"], [1, "y"], [1, "o"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [8, "T"], [1, "k"], [2, "."]),
  seg([3, "."], [1, "k"], [6, "b"], [1, "k"], [3, "."]),
  seg([3, "."], [1, "k"], [2, "b"], [1, "w"], [3, "b"], [1, "k"], [3, "."]),
  seg([3, "."], [1, "k"], [6, "b"], [1, "k"], [3, "."]),
  seg([4, "."], [1, "k"], [4, "b"], [1, "k"], [4, "."]),
  seg([1, "."], [1, "k"], [1, "b"], [1, "k"], [6, "o"], [1, "k"], [1, "b"], [1, "k"], [1, "."]),
  seg([1, "."], [1, "k"], [1, "b"], [1, "k"], [2, "o"], [2, "O"], [2, "o"], [1, "k"], [1, "b"], [1, "k"], [1, "."]),
  seg([1, "."], [1, "k"], [2, "b"], [2, "o"], [2, "O"], [2, "o"], [2, "b"], [1, "k"], [1, "."]),
  seg([2, "."], [1, "k"], [8, "o"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [8, "n"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "n"], [2, "."], [3, "n"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "n"], [2, "."], [3, "n"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "N"], [2, "."], [3, "N"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "N"], [2, "."], [3, "N"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "s"], [2, "."], [3, "s"], [1, "k"], [2, "."]),
  seg([14, "."]),
];

// ---------------------------------------------------------------------
// Agbero — 14 wide x 20 tall. Bandana, vest, arms crossed like a barricade.
// ---------------------------------------------------------------------

export const AGBERO: PixelMatrix = [
  seg([3, "."], [8, "r"], [3, "."]),
  seg([2, "."], [1, "k"], [8, "r"], [1, "k"], [2, "."]),
  seg([1, "."], [1, "k"], [10, "R"], [1, "k"], [1, "."]),
  seg([2, "."], [1, "k"], [8, "B"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [2, "b"], [1, "w"], [1, "k"], [4, "b"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [8, "b"], [1, "k"], [2, "."]),
  seg([4, "."], [1, "k"], [4, "b"], [1, "k"], [4, "."]),
  seg([1, "."], [1, "k"], [1, "b"], [1, "k"], [6, "v"], [1, "k"], [1, "b"], [1, "k"], [1, "."]),
  seg([1, "k"], [2, "b"], [1, "k"], [1, "V"], [4, "v"], [1, "V"], [1, "k"], [2, "b"], [1, "k"]),
  seg([1, "k"], [2, "b"], [1, "k"], [6, "v"], [1, "k"], [2, "b"], [1, "k"]),
  seg([1, "."], [1, "k"], [1, "b"], [1, "k"], [1, "y"], [4, "v"], [1, "y"], [1, "k"], [1, "b"], [1, "k"], [1, "."]),
  seg([2, "."], [1, "k"], [8, "v"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [8, "y"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [8, "n"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "n"], [2, "."], [3, "n"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "n"], [2, "."], [3, "n"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "n"], [2, "."], [3, "n"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "N"], [2, "."], [3, "N"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "N"], [2, "."], [3, "N"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [3, "s"], [2, "."], [3, "s"], [1, "k"], [2, "."]),
];

// ---------------------------------------------------------------------
// Naira coin — 10 wide x 10 tall, two spin frames.
// ---------------------------------------------------------------------

export const COIN_0: PixelMatrix = [
  seg([3, "."], [4, "k"], [3, "."]),
  seg([2, "."], [1, "k"], [4, "c"], [1, "k"], [2, "."]),
  seg([1, "k"], [8, "c"], [1, "k"]),
  seg([1, "k"], [2, "c"], [1, "l"], [2, "C"], [1, "l"], [2, "c"], [1, "k"]),
  seg([1, "k"], [2, "c"], [1, "l"], [2, "C"], [1, "l"], [2, "c"], [1, "k"]),
  seg([1, "k"], [2, "c"], [1, "l"], [2, "C"], [1, "l"], [2, "c"], [1, "k"]),
  seg([1, "k"], [8, "c"], [1, "k"]),
  seg([2, "."], [1, "k"], [4, "C"], [1, "k"], [2, "."]),
  seg([3, "."], [4, "k"], [3, "."]),
  seg([10, "."]),
];

export const COIN_1: PixelMatrix = [
  seg([10, "."]),
  seg([3, "."], [4, "k"], [3, "."]),
  seg([4, "."], [1, "c"], [1, "C"], [4, "."]),
  seg([4, "."], [1, "c"], [1, "l"], [4, "."]),
  seg([4, "."], [1, "l"], [1, "C"], [4, "."]),
  seg([4, "."], [1, "c"], [1, "l"], [4, "."]),
  seg([4, "."], [1, "C"], [1, "c"], [4, "."]),
  seg([3, "."], [4, "k"], [3, "."]),
  seg([10, "."]),
  seg([10, "."]),
];

// ---------------------------------------------------------------------
// Suya skewer — 12 wide x 10 tall.
// ---------------------------------------------------------------------

export const SUYA: PixelMatrix = [
  seg([2, "."], [1, "x"], [6, "."], [1, "x"], [2, "."]),
  seg([2, "."], [1, "x"], [6, "."], [1, "x"], [2, "."]),
  seg([1, "."], [1, "k"], [8, "k"], [1, "."], [1, "."]),
  seg([1, "k"], [2, "X"], [2, "O"], [2, "X"], [2, "O"], [2, "X"], [1, "k"]),
  seg([1, "k"], [2, "O"], [2, "X"], [2, "O"], [2, "X"], [2, "O"], [1, "k"]),
  seg([1, "k"], [2, "X"], [2, "O"], [2, "X"], [2, "O"], [2, "X"], [1, "k"]),
  seg([1, "k"], [2, "O"], [2, "X"], [2, "O"], [2, "X"], [2, "O"], [1, "k"]),
  seg([1, "."], [1, "k"], [8, "k"], [1, "."], [1, "."]),
  seg([12, "."]),
  seg([12, "."]),
];

// ---------------------------------------------------------------------
// Cold Zobo — 10 wide x 12 tall.
// ---------------------------------------------------------------------

export const ZOBO: PixelMatrix = [
  seg([4, "."], [1, "k"], [1, "."], [4, "."]),
  seg([4, "."], [1, "k"], [1, "."], [4, "."]),
  seg([2, "."], [1, "k"], [4, "i"], [1, "k"], [2, "."]),
  seg([1, "k"], [8, "p"], [1, "k"]),
  seg([1, "k"], [1, "p"], [2, "i"], [2, "p"], [3, "P"], [1, "k"]),
  seg([1, "k"], [8, "p"], [1, "k"]),
  seg([1, "k"], [2, "P"], [4, "p"], [2, "P"], [1, "k"]),
  seg([1, "k"], [8, "P"], [1, "k"]),
  seg([2, "."], [1, "k"], [4, "P"], [1, "k"], [2, "."]),
  seg([2, "."], [1, "k"], [4, "k"], [1, "k"], [2, "."]),
  seg([10, "."]),
  seg([10, "."]),
];

// ---------------------------------------------------------------------
// Thrown slipper — the player's projectile. 8 wide x 6 tall.
// ---------------------------------------------------------------------

export const SLIPPER: PixelMatrix = [
  seg([2, "."], [1, "F"], [2, "."], [1, "F"], [2, "."]),
  seg([3, "."], [2, "F"], [3, "."]),
  seg([1, "."], [6, "f"], [1, "."]),
  seg([8, "f"]),
  seg([8, "f"]),
  seg([1, "."], [6, "k"], [1, "."]),
];

// A small bouncing "goal here" marker drawn above the level's target
// (the Danfo bus) so it always reads as the prize to head for.
export const GOAL_ARROW: PixelMatrix = [
  seg([3, "."], [1, "k"], [3, "."]),
  seg([3, "."], [1, "y"], [3, "."]),
  seg([3, "."], [1, "y"], [3, "."]),
  seg([1, "k"], [5, "y"], [1, "k"]),
  seg([1, "."], [1, "k"], [3, "y"], [1, "k"], [1, "."]),
  seg([2, "."], [1, "k"], [1, "y"], [1, "k"], [2, "."]),
  seg([3, "."], [1, "k"], [3, "."]),
];

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  matrix: PixelMatrix,
  x: number,
  y: number,
  flipX = false,
  alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const h = matrix.length;
  for (let row = 0; row < h; row++) {
    const line = matrix[row];
    const w = line.length;
    for (let col = 0; col < w; col++) {
      const ch = line[col];
      if (ch === "." || ch === undefined) continue;
      const color = PALETTE[ch];
      if (!color) continue;
      const px = flipX ? w - 1 - col : col;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x + px), Math.round(y + row), 1, 1);
    }
  }
  ctx.restore();
}

export function spriteSize(matrix: PixelMatrix): { w: number; h: number } {
  return { w: matrix[0]?.length ?? 0, h: matrix.length };
}

// A hand-authored pixel "?" glyph for the question blocks — drawn as
// individual pixels instead of ctx.fillText so it stays perfectly crisp
// (canvas text rendering is anti-aliased and looks out of place next to
// hard-edged pixel art).
export const QUESTION_GLYPH: PixelMatrix = [
  ".###.",
  "#...#",
  "....#",
  "...#.",
  "..#..",
  ".....",
  "..#..",
];

export function drawMonoGlyph(
  ctx: CanvasRenderingContext2D,
  matrix: PixelMatrix,
  x: number,
  y: number,
  color: string
) {
  ctx.fillStyle = color;
  for (let row = 0; row < matrix.length; row++) {
    const line = matrix[row];
    for (let col = 0; col < line.length; col++) {
      if (line[col] !== ".") ctx.fillRect(Math.round(x + col), Math.round(y + row), 1, 1);
    }
  }
}

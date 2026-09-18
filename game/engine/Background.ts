import { VIEW_HEIGHT, VIEW_WIDTH } from "./constants";

// Procedural parallax background: Lagos skyline silhouettes, the Third
// Mainland Bridge, market stalls, and streetlights. Everything is drawn
// with simple layered shapes driven by camera.x * parallaxFactor so nothing
// needs to be loaded as an image asset.

function wrap(x: number, period: number) {
  return ((x % period) + period) % period;
}

const BUILDING_PALETTES = [
  { body: "#6fa8c9", window: "#fff3b0" },
  { body: "#82b7d4", window: "#ffe08a" },
  { body: "#5f97ba", window: "#fff7d6" },
];

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number
) {
  // Sky: warm horizon fading into a clear blue overhead — a Lagos morning.
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  grad.addColorStop(0, "#3f9fdc");
  grad.addColorStop(0.55, "#7ec8e8");
  grad.addColorStop(1, "#cdeaf2");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  // Sun with a soft double-halo.
  ctx.fillStyle = "rgba(255,235,150,0.35)";
  ctx.beginPath();
  ctx.arc(258, 28, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe97a";
  ctx.beginPath();
  ctx.arc(258, 28, 12, 0, Math.PI * 2);
  ctx.fill();

  drawClouds(ctx, camX);
  drawSkyline(ctx, camX);
  drawBridge(ctx, camX);
  drawDistantDanfo(ctx, camX, time);
  drawStallsAndLights(ctx, camX);
}

function drawClouds(ctx: CanvasRenderingContext2D, camX: number) {
  const parallax = 0.08;
  const period = 130;
  const offset = wrap(camX * parallax, period);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  for (let i = -1; i < VIEW_WIDTH / period + 2; i++) {
    const cx = i * period - offset;
    const cy = 20 + ((i * 23) % 14);
    ctx.fillRect(cx, cy, 20, 5);
    ctx.fillRect(cx + 5, cy - 3, 14, 4);
    ctx.fillRect(cx + 10, cy + 5, 12, 3);
  }
}

function drawSkyline(ctx: CanvasRenderingContext2D, camX: number) {
  const parallax = 0.15;
  const offset = camX * parallax;
  const period = 46;
  const baseY = VIEW_HEIGHT - 66;

  for (let i = -1; i < VIEW_WIDTH / period + 2; i++) {
    const bx = i * period - wrap(offset, period);
    const palette = BUILDING_PALETTES[((i % 3) + 3) % 3];
    const bh = 34 + ((i * 29) % 26);
    const bw = 30;
    const by = baseY - bh;

    ctx.fillStyle = palette.body;
    ctx.fillRect(bx, by, bw, bh);

    // Roof cap + the odd rooftop water tank, a common Lagos skyline detail.
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(bx, by, bw, 2);
    if (i % 2 === 0) {
      ctx.fillStyle = "#3a3a42";
      ctx.fillRect(bx + bw / 2 - 3, by - 5, 6, 5);
    }

    // Clean window grid (deterministic per building, not per-pixel noise).
    ctx.fillStyle = palette.window;
    for (let wy = 6; wy < bh - 4; wy += 7) {
      for (let wx = 4; wx < bw - 4; wx += 7) {
        const lit = (wx + wy + i * 5) % 3 !== 0;
        if (lit) ctx.fillRect(bx + wx, by + wy, 3, 4);
      }
    }
  }
}

function drawBridge(ctx: CanvasRenderingContext2D, camX: number) {
  // The Third Mainland Bridge: a continuous deck with evenly spaced piers
  // running down to the lagoon, and a simple railing sitting on the deck —
  // one coherent structure instead of loose floating marks.
  const parallax = 0.32;
  const offset = camX * parallax;
  const deckY = VIEW_HEIGHT - 58;
  const waterY = VIEW_HEIGHT - 40;

  ctx.fillStyle = "#bcd8e6";
  ctx.fillRect(0, deckY + 6, VIEW_WIDTH, waterY - (deckY + 6));

  const pierPeriod = 26;
  ctx.fillStyle = "#7f8a94";
  for (let i = -1; i < VIEW_WIDTH / pierPeriod + 2; i++) {
    const px = i * pierPeriod - wrap(offset, pierPeriod);
    ctx.fillRect(px, deckY + 6, 3, waterY - (deckY + 6));
  }

  ctx.fillStyle = "#5b6570";
  ctx.fillRect(0, deckY, VIEW_WIDTH, 6);

  const railPeriod = 10;
  ctx.fillStyle = "#8d99a6";
  for (let i = -1; i < VIEW_WIDTH / railPeriod + 2; i++) {
    const rx = i * railPeriod - wrap(offset, railPeriod);
    ctx.fillRect(rx, deckY - 5, 2, 5);
  }
  ctx.fillRect(0, deckY - 5, VIEW_WIDTH, 1);
}

function drawStallsAndLights(ctx: CanvasRenderingContext2D, camX: number) {
  const parallax = 0.55;
  const offset = camX * parallax;
  const period = 90;
  const baseY = VIEW_HEIGHT - 40;

  for (let i = -1; i < VIEW_WIDTH / period + 2; i++) {
    const sx = i * period - wrap(offset, period);

    // Streetlight: pole + lamp housing + a soft glow.
    ctx.fillStyle = "rgba(255,230,120,0.25)";
    ctx.beginPath();
    ctx.arc(sx + 11, baseY - 40, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2c2c34";
    ctx.fillRect(sx + 10, baseY - 34, 2, 34);
    ctx.fillRect(sx + 6, baseY - 38, 10, 3);
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(sx + 7, baseY - 41, 8, 4);

    // Market stall: roof, awning stripes, counter, goods.
    ctx.fillStyle = "#00733e";
    ctx.fillRect(sx + 32, baseY - 22, 46, 5);
    ctx.fillStyle = "#5c3a1a";
    ctx.fillRect(sx + 35, baseY - 4, 3, 4);
    ctx.fillRect(sx + 72, baseY - 4, 3, 4);
    ctx.fillStyle = "#8a5a3b";
    ctx.fillRect(sx + 33, baseY - 4, 44, 4);

    for (let stripe = 0; stripe < 40; stripe += 8) {
      ctx.fillStyle = (stripe / 8) % 2 === 0 ? "#ffffff" : "#00954f";
      ctx.fillRect(sx + 35 + stripe, baseY - 17, 8, 13);
    }
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(sx + 33, baseY - 17, 44, 2);

    // A little produce on the counter for life.
    ctx.fillStyle = "#e07a1f";
    ctx.fillRect(sx + 40, baseY - 8, 4, 4);
    ctx.fillStyle = "#d62828";
    ctx.fillRect(sx + 46, baseY - 7, 3, 3);
    ctx.fillStyle = "#ffd400";
    ctx.fillRect(sx + 60, baseY - 8, 4, 3);
  }
}

export function drawRoadStrip(ctx: CanvasRenderingContext2D, camX: number) {
  const y = VIEW_HEIGHT - 8;
  ctx.fillStyle = "#333338";
  ctx.fillRect(0, y, VIEW_WIDTH, 8);
  ctx.fillStyle = "#26262b";
  ctx.fillRect(0, y, VIEW_WIDTH, 2);

  ctx.fillStyle = "#e8d94a";
  const period = 16;
  const offset = wrap(camX, period);
  for (let i = -1; i < VIEW_WIDTH / period + 2; i++) {
    ctx.fillRect(i * period - offset, y + 3, 8, 2);
  }
}

function drawDistantDanfo(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  const parallax = 0.4;
  const period = 160;
  const offset = wrap(camX * parallax + time * 7, period);
  const x = VIEW_WIDTH - offset;
  const y = VIEW_HEIGHT - 78;

  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(x, y + 3, 30, 9);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x, y + 9, 30, 2);
  ctx.fillStyle = "#bcd8e6";
  ctx.fillRect(x + 3, y, 8, 4);
  ctx.fillRect(x + 19, y, 8, 4);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x + 2, y + 12, 6, 3);
  ctx.fillRect(x + 22, y + 12, 6, 3);
}

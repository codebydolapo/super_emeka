"use client";

import MuteButton from "./MuteButton";

interface Props {
  highScore: number;
  muted: boolean;
  onToggleMute: () => void;
  onPlay: () => void;
  onHowToPlay: () => void;
}

interface CloudSpec {
  top: string;
  scale: number;
  duration: number;
  delay: number;
  opacity: number;
}

// Simple blocky pixel-cloud shape (three offset rects, same silhouette the
// in-game canvas background uses) drifting right-to-left forever, so the
// menu reads as a living sky rather than a static poster — the same idea
// as the drifting clouds in the classic side-scrollers this is patterned
// after.
function PixelCloud({ top, scale, duration, delay, opacity }: CloudSpec) {
  return (
    <div
      className="absolute left-full pointer-events-none"
      style={{
        top,
        opacity,
        animation: `drift-cloud ${duration}s linear ${delay}s infinite`,
      }}
    >
      <div className="relative" style={{ width: 64 * scale, height: 24 * scale }}>
        <div
          className="absolute bg-white"
          style={{ left: 0, top: 10 * scale, width: 40 * scale, height: 10 * scale }}
        />
        <div
          className="absolute bg-white"
          style={{ left: 10 * scale, top: 0, width: 28 * scale, height: 12 * scale }}
        />
        <div
          className="absolute bg-white"
          style={{ left: 20 * scale, top: 14 * scale, width: 24 * scale, height: 8 * scale }}
        />
      </div>
    </div>
  );
}

const CLOUDS: CloudSpec[] = [
  { top: "8%", scale: 1.3, duration: 26, delay: 0, opacity: 0.95 },
  { top: "18%", scale: 0.8, duration: 34, delay: -14, opacity: 0.75 },
  { top: "4%", scale: 0.6, duration: 40, delay: -6, opacity: 0.6 },
  { top: "26%", scale: 1, duration: 30, delay: -22, opacity: 0.85 },
];

export default function StartScreen({
  highScore,
  muted,
  onToggleMute,
  onPlay,
  onHowToPlay,
}: Props) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-gradient-to-b from-sky-400 via-sky-300 to-naija-green overflow-hidden px-4 py-6">
      {/* Sun with a slow, gentle pulse — cheap, but it keeps the whole
          scene from feeling like a frozen screenshot. */}
      <div
        className="absolute rounded-full bg-naija-yellow/70"
        style={{ top: "6%", right: "12%", width: 56, height: 56, animation: "sun-pulse 4s ease-in-out infinite" }}
      />

      {CLOUDS.map((cloud, i) => (
        <PixelCloud key={i} {...cloud} />
      ))}

      <div className="absolute top-3 right-3 z-20">
        <MuteButton muted={muted} onToggle={onToggleMute} />
      </div>

      {/* decorative pixel skyline */}
      <div className="absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-naija-green-dark [clip-path:polygon(0%_40%,5%_40%,5%_20%,10%_20%,10%_40%,20%_40%,20%_10%,25%_10%,25%_40%,40%_40%,40%_25%,45%_25%,45%_40%,60%_40%,60%_15%,66%_15%,66%_40%,80%_40%,80%_30%,86%_30%,86%_40%,100%_40%,100%_100%,0%_100%)]" />

      <div className="flex flex-col items-center gap-3 mt-6 sm:mt-10 z-10">
        <h1 className="text-2xl sm:text-4xl text-center text-shadow-pixel text-naija-yellow tracking-wider leading-relaxed">
          SUPER
          <br />
          EMEKA
        </h1>
        <p className="text-[10px] sm:text-xs text-center text-white text-shadow-pixel max-w-xs leading-relaxed">
          A retro pixel platformer on the streets of Lagos 🇳🇬
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 z-10 w-full max-w-xs">
        <div className="pixel-border bg-black/70 text-naija-yellow text-[10px] sm:text-xs px-4 py-2 text-center">
          HIGH SCORE: {highScore.toString().padStart(6, "0")}
        </div>

        <button
          onClick={onPlay}
          className="btn-pixel btn-pixel-yellow w-full py-3.5 text-xs sm:text-sm"
        >
          ▶ PLAY GAME
        </button>
        <button
          onClick={onHowToPlay}
          className="btn-pixel btn-pixel-white w-full py-3.5 text-xs sm:text-sm"
        >
          ❓ HOW TO PLAY
        </button>
      </div>

      <p className="text-[8px] sm:text-[10px] text-white/90 text-shadow-pixel z-10 mb-1 text-center">
        Board the Danfo to clear the stage!
      </p>
    </div>
  );
}

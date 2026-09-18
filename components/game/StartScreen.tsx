"use client";

import MuteButton from "./MuteButton";

interface Props {
  highScore: number;
  muted: boolean;
  onToggleMute: () => void;
  onPlay: () => void;
  onHowToPlay: () => void;
}

export default function StartScreen({
  highScore,
  muted,
  onToggleMute,
  onPlay,
  onHowToPlay,
}: Props) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-gradient-to-b from-sky-400 via-sky-300 to-naija-green overflow-hidden px-4 py-6">
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
          className="w-full py-3 bg-naija-yellow text-black text-xs sm:text-sm border-2 border-black shadow-[4px_4px_0_#000] active:translate-y-1 active:shadow-none transition-transform"
        >
          ▶ PLAY GAME
        </button>
        <button
          onClick={onHowToPlay}
          className="w-full py-3 bg-white text-black text-xs sm:text-sm border-2 border-black shadow-[4px_4px_0_#000] active:translate-y-1 active:shadow-none transition-transform"
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

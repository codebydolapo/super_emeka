"use client";

import { HudState } from "@/game/types";
import { MAX_HEALTH } from "@/game/engine/constants";
import MuteButton from "./MuteButton";

interface Props {
  hud: HudState;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export default function HUD({ hud, muted, onToggleMute, onPause }: Props) {
  return (
    <div className="absolute inset-0 z-30 p-2 sm:p-3 flex flex-col gap-1 pointer-events-none">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 bg-black/60 border-2 border-black px-2 py-1 pointer-events-auto">
          <div className="flex items-center gap-2 text-[9px] sm:text-[11px] text-white">
            <span className="text-red-500">♥</span>
            <span>
              {"❤".repeat(hud.health)}
              {"♡".repeat(Math.max(0, MAX_HEALTH - hud.health))}
            </span>
            <span className="text-naija-yellow ml-2">x{hud.lives}</span>
          </div>
          <div className="text-[9px] sm:text-[11px] text-naija-yellow">
            ₦ {hud.naira.toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="bg-black/60 border-2 border-black px-2 py-0.5 text-[9px] sm:text-[11px] text-white pointer-events-auto">
            STAGE <span className="text-naija-yellow">{hud.stage}</span>/{hud.stageCount}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2 pointer-events-auto">
            <MuteButton muted={muted} onToggle={onToggleMute} />
            <button
              onClick={onPause}
              aria-label="Pause"
              className="flex items-center justify-center w-10 h-10 border-2 border-black bg-white text-black shadow-[3px_3px_0_#000] active:translate-y-0.5 active:shadow-none"
            >
              ⏸
            </button>
          </div>
          <div className="bg-black/60 border-2 border-black px-2 py-1 text-[9px] sm:text-[11px] text-white text-right pointer-events-auto">
            <div>⏱ {hud.timeLeft}s</div>
            <div className="text-naija-yellow">HI {hud.highScore}</div>
          </div>
        </div>
      </div>

      {hud.speedBoostActive && (
        <div className="self-center bg-[#7a1f4b] border-2 border-black text-white text-[9px] sm:text-[11px] px-2 py-0.5 animate-pulse">
          🥤 ZOBO SPEED BOOST!
        </div>
      )}

      {hud.banner && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="pixel-border bg-[#0f2a1a]/95 px-5 py-4 text-center animate-pulse">
            <div className="text-naija-yellow text-sm sm:text-base mb-2">{hud.banner.title}</div>
            <div className="text-white text-[9px] sm:text-[11px]">{hud.banner.subtitle}</div>
          </div>
        </div>
      )}
    </div>
  );
}

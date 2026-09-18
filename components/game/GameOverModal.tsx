"use client";

import { EndSummary } from "@/game/types";

interface Props {
  summary: EndSummary;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

const REASON_TEXT: Record<string, string> = {
  time: "Time's up! The Danfo left without you.",
  lives: "You ran out of lives on the Lagos streets.",
};

export default function GameOverModal({ summary, onPlayAgain, onMainMenu }: Props) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
      <div className="pixel-border bg-[#2a0f0f] w-full max-w-xs p-5 text-white text-center space-y-3">
        <h2 className="text-base sm:text-lg text-red-400">GAME OVER</h2>
        <p className="text-[9px] sm:text-[11px] text-white/80">
          {REASON_TEXT[summary.reason ?? "lives"] ?? "Better luck next time!"}
        </p>

        <div className="text-[10px] sm:text-xs space-y-1 bg-black/40 p-3 my-2">
          <div className="flex justify-between">
            <span>Stage Reached</span>
            <span className="text-naija-yellow">
              {summary.stage} / {summary.stageCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Score</span>
            <span className="text-naija-yellow">{summary.score}</span>
          </div>
          <div className="flex justify-between">
            <span>Naira Collected</span>
            <span className="text-naija-yellow">₦{summary.naira}</span>
          </div>
          {summary.isNewHighScore && (
            <div className="text-center text-naija-green animate-pulse mt-1">
              🏆 NEW HIGH SCORE!
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={onPlayAgain} className="btn-pixel btn-pixel-yellow w-full py-3 text-xs">
            🔁 PLAY AGAIN
          </button>
          <button onClick={onMainMenu} className="btn-pixel btn-pixel-white w-full py-3 text-xs">
            🏠 MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

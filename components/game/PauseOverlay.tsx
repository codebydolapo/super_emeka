"use client";

interface Props {
  onResume: () => void;
  onMainMenu: () => void;
}

export default function PauseOverlay({ onResume, onMainMenu }: Props) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
      <div className="pixel-border bg-[#12122a] w-full max-w-xs p-5 text-white text-center space-y-4">
        <h2 className="text-base sm:text-lg text-naija-yellow">PAUSED</h2>
        <div className="flex flex-col gap-2">
          <button onClick={onResume} className="btn-pixel btn-pixel-yellow w-full py-3 text-xs">
            ▶ RESUME
          </button>
          <button onClick={onMainMenu} className="btn-pixel btn-pixel-white w-full py-3 text-xs">
            🏠 MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

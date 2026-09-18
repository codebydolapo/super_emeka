"use client";

interface Props {
  muted: boolean;
  onToggle: () => void;
  className?: string;
}

export default function MuteButton({ muted, onToggle, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={muted ? "Unmute audio" : "Mute audio"}
      className={`flex items-center justify-center w-10 h-10 border-2 border-black bg-naija-yellow text-black shadow-[3px_3px_0_#000] active:translate-y-0.5 active:shadow-none transition-transform ${className}`}
    >
      <span className="text-base leading-none select-none">
        {muted ? "🔇" : "🔊"}
      </span>
    </button>
  );
}

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
      className={`btn-pixel btn-pixel-yellow flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 ${className}`}
    >
      <span className="text-base leading-none select-none">
        {muted ? "🔇" : "🔊"}
      </span>
    </button>
  );
}

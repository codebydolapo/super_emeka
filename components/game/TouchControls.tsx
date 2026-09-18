"use client";

import { useCallback, useRef } from "react";
import { TouchPart } from "@/game/engine/Input";

interface Props {
  onTouch: (part: TouchPart, pressed: boolean) => void;
}

function useHoldButton(onTouch: (part: TouchPart, pressed: boolean) => void, part: TouchPart) {
  const active = useRef(false);

  const start = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (active.current) return;
      active.current = true;
      onTouch(part, true);
    },
    [onTouch, part]
  );

  const end = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (!active.current) return;
      active.current = false;
      onTouch(part, false);
    },
    [onTouch, part]
  );

  return {
    onPointerDown: start,
    onPointerUp: end,
    onPointerLeave: end,
    onPointerCancel: end,
  };
}

function PadButton({
  onTouch,
  part,
  children,
  className = "",
}: {
  onTouch: (part: TouchPart, pressed: boolean) => void;
  part: TouchPart;
  children?: React.ReactNode;
  className?: string;
}) {
  const handlers = useHoldButton(onTouch, part);
  return (
    <button
      type="button"
      {...handlers}
      className={`relative select-none flex items-center justify-center touch-none transition-transform duration-75 active:scale-90 active:brightness-75 ${className}`}
      style={{ WebkitUserSelect: "none" }}
    >
      {/* Glossy top-lit highlight, purely decorative */}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/20 via-white/0 to-black/20" />
      <span className="relative">{children}</span>
    </button>
  );
}

// Matte black plastic shell shared by both control clusters — a subtle
// sheen instead of gloss, matching a worn Game Boy Pocket case rather than
// a shiny toy.
const SHELL =
  "pointer-events-auto bg-gradient-to-b from-[#2b2b2e] to-[#0c0c0d] rounded-2xl border border-black shadow-[0_5px_0_rgba(0,0,0,0.7),0_6px_14px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]";

const PAD_FACE = "bg-gradient-to-b from-[#3c3c3e] to-[#18181a] text-[#cfcfd2]";

export default function TouchControls({ onTouch }: Props) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 px-5 sm:px-8 flex items-end justify-between pointer-events-none select-none"
      style={{ paddingBottom: "max(1.1rem, env(safe-area-inset-bottom, 0px))" }}
    >
      {/* D-pad, Game Boy Pocket style */}
      <div className={`${SHELL} p-2.5`}>
        <div className="grid grid-cols-3 grid-rows-3 w-[112px] h-[112px] gap-[2px]">
          <div />
          <PadButton onTouch={onTouch} part="crouch" className={`col-start-2 row-start-1 rounded-t-lg ${PAD_FACE}`}>
            <span className="text-lg">▼</span>
          </PadButton>
          <div />
          <PadButton onTouch={onTouch} part="left" className={`col-start-1 row-start-2 rounded-l-lg ${PAD_FACE}`}>
            <span className="text-lg">◀</span>
          </PadButton>
          <div className={`col-start-2 row-start-2 ${PAD_FACE}`} />
          <PadButton onTouch={onTouch} part="right" className={`col-start-3 row-start-2 rounded-r-lg ${PAD_FACE}`}>
            <span className="text-lg">▶</span>
          </PadButton>
          <div />
          <div className={`col-start-2 row-start-3 rounded-b-lg ${PAD_FACE}`} />
          <div />
        </div>
      </div>

      {/* A / B buttons — close together with a slight diagonal stagger,
          matching a real Game Boy Pocket's layout (Select/Start omitted;
          this is a two-button game). Blank matte caps with a small
          function label printed below, the way the real thing prints
          "A"/"B" below the buttons rather than on them. */}
      <div className={`${SHELL} px-5 pt-4 pb-3`}>
        <div className="relative w-[104px] h-[58px]">
          <div className="absolute left-0 bottom-0 flex flex-col items-center gap-1.5">
            <PadButton onTouch={onTouch} part="throw" className={`w-12 h-12 rounded-full ${PAD_FACE}`} />
            <span className="text-[7px] font-bold text-[#c23a72] tracking-wide">THROW</span>
          </div>
          <div className="absolute right-0 top-0 flex flex-col items-center gap-1.5">
            <PadButton onTouch={onTouch} part="jump" className={`w-12 h-12 rounded-full ${PAD_FACE}`} />
            <span className="text-[7px] font-bold text-[#c23a72] tracking-wide">JUMP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

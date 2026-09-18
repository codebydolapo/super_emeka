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
  children: React.ReactNode;
  className?: string;
}) {
  const handlers = useHoldButton(onTouch, part);
  return (
    <button
      type="button"
      {...handlers}
      className={`relative select-none flex items-center justify-center touch-none transition-transform duration-75 active:scale-90 active:brightness-90 ${className}`}
      style={{ WebkitUserSelect: "none" }}
    >
      {/* Glossy top-lit highlight, purely decorative */}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/25 via-white/0 to-black/10" />
      <span className="relative">{children}</span>
    </button>
  );
}

export default function TouchControls({ onTouch }: Props) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 px-4 sm:px-6 flex items-end justify-between pointer-events-none select-none"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Game Boy-style cross D-pad on a dark plastic shell */}
      <div className="pointer-events-auto bg-gradient-to-b from-[#4a4a57] to-[#2a2a32] p-2.5 rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.6),0_4px_10px_rgba(0,0,0,0.4)] border-2 border-black/60">
        <div className="grid grid-cols-3 grid-rows-3 w-[120px] h-[120px] gap-[2px]">
          <div />
          <PadButton
            onTouch={onTouch}
            part="crouch"
            className="col-start-2 row-start-1 rounded-t-lg text-white bg-gradient-to-b from-[#26262e] to-[#151519]"
          >
            <span className="text-lg">▼</span>
          </PadButton>
          <div />
          <PadButton
            onTouch={onTouch}
            part="left"
            className="col-start-1 row-start-2 rounded-l-lg text-white bg-gradient-to-b from-[#26262e] to-[#151519]"
          >
            <span className="text-lg">◀</span>
          </PadButton>
          <div className="col-start-2 row-start-2 bg-gradient-to-b from-[#26262e] to-[#151519]" />
          <PadButton
            onTouch={onTouch}
            part="right"
            className="col-start-3 row-start-2 rounded-r-lg text-white bg-gradient-to-b from-[#26262e] to-[#151519]"
          >
            <span className="text-lg">▶</span>
          </PadButton>
          <div />
          <div className="col-start-2 row-start-3 rounded-b-lg bg-gradient-to-b from-[#26262e] to-[#151519]" />
          <div />
        </div>
      </div>

      {/* A / B action buttons, Game Boy style */}
      <div className="pointer-events-auto bg-gradient-to-b from-[#4a4a57] to-[#2a2a32] px-4 pt-3 pb-3.5 rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.6),0_4px_10px_rgba(0,0,0,0.4)] border-2 border-black/60">
        <div className="relative w-[136px] h-[84px]">
          <PadButton
            onTouch={onTouch}
            part="throw"
            className="absolute left-0 bottom-0 w-16 h-16 rounded-full text-sm font-bold text-white bg-gradient-to-b from-[#ff7a6b] via-[#e0453a] to-[#a8241c] border-2 border-black/50"
          >
            B
          </PadButton>
          <PadButton
            onTouch={onTouch}
            part="jump"
            className="absolute right-0 top-0 w-16 h-16 rounded-full text-sm font-bold text-white bg-gradient-to-b from-[#ff7a6b] via-[#e0453a] to-[#a8241c] border-2 border-black/50"
          >
            A
          </PadButton>
        </div>
        <div className="flex justify-between mt-1 px-1 text-[7px] text-white/70 tracking-wide">
          <span>SLIPPER</span>
          <span>JUMP</span>
        </div>
      </div>
    </div>
  );
}

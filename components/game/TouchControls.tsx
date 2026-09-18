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
      className={`select-none flex items-center justify-center touch-none active:brightness-90 ${className}`}
      style={{ WebkitUserSelect: "none" }}
    >
      {children}
    </button>
  );
}

export default function TouchControls({ onTouch }: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 p-3 sm:p-5 flex items-end justify-between pointer-events-none select-none">
      {/* Game Boy-style cross D-pad on a dark plastic shell */}
      <div className="pointer-events-auto bg-[#3a3a45] p-2.5 rounded-2xl shadow-[3px_3px_0_rgba(0,0,0,0.5)] border-2 border-black/60">
        <div className="grid grid-cols-3 grid-rows-3 w-[108px] h-[108px]">
          <div />
          <PadButton onTouch={onTouch} part="crouch" className="col-start-2 row-start-1 bg-[#1c1c22] text-white rounded-t-md">
            ▼
          </PadButton>
          <div />
          <PadButton onTouch={onTouch} part="left" className="col-start-1 row-start-2 bg-[#1c1c22] text-white rounded-l-md">
            ◀
          </PadButton>
          <div className="col-start-2 row-start-2 bg-[#1c1c22]" />
          <PadButton onTouch={onTouch} part="right" className="col-start-3 row-start-2 bg-[#1c1c22] text-white rounded-r-md">
            ▶
          </PadButton>
          <div />
          <div className="col-start-2 row-start-3 bg-[#1c1c22] rounded-b-md" />
          <div />
        </div>
      </div>

      {/* A / B action buttons, Game Boy style */}
      <div className="pointer-events-auto bg-[#3a3a45] px-4 pt-3 pb-4 rounded-2xl shadow-[3px_3px_0_rgba(0,0,0,0.5)] border-2 border-black/60">
        <div className="relative w-[130px] h-[78px]">
          <PadButton
            onTouch={onTouch}
            part="throw"
            className="absolute left-0 bottom-0 w-14 h-14 rounded-full text-[10px] font-bold text-white bg-[#c0392b] border-2 border-black/50 shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
          >
            B
          </PadButton>
          <PadButton
            onTouch={onTouch}
            part="jump"
            className="absolute right-0 top-0 w-14 h-14 rounded-full text-[10px] font-bold text-white bg-[#c0392b] border-2 border-black/50 shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
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

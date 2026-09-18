"use client";

import React, { useCallback, useRef, useState } from "react";

// Assuming TouchPart type includes: "left" | "right" | "jump" | "crouch" | "throw"
export type TouchPart = "left" | "right" | "jump" | "crouch" | "throw";

interface Props {
  onTouch: (part: TouchPart, pressed: boolean) => void;
}

// Shell & retro styling
const SHELL =
  "pointer-events-auto bg-gradient-to-b from-[#2b2b2e] to-[#0c0c0d] rounded-3xl border border-black/80 shadow-[0_6px_0_rgba(0,0,0,0.8),0_10px_20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm";

const PAD_FACE =
  "bg-gradient-to-b from-[#3c3c3e] to-[#18181a] text-[#cfcfd2] active:from-[#252527] active:to-[#0f0f10]";

/**
 * Enhanced Standalone Action Button (A/B style) with Touch Pointer ID Tracking
 */
function ActionButton({
  onTouch,
  part,
  label,
  className = "",
}: {
  onTouch: (part: TouchPart, pressed: boolean) => void;
  part: TouchPart;
  label: string;
  className?: string;
}) {
  const pointerIdRef = useRef<number | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pointerIdRef.current !== null) return;

    pointerIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsPressed(true);
    onTouch(part, true);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerIdRef.current) return;
    e.preventDefault();
    pointerIdRef.current = null;
    setIsPressed(false);
    onTouch(part, false);
  };

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative touch-none flex items-center justify-center w-14 h-14 rounded-full transition-transform duration-75 ${PAD_FACE} ${
          isPressed ? "scale-90 brightness-75 shadow-inner" : "shadow-[0_4px_0_rgba(0,0,0,0.6)]"
        } ${className}`}
        style={{ WebkitUserSelect: "none", touchAction: "none" }}
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/15 via-transparent to-black/30" />
      </button>
      <span className="text-[9px] font-black text-[#d6457d] tracking-wider uppercase drop-shadow-[0_1px_0_rgba(0,0,0,0.8)]">
        {label}
      </span>
    </div>
  );
}

/**
 * Continuous D-Pad with sliding touch gesture resolution
 */
function DPad({ onTouch }: Props) {
  const padRef = useRef<HTMLDivElement>(null);
  const activePartRef = useRef<TouchPart | null>(null);

  const updateDirection = useCallback(
    (clientX: number, clientY: number) => {
      if (!padRef.current) return;

      const rect = padRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);

      // Deadzone threshold (within 15% of center radius)
      const deadzone = rect.width * 0.15;
      let newPart: TouchPart | null = null;

      if (distance > deadzone) {
        // Calculate angle relative to center
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        if (angle >= -45 && angle < 45) {
          newPart = "right";
        } else if (angle >= 45 && angle < 135) {
          newPart = "crouch";
        } else if (angle >= -135 && angle < -45) {
          newPart = "jump";
        } else {
          newPart = "left";
        }
      }

      if (activePartRef.current !== newPart) {
        if (activePartRef.current) {
          onTouch(activePartRef.current, false);
        }
        if (newPart) {
          onTouch(newPart, true);
        }
        activePartRef.current = newPart;
      }
    },
    [onTouch]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateDirection(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePartRef.current !== null) {
      updateDirection(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (activePartRef.current) {
      onTouch(activePartRef.current, false);
      activePartRef.current = null;
    }
  };

  const currentPart = activePartRef.current;

  return (
    <div
      ref={padRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-36 h-36 touch-none select-none flex items-center justify-center cursor-pointer"
      style={{ touchAction: "none", WebkitUserSelect: "none" }}
    >
      {/* D-Pad Base Visual */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-1">
        {/* Top / Jump */}
        <div
          className={`col-start-2 row-start-1 rounded-t-xl flex items-center justify-center transition-colors ${PAD_FACE} ${
            currentPart === "jump" ? "brightness-150 bg-neutral-700" : ""
          }`}
        >
          <span className="text-xs">▲</span>
        </div>
        {/* Left */}
        <div
          className={`col-start-1 row-start-2 rounded-l-xl flex items-center justify-center transition-colors ${PAD_FACE} ${
            currentPart === "left" ? "brightness-150 bg-neutral-700" : ""
          }`}
        >
          <span className="text-xs">◀</span>
        </div>
        {/* Center Pivot */}
        <div className={`col-start-2 row-start-2 ${PAD_FACE} flex items-center justify-center`}>
          <div className="w-3 h-3 rounded-full bg-black/40 inset-shadow-sm" />
        </div>
        {/* Right */}
        <div
          className={`col-start-3 row-start-2 rounded-r-xl flex items-center justify-center transition-colors ${PAD_FACE} ${
            currentPart === "right" ? "brightness-150 bg-neutral-700" : ""
          }`}
        >
          <span className="text-xs">▶</span>
        </div>
        {/* Bottom / Crouch */}
        <div
          className={`col-start-2 row-start-3 rounded-b-xl flex items-center justify-center transition-colors ${PAD_FACE} ${
            currentPart === "crouch" ? "brightness-150 bg-neutral-700" : ""
          }`}
        >
          <span className="text-xs">▼</span>
        </div>
      </div>
    </div>
  );
}

export default function TouchControls({ onTouch }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-4 sm:px-10 flex items-end justify-between pointer-events-none select-none mb-12"
      style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}
    >
      {/* Left Control Cluster: D-pad */}
      <div className={`p-3`}>
        <DPad onTouch={onTouch} />
      </div>

      {/* Right Control Cluster: Action Buttons */}
      <div className={` px-6 py-5`}>
        <div className="relative w-36 h-28 flex items-center justify-between">
          <div className="absolute left-0 bottom-0">
            <ActionButton onTouch={onTouch} part="throw" label="Throw" />
          </div>
          <div className="absolute right-0 top-0">
            <ActionButton onTouch={onTouch} part="jump" label="Jump" />
          </div>
        </div>
      </div>
    </div>
  );
}
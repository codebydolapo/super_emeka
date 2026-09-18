"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { GameEngine } from "@/game/engine/GameEngine";
import { AudioManager } from "@/game/audio/AudioManager";
import { EndSummary, HudState } from "@/game/types";
import { VIEW_HEIGHT, VIEW_WIDTH } from "@/game/engine/constants";
import { TouchPart } from "@/game/engine/Input";

export interface GameCanvasHandle {
  setTouch: (part: TouchPart, pressed: boolean) => void;
  pause: () => void;
  resume: () => void;
}

interface Props {
  audio: AudioManager;
  onHud: (hud: HudState) => void;
  onEnd: (phase: "gameover" | "levelclear", summary: EndSummary) => void;
}

const GameCanvas = forwardRef<GameCanvasHandle, Props>(function GameCanvas(
  { audio, onHud, onEnd },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      setTouch: (part, pressed) => engineRef.current?.setTouch(part, pressed),
      pause: () => engineRef.current?.pause(),
      resume: () => engineRef.current?.resume(),
    }),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = VIEW_WIDTH;
    canvas.height = VIEW_HEIGHT;

    const engine = new GameEngine(canvas, audio, { onHud, onEnd });
    engineRef.current = engine;
    engine.start();

    const handleVisibility = () => {
      if (document.hidden) engine.pause();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      engine.destroy();
      engineRef.current = null;
    };
    // Engine is intentionally created once per mount; the parent remounts
    // this component (via a `key`) to start a fresh run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scale the fixed-resolution canvas to fill its container.
  //
  // The internal resolution (320x180) is landscape, but a phone held in
  // portrait is roughly the opposite shape — fitting the full width means
  // most of the screen above and below the canvas goes to waste as black
  // bars. Instead of always showing the complete width ("contain"), this
  // biases toward filling the screen ("cover") and lets the wrapper's
  // `overflow-hidden` clip a bit of the world off the left/right edges —
  // capped at `maxCropFraction` so a portrait phone doesn't crop away so
  // much that gameplay near the edges disappears. On a roughly-matching
  // aspect ratio (landscape phones, tablets, desktop) this converges to
  // the same full-width fit as before, with no cropping at all.
  //
  // Integer scaling on top of that keeps pixel art perfectly crisp when
  // it doesn't cost much size; below a small penalty, fill the screen
  // instead even if that means fractional-pixel scaling.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const maxCropFraction = 0.22;

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      // The wrapper's own top padding (used to push the canvas down below
      // the HUD on mobile — see the JSX below) isn't reflected in
      // getBoundingClientRect(), so it has to be subtracted by hand or the
      // canvas gets sized for more height than is actually available and
      // ends up cropped further than the cap intends.
      const paddingTop = parseFloat(window.getComputedStyle(wrapper).paddingTop) || 0;
      const availableHeight = Math.max(1, rect.height - paddingTop);
      const widthScale = rect.width / VIEW_WIDTH;
      const heightScale = availableHeight / VIEW_HEIGHT;
      const containScale = Math.min(widthScale, heightScale);
      const coverScale = Math.max(widthScale, heightScale);
      const cropCap = containScale / (1 - maxCropFraction);
      const rawScale = Math.min(coverScale, cropCap);

      const intScale = Math.floor(rawScale);
      const keepsEnoughSize = intScale >= 1 && intScale / rawScale >= 0.85;
      const scale = keepsEnoughSize ? intScale : rawScale;
      canvas.style.width = `${VIEW_WIDTH * scale}px`;
      canvas.style.height = `${VIEW_HEIGHT * scale}px`;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    window.addEventListener("orientationchange", resize);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", resize);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      // Below `sm`, the game area is the full (uncapped) mobile viewport
      // height — centering the canvas in all of that leaves a big dead gap
      // above it (behind the HUD) and another below (behind the touch
      // controls). Anchoring to the top instead, with just enough padding
      // to clear the HUD, pulls the actual game screen up where it's
      // wanted. At `sm:` and up the game area is already the tidy 900x600
      // capped box, so it goes back to simple centering.
      className="absolute inset-0 flex items-start sm:items-center justify-center bg-black overflow-hidden pt-14 sm:pt-0"
    >
      <canvas
        ref={canvasRef}
        className="pixelated"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
});

export default GameCanvas;

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

  // Integer-scale the fixed-resolution canvas to fill its container while
  // keeping pixel art perfectly crisp at any viewport size.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const rawScale = Math.min(rect.width / VIEW_WIDTH, rect.height / VIEW_HEIGHT);
      const intScale = Math.floor(rawScale);
      const scale = intScale >= 1 ? intScale : rawScale;
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
      className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden"
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

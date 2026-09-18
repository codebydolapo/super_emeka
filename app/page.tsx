"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StartScreen from "@/components/game/StartScreen";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import GameCanvas, { GameCanvasHandle } from "@/components/game/GameCanvas";
import HUD from "@/components/game/HUD";
import TouchControls from "@/components/game/TouchControls";
import PauseOverlay from "@/components/game/PauseOverlay";
import GameOverModal from "@/components/game/GameOverModal";
import StageClearModal from "@/components/game/StageClearModal";
import { AudioManager } from "@/game/audio/AudioManager";
import { EndSummary, GamePhase, HudState } from "@/game/types";
import { STAGE_COUNT, STAGE_TIME_SECONDS } from "@/game/engine/constants";
import { getHighScore } from "@/game/utils/storage";
import { TouchPart } from "@/game/engine/Input";

const DEFAULT_HUD: HudState = {
  lives: 3,
  health: 3,
  naira: 0,
  timeLeft: STAGE_TIME_SECONDS,
  highScore: 0,
  score: 0,
  speedBoostActive: false,
  levelName: "Lagos Mainland Rush",
  stage: 1,
  stageCount: STAGE_COUNT,
  throwReadyRatio: 1,
  banner: null,
};

export default function Home() {
  const audioRef = useRef<AudioManager | null>(null);
  if (!audioRef.current) audioRef.current = new AudioManager();
  const audio = audioRef.current;

  const canvasHandleRef = useRef<GameCanvasHandle>(null);
  const lastHudRef = useRef<HudState>(DEFAULT_HUD);

  const [phase, setPhase] = useState<GamePhase>("start");
  const [gameKey, setGameKey] = useState(0);
  const [hud, setHud] = useState<HudState>(DEFAULT_HUD);
  const [endSummary, setEndSummary] = useState<EndSummary | null>(null);
  const [muted, setMuted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setMuted(audio.isMuted);
    setHud((h) => ({ ...h, highScore: getHighScore() }));

    // Not every mobile/tablet browser reports a coarse pointer or touch
    // points reliably, so a narrow viewport is treated as its own signal —
    // any one of these being true is enough to show the on-screen controls.
    const detectTouch = () => {
      const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
      const hasTouchPoints = navigator.maxTouchPoints > 0;
      const hasTouchEvents = "ontouchstart" in window;
      const narrowViewport = window.innerWidth <= 900;
      setIsTouchDevice(coarse || hasTouchPoints || hasTouchEvents || narrowViewport);
    };

    detectTouch();
    window.addEventListener("resize", detectTouch);
    window.addEventListener("orientationchange", detectTouch);
    return () => {
      window.removeEventListener("resize", detectTouch);
      window.removeEventListener("orientationchange", detectTouch);
    };
  }, [audio]);

  const handleHud = useCallback((next: HudState) => {
    const prev = lastHudRef.current;
    // throwReadyRatio changes every frame while charging but isn't shown in
    // the DOM (it's drawn on the canvas above the player), so it's excluded
    // here to avoid re-rendering React on every animation frame.
    const changed =
      prev.lives !== next.lives ||
      prev.health !== next.health ||
      prev.naira !== next.naira ||
      prev.timeLeft !== next.timeLeft ||
      prev.highScore !== next.highScore ||
      prev.score !== next.score ||
      prev.speedBoostActive !== next.speedBoostActive ||
      prev.stage !== next.stage ||
      prev.banner !== next.banner;
    if (changed) {
      lastHudRef.current = next;
      setHud(next);
    }
  }, []);

  const handleEnd = useCallback((endPhase: "gameover" | "levelclear", summary: EndSummary) => {
    setEndSummary(summary);
    setPhase(endPhase);
  }, []);

  const startRun = useCallback(() => {
    audio.ensureContext();
    lastHudRef.current = DEFAULT_HUD;
    setHud({ ...DEFAULT_HUD, highScore: getHighScore() });
    setEndSummary(null);
    setGameKey((k) => k + 1);
    setPhase("playing");
  }, [audio]);

  const handleToggleMute = useCallback(() => {
    audio.ensureContext();
    setMuted(audio.toggleMute());
  }, [audio]);

  const handlePause = useCallback(() => {
    canvasHandleRef.current?.pause();
    setPhase("paused");
  }, []);

  const handleResume = useCallback(() => {
    canvasHandleRef.current?.resume();
    setPhase("playing");
  }, []);

  const handleMainMenu = useCallback(() => {
    setPhase("start");
  }, []);

  const handleTouch = useCallback((part: TouchPart, pressed: boolean) => {
    canvasHandleRef.current?.setTouch(part, pressed);
  }, []);

  const showGame = phase === "playing" || phase === "paused" || phase === "gameover" || phase === "levelclear";

  return (
    <main className="fixed inset-0 w-full h-full bg-[#0a0a12] overflow-hidden flex items-center justify-center">
      <div className="relative w-full h-full max-w-[900px] max-h-[600px] scanlines">
        {phase === "start" && (
          <StartScreen
            highScore={hud.highScore}
            muted={muted}
            onToggleMute={handleToggleMute}
            onPlay={startRun}
            onHowToPlay={() => setPhase("howtoplay")}
          />
        )}

        {phase === "howtoplay" && <HowToPlayModal onBack={() => setPhase("start")} />}

        {showGame && (
          <>
            <GameCanvas
              key={gameKey}
              ref={canvasHandleRef}
              audio={audio}
              onHud={handleHud}
              onEnd={handleEnd}
            />
            <HUD hud={hud} muted={muted} onToggleMute={handleToggleMute} onPause={handlePause} />
            {isTouchDevice && phase === "playing" && <TouchControls onTouch={handleTouch} />}

            {phase === "paused" && (
              <PauseOverlay onResume={handleResume} onMainMenu={handleMainMenu} />
            )}
            {phase === "gameover" && endSummary && (
              <GameOverModal summary={endSummary} onPlayAgain={startRun} onMainMenu={handleMainMenu} />
            )}
            {phase === "levelclear" && endSummary && (
              <StageClearModal summary={endSummary} onPlayAgain={startRun} onMainMenu={handleMainMenu} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

export type GamePhase =
  | "start"
  | "howtoplay"
  | "playing"
  | "paused"
  | "gameover"
  | "levelclear";

export interface StageBanner {
  title: string;
  subtitle: string;
}

export interface HudState {
  lives: number;
  health: number;
  naira: number;
  timeLeft: number;
  highScore: number;
  score: number;
  speedBoostActive: boolean;
  levelName: string;
  stage: number;
  stageCount: number;
  throwReadyRatio: number; // 0..1, 1 = ready to throw
  banner: StageBanner | null;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean; // edge-triggered, consumed by engine
  crouch: boolean;
  throwPressed: boolean; // edge-triggered, consumed by engine
}

export interface EndSummary {
  score: number;
  naira: number;
  timeLeft: number;
  isNewHighScore: boolean;
  reason?: "time" | "lives" | "danfo";
  stage: number;
  stageCount: number;
}

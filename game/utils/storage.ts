import { STORAGE_KEYS } from "../engine/constants";

export function getHighScore(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_KEYS.highScore);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function setHighScoreIfBetter(score: number): boolean {
  if (typeof window === "undefined") return false;
  const current = getHighScore();
  if (score > current) {
    window.localStorage.setItem(STORAGE_KEYS.highScore, String(score));
    return true;
  }
  return false;
}

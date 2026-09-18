import {
  BASS_PATTERN,
  LEAD_PATTERN,
  PERC_PATTERN,
  STEP_SECONDS,
  noteFreq,
} from "./chiptunes";
import { STORAGE_KEYS } from "../engine/constants";

type OscType = OscillatorType;

/**
 * Zero-asset 8-bit audio engine built on the Web Audio API. Music and every
 * sound effect are synthesized on the fly (oscillators + a generated noise
 * buffer for percussion/stomp/hit sounds), so there are no binary audio
 * files to load — perfect for instant, zero-latency playback and a tiny
 * bundle size.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private muted = false;
  private musicPlaying = false;
  private schedulerTimer: number | null = null;
  private nextStepTime = 0;
  private stepIndex = 0;
  private readonly lookahead = 0.12;
  private autoResumeAttached = false;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEYS.muted);
      this.muted = saved === "1";
    }
  }

  get isMuted() {
    return this.muted;
  }

  /** Must be called from within a user-gesture handler (click/touch/key). */
  ensureContext() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new Ctor();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 1;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.22;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.masterGain);

    this.noiseBuffer = this.createNoiseBuffer();
  }

  /**
   * Browsers only let an AudioContext start/resume from inside a user
   * gesture. We already call `ensureContext()` from the Play and Mute
   * button handlers, which covers the common case — but some browsers
   * (mobile Safari especially) are stricter about what counts as "close
   * enough" to the gesture, and can leave the context stuck in
   * `suspended` even after that call. This is a safety net: it listens
   * for the next handful of interaction types anywhere on the page and
   * retries the resume, so audio recovers on the player's very next tap,
   * click, or key press instead of staying silent for the whole session.
   */
  attachAutoResume() {
    if (this.autoResumeAttached || typeof window === "undefined") return;
    this.autoResumeAttached = true;
    const tryResume = () => {
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    };
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchend"];
    for (const evt of events) window.addEventListener(evt, tryResume);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : 1,
        this.ctx!.currentTime,
        0.02
      );
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.muted, this.muted ? "1" : "0");
    }
    return this.muted;
  }

  private createNoiseBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // ---------------------------------------------------------------------
  // Music sequencer
  // ---------------------------------------------------------------------

  startMusic() {
    this.ensureContext();
    if (this.musicPlaying || !this.ctx) return;
    this.musicPlaying = true;
    this.stepIndex = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.scheduleLoop();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.schedulerTimer !== null) {
      window.clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  private scheduleLoop = () => {
    if (!this.musicPlaying || !this.ctx) return;
    while (this.nextStepTime < this.ctx.currentTime + this.lookahead) {
      this.scheduleStep(this.stepIndex, this.nextStepTime);
      this.nextStepTime += STEP_SECONDS;
      this.stepIndex++;
    }
    this.schedulerTimer = window.setTimeout(this.scheduleLoop, 40);
  };

  private patternStepAt(pattern: { note: string | null; steps: number }[], stepIndex: number) {
    const total = pattern.reduce((sum, n) => sum + n.steps, 0);
    let idx = stepIndex % total;
    for (const n of pattern) {
      if (idx < n.steps) return n;
      idx -= n.steps;
    }
    return pattern[0];
  }

  private scheduleStep(stepIndex: number, time: number) {
    const lead = this.patternStepAt(LEAD_PATTERN, stepIndex);
    if (lead.note && this.isStepStart(LEAD_PATTERN, stepIndex)) {
      this.playSynthNote(this.musicGain!, noteFreq(lead.note), time, lead.steps * STEP_SECONDS * 0.85, "square", 0.5);
    }

    const bass = this.patternStepAt(BASS_PATTERN, stepIndex);
    if (bass.note && this.isStepStart(BASS_PATTERN, stepIndex)) {
      this.playSynthNote(this.musicGain!, noteFreq(bass.note), time, bass.steps * STEP_SECONDS * 0.9, "triangle", 0.7);
    }

    const perc = PERC_PATTERN[stepIndex % PERC_PATTERN.length];
    if (perc === 1) this.playKick(time);
    else if (perc === 2) this.playShaker(time);
    else if (perc === 3) this.playClave(time);
  }

  private isStepStart(pattern: { note: string | null; steps: number }[], stepIndex: number) {
    const total = pattern.reduce((sum, n) => sum + n.steps, 0);
    let idx = stepIndex % total;
    for (const n of pattern) {
      if (idx === 0) return true;
      if (idx < n.steps) return false;
      idx -= n.steps;
    }
    return false;
  }

  private playSynthNote(
    dest: GainNode,
    freq: number,
    time: number,
    duration: number,
    type: OscType,
    volume: number
  ) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private playKick(time: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  private noiseBurst(dest: GainNode, time: number, duration: number, volume: number, filterFreq: number) {
    const ctx = this.ctx!;
    if (!this.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(time);
    src.stop(time + duration + 0.02);
  }

  private playShaker(time: number) {
    this.noiseBurst(this.musicGain!, time, 0.06, 0.25, 4000);
  }

  private playClave(time: number) {
    this.playSynthNote(this.musicGain!, 1800, time, 0.05, "square", 0.15);
  }

  // ---------------------------------------------------------------------
  // Sound effects
  // ---------------------------------------------------------------------

  playJump() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.15);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  playCoin() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [988, 1319].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(f, t + i * 0.07);
      gain.gain.setValueAtTime(0.25, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.2);
    });
  }

  playThrow() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.12);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playPowerUp() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, t + i * 0.09);
      gain.gain.setValueAtTime(0.3, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.16);
    });
  }

  playStomp() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.14);
    this.noiseBurst(this.sfxGain!, t, 0.08, 0.2, 800);
  }

  playHurt() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.25);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  playGameOver() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [392, 349, 330, 262];
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(f, t + i * 0.22);
      gain.gain.setValueAtTime(0.3, t + i * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.22 + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.22);
      osc.stop(t + i * 0.22 + 0.32);
    });
  }

  playLevelComplete() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [523, 523, 523, 659, 784, 1046, 1318];
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, t + i * 0.13);
      gain.gain.setValueAtTime(0.3, t + i * 0.13);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.13 + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.13);
      osc.stop(t + i * 0.13 + 0.22);
    });
  }

  playBlockBump() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.06);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.09);
  }
}

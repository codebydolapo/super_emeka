// Original 8-bit style composition data (not a transcription of any
// copyrighted melody) — a bouncy platformer lead with an Afrobeat-flavored
// syncopated percussion pattern. Notes are scientific pitch notation;
// `null` is a rest. Durations are in "steps" at the sequencer's step length.

export interface NoteStep {
  note: string | null;
  steps: number;
}

export const STEP_SECONDS = 0.135;

// Lead melody (square wave), loops.
export const LEAD_PATTERN: NoteStep[] = [
  { note: "E4", steps: 1 },
  { note: "E4", steps: 1 },
  { note: null, steps: 1 },
  { note: "E4", steps: 1 },
  { note: null, steps: 1 },
  { note: "C4", steps: 1 },
  { note: "E4", steps: 1 },
  { note: null, steps: 1 },
  { note: "G4", steps: 2 },
  { note: null, steps: 2 },
  { note: "G3", steps: 2 },
  { note: null, steps: 2 },

  { note: "C4", steps: 1 },
  { note: null, steps: 1 },
  { note: "G3", steps: 1 },
  { note: null, steps: 1 },
  { note: "E3", steps: 1 },
  { note: null, steps: 1 },
  { note: "A3", steps: 1 },
  { note: "B3", steps: 1 },
  { note: "Bb3", steps: 1 },
  { note: "A3", steps: 1 },
  { note: null, steps: 1 },

  { note: "G3", steps: 1 },
  { note: "E4", steps: 1 },
  { note: "G4", steps: 1 },
  { note: "A4", steps: 1 },
  { note: null, steps: 1 },
  { note: "F4", steps: 1 },
  { note: "G4", steps: 1 },
  { note: null, steps: 1 },
  { note: "E4", steps: 1 },
  { note: null, steps: 1 },
  { note: "C4", steps: 1 },
  { note: "D4", steps: 1 },
  { note: "B3", steps: 1 },
  { note: null, steps: 2 },
];

// Bass (triangle wave) — walking, syncopated Afrobeat-ish feel.
export const BASS_PATTERN: NoteStep[] = [
  { note: "C3", steps: 2 },
  { note: null, steps: 1 },
  { note: "C3", steps: 1 },
  { note: "G2", steps: 2 },
  { note: null, steps: 1 },
  { note: "G2", steps: 1 },
  { note: "A2", steps: 2 },
  { note: null, steps: 1 },
  { note: "A2", steps: 1 },
  { note: "F2", steps: 2 },
  { note: null, steps: 1 },
  { note: "F2", steps: 1 },
  { note: "G2", steps: 2 },
  { note: null, steps: 1 },
  { note: "G2", steps: 1 },
  { note: "C3", steps: 4 },
];

// Percussion pattern: 0 = rest, 1 = kick (low thump), 2 = shaker/hat
// (short noise burst), 3 = clave-like tick — the syncopation gives it an
// Afrobeat drum-pattern feel over a straightforward 8-bit backbeat.
export const PERC_PATTERN: number[] = [
  1, 2, 3, 2, 1, 2, 0, 2, 1, 2, 3, 2, 0, 2, 3, 2,
];

export const NOTE_FREQUENCIES: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  const names = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  for (let octave = 1; octave <= 6; octave++) {
    names.forEach((name, i) => {
      const midi = (octave + 1) * 12 + i;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      map[`${name}${octave}`] = freq;
    });
  }
  return map;
})();

export function noteFreq(note: string): number {
  return NOTE_FREQUENCIES[note] ?? 440;
}

const LETTER_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// "C#4" -> { letter, sharp, octave, step (diatonic staff position), midi }
export function parseNote(name) {
  const m = /^([A-G])(#?)(\d)$/.exec(name);
  if (!m) throw new Error(`Invalid note name: "${name}" (expected like C4 or F#3)`);
  const [, letter, sharp, oct] = m;
  const octave = Number(oct);
  return {
    name, letter, sharp: sharp === '#', octave,
    step: octave * 7 + LETTER_INDEX[letter],
    midi: (octave + 1) * 12 + SEMITONE[letter] + (sharp ? 1 : 0),
  };
}
export const toFrequency = (name) => 440 * 2 ** ((parseNote(name).midi - 69) / 12);

// Pure game state (no React/canvas). Times in seconds; song notes are [noteName, startBeat, durationBeats].
export const WINDOW = { perfect: 0.07, good: 0.15 };
const POINTS = { perfect: 100, good: 50 };

export function createState(song) {
  const spb = 60 / song.bpm;
  return {
    notes: song.notes.map(([n, beat, dur = 1]) => ({ n, time: beat * spb, dur: dur * spb, result: null })),
    score: 0, combo: 0, bestCombo: 0, counts: { perfect: 0, good: 0, miss: 0 }, last: null,
  };
}

function register(s, note, result, now) {
  note.result = result;
  s.counts[result]++;
  s.last = { result, at: now };
  if (result === 'miss') { s.combo = 0; return; }
  s.combo++;
  s.bestCombo = Math.max(s.bestCombo, s.combo);
  s.score += POINTS[result] * (1 + Math.floor(s.combo / 10)); // streak multiplier
}

export function press(s, noteName, now) {
  const target = s.notes
    .filter((x) => x.n === noteName && !x.result && Math.abs(x.time - now) <= WINDOW.good)
    .sort((a, b) => Math.abs(a.time - now) - Math.abs(b.time - now))[0];
  if (!target) { s.combo = 0; s.last = { result: 'wrong', at: now }; return; }
  register(s, target, Math.abs(target.time - now) <= WINDOW.perfect ? 'perfect' : 'good', now);
}

export function update(s, now) {
  for (const x of s.notes) if (!x.result && now - x.time > WINDOW.good) register(s, x, 'miss', now);
}

export const isFinished = (s, now) =>
  s.notes.every((x) => x.result) && now > Math.max(...s.notes.map((x) => x.time)) + 1;

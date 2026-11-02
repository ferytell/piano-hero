// QWERTY key -> note. Home row = white keys, row above = black keys (like a piano).
export const DEFAULT_KEYMAP = {
  a: 'C4', w: 'C#4', s: 'D4', e: 'D#4', d: 'E4', f: 'F4', t: 'F#4',
  g: 'G4', y: 'G#4', h: 'A4', u: 'A#4', j: 'B4', k: 'C5', l: 'D5', ';': 'E5',
};
const STORAGE_KEY = 'piano-hero-keymap';

// Future "remap keys" screen: build a new map and call saveKeymap(map).
export function loadKeymap() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_KEYMAP; }
  catch { return DEFAULT_KEYMAP; }
}
export const saveKeymap = (map) => localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
export const invertKeymap = (map) => Object.fromEntries(Object.entries(map).map(([k, n]) => [n, k]));

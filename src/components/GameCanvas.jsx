import { useEffect, useRef } from 'react';
import { createState, press, update, isFinished } from '../game/engine';
import { draw, pianoNoteAt } from '../game/render';
import { parseNote } from '../game/music';
import { invertKeymap } from '../config/keymap';
import { playNote } from '../audio/synth';

const LEAD_IN = 3; // countdown seconds before the first beat

export default function GameCanvas({ song, mode, keymap, onFinish, onExit }) {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d');
    const state = createState(song), start = performance.now();
    const now = () => (performance.now() - start) / 1000 - LEAD_IN;
    const keyOf = invertKeymap(keymap);
    const pianoNotes = [...new Set(Object.values(keymap))].sort((a, b) => parseNote(a).midi - parseNote(b).midi);
    const lanes = pianoNotes;
    const opts = { mode, lanes, keyOf, pianoNotes };
    let raf;

    const onKey = (e) => {
      if (e.key === 'Escape') return onExit();
      const note = keymap[e.key.toLowerCase()];
      if (e.repeat || !note) return;
      playNote(note); press(state, note, now());
    };
    const onPointerDown = (e) => {
      const bounds = canvas.getBoundingClientRect();
      const x = (e.clientX - bounds.left) * (canvas.width / bounds.width);
      const y = (e.clientY - bounds.top) * (canvas.height / bounds.height);
      const note = pianoNoteAt(x, y, canvas.width, canvas.height, pianoNotes);
      if (!note) return;
      e.preventDefault();
      playNote(note); press(state, note, now());
    };
    const loop = () => {
      const t = now();
      if (canvas.width !== canvas.clientWidth) canvas.width = canvas.clientWidth;
      if (canvas.height !== canvas.clientHeight) canvas.height = canvas.clientHeight;
      update(state, t); draw(ctx, canvas.width, canvas.height, state, t, opts);
      if (isFinished(state, t)) return onFinish(state);
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('pointerdown', onPointerDown);
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [song, mode, keymap, onFinish, onExit]);

  return <canvas ref={ref} className="game" />;
}

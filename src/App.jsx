import { useEffect, useMemo, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import { MODES } from './config/modes';
import { loadKeymap } from './config/keymap';
import { parseNote } from './game/music';

const base = import.meta.env.BASE_URL;
const getJson = async (path) => (await fetch(`${base}${path}`)).json();
// songs/index.json lists song files; each file is one song (see README).
const loadSongs = async () => Promise.all((await getJson('songs/index.json')).map(async (f) => ({ id: f, ...(await getJson(`songs/${f}`)) })));

export default function App() {
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState();
  const [song, setSong] = useState(null);
  const [mode, setMode] = useState(MODES[0].id);
  const [result, setResult] = useState(null);
  const keymap = useMemo(loadKeymap, []);
  useEffect(() => { loadSongs().then(setSongs).catch((e) => setError(String(e))); }, []);

  if (song && !result) return <GameCanvas song={song} mode={mode} keymap={keymap} onFinish={setResult} onExit={() => setSong(null)} />;

  if (result) return (
    <main>
      <h1>{song.title}</h1>
      <p>Score <b>{result.score}</b> · Best streak <b>{result.bestCombo}</b></p>
      <p>Perfect {result.counts.perfect} · Good {result.counts.good} · Missed {result.counts.miss}</p>
      <button onClick={() => setResult(null)}>Retry</button>
      <button onClick={() => { setResult(null); setSong(null); }}>Menu</button>
    </main>
  );

  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">◆ YOUR LITTLE PIANO STUDIO ◆</p>
        <h1><span aria-hidden="true">♫</span> PIANO HERO</h1>
        <p>Pick a tune, find your rhythm, and play along.</p>
      </header>
      <section className="controls">
        <label>Practice stage{' '}
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <div className="key-guide">
          <strong>PLAY WITH YOUR KEYBOARD OR THE PIANO KEYS</strong>
          <div className="keymap-grid" aria-label="Piano note and keyboard mapping">
            {Object.entries(keymap)
              .sort(([, a], [, b]) => parseNote(a).midi - parseNote(b).midi)
              .map(([key, note]) => (
                <span className={`keymap-item${note.includes('#') ? ' is-sharp' : ''}`} key={key}>
                  <b>{note}</b><kbd>{key.toUpperCase()}</kbd>
                </span>
              ))}
          </div>
          <p>Press the matching letter or click a piano key · Esc exits a song</p>
        </div>
      </section>
      {error && <p className="error">Could not load songs: {error}</p>}
      <section className="song-section" aria-label="Choose a song">
        <div className="section-heading">
          <h2>Choose a song</h2>
          <span>{songs.length} {songs.length === 1 ? 'tune' : 'tunes'}</span>
        </div>
        <ul className="song-grid">
          {songs.map((s) => (
            <li key={s.id}>
              <button className="song-card" onClick={() => setSong(s)}>
                <span className="song-icon" aria-hidden="true">♫</span>
                <span className="song-info">
                  <strong>{s.title}</strong>
                  <small>{s.artist ?? 'Unknown'} · {s.bpm} BPM</small>
                </span>
                <span className="play-icon" aria-hidden="true">▶</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

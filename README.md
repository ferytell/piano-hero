# Piano Hero

React + Vite rhythm-style piano trainer. Free, no backend, deploys to GitLab Pages. Notes use a synthesized struck-string sound with a short room reverb.

    npm install && npm run dev      # local
    git push                        # GitLab CI builds + publishes (see .gitlab-ci.yml)

## Add a song
1. Create `public/songs/my-song.json`:

       { "title": "…", "artist": "…", "bpm": 90,
         "notes": [ ["C4", 0, 1], ["E4", 1, 1], ["G4", 2, 2] ] }

   Each note is `[noteName, startBeat, durationInBeats]`. Names: `C4`, `F#3` (sharps only, no flats yet).
2. Add `"my-song.json"` to `public/songs/index.json`.
Notes must exist in `src/config/keymap.js` or they cannot be played.

During play, use the displayed keyboard letters or click the on-screen piano keys. Each piano key shows its note name and matching keyboard letter.

## Where things live
- `src/config/`  keymap + learning stages (edit these to customise)
- `src/game/`    `engine.js` scoring/timing (pure), `render.js` canvas drawing, `music.js` note maths
- `src/audio/`   sound
- `src/components/`, `src/App.jsx`  UI screens

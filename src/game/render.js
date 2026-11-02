import { parseNote } from './music';

const FALL_SECONDS = 2;        // blocks mode: top of screen -> hit line
const SHEET_PX_PER_SEC = 220;  // sheet mode: scroll speed
const PIANO_HEIGHT = 112;
const RESULT_COLOR = { perfect: '#8cff66', good: '#ffe66d', miss: '#68738c' };
const NOTE_COLORS = ['#ff6b6b', '#ff9f43', '#ffe66d', '#8cff66', '#55d6be', '#60a5fa', '#c084fc', '#ff75c3', '#f472b6', '#a3e635', '#38bdf8', '#fb7185'];
const blockColor = (x) => RESULT_COLOR[x.result] ?? NOTE_COLORS[parseNote(x.n).midi % 12];
const line = (ctx, x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };

export function draw(ctx, w, h, state, now, { mode, lanes, keyOf, pianoNotes }) {
  ctx.fillStyle = '#11152b';
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h);
  if (mode === 'sheet') drawSheet(ctx, w, h, state, now);
  else drawBlocks(ctx, w, h, state, now, mode, lanes, keyOf);
  drawHud(ctx, w, state, now);
  drawPiano(ctx, w, h, pianoNotes, keyOf);
}

function drawBlocks(ctx, w, h, state, now, mode, lanes, keyOf) {
  const hitY = h - PIANO_HEIGHT - 32, pps = hitY / FALL_SECONDS;
  const { whiteKeys, blackKeys } = pianoLayout(w, h, lanes);
  const keys = new Map([...whiteKeys, ...blackKeys].map((key) => [key.note, key]));
  const label = (n) => (mode === 'blocks' ? (keyOf[n] ?? '?').toUpperCase() : n);
  ctx.textAlign = 'center'; ctx.font = 'bold 16px monospace';
  lanes.forEach((n) => {
    const key = keys.get(n);
    const isSharp = parseNote(n).sharp;
    const x = key.x + key.w / 2;
    const halfWidth = isSharp ? key.w * 0.275 : key.w / 2;
    ctx.fillStyle = isSharp ? '#171c36' : '#1c2241';
    ctx.fillRect(Math.max(0, x - halfWidth), 0, Math.min(w, x + halfWidth) - Math.max(0, x - halfWidth), h - PIANO_HEIGHT);
    ctx.fillStyle = '#a8b4d8'; ctx.font = 'bold 11px monospace';
    ctx.fillText(label(n), x, hitY + 25);
  });
  ctx.fillStyle = '#8cff66'; ctx.fillRect(0, hitY, w, 4);
  ctx.fillStyle = '#263250'; ctx.fillRect(0, hitY + 4, w, 3);
  for (const x of state.notes) {
    const y = hitY - (x.time - now) * pps, bh = Math.max(x.dur * pps - 6, 22);
    if (y < 0 || y - bh > hitY) continue;
    const key = keys.get(x.n);
    if (!key) continue;
    const targetW = key.w * (parseNote(x.n).sharp ? 0.48 : 0.82);
    const lx = key.x + key.w / 2 - targetW / 2;
    ctx.fillStyle = '#080b18'; ctx.fillRect(lx + 3, y - bh + 3, targetW - 4, bh);
    ctx.fillStyle = blockColor(x); ctx.fillRect(lx, y - bh, targetW - 4, bh);
    ctx.strokeStyle = '#fff4bd'; ctx.lineWidth = 2; ctx.strokeRect(lx + 1, y - bh + 1, targetW - 6, bh - 2);
    ctx.fillStyle = '#11152b'; ctx.font = 'bold 14px monospace';
    ctx.fillText(label(x.n), key.x + key.w / 2, y - bh / 2 + 5);
  }
}

function drawSheet(ctx, w, h, state, now) {
  const gap = 16, bottom = h / 2 + 2 * gap, hitX = 140; // bottom staff line = E4 (step 30)
  ctx.strokeStyle = '#8692b5'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) line(ctx, 20, bottom - i * gap, w, bottom - i * gap);
  ctx.fillStyle = '#8cff66'; ctx.font = 'bold 36px monospace'; ctx.textAlign = 'left';
  ctx.fillText('G', 36, bottom - 4);
  ctx.fillStyle = '#8cff66'; ctx.fillRect(hitX - 2, bottom - 5 * gap, 4, 6 * gap);
  for (const x of state.notes) {
    const px = hitX + (x.time - now) * SHEET_PX_PER_SEC;
    if (px < 0 || px > w) continue;
    const p = parseNote(x.n), off = p.step - 30, py = bottom - (off * gap) / 2;
    ctx.strokeStyle = '#8692b5';
    if (off < 0) for (let o = -2; o >= off; o -= 2) line(ctx, px - 14, bottom - (o * gap) / 2, px + 14, bottom - (o * gap) / 2);
    if (off > 8) for (let o = 10; o <= off; o += 2) line(ctx, px - 14, bottom - (o * gap) / 2, px + 14, bottom - (o * gap) / 2);
    ctx.fillStyle = RESULT_COLOR[x.result] ?? NOTE_COLORS[p.midi % 12];
    ctx.fillRect(px - 9, py - 7, 18, 14);
    ctx.strokeStyle = '#11152b'; ctx.lineWidth = 2; ctx.strokeRect(px - 9, py - 7, 18, 14);
    if (p.sharp) { ctx.font = 'bold 18px monospace'; ctx.fillStyle = '#fff'; ctx.fillText('#', px - 24, py + 6); }
  }
}

function drawHud(ctx, w, s, now) {
  ctx.textAlign = 'left'; ctx.fillStyle = '#d6deff'; ctx.font = 'bold 16px monospace';
  ctx.fillText(`SCORE ${s.score}`, 18, 30);
  ctx.fillStyle = '#8cff66'; ctx.fillText(`STREAK ${s.combo}`, 18, 54);
  if (s.last && now - s.last.at < 0.6) {
    ctx.textAlign = 'right'; ctx.fillStyle = s.last.result === 'miss' ? '#ff6b6b' : '#ffe66d';
    ctx.fillText(s.last.result.toUpperCase(), w - 18, 30);
  }
  if (now < 0) {
    ctx.textAlign = 'center'; ctx.font = 'bold 52px monospace';
    ctx.fillStyle = '#080b18'; ctx.fillText(String(Math.ceil(-now)), w / 2 + 4, 128 + 4);
    ctx.fillStyle = '#8cff66'; ctx.fillText(String(Math.ceil(-now)), w / 2, 128);
  }
}

function drawGrid(ctx, w, h) {
  ctx.fillStyle = '#1b2040';
  for (let x = 0; x < w; x += 32) ctx.fillRect(x, 0, 1, h);
  for (let y = 0; y < h; y += 32) ctx.fillRect(0, y, w, 1);
}

function pianoLayout(w, h, notes) {
  const top = h - PIANO_HEIGHT, whites = notes.filter((n) => !parseNote(n).sharp);
  const keyW = w / whites.length;
  const whiteKeys = whites.map((note, i) => ({ note, x: i * keyW, y: top + 18, w: keyW, h: PIANO_HEIGHT - 18 }));
  const blackKeys = notes.filter((n) => parseNote(n).sharp).map((note) => {
    const midi = parseNote(note).midi;
    const leftWhite = whiteKeys.find((key) => parseNote(key.note).midi === midi - 1);
    return leftWhite ? { note, x: leftWhite.x + keyW * 0.66, y: top + 18, w: keyW * 0.55, h: PIANO_HEIGHT * 0.58 } : null;
  }).filter(Boolean);
  return { top, whiteKeys, blackKeys };
}

function drawPiano(ctx, w, h, notes, keyOf) {
  const { top, whiteKeys, blackKeys } = pianoLayout(w, h, notes);
  ctx.fillStyle = '#080b18'; ctx.fillRect(0, top, w, PIANO_HEIGHT);
  ctx.fillStyle = '#303858'; ctx.fillRect(0, top, w, 4);
  for (const key of whiteKeys) {
    ctx.fillStyle = '#0a0d1b'; ctx.fillRect(key.x + 2, key.y + 3, key.w - 3, key.h - 2);
    ctx.fillStyle = '#f2f0db'; ctx.fillRect(key.x, key.y, key.w - 3, key.h - 3);
    ctx.fillStyle = '#b7bfd7'; ctx.fillRect(key.x, key.y + key.h - 8, key.w - 3, 5);
    ctx.textAlign = 'center'; ctx.fillStyle = '#242b48';
    ctx.font = `bold ${Math.max(8, Math.min(12, key.w / 4))}px monospace`;
    ctx.fillText(key.note, key.x + key.w / 2, top + PIANO_HEIGHT - 32);
    ctx.fillStyle = '#766bd4'; ctx.font = `bold ${Math.max(8, Math.min(11, key.w / 4))}px monospace`;
    ctx.fillText((keyOf[key.note] ?? '').toUpperCase(), key.x + key.w / 2, top + PIANO_HEIGHT - 14);
  }
  for (const key of blackKeys) {
    ctx.fillStyle = '#080b18'; ctx.fillRect(key.x + 2, key.y + 3, key.w - 2, key.h);
    ctx.fillStyle = '#303858'; ctx.fillRect(key.x, key.y, key.w - 2, key.h);
    ctx.fillStyle = '#aeb8d8'; ctx.textAlign = 'center';
    ctx.font = `bold ${Math.max(7, Math.min(10, key.w / 4))}px monospace`;
    ctx.fillText(key.note.replace(/\d$/, ''), key.x + key.w / 2, key.y + 24);
    ctx.fillStyle = '#8cff66'; ctx.font = `bold ${Math.max(8, Math.min(10, key.w / 4))}px monospace`;
    ctx.fillText((keyOf[key.note] ?? '').toUpperCase(), key.x + key.w / 2, key.y + 40);
  }
}

export function pianoNoteAt(x, y, w, h, notes) {
  const { top, whiteKeys, blackKeys } = pianoLayout(w, h, notes);
  if (y < top) return null;
  return blackKeys.find((key) => x >= key.x && x <= key.x + key.w && y >= key.y && y <= key.y + key.h)?.note
    ?? whiteKeys.find((key) => x >= key.x && x <= key.x + key.w && y >= key.y && y <= key.y + key.h)?.note
    ?? null;
}

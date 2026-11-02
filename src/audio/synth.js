import { toFrequency } from '../game/music';

let ctx;
let master;

const PARTIALS = [
  { ratio: 1, level: 0.48, decay: 2.8 },
  { ratio: 2, level: 0.24, decay: 1.9 },
  { ratio: 3, level: 0.12, decay: 1.4 },
  { ratio: 4, level: 0.08, decay: 1.1 },
  { ratio: 5, level: 0.05, decay: 0.85 },
  { ratio: 6, level: 0.035, decay: 0.68 },
  { ratio: 7, level: 0.022, decay: 0.52 },
  { ratio: 8, level: 0.014, decay: 0.42 },
];

function getAudioContext() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.65;

    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const reverb = ctx.createConvolver();
    const impulse = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 1.4), ctx.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
      const samples = impulse.getChannelData(channel);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 2.4;
      }
    }
    reverb.buffer = impulse;
    wet.gain.value = 0.18;
    master.connect(dry).connect(ctx.destination);
    master.connect(reverb).connect(wet).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function playNote(name, seconds = 1.8) {
  const audio = getAudioContext();
  const fundamental = toFrequency(name);
  const start = audio.currentTime;

  for (const partial of PARTIALS) {
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    const level = partial.level / PARTIALS[0].level;
    const decay = Math.min(seconds, partial.decay);

    oscillator.type = 'sine';
    oscillator.frequency.value = fundamental * partial.ratio
      * Math.sqrt(1 + 0.00012 * partial.ratio ** 2);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(level, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    oscillator.connect(envelope).connect(master);
    oscillator.start(start);
    oscillator.stop(start + decay + 0.02);
  }
}

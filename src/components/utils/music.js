// Procedural background music. There are no per-map audio files - instead
// each map index seeds a tiny deterministic generator that picks a scale,
// tempo, and note pattern, then plays it back with plain Web Audio
// oscillators. Same map always sounds the same; different maps sound
// different from each other; zero asset files to ship or license.

let audioCtx = null;
let stepTimer = null;
let musicEnabled = true;

function getCtx() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
    }
    return audioCtx;
}

// Deterministic PRNG (mulberry32) so a given seed always produces the same
// tune - the map's music is stable across sessions, not random noise.
function mulberry32(seed) {
    let a = seed;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    dorian: [0, 2, 3, 5, 7, 9, 10],
};
const SCALE_NAMES = Object.keys(SCALES);
const WAVE_TYPES = ['square', 'triangle', 'sawtooth'];

function noteFreq(rootMidi, scaleSteps, degree) {
    const octave = Math.floor(degree / scaleSteps.length);
    const step = scaleSteps[((degree % scaleSteps.length) + scaleSteps.length) % scaleSteps.length];
    const midi = rootMidi + step + octave * 12;
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function buildTheme(seed) {
    const rand = mulberry32(seed * 9973 + 17);
    const scaleName = SCALE_NAMES[Math.floor(rand() * SCALE_NAMES.length)];
    const scale = SCALES[scaleName];
    const rootMidi = 48 + Math.floor(rand() * 12); // roughly C3-B3
    const tempo = 100 + Math.floor(rand() * 60); // 100-160 bpm
    const wave = WAVE_TYPES[Math.floor(rand() * WAVE_TYPES.length)];
    const length = 8 + Math.floor(rand() * 8); // 8-16 step melody

    const melody = [];
    for (let i = 0; i < length; i++) {
        if (rand() < 0.15) {
            melody.push(null); // rest
        } else {
            const degree = Math.floor(rand() * 8) - 2;
            melody.push(degree);
        }
    }
    const bassEvery = rand() < 0.5 ? 2 : 4;

    return { rootMidi, scale, tempo, wave, melody, bassEvery };
}

function playTone(ctx, freq, startTime, duration, gainPeak, wave) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

export function setMusicEnabled(enabled) {
    musicEnabled = enabled;
    if (!enabled) stopMusic();
}

export function isMusicEnabled() {
    return musicEnabled;
}

export function startMapMusic(mapIndex) {
    stopMusic();
    if (!musicEnabled) return;

    const theme = buildTheme(mapIndex);
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const stepDuration = 60 / theme.tempo / 2; // eighth notes
    let step = 0;

    const playStep = () => {
        const now = ctx.currentTime + 0.05;
        const degree = theme.melody[step % theme.melody.length];
        if (degree !== null) {
            const freq = noteFreq(theme.rootMidi + 12, theme.scale, degree);
            playTone(ctx, freq, now, stepDuration * 0.9, 0.05, theme.wave);
        }
        if (step % theme.bassEvery === 0) {
            const bassFreq = noteFreq(theme.rootMidi - 12, theme.scale, 0);
            playTone(ctx, bassFreq, now, stepDuration * theme.bassEvery * 0.85, 0.04, 'triangle');
        }
        step++;
    };

    playStep();
    stepTimer = window.setInterval(playStep, stepDuration * 1000);
}

export function stopMusic() {
    if (stepTimer) {
        window.clearInterval(stepTimer);
        stepTimer = null;
    }
}

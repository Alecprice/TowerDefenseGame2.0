import { buildMapAudioProfile } from './audioIdentityV32';
import { playModeStartCue } from './proceduralModeSfxV32';

// Procedural background music: no downloaded music assets and no licensing
// burden. Every map gets a deterministic profile whose melody begins with a
// base-7 encoding of its map index, guaranteeing a distinct motif for maps
// 0..99 instead of merely hoping seeded random themes do not collide.

let audioCtx = null;
let stepTimer = null;
let musicEnabled = true;

function getCtx() {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();
    return audioCtx;
}

function noteFreq(rootMidi, scaleSteps, degree) {
    const octave = Math.floor(degree / scaleSteps.length);
    const step = scaleSteps[((degree % scaleSteps.length) + scaleSteps.length) % scaleSteps.length];
    const midi = rootMidi + step + octave * 12;
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function playTone(ctx, freq, startTime, duration, gainPeak, wave, detune = 0) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, startTime);
    osc.detune.setValueAtTime(detune, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, gainPeak), startTime + Math.min(.025, duration * .2));
    gain.gain.exponentialRampToValueAtTime(.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + .05);
}

function playAmbientAccent(ctx, theme, step, now, stepDuration) {
    if (step % theme.accentEvery !== 0) return;
    const degree = theme.motif[(step + 3) % theme.motif.length];
    const high = noteFreq(theme.rootMidi + 24, theme.scale, degree);
    const low = noteFreq(theme.rootMidi - 12, theme.scale, degree % 3);

    switch (theme.ambience) {
        case 'air':
            playTone(ctx, high, now, stepDuration * 1.8, .012, 'sine', 9);
            break;
        case 'pulse':
            playTone(ctx, low, now, stepDuration * .42, .022, 'square');
            break;
        case 'spark':
            playTone(ctx, high * 1.5, now, stepDuration * .24, .014, 'triangle');
            break;
        case 'rumble':
            playTone(ctx, low / 2, now, stepDuration * 2.2, .025, 'sine', -7);
            break;
        case 'chime':
            playTone(ctx, high * 2, now, stepDuration * 1.15, .011, 'sine');
            playTone(ctx, high * 2.5, now + .045, stepDuration * .9, .008, 'sine');
            break;
        case 'drone':
            playTone(ctx, low, now, stepDuration * 2.6, .016, 'triangle', 6);
            break;
        case 'tick':
            playTone(ctx, high * 2.2, now, .045, .016, 'square');
            break;
        case 'shimmer':
            playTone(ctx, high * 1.75, now, stepDuration * 1.6, .01, 'sine', -11);
            playTone(ctx, high * 1.76, now, stepDuration * 1.6, .008, 'triangle', 11);
            break;
        default:
            break;
    }
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

    const theme = buildMapAudioProfile(mapIndex);
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    // The mode cue sits on top of the map-specific motif. It uses a separate
    // procedural profile per ruleset, so changing modes changes the soundscape
    // even when replaying the same map.
    playModeStartCue();

    const stepDuration = 60 / theme.tempo / 2;
    let step = 0;

    const playStep = () => {
        const now = ctx.currentTime + .05;
        const degree = theme.motif[step % theme.motif.length];
        const melodyFreq = noteFreq(theme.rootMidi + 12, theme.scale, degree);
        playTone(ctx, melodyFreq, now, stepDuration * .88, .038, theme.wave);

        if (step % theme.bassEvery === 0) {
            const bassDegree = theme.motif[(step + theme.bassEvery) % theme.motif.length] % 3;
            const bassFreq = noteFreq(theme.rootMidi - 12, theme.scale, bassDegree);
            playTone(ctx, bassFreq, now, stepDuration * theme.bassEvery * .8, .028, 'triangle');
        }

        playAmbientAccent(ctx, theme, step, now, stepDuration);
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

import { getModeAudioProfile } from './audioIdentityV32';
import { getCurrentGameMode } from './gameModes';

let audioCtx = null;

function getCtx() {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
}

function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function tone(ctx, midi, start, duration, gainPeak, wave = 'sine', detune = 0) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(midiToFreq(midi), start);
    osc.detune.setValueAtTime(detune, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainPeak), start + Math.min(.025, duration * .25));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + .03);
}

function noise(ctx, start, duration, gainPeak, color = 'clean') {
    if (color === 'clean' || color === 'chime' || color === 'beep') return;
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < frameCount; i++) {
        const white = Math.random() * 2 - 1;
        if (['rumble', 'drone', 'heartbeat', 'march'].includes(color)) {
            previous = previous * .985 + white * .015;
            data[i] = previous * 3.1;
        } else if (['metal', 'shatter', 'coin'].includes(color)) {
            data[i] = white * (i % 5 === 0 ? 1 : .32);
        } else if (['glitch', 'tick', 'click', 'pop'].includes(color)) {
            data[i] = i < frameCount * .18 ? white : 0;
        } else if (['buzz', 'gurgle', 'alarm', 'siren', 'echo'].includes(color)) {
            data[i] = white * Math.sin(i * .055);
        } else {
            data[i] = white * .5;
        }
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(Math.max(.0001, gainPeak), start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(start);
}

function playProfile(profile, event = 'start') {
    const ctx = getCtx();
    if (!ctx || !profile) return;
    const now = ctx.currentTime + .025;
    const eventShift = event === 'boss' ? -12 : event === 'clear' ? 7 : event === 'wave' ? 2 : 0;
    const durationMult = event === 'boss' ? 1.25 : event === 'clear' ? .78 : event === 'wave' ? .62 : 1;
    const intervals = event === 'clear' ? [...profile.intervals].reverse() : profile.intervals;
    intervals.forEach((offset, index) => {
        const start = now + index * profile.rhythm * durationMult;
        tone(ctx, profile.rootMidi + eventShift + offset, start, Math.max(.07, profile.rhythm * 1.45), .032, profile.wave);
        if (event === 'boss' && index === 0) {
            tone(ctx, profile.rootMidi - 24, start, .55, .045, profile.accentWave, -8);
        }
    });
    const noiseDuration = Math.max(.06, profile.rhythm * intervals.length * durationMult);
    noise(ctx, now, noiseDuration, event === 'boss' ? .026 : .012, profile.texture);
}

function currentProfile() {
    return getModeAudioProfile(getCurrentGameMode()?.key || 'classic');
}

export function playModeStartCue() {
    playProfile(currentProfile(), 'start');
}

export function playModeWaveCue() {
    playProfile(currentProfile(), 'wave');
}

export function playModeBossCue() {
    playProfile(currentProfile(), 'boss');
}

export function playModeClearCue() {
    playProfile(currentProfile(), 'clear');
}

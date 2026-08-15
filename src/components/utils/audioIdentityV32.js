// Pure audio identity data for Tower Defense 3.2.
// No downloaded samples are required: runtime audio is synthesized with Web Audio.
// Keeping this module side-effect free also lets CI prove that all 100 maps and
// all 21 modes have distinct sonic signatures.

export const AUDIO_SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
};

const MAP_SCALE_NAMES = Object.keys(AUDIO_SCALES);
const MAP_WAVES = ['triangle', 'square', 'sawtooth', 'sine'];
const AMBIENCE_TYPES = ['air', 'pulse', 'spark', 'rumble', 'chime', 'drone', 'tick', 'shimmer'];

function base7Triplet(index) {
    const safe = Math.max(0, Math.floor(Number(index) || 0));
    return [Math.floor(safe / 49) % 7, Math.floor(safe / 7) % 7, safe % 7];
}

export function buildMapAudioProfile(mapIndex) {
    const index = Math.max(0, Math.floor(Number(mapIndex) || 0));
    const [a, b, c] = base7Triplet(index);
    const scaleName = MAP_SCALE_NAMES[(index * 5 + 1) % MAP_SCALE_NAMES.length];

    // The first three melody degrees are a base-7 encoding of the map index.
    // That makes map 0..99 provably different even if tempo/root/wave happen
    // to overlap. The remaining notes turn that identity into a musical motif.
    const motif = [
        a, b, c,
        (a + c + 2) % 7,
        (6 - b + a) % 7,
        (c + 3) % 7,
        (b + 4) % 7,
        (a + b + c + 1) % 7,
    ];

    return {
        mapIndex: index,
        rootMidi: 43 + ((index * 11) % 17),
        tempo: 92 + ((index * 13) % 49),
        scaleName,
        scale: AUDIO_SCALES[scaleName],
        wave: MAP_WAVES[(index * 3 + 1) % MAP_WAVES.length],
        ambience: AMBIENCE_TYPES[(index * 7 + 2) % AMBIENCE_TYPES.length],
        bassEvery: 2 + (index % 3),
        accentEvery: 3 + (index % 5),
        motif,
    };
}

export function mapAudioSignature(profile) {
    return [
        profile.rootMidi,
        profile.tempo,
        profile.scaleName,
        profile.wave,
        profile.ambience,
        profile.bassEvery,
        profile.accentEvery,
        profile.motif.join('.'),
    ].join('|');
}

const modeAudio = (key, label, rootMidi, wave, intervals, rhythm, texture, accentWave) => ({
    key, label, rootMidi, wave, intervals, rhythm, texture, accentWave,
});

// Every public mode has its own short procedural sound language. Intervals are
// semitone offsets; rhythm is seconds between notes in its mode stinger.
export const MODE_AUDIO_PROFILES = {
    classic: modeAudio('classic', 'Brass Signal', 60, 'triangle', [0, 4, 7], .13, 'clean', 'sine'),
    overdrive: modeAudio('overdrive', 'Turbo Pulse', 64, 'sawtooth', [0, 7, 12, 16], .075, 'buzz', 'square'),
    titan: modeAudio('titan', 'Titan Horn', 43, 'square', [0, 3, 7], .22, 'rumble', 'triangle'),
    bossrush: modeAudio('bossrush', 'Boss Alarm', 48, 'sawtooth', [0, 1, 6, 1], .11, 'alarm', 'square'),
    chaos: modeAudio('chaos', 'Chaos Fracture', 57, 'square', [0, 6, 1, 10, 3], .085, 'glitch', 'sawtooth'),
    draft: modeAudio('draft', 'Draft Shuffle', 67, 'triangle', [0, 2, 9, 5], .12, 'click', 'sine'),
    onelife: modeAudio('onelife', 'Last Heart', 55, 'sine', [0, 7, 0], .28, 'heartbeat', 'triangle'),
    noeconomy: modeAudio('noeconomy', 'Dry Vault', 52, 'square', [0, 5, 3], .17, 'metal', 'triangle'),
    roguelite: modeAudio('roguelite', 'Relic Chime', 62, 'sine', [0, 3, 7, 10], .16, 'chime', 'triangle'),
    swarm: modeAudio('swarm', 'Hive Rush', 72, 'sawtooth', [0, 2, 1, 5, 3, 7], .055, 'buzz', 'square'),
    glasscannon: modeAudio('glasscannon', 'Crystal Crack', 76, 'sine', [0, 12, 19, 7], .09, 'shatter', 'triangle'),
    blackout: modeAudio('blackout', 'Dark Sonar', 41, 'sine', [0, 6, 12], .3, 'drone', 'triangle'),
    bounty: modeAudio('bounty', 'Bounty Bell', 65, 'triangle', [0, 7, 12, 7], .14, 'coin', 'sine'),
    speedrun: modeAudio('speedrun', 'Countdown Dash', 69, 'square', [0, 4, 7, 12, 16], .06, 'tick', 'sawtooth'),
    marathon: modeAudio('marathon', 'Endurance March', 50, 'triangle', [0, 5, 7, 5], .24, 'march', 'sine'),
    fortress: modeAudio('fortress', 'Fortress Gong', 45, 'sine', [0, 7, 12], .27, 'metal', 'square'),
    plague: modeAudio('plague', 'Plague Bubble', 54, 'sawtooth', [0, 1, 4, 3], .14, 'gurgle', 'sine'),
    mirror: modeAudio('mirror', 'Mirror Echo', 61, 'triangle', [0, 7, 3, 10, 0], .15, 'echo', 'sine'),
    apocalypse: modeAudio('apocalypse', 'Doom Siren', 38, 'sawtooth', [0, 6, 12, 6, 1], .12, 'siren', 'square'),
    precision: modeAudio('precision', 'Target Lock', 70, 'square', [0, 12, 7, 12], .095, 'beep', 'sine'),
    splitterstorm: modeAudio('splitterstorm', 'Split Cascade', 66, 'triangle', [0, 4, 8, 12, 8, 4], .08, 'pop', 'square'),
};

export function getModeAudioProfile(modeKey = 'classic') {
    return MODE_AUDIO_PROFILES[modeKey] || MODE_AUDIO_PROFILES.classic;
}

export function modeAudioSignature(profile) {
    return [
        profile.rootMidi,
        profile.wave,
        profile.intervals.join('.'),
        profile.rhythm,
        profile.texture,
        profile.accentWave,
    ].join('|');
}

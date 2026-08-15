import { describe, expect, it } from 'vitest';
import {
    buildMapAudioProfile,
    mapAudioSignature,
    MODE_AUDIO_PROFILES,
    modeAudioSignature,
} from './audioIdentityV32';
import { GAME_MODE_ORDER } from './gameModes';

describe('Tower Defense 3.2 audio identities', () => {
    it('gives all 100 maps distinct procedural sound signatures', () => {
        const profiles = Array.from({ length: 100 }, (_, index) => buildMapAudioProfile(index));
        const signatures = profiles.map(mapAudioSignature);
        expect(new Set(signatures).size).toBe(100);
    });

    it('keeps a map sound deterministic across sessions', () => {
        for (let index = 0; index < 100; index++) {
            expect(mapAudioSignature(buildMapAudioProfile(index)))
                .toBe(mapAudioSignature(buildMapAudioProfile(index)));
        }
    });

    it('defines one unique audio profile for every public game mode', () => {
        expect(Object.keys(MODE_AUDIO_PROFILES).sort()).toEqual([...GAME_MODE_ORDER].sort());
        const signatures = GAME_MODE_ORDER.map(key => modeAudioSignature(MODE_AUDIO_PROFILES[key]));
        expect(new Set(signatures).size).toBe(GAME_MODE_ORDER.length);
        expect(GAME_MODE_ORDER.length).toBe(21);
    });

    it('uses audible musical material for every mode', () => {
        GAME_MODE_ORDER.forEach(key => {
            const profile = MODE_AUDIO_PROFILES[key];
            expect(profile.intervals.length).toBeGreaterThanOrEqual(3);
            expect(profile.rhythm).toBeGreaterThan(0);
            expect(profile.rootMidi).toBeGreaterThanOrEqual(36);
            expect(profile.rootMidi).toBeLessThanOrEqual(84);
        });
    });
});

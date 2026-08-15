import { describe, expect, it } from 'vitest';
import { GAME_MODES, GAME_MODE_ORDER } from './gameModes';
import { buildWavePlan } from './waveDirectorV31';

const NEW_MODES = [
    'swarm','glasscannon','blackout','bounty','speedrun','marathon',
    'fortress','plague','mirror','apocalypse','precision','splitterstorm',
];

const difficulty = { key: 'normal', mult: 1.5, eliteMult: 1.35 };
const map = {
    enemyProfile: { speedMult: 1, healthMult: 1, armoredChance: .25, tankChance: .12 },
};
const mechanic = { key: 'highground' };

function planSignature(modeKey) {
    const plan = buildWavePlan({ wave: 20, map, mapIndex: 3, difficulty, modeKey, mechanic, seed: 'mode-test' });
    return JSON.stringify({
        interval: plan.spawnInterval,
        units: plan.entries.length,
        traits: plan.entries.map(e => e.trait || '-'),
        types: plan.entries.map(e => e.type),
    });
}

describe('Tower Defense 3.2 game modes', () => {
    it('contains exactly 21 unique modes', () => {
        expect(GAME_MODE_ORDER).toHaveLength(21);
        expect(new Set(GAME_MODE_ORDER).size).toBe(21);
        GAME_MODE_ORDER.forEach(key => expect(GAME_MODES[key]?.name).toBeTruthy());
    });

    it('adds all 12 requested new modes', () => {
        NEW_MODES.forEach(key => expect(GAME_MODE_ORDER).toContain(key));
    });

    it('gives every new mode explicit rules and a unique description', () => {
        const descriptions = NEW_MODES.map(key => GAME_MODES[key].desc);
        expect(new Set(descriptions).size).toBe(NEW_MODES.length);
        NEW_MODES.forEach(key => expect(Object.keys(GAME_MODES[key].rules || {}).length).toBeGreaterThan(0));
    });

    it('keeps deterministic wave planning for every mode', () => {
        GAME_MODE_ORDER.forEach(key => {
            expect(planSignature(key)).toBe(planSignature(key));
        });
    });

    it('produces meaningfully different wave plans for the wave-director-focused new modes', () => {
        const waveModes = ['swarm','bounty','speedrun','marathon','plague','mirror','apocalypse','splitterstorm'];
        const signatures = waveModes.map(planSignature);
        expect(new Set(signatures).size).toBe(waveModes.length);
    });
});

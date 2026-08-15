import { describe, expect, it } from 'vitest';
import { chooseTargetV31 } from './combatV31';

const tower = { mid: { x: 100, y: 100 }, def: {} };
const enemy = (id, distance, health, x, y) => ({ id, distance, health, mid: { x, y } });
const enemies = [
    enemy('front', 900, 40, 180, 100),
    enemy('back', 100, 70, 110, 100),
    enemy('tank', 500, 400, 250, 100),
    enemy('weak', 450, 5, 125, 100),
];

describe('Tower Defense 3.2 targeting controls', () => {
    it('targets the first enemy by path progress', () => {
        expect(chooseTargetV31(tower, enemies, 'first').id).toBe('front');
    });

    it('targets the last enemy by path progress', () => {
        expect(chooseTargetV31(tower, enemies, 'last').id).toBe('back');
    });

    it('targets strongest and weakest enemies', () => {
        expect(chooseTargetV31(tower, enemies, 'strong').id).toBe('tank');
        expect(chooseTargetV31(tower, enemies, 'weak').id).toBe('weak');
    });

    it('targets the physically closest enemy', () => {
        expect(chooseTargetV31(tower, enemies, 'closest').id).toBe('back');
    });
});

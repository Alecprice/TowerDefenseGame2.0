import { CATEGORY } from '../objects/towerCategory';

const round = value => Math.round(value * 100) / 100;

export function getTowerRole(def) {
    if (!def) return 'attack';
    if (def.category === CATEGORY.BANK || def.category === CATEGORY.CRYSTAL) return 'economy';
    if (def.category === CATEGORY.SUPPORT) return 'support';
    if (def.category === CATEGORY.POISON || def.category === CATEGORY.SLOW) return 'control';
    if (def.category === CATEGORY.BOSS_HUNTER || def.heavyBonusMult || def.shieldBonusMult || def.executeThreshold) return 'specialist';
    if (def.aoe || def.levels?.some(level => level.splashRadius || level.chainRange || level.pierceRange)) return 'aoe';
    return 'attack';
}

export const SHOP_ROLES = [
    { key: 'all', label: 'All' },
    { key: 'attack', label: 'Attack' },
    { key: 'aoe', label: 'AOE' },
    { key: 'control', label: 'Control' },
    { key: 'support', label: 'Support' },
    { key: 'economy', label: 'Economy' },
    { key: 'specialist', label: 'Specialist' },
    { key: 'favorites', label: '★ Favorites' },
];

export function getSpecializationChoices(tower) {
    const category = tower?.def?.category;
    if (category === CATEGORY.SUPPORT) {
        return [
            { id: 'amplifier', name: 'Amplifier', desc: '+35% support effect strength.' },
            { id: 'relay', name: 'Relay Network', desc: '+40% aura radius.' },
        ];
    }
    if (category === CATEGORY.BANK || category === CATEGORY.CRYSTAL) {
        return [
            { id: 'compound', name: 'Compound Engine', desc: '+50% passive income.' },
            { id: 'surge', name: 'Wave Reserve', desc: '+25% income and a payout after each cleared wave.' },
        ];
    }
    if (category === CATEGORY.POISON) {
        return [
            { id: 'virulent', name: 'Virulent Strain', desc: '+60% poison DPS and +30% duration.' },
            { id: 'corrosive', name: 'Corrosive Payload', desc: '+15% hit damage and +3 armor shred.' },
        ];
    }
    if (category === CATEGORY.SLOW) {
        return [
            { id: 'deepfreeze', name: 'Deep Freeze', desc: 'Stronger slow and +15% range.' },
            { id: 'shatter', name: 'Shatter', desc: '+80% direct damage with a lighter slow.' },
        ];
    }
    if (category === CATEGORY.BOSS_HUNTER) {
        return [
            { id: 'hunter', name: 'Titan Hunter', desc: '+45% damage against bosses and heavies.' },
            { id: 'barrage', name: 'Barrage', desc: '30% faster firing with +10% range.' },
        ];
    }
    return [
        { id: 'power', name: 'Overcharged', desc: '+35% damage, but 12% slower firing.' },
        { id: 'tempo', name: 'Accelerated', desc: '28% faster firing and +12% range, with -10% hit damage.' },
    ];
}

function restoreLevelStats(tower) {
    if (!tower?.def?.levels?.length) return;
    const level = tower.def.levels[Math.max(0, tower.level - 1)];
    Object.assign(tower, level);
    tower.mapDmgMult = tower.mapDmgMult || 1;
    tower.mapRangeMult = tower.mapRangeMult || 1;
}

export function applyTowerSpecialization(tower, specialization) {
    if (!tower || !specialization) return tower;
    restoreLevelStats(tower);
    tower.specialization = specialization;
    tower.wavePayout = 0;

    switch (specialization) {
        case 'amplifier':
            if (tower.rangeBonus != null) tower.rangeBonus = round(tower.rangeBonus * 1.35);
            if (tower.dmgBonus != null) tower.dmgBonus = round(tower.dmgBonus * 1.35);
            if (tower.fireRateBonus != null) tower.fireRateBonus = round(tower.fireRateBonus * 1.35);
            if (tower.slowFloor != null) tower.slowFloor = Math.max(0.18, round(tower.slowFloor * 0.82));
            break;
        case 'relay':
            tower.auraRange = round((tower.auraRange || 0) * 1.4);
            break;
        case 'compound':
            tower.incomePerSecond = round((tower.incomePerSecond || 0) * 1.5);
            break;
        case 'surge':
            tower.incomePerSecond = round((tower.incomePerSecond || 0) * 1.25);
            tower.wavePayout = Math.max(2, Math.round((tower.incomePerSecond || 1) * 4));
            break;
        case 'virulent':
            tower.poisonDps = round((tower.poisonDps || tower.dmg || 1) * 1.6);
            tower.poisonDuration = Math.round((tower.poisonDuration || 2500) * 1.3);
            break;
        case 'corrosive':
            tower.dmg = round((tower.dmg || 0) * 1.15);
            tower.armorShred = (tower.armorShred || 0) + 3;
            break;
        case 'deepfreeze':
            tower.slowFloor = Math.max(0.18, round((tower.slowFloor || 0.7) * 0.75));
            tower.range = round((tower.range || 0) * 1.15);
            break;
        case 'shatter':
            tower.dmg = round((tower.dmg || 0) * 1.8);
            tower.slowFloor = Math.min(0.9, round((tower.slowFloor || 0.7) * 1.12));
            break;
        case 'hunter':
            tower.dmg = round((tower.dmg || 0) * 1.45);
            tower.heavyBonusMult = Math.max(tower.heavyBonusMult || 1, 1.45);
            break;
        case 'barrage':
            tower.fireRate = round((tower.fireRate || 1) * 0.7);
            tower.range = round((tower.range || 0) * 1.1);
            break;
        case 'power':
            tower.dmg = round((tower.dmg || 0) * 1.35);
            tower.fireRate = round((tower.fireRate || 1) * 1.12);
            break;
        case 'tempo':
            tower.dmg = round((tower.dmg || 0) * 0.9);
            tower.fireRate = round((tower.fireRate || 1) * 0.72);
            tower.range = round((tower.range || 0) * 1.12);
            break;
        default:
            break;
    }
    return tower;
}

export function refreshTowerSpecialization(tower) {
    if (!tower) return tower;
    if (tower.specialization) return applyTowerSpecialization(tower, tower.specialization);
    restoreLevelStats(tower);
    return tower;
}

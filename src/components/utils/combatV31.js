import { CATEGORY } from '../objects/towerCategory';
import { recordDamage } from './runStats';
import { spawnDamageNumber } from './damageNumbers';
import { getGameModeRules } from './gameModes';
import { getTargetStrategy } from './gameUXSettings';

const COLOR = {
    [CATEGORY.ATTACK]: '#ffffff',
    [CATEGORY.POISON]: '#7cb518',
    [CATEGORY.SLOW]: '#48cae4',
    [CATEGORY.BOSS_HUNTER]: '#ff595e',
};

export function towerRangeV31(tower, globalRangeMult = 1) {
    if (tower.def?.global) return Infinity;
    const base = tower.effectiveRange ? tower.effectiveRange() : (tower.range || 0);
    const modeRange = getGameModeRules().rangeMult || 1;
    return base * (tower.mapRangeMult || 1) * globalRangeMult * modeRange;
}

function inRange(tower, enemy, range) {
    if (!enemy || enemy.dead || enemy.end) return false;
    if (range === Infinity) return true;
    const dx = tower.mid.x - enemy.mid.x;
    const dy = tower.mid.y - enemy.mid.y;
    return dx * dx + dy * dy <= range * range;
}

export function chooseTargetV31(tower, candidates, strategy = null) {
    if (!candidates.length) return null;
    const configured = strategy || tower.targetingMode || getTargetStrategy();
    if (configured === 'last') return candidates.reduce((best, enemy) => !best || enemy.distance < best.distance ? enemy : best, null);
    if (configured === 'strong') return candidates.reduce((best, enemy) => !best || enemy.health > best.health ? enemy : best, null);
    if (configured === 'weak') return candidates.reduce((best, enemy) => !best || enemy.health < best.health ? enemy : best, null);
    if (configured === 'closest') {
        return candidates.reduce((best, enemy) => {
            const dx = tower.mid.x - enemy.mid.x;
            const dy = tower.mid.y - enemy.mid.y;
            const distanceSq = dx * dx + dy * dy;
            if (!best || distanceSq < best.distanceSq) return { enemy, distanceSq };
            return best;
        }, null)?.enemy || null;
    }
    if (tower.def?.targeting === 'strongest') return candidates.reduce((best, enemy) => !best || enemy.health > best.health ? enemy : best, null);
    if (tower.def?.targeting === 'fastest') return candidates.reduce((best, enemy) => !best || enemy.speed > best.speed ? enemy : best, null);
    return candidates.reduce((best, enemy) => !best || enemy.distance > best.distance ? enemy : best, null);
}

function rawDamage(tower) {
    const base = tower.effectiveDmg ? tower.effectiveDmg() : (tower.dmg || 0);
    const modeDmg = getGameModeRules().towerDmgMult || 1;
    return Math.max(0, base * (tower.mapDmgMult || 1) * modeDmg);
}

function deal(tower, enemy, amount, color, wasCrit = false) {
    if (!enemy || enemy.dead) return 0;
    const dealt = enemy.hit(Math.max(0, Math.round(amount)));
    if (dealt > 0) {
        enemy.v31HitCooldown = 2;
        spawnDamageNumber(enemy.mid.x, enemy.y - 2, dealt, wasCrit ? '#ff6d00' : color);
        recordDamage(tower.type, dealt);
    }
    return dealt;
}

function applyPrimary(tower, target, enemies, tracers) {
    if (!target || target.dead) return;
    let power = rawDamage(tower);
    let crit = false;

    if (tower.executeThreshold && target.maxHealth > 0 && target.health / target.maxHealth <= tower.executeThreshold) {
        power = target.health + (target.armor || 0);
    } else {
        if (tower.shieldBonusMult && target.shieldHP > 0) power *= tower.shieldBonusMult;
        if (tower.heavyBonusMult && target.maxHealth >= (tower.heavyThreshold || 300)) power *= tower.heavyBonusMult;
        if (tower.critChance && Math.random() < tower.critChance) { power *= tower.critMult || 2; crit = true; }
    }

    const color = COLOR[tower.def?.category] || '#ffffff';
    const dealt = deal(tower, target, power, color, crit);
    tracers.push({ x1: tower.mid.x, y1: tower.mid.y, x2: target.mid.x, y2: target.mid.y, life: 0.12, color });

    if (tower.armorShred && dealt > 0) target.armor = Math.max(0, (target.armor || 0) - tower.armorShred);
    if (tower.def?.category === CATEGORY.POISON && tower.poisonDps) {
        const current = target.v31Poison?.dps || 0;
        target.v31Poison = { dps: Math.max(current, tower.poisonDps), remaining: (tower.poisonDuration || 3000) / 1000, sourceType: tower.type };
    }
    if (tower.def?.category === CATEGORY.SLOW && tower.slowFloor) {
        target.v31SlowFloor = Math.min(target.v31SlowFloor ?? 1, tower.slowFloor);
        target.v31SlowRemaining = 1.5;
    }

    if (tower.splashRadius) {
        const splash = power * (tower.splashPct || 0.5);
        enemies.forEach(enemy => {
            if (enemy === target || enemy.dead) return;
            const dx = enemy.mid.x - target.mid.x, dy = enemy.mid.y - target.mid.y;
            if (dx * dx + dy * dy <= tower.splashRadius * tower.splashRadius) {
                const effective = enemy.splashResistance ? splash * (1 - enemy.splashResistance) : splash;
                deal(tower, enemy, effective, '#ffb703');
            }
        });
    }

    if (tower.chainRange) {
        let next = null;
        let best = tower.chainRange * tower.chainRange;
        enemies.forEach(enemy => {
            if (enemy === target || enemy.dead) return;
            const dx = enemy.mid.x - target.mid.x, dy = enemy.mid.y - target.mid.y;
            const d = dx * dx + dy * dy;
            if (d <= best) { best = d; next = enemy; }
        });
        if (next) {
            deal(tower, next, power * (tower.chainFalloff || 0.55), '#4361ee');
            tracers.push({ x1: target.mid.x, y1: target.mid.y, x2: next.mid.x, y2: next.mid.y, life: 0.11, color: '#4361ee' });
        }
    }

    if (crit && tower.critRadius) {
        enemies.forEach(enemy => {
            if (enemy === target || enemy.dead) return;
            const dx = enemy.mid.x - target.mid.x, dy = enemy.mid.y - target.mid.y;
            if (dx * dx + dy * dy <= tower.critRadius * tower.critRadius) deal(tower, enemy, power * 0.4, '#ff6d00', true);
        });
    }

    if (tower.pierceRange) {
        const sorted = enemies.filter(enemy => enemy !== target && !enemy.dead)
            .map(enemy => ({ enemy, distance: Math.hypot(enemy.mid.x - target.mid.x, enemy.mid.y - target.mid.y) }))
            .filter(entry => entry.distance <= tower.pierceRange).sort((a, b) => a.distance - b.distance).slice(0, 2);
        sorted.forEach(({ enemy }) => deal(tower, enemy, power * (tower.pierceFalloff || 0.7), '#adb5bd'));
    }
}

export function stepTowerCombatV31(tower, enemies, dt, tracers, globalRangeMult = 1) {
    if (!tower || tower.sold) return;
    if (tower.disabledRemaining > 0) { tower.disabledRemaining = Math.max(0, tower.disabledRemaining - dt); return; }
    const category = tower.def?.category;
    if ([CATEGORY.BANK, CATEGORY.CRYSTAL, CATEGORY.SUPPORT].includes(category)) return;

    tower.cooldownRemaining = Math.max(0, (tower.cooldownRemaining || 0) - dt);
    if (tower.cooldownRemaining > 0) return;
    const range = towerRangeV31(tower, globalRangeMult);
    let candidates = enemies.filter(enemy => inRange(tower, enemy, range));
    if (category === CATEGORY.BOSS_HUNTER) candidates = candidates.filter(enemy => enemy.type === 5 || enemy.isModeElite || enemy.isElite);
    if (!candidates.length) return;

    if (tower.def?.aoe) candidates.forEach(enemy => applyPrimary(tower, enemy, enemies, tracers));
    else applyPrimary(tower, chooseTargetV31(tower, candidates), enemies, tracers);

    const fireRate = tower.effectiveFireRate ? tower.effectiveFireRate() : (tower.fireRate || 1);
    const modeFire = getGameModeRules().towerFireMult || 1;
    tower.cooldownRemaining = Math.max(0.05, fireRate / modeFire);
}

export function stepEnemyEffectsV31(enemy, dt) {
    if (!enemy || enemy.dead) return;
    enemy.v31HitCooldown = Math.max(0, (enemy.v31HitCooldown || 0) - dt);
    enemy.bossHasteRemaining = Math.max(0, (enemy.bossHasteRemaining || 0) - dt);
    if (enemy.v31SlowRemaining > 0) {
        enemy.v31SlowRemaining = Math.max(0, enemy.v31SlowRemaining - dt);
        if (enemy.v31SlowRemaining === 0) enemy.v31SlowFloor = 1;
    }
    if (enemy.v31Poison?.remaining > 0) {
        const amount = enemy.v31Poison.dps * dt;
        enemy.health -= amount; recordDamage(enemy.v31Poison.sourceType, amount);
        enemy.v31Poison.remaining = Math.max(0, enemy.v31Poison.remaining - dt);
        if (enemy.health <= 0) enemy.dead = true;
    }
    if (enemy.regenPerSecond && enemy.v31HitCooldown <= 0 && !enemy.dead) {
        enemy.health = Math.min(enemy.maxHealth, enemy.health + enemy.regenPerSecond * dt);
    }
}

export function enemyMovementMultiplierV31(enemy) {
    const slow = enemy.v31SlowRemaining > 0 ? (enemy.v31SlowFloor || 1) : 1;
    const haste = enemy.bossHasteRemaining > 0 ? 1.35 : 1;
    return slow * haste;
}
export function stepTracersV31(tracers, dt) {
    for (let i = tracers.length - 1; i >= 0; i--) { tracers[i].life -= dt; if (tracers[i].life <= 0) tracers.splice(i, 1); }
}
export function drawTracersV31(ctx, tracers) {
    ctx.save();
    for (const tracer of tracers) {
        ctx.globalAlpha = Math.min(1, tracer.life / 0.12); ctx.strokeStyle = tracer.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(tracer.x1, tracer.y1); ctx.lineTo(tracer.x2, tracer.y2); ctx.stroke();
    }
    ctx.restore();
}

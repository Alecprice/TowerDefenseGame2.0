import { gameSpeed } from '../utils/gameSpeed';
import { CATEGORY } from './towerCategory';
import { spawnDamageNumber } from '../utils/damageNumbers';
import { playShieldBlock } from '../utils/sfx';
import { recordDamage } from '../utils/runStats';

const CATEGORY_COLOR = {
    [CATEGORY.ATTACK]: '#ffffff',
    [CATEGORY.POISON]: '#7cb518',
    [CATEGORY.SLOW]: '#48cae4',
    [CATEGORY.BOSS_HUNTER]: '#ff595e',
};

// dmg/category/extra come straight from the firing Tower at the moment it
// fires - see Tower.prototype.shoot() in tower.js. This is the only place
// a projectile's damage and effects are decided, and they're snapshotted
// here rather than read live off the tower, so an upgrade landing while
// the shot is still in flight can't retroactively change it.
export function Projectile(x, y, category, target, dmg, extra = {}) {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = 5;
    this.category = category;
    this.target = target;
    this.pwr = Math.round(dmg);
    this.speed = 6;
    this.end = false;

    // Secondary effect params (only the relevant ones will be set per
    // category - see TOWER_DEFS in tower.js).
    this.poisonDps = extra.poisonDps;
    this.poisonDuration = extra.poisonDuration;
    this.slowFloor = extra.slowFloor;
    this.splashRadius = extra.splashRadius;
    this.splashPct = extra.splashPct;
    this.towerType = extra.towerType;

    // Game 3.0 only (see towerDefsV3.js) - all undefined/no-op for the
    // original game's towers, which never set any of these in `extra`.
    this.executeThreshold = extra.executeThreshold;
    this.chainRange = extra.chainRange;
    this.chainFalloff = extra.chainFalloff;
    this.armorShred = extra.armorShred;
    this.heavyBonusMult = extra.heavyBonusMult;
    this.heavyThreshold = extra.heavyThreshold;
    this.pierceRange = extra.pierceRange;
    this.pierceFalloff = extra.pierceFalloff;
    this.critChance = extra.critChance;
    this.critMult = extra.critMult;
    this.critRadius = extra.critRadius;
    this.shieldBonusMult = extra.shieldBonusMult;
}

Projectile.prototype = {
    draw: function (ctx) {
        const color = CATEGORY_COLOR[this.category] || '#ffffff';
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    move: function (enemies) {
        if (this.target && (this.target.dead || this.target.end)) {
            // Target was killed or escaped by another shot before this one
            // arrived - fizzle out instead of homing in on a ghost.
            this.end = true;
            return;
        }
        if (this.target && !this.end) {
            let distX = this.target.mid.x - this.x;
            let distY = this.target.mid.y - this.y;
            let angle = Math.atan2(distY, distX);
            const step = this.speed * gameSpeed.value;

            this.x += step * Math.cos(angle);
            this.y += step * Math.sin(angle);
            if ((distX < 0 ? -distX : distX) + (distY < 0 ? -distY : distY) < step) {
                this.impact(enemies);
                this.end = true;
            }
        }
        else {
            this.end = true;
        }
    },
    impact: function (enemies) {
        // Pre-hit damage modifiers, in a fixed order so multiple towers'
        // effects stacking (rare, but possible via chain/pierce hitting
        // the same enemy twice) stay predictable: execute overrides
        // everything else (it's a guaranteed kill), then the flat
        // situational bonuses, then the random crit roll last.
        if (this.executeThreshold && this.target.maxHealth > 0
            && (this.target.health / this.target.maxHealth) <= this.executeThreshold) {
            this.pwr = this.target.health; // exactly lethal, not overkill
        } else {
            if (this.shieldBonusMult && this.target.shieldHP > 0) {
                this.pwr = Math.round(this.pwr * this.shieldBonusMult);
            }
            if (this.heavyBonusMult && this.target.maxHealth >= (this.heavyThreshold || Infinity)) {
                this.pwr = Math.round(this.pwr * this.heavyBonusMult);
            }
            if (this.critChance && Math.random() < this.critChance) {
                this.pwr = Math.round(this.pwr * (this.critMult || 1));
                this.wasCrit = true;
            }
        }

        const dealt = this.target.hit(this.pwr);
        spawnDamageNumber(this.target.mid.x, this.target.y - 2, dealt, this.wasCrit ? '#ff6d00' : (CATEGORY_COLOR[this.category] || '#ffffff'));
        recordDamage(this.towerType, dealt);
        if (dealt === 0) {
            playShieldBlock();
        }

        if (this.armorShred && dealt > 0) {
            // Permanent for the rest of this enemy's life, not a
            // recomputed-every-frame aura like Blight Totem's slow -
            // armor plates don't grow back.
            this.target.armor = Math.max(0, (this.target.armor || 0) - this.armorShred);
        }

        if (this.category === CATEGORY.POISON) {
            this.target.applyPoison(this.poisonDps, this.poisonDuration);
        }
        if (this.category === CATEGORY.SLOW) {
            this.target.applySlow(this.slowFloor);
        }

        if (this.critChance && this.wasCrit && this.critRadius && enemies) {
            // The crit's bonus damage already landed on the primary
            // target above; the radius is a secondary, smaller splash
            // onto anyone standing next to it.
            const critSplashDmg = Math.round(this.pwr * 0.4);
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy === this.target || enemy.dead) continue;
                const dx = enemy.mid.x - this.target.mid.x;
                const dy = enemy.mid.y - this.target.mid.y;
                if (dx * dx + dy * dy <= this.critRadius * this.critRadius) {
                    const splashDealt = enemy.hit(critSplashDmg);
                    spawnDamageNumber(enemy.mid.x, enemy.y - 2, splashDealt, '#ff6d00');
                    recordDamage(this.towerType, splashDealt);
                }
            }
        }

        if (this.chainRange && enemies) {
            // Arcs to the single nearest other living enemy in range,
            // not every enemy in range (that's what splash/aoe is for) -
            // a chain is a bolt jumping to one more target, not a blast.
            let nearest = null, nearestDistSq = this.chainRange * this.chainRange;
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy === this.target || enemy.dead) continue;
                const dx = enemy.mid.x - this.target.mid.x;
                const dy = enemy.mid.y - this.target.mid.y;
                const distSq = dx * dx + dy * dy;
                if (distSq <= nearestDistSq) {
                    nearest = enemy;
                    nearestDistSq = distSq;
                }
            }
            if (nearest) {
                const chainDmg = Math.round(this.pwr * (this.chainFalloff || 0.5));
                const chainDealt = nearest.hit(chainDmg);
                spawnDamageNumber(nearest.mid.x, nearest.y - 2, chainDealt, '#4361ee');
                recordDamage(this.towerType, chainDealt);
            }
        }

        if (this.pierceRange && enemies) {
            // Continues in the same direction the shot was already
            // travelling, hitting the next enemy(ies) roughly along that
            // line rather than anyone simply nearby (unlike splash/chain,
            // which don't care about direction).
            const dirX = this.target.mid.x - this.x, dirY = this.target.mid.y - this.y;
            const dirLen = Math.hypot(dirX, dirY) || 1;
            const ux = dirX / dirLen, uy = dirY / dirLen;
            const pierceDmg = Math.round(this.pwr * (this.pierceFalloff || 0.7));
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy === this.target || enemy.dead) continue;
                const ex = enemy.mid.x - this.target.mid.x, ey = enemy.mid.y - this.target.mid.y;
                const forwardDist = ex * ux + ey * uy; // projection onto the firing line
                if (forwardDist < 0 || forwardDist > this.pierceRange) continue;
                const lateralDistSq = (ex * ex + ey * ey) - forwardDist * forwardDist;
                if (lateralDistSq <= 30 * 30) { // stay in a narrow lane, not a wide cone
                    const pierceDealt = enemy.hit(pierceDmg);
                    spawnDamageNumber(enemy.mid.x, enemy.y - 2, pierceDealt, '#adb5bd');
                    recordDamage(this.towerType, pierceDealt);
                }
            }
        }

        if (this.splashRadius && enemies) {
            const splashDmg = Math.round(this.pwr * (this.splashPct || 0));
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy === this.target || enemy.dead) continue;
                const dx = enemy.mid.x - this.target.mid.x;
                const dy = enemy.mid.y - this.target.mid.y;
                if (dx * dx + dy * dy <= this.splashRadius * this.splashRadius) {
                    const effectiveSplashDmg = enemy.splashResistance
                        ? Math.round(splashDmg * (1 - enemy.splashResistance))
                        : splashDmg;
                    const splashDealt = enemy.hit(effectiveSplashDmg);
                    spawnDamageNumber(enemy.mid.x, enemy.y - 2, splashDealt, '#ffb703');
                    recordDamage(this.towerType, splashDealt);
                }
            }
        }
    },
}

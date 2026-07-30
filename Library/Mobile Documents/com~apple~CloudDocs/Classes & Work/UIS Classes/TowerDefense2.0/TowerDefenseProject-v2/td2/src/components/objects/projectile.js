import { gameSpeed } from '../utils/gameSpeed';
import { CATEGORY } from './towerCategory';

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
        this.target.hit(this.pwr);

        if (this.category === CATEGORY.POISON) {
            this.target.applyPoison(this.poisonDps, this.poisonDuration);
        }
        if (this.category === CATEGORY.SLOW) {
            this.target.applySlow(this.slowFloor);
        }
        if (this.splashRadius && enemies) {
            const splashDmg = Math.round(this.pwr * (this.splashPct || 0));
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy === this.target || enemy.dead) continue;
                const dx = enemy.mid.x - this.target.mid.x;
                const dy = enemy.mid.y - this.target.mid.y;
                if (dx * dx + dy * dy <= this.splashRadius * this.splashRadius) {
                    enemy.hit(splashDmg);
                }
            }
        }
    },
}

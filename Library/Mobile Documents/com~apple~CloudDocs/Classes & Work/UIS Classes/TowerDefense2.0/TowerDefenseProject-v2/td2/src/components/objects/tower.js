import { Projectile } from './projectile';
import { gameSpeed } from '../utils/gameSpeed';
import { playTowerFire, playUpgradeTower } from '../utils/sfx';
import { CATEGORY } from './towerCategory';

export { CATEGORY };

export const TOWER_DEFS = {
    // ---- Attack towers (5) ----
    1: {
        name: 'Striker', category: CATEGORY.ATTACK, shape: 'circle', color: '#e63946',
        levels: [
            { price: 10, range: 150, fireRate: 1.0, dmg: 50 },
            { price: 12, range: 160, fireRate: 0.92, dmg: 65 },
            { price: 16, range: 170, fireRate: 0.84, dmg: 85 },
            { price: 22, range: 180, fireRate: 0.76, dmg: 110 },
            { price: 30, range: 190, fireRate: 0.68, dmg: 140 },
        ],
    },
    2: {
        name: 'Sniper', category: CATEGORY.ATTACK, shape: 'triangle', color: '#f1c40f',
        levels: [
            { price: 25, range: 260, fireRate: 2.2, dmg: 180 },
            { price: 20, range: 280, fireRate: 2.0, dmg: 230 },
            { price: 28, range: 300, fireRate: 1.8, dmg: 300 },
            { price: 38, range: 320, fireRate: 1.6, dmg: 390 },
            { price: 52, range: 340, fireRate: 1.4, dmg: 500 },
        ],
        targeting: 'strongest',
    },
    3: {
        name: 'Blaster', category: CATEGORY.ATTACK, shape: 'diamond', color: '#f4a300',
        levels: [
            { price: 35, range: 120, fireRate: 1.3, dmg: 12 },
            { price: 18, range: 128, fireRate: 1.22, dmg: 16 },
            { price: 24, range: 136, fireRate: 1.14, dmg: 21 },
            { price: 32, range: 144, fireRate: 1.06, dmg: 27 },
            { price: 42, range: 152, fireRate: 0.98, dmg: 34 },
        ],
        aoe: true,
    },
    4: {
        name: 'Burner', category: CATEGORY.ATTACK, shape: 'square', color: '#2ecc71',
        levels: [
            { price: 18, range: 95, fireRate: 0.35, dmg: 14 },
            { price: 14, range: 100, fireRate: 0.30, dmg: 18 },
            { price: 18, range: 105, fireRate: 0.26, dmg: 23 },
            { price: 24, range: 110, fireRate: 0.22, dmg: 29 },
            { price: 32, range: 115, fireRate: 0.18, dmg: 36 },
        ],
        targeting: 'fastest',
    },
    5: {
        name: 'Cannon', category: CATEGORY.ATTACK, shape: 'hexagon', color: '#8e44ad',
        levels: [
            { price: 45, range: 140, fireRate: 1.6, dmg: 90, splashRadius: 45, splashPct: 0.5 },
            { price: 25, range: 145, fireRate: 1.5, dmg: 115, splashRadius: 48, splashPct: 0.5 },
            { price: 34, range: 150, fireRate: 1.4, dmg: 150, splashRadius: 51, splashPct: 0.55 },
            { price: 46, range: 155, fireRate: 1.3, dmg: 195, splashRadius: 54, splashPct: 0.55 },
            { price: 62, range: 160, fireRate: 1.2, dmg: 250, splashRadius: 58, splashPct: 0.6 },
        ],
    },

    // ---- Special towers (5) ----
    6: {
        name: 'Toxin Spire', category: CATEGORY.POISON, shape: 'cross', color: '#7cb518',
        levels: [
            { price: 28, range: 110, fireRate: 1.4, dmg: 10, poisonDps: 12, poisonDuration: 3000 },
            { price: 16, range: 115, fireRate: 1.3, dmg: 13, poisonDps: 16, poisonDuration: 3000 },
            { price: 22, range: 120, fireRate: 1.2, dmg: 16, poisonDps: 21, poisonDuration: 3200 },
            { price: 30, range: 125, fireRate: 1.1, dmg: 20, poisonDps: 27, poisonDuration: 3200 },
            { price: 40, range: 130, fireRate: 1.0, dmg: 25, poisonDps: 35, poisonDuration: 3500 },
        ],
    },
    7: {
        name: 'Frost Tower', category: CATEGORY.SLOW, shape: 'star', color: '#48cae4',
        levels: [
            { price: 20, range: 110, fireRate: 1.0, dmg: 10, slowFloor: 0.75 },
            { price: 14, range: 115, fireRate: 0.95, dmg: 12, slowFloor: 0.68 },
            { price: 18, range: 120, fireRate: 0.9, dmg: 15, slowFloor: 0.60 },
            { price: 24, range: 125, fireRate: 0.85, dmg: 18, slowFloor: 0.52 },
            { price: 32, range: 130, fireRate: 0.8, dmg: 22, slowFloor: 0.40 },
        ],
    },
    8: {
        name: 'Bank', category: CATEGORY.BANK, shape: 'pentagon', color: '#ffd60a',
        levels: [
            { price: 30, incomePerSecond: 1.0 },
            { price: 20, incomePerSecond: 1.6 },
            { price: 28, incomePerSecond: 2.4 },
            { price: 38, incomePerSecond: 3.4 },
            { price: 50, incomePerSecond: 4.6 },
        ],
    },
    9: {
        name: 'Bulwark', category: CATEGORY.BOSS_HUNTER, shape: 'octagon', color: '#d90429',
        levels: [
            { price: 40, range: 170, fireRate: 1.8, dmg: 260 },
            { price: 22, range: 175, fireRate: 1.7, dmg: 340 },
            { price: 30, range: 180, fireRate: 1.6, dmg: 440 },
            { price: 40, range: 185, fireRate: 1.5, dmg: 570 },
            { price: 55, range: 190, fireRate: 1.4, dmg: 740 },
        ],
    },
    10: {
        name: 'Beacon', category: CATEGORY.SUPPORT, shape: 'plus', color: '#4cc9f0',
        levels: [
            { price: 35, auraRange: 130, rangeBonus: 0.10, dmgBonus: 0.12, fireRateBonus: 0.10 },
            { price: 20, auraRange: 140, rangeBonus: 0.14, dmgBonus: 0.17, fireRateBonus: 0.14 },
            { price: 28, auraRange: 150, rangeBonus: 0.18, dmgBonus: 0.22, fireRateBonus: 0.18 },
            { price: 38, auraRange: 160, rangeBonus: 0.23, dmgBonus: 0.28, fireRateBonus: 0.23 },
            { price: 52, auraRange: 170, rangeBonus: 0.30, dmgBonus: 0.36, fireRateBonus: 0.30 },
        ],
    },
};

export const TOWER_TYPES = Object.keys(TOWER_DEFS).map(Number);

export function Tower(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 50;
    this.height = 50;
    this.mid = { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    this.timer = Date.now();
    this.fire = true;
    this.sold = false;
    this.level = 1;
    this.maxLevel = TOWER_DEFS[type].levels.length;

    this.auraBonus = { range: 0, dmg: 0, fireRate: 0 };

    this.def = TOWER_DEFS[type];
    this.price = this.def.levels[0].price;
    this.upgradeCost = this.def.levels[0].price;

    this._refreshStats();
}

Tower.prototype = {
    _refreshStats: function () {
        const stats = this.def.levels[this.level - 1];
        Object.assign(this, stats);
        if (this.level < this.maxLevel) {
            this.upgradeCost = this.def.levels[this.level].price;
        }
    },
    effectiveRange: function () {
        return (this.range || 0) * (1 + this.auraBonus.range);
    },
    effectiveDmg: function () {
        return (this.dmg || 0) * (1 + this.auraBonus.dmg);
    },
    effectiveFireRate: function () {
        return (this.fireRate || 0) / (1 + this.auraBonus.fireRate);
    },
    draw: function (ctx) {
        const { shape, color } = this.def;
        const cx = this.mid.x, cy = this.mid.y;
        const scale = 1 + (this.level - 1) * 0.09;
        const r = (this.height / 2 - 4) * scale;

        for (let i = 0; i < this.level - 1; i++) {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.35 - i * 0.05;
            ctx.lineWidth = 2;
            ctx.arc(cx, cy, r + 6 + i * 6, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        if (this.upgradeGlowUntil && Date.now() < this.upgradeGlowUntil) {
            const remaining = this.upgradeGlowUntil - Date.now();
            const fade = Math.min(1, remaining / 900);
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.35 * fade;
            ctx.shadowColor = color;
            ctx.shadowBlur = 16 * fade;
            ctx.fill();
            ctx.restore();
        }

        drawShape(ctx, shape, cx, cy, r, color);

        if (this.level > 1) {
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = '#111';
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.arc(this.x + this.width - 6, this.y + 6, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(this.level), this.x + this.width - 6, this.y + 7);
            ctx.restore();
        }
    },
    drawRange: function (ctx) {
        ctx.beginPath();
        ctx.strokeStyle = 'white';
        const r = this.def.category === CATEGORY.SUPPORT ? this.auraRange : this.effectiveRange();
        ctx.arc(this.mid.x, this.mid.y, r, 0, Math.PI * 2, true);
        ctx.stroke();
    },
    inRange: function (enemy) {
        const r = this.effectiveRange();
        return (this.mid.x - enemy.mid.x) * (this.mid.x - enemy.mid.x) + (this.mid.y - enemy.mid.y) * (this.mid.y - enemy.mid.y) < r * r;
    },
    shoot: function (bullets, enemies) {
        const category = this.def.category;
        if (category === CATEGORY.BANK || category === CATEGORY.SUPPORT) return;

        let targets = enemies;
        if (category === CATEGORY.BOSS_HUNTER) {
            targets = enemies.filter(e => e.type === 5);
        }

        if (this.fire && targets.length > 0) {
            const extra = {
                poisonDps: this.poisonDps,
                poisonDuration: this.poisonDuration,
                slowFloor: this.slowFloor,
                splashRadius: this.splashRadius,
                splashPct: this.splashPct,
            };
            if (this.def.aoe) {
                for (let i = 0; i < targets.length; i++) {
                    bullets.push(new Projectile(this.mid.x, this.mid.y, category, targets[i], this.effectiveDmg(), extra));
                }
            } else {
                let target;
                if (this.def.targeting === 'strongest') {
                    target = targets.slice().sort((a, b) => b.health - a.health)[0];
                } else if (this.def.targeting === 'fastest') {
                    target = targets.slice().sort((a, b) => b.speed - a.speed)[0];
                } else {
                    target = targets.slice().sort((a, b) => b.distance - a.distance)[0];
                }
                bullets.push(new Projectile(this.mid.x, this.mid.y, category, target, this.effectiveDmg(), extra));
            }
            playTowerFire(this.type);
            this.fire = false;
            this.timer = Date.now();
        } else if ((Date.now() - this.timer) / 1000 * gameSpeed.value >= this.effectiveFireRate()) {
            this.fire = true;
        }
    },
    canUpgrade: function () {
        return this.level < this.maxLevel;
    },
    upgrade: function () {
        if (!this.canUpgrade()) return;
        this.level++;
        this._refreshStats();
        this.upgradeGlowUntil = Date.now() + 900;
        playUpgradeTower();
    },
    getSellValue: function () {
        let spent = this.def.levels[0].price;
        for (let i = 1; i < this.level; i++) spent += this.def.levels[i].price;
        return Math.round(spent * 0.5);
    },
    sell: function () {
        this.sold = true;
        return this.getSellValue();
    }
}

export function drawShape(ctx, shape, cx, cy, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    switch (shape) {
        case 'circle':
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            break;
        case 'square': {
            const s = r * 1.5;
            ctx.rect(cx - s / 2, cy - s / 2, s, s);
            break;
        }
        case 'triangle':
            polygon(ctx, cx, cy, r * 1.15, 3, -Math.PI / 2);
            break;
        case 'diamond':
            polygon(ctx, cx, cy, r * 1.1, 4, -Math.PI / 2);
            break;
        case 'pentagon':
            polygon(ctx, cx, cy, r, 5, -Math.PI / 2);
            break;
        case 'hexagon':
            polygon(ctx, cx, cy, r, 6, 0);
            break;
        case 'octagon':
            polygon(ctx, cx, cy, r, 8, Math.PI / 8);
            break;
        case 'star':
            star(ctx, cx, cy, r, r * 0.45, 5);
            break;
        case 'cross':
            crossShape(ctx, cx, cy, r);
            break;
        case 'plus':
            crossShape(ctx, cx, cy, r * 0.9);
            break;
        default:
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function polygon(ctx, cx, cy, r, sides, rotation = 0) {
    for (let i = 0; i < sides; i++) {
        const angle = rotation + (i / sides) * Math.PI * 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
}

function star(ctx, cx, cy, outerR, innerR, points) {
    for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
}

function crossShape(ctx, cx, cy, r) {
    const t = r * 0.5;
    ctx.moveTo(cx - t, cy - r); ctx.lineTo(cx + t, cy - r);
    ctx.lineTo(cx + t, cy - t); ctx.lineTo(cx + r, cy - t);
    ctx.lineTo(cx + r, cy + t); ctx.lineTo(cx + t, cy + t);
    ctx.lineTo(cx + t, cy + r); ctx.lineTo(cx - t, cy + r);
    ctx.lineTo(cx - t, cy + t); ctx.lineTo(cx - r, cy + t);
    ctx.lineTo(cx - r, cy - t); ctx.lineTo(cx - t, cy - t);
}

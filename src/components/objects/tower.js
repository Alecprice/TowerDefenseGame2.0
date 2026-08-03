import { Projectile } from './projectile';
import { gameSpeed } from '../utils/gameSpeed';
import { playTowerFire, playUpgradeTower } from '../utils/sfx';
import { CATEGORY } from './towerCategory';

// Endless-mode meta-progression multipliers. Set once per run by
// GamePage from metaProgression.js (mirrors the gameSpeed.js pattern -
// a single shared mutable object rather than threading props through
// every tower). Defaults to 1x/no bonus so the class works unchanged
// if a caller never touches this (e.g. in tests).
export const META = { dmgMult: 1, fireRateMult: 1, bankMult: 1 };

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

    // ---- Specialist support towers (4) ----
    // Every one of these deals zero direct damage (shoot() bails out for
    // CATEGORY.SUPPORT before it ever builds a projectile) - each only
    // buffs other towers standing in its aura. Beacon (above) is the
    // generalist that nudges all three stats a little; these four are
    // specialists that push hard on exactly one stat each, so stacking
    // them with a Beacon (or with each other) is a real deckbuilding
    // choice rather than one tower just being strictly better.
    11: {
        name: 'Sharpshooter Nest', category: CATEGORY.SUPPORT, shape: 'watchtower', color: '#588157',
        levels: [
            { price: 25, auraRange: 140, rangeBonus: 0.22, dmgBonus: 0, fireRateBonus: 0 },
            { price: 15, auraRange: 152, rangeBonus: 0.30, dmgBonus: 0, fireRateBonus: 0 },
            { price: 20, auraRange: 164, rangeBonus: 0.38, dmgBonus: 0, fireRateBonus: 0 },
            { price: 28, auraRange: 176, rangeBonus: 0.46, dmgBonus: 0, fireRateBonus: 0 },
            { price: 38, auraRange: 190, rangeBonus: 0.55, dmgBonus: 0, fireRateBonus: 0 },
        ],
    },
    12: {
        name: 'Ammo Depot', category: CATEGORY.SUPPORT, shape: 'silo', color: '#bc6c25',
        levels: [
            { price: 30, auraRange: 120, rangeBonus: 0, dmgBonus: 0.25, fireRateBonus: 0 },
            { price: 18, auraRange: 130, rangeBonus: 0, dmgBonus: 0.34, fireRateBonus: 0 },
            { price: 24, auraRange: 140, rangeBonus: 0, dmgBonus: 0.44, fireRateBonus: 0 },
            { price: 32, auraRange: 150, rangeBonus: 0, dmgBonus: 0.55, fireRateBonus: 0 },
            { price: 44, auraRange: 160, rangeBonus: 0, dmgBonus: 0.68, fireRateBonus: 0 },
        ],
    },
    13: {
        name: 'Overclock Rig', category: CATEGORY.SUPPORT, shape: 'turbine', color: '#e0aaff',
        levels: [
            { price: 30, auraRange: 120, rangeBonus: 0, dmgBonus: 0, fireRateBonus: 0.25 },
            { price: 18, auraRange: 130, rangeBonus: 0, dmgBonus: 0, fireRateBonus: 0.33 },
            { price: 24, auraRange: 140, rangeBonus: 0, dmgBonus: 0, fireRateBonus: 0.42 },
            { price: 32, auraRange: 150, rangeBonus: 0, dmgBonus: 0, fireRateBonus: 0.52 },
            { price: 44, auraRange: 160, rangeBonus: 0, dmgBonus: 0, fireRateBonus: 0.62 },
        ],
    },
    14: {
        name: 'Command Spire', category: CATEGORY.SUPPORT, shape: 'antenna', color: '#ffb703',
        levels: [
            // auraRange is intentionally larger than any map diagonal -
            // this buff reaches every tower on the board, not just
            // nearby ones, so it stays deliberately weaker per-stat than
            // the radius-limited specialists above.
            { price: 60, auraRange: 5000, rangeBonus: 0.04, dmgBonus: 0.05, fireRateBonus: 0.04 },
            { price: 35, auraRange: 5000, rangeBonus: 0.06, dmgBonus: 0.07, fireRateBonus: 0.06 },
            { price: 45, auraRange: 5000, rangeBonus: 0.08, dmgBonus: 0.09, fireRateBonus: 0.08 },
            { price: 60, auraRange: 5000, rangeBonus: 0.10, dmgBonus: 0.11, fireRateBonus: 0.10 },
            { price: 80, auraRange: 5000, rangeBonus: 0.13, dmgBonus: 0.14, fireRateBonus: 0.13 },
        ],
    },

    // ---- Global-reach attacker (1) ----
    15: {
        name: 'Farseer Spire', category: CATEGORY.ATTACK, shape: 'eye', color: '#3a86ff',
        levels: [
            { price: 55, range: 9999, fireRate: 2.4, dmg: 130 },
            { price: 32, range: 9999, fireRate: 2.2, dmg: 170 },
            { price: 42, range: 9999, fireRate: 2.0, dmg: 225 },
            { price: 56, range: 9999, fireRate: 1.8, dmg: 295 },
            { price: 75, range: 9999, fireRate: 1.6, dmg: 385 },
        ],
        targeting: 'strongest',
        global: true, // ignores range entirely - see Tower.inRange()
    },
};

export const TOWER_TYPES = Object.keys(TOWER_DEFS).map(Number);

export function Tower(x, y, type, defsTable = TOWER_DEFS) {
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
    this.maxLevel = defsTable[type].levels.length;

    this.auraBonus = { range: 0, dmg: 0, fireRate: 0 };

    this.def = defsTable[type];
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
        return (this.dmg || 0) * (1 + this.auraBonus.dmg) * META.dmgMult;
    },
    effectiveFireRate: function () {
        return (this.fireRate || 0) / (1 + this.auraBonus.fireRate) / META.fireRateMult;
    },
    effectiveIncome: function () {
        return (this.incomePerSecond || 0) * META.bankMult;
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
        const r = this.def.category === CATEGORY.SUPPORT ? this.auraRange : this.effectiveRange();
        if (this.def.global || r > 1000) {
            // Whole-map reach doesn't fit as a circle - a dashed border
            // around the play area reads much more clearly than an
            // enormous, mostly off-screen circle would.
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.55)';
            ctx.setLineDash([8, 6]);
            ctx.lineWidth = 2;
            ctx.strokeRect(4, 4, ctx.canvas.width - 8, ctx.canvas.height - 8);
            ctx.restore();
            return;
        }
        ctx.beginPath();
        ctx.strokeStyle = 'white';
        ctx.arc(this.mid.x, this.mid.y, r, 0, Math.PI * 2, true);
        ctx.stroke();
    },
    inRange: function (enemy) {
        if (this.def.global) return true;
        const r = this.effectiveRange();
        return (this.mid.x - enemy.mid.x) * (this.mid.x - enemy.mid.x) + (this.mid.y - enemy.mid.y) * (this.mid.y - enemy.mid.y) < r * r;
    },
    shoot: function (bullets, enemies) {
        const category = this.def.category;
        if (category === CATEGORY.BANK || category === CATEGORY.CRYSTAL || category === CATEGORY.SUPPORT) return;

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
                towerType: this.type,
                // Game 3.0 only (see towerDefsV3.js) - undefined for
                // every original-game tower, since none of them ever
                // have these fields set on `this` by _refreshStats().
                executeThreshold: this.executeThreshold,
                chainRange: this.chainRange,
                chainFalloff: this.chainFalloff,
                armorShred: this.armorShred,
                heavyBonusMult: this.heavyBonusMult,
                heavyThreshold: this.heavyThreshold,
                pierceRange: this.pierceRange,
                pierceFalloff: this.pierceFalloff,
                critChance: this.critChance,
                critMult: this.critMult,
                critRadius: this.critRadius,
                shieldBonusMult: this.shieldBonusMult,
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

// ---------------------------------------------------------------------
// Procedural tower art. Every tower is still drawn with plain canvas
// calls (no image assets), but instead of one flat filled polygon each
// type now gets a small layered rig - a base plate, a shaded body, and
// one or two identifying details - so the ten towers read as ten
// distinct little machines instead of ten colored polygons. `shape` is
// kept as the lookup key for backwards compatibility (TOWER_DEFS, save
// data, tests) but no longer describes a single flat-filled polygon.
// ---------------------------------------------------------------------

function shade(color, amt) {
    // amt in [-1, 1]; negative = darker, positive = lighter
    const c = color.replace('#', '');
    const num = parseInt(c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c, 16);
    let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
    const mix = amt > 0 ? 255 : 0;
    const k = Math.abs(amt);
    r = Math.round(r + (mix - r) * k);
    g = Math.round(g + (mix - g) * k);
    b = Math.round(b + (mix - b) * k);
    return `rgb(${r},${g},${b})`;
}

function roundedRect(ctx, x, y, w, h, rad) {
    const r = Math.min(rad, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function basePlate(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.62, r * 0.98, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.5, r * 0.92, r * 0.36, 0, 0, Math.PI * 2);
    const grd = ctx.createLinearGradient(cx, cy, cx, cy + r);
    grd.addColorStop(0, shade(color, -0.55));
    grd.addColorStop(1, shade(color, -0.7));
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}

function bodyFill(ctx, cx, cy, r, color) {
    const grd = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.15, cx, cy, r * 1.2);
    grd.addColorStop(0, shade(color, 0.45));
    grd.addColorStop(0.55, color);
    grd.addColorStop(1, shade(color, -0.35));
    return grd;
}

function outline(ctx, color) {
    ctx.strokeStyle = shade(color, -0.6);
    ctx.lineWidth = 2;
    ctx.stroke();
}

function barrel(ctx, cx, cy, angle, len, w, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const grd = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
    grd.addColorStop(0, shade(color, 0.2));
    grd.addColorStop(1, shade(color, -0.5));
    ctx.fillStyle = grd;
    ctx.strokeStyle = shade(color, -0.65);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.rect(-w / 2, -len, w, len);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

// Cosmetic palette (see metaProgression.js). A single shared mutable
// value, same pattern as META/gameSpeed - GamePage sets this once per
// run from the player's selected palette. 0 = no shift = every tower
// keeps its original designed color.
export const COSMETIC = { hueShift: 0 };

function hexToHsl(hex) {
    const c = hex.replace('#', '');
    const num = parseInt(c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c, 16);
    const r = ((num >> 16) & 0xff) / 255, g = ((num >> 8) & 0xff) / 255, b = (num & 0xff) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            default: h = (r - g) / d + 4;
        }
        h /= 6;
    }
    return [h * 360, s, l];
}

function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Rotates a hex color's hue by `deg` degrees, preserving its saturation
// and lightness - so a palette re-skins every tower consistently without
// needing a bespoke recolor table per tower.
function shiftHue(hex, deg) {
    if (!deg) return hex;
    const [h, s, l] = hexToHsl(hex);
    return hslToHex(h + deg, s, l);
}

export function drawShape(ctx, shape, cx, cy, r, color) {
    color = shiftHue(color, COSMETIC.hueShift);
    ctx.save();
    basePlate(ctx, cx, cy, r, color);
    const t = Date.now() / 500;

    switch (shape) {
        case 'circle': { // Striker - round bunker, twin stub cannons
            barrel(ctx, cx - r * 0.32, cy - r * 0.1, 0, r * 1.05, r * 0.24, color);
            barrel(ctx, cx + r * 0.32, cy - r * 0.1, 0, r * 1.05, r * 0.24, color);
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r * 0.78, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = shade(color, -0.45);
            ctx.fill();
            break;
        }
        case 'triangle': { // Sniper - tall spire, long barrel, scope
            barrel(ctx, cx, cy + r * 0.1, -Math.PI / 2, r * 1.6, r * 0.16, color);
            ctx.beginPath();
            polygon(ctx, cx, cy, r * 1.05, 3, -Math.PI / 2);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy - r * 0.15, r * 0.22, 0, Math.PI * 2);
            ctx.fillStyle = shade(color, 0.5);
            ctx.strokeStyle = shade(color, -0.6);
            ctx.lineWidth = 1.2;
            ctx.fill(); ctx.stroke();
            break;
        }
        case 'diamond': { // Blaster - radial emitter with orbiting nodes
            const pulse = 0.85 + Math.sin(t) * 0.15;
            ctx.beginPath();
            polygon(ctx, cx, cy, r, 4, -Math.PI / 2);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2 + t * 0.6;
                const nx = cx + Math.cos(a) * r * 1.05;
                const ny = cy + Math.sin(a) * r * 1.05;
                ctx.beginPath();
                ctx.arc(nx, ny, r * 0.13, 0, Math.PI * 2);
                ctx.fillStyle = shade(color, 0.3);
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.28 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
            break;
        }
        case 'square': { // Burner - vented block, hot core, flame slits
            const s = r * 1.4;
            const grd = bodyFill(ctx, cx, cy, r, color);
            ctx.beginPath();
            roundedRect(ctx, cx - s / 2, cy - s / 2, s, s, r * 0.22);
            ctx.fillStyle = grd;
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            for (let i = -1; i <= 1; i++) {
                ctx.save();
                ctx.translate(cx + i * s * 0.28, cy);
                ctx.rotate(Math.PI / 10);
                ctx.beginPath();
                ctx.rect(-s * 0.06, -s * 0.32, s * 0.12, s * 0.64);
                ctx.fillStyle = 'rgba(20,10,0,0.55)';
                ctx.fill();
                ctx.restore();
            }
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.22 + Math.sin(t * 2) * r * 0.03, 0, Math.PI * 2);
            ctx.fillStyle = '#ffdd66';
            ctx.shadowColor = '#ff7b00';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
            break;
        }
        case 'hexagon': { // Cannon - squat chassis, thick mortar barrel
            barrel(ctx, cx, cy + r * 0.05, -Math.PI / 2, r * 1.15, r * 0.5, color);
            ctx.beginPath();
            ctx.arc(cx, cy - r * 1.15, r * 0.32, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1a1a';
            ctx.fill();
            ctx.beginPath();
            polygon(ctx, cx, cy, r, 6, 0);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78, r * 0.08, 0, Math.PI * 2);
                ctx.fillStyle = shade(color, -0.55);
                ctx.fill();
            }
            break;
        }
        case 'cross': { // Toxin Spire - organic stalk, dripping bulb tips
            ctx.beginPath();
            crossShape(ctx, cx, cy, r * 0.85);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            const tips = [[0, -r], [0, r], [-r, 0], [r, 0]];
            for (const [dx, dy] of tips) {
                ctx.beginPath();
                ctx.arc(cx + dx * 0.85, cy + dy * 0.85, r * 0.16 + Math.sin(t + dx + dy) * r * 0.02, 0, Math.PI * 2);
                ctx.fillStyle = shade(color, 0.35);
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.24, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(180,255,120,0.9)';
            ctx.fill();
            break;
        }
        case 'star': { // Frost Tower - ice crystal cluster
            const shimmer = 0.5 + Math.sin(t * 1.5) * 0.5;
            for (let i = 0; i < 3; i++) {
                const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
                ctx.save();
                ctx.translate(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55);
                ctx.rotate(a);
                ctx.beginPath();
                polygon(ctx, 0, 0, r * 0.4, 3, 0);
                ctx.fillStyle = shade(color, 0.15);
                ctx.strokeStyle = shade(color, -0.5);
                ctx.lineWidth = 1;
                ctx.fill(); ctx.stroke();
                ctx.restore();
            }
            ctx.beginPath();
            star(ctx, cx, cy, r, r * 0.45, 6);
            const grd = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
            grd.addColorStop(0, '#ffffff');
            grd.addColorStop(0.5, color);
            grd.addColorStop(1, shade(color, -0.3));
            ctx.fillStyle = grd;
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.6 + shimmer * 0.4})`;
            ctx.fill();
            break;
        }
        case 'pentagon': { // Bank - armored vault, coin slot, $ badge
            ctx.beginPath();
            polygon(ctx, cx, cy, r, 5, -Math.PI / 2);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            ctx.beginPath();
            roundedRect(ctx, cx - r * 0.4, cy - r * 0.08, r * 0.8, r * 0.34, r * 0.08);
            ctx.fillStyle = 'rgba(20,15,0,0.6)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy - r * 0.4, r * 0.22, 0, Math.PI * 2);
            ctx.fillStyle = '#fff8d6';
            ctx.strokeStyle = shade(color, -0.6);
            ctx.lineWidth = 1.2;
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = shade(color, -0.7);
            ctx.font = `bold ${Math.round(r * 0.32)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', cx, cy - r * 0.39);
            break;
        }
        case 'octagon': { // Bulwark - reinforced fortress, corner studs
            ctx.beginPath();
            polygon(ctx, cx, cy, r, 8, Math.PI / 8);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            ctx.beginPath();
            polygon(ctx, cx, cy, r * 0.72, 8, Math.PI / 8);
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
            for (let i = 0; i < 8; i += 2) {
                const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92, r * 0.1, 0, Math.PI * 2);
                ctx.fillStyle = shade(color, -0.35);
                ctx.strokeStyle = shade(color, -0.65);
                ctx.lineWidth = 1;
                ctx.fill(); ctx.stroke();
            }
            barrel(ctx, cx, cy + r * 0.1, -Math.PI / 2, r * 0.55, r * 0.22, color);
            break;
        }
        case 'plus': { // Beacon - support pylon, rotating light dish
            ctx.beginPath();
            crossShape(ctx, cx, cy, r * 0.6);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r * 0.8, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            ctx.save();
            ctx.translate(cx, cy - r * 0.35);
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.5, r * 0.18, 0, 0, Math.PI * 2);
            ctx.fillStyle = shade(color, 0.25);
            ctx.strokeStyle = shade(color, -0.5);
            ctx.lineWidth = 1.2;
            ctx.fill(); ctx.stroke();
            ctx.restore();
            const glow = 0.5 + Math.sin(t * 2) * 0.5;
            ctx.beginPath();
            ctx.arc(cx, cy - r * 0.35, r * 0.14, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.5 + glow * 0.5})`;
            ctx.shadowColor = color;
            ctx.shadowBlur = 14 * glow;
            ctx.fill();
            ctx.shadowBlur = 0;
            break;
        }
        case 'watchtower': { // Sharpshooter Nest - lattice tower + focusing lens
            ctx.save();
            ctx.strokeStyle = shade(color, -0.35);
            ctx.lineWidth = r * 0.09;
            const top = cy - r * 1.1, bot = cy + r * 0.7;
            const topW = r * 0.35, botW = r * 0.85;
            ctx.beginPath();
            ctx.moveTo(cx - botW, bot); ctx.lineTo(cx - topW, top);
            ctx.moveTo(cx + botW, bot); ctx.lineTo(cx + topW, top);
            // cross braces
            for (let i = 0; i < 3; i++) {
                const y0 = bot - (bot - top) * (i / 3);
                const y1 = bot - (bot - top) * ((i + 1) / 3);
                const w0 = botW - (botW - topW) * (i / 3);
                const w1 = botW - (botW - topW) * ((i + 1) / 3);
                ctx.moveTo(cx - w0, y0); ctx.lineTo(cx + w1, y1);
                ctx.moveTo(cx + w0, y0); ctx.lineTo(cx - w1, y1);
            }
            ctx.stroke();
            ctx.restore();
            ctx.beginPath();
            ctx.arc(cx, top, r * 0.32, 0, Math.PI * 2);
            ctx.fillStyle = bodyFill(ctx, cx, top, r * 0.32, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.32, top); ctx.lineTo(cx + r * 0.32, top);
            ctx.moveTo(cx, top - r * 0.32); ctx.lineTo(cx, top + r * 0.32);
            ctx.stroke();
            ctx.restore();
            break;
        }
        case 'silo': { // Ammo Depot - stacked ammo canisters
            const canisters = [
                { dx: -r * 0.42, s: 0.85 }, { dx: r * 0.42, s: 0.85 }, { dx: 0, s: 1 },
            ];
            canisters.forEach(({ dx, s }) => {
                const w = r * 0.55 * s, h = r * 1.3 * s;
                const x0 = cx + dx - w / 2, y0 = cy + r * 0.55 - h;
                ctx.beginPath();
                roundedRect(ctx, x0, y0, w, h, w * 0.3);
                ctx.fillStyle = bodyFill(ctx, cx + dx, cy, w, color);
                outline(ctx, color);
                ctx.fill(); ctx.stroke();
                for (let b = 1; b <= 2; b++) {
                    ctx.beginPath();
                    ctx.moveTo(x0, y0 + h * (b / 3));
                    ctx.lineTo(x0 + w, y0 + h * (b / 3));
                    ctx.strokeStyle = shade(color, -0.5);
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            });
            break;
        }
        case 'turbine': { // Overclock Rig - spinning fan hub
            const spin = t * 2.5;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(spin);
            for (let i = 0; i < 5; i++) {
                ctx.save();
                ctx.rotate((i / 5) * Math.PI * 2);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(r * 0.55, -r * 0.15, r * 0.95, 0);
                ctx.quadraticCurveTo(r * 0.55, r * 0.15, 0, 0);
                ctx.fillStyle = shade(color, i % 2 === 0 ? 0.1 : -0.15);
                ctx.strokeStyle = shade(color, -0.5);
                ctx.lineWidth = 1;
                ctx.fill(); ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r * 0.32, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            break;
        }
        case 'antenna': { // Command Spire - broadcast mast, pulsing rings
            ctx.save();
            ctx.strokeStyle = shade(color, -0.3);
            ctx.lineWidth = r * 0.1;
            ctx.beginPath();
            ctx.moveTo(cx, cy + r * 0.7); ctx.lineTo(cx, cy - r * 1.15);
            ctx.stroke();
            ctx.restore();
            for (let i = 0; i < 3; i++) {
                const phase = (t * 0.7 + i / 3) % 1;
                ctx.beginPath();
                ctx.arc(cx, cy - r * 1.15, r * 0.15 + phase * r * 0.7, -Math.PI * 0.55, -Math.PI * 0.15);
                ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - phase)})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy - r * 1.15, r * 0.15 + phase * r * 0.7, Math.PI * 0.15, Math.PI * 0.55);
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(cx, cy - r * 1.15, r * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = shade(color, 0.4);
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r * 0.55, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            break;
        }
        case 'eye': { // Farseer Spire - all-seeing lens, scans the whole board
            const dilate = 0.85 + Math.sin(t * 0.8) * 0.15;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r * 1.05, r * 0.65, 0, 0, Math.PI * 2);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.42 * dilate, 0, Math.PI * 2);
            ctx.fillStyle = shade(color, -0.55);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.18 * dilate, 0, Math.PI * 2);
            ctx.fillStyle = '#0a0a0a';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx - r * 0.12, cy - r * 0.12, r * 0.09, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fill();
            const scan = (t * 1.2) % (Math.PI * 2);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(scan);
            ctx.strokeStyle = `rgba(255,255,255,0.35)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(r * 1.5, 0);
            ctx.stroke();
            ctx.restore();
            break;
        }
        // ---- Game 3.0 shapes (below) ----
        case 'executioner': { // Executioner - dark blade poised to finish off low-HP enemies
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(-Math.PI / 10);
            ctx.beginPath();
            ctx.moveTo(0, -r * 1.15);
            ctx.lineTo(r * 0.5, -r * 0.1);
            ctx.lineTo(r * 0.15, r * 0.3);
            ctx.lineTo(-r * 0.15, r * 0.15);
            ctx.closePath();
            ctx.fillStyle = shade(color, -0.1);
            ctx.strokeStyle = shade(color, -0.6);
            ctx.lineWidth = 1.5;
            ctx.fill(); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -r * 1.05);
            ctx.lineTo(r * 0.4, -r * 0.12);
            ctx.stroke();
            ctx.restore();
            ctx.beginPath();
            ctx.arc(cx, cy + r * 0.35, r * 0.55, 0, Math.PI * 2);
            ctx.fillStyle = bodyFill(ctx, cx, cy + r * 0.35, r * 0.55, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            break;
        }
        case 'chainbolt': { // Chain Bolt - tesla coil arcing to nearby enemies
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r * 0.7, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            const arcT = Date.now() / 120;
            [-1, 1].forEach((side) => {
                const nx = cx + side * r * 1.05, ny = cy - r * 0.1;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + side * r * 0.5, cy - r * 0.35 + Math.sin(arcT + side) * 4);
                ctx.lineTo(nx, ny);
                ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(arcT * 2 + side)})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(nx, ny, r * 0.14, 0, Math.PI * 2);
                ctx.fillStyle = shade(color, 0.3);
                ctx.fill();
            });
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
            break;
        }
        case 'armorbreaker': { // Armor Breaker - rotating drill that shreds armor
            const spin = Date.now() / 300;
            ctx.beginPath();
            ctx.arc(cx, cy + r * 0.3, r * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = bodyFill(ctx, cx, cy + r * 0.3, r * 0.6, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            ctx.save();
            ctx.translate(cx, cy - r * 0.3);
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.9);
            ctx.lineTo(r * 0.4, r * 0.15);
            ctx.lineTo(-r * 0.4, r * 0.15);
            ctx.closePath();
            ctx.fillStyle = shade(color, -0.3);
            ctx.strokeStyle = shade(color, -0.6);
            ctx.lineWidth = 1.5;
            ctx.fill(); ctx.stroke();
            for (let i = 0; i < 3; i++) {
                const t = ((spin + i / 3) % 1);
                const y = -r * 0.9 + t * r * 1.05;
                ctx.beginPath();
                ctx.moveTo(-r * 0.4 * (1 - t), y);
                ctx.lineTo(r * 0.4 * (1 - t), y);
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();
            break;
        }
        case 'siegecannon': { // Siege Cannon - heavy anti-tank mortar
            barrel(ctx, cx, cy + r * 0.1, -Math.PI / 2, r * 1.3, r * 0.62, color);
            ctx.beginPath();
            roundedRect(ctx, cx - r * 0.95, cy + r * 0.15, r * 0.28, r * 0.5, r * 0.06);
            ctx.fillStyle = shade(color, -0.4);
            ctx.fill();
            ctx.beginPath();
            roundedRect(ctx, cx + r * 0.67, cy + r * 0.15, r * 0.28, r * 0.5, r * 0.06);
            ctx.fillStyle = shade(color, -0.4);
            ctx.fill();
            ctx.beginPath();
            polygon(ctx, cx, cy, r, 8, Math.PI / 8);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            break;
        }
        case 'piercer': { // Rapid Pierce - railgun spike, shots go through multiple enemies
            barrel(ctx, cx, cy + r * 0.2, -Math.PI / 2, r * 1.7, r * 0.14, color);
            barrel(ctx, cx - r * 0.15, cy + r * 0.2, -Math.PI / 2, r * 1.5, r * 0.06, '#ffffff');
            ctx.beginPath();
            polygon(ctx, cx, cy, r * 0.65, 4, -Math.PI / 2);
            ctx.fillStyle = bodyFill(ctx, cx, cy, r * 0.65, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            break;
        }
        case 'volatilecore': { // Volatile Core - cracked, unstable, chance to detonate
            const pulse = 0.6 + Math.sin(Date.now() / 180) * 0.4;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
            const grd = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 0.8);
            grd.addColorStop(0, shade(color, 0.5));
            grd.addColorStop(1, shade(color, -0.3));
            ctx.fillStyle = grd;
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            ctx.strokeStyle = `rgba(255,255,255,${0.5 + pulse * 0.4})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.3, cy - r * 0.4);
            ctx.lineTo(cx, cy - r * 0.05);
            ctx.lineTo(cx - r * 0.15, cy + r * 0.1);
            ctx.lineTo(cx + r * 0.35, cy + r * 0.5);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.18 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.shadowColor = color;
            ctx.shadowBlur = 14 * pulse;
            ctx.fill();
            ctx.shadowBlur = 0;
            break;
        }
        case 'shieldbreaker': { // Shield Breaker - sledgehammer, pops enemy shields
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(Math.PI / 8);
            ctx.beginPath();
            ctx.rect(-r * 0.09, -r * 0.15, r * 0.18, r * 1.1);
            ctx.fillStyle = shade(color, -0.35);
            ctx.fill();
            ctx.beginPath();
            roundedRect(ctx, -r * 0.42, -r * 1.05, r * 0.84, r * 0.42, r * 0.08);
            ctx.fillStyle = bodyFill(ctx, 0, -r * 0.84, r * 0.42, color);
            outline(ctx, color);
            ctx.fill(); ctx.stroke();
            ctx.restore();
            ctx.beginPath();
            ctx.arc(cx, cy + r * 0.4, r * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = shade(color, -0.5);
            ctx.fill();
            break;
        }
        case 'blighttotem': { // Blight Totem - support debuff, saps enemy speed in its aura
            const glow = 0.5 + Math.sin(Date.now() / 260) * 0.5;
            ctx.save();
            ctx.strokeStyle = shade(color, -0.35);
            ctx.lineWidth = r * 0.16;
            ctx.beginPath();
            ctx.moveTo(cx, cy + r * 0.7); ctx.lineTo(cx, cy - r * 0.9);
            ctx.stroke();
            ctx.restore();
            for (let i = 0; i < 2; i++) {
                const yy = cy - r * 0.1 - i * r * 0.5;
                ctx.beginPath();
                roundedRect(ctx, cx - r * 0.3, yy - r * 0.16, r * 0.6, r * 0.32, r * 0.06);
                ctx.fillStyle = bodyFill(ctx, cx, yy, r * 0.3, color);
                outline(ctx, color);
                ctx.fill(); ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(cx, cy - r * 0.9, r * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 120, 255, ${0.6 + glow * 0.4})`;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10 * glow;
            ctx.fill();
            ctx.shadowBlur = 0;
            break;
        }
        case 'crystalforge': { // Crystal Forge - resource tower, generates the upgrade currency
            const shimmer = 0.5 + Math.sin(Date.now() / 220) * 0.5;
            ctx.beginPath();
            roundedRect(ctx, cx - r * 0.6, cy + r * 0.1, r * 1.2, r * 0.4, r * 0.08);
            ctx.fillStyle = shade(color, -0.4);
            ctx.strokeStyle = shade(color, -0.6);
            ctx.lineWidth = 1.5;
            ctx.fill(); ctx.stroke();
            [[-0.28, 1], [0, 1.3], [0.28, 1]].forEach(([dx, scale]) => {
                ctx.save();
                ctx.translate(cx + dx * r, cy + r * 0.1);
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.9 * scale);
                ctx.lineTo(r * 0.22, -r * 0.1);
                ctx.lineTo(0, r * 0.15);
                ctx.lineTo(-r * 0.22, -r * 0.1);
                ctx.closePath();
                const grd2 = ctx.createLinearGradient(0, -r * 0.9, 0, r * 0.15);
                grd2.addColorStop(0, `rgba(255,255,255,${0.7 + shimmer * 0.3})`);
                grd2.addColorStop(1, color);
                ctx.fillStyle = grd2;
                ctx.strokeStyle = shade(color, -0.55);
                ctx.lineWidth = 1.2;
                ctx.fill(); ctx.stroke();
                ctx.restore();
            });
            break;
        }
        default:
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
    }
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

import { getUXSettings, shouldShowDamageNumbers } from './gameUXSettings';

export const damageNumbers = [];

const LIFETIME_MS = 700;
const RISE_PX = 20;

export function spawnDamageNumber(x, y, amount, color = '#ffffff') {
    if (amount == null || !shouldShowDamageNumbers()) return;
    const settings = getUXSettings();
    const cap = settings.effectsQuality === 'low' ? 28 : settings.effectsQuality === 'medium' ? 60 : 120;
    if (damageNumbers.length >= cap) damageNumbers.splice(0, damageNumbers.length - cap + 1);
    damageNumbers.push({
        x, y, amount, color,
        createdAt: Date.now(),
        driftX: settings.reducedMotion ? 0 : (Math.random() - 0.5) * 16,
    });
}

export function drawDamageNumbers(ctx) {
    if (!shouldShowDamageNumbers()) {
        damageNumbers.length = 0;
        return;
    }
    const settings = getUXSettings();
    const now = Date.now();
    for (let i = 0; i < damageNumbers.length; i++) {
        const d = damageNumbers[i];
        const age = now - d.createdAt;
        if (age > LIFETIME_MS) {
            damageNumbers.splice(i, 1);
            i--;
            continue;
        }
        const t = age / LIFETIME_MS;
        const alpha = settings.reducedMotion ? Math.max(.2, 1 - t * 1.25) : 1 - t;
        const dy = settings.reducedMotion ? 0 : -RISE_PX * t;
        const dx = settings.reducedMotion ? 0 : d.driftX * t;
        const label = d.amount > 0 ? `-${d.amount}` : 'BLOCKED';

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = d.amount > 0 ? 'bold 13px pixel, sans-serif' : 'bold 10px pixel, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = settings.highContrast ? 3.5 : 2.5;
        ctx.strokeStyle = settings.highContrast ? '#000' : 'rgba(0, 0, 0, 0.75)';
        ctx.strokeText(label, d.x + dx, d.y + dy);
        ctx.fillStyle = d.color;
        ctx.fillText(label, d.x + dx, d.y + dy);
        ctx.restore();
    }
}

export function resetDamageNumbers() {
    damageNumbers.length = 0;
}

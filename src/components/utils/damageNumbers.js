// Small floating "-42" popups on hit. A module-level array, same pattern
// as `bullets`/`enemies`/`grid` in GamePage.jsx, rather than React state -
// these need to move and fade every animation frame, and there can be a
// lot of them at once during a busy wave, so a re-render per number would
// be wasteful.

export const damageNumbers = [];

const LIFETIME_MS = 700;
const RISE_PX = 20;

// amount === 0 is a real, meaningful event (a hit fully absorbed by a
// shield) - it still spawns a number, just rendered distinctly, rather
// than being silently dropped.
export function spawnDamageNumber(x, y, amount, color = '#ffffff') {
    if (amount == null) return;
    damageNumbers.push({
        x, y, amount, color,
        createdAt: Date.now(),
        driftX: (Math.random() - 0.5) * 16,
    });
}

export function drawDamageNumbers(ctx) {
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
        const alpha = 1 - t;
        const dy = -RISE_PX * t;
        const dx = d.driftX * t;
        const label = d.amount > 0 ? `-${d.amount}` : 'BLOCKED';

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = d.amount > 0 ? 'bold 13px pixel, sans-serif' : 'bold 10px pixel, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.strokeText(label, d.x + dx, d.y + dy);
        ctx.fillStyle = d.color;
        ctx.fillText(label, d.x + dx, d.y + dy);
        ctx.restore();
    }
}

// Called when a run (re)starts so numbers from a previous session/round
// never bleed visually into a fresh one.
export function resetDamageNumbers() {
    damageNumbers.length = 0;
}

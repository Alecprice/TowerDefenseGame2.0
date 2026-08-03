// A small radial particle burst - currently only used for boss deaths
// (see GamePage's death-handling block), kept as its own tiny system
// rather than folded into damageNumbers.js since these move and decay
// differently (velocity + drag vs. a straight float-and-fade).

export const particles = [];

export function spawnBurst(x, y, opts = {}) {
    const count = opts.count || 18;
    const color = opts.color || '#ff595e';
    const speed = opts.speed || 4;
    const life = opts.life || 600;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
        const v = speed * (0.6 + Math.random() * 0.8);
        particles.push({
            x, y,
            vx: Math.cos(angle) * v,
            vy: Math.sin(angle) * v,
            createdAt: Date.now(),
            life,
            color,
            size: 2 + Math.random() * 3,
        });
    }
}

export function updateAndDrawParticles(ctx) {
    const now = Date.now();
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const age = now - p.createdAt;
        if (age > p.life) {
            particles.splice(i, 1);
            i--;
            continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        const alpha = 1 - age / p.life;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export function resetParticles() {
    particles.length = 0;
}

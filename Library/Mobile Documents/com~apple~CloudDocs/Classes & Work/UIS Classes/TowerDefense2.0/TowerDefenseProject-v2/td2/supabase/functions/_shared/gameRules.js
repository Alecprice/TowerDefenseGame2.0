// Shared between start-session and submit-score.
//
// These formulas mirror the game's own constants so the checks are a real
// mathematical floor/ceiling, not guesses:
//   - Spawn cadence, from src/components/pages/GamePage.jsx:
//       first enemy of a wave: 2000ms after the wave starts
//       each enemy after that: 900ms apart
//       boss (every 5th wave): 1500ms after the wave's last regular enemy
//   - Enemy score values, from src/components/objects/enemy.js:
//       highest-scoring *regular* spawn type is Armored (type 4) at 300
//       boss (type 5) is 2500, multiplied by bossTier (wave / 5)
//
// If you change those constants in the game, update them here too, or
// this stops being an accurate check.

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimum real time (ms) it takes to finish spawning every enemy through
// the given wave, if every enemy died the instant it spawned. Actually
// killing them, and just playing at all, only ever takes longer than this.
export function minElapsedMsForWave(wave) {
    let total = 0;
    for (let w = 1; w <= wave; w++) {
        total += 2000 + (w - 1) * 900;
        if (w % 5 === 0) total += 1500;
    }
    return total;
}

// Generous upper bound on total score achievable by the given wave —
// assumes every single regular enemy spawned was the highest-value type
// (Armored, 300pts), which the game's own spawn logic never actually does.
export function maxScoreForWave(wave) {
    let total = 0;
    for (let w = 1; w <= wave; w++) {
        total += w * 300;
        if (w % 5 === 0) {
            const bossTier = w / 5;
            total += 2500 * bossTier;
        }
    }
    return total;
}

export async function hashIp(ip, salt) {
    const data = new TextEncoder().encode(salt + ip);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

// supabase/functions/submit-score/index.js
// Deploy with: supabase functions deploy submit-score
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, minElapsedMsForWave, maxScoreForWave } from "../_shared/gameRules.js";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

const ELAPSED_TOLERANCE_MS = 3000; // clock/network jitter allowance
const SCORE_TOLERANCE_FACTOR = 1.05; // 5% headroom over the theoretical max

// 'YYYY-MM' in UTC - matches the format `season` is filtered by in
// highscores.js's getHighScores(season). Computed server-side (not
// trusted from the client) so a player can't back/forward-date their
// submission into a different season.
function currentSeason() {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function badRequest(message) {
    return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { sessionId, name, score, wave, mapName, gameVersion } = await req.json();
        const version = gameVersion === "v3" ? "v3" : "v2";

        if (
            typeof sessionId !== "string" ||
            typeof name !== "string" || name.length < 1 || name.length > 20 ||
            typeof mapName !== "string" || mapName.length < 1 || mapName.length > 60 ||
            !Number.isInteger(score) || score < 0 || score > 999999 ||
            !Number.isInteger(wave) || wave < 0 || wave > 1000
        ) {
            return badRequest("Invalid submission");
        }

        const { data: session, error: sessionError } = await supabase
            .from("game_sessions")
            .select("id, started_at, map_name, consumed, game_version")
            .eq("id", sessionId)
            .single();

        if (sessionError || !session) {
            return badRequest("Unknown session");
        }
        if (session.consumed) {
            return badRequest("Session already used");
        }
        if (session.map_name !== mapName) {
            return badRequest("Map mismatch");
        }
        if (session.game_version !== version) {
            return badRequest("Game version mismatch");
        }

        // Burn the session now, before we even finish evaluating it, so a
        // player can't fire the same session twice while probing for the
        // exact threshold that gets accepted.
        await supabase.from("game_sessions").update({ consumed: true }).eq("id", sessionId);

        const elapsedMs = Date.now() - new Date(session.started_at).getTime();
        const minElapsed = minElapsedMsForWave(wave) - ELAPSED_TOLERANCE_MS;
        const maxScore = maxScoreForWave(wave) * SCORE_TOLERANCE_FACTOR;

        if (elapsedMs < minElapsed) {
            return badRequest("Implausible: reached that wave too fast");
        }
        if (score > maxScore) {
            return badRequest("Implausible: score too high for that wave");
        }

        const { error: insertError } = await supabase
            .from("highscores")
            .insert({ name, score, wave, map_name: mapName, season: currentSeason(), game_version: version });

        if (insertError) throw insertError;

        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("submit-score error:", err);
        return new Response(JSON.stringify({ error: "Could not submit score" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

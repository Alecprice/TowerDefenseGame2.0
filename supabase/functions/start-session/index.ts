// supabase/functions/start-session/index.js
// Deploy with: supabase functions deploy start-session
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, hashIp } from "../_shared/gameRules.js";

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
// into every Edge Function's environment by Supabase — you don't need to
// set them yourself. IP_HASH_SALT is optional; set your own with:
//   supabase secrets set IP_HASH_SALT=some-random-string
const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);
const IP_HASH_SALT = Deno.env.get("IP_HASH_SALT") ?? "td2-default-salt";
const MAX_SESSIONS_PER_IP_PER_MINUTE = 8;

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { mapName, gameVersion } = await req.json();
        if (typeof mapName !== "string" || mapName.length < 1 || mapName.length > 60) {
            return new Response(JSON.stringify({ error: "Invalid mapName" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        // Defaults to 'v2' (the original game) so older client builds that
        // don't send this at all keep working unchanged.
        const version = gameVersion === "v3" ? "v3" : "v2";

        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const ipHash = await hashIp(ip, IP_HASH_SALT);

        const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
        const { count } = await supabase
            .from("game_sessions")
            .select("id", { count: "exact", head: true })
            .eq("ip_hash", ipHash)
            .gte("started_at", oneMinuteAgo);

        if ((count ?? 0) >= MAX_SESSIONS_PER_IP_PER_MINUTE) {
            return new Response(JSON.stringify({ error: "Too many rounds started — slow down." }), {
                status: 429,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { data, error } = await supabase
            .from("game_sessions")
            .insert({ map_name: mapName, ip_hash: ipHash, game_version: version })
            .select("id")
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ sessionId: data.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("start-session error:", err);
        return new Response(JSON.stringify({ error: "Could not start session" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});


export default {
  async fetch(request, env, ctx) {
    // Handle CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Check for KV Binding
    if (!env.STAR_DATA) {
      return new Response(
        JSON.stringify({ 
          error: "Server Error: KV Binding 'STAR_DATA' not found. Please check wrangler.toml." 
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(request.url);

    // API Route: /api/sync
    if (url.pathname.endsWith("/api/sync")) {
      const familyId = url.searchParams.get("familyId");

      if (!familyId) {
        return new Response(JSON.stringify({ error: "Missing familyId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
        // GET: Retrieve and Aggregate Data
        if (request.method === "GET") {
          // Fetch all potential keys in parallel
          const [legacyRaw, tasksRaw, rewardsRaw, settingsRaw, activityRaw] = await Promise.all([
            env.STAR_DATA.get(familyId),
            env.STAR_DATA.get(`${familyId}:tasks`),
            env.STAR_DATA.get(`${familyId}:rewards`),
            env.STAR_DATA.get(`${familyId}:settings`),
            env.STAR_DATA.get(`${familyId}:activity`)
          ]);

          const legacy = legacyRaw ? JSON.parse(legacyRaw) : {};
          const tasks = tasksRaw ? JSON.parse(tasksRaw) : null;
          const rewards = rewardsRaw ? JSON.parse(rewardsRaw) : null;
          const settings = settingsRaw ? JSON.parse(settingsRaw) : null;
          const activity = activityRaw ? JSON.parse(activityRaw) : null;

          // Merge strategy: New Key > Legacy Key > Default
          const data = {
            tasks: tasks || legacy.tasks || [],
            rewards: rewards || legacy.rewards || [],
            // Settings
            userName: settings?.userName ?? legacy.userName ?? "",
            themeKey: settings?.themeKey ?? legacy.themeKey ?? "lemon",
            // Activity
            logs: activity?.logs || legacy.logs || {},
            balance: activity?.balance ?? legacy.balance ?? 0,
            transactions: activity?.transactions || legacy.transactions || []
          };
          
          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // POST: Save Data (Split by scope)
        if (request.method === "POST") {
          const body = await request.json();
          const { scope, data } = body;
          
          if (!scope) {
             // Fallback: If no scope provided, attempt to save as legacy (full blob)
             // This ensures backward compatibility if frontend hasn't updated
             if (body.tasks) {
                 await env.STAR_DATA.put(familyId, JSON.stringify(body));
                 return new Response(JSON.stringify({ success: true, mode: 'legacy' }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                 });
             }
             return new Response(JSON.stringify({ error: "Missing scope in payload" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
             });
          }

          // Save to specific KV key based on scope
          // Keys: familyId:tasks, familyId:rewards, familyId:settings, familyId:activity
          const key = `${familyId}:${scope}`;
          await env.STAR_DATA.put(key, JSON.stringify(data));

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Default Route
    return new Response("Star Achiever API (Cloudflare Worker) is Running 🌟", {
      status: 200,
      headers: corsHeaders,
    });
  },
};

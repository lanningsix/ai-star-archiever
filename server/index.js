
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

    // Check for D1 Binding
    if (!env.DB) {
      return new Response(
        JSON.stringify({ 
          error: "Server Error: D1 Binding 'DB' not found. Please check wrangler.toml." 
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
          // Fetch all scopes for this family_id
          const { results } = await env.DB.prepare(
            "SELECT scope, data FROM family_data WHERE family_id = ?"
          ).bind(familyId).all();

          // Initialize default structure
          const data = {
            tasks: [],
            rewards: [],
            userName: "",
            themeKey: "lemon",
            logs: {},
            balance: 0,
            transactions: []
          };

          if (results && results.length > 0) {
            results.forEach(row => {
              let content;
              try {
                content = JSON.parse(row.data);
              } catch (e) {
                return;
              }

              switch (row.scope) {
                case 'tasks':
                  if (Array.isArray(content)) data.tasks = content;
                  break;
                case 'rewards':
                  if (Array.isArray(content)) data.rewards = content;
                  break;
                case 'settings':
                  if (content.userName) data.userName = content.userName;
                  if (content.themeKey) data.themeKey = content.themeKey;
                  break;
                case 'activity':
                  if (content.logs) data.logs = content.logs;
                  if (content.balance !== undefined) data.balance = content.balance;
                  if (content.transactions) data.transactions = content.transactions;
                  break;
                case 'legacy':
                   // Fallback logic for legacy blobs if they exist in DB
                   if (!data.tasks.length && content.tasks) data.tasks = content.tasks;
                   if (!data.rewards.length && content.rewards) data.rewards = content.rewards;
                   if (!data.userName && content.userName) data.userName = content.userName;
                   break;
              }
            });
          }
          
          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // POST: Save Data
        if (request.method === "POST") {
          const body = await request.json();
          let { scope, data } = body;
          
          // Handle legacy payload without scope
          if (!scope) {
             if (body.tasks || body.rewards) {
                 scope = 'legacy';
                 // Save the entire body as legacy
                 data = body; 
             } else {
                 return new Response(JSON.stringify({ error: "Missing scope in payload" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                 });
             }
          }

          // Insert or Replace into D1
          const query = `
            INSERT OR REPLACE INTO family_data (family_id, scope, data, updated_at) 
            VALUES (?, ?, ?, ?)
          `;

          await env.DB.prepare(query)
            .bind(familyId, scope, JSON.stringify(data), Date.now())
            .run();

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Default Route
    return new Response("Star Achiever API (D1 Version) is Running 🌟", {
      status: 200,
      headers: corsHeaders,
    });
  },
};

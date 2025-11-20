
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
        // GET: Retrieve data from KV
        if (request.method === "GET") {
          const dataString = await env.STAR_DATA.get(familyId);
          const data = dataString ? JSON.parse(dataString) : null;
          
          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // POST: Save data to KV
        if (request.method === "POST") {
          const body = await request.json();
          
          // Save to Cloudflare KV (Key: familyId, Value: JSON string)
          // Expiration is optional, data persists indefinitely by default
          await env.STAR_DATA.put(familyId, JSON.stringify(body));

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

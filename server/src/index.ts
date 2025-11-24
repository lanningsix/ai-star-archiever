
import { corsHeaders, handleOptions } from './utils/cors';
import { createErrorResponse } from './utils/common';
import { handleSync } from './modules/sync';
import { handleActivity } from './modules/activity';
import { handleWishlist } from './modules/wishlist';
import { handleStorage } from './modules/storage';

export default {
  async fetch(request: Request, env: any, ctx: any) {
    // Handle CORS preflight
    const optionsResponse = handleOptions(request);
    if (optionsResponse) return optionsResponse;

    if (!env.DB) {
      return createErrorResponse("Server Error: D1 Binding 'DB' not found.");
    }

    const url = new URL(request.url);

    // Allow root path "/" OR "/api/sync"
    if (url.pathname === "/" || url.pathname.endsWith("/api/sync")) {
      const familyId = url.searchParams.get("familyId");
      if (!familyId) {
        return createErrorResponse("Missing familyId", 400);
      }

      try {
        // GET Requests: Route to Sync Module
        if (request.method === "GET") {
          const scope = url.searchParams.get("scope") || "all";
          return await handleSync(request, env, familyId, scope, url);
        }

        // POST Requests: Dispatch based on Scope to Functional Modules
        if (request.method === "POST") {
          const body: any = await request.json();
          const { scope, data } = body;
          
          if (!scope) return createErrorResponse("Missing scope", 400);

          // 1. Activity Module (High Frequency, Transactional)
          if (scope === 'record_log' || scope === 'record_transaction') {
              return await handleActivity(request, env, familyId, scope, data);
          }
          
          // 2. Wishlist Module (Specific Feature Logic)
          if (scope === 'wishlist_update' || scope === 'wishlist_delete') {
              return await handleWishlist(request, env, familyId, scope, data);
          }

          // 3. Storage Module (Bulk Data / Settings)
          // covers: tasks, rewards, wishlist (bulk), settings, avatar, activity (bulk)
          return await handleStorage(request, env, familyId, scope, data);
        }

      } catch (err: any) {
        console.error(err);
        return createErrorResponse(err.message || "Internal Server Error");
      }
    }

    return new Response("Star Achiever API (Relational D1) is Running 🌟", {
      status: 200,
      headers: corsHeaders,
    });
  },
};


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

    if (!env.DB) {
      return new Response(
        JSON.stringify({ error: "Server Error: D1 Binding 'DB' not found." }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);

    // Allow root path "/" OR "/api/sync" to be flexible
    if (url.pathname === "/" || url.pathname.endsWith("/api/sync")) {
      const familyId = url.searchParams.get("familyId");

      if (!familyId) {
        return new Response(JSON.stringify({ error: "Missing familyId" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        // === GET: 读取并组装数据 ===
        if (request.method === "GET") {
          const scope = url.searchParams.get("scope") || "all"; // 'all', 'daily', 'store', 'calendar', 'pet'

          // 1. 获取基础设置 (Always fetch settings for balance/theme/pet)
          const settings = await env.DB.prepare("SELECT * FROM settings WHERE family_id = ?").bind(familyId).first();
          
          // 如果没有找到该家庭，返回空结构
          if (!settings) {
             return new Response(JSON.stringify({ data: null }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
             });
          }

          let tasksResult, rewardsResult, logsResult, txResult;
          const promises = [];

          if (scope === 'all' || scope === 'daily' || scope === 'settings') {
              promises.push(env.DB.prepare("SELECT * FROM tasks WHERE family_id = ?").bind(familyId).all().then(r => tasksResult = r));
              promises.push(env.DB.prepare("SELECT date_key, task_id FROM task_logs WHERE family_id = ?").bind(familyId).all().then(r => logsResult = r));
          }

          if (scope === 'all' || scope === 'store' || scope === 'settings') {
              promises.push(env.DB.prepare("SELECT * FROM rewards WHERE family_id = ?").bind(familyId).all().then(r => rewardsResult = r));
          }

          if (scope === 'all' || scope === 'calendar' || scope === 'settings') {
              promises.push(env.DB.prepare("SELECT * FROM transactions WHERE family_id = ? ORDER BY created_at DESC LIMIT 100").bind(familyId).all().then(r => txResult = r));
          }

          await Promise.all(promises);

          // 3. 转换 Logs 格式
          let logsMap = undefined;
          if (logsResult && logsResult.results) {
            logsMap = {};
            logsResult.results.forEach(row => {
                if (!logsMap[row.date_key]) logsMap[row.date_key] = [];
                logsMap[row.date_key].push(row.task_id);
            });
          }

          // 4. 组装最终 JSON
          const data = {
            familyId: settings.family_id,
            userName: settings.user_name || "",
            themeKey: settings.theme_key || "lemon",
            balance: settings.balance || 0,
            pet: settings.pet_data ? JSON.parse(settings.pet_data) : undefined,
            tasks: tasksResult ? (tasksResult.results || []) : undefined,
            rewards: rewardsResult ? (rewardsResult.results || []) : undefined,
            logs: logsMap,
            transactions: txResult ? (txResult.results || []) : undefined
          };
          
          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // === POST: 保存数据 (分 Scope 处理) ===
        if (request.method === "POST") {
          const body = await request.json();
          const { scope, data } = body;
          
          if (!scope) throw new Error("Missing scope");

          const timestamp = Date.now();
          const statements = [];

          // 确保主表存在
          statements.push(
            env.DB.prepare("INSERT OR IGNORE INTO settings (family_id, created_at, updated_at) VALUES (?, ?, ?)")
            .bind(familyId, timestamp, timestamp)
          );

          if (scope === 'tasks') {
             if (Array.isArray(data)) {
                statements.push(env.DB.prepare("DELETE FROM tasks WHERE family_id = ?").bind(familyId));
                const insertStmt = env.DB.prepare("INSERT INTO tasks (id, family_id, title, category, stars, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
                data.forEach(t => {
                    statements.push(insertStmt.bind(t.id, familyId, t.title, t.category, t.stars, timestamp));
                });
             }
          }
          else if (scope === 'rewards') {
             if (Array.isArray(data)) {
                statements.push(env.DB.prepare("DELETE FROM rewards WHERE family_id = ?").bind(familyId));
                const insertStmt = env.DB.prepare("INSERT INTO rewards (id, family_id, title, cost, icon, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
                data.forEach(r => {
                    statements.push(insertStmt.bind(r.id, familyId, r.title, r.cost, r.icon, timestamp));
                });
             }
          }
          else if (scope === 'settings') {
             if (data) {
                 const updateStmt = env.DB.prepare(`
                    UPDATE settings 
                    SET user_name = ?, theme_key = ?, updated_at = ? 
                    WHERE family_id = ?
                 `);
                 statements.push(updateStmt.bind(data.userName, data.themeKey, timestamp, familyId));
             }
          }
          else if (scope === 'pet') {
             // Update Pet Data (stored as JSON string in settings table)
             const petJson = data ? JSON.stringify(data) : null;
             statements.push(env.DB.prepare("UPDATE settings SET pet_data = ?, updated_at = ? WHERE family_id = ?").bind(petJson, timestamp, familyId));
          }
          else if (scope === 'activity') {
             if (data.balance !== undefined) {
                statements.push(env.DB.prepare("UPDATE settings SET balance = ?, updated_at = ? WHERE family_id = ?").bind(data.balance, timestamp, familyId));
             }
             if (data.logs) {
                statements.push(env.DB.prepare("DELETE FROM task_logs WHERE family_id = ?").bind(familyId));
                const logInsert = env.DB.prepare("INSERT INTO task_logs (family_id, date_key, task_id, created_at) VALUES (?, ?, ?, ?)");
                for (const [dateKey, taskIds] of Object.entries(data.logs)) {
                    if (Array.isArray(taskIds)) {
                        taskIds.forEach(tid => {
                             statements.push(logInsert.bind(familyId, dateKey, tid, timestamp));
                        });
                    }
                }
             }
             if (data.transactions) {
                statements.push(env.DB.prepare("DELETE FROM transactions WHERE family_id = ?").bind(familyId));
                const txInsert = env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
                if (Array.isArray(data.transactions)) {
                    data.transactions.forEach(tx => {
                        statements.push(txInsert.bind(tx.id, familyId, tx.date, tx.description, tx.amount, tx.type, timestamp));
                    });
                }
             }
          }

          if (statements.length > 0) {
              await env.DB.batch(statements);
          }

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

    return new Response("Star Achiever API (Relational D1) is Running 🌟", {
      status: 200,
      headers: corsHeaders,
    });
  },
};



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
          // 1. 获取基础设置
          const settings = await env.DB.prepare("SELECT * FROM settings WHERE family_id = ?").bind(familyId).first();
          
          // 如果没有找到该家庭，返回空结构
          if (!settings) {
             return new Response(JSON.stringify({ data: null }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
             });
          }

          // 2. 并行获取其他表数据
          const [tasksResult, rewardsResult, logsResult, txResult] = await Promise.all([
            env.DB.prepare("SELECT * FROM tasks WHERE family_id = ?").bind(familyId).all(),
            env.DB.prepare("SELECT * FROM rewards WHERE family_id = ?").bind(familyId).all(),
            env.DB.prepare("SELECT date_key, task_id FROM task_logs WHERE family_id = ?").bind(familyId).all(),
            env.DB.prepare("SELECT * FROM transactions WHERE family_id = ? ORDER BY created_at DESC LIMIT 100").bind(familyId).all()
          ]);

          // 3. 转换 Logs 格式 (DB Rows -> Record<date, ids[]>)
          const logsMap = {};
          if (logsResult.results) {
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
            tasks: tasksResult.results || [],
            rewards: rewardsResult.results || [],
            logs: logsMap,
            transactions: txResult.results || []
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

          // 确保主表存在 (Upsert family entry)
          statements.push(
            env.DB.prepare("INSERT OR IGNORE INTO settings (family_id, created_at, updated_at) VALUES (?, ?, ?)")
            .bind(familyId, timestamp, timestamp)
          );

          if (scope === 'tasks') {
             // 策略: 删除该家庭所有旧任务，插入新列表 (全量同步)
             statements.push(env.DB.prepare("DELETE FROM tasks WHERE family_id = ?").bind(familyId));
             const insertStmt = env.DB.prepare("INSERT INTO tasks (id, family_id, title, category, stars, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
             if (Array.isArray(data)) {
                data.forEach(t => {
                    statements.push(insertStmt.bind(t.id, familyId, t.title, t.category, t.stars, timestamp));
                });
             }
          }
          else if (scope === 'rewards') {
             statements.push(env.DB.prepare("DELETE FROM rewards WHERE family_id = ?").bind(familyId));
             const insertStmt = env.DB.prepare("INSERT INTO rewards (id, family_id, title, cost, icon, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
             if (Array.isArray(data)) {
                data.forEach(r => {
                    statements.push(insertStmt.bind(r.id, familyId, r.title, r.cost, r.icon, timestamp));
                });
             }
          }
          else if (scope === 'settings') {
             // 更新设置 (Partial Update)
             const updateStmt = env.DB.prepare(`
                UPDATE settings 
                SET user_name = ?, theme_key = ?, updated_at = ? 
                WHERE family_id = ?
             `);
             statements.push(updateStmt.bind(data.userName, data.themeKey, timestamp, familyId));
          }
          else if (scope === 'activity') {
             // 1. 更新余额
             if (data.balance !== undefined) {
                statements.push(env.DB.prepare("UPDATE settings SET balance = ?, updated_at = ? WHERE family_id = ?").bind(data.balance, timestamp, familyId));
             }

             // 2. 覆盖 Logs (全量同步)
             // 注意：对于日志量特别大的情况，全量覆盖可能效率较低。但在家庭场景下是可以接受的。
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

             // 3. 覆盖 Transactions (全量同步)
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

          // 执行批量事务
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

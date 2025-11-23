
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
          const scope = url.searchParams.get("scope") || "all"; // 'all', 'daily', 'store', 'calendar', 'avatar', 'wishlist'
          const month = url.searchParams.get("month"); // Optional: YYYY-MM
          const dateParam = url.searchParams.get("date"); // Optional: YYYY-MM-DD
          const startDate = url.searchParams.get("startDate"); // Optional: ISO String
          const endDate = url.searchParams.get("endDate"); // Optional: ISO String

          // 1. 获取基础设置 (Always fetch settings for balance/theme/avatar/stats)
          const settings = await env.DB.prepare("SELECT * FROM settings WHERE family_id = ?").bind(familyId).first();
          
          // 如果没有找到该家庭，返回空结构
          if (!settings) {
             return new Response(JSON.stringify({ data: null }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
             });
          }

          let tasksResult, rewardsResult, logsResult, txResult, wishlistResult;
          const promises = [];

          if (scope === 'all' || scope === 'daily' || scope === 'settings') {
              promises.push(env.DB.prepare("SELECT * FROM tasks WHERE family_id = ?").bind(familyId).all().then(r => tasksResult = r));
              
              // Logs filtering
              let logSql = "SELECT date_key, task_id FROM task_logs WHERE family_id = ?";
              const logParams = [familyId];
              if (dateParam) {
                  logSql += " AND date_key = ?";
                  logParams.push(dateParam);
              }
              promises.push(env.DB.prepare(logSql).bind(...logParams).all().then(r => logsResult = r));
          }

          if (scope === 'all' || scope === 'store' || scope === 'settings') {
              promises.push(env.DB.prepare("SELECT * FROM rewards WHERE family_id = ?").bind(familyId).all().then(r => rewardsResult = r));
          }
          
          if (scope === 'all' || scope === 'store' || scope === 'wishlist') {
              promises.push(env.DB.prepare("SELECT * FROM wishlist_goals WHERE family_id = ?").bind(familyId).all().then(r => wishlistResult = r));
          }

          if (scope === 'all' || scope === 'calendar' || scope === 'settings' || scope === 'activity') {
              let txSql = "SELECT * FROM transactions WHERE family_id = ?";
              const params = [familyId];

              if (startDate && endDate) {
                  // Filter by specific date range (ISO strings)
                  txSql += " AND date >= ? AND date <= ?";
                  params.push(startDate);
                  params.push(endDate);
                  txSql += " ORDER BY created_at DESC";
              } else if (dateParam) {
                  // Filter by specific date (prefix match YYYY-MM-DD)
                  txSql += " AND date LIKE ?";
                  params.push(`${dateParam}%`);
                  txSql += " ORDER BY created_at DESC";
              } else if (month) {
                  // If month is provided (YYYY-MM), filter by date string
                  txSql += " AND date LIKE ?";
                  params.push(`${month}%`);
                  txSql += " ORDER BY created_at DESC";
              } else {
                  // If no date/month provided, fetch recent history with a much larger limit
                  txSql += " ORDER BY created_at DESC LIMIT 5000";
              }

              promises.push(env.DB.prepare(txSql).bind(...params).all().then(r => txResult = r));
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
          
          // 转换 Wishlist 字段名
          const wishlist = wishlistResult && wishlistResult.results ? wishlistResult.results.map(r => ({
             id: r.id,
             title: r.title,
             targetCost: r.target_cost,
             currentSaved: r.current_saved,
             icon: r.icon
          })) : undefined;
          
          // 转换 Transactions 字段名 (CamelCase)
          const transactions = txResult && txResult.results ? txResult.results.map(r => ({
              id: r.id,
              date: r.date,
              description: r.description,
              amount: r.amount,
              type: r.type,
              taskId: r.task_id,
              isRevoked: r.is_revoked === 1
          })) : undefined;

          // 4. 组装最终 JSON
          const data = {
            familyId: settings.family_id,
            userName: settings.user_name || "",
            themeKey: settings.theme_key || "lemon",
            balance: settings.balance || 0,
            avatar: settings.avatar_data ? JSON.parse(settings.avatar_data) : undefined,
            lifetimeEarnings: settings.lifetime_earned || 0,
            unlockedAchievements: settings.achievements_data ? JSON.parse(settings.achievements_data) : [],
            tasks: tasksResult ? (tasksResult.results || []) : undefined,
            rewards: rewardsResult ? (rewardsResult.results || []) : undefined,
            wishlist: wishlist,
            logs: logsMap,
            transactions: transactions
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

          // --- Granular Update Scopes ---
          
          if (scope === 'record_log') {
             const { dateKey, taskId, action, transaction, revokeTransactionId, balance, lifetimeEarnings } = data;
             
             // Update Settings (Balance & Lifetime)
             statements.push(env.DB.prepare("UPDATE settings SET balance = ?, lifetime_earned = ?, updated_at = ? WHERE family_id = ?").bind(balance, lifetimeEarnings, timestamp, familyId));
             
             // Insert Transaction (Standard)
             if (transaction) {
                  statements.push(env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at, task_id, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(transaction.id, familyId, transaction.date, transaction.description, transaction.amount, transaction.type, timestamp, transaction.taskId || null, transaction.isRevoked ? 1 : 0));
             }

             // Update Transaction (Revoke)
             if (revokeTransactionId) {
                  statements.push(env.DB.prepare("UPDATE transactions SET is_revoked = 1 WHERE family_id = ? AND id = ?").bind(familyId, revokeTransactionId));
             }
             
             // Modify Log
             if (action === 'add') {
                  statements.push(env.DB.prepare("INSERT INTO task_logs (family_id, date_key, task_id, created_at) VALUES (?, ?, ?, ?)").bind(familyId, dateKey, taskId, timestamp));
             } else {
                  // Remove the log entry
                  statements.push(env.DB.prepare("DELETE FROM task_logs WHERE family_id = ? AND date_key = ? AND task_id = ?").bind(familyId, dateKey, taskId));
             }
          }
          else if (scope === 'record_transaction') {
             const { transaction, balance, lifetimeEarnings } = data;
             
             // Update Settings
             const updateSql = lifetimeEarnings !== undefined 
                ? "UPDATE settings SET balance = ?, lifetime_earned = ?, updated_at = ? WHERE family_id = ?"
                : "UPDATE settings SET balance = ?, updated_at = ? WHERE family_id = ?";
             
             const updateParams = lifetimeEarnings !== undefined
                ? [balance, lifetimeEarnings, timestamp, familyId]
                : [balance, timestamp, familyId];
             
             statements.push(env.DB.prepare(updateSql).bind(...updateParams));

             // Insert Transaction
             if (transaction) {
                  statements.push(env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at, task_id, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(transaction.id, familyId, transaction.date, transaction.description, transaction.amount, transaction.type, timestamp, transaction.taskId || null, transaction.isRevoked ? 1 : 0));
             }
          }
          else if (scope === 'wishlist_update') {
             const { goal, transaction, balance } = data;
             
             if (balance !== undefined) {
                 statements.push(env.DB.prepare("UPDATE settings SET balance = ?, updated_at = ? WHERE family_id = ?").bind(balance, timestamp, familyId));
             }
             
             if (transaction) {
                 statements.push(env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at, task_id, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(transaction.id, familyId, transaction.date, transaction.description, transaction.amount, transaction.type, timestamp, transaction.taskId || null, transaction.isRevoked ? 1 : 0));
             }
             
             // Upsert Goal
             statements.push(env.DB.prepare("INSERT OR REPLACE INTO wishlist_goals (id, family_id, title, target_cost, current_saved, icon, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(goal.id, familyId, goal.title, goal.targetCost, goal.currentSaved, goal.icon, timestamp));
          }
          else if (scope === 'wishlist_delete') {
             const { goalId, transaction, balance } = data;
             
             if (balance !== undefined) {
                 statements.push(env.DB.prepare("UPDATE settings SET balance = ?, updated_at = ? WHERE family_id = ?").bind(balance, timestamp, familyId));
             }
             
             if (transaction) {
                 statements.push(env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at, task_id, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(transaction.id, familyId, transaction.date, transaction.description, transaction.amount, transaction.type, timestamp, transaction.taskId || null, transaction.isRevoked ? 1 : 0));
             }
             
             statements.push(env.DB.prepare("DELETE FROM wishlist_goals WHERE family_id = ? AND id = ?").bind(familyId, goalId));
          }

          // --- Bulk/Original Scopes ---

          else if (scope === 'tasks') {
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
          else if (scope === 'wishlist') {
             // Bulk wishlist sync (still used for manual save)
             if (Array.isArray(data)) {
                statements.push(env.DB.prepare("DELETE FROM wishlist_goals WHERE family_id = ?").bind(familyId));
                const insertStmt = env.DB.prepare("INSERT INTO wishlist_goals (id, family_id, title, target_cost, current_saved, icon, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
                data.forEach(r => {
                    statements.push(insertStmt.bind(r.id, familyId, r.title, r.targetCost, r.currentSaved, r.icon, timestamp));
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
          else if (scope === 'avatar') {
             const avatarJson = data.avatar ? JSON.stringify(data.avatar) : null;
             if (data.balance !== undefined) {
                statements.push(env.DB.prepare("UPDATE settings SET avatar_data = ?, balance = ?, updated_at = ? WHERE family_id = ?").bind(avatarJson, data.balance, timestamp, familyId));
             } else {
                statements.push(env.DB.prepare("UPDATE settings SET avatar_data = ?, updated_at = ? WHERE family_id = ?").bind(avatarJson, timestamp, familyId));
             }
          }
          else if (scope === 'activity') {
             // Full sync for Manual Save (also used for achievements only update)
             const fieldsToUpdate = [];
             const values = [];
             
             if (data.balance !== undefined) {
                 fieldsToUpdate.push("balance = ?");
                 values.push(data.balance);
             }
             if (data.lifetimeEarnings !== undefined) {
                 fieldsToUpdate.push("lifetime_earned = ?");
                 values.push(data.lifetimeEarnings);
             }
             if (data.unlockedAchievements !== undefined) {
                 fieldsToUpdate.push("achievements_data = ?");
                 values.push(JSON.stringify(data.unlockedAchievements));
             }

             if (fieldsToUpdate.length > 0) {
                 fieldsToUpdate.push("updated_at = ?");
                 values.push(timestamp);
                 values.push(familyId);
                 statements.push(env.DB.prepare(`UPDATE settings SET ${fieldsToUpdate.join(", ")} WHERE family_id = ?`).bind(...values));
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
                const txInsert = env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at, task_id, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                if (Array.isArray(data.transactions)) {
                    data.transactions.forEach(tx => {
                        statements.push(txInsert.bind(tx.id, familyId, tx.date, tx.description, tx.amount, tx.type, timestamp, tx.taskId || null, tx.isRevoked ? 1 : 0));
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

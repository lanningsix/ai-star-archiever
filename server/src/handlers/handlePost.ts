
import { corsHeaders } from '../utils/cors';

export async function handlePost(request: Request, env: any, familyId: string) {
    const body: any = await request.json();
    const { scope, data } = body;
    
    if (!scope) throw new Error("Missing scope");

    const timestamp = Date.now();
    const statements: any[] = [];

    // 确保主表存在
    statements.push(
        env.DB.prepare("INSERT OR IGNORE INTO settings (family_id, created_at, updated_at) VALUES (?, ?, ?)")
        .bind(familyId, timestamp, timestamp)
    );

    let deltaBalance = 0;
    let deltaLifetime = 0;
    let shouldUpdateBalance = false;

    // --- Granular Update Scopes with Atomic Balance Calculation ---
    
    if (scope === 'record_log') {
        const { dateKey, taskId, action, transaction, revokeTransactionId, updateTransaction } = data;
        
        // Insert Transaction (Standard)
        if (transaction) {
            shouldUpdateBalance = true;
            statements.push(env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at, task_id, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(transaction.id, familyId, transaction.date, transaction.description, transaction.amount, transaction.type, timestamp, transaction.taskId || null, transaction.isRevoked ? 1 : 0));
            
            deltaBalance += transaction.amount;
            if (transaction.amount > 0 && !transaction.isRevoked) {
                deltaLifetime += transaction.amount;
            }
        }

        // Update Transaction (Revoke/Restore) - New Generic Way
        if (updateTransaction) {
            const { id, isRevoked, date } = updateTransaction;
            const originalTx = await env.DB.prepare("SELECT amount, is_revoked FROM transactions WHERE id = ? AND family_id = ?").bind(id, familyId).first();
            
            if (originalTx) {
                shouldUpdateBalance = true;
                const oldRevoked = originalTx.is_revoked === 1;
                const newRevoked = isRevoked;
                
                if (oldRevoked !== newRevoked) {
                    const amount = originalTx.amount;
                    // If we are Revoking (0->1): subtract amount
                    // If we are Restoring (1->0): add amount
                    
                    const sign = newRevoked ? -1 : 1;
                    
                    const effectiveOld = oldRevoked ? 0 : amount;
                    const effectiveNew = newRevoked ? 0 : amount;
                    const diff = effectiveNew - effectiveOld;
                    
                    deltaBalance += diff;
                    
                    if (amount > 0) {
                        deltaLifetime += diff;
                    }
                }
                
                statements.push(env.DB.prepare("UPDATE transactions SET is_revoked = ?, date = ?, updated_at = ? WHERE family_id = ? AND id = ?").bind(newRevoked ? 1 : 0, date, timestamp, familyId, id));
            }
        }

        // Legacy Revoke (Backward compatibility fallback if needed, though updateTransaction is preferred)
        if (revokeTransactionId && !updateTransaction) {
            const originalTx = await env.DB.prepare("SELECT amount FROM transactions WHERE id = ? AND family_id = ?").bind(revokeTransactionId, familyId).first();
            if (originalTx) {
                shouldUpdateBalance = true;
                deltaBalance -= originalTx.amount;
                if (originalTx.amount > 0) {
                    deltaLifetime -= originalTx.amount;
                }
                statements.push(env.DB.prepare("UPDATE transactions SET is_revoked = 1 WHERE family_id = ? AND id = ?").bind(familyId, revokeTransactionId));
            }
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
        const { transaction } = data;
        
        if (transaction) {
            shouldUpdateBalance = true;
            statements.push(env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at, task_id, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(transaction.id, familyId, transaction.date, transaction.description, transaction.amount, transaction.type, timestamp, transaction.taskId || null, transaction.isRevoked ? 1 : 0));
            
            deltaBalance += transaction.amount;
            if (transaction.amount > 0 && !transaction.isRevoked) {
                deltaLifetime += transaction.amount;
            }
        }
    }
    else if (scope === 'wishlist_update') {
        const { goal, transaction } = data;
        
        if (transaction) {
            shouldUpdateBalance = true;
            statements.push(env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at, task_id, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(transaction.id, familyId, transaction.date, transaction.description, transaction.amount, transaction.type, timestamp, transaction.taskId || null, transaction.isRevoked ? 1 : 0));
            
            deltaBalance += transaction.amount;
        }
        
        // Upsert Goal
        statements.push(env.DB.prepare("INSERT OR REPLACE INTO wishlist_goals (id, family_id, title, target_cost, current_saved, icon, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(goal.id, familyId, goal.title, goal.targetCost, goal.currentSaved, goal.icon, timestamp));
    }
    else if (scope === 'wishlist_delete') {
        const { goalId, transaction } = data;
        
        if (transaction) {
            shouldUpdateBalance = true;
            statements.push(env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at, task_id, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(transaction.id, familyId, transaction.date, transaction.description, transaction.amount, transaction.type, timestamp, transaction.taskId || null, transaction.isRevoked ? 1 : 0));
            
            deltaBalance += transaction.amount;
        }
        
        statements.push(env.DB.prepare("DELETE FROM wishlist_goals WHERE family_id = ? AND id = ?").bind(familyId, goalId));
    }

    // --- Bulk/Original Scopes ---

    else if (scope === 'tasks') {
        if (Array.isArray(data)) {
            statements.push(env.DB.prepare("DELETE FROM tasks WHERE family_id = ?").bind(familyId));
            const insertStmt = env.DB.prepare("INSERT INTO tasks (id, family_id, title, category, stars, icon, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
            data.forEach((t: any) => {
                statements.push(insertStmt.bind(t.id, familyId, t.title, t.category, t.stars, t.icon || '', timestamp));
            });
        }
    }
    else if (scope === 'rewards') {
        if (Array.isArray(data)) {
            statements.push(env.DB.prepare("DELETE FROM rewards WHERE family_id = ?").bind(familyId));
            const insertStmt = env.DB.prepare("INSERT INTO rewards (id, family_id, title, cost, icon, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
            data.forEach((r: any) => {
                statements.push(insertStmt.bind(r.id, familyId, r.title, r.cost, r.icon, timestamp));
            });
        }
    }
    else if (scope === 'wishlist') {
        if (Array.isArray(data)) {
            statements.push(env.DB.prepare("DELETE FROM wishlist_goals WHERE family_id = ?").bind(familyId));
            const insertStmt = env.DB.prepare("INSERT INTO wishlist_goals (id, family_id, title, target_cost, current_saved, icon, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
            data.forEach((r: any) => {
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
        // Deprecated: Balance update via Avatar scope is discouraged
        if (data.balance !== undefined) {
            statements.push(env.DB.prepare("UPDATE settings SET avatar_data = ?, balance = ?, updated_at = ? WHERE family_id = ?").bind(avatarJson, data.balance, timestamp, familyId));
        } else {
            statements.push(env.DB.prepare("UPDATE settings SET avatar_data = ?, updated_at = ? WHERE family_id = ?").bind(avatarJson, timestamp, familyId));
        }
    }
    else if (scope === 'activity') {
        // For Manual Save / Partial Updates
        // We do NOT update balance/transactions here to avoid overwriting remote changes, 
        // unless explicitly acting as a restore.
        // We allow updating achievements and logs.
        
        const fieldsToUpdate = [];
        const values = [];
        
        // Allow overwriting balance ONLY if explicitly provided (e.g. restore from backup)
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
        
        // Handle logs (Overwrite)
        if (data.logs) {
            statements.push(env.DB.prepare("DELETE FROM task_logs WHERE family_id = ?").bind(familyId));
            const logInsert = env.DB.prepare("INSERT INTO task_logs (family_id, date_key, task_id, created_at) VALUES (?, ?, ?, ?)");
            for (const [dateKey, taskIds] of Object.entries(data.logs)) {
                if (Array.isArray(taskIds)) {
                    taskIds.forEach((tid: any) => {
                        statements.push(logInsert.bind(familyId, dateKey, tid, timestamp));
                    });
                }
            }
        }
        
        // Handle transactions (Overwrite) - CAUTION: This destroys concurrent history
        if (data.transactions) {
            statements.push(env.DB.prepare("DELETE FROM transactions WHERE family_id = ?").bind(familyId));
            const txInsert = env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at, task_id, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            if (Array.isArray(data.transactions)) {
                data.transactions.forEach((tx: any) => {
                    statements.push(txInsert.bind(tx.id, familyId, tx.date, tx.description, tx.amount, tx.type, timestamp, tx.taskId || null, tx.isRevoked ? 1 : 0));
                });
            }
        }
    }

    // Apply Atomic Updates if applicable
    if (shouldUpdateBalance && (deltaBalance !== 0 || deltaLifetime !== 0)) {
        statements.push(env.DB.prepare("UPDATE settings SET balance = balance + ?, lifetime_earned = MAX(0, lifetime_earned + ?), updated_at = ? WHERE family_id = ?").bind(deltaBalance, deltaLifetime, timestamp, familyId));
    }

    if (statements.length > 0) {
        await env.DB.batch(statements);
    }
    
    // Return updated balance to client (Source of Truth)
    const finalSettings = await env.DB.prepare("SELECT balance, lifetime_earned FROM settings WHERE family_id = ?").bind(familyId).first();

    return new Response(JSON.stringify({ 
        success: true,
        data: {
            balance: finalSettings ? finalSettings.balance : 0,
            lifetimeEarnings: finalSettings ? finalSettings.lifetime_earned : 0
        }
    }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

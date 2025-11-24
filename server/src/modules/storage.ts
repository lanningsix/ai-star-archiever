
import { createResponse } from '../utils/common';

export async function handleStorage(request: Request, env: any, familyId: string, scope: string, data: any) {
    const timestamp = Date.now();
    const statements: any[] = [];
    
    statements.push(
        env.DB.prepare("INSERT OR IGNORE INTO settings (family_id, created_at, updated_at) VALUES (?, ?, ?)")
        .bind(familyId, timestamp, timestamp)
    );

    if (scope === 'tasks') {
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
            const updateStmt = env.DB.prepare("UPDATE settings SET user_name = ?, theme_key = ?, updated_at = ? WHERE family_id = ?");
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
        // Bulk Manual Save
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
                    taskIds.forEach((tid: any) => {
                        statements.push(logInsert.bind(familyId, dateKey, tid, timestamp));
                    });
                }
            }
        }
        
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

    if (statements.length > 0) {
        await env.DB.batch(statements);
    }
    
    return createResponse({ success: true });
}

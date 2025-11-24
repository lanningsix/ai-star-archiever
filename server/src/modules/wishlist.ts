
import { createResponse } from '../utils/common';

export async function handleWishlist(request: Request, env: any, familyId: string, scope: string, data: any) {
    const timestamp = Date.now();
    const statements: any[] = [];
    
    statements.push(
        env.DB.prepare("INSERT OR IGNORE INTO settings (family_id, created_at, updated_at) VALUES (?, ?, ?)")
        .bind(familyId, timestamp, timestamp)
    );

    let deltaBalance = 0;
    let shouldUpdateBalance = false;

    if (scope === 'wishlist_update') {
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

    if (shouldUpdateBalance && deltaBalance !== 0) {
        statements.push(env.DB.prepare("UPDATE settings SET balance = balance + ?, updated_at = ? WHERE family_id = ?").bind(deltaBalance, timestamp, familyId));
    }

    if (statements.length > 0) {
        await env.DB.batch(statements);
    }
    
    const finalSettings = await env.DB.prepare("SELECT balance FROM settings WHERE family_id = ?").bind(familyId).first();

    return createResponse({ 
        success: true,
        data: {
            balance: finalSettings ? finalSettings.balance : 0
        }
    });
}

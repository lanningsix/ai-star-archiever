
import { createResponse } from '../utils/common';

export async function handleActivity(request: Request, env: any, familyId: string, scope: string, data: any) {
    const timestamp = Date.now();
    const statements: any[] = [];

    // Ensure settings table exists (for foreign key integrity logical)
    statements.push(
        env.DB.prepare("INSERT OR IGNORE INTO settings (family_id, created_at, updated_at) VALUES (?, ?, ?)")
        .bind(familyId, timestamp, timestamp)
    );

    let deltaBalance = 0;
    let deltaLifetime = 0;
    let shouldUpdateBalance = false;

    if (scope === 'record_log') {
        const { dateKey, taskId, action, transaction, revokeTransactionId, updateTransaction } = data;
        
        // 1. Insert New Transaction
        if (transaction) {
            shouldUpdateBalance = true;
            statements.push(env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at, task_id, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(transaction.id, familyId, transaction.date, transaction.description, transaction.amount, transaction.type, timestamp, transaction.taskId || null, transaction.isRevoked ? 1 : 0));
            
            deltaBalance += transaction.amount;
            if (transaction.amount > 0 && !transaction.isRevoked) {
                deltaLifetime += transaction.amount;
            }
        }

        // 2. Update Existing Transaction (Revoke/Restore)
        if (updateTransaction) {
            const { id, isRevoked, date } = updateTransaction;
            const originalTx = await env.DB.prepare("SELECT amount, is_revoked FROM transactions WHERE id = ? AND family_id = ?").bind(id, familyId).first();
            
            if (originalTx) {
                shouldUpdateBalance = true;
                const oldRevoked = originalTx.is_revoked === 1;
                const newRevoked = isRevoked;
                
                if (oldRevoked !== newRevoked) {
                    const amount = originalTx.amount;
                    // Revoking (0->1): subtract amount | Restoring (1->0): add amount
                    const diff = (newRevoked ? 0 : amount) - (oldRevoked ? 0 : amount);
                    
                    deltaBalance += diff;
                    if (amount > 0) deltaLifetime += diff;
                }
                
                statements.push(env.DB.prepare("UPDATE transactions SET is_revoked = ?, date = ?, updated_at = ? WHERE family_id = ? AND id = ?").bind(newRevoked ? 1 : 0, date, timestamp, familyId, id));
            }
        }

        // 3. Legacy Revoke Support
        if (revokeTransactionId && !updateTransaction) {
            const originalTx = await env.DB.prepare("SELECT amount FROM transactions WHERE id = ? AND family_id = ?").bind(revokeTransactionId, familyId).first();
            if (originalTx) {
                shouldUpdateBalance = true;
                deltaBalance -= originalTx.amount;
                if (originalTx.amount > 0) deltaLifetime -= originalTx.amount;
                statements.push(env.DB.prepare("UPDATE transactions SET is_revoked = 1 WHERE family_id = ? AND id = ?").bind(familyId, revokeTransactionId));
            }
        }
        
        // 4. Update Logs
        if (action === 'add') {
            statements.push(env.DB.prepare("INSERT INTO task_logs (family_id, date_key, task_id, created_at) VALUES (?, ?, ?, ?)").bind(familyId, dateKey, taskId, timestamp));
        } else {
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

    // Apply Atomic Balance Update
    if (shouldUpdateBalance && (deltaBalance !== 0 || deltaLifetime !== 0)) {
        statements.push(env.DB.prepare("UPDATE settings SET balance = balance + ?, lifetime_earned = MAX(0, lifetime_earned + ?), updated_at = ? WHERE family_id = ?").bind(deltaBalance, deltaLifetime, timestamp, familyId));
    }

    if (statements.length > 0) {
        await env.DB.batch(statements);
    }
    
    // Return updated balance to client
    const finalSettings = await env.DB.prepare("SELECT balance, lifetime_earned FROM settings WHERE family_id = ?").bind(familyId).first();

    return createResponse({ 
        success: true,
        data: {
            balance: finalSettings ? finalSettings.balance : 0,
            lifetimeEarnings: finalSettings ? finalSettings.lifetime_earned : 0
        }
    });
}

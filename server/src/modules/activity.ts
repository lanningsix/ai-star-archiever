
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
        const { dateKey, taskId, action, transaction, updateTransaction } = data;
        const inputTx = transaction || updateTransaction; // Get payload data if available

        // 1. LOGS HANDLING: Idempotent Insert / Delete
        if (action === 'add') {
             // Check if log exists to verify idempotency (don't insert if already there)
             const existingLog = await env.DB.prepare("SELECT id FROM task_logs WHERE family_id=? AND date_key=? AND task_id=?").bind(familyId, dateKey, taskId).first();
             if (!existingLog) {
                 statements.push(env.DB.prepare("INSERT INTO task_logs (family_id, date_key, task_id, created_at) VALUES (?, ?, ?, ?)").bind(familyId, dateKey, taskId, timestamp));
             }
        } else {
             // For removal, we must delete the log entry as table only stores active logs
             statements.push(env.DB.prepare("DELETE FROM task_logs WHERE family_id = ? AND date_key = ? AND task_id = ?").bind(familyId, dateKey, taskId));
        }

        // 2. TRANSACTIONS HANDLING: Single Record Enforcement
        // Try to find an existing transaction for this task on this day
        const existingTx = await env.DB.prepare("SELECT * FROM transactions WHERE family_id = ? AND task_id = ? AND date LIKE ?").bind(familyId, taskId, `${dateKey}%`).first();

        if (existingTx) {
             shouldUpdateBalance = true;
             
             // Determine new state
             const oldRevoked = existingTx.is_revoked === 1;
             const newRevoked = action === 'remove'; // remove = revoked(1), add = active(0)

             // Determine Amount (Use new amount from payload if available, else fallback to existing)
             let amount = existingTx.amount;
             if (inputTx && inputTx.amount !== undefined) amount = inputTx.amount;

             // Calculate Balance Delta based on state change
             // Effective Value = (isRevoked ? 0 : amount)
             const effOld = oldRevoked ? 0 : existingTx.amount;
             const effNew = newRevoked ? 0 : amount;
             
             const diff = effNew - effOld;
             
             deltaBalance += diff;
             // Lifetime earnings should only track positive flows
             if (amount > 0) deltaLifetime += diff;
             
             // Update the existing transaction record (Status, Amount, Date to now)
             statements.push(env.DB.prepare("UPDATE transactions SET is_revoked = ?, amount = ?, date = ?, updated_at = ? WHERE family_id = ? AND id = ?")
                .bind(newRevoked ? 1 : 0, amount, new Date().toISOString(), timestamp, familyId, existingTx.id));

        } else if (action === 'add' && transaction) {
             // No existing record found, INSERT new transaction
             shouldUpdateBalance = true;
             statements.push(env.DB.prepare("INSERT INTO transactions (id, family_id, date, description, amount, type, created_at, task_id, is_revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(transaction.id, familyId, transaction.date, transaction.description, transaction.amount, transaction.type, timestamp, transaction.taskId, 0));
             
             deltaBalance += transaction.amount;
             if (transaction.amount > 0) deltaLifetime += transaction.amount;
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

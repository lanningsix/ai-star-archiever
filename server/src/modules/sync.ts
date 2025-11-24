
import { createResponse } from '../utils/common';

export async function handleSync(request: Request, env: any, familyId: string, scope: string, url: URL) {
    const month = url.searchParams.get("month"); // Optional: YYYY-MM
    const dateParam = url.searchParams.get("date"); // Optional: YYYY-MM-DD
    const startDate = url.searchParams.get("startDate"); // Optional: ISO String
    const endDate = url.searchParams.get("endDate"); // Optional: ISO String

    // 1. 获取基础设置 (Always fetch settings for balance/theme/avatar/stats)
    const settings = await env.DB.prepare("SELECT * FROM settings WHERE family_id = ?").bind(familyId).first();
    
    // 如果没有找到该家庭，返回空结构
    if (!settings) {
        return createResponse({ data: null });
    }

    let tasksResult, rewardsResult, logsResult, txResult, wishlistResult;
    const promises = [];

    // 根据 Scope 决定查询哪些表
    if (scope === 'all' || scope === 'daily' || scope === 'settings') {
        promises.push(env.DB.prepare("SELECT * FROM tasks WHERE family_id = ?").bind(familyId).all().then((r: any) => tasksResult = r));
        
        let logSql = "SELECT date_key, task_id FROM task_logs WHERE family_id = ?";
        const logParams: any[] = [familyId];
        if (dateParam) {
            logSql += " AND date_key = ?";
            logParams.push(dateParam);
        }
        promises.push(env.DB.prepare(logSql).bind(...logParams).all().then((r: any) => logsResult = r));
    }

    if (scope === 'all' || scope === 'store' || scope === 'settings') {
        promises.push(env.DB.prepare("SELECT * FROM rewards WHERE family_id = ?").bind(familyId).all().then((r: any) => rewardsResult = r));
    }
    
    if (scope === 'all' || scope === 'store' || scope === 'wishlist') {
        promises.push(env.DB.prepare("SELECT * FROM wishlist_goals WHERE family_id = ?").bind(familyId).all().then((r: any) => wishlistResult = r));
    }

    // UPDATED: Added 'daily' here so transactions are fetched for the daily view stats
    if (scope === 'all' || scope === 'calendar' || scope === 'settings' || scope === 'activity' || scope === 'daily') {
        let txSql = "SELECT * FROM transactions WHERE family_id = ?";
        const params: any[] = [familyId];

        if (startDate && endDate) {
            txSql += " AND date >= ? AND date <= ?";
            params.push(startDate);
            params.push(endDate);
            txSql += " ORDER BY created_at DESC";
        } else if (dateParam) {
            txSql += " AND date LIKE ?";
            params.push(`${dateParam}%`);
            txSql += " ORDER BY created_at DESC";
        } else if (month) {
            txSql += " AND date LIKE ?";
            params.push(`${month}%`);
            txSql += " ORDER BY created_at DESC";
        } else {
            txSql += " ORDER BY created_at DESC LIMIT 5000";
        }

        promises.push(env.DB.prepare(txSql).bind(...params).all().then((r: any) => txResult = r));
    }

    await Promise.all(promises);

    // 转换 Logs 格式
    let logsMap: Record<string, string[]> | undefined = undefined;
    if (logsResult && logsResult.results) {
        logsMap = {};
        logsResult.results.forEach((row: any) => {
            if (!logsMap![row.date_key]) logsMap![row.date_key] = [];
            logsMap![row.date_key].push(row.task_id);
        });
    }
    
    // 转换 Wishlist 字段名
    const wishlist = wishlistResult && wishlistResult.results ? wishlistResult.results.map((r: any) => ({
        id: r.id,
        title: r.title,
        targetCost: r.target_cost,
        currentSaved: r.current_saved,
        icon: r.icon
    })) : undefined;
    
    // 转换 Transactions 字段名
    const transactions = txResult && txResult.results ? txResult.results.map((r: any) => ({
        id: r.id,
        date: r.date,
        description: r.description,
        amount: r.amount,
        type: r.type,
        taskId: r.task_id,
        isRevoked: r.is_revoked === 1
    })) : undefined;

    // 组装最终 JSON
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
    
    return createResponse({ data });
}

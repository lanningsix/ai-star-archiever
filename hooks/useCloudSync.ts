
import { useState, useEffect, useCallback } from 'react';
import { cloudService, DataScope } from '../services/cloud';
import { INITIAL_TASKS, INITIAL_REWARDS } from '../constants';
import { Task, Reward, WishlistGoal, Transaction } from '../types';
import { ThemeKey } from '../styles/themes';

interface DataSetters {
    setTasks: (t: Task[]) => void;
    setRewards: (r: Reward[]) => void;
    setWishlist: (w: WishlistGoal[]) => void;
    setLogs: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    setBalance: (b: number) => void;
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    setThemeKey: (k: ThemeKey) => void;
    setUserName: (n: string) => void;
    setLifetimeEarnings: (l: number) => void;
    setUnlockedAchievements: (a: string[]) => void;
}

export const useCloudSync = (
    familyId: string,
    setFamilyId: (id: string) => void,
    setters: DataSetters,
    onShowToast: (msg: string, type: 'success' | 'error') => void
) => {
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
    const [isSyncReady, setIsSyncReady] = useState(false);
    const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('app_family_id'));

    // --- Core Load Logic ---
    const handleCloudLoad = useCallback(async (
        targetFamilyId: string, 
        silent = false, 
        scope = 'all', 
        date?: string, 
        startDate?: string, 
        endDate?: string
    ) => {
        if (!targetFamilyId) return;
        if (!silent) setSyncStatus('syncing');

        try {
            const data = await cloudService.loadData(targetFamilyId, scope, date, startDate, endDate);
            if (data) {
                // If loading ALL data, prevent immediate auto-save by disabling sync ready
                if (scope === 'all') setIsSyncReady(false);

                if (data.tasks) setters.setTasks(data.tasks);
                if (data.rewards) setters.setRewards(data.rewards);
                if (data.wishlist) setters.setWishlist(data.wishlist);
                
                if (data.logs) {
                    setters.setLogs(prev => ({ ...prev, ...data.logs }));
                }

                if (data.balance !== undefined) setters.setBalance(data.balance);
                
                if (data.transactions) {
                    setters.setTransactions(prev => {
                        const newTx = data.transactions || [];
                        const existingIds = new Set(prev.map(t => t.id));
                        const uniqueNew = newTx.filter(t => !existingIds.has(t.id));
                        return [...prev, ...uniqueNew].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    });
                }

                if (data.themeKey) setters.setThemeKey(data.themeKey as ThemeKey);
                if (data.userName) setters.setUserName(data.userName);
                if (data.lifetimeEarnings !== undefined) setters.setLifetimeEarnings(data.lifetimeEarnings);
                if (data.unlockedAchievements) setters.setUnlockedAchievements(data.unlockedAchievements);
                
                setSyncStatus('saved');
                
                if (scope === 'all') {
                    setTimeout(() => setIsSyncReady(true), 50);
                }

                if (!silent && scope === 'all') {
                    onShowToast('数据同步成功！', 'success');
                }
            } else {
                if (!silent) onShowToast('未找到该家庭ID的数据', 'error');
                setIsSyncReady(true);
                setSyncStatus('idle');
            }
        } catch (e) {
            setSyncStatus('error');
            if (!silent) onShowToast('同步失败，请检查网络', 'error');
        }
    }, [setters, onShowToast]);

    // --- Core Sync/Save Logic ---
    const syncData = useCallback(async (
        scope: DataScope | 'record_log' | 'record_transaction' | 'wishlist_update' | 'wishlist_delete', 
        data: any, 
        silent = false
    ) => {
        if (!familyId) return;
        if (!silent) setSyncStatus('syncing');
        
        const result = await cloudService.saveData(familyId, scope as DataScope, data);
        
        if (result.success) {
            setSyncStatus('saved');
            
            // Server authority for balance
            if (result.data) {
                if (typeof result.data.balance === 'number') setters.setBalance(result.data.balance);
                if (typeof result.data.lifetimeEarnings === 'number') setters.setLifetimeEarnings(result.data.lifetimeEarnings);
            }

            if (!silent) setTimeout(() => setSyncStatus('idle'), 2000);
        } else {
            setSyncStatus('error');
        }
    }, [familyId, setters]);

    // --- Manual Actions ---
    const manualSaveAll = async (fid = familyId, currentState: any) => {
        if (!fid) {
            onShowToast('请先创建家庭ID', 'error');
            return;
        }
        setSyncStatus('syncing');
        
        try {
            await cloudService.saveData(fid, 'settings', { userName: currentState.userName, themeKey: currentState.themeKey });
            await cloudService.saveData(fid, 'tasks', currentState.tasks);
            await cloudService.saveData(fid, 'rewards', currentState.rewards);
            await cloudService.saveData(fid, 'wishlist', currentState.wishlist);
            
            // Only save specific activity fields to avoid overwrites
            await cloudService.saveData(fid, 'activity', { unlockedAchievements: currentState.unlockedAchievements });
            
            setSyncStatus('saved');
            setTimeout(() => setSyncStatus('idle'), 2000);
            onShowToast('所有数据已上传云端', 'success');
        } catch (error) {
            console.error("Manual save failed", error);
            setSyncStatus('error');
            onShowToast('上传失败，请稍后再试', 'error');
        }
    };

    const createFamily = () => {
        const newId = cloudService.generateFamilyId();
        setFamilyId(newId);
        setIsSyncReady(true);
        // We delay slightly to let state update before potentially saving, 
        // though usually manualSave is called right after with explicit state
        onShowToast('家庭ID已创建，记得保存哦！', 'success');
        return newId;
    };

    const handleStartAdventure = async (name: string) => {
        setIsLoading(true);
        const newId = cloudService.generateFamilyId();
        
        setters.setUserName(name);
        setFamilyId(newId);
        setIsSyncReady(false);
        
        try {
            await Promise.all([
                cloudService.saveData(newId, 'settings', { userName: name, themeKey: 'lemon' }),
                cloudService.saveData(newId, 'tasks', INITIAL_TASKS),
                cloudService.saveData(newId, 'rewards', INITIAL_REWARDS),
                cloudService.saveData(newId, 'wishlist', []),
                cloudService.saveData(newId, 'activity', { logs: {}, balance: 0, transactions: [], lifetimeEarnings: 0, unlockedAchievements: [] })
            ]);

            onShowToast(`欢迎你，${name}！`, 'success');
            setIsSyncReady(true);
        } catch (error) {
            console.error("Start adventure save failed", error);
            setSyncStatus('error');
            onShowToast('初始化失败，请重试', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinFamily = async (id: string) => {
        setFamilyId(id);
        setIsSyncReady(false);
        setIsLoading(true);
        await handleCloudLoad(id, false, 'all');
        setIsLoading(false);
    };

    // --- Init Effect ---
    useEffect(() => {
        if (familyId) {
            handleCloudLoad(familyId, true, 'all').finally(() => {
                setIsLoading(false);
            });
        }
    }, []); // Run once on mount

    return {
        syncStatus,
        isSyncReady,
        setIsSyncReady,
        isLoading,
        setIsLoading,
        handleCloudLoad,
        syncData,
        manualSaveAll,
        createFamily,
        handleStartAdventure,
        handleJoinFamily
    };
};

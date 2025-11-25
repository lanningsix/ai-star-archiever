
import { useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_TASKS, INITIAL_REWARDS, MYSTERY_BOX_COST, MYSTERY_BOX_REWARDS } from '../constants';
import { Task, Reward, TaskCategory, Transaction, WishlistGoal, Achievement } from '../types';
import { ThemeKey } from '../styles/themes';
import { ToastType } from '../components/Toast';
import { useGamification } from './useGamification';
import { useCloudSync } from './useCloudSync';

export const useAppLogic = () => {
  // --- Core State ---
  const [activeTab, setActiveTab] = useState<'daily' | 'store' | 'calendar' | 'settings' | 'stats'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [userName, setUserName] = useState(''); 
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => (localStorage.getItem('app_theme') as ThemeKey) || 'lemon');
  const [familyId, setFamilyId] = useState(() => localStorage.getItem('app_family_id') || '');

  // --- Data State ---
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [rewards, setRewards] = useState<Reward[]>(INITIAL_REWARDS);
  const [wishlist, setWishlist] = useState<WishlistGoal[]>([]);
  const [logs, setLogs] = useState<Record<string, string[]>>({});
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lifetimeEarnings, setLifetimeEarnings] = useState<number>(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  
  // --- UI State ---
  const [isInteractionBlocked, setIsInteractionBlocked] = useState(false);
  const [statsConfig, setStatsConfig] = useState<{
      type: 'day' | 'week' | 'month' | 'custom';
      date: Date;
      customStart?: Date;
      customEnd?: Date;
  }>({ type: 'week', date: new Date() });

  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({
    show: false, message: '', type: 'success',
  });

  // --- Helpers ---
  const getDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const streak = useMemo(() => {
    let currentStreak = 0;
    const todayKey = getDateKey(new Date());
    if (logs[todayKey] && logs[todayKey].length > 0) currentStreak++;

    let d = new Date();
    d.setDate(d.getDate() - 1); 
    while (true) {
        const k = getDateKey(d);
        if (logs[k] && logs[k].length > 0) {
            currentStreak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }
    return currentStreak;
  }, [logs]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  // --- Persistence ---
  useEffect(() => localStorage.setItem('app_theme', themeKey), [themeKey]);
  useEffect(() => localStorage.setItem('app_family_id', familyId), [familyId]);

  // --- Hooks Integration ---
  
  const gamification = useGamification({
      unlockedAchievements, setUnlockedAchievements,
      streak, lifetimeEarnings, balance, transactions, logs, tasks
  });

  // Memoize setters for CloudSync to avoid dependency loops
  const dataSetters = useMemo(() => ({
      setTasks, setRewards, setWishlist, setLogs, setBalance, setTransactions,
      setThemeKey, setUserName, setLifetimeEarnings, setUnlockedAchievements
  }), []);

  const cloud = useCloudSync(familyId, setFamilyId, dataSetters, showToast);

  // --- Effects for Cloud ---
  
  // Tab change data fetching
  useEffect(() => {
    if (familyId && cloud.isSyncReady) {
        const fetchTab = async () => {
            cloud.setIsLoading(true);
            let scope = 'all';
            let dateParam = undefined;
            let startDateParam = undefined;
            let endDateParam = undefined;

            if (activeTab === 'daily') {
                 scope = 'daily';
                 dateParam = getDateKey(currentDate);
            }
            if (activeTab === 'store') scope = 'store';
            if (activeTab === 'calendar') {
                 scope = 'calendar';
                 dateParam = getDateKey(currentDate);
            }
            if (activeTab === 'settings') scope = 'settings';
            
            if (activeTab === 'stats') {
                scope = 'activity';
                let start = new Date(statsConfig.date);
                let end = new Date(statsConfig.date);

                if (statsConfig.type === 'day') {
                    start.setHours(0,0,0,0);
                    end.setHours(23,59,59,999);
                } else if (statsConfig.type === 'week') {
                    const day = start.getDay();
                    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                    start.setDate(diff);
                    start.setHours(0,0,0,0);
                    
                    end = new Date(start);
                    end.setDate(end.getDate() + 6);
                    end.setHours(23,59,59,999);
                } else if (statsConfig.type === 'month') {
                    start.setDate(1);
                    start.setHours(0,0,0,0);
                    
                    end = new Date(start);
                    end.setMonth(end.getMonth() + 1);
                    end.setDate(0);
                    end.setHours(23,59,59,999);
                } else if (statsConfig.type === 'custom' && statsConfig.customStart && statsConfig.customEnd) {
                    start = new Date(statsConfig.customStart);
                    start.setHours(0,0,0,0);
                    end = new Date(statsConfig.customEnd);
                    end.setHours(23,59,59,999);
                }
                startDateParam = start.toISOString();
                endDateParam = end.toISOString();
            }
            
            await cloud.handleCloudLoad(familyId, true, scope, dateParam, startDateParam, endDateParam);
            cloud.setIsLoading(false);
        };
        fetchTab();
    }
  }, [activeTab, currentDate, statsConfig, familyId, cloud.isSyncReady]); 

  // Auto-Save Effects
  useEffect(() => {
    if (!familyId || !cloud.isSyncReady) return;
    const t = setTimeout(() => cloud.syncData('tasks', tasks, true), 500);
    return () => clearTimeout(t);
  }, [tasks, familyId, cloud.isSyncReady]);

  useEffect(() => {
    if (!familyId || !cloud.isSyncReady) return;
    const t = setTimeout(() => cloud.syncData('rewards', rewards, true), 500);
    return () => clearTimeout(t);
  }, [rewards, familyId, cloud.isSyncReady]);

  useEffect(() => {
    if (!familyId || !cloud.isSyncReady) return;
    const t = setTimeout(() => cloud.syncData('settings', { userName, themeKey }, true), 1500);
    return () => clearTimeout(t);
  }, [userName, themeKey, familyId, cloud.isSyncReady]);

  useEffect(() => {
    if (!familyId || !cloud.isSyncReady || unlockedAchievements.length === 0) return;
    const t = setTimeout(() => {
        cloud.syncData('activity', { unlockedAchievements }, true);
    }, 2000);
    return () => clearTimeout(t);
  }, [unlockedAchievements, familyId, cloud.isSyncReady]);

  // Block interaction during celebration
  useEffect(() => {
    if (gamification.showCelebration.show) {
      setIsInteractionBlocked(true);
      const timer = setTimeout(() => setIsInteractionBlocked(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [gamification.showCelebration.show]);


  // --- Logic Actions ---

  const handleTransaction = (amount: number, description: string, dateContext?: Date, taskId?: string) => {
    const newBalance = balance + amount;
    let newLifetime = lifetimeEarnings;
    
    if (amount > 0 && !description.includes('退回') && !description.includes('撤销')) {
        newLifetime += amount;
    }
    
    let txDate = new Date();
    if (dateContext) {
        txDate = new Date(dateContext);
        const now = new Date();
        txDate.setHours(now.getHours());
        txDate.setMinutes(now.getMinutes());
        txDate.setSeconds(now.getSeconds());
    }
    
    const newTx: Transaction = {
      id: Date.now().toString(),
      date: txDate.toISOString(),
      description,
      amount,
      type: amount > 0 ? 'EARN' : amount < 0 && (description.includes('兑换') || description.includes('购买') || description.includes('存入') || description.includes('盲盒')) ? 'SPEND' : 'PENALTY',
      taskId,
      isRevoked: false,
      timestamp: Date.now()
    };

    setBalance(newBalance);
    setLifetimeEarnings(newLifetime);
    setTransactions(prev => [newTx, ...prev]);

    return { newBalance, newLifetime, newTx };
  };

  const toggleTask = (task: Task) => {
    const dateKey = getDateKey(currentDate);
    const currentLog = logs[dateKey] || [];
    const isCompleted = currentLog.includes(task.id);

    const relevantTxIndex = transactions.findIndex(t => {
        const txDate = new Date(t.date);
        if (getDateKey(txDate) !== dateKey) return false;
        if (t.taskId === task.id) return true;
        return !t.taskId && t.description.includes(task.title);
    });

    if (isCompleted) {
      // UNDO
      const action = 'remove';
      setIsInteractionBlocked(true); 
      const newLog = currentLog.filter(id => id !== task.id);
      
      if (relevantTxIndex > -1) {
          const targetTx = transactions[relevantTxIndex];
          const newBalance = balance - targetTx.amount;
          let newLifetime = lifetimeEarnings;
          if (targetTx.amount > 0) newLifetime = Math.max(0, lifetimeEarnings - targetTx.amount);

          const newTx = { ...targetTx, isRevoked: true, timestamp: Date.now() };
          
          const newTransactions = [...transactions];
          newTransactions[relevantTxIndex] = newTx;
          // Sort by timestamp desc
          newTransactions.sort((a, b) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()));

          setTransactions(newTransactions);
          setBalance(newBalance);
          setLifetimeEarnings(newLifetime);
          setLogs({ ...logs, [dateKey]: newLog });

          if (familyId && cloud.isSyncReady) {
             cloud.syncData('record_log', {
                dateKey, taskId: task.id, action,
                updateTransaction: { id: targetTx.id, isRevoked: true, date: newTx.date }
             }, true);
          }
      } else {
          // Fallback
          const txData = handleTransaction(-task.stars, `撤销: ${task.title}`, currentDate);
          setLogs({ ...logs, [dateKey]: newLog });
          if (familyId && cloud.isSyncReady) {
            cloud.syncData('record_log', { dateKey, taskId: task.id, action, transaction: txData.newTx }, true);
          }
      }
      setTimeout(() => setIsInteractionBlocked(false), 500);

    } else {
      // COMPLETE
      const action = 'add';
      setIsInteractionBlocked(true);
      const newLog = [...currentLog, task.id];
      
      if (relevantTxIndex > -1) {
          // Restore
          const targetTx = transactions[relevantTxIndex];
          const newBalance = balance + targetTx.amount;
          let newLifetime = lifetimeEarnings;
          if (targetTx.amount > 0) newLifetime += targetTx.amount;

          const newTx = { ...targetTx, isRevoked: false, timestamp: Date.now() };

          const newTransactions = [...transactions];
          newTransactions[relevantTxIndex] = newTx;
          // Sort by timestamp desc
          newTransactions.sort((a, b) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()));

          setTransactions(newTransactions);
          setBalance(newBalance);
          setLifetimeEarnings(newLifetime);
          setLogs({ ...logs, [dateKey]: newLog });

          if (familyId && cloud.isSyncReady) {
             cloud.syncData('record_log', {
                dateKey, taskId: task.id, action,
                updateTransaction: { id: targetTx.id, isRevoked: false, date: newTx.date }
             }, true);
          }

          const isPenalty = task.category === TaskCategory.PENALTY;
          gamification.setShowCelebration({ show: true, points: task.stars, type: isPenalty ? 'penalty' : 'success' });
          if (isPenalty) {
              gamification.triggerRainConfetti();
              gamification.playRandomSound('penalty');
          } else {
              gamification.triggerRandomCelebration();
              gamification.playRandomSound('success');
          }
      } else {
          // New
          const isPenalty = task.category === TaskCategory.PENALTY;
          const prefix = isPenalty ? '扣分' : '完成';
          const txData = handleTransaction(task.stars, `${prefix}: ${task.title}`, currentDate, task.id);
          
          gamification.setShowCelebration({ show: true, points: task.stars, type: isPenalty ? 'penalty' : 'success' });
          if (isPenalty) {
            gamification.triggerRainConfetti();
            gamification.playRandomSound('penalty');
          } else {
            gamification.triggerRandomCelebration();
            gamification.playRandomSound('success');
          }
          
          setLogs({ ...logs, [dateKey]: newLog });
          if (familyId && cloud.isSyncReady) {
              cloud.syncData('record_log', { dateKey, taskId: task.id, action, transaction: txData.newTx }, true);
          }
      }
      setTimeout(() => setIsInteractionBlocked(false), 500);
    }
  };

  const redeemReward = (reward: Reward) => {
    if (balance >= reward.cost) {
      setIsInteractionBlocked(true);
      try {
          const txData = handleTransaction(-reward.cost, `兑换: ${reward.title}`);
          if (familyId && cloud.isSyncReady) {
              cloud.syncData('record_transaction', { transaction: txData.newTx }, true);
          }
          
          // Trigger the big flying animation
          gamification.triggerRedemption(reward);
          
          setTimeout(() => setIsInteractionBlocked(false), 2000); // Block until animation mostly done
      } catch (error) {
          setIsInteractionBlocked(false);
      }
    } else {
      showToast(`星星不够哦！还需要 ${reward.cost - balance} 颗星星。`, 'error');
      gamification.playRandomSound('penalty');
    }
  };

  const openMysteryBox = () => {
      if (balance < MYSTERY_BOX_COST) {
          showToast('星星不够哦！', 'error');
          return;
      }
      setIsInteractionBlocked(true);

      let txData = handleTransaction(-MYSTERY_BOX_COST, '开启神秘盲盒');
      if (familyId && cloud.isSyncReady) {
          cloud.syncData('record_transaction', { transaction: txData.newTx }, true);
      }
      
      const totalWeight = MYSTERY_BOX_REWARDS.reduce((acc, r) => acc + r.weight, 0);
      let random = Math.random() * totalWeight;
      let selected = MYSTERY_BOX_REWARDS[0];
      for (const r of MYSTERY_BOX_REWARDS) {
          if (random < r.weight) { selected = r; break; }
          random -= r.weight;
      }

      if (selected.bonusStars) {
          const bonusTxData = handleTransaction(selected.bonusStars, '盲盒大奖');
          if (familyId && cloud.isSyncReady) {
             setTimeout(() => {
                 cloud.syncData('record_transaction', { transaction: bonusTxData.newTx }, true);
             }, 100);
          }
      }

      gamification.setMysteryReward(selected);
      setTimeout(() => setIsInteractionBlocked(false), 1000);
  };

  const depositToWishlist = (goal: WishlistGoal, amount: number) => {
      if (balance < amount) {
          showToast('星星不够哦！', 'error');
          gamification.playRandomSound('penalty');
          return;
      }
      if (amount <= 0) return;
      setIsInteractionBlocked(true);

      const txData = handleTransaction(-amount, `存入心愿: ${goal.title}`);
      
      let updatedGoal = goal;
      const updatedWishlist = wishlist.map(g => {
          if (g.id === goal.id) {
              const newSaved = g.currentSaved + amount;
              updatedGoal = { ...g, currentSaved: newSaved };
              if (newSaved >= g.targetCost) {
                   gamification.playRandomSound('success');
                   gamification.triggerFireworks();
              }
              return updatedGoal;
          }
          return g;
      });
      
      setWishlist(updatedWishlist);
      showToast(`成功存入 ${amount} 颗星星`, 'success');

      if (familyId && cloud.isSyncReady) {
          cloud.syncData('wishlist_update', { goal: updatedGoal, transaction: txData.newTx }, true);
      }
      setTimeout(() => setIsInteractionBlocked(false), 500);
  };

  const addWishlistGoal = (goal: WishlistGoal) => {
      setWishlist([...wishlist, goal]);
      if (familyId && cloud.isSyncReady) {
          cloud.syncData('wishlist_update', { goal }, true);
      }
  };

  const deleteWishlistGoal = (id: string) => {
      const goal = wishlist.find(g => g.id === id);
      let txData;
      setIsInteractionBlocked(true);
      if (goal && goal.currentSaved > 0) {
          txData = handleTransaction(goal.currentSaved, `退回心愿存款: ${goal.title}`);
          showToast(`退回了 ${goal.currentSaved} 颗星星`, 'info');
      }
      setWishlist(wishlist.filter(g => g.id !== id));
      if (familyId && cloud.isSyncReady) {
          cloud.syncData('wishlist_delete', { goalId: id, transaction: txData?.newTx }, true);
      }
      setTimeout(() => setIsInteractionBlocked(false), 500);
  };

  const manualSaveAll = () => cloud.manualSaveAll(familyId, {
      userName, themeKey, tasks, rewards, wishlist, unlockedAchievements
  });

  const resetData = () => {
      localStorage.clear();
      window.location.reload();
  };

  return {
    state: {
      activeTab, currentDate, userName, themeKey, familyId,
      tasks, rewards, wishlist, logs, balance, transactions,
      lifetimeEarnings, unlockedAchievements, streak,
      syncStatus: cloud.syncStatus, isInteractionBlocked, 
      showCelebration: gamification.showCelebration, 
      newUnlocked: gamification.newUnlocked,
      dateKey: getDateKey(currentDate),
      toast,
      isLoading: cloud.isLoading,
      mysteryReward: gamification.mysteryReward,
      statsConfig,
      redemptionPop: gamification.redemptionPop
    },
    actions: {
      setActiveTab, setCurrentDate, setUserName, setThemeKey, setFamilyId,
      setTasks, setRewards, setWishlist,
      toggleTask, redeemReward, depositToWishlist, addWishlistGoal, deleteWishlistGoal,
      openMysteryBox, setMysteryReward: gamification.setMysteryReward,
      createFamily: cloud.createFamily, 
      manualSaveAll, 
      handleCloudLoad: cloud.handleCloudLoad, 
      handleStartAdventure: cloud.handleStartAdventure, 
      handleJoinFamily: cloud.handleJoinFamily, 
      resetData,
      setShowCelebration: gamification.setShowCelebration, 
      setNewUnlocked: gamification.setNewUnlocked,
      showToast, hideToast,
      setStatsConfig,
    }
  };
};

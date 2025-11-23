
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { INITIAL_TASKS, INITIAL_REWARDS, ACHIEVEMENTS, MYSTERY_BOX_COST, MYSTERY_BOX_REWARDS, AUDIO_RESOURCES } from '../constants';
import { Task, Reward, TaskCategory, Transaction, WishlistGoal, Achievement } from '../types';
import { ThemeKey } from '../styles/themes';
import { cloudService, DataScope } from '../services/cloud';
import { ToastType } from '../components/Toast';

export const useAppLogic = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'store' | 'calendar' | 'settings' | 'stats'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // --- State ---
  const [userName, setUserName] = useState(''); 
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => (localStorage.getItem('app_theme') as ThemeKey) || 'lemon');
  const [familyId, setFamilyId] = useState(() => localStorage.getItem('app_family_id') || '');

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  
  const [rewards, setRewards] = useState<Reward[]>(INITIAL_REWARDS);

  const [wishlist, setWishlist] = useState<WishlistGoal[]>([]);

  const [logs, setLogs] = useState<Record<string, string[]>>({});

  const [balance, setBalance] = useState<number>(0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // New Stats State
  const [lifetimeEarnings, setLifetimeEarnings] = useState<number>(0);

  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  // --- Cloud Sync State ---
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [isSyncReady, setIsSyncReady] = useState(false);
  const [isInteractionBlocked, setIsInteractionBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('app_family_id'));

  // --- Stats Configuration State ---
  const [statsConfig, setStatsConfig] = useState<{
      type: 'day' | 'week' | 'month' | 'custom';
      date: Date;
      customStart?: Date;
      customEnd?: Date;
  }>({ type: 'week', date: new Date() });

  // --- Celebration State ---
  const [showCelebration, setShowCelebration] = useState<{show: boolean, points: number, type: 'success' | 'penalty'}>({ 
    show: false, 
    points: 0, 
    type: 'success' 
  });
  
  // Keep a ref to access current value in timeouts/intervals
  const showCelebrationRef = useRef(showCelebration);
  useEffect(() => {
    showCelebrationRef.current = showCelebration;
  }, [showCelebration]);

  // New Achievement Celebration
  const [newUnlocked, setNewUnlocked] = useState<Achievement | null>(null);
  // Pending Achievement (Wait queue if celebration is active)
  const [pendingUnlocked, setPendingUnlocked] = useState<Achievement | null>(null);
  
  // Mystery Box State
  const [mysteryReward, setMysteryReward] = useState<{ title: string, icon: string, bonusStars?: number } | null>(null);

  // --- Toast State ---
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'success',
  });

  // --- Persistence Effects ---
  // Only save config/session locally. Data is cloud-only.
  useEffect(() => localStorage.setItem('app_theme', themeKey), [themeKey]);
  useEffect(() => localStorage.setItem('app_family_id', familyId), [familyId]);
  
  // --- Helpers ---
  const getDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper: Calculate Streak
  const streak = useMemo(() => {
    let currentStreak = 0;
    const todayKey = getDateKey(new Date());
    
    // Check today
    if (logs[todayKey] && logs[todayKey].length > 0) {
        currentStreak++;
    }

    // Check backwards
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

  // Safe confetti wrapper
  const safeConfetti = (opts: any) => {
      try {
          // @ts-ignore
          if (typeof confetti === 'function') {
              confetti(opts);
          } else if (typeof (window as any).confetti === 'function') {
              (window as any).confetti(opts);
          }
      } catch (e) {
          console.warn('Confetti failed to load or execute', e);
      }
  };

  // --- Audio Player ---
  const playRandomSound = useCallback((type: 'success' | 'penalty' | 'unlock' = 'success') => {
      const urls = type === 'penalty' ? AUDIO_RESOURCES.PENALTY 
                 : type === 'unlock' ? AUDIO_RESOURCES.UNLOCK 
                 : AUDIO_RESOURCES.SUCCESS;
      
      if (!urls || urls.length === 0) return;

      // Try to pick a random one.
      const randomUrl = urls[Math.floor(Math.random() * urls.length)];
      const audio = new Audio(randomUrl);
      audio.volume = 0.6;
      
      audio.onerror = (e) => {
          console.warn(`Audio failed to load: ${randomUrl}`);
      };

      audio.play().catch(e => {
          console.warn("Audio play blocked or failed", e);
      });
  }, []);


  // Check Achievements Logic
  const checkAchievements = () => {
      const newUnlocks: string[] = [];
      let lastUnlockedAch: Achievement | null = null;

      ACHIEVEMENTS.forEach(ach => {
          if (unlockedAchievements.includes(ach.id)) return;

          let unlocked = false;
          
          switch (ach.conditionType) {
            case 'lifetime_stars':
              if (lifetimeEarnings >= ach.threshold) unlocked = true;
              break;
            case 'streak':
              if (streak >= ach.threshold) unlocked = true;
              break;
            case 'category_count':
               if (ach.categoryFilter) {
                 let count = 0;
                 Object.values(logs).forEach((dayLog) => {
                     (dayLog as string[]).forEach(tid => {
                         const t = tasks.find(tt => tt.id === tid);
                         if (t && t.category === ach.categoryFilter) count++;
                     });
                 });
                 if (count >= ach.threshold) unlocked = true;
               }
               break;
            case 'wishlist_complete':
               break;
            case 'balance_level':
               if (balance >= ach.threshold) unlocked = true;
               break;
            case 'redemption_count':
               const redeemCount = transactions.filter(t => t.amount < 0 && (t.description.includes('兑换') || t.description.includes('购买'))).length;
               if (redeemCount >= ach.threshold) unlocked = true;
               break;
            case 'mystery_box_count':
               const boxCount = transactions.filter(t => t.description.includes('盲盒')).length;
               if (boxCount >= ach.threshold) unlocked = true;
               break;
            case 'avatar_count':
               break;
          }
          
          if (unlocked) {
              newUnlocks.push(ach.id);
              lastUnlockedAch = ach;
          }
      });

      if (newUnlocks.length > 0) {
          setUnlockedAchievements(prev => [...prev, ...newUnlocks]);
          
          if (lastUnlockedAch) {
             if (showCelebrationRef.current.show) {
                 setPendingUnlocked(lastUnlockedAch);
             } else {
                 setNewUnlocked(lastUnlockedAch);
                 playRandomSound('unlock'); 
                 safeConfetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
             }
          }
      }
  };

  useEffect(() => {
      if (!showCelebration.show && pendingUnlocked) {
          const timer = setTimeout(() => {
              setNewUnlocked(pendingUnlocked);
              setPendingUnlocked(null);
              playRandomSound('unlock');
              safeConfetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
          }, 300);
          return () => clearTimeout(timer);
      }
  }, [showCelebration.show, pendingUnlocked]);

  useEffect(() => {
      const timeout = setTimeout(() => {
        checkAchievements();
      }, 500);
      return () => clearTimeout(timeout);
  }, [streak, lifetimeEarnings, balance, transactions.length, logs]);

  // --- Cloud Logic ---
  const handleCloudLoad = async (targetFamilyId: string, silent = false, scope = 'all', date?: string, startDate?: string, endDate?: string) => {
    if (!targetFamilyId) return;
    if (!silent) setSyncStatus('syncing');

    try {
      const data = await cloudService.loadData(targetFamilyId, scope, date, startDate, endDate);
      if (data) {
        setIsSyncReady(false);

        if (data.tasks) setTasks(data.tasks);
        if (data.rewards) setRewards(data.rewards);
        if (data.wishlist) setWishlist(data.wishlist);
        
        // Merge logs
        if (data.logs) {
            setLogs(prev => ({ ...prev, ...data.logs }));
        }

        if (data.balance !== undefined) setBalance(data.balance);
        
        // Merge or Set Transactions
        if (data.transactions) {
             if (scope === 'activity' && startDate && endDate) {
                 setTransactions(prev => {
                     const newTx = data.transactions || [];
                     const existingIds = new Set(prev.map(t => t.id));
                     const uniqueNew = newTx.filter(t => !existingIds.has(t.id));
                     return [...prev, ...uniqueNew].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                 });
             } else {
                 setTransactions(prev => {
                     const newTx = data.transactions || [];
                     const existingIds = new Set(prev.map(t => t.id));
                     const uniqueNew = newTx.filter(t => !existingIds.has(t.id));
                     return [...prev, ...uniqueNew].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                 });
             }
        }

        if (data.themeKey) setThemeKey(data.themeKey as ThemeKey);
        if (data.userName) setUserName(data.userName);
        if (data.lifetimeEarnings !== undefined) setLifetimeEarnings(data.lifetimeEarnings);
        if (data.unlockedAchievements) setUnlockedAchievements(data.unlockedAchievements);
        
        setSyncStatus('saved');
        setTimeout(() => setIsSyncReady(true), 50);

        if (!silent) {
             safeConfetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#A7F3D0', '#6EE7B7', '#34D399']
            });
            showToast('数据同步成功！', 'success');
        }
      } else {
        if (!silent) showToast('未找到该家庭ID的数据', 'error');
        setIsSyncReady(true);
        setSyncStatus('idle');
      }
    } catch (e) {
      setSyncStatus('error');
      if (!silent) showToast('同步失败，请检查网络', 'error');
    }
  };

  const syncData = async (scope: DataScope | 'record_log' | 'record_transaction' | 'wishlist_update' | 'wishlist_delete', data: any, silent = false) => {
    if (!familyId) return;
    if (!silent) setSyncStatus('syncing');
    
    // Optimistic UI for some actions is handled by caller updating state first
    const success = await cloudService.saveData(familyId, scope as DataScope, data);
    
    if (success) {
        setSyncStatus('saved');
        if (!silent) setTimeout(() => setSyncStatus('idle'), 2000);
    } else {
        setSyncStatus('error');
    }
  };

  useEffect(() => {
    if (familyId) {
      handleCloudLoad(familyId, true, 'all').finally(() => {
          setIsLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    if (familyId && isSyncReady) {
        const fetchTab = async () => {
            setIsLoading(true);
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
                // Calculate date range based on statsConfig
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
            
            await handleCloudLoad(familyId, true, scope, dateParam, startDateParam, endDateParam);
            setIsLoading(false);
        };
        fetchTab();
    }
  }, [activeTab, currentDate, statsConfig]); 

  // --- Auto-Save Configs (Low Frequency) ---
  useEffect(() => {
    if (!familyId || !isSyncReady) return;
    const t = setTimeout(() => syncData('tasks', tasks, true), 500);
    return () => clearTimeout(t);
  }, [tasks, familyId]);

  useEffect(() => {
    if (!familyId || !isSyncReady) return;
    const t = setTimeout(() => syncData('rewards', rewards, true), 500);
    return () => clearTimeout(t);
  }, [rewards, familyId]);

  useEffect(() => {
    if (!familyId || !isSyncReady) return;
    const t = setTimeout(() => syncData('settings', { userName, themeKey }, true), 1500);
    return () => clearTimeout(t);
  }, [userName, themeKey, familyId]);

  // REMOVED: Auto-save for 'activity' (logs/balance/transactions). 
  // We now use granular updates in toggleTask/redeemReward etc.

  // --- Animation Triggers ---
  const triggerStarConfetti = () => {
    const duration = 1000;
    const end = Date.now() + duration;
    const interval: any = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval);
        safeConfetti({ 
            particleCount: 20, startVelocity: 30, spread: 360, ticks: 60, 
            origin: { x: Math.random(), y: Math.random() - 0.2 }, 
            shapes: ['star'], colors: ['#FFD700', '#FFA500', '#FFFF00'] 
        });
    }, 250);
  };
  
  const triggerSideCannons = () => {
      const end = Date.now() + 1000;
      const colors = ['#a78bfa', '#f472b6', '#34d399', '#fbbf24'];
      (function frame() {
        safeConfetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
        safeConfetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
  };
  const triggerFireworks = () => {
      const duration = 1500;
      const end = Date.now() + duration;
      const interval: any = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval);
        safeConfetti({ 
            startVelocity: 30, spread: 360, ticks: 60, zIndex: 100,
            particleCount: 50, origin: { x: Math.random(), y: Math.random() - 0.2 },
            colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']
        });
      }, 250);
  };
  const triggerLoveRain = () => {
    const duration = 2000;
    const end = Date.now() + duration;
    (function frame() {
      safeConfetti({ 
          particleCount: 3, angle: 90, spread: 120, origin: { x: 0.5, y: -0.1 }, 
          colors: ['#f472b6', '#ec4899', '#db2777'], shapes: ['circle'], scalar: 2, gravity: 1.2 
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };
  const triggerGoldRush = () => {
      safeConfetti({
          particleCount: 150, spread: 100, origin: { y: 0.6 },
          colors: ['#FFD700', '#FDB931', '#E5C100'], shapes: ['circle'], scalar: 1.2
      });
  };
  const triggerSnowfall = () => {
      const duration = 2500;
      const end = Date.now() + duration;
      (function frame() {
        safeConfetti({
          particleCount: 2, angle: 90, spread: 180, origin: { x: Math.random(), y: -0.1 },
          colors: ['#ffffff', '#e2e8f0'], shapes: ['circle'], gravity: 0.3, drift: 0.5, ticks: 200, scalar: 0.8
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
  };
  const triggerForest = () => {
    safeConfetti({
        particleCount: 100, spread: 160, origin: { y: 0.6 },
        colors: ['#22c55e', '#15803d', '#86efac'], shapes: ['square'], scalar: 1.1, ticks: 200, gravity: 0.8
    });
  };
  const triggerOcean = () => {
    const duration = 1500;
    const end = Date.now() + duration;
    (function frame() {
      safeConfetti({
        particleCount: 5, angle: 90, spread: 100, origin: { x: 0.5, y: 1.1 },
        startVelocity: 55, colors: ['#3b82f6', '#60a5fa', '#93c5fd'], shapes: ['circle'], gravity: 0.6, scalar: 0.9
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };
  const triggerGalaxy = () => {
      safeConfetti({
          particleCount: 100, spread: 360, origin: { x: 0.5, y: 0.5 },
          colors: ['#4c1d95', '#8b5cf6', '#fbbf24', '#ffffff'], shapes: ['star'],
          startVelocity: 40, gravity: 0.4, scalar: 1.2, ticks: 100
      });
  };
  const triggerComet = () => {
      const end = Date.now() + 800;
      (function frame() {
        safeConfetti({
          particleCount: 7, angle: 45, spread: 5, origin: { x: 0, y: 1 },
          startVelocity: 80, colors: ['#f59e0b', '#fbbf24', '#ef4444'], shapes: ['square'], drift: 0.5
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
  };
  const triggerRainbow = () => {
      const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
      safeConfetti({
          particleCount: 200, angle: 90, spread: 160, origin: { y: 0.7 },
          colors: colors, shapes: ['circle'], startVelocity: 45, gravity: 0.9
      });
  };
  const triggerFountain = () => {
      const duration = 1500;
      const end = Date.now() + duration;
      (function frame() {
        safeConfetti({
          particleCount: 8, angle: 90, spread: 35, origin: { x: 0.5, y: 0.9 },
          startVelocity: 60, colors: ['#67e8f9', '#22d3ee', '#06b6d4'], gravity: 1.5, ticks: 100
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
  };
  const triggerGiant = () => {
      safeConfetti({
          particleCount: 25, spread: 90, origin: { y: 0.6 },
          scalar: 4, colors: ['#f472b6', '#22d3ee', '#fbbf24'], shapes: ['circle']
      });
  };
  const triggerSlowMotion = () => {
      safeConfetti({
          particleCount: 80, spread: 150, origin: { y: 0.6 },
          gravity: 0.2, startVelocity: 25, ticks: 400,
          colors: ['#94a3b8', '#cbd5e1', '#64748b'], shapes: ['square']
      });
  };
  const triggerPixelArt = () => {
      safeConfetti({
          particleCount: 200, spread: 360, origin: { x: 0.5, y: 0.5 },
          colors: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'],
          shapes: ['square'], scalar: 0.8, startVelocity: 40, ticks: 100
      });
  };

  const triggerRandomCelebration = () => {
      const effects = [
          triggerStarConfetti, triggerSideCannons, triggerFireworks, triggerLoveRain, 
          triggerGoldRush, triggerSnowfall, triggerForest, triggerOcean, triggerGalaxy,
          triggerComet, triggerRainbow, triggerFountain, triggerGiant, triggerSlowMotion, triggerPixelArt
      ];
      const randomEffect = effects[Math.floor(Math.random() * effects.length)];
      randomEffect();
  };

  const triggerRainConfetti = () => {
    const duration = 1000;
    const end = Date.now() + duration;
    (function frame() {
      safeConfetti({
        particleCount: 6, angle: 270, spread: 10, origin: { x: Math.random(), y: -0.2 }, 
        colors: ['#64748b', '#94a3b8', '#475569'], shapes: ['circle'], 
        gravity: 3.5, scalar: 0.6, drift: 0, ticks: 400
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  // Helper to calculate transaction, update local state, and return data for cloud sync
  const handleTransaction = (amount: number, description: string, dateContext?: Date) => {
    // 1. Calculate New State Values
    const newBalance = balance + amount;
    let newLifetime = lifetimeEarnings;
    
    // Logic: Only add to lifetime earnings if it's a positive gain (not a refund/undo)
    if (amount > 0 && !description.includes('退回') && !description.includes('撤销')) {
        newLifetime += amount;
    }
    // Logic: If undoing a completed task (which gave +stars), we should subtract from lifetime if possible, 
    // but usually lifetime tracks "total ever earned". 
    // If we want strict "Total Valid Earned", we should subtract. 
    // Previous logic only added. Let's make it consistent: if we subtract stars because of undo, we reduce lifetime.
    if (amount < 0 && description.includes('撤销') && description.includes('完成')) {
        newLifetime = Math.max(0, newLifetime + amount); // amount is negative
    }

    // 2. Create Transaction Object
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
      type: amount > 0 ? 'EARN' : amount < 0 && (description.includes('兑换') || description.includes('购买') || description.includes('存入') || description.includes('盲盒')) ? 'SPEND' : 'PENALTY'
    };

    // 3. Update Local State
    setBalance(newBalance);
    setLifetimeEarnings(newLifetime);
    setTransactions(prev => [newTx, ...prev]);

    return { newBalance, newLifetime, newTx };
  };

  // --- Actions ---
  const toggleTask = (task: Task) => {
    const dateKey = getDateKey(currentDate);
    const currentLog = logs[dateKey] || [];
    const isCompleted = currentLog.includes(task.id);

    let newLog;
    let action: 'add' | 'remove';
    let txData;

    if (isCompleted) {
      // Undo
      action = 'remove';
      newLog = currentLog.filter(id => id !== task.id);
      txData = handleTransaction(-task.stars, `撤销: ${task.title}`, currentDate);
    } else {
      // Complete
      action = 'add';
      setIsInteractionBlocked(true);
      newLog = [...currentLog, task.id];
      
      const isPenalty = task.category === TaskCategory.PENALTY;
      const prefix = isPenalty ? '扣分' : '完成';
      txData = handleTransaction(task.stars, `${prefix}: ${task.title}`, currentDate);
      
      if (isPenalty) {
        setShowCelebration({ show: true, points: task.stars, type: 'penalty' });
        triggerRainConfetti();
        playRandomSound('penalty');
      } else {
        setShowCelebration({ show: true, points: task.stars, type: 'success' });
        triggerRandomCelebration();
        playRandomSound('success');
      }
    }
    
    // Update Local Logs
    setLogs({ ...logs, [dateKey]: newLog });

    // Sync Granular Log Action
    if (familyId && isSyncReady) {
        syncData('record_log', {
            dateKey,
            taskId: task.id,
            action,
            transaction: txData.newTx,
            balance: txData.newBalance,
            lifetimeEarnings: txData.newLifetime
        }, true);
    }
  };

  const redeemReward = (reward: Reward) => {
    if (balance >= reward.cost) {
      try {
          const txData = handleTransaction(-reward.cost, `兑换: ${reward.title}`);
          
          if (familyId && isSyncReady) {
              syncData('record_transaction', {
                  transaction: txData.newTx,
                  balance: txData.newBalance,
                  lifetimeEarnings: txData.newLifetime
              }, true);
          }

          safeConfetti({
              particleCount: 100, spread: 70, origin: { y: 0.6 },
              colors: ['#FF7EB3', '#7AFCB0', '#7FD8FE']
          });
          showToast(`成功兑换：${reward.title}`, 'success');
          playRandomSound('success');
      } catch (error) {
          console.error("Redeem error", error);
      }
    } else {
      showToast(`星星不够哦！还需要 ${reward.cost - balance} 颗星星。`, 'error');
      playRandomSound('penalty');
    }
  };

  const openMysteryBox = () => {
      if (balance < MYSTERY_BOX_COST) {
          showToast('星星不够哦！', 'error');
          return;
      }

      // 1. Deduct Cost
      let txData = handleTransaction(-MYSTERY_BOX_COST, '开启神秘盲盒');
      let finalBalance = txData.newBalance;
      let finalLifetime = txData.newLifetime;
      
      // Sync deduction immediately? Or batch?
      // Better to sync deduction now in case user closes app before reward
      if (familyId && isSyncReady) {
          syncData('record_transaction', {
              transaction: txData.newTx,
              balance: finalBalance,
              lifetimeEarnings: finalLifetime
          }, true);
      }
      
      // 2. Select Reward
      const totalWeight = MYSTERY_BOX_REWARDS.reduce((acc, r) => acc + r.weight, 0);
      let random = Math.random() * totalWeight;
      let selected = MYSTERY_BOX_REWARDS[0];
      
      for (const r of MYSTERY_BOX_REWARDS) {
          if (random < r.weight) {
              selected = r;
              break;
          }
          random -= r.weight;
      }

      // 3. Apply Bonus if any
      if (selected.bonusStars) {
          const bonusTxData = handleTransaction(selected.bonusStars, '盲盒大奖');
          finalBalance = bonusTxData.newBalance;
          finalLifetime = bonusTxData.newLifetime;
          
          if (familyId && isSyncReady) {
             // Small delay to ensure order?
             setTimeout(() => {
                 syncData('record_transaction', {
                    transaction: bonusTxData.newTx,
                    balance: finalBalance,
                    lifetimeEarnings: finalLifetime
                 }, true);
             }, 100);
          }
      }

      setMysteryReward(selected);
  };

  const depositToWishlist = (goal: WishlistGoal, amount: number) => {
      if (balance < amount) {
          showToast('星星不够哦！', 'error');
          playRandomSound('penalty');
          return;
      }
      if (amount <= 0) return;

      const txData = handleTransaction(-amount, `存入心愿: ${goal.title}`);
      
      let updatedGoal = goal;
      const updatedWishlist = wishlist.map(g => {
          if (g.id === goal.id) {
              const newSaved = g.currentSaved + amount;
              updatedGoal = { ...g, currentSaved: newSaved };
              
              const isCompleted = newSaved >= g.targetCost;
              if (isCompleted) {
                   playRandomSound('success');
                   triggerFireworks();
              }
              return updatedGoal;
          }
          return g;
      });
      
      setWishlist(updatedWishlist);
      showToast(`成功存入 ${amount} 颗星星`, 'success');

      if (familyId && isSyncReady) {
          syncData('wishlist_update', {
              goal: updatedGoal,
              transaction: txData.newTx,
              balance: txData.newBalance
          }, true);
      }
  };

  const addWishlistGoal = (goal: WishlistGoal) => {
      setWishlist([...wishlist, goal]);
      if (familyId && isSyncReady) {
          // New goal, no transaction, no balance change
          syncData('wishlist_update', { goal }, true);
      }
  };

  const deleteWishlistGoal = (id: string) => {
      const goal = wishlist.find(g => g.id === id);
      let txData;
      
      if (goal && goal.currentSaved > 0) {
          txData = handleTransaction(goal.currentSaved, `退回心愿存款: ${goal.title}`);
          showToast(`退回了 ${goal.currentSaved} 颗星星`, 'info');
      }
      setWishlist(wishlist.filter(g => g.id !== id));

      if (familyId && isSyncReady) {
          syncData('wishlist_delete', {
              goalId: id,
              transaction: txData?.newTx,
              balance: txData?.newBalance
          }, true);
      }
  };

  const createFamily = () => {
    const newId = cloudService.generateFamilyId();
    setFamilyId(newId);
    setIsSyncReady(true);
    setTimeout(() => manualSaveAll(newId), 100);
    showToast('家庭ID已创建，记得保存哦！', 'success');
  };

  const manualSaveAll = async (fid = familyId) => {
    if (!fid) {
        showToast('请先创建家庭ID', 'error');
        return;
    }
    setSyncStatus('syncing');
    
    try {
        await cloudService.saveData(fid, 'settings', { userName, themeKey });
        await cloudService.saveData(fid, 'tasks', tasks);
        await cloudService.saveData(fid, 'rewards', rewards);
        await cloudService.saveData(fid, 'wishlist', wishlist);
        await cloudService.saveData(fid, 'activity', { logs, balance, transactions, lifetimeEarnings, unlockedAchievements });
        
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
        showToast('所有数据已上传云端', 'success');
    } catch (error) {
        console.error("Manual save failed", error);
        setSyncStatus('error');
        showToast('上传失败，请稍后再试', 'error');
    }
  };

  const handleStartAdventure = async (name: string) => {
    setIsLoading(true);
    const newId = cloudService.generateFamilyId();
    
    setUserName(name);
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

        triggerStarConfetti();
        showToast(`欢迎你，${name}！`, 'success');
        setIsSyncReady(true);
    } catch (error) {
        console.error("Start adventure save failed", error);
        setSyncStatus('error');
        showToast('初始化失败，请重试', 'error');
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

  const resetData = () => {
      localStorage.clear();
      window.location.reload();
  };

  useEffect(() => {
    if (showCelebration.show) {
      setIsInteractionBlocked(true);
      const timer = setTimeout(() => {
        setShowCelebration(prev => ({ ...prev, show: false }));
        setIsInteractionBlocked(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration.show]);

  return {
    state: {
      activeTab, currentDate, userName, themeKey, familyId,
      tasks, rewards, wishlist, logs, balance, transactions,
      lifetimeEarnings, unlockedAchievements, streak,
      syncStatus, isInteractionBlocked, showCelebration, newUnlocked,
      dateKey: getDateKey(currentDate),
      toast,
      isLoading,
      mysteryReward,
      statsConfig,
    },
    actions: {
      setActiveTab, setCurrentDate, setUserName, setThemeKey, setFamilyId,
      setTasks, setRewards, setWishlist,
      toggleTask, redeemReward, depositToWishlist, addWishlistGoal, deleteWishlistGoal,
      openMysteryBox, setMysteryReward,
      createFamily, manualSaveAll, handleCloudLoad, handleStartAdventure, handleJoinFamily, resetData,
      setShowCelebration, setNewUnlocked,
      showToast, hideToast,
      setStatsConfig,
    }
  };
};

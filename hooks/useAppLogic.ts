
import { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { INITIAL_TASKS, INITIAL_REWARDS, ACHIEVEMENTS, MYSTERY_BOX_COST, MYSTERY_BOX_REWARDS } from '../constants';
import { Task, Reward, TaskCategory, Transaction, AppState, AvatarState, AvatarItem, WishlistGoal, Achievement } from '../types';
import { ThemeKey } from '../styles/themes';
import { cloudService, DataScope } from '../services/cloud';
import { ToastType } from '../components/Toast';

export const useAppLogic = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'store' | 'calendar' | 'settings' | 'stats'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // --- State ---
  const [userName, setUserName] = useState(() => localStorage.getItem('app_username') || '');
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => (localStorage.getItem('app_theme') as ThemeKey) || 'lemon');
  const [familyId, setFamilyId] = useState(() => localStorage.getItem('app_family_id') || '');

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('app_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  
  const [rewards, setRewards] = useState<Reward[]>(() => {
    const saved = localStorage.getItem('app_rewards');
    return saved ? JSON.parse(saved) : INITIAL_REWARDS;
  });

  const [wishlist, setWishlist] = useState<WishlistGoal[]>(() => {
    const saved = localStorage.getItem('app_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('app_logs');
    return saved ? JSON.parse(saved) : {};
  });

  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('app_balance');
    return saved ? parseInt(saved) : 0;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('app_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [avatar, setAvatar] = useState<AvatarState>(() => {
      const saved = localStorage.getItem('app_avatar');
      return saved ? JSON.parse(saved) : {
          config: { skinColor: '#FFDFC4', body: 'b_shirt_red' },
          ownedItems: ['b_shirt_red']
      };
  });

  // New Stats State
  const [lifetimeEarnings, setLifetimeEarnings] = useState<number>(() => {
      const saved = localStorage.getItem('app_lifetime');
      return saved ? parseInt(saved) : 0;
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => {
      const saved = localStorage.getItem('app_achievements');
      return saved ? JSON.parse(saved) : [];
  });

  // --- Cloud Sync State ---
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [isSyncReady, setIsSyncReady] = useState(false);
  const [isInteractionBlocked, setIsInteractionBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('app_family_id'));

  // --- Celebration State ---
  const [showCelebration, setShowCelebration] = useState<{show: boolean, points: number, type: 'success' | 'penalty'}>({ 
    show: false, 
    points: 0, 
    type: 'success' 
  });

  // New Achievement Celebration
  const [newUnlocked, setNewUnlocked] = useState<Achievement | null>(null);
  
  // Mystery Box State
  const [mysteryReward, setMysteryReward] = useState<{ title: string, icon: string, bonusStars?: number } | null>(null);

  // --- Toast State ---
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'success',
  });

  // --- Persistence Effects ---
  useEffect(() => localStorage.setItem('app_username', userName), [userName]);
  useEffect(() => localStorage.setItem('app_theme', themeKey), [themeKey]);
  useEffect(() => localStorage.setItem('app_tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('app_rewards', JSON.stringify(rewards)), [rewards]);
  useEffect(() => localStorage.setItem('app_wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem('app_logs', JSON.stringify(logs)), [logs]);
  useEffect(() => localStorage.setItem('app_balance', balance.toString()), [balance]);
  useEffect(() => localStorage.setItem('app_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('app_avatar', JSON.stringify(avatar)), [avatar]);
  useEffect(() => localStorage.setItem('app_family_id', familyId), [familyId]);
  useEffect(() => localStorage.setItem('app_lifetime', lifetimeEarnings.toString()), [lifetimeEarnings]);
  useEffect(() => localStorage.setItem('app_achievements', JSON.stringify(unlockedAchievements)), [unlockedAchievements]);

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
    // Start from yesterday to check history, or today if completed today
    const todayKey = getDateKey(new Date());
    
    // Check today
    if (logs[todayKey] && logs[todayKey].length > 0) {
        currentStreak++;
    }

    // Check backwards
    let d = new Date();
    d.setDate(d.getDate() - 1); // Start with yesterday
    
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

  // Check Achievements Logic
  const checkAchievements = (currentLifetime: number, currentWishlist: WishlistGoal[], currentStreak: number) => {
      const newUnlocks: string[] = [];

      ACHIEVEMENTS.forEach(ach => {
          if (unlockedAchievements.includes(ach.id)) return;

          let unlocked = false;
          if (ach.conditionType === 'lifetime_stars') {
              if (currentLifetime >= ach.threshold) unlocked = true;
          } else if (ach.conditionType === 'streak') {
              if (currentStreak >= ach.threshold) unlocked = true;
          } else if (ach.conditionType === 'category_count') {
              // Count occurrences in logs (expensive, maybe optimize later or only check on task toggle)
              // For now, let's do a rough check or rely on specific action triggers
          } else if (ach.conditionType === 'wishlist_complete') {
             // Handled in deposit
          }
          
          if (unlocked) {
              newUnlocks.push(ach.id);
              setNewUnlocked(ach);
              speak(`恭喜！解锁新勋章：${ach.title}`);
              safeConfetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
          }
      });

      if (newUnlocks.length > 0) {
          setUnlockedAchievements(prev => [...prev, ...newUnlocks]);
      }
  };

  // Watch for Streak Achievements
  useEffect(() => {
      checkAchievements(lifetimeEarnings, wishlist, streak);
  }, [streak, lifetimeEarnings]);


  // Ensure voices are loaded
  useEffect(() => {
    const loadVoices = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.getVoices();
        }
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Text to Speech
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel(); 
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1;
    utterance.pitch = 1.1; 
    
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh'));
    if (zhVoice) {
        utterance.voice = zhVoice;
    }
    
    window.speechSynthesis.speak(utterance);
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

  // --- Cloud Logic ---
  const handleCloudLoad = async (targetFamilyId: string, silent = false, scope = 'all') => {
    if (!targetFamilyId) return;
    if (!silent) setSyncStatus('syncing');

    try {
      const data = await cloudService.loadData(targetFamilyId, scope);
      if (data) {
        setIsSyncReady(false);

        if (data.tasks) setTasks(data.tasks);
        if (data.rewards) setRewards(data.rewards);
        if (data.wishlist) setWishlist(data.wishlist);
        if (data.logs) setLogs(data.logs);
        if (data.balance !== undefined) setBalance(data.balance);
        if (data.transactions) setTransactions(data.transactions);
        if (data.themeKey) setThemeKey(data.themeKey as ThemeKey);
        if (data.userName) setUserName(data.userName);
        if (data.avatar) setAvatar(data.avatar);
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

  const syncData = async (scope: DataScope, data: any, silent = false) => {
    if (!familyId) return;
    if (!silent) setSyncStatus('syncing');
    
    const success = await cloudService.saveData(familyId, scope, data);
    
    if (success) {
        setSyncStatus('saved');
        if (!silent) setTimeout(() => setSyncStatus('idle'), 2000);
    } else {
        setSyncStatus('error');
    }
  };

  // Initialization load
  useEffect(() => {
    if (familyId) {
      handleCloudLoad(familyId, true, 'all').finally(() => {
          setIsLoading(false);
      });
    }
  }, []);

  // Tab refresh
  useEffect(() => {
    if (familyId && isSyncReady) {
        const fetchTab = async () => {
            setIsLoading(true);
            let scope = 'all';
            if (activeTab === 'daily') scope = 'daily';
            if (activeTab === 'store') scope = 'store';
            if (activeTab === 'calendar') scope = 'calendar';
            if (activeTab === 'settings') scope = 'settings';
            if (activeTab === 'stats') scope = 'activity'; // Stats needs logs and lifetime
            
            await handleCloudLoad(familyId, true, scope);
            setIsLoading(false);
        };
        fetchTab();
    }
  }, [activeTab]);

  // Auto-save effects
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
    const t = setTimeout(() => syncData('wishlist', wishlist, true), 500);
    return () => clearTimeout(t);
  }, [wishlist, familyId]);

  // Unified Activity Save (Logs, Balance, Tx, Stats)
  useEffect(() => {
    if (!familyId || !isSyncReady) return;
    const t = setTimeout(() => syncData('activity', { logs, balance, transactions, lifetimeEarnings, unlockedAchievements }, true), 500);
    return () => clearTimeout(t);
  }, [logs, balance, transactions, lifetimeEarnings, unlockedAchievements, familyId]);

  useEffect(() => {
    if (!familyId || !isSyncReady) return;
    const t = setTimeout(() => syncData('settings', { userName, themeKey }, true), 1500);
    return () => clearTimeout(t);
  }, [userName, themeKey, familyId]);

  const triggerStarConfetti = () => {
    const duration = 1200;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 40, spread: 360, ticks: 80, zIndex: 150 };

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 40 * (timeLeft / duration);
      safeConfetti({
        ...defaults, 
        particleCount,
        origin: { x: 0.5, y: 0.5 },
        shapes: ['star'],
        colors: ['#FFD700', '#FFA500', '#FFFF00', '#F0E68C'],
        scalar: 1.2,
        drift: 0,
        gravity: 0.8
      });
    }, 200);
  };

  const triggerRainConfetti = () => {
    const duration = 1000;
    const end = Date.now() + duration;
    (function frame() {
      safeConfetti({
        particleCount: 6,
        angle: 270, spread: 10, origin: { x: Math.random(), y: -0.2 }, 
        colors: ['#64748b', '#94a3b8', '#475569'], shapes: ['circle'], 
        gravity: 3.5, scalar: 0.6, drift: 0, ticks: 400
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const updateBalance = (amount: number, description: string, dateContext?: Date) => {
    setBalance(prev => prev + amount);
    
    if (amount > 0 && !description.includes('退回') && !description.includes('撤销')) {
        setLifetimeEarnings(prev => prev + amount);
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
      type: amount > 0 ? 'EARN' : amount < 0 && (description.includes('兑换') || description.includes('购买') || description.includes('存入') || description.includes('盲盒')) ? 'SPEND' : 'PENALTY'
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  // --- Actions ---
  const toggleTask = (task: Task) => {
    const dateKey = getDateKey(currentDate);
    const currentLog = logs[dateKey] || [];
    const isCompleted = currentLog.includes(task.id);

    let newLog;
    if (isCompleted) {
      // Undo
      newLog = currentLog.filter(id => id !== task.id);
      updateBalance(-task.stars, `撤销: ${task.title}`, currentDate);
      // Undo lifetime change if it was a positive task
      if (task.stars > 0) {
          setLifetimeEarnings(prev => Math.max(0, prev - task.stars));
      }
    } else {
      // Complete
      setIsInteractionBlocked(true);
      newLog = [...currentLog, task.id];
      
      const isPenalty = task.category === TaskCategory.PENALTY;
      const prefix = isPenalty ? '扣分' : '完成';
      updateBalance(task.stars, `${prefix}: ${task.title}`, currentDate);
      
      // Check Category Count Achievements (Simple inline check)
      if (!isPenalty && !unlockedAchievements.includes('HELPER_10') && task.category === TaskCategory.BONUS) {
          let bonusCount = 0;
          Object.values(logs).forEach(dayLog => {
               dayLog.forEach(tid => {
                   const t = tasks.find(tt => tt.id === tid);
                   if (t && t.category === TaskCategory.BONUS) bonusCount++;
               });
          });
          // Add current one
          bonusCount++;
          
          if (bonusCount >= 10) {
              const ach = ACHIEVEMENTS.find(a => a.id === 'HELPER_10');
              if (ach) {
                  setUnlockedAchievements(prev => [...prev, 'HELPER_10']);
                  setNewUnlocked(ach);
                  speak(`恭喜！解锁新勋章：${ach.title}`);
              }
          }
      }

      if (isPenalty) {
        setShowCelebration({ show: true, points: task.stars, type: 'penalty' });
        triggerRainConfetti();
        speak(`哎呀，${task.title}，下次加油哦`);
      } else {
        setShowCelebration({ show: true, points: task.stars, type: 'success' });
        triggerStarConfetti();
        const name = userName || '小朋友';
        speak(`${name}真棒，完成${task.title}`);
      }
    }
    setLogs({ ...logs, [dateKey]: newLog });
  };

  const redeemReward = (reward: Reward) => {
    if (balance >= reward.cost) {
      try {
          updateBalance(-reward.cost, `兑换: ${reward.title}`);
          safeConfetti({
              particleCount: 100, spread: 70, origin: { y: 0.6 },
              colors: ['#FF7EB3', '#7AFCB0', '#7FD8FE']
          });
          showToast(`成功兑换：${reward.title}`, 'success');
          speak(`兑换成功，${reward.title}`);
      } catch (error) {
          console.error("Redeem error", error);
          showToast(`兑换成功：${reward.title}`, 'success');
      }
    } else {
      showToast(`星星不够哦！还需要 ${reward.cost - balance} 颗星星。`, 'error');
      speak('星星不够哦');
    }
  };

  // Mystery Box Logic
  const openMysteryBox = () => {
      if (balance < MYSTERY_BOX_COST) {
          showToast('星星不够哦！', 'error');
          return;
      }

      updateBalance(-MYSTERY_BOX_COST, '开启神秘盲盒');
      
      // Select Reward Weighted
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

      if (selected.bonusStars) {
          updateBalance(selected.bonusStars, '盲盒大奖');
      }

      setMysteryReward(selected);
  };

  // Wishlist Actions
  const depositToWishlist = (goal: WishlistGoal, amount: number) => {
      if (balance < amount) {
          showToast('星星不够哦！', 'error');
          speak('星星不够哦');
          return;
      }
      if (amount <= 0) return;

      updateBalance(-amount, `存入心愿: ${goal.title}`);
      
      const updatedWishlist = wishlist.map(g => {
          if (g.id === goal.id) {
              const newSaved = g.currentSaved + amount;
              const isCompleted = newSaved >= g.targetCost;
              if (isCompleted) {
                   // Goal Reached!
                   speak(`太棒了！心愿 ${g.title} 达成！`);
                   safeConfetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
                   
                   // Check Achievement
                   if (!unlockedAchievements.includes('WISHLIST_1')) {
                        const ach = ACHIEVEMENTS.find(a => a.id === 'WISHLIST_1');
                        if (ach) {
                             setUnlockedAchievements(prev => [...prev, 'WISHLIST_1']);
                             setNewUnlocked(ach);
                        }
                   }
              }
              return { ...g, currentSaved: newSaved };
          }
          return g;
      });
      
      setWishlist(updatedWishlist);
      showToast(`成功存入 ${amount} 颗星星`, 'success');
  };

  const addWishlistGoal = (goal: WishlistGoal) => {
      setWishlist([...wishlist, goal]);
  };

  const deleteWishlistGoal = (id: string) => {
      const goal = wishlist.find(g => g.id === id);
      // Refund logic
      if (goal && goal.currentSaved > 0) {
          updateBalance(goal.currentSaved, `退回心愿存款: ${goal.title}`);
          showToast(`退回了 ${goal.currentSaved} 颗星星`, 'info');
      }
      setWishlist(wishlist.filter(g => g.id !== id));
  };

  // Avatar Actions (Retained logic but UI hidden)
  const buyAvatarItem = (item: AvatarItem) => {
      if (balance < item.cost) {
          showToast('星星不够哦！再做点任务吧。', 'error');
          return;
      }
      if (avatar.ownedItems.includes(item.id)) {
          equipAvatarItem(item);
          return;
      }

      updateBalance(-item.cost, `购买装扮: ${item.name}`);
      
      setAvatar(prev => ({
          ...prev,
          ownedItems: [...prev.ownedItems, item.id],
          config: {
              ...prev.config,
              [item.type]: item.id
          }
      }));
      
      safeConfetti({
          particleCount: 80, spread: 60, origin: { y: 0.5 },
          colors: ['#F472B6', '#3B82F6', '#FCD34D']
      });
      showToast('购买成功！太漂亮了！', 'success');
      speak('新衣服真好看');
  };

  const equipAvatarItem = (item: AvatarItem) => {
    if (avatar.config[item.type] === item.id) {
        if (item.type !== 'body' && item.type !== 'skin') {
             setAvatar(prev => ({
                ...prev,
                config: { ...prev.config, [item.type]: undefined }
            }));
        }
    } else {
        setAvatar(prev => ({
            ...prev,
            config: { ...prev.config, [item.type]: item.id }
        }));
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
      tasks, rewards, wishlist, logs, balance, transactions, avatar,
      lifetimeEarnings, unlockedAchievements, streak,
      syncStatus, isInteractionBlocked, showCelebration, newUnlocked,
      dateKey: getDateKey(currentDate),
      toast,
      isLoading,
      mysteryReward
    },
    actions: {
      setActiveTab, setCurrentDate, setUserName, setThemeKey, setFamilyId,
      setTasks, setRewards, setWishlist,
      toggleTask, redeemReward, depositToWishlist, addWishlistGoal, deleteWishlistGoal,
      openMysteryBox, setMysteryReward,
      buyAvatarItem, equipAvatarItem,
      createFamily, manualSaveAll, handleCloudLoad, handleStartAdventure, handleJoinFamily, resetData,
      setShowCelebration, setNewUnlocked,
      showToast, hideToast,
    }
  };
};

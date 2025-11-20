
import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { INITIAL_TASKS, INITIAL_REWARDS, AVATAR_ITEMS } from '../constants';
import { Task, Reward, TaskCategory, Transaction, AppState, AvatarState, AvatarItem } from '../types';
import { ThemeKey } from '../styles/themes';
import { cloudService, DataScope } from '../services/cloud';
import { ToastType } from '../components/Toast';

export const useAppLogic = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'store' | 'calendar' | 'settings' | 'avatar'>('daily');
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

  // --- Cloud Sync State ---
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [isSyncReady, setIsSyncReady] = useState(false);
  const [isInteractionBlocked, setIsInteractionBlocked] = useState(false);

  // --- Celebration State ---
  const [showCelebration, setShowCelebration] = useState<{show: boolean, points: number, type: 'success' | 'penalty'}>({ 
    show: false, 
    points: 0, 
    type: 'success' 
  });

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
  useEffect(() => localStorage.setItem('app_logs', JSON.stringify(logs)), [logs]);
  useEffect(() => localStorage.setItem('app_balance', balance.toString()), [balance]);
  useEffect(() => localStorage.setItem('app_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('app_avatar', JSON.stringify(avatar)), [avatar]);
  useEffect(() => localStorage.setItem('app_family_id', familyId), [familyId]);

  // --- Helper Logic ---
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
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
        if (data.logs) setLogs(data.logs);
        if (data.balance !== undefined) setBalance(data.balance);
        if (data.transactions) setTransactions(data.transactions);
        if (data.themeKey) setThemeKey(data.themeKey as ThemeKey);
        if (data.userName) setUserName(data.userName);
        if (data.avatar) setAvatar(data.avatar);
        
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
      handleCloudLoad(familyId, true, 'all');
    }
  }, []);

  // Tab refresh
  useEffect(() => {
    if (familyId && isSyncReady && !isInteractionBlocked) {
        let scope = 'all';
        if (activeTab === 'daily') scope = 'daily';
        if (activeTab === 'store') scope = 'store';
        if (activeTab === 'calendar') scope = 'calendar';
        if (activeTab === 'settings') scope = 'settings';
        if (activeTab === 'avatar') scope = 'avatar';
        handleCloudLoad(familyId, true, scope);
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
    const t = setTimeout(() => syncData('activity', { logs, balance, transactions }, true), 500);
    return () => clearTimeout(t);
  }, [logs, balance, transactions, familyId]);

  useEffect(() => {
    if (!familyId || !isSyncReady) return;
    const t = setTimeout(() => syncData('settings', { userName, themeKey }, true), 1500);
    return () => clearTimeout(t);
  }, [userName, themeKey, familyId]);

  useEffect(() => {
    if (!familyId || !isSyncReady) return;
    // Avatar changes often include balance changes, syncing both
    const t = setTimeout(() => syncData('avatar', { avatar, balance }, true), 1000);
    return () => clearTimeout(t);
  }, [avatar, balance, familyId]);

  const getDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
      type: amount > 0 ? 'EARN' : amount < 0 && (description.includes('兑换') || description.includes('购买')) ? 'SPEND' : 'PENALTY'
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
    } else {
      // Complete
      setIsInteractionBlocked(true);
      newLog = [...currentLog, task.id];
      updateBalance(task.stars, `完成: ${task.title}`, currentDate);
      
      if (task.category === TaskCategory.PENALTY) {
        setShowCelebration({ show: true, points: task.stars, type: 'penalty' });
        triggerRainConfetti();
        speak('下次要加油哦');
      } else {
        setShowCelebration({ show: true, points: task.stars, type: 'success' });
        triggerStarConfetti();
        const name = userName ? userName : '小朋友';
        speak(`${name}你太棒了`);
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
      } catch (error) {
          console.error("Redeem error", error);
          showToast(`兑换成功：${reward.title}`, 'success');
      }
    } else {
      showToast(`星星不够哦！还需要 ${reward.cost - balance} 颗星星。`, 'error');
    }
  };

  // Avatar Actions
  const buyAvatarItem = (item: AvatarItem) => {
      if (balance < item.cost) {
          showToast('星星不够哦！再做点任务吧。', 'error');
          return;
      }
      if (avatar.ownedItems.includes(item.id)) {
          // Already owned, equip it
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
  };

  const equipAvatarItem = (item: AvatarItem) => {
    if (avatar.config[item.type] === item.id) {
        // Unequip if already equipped (except body/skin maybe?)
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
        await cloudService.saveData(fid, 'activity', { logs, balance, transactions });
        await cloudService.saveData(fid, 'avatar', { avatar });
        
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
    const newId = cloudService.generateFamilyId();
    setFamilyId(newId);
    setIsSyncReady(true);
    
    setTimeout(async () => {
        try {
            await cloudService.saveData(newId, 'settings', { userName: name, themeKey: 'lemon' });
            await cloudService.saveData(newId, 'tasks', INITIAL_TASKS);
            await cloudService.saveData(newId, 'rewards', INITIAL_REWARDS);
            await cloudService.saveData(newId, 'activity', { logs: {}, balance: 0, transactions: [] });
            triggerStarConfetti();
            showToast(`欢迎你，${name}！`, 'success');
        } catch (error) {
            console.error("Start adventure save failed", error);
            setSyncStatus('error');
        }
    }, 100);
  };

  const handleJoinFamily = async (id: string) => {
      setFamilyId(id);
      setIsSyncReady(false);
      await handleCloudLoad(id, false, 'all');
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
      tasks, rewards, logs, balance, transactions, avatar,
      syncStatus, isInteractionBlocked, showCelebration,
      dateKey: getDateKey(currentDate),
      toast 
    },
    actions: {
      setActiveTab, setCurrentDate, setUserName, setThemeKey, setFamilyId,
      setTasks, setRewards,
      toggleTask, redeemReward,
      buyAvatarItem, equipAvatarItem,
      createFamily, manualSaveAll, handleCloudLoad, handleStartAdventure, handleJoinFamily, resetData,
      setShowCelebration,
      showToast, hideToast,
    }
  };
};

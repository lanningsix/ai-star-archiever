
import React, { useState, useEffect, useRef } from 'react';
import { Star, Settings, Plus, Trash2, CheckCircle2, XCircle, Zap, User, Edit3, Circle, X, Smile, BrainCircuit, Heart, Palette, ShoppingBag, Calendar as CalendarIcon, Cloud, Copy, Download, Upload, RefreshCw, ArrowRight, Link as LinkIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_TASKS, INITIAL_REWARDS, CLOUD_API_URL } from './constants';
import { Task, Reward, TaskCategory, Transaction } from './types';
import { THEMES, ThemeKey } from './styles/themes';
import { Header } from './components/Header';
import { DateNavigator } from './components/DateNavigator';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { NavBar } from './components/NavBar';
import { cloudService, CloudData } from './services/cloud';

// --- Constants for UI ---
const COMMON_EMOJIS = [
  '📺', '🎮', '🍦', '🍬', '🍟', '🍔', 
  '🎡', '🪁', '🧸', '⚽', '🛹', '🎨',
  '📚', '🧩', '🎸', '🚲', '🏊', '🎁',
  '🧹', '🛏️', '🛁', '🦷', '🎒', '⏰',
  '🦄', '🦕', '🚀', '👑', '🌈', '🍩'
];

// Category styling
const CATEGORY_STYLES = {
    [TaskCategory.LIFE]: { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-700', iconBg: 'bg-lime-400', accent: 'text-lime-500' },
    [TaskCategory.BEHAVIOR]: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', iconBg: 'bg-sky-400', accent: 'text-sky-500' },
    [TaskCategory.BONUS]: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-400', accent: 'text-amber-500' },
    [TaskCategory.PENALTY]: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', iconBg: 'bg-rose-400', accent: 'text-rose-500' },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'daily' | 'store' | 'calendar' | 'settings'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State
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

  // Cloud Sync State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [isSyncReady, setIsSyncReady] = useState(false); // IMPORTANT: Prevents auto-save from overwriting cloud data before initial load
  const [isInteractionBlocked, setIsInteractionBlocked] = useState(false); // Blocks UI during critical updates/animations

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  // Only show name modal if no username AND no family ID (checking family ID handles the case where user wiped local storage but wants to login)
  const [isNameModalOpen, setIsNameModalOpen] = useState(!localStorage.getItem('app_family_id') && !localStorage.getItem('app_username'));
  const [onboardingMode, setOnboardingMode] = useState<'create' | 'join'>('create');
  const [joinInputId, setJoinInputId] = useState('');

  // Celebration State
  const [showCelebration, setShowCelebration] = useState<{show: boolean, points: number, type: 'success' | 'penalty'}>({ 
    show: false, 
    points: 0, 
    type: 'success' 
  });
  
  // Form States
  const [newTask, setNewTask] = useState<{title: string, stars: number, category: TaskCategory}>({
    title: '', stars: 2, category: TaskCategory.LIFE
  });
  const [newReward, setNewReward] = useState<{title: string, cost: number, icon: string}>({
    title: '', cost: 50, icon: '🎁'
  });

  // Persistence Effects (Local Storage)
  useEffect(() => localStorage.setItem('app_username', userName), [userName]);
  useEffect(() => localStorage.setItem('app_theme', themeKey), [themeKey]);
  useEffect(() => localStorage.setItem('app_tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('app_rewards', JSON.stringify(rewards)), [rewards]);
  useEffect(() => localStorage.setItem('app_logs', JSON.stringify(logs)), [logs]);
  useEffect(() => localStorage.setItem('app_balance', balance.toString()), [balance]);
  useEffect(() => localStorage.setItem('app_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('app_family_id', familyId), [familyId]);

  // --- CLOUD SYNC LOGIC ---

  // 1. Initialization: If Family ID exists, load data first.
  useEffect(() => {
    if (familyId) {
      // We have an ID from localStorage. Do NOT enable syncReady yet.
      // We must load the cloud data first to avoid overwriting it with local stale data.
      handleCloudLoad(familyId, true);
    }
  }, []); // Run once on mount

  // 2. Auto-Save for Critical Data (Fast Response)
  useEffect(() => {
    if (!familyId || !isSyncReady) return;

    // Fast debounce for critical interactions (completing tasks, spending points)
    // This ensures data is pushed almost immediately after action, preventing sync race conditions on tab switch.
    const timer = setTimeout(() => {
      handleCloudSave(true); // Silent save
    }, 500); 

    return () => clearTimeout(timer);
  }, [tasks, rewards, logs, balance, transactions, themeKey, familyId, isSyncReady]);

  // 3. Auto-Save for User Name (Slow Debounce)
  useEffect(() => {
    if (!familyId || !isSyncReady) return;
    // Slower debounce for typing to avoid spamming requests
    const timer = setTimeout(() => {
        handleCloudSave(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [userName, familyId, isSyncReady]);

  // 4. Tab Switch Refresh: When switching tabs, pull latest data
  useEffect(() => {
    // Only pull if we are not currently blocking interaction (meaning a save/animation might be in progress)
    if (familyId && isSyncReady && !isInteractionBlocked) {
        handleCloudLoad(familyId, true);
    }
  }, [activeTab]);

  const handleCloudSave = async (silent = false) => {
    if (!familyId) return;
    if (!silent) setSyncStatus('syncing');
    
    const data = {
      tasks,
      rewards,
      logs,
      balance,
      transactions,
      themeKey,
      userName
    };

    const success = await cloudService.saveData(familyId, data);
    if (success) {
      setSyncStatus('saved');
      if (!silent) {
        setTimeout(() => setSyncStatus('idle'), 2000);
      }
    } else {
      setSyncStatus('error');
    }
  };

  const handleCloudLoad = async (targetFamilyId: string, silent = false) => {
    if (!targetFamilyId) return;
    if (!silent) setSyncStatus('syncing');

    try {
      const data = await cloudService.loadData(targetFamilyId);
      if (data) {
        // Update all state from cloud
        if (data.tasks) setTasks(data.tasks);
        if (data.rewards) setRewards(data.rewards);
        if (data.logs) setLogs(data.logs);
        if (data.balance !== undefined) setBalance(data.balance);
        if (data.transactions) setTransactions(data.transactions);
        if (data.themeKey) setThemeKey(data.themeKey as ThemeKey);
        if (data.userName) setUserName(data.userName);
        
        setSyncStatus('saved');
        // Important: Data loaded successfully, NOW we can allow auto-saves.
        setIsSyncReady(true);

        if (!silent) {
             confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#A7F3D0', '#6EE7B7', '#34D399']
            });
        }
      } else {
        // ID not found or empty data. 
        if (!silent) alert('未找到该家庭ID的数据，可能是新ID。');
        setIsSyncReady(true);
        setSyncStatus('idle');
      }
    } catch (e) {
      setSyncStatus('error');
      if (!silent) alert('同步失败，请检查网络或 ID。');
    }
  };

  // New User / Onboarding Handlers
  const handleStartAdventure = async () => {
    if (!userName.trim()) return;
    
    const newId = cloudService.generateFamilyId();
    setFamilyId(newId);
    setIsNameModalOpen(false);
    setIsSyncReady(true);
    
    setTimeout(async () => {
        const initialData = {
            tasks: INITIAL_TASKS,
            rewards: INITIAL_REWARDS,
            logs: {},
            balance: 0,
            transactions: [],
            themeKey: 'lemon',
            userName: userName
        };
        await cloudService.saveData(newId, initialData);
        triggerStarConfetti();
    }, 100);
  };

  const handleJoinFamily = async () => {
      if (!joinInputId.trim()) return;
      
      setFamilyId(joinInputId);
      setIsNameModalOpen(false);
      setIsSyncReady(false); // Disable sync until loaded

      await handleCloudLoad(joinInputId, false);
  };

  const handleCreateFamily = () => {
    const newId = cloudService.generateFamilyId();
    setFamilyId(newId);
    setIsSyncReady(true);
    setTimeout(() => handleCloudSave(), 100);
  };

  const copyFamilyId = () => {
    navigator.clipboard.writeText(familyId);
    alert('家庭ID已复制！发送给其他家庭成员即可同步。');
  };

  // Celebration Timer & Interaction Blocker
  useEffect(() => {
    if (showCelebration.show) {
      // Block interaction when celebration starts
      setIsInteractionBlocked(true);
      
      const timer = setTimeout(() => {
        setShowCelebration(prev => ({ ...prev, show: false }));
        // Unblock interaction when celebration ends
        setIsInteractionBlocked(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [showCelebration.show]);

  // Helpers
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
      confetti({
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
      confetti({
        particleCount: 6,
        angle: 270, 
        spread: 10, 
        origin: { x: Math.random(), y: -0.2 }, 
        colors: ['#64748b', '#94a3b8', '#475569'], 
        shapes: ['circle'], 
        gravity: 3.5, 
        scalar: 0.6,
        drift: 0,
        ticks: 400
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
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
      type: amount > 0 ? 'EARN' : amount < 0 && description.includes('兑换') ? 'SPEND' : 'PENALTY'
    };
    setTransactions(prev => [newTx, ...prev]);
  };

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
      // Complete - Start interaction block here
      setIsInteractionBlocked(true);
      
      newLog = [...currentLog, task.id];
      updateBalance(task.stars, `完成: ${task.title}`, currentDate);
      
      if (task.category === TaskCategory.PENALTY) {
        setShowCelebration({ show: true, points: task.stars, type: 'penalty' });
        triggerRainConfetti();
      } else {
        setShowCelebration({ show: true, points: task.stars, type: 'success' });
        triggerStarConfetti();
      }
    }
    setLogs({ ...logs, [dateKey]: newLog });
  };

  const redeemReward = (reward: Reward) => {
    if (balance >= reward.cost) {
      if (window.confirm(`确定要花费 ${reward.cost} 星星兑换 "${reward.title}" 吗？`)) {
        updateBalance(-reward.cost, `兑换: ${reward.title}`);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF7EB3', '#7AFCB0', '#7FD8FE']
        });
      }
    } else {
      alert(`星星不够哦！还需要 ${reward.cost - balance} 颗星星。加油！`);
    }
  };

  // Handlers for Modals
  const handleSaveTask = () => {
    if (!newTask.title.trim()) return alert("请输入任务名称");
    setTasks([...tasks, { 
      id: Date.now().toString(), 
      title: newTask.title, 
      stars: newTask.stars, 
      category: newTask.category 
    }]);
    setIsTaskModalOpen(false);
    setNewTask({ title: '', stars: 2, category: TaskCategory.LIFE }); 
  };

  const handleSaveReward = () => {
    if (!newReward.title.trim()) return alert("请输入奖励名称");
    setRewards([...rewards, {
      id: Date.now().toString(),
      title: newReward.title,
      cost: newReward.cost,
      icon: newReward.icon
    }]);
    setIsRewardModalOpen(false);
    setNewReward({ title: '', cost: 50, icon: '🎁' });
  };

  // Values
  const activeTheme = THEMES[themeKey];
  const dateKey = getDateKey(currentDate);
  const dailyTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return getDateKey(txDate) === dateKey;
  });

  // Updated Calculation Logic for Stats
  let dailyEarned = 0;
  let dailySpent = 0;

  dailyTransactions.forEach(tx => {
      const isSwap = tx.description.includes('兑换');
      const isUndo = tx.description.includes('撤销');
      
      if (isSwap) {
          dailySpent += Math.abs(tx.amount);
      } else if (isUndo) {
          if (tx.amount < 0) {
              // Undoing a positive task (reducing earned)
              dailyEarned -= Math.abs(tx.amount);
          } else {
              // Undoing a negative task (reversing penalty -> reducing spent)
              dailySpent -= tx.amount;
          }
      } else {
          // Normal task or penalty
          if (tx.amount > 0) {
              dailyEarned += tx.amount;
          } else {
              // Penalty counts as spent (negative progress)
              dailySpent += Math.abs(tx.amount);
          }
      }
  });

  // Render Helpers
  const renderTaskList = (category: TaskCategory) => {
    const categoryTasks = tasks.filter(t => t.category === category);
    const completedIds = logs[dateKey] || [];
    const style = CATEGORY_STYLES[category];

    if (categoryTasks.length === 0) return null;

    return (
      <div className="mb-6 animate-slide-up">
        <h3 className={`font-cute text-lg mb-3 px-2 flex items-center ${style.text}`}>
          <span className={`mr-2 p-1.5 rounded-xl ${style.iconBg} text-white shadow-sm transform -rotate-6`}>
            {category === TaskCategory.LIFE && <Smile size={18} />}
            {category === TaskCategory.BEHAVIOR && <BrainCircuit size={18} />}
            {category === TaskCategory.BONUS && <Heart size={18} />}
            {category === TaskCategory.PENALTY && <Zap size={18} />}
          </span>
          {category}
        </h3>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {categoryTasks.map(task => {
              const isDone = completedIds.includes(task.id);
              const isPenalty = task.category === TaskCategory.PENALTY;
              
              return (
                <div 
                  key={task.id}
                  onClick={() => toggleTask(task)}
                  className={`
                    relative overflow-hidden p-3 pl-4 rounded-[1.2rem] border-2 transition-all duration-300 bounce-click cursor-pointer flex justify-between items-center min-h-[70px] group
                    ${isDone 
                      ? (isPenalty ? 'bg-slate-200 border-slate-300 shadow-inner grayscale-[0.8]' : 'bg-lime-100 border-lime-400 shadow-inner opacity-90 scale-[0.98]') 
                      : `${style.bg} ${style.border} shadow-[0_3px_0_0_rgba(0,0,0,0.05)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.05)] hover:-translate-y-0.5 bg-white`}
                  `}
                >
                    <div className="flex items-center gap-4 z-10 flex-1">
                        <div className="w-8 h-8 flex items-center justify-center shrink-0 transition-all duration-300">
                            {isDone ? (
                                isPenalty 
                                    ? <div className="bg-slate-500 rounded-full w-7 h-7 flex items-center justify-center text-white shadow-md animate-pop"><XCircle size={18} strokeWidth={3} /></div>
                                    : <div className="bg-lime-500 rounded-full w-7 h-7 flex items-center justify-center text-white shadow-md animate-pop"><CheckCircle2 size={18} strokeWidth={3} /></div>
                            ) : (
                                <Circle size={28} className="text-slate-300 group-hover:text-slate-400 transition-colors" strokeWidth={1.5} />
                            )}
                        </div>
                        
                        <span className={`font-bold text-lg leading-tight ${isDone ? 'text-slate-400 line-through decoration-2 decoration-slate-300' : 'text-slate-700'}`}>{task.title}</span>
                    </div>
                    <div className={`font-cute text-xl z-10 ml-2 ${isPenalty ? 'text-rose-500' : 'text-amber-400 drop-shadow-sm'}`}>
                        {task.stars > 0 ? `+${task.stars}` : task.stars}
                    </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${activeTheme.bg || 'bg-[#FFF9F0]'} pb-28 transition-colors duration-500`}>
      {/* Interaction Blocker Overlay */}
      {isInteractionBlocked && <div className="fixed inset-0 z-[40] bg-transparent cursor-wait" />}
      
      <CelebrationOverlay isVisible={showCelebration.show} points={showCelebration.points} type={showCelebration.type} />

      <Header balance={balance} userName={userName} themeKey={themeKey} />

      <div className="max-w-5xl mx-auto pt-2 px-4 md:px-6">
        
        {/* --- DAILY VIEW --- */}
        {activeTab === 'daily' && (
          <>
            <DateNavigator date={currentDate} setDate={setCurrentDate} themeKey={themeKey} />
            <div className="pb-6">
                {renderTaskList(TaskCategory.LIFE)}
                {renderTaskList(TaskCategory.BEHAVIOR)}
                {renderTaskList(TaskCategory.BONUS)}
                {renderTaskList(TaskCategory.PENALTY)}
                
                {tasks.length === 0 && (
                    <div className="text-center p-12 text-slate-300 bg-white/50 rounded-[2.5rem] border-4 border-dashed border-slate-200 mt-8">
                        <div className="text-5xl mb-4 opacity-50">🎈</div>
                        <p className="font-cute text-lg">还没有任务哦，去设置里添加一些吧！</p>
                    </div>
                )}
            </div>
          </>
        )}

        {/* --- STORE VIEW --- */}
        {activeTab === 'store' && (
          <div className="py-4 animate-slide-up">
            <h2 className={`text-xl font-cute mb-4 flex items-center ml-2 ${activeTheme.accent}`}>
                <span className={`${activeTheme.light} p-2 rounded-xl mr-3 shadow-sm rotate-3`}><ShoppingBag className={`w-5 h-5 ${activeTheme.accent}`} /></span>
                兑换商城
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {rewards.map(reward => (
                    <div key={reward.id} className={`bg-white rounded-[1.8rem] p-4 flex flex-col items-center shadow-[0_4px_0_0_rgba(0,0,0,0.04)] border-2 border-slate-100 relative overflow-hidden hover:${activeTheme.border} transition-all duration-300 group`}>
                        <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{reward.icon}</div>
                        <h3 className="font-bold text-slate-700 text-center mb-2 text-base h-10 flex items-center justify-center leading-snug">{reward.title}</h3>
                        <button 
                            onClick={() => redeemReward(reward)}
                            className={`
                                w-full py-2 rounded-xl font-cute text-lg text-white flex items-center justify-center gap-2 transition-all bounce-click shadow-md
                                ${balance >= reward.cost 
                                    ? `${activeTheme.button} ${activeTheme.shadow}` 
                                    : 'bg-slate-200 cursor-not-allowed text-slate-400'}
                            `}
                            disabled={balance < reward.cost}
                        >
                            <span>{reward.cost}</span>
                            <Star size={16} fill="currentColor" />
                        </button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* --- CALENDAR/HISTORY VIEW --- */}
        {activeTab === 'calendar' && (
           <div className="py-4 animate-slide-up max-w-3xl mx-auto">
               <h2 className={`text-xl font-cute mb-4 flex items-center ml-2 ${activeTheme.accent}`}>
                   <span className={`${activeTheme.light} p-2 rounded-xl mr-3 shadow-sm -rotate-3`}><CalendarIcon className={`w-5 h-5 ${activeTheme.accent}`} /></span>
                   积分记录
               </h2>
               
               <DateNavigator date={currentDate} setDate={setCurrentDate} themeKey={themeKey} />

               <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-lime-100 p-4 rounded-[1.8rem] border-2 border-lime-200 flex flex-col items-center shadow-sm">
                       <span className="text-lime-700 text-sm font-bold mb-1">今日获得</span>
                       <span className="text-3xl font-cute text-lime-600 drop-shadow-sm">{dailyEarned >= 0 ? '+' : ''}{dailyEarned}</span>
                   </div>
                   <div className="bg-rose-100 p-4 rounded-[1.8rem] border-2 border-rose-200 flex flex-col items-center shadow-sm">
                       <span className="text-rose-600 text-sm font-bold mb-1">今日消费</span>
                       <span className="text-3xl font-cute text-rose-500 drop-shadow-sm">{dailySpent >= 0 ? '-' : '+'}{Math.abs(dailySpent)}</span>
                   </div>
               </div>

               <div className="bg-white rounded-[1.8rem] p-5 shadow-sm border-2 border-slate-100">
                   <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-wider flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> 当日明细
                   </h3>
                   <div className="space-y-3">
                        {dailyTransactions.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-bold text-slate-700 text-base mb-0.5">{tx.description}</p>
                                    <p className="text-xs text-slate-400 font-medium">{new Date(tx.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <span className={`font-cute text-xl ${tx.amount > 0 ? 'text-lime-500' : 'text-rose-500'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </span>
                            </div>
                        ))}
                        {dailyTransactions.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-slate-200 text-5xl mb-2">🍃</p>
                                <p className="text-slate-400 text-sm">静悄悄的，没有记录哦</p>
                            </div>
                        )}
                   </div>
               </div>
           </div>
        )}

        {/* --- SETTINGS VIEW --- */}
        {activeTab === 'settings' && (
            <div className="py-4 pb-20 animate-slide-up">
                <h2 className="text-xl font-cute text-slate-700 mb-4 flex items-center ml-2">
                    <span className="bg-slate-200 p-2 rounded-xl mr-3 shadow-sm"><Settings className="text-slate-600 w-5 h-5" /></span>
                    设置管理
                </h2>

                {/* User Profile */}
                 <div className="bg-white rounded-[1.8rem] p-4 mb-6 shadow-sm border border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`${activeTheme.light} p-2.5 rounded-full`}>
                            <User size={22} className={activeTheme.accent} />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">小朋友名字</div>
                            <div className="text-lg font-cute text-slate-700">{userName || "未设置"}</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setOnboardingMode('create');
                            setIsNameModalOpen(true);
                        }}
                        className="bg-slate-100 p-2.5 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                        <Edit3 size={18} />
                    </button>
                </div>

                {/* Cloud Sync Section */}
                <div className={`bg-white rounded-[1.8rem] p-5 mb-6 shadow-sm border-2 ${familyId ? activeTheme.border : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Cloud className={familyId ? activeTheme.accent : 'text-slate-400'} size={18} />
                            <span className="text-xs text-slate-400 font-bold uppercase">多设备云同步</span>
                        </div>
                        <div className="flex items-center gap-2">
                           {familyId && syncStatus === 'syncing' && <RefreshCw size={14} className="animate-spin text-slate-400"/>}
                           {familyId && syncStatus === 'saved' && <span className="text-[10px] font-bold text-lime-500 bg-lime-50 px-2 py-1 rounded-full">已同步</span>}
                           {familyId && syncStatus === 'error' && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-full">同步失败</span>}
                        </div>
                    </div>

                    {!familyId ? (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-500 mb-2">创建家庭ID以备份数据，或输入现有ID同步其他设备的数据。</p>
                             {CLOUD_API_URL.includes('example') && (
                                 <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 mb-3">
                                     ⚠️ 提示：后端 API 地址未配置，请在代码 constants.ts 中更新 CLOUD_API_URL。
                                 </div>
                             )}
                            <button 
                                onClick={handleCreateFamily}
                                className={`w-full py-3 rounded-xl font-bold text-white shadow-md ${activeTheme.button}`}
                            >
                                创建新的家庭同步ID
                            </button>
                            <div className="flex gap-2">
                                <input 
                                    placeholder="输入已有家庭ID" 
                                    className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-3 outline-none focus:border-slate-300 text-slate-700 font-mono text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            // Handle join directly
                                            setJoinInputId(e.currentTarget.value);
                                            handleJoinFamily();
                                        }
                                    }}
                                    onChange={(e) => setJoinInputId(e.target.value)}
                                    value={joinInputId}
                                />
                                <button 
                                    onClick={handleJoinFamily}
                                    disabled={!joinInputId}
                                    className="bg-slate-100 text-slate-600 px-4 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50"
                                >
                                    加入
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                             <div className="bg-slate-50 rounded-xl p-3 mb-3 flex items-center justify-between border border-slate-100">
                                 <div>
                                     <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">当前家庭 ID</p>
                                     <p className="font-mono font-bold text-slate-700 text-sm tracking-wider">{familyId}</p>
                                 </div>
                                 <button onClick={copyFamilyId} className="p-2 bg-white rounded-lg shadow-sm text-slate-500 hover:text-slate-700">
                                     <Copy size={16} />
                                 </button>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-3">
                                 <button 
                                     onClick={() => handleCloudSave()}
                                     className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold bg-white border-2 hover:bg-slate-50 transition-colors ${activeTheme.border} ${activeTheme.accent}`}
                                 >
                                     <Upload size={16}/> 手动上传
                                 </button>
                                 <button 
                                     onClick={() => handleCloudLoad(familyId)}
                                     className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                                 >
                                     <Download size={16}/> 手动下载
                                 </button>
                             </div>
                             
                             <div className="mt-4 text-center">
                                <button onClick={() => {
                                    if(window.confirm('确定要断开同步吗？本地数据会保留，但停止上传。')) {
                                        setFamilyId('');
                                        setIsSyncReady(false);
                                    }
                                }} className="text-xs text-slate-400 underline hover:text-rose-400">断开连接</button>
                             </div>
                        </div>
                    )}
                </div>

                {/* Theme Selector */}
                <div className="bg-white rounded-[1.8rem] p-5 mb-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Palette className="text-slate-400 w-4 h-4" />
                        <span className="text-xs text-slate-400 font-bold uppercase">选择主题</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(Object.entries(THEMES) as [ThemeKey, typeof THEMES['lemon']][]).map(([key, theme]) => (
                            <button
                                key={key}
                                onClick={() => setThemeKey(key)}
                                className={`
                                    relative p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden
                                    ${themeKey === key ? `border-${theme.accent.split('-')[1]} bg-${theme.light.split('-')[1]}` : 'border-slate-100 hover:border-slate-200'}
                                `}
                            >
                                <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${theme.gradient}`}></div>
                                <span className={`text-xs font-bold ${themeKey === key ? theme.accent : 'text-slate-500'}`}>{theme.name}</span>
                                {themeKey === key && (
                                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${theme.solid}`}></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5 items-start">
                    {/* Task Management */}
                    <div>
                        <div className="flex justify-between items-center mb-2 px-2">
                            <h3 className="font-bold text-slate-600 text-base">任务列表</h3>
                            <button 
                                onClick={() => setIsTaskModalOpen(true)} 
                                className={`text-white ${activeTheme.button} p-2 rounded-xl ${activeTheme.shadow} shadow-md transition-all`}
                            >
                                <Plus size={20}/>
                            </button>
                        </div>
                        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                            {tasks.map(t => (
                                <div key={t.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                    <div>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold mr-2 align-middle ${CATEGORY_STYLES[t.category].bg} ${CATEGORY_STYLES[t.category].text}`}>
                                            {t.category}
                                        </span>
                                        <span className="text-slate-700 font-bold text-sm align-middle">{t.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-cute text-base ${t.stars > 0 ? 'text-amber-400' : 'text-rose-400'}`}>{t.stars > 0 ? '+' : ''}{t.stars}</span>
                                        <button onClick={() => {
                                            if(window.confirm("删除此任务?")) setTasks(tasks.filter(x => x.id !== t.id));
                                        }} className="text-slate-300 hover:text-rose-400 p-1.5"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reward Management */}
                    <div>
                         <div className="flex justify-between items-center mb-2 px-2">
                            <h3 className="font-bold text-slate-600 text-base">奖励列表</h3>
                            <button 
                                onClick={() => setIsRewardModalOpen(true)} 
                                className={`text-white ${activeTheme.button} p-2 rounded-xl ${activeTheme.shadow} shadow-md transition-all`}
                            >
                                <Plus size={20}/>
                            </button>
                        </div>
                        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                            {rewards.map(r => (
                                <div key={r.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-3">{r.icon}</span>
                                        <span className="text-slate-700 font-bold text-sm">{r.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-cute text-base ${activeTheme.accent} flex items-center gap-1`}>{r.cost} <Star size={12} fill="currentColor"/></span>
                                        <button onClick={() => {
                                            if(window.confirm("删除此奖励?")) setRewards(rewards.filter(x => x.id !== r.id));
                                        }} className="text-slate-300 hover:text-rose-400 p-1.5"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Reset */}
                <button 
                    onClick={() => {
                        if(window.confirm("警告：这将清空所有数据！确定吗？")) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                    className="w-full mt-10 p-3 text-rose-400 text-sm font-bold bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-100"
                >
                    重置所有数据 (慎用)
                </button>
            </div>
        )}
      </div>

      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} themeKey={themeKey} />

      {/* --- MODALS --- */}

      {/* Onboarding Modal (Name + Family ID) */}
      {isNameModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
              <div className={`bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-8 text-center animate-pop border-4 ${activeTheme.border} overflow-hidden`}>
                  
                  <div className={`${activeTheme.light} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5`}>
                      {onboardingMode === 'create' ? <User size={40} className={activeTheme.accent} /> : <LinkIcon size={40} className={activeTheme.accent} />}
                  </div>
                  
                  <h2 className="font-cute text-2xl text-slate-800 mb-2">
                      {onboardingMode === 'create' ? '欢迎来到小小星系!' : '同步已有数据'}
                  </h2>
                  
                  {onboardingMode === 'create' ? (
                      <>
                        <p className="text-slate-500 mb-6 text-base">告诉星星你叫什么名字吧？</p>
                        <input 
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="输入你的名字"
                            className={`w-full bg-slate-50 border-2 rounded-xl p-3 text-center text-xl font-bold text-slate-700 outline-none focus:${activeTheme.border} mb-6`}
                        />
                        <button 
                            disabled={!userName.trim()}
                            onClick={handleStartAdventure}
                            className={`w-full py-3 rounded-xl font-cute text-xl text-white shadow-xl transition-transform hover:scale-105 active:scale-95 mb-4 flex items-center justify-center gap-2 ${!userName.trim() ? 'bg-slate-300' : `bg-gradient-to-r ${activeTheme.gradient}`}`}
                        >
                            开始探险！<ArrowRight size={20} />
                        </button>
                        
                        <button 
                            onClick={() => setOnboardingMode('join')}
                            className="text-sm text-slate-400 underline hover:text-slate-600"
                        >
                            我有家庭同步ID
                        </button>
                      </>
                  ) : (
                      <>
                        <p className="text-slate-500 mb-6 text-base">输入家庭ID来同步其他设备</p>
                        <input 
                            value={joinInputId}
                            onChange={(e) => setJoinInputId(e.target.value)}
                            placeholder="例如: x8z2k9..."
                            className={`w-full bg-slate-50 border-2 rounded-xl p-3 text-center text-lg font-mono text-slate-700 outline-none focus:${activeTheme.border} mb-6`}
                        />
                        <button 
                            disabled={!joinInputId.trim()}
                            onClick={handleJoinFamily}
                            className={`w-full py-3 rounded-xl font-cute text-xl text-white shadow-xl transition-transform hover:scale-105 active:scale-95 mb-4 flex items-center justify-center gap-2 ${!joinInputId.trim() ? 'bg-slate-300' : `bg-gradient-to-r ${activeTheme.gradient}`}`}
                        >
                            <Cloud size={20} /> 立即同步
                        </button>
                        
                        <button 
                            onClick={() => setOnboardingMode('create')}
                            className="text-sm text-slate-400 underline hover:text-slate-600"
                        >
                            我是新用户，创建新档案
                        </button>
                      </>
                  )}

              </div>
          </div>
      )}
      
      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in border-4 border-white">
                <div className="p-4 bg-lime-50 flex justify-between items-center">
                    <h3 className="font-cute text-xl text-lime-700">✨ 添加新任务</h3>
                    <button onClick={() => setIsTaskModalOpen(false)} className="bg-white p-1.5 rounded-full text-slate-400 hover:text-slate-600 shadow-sm"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">任务名称</label>
                        <input 
                            autoFocus
                            value={newTask.title}
                            onChange={e => setNewTask({...newTask, title: e.target.value})}
                            className="w-full p-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-lime-300 outline-none transition-all text-lg font-bold text-slate-700 placeholder-slate-300"
                            placeholder="例如：自己收拾书包"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">选择类别</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(TaskCategory).map(cat => {
                                const isActive = newTask.category === cat;
                                const style = CATEGORY_STYLES[cat];
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            let defaultStars = 2;
                                            if(cat === TaskCategory.BONUS) defaultStars = 5;
                                            if(cat === TaskCategory.PENALTY) defaultStars = -5;
                                            setNewTask({...newTask, category: cat, stars: defaultStars});
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                            isActive
                                            ? `${style.bg} ${style.border} ${style.text} shadow-sm scale-105`
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">
                            {newTask.category === TaskCategory.PENALTY ? '扣除星星' : '奖励星星'}
                        </label>
                        <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-4">
                            <input 
                                type="range"
                                min={newTask.category === TaskCategory.PENALTY ? -20 : 1}
                                max={newTask.category === TaskCategory.PENALTY ? -1 : 20}
                                value={newTask.stars}
                                onChange={e => setNewTask({...newTask, stars: parseInt(e.target.value)})}
                                className={`flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-${newTask.category === TaskCategory.PENALTY ? 'rose' : 'amber'}-400`}
                            />
                            <div className={`w-14 h-10 rounded-lg flex items-center justify-center font-cute text-xl bg-white shadow-sm border ${newTask.stars > 0 ? 'text-amber-400 border-amber-100' : 'text-rose-400 border-rose-100'}`}>
                                {newTask.stars > 0 ? '+' : ''}{newTask.stars}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveTask}
                        className="w-full py-3.5 bg-lime-400 hover:bg-lime-500 text-white rounded-xl font-cute text-lg shadow-lg shadow-lime-200 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        保存任务
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Reward Modal */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
             <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in border-4 border-white">
                <div className={`p-4 ${activeTheme.light} flex justify-between items-center`}>
                    <h3 className={`font-cute text-xl ${activeTheme.accent}`}>🎁 添加新奖励</h3>
                    <button onClick={() => setIsRewardModalOpen(false)} className="bg-white p-1.5 rounded-full text-slate-400 hover:text-slate-600 shadow-sm"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">奖励名称</label>
                        <input 
                            autoFocus
                            value={newReward.title}
                            onChange={e => setNewReward({...newReward, title: e.target.value})}
                            className="w-full p-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white outline-none transition-all text-lg font-bold text-slate-700 placeholder-slate-300 focus:border-current"
                            style={{ borderColor: 'transparent' }}
                            placeholder="例如：看30分钟电视"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">选择图标</label>
                        <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border-2 border-slate-100">
                            {COMMON_EMOJIS.map(icon => (
                                <button 
                                    key={icon}
                                    onClick={() => setNewReward({...newReward, icon})}
                                    className={`text-xl p-1.5 rounded-lg hover:bg-white transition-all ${newReward.icon === icon ? `bg-white shadow-md ring-2 ring-offset-1 scale-110` : 'opacity-60 hover:opacity-100'}`}
                                    style={newReward.icon === icon ? { borderColor: 'currentColor' } : {}}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">兑换花费</label>
                        <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-4">
                            <input 
                                type="range"
                                min="10"
                                max="500"
                                step="10"
                                value={newReward.cost}
                                onChange={e => setNewReward({...newReward, cost: parseInt(e.target.value)})}
                                className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                            />
                            <div className="flex items-center justify-center gap-1 w-16 h-10 rounded-lg bg-white shadow-sm border border-slate-100">
                                <span className={`font-cute text-xl ${activeTheme.accent}`}>{newReward.cost}</span>
                                <Star size={14} className={`${activeTheme.accent} fill-current`} />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveReward}
                        className={`w-full py-3.5 ${activeTheme.button} text-white rounded-xl font-cute text-lg shadow-lg ${activeTheme.shadow} transition-transform hover:scale-[1.02] active:scale-[0.98]`}
                    >
                        保存奖励
                    </button>
                </div>
             </div>
        </div>
      )}

    </div>
  );
}

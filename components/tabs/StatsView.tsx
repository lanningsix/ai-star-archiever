


import React, { useState, useMemo } from 'react';
import { BarChart2, PieChart, TrendingUp, Award, Zap, ShoppingBag, ArrowDown, ArrowUp, Lock, Trophy } from 'lucide-react';
import { Task, TaskCategory, Transaction, Achievement } from '../../types';
import { Theme } from '../../styles/themes';
import { CATEGORY_STYLES, ACHIEVEMENTS } from '../../constants';
import { AchievementModal } from '../modals/AchievementModal';

interface StatsViewProps {
  tasks: Task[];
  logs: Record<string, string[]>;
  transactions: Transaction[];
  currentDate: Date;
  theme: Theme;
  unlockedAchievements?: string[];
}

type TimeRange = 'day' | 'week' | 'month';

export const StatsView: React.FC<StatsViewProps> = ({ tasks, logs, transactions, currentDate, theme, unlockedAchievements = [] }) => {
  const [range, setRange] = useState<TimeRange>('week');
  const [viewAchievement, setViewAchievement] = useState<Achievement | null>(null);

  // Helper: Start of Week (Monday)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Process Data
  const stats = useMemo(() => {
    let start = new Date(currentDate);
    let end = new Date(currentDate);
    let labels: string[] = [];
    let dataPoints: { 
        label: string, 
        earned: number, 
        spent: number, 
        penalty: number, 
        startCtx: Date, 
        endCtx: Date 
    }[] = [];

    // 1. Define Time Buckets based on Range
    if (range === 'day') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        for (let i = 0; i < 24; i+=4) {
            const s = new Date(start); s.setHours(i);
            const e = new Date(start); e.setHours(i + 3, 59, 59);
            labels.push(`${i}:00`);
            dataPoints.push({ label: `${i}点`, earned: 0, spent: 0, penalty: 0, startCtx: s, endCtx: e });
        }
    } else if (range === 'week') {
        const weekStart = getStartOfWeek(currentDate);
        start = new Date(weekStart);
        end = new Date(weekStart);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            const dayName = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
            
            const s = new Date(d); s.setHours(0,0,0,0);
            const e = new Date(d); e.setHours(23,59,59,999);
            
            labels.push(dayName);
            dataPoints.push({ label: `周${dayName}`, earned: 0, spent: 0, penalty: 0, startCtx: s, endCtx: e });
        }
    } else if (range === 'month') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 0, 23, 59, 59);
        
        const daysInMonth = end.getDate();
        const bucketSize = Math.ceil(daysInMonth / 10);
        
        for (let i = 1; i <= daysInMonth; i+=bucketSize) {
            const s = new Date(year, month, i);
            const e = new Date(year, month, Math.min(i + bucketSize - 1, daysInMonth), 23, 59, 59);
            
            labels.push(`${i}日`);
            dataPoints.push({ label: `${i}日`, earned: 0, spent: 0, penalty: 0, startCtx: s, endCtx: e });
        }
    }

    // 2. Fill Data from Transactions
    let totalEarned = 0;
    let totalSpent = 0;
    let totalPenalty = 0;
    let categoryCounts: Record<string, number> = {};

    const relevantTx = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= start && txDate <= end;
    });

    relevantTx.forEach(tx => {
        const txDate = new Date(tx.date);
        const bucket = dataPoints.find(dp => txDate >= dp.startCtx && txDate <= dp.endCtx);
        
        const amount = Math.abs(tx.amount);
        const isShop = tx.description.includes('兑换') || tx.description.includes('购买');
        const isUndo = tx.description.includes('撤销');
        
        // Logic to categorize
        if (bucket) {
            if (tx.amount > 0) {
                 // Earned (Positive transaction)
                 if (!isUndo) {
                     bucket.earned += amount;
                     totalEarned += amount;
                 } else {
                     // Undo of a negative transaction (Spend or Penalty)
                     if (isShop) {
                         bucket.spent -= amount;
                         totalSpent -= amount;
                     } else {
                         bucket.penalty -= amount;
                         totalPenalty -= amount;
                     }
                 }
            } else {
                // Negative transaction
                if (isUndo) {
                    // Undo of an Earn
                    bucket.earned -= amount;
                    totalEarned -= amount;
                } else if (isShop) {
                    // Shopping
                    bucket.spent += amount;
                    totalSpent += amount;
                } else {
                    // Penalty task
                    bucket.penalty += amount;
                    totalPenalty += amount;
                }
            }
        }
        
        // Category Counting
        if (tx.amount > 0 && !isUndo) {
             const task = tasks.find(t => tx.description.includes(t.title));
             if (task) {
                 categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
             }
        } else if (tx.amount < 0 && !isUndo && !isShop) {
             // Count penalties
             categoryCounts[TaskCategory.PENALTY] = (categoryCounts[TaskCategory.PENALTY] || 0) + 1;
        }
    });

    // Ensure no negatives in display data
    totalEarned = Math.max(0, totalEarned);
    totalSpent = Math.max(0, totalSpent);
    totalPenalty = Math.max(0, totalPenalty);
    dataPoints.forEach(dp => {
        dp.earned = Math.max(0, dp.earned);
        dp.spent = Math.max(0, dp.spent);
        dp.penalty = Math.max(0, dp.penalty);
    });

    const maxVal = Math.max(...dataPoints.map(d => Math.max(d.earned, d.spent, d.penalty)), 10);

    return { totalEarned, totalSpent, totalPenalty, dataPoints, maxVal, categoryCounts };
  }, [range, currentDate, transactions, tasks]);

  return (
    <div className="py-4 pb-24 animate-slide-up space-y-6">
      
      {/* Detail Modal */}
      <AchievementModal 
          achievement={viewAchievement} 
          onClose={() => setViewAchievement(null)} 
          isLocked={viewAchievement ? !unlockedAchievements.includes(viewAchievement.id) : false}
      />

      <div className="px-4 flex items-center justify-between">
          <h2 className={`text-xl font-cute flex items-center ${theme.accent}`}>
              <span className={`${theme.light} p-2 rounded-xl mr-3 shadow-sm -rotate-3`}><PieChart className={`w-5 h-5 ${theme.accent}`} /></span>
              统计分析
          </h2>
          
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold shadow-inner">
             {(['day', 'week', 'month'] as TimeRange[]).map(r => (
                 <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${range === r ? 'bg-white text-slate-700 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-500'}`}
                 >
                    {r === 'day' ? '今日' : r === 'week' ? '本周' : '本月'}
                 </button>
             ))}
          </div>
      </div>

      {/* Achievement Section */}
      <div className="px-2">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-5 text-white shadow-md relative overflow-hidden">
               {/* Decor */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10 blur-xl"></div>
               
               <h3 className="flex items-center gap-2 font-cute text-lg mb-4 relative z-10">
                   <Trophy size={20} className="text-yellow-300" /> 荣誉勋章墙
               </h3>
               
               <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 relative z-10">
                   {ACHIEVEMENTS.map(ach => {
                       const isUnlocked = unlockedAchievements.includes(ach.id);
                       return (
                           <button 
                                key={ach.id} 
                                onClick={() => setViewAchievement(ach)}
                                className={`
                                    flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-95 hover:scale-105
                                    ${isUnlocked ? 'bg-white/20 backdrop-blur-sm shadow-sm' : 'bg-black/20 opacity-60 grayscale hover:opacity-80'}
                                `}
                           >
                               <div className={`text-2xl mb-1 ${isUnlocked ? 'animate-pop' : ''}`}>
                                   {isUnlocked ? ach.icon : <Lock size={20} className="text-white/30 p-1"/>}
                               </div>
                               <div className="text-[9px] font-bold text-center leading-tight opacity-90 truncate w-full">
                                   {ach.title}
                               </div>
                           </button>
                       );
                   })}
               </div>
               <div className="mt-3 text-right text-xs font-bold text-white/60">
                   已收集 {unlockedAchievements.length} / {ACHIEVEMENTS.length}
               </div>
          </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 px-3">
          <div className="bg-lime-50 p-3 rounded-[1.5rem] border border-lime-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 opacity-10"><ArrowUp size={40} /></div>
              <span className="text-lime-700 text-[10px] font-bold uppercase flex items-center gap-1 z-10"><Award size={12}/> 获得</span>
              <span className="text-2xl font-cute text-lime-600 drop-shadow-sm z-10">{stats.totalEarned}</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-[1.5rem] border border-rose-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 opacity-10"><ArrowDown size={40} /></div>
              <span className="text-rose-700 text-[10px] font-bold uppercase flex items-center gap-1 z-10"><Zap size={12}/> 扣除</span>
              <span className="text-2xl font-cute text-rose-600 drop-shadow-sm z-10">{stats.totalPenalty}</span>
          </div>
          <div className="bg-sky-50 p-3 rounded-[1.5rem] border border-sky-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute -right-2 -bottom-2 opacity-10"><ShoppingBag size={40} /></div>
              <span className="text-sky-700 text-[10px] font-bold uppercase flex items-center gap-1 z-10"><ShoppingBag size={12}/> 消费</span>
              <span className="text-2xl font-cute text-sky-600 drop-shadow-sm z-10">{stats.totalSpent}</span>
          </div>
      </div>

      {/* Multi-Bar Trend Chart */}
      <div className="bg-white rounded-[2rem] p-5 mx-3 shadow-sm border border-slate-100">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-400 text-xs font-bold uppercase flex items-center gap-2">
                <TrendingUp size={14} /> 趋势图表
            </h3>
            <div className="flex gap-2 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-lime-600"><div className="w-2 h-2 rounded-full bg-lime-400"></div>获得</span>
                <span className="flex items-center gap-1 text-rose-600"><div className="w-2 h-2 rounded-full bg-rose-400"></div>扣除</span>
                <span className="flex items-center gap-1 text-sky-600"><div className="w-2 h-2 rounded-full bg-sky-400"></div>消费</span>
            </div>
         </div>
         
         <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 px-1 pt-5">
             {stats.dataPoints.map((dp, idx) => {
                 const hEarn = Math.max(4, (dp.earned / stats.maxVal) * 100);
                 const hPen = Math.max(4, (dp.penalty / stats.maxVal) * 100);
                 const hSpent = Math.max(4, (dp.spent / stats.maxVal) * 100);
                 
                 return (
                     <div key={idx} className="flex-1 flex flex-col justify-end h-full relative min-w-0">
                         <div className="w-full h-full flex items-end justify-center gap-[1px] sm:gap-1 pb-6 border-b border-slate-100">
                             {/* Earned Bar */}
                             <div 
                                style={{ height: dp.earned > 0 ? `${hEarn}%` : '4px' }} 
                                className={`flex-1 min-w-[2px] rounded-t-sm transition-all duration-700 relative flex justify-center ${dp.earned > 0 ? 'bg-lime-400' : 'bg-slate-50'}`}
                             >
                                {dp.earned > 0 && (
                                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-bold text-lime-600 leading-none whitespace-nowrap">{dp.earned}</span>
                                )}
                             </div>
                             
                             {/* Penalty Bar */}
                             <div 
                                style={{ height: dp.penalty > 0 ? `${hPen}%` : '4px' }} 
                                className={`flex-1 min-w-[2px] rounded-t-sm transition-all duration-700 relative flex justify-center ${dp.penalty > 0 ? 'bg-rose-400' : 'bg-slate-50'}`}
                             >
                                {dp.penalty > 0 && (
                                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-bold text-rose-600 leading-none whitespace-nowrap">{dp.penalty}</span>
                                )}
                             </div>

                             {/* Spent Bar */}
                             <div 
                                style={{ height: dp.spent > 0 ? `${hSpent}%` : '4px' }} 
                                className={`flex-1 min-w-[2px] rounded-t-sm transition-all duration-700 relative flex justify-center ${dp.spent > 0 ? 'bg-sky-400' : 'bg-slate-50'}`}
                             >
                                {dp.spent > 0 && (
                                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-bold text-sky-600 leading-none whitespace-nowrap">{dp.spent}</span>
                                )}
                             </div>
                         </div>
                         
                         <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] sm:text-[10px] text-slate-400 font-bold truncate transform origin-bottom px-0.5">
                            {dp.label}
                         </span>
                     </div>
                 );
             })}
         </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-[2rem] p-5 mx-3 shadow-sm border border-slate-100">
          <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
            <BarChart2 size={14} /> 任务完成占比
          </h3>
          <div className="space-y-4">
              {[TaskCategory.LIFE, TaskCategory.BEHAVIOR, TaskCategory.BONUS].map(cat => {
                  const count = stats.categoryCounts[cat] || 0;
                  // Calculate total positive actions for percentage base
                  const totalPositive = Object.entries(stats.categoryCounts).reduce((acc, [k, v]) => {
                      return (k !== TaskCategory.PENALTY) ? acc + (v as number) : acc;
                  }, 0);
                  
                  const percent = totalPositive > 0 ? Math.round((count / totalPositive) * 100) : 0;
                  const style = CATEGORY_STYLES[cat];

                  return (
                      <div key={cat}>
                          <div className="flex justify-between text-sm font-bold mb-1">
                              <span className={`${style.text} flex items-center gap-2`}>
                                  <div className={`w-2 h-2 rounded-full ${style.iconBg}`}></div>
                                  {cat}
                              </span>
                              <span className="text-slate-400">{count}次 ({percent}%)</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${style.bg.replace('50', '400')}`} 
                                style={{ width: `${percent}%` }}
                              ></div>
                          </div>
                      </div>
                  );
              })}
              
              {/* Penalty Row Separate */}
              <div className="pt-2 border-t border-slate-50 mt-2">
                  <div className="flex justify-between text-sm font-bold mb-1">
                        <span className="text-rose-600 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                            {TaskCategory.PENALTY}
                        </span>
                        <span className="text-slate-400">{stats.categoryCounts[TaskCategory.PENALTY] || 0}次</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
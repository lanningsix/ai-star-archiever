
import React, { useState, useMemo } from 'react';
import { BarChart2, PieChart, TrendingUp, Award, Zap, ShoppingBag, ArrowDown, ArrowUp, Lock, Trophy, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, TaskCategory, Transaction, Achievement } from '../../types';
import { Theme } from '../../styles/themes';
import { CATEGORY_STYLES, ACHIEVEMENTS } from '../../constants';

interface StatsViewProps {
  tasks: Task[];
  logs: Record<string, string[]>;
  transactions: Transaction[];
  currentDate: Date;
  theme: Theme;
  unlockedAchievements?: string[];
  onViewAchievement: (ach: Achievement) => void;
  // Stats Config Props
  statsConfig?: {
      type: 'day' | 'week' | 'month' | 'custom';
      date: Date;
      customStart?: Date;
      customEnd?: Date;
  };
  setStatsConfig?: (config: any) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ 
    tasks, logs, transactions, currentDate, theme, unlockedAchievements = [], onViewAchievement,
    statsConfig = { type: 'week', date: new Date() }, setStatsConfig 
}) => {
  
  // Helper to format date string for inputs (Local Time)
  const toDateInputValue = (d: Date) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toMonthInputValue = (d: Date) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const handleTypeChange = (type: 'day' | 'week' | 'month' | 'custom') => {
      if (setStatsConfig) {
          setStatsConfig({ ...statsConfig, type });
      }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (setStatsConfig && e.target.value) {
          const val = e.target.value;
          let newDate = new Date();
          
          if (val.length === 7) { // YYYY-MM
             const [y, m] = val.split('-').map(Number);
             newDate = new Date(y, m - 1, 1);
          } else { // YYYY-MM-DD
             const [y, m, d] = val.split('-').map(Number);
             newDate = new Date(y, m - 1, d);
          }
          setStatsConfig({ ...statsConfig, date: newDate });
      }
  };
  
  const handleCustomDateChange = (field: 'customStart' | 'customEnd', val: string) => {
      if (setStatsConfig && val) {
          const [y, m, d] = val.split('-').map(Number);
          const newDate = new Date(y, m - 1, d);
          setStatsConfig({ ...statsConfig, [field]: newDate });
      }
  };

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
    let start = new Date(statsConfig.date);
    let end = new Date(statsConfig.date);
    
    // Override start/end based on statsConfig type for bucketing logic
    if (statsConfig.type === 'custom' && statsConfig.customStart && statsConfig.customEnd) {
        start = new Date(statsConfig.customStart);
        end = new Date(statsConfig.customEnd);
    } 
    else if (statsConfig.type === 'day') {
        // start/end is that day
    }
    else if (statsConfig.type === 'week') {
        start = getStartOfWeek(statsConfig.date);
        end = new Date(start);
        end.setDate(end.getDate() + 6);
    }
    else if (statsConfig.type === 'month') {
        start.setDate(1);
        end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
    }

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
    if (statsConfig.type === 'day') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        for (let i = 0; i < 24; i+=4) {
            const s = new Date(start); s.setHours(i);
            const e = new Date(start); e.setHours(i + 3, 59, 59);
            labels.push(`${i}:00`);
            dataPoints.push({ label: `${i}点`, earned: 0, spent: 0, penalty: 0, startCtx: s, endCtx: e });
        }
    } else if (statsConfig.type === 'week') {
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);

        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dayName = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
            
            const s = new Date(d); s.setHours(0,0,0,0);
            const e = new Date(d); e.setHours(23,59,59,999);
            
            labels.push(dayName);
            dataPoints.push({ label: `周${dayName}`, earned: 0, spent: 0, penalty: 0, startCtx: s, endCtx: e });
        }
    } else if (statsConfig.type === 'month') {
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        
        const daysInMonth = end.getDate();
        const bucketSize = Math.ceil(daysInMonth / 10); // About 10 buckets
        
        const year = start.getFullYear();
        const month = start.getMonth();

        for (let i = 1; i <= daysInMonth; i+=bucketSize) {
            const s = new Date(year, month, i);
            const e = new Date(year, month, Math.min(i + bucketSize - 1, daysInMonth), 23, 59, 59);
            
            labels.push(`${i}日`);
            dataPoints.push({ label: `${i}日`, earned: 0, spent: 0, penalty: 0, startCtx: s, endCtx: e });
        }
    } else if (statsConfig.type === 'custom') {
         const diffTime = Math.abs(end.getTime() - start.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
         
         if (diffDays <= 14) {
             for (let i = 0; i < diffDays; i++) {
                 const d = new Date(start); d.setDate(start.getDate() + i);
                 const s = new Date(d); s.setHours(0,0,0,0);
                 const e = new Date(d); e.setHours(23,59,59,999);
                 dataPoints.push({ label: `${d.getMonth()+1}/${d.getDate()}`, earned: 0, spent: 0, penalty: 0, startCtx: s, endCtx: e });
             }
         } else {
             dataPoints.push({ label: '合计', earned: 0, spent: 0, penalty: 0, startCtx: start, endCtx: end });
         }
    }

    // 2. Fill Data from Transactions
    let totalEarned = 0;
    let totalSpent = 0;
    let totalPenalty = 0;
    let categoryCounts: Record<string, number> = {};

    // Filter out revoked transactions
    const relevantTx = transactions.filter(tx => {
        if (tx.isRevoked) return false;
        const txDate = new Date(tx.date);
        return txDate >= start && txDate <= end;
    });

    relevantTx.forEach(tx => {
        const txDate = new Date(tx.date);
        const bucket = dataPoints.find(dp => txDate >= dp.startCtx && txDate <= dp.endCtx);
        
        const amount = Math.abs(tx.amount);
        const isShop = tx.description.includes('兑换') || tx.description.includes('购买');
        const isUndo = tx.description.includes('撤销');
        
        if (bucket) {
            if (tx.amount > 0) {
                 if (!isUndo) {
                     bucket.earned += amount;
                     totalEarned += amount;
                 } else {
                     if (isShop) {
                         bucket.spent -= amount;
                         totalSpent -= amount;
                     } else {
                         bucket.penalty -= amount;
                         totalPenalty -= amount;
                     }
                 }
            } else {
                if (isUndo) {
                    bucket.earned -= amount;
                    totalEarned -= amount;
                } else if (isShop) {
                    bucket.spent += amount;
                    totalSpent += amount;
                } else {
                    bucket.penalty += amount;
                    totalPenalty += amount;
                }
            }
        }
        
        if (tx.amount > 0 && !isUndo) {
             const task = tasks.find(t => tx.description.includes(t.title));
             if (task) {
                 categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
             }
        } else if (tx.amount < 0 && !isUndo && !isShop) {
             categoryCounts[TaskCategory.PENALTY] = (categoryCounts[TaskCategory.PENALTY] || 0) + 1;
        }
    });

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
  }, [statsConfig, transactions, tasks]);

  return (
    <div className="py-4 pb-24 animate-slide-up space-y-6">
      
      {/* Header and Controls */}
      <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-cute flex items-center ${theme.accent}`}>
                <span className={`${theme.light} p-2 rounded-xl mr-3 shadow-sm -rotate-3`}><PieChart className={`w-5 h-5 ${theme.accent}`} /></span>
                统计分析
            </h2>
          </div>

          <div className="bg-white rounded-[1.5rem] p-2 shadow-sm border border-slate-100 mb-4">
             {/* Type Selector */}
             <div className="flex gap-1 mb-3 bg-slate-100/50 p-1 rounded-xl">
                 {(['day', 'week', 'month', 'custom'] as const).map(t => (
                     <button
                        key={t}
                        onClick={() => handleTypeChange(t)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${statsConfig.type === t ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-500'}`}
                     >
                        {t === 'day' ? '日报' : t === 'week' ? '周报' : t === 'month' ? '月报' : '自定义'}
                     </button>
                 ))}
             </div>

             {/* Date Picker Area */}
             <div className="flex items-center justify-center gap-3">
                 <Calendar size={18} className="text-slate-400" />
                 
                 {statsConfig.type === 'day' && (
                     <input 
                        type="date"
                        value={toDateInputValue(statsConfig.date)}
                        onChange={handleDateChange}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 font-bold text-sm outline-none focus:border-blue-400"
                     />
                 )}

                 {statsConfig.type === 'week' && (
                     <div className="flex flex-col items-center">
                        <input 
                            type="date"
                            value={toDateInputValue(statsConfig.date)}
                            onChange={handleDateChange}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 font-bold text-sm outline-none focus:border-blue-400"
                        />
                        <div className="text-[10px] text-slate-400 mt-1 font-bold">
                            (选中日期所在周: {getStartOfWeek(statsConfig.date).toLocaleDateString()} 起)
                        </div>
                     </div>
                 )}

                 {statsConfig.type === 'month' && (
                     <input 
                        type="month"
                        value={toMonthInputValue(statsConfig.date)}
                        onChange={handleDateChange}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 font-bold text-sm outline-none focus:border-blue-400"
                     />
                 )}

                 {statsConfig.type === 'custom' && (
                     <div className="flex items-center gap-2">
                         <input 
                            type="date"
                            value={statsConfig.customStart ? toDateInputValue(statsConfig.customStart) : ''}
                            onChange={(e) => handleCustomDateChange('customStart', e.target.value)}
                            className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 font-bold text-xs outline-none focus:border-blue-400"
                         />
                         <span className="text-slate-300">-</span>
                         <input 
                            type="date"
                            value={statsConfig.customEnd ? toDateInputValue(statsConfig.customEnd) : ''}
                            onChange={(e) => handleCustomDateChange('customEnd', e.target.value)}
                            className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 font-bold text-xs outline-none focus:border-blue-400"
                         />
                     </div>
                 )}
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
                                onClick={() => onViewAchievement(ach)}
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

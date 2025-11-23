
import React, { useMemo } from 'react';
import { Circle, CheckCircle2, XCircle, Smile, BrainCircuit, Heart, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { Task, TaskCategory, Transaction } from '../../types';
import { CATEGORY_STYLES } from '../../constants';
import { DateNavigator } from '../DateNavigator';
import { ThemeKey } from '../../styles/themes';

interface DailyViewProps {
  tasks: Task[];
  logs: Record<string, string[]>;
  transactions: Transaction[];
  date: Date;
  setDate: (d: Date) => void;
  onToggleTask: (task: Task) => void;
  themeKey: ThemeKey;
  dateKey: string;
}

export const DailyView: React.FC<DailyViewProps> = ({ tasks, logs, transactions, date, setDate, onToggleTask, themeKey, dateKey }) => {
  
  // Calculate Daily Stats for the mini-header
  const dailyStats = useMemo(() => {
      let earned = 0;
      let spent = 0;
      
      const startOfDay = new Date(date); startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(date); endOfDay.setHours(23,59,59,999);
      
      transactions.forEach(tx => {
          // Skip revoked transactions from calculation
          if (tx.isRevoked) return;

          const txDate = new Date(tx.date);
          if (txDate >= startOfDay && txDate <= endOfDay) {
              const amount = tx.amount;
              const isUndo = tx.description.includes('撤销') || tx.description.includes('退回');
              const absAmount = Math.abs(amount);
              
              if (amount > 0) {
                  // Positive amount (Money in)
                  if (isUndo) {
                      // Reversing a spend/penalty -> Reduce Spent
                      spent -= amount;
                  } else {
                      // Actual Earning
                      earned += amount;
                  }
              } else {
                  // Negative amount (Money out)
                  if (isUndo) {
                      // Reversing an earning -> Reduce Earned (subtract the absolute value)
                      earned -= absAmount;
                  } else {
                      // Actual Spend/Penalty
                      spent += absAmount;
                  }
              }
          }
      });
      return { earned: Math.max(0, earned), spent: Math.max(0, spent) };
  }, [transactions, date]);

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
                  onClick={() => onToggleTask(task)}
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
    <>
        <DateNavigator date={date} setDate={setDate} themeKey={themeKey} />
        
        {/* Daily Quick Summary */}
        <div className="flex justify-center gap-4 mb-6 -mt-2 animate-slide-up">
            <div className="bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/60 shadow-sm flex items-center gap-2">
                <div className="bg-lime-100 p-1 rounded-full"><TrendingUp size={12} className="text-lime-600"/></div>
                <span className="text-xs font-bold text-slate-500 uppercase">今日获得</span>
                <span className="font-cute text-lg text-lime-600">+{dailyStats.earned}</span>
            </div>
            {dailyStats.spent > 0 && (
                <div className="bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/60 shadow-sm flex items-center gap-2">
                    <div className="bg-rose-100 p-1 rounded-full"><TrendingDown size={12} className="text-rose-600"/></div>
                    <span className="text-xs font-bold text-slate-500 uppercase">消耗/扣分</span>
                    <span className="font-cute text-lg text-rose-500">-{dailyStats.spent}</span>
                </div>
            )}
        </div>

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
  );
};

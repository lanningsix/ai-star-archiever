
import React from 'react';
import { Calendar as CalendarIcon, TrendingDown, TrendingUp, ShoppingBag, AlertCircle } from 'lucide-react';
import { Transaction } from '../../types';
import { ThemeKey, THEMES } from '../../styles/themes';
import { DateNavigator } from '../DateNavigator';

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  transactions: Transaction[];
  themeKey: ThemeKey;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ currentDate, setCurrentDate, transactions, themeKey }) => {
  const theme = THEMES[themeKey];

  const getDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const dateKey = getDateKey(currentDate);
  
  const dailyTransactions = transactions
    .filter(tx => {
        const txDate = new Date(tx.date);
        return getDateKey(txDate) === dateKey;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let dailyEarned = 0;
  let dailySpent = 0;
  let dailyPenalty = 0;

  dailyTransactions.forEach(tx => {
      // Skip revoked transactions from calculation
      if (tx.isRevoked) return;

      const isShop = tx.description.includes('兑换') || tx.description.includes('购买');
      const isUndo = tx.description.includes('撤销');
      const absAmount = Math.abs(tx.amount);
      
      if (tx.amount > 0) {
          // Positive Transaction
          if (isUndo) {
              // We are undoing a negative transaction (Penalty or Spend)
              if (tx.description.includes('兑换') || tx.description.includes('购买')) {
                  dailySpent -= absAmount;
              } else {
                  // Assume undoing a penalty task
                  dailyPenalty -= absAmount;
              }
          } else {
              // Normal Earn (Task completed)
              dailyEarned += tx.amount;
          }
      } else {
          // Negative Transaction
          if (isUndo) {
              // Undoing a positive task (removing stars)
              dailyEarned -= absAmount;
          } else if (isShop) {
              // Shopping
              dailySpent += absAmount;
          } else {
              // Penalty
              dailyPenalty += absAmount;
          }
      }
  });

  // Clamp values to 0 just in case of weird undo sequences
  dailyEarned = Math.max(0, dailyEarned);
  dailySpent = Math.max(0, dailySpent);
  dailyPenalty = Math.max(0, dailyPenalty);

  return (
    <div className="py-4 animate-slide-up max-w-3xl mx-auto pb-24">
       <h2 className={`text-xl font-cute mb-4 flex items-center ml-2 ${theme.accent}`}>
           <span className={`${theme.light} p-2 rounded-xl mr-3 shadow-sm -rotate-3`}><CalendarIcon className={`w-5 h-5 ${theme.accent}`} /></span>
           积分记录
       </h2>
       
       <DateNavigator date={currentDate} setDate={setCurrentDate} themeKey={themeKey} />

       {/* Summary Cards */}
       <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 px-1">
           <div className="bg-lime-50 p-3 rounded-[1.5rem] border border-lime-200 flex flex-col items-center shadow-sm">
               <span className="text-lime-700 text-[10px] sm:text-xs font-bold mb-1 flex items-center gap-1"><TrendingUp size={12}/> 今日获得</span>
               <span className="text-2xl sm:text-3xl font-cute text-lime-600 drop-shadow-sm">+{dailyEarned}</span>
           </div>
           
           <div className="bg-sky-50 p-3 rounded-[1.5rem] border border-sky-200 flex flex-col items-center shadow-sm">
               <span className="text-sky-700 text-[10px] sm:text-xs font-bold mb-1 flex items-center gap-1"><ShoppingBag size={12}/> 今日消费</span>
               <span className="text-2xl sm:text-3xl font-cute text-sky-500 drop-shadow-sm">-{dailySpent}</span>
           </div>

           <div className="bg-rose-50 p-3 rounded-[1.5rem] border border-rose-200 flex flex-col items-center shadow-sm">
               <span className="text-rose-700 text-[10px] sm:text-xs font-bold mb-1 flex items-center gap-1"><AlertCircle size={12}/> 今日扣分</span>
               <span className="text-2xl sm:text-3xl font-cute text-rose-500 drop-shadow-sm">-{dailyPenalty}</span>
           </div>
       </div>

       <div className="bg-white rounded-[1.8rem] p-5 shadow-sm border-2 border-slate-100">
           <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-wider flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> 当日明细
           </h3>
           <div className="space-y-2">
                {dailyTransactions.map(tx => {
                    const isShop = tx.description.includes('兑换') || tx.description.includes('购买');
                    const isUndo = tx.description.includes('撤销');
                    // Detect if it's a penalty deduction (not undo, not shop, negative)
                    const isPenalty = tx.amount < 0 && !isUndo && !isShop;
                    
                    let colorClass = 'text-slate-700';
                    let amountClass = 'text-slate-500';
                    let containerClass = 'bg-white border border-slate-100'; // Base style

                    if (tx.isRevoked) {
                        containerClass = 'bg-slate-50 border border-slate-100 opacity-50';
                        amountClass = 'text-slate-400 line-through';
                        colorClass = 'text-slate-500 line-through decoration-slate-300 decoration-2';
                    } else if (isPenalty) {
                        containerClass = 'bg-rose-50 border border-rose-100';
                        amountClass = 'text-rose-500';
                        colorClass = 'text-rose-700';
                    } else if (isShop) {
                        containerClass = 'bg-sky-50 border border-sky-100';
                        amountClass = 'text-sky-500';
                        colorClass = 'text-sky-700';
                    } else if (isUndo) {
                        containerClass = 'bg-slate-50 border border-slate-100 opacity-70';
                        amountClass = 'text-slate-400';
                        colorClass = 'text-slate-500 line-through';
                         // Special case: Undoing a penalty (amount > 0)
                        if (tx.amount > 0 && !tx.description.includes('兑换')) {
                             amountClass = 'text-rose-300';
                             colorClass = 'text-rose-400 line-through';
                        }
                    } else {
                         // Normal Earn
                         containerClass = 'bg-white border border-slate-100 hover:bg-slate-50/50 transition-colors';
                         amountClass = 'text-lime-500';
                         colorClass = 'text-slate-700';
                    }

                    return (
                        <div key={tx.id} className={`flex justify-between items-center p-3 rounded-2xl shadow-sm ${containerClass}`}>
                            <div>
                                <p className={`font-bold text-base mb-0.5 ${colorClass}`}>{tx.description}</p>
                                <p className="text-xs text-slate-400 font-medium">{new Date(tx.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <span className={`font-cute text-xl ${amountClass}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </span>
                        </div>
                    );
                })}
                {dailyTransactions.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-slate-200 text-5xl mb-2">🍃</p>
                        <p className="text-slate-400 text-sm">静悄悄的，没有记录哦</p>
                    </div>
                )}
           </div>
       </div>
    </div>
  );
};

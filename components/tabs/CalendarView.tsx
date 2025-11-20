
import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
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
  
  const dailyTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return getDateKey(txDate) === dateKey;
  });

  let dailyEarned = 0;
  let dailySpent = 0;

  dailyTransactions.forEach(tx => {
      const isSwap = tx.description.includes('兑换');
      const isUndo = tx.description.includes('撤销');
      
      if (isSwap) {
          dailySpent += Math.abs(tx.amount);
      } else if (isUndo) {
          if (tx.amount < 0) {
              dailyEarned -= Math.abs(tx.amount);
          } else {
              dailySpent -= tx.amount;
          }
      } else {
          if (tx.amount > 0) {
              dailyEarned += tx.amount;
          } else {
              dailySpent += Math.abs(tx.amount);
          }
      }
  });

  return (
    <div className="py-4 animate-slide-up max-w-3xl mx-auto">
       <h2 className={`text-xl font-cute mb-4 flex items-center ml-2 ${theme.accent}`}>
           <span className={`${theme.light} p-2 rounded-xl mr-3 shadow-sm -rotate-3`}><CalendarIcon className={`w-5 h-5 ${theme.accent}`} /></span>
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
  );
};

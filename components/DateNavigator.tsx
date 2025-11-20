
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { THEMES, ThemeKey } from '../styles/themes';

interface DateNavigatorProps {
  date: Date;
  setDate: (d: Date) => void;
  themeKey: ThemeKey;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({ date, setDate, themeKey }) => {
  const theme = THEMES[themeKey];
  
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return `${m}月${day}日 星期${week}`;
  };

  const changeDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    setDate(newDate);
  };

  return (
    <div className={`flex items-center justify-between bg-white p-2 rounded-full shadow-sm mx-auto mt-4 mb-4 border-2 ${theme.border} max-w-xs transition-colors duration-500`}>
      <button onClick={() => changeDate(-1)} className={`p-1.5 ${theme.light} rounded-full ${theme.accent} hover:bg-opacity-80 transition-colors`}>
        <ChevronLeft size={20} strokeWidth={3} />
      </button>
      <span className={`font-cute text-lg ${theme.accent}`}>{formatDate(date)}</span>
      <button onClick={() => changeDate(1)} className={`p-1.5 ${theme.light} rounded-full ${theme.accent} hover:bg-opacity-80 transition-colors`}>
        <ChevronRight size={20} strokeWidth={3} />
      </button>
    </div>
  );
};

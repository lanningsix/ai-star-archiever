
import React from 'react';
import { Star, Flame } from 'lucide-react';
import { THEMES, ThemeKey } from '../styles/themes';

interface HeaderProps {
  balance: number;
  userName: string;
  themeKey: ThemeKey;
  streak?: number;
}

export const Header: React.FC<HeaderProps> = ({ balance, userName, themeKey, streak = 0 }) => {
  const theme = THEMES[themeKey];
  return (
    <div className={`bg-gradient-to-b ${theme.gradient} text-white p-4 pt-8 rounded-b-[2.5rem] shadow-xl sticky top-0 z-20 transition-all duration-500`}>
      <div className="flex justify-between items-center max-w-5xl mx-auto px-2">
        <div>
          <h1 className="text-2xl font-cute tracking-wide drop-shadow-sm">
            {userName ? `${userName}的` : '小小'}星系 🦄
          </h1>
          <p className="text-white/90 text-sm font-medium mt-1 flex items-center gap-1">
              今天也要棒棒的！
              {streak > 0 && (
                  <span className="inline-flex items-center bg-orange-500/30 px-2 rounded-full border border-orange-300/50 ml-1">
                      <Flame size={12} className="text-orange-200 fill-orange-400 animate-pulse mr-0.5"/> 
                      <span className="font-bold text-xs">{streak}天</span>
                  </span>
              )}
          </p>
        </div>
        <div className="flex items-center bg-white/25 backdrop-blur-md px-4 py-1.5 rounded-full border-2 border-white/40 shadow-lg transform hover:scale-105 transition-transform">
          <span className="text-3xl font-cute text-yellow-300 drop-shadow-md mr-2">{balance}</span>
          <Star className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
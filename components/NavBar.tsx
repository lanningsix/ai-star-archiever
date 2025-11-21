
import React from 'react';
import { CheckCircle2, ShoppingBag, Calendar as CalendarIcon, Settings } from 'lucide-react';
import { THEMES, ThemeKey } from '../styles/themes';

interface NavBarProps {
  activeTab: 'daily' | 'store' | 'calendar' | 'settings';
  setActiveTab: (tab: 'daily' | 'store' | 'calendar' | 'settings') => void;
  themeKey: ThemeKey;
}

const NavBtn = ({ icon, label, active, onClick, activeClass }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, activeClass: string }) => {
    const bgClass = active ? activeClass.replace('text-', 'bg-').replace('600', '100').replace('500', '100') : '';

    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-14 transition-all duration-300 group ${active ? '-translate-y-1' : 'text-slate-300 hover:text-slate-400'}`}
        >
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${active ? `${bgClass} shadow-sm rotate-3 scale-110` : 'group-hover:bg-slate-50'}`}>
                {React.cloneElement(icon as React.ReactElement<any>, { 
                    size: 24, 
                    strokeWidth: active ? 3 : 2.5,
                    className: active ? activeClass : "currentColor"
                })}
            </div>
            <span className={`text-[10px] font-bold mt-1 transition-opacity duration-300 ${active ? `opacity-100 ${activeClass}` : 'opacity-0'}`}>{label}</span>
        </button>
    );
}

export const NavBar: React.FC<NavBarProps> = ({ activeTab, setActiveTab, themeKey }) => {
  const theme = THEMES[themeKey];
  
  return (
    <nav className="fixed bottom-6 left-4 right-4 z-30">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white max-w-2xl mx-auto px-4 h-20 flex justify-around items-center">
            <NavBtn icon={<CheckCircle2 />} label="打卡" active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} activeClass={theme.accent} />
            <NavBtn icon={<ShoppingBag />} label="商城" active={activeTab === 'store'} onClick={() => setActiveTab('store')} activeClass={theme.accent} />
            <NavBtn icon={<CalendarIcon />} label="记录" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} activeClass={theme.accent} />
            <NavBtn icon={<Settings />} label="设置" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} activeClass="text-slate-500" />
        </div>
    </nav>
  );
};

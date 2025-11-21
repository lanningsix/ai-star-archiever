
import React from 'react';
import { Trophy, X } from 'lucide-react';
import { Achievement } from '../../types';

interface AchievementModalProps {
    achievement: Achievement | null;
    onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onClose }) => {
    if (!achievement) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
            
            <div className="relative bg-white w-80 rounded-[2.5rem] p-8 text-center pointer-events-auto shadow-2xl border-4 border-yellow-300 animate-pop">
                {/* Glow effect behind icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-300/20 rounded-full blur-3xl"></div>

                <div className="relative mb-6">
                    <div className="text-8xl animate-bounce">{achievement.icon}</div>
                    <Trophy className="absolute -bottom-2 -right-2 text-yellow-400 w-12 h-12 drop-shadow-md animate-pulse" fill="currentColor" />
                </div>
                
                <h3 className="text-2xl font-cute text-indigo-600 mb-2">解锁新勋章!</h3>
                <h2 className="text-3xl font-cute text-slate-800 mb-4">{achievement.title}</h2>
                
                <p className="text-slate-500 text-sm font-bold bg-slate-50 py-2 px-4 rounded-xl inline-block mb-6">
                    {achievement.description}
                </p>
                
                <button 
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 transition-transform active:scale-95"
                >
                    太棒了！
                </button>
            </div>
        </div>
    );
};

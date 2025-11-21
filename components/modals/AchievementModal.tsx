
import React from 'react';
import { Trophy, Lock } from 'lucide-react';
import { Achievement } from '../../types';

interface AchievementModalProps {
    achievement: Achievement | null;
    onClose: () => void;
    isLocked?: boolean;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onClose, isLocked = false }) => {
    if (!achievement) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div 
                onClick={(e) => e.stopPropagation()} 
                className={`relative bg-white w-full max-w-xs rounded-[2.5rem] p-8 text-center shadow-2xl border-4 ${isLocked ? 'border-slate-300' : 'border-yellow-300'} animate-pop`}
            >
                {!isLocked && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-300/20 rounded-full blur-3xl"></div>
                )}

                <div className="relative mb-6">
                    <div className={`text-8xl transition-all ${isLocked ? 'grayscale opacity-50 blur-[1px]' : 'animate-bounce'}`}>
                        {achievement.icon}
                    </div>
                    
                    {isLocked ? (
                        <div className="absolute -bottom-2 -right-2 bg-slate-200 p-2 rounded-full">
                            <Lock className="text-slate-500 w-8 h-8" />
                        </div>
                    ) : (
                        <Trophy className="absolute -bottom-2 -right-2 text-yellow-400 w-12 h-12 drop-shadow-md animate-pulse" fill="currentColor" />
                    )}
                </div>
                
                <h3 className={`text-xl font-cute mb-2 ${isLocked ? 'text-slate-500' : 'text-indigo-600'}`}>
                    {isLocked ? '未解锁勋章' : '解锁新勋章!'}
                </h3>
                
                <h2 className={`text-3xl font-cute mb-4 ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                    {achievement.title}
                </h2>
                
                <div className={`text-sm font-bold py-3 px-4 rounded-xl inline-block mb-6 w-full ${isLocked ? 'bg-slate-100 text-slate-500' : 'bg-yellow-50 text-yellow-700'}`}>
                    {isLocked ? (
                        <>
                            <p className="text-xs text-slate-400 uppercase mb-1">获取条件</p>
                            {achievement.description}
                        </>
                    ) : (
                        achievement.description
                    )}
                </div>
                
                <button 
                    onClick={onClose}
                    className={`w-full py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${isLocked ? 'bg-slate-200 text-slate-500' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-200'}`}
                >
                    {isLocked ? '我会加油的！' : '太棒了！'}
                </button>
            </div>
        </div>
    );
};

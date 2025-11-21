import React from 'react';
import ReactDOM from 'react-dom';
import { Trophy, Lock, Star } from 'lucide-react';
import { Achievement } from '../../types';

interface AchievementModalProps {
    achievement: Achievement | null;
    onClose: () => void;
    isLocked?: boolean;
    progress?: { current: number; total: number };
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onClose, isLocked = false, progress }) => {
    if (!achievement) return null;

    // Calculate percentage for progress bar
    const percentage = progress ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-[4px] p-4 h-full w-full animate-fade-in" onClick={onClose}>
            <div 
                onClick={(e) => e.stopPropagation()} 
                className={`
                    relative bg-white w-full max-w-xs rounded-[2.5rem] p-8 text-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] 
                    border-[6px] animate-pop m-auto transform transition-all
                    ${isLocked ? 'border-slate-200' : 'border-yellow-300'}
                `}
            >
                {/* Shine Effect for Unlocked */}
                {!isLocked && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-yellow-200/40 to-orange-200/40 rounded-full blur-3xl pointer-events-none"></div>
                )}

                {/* Close Button */}
                {/* <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500"><X size={24}/></button> */}

                <div className="relative mb-6 inline-block">
                    <div className={`text-8xl transition-all flex justify-center drop-shadow-lg ${isLocked ? 'grayscale opacity-50 blur-[1px]' : 'animate-bounce'}`}>
                        {achievement.icon}
                    </div>
                    
                    {isLocked ? (
                        <div className="absolute -bottom-2 -right-2 bg-slate-200 p-2.5 rounded-full border-4 border-white shadow-sm">
                            <Lock className="text-slate-500 w-6 h-6" />
                        </div>
                    ) : (
                        <div className="absolute -bottom-2 -right-2">
                            <Trophy className="text-yellow-400 w-12 h-12 drop-shadow-md animate-pulse" fill="currentColor" />
                        </div>
                    )}
                </div>
                
                <h3 className={`text-lg font-bold font-cute mb-1 tracking-wider uppercase ${isLocked ? 'text-slate-400' : 'text-yellow-600'}`}>
                    {isLocked ? '未解锁勋章' : '解锁新勋章!'}
                </h3>
                
                <h2 className={`text-3xl font-cute mb-6 leading-tight ${isLocked ? 'text-slate-700' : 'text-slate-800'}`}>
                    {achievement.title}
                </h2>
                
                <div className={`text-sm font-bold py-4 px-5 rounded-2xl mb-6 w-full text-left relative overflow-hidden ${isLocked ? 'bg-slate-50' : 'bg-yellow-50'}`}>
                    {isLocked && <p className="text-[10px] font-black text-slate-300 uppercase mb-1 tracking-widest">解锁条件</p>}
                    <p className={`${isLocked ? 'text-slate-500' : 'text-yellow-800'}`}>{achievement.description}</p>
                </div>

                {/* Progress Bar for Locked Items */}
                {isLocked && progress && (
                    <div className="mb-8">
                        <div className="flex justify-between items-end mb-2 px-1">
                            <span className="text-xs font-bold text-slate-400 uppercase">当前进度</span>
                            <span className="text-sm font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg">
                                {progress.current} <span className="text-slate-300 text-xs font-normal">/</span> {progress.total}
                            </span>
                        </div>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner relative">
                            {/* Striped Background */}
                            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(45deg,rgba(0,0,0,.05) 25%,transparent 25%,transparent 50%,rgba(0,0,0,.05) 50%,rgba(0,0,0,.05) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all duration-1000 shadow-[0_2px_4px_rgba(0,0,0,0.1)]" 
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                        <div className="mt-2 text-right">
                            <span className="text-[10px] font-bold text-slate-300">{percentage}% 完成</span>
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={onClose}
                    className={`
                        w-full py-4 rounded-2xl font-cute text-xl shadow-xl transition-all active:scale-95 hover:translate-y-[-2px]
                        ${isLocked 
                            ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-slate-200' 
                            : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-orange-200'
                        }
                    `}
                >
                    {isLocked ? '我会加油的！💪' : '太棒了！🎉'}
                </button>
            </div>
        </div>
    );

    // Use Portal to render at document body level to avoid z-index/transform issues
    return ReactDOM.createPortal(modalContent, document.body);
};
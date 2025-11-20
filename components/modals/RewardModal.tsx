
import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { Theme } from '../../styles/themes';
import { COMMON_EMOJIS } from '../../constants';
import { ToastType } from '../Toast';

interface RewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reward: { title: string, cost: number, icon: string }) => void;
    theme: Theme;
    onShowToast: (msg: string, type: ToastType) => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({ isOpen, onClose, onSave, theme, onShowToast }) => {
    const [newReward, setNewReward] = useState({ title: '', cost: 50, icon: '🎁' });

    if (!isOpen) return null;

    const handleSave = () => {
        if (!newReward.title.trim()) {
            onShowToast("请先给奖励起个名字吧！🎁", 'error');
            return;
        }
        // Ensure cost is within bounds before saving
        const finalCost = Math.min(500, Math.max(1, newReward.cost || 1));
        onSave({ ...newReward, cost: finalCost });
        onShowToast("奖励添加成功！", 'success');
        setNewReward({ title: '', cost: 50, icon: '🎁' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
             <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in border-4 border-white">
                <div className={`p-4 ${theme.light} flex justify-between items-center`}>
                    <h3 className={`font-cute text-xl ${theme.accent}`}>🎁 添加新奖励</h3>
                    <button onClick={onClose} className="bg-white p-1.5 rounded-full text-slate-400 hover:text-slate-600 shadow-sm"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">奖励名称</label>
                        <input 
                            autoFocus
                            value={newReward.title}
                            onChange={e => setNewReward({...newReward, title: e.target.value})}
                            className="w-full p-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white outline-none transition-all text-lg font-bold text-slate-700 placeholder-slate-300 focus:border-current"
                            style={{ borderColor: 'transparent' }}
                            placeholder="例如：看30分钟电视"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">选择图标</label>
                        <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border-2 border-slate-100">
                            {COMMON_EMOJIS.map(icon => (
                                <button 
                                    key={icon}
                                    onClick={() => setNewReward({...newReward, icon})}
                                    className={`text-xl p-1.5 rounded-lg hover:bg-white transition-all ${newReward.icon === icon ? `bg-white shadow-md ring-2 ring-offset-1 scale-110` : 'opacity-60 hover:opacity-100'}`}
                                    style={newReward.icon === icon ? { borderColor: 'currentColor' } : {}}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">兑换花费 (1-500)</label>
                        <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-4">
                            <input 
                                type="range"
                                min="1"
                                max="500"
                                step="1"
                                value={newReward.cost || 0}
                                onChange={e => setNewReward({...newReward, cost: parseInt(e.target.value)})}
                                className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                            />
                            <div className={`flex items-center justify-center gap-1 w-20 h-10 rounded-lg bg-white shadow-sm border border-slate-100 focus-within:${theme.border} focus-within:ring-2 focus-within:ring-opacity-50 transition-all`}>
                                <input 
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={newReward.cost === 0 ? '' : newReward.cost}
                                    onChange={e => {
                                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                        if (val > 500) {
                                            setNewReward({...newReward, cost: 500});
                                        } else {
                                            setNewReward({...newReward, cost: val});
                                        }
                                    }}
                                    onBlur={() => {
                                        if (newReward.cost < 1) setNewReward({...newReward, cost: 1});
                                    }}
                                    className={`font-cute text-xl ${theme.accent} w-10 text-center outline-none bg-transparent p-0 m-0 [&::-webkit-inner-spin-button]:appearance-none`} 
                                    style={{ MozAppearance: 'textfield' }}
                                />
                                <Star size={14} className={`${theme.accent} fill-current flex-shrink-0`} />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        className={`w-full py-3.5 ${theme.button} text-white rounded-xl font-cute text-lg shadow-lg ${theme.shadow} transition-transform hover:scale-[1.02] active:scale-[0.98]`}
                    >
                        保存奖励
                    </button>
                </div>
             </div>
        </div>
    );
};

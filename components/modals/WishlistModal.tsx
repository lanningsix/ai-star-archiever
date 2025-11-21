
import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { Theme } from '../../styles/themes';
import { COMMON_EMOJIS } from '../../constants';
import { ToastType } from '../Toast';

interface WishlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: { title: string, targetCost: number, icon: string }) => void;
    theme: Theme;
    onShowToast: (msg: string, type: ToastType) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({ isOpen, onClose, onSave, theme, onShowToast }) => {
    const [newGoal, setNewGoal] = useState({ title: '', targetCost: 100, icon: '🏰' });

    if (!isOpen) return null;

    const handleSave = () => {
        if (!newGoal.title.trim()) {
            onShowToast("请给心愿起个名字！✨", 'error');
            return;
        }
        const finalCost = Math.min(2000, Math.max(10, newGoal.targetCost || 10));
        onSave({ ...newGoal, targetCost: finalCost });
        onShowToast("心愿单添加成功！", 'success');
        setNewGoal({ title: '', targetCost: 100, icon: '🏰' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
             <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in border-4 border-white">
                <div className={`p-4 bg-purple-50 flex justify-between items-center`}>
                    <h3 className={`font-cute text-xl text-purple-600`}>✨ 添加新心愿</h3>
                    <button onClick={onClose} className="bg-white p-1.5 rounded-full text-slate-400 hover:text-slate-600 shadow-sm"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">心愿名称</label>
                        <input 
                            autoFocus
                            value={newGoal.title}
                            onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                            className="w-full p-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white outline-none transition-all text-lg font-bold text-slate-700 placeholder-slate-300 focus:border-purple-300"
                            placeholder="例如：乐高城堡"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">选择图标</label>
                        <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border-2 border-slate-100">
                            {COMMON_EMOJIS.map(icon => (
                                <button 
                                    key={icon}
                                    onClick={() => setNewGoal({...newGoal, icon})}
                                    className={`text-xl p-1.5 rounded-lg hover:bg-white transition-all ${newGoal.icon === icon ? `bg-white shadow-md ring-2 ring-purple-200 scale-110` : 'opacity-60 hover:opacity-100'}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">目标星星 (10-2000)</label>
                        <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-4">
                            <input 
                                type="range"
                                min="10"
                                max="1000"
                                step="10"
                                value={newGoal.targetCost || 0}
                                onChange={e => setNewGoal({...newGoal, targetCost: parseInt(e.target.value)})}
                                className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-500"
                            />
                            <div className={`flex items-center justify-center gap-1 w-20 h-10 rounded-lg bg-white shadow-sm border border-slate-100 focus-within:ring-2 focus-within:ring-purple-200 transition-all`}>
                                <input 
                                    type="number"
                                    min="10"
                                    max="2000"
                                    value={newGoal.targetCost === 0 ? '' : newGoal.targetCost}
                                    onChange={e => {
                                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                        setNewGoal({...newGoal, targetCost: val});
                                    }}
                                    className={`font-cute text-xl text-purple-500 w-12 text-center outline-none bg-transparent p-0 m-0 [&::-webkit-inner-spin-button]:appearance-none`} 
                                    style={{ MozAppearance: 'textfield' }}
                                />
                                <Star size={14} className={`text-purple-500 fill-current flex-shrink-0`} />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        className={`w-full py-3.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-cute text-lg shadow-lg shadow-purple-200 transition-transform hover:scale-[1.02] active:scale-[0.98]`}
                    >
                        开始存星星
                    </button>
                </div>
             </div>
        </div>
    );
};
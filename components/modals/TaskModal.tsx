
import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { TaskCategory, Task } from '../../types';
import { CATEGORY_STYLES, TASK_ICONS } from '../../constants';
import { ToastType } from '../Toast';
import { Theme } from '../../styles/themes';

interface TaskModalProps {
    isOpen: boolean;
    initialData?: Task | null;
    onClose: () => void;
    onSave: (task: { title: string, stars: number, category: TaskCategory, icon?: string }) => void;
    onShowToast: (msg: string, type: ToastType) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, initialData, onClose, onSave, onShowToast }) => {
    const [newTask, setNewTask] = useState<{ title: string, stars: number, category: TaskCategory, icon: string }>({ 
        title: '', 
        stars: 2, 
        category: TaskCategory.LIFE,
        icon: '📝'
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setNewTask({
                    title: initialData.title,
                    stars: Math.abs(initialData.stars),
                    category: initialData.category,
                    icon: initialData.icon || '📝'
                });
            } else {
                setNewTask({ title: '', stars: 2, category: TaskCategory.LIFE, icon: '📝' });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!newTask.title.trim()) {
            onShowToast("请先给任务起个名字吧！✨", 'error');
            return;
        }
        
        // Validate bounds
        let finalStars = newTask.stars;
        if (newTask.category === TaskCategory.PENALTY) {
            // Ensure negative
            finalStars = -Math.abs(finalStars);
            // Clamp between -500 and -1
            finalStars = Math.max(-500, Math.min(-1, finalStars));
        } else {
            // Ensure positive
            finalStars = Math.abs(finalStars);
            // Clamp between 1 and 500
            finalStars = Math.min(500, Math.max(1, finalStars));
        }

        onSave({ ...newTask, stars: finalStars });
        // Toast handled by parent for edit vs create distinction
        setNewTask({ title: '', stars: 2, category: TaskCategory.LIFE, icon: '📝' });
    };

    const isPenalty = newTask.category === TaskCategory.PENALTY;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in border-4 border-white max-h-[90vh] overflow-y-auto">
                <div className={`p-4 flex justify-between items-center ${isPenalty ? 'bg-rose-50' : 'bg-lime-50'}`}>
                    <h3 className={`font-cute text-xl ${isPenalty ? 'text-rose-700' : 'text-lime-700'}`}>
                        {initialData ? '📝 编辑任务' : '✨ 添加新任务'}
                    </h3>
                    <button onClick={onClose} className="bg-white p-1.5 rounded-full text-slate-400 hover:text-slate-600 shadow-sm"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">任务名称</label>
                        <input 
                            autoFocus={!initialData}
                            value={newTask.title}
                            onChange={e => setNewTask({...newTask, title: e.target.value})}
                            className={`w-full p-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white outline-none transition-all text-lg font-bold text-slate-700 placeholder-slate-300 ${isPenalty ? 'focus:border-rose-300' : 'focus:border-lime-300'}`}
                            placeholder="例如：自己收拾书包"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">选择图标</label>
                        <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border-2 border-slate-100">
                            {TASK_ICONS.map(icon => (
                                <button 
                                    key={icon}
                                    onClick={() => setNewTask({...newTask, icon})}
                                    className={`text-xl p-1 rounded-lg hover:bg-white transition-all flex items-center justify-center ${newTask.icon === icon ? `bg-white shadow-md ring-2 ring-offset-1 scale-110 ${isPenalty ? 'ring-rose-300' : 'ring-lime-300'}` : 'opacity-60 hover:opacity-100'}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">选择类别</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(TaskCategory).map(cat => {
                                const isActive = newTask.category === cat;
                                const style = CATEGORY_STYLES[cat];
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            let defaultStars = 2;
                                            if(cat === TaskCategory.BONUS) defaultStars = 5;
                                            if(cat === TaskCategory.PENALTY) defaultStars = -5;
                                            setNewTask({...newTask, category: cat, stars: Math.abs(defaultStars)});
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                            isActive
                                            ? `${style.bg} ${style.border} ${style.text} shadow-sm scale-105`
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">
                            {isPenalty ? '扣除星星 (1-500)' : '奖励星星 (1-500)'}
                        </label>
                        <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-4">
                            <input 
                                type="range"
                                min="1"
                                max="500"
                                value={Math.abs(newTask.stars)}
                                onChange={e => setNewTask({...newTask, stars: parseInt(e.target.value)})}
                                className={`flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-${isPenalty ? 'rose' : 'amber'}-400`}
                            />
                            <div className={`flex items-center justify-center gap-1 w-20 h-10 rounded-lg bg-white shadow-sm border border-slate-100 focus-within:ring-2 focus-within:ring-opacity-50 transition-all ${isPenalty ? 'focus-within:ring-rose-400 focus-within:border-rose-300' : 'focus-within:ring-amber-400 focus-within:border-amber-300'}`}>
                                <input 
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={Math.abs(newTask.stars) === 0 ? '' : Math.abs(newTask.stars)}
                                    onChange={e => {
                                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                        const clamped = Math.min(500, Math.max(0, val));
                                        setNewTask({...newTask, stars: clamped});
                                    }}
                                    className={`font-cute text-xl w-10 text-center outline-none bg-transparent p-0 m-0 [&::-webkit-inner-spin-button]:appearance-none ${isPenalty ? 'text-rose-400' : 'text-amber-400'}`} 
                                    style={{ MozAppearance: 'textfield' }}
                                />
                                <Star size={14} className={`flex-shrink-0 ${isPenalty ? 'text-rose-400 fill-rose-400' : 'text-amber-400 fill-amber-400'}`} />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        className={`w-full py-3.5 text-white rounded-xl font-cute text-lg shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] ${isPenalty ? 'bg-rose-400 hover:bg-rose-500 shadow-rose-200' : 'bg-lime-400 hover:bg-lime-500 shadow-lime-200'}`}
                    >
                        {initialData ? '保存修改' : '添加任务'}
                    </button>
                </div>
            </div>
        </div>
    );
};

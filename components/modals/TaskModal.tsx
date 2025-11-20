
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TaskCategory } from '../../types';
import { CATEGORY_STYLES } from '../../constants';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: { title: string, stars: number, category: TaskCategory }) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave }) => {
    const [newTask, setNewTask] = useState({ title: '', stars: 2, category: TaskCategory.LIFE });

    if (!isOpen) return null;

    const handleSave = () => {
        if (!newTask.title.trim()) return alert("请输入任务名称");
        onSave(newTask);
        setNewTask({ title: '', stars: 2, category: TaskCategory.LIFE });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in border-4 border-white">
                <div className="p-4 bg-lime-50 flex justify-between items-center">
                    <h3 className="font-cute text-xl text-lime-700">✨ 添加新任务</h3>
                    <button onClick={onClose} className="bg-white p-1.5 rounded-full text-slate-400 hover:text-slate-600 shadow-sm"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs text-slate-400 font-bold uppercase mb-2 ml-2">任务名称</label>
                        <input 
                            autoFocus
                            value={newTask.title}
                            onChange={e => setNewTask({...newTask, title: e.target.value})}
                            className="w-full p-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-lime-300 outline-none transition-all text-lg font-bold text-slate-700 placeholder-slate-300"
                            placeholder="例如：自己收拾书包"
                        />
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
                                            setNewTask({...newTask, category: cat, stars: defaultStars});
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
                            {newTask.category === TaskCategory.PENALTY ? '扣除星星' : '奖励星星'}
                        </label>
                        <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-4">
                            <input 
                                type="range"
                                min={newTask.category === TaskCategory.PENALTY ? -20 : 1}
                                max={newTask.category === TaskCategory.PENALTY ? -1 : 20}
                                value={newTask.stars}
                                onChange={e => setNewTask({...newTask, stars: parseInt(e.target.value)})}
                                className={`flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-${newTask.category === TaskCategory.PENALTY ? 'rose' : 'amber'}-400`}
                            />
                            <div className={`w-14 h-10 rounded-lg flex items-center justify-center font-cute text-xl bg-white shadow-sm border ${newTask.stars > 0 ? 'text-amber-400 border-amber-100' : 'text-rose-400 border-rose-100'}`}>
                                {newTask.stars > 0 ? '+' : ''}{newTask.stars}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full py-3.5 bg-lime-400 hover:bg-lime-500 text-white rounded-xl font-cute text-lg shadow-lg shadow-lime-200 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        保存任务
                    </button>
                </div>
            </div>
        </div>
    );
};

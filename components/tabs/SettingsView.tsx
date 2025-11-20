
import React, { useState } from 'react';
import { Settings, User, Edit3, Cloud, RefreshCw, Copy, Upload, Download, Palette, Plus, Trash2, Star } from 'lucide-react';
import { Theme, ThemeKey, THEMES } from '../../styles/themes';
import { CATEGORY_STYLES, CLOUD_API_URL } from '../../constants';
import { Task, Reward } from '../../types';
import { ToastType } from '../Toast';

interface SettingsViewProps {
  userName: string;
  familyId: string;
  themeKey: ThemeKey;
  setThemeKey: (key: ThemeKey) => void;
  syncStatus: 'idle' | 'syncing' | 'saved' | 'error';
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  rewards: Reward[];
  setRewards: (rewards: Reward[]) => void;
  
  actions: {
      openNameModal: () => void;
      openTaskModal: () => void;
      openRewardModal: () => void;
      createFamily: () => void;
      joinFamily: (id: string) => void;
      manualSave: () => void;
      manualLoad: (id: string) => void;
      disconnect: () => void;
      reset: () => void;
      showToast: (msg: string, type: ToastType) => void;
  };
  theme: Theme;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
    userName, familyId, themeKey, setThemeKey, syncStatus, tasks, setTasks, rewards, setRewards, actions, theme
}) => {
    const [joinInputId, setJoinInputId] = useState('');

    const copyFamilyId = () => {
        navigator.clipboard.writeText(familyId);
        actions.showToast('家庭ID已复制！', 'success');
    };

    return (
        <div className="py-4 pb-20 animate-slide-up">
            <h2 className="text-xl font-cute text-slate-700 mb-4 flex items-center ml-2">
                <span className="bg-slate-200 p-2 rounded-xl mr-3 shadow-sm"><Settings className="text-slate-600 w-5 h-5" /></span>
                设置管理
            </h2>

            {/* User Profile */}
             <div className="bg-white rounded-[1.8rem] p-4 mb-6 shadow-sm border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`${theme.light} p-2.5 rounded-full`}>
                        <User size={22} className={theme.accent} />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">小朋友名字</div>
                        <div className="text-lg font-cute text-slate-700">{userName || "未设置"}</div>
                    </div>
                </div>
                <button 
                    onClick={actions.openNameModal}
                    className="bg-slate-100 p-2.5 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
                >
                    <Edit3 size={18} />
                </button>
            </div>

            {/* Cloud Sync */}
            <div className={`bg-white rounded-[1.8rem] p-5 mb-6 shadow-sm border-2 ${familyId ? theme.border : 'border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Cloud className={familyId ? theme.accent : 'text-slate-400'} size={18} />
                        <span className="text-xs text-slate-400 font-bold uppercase">多设备云同步</span>
                    </div>
                    <div className="flex items-center gap-2">
                       {familyId && syncStatus === 'syncing' && <RefreshCw size={14} className="animate-spin text-slate-400"/>}
                       {familyId && syncStatus === 'saved' && <span className="text-[10px] font-bold text-lime-500 bg-lime-50 px-2 py-1 rounded-full">已同步</span>}
                       {familyId && syncStatus === 'error' && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-full">同步失败</span>}
                    </div>
                </div>

                {!familyId ? (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-500 mb-2">创建家庭ID以备份数据，或输入现有ID同步其他设备的数据。</p>
                         {CLOUD_API_URL.includes('example') && (
                             <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 mb-3">
                                 ⚠️ 提示：后端 API 地址未配置，请在代码 constants.ts 中更新 CLOUD_API_URL。
                             </div>
                         )}
                        <button 
                            onClick={actions.createFamily}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-md ${theme.button}`}
                        >
                            创建新的家庭同步ID
                        </button>
                        <div className="flex gap-2">
                            <input 
                                placeholder="输入已有家庭ID" 
                                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-3 outline-none focus:border-slate-300 text-slate-700 font-mono text-sm"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setJoinInputId(e.currentTarget.value);
                                        actions.joinFamily(e.currentTarget.value);
                                    }
                                }}
                                onChange={(e) => setJoinInputId(e.target.value)}
                                value={joinInputId}
                            />
                            <button 
                                onClick={() => actions.joinFamily(joinInputId)}
                                disabled={!joinInputId}
                                className="bg-slate-100 text-slate-600 px-4 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50"
                            >
                                加入
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                         <div className="bg-slate-50 rounded-xl p-3 mb-3 flex items-center justify-between border border-slate-100">
                             <div>
                                 <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">当前家庭 ID</p>
                                 <p className="font-mono font-bold text-slate-700 text-sm tracking-wider">{familyId}</p>
                             </div>
                             <button onClick={copyFamilyId} className="p-2 bg-white rounded-lg shadow-sm text-slate-500 hover:text-slate-700">
                                 <Copy size={16} />
                             </button>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-3">
                             <button 
                                 onClick={actions.manualSave}
                                 className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold bg-white border-2 hover:bg-slate-50 transition-colors ${theme.border} ${theme.accent}`}
                             >
                                 <Upload size={16}/> 手动上传
                             </button>
                             <button 
                                 onClick={() => actions.manualLoad(familyId)}
                                 className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                             >
                                 <Download size={16}/> 手动下载
                             </button>
                         </div>
                         
                         <div className="mt-4 text-center">
                            <button onClick={() => {
                                if(window.confirm('确定要断开同步吗？本地数据会保留，但停止上传。')) {
                                    actions.disconnect();
                                }
                            }} className="text-xs text-slate-400 underline hover:text-rose-400">断开连接</button>
                         </div>
                    </div>
                )}
            </div>

            {/* Theme Selection */}
            <div className="bg-white rounded-[1.8rem] p-5 mb-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <Palette className="text-slate-400 w-4 h-4" />
                    <span className="text-xs text-slate-400 font-bold uppercase">选择主题</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(Object.entries(THEMES) as [ThemeKey, typeof THEMES['lemon']][]).map(([key, t]) => (
                        <button
                            key={key}
                            onClick={() => setThemeKey(key)}
                            className={`
                                relative p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden
                                ${themeKey === key ? `border-${t.accent.split('-')[1]} bg-${t.light.split('-')[1]}` : 'border-slate-100 hover:border-slate-200'}
                            `}
                        >
                            <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${t.gradient}`}></div>
                            <span className={`text-xs font-bold ${themeKey === key ? t.accent : 'text-slate-500'}`}>{t.name}</span>
                            {themeKey === key && (
                                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${t.solid}`}></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Management Lists */}
            <div className="grid md:grid-cols-2 gap-5 items-start">
                <div>
                    <div className="flex justify-between items-center mb-2 px-2">
                        <h3 className="font-bold text-slate-600 text-base">任务列表</h3>
                        <button 
                            onClick={actions.openTaskModal} 
                            className={`text-white ${theme.button} p-2 rounded-xl ${theme.shadow} shadow-md transition-all`}
                        >
                            <Plus size={20}/>
                        </button>
                    </div>
                    <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                        {tasks.map(t => (
                            <div key={t.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold mr-2 align-middle ${CATEGORY_STYLES[t.category].bg} ${CATEGORY_STYLES[t.category].text}`}>
                                        {t.category}
                                    </span>
                                    <span className="text-slate-700 font-bold text-sm align-middle">{t.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`font-cute text-base ${t.stars > 0 ? 'text-amber-400' : 'text-rose-400'}`}>{t.stars > 0 ? '+' : ''}{t.stars}</span>
                                    <button onClick={() => {
                                        if(window.confirm("删除此任务?")) setTasks(tasks.filter(x => x.id !== t.id));
                                    }} className="text-slate-300 hover:text-rose-400 p-1.5"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                     <div className="flex justify-between items-center mb-2 px-2">
                        <h3 className="font-bold text-slate-600 text-base">奖励列表</h3>
                        <button 
                            onClick={actions.openRewardModal} 
                            className={`text-white ${theme.button} p-2 rounded-xl ${theme.shadow} shadow-md transition-all`}
                        >
                            <Plus size={20}/>
                        </button>
                    </div>
                    <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                        {rewards.map(r => (
                            <div key={r.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <div className="flex items-center">
                                    <span className="text-2xl mr-3">{r.icon}</span>
                                    <span className="text-slate-700 font-bold text-sm">{r.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`font-cute text-base ${theme.accent} flex items-center gap-1`}>{r.cost} <Star size={12} fill="currentColor"/></span>
                                    <button onClick={() => {
                                        if(window.confirm("删除此奖励?")) setRewards(rewards.filter(x => x.id !== r.id));
                                    }} className="text-slate-300 hover:text-rose-400 p-1.5"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <button 
                onClick={actions.reset}
                className="w-full mt-10 p-3 text-rose-400 text-sm font-bold bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-100"
            >
                重置所有数据 (慎用)
            </button>
        </div>
    );
};

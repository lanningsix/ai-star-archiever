
import React, { useState, useEffect } from 'react';
import { User, Link as LinkIcon, ArrowRight, Cloud, Save } from 'lucide-react';
import { Theme } from '../../styles/themes';

interface OnboardingModalProps {
    isOpen: boolean;
    userName: string;
    onStart: (name: string) => void;
    onJoin: (id: string) => void;
    theme: Theme;
    isEditing?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ 
    isOpen, userName, onStart, onJoin, theme, isEditing = false 
}) => {
    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [joinId, setJoinId] = useState('');
    const [localName, setLocalName] = useState(userName);

    useEffect(() => {
        if (isOpen) {
            setLocalName(userName);
            setMode('create'); // Default to create/edit view
        }
    }, [isOpen, userName]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
            <div className={`bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-8 text-center animate-pop border-4 ${theme.border} overflow-hidden`}>
                
                <div className={`${theme.light} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5`}>
                    {mode === 'create' ? <User size={40} className={theme.accent} /> : <LinkIcon size={40} className={theme.accent} />}
                </div>
                
                <h2 className="font-cute text-2xl text-slate-800 mb-2">
                    {isEditing ? '修改昵称' : (mode === 'create' ? '欢迎来到小小星系!' : '同步已有数据')}
                </h2>
                
                {mode === 'create' ? (
                    <>
                    <p className="text-slate-500 mb-6 text-base">
                        {isEditing ? '换个好听的名字吧？' : '告诉星星你叫什么名字吧？'}
                    </p>
                    <input 
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        placeholder="输入你的名字"
                        className={`w-full bg-slate-50 border-2 rounded-xl p-3 text-center text-xl font-bold text-slate-700 outline-none focus:${theme.border} mb-6`}
                    />
                    <button 
                        disabled={!localName.trim()}
                        onClick={() => onStart(localName)}
                        className={`w-full py-3 rounded-xl font-cute text-xl text-white shadow-xl transition-transform hover:scale-105 active:scale-95 mb-4 flex items-center justify-center gap-2 ${!localName.trim() ? 'bg-slate-300' : `bg-gradient-to-r ${theme.gradient}`}`}
                    >
                        {isEditing ? (
                            <>保存修改 <Save size={20} /></>
                        ) : (
                            <>开始探险！<ArrowRight size={20} /></>
                        )}
                    </button>
                    
                    {!isEditing && (
                        <button 
                            onClick={() => setMode('join')}
                            className="text-sm text-slate-400 underline hover:text-slate-600"
                        >
                            我有家庭同步ID
                        </button>
                    )}
                    </>
                ) : (
                    <>
                    <p className="text-slate-500 mb-6 text-base">输入家庭ID来同步其他设备</p>
                    <input 
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        placeholder="例如: x8z2k9..."
                        className={`w-full bg-slate-50 border-2 rounded-xl p-3 text-center text-lg font-mono text-slate-700 outline-none focus:${theme.border} mb-6`}
                    />
                    <button 
                        disabled={!joinId.trim()}
                        onClick={() => onJoin(joinId)}
                        className={`w-full py-3 rounded-xl font-cute text-xl text-white shadow-xl transition-transform hover:scale-105 active:scale-95 mb-4 flex items-center justify-center gap-2 ${!joinId.trim() ? 'bg-slate-300' : `bg-gradient-to-r ${theme.gradient}`}`}
                    >
                        <Cloud size={20} /> 立即同步
                    </button>
                    
                    <button 
                        onClick={() => setMode('create')}
                        className="text-sm text-slate-400 underline hover:text-slate-600"
                    >
                        我是新用户，创建新档案
                    </button>
                    </>
                )}
            </div>
        </div>
    );
};

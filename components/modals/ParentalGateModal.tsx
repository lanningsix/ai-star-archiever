import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Delete } from 'lucide-react';

interface ParentalGateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ParentalGateModal: React.FC<ParentalGateModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [problem, setProblem] = useState({ q: '', a: 0 });
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (isOpen) {
            generateProblem();
            setInput('');
            setError(false);
        }
    }, [isOpen]);

    const generateProblem = () => {
        const a = Math.floor(Math.random() * 8) + 2; // 2-9
        const b = Math.floor(Math.random() * 8) + 2; // 2-9
        // Randomly choose + or *
        if (Math.random() > 0.5) {
             setProblem({ q: `${a} + ${b} = ?`, a: a + b });
        } else {
             // Make multiplication simple for now
             const smA = Math.floor(Math.random() * 5) + 1;
             const smB = Math.floor(Math.random() * 5) + 1;
             setProblem({ q: `${smA} × ${smB} = ?`, a: smA * smB });
        }
    };

    const handleInput = (num: string) => {
        if (input.length < 2) {
            setInput(prev => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        setInput(prev => prev.slice(0, -1));
    };

    const checkAnswer = () => {
        if (parseInt(input) === problem.a) {
            onSuccess();
        } else {
            setError(true);
            setInput('');
            setTimeout(() => setError(false), 800);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-xs shadow-2xl p-6 border-4 border-slate-200 animate-pop">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <Lock size={24} />
                    </div>
                    <h3 className="font-bold text-slate-700 text-lg mb-1">家长验证</h3>
                    <p className="text-xs text-slate-400">请回答下面的问题进入设置</p>
                </div>

                <div className={`bg-slate-50 rounded-xl p-4 mb-6 text-center border-2 transition-colors ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-100'}`}>
                    <div className="text-2xl font-cute text-slate-700 mb-2">{problem.q}</div>
                    <div className={`h-10 text-3xl font-bold tracking-widest ${error ? 'text-rose-500' : 'text-slate-800'}`}>
                        {input || <span className="opacity-20">_</span>}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleInput(num.toString())}
                            className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xl active:scale-95 transition-transform"
                        >
                            {num}
                        </button>
                    ))}
                    <button onClick={onClose} className="h-12 rounded-xl bg-slate-100 text-slate-400 font-bold text-sm active:scale-95 transition-transform">取消</button>
                    <button onClick={() => handleInput('0')} className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xl active:scale-95 transition-transform">0</button>
                    <button onClick={handleDelete} className="h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center active:scale-95 transition-transform"><Delete size={20}/></button>
                </div>

                <button 
                    onClick={checkAnswer}
                    disabled={!input}
                    className={`w-full py-3 rounded-xl font-bold text-white text-lg shadow-lg transition-all active:scale-95 ${!input ? 'bg-slate-300' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                    验证
                </button>
            </div>
        </div>
    );
};
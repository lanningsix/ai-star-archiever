import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MysteryBoxModalProps {
    isOpen: boolean;
    reward: { title: string, icon: string, bonusStars?: number } | null;
    onClose: () => void;
}

export const MysteryBoxModal: React.FC<MysteryBoxModalProps> = ({ isOpen, reward, onClose }) => {
    const [stage, setStage] = useState<'closed' | 'shaking' | 'opening' | 'revealed'>('closed');

    useEffect(() => {
        if (isOpen) {
            setStage('closed');
            // Start animation sequence
            const t1 = setTimeout(() => setStage('shaking'), 100);
            const t2 = setTimeout(() => setStage('opening'), 1500);
            const t3 = setTimeout(() => {
                setStage('revealed');
                try {
                    // Safe confetti call
                    // @ts-ignore
                    if (typeof confetti === 'function') {
                        confetti({
                            particleCount: 150,
                            spread: 100,
                            origin: { y: 0.6 },
                            colors: ['#FFD700', '#F472B6', '#A78BFA', '#34D399']
                        });
                    } else if (typeof (window as any).confetti === 'function') {
                        (window as any).confetti({
                            particleCount: 150,
                            spread: 100,
                            origin: { y: 0.6 },
                            colors: ['#FFD700', '#F472B6', '#A78BFA', '#34D399']
                        });
                    }
                } catch (e) {
                    console.warn("Confetti skipped");
                }
            }, 2000);
            
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
            };
        }
    }, [isOpen]);

    if (!isOpen || !reward) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-sm flex flex-col items-center">
                
                {/* Close button only appears after reveal */}
                {stage === 'revealed' && (
                     <button 
                        onClick={onClose} 
                        className="absolute -top-12 right-0 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 animate-fade-in"
                     >
                        <X size={24} />
                     </button>
                )}

                {/* Box Container */}
                <div className="relative h-64 w-64 flex items-center justify-center mb-8">
                    
                    {/* Light Rays (Background) */}
                    {(stage === 'opening' || stage === 'revealed') && (
                        <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
                            <div className="absolute inset-0 bg-gradient-to-t from-yellow-300/0 via-yellow-300/40 to-yellow-300/0 w-2 h-full left-1/2 -ml-1 rotate-0"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-yellow-300/0 via-yellow-300/40 to-yellow-300/0 w-2 h-full left-1/2 -ml-1 rotate-45"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-yellow-300/0 via-yellow-300/40 to-yellow-300/0 w-2 h-full left-1/2 -ml-1 rotate-90"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-yellow-300/0 via-yellow-300/40 to-yellow-300/0 w-2 h-full left-1/2 -ml-1 rotate-135"></div>
                        </div>
                    )}

                    {/* The Box */}
                    {stage !== 'revealed' && (
                        <div className={`text-9xl transition-transform duration-100 ${stage === 'shaking' ? 'animate-shake-hard' : stage === 'opening' ? 'scale-125 opacity-0 transition-opacity duration-500' : ''}`}>
                            🎁
                        </div>
                    )}

                    {/* The Reward */}
                    {stage === 'revealed' && (
                        <div className="animate-pop relative">
                             <div className="text-9xl drop-shadow-2xl filter">{reward.icon}</div>
                             <Sparkles className="absolute -top-4 -right-4 text-yellow-300 animate-pulse w-12 h-12" />
                        </div>
                    )}
                </div>

                {/* Text Area */}
                <div className={`text-center transition-opacity duration-500 ${stage === 'revealed' ? 'opacity-100' : 'opacity-0'}`}>
                    <h3 className="text-white text-xl font-bold mb-2 uppercase tracking-widest text-yellow-300 drop-shadow-md">恭喜获得</h3>
                    <h2 className="text-white text-4xl font-cute mb-4 drop-shadow-lg">{reward.title}</h2>
                    {reward.bonusStars && (
                        <div className="bg-yellow-400/20 text-yellow-200 px-4 py-1 rounded-full font-bold border border-yellow-400/50 inline-block">
                            额外获得 {reward.bonusStars} 星星!
                        </div>
                    )}
                    
                    <button 
                        onClick={onClose}
                        className="mt-8 bg-white text-purple-600 px-8 py-3 rounded-full font-bold text-lg shadow-lg shadow-purple-900/50 hover:bg-purple-50 active:scale-95 transition-all"
                    >
                        收入囊中
                    </button>
                </div>

            </div>
            <style>{`
                @keyframes shake-hard {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                .animate-shake-hard {
                    animation: shake-hard 0.5s infinite;
                }
            `}</style>
        </div>
    );
};
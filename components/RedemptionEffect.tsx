import React from 'react';
import { Sparkles } from 'lucide-react';
import { Reward } from '../types';

interface RedemptionEffectProps {
  reward: Reward | null;
}

export const RedemptionEffect: React.FC<RedemptionEffectProps> = ({ reward }) => {
  if (!reward) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none">
      {/* Dark overlay backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"></div>

      <div className="relative flex flex-col items-center justify-center animate-zoom-in-elastic">
        {/* Burst/Rays Background */}
        <div className="absolute inset-0 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 opacity-30">
             <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-[spin_4s_linear_infinite] absolute top-0 left-0" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }}></div>
             <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-[spin_6s_linear_infinite] absolute top-0 left-0" style={{ clipPath: 'polygon(50% 50%, 100% 100%, 0 100%)' }}></div>
             <div className="w-full h-full bg-gradient-to-r from-transparent via-yellow-200 to-transparent animate-[spin_5s_linear_infinite_reverse] absolute top-0 left-0" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }}></div>
        </div>

        {/* Halo Glow */}
        <div className="absolute w-64 h-64 bg-yellow-400/40 rounded-full blur-3xl animate-pulse"></div>

        {/* Main Icon */}
        <div className="relative z-10 text-[10rem] drop-shadow-2xl filter brightness-110 transform hover:scale-110 transition-transform">
          {reward.icon}
          {/* Sparkles around icon */}
          <Sparkles className="absolute -top-4 -right-8 text-yellow-200 w-16 h-16 animate-bounce" />
          <Sparkles className="absolute bottom-4 -left-8 text-white w-10 h-10 animate-pulse" style={{ animationDelay: '0.2s' }} />
        </div>

        {/* Text */}
        <div className="relative z-10 mt-8 text-center">
            <h2 className="text-white text-3xl font-cute tracking-widest drop-shadow-lg mb-2 animate-slide-up">
                兑换成功!
            </h2>
            <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/40 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <span className="text-white font-bold text-xl">{reward.title}</span>
            </div>
        </div>
      </div>
      
      <style>{`
        @keyframes zoomInElastic {
          0% { opacity: 0; transform: scale(0) translateZ(-500px); }
          60% { opacity: 1; transform: scale(1.2) translateZ(0); }
          80% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .animate-zoom-in-elastic {
          animation: zoomInElastic 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};


import React from 'react';
import { Star, CloudLightning, CloudRain } from 'lucide-react';

interface CelebrationOverlayProps {
  isVisible: boolean;
  points: number;
  type: 'success' | 'penalty';
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({ isVisible, points, type }) => {
  if (!isVisible) return null;

  const isPenalty = type === 'penalty';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none">
      {/* Background - Darker and gloomier for penalty */}
      <div 
        className={`absolute inset-0 backdrop-blur-[3px] animate-fade-out ${isPenalty ? 'bg-slate-900/80' : 'bg-black/30'}`} 
        style={{ animationDuration: '1.5s', animationDelay: '0.8s', animationFillMode: 'forwards' }}
      ></div>
      
      {/* Animation Container */}
      <div className={`relative z-10 flex flex-col items-center justify-center ${isPenalty ? 'animate-shake' : 'animate-star-enter'}`}>
        
        {/* Glow/Aura */}
        <div className={`absolute inset-0 rounded-full blur-3xl w-80 h-80 ${isPenalty ? 'bg-slate-600/20' : 'bg-yellow-400/30 animate-pulse'}`}></div>
        
        {/* Main Icon Area */}
        <div className="relative mb-8">
           {isPenalty ? (
             <div className="relative">
                 {/* Main Storm Cloud */}
                 <CloudLightning 
                    size={160} 
                    className="text-slate-400 fill-slate-700 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]" 
                    strokeWidth={1.5} 
                 />
                 {/* Rain Overlay Icon */}
                 <div className="absolute -bottom-4 left-0 right-0 flex justify-center">
                    <CloudRain 
                        size={100} 
                        className="text-blue-300/80 fill-blue-400/20 animate-pulse" 
                        style={{animationDuration: '1s'}} 
                    />
                 </div>
             </div>
           ) : (
             <div className="relative">
                <Star size={160} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-float" strokeWidth={1.5} />
                <Star size={48} className="absolute -top-6 -right-6 text-amber-300 fill-amber-300 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <Star size={36} className="absolute bottom-2 -left-8 text-yellow-200 fill-yellow-200 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <Star size={40} className="absolute -bottom-4 right-0 text-orange-300 fill-orange-300 animate-bounce" style={{ animationDelay: '0.3s' }} />
             </div>
           )}
           
           {/* Points Text */}
           <div className={`absolute ${isPenalty ? '-bottom-12' : 'inset-0 pt-2'} left-0 right-0 flex items-center justify-center`}>
              <span className={`font-cute text-7xl drop-shadow-2xl tracking-tighter ${isPenalty ? 'text-slate-200' : 'text-white'}`}>
                {points > 0 ? `+${points}` : points}
              </span>
           </div>
        </div>

        {/* Text */}
        <div className={`mt-8 font-cute text-5xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-widest stroke-2 ${isPenalty ? 'text-slate-300' : 'text-white animate-pulse'}`}>
          {isPenalty ? '哎呀，要加油...' : '太棒了!'}
        </div>
      </div>
    </div>
  );
};

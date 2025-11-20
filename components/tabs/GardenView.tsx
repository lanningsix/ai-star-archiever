
import React, { useMemo, useEffect, useState } from 'react';
import { Theme } from '../../styles/themes';
import { Transaction } from '../../types';
import { Sprout, Info, Trees, Mountain } from 'lucide-react';

interface GardenViewProps {
  transactions: Transaction[];
  theme: Theme;
}

// Deterministic random generator
const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

export const GardenView: React.FC<GardenViewProps> = ({ transactions, theme }) => {
  const [time, setTime] = useState(0);

  // Animation loop for gentle movement
  useEffect(() => {
    const interval = setInterval(() => setTime(t => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  const growthScore = useMemo(() => {
      return transactions
        .filter(t => t.amount > 0)
        .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  // --- Logic: Ecosystem Generation ---
  const gardenItems = useMemo(() => {
      const items: Array<{ 
          id: number, 
          content: string, 
          x: number, 
          y: number, 
          scale: number, 
          z: number, 
          blur: number,
          type: 'plant' | 'animal' | 'flying',
          flip: boolean
      }> = [];
      
      // Cap density but allow it to feel lush
      const density = Math.min(60, 5 + Math.floor(growthScore / 12)); 
      
      for (let i = 0; i < density; i++) {
          const rnd = seededRandom(i * 137); 
          const x = rnd * 94 + 3; // 3% to 97% width
          
          // Y represents depth (0 = far back, 100 = close front)
          const depthRnd = seededRandom(i * 42);
          const y = depthRnd * 40; // 0-40% from bottom

          // Perspective calculations
          const scale = 0.6 + (y / 40) * 1.2; // Far items are 0.6x, near are 1.8x
          const zIndex = Math.floor(y * 10);
          const blur = y < 10 ? 1 : 0; // Blur distant items slightly

          // --- Biome Logic ---
          let pool: string[] = ['🌱', '🌿']; // Default starter
          let types: ('plant' | 'animal' | 'flying')[] = ['plant', 'plant'];

          // Level 1: Flower Field (Score 50+)
          if (growthScore > 50) {
              pool.push('🌼', '🌻', '🌷', '🍄', '🌾');
              types.push('plant', 'plant', 'plant', 'plant', 'plant');
          }
          // Level 2: Small Animals & Bushes (Score 150+)
          if (growthScore > 150) {
              pool.push('🌳', '🐌', '🦋', '🐝', '🪵');
              types.push('plant', 'animal', 'flying', 'flying', 'plant');
          }
          // Level 3: Forest & Mammals (Score 300+)
          if (growthScore > 300) {
              pool.push('🌲', '🐇', '🐿️', '🦔', '🐦');
              types.push('plant', 'animal', 'animal', 'animal', 'flying');
          }
          // Level 4: Deep Forest (Score 600+)
          if (growthScore > 600) {
              pool.push('🦌', '🦊', '🦉', '🌲', '🍄');
              types.push('animal', 'animal', 'flying', 'plant', 'plant');
          }
          // Level 5: Magical (Score 1000+)
          if (growthScore > 1000) {
               pool.push('🦄', '✨', '🧚');
               types.push('animal', 'flying', 'flying');
          }

          // Selection using weights (simulated by array duplication above or just random pick)
          const pickIndex = Math.floor(seededRandom(i * 99) * pool.length);
          const content = pool[pickIndex];
          const type = types[pickIndex];

          // Special override: Ensure rare animals appear at least once if level permits
          let finalContent = content;
          let finalType = type;

          // Force a Unicorn if very high level and specific index
          if (growthScore > 1000 && i === 0) { finalContent = '🦄'; finalType = 'animal'; }
          else if (growthScore > 600 && i === 1) { finalContent = '🦌'; finalType = 'animal'; }
          else if (growthScore > 300 && i === 2) { finalContent = '🐇'; finalType = 'animal'; }

          items.push({
              id: i,
              content: finalContent,
              x,
              y, // This is "bottom %"
              scale,
              z: zIndex,
              blur,
              type: finalType,
              flip: seededRandom(i * 7) > 0.5 // Randomly flip direction
          });
      }
      
      // Sort by Z-index (depth) so standard DOM stacking works
      return items.sort((a, b) => a.z - b.z);
  }, [growthScore]);

  return (
    <div className="py-4 animate-slide-up pb-28 relative">
       
       {/* Header */}
       <div className="px-4 mb-4 flex justify-between items-end relative z-20">
           <div>
                <h2 className={`text-xl font-cute flex items-center gap-2 ${theme.accent} drop-shadow-sm`}>
                    <Trees className="w-6 h-6" /> 生态花园
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <div className="bg-white/80 backdrop-blur-sm text-emerald-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-emerald-100">
                        繁荣度: {growthScore}
                    </div>
                </div>
           </div>
       </div>

       {/* === SCENE CONTAINER === */}
       <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden mx-auto border-[6px] border-white ring-4 ring-slate-50 transform transition-transform hover:scale-[1.01] duration-500 bg-sky-200">
           
           {/* 1. Sky & Atmosphere */}
           <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-sky-300 to-sky-100 z-0"></div>
           
           {/* Sun with Glow */}
           <div className="absolute top-10 right-10 w-24 h-24 bg-amber-200 rounded-full blur-2xl opacity-60 z-0 animate-pulse"></div>
           <div className="absolute top-14 right-14 w-16 h-16 bg-yellow-300 rounded-full blur-md z-0"></div>

           {/* Distant Mountains */}
           <div className="absolute bottom-[30%] left-0 right-0 h-[40%] z-1 opacity-80">
               <div className="absolute bottom-0 left-[-20%] w-[80%] h-full bg-indigo-300 rounded-tr-[100%] transform skew-y-3"></div>
               <div className="absolute bottom-0 right-[-20%] w-[80%] h-[80%] bg-indigo-400 rounded-tl-[100%] transform -skew-y-2"></div>
           </div>

           {/* Rolling Hills (Layers) */}
           {/* Back Hill */}
           <div className="absolute bottom-[15%] left-[-10%] w-[120%] h-[40%] bg-[#5ba878] rounded-[50%_50%_0_0] shadow-lg z-2 opacity-90"></div>
           {/* Middle Hill */}
           <div className="absolute bottom-[5%] right-[-20%] w-[140%] h-[40%] bg-[#4d9e68] rounded-[60%_60%_0_0] shadow-lg z-3"></div>
           {/* Front Ground */}
           <div className="absolute bottom-[-10%] left-0 w-full h-[30%] bg-gradient-to-t from-[#3b8a53] to-[#45a060] z-4"></div>

           {/* 2. Items Placement */}
           <div className="absolute inset-0 z-10">
                {gardenItems.length === 0 && (
                   <div className="absolute inset-0 flex items-center justify-center flex-col z-50 text-white drop-shadow-md">
                       <Sprout size={48} className="mb-2 animate-bounce" />
                       <p className="font-cute text-xl">做个任务，种下第一颗种子吧！</p>
                   </div>
               )}

               {gardenItems.map((item) => (
                   <div
                        key={item.id}
                        className="absolute flex justify-center items-end pointer-events-none"
                        style={{
                            left: `${item.x}%`,
                            bottom: `${item.y + 5}%`, // Adjust base offset
                            zIndex: item.z + 10, // Ensure above ground
                            transition: 'all 0.5s ease-out',
                        }}
                   >
                       {/* Shadow for realism */}
                       <div 
                            className="absolute bottom-1 w-8 h-3 bg-black/20 rounded-[100%] blur-[2px]"
                            style={{
                                transform: `scale(${item.scale}) translateX(${item.flip ? '5px' : '-5px'})`
                            }}
                       ></div>

                       {/* The Item */}
                       <div 
                            className="relative text-4xl will-change-transform"
                            style={{
                                transform: `scale(${item.scale}) scaleX(${item.flip ? -1 : 1})`,
                                filter: `blur(${item.blur}px) drop-shadow(0 4px 6px rgba(0,0,0,0.1))`,
                                animation: item.type === 'flying' 
                                    ? `float ${3 + (item.id % 3)}s ease-in-out infinite`
                                    : `sway ${4 + (item.id % 4)}s ease-in-out infinite`,
                                animationDelay: `${item.id * 0.2}s`
                            }}
                       >
                           {item.content}
                       </div>
                   </div>
               ))}
           </div>

           {/* Foreground Overlay (Vignette & Light) */}
           <div className="absolute inset-0 pointer-events-none z-50 shadow-[inset_0_0_60px_rgba(0,0,0,0.1)] rounded-[2.5rem]"></div>
           
           {/* Fireflies / Pollen */}
           <div className="absolute inset-0 z-20 pointer-events-none">
               {[...Array(6)].map((_, i) => (
                   <div 
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse blur-[1px]"
                        style={{
                            left: `${(i * 17) % 100}%`,
                            top: `${40 + (i * 13) % 50}%`,
                            opacity: 0.6,
                            animationDuration: `${2 + i}s`
                        }}
                   ></div>
               ))}
           </div>

       </div>

       {/* Stats / Legend */}
       <div className="mt-6 mx-4 bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-5 shadow-sm border border-white/50">
            <div className="flex items-center gap-2 mb-3">
                <Info size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">生态图鉴</span>
            </div>
            
            <div className="grid grid-cols-5 gap-2 text-center">
                {[
                    { icon: '🌱', score: 0, label: '萌芽' },
                    { icon: '🌼', score: 50, label: '花田' },
                    { icon: '🌳', score: 150, label: '树丛' },
                    { icon: '🦌', score: 300, label: '森林' },
                    { icon: '🦄', score: 600, label: '秘境' },
                ].map((tier) => (
                    <div key={tier.label} className={`flex flex-col items-center transition-all duration-500 ${growthScore >= tier.score ? 'opacity-100 scale-110' : 'opacity-30 grayscale scale-90'}`}>
                        <span className="text-2xl drop-shadow-sm mb-1 filter">{tier.icon}</span>
                        <span className="text-[10px] font-bold text-slate-600">{tier.label}</span>
                    </div>
                ))}
            </div>

            <div className="mt-4 relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-300 to-lime-500 transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, (growthScore / 600) * 100)}%` }}
                ></div>
            </div>
            <div className="text-right mt-1">
                 <span className="text-[10px] font-bold text-slate-400">
                    {growthScore >= 600 ? '生态已达完美状态' : `下一阶段: ${
                        growthScore < 50 ? 50 : growthScore < 150 ? 150 : growthScore < 300 ? 300 : 600
                    }`}
                 </span>
            </div>
       </div>

       <style>{`
         @keyframes sway {
           0%, 100% { transform: rotate(-3deg) scale(var(--tw-scale-x), var(--tw-scale-y)); }
           50% { transform: rotate(3deg) scale(var(--tw-scale-x), var(--tw-scale-y)); }
         }
         @keyframes float {
            0%, 100% { transform: translateY(0) scale(var(--tw-scale-x), var(--tw-scale-y)); }
            50% { transform: translateY(-10px) scale(var(--tw-scale-x), var(--tw-scale-y)); }
         }
       `}</style>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Heart, Zap, Crown, Utensils } from 'lucide-react';
import { Pet, PetType } from '../../types';
import { Theme } from '../../styles/themes';
import { PET_EVOLUTION, getExpForNextLevel, PET_CONFIG, PET_FOODS } from '../../constants';
import { ToastType } from '../Toast';

interface PetViewProps {
  pet: Pet | null;
  balance: number;
  onAdopt: (name: string, type: PetType) => void;
  onFeed: (cost: number, exp: number) => void;
  theme: Theme;
  onShowToast: (msg: string, type: ToastType) => void;
}

export const PetView: React.FC<PetViewProps> = ({ pet, balance, onAdopt, onFeed, theme, onShowToast }) => {
  const [adoptName, setAdoptName] = useState('');
  const [adoptType, setAdoptType] = useState<PetType>('dino');
  const [isEating, setIsEating] = useState(false);
  
  // Mood calculation
  const hoursSinceFed = pet ? (Date.now() - pet.lastFedTime) / (1000 * 60 * 60) : 0;
  let mood = 'happy';
  let moodEmoji = '😊';
  
  if (hoursSinceFed > PET_CONFIG.SICK_HOURS) {
      mood = 'sick';
      moodEmoji = '🤒';
  } else if (hoursSinceFed > PET_CONFIG.HUNGER_HOURS) {
      mood = 'hungry';
      moodEmoji = '🥺';
  }

  const handleFeed = (food: typeof PET_FOODS[0]) => {
      if (balance < food.cost) {
          onShowToast(`星星不够哦，需要 ${food.cost} 颗`, 'error');
          return;
      }
      setIsEating(true);
      onFeed(food.cost, food.exp);
      setTimeout(() => setIsEating(false), 1000);
  };

  if (!pet) {
      return (
          <div className="py-6 animate-slide-up px-2 pb-20">
              <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-lg border-4 border-slate-100">
                  <h2 className="font-cute text-2xl text-slate-700 mb-2">领养你的专属宠物</h2>
                  <p className="text-slate-400 text-sm mb-8">它会陪你一起成长，要好好照顾它哦！</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                      {(['dino', 'unicorn', 'cat', 'dragon'] as PetType[]).map(type => (
                          <button 
                              key={type}
                              onClick={() => setAdoptType(type)}
                              className={`p-4 rounded-2xl border-2 transition-all ${adoptType === type ? `${theme.border} ${theme.bg} scale-105 shadow-md` : 'border-slate-100 opacity-60'}`}
                          >
                              <div className="text-4xl mb-2">{PET_EVOLUTION[type][1]}</div>
                              <div className="font-bold text-slate-600 text-xs uppercase">{type}</div>
                          </button>
                      ))}
                  </div>

                  <input 
                      value={adoptName}
                      onChange={e => setAdoptName(e.target.value)}
                      placeholder="给它起个名字吧"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-center text-lg font-bold text-slate-700 outline-none focus:border-slate-400 mb-6"
                  />

                  <button 
                      disabled={!adoptName.trim()}
                      onClick={() => onAdopt(adoptName, adoptType)}
                      className={`w-full py-4 rounded-xl font-cute text-xl text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] ${!adoptName.trim() ? 'bg-slate-300' : theme.button}`}
                  >
                      确认领养
                  </button>
              </div>
          </div>
      );
  }

  // Determine Avatar based on level
  let stageIndex = 0;
  if (pet.level >= 20) stageIndex = 3;
  else if (pet.level >= 10) stageIndex = 2;
  else if (pet.level >= 2) stageIndex = 1;
  
  const avatar = PET_EVOLUTION[pet.type][stageIndex];
  const nextExp = getExpForNextLevel(pet.level);
  const progress = (pet.exp / nextExp) * 100;

  return (
    <div className="py-4 animate-slide-up pb-20">
        {/* Header Stats */}
        <div className="flex items-center justify-between px-2 mb-4">
             <h2 className={`text-xl font-cute flex items-center gap-2 ${theme.accent}`}>
                <span className="bg-white p-1.5 rounded-full shadow-sm text-2xl">{moodEmoji}</span>
                {pet.name}
             </h2>
             <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                 <Crown size={16} className="text-amber-400 fill-amber-400" />
                 <span className="font-bold text-slate-600">Lv.{pet.level}</span>
             </div>
        </div>

        {/* Main Pet Room */}
        <div className={`relative bg-white rounded-[2.5rem] h-80 mb-6 shadow-inner border-4 ${theme.border} overflow-hidden flex items-center justify-center group`}>
            {/* Background decorations */}
            <div className={`absolute top-0 left-0 right-0 h-2/3 opacity-10 bg-gradient-to-b ${theme.gradient}`}></div>
            <div className="absolute bottom-4 left-6 w-12 h-1 rounded-full bg-slate-200/50"></div>
            <div className="absolute bottom-8 right-10 w-8 h-1 rounded-full bg-slate-200/50"></div>
            
            {/* Status Badge */}
            {mood !== 'happy' && (
                 <div className="absolute top-6 right-6 bg-white/80 backdrop-blur px-3 py-1.5 rounded-xl shadow-sm text-xs font-bold text-rose-500 flex items-center gap-1 animate-pulse">
                     <Zap size={12} /> {mood === 'hungry' ? '饿了' : '生病了'}
                 </div>
            )}

            {/* Pet Avatar */}
            <div className={`text-[8rem] transition-transform duration-500 cursor-pointer select-none filter drop-shadow-xl
                ${isEating ? 'animate-bounce scale-110' : 'animate-float'}
                ${mood === 'sick' ? 'grayscale-[0.5] opacity-80' : ''}
            `}>
                {avatar}
            </div>
        </div>

        {/* Stats Bars */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm mb-6 border border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2">
                <span>成长值 (EXP)</span>
                <span>{pet.exp} / {nextExp}</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-6">
                <div 
                    className={`h-full transition-all duration-500 rounded-full ${theme.solid}`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2">
                <span>饱食度</span>
                <span className={hoursSinceFed > 24 ? 'text-rose-500' : 'text-lime-500'}>
                    {hoursSinceFed < 1 ? '非常饱' : hoursSinceFed < 12 ? '正常' : hoursSinceFed < 24 ? '有点饿' : '非常饿'}
                </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 rounded-full ${hoursSinceFed > 24 ? 'bg-rose-400' : 'bg-lime-400'}`}
                    style={{ width: `${Math.max(0, 100 - (hoursSinceFed/24 * 100))}%` }}
                ></div>
            </div>
        </div>

        {/* Feeding Actions */}
        <h3 className="font-bold text-slate-600 ml-2 mb-3 flex items-center gap-2">
            <Utensils size={18} /> 喂食互动
        </h3>
        <div className="grid grid-cols-2 gap-3">
            {PET_FOODS.map(food => (
                <button
                    key={food.id}
                    onClick={() => handleFeed(food)}
                    disabled={balance < food.cost}
                    className={`
                        flex items-center justify-between p-3 rounded-2xl border-2 transition-all bounce-click
                        ${balance >= food.cost 
                            ? 'bg-white border-slate-100 hover:border-amber-200 hover:bg-amber-50' 
                            : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">{food.icon}</div>
                        <div className="text-left">
                            <div className="font-bold text-slate-700 text-sm">{food.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold">+ {food.exp} EXP</div>
                        </div>
                    </div>
                    <div className="bg-amber-100 text-amber-600 px-2 py-1 rounded-lg text-xs font-bold min-w-[2.5rem] text-center">
                        {food.cost}
                    </div>
                </button>
            ))}
        </div>
    </div>
  );
};

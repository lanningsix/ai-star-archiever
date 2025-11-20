
import React from 'react';
import { ShoppingBag, Star } from 'lucide-react';
import { Reward } from '../../types';
import { Theme } from '../../styles/themes';

interface StoreViewProps {
  rewards: Reward[];
  balance: number;
  onRedeem: (reward: Reward) => void;
  theme: Theme;
}

export const StoreView: React.FC<StoreViewProps> = ({ rewards, balance, onRedeem, theme }) => {
  return (
    <div className="py-4 animate-slide-up">
      <h2 className={`text-xl font-cute mb-4 flex items-center ml-2 ${theme.accent}`}>
          <span className={`${theme.light} p-2 rounded-xl mr-3 shadow-sm rotate-3`}><ShoppingBag className={`w-5 h-5 ${theme.accent}`} /></span>
          兑换商城
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {rewards.map(reward => (
              <div key={reward.id} className={`bg-white rounded-[1.8rem] p-4 flex flex-col items-center shadow-[0_4px_0_0_rgba(0,0,0,0.04)] border-2 border-slate-100 relative overflow-hidden hover:${theme.border} transition-all duration-300 group`}>
                  <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{reward.icon}</div>
                  <h3 className="font-bold text-slate-700 text-center mb-2 text-base h-10 flex items-center justify-center leading-snug">{reward.title}</h3>
                  <button 
                      onClick={() => onRedeem(reward)}
                      className={`
                          w-full py-2 rounded-xl font-cute text-lg text-white flex items-center justify-center gap-2 transition-all bounce-click shadow-md
                          ${balance >= reward.cost 
                              ? `${theme.button} ${theme.shadow}` 
                              : 'bg-slate-200 cursor-not-allowed text-slate-400'}
                      `}
                      disabled={balance < reward.cost}
                  >
                      <span>{reward.cost}</span>
                      <Star size={16} fill="currentColor" />
                  </button>
              </div>
          ))}
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { ShoppingBag, Star, Check, AlertCircle, Plus, Trash2, PiggyBank, TrendingUp } from 'lucide-react';
import { Reward, WishlistGoal } from '../../types';
import { Theme } from '../../styles/themes';

interface StoreViewProps {
  rewards: Reward[];
  balance: number;
  onRedeem: (reward: Reward) => void;
  theme: Theme;
  // Wishlist Props
  wishlist?: WishlistGoal[];
  onAddGoal?: () => void;
  onDeleteGoal?: (id: string) => void;
  onDeposit?: (goal: WishlistGoal, amount: number) => void;
}

export const StoreView: React.FC<StoreViewProps> = ({ rewards, balance, onRedeem, theme, wishlist = [], onAddGoal, onDeleteGoal, onDeposit }) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [depositInputId, setDepositInputId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('10');

  const handleClick = (reward: Reward) => {
    if (balance < reward.cost) return;

    if (confirmId === reward.id) {
        // Execute redemption
        onRedeem(reward);
        setConfirmId(null);
    } else {
        // Enter confirmation state
        setConfirmId(reward.id);
        // Auto-reset after 3 seconds
        setTimeout(() => {
            setConfirmId(prev => prev === reward.id ? null : prev);
        }, 3000);
    }
  };

  const handleDepositClick = (goal: WishlistGoal) => {
      if (depositInputId === goal.id) {
          // Execute Deposit
          const amount = parseInt(depositAmount);
          if (amount > 0 && onDeposit) {
              onDeposit(goal, amount);
              setDepositInputId(null);
              setDepositAmount('10');
          }
      } else {
          // Open Input
          setDepositInputId(goal.id);
      }
  };

  return (
    <div className="py-4 animate-slide-up pb-24 space-y-8">
      
      {/* Wishlist Section */}
      <div className="px-2">
          <div className="flex justify-between items-center px-2 mb-4">
             <h2 className={`text-xl font-cute flex items-center text-purple-600`}>
                  <span className={`bg-purple-100 p-2 rounded-xl mr-3 shadow-sm -rotate-2`}><PiggyBank className={`w-5 h-5 text-purple-500`} /></span>
                  我的心愿单
              </h2>
              <button onClick={onAddGoal} className="bg-purple-500 text-white p-2 rounded-xl shadow-md shadow-purple-200 hover:bg-purple-600 transition-colors">
                  <Plus size={20} />
              </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 px-1 hide-scrollbar snap-x">
              {wishlist.length === 0 && (
                   <div className="w-full bg-purple-50 rounded-[1.5rem] border-2 border-dashed border-purple-200 p-6 text-center text-purple-400">
                       <PiggyBank className="mx-auto mb-2 opacity-50" size={32} />
                       <p className="text-xs font-bold">还没有心愿哦，快去添加一个吧！</p>
                   </div>
              )}
              {wishlist.map(goal => {
                  const progress = Math.min(100, Math.round((goal.currentSaved / goal.targetCost) * 100));
                  const isDepositing = depositInputId === goal.id;
                  
                  return (
                      <div key={goal.id} className="snap-center min-w-[280px] bg-white rounded-[1.8rem] p-5 shadow-md border border-slate-100 relative overflow-hidden flex flex-col">
                          <div className="flex justify-between items-start mb-3">
                               <div className="flex items-center gap-3">
                                   <span className="text-4xl drop-shadow-sm">{goal.icon}</span>
                                   <div>
                                       <div className="font-bold text-slate-700 text-lg leading-tight">{goal.title}</div>
                                       <div className="text-xs text-slate-400 font-bold mt-0.5">{goal.currentSaved} / {goal.targetCost} <Star size={10} className="inline mb-0.5"/></div>
                                   </div>
                               </div>
                               {onDeleteGoal && (
                                   <button onClick={() => onDeleteGoal(goal.id)} className="text-slate-300 hover:text-rose-400 p-1">
                                       <Trash2 size={16} />
                                   </button>
                               )}
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4 relative">
                              <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                              {/* Stripes */}
                              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]"></div>
                          </div>

                          {/* Actions */}
                          <div className="mt-auto">
                              {isDepositing ? (
                                  <div className="flex items-center gap-2 animate-fade-in">
                                      <input 
                                        type="number" 
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        className="w-20 bg-slate-50 border-2 border-purple-200 rounded-lg py-1.5 px-2 text-center font-bold text-slate-700 outline-none focus:border-purple-400"
                                        autoFocus
                                      />
                                      <button onClick={() => handleDepositClick(goal)} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-bold text-sm shadow-md">确定</button>
                                      <button onClick={() => setDepositInputId(null)} className="px-3 py-2 bg-slate-100 rounded-lg text-slate-400"><Plus size={16} className="rotate-45"/></button>
                                  </div>
                              ) : (
                                  <button 
                                    onClick={() => handleDepositClick(goal)}
                                    disabled={balance <= 0 || goal.currentSaved >= goal.targetCost}
                                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                                        goal.currentSaved >= goal.targetCost 
                                        ? 'bg-emerald-100 text-emerald-600 cursor-default' 
                                        : balance <= 0 ? 'bg-slate-100 text-slate-400' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100'
                                    }`}
                                  >
                                      {goal.currentSaved >= goal.targetCost ? (
                                          <><Check size={16}/> 已达成目标</>
                                      ) : (
                                          <><TrendingUp size={16}/> 存入星星</>
                                      )}
                                  </button>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 mx-6"></div>

      {/* Rewards Section */}
      <div>
        <div className="px-4 mb-4">
            <h2 className={`text-xl font-cute flex items-center ${theme.accent}`}>
                <span className={`${theme.light} p-2 rounded-xl mr-3 shadow-sm rotate-3`}><ShoppingBag className={`w-5 h-5 ${theme.accent}`} /></span>
                兑换商城
            </h2>
            <p className="text-xs text-slate-400 mt-1 ml-12 flex items-center gap-1">
               <AlertCircle size={12} /> 点击按钮两次以确认兑换
            </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-4">
            {rewards.map(reward => {
                const isConfirming = confirmId === reward.id;
                const canAfford = balance >= reward.cost;
                
                return (
                    <div key={reward.id} className={`bg-white rounded-[1.8rem] p-4 flex flex-col items-center shadow-[0_4px_0_0_rgba(0,0,0,0.04)] border-2 border-slate-100 relative overflow-hidden hover:${theme.border} transition-all duration-300 group`}>
                        <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-sm mt-2">
                            {reward.icon}
                        </div>
                        <h3 className="font-bold text-slate-700 text-center mb-3 text-base h-10 flex items-center justify-center leading-tight px-1">
                            {reward.title}
                        </h3>
                        
                        <button 
                            onClick={() => handleClick(reward)}
                            className={`
                                w-full py-2.5 rounded-xl font-cute text-lg text-white flex items-center justify-center gap-2 transition-all bounce-click shadow-md
                                ${!canAfford 
                                    ? 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none' 
                                    : isConfirming 
                                        ? 'bg-emerald-500 shadow-emerald-200 scale-105 ring-2 ring-emerald-100' 
                                        : `${theme.button} ${theme.shadow}`
                                }
                            `}
                            disabled={!canAfford}
                        >
                            {isConfirming ? (
                                <span className="flex items-center gap-1 animate-pulse">
                                    确认 <Check size={18} strokeWidth={3} />
                                </span>
                            ) : (
                                <>
                                    <span>{reward.cost}</span>
                                    <Star size={16} fill="currentColor" />
                                </>
                            )}
                        </button>
                    </div>
                );
            })}
        </div>
        
        {rewards.length === 0 && (
          <div className="text-center p-10 text-slate-300">
              <div className="text-4xl mb-2">🎁</div>
              <p className="font-cute">还没有设置奖励哦</p>
          </div>
        )}
      </div>
    </div>
  );
};
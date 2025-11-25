
import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { AUDIO_RESOURCES, ACHIEVEMENTS } from '../constants';
import { Achievement, Task, Transaction, TaskCategory, Reward } from '../types';

interface GamificationProps {
    unlockedAchievements: string[];
    setUnlockedAchievements: React.Dispatch<React.SetStateAction<string[]>>;
    streak: number;
    lifetimeEarnings: number;
    balance: number;
    transactions: Transaction[];
    logs: Record<string, string[]>;
    tasks: Task[];
}

export const useGamification = ({
    unlockedAchievements,
    setUnlockedAchievements,
    streak,
    lifetimeEarnings,
    balance,
    transactions,
    logs,
    tasks
}: GamificationProps) => {
    // --- State ---
    const [showCelebration, setShowCelebration] = useState<{show: boolean, points: number, type: 'success' | 'penalty'}>({ 
        show: false, 
        points: 0, 
        type: 'success' 
    });
    const showCelebrationRef = useRef(showCelebration);
    
    const [newUnlocked, setNewUnlocked] = useState<Achievement | null>(null);
    const [pendingUnlocked, setPendingUnlocked] = useState<Achievement | null>(null);
    const [mysteryReward, setMysteryReward] = useState<{ title: string, icon: string, bonusStars?: number } | null>(null);
    
    // NEW: Redemption Animation State
    const [redemptionPop, setRedemptionPop] = useState<Reward | null>(null);

    useEffect(() => {
        showCelebrationRef.current = showCelebration;
    }, [showCelebration]);

    // --- Audio ---
    const playRandomSound = useCallback((type: 'success' | 'penalty' | 'unlock' = 'success') => {
        const urls = type === 'penalty' ? AUDIO_RESOURCES.PENALTY 
                   : type === 'unlock' ? AUDIO_RESOURCES.UNLOCK 
                   : AUDIO_RESOURCES.SUCCESS;
        
        if (!urls || urls.length === 0) return;

        const randomUrl = urls[Math.floor(Math.random() * urls.length)];
        const audio = new Audio(randomUrl);
        audio.volume = 0.6;
        
        audio.onerror = () => console.warn(`Audio failed to load: ${randomUrl}`);
        audio.play().catch(e => console.warn("Audio play blocked", e));
    }, []);

    // --- Confetti Helpers ---
    const safeConfetti = useCallback((opts: any) => {
        try {
            // @ts-ignore
            if (typeof confetti === 'function') {
                confetti(opts);
            } else if (typeof (window as any).confetti === 'function') {
                (window as any).confetti(opts);
            }
        } catch (e) {
            console.warn('Confetti failed', e);
        }
    }, []);

    const triggerStarConfetti = useCallback(() => {
        const duration = 1000;
        const end = Date.now() + duration;
        const interval: any = setInterval(() => {
            if (Date.now() > end) return clearInterval(interval);
            safeConfetti({ 
                particleCount: 20, startVelocity: 30, spread: 360, ticks: 60, 
                origin: { x: Math.random(), y: Math.random() - 0.2 }, 
                shapes: ['star'], colors: ['#FFD700', '#FFA500', '#FFFF00'] 
            });
        }, 250);
    }, [safeConfetti]);

    const triggerRainConfetti = useCallback(() => {
        const duration = 1000;
        const end = Date.now() + duration;
        (function frame() {
            safeConfetti({
                particleCount: 6, angle: 270, spread: 10, origin: { x: Math.random(), y: -0.2 }, 
                colors: ['#64748b', '#94a3b8', '#475569'], shapes: ['circle'], 
                gravity: 3.5, scalar: 0.6, drift: 0, ticks: 400
            });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }, [safeConfetti]);

    const triggerRandomCelebration = useCallback(() => {
        const effects = [
            triggerStarConfetti,
            () => safeConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#FF7EB3', '#7AFCB0', '#7FD8FE'] }), // Simple
            () => safeConfetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#FDB931', '#E5C100'], shapes: ['circle'], scalar: 1.2 }), // GoldRush
        ];
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        randomEffect();
    }, [safeConfetti, triggerStarConfetti]);

    const triggerFireworks = useCallback(() => {
        const duration = 1500;
        const end = Date.now() + duration;
        const interval: any = setInterval(() => {
          if (Date.now() > end) return clearInterval(interval);
          safeConfetti({ 
              startVelocity: 30, spread: 360, ticks: 60, zIndex: 100,
              particleCount: 50, origin: { x: Math.random(), y: Math.random() - 0.2 },
              colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']
          });
        }, 250);
    }, [safeConfetti]);

    // NEW: Trigger Redemption Flow
    const triggerRedemption = useCallback((reward: Reward) => {
        setRedemptionPop(reward);
        playRandomSound('success');
        safeConfetti({ 
            particleCount: 150, 
            spread: 100, 
            origin: { y: 0.6 }, 
            colors: ['#FFD700', '#F472B6', '#A78BFA', '#34D399'],
            zIndex: 200
        });
        
        // Auto hide after animation
        setTimeout(() => {
            setRedemptionPop(null);
        }, 2500);
    }, [playRandomSound, safeConfetti]);

    // --- Achievement Logic ---
    useEffect(() => {
        const check = () => {
            const newUnlocks: string[] = [];
            let lastUnlockedAch: Achievement | null = null;
    
            ACHIEVEMENTS.forEach(ach => {
                if (unlockedAchievements.includes(ach.id)) return;
    
                let unlocked = false;
                
                switch (ach.conditionType) {
                  case 'lifetime_stars':
                    if (lifetimeEarnings >= ach.threshold) unlocked = true;
                    break;
                  case 'streak':
                    if (streak >= ach.threshold) unlocked = true;
                    break;
                  case 'category_count':
                     if (ach.categoryFilter) {
                       let count = 0;
                       Object.values(logs).forEach((dayLog) => {
                           (dayLog as string[]).forEach(tid => {
                               const t = tasks.find(tt => tt.id === tid);
                               if (t && t.category === ach.categoryFilter) count++;
                           });
                       });
                       if (count >= ach.threshold) unlocked = true;
                     }
                     break;
                  case 'balance_level':
                     if (balance >= ach.threshold) unlocked = true;
                     break;
                  case 'redemption_count':
                     const redeemCount = transactions.filter(t => !t.isRevoked && t.amount < 0 && (t.description.includes('兑换') || t.description.includes('购买'))).length;
                     if (redeemCount >= ach.threshold) unlocked = true;
                     break;
                  case 'mystery_box_count':
                     const boxCount = transactions.filter(t => !t.isRevoked && t.description.includes('盲盒')).length;
                     if (boxCount >= ach.threshold) unlocked = true;
                     break;
                  case 'wishlist_complete':
                     // Handled externally when depositing
                     if (unlockedAchievements.includes(ach.id)) unlocked = true;
                     break;
                }
                
                if (unlocked) {
                    newUnlocks.push(ach.id);
                    lastUnlockedAch = ach;
                }
            });
    
            if (newUnlocks.length > 0) {
                setUnlockedAchievements(prev => [...prev, ...newUnlocks]);
                
                if (lastUnlockedAch) {
                   if (showCelebrationRef.current.show) {
                       setPendingUnlocked(lastUnlockedAch);
                   } else {
                       setNewUnlocked(lastUnlockedAch);
                       playRandomSound('unlock'); 
                       safeConfetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
                   }
                }
            }
        };

        const timeout = setTimeout(check, 500);
        return () => clearTimeout(timeout);
    }, [streak, lifetimeEarnings, balance, transactions.length, logs, unlockedAchievements, tasks, safeConfetti, playRandomSound, setUnlockedAchievements]);

    // Pending Achievement Queue
    useEffect(() => {
        if (!showCelebration.show && pendingUnlocked) {
            const timer = setTimeout(() => {
                setNewUnlocked(pendingUnlocked);
                setPendingUnlocked(null);
                playRandomSound('unlock');
                safeConfetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [showCelebration.show, pendingUnlocked, playRandomSound, safeConfetti]);

    // Auto-close celebration
    useEffect(() => {
        if (showCelebration.show) {
          const timer = setTimeout(() => {
            setShowCelebration(prev => ({ ...prev, show: false }));
          }, 2000);
          return () => clearTimeout(timer);
        }
    }, [showCelebration.show]);

    return {
        showCelebration,
        setShowCelebration,
        newUnlocked,
        setNewUnlocked,
        mysteryReward,
        setMysteryReward,
        playRandomSound,
        safeConfetti,
        triggerStarConfetti,
        triggerRainConfetti,
        triggerRandomCelebration,
        triggerFireworks,
        redemptionPop,
        triggerRedemption
    };
};

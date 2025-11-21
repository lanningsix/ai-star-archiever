
import React, { useState } from 'react';
import { Header } from './components/Header';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { NavBar } from './components/NavBar';
import { useAppLogic } from './hooks/useAppLogic';
import { THEMES } from './styles/themes';
import { Toast } from './components/Toast';

// Tabs
import { DailyView } from './components/tabs/DailyView';
import { StoreView } from './components/tabs/StoreView';
import { CalendarView } from './components/tabs/CalendarView';
import { SettingsView } from './components/tabs/SettingsView';
import { StatsView } from './components/tabs/StatsView';

// Modals
import { OnboardingModal } from './components/modals/OnboardingModal';
import { TaskModal } from './components/modals/TaskModal';
import { RewardModal } from './components/modals/RewardModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { ParentalGateModal } from './components/modals/ParentalGateModal';
import { WishlistModal } from './components/modals/WishlistModal';
import { AchievementModal } from './components/modals/AchievementModal';
import { MysteryBoxModal } from './components/modals/MysteryBoxModal';

export default function App() {
  const { state, actions } = useAppLogic();
  const activeTheme = THEMES[state.themeKey];

  // Modal Visibility State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(!localStorage.getItem('app_family_id') && !localStorage.getItem('app_username'));
  const [isParentalLockOpen, setIsParentalLockOpen] = useState(false);
  
  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
      isDanger: boolean;
  }>({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      isDanger: false
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void, isDanger = false) => {
      setConfirmState({ isOpen: true, title, message, onConfirm, isDanger });
  };

  const handleTabChange = (tab: 'daily' | 'store' | 'calendar' | 'settings' | 'stats') => {
      if (tab === 'settings') {
          setIsParentalLockOpen(true);
      } else {
          actions.setActiveTab(tab);
      }
  };

  return (
    <div className={`min-h-screen ${activeTheme.bg || 'bg-[#FFF9F0]'} pb-28 transition-colors duration-500`}>
      {/* Block interactions during critical tasks */}
      {state.isInteractionBlocked && <div className="fixed inset-0 z-[40] bg-transparent cursor-wait" />}
      
      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-wait transition-all duration-300 animate-fade-in">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin mb-3"></div>
            <p className="font-cute text-slate-500 animate-pulse tracking-widest">加载中...</p>
        </div>
      )}

      <Toast 
        message={state.toast.message} 
        type={state.toast.type} 
        isVisible={state.toast.show} 
        onClose={actions.hideToast} 
      />

      <CelebrationOverlay isVisible={state.showCelebration.show} points={state.showCelebration.points} type={state.showCelebration.type} />
      
      {/* Achievement Modal */}
      <AchievementModal 
        achievement={state.newUnlocked} 
        onClose={() => actions.setNewUnlocked(null)} 
      />

      {/* Mystery Box Modal */}
      <MysteryBoxModal 
        isOpen={!!state.mysteryReward}
        reward={state.mysteryReward}
        onClose={() => actions.setMysteryReward(null)}
      />

      {/* Global Confirm Modal */}
      <ConfirmModal 
         isOpen={confirmState.isOpen}
         title={confirmState.title}
         message={confirmState.message}
         onConfirm={confirmState.onConfirm}
         onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
         isDanger={confirmState.isDanger}
      />

      {/* Parental Gate */}
      <ParentalGateModal 
          isOpen={isParentalLockOpen}
          onClose={() => setIsParentalLockOpen(false)}
          onSuccess={() => {
              setIsParentalLockOpen(false);
              actions.setActiveTab('settings');
          }}
      />

      <Header balance={state.balance} userName={state.userName} themeKey={state.themeKey} streak={state.streak} />

      <div className="max-w-5xl mx-auto pt-2 px-4 md:px-6">
        
        {state.activeTab === 'daily' && (
            <DailyView 
                tasks={state.tasks}
                logs={state.logs}
                transactions={state.transactions}
                date={state.currentDate}
                setDate={actions.setCurrentDate}
                onToggleTask={actions.toggleTask}
                themeKey={state.themeKey}
                dateKey={state.dateKey}
            />
        )}

        {state.activeTab === 'stats' && (
            <StatsView
                tasks={state.tasks}
                logs={state.logs}
                transactions={state.transactions}
                currentDate={state.currentDate}
                theme={activeTheme}
                unlockedAchievements={state.unlockedAchievements}
            />
        )}

        {state.activeTab === 'store' && (
            <StoreView 
                rewards={state.rewards}
                balance={state.balance}
                onRedeem={actions.redeemReward}
                theme={activeTheme}
                wishlist={state.wishlist}
                onAddGoal={() => setIsWishlistModalOpen(true)}
                onDeleteGoal={(id) => openConfirm("删除心愿", "确定要删除这个心愿吗？已存的星星会退回。", () => actions.deleteWishlistGoal(id))}
                onDeposit={actions.depositToWishlist}
                onOpenMysteryBox={actions.openMysteryBox}
            />
        )}

        {state.activeTab === 'calendar' && (
           <CalendarView 
                currentDate={state.currentDate}
                setCurrentDate={actions.setCurrentDate}
                transactions={state.transactions}
                themeKey={state.themeKey}
           />
        )}

        {state.activeTab === 'settings' && (
            <SettingsView 
                userName={state.userName}
                familyId={state.familyId}
                themeKey={state.themeKey}
                setThemeKey={actions.setThemeKey}
                syncStatus={state.syncStatus}
                tasks={state.tasks}
                setTasks={actions.setTasks}
                rewards={state.rewards}
                setRewards={actions.setRewards}
                theme={activeTheme}
                actions={{
                    openNameModal: () => setIsNameModalOpen(true),
                    openTaskModal: () => setIsTaskModalOpen(true),
                    openRewardModal: () => setIsRewardModalOpen(true),
                    createFamily: actions.createFamily,
                    joinFamily: actions.handleJoinFamily,
                    manualSave: actions.manualSaveAll,
                    manualLoad: actions.handleCloudLoad,
                    disconnect: () => actions.setFamilyId(''),
                    reset: actions.resetData,
                    showToast: actions.showToast,
                    confirm: openConfirm
                }}
            />
        )}
      </div>

      <NavBar activeTab={state.activeTab} setActiveTab={handleTabChange} themeKey={state.themeKey} />

      {/* Modals */}
      <OnboardingModal 
        isOpen={isNameModalOpen}
        userName={state.userName}
        isEditing={!!state.familyId || state.userName !== ''} 
        onStart={(name) => {
            if (state.userName || state.familyId) {
                // Editing existing user (synced or local)
                actions.setUserName(name);
                actions.showToast('昵称已更新', 'success');
            } else {
                // New user (Start fresh adventure)
                actions.handleStartAdventure(name);
            }
            setIsNameModalOpen(false);
        }}
        onJoin={(id) => {
            actions.handleJoinFamily(id);
            setIsNameModalOpen(false);
        }}
        theme={activeTheme}
      />
      
      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={(newTask) => {
            actions.setTasks([...state.tasks, { id: Date.now().toString(), ...newTask }]);
            setIsTaskModalOpen(false);
        }}
        onShowToast={actions.showToast}
      />

      <RewardModal 
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        onSave={(newReward) => {
            actions.setRewards([...state.rewards, { id: Date.now().toString(), ...newReward }]);
            setIsRewardModalOpen(false);
        }}
        theme={activeTheme}
        onShowToast={actions.showToast}
      />

      <WishlistModal
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
        onSave={(goal) => {
            actions.addWishlistGoal({ id: Date.now().toString(), currentSaved: 0, ...goal });
        }}
        theme={activeTheme}
        onShowToast={actions.showToast}
      />

    </div>
  );
}

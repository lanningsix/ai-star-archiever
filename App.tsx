
import React, { useState } from 'react';
import { Header } from './components/Header';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { NavBar } from './components/NavBar';
import { useAppLogic } from './hooks/useAppLogic';
import { THEMES } from './styles/themes';

// Tabs
import { DailyView } from './components/tabs/DailyView';
import { StoreView } from './components/tabs/StoreView';
import { CalendarView } from './components/tabs/CalendarView';
import { SettingsView } from './components/tabs/SettingsView';

// Modals
import { OnboardingModal } from './components/modals/OnboardingModal';
import { TaskModal } from './components/modals/TaskModal';
import { RewardModal } from './components/modals/RewardModal';

export default function App() {
  const { state, actions } = useAppLogic();
  const activeTheme = THEMES[state.themeKey];

  // Modal Visibility State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(!localStorage.getItem('app_family_id') && !localStorage.getItem('app_username'));

  return (
    <div className={`min-h-screen ${activeTheme.bg || 'bg-[#FFF9F0]'} pb-28 transition-colors duration-500`}>
      {state.isInteractionBlocked && <div className="fixed inset-0 z-[40] bg-transparent cursor-wait" />}
      
      <CelebrationOverlay isVisible={state.showCelebration.show} points={state.showCelebration.points} type={state.showCelebration.type} />

      <Header balance={state.balance} userName={state.userName} themeKey={state.themeKey} />

      <div className="max-w-5xl mx-auto pt-2 px-4 md:px-6">
        
        {state.activeTab === 'daily' && (
            <DailyView 
                tasks={state.tasks}
                logs={state.logs}
                date={state.currentDate}
                setDate={actions.setCurrentDate}
                onToggleTask={actions.toggleTask}
                themeKey={state.themeKey}
                dateKey={state.dateKey}
            />
        )}

        {state.activeTab === 'store' && (
            <StoreView 
                rewards={state.rewards}
                balance={state.balance}
                onRedeem={actions.redeemReward}
                theme={activeTheme}
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
                    reset: actions.resetData
                }}
            />
        )}
      </div>

      <NavBar activeTab={state.activeTab} setActiveTab={actions.setActiveTab} themeKey={state.themeKey} />

      {/* Modals */}
      <OnboardingModal 
        isOpen={isNameModalOpen}
        userName={state.userName}
        setUserName={actions.setUserName}
        onStart={(name) => {
            actions.handleStartAdventure(name);
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
      />

      <RewardModal 
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        onSave={(newReward) => {
            actions.setRewards([...state.rewards, { id: Date.now().toString(), ...newReward }]);
            setIsRewardModalOpen(false);
        }}
        theme={activeTheme}
      />

    </div>
  );
}

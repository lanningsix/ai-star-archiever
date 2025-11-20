
import React, { useState } from 'react';
import { Shirt, ShoppingBag, Lock, Check, Star, Sparkles, Wand2 } from 'lucide-react';
import { AvatarState, AvatarItem } from '../../types';
import { AVATAR_ITEMS } from '../../constants';
import { Theme } from '../../styles/themes';

interface AvatarViewProps {
  avatar: AvatarState;
  balance: number;
  onBuy: (item: AvatarItem) => void;
  onEquip: (item: AvatarItem) => void;
  theme: Theme;
}

// --- Advanced Avatar Render ---

const Gradients = () => (
    <defs>
        {/* Skin Gradient */}
        <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE4D6" />
            <stop offset="100%" stopColor="#FDBA9F" />
        </linearGradient>
        
        {/* Eye Gradient */}
        <radialGradient id="eyeGradient" cx="50%" cy="50%" r="50%" fx="40%" fy="40%">
            <stop offset="0%" stopColor="#4B5563" />
            <stop offset="90%" stopColor="#1F2937" />
            <stop offset="100%" stopColor="#000000" />
        </radialGradient>

        {/* Gold Gradient */}
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Magic Shine */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
    </defs>
);

const AvatarRender = ({ config }: { config: AvatarState['config'] }) => {
    const getItem = (type: string, id?: string) => AVATAR_ITEMS.find(i => i.id === id && i.type === type);

    const headItem = getItem('head', config.head);
    const bodyItem = getItem('body', config.body);
    const backItem = getItem('back', config.back);
    const handItem = getItem('hand', config.hand);
    const faceItem = getItem('face', config.face);

    // --- Render Layers ---

    const renderWings = () => {
        if (!backItem) return null;
        
        if (backItem.id === 'bk_wings_angel') return (
            <g transform="translate(125, 140)">
                 <path d="M -10 0 Q -80 -60 -90 20 Q -80 80 -20 60 Z" fill="white" stroke="#E5E7EB" strokeWidth="2" />
                 <path d="M 10 0 Q 80 -60 90 20 Q 80 80 20 60 Z" fill="white" stroke="#E5E7EB" strokeWidth="2" />
            </g>
        );
        if (backItem.id === 'bk_wings_dragon') return (
             <g transform="translate(125, 150)">
                <path d="M -20 0 C -80 -50, -110 10, -100 50 L -60 30 L -70 70 L -30 40 Z" fill="#10B981" stroke="#065F46" strokeWidth="2" />
                <path d="M 20 0 C 80 -50, 110 10, 100 50 L 60 30 L 70 70 L 30 40 Z" fill="#10B981" stroke="#065F46" strokeWidth="2" />
             </g>
        );
        if (backItem.id === 'bk_cape_red') return (
            <path d="M 85 150 Q 125 160 165 150 L 200 300 Q 125 320 50 300 Z" fill="#EF4444" />
        );
        if (backItem.id === 'bk_backpack') return (
            <g>
               <rect x="60" y="150" width="130" height="110" rx="20" fill="#F59E0B" />
               <path d="M 65 160 L 60 190" stroke="#D97706" strokeWidth="4" strokeLinecap="round"/>
               <path d="M 185 160 L 190 190" stroke="#D97706" strokeWidth="4" strokeLinecap="round"/>
            </g>
        );
        return null;
    };

    const renderBodyBase = () => {
        return (
            <g>
                {/* Neck */}
                <rect x="110" y="130" width="30" height="30" fill="#FDBA9F" />
                
                {/* Legs */}
                <path d="M 90 240 L 90 300 L 115 300 L 115 240" fill="#FDBA9F" /> {/* Left Leg */}
                <path d="M 135 240 L 135 300 L 160 300 L 160 240" fill="#FDBA9F" /> {/* Right Leg */}
                
                {/* Shorts/Base Underwear */}
                <path d="M 85 220 Q 85 250 115 250 L 135 250 Q 165 250 165 220 L 165 200 L 85 200 Z" fill="#4B5563" />

                {/* Torso Skin */}
                <path d="M 85 150 Q 85 140 95 140 L 155 140 Q 165 140 165 150 L 165 220 L 85 220 Z" fill="url(#skinGradient)" />
            </g>
        );
    };

    const renderClothes = () => {
        if (!bodyItem || bodyItem.id === 'b_shirt_red') {
            // Default Shirt
            return (
                <g>
                    <path d="M 85 150 Q 125 170 165 150 L 165 220 L 85 220 Z" fill="#EF4444" />
                    <path d="M 70 150 L 85 150 L 85 180 L 70 170 Z" fill="#DC2626" /> {/* Left Sleeve Cap */}
                    <path d="M 180 150 L 165 150 L 165 180 L 180 170 Z" fill="#DC2626" /> {/* Right Sleeve Cap */}
                    <path d="M 125 150 L 125 220" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                </g>
            );
        }

        const color = bodyItem.color || '#EF4444';

        if (bodyItem.id.includes('dress')) {
            return (
                <g>
                    {/* Dress Top */}
                    <path d="M 90 150 Q 125 165 160 150 L 160 200 L 90 200 Z" fill={color} />
                    {/* Skirt */}
                    <path d="M 90 200 L 70 280 Q 125 290 180 280 L 160 200 Z" fill={color} />
                    {/* Detail */}
                    <path d="M 70 280 Q 125 290 180 280" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="3" />
                </g>
            );
        }

        if (bodyItem.id.includes('suit_super')) {
             return (
                 <g>
                     <path d="M 80 150 L 170 150 L 170 240 L 135 240 L 135 300 L 115 300 L 115 240 L 80 240 L 80 150 Z" fill={color} />
                     <path d="M 125 170 L 145 170 L 135 195 Z" fill="#FCD34D" stroke="#B45309" strokeWidth="1" />
                     <rect x="115" y="300" width="20" height="5" fill="#EF4444" />
                     <rect x="90" y="300" width="25" height="5" fill="#EF4444" />
                     <rect x="135" y="300" width="25" height="5" fill="#EF4444" />
                 </g>
             );
        }
        
        if (bodyItem.id.includes('wizard')) {
            return (
                <g>
                    <path d="M 80 150 L 170 150 L 180 290 L 70 290 Z" fill={color} />
                    <path d="M 110 150 L 110 290" stroke="#4C1D95" strokeWidth="2" />
                    <path d="M 140 150 L 140 290" stroke="#4C1D95" strokeWidth="2" />
                    <path d="M 125 170 L 130 180" stroke="#FCD34D" strokeWidth="2" />
                </g>
            );
        }

        // Generic Shirt/Hoodie
        return (
            <g>
                 <path d="M 80 150 Q 125 140 170 150 L 170 225 L 80 225 Z" fill={color} />
                 <path d="M 125 180 L 125 225" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
                 {bodyItem.id.includes('green') && <circle cx="145" cy="170" r="5" fill="white" opacity="0.5" />}
            </g>
        );
    };

    const renderArms = () => {
        const skin = "url(#skinGradient)";
        const shirtColor = bodyItem?.color || (bodyItem?.id === 'b_shirt_red' || !bodyItem ? '#EF4444' : '#FDBA9F');
        const isLongSleeve = bodyItem?.id.includes('wizard') || bodyItem?.id.includes('suit') || bodyItem?.id.includes('green');
        
        // Arms positions
        return (
            <g>
                {/* Left Arm */}
                <g transform="rotate(10, 75, 160)">
                    <rect x="55" y="150" width="25" height="80" rx="12" fill={skin} />
                    {isLongSleeve ? (
                        <rect x="52" y="148" width="31" height="60" rx="10" fill={shirtColor} />
                    ) : (
                        <path d="M 52 148 L 83 148 L 80 175 L 55 175 Z" fill={shirtColor} />
                    )}
                </g>
                {/* Right Arm */}
                <g transform="rotate(-10, 175, 160)">
                    <rect x="170" y="150" width="25" height="80" rx="12" fill={skin} />
                    {isLongSleeve ? (
                         <rect x="167" y="148" width="31" height="60" rx="10" fill={shirtColor} />
                    ) : (
                        <path d="M 167 148 L 198 148 L 195 175 L 170 175 Z" fill={shirtColor} />
                    )}
                </g>
            </g>
        );
    };

    const renderHeadBase = () => (
        <g>
            {/* Face Shape */}
            <path d="M 75 80 Q 75 145 125 145 Q 175 145 175 80 Q 175 20 125 20 Q 75 20 75 80 Z" fill="url(#skinGradient)" />
            {/* Ears */}
            <path d="M 75 85 Q 65 90 75 95" fill="#FDBA9F" stroke="#F9A8D4" strokeWidth="1" />
            <path d="M 175 85 Q 185 90 175 95" fill="#FDBA9F" stroke="#F9A8D4" strokeWidth="1" />
        </g>
    );

    const renderFaceFeatures = () => (
        <g>
            {/* Eyes */}
            <g transform="translate(95, 85)">
                <circle cx="0" cy="0" r="8" fill="white" /> {/* Sclera */}
                <circle cx="0" cy="0" r="6" fill="url(#eyeGradient)" /> {/* Iris */}
                <circle cx="2" cy="-2" r="2.5" fill="white" opacity="0.9" /> {/* Highlight 1 */}
                <circle cx="-2" cy="3" r="1" fill="white" opacity="0.6" /> {/* Highlight 2 */}
            </g>
            <g transform="translate(155, 85)">
                <circle cx="0" cy="0" r="8" fill="white" />
                <circle cx="0" cy="0" r="6" fill="url(#eyeGradient)" />
                <circle cx="2" cy="-2" r="2.5" fill="white" opacity="0.9" />
                <circle cx="-2" cy="3" r="1" fill="white" opacity="0.6" />
            </g>

            {/* Eyebrows */}
            <path d="M 88 72 Q 95 68 102 72" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 148 72 Q 155 68 162 72" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Blush */}
            <ellipse cx="90" cy="105" rx="8" ry="4" fill="#FDA4AF" opacity="0.5" />
            <ellipse cx="160" cy="105" rx="8" ry="4" fill="#FDA4AF" opacity="0.5" />

            {/* Mouth */}
            <path d="M 115 110 Q 125 120 135 110" fill="none" stroke="#BE123C" strokeWidth="2.5" strokeLinecap="round" />
        </g>
    );

    const renderDefaultHair = () => {
        // Only render full hair if no hat that covers head fully
        const fullCover = headItem?.id.includes('cap') || headItem?.id.includes('wizard');
        
        if (fullCover) return (
            // Sideburns only
             <g>
                <path d="M 75 80 L 75 100 L 80 90 Z" fill="#451a03" />
                <path d="M 175 80 L 175 100 L 170 90 Z" fill="#451a03" />
             </g>
        );

        return (
            <g>
                {/* Back Hair */}
                <path d="M 65 80 Q 60 140 80 150 L 170 150 Q 190 140 185 80 Z" fill="#451a03" />
                {/* Bangs */}
                <path d="M 75 60 Q 90 40 125 40 Q 160 40 175 60 Q 180 90 175 80 Q 160 50 125 50 Q 90 50 75 80 Q 70 90 75 60 Z" fill="#451a03" />
            </g>
        );
    };

    const renderHeadWear = () => {
        if (!headItem) return null;
        const color = headItem.color || '#EF4444';

        if (headItem.id.includes('crown')) return (
            <g transform="translate(0, -10)">
                <path d="M 85 50 L 85 25 L 105 45 L 125 15 L 145 45 L 165 25 L 165 50 Z" fill="url(#goldGradient)" stroke="#B45309" strokeWidth="1.5" />
                <circle cx="85" cy="25" r="3" fill="white" />
                <circle cx="125" cy="15" r="3" fill="white" />
                <circle cx="165" cy="25" r="3" fill="white" />
            </g>
        );
        if (headItem.id.includes('cap')) return (
            <g>
                <path d="M 65 60 Q 125 -10 185 60" fill={color} />
                <rect x="60" y="55" width="130" height="10" rx="2" fill={color} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                <path d="M 60 60 L 40 65 L 60 70 Z" fill={color} /> {/* Visor side? simplified */}
                <path d="M 60 60 Q 125 40 190 60 L 190 65 Q 125 45 60 65 Z" fill="#1D4ED8" /> {/* Visor */}
            </g>
        );
        if (headItem.id.includes('ears')) return (
            <g>
                <path d="M 85 40 L 80 10 Q 95 0 105 10 L 100 40 Z" fill="white" stroke="#FBCFE8" strokeWidth="2" />
                <path d="M 165 40 L 170 10 Q 155 0 145 10 L 150 40 Z" fill="white" stroke="#FBCFE8" strokeWidth="2" />
                <ellipse cx="92" cy="25" rx="5" ry="15" fill="#FBCFE8" />
                <ellipse cx="158" cy="25" rx="5" ry="15" fill="#FBCFE8" />
            </g>
        );
        if (headItem.id.includes('flower')) return (
            <g transform="translate(160, 50)">
                 <circle cx="0" cy="0" r="15" fill="#F472B6" />
                 <circle cx="0" cy="0" r="5" fill="#FCD34D" />
                 <path d="M 0 -15 L 0 -20" stroke="green" strokeWidth="2" />
            </g>
        );
        if (headItem.id.includes('wizard')) return (
            <g transform="translate(0, -15)">
                 <path d="M 65 60 Q 125 65 185 60 L 125 -30 Z" fill={color} />
                 <ellipse cx="125" cy="60" rx="60" ry="10" fill="#5B21B6" />
                 <path d="M 90 40 L 100 35 L 95 45 Z" fill="#FCD34D" />
                 <path d="M 140 10 L 150 5 L 145 15 Z" fill="#FCD34D" />
            </g>
        );
        return null;
    };

    const renderFaceWear = () => {
        if (!faceItem) return null;
        if (faceItem.id.includes('glasses')) return (
            <g transform="translate(0, 5)">
                <rect x="85" y="75" width="38" height="22" rx="8" fill="#1F2937" opacity="0.9" />
                <rect x="127" y="75" width="38" height="22" rx="8" fill="#1F2937" opacity="0.9" />
                <line x1="123" y1="86" x2="127" y2="86" stroke="#1F2937" strokeWidth="3" />
                <path d="M 85 80 L 75 75" stroke="#1F2937" strokeWidth="2" />
                <path d="M 165 80 L 175 75" stroke="#1F2937" strokeWidth="2" />
                {/* Glare */}
                <path d="M 90 80 L 110 90" stroke="white" strokeWidth="1" opacity="0.3" />
            </g>
        );
        if (faceItem.id.includes('mask')) return (
             <g>
                <path d="M 75 85 Q 125 115 175 85 L 175 75 Q 125 95 75 75 Z" fill={faceItem.color || '#4B5563'} />
                <path d="M 75 80 L 70 75" stroke="white" strokeWidth="1"/>
                <path d="M 175 80 L 180 75" stroke="white" strokeWidth="1"/>
             </g>
        );
        return null;
    };

    const renderHandProp = () => {
        if (!handItem) return null;
        
        // Rendered in Right Hand
        return (
            <g transform="translate(200, 160) rotate(-15)">
                 {handItem.id.includes('wand') && (
                     <g>
                        <rect x="-2" y="0" width="4" height="50" fill="#FCD34D" />
                        <path d="M 0 0 L 10 -10 L 0 -20 L -10 -10 Z" fill="#3B82F6" filter="url(#glow)"/>
                     </g>
                 )}
                 {handItem.id.includes('sword') && (
                     <g transform="translate(0, -20)">
                         <rect x="-3" y="0" width="6" height="60" fill="#D1D5DB" />
                         <rect x="-10" y="45" width="20" height="4" fill="#4B5563" />
                         <circle cx="0" cy="60" r="4" fill="#4B5563" />
                     </g>
                 )}
                 {handItem.id.includes('balloon') && (
                      <g transform="translate(0, -40)">
                          <line x1="0" y1="40" x2="0" y2="80" stroke="black" opacity="0.5" />
                          <path d="M 0 40 Q 25 10 0 -10 Q -25 10 0 40" fill={handItem.color || '#EF4444'} />
                      </g>
                 )}
                 {handItem.id.includes('bear') && (
                     <g transform="scale(0.6) translate(-20, 0)">
                         <circle cx="0" cy="0" r="20" fill="#D97706" />
                         <circle cx="-15" cy="-15" r="8" fill="#D97706" />
                         <circle cx="15" cy="-15" r="8" fill="#D97706" />
                         <circle cx="-5" cy="-5" r="2" fill="black" />
                         <circle cx="5" cy="-5" r="2" fill="black" />
                         <ellipse cx="0" cy="5" rx="6" ry="4" fill="#FEF3C7" />
                     </g>
                 )}
            </g>
        );
    };

    return (
        <svg viewBox="0 0 250 320" className="w-full h-full drop-shadow-2xl">
            <Gradients />
            {renderWings()}
            {renderBodyBase()}
            {renderClothes()}
            {renderArms()}
            {renderHeadBase()}
            {renderDefaultHair()}
            {renderFaceFeatures()}
            {renderFaceWear()}
            {renderHeadWear()}
            {renderHandProp()}
        </svg>
    );
};

export const AvatarView: React.FC<AvatarViewProps> = ({ avatar, balance, onBuy, onEquip, theme }) => {
    const [activeCategory, setActiveCategory] = useState<string>('head');

    const categories = [
        { id: 'head', label: '头饰', icon: '🧢' },
        { id: 'body', label: '衣服', icon: '👕' },
        { id: 'back', label: '背饰', icon: '🧚‍♀️' },
        { id: 'hand', label: '道具', icon: '🪄' },
        { id: 'face', label: '脸饰', icon: '👓' },
    ];

    const filteredItems = AVATAR_ITEMS.filter(item => item.type === activeCategory);

    return (
        <div className="pb-24 animate-slide-up">
             {/* Avatar Preview Area */}
            <div className={`relative mx-4 mt-4 mb-6 rounded-[2.5rem] bg-gradient-to-b from-blue-50 via-purple-50 to-white shadow-inner border-4 border-white overflow-hidden h-80 flex items-center justify-center group`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                {/* Avatar with floating animation */}
                <div className="w-72 h-full relative z-10 transform translate-y-6 group-hover:scale-105 transition-transform duration-500 ease-in-out">
                     <div className="animate-[float_4s_ease-in-out_infinite]">
                        <AvatarRender config={avatar.config} />
                     </div>
                </div>
                
                {/* Magic Sparkles */}
                <Sparkles className="absolute top-12 left-12 text-yellow-400 animate-pulse drop-shadow-lg" size={32} />
                <Sparkles className="absolute bottom-24 right-12 text-pink-400 animate-bounce drop-shadow-lg" size={24} style={{ animationDelay: '1s', animationDuration: '2s' }} />
                <Star className="absolute top-20 right-20 text-sky-300 animate-pulse" size={16} />
            </div>

            {/* Shop Area */}
            <div className="bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] min-h-[400px] p-6 relative z-20">
                <div className="flex items-center justify-between mb-6">
                     <h2 className={`text-xl font-cute flex items-center ${theme.accent}`}>
                        <span className={`${theme.light} p-2 rounded-xl mr-3 shadow-sm rotate-3`}><ShoppingBag className={`w-5 h-5 ${theme.accent}`} /></span>
                        百变衣橱
                    </h2>
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar max-w-[60%]">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-bold transition-all border-2 ${
                                    activeCategory === cat.id 
                                    ? `${theme.bg} ${theme.border} ${theme.accent} shadow-sm scale-105` 
                                    : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                                <span className="mr-1">{cat.icon}</span> {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pb-10">
                    {filteredItems.map(item => {
                        const isOwned = avatar.ownedItems.includes(item.id);
                        const isEquipped = avatar.config[item.type as keyof AvatarState['config']] === item.id;
                        const canAfford = balance >= item.cost;

                        return (
                            <div 
                                key={item.id}
                                onClick={() => isOwned ? onEquip(item) : onBuy(item)}
                                className={`
                                    relative flex flex-col items-center p-3 rounded-3xl border-2 transition-all duration-300 cursor-pointer group
                                    ${isEquipped 
                                        ? `border-${theme.accent.split('-')[1]}-400 bg-white shadow-lg ring-2 ring-${theme.accent.split('-')[1]}-100 scale-[1.02]` 
                                        : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-md'
                                    }
                                `}
                            >
                                <div className="text-5xl mb-3 drop-shadow-md transform group-hover:scale-110 transition-transform">{item.icon}</div>
                                <div className="text-xs font-bold text-slate-600 mb-3 text-center leading-tight h-8 flex items-center justify-center w-full px-1">
                                    {item.name}
                                </div>
                                
                                {isOwned ? (
                                    <div className={`w-full py-2 rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1 ${isEquipped ? `${theme.button} text-white shadow-md` : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'}`}>
                                        {isEquipped ? <Check size={12} strokeWidth={3}/> : '穿戴'}
                                        {isEquipped && '已穿戴'}
                                    </div>
                                ) : (
                                    <div className={`w-full py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1 transition-colors ${canAfford ? 'bg-amber-400 text-white shadow-orange-100 shadow-md group-hover:bg-amber-500' : 'bg-slate-200 text-slate-400'}`}>
                                        {item.cost} <Star size={10} fill="currentColor" />
                                    </div>
                                )}

                                {!isOwned && !canAfford && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-3xl flex items-center justify-center z-10">
                                        <div className="bg-slate-800/80 text-white p-2 rounded-full">
                                            <Lock size={16} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

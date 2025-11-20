import React, { useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Text, SoftShadows, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { Theme } from '../../styles/themes';
import { Transaction } from '../../types';
import { Sprout, Trees, Maximize, Info, Loader2 } from 'lucide-react';

// Augment JSX namespace to satisfy R3F elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      ambientLight: any;
      directionalLight: any;
      hemisphereLight: any;
      planeGeometry: any;
      fog: any;
      shadowMaterial: any;
      color: any;
    }
  }
}

// Augment React.JSX for newer React types
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      ambientLight: any;
      directionalLight: any;
      hemisphereLight: any;
      planeGeometry: any;
      fog: any;
      shadowMaterial: any;
      color: any;
    }
  }
}

interface GardenViewProps {
  transactions: Transaction[];
  theme: Theme;
}

// --- 3D Components (Voxel Style) ---

const VoxelTree = ({ position, scale = 1, type = 0 }: { position: [number, number, number], scale?: number, type?: number }) => {
    const group = useRef<any>(null);
    // Random wobble
    useFrame(({ clock }) => {
        if(group.current) {
            group.current.rotation.z = Math.sin(clock.getElapsedTime() + position[0]) * 0.03;
        }
    });

    const color = type === 0 ? "#4CAF50" : type === 1 ? "#66BB6A" : "#81C784";
    const trunkHeight = 1 * scale;

    return (
        <group ref={group} position={position}>
             {/* Trunk */}
             <mesh position={[0, trunkHeight/2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.2 * scale, trunkHeight, 0.2 * scale]} />
                <meshStandardMaterial color="#795548" />
             </mesh>
             {/* Leaves - Bottom Layer */}
             <mesh position={[0, trunkHeight * 0.8, 0]} castShadow>
                <boxGeometry args={[0.8 * scale, 0.4 * scale, 0.8 * scale]} />
                <meshStandardMaterial color={color} />
             </mesh>
             {/* Leaves - Top Layer */}
             <mesh position={[0, trunkHeight * 1.1, 0]} castShadow>
                 <boxGeometry args={[0.5 * scale, 0.5 * scale, 0.5 * scale]} />
                 <meshStandardMaterial color={color} />
             </mesh>
        </group>
    );
};

const VoxelFlower = ({ position, color }: { position: [number, number, number], color: string }) => {
    const group = useRef<any>(null);
    useFrame(({ clock }) => {
        if(group.current) {
             group.current.rotation.y = Math.sin(clock.getElapsedTime() * 2 + position[0]) * 0.1;
        }
    });

    return (
        <group ref={group} position={position}>
             {/* Stem */}
             <mesh position={[0, 0.15, 0]}>
                 <boxGeometry args={[0.05, 0.3, 0.05]} />
                 <meshStandardMaterial color="#8BC34A" />
             </mesh>
             {/* Petals */}
             <mesh position={[0, 0.3, 0]}>
                 <boxGeometry args={[0.2, 0.2, 0.05]} />
                 <meshStandardMaterial color={color} />
             </mesh>
             <mesh position={[0, 0.3, 0]}>
                 <boxGeometry args={[0.05, 0.2, 0.2]} />
                 <meshStandardMaterial color={color} />
             </mesh>
             {/* Center */}
             <mesh position={[0, 0.3, 0.03]}>
                 <boxGeometry args={[0.08, 0.08, 0.08]} />
                 <meshStandardMaterial color="#FFF59D" />
             </mesh>
        </group>
    );
};

const VoxelRabbit = ({ position }: { position: [number, number, number] }) => {
    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
            <group position={position}>
                {/* Body */}
                <mesh position={[0, 0.2, 0]} castShadow>
                    <boxGeometry args={[0.4, 0.35, 0.5]} />
                    <meshStandardMaterial color="#FFFFFF" />
                </mesh>
                {/* Head */}
                <mesh position={[0, 0.45, 0.2]} castShadow>
                    <boxGeometry args={[0.3, 0.3, 0.3]} />
                    <meshStandardMaterial color="#FFFFFF" />
                </mesh>
                {/* Ears */}
                <mesh position={[-0.1, 0.7, 0.2]} castShadow>
                    <boxGeometry args={[0.08, 0.3, 0.08]} />
                    <meshStandardMaterial color="#FCE4EC" />
                </mesh>
                <mesh position={[0.1, 0.7, 0.2]} castShadow>
                    <boxGeometry args={[0.08, 0.3, 0.08]} />
                    <meshStandardMaterial color="#FCE4EC" />
                </mesh>
                 {/* Tail */}
                 <mesh position={[0, 0.15, -0.3]} castShadow>
                    <boxGeometry args={[0.1, 0.1, 0.1]} />
                    <meshStandardMaterial color="#EEEEEE" />
                </mesh>
            </group>
        </Float>
    );
};

const VoxelDuck = ({ position }: { position: [number, number, number] }) => {
    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
            <group position={position}>
                {/* Body */}
                <mesh position={[0, 0.2, 0]} castShadow>
                    <boxGeometry args={[0.3, 0.25, 0.4]} />
                    <meshStandardMaterial color="#FFEB3B" />
                </mesh>
                {/* Head */}
                <mesh position={[0, 0.45, 0.15]} castShadow>
                    <boxGeometry args={[0.2, 0.2, 0.2]} />
                    <meshStandardMaterial color="#FFEB3B" />
                </mesh>
                {/* Beak */}
                <mesh position={[0, 0.45, 0.3]}>
                    <boxGeometry args={[0.1, 0.05, 0.15]} />
                    <meshStandardMaterial color="#FF9800" />
                </mesh>
                {/* Wings */}
                <mesh position={[0.18, 0.2, 0]}>
                     <boxGeometry args={[0.05, 0.15, 0.25]} />
                     <meshStandardMaterial color="#FDD835" />
                </mesh>
                <mesh position={[-0.18, 0.2, 0]}>
                     <boxGeometry args={[0.05, 0.15, 0.25]} />
                     <meshStandardMaterial color="#FDD835" />
                </mesh>
            </group>
        </Float>
    );
};

const LoadingScreen = () => {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="flex flex-col items-center justify-center bg-white/90 p-4 rounded-2xl shadow-lg backdrop-blur-sm">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
                <span className="font-bold text-emerald-700 text-xs">{progress.toFixed(0)}% 加载中...</span>
            </div>
        </Html>
    );
};

// --- Scene Logic ---

const GardenScene = ({ growthScore }: { growthScore: number }) => {
    const items = useMemo(() => {
        const generated = [];
        // Limit max items for performance
        const density = Math.min(60, 5 + Math.floor(growthScore / 8));
        const seed = 12345; // Fixed seed for stability

        const random = (x: number) => {
            const n = Math.sin(x * 12.9898 + seed) * 43758.5453;
            return n - Math.floor(n);
        };
        
        // Always generate base terrain items
        for (let i = 0; i < density; i++) {
            const r1 = random(i * 1.1);
            const r2 = random(i * 2.2);
            const angle = r1 * Math.PI * 2;
            const radius = 2 + (r2 * 14); // Distribute from radius 2 to 16
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            let type = 'flower';
            const scale = 0.8 + random(i * 3) * 0.4;

            // Progression Logic
            if (growthScore >= 0) {
                type = random(i * 4) > 0.5 ? 'flower_1' : 'flower_2';
            }
            if (growthScore > 50 && random(i * 5) > 0.7) {
                 type = 'tree_small';
            }
            if (growthScore > 150 && random(i * 6) > 0.8) {
                 type = 'tree_big';
            }
            if (growthScore > 300 && i % 12 === 0) {
                 type = 'rabbit';
            }
            if (growthScore > 500 && i % 15 === 0) {
                 type = 'duck';
            }

            generated.push({ id: i, x, z, type, scale });
        }
        return generated;
    }, [growthScore]);

    return (
        <>
            <color attach="background" args={['#E0F7FA']} />
            
            {/* Lights */}
            <ambientLight intensity={0.6} />
            <directionalLight 
                position={[10, 20, 5]} 
                intensity={1.2} 
                castShadow 
                shadow-mapSize={[1024, 1024]}
            />
            <hemisphereLight args={['#81C784', '#388E3C', 0.4]} />
            
            {/* Fog */}
            <fog attach="fog" args={['#E0F7FA', 10, 40]} />

            {/* Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#AED581" />
            </mesh>
            
            {/* Center Podium */}
            <mesh position={[0, 0.05, 0]} receiveShadow>
                <boxGeometry args={[3, 0.1, 3]} />
                <meshStandardMaterial color="#C5E1A5" />
            </mesh>

            {/* Items */}
            {items.map((item) => (
                <group key={item.id} position={[item.x, 0, item.z]}>
                    {item.type === 'flower_1' && <VoxelFlower position={[0, 0, 0]} color="#F48FB1" />}
                    {item.type === 'flower_2' && <VoxelFlower position={[0, 0, 0]} color="#FFF59D" />}
                    {item.type === 'tree_small' && <VoxelTree position={[0, 0, 0]} scale={1.2} type={0} />}
                    {item.type === 'tree_big' && <VoxelTree position={[0, 0, 0]} scale={2} type={1} />}
                    {item.type === 'rabbit' && <VoxelRabbit position={[0, 0, 0]} />}
                    {item.type === 'duck' && <VoxelDuck position={[0, 0, 0]} />}
                </group>
            ))}

            {/* Title Text in 3D Space */}
            <Float position={[0, 3, 0]} speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
                <Text
                    font="https://fonts.gstatic.com/s/notosans/v27/o-0IIpQlx3QUlC5A4PNr5TRA.woff"
                    fontSize={0.5}
                    color="#33691E"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="white"
                >
                    {growthScore > 0 ? `${growthScore} 繁荣度` : "开始你的花园!"}
                </Text>
            </Float>
        </>
    );
};

export const GardenView: React.FC<GardenViewProps> = ({ transactions, theme }) => {
  const growthScore = useMemo(() => {
      return transactions
        .filter(t => t.amount > 0)
        .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  return (
    <div className="py-4 animate-slide-up pb-28 relative">
       
       {/* Header */}
       <div className="px-4 mb-4 flex justify-between items-end">
           <div>
                <h2 className={`text-xl font-cute flex items-center gap-2 ${theme.accent} drop-shadow-sm`}>
                    <Trees className="w-6 h-6" /> 3D 像素花园
                </h2>
                <p className="text-xs text-slate-400 mt-1">每一个好习惯，都能让花园更茂盛！</p>
           </div>
       </div>

       {/* WebGL Canvas Container - Fixed height to ensure rendering */}
       <div className="relative w-full h-[450px] rounded-[2.5rem] shadow-xl overflow-hidden mx-auto border-4 border-white bg-slate-50">
           
           <Canvas shadows camera={{ position: [0, 8, 12], fov: 45 }} dpr={[1, 2]}>
                <Suspense fallback={<LoadingScreen />}>
                    <SoftShadows size={5} samples={8} />
                    <GardenScene growthScore={growthScore} />
                    <OrbitControls 
                        enablePan={false} 
                        minPolarAngle={0} 
                        maxPolarAngle={Math.PI / 2 - 0.1} 
                        minDistance={5}
                        maxDistance={25}
                        autoRotate
                        autoRotateSpeed={0.8}
                    />
                </Suspense>
           </Canvas>

           <div className="absolute bottom-3 right-4 pointer-events-none">
                <span className="text-[10px] bg-white/80 text-slate-500 px-2 py-1 rounded-full backdrop-blur-md shadow-sm">
                    <Maximize size={12} className="inline mr-1"/> 360° 可旋转
                </span>
           </div>
       </div>

       {/* Legend */}
       <div className="mt-6 mx-4 bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
                <Info size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">生态解锁进度</span>
            </div>
            
            <div className="flex justify-between px-2">
                {[
                    { icon: <Sprout size={20} />, score: 0, label: '花草' },
                    { icon: <Trees size={20} />, score: 50, label: '树木' },
                    { icon: '🐇', score: 300, label: '小兔' },
                    { icon: '🦆', score: 500, label: '小鸭' },
                ].map((tier, i) => {
                    const unlocked = growthScore >= tier.score;
                    return (
                        <div key={tier.label} className="flex flex-col items-center gap-1">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${unlocked ? 'bg-emerald-100 text-emerald-600 shadow-sm scale-100' : 'bg-slate-50 text-slate-300 grayscale scale-90'}`}>
                                {typeof tier.icon === 'string' ? tier.icon : tier.icon}
                            </div>
                            <span className={`text-[10px] font-bold ${unlocked ? 'text-emerald-600' : 'text-slate-300'}`}>{tier.label}</span>
                            {!unlocked && <span className="text-[9px] text-slate-300">{tier.score}</span>}
                        </div>
                    )
                })}
            </div>
       </div>
    </div>
  );
};
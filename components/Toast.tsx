
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: {
      bg: 'bg-lime-500',
      icon: <CheckCircle2 className="text-white w-6 h-6" strokeWidth={2.5} />,
      border: 'border-lime-600'
    },
    error: {
      bg: 'bg-rose-500',
      icon: <AlertCircle className="text-white w-6 h-6" strokeWidth={2.5} />,
      border: 'border-rose-600'
    },
    info: {
      bg: 'bg-sky-500',
      icon: <Info className="text-white w-6 h-6" strokeWidth={2.5} />,
      border: 'border-sky-600'
    }
  };

  const currentStyle = styles[type];

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
      <div className={`
        pointer-events-auto
        flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] 
        text-white font-bold tracking-wide animate-slide-down
        ${currentStyle.bg} border-b-4 ${currentStyle.border}
      `}>
        {currentStyle.icon}
        <span className="text-base drop-shadow-sm font-cute tracking-wider">{message}</span>
        <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={16} />
        </button>
      </div>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down { animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

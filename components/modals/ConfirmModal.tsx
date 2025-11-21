import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, title, message, onConfirm, onCancel, confirmText = '确定', cancelText = '取消', isDanger = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-6 border-4 border-white animate-pop">
        <div className={`flex flex-col items-center text-center`}>
          <div className={`p-4 rounded-full mb-4 ${isDanger ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-500'}`}>
            <AlertTriangle size={32} strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">{title}</h3>
          <p className="text-slate-500 mb-6 leading-relaxed text-sm">{message}</p>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                  onConfirm();
                  onCancel(); // Close modal after confirm
              }}
              className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
                isDanger 
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                  : 'bg-amber-400 hover:bg-amber-500 shadow-amber-200'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
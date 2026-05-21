import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#333] shadow-xl w-80 max-w-[90vw] flex flex-col">
        <div className="flex justify-between items-center p-3 border-b border-[#333] bg-[#0a0a0a]">
          <h3 className="text-[12px] uppercase tracking-wider text-[#888] font-bold">{title}</h3>
          <button onClick={onClose} className="text-[#888] hover:text-white transition-colors">&times;</button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
};

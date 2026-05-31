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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fb-black/60 backdrop-blur-sm">
      <div className="bg-fb-bg-3 border border-fb-border shadow-xl w-80 max-w-[90vw] flex flex-col">
        <div className="flex justify-between items-center p-3 border-b border-fb-border bg-fb-bg">
          <h3 className="text-[12px] uppercase tracking-wider text-fb-text-4 font-bold">{title}</h3>
          <button onClick={onClose} className="text-fb-text-4 hover:text-fb-white transition-colors">&times;</button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
};

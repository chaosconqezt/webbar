import React from 'react';
import { Track } from '../types';

interface StatusBarProps {
  tracksCount: number;
  selectedPath: string | null;
  currentMetaTrack: Track | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  tracksCount, 
  selectedPath, 
  currentMetaTrack 
}) => {
  return (
    <footer className="h-6 flex items-center px-3 justify-between bg-[#0a0a0a] text-[#444444] text-[9px] border-t border-[#1a1a1a] shrink-0">
      <div className="flex gap-3">
        <span>{tracksCount} tracks in folder</span>
        <span className="opacity-30">|</span>
        <span>Selected path: {selectedPath || 'None'}</span>
      </div>
      <div className="flex gap-3">
          {currentMetaTrack && (
            <>
              <span className="text-[#666]">{currentMetaTrack.artist} - {currentMetaTrack.title}</span>
              <span className="opacity-30">|</span>
              <span>{currentMetaTrack.sampleRate} Hz</span>
              <span className="opacity-30">|</span>
              <span>{currentMetaTrack.fileName}</span>
            </>
          )}
      </div>
    </footer>
  );
};

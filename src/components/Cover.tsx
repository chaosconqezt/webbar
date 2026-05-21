import React from 'react';
import { Track } from '../types';

interface CoverProps {
  playingTrack: Track | null;
  selectedPath: string | null;
}

export const Cover: React.FC<CoverProps> = ({ playingTrack, selectedPath }) => {
  const finalPath = (playingTrack && playingTrack.path) || selectedPath || '';
  if (!finalPath) return <div className="w-[200px] h-full relative overflow-hidden border-l border-[#333333] bg-black"></div>;

  return (
    <div className="w-[200px] h-full relative overflow-hidden border-l border-[#333333] bg-black">
      <img 
        key={finalPath}
        src={`/api/cover?path=${encodeURIComponent(finalPath)}&t=${Date.now()}`}
        className="absolute inset-0 w-full h-full object-contain z-10"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-[#444444] bg-[#0d0d0d] relative z-0">
        <div className="mb-2 opacity-50">ALBUM ART</div>
        <div className="text-[60px] leading-none opacity-10 font-bold">
          {playingTrack?.artist?.substring(0, 2)?.toUpperCase() || '..'}
        </div>
      </div>
    </div>
  );
};

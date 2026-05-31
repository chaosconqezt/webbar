import React, { useState, useEffect } from 'react';
import { Track } from '../types';

interface CoverProps {
  playingTrack: Track | null;
  selectedPath: string | null;
}

export const Cover: React.FC<CoverProps> = ({ playingTrack, selectedPath }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const finalPath = (playingTrack && playingTrack.path) || selectedPath || '';

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [finalPath]);

  if (!finalPath) return <div className="aspect-square h-full shrink-0 border-l border-fb-border bg-fb-black"></div>;

  return (
    <div className={`h-full relative overflow-hidden border-l border-fb-border bg-fb-bg-2 shrink-0 flex items-center justify-center ${error || !loaded ? 'aspect-square' : ''}`}>
      {!error && (
        <img 
          key={finalPath}
          src={`/api/cover?path=${encodeURIComponent(finalPath)}&t=${Date.now()}`}
          className={`h-full w-auto max-w-none block relative z-10 transition-opacity duration-300 ${!loaded ? 'opacity-0 absolute aspect-square' : 'opacity-100'}`}
          onError={() => {
            setError(true);
            setLoaded(true);
          }}
          onLoad={() => setLoaded(true)}
        />
      )}
      {(!loaded || error) && (
        <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center text-[10px] text-fb-text-7 z-0">
          <div className="mb-2 opacity-50">ALBUM ART</div>
          <div className="text-[60px] leading-none opacity-10 font-bold">
            {playingTrack?.artist?.substring(0, 2)?.toUpperCase() || '..'}
          </div>
        </div>
      )}
    </div>
  );
};

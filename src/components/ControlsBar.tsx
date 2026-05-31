import React from 'react';
import { RefreshCw, Moon, Sun } from 'lucide-react';
import { Track } from '../types';

interface ControlsBarProps {
  isPlaying: boolean;
  shuffle: boolean;
  volume: number;
  currentTime: number;
  progress: number;
  playingTrack: Track | null;
  refreshKey: number;
  isTreeEmpty: boolean;
  theme: 'light' | 'dark';
  onStop: () => void;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onVolumeChange: (e: React.MouseEvent<HTMLDivElement>) => void;
  onProgressChange: (e: React.MouseEvent<HTMLDivElement>) => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  isPlaying,
  shuffle,
  volume,
  currentTime,
  progress,
  playingTrack,
  refreshKey,
  isTreeEmpty,
  theme,
  onStop,
  onPlayPause,
  onPrev,
  onNext,
  onToggleShuffle,
  onVolumeChange,
  onProgressChange,
  onRefresh,
  onToggleTheme,
}) => {
  return (
    <header className="h-12 flex items-center px-4 bg-fb-bg-2 border-b border-fb-border shrink-0 z-20 gap-4">
      {/* Main Controls */}
      <div className="flex gap-0.5 shrink-0">
        <button 
          onClick={onStop}
          className="w-9 h-9 flex items-center justify-center hover:bg-fb-bg-4 transition-colors group"
          title="Stop"
        >
          <div className="w-3.5 h-3.5 bg-gradient-to-br from-fb-text-4 to-fb-text-7 rounded-sm group-active:scale-95 shadow-sm" />
        </button>
        
        <button 
          onClick={() => { if(!isPlaying) onPlayPause(); }}
          className={`w-9 h-9 flex items-center justify-center hover:bg-fb-bg-4 transition-colors group ${isPlaying ? 'opacity-30' : ''}`}
          title="Play"
        >
          <div className="w-0 h-0 border-t-[7px] border-t-transparent border-l-[11px] border-l-fb-text-4 border-b-[7px] border-b-transparent ml-1 group-active:scale-95" />
        </button>

        <button 
          onClick={() => { if(isPlaying) onPlayPause(); }}
          className={`w-9 h-9 flex items-center justify-center hover:bg-fb-bg-4 transition-colors group ${!isPlaying ? 'opacity-30' : ''}`}
          title="Pause"
        >
          <div className="flex gap-1 group-active:scale-95">
            <div className="w-1.5 h-4 bg-gradient-to-b from-fb-text-4 to-fb-text-7" />
            <div className="w-1.5 h-4 bg-gradient-to-b from-fb-text-4 to-fb-text-7" />
          </div>
        </button>

        <button 
          onClick={onPrev}
          className="w-9 h-9 flex items-center justify-center hover:bg-fb-bg-4 transition-colors group"
          title="Previous"
        >
          <div className="flex items-center group-active:scale-95">
            <div className="w-1 h-3.5 bg-fb-text-4" />
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-r-[9px] border-r-fb-text-4 border-b-[6px] border-b-transparent" />
          </div>
        </button>

        <button 
          onClick={onNext}
          className="w-9 h-9 flex items-center justify-center hover:bg-fb-bg-4 transition-colors group"
          title="Next"
        >
          <div className="flex items-center group-active:scale-95">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[9px] border-l-fb-text-4 border-b-[6px] border-b-transparent" />
            <div className="w-1 h-3.5 bg-fb-text-4" />
          </div>
        </button>

        <button 
          onClick={onToggleShuffle}
          className={`w-9 h-9 flex items-center justify-center hover:bg-fb-bg-4 transition-colors group relative ${shuffle ? 'bg-fb-bg-4 opacity-100' : 'opacity-60 hover:opacity-100'}`}
          title="Random (Shuffle)"
        >
          <div className="flex items-center group-active:scale-95">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[9px] border-l-fb-text-4 border-b-[6px] border-b-transparent" />
            <span className={`text-[10px] ml-0.5 mt-[-2px] font-bold ${shuffle ? 'text-fb-accent' : 'text-fb-text-4'}`}>?</span>
          </div>
        </button>
      </div>

      {/* Volume */}
      <div className="w-24 shrink-0 flex items-center gap-2 group">
          <div className="text-[9px] text-fb-text-7 font-bold">VOL</div>
          <div 
            className="h-1 bg-fb-bg-4 flex-1 relative overflow-hidden rounded-full cursor-pointer"
            onClick={onVolumeChange}
          >
            <div 
              className="absolute left-0 top-0 h-full bg-fb-text-4 w-full" 
              style={{ width: `${volume * 100}%` }}
            />
          </div>
      </div>

      {/* Separator */}
      <div className="w-[1px] h-6 bg-fb-bg-5 shrink-0 mx-1" />

      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="text-[10px] text-fb-text-6 font-mono shrink-0">
          {currentTime > 0
            ? `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}` 
            : '0:00'}
        </div>
        
        <div 
          className="flex-1 h-3 bg-fb-bg-3 relative cursor-pointer group border border-fb-border-4 rounded-sm overflow-hidden"
          onClick={onProgressChange}
        >
          <div 
            className="absolute left-0 top-0 h-full bg-fb-accent shadow-[inset_0_0_8px_rgba(255,255,255,0.1)] transition-all duration-100" 
            style={{ width: `${progress}%` }}
          />
          {/* Hover indicator */}
          <div className="absolute top-0 h-full w-0.5 bg-white opacity-0 group-hover:opacity-30 transition-opacity" style={{ left: `${progress}%` }} />
        </div>

        <div className="text-[10px] text-fb-text-6 font-mono shrink-0">
          {playingTrack ? playingTrack.duration : '0:00'}
        </div>
      </div>

      <button onClick={onRefresh} title="Rescan Library" className="hover:text-fb-white opacity-40 hover:opacity-100 transition-opacity shrink-0 ml-2">
        <RefreshCw size={14} className={refreshKey > 0 && isTreeEmpty ? "animate-spin" : ""} />
      </button>

      <div className="w-[1px] h-6 bg-fb-bg-5 shrink-0 mx-1" />

      <button onClick={onToggleTheme} title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`} className="hover:text-fb-white opacity-40 hover:opacity-100 transition-opacity shrink-0">
        {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
      </button>
    </header>
  );
};

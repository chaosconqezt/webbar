import React from 'react';
import { Track } from '../types';

interface TrackTableProps {
  tracks: Track[];
  selectedTracks: Track[];
  playingTrack: Track | null;
  isPlaying: boolean;
  onSelectTrack: (track: Track, idx: number, e: React.MouseEvent) => void;
  onPlayTrack: (track: Track) => void;
  onTrackAction?: (action: 'delete', tracks: Track[]) => void;
}

export const TrackTable: React.FC<TrackTableProps> = ({
  tracks,
  selectedTracks,
  playingTrack,
  isPlaying,
  onSelectTrack,
  onPlayTrack,
  onTrackAction,
}) => {
  const isAllSelected = selectedTracks.length > 0 && selectedTracks.length === tracks.length;

  return (
    <section className="flex-1 overflow-hidden flex flex-col bg-[#0a0a0a]">
      {/* Table Header */}
      <div className="grid grid-cols-[30px_50px_1.5fr_2fr_1.5fr_80px_80px] border-b border-[#333333] bg-[#111111] text-[#888888] font-bold px-2 py-1 shrink-0">
          <span className="text-center"></span>
          <span className="text-right pr-2">#</span>
          <span>Artist</span>
          <span>Title</span>
          <span>Album</span>
          <span className="text-right">Length</span>
          <span className="text-center">Date</span>
      </div>
      
      {/* Table Body */}
      <div className="flex-1 overflow-y-auto leading-[20px]">
        {tracks.length > 0 ? tracks.map((track, idx) => {
          const isSelected = selectedTracks.some(t => t.path === track.path);
          const isCurrentPlaying = playingTrack?.path === track.path;
          
          return (
              <div 
              key={idx} 
              draggable
              onDragStart={(e) => {
                // If dragging a selected track, pass all selected paths
                if (isSelected && selectedTracks.length > 1) {
                  e.dataTransfer.setData('sourcePath', JSON.stringify(selectedTracks.map(t => t.path)));
                  e.dataTransfer.setData('type', 'files');
                } else {
                  e.dataTransfer.setData('sourcePath', track.path);
                  e.dataTransfer.setData('type', 'file');
                }
              }}
              className={`group grid grid-cols-[30px_50px_1.5fr_2fr_1.5fr_80px_80px] px-2 border-b border-[#1a1a1a] ${isSelected ? 'bg-[#222222] text-white' : 'hover:bg-[#1a1a1a] cursor-grab active:cursor-grabbing'}`}
              onMouseDown={(e) => {
                onSelectTrack(track, idx, e);
              }}
              onDoubleClick={() => {
                onPlayTrack(track);
              }}
              onContextMenu={(e) => {
                if (onTrackAction) {
                  e.preventDefault();
                  // If right-clicking on a currently selected track, apply action to all selected
                  if (isSelected && selectedTracks.length > 1) {
                    onTrackAction('delete', selectedTracks);
                  } else {
                    onTrackAction('delete', [track]);
                  }
                }
              }}
            >
              <span className="flex justify-center items-center text-[#ff9900]">
                {isCurrentPlaying ? (isPlaying ? '▶' : '⏸') : ''}
              </span>
              <span className={`text-right pr-2 ${isSelected ? '' : 'opacity-60'}`}>
                {track.trackNo}
              </span>
              <span className="truncate pr-2">
                {track.artist}
              </span>
              <span className="truncate pr-2">
                  {track.title}
              </span>
              <span className={`truncate pr-2 ${isSelected ? '' : 'opacity-80'}`}>
                {track.album}
              </span>
              <span className={`text-right pr-2 ${isSelected ? '' : 'opacity-80'}`}>
                {track.duration}
              </span>
              <span className={`text-center ${isSelected ? '' : 'opacity-60'} relative group-hover:hidden`}>
                {track.date}
              </span>
              <span className="text-center hidden group-hover:flex justify-end pr-2 gap-2 text-[#ff2222] items-center">
                 <button onClick={(e) => {
                   e.stopPropagation();
                   if (onTrackAction) {
                     if (isSelected && selectedTracks.length > 1) {
                       onTrackAction('delete', selectedTracks);
                     } else {
                       onTrackAction('delete', [track]);
                     }
                   }
                 }} title="Delete Track">✕</button>
              </span>
            </div>
          );
        }) : (
          <div className="p-4 text-[#555] italic">Folder is empty or contains no supported audio files.</div>
        )}
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { Track } from '../types';

export type SortConfig = { key: keyof Track; direction: 'asc' | 'desc' } | null;

interface TrackTableProps {
  tracks: Track[];
  selectedTracks: Track[];
  playingTrack: Track | null;
  isPlaying: boolean;
  sortConfig: SortConfig;
  onRequestSort: (key: keyof Track) => void;
  isAdmin?: boolean;
  onSelectTrack: (track: Track, idx: number, e: React.MouseEvent) => void;
  onPlayTrack: (track: Track) => void;
  onTrackAction?: (action: 'delete', tracks: Track[]) => void;
}

export const TrackTable: React.FC<TrackTableProps> = ({
  tracks,
  selectedTracks,
  playingTrack,
  isPlaying,
  sortConfig,
  onRequestSort,
  isAdmin,
  onSelectTrack,
  onPlayTrack,
  onTrackAction,
}) => {
  const isAllSelected = selectedTracks.length > 0 && selectedTracks.length === tracks.length;

  const renderSortArrow = (key: keyof Track) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Resizable columns state - using fixed pixels, with title taking minmax(auto, 1fr) so it stretches
  const [widths, setWidths] = useState([30, 50, 200, 300, 200, 80, 80]);

  const handleResize = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.pageX;
    const startW = widths[idx];

    const onMove = (me: MouseEvent) => {
      const delta = me.pageX - startX;
      setWidths(prev => {
        const next = [...prev];
        next[idx] = Math.max(30, startW + delta);
        return next;
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Title column (index 3) takes the rest of the available space
  const gridStyle = { 
    gridTemplateColumns: `${widths[0]}px ${widths[1]}px ${widths[2]}px minmax(${widths[3]}px, 1fr) ${widths[4]}px ${widths[5]}px ${widths[6]}px` 
  };

  const Resizer = ({ idx }: { idx: number }) => (
    <div 
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#ff9900] opacity-50 z-10"
      onMouseDown={(e) => handleResize(idx, e)}
      onClick={(e) => e.stopPropagation()}
    />
  );

  return (
    <section className="flex-1 overflow-hidden flex flex-col bg-[#0a0a0a]">
      {/* Table Header */}
      <div 
        style={gridStyle}
        className="grid border-b border-[#333333] bg-[#111111] text-[#888888] font-bold px-2 py-1 shrink-0 select-none overflow-hidden"
      >
          <span className="text-center relative"><Resizer idx={0} /></span>
          <span className="text-right pr-2 cursor-pointer hover:text-white relative" onClick={() => onRequestSort('trackNo')}>
            #{renderSortArrow('trackNo')}<Resizer idx={1} />
          </span>
          <span className="cursor-pointer hover:text-white relative" onClick={() => onRequestSort('artist')}>
            Artist{renderSortArrow('artist')}<Resizer idx={2} />
          </span>
          <span className="cursor-pointer hover:text-white relative" onClick={() => onRequestSort('title')}>
            Title{renderSortArrow('title')}<Resizer idx={3} />
          </span>
          <span className="cursor-pointer hover:text-white relative" onClick={() => onRequestSort('album')}>
            Album{renderSortArrow('album')}<Resizer idx={4} />
          </span>
          <span className="text-right cursor-pointer hover:text-white relative pr-2" onClick={() => onRequestSort('rawDuration')}>
            Length{renderSortArrow('rawDuration')}<Resizer idx={5} />
          </span>
          <span className="text-center cursor-pointer hover:text-white relative" onClick={() => onRequestSort('date')}>
            Date{renderSortArrow('date')}
          </span>
      </div>
      
      {/* Table Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden leading-[20px]">
        {tracks.length > 0 ? tracks.map((track, idx) => {
          const isSelected = selectedTracks.some(t => t.path === track.path);
          const isCurrentPlaying = playingTrack?.path === track.path;
          
          return (
              <div 
              key={idx} 
              draggable={isAdmin}
              onDragStart={(e) => {
                if (!isAdmin) return;
                // If dragging a selected track, pass all selected paths
                if (isSelected && selectedTracks.length > 1) {
                  e.dataTransfer.setData('sourcePath', JSON.stringify(selectedTracks.map(t => t.path)));
                  e.dataTransfer.setData('type', 'files');
                } else {
                  e.dataTransfer.setData('sourcePath', track.path);
                  e.dataTransfer.setData('type', 'file');
                }
              }}
              style={gridStyle}
              className={`group grid px-2 border-b border-[#1a1a1a] ${isSelected ? 'bg-[#222222]' : 'hover:bg-[#1a1a1a] cursor-grab active:cursor-grabbing'} ${isCurrentPlaying ? 'text-[#ff9900] font-medium' : (isSelected ? 'text-white' : 'text-[#aaaaaa]')}`}
              onMouseDown={(e) => {
                onSelectTrack(track, idx, e);
              }}
              onDoubleClick={() => {
                onPlayTrack(track);
              }}
              onContextMenu={(e) => {
                if (isAdmin && onTrackAction) {
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
              <span className={`text-right pr-2 ${isSelected && !isCurrentPlaying ? 'text-white' : (isCurrentPlaying ? '' : 'opacity-60')}`}>
                {track.trackNo}
              </span>
              <span className="truncate pr-2">
                {track.artist}
              </span>
              <span className="truncate pr-2">
                  {track.title}
              </span>
              <span className={`truncate pr-2 ${isSelected && !isCurrentPlaying ? 'text-white' : (isCurrentPlaying ? '' : 'opacity-80')}`}>
                {track.album}
              </span>
              <span className={`text-right pr-2 ${isSelected && !isCurrentPlaying ? 'text-white' : (isCurrentPlaying ? '' : 'opacity-80')}`}>
                {track.duration}
              </span>
              <span className={`text-center relative group-hover:hidden ${isSelected && !isCurrentPlaying ? 'text-white' : (isCurrentPlaying ? '' : 'opacity-60')}`}>
                {track.date}
              </span>
              {isAdmin && (
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
              )}
            </div>
          );
        }) : (
          <div className="p-4 text-[#555] italic">Folder is empty or contains no supported audio files.</div>
        )}
      </div>
    </section>
  );
};


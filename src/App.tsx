import React, { useState, useEffect, useRef } from 'react';
import { Visualizer } from './components/Visualizer';
import { FolderNode } from './components/FolderNode';
import { TrackTable } from './components/TrackTable';
import { MetadataPanel } from './components/MetadataPanel';
import { ControlsBar } from './components/ControlsBar';
import { Cover } from './components/Cover';
import { StatusBar } from './components/StatusBar';
import { TreeNode, Track } from './types';
import { useAudioPlayer } from './hooks/useAudioPlayer';

export default function App() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    audioRef,
    playingTrack,
    setPlayingTrack,
    isPlaying,
    progress,
    currentTime,
    volume,
    shuffle,
    setShuffle,
    stopPlayback,
    playNext,
    playPrev,
    handleTimeUpdate,
    handleEnded,
    togglePlayPause,
    handleVolumeClick,
    handleProgressClick
  } = useAudioPlayer(tracks);

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [bottomHeight, setBottomHeight] = useState(200);

  const sidebarResizing = useRef(false);
  const bottomResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sidebarResizing.current) {
        setSidebarWidth(Math.max(150, Math.min(e.clientX, window.innerWidth - 300)));
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
      } else if (bottomResizing.current) {
        const newHeight = window.innerHeight - e.clientY - 24; // 24px is status bar height
        setBottomHeight(Math.max(100, Math.min(newHeight, window.innerHeight - 200)));
        document.body.style.cursor = 'row-resize';
        e.preventDefault();
      }
    };

    const handleMouseUp = () => {
      if (sidebarResizing.current || bottomResizing.current) {
        document.body.style.cursor = '';
      }
      sidebarResizing.current = false;
      bottomResizing.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const refreshTree = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Load tree on mount and on refresh
  useEffect(() => {
    fetch('/api/tree')
      .then(res => res.json())
      .then(data => {
        setTree(data);
      })
      .catch(err => console.error("Could not fetch tree:", err));
  }, [refreshKey]);

  // Load tracks when folder selected
  useEffect(() => {
    if (selectedPath !== null) {
      fetch(`/api/folder-content?path=${encodeURIComponent(selectedPath)}`)
        .then(res => res.json())
        .then(data => {
          setTracks(data);
        })
        .catch(err => console.error("Could not fetch folder content:", err));
    }
  }, [selectedPath, refreshKey]);

  const playSpecificTrack = (track: Track) => {
    setPlayingTrack(track);
    setSelectedTrack(track);
  };

  const handlePlayNext = () => {
    const nextTrack = playNext();
    if (nextTrack) setSelectedTrack(nextTrack);
  };

  const handlePlayPrev = () => {
    const prevTrack = playPrev();
    if (prevTrack) setSelectedTrack(prevTrack);
  };

  const currentMetaTrack = selectedTrack || playingTrack;

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-[#cccccc] font-sans text-[12px] overflow-hidden selection:bg-fb-hl selection:text-white">
      
      <ControlsBar 
        isPlaying={isPlaying}
        shuffle={shuffle}
        volume={volume}
        currentTime={currentTime}
        progress={progress}
        playingTrack={playingTrack}
        refreshKey={refreshKey}
        isTreeEmpty={tree.length === 0}
        onStop={stopPlayback}
        onPlayPause={() => togglePlayPause(selectedTrack, setSelectedTrack)}
        onPrev={handlePlayPrev}
        onNext={handlePlayNext}
        onToggleShuffle={() => setShuffle(!shuffle)}
        onVolumeChange={handleVolumeClick}
        onProgressChange={handleProgressClick}
        onRefresh={refreshTree}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar (Tree) */}
        <aside 
          style={{ width: sidebarWidth }} 
          className="flex flex-col bg-[#0a0a0a] shrink-0"
        >
          <div className="p-2 border-b border-[#333333] text-[#888888] uppercase text-[10px] tracking-wider shrink-0">Album List</div>
          <div className="flex-1 overflow-y-auto leading-tight p-2 pt-[2px]">
            {tree.map((node, idx) => (
              <FolderNode 
                key={idx} 
                node={node} 
                level={0} 
                onSelectFolder={setSelectedPath} 
                selectedPath={selectedPath} 
              />
            ))}
          </div>
        </aside>
        
        <div 
          className="w-[1px] bg-[#333333] hover:bg-[#ff9900] cursor-col-resize z-10 hover:w-[4px] hover:-ml-[1.5px] hover:-mr-[1.5px] transition-colors"
          onMouseDown={(e) => {
            sidebarResizing.current = true;
            e.preventDefault();
          }}
        />

        {/* Right Side */}
        <main className="flex flex-col flex-1 overflow-hidden min-w-0">
          
          <MetadataPanel track={currentMetaTrack} />

          <TrackTable 
            tracks={tracks}
            selectedTrack={selectedTrack}
            playingTrack={playingTrack}
            isPlaying={isPlaying}
            onSelectTrack={playSpecificTrack}
          />

          <div 
            className="h-[1px] bg-[#333333] hover:bg-[#ff9900] cursor-row-resize z-10 hover:h-[4px] hover:-mt-[1.5px] hover:-mb-[1.5px] transition-colors"
            onMouseDown={(e) => {
              bottomResizing.current = true;
              e.preventDefault();
            }}
          />

          {/* Bottom Cover and Visualizer Row */}
          <section 
            style={{ height: bottomHeight }} 
            className="bg-[#0a0a0a] flex shrink-0"
          >
            {/* Visualizer */}
            <div className="flex-1 h-full bg-black overflow-hidden relative">
              <Visualizer audioRef={audioRef} />
            </div>
            
            <Cover playingTrack={playingTrack} selectedPath={selectedPath} />
            
          </section>
        </main>
      </div>

      {/* Basic HTML Audio Element (Hidden) */}
      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleEnded} 
        preload="auto"
        crossOrigin="anonymous"
      />

      <StatusBar 
        tracksCount={tracks.length}
        selectedPath={selectedPath}
        currentMetaTrack={currentMetaTrack}
      />
    </div>
  );
}


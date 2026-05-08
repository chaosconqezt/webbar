import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, RefreshCw, Play, Pause, Square } from 'lucide-react';
import { Visualizer } from './components/Visualizer';

// --- Types ---
interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
}

interface Track {
  fileName: string;
  path: string;
  trackNo: string;
  artist: string;
  title: string;
  album: string;
  duration: string;
  date: string;
  rawDuration: number;
  bitrate?: number;
  sampleRate?: number;
  codec?: string;
}

// --- Components ---

function FolderNode({
  node,
  level,
  onSelectFolder,
  selectedPath
}: {
  node: TreeNode;
  level: number;
  onSelectFolder: (path: string) => void;
  selectedPath: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  
  // Expand root level by default
  useEffect(() => {
    if (level === 0) {
      setExpanded(true);
    }
  }, [level]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleClick = () => {
    onSelectFolder(node.path);
  };

  const isSelected = selectedPath === node.path;

  return (
    <div>
      <div 
        className={`flex items-center py-0.5 px-1 cursor-pointer select-none transition-colors ${isSelected ? 'bg-fb-hl text-white' : 'hover:bg-[#1a1a1a]'}`}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={handleClick}
      >
        <span onClick={hasChildren ? toggleExpand : undefined} className="mr-1 opacity-70 hover:opacity-100 flex-shrink-0 w-3 h-3 flex items-center justify-center">
          {hasChildren ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3" />}
        </span>
        <Folder size={12} className="mr-1 flex-shrink-0 text-[#aaaaaa]" />
        <span className="truncate">{node.name}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child, idx) => (
            <FolderNode 
              key={idx} 
              node={child} 
              level={level + 1} 
              onSelectFolder={onSelectFolder}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  
  const [playingTrack, setPlayingTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [shuffle, setShuffle] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const refreshTree = () => {
    setRefreshKey(prev => prev + 1);
  };

  const playNext = () => {
    if (tracks.length === 0) return;
    if (shuffle) {
      playRandom();
      return;
    }
    const currentIndex = tracks.findIndex(t => t.path === playingTrack?.path);
    if (currentIndex >= 0 && currentIndex < tracks.length - 1) {
      const nextTrack = tracks[currentIndex + 1];
      setPlayingTrack(nextTrack);
      setSelectedTrack(nextTrack);
    }
  };

  const playPrev = () => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.path === playingTrack?.path);
    if (currentIndex > 0) {
      const prevTrack = tracks[currentIndex - 1];
      setPlayingTrack(prevTrack);
      setSelectedTrack(prevTrack);
    }
  };

  const playRandom = () => {
    if (tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      const randomTrack = tracks[randomIndex];
      setPlayingTrack(randomTrack);
      setSelectedTrack(randomTrack);
    }
  };

  // Load tree on mount and on refresh
  useEffect(() => {
    fetch('/api/tree')
      .then(res => res.json())
      .then(data => {
        console.log('Tree loaded:', data);
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

  // Audio player logic
  useEffect(() => {
    if (playingTrack && audioRef.current) {
      const streamUrl = `/api/stream?path=${encodeURIComponent(playingTrack.path)}`;
      console.log('Attempting to play track:', playingTrack.title, 'URL:', streamUrl);
      
      audioRef.current.src = streamUrl;
      audioRef.current.play()
        .then(() => {
          console.log('Playback started successfully');
          setIsPlaying(true);
        })
        .catch(e => {
          console.error("Playback failed:", e.message, e);
          setIsPlaying(false);
        });
    } else if (!playingTrack && audioRef.current) {
      console.log('Stopping playback - no track selected');
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
      setProgress(0);
    }
  }, [playingTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleEnded = () => {
    playNext();
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (playingTrack) {
          audioRef.current.play();
          setIsPlaying(true);
        } else if (selectedTrack) {
          setPlayingTrack(selectedTrack);
        } else if (tracks.length > 0) {
          setPlayingTrack(tracks[0]);
          setSelectedTrack(tracks[0]);
        }
      }
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  };

  const playSpecificTrack = (track: Track) => {
    setPlayingTrack(track);
    setSelectedTrack(track);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && playingTrack) {
      const bounds = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - bounds.left;
      const percentage = clickX / bounds.width;
      audioRef.current.currentTime = percentage * audioRef.current.duration;
      setProgress(percentage * 100);
    }
  };

  const currentMetaTrack = selectedTrack || playingTrack;

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-[#cccccc] font-sans text-[12px] overflow-hidden selection:bg-fb-hl selection:text-white">
      
      {/* Top Controls Bar */}
      <header className="h-12 flex items-center px-4 bg-[#0d0d0d] border-b border-[#333333] shrink-0 z-20 gap-4">
        {/* Main Controls (Matching sample image style) */}
        <div className="flex gap-0.5 shrink-0">
          {/* Stop */}
          <button 
            onClick={stopPlayback}
            className="w-9 h-9 flex items-center justify-center hover:bg-[#222222] transition-colors group"
            title="Stop"
          >
            <div className="w-3.5 h-3.5 bg-gradient-to-br from-[#888888] to-[#444444] rounded-sm group-active:scale-95 shadow-sm" />
          </button>
          
          {/* Play */}
          <button 
            onClick={() => { if(!isPlaying) togglePlayPause(); }}
            className={`w-9 h-9 flex items-center justify-center hover:bg-[#222222] transition-colors group ${isPlaying ? 'opacity-30' : ''}`}
            title="Play"
          >
            <div className="w-0 h-0 border-t-[7px] border-t-transparent border-l-[11px] border-l-[#888] border-b-[7px] border-b-transparent ml-1 group-active:scale-95" />
          </button>

          {/* Pause */}
          <button 
            onClick={() => { if(isPlaying) togglePlayPause(); }}
            className={`w-9 h-9 flex items-center justify-center hover:bg-[#222222] transition-colors group ${!isPlaying ? 'opacity-30' : ''}`}
            title="Pause"
          >
            <div className="flex gap-1 group-active:scale-95">
              <div className="w-1.5 h-4 bg-gradient-to-b from-[#888888] to-[#444444]" />
              <div className="w-1.5 h-4 bg-gradient-to-b from-[#888888] to-[#444444]" />
            </div>
          </button>

          {/* Prev */}
          <button 
            onClick={playPrev}
            className="w-9 h-9 flex items-center justify-center hover:bg-[#222222] transition-colors group"
            title="Previous"
          >
            <div className="flex items-center group-active:scale-95">
              <div className="w-1 h-3.5 bg-[#888888]" />
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-r-[9px] border-r-[#888] border-b-[6px] border-b-transparent" />
            </div>
          </button>

          {/* Next */}
          <button 
            onClick={playNext}
            className="w-9 h-9 flex items-center justify-center hover:bg-[#222222] transition-colors group"
            title="Next"
          >
            <div className="flex items-center group-active:scale-95">
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[9px] border-l-[#888] border-b-[6px] border-b-transparent" />
              <div className="w-1 h-3.5 bg-[#888888]" />
            </div>
          </button>

          {/* Random */}
          <button 
            onClick={playRandom}
            className="w-9 h-9 flex items-center justify-center hover:bg-[#222222] transition-colors group relative"
            title="Random"
          >
            <div className="flex items-center group-active:scale-95">
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[9px] border-l-[#888] border-b-[6px] border-b-transparent" />
              <span className="text-[#888] font-bold text-[10px] ml-0.5 mt-[-2px]">?</span>
            </div>
          </button>
        </div>

        {/* Volume */}
        <div className="w-24 shrink-0 flex items-center gap-2 group">
           <div className="text-[9px] text-[#444] font-bold">VOL</div>
           <div className="h-1 bg-[#222] flex-1 relative overflow-hidden rounded-full">
             <div className="absolute left-0 top-0 h-full bg-[#555] w-full" />
           </div>
        </div>

        {/* Separator */}
        <div className="w-[1px] h-6 bg-[#333] shrink-0 mx-1" />

        {/* Progress Bar (Scrollbar) - filling all space */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="text-[10px] text-[#555] font-mono shrink-0">
            {currentTime > 0
              ? `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}` 
              : '0:00'}
          </div>
          
          <div 
            className="flex-1 h-3 bg-[#111] relative cursor-pointer group border border-[#222] rounded-sm overflow-hidden"
            onClick={handleProgressClick}
          >
            <div 
              className="absolute left-0 top-0 h-full bg-[#ff9900] shadow-[inset_0_0_8px_rgba(255,255,255,0.1)] transition-all duration-100" 
              style={{ width: `${progress}%` }}
            />
            {/* Hover indicator */}
            <div className="absolute top-0 h-full w-0.5 bg-white opacity-0 group-hover:opacity-30 transition-opacity" style={{ left: `${progress}%` }} />
          </div>

          <div className="text-[10px] text-[#555] font-mono shrink-0">
            {playingTrack ? playingTrack.duration : '0:00'}
          </div>
        </div>

        <button onClick={refreshTree} title="Rescan Library" className="hover:text-white opacity-40 hover:opacity-100 transition-opacity shrink-0 ml-2">
          <RefreshCw size={14} className={refreshKey > 0 && !tree.length ? "animate-spin" : ""} />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar (Tree) */}
        <aside className="w-[240px] border-r border-[#333333] flex flex-col bg-[#0a0a0a]">
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

        {/* Right Side */}
        <main className="flex flex-col flex-1 overflow-hidden">
          
          {/* Metadata Panel */}
          <section className="h-[120px] border-b border-[#333333] flex overflow-hidden shrink-0 bg-[#0a0a0a]">
            <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-8 align-start content-start overflow-y-auto">
              {currentMetaTrack ? (
                <>
                  <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Artist</span><span className="text-[14px] text-white truncate">{currentMetaTrack.artist}</span></div>
                  <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Codec</span><span className="text-[14px] truncate">{currentMetaTrack.codec || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Album</span><span className="text-[14px] text-white truncate">{currentMetaTrack.album}</span></div>
                  <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Bitrate</span><span className="text-[14px] truncate">{currentMetaTrack.bitrate ? `${Math.round(currentMetaTrack.bitrate / 1000)} kbps` : '-'}</span></div>
                  <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Track Title</span><span className="text-[14px] truncate">{currentMetaTrack.title}</span></div>
                  <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Samplerate</span><span className="text-[14px] truncate">{currentMetaTrack.sampleRate ? `${currentMetaTrack.sampleRate} Hz` : '-'}</span></div>
                  <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Date</span><span className="text-[14px] truncate">{currentMetaTrack.date || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">File Name</span><span className="text-[14px] truncate">{currentMetaTrack.fileName}</span></div>
                </>
              ) : (
                <div className="col-span-2 text-[#666] italic text-[14px]">Select a track to view metadata...</div>
              )}
            </div>
          </section>

          {/* Track Table */}
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
                const isSelected = selectedTrack?.path === track.path;
                const isCurrentPlaying = playingTrack?.path === track.path;
                
                return (
                  <div 
                    key={idx} 
                    className={`grid grid-cols-[30px_50px_1.5fr_2fr_1.5fr_80px_80px] px-2 border-b border-[#1a1a1a] ${isSelected ? 'bg-[#222222] text-white' : 'hover:bg-[#1a1a1a]'}`}
                    onMouseDown={() => {
                      setSelectedTrack(track);
                      playSpecificTrack(track);
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
                    <span className={`text-center ${isSelected ? '' : 'opacity-60'}`}>
                      {track.date}
                    </span>
                  </div>
                );
              }) : (
                <div className="p-4 text-[#555] italic">Folder is empty or contains no supported audio files.</div>
              )}
            </div>
          </section>

          {/* Bottom Cover and Visualizer Row */}
          <section className="h-[200px] border-t border-[#333333] bg-[#0a0a0a] flex shrink-0">
            {/* Visualizer */}
            <div className="flex-1 h-full bg-black overflow-hidden">
              <Visualizer audioRef={audioRef} />
            </div>
            {/* Album Art */}
            <div className="w-[200px] h-full relative overflow-hidden border-l border-[#333333] bg-black">
              {(() => {
                const coverFolderPath = currentMetaTrack 
                  ? currentMetaTrack.path.split('/').slice(0, -1).join('/') 
                  : selectedPath;
                
                if (!coverFolderPath && !selectedPath) return null;
                
                const finalPath = coverFolderPath || selectedPath || "";
                
                return (
                  <img 
                    key={finalPath}
                    src={`/api/cover?path=${encodeURIComponent(finalPath)}&t=${Date.now()}`}
                    className="absolute inset-0 w-full h-full object-contain z-10"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                );
              })()}
              <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-[#444444] bg-[#0d0d0d] relative z-0">
                <div className="mb-2 opacity-50">ALBUM ART</div>
                <div className="text-[60px] leading-none opacity-10 font-bold">
                  {currentMetaTrack?.artist?.substring(0, 2)?.toUpperCase() || '..'}
                </div>
              </div>
            </div>
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

      {/* Status Bar */}
      <footer className="h-6 flex items-center px-3 justify-between bg-[#0a0a0a] text-[#444444] text-[9px] border-t border-[#1a1a1a] shrink-0">
        <div className="flex gap-3">
          <span>{tracks.length} tracks in folder</span>
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
    </div>
  );
}


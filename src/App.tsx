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
import { Modal } from './components/Modal';
import { FolderPlus, FilePlus } from 'lucide-react';

export default function App() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  const [lastSelectedIdx, setLastSelectedIdx] = useState<number>(-1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [sortConfig, setSortConfig] = useState<{key: keyof Track, direction: 'asc' | 'desc'} | null>(null);

  const requestSort = (key: keyof Track) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig(null);
      return;
    }
    setSortConfig({ key, direction });
  };

  const getSortedTracks = (tracks: Track[]) => {
    if (!sortConfig) return tracks;
    return [...tracks].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'trackNo') {
        aVal = parseInt(a.trackNo as string) || 0;
        bVal = parseInt(b.trackNo as string) || 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedTracks = getSortedTracks(tracks);

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
  } = useAudioPlayer(sortedTracks);

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [bottomHeight, setBottomHeight] = useState(200);

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, type: 'create'|'rename'|'delete', path: string}>({ isOpen: false, type: 'create', path: '' });
  const [modalInput, setModalInput] = useState('');
  
  const [sidebarDragOver, setSidebarDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number, fileName: string} | null>(null);
  
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

    const handleDragEnd = () => {
      setSidebarDragOver(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('dragend', handleDragEnd);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('dragend', handleDragEnd);
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
    setSelectedTracks([track]);
    setLastSelectedIdx(sortedTracks.findIndex(t => t.path === track.path));
  };

  const handleSelectTrack = (track: Track, idx: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastSelectedIdx !== -1) {
      const start = Math.min(lastSelectedIdx, idx);
      const end = Math.max(lastSelectedIdx, idx);
      setSelectedTracks(sortedTracks.slice(start, end + 1));
    } else if (e.ctrlKey || e.metaKey) {
      const isSelected = selectedTracks.some(t => t.path === track.path);
      if (isSelected) {
        setSelectedTracks(selectedTracks.filter(t => t.path !== track.path));
      } else {
        setSelectedTracks([...selectedTracks, track]);
      }
      setLastSelectedIdx(idx);
    } else {
      setSelectedTracks([track]);
      setLastSelectedIdx(idx);
    }
  };

  const handlePlayNext = () => {
    const nextTrack = playNext();
    if (nextTrack) {
      setSelectedTracks([nextTrack]);
      setLastSelectedIdx(sortedTracks.findIndex(t => t.path === nextTrack.path));
    }
  };

  const handlePlayPrev = () => {
    const prevTrack = playPrev();
    if (prevTrack) {
      setSelectedTracks([prevTrack]);
      setLastSelectedIdx(sortedTracks.findIndex(t => t.path === prevTrack.path));
    }
  };

  const handleFolderAction = (action: 'create' | 'delete' | 'rename', path: string) => {
    if (action === 'delete') {
      setModalConfig({ isOpen: true, type: action, path });
      setModalInput('');
    } else {
      setModalConfig({ isOpen: true, type: action, path });
      setModalInput(action === 'rename' ? path.split('/').pop() || '' : '');
    }
  };

  const submitModal = async () => {
    try {
      let res;
      if (modalConfig.type === 'create') {
        res = await fetch('/api/manage/folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: modalConfig.path, name: modalInput })
        });
      } else if (modalConfig.type === 'rename') {
        const parentPath = modalConfig.path.substring(0, modalConfig.path.lastIndexOf('/'));
        const newPath = parentPath ? `${parentPath}/${modalInput}` : modalInput;
        res = await fetch('/api/manage/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: modalConfig.path, destination: newPath })
        });
      } else if (modalConfig.type === 'delete') {
        res = await fetch('/api/manage/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: modalConfig.path })
        });
      }

      if (res && !res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Error: ${data.error || res.statusText || 'Unknown error'}`);
      } else if (res && res.ok) {
        if (modalConfig.type === 'delete' && selectedPath === modalConfig.path) {
          setSelectedPath(null);
        }
        refreshTree();
      }
    } catch (err) {
      console.error(err);
      alert(`Network error or proxy timeout. Details: ${(err as Error).message}`);
    }
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleFolderMove = async (sourcePath: string, targetPath: string) => {
    setSidebarDragOver(false);
    try {
      let pathsToMove = [sourcePath];
      
      // Check if sourcePath is a JSON array (from multi-drag)
      if (sourcePath.startsWith('[') && sourcePath.endsWith(']')) {
        pathsToMove = JSON.parse(sourcePath);
      }

      let errorMessages: string[] = [];

      for (const sp of pathsToMove) {
        if (sp === targetPath) continue;
        const itemName = sp.split('/').pop();
        const newPath = targetPath ? `${targetPath}/${itemName}` : itemName || '';
        if (sp === newPath) continue;

        const res = await fetch('/api/manage/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: sp, destination: newPath })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          errorMessages.push(`Error moving ${itemName}: ${data.error || res.statusText || 'Unknown error'}`);
        }
      }

      if (errorMessages.length > 0) {
        alert(errorMessages.join('\n'));
      }
      
      refreshTree();
    } catch (err) {
      console.error(err);
      alert(`Network error moving file(s). Details: ${(err as Error).message}`);
    }
  };

  const handleSidebarDrop = async (e: React.DragEvent, overridePath?: string) => {
    e.preventDefault();
    setSidebarDragOver(false);

    let files: { file: File, path: string }[] = [];

    // Support dropping directories from OS
    if (e.dataTransfer && e.dataTransfer.items) {
      const promises: Promise<void>[] = [];
      const traverseFileTree = (item: any, path: string = ''): Promise<void> => {
        return new Promise((resolve) => {
          if (item.isFile) {
            item.file((file: File) => {
              files.push({ file, path: path + file.name });
              resolve();
            });
          } else if (item.isDirectory) {
            const dirReader = item.createReader();
            const readEntries = () => {
              dirReader.readEntries((entries: any[]) => {
                if (entries.length === 0) {
                  resolve();
                } else {
                  const entryPromises = entries.map(entry => traverseFileTree(entry, path + item.name + '/'));
                  Promise.all(entryPromises).then(() => readEntries());
                }
              });
            };
            readEntries();
          } else {
            resolve();
          }
        });
      };

      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        // @ts-ignore
        const item = e.dataTransfer.items[i].webkitGetAsEntry ? e.dataTransfer.items[i].webkitGetAsEntry() : null;
        if (item) {
          promises.push(traverseFileTree(item));
        }
      }
      await Promise.all(promises);
    }
    
    // Fallback if no items obtained (e.g. standard file input event fake object we construct)
    if (files.length === 0 && e.dataTransfer && e.dataTransfer.files) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        files.push({ file, path: file.webkitRelativePath || file.name });
      }
    }

    if (files.length === 0) return;
    
    const targetPath = overridePath !== undefined ? overridePath : (selectedPath || '');
    
    setUploadProgress({ current: 0, total: files.length, fileName: '' });

    // Upload files sequentially to avoid payload limits
    for (let i = 0; i < files.length; i++) {
      const { file, path: filePath } = files[i];
      setUploadProgress({ current: i + 1, total: files.length, fileName: filePath });
      
      const formData = new FormData();
      formData.append('files', file, file.name);
      
      try {
        await fetch(`/api/manage/upload?path=${encodeURIComponent(targetPath)}&filepath=${encodeURIComponent(filePath)}`, {
          method: 'POST',
          body: formData
        });
      } catch (err) {
        console.error("Failed to upload file:", filePath, err);
      }
    }
    
    setUploadProgress(null);
    refreshTree();
  };

  const handleTrackAction = (action: 'delete', track: Track) => {
    if (action === 'delete') {
      setModalConfig({ isOpen: true, type: 'delete', path: track.path });
      setModalInput('');
    }
  };

  const currentMetaTrack = selectedTracks.length > 0 ? selectedTracks[0] : playingTrack;

  return (
    <div 
      className="flex flex-col h-screen w-full bg-[#0a0a0a] text-[#cccccc] font-sans text-[12px] overflow-hidden selection:bg-fb-hl selection:text-white transition-colors relative"
    >
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
        onPlayPause={() => togglePlayPause(selectedTracks[0] || null, (t) => setSelectedTracks(t ? [t] : []))}
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
          className={`relative flex flex-col bg-[#0a0a0a] shrink-0 transition-colors ${sidebarDragOver ? 'ring-2 ring-inset ring-[#ff9900] bg-[#111]' : ''}`}
          onDragOver={(e) => { 
            const types = Array.from(e.dataTransfer.types).map(t => String(t).toLowerCase());
            if (types.includes('files') || types.includes('sourcepath')) {
              e.preventDefault();
              setSidebarDragOver(true);
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setSidebarDragOver(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            setSidebarDragOver(false);
            const types = Array.from(e.dataTransfer.types).map(t => String(t).toLowerCase());
            if (types.includes('files')) {
              handleSidebarDrop(e, '');
            } else {
              const sourcePath = e.dataTransfer.getData('sourcePath');
              if (sourcePath) {
                handleFolderMove(sourcePath, '');
              }
            }
          }}
        >
          {sidebarDragOver && (
            <div className="absolute inset-0 z-50 bg-[#ff9900]/20 flex items-center justify-center pointer-events-none backdrop-blur-[1px]">
              <div className="bg-[#ff9900] text-black px-4 py-2 text-sm font-bold shadow-lg uppercase tracking-wider text-center">
                Drop folders/files<br/>
                <span className="text-[10px] opacity-80">{selectedPath ? `to /${selectedPath}` : 'to root folder'}</span>
              </div>
            </div>
          )}
          <div className="p-2 border-b border-[#333333] text-[#888888] uppercase text-[10px] tracking-wider shrink-0 flex justify-between items-center">
            <span>Album List</span>
            <div className="flex gap-2">
              <label className="cursor-pointer text-[#888888] hover:text-[#ff9900] transition-colors" title="Upload folder">
                <FolderPlus size={14} />
                {/* @ts-ignore */}
                <input type="file" webkitdirectory="true" directory="true" className="hidden" onChange={(e) => {
                  if (e.target.files) {
                    const ev = { dataTransfer: { files: e.target.files }, preventDefault: () => {} } as React.DragEvent;
                    handleSidebarDrop(ev);
                    e.target.value = '';
                  }
                }} />
              </label>
              <label className="cursor-pointer text-[#888888] hover:text-[#ff9900] transition-colors" title="Upload files (or drop here)">
                <FilePlus size={14} />
                <input type="file" multiple className="hidden" onChange={(e) => {
                  if (e.target.files) {
                    const ev = { dataTransfer: { files: e.target.files }, preventDefault: () => {} } as React.DragEvent;
                    handleSidebarDrop(ev);
                    e.target.value = '';
                  }
                }} />
              </label>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto leading-tight p-2 pt-[2px]">
            {uploadProgress && (
              <div className="my-2 p-2 bg-[#222] border border-[#333] rounded">
                <div className="text-[10px] text-[#ff9900] mb-1 font-mono uppercase tracking-widest flex justify-between">
                  <span>Uploading...</span>
                  <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-black h-1 rounded overflow-hidden">
                  <div 
                    className="bg-[#ff9900] h-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
                <div className="text-[9px] text-[#888] mt-1 truncate">
                  {uploadProgress.current} / {uploadProgress.total}: {uploadProgress.fileName}
                </div>
              </div>
            )}
            {tree.map((node, idx) => (
              <FolderNode 
                key={idx} 
                node={node} 
                level={0} 
                onSelectFolder={setSelectedPath} 
                selectedPath={selectedPath} 
                onAction={handleFolderAction}
                onMove={handleFolderMove}
                onUploadFiles={handleSidebarDrop}
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
          
          <MetadataPanel tracks={selectedTracks} currentMetaTrack={selectedTracks.length > 0 ? selectedTracks[0] : playingTrack} onRefresh={refreshTree} />

          <TrackTable 
            tracks={sortedTracks}
            selectedTracks={selectedTracks}
            playingTrack={playingTrack}
            isPlaying={isPlaying}
            sortConfig={sortConfig}
            onRequestSort={requestSort}
            onSelectTrack={handleSelectTrack}
            onPlayTrack={playSpecificTrack}
            onTrackAction={(action, affectedTracks) => {
               if (action === 'delete') {
                 // For now, if we pass multiple, we could open modal to confirm for multiple.
                 // We will just do the first one or we can enhance modal config.
                 // Wait, we can pass multiple tracks to delete? Let's just pass one.
                 // App handles deletion by path only.
                 // let's just delete the first one for simplicity, or modify ModalConfig to handle arrays.
                 if (affectedTracks.length > 0) {
                     setModalConfig({ isOpen: true, type: 'delete', path: affectedTracks[0].path });
                 }
               }
            }}
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
      
      <Modal 
        isOpen={modalConfig.isOpen} 
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.type === 'create' ? 'New Folder' : modalConfig.type === 'rename' ? 'Rename Folder' : 'Delete Item'}
      >
        {modalConfig.type === 'delete' ? (
          <div className="text-[12px] text-white">
            Are you sure you want to delete <strong>{modalConfig.path}</strong>?
          </div>
        ) : (
          <input 
            type="text"
            className="w-full bg-[#222] border border-[#444] text-white px-2 py-1 outline-none focus:border-[#ff9900]"
            value={modalInput}
            onChange={(e) => setModalInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitModal(); }}
            autoFocus
          />
        )}
        <div className="flex justify-end gap-2 mt-2">
          <button 
            onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
            className="px-3 py-1 bg-[#222] hover:bg-[#333] text-white transition-colors text-[12px]"
          >
            Cancel
          </button>
          <button 
            onClick={submitModal}
            className={`px-3 py-1 text-white transition-colors text-[12px] ${modalConfig.type === 'delete' ? 'bg-[#ff2222] hover:bg-[#ff4444]' : 'bg-[#ff9900] hover:bg-[#ffaa22]'}`}
          >
            {modalConfig.type === 'delete' ? 'Delete' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  );
}


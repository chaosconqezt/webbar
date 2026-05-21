import React, { useState } from 'react';
import { Track } from '../types';
import { PenLine, Check, X } from 'lucide-react';

interface MetadataPanelProps {
  tracks: Track[];
  currentMetaTrack: Track | null;
  onRefresh: () => void;
  isAdmin?: boolean;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ tracks, currentMetaTrack, onRefresh, isAdmin }) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const displayTrack = currentMetaTrack;
  const isMultiSelection = tracks.length > 1;

  if (!displayTrack) {
    return (
      <section className="h-[120px] border-b border-[#333333] flex overflow-hidden shrink-0 bg-[#0a0a0a]">
        <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-8 align-start content-start overflow-hidden">
            <div className="col-span-2 text-[#666] italic text-[14px]">Select a track to view metadata...</div>
        </div>
      </section>
    );
  }

  // Aggregate stats if multi-selected
  const getAggregated = (key: keyof Track, singleValue: any) => {
    if (!isMultiSelection) return singleValue;
    const allSame = tracks.every(t => t[key] === tracks[0][key]);
    return allSame ? tracks[0][key] : '[Mixed]';
  };

  const getAggregatedString = (key: keyof Track, singleValue: any) => {
    const val = getAggregated(key, singleValue);
    return typeof val === 'string' ? val : String(val || '-');
  };

  const handleEditStart = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue === '[Mixed]' ? '' : currentValue);
  };

  const handleEditSave = async () => {
    if (!editingField) return;
    const pathsToUpdate = isMultiSelection ? tracks.map(t => t.path) : [displayTrack.path];
    const newTags: any = { [editingField]: editValue };

    try {
      const res = await fetch('/api/tags/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: pathsToUpdate, tags: newTags })
      });
      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        alert(`Error saving tags: ${data.details?.join('\n') || data.error}`);
      }
    } catch (e) {
      alert(`Network error saving tags`);
    }
    setEditingField(null);
  };

  const renderField = (label: string, field: string, value: string) => {
    const isEditing = editingField === field;

    return (
      <div className="flex flex-col group relative">
        <span className="text-[#666666] text-[10px] uppercase font-bold tracking-wider">{label}</span>
        {isEditing ? (
           <div className="flex items-center gap-2 mt-1">
             <input 
               autoFocus
               type="text" 
               className="bg-[#222] text-white text-[12px] px-1 py-0.5 outline-none border border-[#ff9900]"
               value={editValue}
               onChange={e => setEditValue(e.target.value)}
               onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditingField(null); }}
             />
             <button onClick={handleEditSave} className="text-green-500 hover:text-green-400"><Check size={14}/></button>
             <button onClick={() => setEditingField(null)} className="text-red-500 hover:text-red-400"><X size={14}/></button>
           </div>
        ) : (
          <div className="flex items-center gap-2 mt-1 h-[20px]">
             <span className={`text-[14px] truncate ${value === '[Mixed]' ? 'text-[#888] italic' : 'text-white'}`}>{value}</span>
             {isAdmin && ['artist', 'albumArtist', 'album', 'title', 'date'].includes(field) && (
               <button 
                 onClick={() => handleEditStart(field, value)}
                 className="opacity-0 group-hover:opacity-100 text-[#ff9900] transition-opacity"
                 title={`Edit ${label}`}
               >
                 <PenLine size={12} />
               </button>
             )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="h-[120px] border-b border-[#333333] flex overflow-hidden shrink-0 bg-[#0a0a0a]">
      <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-8 align-start content-start overflow-hidden">
        {renderField('Artist', 'artist', getAggregatedString('artist', displayTrack.artist))}
        {renderField('Album Artist', 'albumArtist', getAggregatedString('albumArtist', displayTrack.albumArtist || ''))}
        {renderField('Album', 'album', getAggregatedString('album', displayTrack.album))}
        {renderField('Track Title', 'title', getAggregatedString('title', displayTrack.title))}
        
        {renderField('Date', 'date', getAggregatedString('date', displayTrack.date))}
        {renderField('Codec', 'codec', getAggregatedString('codec', displayTrack.codec || '-'))}
        {renderField('Bitrate', 'bitrate', isMultiSelection ? getAggregatedString('bitrate', '') : (displayTrack.bitrate ? `${Math.round(displayTrack.bitrate / 1000)} kbps` : '-'))}
        {renderField('Samplerate', 'sampleRate', isMultiSelection ? getAggregatedString('sampleRate', '') : (displayTrack.sampleRate ? `${displayTrack.sampleRate} Hz` : '-'))}
      </div>
    </section>
  );
};

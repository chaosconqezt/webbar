import React from 'react';
import { Track } from '../types';

interface MetadataPanelProps {
  track: Track | null;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ track }) => {
  return (
    <section className="h-[120px] border-b border-[#333333] flex overflow-hidden shrink-0 bg-[#0a0a0a]">
      <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-8 align-start content-start overflow-y-auto">
        {track ? (
          <>
            <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Artist</span><span className="text-[14px] text-white truncate">{track.artist}</span></div>
            <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Codec</span><span className="text-[14px] truncate">{track.codec || '-'}</span></div>
            <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Album</span><span className="text-[14px] text-white truncate">{track.album}</span></div>
            <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Bitrate</span><span className="text-[14px] truncate">{track.bitrate ? `${Math.round(track.bitrate / 1000)} kbps` : '-'}</span></div>
            <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Track Title</span><span className="text-[14px] truncate">{track.title}</span></div>
            <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Samplerate</span><span className="text-[14px] truncate">{track.sampleRate ? `${track.sampleRate} Hz` : '-'}</span></div>
            <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">Date</span><span className="text-[14px] truncate">{track.date || '-'}</span></div>
            <div className="flex flex-col"><span className="text-[#666666] text-[10px] uppercase">File Name</span><span className="text-[14px] truncate">{track.fileName}</span></div>
          </>
        ) : (
          <div className="col-span-2 text-[#666] italic text-[14px]">Select a track to view metadata...</div>
        )}
      </div>
    </section>
  );
};

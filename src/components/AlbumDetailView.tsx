import React, { useState } from 'react';
import { ArrowLeft, Play, Shuffle, Clock, ChevronRight, Share2 } from 'lucide-react';
import { Album, Track } from '../types';
import { CyberArtwork } from './CyberArtwork';

interface AlbumDetailViewProps {
  album: Album;
  onBack: () => void;
  onSelectTrack: (track: Track) => void;
  onSelectArtist: (artistId: string) => void;
}

export const AlbumDetailView: React.FC<AlbumDetailViewProps> = ({
  album,
  onBack,
  onSelectTrack,
  onSelectArtist,
}) => {
  const [notice, setNotice] = useState<string | null>(null);
  const albumTracks = album.tracks || [];

  return (
    <div className="p-4 space-y-5 pb-28 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#10131C] border border-[#171B28] flex items-center justify-center text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF]/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono tracking-widest text-[#00F5FF] uppercase font-bold">
          Album Metadata
        </span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText?.(window.location.href);
            setNotice('Album link copied to clipboard.');
          }}
          className="w-10 h-10 rounded-full bg-[#10131C] border border-[#171B28] flex items-center justify-center text-[#9CA3B7] hover:text-[#F7F8FC] transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden p-6 border border-[#171B28] bg-gradient-to-b from-[#171B28]/80 to-[#10131C]/90 backdrop-blur-xl flex flex-col items-center text-center">
        <div className="w-44 h-44 rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_35px_rgba(0,245,255,0.2)] mb-4">
          <CyberArtwork keyName={album.artworkKey} />
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC] mb-1">
          {album.title}
        </h1>

        <button
          onClick={() => album.artistId && onSelectArtist(album.artistId)}
          className="text-xs font-bold uppercase text-[#00F5FF] tracking-wider hover:underline mb-2"
        >
          {album.artist}
        </button>

        <div className="text-[11px] text-[#9CA3B7] mb-4">
          {album.releaseYear} • {album.tracksCount} tracks
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full justify-center">
          <button
            onClick={() => {
              if (albumTracks.length > 0) onSelectTrack(albumTracks[0]);
              setNotice('Album queued in player metadata. Streaming launches in Block 3!');
            }}
            className="px-6 py-2.5 rounded-full bg-[#00F5FF] text-[#07090F] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-[#00F5FF]/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
            Play
          </button>

          <button
            onClick={() => {
              if (albumTracks.length > 0) {
                const randomTrack = albumTracks[Math.floor(Math.random() * albumTracks.length)];
                onSelectTrack(randomTrack);
              }
              setNotice('Shuffle engaged for this album.');
            }}
            className="p-2.5 rounded-full bg-[#10131C] border border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF]/40 transition-colors"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-[#171B28] border border-[#00F5FF]/40 text-xs text-[#00F5FF] flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[#9CA3B7] hover:text-white text-xs font-bold">
            OK
          </button>
        </div>
      )}

      {/* Tracks */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-3">
          Tracklist ({albumTracks.length})
        </div>
        <div className="space-y-2">
          {albumTracks.map((trk, idx) => (
            <div
              key={trk.id}
              onClick={() => onSelectTrack(trk)}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#10131C]/80 backdrop-blur-md border border-[#171B28] hover:border-[#00F5FF]/50 cursor-pointer transition-colors"
            >
              <span className="w-6 text-center text-xs font-mono text-[#61697C]">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#F7F8FC] truncate">{trk.title}</div>
                <div className="text-[11px] text-[#9CA3B7] truncate">{trk.artist}</div>
              </div>
              <span className="text-[11px] font-mono text-[#61697C]">
                {Math.floor(trk.durationSeconds / 60)}:{(trk.durationSeconds % 60).toString().padStart(2, '0')}
              </span>
              <div className="w-7 h-7 rounded-full bg-[#00F5FF]/10 border border-[#00F5FF]/30 flex items-center justify-center text-[#00F5FF]">
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

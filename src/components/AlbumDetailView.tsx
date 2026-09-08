import React, { useState } from 'react';
import { ArrowLeft, Play, Shuffle, Clock, ChevronRight, Share2 } from 'lucide-react';
import { Album, Track } from '../types';
import { CyberArtwork } from './CyberArtwork';

interface AlbumDetailViewProps {
  album: Album;
  onBack: () => void;
  onSelectTrack: (track: Track) => void;
  onSelectArtist: (artistId: string) => void;
  theme?: string;
}

export const AlbumDetailView: React.FC<AlbumDetailViewProps> = ({
  album,
  onBack,
  onSelectTrack,
  onSelectArtist,
  theme = 'stealth_athletic',
}) => {
  const isLight = theme === 'pure_light';
  const [notice, setNotice] = useState<string | null>(null);
  const albumTracks = album.tracks || [];

  return (
    <div className={`p-4 space-y-5 pb-28 animate-in fade-in duration-200 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              : 'bg-[#10131C] border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF]/50'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className={`text-xs font-mono tracking-widest uppercase font-bold ${
          isLight ? 'text-slate-700' : 'text-[#00F5FF]'
        }`}>
          Album Metadata
        </span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText?.(window.location.href);
            setNotice('Album link copied to clipboard.');
          }}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              : 'bg-[#10131C] border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC]'
          }`}
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Header */}
      <div className={`relative rounded-3xl overflow-hidden p-6 border flex flex-col items-center text-center transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm'
          : 'border-[#171B28] bg-gradient-to-b from-[#171B28]/80 to-[#10131C]/90 backdrop-blur-xl'
      }`}>
        <div className={`w-44 h-44 rounded-2xl overflow-hidden border mb-4 ${
          isLight ? 'border-slate-200 shadow-lg' : 'border-white/10 shadow-[0_0_35px_rgba(0,245,255,0.2)]'
        }`}>
          <CyberArtwork keyName={album.artworkKey} artworkUrl={album.artworkUrl} />
        </div>

        <h1 className={`text-2xl font-black uppercase tracking-tight mb-1 ${
          isLight ? 'text-slate-900' : 'text-[#F7F8FC]'
        }`}>
          {album.title}
        </h1>

        <button
          onClick={() => album.artistId && onSelectArtist(album.artistId)}
          className={`text-xs font-bold uppercase tracking-wider hover:underline mb-2 cursor-pointer ${
            isLight ? 'text-slate-700' : 'text-[#00F5FF]'
          }`}
        >
          {album.artist}
        </button>

        <div className={`text-[11px] mb-4 ${
          isLight ? 'text-slate-500' : 'text-[#9CA3B7]'
        }`}>
          {album.releaseYear} • {album.tracksCount} tracks
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full justify-center">
          <button
            onClick={() => {
              if (albumTracks.length > 0) onSelectTrack(albumTracks[0]);
              setNotice('Album queued in player metadata. Streaming launches in Block 3!');
            }}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                : 'bg-[#00F5FF] text-[#07090F] shadow-[#00F5FF]/20 hover:brightness-110'
            }`}
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
            className={`p-2.5 rounded-full border transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-950'
                : 'bg-[#10131C] border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF]/40'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notice && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
          isLight
            ? 'bg-slate-100 border-slate-300 text-slate-800'
            : 'bg-[#171B28] border-[#00F5FF]/40 text-[#00F5FF]'
        }`}>
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className={`text-xs font-bold ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#9CA3B7] hover:text-white'}`}>
            OK
          </button>
        </div>
      )}

      {/* Tracks */}
      <div>
        <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${
          isLight ? 'text-slate-500' : 'text-[#9CA3B7]'
        }`}>
          Tracklist ({albumTracks.length})
        </div>
        <div className="space-y-2">
          {albumTracks.map((trk, idx) => (
            <div
              key={trk.id}
              onClick={() => onSelectTrack(trk)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm'
                  : 'bg-[#10131C]/80 backdrop-blur-md border-[#171B28] hover:border-[#00F5FF]/50 text-white'
              }`}
            >
              <span className={`w-6 text-center text-xs font-mono ${
                isLight ? 'text-slate-400' : 'text-[#61697C]'
              }`}>{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold truncate ${
                  isLight ? 'text-slate-900' : 'text-[#F7F8FC]'
                }`}>{trk.title}</div>
                <div className={`text-[11px] truncate ${
                  isLight ? 'text-slate-500' : 'text-[#9CA3B7]'
                }`}>{trk.artist}</div>
              </div>
              <span className={`text-[11px] font-mono ${
                isLight ? 'text-slate-400' : 'text-[#61697C]'
              }`}>
                {Math.floor(trk.durationSeconds / 60)}:{(trk.durationSeconds % 60).toString().padStart(2, '0')}
              </span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isLight
                  ? 'bg-slate-100 text-slate-900'
                  : 'bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF]'
              }`}>
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

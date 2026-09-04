import React, { useState } from 'react';
import { ArrowLeft, Play, Shuffle, Share2, Sparkles } from 'lucide-react';
import { Playlist, Track } from '../types';
import { CyberArtwork } from './CyberArtwork';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  onBack: () => void;
  onSelectTrack: (track: Track) => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlist,
  onBack,
  onSelectTrack,
}) => {
  const [notice, setNotice] = useState<string | null>(null);
  const playlistTracks = playlist.tracks || [];

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
          Curated Playlist
        </span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText?.(window.location.href);
            setNotice('Playlist link copied to clipboard.');
          }}
          className="w-10 h-10 rounded-full bg-[#10131C] border border-[#171B28] flex items-center justify-center text-[#9CA3B7] hover:text-[#F7F8FC] transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden p-6 border border-[#171B28] bg-gradient-to-b from-[#171B28]/80 to-[#10131C]/90 backdrop-blur-xl flex flex-col items-center text-center">
        <div className="w-44 h-44 rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_35px_rgba(255,46,209,0.2)] mb-4">
          <CyberArtwork keyName={playlist.artworkKey} />
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC] mb-1">
          {playlist.title}
        </h1>

        <div className="text-xs font-bold uppercase text-[#FF2ED1] tracking-wider mb-2">
          Curated by {playlist.createdBy || 'CyberPulse Curators'}
        </div>

        {playlist.description && (
          <p className="text-xs text-[#9CA3B7] leading-relaxed mb-4 max-w-sm">
            {playlist.description}
          </p>
        )}

        <div className="text-[11px] text-[#61697C] mb-4">
          {playlistTracks.length || playlist.trackCount} tracks • High Definition
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full justify-center">
          <button
            onClick={() => {
              if (playlistTracks.length > 0) onSelectTrack(playlistTracks[0]);
              setNotice('Playlist loaded into queue. Media playback engine launches in Block 3!');
            }}
            className="px-6 py-2.5 rounded-full bg-[#FF2ED1] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-[#FF2ED1]/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
            Play All
          </button>

          <button
            onClick={() => {
              if (playlistTracks.length > 0) {
                const randomTrack = playlistTracks[Math.floor(Math.random() * playlistTracks.length)];
                onSelectTrack(randomTrack);
              }
              setNotice('Shuffle active for this playlist.');
            }}
            className="p-2.5 rounded-full bg-[#10131C] border border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#FF2ED1]/40 transition-colors"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-[#171B28] border border-[#FF2ED1]/40 text-xs text-[#FF2ED1] flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[#9CA3B7] hover:text-white text-xs font-bold">
            OK
          </button>
        </div>
      )}

      {/* Tracks */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-3">
          Tracks ({playlistTracks.length})
        </div>
        <div className="space-y-2">
          {playlistTracks.map((trk, idx) => (
            <div
              key={trk.id}
              onClick={() => onSelectTrack(trk)}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-[#10131C]/80 backdrop-blur-md border border-[#171B28] hover:border-[#FF2ED1]/50 cursor-pointer transition-colors"
            >
              <span className="w-6 text-center text-xs font-mono text-[#61697C]">{idx + 1}</span>
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5">
                <CyberArtwork keyName={trk.placeholderArtworkKey} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#F7F8FC] truncate">{trk.title}</div>
                <div className="text-[11px] text-[#9CA3B7] truncate">{trk.artist}</div>
              </div>
              <span className="text-[11px] font-mono text-[#61697C]">
                {Math.floor(trk.durationSeconds / 60)}:{(trk.durationSeconds % 60).toString().padStart(2, '0')}
              </span>
              <div className="w-7 h-7 rounded-full bg-[#FF2ED1]/10 border border-[#FF2ED1]/30 flex items-center justify-center text-[#FF2ED1]">
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

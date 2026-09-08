import React, { useState } from 'react';
import { ArrowLeft, Play, Shuffle, Share2, Music2, ExternalLink } from 'lucide-react';
import { Playlist, Track, SonaTheme, NrcAccentColor } from '../types';
import { CyberArtwork } from './CyberArtwork';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  onBack: () => void;
  onSelectTrack: (track: Track) => void;
  theme?: SonaTheme;
  nrcAccent?: NrcAccentColor;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlist,
  onBack,
  onSelectTrack,
  theme = 'pure_light',
  nrcAccent = 'neon_green',
}) => {
  const [notice, setNotice] = useState<string | null>(null);
  const playlistTracks = playlist.tracks || [];

  const isLight = theme === 'pure_light';
  const nrcAccentHex =
    nrcAccent === 'purple_magic'
      ? '#B026FF'
      : nrcAccent === 'electric_blue'
      ? '#00E5FF'
      : '#CCFF00';

  const isSpotify = playlist.source === 'SPOTIFY';

  return (
    <div className="p-4 space-y-5 pb-28 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              : 'bg-[#141416] border-[#26262B] text-[#8E8E93] hover:text-white'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5">
          {isSpotify && (
            <span
              className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider"
              style={{
                backgroundColor: isLight ? '#0F172A' : nrcAccentHex,
                color: isLight ? '#FFFFFF' : nrcAccent === 'purple_magic' ? '#FFFFFF' : '#000000',
              }}
            >
              Spotify Playlist
            </span>
          )}
          <span
            className={`text-xs font-mono tracking-widest uppercase font-bold ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {isSpotify ? 'Imported Catalog' : 'Curated Playlist'}
          </span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText?.(window.location.href);
            setNotice('Playlist link copied to clipboard.');
            setTimeout(() => setNotice(null), 3000);
          }}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              : 'bg-[#141416] border-[#26262B] text-[#8E8E93] hover:text-white'
          }`}
          title="Copy Link"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Header */}
      <div
        className={`relative rounded-3xl overflow-hidden p-6 border flex flex-col items-center text-center shadow-lg transition-all ${
          isLight
            ? 'bg-slate-50 border-slate-200 shadow-slate-200/50'
            : 'bg-[#121214] border-[#26262B] shadow-black'
        }`}
      >
        <div className="w-44 h-44 rounded-2xl overflow-hidden border border-inherit shadow-xl mb-4 shrink-0 bg-slate-900">
          <CyberArtwork
            keyName={playlist.artworkKey}
            artworkUrl={playlist.artworkUrl}
            title={playlist.title}
          />
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tight mb-1">
          {playlist.title}
        </h1>

        <div
          className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
          style={{ color: isLight ? '#0F172A' : nrcAccentHex }}
        >
          {isSpotify && <Music2 className="w-3.5 h-3.5" />}
          <span>Curated by {playlist.createdBy || 'Sona Audio'}</span>
        </div>

        {playlist.description && (
          <p
            className={`text-xs leading-relaxed mb-4 max-w-sm ${
              isLight ? 'text-slate-600' : 'text-[#8E8E93]'
            }`}
          >
            {playlist.description}
          </p>
        )}

        <div className={`text-[11px] mb-4 ${isLight ? 'text-slate-500' : 'text-[#636366]'}`}>
          {playlistTracks.length || playlist.trackCount} audio tracks • High-Speed Live Stream
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full justify-center">
          <button
            onClick={() => {
              if (playlistTracks.length > 0) onSelectTrack(playlistTracks[0]);
              setNotice('Playing all tracks in queue.');
              setTimeout(() => setNotice(null), 3000);
            }}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
              isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-black font-black'
            }`}
            style={
              !isLight
                ? {
                    backgroundColor: nrcAccentHex,
                    color: nrcAccent === 'purple_magic' ? '#FFFFFF' : '#000000',
                  }
                : undefined
            }
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
            Play All
          </button>

          <button
            onClick={() => {
              if (playlistTracks.length > 0) {
                const randomTrack =
                  playlistTracks[Math.floor(Math.random() * playlistTracks.length)];
                onSelectTrack(randomTrack);
              }
              setNotice('Shuffle mode activated for this playlist.');
              setTimeout(() => setNotice(null), 3000);
            }}
            className={`p-2.5 rounded-full border transition-colors cursor-pointer ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                : 'bg-[#1C1C20] border-[#26262B] text-[#8E8E93] hover:text-white'
            }`}
            title="Shuffle Playlist"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-center justify-between animate-in fade-in duration-150 ${
            isLight
              ? 'bg-slate-100 border-slate-300 text-slate-900'
              : 'bg-[#18181B] border-[#2A2A30] text-white'
          }`}
        >
          <span>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-white/60'}`}
          >
            OK
          </button>
        </div>
      )}

      {/* Tracks */}
      <div>
        <div
          className={`text-xs font-bold uppercase tracking-wider mb-3 ${
            isLight ? 'text-slate-500' : 'text-[#8E8E93]'
          }`}
        >
          Audio Tracks ({playlistTracks.length})
        </div>
        <div className="space-y-2">
          {playlistTracks.map((trk, idx) => (
            <div
              key={trk.id}
              onClick={() => onSelectTrack(trk)}
              className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-sm'
                  : 'bg-[#121214] border-[#26262B] hover:border-white/40'
              }`}
            >
              <span
                className={`w-6 text-center text-xs font-mono ${
                  isLight ? 'text-slate-400' : 'text-[#636366]'
                }`}
              >
                {idx + 1}
              </span>
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-inherit bg-slate-900">
                <CyberArtwork
                  keyName={trk.placeholderArtworkKey}
                  artworkUrl={trk.artworkUrl}
                  title={trk.title}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{trk.title}</div>
                <div
                  className={`text-[11px] truncate ${
                    isLight ? 'text-slate-500' : 'text-[#8E8E93]'
                  }`}
                >
                  {trk.artist}
                </div>
              </div>
              <span
                className={`text-[11px] font-mono shrink-0 ${
                  isLight ? 'text-slate-400' : 'text-[#636366]'
                }`}
              >
                {Math.floor(trk.durationSeconds / 60)}:
                {(trk.durationSeconds % 60).toString().padStart(2, '0')}
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105"
                style={{
                  backgroundColor: isLight ? '#0F172A' : nrcAccentHex,
                  color: isLight ? '#FFFFFF' : nrcAccent === 'purple_magic' ? '#FFFFFF' : '#000000',
                }}
              >
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

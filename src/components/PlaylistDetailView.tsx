import React, { useEffect, useState } from 'react';
import { ArrowLeft, Play, Shuffle, Share2, Music2, Trash2 } from 'lucide-react';
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
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>(playlist.tracks || []);

  useEffect(() => {
    setPlaylistTracks(playlist.tracks || []);
  }, [playlist.id, playlist.tracks]);

  const isLight = theme === 'pure_light';
  const nrcAccentHex =
    nrcAccent === 'purple_magic'
      ? '#B026FF'
      : nrcAccent === 'electric_blue'
      ? '#00E5FF'
      : '#CCFF00';

  const isSpotify = playlist.source === 'SPOTIFY';

  const persistPlaylist = (tracks: Track[]) => {
    const updated: Playlist = {
      ...playlist,
      tracks,
      trackCount: tracks.length,
    };

    playlist.tracks = tracks;
    playlist.trackCount = tracks.length;

    try {
      const raw = localStorage.getItem('sona_custom_playlists');
      const saved = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(saved) ? saved : [];
      const merged = [updated, ...list.filter((item: any) => item?.id !== playlist.id)];
      localStorage.setItem('sona_custom_playlists', JSON.stringify(merged));
    } catch {
      // Local persistence is best effort; the in-memory playlist is still updated.
    }
  };

  const handleDeleteTrack = (event: React.MouseEvent, track: Track) => {
    event.stopPropagation();
    if (!window.confirm(`Remove "${track.title}" from this playlist?`)) return;
    const next = playlistTracks.filter((item) => item.id !== track.id);
    setPlaylistTracks(next);
    persistPlaylist(next);
    setNotice(`Removed "${track.title}" from playlist.`);
    setTimeout(() => setNotice(null), 2600);
  };

  const handleDeletePlaylist = () => {
    if (!window.confirm(`Delete playlist "${playlist.title}"?`)) return;
    try {
      const deletedRaw = localStorage.getItem('sona_deleted_playlist_ids');
      const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
      const nextDeleted = Array.from(new Set([...(Array.isArray(deletedIds) ? deletedIds : []), playlist.id]));
      localStorage.setItem('sona_deleted_playlist_ids', JSON.stringify(nextDeleted));

      const customRaw = localStorage.getItem('sona_custom_playlists');
      const custom = customRaw ? JSON.parse(customRaw) : [];
      if (Array.isArray(custom)) {
        localStorage.setItem(
          'sona_custom_playlists',
          JSON.stringify(custom.filter((item: any) => item?.id !== playlist.id))
        );
      }
    } catch {
      // continue to leave the view even if storage is unavailable
    }
    onBack();
    window.setTimeout(() => window.location.reload(), 60);
  };

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
        <div className="flex items-center gap-1.5 min-w-0 px-2">
          {isSpotify && (
            <span
              className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider"
              style={{
                backgroundColor: isLight ? '#ECFDF3' : nrcAccentHex,
                color: isLight ? '#166534' : nrcAccent === 'purple_magic' ? '#FFFFFF' : '#000000',
                border: isLight ? '1px solid #86EFAC' : undefined,
              }}
            >
              Spotify Playlist
            </span>
          )}
          <span
            className={`text-xs font-mono tracking-widest uppercase font-bold truncate ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {isSpotify ? 'Imported Catalog' : 'Curated Playlist'}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={handleDeletePlaylist}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-rose-950/30 border-rose-900/50 text-rose-400 hover:bg-rose-950/50'
            }`}
            title="Delete Playlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
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
          {playlistTracks.length} audio tracks • High-Speed Live Stream
        </div>

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
                const randomTrack = playlistTracks[Math.floor(Math.random() * playlistTracks.length)];
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
              <button
                onClick={(event) => handleDeleteTrack(event, trk)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                    : 'bg-rose-950/30 text-rose-400 border border-rose-900/50 hover:bg-rose-950/50'
                }`}
                title="Remove Track"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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

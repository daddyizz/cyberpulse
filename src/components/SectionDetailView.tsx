import React, { useState } from 'react';
import { ArrowLeft, Play, Shuffle, Heart, Youtube, Music2, Search } from 'lucide-react';
import { Track, Playlist, Artist, Album } from '../types';
import { CyberArtwork } from './CyberArtwork';

export type SectionType = 'tracks' | 'playlists' | 'artists' | 'albums';

export interface SectionDetailConfig {
  title: string;
  subtitle: string;
  type: SectionType;
  items: any[];
  badgeText?: string;
  gradient?: string;
}

interface SectionDetailViewProps {
  config: SectionDetailConfig;
  onBack: () => void;
  onSelectTrack: (track: Track) => void;
  onSelectPlaylist: (playlistId: string) => void;
  onSelectArtist: (artistId: string) => void;
  onSelectAlbum: (albumId: string) => void;
  onToggleLike?: (trackId: string) => void;
  onPlayViaYouTube?: (track: Track) => void;
  currentTrackId?: string;
  theme?: string;
}

export const SectionDetailView: React.FC<SectionDetailViewProps> = ({
  config,
  onBack,
  onSelectTrack,
  onSelectPlaylist,
  onSelectArtist,
  onSelectAlbum,
  onToggleLike,
  onPlayViaYouTube,
  currentTrackId,
  theme = 'stealth_athletic',
}) => {
  const isLight = theme === 'pure_light';
  const [filterText, setFilterText] = useState('');

  const items = Array.isArray(config.items) ? config.items : [];

  const filteredItems = items.filter((item: any) => {
    if (!filterText.trim()) return true;
    const query = filterText.toLowerCase();
    const name = (item.title || item.name || '').toLowerCase();
    const sub = (item.artist || item.description || '').toLowerCase();
    return name.includes(query) || sub.includes(query);
  });

  const handlePlayAll = () => {
    if (config.type === 'tracks' && filteredItems.length > 0) {
      onSelectTrack(filteredItems[0] as Track);
    }
  };

  const handleShuffle = () => {
    if (config.type === 'tracks' && filteredItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredItems.length);
      onSelectTrack(filteredItems[randomIndex] as Track);
    }
  };

  return (
    <div className={`p-4 space-y-5 pb-32 animate-in fade-in duration-200 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* Top Bar Navigation */}
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
          {config.badgeText || 'Sona Collection'}
        </span>
        <div className="w-10" />
      </div>

      {/* Hero Banner */}
      <div
        className={`relative rounded-3xl overflow-hidden p-6 border flex flex-col items-center text-center shadow-xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : `border-white/10 bg-gradient-to-b ${config.gradient || 'from-[#00F5FF]/20 via-[#171B28]/80 to-[#10131C]/90'} backdrop-blur-xl`
        }`}
      >
        <div className={`w-24 h-24 rounded-2xl overflow-hidden border-2 mb-4 relative ${
          isLight ? 'border-slate-200 shadow-md' : 'border-white/20 shadow-2xl'
        }`}>
          {config.type === 'tracks' && items.length > 0 ? (
            <CyberArtwork
              artworkUrl={items[0]?.artworkUrl}
              title={items[0]?.title}
              artist={items[0]?.artist}
              keyName={items[0]?.placeholderArtworkKey}
            />
          ) : config.type === 'playlists' && items.length > 0 ? (
            <CyberArtwork
              artworkUrl={items[0]?.artworkUrl}
              title={items[0]?.title}
              keyName={items[0]?.artworkKey}
            />
          ) : config.type === 'artists' && items.length > 0 ? (
            <CyberArtwork
              artworkUrl={items[0]?.artworkUrl}
              title={items[0]?.name}
              keyName={items[0]?.artworkKey}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#10131C] text-[#00F5FF]'}`}>
              <Music2 className="w-10 h-10" />
            </div>
          )}
        </div>

        <h1 className={`text-2xl font-black uppercase tracking-tight mb-1 ${
          isLight ? 'text-slate-900' : 'text-[#F7F8FC]'
        }`}>
          {config.title}
        </h1>

        <p className={`text-xs leading-relaxed mb-4 max-w-sm ${
          isLight ? 'text-slate-600' : 'text-[#9CA3B7]'
        }`}>
          {config.subtitle}
        </p>

        <div className={`text-[11px] font-mono mb-4 font-bold ${
          isLight ? 'text-slate-500' : 'text-[#00F5FF]'
        }`}>
          {items.length} {items.length === 1 ? 'item' : 'items'} available
        </div>

        {/* Action Controls for Track Lists */}
        {config.type === 'tracks' && items.length > 0 && (
          <div className="flex items-center gap-3 w-full justify-center">
            <button
              onClick={handlePlayAll}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                  : 'bg-[#00F5FF] text-black shadow-[#00F5FF]/20 hover:brightness-110'
              }`}
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              Play All
            </button>
            <button
              onClick={handleShuffle}
              className={`px-4 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200 hover:text-slate-950'
                  : 'border-[#171B28] bg-[#10131C] text-[#F7F8FC] hover:border-[#00F5FF]/50'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
          </div>
        )}
      </div>

      {/* Quick Search Filter */}
      {items.length > 4 && (
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
            isLight ? 'text-slate-400' : 'text-[#61697C]'
          }`} />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={`Filter in ${config.title.toLowerCase()}...`}
            className={`w-full py-2.5 pl-10 pr-4 rounded-xl text-xs outline-none transition-colors border ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400 shadow-sm'
                : 'bg-[#10131C] border-[#171B28] focus:border-[#00F5FF] text-[#F7F8FC] placeholder-[#61697C]'
            }`}
          />
        </div>
      )}

      {/* Content Rendering By Type */}
      {config.type === 'tracks' && (
        <div className="space-y-2">
          {filteredItems.map((track: Track, idx: number) => {
            const isPlaying = track.id === currentTrackId;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${
                  isPlaying
                    ? isLight
                      ? 'bg-slate-100 border-slate-400 shadow-sm'
                      : 'bg-[#00F5FF]/10 border-[#00F5FF]'
                    : isLight
                    ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                    : 'bg-[#10131C]/60 hover:bg-[#10131C] border-[#171B28] hover:border-[#00F5FF]/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-5 text-center text-xs font-mono font-bold ${
                    isLight ? 'text-slate-400' : 'text-[#61697C]'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border shadow-md relative ${
                    isLight ? 'border-slate-200' : 'border-[#171B28]'
                  }`}>
                    <CyberArtwork
                      artworkUrl={track.artworkUrl}
                      title={track.title}
                      artist={track.artist}
                      keyName={track.placeholderArtworkKey}
                    />
                    {isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className={`w-2.5 h-2.5 rounded-full animate-ping ${isLight ? 'bg-slate-900' : 'bg-[#00F5FF]'}`} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold truncate transition-colors ${
                      isLight ? 'text-slate-900 group-hover:text-slate-950' : 'text-[#F7F8FC] group-hover:text-[#00F5FF]'
                    }`}>
                      {track.title}
                    </div>
                    <div className={`text-[11px] truncate ${
                      isLight ? 'text-slate-500' : 'text-[#9CA3B7]'
                    }`}>
                      {track.artist} • {track.album}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onPlayViaYouTube && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayViaYouTube(track);
                      }}
                      title="Play on YouTube"
                      className="px-2 py-1 rounded-lg bg-red-600/15 hover:bg-red-600 border border-red-500/40 text-red-600 hover:text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Youtube className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline">Video</span>
                    </button>
                  )}
                  {onToggleLike && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(track.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLight ? 'text-slate-400 hover:text-[#FF2ED1]' : 'text-[#61697C] hover:text-[#FF2ED1]'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          track.isLiked ? 'text-[#FF2ED1] fill-current' : ''
                        }`}
                      />
                    </button>
                  )}
                  <span className={`text-[11px] font-mono ${
                    isLight ? 'text-slate-400' : 'text-[#61697C]'
                  }`}>
                    {Math.floor(track.durationSeconds / 60)}:
                    {(track.durationSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {config.type === 'playlists' && (
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((pl: Playlist) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className={`p-3 rounded-2xl border cursor-pointer flex flex-col gap-2 group transition-all ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  : 'bg-[#10131C] border-[#171B28] hover:border-[#8B5CFF]/60'
              }`}
            >
              <div className={`aspect-square rounded-xl overflow-hidden relative border ${
                isLight ? 'border-slate-200' : 'border-[#171B28]'
              }`}>
                <CyberArtwork
                  artworkUrl={pl.artworkUrl}
                  title={pl.title}
                  keyName={pl.artworkKey}
                />
                <div className={`absolute bottom-2 left-2 backdrop-blur-md px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                  isLight
                    ? 'bg-white/90 border-slate-200 text-slate-800'
                    : 'bg-[#10131C]/80 border-[#171B28] text-[#F7F8FC]'
                }`}>
                  {pl.trackCount} tracks
                </div>
              </div>
              <div className={`text-xs font-bold truncate ${
                isLight ? 'text-slate-900 group-hover:text-slate-950' : 'text-[#F7F8FC] group-hover:text-[#00F5FF]'
              }`}>
                {pl.title}
              </div>
              <div className={`text-[10px] line-clamp-2 ${
                isLight ? 'text-slate-500' : 'text-[#9CA3B7]'
              }`}>
                {pl.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {config.type === 'artists' && (
        <div className="grid grid-cols-3 gap-3">
          {filteredItems.map((artist: Artist) => (
            <div
              key={artist.id}
              onClick={() => onSelectArtist(artist.id)}
              className={`flex flex-col items-center text-center p-3 rounded-2xl border cursor-pointer group transition-all ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  : 'bg-[#10131C] border-[#171B28] hover:border-[#00F5FF]'
              }`}
            >
              <div className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-all mb-2 ${
                isLight
                  ? 'border-slate-200 group-hover:border-slate-400 shadow-md'
                  : 'border-[#171B28] group-hover:border-[#00F5FF] shadow-lg shadow-black'
              }`}>
                <CyberArtwork
                  artworkUrl={artist.artworkUrl}
                  title={artist.name}
                  keyName={artist.artworkKey}
                />
              </div>
              <span className={`text-xs font-bold truncate w-full ${
                isLight ? 'text-slate-900 group-hover:text-slate-950' : 'text-[#F7F8FC] group-hover:text-[#00F5FF]'
              }`}>
                {artist.name}
              </span>
              <span className={`text-[10px] uppercase tracking-tighter ${
                isLight ? 'text-slate-500' : 'text-[#9CA3B7]'
              }`}>
                {(artist.followersCount / 1000).toFixed(0)}k pulses
              </span>
            </div>
          ))}
        </div>
      )}

      {config.type === 'albums' && (
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((album: Album) => (
            <div
              key={album.id}
              onClick={() => onSelectAlbum(album.id)}
              className={`p-3 rounded-2xl border cursor-pointer flex flex-col gap-2 group transition-all ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  : 'bg-[#10131C] border-[#171B28] hover:border-[#00F5FF]'
              }`}
            >
              <div className={`aspect-square rounded-xl overflow-hidden border ${
                isLight ? 'border-slate-200' : 'border-[#171B28]'
              }`}>
                <CyberArtwork
                  artworkUrl={album.artworkUrl}
                  title={album.title}
                  artist={album.artist}
                  keyName={album.artworkKey}
                />
              </div>
              <div className={`text-xs font-bold truncate ${
                isLight ? 'text-slate-900 group-hover:text-slate-950' : 'text-[#F7F8FC] group-hover:text-[#00F5FF]'
              }`}>
                {album.title}
              </div>
              <div className={`text-[10px] truncate ${
                isLight ? 'text-slate-500' : 'text-[#9CA3B7]'
              }`}>
                {album.artist} • {album.releaseYear}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

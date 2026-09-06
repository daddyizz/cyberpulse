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
  currentTrackId
}) => {
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
    <div className="p-4 space-y-5 pb-32 animate-in fade-in duration-200">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#10131C] border border-[#171B28] flex items-center justify-center text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF]/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono tracking-widest text-[#00F5FF] uppercase font-bold">
          {config.badgeText || 'CyberPulse Collection'}
        </span>
        <div className="w-10" />
      </div>

      {/* Hero Banner */}
      <div
        className={`relative rounded-3xl overflow-hidden p-6 border border-white/10 bg-gradient-to-b ${
          config.gradient || 'from-[#00F5FF]/20 via-[#171B28]/80 to-[#10131C]/90'
        } backdrop-blur-xl flex flex-col items-center text-center shadow-xl`}
      >
        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl mb-4 relative">
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
            <div className="w-full h-full bg-[#10131C] flex items-center justify-center">
              <Music2 className="w-10 h-10 text-[#00F5FF]" />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC] mb-1">
          {config.title}
        </h1>

        <p className="text-xs text-[#9CA3B7] leading-relaxed mb-4 max-w-sm">
          {config.subtitle}
        </p>

        <div className="text-[11px] font-mono text-[#00F5FF] mb-4">
          {items.length} {items.length === 1 ? 'item' : 'items'} available
        </div>

        {/* Action Controls for Track Lists */}
        {config.type === 'tracks' && items.length > 0 && (
          <div className="flex items-center gap-3 w-full justify-center">
            <button
              onClick={handlePlayAll}
              className="px-6 py-2.5 rounded-full bg-[#00F5FF] text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#00F5FF]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              Play All
            </button>
            <button
              onClick={handleShuffle}
              className="px-4 py-2.5 rounded-full border border-[#171B28] bg-[#10131C] text-[#F7F8FC] text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:border-[#00F5FF]/50 transition-all cursor-pointer"
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
          <Search className="w-4 h-4 text-[#61697C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={`Filter in ${config.title.toLowerCase()}...`}
            className="w-full py-2.5 pl-10 pr-4 bg-[#10131C] border border-[#171B28] focus:border-[#00F5FF] rounded-xl text-xs text-[#F7F8FC] placeholder-[#61697C] outline-none transition-colors"
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
                    ? 'bg-[#00F5FF]/10 border-[#00F5FF]'
                    : 'bg-[#10131C]/60 hover:bg-[#10131C] border-[#171B28] hover:border-[#00F5FF]/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-center text-xs font-mono text-[#61697C] font-bold">
                    {idx + 1}
                  </span>
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#171B28] shadow-md relative">
                    <CyberArtwork
                      artworkUrl={track.artworkUrl}
                      title={track.title}
                      artist={track.artist}
                      keyName={track.placeholderArtworkKey}
                    />
                    {isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#00F5FF] animate-ping" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#F7F8FC] truncate group-hover:text-[#00F5FF] transition-colors">
                      {track.title}
                    </div>
                    <div className="text-[11px] text-[#9CA3B7] truncate">
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
                      className="px-2 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-400 hover:text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
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
                      className="p-1.5 rounded-lg text-[#61697C] hover:text-[#FF2ED1] transition-colors cursor-pointer"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          track.isLiked ? 'text-[#FF2ED1] fill-current' : ''
                        }`}
                      />
                    </button>
                  )}
                  <span className="text-[11px] font-mono text-[#61697C]">
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
              className="p-3 rounded-2xl bg-[#10131C] border border-[#171B28] hover:border-[#8B5CFF]/60 cursor-pointer flex flex-col gap-2 group transition-all"
            >
              <div className="aspect-square rounded-xl overflow-hidden relative border border-[#171B28]">
                <CyberArtwork
                  artworkUrl={pl.artworkUrl}
                  title={pl.title}
                  keyName={pl.artworkKey}
                />
                <div className="absolute bottom-2 left-2 bg-[#10131C]/80 backdrop-blur-md px-2 py-0.5 rounded border border-[#171B28] text-[9px] font-bold text-[#F7F8FC] uppercase tracking-wider">
                  {pl.trackCount} tracks
                </div>
              </div>
              <div className="text-xs font-bold text-[#F7F8FC] truncate group-hover:text-[#00F5FF]">
                {pl.title}
              </div>
              <div className="text-[10px] text-[#9CA3B7] line-clamp-2">
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
              className="flex flex-col items-center text-center p-3 rounded-2xl bg-[#10131C] border border-[#171B28] hover:border-[#00F5FF] cursor-pointer group transition-all"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#171B28] group-hover:border-[#00F5FF] transition-all mb-2 shadow-lg shadow-black">
                <CyberArtwork
                  artworkUrl={artist.artworkUrl}
                  title={artist.name}
                  keyName={artist.artworkKey}
                />
              </div>
              <span className="text-xs font-bold text-[#F7F8FC] truncate w-full group-hover:text-[#00F5FF]">
                {artist.name}
              </span>
              <span className="text-[10px] text-[#9CA3B7] uppercase tracking-tighter">
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
              className="p-3 rounded-2xl bg-[#10131C] border border-[#171B28] hover:border-[#00F5FF] cursor-pointer flex flex-col gap-2 group transition-all"
            >
              <div className="aspect-square rounded-xl overflow-hidden border border-[#171B28]">
                <CyberArtwork
                  artworkUrl={album.artworkUrl}
                  title={album.title}
                  artist={album.artist}
                  keyName={album.artworkKey}
                />
              </div>
              <div className="text-xs font-bold text-[#F7F8FC] truncate group-hover:text-[#00F5FF]">
                {album.title}
              </div>
              <div className="text-[10px] text-[#9CA3B7] truncate">
                {album.artist} • {album.releaseYear}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

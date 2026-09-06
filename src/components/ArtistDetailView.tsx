import React, { useState } from 'react';
import { ArrowLeft, Play, Shuffle, Check, Plus, ChevronRight, Share2 } from 'lucide-react';
import { Artist, Track, Album } from '../types';
import { CyberArtwork } from './CyberArtwork';

interface ArtistDetailViewProps {
  artist: Artist;
  tracks?: Track[];
  albums?: Album[];
  onBack: () => void;
  onSelectTrack: (track: Track) => void;
  onSelectAlbum: (albumId: string) => void;
}

export const ArtistDetailView: React.FC<ArtistDetailViewProps> = ({
  artist,
  tracks = [],
  albums = [],
  onBack,
  onSelectTrack,
  onSelectAlbum,
}) => {
  const [isFollowing, setIsFollowing] = useState(artist?.isFollowed || false);
  const [notice, setNotice] = useState<string | null>(null);

  const safeTracks = Array.isArray(tracks) ? tracks : [];
  const safeAlbums = Array.isArray(albums) ? albums : [];

  const topTracks = safeTracks.filter(
    (t) => t && (t.artistId === artist?.id || t.artist?.toLowerCase() === artist?.name?.toLowerCase())
  );
  const artistAlbums = safeAlbums.filter(
    (a) => a && (a.artistId === artist?.id || a.artist?.toLowerCase() === artist?.name?.toLowerCase())
  );

  return (
    <div className="p-4 space-y-5 pb-28 animate-in fade-in duration-200">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#10131C] border border-[#171B28] flex items-center justify-center text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF]/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono tracking-widest text-[#00F5FF] uppercase font-bold">
          {artist.source === 'YOUTUBE' ? 'YouTube Channel' : 'Artist Profile'}
        </span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText?.(window.location.href);
            setNotice('Artist link copied to clipboard.');
          }}
          className="w-10 h-10 rounded-full bg-[#10131C] border border-[#171B28] flex items-center justify-center text-[#9CA3B7] hover:text-[#F7F8FC] transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden p-6 border border-[#171B28] bg-gradient-to-b from-[#171B28]/80 to-[#10131C]/90 backdrop-blur-xl flex flex-col items-center text-center">
        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#00F5FF] shadow-[0_0_30px_rgba(0,245,255,0.3)] mb-4">
          <CyberArtwork keyName={artist.artworkKey} artworkUrl={artist.artworkUrl} />
        </div>

        <span className="px-2.5 py-0.5 mb-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF]">
          {artist.source === 'YOUTUBE' ? 'YouTube Channel' : 'Official Artist'}
        </span>

        <h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC] mb-1">
          {artist.name}
        </h1>

        <div className="text-xs text-[#9CA3B7] font-medium tracking-wide mb-2">
          {artist.source === 'YOUTUBE'
            ? artist.isSubscriberCountHidden
              ? 'Subscribers: Hidden by Channel Creator'
              : artist.subscriberCount
              ? `${artist.subscriberCount.toLocaleString()} YouTube Channel Subscribers`
              : 'Subscribers: Statistics Unavailable'
            : `${((artist.followersCount || 0) / 1000).toLocaleString()}k Monthly Listeners`}
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 mb-4">
          {(artist.genres || []).map((g) => (
            <span
              key={g}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#10131C] border border-[#171B28] text-[#9CA3B7]"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full justify-center">
          <button
            onClick={() => {
              if (topTracks.length > 0) onSelectTrack(topTracks[0]);
              setNotice('Top track loaded into queue. Streaming launches in Block 3!');
            }}
            className="px-5 py-2.5 rounded-full bg-[#00F5FF] text-[#07090F] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-[#00F5FF]/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
            Play
          </button>

          <button
            onClick={() => {
              if (topTracks.length > 0) {
                const randomTrack = topTracks[Math.floor(Math.random() * topTracks.length)];
                onSelectTrack(randomTrack);
              }
              setNotice('Shuffle mode engaged.');
            }}
            className="p-2.5 rounded-full bg-[#10131C] border border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF]/40 transition-colors"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all ${
              isFollowing
                ? 'bg-[#00F5FF]/15 border-[#00F5FF] text-[#00F5FF]'
                : 'bg-[#10131C] border-[#171B28] text-[#9CA3B7] hover:text-white'
            }`}
          >
            {isFollowing ? (
              <>
                <Check className="w-3.5 h-3.5" /> Following
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Follow
              </>
            )}
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

      {/* Bio */}
      {artist.bio && (
        <div className="p-4 rounded-2xl bg-[#10131C]/80 border border-[#171B28]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-1.5">About</h3>
          <p className="text-xs text-[#F7F8FC] leading-relaxed">{artist.bio}</p>
        </div>
      )}

      {/* Top Tracks */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-3">
          Popular Tracks ({topTracks.length})
        </div>
        <div className="space-y-2">
          {topTracks.map((trk, idx) => (
            <div
              key={trk.id}
              onClick={() => onSelectTrack(trk)}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-[#10131C]/80 backdrop-blur-md border border-[#171B28] hover:border-[#00F5FF]/50 cursor-pointer transition-colors"
            >
              <span className="w-5 text-center text-xs font-mono text-[#61697C]">{idx + 1}</span>
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5">
                <CyberArtwork keyName={trk.placeholderArtworkKey} artworkUrl={trk.artworkUrl} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#F7F8FC] truncate">{trk.title}</div>
                <div className="text-[11px] text-[#9CA3B7] truncate">{trk.album}</div>
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

      {/* Albums / Releases */}
      {artistAlbums.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-3">
            Albums & Singles ({artistAlbums.length})
          </div>
          <div className="grid grid-cols-2 gap-3">
            {artistAlbums.map((alb) => (
              <div
                key={alb.id}
                onClick={() => onSelectAlbum(alb.id)}
                className="p-3 rounded-2xl bg-[#10131C]/90 border border-[#171B28] hover:border-[#00F5FF]/50 cursor-pointer transition-all hover:scale-[1.02] flex flex-col gap-2"
              >
                <div className="aspect-square rounded-xl overflow-hidden border border-white/5">
                  <CyberArtwork keyName={alb.artworkKey} artworkUrl={alb.artworkUrl} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#F7F8FC] truncate">{alb.title}</div>
                  <div className="text-[10px] text-[#9CA3B7] uppercase tracking-tighter">
                    {alb.releaseYear} • {alb.tracksCount} tracks
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

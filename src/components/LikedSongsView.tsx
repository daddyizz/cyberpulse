import React from 'react';
import { ArrowLeft, Play, Shuffle, Heart, Music, Youtube } from 'lucide-react';
import { Track } from '../types';
import { CyberArtwork } from './CyberArtwork';

interface LikedSongsViewProps {
  tracks?: Track[];
  onBack: () => void;
  onSelectTrack: (track: Track) => void;
  onToggleLike: (trackId: string, e?: React.MouseEvent) => void;
  onPlayViaYouTube?: (track: Track) => void;
}

export const LikedSongsView: React.FC<LikedSongsViewProps> = ({
  tracks = [],
  onBack,
  onSelectTrack,
  onToggleLike,
  onPlayViaYouTube,
}) => {
  const safeTracks = Array.isArray(tracks) ? tracks : [];
  const likedTracks = safeTracks.filter((t) => t?.isLiked);

  return (
    <div className="p-4 space-y-5 pb-32 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#10131C] border border-[#171B28] flex items-center justify-center text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#FF2ED1]/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono tracking-widest text-[#FF2ED1] uppercase font-bold">
          Liked Collection
        </span>
        <div className="w-10" />
      </div>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden p-6 border border-[#FF2ED1]/30 bg-gradient-to-b from-[#FF2ED1]/15 via-[#171B28]/80 to-[#10131C]/90 backdrop-blur-xl flex flex-col items-center text-center shadow-xl">
        <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-[#FF2ED1] to-[#8B5CFF] flex items-center justify-center text-white shadow-[0_0_40px_rgba(255,46,209,0.35)] mb-4">
          <Heart className="w-16 h-16 fill-white drop-shadow-md" />
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC] mb-1">
          Liked Songs
        </h1>

        <div className="text-xs font-bold uppercase text-[#FF2ED1] tracking-wider mb-2">
          Your Favorite Collection
        </div>

        <p className="text-xs text-[#9CA3B7] leading-relaxed mb-4 max-w-sm">
          All your favorite tracks saved permanently to stream anytime.
        </p>

        <div className="text-[11px] font-mono text-[#00F5FF] mb-4">
          {likedTracks.length} {likedTracks.length === 1 ? 'track' : 'tracks'} saved
        </div>

        {/* Action Buttons */}
        {likedTracks.length > 0 && (
          <div className="flex items-center gap-3 w-full justify-center">
            <button
              onClick={() => onSelectTrack(likedTracks[0])}
              className="px-6 py-2.5 rounded-full bg-[#FF2ED1] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#FF2ED1]/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              Play All
            </button>

            <button
              onClick={() => {
                const randomTrack = likedTracks[Math.floor(Math.random() * likedTracks.length)];
                onSelectTrack(randomTrack);
              }}
              className="p-2.5 rounded-full bg-[#10131C] border border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#FF2ED1]/40 transition-colors cursor-pointer"
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Track List */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-3 flex items-center justify-between">
          <span>Saved Collection ({likedTracks.length})</span>
          <span className="text-[10px] text-[#00F5FF]">Tap track to stream</span>
        </div>

        {likedTracks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-[#171B28] bg-[#10131C]/60 space-y-3">
            <Heart className="w-12 h-12 text-[#61697C] mx-auto opacity-50" />
            <div className="text-sm font-bold text-[#F7F8FC]">No liked tracks yet</div>
            <p className="text-xs text-[#9CA3B7] max-w-xs mx-auto">
              Tap the heart icon on any track while listening or browsing to save it to your library.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {likedTracks.map((trk, idx) => (
              <div
                key={trk.id}
                onClick={() => onSelectTrack(trk)}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#10131C]/80 backdrop-blur-md border border-[#171B28] hover:border-[#FF2ED1]/50 cursor-pointer transition-colors group"
              >
                <span className="w-5 text-center text-xs font-mono text-[#61697C]">{idx + 1}</span>
                <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-black">
                  <CyberArtwork keyName={trk.placeholderArtworkKey} artworkUrl={trk.artworkUrl} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#F7F8FC] truncate group-hover:text-[#FF2ED1] transition-colors">
                    {trk.title}
                  </div>
                  <div className="text-[11px] text-[#9CA3B7] truncate">{trk.artist}</div>
                </div>

                {onPlayViaYouTube && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayViaYouTube(trk);
                    }}
                    className="p-1.5 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 hover:text-white hover:bg-red-600 transition-all text-[10px] font-bold flex items-center gap-1"
                    title="Play on YouTube"
                  >
                    <Youtube className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}

                <button
                  onClick={(e) => onToggleLike(trk.id, e)}
                  className="p-1.5 text-[#FF2ED1] hover:scale-110 transition-transform"
                  title="Remove from Liked"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { ArrowLeft, Play, Shuffle, Heart, Music, Youtube } from 'lucide-react';
import { Track, SonaTheme } from '../types';
import { CyberArtwork } from './CyberArtwork';

interface LikedSongsViewProps {
  tracks?: Track[];
  theme?: SonaTheme;
  onBack: () => void;
  onSelectTrack: (track: Track) => void;
  onToggleLike: (trackId: string, e?: React.MouseEvent) => void;
  onPlayViaYouTube?: (track: Track) => void;
}

export const LikedSongsView: React.FC<LikedSongsViewProps> = ({
  tracks = [],
  theme = 'stealth_athletic',
  onBack,
  onSelectTrack,
  onToggleLike,
  onPlayViaYouTube,
}) => {
  const safeTracks = Array.isArray(tracks) ? tracks : [];
  const likedTracks = safeTracks.filter((t) => t?.isLiked);
  const isLight = theme === 'pure_light';

  return (
    <div
      className={`p-4 space-y-5 pb-32 animate-in fade-in duration-200 ${
        isLight ? 'bg-white text-slate-900' : 'text-white'
      }`}
    >
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              : 'bg-[#10131C] border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC]'
          }`}
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span
          className={`text-xs font-mono tracking-widest uppercase font-bold ${
            isLight ? 'text-rose-600' : 'text-[#FF2ED1]'
          }`}
        >
          Liked Collection
        </span>
        <div className="w-10" />
      </div>

      {/* Hero Header */}
      <div
        className={`relative rounded-3xl overflow-hidden p-6 border flex flex-col items-center text-center shadow-lg transition-all ${
          isLight
            ? 'bg-rose-50/70 border-rose-200 shadow-rose-100/50 text-slate-900'
            : 'border-[#FF2ED1]/30 bg-gradient-to-b from-[#FF2ED1]/15 via-[#171B28]/80 to-[#10131C]/90 text-white shadow-xl'
        }`}
      >
        <div
          className={`w-32 h-32 rounded-2xl flex items-center justify-center shadow-md mb-4 ${
            isLight
              ? 'bg-rose-500 text-white shadow-rose-300/50'
              : 'bg-gradient-to-br from-[#FF2ED1] to-[#8B5CFF] text-white shadow-[0_0_40px_rgba(255,46,209,0.35)]'
          }`}
        >
          <Heart className="w-14 h-14 fill-white drop-shadow-md" />
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tight mb-1">Liked Songs</h1>

        <div
          className={`text-xs font-bold uppercase tracking-wider mb-2 ${
            isLight ? 'text-rose-600' : 'text-[#FF2ED1]'
          }`}
        >
          Personal Favorite Collection
        </div>

        <p className={`text-xs leading-relaxed mb-4 max-w-sm ${isLight ? 'text-slate-600' : 'text-[#9CA3B7]'}`}>
          All your favorited tracks stored locally to stream anytime in fast 360p/480p audio.
        </p>

        <div
          className={`text-[11px] font-mono mb-4 font-bold ${
            isLight ? 'text-slate-700' : 'text-[#00F5FF]'
          }`}
        >
          {likedTracks.length} {likedTracks.length === 1 ? 'track' : 'tracks'} saved
        </div>

        {/* Action Buttons */}
        {likedTracks.length > 0 && (
          <div className="flex items-center gap-3 w-full justify-center">
            <button
              onClick={() => onSelectTrack(likedTracks[0])}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-900 text-white shadow-slate-900/20'
                  : 'bg-[#FF2ED1] text-white shadow-[#FF2ED1]/30'
              }`}
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              Play All
            </button>

            <button
              onClick={() => {
                const randomTrack = likedTracks[Math.floor(Math.random() * likedTracks.length)];
                onSelectTrack(randomTrack);
              }}
              className={`p-2.5 rounded-full border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-[#10131C] border-[#171B28] text-[#9CA3B7] hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Track List */}
      <div>
        <div
          className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center justify-between ${
            isLight ? 'text-slate-500' : 'text-[#9CA3B7]'
          }`}
        >
          <span>Saved Collection ({likedTracks.length})</span>
          <span className={`text-[10px] ${isLight ? 'text-slate-600 font-bold' : 'text-[#00F5FF]'}`}>
            Tap track to stream
          </span>
        </div>

        {likedTracks.length === 0 ? (
          <div
            className={`p-8 text-center rounded-2xl border space-y-3 ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-[#171B28] bg-[#10131C]/60'
            }`}
          >
            <Heart
              className={`w-12 h-12 mx-auto ${isLight ? 'text-slate-300' : 'text-[#61697C] opacity-50'}`}
            />
            <div className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-[#F7F8FC]'}`}>
              No liked tracks yet
            </div>
            <p className={`text-xs max-w-xs mx-auto ${isLight ? 'text-slate-500' : 'text-[#9CA3B7]'}`}>
              Tap the heart icon on any track while listening or browsing to save it to your library.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {likedTracks.map((trk, idx) => (
              <div
                key={trk.id}
                onClick={() => onSelectTrack(trk)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all group ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-sm'
                    : 'bg-[#10131C]/80 backdrop-blur-md border-[#171B28] hover:border-[#FF2ED1]/50'
                }`}
              >
                <span
                  className={`w-5 text-center text-xs font-mono ${
                    isLight ? 'text-slate-400' : 'text-[#61697C]'
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-inherit bg-black">
                  <CyberArtwork keyName={trk.placeholderArtworkKey} artworkUrl={trk.artworkUrl} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-bold truncate transition-colors ${
                      isLight ? 'text-slate-900 group-hover:text-rose-600' : 'text-[#F7F8FC] group-hover:text-[#FF2ED1]'
                    }`}
                  >
                    {trk.title}
                  </div>
                  <div className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-[#9CA3B7]'}`}>
                    {trk.artist}
                  </div>
                </div>

                {onPlayViaYouTube && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayViaYouTube(trk);
                    }}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                      isLight
                        ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-600 hover:text-white'
                        : 'bg-red-950/40 border-red-900/50 text-red-400 hover:text-white hover:bg-red-600'
                    }`}
                    title="Play on YouTube"
                  >
                    <Youtube className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}

                <button
                  onClick={(e) => onToggleLike(trk.id, e)}
                  className="p-1.5 text-rose-500 hover:scale-110 transition-transform"
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

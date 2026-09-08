import React from 'react';
import { ArrowLeft, Clock, Music, Flame, BarChart2, Radio, Award, Sparkles, TrendingUp } from 'lucide-react';
import { SonaTheme, Track } from '../types';

interface ListeningStatsViewProps {
  theme?: SonaTheme;
  tracks?: Track[];
  onBack: () => void;
  onSelectTrack?: (track: Track) => void;
}

export const ListeningStatsView: React.FC<ListeningStatsViewProps> = ({
  theme = 'stealth_athletic',
  tracks = [],
  onBack,
  onSelectTrack,
}) => {
  const isLight = theme === 'pure_light';

  const stats = {
    totalHours: '52.4',
    totalTracks: '384',
    currentStreak: '7 Days',
    topGenre: 'Electronic / Synthwave',
    streamQuality: '360p / 480p Fast Stream',
  };

  const dayActivity = [
    { day: 'Mon', hours: 4.2, height: '65%' },
    { day: 'Tue', hours: 3.5, height: '55%' },
    { day: 'Wed', hours: 6.8, height: '90%' },
    { day: 'Thu', hours: 5.1, height: '75%' },
    { day: 'Fri', hours: 7.4, height: '98%' },
    { day: 'Sat', hours: 6.0, height: '82%' },
    { day: 'Sun', hours: 4.8, height: '70%' },
  ];

  const topGenres = [
    { name: 'Electronic & Synthwave', percentage: 42, color: 'bg-emerald-500' },
    { name: 'Lo-Fi Chill & Beats', percentage: 26, color: 'bg-cyan-500' },
    { name: 'Pop & Modern Acoustic', percentage: 18, color: 'bg-amber-500' },
    { name: 'Deep Focus / Ambient', percentage: 14, color: 'bg-purple-500' },
  ];

  const topPlayedTracks = tracks.slice(0, 5);

  return (
    <div
      className={`p-4 space-y-5 pb-32 animate-in fade-in duration-200 ${
        isLight ? 'bg-white text-slate-900' : 'text-white'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isLight
              ? 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
              : 'bg-[#141416] border border-[#242428] text-[#8E8E93] hover:text-white'
          }`}
          title="Back to Profile"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span
            className={`text-xs font-mono tracking-widest uppercase font-bold ${
              isLight ? 'text-slate-900' : 'text-[var(--sona-accent,#CCFF00)]'
            }`}
          >
            Insights & Metrics
          </span>
          <h1 className="text-base font-black uppercase tracking-tight">Listening Statistics</h1>
        </div>

        <div className="w-10" />
      </div>

      {/* Stream Bandwidth & Quality Badge */}
      <div
        className={`p-3.5 rounded-2xl flex items-center justify-between border ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-[#141416] border-[#242428] text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-slate-900 text-white' : 'bg-[#242428] text-[var(--sona-accent,#CCFF00)]'
            }`}
          >
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">Fast Stream Engine Active</div>
            <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
              Optimized 360p/480p live playback for rapid, buffer-free song switching.
            </div>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isLight
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
          }`}
        >
          Active
        </span>
      </div>

      {/* Hero 3-Metric Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div
          className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-900'
              : 'bg-[#141416] border-[#242428] text-white'
          }`}
        >
          <Clock
            className={`w-4 h-4 mb-1.5 ${
              isLight ? 'text-slate-600' : 'text-[var(--sona-accent,#CCFF00)]'
            }`}
          />
          <div className="text-lg font-black">{stats.totalHours}h</div>
          <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
            Time Streamed
          </div>
        </div>

        <div
          className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-900'
              : 'bg-[#141416] border-[#242428] text-white'
          }`}
        >
          <Music
            className={`w-4 h-4 mb-1.5 ${
              isLight ? 'text-slate-600' : 'text-[var(--sona-accent,#CCFF00)]'
            }`}
          />
          <div className="text-lg font-black">{stats.totalTracks}</div>
          <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
            Total Tracks
          </div>
        </div>

        <div
          className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-900'
              : 'bg-[#141416] border-[#242428] text-white'
          }`}
        >
          <Flame className="w-4 h-4 mb-1.5 text-amber-500" />
          <div className="text-lg font-black">{stats.currentStreak}</div>
          <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
            Active Streak
          </div>
        </div>
      </div>

      {/* Weekly Activity Bar Chart */}
      <div
        className={`p-4 rounded-2xl border space-y-3 ${
          isLight
            ? 'bg-slate-50 border-slate-200'
            : 'bg-[#141416] border-[#242428]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-wider">Weekly Listening Hours</span>
          </div>
          <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
            Avg: 5.4h / day
          </span>
        </div>

        <div className="h-28 flex items-end justify-between gap-2 pt-4 px-2">
          {dayActivity.map((item) => (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="w-full flex items-end justify-center h-20">
                <div
                  style={{ height: item.height }}
                  className={`w-full max-w-[24px] rounded-t-md transition-all ${
                    isLight
                      ? 'bg-slate-800 hover:bg-slate-900'
                      : 'bg-[var(--sona-accent,#CCFF00)] hover:brightness-110'
                  }`}
                />
              </div>
              <span className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Genres Breakdown */}
      <div
        className={`p-4 rounded-2xl border space-y-3 ${
          isLight
            ? 'bg-slate-50 border-slate-200'
            : 'bg-[#141416] border-[#242428]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-black uppercase tracking-wider">Genre Preferences</span>
          </div>
          <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
            Top 4 Styles
          </span>
        </div>

        <div className="space-y-3">
          {topGenres.map((genre) => (
            <div key={genre.name} className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span>{genre.name}</span>
                <span className={`font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>
                  {genre.percentage}%
                </span>
              </div>
              <div
                className={`w-full h-2 rounded-full overflow-hidden ${
                  isLight ? 'bg-slate-200' : 'bg-[#242428]'
                }`}
              >
                <div
                  className={`h-full rounded-full ${genre.color}`}
                  style={{ width: `${genre.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Streamed Tracks */}
      <div
        className={`p-4 rounded-2xl border space-y-3 ${
          isLight
            ? 'bg-slate-50 border-slate-200'
            : 'bg-[#141416] border-[#242428]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-wider">Most Streamed Tracks</span>
          </div>
          <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
            This Month
          </span>
        </div>

        <div className="space-y-2">
          {topPlayedTracks.map((trk, idx) => (
            <div
              key={trk.id}
              onClick={() => onSelectTrack && onSelectTrack(trk)}
              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                isLight
                  ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-900'
                  : 'bg-[#0C0C0D] border-[#242428] hover:border-white/20 text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-xs font-mono font-bold w-4 text-center ${
                    isLight ? 'text-slate-400' : 'text-[#636366]'
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{trk.title}</div>
                  <div className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
                    {trk.artist}
                  </div>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono font-bold ${
                  isLight ? 'text-slate-500' : 'text-[#8E8E93]'
                }`}
              >
                {42 - idx * 7} plays
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

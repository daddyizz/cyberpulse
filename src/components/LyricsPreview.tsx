import React, { useEffect, useRef, useState } from 'react';
import { LyricLine, Track, SonaTheme } from '../types';
import { Play, Pause, X, Music, AlertCircle } from 'lucide-react';
import { fetchLyricsForTrack, getInitialLyrics } from '../services/lyricsService';

interface LyricsPreviewProps {
  track: Track;
  currentSeconds: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  onTogglePlayPause: () => void;
  onClose?: () => void;
  isModal?: boolean;
  theme?: SonaTheme;
}

export function LyricsPreview({
  track,
  currentSeconds,
  isPlaying,
  onSeek,
  onTogglePlayPause,
  onClose,
  isModal = false,
  theme = 'pure_light',
}: LyricsPreviewProps) {
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(() => getInitialLyrics(track));
  const [isLoading, setIsLoading] = useState<boolean>(!lyrics);
  const isLight = theme === 'pure_light';

  useEffect(() => {
    let isCancelled = false;
    const initial = getInitialLyrics(track);
    if (initial) {
      setLyrics(initial);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      fetchLyricsForTrack(track).then((res) => {
        if (!isCancelled) {
          setLyrics(res);
          setIsLoading(false);
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [track.id, track.title, track.artist]);

  const currentMs = currentSeconds * 1000;
  const activeIndex = lyrics && lyrics.length > 0
    ? lyrics.reduce((acc, line, idx) => (line.timeMs <= currentMs ? idx : acc), -1)
    : -1;

  const activeLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  const formatSecs = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${String(rem).padStart(2, '0')}`;
  };

  const content = (
    <div className={`flex flex-col ${isModal ? 'h-full' : 'max-h-[280px]'} w-full`}>
      <div className={`flex items-center justify-between pb-3 border-b text-xs ${isLight ? 'border-slate-200 text-slate-500' : 'border-[#242428] text-[#8E8E93]'}`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-slate-900' : 'bg-[#CCFF00] animate-pulse'}`} />
          <span className={`font-mono text-[11px] font-semibold ${isLight ? 'text-slate-900' : 'text-[#CCFF00]'}`}>Synced Database LRC</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-[#141416] border-[#242428] text-[#8E8E93]'}`}>Tap line to jump</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${isLight ? 'border-slate-900' : 'border-[#CCFF00]'}`} />
            <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>Fetching verified synchronized lyrics...</p>
          </div>
        ) : lyrics && lyrics.length > 0 ? (
          lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPassed = idx < activeIndex;
            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(line.timeMs / 1000)}
                className={`p-2.5 rounded-xl transition-all cursor-pointer select-none text-center ${
                  isActive
                    ? isLight
                      ? 'text-slate-900 font-black text-lg bg-slate-100 scale-105 shadow-sm'
                      : 'text-[#CCFF00] font-black text-lg bg-[#CCFF00]/10 scale-105 shadow-sm'
                    : isPassed
                    ? isLight
                      ? 'text-slate-400 text-sm font-medium hover:text-slate-900'
                      : 'text-[#8E8E93]/60 text-sm font-medium hover:text-white'
                    : isLight
                    ? 'text-slate-600 text-sm font-medium hover:text-slate-900'
                    : 'text-[#8E8E93] text-sm font-medium hover:text-white'
                }`}
              >
                {line.text}
              </div>
            );
          })
        ) : (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center px-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-[#141416] text-[#8E8E93]'}`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Lyrics Unavailable</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>No synchronized lyrics database entry found for &ldquo;{track.title}&rdquo;</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isModal) {
    return (
      <div className={`w-full max-w-[280px] h-[280px] rounded-3xl overflow-hidden border p-4 shadow-xl ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0C0C0E] border-[#242428] text-white'}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`sona-lyrics-modal absolute inset-0 z-50 backdrop-blur-2xl flex flex-col pt-12 sm:pt-14 px-5 pb-6 animate-in fade-in duration-200 ${isLight ? 'bg-white/98 text-slate-900' : 'bg-[#000000]/98 text-white'}`}>
      <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-slate-200' : 'border-[#242428]'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#141416] text-[#CCFF00]'}`}>
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-black uppercase truncate max-w-[200px] sm:max-w-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{track.title}</h3>
            <p className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-[#CCFF00]'}`}>{track.artist}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className={`p-2 rounded-full transition-colors cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-[#8E8E93] hover:text-white hover:bg-[#141416]'}`} title="Close lyrics">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 py-3 flex flex-col overflow-hidden">{content}</div>

      <div className={`pt-4 border-t flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-[#242428]'}`}>
        <div className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>{formatSecs(currentSeconds)}</div>
        <button onClick={onTogglePlayPause} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ${isLight ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-[#CCFF00] text-black shadow-[#CCFF00]/30'}`}>
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>
        <div className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>{formatSecs(track.durationSeconds || 214)}</div>
      </div>
    </div>
  );
}

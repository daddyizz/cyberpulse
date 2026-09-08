import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Battery, RotateCcw, Smartphone, Tablet, Home, Music } from 'lucide-react';
import type { SonaTheme, NrcAccentColor } from '../types';

interface AndroidFrameProps {
  children: React.ReactNode;
  themeMode?: SonaTheme;
  nrcAccent?: NrcAccentColor;
  isTabletView?: boolean;
  isAppMinimized?: boolean;
  isPlaying?: boolean;
  onToggleViewMode?: () => void;
  onResetOnboarding?: () => void;
  onToggleMinimize?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  themeMode = 'pure_light',
  nrcAccent = 'neon_green',
  isTabletView = false,
  isAppMinimized = false,
  isPlaying = false,
  onToggleViewMode,
  onResetOnboarding,
  onToggleMinimize,
}) => {
  const [time, setTime] = useState('09:41');
  const isLight = themeMode === 'pure_light';

  const nrcAccentHex =
    nrcAccent === 'purple_magic'
      ? '#B026FF'
      : nrcAccent === 'electric_blue'
      ? '#00E5FF'
      : '#CCFF00';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-4 px-2 relative z-10">
      <div
        className={`flex flex-wrap items-center justify-center gap-2.5 mb-3 px-5 py-2 rounded-full border text-xs shadow-2xl transition-all ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-600 shadow-slate-200/50'
            : 'bg-[#141416]/95 backdrop-blur-xl border-[#26262B] text-[#8E8E93] shadow-black/90'
        }`}
      >
        <span
          className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]"
          style={{ color: isLight ? '#0F172A' : nrcAccentHex }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: isLight ? '#0F172A' : nrcAccentHex,
              boxShadow: isLight ? 'none' : `0 0 8px ${nrcAccentHex}`,
            }}
          />
          Pixel 8 Pro • API 36
        </span>
        <div className={`w-[1px] h-3.5 ${isLight ? 'bg-slate-200' : 'bg-[#26262B]'}`} />
        <button
          onClick={onToggleViewMode}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold ${
            isLight ? 'hover:text-slate-950 text-slate-600' : 'hover:text-white text-[#8E8E93]'
          }`}
          title="Toggle phone / tablet mode"
        >
          {isTabletView ? (
            <Tablet className="w-3.5 h-3.5" style={{ color: isLight ? '#0F172A' : nrcAccentHex }} />
          ) : (
            <Smartphone className="w-3.5 h-3.5" style={{ color: isLight ? '#0F172A' : nrcAccentHex }} />
          )}
          <span>{isTabletView ? 'Tablet' : 'Phone'}</span>
        </button>
        <div className={`w-[1px] h-3.5 ${isLight ? 'bg-slate-200' : 'bg-[#26262B]'}`} />
        {onToggleMinimize && (
          <>
            <button
              onClick={onToggleMinimize}
              className={`flex items-center gap-1.5 transition-all cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-full ${
                isAppMinimized
                  ? isLight
                    ? 'bg-slate-900 text-white font-bold shadow-sm'
                    : 'text-black font-bold shadow-md'
                  : isLight
                  ? 'hover:text-slate-900 text-slate-600'
                  : 'hover:text-white text-[#8E8E93]'
              }`}
              style={
                isAppMinimized && !isLight
                  ? {
                      backgroundColor: nrcAccentHex,
                      color: nrcAccent === 'purple_magic' ? '#FFFFFF' : '#000000',
                    }
                  : undefined
              }
              title="Minimize to Android Home to verify background playback"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{isAppMinimized ? 'Return to App' : 'Minimize (Play in Background)'}</span>
            </button>
            <div className={`w-[1px] h-3.5 ${isLight ? 'bg-slate-200' : 'bg-[#26262B]'}`} />
          </>
        )}
        <button
          onClick={onResetOnboarding}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold ${
            isLight ? 'hover:text-rose-600 text-slate-500' : 'hover:text-white text-[#8E8E93]'
          }`}
          title="Test First-Launch Onboarding flow"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Onboarding</span>
        </button>
      </div>

      <div
        className={`relative transition-all duration-300 rounded-[36px] sm:rounded-[46px] p-2 sm:p-3 shadow-2xl border-2 sm:border-[3px] w-full ${
          isLight
            ? 'border-slate-200/90 bg-white shadow-slate-300/40'
            : 'border-[#26262B] bg-[#0C0C0D] shadow-black'
        } ${isTabletView ? 'max-w-[880px] h-[580px]' : 'max-w-[390px] h-[810px] max-h-[94vh] sm:max-h-[810px]'}`}
        style={{
          boxShadow: isLight
            ? '0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 20px rgba(0,0,0,0.04)'
            : `0 30px 80px -20px ${nrcAccentHex}1A, 0 0 60px rgba(0,0,0,0.95)`,
        }}
      >
        <div
          className={`relative w-full h-full rounded-[30px] sm:rounded-[38px] overflow-hidden flex flex-col ${
            isLight ? 'bg-white' : 'bg-[#000000]'
          }`}
        >
          <div
            className={`relative z-30 flex items-center justify-between px-5 sm:px-6 pt-3 pb-1 select-none text-[12px] sm:text-[13px] font-semibold pointer-events-none shrink-0 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            <div className="flex items-center gap-2 pl-1">
              <span className="tracking-wide">{time}</span>
              {isPlaying && (
                <span
                  className="flex items-center gap-1 text-[10px] font-mono animate-pulse"
                  style={{ color: isLight ? '#0F172A' : nrcAccentHex }}
                >
                  <Music className="w-3 h-3" />
                </span>
              )}
            </div>

            <div
              className={`hidden sm:flex absolute left-1/2 -translate-x-1/2 top-2.5 w-3.5 h-3.5 rounded-full border items-center justify-center ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#05070B] border-[#26262B]'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-slate-400' : 'bg-[#1C1C1E]'}`}
              />
            </div>

            <div className={`flex items-center gap-1.5 pr-1 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden flex flex-col z-10">{children}</div>

          <div
            onClick={onToggleMinimize}
            className="w-full flex justify-center py-2.5 relative z-30 select-none cursor-pointer group"
            title="Click Gesture Bar to Minimize / Return to Home Screen"
          >
            <div
              className="w-32 h-1 group-hover:h-1.5 rounded-full transition-all shadow-sm"
              style={{
                backgroundColor: isLight ? '#CBD5E1' : nrcAccentHex,
                opacity: isLight ? 1 : 0.6,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

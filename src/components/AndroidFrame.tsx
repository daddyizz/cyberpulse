import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Battery, RotateCcw, Smartphone, Tablet, Home, Music } from 'lucide-react';
import type { CyberTheme } from '../types';

interface AndroidFrameProps {
  children: React.ReactNode;
  themeMode?: CyberTheme;
  isTabletView?: boolean;
  isAppMinimized?: boolean;
  isPlaying?: boolean;
  onToggleViewMode?: () => void;
  onResetOnboarding?: () => void;
  onToggleMinimize?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  themeMode = 'frosted',
  isTabletView = false,
  isAppMinimized = false,
  isPlaying = false,
  onToggleViewMode,
  onResetOnboarding,
  onToggleMinimize,
}) => {
  const [time, setTime] = useState('09:41');
  const isMinimal = themeMode === 'minimal';

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
        className={`flex flex-wrap items-center justify-center gap-2.5 mb-3 px-5 py-2 rounded-full border text-xs shadow-2xl ${
          isMinimal
            ? 'bg-white/95 border-slate-200 text-slate-500 shadow-slate-300/30'
            : 'bg-[#10131C]/90 backdrop-blur-xl border-[#171B28] text-[#9CA3B7] shadow-black/80'
        }`}
      >
        <span className={`flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] ${isMinimal ? 'text-blue-600' : 'text-[#00F5FF]'}`}>
          <span className={`w-2 h-2 rounded-full ${isMinimal ? 'bg-blue-500' : 'bg-[#00F5FF] shadow-[0_0_8px_#00F5FF] animate-pulse'}`} />
          Pixel 8 Pro • API 36
        </span>
        <div className={`w-[1px] h-3.5 ${isMinimal ? 'bg-slate-200' : 'bg-[#171B28]'}`} />
        <button
          onClick={onToggleViewMode}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold ${isMinimal ? 'hover:text-slate-900' : 'hover:text-[#F7F8FC]'}`}
          title="Toggle phone / tablet mode"
        >
          {isTabletView ? <Tablet className={`w-3.5 h-3.5 ${isMinimal ? 'text-violet-600' : 'text-[#8B5CFF]'}`} /> : <Smartphone className={`w-3.5 h-3.5 ${isMinimal ? 'text-blue-600' : 'text-[#00F5FF]'}`} />}
          <span>{isTabletView ? 'Tablet' : 'Phone'}</span>
        </button>
        <div className={`w-[1px] h-3.5 ${isMinimal ? 'bg-slate-200' : 'bg-[#171B28]'}`} />
        {onToggleMinimize && (
          <>
            <button
              onClick={onToggleMinimize}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-full ${
                isAppMinimized
                  ? isMinimal
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-[#00F5FF] text-[#07090F] font-bold shadow-md shadow-[#00F5FF]/30'
                  : isMinimal
                  ? 'hover:text-blue-600 text-slate-500'
                  : 'hover:text-[#00F5FF] text-[#9CA3B7]'
              }`}
              title="Minimize to Android Home to verify background playback"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{isAppMinimized ? 'Return to App' : 'Minimize (Play in Background)'}</span>
            </button>
            <div className={`w-[1px] h-3.5 ${isMinimal ? 'bg-slate-200' : 'bg-[#171B28]'}`} />
          </>
        )}
        <button
          onClick={onResetOnboarding}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold ${isMinimal ? 'hover:text-rose-600' : 'hover:text-[#FF2ED1]'}`}
          title="Test First-Launch Onboarding flow"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Onboarding</span>
        </button>
      </div>

      <div
        className={`relative transition-all duration-300 rounded-[36px] sm:rounded-[46px] p-2 sm:p-3 shadow-2xl border-2 sm:border-[3px] w-full ${
          isMinimal
            ? 'border-slate-200 bg-slate-100/95'
            : 'border-[#171B28] bg-[#0E131F]/90 backdrop-blur-2xl'
        } ${isTabletView ? 'max-w-[880px] h-[580px]' : 'max-w-[390px] h-[810px] max-h-[94vh] sm:max-h-[810px]'}`}
        style={{
          boxShadow: isMinimal
            ? '0 28px 70px -24px rgba(15,23,42,.28)'
            : '0 30px 80px -20px rgba(0, 245, 255, 0.15), 0 0 50px rgba(0,0,0,0.9)',
        }}
      >
        <div
          className={`relative w-full h-full rounded-[30px] sm:rounded-[38px] overflow-hidden flex flex-col ${
            isMinimal ? 'bg-[#F8FAFC]' : themeMode === 'oled' ? 'bg-[#000000]' : 'bg-[#07090F]'
          }`}
        >
          {!isMinimal && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute top-[-10%] left-[-5%] w-[320px] h-[320px] bg-[#8B5CFF] opacity-10 rounded-full blur-[100px]" />
              <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] bg-[#00F5FF] opacity-10 rounded-full blur-[110px]" />
            </div>
          )}

          <div className={`relative z-30 flex items-center justify-between px-5 sm:px-6 pt-3 pb-1 select-none text-[12px] sm:text-[13px] font-semibold pointer-events-none shrink-0 ${isMinimal ? 'text-slate-900' : 'text-[#F7F8FC]'}`}>
            <div className="flex items-center gap-2 pl-1">
              <span className="tracking-wide">{time}</span>
              {isPlaying && (
                <span className={`flex items-center gap-1 text-[10px] font-mono ${isMinimal ? 'text-blue-600' : 'text-[#00F5FF] animate-pulse'}`}>
                  <Music className="w-3 h-3" />
                </span>
              )}
            </div>

            <div className={`hidden sm:flex absolute left-1/2 -translate-x-1/2 top-2.5 w-3.5 h-3.5 rounded-full border items-center justify-center ${isMinimal ? 'bg-slate-900 border-slate-700' : 'bg-[#05070B] border-[#171B28]'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isMinimal ? 'bg-slate-600' : 'bg-[#10131C]'}`} />
            </div>

            <div className={`flex items-center gap-1.5 pr-1 ${isMinimal ? 'text-slate-700' : 'text-[#F7F8FC]/80'}`}>
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
            <div className={`w-32 h-1 group-hover:h-1.5 rounded-full transition-all shadow-sm ${isMinimal ? 'bg-slate-300 group-hover:bg-blue-500' : 'bg-white/30 group-hover:bg-[#00F5FF]'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};
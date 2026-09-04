import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Battery, RotateCcw, Smartphone, Tablet } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  themeMode?: 'frosted' | 'cyberpunk' | 'oled';
  isTabletView?: boolean;
  onToggleViewMode?: () => void;
  onResetOnboarding?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  themeMode = 'frosted',
  isTabletView = false,
  onToggleViewMode,
  onResetOnboarding,
}) => {
  const [time, setTime] = useState('09:41');

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
      {/* Emulator Controls Toolbar with Frosted Glass Styling */}
      <div className="flex items-center gap-3 mb-3 bg-[#10131C]/90 backdrop-blur-xl px-5 py-2 rounded-full border border-[#171B28] text-xs text-[#9CA3B7] shadow-2xl shadow-black/80">
        <span className="flex items-center gap-2 font-bold text-[#00F5FF] uppercase tracking-wider text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#00F5FF] shadow-[0_0_8px_#00F5FF] animate-pulse" />
          Pixel 8 Pro • API 34
        </span>
        <div className="w-[1px] h-3.5 bg-[#171B28]" />
        <button
          onClick={onToggleViewMode}
          className="flex items-center gap-1.5 hover:text-[#F7F8FC] transition-colors cursor-pointer text-xs font-semibold"
          title="Toggle phone / tablet mode"
        >
          {isTabletView ? <Tablet className="w-3.5 h-3.5 text-[#8B5CFF]" /> : <Smartphone className="w-3.5 h-3.5 text-[#00F5FF]" />}
          <span>{isTabletView ? 'Tablet (NavRail)' : 'Phone (BottomNav)'}</span>
        </button>
        <div className="w-[1px] h-3.5 bg-[#171B28]" />
        <button
          onClick={onResetOnboarding}
          className="flex items-center gap-1.5 hover:text-[#FF2ED1] transition-colors cursor-pointer text-xs font-semibold"
          title="Test First-Launch Onboarding flow"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Onboarding</span>
        </button>
      </div>

      {/* Android Device Shell with Frosted Accent Border */}
      <div
        className={`relative transition-all duration-300 rounded-[46px] p-3 shadow-2xl border-[3px] border-[#171B28] bg-[#0E131F]/90 backdrop-blur-2xl ${
          isTabletView ? 'w-[880px] h-[580px]' : 'w-[390px] h-[810px]'
        }`}
        style={{
          boxShadow: '0 30px 80px -20px rgba(0, 245, 255, 0.15), 0 0 50px rgba(0,0,0,0.9)',
        }}
      >
        {/* Device Inner Screen */}
        <div
          className={`relative w-full h-full rounded-[38px] overflow-hidden flex flex-col ${
            themeMode === 'oled' ? 'bg-[#000000]' : 'bg-[#07090F]'
          }`}
        >
          {/* Ambient Frosted Orb within phone viewport */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-5%] w-[320px] h-[320px] bg-[#8B5CFF] opacity-10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] bg-[#00F5FF] opacity-10 rounded-full blur-[110px]" />
          </div>

          {/* Android Status Bar */}
          <div className="relative z-30 flex items-center justify-between px-6 pt-3 pb-1 select-none text-[13px] font-semibold text-[#F7F8FC]">
            {/* Clock */}
            <span className="tracking-wide pl-1">{time}</span>

            {/* Camera Punch Hole */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-3.5 h-3.5 rounded-full bg-[#05070B] border border-[#171B28] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10131C]" />
            </div>

            {/* System Status Icons */}
            <div className="flex items-center gap-1.5 pr-1 text-[#F7F8FC]/80">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Screen Display Area */}
          <div className="flex-1 relative overflow-hidden flex flex-col z-10">{children}</div>

          {/* Android Gesture Bar */}
          <div className="w-full flex justify-center py-2 relative z-30 select-none pointer-events-none">
            <div className="w-32 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

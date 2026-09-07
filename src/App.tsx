import React, { useState, useEffect } from 'react';
import { Smartphone, Code2, Cpu } from 'lucide-react';
import { AndroidFrame } from './components/AndroidFrame';
import { CyberPulseApp } from './components/CyberPulseApp';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { AppPreferences } from './types';
import { applyThemeMarker } from './utils/themeMarker';

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'frosted',
  reduceAnimations: false,
  dynamicBackgrounds: true,
  dataSaver: false,
  recommendationsEnabled: true,
  notificationsEnabled: true,
  isOnboardingCompleted: false,
  selectedGenres: ['Electronic', 'Synthwave', 'Metal'],
  selectedArtists: ['art_01', 'art_02'],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isTabletView, setIsTabletView] = useState<boolean>(false);
  const [isAppMinimized, setIsAppMinimized] = useState<boolean>(false);
  const [isPlaybackActive, setIsPlaybackActive] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<AppPreferences>(() => {
    try {
      const saved = localStorage.getItem('cyberpulse_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PREFERENCES, ...parsed, theme: parsed.theme || 'frosted' };
      }
    } catch {
      // ignore
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cyberpulse_preferences', JSON.stringify(preferences));
    } catch {
      // ignore
    }
    applyThemeMarker(preferences.theme);
  }, [preferences]);

  const handleUpdatePreferences = (partial: Partial<AppPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...partial }));
  };

  const handleResetOnboarding = () => {
    handleUpdatePreferences({ isOnboardingCompleted: false });
  };

  const themeLabel =
    preferences.theme === 'minimal'
      ? 'PREMIUM LIGHT'
      : preferences.theme === 'oled'
      ? 'OLED BLACK'
      : preferences.theme === 'sporty'
      ? 'SPORTY NEON'
      : 'FROSTED GLASS';

  return (
    <div className="min-h-screen bg-[#07090F] text-[#F7F8FC] flex flex-col font-sans relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 cyber-global-ambient">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#8B5CFF] opacity-15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#00F5FF] opacity-15 rounded-full blur-[150px]" />
      </div>

      <header className="border-b border-[#171B28] bg-[#07090F]/80 backdrop-blur-xl sticky top-0 z-40 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00F5FF] via-[#8B5CFF] to-[#FF2ED1] flex items-center justify-center p-[1.5px] shadow-lg shadow-[#00F5FF]/20">
            <div className="w-full h-full bg-[#07090F] rounded-[10px] flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[#00F5FF]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-[#F7F8FC] text-base">CYBERPULSE MUSIC</span>
              <span className="text-[10px] font-mono font-bold bg-[#00F5FF]/15 text-[#00F5FF] px-2 py-0.5 rounded-full border border-[#00F5FF]/30 tracking-wider">
                {themeLabel}
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3B7]">
              Native Android Platform • Jetpack Compose • {themeLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#10131C]/90 backdrop-blur-md p-1 rounded-xl border border-[#171B28]">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'preview'
                ? 'bg-[#00F5FF] text-[#07090F] shadow-sm shadow-[#00F5FF]/30'
                : 'text-[#9CA3B7] hover:text-[#F7F8FC]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Interactive Android Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'code'
                ? 'bg-[#00F5FF] text-[#07090F] shadow-sm shadow-[#00F5FF]/30'
                : 'text-[#9CA3B7] hover:text-[#F7F8FC]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Native Kotlin Codebase</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className={activeTab === 'preview' ? 'flex flex-col flex-1' : 'hidden'}>
          <AndroidFrame
            themeMode={preferences.theme}
            isTabletView={isTabletView}
            isAppMinimized={isAppMinimized}
            isPlaying={isPlaybackActive}
            onToggleViewMode={() => setIsTabletView(!isTabletView)}
            onResetOnboarding={handleResetOnboarding}
            onToggleMinimize={() => setIsAppMinimized(!isAppMinimized)}
          >
            <CyberPulseApp
              isTabletView={isTabletView}
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              isAppMinimized={isAppMinimized}
              onToggleMinimize={() => setIsAppMinimized(!isAppMinimized)}
              onPlaybackStateChange={(playing) => setIsPlaybackActive(playing)}
            />
          </AndroidFrame>
        </div>

        {activeTab === 'code' && (
          <div className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col">
            <CodebaseExplorer />
          </div>
        )}
      </main>
    </div>
  );
}
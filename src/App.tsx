import React, { useState, useEffect } from 'react';
import { Smartphone, Code2, Cpu } from 'lucide-react';
import { AndroidFrame } from './components/AndroidFrame';
import { CyberPulseApp } from './components/CyberPulseApp';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { AppPreferences } from './types';
import { applyThemeMarker } from './utils/themeMarker';

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'pure_light',
  nrcAccent: 'neon_green',
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
        const validTheme =
          parsed.theme === 'pure_light' || parsed.theme === 'nike_run_club'
            ? parsed.theme
            : 'pure_light';
        const validNrcAccent =
          parsed.nrcAccent === 'purple_magic' || parsed.nrcAccent === 'electric_blue'
            ? parsed.nrcAccent
            : 'neon_green';
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          theme: validTheme,
          nrcAccent: validNrcAccent,
        };
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
    applyThemeMarker(preferences.theme, preferences.nrcAccent || 'neon_green');
  }, [preferences]);

  const handleUpdatePreferences = (partial: Partial<AppPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...partial }));
  };

  const handleResetOnboarding = () => {
    handleUpdatePreferences({ isOnboardingCompleted: false });
  };

  const isLight = preferences.theme === 'pure_light';
  const nrcAccent = preferences.nrcAccent || 'neon_green';
  const nrcAccentHex =
    nrcAccent === 'purple_magic'
      ? '#B026FF'
      : nrcAccent === 'electric_blue'
      ? '#00E5FF'
      : '#CCFF00';

  const themeLabel =
    preferences.theme === 'pure_light' ? 'SONA PURE LIGHT' : 'NIKE RUN CLUB DARK';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-200 ${
        isLight ? 'bg-[#F8FAFC] text-[#0F172A]' : 'bg-[#000000] text-white'
      }`}
    >
      <header
        className={`border-b sticky top-0 z-40 px-5 py-3.5 flex items-center justify-between transition-colors ${
          isLight
            ? 'border-slate-200 bg-white/95 backdrop-blur-xl text-[#0F172A]'
            : 'border-[#242428] bg-[#000000]/95 backdrop-blur-xl text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center p-[1.5px] shadow-md transition-all ${
              isLight
                ? 'bg-slate-900 text-white'
                : 'shadow-lg'
            }`}
            style={
              !isLight
                ? {
                    backgroundColor: nrcAccentHex,
                    boxShadow: `0 4px 14px ${nrcAccentHex}40`,
                  }
                : undefined
            }
          >
            <div
              className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                isLight ? 'bg-slate-900' : 'bg-[#0C0C0D]'
              }`}
            >
              <Cpu
                className="w-4 h-4"
                style={{ color: isLight ? '#FFFFFF' : nrcAccentHex }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-base">SONA MUSIC</span>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border tracking-wider transition-colors"
                style={{
                  backgroundColor: isLight ? '#F1F5F9' : `${nrcAccentHex}20`,
                  borderColor: isLight ? '#E2E8F0' : `${nrcAccentHex}60`,
                  color: isLight ? '#0F172A' : nrcAccentHex,
                }}
              >
                {themeLabel}
              </span>
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
              Native Android Platform • Jetpack Compose • {themeLabel}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 p-1 rounded-xl border transition-colors ${
            isLight
              ? 'bg-slate-100/90 border-slate-200'
              : 'bg-[#141416]/95 border-[#242428]'
          }`}
        >
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'preview'
                ? isLight
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-black font-black shadow-md'
                : isLight
                ? 'text-slate-600 hover:text-slate-950'
                : 'text-[#8E8E93] hover:text-white'
            }`}
            style={
              activeTab === 'preview' && !isLight
                ? {
                    backgroundColor: nrcAccentHex,
                    color: nrcAccent === 'purple_magic' ? '#FFFFFF' : '#000000',
                  }
                : undefined
            }
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Interactive Android Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'code'
                ? isLight
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-black font-black shadow-md'
                : isLight
                ? 'text-slate-600 hover:text-slate-950'
                : 'text-[#8E8E93] hover:text-white'
            }`}
            style={
              activeTab === 'code' && !isLight
                ? {
                    backgroundColor: nrcAccentHex,
                    color: nrcAccent === 'purple_magic' ? '#FFFFFF' : '#000000',
                  }
                : undefined
            }
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
            nrcAccent={preferences.nrcAccent}
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

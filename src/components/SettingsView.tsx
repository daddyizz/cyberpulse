import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Sparkles,
  Volume2,
  Shield,
  Trash2,
  User,
  Bell,
  Database,
  Save,
  Zap,
} from 'lucide-react';
import type { AppPreferences, CyberTheme } from '../types';

interface SettingsViewProps {
  preferences: AppPreferences;
  userName?: string;
  isProUser?: boolean;
  onUpdatePreferences: (prefs: Partial<AppPreferences>) => void;
  onUpdateUserName?: (name: string) => void;
  onOpenSubscriptionModal?: () => void;
  onBack: () => void;
}

type ThemeOption = {
  id: CyberTheme;
  name: string;
  description: string;
  dotClass: string;
  activeClass: string;
};

const themeOptions: ThemeOption[] = [
  {
    id: 'pure_light',
    name: 'Sona Pure Light',
    description: 'Clean, spotless white aesthetic. Generous spacing, crisp high-contrast typography, completely free from dark palettes.',
    dotClass: 'bg-slate-900',
    activeClass: 'border-slate-800 shadow-slate-900/10 ring-2 ring-slate-900/10',
  },
  {
    id: 'stealth_athletic',
    name: 'Stealth Athletic Dark',
    description: 'Deep stealth-black athletic aesthetic with high-contrast dynamic neon accents.',
    dotClass: 'bg-[#CCFF00]',
    activeClass: 'border-[#CCFF00] shadow-[#CCFF00]/20 ring-2 ring-[#CCFF00]/20',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  userName = 'Sona Listener',
  isProUser = false,
  onUpdatePreferences,
  onUpdateUserName,
  onOpenSubscriptionModal,
  onBack,
}) => {
  const [eqPreset, setEqPreset] = useState('Bass Boost');
  const [crossfade, setCrossfade] = useState(3);
  const [volumeNormalize, setVolumeNormalize] = useState(true);
  const [cacheSize, setCacheSize] = useState(42.8);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [inputName, setInputName] = useState(userName);
  const [nameSavedNotice, setNameSavedNotice] = useState(false);

  const isLight = preferences.theme === 'pure_light';

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputName.trim() || 'Sona Listener';
    setInputName(trimmed);
    if (onUpdateUserName) {
      onUpdateUserName(trimmed);
    }
    try {
      localStorage.setItem('sona_display_name', trimmed);
    } catch {
      // ignore
    }
    setNameSavedNotice(true);
    setTimeout(() => setNameSavedNotice(false), 2500);
  };

  const handleClearCache = () => {
    setCacheSize(0);
    setCacheCleared(true);
    try {
      localStorage.removeItem('cyberpulse_live_catalog_v1');
    } catch {
      // ignore
    }
    window.setTimeout(() => setCacheCleared(false), 2500);
  };

  const sectionClass = isLight
    ? 'scroll-mt-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 transition-all'
    : 'scroll-mt-4 p-4 rounded-2xl border border-[#242428] bg-[#141418] space-y-4 transition-all';

  const subtextClass = isLight ? 'text-slate-500 text-[11px]' : 'text-[#8E8E93] text-[11px]';
  const headingClass = isLight ? 'text-slate-900 font-black' : 'text-white font-black';

  return (
    <div
      className={`p-4 space-y-6 pb-32 animate-in fade-in duration-200 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'text-white'
      }`}
    >
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              : 'bg-[#141416] border-[#242428] text-[#8E8E93] hover:text-white'
          }`}
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-black uppercase tracking-tight ${headingClass}`}>Settings</h1>
          <p className={subtextClass}>Account, appearance, audio engine, privacy, and system preferences.</p>
        </div>
      </div>

      {/* SECTION 1: ACCOUNT & DISPLAY NAME */}
      <section id="settings-account" className={sectionClass}>
        <div className="flex items-center justify-between">
          <div
            className={`text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 ${
              isLight ? 'text-slate-900' : 'text-[var(--sona-accent,#CCFF00)]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account & Profile</span>
          </div>
          {nameSavedNotice && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        {/* Display Name Input with Explicit Save Button */}
        <form onSubmit={handleSaveName} className="space-y-2">
          <label className={`text-[11px] font-bold uppercase ${isLight ? 'text-slate-700' : 'text-[#8E8E93]'}`}>
            Display Name
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputName}
              onChange={(event) => setInputName(event.target.value)}
              placeholder="Enter your name"
              className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-900 focus:bg-white'
                  : 'bg-[#1C1C22] border-[#2E2E36] text-white focus:border-[var(--sona-accent,#CCFF00)]'
              }`}
            />
            <button
              type="submit"
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                  : 'bg-[var(--sona-accent,#CCFF00)] text-black hover:brightness-110 active:scale-95'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
          <div className={subtextClass}>
            This name appears in your daily greetings and personalized library badges.
          </div>
        </form>

        {/* Membership Tier Row */}
        <div className={`flex items-center justify-between border-t pt-3 ${isLight ? 'border-slate-100' : 'border-[#242428]'}`}>
          <div>
            <div className={`text-xs font-bold uppercase ${headingClass}`}>Membership Tier</div>
            <div className={subtextClass}>
              {isProUser
                ? 'Sona Pro active • Unlimited imports & fast stream switching.'
                : 'Free tier • Upgrade to unlock audiophile DSP & unlimited imports.'}
            </div>
          </div>
          {onOpenSubscriptionModal && (
            <button
              type="button"
              onClick={onOpenSubscriptionModal}
              className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isProUser
                  ? 'bg-emerald-500/15 border border-emerald-500 text-emerald-500'
                  : isLight
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-[var(--sona-accent,#CCFF00)] text-black hover:brightness-110'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isProUser ? 'Pro Active' : 'Upgrade to Pro'}</span>
            </button>
          )}
        </div>
      </section>

      {/* SECTION 2: APPEARANCE & THEMES */}
      <section id="settings-appearance" className="scroll-mt-4 space-y-3 transition-all">
        <div className="flex items-center justify-between">
          <div
            className={`text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 ${
              isLight ? 'text-slate-900' : 'text-[var(--sona-accent,#CCFF00)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Appearance & Themes</span>
          </div>
          <span className={`text-[10px] font-mono uppercase ${subtextClass}`}>
            Theme: {preferences.theme === 'pure_light' ? 'Pure Light' : 'Stealth Athletic'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {themeOptions.map((theme) => {
            const active =
              preferences.theme === theme.id ||
              (theme.id === 'stealth_athletic' && preferences.theme === ('nike_run_club' as any));

            return (
              <button
                key={theme.id}
                onClick={() => onUpdatePreferences({ theme: theme.id })}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  active
                    ? isLight && theme.id === 'pure_light'
                      ? 'border-slate-900 bg-white shadow-md ring-2 ring-slate-900/10'
                      : !isLight && theme.id !== 'pure_light'
                      ? 'border-[var(--sona-accent,#CCFF00)] bg-[#1A1A20] shadow-md ring-1 ring-[var(--sona-accent,#CCFF00)]/40'
                      : 'border-slate-400 bg-white'
                    : isLight
                    ? 'border-slate-200 bg-white/70 hover:border-slate-300'
                    : 'border-[#242428] bg-[#141418] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-black uppercase flex items-center gap-1.5 ${headingClass}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${theme.dotClass}`} />
                    {theme.name}
                  </span>
                  {active && (
                    <Check
                      className={`w-4 h-4 ${
                        isLight ? 'text-slate-900' : 'text-[var(--sona-accent,#CCFF00)]'
                      }`}
                    />
                  )}
                </div>
                <div className={`${subtextClass} leading-relaxed`}>{theme.description}</div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Athletic Accent Selector (Shown in Stealth Athletic Theme) */}
        {(preferences.theme === 'stealth_athletic' || preferences.theme === ('nike_run_club' as any)) && (
          <div className="mt-3 p-3.5 rounded-2xl border border-[#242428] bg-[#141418] space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--sona-accent,#CCFF00)]" />
                <span>Stealth Athletic Accent Options</span>
              </div>
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">
                {preferences.nrcAccent || 'neon_green'}
              </span>
            </div>
            <p className="text-[10px] text-[#8E8E93] leading-relaxed">
              Select your signature athletic accent color (Neon Volt, Purple Magic, or Electric Blue):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdatePreferences({ nrcAccent: 'neon_green' })}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  (preferences.nrcAccent || 'neon_green') === 'neon_green'
                    ? 'border-[#CCFF00] bg-[#CCFF00]/15 shadow-md shadow-[#CCFF00]/25'
                    : 'border-[#26262B] bg-[#1C1C20] hover:border-white/30'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-[#CCFF00] shadow-sm shadow-[#CCFF00]/60" />
                <span className="text-[10px] font-black text-white">Neon Volt</span>
                <span className="text-[8px] text-[#8E8E93] font-mono">Electric Green</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdatePreferences({ nrcAccent: 'purple_magic' })}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  preferences.nrcAccent === 'purple_magic'
                    ? 'border-[#B026FF] bg-[#B026FF]/15 shadow-md shadow-[#B026FF]/25'
                    : 'border-[#26262B] bg-[#1C1C20] hover:border-white/30'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-[#B026FF] shadow-sm shadow-[#B026FF]/60" />
                <span className="text-[10px] font-black text-white">Purple Magic</span>
                <span className="text-[8px] text-[#8E8E93] font-mono">Atmospheric</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdatePreferences({ nrcAccent: 'electric_blue' })}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  preferences.nrcAccent === 'electric_blue'
                    ? 'border-[#00E5FF] bg-[#00E5FF]/15 shadow-md shadow-[#00E5FF]/25'
                    : 'border-[#26262B] bg-[#1C1C20] hover:border-white/30'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-[#00E5FF] shadow-sm shadow-[#00E5FF]/60" />
                <span className="text-[10px] font-black text-white">Electric Blue</span>
                <span className="text-[8px] text-[#8E8E93] font-mono">High Energy</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: AUDIO ENGINE & DSP */}
      <section id="settings-audio" className={sectionClass}>
        <div className="flex items-center justify-between">
          <div
            className={`text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 ${
              isLight ? 'text-slate-900' : 'text-[var(--sona-accent,#CCFF00)]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Audio DSP & Playback Engine</span>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/10 text-white'
            }`}
          >
            360p Fast Stream
          </span>
        </div>

        {/* Equalizer Presets */}
        <div className="space-y-1.5">
          <label className={`text-[11px] font-bold uppercase ${isLight ? 'text-slate-700' : 'text-[#8E8E93]'}`}>
            Equalizer Preset
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['Flat', 'Bass Boost', 'Acoustic Clarity', 'Vocal Focus', 'Club Energy'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setEqPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  eqPreset === preset
                    ? isLight
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-[var(--sona-accent,#CCFF00)] text-black'
                    : isLight
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-[#1C1C20] text-[#8E8E93] hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Crossfade */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className={`font-bold uppercase ${isLight ? 'text-slate-700' : 'text-[#8E8E93]'}`}>
              Audio Crossfade
            </span>
            <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-[var(--sona-accent,#CCFF00)]'}`}>
              {crossfade}s
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={crossfade}
            onChange={(event) => setCrossfade(Number(event.target.value))}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
              isLight ? 'bg-slate-200 accent-slate-900' : 'bg-[#242428] accent-[var(--sona-accent,#CCFF00)]'
            }`}
          />
        </div>

        {/* Volume Normalization Switch */}
        <div
          className={`flex items-center justify-between pt-2 border-t ${
            isLight ? 'border-slate-100' : 'border-[#242428]'
          }`}
        >
          <div>
            <div className={`text-xs font-bold uppercase ${headingClass}`}>Volume Normalization</div>
            <div className={subtextClass}>Maintain consistent sound levels across all streamed songs.</div>
          </div>
          <button
            type="button"
            onClick={() => setVolumeNormalize(!volumeNormalize)}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer ${
              volumeNormalize
                ? isLight
                  ? 'bg-slate-900'
                  : 'bg-[var(--sona-accent,#CCFF00)]'
                : isLight
                ? 'bg-slate-200'
                : 'bg-[#2E2E36]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full transition-transform ${
                volumeNormalize ? 'translate-x-6' : 'translate-x-0'
              } ${
                volumeNormalize
                  ? isLight
                    ? 'bg-white shadow'
                    : 'bg-black shadow'
                  : isLight
                  ? 'bg-white shadow-sm border border-slate-300'
                  : 'bg-[#8E8E93]'
              }`}
            />
          </button>
        </div>
      </section>

      {/* SECTION 4: SYSTEM & PREFERENCES */}
      <section id="settings-system" className="scroll-mt-4 space-y-3 transition-all">
        <div
          className={`text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 ${
            isLight ? 'text-slate-900' : 'text-[var(--sona-accent,#CCFF00)]'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>System & Preferences</span>
        </div>

        {[
          {
            title: 'Reduce Animations',
            description: 'Minimize motion effects for improved performance and battery life.',
            value: preferences.reduceAnimations,
            toggle: () => onUpdatePreferences({ reduceAnimations: !preferences.reduceAnimations }),
          },
          {
            title: 'Dynamic Backgrounds',
            description: 'Atmospheric ambient visuals that respond to audio rhythm.',
            value: preferences.dynamicBackgrounds,
            toggle: () => onUpdatePreferences({ dynamicBackgrounds: !preferences.dynamicBackgrounds }),
          },
          {
            title: 'Data Saver Mode',
            description: 'Strictly enforce 360p stream quality to reduce mobile carrier data usage.',
            value: preferences.dataSaver,
            toggle: () => onUpdatePreferences({ dataSaver: !preferences.dataSaver }),
          },
          {
            title: 'Push Notifications',
            description: 'Receive alerts on new releases, playlist updates, and player actions.',
            value: preferences.notificationsEnabled,
            toggle: () => onUpdatePreferences({ notificationsEnabled: !preferences.notificationsEnabled }),
          },
        ].map((item) => (
          <div
            key={item.title}
            className={`flex items-center justify-between p-3.5 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141418] border-[#242428]'
            }`}
          >
            <div className="pr-4">
              <div className={`text-xs font-bold uppercase ${headingClass}`}>{item.title}</div>
              <div className={subtextClass}>{item.description}</div>
            </div>
            <button
              type="button"
              onClick={item.toggle}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer shrink-0 ${
                item.value
                  ? isLight
                    ? 'bg-slate-900'
                    : 'bg-[var(--sona-accent,#CCFF00)]'
                  : isLight
                  ? 'bg-slate-200'
                  : 'bg-[#2E2E36]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  item.value ? 'translate-x-6' : 'translate-x-0'
                } ${
                  item.value
                    ? isLight
                      ? 'bg-white shadow'
                      : 'bg-black shadow'
                    : isLight
                    ? 'bg-white shadow-sm border border-slate-300'
                    : 'bg-[#8E8E93]'
                }`}
              />
            </button>
          </div>
        ))}
      </section>

      {/* SECTION 5: STORAGE & PRIVACY */}
      <section id="settings-storage" className={sectionClass}>
        <div
          className={`text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 ${
            isLight ? 'text-slate-900' : 'text-[var(--sona-accent,#CCFF00)]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Storage & Privacy</span>
        </div>

        {/* Clear Cache */}
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-xs font-bold uppercase ${headingClass}`}>Audio, Artwork & Catalog Cache</div>
            <div className={subtextClass}>
              {cacheSize > 0 ? `${cacheSize.toFixed(1)} MB cached on device` : 'Cache cleared successfully'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearCache}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{cacheCleared ? 'Cleared!' : 'Clear Cache'}</span>
          </button>
        </div>

        {/* Private Session Switch */}
        <div
          className={`flex items-center justify-between pt-2 border-t ${
            isLight ? 'border-slate-100' : 'border-[#242428]'
          }`}
        >
          <div>
            <div className={`text-xs font-bold uppercase ${headingClass}`}>Private Listening Session</div>
            <div className={subtextClass}>Do not log playback history or stream stats for this session.</div>
          </div>
          <button
            type="button"
            onClick={() => setIsIncognito(!isIncognito)}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer shrink-0 ${
              isIncognito
                ? isLight
                  ? 'bg-slate-900'
                  : 'bg-[var(--sona-accent,#CCFF00)]'
                : isLight
                ? 'bg-slate-200'
                : 'bg-[#2E2E36]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full transition-transform ${
                isIncognito ? 'translate-x-6' : 'translate-x-0'
              } ${
                isIncognito
                  ? isLight
                    ? 'bg-white shadow'
                    : 'bg-black shadow'
                  : isLight
                  ? 'bg-white shadow-sm border border-slate-300'
                  : 'bg-[#8E8E93]'
              }`}
            />
          </button>
        </div>
      </section>

      {/* SECTION 6: ABOUT */}
      <section id="settings-about" className={`${sectionClass} text-xs`}>
        <div
          className={`text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 ${
            isLight ? 'text-slate-900' : 'text-[var(--sona-accent,#CCFF00)]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>About Sona Player</span>
        </div>
        <div className={`font-black uppercase tracking-wider ${headingClass}`}>Sona Music Platform</div>
        <div className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-[var(--sona-accent,#CCFF00)]'}`}>
          Version 1.2.0 • Unified Streaming Edition
        </div>
        <div className={`${subtextClass} font-mono leading-relaxed`}>
          Package: com.daddyizz.sona<br />
          Audio Engine: YouTube + Spotify Fast Stream (360p/480p low-latency live buffer)<br />
          Target: Android / Modern Web Client
        </div>
      </section>
    </div>
  );
};

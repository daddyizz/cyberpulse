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
} from 'lucide-react';
import type { AppPreferences, CyberTheme } from '../types';

interface SettingsViewProps {
  preferences: AppPreferences;
  onUpdatePreferences: (prefs: Partial<AppPreferences>) => void;
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
    id: 'frosted',
    name: 'Frosted Glass',
    description: 'Kaca kabur premium dengan glow cyan dan violet yang halus.',
    dotClass: 'bg-[#00F5FF]',
    activeClass: 'border-[#00F5FF] shadow-[#00F5FF]/15',
  },
  {
    id: 'sporty',
    name: 'Sporty Neon',
    description: 'Aksen lime bertenaga dengan rasa racing dan performance.',
    dotClass: 'bg-[#B8FF2C]',
    activeClass: 'border-[#B8FF2C] shadow-[#B8FF2C]/15',
  },
  {
    id: 'oled',
    name: 'OLED Black',
    description: 'Pure black untuk AMOLED, fokus pada kontras dan bateri.',
    dotClass: 'bg-white',
    activeClass: 'border-white/70 shadow-white/10',
  },
  {
    id: 'minimal',
    name: 'Premium Light',
    description: 'Clean white minimalist UI, ruang lapang, tipografi gelap dan aksen biru premium.',
    dotClass: 'bg-blue-600',
    activeClass: 'border-blue-500 shadow-blue-500/15',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  onBack,
}) => {
  const [eqPreset, setEqPreset] = useState('Bass Boost');
  const [crossfade, setCrossfade] = useState(3);
  const [volumeNormalize, setVolumeNormalize] = useState(true);
  const [cacheSize, setCacheSize] = useState(42.8);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [username, setUsername] = useState('Cyber Listener');

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

  const sectionClass =
    'scroll-mt-4 p-4 rounded-2xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-xl space-y-4 transition-all';

  return (
    <div className="p-4 space-y-6 pb-32 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#10131C] border border-[#171B28] flex items-center justify-center text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF]/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC]">Settings</h1>
          <p className="text-[11px] text-[#9CA3B7]">Akaun, tema, audio, privasi dan sistem CyberPulse.</p>
        </div>
      </div>

      <section id="settings-account" className={sectionClass}>
        <div className="text-xs font-bold text-[#00F5FF] tracking-widest uppercase flex items-center gap-1.5">
          <User className="w-4 h-4" />
          <span>Account & Subscription</span>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase text-[#F7F8FC]">Display Name</label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-xl border border-[#171B28] bg-[#07090F]/70 px-3 py-2.5 text-sm text-[#F7F8FC] outline-none focus:border-[#00F5FF]/60"
          />
        </div>
        <div className="flex items-center justify-between border-t border-[#171B28] pt-3">
          <div>
            <div className="text-xs font-bold uppercase text-[#F7F8FC]">Current Plan</div>
            <div className="text-[10px] text-[#9CA3B7]">Free Plan • upgrade flow will be connected to Play Billing.</div>
          </div>
          <span className="rounded-full border border-[#00F5FF]/30 bg-[#00F5FF]/10 px-2.5 py-1 text-[10px] font-bold text-[#00F5FF]">FREE</span>
        </div>
      </section>

      <section id="settings-appearance" className="scroll-mt-4 space-y-3 transition-all">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[#00F5FF] tracking-widest uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Appearance & Themes</span>
          </div>
          <span className="text-[10px] text-[#9CA3B7] font-mono uppercase">Current: {preferences.theme}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {themeOptions.map((theme) => {
            const active = preferences.theme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => onUpdatePreferences({ theme: theme.id })}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer shadow-lg ${
                  active
                    ? `${theme.activeClass} bg-[#10131C]/95`
                    : 'border-[#171B28] bg-[#10131C]/45 hover:border-[#9CA3B7]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black uppercase text-[#F7F8FC] flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${theme.dotClass}`} />
                    {theme.name}
                  </span>
                  {active && <Check className="w-4 h-4 text-[#00F5FF]" />}
                </div>
                <div className="text-[10px] text-[#9CA3B7] leading-relaxed">{theme.description}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section id="settings-audio" className={sectionClass}>
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[#00F5FF] tracking-widest uppercase flex items-center gap-1.5">
            <Volume2 className="w-4 h-4" />
            <span>Audio DSP & Playback Engine</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F5FF]/15 text-[#00F5FF] font-mono font-bold">HD</span>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#F7F8FC] uppercase">Equalizer Preset</label>
          <div className="flex flex-wrap gap-1.5">
            {['Flat', 'Bass Boost', 'Synthwave Glow', 'Vocal Clarity', 'Club Dance'].map((preset) => (
              <button
                key={preset}
                onClick={() => setEqPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  eqPreset === preset ? 'bg-[#00F5FF] text-[#07090F]' : 'bg-[#171B28] text-[#9CA3B7] hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="font-bold text-[#F7F8FC] uppercase">Audio Crossfade</span>
            <span className="font-mono text-[#00F5FF] font-bold">{crossfade}s</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={crossfade}
            onChange={(event) => setCrossfade(Number(event.target.value))}
            className="w-full h-1.5 bg-[#171B28] rounded-lg appearance-none cursor-pointer accent-[#00F5FF]"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#171B28]">
          <div>
            <div className="text-xs font-bold uppercase text-[#F7F8FC]">Volume Normalization</div>
            <div className="text-[10px] text-[#9CA3B7]">Pastikan tahap bunyi antara lagu lebih konsisten.</div>
          </div>
          <button
            onClick={() => setVolumeNormalize(!volumeNormalize)}
            className={`w-11 h-6 rounded-full p-1 transition-colors ${volumeNormalize ? 'bg-[#00F5FF]' : 'bg-[#171B28]'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-black transition-transform ${volumeNormalize ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </section>

      <section id="settings-system" className="scroll-mt-4 space-y-3 transition-all">
        <div className="text-xs font-bold text-[#00F5FF] tracking-widest uppercase flex items-center gap-1.5">
          <Bell className="w-4 h-4" />
          <span>Notifications & System</span>
        </div>
        {[
          {
            title: 'Reduce Animations',
            description: 'Kurangkan motion untuk prestasi dan accessibility.',
            value: preferences.reduceAnimations,
            toggle: () => onUpdatePreferences({ reduceAnimations: !preferences.reduceAnimations }),
          },
          {
            title: 'Dynamic Backgrounds',
            description: 'Atmospheric background yang respons kepada playback.',
            value: preferences.dynamicBackgrounds,
            toggle: () => onUpdatePreferences({ dynamicBackgrounds: !preferences.dynamicBackgrounds }),
          },
          {
            title: 'Data Saver Mode',
            description: 'Kurangkan penggunaan data pada rangkaian mudah alih.',
            value: preferences.dataSaver,
            toggle: () => onUpdatePreferences({ dataSaver: !preferences.dataSaver }),
          },
          {
            title: 'Notifications',
            description: 'Playback, discovery dan pemberitahuan penting.',
            value: preferences.notificationsEnabled,
            toggle: () => onUpdatePreferences({ notificationsEnabled: !preferences.notificationsEnabled }),
          },
        ].map((item) => (
          <div key={item.title} className="flex items-center justify-between p-3 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md">
            <div className="pr-4">
              <div className="text-xs font-bold uppercase text-[#F7F8FC]">{item.title}</div>
              <div className="text-[10px] text-[#9CA3B7]">{item.description}</div>
            </div>
            <button onClick={item.toggle} className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0 ${item.value ? 'bg-[#00F5FF]' : 'bg-[#171B28]'}`}>
              <div className={`w-4 h-4 rounded-full bg-black transition-transform ${item.value ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        ))}
      </section>

      <section id="settings-storage" className={sectionClass}>
        <div className="text-xs font-bold text-[#00F5FF] tracking-widest uppercase flex items-center gap-1.5">
          <Database className="w-4 h-4" />
          <span>Storage & Privacy</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-[#F7F8FC]">Audio, Artwork & Discovery Cache</div>
            <div className="text-[10px] text-[#9CA3B7]">{cacheSize > 0 ? `${cacheSize.toFixed(1)} MB cached` : 'Cache cleared'}</div>
          </div>
          <button
            onClick={handleClearCache}
            className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 hover:text-white hover:bg-red-600 transition-all text-xs font-bold flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {cacheCleared ? 'Cleared!' : 'Clear Cache'}
          </button>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#171B28]">
          <div>
            <div className="text-xs font-bold uppercase text-[#F7F8FC]">Private Session</div>
            <div className="text-[10px] text-[#9CA3B7]">Jangan simpan listening history untuk sesi ini.</div>
          </div>
          <button onClick={() => setIsIncognito(!isIncognito)} className={`w-11 h-6 rounded-full p-1 transition-colors ${isIncognito ? 'bg-[#00F5FF]' : 'bg-[#171B28]'}`}>
            <div className={`w-4 h-4 rounded-full bg-black transition-transform ${isIncognito ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </section>

      <section id="settings-about" className={`${sectionClass} text-xs`}>
        <div className="text-xs font-bold text-[#00F5FF] tracking-widest uppercase flex items-center gap-1.5">
          <Shield className="w-4 h-4" />
          <span>About CyberPulse</span>
        </div>
        <div className="font-black uppercase tracking-wider text-[#F7F8FC]">CyberPulse Music</div>
        <div className="text-[11px] text-[#00F5FF] font-bold">Version 1.0.0 (Build 10)</div>
        <div className="text-[11px] text-[#9CA3B7] font-mono leading-relaxed">
          Package: com.daddyizz.cyberpulse<br />
          Discovery: Spotify + YouTube live catalog with cached fallback<br />
          Runtime target: Android / Web preview
        </div>
      </section>
    </div>
  );
};
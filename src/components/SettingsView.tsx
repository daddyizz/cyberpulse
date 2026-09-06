import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Radio,
  Sliders,
  Bell,
  Shield,
  Trash2,
  Sparkles,
  Zap,
  Volume2,
  Tv,
  Info,
  CheckCircle2,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { AppPreferences, CyberTheme } from '../types';

interface SettingsViewProps {
  preferences: AppPreferences;
  onUpdatePreferences: (prefs: Partial<AppPreferences>) => void;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  onBack,
}) => {
  const [eqPreset, setEqPreset] = useState<string>('Bass Boost');
  const [bitrate, setBitrate] = useState<string>('320 kbps (Lossless)');
  const [crossfade, setCrossfade] = useState<number>(3);
  const [volumeNormalize, setVolumeNormalize] = useState<boolean>(true);
  const [cacheSize, setCacheSize] = useState<number>(42.8);
  const [cacheCleared, setCacheCleared] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('Cyber Listener');
  const [isIncognito, setIsIncognito] = useState<boolean>(false);
  const [allowExplicit, setAllowExplicit] = useState<boolean>(true);
  const [showAdMobInfo, setShowAdMobInfo] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const ADMOB_APP_ID = 'ca-app-pub-4110950503958596~8125437952';

  const handleClearCache = () => {
    setCacheSize(0);
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div className="p-4 space-y-6 pb-32 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#10131C] border border-[#171B28] flex items-center justify-center text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF]/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC]">Settings</h1>
          <p className="text-[11px] text-[#9CA3B7]">Kustomisasi audio, tema, akaun & sistem</p>
        </div>
      </div>

      {/* THEME SELECTION: Frosted vs Sporty Neon vs OLED */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[#00F5FF] tracking-widest uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00F5FF]" />
            <span>Appearance & Themes</span>
          </div>
          <span className="text-[10px] text-[#9CA3B7] font-mono uppercase">
            Current: {preferences.theme}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* 1. Frosted Glass */}
          <button
            onClick={() => onUpdatePreferences({ theme: 'frosted' })}
            className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
              preferences.theme === 'frosted'
                ? 'border-[#00F5FF] bg-[#10131C]/90 backdrop-blur-xl shadow-lg shadow-[#00F5FF]/15'
                : 'border-[#171B28] bg-[#10131C]/40 text-[#9CA3B7] hover:border-[#171B28]/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black uppercase text-[#F7F8FC] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00F5FF]" />
                Frosted Glass
              </span>
              {preferences.theme === 'frosted' && <Check className="w-4 h-4 text-[#00F5FF]" />}
            </div>
            <div className="text-[10px] text-[#9CA3B7]">
              Kaca kabur mewah dengan glow cyan & violet halus
            </div>
          </button>

          {/* 2. Sporty Neon (Redesigned from redundant cyberpunk) */}
          <button
            onClick={() => onUpdatePreferences({ theme: 'sporty' })}
            className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
              preferences.theme === 'sporty'
                ? 'border-[#B8FF2C] bg-[#0E151B] shadow-lg shadow-[#B8FF2C]/20'
                : 'border-[#171B28] bg-[#10131C]/40 text-[#9CA3B7] hover:border-[#171B28]/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black uppercase text-[#B8FF2C] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B8FF2C] shadow-[0_0_8px_#B8FF2C]" />
                Sporty Neon
              </span>
              {preferences.theme === 'sporty' && <Check className="w-4 h-4 text-[#B8FF2C]" />}
            </div>
            <div className="text-[10px] text-[#9CA3B7]">
              Tema sukan bertenaga tinggi dengan aksen lime neon & racing
            </div>
          </button>

          {/* 3. OLED Black */}
          <button
            onClick={() => onUpdatePreferences({ theme: 'oled' })}
            className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
              preferences.theme === 'oled'
                ? 'border-white/60 bg-black shadow-lg shadow-white/10'
                : 'border-[#171B28] bg-[#10131C]/40 text-[#9CA3B7] hover:border-[#171B28]/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                OLED Black
              </span>
              {preferences.theme === 'oled' && <Check className="w-4 h-4 text-white" />}
            </div>
            <div className="text-[10px] text-[#9CA3B7]">
              Pure pitch black #000000 saves AMOLED battery
            </div>
          </button>
        </div>
      </div>

      {/* AUDIO ENGINE & DSP EQUALIZER */}
      <div className="p-4 rounded-2xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[#00F5FF] tracking-widest uppercase flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-[#00F5FF]" />
            <span>Audio DSP & Playback Engine</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F5FF]/15 text-[#00F5FF] font-mono font-bold">
            320 KBPS HD
          </span>
        </div>

        {/* Equalizer Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#F7F8FC] uppercase">Equalizer Preset</label>
          <div className="flex flex-wrap gap-1.5">
            {['Flat', 'Bass Boost', 'Synthwave Glow', 'Vocal Clarity', 'Club Dance'].map((preset) => (
              <button
                key={preset}
                onClick={() => setEqPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  eqPreset === preset
                    ? 'bg-[#00F5FF] text-[#07090F] shadow-md shadow-[#00F5FF]/30'
                    : 'bg-[#171B28] text-[#9CA3B7] hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Crossfade Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-bold text-[#F7F8FC] uppercase">Audio Crossfade</span>
            <span className="font-mono text-[#00F5FF] font-bold">{crossfade}s</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={crossfade}
            onChange={(e) => setCrossfade(Number(e.target.value))}
            className="w-full h-1.5 bg-[#171B28] rounded-lg appearance-none cursor-pointer accent-[#00F5FF]"
          />
          <div className="flex justify-between text-[9px] text-[#61697C] font-mono">
            <span>Off (0s)</span>
            <span>Smooth 5s</span>
            <span>Club (10s)</span>
          </div>
        </div>

        {/* Normalization Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-[#171B28]">
          <div>
            <div className="text-xs font-bold uppercase text-[#F7F8FC]">Volume Normalization</div>
            <div className="text-[10px] text-[#9CA3B7]">Kawal kelantangan audio agar konsisten</div>
          </div>
          <button
            onClick={() => setVolumeNormalize(!volumeNormalize)}
            className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
              volumeNormalize ? 'bg-[#00F5FF]' : 'bg-[#171B28]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                volumeNormalize ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ADMOB INTEGRATION PANEL (User Requested) */}
      <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[#10131C] to-[#10131C] backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-amber-400" />
            <span>Google AdMob Integration</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
            CONFIGURED
          </span>
        </div>

        <p className="text-xs text-[#9CA3B7] leading-relaxed">
          Google Mobile Ads SDK dikonfigurasi secara rasmi untuk paparan iklan banner & ganjaran:
        </p>

        <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/20 font-mono text-[11px] text-amber-300 break-all select-all">
          <div className="text-[9px] text-[#9CA3B7] uppercase font-sans font-bold mb-0.5">AdMob App ID:</div>
          {ADMOB_APP_ID}
        </div>

        {/* AdMob Banner Preview */}
        <div className="mt-2 p-3 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 flex flex-col items-center justify-center text-center gap-1">
          <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            AdMob Adaptive Banner (320x50 / Smart Banner)
          </div>
          <div className="text-[11px] text-white/80 font-medium">
            CyberPulse Premium Audio • Bebas Iklan & Audio Lossless
          </div>
        </div>
      </div>

      {/* GENERAL PREFERENCES TOGGLES */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-[#00F5FF] tracking-widest uppercase">System Toggles</div>

        <div className="flex items-center justify-between p-3 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md">
          <div>
            <div className="text-xs font-bold uppercase text-[#F7F8FC]">Reduce Animations</div>
            <div className="text-[11px] text-[#9CA3B7]">Kurangkan kesan gerak animasi</div>
          </div>
          <button
            onClick={() => onUpdatePreferences({ reduceAnimations: !preferences.reduceAnimations })}
            className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
              preferences.reduceAnimations ? 'bg-[#00F5FF]' : 'bg-[#171B28]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                preferences.reduceAnimations ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md">
          <div>
            <div className="text-xs font-bold uppercase text-[#F7F8FC]">Dynamic Backgrounds</div>
            <div className="text-[11px] text-[#9CA3B7]">Luminous atmospheric gradient reactive to playback</div>
          </div>
          <button
            onClick={() => onUpdatePreferences({ dynamicBackgrounds: !preferences.dynamicBackgrounds })}
            className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
              preferences.dynamicBackgrounds ? 'bg-[#00F5FF]' : 'bg-[#171B28]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                preferences.dynamicBackgrounds ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md">
          <div>
            <div className="text-xs font-bold uppercase text-[#F7F8FC]">Data Saver Mode</div>
            <div className="text-[11px] text-[#9CA3B7]">Save mobile data and bandwidth usage</div>
          </div>
          <button
            onClick={() => onUpdatePreferences({ dataSaver: !preferences.dataSaver })}
            className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
              preferences.dataSaver ? 'bg-[#00F5FF]' : 'bg-[#171B28]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                preferences.dataSaver ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md">
          <div>
            <div className="text-xs font-bold uppercase text-[#F7F8FC]">New Music Notifications</div>
            <div className="text-[11px] text-[#9CA3B7]">Alerts for new releases from followed artists</div>
          </div>
          <button
            onClick={() => onUpdatePreferences({ notificationsEnabled: !preferences.notificationsEnabled })}
            className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
              preferences.notificationsEnabled ? 'bg-[#00F5FF]' : 'bg-[#171B28]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                preferences.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* STORAGE & PRIVACY CONTROLS */}
      <div className="p-4 rounded-2xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-xl space-y-3">
        <div className="text-xs font-bold text-[#00F5FF] tracking-widest uppercase flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-[#00F5FF]" />
          <span>Storage & Privacy</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-[#F7F8FC]">Audio & Image Cache</div>
            <div className="text-[10px] text-[#9CA3B7]">
              {cacheSize > 0 ? `${cacheSize.toFixed(1)} MB saved for offline mode` : 'Cache storage cleared'}
            </div>
          </div>
          <button
            onClick={handleClearCache}
            className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 hover:text-white hover:bg-red-600 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{cacheCleared ? 'Cleared!' : 'Clear Cache'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#171B28]">
          <div>
            <div className="text-xs font-bold uppercase text-[#F7F8FC]">Private Session (Incognito)</div>
            <div className="text-[10px] text-[#9CA3B7]">Do not record listening history for this session</div>
          </div>
          <button
            onClick={() => setIsIncognito(!isIncognito)}
            className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
              isIncognito ? 'bg-[#00F5FF]' : 'bg-[#171B28]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                isIncognito ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* SYSTEM ABOUT INFO */}
      <div className="p-4 rounded-2xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-xl space-y-2 text-xs">
        <div className="font-black uppercase tracking-wider text-[#F7F8FC]">CyberPulse Music Native</div>
        <div className="text-[11px] text-[#00F5FF] font-bold">Versi 1.0.0 (Build 10) • Media3 Engine</div>
        <div className="text-[11px] text-[#9CA3B7] font-mono leading-relaxed">
          Package: com.daddyizz.cyberpulse<br />
          Runtime: Android 14+ / API 36 Native Jetpack Compose<br />
          AdMob: {ADMOB_APP_ID}
        </div>
      </div>
    </div>
  );
};

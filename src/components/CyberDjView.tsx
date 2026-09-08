import React, { useState } from 'react';
import {
  ArrowLeft,
  Radio,
  Sliders,
  Sparkles,
  Zap,
  Volume2,
  Bookmark,
  X,
  Play,
  Pause,
  ThumbsUp,
  ThumbsDown,
  Car,
  Activity,
  Headphones,
  Moon,
  Disc,
  Compass,
  Check
} from 'lucide-react';
import { Track, SonaTheme } from '../types';

interface CyberDjViewProps {
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  theme?: SonaTheme;
}

type DjMode = 'DRIVE' | 'CHILL' | 'WORKOUT' | 'FOCUS' | 'PARTY' | 'SLEEP' | 'DISCOVER' | 'THROWBACK';

interface ModeInfo {
  id: DjMode;
  name: string;
  desc: string;
  energy: number;
  icon: React.ComponentType<{ className?: string }>;
  isPro?: boolean;
}

const MODES: ModeInfo[] = [
  { id: 'DRIVE', name: 'Drive', desc: 'Highway cruise • Steady energy', energy: 65, icon: Car },
  { id: 'CHILL', name: 'Chill', desc: 'Mellow ambient frequencies', energy: 35, icon: Radio },
  { id: 'WORKOUT', name: 'Workout', desc: 'High-BPM energy surge', energy: 90, icon: Activity },
  { id: 'FOCUS', name: 'Focus', desc: 'Deep cognitive momentum', energy: 50, icon: Headphones },
  { id: 'PARTY', name: 'Party', desc: 'Dancefloor peak energy', energy: 95, icon: Sparkles, isPro: true },
  { id: 'SLEEP', name: 'Sleep', desc: 'Sub-bass drone & drift', energy: 15, icon: Moon, isPro: true },
  { id: 'DISCOVER', name: 'Discover', desc: 'High-novelty radar', energy: 60, icon: Compass, isPro: true },
  { id: 'THROWBACK', name: 'Throwback', desc: 'Retro 80s synthwave', energy: 70, icon: Disc, isPro: true },
];

export const CyberDjView: React.FC<CyberDjViewProps> = ({
  onBack,
  onPlayTrack,
  currentTrack,
  isPlaying,
  theme = 'pure_light',
}) => {
  const isLight = theme === 'pure_light';
  const [activeMode, setActiveMode] = useState<DjMode | null>(null);
  const [energy, setEnergy] = useState<number>(65);
  const [discovery, setDiscovery] = useState<number>(0.5);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSelectMode = (mode: ModeInfo) => {
    setActiveMode(mode.id);
    setEnergy(mode.energy);
    setFeedbackNotice(`Cyber DJ session started: ${mode.name} mode active`);
  };

  const handleFeedback = (label: string, message: string) => {
    setFeedbackNotice(message);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  return (
    <div className={`flex flex-col h-full overflow-y-auto pb-24 ${
      isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#07090F] text-[#F7F8FC]'
    }`}>
      {/* Top Bar */}
      <div className={`flex items-center justify-between p-4 sticky top-0 backdrop-blur-md z-10 border-b ${
        isLight ? 'bg-white/95 border-slate-200' : 'bg-[#07090F]/90 border-[#1F2633]'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onBack()}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900' : 'hover:bg-[#1A202C] text-[#9EACBA] hover:text-[#F7F8FC]'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-base font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-[#F7F8FC]'
            }`}>
              Cyber DJ
              {activeMode && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-[#8B5CFF]/20 text-[#8B5CFF] border border-[#8B5CFF]'
                }`}>
                  Live
                </span>
              )}
            </h1>
            <p className={`text-[11px] ${
              isLight ? 'text-slate-500' : 'text-[#00F5FF]'
            }`}>Music that moves with you</p>
          </div>
        </div>

        {activeMode && (
          <button
            onClick={() => {
              setActiveMode(null);
              setFeedbackNotice(null);
            }}
            className="text-[11px] font-semibold text-rose-500 hover:underline"
          >
            End Session
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {activeMode ? (
          <>
            {/* Active HUD Card */}
            <div className={`p-5 rounded-2xl border relative overflow-hidden ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-[#0F131D] border-[#8B5CFF] shadow-[0_0_24px_rgba(139,92,255,0.15)]'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-emerald-500' : 'bg-[#00F5FF] animate-ping'}`} />
                  <span className={`text-xs font-bold tracking-wider uppercase ${
                    isLight ? 'text-slate-900' : 'text-[#00F5FF]'
                  }`}>
                    {activeMode} SESSION ACTIVE
                  </span>
                </div>
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isSaved
                      ? isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-[#8B5CFF]/20 text-[#8B5CFF] border-[#8B5CFF]'
                      : isLight ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' : 'bg-[#182030] text-[#9EACBA] border-[#222E42] hover:text-white'
                  }`}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  {isSaved ? 'Saved' : 'Save Mix'}
                </button>
              </div>

              <div className="my-3">
                <p className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currentTrack?.title || 'Synthesizing Endless Flow...'}
                </p>
                <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-[#9EACBA]'}`}>
                  {currentTrack?.artist || 'Verified sources: On-Device & Radio streams'}
                </p>
              </div>

              <div className={`flex items-center justify-between text-[11px] pt-2 border-t ${
                isLight ? 'text-slate-500 border-slate-100' : 'text-[#9EACBA] border-[#1F2633]'
              }`}>
                <span>Rolling buffer: 8 tracks</span>
                <span className={isLight ? 'text-indigo-600 font-semibold' : 'text-[#8B5CFF] font-medium'}>Endless Auto-Extension On</span>
              </div>
            </div>

            {/* Feedback Alert Notice */}
            {feedbackNotice && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                isLight ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-[#00F5FF]/10 border-[#00F5FF]/40 text-[#00F5FF]'
              }`}>
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>{feedbackNotice}</span>
              </div>
            )}

            {/* Sliders Card */}
            <div className={`p-4 rounded-xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0F131D] border-[#1F2633]'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-900' : 'text-[#F7F8FC]'
              }`}>
                Live Acoustic Sliders
              </h3>

              {/* Energy Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className={isLight ? 'text-slate-500' : 'text-[#9EACBA]'}>Energy Level</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-[#00F5FF]'}`}>{energy}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>

              {/* Discovery Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className={isLight ? 'text-slate-500' : 'text-[#9EACBA]'}>Discovery Radar</span>
                  <span className={`font-bold ${isLight ? 'text-indigo-600' : 'text-[#8B5CFF]'}`}>
                    {discovery < 0.4 ? 'Familiar' : discovery < 0.7 ? 'Balanced' : 'Novel'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={discovery}
                  onChange={(e) => setDiscovery(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Tuning Buttons */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0F131D] border-[#1F2633]'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-900' : 'text-[#F7F8FC]'
              }`}>
                Instant Tuning
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleFeedback('like', 'Tuned: Increased affinity for current artist.')}
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'bg-[#182030] hover:bg-[#222E42] text-[#00F5FF]'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> More Like This
                </button>
                <button
                  onClick={() => handleFeedback('dislike', 'Skipped & downvoted track style.')}
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-rose-600'
                      : 'bg-[#182030] hover:bg-[#222E42] text-[#FF453A]'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" /> Less Like This
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setEnergy((e) => Math.min(100, e + 15));
                    handleFeedback('energy_up', 'Energy bumped +15%');
                  }}
                  className={`p-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-[#182030] text-[#FFB300]'
                  }`}
                >
                  <Zap className="w-3 h-3" /> More Energy
                </button>
                <button
                  onClick={() => {
                    setEnergy((e) => Math.max(10, e - 15));
                    handleFeedback('chill', 'Energy mellowed down -15%');
                  }}
                  className={`p-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'
                      : 'bg-[#182030] text-[#00F5FF]'
                  }`}
                >
                  Chill Down
                </button>
                <button
                  onClick={() => {
                    setDiscovery(0.9);
                    handleFeedback('surprise', 'Radar jump to unexpected track genre');
                  }}
                  className={`p-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-[#182030] text-[#8B5CFF]'
                  }`}
                >
                  <Sparkles className="w-3 h-3" /> Surprise Me
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Intro Hero */}
            <div className={`p-5 rounded-2xl border space-y-2.5 ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-gradient-to-br from-[#120D26] to-[#0B1526] border-[#00F5FF]/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#00F5FF]/10 text-[#00F5FF]'
                }`}>
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Intelligent Endless Listening
                  </h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#9EACBA]'}`}>
                    Zero repeats • Dynamically reactive
                  </p>
                </div>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#9EACBA]'}`}>
                Choose an acoustic trajectory below. Cyber DJ generates a continuous, verified playable queue
                from local device files, live radio stations, and verified pulse catalogs.
              </p>
            </div>

            {/* Modes List */}
            <div className="space-y-2">
              <h3 className={`text-xs font-bold uppercase tracking-wider px-1 ${
                isLight ? 'text-slate-500' : 'text-[#9EACBA]'
              }`}>
                Select Session Mode
              </h3>
              {MODES.map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleSelectMode(mode)}
                    className={`w-full p-3.5 rounded-xl border transition-all text-left flex items-center justify-between group cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm'
                        : 'bg-[#0F131D] hover:bg-[#182030] border-[#1F2633] hover:border-[#00F5FF]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isLight
                          ? 'bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white'
                          : 'bg-[#182030] group-hover:bg-[#00F5FF]/10 text-[#00F5FF]'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold transition-colors ${
                            isLight
                              ? 'text-slate-900 group-hover:text-slate-950'
                              : 'text-white group-hover:text-[#00F5FF]'
                          }`}>
                            {mode.name}
                          </span>
                          {mode.isPro && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                              isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#FFB300]/20 text-[#FFB300] border border-[#FFB300]/50'
                            }`}>
                              PRO
                            </span>
                          )}
                        </div>
                        <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#9EACBA]'}`}>
                          {mode.desc}
                        </span>
                      </div>
                    </div>
                    <Play className={`w-4 h-4 transition-colors ${
                      isLight ? 'text-slate-400 group-hover:text-slate-900' : 'text-[#9EACBA] group-hover:text-[#00F5FF]'
                    }`} />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

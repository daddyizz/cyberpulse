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
import { Track } from '../types';

interface CyberDjViewProps {
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
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
}) => {
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
    <div className="flex flex-col h-full bg-[#07090F] text-[#F7F8FC] overflow-y-auto pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-[#07090F]/90 backdrop-blur-md z-10 border-b border-[#1F2633]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onBack()}
            className="p-2 rounded-full hover:bg-[#1A202C] text-[#9EACBA] hover:text-[#F7F8FC] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#F7F8FC] flex items-center gap-2">
              Cyber DJ
              {activeMode && (
                <span className="text-[10px] bg-[#8B5CFF]/20 text-[#8B5CFF] border border-[#8B5CFF] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Live
                </span>
              )}
            </h1>
            <p className="text-[11px] text-[#00F5FF]">Music that moves with you</p>
          </div>
        </div>

        {activeMode && (
          <button
            onClick={() => {
              setActiveMode(null);
              setFeedbackNotice(null);
            }}
            className="text-[11px] font-semibold text-[#FF453A] hover:underline"
          >
            End Session
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {activeMode ? (
          <>
            {/* Active HUD Card */}
            <div className="p-5 rounded-2xl bg-[#0F131D] border border-[#8B5CFF] shadow-[0_0_24px_rgba(139,92,255,0.15)] relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00F5FF] animate-ping" />
                  <span className="text-xs font-bold text-[#00F5FF] tracking-wider uppercase">
                    {activeMode} SESSION ACTIVE
                  </span>
                </div>
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                    isSaved
                      ? 'bg-[#8B5CFF]/20 text-[#8B5CFF] border-[#8B5CFF]'
                      : 'bg-[#182030] text-[#9EACBA] border-[#222E42] hover:text-white'
                  }`}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  {isSaved ? 'Saved' : 'Save Mix'}
                </button>
              </div>

              <div className="my-3">
                <p className="text-sm font-bold text-white truncate">
                  {currentTrack?.title || 'Synthesizing Endless Flow...'}
                </p>
                <p className="text-xs text-[#9EACBA] truncate">
                  {currentTrack?.artist || 'Verified sources: On-Device & Radio streams'}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#9EACBA] pt-2 border-t border-[#1F2633]">
                <span>Rolling buffer: 8 tracks</span>
                <span className="text-[#8B5CFF] font-medium">Endless Auto-Extension On</span>
              </div>
            </div>

            {/* Feedback Alert Notice */}
            {feedbackNotice && (
              <div className="p-3 rounded-xl bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>{feedbackNotice}</span>
              </div>
            )}

            {/* Sliders Card */}
            <div className="p-4 rounded-xl bg-[#0F131D] border border-[#1F2633] space-y-4">
              <h3 className="text-xs font-bold text-[#F7F8FC] uppercase tracking-wider">
                Live Acoustic Sliders
              </h3>

              {/* Energy Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#9EACBA]">Energy Level</span>
                  <span className="text-[#00F5FF] font-bold">{energy}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-[#00F5FF] cursor-pointer"
                />
              </div>

              {/* Discovery Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#9EACBA]">Discovery Radar</span>
                  <span className="text-[#8B5CFF] font-bold">
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
                  className="w-full accent-[#8B5CFF] cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Tuning Buttons */}
            <div className="p-4 rounded-xl bg-[#0F131D] border border-[#1F2633] space-y-3">
              <h3 className="text-xs font-bold text-[#F7F8FC] uppercase tracking-wider">
                Instant Tuning
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleFeedback('like', 'Tuned: Increased affinity for current artist.')}
                  className="p-2.5 rounded-lg bg-[#182030] hover:bg-[#222E42] text-xs font-semibold text-[#00F5FF] flex items-center justify-center gap-2"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> More Like This
                </button>
                <button
                  onClick={() => handleFeedback('dislike', 'Skipped & downvoted track style.')}
                  className="p-2.5 rounded-lg bg-[#182030] hover:bg-[#222E42] text-xs font-semibold text-[#FF453A] flex items-center justify-center gap-2"
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
                  className="p-2 rounded-lg bg-[#182030] text-[11px] font-medium text-[#FFB300] flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3" /> More Energy
                </button>
                <button
                  onClick={() => {
                    setEnergy((e) => Math.max(10, e - 15));
                    handleFeedback('chill', 'Energy mellowed down -15%');
                  }}
                  className="p-2 rounded-lg bg-[#182030] text-[11px] font-medium text-[#00F5FF] flex items-center justify-center gap-1"
                >
                  Chill Down
                </button>
                <button
                  onClick={() => {
                    setDiscovery(0.9);
                    handleFeedback('surprise', 'Radar jump to unexpected track genre');
                  }}
                  className="p-2 rounded-lg bg-[#182030] text-[11px] font-medium text-[#8B5CFF] flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Surprise Me
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Intro Hero */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#120D26] to-[#0B1526] border border-[#00F5FF]/30 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00F5FF]/10 flex items-center justify-center text-[#00F5FF]">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Intelligent Endless Listening</h2>
                  <p className="text-xs text-[#9EACBA]">Zero repeats • Dynamically reactive</p>
                </div>
              </div>
              <p className="text-xs text-[#9EACBA] leading-relaxed">
                Choose an acoustic trajectory below. Cyber DJ generates a continuous, verified playable queue
                from local device files, live radio stations, and verified pulse catalogs.
              </p>
            </div>

            {/* Modes List */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#9EACBA] uppercase tracking-wider px-1">
                Select Session Mode
              </h3>
              {MODES.map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleSelectMode(mode)}
                    className="w-full p-3.5 rounded-xl bg-[#0F131D] hover:bg-[#182030] border border-[#1F2633] hover:border-[#00F5FF]/50 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-[#182030] group-hover:bg-[#00F5FF]/10 text-[#00F5FF] flex items-center justify-center transition-colors">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-[#00F5FF] transition-colors">
                            {mode.name}
                          </span>
                          {mode.isPro && (
                            <span className="text-[9px] font-bold bg-[#FFB300]/20 text-[#FFB300] border border-[#FFB300]/50 px-1.5 py-0.2 rounded font-mono">
                              PRO
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#9EACBA]">{mode.desc}</span>
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-[#9EACBA] group-hover:text-[#00F5FF] transition-colors" />
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

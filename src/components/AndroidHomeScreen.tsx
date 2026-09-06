import React from 'react';
import { Track } from '../types';
import { CyberArtwork } from './CyberArtwork';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Headphones,
  Compass,
  Camera,
  MessageSquare,
  Phone,
  Search,
  Sparkles,
  Radio,
  Sliders,
  Volume2
} from 'lucide-react';

interface AndroidHomeScreenProps {
  currentTrack: Track;
  isPlaying: boolean;
  seekSeconds: number;
  onTogglePlayPause: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onResumeApp: () => void;
}

export const AndroidHomeScreen: React.FC<AndroidHomeScreenProps> = ({
  currentTrack,
  isPlaying,
  seekSeconds,
  onTogglePlayPause,
  onNextTrack,
  onPrevTrack,
  onResumeApp,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const progressPercent = Math.min(
    100,
    (seekSeconds / (currentTrack.durationSeconds || 214)) * 100
  );

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 overflow-hidden select-none bg-gradient-to-b from-[#0B132B] via-[#1C2541] to-[#0A0E1A]">
      {/* Dynamic Android Ambient Glow based on CyberPulse */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#00F5FF]/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-60 h-60 bg-[#FF2ED1]/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Top Section: Date, Weather & At A Glance */}
      <div className="pt-2 px-2 z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-2xl font-semibold text-white tracking-tight">
              {new Date().toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
            <div className="text-xs text-white/70 flex items-center gap-1.5 mt-0.5">
              <span>29°C Cerah</span>
              <span>•</span>
              <span className="text-[#00F5FF] flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> CyberPulse Audio Aktif
              </span>
            </div>
          </div>

          <button
            onClick={onResumeApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold text-white transition-all backdrop-blur-md cursor-pointer"
          >
            <Maximize2 className="w-3 h-3 text-[#00F5FF]" />
            <span>Return to App</span>
          </button>
        </div>
      </div>

      {/* Middle Section: Android 14/15 Persistent Media Notification / PiP Widget */}
      <div className="my-auto z-10 w-full">
        <div className="w-full rounded-3xl bg-[#0A0D17]/85 backdrop-blur-2xl border border-white/10 p-4 shadow-2xl shadow-black/80 space-y-3 relative overflow-hidden group">
          {/* Subtle Cyber Glow in Widget */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F5FF]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Notification Header */}
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <div className="flex items-center gap-1.5 font-bold text-[#00F5FF]">
              <Headphones className="w-3.5 h-3.5 animate-pulse" />
              <span className="tracking-wider uppercase text-[10px]">CyberPulse Background Playback</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#00F5FF]/15 text-[#00F5FF] border border-[#00F5FF]/30 text-[9px] font-mono font-bold">
              MEDIA SESSION
            </span>
          </div>

          {/* Track Info & Artwork */}
          <div
            onClick={onResumeApp}
            className="flex items-center gap-3.5 cursor-pointer hover:opacity-90 transition-opacity"
            title="Click to return to CyberPulse"
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-white/15 shrink-0 relative">
              <CyberArtwork
                keyName={currentTrack.placeholderArtworkKey}
                artworkUrl={currentTrack.artworkUrl}
                title={currentTrack.title}
                artist={currentTrack.artist}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-4">
                    <span className="w-0.5 bg-[#00F5FF] rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                    <span className="w-0.5 bg-[#FF2ED1] rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
                    <span className="w-0.5 bg-[#00F5FF] rounded-full animate-bounce h-2" />
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
              <p className="text-xs text-white/70 truncate">{currentTrack.artist}</p>
              <div className="text-[10px] text-[#00F5FF] font-mono mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00F5FF] animate-ping" />
                <span>Playing in background (Background Audio)</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00F5FF] to-[#8B5CFF] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-white/50">
              <span>{formatTime(seekSeconds)}</span>
              <span>{formatTime(currentTrack.durationSeconds || 214)}</span>
            </div>
          </div>

          {/* Quick Playback Controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onResumeApp}
              className="text-[11px] text-white/70 hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              <span>Tap to open app</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onPrevTrack}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={onTogglePlayPause}
                className="w-10 h-10 rounded-full bg-[#00F5FF] text-[#07090F] flex items-center justify-center shadow-lg shadow-[#00F5FF]/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={onNextTrack}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Android App Launcher Grid & Search Bar */}
      <div className="space-y-4 pb-2 z-10">
        {/* App Icons Grid */}
        <div className="grid grid-cols-4 gap-3 px-2">
          {/* CyberPulse App Icon (Highlighted with Active Badge) */}
          <button
            onClick={onResumeApp}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00F5FF] via-[#8B5CFF] to-[#FF2ED1] p-[2px] shadow-lg shadow-[#00F5FF]/30 group-hover:scale-105 transition-transform relative">
              <div className="w-full h-full bg-[#07090F] rounded-[14px] flex items-center justify-center">
                <Headphones className="w-6 h-6 text-[#00F5FF]" />
              </div>
              {isPlaying && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00F5FF] border-2 border-[#0A0E1A] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#07090F] animate-ping" />
                </div>
              )}
            </div>
            <span className="text-[11px] font-semibold text-white truncate max-w-full">CyberPulse</span>
          </button>

          {/* Chrome Icon */}
          <div className="flex flex-col items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-2xl bg-[#1E293B] border border-white/10 flex items-center justify-center shadow-md">
              <Compass className="w-6 h-6 text-[#38BDF8]" />
            </div>
            <span className="text-[11px] font-semibold text-white/80">Chrome</span>
          </div>

          {/* Camera Icon */}
          <div className="flex flex-col items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-2xl bg-[#1E293B] border border-white/10 flex items-center justify-center shadow-md">
              <Camera className="w-6 h-6 text-[#A78BFA]" />
            </div>
            <span className="text-[11px] font-semibold text-white/80">Kamera</span>
          </div>

          {/* Phone Icon */}
          <div className="flex flex-col items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-2xl bg-[#1E293B] border border-white/10 flex items-center justify-center shadow-md">
              <Phone className="w-6 h-6 text-[#4ADE80]" />
            </div>
            <span className="text-[11px] font-semibold text-white/80">Telefon</span>
          </div>
        </div>

        {/* Google / Android Search Bar */}
        <div className="w-full px-2">
          <div className="w-full h-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 px-4 flex items-center justify-between text-white/70">
            <div className="flex items-center gap-2 text-xs">
              <Search className="w-4 h-4 text-[#00F5FF]" />
              <span>Cari aplikasi atau web...</span>
            </div>
            <Sparkles className="w-4 h-4 text-[#FF2ED1]" />
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { Lock, Sparkles, AlertCircle } from 'lucide-react';
import { VisualizerMode } from '../types';

interface VisualizerPreviewProps {
  mode: VisualizerMode;
  isPlaying: boolean;
  isYouTube: boolean;
  isProUser?: boolean;
  currentSeconds?: number;
  onSelectMode: (mode: VisualizerMode) => void;
  onUnlockPro: () => void;
}

const MODES: Array<{ id: VisualizerMode; label: string; isPro: boolean; desc: string }> = [
  { id: 'NEON_WAVE', label: 'Neon Wave', isPro: false, desc: 'Fluid sinusoidal oscilloscope wave' },
  { id: 'SPECTRUM_PULSE', label: 'Spectrum', isPro: false, desc: 'Multi-band audio frequency analyzer' },
  { id: 'CYBER_GRID', label: 'Cyber Grid', isPro: true, desc: 'Matrix reactive equalizer grid' },
  { id: 'ORBITAL_PULSE', label: 'Orbital', isPro: true, desc: 'Radial circular audio impulse' },
  { id: 'PARTICLE_FLOW', label: 'Particles', isPro: true, desc: 'Kinetic cyber particle streamer' },
];

export function VisualizerPreview({
  mode,
  isPlaying,
  isYouTube,
  isProUser = false,
  currentSeconds = 0,
  onSelectMode,
  onUnlockPro
}: VisualizerPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentModeConfig = MODES.find((m) => m.id === mode) || MODES[0];
  const isLocked = currentModeConfig.isPro && !isProUser;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = Math.floor((currentSeconds || 0) * 60);

    const render = () => {
      animId = requestAnimationFrame(render);
      if (isPlaying) frame++;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = '#07090F';
      ctx.fillRect(0, 0, width, height);

      // Beat calculation (tempo ~ 125 BPM)
      const beat = isPlaying ? Math.pow(Math.sin(frame * 0.1), 4) : 0;

      if (mode === 'NEON_WAVE') {
        const centerY = height / 2;
        ctx.lineWidth = 3 + beat * 2;
        ctx.strokeStyle = '#00F5FF';
        ctx.shadowColor = '#00F5FF';
        ctx.shadowBlur = 12 + beat * 15;
        ctx.beginPath();
        const points = 32;
        for (let i = 0; i < points; i++) {
          const x = (i / (points - 1)) * width;
          const amp = isPlaying
            ? Math.sin(frame * 0.08 + i * 0.4) * (25 + beat * 30) + Math.cos(frame * 0.15 + i) * 10
            : Math.sin(i * 0.3) * 4;
          const y = centerY + amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.lineWidth = 1.5 + beat;
        ctx.strokeStyle = '#FF2ED1';
        ctx.shadowColor = '#FF2ED1';
        ctx.beginPath();
        for (let i = 0; i < points; i++) {
          const x = (i / (points - 1)) * width;
          const amp = isPlaying ? Math.cos(frame * 0.06 + i * 0.35) * (18 + beat * 20) : 0;
          const y = centerY - amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (mode === 'SPECTRUM_PULSE') {
        const bars = 22;
        const barWidth = (width - bars * 3) / bars;
        for (let i = 0; i < bars; i++) {
          const x = i * (barWidth + 3) + 6;
          // Dynamic frequency distribution
          const freqMultiplier = 1 - Math.abs(i - 8) / 18;
          const baseH = isPlaying
            ? Math.abs(Math.sin(frame * 0.08 + i * 0.35) * (height * 0.55)) * freqMultiplier + (beat * 35 * freqMultiplier)
            : 6;
          const h = Math.max(6, baseH);
          const y = height - h - 14;

          const grad = ctx.createLinearGradient(0, y, 0, height);
          grad.addColorStop(0, '#00F5FF');
          grad.addColorStop(0.5, '#8B5CFF');
          grad.addColorStop(1, '#FF2ED1');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth, h);
        }
      } else if (mode === 'CYBER_GRID') {
        const cols = 10;
        const rows = 8;
        const cellW = width / cols;
        const cellH = height / rows;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const intensity = isPlaying ? ((Math.sin(frame * 0.05 + r + c) + 1) / 2) * (0.6 + beat * 0.4) : 0.08;
            ctx.strokeStyle = `rgba(0, 245, 255, ${0.12 + intensity * 0.7})`;
            ctx.strokeRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
          }
        }
      } else if (mode === 'ORBITAL_PULSE') {
        const cx = width / 2;
        const cy = height / 2;
        const r = 45 + (isPlaying ? Math.sin(frame * 0.08) * 8 + beat * 14 : 0);
        ctx.strokeStyle = '#00F5FF';
        ctx.lineWidth = 2.5 + beat * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        const count = 16;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 + frame * 0.03;
          const spokeLen = isPlaying ? 10 + Math.abs(Math.sin(frame * 0.1 + i)) * (20 + beat * 25) : 5;
          const x1 = cx + Math.cos(angle) * (r + 4);
          const y1 = cy + Math.sin(angle) * (r + 4);
          const x2 = cx + Math.cos(angle) * (r + 4 + spokeLen);
          const y2 = cy + Math.sin(angle) * (r + 4 + spokeLen);
          ctx.strokeStyle = i % 2 === 0 ? '#8B5CFF' : '#FF2ED1';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      } else if (mode === 'PARTICLE_FLOW') {
        const count = 28;
        for (let i = 0; i < count; i++) {
          const speed = 1.5 + (i % 3) + beat * 2;
          const x = ((i * 37 + frame * speed) % width);
          const y = (height / 2) + Math.sin(frame * 0.04 + i) * (height * (0.28 + beat * 0.15));
          const size = 2 + (i % 4) + (beat * 1.5);
          ctx.fillStyle = i % 3 === 0 ? '#00F5FF' : i % 3 === 1 ? '#FF2ED1' : '#B8FF2C';
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [mode, isPlaying, currentSeconds]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-[280px] aspect-square rounded-3xl overflow-hidden border-2 border-[#00F5FF]/40 shadow-[0_0_40px_rgba(0,245,255,0.25)] bg-[#07090F]">
        <canvas ref={canvasRef} width={280} height={280} className="w-full h-full object-cover" />

        {/* Ambient Mode (YouTube / Protected source) */}
        {isYouTube && (
          <div className="absolute top-3 left-3 bg-[#10131C]/90 border border-[#171B28] px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] text-[#00F5FF] shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold">Ambient Pulse (Protected)</span>
          </div>
        )}

        {/* Pro Locked Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-[#07090F]/90 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center">
            <div className="w-10 h-10 rounded-2xl bg-[#00F5FF]/15 border border-[#00F5FF]/40 flex items-center justify-center text-[#00F5FF] mb-2 shadow-lg">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black uppercase text-[#F7F8FC] mb-1">
              {currentModeConfig.label} is Pro
            </h4>
            <p className="text-[11px] text-[#9CA3B7] mb-3">
              {currentModeConfig.desc}
            </p>
            <button
              onClick={onUnlockPro}
              className="px-4 py-1.5 rounded-full bg-[#00F5FF] text-[#07090F] text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unlock CyberPulse Pro</span>
            </button>
          </div>
        )}
      </div>

      {/* Mode Selector Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[300px] py-3 no-scrollbar">
        {MODES.map((m) => {
          const isSelected = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                isSelected
                  ? 'bg-[#00F5FF]/20 text-[#00F5FF] border-[#00F5FF]'
                  : 'bg-[#10131C] text-[#9CA3B7] border-[#171B28] hover:text-white'
              }`}
            >
              {m.isPro && <Lock className="w-2.5 h-2.5 text-amber-400" />}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

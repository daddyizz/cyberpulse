import React from 'react';

interface CyberArtworkProps {
  keyName: string;
  className?: string;
}

export const CyberArtwork: React.FC<CyberArtworkProps> = ({ keyName, className = 'w-full h-full' }) => {
  switch (keyName) {
    case 'neon_horizon':
      return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-[#07090F] via-[#0F1E36] to-[#00F5FF]/20 flex items-center justify-center ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00F5FF]/30 via-transparent to-transparent" />
          <svg className="w-1/2 h-1/2 text-[#00F5FF] opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 12h18M3 6h18M3 18h18M7 3v18M17 3v18" strokeDasharray="2 2" strokeOpacity="0.4" />
            <circle cx="12" cy="12" r="4" stroke="#00F5FF" strokeWidth="2" />
          </svg>
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-[#00F5FF]/60 tracking-wider">CYBER//01</div>
        </div>
      );
    case 'purple_pulse':
      return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-[#07090F] via-[#24103A] to-[#8B5CFF]/30 flex items-center justify-center ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-[#FF2ED1]/20 via-transparent to-transparent" />
          <svg className="w-1/2 h-1/2 text-[#8B5CFF] opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="12 2 2 22 22 22" stroke="#8B5CFF" strokeWidth="2" />
            <circle cx="12" cy="14" r="3" stroke="#FF2ED1" strokeWidth="1.5" />
          </svg>
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-[#8B5CFF]/60 tracking-wider">PULSE//02</div>
        </div>
      );
    case 'digital_rain':
      return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-[#07090F] via-[#0D2115] to-[#B8FF2C]/20 flex items-center justify-center ${className}`}>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#07090F_0%,transparent_50%,#B8FF2C/10_100%)]" />
          <svg className="w-1/2 h-1/2 text-[#B8FF2C] opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="4" y1="4" x2="4" y2="20" strokeDasharray="3 3" />
            <line x1="8" y1="2" x2="8" y2="16" strokeDasharray="2 4" />
            <line x1="12" y1="6" x2="12" y2="22" strokeDasharray="4 2" />
            <line x1="16" y1="3" x2="16" y2="18" strokeDasharray="3 3" />
            <line x1="20" y1="5" x2="20" y2="21" strokeDasharray="2 3" />
          </svg>
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-[#B8FF2C]/60 tracking-wider">MATRIX//03</div>
        </div>
      );
    case 'electric_dream':
      return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-[#07090F] via-[#2A1020] to-[#FF2ED1]/30 flex items-center justify-center ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FF2ED1]/25 via-transparent to-transparent" />
          <svg className="w-1/2 h-1/2 text-[#FF2ED1] opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#FF2ED1" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-[#FF2ED1]/60 tracking-wider">DREAM//04</div>
        </div>
      );
    case 'midnight_circuit':
    default:
      return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-[#07090F] via-[#141829] to-[#00F5FF]/15 flex items-center justify-center ${className}`}>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,245,255,0.05)_50%,transparent_75%)] bg-[length:12px_12px]" />
          <svg className="w-1/2 h-1/2 text-[#00F5FF] opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" stroke="#8B5CFF" strokeWidth="1.5" />
            <path d="M12 7v5l3 3" stroke="#00F5FF" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-[#00F5FF]/60 tracking-wider">CIRCUIT//05</div>
        </div>
      );
  }
};

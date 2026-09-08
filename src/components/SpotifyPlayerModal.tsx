import React, { useState } from 'react';
import { Track } from '../types';
import { getSpotifyEmbedUrl, SPOTIFY_CONFIG } from '../services/spotifyService';
import { X, ExternalLink, Music, Copy, Check, Sparkles, ShieldCheck, Play } from 'lucide-react';

interface SpotifyPlayerModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayNext?: (track: Track) => void;
  onPlayViaYouTube?: (track: Track) => void;
}

export const SpotifyPlayerModal: React.FC<SpotifyPlayerModalProps> = ({
  track,
  isOpen,
  onClose,
  onPlayNext,
  onPlayViaYouTube
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !track) return null;

  const spotifyId = track.spotifyTrackId || track.id.replace(/^sp_/, '');
  const embedUrl = getSpotifyEmbedUrl(spotifyId);

  const handleCopyLink = () => {
    const link = track.externalUrl || `https://open.spotify.com/track/${spotifyId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenApp = () => {
    if (track.spotifyUri) {
      window.location.href = track.spotifyUri;
    } else if (track.externalUrl) {
      window.open(track.externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0D101C] border border-[#1DB954]/40 rounded-2xl shadow-[0_0_50px_rgba(29,185,84,0.25)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F2436] bg-[#0A0D17]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-black text-xs">
              <Music className="w-4 h-4 fill-black" />
            </div>
            <div>
              <div className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
                Spotify Live Player
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40">
                  180-Day Key Active
                </span>
              </div>
              <div className="text-[11px] text-gray-400">Official Spotify Web Integration</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Spotify Official Interactive Player Embed */}
        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-full text-center px-2 py-1.5 rounded-lg bg-[#1DB954]/10 border border-[#1DB954]/30">
            <p className="text-[11px] text-[#1DB954] font-medium">
              Please click the <span className="font-bold">Play (▶)</span> button inside the official Spotify player below to stream track.
            </p>
          </div>

          <div className="w-full rounded-xl overflow-hidden bg-black/50 border border-[#1DB954]/30 shadow-inner">
            <iframe
              title={`Spotify Player - ${track.title}`}
              src={embedUrl}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
            />
          </div>

          {/* Track Summary Bar */}
          <div className="w-full flex items-center justify-between p-3 rounded-xl bg-[#07090F] border border-[#1F2436]">
            <div className="flex items-center gap-3 min-w-0">
              {track.artworkUrl ? (
                <img
                  src={track.artworkUrl}
                  alt={track.title}
                  className="w-12 h-12 rounded-lg object-cover border border-[#1F2436] shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center shrink-0">
                  <Music className="w-6 h-6 text-[#1DB954]" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{track.title}</div>
                <div className="text-xs text-gray-400 truncate">{track.artist}</div>
                <div className="text-[10px] text-gray-500 truncate">{track.album}</div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono font-bold text-[#1DB954] bg-[#1DB954]/10 px-2.5 py-1 rounded-lg border border-[#1DB954]/30">
                Spotify Live
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleOpenApp}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs transition-all shadow-[0_0_20px_rgba(29,185,84,0.3)] hover:scale-[1.02]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Spotify App</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0A0D17] hover:bg-[#141828] border border-[#1F2436] hover:border-[#1DB954]/50 text-gray-200 font-semibold text-xs transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#1DB954]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied' : 'Share Spotify Link'}</span>
            </button>
          </div>

          {/* Security & Token Lifecycle Badge */}
          <div className="w-full flex items-center justify-between text-[10px] text-gray-500 pt-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-[#1DB954]" />
              <span>Client Credentials Authenticated</span>
            </div>
            <div className="font-mono text-[10px] text-gray-400">
              Proxy: Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Disc } from 'lucide-react';
import { getKnownSpotifyCover, resolveSpotifyCoverArt } from '../services/spotifyArtworkService';

interface CyberArtworkProps {
  keyName?: string;
  artworkUrl?: string;
  fallbackUrl?: string;
  title?: string;
  artist?: string;
  className?: string;
}

const FALLBACK_ARTWORKS: Record<string, string> = {
  neon_horizon: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
  purple_pulse: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  digital_rain: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  electric_dream: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
  midnight_circuit: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
};

function fallbackFor(keyName?: string) {
  return (keyName && FALLBACK_ARTWORKS[keyName]) || FALLBACK_ARTWORKS.default;
}

export const CyberArtwork: React.FC<CyberArtworkProps> = ({
  keyName,
  artworkUrl,
  fallbackUrl,
  title,
  artist,
  className = 'w-full h-full',
}) => {
  const initialSpotify = getKnownSpotifyCover(title, artist);
  const chooseInitial = () => initialSpotify || artworkUrl || fallbackUrl || fallbackFor(keyName);

  const [currentSrc, setCurrentSrc] = useState<string>(chooseInitial);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    setFailedUrls(new Set());

    const knownSpotify = getKnownSpotifyCover(title, artist);
    const initial = knownSpotify || artworkUrl || fallbackUrl || fallbackFor(keyName);
    setCurrentSrc(initial);

    // Spotify is the authoritative artwork source. Keep the current image visible
    // while the lookup runs, then replace it only when Spotify returns a real match.
    if (title) {
      resolveSpotifyCoverArt(title, artist).then((resolved) => {
        if (mounted && resolved) setCurrentSrc(resolved);
      });
    }

    return () => {
      mounted = false;
    };
  }, [artworkUrl, fallbackUrl, keyName, title, artist]);

  const handleImageError = () => {
    setFailedUrls((previous) => {
      const next = new Set(previous);
      if (currentSrc) next.add(currentSrc);

      const candidates = [
        getKnownSpotifyCover(title, artist),
        artworkUrl,
        fallbackUrl,
        fallbackFor(keyName),
      ].filter((value): value is string => Boolean(value));

      const nextSource = candidates.find((candidate) => !next.has(candidate));
      if (nextSource) setCurrentSrc(nextSource);
      else setCurrentSrc('');
      return next;
    });
  };

  if (currentSrc) {
    return (
      <div className={`relative overflow-hidden bg-[#0D111A] flex items-center justify-center ${className}`}>
        <img
          src={currentSrc}
          alt={title || 'Album artwork'}
          className="relative z-10 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="eager"
          onError={handleImageError}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-[#0B0F19] via-[#151D30] to-[#00F5FF]/20 flex flex-col items-center justify-center ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#00F5FF]/15 via-transparent to-transparent" />
      <Disc className="w-1/3 h-1/3 text-[#00F5FF] opacity-75" />
      {title && (
        <span className="text-[9px] font-bold text-white/80 truncate px-2 text-center mt-1 z-10">
          {title}
        </span>
      )}
    </div>
  );
};

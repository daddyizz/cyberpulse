import React, { useState, useEffect } from 'react';
import { Disc } from 'lucide-react';
import {
  isSpotifyImageUrl,
  getKnownSpotifyCover,
  resolveSpotifyCoverArt
} from '../services/spotifyArtworkService';

interface CyberArtworkProps {
  keyName?: string;
  artworkUrl?: string;
  fallbackUrl?: string;
  title?: string;
  artist?: string;
  className?: string;
}

// Curated high-reliability fallback artworks by key
const FALLBACK_ARTWORKS: Record<string, string> = {
  neon_horizon: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
  purple_pulse: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  digital_rain: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  electric_dream: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
  midnight_circuit: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
};

export const CyberArtwork: React.FC<CyberArtworkProps> = ({
  keyName,
  artworkUrl,
  fallbackUrl,
  title,
  artist,
  className = 'w-full h-full',
}) => {
  // Determine best initial source: prefer official Spotify image if given, or known Spotify cover
  const getInitialSrc = (): string | undefined => {
    if (isSpotifyImageUrl(artworkUrl)) {
      return artworkUrl;
    }
    const knownSpotify = getKnownSpotifyCover(title, artist);
    if (knownSpotify) {
      return knownSpotify;
    }
    return artworkUrl || fallbackUrl || (keyName ? FALLBACK_ARTWORKS[keyName] : FALLBACK_ARTWORKS.default);
  };

  const [currentSrc, setCurrentSrc] = useState<string | undefined>(getInitialSrc);
  const [errorCount, setErrorCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Recompute when props change or attempt background Spotify resolution
  useEffect(() => {
    let isMounted = true;
    setErrorCount(0);
    setIsLoaded(false);

    if (isSpotifyImageUrl(artworkUrl)) {
      setCurrentSrc(artworkUrl);
      return;
    }

    const knownSpotify = getKnownSpotifyCover(title, artist);
    if (knownSpotify) {
      setCurrentSrc(knownSpotify);
      return;
    }

    // Set available source first to show something right away
    const initial = artworkUrl || fallbackUrl || (keyName ? FALLBACK_ARTWORKS[keyName] : FALLBACK_ARTWORKS.default);
    setCurrentSrc(initial);

    // If we have a title, query Spotify API in background to obtain the authentic Spotify cover skin
    if (title) {
      resolveSpotifyCoverArt(title, artist).then((spotifyCover) => {
        if (isMounted && spotifyCover) {
          setCurrentSrc(spotifyCover);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [artworkUrl, fallbackUrl, keyName, title, artist]);

  const handleImageError = () => {
    if (errorCount === 0) {
      // Step 1 fallback: check known Spotify cover
      const spotifyFallback = getKnownSpotifyCover(title, artist);
      if (spotifyFallback && currentSrc !== spotifyFallback) {
        setCurrentSrc(spotifyFallback);
        setErrorCount(1);
        return;
      }
    }

    if (errorCount <= 1 && fallbackUrl && currentSrc !== fallbackUrl) {
      setCurrentSrc(fallbackUrl);
      setErrorCount(2);
      return;
    }

    // Step 2 fallback: curated unsplash fallback
    const fallback = (keyName && FALLBACK_ARTWORKS[keyName]) || FALLBACK_ARTWORKS.default;
    if (currentSrc !== fallback && errorCount <= 2) {
      setCurrentSrc(fallback);
      setErrorCount(3);
    } else {
      setErrorCount(4);
    }
  };

  if (currentSrc && errorCount < 4) {
    return (
      <div className={`relative overflow-hidden bg-[#0D111A] flex items-center justify-center ${className}`}>
        {/* Subtle background placeholder glow while image loads */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1424] to-[#0A0D18]" />
        <img
          src={currentSrc}
          alt={title || 'Album artwork'}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Disc className="w-1/3 h-1/3 text-[#00F5FF]/40 animate-pulse" />
          </div>
        )}
      </div>
    );
  }

  // Graceful stylized Cyber gradient artwork with record icon
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-[#0B0F19] via-[#151D30] to-[#00F5FF]/20 flex flex-col items-center justify-center ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#00F5FF]/15 via-transparent to-transparent" />
      <Disc className="w-1/3 h-1/3 text-[#00F5FF] opacity-75 animate-spin-slow" />
      {title && (
        <span className="text-[9px] font-bold text-white/80 truncate px-2 text-center mt-1 z-10">
          {title}
        </span>
      )}
    </div>
  );
};



import { Track } from '../types';

export const SPOTIFY_CONFIG = {
  providerName: 'Spotify Official Web API',
  proxyPath: '/api/spotify',
  usesBackendProxy: true
};

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

export async function getSpotifyAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt - 60_000) return cachedAccessToken;

  const response = await fetch(`${SPOTIFY_CONFIG.proxyPath}/token`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.accessToken) {
    throw new Error(data?.message || `Spotify token proxy failed (HTTP ${response.status})`);
  }

  cachedAccessToken = data.accessToken;
  tokenExpiresAt = now + (Number(data.expiresIn) || 3600) * 1000;
  return cachedAccessToken;
}

export interface SpotifySearchResult {
  tracks: Track[];
  error?: string;
  total?: number;
  source?: 'proxy';
}

function pickBestArtwork(images?: Array<{ url?: string; width?: number | null; height?: number | null }>): string | undefined {
  if (!images?.length) return undefined;

  return [...images]
    .filter((image) => Boolean(image?.url))
    .sort((a, b) => {
      const aPixels = (a.width || 0) * (a.height || 0);
      const bPixels = (b.width || 0) * (b.height || 0);
      return bPixels - aPixels;
    })[0]?.url;
}

function mapSpotifyItemToTrack(item: any): Track {
  const spotifyId = item.id;
  const title = item.name;
  const artist = item.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';
  const album = item.album?.name || 'Spotify Single';
  const artworkUrl = pickBestArtwork(item.album?.images);
  const durationSeconds = Math.round((item.duration_ms || 0) / 1000);
  const spotifyPreviewUrl = item.preview_url || undefined;
  const spotifyUri = item.uri || `spotify:track:${spotifyId}`;
  const externalUrl = item.external_urls?.spotify || `https://open.spotify.com/track/${spotifyId}`;

  return {
    id: `sp_${spotifyId}`,
    title,
    artist,
    album,
    artworkUrl,
    placeholderArtworkKey: 'neon_grid',
    durationSeconds,
    // Spotify Web API preview clips are not full songs, so they must never be
    // treated as the app's primary full-length audio source.
    audioUrl: undefined,
    spotifyPreviewUrl,
    spotifyTrackId: spotifyId,
    spotifyUri,
    externalUrl,
    source: 'SPOTIFY',
    isLiked: false,
    playsCount: Math.floor(item.popularity ? item.popularity * 1800 + 4000 : 8500),
    playbackCapability: {
      mode: 'EXTERNAL_PLAYER',
      supportsOffline: false,
      supportsLyrics: true,
      streamBitrateKbps: 320,
      notice: spotifyPreviewUrl
        ? 'Spotify metadata/artwork available. Preview clip is not full-length; CyberPulse resolves the matching full song through YouTube.'
        : 'Spotify metadata/artwork available. Full-song playback falls back to a verified matching YouTube source.'
    }
  };
}

export async function searchSpotifyTracks(
  query: string,
  limit = 10
): Promise<SpotifySearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return { tracks: [] };

  const safeLimit = Math.min(Math.max(1, limit), 10);

  try {
    const proxyUrl = `${SPOTIFY_CONFIG.proxyPath}/search?q=${encodeURIComponent(trimmed)}&limit=${safeLimit}`;
    const response = await fetch(proxyUrl);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        tracks: [],
        error: data?.error?.message || data?.message || `Spotify proxy returned HTTP ${response.status}`
      };
    }

    const items = data.tracks?.items || [];
    const tracks: Track[] = items.map(mapSpotifyItemToTrack);

    return {
      tracks,
      total: data.tracks?.total || tracks.length,
      source: 'proxy'
    };
  } catch (err: any) {
    console.error('Spotify search proxy failed:', err);
    return {
      tracks: [],
      error: err?.message || 'Unable to reach Spotify search service.'
    };
  }
}

export async function checkSpotifyHealth(): Promise<{
  ok: boolean;
  message: string;
  source: 'proxy' | 'none';
}> {
  try {
    const res = await fetch(`${SPOTIFY_CONFIG.proxyPath}/health`);
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.status === 'ok') {
      return { ok: true, message: 'Connected via backend proxy', source: 'proxy' };
    }

    return {
      ok: false,
      message: data?.message || `Spotify health check failed (HTTP ${res.status})`,
      source: 'none'
    };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Unable to connect to Spotify API', source: 'none' };
  }
}

export async function searchSpotifyArtwork(title: string, artist?: string): Promise<string | null> {
  const query = `${title} ${artist || ''}`.trim();
  if (!query) return null;

  try {
    const url = `${SPOTIFY_CONFIG.proxyPath}/artwork?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    return typeof data?.artworkUrl === 'string' && data.artworkUrl ? data.artworkUrl : null;
  } catch {
    return null;
  }
}

export function getSpotifyEmbedUrl(spotifyTrackId: string): string {
  const cleanId = spotifyTrackId.replace(/^sp_/, '').replace(/^spotify:track:/, '');
  return `https://open.spotify.com/embed/track/${cleanId}?utm_source=generator&theme=0`;
}

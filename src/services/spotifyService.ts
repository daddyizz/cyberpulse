import { Track } from '../types';

export const SPOTIFY_CONFIG = {
  clientId:
    ((import.meta as any).env?.VITE_SPOTIFY_CLIENT_ID as string) ||
    ((import.meta as any).env?.SPOTIFY_CLIENT_ID as string) ||
    '323d9249fe1e42b7b6d108ed5817fe08',
  clientSecret:
    ((import.meta as any).env?.VITE_SPOTIFY_CLIENT_SECRET as string) ||
    ((import.meta as any).env?.SPOTIFY_CLIENT_SECRET as string) ||
    'dd6dc30505df4d9289e3a5514646bde6',
  validityDays: 180,
  providerName: 'Spotify Official Web API'
};

export function getCleanSpotifyCredentials() {
  const rawId =
    ((import.meta as any).env?.VITE_SPOTIFY_CLIENT_ID as string) ||
    ((import.meta as any).env?.SPOTIFY_CLIENT_ID as string) ||
    '323d9249fe1e42b7b6d108ed5817fe08';
  const rawSecret =
    ((import.meta as any).env?.VITE_SPOTIFY_CLIENT_SECRET as string) ||
    ((import.meta as any).env?.SPOTIFY_CLIENT_SECRET as string) ||
    'dd6dc30505df4d9289e3a5514646bde6';

  return {
    clientId: (rawId || '').trim().replace(/^["']|["']$/g, ''),
    clientSecret: (rawSecret || '').trim().replace(/^["']|["']$/g, '')
  };
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Obtain or reuse a valid OAuth2 bearer token from Spotify Accounts using Client Credentials flow.
 * Keys are valid for 180 days; individual access tokens refresh every hour.
 */
export async function getSpotifyAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const { clientId, clientSecret } = getCleanSpotifyCredentials();
  if (!clientId || !clientSecret) {
    throw new Error('Spotify Client ID or Client Secret is missing.');
  }

  const basicAuth = btoa(`${clientId}:${clientSecret}`);
  
  // Try with Basic Auth header
  let response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials'
    })
  });

  // Fallback to body-based client credentials if Basic Auth header has CORS or formatting issue
  if (!response.ok) {
    response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error_description ||
        errorData?.error ||
        `Failed to authenticate with Spotify (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in || 3600) * 1000;
  return cachedAccessToken!;
}

export interface SpotifySearchResult {
  tracks: Track[];
  error?: string;
  total?: number;
  source?: 'proxy' | 'direct';
}

function mapSpotifyItemToTrack(item: any): Track {
  const spotifyId = item.id;
  const title = item.name;
  const artist = item.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';
  const album = item.album?.name || 'Spotify Single';
  const artworkUrl =
    item.album?.images?.[0]?.url ||
    item.album?.images?.[1]?.url ||
    item.album?.images?.[2]?.url;
  const durationSeconds = Math.round((item.duration_ms || 0) / 1000);
  const audioUrl = item.preview_url || undefined;
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
    audioUrl,
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
      notice: 'Official Spotify Web Player with interactive embedded playback.'
    }
  };
}

/**
 * Search Spotify catalog for tracks matching the search query.
 * Dual-channel engine: First uses the reliable same-origin server proxy,
 * and seamlessly falls back to direct browser client-credentials if offline or static.
 */
export async function searchSpotifyTracks(
  query: string,
  limit = 10
): Promise<SpotifySearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { tracks: [] };
  }

  // Spotify Developer search API strictly requires limit <= 10
  const safeLimit = Math.min(Math.max(1, limit), 10);

  // CHANNEL 1: Same-origin Vite / Node Proxy
  try {
    const proxyUrl = `/api/spotify/search?q=${encodeURIComponent(trimmed)}&limit=${safeLimit}`;
    const proxyResp = await fetch(proxyUrl);

    if (proxyResp.ok) {
      const data = await proxyResp.json();
      const items = data.tracks?.items || [];
      const tracks: Track[] = items.map(mapSpotifyItemToTrack);
      return {
        tracks,
        total: data.tracks?.total || tracks.length,
        source: 'proxy'
      };
    } else {
      console.warn('Spotify proxy returned HTTP', proxyResp.status, 'attempting direct fallback...');
    }
  } catch (proxyErr) {
    console.warn('Spotify proxy request failed, attempting direct fallback...', proxyErr);
  }

  // CHANNEL 2: Direct Client-Credentials Web API Fallback
  try {
    const token = await getSpotifyAccessToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      trimmed
    )}&type=track&limit=${safeLimit}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        cachedAccessToken = null;
        tokenExpiresAt = 0;
      }
      const errData = await response.json().catch(() => ({}));
      return {
        tracks: [],
        error: errData?.error?.message || `Spotify API returned HTTP ${response.status}`
      };
    }

    const data = await response.json();
    const items = data.tracks?.items || [];
    const tracks: Track[] = items.map(mapSpotifyItemToTrack);

    return {
      tracks,
      total: data.tracks?.total || tracks.length,
      source: 'direct'
    };
  } catch (err: any) {
    console.error('Direct Spotify search failed:', err);
    return {
      tracks: [],
      error:
        err?.message ||
        'Unable to reach Spotify. Please check internet connection or reload the preview.'
    };
  }
}

/**
 * Health check to verify Spotify credentials and connection status
 */
export async function checkSpotifyHealth(): Promise<{
  ok: boolean;
  message: string;
  source: 'proxy' | 'direct' | 'none';
}> {
  try {
    const res = await fetch('/api/spotify/health');
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok') {
        return { ok: true, message: 'Connected via backend proxy', source: 'proxy' };
      }
    }
  } catch {
    // ignore
  }

  try {
    const token = await getSpotifyAccessToken();
    if (token) {
      return { ok: true, message: 'Connected via direct client credentials', source: 'direct' };
    }
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Authentication error', source: 'none' };
  }

  return { ok: false, message: 'Unable to connect to Spotify API', source: 'none' };
}

/**
 * Returns the official Spotify interactive embed URL for playing in an iframe.
 */
export function getSpotifyEmbedUrl(spotifyTrackId: string): string {
  const cleanId = spotifyTrackId.replace(/^sp_/, '').replace(/^spotify:track:/, '');
  return `https://open.spotify.com/embed/track/${cleanId}?utm_source=generator&theme=0`;
}

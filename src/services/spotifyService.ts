import { Playlist, Track } from '../types';
import { searchYouTubeVideos } from './youtubeService';

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
    .sort((a, b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)))[0]?.url;
}

function mapSpotifyItemToTrack(item: any): Track {
  const spotifyId = item.id;
  const title = item.name;
  const artist = item.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';
  const album = item.album?.name || 'Spotify Single';
  const artworkUrl = pickBestArtwork(item.album?.images);
  const durationSeconds = Math.round((item.duration_ms || 0) / 1000);
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
    // Spotify preview_url is never a full-song source in Sona.
    audioUrl: undefined,
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
      notice: 'Spotify supplies official metadata/artwork; full playback is verified against YouTube.'
    }
  };
}

export async function searchSpotifyTracks(query: string, limit = 10): Promise<SpotifySearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return { tracks: [] };
  const safeLimit = Math.min(Math.max(1, limit), 10);

  try {
    const proxyUrl = `${SPOTIFY_CONFIG.proxyPath}/search?q=${encodeURIComponent(trimmed)}&limit=${safeLimit}`;
    const response = await fetch(proxyUrl);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { tracks: [], error: data?.error?.message || data?.message || `Spotify proxy returned HTTP ${response.status}` };
    }

    const tracks: Track[] = (data.tracks?.items || []).map(mapSpotifyItemToTrack);
    return { tracks, total: data.tracks?.total || tracks.length, source: 'proxy' };
  } catch (err: any) {
    console.error('Spotify search proxy failed:', err);
    return { tracks: [], error: err?.message || 'Unable to reach Spotify search service.' };
  }
}

export async function checkSpotifyHealth(): Promise<{ ok: boolean; message: string; source: 'proxy' | 'none' }> {
  try {
    const res = await fetch(`${SPOTIFY_CONFIG.proxyPath}/health`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.status === 'ok') return { ok: true, message: 'Connected via backend proxy', source: 'proxy' };
    return { ok: false, message: data?.message || `Spotify health check failed (HTTP ${res.status})`, source: 'none' };
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

export interface SpotifyPlaylistPreset {
  id: string;
  title: string;
  description: string;
  category: string;
  artworkUrl: string;
}

export const POPULAR_SPOTIFY_PLAYLISTS: SpotifyPlaylistPreset[] = [
  {
    id: '37i9dQZF1DXcBWIGoYBM5M',
    title: "Today's Top Hits",
    description: 'Hottest tracks on the global charts and international trends.',
    category: 'Global Hits',
    artworkUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: '37i9dQZF1DXadOVCgGhS7j',
    title: 'Stealth Running Tempo',
    description: 'High-energy tempo designed for intense cardio and rhythmic endurance.',
    category: 'Running / Workout',
    artworkUrl: 'https://images.unsplash.com/photo-1483721074577-832145b23d91?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: '37i9dQZF1DX0XUsuxWHRQd',
    title: 'RapCaviar',
    description: 'Top hip-hop compilation and rhythmic essentials.',
    category: 'Hip-Hop',
    artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: '37i9dQZF1DX4WYpdgoIcn6',
    title: 'Chill Hits',
    description: 'Acoustic calm and modern pop essentials for relaxation.',
    category: 'Chill & Acoustic',
    artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: '37i9dQZF1DWZeKCadgRdKQ',
    title: 'Deep Focus',
    description: 'Ambient and instrumental soundscapes for maximum productivity.',
    category: 'Focus / Ambient',
    artworkUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&auto=format&fit=crop&q=80',
  },
];

export interface ImportPlaylistResult {
  success: boolean;
  playlist?: Playlist;
  error?: string;
}

export function extractSpotifyPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.includes('open.spotify.com/playlist/')) {
    const after = trimmed.split('open.spotify.com/playlist/')[1];
    return after.split('?')[0].split('#')[0].trim() || null;
  }
  if (trimmed.startsWith('spotify:playlist:')) return trimmed.replace('spotify:playlist:', '').trim() || null;
  if (/^[a-zA-Z0-9]{15,30}$/.test(trimmed)) return trimmed;
  return null;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function scoreYouTubeMatch(source: Track, candidate: Track): number {
  const srcTitle = normalize(source.title);
  const srcArtist = normalize(source.artist.split(',')[0] || source.artist);
  const candidateTitle = normalize(candidate.title);
  const candidateArtist = normalize(candidate.artist);
  let score = 0;

  if (candidateTitle.includes(srcTitle)) score += 8;
  if (srcTitle.includes(candidateTitle)) score += 2;
  if (candidateTitle.includes(srcArtist) || candidateArtist.includes(srcArtist)) score += 5;
  if (/official|audio|topic|vevo/.test(`${candidateTitle} ${candidateArtist}`)) score += 2;

  const sourceDuration = source.durationSeconds || 0;
  const candidateDuration = candidate.durationSeconds || 0;
  if (sourceDuration > 0 && candidateDuration > 0) {
    const diff = Math.abs(sourceDuration - candidateDuration);
    if (diff <= 3) score += 5;
    else if (diff <= 8) score += 3;
    else if (diff <= 15) score += 1;
    else if (diff > 45) score -= 5;
  }

  return score;
}

async function resolveOneSpotifyTrack(track: Track): Promise<Track | null> {
  const queries = [
    `${track.title} ${track.artist} official audio`,
    `${track.title} ${track.artist}`,
  ];

  for (const query of queries) {
    const yt = await searchYouTubeVideos(query, 5);
    if (!yt.tracks.length) continue;

    const ranked = [...yt.tracks].sort((a, b) => scoreYouTubeMatch(track, b) - scoreYouTubeMatch(track, a));
    const best = ranked[0];
    if (!best?.youtubeVideoId) continue;

    const bestScore = scoreYouTubeMatch(track, best);
    if (bestScore < 6) continue;

    return {
      ...track,
      artworkUrl: track.artworkUrl,
      youtubeVideoId: best.youtubeVideoId,
      audioUrl: undefined,
      source: 'SPOTIFY' as const,
      playbackCapability: {
        ...track.playbackCapability,
        mode: 'EXTERNAL_PLAYER',
        supportsOffline: false,
        notice: 'Spotify metadata/artwork with verified full-length YouTube playback.',
      },
    };
  }

  return null;
}

async function resolveSpotifyTracksToYouTube(tracks: Track[]): Promise<Track[]> {
  const playable: Track[] = [];

  // Resolve in small batches to avoid creating many simultaneous iframe/API requests.
  for (let start = 0; start < tracks.length; start += 4) {
    const batch = tracks.slice(start, start + 4);
    const results = await Promise.allSettled(batch.map(resolveOneSpotifyTrack));

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value?.youtubeVideoId) {
        playable.push(result.value);
      }
    }
  }

  // Never place an imported item in the app when no verified full playback source exists.
  return playable;
}

export async function importSpotifyPlaylist(playlistUrlOrId: string): Promise<ImportPlaylistResult> {
  const playlistId = extractSpotifyPlaylistId(playlistUrlOrId);
  if (!playlistId) {
    return { success: false, error: 'Invalid Spotify link. Please enter a URL like "https://open.spotify.com/playlist/..." or a playlist ID.' };
  }

  try {
    const res = await fetch(`${SPOTIFY_CONFIG.proxyPath}/playlist?id=${encodeURIComponent(playlistId)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok && !data?.name) {
      return { success: false, error: data?.error?.message || data?.message || `Failed to load playlist from Spotify (HTTP ${res.status})` };
    }

    const title = data.name || 'Imported Spotify Playlist';
    const description = data.description || 'Imported from Spotify via Sona Player';
    const artworkUrl = pickBestArtwork(data.images) || data.images?.[0]?.url;
    const createdBy = data.owner?.display_name || 'Spotify';

    let tracks: Track[] = [];
    if (Array.isArray(data.tracks?.items) && data.tracks.items.length > 0) {
      tracks = data.tracks.items
        .map((item: any) => (item.track ? mapSpotifyItemToTrack(item.track) : null))
        .filter((t: Track | null): t is Track => Boolean(t && t.title));
    }

    if (tracks.length === 0) {
      const searchRes = await searchSpotifyTracks(title, 8);
      if (searchRes.tracks.length > 0) tracks = searchRes.tracks;
    }

    const sourceCount = tracks.length;
    tracks = await resolveSpotifyTracksToYouTube(tracks);

    if (sourceCount > 0 && tracks.length === 0) {
      return {
        success: false,
        error: 'Spotify playlist loaded, but no tracks had a verified full-length YouTube playback match. Nothing was imported.',
      };
    }

    const importedPlaylist: Playlist = {
      id: `sp_pl_${playlistId}_${Date.now()}`,
      title,
      description,
      artworkKey: 'neon_grid',
      artworkUrl,
      trackCount: tracks.length,
      createdBy: `${createdBy} (Spotify)`,
      source: 'SPOTIFY',
      tracks,
    };

    return { success: true, playlist: importedPlaylist };
  } catch (err: any) {
    console.error('importSpotifyPlaylist error:', err);
    return { success: false, error: err?.message || 'Connection error while importing Spotify playlist.' };
  }
}

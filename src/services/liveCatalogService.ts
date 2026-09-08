import { DEMO_ALBUMS, DEMO_ARTISTS, DEMO_TRACKS } from '../data/mockData';
import { searchSpotifyTracks } from './spotifyService';
import { searchYouTubeVideos } from './youtubeService';
import type { Album, Artist, Track } from '../types';

const CACHE_KEY = 'cyberpulse_live_catalog_v1';
const CACHE_TTL_MS = 45 * 60 * 1000;
const MAX_LIVE_TRACKS = 24;

type LiveCatalogCache = {
  updatedAt: number;
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const trackKey = (track: Track) => `${track.title.trim().toLowerCase()}::${track.artist.trim().toLowerCase()}`;

const sanitizeLiveTrack = (track: Track): Track => {
  const audio = (track.audioUrl || '').toLowerCase();
  const previewOnly =
    track.source === 'SPOTIFY' ||
    audio.includes('/audiopreview') ||
    audio.includes('itunes-assets/audiopreview');

  return previewOnly ? { ...track, audioUrl: undefined } : { ...track };
};

const mergeUniqueTracks = (liveTracks: Track[], seedTracks: Track[]): Track[] => {
  const seen = new Set<string>();
  const merged: Track[] = [];
  for (const rawTrack of [...liveTracks, ...seedTracks]) {
    const track = sanitizeLiveTrack(rawTrack);
    const key = trackKey(track);
    if (!track.title || !track.artist || seen.has(key)) continue;
    seen.add(key);
    merged.push(track);
  }
  return merged;
};

const deriveArtistsAndAlbums = (tracks: Track[]) => {
  const artistMap = new Map<string, Artist>();
  const albumMap = new Map<string, Album>();

  for (const track of tracks) {
    const primaryArtist = track.artist.split(',')[0]?.trim() || track.artist;
    const artistId = `live_artist_${slug(primaryArtist) || 'artist'}`;
    if (!artistMap.has(artistId)) {
      artistMap.set(artistId, {
        id: artistId,
        name: primaryArtist,
        followersCount: Math.max(0, track.playsCount || 0),
        source: track.source,
        artworkKey: track.placeholderArtworkKey || 'live-artist',
        artworkUrl: track.artworkUrl,
        genres: ['Live Discovery'],
      });
    }

    const albumName = track.album || `${track.title} — Single`;
    const albumId = `live_album_${slug(`${primaryArtist}-${albumName}`) || track.id}`;
    if (!albumMap.has(albumId)) {
      albumMap.set(albumId, {
        id: albumId,
        title: albumName,
        artist: primaryArtist,
        artistId,
        releaseYear: new Date().getFullYear(),
        artworkKey: track.placeholderArtworkKey || 'live-album',
        artworkUrl: track.artworkUrl,
        tracksCount: 1,
        source: track.source,
        tracks: [track],
      });
    } else {
      const album = albumMap.get(albumId)!;
      album.tracks = [...(album.tracks || []), track];
      album.tracksCount = album.tracks.length;
    }
  }

  return {
    artists: Array.from(artistMap.values()).slice(0, 16),
    albums: Array.from(albumMap.values()).slice(0, 16),
  };
};

const applyCatalog = (catalog: LiveCatalogCache) => {
  const currentFirst = DEMO_TRACKS[0];
  const mergedTracks = mergeUniqueTracks(catalog.tracks, DEMO_TRACKS).slice(0, 64);

  if (currentFirst) {
    const firstKey = trackKey(currentFirst);
    const withoutFirst = mergedTracks.filter((track) => trackKey(track) !== firstKey);
    DEMO_TRACKS.splice(0, DEMO_TRACKS.length, sanitizeLiveTrack(currentFirst), ...withoutFirst);
  } else {
    DEMO_TRACKS.splice(0, DEMO_TRACKS.length, ...mergedTracks);
  }

  // Keep the curated genre-tagged artist seeds first. Onboarding relies on
  // those genre tags; generic "Live Discovery" artists must not take over the
  // Favorite Artists step. Live artists remain available after the seed set.
  const seedArtists = DEMO_ARTISTS.filter((artist) => !artist.id.startsWith('live_artist_'));
  const seedNames = new Set(seedArtists.map((artist) => artist.name.trim().toLowerCase()));
  const liveArtists = catalog.artists.filter(
    (artist) => !seedNames.has(artist.name.trim().toLowerCase())
  );
  DEMO_ARTISTS.splice(0, DEMO_ARTISTS.length, ...seedArtists, ...liveArtists);

  const existingAlbumIds = new Set(catalog.albums.map((album) => album.id));
  DEMO_ALBUMS.splice(
    0,
    DEMO_ALBUMS.length,
    ...catalog.albums,
    ...DEMO_ALBUMS.filter((album) => !existingAlbumIds.has(album.id))
  );
};

const readCache = (): LiveCatalogCache | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LiveCatalogCache;
    if (!parsed?.updatedAt || !Array.isArray(parsed.tracks)) return null;
    if (Date.now() - parsed.updatedAt > CACHE_TTL_MS) return null;
    parsed.tracks = parsed.tracks.map(sanitizeLiveTrack);
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (catalog: LiveCatalogCache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(catalog));
  } catch {
    // Cache is optional; live discovery still works without localStorage.
  }
};

/**
 * Refresh the app's discovery seed from live Spotify + YouTube data.
 * mockData remains the offline fallback, while exported arrays are hydrated
 * before React mounts so songs, artists and albums rotate automatically.
 */
export async function hydrateLiveCatalog(): Promise<void> {
  const cached = readCache();
  if (cached) {
    applyCatalog(cached);
    return;
  }

  const year = new Date().getFullYear();
  const spotifyQueries = [`year:${year}`, `pop ${year}`, `Malaysia ${year}`];
  const youtubeQueries = [`official music video ${year}`, `new music ${year}`];

  const settled = await Promise.allSettled([
    ...spotifyQueries.map((query) => searchSpotifyTracks(query, 8)),
    ...youtubeQueries.map((query) => searchYouTubeVideos(query, 8)),
  ]);

  const liveTracks: Track[] = [];
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue;
    const value = result.value as { tracks?: Track[] };
    if (Array.isArray(value.tracks)) liveTracks.push(...value.tracks.map(sanitizeLiveTrack));
  }

  const uniqueLive = mergeUniqueTracks(liveTracks, []).slice(0, MAX_LIVE_TRACKS);
  if (!uniqueLive.length) return;

  const { artists, albums } = deriveArtistsAndAlbums(uniqueLive);
  const catalog: LiveCatalogCache = {
    updatedAt: Date.now(),
    tracks: uniqueLive,
    artists,
    albums,
  };
  writeCache(catalog);
  applyCatalog(catalog);
}

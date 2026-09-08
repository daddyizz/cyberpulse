import { DEMO_ALBUMS, DEMO_ARTISTS, DEMO_PLAYLISTS, DEMO_TRACKS } from '../data/mockData';
import { searchSpotifyTracks } from './spotifyService';
import { searchYouTubeVideos } from './youtubeService';
import type { Album, Artist, Playlist, Track } from '../types';

const CACHE_KEY = 'cyberpulse_live_catalog_v3';
const CACHE_TTL_MS = 20 * 60 * 1000;
const MAX_TRACKS = 60;

const GENRE_QUERIES = [
  'synthwave',
  'electronic',
  'pop',
  'hip hop',
  'rock',
  'r&b',
  'edm',
  'k-pop',
  'malay',
  'indonesian',
  'metal',
  'alternative',
] as const;

type LiveCatalogCache = {
  updatedAt: number;
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
};

type TaggedTrack = Track & { __liveGenre?: string };

const normalize = (value?: string) => (value || '').trim().toLowerCase();
const keyForTrack = (track: Track) => `${normalize(track.title)}::${normalize(track.artist)}`;
const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

const stripPreviewAudio = (track: TaggedTrack): TaggedTrack => {
  const audio = normalize(track.audioUrl);
  const previewOnly =
    track.source === 'SPOTIFY' ||
    audio.includes('/audiopreview') ||
    audio.includes('itunes-assets/audiopreview');

  return previewOnly ? { ...track, audioUrl: undefined } : { ...track };
};

const uniqueTracks = (input: TaggedTrack[]): TaggedTrack[] => {
  const seen = new Set<string>();
  const result: TaggedTrack[] = [];
  for (const raw of input) {
    if (!raw?.title || !raw?.artist) continue;
    const track = stripPreviewAudio(raw);
    const key = keyForTrack(track);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(track);
  }
  return result;
};

const deriveArtists = (tracks: TaggedTrack[]): Artist[] => {
  const artists = new Map<string, Artist>();

  for (const track of tracks) {
    const primaryArtist = track.artist.split(',')[0]?.trim() || track.artist;
    const id = `live_artist_${slug(primaryArtist) || 'artist'}`;
    const genre = track.__liveGenre || (track.source === 'YOUTUBE' ? 'Trending' : 'Live');
    const existing = artists.get(id);

    if (!existing) {
      artists.set(id, {
        id,
        name: primaryArtist,
        followersCount: Math.max(0, track.playsCount || 0),
        source: track.source,
        artworkKey: track.placeholderArtworkKey || 'live-artist',
        artworkUrl: track.artworkUrl,
        genres: [genre],
      });
    } else {
      const genres = new Set([...(existing.genres || []), genre]);
      existing.genres = Array.from(genres);
      if (!existing.artworkUrl && track.artworkUrl) existing.artworkUrl = track.artworkUrl;
      existing.followersCount = Math.max(existing.followersCount || 0, track.playsCount || 0);
    }
  }

  return Array.from(artists.values()).slice(0, 36);
};

const deriveAlbums = (tracks: TaggedTrack[]): Album[] => {
  const albums = new Map<string, Album>();

  for (const track of tracks) {
    const albumName = track.album || `${track.title} — Single`;
    const primaryArtist = track.artist.split(',')[0]?.trim() || track.artist;
    const id = `live_album_${slug(`${primaryArtist}-${albumName}`) || track.id}`;
    const artistId = `live_artist_${slug(primaryArtist) || 'artist'}`;
    const existing = albums.get(id);

    if (!existing) {
      albums.set(id, {
        id,
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
      existing.tracks = [...(existing.tracks || []), track];
      existing.tracksCount = existing.tracks.length;
      if (!existing.artworkUrl && track.artworkUrl) existing.artworkUrl = track.artworkUrl;
    }
  }

  return Array.from(albums.values()).slice(0, 30);
};

const makePlaylist = (id: string, title: string, description: string, tracks: Track[]): Playlist | null => {
  if (!tracks.length) return null;
  return {
    id,
    title,
    description,
    artworkKey: tracks[0].placeholderArtworkKey || 'live-playlist',
    artworkUrl: tracks[0].artworkUrl,
    trackCount: tracks.length,
    createdBy: 'Sona Live Catalog',
    source: tracks.some((track) => track.source === 'SPOTIFY') ? 'SPOTIFY' : 'YOUTUBE',
    tracks,
  };
};

const derivePlaylists = (tracks: TaggedTrack[]): Playlist[] => {
  const spotify = tracks.filter((track) => track.source === 'SPOTIFY');
  const youtube = tracks.filter((track) => track.source === 'YOUTUBE');
  const malaysia = tracks.filter((track) => ['malay', 'indonesian'].includes(normalize(track.__liveGenre)));
  const energetic = tracks.filter((track) => ['edm', 'electronic', 'rock', 'metal', 'alternative'].includes(normalize(track.__liveGenre)));

  return [
    makePlaylist('live_spotify_fresh', 'Spotify Fresh', 'Live Spotify discoveries refreshed automatically.', spotify.slice(0, 14)),
    makePlaylist('live_youtube_now', 'YouTube Now', 'Current YouTube music discoveries available for full playback.', youtube.slice(0, 14)),
    makePlaylist('live_malaysia_now', 'Malaysia & Nusantara', 'Live Malay and Indonesian discoveries.', malaysia.slice(0, 14)),
    makePlaylist('live_energy_mix', 'Live Energy Mix', 'Fresh electronic, rock and high-energy discoveries.', energetic.slice(0, 14)),
  ].filter((playlist): playlist is Playlist => Boolean(playlist));
};

const applyCatalog = (catalog: LiveCatalogCache) => {
  // Legacy UI imports these arrays from mockData. Treat them only as mutable
  // containers and replace their contents completely with live data.
  DEMO_TRACKS.splice(0, DEMO_TRACKS.length, ...catalog.tracks);
  DEMO_ARTISTS.splice(0, DEMO_ARTISTS.length, ...catalog.artists);
  DEMO_ALBUMS.splice(0, DEMO_ALBUMS.length, ...catalog.albums);
  DEMO_PLAYLISTS.splice(0, DEMO_PLAYLISTS.length, ...catalog.playlists);
};

const readCache = (): LiveCatalogCache | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LiveCatalogCache;
    if (!parsed?.updatedAt || !Array.isArray(parsed.tracks)) return null;
    if (Date.now() - parsed.updatedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (catalog: LiveCatalogCache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(catalog));
  } catch {
    // Live data still works without cache.
  }
};

const unavailableTrack = (): Track => ({
  id: 'live_catalog_unavailable',
  title: 'Live catalog unavailable',
  artist: 'Check Spotify / YouTube connection',
  album: 'Online Catalog',
  durationSeconds: 0,
  placeholderArtworkKey: 'live-unavailable',
  source: 'YOUTUBE',
  playbackCapability: {
    mode: 'EXTERNAL_PLAYER',
    supportsOffline: false,
    supportsLyrics: false,
    streamBitrateKbps: 0,
    notice: 'No live catalog data is currently available.',
  },
});

/**
 * Hydrate every browse surface from Spotify + YouTube before React mounts.
 * Bundled demo rows are never rendered after this bootstrap runs.
 */
export async function hydrateLiveCatalog(): Promise<void> {
  const cached = readCache();
  if (cached?.tracks?.length) {
    applyCatalog(cached);
    return;
  }

  // Clear bundled demo content immediately, including playlists.
  DEMO_TRACKS.splice(0, DEMO_TRACKS.length);
  DEMO_ARTISTS.splice(0, DEMO_ARTISTS.length);
  DEMO_ALBUMS.splice(0, DEMO_ALBUMS.length);
  DEMO_PLAYLISTS.splice(0, DEMO_PLAYLISTS.length);

  const spotifyRequests = GENRE_QUERIES.map(async (genre) => {
    const result = await searchSpotifyTracks(`${genre} new music`, 4);
    return result.tracks.map((track) => ({ ...track, __liveGenre: genre } as TaggedTrack));
  });

  const year = new Date().getFullYear();
  const youtubeRequests = [
    `new music ${year} official audio`,
    `trending music ${year} official video`,
    `Malaysia new music ${year}`,
  ].map(async (query) => {
    const result = await searchYouTubeVideos(query, 8);
    return result.tracks.map((track) => ({
      ...track,
      __liveGenre: query.includes('Malaysia') ? 'malay' : 'Trending',
    } as TaggedTrack));
  });

  const settled = await Promise.allSettled([...spotifyRequests, ...youtubeRequests]);
  const collected: TaggedTrack[] = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') collected.push(...result.value);
  }

  const tracks = uniqueTracks(collected).slice(0, MAX_TRACKS);
  if (!tracks.length) {
    applyCatalog({
      updatedAt: Date.now(),
      tracks: [unavailableTrack()],
      artists: [],
      albums: [],
      playlists: [],
    });
    return;
  }

  const catalog: LiveCatalogCache = {
    updatedAt: Date.now(),
    tracks,
    artists: deriveArtists(tracks),
    albums: deriveAlbums(tracks),
    playlists: derivePlaylists(tracks),
  };

  writeCache(catalog);
  applyCatalog(catalog);
}

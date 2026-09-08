import { DEMO_ALBUMS, DEMO_ARTISTS, DEMO_PLAYLISTS, DEMO_TRACKS } from '../data/mockData';
import { searchSpotifyTracks } from './spotifyService';
import { searchYouTubeVideos } from './youtubeService';
import type { Album, Artist, Playlist, Track } from '../types';

const CACHE_KEY = 'cyberpulse_live_catalog_v4';
const CACHE_TTL_MS = 20 * 60 * 1000;
const MAX_TRACKS = 72;

// These labels mirror the onboarding choices exactly. They are only discovery
// queries/tags; bundled mock artists are never used as the displayed catalog.
const GENRE_QUERIES = [
  'Synthwave',
  'Cyberpunk',
  'Electronic',
  'Pop',
  'Hip Hop',
  'Rock',
  'R&B',
  'Lo-Fi',
  'EDM',
  'K-Pop',
  'Malay',
  'Indonesian',
  'Metal',
  'Alternative',
  'Ambient',
  'Dance',
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

const readDeletedPlaylistIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem('sona_deleted_playlist_ids');
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
};

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
    const genre = track.__liveGenre || 'Trending';
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
      existing.genres = Array.from(new Set([...(existing.genres || []), genre]));
      if (!existing.artworkUrl && track.artworkUrl) existing.artworkUrl = track.artworkUrl;
      existing.followersCount = Math.max(existing.followersCount || 0, track.playsCount || 0);
    }
  }

  return Array.from(artists.values()).slice(0, 48);
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

  return Array.from(albums.values()).slice(0, 36);
};

const makePlaylist = (
  id: string,
  title: string,
  description: string,
  tracks: Track[]
): Playlist | null => {
  if (!tracks.length) return null;
  return {
    id,
    title,
    description,
    artworkKey: tracks[0].placeholderArtworkKey || 'live-playlist',
    artworkUrl: tracks[0].artworkUrl,
    trackCount: tracks.length,
    createdBy: 'Sona Live Catalog',
    source: tracks[0].source,
    tracks,
  };
};

const derivePlaylists = (tracks: TaggedTrack[]): Playlist[] => {
  const fresh = tracks.slice(0, 16);
  const videoReady = tracks.filter((track) => Boolean(track.youtubeVideoId)).slice(0, 16);
  const malaysia = tracks.filter((track) => ['malay', 'indonesian'].includes(normalize(track.__liveGenre))).slice(0, 16);
  const energetic = tracks
    .filter((track) => ['edm', 'electronic', 'rock', 'metal', 'alternative', 'dance'].includes(normalize(track.__liveGenre)))
    .slice(0, 16);

  return [
    makePlaylist('live_sona_fresh', 'Sona Fresh', 'Fresh discoveries refreshed automatically.', fresh),
    makePlaylist('live_sona_video_picks', 'Sona Video Picks', 'Fresh tracks with full video playback available.', videoReady),
    makePlaylist('live_malaysia_now', 'Malaysia & Nusantara', 'Fresh Malay and Indonesian discoveries.', malaysia),
    makePlaylist('live_energy_mix', 'Live Energy Mix', 'Fresh electronic, rock and high-energy discoveries.', energetic),
  ].filter((playlist): playlist is Playlist => Boolean(playlist));
};

const cleanPersistedLibrary = () => {
  try {
    const raw = localStorage.getItem('sona_custom_playlists');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    const deleted = readDeletedPlaylistIds();
    const keep = parsed.filter((playlist: any) => {
      const id = String(playlist?.id || '');
      if (!id || deleted.has(id)) return false;
      // Live catalog rows are regenerated from the live source every bootstrap.
      // Only imported/user-created playlists should persist in local storage.
      return !id.startsWith('live_');
    });

    localStorage.setItem('sona_custom_playlists', JSON.stringify(keep));
  } catch {
    // Best effort only.
  }
};

const applyCatalog = (catalog: LiveCatalogCache) => {
  const deleted = readDeletedPlaylistIds();
  const visiblePlaylists = catalog.playlists.filter((playlist) => !deleted.has(String(playlist.id)));

  // Legacy UI imports these arrays from mockData. They are now only mutable
  // compatibility containers; their bundled contents are completely replaced.
  DEMO_TRACKS.splice(0, DEMO_TRACKS.length, ...catalog.tracks);
  DEMO_ARTISTS.splice(0, DEMO_ARTISTS.length, ...catalog.artists);
  DEMO_ALBUMS.splice(0, DEMO_ALBUMS.length, ...catalog.albums);
  DEMO_PLAYLISTS.splice(0, DEMO_PLAYLISTS.length, ...visiblePlaylists);
  cleanPersistedLibrary();
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
  artist: 'Check online music connection',
  album: 'Online Catalog',
  durationSeconds: 0,
  placeholderArtworkKey: 'live-unavailable',
  source: 'OTHER',
  playbackCapability: {
    mode: 'UNAVAILABLE',
    supportsOffline: false,
    supportsLyrics: false,
    streamBitrateKbps: 0,
    notice: 'No live catalog data is currently available.',
  },
});

/** Hydrate every browse surface from live online data before React mounts. */
export async function hydrateLiveCatalog(): Promise<void> {
  const cached = readCache();
  if (cached?.tracks?.length) {
    applyCatalog(cached);
    return;
  }

  // Clear bundled demo content immediately. Nothing bundled is rendered.
  DEMO_TRACKS.splice(0, DEMO_TRACKS.length);
  DEMO_ARTISTS.splice(0, DEMO_ARTISTS.length);
  DEMO_ALBUMS.splice(0, DEMO_ALBUMS.length);
  DEMO_PLAYLISTS.splice(0, DEMO_PLAYLISTS.length);
  cleanPersistedLibrary();

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
      __liveGenre: query.includes('Malaysia') ? 'Malay' : 'Trending',
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

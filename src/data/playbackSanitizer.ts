import { DEMO_PLAYLISTS, DEMO_TRACKS } from './mockData';

/**
 * Playback / migration safety layer.
 * - Removes legacy Apple/iTunes preview audio.
 * - Removes bundled demo playlists that older builds accidentally persisted.
 * - Keeps user/imported playlists, while pruning unplayable legacy Spotify rows.
 * - Applies playlist deletion tombstones before React initializes Library state.
 */
const isPreviewOnlyAudio = (url?: string): boolean => {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return (
    normalized.includes('itunes.apple.com/itunes-assets/audiopreview') ||
    normalized.includes('/audiopreview')
  );
};

// Capture the bundled playlist IDs before liveCatalogService replaces the arrays.
const bundledPlaylistIds = new Set(DEMO_PLAYLISTS.map((playlist) => String(playlist.id)));

for (const track of DEMO_TRACKS) {
  if (!isPreviewOnlyAudio(track.audioUrl)) continue;

  track.audioUrl = undefined;
  if (track.youtubeVideoId) track.source = 'YOUTUBE';

  if (track.playbackCapability) {
    track.playbackCapability = {
      ...track.playbackCapability,
      supportsOffline: false,
      notice: 'Spotify metadata/artwork with full-length YouTube playback.',
    };
  }
}

if (typeof window !== 'undefined') {
  try {
    const deletedRaw = window.localStorage.getItem('sona_deleted_playlist_ids');
    const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
    if (Array.isArray(deletedIds) && deletedIds.length) {
      const deleted = new Set(deletedIds.map(String));
      const keep = DEMO_PLAYLISTS.filter((playlist) => !deleted.has(String(playlist.id)));
      DEMO_PLAYLISTS.splice(0, DEMO_PLAYLISTS.length, ...keep);
    }
  } catch (error) {
    console.warn('Unable to apply deleted playlist list.', error);
  }

  try {
    const raw = window.localStorage.getItem('sona_custom_playlists');
    if (raw) {
      const playlists = JSON.parse(raw);
      if (Array.isArray(playlists)) {
        let changed = false;

        const migrated = playlists
          // Older builds persisted DEMO_PLAYLISTS together with real user data.
          // Remove those bundled rows permanently; live catalog playlists are rebuilt online.
          .filter((playlist: any) => {
            const isBundledDemo = playlist?.id && bundledPlaylistIds.has(String(playlist.id));
            if (isBundledDemo) changed = true;
            return !isBundledDemo;
          })
          .map((playlist: any) => {
            if (!playlist || !Array.isArray(playlist.tracks)) return playlist;

            let tracks = playlist.tracks.map((track: any) => ({
              ...track,
              audioUrl: isPreviewOnlyAudio(track?.audioUrl) ? undefined : track?.audioUrl,
            }));

            if (playlist.source === 'SPOTIFY') {
              tracks = tracks.filter((track: any) => Boolean(track?.youtubeVideoId));
            }

            if (tracks.length !== playlist.tracks.length) changed = true;
            return {
              ...playlist,
              tracks,
              trackCount: tracks.length,
            };
          });

        if (changed) {
          window.localStorage.setItem('sona_custom_playlists', JSON.stringify(migrated));
        }
      }
    }
  } catch (error) {
    console.warn('Unable to migrate older playlist cache.', error);
  }
}

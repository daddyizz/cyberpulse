import { DEMO_TRACKS } from './mockData';

/**
 * Playback safety layer.
 * - Removes legacy Apple/iTunes 30–60 second previews from the seed catalog.
 * - Cleans previously saved Spotify imports so tracks without a verified YouTube
 *   full-playback ID are not offered as playable songs.
 */
const isPreviewOnlyAudio = (url?: string): boolean => {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return (
    normalized.includes('itunes.apple.com/itunes-assets/audiopreview') ||
    normalized.includes('/audiopreview')
  );
};

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

// One-time compatible migration for Spotify playlists imported by older builds.
// Do not keep items that only have Spotify metadata/preview data but no verified
// YouTube video ID, because those tracks cause fake progress, dead Audio/Video
// switching, or an unrelated fallback song.
if (typeof window !== 'undefined') {
  try {
    const raw = window.localStorage.getItem('sona_custom_playlists');
    if (raw) {
      const playlists = JSON.parse(raw);
      if (Array.isArray(playlists)) {
        let changed = false;
        const migrated = playlists.map((playlist: any) => {
          if (!playlist || playlist.source !== 'SPOTIFY' || !Array.isArray(playlist.tracks)) {
            return playlist;
          }

          const tracks = playlist.tracks
            .map((track: any) => ({
              ...track,
              audioUrl: isPreviewOnlyAudio(track?.audioUrl) ? undefined : track?.audioUrl,
            }))
            .filter((track: any) => Boolean(track?.youtubeVideoId));

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
    console.warn('Unable to migrate older Spotify playlist cache.', error);
  }
}

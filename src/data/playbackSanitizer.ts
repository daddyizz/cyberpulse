import { DEMO_TRACKS } from './mockData';

/**
 * Normalizes legacy demo tracks before the React tree is evaluated.
 *
 * Older seed data used Apple/iTunes AudioPreview URLs as if they were
 * full-song streams. Those URLs are intentionally short previews, so keeping
 * them in audioUrl makes the player stop after roughly 30–60 seconds.
 *
 * We retain Spotify metadata/artwork and the verified YouTube video id, but
 * remove preview-only audio URLs. The existing player resolver will then use
 * the track's YouTube source for full-length playback instead of a preview.
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

  // These seeded tracks already carry Spotify IDs/artwork. Mark Spotify as
  // the metadata source while full playback falls back to their YouTube ID.
  if (track.spotifyTrackId) {
    track.source = 'SPOTIFY';
  }

  if (track.playbackCapability) {
    track.playbackCapability = {
      ...track.playbackCapability,
      supportsOffline: false,
      notice: 'Spotify metadata/artwork with full-length YouTube playback fallback.',
    };
  }
}

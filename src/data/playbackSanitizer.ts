import { DEMO_TRACKS } from './mockData';

/**
 * Legacy playback safety layer.
 *
 * The original seed batch used Apple/iTunes AudioPreview URLs (30–60s).
 * Those are metadata previews only, never full-song sources. Remove only those
 * preview URLs here. Runtime playback coordination is handled centrally by
 * youtubeContinuity.ts so this file must not pause/seek iframe players itself.
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

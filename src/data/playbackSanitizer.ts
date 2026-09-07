import { DEMO_TRACKS } from './mockData';

/**
 * Legacy playback safety layer.
 *
 * The original seed batch used Apple/iTunes AudioPreview URLs (30-60s).
 * Those are metadata previews only, never full-song sources. Remove them so
 * the existing player uses each track's YouTube ID for full-length playback.
 */
const isPreviewOnlyAudio = (url?: string): boolean => {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return normalized.includes('itunes.apple.com/itunes-assets/audiopreview') || normalized.includes('/audiopreview');
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

// Runtime guard for the legacy seed batch. Only one YouTube iframe is allowed
// to remain audible. When a YouTube player reports PLAYING, pause any other
// YouTube iframe and any HTML audio/video element so two transports cannot
// play the same song at once.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const send = (frame: HTMLIFrameElement, func: string, args: unknown[] = []) => {
    try {
      frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
    } catch {
      // Ignore detached/cross-origin frame timing races.
    }
  };

  const youtubeFrames = () =>
    Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe')).filter((frame) =>
      /youtube(?:-nocookie)?\.com\/embed\//i.test(frame.src || '')
    );

  window.addEventListener('message', (event) => {
    let data: any = event.data;
    try {
      if (typeof data === 'string') data = JSON.parse(data);
    } catch {
      return;
    }

    if (data?.event !== 'onStateChange' || data?.info !== 1) return;

    for (const frame of youtubeFrames()) {
      if (frame.contentWindow !== event.source) send(frame, 'pauseVideo');
    }

    document.querySelectorAll<HTMLMediaElement>('audio,video').forEach((media) => {
      if (!media.paused) media.pause();
    });
  });

  // The audio-only artwork view can leave the real YouTube iframe visually
  // hidden. Forward seekbar changes to every YouTube iframe so seeking works
  // identically in Audio Only and Music Video modes.
  document.addEventListener(
    'input',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== 'range') return;

      const max = Number(target.max || 0);
      const value = Number(target.value);
      if (!Number.isFinite(value) || max < 90) return;

      for (const frame of youtubeFrames()) send(frame, 'seekTo', [value, true]);
    },
    true
  );
}

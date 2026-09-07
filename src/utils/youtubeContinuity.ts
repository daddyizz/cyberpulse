import { DEMO_TRACKS } from '../data/mockData';
import { searchYouTubeVideos } from '../services/youtubeService';

const YT_SELECTOR = 'iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]';
const SINGLETON_ID = 'cyberpulse-youtube-singleton';
const STORAGE_KEY = 'cyberpulse_last_playback';

type PlaybackSnapshot = {
  title: string;
  artist: string;
  videoId: string;
  time: number;
};

let singletonFrame: HTMLIFrameElement | null = null;
let activeVideoId = '';
let currentTime = 0;
let duration = 0;
let playbackState: 'playing' | 'paused' = 'paused';
let lastUiTrackKey = '';
let lastSavedAt = 0;
let mirrorGuard = false;

const nativePostMessage: any = Window.prototype.postMessage;

const extractVideoId = (src?: string | null): string => {
  if (!src) return '';
  return src.match(/\/embed\/([^?&#/]+)/)?.[1] || '';
};

const loadSavedSnapshot = (): PlaybackSnapshot | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.title || !parsed?.artist) return null;
    return {
      title: String(parsed.title),
      artist: String(parsed.artist),
      videoId: String(parsed.videoId || ''),
      time: Number(parsed.time || 0),
    };
  } catch {
    return null;
  }
};

// Restore the last track as the first/current seed, but NEVER autoplay it.
const savedAtBoot = loadSavedSnapshot();
if (savedAtBoot) {
  const index = DEMO_TRACKS.findIndex(
    (track) =>
      track.title.toLowerCase() === savedAtBoot.title.toLowerCase() &&
      track.artist.toLowerCase() === savedAtBoot.artist.toLowerCase()
  );
  if (index > 0) {
    const [savedTrack] = DEMO_TRACKS.splice(index, 1);
    DEMO_TRACKS.unshift(savedTrack);
  }
  activeVideoId = savedAtBoot.videoId;
  currentTime = Math.max(0, savedAtBoot.time || 0);
}

const rawPost = (target: Window | null, payload: unknown) => {
  if (!target) return;
  try {
    mirrorGuard = true;
    nativePostMessage.call(
      target,
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      '*'
    );
  } catch {
    // Ignore cross-origin/window teardown races.
  } finally {
    mirrorGuard = false;
  }
};

const command = (func: string, args: any[] = []) => {
  rawPost(singletonFrame?.contentWindow || null, { event: 'command', func, args });
};

const visibleFrames = () =>
  Array.from(document.querySelectorAll<HTMLIFrameElement>(YT_SELECTOR)).filter(
    (frame) => frame.id !== SINGLETON_ID
  );

const pauseNonCanonicalMedia = () => {
  document.querySelectorAll<HTMLMediaElement>('audio,video').forEach((media) => {
    try {
      media.pause();
    } catch {
      // ignore
    }
  });
};

const persistSnapshot = (title = '', artist = '') => {
  const now = Date.now();
  if (now - lastSavedAt < 900 && !title) return;
  lastSavedAt = now;

  const ui = getUiTrack();
  const finalTitle = title || ui?.title || '';
  const finalArtist = artist || ui?.artist || '';
  if (!finalTitle || !finalArtist) return;

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        title: finalTitle,
        artist: finalArtist,
        videoId: activeVideoId,
        time: Math.floor(currentTime),
      } satisfies PlaybackSnapshot)
    );
  } catch {
    // ignore storage failures
  }
};

const createSingleton = (videoId: string) => {
  if (singletonFrame) return singletonFrame;

  const frame = document.createElement('iframe');
  frame.id = SINGLETON_ID;
  frame.title = 'CyberPulse canonical playback transport';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture';
  // IMPORTANT: no autoplay on app boot / transport creation.
  frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&playsinline=1&autoplay=0&rel=0&origin=${encodeURIComponent(
    window.location.origin
  )}`;
  Object.assign(frame.style, {
    position: 'fixed',
    left: '-10000px',
    top: '-10000px',
    width: '2px',
    height: '2px',
    opacity: '0',
    pointerEvents: 'none',
    border: '0',
  });
  frame.setAttribute('aria-hidden', 'true');
  document.body.appendChild(frame);
  singletonFrame = frame;
  activeVideoId = videoId;

  frame.addEventListener(
    'load',
    () => {
      // Subscribe to player telemetry so React seekbars/visualizer keep moving.
      const listen = () => rawPost(frame.contentWindow, { event: 'listening', id: SINGLETON_ID });
      listen();
      window.setTimeout(listen, 250);
      window.setTimeout(listen, 750);
      window.setTimeout(() => {
        command('unMute');
        if (currentTime > 0) command('seekTo', [currentTime, true]);
        command(playbackState === 'playing' ? 'playVideo' : 'pauseVideo');
      }, 350);
    },
    { once: true }
  );

  return frame;
};

const ensureTransport = (videoId: string) => {
  if (!videoId) return null;
  return singletonFrame || createSingleton(videoId);
};

const loadVideo = (videoId: string, shouldPlay: boolean, startSeconds = 0) => {
  if (!videoId) return;
  pauseNonCanonicalMedia();
  playbackState = shouldPlay ? 'playing' : 'paused';

  if (!singletonFrame) {
    activeVideoId = videoId;
    currentTime = Math.max(0, startSeconds);
    createSingleton(videoId);
    return;
  }

  if (videoId !== activeVideoId) {
    activeVideoId = videoId;
    currentTime = Math.max(0, startSeconds);
    duration = 0;
    command('loadVideoById', [{ videoId, startSeconds: currentTime }]);
  } else if (Math.abs(currentTime - startSeconds) > 2 && startSeconds >= 0) {
    currentTime = startSeconds;
    command('seekTo', [currentTime, true]);
  }

  command('unMute');
  command(shouldPlay ? 'playVideo' : 'pauseVideo');
};

const seek = (seconds: number) => {
  if (!Number.isFinite(seconds)) return;
  currentTime = Math.max(0, seconds);
  command('seekTo', [currentTime, true]);
  syncVisibleRenderers(true);
};

const setPlaying = (playing: boolean) => {
  if (!singletonFrame) return;
  playbackState = playing ? 'playing' : 'paused';
  pauseNonCanonicalMedia();
  command(playing ? 'playVideo' : 'pauseVideo');
  syncVisibleRenderers(true);
};

const toggle = async () => {
  if (!singletonFrame) {
    const ui = getUiTrack();
    if (!ui) return;
    const videoId = await resolveVideoId(ui.title, ui.artist);
    if (!videoId) return;
    loadVideo(videoId, true, currentTime);
    persistSnapshot(ui.title, ui.artist);
    return;
  }
  setPlaying(playbackState !== 'playing');
};

const muteVisibleFrame = (frame: HTMLIFrameElement) => {
  rawPost(frame.contentWindow, { event: 'command', func: 'mute', args: [] });
};

const sanitizeVisibleFrame = (frame: HTMLIFrameElement) => {
  if (frame.id === SINGLETON_ID) return;

  // A visible renderer must never be an audible/autoplay transport.
  if (!frame.dataset.cyberpulseRendererReady) {
    frame.dataset.cyberpulseRendererReady = 'true';
    try {
      const url = new URL(frame.src);
      if (url.searchParams.get('autoplay') !== '0') {
        url.searchParams.set('autoplay', '0');
        frame.src = url.toString();
      }
    } catch {
      // ignore malformed src
    }
  }
  muteVisibleFrame(frame);
};

const syncVisibleRenderers = (forceSeek = false) => {
  for (const frame of visibleFrames()) {
    sanitizeVisibleFrame(frame);
    const visibleId = extractVideoId(frame.src);
    if (activeVideoId && visibleId && visibleId !== activeVideoId) continue;

    if (forceSeek || Math.floor(currentTime) % 3 === 0) {
      rawPost(frame.contentWindow, {
        event: 'command',
        func: 'seekTo',
        args: [currentTime, true],
      });
    }
    rawPost(frame.contentWindow, {
      event: 'command',
      func: playbackState === 'playing' ? 'playVideo' : 'pauseVideo',
      args: [],
    });
    muteVisibleFrame(frame);
  }
};

const getUiTrack = (): { title: string; artist: string } | null => {
  const mediaLabel = Array.from(document.querySelectorAll<HTMLElement>('span')).find(
    (el) => el.textContent?.trim() === 'MEDIA SESSION'
  );
  const widget = mediaLabel?.closest<HTMLElement>('.rounded-3xl');
  const widgetTitle = widget?.querySelector('h4')?.textContent?.trim();
  const widgetArtist = widget?.querySelector('p')?.textContent?.trim();
  if (widgetTitle) return { title: widgetTitle, artist: widgetArtist || '' };

  const youtubeButton = document.querySelector<HTMLButtonElement>(
    'button[title="Play YouTube video version"]'
  );
  const mini = youtubeButton?.closest<HTMLElement>('.absolute');
  if (mini) {
    const text = (mini.textContent || '').toLowerCase();
    const demo = DEMO_TRACKS.find((track) => text.includes(track.title.toLowerCase()));
    if (demo) return { title: demo.title, artist: demo.artist };
  }

  // Full-player heading fallback.
  const closeButton = document.querySelector<HTMLButtonElement>(
    'button[title^="Close Player"]'
  );
  const modal = closeButton?.closest<HTMLElement>('.absolute.inset-0');
  if (modal) {
    const text = (modal.textContent || '').toLowerCase();
    const demo = DEMO_TRACKS.find((track) => text.includes(track.title.toLowerCase()));
    if (demo) return { title: demo.title, artist: demo.artist };
  }

  return null;
};

const resolveVideoId = async (title: string, artist: string): Promise<string> => {
  const demo = DEMO_TRACKS.find(
    (track) =>
      track.title.toLowerCase() === title.toLowerCase() &&
      track.artist.toLowerCase() === artist.toLowerCase()
  );
  if (demo?.youtubeVideoId) return demo.youtubeVideoId;

  try {
    const result = await searchYouTubeVideos(`${title} ${artist}`, 1);
    return result.tracks[0]?.youtubeVideoId || '';
  } catch {
    return '';
  }
};

const uiWantsPlaying = () =>
  Boolean(
    document.querySelector<HTMLButtonElement>('button[title="Pause"]') ||
      document.querySelector<HTMLButtonElement>('button[title="Pause track"]')
  );

const syncTrackFromUi = async () => {
  const ui = getUiTrack();
  if (!ui) return;
  const key = `${ui.title}::${ui.artist}`.toLowerCase();
  if (key === lastUiTrackKey) return;
  lastUiTrackKey = key;

  // Initial render is deliberately paused. Only a user-driven React state
  // transition to Pause means playback should begin.
  const shouldPlay = uiWantsPlaying();
  persistSnapshot(ui.title, ui.artist);
  if (!shouldPlay) return;

  const videoId = await resolveVideoId(ui.title, ui.artist);
  if (!videoId) return;
  loadVideo(videoId, true, 0);
};

// Mirror React's full-player commands into the canonical singleton, but do NOT
// let the visible iframe become a second audio transport.
Window.prototype.postMessage = function patchedPostMessage(
  message: any,
  targetOriginOrOptions?: string | WindowPostMessageOptions,
  transfer?: Transferable[]
) {
  if (!mirrorGuard) {
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      if (data?.event === 'command' && typeof data.func === 'string') {
        const func = data.func as string;
        const args = Array.isArray(data.args) ? data.args : [];
        const visible = visibleFrames().find((frame) => this === frame.contentWindow);

        if (visible) {
          const id = extractVideoId(visible.src);
          if (id && !singletonFrame) {
            activeVideoId = id;
            createSingleton(id);
          }
          if (func === 'seekTo' && typeof args[0] === 'number') seek(args[0]);
          else if (func === 'playVideo') setPlaying(true);
          else if (func === 'pauseVideo') setPlaying(false);
          else command(func, args);

          // Keep renderer muted. Swallow play/pause/seek command so only our
          // explicit muted renderer sync can operate it.
          muteVisibleFrame(visible);
          if (func === 'playVideo' || func === 'pauseVideo' || func === 'seekTo') return;
        }
      }
    } catch {
      // pass non-YouTube messages through
    }
  }

  return nativePostMessage.call(this, message, targetOriginOrOptions as any, transfer as any);
} as typeof Window.prototype.postMessage;

window.addEventListener(
  'message',
  (event) => {
    if (!singletonFrame || event.source !== singletonFrame.contentWindow || !event.data) return;
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data?.event === 'infoDelivery' && data?.info) {
        if (typeof data.info.currentTime === 'number') currentTime = data.info.currentTime;
        if (typeof data.info.duration === 'number') duration = data.info.duration;
        syncVisibleRenderers(false);
        persistSnapshot();
      }
      if (data?.event === 'onStateChange') {
        if (data.info === 1) playbackState = 'playing';
        if (data.info === 2 || data.info === 0) playbackState = 'paused';
        pauseNonCanonicalMedia();
        syncVisibleRenderers(true);
      }
    } catch {
      // ignore unrelated traffic
    }
  },
  true
);

// Mini/full/widget controls: canonical transport follows the user action,
// while React still updates all visual surfaces from the same click.
document.addEventListener(
  'click',
  (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button');
    if (!button) return;
    const title = (button.getAttribute('title') || '').toLowerCase();

    if (title === 'play' || title === 'pause') {
      window.setTimeout(() => void toggle(), 0);
      return;
    }

    if (
      title.includes('previous track') ||
      title.includes('next track') ||
      title.includes('play youtube video version')
    ) {
      window.setTimeout(() => {
        lastUiTrackKey = '';
        void syncTrackFromUi();
      }, 80);
      return;
    }

    if (
      title.startsWith('close player') ||
      title.includes('minimize') ||
      button.textContent?.includes('Return to App') ||
      button.textContent?.includes('Tap to open app')
    ) {
      // Navigation must not touch the canonical transport.
      window.setTimeout(() => syncVisibleRenderers(true), 80);
    }
  },
  true
);

// Make the simulated widget progress area seek the same canonical transport.
const enhanceWidgetSeek = () => {
  const mediaLabel = Array.from(document.querySelectorAll<HTMLElement>('span')).find(
    (el) => el.textContent?.trim() === 'MEDIA SESSION'
  );
  const card = mediaLabel?.closest<HTMLElement>('.rounded-3xl');
  if (!card || card.dataset.cyberSeekReady === 'true') return;

  const progressSection = Array.from(card.querySelectorAll<HTMLElement>('div')).find((el) =>
    /\d+:\d+/.test(el.textContent || '')
  );
  if (!progressSection) return;

  card.dataset.cyberSeekReady = 'true';
  progressSection.style.position = 'relative';
  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0';
  range.max = String(duration || 600);
  range.step = '1';
  range.value = String(currentTime);
  range.setAttribute('aria-label', 'Seek background playback');
  Object.assign(range.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    opacity: '0',
    cursor: 'pointer',
    zIndex: '20',
  });
  range.addEventListener('input', () => seek(Number(range.value)));
  progressSection.appendChild(range);
};

const scan = () => {
  visibleFrames().forEach(sanitizeVisibleFrame);
  void syncTrackFromUi();
  enhanceWidgetSeek();
};

const observer = new MutationObserver(scan);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['src', 'title'],
});

// No autoplay here. This only prepares UI/renderers and last-track metadata.
scan();
window.setInterval(() => {
  visibleFrames().forEach(sanitizeVisibleFrame);
  enhanceWidgetSeek();
}, 750);

window.addEventListener('cyberpulse:playback-toggle', () => void toggle());
window.addEventListener(
  'cyberpulse:seek',
  ((event: Event) => {
    const detail = (event as CustomEvent<number>).detail;
    if (typeof detail === 'number') seek(detail);
  }) as EventListener
);
window.addEventListener('cyberpulse:resume-sync', () => syncVisibleRenderers(true));

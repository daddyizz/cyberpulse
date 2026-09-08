import { DEMO_TRACKS } from '../data/mockData';
import { searchYouTubeVideos } from '../services/youtubeService';
import type { Track } from '../types';

const YT_SELECTOR = 'iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]';
const SPOTIFY_SELECTOR = 'iframe[src*="open.spotify.com/embed"]';
const SINGLETON_ID = 'cyberpulse-youtube-singleton';
const STORAGE_KEY = 'cyberpulse_last_playback_v2';
const CANONICAL_MARKER = '__cyberpulseCanonical';

type PlaybackSnapshot = {
  id?: string;
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
  placeholderArtworkKey?: string;
  durationSeconds?: number;
  videoId: string;
  time: number;
};

type UiTrack = {
  title: string;
  artist: string;
  artworkUrl?: string;
  durationSeconds?: number;
};

let singletonFrame: HTMLIFrameElement | null = null;
let activeVideoId = '';
let activeTrackKey = '';
let currentTime = 0;
let duration = 0;
let requestedPlaying = false;
let confirmedPlaying = false;
let lastTickMs = performance.now();
let lastUiKey = '';
let lastSavedAt = 0;
let resolveGeneration = 0;

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();
const trackKey = (title: string, artist: string) => `${normalize(title)}::${normalize(artist)}`;

const extractVideoId = (src?: string | null): string => {
  if (!src) return '';
  return src.match(/\/embed\/([^?&#/]+)/)?.[1] || '';
};

const parseClock = (value?: string | null): number => {
  if (!value) return 0;
  const parts = value.trim().split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part))) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

const loadSnapshot = (): PlaybackSnapshot | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.title || !parsed?.artist) return null;
    return {
      id: parsed.id ? String(parsed.id) : undefined,
      title: String(parsed.title),
      artist: String(parsed.artist),
      album: parsed.album ? String(parsed.album) : undefined,
      artworkUrl: parsed.artworkUrl ? String(parsed.artworkUrl) : undefined,
      placeholderArtworkKey: parsed.placeholderArtworkKey
        ? String(parsed.placeholderArtworkKey)
        : undefined,
      durationSeconds: Number(parsed.durationSeconds || 0) || undefined,
      videoId: String(parsed.videoId || ''),
      time: Math.max(0, Number(parsed.time || 0)),
    };
  } catch {
    return null;
  }
};

// Restore the last track into CyberPulse's initial seed, but never restore a
// playing state. Opening the app must always be silent until the user presses Play.
const savedAtBoot = loadSnapshot();
if (savedAtBoot) {
  const savedKey = trackKey(savedAtBoot.title, savedAtBoot.artist);
  const existingIndex = DEMO_TRACKS.findIndex(
    (track) => trackKey(track.title, track.artist) === savedKey
  );

  if (existingIndex > 0) {
    const [savedTrack] = DEMO_TRACKS.splice(existingIndex, 1);
    DEMO_TRACKS.unshift(savedTrack);
  } else if (existingIndex < 0 && savedAtBoot.videoId) {
    const restoredTrack: Track = {
      id: savedAtBoot.id || `restored_${Date.now()}`,
      title: savedAtBoot.title,
      artist: savedAtBoot.artist,
      album: savedAtBoot.album || 'Last Played',
      placeholderArtworkKey: savedAtBoot.placeholderArtworkKey || 'last-played-track',
      artworkUrl: savedAtBoot.artworkUrl,
      durationSeconds: savedAtBoot.durationSeconds || 240,
      youtubeVideoId: savedAtBoot.videoId,
      source: 'YOUTUBE',
    };
    DEMO_TRACKS.unshift(restoredTrack);
  }

  activeTrackKey = savedKey;
  activeVideoId = savedAtBoot.videoId;
  currentTime = savedAtBoot.time;
  duration = savedAtBoot.durationSeconds || 0;
}

const rawPost = (frame: HTMLIFrameElement | null, payload: unknown) => {
  try {
    frame?.contentWindow?.postMessage(
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      '*'
    );
  } catch {
    // Cross-origin iframe teardown/load races are harmless here.
  }
};

const sendCommand = (frame: HTMLIFrameElement | null, func: string, args: any[] = []) => {
  rawPost(frame, { event: 'command', func, args });
};

const command = (func: string, args: any[] = []) => sendCommand(singletonFrame, func, args);

const visibleYouTubeFrames = () =>
  Array.from(document.querySelectorAll<HTMLIFrameElement>(YT_SELECTOR)).filter(
    (frame) => frame.id !== SINGLETON_ID
  );

const isVisibleYouTubeSource = (source: MessageEventSource | null) =>
  visibleYouTubeFrames().some((frame) => frame.contentWindow === source);

const pauseHtmlMedia = () => {
  document.querySelectorAll<HTMLMediaElement>('audio,video').forEach((media) => {
    try {
      if (!media.paused) media.pause();
    } catch {
      // ignore
    }
  });
};

// React's full-player iframe originally contains autoplay=1. Rewrite only the
// visible YouTube renderer before it is attached so it can never become a
// second audible player. The hidden singleton is excluded by id.
const patchIframeSrcSetter = () => {
  const globalKey = '__cyberpulseIframeSrcPatched';
  if ((window as any)[globalKey]) return;

  const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
  if (!descriptor?.get || !descriptor?.set || descriptor.configurable === false) return;

  Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set(value: string) {
      const frame = this as HTMLIFrameElement;
      let next = String(value || '');
      if (frame.id !== SINGLETON_ID && /youtube(?:-nocookie)?\.com\/embed\//i.test(next)) {
        try {
          const url = new URL(next, window.location.href);
          url.searchParams.set('autoplay', '0');
          url.searchParams.set('mute', '1');
          next = url.toString();
        } catch {
          // keep original value
        }
      }
      descriptor.set!.call(frame, next);
    },
  });

  (window as any)[globalKey] = true;
};

patchIframeSrcSetter();

const emitCanonicalTime = () => {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: {
        [CANONICAL_MARKER]: true,
        event: 'infoDelivery',
        info: {
          currentTime: Math.max(0, currentTime),
          duration: duration || undefined,
        },
      },
    })
  );
};

const emitCanonicalState = (state: 0 | 1 | 2) => {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: {
        [CANONICAL_MARKER]: true,
        event: 'onStateChange',
        info: state,
      },
    })
  );
};

const listenToSingleton = () => {
  if (!singletonFrame) return;
  rawPost(singletonFrame, { event: 'listening', id: SINGLETON_ID });
};

const createSingleton = (videoId: string, startSeconds: number) => {
  if (singletonFrame) return singletonFrame;

  const frame = document.createElement('iframe');
  frame.id = SINGLETON_ID;
  frame.title = 'Sona canonical playback transport';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture';
  frame.setAttribute('aria-hidden', 'true');
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
  frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&playsinline=1&autoplay=0&rel=0&vq=medium&suggestedQuality=medium&origin=${encodeURIComponent(
    window.location.origin
  )}`;
  document.body.appendChild(frame);

  singletonFrame = frame;
  activeVideoId = videoId;
  currentTime = Math.max(0, startSeconds);
  lastTickMs = performance.now();

  frame.addEventListener(
    'load',
    () => {
      const prepare = () => {
        listenToSingleton();
        command('setPlaybackQuality', ['medium']);
        command('setPlaybackQualityRange', ['small', 'medium']);
        command('unMute');
        if (currentTime > 0) command('seekTo', [currentTime, true]);
        command(requestedPlaying ? 'playVideo' : 'pauseVideo');
      };
      window.setTimeout(prepare, 120);
      window.setTimeout(prepare, 400);
      window.setTimeout(prepare, 900);
    },
    { once: true }
  );

  return frame;
};

const loadCanonicalVideo = (videoId: string, startSeconds: number, play: boolean) => {
  if (!videoId) return;

  pauseHtmlMedia();
  requestedPlaying = play;
  confirmedPlaying = play;
  currentTime = Math.max(0, startSeconds);
  lastTickMs = performance.now();

  if (!singletonFrame) {
    createSingleton(videoId, currentTime);
  } else if (videoId !== activeVideoId) {
    activeVideoId = videoId;
    duration = 0;
    command('loadVideoById', [videoId, currentTime]);
    window.setTimeout(() => {
      command('setPlaybackQuality', ['medium']);
      command('setPlaybackQualityRange', ['small', 'medium']);
      command('unMute');
      command(play ? 'playVideo' : 'pauseVideo');
    }, 120);
  } else {
    if (currentTime > 0) command('seekTo', [currentTime, true]);
    command(play ? 'playVideo' : 'pauseVideo');
  }

  emitCanonicalState(play ? 1 : 2);
  emitCanonicalTime();
  syncVisibleRenderers(true);
};

const setCanonicalPlaying = (playing: boolean) => {
  requestedPlaying = playing;
  confirmedPlaying = playing;
  lastTickMs = performance.now();
  if (playing) pauseHtmlMedia();
  if (singletonFrame) command(playing ? 'playVideo' : 'pauseVideo');
  emitCanonicalState(playing ? 1 : 2);
  syncVisibleRenderers(false);
};

const seekCanonical = (seconds: number) => {
  if (!Number.isFinite(seconds)) return;
  currentTime = Math.max(0, duration ? Math.min(seconds, duration) : seconds);
  lastTickMs = performance.now();
  if (singletonFrame) command('seekTo', [currentTime, true]);
  emitCanonicalTime();
  syncVisibleRenderers(true);
};

const sanitizeRenderer = (frame: HTMLIFrameElement) => {
  if (frame.id === SINGLETON_ID) return;
  sendCommand(frame, 'mute');
  // Never allow a visible renderer to become the audio owner.
  window.setTimeout(() => sendCommand(frame, 'mute'), 80);
  window.setTimeout(() => sendCommand(frame, 'mute'), 300);
};

const syncVisibleRenderer = (frame: HTMLIFrameElement, forceSeek: boolean) => {
  sanitizeRenderer(frame);
  const id = extractVideoId(frame.src);
  if (activeVideoId && id && id !== activeVideoId) {
    sendCommand(frame, 'pauseVideo');
    return;
  }

  if (forceSeek) sendCommand(frame, 'seekTo', [currentTime, true]);
  sendCommand(frame, requestedPlaying ? 'playVideo' : 'pauseVideo');
  sendCommand(frame, 'mute');
};

const syncVisibleRenderers = (forceSeek: boolean) => {
  visibleYouTubeFrames().forEach((frame) => syncVisibleRenderer(frame, forceSeek));
};

const getWidgetTrack = (): UiTrack | null => {
  const mediaLabel = Array.from(document.querySelectorAll<HTMLElement>('span')).find(
    (el) => el.textContent?.trim() === 'MEDIA SESSION'
  );
  const card = mediaLabel?.closest<HTMLElement>('.rounded-3xl');
  if (!card) return null;

  const title = card.querySelector('h4')?.textContent?.trim() || '';
  const artist = card.querySelector('p')?.textContent?.trim() || '';
  if (!title) return null;

  const clocks = Array.from(card.querySelectorAll<HTMLElement>('span')).filter((el) =>
    /^\d+:\d{2}$/.test(el.textContent?.trim() || '')
  );
  const widgetDuration = clocks.length > 1 ? parseClock(clocks[clocks.length - 1].textContent) : 0;
  const artworkUrl = card.querySelector<HTMLImageElement>('img')?.src;
  return { title, artist, artworkUrl, durationSeconds: widgetDuration || undefined };
};

const getMiniTrack = (): UiTrack | null => {
  const button = document.querySelector<HTMLButtonElement>(
    'button[title="Play YouTube video version"]'
  );
  const root = button?.closest<HTMLElement>('div.absolute.bottom-20');
  if (!root) return null;

  const info = root.children.item(1) as HTMLElement | null;
  const title = info?.children.item(0)?.textContent?.trim() || '';
  const artist = info?.querySelector('span')?.textContent?.trim() || '';
  if (!title) return null;

  const artworkUrl = root.querySelector<HTMLImageElement>('img')?.src;
  return { title, artist, artworkUrl };
};

const getUiTrack = (): UiTrack | null => getWidgetTrack() || getMiniTrack();

const readPlaybackIntent = (): boolean | null => {
  const pauseButton = document.querySelector<HTMLButtonElement>('button[title="Pause"]');
  if (pauseButton) return true;
  const playButton = document.querySelector<HTMLButtonElement>('button[title="Play"]');
  if (playButton) return false;
  return null;
};

const findDemoTrack = (ui: UiTrack) => {
  const key = trackKey(ui.title, ui.artist);
  return DEMO_TRACKS.find((track) => trackKey(track.title, track.artist) === key);
};

const resolveVideoId = async (ui: UiTrack): Promise<string> => {
  const demo = findDemoTrack(ui);
  if (demo?.youtubeVideoId) return demo.youtubeVideoId;

  // If a full player renderer already exists for this UI track, its id is the
  // exact id React resolved and is preferable to another network lookup.
  const renderedId = visibleYouTubeFrames()
    .map((frame) => extractVideoId(frame.src))
    .find(Boolean);
  if (renderedId && renderedId !== '4NRXx6U8ABQ') return renderedId;

  try {
    const result = await searchYouTubeVideos(`${ui.title} ${ui.artist}`, 1);
    return result.tracks[0]?.youtubeVideoId || '';
  } catch {
    return '';
  }
};

const persistSnapshot = (ui?: UiTrack | null) => {
  const now = Date.now();
  if (!ui) ui = getUiTrack();
  if (!ui?.title || !ui.artist) return;
  if (now - lastSavedAt < 800) return;
  lastSavedAt = now;

  const demo = findDemoTrack(ui);
  const snapshot: PlaybackSnapshot = {
    id: demo?.id,
    title: ui.title,
    artist: ui.artist,
    album: demo?.album,
    artworkUrl: ui.artworkUrl || demo?.artworkUrl,
    placeholderArtworkKey: demo?.placeholderArtworkKey,
    durationSeconds: duration || ui.durationSeconds || demo?.durationSeconds,
    videoId: activeVideoId || demo?.youtubeVideoId || '',
    time: Math.floor(currentTime),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // storage can fail in private/sandboxed contexts; playback still works
  }
};

const syncFromUi = async () => {
  const ui = getUiTrack();
  const intent = readPlaybackIntent();
  if (!ui) return;

  const key = trackKey(ui.title, ui.artist);
  const trackChanged = key !== lastUiKey;
  if (trackChanged) lastUiKey = key;

  persistSnapshot(ui);

  if (intent === null) return;

  if (trackChanged || (!singletonFrame && intent)) {
    if (!intent) {
      // A paused selection should update the remembered song without creating
      // any player or producing sound.
      activeTrackKey = key;
      return;
    }

    const generation = ++resolveGeneration;
    const videoId = await resolveVideoId(ui);
    if (generation !== resolveGeneration || !videoId) return;

    const isSameRestoredTrack = key === activeTrackKey && activeVideoId === videoId;
    const startAt = isSameRestoredTrack ? currentTime : 0;
    activeTrackKey = key;
    loadCanonicalVideo(videoId, startAt, true);
    persistSnapshot(ui);
    return;
  }

  if (singletonFrame && intent !== requestedPlaying) {
    setCanonicalPlaying(intent);
  }
};

const enhanceWidgetSeek = () => {
  const mediaLabel = Array.from(document.querySelectorAll<HTMLElement>('span')).find(
    (el) => el.textContent?.trim() === 'MEDIA SESSION'
  );
  const card = mediaLabel?.closest<HTMLElement>('.rounded-3xl');
  if (!card) return;

  const clockSpans = Array.from(card.querySelectorAll<HTMLElement>('span')).filter((el) =>
    /^\d+:\d{2}$/.test(el.textContent?.trim() || '')
  );
  if (clockSpans.length < 2) return;

  const progressSection = clockSpans[0].parentElement?.parentElement as HTMLElement | null;
  if (!progressSection) return;
  progressSection.style.position = 'relative';

  let range = progressSection.querySelector<HTMLInputElement>('input[data-cyber-widget-seek="true"]');
  if (!range) {
    range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.step = '1';
    range.dataset.cyberWidgetSeek = 'true';
    range.setAttribute('aria-label', 'Seek background playback');
    Object.assign(range.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '24px',
      opacity: '0',
      cursor: 'pointer',
      zIndex: '30',
    });
    range.addEventListener('pointerdown', (event) => event.stopPropagation());
    range.addEventListener('click', (event) => event.stopPropagation());
    range.addEventListener('input', () => seekCanonical(Number(range!.value)));
    progressSection.appendChild(range);
  }

  const uiDuration = parseClock(clockSpans[clockSpans.length - 1].textContent);
  range.max = String(duration || uiDuration || 600);
  range.value = String(Math.min(Number(range.max), Math.max(0, currentTime)));
};

// Block stale/muted renderer telemetry before CyberPulseApp's generic message
// listener sees it. Only canonical synthetic messages are allowed to drive
// React seekSeconds/isPlaying/visualizer state.
window.addEventListener(
  'message',
  (event) => {
    let data: any = event.data;
    try {
      if (typeof data === 'string') data = JSON.parse(data);
    } catch {
      data = null;
    }

    if (data?.[CANONICAL_MARKER]) return;

    if (singletonFrame && event.source === singletonFrame.contentWindow) {
      event.stopImmediatePropagation();
      if (data?.event === 'infoDelivery' && data?.info) {
        if (typeof data.info.currentTime === 'number') currentTime = Math.max(0, data.info.currentTime);
        if (typeof data.info.duration === 'number') duration = Math.max(0, data.info.duration);
        lastTickMs = performance.now();
        emitCanonicalTime();
        persistSnapshot();
      }
      if (data?.event === 'onStateChange') {
        if (data.info === 1) {
          confirmedPlaying = true;
          requestedPlaying = true;
          lastTickMs = performance.now();
          emitCanonicalState(1);
        } else if (data.info === 0) {
          confirmedPlaying = false;
          requestedPlaying = false;
          emitCanonicalState(0);
        } else if (data.info === 2 && !requestedPlaying) {
          confirmedPlaying = false;
          emitCanonicalState(2);
        }
      }
      return;
    }

    if (isVisibleYouTubeSource(event.source)) {
      event.stopImmediatePropagation();
    }
  },
  true
);

const observer = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of Array.from(record.addedNodes)) {
      if (!(node instanceof HTMLElement)) continue;
      const frames: HTMLIFrameElement[] = [];
      if (node.matches?.(YT_SELECTOR)) frames.push(node as HTMLIFrameElement);
      node.querySelectorAll?.<HTMLIFrameElement>(YT_SELECTOR).forEach((frame) => frames.push(frame));
      frames
        .filter((frame) => frame.id !== SINGLETON_ID)
        .forEach((frame) => {
          sanitizeRenderer(frame);
          window.setTimeout(() => syncVisibleRenderer(frame, true), 180);
          window.setTimeout(() => syncVisibleRenderer(frame, true), 550);
        });
    }
  }
  window.setTimeout(() => void syncFromUi(), 0);
});

observer.observe(document.documentElement, { childList: true, subtree: true });

// Seek actions in Full Player / Lyrics / other app sliders all point to the
// same canonical transport. Ignore tiny settings sliders by requiring max >= 60.
document.addEventListener(
  'input',
  (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== 'range') return;
    if (target.dataset.cyberWidgetSeek === 'true') return;
    const max = Number(target.max || 0);
    const value = Number(target.value);
    if (!Number.isFinite(value) || max < 60) return;
    seekCanonical(value);
  },
  true
);

// A click changes React state first; rescan on the next task so mini/full/widget
// buttons all control exactly the same transport without duplicate handlers.
document.addEventListener(
  'click',
  (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button');
    const label = button?.textContent?.trim() || '';
    const title = button?.getAttribute('title') || '';

    if (label === 'Audio Only' || label === 'Music Video') {
      window.setTimeout(() => syncVisibleRenderers(true), 80);
    }

    if (
      title.startsWith('Close Player') ||
      title.includes('Minimize') ||
      label.includes('Return to App') ||
      label.includes('Tap to open app')
    ) {
      // Navigation never pauses, seeks or reloads the canonical player.
      window.setTimeout(() => {
        emitCanonicalState(requestedPlaying ? 1 : 2);
        emitCanonicalTime();
      }, 40);
    }

    window.setTimeout(() => void syncFromUi(), 0);
    window.setTimeout(() => void syncFromUi(), 120);
  },
  true
);

// Canonical clock: telemetry from YouTube is preferred, but this monotonic
// fallback guarantees every seekbar and the visualizer continue moving even
// when the embedded player delays infoDelivery events.
window.setInterval(() => {
  const now = performance.now();
  if (requestedPlaying) {
    const delta = Math.max(0, Math.min(1, (now - lastTickMs) / 1000));
    currentTime += delta;
    if (duration > 0) currentTime = Math.min(currentTime, duration);
    pauseHtmlMedia();
  }
  lastTickMs = now;

  listenToSingleton();
  emitCanonicalTime();
  enhanceWidgetSeek();
  persistSnapshot();
}, 250);

window.setInterval(() => {
  void syncFromUi();
  syncVisibleRenderers(false);
}, 180);

// Let the initial saved position appear in every UI, but remain paused.
window.setTimeout(() => {
  emitCanonicalState(2);
  emitCanonicalTime();
}, 700);

// Keep Spotify embeds from becoming an accidental auto source. They remain
// interactive when explicitly opened, but no CyberPulse control targets them.
document.querySelectorAll<HTMLIFrameElement>(SPOTIFY_SELECTOR).forEach((frame) => {
  frame.setAttribute('data-cyberpulse-external-player', 'true');
});

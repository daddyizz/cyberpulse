import { DEMO_TRACKS } from '../data/mockData';

const YT_SELECTOR = 'iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]';
const SINGLETON_ID = 'cyberpulse-youtube-singleton';

let singletonFrame: HTMLIFrameElement | null = null;
let activeVideoId = '';
let currentTime = 0;
let duration = 0;
let playbackState: 'playing' | 'paused' = 'paused';
let mirrorGuard = false;
let lastRenderedTrackKey = '';

const extractVideoId = (src?: string | null): string => {
  if (!src) return '';
  const match = src.match(/\/embed\/([^?&#/]+)/);
  return match?.[1] || '';
};

const nativePostMessage = Window.prototype.postMessage;

const rawPost = (target: Window | null, payload: unknown) => {
  if (!target) return;
  try {
    mirrorGuard = true;
    nativePostMessage.call(target, typeof payload === 'string' ? payload : JSON.stringify(payload), '*');
  } catch {
    // Ignore transient cross-origin/window teardown races.
  } finally {
    mirrorGuard = false;
  }
};

const command = (func: string, args: any[] = []) => {
  rawPost(singletonFrame?.contentWindow || null, {
    event: 'command',
    func,
    args,
  });
};

const createSingleton = (videoId: string) => {
  if (singletonFrame) return singletonFrame;

  const frame = document.createElement('iframe');
  frame.id = SINGLETON_ID;
  frame.title = 'CyberPulse persistent audio transport';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture';
  frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&playsinline=1&autoplay=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`;
  frame.style.position = 'fixed';
  frame.style.left = '-10000px';
  frame.style.top = '-10000px';
  frame.style.width = '2px';
  frame.style.height = '2px';
  frame.style.opacity = '0';
  frame.style.pointerEvents = 'none';
  frame.setAttribute('aria-hidden', 'true');
  document.body.appendChild(frame);

  singletonFrame = frame;
  activeVideoId = videoId;

  frame.addEventListener(
    'load',
    () => {
      window.setTimeout(() => {
        command('unMute');
        if (currentTime > 0) command('seekTo', [currentTime, true]);
        command(playbackState === 'playing' ? 'playVideo' : 'pauseVideo');
      }, 250);
    },
    { once: true }
  );

  return frame;
};

const switchVideo = (videoId: string, shouldPlay = true) => {
  if (!videoId) return;

  if (!singletonFrame) {
    currentTime = 0;
    playbackState = shouldPlay ? 'playing' : 'paused';
    createSingleton(videoId);
    return;
  }

  if (videoId === activeVideoId) {
    command('unMute');
    command(playbackState === 'playing' ? 'playVideo' : 'pauseVideo');
    return;
  }

  activeVideoId = videoId;
  currentTime = 0;
  duration = 0;
  playbackState = shouldPlay ? 'playing' : 'paused';
  command('loadVideoById', [{ videoId, startSeconds: 0 }]);
  window.setTimeout(() => {
    command('unMute');
    command(shouldPlay ? 'playVideo' : 'pauseVideo');
  }, 80);
};

const seek = (seconds: number) => {
  if (!Number.isFinite(seconds)) return;
  currentTime = Math.max(0, seconds);
  command('seekTo', [currentTime, true]);
};

const toggle = () => {
  if (!singletonFrame) return;
  if (playbackState === 'playing') {
    playbackState = 'paused';
    command('pauseVideo');
  } else {
    playbackState = 'playing';
    if (currentTime > 0) command('seekTo', [currentTime, true]);
    command('playVideo');
  }
};

const visibleFrames = () =>
  Array.from(document.querySelectorAll<HTMLIFrameElement>(YT_SELECTOR)).filter(
    (frame) => frame.id !== SINGLETON_ID
  );

const syncVisibleFrame = (frame: HTMLIFrameElement) => {
  const id = extractVideoId(frame.src);
  if (!id) return;

  if (!activeVideoId) {
    switchVideo(id, true);
  } else if (id !== activeVideoId) {
    switchVideo(id, true);
  }

  const apply = () => {
    rawPost(frame.contentWindow, { event: 'command', func: 'mute', args: [] });
    rawPost(frame.contentWindow, {
      event: 'command',
      func: 'seekTo',
      args: [currentTime, true],
    });
    rawPost(frame.contentWindow, {
      event: 'command',
      func: playbackState === 'playing' ? 'playVideo' : 'pauseVideo',
      args: [],
    });
  };

  window.setTimeout(apply, 120);
  window.setTimeout(apply, 450);
};

// Mirror commands sent by the React full player into the one persistent
// transport. Visible YouTube iframes are muted renderers only.
Window.prototype.postMessage = function patchedPostMessage(
  message: any,
  targetOriginOrOptions?: string | WindowPostMessageOptions,
  transfer?: Transferable[]
) {
  if (!mirrorGuard && singletonFrame && this !== singletonFrame.contentWindow) {
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      if (data?.event === 'command' && typeof data.func === 'string') {
        const func = data.func as string;
        const args = Array.isArray(data.args) ? data.args : [];
        if (func === 'seekTo' && typeof args[0] === 'number') currentTime = args[0];
        if (func === 'playVideo') playbackState = 'playing';
        if (func === 'pauseVideo') playbackState = 'paused';
        command(func, args);
      }
    } catch {
      // Non-YouTube postMessage; pass through untouched.
    }
  }

  return nativePostMessage.call(this, message, targetOriginOrOptions as any, transfer as any);
} as typeof Window.prototype.postMessage;

// This listener is installed before CyberPulseApp. Ignore state/time messages
// from stale visible renderers, allowing the singleton alone to drive React's
// isPlaying + seekSeconds values on mini, full, and widget surfaces.
window.addEventListener(
  'message',
  (event) => {
    if (!event.data) return;

    const sourceIsSingleton = !!singletonFrame && event.source === singletonFrame.contentWindow;
    const sourceIsVisible = visibleFrames().some((frame) => event.source === frame.contentWindow);

    if (sourceIsVisible && !sourceIsSingleton) {
      event.stopImmediatePropagation();
      return;
    }

    if (!sourceIsSingleton) return;

    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data?.event === 'infoDelivery' && data?.info) {
        if (typeof data.info.currentTime === 'number') currentTime = data.info.currentTime;
        if (typeof data.info.duration === 'number') duration = data.info.duration;
      }
      if (data?.event === 'onStateChange') {
        if (data.info === 1) playbackState = 'playing';
        if (data.info === 2 || data.info === 0) playbackState = 'paused';
      }
    } catch {
      // Ignore unrelated traffic.
    }
  },
  true
);

const matchDemoTrack = (title: string, artist: string) => {
  const t = title.trim().toLowerCase();
  const a = artist.trim().toLowerCase();
  return DEMO_TRACKS.find((track) => {
    const tt = track.title.toLowerCase();
    const aa = track.artist.toLowerCase();
    return (tt === t || t.includes(tt) || tt.includes(t)) && (!a || aa === a || a.includes(aa) || aa.includes(a));
  });
};

const renderedTrack = (): { title: string; artist: string } | null => {
  const mediaLabel = Array.from(document.querySelectorAll<HTMLElement>('span')).find(
    (el) => el.textContent?.trim() === 'MEDIA SESSION'
  );
  const widget = mediaLabel?.closest<HTMLElement>('.rounded-3xl');
  const widgetTitle = widget?.querySelector('h4')?.textContent?.trim();
  const widgetArtist = widget?.querySelector('p')?.textContent?.trim();
  if (widgetTitle) return { title: widgetTitle, artist: widgetArtist || '' };

  const ytButton = document.querySelector<HTMLButtonElement>('button[title="Play YouTube video version"]');
  const mini = ytButton?.parentElement;
  if (mini) {
    const allText = mini.textContent?.toLowerCase() || '';
    const track = DEMO_TRACKS.find((candidate) => allText.includes(candidate.title.toLowerCase()));
    if (track) return { title: track.title, artist: track.artist };
  }

  return null;
};

const syncFromUi = () => {
  const frame = visibleFrames()[0];
  if (frame) {
    syncVisibleFrame(frame);
    return;
  }

  const rendered = renderedTrack();
  if (!rendered) return;
  const key = `${rendered.title}::${rendered.artist}`.toLowerCase();
  if (key === lastRenderedTrackKey) return;
  lastRenderedTrackKey = key;

  const track = matchDemoTrack(rendered.title, rendered.artist);
  if (track?.youtubeVideoId && track.youtubeVideoId !== activeVideoId) {
    switchVideo(track.youtubeVideoId, true);
  }
};

const enhanceBackgroundSeek = () => {
  const mediaLabel = Array.from(document.querySelectorAll<HTMLElement>('span')).find(
    (el) => el.textContent?.trim() === 'MEDIA SESSION'
  );
  const card = mediaLabel?.closest<HTMLElement>('.rounded-3xl');
  if (!card) return;

  const existing = card.querySelector<HTMLInputElement>('input[data-cyberpulse-seek="true"]');
  if (existing) {
    existing.max = String(duration || Number(existing.max) || 240);
    existing.value = String(Math.min(Number(existing.max), currentTime));
    return;
  }

  const progressRoot = Array.from(card.querySelectorAll<HTMLElement>('div')).find((el) => {
    const spans = el.querySelectorAll('span');
    return spans.length >= 2 && /\d+:\d+/.test(el.textContent || '');
  });
  if (!progressRoot) return;

  const labels = Array.from(progressRoot.querySelectorAll('span'));
  const end = labels.at(-1)?.textContent?.trim() || '4:00';
  const parts = end.split(':').map(Number);
  const displayedDuration = parts.length === 2 ? parts[0] * 60 + parts[1] : 240;

  progressRoot.style.position = 'relative';
  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0';
  range.max = String(duration || displayedDuration || 240);
  range.step = '1';
  range.value = String(Math.min(Number(range.max), currentTime));
  range.dataset.cyberpulseSeek = 'true';
  range.setAttribute('aria-label', 'Seek CyberPulse playback');
  Object.assign(range.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '22px',
    opacity: '0',
    cursor: 'pointer',
    zIndex: '20',
  });
  range.addEventListener('input', () => seek(Number(range.value)));
  progressRoot.appendChild(range);
};

const observer = new MutationObserver((records) => {
  for (const record of records) {
    if (record.type === 'attributes' && record.target instanceof HTMLIFrameElement) {
      if (record.target.id !== SINGLETON_ID && record.target.matches(YT_SELECTOR)) syncVisibleFrame(record.target);
    }

    for (const node of Array.from(record.addedNodes)) {
      if (!(node instanceof HTMLElement)) continue;
      const frames = [
        ...(node.matches?.(YT_SELECTOR) ? [node as HTMLIFrameElement] : []),
        ...Array.from(node.querySelectorAll?.<HTMLIFrameElement>(YT_SELECTOR) || []),
      ].filter((frame) => frame.id !== SINGLETON_ID);
      frames.forEach(syncVisibleFrame);
    }
  }

  syncFromUi();
  enhanceBackgroundSeek();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['src'],
});

document.addEventListener(
  'click',
  (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('button');
    if (!button) return;

    const title = button.getAttribute('title') || '';
    const hasVisibleFrame = visibleFrames().length > 0;

    // Mini/background controls have no React iframe ref. Drive singleton there.
    if (!hasVisibleFrame && (title === 'Play' || title === 'Pause')) toggle();

    if (title === 'Previous track' || title === 'Previous Track' || title === 'Next track' || title === 'Next Track') {
      window.setTimeout(syncFromUi, 0);
      window.setTimeout(syncFromUi, 120);
    }

    if (button.textContent?.includes('Return to App') || button.textContent?.includes('Tap to open app')) {
      window.setTimeout(syncFromUi, 0);
    }
  },
  true
);

window.addEventListener('cyberpulse:playback-toggle', toggle);
window.addEventListener(
  'cyberpulse:seek',
  ((event: Event) => {
    const value = (event as CustomEvent<number>).detail;
    if (typeof value === 'number') seek(value);
  }) as EventListener
);
window.addEventListener('cyberpulse:resume-sync', syncFromUi);

window.setInterval(() => {
  syncFromUi();
  enhanceBackgroundSeek();

  // Visible iframe is video-only. Keep it muted so audio can never double.
  const frame = visibleFrames()[0];
  if (frame) rawPost(frame.contentWindow, { event: 'command', func: 'mute', args: [] });
}, 750);

import { searchYouTubeVideos } from '../services/youtubeService';

const PLAYER_ID = 'sona-canonical-youtube-player';
const FALLBACK_ID = '4NRXx6U8ABQ';
const MARKER = '__sonaCanonicalPlayback';
const YT_SELECTOR = 'iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]';

type UiTrack = {
  title: string;
  artist: string;
  duration?: number;
};

let frame: HTMLIFrameElement | null = null;
let activeKey = '';
let activeVideoId = '';
let playing = false;
let currentTime = 0;
let duration = 0;
let generation = 0;
let lastTelemetryAt = 0;
let lastTickAt = performance.now();
let recentSeekUntil = 0;

const normalize = (value?: string) =>
  (value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const keyFor = (title: string, artist: string) => `${normalize(title)}::${normalize(artist)}`;

const extractVideoId = (src?: string | null) => src?.match(/\/embed\/([^?&#/]+)/)?.[1] || '';

const post = (target: HTMLIFrameElement | null, func: string, args: unknown[] = []) => {
  try {
    target?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  } catch {}
};

const fullModal = () =>
  document.querySelector<HTMLButtonElement>('button[title^="Close Player"]')?.closest<HTMLElement>('div.absolute.inset-0') || null;

const widgetRoot = () => {
  const label = Array.from(document.querySelectorAll<HTMLElement>('span')).find((node) =>
    /sona background playback/i.test(node.textContent || '')
  );
  return label?.closest<HTMLElement>('.rounded-3xl') || null;
};

const getUiTrack = (): UiTrack | null => {
  const modal = fullModal();
  if (modal) {
    const titleNode = Array.from(modal.querySelectorAll<HTMLElement>('div')).find((el) =>
      el.classList.contains('text-lg') && el.classList.contains('font-black') && el.classList.contains('uppercase')
    );
    const title = titleNode?.textContent?.trim() || '';
    const artist = titleNode?.parentElement?.children.item(1)?.textContent?.trim() || '';
    const range = Array.from(modal.querySelectorAll<HTMLInputElement>('input[type="range"]')).find(
      (input) => Number(input.max || 0) >= 60
    );
    if (title && artist) return { title, artist, duration: Number(range?.max || 0) || undefined };
  }

  const mini = document.querySelector<HTMLElement>('.sona-mini-player');
  if (mini) {
    const title = mini.querySelector<HTMLElement>('.sona-mini-title')?.textContent?.trim() || '';
    const artist = mini.querySelector<HTMLElement>('.sona-mini-artist')?.textContent?.trim() || '';
    if (title && artist) return { title, artist };
  }

  const widget = widgetRoot();
  if (widget) {
    const title = widget.querySelector('h4')?.textContent?.trim() || '';
    const artist = widget.querySelector('p')?.textContent?.trim() || '';
    const clocks = Array.from(widget.querySelectorAll<HTMLElement>('span')).filter((node) => /^\d+:\d{2}$/.test(node.textContent?.trim() || ''));
    const end = clocks[clocks.length - 1]?.textContent?.trim() || '';
    const parts = end.split(':').map(Number);
    const widgetDuration = parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
    if (title && artist) return { title, artist, duration: widgetDuration || undefined };
  }

  return null;
};

const readIntent = () => {
  const scope = fullModal() || document.querySelector<HTMLElement>('.sona-mini-player') || widgetRoot();
  if (!scope) return playing;
  if (scope.querySelector('button[title="Pause"]')) return true;
  if (scope.querySelector('button[title="Play"]')) return false;
  return playing;
};

const emitState = (state: 0 | 1 | 2) => {
  window.dispatchEvent(new MessageEvent('message', {
    data: { [MARKER]: true, event: 'onStateChange', info: state },
  }));
};

const emitTime = () => {
  window.dispatchEvent(new MessageEvent('message', {
    data: {
      [MARKER]: true,
      event: 'infoDelivery',
      info: { currentTime: Math.max(0, currentTime), duration: duration || undefined },
    },
  }));
};

const pauseHtmlMedia = () => {
  document.querySelectorAll<HTMLMediaElement>('audio,video').forEach((media) => {
    try { if (!media.paused) media.pause(); } catch {}
  });
};

const createPlayer = (videoId: string) => {
  if (frame) return frame;
  const next = document.createElement('iframe');
  next.id = PLAYER_ID;
  next.title = 'Sona playback transport';
  next.allow = 'autoplay; encrypted-media; picture-in-picture';
  next.setAttribute('aria-hidden', 'true');
  Object.assign(next.style, {
    position: 'fixed',
    left: '-10000px',
    top: '-10000px',
    width: '2px',
    height: '2px',
    opacity: '0',
    pointerEvents: 'none',
    border: '0',
  });
  next.src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&playsinline=1&autoplay=0&rel=0&origin=${encodeURIComponent(window.location.origin)}`;
  document.body.appendChild(next);
  frame = next;

  next.addEventListener('load', () => {
    const prepare = () => {
      try {
        next.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: PLAYER_ID }), '*');
      } catch {}
      post(next, 'unMute');
      if (currentTime > 0) post(next, 'seekTo', [currentTime, true]);
      post(next, playing ? 'playVideo' : 'pauseVideo');
    };
    setTimeout(prepare, 120);
    setTimeout(prepare, 420);
    setTimeout(prepare, 900);
  }, { once: true });

  return next;
};

const loadVideo = (videoId: string, autoplay: boolean) => {
  if (!videoId) return;
  pauseHtmlMedia();
  playing = autoplay;
  lastTickAt = performance.now();

  if (!frame) {
    activeVideoId = videoId;
    createPlayer(videoId);
  } else if (videoId !== activeVideoId) {
    activeVideoId = videoId;
    currentTime = 0;
    duration = 0;
    post(frame, 'loadVideoById', [videoId, 0]);
    setTimeout(() => {
      post(frame, 'unMute');
      post(frame, autoplay ? 'playVideo' : 'pauseVideo');
    }, 140);
  } else {
    post(frame, 'unMute');
    post(frame, autoplay ? 'playVideo' : 'pauseVideo');
  }

  emitState(autoplay ? 1 : 2);
  emitTime();
  syncVisibleRenderers(true);
};

const scoreCandidate = (ui: UiTrack, candidate: any) => {
  const title = normalize(ui.title);
  const artist = normalize(ui.artist.split(',')[0] || ui.artist);
  const cTitle = normalize(candidate.title);
  const cArtist = normalize(candidate.artist);
  let score = 0;
  if (cTitle.includes(title)) score += 8;
  if (title.includes(cTitle)) score += 2;
  if (cTitle.includes(artist) || cArtist.includes(artist)) score += 6;
  if (/official|audio|topic|vevo/.test(`${cTitle} ${cArtist}`)) score += 2;
  if (ui.duration && candidate.durationSeconds) {
    const diff = Math.abs(ui.duration - candidate.durationSeconds);
    if (diff <= 4) score += 5;
    else if (diff <= 10) score += 3;
    else if (diff > 45) score -= 5;
  }
  return score;
};

const lookupStoredVideoId = (ui: UiTrack) => {
  try {
    const raw = localStorage.getItem('sona_custom_playlists');
    const playlists = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(playlists)) return '';
    const key = keyFor(ui.title, ui.artist);
    for (const playlist of playlists) {
      for (const track of Array.isArray(playlist?.tracks) ? playlist.tracks : []) {
        if (keyFor(track?.title || '', track?.artist || '') === key && track?.youtubeVideoId) {
          return String(track.youtubeVideoId);
        }
      }
    }
  } catch {}
  return '';
};

const resolveVideoId = async (ui: UiTrack) => {
  const stored = lookupStoredVideoId(ui);
  if (stored) return stored;

  const visibleId = Array.from(document.querySelectorAll<HTMLIFrameElement>(YT_SELECTOR))
    .filter((candidate) => candidate.id !== PLAYER_ID)
    .map((candidate) => extractVideoId(candidate.src))
    .find((id) => id && (id !== FALLBACK_ID || /blinding lights/i.test(ui.title)));
  if (visibleId) return visibleId;

  const queries = [
    `${ui.title} ${ui.artist} official audio`,
    `${ui.title} ${ui.artist} official video`,
    `${ui.title} ${ui.artist}`,
  ];

  for (const query of queries) {
    try {
      const result = await searchYouTubeVideos(query, 6);
      const ranked = [...result.tracks]
        .filter((track) => Boolean(track.youtubeVideoId))
        .sort((a, b) => scoreCandidate(ui, b) - scoreCandidate(ui, a));
      if (ranked[0] && scoreCandidate(ui, ranked[0]) >= 6) return ranked[0].youtubeVideoId || '';
    } catch {}
  }
  return '';
};

const safeVisibleSrc = (videoId: string) =>
  `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&playsinline=1&autoplay=0&mute=1&origin=${encodeURIComponent(window.location.origin)}`;

const syncVisibleRenderers = (forceSeek = false) => {
  document.querySelectorAll<HTMLIFrameElement>(YT_SELECTOR).forEach((candidate) => {
    if (candidate.id === PLAYER_ID) return;
    const id = extractVideoId(candidate.src);

    // Never allow the historical hard-coded fallback to display for another song.
    if (id === FALLBACK_ID && activeVideoId !== FALLBACK_ID) {
      if (activeVideoId) candidate.src = safeVisibleSrc(activeVideoId);
      else candidate.src = 'about:blank';
      return;
    }

    if (activeVideoId && id !== activeVideoId) {
      candidate.src = safeVisibleSrc(activeVideoId);
      return;
    }

    post(candidate, 'mute');
    if (forceSeek) post(candidate, 'seekTo', [currentTime, true]);
    post(candidate, playing ? 'playVideo' : 'pauseVideo');
  });
};

const reconcileTrack = async () => {
  const ui = getUiTrack();
  if (!ui?.title || !ui.artist) return;
  if (ui.duration) duration = ui.duration;

  const nextKey = keyFor(ui.title, ui.artist);
  const intent = readIntent();

  if (nextKey !== activeKey) {
    activeKey = nextKey;
    currentTime = 0;
    duration = ui.duration || 0;
    playing = intent;
    generation += 1;
    const mine = generation;

    if (frame) post(frame, 'pauseVideo');
    activeVideoId = '';
    emitState(playing ? 1 : 2);
    emitTime();
    syncVisibleRenderers(true);

    const resolved = await resolveVideoId(ui);
    if (mine !== generation) return;
    if (!resolved) {
      playing = false;
      emitState(2);
      return;
    }
    loadVideo(resolved, intent);
    return;
  }

  if (intent !== playing) {
    playing = intent;
    lastTickAt = performance.now();
    if (frame) post(frame, playing ? 'playVideo' : 'pauseVideo');
    emitState(playing ? 1 : 2);
  }

  syncVisibleRenderers(false);
};

window.addEventListener('message', (event) => {
  let data: any = event.data;
  try { if (typeof data === 'string') data = JSON.parse(data); } catch { return; }
  if (data?.[MARKER]) return;

  if (frame && event.source === frame.contentWindow) {
    event.stopImmediatePropagation();
    if (data?.event === 'infoDelivery' && data.info) {
      const incoming = Number(data.info.currentTime);
      if (Number.isFinite(incoming)) {
        const allowBackward = Date.now() < recentSeekUntil;
        if (allowBackward || incoming >= currentTime - 0.75) currentTime = Math.max(0, incoming);
      }
      const incomingDuration = Number(data.info.duration);
      if (Number.isFinite(incomingDuration) && incomingDuration > 0) duration = incomingDuration;
      lastTelemetryAt = performance.now();
      lastTickAt = performance.now();
      emitTime();
    }
    if (data?.event === 'onStateChange') {
      if (data.info === 1) playing = true;
      else if (data.info === 2 || data.info === 0) playing = false;
      emitState(data.info === 0 ? 0 : playing ? 1 : 2);
    }
    return;
  }

  const isVisible = Array.from(document.querySelectorAll<HTMLIFrameElement>(YT_SELECTOR)).some(
    (candidate) => candidate.id !== PLAYER_ID && candidate.contentWindow === event.source
  );
  if (isVisible) event.stopImmediatePropagation();
}, true);

document.addEventListener('input', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'range') return;
  const max = Number(input.max || 0);
  const value = Number(input.value);
  if (!Number.isFinite(value) || max < 60) return;
  currentTime = Math.max(0, value);
  duration = Math.max(duration, max);
  recentSeekUntil = Date.now() + 1200;
  lastTickAt = performance.now();
  if (frame) post(frame, 'seekTo', [currentTime, true]);
  emitTime();
  syncVisibleRenderers(true);
}, true);

document.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('button');
  if (!button) {
    setTimeout(() => void reconcileTrack(), 0);
    return;
  }

  const title = button.getAttribute('title') || '';
  const label = button.textContent?.trim() || '';

  if (title === 'Play') {
    playing = true;
    if (frame) post(frame, 'playVideo');
    emitState(1);
  } else if (title === 'Pause') {
    playing = false;
    if (frame) post(frame, 'pauseVideo');
    emitState(2);
  }

  if (label === 'Audio Only' || label === 'Music Video') {
    // Presentation switch only. Audio transport and clock never change here.
    setTimeout(() => syncVisibleRenderers(true), 40);
    setTimeout(() => syncVisibleRenderers(true), 180);
  }

  setTimeout(() => void reconcileTrack(), 0);
  setTimeout(() => void reconcileTrack(), 120);
  setTimeout(() => void reconcileTrack(), 360);
}, true);

const observer = new MutationObserver(() => {
  setTimeout(() => void reconcileTrack(), 0);
  setTimeout(() => syncVisibleRenderers(true), 80);
});
observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

setInterval(() => {
  const now = performance.now();
  if (playing && now - lastTelemetryAt > 700) {
    const delta = Math.max(0, Math.min(0.35, (now - lastTickAt) / 1000));
    currentTime += delta;
    if (duration > 0) currentTime = Math.min(currentTime, duration);
    emitTime();
  }
  lastTickAt = now;
  if (frame) {
    try { frame.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: PLAYER_ID }), '*'); } catch {}
  }
}, 250);

setInterval(() => {
  void reconcileTrack();
  syncVisibleRenderers(false);
}, 500);

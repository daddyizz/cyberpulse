import { searchYouTubeVideos } from '../services/youtubeService';

const PLAYER_ID = 'sona-canonical-youtube-player-v2';
const LEGACY_FALLBACK_ID = '4NRXx6U8ABQ';
const MARKER = '__sonaCanonicalPlaybackV2';
const YT_SELECTOR = 'iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]';

type UiTrack = { title: string; artist: string; duration?: number };

let player: HTMLIFrameElement | null = null;
let activeKey = '';
let activeVideoId = '';
let requestedPlaying = false;
let confirmedPlaying = false;
let currentTime = 0;
let duration = 0;
let generation = 0;
let lastTelemetryAt = 0;
let lastTickAt = performance.now();
let recentSeekUntil = 0;
let preparingUntil = 0;

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
  if (!scope) return requestedPlaying;
  if (scope.querySelector('button[title="Pause"]')) return true;
  if (scope.querySelector('button[title="Play"]')) return false;
  return requestedPlaying;
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

const listen = () => {
  try {
    player?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: PLAYER_ID }), '*');
  } catch {}
};

const createPlayer = (videoId: string) => {
  if (player) return player;
  const frame = document.createElement('iframe');
  frame.id = PLAYER_ID;
  frame.title = 'Sona canonical playback';
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
  frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&playsinline=1&autoplay=0&rel=0&origin=${encodeURIComponent(window.location.origin)}`;
  document.body.appendChild(frame);
  player = frame;
  preparingUntil = Date.now() + 1800;

  frame.addEventListener('load', () => {
    const prepare = () => {
      listen();
      post(frame, 'unMute');
      if (currentTime > 0) post(frame, 'seekTo', [currentTime, true]);
      post(frame, requestedPlaying ? 'playVideo' : 'pauseVideo');
    };
    setTimeout(prepare, 80);
    setTimeout(prepare, 260);
    setTimeout(prepare, 650);
    setTimeout(prepare, 1200);
  }, { once: true });

  return frame;
};

const loadResolvedVideo = (videoId: string, autoplay: boolean) => {
  if (!videoId) return;
  pauseHtmlMedia();
  requestedPlaying = autoplay;
  confirmedPlaying = false;
  preparingUntil = Date.now() + 1600;
  lastTickAt = performance.now();

  if (!player) {
    activeVideoId = videoId;
    createPlayer(videoId);
  } else if (videoId !== activeVideoId) {
    activeVideoId = videoId;
    currentTime = 0;
    duration = 0;
    post(player, 'loadVideoById', [videoId, 0]);
    setTimeout(() => {
      post(player, 'unMute');
      post(player, requestedPlaying ? 'playVideo' : 'pauseVideo');
    }, 120);
    setTimeout(() => {
      post(player, 'unMute');
      post(player, requestedPlaying ? 'playVideo' : 'pauseVideo');
    }, 420);
  } else {
    post(player, 'unMute');
    post(player, requestedPlaying ? 'playVideo' : 'pauseVideo');
  }

  emitState(requestedPlaying ? 1 : 2);
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
    .find((id) => id && (id !== LEGACY_FALLBACK_ID || /blinding lights/i.test(ui.title)));
  if (visibleId) return visibleId;

  for (const query of [
    `${ui.title} ${ui.artist} official audio`,
    `${ui.title} ${ui.artist} official video`,
    `${ui.title} ${ui.artist}`,
  ]) {
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

const visibleSrc = (videoId: string) =>
  `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&playsinline=1&autoplay=0&mute=1&origin=${encodeURIComponent(window.location.origin)}`;

const visibleFrames = () =>
  Array.from(document.querySelectorAll<HTMLIFrameElement>(YT_SELECTOR)).filter((candidate) => candidate.id !== PLAYER_ID);

const syncVisibleRenderers = (forceSeek = false) => {
  visibleFrames().forEach((candidate) => {
    const id = extractVideoId(candidate.src);

    if (id === LEGACY_FALLBACK_ID && activeVideoId !== LEGACY_FALLBACK_ID) {
      candidate.src = activeVideoId ? visibleSrc(activeVideoId) : 'about:blank';
      return;
    }
    if (activeVideoId && id !== activeVideoId) {
      candidate.src = visibleSrc(activeVideoId);
      return;
    }

    post(candidate, 'mute');
    if (forceSeek) post(candidate, 'seekTo', [currentTime, true]);
    post(candidate, requestedPlaying ? 'playVideo' : 'pauseVideo');
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
    requestedPlaying = intent;
    confirmedPlaying = false;
    generation += 1;
    const mine = generation;

    if (player) post(player, 'pauseVideo');
    activeVideoId = '';
    emitState(requestedPlaying ? 1 : 2);
    emitTime();
    syncVisibleRenderers(true);

    const resolved = await resolveVideoId(ui);
    if (mine !== generation) return;
    if (!resolved) {
      requestedPlaying = false;
      confirmedPlaying = false;
      emitState(2);
      return;
    }
    loadResolvedVideo(resolved, requestedPlaying);
    return;
  }

  if (intent !== requestedPlaying) {
    requestedPlaying = intent;
    lastTickAt = performance.now();
    if (player) post(player, requestedPlaying ? 'playVideo' : 'pauseVideo');
    emitState(requestedPlaying ? 1 : 2);
  }

  syncVisibleRenderers(false);
};

window.addEventListener('message', (event) => {
  let data: any = event.data;
  try { if (typeof data === 'string') data = JSON.parse(data); } catch { return; }
  if (data?.[MARKER]) return;

  if (player && event.source === player.contentWindow) {
    event.stopImmediatePropagation();

    if (data?.event === 'infoDelivery' && data.info) {
      const incoming = Number(data.info.currentTime);
      if (Number.isFinite(incoming)) {
        const allowBackward = Date.now() < recentSeekUntil || Date.now() < preparingUntil;
        if (allowBackward || incoming >= currentTime - 0.5) currentTime = Math.max(0, incoming);
      }
      const incomingDuration = Number(data.info.duration);
      if (Number.isFinite(incomingDuration) && incomingDuration > 0) duration = incomingDuration;
      lastTelemetryAt = performance.now();
      lastTickAt = performance.now();
      emitTime();
    }

    if (data?.event === 'onStateChange') {
      if (data.info === 1) {
        confirmedPlaying = true;
        emitState(1);
      } else if (data.info === 0) {
        requestedPlaying = false;
        confirmedPlaying = false;
        emitState(0);
      } else if (data.info === 2) {
        confirmedPlaying = false;
        if (requestedPlaying) {
          // Loading/mode switches can emit PAUSED transiently. Do not let that
          // flip the React player to paused; retry the canonical transport.
          if (Date.now() < preparingUntil) {
            setTimeout(() => post(player, 'playVideo'), 80);
            setTimeout(() => post(player, 'playVideo'), 260);
          }
          emitState(1);
        } else {
          emitState(2);
        }
      }
    }
    return;
  }

  if (visibleFrames().some((candidate) => candidate.contentWindow === event.source)) {
    event.stopImmediatePropagation();
  }
}, true);

document.addEventListener('input', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'range') return;
  const max = Number(input.max || 0);
  const value = Number(input.value);
  if (!Number.isFinite(value) || max < 60) return;
  currentTime = Math.max(0, value);
  duration = Math.max(duration, max);
  recentSeekUntil = Date.now() + 1400;
  lastTickAt = performance.now();
  if (player) post(player, 'seekTo', [currentTime, true]);
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
    requestedPlaying = true;
    preparingUntil = Date.now() + 900;
    if (player) post(player, 'playVideo');
    emitState(1);
  } else if (title === 'Pause') {
    requestedPlaying = false;
    if (player) post(player, 'pauseVideo');
    emitState(2);
  }

  if (label === 'Audio Only' || label === 'Music Video') {
    // Mode changes are visual only. Never reload or pause canonical audio.
    setTimeout(() => syncVisibleRenderers(true), 30);
    setTimeout(() => syncVisibleRenderers(true), 150);
    setTimeout(() => syncVisibleRenderers(true), 420);
  }

  setTimeout(() => void reconcileTrack(), 0);
  setTimeout(() => void reconcileTrack(), 120);
  setTimeout(() => void reconcileTrack(), 360);
}, true);

const observer = new MutationObserver(() => {
  setTimeout(() => void reconcileTrack(), 0);
  setTimeout(() => syncVisibleRenderers(true), 60);
});
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['src'],
});

setInterval(() => {
  const now = performance.now();
  if (requestedPlaying && now - lastTelemetryAt > 650) {
    const delta = Math.max(0, Math.min(0.3, (now - lastTickAt) / 1000));
    currentTime += delta;
    if (duration > 0) currentTime = Math.min(currentTime, duration);
    emitTime();
  }
  lastTickAt = now;
  listen();

  if (requestedPlaying && player && !confirmedPlaying && Date.now() < preparingUntil) {
    post(player, 'playVideo');
  }
}, 250);

setInterval(() => {
  void reconcileTrack();
  syncVisibleRenderers(false);
}, 500);

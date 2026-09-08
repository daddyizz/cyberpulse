import { DEMO_TRACKS } from '../data/mockData';

const YT_SELECTOR = 'iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]';
const STORAGE_KEY = 'sona_last_ui_playback_v1';
const CANONICAL_MARKER = '__sonaUiPlaybackRepair';

let playing = false;
let clock = 0;
let duration = 0;
let lastTick = performance.now();
let currentKey = '';
let suppressPauseUntil = 0;

const normalize = (value?: string) => (value || '').trim().toLowerCase();
const keyFor = (title: string, artist: string) => `${normalize(title)}::${normalize(artist)}`;

const post = (frame: HTMLIFrameElement, func: string, args: unknown[] = []) => {
  try {
    frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  } catch {
    // iframe load/teardown race
  }
};

const frames = () => Array.from(document.querySelectorAll<HTMLIFrameElement>(YT_SELECTOR));

const fullModal = () => document.querySelector<HTMLButtonElement>('button[title^="Close Player"]')?.closest<HTMLElement>('div.absolute.inset-0') || null;

const getUiTrack = () => {
  const modal = fullModal();
  if (modal) {
    const titleNode = Array.from(modal.querySelectorAll<HTMLElement>('div')).find((el) =>
      el.classList.contains('text-lg') && el.classList.contains('font-black') && el.classList.contains('uppercase')
    );
    const title = titleNode?.textContent?.trim() || '';
    const artist = titleNode?.parentElement?.children.item(1)?.textContent?.trim() || '';
    const range = Array.from(modal.querySelectorAll<HTMLInputElement>('input[type="range"]')).find((el) => Number(el.max || 0) >= 60);
    if (title) return { title, artist, duration: Number(range?.max || 0) || 0 };
  }

  const mini = document.querySelector<HTMLElement>('.sona-mini-player');
  const miniTitle = mini?.querySelector<HTMLElement>('.sona-mini-title')?.textContent?.trim() || '';
  if (miniTitle) {
    return {
      title: miniTitle,
      artist: mini?.querySelector<HTMLElement>('.sona-mini-artist')?.textContent?.trim() || '',
      duration: 0,
    };
  }

  return null;
};

const readIntent = () => {
  const modal = fullModal();
  const mini = document.querySelector<HTMLElement>('.sona-mini-player');
  const scope = modal || mini;
  if (!scope) return playing;
  if (scope.querySelector('button[title="Pause"]')) return true;
  if (scope.querySelector('button[title="Play"]')) return false;
  return playing;
};

const emit = () => {
  window.dispatchEvent(new MessageEvent('message', {
    data: {
      [CANONICAL_MARKER]: true,
      event: 'infoDelivery',
      info: { currentTime: Math.max(0, clock), duration: duration || undefined },
    },
  }));
};

const persist = () => {
  const ui = getUiTrack();
  if (!ui?.title) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...ui, time: Math.floor(clock) }));
  } catch {}
};

// Keep the last played track attached to the mini player after a reload without autoplay.
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    const index = DEMO_TRACKS.findIndex((track) => keyFor(track.title, track.artist) === keyFor(saved.title, saved.artist));
    if (index > 0) {
      const [track] = DEMO_TRACKS.splice(index, 1);
      DEMO_TRACKS.unshift(track);
    }
  }
} catch {}

const reconcile = (forceSeek = false) => {
  const ui = getUiTrack();
  if (!ui) return;
  const nextKey = keyFor(ui.title, ui.artist);
  if (nextKey !== currentKey) {
    currentKey = nextKey;
    clock = 0;
    duration = ui.duration || duration;
    lastTick = performance.now();
  } else if (ui.duration) {
    duration = ui.duration;
  }

  const nextPlaying = readIntent();
  if (nextPlaying !== playing) {
    playing = nextPlaying;
    lastTick = performance.now();
  }

  frames().forEach((frame) => {
    if (forceSeek) post(frame, 'seekTo', [clock, true]);
    post(frame, playing ? 'playVideo' : 'pauseVideo');
  });
  emit();
  persist();
};

// Ignore the short PAUSED event YouTube emits while Audio Only <-> Music Video is being rearranged.
window.addEventListener('message', (event) => {
  let data: any = event.data;
  try { if (typeof data === 'string') data = JSON.parse(data); } catch { return; }
  if (data?.[CANONICAL_MARKER]) return;
  if (Date.now() < suppressPauseUntil && data?.event === 'onStateChange' && data?.info === 2) {
    if (frames().some((frame) => frame.contentWindow === event.source)) event.stopImmediatePropagation();
  }
  if (data?.event === 'infoDelivery' && typeof data?.info?.currentTime === 'number') {
    clock = Math.max(0, data.info.currentTime);
    if (typeof data.info.duration === 'number' && data.info.duration > 0) duration = data.info.duration;
    lastTick = performance.now();
  }
}, true);

document.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== 'range') return;
  const max = Number(target.max || 0);
  const value = Number(target.value);
  if (max < 60 || !Number.isFinite(value)) return;
  clock = Math.max(0, value);
  duration = Math.max(duration, max);
  lastTick = performance.now();
  frames().forEach((frame) => post(frame, 'seekTo', [clock, true]));
  emit();
}, true);

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  const button = target?.closest<HTMLButtonElement>('button');
  const label = button?.textContent?.trim() || '';
  if (label === 'Audio Only' || label === 'Music Video') {
    suppressPauseUntil = Date.now() + 900;
    const wasPlaying = playing || readIntent();
    setTimeout(() => {
      playing = wasPlaying;
      frames().forEach((frame) => {
        post(frame, 'seekTo', [clock, true]);
        post(frame, wasPlaying ? 'playVideo' : 'pauseVideo');
      });
      emit();
    }, 80);
    setTimeout(() => reconcile(true), 300);
  } else {
    setTimeout(() => reconcile(false), 0);
    setTimeout(() => reconcile(false), 180);
  }
}, true);

const observer = new MutationObserver(() => {
  setTimeout(() => reconcile(true), 100);
});
observer.observe(document.documentElement, { childList: true, subtree: true });

setInterval(() => {
  const now = performance.now();
  if (playing) {
    const delta = Math.max(0, Math.min(0.5, (now - lastTick) / 1000));
    clock += delta;
    if (duration > 0) clock = Math.min(clock, duration);
  }
  lastTick = now;
  emit();
  persist();
}, 250);

setTimeout(() => {
  playing = false;
  emit();
}, 500);

import { DEMO_TRACKS } from '../data/mockData';
import { searchYouTubeVideos } from '../services/youtubeService';

const YT_SELECTOR = 'iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]';
const STORAGE_KEY = 'sona_last_ui_playback_v2';
const CANONICAL_MARKER = '__sonaUiPlaybackRepair';
const BLINDING_LIGHTS_ID = '4NRXx6U8ABQ';

let playing = false;
let clock = 0;
let duration = 0;
let lastTick = performance.now();
let currentKey = '';
let currentVideoId = '';
let suppressPauseUntil = 0;
let resolveGeneration = 0;

const normalize = (value?: string) => (value || '').trim().toLowerCase();
const keyFor = (title: string, artist: string) => `${normalize(title)}::${normalize(artist)}`;

const post = (frame: HTMLIFrameElement, func: string, args: unknown[] = []) => {
  try {
    frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  } catch {
    // iframe load/teardown race
  }
};

const extractVideoId = (src?: string) => src?.match(/\/embed\/([^?&#/]+)/)?.[1] || '';
const frames = () => Array.from(document.querySelectorAll<HTMLIFrameElement>(YT_SELECTOR));

const fullModal = () =>
  document.querySelector<HTMLButtonElement>('button[title^="Close Player"]')?.closest<HTMLElement>('div.absolute.inset-0') || null;

const getUiTrack = () => {
  const modal = fullModal();
  if (modal) {
    const titleNode = Array.from(modal.querySelectorAll<HTMLElement>('div')).find((el) =>
      el.classList.contains('text-lg') && el.classList.contains('font-black') && el.classList.contains('uppercase')
    );
    const title = titleNode?.textContent?.trim() || '';
    const artist = titleNode?.parentElement?.children.item(1)?.textContent?.trim() || '';
    const range = Array.from(modal.querySelectorAll<HTMLInputElement>('input[type="range"]')).find(
      (el) => Number(el.max || 0) >= 60
    );
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
  window.dispatchEvent(
    new MessageEvent('message', {
      data: {
        [CANONICAL_MARKER]: true,
        event: 'infoDelivery',
        info: { currentTime: Math.max(0, clock), duration: duration || undefined },
      },
    })
  );
};

const persist = () => {
  const ui = getUiTrack();
  if (!ui?.title) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...ui, time: Math.floor(clock), youtubeVideoId: currentVideoId })
    );
  } catch {}
};

const findLiveTrack = (title: string, artist: string) => {
  const targetTitle = normalize(title);
  const targetArtist = normalize(artist);
  return DEMO_TRACKS.find((track) => {
    const titleMatch = normalize(track.title) === targetTitle;
    const artistA = normalize(track.artist);
    const artistMatch = !targetArtist || artistA === targetArtist || artistA.includes(targetArtist) || targetArtist.includes(artistA);
    return titleMatch && artistMatch;
  });
};

const scoreCandidate = (ui: { title: string; artist: string; duration: number }, candidate: any) => {
  const wantedTitle = normalize(ui.title).replace(/[^a-z0-9]+/g, ' ');
  const wantedArtist = normalize(ui.artist).replace(/[^a-z0-9]+/g, ' ');
  const candidateTitle = normalize(candidate?.title).replace(/[^a-z0-9]+/g, ' ');
  const candidateArtist = normalize(candidate?.artist).replace(/[^a-z0-9]+/g, ' ');
  let score = 0;
  if (candidateTitle.includes(wantedTitle)) score += 8;
  if (wantedTitle.includes(candidateTitle)) score += 2;
  const primaryArtist = wantedArtist.split(',')[0]?.trim() || wantedArtist;
  if (primaryArtist && (candidateTitle.includes(primaryArtist) || candidateArtist.includes(primaryArtist))) score += 5;
  if (/official|audio|topic|vevo/.test(`${candidateTitle} ${candidateArtist}`)) score += 2;
  if (ui.duration > 0 && candidate?.durationSeconds > 0) {
    const diff = Math.abs(ui.duration - candidate.durationSeconds);
    if (diff <= 4) score += 5;
    else if (diff <= 10) score += 3;
    else if (diff > 45) score -= 5;
  }
  return score;
};

const resolveVideoId = async (ui: { title: string; artist: string; duration: number }) => {
  const liveTrack = findLiveTrack(ui.title, ui.artist);
  if (liveTrack?.youtubeVideoId) return liveTrack.youtubeVideoId;

  const result = await searchYouTubeVideos(`${ui.title} ${ui.artist} official audio`, 6);
  if (!result.tracks.length) return '';
  const ranked = [...result.tracks].sort((a, b) => scoreCandidate(ui, b) - scoreCandidate(ui, a));
  const best = ranked[0];
  return best && scoreCandidate(ui, best) >= 6 ? best.youtubeVideoId || '' : '';
};

const applyResolvedVideo = (videoId: string, forcePlay: boolean) => {
  if (!videoId) return;
  currentVideoId = videoId;
  frames().forEach((frame) => {
    const existing = extractVideoId(frame.src);
    if (existing !== videoId) {
      post(frame, 'loadVideoById', [videoId, Math.max(0, clock)]);
    } else {
      post(frame, 'seekTo', [Math.max(0, clock), true]);
    }
    post(frame, 'setPlaybackQuality', ['medium']);
    post(frame, forcePlay ? 'playVideo' : 'pauseVideo');
  });
};

const ensureCorrectSource = async (ui: { title: string; artist: string; duration: number }, shouldPlay: boolean) => {
  const generation = ++resolveGeneration;

  // Never let the hard-coded Blinding Lights iframe become audible for another song.
  const isActuallyBlindingLights = normalize(ui.title) === 'blinding lights';
  frames().forEach((frame) => {
    const id = extractVideoId(frame.src);
    if (id === BLINDING_LIGHTS_ID && !isActuallyBlindingLights) post(frame, 'pauseVideo');
  });

  const videoId = await resolveVideoId(ui);
  if (generation !== resolveGeneration || !videoId) {
    if (!videoId) playing = false;
    return;
  }

  currentVideoId = videoId;
  applyResolvedVideo(videoId, shouldPlay);
};

// Keep the last live track attached to the mini player after reload without autoplay.
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    const index = DEMO_TRACKS.findIndex(
      (track) => keyFor(track.title, track.artist) === keyFor(saved.title, saved.artist)
    );
    if (index > 0) {
      const [track] = DEMO_TRACKS.splice(index, 1);
      DEMO_TRACKS.unshift(track);
    }
    currentVideoId = saved.youtubeVideoId || '';
  }
} catch {}

const reconcile = (forceSeek = false) => {
  const ui = getUiTrack();
  if (!ui) return;
  const nextKey = keyFor(ui.title, ui.artist);
  const nextPlaying = readIntent();

  if (nextKey !== currentKey) {
    currentKey = nextKey;
    clock = 0;
    duration = ui.duration || 0;
    lastTick = performance.now();
    currentVideoId = '';

    // A track change is source-critical: pause any existing iframe first, then
    // resolve the selected title/artist to its own YouTube video before playing.
    frames().forEach((frame) => post(frame, 'pauseVideo'));
    playing = nextPlaying;
    void ensureCorrectSource(ui, nextPlaying);
  } else {
    if (ui.duration) duration = ui.duration;
    if (nextPlaying !== playing) {
      playing = nextPlaying;
      lastTick = performance.now();
    }

    frames().forEach((frame) => {
      if (currentVideoId && extractVideoId(frame.src) !== currentVideoId) {
        applyResolvedVideo(currentVideoId, playing);
        return;
      }
      if (forceSeek) post(frame, 'seekTo', [clock, true]);
      post(frame, playing ? 'playVideo' : 'pauseVideo');
    });
  }

  emit();
  persist();
};

// Ignore short PAUSED events YouTube emits while Audio Only <-> Music Video is rearranged.
window.addEventListener(
  'message',
  (event) => {
    let data: any = event.data;
    try {
      if (typeof data === 'string') data = JSON.parse(data);
    } catch {
      return;
    }
    if (data?.[CANONICAL_MARKER]) return;
    if (Date.now() < suppressPauseUntil && data?.event === 'onStateChange' && data?.info === 2) {
      if (frames().some((frame) => frame.contentWindow === event.source)) event.stopImmediatePropagation();
    }
    if (data?.event === 'infoDelivery' && typeof data?.info?.currentTime === 'number') {
      clock = Math.max(0, data.info.currentTime);
      if (typeof data.info.duration === 'number' && data.info.duration > 0) duration = data.info.duration;
      lastTick = performance.now();
    }
  },
  true
);

document.addEventListener(
  'input',
  (event) => {
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
  },
  true
);

document.addEventListener(
  'click',
  (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button');
    const label = button?.textContent?.trim() || '';

    if (label === 'Audio Only' || label === 'Music Video') {
      suppressPauseUntil = Date.now() + 900;
      const wasPlaying = playing || readIntent();
      setTimeout(() => {
        playing = wasPlaying;
        if (currentVideoId) applyResolvedVideo(currentVideoId, wasPlaying);
        else frames().forEach((frame) => post(frame, wasPlaying ? 'playVideo' : 'pauseVideo'));
        emit();
      }, 80);
      setTimeout(() => reconcile(true), 300);
    } else {
      setTimeout(() => reconcile(false), 0);
      setTimeout(() => reconcile(false), 180);
      setTimeout(() => reconcile(false), 500);
    }
  },
  true
);

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

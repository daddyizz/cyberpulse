import { searchYouTubeVideos } from '../services/youtubeService';

const YT_SELECTOR = 'iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]';
const BLINDING_LIGHTS_ID = '4NRXx6U8ABQ';

let activeKey = '';
let activeVideoId = '';
let lastKnownTime = 0;
let lastKnownDuration = 0;
let playing = false;
let suppressPauseUntil = 0;
let resolveToken = 0;

const normalize = (value?: string) => (value || '').trim().toLowerCase();
const keyFor = (title: string, artist: string) => `${normalize(title)}::${normalize(artist)}`;
const frames = () => Array.from(document.querySelectorAll<HTMLIFrameElement>(YT_SELECTOR));
const extractVideoId = (src?: string) => src?.match(/\/embed\/([^?&#/]+)/)?.[1] || '';

const post = (frame: HTMLIFrameElement, func: string, args: unknown[] = []) => {
  try {
    frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  } catch {}
};

const fullModal = () =>
  document.querySelector<HTMLButtonElement>('button[title^="Close Player"]')?.closest<HTMLElement>('div.absolute.inset-0') || null;

const getUiTrack = () => {
  const modal = fullModal();
  if (modal) {
    const titleNode = Array.from(modal.querySelectorAll<HTMLElement>('div')).find(
      (el) => el.classList.contains('text-lg') && el.classList.contains('font-black') && el.classList.contains('uppercase')
    );
    const title = titleNode?.textContent?.trim() || '';
    const artist = titleNode?.parentElement?.children.item(1)?.textContent?.trim() || '';
    const range = Array.from(modal.querySelectorAll<HTMLInputElement>('input[type="range"]')).find(
      (el) => Number(el.max || 0) >= 60
    );
    if (title) return { title, artist, duration: Number(range?.max || 0) || 0 };
  }

  const mini = document.querySelector<HTMLElement>('.sona-mini-player');
  const title = mini?.querySelector<HTMLElement>('.sona-mini-title')?.textContent?.trim() || '';
  const artist = mini?.querySelector<HTMLElement>('.sona-mini-artist')?.textContent?.trim() || '';
  if (title) return { title, artist, duration: 0 };

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

const clean = (value: string) => normalize(value).replace(/[^a-z0-9]+/g, ' ').trim();

const score = (ui: { title: string; artist: string; duration: number }, candidate: any) => {
  const wantedTitle = clean(ui.title);
  const wantedArtist = clean(ui.artist.split(',')[0] || ui.artist);
  const candidateTitle = clean(candidate?.title || '');
  const candidateArtist = clean(candidate?.artist || '');
  let value = 0;

  if (candidateTitle === wantedTitle) value += 12;
  else if (candidateTitle.includes(wantedTitle)) value += 8;
  else if (wantedTitle.includes(candidateTitle)) value += 3;

  if (wantedArtist && (candidateTitle.includes(wantedArtist) || candidateArtist.includes(wantedArtist))) value += 6;
  if (/official|audio|topic|vevo/.test(`${candidateTitle} ${candidateArtist}`)) value += 2;

  if (ui.duration > 0 && candidate?.durationSeconds > 0) {
    const diff = Math.abs(ui.duration - candidate.durationSeconds);
    if (diff <= 4) value += 5;
    else if (diff <= 10) value += 3;
    else if (diff > 40) value -= 6;
  }

  return value;
};

const resolveVideoId = async (ui: { title: string; artist: string; duration: number }) => {
  const queries = [
    `${ui.title} ${ui.artist} official audio`,
    `${ui.title} ${ui.artist} official video`,
    `${ui.title} ${ui.artist}`,
  ];

  for (const query of queries) {
    const result = await searchYouTubeVideos(query, 6);
    if (!result.tracks.length) continue;
    const ranked = [...result.tracks].sort((a, b) => score(ui, b) - score(ui, a));
    const best = ranked[0];
    if (best?.youtubeVideoId && score(ui, best) >= 7) return best.youtubeVideoId;
  }
  return '';
};

const loadResolvedVideo = (videoId: string, shouldPlay: boolean) => {
  activeVideoId = videoId;
  frames().forEach((frame) => {
    const current = extractVideoId(frame.src);
    if (current !== videoId) {
      post(frame, 'loadVideoById', [videoId, Math.max(0, lastKnownTime)]);
    } else if (lastKnownTime > 0) {
      post(frame, 'seekTo', [lastKnownTime, true]);
    }
    post(frame, 'setPlaybackQuality', ['medium']);
    post(frame, shouldPlay ? 'playVideo' : 'pauseVideo');
  });
};

const resolveForCurrentUi = async (ui: { title: string; artist: string; duration: number }, shouldPlay: boolean) => {
  const token = ++resolveToken;

  // The old app fallback is Blinding Lights. It must never be audible when the
  // selected title is anything else.
  if (normalize(ui.title) !== 'blinding lights') {
    frames().forEach((frame) => {
      if (extractVideoId(frame.src) === BLINDING_LIGHTS_ID) post(frame, 'pauseVideo');
    });
  }

  const videoId = await resolveVideoId(ui);
  if (token !== resolveToken) return;

  if (!videoId) {
    playing = false;
    frames().forEach((frame) => post(frame, 'pauseVideo'));
    return;
  }

  loadResolvedVideo(videoId, shouldPlay);
};

const reconcile = () => {
  const ui = getUiTrack();
  if (!ui?.title) return;

  const nextKey = keyFor(ui.title, ui.artist);
  const shouldPlay = readIntent();

  if (nextKey !== activeKey) {
    activeKey = nextKey;
    activeVideoId = '';
    lastKnownTime = 0;
    lastKnownDuration = ui.duration || 0;
    playing = shouldPlay;
    frames().forEach((frame) => post(frame, 'pauseVideo'));
    void resolveForCurrentUi(ui, shouldPlay);
    return;
  }

  playing = shouldPlay;
  if (ui.duration) lastKnownDuration = ui.duration;

  if (activeVideoId) {
    frames().forEach((frame) => {
      if (extractVideoId(frame.src) !== activeVideoId) {
        loadResolvedVideo(activeVideoId, shouldPlay);
      } else {
        post(frame, shouldPlay ? 'playVideo' : 'pauseVideo');
      }
    });
  }
};

// Read only real player telemetry. Do not dispatch synthetic infoDelivery events;
// those fake events were fighting React's own clock and made the seekbar jump
// forward/backward.
window.addEventListener(
  'message',
  (event) => {
    let data: any = event.data;
    try {
      if (typeof data === 'string') data = JSON.parse(data);
    } catch {
      return;
    }

    if (Date.now() < suppressPauseUntil && data?.event === 'onStateChange' && data?.info === 2) {
      if (frames().some((frame) => frame.contentWindow === event.source)) {
        event.stopImmediatePropagation();
        return;
      }
    }

    if (data?.event === 'infoDelivery' && data.info) {
      if (typeof data.info.currentTime === 'number') lastKnownTime = Math.max(0, data.info.currentTime);
      if (typeof data.info.duration === 'number' && data.info.duration > 0) lastKnownDuration = data.info.duration;
    }

    if (data?.event === 'onStateChange') {
      if (data.info === 1) playing = true;
      if (data.info === 2 && Date.now() >= suppressPauseUntil) playing = false;
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
    lastKnownTime = Math.max(0, value);
    if (max > 0) lastKnownDuration = max;
    frames().forEach((frame) => post(frame, 'seekTo', [lastKnownTime, true]));
  },
  true
);

document.addEventListener(
  'click',
  (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('button');
    const label = button?.textContent?.trim() || '';

    if (label === 'Audio Only' || label === 'Music Video') {
      suppressPauseUntil = Date.now() + 1000;
      const wasPlaying = playing || readIntent();
      window.setTimeout(() => {
        if (activeVideoId) loadResolvedVideo(activeVideoId, wasPlaying);
      }, 120);
      window.setTimeout(reconcile, 320);
      return;
    }

    window.setTimeout(reconcile, 0);
    window.setTimeout(reconcile, 180);
    window.setTimeout(reconcile, 500);
  },
  true
);

const observer = new MutationObserver(() => window.setTimeout(reconcile, 80));
observer.observe(document.documentElement, { childList: true, subtree: true });

window.setInterval(reconcile, 700);

const SINGLETON_ID = 'cyberpulse-youtube-singleton';
const CANONICAL_MARKER = '__cyberpulseCanonical';
const INTENT_MARKER_ID = 'cyberpulse-mode-intent-marker';

let canonicalPlaying = false;
let canonicalTime = 0;
let hasCanonicalState = false;

window.addEventListener('message', (event) => {
  let data: any = event.data;
  try {
    if (typeof data === 'string') data = JSON.parse(data);
  } catch {
    return;
  }
  if (!data?.[CANONICAL_MARKER]) return;
  if (data.event === 'onStateChange') {
    canonicalPlaying = data.info === 1;
    hasCanonicalState = true;
  }
  if (data.event === 'infoDelivery' && typeof data.info?.currentTime === 'number') {
    canonicalTime = Math.max(0, data.info.currentTime);
  }
});

const send = (func: string, args: unknown[] = []) => {
  const frame = document.getElementById(SINGLETON_ID) as HTMLIFrameElement | null;
  try {
    frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  } catch {
    // Ignore iframe load/teardown races.
  }
};

const currentUiTime = (modal: HTMLElement): number => {
  if (canonicalTime > 0) return canonicalTime;
  const ranges = Array.from(modal.querySelectorAll<HTMLInputElement>('input[type="range"]'));
  const playbackRange = ranges.find((range) => Number(range.max || 0) >= 60);
  const value = Number(playbackRange?.value || 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

const emitState = (playing: boolean, time: number) => {
  canonicalPlaying = playing;
  canonicalTime = time;
  hasCanonicalState = true;
  window.dispatchEvent(
    new MessageEvent('message', {
      data: {
        [CANONICAL_MARKER]: true,
        event: 'onStateChange',
        info: playing ? 1 : 2,
      },
    })
  );
  window.dispatchEvent(
    new MessageEvent('message', {
      data: {
        [CANONICAL_MARKER]: true,
        event: 'infoDelivery',
        info: { currentTime: time },
      },
    })
  );
};

const holdPlaybackIntent = (playing: boolean) => {
  document.getElementById(INTENT_MARKER_ID)?.remove();
  const marker = document.createElement('button');
  marker.id = INTENT_MARKER_ID;
  marker.type = 'button';
  marker.title = playing ? 'Pause' : 'Play';
  marker.tabIndex = -1;
  marker.setAttribute('aria-hidden', 'true');
  Object.assign(marker.style, {
    position: 'fixed',
    width: '1px',
    height: '1px',
    opacity: '0',
    pointerEvents: 'none',
    left: '-9999px',
    top: '-9999px',
  });
  document.body.appendChild(marker);
  window.setTimeout(() => marker.remove(), 750);
};

// Audio Only <-> Music Video is presentation-only. Capture canonical transport
// state before React swaps the renderer and hold it while all effects settle.
document.addEventListener(
  'click',
  (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button');
    if (!button) return;

    const label = button.textContent?.trim();
    if (label !== 'Audio Only' && label !== 'Music Video') return;

    const modal = button.closest<HTMLElement>('div.absolute.inset-0');
    if (!modal) return;

    const uiSaysPlaying = Boolean(modal.querySelector('button[title="Pause"]'));
    const wasPlaying = hasCanonicalState ? canonicalPlaying : uiSaysPlaying;
    const time = currentUiTime(modal);
    holdPlaybackIntent(wasPlaying);

    const restore = () => {
      if (time > 0) send('seekTo', [time, true]);
      send(wasPlaying ? 'playVideo' : 'pauseVideo');
      emitState(wasPlaying, time);

      document
        .querySelectorAll<HTMLIFrameElement>(
          'iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]'
        )
        .forEach((frame) => {
          if (frame.id === SINGLETON_ID) return;
          try {
            frame.contentWindow?.postMessage(
              JSON.stringify({ event: 'command', func: 'mute', args: [] }),
              '*'
            );
          } catch {
            // ignore
          }
        });
    };

    window.setTimeout(restore, 20);
    window.setTimeout(restore, 100);
    window.setTimeout(restore, 240);
    window.setTimeout(restore, 520);
  },
  true
);
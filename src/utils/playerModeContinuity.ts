const SINGLETON_ID = 'cyberpulse-youtube-singleton';
const CANONICAL_MARKER = '__cyberpulseCanonical';

const send = (func: string, args: unknown[] = []) => {
  const frame = document.getElementById(SINGLETON_ID) as HTMLIFrameElement | null;
  try {
    frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  } catch {
    // Ignore iframe load/teardown races.
  }
};

const currentUiTime = (modal: HTMLElement): number => {
  const ranges = Array.from(modal.querySelectorAll<HTMLInputElement>('input[type="range"]'));
  const playbackRange = ranges.find((range) => Number(range.max || 0) >= 60);
  const value = Number(playbackRange?.value || 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

const emitState = (playing: boolean, time: number) => {
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

// Switching Audio Only <-> Music Video is presentation-only. Capture the
// transport state before React changes the renderer, then re-assert it after
// the renderer mounts/unmounts. This prevents Video -> Audio from pausing.
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

    const wasPlaying = Boolean(modal.querySelector('button[title="Pause"]'));
    const time = currentUiTime(modal);

    const restore = () => {
      if (time > 0) send('seekTo', [time, true]);
      send(wasPlaying ? 'playVideo' : 'pauseVideo');
      emitState(wasPlaying, time);

      // Visible YouTube iframes are renderers only; keep them muted so the
      // canonical hidden transport remains the only audible source.
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

    window.setTimeout(restore, 40);
    window.setTimeout(restore, 160);
    window.setTimeout(restore, 420);
  },
  true
);

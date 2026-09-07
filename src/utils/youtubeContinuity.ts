const YT_IFRAME_SELECTOR = 'iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]';

let lastTime = 0;
let lastDuration = 0;
let lastState: 'playing' | 'paused' = 'paused';
let preservedFrame: HTMLIFrameElement | null = null;
let hiddenHost: HTMLDivElement | null = null;

const ensureHost = () => {
  if (hiddenHost) return hiddenHost;
  hiddenHost = document.createElement('div');
  hiddenHost.id = 'cyberpulse-youtube-continuity-host';
  hiddenHost.style.position = 'fixed';
  hiddenHost.style.left = '-10000px';
  hiddenHost.style.top = '-10000px';
  hiddenHost.style.width = '1px';
  hiddenHost.style.height = '1px';
  hiddenHost.style.opacity = '0';
  hiddenHost.style.pointerEvents = 'none';
  hiddenHost.setAttribute('aria-hidden', 'true');
  document.body.appendChild(hiddenHost);
  return hiddenHost;
};

const sendCommand = (frame: HTMLIFrameElement | null, func: string, args: any[] = []) => {
  try {
    frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  } catch {
    // Ignore detached/cross-origin timing races.
  }
};

const findLiveFrame = (): HTMLIFrameElement | null => {
  const visible = Array.from(document.querySelectorAll<HTMLIFrameElement>(YT_IFRAME_SELECTOR)).find(
    (frame) => frame !== preservedFrame && !hiddenHost?.contains(frame)
  );
  return visible || preservedFrame;
};

const restorePosition = (frame: HTMLIFrameElement) => {
  window.setTimeout(() => {
    if (lastTime > 0) sendCommand(frame, 'seekTo', [lastTime, true]);
    sendCommand(frame, lastState === 'playing' ? 'playVideo' : 'pauseVideo');
  }, 250);
};

const togglePlayback = () => {
  const frame = findLiveFrame();
  if (!frame) return;
  if (lastState === 'playing') {
    sendCommand(frame, 'pauseVideo');
    lastState = 'paused';
  } else {
    if (lastTime > 0) sendCommand(frame, 'seekTo', [lastTime, true]);
    sendCommand(frame, 'playVideo');
    lastState = 'playing';
  }
};

const seekPlayback = (seconds: number) => {
  if (!Number.isFinite(seconds)) return;
  lastTime = Math.max(0, seconds);
  const frame = findLiveFrame();
  sendCommand(frame, 'seekTo', [lastTime, true]);
};

window.addEventListener('message', (event) => {
  if (!event.data) return;
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (data?.event === 'infoDelivery' && data?.info) {
      if (typeof data.info.currentTime === 'number') lastTime = data.info.currentTime;
      if (typeof data.info.duration === 'number') lastDuration = data.info.duration;
    }
    if (data?.event === 'onStateChange') {
      if (data.info === 1) lastState = 'playing';
      if (data.info === 2 || data.info === 0) lastState = 'paused';
    }
  } catch {
    // Ignore unrelated postMessage traffic.
  }
});

const parseClock = (value: string): number => {
  const parts = value.trim().split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

const enhanceBackgroundWidget = () => {
  const mediaLabel = Array.from(document.querySelectorAll<HTMLElement>('span')).find(
    (el) => el.textContent?.trim() === 'MEDIA SESSION'
  );
  if (!mediaLabel) return;

  const card = mediaLabel.closest<HTMLElement>('.rounded-3xl');
  if (!card || card.dataset.cyberContinuityReady === 'true') return;
  card.dataset.cyberContinuityReady = 'true';

  // Make the existing visual progress bar genuinely seekable.
  const progressSection = Array.from(card.querySelectorAll<HTMLElement>('div')).find((el) => {
    const text = el.textContent || '';
    return /^\s*\d+:\d+\s+\d+:\d+\s*$/.test(text.replace(/\s+/g, ' '));
  });

  if (progressSection) {
    const timeLabels = Array.from(progressSection.querySelectorAll('span'));
    const displayedDuration = timeLabels.length > 1 ? parseClock(timeLabels[timeLabels.length - 1].textContent || '') : 0;
    const duration = lastDuration || displayedDuration || 240;
    progressSection.style.position = 'relative';

    const range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = String(duration);
    range.step = '1';
    range.value = String(Math.min(duration, lastTime));
    range.setAttribute('aria-label', 'Seek background playback');
    range.style.position = 'absolute';
    range.style.left = '0';
    range.style.right = '0';
    range.style.top = '0';
    range.style.width = '100%';
    range.style.height = '20px';
    range.style.opacity = '0';
    range.style.cursor = 'pointer';
    range.style.zIndex = '20';
    range.addEventListener('input', () => seekPlayback(Number(range.value)));
    progressSection.appendChild(range);
  }
};

const observer = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of Array.from(record.removedNodes)) {
      if (!(node instanceof HTMLElement)) continue;
      const frame = node.matches?.(YT_IFRAME_SELECTOR)
        ? (node as HTMLIFrameElement)
        : node.querySelector?.<HTMLIFrameElement>(YT_IFRAME_SELECTOR);
      if (!frame || hiddenHost?.contains(frame)) continue;

      // Keep the exact iframe alive instead of letting React destroy the transport.
      preservedFrame = frame;
      const host = ensureHost();
      host.appendChild(frame);
      frame.style.width = '1px';
      frame.style.height = '1px';
      frame.style.border = '0';
      restorePosition(frame);
    }

    for (const node of Array.from(record.addedNodes)) {
      if (!(node instanceof HTMLElement)) continue;
      const frame = node.matches?.(YT_IFRAME_SELECTOR)
        ? (node as HTMLIFrameElement)
        : node.querySelector?.<HTMLIFrameElement>(YT_IFRAME_SELECTOR);
      if (!frame || hiddenHost?.contains(frame)) continue;

      if (preservedFrame && preservedFrame !== frame) {
        sendCommand(preservedFrame, 'pauseVideo');
        preservedFrame.remove();
        preservedFrame = null;
      }
      frame.addEventListener('load', () => restorePosition(frame), { once: true });
    }
  }

  enhanceBackgroundWidget();
});

observer.observe(document.documentElement, { childList: true, subtree: true });

// The simulated Android media widget previously changed React state only.
// Capture its controls and send commands to the persistent player transport too.
document.addEventListener(
  'click',
  (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button');
    if (!button) return;
    const title = button.getAttribute('title') || '';
    if (title === 'Play' || title === 'Pause') togglePlayback();
    if (button.textContent?.includes('Return to App') || button.textContent?.includes('Tap to open app')) {
      const frame = findLiveFrame();
      if (frame) restorePosition(frame);
    }
  },
  true
);

window.addEventListener('cyberpulse:playback-toggle', togglePlayback);
window.addEventListener('cyberpulse:seek', ((event: Event) => {
  const detail = (event as CustomEvent<number>).detail;
  if (typeof detail === 'number') seekPlayback(detail);
}) as EventListener);
window.addEventListener('cyberpulse:resume-sync', () => {
  const frame = findLiveFrame();
  if (frame) restorePosition(frame);
});

window.setInterval(enhanceBackgroundWidget, 1000);

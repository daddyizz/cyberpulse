const YT_IFRAME_SELECTOR = 'iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]';

let lastTime = 0;
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

window.addEventListener('message', (event) => {
  if (!event.data) return;
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (data?.event === 'infoDelivery' && typeof data?.info?.currentTime === 'number') {
      lastTime = data.info.currentTime;
    }
    if (data?.event === 'onStateChange') {
      if (data.info === 1) lastState = 'playing';
      if (data.info === 2 || data.info === 0) lastState = 'paused';
    }
  } catch {
    // Ignore unrelated postMessage traffic.
  }
});

const observer = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of Array.from(record.removedNodes)) {
      if (!(node instanceof HTMLElement)) continue;
      const frame = node.matches?.(YT_IFRAME_SELECTOR)
        ? (node as HTMLIFrameElement)
        : node.querySelector?.<HTMLIFrameElement>(YT_IFRAME_SELECTOR);
      if (!frame || hiddenHost?.contains(frame)) continue;

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
});

observer.observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener('cyberpulse:playback-toggle', () => {
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
});

window.addEventListener('cyberpulse:seek', ((event: Event) => {
  const detail = (event as CustomEvent<number>).detail;
  if (typeof detail !== 'number' || Number.isNaN(detail)) return;
  lastTime = detail;
  const frame = findLiveFrame();
  sendCommand(frame, 'seekTo', [detail, true]);
}) as EventListener);

window.addEventListener('cyberpulse:resume-sync', () => {
  const frame = findLiveFrame();
  if (frame) restorePosition(frame);
});

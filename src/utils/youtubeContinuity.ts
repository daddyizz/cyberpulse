import { DEMO_TRACKS } from '../data/mockData';

const YT_IFRAME_SELECTOR = 'iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]';

let activeFrame: HTMLIFrameElement | null = null;
let hiddenHost: HTMLDivElement | null = null;
let lastTime = 0;
let lastDuration = 0;
let lastState: 'playing' | 'paused' = 'paused';
let activeVideoId = '';

const ensureHost = () => {
  if (hiddenHost?.isConnected) return hiddenHost;
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

const getVideoId = (frame: HTMLIFrameElement | null) => {
  if (!frame) return '';
  return frame.src.match(/\/embed\/([^?&/]+)/)?.[1] || '';
};

const pauseOtherMedia = (owner: HTMLIFrameElement | null) => {
  document.querySelectorAll<HTMLIFrameElement>(YT_IFRAME_SELECTOR).forEach((frame) => {
    if (frame !== owner) sendCommand(frame, 'pauseVideo');
  });
  document.querySelectorAll<HTMLMediaElement>('audio,video').forEach((media) => {
    try {
      media.pause();
    } catch {
      // ignore
    }
  });
};

const restoreFrame = (frame: HTMLIFrameElement, carryTime: boolean) => {
  window.setTimeout(() => {
    if (carryTime && lastTime > 0) sendCommand(frame, 'seekTo', [lastTime, true]);
    sendCommand(frame, lastState === 'playing' ? 'playVideo' : 'pauseVideo');
  }, 300);
};

const adoptFrame = (frame: HTMLIFrameElement) => {
  if (hiddenHost?.contains(frame)) return;

  const newVideoId = getVideoId(frame);
  const sameTrack = Boolean(newVideoId && activeVideoId && newVideoId === activeVideoId);

  if (activeFrame && activeFrame !== frame) {
    sendCommand(activeFrame, 'pauseVideo');
    if (hiddenHost?.contains(activeFrame)) activeFrame.remove();
  }

  if (!sameTrack) {
    lastTime = 0;
    lastDuration = 0;
    activeVideoId = newVideoId;
  }

  activeFrame = frame;
  pauseOtherMedia(activeFrame);
  frame.addEventListener('load', () => restoreFrame(frame, sameTrack), { once: true });
  restoreFrame(frame, sameTrack);
};

const preserveRemovedFrame = (frame: HTMLIFrameElement) => {
  if (frame !== activeFrame) {
    sendCommand(frame, 'pauseVideo');
    return;
  }

  const host = ensureHost();
  host.appendChild(frame);
  frame.style.width = '1px';
  frame.style.height = '1px';
  frame.style.border = '0';
  activeFrame = frame;
  activeVideoId = getVideoId(frame) || activeVideoId;
  pauseOtherMedia(activeFrame);
};

const togglePlayback = () => {
  if (!activeFrame) return;
  if (lastState === 'playing') {
    sendCommand(activeFrame, 'pauseVideo');
    lastState = 'paused';
  } else {
    pauseOtherMedia(activeFrame);
    if (lastTime > 0) sendCommand(activeFrame, 'seekTo', [lastTime, true]);
    sendCommand(activeFrame, 'playVideo');
    lastState = 'playing';
  }
};

const seekPlayback = (seconds: number) => {
  if (!Number.isFinite(seconds)) return;
  lastTime = Math.max(0, seconds);
  sendCommand(activeFrame, 'seekTo', [lastTime, true]);
};

window.addEventListener('message', (event) => {
  if (!activeFrame?.contentWindow || event.source !== activeFrame.contentWindow || !event.data) return;
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (data?.event === 'infoDelivery' && data?.info) {
      if (typeof data.info.currentTime === 'number') lastTime = data.info.currentTime;
      if (typeof data.info.duration === 'number') lastDuration = data.info.duration;
    }
    if (data?.event === 'onStateChange') {
      if (data.info === 1) {
        lastState = 'playing';
        pauseOtherMedia(activeFrame);
      } else if (data.info === 2 || data.info === 0) {
        lastState = 'paused';
      }
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
      if (frame && !hiddenHost?.contains(frame)) preserveRemovedFrame(frame);
    }

    for (const node of Array.from(record.addedNodes)) {
      if (!(node instanceof HTMLElement)) continue;
      const frames: HTMLIFrameElement[] = [];
      if (node.matches?.(YT_IFRAME_SELECTOR)) frames.push(node as HTMLIFrameElement);
      node.querySelectorAll?.<HTMLIFrameElement>(YT_IFRAME_SELECTOR).forEach((frame) => frames.push(frame));
      frames.forEach(adoptFrame);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });
document.querySelectorAll<HTMLIFrameElement>(YT_IFRAME_SELECTOR).forEach(adoptFrame);

window.addEventListener('cyberpulse:playback-toggle', togglePlayback);
window.addEventListener('cyberpulse:seek', ((event: Event) => {
  const detail = (event as CustomEvent<number>).detail;
  if (typeof detail === 'number') seekPlayback(detail);
}) as EventListener);
window.addEventListener('cyberpulse:resume-sync', () => {
  if (!activeFrame) return;
  pauseOtherMedia(activeFrame);
  restoreFrame(activeFrame, true);
});

// Legacy batch helper: lets the simulated background widget switch the canonical hidden player too.
window.addEventListener('cyberpulse:demo-track', ((event: Event) => {
  const detail = (event as CustomEvent<{ title?: string; artist?: string }>).detail;
  const match = DEMO_TRACKS.find(
    (track) =>
      track.title.toLowerCase() === detail?.title?.toLowerCase() &&
      track.artist.toLowerCase() === detail?.artist?.toLowerCase()
  );
  if (!match?.youtubeVideoId || !activeFrame || match.youtubeVideoId === activeVideoId) return;

  activeVideoId = match.youtubeVideoId;
  lastTime = 0;
  lastDuration = match.durationSeconds || 0;
  const origin = encodeURIComponent(window.location.origin);
  activeFrame.src = `https://www.youtube-nocookie.com/embed/${activeVideoId}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&autoplay=1&origin=${origin}`;
}) as EventListener);

// Keep the simulated Android widget seek bar functional without creating a second transport.
const enhanceBackgroundWidget = () => {
  const mediaLabel = Array.from(document.querySelectorAll<HTMLElement>('span')).find(
    (el) => el.textContent?.trim() === 'MEDIA SESSION'
  );
  if (!mediaLabel) return;

  const card = mediaLabel.closest<HTMLElement>('.rounded-3xl');
  if (!card || card.dataset.cyberContinuityReady === 'true') return;
  card.dataset.cyberContinuityReady = 'true';

  const progressSection = Array.from(card.querySelectorAll<HTMLElement>('div')).find((el) => {
    const text = el.textContent || '';
    return /\d+:\d+/.test(text);
  });
  if (!progressSection) return;

  progressSection.style.position = 'relative';
  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0';
  range.max = String(lastDuration || 600);
  range.step = '1';
  range.value = String(lastTime);
  range.setAttribute('aria-label', 'Seek background playback');
  range.style.position = 'absolute';
  range.style.inset = '0';
  range.style.width = '100%';
  range.style.opacity = '0';
  range.style.cursor = 'pointer';
  range.style.zIndex = '20';
  range.addEventListener('input', () => seekPlayback(Number(range.value)));
  progressSection.appendChild(range);
};

window.setInterval(enhanceBackgroundWidget, 1000);

const PROVIDER_WORDS = /\b(Spotify|YouTube)\b/gi;

const cleanText = (value: string) =>
  value
    .replace(/Spotify Fresh/gi, 'Sona Fresh')
    .replace(/YouTube Now/gi, 'Sona Now')
    .replace(/Spotify Playlist/gi, 'Imported Playlist')
    .replace(/Imported from Spotify/gi, 'Imported from online catalog')
    .replace(/Play on YouTube/gi, 'Play')
    .replace(/No YouTube results found/gi, 'No video results found')
    .replace(/Error querying YouTube/gi, 'Error querying video catalog')
    .replace(/Error querying Spotify/gi, 'Error querying music catalog')
    .replace(PROVIDER_WORDS, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.:;!?])/g, '$1')
    .trim();

const isSearchScreen = () =>
  Array.from(document.querySelectorAll('h1')).some((el) => el.textContent?.trim().toLowerCase() === 'search');

const sync = () => {
  // Remove the two provider-only filter pills. Unified search still queries
  // both live sources internally through the ALL mode.
  if (isSearchScreen()) {
    document.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      const label = button.textContent?.trim().toLowerCase();
      if (label === 'spotify' || label === 'youtube') {
        button.style.display = 'none';
        button.setAttribute('aria-hidden', 'true');
      }
    });
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    const current = node.nodeValue || '';
    if (!/spotify|youtube/i.test(current)) continue;
    const next = cleanText(current);
    if (next !== current) node.nodeValue = next;
  }

  document.querySelectorAll<HTMLElement>('[title],[aria-label]').forEach((el) => {
    for (const attr of ['title', 'aria-label']) {
      const value = el.getAttribute(attr);
      if (value && /spotify|youtube/i.test(value)) el.setAttribute(attr, cleanText(value));
    }
  });

  // The simulated Android widget is intentionally dark. Keep its important
  // labels legible and remove the decorative MEDIA SESSION badge.
  const mediaBadge = Array.from(document.querySelectorAll<HTMLElement>('span')).find(
    (el) => el.textContent?.trim().toUpperCase() === 'MEDIA SESSION'
  );
  if (mediaBadge) mediaBadge.style.display = 'none';

  const backgroundLabel = Array.from(document.querySelectorAll<HTMLElement>('span')).find(
    (el) => el.textContent?.trim().toLowerCase() === 'sona background playback'
  );
  if (backgroundLabel) backgroundLabel.style.setProperty('color', '#4ade80', 'important');

  const widgetRoot = backgroundLabel?.closest<HTMLElement>('div[class*="bg-[#0A0D17]"]');
  if (widgetRoot) {
    widgetRoot.querySelectorAll<HTMLElement>('h4').forEach((el) => el.style.setProperty('color', '#ffffff', 'important'));
    widgetRoot.querySelectorAll<HTMLElement>('p').forEach((el) => el.style.setProperty('color', '#cbd5e1', 'important'));
  }
};

const observer = new MutationObserver(() => window.setTimeout(sync, 0));
observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

window.setTimeout(sync, 0);
window.setInterval(sync, 900);

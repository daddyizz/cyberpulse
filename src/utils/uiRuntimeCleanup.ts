const normalize = (value?: string) => (value || '').replace(/\s+/g, ' ').trim();

const HIDDEN_PROVIDER_LABELS = new Set(['spotify', 'youtube']);

const providerReplacements: Array<[RegExp, string]> = [
  [/Spotify Fresh/gi, 'Sona Fresh'],
  [/YouTube Now/gi, 'Sona Video Picks'],
  [/Popular Spotify Playlists/gi, 'Popular Playlists'],
  [/Import Playlist Spotify/gi, 'Import Playlist'],
  [/Import Spotify Playlist/gi, 'Import Playlist'],
  [/Import Spotify/gi, 'Import Playlist'],
  [/Spotify Playlist/gi, 'Imported Playlist'],
  [/Spotify Verified/gi, 'Verified'],
  [/Spotify Curator/gi, 'Curator'],
  [/Imported from Spotify/gi, 'Imported'],
  [/Spotify supplies official metadata\/artwork/gi, 'Official metadata and artwork'],
  [/Spotify metadata\/artwork/gi, 'Official metadata and artwork'],
  [/Spotify/gi, 'Music'],
  [/YouTube/gi, 'Video'],
];

const hideProviderSearchFilters = () => {
  document.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    const text = normalize(button.textContent).toLowerCase();
    if (HIDDEN_PROVIDER_LABELS.has(text)) {
      button.style.display = 'none';
      button.setAttribute('aria-hidden', 'true');
    }
  });
};

const removeStandaloneProviderBadges = () => {
  document.querySelectorAll<HTMLElement>('span,div').forEach((node) => {
    const text = normalize(node.textContent).toLowerCase();
    if (!HIDDEN_PROVIDER_LABELS.has(text)) return;
    if (node.children.length > 0) return;
    node.style.display = 'none';
  });
};

const rewriteProviderText = () => {
  const root = document.getElementById('root');
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      const value = node.nodeValue || '';
      return /spotify|youtube/i.test(value) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  nodes.forEach((node) => {
    let value = node.nodeValue || '';
    for (const [pattern, replacement] of providerReplacements) value = value.replace(pattern, replacement);
    node.nodeValue = value.replace(/\s{2,}/g, ' ');
  });
};

const polishWidget = () => {
  const header = Array.from(document.querySelectorAll<HTMLElement>('span')).find((node) =>
    /sona background playback/i.test(node.textContent || '')
  );
  const card = header?.closest<HTMLElement>('.rounded-3xl');
  if (!card) return;

  if (header) {
    header.style.color = '#67E8F9';
    header.style.opacity = '1';
    header.style.textShadow = 'none';
  }

  const mediaSession = Array.from(card.querySelectorAll<HTMLElement>('span')).find(
    (node) => normalize(node.textContent).toUpperCase() === 'MEDIA SESSION'
  );
  if (mediaSession) mediaSession.style.display = 'none';

  const title = card.querySelector<HTMLElement>('h4');
  const artist = card.querySelector<HTMLElement>('p');
  if (title) {
    title.style.color = '#FFFFFF';
    title.style.opacity = '1';
  }
  if (artist) {
    artist.style.color = '#CBD5E1';
    artist.style.opacity = '1';
  }

  Array.from(card.querySelectorAll<HTMLElement>('span')).forEach((span) => {
    const text = normalize(span.textContent);
    if (/Playing in background/i.test(text)) {
      span.style.color = '#67E8F9';
      span.style.opacity = '1';
    }
    if (/^\d+:\d{2}$/.test(text)) {
      span.style.color = '#CBD5E1';
      span.style.opacity = '1';
    }
  });

  Array.from(card.querySelectorAll<HTMLButtonElement>('button')).forEach((button) => {
    button.style.opacity = '1';
    if (/tap to open app/i.test(button.textContent || '')) button.style.color = '#F8FAFC';
  });
};

const shouldClearStorageKey = (key: string) => {
  const normalized = key.toLowerCase();
  return (
    /^cyberpulse_live_catalog_v\d+$/.test(normalized) ||
    /^sona_live_catalog_v\d+$/.test(normalized) ||
    normalized.includes('playback_cache') ||
    normalized.includes('search_cache') ||
    normalized.includes('artwork_cache') ||
    normalized === 'sona_last_ui_playback_v1' ||
    normalized === 'cyberpulse_last_playback_v2'
  );
};

const clearActualCache = async () => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && shouldClearStorageKey(key)) localStorage.removeItem(key);
    }
  } catch {}

  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i);
      if (key && shouldClearStorageKey(key)) sessionStorage.removeItem(key);
    }
  } catch {}

  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => /sona|cyberpulse|music|catalog|api|image/i.test(name))
          .map((name) => caches.delete(name))
      );
    }
  } catch {}

  window.dispatchEvent(new CustomEvent('sona-cache-cleared'));
};

const deletedTitles = new Set<string>();

const readDeletedTitles = () => {
  try {
    const raw = localStorage.getItem('sona_deleted_playlist_titles');
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) parsed.forEach((title) => deletedTitles.add(String(title)));
  } catch {}
};

const persistDeletedTitles = () => {
  try {
    localStorage.setItem('sona_deleted_playlist_titles', JSON.stringify(Array.from(deletedTitles)));
  } catch {}
};

const hideDeletedPlaylistRows = () => {
  if (!deletedTitles.size) return;
  document.querySelectorAll<HTMLElement>('h1,h2,h3,h4,div,span').forEach((node) => {
    const text = normalize(node.textContent);
    if (!text || !deletedTitles.has(text)) return;
    const row = node.closest<HTMLElement>('div.cursor-pointer,button.cursor-pointer,div.rounded-2xl,div.rounded-xl');
    if (row && !row.querySelector('button[title="Delete Playlist"]')) row.style.display = 'none';
  });
};

readDeletedTitles();

document.addEventListener(
  'click',
  (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('button');
    if (!button) return;

    const label = normalize(button.textContent).toLowerCase();
    const title = button.getAttribute('title') || '';

    if (label.includes('clear cache') || title.toLowerCase().includes('clear cache')) {
      void clearActualCache();
    }

    if (title === 'Delete Playlist') {
      const detailTitle = button.closest('div')?.parentElement?.parentElement?.querySelector('h1')?.textContent?.trim() ||
        document.querySelector('h1')?.textContent?.trim() || '';
      if (detailTitle) {
        window.setTimeout(() => {
          // If the detail page has closed, the confirmation was accepted.
          if (!document.querySelector('button[title="Delete Playlist"]')) {
            deletedTitles.add(detailTitle);
            persistDeletedTitles();
            hideDeletedPlaylistRows();
          }
        }, 250);
      }
    }
  },
  true
);

const sync = () => {
  hideProviderSearchFilters();
  removeStandaloneProviderBadges();
  rewriteProviderText();
  polishWidget();
  hideDeletedPlaylistRows();
};

const observer = new MutationObserver(() => setTimeout(sync, 0));
observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

setInterval(sync, 600);
setTimeout(sync, 0);

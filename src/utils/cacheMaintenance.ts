const clearRuntimeCaches = async () => {
  try {
    const removableKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const normalized = key.toLowerCase();
      if (
        normalized.startsWith('cyberpulse_live_catalog_') ||
        normalized.startsWith('sona_live_catalog_') ||
        normalized.includes('search_cache') ||
        normalized.includes('artwork_cache') ||
        normalized.includes('youtube_cache') ||
        normalized.includes('spotify_cache')
      ) {
        removableKeys.push(key);
      }
    }
    removableKeys.forEach((key) => localStorage.removeItem(key));
  } catch {}

  try {
    sessionStorage.clear();
  } catch {}

  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch {}
};

document.addEventListener(
  'click',
  (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('button');
    if (!button) return;
    const text = button.textContent?.trim().toLowerCase() || '';
    if (!text.includes('clear cache')) return;
    void clearRuntimeCaches();
  },
  true
);

export { clearRuntimeCaches };

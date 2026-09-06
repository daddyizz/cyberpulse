import { getSpotifyAccessToken } from './spotifyService';

// Known pre-mapped Spotify cover skin cache for instantaneous rendering
const PRESET_SPOTIFY_COVERS: Record<string, string> = {
  'blinding lights': 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
  'nightcall': 'https://i.scdn.co/image/ab67616d0000b273d6d8c2eaa1f9031b62f7a3f7',
  'harder, better, faster, stronger': 'https://i.scdn.co/image/ab67616d0000b2731e81bff9807a9e629fce5ade',
  'levitating': 'https://i.scdn.co/image/ab67616d0000b2734aa538a481e67131c214135a',
  'sunflower': 'https://i.scdn.co/image/ab67616d0000b273e2e352d89826aef6dbd5ff8f',
  'midnight city': 'https://i.scdn.co/image/ab67616d0000b27362100064780b1d919a95fcf4',
  'believer': 'https://i.scdn.co/image/ab67616d0000b2735675e83f707f1d7271e5cf8a',
  'starboy': 'https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452',
  'faded': 'https://i.scdn.co/image/ab67616d0000b273c4d00cac55ae1b4598c9bc90',
  'pop/stars': 'https://i.scdn.co/image/ab67616d0000b27392a8979e54cf7ff02947a1c7',
  'dan...': 'https://i.scdn.co/image/ab67616d0000b27354270208627aa8061a8abe21',
  'dan': 'https://i.scdn.co/image/ab67616d0000b27354270208627aa8061a8abe21',
  'haram': 'https://i.scdn.co/image/ab67616d0000b273073e0318d78e782e185a7ac2',
  'turbo killer': 'https://i.scdn.co/image/ab67616d0000b2731b1d6c550aaaae5acf220e84',
  'days of thunder': 'https://i.scdn.co/image/ab67616d0000b273dffe8e5a1e7c4eed82fbbfd5',
  'dia': 'https://i.scdn.co/image/ab67616d0000b273329dd4608d9014cd924ea482',
  'cindai': 'https://i.scdn.co/image/ab67616d0000b27337bbf6faf6d153f910c872e8',
  'dinda': 'https://i.scdn.co/image/ab67616d0000b2732a40ca6491520b86b847e2a6',
  'the nights': 'https://i.scdn.co/image/ab67616d0000b2730ae4f4d42e4a09f3a29f64ad',
  'cruel summer': 'https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647',
  '24k magic': 'https://i.scdn.co/image/ab67616d0000b273232711f7d66a1e19e89e28c5',
  'summer': 'https://i.scdn.co/image/ab67616d0000b2738fba5806a323efd272677c4d',
  'slow dancing in the dark': 'https://i.scdn.co/image/ab67616d0000b2734cc52cd7a712842234e4fce2',
  'pulang': 'https://i.scdn.co/image/ab67616d0000b2730a1f83fe0ff9c9ff1a366d5d',
  'wake me up': 'https://i.scdn.co/image/ab67616d0000b273e14f11f796cef9f9a82691a7',
  'bunga': 'https://i.scdn.co/image/ab67616d0000b273bef4dc5d2f9789dcc3f377db',
  'save your tears': 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
  'belaian jiwa': 'https://i.scdn.co/image/ab67616d0000b2732e2b5d48bcfc644e178e77cb',
  'get lucky': 'https://i.scdn.co/image/ab67616d0000b273d1ec82bc061a90006584aa9b',
  'closer': 'https://i.scdn.co/image/ab67616d0000b2737baaa8cb53b689654262a52d',
  // Artists
  'the weeknd': 'https://i.scdn.co/image/ab6761610000e5ebc1719ac9e6a75c1c25835018',
  'kavinsky': 'https://i.scdn.co/image/ab6761610000e5eb2dc7b3180bad1885c6ee1320',
  'daft punk': 'https://i.scdn.co/image/ab6761610000e5ebd3aa7cc0e419b6c459b08e8e',
  'dua lipa': 'https://i.scdn.co/image/ab6761610000e5eb0c68f6c95232e716f0abee8d',
  'post malone': 'https://i.scdn.co/image/ab6761610000e5ebe17c0aa1714a03d62b5ce4e0',
  'm83': 'https://i.scdn.co/image/ab6761610000e5eb961ef259d6d8101edd2f80c0',
  'imagine dragons': 'https://i.scdn.co/image/ab6761610000e5ebab47d8dae2b24f5afe7f9d38',
  'alan walker': 'https://i.scdn.co/image/ab6761610000e5eb572a8eae56feae217f618078',
  'k/da': 'https://i.scdn.co/image/ab6761610000e5ebdc1dc943555dfa1ee2a107e5',
  'sheila on 7': 'https://i.scdn.co/image/ab6761610000e5eb2017fda314b1745c3e96e0d5',
  'siti nurhaliza': 'https://i.scdn.co/image/ab6761610000e5eb120ff7351940b1a526f6faa1',
  'kugiran masdo': 'https://i.scdn.co/image/ab6761610000e5eb7f4f1d75a9819eb756b85382',
  'avicii': 'https://i.scdn.co/image/ab6761610000e5ebae07171f989fb39736674113',
  'taylor swift': 'https://i.scdn.co/image/ab6761610000e5ebe2e8e7ff002a4afda1c7147e',
  // Albums
  'after hours': 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
  'outrun': 'https://i.scdn.co/image/ab67616d0000b2731c08bca073e89ae32c68ffaa',
  'discovery': 'https://i.scdn.co/image/ab67616d0000b2731e81bff9807a9e629fce5ade',
  'future nostalgia': 'https://i.scdn.co/image/ab67616d0000b273c88bae7846e62a8ba59ee0bd',
  'spider-man: into the spider-verse': 'https://i.scdn.co/image/ab67616d0000b273f172d5a990f3871965d7f94f',
  'the days / nights': 'https://i.scdn.co/image/ab67616d0000b2730ae4f4d42e4a09f3a29f64ad',
  'as it was': 'https://i.scdn.co/image/ab67616d0000b2732e8f6e0b04ff2b97c0f8623b',
  'flowers': 'https://i.scdn.co/image/ab67616d0000b273f429549123dbe8552764ba1d',
  'resonance': 'https://i.scdn.co/image/ab67616d0000b27318ff247343e0d866a1a1b41c',
  'glimpse of us': 'https://i.scdn.co/image/ab67616d0000b273295806c59b20725a3d7c3bc4',
  'seven': 'https://i.scdn.co/image/ab67616d0000b273bfda40487042a9b40092f398',
  'sephia': 'https://i.scdn.co/image/ab67616d0000b2732017fda314b1745c3e96e0d5',
  'gemuruh': 'https://i.scdn.co/image/ab67616d0000b27318ff247343e0d866a1a1b41c',
  'in the end': 'https://i.scdn.co/image/ab67616d0000b273e2f2e5a060b9432ee6ebc453',
  'anti-hero': 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5',
  'shape of you': 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
  'stay': 'https://i.scdn.co/image/ab67616d0000b273a5a73a3ff6730598728d8ee2',
  'harry styles': 'https://i.scdn.co/image/ab6761610000e5eb2e8f6e0b04ff2b97c0f8623b',
  'miley cyrus': 'https://i.scdn.co/image/ab6761610000e5ebf429549123dbe8552764ba1d',
  'linkin park': 'https://i.scdn.co/image/ab6761610000e5ebe2f2e5a060b9432ee6ebc453',
  'ed sheeran': 'https://i.scdn.co/image/ab6761610000e5ebba5db46f4b838ef6027e6f96'
};

const memoryCache = new Map<string, string>();

// Initialize memory cache with presets
Object.entries(PRESET_SPOTIFY_COVERS).forEach(([key, url]) => {
  memoryCache.set(key, url);
});

function normalizeKey(title?: string, artist?: string): string {
  const t = (title || '').toLowerCase().trim();
  const a = (artist || '').toLowerCase().trim();
  return `${t}::${a}`;
}

/**
 * Check if a given URL is a real Spotify image CDN URL
 */
export function isSpotifyImageUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('i.scdn.co') || url.includes('spotifycdn.com') || url.includes('mosaic.scdn.co');
}

/**
 * Synchronously look up if a Spotify cover art is already available in presets or cache
 */
export function getKnownSpotifyCover(title?: string, artist?: string): string | null {
  if (!title && !artist) return null;
  const fullKey = normalizeKey(title, artist);
  if (memoryCache.has(fullKey)) return memoryCache.get(fullKey)!;

  const tKey = (title || '').toLowerCase().trim();
  if (memoryCache.has(tKey)) return memoryCache.get(tKey)!;

  const aKey = (artist || '').toLowerCase().trim();
  if (memoryCache.has(aKey)) return memoryCache.get(aKey)!;

  // Try local storage if in browser
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`sp_cover_${fullKey}`) || localStorage.getItem(`sp_cover_${tKey}`);
      if (stored) {
        memoryCache.set(fullKey, stored);
        return stored;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Resolve Spotify cover art asynchronously by querying the official Spotify API
 */
export async function resolveSpotifyCoverArt(title: string, artist?: string): Promise<string | null> {
  const existing = getKnownSpotifyCover(title, artist);
  if (existing) return existing;

  const query = `${title} ${artist || ''}`.trim();
  if (!query) return null;

  try {
    const token = await getSpotifyAccessToken();
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,album,artist&limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;

    const data = await res.json();
    const trackImg = data.tracks?.items?.[0]?.album?.images?.[0]?.url;
    const albumImg = data.albums?.items?.[0]?.images?.[0]?.url;
    const artistImg = data.artists?.items?.[0]?.images?.[0]?.url;

    const chosen = trackImg || albumImg || artistImg || null;
    if (chosen) {
      const fullKey = normalizeKey(title, artist);
      const tKey = title.toLowerCase().trim();
      memoryCache.set(fullKey, chosen);
      memoryCache.set(tKey, chosen);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`sp_cover_${fullKey}`, chosen);
          localStorage.setItem(`sp_cover_${tKey}`, chosen);
        } catch {
          // ignore
        }
      }
      return chosen;
    }
  } catch (err) {
    console.warn('Could not resolve Spotify cover for:', query, err);
  }

  return null;
}

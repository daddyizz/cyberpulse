import { DEMO_PLAYLISTS, DEMO_TRACKS } from '../data/mockData';

const syncHomeHero = () => {
  const heading = Array.from(document.querySelectorAll<HTMLElement>('h2')).find(
    (el) => el.textContent?.trim().toLowerCase() === 'electric dreams' || el.dataset.liveHomeHero === 'true'
  );
  if (!heading) return;

  const livePlaylist = DEMO_PLAYLISTS[0];
  const liveTrack = DEMO_TRACKS[0];
  if (!livePlaylist && !liveTrack) return;

  heading.dataset.liveHomeHero = 'true';
  heading.textContent = livePlaylist?.title || 'Sona Fresh';

  const card = heading.closest<HTMLElement>('div.relative');
  if (!card) return;

  const paragraphs = Array.from(card.querySelectorAll<HTMLParagraphElement>('p'));
  const description = paragraphs.find((p) => p.className.includes('line-clamp-2'));
  if (description) {
    description.textContent =
      livePlaylist?.description ||
      (liveTrack ? `Fresh discovery featuring ${liveTrack.title} by ${liveTrack.artist}. Refreshed automatically.` : 'Fresh live music discovery.');
  }

  const badge = Array.from(card.querySelectorAll<HTMLElement>('span')).find((span) =>
    /featured mix|live mix/i.test(span.textContent || '')
  );
  if (badge) badge.textContent = 'SONA LIVE';

  const artwork = livePlaylist?.artworkUrl || liveTrack?.artworkUrl;
  if (artwork) {
    const backdrop = Array.from(card.children).find((child) => {
      if (!(child instanceof HTMLElement)) return false;
      return child.className.includes('bg-cover') && child.className.includes('bg-center');
    }) as HTMLElement | undefined;
    if (backdrop) {
      backdrop.style.backgroundImage = `url("${artwork.replace(/"/g, '%22')}")`;
      backdrop.style.opacity = '0.22';
    }
  }
};

const observer = new MutationObserver(() => setTimeout(syncHomeHero, 0));
observer.observe(document.documentElement, { childList: true, subtree: true });

setTimeout(syncHomeHero, 0);
setInterval(syncHomeHero, 1500);

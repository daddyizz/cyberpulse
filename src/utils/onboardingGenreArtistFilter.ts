import { DEMO_ARTISTS, GENRE_OPTIONS } from '../data/mockData';

let selectedGenres = new Set<string>();

const normalize = (value?: string) => (value || '').trim().toLowerCase();

const captureGenres = () => {
  const heading = Array.from(document.querySelectorAll('h2')).find(
    (el) => el.textContent?.trim().toLowerCase() === 'what moves you?'
  );
  if (!heading) return;

  const root = heading.parentElement;
  if (!root) return;
  const next = new Set<string>();
  const known = new Map(GENRE_OPTIONS.map((genre) => [normalize(genre), genre]));
  root.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    const label = button.textContent?.trim() || '';
    const genre = known.get(normalize(label));
    if (!genre) return;
    if (button.className.includes('border-[#00F5FF]')) next.add(genre);
  });
  selectedGenres = next;
};

const applyArtistFilter = () => {
  const heading = Array.from(document.querySelectorAll('h2')).find(
    (el) => el.textContent?.trim().toLowerCase() === 'favorite artists'
  );
  if (!heading) return;

  const root = heading.parentElement;
  const grid = root?.querySelector<HTMLElement>('div.grid.grid-cols-2');
  if (!grid) return;

  const chosen = new Set(Array.from(selectedGenres).map(normalize));
  if (!chosen.size) return;

  const relevantNames = new Set(
    DEMO_ARTISTS
      .filter((artist) =>
        artist.genres?.some((genre) => chosen.has(normalize(genre)))
      )
      .map((artist) => artist.name)
  );

  if (!relevantNames.size) return;

  Array.from(grid.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    const nameSpan = Array.from(child.querySelectorAll('span')).find((span) =>
      DEMO_ARTISTS.some((artist) => artist.name === span.textContent?.trim())
    );
    const name = nameSpan?.textContent?.trim() || '';
    child.style.display = relevantNames.has(name) ? '' : 'none';
  });
};

const sync = () => {
  captureGenres();
  applyArtistFilter();
};

document.addEventListener('click', () => {
  setTimeout(sync, 0);
  setTimeout(sync, 120);
}, true);

const observer = new MutationObserver(() => setTimeout(sync, 0));
observer.observe(document.documentElement, { childList: true, subtree: true });

setInterval(sync, 500);

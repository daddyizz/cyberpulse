import { DEMO_ARTISTS, GENRE_OPTIONS } from '../data/mockData';

const normalize = (value?: string) => (value || '').trim().toLowerCase();
const knownGenres = new Map(GENRE_OPTIONS.map((genre) => [normalize(genre), genre]));

const readSavedGenres = (): string[] => {
  for (const key of ['cyberpulse_preferences', 'sona_preferences']) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed?.selectedGenres)) return parsed.selectedGenres.map(String);
    } catch {}
  }
  return [];
};

let selectedGenres = new Set<string>(readSavedGenres());

const isGenreButton = (button: HTMLButtonElement) => {
  const label = button.textContent?.trim() || '';
  return knownGenres.get(normalize(label)) || null;
};

const captureVisibleGenreState = () => {
  const heading = Array.from(document.querySelectorAll('h2')).find(
    (el) => normalize(el.textContent) === 'what moves you?'
  );
  if (!heading) return false;

  const root = heading.parentElement;
  if (!root) return false;

  const next = new Set<string>();
  root.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    const genre = isGenreButton(button);
    if (!genre) return;
    const selected =
      button.className.includes('border-[#00F5FF]') ||
      button.getAttribute('aria-pressed') === 'true' ||
      button.querySelector('svg') !== null;
    if (selected) next.add(genre);
  });

  selectedGenres = next;
  try {
    sessionStorage.setItem('sona_onboarding_selected_genres', JSON.stringify(Array.from(next)));
  } catch {}
  return true;
};

const restoreCapturedGenres = () => {
  if (selectedGenres.size) return;
  try {
    const raw = sessionStorage.getItem('sona_onboarding_selected_genres');
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) selectedGenres = new Set(parsed.map(String));
  } catch {}
};

const applyArtistFilter = () => {
  const heading = Array.from(document.querySelectorAll('h2')).find(
    (el) => normalize(el.textContent) === 'favorite artists'
  );
  if (!heading) return;

  restoreCapturedGenres();

  const root = heading.parentElement;
  const grid = root?.querySelector<HTMLElement>('div.grid.grid-cols-2');
  if (!grid) return;

  const chosen = new Set(Array.from(selectedGenres).map(normalize));
  const relevantNames = new Set(
    DEMO_ARTISTS
      .filter((artist) =>
        artist.genres?.some((genre) => chosen.has(normalize(genre)))
      )
      .map((artist) => artist.name)
  );

  let visible = 0;
  Array.from(grid.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    const text = child.textContent || '';
    const matchedArtist = DEMO_ARTISTS.find((artist) => text.includes(artist.name));
    const shouldShow = Boolean(matchedArtist && relevantNames.has(matchedArtist.name));
    child.style.display = shouldShow ? '' : 'none';
    if (shouldShow) visible += 1;
  });

  let empty = root?.querySelector<HTMLElement>('[data-sona-empty-artists="true"]') || null;
  if (visible === 0) {
    if (!empty) {
      empty = document.createElement('div');
      empty.dataset.sonaEmptyArtists = 'true';
      empty.className = 'col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-xs font-semibold text-slate-600';
      grid.appendChild(empty);
    }
    empty.textContent = chosen.size
      ? 'No live artists are available for the selected genre right now. Go back and choose another genre.'
      : 'Choose at least one genre first to see matching live artists.';
    empty.style.display = '';
  } else if (empty) {
    empty.style.display = 'none';
  }
};

// Capture the genre click itself, before React unmounts Step 2.
document.addEventListener(
  'click',
  (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button');
    if (button) {
      const genre = isGenreButton(button);
      if (genre) {
        if (selectedGenres.has(genre)) selectedGenres.delete(genre);
        else selectedGenres.add(genre);
        try {
          sessionStorage.setItem('sona_onboarding_selected_genres', JSON.stringify(Array.from(selectedGenres)));
        } catch {}
      }
    }

    window.setTimeout(() => captureVisibleGenreState(), 0);
    window.setTimeout(() => applyArtistFilter(), 40);
    window.setTimeout(() => applyArtistFilter(), 180);
  },
  true
);

const observer = new MutationObserver(() => {
  window.setTimeout(() => {
    captureVisibleGenreState();
    applyArtistFilter();
  }, 0);
});
observer.observe(document.documentElement, { childList: true, subtree: true });

window.setInterval(() => {
  captureVisibleGenreState();
  applyArtistFilter();
}, 400);

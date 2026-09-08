import { DEMO_ARTISTS, GENRE_OPTIONS } from '../data/mockData';

const normalize = (value?: string) => (value || '').trim().toLowerCase();
const knownGenres = new Map(GENRE_OPTIONS.map((genre) => [normalize(genre), genre]));

// Onboarding is a fresh calibration session. Do not inherit old genre choices
// just because preferences from a previous onboarding still exist.
let selectedGenres = new Set<string>();
let onboardingSessionStarted = false;

const getGenre = (button: HTMLButtonElement) => {
  const label = button.textContent?.trim() || '';
  return knownGenres.get(normalize(label)) || null;
};

const persistSessionGenres = () => {
  try {
    sessionStorage.setItem('sona_onboarding_selected_genres', JSON.stringify(Array.from(selectedGenres)));
  } catch {}
};

const applyArtistFilter = () => {
  const heading = Array.from(document.querySelectorAll('h2')).find(
    (el) => normalize(el.textContent) === 'favorite artists'
  );
  if (!heading) return;

  const root = heading.parentElement;
  const grid = root?.querySelector<HTMLElement>('div.grid.grid-cols-2');
  if (!grid) return;

  const chosen = new Set(Array.from(selectedGenres).map(normalize));
  const relevantNames = new Set(
    DEMO_ARTISTS
      .filter((artist) => artist.genres?.some((genre) => chosen.has(normalize(genre))))
      .map((artist) => artist.name)
  );

  let visible = 0;
  Array.from(grid.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    if (child.dataset.sonaEmptyArtists === 'true') return;
    const text = child.textContent || '';
    const artist = DEMO_ARTISTS.find((candidate) => text.includes(candidate.name));
    const shouldShow = Boolean(artist && relevantNames.has(artist.name));
    child.style.display = shouldShow ? '' : 'none';
    if (shouldShow) visible += 1;
  });

  let empty = grid.querySelector<HTMLElement>('[data-sona-empty-artists="true"]');
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

const resetSessionIfWelcome = () => {
  const welcome = Array.from(document.querySelectorAll('h1')).some(
    (el) => normalize(el.textContent) === 'your music. your universe.'
  );
  if (welcome && !onboardingSessionStarted) {
    selectedGenres = new Set();
    onboardingSessionStarted = true;
    persistSessionGenres();
  }
};

document.addEventListener(
  'click',
  (event) => {
    resetSessionIfWelcome();
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button');
    if (button) {
      const genre = getGenre(button);
      if (genre) {
        // Capture only explicit choices in this onboarding session.
        if (selectedGenres.has(genre)) selectedGenres.delete(genre);
        else selectedGenres.add(genre);
        persistSessionGenres();
      }
    }
    window.setTimeout(applyArtistFilter, 0);
    window.setTimeout(applyArtistFilter, 120);
  },
  true
);

const observer = new MutationObserver(() => {
  resetSessionIfWelcome();
  window.setTimeout(applyArtistFilter, 0);
});
observer.observe(document.documentElement, { childList: true, subtree: true });

window.setInterval(() => {
  resetSessionIfWelcome();
  applyArtistFilter();
}, 400);

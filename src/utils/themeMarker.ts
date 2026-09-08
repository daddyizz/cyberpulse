import type { SonaTheme, NrcAccentColor } from '../types';

export function applyThemeMarker(theme: SonaTheme, nrcAccent: NrcAccentColor = 'neon_green') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Clean old classes
  for (const name of Array.from(root.classList)) {
    if (
      name.startsWith('cyber-theme-') ||
      name.startsWith('theme-') ||
      name.startsWith('accent-')
    ) {
      root.classList.remove(name);
    }
  }

  const effectiveTheme = theme === 'nike_run_club' ? 'stealth_athletic' : theme;

  root.classList.add(`theme-${effectiveTheme}`);
  root.classList.add(`cyber-theme-${effectiveTheme}`);
  // Also add legacy class for existing CSS rules
  if (effectiveTheme === 'stealth_athletic') {
    root.classList.add('theme-nike_run_club');
    root.classList.add('cyber-theme-nike_run_club');
  }
  root.setAttribute('data-theme', effectiveTheme);

  if (effectiveTheme === 'stealth_athletic' || theme === 'nike_run_club') {
    const accentClass = `accent-${nrcAccent || 'neon_green'}`;
    root.classList.add(accentClass);
    root.setAttribute('data-nrc-accent', nrcAccent || 'neon_green');
  } else {
    root.removeAttribute('data-nrc-accent');
  }
}



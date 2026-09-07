import type { CyberTheme } from '../types';

const ROOT_CLASS_PREFIX = 'cyber-theme-';

export function applyThemeMarker(theme: CyberTheme) {
  const root = document.documentElement;
  for (const name of Array.from(root.classList)) {
    if (name.startsWith(ROOT_CLASS_PREFIX)) root.classList.remove(name);
  }
  root.classList.add(`${ROOT_CLASS_PREFIX}${theme}`);
}

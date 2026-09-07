const TARGET_KEY = 'cyberpulse_settings_target';

const labelTargets: Record<string, string> = {
  'Account & Subscription': 'settings-account',
  'Appearance & Themes (Sporty, OLED, Frosted)': 'settings-appearance',
  'Audio Engine & DSP Preferences': 'settings-audio',
  'Notifications & Cache': 'settings-system',
};

const scrollToPendingSection = () => {
  let targetId = '';
  try {
    targetId = localStorage.getItem(TARGET_KEY) || '';
  } catch {
    return;
  }
  if (!targetId) return;

  const section = document.getElementById(targetId);
  if (!section) return;

  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  section.classList.add('cyber-settings-focus');
  window.setTimeout(() => section.classList.remove('cyber-settings-focus'), 1200);
  try {
    localStorage.removeItem(TARGET_KEY);
  } catch {
    // ignore storage failures
  }
};

const hideAdMobProfileEntry = () => {
  const labels = Array.from(document.querySelectorAll<HTMLElement>('span')).filter(
    (el) => el.textContent?.trim() === 'Google AdMob Configuration'
  );
  for (const label of labels) {
    const row = label.closest<HTMLElement>('div.flex.items-center.justify-between');
    if (row) row.style.display = 'none';
  }
};

// Profile rows already navigate with React. Remember which Settings section the
// user intended, then scroll there as soon as SettingsView mounts.
document.addEventListener(
  'click',
  (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const row = target.closest<HTMLElement>('div.cursor-pointer');
    const text = row?.querySelector('span')?.textContent?.trim() || target.textContent?.trim() || '';
    const targetId = labelTargets[text];
    if (!targetId) return;
    try {
      localStorage.setItem(TARGET_KEY, targetId);
    } catch {
      // ignore
    }
    window.setTimeout(scrollToPendingSection, 80);
    window.setTimeout(scrollToPendingSection, 260);
  },
  true
);

const observer = new MutationObserver(() => {
  hideAdMobProfileEntry();
  scrollToPendingSection();
});
observer.observe(document.documentElement, { childList: true, subtree: true });

window.setTimeout(hideAdMobProfileEntry, 0);

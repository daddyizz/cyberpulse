import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './data/playbackSanitizer';
import './utils/selectedTrackPlayback';
import './utils/onboardingGenreArtistFilter';
import './utils/liveHomePresentation';
import './utils/uiRuntimeCleanup';
import './utils/settingsNavigation';
import { hydrateLiveCatalog } from './services/liveCatalogService';
import App from './App.tsx';
import './index.css';
import './pureLightOverrides.css';

async function bootstrap() {
  try {
    await hydrateLiveCatalog();
  } catch (error) {
    console.warn('Live discovery unavailable; rendering online-catalog unavailable state.', error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap();

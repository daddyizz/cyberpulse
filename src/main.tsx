import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './data/playbackSanitizer';
import './utils/youtubeContinuity';
import './utils/playerModeContinuity';
import './utils/settingsNavigation';
import { hydrateLiveCatalog } from './services/liveCatalogService';
import App from './App.tsx';
import './index.css';
import './pureLightOverrides.css';

async function bootstrap() {
  try {
    await hydrateLiveCatalog();
  } catch (error) {
    console.warn('Live discovery unavailable; using cached/mock fallback.', error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap();
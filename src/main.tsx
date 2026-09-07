import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './data/playbackSanitizer';
import './utils/youtubeContinuity';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

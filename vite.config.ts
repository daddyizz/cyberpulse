import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { cyberPlayerReliabilityPatch } from './build/cyberPlayerReliabilityPatch';
import { spotifyApiMiddleware } from './build/spotifyApiMiddleware';

export default defineConfig(() => ({
  plugins: [cyberPlayerReliabilityPatch(), react(), tailwindcss(), spotifyApiMiddleware()],
  envPrefix: ['VITE_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function spotifyApiMiddleware(): Plugin {
  let cachedToken: string | null = null;
  let tokenExpiresAt = 0;

  async function getSpotifyToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && now < tokenExpiresAt - 60_000) {
      return cachedToken;
    }

    const rawClientId =
      process.env.VITE_SPOTIFY_CLIENT_ID ||
      process.env.SPOTIFY_CLIENT_ID ||
      '323d9249fe1e42b7b6d108ed5817fe08';
    const rawClientSecret =
      process.env.VITE_SPOTIFY_CLIENT_SECRET ||
      process.env.SPOTIFY_CLIENT_SECRET ||
      'dd6dc30505df4d9289e3a5514646bde6';

    const clientId = rawClientId.trim().replace(/^["']|["']$/g, '');
    const clientSecret = rawClientSecret.trim().replace(/^["']|["']$/g, '');

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' })
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Spotify Auth failed (HTTP ${resp.status}): ${errorText}`);
    }

    const data = (await resp.json()) as any;
    cachedToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in || 3600) * 1000;
    return cachedToken!;
  }

  return {
    name: 'spotify-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/spotify/search', async (req, res) => {
        try {
          const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          const q = parsedUrl.searchParams.get('q') || '';
          const rawLimit = parseInt(parsedUrl.searchParams.get('limit') || '10', 10);
          // Spotify catalog API restricts search limit to a max of 10 for client credentials apps
          const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 10 : rawLimit), 10);

          if (!q.trim()) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ tracks: { items: [] } }));
            return;
          }

          const token = await getSpotifyToken();
          const targetUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
            q.trim()
          )}&type=track&limit=${limit}`;

          const spotifyResp = await fetch(targetUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const body = await spotifyResp.text();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = spotifyResp.status;
          res.end(body);
        } catch (err: any) {
          console.error('[Spotify Server Proxy Error]:', err);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({ error: { message: err?.message || 'Spotify search proxy failure' } }));
        }
      });

      server.middlewares.use('/api/spotify/health', async (_req, res) => {
        try {
          const token = await getSpotifyToken();
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'ok',
              connected: Boolean(token),
              timestamp: new Date().toISOString()
            })
          );
        } catch (err: any) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({ status: 'error', message: err?.message }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), spotifyApiMiddleware()],
    envPrefix: ['VITE_', 'SPOTIFY_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

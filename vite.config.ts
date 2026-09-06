import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function spotifyApiMiddleware(): Plugin {
  let cachedToken: string | null = null;
  let tokenExpiresAt = 0;

  function getCredentials() {
    const rawClientId = process.env.SPOTIFY_CLIENT_ID || '';
    const rawClientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';

    const clientId = rawClientId.trim().replace(/^["']|["']$/g, '');
    const clientSecret = rawClientSecret.trim().replace(/^["']|["']$/g, '');

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials are missing. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in AI Studio Secrets.');
    }

    return { clientId, clientSecret };
  }

  async function getSpotifyToken(): Promise<{ token: string; expiresIn: number }> {
    const now = Date.now();
    if (cachedToken && now < tokenExpiresAt - 60_000) {
      return { token: cachedToken, expiresIn: Math.max(60, Math.floor((tokenExpiresAt - now) / 1000)) };
    }

    const { clientId, clientSecret } = getCredentials();
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
    const expiresIn = Number(data.expires_in) || 3600;
    tokenExpiresAt = now + expiresIn * 1000;
    return { token: cachedToken!, expiresIn };
  }

  function json(res: any, statusCode: number, body: unknown) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = statusCode;
    res.end(JSON.stringify(body));
  }

  async function spotifySearch(query: string, limit: number) {
    const { token } = await getSpotifyToken();
    const targetUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`;
    return fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  return {
    name: 'spotify-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/spotify/search', async (req, res) => {
        try {
          const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          const q = parsedUrl.searchParams.get('q') || '';
          const rawLimit = parseInt(parsedUrl.searchParams.get('limit') || '10', 10);
          const limit = Math.min(Math.max(1, Number.isNaN(rawLimit) ? 10 : rawLimit), 10);

          if (!q.trim()) return json(res, 200, { tracks: { items: [] } });

          const spotifyResp = await spotifySearch(q.trim(), limit);
          const body = await spotifyResp.text();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = spotifyResp.status;
          res.end(body);
        } catch (err: any) {
          console.error('[Spotify Server Proxy Error]:', err);
          json(res, 500, { error: { message: err?.message || 'Spotify search proxy failure' } });
        }
      });

      server.middlewares.use('/api/spotify/artwork', async (req, res) => {
        try {
          const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          const q = (parsedUrl.searchParams.get('q') || '').trim();
          if (!q) return json(res, 200, { artworkUrl: null });

          const spotifyResp = await spotifySearch(q, 5);
          if (!spotifyResp.ok) {
            const errorText = await spotifyResp.text();
            return json(res, spotifyResp.status, { artworkUrl: null, message: errorText });
          }

          const data = (await spotifyResp.json()) as any;
          const items = data.tracks?.items || [];
          const images = items.flatMap((item: any) => item.album?.images || []);
          const best = images
            .filter((image: any) => Boolean(image?.url))
            .sort((a: any, b: any) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)))[0];

          json(res, 200, { artworkUrl: best?.url || null });
        } catch (err: any) {
          json(res, 500, { artworkUrl: null, message: err?.message || 'Spotify artwork lookup failed' });
        }
      });

      server.middlewares.use('/api/spotify/token', async (_req, res) => {
        try {
          const { token, expiresIn } = await getSpotifyToken();
          json(res, 200, { accessToken: token, expiresIn });
        } catch (err: any) {
          json(res, 500, { message: err?.message || 'Spotify token proxy failure' });
        }
      });

      server.middlewares.use('/api/spotify/health', async (_req, res) => {
        try {
          const { token } = await getSpotifyToken();
          json(res, 200, {
            status: 'ok',
            connected: Boolean(token),
            timestamp: new Date().toISOString()
          });
        } catch (err: any) {
          json(res, 500, { status: 'error', message: err?.message || 'Spotify health check failed' });
        }
      });
    }
  };
}

export default defineConfig(() => ({
  plugins: [react(), tailwindcss(), spotifyApiMiddleware()],
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

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

/**
 * Temporary source-preserving reliability patch for the large AI Studio preview component.
 * It changes only known playback blocks at transform time, leaving the original UI markup intact.
 * This can later be folded directly into CyberPulseApp.tsx when AI Studio editing resumes.
 */
function cyberPlayerReliabilityPatch(): Plugin {
  const replaceOnce = (code: string, search: string, replacement: string, label: string) => {
    const first = code.indexOf(search);
    if (first === -1) throw new Error(`[CyberPulse patch] Missing block: ${label}`);
    return code.slice(0, first) + replacement + code.slice(first + search.length);
  };

  return {
    name: 'cyber-player-reliability-patch',
    enforce: 'pre',
    transform(source, id) {
      const normalizedId = id.replace(/\\/g, '/').split('?')[0];
      if (!normalizedId.endsWith('/src/components/CyberPulseApp.tsx')) return null;

      let code = source;

      code = replaceOnce(
        code,
        "import { searchYouTubeVideos } from '../services/youtubeService';",
        "import { searchYouTubeVideos, validateYouTubeVideoId } from '../services/youtubeService';",
        'YouTube service import'
      );

      code = replaceOnce(
        code,
        `  // Derive matched YouTube video ID for full-length, high-definition streaming\n  const effectiveYtId =\n    currentTrack.youtubeVideoId ||\n    DEMO_TRACKS.find(\n      (t) =>\n        t.id === currentTrack.id ||\n        t.title.toLowerCase() === currentTrack.title.toLowerCase() ||\n        (currentTrack.spotifyTrackId && t.spotifyTrackId === currentTrack.spotifyTrackId)\n    )?.youtubeVideoId ||\n    '4NRXx6U8ABQ';\n\n  // Unified audio/video stream is active so audio is never stopped or restarted when toggling modes\n  const isYouTubeActive = true;`,
        `  // Never substitute a different song when media resolution fails.\n  const effectiveYtId = currentTrack.youtubeVideoId;\n\n  // Audio mode uses the real audio engine; YouTube is active only in video mode.\n  const isYouTubeActive = playbackMediaMode === 'video' && Boolean(effectiveYtId);`,
        'effective media source'
      );

      code = replaceOnce(
        code,
        `  // Timer interval seekbar jika YouTube aktif\n  useEffect(() => {\n    let interval: any = null;\n    if (isPlaying && isYouTubeActive) {\n      interval = setInterval(() => {\n        setSeekSeconds((prev) => {\n          const max = currentTrack.durationSeconds || 240;\n          return prev >= max ? prev : prev + 1;\n        });\n      }, 1000);\n    }\n    return () => {\n      if (interval) clearInterval(interval);\n    };\n  }, [isPlaying, isYouTubeActive, currentTrack.durationSeconds]);`,
        `  // Never simulate playback time. YouTube infoDelivery and the audio engine are the only clocks.\n  useEffect(() => {\n    if (isPlaying && isYouTubeActive) sendYTCommand('getCurrentTime');\n  }, [isPlaying, isYouTubeActive, currentTrack.id]);`,
        'fake seek timer'
      );

      code = replaceOnce(
        code,
        `          const match = DEMO_TRACKS.find(\n            (t) =>\n              t.title.toLowerCase().includes(currentTrack.title.toLowerCase()) ||\n              t.artist.toLowerCase().includes(currentTrack.artist.toLowerCase())\n          );\n          url = match?.audioUrl || DEMO_TRACKS[0].audioUrl;`,
        `          const match = DEMO_TRACKS.find(\n            (t) =>\n              t.id === currentTrack.id ||\n              (t.title.toLowerCase() === currentTrack.title.toLowerCase() &&\n                t.artist.toLowerCase() === currentTrack.artist.toLowerCase())\n          );\n          url = match?.audioUrl;`,
        'arbitrary audio fallback'
      );

      code = replaceOnce(
        code,
        `\n        cyberAudio\n          .play(`,
        `\n        if (!url) {\n          setIsPlaying(false);\n          return;\n        }\n\n        cyberAudio\n          .play(`,
        'missing audio guard'
      );

      code = replaceOnce(
        code,
        `          .catch(() => {});`,
        `          .catch(() => setIsPlaying(false));`,
        'audio playback failure state'
      );

      const oldHandlersStart = code.indexOf('  const handlePlayViaYouTube = async (track: Track) => {');
      const oldHandlersEnd = code.indexOf('  const handlePlaySpotifyTrackViaYouTube = (spTrack: Track) => {');
      if (oldHandlersStart === -1 || oldHandlersEnd === -1 || oldHandlersEnd <= oldHandlersStart) {
        throw new Error('[CyberPulse patch] Unable to locate track selection handlers');
      }
      const safeHandlers = `  const removeUnavailableTrack = (track: Track) => {\n    setTracks((prev) => prev.filter((item) => item.id !== track.id));\n    setYoutubeResults((prev) => prev.filter((item) => item.id !== track.id));\n    setSpotifyResults((prev) => prev.filter((item) => item.id !== track.id));\n  };\n\n  const findExactAudioUrl = (track: Track): string | undefined => {\n    if (track.audioUrl) return track.audioUrl;\n    return DEMO_TRACKS.find(\n      (t) =>\n        t.id === track.id ||\n        (t.title.toLowerCase() === track.title.toLowerCase() &&\n          t.artist.toLowerCase() === track.artist.toLowerCase())\n    )?.audioUrl;\n  };\n\n  const resolvePlayableYouTubeId = async (track: Track): Promise<string | undefined> => {\n    // Live YouTube search results have already passed status/embeddable verification.\n    if (track.source === 'YOUTUBE' && track.youtubeVideoId) return track.youtubeVideoId;\n\n    if (track.youtubeVideoId && (await validateYouTubeVideoId(track.youtubeVideoId))) {\n      return track.youtubeVideoId;\n    }\n\n    const demoMatch = DEMO_TRACKS.find(\n      (t) =>\n        t.id === track.id ||\n        t.title.toLowerCase() === track.title.toLowerCase() ||\n        (track.spotifyTrackId && t.spotifyTrackId === track.spotifyTrackId)\n    );\n    if (demoMatch?.youtubeVideoId && demoMatch.youtubeVideoId !== track.youtubeVideoId) {\n      if (await validateYouTubeVideoId(demoMatch.youtubeVideoId)) return demoMatch.youtubeVideoId;\n    }\n\n    try {\n      const result = await searchYouTubeVideos(\`${'${track.title} ${track.artist}'}\`, 3);\n      return result.tracks.find((item) => item.youtubeVideoId)?.youtubeVideoId;\n    } catch {\n      return undefined;\n    }\n  };\n\n  const handlePlayViaYouTube = async (track: Track) => {\n    cyberAudio.pause();\n    setIsPlaying(false);\n    setSeekSeconds(0);\n\n    const youtubeVideoId = await resolvePlayableYouTubeId(track);\n    if (!youtubeVideoId) {\n      if (!findExactAudioUrl(track)) removeUnavailableTrack(track);\n      setComingSoonTitle('Music video unavailable');\n      return;\n    }\n\n    setCurrentTrack({ ...track, youtubeVideoId, source: 'YOUTUBE' });\n    setPlaybackMediaMode('video');\n    setIsNowPlayingOpen(true);\n    setIsPlaying(true);\n  };\n\n  const handleSelectTrack = async (track: Track) => {\n    cyberAudio.pause();\n    setIsPlaying(false);\n    setSeekSeconds(0);\n\n    const resolvedAudioUrl = findExactAudioUrl(track);\n    const youtubeVideoId = await resolvePlayableYouTubeId(track);\n\n    if (!resolvedAudioUrl && !youtubeVideoId) {\n      removeUnavailableTrack(track);\n      setComingSoonTitle('Playback unavailable');\n      return;\n    }\n\n    setCurrentTrack({\n      ...track,\n      audioUrl: resolvedAudioUrl,\n      youtubeVideoId,\n      source: youtubeVideoId ? 'YOUTUBE' : track.source,\n    });\n    setActiveSpotifyPlayerTrack(null);\n    setActiveYouTubePlayerTrack(null);\n    setPlaybackMediaMode(resolvedAudioUrl ? 'audio' : 'video');\n    setIsPlaying(true);\n  };\n\n`;
      code = code.slice(0, oldHandlersStart) + safeHandlers + code.slice(oldHandlersEnd);

      const nextStart = code.indexOf('  const handleNextTrack = () => {');
      const finishAnchor = code.indexOf('  // Complete Onboarding', nextStart);
      if (nextStart === -1 || finishAnchor === -1) {
        throw new Error('[CyberPulse patch] Unable to locate next/previous handlers');
      }
      const nextPrev = `  const handleNextTrack = () => {\n    if (!tracks.length) return;\n    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);\n    const nextIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0;\n    const nextTrack = tracks[nextIndex];\n    if (nextTrack) void handleSelectTrack(nextTrack);\n  };\n\n  const handlePrevTrack = () => {\n    if (!tracks.length) return;\n    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);\n    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;\n    const prevTrack = tracks[prevIndex];\n    if (prevTrack) void handleSelectTrack(prevTrack);\n  };\n\n`;
      code = code.slice(0, nextStart) + nextPrev + code.slice(finishAnchor);

      code = replaceOnce(
        code,
        `        onTogglePlayPause={() => setIsPlaying(!isPlaying)}`,
        `        onTogglePlayPause={togglePlayPause}`,
        'minimized play toggle'
      );

      code = replaceOnce(
        code,
        `  return (\n    <div className={\`relative w-full h-full flex flex-col ${'${bgColor}'} text-[#F7F8FC] select-none overflow-hidden font-sans\`}>`,
        `  return (\n    <div className={\`relative w-full h-full flex flex-col ${'${bgColor}'} text-[#F7F8FC] select-none overflow-hidden font-sans\`}>\n      {!isNowPlayingOpen && isYouTubeActive && effectiveYtId && (\n        <iframe\n          ref={ytIframeRef}\n          src={\`https://www.youtube-nocookie.com/embed/${'${effectiveYtId}'}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&playsinline=1&autoplay=1&origin=${'${encodeURIComponent(typeof window !== \'undefined\' ? window.location.origin : \'\')}'}\`}\n          title={\`${'${currentTrack.title}'} background player\`}\n          className=\"absolute -top-[9999px] left-0 w-1 h-1 opacity-0 pointer-events-none\"\n          allow=\"autoplay; encrypted-media\"\n          onLoad={() => {\n            if (isPlaying) sendYTCommand('playVideo');\n          }}\n        />\n      )}`,
        'background YouTube player'
      );

      code = replaceOnce(
        code,
        `                onClick={() => setPlaybackMediaMode('video')}`,
        `                onClick={() =>\n                  effectiveYtId\n                    ? setPlaybackMediaMode('video')\n                    : setComingSoonTitle('Music video unavailable')\n                }\n                disabled={!effectiveYtId}`,
        'video mode button'
      );

      const oldIframe = `              <iframe\n                ref={ytIframeRef}\n                src={\`https://www.youtube-nocookie.com/embed/${'${effectiveYtId}'}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&autoplay=1&origin=${'${encodeURIComponent('}\n                  typeof window !== 'undefined' ? window.location.origin : ''\n                )}\`}\n                title={currentTrack.title}\n                className=\"w-full h-full border-0 pointer-events-none\"\n                allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"\n                allowFullScreen\n              />`;
      const newIframe = `              {effectiveYtId ? (\n                <iframe\n                  ref={ytIframeRef}\n                  src={\`https://www.youtube-nocookie.com/embed/${'${effectiveYtId}'}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&autoplay=1&origin=${'${encodeURIComponent('}\n                    typeof window !== 'undefined' ? window.location.origin : ''\n                  )}\`}\n                  title={currentTrack.title}\n                  className=\"w-full h-full border-0 pointer-events-none\"\n                  allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"\n                  allowFullScreen\n                  onLoad={() => {\n                    if (isPlaying && playbackMediaMode === 'video') sendYTCommand('playVideo');\n                  }}\n                />\n              ) : (\n                <div className=\"w-full h-full flex items-center justify-center text-xs text-[#9CA3B7]\">\n                  No playable video\n                </div>\n              )}`;
      code = replaceOnce(code, oldIframe, newIframe, 'visible YouTube iframe');

      code = code.replace(
        `          onTogglePlayPause={() => setIsPlaying(!isPlaying)}`,
        `          onTogglePlayPause={togglePlayPause}`
      );

      return { code, map: null };
    }
  };
}

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

      server.middlewares.use('/api/spotify/playlist', async (req, res) => {
        try {
          const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
          let playlistId = (parsedUrl.searchParams.get('id') || '').trim();

          if (playlistId.includes('open.spotify.com/playlist/')) {
            playlistId = playlistId.split('open.spotify.com/playlist/')[1].split('?')[0];
          } else if (playlistId.startsWith('spotify:playlist:')) {
            playlistId = playlistId.replace('spotify:playlist:', '');
          }

          if (!playlistId) {
            return json(res, 400, { error: { message: 'Spotify playlist ID or URL is required' } });
          }

          try {
            const { token } = await getSpotifyToken();
            const spotifyResp = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (spotifyResp.ok) {
              const body = await spotifyResp.text();
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              return res.end(body);
            }
          } catch {
            // If token fails or credentials not configured, fallback to oEmbed
          }

          const oembedResp = await fetch(
            `https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/${playlistId}`
          );
          if (oembedResp.ok) {
            const oembed = (await oembedResp.json()) as any;
            return json(res, 200, {
              id: playlistId,
              name: oembed.title || 'Spotify Playlist',
              description: `Imported Spotify Playlist • Curated by ${oembed.author_name || 'Spotify'}`,
              images: oembed.thumbnail_url ? [{ url: oembed.thumbnail_url }] : [],
              owner: { display_name: oembed.author_name || 'Spotify Curator' },
              tracks: { items: [], total: 0 },
              source: 'oembed',
            });
          }

          json(res, 404, { error: { message: 'Spotify playlist could not be retrieved. Please check the URL or ID.' } });
        } catch (err: any) {
          console.error('[Spotify Playlist Proxy Error]:', err);
          json(res, 500, { error: { message: err?.message || 'Failed to fetch Spotify playlist' } });
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

import type { Plugin } from 'vite';

export function cyberPlayerReliabilityPatch(): Plugin {
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
        `  const effectiveYtId = currentTrack.youtubeVideoId;\n  // One verified YouTube transport remains mounted for Spotify fallback audio/video,\n  // so changing presentation mode never resets playback position.\n  const isYouTubeActive = Boolean(effectiveYtId);`,
        'effective media source'
      );

      code = replaceOnce(
        code,
        `  // Timer interval seekbar jika YouTube aktif\n  useEffect(() => {\n    let interval: any = null;\n    if (isPlaying && isYouTubeActive) {\n      interval = setInterval(() => {\n        setSeekSeconds((prev) => {\n          const max = currentTrack.durationSeconds || 240;\n          return prev >= max ? prev : prev + 1;\n        });\n      }, 1000);\n    }\n    return () => {\n      if (interval) clearInterval(interval);\n    };\n  }, [isPlaying, isYouTubeActive, currentTrack.durationSeconds]);`,
        `  useEffect(() => {\n    if (!isPlaying || !isYouTubeActive) return;\n    const interval = window.setInterval(() => sendYTCommand('getCurrentTime'), 750);\n    return () => window.clearInterval(interval);\n  }, [isPlaying, isYouTubeActive, currentTrack.id]);`,
        'fake seek timer'
      );

      code = replaceOnce(
        code,
        `          const match = DEMO_TRACKS.find(\n            (t) =>\n              t.title.toLowerCase().includes(currentTrack.title.toLowerCase()) ||\n              t.artist.toLowerCase().includes(currentTrack.artist.toLowerCase())\n          );\n          url = match?.audioUrl || DEMO_TRACKS[0].audioUrl;`,
        `          const match = DEMO_TRACKS.find(\n            (t) =>\n              t.id === currentTrack.id ||\n              (t.title.toLowerCase() === currentTrack.title.toLowerCase() &&\n                t.artist.toLowerCase() === currentTrack.artist.toLowerCase())\n          );\n          url = currentTrack.spotifyTrackId ? undefined : match?.audioUrl;`,
        'arbitrary audio fallback'
      );

      code = replaceOnce(
        code,
        `\n        cyberAudio\n          .play(`,
        `\n        if (!url) {\n          setIsPlaying(false);\n          return;\n        }\n\n        cyberAudio\n          .play(`,
        'missing audio guard'
      );
      code = replaceOnce(code, `          .catch(() => {});`, `          .catch(() => setIsPlaying(false));`, 'audio playback failure state');

      const handlersStart = code.indexOf('  const handlePlayViaYouTube = async (track: Track) => {');
      const handlersEnd = code.indexOf('  const handlePlaySpotifyTrackViaYouTube = (spTrack: Track) => {');
      if (handlersStart === -1 || handlersEnd <= handlersStart) throw new Error('[CyberPulse patch] Track handlers not found');

      const safeHandlers = `  const removeUnavailableTrack = (track: Track) => {\n    setTracks((prev) => prev.filter((item) => item.id !== track.id));\n    setYoutubeResults((prev) => prev.filter((item) => item.id !== track.id));\n    setSpotifyResults((prev) => prev.filter((item) => item.id !== track.id));\n  };\n\n  const findFullAudioUrl = (track: Track): string | undefined => {\n    // Spotify Web API preview_url is deliberately excluded: it is not a full song.\n    if (track.spotifyTrackId || track.source === 'SPOTIFY') return undefined;\n    if (track.audioUrl) return track.audioUrl;\n    return DEMO_TRACKS.find((t) =>\n      t.id === track.id ||\n      (t.title.toLowerCase() === track.title.toLowerCase() && t.artist.toLowerCase() === track.artist.toLowerCase())\n    )?.audioUrl;\n  };\n\n  const resolveSpotifyMetadata = async (track: Track): Promise<Track> => {\n    try {\n      const result = await searchSpotifyTracks(\`${'${track.title} ${track.artist}'}\`, 5);\n      const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();\n      const wantedTitle = norm(track.title);\n      const wantedArtist = norm(track.artist.split(',')[0]);\n      const spotify = result.tracks.find((item) =>\n        norm(item.title) === wantedTitle && norm(item.artist).includes(wantedArtist)\n      );\n      if (!spotify) return track;\n      return {\n        ...track,\n        title: spotify.title,\n        artist: spotify.artist,\n        album: spotify.album,\n        artworkUrl: spotify.artworkUrl || track.artworkUrl,\n        durationSeconds: spotify.durationSeconds || track.durationSeconds,\n        audioUrl: undefined,\n        spotifyPreviewUrl: spotify.spotifyPreviewUrl,\n        spotifyTrackId: spotify.spotifyTrackId,\n        spotifyUri: spotify.spotifyUri,\n        externalUrl: spotify.externalUrl,\n        source: 'SPOTIFY',\n      };\n    } catch {\n      return track;\n    }\n  };\n\n  const resolvePlayableYouTubeId = async (track: Track): Promise<string | undefined> => {\n    if (track.source === 'YOUTUBE' && track.youtubeVideoId) return track.youtubeVideoId;\n    if (track.youtubeVideoId && (await validateYouTubeVideoId(track.youtubeVideoId))) return track.youtubeVideoId;\n    try {\n      const result = await searchYouTubeVideos(\`${'${track.title} ${track.artist}'}\`, 5);\n      return result.tracks.find((item) => item.youtubeVideoId)?.youtubeVideoId;\n    } catch {\n      return undefined;\n    }\n  };\n\n  const handlePlayViaYouTube = async (track: Track) => {\n    cyberAudio.pause();\n    setIsPlaying(false);\n    setSeekSeconds(0);\n    const spotifyTrack = await resolveSpotifyMetadata(track);\n    const youtubeVideoId = await resolvePlayableYouTubeId(spotifyTrack);\n    if (!youtubeVideoId) {\n      if (!findFullAudioUrl(spotifyTrack)) removeUnavailableTrack(track);\n      setComingSoonTitle('Music video unavailable');\n      return;\n    }\n    setCurrentTrack({ ...spotifyTrack, youtubeVideoId, source: spotifyTrack.spotifyTrackId ? 'SPOTIFY' : 'YOUTUBE' });\n    setPlaybackMediaMode('video');\n    setIsNowPlayingOpen(true);\n    setIsPlaying(true);\n  };\n\n  const handleSelectTrack = async (track: Track) => {\n    cyberAudio.pause();\n    setIsPlaying(false);\n    setSeekSeconds(0);\n    const spotifyTrack = await resolveSpotifyMetadata(track);\n    const fullAudioUrl = findFullAudioUrl(spotifyTrack);\n    const youtubeVideoId = fullAudioUrl ? undefined : await resolvePlayableYouTubeId(spotifyTrack);\n    if (!fullAudioUrl && !youtubeVideoId) {\n      removeUnavailableTrack(track);\n      setComingSoonTitle('Playback unavailable');\n      return;\n    }\n    setCurrentTrack({ ...spotifyTrack, audioUrl: fullAudioUrl, youtubeVideoId });\n    setActiveSpotifyPlayerTrack(null);\n    setActiveYouTubePlayerTrack(null);\n    setPlaybackMediaMode('audio');\n    setIsPlaying(true);\n  };\n\n`;
      code = code.slice(0, handlersStart) + safeHandlers + code.slice(handlersEnd);

      const nextStart = code.indexOf('  const handleNextTrack = () => {');
      const finishAnchor = code.indexOf('  // Complete Onboarding', nextStart);
      if (nextStart === -1 || finishAnchor === -1) throw new Error('[CyberPulse patch] Next/previous handlers not found');
      const nextPrev = `  const handleNextTrack = () => {\n    if (!tracks.length) return;\n    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);\n    const nextTrack = tracks[currentIndex < tracks.length - 1 ? currentIndex + 1 : 0];\n    if (nextTrack) void handleSelectTrack(nextTrack);\n  };\n\n  const handlePrevTrack = () => {\n    if (!tracks.length) return;\n    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);\n    const prevTrack = tracks[currentIndex > 0 ? currentIndex - 1 : tracks.length - 1];\n    if (prevTrack) void handleSelectTrack(prevTrack);\n  };\n\n`;
      code = code.slice(0, nextStart) + nextPrev + code.slice(finishAnchor);

      code = code.replace(`        onTogglePlayPause={() => setIsPlaying(!isPlaying)}`, `        onTogglePlayPause={togglePlayPause}`);
      code = code.replace(`          onTogglePlayPause={() => setIsPlaying(!isPlaying)}`, `          onTogglePlayPause={togglePlayPause}`);

      code = replaceOnce(
        code,
        `  return (\n    <div className={\`relative w-full h-full flex flex-col ${'${bgColor}'} text-[#F7F8FC] select-none overflow-hidden font-sans\`}>`,
        `  return (\n    <div className={\`relative w-full h-full flex flex-col ${'${bgColor}'} text-[#F7F8FC] select-none overflow-hidden font-sans\`}>\n      {!isNowPlayingOpen && isYouTubeActive && effectiveYtId && (\n        <iframe ref={ytIframeRef} src={\`https://www.youtube-nocookie.com/embed/${'${effectiveYtId}'}?enablejsapi=1&controls=0&rel=0&playsinline=1&autoplay=1&origin=${'${encodeURIComponent(typeof window !== \'undefined\' ? window.location.origin : \'\')}'}\`} title={\`${'${currentTrack.title}'} background player\`} className=\"absolute -top-[9999px] left-0 w-1 h-1 opacity-0 pointer-events-none\" allow=\"autoplay; encrypted-media\" onLoad={() => { if (seekSeconds > 0) sendYTCommand('seekTo', [seekSeconds, true]); if (isPlaying) sendYTCommand('playVideo'); }} />\n      )}`,
        'background YouTube player'
      );

      code = replaceOnce(
        code,
        `                onClick={() => setPlaybackMediaMode('video')}`,
        `                onClick={() => effectiveYtId ? setPlaybackMediaMode('video') : setComingSoonTitle('Music video unavailable')}\n                disabled={!effectiveYtId}`,
        'video mode button'
      );

      const oldIframe = `              <iframe\n                ref={ytIframeRef}\n                src={\`https://www.youtube-nocookie.com/embed/${'${effectiveYtId}'}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&autoplay=1&origin=${'${encodeURIComponent('}\n                  typeof window !== 'undefined' ? window.location.origin : ''\n                )}\`}\n                title={currentTrack.title}\n                className=\"w-full h-full border-0 pointer-events-none\"\n                allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"\n                allowFullScreen\n              />`;
      const newIframe = `              {effectiveYtId ? (\n                <iframe ref={ytIframeRef} src={\`https://www.youtube-nocookie.com/embed/${'${effectiveYtId}'}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&autoplay=1&origin=${'${encodeURIComponent(typeof window !== \'undefined\' ? window.location.origin : \'\')}'}\`} title={currentTrack.title} className=\"w-full h-full border-0 pointer-events-none\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowFullScreen onLoad={() => { if (seekSeconds > 0) sendYTCommand('seekTo', [seekSeconds, true]); if (isPlaying) sendYTCommand('playVideo'); }} />\n              ) : (\n                <div className=\"w-full h-full flex items-center justify-center text-xs text-[#9CA3B7]\">No playable video</div>\n              )}`;
      code = replaceOnce(code, oldIframe, newIframe, 'visible YouTube iframe');

      return { code, map: null };
    }
  };
}

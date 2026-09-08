import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Search,
  Compass,
  Library,
  User,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Maximize2,
  Check,
  Bell,
  Sparkles,
  Sliders,
  Shield,
  BarChart2,
  Plus,
  ArrowLeft,
  X,
  Radio,
  FileText,
  ListMusic,
  Wifi,
  WifiOff,
  CloudOff,
  Layers,
  Youtube,
  ExternalLink,
  Loader2,
  Music,
  AlertCircle,
  Volume2,
  Video,
  Music2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Track,
  Artist,
  Album,
  Playlist,
  ScreenType,
  CyberTheme,
  AppPreferences,
  SearchFilter
} from '../types';
import {
  DEMO_TRACKS,
  DEMO_ARTISTS,
  DEMO_ALBUMS,
  DEMO_PLAYLISTS,
  GENRE_OPTIONS,
  BROWSE_CATEGORIES,
  EXPLORE_MOODS,
  DEFAULT_PROFILE
} from '../data/mockData';
import { CyberArtwork } from './CyberArtwork';
import { ArtistDetailView } from './ArtistDetailView';
import { AlbumDetailView } from './AlbumDetailView';
import { PlaylistDetailView } from './PlaylistDetailView';
import { CyberDjView } from './CyberDjView';
import { AiPlaylistView } from './AiPlaylistView';
import { VisualizerPreview } from './VisualizerPreview';
import { LyricsPreview } from './LyricsPreview';
import { cyberAudio } from '../utils/cyberAudioEngine';
import { searchYouTubeVideos } from '../services/youtubeService';
import { searchSpotifyTracks, getSpotifyEmbedUrl } from '../services/spotifyService';
import { SpotifyPlayerModal } from './SpotifyPlayerModal';
import { SpotifyImportModal } from './SpotifyImportModal';
import { AndroidHomeScreen } from './AndroidHomeScreen';
import { SettingsView } from './SettingsView';
import { LikedSongsView } from './LikedSongsView';
import { ListeningStatsView } from './ListeningStatsView';
import { SubscriptionModal } from './SubscriptionModal';
import { SectionDetailView, SectionDetailConfig } from './SectionDetailView';

interface CyberPulseAppProps {
  isTabletView?: boolean;
  preferences: AppPreferences;
  onUpdatePreferences: (prefs: Partial<AppPreferences>) => void;
  isAppMinimized?: boolean;
  onToggleMinimize?: () => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}

export const CyberPulseApp: React.FC<CyberPulseAppProps> = ({
  isTabletView = false,
  preferences,
  onUpdatePreferences,
  isAppMinimized = false,
  onToggleMinimize,
  onPlaybackStateChange,
}) => {
  // Navigation & Screen State
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(
    preferences.isOnboardingCompleted ? 'home' : 'onboarding'
  );
  const [displayName, setDisplayName] = useState<string>(() => {
    return localStorage.getItem('sona_display_name') || 'Sona Listener';
  });
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isProUser, setIsProUser] = useState<boolean>(() => {
    return localStorage.getItem('sona_is_pro') === 'true';
  });
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('ALL');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [previousScreen, setPreviousScreen] = useState<ScreenType>('home');
  const [sectionDetailConfig, setSectionDetailConfig] = useState<SectionDetailConfig | null>(null);

  const handleOpenSection = (config: SectionDetailConfig) => {
    setPreviousScreen(currentScreen);
    setSectionDetailConfig(config);
    setCurrentScreen('section_detail');
  };

  // Onboarding internal step (1 to 6)
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(preferences.selectedGenres || []);
  const [selectedArtists, setSelectedArtists] = useState<string[]>(preferences.selectedArtists || []);
  const [personalizationEnabled, setPersonalizationEnabled] = useState<boolean>(true);

  // Music State
  const [tracks, setTracks] = useState<Track[]>(DEMO_TRACKS);

  // Playlists State with LocalStorage Persistence for Spotify imports
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('sona_custom_playlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: any) => p.id));
          return [...parsed, ...DEMO_PLAYLISTS.filter((p) => !existingIds.has(p.id))];
        }
      }
    } catch {
      // ignore
    }
    return DEMO_PLAYLISTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('sona_custom_playlists', JSON.stringify(playlists));
    } catch {
      // ignore
    }
  }, [playlists]);

  const [isSpotifyImportOpen, setIsSpotifyImportOpen] = useState<boolean>(false);
  const [spotifyImportToast, setSpotifyImportToast] = useState<string | null>(null);

  const handlePlaylistImported = (importedPlaylist: Playlist) => {
    setPlaylists((prev) => [importedPlaylist, ...prev.filter((p) => p.id !== importedPlaylist.id)]);
    if (importedPlaylist.tracks && importedPlaylist.tracks.length > 0) {
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newOnes = importedPlaylist.tracks!.filter((t) => !existingIds.has(t.id));
        return [...newOnes, ...prev];
      });
    }
    setSelectedPlaylistId(importedPlaylist.id);
    setCurrentScreen('playlist_detail');
    setSpotifyImportToast(`Playlist "${importedPlaylist.title}" was successfully imported from Spotify!`);
    setTimeout(() => setSpotifyImportToast(null), 4500);
  };

  const [currentTrack, setCurrentTrack] = useState<Track>(DEMO_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [seekSeconds, setSeekSeconds] = useState<number>(0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  // Mini player visibility: Only show once user has explicitly initiated playback
  const [hasStartedPlayback, setHasStartedPlayback] = useState<boolean>(false);

  // Inform parent of playback changes
  useEffect(() => {
    onPlaybackStateChange?.(isPlaying);
    if (isPlaying) {
      setHasStartedPlayback(true);
    }
  }, [isPlaying, onPlaybackStateChange]);

  // 2 Main Player Modes: 'audio' (Audio Only) vs 'video' (Music Video)
  // Default to 'audio' mode to avoid forcing video playback on song changes
  const [playbackMediaMode, setPlaybackMediaMode] = useState<'audio' | 'video'>('audio');
  // Sub-options during Audio Only: 'artwork' | 'visualizer' | 'lyrics'
  const [audioVisualMode, setAudioVisualMode] = useState<'artwork' | 'visualizer' | 'lyrics'>('artwork');

  // Strict integer-formatted clock helper (avoids ugly decimal fractions from YouTube metadata)
  const formatClock = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const total = Math.floor(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Ref to control the unified YouTube Player IFrame
  const ytIframeRef = useRef<HTMLIFrameElement>(null);

  // Derive matched YouTube video ID for full-length streaming
  const effectiveYtId =
    currentTrack.youtubeVideoId ||
    DEMO_TRACKS.find(
      (t) =>
        t.id === currentTrack.id ||
        t.title.toLowerCase() === currentTrack.title.toLowerCase() ||
        (currentTrack.spotifyTrackId && t.spotifyTrackId === currentTrack.spotifyTrackId)
    )?.youtubeVideoId ||
    '4NRXx6U8ABQ';

  // Unified audio/video stream is active so audio is never stopped or restarted when toggling modes
  const isYouTubeActive = true;

  // Send command directly to YouTube iframe
  const sendYTCommand = (func: string, args: any[] = []) => {
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      try {
        ytIframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func,
            args,
          }),
          '*'
        );
      } catch (err) {
        console.error('Failed to send YT command', err);
      }
    }
  };

  // Play/Pause contextual controller for streaming player
  const togglePlayPause = () => {
    if (isYouTubeActive) {
      if (isPlaying) {
        sendYTCommand('pauseVideo');
        setIsPlaying(false);
      } else {
        sendYTCommand('setPlaybackQuality', ['medium']);
        sendYTCommand('setPlaybackQualityRange', ['small', 'medium']);
        sendYTCommand('playVideo');
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Seekbar control
  const handleSeek = (newSeconds: number) => {
    setSeekSeconds(newSeconds);
    if (isYouTubeActive) {
      sendYTCommand('seekTo', [newSeconds, true]);
    } else {
      cyberAudio.seek(newSeconds);
    }
  };

  // Listen to message events from YouTube iframe
  useEffect(() => {
    const handleYTMessage = (event: MessageEvent) => {
      if (!event.data) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.event === 'onReady') {
          // Enforce 360p or 480p stream quality immediately on load for ultra-fast switching
          sendYTCommand('setPlaybackQuality', ['medium']);
          sendYTCommand('setPlaybackQualityRange', ['small', 'medium']);
        }
        if (data.event === 'onStateChange') {
          // 1: PLAYING, 2: PAUSED, 0: ENDED
          if (data.info === 1) {
            setIsPlaying(true);
            sendYTCommand('setPlaybackQuality', ['medium']);
            sendYTCommand('setPlaybackQualityRange', ['small', 'medium']);
          } else if (data.info === 2) {
            setIsPlaying(false);
          } else if (data.info === 0) {
            if (isRepeat) {
              sendYTCommand('seekTo', [0, true]);
              sendYTCommand('playVideo');
            } else {
              handleNextTrack();
            }
          }
        }
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setSeekSeconds(Math.floor(data.info.currentTime));
          }
        }
      } catch {
        // Abaikan mesej bukan JSON
      }
    };
    window.addEventListener('message', handleYTMessage);
    return () => window.removeEventListener('message', handleYTMessage);
  }, [isRepeat]);

  // Timer interval seekbar jika YouTube aktif
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && isYouTubeActive) {
      interval = setInterval(() => {
        setSeekSeconds((prev) => {
          const max = currentTrack.durationSeconds || 240;
          return prev >= max ? prev : prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isYouTubeActive, currentTrack.durationSeconds]);

  // Sync actual audio playback: jeda audio engine jika YouTube sedang aktif agar tiada pertindihan bunyi
  useEffect(() => {
    if (isYouTubeActive) {
      cyberAudio.pause();
      if (isPlaying) {
        sendYTCommand('playVideo');
      } else {
        sendYTCommand('pauseVideo');
      }
    } else {
      if (isPlaying) {
        let url = currentTrack.audioUrl;
        if (!url) {
          const match = DEMO_TRACKS.find(
            (t) =>
              t.title.toLowerCase().includes(currentTrack.title.toLowerCase()) ||
              t.artist.toLowerCase().includes(currentTrack.artist.toLowerCase())
          );
          url = match?.audioUrl || DEMO_TRACKS[0].audioUrl;
        }

        cyberAudio
          .play(
            url,
            {
              title: currentTrack.title,
              artist: currentTrack.artist,
              album: currentTrack.album,
              artworkUrl: currentTrack.artworkUrl,
              durationSeconds: currentTrack.durationSeconds,
            },
            (secs) => setSeekSeconds(secs),
            () => {
              if (isRepeat) {
                cyberAudio.seek(0);
              } else {
                handleNextTrack();
              }
            }
          )
          .catch(() => {});
      } else {
        cyberAudio.pause();
      }
    }
  }, [isPlaying, currentTrack.id, isYouTubeActive]);

  // Register MediaSession hardware/OS action handlers for background playback
  useEffect(() => {
    cyberAudio.setMediaSessionHandlers({
      onPlay: () => togglePlayPause(),
      onPause: () => togglePlayPause(),
      onNextTrack: () => handleNextTrack(),
      onPrevTrack: () => handlePrevTrack(),
      onSeek: (secs) => handleSeek(secs),
    });
  }, [currentTrack, tracks, isYouTubeActive, isPlaying]);

  // Modals & Sheets
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [comingSoonTitle, setComingSoonTitle] = useState<string | null>(null);
  const [showLyricsModal, setShowLyricsModal] = useState<boolean>(false);
  const [showQueueModal, setShowQueueModal] = useState<boolean>(false);

  // Block 9A: Visualizer & Synced Lyrics State
  const [visualizerMode, setVisualizerMode] = useState<
    'NEON_WAVE' | 'SPECTRUM_PULSE' | 'CYBER_GRID' | 'ORBITAL_PULSE' | 'PARTICLE_FLOW'
  >('NEON_WAVE');
  const [showProLockToast, setShowProLockToast] = useState<boolean>(false);
  const [lyricsAutoScroll, setLyricsAutoScroll] = useState<boolean>(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [youtubeResults, setYoutubeResults] = useState<Track[]>([]);
  const [isSearchingYoutube, setIsSearchingYoutube] = useState<boolean>(false);
  const [youtubeSearchError, setYoutubeSearchError] = useState<string | null>(null);
  const [activeYouTubePlayerTrack, setActiveYouTubePlayerTrack] = useState<Track | null>(null);

  // Spotify Web API Search State (180-day key)
  const [spotifyResults, setSpotifyResults] = useState<Track[]>([]);
  const [isSearchingSpotify, setIsSearchingSpotify] = useState<boolean>(false);
  const [spotifySearchError, setSpotifySearchError] = useState<string | null>(null);
  const [activeSpotifyPlayerTrack, setActiveSpotifyPlayerTrack] = useState<Track | null>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>([
    'The Weeknd',
    'Blinding Lights',
    'Kavinsky',
    'Nightcall',
    'Daft Punk',
  ]);

  // Live YouTube search debounce effect
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setYoutubeResults([]);
      setIsSearchingYoutube(false);
      setYoutubeSearchError(null);
      return;
    }

    if (searchFilter === 'YOUTUBE' || searchFilter === 'ALL') {
      setIsSearchingYoutube(true);
      setYoutubeSearchError(null);
      const timer = setTimeout(() => {
        searchYouTubeVideos(query)
          .then((res) => {
            setYoutubeResults(res.tracks);
            if (res.error) setYoutubeSearchError(res.error);
          })
          .catch((err) => setYoutubeSearchError(err?.message || 'Error querying YouTube'))
          .finally(() => setIsSearchingYoutube(false));
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setYoutubeResults([]);
    }
  }, [searchQuery, searchFilter]);

  // Live Spotify search debounce effect (Client Credentials 180-day key)
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSpotifyResults([]);
      setIsSearchingSpotify(false);
      setSpotifySearchError(null);
      return;
    }

    if (searchFilter === 'SPOTIFY' || searchFilter === 'ALL') {
      setIsSearchingSpotify(true);
      setSpotifySearchError(null);
      const timer = setTimeout(() => {
        searchSpotifyTracks(query)
          .then((res) => {
            setSpotifyResults(res.tracks);
            if (res.error) setSpotifySearchError(res.error);
          })
          .catch((err) => setSpotifySearchError(err?.message || 'Error querying Spotify'))
          .finally(() => setIsSearchingSpotify(false));
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setSpotifyResults([]);
    }
  }, [searchQuery, searchFilter]);

  // Greeting based on time
  const [greeting, setGreeting] = useState<string>('Good Evening');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) setGreeting('Good Morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // When preferences change onboarding completed status externally
  useEffect(() => {
    if (!preferences.isOnboardingCompleted) {
      setCurrentScreen('onboarding');
      setOnboardingStep(1);
    }
  }, [preferences.isOnboardingCompleted]);

  // Toggle Track Like
  const handleToggleLike = (trackId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isLiked: !t.isLiked } : t))
    );
    if (currentTrack.id === trackId) {
      setCurrentTrack((prev) => ({ ...prev, isLiked: !prev.isLiked }));
    }
  };

  const handlePlayViaYouTube = async (track: Track) => {
    // Stop local audio engine to prevent sound collision
    cyberAudio.pause();
    setIsPlaying(false);

    let ytTrack: Track = { ...track };

    // Resolve YouTube video ID if not already present
    if (!ytTrack.youtubeVideoId) {
      const match = DEMO_TRACKS.find(
        (t) =>
          t.id === track.id ||
          t.title.toLowerCase() === track.title.toLowerCase() ||
          t.artist.toLowerCase() === track.artist.toLowerCase()
      );
      if (match?.youtubeVideoId) {
        ytTrack.youtubeVideoId = match.youtubeVideoId;
      } else {
        try {
          const res = await searchYouTubeVideos(`${track.title} ${track.artist}`, 1);
          if (res.tracks.length > 0 && res.tracks[0].youtubeVideoId) {
            ytTrack.youtubeVideoId = res.tracks[0].youtubeVideoId;
          }
        } catch (err) {
          console.error('Error resolving YouTube video ID:', err);
        }
      }
    }

    if (!ytTrack.youtubeVideoId) {
      ytTrack.youtubeVideoId = '4NRXx6U8ABQ';
    }

    const resolvedTrack: Track = {
      ...ytTrack,
      source: 'YOUTUBE',
    };

    setCurrentTrack(resolvedTrack);
    setSeekSeconds(0);
    // Respect current playbackMediaMode (stay in audio mode if already in audio mode)
    setHasStartedPlayback(true);
    setIsNowPlayingOpen(true);
    setIsPlaying(true);
    sendYTCommand('setPlaybackQuality', ['medium']);
  };

  const handleSelectTrack = async (track: Track) => {
    let resolvedAudioUrl = track.audioUrl;
    if (!resolvedAudioUrl) {
      const match = DEMO_TRACKS.find(
        (t) =>
          t.title.toLowerCase().includes(track.title.toLowerCase()) ||
          t.artist.toLowerCase().includes(track.artist.toLowerCase())
      );
      resolvedAudioUrl = match?.audioUrl || DEMO_TRACKS[0].audioUrl;
    }

    const matchYt = DEMO_TRACKS.find(
      (t) =>
        t.id === track.id ||
        t.title.toLowerCase() === track.title.toLowerCase() ||
        (track.spotifyTrackId && t.spotifyTrackId === track.spotifyTrackId)
    );

    const initialYtId = track.youtubeVideoId || matchYt?.youtubeVideoId;

    const playableTrack: Track = {
      ...track,
      audioUrl: resolvedAudioUrl,
      youtubeVideoId: initialYtId || '4NRXx6U8ABQ',
      source: 'YOUTUBE',
    };

    setHasStartedPlayback(true);
    setCurrentTrack(playableTrack);
    setSeekSeconds(0);
    setActiveSpotifyPlayerTrack(null);
    setActiveYouTubePlayerTrack(null);
    setIsPlaying(true);
    sendYTCommand('setPlaybackQuality', ['medium']);

    // If no exact YouTube ID was found and track is from Spotify/Search, query YouTube in background for full song
    if (!initialYtId) {
      try {
        const ytRes = await searchYouTubeVideos(`${track.title} ${track.artist}`, 1);
        if (ytRes.tracks.length > 0 && ytRes.tracks[0].youtubeVideoId) {
          const matchedId = ytRes.tracks[0].youtubeVideoId;
          setCurrentTrack((prev) => {
            if (prev.id === track.id || prev.title.toLowerCase() === track.title.toLowerCase()) {
              return { ...prev, youtubeVideoId: matchedId, source: 'YOUTUBE' };
            }
            return prev;
          });
          sendYTCommand('setPlaybackQuality', ['medium']);
        }
      } catch (err) {
        console.error('Error fetching full YouTube stream for Spotify track:', err);
      }
    }
  };

  const handlePlaySpotifyTrackViaYouTube = (spTrack: Track) => {
    handlePlayViaYouTube(spTrack);
  };

  const handleNextTrack = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0;
    const nextTrack = tracks[nextIndex] || tracks[0];
    const matchYt = DEMO_TRACKS.find(
      (t) => t.id === nextTrack.id || t.title.toLowerCase() === nextTrack.title.toLowerCase()
    );

    const effectiveId = nextTrack.youtubeVideoId || matchYt?.youtubeVideoId || '4NRXx6U8ABQ';

    setHasStartedPlayback(true);
    setCurrentTrack({
      ...nextTrack,
      youtubeVideoId: effectiveId,
      source: 'YOUTUBE',
    });
    setSeekSeconds(0);
    setIsPlaying(true);
    // Keep YouTube stream locked to 360p/480p for fast low-bandwidth switching
    sendYTCommand('setPlaybackQuality', ['medium']);
    sendYTCommand('playVideo');
  };

  const handlePrevTrack = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
    const prevTrack = tracks[prevIndex] || tracks[0];
    const matchYt = DEMO_TRACKS.find(
      (t) => t.id === prevTrack.id || t.title.toLowerCase() === prevTrack.title.toLowerCase()
    );

    const effectiveId = prevTrack.youtubeVideoId || matchYt?.youtubeVideoId || '4NRXx6U8ABQ';

    setHasStartedPlayback(true);
    setCurrentTrack({
      ...prevTrack,
      youtubeVideoId: effectiveId,
      source: 'YOUTUBE',
    });
    setSeekSeconds(0);
    setIsPlaying(true);
    // Keep YouTube stream locked to 360p/480p for fast low-bandwidth switching
    sendYTCommand('setPlaybackQuality', ['medium']);
    sendYTCommand('playVideo');
  };

  // Complete Onboarding
  const handleFinishOnboarding = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00F5FF', '#8B5CFF', '#FF2ED1', '#B8FF2C'],
    });
    onUpdatePreferences({
      isOnboardingCompleted: true,
      selectedGenres,
      selectedArtists,
      recommendationsEnabled: personalizationEnabled,
    });
    setCurrentScreen('home');
  };

  // Search filtering across entities
  const filteredTracks = searchQuery.trim()
    ? (tracks || []).filter(
        (t) =>
          t?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t?.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t?.album?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredArtists = searchQuery.trim()
    ? (DEMO_ARTISTS || []).filter(
        (a) =>
          a?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a?.genres || []).some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const filteredAlbums = searchQuery.trim()
    ? (DEMO_ALBUMS || []).filter(
        (al) =>
          al?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          al?.artist?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredPlaylists = searchQuery.trim()
    ? (playlists || []).filter(
        (p) =>
          p?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const isLight = preferences.theme === 'pure_light';
  const nrcAccent = preferences.nrcAccent || 'neon_green';
  const nrcAccentHex =
    nrcAccent === 'purple_magic'
      ? '#B026FF'
      : nrcAccent === 'electric_blue'
      ? '#00E5FF'
      : '#CCFF00';

  const bgColor = isLight ? 'bg-white' : 'bg-[#000000]';
  const cardBgColor = isLight
    ? 'bg-slate-50 border border-slate-200'
    : 'bg-[#121214] border border-[#242428]';

  // Navigation Items
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (isAppMinimized) {
    return (
      <AndroidHomeScreen
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        seekSeconds={seekSeconds}
        onTogglePlayPause={() => setIsPlaying(!isPlaying)}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
        onResumeApp={() => onToggleMinimize?.()}
      />
    );
  }

  return (
    <div className={`relative w-full h-full flex flex-col ${bgColor} ${isLight ? 'text-slate-900' : 'text-[#F7F8FC]'} select-none overflow-hidden font-sans`}>
      {/* Ambient Lighting Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{
            backgroundColor: isLight ? '#0ea5e9' : nrcAccentHex,
            opacity: isLight ? 0.04 : 0.08,
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[150px]"
          style={{
            backgroundColor: isLight ? '#6366f1' : nrcAccentHex,
            opacity: isLight ? 0.04 : 0.08,
          }}
        />
      </div>

      {/* Main App Canvas (with optional Tablet NavRail) */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Tablet Adaptive Navigation Rail with Frosted Glass */}
        {isTabletView && currentScreen !== 'onboarding' && (
          <aside className="w-20 border-r border-[#171B28] bg-[#10131C]/95 backdrop-blur-xl flex flex-col items-center py-6 z-20 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5FF] to-[#8B5CFF] flex items-center justify-center mb-8 shadow-lg shadow-[#00F5FF]/20">
              <Radio className="w-5 h-5 text-black" />
            </div>
            <nav className="flex flex-col gap-5 w-full px-2">
              {navItems.map(({ id, label, icon: IconComponent }) => {
                const active = currentScreen === id;
                return (
                  <button
                    key={id}
                    onClick={() => setCurrentScreen(id as ScreenType)}
                    className={`flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all ${
                      active
                        ? 'text-[#00F5FF] bg-[#00F5FF]/15 font-black uppercase tracking-widest'
                        : 'text-[#61697C] hover:text-[#9CA3B7] hover:bg-white/5 font-black uppercase tracking-widest'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-[9px] tracking-tight">{label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto">
              <button
                onClick={() => setCurrentScreen('settings')}
                className={`p-2 rounded-xl transition-colors ${
                  currentScreen === 'settings' ? 'text-[#00F5FF] bg-[#00F5FF]/10' : 'text-[#61697C] hover:text-[#9CA3B7]'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </aside>
        )}

        {/* Dynamic Screen View */}
        <main className={`flex-1 overflow-y-auto flex flex-col relative ${hasStartedPlayback ? 'pb-36' : 'pb-24'}`}>
          {/* SCREEN: ONBOARDING */}
          {currentScreen === 'onboarding' && (
            <div className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full justify-between">
              {/* Progress Steps */}
              <div className="flex items-center gap-1.5 pt-2 pb-6">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      step <= onboardingStep ? 'bg-[#00F5FF] shadow-[0_0_8px_#00F5FF]' : 'bg-[#171B28]'
                    }`}
                  />
                ))}
              </div>

              {/* Step 1: Welcome */}
              {onboardingStep === 1 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#10131C] to-[#07090F] border border-[#00F5FF]/50 flex items-center justify-center shadow-2xl shadow-[#00F5FF]/30 backdrop-blur-xl">
                      <Radio className="w-12 h-12 text-[#00F5FF]" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF2ED1] text-black font-black rounded-full flex items-center justify-center text-[10px] shadow-md shadow-[#FF2ED1]/40">
                      1.0
                    </div>
                  </div>
                  <h1 className="text-3xl font-black uppercase text-[#F7F8FC] tracking-tight mb-3">
                    Your Music. Your Universe.
                  </h1>
                  <p className="text-[#9CA3B7] text-sm max-w-xs leading-relaxed mb-8">
                    “Discover, organize and experience music in a whole new way.”
                  </p>
                  <button
                    onClick={() => setOnboardingStep(2)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#00F5FF] text-[#07090F] font-black uppercase tracking-wider text-xs shadow-lg shadow-[#00F5FF]/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 2: Genres */}
              {onboardingStep === 2 && (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-2xl font-black uppercase text-[#F7F8FC] mb-1">What moves you?</h2>
                  <p className="text-xs text-[#9CA3B7] mb-5">Select the genres that define your soundscape.</p>
                  <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-2 mb-6 max-h-[440px]">
                    {GENRE_OPTIONS.map((genre) => {
                      const isSelected = selectedGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          onClick={() => {
                            setSelectedGenres((prev) =>
                              prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
                            );
                          }}
                          className={`p-3 rounded-xl border text-left text-xs font-bold uppercase transition-all backdrop-blur-md cursor-pointer ${
                            isSelected
                              ? 'border-[#00F5FF] bg-[#00F5FF]/15 text-[#00F5FF] shadow-sm shadow-[#00F5FF]/20'
                              : 'border-[#171B28] bg-[#10131C]/80 text-[#9CA3B7] hover:border-[#00F5FF]/40 hover:text-[#F7F8FC]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{genre}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#00F5FF]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setOnboardingStep(3)}
                      className="flex-1 py-3 rounded-xl border border-[#171B28] bg-[#10131C]/60 text-[#9CA3B7] text-xs font-bold uppercase hover:text-white"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => setOnboardingStep(3)}
                      className="flex-[2] py-3 rounded-xl bg-[#00F5FF] text-[#07090F] text-xs font-black uppercase tracking-wider shadow-md shadow-[#00F5FF]/20 cursor-pointer"
                    >
                      Continue ({selectedGenres.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Artists */}
              {onboardingStep === 3 && (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-2xl font-black uppercase text-[#F7F8FC] mb-1">Favorite Artists</h2>
                  <p className="text-xs text-[#9CA3B7] mb-5">Select sonic architects to calibrate recommendations.</p>
                  <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 mb-6 max-h-[440px]">
                    {DEMO_ARTISTS.map((artist) => {
                      const isSelected = selectedArtists.includes(artist.id);
                      return (
                        <div
                          key={artist.id}
                          onClick={() => {
                            setSelectedArtists((prev) =>
                              prev.includes(artist.id) ? prev.filter((a) => a !== artist.id) : [...prev, artist.id]
                            );
                          }}
                          className={`p-3 rounded-2xl border text-center flex flex-col items-center cursor-pointer transition-all backdrop-blur-md ${
                            isSelected
                              ? 'border-[#00F5FF] bg-[#00F5FF]/10 text-white shadow-lg shadow-[#00F5FF]/10'
                              : 'border-[#171B28] bg-[#10131C]/80 text-[#9CA3B7] hover:border-[#00F5FF]/40'
                          }`}
                        >
                          <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-white/10 relative shadow-md shadow-black">
                            <CyberArtwork keyName={artist.artworkKey} artworkUrl={artist.artworkUrl} />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#00F5FF]/40 flex items-center justify-center">
                                <Check className="w-6 h-6 text-black stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-bold text-[#F7F8FC]">{artist.name}</span>
                          <span className="text-[10px] text-[#9CA3B7] uppercase tracking-tight">{artist.genres.join(' • ')}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setOnboardingStep(4)}
                      className="flex-1 py-3 rounded-xl border border-[#171B28] bg-[#10131C]/60 text-[#9CA3B7] text-xs font-bold uppercase"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => setOnboardingStep(4)}
                      className="flex-[2] py-3 rounded-xl bg-[#00F5FF] text-[#07090F] text-xs font-black uppercase tracking-wider shadow-md shadow-[#00F5FF]/20 cursor-pointer"
                    >
                      Continue ({selectedArtists.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Personalization */}
              {onboardingStep === 4 && (
                <div className="flex-1 flex flex-col justify-between py-4">
                  <div>
                    <h2 className="text-2xl font-black uppercase text-[#F7F8FC] mb-2">Personalization</h2>
                    <p className="text-sm text-[#9CA3B7] leading-relaxed mb-8">
                      “Sona will use your listening activity to improve recommendations.”
                    </p>
                    <div className="p-4 rounded-2xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-xl flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold uppercase text-[#F7F8FC]">Personalized Recommendations</div>
                        <div className="text-xs text-[#9CA3B7] max-w-[240px]">
                          Calibrate algorithmic radio, discover mixes, and dynamic queues.
                        </div>
                      </div>
                      <button
                        onClick={() => setPersonalizationEnabled(!personalizationEnabled)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          personalizationEnabled ? 'bg-[#00F5FF]' : 'bg-[#171B28]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-[#07090F] transition-transform ${
                            personalizationEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setOnboardingStep(5)}
                    className="w-full py-3.5 rounded-2xl bg-[#00F5FF] text-[#07090F] font-black uppercase tracking-wider text-xs shadow-md shadow-[#00F5FF]/20 cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* Step 5: Notifications */}
              {onboardingStep === 5 && (
                <div className="flex-1 flex flex-col items-center justify-between py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#8B5CFF]/15 border border-[#8B5CFF] flex items-center justify-center my-6 shadow-lg shadow-[#8B5CFF]/20">
                    <Bell className="w-8 h-8 text-[#8B5CFF]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase text-[#F7F8FC] mb-2">Stay in the Loop</h2>
                    <p className="text-sm text-[#9CA3B7] max-w-xs mx-auto">
                      “Get updates about new music and playlists.”
                    </p>
                  </div>
                  <div className="w-full flex flex-col gap-2.5">
                    <button
                      onClick={() => {
                        onUpdatePreferences({ notificationsEnabled: true });
                        setOnboardingStep(6);
                      }}
                      className="w-full py-3.5 rounded-2xl bg-[#00F5FF] text-[#07090F] font-black uppercase tracking-wider text-xs shadow-md shadow-[#00F5FF]/20 cursor-pointer"
                    >
                      Enable Notifications
                    </button>
                    <button
                      onClick={() => {
                        onUpdatePreferences({ notificationsEnabled: false });
                        setOnboardingStep(6);
                      }}
                      className="w-full py-3 rounded-2xl border border-[#171B28] bg-[#10131C]/60 text-[#9CA3B7] font-bold uppercase text-xs hover:text-white"
                    >
                      Not Now
                    </button>
                  </div>
                </div>
              )}

              {/* Step 6: Ready */}
              {onboardingStep === 6 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00F5FF] to-[#8B5CFF] flex items-center justify-center mb-6 shadow-2xl shadow-[#00F5FF]/40">
                    <Sparkles className="w-10 h-10 text-black" />
                  </div>
                  <h2 className="text-3xl font-black uppercase text-[#F7F8FC] mb-2">You're ready.</h2>
                  <p className="text-sm text-[#9CA3B7] max-w-xs mb-8">
                    Your Sona engine is calibrated. Immerse into the frequency of sound.
                  </p>
                  <button
                    onClick={handleFinishOnboarding}
                    className="w-full py-3.5 rounded-2xl bg-[#00F5FF] text-[#07090F] font-black uppercase tracking-wider text-xs shadow-lg shadow-[#00F5FF]/30 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Enter Sona</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SCREEN: HOME */}
          {currentScreen === 'home' && (
            <div className="p-4 space-y-6">
              {/* Dynamic Frosted Header */}
              <header className="flex items-center justify-between pb-3 border-b border-[#171B28]">
                <div className="flex flex-col">
                  <span className="text-[#9CA3B7] text-xs font-bold tracking-widest uppercase">{greeting}</span>
                  <h1 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-[#CCFF00]'}`}>
                    {displayName.toUpperCase()}
                  </h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {onToggleMinimize && (
                    <button
                      onClick={onToggleMinimize}
                      className={`p-2 rounded-full border transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                          : 'bg-[#10131C] border-[#171B28] text-[#9CA3B7] hover:text-[#CCFF00]'
                      }`}
                      title="Minimize App (Test Background Playback)"
                    >
                      <Home className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentScreen('settings')}
                    className={`p-2 rounded-full border transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                        : 'bg-[#10131C] border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC]'
                    }`}
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentScreen('profile')}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-lg cursor-pointer transition-colors ${
                      isLight
                        ? 'bg-slate-100 border-slate-300 hover:border-slate-500 shadow-slate-200'
                        : 'bg-[#171B28] border-[#CCFF00]/30 hover:border-[#CCFF00] shadow-black'
                    }`}
                    title="Profile"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isLight ? 'bg-slate-900 text-white' : 'bg-[#CCFF00] text-black'
                    }`}>
                      {displayName.substring(0, 2).toUpperCase()}
                    </div>
                  </button>
                </div>
              </header>

              {/* Featured Mix Hero Section */}
              <section className="w-full">
                <div className={`relative h-56 w-full rounded-2xl overflow-hidden border shadow-lg ${
                  isLight
                    ? 'border-slate-200 bg-white text-slate-900 shadow-slate-100'
                    : 'border-[#242428] bg-[#141416] text-white shadow-2xl shadow-black/60'
                }`}>
                  <div className={`absolute inset-0 z-10 ${
                    isLight
                      ? 'bg-gradient-to-r from-white via-white/85 to-transparent'
                      : 'bg-gradient-to-r from-[#10131C] via-[#10131C]/70 to-transparent'
                  }`} />
                  <div className="absolute inset-0 opacity-25 bg-[url('https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center" />
                  <div className="relative z-20 p-6 h-full flex flex-col justify-center">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full w-fit mb-2 uppercase tracking-wider ${
                      isLight ? 'bg-slate-900 text-white' : 'bg-[#CCFF00] text-black'
                    }`}>
                      Featured Mix
                    </span>
                    <h2 className={`text-3xl sm:text-4xl font-black italic tracking-tighter leading-none mb-2 uppercase ${
                      isLight ? 'text-slate-900' : 'text-[#F7F8FC]'
                    }`}>
                      Electric Dreams
                    </h2>
                    <p className={`text-xs sm:text-sm max-w-xs sm:max-w-md mb-4 line-clamp-2 font-medium ${
                      isLight ? 'text-slate-600' : 'text-[#9CA3B7]'
                    }`}>
                      The definitive high-octane soundscape for your digital journey. Updated continuously.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const trk = tracks.find((t) => t.title.toLowerCase().includes('electric')) || tracks[0];
                          handleSelectTrack(trk);
                        }}
                        className={`font-black px-6 py-2 rounded-full text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                          isLight
                            ? 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
                            : 'bg-[#CCFF00] text-black shadow-[#CCFF00]/25 hover:brightness-110'
                        } active:scale-95`}
                      >
                        Play Now
                      </button>
                      <button
                        onClick={() => setCurrentScreen('library')}
                        className={`font-bold px-6 py-2 rounded-full text-xs uppercase tracking-wider transition-colors cursor-pointer border ${
                          isLight
                            ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                            : 'bg-[#242428] border-[#36363C] text-white hover:border-white'
                        }`}
                      >
                        Library
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Block 8: AI Discovery & Cyber DJ Entrance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cyber DJ Card */}
                <div
                  onClick={() => setCurrentScreen('cyber_dj')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-sm flex items-center justify-between ${
                    isLight
                      ? 'bg-white border-slate-200 hover:border-slate-400'
                      : 'bg-[#141416] border-[#242428] hover:border-[#CCFF00]/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                      isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30'
                    }`}>
                      <Radio className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold transition-colors ${
                          isLight ? 'text-slate-900 group-hover:text-slate-600' : 'text-white group-hover:text-[#CCFF00]'
                        }`}>
                          Smart DJ Flow
                        </h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/40'
                        }`}>
                          Live
                        </span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-[#9CA3B7]'}`}>
                        Continuous adaptive queue • Drive, Workout, Chill
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-colors ${
                    isLight ? 'text-slate-400 group-hover:text-slate-900' : 'text-[#9CA3B7] group-hover:text-[#CCFF00]'
                  }`} />
                </div>

                {/* AI Playlist Generator Card */}
                <div
                  onClick={() => setCurrentScreen('ai_playlist')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-sm flex items-center justify-between ${
                    isLight
                      ? 'bg-white border-slate-200 hover:border-slate-400'
                      : 'bg-[#141416] border-[#242428] hover:border-[#CCFF00]/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                      isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30'
                    }`}>
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold transition-colors ${
                          isLight ? 'text-slate-900 group-hover:text-slate-600' : 'text-white group-hover:text-[#CCFF00]'
                        }`}>
                          AI Playlist Creator
                        </h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/40'
                        }`}>
                          Studio
                        </span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-[#9CA3B7]'}`}>
                        Prompt to verified playable tracklists
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-colors ${
                    isLight ? 'text-slate-400 group-hover:text-slate-900' : 'text-[#9CA3B7] group-hover:text-[#CCFF00]'
                  }`} />
                </div>
              </div>

              {/* Section 1: Recently Played */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#F7F8FC] uppercase">Recently Played</h3>
                  <span
                    onClick={() =>
                      handleOpenSection({
                        title: 'Recently Played',
                        subtitle: 'Your recently played and verified streamable anthems',
                        type: 'tracks',
                        items: tracks,
                        badgeText: 'Recent Tracks'
                      })
                    }
                    className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline"
                  >
                    See All
                  </span>
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">
                  {tracks.slice(0, 5).map((track) => (
                    <div
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className="w-36 shrink-0 flex flex-col gap-2 group cursor-pointer"
                    >
                      <div className="aspect-square rounded-xl bg-[#171B28] border border-[#171B28] group-hover:border-[#00F5FF]/50 overflow-hidden relative shadow-lg shadow-black/40 transition-all">
                        <CyberArtwork
                          keyName={track.placeholderArtworkKey}
                          artworkUrl={track.artworkUrl}
                          title={track.title}
                          artist={track.artist}
                        />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="w-10 h-10 rounded-full border border-[#00F5FF] bg-black/50 flex items-center justify-center text-[#00F5FF] shadow-lg shadow-[#00F5FF]/20">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-bold truncate text-[#F7F8FC]">{track.title}</div>
                      <div className="text-[10px] text-[#9CA3B7] uppercase tracking-tighter truncate">{track.artist}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Made For You */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#F7F8FC] uppercase">Made For You</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSpotifyImportOpen(true)}
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-inherit flex items-center gap-1 cursor-pointer transition-colors"
                      title="Import playlist dari Spotify"
                    >
                      <Music2 className="w-3 h-3" />
                      <span>+ Spotify</span>
                    </button>
                    <span
                      onClick={() =>
                        handleOpenSection({
                          title: 'Made For You',
                          subtitle: 'Personalized mixes and curated tracklists',
                          type: 'playlists',
                          items: playlists,
                          badgeText: 'Curated Mixes'
                        })
                      }
                      className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline"
                    >
                      Explore
                    </span>
                  </div>
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">
                  {playlists.slice(0, 6).map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => {
                        setSelectedPlaylistId(pl.id);
                        setCurrentScreen('playlist_detail');
                      }}
                      className="w-36 shrink-0 flex flex-col gap-2 group cursor-pointer"
                    >
                      <div className="aspect-square rounded-xl bg-[#171B28] border border-[#171B28] group-hover:border-[#8B5CFF]/60 overflow-hidden relative shadow-lg shadow-black/40 transition-all">
                        <CyberArtwork keyName={pl.artworkKey} artworkUrl={pl.artworkUrl} title={pl.title} />
                        <div className="absolute bottom-2 left-2 bg-[#10131C]/80 backdrop-blur-md px-2 py-0.5 rounded border border-[#171B28] text-[9px] font-bold text-[#F7F8FC] uppercase tracking-wider">
                          {pl.trackCount} tracks
                        </div>
                        {pl.source === 'SPOTIFY' && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-black text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full shadow">
                            Spotify
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-bold truncate text-[#F7F8FC]">{pl.title}</div>
                      <div className="text-[10px] text-[#9CA3B7] line-clamp-1">{pl.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Trending Now */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#F7F8FC] uppercase">Trending Now</h3>
                  <span
                    onClick={() =>
                      handleOpenSection({
                        title: 'Trending Now',
                        subtitle: 'The highest-energy cyberpunk & pop chart-toppers right now',
                        type: 'tracks',
                        items: [...tracks].reverse(),
                        badgeText: 'Top Charts'
                      })
                    }
                    className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline"
                  >
                    See All
                  </span>
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">
                  {[...tracks].reverse().map((track) => (
                    <div
                      key={`tr-${track.id}`}
                      onClick={() => handleSelectTrack(track)}
                      className="w-36 shrink-0 flex flex-col gap-2 group cursor-pointer"
                    >
                      <div className="aspect-square rounded-xl bg-[#171B28] border border-[#171B28] group-hover:border-[#FF2ED1]/60 overflow-hidden relative shadow-lg shadow-black/40 transition-all">
                        <CyberArtwork
                          keyName={track.placeholderArtworkKey}
                          artworkUrl={track.artworkUrl}
                          title={track.title}
                          artist={track.artist}
                        />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="w-10 h-10 rounded-full border border-[#FF2ED1] bg-black/50 flex items-center justify-center text-[#FF2ED1] shadow-lg shadow-[#FF2ED1]/20">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-bold truncate text-[#F7F8FC]">{track.title}</div>
                      <div className="text-[10px] text-[#9CA3B7] uppercase tracking-tighter truncate">{track.artist}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: New Releases */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#F7F8FC] uppercase">New Releases</h3>
                  <span
                    onClick={() =>
                      handleOpenSection({
                        title: 'New Releases',
                        subtitle: 'Freshly released cyberpunk singles and studio master editions',
                        type: 'tracks',
                        items: tracks.slice(3, 16),
                        badgeText: 'Fresh Drops'
                      })
                    }
                    className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline"
                  >
                    See All
                  </span>
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">
                  {tracks.slice(3, 7).map((track) => (
                    <div
                      key={`new-${track.id}`}
                      onClick={() => handleSelectTrack(track)}
                      className="w-36 shrink-0 flex flex-col gap-2 group cursor-pointer"
                    >
                      <div className="aspect-square rounded-xl bg-[#171B28] border border-[#171B28] group-hover:border-[#B8FF2C]/60 overflow-hidden relative shadow-lg shadow-black/40 transition-all">
                        <CyberArtwork
                          keyName={track.placeholderArtworkKey}
                          artworkUrl={track.artworkUrl}
                          title={track.title}
                          artist={track.artist}
                        />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="w-10 h-10 rounded-full border border-[#B8FF2C] bg-black/50 flex items-center justify-center text-[#B8FF2C] shadow-lg shadow-[#B8FF2C]/20">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-bold truncate text-[#F7F8FC]">{track.title}</div>
                      <div className="text-[10px] text-[#9CA3B7] uppercase tracking-tighter truncate">{track.artist}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Your Mixes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#F7F8FC] uppercase">Your Mixes</h3>
                  <span
                    onClick={() =>
                      handleOpenSection({
                        title: 'Your Mixes',
                        subtitle: 'Continuous flow algorithmic mixes curated for cyber pulses',
                        type: 'playlists',
                        items: playlists,
                        badgeText: 'Audio Mixes'
                      })
                    }
                    className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline"
                  >
                    See All
                  </span>
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">
                  {playlists.map((pl) => (
                    <div
                      key={`mix-${pl.id}`}
                      onClick={() => {
                        setSelectedPlaylistId(pl.id);
                        setCurrentScreen('playlist_detail');
                      }}
                      className="w-36 shrink-0 flex flex-col gap-2 group cursor-pointer"
                    >
                      <div className="aspect-square rounded-xl bg-[#171B28] border border-[#171B28] group-hover:border-[#00F5FF]/50 overflow-hidden relative shadow-lg shadow-black/40 transition-all">
                        <CyberArtwork keyName={pl.artworkKey} artworkUrl={pl.artworkUrl} title={pl.title} />
                        {pl.source === 'SPOTIFY' && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-black text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full shadow">
                            Spotify
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-bold truncate text-[#F7F8FC]">{pl.title}</div>
                      <div className="text-[10px] text-[#9CA3B7] uppercase tracking-tighter truncate">{pl.createdBy || 'Curated Mix'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 6: Popular Artists */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#F7F8FC] uppercase">Popular Artists</h3>
                  <span
                    onClick={() =>
                      handleOpenSection({
                        title: 'Popular Artists',
                        subtitle: 'Leading visionaries and neon producers shaping electronic sound',
                        type: 'artists',
                        items: DEMO_ARTISTS,
                        badgeText: 'All Artists'
                      })
                    }
                    className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline"
                  >
                    See All
                  </span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
                  {DEMO_ARTISTS.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() => {
                        setSelectedArtistId(artist.id);
                        setCurrentScreen('artist_detail');
                      }}
                      className="w-24 shrink-0 flex flex-col items-center text-center cursor-pointer group"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#171B28] group-hover:border-[#00F5FF] transition-all mb-1.5 shadow-lg shadow-black">
                        <CyberArtwork keyName={artist.artworkKey} artworkUrl={artist.artworkUrl} title={artist.name} />
                      </div>
                      <span className="text-xs font-bold text-[#F7F8FC] truncate w-full">{artist.name}</span>
                      <span className="text-[10px] text-[#9CA3B7] uppercase tracking-tighter">{(artist.followersCount / 1000).toFixed(0)}k pulses</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: SEARCH */}
          {currentScreen === 'search' && (
            <div className="p-4 space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC]">Search</h1>
                <button
                  onClick={() => setIsOfflineMode(!isOfflineMode)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    isOfflineMode
                      ? 'bg-[#00F5FF]/15 border-[#00F5FF] text-[#00F5FF]'
                      : 'bg-[#10131C] border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC]'
                  }`}
                >
                  {isOfflineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                  <span>{isOfflineMode ? 'Offline Mode' : 'Online API'}</span>
                </button>
              </div>

              {isOfflineMode && (
                <div className="p-3 rounded-xl bg-[#10131C] border border-[#00F5FF]/40 flex items-center gap-2 text-xs text-[#00F5FF]">
                  <CloudOff className="w-4 h-4 shrink-0" />
                  <span className="flex-1">Offline Music Library Active • Playing cached audio</span>
                  <button onClick={() => setIsOfflineMode(false)} className="underline hover:text-white font-bold">
                    Go Online
                  </button>
                </div>
              )}

              {/* Search Field with Frosted Glass Styling */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#61697C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Songs, artists, albums, playlists..."
                  className="w-full py-3 pl-10 pr-9 bg-[#10131C]/90 backdrop-blur-md border border-[#171B28] focus:border-[#00F5FF] rounded-2xl text-xs text-[#F7F8FC] placeholder-[#61697C] outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3B7] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Multi-Entity Filter Chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {(['ALL', 'SPOTIFY', 'YOUTUBE', 'SONGS', 'ARTISTS', 'ALBUMS', 'PLAYLISTS'] as SearchFilter[]).map((filter) => {
                  const isYt = filter === 'YOUTUBE';
                  const isSp = filter === 'SPOTIFY';
                  const active = searchFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setSearchFilter(filter)}
                      className={`py-1 px-3.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 ${
                        active
                          ? isSp
                            ? 'bg-[#1DB954] text-black font-black shadow-md shadow-[#1DB954]/40'
                            : isYt
                            ? 'bg-[#FF0000] text-white shadow-md shadow-[#FF0000]/30'
                            : 'bg-[#00F5FF] text-[#07090F]'
                          : isSp
                          ? 'bg-[#0A1A0F] border border-[#1DB954]/40 text-[#1DB954] hover:text-white'
                          : isYt
                          ? 'bg-[#1A0D10] border border-[#FF0000]/40 text-red-400 hover:text-white'
                          : 'bg-[#10131C] border border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC]'
                      }`}
                    >
                      {isSp && <Music className="w-3.5 h-3.5 fill-current" />}
                      {isYt && <Youtube className="w-3.5 h-3.5 fill-current" />}
                      <span>{filter}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Search Results */}
              {searchQuery.trim() ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#9CA3B7] font-bold uppercase tracking-wider">
                    <span>
                      Query: "{searchQuery}" • Filter: {searchFilter}
                    </span>
                    <div className="flex items-center gap-2">
                      {isSearchingSpotify && (
                        <span className="flex items-center gap-1 text-[#1DB954] text-[10px] font-mono">
                          <Loader2 className="w-3 h-3 animate-spin" /> Spotify...
                        </span>
                      )}
                      {isSearchingYoutube && (
                        <span className="flex items-center gap-1 text-red-400 text-[10px] font-mono">
                          <Loader2 className="w-3 h-3 animate-spin" /> YouTube...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Spotify Results Section */}
                  {(searchFilter === 'ALL' || searchFilter === 'SPOTIFY') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-mono uppercase tracking-widest text-[#1DB954] font-bold flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-[#1DB954]" />
                          <span>Spotify Tracks ({spotifyResults.length})</span>
                        </div>
                        <span className="text-[9px] bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse" />
                          180-DAY KEY • LIVE PROXY
                        </span>
                      </div>

                      {/* Spotify Search Error Display */}
                      {spotifySearchError && (
                        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="font-mono text-[11px]">{spotifySearchError}</span>
                          </div>
                          <button
                            onClick={() => {
                              setIsSearchingSpotify(true);
                              setSpotifySearchError(null);
                              searchSpotifyTracks(searchQuery.trim())
                                .then((res) => {
                                  setSpotifyResults(res.tracks);
                                  if (res.error) setSpotifySearchError(res.error);
                                })
                                .finally(() => setIsSearchingSpotify(false));
                            }}
                            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {isSearchingSpotify && spotifyResults.length === 0 ? (
                        <div className="p-4 rounded-xl bg-[#0A130E] border border-[#1DB954]/30 flex items-center justify-center gap-2.5 text-xs text-green-300 font-mono">
                          <Loader2 className="w-4 h-4 animate-spin text-[#1DB954]" />
                          <span>Searching Spotify catalog for "{searchQuery}"...</span>
                        </div>
                      ) : spotifyResults.length > 0 ? (
                        <div className="space-y-2">
                          {spotifyResults.map((spTrack) => (
                            <div
                              key={spTrack.id}
                              onClick={() => {
                                handleSelectTrack(spTrack);
                              }}
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-[#10131C]/90 backdrop-blur-md border border-[#1DB954]/25 hover:border-[#1DB954]/70 cursor-pointer transition-all group"
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#1DB954]/30 relative bg-black">
                                {spTrack.artworkUrl ? (
                                  <img
                                    src={spTrack.artworkUrl}
                                    alt={spTrack.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#1DB954]/20 flex items-center justify-center">
                                    <Music className="w-5 h-5 text-[#1DB954]" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play className="w-4 h-4 fill-[#1DB954] text-[#1DB954] ml-0.5" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-[#F7F8FC] truncate group-hover:text-[#1DB954] transition-colors">
                                  {spTrack.title}
                                </div>
                                <div className="text-[11px] text-[#9CA3B7] truncate flex items-center gap-1.5 mt-0.5">
                                  <span className="text-gray-300 font-medium truncate">{spTrack.artist}</span>
                                  <span>•</span>
                                  <span className="text-[9px] bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/30 px-1.5 py-0.2 rounded font-mono shrink-0 font-bold">
                                    SPOTIFY
                                  </span>
                                  <span className="text-[10px] text-gray-500 truncate hidden sm:inline">
                                    {spTrack.album}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayViaYouTube(spTrack);
                                  }}
                                  title="Play full track from YouTube"
                                  className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                  <Youtube className="w-3.5 h-3.5 fill-current" />
                                  <span>YouTube</span>
                                </button>
                                <div className="w-8 h-8 rounded-full bg-[#00F5FF]/20 border border-[#00F5FF]/40 flex items-center justify-center text-[#00F5FF] group-hover:bg-[#00F5FF] group-hover:text-black transition-all shadow-sm">
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : !isSearchingSpotify && !spotifySearchError && searchFilter === 'SPOTIFY' ? (
                        <div className="p-6 rounded-xl bg-[#0C1217] border border-[#1DB954]/20 text-center space-y-3">
                          <Music className="w-8 h-8 text-[#1DB954]/50 mx-auto" />
                          <div className="text-xs font-bold text-white">No Spotify songs found for "{searchQuery}"</div>
                          <p className="text-[11px] text-[#9CA3B7]">
                            Try one of these popular searches on Spotify:
                          </p>
                          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                            {['Tiada', 'Repvblik', 'Cyberpunk', 'Alan Walker', 'Dua Lipa'].map((sample) => (
                              <button
                                key={sample}
                                onClick={() => setSearchQuery(sample)}
                                className="px-2.5 py-1 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 text-[10px] font-mono text-[#1DB954] hover:bg-[#1DB954] hover:text-black transition-all"
                              >
                                {sample}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* YouTube Results Section */}
                  {(searchFilter === 'ALL' || searchFilter === 'YOUTUBE') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold flex items-center gap-1.5">
                          <Youtube className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                          <span>YouTube Music & Videos ({youtubeResults.length})</span>
                        </div>
                        <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-mono">
                          API v3 LIVE
                        </span>
                      </div>

                      {isSearchingYoutube && youtubeResults.length === 0 ? (
                        <div className="p-4 rounded-xl bg-[#10131C] border border-red-500/30 flex items-center justify-center gap-2.5 text-xs text-red-300 font-mono">
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          <span>Searching YouTube for "{searchQuery}"...</span>
                        </div>
                      ) : youtubeResults.length > 0 ? (
                        <div className="space-y-2">
                          {youtubeResults.map((ytTrack) => (
                            <div
                              key={ytTrack.id}
                              onClick={() => handleSelectTrack(ytTrack)}
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-[#10131C]/90 backdrop-blur-md border border-red-500/20 hover:border-red-500/60 cursor-pointer transition-all group"
                            >
                              <div className="w-14 h-11 rounded-lg overflow-hidden shrink-0 border border-red-500/30 relative bg-black">
                                <img
                                  src={ytTrack.artworkUrl}
                                  alt={ytTrack.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-[#F7F8FC] truncate group-hover:text-red-400 transition-colors">
                                  {ytTrack.title}
                                </div>
                                <div className="text-[11px] text-[#9CA3B7] truncate flex items-center gap-1.5 mt-0.5">
                                  <span className="text-red-400 font-medium truncate">{ytTrack.artist}</span>
                                  <span>•</span>
                                  <span className="text-[9px] bg-red-950/80 text-red-300 border border-red-800/50 px-1.5 py-0.2 rounded font-mono shrink-0">
                                    YOUTUBE
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayViaYouTube(ytTrack);
                                  }}
                                  title="Play on YouTube"
                                  className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                  <Youtube className="w-3.5 h-3.5 fill-current" />
                                  <span>YouTube</span>
                                </button>
                                <div className="w-8 h-8 rounded-full bg-[#00F5FF]/20 border border-[#00F5FF]/40 flex items-center justify-center text-[#00F5FF] group-hover:bg-[#00F5FF] group-hover:text-black transition-all shadow-sm">
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : searchFilter === 'YOUTUBE' ? (
                        <div className="p-6 rounded-xl bg-[#10131C] border border-red-500/20 text-center space-y-2">
                          <Youtube className="w-8 h-8 text-red-500/40 mx-auto" />
                          <div className="text-xs font-bold text-white">No YouTube results found</div>
                          <p className="text-[11px] text-[#9CA3B7]">
                            Try searching for artist names or song titles (e.g. "Synthwave", "Daft Punk", "Alan Walker")
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Tracks Section */}
                  {(searchFilter === 'ALL' || searchFilter === 'SONGS') && filteredTracks.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono uppercase tracking-widest text-[#00F5FF] font-bold">
                        Songs ({filteredTracks.length})
                      </div>
                      {filteredTracks.map((trk) => (
                        <div
                          key={trk.id}
                          onClick={() => handleSelectTrack(trk)}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-[#10131C]/80 backdrop-blur-md border border-[#171B28] hover:border-[#00F5FF]/50 cursor-pointer transition-colors"
                        >
                          <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/5">
                            <CyberArtwork keyName={trk.placeholderArtworkKey} artworkUrl={trk.artworkUrl} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-[#F7F8FC] truncate">{trk.title}</div>
                            <div className="text-[11px] text-[#9CA3B7] truncate">
                              {trk.artist} • {trk.album}
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-[#00F5FF]/15 border border-[#00F5FF]/30 flex items-center justify-center text-[#00F5FF]">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Artists Section */}
                  {(searchFilter === 'ALL' || searchFilter === 'ARTISTS') && filteredArtists.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono uppercase tracking-widest text-[#8B5CFF] font-bold">
                        Artists ({filteredArtists.length})
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {filteredArtists.map((artist) => (
                          <div
                            key={artist.id}
                            onClick={() => {
                              setSelectedArtistId(artist.id);
                              setCurrentScreen('artist_detail');
                            }}
                            className="p-3 rounded-xl bg-[#10131C]/80 border border-[#171B28] hover:border-[#8B5CFF]/50 flex items-center gap-2.5 cursor-pointer transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#8B5CFF]/30 shrink-0">
                              <CyberArtwork keyName={artist.artworkKey} artworkUrl={artist.artworkUrl} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#F7F8FC] truncate">{artist.name}</div>
                              <div className="text-[10px] text-[#9CA3B7] truncate">
                                {(artist.followersCount / 1000).toFixed(0)}k pulses
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Albums Section */}
                  {(searchFilter === 'ALL' || searchFilter === 'ALBUMS') && filteredAlbums.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono uppercase tracking-widest text-[#00F5FF] font-bold">
                        Albums ({filteredAlbums.length})
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {filteredAlbums.map((album) => (
                          <div
                            key={album.id}
                            onClick={() => {
                              setSelectedAlbumId(album.id);
                              setCurrentScreen('album_detail');
                            }}
                            className="p-2.5 rounded-xl bg-[#10131C]/80 border border-[#171B28] hover:border-[#00F5FF]/50 cursor-pointer transition-colors"
                          >
                            <div className="aspect-square rounded-lg overflow-hidden border border-white/5 mb-2">
                              <CyberArtwork keyName={album.artworkKey} artworkUrl={album.artworkUrl} />
                            </div>
                            <div className="text-xs font-bold text-[#F7F8FC] truncate">{album.title}</div>
                            <div className="text-[10px] text-[#9CA3B7] truncate">{album.artist}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Playlists Section */}
                  {(searchFilter === 'ALL' || searchFilter === 'PLAYLISTS') && filteredPlaylists.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono uppercase tracking-widest text-[#FF2ED1] font-bold">
                        Playlists ({filteredPlaylists.length})
                      </div>
                      <div className="space-y-2">
                        {filteredPlaylists.map((pl) => (
                          <div
                            key={pl.id}
                            onClick={() => {
                              setSelectedPlaylistId(pl.id);
                              setCurrentScreen('playlist_detail');
                            }}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-[#10131C]/80 border border-[#171B28] hover:border-[#FF2ED1]/50 cursor-pointer transition-colors"
                          >
                            <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/5">
                              <CyberArtwork keyName={pl.artworkKey} artworkUrl={pl.artworkUrl} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-[#F7F8FC] truncate">{pl.title}</div>
                              <div className="text-[10px] text-[#9CA3B7] truncate">{pl.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredTracks.length === 0 &&
                    filteredArtists.length === 0 &&
                    filteredAlbums.length === 0 &&
                    filteredPlaylists.length === 0 &&
                    spotifyResults.length === 0 &&
                    youtubeResults.length === 0 &&
                    !isSearchingSpotify &&
                    !isSearchingYoutube && (
                      <div className="py-12 text-center text-[#61697C] text-xs">
                        No matches found for "{searchQuery}" under filter "{searchFilter}".
                      </div>
                    )}
                </div>
              ) : (
                /* Default Browse View */
                <div className="space-y-5">
                  {/* Recent Searches */}
                  <div>
                    <div className="text-xs font-bold text-[#9CA3B7] uppercase tracking-wider mb-2.5">Recent Searches</div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => setSearchQuery(term)}
                          className="py-1.5 px-3 rounded-full bg-[#10131C] border border-[#171B28] hover:border-[#00F5FF] text-xs font-semibold text-[#9CA3B7] hover:text-[#F7F8FC] flex items-center gap-1.5 transition-colors"
                        >
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Browse Categories Grid */}
                  <div>
                    <div className="text-xs font-bold text-[#9CA3B7] uppercase tracking-wider mb-3">Browse Categories</div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {BROWSE_CATEGORIES.map((cat) => (
                        <div
                          key={cat.name}
                          onClick={() => setSearchQuery(cat.name)}
                          className="h-20 rounded-xl p-3 border flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] backdrop-blur-md"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            borderColor: `${cat.color}35`,
                          }}
                        >
                          <span className="text-xs font-black uppercase text-[#F7F8FC]">{cat.name}</span>
                          <span
                            className="text-[10px] font-mono font-bold tracking-wider opacity-90"
                            style={{ color: cat.color }}
                          >
                            DISCOVER //
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCREEN: EXPLORE */}
          {currentScreen === 'explore' && (
            <div className="p-4 space-y-6">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC]">Explore</h1>
                <p className="text-xs text-[#9CA3B7]">Atmospheric categories and soundscapes</p>
              </div>

              {/* Mood & Vibe */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7]">Mood & Vibe</h2>
                  <span
                    onClick={() =>
                      handleOpenSection({
                        title: 'All Soundscapes & Moods',
                        subtitle: 'Atmospheric audio environments engineered for high cognitive focus',
                        type: 'tracks',
                        items: tracks,
                        badgeText: 'Soundscapes'
                      })
                    }
                    className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline"
                  >
                    See All
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {EXPLORE_MOODS.map((mood) => (
                    <div
                      key={mood.title}
                      onClick={() => {
                        const moodKeywords = mood.title.toLowerCase().split(' ');
                        const matchedTracks = tracks.filter((t) =>
                          t.tags?.some((tag) => moodKeywords.some((k) => tag.toLowerCase().includes(k)))
                        );
                        handleOpenSection({
                          title: mood.title,
                          subtitle: mood.desc,
                          type: 'tracks',
                          items: matchedTracks.length > 0 ? matchedTracks : tracks.slice(0, 8),
                          badgeText: 'Mood Station',
                          gradient: mood.gradient
                        });
                      }}
                      className={`h-24 rounded-2xl p-3 bg-gradient-to-br ${mood.gradient} border border-white/10 flex flex-col justify-between cursor-pointer shadow-lg hover:border-white/30 transition-all backdrop-blur-md hover:scale-[1.02]`}
                    >
                      <span className="text-xs font-black uppercase text-[#F7F8FC]">{mood.title}</span>
                      <span className="text-[10px] text-white/80 line-clamp-1">{mood.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Genres */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-3">Genres</h2>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {['Synthwave', 'Cyberpunk', 'Darksynth', 'Industrial', 'EBM', 'Midtempo', 'Ambient'].map(
                    (genre) => (
                      <button
                        key={genre}
                        onClick={() => {
                          setSearchQuery(genre);
                          setCurrentScreen('search');
                        }}
                        className="py-1.5 px-3.5 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF] shrink-0 transition-colors cursor-pointer"
                      >
                        {genre}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Activities */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-3">Activity</h2>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {['Late Night Coding', 'Night Commute', 'Cardio & Heavy Lift', 'Deep Sleep', 'Gaming'].map(
                    (act) => (
                      <button
                        key={act}
                        onClick={() => {
                          setSearchQuery(act.split(' ')[0]);
                          setCurrentScreen('search');
                        }}
                        className="py-1.5 px-3.5 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#8B5CFF] shrink-0 transition-colors cursor-pointer"
                      >
                        {act}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Decades */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-3">Decades</h2>
                <div className="grid grid-cols-4 gap-2">
                  {['80s Retro', '90s Matrix', '2000s Cyber', '2077 Neon'].map((decade) => (
                    <button
                      key={decade}
                      onClick={() => {
                        setSearchQuery(decade.split(' ')[0]);
                        setCurrentScreen('search');
                      }}
                      className="p-2.5 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md text-center text-[10px] font-black uppercase tracking-wider text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#FF2ED1] transition-colors cursor-pointer"
                    >
                      {decade}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: LIBRARY */}
          {currentScreen === 'library' && (
            <div className="p-4 space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC]">Your Library</h1>
                <button
                  onClick={() => setCurrentScreen('ai_playlist')}
                  className="p-2 rounded-full bg-[#00F5FF]/15 border border-[#00F5FF]/30 text-[#00F5FF] hover:bg-[#00F5FF]/25 transition-colors cursor-pointer"
                  title="Generate AI Playlist"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['Playlists', 'Artists', 'Albums', 'Liked'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      if (filter === 'Liked') {
                        setCurrentScreen('liked_songs');
                      } else if (filter === 'Playlists') {
                        handleOpenSection({
                          title: 'All Playlists',
                          subtitle: 'All curated mixes and user playlists in your cyber library',
                          type: 'playlists',
                          items: DEMO_PLAYLISTS,
                          badgeText: 'Library Playlists'
                        });
                      } else if (filter === 'Artists') {
                        handleOpenSection({
                          title: 'All Artists',
                          subtitle: 'Followed electronic producers and cyberpunk visionaries',
                          type: 'artists',
                          items: DEMO_ARTISTS,
                          badgeText: 'Library Artists'
                        });
                      } else if (filter === 'Albums') {
                        handleOpenSection({
                          title: 'All Albums',
                          subtitle: 'Studio master editions and iconic full cyberpunk albums',
                          type: 'albums',
                          items: DEMO_ALBUMS,
                          badgeText: 'Library Albums'
                        });
                      }
                    }}
                    className="py-1 px-3.5 rounded-full border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF] shrink-0 transition-colors cursor-pointer"
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Liked Songs Banner */}
              <div
                onClick={() => setCurrentScreen('liked_songs')}
                className="p-4 rounded-2xl bg-gradient-to-r from-[#FF2ED1]/20 via-[#8B5CFF]/15 to-transparent border border-[#FF2ED1]/40 backdrop-blur-xl flex items-center justify-between cursor-pointer hover:border-[#FF2ED1] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF2ED1] to-[#8B5CFF] flex items-center justify-center text-white shadow-lg shadow-[#FF2ED1]/20">
                    <Heart className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase text-[#F7F8FC]">Liked Songs</div>
                    <div className="text-xs text-[#9CA3B7]">
                      {(tracks || []).filter((t) => t?.isLiked).length} tracks in collection
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#9CA3B7]" />
              </div>

              {/* Your Playlists */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7]">Your Playlists</h2>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full border border-inherit font-mono">
                      {playlists.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSpotifyImportOpen(true)}
                      className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-inherit cursor-pointer transition-colors hover:brightness-110"
                      title="Import Playlist dari Spotify"
                    >
                      <Music2 className="w-3 h-3 text-emerald-500" />
                      <span>Import Spotify</span>
                    </button>
                    <span
                      onClick={() =>
                        handleOpenSection({
                          title: 'Your Playlists',
                          subtitle: 'All curated mixes and user playlists in your cyber library',
                          type: 'playlists',
                          items: playlists,
                          badgeText: 'Library Playlists'
                        })
                      }
                      className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline"
                    >
                      See All
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {playlists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => {
                        setSelectedPlaylistId(pl.id);
                        setCurrentScreen('playlist_detail');
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#10131C]/80 border border-transparent hover:border-[#171B28] cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#171B28] relative bg-slate-900">
                        <CyberArtwork keyName={pl.artworkKey} artworkUrl={pl.artworkUrl} title={pl.title} />
                        {pl.source === 'SPOTIFY' && (
                          <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black shadow" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="text-xs font-bold text-[#F7F8FC] truncate">{pl.title}</div>
                          {pl.source === 'SPOTIFY' && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-500 shrink-0">
                              Spotify
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#9CA3B7]">
                          {pl.createdBy || 'Playlist'} • {pl.trackCount} songs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Downloaded Section */}
              <div className="pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-2">Downloaded</h2>
                <div
                  onClick={() => setComingSoonTitle('Offline Music Storage')}
                  className="p-3.5 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md flex items-center justify-between cursor-pointer hover:border-[#00F5FF]/40 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold uppercase text-[#F7F8FC]">Offline Music Cache</div>
                    <div className="text-[11px] text-[#00F5FF] font-medium">Coming in Block 2</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#61697C]" />
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: PROFILE */}
          {currentScreen === 'profile' && (
            <div className="p-4 space-y-5">
              <h1 className={`text-2xl font-black uppercase tracking-tight ${
                isLight ? 'text-slate-900' : 'text-[#F7F8FC]'
              }`}>Profile</h1>

              {/* User Profile Card */}
              <div className={`p-4 rounded-2xl border transition-all space-y-4 ${
                isLight
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'border-[#171B28] bg-[#10131C]/90 backdrop-blur-xl shadow-2xl shadow-black'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-full p-[2px] flex items-center justify-center shadow-md shrink-0 ${
                    isLight
                      ? 'bg-slate-300 ring-2 ring-slate-200'
                      : 'bg-gradient-to-br from-[#00F5FF] via-[#8B5CFF] to-[#FF2ED1] shadow-[#00F5FF]/20'
                  }`}>
                    <div className={`w-full h-full rounded-full flex items-center justify-center font-black text-lg sona-avatar ${
                      isLight
                        ? 'bg-slate-900 text-white shadow-inner'
                        : 'bg-[#07090F] text-[#00F5FF]'
                    }`}>
                      <span className="sona-avatar-text">{displayName.substring(0, 2).toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <div className={`text-base font-black uppercase ${
                      isLight ? 'text-slate-900' : 'text-[#F7F8FC]'
                    }`}>{displayName}</div>
                    <div className={`text-xs ${
                      isLight ? 'text-slate-500' : 'text-[#9CA3B7]'
                    }`}>
                      @sona_listener •{' '}
                      <span className={`font-bold ${
                        isProUser
                          ? isLight ? 'text-emerald-700' : 'text-[#FF2ED1]'
                          : isLight ? 'text-slate-800' : 'text-[#00F5FF]'
                      }`}>
                        {isProUser ? 'Sona Pro' : 'Free Plan'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className={`grid grid-cols-3 gap-2 pt-2 border-t text-center ${
                  isLight ? 'border-slate-200' : 'border-[#171B28]'
                }`}>
                  <div
                    onClick={() =>
                      handleOpenSection({
                        title: 'All Playlists',
                        subtitle: 'All curated mixes and user playlists',
                        type: 'playlists',
                        items: DEMO_PLAYLISTS,
                        badgeText: 'Playlists',
                      })
                    }
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-[#F7F8FC]'}`}>
                      {(DEMO_PLAYLISTS || []).length}
                    </div>
                    <div className="text-[10px] text-[#9CA3B7] uppercase tracking-wider">Playlists</div>
                  </div>
                  <div
                    onClick={() => setCurrentScreen('liked_songs')}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-[#F7F8FC]'}`}>
                      {(tracks || []).filter((t) => t?.isLiked).length}
                    </div>
                    <div className="text-[10px] text-[#9CA3B7] uppercase tracking-wider">Liked Songs</div>
                  </div>
                  <div
                    onClick={() =>
                      handleOpenSection({
                        title: 'All Artists',
                        subtitle: 'Followed artists and vocalists',
                        type: 'artists',
                        items: DEMO_ARTISTS,
                        badgeText: 'Artists',
                      })
                    }
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-[#F7F8FC]'}`}>
                      {(DEMO_ARTISTS || []).length}
                    </div>
                    <div className="text-[10px] text-[#9CA3B7] uppercase tracking-wider">Artists</div>
                  </div>
                </div>
              </div>

              {/* Menu Options */}
              <div className="space-y-1">
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                  isLight ? 'text-slate-500' : 'text-[#9CA3B7]'
                }`}>Preferences & System</div>
                {[
                  { label: 'Account & Subscription', action: () => setIsSubscriptionModalOpen(true) },
                  { label: 'Listening Stats & Trends', action: () => setCurrentScreen('listening_stats') },
                  { label: 'Appearance & Themes', action: () => setCurrentScreen('settings') },
                  { label: 'Audio Engine & DSP Preferences', action: () => setCurrentScreen('settings') },
                  { label: 'Liked Songs Collection', action: () => setCurrentScreen('liked_songs') },
                  { label: 'All Settings', action: () => setCurrentScreen('settings') },
                ].map((item) => (
                  <div
                    key={item.label}
                    onClick={item.action}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        : 'bg-[#10131C]/80 border-transparent hover:border-[#171B28] text-[#F7F8FC]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#61697C]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN: SETTINGS */}
          {currentScreen === 'settings' && (
            <SettingsView
              preferences={preferences}
              userName={displayName}
              isProUser={isProUser}
              onUpdatePreferences={onUpdatePreferences}
              onUpdateUserName={(newName) => {
                setDisplayName(newName);
                localStorage.setItem('sona_display_name', newName);
              }}
              onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
              onBack={() => setCurrentScreen('profile')}
            />
          )}

          {/* SCREEN: LISTENING STATS */}
          {currentScreen === 'listening_stats' && (
            <ListeningStatsView
              tracks={tracks}
              theme={preferences.theme}
              onBack={() => setCurrentScreen('profile')}
              onSelectTrack={handleSelectTrack}
            />
          )}

          {/* SCREEN: LIKED SONGS */}
          {currentScreen === 'liked_songs' && (
            <LikedSongsView
              tracks={tracks}
              theme={preferences.theme}
              onSelectTrack={handleSelectTrack}
              onToggleLike={handleToggleLike}
              onPlayViaYouTube={handlePlaySpotifyTrackViaYouTube}
              onBack={() => setCurrentScreen('library')}
            />
          )}

          {/* SCREEN: ARTIST DETAIL */}
          {currentScreen === 'artist_detail' && (
            (() => {
              const artist = (DEMO_ARTISTS || []).find((a) => a.id === selectedArtistId) || DEMO_ARTISTS[0];
              return (
                <ArtistDetailView
                  artist={artist}
                  tracks={tracks}
                  albums={DEMO_ALBUMS}
                  onBack={() => setCurrentScreen('home')}
                  onSelectTrack={handleSelectTrack}
                  onSelectAlbum={(albumId) => {
                    setSelectedAlbumId(albumId);
                    setCurrentScreen('album_detail');
                  }}
                  theme={preferences.theme}
                />
              );
            })()
          )}

          {/* SCREEN: ALBUM DETAIL */}
          {currentScreen === 'album_detail' && (
            (() => {
              const album = DEMO_ALBUMS.find((a) => a.id === selectedAlbumId) || DEMO_ALBUMS[0];
              return (
                <AlbumDetailView
                  album={album}
                  onBack={() => setCurrentScreen('home')}
                  onSelectTrack={handleSelectTrack}
                  onSelectArtist={(artistId) => {
                    setSelectedArtistId(artistId);
                    setCurrentScreen('artist_detail');
                  }}
                  theme={preferences.theme}
                />
              );
            })()
          )}

          {/* SCREEN: PLAYLIST DETAIL */}
          {currentScreen === 'playlist_detail' && (
            (() => {
              const playlist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0] || DEMO_PLAYLISTS[0];
              return (
                <PlaylistDetailView
                  playlist={playlist}
                  onBack={() => setCurrentScreen(previousScreen || 'home')}
                  onSelectTrack={handleSelectTrack}
                  theme={preferences.theme}
                  nrcAccent={preferences.nrcAccent}
                />
              );
            })()
          )}

          {currentScreen === 'cyber_dj' && (
            <CyberDjView
              onBack={() => setCurrentScreen('home')}
              onPlayTrack={handleSelectTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              theme={preferences.theme}
            />
          )}

          {currentScreen === 'ai_playlist' && (
            <AiPlaylistView
              onBack={() => setCurrentScreen('home')}
              onPlayTrack={handleSelectTrack}
              theme={preferences.theme}
            />
          )}

          {/* SCREEN: SECTION DETAIL (SEE ALL / EXPLORE) */}
          {currentScreen === 'section_detail' && sectionDetailConfig && (
            <SectionDetailView
              config={sectionDetailConfig}
              onBack={() => setCurrentScreen(previousScreen || 'home')}
              onSelectTrack={handleSelectTrack}
              onSelectPlaylist={(playlistId) => {
                setSelectedPlaylistId(playlistId);
                setCurrentScreen('playlist_detail');
              }}
              onSelectArtist={(artistId) => {
                setSelectedArtistId(artistId);
                setCurrentScreen('artist_detail');
              }}
              onSelectAlbum={(albumId) => {
                setSelectedAlbumId(albumId);
                setCurrentScreen('album_detail');
              }}
              onToggleLike={handleToggleLike}
              onPlayViaYouTube={handlePlayViaYouTube}
              currentTrackId={currentTrack?.id}
              theme={preferences.theme}
            />
          )}
        </main>

        {/* Persistent Mini Player (Docked above Bottom Nav) - Only visible once user has played a song */}
        {hasStartedPlayback && currentTrack && currentScreen !== 'onboarding' && !isNowPlayingOpen && (
          <div
            onClick={() => setIsNowPlayingOpen(true)}
            className={`sona-mini-player absolute bottom-20 left-3 right-3 sm:left-4 sm:right-4 h-16 rounded-2xl flex items-center px-3 sm:px-3.5 z-30 cursor-pointer transition-all duration-300 select-none shadow-xl ${
              isLight
                ? 'bg-white/95 backdrop-blur-2xl border border-slate-200/90 text-slate-900 shadow-[0_10px_25px_-4px_rgba(15,23,42,0.1),0_4px_6px_-2px_rgba(15,23,42,0.05)] hover:border-slate-300'
                : 'bg-[#121216]/95 backdrop-blur-2xl border border-[#272730] text-white shadow-[0_12px_36px_rgba(0,0,0,0.85)] hover:border-[#3A3A46]'
            }`}
          >
            {/* 0. Album thumbnail */}
            <div
              className={`w-11 h-11 rounded-xl overflow-hidden shrink-0 mr-3 relative ${
                isLight
                  ? 'border border-slate-200/80 shadow-sm bg-slate-100'
                  : 'border border-white/10 shadow-md shadow-black/50 bg-black'
              }`}
            >
              <CyberArtwork keyName={currentTrack.placeholderArtworkKey} artworkUrl={currentTrack.artworkUrl} />
              {currentTrack.source === 'YOUTUBE' && (
                <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center shadow-xs">
                  <Youtube className="w-2 h-2 text-white fill-current" />
                </div>
              )}
              {currentTrack.source === 'SPOTIFY' && (
                <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-[#1DB954] rounded-full flex items-center justify-center shadow-xs">
                  <Music className="w-2 h-2 text-black" />
                </div>
              )}
            </div>

            {/* 1. Track Info (Title & Artist) */}
            <div className="flex-1 min-w-0 pr-2">
              <div
                className={`sona-mini-title text-xs sm:text-sm font-bold tracking-tight truncate ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {currentTrack.title}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`sona-mini-artist text-[11px] font-medium truncate ${
                    isLight ? 'text-slate-500' : 'text-zinc-400'
                  }`}
                >
                  {currentTrack.artist}
                </span>
                {isPlaying && (
                  <span className="inline-flex items-end gap-[2px] h-2.5 shrink-0 ml-0.5" title="Playing">
                    <span
                      className={`w-[2px] rounded-full animate-bounce ${isLight ? 'bg-slate-800' : ''}`}
                      style={{
                        height: '100%',
                        animationDuration: '0.6s',
                        backgroundColor: isLight ? undefined : nrcAccentHex,
                      }}
                    />
                    <span
                      className={`w-[2px] rounded-full animate-bounce ${isLight ? 'bg-slate-800' : ''}`}
                      style={{
                        height: '60%',
                        animationDuration: '0.8s',
                        animationDelay: '0.15s',
                        backgroundColor: isLight ? undefined : nrcAccentHex,
                      }}
                    />
                    <span
                      className={`w-[2px] rounded-full animate-bounce ${isLight ? 'bg-slate-800' : ''}`}
                      style={{
                        height: '80%',
                        animationDuration: '0.5s',
                        animationDelay: '0.3s',
                        backgroundColor: isLight ? undefined : nrcAccentHex,
                      }}
                    />
                  </span>
                )}
              </div>
            </div>

            {/* 2. Controls & Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Quick YouTube Mode Toggle Button (Preserving title for continuity selector) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayViaYouTube(currentTrack);
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-red-600'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-red-400'
                }`}
                title="Play YouTube video version"
              >
                <Youtube className="w-3.5 h-3.5 fill-current" />
              </button>

              {/* Heart / Favorite Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLike(currentTrack.id);
                }}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                }`}
                title={currentTrack.isLiked ? 'Unlike' : 'Like'}
              >
                <Heart
                  className={`w-4 h-4 transition-transform active:scale-125 ${
                    currentTrack.isLiked
                      ? 'fill-[#FF2ED1] text-[#FF2ED1]'
                      : isLight
                      ? 'text-slate-400 hover:text-slate-700'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                />
              </button>

              {/* Prev Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevTrack();
                }}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
                title="Previous track"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              {/* Play / Pause Primary Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold shadow-md transition-all active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-slate-900 text-white shadow-slate-900/25 hover:bg-slate-800'
                    : 'text-black shadow-black/40 hover:brightness-110'
                }`}
                style={{
                  backgroundColor: isLight ? undefined : nrcAccentHex,
                }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className={`w-4 h-4 ${isLight ? 'fill-white' : 'fill-black'}`} />
                ) : (
                  <Play className={`w-4 h-4 ml-0.5 ${isLight ? 'fill-white' : 'fill-black'}`} />
                )}
              </button>

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextTrack();
                }}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
                title="Next track"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              {/* Dismiss / Close Mini Player Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(false);
                  setHasStartedPlayback(false);
                  sendYTCommand('pauseVideo');
                }}
                className={`p-1 rounded-full transition-colors cursor-pointer ml-0.5 ${
                  isLight
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/10'
                }`}
                title="Close player"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Seamless Bottom Progress Bar Edge Indicator */}
            <div
              className={`absolute bottom-0 left-3 right-3 h-[2.5px] rounded-full overflow-hidden ${
                isLight ? 'bg-slate-100' : 'bg-white/10'
              }`}
            >
              <div
                className={`h-full transition-all duration-300 ${isLight ? 'bg-slate-900' : ''}`}
                style={{
                  width: `${Math.min(100, (seekSeconds / (currentTrack.durationSeconds || 214)) * 100)}%`,
                  backgroundColor: isLight ? undefined : nrcAccentHex,
                }}
              />
            </div>
          </div>
        )}

        {/* Standard Phone Bottom Navigation Bar - Frosted Glass Design */}
        {!isTabletView && currentScreen !== 'onboarding' && (
          <nav
            className={`absolute bottom-0 left-0 right-0 h-20 backdrop-blur-xl border-t flex items-center justify-around px-4 sm:px-8 z-20 transition-colors ${
              isLight
                ? 'bg-white/95 border-slate-200/90'
                : 'bg-[#10131C]/95 border-[#171B28]'
            }`}
          >
            {navItems.map(({ id, label, icon: IconComponent }) => {
              const active = currentScreen === id;
              return (
                <button
                  key={id}
                  onClick={() => setCurrentScreen(id as ScreenType)}
                  className={`flex flex-col items-center gap-1 transition-colors py-1 px-2 cursor-pointer ${
                    active
                      ? isLight
                        ? 'text-slate-950 font-black'
                        : 'text-[#CCFF00] font-black'
                      : isLight
                      ? 'text-slate-400 hover:text-slate-700'
                      : 'text-[#61697C] hover:text-[#9CA3B7]'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* FULL-SCREEN NOW PLAYING MODAL */}
      {isNowPlayingOpen && (
        <div className="absolute inset-0 z-40 bg-[#07090F]/98 backdrop-blur-2xl flex flex-col px-5 pt-8 sm:pt-10 pb-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-8 duration-200">
          {/* Ambient Frosted Orb for Now Playing */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-[#8B5CFF]/25 via-[#00F5FF]/15 to-transparent rounded-full blur-[100px] pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-3 relative z-10 px-1">
            <button
              onClick={() => setIsNowPlayingOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 text-[#9CA3B7] hover:text-white transition-colors cursor-pointer"
              title="Close Player (Audio continues playing)"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
            <div className="text-center px-2 min-w-0 max-w-[200px] sm:max-w-xs">
              <div className="text-[9px] font-mono tracking-widest text-[#00F5FF] uppercase font-bold truncate">
                Playing from playlist
              </div>
              <div className="text-xs font-black uppercase text-[#F7F8FC] truncate">{currentTrack.album}</div>
            </div>
            <div className="flex items-center gap-1.5">
              {onToggleMinimize && (
                <button
                  onClick={() => {
                    setIsNowPlayingOpen(false);
                    onToggleMinimize();
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 text-[#9CA3B7] hover:text-[#00F5FF] transition-colors cursor-pointer"
                  title="Minimize (Play in background)"
                >
                  <Home className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2 MAIN PLAYER CHOICES: Audio Only vs Music Video */}
          <div className="flex flex-col items-center justify-center gap-2 my-1 relative z-10">
            <div className={`inline-flex p-1 rounded-full border shadow-inner ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#10131C] border-[#171B28]'
            }`}>
              <button
                onClick={() => setPlaybackMediaMode('audio')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  playbackMediaMode === 'audio'
                    ? isLight
                      ? 'bg-slate-900 text-white shadow-sm font-black'
                      : 'bg-[#CCFF00] text-black font-black shadow-md shadow-[#CCFF00]/30'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Only</span>
              </button>
              <button
                onClick={() => setPlaybackMediaMode('video')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  playbackMediaMode === 'video'
                    ? isLight
                      ? 'bg-slate-900 text-white shadow-sm font-black'
                      : 'bg-[#CCFF00] text-black font-black shadow-md shadow-[#CCFF00]/30'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Music Video</span>
              </button>
            </div>

            {/* Sub-options when in Audio Only: Cover | Visualizer | Lyrics */}
            {playbackMediaMode === 'audio' && (
              <div className={`inline-flex p-0.5 rounded-full border animate-in fade-in duration-200 ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#10131C]/60 border-[#171B28]'
              }`}>
                <button
                  onClick={() => setAudioVisualMode('artwork')}
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    audioVisualMode === 'artwork'
                      ? isLight
                        ? 'bg-slate-900 text-white shadow-sm font-bold'
                        : 'bg-[#CCFF00] text-black font-black'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  Cover
                </button>
                <button
                  onClick={() => setAudioVisualMode('visualizer')}
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    audioVisualMode === 'visualizer'
                      ? isLight
                        ? 'bg-slate-900 text-white shadow-sm font-bold'
                        : 'bg-[#CCFF00] text-black font-black'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  Visualizer
                </button>
                <button
                  onClick={() => setAudioVisualMode('lyrics')}
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    audioVisualMode === 'lyrics'
                      ? isLight
                        ? 'bg-slate-900 text-white shadow-sm font-bold'
                        : 'bg-[#CCFF00] text-black font-black'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  Lyrics
                </button>
              </div>
            )}
          </div>

          {/* Center Stage: Video / Hero Artwork / Visualizer / Inline Lyrics */}
          <div className="my-2 relative z-10 flex flex-col items-center justify-center w-full">
            {/* Unified persistent video player: never unmounts, no overlays or buttons on top of video */}
            <div
              className={`w-full max-w-[320px] sm:max-w-[360px] aspect-video mx-auto rounded-2xl overflow-hidden border-2 bg-black transition-all ${
                isLight ? 'border-slate-300 shadow-md' : 'border-[#CCFF00]/40 shadow-[0_0_35px_rgba(204,255,0,0.2)]'
              } ${
                playbackMediaMode === 'video'
                  ? 'relative block mb-2'
                  : 'absolute -top-[9999px] left-0 w-1 h-1 opacity-0 pointer-events-none'
              }`}
            >
              <iframe
                ref={ytIframeRef}
                src={`https://www.youtube-nocookie.com/embed/${effectiveYtId}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&autoplay=1&vq=medium&origin=${encodeURIComponent(
                  typeof window !== 'undefined' ? window.location.origin : ''
                )}`}
                title={currentTrack.title}
                className="w-full h-full border-0 pointer-events-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Seamless Audio Only Display: Artwork */}
            {playbackMediaMode === 'audio' && audioVisualMode === 'artwork' && (
              <div className="flex flex-col items-center w-full animate-in fade-in duration-200">
                <div className={`w-full max-w-[260px] sm:max-w-[280px] aspect-square mx-auto rounded-3xl overflow-hidden border-2 relative group shadow-xl ${
                  isLight ? 'border-slate-300 shadow-slate-200' : 'border-[#CCFF00]/40 shadow-[0_0_35px_rgba(204,255,0,0.2)]'
                }`}>
                  <CyberArtwork
                    keyName={currentTrack.placeholderArtworkKey}
                    artworkUrl={currentTrack.artworkUrl}
                    title={currentTrack.title}
                    artist={currentTrack.artist}
                  />
                </div>
              </div>
            )}

            {playbackMediaMode === 'audio' && audioVisualMode === 'visualizer' && (
              <VisualizerPreview
                mode={visualizerMode}
                isPlaying={isPlaying}
                isYouTube={isYouTubeActive}
                isProUser={DEFAULT_PROFILE.subscriptionTier === 'PRO'}
                currentSeconds={seekSeconds}
                onSelectMode={(m) => setVisualizerMode(m)}
                onUnlockPro={() => {
                  setIsNowPlayingOpen(false);
                  setCurrentScreen('profile');
                }}
              />
            )}

            {playbackMediaMode === 'audio' && audioVisualMode === 'lyrics' && (
              <LyricsPreview
                track={currentTrack}
                currentSeconds={seekSeconds}
                isPlaying={isPlaying}
                theme={preferences.theme}
                onSeek={(s) => handleSeek(s)}
                onTogglePlayPause={togglePlayPause}
              />
            )}
          </div>

          {/* Track Meta & Like */}
          <div className="flex items-center justify-between mt-3 mb-2 relative z-10 px-1">
            <div className="min-w-0 pr-3">
              <div className={`text-lg sm:text-xl font-black uppercase truncate ${
                isLight ? 'text-slate-900' : 'text-[#F7F8FC]'
              }`}>
                {currentTrack.title}
              </div>
              <div className={`text-xs font-bold uppercase tracking-wider truncate ${
                isLight ? 'text-slate-500' : 'text-[#CCFF00]'
              }`}>
                {currentTrack.artist}
              </div>
            </div>
            <button
              onClick={() => handleToggleLike(currentTrack.id)}
              className="p-1.5 transition-colors cursor-pointer"
            >
              <Heart
                className={`w-6 h-6 sm:w-7 sm:h-7 ${
                  currentTrack.isLiked
                    ? 'fill-[#FF2ED1] text-[#FF2ED1]'
                    : isLight
                    ? 'text-slate-400 hover:text-slate-700'
                    : 'text-[#9CA3B7] hover:text-white'
                }`}
              />
            </button>
          </div>

          {/* Progress Slider */}
          <div className="space-y-1.5 my-2 relative z-10 px-1">
            <input
              type="range"
              min={0}
              max={currentTrack.durationSeconds || 214}
              value={seekSeconds}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                isLight ? 'bg-slate-200 accent-slate-900' : 'bg-[#171B28] accent-[#CCFF00]'
              }`}
            />
            <div className={`flex justify-between text-[11px] font-mono ${
              isLight ? 'text-slate-500' : 'text-[#9CA3B7]'
            }`}>
              <span>{formatClock(seekSeconds)}</span>
              <span>{formatClock(currentTrack.durationSeconds || 214)}</span>
            </div>
          </div>

          {/* Controls: Shuffle, Prev, Play, Next, Repeat - Scaled for Mobile/Tablet Devices */}
          <div className="flex items-center justify-between py-3 max-w-xs mx-auto w-full relative z-10">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-1.5 transition-colors cursor-pointer ${
                isShuffle
                  ? isLight
                    ? 'text-slate-900'
                    : 'text-[#CCFF00]'
                  : isLight
                  ? 'text-slate-400 hover:text-slate-700'
                  : 'text-[#61697C]'
              }`}
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handlePrevTrack}
              className={`p-1.5 transition-colors cursor-pointer ${
                isLight ? 'text-slate-800 hover:text-slate-950' : 'text-[#F7F8FC] hover:text-[#CCFF00]'
              }`}
            >
              <SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            </button>
            <button
              onClick={togglePlayPause}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold transition-all shadow-lg active:scale-95 cursor-pointer ${
                isLight
                  ? 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
                  : 'bg-[#CCFF00] text-black shadow-[#CCFF00]/30 hover:brightness-110'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className={`w-5 h-5 sm:w-6 sm:h-6 ${isLight ? 'fill-white' : 'fill-black'}`} />
              ) : (
                <Play className={`w-5 h-5 sm:w-6 sm:h-6 ml-0.5 ${isLight ? 'fill-white' : 'fill-black'}`} />
              )}
            </button>
            <button
              onClick={handleNextTrack}
              className={`p-1.5 transition-colors cursor-pointer ${
                isLight ? 'text-slate-800 hover:text-slate-950' : 'text-[#F7F8FC] hover:text-[#CCFF00]'
              }`}
            >
              <SkipForward className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            </button>
            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-1.5 transition-colors ${isRepeat ? 'text-[#00F5FF]' : 'text-[#61697C]'}`}
            >
              <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Bottom Tabs: Lyrics & Queue */}
          <div className="flex items-center justify-between pt-4 border-t border-[#171B28] mt-auto relative z-10">
            <button
              onClick={() => setShowLyricsModal(true)}
              className="flex items-center gap-1.5 py-2 px-4 rounded-full border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#00F5FF]" />
              <span>Full Lyrics</span>
            </button>
            <button
              onClick={() => setShowQueueModal(true)}
              className="flex items-center gap-1.5 py-2 px-4 rounded-full border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF] transition-colors"
            >
              <ListMusic className="w-3.5 h-3.5 text-[#00F5FF]" />
              <span>Queue ({tracks.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* FULL SCREEN MODAL: LYRICS */}
      {showLyricsModal && (
        <LyricsPreview
          track={currentTrack}
          currentSeconds={seekSeconds}
          isPlaying={isPlaying}
          onSeek={(s) => handleSeek(s)}
          onTogglePlayPause={() => setIsPlaying(!isPlaying)}
          onClose={() => setShowLyricsModal(false)}
          isModal={true}
        />
      )}

      {/* MODAL: QUEUE */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm max-h-[480px] rounded-3xl bg-[#10131C]/95 backdrop-blur-2xl border border-[#171B28] p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black uppercase tracking-wide text-[#F7F8FC]">Now Playing Queue</h3>
              <button onClick={() => setShowQueueModal(false)} className="text-[#9CA3B7] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {tracks.map((t, idx) => (
                <div
                  key={`q-${t.id}`}
                  onClick={() => {
                    handleSelectTrack(t);
                    setShowQueueModal(false);
                  }}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    t.id === currentTrack.id ? 'bg-[#00F5FF]/15 text-[#00F5FF] font-bold border border-[#00F5FF]/30' : 'text-[#9CA3B7] hover:text-[#F7F8FC] hover:bg-white/5'
                  }`}
                >
                  <span className="w-4 text-[#61697C] font-mono">{idx + 1}</span>
                  <span className="flex-1 truncate">{t.title}</span>
                  <span className="text-[11px] text-[#61697C]">{t.artist}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMING IN FUTURE BUILD */}
      {comingSoonTitle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-5">
          <div className="w-full max-w-sm rounded-3xl bg-[#10131C]/95 backdrop-blur-2xl border border-[#00F5FF]/30 p-6 space-y-4 shadow-2xl shadow-[#00F5FF]/10">
            <div className="w-12 h-12 rounded-2xl bg-[#00F5FF]/15 border border-[#00F5FF]/40 flex items-center justify-center text-[#00F5FF]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase text-[#F7F8FC] mb-1">{comingSoonTitle}</h3>
              <p className="text-xs text-[#9CA3B7] leading-relaxed">
                This feature is scheduled for future milestones (Block 2+ audio streaming engine, cloud persistence & hardware DSP).
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setComingSoonTitle(null)}
                className="w-full py-2.5 rounded-xl bg-[#00F5FF] text-[#07090F] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#00F5FF]/20 hover:brightness-110 active:scale-95 transition-all"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: YOUTUBE EMBEDDED PLAYER */}
      {activeYouTubePlayerTrack && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0A0D15] border border-red-500/40 rounded-3xl overflow-hidden shadow-2xl shadow-red-500/20 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#10131C]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-600/30">
                  <Youtube className="w-4 h-4 fill-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate max-w-sm sm:max-w-md">
                    {activeYouTubePlayerTrack.title}
                  </div>
                  <div className="text-[10px] text-red-400 truncate">
                    {activeYouTubePlayerTrack.artist} • Official YouTube Stream
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-lg font-mono font-bold hidden sm:inline">
                  In-App Player
                </span>
                <button
                  onClick={() => setActiveYouTubePlayerTrack(null)}
                  className="p-1.5 rounded-lg text-[#9CA3B7] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded Iframe Player */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeYouTubePlayerTrack.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1`}
                title={activeYouTubePlayerTrack.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Footer controls & info */}
            <div className="p-4 bg-[#10131C] border-t border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  YOUTUBE COMPLIANT
                </span>
                <span className="text-[11px] text-[#9CA3B7] hidden sm:inline">
                  Playing via official YouTube Embedded Player API
                </span>
              </div>
              <button
                onClick={() => setActiveYouTubePlayerTrack(null)}
                className="px-4 py-1.5 rounded-full bg-[#00F5FF] text-[#07090F] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Done / Minimize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spotify Live Player Modal */}
      <SpotifyPlayerModal
        track={activeSpotifyPlayerTrack}
        isOpen={Boolean(activeSpotifyPlayerTrack)}
        onClose={() => setActiveSpotifyPlayerTrack(null)}
        onPlayViaYouTube={handlePlaySpotifyTrackViaYouTube}
      />

      {/* Spotify Import Playlist Modal */}
      <SpotifyImportModal
        isOpen={isSpotifyImportOpen}
        onClose={() => setIsSpotifyImportOpen(false)}
        onPlaylistImported={handlePlaylistImported}
        theme={preferences.theme}
        nrcAccent={preferences.nrcAccent}
      />

      {/* Subscription & Pro Upgrade Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        theme={preferences.theme}
        isProUser={isProUser}
        onUpgradeSuccess={() => {
          setIsProUser(true);
          localStorage.setItem('sona_is_pro', 'true');
        }}
      />

      {/* Floating Toast for Import Notification */}
      {spotifyImportToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{spotifyImportToast}</span>
        </div>
      )}
    </div>
  );
};

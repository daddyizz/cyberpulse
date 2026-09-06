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
  Video
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
import { AndroidHomeScreen } from './AndroidHomeScreen';
import { SettingsView } from './SettingsView';
import { LikedSongsView } from './LikedSongsView';
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
  const [currentTrack, setCurrentTrack] = useState<Track>(DEMO_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [seekSeconds, setSeekSeconds] = useState<number>(0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  // Inform parent of playback changes
  useEffect(() => {
    onPlaybackStateChange?.(isPlaying);
  }, [isPlaying, onPlaybackStateChange]);

  // 2 Main Player Modes: 'audio' (Audio Only) vs 'video' (Music Video)
  const [playbackMediaMode, setPlaybackMediaMode] = useState<'audio' | 'video'>('video');
  // Sub-options during Audio Only: 'artwork' | 'visualizer' | 'lyrics'
  const [audioVisualMode, setAudioVisualMode] = useState<'artwork' | 'visualizer' | 'lyrics'>('artwork');

  // Ref to control the unified YouTube Player IFrame
  const ytIframeRef = useRef<HTMLIFrameElement>(null);

  // Derive matched YouTube video ID for full-length, high-definition streaming
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

  // Fungsi hantar arahan terus ke iframe YouTube
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
        console.error('Error posting command to YouTube iframe:', err);
      }
    }
  };

  // Butang Play/Pause kontekstual: mengawal video YouTube dan audio Spotify/tempatan
  const togglePlayPause = () => {
    if (isYouTubeActive) {
      if (isPlaying) {
        sendYTCommand('pauseVideo');
        setIsPlaying(false);
      } else {
        sendYTCommand('playVideo');
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Kawalan Slider Seekbar
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
        if (data.event === 'onStateChange') {
          // 1: PLAYING, 2: PAUSED, 0: ENDED
          if (data.info === 1) {
            setIsPlaying(true);
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
    setPlaybackMediaMode('video');
    setIsNowPlayingOpen(true);
    setIsPlaying(true);
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
    };

    setCurrentTrack(playableTrack);
    setSeekSeconds(0);
    setActiveSpotifyPlayerTrack(null);
    setActiveYouTubePlayerTrack(null);
    setIsPlaying(true);

    // If no exact YouTube ID was found and track is from Spotify/Search, query YouTube in background for full song
    if (!initialYtId) {
      try {
        const ytRes = await searchYouTubeVideos(`${track.title} ${track.artist}`, 1);
        if (ytRes.tracks.length > 0 && ytRes.tracks[0].youtubeVideoId) {
          const matchedId = ytRes.tracks[0].youtubeVideoId;
          setCurrentTrack((prev) => {
            if (prev.id === track.id || prev.title.toLowerCase() === track.title.toLowerCase()) {
              return { ...prev, youtubeVideoId: matchedId };
            }
            return prev;
          });
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
    const nextTrack = tracks[nextIndex];
    const matchYt = DEMO_TRACKS.find(
      (t) => t.id === nextTrack.id || t.title.toLowerCase() === nextTrack.title.toLowerCase()
    );

    setCurrentTrack({
      ...nextTrack,
      youtubeVideoId: nextTrack.youtubeVideoId || matchYt?.youtubeVideoId || '4NRXx6U8ABQ',
      source: isYouTubeActive || playbackMediaMode === 'video' ? 'YOUTUBE' : nextTrack.source,
    });
    setSeekSeconds(0);
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
    const prevTrack = tracks[prevIndex];
    const matchYt = DEMO_TRACKS.find(
      (t) => t.id === prevTrack.id || t.title.toLowerCase() === prevTrack.title.toLowerCase()
    );

    setCurrentTrack({
      ...prevTrack,
      youtubeVideoId: prevTrack.youtubeVideoId || matchYt?.youtubeVideoId || '4NRXx6U8ABQ',
      source: isYouTubeActive || playbackMediaMode === 'video' ? 'YOUTUBE' : prevTrack.source,
    });
    setSeekSeconds(0);
    setIsPlaying(true);
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
    ? (DEMO_PLAYLISTS || []).filter(
        (p) =>
          p?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const isDarkOled = preferences.theme === 'oled';
  const isSporty = preferences.theme === 'sporty';
  const bgColor = isDarkOled ? 'bg-[#000000]' : isSporty ? 'bg-[#090D13]' : 'bg-[#07090F]';
  const cardBgColor = isDarkOled
    ? 'bg-[#0C0C0C]'
    : isSporty
    ? 'bg-[#101722]/90 backdrop-blur-xl border border-[#B8FF2C]/30'
    : 'bg-[#10131C]/90 backdrop-blur-xl border border-[#171B28]';

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
    <div className={`relative w-full h-full flex flex-col ${bgColor} text-[#F7F8FC] select-none overflow-hidden font-sans`}>
      {/* Ambient Lighting Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-[-10%] left-[-5%] w-[400px] h-[400px] ${isSporty ? 'bg-[#B8FF2C]' : 'bg-[#8B5CFF]'} opacity-10 rounded-full blur-[120px]`} />
        <div className={`absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] ${isSporty ? 'bg-[#FF5E3A]' : 'bg-[#00F5FF]'} opacity-10 rounded-full blur-[150px]`} />
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
        <main className="flex-1 overflow-y-auto flex flex-col relative pb-28">
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
                      “CyberPulse will use your listening activity to improve recommendations.”
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
                    Your CyberPulse engine is calibrated. Immerse into the frequency of sound.
                  </p>
                  <button
                    onClick={handleFinishOnboarding}
                    className="w-full py-3.5 rounded-2xl bg-[#00F5FF] text-[#07090F] font-black uppercase tracking-wider text-xs shadow-lg shadow-[#00F5FF]/30 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Enter CyberPulse</span>
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
                  <h1 className="text-2xl font-black tracking-tight text-[#00F5FF]">CYBER LISTENER</h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {onToggleMinimize && (
                    <button
                      onClick={onToggleMinimize}
                      className="p-2 rounded-full bg-[#10131C] border border-[#171B28] hover:border-[#00F5FF]/40 text-[#9CA3B7] hover:text-[#00F5FF] transition-colors cursor-pointer"
                      title="Minimize App (Uji Main di Latar Belakang)"
                    >
                      <Home className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentScreen('settings')}
                    className="p-2 rounded-full bg-[#10131C] border border-[#171B28] hover:border-[#00F5FF]/40 text-[#9CA3B7] hover:text-[#F7F8FC] transition-colors cursor-pointer"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentScreen('profile')}
                    className="w-10 h-10 rounded-full bg-[#171B28] border border-[#00F5FF]/30 flex items-center justify-center shadow-lg shadow-black cursor-pointer hover:border-[#00F5FF] transition-colors"
                    title="Profile"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#00F5FF] to-[#8B5CFF] flex items-center justify-center text-[10px] font-black text-black">
                      CL
                    </div>
                  </button>
                </div>
              </header>

              {/* Featured Mix Hero Section */}
              <section className="w-full">
                <div className="relative h-56 w-full rounded-2xl overflow-hidden border border-[#171B28] bg-[#10131C] shadow-2xl shadow-black/60">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#10131C] via-[#10131C]/70 to-transparent z-10" />
                  <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center" />
                  <div className="relative z-20 p-6 h-full flex flex-col justify-center">
                    <span className="bg-[#FF2ED1] text-black text-[10px] font-black px-2 py-0.5 rounded-sm w-fit mb-2 uppercase tracking-tighter">
                      Featured Mix
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter leading-none mb-2 uppercase text-[#F7F8FC]">
                      Electric Dreams
                    </h2>
                    <p className="text-[#9CA3B7] text-xs sm:text-sm max-w-xs sm:max-w-md mb-4 line-clamp-2">
                      The definitive cyberpunk soundscape for your digital journey. Updated every cycle.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const trk = tracks.find((t) => t.title.toLowerCase().includes('electric')) || tracks[0];
                          handleSelectTrack(trk);
                        }}
                        className="bg-[#00F5FF] text-[#07090F] font-bold px-6 py-2 rounded-full text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#00F5FF]/20 cursor-pointer"
                      >
                        Play Now
                      </button>
                      <button
                        onClick={() => setCurrentScreen('library')}
                        className="bg-[#171B28] border border-[#61697C] text-[#F7F8FC] font-bold px-6 py-2 rounded-full text-xs uppercase tracking-wider hover:border-white transition-colors cursor-pointer"
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
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#1A102F] to-[#0E131F] border border-[#8B5CFF]/40 hover:border-[#8B5CFF] transition-all cursor-pointer group shadow-lg shadow-black/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#8B5CFF]/20 text-[#8B5CFF] border border-[#8B5CFF]/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Radio className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-[#00F5FF] transition-colors">
                          Cyber DJ
                        </h4>
                        <span className="text-[9px] bg-[#00F5FF]/15 text-[#00F5FF] border border-[#00F5FF]/40 px-1.5 py-0.2 rounded-full font-bold uppercase">
                          Live Flow
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9CA3B7] mt-0.5">
                        Continuous adaptive queue • Drive, Workout, Chill
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3B7] group-hover:text-[#00F5FF] transition-colors" />
                </div>

                {/* AI Playlist Generator Card */}
                <div
                  onClick={() => setCurrentScreen('ai_playlist')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#091C29] to-[#0E131F] border border-[#00F5FF]/40 hover:border-[#00F5FF] transition-all cursor-pointer group shadow-lg shadow-black/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-[#00F5FF] transition-colors">
                          AI Playlist Generator
                        </h4>
                        <span className="text-[9px] bg-[#8B5CFF]/15 text-[#8B5CFF] border border-[#8B5CFF]/40 px-1.5 py-0.2 rounded-full font-bold uppercase">
                          AI Studio
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9CA3B7] mt-0.5">
                        Prompt to verified playable tracklists
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3B7] group-hover:text-[#00F5FF] transition-colors" />
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
                  <span
                    onClick={() =>
                      handleOpenSection({
                        title: 'Made For You',
                        subtitle: 'Personalized cyber mixes and curated tracklists',
                        type: 'playlists',
                        items: DEMO_PLAYLISTS,
                        badgeText: 'Curated Mixes'
                      })
                    }
                    className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline"
                  >
                    Explore
                  </span>
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">
                  {DEMO_PLAYLISTS.slice(0, 4).map((pl) => (
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
                        items: DEMO_PLAYLISTS,
                        badgeText: 'Audio Mixes'
                      })
                    }
                    className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline"
                  >
                    See All
                  </span>
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">
                  {DEMO_PLAYLISTS.map((pl) => (
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
                      </div>
                      <div className="text-xs font-bold truncate text-[#F7F8FC]">{pl.title}</div>
                      <div className="text-[10px] text-[#9CA3B7] uppercase tracking-tighter truncate">Curated Mix</div>
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
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7]">Your Playlists</h2>
                  <span
                    onClick={() =>
                      handleOpenSection({
                        title: 'Your Playlists',
                        subtitle: 'All curated mixes and user playlists in your cyber library',
                        type: 'playlists',
                        items: DEMO_PLAYLISTS,
                        badgeText: 'Library Playlists'
                      })
                    }
                    className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline"
                  >
                    See All
                  </span>
                </div>
                <div className="space-y-2">
                  {DEMO_PLAYLISTS.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => {
                        setSelectedPlaylistId(pl.id);
                        setCurrentScreen('playlist_detail');
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#10131C]/80 border border-transparent hover:border-[#171B28] cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#171B28]">
                        <CyberArtwork keyName={pl.artworkKey} artworkUrl={pl.artworkUrl} title={pl.title} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#F7F8FC] truncate">{pl.title}</div>
                        <div className="text-[11px] text-[#9CA3B7]">Playlist • {pl.trackCount} songs</div>
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
              <h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC]">Profile</h1>

              {/* User Profile Card */}
              <div className="p-4 rounded-2xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-xl shadow-2xl shadow-black space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00F5FF] via-[#8B5CFF] to-[#FF2ED1] p-[2px] shadow-lg shadow-[#00F5FF]/20">
                    <div className="w-full h-full rounded-full bg-[#07090F] flex items-center justify-center font-black text-[#00F5FF] text-lg">
                      CL
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-black uppercase text-[#F7F8FC]">{DEFAULT_PROFILE.username}</div>
                    <div className="text-xs text-[#9CA3B7]">
                      {DEFAULT_PROFILE.handle} • <span className="text-[#00F5FF] font-bold">Free Plan</span>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#171B28] text-center">
                  <div>
                    <div className="text-sm font-black text-[#F7F8FC]">0</div>
                    <div className="text-[10px] text-[#9CA3B7] uppercase tracking-wider">Playlists</div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#F7F8FC]">{(tracks || []).filter((t) => t?.isLiked).length}</div>
                    <div className="text-[10px] text-[#9CA3B7] uppercase tracking-wider">Liked Songs</div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#F7F8FC]">0</div>
                    <div className="text-[10px] text-[#9CA3B7] uppercase tracking-wider">Following</div>
                  </div>
                </div>
              </div>

              {/* Menu Options */}
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-2">Preferences & System</div>
                {[
                  { label: 'Account & Subscription', action: () => setCurrentScreen('settings') },
                  { label: 'Listening Stats & Liked Collection', action: () => setCurrentScreen('liked_songs') },
                  { label: 'Appearance & Themes (Sporty, OLED, Frosted)', action: () => setCurrentScreen('settings') },
                  { label: 'Audio Engine & DSP Preferences', action: () => setCurrentScreen('settings') },
                  { label: 'Google AdMob Configuration', action: () => setCurrentScreen('settings') },
                  { label: 'Notifications & Cache', action: () => setCurrentScreen('settings') },
                  { label: 'Liked Songs Collection', action: () => setCurrentScreen('liked_songs') },
                  { label: 'All Settings', action: () => setCurrentScreen('settings') },
                ].map((item) => (
                  <div
                    key={item.label}
                    onClick={item.action}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[#10131C]/80 border border-transparent hover:border-[#171B28] cursor-pointer text-xs font-bold text-[#F7F8FC] transition-colors"
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
              onUpdatePreferences={onUpdatePreferences}
              onBack={() => setCurrentScreen('profile')}
            />
          )}

          {/* SCREEN: LIKED SONGS */}
          {currentScreen === 'liked_songs' && (
            <LikedSongsView
              tracks={tracks}
              onSelectTrack={handleSelectTrack}
              onToggleLike={handleToggleLike}
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
                />
              );
            })()
          )}

          {/* SCREEN: PLAYLIST DETAIL */}
          {currentScreen === 'playlist_detail' && (
            (() => {
              const playlist = DEMO_PLAYLISTS.find((p) => p.id === selectedPlaylistId) || DEMO_PLAYLISTS[0];
              return (
                <PlaylistDetailView
                  playlist={playlist}
                  onBack={() => setCurrentScreen('home')}
                  onSelectTrack={handleSelectTrack}
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
            />
          )}

          {currentScreen === 'ai_playlist' && (
            <AiPlaylistView
              onBack={() => setCurrentScreen('home')}
              onPlayTrack={handleSelectTrack}
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
            />
          )}
        </main>

        {/* Persistent Mini Player (Docked above Bottom Nav) - Frosted Glass Design */}
        {currentScreen !== 'onboarding' && (
          <div
            onClick={() => setIsNowPlayingOpen(true)}
            className={`absolute bottom-20 left-3 right-3 sm:left-4 sm:right-4 h-16 bg-[#10131C]/90 backdrop-blur-xl border rounded-2xl flex items-center px-3 sm:px-4 z-30 shadow-2xl shadow-black cursor-pointer transition-all ${
              currentTrack.source === 'SPOTIFY'
                ? 'border-[#1DB954]/40 hover:border-[#1DB954]/80'
                : currentTrack.source === 'YOUTUBE'
                ? 'border-red-500/40 hover:border-red-500/80'
                : 'border-[#00F5FF]/20 hover:border-[#00F5FF]/50'
            }`}
          >
            {/* Album thumbnail */}
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#00F5FF]/20 mr-3 shadow-md shadow-black relative bg-black">
              <CyberArtwork keyName={currentTrack.placeholderArtworkKey} artworkUrl={currentTrack.artworkUrl} />
              {currentTrack.source === 'YOUTUBE' && (
                <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center">
                  <Youtube className="w-2 h-2 text-white fill-current" />
                </div>
              )}
              {currentTrack.source === 'SPOTIFY' && (
                <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-[#1DB954] rounded-full flex items-center justify-center">
                  <Music className="w-2 h-2 text-black" />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="text-xs font-black uppercase text-[#F7F8FC] truncate">{currentTrack.title}</div>
              <div className="text-[10px] uppercase text-[#00F5FF] font-bold truncate flex items-center gap-1.5">
                <span>{currentTrack.artist}</span>
                {currentTrack.source === 'YOUTUBE' && (
                  <span className="text-[8px] bg-red-950 text-red-400 border border-red-800/40 px-1 py-0 rounded font-mono">
                    YT LIVE
                  </span>
                )}
                {currentTrack.source === 'SPOTIFY' && (
                  <span className="text-[8px] bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40 px-1 py-0 rounded font-mono">
                    SPOTIFY LIVE
                  </span>
                )}
              </div>
            </div>

            {/* Quick YouTube Button on MiniPlayer */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayViaYouTube(currentTrack);
              }}
              className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white transition-all mr-1"
              title="Play YouTube video version"
            >
              <Youtube className="w-3.5 h-3.5 fill-current" />
            </button>

            {/* Controls: Prev, Play, Next */}
            <div className="flex items-center gap-2 sm:gap-3 px-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevTrack();
                }}
                className="text-[#9CA3B7] hover:text-[#F7F8FC] transition-colors p-1 cursor-pointer"
                title="Previous track"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold bg-[#00F5FF] text-[#07090F] shadow-md shadow-[#00F5FF]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextTrack();
                }}
                className="text-[#9CA3B7] hover:text-[#F7F8FC] transition-colors p-1 cursor-pointer"
                title="Next track"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>

            {/* Progress Bar Indicator with Neon Cyan Glow */}
            <div className="w-16 sm:w-28 h-1 bg-[#171B28] rounded-full overflow-hidden shrink-0 hidden xs:block">
              <div
                className="h-full bg-[#00F5FF] shadow-[0_0_10px_#00F5FF] transition-all"
                style={{
                  width: `${Math.min(100, (seekSeconds / (currentTrack.durationSeconds || 214)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Standard Phone Bottom Navigation Bar - Frosted Glass Design */}
        {!isTabletView && currentScreen !== 'onboarding' && (
          <nav className="absolute bottom-0 left-0 right-0 h-20 bg-[#10131C]/95 backdrop-blur-xl border-t border-[#171B28] flex items-center justify-around px-4 sm:px-8 z-20">
            {navItems.map(({ id, label, icon: IconComponent }) => {
              const active = currentScreen === id;
              return (
                <button
                  key={id}
                  onClick={() => setCurrentScreen(id as ScreenType)}
                  className={`flex flex-col items-center gap-1 transition-colors py-1 px-2 ${
                    active ? 'text-[#00F5FF]' : 'text-[#61697C] hover:text-[#9CA3B7]'
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
            <div className="inline-flex p-1 rounded-full bg-[#10131C] border border-[#171B28] shadow-inner">
              <button
                onClick={() => setPlaybackMediaMode('audio')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  playbackMediaMode === 'audio'
                    ? 'bg-[#00F5FF] text-[#07090F] shadow-md shadow-[#00F5FF]/30 font-black'
                    : 'text-[#9CA3B7] hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Only</span>
              </button>
              <button
                onClick={() => setPlaybackMediaMode('video')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  playbackMediaMode === 'video'
                    ? 'bg-[#00F5FF] text-[#07090F] shadow-md shadow-[#00F5FF]/30 font-black'
                    : 'text-[#9CA3B7] hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Music Video</span>
              </button>
            </div>

            {/* Sub-options when in Audio Only: Cover | Visualizer | Lyrics */}
            {playbackMediaMode === 'audio' && (
              <div className="inline-flex p-0.5 rounded-full bg-[#10131C]/60 border border-[#171B28] animate-in fade-in duration-200">
                <button
                  onClick={() => setAudioVisualMode('artwork')}
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    audioVisualMode === 'artwork' ? 'bg-[#00F5FF]/20 text-[#00F5FF]' : 'text-[#9CA3B7] hover:text-white'
                  }`}
                >
                  Cover
                </button>
                <button
                  onClick={() => setAudioVisualMode('visualizer')}
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    audioVisualMode === 'visualizer' ? 'bg-[#00F5FF]/20 text-[#00F5FF]' : 'text-[#9CA3B7] hover:text-white'
                  }`}
                >
                  Visualizer
                </button>
                <button
                  onClick={() => setAudioVisualMode('lyrics')}
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    audioVisualMode === 'lyrics' ? 'bg-[#00F5FF]/20 text-[#00F5FF]' : 'text-[#9CA3B7] hover:text-white'
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
              className={`w-full max-w-[320px] sm:max-w-[360px] aspect-video mx-auto rounded-2xl overflow-hidden border-2 border-[#00F5FF]/40 shadow-[0_0_35px_rgba(0,245,255,0.2)] bg-black transition-all ${
                playbackMediaMode === 'video'
                  ? 'relative block mb-2'
                  : 'absolute -top-[9999px] left-0 w-1 h-1 opacity-0 pointer-events-none'
              }`}
            >
              <iframe
                ref={ytIframeRef}
                src={`https://www.youtube-nocookie.com/embed/${effectiveYtId}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&autoplay=1&origin=${encodeURIComponent(
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
                <div className="w-full max-w-[260px] sm:max-w-[280px] aspect-square mx-auto rounded-3xl overflow-hidden border-2 border-[#00F5FF]/40 shadow-[0_0_35px_rgba(0,245,255,0.2)] relative group">
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
                onSeek={(s) => handleSeek(s)}
                onTogglePlayPause={togglePlayPause}
              />
            )}
          </div>

          {/* Track Meta & Like */}
          <div className="flex items-center justify-between mt-3 mb-2 relative z-10 px-1">
            <div className="min-w-0 pr-3">
              <div className="text-lg sm:text-xl font-black uppercase text-[#F7F8FC] truncate">{currentTrack.title}</div>
              <div className="text-xs font-bold uppercase text-[#00F5FF] tracking-wider truncate">{currentTrack.artist}</div>
            </div>
            <button
              onClick={() => handleToggleLike(currentTrack.id)}
              className="p-1.5 text-[#9CA3B7] hover:text-[#FF2ED1] transition-colors"
            >
              <Heart
                className={`w-6 h-6 sm:w-7 sm:h-7 ${
                  currentTrack.isLiked ? 'fill-[#FF2ED1] text-[#FF2ED1]' : 'text-[#9CA3B7]'
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
              className="w-full h-1.5 bg-[#171B28] rounded-lg appearance-none cursor-pointer accent-[#00F5FF]"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#9CA3B7]">
              <span>{`${Math.floor(seekSeconds / 60)}:${String(seekSeconds % 60).padStart(2, '0')}`}</span>
              <span>{`${Math.floor((currentTrack.durationSeconds || 214) / 60)}:${String(
                (currentTrack.durationSeconds || 214) % 60
              ).padStart(2, '0')}`}</span>
            </div>
          </div>

          {/* Controls: Shuffle, Prev, Play, Next, Repeat - Scaled for Mobile/Tablet Devices */}
          <div className="flex items-center justify-between py-3 max-w-xs mx-auto w-full relative z-10">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-1.5 transition-colors ${isShuffle ? 'text-[#00F5FF]' : 'text-[#61697C]'}`}
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handlePrevTrack}
              className="p-1.5 text-[#F7F8FC] hover:text-[#00F5FF] transition-colors"
            >
              <SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            </button>
            <button
              onClick={togglePlayPause}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold bg-[#00F5FF] text-[#07090F] shadow-lg shadow-[#00F5FF]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-[#07090F]" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-[#07090F] ml-0.5" />
              )}
            </button>
            <button
              onClick={handleNextTrack}
              className="p-1.5 text-[#F7F8FC] hover:text-[#00F5FF] transition-colors"
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
    </div>
  );
};

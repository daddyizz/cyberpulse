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
import { searchYouTubeVideos, validateYouTubeVideoId } from '../services/youtubeService';
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

  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(preferences.selectedGenres || []);
  const [selectedArtists, setSelectedArtists] = useState<string[]>(preferences.selectedArtists || []);
  const [personalizationEnabled, setPersonalizationEnabled] = useState<boolean>(true);

  const [tracks, setTracks] = useState<Track[]>(DEMO_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track>(DEMO_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [seekSeconds, setSeekSeconds] = useState<number>(0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  useEffect(() => {
    onPlaybackStateChange?.(isPlaying);
  }, [isPlaying, onPlaybackStateChange]);

  const [playbackMediaMode, setPlaybackMediaMode] = useState<'audio' | 'video'>('video');
  const [audioVisualMode, setAudioVisualMode] = useState<'artwork' | 'visualizer' | 'lyrics'>('artwork');
  const ytIframeRef = useRef<HTMLIFrameElement>(null);

  const effectiveYtId =
    currentTrack.youtubeVideoId ||
    DEMO_TRACKS.find(
      (t) =>
        t.id === currentTrack.id ||
        t.title.toLowerCase() === currentTrack.title.toLowerCase() ||
        (currentTrack.spotifyTrackId && t.spotifyTrackId === currentTrack.spotifyTrackId)
    )?.youtubeVideoId;

  const isYouTubeActive = Boolean(effectiveYtId);

  const sendYTCommand = (func: string, args: any[] = []) => {
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      try {
        ytIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      } catch (err) {
        console.error('Error posting command to YouTube iframe:', err);
      }
    }
  };

  const togglePlayPause = () => {
    if (isYouTubeActive) {
      if (isPlaying) {
        sendYTCommand('pauseVideo');
        setIsPlaying(false);
      } else {
        sendYTCommand('playVideo');
        setIsPlaying(true);
      }
    } else if (currentTrack.audioUrl) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (newSeconds: number) => {
    setSeekSeconds(newSeconds);
    if (isYouTubeActive) sendYTCommand('seekTo', [newSeconds, true]);
    else cyberAudio.seek(newSeconds);
  };

  useEffect(() => {
    const handleYTMessage = (event: MessageEvent) => {
      if (!event.data) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.event === 'onStateChange') {
          if (data.info === 1) setIsPlaying(true);
          else if (data.info === 2) setIsPlaying(false);
          else if (data.info === 0) {
            if (isRepeat) {
              sendYTCommand('seekTo', [0, true]);
              sendYTCommand('playVideo');
            } else {
              handleNextTrack();
            }
          }
        }
        if (data.event === 'onError') {
          setIsPlaying(false);
          setCurrentTrack((prev) => ({ ...prev, youtubeVideoId: undefined }));
          if (currentTrack.audioUrl) {
            setPlaybackMediaMode('audio');
            setTimeout(() => setIsPlaying(true), 0);
          }
        }
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setSeekSeconds(Math.floor(data.info.currentTime));
          }
        }
      } catch {
        // ignore non-JSON iframe messages
      }
    };
    window.addEventListener('message', handleYTMessage);
    return () => window.removeEventListener('message', handleYTMessage);
  }, [isRepeat, currentTrack.audioUrl]);

  // Do not manufacture time. The slider advances only from real YouTube infoDelivery
  // or the real HTML audio engine callback below.
  useEffect(() => {
    if (isPlaying && isYouTubeActive) sendYTCommand('getCurrentTime');
  }, [isPlaying, isYouTubeActive, currentTrack.id]);

  useEffect(() => {
    if (isYouTubeActive) {
      cyberAudio.pause();
      if (isPlaying) sendYTCommand('playVideo');
      else sendYTCommand('pauseVideo');
      return;
    }

    if (!isPlaying) {
      cyberAudio.pause();
      return;
    }

    let url = currentTrack.audioUrl;
    if (!url) {
      const match = DEMO_TRACKS.find(
        (t) =>
          t.title.toLowerCase() === currentTrack.title.toLowerCase() &&
          t.artist.toLowerCase() === currentTrack.artist.toLowerCase()
      );
      url = match?.audioUrl;
    }

    if (!url) {
      setIsPlaying(false);
      return;
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
          if (isRepeat) cyberAudio.seek(0);
          else handleNextTrack();
        }
      )
      .catch(() => setIsPlaying(false));
  }, [isPlaying, currentTrack.id, currentTrack.audioUrl, isYouTubeActive]);

  useEffect(() => {
    cyberAudio.setMediaSessionHandlers({
      onPlay: () => togglePlayPause(),
      onPause: () => togglePlayPause(),
      onNextTrack: () => handleNextTrack(),
      onPrevTrack: () => handlePrevTrack(),
      onSeek: (secs) => handleSeek(secs),
    });
  }, [currentTrack, tracks, isYouTubeActive, isPlaying]);

  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [comingSoonTitle, setComingSoonTitle] = useState<string | null>(null);
  const [showLyricsModal, setShowLyricsModal] = useState<boolean>(false);
  const [showQueueModal, setShowQueueModal] = useState<boolean>(false);

  const [visualizerMode, setVisualizerMode] = useState<
    'NEON_WAVE' | 'SPECTRUM_PULSE' | 'CYBER_GRID' | 'ORBITAL_PULSE' | 'PARTICLE_FLOW'
  >('NEON_WAVE');
  const [showProLockToast, setShowProLockToast] = useState<boolean>(false);
  const [lyricsAutoScroll, setLyricsAutoScroll] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [youtubeResults, setYoutubeResults] = useState<Track[]>([]);
  const [isSearchingYoutube, setIsSearchingYoutube] = useState<boolean>(false);
  const [youtubeSearchError, setYoutubeSearchError] = useState<string | null>(null);
  const [activeYouTubePlayerTrack, setActiveYouTubePlayerTrack] = useState<Track | null>(null);

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
    }
    setYoutubeResults([]);
  }, [searchQuery, searchFilter]);

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
    }
    setSpotifyResults([]);
  }, [searchQuery, searchFilter]);

  const [greeting, setGreeting] = useState<string>('Good Evening');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) setGreeting('Good Morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    if (!preferences.isOnboardingCompleted) {
      setCurrentScreen('onboarding');
      setOnboardingStep(1);
    }
  }, [preferences.isOnboardingCompleted]);

  const handleToggleLike = (trackId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, isLiked: !t.isLiked } : t)));
    if (currentTrack.id === trackId) setCurrentTrack((prev) => ({ ...prev, isLiked: !prev.isLiked }));
  };

  const removeUnavailableTrack = (track: Track) => {
    setTracks((prev) => prev.filter((item) => item.id !== track.id));
    setYoutubeResults((prev) => prev.filter((item) => item.id !== track.id));
    setSpotifyResults((prev) => prev.filter((item) => item.id !== track.id));
  };

  const resolvePlayableYouTubeId = async (track: Track): Promise<string | undefined> => {
    if (track.youtubeVideoId && (await validateYouTubeVideoId(track.youtubeVideoId))) {
      return track.youtubeVideoId;
    }

    const demoMatch = DEMO_TRACKS.find(
      (t) =>
        t.id === track.id ||
        t.title.toLowerCase() === track.title.toLowerCase() ||
        (track.spotifyTrackId && t.spotifyTrackId === track.spotifyTrackId)
    );
    if (demoMatch?.youtubeVideoId && demoMatch.youtubeVideoId !== track.youtubeVideoId) {
      if (await validateYouTubeVideoId(demoMatch.youtubeVideoId)) return demoMatch.youtubeVideoId;
    }

    try {
      const result = await searchYouTubeVideos(`${track.title} ${track.artist}`, 3);
      return result.tracks.find((item) => item.youtubeVideoId)?.youtubeVideoId;
    } catch {
      return undefined;
    }
  };

  const findExactAudioUrl = (track: Track): string | undefined => {
    if (track.audioUrl) return track.audioUrl;
    return DEMO_TRACKS.find(
      (t) =>
        t.id === track.id ||
        (t.title.toLowerCase() === track.title.toLowerCase() &&
          t.artist.toLowerCase() === track.artist.toLowerCase())
    )?.audioUrl;
  };

  const handlePlayViaYouTube = async (track: Track) => {
    cyberAudio.pause();
    setIsPlaying(false);
    setSeekSeconds(0);

    const youtubeVideoId = await resolvePlayableYouTubeId(track);
    if (!youtubeVideoId) {
      if (!findExactAudioUrl(track)) removeUnavailableTrack(track);
      setComingSoonTitle('Music video unavailable');
      return;
    }

    const resolvedTrack: Track = { ...track, youtubeVideoId, source: 'YOUTUBE' };
    setCurrentTrack(resolvedTrack);
    setPlaybackMediaMode('video');
    setIsNowPlayingOpen(true);
    setIsPlaying(true);
  };

  const handleSelectTrack = async (track: Track) => {
    cyberAudio.pause();
    setIsPlaying(false);
    setSeekSeconds(0);

    const resolvedAudioUrl = findExactAudioUrl(track);
    const youtubeVideoId = await resolvePlayableYouTubeId(track);

    if (!resolvedAudioUrl && !youtubeVideoId) {
      removeUnavailableTrack(track);
      setComingSoonTitle('Playback unavailable');
      return;
    }

    const playableTrack: Track = {
      ...track,
      audioUrl: resolvedAudioUrl,
      youtubeVideoId,
      source: youtubeVideoId ? 'YOUTUBE' : track.source,
    };

    setCurrentTrack(playableTrack);
    setActiveSpotifyPlayerTrack(null);
    setActiveYouTubePlayerTrack(null);
    setPlaybackMediaMode(youtubeVideoId ? 'video' : 'audio');
    setIsPlaying(true);
  };

  const handlePlaySpotifyTrackViaYouTube = (spTrack: Track) => {
    void handlePlayViaYouTube(spTrack);
  };

  const handleNextTrack = () => {
    if (!tracks.length) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0;
    const nextTrack = tracks[nextIndex];
    if (nextTrack) void handleSelectTrack(nextTrack);
  };

  const handlePrevTrack = () => {
    if (!tracks.length) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
    const prevTrack = tracks[prevIndex];
    if (prevTrack) void handleSelectTrack(prevTrack);
  };

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
        onTogglePlayPause={togglePlayPause}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
        onResumeApp={() => onToggleMinimize?.()}
      />
    );
  }

  return (
    <div className={`relative w-full h-full flex flex-col ${bgColor} text-[#F7F8FC] select-none overflow-hidden font-sans`}>
      {!isNowPlayingOpen && effectiveYtId && (
        <iframe
          ref={ytIframeRef}
          src={`https://www.youtube-nocookie.com/embed/${effectiveYtId}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&playsinline=1&autoplay=1&origin=${encodeURIComponent(
            typeof window !== 'undefined' ? window.location.origin : ''
          )}`}
          title={`${currentTrack.title} background player`}
          className="absolute -top-[9999px] left-0 w-1 h-1 opacity-0 pointer-events-none"
          allow="autoplay; encrypted-media"
          onLoad={() => {
            if (isPlaying) sendYTCommand('playVideo');
          }}
        />
      )}

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-[-10%] left-[-5%] w-[400px] h-[400px] ${isSporty ? 'bg-[#B8FF2C]' : 'bg-[#8B5CFF]'} opacity-10 rounded-full blur-[120px]`} />
        <div className={`absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] ${isSporty ? 'bg-[#FF5E3A]' : 'bg-[#00F5FF]'} opacity-10 rounded-full blur-[150px]`} />
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {isTabletView && currentScreen !== 'onboarding' && (
          <aside className="w-20 border-r border-[#171B28] bg-[#10131C]/95 backdrop-blur-xl flex flex-col items-center py-6 z-20 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5FF] to-[#8B5CFF] flex items-center justify-center mb-8 shadow-lg shadow-[#00F5FF]/20">
              <Radio className="w-5 h-5 text-black" />
            </div>
            <nav className="flex flex-col gap-5 w-full px-2">
              {navItems.map(({ id, label, icon: IconComponent }) => {
                const active = currentScreen === id;
                return (
                  <button key={id} onClick={() => setCurrentScreen(id as ScreenType)} className={`flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all ${active ? 'text-[#00F5FF] bg-[#00F5FF]/15 font-black uppercase tracking-widest' : 'text-[#61697C] hover:text-[#9CA3B7] hover:bg-white/5 font-black uppercase tracking-widest'}`}>
                    <IconComponent className="w-5 h-5" />
                    <span className="text-[9px] tracking-tight">{label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto">
              <button onClick={() => setCurrentScreen('settings')} className={`p-2 rounded-xl transition-colors ${currentScreen === 'settings' ? 'text-[#00F5FF] bg-[#00F5FF]/10' : 'text-[#61697C] hover:text-[#9CA3B7]'}`}>
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto flex flex-col relative pb-28">
          {currentScreen === 'onboarding' && (
            <div className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full justify-between">
              <div className="flex items-center gap-1.5 pt-2 pb-6">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <div key={step} className={`flex-1 h-1 rounded-full transition-colors ${step <= onboardingStep ? 'bg-[#00F5FF] shadow-[0_0_8px_#00F5FF]' : 'bg-[#171B28]'}`} />
                ))}
              </div>
              {onboardingStep === 1 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
                  <div className="relative mb-6"><div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#10131C] to-[#07090F] border border-[#00F5FF]/50 flex items-center justify-center shadow-2xl shadow-[#00F5FF]/30 backdrop-blur-xl"><Radio className="w-12 h-12 text-[#00F5FF]" /></div><div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF2ED1] text-black font-black rounded-full flex items-center justify-center text-[10px] shadow-md shadow-[#FF2ED1]/40">1.0</div></div>
                  <h1 className="text-3xl font-black uppercase text-[#F7F8FC] tracking-tight mb-3">Your Music. Your Universe.</h1>
                  <p className="text-[#9CA3B7] text-sm max-w-xs leading-relaxed mb-8">“Discover, organize and experience music in a whole new way.”</p>
                  <button onClick={() => setOnboardingStep(2)} className="w-full py-3.5 px-6 rounded-2xl bg-[#00F5FF] text-[#07090F] font-black uppercase tracking-wider text-xs shadow-lg shadow-[#00F5FF]/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"><span>Get Started</span><ChevronRight className="w-4 h-4" /></button>
                </div>
              )}
              {onboardingStep === 2 && (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-2xl font-black uppercase text-[#F7F8FC] mb-1">What moves you?</h2><p className="text-xs text-[#9CA3B7] mb-5">Select the genres that define your soundscape.</p>
                  <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-2 mb-6 max-h-[440px]">
                    {GENRE_OPTIONS.map((genre) => { const isSelected = selectedGenres.includes(genre); return <button key={genre} onClick={() => setSelectedGenres((prev) => prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre])} className={`p-3 rounded-xl border text-left text-xs font-bold uppercase transition-all backdrop-blur-md cursor-pointer ${isSelected ? 'border-[#00F5FF] bg-[#00F5FF]/15 text-[#00F5FF] shadow-sm shadow-[#00F5FF]/20' : 'border-[#171B28] bg-[#10131C]/80 text-[#9CA3B7] hover:border-[#00F5FF]/40 hover:text-[#F7F8FC]'}`}><div className="flex items-center justify-between"><span>{genre}</span>{isSelected && <Check className="w-3.5 h-3.5 text-[#00F5FF]" />}</div></button>; })}
                  </div>
                  <div className="flex gap-3 pt-2"><button onClick={() => setOnboardingStep(3)} className="flex-1 py-3 rounded-xl border border-[#171B28] bg-[#10131C]/60 text-[#9CA3B7] text-xs font-bold uppercase hover:text-white">Skip</button><button onClick={() => setOnboardingStep(3)} className="flex-[2] py-3 rounded-xl bg-[#00F5FF] text-[#07090F] text-xs font-black uppercase tracking-wider shadow-md shadow-[#00F5FF]/20 cursor-pointer">Continue ({selectedGenres.length})</button></div>
                </div>
              )}
              {onboardingStep === 3 && (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-2xl font-black uppercase text-[#F7F8FC] mb-1">Favorite Artists</h2><p className="text-xs text-[#9CA3B7] mb-5">Select sonic architects to calibrate recommendations.</p>
                  <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 mb-6 max-h-[440px]">{DEMO_ARTISTS.map((artist) => { const isSelected = selectedArtists.includes(artist.id); return <div key={artist.id} onClick={() => setSelectedArtists((prev) => prev.includes(artist.id) ? prev.filter((a) => a !== artist.id) : [...prev, artist.id])} className={`p-3 rounded-2xl border text-center flex flex-col items-center cursor-pointer transition-all backdrop-blur-md ${isSelected ? 'border-[#00F5FF] bg-[#00F5FF]/10 text-white shadow-lg shadow-[#00F5FF]/10' : 'border-[#171B28] bg-[#10131C]/80 text-[#9CA3B7] hover:border-[#00F5FF]/40'}`}><div className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-white/10 relative shadow-md shadow-black"><CyberArtwork keyName={artist.artworkKey} artworkUrl={artist.artworkUrl} />{isSelected && <div className="absolute inset-0 bg-[#00F5FF]/40 flex items-center justify-center"><Check className="w-6 h-6 text-black stroke-[3]" /></div>}</div><span className="text-xs font-bold text-[#F7F8FC]">{artist.name}</span><span className="text-[10px] text-[#9CA3B7] uppercase tracking-tight">{artist.genres.join(' • ')}</span></div>; })}</div>
                  <div className="flex gap-3 pt-2"><button onClick={() => setOnboardingStep(4)} className="flex-1 py-3 rounded-xl border border-[#171B28] bg-[#10131C]/60 text-[#9CA3B7] text-xs font-bold uppercase">Skip</button><button onClick={() => setOnboardingStep(4)} className="flex-[2] py-3 rounded-xl bg-[#00F5FF] text-[#07090F] text-xs font-black uppercase tracking-wider shadow-md shadow-[#00F5FF]/20 cursor-pointer">Continue ({selectedArtists.length})</button></div>
                </div>
              )}
              {onboardingStep === 4 && <div className="flex-1 flex flex-col justify-between py-4"><div><h2 className="text-2xl font-black uppercase text-[#F7F8FC] mb-2">Personalization</h2><p className="text-sm text-[#9CA3B7] leading-relaxed mb-8">“CyberPulse will use your listening activity to improve recommendations.”</p><div className="p-4 rounded-2xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-xl flex items-center justify-between"><div><div className="text-sm font-bold uppercase text-[#F7F8FC]">Personalized Recommendations</div><div className="text-xs text-[#9CA3B7] max-w-[240px]">Calibrate algorithmic radio, discover mixes, and dynamic queues.</div></div><button onClick={() => setPersonalizationEnabled(!personalizationEnabled)} className={`w-12 h-6 rounded-full p-1 transition-colors ${personalizationEnabled ? 'bg-[#00F5FF]' : 'bg-[#171B28]'}`}><div className={`w-4 h-4 rounded-full bg-[#07090F] transition-transform ${personalizationEnabled ? 'translate-x-6' : 'translate-x-0'}`} /></button></div></div><button onClick={() => setOnboardingStep(5)} className="w-full py-3.5 rounded-2xl bg-[#00F5FF] text-[#07090F] font-black uppercase tracking-wider text-xs shadow-md shadow-[#00F5FF]/20 cursor-pointer">Continue</button></div>}
              {onboardingStep === 5 && <div className="flex-1 flex flex-col items-center justify-between py-6 text-center"><div className="w-16 h-16 rounded-full bg-[#8B5CFF]/15 border border-[#8B5CFF] flex items-center justify-center my-6 shadow-lg shadow-[#8B5CFF]/20"><Bell className="w-8 h-8 text-[#8B5CFF]" /></div><div><h2 className="text-2xl font-black uppercase text-[#F7F8FC] mb-2">Stay in the Loop</h2><p className="text-sm text-[#9CA3B7] max-w-xs mx-auto">“Get updates about new music and playlists.”</p></div><div className="w-full flex flex-col gap-2.5"><button onClick={() => { onUpdatePreferences({ notificationsEnabled: true }); setOnboardingStep(6); }} className="w-full py-3.5 rounded-2xl bg-[#00F5FF] text-[#07090F] font-black uppercase tracking-wider text-xs shadow-md shadow-[#00F5FF]/20 cursor-pointer">Enable Notifications</button><button onClick={() => { onUpdatePreferences({ notificationsEnabled: false }); setOnboardingStep(6); }} className="w-full py-3 rounded-2xl border border-[#171B28] bg-[#10131C]/60 text-[#9CA3B7] font-bold uppercase text-xs hover:text-white">Not Now</button></div></div>}
              {onboardingStep === 6 && <div className="flex-1 flex flex-col items-center justify-center text-center my-auto"><div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00F5FF] to-[#8B5CFF] flex items-center justify-center mb-6 shadow-2xl shadow-[#00F5FF]/40"><Sparkles className="w-10 h-10 text-black" /></div><h2 className="text-3xl font-black uppercase text-[#F7F8FC] mb-2">You're ready.</h2><p className="text-sm text-[#9CA3B7] max-w-xs mb-8">Your CyberPulse engine is calibrated. Immerse into the frequency of sound.</p><button onClick={handleFinishOnboarding} className="w-full py-3.5 rounded-2xl bg-[#00F5FF] text-[#07090F] font-black uppercase tracking-wider text-xs shadow-lg shadow-[#00F5FF]/30 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"><span>Enter CyberPulse</span><Sparkles className="w-4 h-4" /></button></div>}
            </div>
          )}

          {currentScreen === 'home' && (
            <div className="p-4 space-y-6">
              <header className="flex items-center justify-between pb-3 border-b border-[#171B28]"><div className="flex flex-col"><span className="text-[#9CA3B7] text-xs font-bold tracking-widest uppercase">{greeting}</span><h1 className="text-2xl font-black tracking-tight text-[#00F5FF]">CYBER LISTENER</h1></div><div className="flex items-center gap-2 sm:gap-3">{onToggleMinimize && <button onClick={onToggleMinimize} className="p-2 rounded-full bg-[#10131C] border border-[#171B28] hover:border-[#00F5FF]/40 text-[#9CA3B7] hover:text-[#00F5FF] transition-colors cursor-pointer"><Home className="w-4 h-4" /></button>}<button onClick={() => setCurrentScreen('settings')} className="p-2 rounded-full bg-[#10131C] border border-[#171B28] hover:border-[#00F5FF]/40 text-[#9CA3B7] hover:text-[#F7F8FC] transition-colors cursor-pointer"><Settings className="w-4 h-4" /></button><button onClick={() => setCurrentScreen('profile')} className="w-10 h-10 rounded-full bg-[#171B28] border border-[#00F5FF]/30 flex items-center justify-center shadow-lg shadow-black cursor-pointer hover:border-[#00F5FF] transition-colors"><div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#00F5FF] to-[#8B5CFF] flex items-center justify-center text-[10px] font-black text-black">CL</div></button></div></header>
              <section className="w-full"><div className="relative h-56 w-full rounded-2xl overflow-hidden border border-[#171B28] bg-[#10131C] shadow-2xl shadow-black/60"><div className="absolute inset-0 bg-gradient-to-r from-[#10131C] via-[#10131C]/70 to-transparent z-10" /><div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center" /><div className="relative z-20 p-6 h-full flex flex-col justify-center"><span className="bg-[#FF2ED1] text-black text-[10px] font-black px-2 py-0.5 rounded-sm w-fit mb-2 uppercase tracking-tighter">Featured Mix</span><h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter leading-none mb-2 uppercase text-[#F7F8FC]">Electric Dreams</h2><p className="text-[#9CA3B7] text-xs sm:text-sm max-w-xs sm:max-w-md mb-4 line-clamp-2">The definitive cyberpunk soundscape for your digital journey. Updated every cycle.</p><div className="flex gap-3"><button onClick={() => { const trk = tracks.find((t) => t.title.toLowerCase().includes('electric')) || tracks[0]; if (trk) void handleSelectTrack(trk); }} className="bg-[#00F5FF] text-[#07090F] font-bold px-6 py-2 rounded-full text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#00F5FF]/20 cursor-pointer">Play Now</button><button onClick={() => setCurrentScreen('library')} className="bg-[#171B28] border border-[#61697C] text-[#F7F8FC] font-bold px-6 py-2 rounded-full text-xs uppercase tracking-wider hover:border-white transition-colors cursor-pointer">Library</button></div></div></div></section>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div onClick={() => setCurrentScreen('cyber_dj')} className="p-4 rounded-2xl bg-gradient-to-br from-[#1A102F] to-[#0E131F] border border-[#8B5CFF]/40 hover:border-[#8B5CFF] transition-all cursor-pointer group shadow-lg shadow-black/40 flex items-center justify-between"><div className="flex items-center gap-3.5"><div className="w-11 h-11 rounded-xl bg-[#8B5CFF]/20 text-[#8B5CFF] border border-[#8B5CFF]/50 flex items-center justify-center group-hover:scale-105 transition-transform"><Radio className="w-6 h-6" /></div><div><div className="flex items-center gap-2"><h4 className="text-sm font-bold text-white group-hover:text-[#00F5FF] transition-colors">Cyber DJ</h4><span className="text-[9px] bg-[#00F5FF]/15 text-[#00F5FF] border border-[#00F5FF]/40 px-1.5 py-0.2 rounded-full font-bold uppercase">Live Flow</span></div><p className="text-[11px] text-[#9CA3B7] mt-0.5">Continuous adaptive queue • Drive, Workout, Chill</p></div></div><ChevronRight className="w-4 h-4 text-[#9CA3B7] group-hover:text-[#00F5FF] transition-colors" /></div><div onClick={() => setCurrentScreen('ai_playlist')} className="p-4 rounded-2xl bg-gradient-to-br from-[#091C29] to-[#0E131F] border border-[#00F5FF]/40 hover:border-[#00F5FF] transition-all cursor-pointer group shadow-lg shadow-black/40 flex items-center justify-between"><div className="flex items-center gap-3.5"><div className="w-11 h-11 rounded-xl bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/50 flex items-center justify-center group-hover:scale-105 transition-transform"><Sparkles className="w-6 h-6" /></div><div><div className="flex items-center gap-2"><h4 className="text-sm font-bold text-white group-hover:text-[#00F5FF] transition-colors">AI Playlist Generator</h4><span className="text-[9px] bg-[#8B5CFF]/15 text-[#8B5CFF] border border-[#8B5CFF]/40 px-1.5 py-0.2 rounded-full font-bold uppercase">AI Studio</span></div><p className="text-[11px] text-[#9CA3B7] mt-0.5">Prompt to verified playable tracklists</p></div></div><ChevronRight className="w-4 h-4 text-[#9CA3B7] group-hover:text-[#00F5FF] transition-colors" /></div></div>

              {[
                { title: 'Recently Played', items: tracks.slice(0, 5), border: 'group-hover:border-[#00F5FF]/50' },
                { title: 'Trending Now', items: [...tracks].reverse().slice(0, 8), border: 'group-hover:border-[#FF2ED1]/60' },
                { title: 'New Releases', items: tracks.slice(3, 7), border: 'group-hover:border-[#B8FF2C]/60' },
              ].map((section) => (
                <div key={section.title}><div className="flex items-center justify-between mb-3"><h3 className="text-base sm:text-lg font-bold tracking-tight text-[#F7F8FC] uppercase">{section.title}</h3><span onClick={() => handleOpenSection({ title: section.title, subtitle: `More from ${section.title}`, type: 'tracks', items: section.items, badgeText: section.title })} className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline">See All</span></div><div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">{section.items.map((track) => <div key={`${section.title}-${track.id}`} onClick={() => void handleSelectTrack(track)} className="w-36 shrink-0 flex flex-col gap-2 group cursor-pointer"><div className={`aspect-square rounded-xl bg-[#171B28] border border-[#171B28] ${section.border} overflow-hidden relative shadow-lg shadow-black/40 transition-all`}><CyberArtwork keyName={track.placeholderArtworkKey} artworkUrl={track.artworkUrl} title={track.title} artist={track.artist} /><div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><div className="w-10 h-10 rounded-full border border-[#00F5FF] bg-black/50 flex items-center justify-center text-[#00F5FF]"><Play className="w-4 h-4 fill-current ml-0.5" /></div></div></div><div className="text-xs font-bold truncate text-[#F7F8FC]">{track.title}</div><div className="text-[10px] text-[#9CA3B7] uppercase tracking-tighter truncate">{track.artist}</div></div>)}</div></div>
              ))}

              <div><div className="flex items-center justify-between mb-3"><h3 className="text-base sm:text-lg font-bold tracking-tight text-[#F7F8FC] uppercase">Made For You</h3><span onClick={() => handleOpenSection({ title: 'Made For You', subtitle: 'Personalized cyber mixes and curated tracklists', type: 'playlists', items: DEMO_PLAYLISTS, badgeText: 'Curated Mixes' })} className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline">Explore</span></div><div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">{DEMO_PLAYLISTS.slice(0, 4).map((pl) => <div key={pl.id} onClick={() => { setSelectedPlaylistId(pl.id); setCurrentScreen('playlist_detail'); }} className="w-36 shrink-0 flex flex-col gap-2 group cursor-pointer"><div className="aspect-square rounded-xl bg-[#171B28] border border-[#171B28] group-hover:border-[#8B5CFF]/60 overflow-hidden relative shadow-lg shadow-black/40 transition-all"><CyberArtwork keyName={pl.artworkKey} artworkUrl={pl.artworkUrl} title={pl.title} /><div className="absolute bottom-2 left-2 bg-[#10131C]/80 backdrop-blur-md px-2 py-0.5 rounded border border-[#171B28] text-[9px] font-bold text-[#F7F8FC] uppercase tracking-wider">{pl.trackCount} tracks</div></div><div className="text-xs font-bold truncate text-[#F7F8FC]">{pl.title}</div><div className="text-[10px] text-[#9CA3B7] line-clamp-1">{pl.description}</div></div>)}</div></div>
              <div><div className="flex items-center justify-between mb-3"><h3 className="text-base sm:text-lg font-bold tracking-tight text-[#F7F8FC] uppercase">Your Mixes</h3><span onClick={() => handleOpenSection({ title: 'Your Mixes', subtitle: 'Continuous flow algorithmic mixes curated for cyber pulses', type: 'playlists', items: DEMO_PLAYLISTS, badgeText: 'Audio Mixes' })} className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline">See All</span></div><div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">{DEMO_PLAYLISTS.map((pl) => <div key={`mix-${pl.id}`} onClick={() => { setSelectedPlaylistId(pl.id); setCurrentScreen('playlist_detail'); }} className="w-36 shrink-0 flex flex-col gap-2 group cursor-pointer"><div className="aspect-square rounded-xl bg-[#171B28] border border-[#171B28] group-hover:border-[#00F5FF]/50 overflow-hidden relative shadow-lg shadow-black/40 transition-all"><CyberArtwork keyName={pl.artworkKey} artworkUrl={pl.artworkUrl} title={pl.title} /></div><div className="text-xs font-bold truncate text-[#F7F8FC]">{pl.title}</div><div className="text-[10px] text-[#9CA3B7] uppercase tracking-tighter truncate">Curated Mix</div></div>)}</div></div>
              <div><div className="flex items-center justify-between mb-3"><h3 className="text-base sm:text-lg font-bold tracking-tight text-[#F7F8FC] uppercase">Popular Artists</h3><span onClick={() => handleOpenSection({ title: 'Popular Artists', subtitle: 'Leading visionaries and neon producers shaping electronic sound', type: 'artists', items: DEMO_ARTISTS, badgeText: 'All Artists' })} className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline">See All</span></div><div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">{DEMO_ARTISTS.map((artist) => <div key={artist.id} onClick={() => { setSelectedArtistId(artist.id); setCurrentScreen('artist_detail'); }} className="w-24 shrink-0 flex flex-col items-center text-center cursor-pointer group"><div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#171B28] group-hover:border-[#00F5FF] transition-all mb-1.5 shadow-lg shadow-black"><CyberArtwork keyName={artist.artworkKey} artworkUrl={artist.artworkUrl} title={artist.name} /></div><span className="text-xs font-bold text-[#F7F8FC] truncate w-full">{artist.name}</span><span className="text-[10px] text-[#9CA3B7] uppercase tracking-tighter">{(artist.followersCount / 1000).toFixed(0)}k pulses</span></div>)}</div></div>
            </div>
          )}

          {currentScreen === 'search' && (
            <div className="p-4 space-y-5">
              <div className="flex items-center justify-between"><h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC]">Search</h1><button onClick={() => setIsOfflineMode(!isOfflineMode)} className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${isOfflineMode ? 'bg-[#00F5FF]/15 border-[#00F5FF] text-[#00F5FF]' : 'bg-[#10131C] border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC]'}`}>{isOfflineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}<span>{isOfflineMode ? 'Offline Mode' : 'Online API'}</span></button></div>
              {isOfflineMode && <div className="p-3 rounded-xl bg-[#10131C] border border-[#00F5FF]/40 flex items-center gap-2 text-xs text-[#00F5FF]"><CloudOff className="w-4 h-4 shrink-0" /><span className="flex-1">Offline Music Library Active • Playing cached audio</span><button onClick={() => setIsOfflineMode(false)} className="underline hover:text-white font-bold">Go Online</button></div>}
              <div className="relative"><Search className="w-4 h-4 text-[#61697C] absolute left-3.5 top-1/2 -translate-y-1/2" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Songs, artists, albums, playlists..." className="w-full py-3 pl-10 pr-9 bg-[#10131C]/90 backdrop-blur-md border border-[#171B28] focus:border-[#00F5FF] rounded-2xl text-xs text-[#F7F8FC] placeholder-[#61697C] outline-none transition-colors" />{searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3B7] hover:text-white"><X className="w-4 h-4" /></button>}</div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{(['ALL', 'SPOTIFY', 'YOUTUBE', 'SONGS', 'ARTISTS', 'ALBUMS', 'PLAYLISTS'] as SearchFilter[]).map((filter) => { const isYt = filter === 'YOUTUBE'; const isSp = filter === 'SPOTIFY'; const active = searchFilter === filter; return <button key={filter} onClick={() => setSearchFilter(filter)} className={`py-1 px-3.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 ${active ? isSp ? 'bg-[#1DB954] text-black font-black shadow-md shadow-[#1DB954]/40' : isYt ? 'bg-[#FF0000] text-white shadow-md shadow-[#FF0000]/30' : 'bg-[#00F5FF] text-[#07090F]' : isSp ? 'bg-[#0A1A0F] border border-[#1DB954]/40 text-[#1DB954] hover:text-white' : isYt ? 'bg-[#1A0D10] border border-[#FF0000]/40 text-red-400 hover:text-white' : 'bg-[#10131C] border border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC]'}`}>{isSp && <Music className="w-3.5 h-3.5 fill-current" />}{isYt && <Youtube className="w-3.5 h-3.5 fill-current" />}<span>{filter}</span></button>; })}</div>

              {searchQuery.trim() ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#9CA3B7] font-bold uppercase tracking-wider"><span>Query: "{searchQuery}" • Filter: {searchFilter}</span><div className="flex items-center gap-2">{isSearchingSpotify && <span className="flex items-center gap-1 text-[#1DB954] text-[10px] font-mono"><Loader2 className="w-3 h-3 animate-spin" /> Spotify...</span>}{isSearchingYoutube && <span className="flex items-center gap-1 text-red-400 text-[10px] font-mono"><Loader2 className="w-3 h-3 animate-spin" /> YouTube...</span>}</div></div>
                  {(searchFilter === 'ALL' || searchFilter === 'SPOTIFY') && <div className="space-y-2"><div className="flex items-center justify-between"><div className="text-[11px] font-mono uppercase tracking-widest text-[#1DB954] font-bold flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-[#1DB954]" /><span>Spotify Tracks ({spotifyResults.length})</span></div><span className="text-[9px] bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/30 px-2 py-0.5 rounded-full font-mono">LIVE PROXY</span></div>{spotifySearchError && <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><span className="font-mono text-[11px]">{spotifySearchError}</span></div>}{isSearchingSpotify && spotifyResults.length === 0 ? <div className="p-4 rounded-xl bg-[#0A130E] border border-[#1DB954]/30 flex items-center justify-center gap-2.5 text-xs text-green-300 font-mono"><Loader2 className="w-4 h-4 animate-spin text-[#1DB954]" /><span>Searching Spotify catalog...</span></div> : spotifyResults.length > 0 ? <div className="space-y-2">{spotifyResults.map((spTrack) => <div key={spTrack.id} onClick={() => void handleSelectTrack(spTrack)} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#10131C]/90 backdrop-blur-md border border-[#1DB954]/25 hover:border-[#1DB954]/70 cursor-pointer transition-all group"><div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#1DB954]/30 relative bg-black"><CyberArtwork artworkUrl={spTrack.artworkUrl} title={spTrack.title} artist={spTrack.artist} /></div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-[#F7F8FC] truncate group-hover:text-[#1DB954] transition-colors">{spTrack.title}</div><div className="text-[11px] text-[#9CA3B7] truncate">{spTrack.artist} • {spTrack.album}</div></div><button onClick={(e) => { e.stopPropagation(); void handlePlayViaYouTube(spTrack); }} className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5 fill-current" /><span>YouTube</span></button></div>)}</div> : null}</div>}
                  {(searchFilter === 'ALL' || searchFilter === 'YOUTUBE') && <div className="space-y-2"><div className="flex items-center justify-between"><div className="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5 fill-red-500 text-red-500" /><span>YouTube Music & Videos ({youtubeResults.length})</span></div><span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-mono">VERIFIED</span></div>{isSearchingYoutube && youtubeResults.length === 0 ? <div className="p-4 rounded-xl bg-[#10131C] border border-red-500/30 flex items-center justify-center gap-2.5 text-xs text-red-300 font-mono"><Loader2 className="w-4 h-4 animate-spin text-red-500" /><span>Searching YouTube...</span></div> : youtubeResults.length > 0 ? <div className="space-y-2">{youtubeResults.map((ytTrack) => <div key={ytTrack.id} onClick={() => void handleSelectTrack(ytTrack)} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#10131C]/90 backdrop-blur-md border border-red-500/20 hover:border-red-500/60 cursor-pointer transition-all group"><div className="w-14 h-11 rounded-lg overflow-hidden shrink-0 border border-red-500/30 relative bg-black"><CyberArtwork artworkUrl={ytTrack.artworkUrl} title={ytTrack.title} artist={ytTrack.artist} /></div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-[#F7F8FC] truncate group-hover:text-red-400 transition-colors">{ytTrack.title}</div><div className="text-[11px] text-[#9CA3B7] truncate">{ytTrack.artist}</div></div><div className="w-8 h-8 rounded-full bg-[#00F5FF]/20 border border-[#00F5FF]/40 flex items-center justify-center text-[#00F5FF]"><Play className="w-3.5 h-3.5 fill-current ml-0.5" /></div></div>)}</div> : null}</div>}
                  {(searchFilter === 'ALL' || searchFilter === 'SONGS') && filteredTracks.length > 0 && <div className="space-y-2"><div className="text-[11px] font-mono uppercase tracking-widest text-[#00F5FF] font-bold">Songs ({filteredTracks.length})</div>{filteredTracks.map((trk) => <div key={trk.id} onClick={() => void handleSelectTrack(trk)} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#10131C]/80 backdrop-blur-md border border-[#171B28] hover:border-[#00F5FF]/50 cursor-pointer transition-colors"><div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/5"><CyberArtwork keyName={trk.placeholderArtworkKey} artworkUrl={trk.artworkUrl} title={trk.title} artist={trk.artist} /></div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-[#F7F8FC] truncate">{trk.title}</div><div className="text-[11px] text-[#9CA3B7] truncate">{trk.artist} • {trk.album}</div></div><div className="w-8 h-8 rounded-full bg-[#00F5FF]/15 border border-[#00F5FF]/30 flex items-center justify-center text-[#00F5FF]"><Play className="w-3.5 h-3.5 fill-current ml-0.5" /></div></div>)}</div>}
                  {(searchFilter === 'ALL' || searchFilter === 'ARTISTS') && filteredArtists.length > 0 && <div className="space-y-2"><div className="text-[11px] font-mono uppercase tracking-widest text-[#8B5CFF] font-bold">Artists ({filteredArtists.length})</div><div className="grid grid-cols-2 gap-2">{filteredArtists.map((artist) => <div key={artist.id} onClick={() => { setSelectedArtistId(artist.id); setCurrentScreen('artist_detail'); }} className="p-3 rounded-xl bg-[#10131C]/80 border border-[#171B28] hover:border-[#8B5CFF]/50 flex items-center gap-2.5 cursor-pointer transition-colors"><div className="w-10 h-10 rounded-full overflow-hidden border border-[#8B5CFF]/30 shrink-0"><CyberArtwork keyName={artist.artworkKey} artworkUrl={artist.artworkUrl} title={artist.name} /></div><div className="min-w-0"><div className="text-xs font-bold text-[#F7F8FC] truncate">{artist.name}</div><div className="text-[10px] text-[#9CA3B7] truncate">{(artist.followersCount / 1000).toFixed(0)}k pulses</div></div></div>)}</div></div>}
                  {(searchFilter === 'ALL' || searchFilter === 'ALBUMS') && filteredAlbums.length > 0 && <div className="space-y-2"><div className="text-[11px] font-mono uppercase tracking-widest text-[#00F5FF] font-bold">Albums ({filteredAlbums.length})</div><div className="grid grid-cols-2 gap-2">{filteredAlbums.map((album) => <div key={album.id} onClick={() => { setSelectedAlbumId(album.id); setCurrentScreen('album_detail'); }} className="p-2.5 rounded-xl bg-[#10131C]/80 border border-[#171B28] hover:border-[#00F5FF]/50 cursor-pointer transition-colors"><div className="aspect-square rounded-lg overflow-hidden border border-white/5 mb-2"><CyberArtwork keyName={album.artworkKey} artworkUrl={album.artworkUrl} title={album.title} /></div><div className="text-xs font-bold text-[#F7F8FC] truncate">{album.title}</div><div className="text-[10px] text-[#9CA3B7] truncate">{album.artist}</div></div>)}</div></div>}
                  {(searchFilter === 'ALL' || searchFilter === 'PLAYLISTS') && filteredPlaylists.length > 0 && <div className="space-y-2"><div className="text-[11px] font-mono uppercase tracking-widest text-[#FF2ED1] font-bold">Playlists ({filteredPlaylists.length})</div><div className="space-y-2">{filteredPlaylists.map((pl) => <div key={pl.id} onClick={() => { setSelectedPlaylistId(pl.id); setCurrentScreen('playlist_detail'); }} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#10131C]/80 border border-[#171B28] hover:border-[#FF2ED1]/50 cursor-pointer transition-colors"><div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/5"><CyberArtwork keyName={pl.artworkKey} artworkUrl={pl.artworkUrl} title={pl.title} /></div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-[#F7F8FC] truncate">{pl.title}</div><div className="text-[10px] text-[#9CA3B7] truncate">{pl.description}</div></div></div>)}</div></div>}
                </div>
              ) : (
                <div className="space-y-5"><div><div className="text-xs font-bold text-[#9CA3B7] uppercase tracking-wider mb-2.5">Recent Searches</div><div className="flex flex-wrap gap-2">{recentSearches.map((term) => <button key={term} onClick={() => setSearchQuery(term)} className="py-1.5 px-3 rounded-full bg-[#10131C] border border-[#171B28] hover:border-[#00F5FF] text-xs font-semibold text-[#9CA3B7] hover:text-[#F7F8FC]">{term}</button>)}</div></div><div><div className="text-xs font-bold text-[#9CA3B7] uppercase tracking-wider mb-3">Browse Categories</div><div className="grid grid-cols-2 gap-2.5">{BROWSE_CATEGORIES.map((cat) => <div key={cat.name} onClick={() => setSearchQuery(cat.name)} className="h-20 rounded-xl p-3 border flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] backdrop-blur-md" style={{ backgroundColor: `${cat.color}15`, borderColor: `${cat.color}35` }}><span className="text-xs font-black uppercase text-[#F7F8FC]">{cat.name}</span><span className="text-[10px] font-mono font-bold tracking-wider opacity-90" style={{ color: cat.color }}>DISCOVER //</span></div>)}</div></div></div>
              )}
            </div>
          )}

          {currentScreen === 'explore' && <div className="p-4 space-y-6"><div><h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC]">Explore</h1><p className="text-xs text-[#9CA3B7]">Atmospheric categories and soundscapes</p></div><div><div className="flex items-center justify-between mb-3"><h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7]">Mood & Vibe</h2><span onClick={() => handleOpenSection({ title: 'All Soundscapes & Moods', subtitle: 'Atmospheric audio environments engineered for high cognitive focus', type: 'tracks', items: tracks, badgeText: 'Soundscapes' })} className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline">See All</span></div><div className="grid grid-cols-2 gap-3">{EXPLORE_MOODS.map((mood) => <div key={mood.title} onClick={() => handleOpenSection({ title: mood.title, subtitle: mood.desc, type: 'tracks', items: tracks.slice(0, 8), badgeText: 'Mood Station', gradient: mood.gradient })} className={`h-24 rounded-2xl p-3 bg-gradient-to-br ${mood.gradient} border border-white/10 flex flex-col justify-between cursor-pointer shadow-lg hover:border-white/30 transition-all backdrop-blur-md hover:scale-[1.02]`}><span className="text-xs font-black uppercase text-[#F7F8FC]">{mood.title}</span><span className="text-[10px] text-white/80 line-clamp-1">{mood.desc}</span></div>)}</div></div><div><h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-3">Genres</h2><div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{['Synthwave','Cyberpunk','Darksynth','Industrial','EBM','Midtempo','Ambient'].map((genre) => <button key={genre} onClick={() => { setSearchQuery(genre); setCurrentScreen('search'); }} className="py-1.5 px-3.5 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF] shrink-0 transition-colors cursor-pointer">{genre}</button>)}</div></div></div>}

          {currentScreen === 'library' && <div className="p-4 space-y-5"><div className="flex items-center justify-between"><h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC]">Your Library</h1><button onClick={() => setCurrentScreen('ai_playlist')} className="p-2 rounded-full bg-[#00F5FF]/15 border border-[#00F5FF]/30 text-[#00F5FF]"><Plus className="w-5 h-5" /></button></div><div className="p-4 rounded-2xl bg-gradient-to-r from-[#FF2ED1]/20 via-[#8B5CFF]/15 to-transparent border border-[#FF2ED1]/40 backdrop-blur-xl flex items-center justify-between cursor-pointer" onClick={() => setCurrentScreen('liked_songs')}><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF2ED1] to-[#8B5CFF] flex items-center justify-center text-white"><Heart className="w-6 h-6 fill-white" /></div><div><div className="text-sm font-black uppercase text-[#F7F8FC]">Liked Songs</div><div className="text-xs text-[#9CA3B7]">{tracks.filter((t) => t.isLiked).length} tracks in collection</div></div></div><ChevronRight className="w-5 h-5 text-[#9CA3B7]" /></div><div className="space-y-2">{DEMO_PLAYLISTS.map((pl) => <div key={pl.id} onClick={() => { setSelectedPlaylistId(pl.id); setCurrentScreen('playlist_detail'); }} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#10131C]/80 border border-transparent hover:border-[#171B28] cursor-pointer"><div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#171B28]"><CyberArtwork keyName={pl.artworkKey} artworkUrl={pl.artworkUrl} title={pl.title} /></div><div><div className="text-xs font-bold text-[#F7F8FC] truncate">{pl.title}</div><div className="text-[11px] text-[#9CA3B7]">Playlist • {pl.trackCount} songs</div></div></div>)}</div></div>}

          {currentScreen === 'profile' && <div className="p-4 space-y-5"><h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC]">Profile</h1><div className="p-4 rounded-2xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-xl shadow-2xl shadow-black space-y-4"><div className="flex items-center gap-3.5"><div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00F5FF] via-[#8B5CFF] to-[#FF2ED1] p-[2px]"><div className="w-full h-full rounded-full bg-[#07090F] flex items-center justify-center font-black text-[#00F5FF] text-lg">CL</div></div><div><div className="text-base font-black uppercase text-[#F7F8FC]">{DEFAULT_PROFILE.username}</div><div className="text-xs text-[#9CA3B7]">{DEFAULT_PROFILE.handle} • <span className="text-[#00F5FF] font-bold">Free Plan</span></div></div></div></div><div className="space-y-1">{['Account & Subscription','Listening Stats & Liked Collection','Appearance & Themes','Audio Engine & DSP Preferences','Notifications & Cache','All Settings'].map((label) => <div key={label} onClick={() => label.includes('Liked') ? setCurrentScreen('liked_songs') : setCurrentScreen('settings')} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#10131C]/80 border border-transparent hover:border-[#171B28] cursor-pointer text-xs font-bold text-[#F7F8FC]"><span>{label}</span><ChevronRight className="w-4 h-4 text-[#61697C]" /></div>)}</div></div>}
          {currentScreen === 'settings' && <SettingsView preferences={preferences} onUpdatePreferences={onUpdatePreferences} onBack={() => setCurrentScreen('profile')} />}
          {currentScreen === 'liked_songs' && <LikedSongsView tracks={tracks} onSelectTrack={handleSelectTrack} onToggleLike={handleToggleLike} onBack={() => setCurrentScreen('library')} />}
          {currentScreen === 'artist_detail' && (() => { const artist = DEMO_ARTISTS.find((a) => a.id === selectedArtistId) || DEMO_ARTISTS[0]; return <ArtistDetailView artist={artist} tracks={tracks} albums={DEMO_ALBUMS} onBack={() => setCurrentScreen('home')} onSelectTrack={handleSelectTrack} onSelectAlbum={(albumId) => { setSelectedAlbumId(albumId); setCurrentScreen('album_detail'); }} />; })()}
          {currentScreen === 'album_detail' && (() => { const album = DEMO_ALBUMS.find((a) => a.id === selectedAlbumId) || DEMO_ALBUMS[0]; return <AlbumDetailView album={album} onBack={() => setCurrentScreen('home')} onSelectTrack={handleSelectTrack} onSelectArtist={(artistId) => { setSelectedArtistId(artistId); setCurrentScreen('artist_detail'); }} />; })()}
          {currentScreen === 'playlist_detail' && (() => { const playlist = DEMO_PLAYLISTS.find((p) => p.id === selectedPlaylistId) || DEMO_PLAYLISTS[0]; return <PlaylistDetailView playlist={playlist} onBack={() => setCurrentScreen('home')} onSelectTrack={handleSelectTrack} />; })()}
          {currentScreen === 'cyber_dj' && <CyberDjView onBack={() => setCurrentScreen('home')} onPlayTrack={handleSelectTrack} currentTrack={currentTrack} isPlaying={isPlaying} />}
          {currentScreen === 'ai_playlist' && <AiPlaylistView onBack={() => setCurrentScreen('home')} onPlayTrack={handleSelectTrack} />}
          {currentScreen === 'section_detail' && sectionDetailConfig && <SectionDetailView config={sectionDetailConfig} onBack={() => setCurrentScreen(previousScreen || 'home')} onSelectTrack={handleSelectTrack} onSelectPlaylist={(playlistId) => { setSelectedPlaylistId(playlistId); setCurrentScreen('playlist_detail'); }} onSelectArtist={(artistId) => { setSelectedArtistId(artistId); setCurrentScreen('artist_detail'); }} onSelectAlbum={(albumId) => { setSelectedAlbumId(albumId); setCurrentScreen('album_detail'); }} onToggleLike={handleToggleLike} onPlayViaYouTube={handlePlayViaYouTube} currentTrackId={currentTrack?.id} />}
        </main>

        {currentScreen !== 'onboarding' && (
          <div onClick={() => setIsNowPlayingOpen(true)} className={`absolute bottom-20 left-3 right-3 sm:left-4 sm:right-4 h-16 bg-[#10131C]/90 backdrop-blur-xl border rounded-2xl flex items-center px-3 sm:px-4 z-30 shadow-2xl shadow-black cursor-pointer transition-all ${currentTrack.source === 'SPOTIFY' ? 'border-[#1DB954]/40 hover:border-[#1DB954]/80' : currentTrack.source === 'YOUTUBE' ? 'border-red-500/40 hover:border-red-500/80' : 'border-[#00F5FF]/20 hover:border-[#00F5FF]/50'}`}>
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#00F5FF]/20 mr-3 shadow-md shadow-black relative bg-black"><CyberArtwork keyName={currentTrack.placeholderArtworkKey} artworkUrl={currentTrack.artworkUrl} title={currentTrack.title} artist={currentTrack.artist} /></div>
            <div className="flex-1 min-w-0 pr-2"><div className="text-xs font-black uppercase text-[#F7F8FC] truncate">{currentTrack.title}</div><div className="text-[10px] uppercase text-[#00F5FF] font-bold truncate">{currentTrack.artist}</div></div>
            {effectiveYtId && <button onClick={(e) => { e.stopPropagation(); void handlePlayViaYouTube(currentTrack); }} className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white transition-all mr-1"><Youtube className="w-3.5 h-3.5 fill-current" /></button>}
            <div className="flex items-center gap-2 sm:gap-3 px-1"><button onClick={(e) => { e.stopPropagation(); handlePrevTrack(); }} className="text-[#9CA3B7] hover:text-[#F7F8FC] transition-colors p-1"><SkipBack className="w-4 h-4 fill-current" /></button><button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="w-9 h-9 rounded-full flex items-center justify-center font-bold bg-[#00F5FF] text-[#07090F] shadow-md shadow-[#00F5FF]/20">{isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}</button><button onClick={(e) => { e.stopPropagation(); handleNextTrack(); }} className="text-[#9CA3B7] hover:text-[#F7F8FC] transition-colors p-1"><SkipForward className="w-4 h-4 fill-current" /></button></div>
            <div className="w-16 sm:w-28 h-1 bg-[#171B28] rounded-full overflow-hidden shrink-0 hidden xs:block"><div className="h-full bg-[#00F5FF] shadow-[0_0_10px_#00F5FF] transition-all" style={{ width: `${Math.min(100, (seekSeconds / (currentTrack.durationSeconds || 214)) * 100)}%` }} /></div>
          </div>
        )}

        {!isTabletView && currentScreen !== 'onboarding' && <nav className="absolute bottom-0 left-0 right-0 h-20 bg-[#10131C]/95 backdrop-blur-xl border-t border-[#171B28] flex items-center justify-around px-4 sm:px-8 z-20">{navItems.map(({ id, label, icon: IconComponent }) => { const active = currentScreen === id; return <button key={id} onClick={() => setCurrentScreen(id as ScreenType)} className={`flex flex-col items-center gap-1 transition-colors py-1 px-2 ${active ? 'text-[#00F5FF]' : 'text-[#61697C] hover:text-[#9CA3B7]'}`}><IconComponent className="w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-widest">{label}</span></button>; })}</nav>}
      </div>

      {isNowPlayingOpen && (
        <div className="absolute inset-0 z-40 bg-[#07090F]/98 backdrop-blur-2xl flex flex-col px-5 pt-8 sm:pt-10 pb-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-8 duration-200">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-[#8B5CFF]/25 via-[#00F5FF]/15 to-transparent rounded-full blur-[100px] pointer-events-none" />
          <div className="flex items-center justify-between mb-3 relative z-10 px-1"><button onClick={() => setIsNowPlayingOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 text-[#9CA3B7] hover:text-white"><ChevronDown className="w-5 h-5" /></button><div className="text-center px-2 min-w-0 max-w-[200px] sm:max-w-xs"><div className="text-[9px] font-mono tracking-widest text-[#00F5FF] uppercase font-bold truncate">Playing from playlist</div><div className="text-xs font-black uppercase text-[#F7F8FC] truncate">{currentTrack.album}</div></div>{onToggleMinimize ? <button onClick={() => { setIsNowPlayingOpen(false); onToggleMinimize(); }} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 text-[#9CA3B7] hover:text-[#00F5FF]"><Home className="w-4 h-4" /></button> : <div className="w-8" />}</div>
          <div className="flex flex-col items-center justify-center gap-2 my-1 relative z-10"><div className="inline-flex p-1 rounded-full bg-[#10131C] border border-[#171B28] shadow-inner"><button onClick={() => setPlaybackMediaMode('audio')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${playbackMediaMode === 'audio' ? 'bg-[#00F5FF] text-[#07090F] shadow-md shadow-[#00F5FF]/30 font-black' : 'text-[#9CA3B7] hover:text-white'}`}><Volume2 className="w-3.5 h-3.5" /><span>Audio Only</span></button><button onClick={() => effectiveYtId ? setPlaybackMediaMode('video') : setComingSoonTitle('Music video unavailable')} disabled={!effectiveYtId} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${playbackMediaMode === 'video' && effectiveYtId ? 'bg-[#00F5FF] text-[#07090F] shadow-md shadow-[#00F5FF]/30 font-black' : 'text-[#9CA3B7]'} ${!effectiveYtId ? 'opacity-40 cursor-not-allowed' : 'hover:text-white cursor-pointer'}`}><Video className="w-3.5 h-3.5" /><span>Music Video</span></button></div>{playbackMediaMode === 'audio' && <div className="inline-flex p-0.5 rounded-full bg-[#10131C]/60 border border-[#171B28]"><button onClick={() => setAudioVisualMode('artwork')} className={`px-3 py-0.5 rounded-full text-[11px] font-bold ${audioVisualMode === 'artwork' ? 'bg-[#00F5FF]/20 text-[#00F5FF]' : 'text-[#9CA3B7]'}`}>Cover</button><button onClick={() => setAudioVisualMode('visualizer')} className={`px-3 py-0.5 rounded-full text-[11px] font-bold ${audioVisualMode === 'visualizer' ? 'bg-[#00F5FF]/20 text-[#00F5FF]' : 'text-[#9CA3B7]'}`}>Visualizer</button><button onClick={() => setAudioVisualMode('lyrics')} className={`px-3 py-0.5 rounded-full text-[11px] font-bold ${audioVisualMode === 'lyrics' ? 'bg-[#00F5FF]/20 text-[#00F5FF]' : 'text-[#9CA3B7]'}`}>Lyrics</button></div>}</div>
          <div className="my-2 relative z-10 flex flex-col items-center justify-center w-full">
            <div className={`w-full max-w-[320px] sm:max-w-[360px] aspect-video mx-auto rounded-2xl overflow-hidden border-2 border-[#00F5FF]/40 shadow-[0_0_35px_rgba(0,245,255,0.2)] bg-black transition-all ${playbackMediaMode === 'video' ? 'relative block mb-2' : 'absolute -top-[9999px] left-0 w-1 h-1 opacity-0 pointer-events-none'}`}>
              {effectiveYtId ? <iframe ref={ytIframeRef} src={`https://www.youtube-nocookie.com/embed/${effectiveYtId}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&autoplay=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`} title={currentTrack.title} className="w-full h-full border-0 pointer-events-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen onLoad={() => { if (isPlaying) sendYTCommand('playVideo'); }} /> : <div className="w-full h-full flex items-center justify-center text-xs text-[#9CA3B7]">No playable video</div>}
            </div>
            {playbackMediaMode === 'audio' && audioVisualMode === 'artwork' && <div className="flex flex-col items-center w-full"><div className="w-full max-w-[260px] sm:max-w-[280px] aspect-square mx-auto rounded-3xl overflow-hidden border-2 border-[#00F5FF]/40 shadow-[0_0_35px_rgba(0,245,255,0.2)] relative group"><CyberArtwork keyName={currentTrack.placeholderArtworkKey} artworkUrl={currentTrack.artworkUrl} title={currentTrack.title} artist={currentTrack.artist} /></div></div>}
            {playbackMediaMode === 'audio' && audioVisualMode === 'visualizer' && <VisualizerPreview mode={visualizerMode} isPlaying={isPlaying} isYouTube={isYouTubeActive} isProUser={DEFAULT_PROFILE.subscriptionTier === 'PRO'} currentSeconds={seekSeconds} onSelectMode={(m) => setVisualizerMode(m)} onUnlockPro={() => { setIsNowPlayingOpen(false); setCurrentScreen('profile'); }} />}
            {playbackMediaMode === 'audio' && audioVisualMode === 'lyrics' && <LyricsPreview track={currentTrack} currentSeconds={seekSeconds} isPlaying={isPlaying} onSeek={(s) => handleSeek(s)} onTogglePlayPause={togglePlayPause} />}
          </div>
          <div className="flex items-center justify-between mt-3 mb-2 relative z-10 px-1"><div className="min-w-0 pr-3"><div className="text-lg sm:text-xl font-black uppercase text-[#F7F8FC] truncate">{currentTrack.title}</div><div className="text-xs font-bold uppercase text-[#00F5FF] tracking-wider truncate">{currentTrack.artist}</div></div><button onClick={() => handleToggleLike(currentTrack.id)} className="p-1.5 text-[#9CA3B7] hover:text-[#FF2ED1]"><Heart className={`w-6 h-6 sm:w-7 sm:h-7 ${currentTrack.isLiked ? 'fill-[#FF2ED1] text-[#FF2ED1]' : 'text-[#9CA3B7]'}`} /></button></div>
          <div className="space-y-1.5 my-2 relative z-10 px-1"><input type="range" min={0} max={currentTrack.durationSeconds || 214} value={seekSeconds} onChange={(e) => handleSeek(Number(e.target.value))} className="w-full h-1.5 bg-[#171B28] rounded-lg appearance-none cursor-pointer accent-[#00F5FF]" /><div className="flex justify-between text-[11px] font-mono text-[#9CA3B7]"><span>{`${Math.floor(seekSeconds / 60)}:${String(seekSeconds % 60).padStart(2, '0')}`}</span><span>{`${Math.floor((currentTrack.durationSeconds || 214) / 60)}:${String((currentTrack.durationSeconds || 214) % 60).padStart(2, '0')}`}</span></div></div>
          <div className="flex items-center justify-between py-3 max-w-xs mx-auto w-full relative z-10"><button onClick={() => setIsShuffle(!isShuffle)} className={`p-1.5 ${isShuffle ? 'text-[#00F5FF]' : 'text-[#61697C]'}`}><Shuffle className="w-4 h-4 sm:w-5 sm:h-5" /></button><button onClick={handlePrevTrack} className="p-1.5 text-[#F7F8FC]"><SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-current" /></button><button onClick={togglePlayPause} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold bg-[#00F5FF] text-[#07090F] shadow-lg shadow-[#00F5FF]/30">{isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-[#07090F]" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-[#07090F] ml-0.5" />}</button><button onClick={handleNextTrack} className="p-1.5 text-[#F7F8FC]"><SkipForward className="w-6 h-6 sm:w-7 sm:h-7 fill-current" /></button><button onClick={() => setIsRepeat(!isRepeat)} className={`p-1.5 ${isRepeat ? 'text-[#00F5FF]' : 'text-[#61697C]'}`}><Repeat className="w-4 h-4 sm:w-5 sm:h-5" /></button></div>
          <div className="flex items-center justify-between pt-4 border-t border-[#171B28] mt-auto relative z-10"><button onClick={() => setShowLyricsModal(true)} className="flex items-center gap-1.5 py-2 px-4 rounded-full border border-[#171B28] bg-[#10131C]/90 text-xs font-bold uppercase tracking-wider text-[#9CA3B7]"><FileText className="w-3.5 h-3.5 text-[#00F5FF]" /><span>Full Lyrics</span></button><button onClick={() => setShowQueueModal(true)} className="flex items-center gap-1.5 py-2 px-4 rounded-full border border-[#171B28] bg-[#10131C]/90 text-xs font-bold uppercase tracking-wider text-[#9CA3B7]"><ListMusic className="w-3.5 h-3.5 text-[#00F5FF]" /><span>Queue ({tracks.length})</span></button></div>
        </div>
      )}

      {showLyricsModal && <LyricsPreview track={currentTrack} currentSeconds={seekSeconds} isPlaying={isPlaying} onSeek={(s) => handleSeek(s)} onTogglePlayPause={togglePlayPause} onClose={() => setShowLyricsModal(false)} isModal={true} />}
      {showQueueModal && <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"><div className="w-full max-w-sm max-h-[480px] rounded-3xl bg-[#10131C]/95 border border-[#171B28] p-5 flex flex-col"><div className="flex items-center justify-between mb-3"><h3 className="text-base font-black uppercase tracking-wide text-[#F7F8FC]">Now Playing Queue</h3><button onClick={() => setShowQueueModal(false)} className="text-[#9CA3B7] hover:text-white"><X className="w-5 h-5" /></button></div><div className="flex-1 overflow-y-auto space-y-2 pr-1">{tracks.map((t, idx) => <div key={`q-${t.id}`} onClick={() => { void handleSelectTrack(t); setShowQueueModal(false); }} className={`flex items-center gap-2.5 p-2 rounded-xl text-xs cursor-pointer ${t.id === currentTrack.id ? 'bg-[#00F5FF]/15 text-[#00F5FF] font-bold border border-[#00F5FF]/30' : 'text-[#9CA3B7] hover:text-[#F7F8FC] hover:bg-white/5'}`}><span className="w-4 text-[#61697C] font-mono">{idx + 1}</span><span className="flex-1 truncate">{t.title}</span><span className="text-[11px] text-[#61697C]">{t.artist}</span></div>)}</div></div></div>}
      {comingSoonTitle && <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-5"><div className="w-full max-w-sm rounded-3xl bg-[#10131C]/95 border border-[#00F5FF]/30 p-6 space-y-4"><div className="w-12 h-12 rounded-2xl bg-[#00F5FF]/15 border border-[#00F5FF]/40 flex items-center justify-center text-[#00F5FF]"><Sparkles className="w-6 h-6" /></div><div><h3 className="text-lg font-black uppercase text-[#F7F8FC] mb-1">{comingSoonTitle}</h3><p className="text-xs text-[#9CA3B7] leading-relaxed">This media source could not be verified as playable. CyberPulse will not pretend it is playing.</p></div><button onClick={() => setComingSoonTitle(null)} className="w-full py-2.5 rounded-xl bg-[#00F5FF] text-[#07090F] font-bold text-xs uppercase tracking-wider">Understood</button></div></div>}

      {activeYouTubePlayerTrack && <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"><div className="w-full max-w-2xl bg-[#0A0D15] border border-red-500/40 rounded-3xl overflow-hidden"><div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#10131C]"><div className="flex items-center gap-3 min-w-0"><div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white"><Youtube className="w-4 h-4 fill-white" /></div><div className="min-w-0"><div className="text-xs font-bold text-white truncate">{activeYouTubePlayerTrack.title}</div><div className="text-[10px] text-red-400 truncate">{activeYouTubePlayerTrack.artist}</div></div></div><button onClick={() => setActiveYouTubePlayerTrack(null)} className="p-1.5 rounded-lg text-[#9CA3B7] hover:text-white"><X className="w-5 h-5" /></button></div><div className="relative w-full aspect-video bg-black"><iframe src={`https://www.youtube-nocookie.com/embed/${activeYouTubePlayerTrack.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1`} title={activeYouTubePlayerTrack.title} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div></div></div>}
      <SpotifyPlayerModal track={activeSpotifyPlayerTrack} isOpen={Boolean(activeSpotifyPlayerTrack)} onClose={() => setActiveSpotifyPlayerTrack(null)} onPlayViaYouTube={handlePlaySpotifyTrackViaYouTube} />
    </div>
  );
};

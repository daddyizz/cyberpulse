import React, { useState, useEffect } from 'react';
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
  Layers
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

interface CyberPulseAppProps {
  isTabletView?: boolean;
  preferences: AppPreferences;
  onUpdatePreferences: (prefs: Partial<AppPreferences>) => void;
}

export const CyberPulseApp: React.FC<CyberPulseAppProps> = ({
  isTabletView = false,
  preferences,
  onUpdatePreferences,
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

  // Onboarding internal step (1 to 6)
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(preferences.selectedGenres || []);
  const [selectedArtists, setSelectedArtists] = useState<string[]>(preferences.selectedArtists || []);
  const [personalizationEnabled, setPersonalizationEnabled] = useState<boolean>(true);

  // Music State
  const [tracks, setTracks] = useState<Track[]>(DEMO_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track>(DEMO_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [seekSeconds, setSeekSeconds] = useState<number>(45);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  // Modals & Sheets
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [comingSoonTitle, setComingSoonTitle] = useState<string | null>(null);
  const [showLyricsModal, setShowLyricsModal] = useState<boolean>(false);
  const [showQueueModal, setShowQueueModal] = useState<boolean>(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'NeuroDancer',
    'Night Drive',
    'Cyber Mix',
    'Electronic',
  ]);

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

  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setSeekSeconds(0);
  };

  const handleNextTrack = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0;
    setCurrentTrack(tracks[nextIndex]);
    setSeekSeconds(0);
  };

  const handlePrevTrack = () => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
    setCurrentTrack(tracks[prevIndex]);
    setSeekSeconds(0);
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
    ? tracks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.album.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredArtists = searchQuery.trim()
    ? DEMO_ARTISTS.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const filteredAlbums = searchQuery.trim()
    ? DEMO_ALBUMS.filter(
        (al) =>
          al.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          al.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredPlaylists = searchQuery.trim()
    ? DEMO_PLAYLISTS.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const isDarkOled = preferences.theme === 'oled';
  const bgColor = isDarkOled ? 'bg-[#000000]' : 'bg-[#07090F]';
  const cardBgColor = isDarkOled ? 'bg-[#0C0C0C]' : 'bg-[#10131C]/90 backdrop-blur-xl border border-[#171B28]';

  // Navigation Items
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className={`relative w-full h-full flex flex-col ${bgColor} text-[#F7F8FC] select-none overflow-hidden font-sans`}>
      {/* Frosted Glass Ambient Lighting Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#8B5CFF] opacity-10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#00F5FF] opacity-10 rounded-full blur-[150px]" />
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
                            <CyberArtwork keyName={artist.artworkKey} />
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
                <div className="flex items-center gap-3">
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

              {/* Section 1: Recently Played */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#F7F8FC] uppercase">Recently Played</h3>
                  <span className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline">See All</span>
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">
                  {tracks.slice(0, 5).map((track) => (
                    <div
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className="w-36 shrink-0 flex flex-col gap-2 group cursor-pointer"
                    >
                      <div className="aspect-square rounded-xl bg-[#171B28] border border-[#171B28] group-hover:border-[#00F5FF]/50 overflow-hidden relative shadow-lg shadow-black/40 transition-all">
                        <CyberArtwork keyName={track.placeholderArtworkKey} />
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
                  <span className="text-[#00F5FF] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline">Explore</span>
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">
                  {DEMO_PLAYLISTS.slice(0, 4).map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => setComingSoonTitle(`Playlist: ${pl.title}`)}
                      className="w-36 shrink-0 flex flex-col gap-2 group cursor-pointer"
                    >
                      <div className="aspect-square rounded-xl bg-[#171B28] border border-[#171B28] group-hover:border-[#8B5CFF]/60 overflow-hidden relative shadow-lg shadow-black/40 transition-all">
                        <CyberArtwork keyName={pl.artworkKey} />
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
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">
                  {[...tracks].reverse().map((track) => (
                    <div
                      key={`tr-${track.id}`}
                      onClick={() => handleSelectTrack(track)}
                      className="w-36 shrink-0 flex flex-col gap-2 group cursor-pointer"
                    >
                      <div className="aspect-square rounded-xl bg-[#171B28] border border-[#171B28] group-hover:border-[#FF2ED1]/60 overflow-hidden relative shadow-lg shadow-black/40 transition-all">
                        <CyberArtwork keyName={track.placeholderArtworkKey} />
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
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-1 no-scrollbar">
                  {tracks.slice(3, 7).map((track) => (
                    <div
                      key={`new-${track.id}`}
                      onClick={() => handleSelectTrack(track)}
                      className="w-36 shrink-0 flex flex-col gap-2 group cursor-pointer"
                    >
                      <div className="aspect-square rounded-xl bg-[#171B28] border border-[#171B28] group-hover:border-[#B8FF2C]/60 overflow-hidden relative shadow-lg shadow-black/40 transition-all">
                        <CyberArtwork keyName={track.placeholderArtworkKey} />
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
                        <CyberArtwork keyName={pl.artworkKey} />
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
                        <CyberArtwork keyName={artist.artworkKey} />
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
                  <span className="flex-1">Offline Catalog Active • Querying in-memory cached pulses</span>
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
                {(['ALL', 'SONGS', 'ARTISTS', 'ALBUMS', 'PLAYLISTS'] as SearchFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSearchFilter(filter)}
                    className={`py-1 px-3.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-colors ${
                      searchFilter === filter
                        ? 'bg-[#00F5FF] text-[#07090F]'
                        : 'bg-[#10131C] border border-[#171B28] text-[#9CA3B7] hover:text-[#F7F8FC]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Active Search Results */}
              {searchQuery.trim() ? (
                <div className="space-y-4">
                  <div className="text-xs text-[#9CA3B7] font-bold uppercase tracking-wider">
                    Query: "{searchQuery}" • Filter: {searchFilter}
                  </div>

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
                            <CyberArtwork keyName={trk.placeholderArtworkKey} />
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
                              <CyberArtwork keyName={artist.artworkKey} />
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
                              <CyberArtwork keyName={album.artworkKey} />
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
                              <CyberArtwork keyName={pl.artworkKey} />
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
                    filteredPlaylists.length === 0 && (
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
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-3">Mood & Vibe</h2>
                <div className="grid grid-cols-2 gap-3">
                  {EXPLORE_MOODS.map((mood) => (
                    <div
                      key={mood.title}
                      onClick={() => setComingSoonTitle(`Mood Station: ${mood.title}`)}
                      className={`h-24 rounded-2xl p-3 bg-gradient-to-br ${mood.gradient} border border-white/10 flex flex-col justify-between cursor-pointer shadow-lg hover:border-white/30 transition-all backdrop-blur-md`}
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
                        className="py-1.5 px-3.5 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF] shrink-0 transition-colors"
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
                        onClick={() => setComingSoonTitle(`Activity Radio: ${act}`)}
                        className="py-1.5 px-3.5 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#8B5CFF] shrink-0 transition-colors"
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
                      onClick={() => setComingSoonTitle(`Decade Channel: ${decade}`)}
                      className="p-2.5 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md text-center text-[10px] font-black uppercase tracking-wider text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#FF2ED1] transition-colors"
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
                  onClick={() => setComingSoonTitle('Create New Playlist')}
                  className="p-2 rounded-full bg-[#00F5FF]/15 border border-[#00F5FF]/30 text-[#00F5FF] hover:bg-[#00F5FF]/25 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['Playlists', 'Artists', 'Albums', 'Liked'].map((filter) => (
                  <button
                    key={filter}
                    className="py-1 px-3.5 rounded-full border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF] shrink-0 transition-colors"
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Liked Songs Banner */}
              <div
                onClick={() => setComingSoonTitle('Liked Songs Collection')}
                className="p-4 rounded-2xl bg-gradient-to-r from-[#FF2ED1]/20 via-[#8B5CFF]/15 to-transparent border border-[#FF2ED1]/40 backdrop-blur-xl flex items-center justify-between cursor-pointer hover:border-[#FF2ED1] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF2ED1] to-[#8B5CFF] flex items-center justify-center text-white shadow-lg shadow-[#FF2ED1]/20">
                    <Heart className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase text-[#F7F8FC]">Liked Songs</div>
                    <div className="text-xs text-[#9CA3B7]">
                      {tracks.filter((t) => t.isLiked).length} tracks in collection
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#9CA3B7]" />
              </div>

              {/* Your Playlists */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3B7] mb-3">Your Playlists</h2>
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
                        <CyberArtwork keyName={pl.artworkKey} />
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
                    <div className="text-sm font-black text-[#F7F8FC]">{tracks.filter((t) => t.isLiked).length}</div>
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
                  { label: 'Account', action: () => setComingSoonTitle('User Account Settings') },
                  { label: 'Listening Stats', action: () => setComingSoonTitle('Listening Telemetry') },
                  { label: 'Appearance', action: () => setCurrentScreen('settings') },
                  { label: 'Playback Engine', action: () => setComingSoonTitle('Audio Engine DSP') },
                  { label: 'Notifications', action: () => setComingSoonTitle('Notification Center') },
                  { label: 'Privacy Controls', action: () => setComingSoonTitle('Privacy & Telemetry') },
                  { label: 'CyberPulse Pro', action: () => setComingSoonTitle('CyberPulse Pro Subscription') },
                  { label: 'Settings', action: () => setCurrentScreen('settings') },
                  { label: 'About CyberPulse', action: () => setComingSoonTitle('About CyberPulse v1.0') },
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
            <div className="p-4 space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="p-1.5 rounded-full hover:bg-white/10"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-2xl font-black uppercase tracking-tight text-[#F7F8FC]">Settings</h1>
              </div>

              {/* Theme Switcher with Frosted Glass, Cyberpunk & OLED */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#00F5FF] tracking-widest uppercase">Appearance & Themes</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => onUpdatePreferences({ theme: 'frosted' })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      preferences.theme === 'frosted'
                        ? 'border-[#00F5FF] bg-[#10131C]/90 backdrop-blur-xl shadow-lg shadow-[#00F5FF]/15'
                        : 'border-[#171B28] bg-[#10131C]/40 text-[#9CA3B7]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-[#F7F8FC]">Frosted Glass</span>
                      {preferences.theme === 'frosted' && <Check className="w-4 h-4 text-[#00F5FF]" />}
                    </div>
                    <div className="text-[10px] text-[#9CA3B7]">Flagship #10131C glass with blurred glow</div>
                  </button>

                  <button
                    onClick={() => onUpdatePreferences({ theme: 'cyberpunk' })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      preferences.theme === 'cyberpunk'
                        ? 'border-[#00F5FF] bg-[#0E131F] shadow-lg shadow-[#00F5FF]/10'
                        : 'border-[#171B28] bg-[#10131C]/40 text-[#9CA3B7]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-[#F7F8FC]">Cyberpunk</span>
                      {preferences.theme === 'cyberpunk' && <Check className="w-4 h-4 text-[#00F5FF]" />}
                    </div>
                    <div className="text-[10px] text-[#9CA3B7]">Classic neon cyber aesthetics</div>
                  </button>

                  <button
                    onClick={() => onUpdatePreferences({ theme: 'oled' })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      preferences.theme === 'oled'
                        ? 'border-[#00F5FF] bg-black shadow-lg shadow-[#00F5FF]/10'
                        : 'border-[#171B28] bg-[#10131C]/40 text-[#9CA3B7]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-[#F7F8FC]">OLED Black</span>
                      {preferences.theme === 'oled' && <Check className="w-4 h-4 text-[#00F5FF]" />}
                    </div>
                    <div className="text-[10px] text-[#9CA3B7]">#000000 pure black power saving</div>
                  </button>
                </div>
              </div>

              {/* Functional Toggles */}
              <div className="space-y-4 pt-2">
                <div className="text-xs font-bold text-[#00F5FF] tracking-widest uppercase">System Preferences</div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#F7F8FC]">Reduce Animations</div>
                    <div className="text-[11px] text-[#9CA3B7]">Minimize motion effects across UI</div>
                  </div>
                  <button
                    onClick={() => onUpdatePreferences({ reduceAnimations: !preferences.reduceAnimations })}
                    className={`w-11 h-6 rounded-full p-1 transition-colors ${
                      preferences.reduceAnimations ? 'bg-[#00F5FF]' : 'bg-[#171B28]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-black transition-transform ${
                        preferences.reduceAnimations ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#F7F8FC]">Dynamic Backgrounds</div>
                    <div className="text-[11px] text-[#9CA3B7]">Ambient atmospheric gradients</div>
                  </div>
                  <button
                    onClick={() => onUpdatePreferences({ dynamicBackgrounds: !preferences.dynamicBackgrounds })}
                    className={`w-11 h-6 rounded-full p-1 transition-colors ${
                      preferences.dynamicBackgrounds ? 'bg-[#00F5FF]' : 'bg-[#171B28]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-black transition-transform ${
                        preferences.dynamicBackgrounds ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#F7F8FC]">Data Saver Mode</div>
                    <div className="text-[11px] text-[#9CA3B7]">Reduce preview metadata bandwidth</div>
                  </div>
                  <button
                    onClick={() => onUpdatePreferences({ dataSaver: !preferences.dataSaver })}
                    className={`w-11 h-6 rounded-full p-1 transition-colors ${
                      preferences.dataSaver ? 'bg-[#00F5FF]' : 'bg-[#171B28]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-black transition-transform ${
                        preferences.dataSaver ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Block 3C: Playback Engine & Media3 Diagnostics Lab */}
              <div className="p-4 rounded-2xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-black uppercase tracking-wider text-[#F7F8FC] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#00F5FF]" />
                    <span>Media3 Playback Lab</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/30">
                    SERVICE ACTIVE
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-[#171B28]/60">
                    <span className="text-[#9CA3B7]">Playback Service</span>
                    <span className="text-[#F7F8FC]">CyberPulsePlaybackService</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#171B28]/60">
                    <span className="text-[#9CA3B7]">Media Session</span>
                    <span className="text-[#00F5FF]">MediaLibrarySession (Media3)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#171B28]/60">
                    <span className="text-[#9CA3B7]">Notification Channel</span>
                    <span className="text-[#F7F8FC]">cyberpulse_media_playback (Low)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#171B28]/60">
                    <span className="text-[#9CA3B7]">Audio Focus Policy</span>
                    <span className="text-[#F7F8FC]">User Intent Precedence</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#171B28]/60">
                    <span className="text-[#9CA3B7]">Noisy Device Handler</span>
                    <span className="text-[#F7F8FC]">Pause on Unplug / Disconnect</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#9CA3B7]">State Recovery</span>
                    <span className="text-[#00F5FF]">Paused Cold Restore (Active)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#171B28] flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (isPlaying) {
                        setIsPlaying(false);
                      }
                      alert('Simulated Phone Call Interruption: Audio paused transiently. Focus will automatically resume when call finishes if user was playing.');
                    }}
                    className="flex-1 py-1.5 px-2 rounded-lg border border-[#171B28] bg-[#07090F] hover:border-[#00F5FF] text-[10px] font-bold uppercase tracking-wider text-[#9CA3B7] hover:text-[#00F5FF] transition-colors"
                  >
                    Simulate Call
                  </button>
                  <button
                    onClick={() => {
                      if (isPlaying) {
                        setIsPlaying(false);
                      }
                      alert('Simulated Headphone Disconnect: ACTION_AUDIO_BECOMING_NOISY received. Playback paused immediately to prevent loudspeaker blast.');
                    }}
                    className="flex-1 py-1.5 px-2 rounded-lg border border-[#171B28] bg-[#07090F] hover:border-[#00F5FF] text-[10px] font-bold uppercase tracking-wider text-[#9CA3B7] hover:text-[#00F5FF] transition-colors"
                  >
                    Simulate Unplug
                  </button>
                </div>
              </div>

              {/* About Box */}
              <div className="p-4 rounded-2xl border border-[#171B28] bg-[#10131C]/90 backdrop-blur-xl space-y-2 text-xs">
                <div className="font-black uppercase tracking-wider text-[#F7F8FC]">CyberPulse Music</div>
                <div className="text-[11px] text-[#00F5FF] font-bold">Version 1.0.0 • Frosted Glass Theme</div>
                <div className="text-[11px] text-[#9CA3B7] font-mono leading-relaxed">
                  Package: com.daddyizz.cyberpulse<br />
                  Framework: Native Android Kotlin + Jetpack Compose<br />
                  Target: Android 14 (API 34) / Min SDK 24
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: ARTIST DETAIL */}
          {currentScreen === 'artist_detail' && (
            (() => {
              const artist = DEMO_ARTISTS.find((a) => a.id === selectedArtistId) || DEMO_ARTISTS[0];
              return (
                <ArtistDetailView
                  artist={artist}
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
        </main>

        {/* Persistent Mini Player (Docked above Bottom Nav) - Frosted Glass Design */}
        {currentScreen !== 'onboarding' && (
          <div
            onClick={() => setIsNowPlayingOpen(true)}
            className="absolute bottom-20 left-3 right-3 sm:left-4 sm:right-4 h-16 bg-[#10131C]/90 backdrop-blur-xl border border-[#00F5FF]/20 rounded-2xl flex items-center px-3 sm:px-4 z-30 shadow-2xl shadow-black cursor-pointer hover:border-[#00F5FF]/50 transition-all"
          >
            {/* Album thumbnail */}
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#00F5FF]/20 mr-3 shadow-md shadow-black">
              <CyberArtwork keyName={currentTrack.placeholderArtworkKey} />
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="text-xs font-black uppercase text-[#F7F8FC] truncate">{currentTrack.title}</div>
              <div className="text-[10px] uppercase text-[#00F5FF] font-bold truncate">{currentTrack.artist}</div>
            </div>

            {/* Controls: Prev, Play, Next */}
            <div className="flex items-center gap-3 sm:gap-4 px-2">
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
                  setIsPlaying(!isPlaying);
                }}
                className="w-10 h-10 bg-[#00F5FF] rounded-full flex items-center justify-center text-[#07090F] font-bold shadow-lg shadow-[#00F5FF]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
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
        <div className="fixed inset-0 z-50 bg-[#07090F]/95 backdrop-blur-2xl flex flex-col p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-8 duration-200">
          {/* Ambient Frosted Orb for Now Playing */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-[#8B5CFF]/25 via-[#00F5FF]/15 to-transparent rounded-full blur-[100px] pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <button
              onClick={() => setIsNowPlayingOpen(false)}
              className="p-2 -ml-2 text-[#9CA3B7] hover:text-white transition-colors"
            >
              <ChevronDown className="w-7 h-7" />
            </button>
            <div className="text-center">
              <div className="text-[10px] font-mono tracking-widest text-[#00F5FF] uppercase font-bold">
                Playing from playlist
              </div>
              <div className="text-xs font-black uppercase text-[#F7F8FC]">{currentTrack.album}</div>
            </div>
            <button
              onClick={() => setComingSoonTitle('Track Options')}
              className="p-2 -mr-2 text-[#9CA3B7] hover:text-white transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Hero Artwork */}
          <div className="w-full max-w-[280px] aspect-square mx-auto rounded-3xl overflow-hidden border-2 border-[#00F5FF]/40 shadow-[0_0_40px_rgba(0,245,255,0.25)] my-4 relative z-10">
            <CyberArtwork keyName={currentTrack.placeholderArtworkKey} />
          </div>

          {/* Track Meta & Like */}
          <div className="flex items-center justify-between mt-4 mb-3 relative z-10">
            <div className="min-w-0 pr-3">
              <div className="text-xl font-black uppercase text-[#F7F8FC] truncate">{currentTrack.title}</div>
              <div className="text-xs font-bold uppercase text-[#00F5FF] tracking-wider truncate">{currentTrack.artist}</div>
            </div>
            <button
              onClick={() => handleToggleLike(currentTrack.id)}
              className="p-2 text-[#9CA3B7] hover:text-[#FF2ED1] transition-colors"
            >
              <Heart
                className={`w-7 h-7 ${
                  currentTrack.isLiked ? 'fill-[#FF2ED1] text-[#FF2ED1]' : 'text-[#9CA3B7]'
                }`}
              />
            </button>
          </div>

          {/* Progress Slider */}
          <div className="space-y-1.5 my-2 relative z-10">
            <input
              type="range"
              min={0}
              max={currentTrack.durationSeconds || 214}
              value={seekSeconds}
              onChange={(e) => setSeekSeconds(Number(e.target.value))}
              className="w-full h-1.5 bg-[#171B28] rounded-lg appearance-none cursor-pointer accent-[#00F5FF]"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#9CA3B7]">
              <span>{`${Math.floor(seekSeconds / 60)}:${String(seekSeconds % 60).padStart(2, '0')}`}</span>
              <span>{`${Math.floor((currentTrack.durationSeconds || 214) / 60)}:${String(
                (currentTrack.durationSeconds || 214) % 60
              ).padStart(2, '0')}`}</span>
            </div>
          </div>

          {/* Controls: Shuffle, Prev, Play, Next, Repeat */}
          <div className="flex items-center justify-between py-4 max-w-xs mx-auto w-full relative z-10">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-2 transition-colors ${isShuffle ? 'text-[#00F5FF]' : 'text-[#61697C]'}`}
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrevTrack}
              className="p-2 text-[#F7F8FC] hover:text-[#00F5FF] transition-colors"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full bg-[#00F5FF] flex items-center justify-center text-[#07090F] shadow-xl shadow-[#00F5FF]/30 hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-7 h-7 fill-[#07090F]" /> : <Play className="w-7 h-7 fill-[#07090F] ml-1" />}
            </button>
            <button
              onClick={handleNextTrack}
              className="p-2 text-[#F7F8FC] hover:text-[#00F5FF] transition-colors"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>
            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-2 transition-colors ${isRepeat ? 'text-[#00F5FF]' : 'text-[#61697C]'}`}
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Tabs: Lyrics & Queue */}
          <div className="flex items-center justify-between pt-4 border-t border-[#171B28] mt-auto relative z-10">
            <button
              onClick={() => setShowLyricsModal(true)}
              className="flex items-center gap-1.5 py-2 px-4 rounded-full border border-[#171B28] bg-[#10131C]/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-[#9CA3B7] hover:text-[#F7F8FC] hover:border-[#00F5FF] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#00F5FF]" />
              <span>Lyrics</span>
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

      {/* MODAL: LYRICS */}
      {showLyricsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#10131C]/95 backdrop-blur-2xl border border-[#171B28] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black uppercase tracking-wide text-[#F7F8FC]">Synced Cyber Lyrics</h3>
              <button onClick={() => setShowLyricsModal(false)} className="text-[#9CA3B7] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 py-2 text-sm text-[#00F5FF] font-medium leading-relaxed">
              <p>“Neon veins across the concrete grid,</p>
              <p>Pulses rising where the shadows hid,</p>
              <p className="text-white font-black text-base">Synthetic dreams beneath the chrome,</p>
              <p>CyberPulse is calling home.”</p>
            </div>
            <div className="text-[11px] text-[#9CA3B7] pt-2 border-t border-[#171B28]">
              Real-time synchronized LRC provider will be integrated in Block 2.
            </div>
          </div>
        </div>
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
    </div>
  );
};

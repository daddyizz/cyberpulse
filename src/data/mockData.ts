import { Track, Artist, Album, Playlist, UserProfile } from '../types';

export const DEMO_TRACKS: Track[] = [
  {
    id: 'trk_01',
    title: 'Night Drive',
    artist: 'NeuroDancer',
    album: 'Neon Drift LP',
    placeholderArtworkKey: 'neon_horizon',
    durationSeconds: 214,
    source: 'DEMO',
    isLiked: true,
    playsCount: 142800,
    artistId: 'art_01',
    albumId: 'alb_01',
    playbackCapability: {
      mode: 'SUPPORTED_OFFICIAL',
      supportsOffline: true,
      supportsLyrics: true,
      streamBitrateKbps: 320,
      notice: 'Audio streaming engine scheduled for Block 3 (Official Media3 playback).'
    }
  },
  {
    id: 'trk_02',
    title: 'Cyber Mix',
    artist: 'PulseMatrix',
    album: 'Quantum Waves',
    placeholderArtworkKey: 'purple_pulse',
    durationSeconds: 188,
    source: 'DEMO',
    isLiked: false,
    playsCount: 98300,
    artistId: 'art_05',
    albumId: 'alb_02',
    playbackCapability: {
      mode: 'SUPPORTED_OFFICIAL',
      supportsOffline: true,
      supportsLyrics: true,
      streamBitrateKbps: 320,
      notice: 'Audio streaming engine scheduled for Block 3 (Official Media3 playback).'
    }
  },
  {
    id: 'trk_03',
    title: 'Focus Mode',
    artist: 'VoidEcho',
    album: 'Subliminal Flow',
    placeholderArtworkKey: 'digital_rain',
    durationSeconds: 302,
    source: 'DEMO',
    isLiked: true,
    playsCount: 312000,
    artistId: 'art_06',
    albumId: 'alb_03',
    playbackCapability: {
      mode: 'SUPPORTED_OFFICIAL',
      supportsOffline: true,
      supportsLyrics: true,
      streamBitrateKbps: 320,
      notice: 'Audio streaming engine scheduled for Block 3 (Official Media3 playback).'
    }
  },
  {
    id: 'trk_04',
    title: 'Electric Dreams',
    artist: 'Hologram Boy',
    album: 'Silicon Memories',
    placeholderArtworkKey: 'electric_dream',
    durationSeconds: 227,
    source: 'DEMO',
    isLiked: false,
    playsCount: 65400,
    artistId: 'art_03',
    albumId: 'alb_04',
    playbackCapability: {
      mode: 'SUPPORTED_OFFICIAL',
      supportsOffline: true,
      supportsLyrics: true,
      streamBitrateKbps: 320,
      notice: 'Audio streaming engine scheduled for Block 3 (Official Media3 playback).'
    }
  },
  {
    id: 'trk_05',
    title: 'Midnight Pulse',
    artist: 'CyberValkyrie',
    album: 'Chrome Angels',
    placeholderArtworkKey: 'midnight_circuit',
    durationSeconds: 245,
    source: 'DEMO',
    isLiked: true,
    playsCount: 205000,
    artistId: 'art_04',
    albumId: 'alb_05',
    playbackCapability: {
      mode: 'SUPPORTED_OFFICIAL',
      supportsOffline: true,
      supportsLyrics: true,
      streamBitrateKbps: 320,
      notice: 'Audio streaming engine scheduled for Block 3 (Official Media3 playback).'
    }
  },
  {
    id: 'trk_06',
    title: 'Tokyo Overdrive',
    artist: 'Vector 7',
    album: 'Shinjuku Highway',
    placeholderArtworkKey: 'neon_horizon',
    durationSeconds: 196,
    source: 'DEMO',
    isLiked: false,
    playsCount: 89000,
    artistId: 'art_02',
    albumId: 'alb_06',
    playbackCapability: {
      mode: 'SUPPORTED_OFFICIAL',
      supportsOffline: true,
      supportsLyrics: true,
      streamBitrateKbps: 320,
      notice: 'Audio streaming engine scheduled for Block 3 (Official Media3 playback).'
    }
  },
  {
    id: 'trk_07',
    title: 'Synthetic Heart',
    artist: 'NeuroDancer',
    album: 'Neon Drift LP',
    placeholderArtworkKey: 'purple_pulse',
    durationSeconds: 232,
    source: 'DEMO',
    isLiked: true,
    playsCount: 120500,
    artistId: 'art_01',
    albumId: 'alb_01',
    playbackCapability: {
      mode: 'SUPPORTED_OFFICIAL',
      supportsOffline: true,
      supportsLyrics: true,
      streamBitrateKbps: 320,
      notice: 'Audio streaming engine scheduled for Block 3 (Official Media3 playback).'
    }
  },
  {
    id: 'trk_08',
    title: 'Glitch Odyssey',
    artist: 'PulseMatrix',
    album: 'Quantum Waves',
    placeholderArtworkKey: 'digital_rain',
    durationSeconds: 264,
    source: 'DEMO',
    isLiked: false,
    playsCount: 47800,
    artistId: 'art_05',
    albumId: 'alb_02',
    playbackCapability: {
      mode: 'SUPPORTED_OFFICIAL',
      supportsOffline: true,
      supportsLyrics: true,
      streamBitrateKbps: 320,
      notice: 'Audio streaming engine scheduled for Block 3 (Official Media3 playback).'
    }
  },
  {
    id: 'trk_09',
    title: 'Carbon Cascade',
    artist: 'Vector 7',
    album: 'Shinjuku Highway',
    placeholderArtworkKey: 'midnight_circuit',
    durationSeconds: 210,
    source: 'DEMO',
    isLiked: false,
    playsCount: 55400,
    artistId: 'art_02',
    albumId: 'alb_06',
    playbackCapability: {
      mode: 'SUPPORTED_OFFICIAL',
      supportsOffline: true,
      supportsLyrics: true,
      streamBitrateKbps: 320,
      notice: 'Audio streaming engine scheduled for Block 3 (Official Media3 playback).'
    }
  },
  {
    id: 'trk_10',
    title: 'Sub-bass Horizon',
    artist: 'VoidEcho',
    album: 'Subliminal Flow',
    placeholderArtworkKey: 'neon_horizon',
    durationSeconds: 280,
    source: 'DEMO',
    isLiked: false,
    playsCount: 78000,
    artistId: 'art_06',
    albumId: 'alb_03',
    playbackCapability: {
      mode: 'SUPPORTED_OFFICIAL',
      supportsOffline: true,
      supportsLyrics: true,
      streamBitrateKbps: 320,
      notice: 'Audio streaming engine scheduled for Block 3 (Official Media3 playback).'
    }
  }
];

export const DEMO_ARTISTS: Artist[] = [
  {
    id: 'art_01',
    name: 'NeuroDancer',
    followersCount: 845000,
    artworkKey: 'neon_horizon',
    genres: ['Electronic', 'Synthwave'],
    bio: 'Pioneer of high-tempo neon synth aesthetics and analog arpeggios crafted for night drives.',
    isFollowed: true
  },
  {
    id: 'art_02',
    name: 'Vector 7',
    followersCount: 520000,
    artworkKey: 'midnight_circuit',
    genres: ['Cyberpunk', 'Darksynth'],
    bio: 'Heavy distorted basslines tailored for subterranean concrete transit routes.',
    isFollowed: false
  },
  {
    id: 'art_03',
    name: 'Hologram Boy',
    followersCount: 430000,
    artworkKey: 'electric_dream',
    genres: ['Lo-Fi', 'Indie'],
    bio: 'Warm tape-decay soundscapes fused with retro-futuristic vocals and nostalgic chords.',
    isFollowed: false
  },
  {
    id: 'art_04',
    name: 'CyberValkyrie',
    followersCount: 680000,
    artworkKey: 'purple_pulse',
    genres: ['Metal', 'Electronic'],
    bio: 'Symphonic industrial metal colliding with digital hyper-synthesis.',
    isFollowed: true
  },
  {
    id: 'art_05',
    name: 'PulseMatrix',
    followersCount: 910000,
    artworkKey: 'digital_rain',
    genres: ['Techno', 'Acid'],
    bio: 'Hypnotic 303 modular patterns designed for endless underground cyber raves.',
    isFollowed: false
  },
  {
    id: 'art_06',
    name: 'VoidEcho',
    followersCount: 340000,
    artworkKey: 'neon_horizon',
    genres: ['Ambient', 'Focus'],
    bio: 'Deep atmospheric binaural soundscapes designed for flow state, coding, and nocturnal immersion.',
    isFollowed: false
  }
];

export const DEMO_ALBUMS: Album[] = [
  {
    id: 'alb_01',
    title: 'Neon Drift LP',
    artist: 'NeuroDancer',
    artistId: 'art_01',
    releaseYear: 2024,
    artworkKey: 'neon_horizon',
    tracksCount: 2,
    tracks: [DEMO_TRACKS[0], DEMO_TRACKS[6]]
  },
  {
    id: 'alb_02',
    title: 'Quantum Waves',
    artist: 'PulseMatrix',
    artistId: 'art_05',
    releaseYear: 2023,
    artworkKey: 'purple_pulse',
    tracksCount: 2,
    tracks: [DEMO_TRACKS[1], DEMO_TRACKS[7]]
  },
  {
    id: 'alb_03',
    title: 'Subliminal Flow',
    artist: 'VoidEcho',
    artistId: 'art_06',
    releaseYear: 2024,
    artworkKey: 'digital_rain',
    tracksCount: 2,
    tracks: [DEMO_TRACKS[2], DEMO_TRACKS[9]]
  },
  {
    id: 'alb_04',
    title: 'Silicon Memories',
    artist: 'Hologram Boy',
    artistId: 'art_03',
    releaseYear: 2023,
    artworkKey: 'electric_dream',
    tracksCount: 1,
    tracks: [DEMO_TRACKS[3]]
  },
  {
    id: 'alb_05',
    title: 'Chrome Angels',
    artist: 'CyberValkyrie',
    artistId: 'art_04',
    releaseYear: 2024,
    artworkKey: 'midnight_circuit',
    tracksCount: 1,
    tracks: [DEMO_TRACKS[4]]
  },
  {
    id: 'alb_06',
    title: 'Shinjuku Highway',
    artist: 'Vector 7',
    artistId: 'art_02',
    releaseYear: 2024,
    artworkKey: 'neon_horizon',
    tracksCount: 2,
    tracks: [DEMO_TRACKS[5], DEMO_TRACKS[8]]
  }
];

export const DEMO_PLAYLISTS: Playlist[] = [
  {
    id: 'pl_01',
    title: 'Night Drive',
    subtitle: 'High-speed synthwave & electronic bass',
    description: 'High-speed synthwave & electronic bass for night cruises across the neo-city grid',
    artworkKey: 'neon_horizon',
    trackCount: 42,
    createdBy: 'CyberPulse Curators',
    tracks: [DEMO_TRACKS[0], DEMO_TRACKS[5], DEMO_TRACKS[6]]
  },
  {
    id: 'pl_02',
    title: 'Cyber Mix',
    subtitle: 'Curated algorithmic selections',
    description: 'Algorithmic pulse generator tailored to your frequency',
    artworkKey: 'purple_pulse',
    trackCount: 50,
    createdBy: 'CyberPulse Core',
    tracks: [DEMO_TRACKS[1], DEMO_TRACKS[7], DEMO_TRACKS[4]]
  },
  {
    id: 'pl_03',
    title: 'Focus Mode',
    subtitle: 'Deep binaural coding ambient',
    description: 'Deep atmospheric binaural frequencies for coding, deep architecture, and focus',
    artworkKey: 'digital_rain',
    trackCount: 36,
    createdBy: 'VoidEcho Labs',
    tracks: [DEMO_TRACKS[2], DEMO_TRACKS[9]]
  },
  {
    id: 'pl_04',
    title: 'Electric Dreams',
    subtitle: 'Melancholic retro textures',
    description: 'Melancholic retro-futuristic audio textures and lo-fi synthetic memories',
    artworkKey: 'electric_dream',
    trackCount: 28,
    createdBy: 'CyberPulse Curators',
    tracks: [DEMO_TRACKS[3], DEMO_TRACKS[0]]
  },
  {
    id: 'pl_05',
    title: 'Midnight Pulse',
    subtitle: 'Peak-hour cyber dance',
    description: 'Peak-hour cyber dance and neon club tracks directly from subterranean hubs',
    artworkKey: 'midnight_circuit',
    trackCount: 60,
    createdBy: 'PulseMatrix Curations',
    tracks: [DEMO_TRACKS[4], DEMO_TRACKS[1], DEMO_TRACKS[7]]
  }
];

export const GENRE_OPTIONS = [
  'Pop', 'Rock', 'Hip Hop', 'Electronic',
  'R&B', 'Indie', 'Metal', 'Jazz',
  'Classical', 'K-Pop', 'Malay', 'Indonesian',
  'Lo-Fi', 'Alternative', 'Soul', 'Country',
];

export const BROWSE_CATEGORIES = [
  { name: 'Trending', color: '#FF2ED1' },
  { name: 'New Releases', color: '#00F5FF' },
  { name: 'Charts', color: '#8B5CFF' },
  { name: 'Synthwave', color: '#FF5E3A' },
  { name: 'Cyberpunk', color: '#E02424' },
  { name: 'Acid Techno', color: '#F59E0B' },
  { name: 'Electronic', color: '#10B981' },
  { name: 'Workout', color: '#06B6D4' },
  { name: 'Focus Binaural', color: '#6366F1' },
  { name: 'Chill Lo-Fi', color: '#8B5CF6' },
  { name: 'Sleep Ambient', color: '#3B82F6' },
];

export const EXPLORE_MOODS = [
  { title: 'Night Drive', desc: 'High-bpm neon synth pulses', gradient: 'from-[#0F2027] via-[#203A43] to-[#00F5FF]' },
  { title: 'Gym Energy', desc: 'Aggressive industrial beats', gradient: 'from-[#2C0B4D] to-[#FF2ED1]' },
  { title: 'Deep Focus', desc: 'Subliminal binaural cyber flow', gradient: 'from-[#051C14] to-[#B8FF2C]' },
  { title: 'Cyber Chill', desc: 'Muted lo-fi rain frequencies', gradient: 'from-[#171B28] to-[#8B5CFF]' },
  { title: 'Throwback', desc: 'Classic 80s analog synth waves', gradient: 'from-[#33082F] to-[#FF5E3A]' },
  { title: 'Party Mode', desc: 'Club peak-time dance floor', gradient: 'from-[#1F0D3D] to-[#00F5FF]' },
];

export const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_001',
  username: 'Cyber Listener',
  handle: '@cyberpulse_01',
  subscriptionTier: 'Free',
  playlistCount: 0,
  likedSongsCount: 4,
  followingCount: 2,
};

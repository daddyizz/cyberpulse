export type MusicSource = 'LOCAL' | 'DEMO' | 'YOUTUBE' | 'RADIO' | 'OTHER';

export type SearchFilter = 'ALL' | 'SONGS' | 'ARTISTS' | 'ALBUMS' | 'PLAYLISTS';

export interface PlaybackCapability {
  mode: 'SUPPORTED_OFFICIAL' | 'EXTERNAL_PLAYER' | 'UNAVAILABLE' | 'UNKNOWN';
  supportsOffline: boolean;
  supportsLyrics: boolean;
  streamBitrateKbps: number;
  notice: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  placeholderArtworkKey: string;
  artworkUrl?: string;
  durationSeconds: number;
  source: MusicSource;
  isLiked?: boolean;
  playsCount?: number;
  artistId?: string;
  albumId?: string;
  playbackCapability?: PlaybackCapability;
}

export interface Artist {
  id: string;
  name: string;
  followersCount: number;
  subscriberCount?: number;
  isSubscriberCountHidden?: boolean;
  source?: MusicSource;
  artworkKey: string;
  artworkUrl?: string;
  genres: string[];
  bio?: string;
  isFollowed?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  releaseYear: number;
  artworkKey: string;
  artworkUrl?: string;
  tracksCount: number;
  source?: MusicSource;
  tracks?: Track[];
}

export interface Playlist {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  artworkKey: string;
  artworkUrl?: string;
  trackCount: number;
  createdBy?: string;
  source?: MusicSource;
  tracks?: Track[];
}

export interface UserProfile {
  id: string;
  username: string;
  handle: string;
  subscriptionTier: string;
  playlistCount: number;
  likedSongsCount: number;
  followingCount: number;
}

export type ScreenType =
  | 'onboarding'
  | 'home'
  | 'search'
  | 'explore'
  | 'library'
  | 'profile'
  | 'settings'
  | 'artist_detail'
  | 'album_detail'
  | 'playlist_detail';

export type CyberTheme = 'frosted' | 'cyberpunk' | 'oled';

export interface AppPreferences {
  theme: CyberTheme;
  reduceAnimations: boolean;
  dynamicBackgrounds: boolean;
  dataSaver: boolean;
  recommendationsEnabled: boolean;
  notificationsEnabled: boolean;
  isOnboardingCompleted: boolean;
  selectedGenres: string[];
  selectedArtists: string[];
}

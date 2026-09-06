import { Track } from '../types';

const YOUTUBE_API_KEY =
  ((import.meta as any).env?.VITE_YOUTUBE_API_KEY as string) ||
  'AIzaSyCENXP7uI203Br9-afgbsl865QLJQR-vk0';

function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export interface YouTubeSearchResult {
  tracks: Track[];
  error?: string;
}

export async function searchYouTubeVideos(query: string, maxResults = 12): Promise<YouTubeSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { tracks: [] };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      trimmed
    )}&type=video&videoEmbeddable=true&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const message = errData?.error?.message || `YouTube API responded with status ${response.status}`;
      console.error('YouTube search error:', message);
      return { tracks: [], error: message };
    }

    const data = await response.json();
    const items = data.items || [];

    const tracks: Track[] = items
      .filter((item: any) => item?.id?.videoId)
      .map((item: any) => {
        const videoId = item.id.videoId;
        const snippet = item.snippet || {};
        const title = decodeHtmlEntities(snippet.title || 'Untitled YouTube Track');
        const channelTitle = decodeHtmlEntities(snippet.channelTitle || 'YouTube Artist');
        const thumbnail =
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
          id: `yt_${videoId}`,
          title,
          artist: channelTitle,
          album: 'YouTube Discovery',
          artworkUrl: thumbnail,
          placeholderArtworkKey: 'midnight_circuit',
          durationSeconds: 210,
          youtubeVideoId: videoId,
          source: 'YOUTUBE' as const,
          playsCount: Math.floor(Math.random() * 200000 + 50000),
          playbackCapability: {
            mode: 'EXTERNAL_PLAYER' as const,
            supportsOffline: false,
            supportsLyrics: false,
            streamBitrateKbps: 256,
            notice: 'Official YouTube stream playback via embedded player.',
          },
        };
      });

    return { tracks };
  } catch (err: any) {
    console.error('Failed to search YouTube:', err);
    return { tracks: [], error: err.message || 'Network error querying YouTube' };
  }
}

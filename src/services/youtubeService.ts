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

function parseIsoDuration(value?: string): number {
  if (!value) return 0;
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

export interface YouTubeSearchResult {
  tracks: Track[];
  error?: string;
}

export async function validateYouTubeVideoId(videoId?: string): Promise<boolean> {
  if (!videoId) return false;
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=status&id=${encodeURIComponent(videoId)}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return false;
    const data = await response.json();
    const status = data.items?.[0]?.status;
    return Boolean(
      status &&
      status.embeddable === true &&
      status.privacyStatus === 'public' &&
      status.uploadStatus === 'processed'
    );
  } catch {
    return false;
  }
}

export async function searchYouTubeVideos(query: string, maxResults = 12): Promise<YouTubeSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return { tracks: [] };

  try {
    const searchLimit = Math.min(Math.max(maxResults * 2, 8), 25);
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&q=${encodeURIComponent(
      trimmed
    )}&type=video&videoEmbeddable=true&videoSyndicated=true&safeSearch=moderate&maxResults=${searchLimit}&key=${YOUTUBE_API_KEY}`;

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      const errData = await searchResponse.json().catch(() => ({}));
      const message = errData?.error?.message || `YouTube API responded with status ${searchResponse.status}`;
      return { tracks: [], error: message };
    }

    const searchData = await searchResponse.json();
    const ids = (searchData.items || [])
      .map((item: any) => item?.id?.videoId)
      .filter(Boolean)
      .slice(0, 25);

    if (!ids.length) return { tracks: [] };

    // Search results alone can include videos that later refuse embedded playback.
    // Verify each candidate with videos.status before it ever reaches the UI.
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,contentDetails&id=${encodeURIComponent(
      ids.join(',')
    )}&key=${YOUTUBE_API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) return { tracks: [], error: 'Unable to verify YouTube playback availability.' };

    const details = await detailsResponse.json();
    const tracks: Track[] = (details.items || [])
      .filter((item: any) =>
        item?.id &&
        item?.status?.embeddable === true &&
        item?.status?.privacyStatus === 'public' &&
        item?.status?.uploadStatus === 'processed'
      )
      .slice(0, maxResults)
      .map((item: any) => {
        const videoId = item.id;
        const snippet = item.snippet || {};
        const title = decodeHtmlEntities(snippet.title || 'Untitled YouTube Track');
        const channelTitle = decodeHtmlEntities(snippet.channelTitle || 'YouTube Artist');
        const thumbnail =
          snippet.thumbnails?.maxres?.url ||
          snippet.thumbnails?.standard?.url ||
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
          durationSeconds: parseIsoDuration(item.contentDetails?.duration) || 210,
          youtubeVideoId: videoId,
          source: 'YOUTUBE' as const,
          playsCount: Math.floor(Math.random() * 200000 + 50000),
          playbackCapability: {
            mode: 'EXTERNAL_PLAYER' as const,
            supportsOffline: false,
            supportsLyrics: false,
            streamBitrateKbps: 256,
            notice: 'Verified embeddable YouTube playback.',
          },
        };
      });

    return { tracks };
  } catch (err: any) {
    console.error('Failed to search YouTube:', err);
    return { tracks: [], error: err.message || 'Network error querying YouTube' };
  }
}

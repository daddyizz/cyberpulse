import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Play,
  Shuffle,
  Bookmark,
  Clock,
  Music2,
  Check,
  RotateCcw,
  Flame,
  Volume2
} from 'lucide-react';
import { Track } from '../types';
import { DEMO_TRACKS } from '../data/mockData';
import { CyberArtwork } from './CyberArtwork';
import { searchSpotifyTracks } from '../services/spotifyService';
import { resolveSpotifyCoverArt } from '../services/spotifyArtworkService';

interface AiPlaylistViewProps {
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
}

const INSPIRATION_CHIPS = [
  'Rainy midnight drive with deep synthwave',
  'Cyber surge high-energy workout mix',
  'Deep focus electronic ambient textures',
  '80s retro outrun synthwave nostalgia',
  'Nusantara cyberpunk modern pop beats',
  'Lofi neon chill sunset relaxation',
  'Global dancefloor EDM peak hour party',
  'Acoustic soul & Nusantara nostalgia'
];

interface GenreMoodMap {
  keywords: string[];
  trackIds: string[];
  titleTemplate: string;
  descTemplate: string;
}

const CURATION_PRESETS: GenreMoodMap[] = [
  {
    keywords: ['drive', 'midnight', 'night', 'synthwave', 'retrowave', '80s', 'outrun', 'neon', 'car'],
    trackIds: ['trk_02', 'trk_01', 'trk_06', 'trk_14', 'trk_13', 'trk_08', 'trk_09', 'trk_21'],
    titleTemplate: 'Midnight Outrun: Neon Highway',
    descTemplate: 'Analog synth basslines, reverb-drenched drums, and nocturnal cinematic pulses calibrated for late-night drives.'
  },
  {
    keywords: ['workout', 'energy', 'surge', 'gym', 'heavy', 'fast', 'high', 'intensity', 'training', 'power'],
    trackIds: ['trk_07', 'trk_13', 'trk_03', 'trk_10', 'trk_18', 'trk_21', 'trk_09', 'trk_01'],
    titleTemplate: 'Cyber Surge: Peak Intensity Protocol',
    descTemplate: 'Driving BPM, aggressive electronic percussion, and thunderous drops engineered to push physical boundaries.'
  },
  {
    keywords: ['nusantara', 'malay', 'indo', 'indonesia', 'malaysia', 'regional', 'asli', 'pop melayu', 'jiwang'],
    trackIds: ['trk_17', 'trk_16', 'trk_15', 'trk_11', 'trk_12', 'trk_23'],
    titleTemplate: 'Nusantara Resonance: Modern & Timeless',
    descTemplate: 'A celebrated collection of Southeast Asian melodies blending catchy pop-yeh-yeh, iconic ballads, and modern harmonies.'
  },
  {
    keywords: ['focus', 'chill', 'lofi', 'relax', 'study', 'ambient', 'rain', 'slow', 'calm', 'sleep', 'unwind'],
    trackIds: ['trk_22', 'trk_06', 'trk_14', 'trk_15', 'trk_02', 'trk_05', 'trk_11', 'trk_23'],
    titleTemplate: 'Subliminal Drift: Muted Frequencies',
    descTemplate: 'Warm downtempo lo-fi beats, gentle analog saturation, and tranquil soundscapes for effortless mental clarity.'
  },
  {
    keywords: ['party', 'dance', 'club', 'edm', 'electronic', 'disco', 'house', 'festival', 'rave', 'summer'],
    trackIds: ['trk_18', 'trk_03', 'trk_04', 'trk_21', 'trk_10', 'trk_20', 'trk_09', 'trk_07'],
    titleTemplate: 'Global Dancefloor: Euphoric Anthems',
    descTemplate: 'Four-on-the-floor kick drums, shimmering nu-disco guitars, and soaring festival synths designed for continuous dance energy.'
  },
  {
    keywords: ['pop', 'chart', 'hits', 'global', 'radio', 'popular', 'taylor', 'bruno', 'dua lipa', 'weeknd'],
    trackIds: ['trk_19', 'trk_04', 'trk_05', 'trk_20', 'trk_01', 'trk_08', 'trk_18', 'trk_07'],
    titleTemplate: 'Global Billboard: High Fidelity Pop',
    descTemplate: 'Multi-platinum modern pop chartbusters with unforgettable melodic hooks and premium production polish.'
  }
];

export const AiPlaylistView: React.FC<AiPlaylistViewProps> = ({ onBack, onPlayTrack }) => {
  const [prompt, setPrompt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<{
    title: string;
    description: string;
    tracks: Track[];
    totalDurationSeconds: number;
    matchTags: string[];
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Intelligent synthesis engine querying Spotify API and matching the prompt accurately
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setIsSaved(false);

    try {
      const lowerPrompt = prompt.toLowerCase().trim();
      const promptWords = lowerPrompt.split(/\s+/).filter((w) => w.length > 2);

      // 1. Query Spotify Web API for genuine, high-precision results matching user prompt/genre
      let spotifyTracks: Track[] = [];
      try {
        const spotifyRes = await searchSpotifyTracks(prompt, 10);
        if (spotifyRes.tracks && spotifyRes.tracks.length > 0) {
          spotifyTracks = spotifyRes.tracks;
        }
      } catch (spErr) {
        console.warn('Spotify search during AI synthesis:', spErr);
      }

      // 2. Score local catalog tracks based on prompt keywords, artist name, title, album, and presets
      const scoredCatalog = DEMO_TRACKS.map((track) => {
        let score = 0;
        const trackText = `${track.title} ${track.artist} ${track.album}`.toLowerCase();

        // Exact artist or title matches get highest priority
        if (lowerPrompt.includes(track.artist.toLowerCase())) score += 20;
        if (lowerPrompt.includes(track.title.toLowerCase())) score += 25;

        // Check word hits
        promptWords.forEach((word) => {
          if (trackText.includes(word)) score += 5;
        });

        // Check preset alignments
        CURATION_PRESETS.forEach((preset) => {
          const matchesPreset = preset.keywords.some((kw) => lowerPrompt.includes(kw));
          if (matchesPreset && preset.trackIds.includes(track.id)) {
            score += 10;
          }
        });

        return { track, score };
      }).sort((a, b) => b.score - a.score);

      // Target track count according to duration (avg track ~3.5 minutes)
      const targetTrackCount = Math.max(
        5,
        Math.min(20, Math.round((durationMinutes * 60) / 210))
      );

      const selectedTracks: Track[] = [];
      const seenTitles = new Set<string>();

      // Prioritize Spotify matched tracks if available
      for (const spTrack of spotifyTracks) {
        const key = spTrack.title.toLowerCase();
        if (!seenTitles.has(key)) {
          // Resolve YouTube Video ID for full playback if available in local catalog
          const localMatch = DEMO_TRACKS.find(
            (t) =>
              t.id === spTrack.id ||
              t.title.toLowerCase() === spTrack.title.toLowerCase() ||
              (spTrack.spotifyTrackId && t.spotifyTrackId === spTrack.spotifyTrackId)
          );
          selectedTracks.push({
            ...spTrack,
            youtubeVideoId: spTrack.youtubeVideoId || localMatch?.youtubeVideoId,
            audioUrl: spTrack.audioUrl || localMatch?.audioUrl || DEMO_TRACKS[0].audioUrl
          });
          seenTitles.add(key);
          if (selectedTracks.length >= targetTrackCount) break;
        }
      }

      // Fill in with scored local catalog tracks
      for (const item of scoredCatalog) {
        const key = item.track.title.toLowerCase();
        if (!seenTitles.has(key)) {
          selectedTracks.push(item.track);
          seenTitles.add(key);
          if (selectedTracks.length >= targetTrackCount) break;
        }
      }

      // Match preset for thematic title and description
      const matchedPreset = CURATION_PRESETS.find((preset) =>
        preset.keywords.some((kw) => lowerPrompt.includes(kw))
      );

      const title = matchedPreset
        ? matchedPreset.titleTemplate
        : `AI Flow: ${prompt.length > 28 ? prompt.slice(0, 26) + '...' : prompt}`;

      const description = matchedPreset
        ? `${matchedPreset.descTemplate} Perfectly paced for a ${durationMinutes}-minute listening session.`
        : `Personalized AI audio journey synthesized for "${prompt}". High-definition streams with verified Spotify artwork for ${durationMinutes} minutes.`;

      const matchTags = matchedPreset
        ? matchedPreset.keywords.slice(0, 4)
        : promptWords.slice(0, 4);

      const totalDurationSeconds = selectedTracks.reduce(
        (acc, t) => acc + (t.durationSeconds || 210),
        0
      );

      setGeneratedPlaylist({
        title,
        description,
        tracks: selectedTracks,
        totalDurationSeconds,
        matchTags,
      });
    } catch (err) {
      console.error('Error generating AI playlist:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTotalTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    return `${mins} min`;
  };

  return (
    <div className="flex flex-col h-full bg-[#07090F] text-[#F7F8FC] overflow-y-auto pb-28">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-[#07090F]/90 backdrop-blur-md z-10 border-b border-[#1F2633]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-[#1A202C] text-[#9EACBA] hover:text-[#F7F8FC] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#F7F8FC] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#00F5FF]" /> AI Playlist Generator
            </h1>
            <p className="text-[11px] text-[#8B5CFF]">Prompt-to-Audio Flow Engine</p>
          </div>
        </div>

        <div className="text-[10px] font-bold bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/40 px-2.5 py-1 rounded-full font-mono flex items-center gap-1">
          <Flame className="w-3 h-3 text-[#00F5FF]" /> UNLIMITED PRO
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isGenerating ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full border-4 border-[#00F5FF]/20 border-t-[#00F5FF] animate-spin shadow-[0_0_25px_rgba(0,245,255,0.3)]" />
            <h2 className="text-base font-bold text-white">Synthesizing Acoustic Flow...</h2>
            <p className="text-xs text-[#9EACBA] max-w-xs leading-relaxed">
              Evaluating musical vibes, tempo curve, and audio sources across genres for &ldquo;{prompt}&rdquo;.
            </p>
          </div>
        ) : generatedPlaylist ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Playlist Result Hero Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#1C1236] via-[#101426] to-[#07090F] border border-[#8B5CFF]/40 space-y-3 relative shadow-[0_0_35px_rgba(139,92,255,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#00F5FF] border border-[#00F5FF]/50 bg-[#00F5FF]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  AI Synthesized Stream
                </span>
                <button
                  onClick={() => setGeneratedPlaylist(null)}
                  className="text-xs text-[#9EACBA] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> New Prompt
                </button>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-xl">
                  <CyberArtwork
                    artworkUrl={generatedPlaylist.tracks[0]?.artworkUrl}
                    title={generatedPlaylist.tracks[0]?.title}
                    artist={generatedPlaylist.tracks[0]?.artist}
                    keyName={generatedPlaylist.tracks[0]?.placeholderArtworkKey}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">{generatedPlaylist.title}</h2>
                  <p className="text-xs text-[#9EACBA] mt-1 leading-relaxed line-clamp-2">
                    {generatedPlaylist.description}
                  </p>
                </div>
              </div>

              {/* Composition and Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#00F5FF]" />
                  {generatedPlaylist.tracks.length} tracks • ~{formatTotalTime(generatedPlaylist.totalDurationSeconds)}
                </span>
                {generatedPlaylist.matchTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-[#8B5CFF]/20 text-[#C4A8FF] border border-[#8B5CFF]/40 px-2 py-0.5 rounded-full font-medium capitalize"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => onPlayTrack(generatedPlaylist.tracks[0])}
                  className="flex-1 py-2.5 rounded-xl bg-[#00F5FF] hover:bg-[#00F5FF]/90 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                >
                  <Play className="w-4 h-4 fill-current" /> Play Full Playlist
                </button>
                <button
                  onClick={() => {
                    const shuffled = [...generatedPlaylist.tracks].sort(() => Math.random() - 0.5);
                    onPlayTrack(shuffled[0]);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#182030] hover:bg-[#222E42] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Shuffle className="w-4 h-4" /> Shuffle
                </button>
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-center transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-[#8B5CFF]/20 text-[#8B5CFF] border-[#8B5CFF]'
                      : 'bg-[#182030] text-white border-[#222E42] hover:bg-[#222E42]'
                  }`}
                  title={isSaved ? 'Saved to Your Library' : 'Save Playlist'}
                >
                  {isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Track List */}
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-bold text-[#9EACBA] uppercase tracking-wider px-1 flex items-center justify-between">
                <span>Curated Sequence ({generatedPlaylist.tracks.length})</span>
                <span className="text-[10px] text-[#00F5FF] lowercase font-mono">click track to stream full audio</span>
              </h3>
              {generatedPlaylist.tracks.map((track, i) => (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="p-2.5 rounded-xl bg-[#0F131D] hover:bg-[#182030] border border-[#1F2633] hover:border-[#00F5FF]/40 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-[#9EACBA] w-4 text-center">{i + 1}</span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                      <CyberArtwork
                        artworkUrl={track.artworkUrl}
                        keyName={track.placeholderArtworkKey}
                        title={track.title}
                        artist={track.artist}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-[#00F5FF] transition-colors">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-[#9EACBA] truncate">
                        {track.artist}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-[#9EACBA]">
                      {Math.floor(track.durationSeconds / 60)}:{(track.durationSeconds % 60).toString().padStart(2, '0')}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-[#00F5FF]/10 group-hover:bg-[#00F5FF] flex items-center justify-center transition-colors">
                      <Play className="w-3.5 h-3.5 text-[#00F5FF] group-hover:text-black fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Input Form */}
            <div className="p-4 rounded-xl bg-[#0F131D] border border-[#1F2633] space-y-3">
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                Describe your desired vibe or sound
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Rainy midnight drive through Tokyo with deep synthwave basslines and calm tempo..."
                rows={3}
                className="w-full p-3 rounded-xl bg-[#07090F] border border-[#222E42] focus:border-[#00F5FF] text-xs text-white placeholder-[#9EACBA]/50 outline-none resize-none leading-relaxed"
              />

              {/* Inspiration Chips */}
              <div>
                <span className="text-[11px] font-semibold text-[#9EACBA] block mb-2">
                  Quick Inspirations & Genres
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {INSPIRATION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setPrompt(chip)}
                      className="px-2.5 py-1 rounded-full bg-[#182030] hover:bg-[#222E42] text-[11px] text-[#9EACBA] hover:text-white border border-[#222E42] hover:border-[#00F5FF]/40 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Duration Selector */}
              <div>
                <span className="text-[11px] font-semibold text-[#9EACBA] block mb-2">
                  Target Session Duration
                </span>
                <div className="flex gap-2">
                  {[15, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDurationMinutes(mins)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        durationMinutes === mins
                          ? 'bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]'
                          : 'bg-[#182030] text-[#9EACBA] border border-transparent hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="w-full py-3 rounded-xl bg-[#00F5FF] disabled:bg-[#1F2633] text-black disabled:text-[#9EACBA] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,245,255,0.25)]"
              >
                <Sparkles className="w-4 h-4" /> Synthesize Custom Playlist
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

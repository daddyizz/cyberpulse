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
import { Track, SonaTheme } from '../types';
import { DEMO_TRACKS } from '../data/mockData';
import { CyberArtwork } from './CyberArtwork';
import { searchSpotifyTracks } from '../services/spotifyService';
import { resolveSpotifyCoverArt } from '../services/spotifyArtworkService';

interface AiPlaylistViewProps {
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  theme?: SonaTheme;
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

export const AiPlaylistView: React.FC<AiPlaylistViewProps> = ({ onBack, onPlayTrack, theme = 'pure_light' }) => {
  const isLight = theme === 'pure_light';
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
    <div className={`flex flex-col h-full overflow-y-auto pb-28 ${
      isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#07090F] text-[#F7F8FC]'
    }`}>
      {/* Top Bar */}
      <div className={`flex items-center justify-between p-4 sticky top-0 backdrop-blur-md z-10 border-b ${
        isLight ? 'bg-white/95 border-slate-200' : 'bg-[#07090F]/90 border-[#1F2633]'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900' : 'hover:bg-[#1A202C] text-[#9EACBA] hover:text-[#F7F8FC]'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-base font-bold flex items-center gap-1.5 ${
              isLight ? 'text-slate-900' : 'text-[#F7F8FC]'
            }`}>
              <Sparkles className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-[#00F5FF]'}`} /> AI Playlist Generator
            </h1>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#8B5CFF]'}`}>Prompt-to-Audio Flow Engine</p>
          </div>
        </div>

        <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full font-mono flex items-center gap-1 ${
          isLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/40'
        }`}>
          <Flame className="w-3 h-3" /> UNLIMITED PRO
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isGenerating ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className={`w-14 h-14 rounded-full border-4 animate-spin ${
              isLight ? 'border-slate-200 border-t-slate-900' : 'border-[#00F5FF]/20 border-t-[#00F5FF]'
            }`} />
            <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Synthesizing Acoustic Flow...</h2>
            <p className={`text-xs max-w-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#9EACBA]'}`}>
              Evaluating musical vibes, tempo curve, and audio sources across genres for &ldquo;{prompt}&rdquo;.
            </p>
          </div>
        ) : generatedPlaylist ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Playlist Result Hero Card */}
            <div className={`p-5 rounded-2xl border space-y-3 relative shadow-sm ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-gradient-to-b from-[#1C1236] via-[#101426] to-[#07090F] border-[#8B5CFF]/40 shadow-[0_0_35px_rgba(139,92,255,0.15)]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                  isLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-[#00F5FF] border border-[#00F5FF]/50 bg-[#00F5FF]/10'
                }`}>
                  AI Synthesized Stream
                </span>
                <button
                  onClick={() => setGeneratedPlaylist(null)}
                  className={`text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                    isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#9EACBA] hover:text-white'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> New Prompt
                </button>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-md">
                  <CyberArtwork
                    artworkUrl={generatedPlaylist.tracks[0]?.artworkUrl}
                    title={generatedPlaylist.tracks[0]?.title}
                    artist={generatedPlaylist.tracks[0]?.artist}
                    keyName={generatedPlaylist.tracks[0]?.placeholderArtworkKey}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className={`text-base sm:text-lg font-bold tracking-wide truncate ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>{generatedPlaylist.title}</h2>
                  <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
                    isLight ? 'text-slate-500' : 'text-[#9EACBA]'
                  }`}>
                    {generatedPlaylist.description}
                  </p>
                </div>
              </div>

              {/* Composition and Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`text-xs font-semibold flex items-center gap-1 ${
                  isLight ? 'text-slate-700' : 'text-white'
                }`}>
                  <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-[#00F5FF]'}`} />
                  {generatedPlaylist.tracks.length} tracks • ~{formatTotalTime(generatedPlaylist.totalDurationSeconds)}
                </span>
                {generatedPlaylist.matchTags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                      isLight
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-[#8B5CFF]/20 text-[#C4A8FF] border border-[#8B5CFF]/40'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => onPlayTrack(generatedPlaylist.tracks[0])}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm ${
                    isLight
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-[#00F5FF] hover:bg-[#00F5FF]/90 text-black shadow-[0_0_15px_rgba(0,245,255,0.3)]'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" /> Play Full Playlist
                </button>
                <button
                  onClick={() => {
                    const shuffled = [...generatedPlaylist.tracks].sort(() => Math.random() - 0.5);
                    onPlayTrack(shuffled[0]);
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                      : 'bg-[#182030] hover:bg-[#222E42] text-white'
                  }`}
                >
                  <Shuffle className="w-4 h-4" /> Shuffle
                </button>
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-center transition-colors cursor-pointer ${
                    isSaved
                      ? isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-[#8B5CFF]/20 text-[#8B5CFF] border-[#8B5CFF]'
                      : isLight ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' : 'bg-[#182030] text-white border-[#222E42] hover:bg-[#222E42]'
                  }`}
                  title={isSaved ? 'Saved to Your Library' : 'Save Playlist'}
                >
                  {isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Track List */}
            <div className="space-y-2 pt-1">
              <h3 className={`text-xs font-bold uppercase tracking-wider px-1 flex items-center justify-between ${
                isLight ? 'text-slate-500' : 'text-[#9EACBA]'
              }`}>
                <span>Curated Sequence ({generatedPlaylist.tracks.length})</span>
                <span className={`text-[10px] lowercase font-mono ${isLight ? 'text-slate-400' : 'text-[#00F5FF]'}`}>click track to stream full audio</span>
              </h3>
              {generatedPlaylist.tracks.map((track, i) => (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all group ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                      : 'bg-[#0F131D] hover:bg-[#182030] border-[#1F2633] hover:border-[#00F5FF]/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-mono w-4 text-center ${isLight ? 'text-slate-400' : 'text-[#9EACBA]'}`}>{i + 1}</span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                      <CyberArtwork
                        artworkUrl={track.artworkUrl}
                        keyName={track.placeholderArtworkKey}
                        title={track.title}
                        artist={track.artist}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate transition-colors ${
                        isLight ? 'text-slate-900 group-hover:text-indigo-600' : 'text-white group-hover:text-[#00F5FF]'
                      }`}>
                        {track.title}
                      </p>
                      <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-[#9EACBA]'}`}>
                        {track.artist}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-[#9EACBA]'}`}>
                      {Math.floor(track.durationSeconds / 60)}:{(track.durationSeconds % 60).toString().padStart(2, '0')}
                    </span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      isLight
                        ? 'bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-700'
                        : 'bg-[#00F5FF]/10 group-hover:bg-[#00F5FF] text-[#00F5FF] group-hover:text-black'
                    }`}>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Input Form */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0F131D] border-[#1F2633]'
            }`}>
              <label className={`text-xs font-bold uppercase tracking-wider block ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Describe your desired vibe or sound
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Rainy midnight drive through Tokyo with deep synthwave basslines and calm tempo..."
                rows={3}
                className={`w-full p-3 rounded-xl border text-xs outline-none resize-none leading-relaxed transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 focus:border-slate-800 text-slate-900 placeholder-slate-400'
                    : 'bg-[#07090F] border-[#222E42] focus:border-[#00F5FF] text-white placeholder-[#9EACBA]/50'
                }`}
              />

              {/* Inspiration Chips */}
              <div>
                <span className={`text-[11px] font-semibold block mb-2 ${
                  isLight ? 'text-slate-500' : 'text-[#9EACBA]'
                }`}>
                  Quick Inspirations & Genres
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {INSPIRATION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setPrompt(chip)}
                      className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          : 'bg-[#182030] hover:bg-[#222E42] text-[#9EACBA] hover:text-white border-[#222E42] hover:border-[#00F5FF]/40'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Duration Selector */}
              <div>
                <span className={`text-[11px] font-semibold block mb-2 ${
                  isLight ? 'text-slate-500' : 'text-[#9EACBA]'
                }`}>
                  Target Session Duration
                </span>
                <div className="flex gap-2">
                  {[15, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDurationMinutes(mins)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        durationMinutes === mins
                          ? isLight
                            ? 'bg-slate-900 text-white'
                            : 'bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]'
                          : isLight
                          ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
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
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-sm ${
                  isLight
                    ? 'bg-slate-900 disabled:bg-slate-200 text-white disabled:text-slate-400 hover:bg-slate-800'
                    : 'bg-[#00F5FF] disabled:bg-[#1F2633] text-black disabled:text-[#9EACBA] shadow-[0_0_20px_rgba(0,245,255,0.25)]'
                }`}
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

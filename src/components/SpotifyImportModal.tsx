import React, { useState } from 'react';
import {
  X,
  Music2,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Clipboard,
  Flame,
} from 'lucide-react';
import { Playlist, SonaTheme, NrcAccentColor } from '../types';
import {
  importSpotifyPlaylist,
  POPULAR_SPOTIFY_PLAYLISTS,
  SpotifyPlaylistPreset,
} from '../services/spotifyService';

interface SpotifyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistImported: (playlist: Playlist) => void;
  theme: SonaTheme;
  nrcAccent?: NrcAccentColor;
}

const FALLBACK_COVER =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" rx="32" fill="#F1F5F9"/><circle cx="160" cy="160" r="76" fill="#E2E8F0"/><path d="M148 105v104a32 32 0 1 1-18-29v-57l83-18v73a32 32 0 1 1-18-29v-66z" fill="#0F172A"/></svg>`);

export const SpotifyImportModal: React.FC<SpotifyImportModalProps> = ({
  isOpen,
  onClose,
  onPlaylistImported,
  theme,
  nrcAccent = 'neon_green',
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewPlaylist, setPreviewPlaylist] = useState<Playlist | null>(null);

  if (!isOpen) return null;

  const isLight = theme === 'pure_light';
  const nrcAccentHex =
    nrcAccent === 'purple_magic' ? '#B026FF' : nrcAccent === 'electric_blue' ? '#00E5FF' : '#CCFF00';

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputUrl(text.trim());
          setErrorMessage(null);
        }
      }
    } catch {
      // Clipboard access is optional.
    }
  };

  const handleFetch = async (overrideInput?: string) => {
    const target = (overrideInput || inputUrl).trim();
    if (!target) {
      setErrorMessage('Please enter a Spotify playlist link or ID.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setPreviewPlaylist(null);
    const result = await importSpotifyPlaylist(target);
    setIsLoading(false);

    if (!result.success || !result.playlist) {
      setErrorMessage(result.error || 'Failed to retrieve playlist details from Spotify.');
      return;
    }
    setPreviewPlaylist(result.playlist);
  };

  const handleSelectPreset = (preset: SpotifyPlaylistPreset) => {
    setInputUrl(`https://open.spotify.com/playlist/${preset.id}`);
    void handleFetch(preset.id);
  };

  const handleConfirmImport = () => {
    if (!previewPlaylist) return;
    onPlaylistImported(previewPlaylist);
    onClose();
  };

  const repairImage = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src !== FALLBACK_COVER) event.currentTarget.src = FALLBACK_COVER;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-16 pb-3 px-3 bg-black/55 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`sona-spotify-import-modal relative w-full max-w-lg rounded-3xl p-5 border shadow-2xl overflow-hidden flex flex-col transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/40'
            : 'bg-[#0E0E10] border-[#26262B] text-white shadow-black'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${isLight ? 'bg-slate-100 text-slate-900' : 'text-black'}`}
              style={!isLight ? { backgroundColor: nrcAccentHex, color: nrcAccent === 'purple_magic' ? '#FFFFFF' : '#000000' } : undefined}
            >
              <Music2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black uppercase tracking-tight truncate">Import Spotify Playlist</h2>
              <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
                Paste a URL or choose a popular playlist suggestion
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-[#1C1C20] text-[#8E8E93] hover:text-white'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          <div className="space-y-1.5">
            <label className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-[#8E8E93]'}`}>Playlist Link or ID</label>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all ${isLight ? 'bg-slate-50 border-slate-200 focus-within:border-slate-900' : 'bg-[#141416] border-[#26262B] focus-within:border-white/40'}`}>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => { setInputUrl(e.target.value); setErrorMessage(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleFetch(); }}
                placeholder="https://open.spotify.com/playlist/... or playlist ID"
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400 min-w-0"
              />
              {inputUrl && (
                <button type="button" onClick={() => { setInputUrl(''); setPreviewPlaylist(null); }} className="text-slate-400 hover:text-slate-600 text-xs px-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button type="button" onClick={handlePasteClipboard} className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer ${isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-[#1C1C20] text-[#8E8E93] hover:text-white'}`} title="Paste from clipboard">
                <Clipboard className="w-3 h-3" /><span>Paste</span>
              </button>
            </div>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
              Example: <code className="font-mono">https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M</code>
            </p>
          </div>

          <button
            type="button"
            disabled={isLoading || !inputUrl.trim()}
            onClick={() => handleFetch()}
            className={`w-full py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isLoading || !inputUrl.trim()
                ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-500'
                : isLight
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'text-black font-black'
            }`}
            style={!isLight && !isLoading && inputUrl.trim() ? { backgroundColor: nrcAccentHex, color: nrcAccent === 'purple_magic' ? '#FFFFFF' : '#000000' } : undefined}
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Fetching from Spotify...</span></> : <><Sparkles className="w-4 h-4" /><span>Fetch Playlist Preview</span></>}
          </button>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMessage}</span>
            </div>
          )}

          {previewPlaylist && (
            <div className={`p-3.5 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141416] border-[#26262B]'}`}>
              <div className="flex items-center gap-3">
                <img
                  src={previewPlaylist.artworkUrl || FALLBACK_COVER}
                  onError={repairImage}
                  alt={previewPlaylist.title}
                  className="w-16 h-16 rounded-xl object-cover border border-inherit shadow-md shrink-0 bg-slate-100"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-transparent'}`} style={!isLight ? { backgroundColor: nrcAccentHex, color: nrcAccent === 'purple_magic' ? '#FFFFFF' : '#000000' } : undefined}>
                      Spotify Verified
                    </span>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>{previewPlaylist.trackCount} tracks</span>
                  </div>
                  <h3 className="text-xs font-black truncate">{previewPlaylist.title}</h3>
                  <p className={`text-[11px] truncate ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>{previewPlaylist.createdBy}</p>
                </div>
              </div>

              {previewPlaylist.tracks && previewPlaylist.tracks.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>Track Listing ({previewPlaylist.tracks.length}):</div>
                  {previewPlaylist.tracks.slice(0, 6).map((t, idx) => (
                    <div key={t.id} className={`flex items-center justify-between p-1.5 rounded-lg text-xs ${isLight ? 'hover:bg-white' : 'hover:bg-[#1C1C20]'}`}>
                      <div className="flex items-center gap-2 truncate">
                        <span className={`text-[10px] font-mono w-4 text-center ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>{idx + 1}</span>
                        <div className="truncate">
                          <span className="font-bold">{t.title}</span>
                          <span className={`text-[10px] ml-1.5 ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>• {t.artist}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono shrink-0 ml-2 ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>{Math.floor(t.durationSeconds / 60)}:{String(t.durationSeconds % 60).padStart(2, '0')}</span>
                    </div>
                  ))}
                  {previewPlaylist.tracks.length > 6 && <div className={`text-center text-[10px] pt-1 ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>+ {previewPlaylist.tracks.length - 6} more tracks</div>}
                </div>
              )}

              <button type="button" onClick={handleConfirmImport} className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-black font-black'}`} style={!isLight ? { backgroundColor: nrcAccentHex, color: nrcAccent === 'purple_magic' ? '#FFFFFF' : '#000000' } : undefined}>
                <Check className="w-4 h-4" /><span>Save Playlist to Library</span>
              </button>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-[#8E8E93]'}`}>
                <Flame className="w-3.5 h-3.5 text-amber-500" /><span>Popular Spotify Playlists (1-Tap)</span>
              </span>
              <span className={`text-[9px] shrink-0 ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>Tap to import instantly</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POPULAR_SPOTIFY_PLAYLISTS.map((preset) => (
                <button key={preset.id} type="button" onClick={() => handleSelectPreset(preset)} className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-[#141416] hover:bg-[#1C1C20] border-[#26262B]'}`}>
                  <img src={preset.artworkUrl || FALLBACK_COVER} onError={repairImage} alt={preset.title} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-inherit bg-slate-100" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <span className={`text-[9px] font-mono uppercase font-bold ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>{preset.category}</span>
                    <div className="text-xs font-bold truncate">{preset.title}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

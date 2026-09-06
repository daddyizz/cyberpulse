// CyberPulse In-App Web Audio Engine
// Provides reliable HTML5 audio stream playback with a zero-latency Web Audio API Cyber Synth fallback
// Full MediaSession API integration for background playback, lock-screen controls, and notification tray

export interface MediaSessionTrackInfo {
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
  durationSeconds?: number;
}

export interface MediaSessionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  onSeek?: (seconds: number) => void;
}

class CyberAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isSynthPlaying: boolean = false;
  private synthIntervalId: number | null = null;
  private masterGain: GainNode | null = null;
  private tempo: number = 115; // Synthwave BPM
  private currentStep: number = 0;
  private currentTrackInfo: MediaSessionTrackInfo | null = null;
  private handlers: MediaSessionHandlers = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.preload = 'auto';

      // Keep audio playing even when tab/page is hidden or minimized
      document.addEventListener('visibilitychange', () => {
        // We explicitly do NOT pause audio when document.hidden is true!
        // This ensures background playback when minimized or switched to another tab.
        if (this.audio && !this.audio.paused) {
          this.updateMediaSessionState('playing');
        }
      });
    }
  }

  public setMediaSessionHandlers(handlers: MediaSessionHandlers) {
    this.handlers = handlers;
    this.registerMediaSessionActions();
  }

  private registerMediaSessionActions() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (this.handlers.onPlay) {
          this.handlers.onPlay();
        } else {
          this.resume();
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (this.handlers.onPause) {
          this.handlers.onPause();
        } else {
          this.pause();
        }
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (this.handlers.onPrevTrack) {
          this.handlers.onPrevTrack();
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (this.handlers.onNextTrack) {
          this.handlers.onNextTrack();
        }
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && Number.isFinite(details.seekTime)) {
          this.seek(details.seekTime);
          if (this.handlers.onSeek) {
            this.handlers.onSeek(details.seekTime);
          }
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        const current = this.audio ? this.audio.currentTime : 0;
        const target = Math.max(0, current - offset);
        this.seek(target);
        if (this.handlers.onSeek) {
          this.handlers.onSeek(target);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        const current = this.audio ? this.audio.currentTime : 0;
        const target = current + offset;
        this.seek(target);
        if (this.handlers.onSeek) {
          this.handlers.onSeek(target);
        }
      });
    } catch (e) {
      console.warn('Could not register MediaSession action handlers:', e);
    }
  }

  private updateMediaSessionMetadata(track: MediaSessionTrackInfo) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      const artworkItems = track.artworkUrl
        ? [
            { src: track.artworkUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: track.artworkUrl, sizes: '128x128', type: 'image/jpeg' },
            { src: track.artworkUrl, sizes: '192x192', type: 'image/jpeg' },
            { src: track.artworkUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: track.artworkUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'CyberPulse Music',
        artwork: artworkItems,
      });
    } catch (e) {
      console.warn('Could not update MediaSession metadata:', e);
    }
  }

  private updateMediaSessionState(state: 'playing' | 'paused' | 'none') {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch (_) {}
  }

  private updateMediaSessionPositionState(duration?: number, position?: number) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if (!('setPositionState' in navigator.mediaSession)) return;

    try {
      const dur = duration || (this.audio ? this.audio.duration : 0);
      const pos = position || (this.audio ? this.audio.currentTime : 0);
      if (Number.isFinite(dur) && dur > 0 && Number.isFinite(pos)) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(dur, pos),
          playbackRate: 1.0,
          position: Math.min(pos, dur),
        });
      }
    } catch (_) {}
  }

  private initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public play(
    url: string,
    trackInfo: MediaSessionTrackInfo | string,
    onTimeUpdate?: (seconds: number) => void,
    onEnded?: () => void
  ): Promise<void> {
    const info: MediaSessionTrackInfo = typeof trackInfo === 'string'
      ? { title: trackInfo, artist: 'CyberPulse Artist' }
      : trackInfo;

    this.currentTrackInfo = info;
    this.updateMediaSessionMetadata(info);
    this.updateMediaSessionState('playing');

    // Stop synth if it was running
    this.stopSynth();

    if (!this.audio) {
      this.startSynth();
      return Promise.resolve();
    }

    // Set up listeners
    this.audio.ontimeupdate = () => {
      if (this.audio) {
        const secs = Math.floor(this.audio.currentTime);
        if (onTimeUpdate) {
          onTimeUpdate(secs);
        }
        if (secs % 3 === 0) {
          this.updateMediaSessionPositionState(info.durationSeconds, this.audio.currentTime);
        }
      }
    };

    this.audio.onended = () => {
      this.updateMediaSessionState('paused');
      if (onEnded) onEnded();
    };

    // If source error occurs, log warning without forcing repetitive synthesizer loop
    this.audio.onerror = (e) => {
      console.warn(`HTML5 Audio element reported an error for ${url}:`, e);
    };

    if (this.audio.src !== url) {
      this.audio.src = url;
      this.audio.load();
    }

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      return playPromise
        .then(() => {
          this.updateMediaSessionState('playing');
          this.updateMediaSessionPositionState(info.durationSeconds);
        })
        .catch((err) => {
          console.warn('Audio play request failed or interrupted:', err);
        });
    }

    return Promise.resolve();
  }

  public resume(): Promise<void> {
    this.updateMediaSessionState('playing');
    if (this.audio && this.audio.paused && this.audio.src) {
      return this.audio.play().catch((err) => {
        console.warn('Audio resume failed:', err);
      });
    }
    return Promise.resolve();
  }

  public pause() {
    this.updateMediaSessionState('paused');
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
    this.stopSynth();
  }

  public seek(seconds: number) {
    if (this.audio && Number.isFinite(seconds)) {
      try {
        this.audio.currentTime = seconds;
        this.updateMediaSessionPositionState(this.currentTrackInfo?.durationSeconds, seconds);
      } catch (_) {}
    }
  }

  public isUsingSynth(): boolean {
    return this.isSynthPlaying;
  }

  // Built-in Web Audio API Cyber Synth Arpeggiator (100% resilient, no external network needed)
  public startSynth() {
    if (this.isSynthPlaying) return;
    this.initAudioContext();
    if (!this.audioCtx || !this.masterGain) return;

    this.isSynthPlaying = true;
    this.currentStep = 0;

    // D minor synthwave chord progression arpeggio notes (frequencies in Hz)
    const scale = [
      146.83, // D3
      174.61, // F3
      220.00, // A3
      261.63, // C4
      293.66, // D4
      349.23, // F4
      440.00, // A4
      523.25, // C5
    ];

    const stepDurationMs = (60 / this.tempo / 4) * 1000; // 16th note

    this.synthIntervalId = window.setInterval(() => {
      if (!this.audioCtx || !this.masterGain) return;

      const now = this.audioCtx.currentTime;
      const noteIdx = [0, 2, 4, 7, 5, 3, 2, 4, 1, 3, 5, 6, 4, 2, 1, 0][this.currentStep % 16];
      const freq = scale[noteIdx % scale.length];

      // Synth Arp Note
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400 + Math.sin(this.currentStep * 0.4) * 800, now);
      filter.Q.setValueAtTime(4, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.2);

      // Cyber Kick on beats 0, 4, 8, 12
      if (this.currentStep % 4 === 0) {
        const kickOsc = this.audioCtx.createOscillator();
        const kickGain = this.audioCtx.createGain();

        kickOsc.frequency.setValueAtTime(130, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

        kickGain.gain.setValueAtTime(0.35, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        kickOsc.connect(kickGain);
        kickGain.connect(this.masterGain);

        kickOsc.start(now);
        kickOsc.stop(now + 0.16);
      }

      // Snare / Hi-hat on beats 2, 6, 10, 14
      if (this.currentStep % 2 === 1) {
        const hatOsc = this.audioCtx.createOscillator();
        const hatGain = this.audioCtx.createGain();
        hatOsc.type = 'square';
        hatOsc.frequency.setValueAtTime(3000 + Math.random() * 2000, now);

        hatGain.gain.setValueAtTime(0.04, now);
        hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        hatOsc.connect(hatGain);
        hatGain.connect(this.masterGain);

        hatOsc.start(now);
        hatOsc.stop(now + 0.06);
      }

      this.currentStep++;
    }, stepDurationMs);
  }

  public stopSynth() {
    this.isSynthPlaying = false;
    if (this.synthIntervalId !== null) {
      clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }
  }

  public cleanup() {
    this.pause();
    if (this.audio) {
      this.audio.src = '';
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
  }
}

export const cyberAudio = new CyberAudioEngine();

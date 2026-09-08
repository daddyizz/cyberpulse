import React, { useEffect, useRef } from 'react';
import { LyricLine, Track } from '../types';
import { Play, Pause, X, Music, CheckCircle2, ChevronRight, Sliders } from 'lucide-react';

interface LyricsPreviewProps {
  track: Track;
  currentSeconds: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  onTogglePlayPause: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

const TRACK_LYRICS_MAP: Record<string, LyricLine[]> = {
  trk_01: [
    { timeMs: 0, text: "♪ [80s analog synthesizer intro] ♪" },
    { timeMs: 5000, text: "Yeah..." },
    { timeMs: 14000, text: "I've been tryna call" },
    { timeMs: 19000, text: "I've been on my own for long enough" },
    { timeMs: 25000, text: "Maybe you can show me how to love, maybe" },
    { timeMs: 33000, text: "I'm going through withdrawals" },
    { timeMs: 38000, text: "You don't even have to do too much" },
    { timeMs: 43000, text: "You can turn me on with just a touch, baby" },
    { timeMs: 52000, text: "I look around and Sin City's cold and empty" },
    { timeMs: 59000, text: "No one's around to judge me" },
    { timeMs: 65000, text: "I can't see clearly when you're gone" },
    { timeMs: 73000, text: "I said, ooh, I'm blinded by the lights" },
    { timeMs: 82000, text: "No, I can't sleep until I feel your touch" },
    { timeMs: 91000, text: "I said, ooh, I'm drowning in the night" },
    { timeMs: 100000, text: "Oh, when I'm like this, you're the one I trust" },
    { timeMs: 110000, text: "♪ [Driving pulse bassline & synthesizer solo] ♪" },
    { timeMs: 130000, text: "I'm running out of time" },
    { timeMs: 135000, text: "'Cause I can see the sun light up the sky" },
    { timeMs: 142000, text: "So I hit the road in overdrive, baby" },
    { timeMs: 151000, text: "I said, ooh, I'm blinded by the lights!" }
  ],
  trk_02: [
    { timeMs: 0, text: "♪ [Darksynth vocoder pulse] ♪" },
    { timeMs: 15000, text: "I'm giving you a nightcall to tell you how I feel" },
    { timeMs: 32000, text: "I want to drive you through the night, down the hills" },
    { timeMs: 48000, text: "I'm gonna tell you something you don't want to hear" },
    { timeMs: 64000, text: "I'm gonna show you where it's dark, but have no fear" },
    { timeMs: 80000, text: "There's something inside you, it's hard to explain" },
    { timeMs: 96000, text: "They're talking about you boy, but you're still the same" },
    { timeMs: 112000, text: "There's something inside you, it's hard to explain" },
    { timeMs: 128000, text: "♪ [Heavy distorted analog bass overdrive] ♪" }
  ],
  trk_03: [
    { timeMs: 0, text: "♪ [Chic funky guitar riff intro] ♪" },
    { timeMs: 12000, text: "Like the legend of the phoenix" },
    { timeMs: 16000, text: "All ends with beginnings" },
    { timeMs: 20000, text: "What keeps the planet spinning" },
    { timeMs: 24000, text: "The force from the beginning" },
    { timeMs: 30000, text: "We've come too far to give up who we are" },
    { timeMs: 37000, text: "So let's raise the bar and our cups to the stars" },
    { timeMs: 45000, text: "She's up all night 'til the sun" },
    { timeMs: 49000, text: "I'm up all night to get some" },
    { timeMs: 53000, text: "She's up all night for good fun" },
    { timeMs: 57000, text: "I'm up all night to get lucky!" },
    { timeMs: 65000, text: "We're up all night to get lucky" },
    { timeMs: 80000, text: "♪ [Robotic vocoder harmony] ♪" }
  ],
  trk_04: [
    { timeMs: 0, text: "♪ [Cosmic disco bass groove] ♪" },
    { timeMs: 8000, text: "If you wanna run away with me, I know a galaxy" },
    { timeMs: 15000, text: "And I can take you for a ride" },
    { timeMs: 22000, text: "I had a premonition that we fell into a rhythm" },
    { timeMs: 29000, text: "Where the music don't stop for life" },
    { timeMs: 37000, text: "Glitter in the sky, glitter in my eyes" },
    { timeMs: 44000, text: "Shining just the way I like" },
    { timeMs: 51000, text: "You want me, I want you, baby" },
    { timeMs: 55000, text: "My sugarboo, I'm levitating!" },
    { timeMs: 62000, text: "The Milky Way, we're renegading" },
    { timeMs: 70000, text: "Yeah, yeah, yeah, yeah, yeah!" }
  ],
  trk_05: [
    { timeMs: 0, text: "♪ [Melodic finger-snap & 808s] ♪" },
    { timeMs: 7000, text: "Needless to say, I keep her in check" },
    { timeMs: 12000, text: "She was all bad-bad, nevertheless" },
    { timeMs: 17000, text: "Calling it quits now, baby, I'm a wreck" },
    { timeMs: 22000, text: "Crash at my place, baby, you're a wreck" },
    { timeMs: 27000, text: "Then you're left in the dust, unless I stuck by ya" },
    { timeMs: 32000, text: "You're the sunflower, I think your love would be too much" },
    { timeMs: 40000, text: "Or you'll be left in the dust, unless I stuck by ya" },
    { timeMs: 46000, text: "You're the sunflower, you're the sunflower!" }
  ],
  trk_07: [
    { timeMs: 0, text: "♪ [Thunderous acoustic stomps & claps] ♪" },
    { timeMs: 8000, text: "First things first, I'ma say all the words inside my head" },
    { timeMs: 16000, text: "I'm fired up and tired of the way that things have been, oh-ooh" },
    { timeMs: 24000, text: "Second thing second, don't you tell me what you think that I could be" },
    { timeMs: 32000, text: "I'm the one at the sail, I'm the master of my sea, oh-ooh" },
    { timeMs: 40000, text: "Pain! You made me a, you made me a believer, believer!" },
    { timeMs: 48000, text: "Pain! You break me down and build me up, believer, believer!" }
  ],
  trk_08: [
    { timeMs: 0, text: "♪ [Electro 808 beat & synth claps] ♪" },
    { timeMs: 10000, text: "I'm tryna put you in the worst mood, ah" },
    { timeMs: 15000, text: "P1 cleaner than your church shoes, ah" },
    { timeMs: 20000, text: "Milli point two just to hurt you, ah" },
    { timeMs: 25000, text: "All red Lamb' just to tease you, ah" },
    { timeMs: 31000, text: "Look what you've done! I'm a motherf***in' starboy" },
    { timeMs: 42000, text: "Look what you've done! I'm a motherf***in' starboy" }
  ],
  trk_09: [
    { timeMs: 0, text: "♪ [Subtle haunting piano chords intro] ♪" },
    { timeMs: 12000, text: "You were the shadow to my light, did you feel us?" },
    { timeMs: 21000, text: "Another start, you fade away" },
    { timeMs: 29000, text: "Afraid our aim is out of sight, wanna see us alight" },
    { timeMs: 41000, text: "Where are you now? Where are you now?" },
    { timeMs: 52000, text: "Was it all in my fantasy? Where are you now?" },
    { timeMs: 64000, text: "Were you only imaginary?" },
    { timeMs: 75000, text: "Where are you now? Atlantis, under the sea" },
    { timeMs: 87000, text: "I'm faded, I'm faded... so lost, I'm faded!" }
  ],
  trk_10: [
    { timeMs: 0, text: "♪ [Cyberpunk trap beat & bass drop] ♪" },
    { timeMs: 8000, text: "You know who it is, coming 'round again" },
    { timeMs: 15000, text: "Want a bit of this, boy, you're looking at the best" },
    { timeMs: 23000, text: "Ain't nobody bringing us down, down, down, down" },
    { timeMs: 31000, text: "We go hard till the gas runs out, ooh!" },
    { timeMs: 39000, text: "Ain't nobody bringing us down, down, down, down" },
    { timeMs: 48000, text: "So get ready for the show, POP/STARS!" }
  ],
  trk_11: [
    { timeMs: 0, text: "♪ [Gitar melodi nostalgia 90s intro] ♪" },
    { timeMs: 10000, text: "Dan bila esok datang kembali" },
    { timeMs: 17000, text: "Seperti sedia kala di mana kau bisa bercanda" },
    { timeMs: 26000, text: "Dan perlahan kaupun lupakan aku" },
    { timeMs: 33000, text: "Mendekat, mendekatlah kepadanya" },
    { timeMs: 41000, text: "Dan bila hatimu termangu sepi" },
    { timeMs: 50000, text: "Jangan pernah kau ragu untuk melangkah..." },
    { timeMs: 60000, text: "Lupakanlah saja diriku, bila itu membuatmu bahagia" }
  ],
  trk_12: [
    { timeMs: 0, text: "♪ [Orkestra piano akustik intro] ♪" },
    { timeMs: 12000, text: "Mengapa harus kita yang bertemu" },
    { timeMs: 22000, text: "Jika takdir memisahkan kita" },
    { timeMs: 34000, text: "Kasih yang terlarang namun membara" },
    { timeMs: 46000, text: "Di dalam jiwa yang setia..." },
    { timeMs: 58000, text: "Biar beribu halangan merintangi" },
    { timeMs: 70000, text: "Cinta ini takkan pernah padam..." }
  ],
  trk_14: [
    { timeMs: 0, text: "♪ [Sunset saxophone & retro synth pads] ♪" },
    { timeMs: 14000, text: "Driving through the neon twilight" },
    { timeMs: 25000, text: "The summer sun is fading into the ocean" },
    { timeMs: 38000, text: "Remember the days of thunder" },
    { timeMs: 50000, text: "When we were young and electric" },
    { timeMs: 65000, text: "We were kings of the midnight coast..." }
  ],
  trk_15: [
    { timeMs: 0, text: "♪ [Petikan gitar akustik intro] ♪" },
    { timeMs: 14000, text: "Di suatu hari tanpa sengaja kita bertemu" },
    { timeMs: 25000, text: "Aku yang pernah terluka kembali mengenal cinta" },
    { timeMs: 38000, text: "Hati ini kembali merasa tenang..." },
    { timeMs: 50000, text: "Oh Tuhan, kucinta dia" },
    { timeMs: 57000, text: "Kusayang dia, rindu dia, inginkan dia" },
    { timeMs: 68000, text: "Utuhkanlah rasa cinta di hatiku" },
    { timeMs: 78000, text: "Hanya padanya, untuk dia..." },
    { timeMs: 92000, text: "♪ [Melodi string dan piano lembut] ♪" },
    { timeMs: 110000, text: "Kusayang dia, rindu dia, inginkan dia..." },
    { timeMs: 125000, text: "Hanya padanya, untuk dia..." }
  ],
  trk_16: [
    { timeMs: 0, text: "♪ [Irama zapin melayu dan tiupan serunai tradisional] ♪" },
    { timeMs: 15000, text: "Cindailah mana tidak berkias" },
    { timeMs: 24000, text: "Jalinnya lalu rentah berliku" },
    { timeMs: 32000, text: "Bagaikan nyawa tinggal secebis" },
    { timeMs: 41000, text: "Menanti kasih datang menyapa..." },
    { timeMs: 52000, text: "Biar patah sayap di dada" },
    { timeMs: 62000, text: "Namun jiwa tetap perkasa..." }
  ],
  trk_17: [
    { timeMs: 0, text: "♪ [Irama 60-an pop yeh-yeh retro drum & bass] ♪" },
    { timeMs: 10000, text: "Apa khabar dinda? Lama tak berjumpa" },
    { timeMs: 18000, text: "Rasanya baru semalam kita bersama" },
    { timeMs: 28000, text: "Dinda jangan marah-marah, takut nanti lekas tua" },
    { timeMs: 38000, text: "Kanda setia orangnya, takkan pernah mendua" },
    { timeMs: 48000, text: "Dinda dengarkanlah lagu ini..." }
  ]
};

function getLyricsForTrack(track: Track): LyricLine[] {
  if (TRACK_LYRICS_MAP[track.id]) {
    return TRACK_LYRICS_MAP[track.id];
  }
  // Dynamic synchronized lyrics generator based on song title & artist
  const baseTitle = track.title || 'Music Stream';
  const artistName = track.artist || 'Sona Audio';
  return [
    { timeMs: 0, text: `♪ [Instrumental Intro: ${baseTitle}] ♪` },
    { timeMs: 8000, text: `Vocal harmonies by ${artistName}...` },
    { timeMs: 20000, text: `Atmospheric acoustic rhythms flow with ${baseTitle}` },
    { timeMs: 35000, text: `Every verse pulses with emotional clarity` },
    { timeMs: 50000, text: `Immerse in dynamic stereo: ${baseTitle} - ${artistName}` },
    { timeMs: 70000, text: `♪ [Instrumental Solo & Peak Harmonic Build] ♪` },
    { timeMs: 90000, text: `Lossless high-definition soundstage resonance` },
    { timeMs: 110000, text: `Melodic chorus echoes through the soundscape` },
    { timeMs: 135000, text: `♪ [Harmonic Outro: ${baseTitle}] ♪` }
  ];
}

export function LyricsPreview({
  track,
  currentSeconds,
  isPlaying,
  onSeek,
  onTogglePlayPause,
  onClose,
  isModal = false
}: LyricsPreviewProps) {
  const lyrics = getLyricsForTrack(track);
  const currentMs = currentSeconds * 1000;
  const activeIndex = lyrics.reduce((acc, line, idx) => {
    return line.timeMs <= currentMs ? idx : acc;
  }, -1);

  const activeLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  const content = (
    <div className={`flex flex-col ${isModal ? 'h-full' : 'max-h-[280px]'} w-full`}>
      {/* Status Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#171B28] text-xs text-[#9CA3B7]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00F5FF] animate-pulse" />
          <span className="font-mono text-[11px] text-[#00F5FF]">Synced LRC (Local/Licensed)</span>
        </div>
        <span className="text-[10px] bg-[#10131C] px-2 py-0.5 rounded-full border border-[#171B28]">
          Tap line to seek
        </span>
      </div>

      {/* Lyrics Scrollable Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
        {lyrics.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isPassed = idx < activeIndex;

          return (
            <div
              key={idx}
              ref={isActive ? activeLineRef : null}
              onClick={() => onSeek(line.timeMs / 1000)}
              className={`p-2 rounded-xl transition-all cursor-pointer select-none text-center ${
                isActive
                  ? 'text-[#00F5FF] font-black text-lg bg-[#00F5FF]/10 scale-105 shadow-sm'
                  : isPassed
                  ? 'text-[#9CA3B7]/50 text-sm font-medium hover:text-[#F7F8FC]'
                  : 'text-[#9CA3B7] text-sm font-medium hover:text-[#F7F8FC]'
              }`}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!isModal) {
    return (
      <div className="w-full max-w-[280px] h-[280px] rounded-3xl overflow-hidden border-2 border-[#00F5FF]/40 bg-[#07090F]/95 p-4 shadow-[0_0_40px_rgba(0,245,255,0.25)]">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#07090F]/95 backdrop-blur-2xl flex flex-col p-6 animate-in fade-in duration-200">
      {/* Modal Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-[#171B28]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10131C] border border-[#171B28] flex items-center justify-center text-[#00F5FF]">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase text-[#F7F8FC] truncate max-w-[200px]">
              {track.title}
            </h3>
            <p className="text-xs font-bold text-[#00F5FF] uppercase tracking-wider">
              {track.artist}
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 text-[#9CA3B7] hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 py-4 flex flex-col overflow-hidden">
        {content}
      </div>

      {/* Mini Controls at Bottom of Lyrics Screen */}
      <div className="pt-4 border-t border-[#171B28] flex items-center justify-between">
        <div className="text-xs font-mono text-[#9CA3B7]">
          {Math.floor(currentSeconds / 60)}:{String(Math.floor(currentSeconds % 60)).padStart(2, '0')}
        </div>
        <button
          onClick={onTogglePlayPause}
          className="w-12 h-12 rounded-full bg-[#00F5FF] flex items-center justify-center text-[#07090F] shadow-lg shadow-[#00F5FF]/30 hover:scale-105 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>
        <div className="text-xs font-mono text-[#9CA3B7]">
          {Math.floor(track.durationSeconds / 60)}:{String(Math.floor(track.durationSeconds % 60)).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}

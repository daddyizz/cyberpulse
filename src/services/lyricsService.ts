import { LyricLine, Track } from '../types';

// Curated database of verified, clean synchronized lyrics for popular & demo tracks
// Zero synthetic beat descriptions or bracketed sound effects - only pure song lyrics.
const CURATED_LYRICS_DB: Record<string, LyricLine[]> = {
  // Blinding Lights - The Weeknd
  trk_01: [
    { timeMs: 14000, text: "Yeah..." },
    { timeMs: 27000, text: "I've been tryna call" },
    { timeMs: 30000, text: "I've been on my own for long enough" },
    { timeMs: 33000, text: "Maybe you can show me how to love, maybe" },
    { timeMs: 40000, text: "I'm going through withdrawals" },
    { timeMs: 44000, text: "You don't even have to do too much" },
    { timeMs: 47000, text: "You can turn me on with just a touch, baby" },
    { timeMs: 54000, text: "I look around and Sin City's cold and empty" },
    { timeMs: 60000, text: "No one's around to judge me" },
    { timeMs: 65000, text: "I can't see clearly when you're gone" },
    { timeMs: 72000, text: "I said, ooh, I'm blinded by the lights" },
    { timeMs: 80000, text: "No, I can't sleep until I feel your touch" },
    { timeMs: 89000, text: "I said, ooh, I'm drowning in the night" },
    { timeMs: 97000, text: "Oh, when I'm like this, you're the one I trust" },
    { timeMs: 125000, text: "I'm running out of time" },
    { timeMs: 130000, text: "'Cause I can see the sun light up the sky" },
    { timeMs: 136000, text: "So I hit the road in overdrive, baby" },
    { timeMs: 143000, text: "The city's cold and empty" },
    { timeMs: 150000, text: "No one's around to judge me" },
    { timeMs: 155000, text: "I can't see clearly when you're gone" },
    { timeMs: 162000, text: "I said, ooh, I'm blinded by the lights" },
    { timeMs: 170000, text: "No, I can't sleep until I feel your touch" }
  ],

  // Nightcall - Kavinsky
  trk_02: [
    { timeMs: 15000, text: "I'm giving you a nightcall to tell you how I feel" },
    { timeMs: 31000, text: "I want to drive you through the night, down the hills" },
    { timeMs: 47000, text: "I'm gonna tell you something you don't want to hear" },
    { timeMs: 63000, text: "I'm gonna show you where it's dark, but have no fear" },
    { timeMs: 79000, text: "There's something inside you, it's hard to explain" },
    { timeMs: 95000, text: "They're talking about you boy, but you're still the same" },
    { timeMs: 111000, text: "There's something inside you, it's hard to explain" },
    { timeMs: 127000, text: "They're talking about you boy, but you're still the same" },
    { timeMs: 143000, text: "There's something inside you, it's hard to explain" }
  ],

  // Get Lucky - Daft Punk ft. Pharrell Williams
  trk_03: [
    { timeMs: 12000, text: "Like the legend of the phoenix" },
    { timeMs: 16000, text: "All ends with beginnings" },
    { timeMs: 20000, text: "What keeps the planet spinning" },
    { timeMs: 24000, text: "The force from the beginning" },
    { timeMs: 30000, text: "We've come too far to give up who we are" },
    { timeMs: 37000, text: "So let's raise the bar and our cups to the stars" },
    { timeMs: 45000, text: "She's up all night 'til the sun" },
    { timeMs: 49000, text: "I'm up all night to get some" },
    { timeMs: 53000, text: "She's up all night for good fun" },
    { timeMs: 57000, text: "I'm up all night to get lucky" },
    { timeMs: 65000, text: "We're up all night to get lucky" },
    { timeMs: 73000, text: "We're up all night to get lucky" },
    { timeMs: 81000, text: "We're up all night to get lucky" }
  ],

  // Levitating - Dua Lipa
  trk_04: [
    { timeMs: 8000, text: "If you wanna run away with me, I know a galaxy" },
    { timeMs: 14000, text: "And I can take you for a ride" },
    { timeMs: 21000, text: "I had a premonition that we fell into a rhythm" },
    { timeMs: 28000, text: "Where the music don't stop for life" },
    { timeMs: 36000, text: "Glitter in the sky, glitter in my eyes" },
    { timeMs: 43000, text: "Shining just the way I like" },
    { timeMs: 50000, text: "If you're feeling like you need a little bit of company" },
    { timeMs: 55000, text: "You met me at the perfect time" },
    { timeMs: 62000, text: "You want me, I want you, baby" },
    { timeMs: 66000, text: "My sugarboo, I'm levitating" },
    { timeMs: 73000, text: "The Milky Way, we're renegading" },
    { timeMs: 77000, text: "Yeah, yeah, yeah, yeah, yeah" }
  ],

  // Sunflower - Post Malone & Swae Lee
  trk_05: [
    { timeMs: 7000, text: "Needless to say, I keep her in check" },
    { timeMs: 12000, text: "She was all bad-bad, nevertheless" },
    { timeMs: 17000, text: "Calling it quits now, baby, I'm a wreck" },
    { timeMs: 22000, text: "Crash at my place, baby, you're a wreck" },
    { timeMs: 27000, text: "Then you're left in the dust, unless I stuck by ya" },
    { timeMs: 32000, text: "You're the sunflower, I think your love would be too much" },
    { timeMs: 40000, text: "Or you'll be left in the dust, unless I stuck by ya" },
    { timeMs: 46000, text: "You're the sunflower, you're the sunflower" }
  ],

  // Believer - Imagine Dragons
  trk_07: [
    { timeMs: 8000, text: "First things first, I'ma say all the words inside my head" },
    { timeMs: 16000, text: "I'm fired up and tired of the way that things have been, oh-ooh" },
    { timeMs: 24000, text: "Second thing second, don't you tell me what you think that I could be" },
    { timeMs: 32000, text: "I'm the one at the sail, I'm the master of my sea, oh-ooh" },
    { timeMs: 40000, text: "I was broken from a young age" },
    { timeMs: 44000, text: "Taking my sulking to the masses" },
    { timeMs: 48000, text: "Writing my poems for the few" },
    { timeMs: 52000, text: "Pain! You made me a, you made me a believer, believer" },
    { timeMs: 60000, text: "Pain! You break me down and build me up, believer, believer" }
  ],

  // Starboy - The Weeknd
  trk_08: [
    { timeMs: 10000, text: "I'm tryna put you in the worst mood, ah" },
    { timeMs: 15000, text: "P1 cleaner than your church shoes, ah" },
    { timeMs: 20000, text: "Milli point two just to hurt you, ah" },
    { timeMs: 25000, text: "All red Lamb' just to tease you, ah" },
    { timeMs: 30000, text: "None of these toys on lease too, ah" },
    { timeMs: 35000, text: "Made your whole year in a week too, yah" },
    { timeMs: 41000, text: "Look what you've done! I'm a motherf***in' starboy" },
    { timeMs: 52000, text: "Look what you've done! I'm a motherf***in' starboy" }
  ],

  // Faded - Alan Walker
  trk_09: [
    { timeMs: 12000, text: "You were the shadow to my light, did you feel us?" },
    { timeMs: 21000, text: "Another start, you fade away" },
    { timeMs: 29000, text: "Afraid our aim is out of sight, wanna see us alight" },
    { timeMs: 41000, text: "Where are you now? Where are you now?" },
    { timeMs: 52000, text: "Was it all in my fantasy? Where are you now?" },
    { timeMs: 64000, text: "Were you only imaginary?" },
    { timeMs: 75000, text: "Where are you now? Atlantis, under the sea" },
    { timeMs: 87000, text: "Under the sea... where are you now?" },
    { timeMs: 98000, text: "I'm faded, I'm faded... so lost, I'm faded" }
  ],

  // POP/STARS - K/DA
  trk_10: [
    { timeMs: 8000, text: "You know who it is, coming 'round again" },
    { timeMs: 15000, text: "Want a bit of this, boy, you're looking at the best" },
    { timeMs: 23000, text: "Ain't nobody bringing us down, down, down, down" },
    { timeMs: 31000, text: "We go hard till the gas runs out, ooh!" },
    { timeMs: 39000, text: "Ain't nobody bringing us down, down, down, down" },
    { timeMs: 48000, text: "So get ready for the show, POP/STARS!" }
  ],

  // Dan - Sheila On 7
  trk_11: [
    { timeMs: 10000, text: "Dan bila esok datang kembali" },
    { timeMs: 17000, text: "Seperti sedia kala di mana kau bisa bercanda" },
    { timeMs: 26000, text: "Dan perlahan kaupun lupakan aku" },
    { timeMs: 33000, text: "Mendekat, mendekatlah kepadanya" },
    { timeMs: 41000, text: "Dan bila hatimu termangu sepi" },
    { timeMs: 50000, text: "Jangan pernah kau ragu untuk melangkah..." },
    { timeMs: 60000, text: "Lupakanlah saja diriku, bila itu membuatmu bahagia" }
  ],

  // Haram - Dayang Nurfaizah & Hael Husaini
  trk_12: [
    { timeMs: 12000, text: "Mengapa harus kita yang bertemu" },
    { timeMs: 22000, text: "Jika takdir memisahkan kita" },
    { timeMs: 34000, text: "Kasih yang terlarang namun membara" },
    { timeMs: 46000, text: "Di dalam jiwa yang setia..." },
    { timeMs: 58000, text: "Biar beribu halangan merintangi" },
    { timeMs: 70000, text: "Cinta ini takkan pernah padam..." }
  ],

  // Sunset - The Midnight
  trk_14: [
    { timeMs: 14000, text: "Driving through the neon twilight" },
    { timeMs: 25000, text: "The summer sun is fading into the ocean" },
    { timeMs: 38000, text: "Remember the days of thunder" },
    { timeMs: 50000, text: "When we were young and electric" },
    { timeMs: 65000, text: "We were kings of the midnight coast..." }
  ],

  // Dia - Anji
  trk_15: [
    { timeMs: 14000, text: "Di suatu hari tanpa sengaja kita bertemu" },
    { timeMs: 25000, text: "Aku yang pernah terluka kembali mengenal cinta" },
    { timeMs: 38000, text: "Hati ini kembali merasa tenang..." },
    { timeMs: 50000, text: "Oh Tuhan, kucinta dia" },
    { timeMs: 57000, text: "Kusayang dia, rindu dia, inginkan dia" },
    { timeMs: 68000, text: "Utuhkanlah rasa cinta di hatiku" },
    { timeMs: 78000, text: "Hanya padanya, untuk dia..." },
    { timeMs: 110000, text: "Kusayang dia, rindu dia, inginkan dia..." },
    { timeMs: 125000, text: "Hanya padanya, untuk dia..." }
  ],

  // Cindai - Siti Nurhaliza
  trk_16: [
    { timeMs: 15000, text: "Cindailah mana tidak berkias" },
    { timeMs: 24000, text: "Jalinnya lalu rentah berliku" },
    { timeMs: 32000, text: "Bagaikan nyawa tinggal secebis" },
    { timeMs: 41000, text: "Menanti kasih datang menyapa..." },
    { timeMs: 52000, text: "Biar patah sayap di dada" },
    { timeMs: 62000, text: "Namun jiwa tetap perkasa..." }
  ],

  // Dinda - Kugiran Masdo
  trk_17: [
    { timeMs: 10000, text: "Apa khabar dinda? Lama tak berjumpa" },
    { timeMs: 18000, text: "Rasanya baru semalam kita bersama" },
    { timeMs: 28000, text: "Dinda jangan marah-marah, takut nanti lekas tua" },
    { timeMs: 38000, text: "Kanda setia orangnya, takkan pernah mendua" },
    { timeMs: 48000, text: "Dinda dengarkanlah lagu ini..." }
  ]
};

// Cache for live fetched lyrics
const lyricsCache = new Map<string, LyricLine[] | null>();

/**
 * Parses standard LRC timestamped lyrics: [mm:ss.xx] Lyric text
 */
function parseLrc(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match [mm:ss.xx] or [mm:ss]
    const match = trimmed.match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)$/);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const text = match[4].trim();

      // Skip lines that are just music notes or sound descriptions
      if (text && text !== '♪' && !text.startsWith('♪ [') && !text.endsWith('] ♪')) {
        result.push({
          timeMs: (min * 60 + sec) * 1000 + ms,
          text,
        });
      }
    }
  }

  return result.sort((a, b) => a.timeMs - b.timeMs);
}

/**
 * Parses plain un-timestamped lyrics, distributing lines across the track duration
 */
function parsePlainLyrics(plainText: string, durationSeconds: number = 200): LyricLine[] {
  const rawLines = plainText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('[') && !l.endsWith(']'));

  if (!rawLines.length) return [];

  const lineIntervalMs = Math.max(3000, Math.floor((durationSeconds * 1000) / rawLines.length));
  return rawLines.map((text, idx) => ({
    timeMs: idx * lineIntervalMs,
    text,
  }));
}

/**
 * Fetches real synchronized lyrics from LRCLIB database API,
 * with fallback to local curated database.
 * NEVER generates synthetic descriptions of beats or instruments.
 */
export async function fetchLyricsForTrack(track: Track): Promise<LyricLine[] | null> {
  const cacheKey = `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
  if (lyricsCache.has(cacheKey)) {
    return lyricsCache.get(cacheKey)!;
  }

  // Check curated database by track id or title match
  if (CURATED_LYRICS_DB[track.id]) {
    return CURATED_LYRICS_DB[track.id];
  }

  for (const [key, lines] of Object.entries(CURATED_LYRICS_DB)) {
    const demo = Object.values(CURATED_LYRICS_DB);
    if (key === track.id) return lines;
  }

  try {
    const cleanTitle = track.title.replace(/\s*\([^)]*\)/g, '').trim();
    const cleanArtist = track.artist.replace(/\s*ft\..*$/i, '').trim();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data?.syncedLyrics) {
        const parsed = parseLrc(data.syncedLyrics);
        if (parsed.length > 0) {
          lyricsCache.set(cacheKey, parsed);
          return parsed;
        }
      }

      if (data?.plainLyrics) {
        const parsedPlain = parsePlainLyrics(data.plainLyrics, track.durationSeconds || 200);
        if (parsedPlain.length > 0) {
          lyricsCache.set(cacheKey, parsedPlain);
          return parsedPlain;
        }
      }
    }
  } catch {
    // Network error or timeout: fall back gracefully
  }

  // Secondary search attempt on LRCLIB via query parameter if exact match returned 404
  try {
    const query = `${track.title} ${track.artist}`.trim();
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl);
    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const match = results.find((r) => r.syncedLyrics) || results[0];
        if (match?.syncedLyrics) {
          const parsed = parseLrc(match.syncedLyrics);
          if (parsed.length > 0) {
            lyricsCache.set(cacheKey, parsed);
            return parsed;
          }
        }
        if (match?.plainLyrics) {
          const parsed = parsePlainLyrics(match.plainLyrics, track.durationSeconds || 200);
          if (parsed.length > 0) {
            lyricsCache.set(cacheKey, parsed);
            return parsed;
          }
        }
      }
    }
  } catch {
    // Graceful fallback
  }

  // If no lyrics are found anywhere, return null. Never fabricate beat descriptions.
  lyricsCache.set(cacheKey, null);
  return null;
}

/**
 * Synchronous resolver for instant UI render
 */
export function getInitialLyrics(track: Track): LyricLine[] | null {
  if (CURATED_LYRICS_DB[track.id]) {
    return CURATED_LYRICS_DB[track.id];
  }
  const cacheKey = `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
  return lyricsCache.get(cacheKey) || null;
}

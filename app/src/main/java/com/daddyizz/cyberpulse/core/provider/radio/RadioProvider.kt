package com.daddyizz.cyberpulse.core.provider.radio

import com.daddyizz.cyberpulse.core.model.RadioStation
import com.daddyizz.cyberpulse.core.model.RadioStreamType

/**
 * RadioProvider
 *
 * Provides a verified catalog of legal, publicly accessible, and high-reliability
 * internet radio stations with strong Malaysia-first curation and cyberpunk electronic aesthetics.
 */
object RadioProvider {

    val STATIONS: List<RadioStation> = listOf(
        // === Malaysia-First Public & Legal Stations ===
        RadioStation(
            id = "radio_my_bernama",
            name = "Bernama Radio",
            streamUrl = "https://stream.bernama.com/radio",
            artworkUrl = "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&q=80",
            genre = "News & Talk",
            country = "Malaysia",
            language = "Malay / English",
            homepageUrl = "https://radio.bernama.com",
            streamType = RadioStreamType.MP3,
            isVerified = true,
            bitrateKbps = 128,
            description = "Malaysia's premier 24-hour news, financial, and current affairs station."
        ),
        RadioStation(
            id = "radio_my_traxx",
            name = "TraXX FM (RTM)",
            streamUrl = "https://rtm.akamaized.net/hls/live/2013843/traxxfm/master.m3u8",
            artworkUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80",
            genre = "Pop & Hits",
            country = "Malaysia",
            language = "English",
            homepageUrl = "https://traxxfm.rtm.gov.my",
            streamType = RadioStreamType.HLS,
            isVerified = true,
            bitrateKbps = 128,
            description = "English-language public service radio station by Radio Televisyen Malaysia."
        ),
        RadioStation(
            id = "radio_my_nasional",
            name = "Nasional FM (RTM)",
            streamUrl = "https://rtm.akamaized.net/hls/live/2013840/nasionalfm/master.m3u8",
            artworkUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80",
            genre = "Variety & Culture",
            country = "Malaysia",
            language = "Malay",
            homepageUrl = "https://nasionalfm.rtm.gov.my",
            streamType = RadioStreamType.HLS,
            isVerified = true,
            bitrateKbps = 128,
            description = "Official national radio network of Malaysia providing cultural programs and hits."
        ),
        RadioStation(
            id = "radio_my_aifm",
            name = "Ai FM (RTM)",
            streamUrl = "https://rtm.akamaized.net/hls/live/2013837/aifm/master.m3u8",
            artworkUrl = "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&q=80",
            genre = "Mandarin Pop",
            country = "Malaysia",
            language = "Chinese",
            homepageUrl = "https://aifm.rtm.gov.my",
            streamType = RadioStreamType.HLS,
            isVerified = true,
            bitrateKbps = 128,
            description = "Chinese-language public broadcaster in Malaysia featuring music and infotainment."
        ),
        RadioStation(
            id = "radio_my_klasik",
            name = "Klasik FM (RTM)",
            streamUrl = "https://rtm.akamaized.net/hls/live/2013839/klasikfm/master.m3u8",
            artworkUrl = "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&q=80",
            genre = "Nostalgia & Heritage",
            country = "Malaysia",
            language = "Malay",
            homepageUrl = "https://klasikfm.rtm.gov.my",
            streamType = RadioStreamType.HLS,
            isVerified = true,
            bitrateKbps = 128,
            description = "Classic Malaysian golden hits, traditional music, and heritage entertainment."
        ),

        // === Electronic / Cyberpunk / Synthwave ===
        RadioStation(
            id = "radio_nightwave_plaza",
            name = "Nightwave Plaza",
            streamUrl = "https://radio.plaza.one/mp3",
            artworkUrl = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&q=80",
            genre = "Electronic",
            country = "Cyber Grid",
            language = "Instrumental",
            homepageUrl = "https://plaza.one",
            streamType = RadioStreamType.MP3,
            isVerified = true,
            bitrateKbps = 128,
            description = "Non-stop 24/7 Vaporwave, Future Funk, and nostalgic cyberspace aesthetic sounds."
        ),
        RadioStation(
            id = "radio_soma_defcon",
            name = "DEF CON Radio (SomaFM)",
            streamUrl = "https://ice1.somafm.com/defcon-128-mp3",
            artworkUrl = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80",
            genre = "Electronic",
            country = "United States",
            language = "English",
            homepageUrl = "https://somafm.com/defcon/",
            streamType = RadioStreamType.MP3,
            isVerified = true,
            bitrateKbps = 128,
            description = "Music for Hacking. The official stream of the world's largest hacker conference."
        ),
        RadioStation(
            id = "radio_soma_groove",
            name = "Groove Salad (SomaFM)",
            streamUrl = "https://ice1.somafm.com/groovesalad-128-mp3",
            artworkUrl = "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80",
            genre = "Chill",
            country = "United States",
            language = "Instrumental",
            homepageUrl = "https://somafm.com/groovesalad/",
            streamType = RadioStreamType.MP3,
            isVerified = true,
            bitrateKbps = 128,
            description = "A nicely chilled plate of ambient/downtempo beats and cybernetic grooves."
        ),
        RadioStation(
            id = "radio_soma_secret_agent",
            name = "Secret Agent (SomaFM)",
            streamUrl = "https://ice1.somafm.com/secretagent-128-mp3",
            artworkUrl = "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&q=80",
            genre = "Chill",
            country = "United States",
            language = "English",
            homepageUrl = "https://somafm.com/secretagent/",
            streamType = RadioStreamType.MP3,
            isVerified = true,
            bitrateKbps = 128,
            description = "The soundtrack for your stylish, mysterious cloak-and-dagger night drive."
        ),
        RadioStation(
            id = "radio_chillhop",
            name = "Chillhop Radio",
            streamUrl = "https://streams.ilovemusic.de/iloveradio17.mp3",
            artworkUrl = "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&q=80",
            genre = "Chill",
            country = "Germany",
            language = "Instrumental",
            homepageUrl = "https://ilovemusic.de",
            streamType = RadioStreamType.MP3,
            isVerified = true,
            bitrateKbps = 192,
            description = "Mellow lo-fi study pulses and late night beats."
        ),

        // === Jazz & Soul ===
        RadioStation(
            id = "radio_swiss_groove",
            name = "SwissGroove Radio",
            streamUrl = "https://stream.swissgroove.ch:8000/stream.mp3",
            artworkUrl = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300&q=80",
            genre = "Jazz",
            country = "Switzerland",
            language = "Instrumental",
            homepageUrl = "https://swissgroove.ch",
            streamType = RadioStreamType.MP3,
            isVerified = true,
            bitrateKbps = 128,
            description = "World's 1st Jazz, Funk, Soul & World Groove web radio station."
        ),

        // === News & International Public Broadcast ===
        RadioStation(
            id = "radio_bbc_world",
            name = "BBC World Service",
            streamUrl = "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
            artworkUrl = "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300&q=80",
            genre = "News & Talk",
            country = "United Kingdom",
            language = "English",
            homepageUrl = "https://www.bbc.co.uk/worldserviceradio",
            streamType = RadioStreamType.MP3,
            isVerified = true,
            bitrateKbps = 96,
            description = "International news, analysis, and factual programming from the BBC."
        ),

        // === Classical Harmony ===
        RadioStation(
            id = "radio_classic_fm",
            name = "Classic FM UK",
            streamUrl = "https://media-ice.musicradio.com/ClassicFMMP3",
            artworkUrl = "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&q=80",
            genre = "Classical",
            country = "United Kingdom",
            language = "English",
            homepageUrl = "https://www.classicfm.com",
            streamType = RadioStreamType.MP3,
            isVerified = true,
            bitrateKbps = 128,
            description = "The world's greatest classical music station, broadcasting relaxing masterworks."
        )
    )

    fun getStationById(id: String): RadioStation? {
        return STATIONS.firstOrNull { it.id == id }
    }
}

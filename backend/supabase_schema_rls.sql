-- ====================================================================
-- CYBERPULSE MUSIC - PRODUCTION DATABASE SCHEMA & ROW LEVEL SECURITY
-- Target: Supabase (PostgreSQL 15+)
-- Block 10: Production Hardening & Account Data Protection
-- ====================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT NOT NULL DEFAULT 'CyberPulse Listener',
    avatar_url TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'PRO')),
    profile_visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (profile_visibility IN ('PRIVATE', 'FRIENDS', 'PUBLIC')),
    preferred_languages TEXT[] DEFAULT ARRAY['English', 'Malay', 'Indonesian'],
    preferred_genres TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profile view if public"
    ON public.profiles FOR SELECT
    USING (profile_visibility = 'PUBLIC');

-- 2. PLAYLISTS TABLE
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    artwork_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Owner has full control
CREATE POLICY "Owner can manage own playlists"
    ON public.playlists FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Anyone can read public playlists (Read-Only)
CREATE POLICY "Anyone can view public playlists"
    ON public.playlists FOR SELECT
    USING (is_public = TRUE);

-- 3. PLAYLIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    track_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255),
    duration_ms BIGINT NOT NULL DEFAULT 0,
    source VARCHAR(32) NOT NULL DEFAULT 'YOUTUBE',
    artwork_url TEXT,
    position_index INT NOT NULL DEFAULT 0,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage playlist items"
    ON public.playlist_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.playlists p
            WHERE p.id = playlist_id AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.playlists p
            WHERE p.id = playlist_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Public can read items of public playlists"
    ON public.playlist_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.playlists p
            WHERE p.id = playlist_id AND p.is_public = TRUE
        )
    );

-- 4. LIKED TRACKS TABLE
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, track_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own likes"
    ON public.likes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. LISTENING HISTORY & REPLAY SNAPSHOTS
CREATE TABLE IF NOT EXISTS public.listening_history_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INT NOT NULL,
    total_minutes BIGINT NOT NULL DEFAULT 0,
    qualified_plays INT NOT NULL DEFAULT 0,
    top_artist TEXT,
    top_track TEXT,
    sonic_personality TEXT,
    snapshot_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, year)
);

ALTER TABLE public.listening_history_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own replay snapshots"
    ON public.listening_history_snapshots FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. USER SYNCED SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme VARCHAR(32) NOT NULL DEFAULT 'CYBERPUNK',
    visualizer_mode VARCHAR(32) NOT NULL DEFAULT 'NEON_WAVE',
    visualizer_performance VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
    data_saver BOOLEAN NOT NULL DEFAULT FALSE,
    recommendations_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
    ON public.user_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger: Automatically create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

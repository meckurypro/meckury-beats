-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Create beats table
CREATE TABLE IF NOT EXISTS beats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  bpm INTEGER,
  key TEXT,
  mood TEXT,
  genre TEXT,
  type_beat TEXT,
  cover_art_url TEXT NOT NULL,
  mp3_url TEXT NOT NULL,
  wav_url TEXT NOT NULL,
  stems_drive_link TEXT,
  lease_price INTEGER DEFAULT 20000,
  exclusive_price INTEGER DEFAULT 80000,
  exclusive_sold BOOLEAN DEFAULT FALSE,
  exclusive_buyer_id UUID REFERENCES profiles(id),
  play_count INTEGER DEFAULT 0,
  lease_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  beat_id UUID REFERENCES beats(id) ON DELETE CASCADE NOT NULL,
  license_type TEXT NOT NULL CHECK (license_type IN ('lease', 'exclusive')),
  amount INTEGER NOT NULL,
  payment_reference TEXT NOT NULL UNIQUE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  mp3_downloaded BOOLEAN DEFAULT FALSE,
  wav_downloaded BOOLEAN DEFAULT FALSE,
  stems_downloaded BOOLEAN DEFAULT FALSE
);

-- Create stems_requests table
CREATE TABLE IF NOT EXISTS stems_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  beat_id UUID REFERENCES beats(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending_upload' CHECK (status IN ('pending_upload', 'ready', 'downloaded', 'expired')),
  file_url TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  download_attempts INTEGER DEFAULT 0
);

-- Create portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  cover_art_url TEXT NOT NULL,
  audio_url TEXT,
  video_url TEXT,
  spotify_url TEXT,
  apple_music_url TEXT,
  youtube_url TEXT,
  release_date DATE,
  description TEXT,
  featured BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_beats_slug ON beats(slug);
CREATE INDEX idx_beats_featured ON beats(featured) WHERE featured = TRUE;
CREATE INDEX idx_beats_exclusive_sold ON beats(exclusive_sold);
CREATE INDEX idx_beats_active ON beats(active) WHERE active = TRUE;
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_beat_id ON purchases(beat_id);
CREATE INDEX idx_purchases_payment_reference ON purchases(payment_reference);
CREATE INDEX idx_stems_requests_status ON stems_requests(status);
CREATE INDEX idx_stems_requests_buyer_id ON stems_requests(buyer_id);
CREATE INDEX idx_portfolio_featured ON portfolio(featured) WHERE featured = TRUE;
CREATE INDEX idx_portfolio_order ON portfolio(order_index);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE stems_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Beats policies
CREATE POLICY "Beats are viewable by everyone"
  ON beats FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Only admins can insert beats"
  ON beats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can update beats"
  ON beats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can delete beats"
  ON beats FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Purchases policies
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
  ON purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Stems requests policies
CREATE POLICY "Users can view own stems requests"
  ON stems_requests FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Admins can view all stems requests"
  ON stems_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update stems requests"
  ON stems_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Portfolio policies
CREATE POLICY "Portfolio is viewable by everyone"
  ON portfolio FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can manage portfolio"
  ON portfolio FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment play count
CREATE OR REPLACE FUNCTION increment_play_count(beat_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE beats
  SET play_count = play_count + 1
  WHERE id = beat_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment lease count
CREATE OR REPLACE FUNCTION increment_lease_count(beat_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE beats
  SET lease_count = lease_count + 1
  WHERE id = beat_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired stems
CREATE OR REPLACE FUNCTION cleanup_expired_stems()
RETURNS VOID AS $$
BEGIN
  UPDATE stems_requests
  SET status = 'expired'
  WHERE status = 'ready'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Storage buckets setup (run these in Supabase dashboard)
-- Bucket: beat-covers (public)
-- Bucket: beat-audio (public for streaming, auth required for download)
-- Bucket: stems (private, auth required)
-- Bucket: portfolio (public)

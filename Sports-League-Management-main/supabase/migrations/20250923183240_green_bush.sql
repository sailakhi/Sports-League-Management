/*
  # Sports League Management System Database Schema

  1. New Tables
    - `users` - User accounts with roles (admin, coach, player)  
    - `teams` - Sports teams with coach assignments
    - `players` - Individual players assigned to teams
    - `leagues` - Competition leagues with different formats
    - `matches` - Game matches between teams with scores
    - `standings` - League standings with team statistics

  2. Security
    - Enable RLS on all tables
    - Role-based policies for different user types
    - Public access for standings and match viewing

  3. Features
    - User role management (admin, coach, player)
    - Team and player management
    - Match scheduling and score tracking
    - Automated standings calculations
*/

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'coach', 'player');
CREATE TYPE league_format AS ENUM ('round_robin', 'knockout');
CREATE TYPE match_status AS ENUM ('scheduled', 'completed');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role DEFAULT 'player',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  coach_id uuid REFERENCES users(id) ON DELETE SET NULL,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL CHECK (age > 0),
  position text NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  season text NOT NULL,
  format league_format DEFAULT 'round_robin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid REFERENCES leagues(id) ON DELETE CASCADE,
  team1_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  team2_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  date date NOT NULL,
  venue text NOT NULL,
  score_team1 integer DEFAULT NULL,
  score_team2 integer DEFAULT NULL,
  status match_status DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (team1_id != team2_id)
);

-- Standings table
CREATE TABLE IF NOT EXISTS standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid REFERENCES leagues(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  played integer DEFAULT 0,
  won integer DEFAULT 0,
  lost integer DEFAULT 0,
  draw integer DEFAULT 0,
  points integer DEFAULT 0,
  goals_for integer DEFAULT 0,
  goals_against integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(league_id, team_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for teams table
CREATE POLICY "Everyone can read teams" ON teams
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Coaches can manage their teams" ON teams
  FOR ALL TO authenticated
  USING (coach_id = auth.uid());

-- Policies for players table
CREATE POLICY "Everyone can read players" ON players
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage players" ON players
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Coaches can manage their team players" ON players
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE id = team_id AND coach_id = auth.uid()
    )
  );

CREATE POLICY "Players can update their own data" ON players
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Policies for leagues table
CREATE POLICY "Everyone can read leagues" ON leagues
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage leagues" ON leagues
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for matches table
CREATE POLICY "Everyone can read matches" ON matches
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage matches" ON matches
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for standings table
CREATE POLICY "Everyone can read standings" ON standings
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage standings" ON standings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Functions for automatic standings calculation
CREATE OR REPLACE FUNCTION calculate_standings()
RETURNS trigger AS $$
BEGIN
  -- Only update if match is completed
  IF NEW.status = 'completed' AND NEW.score_team1 IS NOT NULL AND NEW.score_team2 IS NOT NULL THEN
    -- Update team1 standings
    INSERT INTO standings (league_id, team_id, played, won, lost, draw, points, goals_for, goals_against)
    VALUES (NEW.league_id, NEW.team1_id, 0, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (league_id, team_id) DO NOTHING;

    -- Update team2 standings
    INSERT INTO standings (league_id, team_id, played, won, lost, draw, points, goals_for, goals_against)
    VALUES (NEW.league_id, NEW.team2_id, 0, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (league_id, team_id) DO NOTHING;

    -- Calculate results for team1
    UPDATE standings SET
      played = played + 1,
      won = won + CASE WHEN NEW.score_team1 > NEW.score_team2 THEN 1 ELSE 0 END,
      lost = lost + CASE WHEN NEW.score_team1 < NEW.score_team2 THEN 1 ELSE 0 END,
      draw = draw + CASE WHEN NEW.score_team1 = NEW.score_team2 THEN 1 ELSE 0 END,
      points = points + CASE 
        WHEN NEW.score_team1 > NEW.score_team2 THEN 3
        WHEN NEW.score_team1 = NEW.score_team2 THEN 1
        ELSE 0
      END,
      goals_for = goals_for + NEW.score_team1,
      goals_against = goals_against + NEW.score_team2
    WHERE league_id = NEW.league_id AND team_id = NEW.team1_id;

    -- Calculate results for team2
    UPDATE standings SET
      played = played + 1,
      won = won + CASE WHEN NEW.score_team2 > NEW.score_team1 THEN 1 ELSE 0 END,
      lost = lost + CASE WHEN NEW.score_team2 < NEW.score_team1 THEN 1 ELSE 0 END,
      draw = draw + CASE WHEN NEW.score_team2 = NEW.score_team1 THEN 1 ELSE 0 END,
      points = points + CASE 
        WHEN NEW.score_team2 > NEW.score_team1 THEN 3
        WHEN NEW.score_team2 = NEW.score_team1 THEN 1
        ELSE 0
      END,
      goals_for = goals_for + NEW.score_team2,
      goals_against = goals_against + NEW.score_team1
    WHERE league_id = NEW.league_id AND team_id = NEW.team2_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic standings update
CREATE OR REPLACE TRIGGER update_standings_trigger
  AFTER INSERT OR UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION calculate_standings();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_league_id ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_standings_league_id ON standings(league_id);
CREATE INDEX IF NOT EXISTS idx_standings_points ON standings(points DESC);
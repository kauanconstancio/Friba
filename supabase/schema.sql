-- ==========================================================
-- FRIBA ESPORTS - BANCO DE DADOS COMPLETO SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==========================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 2. TABELA DE USUÁRIOS (Contas e Acessos)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT NOT NULL,
  nickname TEXT,
  role TEXT NOT NULL DEFAULT 'Jogador' CHECK (role IN ('Dono', 'Manager', 'Coach', 'Jogador')),
  avatar TEXT,
  discord TEXT,
  in_game_id TEXT,
  is_owner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir que a coluna password exista mesmo se a tabela users já tiver sido criada antes
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS discord TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS in_game_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;

-- ==========================================================
-- 3. TABELA DE CONVITES DE EQUIPE (Gerados pelo Dono)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.team_invites (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'Jogador' CHECK (role IN ('Dono', 'Manager', 'Coach', 'Jogador')),
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aceito', 'Cancelado')),
  invited_by TEXT,
  invited_by_name TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================================
-- 4. TABELA DE MEMBROS DA EQUIPE (Aba "Equipes" / Roster)
-- Alimentada diretamente pelas informações preenchidas pelo Jogador ao aceitar o convite
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  tag TEXT,
  role TEXT NOT NULL DEFAULT 'Jogador' CHECK (role IN ('Dono', 'Manager', 'Coach', 'Jogador')),
  avatar TEXT,
  discord TEXT,
  in_game_id TEXT,
  email TEXT,
  game_role TEXT DEFAULT 'All-Rounder',
  preferred_lane TEXT DEFAULT 'Jungle',
  main_pokemon TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'Titular' CHECK (status IN ('Titular', 'Reserva')),
  specialty_or_title TEXT,
  coach_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir colunas adicionais se a tabela team_members já existir
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS email TEXT;

-- ==========================================================
-- 5. TABELA DE SCRIMS E EVENTOS (Agenda de Treinos)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.scrim_events (
  id TEXT PRIMARY KEY,
  opponent_team TEXT NOT NULL,
  opponent_tag TEXT,
  title TEXT,
  opponent_contact TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  end_time TEXT,
  format TEXT DEFAULT 'MD3' CHECK (format IN ('MD1', 'MD3', 'MD5')),
  status TEXT DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Confirmado', 'Concluído')),
  category TEXT DEFAULT 'Treino' CHECK (category IN ('Amistoso', 'Treino', 'Review', 'Campeonato')),
  lineup TEXT[] DEFAULT '{}',
  score JSONB DEFAULT '{"us": 0, "them": 0}'::jsonb,
  games JSONB DEFAULT '[]'::jsonb,
  attendance JSONB DEFAULT '[]'::jsonb,
  opponent_team_id TEXT,
  opponent_players TEXT[] DEFAULT '{}',
  vod_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir colunas adicionais para scrim_events se já existir
ALTER TABLE public.scrim_events ADD COLUMN IF NOT EXISTS games JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.scrim_events ADD COLUMN IF NOT EXISTS attendance JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.scrim_events ADD COLUMN IF NOT EXISTS opponent_team_id TEXT;
ALTER TABLE public.scrim_events ADD COLUMN IF NOT EXISTS opponent_players TEXT[] DEFAULT '{}';

-- ==========================================================
-- 5.1 TABELA DE EQUIPES OPONENTES / ADVERSÁRIAS (Rivais)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.opponent_teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  contact TEXT,
  players TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.opponent_teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao Opponent Teams" ON public.opponent_teams;
CREATE POLICY "Permissao Opponent Teams" ON public.opponent_teams FOR ALL USING (true);

-- ==========================================================
-- 6. TABELA DE PLANOS TÁTICOS (Prancheta Tática / Planner)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.strategy_plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  phase_time TEXT,
  description TEXT,
  elements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 7. TABELA DE AVISOS DA EQUIPE (Dashboard / Mural)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.team_announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  date TEXT NOT NULL,
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Alta')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 8. HABILITAR ROW LEVEL SECURITY (RLS)
-- ==========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrim_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_announcements ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Total para a aplicação
DROP POLICY IF EXISTS "Permissao Users" ON public.users;
CREATE POLICY "Permissao Users" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Permissao Invites" ON public.team_invites;
CREATE POLICY "Permissao Invites" ON public.team_invites FOR ALL USING (true);

DROP POLICY IF EXISTS "Permissao Members" ON public.team_members;
CREATE POLICY "Permissao Members" ON public.team_members FOR ALL USING (true);

DROP POLICY IF EXISTS "Permissao Scrims" ON public.scrim_events;
CREATE POLICY "Permissao Scrims" ON public.scrim_events FOR ALL USING (true);

DROP POLICY IF EXISTS "Permissao Strategies" ON public.strategy_plans;
CREATE POLICY "Permissao Strategies" ON public.strategy_plans FOR ALL USING (true);

DROP POLICY IF EXISTS "Permissao Announcements" ON public.team_announcements;
CREATE POLICY "Permissao Announcements" ON public.team_announcements FOR ALL USING (true);

-- ==========================================================
-- 9. DADOS INICIAIS (SEED DO DONO E EQUIPE BASE)
-- ==========================================================
INSERT INTO public.users (id, email, password, name, nickname, role, avatar, discord, is_owner)
VALUES (
  'user-owner-friba',
  'kauanconstancio13@gmail.com',
  'Kmc@130606',
  'Kauan Constâncio',
  'Kauan',
  'Dono',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'kauan#0001',
  true
)
ON CONFLICT (id) DO UPDATE 
SET email = 'kauanconstancio13@gmail.com',
    password = 'Kmc@130606',
    name = 'Kauan Constâncio',
    nickname = 'Kauan',
    role = 'Dono',
    is_owner = true;

-- Inserir Membro Dono no Roster
INSERT INTO public.team_members (
  id, user_id, name, nickname, tag, role, avatar, discord, in_game_id, email, specialty_or_title
)
VALUES (
  'm1',
  'user-owner-friba',
  'Kauan Constâncio',
  'Kauan',
  '@FRIBA · DONO',
  'Dono',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'kauan#0001',
  'KAUAN13',
  'kauanconstancio13@gmail.com',
  'Dono & Fundador'
)
ON CONFLICT (id) DO UPDATE
SET name = 'Kauan Constâncio',
    nickname = 'Kauan',
    email = 'kauanconstancio13@gmail.com',
    role = 'Dono';

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_invites_code ON public.team_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_members_role ON public.team_members(role);
CREATE INDEX IF NOT EXISTS idx_scrims_date ON public.scrim_events(date);

-- ==========================================================
-- 10. HABILITAR SUPABASE REALTIME (OPCIONAL/RECOMENDADO)
-- Permite que novas adições no elenco atualizem na tela instantaneamente
-- ==========================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_invites;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

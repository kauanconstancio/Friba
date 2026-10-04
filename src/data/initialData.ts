import type { TeamMember, ScrimEvent, StrategyPlan, TeamAnnouncement } from '../types';

// Roster limpo: apenas o Dono inicial da organização (jogadores entram via convite)
export const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'm1',
    name: 'Kauan Constâncio',
    nickname: 'Kauan',
    tag: '@Kauan',
    role: 'Dono',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    discord: 'kauan#0001',
    inGameId: 'KAUAN13',
    specialtyOrTitle: 'Dono & Fundador',
    email: 'kauanconstancio13@gmail.com',
  }
];

// Sem dados mockados: treinos são adicionados pelo Dono/Manager
export const INITIAL_SCRIMS: ScrimEvent[] = [];

// Sem dados mockados: avisos são adicionados pela Staff
export const INITIAL_ANNOUNCEMENTS: TeamAnnouncement[] = [];

// Sem dados mockados: táticas são criadas na prancheta
export const INITIAL_PRESETS: StrategyPlan[] = [];

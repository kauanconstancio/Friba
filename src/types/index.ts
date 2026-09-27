export type Role = 'Dono' | 'Manager' | 'Coach' | 'Jogador';
export type PokemonRole = 'Attacker' | 'Speedster' | 'All-Rounder' | 'Defender' | 'Supporter';
export type Lane = 'Top' | 'Jungle' | 'Bot' | 'Flex' | 'Mid' | 'Top Lane' | 'Bot Lane' | 'Support';

export interface TeamMember {
  id: string;
  name: string;
  nickname: string;
  role: Role;
  avatar: string;
  discord: string;
  tag?: string;
  inGameId?: string;
  // Campos simplificados para Jogadores
  gameRole?: PokemonRole;
  preferredLane?: Lane;
  mainPokemon?: string[];
  status?: 'Titular' | 'Reserva';
  // Campo simples para Staff
  specialtyOrTitle?: string;
  coachNotes?: string;
}

export interface PokemonData {
  id: string;
  name: string;
  rawName?: string;
  role: PokemonRole;
  damageType: 'Físico' | 'Especial';
  sprite: string;
  portrait?: string;
  thumbnail?: string;
  tier?: string;
  counters?: string[];
  synergies?: string[];
  range?: string;
  difficulty?: string;
  badgeColor?: string;
  stats?: any;
  recommendedItems?: string[];
  recommendedBattleItems?: string[];
  powerSpike?: string;
}

export interface TacticalElement {
  id: string;
  type: 'draw' | 'arrow' | 'line' | 'token' | 'text' | 'ping';
  x: number;
  y: number;
  toX?: number;
  toY?: number;
  points?: { x: number; y: number }[];
  color?: string;
  label?: string;
  pokemonId?: string;
  pokemonName?: string;
  pokemonSprite?: string;
  team?: 'blue' | 'orange';
  fontSize?: number;
}

export interface StrategyPlan {
  id: string;
  title: string;
  phaseTime: string;
  description: string;
  elements: TacticalElement[];
}

export interface TeamAnnouncement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority?: 'Normal' | 'Alta';
}

export interface ScrimEvent {
  id: string;
  opponentTeam: string;
  opponentTag: string;
  title?: string;
  opponentContact?: string;
  date: string;
  time: string;
  endTime?: string;
  format: 'MD1' | 'MD3' | 'MD5';
  status: 'Agendado' | 'Confirmado' | 'Concluído';
  category?: 'Amistoso' | 'Treino' | 'Review' | 'Campeonato';
  lineup: string[];
  score?: { us: number; them: number };
  vodUrl?: string;
  notes?: string;
}

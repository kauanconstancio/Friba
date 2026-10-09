export type Role = 'Dono' | 'Manager' | 'Coach' | 'Jogador';
export type PokemonRole = 'Attacker' | 'Speedster' | 'All-Rounder' | 'Defender' | 'Supporter';
export type Lane = 'Top' | 'Jungle' | 'Bot' | 'Flex' | 'Mid' | 'Top Lane' | 'Bot Lane' | 'Support';

export interface AppUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  nickname: string;
  role: Role;
  avatar: string;
  discord?: string;
  inGameId?: string;
  isOwner?: boolean;
  createdAt: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  name?: string;
  role: Role;
  status: 'Pendente' | 'Aceito' | 'Cancelado';
  invitedBy: string;
  invitedByName: string;
  inviteCode: string;
  createdAt: string;
  expiresAt?: string;
}

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
  email?: string;
  userId?: string;
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
  width?: number;
  memberId?: string;
  memberName?: string;
  memberNickname?: string;
  memberAvatar?: string;
  memberLane?: string;
  memberRole?: string;
}

export interface TeamNotification {
  id: string;
  title: string;
  message: string;
  category: 'Treino' | 'Mural' | 'Equipe' | 'Sistema';
  date: string;
  read: boolean;
  linkTab?: string;
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

export interface ScrimAttendance {
  memberId: string;
  memberName: string;
  memberNickname?: string;
  status: 'Confirmado' | 'Atraso' | 'Ausente';
  note?: string;
  updatedAt?: string;
}
export interface OpponentTeam {
  id: string;
  name: string;
  tag: string;
  logo?: string;
  contact?: string;
  players: string[];
  notes?: string;
  createdAt?: string;
}

export interface GamePlayerStats {
  playerName: string;
  playerTag?: string;
  pokemonId: string;
  pokemonName?: string;
  pokemonSprite?: string;
  kos: number;
  assists: number;
  damage: string | number;
  damageTaken: string | number;
  healing: string | number;
  points: number;
  isMvp?: boolean;
}

export interface ScrimGameDetail {
  gameNumber: number;
  scoreUs: number;
  scoreThem: number;
  usPlayersStats?: GamePlayerStats[];
  themPlayersStats?: GamePlayerStats[];
  mvpMemberName?: string;
  notes?: string;
}

export interface ScrimEvent {
  id: string;
  opponentTeam: string;
  opponentTag: string;
  opponentTeamId?: string;
  opponentPlayers?: string[];
  title?: string;
  opponentContact?: string;
  date: string;
  time: string;
  endTime?: string;
  format: 'MD1' | 'MD3' | 'MD5' | 'MD7';
  status: 'Agendado' | 'Confirmado' | 'Concluído';
  category?: 'Amistoso' | 'Treino' | 'Review' | 'Campeonato';
  lineup: string[];
  score?: { us: number; them: number };
  vodUrl?: string;
  notes?: string;
  attendance?: ScrimAttendance[];
  games?: ScrimGameDetail[];
  mvpMemberName?: string;
}

import type { TeamMember, ScrimEvent, StrategyPlan, TeamAnnouncement } from '../types';

export const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'p1',
    name: 'Kauan Constancio',
    nickname: 'NKYY!',
    tag: '@DU · NKYY!',
    role: 'Jogador',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    discord: '@_nkyyy',
    inGameId: 'MMRYMA5',
    gameRole: 'All-Rounder',
    preferredLane: 'Jungle',
    status: 'Titular',
    mainPokemon: ['ceruledge']
  },
  {
    id: 'p2',
    name: 'Ana Vidigal',
    nickname: 'BITTENCO',
    tag: '@DU · BITTENCO',
    role: 'Jogador',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    discord: '@anabittencourt',
    inGameId: 'RH4NXF4',
    gameRole: 'Supporter',
    preferredLane: 'Support',
    status: 'Titular',
    mainPokemon: ['alcremie']
  },
  {
    id: 'p3',
    name: 'BynSeven',
    nickname: 'BYN7',
    tag: '@DU · BYN7',
    role: 'Jogador',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    discord: '@bynseven_',
    inGameId: '21PA653',
    gameRole: 'Defender',
    preferredLane: 'Bot Lane',
    status: 'Titular',
    mainPokemon: ['snorlax']
  },
  {
    id: 'p4',
    name: 'Soul',
    nickname: 'LYNSOUL',
    tag: '@DU · LYNSOUL',
    role: 'Jogador',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    discord: 'LynSoul',
    inGameId: 'HHG1G5F',
    gameRole: 'Attacker',
    preferredLane: 'Bot Lane',
    status: 'Titular',
    mainPokemon: ['mew']
  },
  {
    id: 'p5',
    name: 'Digo',
    nickname: 'Digo',
    tag: '@.',
    role: 'Jogador',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    discord: '.',
    inGameId: '.',
    gameRole: 'Defender',
    preferredLane: 'Bot Lane',
    status: 'Titular',
    mainPokemon: ['mamoswine']
  },
  {
    id: 'p6',
    name: 'McQueen',
    nickname: 'MCQUEEN',
    tag: '@MCQUEEN',
    role: 'Jogador',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    discord: 'McQueen',
    inGameId: '',
    gameRole: 'Supporter',
    preferredLane: 'Mid',
    status: 'Reserva',
    mainPokemon: ['clefable']
  },
  {
    id: 'm1',
    name: 'Lucas Ferreira',
    nickname: 'Friba',
    role: 'Dono',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    discord: 'friba#0001',
    specialtyOrTitle: 'Dono & CEO'
  },
  {
    id: 'm2',
    name: 'Mariana Costa',
    nickname: 'Valkyrie',
    role: 'Manager',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    discord: 'valkyrie#1234',
    specialtyOrTitle: 'Operações e Scrims'
  },
  {
    id: 'm3',
    name: 'Gabriel Lima',
    nickname: 'Professor',
    role: 'Coach',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    discord: 'prof.unite#5555',
    specialtyOrTitle: 'Head Coach'
  }
];

export const INITIAL_SCRIMS: ScrimEvent[] = [
  {
    id: 'scrim-1',
    opponentTeam: 'LOUD Unite',
    opponentTag: 'LOUD',
    title: 'Scrim vs LOUD (MD3)',
    opponentContact: 'Discord: @loud_manager',
    date: '2026-09-25',
    time: '19:00',
    endTime: '20:30',
    format: 'MD3',
    status: 'Concluído',
    category: 'Amistoso',
    lineup: ['Kauan Constancio', 'Ana Vidigal', 'BynSeven', 'Soul', 'Digo'],
    score: { us: 2, them: 1 },
    vodUrl: 'https://youtube.com',
    notes: 'Excelente adaptação no Jogo 3 com Ceruledge e Snorlax garantindo o Rayquaza.'
  },
  {
    id: 'scrim-today',
    opponentTeam: 'RED Canids',
    opponentTag: 'RED',
    title: 'Scrim vs RED Canids (MD3)',
    opponentContact: 'Discord: @red_manager',
    date: '2026-09-26',
    time: '19:30',
    endTime: '21:00',
    format: 'MD3',
    status: 'Confirmado',
    category: 'Amistoso',
    lineup: ['Kauan Constancio', 'Ana Vidigal', 'BynSeven', 'Soul', 'Digo'],
    notes: 'Focar na contestação dos Swablus centrais aos 8:50.'
  },
  {
    id: 'scrim-2',
    opponentTeam: 'Keyd Stars',
    opponentTag: 'VKS',
    title: 'Scrim vs Vivo Keyd (MD3)',
    opponentContact: 'Discord: @keyd_coach',
    date: '2026-09-27',
    time: '20:00',
    endTime: '21:30',
    format: 'MD3',
    status: 'Confirmado',
    category: 'Amistoso',
    lineup: ['Kauan Constancio', 'Ana Vidigal', 'BynSeven', 'Soul', 'Digo'],
    notes: 'Testar composição anti-dive com Mamoswine e Alcremie.'
  },
  {
    id: 'scrim-3',
    opponentTeam: 'Treino Tático de Rotações (Interno)',
    opponentTag: 'TREINO',
    title: 'Treino Tático: Pit do Rayquaza',
    date: '2026-09-28',
    time: '19:00',
    endTime: '20:30',
    format: 'MD3',
    status: 'Agendado',
    category: 'Treino',
    lineup: ['Kauan Constancio', 'Ana Vidigal', 'BynSeven', 'Soul', 'Digo', 'McQueen'],
    notes: 'Alinhamento de gank aos 8:50 e controle das moitas centrais.'
  },
  {
    id: 'scrim-review',
    opponentTeam: 'Comissão Técnica Friba',
    opponentTag: 'REVIEW',
    title: 'VOD Review: Análise de Draft & Erros',
    date: '2026-09-29',
    time: '20:00',
    endTime: '21:00',
    format: 'MD1',
    status: 'Agendado',
    category: 'Review',
    lineup: ['Kauan Constancio', 'Ana Vidigal', 'BynSeven', 'Soul', 'Digo', 'McQueen'],
    notes: 'Análise gravada das scrims do fim de semana com o Coach Gabriel.'
  },
  {
    id: 'scrim-4',
    opponentTeam: 'paiN Gaming',
    opponentTag: 'PNG',
    title: 'Scrim vs paiN Gaming (MD5)',
    opponentContact: 'Discord: @pain_manager',
    date: '2026-09-30',
    time: '18:30',
    endTime: '21:00',
    format: 'MD5',
    status: 'Agendado',
    category: 'Amistoso',
    lineup: ['Kauan Constancio', 'Ana Vidigal', 'BynSeven', 'Soul', 'Digo']
  },
  {
    id: 'scrim-tournament',
    opponentTeam: 'Aeos Cup Qualifiers',
    opponentTag: 'AEOS',
    title: '🏆 Qualificatória Oficial Aeos Cup',
    date: '2026-10-03',
    time: '16:00',
    endTime: '20:00',
    format: 'MD3',
    status: 'Agendado',
    category: 'Campeonato',
    lineup: ['Kauan Constancio', 'Ana Vidigal', 'BynSeven', 'Soul', 'Digo'],
    notes: 'Apresentação no Discord oficial da Pokémon Company às 15:30.'
  }
];

export const INITIAL_ANNOUNCEMENTS: TeamAnnouncement[] = [
  {
    id: 'a1',
    title: 'Disputa de Rayquaza aos 2:00: Guardar Ultimates!',
    content: 'Lembrete da comissão: ninguém gasta Unite Move após os 3:00 de jogo. Chegar no pit central com vantagem posicional.',
    author: 'Coach Gabriel',
    date: 'Hoje às 18:30',
    priority: 'Alta'
  },
  {
    id: 'a2',
    title: 'Inscrições Confirmadas: Qualificatórias Regionais',
    content: 'A organização confirmou a participação na Copa dos Sonhos e próximos torneios de Pokémon Unite.',
    author: 'Mariana (Manager)',
    date: 'Ontem',
    priority: 'Normal'
  }
];

export const INITIAL_PRESETS: StrategyPlan[] = [
  {
    id: 'strat-1',
    title: 'Abertura 8:50 (Altaria)',
    phaseTime: '8:50',
    description: 'Rotação da jungle para a rota inferior com pressão nos Swablu.',
    elements: [
      { id: 'e1', type: 'token', x: 260, y: 350, pokemonName: 'Shadow', team: 'blue' },
      { id: 'e2', type: 'token', x: 300, y: 380, pokemonName: 'Healer', team: 'blue' },
      { id: 'e3', type: 'token', x: 280, y: 410, pokemonName: 'Hyper', team: 'blue' },
      { id: 'e4', type: 'arrow', x: 220, y: 260, toX: 260, toY: 345, color: '#38BDF8' }
    ]
  },
  {
    id: 'strat-2',
    title: 'Disputa de Regi 7:00',
    phaseTime: '7:00',
    description: '4 jogadores no objetivo inferior para garantir XP global.',
    elements: [
      { id: 's2-1', type: 'token', x: 480, y: 410, pokemonName: 'Titan', team: 'blue' },
      { id: 's2-2', type: 'token', x: 450, y: 430, pokemonName: 'Shadow', team: 'blue' },
      { id: 's2-3', type: 'token', x: 430, y: 440, pokemonName: 'Healer', team: 'blue' },
      { id: 's2-4', type: 'arrow', x: 380, y: 390, toX: 470, toY: 420, color: '#10B981' }
    ]
  },
  {
    id: 'strat-3',
    title: 'Luta do Rayquaza 2:00',
    phaseTime: '2:00',
    description: 'Controle de moitas em volta do pit central para a teamfight decisiva.',
    elements: [
      { id: 's3-1', type: 'token', x: 410, y: 220, pokemonName: 'Aegis', team: 'blue' },
      { id: 's3-2', type: 'token', x: 390, y: 260, pokemonName: 'Healer', team: 'blue' },
      { id: 's3-3', type: 'token', x: 340, y: 240, pokemonName: 'Hyper', team: 'blue' },
      { id: 's3-4', type: 'token', x: 460, y: 170, pokemonName: 'Shadow', team: 'blue' },
      { id: 's3-5', type: 'ping', x: 470, y: 250, color: '#EF4444', label: 'RAYQUAZA' }
    ]
  }
];

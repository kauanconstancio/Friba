import type { ScrimEvent, TeamMember, ScrimGameDetail, GamePlayerStats } from '../types';
import { POKEMON_ROSTER } from '../data/pokemonData';

export interface PlayerGameHistoryItem {
  scrimId: string;
  gameNumber: number;
  date: string;
  time: string;
  opponentTeam: string;
  opponentTag: string;
  category: string;
  format: string;
  scoreUs: number;
  scoreThem: number;
  isVictory: boolean;
  isDefeat: boolean;
  isTie: boolean;
  pokemonId: string;
  pokemonName: string;
  pokemonSprite: string;
  pokemonRole?: string;
  kos: number;
  assists: number;
  points: number;
  damage: number;
  damageTaken: number;
  healing: number;
  isMvp: boolean;
  vodUrl?: string;
  notes?: string;
}

export interface PokemonUsageStat {
  pokemonId: string;
  pokemonName: string;
  pokemonSprite: string;
  role: string;
  picks: number;
  pickRate: number; // 0 - 100%
  wins: number;
  losses: number;
  winRate: number; // 0 - 100%
  avgKills: number;
  avgAssists: number;
  avgPoints: number;
  mvpCount: number;
}

export interface RadarMetrics {
  kosScore: number;       // 0-100 normalized
  assistsScore: number;   // 0-100 normalized
  pointsScore: number;    // 0-100 normalized
  damageScore: number;    // 0-100 normalized
  winRateScore: number;   // 0-100 normalized
}

export interface PlayerCalculatedStats {
  memberId: string;
  playerName: string;
  nickname: string;
  avatar: string;
  role?: string;
  preferredLane?: string;
  gameRole?: string;
  tag?: string;

  // High-level aggregates
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // 0 - 100%

  // MVPs
  totalMvps: number;
  mvpRate: number; // 0 - 100%

  // Averages per game
  avgKills: number;
  avgAssists: number;
  avgKillsAndAssists: number;
  avgPoints: number;
  avgDamage: number;
  avgDamageTaken: number;
  avgHealing: number;

  // High scores (Personal records)
  maxKills: number;
  maxAssists: number;
  maxPoints: number;
  maxDamage: number;

  // Most used Pokemon
  mostUsedPokemon: PokemonUsageStat | null;
  pokemonStats: PokemonUsageStat[];

  // Recent & All Games
  recentGames: PlayerGameHistoryItem[]; // Last up to 10
  allGames: PlayerGameHistoryItem[];

  // Radar
  radar: RadarMetrics;
}

const normalizeStr = (str?: string): string => {
  return (str || '').trim().toLowerCase();
};

export const isPlayerMatching = (statPlayerName: string, member: TeamMember): boolean => {
  if (!statPlayerName || !member) return false;
  const pName = normalizeStr(statPlayerName);
  const nick = normalizeStr(member.nickname);
  const name = normalizeStr(member.name);
  const ign = normalizeStr(member.inGameId);
  const tag = normalizeStr(member.tag);

  if (nick && pName === nick) return true;
  if (name && pName === name) return true;
  if (ign && pName === ign) return true;
  if (tag && pName.includes(tag)) return true;

  if (nick && (pName.includes(nick) || nick.includes(pName))) return true;
  if (name && (pName.includes(name) || name.includes(pName))) return true;

  return false;
};

export const getPokemonMeta = (idOrName?: string) => {
  if (!idOrName) {
    return {
      id: 'pikachu',
      name: 'Pikachu',
      role: 'Attacker',
      sprite: 'https://d275t8dp8rxb42.cloudfront.net/pokemon/thumbnail/Pikachu.png'
    };
  }

  const clean = idOrName.toLowerCase().trim();
  const found = POKEMON_ROSTER.find(
    p => p.id.toLowerCase() === clean || p.name.toLowerCase() === clean || (p.rawName && p.rawName.toLowerCase() === clean)
  );

  if (found) {
    return {
      id: found.id,
      name: found.name,
      role: found.role || 'All-Rounder',
      sprite: found.thumbnail || found.sprite || `https://d275t8dp8rxb42.cloudfront.net/pokemon/thumbnail/${found.rawName || found.name}.png`
    };
  }

  return {
    id: clean,
    name: idOrName,
    role: 'All-Rounder',
    sprite: 'https://d275t8dp8rxb42.cloudfront.net/pokemon/thumbnail/Pikachu.png'
  };
};

/**
 * Calcula todas as estatísticas para um atleta específico a partir das partidas cadastradas.
 */
export function calculatePlayerStats(
  targetMember: TeamMember,
  scrims: ScrimEvent[],
  categoryFilter: string = 'Todos'
): PlayerCalculatedStats {
  const allPlayerGames: PlayerGameHistoryItem[] = [];

  // Ordenar scrims por data/hora decrescente (mais recentes primeiro)
  const sortedScrims = [...scrims].sort((a, b) => {
    const dateA = `${a.date || ''} ${a.time || ''}`;
    const dateB = `${b.date || ''} ${b.time || ''}`;
    return dateB.localeCompare(dateA);
  });

  for (const scrim of sortedScrims) {
    // Filtro de categoria (Todos, Treino, Amistoso, Campeonato)
    if (categoryFilter !== 'Todos' && scrim.category && scrim.category !== categoryFilter) {
      continue;
    }

    const games: ScrimGameDetail[] = scrim.games || [];

    if (games.length > 0) {
      for (const game of games) {
        const usPlayers: GamePlayerStats[] = game.usPlayersStats || [];
        const matchStat = usPlayers.find(p => isPlayerMatching(p.playerName, targetMember));

        if (matchStat) {
          const scoreUs = Number(game.scoreUs) || 0;
          const scoreThem = Number(game.scoreThem) || 0;
          const isVictory = scoreUs > scoreThem;
          const isDefeat = scoreThem > scoreUs;
          const isTie = scoreUs === scoreThem && (scoreUs > 0 || scoreThem > 0);

          const poke = getPokemonMeta(matchStat.pokemonId || matchStat.pokemonName);
          const isMvp = Boolean(matchStat.isMvp) || 
            Boolean(game.mvpMemberName && isPlayerMatching(game.mvpMemberName, targetMember)) ||
            Boolean(scrim.mvpMemberName && isPlayerMatching(scrim.mvpMemberName, targetMember));

          allPlayerGames.push({
            scrimId: scrim.id,
            gameNumber: game.gameNumber || 1,
            date: scrim.date || 'Data não inf.',
            time: scrim.time || '',
            opponentTeam: scrim.opponentTeam || 'Rival',
            opponentTag: scrim.opponentTag || 'RIVAL',
            category: scrim.category || 'Amistoso',
            format: scrim.format || 'MD3',
            scoreUs,
            scoreThem,
            isVictory,
            isDefeat,
            isTie,
            pokemonId: poke.id,
            pokemonName: poke.name,
            pokemonSprite: poke.sprite,
            pokemonRole: poke.role,
            kos: Number(matchStat.kos) || 0,
            assists: Number(matchStat.assists) || 0,
            points: Number(matchStat.points) || 0,
            damage: Number(matchStat.damage) || 0,
            damageTaken: Number(matchStat.damageTaken) || 0,
            healing: Number(matchStat.healing) || 0,
            isMvp,
            vodUrl: scrim.vodUrl,
            notes: game.notes || scrim.notes,
          });
        }
      }
    } else if (scrim.status === 'Concluído' && scrim.lineup && scrim.lineup.length > 0) {
      // Fallback: scrim concluída sem detalhamento de jogos, mas com o jogador na escalação
      const isInLineup = scrim.lineup.some(pName => isPlayerMatching(pName, targetMember));
      if (isInLineup) {
        const scoreUs = scrim.score?.us ?? 0;
        const scoreThem = scrim.score?.them ?? 0;
        const isVictory = scoreUs > scoreThem;
        const isDefeat = scoreThem > scoreUs;
        const isTie = scoreUs === scoreThem;

        const mainPokeId = targetMember.mainPokemon?.[0] || 'ceruledge';
        const poke = getPokemonMeta(mainPokeId);
        const isMvp = Boolean(scrim.mvpMemberName && isPlayerMatching(scrim.mvpMemberName, targetMember));

        allPlayerGames.push({
          scrimId: scrim.id,
          gameNumber: 1,
          date: scrim.date || 'Data não inf.',
          time: scrim.time || '',
          opponentTeam: scrim.opponentTeam || 'Rival',
          opponentTag: scrim.opponentTag || 'RIVAL',
          category: scrim.category || 'Amistoso',
          format: scrim.format || 'MD3',
          scoreUs,
          scoreThem,
          isVictory,
          isDefeat,
          isTie,
          pokemonId: poke.id,
          pokemonName: poke.name,
          pokemonSprite: poke.sprite,
          pokemonRole: poke.role,
          kos: 0,
          assists: 0,
          points: 0,
          damage: 0,
          damageTaken: 0,
          healing: 0,
          isMvp,
          vodUrl: scrim.vodUrl,
          notes: scrim.notes,
        });
      }
    }
  }

  const totalGames = allPlayerGames.length;
  const wins = allPlayerGames.filter(g => g.isVictory).length;
  const losses = allPlayerGames.filter(g => g.isDefeat).length;
  const draws = allPlayerGames.filter(g => g.isTie).length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  const totalMvps = allPlayerGames.filter(g => g.isMvp).length;
  const mvpRate = totalGames > 0 ? Math.round((totalMvps / totalGames) * 100) : 0;

  const totalKills = allPlayerGames.reduce((acc, g) => acc + g.kos, 0);
  const totalAssists = allPlayerGames.reduce((acc, g) => acc + g.assists, 0);
  const totalPoints = allPlayerGames.reduce((acc, g) => acc + g.points, 0);
  const totalDamage = allPlayerGames.reduce((acc, g) => acc + g.damage, 0);
  const totalDamageTaken = allPlayerGames.reduce((acc, g) => acc + g.damageTaken, 0);
  const totalHealing = allPlayerGames.reduce((acc, g) => acc + g.healing, 0);

  const avgKills = totalGames > 0 ? parseFloat((totalKills / totalGames).toFixed(1)) : 0;
  const avgAssists = totalGames > 0 ? parseFloat((totalAssists / totalGames).toFixed(1)) : 0;
  const avgKillsAndAssists = totalGames > 0 ? parseFloat(((totalKills + totalAssists) / totalGames).toFixed(1)) : 0;
  const avgPoints = totalGames > 0 ? Math.round(totalPoints / totalGames) : 0;
  const avgDamage = totalGames > 0 ? Math.round(totalDamage / totalGames) : 0;
  const avgDamageTaken = totalGames > 0 ? Math.round(totalDamageTaken / totalGames) : 0;
  const avgHealing = totalGames > 0 ? Math.round(totalHealing / totalGames) : 0;

  const maxKills = allPlayerGames.reduce((max, g) => Math.max(max, g.kos), 0);
  const maxAssists = allPlayerGames.reduce((max, g) => Math.max(max, g.assists), 0);
  const maxPoints = allPlayerGames.reduce((max, g) => Math.max(max, g.points), 0);
  const maxDamage = allPlayerGames.reduce((max, g) => Math.max(max, g.damage), 0);

  // Agrupamento por Pokémon
  const pokeMap = new Map<string, {
    pokemonId: string;
    pokemonName: string;
    pokemonSprite: string;
    role: string;
    picks: number;
    wins: number;
    losses: number;
    kills: number;
    assists: number;
    points: number;
    mvps: number;
  }>();

  allPlayerGames.forEach(g => {
    const key = g.pokemonId || g.pokemonName || 'desconhecido';
    const existing = pokeMap.get(key) || {
      pokemonId: g.pokemonId,
      pokemonName: g.pokemonName,
      pokemonSprite: g.pokemonSprite,
      role: g.pokemonRole || 'All-Rounder',
      picks: 0,
      wins: 0,
      losses: 0,
      kills: 0,
      assists: 0,
      points: 0,
      mvps: 0,
    };

    existing.picks += 1;
    if (g.isVictory) existing.wins += 1;
    if (g.isDefeat) existing.losses += 1;
    existing.kills += g.kos;
    existing.assists += g.assists;
    existing.points += g.points;
    if (g.isMvp) existing.mvps += 1;

    pokeMap.set(key, existing);
  });

  const pokemonStats: PokemonUsageStat[] = Array.from(pokeMap.values())
    .map(p => ({
      pokemonId: p.pokemonId,
      pokemonName: p.pokemonName,
      pokemonSprite: p.pokemonSprite,
      role: p.role,
      picks: p.picks,
      pickRate: totalGames > 0 ? Math.round((p.picks / totalGames) * 100) : 0,
      wins: p.wins,
      losses: p.losses,
      winRate: p.picks > 0 ? Math.round((p.wins / p.picks) * 100) : 0,
      avgKills: p.picks > 0 ? parseFloat((p.kills / p.picks).toFixed(1)) : 0,
      avgAssists: p.picks > 0 ? parseFloat((p.assists / p.picks).toFixed(1)) : 0,
      avgPoints: p.picks > 0 ? Math.round(p.points / p.picks) : 0,
      mvpCount: p.mvps,
    }))
    .sort((a, b) => b.picks - a.picks || b.winRate - a.winRate);

  const mostUsedPokemon = pokemonStats.length > 0 ? pokemonStats[0] : null;
  const recentGames = allPlayerGames.slice(0, 10);

  // Normalização do Radar (0 - 100) com referências padrão de Pokémon Unite competitivo
  // Ex: Kills 10+ = 100%, Assists 10+ = 100%, Pontos 120+ = 100%, Dano 80k+ = 100%, WinRate 100% = 100%
  const kosScore = Math.min(100, Math.round((avgKills / 10) * 100));
  const assistsScore = Math.min(100, Math.round((avgAssists / 10) * 100));
  const pointsScore = Math.min(100, Math.round((avgPoints / 120) * 100));
  const damageScore = Math.min(100, Math.round((avgDamage / 80000) * 100));
  const winRateScore = winRate;

  return {
    memberId: targetMember.id,
    playerName: targetMember.name,
    nickname: targetMember.nickname || targetMember.name,
    avatar: targetMember.avatar,
    role: targetMember.role,
    preferredLane: targetMember.preferredLane,
    gameRole: targetMember.gameRole,
    tag: targetMember.tag,
    totalGames,
    wins,
    losses,
    draws,
    winRate,
    totalMvps,
    mvpRate,
    avgKills,
    avgAssists,
    avgKillsAndAssists,
    avgPoints,
    avgDamage,
    avgDamageTaken,
    avgHealing,
    maxKills,
    maxAssists,
    maxPoints,
    maxDamage,
    mostUsedPokemon,
    pokemonStats,
    recentGames,
    allGames: allPlayerGames,
    radar: {
      kosScore,
      assistsScore,
      pointsScore,
      damageScore,
      winRateScore,
    },
  };
}

/**
 * Gerador de partidas de teste / demonstração realistas da Friba Esports
 * Permite que o usuário teste imediatamente o painel com gráficos preenchidos se o banco estiver vazio.
 */
export function generateDemoScrims(members: TeamMember[]): ScrimEvent[] {
  const starters = members.filter(m => m.role === 'Jogador');
  const rosterNames = starters.length > 0 
    ? starters.map(m => m.nickname || m.name) 
    : ['Kauan', 'Zeus', 'Shadow', 'Spark', 'Titan'];

  const ensurePlayer = (idx: number, fallback: string) => rosterNames[idx] || fallback;

  const p1 = ensurePlayer(0, 'Kauan');
  const p2 = ensurePlayer(1, 'Zeus');
  const p3 = ensurePlayer(2, 'Shadow');
  const p4 = ensurePlayer(3, 'Spark');
  const p5 = ensurePlayer(4, 'Titan');

  return [
    {
      id: 'demo-scrim-1',
      opponentTeam: 'Alpha Esports',
      opponentTag: 'ALP',
      date: '2026-10-18',
      time: '20:00',
      format: 'MD3',
      status: 'Concluído',
      category: 'Treino',
      lineup: [p1, p2, p3, p4, p5],
      score: { us: 2, them: 1 },
      mvpMemberName: p1,
      vodUrl: 'https://youtube.com',
      notes: 'Ótima rotação no Rayquaza com Ceruledge finalizando as lutas.',
      games: [
        {
          gameNumber: 1,
          scoreUs: 640,
          scoreThem: 410,
          mvpMemberName: p1,
          usPlayersStats: [
            { playerName: p1, playerTag: 'FRIBA', pokemonId: 'ceruledge', pokemonName: 'Ceruledge', kos: 11, assists: 7, points: 140, damage: 89400, damageTaken: 42000, healing: 12000, isMvp: true },
            { playerName: p2, playerTag: 'FRIBA', pokemonId: 'blastoise', pokemonName: 'Blastoise', kos: 4, assists: 12, points: 110, damage: 45000, damageTaken: 92000, healing: 8000, isMvp: false },
            { playerName: p3, playerTag: 'FRIBA', pokemonId: 'mew', pokemonName: 'Mew', kos: 6, assists: 9, points: 90, damage: 72000, damageTaken: 31000, healing: 4000, isMvp: false },
            { playerName: p4, playerTag: 'FRIBA', pokemonId: 'eldegoss', pokemonName: 'Eldegoss', kos: 1, assists: 14, points: 120, damage: 32000, damageTaken: 38000, healing: 68000, isMvp: false },
            { playerName: p5, playerTag: 'FRIBA', pokemonId: 'zoroark', pokemonName: 'Zoroark', kos: 8, assists: 5, points: 180, damage: 64000, damageTaken: 39000, healing: 6000, isMvp: false },
          ]
        },
        {
          gameNumber: 2,
          scoreUs: 380,
          scoreThem: 590,
          mvpMemberName: 'AlphaJungler',
          usPlayersStats: [
            { playerName: p1, playerTag: 'FRIBA', pokemonId: 'blaziken', pokemonName: 'Blaziken', kos: 5, assists: 4, points: 80, damage: 68000, damageTaken: 54000, healing: 9000, isMvp: false },
            { playerName: p2, playerTag: 'FRIBA', pokemonId: 'slowbro', pokemonName: 'Slowbro', kos: 2, assists: 6, points: 60, damage: 38000, damageTaken: 88000, healing: 34000, isMvp: false },
            { playerName: p3, playerTag: 'FRIBA', pokemonId: 'glaceon', pokemonName: 'Glaceon', kos: 7, assists: 3, points: 70, damage: 79000, damageTaken: 34000, healing: 0, isMvp: false },
            { playerName: p4, playerTag: 'FRIBA', pokemonId: 'clefable', pokemonName: 'Clefable', kos: 0, assists: 8, points: 50, damage: 24000, damageTaken: 45000, healing: 72000, isMvp: false },
            { playerName: p5, playerTag: 'FRIBA', pokemonId: 'dodrio', pokemonName: 'Dodrio', kos: 4, assists: 2, points: 120, damage: 51000, damageTaken: 36000, healing: 4000, isMvp: false },
          ]
        },
        {
          gameNumber: 3,
          scoreUs: 720,
          scoreThem: 350,
          mvpMemberName: p1,
          usPlayersStats: [
            { playerName: p1, playerTag: 'FRIBA', pokemonId: 'ceruledge', pokemonName: 'Ceruledge', kos: 13, assists: 8, points: 190, damage: 104000, damageTaken: 39000, healing: 15000, isMvp: true },
            { playerName: p2, playerTag: 'FRIBA', pokemonId: 'trevenant', pokemonName: 'Trevenant', kos: 3, assists: 11, points: 100, damage: 49000, damageTaken: 96000, healing: 42000, isMvp: false },
            { playerName: p3, playerTag: 'FRIBA', pokemonId: 'gardevoir', pokemonName: 'Gardevoir', kos: 9, assists: 6, points: 110, damage: 91000, damageTaken: 28000, healing: 0, isMvp: false },
            { playerName: p4, playerTag: 'FRIBA', pokemonId: 'hoopa', pokemonName: 'Hoopa', kos: 2, assists: 13, points: 140, damage: 36000, damageTaken: 32000, healing: 51000, isMvp: false },
            { playerName: p5, playerTag: 'FRIBA', pokemonId: 'zoroark', pokemonName: 'Zoroark', kos: 7, assists: 4, points: 180, damage: 61000, damageTaken: 35000, healing: 5000, isMvp: false },
          ]
        }
      ]
    },
    {
      id: 'demo-scrim-2',
      opponentTeam: 'Vortex Gaming',
      opponentTag: 'VTX',
      date: '2026-10-17',
      time: '19:30',
      format: 'MD3',
      status: 'Concluído',
      category: 'Campeonato',
      lineup: [p1, p2, p3, p4, p5],
      score: { us: 2, them: 0 },
      mvpMemberName: p1,
      notes: 'Classificatória do torneio regional. Vitória limpa 2x0.',
      games: [
        {
          gameNumber: 1,
          scoreUs: 580,
          scoreThem: 420,
          mvpMemberName: p1,
          usPlayersStats: [
            { playerName: p1, playerTag: 'FRIBA', pokemonId: 'ceruledge', pokemonName: 'Ceruledge', kos: 9, assists: 6, points: 130, damage: 82000, damageTaken: 44000, healing: 11000, isMvp: true },
            { playerName: p2, playerTag: 'FRIBA', pokemonId: 'blastoise', pokemonName: 'Blastoise', kos: 3, assists: 10, points: 90, damage: 41000, damageTaken: 89000, healing: 7000, isMvp: false },
            { playerName: p3, playerTag: 'FRIBA', pokemonId: 'delphox', pokemonName: 'Delphox', kos: 8, assists: 7, points: 100, damage: 84000, damageTaken: 29000, healing: 0, isMvp: false },
            { playerName: p4, playerTag: 'FRIBA', pokemonId: 'eldegoss', pokemonName: 'Eldegoss', kos: 1, assists: 12, points: 110, damage: 29000, damageTaken: 35000, healing: 61000, isMvp: false },
            { playerName: p5, playerTag: 'FRIBA', pokemonId: 'leafeon', pokemonName: 'Leafeon', kos: 6, assists: 5, points: 150, damage: 59000, damageTaken: 38000, healing: 4000, isMvp: false },
          ]
        },
        {
          gameNumber: 2,
          scoreUs: 690,
          scoreThem: 310,
          mvpMemberName: p5,
          usPlayersStats: [
            { playerName: p1, playerTag: 'FRIBA', pokemonId: 'lucario', pokemonName: 'Lucario', kos: 8, assists: 9, points: 160, damage: 78000, damageTaken: 47000, healing: 8000, isMvp: false },
            { playerName: p2, playerTag: 'FRIBA', pokemonId: 'umberon', pokemonName: 'Umbreon', kos: 2, assists: 11, points: 80, damage: 36000, damageTaken: 91000, healing: 22000, isMvp: false },
            { playerName: p3, playerTag: 'FRIBA', pokemonId: 'inteleon', pokemonName: 'Inteleon', kos: 9, assists: 4, points: 110, damage: 92000, damageTaken: 26000, healing: 0, isMvp: false },
            { playerName: p4, playerTag: 'FRIBA', pokemonId: 'blissey', pokemonName: 'Blissey', kos: 1, assists: 15, points: 90, damage: 22000, damageTaken: 41000, healing: 85000, isMvp: false },
            { playerName: p5, playerTag: 'FRIBA', pokemonId: 'leafeon', pokemonName: 'Leafeon', kos: 12, assists: 4, points: 250, damage: 88000, damageTaken: 32000, healing: 5000, isMvp: true },
          ]
        }
      ]
    },
    {
      id: 'demo-scrim-3',
      opponentTeam: 'Titanium Esports',
      opponentTag: 'TTN',
      date: '2026-10-15',
      time: '21:00',
      format: 'MD1',
      status: 'Concluído',
      category: 'Amistoso',
      lineup: [p1, p2, p3, p4, p5],
      score: { us: 1, them: 0 },
      mvpMemberName: p1,
      games: [
        {
          gameNumber: 1,
          scoreUs: 810,
          scoreThem: 290,
          mvpMemberName: p1,
          usPlayersStats: [
            { playerName: p1, playerTag: 'FRIBA', pokemonId: 'ceruledge', pokemonName: 'Ceruledge', kos: 14, assists: 5, points: 220, damage: 112000, damageTaken: 38000, healing: 17000, isMvp: true },
            { playerName: p2, playerTag: 'FRIBA', pokemonId: 'crustle', pokemonName: 'Crustle', kos: 4, assists: 9, points: 140, damage: 44000, damageTaken: 86000, healing: 0, isMvp: false },
            { playerName: p3, playerTag: 'FRIBA', pokemonId: 'chandelure', pokemonName: 'Chandelure', kos: 7, assists: 8, points: 120, damage: 85000, damageTaken: 29000, healing: 0, isMvp: false },
            { playerName: p4, playerTag: 'FRIBA', pokemonId: 'comfey', pokemonName: 'Comfey', kos: 0, assists: 18, points: 70, damage: 18000, damageTaken: 19000, healing: 92000, isMvp: false },
            { playerName: p5, playerTag: 'FRIBA', pokemonId: 'zoroark', pokemonName: 'Zoroark', kos: 9, assists: 6, points: 260, damage: 76000, damageTaken: 31000, healing: 6000, isMvp: false },
          ]
        }
      ]
    }
  ];
}

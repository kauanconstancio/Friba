import type { OpponentTeam, ScrimEvent } from '../types';

export interface RivalStats {
  team: OpponentTeam;
  isRegistered: boolean;
  totalSeries: number;
  completedSeries: number;
  seriesWon: number;
  seriesLost: number;
  seriesDrawn: number;
  seriesWinRate: number; // 0 - 100
  totalGames: number;
  gamesWon: number;
  gamesLost: number;
  gamesWinRate: number; // 0 - 100
  totalPointsUs: number;
  totalPointsThem: number;
  pointDiff: number;
  avgPointDiff: number;
  lastMatch: ScrimEvent | null;
  lastPlayedDate: string | null;
  streak: string; // Ex: "3V", "2D", "-"
  streakType: 'win' | 'loss' | 'draw' | 'none';
  recentMatches: ScrimEvent[];
  mostFrequentFormat: string;
  categoriesBreakdown: { treinos: number; amistosos: number; campeonatos: number };
  rivalPokemonPlayed: { pokemonId: string; name: string; count: number }[];
  fribaPokemonPlayed: { pokemonId: string; name: string; count: number; winRate: number }[];
}

export interface RivalsGlobalSummary {
  totalRivals: number;
  totalSeriesPlayed: number;
  totalSeriesWon: number;
  totalSeriesLost: number;
  overallWinRate: number;
  mostFrequentRival: { name: string; tag: string; count: number } | null;
  highestWinRateRival: { name: string; tag: string; winRate: number; count: number } | null;
  toughestRival: { name: string; tag: string; winRate: number; count: number } | null;
  totalPointsDifferential: number;
}

const normalize = (val?: string): string => {
  if (!val) return '';
  return val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[@#]/g, '')
    .trim();
};

/**
 * Verifica se um evento de scrim corresponde à equipe rival
 */
export const isScrimMatchingRival = (scrim: ScrimEvent, rival: OpponentTeam): boolean => {
  if (scrim.opponentTeamId && scrim.opponentTeamId === rival.id) {
    return true;
  }

  const normRivalName = normalize(rival.name);
  const normRivalTag = normalize(rival.tag);
  const normScrimTeam = normalize(scrim.opponentTeam);
  const normScrimTag = normalize(scrim.opponentTag);

  if (normRivalName && normScrimTeam === normRivalName) return true;
  if (normRivalTag && normScrimTag && normRivalTag === normScrimTag) return true;

  if (normRivalName && normScrimTeam.includes(normRivalName)) return true;
  if (normScrimTeam && normRivalName.includes(normScrimTeam)) return true;

  return false;
};

/**
 * Calcula todas as estatísticas analíticas de um rival específico contra a Friba
 */
export const calculateRivalStats = (
  rival: OpponentTeam,
  scrims: ScrimEvent[],
  isRegistered = true
): RivalStats => {
  const matches = scrims.filter(s => isScrimMatchingRival(s, rival));

  // Ordena por data decrescente (mais recente primeiro)
  const sortedMatches = [...matches].sort((a, b) => {
    const dateA = (a.date || '') + ' ' + (a.time || '');
    const dateB = (b.date || '') + ' ' + (b.time || '');
    return dateB.localeCompare(dateA);
  });

  const completedMatches = sortedMatches.filter(s => s.status === 'Concluído');

  let seriesWon = 0;
  let seriesLost = 0;
  let seriesDrawn = 0;

  let totalGames = 0;
  let gamesWon = 0;
  let gamesLost = 0;

  let totalPointsUs = 0;
  let totalPointsThem = 0;

  const formatCounts: Record<string, number> = {};
  const categoriesBreakdown = { treinos: 0, amistosos: 0, campeonatos: 0 };

  const rivalPokeMap: Record<string, { count: number; name: string }> = {};
  const fribaPokeMap: Record<string, { count: number; wins: number; name: string }> = {};

  completedMatches.forEach(scrim => {
    // 1. Contabilização de Séries
    const scoreUs = scrim.score?.us ?? 0;
    const scoreThem = scrim.score?.them ?? 0;

    if (scoreUs > scoreThem) {
      seriesWon++;
    } else if (scoreUs < scoreThem) {
      seriesLost++;
    } else {
      seriesDrawn++;
    }

    // 2. Formato e Categoria
    const fmt = scrim.format || 'MD3';
    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;

    const cat = scrim.category || 'Treino';
    if (cat === 'Treino') categoriesBreakdown.treinos++;
    else if (cat === 'Amistoso') categoriesBreakdown.amistosos++;
    else if (cat === 'Campeonato') categoriesBreakdown.campeonatos++;

    // 3. Contabilização de Jogos Individuais & Pontuação
    if (scrim.games && scrim.games.length > 0) {
      scrim.games.forEach(g => {
        totalGames++;
        const gUs = g.scoreUs ?? 0;
        const gThem = g.scoreThem ?? 0;
        totalPointsUs += gUs;
        totalPointsThem += gThem;

        const isGameWin = gUs > gThem;
        if (isGameWin) gamesWon++;
        else gamesLost++;

        // Pokémon da Friba nesta partida
        if (g.usPlayersStats) {
          g.usPlayersStats.forEach(p => {
            if (p.pokemonId) {
              const pid = p.pokemonId.toLowerCase();
              const pname = p.pokemonName || p.pokemonId;
              if (!fribaPokeMap[pid]) {
                fribaPokeMap[pid] = { count: 0, wins: 0, name: pname };
              }
              fribaPokeMap[pid].count++;
              if (isGameWin) fribaPokeMap[pid].wins++;
            }
          });
        }

        // Pokémon do Rival nesta partida
        if (g.themPlayersStats) {
          g.themPlayersStats.forEach(p => {
            if (p.pokemonId) {
              const pid = p.pokemonId.toLowerCase();
              const pname = p.pokemonName || p.pokemonId;
              if (!rivalPokeMap[pid]) {
                rivalPokeMap[pid] = { count: 0, name: pname };
              }
              rivalPokeMap[pid].count++;
            }
          });
        }
      });
    } else {
      // Fallback para quando não há games individuais detalhados
      const gUs = scoreUs;
      const gThem = scoreThem;
      totalGames += (gUs + gThem);
      gamesWon += gUs;
      gamesLost += gThem;
    }
  });

  const completedSeries = completedMatches.length;
  const seriesWinRate = completedSeries > 0 ? Math.round((seriesWon / completedSeries) * 100) : 0;
  const gamesWinRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;
  const pointDiff = totalPointsUs - totalPointsThem;
  const avgPointDiff = totalGames > 0 ? Math.round(pointDiff / totalGames) : 0;

  // Cálculo da Streak recente
  let streak = '-';
  let streakType: 'win' | 'loss' | 'draw' | 'none' = 'none';

  if (completedMatches.length > 0) {
    const firstMatch = completedMatches[0];
    const firstScoreUs = firstMatch.score?.us ?? 0;
    const firstScoreThem = firstMatch.score?.them ?? 0;

    if (firstScoreUs > firstScoreThem) {
      streakType = 'win';
    } else if (firstScoreUs < firstScoreThem) {
      streakType = 'loss';
    } else {
      streakType = 'draw';
    }

    let count = 0;
    for (const match of completedMatches) {
      const u = match.score?.us ?? 0;
      const t = match.score?.them ?? 0;
      let currentType: 'win' | 'loss' | 'draw' = 'draw';
      if (u > t) currentType = 'win';
      else if (u < t) currentType = 'loss';

      if (currentType === streakType) {
        count++;
      } else {
        break;
      }
    }

    if (streakType === 'win') streak = `${count}V`;
    else if (streakType === 'loss') streak = `${count}D`;
    else streak = `${count}E`;
  }

  // Formato mais frequente
  let mostFrequentFormat = 'MD3';
  let maxFormatCount = -1;
  Object.entries(formatCounts).forEach(([fmt, cnt]) => {
    if (cnt > maxFormatCount) {
      maxFormatCount = cnt;
      mostFrequentFormat = fmt;
    }
  });

  // Lista de Pokémon do rival mais enfrentados
  const rivalPokemonPlayed = Object.entries(rivalPokeMap)
    .map(([pokemonId, data]) => ({
      pokemonId,
      name: data.name,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Lista de Pokémon da Friba com melhor aproveitamento contra esse rival
  const fribaPokemonPlayed = Object.entries(fribaPokeMap)
    .map(([pokemonId, data]) => ({
      pokemonId,
      name: data.name,
      count: data.count,
      winRate: data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || b.winRate - a.winRate)
    .slice(0, 8);

  return {
    team: rival,
    isRegistered,
    totalSeries: matches.length,
    completedSeries,
    seriesWon,
    seriesLost,
    seriesDrawn,
    seriesWinRate,
    totalGames,
    gamesWon,
    gamesLost,
    gamesWinRate,
    totalPointsUs,
    totalPointsThem,
    pointDiff,
    avgPointDiff,
    lastMatch: sortedMatches[0] || null,
    lastPlayedDate: sortedMatches[0]?.date || null,
    streak,
    streakType,
    recentMatches: sortedMatches,
    mostFrequentFormat,
    categoriesBreakdown,
    rivalPokemonPlayed,
    fribaPokemonPlayed,
  };
};

/**
 * Descobre adversários que foram registrados em scrims mas ainda não estão cadastrados na lista oficial de oponentes
 */
export const discoverUnregisteredRivals = (
  registeredTeams: OpponentTeam[],
  scrims: ScrimEvent[]
): OpponentTeam[] => {
  const discoveredMap = new Map<string, OpponentTeam>();

  scrims.forEach(s => {
    const oppName = s.opponentTeam?.trim();
    if (!oppName) return;

    // Se já estiver cadastrado na lista de oponentes, ignora
    const isAlreadyRegistered = registeredTeams.some(reg => isScrimMatchingRival(s, reg));
    if (isAlreadyRegistered) return;

    const normKey = normalize(oppName);
    if (!discoveredMap.has(normKey)) {
      discoveredMap.set(normKey, {
        id: `unreg-${normKey.replace(/\s+/g, '-')}`,
        name: oppName,
        tag: s.opponentTag || oppName.substring(0, 3).toUpperCase(),
        contact: s.opponentContact,
        players: s.opponentPlayers || [],
        notes: s.notes,
        tier: 'Rival Direto',
        createdAt: s.date || new Date().toISOString(),
      });
    }
  });

  return Array.from(discoveredMap.values());
};

/**
 * Calcula o sumário global de confronto da Friba contra todos os rivais
 */
export const calculateRivalsGlobalSummary = (rivalStatsList: RivalStats[]): RivalsGlobalSummary => {
  let totalSeriesPlayed = 0;
  let totalSeriesWon = 0;
  let totalSeriesLost = 0;
  let totalPointsDifferential = 0;

  let mostFrequentRival: { name: string; tag: string; count: number } | null = null;
  let highestWinRateRival: { name: string; tag: string; winRate: number; count: number } | null = null;
  let toughestRival: { name: string; tag: string; winRate: number; count: number } | null = null;

  rivalStatsList.forEach(stat => {
    totalSeriesPlayed += stat.completedSeries;
    totalSeriesWon += stat.seriesWon;
    totalSeriesLost += stat.seriesLost;
    totalPointsDifferential += stat.pointDiff;

    // Mais enfrentado
    if (!mostFrequentRival || stat.completedSeries > mostFrequentRival.count) {
      if (stat.completedSeries > 0) {
        mostFrequentRival = {
          name: stat.team.name,
          tag: stat.team.tag,
          count: stat.completedSeries,
        };
      }
    }

    // Maior taxa de vitória (com pelo menos 1 jogo)
    if (stat.completedSeries > 0) {
      if (!highestWinRateRival || stat.seriesWinRate > highestWinRateRival.winRate) {
        highestWinRateRival = {
          name: stat.team.name,
          tag: stat.team.tag,
          winRate: stat.seriesWinRate,
          count: stat.completedSeries,
        };
      }

      // Mais difícil (menor win rate da Friba com pelo menos 1 jogo)
      if (!toughestRival || stat.seriesWinRate < toughestRival.winRate) {
        toughestRival = {
          name: stat.team.name,
          tag: stat.team.tag,
          winRate: stat.seriesWinRate,
          count: stat.completedSeries,
        };
      }
    }
  });

  const overallWinRate = totalSeriesPlayed > 0 
    ? Math.round((totalSeriesWon / totalSeriesPlayed) * 100) 
    : 0;

  return {
    totalRivals: rivalStatsList.length,
    totalSeriesPlayed,
    totalSeriesWon,
    totalSeriesLost,
    overallWinRate,
    mostFrequentRival,
    highestWinRateRival,
    toughestRival,
    totalPointsDifferential,
  };
};

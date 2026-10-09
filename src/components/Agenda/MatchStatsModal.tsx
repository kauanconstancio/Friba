import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Crown, 
  Plus, 
  Trash2, 
  Search, 
  Edit3, 
  Check,
  Tv,
  Play,
  Sparkles
} from 'lucide-react';
import type { ScrimEvent, ScrimGameDetail, GamePlayerStats, TeamMember } from '../../types';
import { POKEMON_ROSTER } from '../../data/pokemonData';

interface MatchStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scrim: ScrimEvent;
  teamName: string;
  canEdit?: boolean;
  onSaveStats?: (updatedScrim: ScrimEvent) => void;
  members?: TeamMember[];
}

export const MatchStatsModal: React.FC<MatchStatsModalProps> = ({
  isOpen,
  onClose,
  scrim,
  teamName,
  canEdit = true,
  onSaveStats,
  members = [],
}) => {
  const totalGamesCount = Math.max(1, scrim.games?.length || (scrim.format === 'MD5' ? 5 : scrim.format === 'MD3' ? 3 : 1));
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [isEditing, setIsEditing] = useState<boolean>(() => Boolean(canEdit));

  // Estados dos campos integrados da partida / relatório
  const [vodUrl, setVodUrl] = useState(scrim.vodUrl || '');
  const [resultNotes, setResultNotes] = useState(scrim.notes || '');
  const [selectedMvp, setSelectedMvp] = useState(scrim.mvpMemberName || '');

  // Pokemon Picker Popover State
  const [pokePickerOpen, setPokePickerOpen] = useState<{
    side: 'us' | 'them';
    playerIdx: number;
  } | null>(null);
  const [pokeSearch, setPokeSearch] = useState('');

  // Helper para obter o Nick In-Game (IGN) do atleta em vez do nome cadastrado
  const getPlayerNick = (rawName: string): string => {
    if (!rawName) return '';
    const clean = rawName.trim().toLowerCase();
    const found = members.find(m => 
      (m.name && m.name.trim().toLowerCase() === clean) || 
      (m.nickname && m.nickname.trim().toLowerCase() === clean) ||
      (m.inGameId && m.inGameId.trim().toLowerCase() === clean)
    );
    if (found && found.nickname) {
      return found.nickname;
    }
    return rawName;
  };

  // Fallback de jogadores nossos convertidos para Nick In-Game
  const defaultUsPlayers = useMemo(() => {
    let baseList: string[] = [];
    if (scrim.lineup && scrim.lineup.length > 0) {
      baseList = scrim.lineup.slice(0, 5).map(p => getPlayerNick(p));
    } else {
      const starters = members.filter(m => m.role === 'Jogador' && m.status === 'Titular');
      if (starters.length > 0) {
        baseList = starters.slice(0, 5).map(m => m.nickname || m.name);
      } else if (members.length > 0) {
        baseList = members.slice(0, 5).map(m => m.nickname || m.name);
      }
    }
    if (baseList.length < 5) {
      const needed = 5 - baseList.length;
      for (let i = 1; i <= needed; i++) {
        baseList.push(`Atleta ${baseList.length + 1}`);
      }
    }
    return baseList;
  }, [scrim.lineup, members]);

  // Fallback de jogadores oponentes
  const defaultThemPlayers = useMemo(() => {
    if (scrim.opponentPlayers && scrim.opponentPlayers.length > 0) {
      return scrim.opponentPlayers.slice(0, 5);
    }
    return ['Rival 1', 'Rival 2', 'Rival 3', 'Rival 4', 'Rival 5'];
  }, [scrim.opponentPlayers]);

  // Gerar dados para cada partida e garantir que pontuações totais sejam somadas dos jogadores
  const initializeGame = (gameNum: number, existing?: ScrimGameDetail): ScrimGameDetail => {
    if (existing && existing.usPlayersStats && existing.usPlayersStats.length > 0) {
      const computedUs = (existing.usPlayersStats || []).reduce((acc, curr) => acc + (parseInt(String(curr.points), 10) || 0), 0);
      const computedThem = (existing.themPlayersStats || []).reduce((acc, curr) => acc + (parseInt(String(curr.points), 10) || 0), 0);
      
      // Converte playerName existente para Nick In-Game caso tenha sido salvo com nome civil cadastrado
      const mappedUsStats = (existing.usPlayersStats || []).map((stat, idx) => ({
        ...stat,
        playerName: getPlayerNick(stat.playerName || defaultUsPlayers[idx] || `Atleta ${idx + 1}`),
      }));

      return {
        ...existing,
        scoreUs: computedUs > 0 ? computedUs : (existing.scoreUs || 0),
        scoreThem: computedThem > 0 ? computedThem : (existing.scoreThem || 0),
        usPlayersStats: mappedUsStats,
      };
    }

    const defaultTeamTag = teamName ? teamName.split(' ')[0].toUpperCase() : 'FRIBA';
    const oppTeamTag = scrim.opponentTag || 'RIVAL';

    const usStats: GamePlayerStats[] = defaultUsPlayers.map((pName) => ({
      playerName: getPlayerNick(pName),
      playerTag: defaultTeamTag,
      pokemonId: '',
      pokemonName: '',
      pokemonSprite: '',
      kos: 0,
      assists: 0,
      damage: '0',
      damageTaken: '0',
      healing: '0',
      points: 0,
      isMvp: false,
    }));

    const themStats: GamePlayerStats[] = defaultThemPlayers.map((pName) => ({
      playerName: pName,
      playerTag: oppTeamTag,
      pokemonId: '',
      pokemonName: '',
      pokemonSprite: '',
      kos: 0,
      assists: 0,
      damage: '0',
      damageTaken: '0',
      healing: '0',
      points: 0,
      isMvp: false,
    }));

    const computedUs = usStats.reduce((acc, curr) => acc + (parseInt(String(curr.points), 10) || 0), 0);
    const computedThem = themStats.reduce((acc, curr) => acc + (parseInt(String(curr.points), 10) || 0), 0);

    return {
      gameNumber: gameNum,
      scoreUs: existing?.scoreUs || computedUs,
      scoreThem: existing?.scoreThem || computedThem,
      usPlayersStats: usStats,
      themPlayersStats: themStats,
      notes: existing?.notes || '',
    };
  };

  const [gamesList, setGamesList] = useState<ScrimGameDetail[]>(() => {
    if (scrim.games && scrim.games.length > 0) {
      return scrim.games.map((g, idx) => initializeGame(g.gameNumber || idx + 1, g));
    }
    const list: ScrimGameDetail[] = [];
    for (let i = 1; i <= totalGamesCount; i++) {
      list.push(initializeGame(i));
    }
    return list;
  });

  // Atualizar dados internos quando a scrim mudar ou modal for aberto
  useEffect(() => {
    if (scrim && isOpen) {
      setVodUrl(scrim.vodUrl || '');
      setResultNotes(scrim.notes || '');
      setSelectedMvp(scrim.mvpMemberName || '');
      if (scrim.games && scrim.games.length > 0) {
        setGamesList(scrim.games.map((g, idx) => initializeGame(g.gameNumber || idx + 1, g)));
      } else {
        const list: ScrimGameDetail[] = [];
        const count = Math.max(1, scrim.format === 'MD5' ? 5 : scrim.format === 'MD3' ? 3 : 1);
        for (let i = 1; i <= count; i++) {
          list.push(initializeGame(i));
        }
        setGamesList(list);
      }
      setIsEditing(Boolean(canEdit));
      setActiveGameIdx(0);
    }
  }, [scrim.id, isOpen, canEdit]);

  if (!isOpen) return null;

  const currentGame = gamesList[activeGameIdx] || gamesList[0];

  // Alternar Pokémon de um jogador
  const handleSelectPokemon = (pokeId: string) => {
    if (!pokePickerOpen) return;
    const poke = POKEMON_ROSTER.find(p => p.id === pokeId);
    if (!poke) return;

    setGamesList(prev => {
      const copy = [...prev];
      const g = { ...copy[activeGameIdx] };
      if (pokePickerOpen.side === 'us') {
        const stats = [...(g.usPlayersStats || [])];
        stats[pokePickerOpen.playerIdx] = {
          ...stats[pokePickerOpen.playerIdx],
          pokemonId: poke.id,
          pokemonName: poke.name,
          pokemonSprite: poke.sprite,
        };
        g.usPlayersStats = stats;
      } else {
        const stats = [...(g.themPlayersStats || [])];
        stats[pokePickerOpen.playerIdx] = {
          ...stats[pokePickerOpen.playerIdx],
          pokemonId: poke.id,
          pokemonName: poke.name,
          pokemonSprite: poke.sprite,
        };
        g.themPlayersStats = stats;
      }
      copy[activeGameIdx] = g;
      return copy;
    });

    setPokePickerOpen(null);
    setPokeSearch('');
  };

  // Atualizar campo estatístico de um jogador com recálculo automático de PTS
  const handleUpdatePlayerStat = (
    side: 'us' | 'them',
    playerIdx: number,
    field: keyof GamePlayerStats,
    val: any
  ) => {
    setGamesList(prev => {
      const copy = [...prev];
      const g = { ...copy[activeGameIdx] };
      const listKey = side === 'us' ? 'usPlayersStats' : 'themPlayersStats';
      const stats = [...(g[listKey] || [])];

      if (field === 'isMvp') {
        // Apenas 1 MVP por time na partida
        stats.forEach((s, idx) => {
          s.isMvp = idx === playerIdx ? !s.isMvp : false;
        });
        if (side === 'us' && !selectedMvp && stats[playerIdx]?.isMvp) {
          setSelectedMvp(stats[playerIdx].playerName);
        }
      } else {
        stats[playerIdx] = {
          ...stats[playerIdx],
          [field]: val,
        };
      }

      // Se o campo atualizado foi 'points', calcula automaticamente a soma total da equipe
      if (field === 'points') {
        const sumPoints = stats.reduce((acc, curr) => acc + (parseInt(String(curr.points), 10) || 0), 0);
        if (side === 'us') {
          g.scoreUs = sumPoints;
        } else {
          g.scoreThem = sumPoints;
        }
      }

      g[listKey] = stats;
      copy[activeGameIdx] = g;
      return copy;
    });
  };

  // Adicionar partida à série
  const handleAddGame = () => {
    const nextGameNum = gamesList.length + 1;
    const newGame = initializeGame(nextGameNum);
    setGamesList(prev => [...prev, newGame]);
    setActiveGameIdx(gamesList.length);
  };

  // Remover partida
  const handleRemoveGame = (idxToRemove: number) => {
    if (gamesList.length <= 1) return;
    setGamesList(prev => prev.filter((_, idx) => idx !== idxToRemove));
    if (activeGameIdx >= gamesList.length - 1) {
      setActiveGameIdx(Math.max(0, gamesList.length - 2));
    }
  };

  // Cálculos automáticos da partida ativa (Aeos Points)
  const currentScoreUs = Number(currentGame?.scoreUs) || 0;
  const currentScoreThem = Number(currentGame?.scoreThem) || 0;
  const isGamePlayed = currentScoreUs > 0 || currentScoreThem > 0;
  const usWonCurrent = currentScoreUs > currentScoreThem;
  const themWonCurrent = currentScoreThem > currentScoreUs;
  const isTieCurrent = currentScoreUs === currentScoreThem && isGamePlayed;

  // Vitórias da série inteira calculadas jogo a jogo
  const seriesUsWins = gamesList.filter(g => {
    const us = Number(g.scoreUs) || 0;
    const them = Number(g.scoreThem) || 0;
    return us > them && (us > 0 || them > 0);
  }).length;

  const seriesThemWins = gamesList.filter(g => {
    const us = Number(g.scoreUs) || 0;
    const them = Number(g.scoreThem) || 0;
    return them > us && (us > 0 || them > 0);
  }).length;

  const hasAnyGamePlayed = gamesList.some(g => (Number(g.scoreUs) || 0) > 0 || (Number(g.scoreThem) || 0) > 0);

  // Salvar alterações e concluir relatório
  const handleSaveAll = () => {
    // Garantir que todos os usPlayersStats estejam salvos com o nick in-game
    const finalizedGames = gamesList.map(g => ({
      ...g,
      usPlayersStats: (g.usPlayersStats || []).map(p => ({
        ...p,
        playerName: getPlayerNick(p.playerName)
      }))
    }));

    const updatedScrim: ScrimEvent = {
      ...scrim,
      status: hasAnyGamePlayed ? 'Concluído' : scrim.status,
      games: finalizedGames,
      score: { us: seriesUsWins, them: seriesThemWins },
      vodUrl: vodUrl.trim() || undefined,
      notes: resultNotes.trim() || scrim.notes,
      mvpMemberName: selectedMvp ? getPlayerNick(selectedMvp.trim()) : undefined,
    };

    if (onSaveStats) {
      onSaveStats(updatedScrim);
    }
    onClose();
  };

  const filteredPokemons = useMemo(() => {
    if (!pokeSearch.trim()) return POKEMON_ROSTER.slice(0, 40);
    const q = pokeSearch.toLowerCase();
    return POKEMON_ROSTER.filter(p => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
  }, [pokeSearch]);

  return createPortal(
    <div className="modal-overlay match-stats-backdrop" onClick={onClose}>
      <div className="modal-content match-stats-card-main" onClick={(e) => e.stopPropagation()}>
        {/* ========================================================================= */}
        {/* 1. TOPO FIXO: HEADER COM TÍTULO E FECHAR */}
        {/* ========================================================================= */}
        <div className="match-stats-header">
          <div>
            <div className="stats-header-tag-row">
              <span className="stats-tag-badge">RELATÓRIO UNIFICADO</span>
              <span className="stats-category-badge">{scrim.category || 'Amistoso'}</span>
              <span className="stats-format-badge">{scrim.format}</span>
            </div>
            <h2 className="match-stats-title">Relatório & Estatísticas da Scrim</h2>
            <p className="match-stats-sub">
              Série vs <strong>{scrim.opponentTeam}</strong> • {scrim.date} às {scrim.time}
            </p>
          </div>
          <button type="button" className="close-stats-btn" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. BARRA FIXA: ABAS DOS JOGOS (JOGO 1, JOGO 2...) E AÇÕES DE EDIÇÃO */}
        {/* ========================================================================= */}
        <div className="match-games-tabs-bar">
          <div className="match-games-pills-list">
            {gamesList.map((g, idx) => {
              const isActive = activeGameIdx === idx;
              const gUs = Number(g.scoreUs) || 0;
              const gThem = Number(g.scoreThem) || 0;
              const isPlayed = gUs > 0 || gThem > 0;
              const won = gUs > gThem;

              return (
                <button
                  type="button"
                  key={idx}
                  className={`game-nav-pill ${isActive ? 'active' : ''} ${isPlayed ? (won ? 'game-win' : 'game-loss') : ''}`}
                  onClick={() => setActiveGameIdx(idx)}
                >
                  JOGO {g.gameNumber || idx + 1}
                  {isPlayed && (
                    <span className="game-pill-score-indicator">
                      {won ? ' (V)' : gThem > gUs ? ' (D)' : ' (E)'}
                    </span>
                  )}
                </button>
              );
            })}

            {isEditing && (
              <button type="button" className="add-game-pill-btn" onClick={handleAddGame} title="Adicionar Jogo à Série">
                <Plus size={13} /> JOGO
              </button>
            )}

            {isEditing && gamesList.length > 1 && (
              <button 
                type="button" 
                className="add-game-pill-btn danger" 
                onClick={() => handleRemoveGame(activeGameIdx)} 
                title="Excluir Jogo Ativo"
              >
                <Trash2 size={13} /> Excluir Jogo {activeGameIdx + 1}
              </button>
            )}
          </div>

          {canEdit && (
            <div className="stats-mode-actions">
              {isEditing ? (
                <span className="editing-indicator-badge">
                  <Edit3 size={12} /> Modo de Edição Ativo
                </span>
              ) : (
                <button type="button" className="btn-stats-edit" onClick={() => setIsEditing(true)}>
                  <Edit3 size={13} /> Editar Partida
                </button>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. CORPO ROLÁVEL COM SCROLLBAR DEDICADA E FLUIDA */}
        {/* ========================================================================= */}
        <div className="match-stats-scrollable-body">
          {/* Placar Geral da Série Calculado Automaticamente */}
          <div className="series-scoreboard-card">
            <div className="series-team-box us">
              <span className="series-team-label">Friba Esports</span>
              <span className="series-team-tag">TAG: {teamName ? teamName.split(' ')[0].toUpperCase() : 'FRIBA'}</span>
              <div className="series-wins-badge us">{seriesUsWins}</div>
            </div>

            <div className="series-center-summary">
              <span className="series-vs-title">PLACAR DA SÉRIE ({scrim.format})</span>
              <div className="series-vs-display">
                <span className="series-score-digit us">{seriesUsWins}</span>
                <span className="series-vs-cross">X</span>
                <span className="series-score-digit them">{seriesThemWins}</span>
              </div>
              <div className="series-calc-hint">
                <Sparkles size={12} color="#38bdf8" />
                <span>
                  {seriesUsWins > seriesThemWins 
                    ? '🏆 Friba na frente da série' 
                    : seriesThemWins > seriesUsWins 
                    ? '❌ Rival na frente da série' 
                    : hasAnyGamePlayed ? 'Empate na série' : 'Preencha a pontuação (PTS) dos atletas'}
                </span>
              </div>
            </div>

            <div className="series-team-box them">
              <span className="series-team-label">{scrim.opponentTeam || 'Oponente'}</span>
              <span className="series-team-tag">TAG: {scrim.opponentTag || 'RIVAL'}</span>
              <div className="series-wins-badge them">{seriesThemWins}</div>
            </div>
          </div>

          {/* CARD 1: NOSSA EQUIPE (FRIBA) */}
          <div className="team-stats-block us-block">
            <div className="team-stats-head">
              <div className="team-stats-identity">
                <span className="team-side-pill us">NÓS</span>
                <h3 className="team-name-text">{teamName || 'Friba Esports'}</h3>
                
                {/* Placar total somado automaticamente */}
                <div className="team-score-badge-auto us" title="Total somado automaticamente pela coluna PTS dos atletas">
                  <span className="auto-icon">⚡</span>
                  <span className="team-score-num us">{currentScoreUs}</span>
                  <span className="team-score-pts-tag">PTS</span>
                </div>
              </div>

              <span className={`outcome-badge ${!isGamePlayed ? 'pending' : usWonCurrent ? 'win' : isTieCurrent ? 'tie' : 'loss'}`}>
                {!isGamePlayed ? 'PENDENTE' : usWonCurrent ? 'VITÓRIA' : isTieCurrent ? 'EMPATE' : 'DERROTA'}
              </span>
            </div>

            {/* Tabela de Jogadores de Nós */}
            <div className="stats-table-wrapper">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th className="col-player">PLAYER</th>
                    <th className="col-stat">KOS</th>
                    <th className="col-stat">AST</th>
                    <th className="col-stat dmg">DMG</th>
                    <th className="col-stat tkn">TKN</th>
                    <th className="col-stat heal">HEAL</th>
                    <th className="col-stat pts">PTS (AEOS)</th>
                    <th className="col-mvp">MVP</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentGame?.usPlayersStats || []).map((p, idx) => (
                    <tr key={idx} className={p.isMvp ? 'is-mvp-row' : ''}>
                      {/* PLAYER com Thumbnail de Pokémon */}
                      <td className="col-player">
                        <div className="player-cell">
                          <button
                            type="button"
                            className={`poke-avatar-btn ${isEditing ? 'editable' : ''}`}
                            onClick={() => isEditing && setPokePickerOpen({ side: 'us', playerIdx: idx })}
                            title={isEditing ? 'Clique para trocar Pokémon' : p.pokemonName}
                          >
                            <img 
                              src={p.pokemonSprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'} 
                              alt={p.pokemonName || 'Escolher Pokémon'} 
                              className="poke-thumb"
                            />
                          </button>
                          <div className="player-tag-name">
                            <span className="player-full-label">
                              <span className="tag-prefix">{p.playerTag || (teamName ? teamName.split(' ')[0].toUpperCase() : 'FRIBA')} ·</span> {getPlayerNick(p.playerName)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* KOS */}
                      <td className="col-stat">
                        {isEditing ? (
                          <input
                            type="number"
                            className="table-input"
                            min="0"
                            placeholder="0"
                            value={p.kos === 0 ? '' : p.kos}
                            onChange={(e) => handleUpdatePlayerStat('us', idx, 'kos', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          />
                        ) : (
                          <span className="stat-val bold-white">{p.kos}</span>
                        )}
                      </td>

                      {/* AST */}
                      <td className="col-stat">
                        {isEditing ? (
                          <input
                            type="number"
                            className="table-input"
                            min="0"
                            placeholder="0"
                            value={p.assists === 0 ? '' : p.assists}
                            onChange={(e) => handleUpdatePlayerStat('us', idx, 'assists', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          />
                        ) : (
                          <span className="stat-val bold-white">{p.assists}</span>
                        )}
                      </td>

                      {/* DMG (Vermelho) */}
                      <td className="col-stat dmg">
                        {isEditing ? (
                          <input
                            type="text"
                            className="table-input dmg"
                            placeholder="0"
                            value={p.damage === '0' || p.damage === 0 ? '' : p.damage}
                            onChange={(e) => handleUpdatePlayerStat('us', idx, 'damage', e.target.value)}
                          />
                        ) : (
                          <span className="stat-val red-dmg">{p.damage}</span>
                        )}
                      </td>

                      {/* TKN (Azul) */}
                      <td className="col-stat tkn">
                        {isEditing ? (
                          <input
                            type="text"
                            className="table-input tkn"
                            placeholder="0"
                            value={p.damageTaken === '0' || p.damageTaken === 0 ? '' : p.damageTaken}
                            onChange={(e) => handleUpdatePlayerStat('us', idx, 'damageTaken', e.target.value)}
                          />
                        ) : (
                          <span className="stat-val blue-tkn">{p.damageTaken}</span>
                        )}
                      </td>

                      {/* HEAL (Verde) */}
                      <td className="col-stat heal">
                        {isEditing ? (
                          <input
                            type="text"
                            className="table-input heal"
                            placeholder="0"
                            value={p.healing === '0' || p.healing === 0 ? '' : p.healing}
                            onChange={(e) => handleUpdatePlayerStat('us', idx, 'healing', e.target.value)}
                          />
                        ) : (
                          <span className="stat-val green-heal">{p.healing}</span>
                        )}
                      </td>

                      {/* PTS - GATILHO DO TOTAL DA EQUIPE */}
                      <td className="col-stat pts">
                        {isEditing ? (
                          <input
                            type="number"
                            className="table-input pts highlighted-pts-input"
                            min="0"
                            placeholder="0"
                            value={p.points === 0 ? '' : p.points}
                            onChange={(e) => handleUpdatePlayerStat('us', idx, 'points', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                            title="Digite os pontos Aeos do atleta — soma automaticamente no total do time!"
                          />
                        ) : (
                          <span className="stat-val coral-pts">{p.points}</span>
                        )}
                      </td>

                      {/* MVP */}
                      <td className="col-mvp">
                        {isEditing ? (
                          <button
                            type="button"
                            className={`mvp-toggle-btn ${p.isMvp ? 'active' : ''}`}
                            onClick={() => handleUpdatePlayerStat('us', idx, 'isMvp', true)}
                            title="Definir como MVP da partida"
                          >
                            <Crown size={15} />
                          </button>
                        ) : (
                          p.isMvp ? (
                            <Crown size={17} className="mvp-crown-icon" />
                          ) : (
                            <span className="no-mvp">—</span>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-summary-bar us">
              <span className="summary-calc-info">
                ⚡ Total Friba: <strong>{currentScoreUs} Pontos</strong> somados pelos 5 atletas
              </span>
            </div>
          </div>

          {/* CARD 2: EQUIPE ADVERSÁRIA (EX: NIGHTMARE / RIVAL) */}
          <div className="team-stats-block them-block">
            <div className="team-stats-head">
              <div className="team-stats-identity">
                <span className="team-side-pill them">OPONENTE</span>
                <h3 className="team-name-text them">{scrim.opponentTeam || 'Oponente'}</h3>
                
                {/* Placar total somado automaticamente */}
                <div className="team-score-badge-auto them" title="Total somado automaticamente pela coluna PTS dos atletas">
                  <span className="auto-icon">⚡</span>
                  <span className="team-score-num them">{currentScoreThem}</span>
                  <span className="team-score-pts-tag">PTS</span>
                </div>
              </div>

              <span className={`outcome-badge ${!isGamePlayed ? 'pending' : themWonCurrent ? 'win' : isTieCurrent ? 'tie' : 'loss'}`}>
                {!isGamePlayed ? 'PENDENTE' : themWonCurrent ? 'VITÓRIA' : isTieCurrent ? 'EMPATE' : 'DERROTA'}
              </span>
            </div>

            {/* Tabela de Jogadores do Oponente */}
            <div className="stats-table-wrapper">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th className="col-player">PLAYER</th>
                    <th className="col-stat">KOS</th>
                    <th className="col-stat">AST</th>
                    <th className="col-stat dmg">DMG</th>
                    <th className="col-stat tkn">TKN</th>
                    <th className="col-stat heal">HEAL</th>
                    <th className="col-stat pts">PTS (AEOS)</th>
                    <th className="col-mvp">MVP</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentGame?.themPlayersStats || []).map((p, idx) => (
                    <tr key={idx} className={p.isMvp ? 'is-mvp-row' : ''}>
                      {/* PLAYER com Thumbnail de Pokémon */}
                      <td className="col-player">
                        <div className="player-cell">
                          <button
                            type="button"
                            className={`poke-avatar-btn ${isEditing ? 'editable' : ''}`}
                            onClick={() => isEditing && setPokePickerOpen({ side: 'them', playerIdx: idx })}
                            title={isEditing ? 'Clique para trocar Pokémon' : p.pokemonName}
                          >
                            <img 
                              src={p.pokemonSprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'} 
                              alt={p.pokemonName || 'Escolher Pokémon'} 
                              className="poke-thumb"
                            />
                          </button>
                          <div className="player-tag-name">
                            {isEditing ? (
                              <input
                                type="text"
                                className="player-name-edit"
                                value={p.playerName}
                                onChange={(e) => handleUpdatePlayerStat('them', idx, 'playerName', e.target.value)}
                                placeholder={`Rival ${idx + 1}`}
                              />
                            ) : (
                              <span className="player-full-label">
                                <span className="tag-prefix">{p.playerTag || scrim.opponentTag || 'RIVAL'} ·</span> {p.playerName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* KOS */}
                      <td className="col-stat">
                        {isEditing ? (
                          <input
                            type="number"
                            className="table-input"
                            min="0"
                            placeholder="0"
                            value={p.kos === 0 ? '' : p.kos}
                            onChange={(e) => handleUpdatePlayerStat('them', idx, 'kos', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          />
                        ) : (
                          <span className="stat-val bold-white">{p.kos}</span>
                        )}
                      </td>

                      {/* AST */}
                      <td className="col-stat">
                        {isEditing ? (
                          <input
                            type="number"
                            className="table-input"
                            min="0"
                            placeholder="0"
                            value={p.assists === 0 ? '' : p.assists}
                            onChange={(e) => handleUpdatePlayerStat('them', idx, 'assists', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          />
                        ) : (
                          <span className="stat-val bold-white">{p.assists}</span>
                        )}
                      </td>

                      {/* DMG */}
                      <td className="col-stat dmg">
                        {isEditing ? (
                          <input
                            type="text"
                            className="table-input dmg"
                            placeholder="0"
                            value={p.damage === '0' || p.damage === 0 ? '' : p.damage}
                            onChange={(e) => handleUpdatePlayerStat('them', idx, 'damage', e.target.value)}
                          />
                        ) : (
                          <span className="stat-val red-dmg">{p.damage}</span>
                        )}
                      </td>

                      {/* TKN */}
                      <td className="col-stat tkn">
                        {isEditing ? (
                          <input
                            type="text"
                            className="table-input tkn"
                            placeholder="0"
                            value={p.damageTaken === '0' || p.damageTaken === 0 ? '' : p.damageTaken}
                            onChange={(e) => handleUpdatePlayerStat('them', idx, 'damageTaken', e.target.value)}
                          />
                        ) : (
                          <span className="stat-val blue-tkn">{p.damageTaken}</span>
                        )}
                      </td>

                      {/* HEAL */}
                      <td className="col-stat heal">
                        {isEditing ? (
                          <input
                            type="text"
                            className="table-input heal"
                            placeholder="0"
                            value={p.healing === '0' || p.healing === 0 ? '' : p.healing}
                            onChange={(e) => handleUpdatePlayerStat('them', idx, 'healing', e.target.value)}
                          />
                        ) : (
                          <span className="stat-val green-heal">{p.healing}</span>
                        )}
                      </td>

                      {/* PTS - GATILHO DO TOTAL DA EQUIPE OPONENTE */}
                      <td className="col-stat pts">
                        {isEditing ? (
                          <input
                            type="number"
                            className="table-input pts highlighted-pts-input"
                            min="0"
                            placeholder="0"
                            value={p.points === 0 ? '' : p.points}
                            onChange={(e) => handleUpdatePlayerStat('them', idx, 'points', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                            title="Digite os pontos Aeos do atleta rival — soma automaticamente no total do oponente!"
                          />
                        ) : (
                          <span className="stat-val green-pts">{p.points}</span>
                        )}
                      </td>

                      {/* MVP */}
                      <td className="col-mvp">
                        {isEditing ? (
                          <button
                            type="button"
                            className={`mvp-toggle-btn ${p.isMvp ? 'active' : ''}`}
                            onClick={() => handleUpdatePlayerStat('them', idx, 'isMvp', true)}
                            title="Definir como MVP da partida"
                          >
                            <Crown size={15} />
                          </button>
                        ) : (
                          p.isMvp ? (
                            <Crown size={17} className="mvp-crown-icon" />
                          ) : (
                            <span className="no-mvp">—</span>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-summary-bar them">
              <span className="summary-calc-info">
                ⚡ Total Rival: <strong>{currentScoreThem} Pontos</strong> somados pelos 5 atletas
              </span>
            </div>
          </div>

          {/* SEÇÃO INFERIOR: MVP DA SÉRIE, LINK DO VOD & NOTAS DO COACH */}
          <div className="match-footer-details-grid">
            {/* MVP da Série */}
            <div className="match-detail-box">
              <label className="match-section-label">
                <Crown size={15} color="#FBBF24" /> MVP da Série (Destaque do Treino)
              </label>
              {isEditing ? (
                <select
                  value={selectedMvp}
                  onChange={(e) => setSelectedMvp(e.target.value)}
                  className="match-select"
                >
                  <option value="">Selecione o atleta destaque...</option>
                  {defaultUsPlayers.map((p, idx) => {
                    const nick = getPlayerNick(p);
                    return (
                      <option key={idx} value={nick}>👑 {nick}</option>
                    );
                  })}
                  {members.map(m => {
                    const nick = m.nickname || m.name;
                    return (
                      <option key={m.id} value={nick}>👑 {nick}</option>
                    );
                  })}
                </select>
              ) : (
                <div className="match-value-display">
                  {selectedMvp ? (
                    <span className="mvp-highlight-pill">
                      <Crown size={14} color="#FBBF24" /> {getPlayerNick(selectedMvp)}
                    </span>
                  ) : (
                    <span className="text-dim">Nenhum MVP selecionado</span>
                  )}
                </div>
              )}
            </div>

            {/* Link do VOD */}
            <div className="match-detail-box">
              <label className="match-section-label">
                <Tv size={15} color="#38BDF8" /> Link da Gravação / VOD (Twitch / YouTube)
              </label>
              {isEditing ? (
                <div className="input-with-icon-inline">
                  <Tv size={14} className="text-dim" />
                  <input
                    type="url"
                    className="match-input"
                    placeholder="https://twitch.tv/videos/... ou https://youtube.com/..."
                    value={vodUrl}
                    onChange={(e) => setVodUrl(e.target.value)}
                  />
                </div>
              ) : (
                <div className="match-value-display">
                  {vodUrl ? (
                    <a href={vodUrl} target="_blank" rel="noreferrer" className="vod-link-btn">
                      <Play size={13} /> Assistir VOD da Scrim
                    </a>
                  ) : (
                    <span className="text-dim">Nenhuma gravação anexada</span>
                  )}
                </div>
              )}
            </div>

            {/* Feedback Técnico & Notas do Coach */}
            <div className="match-detail-box full-width">
              <label className="match-section-label">
                <Edit3 size={15} color="#A78BFA" /> Feedback Técnico & Análise do Treino
              </label>
              {isEditing ? (
                <textarea
                  rows={3}
                  className="match-textarea"
                  placeholder="Observações táticas do coach: pontos fortes, rotações, lutas por objetivos (Rayquaza), erros a corrigir..."
                  value={resultNotes}
                  onChange={(e) => setResultNotes(e.target.value)}
                />
              ) : (
                <div className="match-notes-display">
                  {resultNotes ? resultNotes : <span className="text-dim">Nenhuma observação técnica registrada para esta scrim.</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. RODAPÉ FIXO DE AÇÕES */}
        {/* ========================================================================= */}
        <div className="match-stats-bottom-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fechar
          </button>

          {canEdit && (
            <button type="button" className="btn-primary-glow" onClick={handleSaveAll}>
              <Check size={16} /> Salvar Relatório & Concluir Scrim
            </button>
          )}
        </div>

        {/* Modal Popover de Seleção Rápida de Pokémon */}
        {pokePickerOpen && (
          <div className="poke-picker-modal-backdrop" onClick={() => setPokePickerOpen(null)}>
            <div className="poke-picker-card" onClick={(e) => e.stopPropagation()}>
              <div className="poke-picker-head">
                <span>Selecione o Pokémon Utilizado</span>
                <button type="button" onClick={() => setPokePickerOpen(null)} className="close-mini-btn">
                  <X size={15} />
                </button>
              </div>

              <div className="poke-picker-search">
                <Search size={14} className="text-dim" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar por nome ou função..."
                  value={pokeSearch}
                  onChange={(e) => setPokeSearch(e.target.value)}
                />
              </div>

              <div className="poke-picker-grid">
                {filteredPokemons.map(p => (
                  <button
                    type="button"
                    key={p.id}
                    className="poke-choice-btn"
                    onClick={() => handleSelectPokemon(p.id)}
                    title={`${p.name} • ${p.role}`}
                  >
                    <img src={p.sprite} alt={p.name} className="poke-choice-img" />
                    <span className="poke-choice-name">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .match-stats-backdrop {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          z-index: 99999;
          background: rgba(3, 6, 15, 0.94);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .match-stats-card-main {
          max-width: 1040px;
          width: 96%;
          height: calc(100vh - 32px);
          height: calc(100dvh - 32px);
          max-height: calc(100vh - 32px);
          max-height: calc(100dvh - 32px);
          margin: auto;
          position: relative;
          background: #0A0F1D;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.95);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 0 !important; /* Sem padding no container externo para scroll interno perfeito */
        }

        /* HEADER FIXO */
        .match-stats-header {
          flex-shrink: 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 18px 24px 14px;
          background: #0A0F1D;
        }

        .stats-header-tag-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .stats-tag-badge {
          background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #38BDF8;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 4px;
          letter-spacing: 0.04em;
        }

        .stats-category-badge {
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.35);
          color: #A78BFA;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .stats-format-badge {
          background: rgba(255, 255, 255, 0.08);
          color: #94A3B8;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .match-stats-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .match-stats-sub {
          font-size: 0.82rem;
          color: #94A3B8;
          margin: 2px 0 0;
        }

        .close-stats-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          transition: all 0.15s;
        }

        .close-stats-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.08);
        }

        /* BARRA FIXA DE ABAS DOS JOGOS */
        .match-games-tabs-bar {
          flex-shrink: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          padding: 12px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(13, 20, 38, 0.6);
        }

        .match-games-pills-list {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .game-nav-pill {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94A3B8;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .game-nav-pill:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #FFFFFF;
        }

        .game-nav-pill.active {
          background: #180F1F;
          border: 1.5px solid #EF4444;
          color: #FFFFFF;
          box-shadow: 0 0 14px rgba(239, 68, 68, 0.35);
        }

        .game-nav-pill.game-win {
          border-color: rgba(16, 185, 129, 0.6);
        }

        .game-nav-pill.game-loss {
          border-color: rgba(239, 68, 68, 0.6);
        }

        .game-pill-score-indicator {
          font-size: 0.68rem;
          font-weight: 900;
        }

        .add-game-pill-btn {
          background: rgba(11, 95, 255, 0.15);
          border: 1px dashed rgba(11, 95, 255, 0.4);
          color: #93C5FD;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .add-game-pill-btn:hover {
          background: #0B5FFF;
          color: #FFFFFF;
        }

        .add-game-pill-btn.danger {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.4);
          color: #F87171;
        }

        .add-game-pill-btn.danger:hover {
          background: #EF4444;
          color: #FFFFFF;
        }

        .editing-indicator-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #38BDF8;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 8px;
        }

        .btn-stats-edit {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #E2E8F0;
          font-size: 0.76rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-stats-edit:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
        }

        /* CORPO ROLÁVEL PRINCIPAL COM SCROLLBAR DEDICADA */
        .match-stats-scrollable-body {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          padding: 18px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: thin;
          scrollbar-color: rgba(56, 189, 248, 0.45) rgba(15, 23, 42, 0.6);
        }

        .match-stats-scrollable-body::-webkit-scrollbar {
          width: 8px;
        }

        .match-stats-scrollable-body::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 6px;
        }

        .match-stats-scrollable-body::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.4);
          border-radius: 6px;
          border: 1px solid rgba(56, 189, 248, 0.2);
        }

        .match-stats-scrollable-body::-webkit-scrollbar-thumb:hover {
          background: rgba(56, 189, 248, 0.7);
        }

        /* PLACAR DA SÉRIE */
        .series-scoreboard-card {
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(13, 21, 38, 0.95) 100%);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 12px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .series-team-box {
          display: flex;
          flex-direction: column;
          min-width: 130px;
        }

        .series-team-box.them {
          text-align: right;
          align-items: flex-end;
        }

        .series-team-label {
          font-size: 0.95rem;
          font-weight: 800;
          color: #F8FAFC;
        }

        .series-team-tag {
          font-size: 0.68rem;
          color: #94A3B8;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .series-wins-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          font-size: 1.4rem;
          font-weight: 900;
        }

        .series-wins-badge.us {
          background: rgba(56, 189, 248, 0.2);
          border: 1.5px solid #38BDF8;
          color: #38BDF8;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
        }

        .series-wins-badge.them {
          background: rgba(248, 113, 113, 0.2);
          border: 1.5px solid #F87171;
          color: #F87171;
          box-shadow: 0 0 12px rgba(248, 113, 113, 0.3);
        }

        .series-center-summary {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .series-vs-title {
          font-size: 0.68rem;
          font-weight: 800;
          color: #94A3B8;
          letter-spacing: 0.08em;
        }

        .series-vs-display {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .series-score-digit {
          font-size: 1.6rem;
          font-weight: 900;
        }

        .series-score-digit.us { color: #38BDF8; }
        .series-score-digit.them { color: #F87171; }

        .series-vs-cross {
          font-size: 1.1rem;
          font-weight: 800;
          color: #475569;
        }

        .series-calc-hint {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          color: #38BDF8;
          font-weight: 600;
        }

        /* BLOCOS DE TIMES (NÓS & ELES) */
        .team-stats-block {
          flex-shrink: 0;
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .team-stats-block.us-block {
          background: #110B18;
          border: 1px solid rgba(214, 31, 38, 0.25);
        }

        .team-stats-block.them-block {
          background: #08151A;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .team-stats-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .team-stats-identity {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .team-side-pill.us {
          background: rgba(147, 51, 234, 0.2);
          border: 1px solid rgba(147, 51, 234, 0.4);
          color: #C084FC;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .team-side-pill.them {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #34D399;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .team-name-text {
          font-size: 1.25rem;
          font-weight: 800;
          color: #F87171;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .team-name-text.them {
          color: #34D399;
        }

        /* BADGE AUTOMÁTICO DE PONTOS DA EQUIPE */
        .team-score-badge-auto {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 8px;
          cursor: help;
        }

        .team-score-badge-auto.us {
          background: rgba(244, 63, 94, 0.15);
          border: 1.5px solid rgba(244, 63, 94, 0.45);
        }

        .team-score-badge-auto.them {
          background: rgba(16, 185, 129, 0.15);
          border: 1.5px solid rgba(16, 185, 129, 0.45);
        }

        .auto-icon {
          font-size: 0.8rem;
        }

        .team-score-num {
          font-size: 1.45rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .team-score-num.us { color: #F43F5E; }
        .team-score-num.them { color: #10B981; }

        .team-score-pts-tag {
          font-size: 0.72rem;
          font-weight: 800;
          color: #94A3B8;
        }

        .outcome-badge {
          font-size: 0.7rem;
          font-weight: 900;
          padding: 4px 12px;
          border-radius: 6px;
          letter-spacing: 0.06em;
        }

        .outcome-badge.win {
          background: #042F2E;
          border: 1px solid #059669;
          color: #34D399;
          box-shadow: 0 0 10px rgba(52, 211, 153, 0.25);
        }

        .outcome-badge.loss {
          background: #3B1219;
          border: 1px solid #991B1B;
          color: #F87171;
        }

        .outcome-badge.tie {
          background: #3E2407;
          border: 1px solid #D97706;
          color: #FBBF24;
        }

        .outcome-badge.pending {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94A3B8;
        }

        /* TABELA DE STATS */
        .stats-table-wrapper {
          overflow-x: auto;
        }

        .stats-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .stats-table th {
          font-size: 0.64rem;
          font-weight: 800;
          color: #64748B;
          letter-spacing: 0.06em;
          padding: 6px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .stats-table td {
          padding: 8px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          vertical-align: middle;
        }

        .stats-table tr:last-child td {
          border-bottom: none;
        }

        .stats-table tr.is-mvp-row {
          background: rgba(245, 158, 11, 0.04);
        }

        /* COLUNAS */
        .col-player { min-width: 180px; }
        .col-stat { text-align: center; min-width: 70px; }
        .col-mvp { text-align: center; width: 50px; }

        .player-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .poke-avatar-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: default;
          flex-shrink: 0;
        }

        .poke-avatar-btn.editable {
          cursor: pointer;
          border: 1px dashed rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transition: transform 0.15s, border-color 0.15s;
        }

        .poke-avatar-btn.editable:hover {
          transform: scale(1.1);
          border-color: #38BDF8;
        }

        .poke-thumb {
          width: 32px;
          height: 32px;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
        }

        .player-tag-name {
          display: flex;
          align-items: center;
        }

        .player-full-label {
          font-size: 0.86rem;
          font-weight: 700;
          color: #F8FAFC;
        }

        .tag-prefix {
          color: #94A3B8;
          font-weight: 600;
        }

        .player-name-edit {
          height: 28px;
          font-size: 0.82rem;
          padding: 4px 8px;
          width: 120px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          border-radius: 6px;
        }

        /* VALORES ESTATÍSTICOS COLORIDOS */
        .stat-val {
          font-size: 0.86rem;
          font-weight: 700;
        }

        .stat-val.bold-white {
          color: #FFFFFF;
          font-size: 0.95rem;
          font-weight: 800;
        }

        .stat-val.red-dmg { color: #F87171; }
        .stat-val.blue-tkn { color: #38BDF8; }
        .stat-val.green-heal { color: #10B981; }
        .stat-val.coral-pts { color: #F87171; font-weight: 800; }
        .stat-val.green-pts { color: #34D399; font-weight: 800; }

        .mvp-crown-icon {
          color: #FBBF24;
          filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.6));
        }

        .no-mvp {
          color: #475569;
          font-weight: 700;
        }

        /* INPUTS EDITÁVEIS NA TABELA */
        .table-input {
          width: 62px;
          height: 28px;
          text-align: center;
          font-size: 0.78rem;
          padding: 2px 4px;
          font-weight: 700;
          border-radius: 6px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
        }

        .table-input.dmg { color: #F87171; }
        .table-input.tkn { color: #38BDF8; }
        .table-input.heal { color: #10B981; }
        .table-input.pts { color: #F8FAFC; }

        .highlighted-pts-input {
          border-color: rgba(56, 189, 248, 0.5) !important;
          background: rgba(56, 189, 248, 0.1) !important;
          font-weight: 800;
        }

        .highlighted-pts-input:focus {
          border-color: #38BDF8 !important;
          box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
        }

        .mvp-toggle-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #64748B;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .mvp-toggle-btn.active {
          background: rgba(251, 191, 36, 0.2);
          border-color: #FBBF24;
          color: #FBBF24;
        }

        .table-summary-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-top: 6px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .summary-calc-info {
          font-size: 0.74rem;
          color: #94A3B8;
        }

        .summary-calc-info strong {
          color: #FFFFFF;
        }

        /* SEÇÃO INFERIOR: VOD, FEEDBACK DO COACH & MVP */
        .match-footer-details-grid {
          flex-shrink: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px 16px;
        }

        .match-detail-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .match-detail-box.full-width {
          grid-column: 1 / -1;
        }

        .match-section-label {
          font-size: 0.76rem;
          font-weight: 700;
          color: #E2E8F0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .match-select, .match-input, .match-textarea {
          background: rgba(10, 15, 29, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: #FFFFFF;
          padding: 8px 12px;
          font-size: 0.82rem;
          font-family: inherit;
          width: 100%;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }

        .match-select:focus, .match-input:focus, .match-textarea:focus {
          border-color: #38BDF8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.15);
        }

        .input-with-icon-inline {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(10, 15, 29, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 0 10px;
        }

        .input-with-icon-inline .match-input {
          background: transparent;
          border: none;
          padding: 8px 0;
        }

        .match-value-display {
          min-height: 34px;
          display: flex;
          align-items: center;
        }

        .mvp-highlight-pill {
          background: rgba(251, 191, 36, 0.15);
          border: 1px solid rgba(251, 191, 36, 0.35);
          color: #FBBF24;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .vod-link-btn {
          background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #38BDF8;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 8px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }

        .vod-link-btn:hover {
          background: #0284C7;
          color: #FFFFFF;
        }

        .match-notes-display {
          background: rgba(10, 15, 29, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.82rem;
          color: #CBD5E1;
          white-space: pre-wrap;
          line-height: 1.5;
        }

        .text-dim {
          color: #64748B;
          font-size: 0.8rem;
        }

        /* POKEMON PICKER POPOVER */
        .poke-picker-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          z-index: 1300;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .poke-picker-card {
          width: 380px;
          max-height: 480px;
          background: #0B111F;
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px;
        }

        .poke-picker-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          font-weight: 700;
          color: #F8FAFC;
        }

        .close-mini-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
        }

        .poke-picker-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 6px 10px;
        }

        .poke-picker-search input {
          background: transparent;
          border: none;
          color: white;
          font-size: 0.8rem;
          width: 100%;
          outline: none;
        }

        .poke-picker-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          max-height: 340px;
          overflow-y: auto;
          padding: 4px;
        }

        .poke-choice-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 6px 4px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .poke-choice-btn:hover {
          background: rgba(56, 189, 248, 0.15);
          border-color: #38BDF8;
          transform: translateY(-2px);
        }

        .poke-choice-img {
          width: 38px;
          height: 38px;
          object-fit: contain;
        }

        .poke-choice-name {
          font-size: 0.62rem;
          color: #CBD5E1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60px;
        }

        /* ACTIONS FOOTER */
        .match-stats-bottom-actions {
          flex-shrink: 0;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 14px 24px;
          background: #0A0F1D;
        }

        .btn-primary-glow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #0284C7 0%, #2563EB 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
          transition: all 0.2s;
        }

        .btn-primary-glow:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.55);
        }

        /* RESPONSIVIDADE PARA TELAS MENORES */
        @media (max-height: 740px) {
          .match-stats-card-main {
            height: 94vh;
            max-height: 94vh;
          }
          .match-stats-header {
            padding: 12px 18px 10px;
          }
          .match-games-tabs-bar {
            padding: 8px 18px;
          }
          .match-stats-scrollable-body {
            padding: 12px 18px;
            gap: 12px;
          }
          .match-stats-bottom-actions {
            padding: 10px 18px;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

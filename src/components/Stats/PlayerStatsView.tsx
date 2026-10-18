import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Swords, 
  Zap, 
  Sparkles, 
  Gamepad2, 
  Flame, 
  Target, 
  Crown, 
  Calendar, 
  ChevronDown, 
  Check, 
  BarChart3, 
  ArrowUpRight,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { TeamMember, ScrimEvent, Role, AppUser } from '../../types';
import { calculatePlayerStats, generateDemoScrims } from '../../utils/playerStatsCalculator';
import { WinRateDonut, PerformanceTimelineChart, PlayerRadarChart, PokemonUsageList } from './StatsCharts';
import { MatchStatsModal } from '../Agenda/MatchStatsModal';
import { showToast } from '../UI/toastService';

interface PlayerStatsViewProps {
  currentRole: Role;
  currentUser?: AppUser | null;
  members: TeamMember[];
  scrims: ScrimEvent[];
  onAddScrim: (scrim: ScrimEvent) => void;
  onUpdateScrim: (scrim: ScrimEvent) => void;
  onNavigate: (tab: string) => void;
  teamName: string;
  initialSelectedMemberId?: string;
}

export const PlayerStatsView: React.FC<PlayerStatsViewProps> = ({
  currentRole: _currentRole,
  currentUser,
  members,
  scrims,
  onAddScrim,
  onUpdateScrim,
  onNavigate,
  teamName,
  initialSelectedMemberId,
}) => {
  // Lista de jogadores disponíveis para análise (Jogadores e Dono/Staff que jogam)
  const playerCandidates = useMemo(() => {
    if (members.length === 0) return [];
    // Prioriza membros com role 'Jogador' ou que tenham nickname
    const players = members.filter(m => m.role === 'Jogador');
    const others = members.filter(m => m.role !== 'Jogador');
    return [...players, ...others];
  }, [members]);

  // Identifica o jogador inicial:
  // 1. initialSelectedMemberId se fornecido
  // 2. O usuário logado se for encontrado nos membros
  // 3. O primeiro titular ou membro da lista
  const defaultMember = useMemo(() => {
    if (initialSelectedMemberId) {
      const match = members.find(m => m.id === initialSelectedMemberId);
      if (match) return match;
    }
    if (currentUser) {
      const match = members.find(m => 
        (m.userId && m.userId === currentUser.id) || 
        (m.email && currentUser.email && m.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        m.name.toLowerCase() === currentUser.name.toLowerCase() ||
        (m.nickname && currentUser.nickname && m.nickname.toLowerCase() === currentUser.nickname.toLowerCase())
      );
      if (match) return match;
    }
    return playerCandidates[0] || members[0] || null;
  }, [initialSelectedMemberId, currentUser, members, playerCandidates]);

  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => defaultMember?.id || '');
  const [isPlayerDropdownOpen, setIsPlayerDropdownOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [timelineMetric, setTimelineMetric] = useState<'points' | 'kos' | 'damage'>('points');

  // Modal para inspecionar uma partida específica clicando nos últimos jogos
  const [inspectedScrim, setInspectedScrim] = useState<ScrimEvent | null>(null);

  // Jogador ativo
  const activeMember = useMemo(() => {
    return members.find(m => m.id === selectedMemberId) || defaultMember || members[0];
  }, [members, selectedMemberId, defaultMember]);

  // Estatísticas calculadas dinamicamente
  const stats = useMemo(() => {
    if (!activeMember) return null;
    return calculatePlayerStats(activeMember, scrims, categoryFilter);
  }, [activeMember, scrims, categoryFilter]);

  // Carregar dados de demonstração da Friba
  const handleLoadDemoMatches = () => {
    const demoMatches = generateDemoScrims(members);
    demoMatches.forEach(scrim => {
      onAddScrim(scrim);
    });

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignora erro de confetti
    }

    showToast('3 partidas de treino com estatísticas detalhadas foram carregadas!', 'success');
  };

  const categories = ['Todos', 'Treino', 'Amistoso', 'Campeonato'];

  return (
    <div className="stats-dashboard-root">
      {/* =========================================================================
          1. HEADER SUPERIOR COM SELETOR DE JOGADOR E FILTROS DE CATEGORIA
          ========================================================================= */}
      <div className="stats-top-bar glass-panel">
        <div className="stats-header-info">
          <div className="stats-title-wrap">
            <div className="stats-icon-badge">
              <BarChart3 size={20} color="#F43F5E" />
            </div>
            <div>
              <div className="stats-sub-title">ANÁLISE DE PERFORMANCE INDIVIDUAL</div>
              <h1 className="stats-main-title">Estatísticas do Atleta</h1>
            </div>
          </div>
        </div>

        {/* Seletor Customizado de Jogador da Friba */}
        <div className="stats-controls-row">
          <div className="player-selector-dropdown-wrapper">
            <label className="stats-control-label">Selecionar Jogador:</label>
            <div className="custom-player-select">
              <button
                type="button"
                className={`player-select-btn ${isPlayerDropdownOpen ? 'open' : ''}`}
                onClick={() => setIsPlayerDropdownOpen(!isPlayerDropdownOpen)}
              >
                <div className="player-select-btn-inner">
                  <img
                    src={activeMember?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                    alt={activeMember?.nickname || 'Jogador'}
                    className="player-select-avatar"
                  />
                  <div className="player-select-text">
                    <span className="player-select-nick">{activeMember?.nickname || activeMember?.name}</span>
                    <span className="player-select-role">{activeMember?.gameRole || activeMember?.role} • {activeMember?.preferredLane || 'Flex'}</span>
                  </div>
                </div>
                <ChevronDown size={16} className={`chevron-icon ${isPlayerDropdownOpen ? 'rotate' : ''}`} />
              </button>

              {isPlayerDropdownOpen && (
                <div className="player-dropdown-menu glass-panel">
                  <div className="player-dropdown-header">Atletas do Elenco ({members.length})</div>
                  <div className="player-dropdown-list">
                    {members.map(member => {
                      const isSelected = member.id === activeMember?.id;
                      return (
                        <div
                          key={member.id}
                          className={`player-dropdown-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedMemberId(member.id);
                            setIsPlayerDropdownOpen(false);
                          }}
                        >
                          <img src={member.avatar} alt={member.name} className="dropdown-item-avatar" />
                          <div className="dropdown-item-info">
                            <div className="dropdown-item-name">
                              {member.nickname || member.name}
                              {member.status === 'Titular' && <span className="titular-pill">Titular</span>}
                            </div>
                            <div className="dropdown-item-sub">
                              {member.role} • {member.gameRole || 'All-Rounder'} • {member.preferredLane || 'Jungle'}
                            </div>
                          </div>
                          {isSelected && <Check size={16} className="text-emerald" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filtros de Categoria */}
          <div className="category-filter-group">
            <label className="stats-control-label">Tipo de Partida:</label>
            <div className="filter-pill-container">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill-btn ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'Todos' ? 'Todas' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. EMPTY STATE: SE O JOGADOR NÃO POSSUIR PARTIDAS REGISTRADAS
          ========================================================================= */}
      {stats && stats.totalGames === 0 ? (
        <div className="stats-empty-card glass-panel">
          <div className="empty-card-inner">
            <div className="empty-icon-ring">
              <Gamepad2 size={38} color="#F43F5E" />
            </div>
            <h2 className="empty-title">Nenhuma partida computada para {activeMember?.nickname || activeMember?.name}</h2>
            <p className="empty-desc">
              As estatísticas são sincronizadas automaticamente a partir das partidas e séries MD3/MD5 cadastradas e finalizadas na aba <strong>Agenda</strong>.
            </p>

            <div className="empty-actions-row">
              <button
                type="button"
                className="btn-primary"
                onClick={() => onNavigate('agenda')}
              >
                <Calendar size={16} /> Ir para a Agenda e Registrar Partida
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleLoadDemoMatches}
              >
                <Sparkles size={16} color="#F59E0B" /> Carregar Partidas de Demonstração
              </button>
            </div>
          </div>
        </div>
      ) : stats && (
        <>
          {/* =========================================================================
              3. HERO ATHLETE PROFILE CARD (RESUMO VISUAL PRINCIPAL)
              ========================================================================= */}
          <div className="athlete-hero-card glass-panel">
            <div className="athlete-hero-left">
              <div className="athlete-avatar-frame">
                <img
                  src={stats.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                  alt={stats.nickname}
                  className="athlete-hero-avatar"
                />
                <span className="athlete-status-dot" title="Atleta Ativo" />
              </div>

              <div className="athlete-hero-meta">
                <div className="athlete-tag-row">
                  <span className="athlete-team-tag">{teamName || 'FRIBA ESPORTS'}</span>
                  <span className="athlete-role-tag">{stats.gameRole || stats.role || 'Jogador'}</span>
                  {stats.preferredLane && (
                    <span className="athlete-lane-tag">{stats.preferredLane}</span>
                  )}
                </div>
                <h2 className="athlete-hero-nick">{stats.nickname}</h2>
                <div className="athlete-sub-info">
                  <span>{stats.playerName}</span>
                  {activeMember?.inGameId && (
                    <>
                      <span className="dot-sep">•</span>
                      <span>IGN: <strong>{activeMember.inGameId}</strong></span>
                    </>
                  )}
                  {activeMember?.discord && (
                    <>
                      <span className="dot-sep">•</span>
                      <span>Discord: {activeMember.discord}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="athlete-hero-right-badges">
              {/* Badge Win Rate Principal */}
              <div className="hero-kpi-badge">
                <span className="hero-kpi-label">Win Rate Geral</span>
                <div className="hero-kpi-val-row">
                  <span className={`hero-kpi-val ${stats.winRate >= 50 ? 'text-emerald' : 'text-rose'}`}>
                    {stats.winRate}%
                  </span>
                  <span className="hero-kpi-sub">
                    ({stats.wins}V - {stats.losses}D)
                  </span>
                </div>
              </div>

              {/* Badge MVP Rate */}
              <div className="hero-kpi-badge gold-aura">
                <span className="hero-kpi-label">
                  <Crown size={13} color="#F59E0B" className="inline-icon" /> MVP Rate
                </span>
                <div className="hero-kpi-val-row">
                  <span className="hero-kpi-val text-amber">{stats.mvpRate}%</span>
                  <span className="hero-kpi-sub">({stats.totalMvps} MVPs)</span>
                </div>
              </div>

              {/* Pokémon Mais Usado */}
              {stats.mostUsedPokemon && (
                <div className="hero-kpi-badge poke-hero-badge">
                  <span className="hero-kpi-label">Pokémon Mais Utilizado</span>
                  <div className="hero-poke-row">
                    <img
                      src={stats.mostUsedPokemon.pokemonSprite}
                      alt={stats.mostUsedPokemon.pokemonName}
                      className="hero-poke-thumb"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://d275t8dp8rxb42.cloudfront.net/pokemon/thumbnail/Pikachu.png';
                      }}
                    />
                    <div>
                      <div className="hero-poke-name">{stats.mostUsedPokemon.pokemonName}</div>
                      <div className="hero-poke-stats">
                        {stats.mostUsedPokemon.picks} partidas ({stats.mostUsedPokemon.winRate}% WR)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              4. GRID DOS 6 CARDS DE MÉTRICAS KPI ESSENCIAIS
              ========================================================================= */}
          <div className="stats-kpi-grid">
            {/* KPI 1: Win Rate */}
            <div className="kpi-card glass-panel">
              <div className="kpi-card-header">
                <span className="kpi-title">Taxa de Vitória (WR)</span>
                <div className="kpi-icon-wrap emerald">
                  <Trophy size={18} />
                </div>
              </div>
              <div className="kpi-value-row">
                <span className={`kpi-main-num ${stats.winRate >= 50 ? 'text-emerald' : 'text-rose'}`}>
                  {stats.winRate}%
                </span>
              </div>
              <div className="kpi-sub-row">
                <span className="kpi-detail">
                  <strong>{stats.wins}</strong> vitórias • <strong>{stats.losses}</strong> derrotas
                </span>
              </div>
              <div className="kpi-bar-track">
                <div
                  className={`kpi-bar-fill ${stats.winRate >= 50 ? 'bg-emerald' : 'bg-rose'}`}
                  style={{ width: `${Math.max(6, stats.winRate)}%` }}
                />
              </div>
            </div>

            {/* KPI 2: Jogos Totais */}
            <div className="kpi-card glass-panel">
              <div className="kpi-card-header">
                <span className="kpi-title">Jogos Totais</span>
                <div className="kpi-icon-wrap cyan">
                  <Gamepad2 size={18} />
                </div>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-main-num text-cyan">{stats.totalGames}</span>
                <span className="kpi-unit">partidas</span>
              </div>
              <div className="kpi-sub-row">
                <span className="kpi-detail">
                  Em {scrims.filter(s => s.status === 'Concluído').length} séries registradas
                </span>
              </div>
              <div className="kpi-bar-track">
                <div className="kpi-bar-fill bg-cyan" style={{ width: '100%' }} />
              </div>
            </div>

            {/* KPI 3: MVP Rate */}
            <div className="kpi-card glass-panel">
              <div className="kpi-card-header">
                <span className="kpi-title">MVP Rate</span>
                <div className="kpi-icon-wrap amber">
                  <Crown size={18} />
                </div>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-main-num text-amber">{stats.mvpRate}%</span>
                <span className="kpi-unit">dos jogos</span>
              </div>
              <div className="kpi-sub-row">
                <span className="kpi-detail">
                  <strong>{stats.totalMvps}</strong> títulos de MVP conquistados
                </span>
              </div>
              <div className="kpi-bar-track">
                <div className="kpi-bar-fill bg-amber" style={{ width: `${Math.max(6, stats.mvpRate)}%` }} />
              </div>
            </div>

            {/* KPI 4: Kills & Assists Médios */}
            <div className="kpi-card glass-panel">
              <div className="kpi-card-header">
                <span className="kpi-title">Kill & Assist Médio</span>
                <div className="kpi-icon-wrap rose">
                  <Flame size={18} />
                </div>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-main-num text-rose">{stats.avgKillsAndAssists}</span>
                <span className="kpi-unit">K+A / jogo</span>
              </div>
              <div className="kpi-sub-row">
                <span className="kpi-detail">
                  <strong>{stats.avgKills}</strong> KOs médios • <strong>{stats.avgAssists}</strong> Assists médios
                </span>
              </div>
              <div className="kpi-dual-bar">
                <div className="dual-bar-item bg-rose" style={{ width: `${(stats.avgKills / (stats.avgKillsAndAssists || 1)) * 100}%` }} title="KOs" />
                <div className="dual-bar-item bg-cyan" style={{ width: `${(stats.avgAssists / (stats.avgKillsAndAssists || 1)) * 100}%` }} title="Assists" />
              </div>
            </div>

            {/* KPI 5: Pontuação Média */}
            <div className="kpi-card glass-panel">
              <div className="kpi-card-header">
                <span className="kpi-title">Pontuação Média</span>
                <div className="kpi-icon-wrap yellow">
                  <Target size={18} />
                </div>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-main-num text-yellow">{stats.avgPoints}</span>
                <span className="kpi-unit">pontos Aeos</span>
              </div>
              <div className="kpi-sub-row">
                <span className="kpi-detail">
                  Recorde pessoal: <strong>{stats.maxPoints}</strong> pontos em 1 jogo
                </span>
              </div>
              <div className="kpi-bar-track">
                <div className="kpi-bar-fill bg-yellow" style={{ width: `${Math.min(100, (stats.avgPoints / 200) * 100)}%` }} />
              </div>
            </div>

            {/* KPI 6: Pokémon Mais Utilizado */}
            <div className="kpi-card glass-panel">
              <div className="kpi-card-header">
                <span className="kpi-title">Pokémon Mais Utilizado</span>
                <div className="kpi-icon-wrap purple">
                  <Swords size={18} />
                </div>
              </div>
              {stats.mostUsedPokemon ? (
                <>
                  <div className="kpi-poke-main-row">
                    <img
                      src={stats.mostUsedPokemon.pokemonSprite}
                      alt={stats.mostUsedPokemon.pokemonName}
                      className="kpi-poke-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://d275t8dp8rxb42.cloudfront.net/pokemon/thumbnail/Pikachu.png';
                      }}
                    />
                    <div>
                      <div className="kpi-poke-name">{stats.mostUsedPokemon.pokemonName}</div>
                      <span className="kpi-poke-role">{stats.mostUsedPokemon.role}</span>
                    </div>
                  </div>
                  <div className="kpi-sub-row">
                    <span className="kpi-detail">
                      <strong>{stats.mostUsedPokemon.picks}</strong> partidas ({stats.mostUsedPokemon.pickRate}% do total) • <strong>{stats.mostUsedPokemon.winRate}% WR</strong>
                    </span>
                  </div>
                </>
              ) : (
                <div className="kpi-sub-row">
                  <span className="kpi-detail">Nenhum Pokémon registrado</span>
                </div>
              )}
              <div className="kpi-bar-track">
                <div className="kpi-bar-fill bg-purple" style={{ width: `${stats.mostUsedPokemon ? stats.mostUsedPokemon.winRate : 0}%` }} />
              </div>
            </div>
          </div>

          {/* =========================================================================
              5. SEÇÃO DE GRÁFICOS: EVOLUÇÃO TEMPORAL, DONUT, RADAR E PICK RATE
              ========================================================================= */}
          <div className="stats-charts-section">
            <div className="charts-main-grid">
              {/* Gráfico 1: Linha do Tempo e Evolução dos Últimos Jogos */}
              <div className="chart-box timeline-box glass-panel">
                <div className="chart-box-header">
                  <div className="chart-box-title-group">
                    <Activity size={18} color="#F43F5E" />
                    <span className="chart-box-title">Evolução Partida a Partida</span>
                  </div>

                  <div className="timeline-metric-toggle">
                    <button
                      type="button"
                      className={`metric-toggle-btn ${timelineMetric === 'points' ? 'active' : ''}`}
                      onClick={() => setTimelineMetric('points')}
                    >
                      Pontos
                    </button>
                    <button
                      type="button"
                      className={`metric-toggle-btn ${timelineMetric === 'kos' ? 'active' : ''}`}
                      onClick={() => setTimelineMetric('kos')}
                    >
                      KOs
                    </button>
                    <button
                      type="button"
                      className={`metric-toggle-btn ${timelineMetric === 'damage' ? 'active' : ''}`}
                      onClick={() => setTimelineMetric('damage')}
                    >
                      Dano
                    </button>
                  </div>
                </div>

                <PerformanceTimelineChart
                  games={stats.allGames.slice(0, 12)}
                  metricType={timelineMetric}
                />
              </div>

              {/* Gráfico 2: Win Rate Donut */}
              <div className="chart-box donut-box glass-panel">
                <div className="chart-box-header">
                  <div className="chart-box-title-group">
                    <Trophy size={18} color="#10B981" />
                    <span className="chart-box-title">Proporção de Vitórias</span>
                  </div>
                </div>

                <WinRateDonut
                  wins={stats.wins}
                  losses={stats.losses}
                  draws={stats.draws}
                  winRate={stats.winRate}
                  totalGames={stats.totalGames}
                />
              </div>
            </div>

            {/* Linha Secundária de Gráficos: Radar de Habilidades & Lista de Pokémon */}
            <div className="charts-secondary-grid">
              {/* Gráfico 3: Radar Pentágono de Atributos */}
              <div className="chart-box radar-box glass-panel">
                <PlayerRadarChart
                  radar={stats.radar}
                  playerName={stats.nickname}
                />
              </div>

              {/* Gráfico 4: Ranking & Distribuição de Pokémon Mais Utilizados */}
              <div className="chart-box poke-list-box glass-panel">
                <div className="chart-box-header">
                  <div className="chart-box-title-group">
                    <Swords size={18} color="#9333EA" />
                    <span className="chart-box-title">Pokémon Mais Jogados & Taxa de Vitória</span>
                  </div>
                  <span className="chart-box-badge">Top Picks</span>
                </div>

                <PokemonUsageList
                  pokemonStats={stats.pokemonStats}
                  totalGames={stats.totalGames}
                />
              </div>
            </div>
          </div>

          {/* =========================================================================
              6. TABELA DETALHADA: ÚLTIMOS 10 JOGOS REALIZADOS COM SUAS ESTATÍSTICAS
              ========================================================================= */}
          <div className="recent-games-section glass-panel">
            <div className="recent-games-header">
              <div>
                <div className="section-super-title">HISTÓRICO RECENTE</div>
                <h3 className="section-main-title">
                  Últimos {stats.recentGames.length} Jogos Realizados
                </h3>
              </div>
              <span className="recent-games-hint">
                Dados consolidados de cada partida disputada pelo atleta
              </span>
            </div>

            <div className="recent-games-table-wrapper">
              <table className="recent-games-table">
                <thead>
                  <tr>
                    <th>Resultado</th>
                    <th>Partida / Adversário</th>
                    <th>Pokémon</th>
                    <th>KOs</th>
                    <th>Assists</th>
                    <th>Pontos</th>
                    <th>Dano Causado</th>
                    <th>MVP</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentGames.map((game, idx) => {
                    const matchedScrim = scrims.find(s => s.id === game.scrimId);

                    return (
                      <tr key={`${game.scrimId}-${game.gameNumber}-${idx}`} className="recent-game-row">
                        {/* Resultado */}
                        <td>
                          <span className={`result-tag ${game.isVictory ? 'victory' : 'defeat'}`}>
                            {game.isVictory ? 'VITÓRIA' : 'DERROTA'}
                          </span>
                          <div className="game-score-small">
                            {game.scoreUs} x {game.scoreThem}
                          </div>
                        </td>

                        {/* Adversário & Série */}
                        <td>
                          <div className="opponent-cell-title">
                            vs {game.opponentTeam} <span className="opp-tag">[{game.opponentTag}]</span>
                          </div>
                          <div className="opponent-cell-sub">
                            Jogo {game.gameNumber} • {game.category} ({game.format})
                          </div>
                        </td>

                        {/* Pokémon */}
                        <td>
                          <div className="table-poke-cell">
                            <img
                              src={game.pokemonSprite}
                              alt={game.pokemonName}
                              className="table-poke-thumb"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://d275t8dp8rxb42.cloudfront.net/pokemon/thumbnail/Pikachu.png';
                              }}
                            />
                            <div>
                              <div className="table-poke-name">{game.pokemonName}</div>
                              <span className="table-poke-role">{game.pokemonRole || 'Pokémon'}</span>
                            </div>
                          </div>
                        </td>

                        {/* KOs */}
                        <td>
                          <span className="table-stat-pill kos">
                            <Swords size={12} /> {game.kos}
                          </span>
                        </td>

                        {/* Assists */}
                        <td>
                          <span className="table-stat-pill assists">
                            <Zap size={12} /> {game.assists}
                          </span>
                        </td>

                        {/* Pontos */}
                        <td>
                          <span className="table-stat-pill points">
                            <Target size={12} /> {game.points}
                          </span>
                        </td>

                        {/* Dano Causado */}
                        <td>
                          <span className="table-damage-val">
                            {game.damage > 0 ? `${game.damage.toLocaleString('pt-BR')}` : '-'}
                          </span>
                        </td>

                        {/* MVP */}
                        <td>
                          {game.isMvp ? (
                            <span className="table-mvp-badge" title="Eleito MVP da Partida">
                              <Crown size={13} color="#F59E0B" /> MVP
                            </span>
                          ) : (
                            <span className="table-no-mvp">-</span>
                          )}
                        </td>

                        {/* Data */}
                        <td>
                          <span className="table-date-text">
                            {game.date}
                          </span>
                        </td>

                        {/* Ações */}
                        <td>
                          {matchedScrim && (
                            <button
                              type="button"
                              className="table-view-btn"
                              title="Ver Relatório Completo da Série"
                              onClick={() => setInspectedScrim(matchedScrim)}
                            >
                              <span>Ver Jogo</span>
                              <ArrowUpRight size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal de Detalhes da Partida ao Clicar em "Ver Jogo" */}
      {inspectedScrim && (
        <MatchStatsModal
          isOpen={Boolean(inspectedScrim)}
          onClose={() => setInspectedScrim(null)}
          scrim={inspectedScrim}
          teamName={teamName}
          canEdit={false}
          onSaveStats={(updated) => {
            onUpdateScrim(updated);
            setInspectedScrim(null);
          }}
          members={members}
        />
      )}

      {/* =========================================================================
          ESTILOS CSS EMBUTIDOS ULTRA-PREMIUM (DARK GLASSMORPHISM + ESPORTS RED)
          ========================================================================= */}
      <style>{`
        .stats-dashboard-root {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 20px 60px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: statsFadeIn 0.35s ease-out;
        }

        @keyframes statsFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Top Bar */
        .stats-top-bar {
          padding: 18px 24px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(16px);
        }

        .stats-title-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .stats-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 16px rgba(244, 63, 94, 0.2);
        }

        .stats-sub-title {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: #F43F5E;
          text-transform: uppercase;
        }

        .stats-main-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #FFF;
          margin: 2px 0 0;
          letter-spacing: -0.02em;
        }

        .stats-controls-row {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .stats-control-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        /* Player Dropdown */
        .player-selector-dropdown-wrapper {
          position: relative;
        }

        .custom-player-select {
          position: relative;
          min-width: 250px;
        }

        .player-select-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: rgba(30, 41, 59, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 7px 14px;
          border-radius: 12px;
          color: #FFF;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .player-select-btn:hover, .player-select-btn.open {
          border-color: #F43F5E;
          background: rgba(30, 41, 59, 1);
          box-shadow: 0 0 12px rgba(244, 63, 94, 0.25);
        }

        .player-select-btn-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
        }

        .player-select-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #F43F5E;
        }

        .player-select-nick {
          font-size: 0.92rem;
          font-weight: 700;
          color: #FFF;
          display: block;
        }

        .player-select-role {
          font-size: 0.72rem;
          color: #94A3B8;
          display: block;
        }

        .chevron-icon {
          color: #94A3B8;
          transition: transform 0.2s ease;
        }

        .chevron-icon.rotate {
          transform: rotate(180deg);
        }

        .player-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          z-index: 99;
          background: #0F172A;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          max-height: 320px;
          overflow-y: auto;
        }

        .player-dropdown-header {
          padding: 10px 14px;
          font-size: 0.72rem;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(15, 23, 42, 0.9);
        }

        .player-dropdown-item {
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: background 0.15s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .player-dropdown-item:hover {
          background: rgba(244, 63, 94, 0.1);
        }

        .player-dropdown-item.selected {
          background: rgba(244, 63, 94, 0.18);
        }

        .dropdown-item-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .dropdown-item-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #FFF;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .titular-pill {
          font-size: 0.64rem;
          padding: 1px 6px;
          border-radius: 6px;
          background: rgba(16, 185, 129, 0.2);
          color: #10B981;
          font-weight: 700;
        }

        .dropdown-item-sub {
          font-size: 0.72rem;
          color: #94A3B8;
        }

        /* Filter Pills */
        .filter-pill-container {
          display: flex;
          background: rgba(30, 41, 59, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 3px;
          gap: 3px;
        }

        .category-pill-btn {
          border: none;
          background: transparent;
          color: #94A3B8;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 7px 14px;
          border-radius: 9px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .category-pill-btn:hover {
          color: #FFF;
        }

        .category-pill-btn.active {
          background: #F43F5E;
          color: #FFF;
          box-shadow: 0 0 12px rgba(244, 63, 94, 0.4);
        }

        /* Hero Athlete Card */
        .athlete-hero-card {
          padding: 24px 28px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%);
          border: 1px solid rgba(244, 63, 94, 0.25);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .athlete-hero-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .athlete-avatar-frame {
          position: relative;
        }

        .athlete-hero-avatar {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #F43F5E;
          box-shadow: 0 0 20px rgba(244, 63, 94, 0.35);
        }

        .athlete-status-dot {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #10B981;
          border: 2px solid #0F172A;
          box-shadow: 0 0 8px #10B981;
        }

        .athlete-tag-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .athlete-team-tag {
          font-size: 0.72rem;
          font-weight: 800;
          color: #F43F5E;
          background: rgba(244, 63, 94, 0.15);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .athlete-role-tag, .athlete-lane-tag {
          font-size: 0.72rem;
          font-weight: 700;
          color: #CBD5E1;
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .athlete-hero-nick {
          font-size: 1.85rem;
          font-weight: 900;
          color: #FFF;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .athlete-sub-info {
          font-size: 0.85rem;
          color: #94A3B8;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .dot-sep {
          color: #475569;
        }

        .athlete-hero-right-badges {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .hero-kpi-badge {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 12px 18px;
          min-width: 140px;
        }

        .hero-kpi-badge.gold-aura {
          border-color: rgba(245, 158, 11, 0.3);
          background: rgba(245, 158, 11, 0.05);
        }

        .hero-kpi-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 4px;
        }

        .hero-kpi-val-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .hero-kpi-val {
          font-size: 1.6rem;
          font-weight: 900;
        }

        .hero-kpi-sub {
          font-size: 0.78rem;
          color: #94A3B8;
          font-weight: 600;
        }

        .poke-hero-badge {
          display: flex;
          flex-direction: column;
        }

        .hero-poke-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 2px;
        }

        .hero-poke-thumb {
          width: 38px;
          height: 38px;
          object-fit: contain;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
        }

        .hero-poke-name {
          font-size: 0.92rem;
          font-weight: 800;
          color: #FFF;
        }

        .hero-poke-stats {
          font-size: 0.72rem;
          color: #10B981;
          font-weight: 700;
        }

        /* KPI Cards Grid */
        .stats-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 16px;
        }

        .kpi-card {
          padding: 18px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .kpi-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .kpi-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .kpi-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-icon-wrap.emerald { background: rgba(16, 185, 129, 0.15); color: #10B981; }
        .kpi-icon-wrap.cyan { background: rgba(6, 182, 212, 0.15); color: #06B6D4; }
        .kpi-icon-wrap.amber { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
        .kpi-icon-wrap.rose { background: rgba(244, 63, 94, 0.15); color: #F43F5E; }
        .kpi-icon-wrap.yellow { background: rgba(234, 179, 8, 0.15); color: #EAB308; }
        .kpi-icon-wrap.purple { background: rgba(147, 51, 234, 0.15); color: #9333EA; }

        .kpi-value-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .kpi-main-num {
          font-size: 1.85rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .kpi-unit {
          font-size: 0.78rem;
          font-weight: 600;
          color: #64748B;
        }

        .kpi-sub-row {
          font-size: 0.74rem;
          color: #94A3B8;
        }

        .kpi-bar-track {
          width: 100%;
          height: 5px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 3px;
          margin-top: 4px;
          overflow: hidden;
        }

        .kpi-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        .kpi-dual-bar {
          display: flex;
          width: 100%;
          height: 5px;
          border-radius: 3px;
          overflow: hidden;
          margin-top: 4px;
          gap: 2px;
        }

        .dual-bar-item {
          height: 100%;
        }

        .kpi-poke-main-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 2px;
        }

        .kpi-poke-img {
          width: 36px;
          height: 36px;
          object-fit: contain;
        }

        .kpi-poke-name {
          font-size: 1.1rem;
          font-weight: 800;
          color: #FFF;
        }

        .kpi-poke-role {
          font-size: 0.68rem;
          color: #A855F7;
          font-weight: 700;
        }

        /* Charts Section */
        .stats-charts-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .charts-main-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        .charts-secondary-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 20px;
        }

        @media (max-width: 960px) {
          .charts-main-grid, .charts-secondary-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-box {
          padding: 22px;
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          flex-direction: column;
        }

        .chart-box-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .chart-box-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chart-box-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #FFF;
          letter-spacing: -0.01em;
        }

        .chart-box-badge {
          font-size: 0.68rem;
          font-weight: 800;
          background: rgba(147, 51, 234, 0.15);
          color: #A855F7;
          padding: 3px 8px;
          border-radius: 6px;
        }

        /* Timeline Metric Toggles */
        .timeline-metric-toggle {
          display: flex;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 2px;
          gap: 2px;
        }

        .metric-toggle-btn {
          border: none;
          background: transparent;
          color: #94A3B8;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .metric-toggle-btn.active {
          background: #F43F5E;
          color: #FFF;
        }

        /* Chart SVG Styling */
        .timeline-chart-root {
          width: 100%;
          position: relative;
        }

        .chart-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.74rem;
          color: #94A3B8;
          margin-bottom: 10px;
        }

        .chart-title-tag {
          font-weight: 700;
        }

        .chart-quick-legend {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .svg-responsive-container {
          position: relative;
          width: 100%;
        }

        .timeline-svg {
          width: 100%;
          height: auto;
          overflow: visible;
        }

        .chart-axis-label {
          font-size: 10px;
          fill: #64748B;
          font-family: inherit;
        }

        .chart-x-label {
          font-size: 10px;
          fill: #94A3B8;
          font-weight: 700;
          font-family: inherit;
        }

        .chart-bar-hover {
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .chart-bar-hover:hover {
          opacity: 0.85;
        }

        /* Floating Tooltip */
        .chart-floating-tooltip {
          position: absolute;
          transform: translate(-50%, -100%);
          background: #090D16;
          border: 1px solid rgba(244, 63, 94, 0.4);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7);
          border-radius: 12px;
          padding: 10px 14px;
          pointer-events: none;
          z-index: 10;
          min-width: 160px;
          animation: tooltipPop 0.15s ease-out;
        }

        @keyframes tooltipPop {
          from { opacity: 0; transform: translate(-50%, -90%); }
          to { opacity: 1; transform: translate(-50%, -100%); }
        }

        .tooltip-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 6px;
          margin-bottom: 6px;
        }

        .tooltip-result-badge {
          font-size: 0.65rem;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .tooltip-result-badge.win { background: rgba(16, 185, 129, 0.2); color: #10B981; }
        .tooltip-result-badge.loss { background: rgba(239, 68, 68, 0.2); color: #EF4444; }

        .tooltip-score {
          font-size: 0.8rem;
          font-weight: 800;
          color: #FFF;
        }

        .tooltip-poke-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .tooltip-poke-img {
          width: 26px;
          height: 26px;
          object-fit: contain;
        }

        .tooltip-poke-name {
          font-size: 0.82rem;
          font-weight: 800;
          color: #FFF;
        }

        .tooltip-vs {
          font-size: 0.68rem;
          color: #94A3B8;
        }

        .tooltip-stats-grid {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.75rem;
        }

        .tooltip-stat {
          display: flex;
          flex-direction: column;
        }

        .t-label {
          font-size: 0.62rem;
          color: #64748B;
          text-transform: uppercase;
        }

        .t-val {
          font-weight: 800;
        }

        .tooltip-mvp-tag {
          margin-top: 6px;
          padding-top: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.68rem;
          color: #F59E0B;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Donut Chart */
        .donut-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .donut-svg-container {
          width: 170px;
          height: 170px;
        }

        .donut-svg {
          width: 100%;
          height: 100%;
        }

        .donut-center-val {
          font-size: 24px;
          font-weight: 900;
          fill: #FFF;
          font-family: inherit;
        }

        .donut-center-sub {
          font-size: 11px;
          font-weight: 700;
          fill: #94A3B8;
          font-family: inherit;
          text-transform: uppercase;
        }

        .donut-legend {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .legend-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          font-size: 0.74rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .legend-badge:hover, .legend-badge.active {
          background: rgba(255, 255, 255, 0.1);
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-name {
          color: #94A3B8;
        }

        .legend-val {
          font-weight: 800;
        }

        /* Radar Chart */
        .radar-card-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .radar-title-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .radar-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #FFF;
        }

        .radar-sub {
          font-size: 0.75rem;
          color: #F43F5E;
          font-weight: 700;
        }

        .radar-svg-wrapper {
          width: 260px;
          height: 260px;
        }

        .radar-svg {
          width: 100%;
          height: 100%;
        }

        .radar-axis-text {
          font-size: 9px;
          font-weight: 800;
          fill: #CBD5E1;
          font-family: inherit;
        }

        .radar-polygon-anim {
          transition: all 0.4s ease;
        }

        /* Pokemon Usage List */
        .poke-usage-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .poke-usage-item {
          padding: 10px 14px;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .poke-usage-item:hover {
          background: rgba(30, 41, 59, 0.75);
          transform: translateX(4px);
        }

        .poke-usage-item.featured {
          border-color: rgba(245, 158, 11, 0.3);
          background: rgba(245, 158, 11, 0.04);
        }

        .poke-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .poke-item-rank {
          font-size: 0.8rem;
          font-weight: 900;
          color: #64748B;
          width: 20px;
        }

        .poke-thumb-wrap {
          position: relative;
        }

        .poke-item-thumb {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .most-used-crown {
          position: absolute;
          top: -4px;
          right: -4px;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 50%;
          padding: 2px;
        }

        .poke-info-col {
          display: flex;
          flex-direction: column;
        }

        .poke-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .poke-name {
          font-size: 0.92rem;
          font-weight: 800;
          color: #FFF;
        }

        .poke-role-badge {
          font-size: 0.65rem;
          padding: 1px 6px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.08);
          color: #CBD5E1;
        }

        .poke-metrics-sub {
          font-size: 0.72rem;
          color: #94A3B8;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .poke-item-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          min-width: 100px;
        }

        .poke-winrate-box {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .poke-wr-num {
          font-size: 0.95rem;
          font-weight: 900;
        }

        .poke-record-label {
          font-size: 0.72rem;
          color: #64748B;
        }

        .poke-progress-track {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
        }

        .poke-progress-fill {
          height: 100%;
          border-radius: 2px;
        }

        /* Recent Games Section */
        .recent-games-section {
          padding: 24px;
          border-radius: 20px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .recent-games-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .section-super-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: #F43F5E;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .section-main-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #FFF;
          margin: 2px 0 0;
        }

        .recent-games-hint {
          font-size: 0.78rem;
          color: #94A3B8;
        }

        .recent-games-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .recent-games-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }

        .recent-games-table th {
          padding: 12px 14px;
          color: #64748B;
          font-weight: 800;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .recent-games-table td {
          padding: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: #CBD5E1;
        }

        .recent-game-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .result-tag {
          font-size: 0.7rem;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 6px;
          display: inline-block;
        }

        .result-tag.victory {
          background: rgba(16, 185, 129, 0.15);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .result-tag.defeat {
          background: rgba(239, 68, 68, 0.15);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .game-score-small {
          font-size: 0.72rem;
          color: #94A3B8;
          font-weight: 700;
          margin-top: 4px;
        }

        .opponent-cell-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: #FFF;
        }

        .opp-tag {
          color: #F43F5E;
        }

        .opponent-cell-sub {
          font-size: 0.72rem;
          color: #64748B;
        }

        .table-poke-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .table-poke-thumb {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .table-poke-name {
          font-size: 0.88rem;
          font-weight: 800;
          color: #FFF;
        }

        .table-poke-role {
          font-size: 0.68rem;
          color: #94A3B8;
        }

        .table-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.8rem;
        }

        .table-stat-pill.kos {
          background: rgba(244, 63, 94, 0.1);
          color: #F43F5E;
        }

        .table-stat-pill.assists {
          background: rgba(6, 182, 212, 0.1);
          color: #06B6D4;
        }

        .table-stat-pill.points {
          background: rgba(234, 179, 8, 0.1);
          color: #EAB308;
        }

        .table-damage-val {
          font-weight: 700;
          color: #CBD5E1;
        }

        .table-mvp-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 800;
          color: #F59E0B;
          background: rgba(245, 158, 11, 0.15);
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .table-no-mvp {
          color: #475569;
        }

        .table-date-text {
          font-size: 0.78rem;
          color: #94A3B8;
        }

        .table-view-btn {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #FFF;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .table-view-btn:hover {
          background: rgba(244, 63, 94, 0.2);
          border-color: #F43F5E;
        }

        /* Empty State */
        .stats-empty-card {
          padding: 60px 24px;
          border-radius: 20px;
          text-align: center;
          background: rgba(15, 23, 42, 0.7);
          border: 1px dashed rgba(255, 255, 255, 0.12);
        }

        .empty-card-inner {
          max-width: 520px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .empty-icon-ring {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 24px rgba(244, 63, 94, 0.2);
        }

        .empty-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #FFF;
          margin: 0;
        }

        .empty-desc {
          font-size: 0.9rem;
          color: #94A3B8;
          line-height: 1.5;
          margin: 0;
        }

        .empty-actions-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Utilities */
        .text-emerald { color: #10B981; }
        .text-rose { color: #F43F5E; }
        .text-cyan { color: #06B6D4; }
        .text-amber { color: #F59E0B; }
        .text-yellow { color: #EAB308; }
        .text-purple { color: #9333EA; }
        .bg-emerald { background-color: #10B981; }
        .bg-rose { background-color: #F43F5E; }
        .bg-cyan { background-color: #06B6D4; }
        .bg-amber { background-color: #F59E0B; }
        .bg-yellow { background-color: #EAB308; }
        .bg-purple { background-color: #9333EA; }
        .inline-icon { display: inline-block; vertical-align: middle; margin-right: 4px; }
      `}</style>
    </div>
  );
};

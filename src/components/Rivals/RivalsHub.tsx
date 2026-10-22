import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Swords, 
  Trophy, 
  Plus, 
  Search, 
  Calendar, 
  Flame, 
  Tv, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  ExternalLink, 
  MessageSquare, 
  Users, 
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import type { OpponentTeam, ScrimEvent, Role, TeamMember, AppUser } from '../../types';
import { 
  calculateRivalStats, 
  discoverUnregisteredRivals, 
  calculateRivalsGlobalSummary, 
  type RivalStats 
} from '../../utils/rivalStatsCalculator';
import { showToast } from '../UI/toastService';

const generateRivalId = (): string => `rival-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

interface RivalsHubProps {
  currentRole: Role;
  currentUser?: AppUser | null;
  opponentTeams: OpponentTeam[];
  scrims: ScrimEvent[];
  members: TeamMember[];
  onSaveTeam: (team: OpponentTeam) => void;
  onDeleteTeam: (id: string) => void;
  onNavigate: (tab: string) => void;
  teamName: string;
}

export const RivalsHub: React.FC<RivalsHubProps> = ({
  currentRole,
  opponentTeams,
  scrims,
  onSaveTeam,
  onDeleteTeam,
  onNavigate,
  teamName: _teamName,
}) => {
  const canManage = currentRole === 'Dono' || currentRole === 'Manager' || currentRole === 'Coach';

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [recordFilter, setRecordFilter] = useState<'TODOS' | 'POSITIVO' | 'DEBITO' | 'EMPATE'>('TODOS');
  const [tierFilter, setTierFilter] = useState<string>('TODOS');
  const [activeTabSection, setActiveTabSection] = useState<'CADASTRADOS' | 'DESCOBERTOS'>('CADASTRADOS');
  const [sortBy, setSortBy] = useState<'GAMES' | 'WINRATE_DESC' | 'WINRATE_ASC' | 'RECENT' | 'NAME'>('GAMES');

  // Estado do Raio-X Detalhado do Rival Selecionado
  const [inspectedRivalId, setInspectedRivalId] = useState<string | null>(null);
  const [scoutingTab, setScoutingTab] = useState<'MATCHES' | 'SCOUTING' | 'POKEMON' | 'ROSTER'>('MATCHES');

  // Estado do Modal de Edição / Criação
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<OpponentTeam | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formTier, setFormTier] = useState<'Tier 1' | 'Tier 2' | 'Rival Direto' | 'Treino Frequente' | 'Academia'>('Rival Direto');
  const [formContact, setFormContact] = useState('');
  const [formDiscord, setFormDiscord] = useState('');
  const [formRegion, setFormRegion] = useState('Brasil');
  const [formPlaystyle, setFormPlaystyle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPlayerInput, setFormPlayerInput] = useState('');
  const [formPlayersList, setFormPlayersList] = useState<string[]>([]);

  // Estado das notas táticas no Raio-X
  const [tacticalNotesDraft, setTacticalNotesDraft] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // 1. Descobrir adversários não registrados em scrims existentes
  const discoveredOpponents = useMemo(() => {
    return discoverUnregisteredRivals(opponentTeams, scrims);
  }, [opponentTeams, scrims]);

  // 2. Calcular estatísticas de todos os rivais cadastrados
  const registeredRivalsStats: RivalStats[] = useMemo(() => {
    return opponentTeams.map(team => calculateRivalStats(team, scrims, true));
  }, [opponentTeams, scrims]);

  // 3. Calcular estatísticas de adversários descobertos na agenda
  const discoveredRivalsStats: RivalStats[] = useMemo(() => {
    return discoveredOpponents.map(team => calculateRivalStats(team, scrims, false));
  }, [discoveredOpponents, scrims]);

  // 4. Sumário global de inteligência competitiva
  const globalSummary = useMemo(() => {
    return calculateRivalsGlobalSummary([...registeredRivalsStats, ...discoveredRivalsStats]);
  }, [registeredRivalsStats, discoveredRivalsStats]);

  // 5. Lista ativa filtrada e ordenada
  const currentStatsList = activeTabSection === 'CADASTRADOS' ? registeredRivalsStats : discoveredRivalsStats;

  const filteredRivals = useMemo(() => {
    let result = currentStatsList.filter(stat => {
      // Busca por nome, tag ou jogadores
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = stat.team.name.toLowerCase().includes(query);
        const matchesTag = stat.team.tag.toLowerCase().includes(query);
        const matchesPlayers = stat.team.players.some(p => p.toLowerCase().includes(query));
        if (!matchesName && !matchesTag && !matchesPlayers) return false;
      }

      // Filtro de retrospecto
      if (recordFilter === 'POSITIVO' && stat.seriesWon <= stat.seriesLost) return false;
      if (recordFilter === 'DEBITO' && stat.seriesLost <= stat.seriesWon) return false;
      if (recordFilter === 'EMPATE' && (stat.seriesWon !== stat.seriesLost || stat.completedSeries === 0)) return false;

      // Filtro de Tier
      if (tierFilter !== 'TODOS' && stat.team.tier !== tierFilter) return false;

      return true;
    });

    // Ordenação
    result.sort((a, b) => {
      if (sortBy === 'GAMES') return b.totalSeries - a.totalSeries;
      if (sortBy === 'WINRATE_DESC') return b.seriesWinRate - a.seriesWinRate;
      if (sortBy === 'WINRATE_ASC') return a.seriesWinRate - b.seriesWinRate;
      if (sortBy === 'RECENT') {
        const dateA = a.lastPlayedDate || '';
        const dateB = b.lastPlayedDate || '';
        return dateB.localeCompare(dateA);
      }
      if (sortBy === 'NAME') return a.team.name.localeCompare(b.team.name);
      return 0;
    });

    return result;
  }, [currentStatsList, searchTerm, recordFilter, tierFilter, sortBy]);

  // Rival atualmente inspecionado no Raio-X
  const inspectedStat = useMemo(() => {
    if (!inspectedRivalId) return null;
    return [...registeredRivalsStats, ...discoveredRivalsStats].find(
      s => s.team.id === inspectedRivalId
    ) || null;
  }, [inspectedRivalId, registeredRivalsStats, discoveredRivalsStats]);

  // Abertura do modal de criação
  const handleOpenCreateModal = () => {
    setEditingTeam(null);
    setFormName('');
    setFormTag('');
    setFormTier('Rival Direto');
    setFormContact('');
    setFormDiscord('');
    setFormRegion('Brasil');
    setFormPlaystyle('');
    setFormNotes('');
    setFormPlayersList([]);
    setFormPlayerInput('');
    setIsEditModalOpen(true);
  };

  // Abertura do modal de edição
  const handleOpenEditModal = (team: OpponentTeam) => {
    setEditingTeam(team);
    setFormName(team.name);
    setFormTag(team.tag);
    setFormTier(team.tier || 'Rival Direto');
    setFormContact(team.contact || '');
    setFormDiscord(team.discord || '');
    setFormRegion(team.region || 'Brasil');
    setFormPlaystyle(team.tacticalPlaystyle || '');
    setFormNotes(team.notes || '');
    setFormPlayersList([...team.players]);
    setFormPlayerInput('');
    setIsEditModalOpen(true);
  };

  // Transformar um adversário descoberto na agenda em um Rival Oficial cadastrado
  const handleRegisterDiscoveredTeam = (discovered: OpponentTeam) => {
    const officialTeam: OpponentTeam = {
      ...discovered,
      id: generateRivalId(),
      createdAt: new Date().toISOString(),
    };
    onSaveTeam(officialTeam);
    showToast(`Equipe "${officialTeam.name}" cadastrada oficialmente no Hub de Rivais!`, 'success');
  };

  // Salvar formulário
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTag.trim()) {
      showToast('Nome e Tag da equipe são obrigatórios.', 'error');
      return;
    }

    const teamToSave: OpponentTeam = {
      id: editingTeam ? editingTeam.id : generateRivalId(),
      name: formName.trim(),
      tag: formTag.trim().toUpperCase(),
      tier: formTier,
      contact: formContact.trim() || undefined,
      discord: formDiscord.trim() || undefined,
      region: formRegion.trim() || 'Brasil',
      tacticalPlaystyle: formPlaystyle.trim() || undefined,
      notes: formNotes.trim() || undefined,
      players: formPlayersList.length > 0 ? formPlayersList : ['Top Laner', 'Jungler', 'Mid Attacker', 'Supporter', 'Defender'],
      createdAt: editingTeam?.createdAt || new Date().toISOString(),
    };

    onSaveTeam(teamToSave);
    setIsEditModalOpen(false);
    showToast(`Rival "${teamToSave.name}" salvo com sucesso!`, 'success');
  };

  // Salvar anotações táticas de scouting diretamente no Raio-X
  const handleSaveTacticalNotes = async () => {
    if (!inspectedStat) return;
    setIsSavingNotes(true);
    try {
      const updatedTeam: OpponentTeam = {
        ...inspectedStat.team,
        notes: tacticalNotesDraft.trim(),
      };
      await onSaveTeam(updatedTeam);
      showToast('Anotações táticas de scouting atualizadas!', 'success');
    } catch (err) {
      console.warn('Erro ao salvar notas de scouting:', err);
      showToast('Erro ao salvar anotações.', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Adicionar player ao formulário
  const handleAddPlayer = () => {
    const trimmed = formPlayerInput.trim();
    if (!trimmed) return;
    if (!formPlayersList.includes(trimmed)) {
      setFormPlayersList(prev => [...prev, trimmed]);
    }
    setFormPlayerInput('');
  };

  return (
    <div className="rivals-hub-root">
      {/* =========================================================================
          1. HEADER SUPERIOR COM IDENTIDADE OFICIAL & AÇÕES RÁPIDAS
          ========================================================================= */}
      <section className="rivals-hero-card glass-panel">
        <div className="rivals-hero-left">
          <div className="rivals-badge-icon">
            <Target size={24} color="#0B5FFF" />
          </div>
          <div>
            <div className="rivals-tag-row">
              <span className="rivals-tag">CENTRAL DE SCOUTING DA FRIBA</span>
              <span className="rivals-intel">HEAD-TO-HEAD INTEL</span>
            </div>
            <h1 className="rivals-main-title">
              Hub de <span className="text-blue">Rivais</span> & <span className="text-red">Scouting</span>
            </h1>
            <p className="rivals-sub-title">
              Dossiê tático, histórico detalhado de confrontos diretos, aproveitamento de mapas e leitura de jogo contra os adversários de Pokémon Unite.
            </p>
          </div>
        </div>

        <div className="rivals-hero-actions">
          {canManage && (
            <button 
              type="button" 
              className="btn-primary rivals-create-btn"
              onClick={handleOpenCreateModal}
            >
              <Plus size={16} /> Cadastrar Novo Rival
            </button>
          )}

          <button 
            type="button" 
            className="btn-secondary rivals-agenda-btn"
            onClick={() => onNavigate('agenda')}
          >
            <Calendar size={15} /> Ver Agenda de Scrims
          </button>
        </div>
      </section>

      {/* =========================================================================
          2. CARDS DE KPIS GLOBAIS DE CONFRONTO DA FRIBA
          ========================================================================= */}
      <section className="rivals-kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-card-header">
            <span className="kpi-title">Rivais no Radar</span>
            <div className="kpi-icon-wrap blue"><Users size={16} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-num text-blue">{globalSummary.totalRivals}</span>
            <span className="kpi-unit">equipes mapeadas</span>
          </div>
          <div className="kpi-sub-row">
            {opponentTeams.length} oficiais • {discoveredOpponents.length} encontrados na agenda
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-card-header">
            <span className="kpi-title">Retrospecto Geral Friba</span>
            <div className="kpi-icon-wrap emerald"><Trophy size={16} /></div>
          </div>
          <div className="kpi-value-row">
            <span className={`kpi-main-num ${globalSummary.overallWinRate >= 50 ? 'text-emerald' : 'text-rose'}`}>
              {globalSummary.overallWinRate}%
            </span>
            <span className="kpi-unit">Win Rate em Séries</span>
          </div>
          <div className="kpi-sub-row">
            {globalSummary.totalSeriesWon}V - {globalSummary.totalSeriesLost}D ({globalSummary.totalSeriesPlayed} séries totais)
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-card-header">
            <span className="kpi-title">Maior Frequência de Treino</span>
            <div className="kpi-icon-wrap amber"><Flame size={16} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-num text-amber">
              {globalSummary.mostFrequentRival ? globalSummary.mostFrequentRival.tag : 'Nenhum'}
            </span>
            <span className="kpi-unit">{globalSummary.mostFrequentRival ? `${globalSummary.mostFrequentRival.count} séries` : 'Aguardando jogos'}</span>
          </div>
          <div className="kpi-sub-row">
            {globalSummary.mostFrequentRival ? globalSummary.mostFrequentRival.name : 'Cadastre ou finalize scrims'}
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-card-header">
            <span className="kpi-title">Saldo Geral de Pontos</span>
            <div className="kpi-icon-wrap rose"><Swords size={16} /></div>
          </div>
          <div className="kpi-value-row">
            <span className={`kpi-main-num ${globalSummary.totalPointsDifferential >= 0 ? 'text-emerald' : 'text-rose'}`}>
              {globalSummary.totalPointsDifferential >= 0 ? `+${globalSummary.totalPointsDifferential}` : globalSummary.totalPointsDifferential}
            </span>
            <span className="kpi-unit">pontos saldo</span>
          </div>
          <div className="kpi-sub-row">
            Diferencial acumulado em todos os mapas
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. BARRA DE PESQUISA, FILTROS & SELETOR DE ABA (CADASTRADOS VS DESCOBERTOS)
          ========================================================================= */}
      <section className="rivals-controls-bar glass-panel">
        <div className="controls-left">
          {/* Seletor de Abas */}
          <div className="section-pill-toggle">
            <button
              type="button"
              className={`pill-btn ${activeTabSection === 'CADASTRADOS' ? 'active' : ''}`}
              onClick={() => setActiveTabSection('CADASTRADOS')}
            >
              <Target size={14} /> Rivais Oficiais ({opponentTeams.length})
            </button>
            <button
              type="button"
              className={`pill-btn ${activeTabSection === 'DESCOBERTOS' ? 'active' : ''}`}
              onClick={() => setActiveTabSection('DESCOBERTOS')}
            >
              <Sparkles size={14} /> Detectados na Agenda ({discoveredOpponents.length})
            </button>
          </div>

          {/* Campo de Busca */}
          <div className="search-input-wrapper">
            <Search size={15} className="search-ico" />
            <input
              type="text"
              placeholder="Buscar por equipe, tag ou jogador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rivals-search-input"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="search-clear-btn">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="controls-right">
          {/* Filtro de Retrospecto */}
          <div className="filter-select-group">
            <label className="filter-label">Retrospecto:</label>
            <select
              value={recordFilter}
              onChange={(e) => setRecordFilter(e.target.value as any)}
              className="rivals-filter-select"
            >
              <option value="TODOS">Todos os Saldos</option>
              <option value="POSITIVO">Friba em Vantagem (W &gt; L)</option>
              <option value="DEBITO">Friba em Débito (L &gt; W)</option>
              <option value="EMPATE">Confronto Empatado</option>
            </select>
          </div>

          {/* Filtro de Tier */}
          <div className="filter-select-group">
            <label className="filter-label">Tier:</label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rivals-filter-select"
            >
              <option value="TODOS">Todos os Tiers</option>
              <option value="Tier 1">Tier 1 (Elite)</option>
              <option value="Tier 2">Tier 2</option>
              <option value="Rival Direto">Rival Direto</option>
              <option value="Treino Frequente">Treino Frequente</option>
              <option value="Academia">Academia</option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="filter-select-group">
            <label className="filter-label">Ordenar:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rivals-filter-select"
            >
              <option value="GAMES">Mais Séries Jogadas</option>
              <option value="WINRATE_DESC">Maior Win Rate Friba</option>
              <option value="WINRATE_ASC">Menor Win Rate (Mais Difíceis)</option>
              <option value="RECENT">Mais Recentes</option>
              <option value="NAME">Nome (A - Z)</option>
            </select>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. GRID DE CARDS DOS RIVAIS (HEAD-TO-HEAD CARDS)
          ========================================================================= */}
      {filteredRivals.length === 0 ? (
        <div className="rivals-empty-card glass-panel">
          <div className="empty-inner">
            <div className="empty-ico-box">
              <Target size={38} color="#0B5FFF" />
            </div>
            <h3>Nenhum rival encontrado</h3>
            <p>
              {searchTerm 
                ? 'Nenhuma equipe corresponde à sua pesquisa. Tente limpar os filtros.'
                : activeTabSection === 'CADASTRADOS'
                  ? 'Você ainda não cadastrou equipes rivais oficiais. Cadastre uma nova equipe ou sincronize partidas na Agenda.'
                  : 'Nenhum adversário pendente foi detectado nas partidas da Agenda.'}
            </p>
            {canManage && activeTabSection === 'CADASTRADOS' && (
              <button type="button" className="btn-primary" onClick={handleOpenCreateModal}>
                <Plus size={16} /> Cadastrar Primeiro Rival
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rivals-cards-grid">
          {filteredRivals.map(stat => {
            const { team, seriesWon, seriesLost, seriesDrawn, seriesWinRate, totalSeries, gamesWon, gamesLost, pointDiff, streak, streakType, lastMatch } = stat;

            return (
              <div key={team.id} className="rival-card glass-panel">
                {/* Header do Card */}
                <div className="rival-card-head">
                  <div className="rival-info-left">
                    <div className="rival-tag-badge-box">
                      <span className="rival-tag-txt">{team.tag}</span>
                    </div>
                    <div>
                      <div className="rival-title-row">
                        <h3 className="rival-name">{team.name}</h3>
                        {team.tier && (
                          <span className={`tier-badge ${team.tier.toLowerCase().replace(/\s+/g, '-')}`}>
                            {team.tier}
                          </span>
                        )}
                        {!stat.isRegistered && (
                          <span className="detected-badge" title="Detectado a partir da Agenda de Scrims">
                            Detectado
                          </span>
                        )}
                      </div>
                      <div className="rival-meta-sub">
                        <span>{team.region || 'Brasil'}</span>
                        {team.discord && <span className="meta-dot">• {team.discord}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Streak Recente */}
                  {streak !== '-' && (
                    <div className={`streak-badge ${streakType}`}>
                      {streakType === 'win' && <Flame size={12} />}
                      <span>{streak}</span>
                    </div>
                  )}
                </div>

                {/* Retrospecto Head-to-Head */}
                <div className="rival-h2h-section">
                  <div className="h2h-score-row">
                    <div className="h2h-stat-box">
                      <span className="h2h-lbl">Win Rate Friba</span>
                      <span className={`h2h-num ${seriesWinRate >= 50 ? 'text-emerald' : 'text-rose'}`}>
                        {totalSeries > 0 ? `${seriesWinRate}%` : 'Sem Jogos'}
                      </span>
                    </div>
                    <div className="h2h-stat-box center">
                      <span className="h2h-lbl">Séries (W-L-D)</span>
                      <span className="h2h-num">
                        <strong className="text-emerald">{seriesWon}V</strong> - <strong className="text-rose">{seriesLost}D</strong> {seriesDrawn > 0 && <small className="text-dim">({seriesDrawn}E)</small>}
                      </span>
                    </div>
                    <div className="h2h-stat-box right">
                      <span className="h2h-lbl">Mapas</span>
                      <span className="h2h-num text-dim">
                        {gamesWon}W / {gamesLost}L
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso Win Rate */}
                  <div className="h2h-bar-track">
                    <div 
                      className={`h2h-bar-fill ${seriesWinRate >= 50 ? 'win' : 'loss'}`} 
                      style={{ width: `${totalSeries > 0 ? seriesWinRate : 0}%` }}
                    />
                  </div>

                  {/* Saldo de Pontos */}
                  <div className="h2h-points-diff-row">
                    <span className="diff-lbl">Saldo de Pontos Friba:</span>
                    <span className={`diff-val ${pointDiff >= 0 ? 'positive' : 'negative'}`}>
                      {pointDiff >= 0 ? `+${pointDiff}` : pointDiff} pts
                    </span>
                  </div>
                </div>

                {/* Último Confronto */}
                <div className="rival-last-match-box">
                  <div className="last-match-header">
                    <span className="last-match-tag">Último Confronto</span>
                    {lastMatch && (
                      <span className="last-match-date">
                        {lastMatch.date.split('-').slice(1).join('/')} às {lastMatch.time}
                      </span>
                    )}
                  </div>
                  {lastMatch ? (
                    <div className="last-match-result">
                      <span className="last-match-score">
                        Friba {lastMatch.score?.us ?? 0} x {lastMatch.score?.them ?? 0} {team.tag}
                      </span>
                      <span className={`last-match-status-badge ${(lastMatch.score?.us ?? 0) > (lastMatch.score?.them ?? 0) ? 'win' : 'loss'}`}>
                        {(lastMatch.score?.us ?? 0) > (lastMatch.score?.them ?? 0) ? 'VITÓRIA' : 'DERROTA'}
                      </span>
                    </div>
                  ) : (
                    <div className="last-match-none">
                      Ainda não há partidas finalizadas contra esta equipe.
                    </div>
                  )}
                </div>

                {/* Scouting Rápido / Anotações */}
                {team.notes && (
                  <div className="rival-scouting-preview">
                    <MessageSquare size={13} className="text-amber" />
                    <p className="scouting-text-snippet">{team.notes}</p>
                  </div>
                )}

                {/* Ações do Card */}
                <div className="rival-card-footer">
                  <button
                    type="button"
                    className="card-action-btn primary"
                    onClick={() => {
                      setInspectedRivalId(team.id);
                      setTacticalNotesDraft(team.notes || '');
                    }}
                  >
                    <Target size={14} /> Raio-X & Dossiê
                  </button>

                  {!stat.isRegistered ? (
                    <button
                      type="button"
                      className="card-action-btn register-btn"
                      onClick={() => handleRegisterDiscoveredTeam(team)}
                      title="Salvar como rival oficial da organização"
                    >
                      <Plus size={14} /> Tornar Oficial
                    </button>
                  ) : (
                    canManage && (
                      <div className="card-manage-btns">
                        <button
                          type="button"
                          className="card-mini-btn edit"
                          onClick={() => handleOpenEditModal(team)}
                          title="Editar Rival"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          className="card-mini-btn delete"
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja remover o rival "${team.name}"?`)) {
                              onDeleteTeam(team.id);
                              showToast(`Rival "${team.name}" removido.`, 'info');
                            }
                          }}
                          title="Excluir Rival"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          5. MODAL / RAIO-X DETALHADO DO RIVAL (SCOUTING DOSSIER & HEAD-TO-HEAD)
          ========================================================================= */}
      {inspectedStat && (
        <div className="modal-overlay" onClick={() => setInspectedRivalId(null)}>
          <div className="modal-content rival-dossier-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            {/* Header do Dossiê */}
            <div className="dossier-header">
              <div className="dossier-team-lead">
                <div className="dossier-avatar-badge">
                  <span>{inspectedStat.team.tag}</span>
                </div>
                <div>
                  <div className="dossier-title-row">
                    <h2>{inspectedStat.team.name}</h2>
                    {inspectedStat.team.tier && (
                      <span className="tier-badge-large">{inspectedStat.team.tier}</span>
                    )}
                  </div>
                  <div className="dossier-sub-info">
                    <span>{inspectedStat.team.region || 'Brasil'}</span>
                    {inspectedStat.team.contact && <span>• Contato: {inspectedStat.team.contact}</span>}
                    {inspectedStat.team.discord && <span>• Discord: {inspectedStat.team.discord}</span>}
                  </div>
                </div>
              </div>

              <div className="dossier-header-actions">
                <button
                  type="button"
                  className="btn-primary schedule-scrim-btn"
                  onClick={() => {
                    setInspectedRivalId(null);
                    onNavigate('agenda');
                  }}
                >
                  <Calendar size={14} /> Agendar Scrim vs {inspectedStat.team.tag}
                </button>
                <button 
                  type="button" 
                  className="dossier-close-btn" 
                  onClick={() => setInspectedRivalId(null)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Abas Internas do Dossiê */}
            <div className="dossier-tabs-nav">
              <button
                type="button"
                className={`dossier-tab-btn ${scoutingTab === 'MATCHES' ? 'active' : ''}`}
                onClick={() => setScoutingTab('MATCHES')}
              >
                <Swords size={15} /> Histórico de Séries ({inspectedStat.recentMatches.length})
              </button>
              <button
                type="button"
                className={`dossier-tab-btn ${scoutingTab === 'SCOUTING' ? 'active' : ''}`}
                onClick={() => setScoutingTab('SCOUTING')}
              >
                <Target size={15} /> Dossiê & Anotações de Coach
              </button>
              <button
                type="button"
                className={`dossier-tab-btn ${scoutingTab === 'POKEMON' ? 'active' : ''}`}
                onClick={() => setScoutingTab('POKEMON')}
              >
                <Zap size={15} /> Picks & Tendências
              </button>
              <button
                type="button"
                className={`dossier-tab-btn ${scoutingTab === 'ROSTER' ? 'active' : ''}`}
                onClick={() => setScoutingTab('ROSTER')}
              >
                <Users size={15} /> Elenco Conhecido ({inspectedStat.team.players.length})
              </button>
            </div>

            {/* Conteúdo da Aba 1: Histórico de Séries */}
            {scoutingTab === 'MATCHES' && (
              <div className="dossier-tab-body">
                {inspectedStat.recentMatches.length === 0 ? (
                  <div className="tab-empty-box">
                    <Calendar size={32} color="#64748B" />
                    <h4>Nenhuma partida registrada contra este rival</h4>
                    <p>Agende uma scrim na aba Agenda para computar o histórico automaticamente.</p>
                  </div>
                ) : (
                  <div className="dossier-matches-list">
                    {inspectedStat.recentMatches.map(match => {
                      const isWin = (match.score?.us ?? 0) > (match.score?.them ?? 0);
                      const isLoss = (match.score?.us ?? 0) < (match.score?.them ?? 0);

                      return (
                        <div key={match.id} className={`dossier-match-card ${isWin ? 'win-border' : isLoss ? 'loss-border' : ''}`}>
                          <div className="match-card-top">
                            <div className="match-meta-info">
                              <span className="match-date-badge">{match.date}</span>
                              <span className="match-format-tag">{match.format}</span>
                              <span className="match-cat-tag">{match.category || 'Treino'}</span>
                              <span className={`match-status-tag ${match.status.toLowerCase()}`}>{match.status}</span>
                            </div>

                            <div className="match-score-big">
                              <span className={`score-val ${isWin ? 'win' : ''}`}>Friba {match.score?.us ?? 0}</span>
                              <span className="score-sep">x</span>
                              <span className={`score-val ${isLoss ? 'win' : ''}`}>{match.score?.them ?? 0} {inspectedStat.team.tag}</span>
                            </div>

                            {match.vodUrl && (
                              <a 
                                href={match.vodUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="vod-link-btn"
                                title="Assistir VOD da partida"
                              >
                                <Tv size={14} /> Assistir VOD <ExternalLink size={12} />
                              </a>
                            )}
                          </div>

                          {/* Lista de Jogos Individuais se houver */}
                          {match.games && match.games.length > 0 && (
                            <div className="match-games-sublist">
                              <div className="games-sublist-header">Mapas Jogados:</div>
                              <div className="games-chips-row">
                                {match.games.map((g, idx) => {
                                  const gameWin = (g.scoreUs ?? 0) > (g.scoreThem ?? 0);
                                  return (
                                    <div key={idx} className={`game-chip ${gameWin ? 'win' : 'loss'}`}>
                                      <span className="chip-game-num">G{g.gameNumber || idx + 1}:</span>
                                      <span className="chip-score">{g.scoreUs ?? 0} x {g.scoreThem ?? 0}</span>
                                      {g.mvpMemberName && <span className="chip-mvp" title={`MVP: ${g.mvpMemberName}`}>👑</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {match.notes && (
                            <div className="match-notes-row">
                              <strong>Notas do jogo:</strong> {match.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Conteúdo da Aba 2: Scouting Tático */}
            {scoutingTab === 'SCOUTING' && (
              <div className="dossier-tab-body">
                <div className="scouting-editor-box">
                  <div className="editor-header">
                    <div>
                      <h4>Anotações Táticas & Leitura de Jogo do Coach</h4>
                      <p className="editor-sub">
                        Registre tendências de rotação, fraquezas identificadas, prioridades de objetivo e estilo de jogo deste rival.
                      </p>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        className="btn-primary save-notes-btn"
                        onClick={handleSaveTacticalNotes}
                        disabled={isSavingNotes}
                      >
                        <Check size={14} /> {isSavingNotes ? 'Salvando...' : 'Salvar Anotações'}
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={7}
                    placeholder="Ex: Rival muito forte na rota do Top aos 7:00. Priorizam comp agressiva de early game com Trevenant e Glaceon. Costumam tentar invadir a selva aos 8:50..."
                    value={tacticalNotesDraft}
                    onChange={(e) => setTacticalNotesDraft(e.target.value)}
                    className="scouting-textarea"
                    disabled={!canManage}
                  />

                  <div className="scouting-quick-tips">
                    <div className="tip-item">
                      <Info size={16} color="#0B5FFF" />
                      <span>Estas anotações ficam sincronizadas na nuvem para toda a comissão técnica da Friba.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo da Aba 3: Picks & Tendências de Pokémon */}
            {scoutingTab === 'POKEMON' && (
              <div className="dossier-tab-body">
                <div className="pokemon-tendencies-grid">
                  {/* Pokémon do Rival */}
                  <div className="tendency-col">
                    <h4 className="tendency-col-title">
                      <Swords size={16} color="#EF4444" /> Pokémon Mais Usados pelo Rival
                    </h4>
                    {inspectedStat.rivalPokemonPlayed.length === 0 ? (
                      <div className="tendency-empty">
                        Ainda não há dados individuais registrados para as partidas deste rival. Registre os detalhes dos jogos na Agenda.
                      </div>
                    ) : (
                      <div className="pokemon-picks-list">
                        {inspectedStat.rivalPokemonPlayed.map((item, idx) => (
                          <div key={idx} className="pokemon-pick-row">
                            <span className="pick-rank">#{idx + 1}</span>
                            <span className="pick-name">{item.name}</span>
                            <span className="pick-count-badge">{item.count}x pickado</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Melhores Respostas da Friba */}
                  <div className="tendency-col">
                    <h4 className="tendency-col-title">
                      <Trophy size={16} color="#10B981" /> Picks da Friba com Mais Sucesso
                    </h4>
                    {inspectedStat.fribaPokemonPlayed.length === 0 ? (
                      <div className="tendency-empty">
                        Dados de picks da Friba serão computados automaticamente conforme os jogos forem finalizados.
                      </div>
                    ) : (
                      <div className="pokemon-picks-list">
                        {inspectedStat.fribaPokemonPlayed.map((item, idx) => (
                          <div key={idx} className="pokemon-pick-row">
                            <span className="pick-rank">#{idx + 1}</span>
                            <span className="pick-name">{item.name}</span>
                            <span className="pick-winrate-badge">{item.winRate}% WR ({item.count}x)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo da Aba 4: Elenco Conhecido */}
            {scoutingTab === 'ROSTER' && (
              <div className="dossier-tab-body">
                <div className="roster-view-box">
                  <div className="roster-view-head">
                    <h4>Atletas Conhecidos da Equipe</h4>
                    <span className="roster-count">{inspectedStat.team.players.length} jogadores cadastrados</span>
                  </div>

                  <div className="roster-players-grid">
                    {inspectedStat.team.players.map((playerName, idx) => (
                      <div key={idx} className="roster-player-chip">
                        <div className="player-chip-avatar">
                          {playerName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="player-chip-info">
                          <span className="player-chip-name">{playerName}</span>
                          <span className="player-chip-sub">Posição #{idx + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          6. MODAL DE CADASTRO / EDIÇÃO DE RIVAL
          ========================================================================= */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content rival-form-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Target size={20} color="#0B5FFF" />
                <h3>{editingTeam ? `Editar Rival: ${editingTeam.name}` : 'Cadastrar Novo Rival'}</h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="rival-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Nome Oficial da Equipe *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: DreamMax Esports"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Tag da Equipe *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Ex: DMX"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label>Tier / Categoria</label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value as any)}
                  >
                    <option value="Tier 1">Tier 1 (Elite)</option>
                    <option value="Tier 2">Tier 2</option>
                    <option value="Rival Direto">Rival Direto</option>
                    <option value="Treino Frequente">Treino Frequente</option>
                    <option value="Academia">Academia</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Região / País</label>
                  <input
                    type="text"
                    placeholder="Ex: Brasil / LATAM"
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Estilo de Jogo Principal</label>
                  <input
                    type="text"
                    placeholder="Ex: Early Game / Agressivo"
                    value={formPlaystyle}
                    onChange={(e) => setFormPlaystyle(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Contato do Capitão / Manager</label>
                  <input
                    type="text"
                    placeholder="Ex: (21) 99999-9999 / WhatsApp"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Discord da Equipe / Servidor</label>
                  <input
                    type="text"
                    placeholder="Ex: discord.gg/rival ou capitao#1234"
                    value={formDiscord}
                    onChange={(e) => setFormDiscord(e.target.value)}
                  />
                </div>
              </div>

              {/* Gerenciamento de Atletas do Rival */}
              <div className="form-group">
                <label>Jogadores Conhecidos da Equipe</label>
                <div className="player-input-row">
                  <input
                    type="text"
                    placeholder="Nome ou nickname do jogador..."
                    value={formPlayerInput}
                    onChange={(e) => setFormPlayerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPlayer();
                      }
                    }}
                  />
                  <button type="button" className="btn-secondary" onClick={handleAddPlayer}>
                    <Plus size={14} /> Adicionar
                  </button>
                </div>

                <div className="form-players-tag-list">
                  {formPlayersList.map((player, idx) => (
                    <span key={idx} className="player-form-tag">
                      {player}
                      <button
                        type="button"
                        onClick={() => setFormPlayersList(prev => prev.filter((_, i) => i !== idx))}
                        className="remove-player-tag-btn"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {formPlayersList.length === 0 && (
                    <span className="no-players-hint">Nenhum atleta listado ainda.</span>
                  )}
                </div>
              </div>

              {/* Notas de Scouting Iniciais */}
              <div className="form-group">
                <label>Notas Iniciais de Scouting / Observações</label>
                <textarea
                  rows={3}
                  placeholder="Observações táticas da comissão técnica..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="form-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} /> {editingTeam ? 'Atualizar Rival' : 'Salvar Rival'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ESTILOS CSS EMBUTIDOS ULTRA-PREMIUM (DARK ESPORTS + APPLE GLASS)
          ========================================================================= */}
      <style>{`
        .rivals-hub-root {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 20px 60px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: rivalsFadeIn 0.35s ease-out;
        }

        @keyframes rivalsFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Hero */
        .rivals-hero-card {
          padding: 24px 28px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          background: linear-gradient(135deg, rgba(11, 95, 255, 0.08) 0%, rgba(10, 16, 32, 0.85) 100%);
          border: 1px solid rgba(11, 95, 255, 0.25);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
        }

        .rivals-hero-left {
          display: flex;
          align-items: center;
          gap: 18px;
          max-width: 780px;
        }

        .rivals-badge-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(11, 95, 255, 0.15);
          border: 1px solid rgba(11, 95, 255, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(11, 95, 255, 0.25);
        }

        .rivals-tag-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .rivals-tag {
          font-size: 0.72rem;
          font-weight: 800;
          color: #60A5FA;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .rivals-intel {
          font-size: 0.68rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(214, 31, 38, 0.2);
          color: #F87171;
          border: 1px solid rgba(214, 31, 38, 0.4);
        }

        .rivals-main-title {
          font-size: 1.7rem;
          font-weight: 900;
          color: #FFF;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .rivals-sub-title {
          font-size: 0.86rem;
          color: #94A3B8;
          margin: 4px 0 0;
          line-height: 1.45;
        }

        .rivals-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* KPI Grid */
        .rivals-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .kpi-card {
          padding: 18px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 6px;
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

        .kpi-icon-wrap.blue { background: rgba(11, 95, 255, 0.15); color: #60A5FA; }
        .kpi-icon-wrap.emerald { background: rgba(16, 185, 129, 0.15); color: #10B981; }
        .kpi-icon-wrap.amber { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
        .kpi-icon-wrap.rose { background: rgba(244, 63, 94, 0.15); color: #F43F5E; }

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

        /* Controls Bar */
        .rivals-controls-bar {
          padding: 16px 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .controls-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          flex: 1;
        }

        .section-pill-toggle {
          display: flex;
          background: rgba(0, 0, 0, 0.35);
          padding: 3px;
          border-radius: 10px;
          gap: 3px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .pill-btn {
          border: none;
          background: transparent;
          color: #94A3B8;
          font-size: 0.76rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .pill-btn.active {
          background: #0B5FFF;
          color: #FFF;
          box-shadow: 0 0 12px rgba(11, 95, 255, 0.4);
        }

        .search-input-wrapper {
          position: relative;
          min-width: 260px;
          flex: 1;
          max-width: 360px;
        }

        .search-ico {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748B;
        }

        .rivals-search-input {
          width: 100%;
          background: rgba(6, 10, 20, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 7px 32px 7px 34px;
          color: #FFF;
          font-size: 0.82rem;
          transition: all 0.2s ease;
        }

        .rivals-search-input:focus {
          outline: none;
          border-color: #0B5FFF;
          box-shadow: 0 0 12px rgba(11, 95, 255, 0.25);
        }

        .search-clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
        }

        .controls-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-select-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .filter-label {
          font-size: 0.74rem;
          color: #94A3B8;
          font-weight: 700;
        }

        .rivals-filter-select {
          background: rgba(6, 10, 20, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #FFF;
          font-size: 0.76rem;
          font-weight: 700;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
        }

        /* Grid de Rivais */
        .rivals-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 20px;
        }

        .rival-card {
          padding: 20px;
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }

        .rival-card:hover {
          transform: translateY(-3px);
          border-color: rgba(11, 95, 255, 0.35);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
        }

        .rival-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .rival-info-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .rival-tag-badge-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(11, 95, 255, 0.25) 0%, rgba(214, 31, 38, 0.25) 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .rival-tag-txt {
          font-size: 0.95rem;
          font-weight: 900;
          color: #FFF;
          letter-spacing: 0.05em;
        }

        .rival-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .rival-name {
          font-size: 1.1rem;
          font-weight: 800;
          color: #FFF;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .tier-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(245, 158, 11, 0.15);
          color: #F59E0B;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .detected-badge {
          font-size: 0.64rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 6px;
          background: rgba(147, 51, 234, 0.15);
          color: #C084FC;
          border: 1px solid rgba(147, 51, 234, 0.3);
        }

        .rival-meta-sub {
          font-size: 0.74rem;
          color: #94A3B8;
          margin-top: 2px;
        }

        .streak-badge {
          font-size: 0.72rem;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .streak-badge.win { background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.4); }
        .streak-badge.loss { background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.4); }
        .streak-badge.draw { background: rgba(245, 158, 11, 0.2); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.4); }

        /* H2H Section */
        .rival-h2h-section {
          background: rgba(6, 10, 20, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .h2h-score-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .h2h-stat-box {
          display: flex;
          flex-direction: column;
        }

        .h2h-stat-box.center { align-items: center; }
        .h2h-stat-box.right { align-items: flex-end; }

        .h2h-lbl {
          font-size: 0.68rem;
          color: #64748B;
          text-transform: uppercase;
          font-weight: 700;
        }

        .h2h-num {
          font-size: 0.95rem;
          font-weight: 800;
          color: #FFF;
        }

        .h2h-bar-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
        }

        .h2h-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.35s ease;
        }

        .h2h-bar-fill.win {
          background: linear-gradient(90deg, #10B981, #059669);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }

        .h2h-bar-fill.loss {
          background: linear-gradient(90deg, #EF4444, #B91C1C);
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }

        .h2h-points-diff-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
        }

        .diff-lbl { color: #94A3B8; }
        .diff-val.positive { color: #10B981; font-weight: 800; }
        .diff-val.negative { color: #EF4444; font-weight: 800; }

        /* Last Match */
        .rival-last-match-box {
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          font-size: 0.76rem;
        }

        .last-match-header {
          display: flex;
          justify-content: space-between;
          color: #64748B;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .last-match-result {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .last-match-score {
          font-weight: 800;
          color: #FFF;
        }

        .last-match-status-badge {
          font-size: 0.64rem;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .last-match-status-badge.win { background: rgba(16, 185, 129, 0.2); color: #10B981; }
        .last-match-status-badge.loss { background: rgba(239, 68, 68, 0.2); color: #EF4444; }

        .last-match-none {
          color: #64748B;
          font-style: italic;
        }

        /* Scouting Snippet */
        .rival-scouting-preview {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 0.74rem;
          color: #CBD5E1;
          background: rgba(245, 158, 11, 0.06);
          border-left: 2px solid #F59E0B;
          padding: 6px 10px;
          border-radius: 6px;
        }

        .scouting-text-snippet {
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Footer */
        .rival-card-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .card-action-btn {
          flex: 1;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .card-action-btn.primary {
          background: linear-gradient(135deg, rgba(11, 95, 255, 0.2) 0%, rgba(11, 95, 255, 0.35) 100%);
          border: 1px solid rgba(11, 95, 255, 0.45);
          color: #93C5FD;
        }

        .card-action-btn.primary:hover {
          background: #0B5FFF;
          color: #FFF;
          box-shadow: 0 0 16px rgba(11, 95, 255, 0.5);
        }

        .card-action-btn.register-btn {
          background: rgba(147, 51, 234, 0.2);
          border: 1px solid rgba(147, 51, 234, 0.4);
          color: #D8B4FE;
        }

        .card-action-btn.register-btn:hover {
          background: #9333EA;
          color: #FFF;
        }

        .card-manage-btns {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .card-mini-btn {
          padding: 7px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #94A3B8;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .card-mini-btn.edit:hover { color: #60A5FA; border-color: #60A5FA; background: rgba(11, 95, 255, 0.2); }
        .card-mini-btn.delete:hover { color: #F87171; border-color: #EF4444; background: rgba(239, 68, 68, 0.2); }

        /* Empty Card */
        .rivals-empty-card {
          padding: 60px 24px;
          border-radius: 20px;
          text-align: center;
          background: rgba(15, 23, 42, 0.7);
        }

        .empty-inner {
          max-width: 480px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .empty-ico-box {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(11, 95, 255, 0.1);
          border: 1px solid rgba(11, 95, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Dossier Modal */
        .rival-dossier-modal {
          max-width: 900px;
          width: 94%;
          max-height: 90vh;
          overflow-y: auto;
          background: #090E1A !important;
          border: 1px solid rgba(11, 95, 255, 0.35);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);
        }

        .dossier-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 18px;
        }

        .dossier-team-lead {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dossier-avatar-badge {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, #0B5FFF 0%, #D61F26 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 900;
          color: #FFF;
          box-shadow: 0 0 20px rgba(11, 95, 255, 0.4);
        }

        .dossier-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dossier-title-row h2 {
          font-size: 1.5rem;
          font-weight: 900;
          color: #FFF;
          margin: 0;
        }

        .tier-badge-large {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 6px;
          background: rgba(245, 158, 11, 0.2);
          color: #F59E0B;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .dossier-sub-info {
          font-size: 0.78rem;
          color: #94A3B8;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          flex-wrap: wrap;
        }

        .dossier-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dossier-close-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
        }

        .dossier-tabs-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 16px;
          padding-bottom: 12px;
          overflow-x: auto;
        }

        .dossier-tab-btn {
          border: none;
          background: rgba(255, 255, 255, 0.04);
          color: #94A3B8;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: 10px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .dossier-tab-btn.active {
          background: #0B5FFF;
          color: #FFF;
          box-shadow: 0 0 14px rgba(11, 95, 255, 0.4);
        }

        .dossier-tab-body {
          padding-top: 20px;
        }

        .tab-empty-box {
          text-align: center;
          padding: 40px 20px;
          color: #94A3B8;
        }

        /* Matches inside Dossier */
        .dossier-matches-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .dossier-match-card {
          padding: 16px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .dossier-match-card.win-border { border-left: 4px solid #10B981; }
        .dossier-match-card.loss-border { border-left: 4px solid #EF4444; }

        .match-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .match-meta-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .match-date-badge {
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 8px;
          border-radius: 6px;
          color: #FFF;
        }

        .match-format-tag {
          color: #60A5FA;
        }

        .match-score-big {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.15rem;
          font-weight: 900;
        }

        .score-val.win { color: #10B981; }
        .score-sep { color: #64748B; font-size: 0.85rem; }

        .vod-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.74rem;
          font-weight: 700;
          color: #60A5FA;
          text-decoration: none;
          background: rgba(11, 95, 255, 0.12);
          border: 1px solid rgba(11, 95, 255, 0.3);
          padding: 4px 10px;
          border-radius: 6px;
        }

        .match-games-sublist {
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }

        .games-sublist-header {
          font-size: 0.68rem;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .games-chips-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .game-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .game-chip.win { background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .game-chip.loss { background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3); }

        .match-notes-row {
          font-size: 0.76rem;
          color: #CBD5E1;
          background: rgba(0, 0, 0, 0.25);
          padding: 6px 10px;
          border-radius: 6px;
        }

        /* Scouting Editor */
        .scouting-editor-box {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .editor-header h4 {
          font-size: 1.05rem;
          font-weight: 800;
          color: #FFF;
          margin: 0;
        }

        .editor-sub {
          font-size: 0.78rem;
          color: #94A3B8;
          margin: 2px 0 0;
        }

        .scouting-textarea {
          width: 100%;
          background: rgba(6, 10, 20, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 14px;
          color: #FFF;
          font-family: inherit;
          font-size: 0.88rem;
          line-height: 1.5;
          resize: vertical;
        }

        .scouting-textarea:focus {
          outline: none;
          border-color: #0B5FFF;
          box-shadow: 0 0 16px rgba(11, 95, 255, 0.3);
        }

        .scouting-quick-tips {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.76rem;
          color: #94A3B8;
          background: rgba(11, 95, 255, 0.08);
          border: 1px solid rgba(11, 95, 255, 0.2);
          padding: 10px 14px;
          border-radius: 10px;
        }

        /* Pokemon Tendencies */
        .pokemon-tendencies-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .pokemon-tendencies-grid { grid-template-columns: 1fr; }
        }

        .tendency-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tendency-col-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #FFF;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }

        .pokemon-picks-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pokemon-pick-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
        }

        .pick-rank {
          font-size: 0.75rem;
          font-weight: 800;
          color: #64748B;
          width: 24px;
        }

        .pick-name {
          font-size: 0.88rem;
          font-weight: 800;
          color: #FFF;
          flex: 1;
        }

        .pick-count-badge {
          font-size: 0.74rem;
          font-weight: 800;
          color: #F87171;
          background: rgba(239, 68, 68, 0.15);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .pick-winrate-badge {
          font-size: 0.74rem;
          font-weight: 800;
          color: #34D399;
          background: rgba(16, 185, 129, 0.15);
          padding: 2px 8px;
          border-radius: 6px;
        }

        /* Roster in Dossier */
        .roster-players-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 14px;
        }

        .roster-player-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .player-chip-avatar {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #1E293B;
          color: #60A5FA;
          font-weight: 800;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .player-chip-info {
          display: flex;
          flex-direction: column;
        }

        .player-chip-name {
          font-size: 0.84rem;
          font-weight: 800;
          color: #FFF;
        }

        .player-chip-sub {
          font-size: 0.68rem;
          color: #64748B;
        }

        /* Form Modal */
        .rival-form-modal {
          max-width: 650px;
          width: 92%;
          background: #090E1A !important;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);
        }

        .rival-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .form-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 640px) {
          .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.74rem;
          font-weight: 700;
          color: #94A3B8;
        }

        .form-group input, .form-group select, .form-group textarea {
          background: rgba(6, 10, 20, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 8px 12px;
          color: #FFF;
          font-size: 0.84rem;
          font-family: inherit;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none;
          border-color: #0B5FFF;
        }

        .player-input-row {
          display: flex;
          gap: 8px;
        }

        .player-input-row input { flex: 1; }

        .form-players-tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
          min-height: 32px;
          padding: 6px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .player-form-tag {
          font-size: 0.74rem;
          font-weight: 700;
          color: #60A5FA;
          background: rgba(11, 95, 255, 0.15);
          border: 1px solid rgba(11, 95, 255, 0.3);
          padding: 2px 8px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .remove-player-tag-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .no-players-hint {
          font-size: 0.74rem;
          color: #64748B;
          font-style: italic;
          padding: 4px;
        }

        .form-actions-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Utilities */
        .text-blue { color: #0B5FFF; }
        .text-red { color: #D61F26; }
        .text-emerald { color: #10B981; }
        .text-rose { color: #EF4444; }
        .text-amber { color: #F59E0B; }
        .text-dim { color: #64748B; }
      `}</style>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  X, 
  Check, 
  Swords, 
  Gamepad2, 
  Trophy, 
  Tv, 
  Trash2, 
  CalendarDays, 
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Crown,
  Play,
  Edit3,
  UserCheck,
  ShieldAlert,
  Shield,
  BarChart2
} from 'lucide-react';
import type { ScrimEvent, Role, TeamMember, AppUser, ScrimAttendance, OpponentTeam } from '../../types';
import { OpponentsModal } from './OpponentsModal';
import { MatchStatsModal } from './MatchStatsModal';
import { dbFetchOpponentTeams, dbSaveOpponentTeam, dbDeleteOpponentTeam } from '../../services/supabase';

interface ScrimAgendaProps {
  currentRole: Role;
  currentUser?: AppUser | null;
  members: TeamMember[];
  scrims: ScrimEvent[];
  onAddScrim: (scrim: ScrimEvent) => void;
  onUpdateScrim: (scrim: ScrimEvent) => void;
  onDeleteScrim?: (id: string) => void;
  teamName: string;
}

export const ScrimAgenda: React.FC<ScrimAgendaProps> = ({
  currentRole,
  currentUser,
  members,
  scrims,
  onAddScrim,
  onUpdateScrim,
  onDeleteScrim,
  teamName
}) => {
  // Data base padrão dinâmica (Hoje em tempo real)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');

  // Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScrimEvent | null>(null);

  // Equipes Oponentes & Estatísticas Detalhadas da Partida
  const [opponentTeams, setOpponentTeams] = useState<OpponentTeam[]>([]);
  const [isOpponentsModalOpen, setIsOpponentsModalOpen] = useState(false);
  const [isMatchStatsModalOpen, setIsMatchStatsModalOpen] = useState(false);
  const [statsModalScrim, setStatsModalScrim] = useState<ScrimEvent | null>(null);
  const [statsModalCanEdit, setStatsModalCanEdit] = useState(true);

  // Carregar equipes oponentes do banco / localStorage
  useEffect(() => {
    let isMounted = true;
    dbFetchOpponentTeams().then(teams => {
      if (isMounted) {
        setOpponentTeams(teams);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Estados para prompt de presença (atraso / ausência)
  const [attendancePromptType, setAttendancePromptType] = useState<'Atraso' | 'Ausente' | null>(null);
  const [attendanceNoteInput, setAttendanceNoteInput] = useState('');

  // Form State Novo Evento
  const [formData, setFormData] = useState<Partial<ScrimEvent>>({
    opponentTeam: '',
    opponentTag: '',
    title: '',
    opponentContact: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:30',
    endTime: '21:00',
    format: 'MD3',
    status: 'Confirmado',
    category: 'Amistoso',
    notes: '',
    lineup: []
  });

  // Custom player input para o formulário de escalação
  const [customPlayerName, setCustomPlayerName] = useState('');

  const canManage = currentRole === 'Dono' || currentRole === 'Manager' || currentRole === 'Coach';

  // Navegação Mensal
  const handlePrev = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Cálculo dinâmico das células do mês (começando na Segunda-feira)
  const getMonthGridDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Segunda, ...
    const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

    const startDate = new Date(year, month, 1);
    startDate.setDate(startDate.getDate() + diff);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = (Math.abs(diff) + daysInMonth > 35) ? 42 : 35;

    const cells: Date[] = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      cells.push(d);
    }
    return cells;
  };

  const monthGridDays = getMonthGridDays(currentDate);

  // Formatação de Datas
  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSameDay = (d1: Date, dateStr: string) => {
    return formatDateISO(d1) === dateStr;
  };

  const isTodayDate = (d: Date) => {
    return formatDateISO(d) === formatDateISO(new Date());
  };

  // Cores e Ícones por Categoria
  const getCategoryDetails = (cat?: string) => {
    switch (cat) {
      case 'Amistoso':
        return {
          label: 'Amistoso (Scrim)',
          color: '#0B5FFF',
          bg: 'rgba(11, 95, 255, 0.16)',
          border: 'rgba(11, 95, 255, 0.4)',
          text: '#60A5FA',
          icon: <Swords size={13} />
        };
      case 'Treino':
        return {
          label: 'Treino Tático',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.16)',
          border: 'rgba(16, 185, 129, 0.4)',
          text: '#34D399',
          icon: <Gamepad2 size={13} />
        };
      case 'Review':
        return {
          label: 'VOD Review',
          color: '#8B5CF6',
          bg: 'rgba(139, 92, 246, 0.16)',
          border: 'rgba(139, 92, 246, 0.4)',
          text: '#A78BFA',
          icon: <Tv size={13} />
        };
      case 'Campeonato':
        return {
          label: 'Campeonato Oficial',
          color: '#D61F26',
          bg: 'rgba(214, 31, 38, 0.2)',
          border: 'rgba(214, 31, 38, 0.5)',
          text: '#F87171',
          icon: <Trophy size={13} />
        };
      default:
        return {
          label: 'Scrim',
          color: '#0B5FFF',
          bg: 'rgba(11, 95, 255, 0.16)',
          border: 'rgba(11, 95, 255, 0.4)',
          text: '#60A5FA',
          icon: <Swords size={13} />
        };
    }
  };

  // Jogadores disponíveis no elenco
  const starters = members.filter(m => m.role === 'Jogador' && m.status === 'Titular');

  // Helper para obter o Nick In-Game do jogador
  const getPlayerNick = (rawName?: string): string => {
    if (!rawName) return '';
    const clean = rawName.trim().toLowerCase();
    const found = members.find(m => 
      (m.name && m.name.trim().toLowerCase() === clean) || 
      (m.nickname && m.nickname.trim().toLowerCase() === clean) ||
      (m.inGameId && m.inGameId.trim().toLowerCase() === clean)
    );
    return found?.nickname || rawName;
  };

  // Abertura do Modal de Novo Evento para uma data específica
  const handleOpenSlot = (dateStr: string, hourStr: string) => {
    if (!canManage) return;
    const endH = parseInt(hourStr.split(':')[0], 10) + 1;
    const endTime = `${String(endH).padStart(2, '0')}:30`;

    // Escalação padrão: seleciona automaticamente os 5 titulares pelo Nick In-Game
    const defaultLineup = starters.length > 0 
      ? starters.map(s => s.nickname || s.name) 
      : members.slice(0, 5).map(m => m.nickname || m.name);

    setFormData({
      opponentTeam: '',
      opponentTag: '',
      opponentTeamId: undefined,
      opponentPlayers: undefined,
      title: '',
      opponentContact: '',
      date: dateStr,
      time: hourStr,
      endTime,
      format: 'MD3',
      status: 'Confirmado',
      category: 'Amistoso',
      notes: '',
      lineup: defaultLineup
    });
    setCustomPlayerName('');
    setIsAddModalOpen(true);
  };

  // Alternar jogador na escalação do formulário
  const handleTogglePlayerInLineup = (playerName: string) => {
    const currentLineup = formData.lineup || [];
    const cleanTarget = playerName.trim().toLowerCase();

    const isAlreadyIn = currentLineup.some(p => {
      const pClean = p.trim().toLowerCase();
      if (pClean === cleanTarget) return true;
      const m = members.find(mem => mem.name.toLowerCase() === pClean || mem.nickname.toLowerCase() === pClean);
      return m && (m.name.toLowerCase() === cleanTarget || m.nickname.toLowerCase() === cleanTarget);
    });

    if (isAlreadyIn) {
      setFormData({
        ...formData,
        lineup: currentLineup.filter(p => {
          const pClean = p.trim().toLowerCase();
          if (pClean === cleanTarget) return false;
          const m = members.find(mem => mem.name.toLowerCase() === pClean || mem.nickname.toLowerCase() === pClean);
          return !(m && (m.name.toLowerCase() === cleanTarget || m.nickname.toLowerCase() === cleanTarget));
        })
      });
    } else {
      setFormData({
        ...formData,
        lineup: [...currentLineup, playerName]
      });
    }
  };

  const handleSelectAllStarters = () => {
    const starterNames = starters.map(s => s.nickname || s.name);
    if (starterNames.length > 0) {
      setFormData({ ...formData, lineup: starterNames });
    }
  };

  const handleClearLineup = () => {
    setFormData({ ...formData, lineup: [] });
  };

  const handleAddCustomPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPlayerName.trim()) return;
    const currentLineup = formData.lineup || [];
    if (!currentLineup.includes(customPlayerName.trim())) {
      setFormData({ ...formData, lineup: [...currentLineup, customPlayerName.trim()] });
    }
    setCustomPlayerName('');
  };

  // Ações de Gerenciamento de Rivais / Oponentes
  const handleSaveOpponentTeam = async (team: OpponentTeam) => {
    const saved = await dbSaveOpponentTeam(team);
    setOpponentTeams(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteOpponentTeam = async (id: string) => {
    await dbDeleteOpponentTeam(id);
    setOpponentTeams(prev => prev.filter(t => t.id !== id));
  };

  // Abrir tela de estatísticas da partida estilo Print (MatchStatsModal)
  const handleOpenMatchStats = (scrim: ScrimEvent, canEditMode: boolean = false) => {
    setStatsModalScrim(scrim);
    setStatsModalCanEdit(canEditMode);
    setIsMatchStatsModalOpen(true);
  };

  const handleSaveMatchStats = (updatedScrim: ScrimEvent) => {
    onUpdateScrim(updatedScrim);
    if (selectedEvent && selectedEvent.id === updatedScrim.id) {
      setSelectedEvent(updatedScrim);
    }
  };

  // Salvar novo evento
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = formData.title || (formData.category === 'Amistoso' ? `Scrim vs ${formData.opponentTeam || 'Adversário'}` : formData.category === 'Treino' ? 'Treino Tático' : 'Compromisso Friba');
    
    // Lista inicial de presença com status 'Pendente' para os atletas escalados
    const initialAttendance: ScrimAttendance[] = (formData.lineup || []).map(playerName => {
      const matchedMember = members.find(m => m.name.toLowerCase() === playerName.toLowerCase() || m.nickname.toLowerCase() === playerName.toLowerCase());
      const nick = matchedMember?.nickname || matchedMember?.name || playerName;
      return {
        memberId: matchedMember?.id || `anon-${Date.now()}-${Math.random()}`,
        memberName: nick,
        memberNickname: nick,
        status: 'Confirmado', // Por padrão, ao escalar, o coach assume presença inicial
        updatedAt: 'Criado pela Staff'
      };
    });

    const newScrim: ScrimEvent = {
      id: `scrim-${Date.now()}`,
      opponentTeam: formData.opponentTeam || 'Interno Friba',
      opponentTag: formData.opponentTag || 'FRIBA',
      opponentTeamId: formData.opponentTeamId,
      opponentPlayers: formData.opponentPlayers,
      title: finalTitle,
      opponentContact: formData.opponentContact,
      date: formData.date || formatDateISO(new Date()),
      time: formData.time || '19:30',
      endTime: formData.endTime || '21:00',
      format: formData.format || 'MD3',
      status: formData.status || 'Confirmado',
      category: formData.category || 'Amistoso',
      lineup: formData.lineup && formData.lineup.length > 0 
        ? formData.lineup.map(p => getPlayerNick(p)) 
        : (starters.map(s => s.nickname || s.name).length > 0 ? starters.map(s => s.nickname || s.name) : ['Titulares Friba']),
      notes: formData.notes,
      attendance: initialAttendance
    };

    onAddScrim(newScrim);
    setIsAddModalOpen(false);
  };



  // Manipulação de RSVP / Presença de Atletas
  const handleSetUserAttendance = (status: 'Confirmado' | 'Atraso' | 'Ausente', note?: string) => {
    if (!selectedEvent || !currentUser) return;

    const currentAttendance = selectedEvent.attendance || [];
    const userIdentifier = currentUser.name.toLowerCase();
    const existingIdx = currentAttendance.findIndex(a => 
      (currentUser.id && a.memberId === currentUser.id) ||
      a.memberName.toLowerCase() === userIdentifier ||
      (currentUser.nickname && a.memberNickname?.toLowerCase() === currentUser.nickname.toLowerCase())
    );

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newRecord: ScrimAttendance = {
      memberId: currentUser.id,
      memberName: currentUser.name,
      memberNickname: currentUser.nickname,
      status,
      note: note || '',
      updatedAt: `Hoje às ${timeStr}`
    };

    let updatedList: ScrimAttendance[];
    if (existingIdx >= 0) {
      updatedList = [...currentAttendance];
      updatedList[existingIdx] = newRecord;
    } else {
      updatedList = [...currentAttendance, newRecord];
    }

    const updatedEvent: ScrimEvent = {
      ...selectedEvent,
      attendance: updatedList
    };

    onUpdateScrim(updatedEvent);
    setSelectedEvent(updatedEvent);
    setAttendancePromptType(null);
    setAttendanceNoteInput('');
  };

  // Staff alterar a presença de um membro específico
  const handleSetMemberAttendance = (targetName: string, status: 'Confirmado' | 'Atraso' | 'Ausente', note?: string) => {
    if (!selectedEvent) return;

    const matchedMember = members.find(m => m.name.toLowerCase() === targetName.toLowerCase() || m.nickname.toLowerCase() === targetName.toLowerCase());
    const currentAttendance = selectedEvent.attendance || [];
    const existingIdx = currentAttendance.findIndex(a => 
      a.memberName.toLowerCase() === targetName.toLowerCase() ||
      (matchedMember?.id && a.memberId === matchedMember.id)
    );

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newRecord: ScrimAttendance = {
      memberId: matchedMember?.id || `p-${Date.now()}`,
      memberName: matchedMember?.name || targetName,
      memberNickname: matchedMember?.nickname || targetName,
      status,
      note: note || '',
      updatedAt: `Por ${currentRole} às ${timeStr}`
    };

    let updatedList: ScrimAttendance[];
    if (existingIdx >= 0) {
      updatedList = [...currentAttendance];
      updatedList[existingIdx] = newRecord;
    } else {
      updatedList = [...currentAttendance, newRecord];
    }

    const updatedEvent: ScrimEvent = {
      ...selectedEvent,
      attendance: updatedList
    };

    onUpdateScrim(updatedEvent);
    setSelectedEvent(updatedEvent);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Deseja excluir este compromisso da agenda?')) {
      if (onDeleteScrim) {
        onDeleteScrim(id);
      } else {
        onUpdateScrim({ ...selectedEvent!, status: 'Concluído' });
      }
      setSelectedEvent(null);
    }
  };

  // Eventos filtrados por categoria
  const filteredScrims = scrims.filter(s => {
    if (categoryFilter === 'Todos') return true;
    return s.category === categoryFilter;
  });

  // Título da barra do calendário (Apenas Mês/Ano)
  const getHeaderDateLabel = () => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
  };

  // Verificar se o usuário logado está na lineup do evento selecionado
  const isCurrentUserInLineup = () => {
    if (!currentUser || !selectedEvent?.lineup) return false;
    const nameLow = currentUser.name.toLowerCase();
    const nickLow = currentUser.nickname.toLowerCase();
    return selectedEvent.lineup.some(p => p.toLowerCase() === nameLow || p.toLowerCase() === nickLow);
  };

  // Pegar status de presença do usuário logado
  const getCurrentUserAttendance = (): ScrimAttendance | undefined => {
    if (!currentUser || !selectedEvent?.attendance) return undefined;
    const nameLow = currentUser.name.toLowerCase();
    const nickLow = currentUser.nickname.toLowerCase();
    return selectedEvent.attendance.find(a => 
      (currentUser.id && a.memberId === currentUser.id) ||
      a.memberName.toLowerCase() === nameLow ||
      (a.memberNickname && a.memberNickname.toLowerCase() === nickLow)
    );
  };

  const myAttendance = getCurrentUserAttendance();

  return (
    <div className="teams-calendar-wrapper">
      {/* BARRA SUPERIOR ESTILO MICROSOFT TEAMS */}
      <div className="teams-top-bar">
        <div className="teams-nav-controls">
          <div className="calendar-icon-title">
            <div className="teams-cal-badge">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h2>Agenda & Calendário</h2>
              <span className="teams-sub-desc">Controle de Scrims, Treinos e Presença Oficial • {teamName}</span>
            </div>
          </div>

          <div className="date-stepper-group">
            <button className="today-btn" onClick={handleToday}>
              Hoje
            </button>
            <div className="stepper-arrows">
              <button className="stepper-btn" onClick={handlePrev} title="Mês Anterior">
                <ChevronLeft size={16} />
              </button>
              <button className="stepper-btn" onClick={handleNext} title="Próximo Mês">
                <ChevronRight size={16} />
              </button>
            </div>
            <span className="current-range-text">{getHeaderDateLabel()}</span>
          </div>
        </div>

        <div className="teams-view-and-actions">
          {/* Filtro de Categoria */}
          <div className="category-pills">
            {['Todos', 'Amistoso', 'Treino', 'Review', 'Campeonato'].map(cat => (
              <button
                key={cat}
                className={`cat-pill ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Badge Fixa de Visão Mensal */}
          <div className="teams-view-badge">
            <CalendarDays size={15} /> Visão Mensal
          </div>

          {canManage && (
            <button 
              className="btn-secondary" 
              onClick={() => setIsOpponentsModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px' }}
              title="Cadastrar e gerenciar equipes oponentes e seus jogadores"
            >
              <Shield size={15} color="#38bdf8" /> Equipes Rivais
            </button>
          )}

          {canManage && (
            <button className="btn-new-event" onClick={() => handleOpenSlot(formatDateISO(new Date()), '19:30')}>
              <Plus size={15} /> Novo Compromisso
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISÃO MENSAL ESTILO TEAMS (GRID 7 DIAS X SEMANAS DO MÊS) */}
      {/* ========================================================================= */}
      <div className="teams-month-container">
        <div className="month-days-header">
          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(d => (
            <div key={d} className="month-header-cell">{d}</div>
          ))}
        </div>

        <div className="month-grid">
          {monthGridDays.map((cellDate, idx) => {
            const dateStr = formatDateISO(cellDate);
            const isToday = isTodayDate(cellDate);
            const isCurrentMonth = cellDate.getMonth() === currentDate.getMonth();

            const dayEvents = filteredScrims.filter(s => isSameDay(cellDate, s.date));

            return (
              <div 
                key={idx} 
                className={`month-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today-month-cell' : ''}`}
                onClick={() => handleOpenSlot(dateStr, '19:00')}
              >
                <div className="month-cell-header">
                  <span className={`month-day-num ${isToday ? 'today-num' : ''}`}>
                    {cellDate.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="month-count">{dayEvents.length}</span>
                  )}
                </div>

                <div className="month-events-list">
                  {dayEvents.map(event => {
                    const catInfo = getCategoryDetails(event.category);
                    const isDone = event.status === 'Concluído';

                    // Resumo de presenças
                    const confirmedCount = event.attendance 
                      ? event.attendance.filter(a => a.status === 'Confirmado').length 
                      : (event.lineup?.length || 5);
                    const totalLineup = event.lineup?.length || 5;

                    return (
                      <div
                        key={event.id}
                        className="month-event-card"
                        style={{
                          borderLeftColor: catInfo.color,
                          background: `linear-gradient(135deg, ${catInfo.bg} 0%, rgba(13, 21, 38, 0.95) 100%)`,
                          borderColor: catInfo.border
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                      >
                        {/* Top Row: Ícone + Formato + Horário/Placar */}
                        <div className="m-card-top">
                          <div className="m-cat-icon" style={{ color: catInfo.color }}>
                            {catInfo.icon}
                          </div>
                          <span className="m-format-tag">{event.format}</span>
                          
                          {isDone && event.score ? (
                            <span className="m-score-badge">
                              {event.score.us} x {event.score.them}
                            </span>
                          ) : (
                            <span className="m-time-pill">
                              <Clock size={10} /> {event.time}
                            </span>
                          )}
                        </div>

                        {/* Middle: Nome do Confronto / Equipe */}
                        <div className="m-card-title-row">
                          <span className="m-team-name">
                            {event.opponentTeam || event.title}
                          </span>
                        </div>

                        {/* Bottom Row: Tag do adversário ou categoria + Pílula de Presença */}
                        <div className="m-card-bottom">
                          <span className="m-tag-pill" style={{ color: catInfo.text }}>
                            {event.opponentTag ? `@${event.opponentTag}` : catInfo.label}
                          </span>

                          {!isDone && (
                            <span 
                              className={`m-attendance-pill ${confirmedCount === totalLineup ? 'all-in' : 'pending'}`}
                              title={`${confirmedCount} de ${totalLineup} confirmaram presença`}
                            >
                              <UserCheck size={10} /> {confirmedCount}/{totalLineup}
                            </span>
                          )}

                          {isDone && event.mvpMemberName && (
                            <span className="m-mvp-pill" title={`MVP: ${getPlayerNick(event.mvpMemberName)}`}>
                              <Crown size={10} color="#FBBF24" /> MVP: {getPlayerNick(event.mvpMemberName)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: DETALHES DO EVENTO SELECIONADO & RSVP & RELATÓRIO PÓS-TREINO */}
      {/* ========================================================================= */}
      {selectedEvent && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content modal-teams-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-tag">
                <div 
                  className="cat-indicator" 
                  style={{ background: getCategoryDetails(selectedEvent.category).color }} 
                />
                <div>
                  <h3>{selectedEvent.title || selectedEvent.opponentTeam}</h3>
                  <span className="modal-sub-tag">
                    {getCategoryDetails(selectedEvent.category).label} • {selectedEvent.format} • {selectedEvent.date} às {selectedEvent.time}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="detail-body">
              {/* 1. SEÇÃO DE RESULTADO PÓS-TREINO (Se o evento estiver concluído) */}
              {selectedEvent.status === 'Concluído' && selectedEvent.score && (
                <div className="postmatch-card">
                  <div className="pm-header-row">
                    <div className="pm-status-col">
                      {selectedEvent.score.us > selectedEvent.score.them ? (
                        <div className="pm-badge win">
                          <Trophy size={14} /> VITÓRIA DA FRIBA
                        </div>
                      ) : selectedEvent.score.us < selectedEvent.score.them ? (
                        <div className="pm-badge defeat">
                          <ShieldAlert size={14} /> DERROTA
                        </div>
                      ) : (
                        <div className="pm-badge tie">EMPATE</div>
                      )}
                      <span className="pm-format-desc">Série {selectedEvent.format} Concluída</span>
                    </div>

                    <div className="pm-score-huge">
                      <span className="pm-us">FRIBA {selectedEvent.score.us}</span>
                      <span className="pm-x">x</span>
                      <span className="pm-them">{selectedEvent.score.them} {selectedEvent.opponentTag}</span>
                    </div>
                  </div>

                  {/* MVP Destaque */}
                  {selectedEvent.mvpMemberName && (
                    <div className="pm-mvp-box">
                      <div className="pm-crown-badge">
                        <Crown size={16} />
                      </div>
                      <div className="pm-mvp-text">
                        <span className="pm-mvp-lbl">MVP DA SÉRIE:</span>
                        <strong className="pm-mvp-name">{getPlayerNick(selectedEvent.mvpMemberName)}</strong>
                      </div>
                    </div>
                  )}

                  {/* Tabela de Jogos / Breakdown Partida a Partida */}
                  {selectedEvent.games && selectedEvent.games.length > 0 && (
                    <div className="pm-games-breakdown">
                      <span className="pm-breakdown-title">Placar de Aeos Points por Partida:</span>
                      <div className="pm-games-grid">
                        {selectedEvent.games.map((g, idx) => (
                          <div key={idx} className={`pm-game-row ${g.scoreUs > g.scoreThem ? 'game-win' : 'game-loss'}`}>
                            <span className="g-num">Partida {g.gameNumber}</span>
                            <div className="g-scores">
                              <span className="g-score-us">{g.scoreUs} pts</span>
                              <span className="g-vs">x</span>
                              <span className="g-score-them">{g.scoreThem} pts</span>
                            </div>
                            <span className={`g-res ${g.scoreUs > g.scoreThem ? 'win' : 'loss'}`}>
                              {g.scoreUs > g.scoreThem ? 'Vitória' : 'Derrota'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VOD Link */}
                  {selectedEvent.vodUrl && (
                    <div className="pm-vod-action-row">
                      <a href={selectedEvent.vodUrl} target="_blank" rel="noreferrer" className="btn-vod-action">
                        <Play size={14} /> Assistir VOD / Gravação da Scrim
                      </a>
                    </div>
                  )}

                  <div className="pm-edit-btn-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                    <button 
                      type="button"
                      className="btn-primary"
                      onClick={() => handleOpenMatchStats(selectedEvent, canManage)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(124, 58, 237, 0.35))',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#fff',
                        fontWeight: 600,
                        padding: '8px 16px',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <BarChart2 size={15} color="#38bdf8" /> Relatório Completo & Estatísticas
                    </button>

                    {canManage && (
                      <button className="btn-text-secondary" onClick={() => handleOpenMatchStats(selectedEvent, true)}>
                        <Edit3 size={13} /> Editar Relatório & Placar
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 2. BANNER DE CONFIRMAÇÃO DE PRESENÇA DO ATLETA LOGADO */}
              {selectedEvent.status !== 'Concluído' && currentUser && (
                <div className="my-attendance-card">
                  <div className="attendance-prompt-header">
                    <div className="at-title-group">
                      <UserCheck size={18} className="text-blue" />
                      <div>
                        <h4>Sua Presença neste Treino</h4>
                        <span className="at-sub">
                          {isCurrentUserInLineup() ? 'Você está escalado na lineup oficial.' : 'Confirme sua disponibilidade como titular ou reserva.'}
                        </span>
                      </div>
                    </div>

                    <div className="my-status-pill-display">
                      {myAttendance?.status === 'Confirmado' && (
                        <span className="status-badge-inline confirmado">
                          <CheckCircle2 size={12} /> Presença Confirmada
                        </span>
                      )}
                      {myAttendance?.status === 'Atraso' && (
                        <span className="status-badge-inline agendado">
                          <AlertTriangle size={12} /> Atraso Informado {myAttendance.note ? `(${myAttendance.note})` : ''}
                        </span>
                      )}
                      {myAttendance?.status === 'Ausente' && (
                        <span className="status-badge-inline ausente">
                          <XCircle size={12} /> Ausência Registrada {myAttendance.note ? `(${myAttendance.note})` : ''}
                        </span>
                      )}
                      {!myAttendance && (
                        <span className="status-badge-inline pendente">
                          <HelpCircle size={12} /> Aguardando sua resposta
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botões de Ação de Presença */}
                  <div className="attendance-buttons-row">
                    <button 
                      className={`btn-rsvp confirm ${myAttendance?.status === 'Confirmado' ? 'active' : ''}`}
                      onClick={() => handleSetUserAttendance('Confirmado')}
                    >
                      <CheckCircle2 size={14} /> Confirmar Presença
                    </button>

                    <button 
                      className={`btn-rsvp late ${myAttendance?.status === 'Atraso' ? 'active' : ''}`}
                      onClick={() => {
                        setAttendancePromptType('Atraso');
                        setAttendanceNoteInput(myAttendance?.note || 'Chego em 15 minutos');
                      }}
                    >
                      <AlertTriangle size={14} /> Vou me Atrasar
                    </button>

                    <button 
                      className={`btn-rsvp absent ${myAttendance?.status === 'Ausente' ? 'active' : ''}`}
                      onClick={() => {
                        setAttendancePromptType('Ausente');
                        setAttendanceNoteInput(myAttendance?.note || 'Compromisso urgente');
                      }}
                    >
                      <XCircle size={14} /> Não Poderei Ir
                    </button>
                  </div>

                  {/* Prompt rápido de justificativa (Atraso ou Ausência) */}
                  {attendancePromptType && (
                    <div className="attendance-note-prompt">
                      <label>
                        {attendancePromptType === 'Atraso' ? 'Qual sua previsão de chegada?' : 'Motivo da ausência:'}
                      </label>
                      <div className="prompt-input-row">
                        <input
                          type="text"
                          placeholder={attendancePromptType === 'Atraso' ? 'Ex: Chego 19:45 após o trabalho' : 'Ex: Prova na faculdade'}
                          value={attendanceNoteInput}
                          onChange={(e) => setAttendanceNoteInput(e.target.value)}
                        />
                        <button 
                          className="btn-primary-small"
                          onClick={() => handleSetUserAttendance(attendancePromptType, attendanceNoteInput)}
                        >
                          Salvar
                        </button>
                        <button 
                          className="btn-secondary-small"
                          onClick={() => setAttendancePromptType(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. METADADOS GERAIS DO EVENTO */}
              <div className="detail-meta-grid">
                <div className="meta-item">
                  <span className="label">Categoria</span>
                  <span className="val">{getCategoryDetails(selectedEvent.category).label}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Data & Horário</span>
                  <span className="val">{selectedEvent.date} • {selectedEvent.time} – {selectedEvent.endTime || '21:00'}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Formato de Série</span>
                  <span className="val">{selectedEvent.format}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Status</span>
                  <span className={`status-badge-inline ${selectedEvent.status.toLowerCase()}`}>
                    {selectedEvent.status}
                  </span>
                </div>
              </div>

              {selectedEvent.opponentContact && (
                <div className="detail-field">
                  <span className="label">Contato Adversário:</span>
                  <span className="val-inline">{selectedEvent.opponentContact}</span>
                </div>
              )}

              {/* 4. LISTA DE ESCALAÇÃO & CONFIRMAÇÃO DE PRESENÇA (ATLETAS) */}
              <div className="detail-field attendance-roster-box">
                <div className="lineup-header-row">
                  <span className="label"><Users size={14} /> Escalação Oficial & Status de Presença:</span>
                  <span className="count-pill">{selectedEvent.lineup?.length || 0} Atletas Escalados</span>
                </div>

                <div className="attendance-players-list">
                  {(selectedEvent.lineup || []).map((playerName, idx) => {
                    const matchedMember = members.find(m => 
                      m.name.toLowerCase() === playerName.toLowerCase() || 
                      m.nickname.toLowerCase() === playerName.toLowerCase()
                    );
                    const attRecord = selectedEvent.attendance?.find(a => 
                      a.memberName.toLowerCase() === playerName.toLowerCase() ||
                      a.memberNickname?.toLowerCase() === playerName.toLowerCase() ||
                      (matchedMember?.id && a.memberId === matchedMember.id)
                    );
                    const status = attRecord?.status || 'Confirmado';
                    const displayNick = matchedMember?.nickname || matchedMember?.name || playerName;

                    return (
                      <div key={idx} className={`att-player-card ${status.toLowerCase()}`}>
                        <div className="att-player-left">
                          <img 
                            src={matchedMember?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80'} 
                            alt={displayNick}
                            className="att-player-avatar" 
                          />
                          <div>
                            <div className="att-name-row">
                              <strong className="att-player-name">{displayNick}</strong>
                              {matchedMember?.name && matchedMember?.nickname && matchedMember.name !== matchedMember.nickname && (
                                <span className="att-player-nick">({matchedMember.name})</span>
                              )}
                              {matchedMember?.preferredLane && (
                                <span className="att-player-lane">{matchedMember.preferredLane}</span>
                              )}
                            </div>
                            {attRecord?.note && (
                              <span className="att-note-bubble">Obs: {attRecord.note}</span>
                            )}
                          </div>
                        </div>

                        <div className="att-player-right">
                          <span className={`att-status-pill ${status.toLowerCase()}`}>
                            {status === 'Confirmado' && <CheckCircle2 size={12} />}
                            {status === 'Atraso' && <AlertTriangle size={12} />}
                            {status === 'Ausente' && <XCircle size={12} />}
                            {status}
                          </span>

                          {/* Se for Coach/Dono, permite alternar status rapidamente */}
                          {canManage && selectedEvent.status !== 'Concluído' && (
                            <div className="staff-quick-rsvp-actions">
                              <button 
                                title="Marcar Presença" 
                                className="quick-btn-icon check"
                                onClick={() => handleSetMemberAttendance(playerName, 'Confirmado')}
                              >
                                <Check size={11} />
                              </button>
                              <button 
                                title="Marcar Atraso" 
                                className="quick-btn-icon warn"
                                onClick={() => {
                                  const reason = prompt(`Informar previsão de atraso para ${playerName}:`, '15 min de atraso');
                                  if (reason) handleSetMemberAttendance(playerName, 'Atraso', reason);
                                }}
                              >
                                <Clock size={11} />
                              </button>
                              <button 
                                title="Marcar Ausência" 
                                className="quick-btn-icon cross"
                                onClick={() => {
                                  const reason = prompt(`Motivo da ausência de ${playerName}:`, 'Imprevisto');
                                  if (reason) handleSetMemberAttendance(playerName, 'Ausente', reason);
                                }}
                              >
                                <X size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. INSTRUÇÕES & NOTAS TÁTICAS */}
              {selectedEvent.notes && (
                <div className="detail-notes-box">
                  <span className="label">Instruções / Notas Táticas do Coach:</span>
                  <p>{selectedEvent.notes}</p>
                </div>
              )}
            </div>

            <div className="modal-footer detail-footer">
              {canManage && (
                <button 
                  className="btn-danger-outline" 
                  onClick={() => handleDelete(selectedEvent.id)}
                >
                  <Trash2 size={14} /> Excluir Compromisso
                </button>
              )}

              <div className="footer-right-actions">
                <button 
                  type="button"
                  className="btn-secondary" 
                  onClick={() => handleOpenMatchStats(selectedEvent, canManage)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#38bdf8' }}
                >
                  <BarChart2 size={14} /> Relatório & Estatísticas
                </button>
                {canManage && selectedEvent.status !== 'Concluído' && (
                  <button 
                    className="btn-primary" 
                    onClick={() => handleOpenMatchStats(selectedEvent, true)}
                  >
                    <Check size={14} /> Registrar Resultado & Relatório
                  </button>
                )}
                <button className="btn-secondary" onClick={() => setSelectedEvent(null)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO COMPROMISSO COM ESCALAÇÃO DINÂMICA DO ELENCO */}
      {/* ========================================================================= */}
      {isAddModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content modal-teams-form modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Novo Compromisso na Agenda</h3>
                <span className="modal-sub-tag">Agende scrims, treinos táticos e defina a escalação oficial</span>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="close-btn"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveAdd} className="teams-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Tipo de Compromisso</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  >
                    <option value="Amistoso">Amistoso (Scrim)</option>
                    <option value="Treino">Treino Tático</option>
                    <option value="Review">VOD Review</option>
                    <option value="Campeonato">Campeonato Oficial</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Título ou Descrição Curta</label>
                  <input
                    type="text"
                    placeholder="Ex: Scrim vs LOUD, Treino de Rotações..."
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>

              {formData.category === 'Amistoso' && (
                <div className="opponent-selection-box" style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 16
                }}>
                  {/* Seletor de Equipe Cadastrada */}
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ margin: 0, fontWeight: 600, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Shield size={14} color="#38bdf8" /> Selecionar Equipe Adversária Cadastrada
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsOpponentsModalOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#38bdf8',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        + Cadastrar Novo Rival
                      </button>
                    </div>

                    <select
                      value={formData.opponentTeamId || ''}
                      onChange={(e) => {
                        const selId = e.target.value;
                        if (!selId) {
                          setFormData(prev => ({
                            ...prev,
                            opponentTeamId: undefined,
                            opponentPlayers: undefined
                          }));
                          return;
                        }
                        const opp = opponentTeams.find(t => t.id === selId);
                        if (opp) {
                          setFormData(prev => ({
                            ...prev,
                            opponentTeamId: opp.id,
                            opponentTeam: opp.name,
                            opponentTag: opp.tag,
                            opponentContact: opp.contact || prev.opponentContact || '',
                            opponentPlayers: [...opp.players]
                          }));
                        }
                      }}
                    >
                      <option value="">-- Escolha uma equipe cadastrada (preenchimento automático) --</option>
                      {opponentTeams.map(opp => (
                        <option key={opp.id} value={opp.id}>
                          [{opp.tag}] {opp.name} ({opp.players.length} atletas)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Nome da Equipe</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Nightmare, LOUD, Keyd Stars"
                        value={formData.opponentTeam || ''}
                        onChange={(e) => setFormData({ ...formData, opponentTeam: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>TAG da Equipe</label>
                      <input
                        type="text"
                        placeholder="Ex: NM, LOUD, VKS"
                        value={formData.opponentTag || ''}
                        onChange={(e) => setFormData({ ...formData, opponentTag: e.target.value })}
                      />
                    </div>
                  </div>

                  {formData.opponentPlayers && formData.opponentPlayers.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <span style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                        Lineup cadastrada do adversário ({formData.opponentPlayers.length} atletas):
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {formData.opponentPlayers.map((p, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: 'rgba(56, 189, 248, 0.1)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              color: '#bae6fd'
                            }}
                          >
                            {formData.opponentTag ? `${formData.opponentTag} · ` : ''}{p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="form-row-3">
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    required
                    value={formData.date || formatDateISO(new Date())}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Horário Início</label>
                  <input
                    type="time"
                    required
                    value={formData.time || '19:30'}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Horário Fim</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime || '21:00'}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Formato de Série</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                  >
                    <option value="MD1">MD1 (Jogo Único)</option>
                    <option value="MD3">MD3 (Melhor de 3)</option>
                    <option value="MD5">MD5 (Melhor de 5)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Contato do Organizador / Manager Rival</label>
                  <input
                    type="text"
                    placeholder="Discord: @manager_tag ou WhatsApp"
                    value={formData.opponentContact || ''}
                    onChange={(e) => setFormData({ ...formData, opponentContact: e.target.value })}
                  />
                </div>
              </div>

              {/* SELETOR DINÂMICO DE ESCALAÇÃO DO ELENCO */}
              <div className="lineup-selection-section">
                <div className="lineup-selection-header">
                  <div>
                    <label className="section-label">
                      <Users size={15} /> Escalação Oficial da Friba
                    </label>
                    <span className="lineup-hint">Clique nos atletas para adicionar ou remover da lineup</span>
                  </div>

                  <div className="lineup-quick-actions">
                    <span className={`lineup-counter-badge ${(formData.lineup?.length || 0) === 5 ? 'good' : 'warning'}`}>
                      {formData.lineup?.length || 0}/5 Selecionados
                    </span>
                    {starters.length > 0 && (
                      <button 
                        type="button" 
                        className="btn-chip-action" 
                        onClick={handleSelectAllStarters}
                      >
                        Escalar Titulares
                      </button>
                    )}
                    <button 
                      type="button" 
                      className="btn-chip-action text-muted" 
                      onClick={handleClearLineup}
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {/* Grade de Atletas Cadastrados */}
                <div className="members-picker-grid">
                  {members.map(member => {
                    const memberNick = member.nickname || member.name;
                    const isSelected = (formData.lineup || []).some(p => {
                      const pClean = p.trim().toLowerCase();
                      return pClean === memberNick.toLowerCase() || pClean === member.name.toLowerCase();
                    });
                    return (
                      <div
                        key={member.id}
                        className={`member-pick-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleTogglePlayerInLineup(memberNick)}
                      >
                        <img src={member.avatar} alt={memberNick} className="pick-avatar" />
                        <div className="pick-info">
                          <strong className="pick-name">{memberNick}</strong>
                          {member.name && member.nickname && member.name !== member.nickname && (
                            <span className="pick-nick">{member.name}</span>
                          )}
                          <div className="pick-tags">
                            <span className={`pick-role-pill ${member.status === 'Titular' ? 'titular' : 'reserva'}`}>
                              {member.status || member.role}
                            </span>
                            {member.preferredLane && (
                              <span className="pick-lane-pill">{member.preferredLane}</span>
                            )}
                          </div>
                        </div>
                        <div className="pick-check-circle">
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Campo extra para adicionar atleta avulso */}
                <div className="custom-player-add-row">
                  <input
                    type="text"
                    placeholder="Adicionar jogador avulso ou complete (Ex: Sub/Trial)"
                    value={customPlayerName}
                    onChange={(e) => setCustomPlayerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomPlayer(e);
                      }
                    }}
                  />
                  <button type="button" className="btn-add-custom-p" onClick={handleAddCustomPlayer}>
                    <Plus size={14} /> Incluir
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Notas Táticas / Objetivos do Treino</label>
                <textarea
                  rows={2}
                  placeholder="Objetivos do treino, composições a testar, rotações prioritárias..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={14} /> Salvar no Calendário
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: GERENCIAMENTO DE EQUIPES OPONENTES */}
      <OpponentsModal
        isOpen={isOpponentsModalOpen}
        onClose={() => setIsOpponentsModalOpen(false)}
        opponentTeams={opponentTeams}
        onSaveTeam={handleSaveOpponentTeam}
        onDeleteTeam={handleDeleteOpponentTeam}
      />

      {/* MODAL UNIFICADO: RELATÓRIO, ESTATÍSTICAS POR JOGADOR & RESULTADO AUTOMÁTICO */}
      {isMatchStatsModalOpen && statsModalScrim && (
        <MatchStatsModal
          isOpen={isMatchStatsModalOpen}
          onClose={() => {
            setIsMatchStatsModalOpen(false);
            setStatsModalScrim(null);
          }}
          scrim={statsModalScrim}
          teamName={teamName}
          canEdit={statsModalCanEdit}
          onSaveStats={handleSaveMatchStats}
          members={members}
        />
      )}

      {/* ESTILOS VISUAIS PREMIUM MICROSOFT TEAMS + ESPORTS */}
      <style>{`
        .teams-calendar-wrapper {
          max-width: 1240px;
          margin: 0 auto;
          padding: 20px 20px 48px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* BARRA SUPERIOR TEAMS */
        .teams-top-bar {
          background: rgba(12, 18, 34, 0.65);
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 1.5px rgba(255, 255, 255, 0.18);
        }

        .teams-nav-controls {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .calendar-icon-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .teams-cal-badge {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1d68ff 0%, #0b5fff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(11, 95, 255, 0.4);
        }

        .calendar-icon-title h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #F8FAFC;
          margin: 0;
        }

        .teams-sub-desc {
          font-size: 0.72rem;
          color: #94A3B8;
        }

        .date-stepper-group {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .today-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #E2E8F0;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .today-btn:hover {
          background: rgba(255, 255, 255, 0.18);
        }

        .stepper-arrows {
          display: flex;
          gap: 2px;
        }

        .stepper-btn {
          background: transparent;
          border: none;
          color: #CBD5E1;
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stepper-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .current-range-text {
          font-size: 0.8rem;
          font-weight: 600;
          color: #F1F5F9;
          padding-right: 4px;
        }

        .teams-view-and-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .category-pills {
          display: flex;
          gap: 4px;
          background: rgba(0, 0, 0, 0.35);
          padding: 3px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .cat-pill {
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cat-pill.active {
          background: #0B5FFF;
          color: white;
        }

        .teams-view-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #94A3B8;
          background: rgba(255, 255, 255, 0.04);
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .btn-new-event {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #0B5FFF 0%, #0047D4 100%);
          border: none;
          color: white;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(11, 95, 255, 0.35);
          transition: all 0.2s;
        }

        .btn-new-event:hover {
          filter: brightness(1.1);
        }

        /* VISÃO MENSAL GRID */
        .teams-month-container {
          background: rgba(12, 18, 34, 0.65);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
        }

        .month-days-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .month-header-cell {
          padding: 10px 12px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94A3B8;
          text-align: center;
        }

        .month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-collapse: collapse;
        }

        .month-cell {
          min-height: 120px;
          padding: 8px;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .month-cell:nth-child(7n) {
          border-right: none;
        }

        .month-cell:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .month-cell.other-month {
          opacity: 0.45;
          background: rgba(0, 0, 0, 0.15);
        }

        .month-cell.today-month-cell {
          background: rgba(11, 95, 255, 0.05);
        }

        .month-cell-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .month-day-num {
          font-size: 0.8rem;
          font-weight: 600;
          color: #94A3B8;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .month-day-num.today-num {
          background: #0B5FFF;
          color: white;
          font-weight: 700;
          box-shadow: 0 0 10px rgba(11, 95, 255, 0.6);
        }

        .month-count {
          font-size: 0.65rem;
          color: #64748B;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 10px;
        }

        .month-events-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
        }

        .month-event-card {
          border-left: 3px solid;
          border: 1px solid;
          border-left-width: 3px;
          border-radius: 6px;
          padding: 5px 7px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          transition: transform 0.15s;
        }

        .month-event-card:hover {
          transform: translateY(-1px);
        }

        .m-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        }

        .m-cat-icon {
          display: flex;
          align-items: center;
        }

        .m-format-tag {
          font-size: 0.65rem;
          font-weight: 700;
          color: #CBD5E1;
        }

        .m-time-pill {
          font-size: 0.65rem;
          color: #94A3B8;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .m-score-badge {
          font-size: 0.65rem;
          font-weight: 800;
          background: rgba(16, 185, 129, 0.2);
          color: #34D399;
          padding: 1px 4px;
          border-radius: 4px;
        }

        .m-card-title-row {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .m-team-name {
          font-size: 0.72rem;
          font-weight: 700;
          color: #F8FAFC;
        }

        .m-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        }

        .m-tag-pill {
          font-size: 0.62rem;
          font-weight: 600;
        }

        .m-attendance-pill {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.6rem;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
        }

        .m-attendance-pill.all-in {
          background: rgba(16, 185, 129, 0.2);
          color: #34D399;
        }

        .m-attendance-pill.pending {
          background: rgba(245, 158, 11, 0.2);
          color: #FBBF24;
        }

        .m-mvp-pill {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.6rem;
          font-weight: 800;
          color: #FBBF24;
          background: rgba(251, 191, 36, 0.15);
          padding: 1px 5px;
          border-radius: 4px;
        }

        /* MODAIS */
        .modal-overlay {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(3, 7, 18, 0.86);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 16px;
          box-sizing: border-box;
        }

        .modal-content {
          background: rgba(14, 21, 38, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 16px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 32px);
          max-height: calc(100dvh - 32px);
          margin: auto;
          position: relative;
        }

        .modal-large {
          max-width: 680px;
          width: 100%;
        }

        .modal-teams-detail {
          max-width: 640px;
          width: 100%;
        }

        .modal-header {
          padding: 18px 22px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
          flex-shrink: 0;
        }

        .modal-header-tag {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cat-indicator {
          width: 14px;
          height: 14px;
          border-radius: 4px;
        }

        .modal-header h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #F8FAFC;
          margin: 0;
        }

        .modal-sub-tag {
          font-size: 0.72rem;
          color: #94A3B8;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
        }

        .close-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .detail-body {
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }

        /* POST-MATCH CARD */
        .postmatch-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(11, 95, 255, 0.08) 100%);
          border: 1px solid rgba(16, 185, 129, 0.35);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pm-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .pm-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.05em;
        }

        .pm-badge.win {
          background: rgba(16, 185, 129, 0.25);
          color: #34D399;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .pm-badge.defeat {
          background: rgba(239, 68, 68, 0.25);
          color: #F87171;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .pm-format-desc {
          font-size: 0.72rem;
          color: #94A3B8;
          margin-left: 8px;
        }

        .pm-score-huge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.3rem;
          font-weight: 800;
        }

        .pm-us {
          color: #34D399;
        }

        .pm-x {
          color: #64748B;
          font-size: 1rem;
        }

        .pm-them {
          color: #CBD5E1;
        }

        .pm-mvp-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(251, 191, 36, 0.12);
          border: 1px solid rgba(251, 191, 36, 0.3);
          padding: 8px 12px;
          border-radius: 8px;
        }

        .pm-crown-badge {
          color: #FBBF24;
          display: flex;
          align-items: center;
        }

        .pm-mvp-text {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
        }

        .pm-mvp-lbl {
          color: #FDE68A;
          font-weight: 600;
        }

        .pm-mvp-name {
          color: white;
          font-size: 0.88rem;
        }

        .pm-games-breakdown {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pm-breakdown-title {
          font-size: 0.72rem;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
        }

        .pm-games-grid {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pm-game-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.25);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
        }

        .g-num {
          font-weight: 600;
          color: #CBD5E1;
        }

        .g-scores {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
        }

        .g-score-us {
          color: #34D399;
        }

        .g-vs {
          color: #64748B;
        }

        .g-score-them {
          color: #E2E8F0;
        }

        .g-res.win {
          color: #34D399;
          font-weight: 700;
        }

        .g-res.loss {
          color: #F87171;
          font-weight: 700;
        }

        .pm-vod-action-row {
          margin-top: 4px;
        }

        .btn-vod-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
          color: white;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: 8px;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35);
        }

        .pm-edit-btn-row {
          display: flex;
          justify-content: flex-end;
        }

        .btn-text-secondary {
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }

        .btn-text-secondary:hover {
          color: white;
        }

        /* CARD DE PRESENÇA DO USUÁRIO LOGADO */
        .my-attendance-card {
          background: rgba(11, 95, 255, 0.08);
          border: 1px solid rgba(11, 95, 255, 0.25);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .attendance-prompt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .at-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .at-title-group h4 {
          font-size: 0.88rem;
          font-weight: 700;
          color: #F8FAFC;
          margin: 0;
        }

        .at-sub {
          font-size: 0.7rem;
          color: #94A3B8;
        }

        .attendance-buttons-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-rsvp {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-rsvp.confirm {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
          border-color: rgba(16, 185, 129, 0.3);
        }

        .btn-rsvp.confirm:hover, .btn-rsvp.confirm.active {
          background: #10B981;
          color: white;
        }

        .btn-rsvp.late {
          background: rgba(245, 158, 11, 0.15);
          color: #FBBF24;
          border-color: rgba(245, 158, 11, 0.3);
        }

        .btn-rsvp.late:hover, .btn-rsvp.late.active {
          background: #F59E0B;
          color: white;
        }

        .btn-rsvp.absent {
          background: rgba(239, 68, 68, 0.15);
          color: #F87171;
          border-color: rgba(239, 68, 68, 0.3);
        }

        .btn-rsvp.absent:hover, .btn-rsvp.absent.active {
          background: #EF4444;
          color: white;
        }

        .attendance-note-prompt {
          background: rgba(0, 0, 0, 0.3);
          padding: 10px 12px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .attendance-note-prompt label {
          font-size: 0.72rem;
          color: #CBD5E1;
        }

        .prompt-input-row {
          display: flex;
          gap: 6px;
        }

        .prompt-input-row input {
          flex: 1;
          background: #0B1424;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.78rem;
        }

        .btn-primary-small {
          background: #0B5FFF;
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-secondary-small {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94A3B8;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
        }

        /* METADADOS GERAIS */
        .detail-meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
          background: rgba(255, 255, 255, 0.03);
          padding: 12px 14px;
          border-radius: 10px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .meta-item .label {
          font-size: 0.68rem;
          color: #94A3B8;
          text-transform: uppercase;
        }

        .meta-item .val {
          font-size: 0.78rem;
          font-weight: 600;
          color: #F1F5F9;
        }

        .status-badge-inline {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .status-badge-inline.confirmado {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
        }

        .status-badge-inline.agendado {
          background: rgba(245, 158, 11, 0.15);
          color: #FBBF24;
        }

        .status-badge-inline.concluído {
          background: rgba(56, 189, 248, 0.15);
          color: #38BDF8;
        }

        .status-badge-inline.ausente {
          background: rgba(239, 68, 68, 0.15);
          color: #F87171;
        }

        .status-badge-inline.pendente {
          background: rgba(148, 163, 184, 0.15);
          color: #94A3B8;
        }

        /* LISTA DE PRESENÇA (ATLETAS NA LINEUP) */
        .attendance-roster-box {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .lineup-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .lineup-header-row .label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #E2E8F0;
        }

        .count-pill {
          font-size: 0.68rem;
          font-weight: 600;
          background: rgba(11, 95, 255, 0.15);
          color: #60A5FA;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .attendance-players-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .att-player-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 6px 10px;
        }

        .att-player-card.confirmado {
          border-left: 3px solid #10B981;
        }

        .att-player-card.atraso {
          border-left: 3px solid #F59E0B;
        }

        .att-player-card.ausente {
          border-left: 3px solid #EF4444;
        }

        .att-player-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .att-player-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .att-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .att-player-name {
          font-size: 0.8rem;
          color: #F8FAFC;
        }

        .att-player-nick {
          font-size: 0.72rem;
          color: #94A3B8;
        }

        .att-player-lane {
          font-size: 0.65rem;
          background: rgba(11, 95, 255, 0.15);
          color: #93C5FD;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .att-note-bubble {
          display: block;
          font-size: 0.68rem;
          color: #FBBF24;
          margin-top: 1px;
        }

        .att-player-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .att-status-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .att-status-pill.confirmado {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
        }

        .att-status-pill.atraso {
          background: rgba(245, 158, 11, 0.15);
          color: #FBBF24;
        }

        .att-status-pill.ausente {
          background: rgba(239, 68, 68, 0.15);
          color: #F87171;
        }

        .staff-quick-rsvp-actions {
          display: flex;
          gap: 3px;
        }

        .quick-btn-icon {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .quick-btn-icon.check {
          background: rgba(16, 185, 129, 0.2);
          color: #34D399;
        }

        .quick-btn-icon.warn {
          background: rgba(245, 158, 11, 0.2);
          color: #FBBF24;
        }

        .quick-btn-icon.cross {
          background: rgba(239, 68, 68, 0.2);
          color: #F87171;
        }

        .detail-notes-box {
          background: rgba(0, 0, 0, 0.2);
          border-left: 3px solid #0B5FFF;
          padding: 8px 12px;
          border-radius: 4px;
        }

        .detail-notes-box p {
          font-size: 0.78rem;
          color: #CBD5E1;
          margin: 4px 0 0;
        }

        .detail-footer {
          padding: 14px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.2);
          flex-shrink: 0;
        }

        .footer-right-actions {
          display: flex;
          gap: 8px;
        }

        .btn-danger-outline {
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #EF4444;
          font-size: 0.78rem;
          padding: 6px 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }

        .btn-danger-outline:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        .btn-primary {
          background: #0B5FFF;
          border: none;
          color: white;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #E2E8F0;
          font-size: 0.78rem;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
        }

        /* FORMULÁRIO DE NOVO COMPROMISSO */
        .teams-form {
          padding: 18px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-row-3 {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 10px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group label {
          font-size: 0.76rem;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 2px;
        }

        .form-group input, .form-group select, .form-group textarea {
          color-scheme: dark;
          background: rgba(10, 16, 32, 0.75);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          color: white;
          padding: 10px 14px;
          height: 42px;
          font-size: 0.88rem;
          font-family: var(--font-body);
          font-weight: 500;
          outline: none;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25);
          transition: border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      background 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .form-group input::placeholder, .form-group textarea::placeholder {
          color: rgba(148, 163, 184, 0.45);
        }

        .form-group input:hover, .form-group select:hover, .form-group textarea:hover {
          border-color: rgba(255, 255, 255, 0.26);
          background-color: rgba(14, 22, 44, 0.85);
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          border-color: #0B5FFF;
          background-color: rgba(12, 22, 44, 0.95);
          box-shadow: 0 0 0 3px rgba(11, 95, 255, 0.22), 0 4px 16px rgba(11, 95, 255, 0.15);
        }

        .form-group select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-color: rgba(10, 16, 32, 0.85);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat !important;
          background-position: calc(100% - 14px) center !important;
          background-size: 16px 16px !important;
          padding-right: 40px !important;
          cursor: pointer;
          color-scheme: dark;
        }

        .form-group select:focus {
          background-color: rgba(12, 22, 44, 0.95);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2338BDF8' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat !important;
          background-position: calc(100% - 14px) center !important;
          background-size: 16px 16px !important;
        }

        .form-group select option, .form-group select optgroup {
          background-color: #0b1329 !important;
          color: #f1f5f9 !important;
          padding: 12px 14px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .form-group select option:checked {
          background-color: #0284c7 !important;
          color: #ffffff !important;
        }

        .form-group input[type="date"],
        .form-group input[type="time"] {
          cursor: pointer;
          letter-spacing: 0.03em;
          color-scheme: dark;
          font-family: inherit;
          font-weight: 500;
          position: relative;
        }

        .form-group input[type="date"]::-webkit-calendar-picker-indicator,
        .form-group input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.85) sepia(20%) saturate(300%) hue-rotate(180deg) brightness(1.2);
          cursor: pointer;
          opacity: 0.85;
          transition: opacity 0.2s, filter 0.2s, transform 0.15s, background 0.2s;
          padding: 5px;
          border-radius: 6px;
          margin-right: 2px;
        }

        .form-group input[type="date"]::-webkit-calendar-picker-indicator:hover,
        .form-group input[type="time"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
          filter: invert(1) brightness(1.3);
          background: rgba(56, 189, 248, 0.2);
          transform: scale(1.1);
        }

        .form-group input[type="date"]::-webkit-datetime-edit,
        .form-group input[type="time"]::-webkit-datetime-edit {
          padding: 0;
          color: #f3f4f6;
        }

        .form-group input[type="date"]::-webkit-datetime-edit-fields-wrapper,
        .form-group input[type="time"]::-webkit-datetime-edit-fields-wrapper {
          padding: 0;
        }

        .form-group textarea {
          height: auto;
          min-height: 90px;
          resize: vertical;
          line-height: 1.5;
        }

        /* SELEÇÃO DE LINEUP NO FORM */
        .lineup-selection-section {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .lineup-selection-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 8px;
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #F8FAFC;
        }

        .lineup-hint {
          font-size: 0.68rem;
          color: #94A3B8;
        }

        .lineup-quick-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lineup-counter-badge {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .lineup-counter-badge.good {
          background: rgba(16, 185, 129, 0.2);
          color: #34D399;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .lineup-counter-badge.warning {
          background: rgba(245, 158, 11, 0.2);
          color: #FBBF24;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .btn-chip-action {
          background: rgba(11, 95, 255, 0.15);
          border: 1px solid rgba(11, 95, 255, 0.3);
          color: #93C5FD;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-chip-action:hover {
          background: #0B5FFF;
          color: white;
        }

        .btn-chip-action.text-muted {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: #94A3B8;
        }

        .members-picker-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .member-pick-card {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 6px 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .member-pick-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.18);
        }

        .member-pick-card.selected {
          background: rgba(11, 95, 255, 0.15);
          border-color: #0B5FFF;
        }

        .pick-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .pick-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .pick-name {
          font-size: 0.74rem;
          color: #F8FAFC;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pick-nick {
          font-size: 0.65rem;
          color: #94A3B8;
        }

        .pick-tags {
          display: flex;
          gap: 4px;
          margin-top: 2px;
        }

        .pick-role-pill {
          font-size: 0.58rem;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 3px;
        }

        .pick-role-pill.titular {
          background: rgba(16, 185, 129, 0.2);
          color: #34D399;
        }

        .pick-role-pill.reserva {
          background: rgba(148, 163, 184, 0.2);
          color: #CBD5E1;
        }

        .pick-lane-pill {
          font-size: 0.58rem;
          background: rgba(11, 95, 255, 0.15);
          color: #93C5FD;
          padding: 1px 4px;
          border-radius: 3px;
        }

        .pick-check-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .member-pick-card.selected .pick-check-circle {
          background: #0B5FFF;
          border-color: #0B5FFF;
        }

        .custom-player-add-row {
          display: flex;
          gap: 8px;
        }

        .custom-player-add-row input {
          flex: 1;
          height: 38px;
          color-scheme: dark;
          background: rgba(10, 16, 32, 0.75);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.82rem;
          outline: none;
          transition: all 0.2s;
        }

        .custom-player-add-row input:focus {
          border-color: #0B5FFF;
          box-shadow: 0 0 0 3px rgba(11, 95, 255, 0.2);
        }

        .btn-add-custom-p {
          background: rgba(11, 95, 255, 0.15);
          border: 1px solid rgba(11, 95, 255, 0.35);
          color: #93C5FD;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 8px 14px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-custom-p:hover {
          background: #0B5FFF;
          color: #FFFFFF;
          border-color: #0B5FFF;
        }

        /* SCORE & GAME BREAKDOWN MODAL */
        .score-input-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          background: rgba(0, 0, 0, 0.35);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .team-score-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .team-name-lbl {
          font-size: 0.8rem;
          font-weight: 700;
          color: #E2E8F0;
        }

        .score-auto-badge {
          width: 68px;
          height: 56px;
          font-size: 2.2rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #080D1A;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          transition: all 0.2s ease;
        }

        .score-auto-badge.us {
          border: 2px solid #10B981;
          color: #34D399;
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.25);
        }

        .score-auto-badge.them {
          border: 2px solid #64748B;
          color: #F8FAFC;
        }

        .auto-calc-indicator {
          font-size: 0.62rem;
          font-weight: 600;
          color: #38BDF8;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 2px 8px;
          border-radius: 6px;
          margin-top: 4px;
          text-align: center;
        }

        .vs-sign-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .vs-sign {
          font-size: 1.2rem;
          font-weight: 800;
          color: #64748B;
        }

        .vs-sub-lbl {
          font-size: 0.65rem;
          color: #94A3B8;
        }

        .mvp-select {
          background-color: #0B1424;
          border: 1px solid rgba(251, 191, 36, 0.4);
          color: #FDE68A;
          font-weight: 600;
          color-scheme: dark;
        }

        .game-breakdown-section {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .gb-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .gb-rows-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .gb-row-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 8px 12px;
          border-radius: 8px;
        }

        .gb-game-index {
          font-size: 0.75rem;
          font-weight: 700;
          color: #CBD5E1;
          width: 50px;
        }

        .gb-inputs-pair {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .gb-input-sub {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .gb-input-sub span {
          font-size: 0.62rem;
          color: #94A3B8;
        }

        .gb-input-sub input {
          height: 38px;
          color-scheme: dark;
          background: rgba(10, 16, 32, 0.75);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: white;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 700;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .gb-input-sub input:focus {
          border-color: #0B5FFF;
          box-shadow: 0 0 0 3px rgba(11, 95, 255, 0.22);
        }

        .gb-divider {
          color: #64748B;
          font-size: 0.8rem;
          font-weight: 700;
          margin-top: 14px;
        }

        .gb-outcome-pill {
          width: 70px;
          text-align: center;
        }

        .badge-win {
          font-size: 0.68rem;
          font-weight: 800;
          background: rgba(16, 185, 129, 0.2);
          color: #34D399;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .badge-loss {
          font-size: 0.68rem;
          font-weight: 800;
          background: rgba(239, 68, 68, 0.2);
          color: #F87171;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .badge-pending {
          font-size: 0.68rem;
          font-weight: 700;
          background: rgba(148, 163, 184, 0.15);
          color: #94A3B8;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .badge-tie {
          font-size: 0.68rem;
          font-weight: 700;
          background: rgba(245, 158, 11, 0.15);
          color: #FBBF24;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .btn-remove-game {
          background: transparent;
          border: none;
          color: #EF4444;
          cursor: pointer;
          padding: 4px;
        }

        .input-with-icon {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0B1424;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 0 10px;
        }

        .input-with-icon svg {
          color: #94A3B8;
        }

        .input-with-icon input {
          border: none;
          background: transparent;
          padding: 8px 0;
          width: 100%;
        }

        @media (max-width: 768px) {
          .teams-top-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .teams-nav-controls, .teams-view-and-actions {
            justify-content: space-between;
          }
          .month-days-header, .month-grid {
            font-size: 0.65rem;
          }
          .form-row-2, .form-row-3 {
            grid-template-columns: 1fr;
          }
          .gb-row-item {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

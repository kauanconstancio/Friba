import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  ExternalLink, 
  X, 
  Check, 
  Swords, 
  Gamepad2, 
  Trophy, 
  Tv, 
  Trash2, 
  CalendarDays, 
  Users
} from 'lucide-react';
import type { ScrimEvent, Role } from '../../types';

interface ScrimAgendaProps {
  currentRole: Role;
  scrims: ScrimEvent[];
  onAddScrim: (scrim: ScrimEvent) => void;
  onUpdateScrim: (scrim: ScrimEvent) => void;
  onDeleteScrim?: (id: string) => void;
  teamName: string;
}

export const ScrimAgenda: React.FC<ScrimAgendaProps> = ({
  currentRole,
  scrims,
  onAddScrim,
  onUpdateScrim,
  onDeleteScrim,
  teamName
}) => {
  // Data base padrão sincronizada com a data de referência competitiva (Setembro 2026)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 8, 26)); // 26 de Setembro de 2026
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');

  // Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScrimEvent | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  // Form State Novo Evento
  const [formData, setFormData] = useState<Partial<ScrimEvent>>({
    opponentTeam: '',
    opponentTag: '',
    title: '',
    opponentContact: '',
    date: '2026-09-26',
    time: '19:30',
    endTime: '21:00',
    format: 'MD3',
    status: 'Confirmado',
    category: 'Amistoso',
    notes: '',
    lineup: ['Kauan Constancio', 'Ana Vidigal', 'BynSeven', 'Soul', 'Digo']
  });

  // Form State Resultado
  const [scoreUs, setScoreUs] = useState(2);
  const [scoreThem, setScoreThem] = useState(1);
  const [vodUrl, setVodUrl] = useState('');
  const [resultNotes, setResultNotes] = useState('');

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
    setCurrentDate(new Date(2026, 8, 26));
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
    return formatDateISO(d) === '2026-09-26';
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

  // Abertura do Modal de Novo Evento para uma data específica
  const handleOpenSlot = (dateStr: string, hourStr: string) => {
    if (!canManage) return;
    const endH = parseInt(hourStr.split(':')[0], 10) + 1;
    const endTime = `${String(endH).padStart(2, '0')}:30`;
    setFormData({
      opponentTeam: '',
      opponentTag: '',
      title: '',
      opponentContact: '',
      date: dateStr,
      time: hourStr,
      endTime,
      format: 'MD3',
      status: 'Confirmado',
      category: 'Amistoso',
      notes: '',
      lineup: ['Kauan Constancio', 'Ana Vidigal', 'BynSeven', 'Soul', 'Digo']
    });
    setIsAddModalOpen(true);
  };

  // Salvar novo evento
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = formData.title || (formData.category === 'Amistoso' ? `Scrim vs ${formData.opponentTeam || 'Adversário'}` : formData.category === 'Treino' ? 'Treino Tático' : 'Compromisso Friba');
    const newScrim: ScrimEvent = {
      id: `scrim-${Date.now()}`,
      opponentTeam: formData.opponentTeam || 'Interno Friba',
      opponentTag: formData.opponentTag || 'FRIBA',
      title: finalTitle,
      opponentContact: formData.opponentContact,
      date: formData.date || '2026-09-26',
      time: formData.time || '19:30',
      endTime: formData.endTime || '21:00',
      format: formData.format || 'MD3',
      status: formData.status || 'Confirmado',
      category: formData.category || 'Amistoso',
      lineup: formData.lineup && formData.lineup.length > 0 ? formData.lineup : ['Kauan Constancio', 'Ana Vidigal', 'BynSeven', 'Soul', 'Digo'],
      notes: formData.notes
    };
    onAddScrim(newScrim);
    setIsAddModalOpen(false);
  };

  // Salvar resultado
  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const updated: ScrimEvent = {
      ...selectedEvent,
      status: 'Concluído',
      score: { us: scoreUs, them: scoreThem },
      vodUrl,
      notes: resultNotes || selectedEvent.notes
    };
    onUpdateScrim(updated);
    setSelectedEvent(updated);
    setIsScoreModalOpen(false);
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
              <span className="teams-sub-desc">Controle de Scrims, Treinos e Campeonatos • {teamName}</span>
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
            <button className="btn-new-event" onClick={() => handleOpenSlot('2026-09-26', '19:30')}>
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

                        {/* Bottom Row: Tag do adversário ou categoria */}
                        <div className="m-card-bottom">
                          <span className="m-tag-pill" style={{ color: catInfo.text }}>
                            {event.opponentTag ? `@${event.opponentTag}` : catInfo.label}
                          </span>
                          {event.status === 'Confirmado' && (
                            <span className="m-status-dot-confirmed">Confirmado</span>
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
      {/* MODAL: DETALHES DO EVENTO SELECIONADO */}
      {/* ========================================================================= */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content modal-teams-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-tag">
                <div 
                  className="cat-indicator" 
                  style={{ background: getCategoryDetails(selectedEvent.category).color }} 
                />
                <h3>{selectedEvent.title || selectedEvent.opponentTeam}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="detail-body">
              <div className="detail-meta-grid">
                <div className="meta-item">
                  <span className="label">Categoria</span>
                  <span className="val">{getCategoryDetails(selectedEvent.category).label}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Data</span>
                  <span className="val">{selectedEvent.date}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Horário</span>
                  <span className="val">{selectedEvent.time} – {selectedEvent.endTime || '21:00'}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Formato</span>
                  <span className="val">{selectedEvent.format}</span>
                </div>
              </div>

              {selectedEvent.opponentContact && (
                <div className="detail-field">
                  <span className="label">Contato Adversário:</span>
                  <span className="val-inline">{selectedEvent.opponentContact}</span>
                </div>
              )}

              {/* Lineup Escalada */}
              <div className="detail-field">
                <span className="label"><Users size={13} /> Lineup Escalada:</span>
                <div className="lineup-chips">
                  {selectedEvent.lineup?.map((player, idx) => (
                    <span key={idx} className="lineup-chip">{player}</span>
                  )) || <span>Titulares Oficiais Friba</span>}
                </div>
              </div>

              {/* Status & Placar */}
              <div className="detail-field status-field-box">
                <div>
                  <span className="label">Status:</span>
                  <span className={`status-badge-inline ${selectedEvent.status.toLowerCase()}`}>
                    {selectedEvent.status}
                  </span>
                </div>

                {selectedEvent.score ? (
                  <div className="score-summary">
                    <span className="score-title">Resultado:</span>
                    <span className="score-display">
                      Friba <strong>{selectedEvent.score.us}</strong> x <strong>{selectedEvent.score.them}</strong> {selectedEvent.opponentTag}
                    </span>
                  </div>
                ) : null}
              </div>

              {selectedEvent.notes && (
                <div className="detail-notes-box">
                  <span className="label">Instruções / Notas Táticas:</span>
                  <p>{selectedEvent.notes}</p>
                </div>
              )}

              {selectedEvent.vodUrl && (
                <div className="vod-container">
                  <a href={selectedEvent.vodUrl} target="_blank" rel="noreferrer" className="btn-vod-action">
                    <ExternalLink size={14} /> Acessar Transmissão / VOD
                  </a>
                </div>
              )}
            </div>

            <div className="modal-footer detail-footer">
              {canManage && (
                <button 
                  className="btn-danger-outline" 
                  onClick={() => handleDelete(selectedEvent.id)}
                >
                  <Trash2 size={14} /> Excluir
                </button>
              )}

              <div className="footer-right-actions">
                {canManage && selectedEvent.status !== 'Concluído' && (
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      setScoreUs(2);
                      setScoreThem(1);
                      setVodUrl(selectedEvent.vodUrl || '');
                      setResultNotes(selectedEvent.notes || '');
                      setIsScoreModalOpen(true);
                    }}
                  >
                    <Check size={14} /> Registrar Resultado
                  </button>
                )}
                <button className="btn-secondary" onClick={() => setSelectedEvent(null)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO COMPROMISSO */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content modal-teams-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Novo Compromisso na Agenda</h3>
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
                    placeholder="Ex: Scrim vs LOUD, Treino Rayquaza..."
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>

              {formData.category === 'Amistoso' && (
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Equipe Adversária</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Keyd Stars, paiN Gaming"
                      value={formData.opponentTeam || ''}
                      onChange={(e) => setFormData({ ...formData, opponentTeam: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>TAG da Equipe</label>
                    <input
                      type="text"
                      placeholder="Ex: VKS, PNG"
                      value={formData.opponentTag || ''}
                      onChange={(e) => setFormData({ ...formData, opponentTag: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="form-row-3">
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    required
                    value={formData.date || '2026-09-26'}
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
                  <label>Contato do Organizador / Manager</label>
                  <input
                    type="text"
                    placeholder="Discord: @manager_tag"
                    value={formData.opponentContact || ''}
                    onChange={(e) => setFormData({ ...formData, opponentContact: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notas Táticas / Objetivos</label>
                <textarea
                  rows={2}
                  placeholder="Objetivos do treino, composições a testar..."
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR RESULTADO & VOD */}
      {/* ========================================================================= */}
      {isScoreModalOpen && selectedEvent && (
        <div className="modal-overlay" onClick={() => setIsScoreModalOpen(false)}>
          <div className="modal-content modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar Resultado da Partida</h3>
              <button onClick={() => setIsScoreModalOpen(false)} className="close-btn"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveResult} className="teams-form">
              <div className="score-input-container">
                <div className="team-score-block">
                  <span className="team-name-lbl">Friba Esports</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    className="score-num-input"
                    value={scoreUs}
                    onChange={(e) => setScoreUs(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <span className="vs-sign">X</span>
                <div className="team-score-block">
                  <span className="team-name-lbl">{selectedEvent.opponentTeam}</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    className="score-num-input"
                    value={scoreThem}
                    onChange={(e) => setScoreThem(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Link do VOD / Gravação</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={vodUrl}
                  onChange={(e) => setVodUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Resumo / Feedback do Coach</label>
                <textarea
                  rows={3}
                  placeholder="Pontos fortes, erros em teamfights, contestação de Rayquaza..."
                  value={resultNotes}
                  onChange={(e) => setResultNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsScoreModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={14} /> Salvar & Concluir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESTILOS VISUAIS ESTILO MICROSOFT TEAMS CALENDAR */}
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
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(11, 95, 255, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .calendar-icon-title h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0;
          line-height: 1.2;
        }

        .teams-sub-desc {
          font-size: 0.72rem;
          color: #94A3B8;
        }

        .date-stepper-group {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 4px 12px;
          border-radius: 9999px;
          box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.2);
        }

        .today-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #E2E8F0;
          font-size: 0.76rem;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .today-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          color: white;
        }

        .stepper-arrows {
          display: flex;
          gap: 2px;
        }

        .stepper-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }

        .stepper-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .current-range-text {
          font-size: 0.84rem;
          font-weight: 700;
          color: #FFFFFF;
          padding-right: 6px;
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
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          padding: 3px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cat-pill {
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.18s;
        }

        .cat-pill.active {
          background: linear-gradient(180deg, #1d68ff 0%, #0b5fff 100%);
          color: white;
          box-shadow: 0 2px 10px rgba(11, 95, 255, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3);
        }

        .teams-view-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(11, 95, 255, 0.12);
          border: 1px solid rgba(11, 95, 255, 0.35);
          color: #93C5FD;
          font-size: 0.74rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 9999px;
          letter-spacing: 0.02em;
        }

        .btn-new-event {
          background: linear-gradient(180deg, #1d68ff 0%, #0b5fff 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 9999px;
          padding: 8px 18px;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(11, 95, 255, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease;
        }

        .btn-new-event:hover {
          background: linear-gradient(180deg, #2b74ff 0%, #1565ff 100%);
          box-shadow: 0 6px 22px rgba(11, 95, 255, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.4);
          transform: translateY(-1px);
        }

        /* ========================================================= */
        /* VISÃO MÊS */
        /* ========================================================= */
        .teams-month-container {
          background: rgba(10, 16, 32, 0.6);
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4), inset 0 1px 1.5px rgba(255, 255, 255, 0.15);
        }

        .month-days-header {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          background: rgba(14, 22, 42, 0.65);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          box-sizing: border-box;
        }

        .month-header-cell {
          padding: 10px;
          text-align: center;
          font-size: 0.72rem;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          min-width: 0;
          box-sizing: border-box;
        }

        .month-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          width: 100%;
          box-sizing: border-box;
        }

        .month-cell {
          min-height: 120px;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
          transition: background 0.12s;
          background: #080d1a;
          min-width: 0;
          overflow: hidden;
          box-sizing: border-box;
        }

        .month-cell:nth-child(7n) {
          border-right: none;
        }

        .month-cell:hover {
          background: rgba(255, 255, 255, 0.025);
        }

        .month-cell.other-month {
          opacity: 0.28;
          background: rgba(0, 0, 0, 0.3);
        }

        .month-cell.today-month-cell {
          background: rgba(11, 95, 255, 0.05);
          box-shadow: inset 0 0 0 1px rgba(11, 95, 255, 0.2);
        }

        .month-cell-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }

        .month-day-num {
          font-size: 0.8rem;
          font-weight: 800;
          color: #64748B;
        }

        .month-day-num.today-num {
          background: #0B5FFF;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.82rem;
          font-weight: 800;
          box-shadow: 0 2px 10px rgba(11, 95, 255, 0.6);
        }

        .month-count {
          font-size: 0.65rem;
          font-weight: 700;
          color: #94A3B8;
          background: rgba(255, 255, 255, 0.06);
          padding: 1px 5px;
          border-radius: 9999px;
        }

        .month-events-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* CARD COMPLETO E ROBUSTO NO MÊS */
        .month-event-card {
          border-left: 3px solid #0B5FFF;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.35);
          position: relative;
        }

        .month-event-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55);
          filter: brightness(1.1);
        }

        .m-card-top {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .m-cat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .m-format-tag {
          font-size: 0.62rem;
          font-weight: 800;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94A3B8;
          padding: 1px 5px;
          border-radius: 4px;
          letter-spacing: 0.03em;
        }

        .m-time-pill {
          margin-left: auto;
          font-size: 0.68rem;
          font-weight: 700;
          color: #E2E8F0;
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 6px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 3px;
          font-family: monospace;
        }

        .m-score-badge {
          margin-left: auto;
          font-size: 0.68rem;
          font-weight: 800;
          color: #34D399;
          background: rgba(16, 185, 129, 0.22);
          border: 1px solid rgba(16, 185, 129, 0.45);
          padding: 1px 6px;
          border-radius: 4px;
          font-family: monospace;
          box-shadow: 0 1px 6px rgba(16, 185, 129, 0.3);
        }

        .m-card-title-row {
          margin-top: 1px;
        }

        .m-team-name {
          font-size: 0.82rem;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.25;
          letter-spacing: -0.01em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
        }

        .m-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 2px;
        }

        .m-tag-pill {
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .m-status-dot-confirmed {
          font-size: 0.58rem;
          font-weight: 800;
          color: #38BDF8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* ========================================================= */
        /* MODAIS E DETALHES */
        /* ========================================================= */
        .modal-teams-detail {
          max-width: 520px;
          width: 100%;
        }

        .modal-header-tag {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cat-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .detail-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 14px;
        }

        .detail-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          background: rgba(0, 0, 0, 0.25);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .meta-item .label, .detail-field .label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
        }

        .meta-item .val {
          font-size: 0.84rem;
          font-weight: 700;
          color: #E2E8F0;
        }

        .detail-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .val-inline {
          font-size: 0.82rem;
          color: #94A3B8;
        }

        .lineup-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .lineup-chip {
          font-size: 0.72rem;
          background: rgba(11, 95, 255, 0.12);
          border: 1px solid rgba(11, 95, 255, 0.3);
          color: #93C5FD;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 600;
        }

        .status-field-box {
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          padding: 10px 14px;
          border-radius: 8px;
        }

        .status-badge-inline {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          margin-left: 8px;
        }

        .status-badge-inline.confirmado {
          background: rgba(56, 189, 248, 0.15);
          color: #38BDF8;
        }

        .status-badge-inline.agendado {
          background: rgba(245, 158, 11, 0.15);
          color: #FBBF24;
        }

        .status-badge-inline.concluído {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
        }

        .score-summary {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: #94A3B8;
        }

        .score-display strong {
          color: #34D399;
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

        .vod-container {
          margin-top: 4px;
        }

        .btn-vod-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          background: #8B5CF6;
          color: white;
          padding: 8px 14px;
          border-radius: 6px;
          text-decoration: none;
        }

        .btn-vod-action:hover {
          background: #7C3AED;
        }

        .detail-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        /* FORMS */
        .modal-teams-form {
          max-width: 540px;
          width: 100%;
        }

        .teams-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 14px;
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

        .score-input-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: rgba(0, 0, 0, 0.25);
          padding: 16px;
          border-radius: 10px;
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

        .score-num-input {
          width: 60px;
          height: 50px;
          font-size: 1.8rem;
          font-weight: 800;
          text-align: center;
          background: #0B1424;
          border: 2px solid #0B5FFF;
          border-radius: 8px;
          color: white;
        }

        .vs-sign {
          font-size: 1.1rem;
          font-weight: 800;
          color: #64748B;
        }

        @media (max-width: 768px) {
          .teams-top-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .teams-nav-controls, .teams-view-and-actions {
            justify-content: space-between;
          }
          .week-header-row, .grid-hour-row {
            grid-template-columns: 50px repeat(7, 1fr);
          }
          .form-row-2, .form-row-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

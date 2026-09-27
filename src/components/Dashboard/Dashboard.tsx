import React, { useState } from 'react';
import { 
  Trophy, 
  Users, 
  CalendarClock, 
  Swords, 
  Map, 
  Megaphone,
  Calendar,
  Plus,
  Dumbbell,
  X,
  Check
} from 'lucide-react';
import type { Role, TeamMember, ScrimEvent, TeamAnnouncement } from '../../types';

interface DashboardProps {
  currentRole: Role;
  members: TeamMember[];
  scrims: ScrimEvent[];
  announcements: TeamAnnouncement[];
  onAddAnnouncement: (a: TeamAnnouncement) => void;
  onAddScrim: (s: ScrimEvent) => void;
  onNavigate: (tab: string) => void;
  teamName: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentRole,
  members,
  scrims,
  announcements,
  onAddAnnouncement,
  onAddScrim,
  onNavigate
}) => {
  // Filtro de eventos do card "Próximos Eventos"
  const [eventFilter, setEventFilter] = useState<'TODOS' | 'TREINOS' | 'AMISTOSOS'>('TODOS');
  
  // Modais de criação rápida a partir dos cards
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isNewNoticeModalOpen, setIsNewNoticeModalOpen] = useState(false);

  // Form novo evento
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'Amistoso' | 'Treino'>('Amistoso');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventTime, setNewEventTime] = useState('19:30');
  const [newEventFormat, setNewEventFormat] = useState<'MD1' | 'MD3' | 'MD5'>('MD3');

  // Form novo aviso
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticePriority, setNewNoticePriority] = useState<'Normal' | 'Alta'>('Normal');

  const canManage = currentRole === 'Dono' || currentRole === 'Manager' || currentRole === 'Coach';

  // Cálculos de KPIs
  const completed = scrims.filter(s => s.status === 'Concluído');
  const won = completed.filter(s => s.score && s.score.us > s.score.them).length;
  const winRate = completed.length > 0 ? Math.round((won / completed.length) * 100) : 67;

  const starters = members.filter(m => m.role === 'Jogador' && m.status === 'Titular');
  const staff = members.filter(m => m.role !== 'Jogador');

  // Filtragem de eventos futuros (Agendado ou Confirmado)
  const upcomingEvents = scrims
    .filter(s => s.status === 'Agendado' || s.status === 'Confirmado')
    .filter(s => {
      if (eventFilter === 'TODOS') return true;
      if (eventFilter === 'TREINOS') return s.category === 'Treino' || s.opponentTeam.toLowerCase().includes('treino');
      if (eventFilter === 'AMISTOSOS') return s.category === 'Amistoso' || !s.opponentTeam.toLowerCase().includes('treino');
      return true;
    });

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;

    onAddScrim({
      id: `scrim-${Date.now()}`,
      opponentTeam: newEventTitle,
      opponentTag: newEventType === 'Treino' ? 'TREINO' : 'RIVAL',
      date: newEventDate,
      time: newEventTime,
      format: newEventFormat,
      status: 'Confirmado',
      category: newEventType,
      lineup: ['Aegis', 'Shadow', 'Hyper', 'Healer', 'Titan']
    });

    setIsNewEventModalOpen(false);
    setNewEventTitle('');
  };

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle || !newNoticeContent) return;

    onAddAnnouncement({
      id: `ann-${Date.now()}`,
      title: newNoticeTitle,
      content: newNoticeContent,
      author: `${currentRole}`,
      date: 'Agora',
      priority: newNoticePriority
    });

    setIsNewNoticeModalOpen(false);
    setNewNoticeTitle('');
    setNewNoticeContent('');
  };

  return (
    <div className="dash-clean">
      {/* Banner Principal Friba Esports */}
      <section className="dash-hero glass-panel">
        <div className="dash-hero-left">
          <img src="/friba-logo.png" alt="Friba Esports" className="hero-logo" />
          <div>
            <div className="hero-tag-row">
              <span className="hero-tag">Visão: {currentRole}</span>
              <span className="hero-gofriba">#GOFRIBA</span>
            </div>
            <h1 className="hero-title">
              FRIBA <span className="text-red">ESPORTS</span>
            </h1>
            <p className="hero-sub">
              Centro de Gestão & Análise Tática de Pokémon Unite • Nova Friburgo - RJ
            </p>
          </div>
        </div>

        <div className="hero-quick-actions">
          <button className="btn-primary" onClick={() => onNavigate('draft')}>
            <Swords size={15} /> Draft
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('tactical')}>
            <Map size={15} /> Prancheta
          </button>
          <button className="btn-red" onClick={() => onNavigate('agenda')}>
            <CalendarClock size={15} /> Agenda
          </button>
        </div>
      </section>

      {/* 3 Métricas Essenciais */}
      <section className="metrics-row">
        <div className="metric-box glass-panel">
          <div className="m-icon win"><Trophy size={20} /></div>
          <div>
            <div className="m-val">{winRate}%</div>
            <div className="m-lbl">Aproveitamento em Scrims ({won}/{completed.length || 1})</div>
          </div>
        </div>

        <div className="metric-box glass-panel">
          <div className="m-icon roster"><Users size={20} /></div>
          <div>
            <div className="m-val">{starters.length} Titulares</div>
            <div className="m-lbl">{staff.length} membros na comissão técnica</div>
          </div>
        </div>

        <div className="metric-box glass-panel">
          <div className="m-icon calendar"><CalendarClock size={20} /></div>
          <div>
            <div className="m-val">{upcomingEvents[0] ? upcomingEvents[0].opponentTeam : 'Nenhum'}</div>
            <div className="m-lbl">
              {upcomingEvents[0] ? `Próximo evento: ${upcomingEvents[0].date} às ${upcomingEvents[0].time}` : 'Sem eventos pendentes'}
            </div>
          </div>
        </div>
      </section>

      {/* Grid Principal: CARDS MURAL E PRÓXIMOS EVENTOS */}
      <div className="dash-cards-grid">
        {/* CARD 1: MURAL */}
        <div className="friba-custom-card glass-panel">
          <div className="friba-card-header">
            <div className="card-title-group">
              <Megaphone size={22} className="card-icon-megaphone" />
              <h2 className="friba-card-title">Mural</h2>
            </div>

            <div className="card-header-actions">
              {canManage && (
                <button 
                  className="card-novo-btn" 
                  onClick={() => setIsNewNoticeModalOpen(true)}
                  title="Criar novo aviso no mural"
                >
                  <Plus size={12} /> NOVO
                </button>
              )}
              <button 
                className="friba-arrow-link" 
                onClick={() => onNavigate('roster')}
              >
                VER TUDO →
              </button>
            </div>
          </div>

          <div className="friba-card-body">
            {announcements.length === 0 ? (
              <div className="card-empty-state">
                <span>Nenhum aviso.</span>
              </div>
            ) : (
              <div className="mural-items-list">
                {announcements.map((item) => (
                  <div key={item.id} className="mural-item-row">
                    <div className="mural-item-top">
                      <span className="mural-item-title">{item.title}</span>
                      <span className={`mural-badge ${item.priority === 'Alta' ? 'priority-high' : ''}`}>
                        {item.priority === 'Alta' ? 'IMPORTANTE' : item.date}
                      </span>
                    </div>
                    <p className="mural-item-content">{item.content}</p>
                    <div className="mural-item-meta">
                      Por <strong>{item.author}</strong> • {item.date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: PRÓXIMOS EVENTOS */}
        <div className="friba-custom-card glass-panel">
          <div className="friba-card-header">
            <div className="card-title-group">
              <Calendar size={22} className="card-icon-calendar" />
              <h2 className="friba-card-title">Próximos Eventos</h2>
            </div>

            <div className="card-header-actions">
              {canManage && (
                <button 
                  className="card-novo-btn" 
                  onClick={() => setIsNewEventModalOpen(true)}
                  title="Agendar novo evento"
                >
                  <Plus size={12} /> NOVO
                </button>
              )}
              <button 
                className="friba-arrow-link" 
                onClick={() => onNavigate('agenda')}
              >
                AGENDA →
              </button>
            </div>
          </div>

          {/* Barra de Filtro de Eventos */}
          <div className="events-filter-bar">
            <button
              onClick={() => setEventFilter('TODOS')}
              className={`event-filter-pill ${eventFilter === 'TODOS' ? 'active' : ''}`}
            >
              <Calendar size={13} /> TODOS
            </button>
            <button
              onClick={() => setEventFilter('TREINOS')}
              className={`event-filter-pill ${eventFilter === 'TREINOS' ? 'active' : ''}`}
            >
              <Dumbbell size={13} /> TREINOS
            </button>
            <button
              onClick={() => setEventFilter('AMISTOSOS')}
              className={`event-filter-pill ${eventFilter === 'AMISTOSOS' ? 'active' : ''}`}
            >
              <Swords size={13} /> AMISTOSOS
            </button>
          </div>

          <div className="friba-card-body">
            {upcomingEvents.length === 0 ? (
              <div className="card-empty-state">
                <span>Nada agendado.</span>
              </div>
            ) : (
              <div className="events-items-list">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="event-item-row" onClick={() => onNavigate('agenda')}>
                    <div className="event-time-col">
                      <span className="event-date-txt">{event.date.split('-').slice(1).join('/')}</span>
                      <span className="event-hour-txt">{event.time}</span>
                    </div>

                    <div className="event-info-col">
                      <div className="event-name-row">
                        <span className="event-name">{event.opponentTeam}</span>
                        <span className="event-tag-badge">{event.opponentTag}</span>
                      </div>
                      <div className="event-sub-line">
                        Formato: {event.format} • {event.category || 'Competitivo'}
                      </div>
                    </div>

                    <div className="event-status-col">
                      <span className={`status-pill ${event.status.toLowerCase()}`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Novo Aviso no Mural */}
      {isNewNoticeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewNoticeModalOpen(false)}>
          <div className="modal-content modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Novo Aviso no Mural</h3>
              <button onClick={() => setIsNewNoticeModalOpen(false)} className="close-btn"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveNotice} className="simple-form">
              <div className="form-group">
                <label>Título do Aviso</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Foco no Rayquaza aos 2:00"
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Prioridade</label>
                <select
                  value={newNoticePriority}
                  onChange={(e) => setNewNoticePriority(e.target.value as any)}
                >
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta (Destaque Vermelho)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Conteúdo da Mensagem</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escreva a mensagem para a equipe..."
                  value={newNoticeContent}
                  onChange={(e) => setNewNoticeContent(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary btn-sm" onClick={() => setIsNewNoticeModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary btn-sm">
                  <Check size={14} /> Publicar no Mural
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Evento / Treino / Amistoso */}
      {isNewEventModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewEventModalOpen(false)}>
          <div className="modal-content modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agendar Novo Evento</h3>
              <button onClick={() => setIsNewEventModalOpen(false)} className="close-btn"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveEvent} className="simple-form">
              <div className="form-group">
                <label>Título do Evento / Equipe Rival</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Amistoso vs LOUD ou Treino Tático de Rotações"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Tipo de Evento</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as any)}
                  >
                    <option value="Amistoso">Amistoso (Scrim)</option>
                    <option value="Treino">Treino Interno</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Formato</label>
                  <select
                    value={newEventFormat}
                    onChange={(e) => setNewEventFormat(e.target.value as any)}
                  >
                    <option value="MD1">MD1</option>
                    <option value="MD3">MD3</option>
                    <option value="MD5">MD5</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Horário (BRT)</label>
                  <input
                    type="time"
                    required
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary btn-sm" onClick={() => setIsNewEventModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-red btn-sm">
                  <Check size={14} /> Confirmar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .dash-clean {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .dash-hero {
          padding: 22px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          background: rgba(10, 16, 32, 0.65);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-left: 4px solid var(--friba-blue);
          border-radius: 20px;
          box-shadow: 
            0 20px 48px rgba(0, 0, 0, 0.45),
            inset 0 1px 1.5px rgba(255, 255, 255, 0.22);
          position: relative;
        }

        .dash-hero-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .hero-logo {
          width: 85px;
          height: 85px;
          object-fit: contain;
          border-radius: 12px;
          filter: drop-shadow(0 0 16px rgba(11, 95, 255, 0.6)) drop-shadow(0 0 8px rgba(214, 31, 38, 0.4));
          transition: transform 0.25s ease;
        }

        .hero-logo:hover {
          transform: scale(1.04);
        }

        .hero-tag-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hero-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--friba-blue);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .hero-gofriba {
          font-size: 0.7rem;
          font-weight: 900;
          background: rgba(214, 31, 38, 0.2);
          color: #F87171;
          padding: 1px 7px;
          border-radius: 4px;
          border: 1px solid rgba(214, 31, 38, 0.35);
        }

        .hero-title {
          font-size: 1.8rem;
          color: white;
          margin: 2px 0 3px;
          font-weight: 900;
        }

        .text-red {
          color: var(--friba-red);
        }

        .hero-sub {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .hero-quick-actions {
          display: flex;
          gap: 8px;
        }

        .metrics-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .metric-box {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(10, 16, 32, 0.62);
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          box-shadow: 
            0 16px 36px rgba(0, 0, 0, 0.4),
            inset 0 1px 1px rgba(255, 255, 255, 0.18);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .metric-box:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.24);
        }

        .m-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .m-icon.win { background: rgba(11, 95, 255, 0.18); color: #60A5FA; border: 1px solid rgba(11, 95, 255, 0.35); }
        .m-icon.roster { background: rgba(214, 31, 38, 0.18); color: #F87171; border: 1px solid rgba(214, 31, 38, 0.35); }
        .m-icon.calendar { background: rgba(255, 255, 255, 0.1); color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.2); }

        .m-val {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 800;
          color: white;
          line-height: 1.1;
        }

        .m-lbl {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* GRID DOS CARDS PERSONALIZADOS (MURAL E PRÓXIMOS EVENTOS) */
        .dash-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .friba-custom-card {
          background: rgba(10, 16, 32, 0.65);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 380px;
          box-shadow: 
            0 20px 48px rgba(0, 0, 0, 0.45),
            inset 0 1px 1.5px rgba(255, 255, 255, 0.2),
            inset 0 -1px 1px rgba(0, 0, 0, 0.35);
          position: relative;
        }

        .friba-custom-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .friba-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .card-icon-megaphone {
          color: #F97316;
        }

        .card-icon-calendar {
          color: #EF4444;
        }

        .friba-card-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.01em;
        }

        .card-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .card-novo-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          padding: 4px 12px;
          border-radius: 9999px;
          font-family: var(--font-heading);
          font-size: 0.74rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: var(--transition);
        }

        .card-novo-btn:hover {
          background: var(--friba-blue);
          border-color: #38BDF8;
          color: #FFFFFF;
        }

        .friba-arrow-link {
          background: transparent;
          border: none;
          color: #94A3B8;
          font-family: var(--font-heading);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: var(--transition);
        }

        .friba-arrow-link:hover {
          color: #FFFFFF;
          transform: translateX(2px);
        }

        /* Barra de Filtro de Eventos */
        .events-filter-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(6, 10, 20, 0.85);
          padding: 5px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .event-filter-pill {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-heading);
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
        }

        .event-filter-pill:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.05);
        }

        .event-filter-pill.active {
          background: rgba(22, 34, 60, 0.95);
          border-color: rgba(11, 95, 255, 0.4);
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        /* Corpo do Card e Estado Vazio */
        .friba-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .card-empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dim);
          font-size: 0.95rem;
          font-weight: 500;
        }

        /* Lista de Itens do Mural */
        .mural-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mural-item-row {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: var(--transition);
        }

        .mural-item-row:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(11, 95, 255, 0.3);
        }

        .mural-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mural-item-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        .mural-badge {
          font-size: 0.68rem;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .priority-high {
          background: rgba(214, 31, 38, 0.2);
          color: #F87171;
          border: 1px solid rgba(214, 31, 38, 0.4);
        }

        .mural-item-content {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.45;
        }

        .mural-item-meta {
          font-size: 0.72rem;
          color: var(--text-dim);
        }

        /* Lista de Próximos Eventos */
        .events-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }

        .event-item-row {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: var(--transition);
        }

        .event-item-row:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(11, 95, 255, 0.35);
          transform: translateY(-1px);
        }

        .event-time-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(11, 95, 255, 0.12);
          border: 1px solid rgba(11, 95, 255, 0.25);
          border-radius: 8px;
          padding: 6px 10px;
          min-width: 58px;
        }

        .event-date-txt {
          font-size: 0.75rem;
          font-weight: 800;
          color: #60A5FA;
        }

        .event-hour-txt {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .event-info-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .event-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .event-name {
          font-weight: 700;
          font-size: 0.92rem;
          color: #FFFFFF;
        }

        .event-tag-badge {
          font-size: 0.68rem;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          padding: 1px 6px;
          border-radius: 4px;
        }

        .event-sub-line {
          font-size: 0.74rem;
          color: var(--text-dim);
        }

        .event-status-col {
          display: flex;
          align-items: center;
        }

        .status-pill {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
        }

        .status-pill.confirmado { background: rgba(11, 95, 255, 0.15); color: #60A5FA; border: 1px solid rgba(11, 95, 255, 0.3); }
        .status-pill.agendado { background: rgba(245, 158, 11, 0.15); color: #FCD34D; border: 1px solid rgba(245, 158, 11, 0.3); }
        .status-pill.concluído { background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); }

        @media (max-width: 860px) {
          .metrics-row { grid-template-columns: 1fr; }
          .dash-cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

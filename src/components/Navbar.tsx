import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Swords, 
  Map, 
  Calendar, 
  LayoutDashboard, 
  ChevronDown,
  ChevronUp,
  Settings,
  LogOut,
  Crown,
  User,
  Bell,
  Megaphone,
  Trophy,
  CheckCheck,
  X
} from 'lucide-react';
import type { Role, AppUser, ScrimEvent, TeamAnnouncement, TeamMember, TeamNotification } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole?: Role;
  setCurrentRole?: (role: Role) => void;
  teamName?: string;
  onOpenInviteModal?: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
  scrims?: ScrimEvent[];
  announcements?: TeamAnnouncement[];
  members?: TeamMember[];
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  scrims = [],
  announcements = [],
  members = []
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'Todas' | 'Treinos' | 'Mural' | 'Equipe'>('Todas');
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('friba_notifications_read_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const notifications: TeamNotification[] = useMemo(() => {
    const list: TeamNotification[] = [];

    // 1. Scrims / Treinos
    (scrims || []).forEach(s => {
      if (s.status === 'Concluído') {
        list.push({
          id: `scrim-done-${s.id}`,
          title: `Resultado vs ${s.opponentTeam}`,
          message: `Friba ${s.score?.us ?? 0} x ${s.score?.them ?? 0} ${s.opponentTag} • ${s.mvpMemberName ? `MVP: ${s.mvpMemberName} 👑` : 'Concluído'}`,
          category: 'Treino',
          date: s.date,
          read: readNotifIds.includes(`scrim-done-${s.id}`),
          linkTab: 'agenda'
        });
      } else {
        list.push({
          id: `scrim-up-${s.id}`,
          title: `Treino vs ${s.opponentTeam}`,
          message: `${s.date} às ${s.time} (${s.format}) • Confirme sua presença na agenda.`,
          category: 'Treino',
          date: s.date,
          read: readNotifIds.includes(`scrim-up-${s.id}`),
          linkTab: 'agenda'
        });
      }
    });

    // 2. Avisos do Mural
    (announcements || []).forEach(a => {
      list.push({
        id: `ann-${a.id}`,
        title: `Mural: ${a.title}`,
        message: `${a.author}: ${a.content}`,
        category: 'Mural',
        date: a.date,
        read: readNotifIds.includes(`ann-${a.id}`),
        linkTab: 'dashboard'
      });
    });

    // 3. Equipe / Roster
    if (members && members.length > 0) {
      list.push({
        id: `roster-count-${members.length}`,
        title: `Elenco da Friba`,
        message: `${members.length} membros ativos no time (Titulares, Reservas e Staff).`,
        category: 'Equipe',
        date: 'Hoje',
        read: readNotifIds.includes(`roster-count-${members.length}`),
        linkTab: 'roster'
      });
    }

    // 4. Sistema
    list.push({
      id: 'sys-welcome',
      title: 'Friba Esports Hub',
      message: 'Plataforma oficial sincronizada com Pokémon Unite. #GOFRIBA',
      category: 'Sistema',
      date: 'Agora',
      read: readNotifIds.includes('sys-welcome'),
      linkTab: 'dashboard'
    });

    return list;
  }, [scrims, announcements, members, readNotifIds]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === 'Todas') return true;
    if (notifFilter === 'Treinos') return n.category === 'Treino';
    if (notifFilter === 'Mural') return n.category === 'Mural';
    if (notifFilter === 'Equipe') return n.category === 'Equipe';
    return true;
  });

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifIds(allIds);
    localStorage.setItem('friba_notifications_read_v1', JSON.stringify(allIds));
  };

  const handleNotificationClick = (n: TeamNotification) => {
    if (!readNotifIds.includes(n.id)) {
      const updated = [...readNotifIds, n.id];
      setReadNotifIds(updated);
      localStorage.setItem('friba_notifications_read_v1', JSON.stringify(updated));
    }
    setIsNotifOpen(false);
    if (n.linkTab) {
      setActiveTab(n.linkTab);
    }
  };
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    return localStorage.getItem('friba_dock_minimized') === 'true';
  });

  const handleToggleMinimize = (minimized: boolean) => {
    setIsMinimized(minimized);
    localStorage.setItem('friba_dock_minimized', String(minimized));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'roster', label: 'Equipe', icon: Users },
    { id: 'draft', label: 'Draft', icon: Swords },
    { id: 'tactical', label: 'Planner', icon: Map },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  const activeItem = navItems.find(i => i.id === activeTab) || navItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <>
      {/* Barra de Status e Identidade Superior */}
      <header className="top-header-bar">
        <div className="top-header-content">
          {/* Logo Oficial Friba Esports */}
          <div className="brand-section" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
            <img src="/friba-logo.png" alt="Friba Esports" className="brand-logo-img" />
            <div>
              <div className="brand-title">
                FRIBA <span className="brand-red">ESPORTS</span>
              </div>
              <div className="brand-subtitle">#GOFRIBA • POKÉMON UNITE</div>
            </div>
          </div>

          {/* Ações do Topo Direito */}
          <div className="top-header-right-actions">
            {/* Central de Notificações */}
            <div className="top-notif-container">
              <button
                type="button"
                onClick={() => setIsNotifOpen(prev => !prev)}
                className={`top-settings-btn top-notif-btn ${isNotifOpen ? 'active' : ''}`}
                title="Central de Notificações"
              >
                <Bell size={15} />
                <span className="top-settings-label">Avisos</span>
                {unreadCount > 0 && (
                  <span className="notif-count-pill">{unreadCount}</span>
                )}
              </button>

              {/* Popover da Central de Notificações */}
              {isNotifOpen && (
                <div className="notif-dropdown-popover">
                  <div className="notif-popover-header">
                    <div className="notif-header-title">
                      <Bell size={15} color="#0B5FFF" />
                      <strong>Notificações</strong>
                      {unreadCount > 0 && <span className="notif-unread-tag">{unreadCount} novas</span>}
                    </div>
                    <div className="notif-header-actions">
                      {unreadCount > 0 && (
                        <button type="button" className="notif-action-text-btn" onClick={handleMarkAllAsRead} title="Marcar todas como lidas">
                          <CheckCheck size={13} /> Lidas
                        </button>
                      )}
                      <button type="button" className="notif-close-btn" onClick={() => setIsNotifOpen(false)}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Filtro de Notificações */}
                  <div className="notif-filter-tabs">
                    {(['Todas', 'Treinos', 'Mural', 'Equipe'] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        className={`notif-tab-btn ${notifFilter === f ? 'active' : ''}`}
                        onClick={() => setNotifFilter(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* Lista de Notificações */}
                  <div className="notif-list-body">
                    {filteredNotifications.length === 0 ? (
                      <div className="notif-empty-box">
                        <Bell size={24} className="notif-empty-ico" />
                        <span>Nenhuma notificação encontrada</span>
                      </div>
                    ) : (
                      filteredNotifications.map(n => (
                        <div
                          key={n.id}
                          className={`notif-item-card ${!n.read ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className={`notif-icon-col ${n.category.toLowerCase()}`}>
                            {n.category === 'Treino' && <Swords size={14} />}
                            {n.category === 'Mural' && <Megaphone size={14} />}
                            {n.category === 'Equipe' && <Users size={14} />}
                            {n.category === 'Sistema' && <Trophy size={14} />}
                          </div>

                          <div className="notif-content-col">
                            <div className="notif-title-row">
                              <span className="notif-title-txt">{n.title}</span>
                              <span className="notif-time-txt">{n.date}</span>
                            </div>
                            <p className="notif-msg-txt">{n.message}</p>
                            <span className="notif-category-pill">{n.category}</span>
                          </div>

                          {!n.read && <span className="notif-unread-dot" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botão Rápido de Perfil no Header */}
            {currentUser && (
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`top-settings-btn top-profile-btn ${activeTab === 'profile' ? 'active' : ''}`}
                title="Editar Meu Perfil"
              >
                <User size={15} />
                <span className="top-settings-label">Meu Perfil</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`top-settings-btn ${activeTab === 'settings' ? 'active' : ''}`}
              title="Configurações da Equipe e Membros"
            >
              <Settings size={15} />
              <span className="top-settings-label">Configurações</span>
            </button>

            {/* Perfil do Usuário Logado e Logout */}
            {currentUser && (
              <div 
                className={`top-user-profile-badge ${activeTab === 'profile' ? 'active-profile' : ''}`}
                onClick={() => setActiveTab('profile')}
                title="Clique para editar seu perfil"
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                  alt={currentUser.nickname || currentUser.name}
                  className="top-user-avatar"
                />
                <div className="top-user-info">
                  <div className="top-user-name-row">
                    <span className="top-user-nickname">{currentUser.nickname || currentUser.name}</span>
                    {currentUser.role === 'Dono' && <Crown size={12} color="#F59E0B" />}
                  </div>
                  <span className={`top-user-role-tag ${currentUser.role === 'Dono' ? 'role-owner' : ''}`}>
                    {currentUser.role}
                  </span>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLogout();
                    }}
                    className="top-logout-btn"
                    title="Desconectar do sistema"
                  >
                    <LogOut size={14} />
                    <span className="top-logout-text">Sair</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Dock de Navegação Flutuante Inferior Estilo Apple Glass */}
      <div className="apple-glass-dock-wrapper">
        {isMinimized ? (
          /* Botão Circular Flutuante quando minimizada */
          <button
            className="apple-glass-dock-circle"
            onClick={() => handleToggleMinimize(false)}
            title="Expandir menu de navegação"
            aria-label="Expandir menu de navegação"
          >
            <div className="circle-icon-box">
              <ActiveIcon size={20} className="circle-main-icon" />
              <ChevronUp size={13} className="circle-chevron-hint" />
            </div>
            <span className="circle-active-glow" />
          </button>
        ) : (
          /* Menu Completo */
          <nav className="apple-glass-dock" role="navigation" aria-label="Navegação Principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`apple-dock-item ${isActive ? 'active' : ''}`}
                  id={`dock-tab-${item.id}`}
                  title={item.label}
                >
                  <div className="apple-dock-icon">
                    <Icon size={18} />
                  </div>
                  <span className="apple-dock-label">{item.label}</span>
                  {isActive && <span className="apple-dock-dot" />}
                </button>
              );
            })}

            {/* Separador fino */}
            <div className="apple-dock-divider" />

            {/* Botão para Minimizar */}
            <button
              onClick={() => handleToggleMinimize(true)}
              className="apple-dock-minimize-btn"
              title="Minimizar menu de navegação"
              aria-label="Minimizar menu de navegação"
            >
              <ChevronDown size={16} />
            </button>
          </nav>
        )}
      </div>

      <style>{`
        /* ======================================================== */
        /* HEADER SUPERIOR MINIMALISTA COM LOGO E CARGO */
        /* ======================================================== */
        .top-header-bar {
          background: rgba(6, 10, 18, 0.78);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 8px 24px;
        }

        .top-header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-logo-img {
          width: 44px;
          height: 44px;
          object-fit: contain;
          border-radius: 8px;
          filter: drop-shadow(0 0 10px rgba(11, 95, 255, 0.45));
          transition: transform 0.2s ease;
        }

        .brand-logo-img:hover {
          transform: scale(1.05);
        }

        .brand-title {
          font-family: var(--font-heading);
          font-weight: 900;
          font-size: 1.18rem;
          line-height: 1.1;
          letter-spacing: -0.01em;
          color: #FFFFFF;
        }

        .brand-red {
          color: var(--friba-red);
          text-shadow: 0 0 12px rgba(214, 31, 38, 0.5);
        }

        .brand-subtitle {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--friba-blue);
        }

        .top-header-right-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .top-invite-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #38BDF8;
          padding: 6px 13px;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .top-invite-btn:hover {
          background: rgba(56, 189, 248, 0.22);
          border-color: #38BDF8;
          color: #FFFFFF;
          transform: translateY(-1px);
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
        }

        .top-settings-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-light);
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .top-settings-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          border-color: rgba(11, 95, 255, 0.4);
          transform: translateY(-1px);
        }

        .top-settings-btn.active {
          background: rgba(11, 95, 255, 0.2);
          border-color: var(--friba-blue);
          color: #60A5FA;
          box-shadow: 0 0 14px rgba(11, 95, 255, 0.35);
        }

        .top-profile-btn.active {
          background: rgba(214, 31, 38, 0.2);
          border-color: var(--friba-red);
          color: #FCA5A5;
          box-shadow: 0 0 14px rgba(214, 31, 38, 0.35);
        }

        /* CENTRAL DE NOTIFICAÇÕES */
        .top-notif-container {
          position: relative;
        }

        .top-notif-btn {
          position: relative;
        }

        .notif-count-pill {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #EF4444;
          color: white;
          font-size: 0.62rem;
          font-weight: 800;
          min-width: 17px;
          height: 17px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #060A12;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
        }

        .notif-dropdown-popover {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 340px;
          max-width: 90vw;
          background: rgba(14, 21, 38, 0.96);
          backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 14px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05);
          overflow: hidden;
          z-index: 1000;
          animation: notifSlideIn 0.18s ease-out;
        }

        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .notif-popover-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }

        .notif-header-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: #F8FAFC;
        }

        .notif-unread-tag {
          font-size: 0.65rem;
          font-weight: 700;
          background: rgba(11, 95, 255, 0.2);
          color: #60A5FA;
          padding: 1px 6px;
          border-radius: 9999px;
        }

        .notif-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .notif-action-text-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 0.7rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 3px;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .notif-action-text-btn:hover {
          color: #38BDF8;
          background: rgba(56, 189, 248, 0.1);
        }

        .notif-close-btn {
          background: transparent;
          border: none;
          color: #64748B;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
        }

        .notif-close-btn:hover {
          color: white;
        }

        .notif-filter-tabs {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.25);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .notif-tab-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .notif-tab-btn:hover {
          color: white;
        }

        .notif-tab-btn.active {
          background: rgba(11, 95, 255, 0.25);
          color: #60A5FA;
          border: 1px solid rgba(11, 95, 255, 0.4);
        }

        .notif-list-body {
          max-height: 320px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .notif-empty-box {
          padding: 28px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #64748B;
          font-size: 0.75rem;
        }

        .notif-empty-ico {
          color: #334155;
        }

        .notif-item-card {
          padding: 10px 12px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: background 0.15s;
          position: relative;
        }

        .notif-item-card:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .notif-item-card.unread {
          background: rgba(11, 95, 255, 0.07);
        }

        .notif-icon-col {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-icon-col.treino {
          background: rgba(11, 95, 255, 0.18);
          color: #60A5FA;
        }

        .notif-icon-col.mural {
          background: rgba(245, 158, 11, 0.18);
          color: #FBBF24;
        }

        .notif-icon-col.equipe {
          background: rgba(16, 185, 129, 0.18);
          color: #34D399;
        }

        .notif-icon-col.sistema {
          background: rgba(139, 92, 246, 0.18);
          color: #A78BFA;
        }

        .notif-content-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .notif-title-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 6px;
        }

        .notif-title-txt {
          font-size: 0.78rem;
          font-weight: 700;
          color: #F8FAFC;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .notif-time-txt {
          font-size: 0.65rem;
          color: #64748B;
          flex-shrink: 0;
        }

        .notif-msg-txt {
          font-size: 0.72rem;
          color: #94A3B8;
          margin: 0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notif-category-pill {
          align-self: flex-start;
          font-size: 0.6rem;
          font-weight: 600;
          color: #64748B;
          margin-top: 2px;
        }

        .notif-unread-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0B5FFF;
          box-shadow: 0 0 6px #0B5FFF;
          flex-shrink: 0;
          margin-top: 6px;
        }

        .top-user-profile-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          padding: 4px 10px 4px 4px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .top-user-profile-badge:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.18);
          transform: translateY(-1px);
        }

        .top-user-profile-badge.active-profile {
          background: rgba(214, 31, 38, 0.15);
          border-color: rgba(214, 31, 38, 0.45);
          box-shadow: 0 0 16px rgba(214, 31, 38, 0.25);
        }

        .top-user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid #D61F26;
        }

        .top-user-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .top-user-name-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .top-user-nickname {
          font-size: 0.78rem;
          font-weight: 700;
          color: #F8FAFC;
        }

        .top-user-role-tag {
          font-size: 0.65rem;
          font-weight: 600;
          color: #94A3B8;
        }

        .top-user-role-tag.role-owner {
          color: #F59E0B;
        }

        .top-logout-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #F87171;
          border-radius: 9999px;
          padding: 3px 8px;
          font-size: 0.68rem;
          font-weight: 700;
          cursor: pointer;
          margin-left: 4px;
          transition: all 0.15s ease;
        }

        .top-logout-btn:hover {
          background: #EF4444;
          color: #FFFFFF;
        }


        /* ======================================================== */
        /* DOCK ESTILO APPLE GLASS FLUTUANTE NA PARTE INFERIOR */
        /* ======================================================== */
        .apple-glass-dock-wrapper {
          position: fixed;
          bottom: 46px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 999;
          pointer-events: none;
          display: flex;
          justify-content: center;
          width: auto;
          max-width: calc(100vw - 32px);
          animation: dockSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes dockSlideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        .apple-glass-dock {
          pointer-events: auto;
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 9999px;
          background: rgba(10, 16, 28, 0.72);
          backdrop-filter: blur(28px) saturate(200%);
          -webkit-backdrop-filter: blur(28px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 
            0 20px 48px rgba(0, 0, 0, 0.55),
            0 4px 16px rgba(0, 0, 0, 0.35),
            inset 0 1px 1.5px rgba(255, 255, 255, 0.32),
            inset 0 -1px 1px rgba(0, 0, 0, 0.4);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
        }

        /* Reflexo especular superior estilo Apple Glass */
        .apple-glass-dock::before {
          content: '';
          position: absolute;
          top: 0;
          left: 20px;
          right: 20px;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%);
          pointer-events: none;
          border-radius: 9999px;
        }

        .apple-dock-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 9999px;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font-family: var(--font-heading);
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          position: relative;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }

        .apple-dock-item:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px) scale(1.03);
        }

        .apple-dock-item:active {
          transform: translateY(0) scale(0.97);
        }

        .apple-dock-item.active {
          color: #FFFFFF;
          background: linear-gradient(135deg, rgba(11, 95, 255, 0.9) 0%, rgba(0, 71, 214, 0.95) 100%);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 4px 16px rgba(11, 95, 255, 0.55),
            inset 0 1px 1px rgba(255, 255, 255, 0.45);
        }

        .apple-dock-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.22s ease;
        }

        .apple-dock-item:hover .apple-dock-icon {
          transform: scale(1.12);
        }

        .apple-dock-item.active .apple-dock-icon {
          filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.6));
        }

        .apple-dock-label {
          letter-spacing: 0.02em;
        }

        .apple-dock-dot {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--friba-red);
          box-shadow: 0 0 6px var(--friba-red);
        }

        /* Divisor fino entre as abas e o botão de minimizar */
        .apple-dock-divider {
          width: 1px;
          height: 20px;
          background: rgba(255, 255, 255, 0.14);
          margin: 0 2px;
        }

        /* Botão para minimizar no dock */
        .apple-dock-minimize-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid transparent;
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .apple-dock-minimize-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.18);
          transform: translateY(1px);
        }

        .apple-dock-minimize-btn:active {
          transform: scale(0.92);
        }

        /* ======================================================== */
        /* BOTÃO CIRCULAR FLUTUANTE QUANDO MINIMIZADO (APPLE GLASS) */
        /* ======================================================== */
        .apple-glass-dock-circle {
          pointer-events: auto;
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(10, 16, 28, 0.78);
          backdrop-filter: blur(28px) saturate(200%);
          -webkit-backdrop-filter: blur(28px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 
            0 16px 40px rgba(0, 0, 0, 0.6),
            0 0 20px rgba(11, 95, 255, 0.3),
            inset 0 1px 1.5px rgba(255, 255, 255, 0.4),
            inset 0 -1px 1px rgba(0, 0, 0, 0.4);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          animation: dockCirclePop 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes dockCirclePop {
          0% {
            opacity: 0;
            transform: scale(0.7) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .apple-glass-dock-circle::before {
          content: '';
          position: absolute;
          top: 0;
          left: 12px;
          right: 12px;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%);
          pointer-events: none;
          border-radius: 9999px;
        }

        .apple-glass-dock-circle:hover {
          transform: scale(1.1) translateY(-2px);
          border-color: rgba(56, 189, 248, 0.5);
          box-shadow: 
            0 20px 48px rgba(0, 0, 0, 0.7),
            0 0 30px rgba(11, 95, 255, 0.55),
            inset 0 1px 2px rgba(255, 255, 255, 0.6);
        }

        .apple-glass-dock-circle:active {
          transform: scale(0.95);
        }

        .circle-icon-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          color: #FFFFFF;
        }

        .circle-main-icon {
          color: #38BDF8;
          filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.5));
          transition: transform 0.2s ease;
        }

        .apple-glass-dock-circle:hover .circle-main-icon {
          transform: translateY(-1px) scale(1.08);
          color: #60A5FA;
        }

        .circle-chevron-hint {
          color: rgba(255, 255, 255, 0.65);
          transition: transform 0.2s ease;
        }

        .apple-glass-dock-circle:hover .circle-chevron-hint {
          transform: translateY(-2px);
          color: #FFFFFF;
        }

        .circle-active-glow {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--friba-red);
          box-shadow: 0 0 8px var(--friba-red);
        }

        @media (max-width: 680px) {
          .apple-glass-dock {
            padding: 5px 6px;
            gap: 4px;
          }
          .apple-dock-item {
            padding: 8px 12px;
            gap: 0;
          }
          .apple-dock-label {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

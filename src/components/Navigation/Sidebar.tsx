import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Target, 
  Swords, 
  Map, 
  Users, 
  User, 
  Settings, 
  Bell, 
  LogOut, 
  Crown, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  CheckCheck,
  UserPlus
} from 'lucide-react';
import type { Role, AppUser, ScrimEvent, TeamAnnouncement, TeamMember, TeamNotification } from '../../types';

interface SidebarProps {
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavGroup {
  groupLabel: string;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenInviteModal,
  currentUser,
  onLogout,
  scrims = [],
  announcements = [],
  members = [],
  isCollapsed: controlledCollapsed,
  onToggleCollapse
}) => {
  // Estado interno de recolhimento da sidebar em telas desktop caso não seja controlado
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('friba_sidebar_collapsed') === 'true';
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  // Estado do drawer em telas mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Estado do popover de notificações
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'Todas' | 'Treinos' | 'Mural' | 'Equipe'>('Todas');
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('friba_notifications_read_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(prev => {
        const next = !prev;
        localStorage.setItem('friba_sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  // Notificações geradas dinamicamente
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
        date: 'Recente',
        read: readNotifIds.includes(`roster-count-${members.length}`),
        linkTab: 'roster'
      });
    }

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
    setIsMobileOpen(false);
    if (n.linkTab) {
      setActiveTab(n.linkTab);
    }
  };

  // Grupos de navegação da Sidebar
  const navigationGroups: NavGroup[] = [
    {
      groupLabel: 'GERAL',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'agenda', label: 'Agenda & Scrims', icon: Calendar },
      ],
    },
    {
      groupLabel: 'COMPETITIVO & TÁTICA',
      items: [
        { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
        { id: 'rivals', label: 'Hub de Rivais', icon: Target },
        { id: 'draft', label: 'Draft Simulator', icon: Swords },
        { id: 'tactical', label: 'Planner Tático', icon: Map },
      ],
    },
    {
      groupLabel: 'GESTÃO & CONTA',
      items: [
        { id: 'roster', label: 'Equipe & Elenco', icon: Users, badge: members.length },
        { id: 'profile', label: 'Meu Perfil', icon: User },
        { id: 'settings', label: 'Configurações', icon: Settings },
      ],
    },
  ];

  const handleNavigate = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  const canManage = currentUser?.role === 'Dono' || currentUser?.role === 'Manager' || currentUser?.role === 'Coach';

  return (
    <>
      {/* =========================================================================
          1. HEADER COMPACTO PARA DISPOSITIVOS MÓVEIS (< 960px)
          ========================================================================= */}
      <header className="mobile-top-bar">
        <div className="mobile-top-left">
          <button 
            type="button" 
            className="mobile-hamburger-btn"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Abrir menu de navegação"
          >
            <Menu size={22} />
          </button>
          <div className="mobile-brand" onClick={() => handleNavigate('dashboard')}>
            <img src="/friba-logo.png" alt="Friba Esports" className="mobile-logo-img" />
            <span className="mobile-brand-title">FRIBA <span className="text-red">ESPORTS</span></span>
          </div>
        </div>

        <div className="mobile-top-right">
          <button
            type="button"
            className="mobile-notif-btn"
            onClick={() => setIsNotifOpen(prev => !prev)}
            aria-label="Notificações"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="mobile-notif-dot">{unreadCount}</span>}
          </button>

          {currentUser && (
            <div className="mobile-avatar-wrap" onClick={() => handleNavigate('profile')}>
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="mobile-user-avatar"
              />
            </div>
          )}
        </div>
      </header>

      {/* Backdrop transparente/escuro no mobile */}
      {isMobileOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* =========================================================================
          2. SIDEBAR LATERAL RETRÁTIL (DESKTOP & MOBILE DRAWER)
          ========================================================================= */}
      <aside 
        className={`esports-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Navegação da Plataforma"
      >
        {/* Topo da Sidebar: Logo & Botão de Recolher */}
        <div className="sidebar-header">
          <div className="sidebar-brand-wrapper" onClick={() => handleNavigate('dashboard')}>
            <img src="/friba-logo.png" alt="Friba Esports" className="sidebar-logo" />
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-name">FRIBA <span className="text-red">ESPORTS</span></span>
                <span className="sidebar-brand-tag">#GOFRIBA • UNITE</span>
              </div>
            )}
          </div>

          {/* Botão de Toggle Desktop */}
          <button
            type="button"
            className="sidebar-toggle-btn desktop-only"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
            aria-label={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Botão de Fechar Mobile */}
          <button
            type="button"
            className="sidebar-close-btn mobile-only"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Botão de Convidar Jogador (se for Dono/Manager/Coach) */}
        {canManage && onOpenInviteModal && (
          <div className="sidebar-action-box">
            <button
              type="button"
              className="sidebar-invite-btn"
              onClick={() => {
                onOpenInviteModal();
                setIsMobileOpen(false);
              }}
              title="Gerar convite oficial para atleta"
            >
              <UserPlus size={16} />
              {!isCollapsed && <span>Convidar Jogador</span>}
            </button>
          </div>
        )}

        {/* Lista de Grupos de Navegação */}
        <nav className="sidebar-nav-scroll">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="sidebar-group">
              {!isCollapsed && (
                <div className="sidebar-group-header">
                  {group.groupLabel}
                </div>
              )}
              {isCollapsed && <div className="sidebar-group-divider" />}

              <div className="sidebar-group-items">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavigate(item.id)}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="nav-icon-container">
                        <Icon size={19} className="nav-icon" />
                        {isActive && <span className="nav-active-aura" />}
                      </div>

                      {!isCollapsed && (
                        <span className="nav-label">{item.label}</span>
                      )}

                      {!isCollapsed && item.badge !== undefined && (
                        <span className="nav-badge">{item.badge}</span>
                      )}

                      {isCollapsed && (
                        <div className="collapsed-tooltip">
                          {item.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Rodapé da Sidebar: Notificações & Perfil do Usuário */}
        <div className="sidebar-footer">
          {/* Botão de Notificações / Avisos */}
          <div className="sidebar-notif-row">
            <button
              type="button"
              className={`sidebar-notif-btn ${isNotifOpen ? 'active' : ''}`}
              onClick={() => setIsNotifOpen(prev => !prev)}
              title="Central de Avisos e Notificações"
            >
              <div className="notif-btn-icon-wrap">
                <Bell size={18} />
                {unreadCount > 0 && <span className="sidebar-unread-pill">{unreadCount}</span>}
              </div>
              {!isCollapsed && (
                <div className="notif-btn-text">
                  <span className="notif-main-txt">Central de Avisos</span>
                  <span className="notif-sub-txt">
                    {unreadCount > 0 ? `${unreadCount} não lidas` : 'Tudo atualizado'}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Card do Usuário Logado */}
          {currentUser && (
            <div className="sidebar-user-card" onClick={() => handleNavigate('profile')}>
              <div className="user-avatar-wrap">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                  alt={currentUser.name}
                  className="user-avatar-img"
                />
                <span className={`user-status-dot ${currentUser.role === 'Dono' ? 'owner' : ''}`} />
              </div>

              {!isCollapsed && (
                <div className="user-info-text">
                  <div className="user-name-line">
                    <span className="user-nick-txt">{currentUser.nickname || currentUser.name}</span>
                    {currentUser.role === 'Dono' && <Crown size={12} color="#F59E0B" />}
                  </div>
                  <span className={`user-role-pill ${currentUser.role === 'Dono' ? 'owner' : ''}`}>
                    {currentUser.role}
                  </span>
                </div>
              )}

              {onLogout && (
                <button
                  type="button"
                  className="sidebar-logout-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                  }}
                  title="Desconectar do Sistema"
                  aria-label="Sair"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Popover da Central de Notificações */}
        {isNotifOpen && (
          <div className={`sidebar-notif-popover ${isCollapsed ? 'collapsed-pos' : ''}`}>
            <div className="notif-popover-head">
              <div className="head-left">
                <Bell size={16} color="#0B5FFF" />
                <strong>Avisos & Notificações</strong>
                {unreadCount > 0 && <span className="unread-badge">{unreadCount} novas</span>}
              </div>
              <div className="head-right">
                {unreadCount > 0 && (
                  <button type="button" className="mark-read-btn" onClick={handleMarkAllAsRead}>
                    <CheckCheck size={13} /> Lidas
                  </button>
                )}
                <button type="button" className="close-notif-btn" onClick={() => setIsNotifOpen(false)}>
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="notif-tabs">
              {(['Todas', 'Treinos', 'Mural', 'Equipe'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={`tab-btn ${notifFilter === tab ? 'active' : ''}`}
                  onClick={() => setNotifFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="notif-body-scroll">
              {filteredNotifications.length === 0 ? (
                <div className="notif-empty">
                  <Bell size={24} color="#64748B" />
                  <span>Nenhum aviso encontrado</span>
                </div>
              ) : (
                filteredNotifications.map(n => (
                  <div
                    key={n.id}
                    className={`notif-card ${!n.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="notif-card-header">
                      <span className="notif-card-title">{n.title}</span>
                      <span className="notif-card-date">{n.date}</span>
                    </div>
                    <p className="notif-card-msg">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </aside>

      {/* =========================================================================
          3. ESTILOS CSS DA SIDEBAR ESPORTS (APPLE GLASS + DARK ESPORTS)
          ========================================================================= */}
      <style>{`
        /* Mobile Top Bar */
        .mobile-top-bar {
          display: none;
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 60px;
          background: rgba(6, 10, 18, 0.9);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0 16px;
          align-items: center;
          justify-content: space-between;
        }

        .mobile-top-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-hamburger-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #FFF;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .mobile-logo-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .mobile-brand-title {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 900;
          color: #FFF;
        }

        .mobile-top-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mobile-notif-btn {
          position: relative;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #FFF;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mobile-notif-dot {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #D61F26;
          color: #FFF;
          font-size: 0.64rem;
          font-weight: 900;
          padding: 1px 5px;
          border-radius: 9999px;
        }

        .mobile-user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2px solid #0B5FFF;
          object-fit: cover;
          cursor: pointer;
        }

        .mobile-sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(6px);
          z-index: 1050;
        }

        /* Sidebar Base Layout */
        .esports-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 260px;
          background: #070B14;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          z-index: 1100;
          transition: width 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 4px 0 25px rgba(0, 0, 0, 0.4);
        }

        .esports-sidebar.collapsed {
          width: 80px;
        }

        /* Header */
        .sidebar-header {
          height: 68px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
        }

        .sidebar-brand-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          overflow: hidden;
        }

        .sidebar-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
          filter: drop-shadow(0 0 12px rgba(11, 95, 255, 0.45));
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .sidebar-logo:hover {
          transform: scale(1.05);
        }

        .sidebar-brand-text {
          display: flex;
          flex-direction: column;
          white-space: nowrap;
        }

        .sidebar-brand-name {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 900;
          color: #FFF;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }

        .sidebar-brand-tag {
          font-size: 0.62rem;
          font-weight: 800;
          color: #0B5FFF;
          letter-spacing: 0.08em;
        }

        .sidebar-toggle-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .sidebar-toggle-btn:hover {
          background: rgba(11, 95, 255, 0.2);
          border-color: #0B5FFF;
          color: #FFF;
        }

        .sidebar-close-btn {
          display: none;
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
        }

        /* Action Box / Invite */
        .sidebar-action-box {
          padding: 12px 14px;
        }

        .sidebar-invite-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(11, 95, 255, 0.12);
          border: 1px solid rgba(11, 95, 255, 0.35);
          color: #60A5FA;
          font-family: var(--font-heading);
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar-invite-btn:hover {
          background: #0B5FFF;
          color: #FFF;
          box-shadow: 0 0 16px rgba(11, 95, 255, 0.45);
        }

        /* Nav Scroll */
        .sidebar-nav-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sidebar-nav-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-nav-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .sidebar-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-group-header {
          font-size: 0.65rem;
          font-weight: 800;
          color: #475569;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 10px;
        }

        .sidebar-group-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 6px 8px;
        }

        .sidebar-group-items {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        /* Nav Item */
        .sidebar-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 9px 12px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: transparent;
          color: #94A3B8;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
        }

        .sidebar-nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #FFF;
          transform: translateX(2px);
        }

        .sidebar-nav-item.active {
          background: linear-gradient(90deg, rgba(11, 95, 255, 0.2) 0%, rgba(11, 95, 255, 0.06) 100%);
          border-color: rgba(11, 95, 255, 0.4);
          color: #FFF;
          font-weight: 800;
          box-shadow: inset 3px 0 0 #0B5FFF, 0 4px 14px rgba(0, 0, 0, 0.25);
        }

        .nav-icon-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nav-icon {
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .sidebar-nav-item.active .nav-icon {
          color: #38BDF8;
          transform: scale(1.08);
          filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.6));
        }

        .nav-label {
          font-family: var(--font-heading);
          font-size: 0.86rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .nav-badge {
          font-size: 0.68rem;
          font-weight: 800;
          color: #60A5FA;
          background: rgba(11, 95, 255, 0.2);
          border: 1px solid rgba(11, 95, 255, 0.3);
          padding: 1px 6px;
          border-radius: 9999px;
        }

        /* Tooltip when collapsed */
        .collapsed-tooltip {
          display: none;
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: #0F172A;
          color: #FFF;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7);
          z-index: 1200;
          pointer-events: none;
        }

        .esports-sidebar.collapsed .sidebar-nav-item:hover .collapsed-tooltip {
          display: block;
          animation: tooltipSlideIn 0.15s ease-out;
        }

        @keyframes tooltipSlideIn {
          from { opacity: 0; transform: translate(-6px, -50%); }
          to { opacity: 1; transform: translate(0, -50%); }
        }

        /* Footer */
        .sidebar-footer {
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(4, 7, 13, 0.6);
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
        }

        /* Notifications row in footer */
        .sidebar-notif-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: #CBD5E1;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .sidebar-notif-btn:hover, .sidebar-notif-btn.active {
          background: rgba(11, 95, 255, 0.15);
          border-color: rgba(11, 95, 255, 0.4);
          color: #FFF;
        }

        .notif-btn-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-unread-pill {
          position: absolute;
          top: -4px;
          right: -6px;
          background: #D61F26;
          color: #FFF;
          font-size: 0.62rem;
          font-weight: 900;
          padding: 0 4px;
          border-radius: 9999px;
          box-shadow: 0 0 8px rgba(214, 31, 38, 0.8);
        }

        .notif-btn-text {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .notif-main-txt {
          font-size: 0.8rem;
          font-weight: 800;
          color: #FFF;
        }

        .notif-sub-txt {
          font-size: 0.68rem;
          color: #94A3B8;
        }

        /* User Card */
        .sidebar-user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sidebar-user-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .user-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .user-avatar-img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #0B5FFF;
        }

        .user-status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10B981;
          border: 2px solid #070B14;
        }

        .user-status-dot.owner {
          background: #F59E0B;
          box-shadow: 0 0 6px #F59E0B;
        }

        .user-info-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .user-name-line {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .user-nick-txt {
          font-size: 0.84rem;
          font-weight: 800;
          color: #FFF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role-pill {
          font-size: 0.64rem;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .user-role-pill.owner {
          color: #F59E0B;
        }

        .sidebar-logout-btn {
          background: transparent;
          border: none;
          color: #64748B;
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-logout-btn:hover {
          color: #F87171;
          background: rgba(239, 68, 68, 0.15);
        }

        /* Popover de Notificações */
        .sidebar-notif-popover {
          position: absolute;
          left: calc(100% + 14px);
          bottom: 12px;
          width: 350px;
          max-height: 480px;
          background: #090E1A;
          border: 1px solid rgba(11, 95, 255, 0.3);
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
          display: flex;
          flex-direction: column;
          z-index: 1300;
          overflow: hidden;
          animation: popoverSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes popoverSlideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .notif-popover-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .head-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #FFF;
        }

        .unread-badge {
          font-size: 0.65rem;
          font-weight: 800;
          background: rgba(11, 95, 255, 0.2);
          color: #60A5FA;
          padding: 1px 6px;
          border-radius: 6px;
        }

        .head-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mark-read-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .mark-read-btn:hover { color: #FFF; }

        .close-notif-btn {
          background: transparent;
          border: none;
          color: #64748B;
          cursor: pointer;
        }

        .close-notif-btn:hover { color: #FFF; }

        .notif-tabs {
          display: flex;
          padding: 8px 12px;
          gap: 6px;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
        }

        .tab-btn.active {
          background: #0B5FFF;
          color: #FFF;
        }

        .notif-body-scroll {
          padding: 10px 12px;
          overflow-y: auto;
          max-height: 340px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .notif-card {
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .notif-card:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .notif-card.unread {
          border-left: 3px solid #0B5FFF;
          background: rgba(11, 95, 255, 0.08);
        }

        .notif-card-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 800;
          color: #FFF;
          margin-bottom: 4px;
        }

        .notif-card-date {
          font-size: 0.65rem;
          color: #64748B;
        }

        .notif-card-msg {
          font-size: 0.74rem;
          color: #94A3B8;
          line-height: 1.4;
          margin: 0;
        }

        .notif-empty {
          text-align: center;
          padding: 30px 10px;
          color: #64748B;
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        /* =========================================================================
           RESPONSIVIDADE MOBILE & ADAPTAÇÕES DE TELA
           ========================================================================= */
        @media (max-width: 960px) {
          .mobile-top-bar {
            display: flex;
          }

          .desktop-only {
            display: none !important;
          }

          .mobile-only {
            display: flex !important;
          }

          .esports-sidebar {
            width: 280px !important;
            transform: translateX(-100%);
          }

          .esports-sidebar.mobile-open {
            transform: translateX(0);
          }

          .sidebar-notif-popover {
            position: fixed;
            left: 16px;
            right: 16px;
            bottom: 20px;
            width: auto;
          }
        }
      `}</style>
    </>
  );
};

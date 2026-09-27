import React, { useState } from 'react';
import { 
  Users, 
  Swords, 
  Map, 
  Calendar, 
  LayoutDashboard, 
  Crown, 
  Briefcase, 
  GraduationCap, 
  Gamepad2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Role } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  teamName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole
}) => {
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
  ];

  const activeItem = navItems.find(i => i.id === activeTab) || navItems[0];
  const ActiveIcon = activeItem.icon;

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'Dono': return <Crown size={14} color="#D61F26" />;
      case 'Manager': return <Briefcase size={14} color="#0B5FFF" />;
      case 'Coach': return <GraduationCap size={14} color="#34D399" />;
      case 'Jogador': return <Gamepad2 size={14} color="#F87171" />;
    }
  };

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

          {/* Seletor de Cargo */}
          <div className="user-role-section">
            <div className="role-selector-wrapper">
              <span className="role-label">Visão:</span>
              <div className="role-badge-button">
                {getRoleIcon(currentRole)}
                <select 
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value as Role)}
                  className="role-dropdown"
                  aria-label="Alternar Cargo e Visão do Sistema"
                >
                  <option value="Dono">Dono</option>
                  <option value="Manager">Manager</option>
                  <option value="Coach">Coach</option>
                  <option value="Jogador">Jogador</option>
                </select>
              </div>
            </div>
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

        .user-role-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .role-selector-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 4px 10px;
          border-radius: 9999px;
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }

        .role-selector-wrapper:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(11, 95, 255, 0.4);
        }

        .role-label {
          font-size: 0.7rem;
          color: var(--text-dim);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .role-badge-button {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .role-dropdown {
          background: transparent;
          border: none;
          color: #FFFFFF;
          font-family: var(--font-heading);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          outline: none;
          padding-right: 2px;
        }

        .role-dropdown option {
          background: #0B111F;
          color: white;
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

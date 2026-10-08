import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { RosterManagement } from './components/Roster/RosterManagement';
import { DraftSimulator } from './components/Draft/DraftSimulator';
import { TacticalMap } from './components/TacticalMap/TacticalMap';
import { ScrimAgenda } from './components/Agenda/ScrimAgenda';
import { TeamSettings } from './components/Settings/TeamSettings';
import { AcceptInviteModal } from './components/Invites/AcceptInviteModal';
import { LoginPage } from './components/Auth/LoginPage';
import { ProfilePage } from './components/Profile/ProfilePage';
import { ToastContainer } from './components/UI/Toast';
import { showToast } from './components/UI/toastService';
import { ShieldCheck } from 'lucide-react';
import type { 
  Role, 
  TeamMember, 
  ScrimEvent, 
  StrategyPlan, 
  TeamAnnouncement,
  AppUser 
} from './types';
import { 
  INITIAL_MEMBERS, 
  INITIAL_SCRIMS, 
  INITIAL_PRESETS, 
  INITIAL_ANNOUNCEMENTS 
} from './data/initialData';
import { 
  authGetSession,
  authLogout,
  dbFetchMembers,
  dbSaveMember,
  dbDeleteMember,
  dbFetchScrims,
  dbSaveScrim,
  dbDeleteScrim,
  dbFetchStrategyPlans,
  dbSaveStrategyPlan,
  dbFetchAnnouncements,
  dbSaveAnnouncement
} from './services/supabase';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    return authGetSession();
  });
  const [currentRole, setCurrentRole] = useState<Role>(currentUser?.role || 'Dono');
  const [teamName] = useState<string>('Friba Esports');

  // Limpar dados mockados antigos do cache
  useEffect(() => {
    [
      'friba_team_members_v3', 
      'friba_team_scrims_v3', 
      'friba_team_presets_v3', 
      'friba_team_announcements_v3', 
      'friba_db_users_v1', 
      'friba_db_invites_v1',
      'friba_current_user_v1'
    ].forEach(k => localStorage.removeItem(k));
  }, []);

  // Estados com persistência local e sincronização Supabase
  const [members, setMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('friba_team_members_v4');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [scrims, setScrims] = useState<ScrimEvent[]>(() => {
    const saved = localStorage.getItem('friba_team_scrims_v4');
    return saved ? JSON.parse(saved) : INITIAL_SCRIMS;
  });

  const [presets, setPresets] = useState<StrategyPlan[]>(() => {
    const saved = localStorage.getItem('friba_team_presets_v4');
    return saved ? JSON.parse(saved) : INITIAL_PRESETS;
  });

  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>(() => {
    const saved = localStorage.getItem('friba_team_announcements_v4');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  // Modal de Aceitar Convite / Cadastro de Jogador
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || params.get('join') || params.get('invite');
    if (code) return true;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    return pathParts.length >= 2 && ['join', 'invite', 'convite'].includes(pathParts[0].toLowerCase());
  });

  const [inviteCodeFromUrl, setInviteCodeFromUrl] = useState(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    let code = params.get('code') || params.get('join') || params.get('invite');
    if (!code) {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2 && ['join', 'invite', 'convite'].includes(pathParts[0].toLowerCase())) {
        code = pathParts[1];
      }
    }
    return code ? code.toUpperCase().trim() : '';
  });

  // 1. Carregar dados de todas as tabelas do Supabase
  useEffect(() => {
    dbFetchMembers().then(data => { if (data && data.length) setMembers(data); });
    dbFetchScrims().then(data => { if (data && data.length) setScrims(data); });
    dbFetchStrategyPlans().then(data => { if (data && data.length) setPresets(data); });
    dbFetchAnnouncements().then(data => { if (data && data.length) setAnnouncements(data); });
  }, []);


  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('friba_auth_user_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('friba_auth_user_session');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('friba_team_members_v4', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('friba_team_scrims_v4', JSON.stringify(scrims));
  }, [scrims]);

  useEffect(() => {
    localStorage.setItem('friba_team_presets_v4', JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem('friba_team_announcements_v4', JSON.stringify(announcements));
  }, [announcements]);

  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair da sua conta?')) {
      await authLogout();
      setCurrentUser(null);
      setCurrentRole('Jogador');
      setActiveTab('dashboard');
    }
  };

  // Manipuladores assíncronos integrados ao Supabase
  const handleAddMember = async (newMember: TeamMember) => {
    setMembers(prev => [...prev, newMember]);
    await dbSaveMember(newMember);
  };

  const handleUpdateMember = async (updatedMember: TeamMember) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    await dbSaveMember(updatedMember);
  };

  const handleDeleteMember = async (id: string) => {
    if (window.confirm('Remover membro da equipe?')) {
      setMembers(prev => prev.filter(m => m.id !== id));
      await dbDeleteMember(id);
    }
  };

  const handleAddScrim = async (newScrim: ScrimEvent) => {
    setScrims(prev => [newScrim, ...prev]);
    await dbSaveScrim(newScrim);
  };

  const handleUpdateScrim = async (updatedScrim: ScrimEvent) => {
    setScrims(prev => prev.map(s => s.id === updatedScrim.id ? updatedScrim : s));
    await dbSaveScrim(updatedScrim);
  };

  const handleDeleteScrim = async (id: string) => {
    setScrims(prev => prev.filter(s => s.id !== id));
    await dbDeleteScrim(id);
  };

  const handleAddAnnouncement = async (newAnnouncement: TeamAnnouncement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    await dbSaveAnnouncement(newAnnouncement);
  };

  const handleSaveStrategy = async (newPlan: StrategyPlan) => {
    setPresets(prev => [newPlan, ...prev]);
    await dbSaveStrategyPlan(newPlan);
    showToast(`Tática "${newPlan.title}" salva com sucesso!`, 'success');
  };

  // Callback quando o jogador aceita o convite e conclui seu cadastro
  const handleInviteSuccess = (newMember: TeamMember, newUser: AppUser) => {
    setMembers(prev => {
      const exists = prev.some(m => m.id === newMember.id);
      return exists ? prev.map(m => m.id === newMember.id ? newMember : m) : [...prev, newMember];
    });
    setCurrentUser(newUser);
    setCurrentRole(newUser.role);
    // Redireciona imediatamente para a aba de equipe para o jogador ver seu card!
    setActiveTab('roster');
  };

  // Se o usuário não estiver autenticado, exibe a Página de Login
  if (!currentUser) {
    return (
      <div className="app-root">
        <ToastContainer />
        <div className="app-ambient-background" />
        <LoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setCurrentRole(user.role);
          }}
          onOpenInviteModal={(code) => {
            setInviteCodeFromUrl(code || '');
            setIsInviteModalOpen(true);
          }}
        />
        <AcceptInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          initialCode={inviteCodeFromUrl}
          onSuccess={handleInviteSuccess}
        />
      </div>
    );
  }

  return (
    <div className="app-root">
      <ToastContainer />
      {/* Camada de difração de luz acelerada por hardware no background */}
      <div className="app-ambient-background" />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        teamName={teamName}
        currentUser={currentUser}
        scrims={scrims}
        announcements={announcements}
        members={members}
        onLogout={handleLogout}
        onOpenInviteModal={() => {
          setInviteCodeFromUrl('');
          setIsInviteModalOpen(true);
        }}
      />

      <main className="app-main-content">
        <div key={activeTab} className="screen-fade-in">
          {activeTab === 'dashboard' && (
            <Dashboard
              currentRole={currentRole}
              currentUser={currentUser}
              members={members}
              scrims={scrims}
              announcements={announcements}
              onAddAnnouncement={handleAddAnnouncement}
              onAddScrim={handleAddScrim}
              onNavigate={setActiveTab}
              teamName={teamName}
            />
          )}

          {activeTab === 'roster' && (
            <RosterManagement
              currentRole={currentRole}
              currentUser={currentUser}
              members={members}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
            />
          )}

          {activeTab === 'draft' && (
            <DraftSimulator
              teamName={teamName}
            />
          )}

          {activeTab === 'tactical' && (
            <TacticalMap
              presets={presets}
              onSaveStrategy={handleSaveStrategy}
              members={members}
            />
          )}

          {activeTab === 'agenda' && (
            <ScrimAgenda
              currentRole={currentRole}
              currentUser={currentUser}
              members={members}
              scrims={scrims}
              onAddScrim={handleAddScrim}
              onUpdateScrim={handleUpdateScrim}
              onDeleteScrim={handleDeleteScrim}
              teamName={teamName}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePage
              currentUser={currentUser}
              onUpdateCurrentUser={(updatedUser) => {
                setCurrentUser(updatedUser);
                setCurrentRole(updatedUser.role);
              }}
              members={members}
              onUpdateMember={handleUpdateMember}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'settings' && (
            <TeamSettings
              currentRole={currentRole}
              currentUser={currentUser}
              teamName={teamName}
              onRoleChanged={(newRole) => {
                setCurrentRole(newRole);
                setCurrentUser(prev => prev ? ({ ...prev, role: newRole, isOwner: newRole === 'Dono' }) : null);
              }}
            />
          )}
        </div>
      </main>

      {/* Modal de Aceite de Convite e Cadastro Oficial do Jogador */}
      <AcceptInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        initialCode={inviteCodeFromUrl}
        onSuccess={handleInviteSuccess}
      />

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-status-pill">
              <ShieldCheck size={12} color="#10B981" />
              <span>Sincronizado</span>
            </div>
            <span className="footer-copy">FRIBA ESPORTS • Pokémon Unite</span>
          </div>

          <div className="footer-right">
            <span className="footer-gofriba">#GOFRIBA</span>
          </div>
        </div>
      </footer>

      <style>{`
        .app-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-main-content {
          flex: 1;
          padding-bottom: 110px;
        }

        .app-footer {
          margin-top: auto;
          height: 38px;
          min-height: 38px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          background: rgba(6, 10, 18, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          z-index: 10;
        }

        .footer-content {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          color: #6EE7B7;
          background: rgba(16, 185, 129, 0.1);
          padding: 2px 7px;
          border-radius: 9999px;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .footer-copy {
          font-size: 0.75rem;
          color: var(--text-dim);
        }

        .footer-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-link-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.74rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
        }

        .footer-link-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.08);
        }

        .reset-btn:hover {
          color: #F87171;
        }
      `}</style>
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { RosterManagement } from './components/Roster/RosterManagement';
import { DraftSimulator } from './components/Draft/DraftSimulator';
import { TacticalMap } from './components/TacticalMap/TacticalMap';
import { ScrimAgenda } from './components/Agenda/ScrimAgenda';
import type { 
  Role, 
  TeamMember, 
  ScrimEvent, 
  StrategyPlan,
  TeamAnnouncement 
} from './types';
import { 
  INITIAL_MEMBERS, 
  INITIAL_SCRIMS, 
  INITIAL_PRESETS,
  INITIAL_ANNOUNCEMENTS 
} from './data/initialData';
import { ShieldCheck } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<Role>('Dono');
  const [teamName] = useState<string>('Friba Esports');

  // Estados com persistência local
  const [members, setMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('friba_team_members_v3');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [scrims, setScrims] = useState<ScrimEvent[]>(() => {
    const saved = localStorage.getItem('friba_team_scrims_v3');
    return saved ? JSON.parse(saved) : INITIAL_SCRIMS;
  });

  const [presets, setPresets] = useState<StrategyPlan[]>(() => {
    const saved = localStorage.getItem('friba_team_presets_v3');
    return saved ? JSON.parse(saved) : INITIAL_PRESETS;
  });

  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>(() => {
    const saved = localStorage.getItem('friba_team_announcements_v3');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  useEffect(() => {
    localStorage.setItem('friba_team_members_v3', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('friba_team_scrims_v3', JSON.stringify(scrims));
  }, [scrims]);

  useEffect(() => {
    localStorage.setItem('friba_team_presets_v3', JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem('friba_team_announcements_v3', JSON.stringify(announcements));
  }, [announcements]);

  const handleAddMember = (newMember: TeamMember) => {
    setMembers(prev => [...prev, newMember]);
  };

  const handleUpdateMember = (updatedMember: TeamMember) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('Remover membro da equipe?')) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleAddScrim = (newScrim: ScrimEvent) => {
    setScrims(prev => [newScrim, ...prev]);
  };

  const handleUpdateScrim = (updatedScrim: ScrimEvent) => {
    setScrims(prev => prev.map(s => s.id === updatedScrim.id ? updatedScrim : s));
  };

  const handleDeleteScrim = (id: string) => {
    setScrims(prev => prev.filter(s => s.id !== id));
  };

  const handleAddAnnouncement = (newAnnouncement: TeamAnnouncement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const handleSaveStrategy = (newPlan: StrategyPlan) => {
    setPresets(prev => [newPlan, ...prev]);
    alert(`Tática "${newPlan.title}" salva com sucesso!`);
  };

  return (
    <div className="app-root">
      {/* Camada de difração de luz acelerada por hardware no background */}
      <div className="app-ambient-background" />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        teamName={teamName}
      />

      <main className="app-main-content">
        <div key={activeTab} className="screen-fade-in">
          {activeTab === 'dashboard' && (
            <Dashboard
              currentRole={currentRole}
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
            />
          )}

          {activeTab === 'agenda' && (
            <ScrimAgenda
              currentRole={currentRole}
              scrims={scrims}
              onAddScrim={handleAddScrim}
              onUpdateScrim={handleUpdateScrim}
              onDeleteScrim={handleDeleteScrim}
              teamName={teamName}
            />
          )}
        </div>
      </main>

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

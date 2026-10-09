import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Swords, Plus, Trash2, Edit2, X, Users, Check, Shield, MessageSquare, Tag } from 'lucide-react';
import type { OpponentTeam } from '../../types';

interface OpponentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponentTeams: OpponentTeam[];
  onSaveTeam: (team: OpponentTeam) => void;
  onDeleteTeam: (id: string) => void;
}

export const OpponentsModal: React.FC<OpponentsModalProps> = ({
  isOpen,
  onClose,
  opponentTeams,
  onSaveTeam,
  onDeleteTeam,
}) => {
  const [editingTeam, setEditingTeam] = useState<OpponentTeam | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [playerInput, setPlayerInput] = useState('');
  const [playersList, setPlayersList] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingTeam(null);
    setName('');
    setTag('');
    setContact('');
    setNotes('');
    setPlayersList([]);
    setPlayerInput('');
    setIsCreating(true);
  };

  const handleStartEdit = (team: OpponentTeam) => {
    setEditingTeam(team);
    setName(team.name);
    setTag(team.tag);
    setContact(team.contact || '');
    setNotes(team.notes || '');
    setPlayersList([...team.players]);
    setPlayerInput('');
    setIsCreating(true);
  };

  const handleAddPlayer = () => {
    const trimmed = playerInput.trim();
    if (!trimmed) return;
    if (playersList.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      setPlayerInput('');
      return;
    }
    setPlayersList(prev => [...prev, trimmed]);
    setPlayerInput('');
  };

  const handleRemovePlayer = (idxToRemove: number) => {
    setPlayersList(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tag.trim()) return;

    const teamToSave: OpponentTeam = {
      id: editingTeam ? editingTeam.id : `opp-${Date.now()}`,
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      contact: contact.trim() || undefined,
      notes: notes.trim() || undefined,
      players: playersList.length > 0 ? playersList : ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5'],
      createdAt: editingTeam?.createdAt || new Date().toISOString(),
    };

    onSaveTeam(teamToSave);
    setIsCreating(false);
    setEditingTeam(null);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content opponents-modal-panel modal-large" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="opponents-title-group">
            <div className="opponents-icon-badge">
              <Swords size={20} className="text-blue" />
            </div>
            <div>
              <h3>Equipes Oponentes & Rivais</h3>
              <span className="modal-sub-tag">Cadastre lineups adversárias para preenchimento ágil de scrims e estatísticas</span>
            </div>
          </div>
          <button onClick={onClose} className="close-btn" title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="opponents-body">
          {isCreating ? (
            /* Formulário de Criação/Edição */
            <form onSubmit={handleSave} className="opponent-form">
              <div className="opp-form-header">
                <h4>{editingTeam ? `Editar Equipe: ${editingTeam.name}` : 'Cadastrar Nova Equipe Adversária'}</h4>
                <button 
                  type="button" 
                  className="btn-cancel-mini"
                  onClick={() => { setIsCreating(false); setEditingTeam(null); }}
                >
                  Voltar à lista
                </button>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label><Shield size={13} /> Nome da Equipe *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nightmare, LOUD, paiN Gaming"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label><Tag size={13} /> TAG da Equipe (Sigla) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Ex: NM, LOU, PNG"
                    value={tag}
                    onChange={(e) => setTag(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="form-group">
                <label><MessageSquare size={13} /> Contato do Organizador / Manager (Discord / WhatsApp)</label>
                <input
                  type="text"
                  placeholder="Ex: Discord: @manager_tag ou (11) 99999-9999"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              {/* Gerenciamento de Jogadores da Lineup Adversária */}
              <div className="players-manager-section">
                <div className="players-manager-head">
                  <label><Users size={14} /> Atletas da Lineup Adversária ({playersList.length})</label>
                  <span className="hint-text">Estes atletas serão carregados automaticamente no relatório de estatísticas</span>
                </div>

                <div className="add-player-row">
                  <input
                    type="text"
                    placeholder="Digite o nick do atleta adversário (Ex: Bryan) e pressione Adicionar"
                    value={playerInput}
                    onChange={(e) => setPlayerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPlayer();
                      }
                    }}
                  />
                  <button type="button" className="btn-add-p-chip" onClick={handleAddPlayer}>
                    <Plus size={14} /> Adicionar Atleta
                  </button>
                </div>

                {/* Chips de Jogadores */}
                <div className="players-chips-container">
                  {playersList.length === 0 ? (
                    <span className="no-players-hint">Nenhum jogador adicionado ainda. (Se vazio, 5 slots padrão serão gerados).</span>
                  ) : (
                    playersList.map((pName, idx) => (
                      <div key={idx} className="player-chip">
                        <span className="chip-tag">{tag || 'OPP'}</span>
                        <span className="chip-name">{pName}</span>
                        <button
                          type="button"
                          className="chip-remove-btn"
                          onClick={() => handleRemovePlayer(idx)}
                          title="Remover atleta"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Notas Técnicas / Observações da Equipe</label>
                <textarea
                  rows={2}
                  placeholder="Estilo de jogo, rotas preferidas, pontos de atenção..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setIsCreating(false); setEditingTeam(null); }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={14} /> {editingTeam ? 'Salvar Alterações' : 'Cadastrar Equipe'}
                </button>
              </div>
            </form>
          ) : (
            /* Lista de Equipes Cadastradas */
            <div className="opponents-list-view">
              <div className="list-top-actions">
                <span className="list-count-badge">
                  <strong>{opponentTeams.length}</strong> {opponentTeams.length === 1 ? 'Equipe cadastrada' : 'Equipes cadastradas'}
                </span>
                <button className="btn-create-opp-team" onClick={handleStartCreate}>
                  <Plus size={15} /> Cadastrar Nova Equipe
                </button>
              </div>

              {opponentTeams.length === 0 ? (
                <div className="empty-opponents-box">
                  <Swords size={36} className="text-muted opacity-40" />
                  <h4>Nenhuma equipe adversária cadastrada ainda</h4>
                  <p>Cadastre os times rivais com suas lineups para puxar automaticamente na agenda e preencher os dados de partidas.</p>
                  <button className="btn-primary" onClick={handleStartCreate}>
                    <Plus size={14} /> Cadastrar Primeira Equipe
                  </button>
                </div>
              ) : (
                <div className="opponents-cards-grid">
                  {opponentTeams.map((team) => (
                    <div key={team.id} className="opponent-card">
                      <div className="opp-card-top">
                        <div className="opp-card-badge">
                          <span className="opp-tag-pill">{team.tag}</span>
                          <h4 className="opp-team-name">{team.name}</h4>
                        </div>
                        <div className="opp-card-actions">
                          <button 
                            className="opp-btn-action edit"
                            onClick={() => handleStartEdit(team)}
                            title="Editar equipe"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            className="opp-btn-action delete"
                            onClick={() => {
                              if (window.confirm(`Deseja remover a equipe "${team.name}" dos oponentes?`)) {
                                onDeleteTeam(team.id);
                              }
                            }}
                            title="Excluir equipe"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {team.contact && (
                        <div className="opp-card-contact">
                          <MessageSquare size={13} className="text-dim" />
                          <span>{team.contact}</span>
                        </div>
                      )}

                      {/* Lista de Atletas */}
                      <div className="opp-card-players">
                        <span className="players-sub-lbl">Lineup Oficial ({team.players.length} atletas):</span>
                        <div className="opp-players-pills">
                          {team.players.map((p, idx) => (
                            <span key={idx} className="opp-player-pill">
                              {team.tag} · {p}
                            </span>
                          ))}
                        </div>
                      </div>

                      {team.notes && (
                        <p className="opp-card-notes">"{team.notes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .opponents-modal-panel {
          max-width: 780px;
          background: #0B111F;
          border: 1px solid rgba(11, 95, 255, 0.45);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85);
          border-radius: 16px;
        }

        .opponents-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .opponents-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(11, 95, 255, 0.15);
          border: 1px solid rgba(11, 95, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .opponents-body {
          padding: 16px 20px 24px;
        }

        .list-top-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .list-count-badge {
          font-size: 0.82rem;
          color: #94A3B8;
        }

        .btn-create-opp-team {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #0B5FFF 0%, #0047D6 100%);
          color: #FFFFFF;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-create-opp-team:hover {
          box-shadow: 0 0 16px rgba(11, 95, 255, 0.5);
          transform: translateY(-1px);
        }

        .opponents-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 14px;
          max-height: 520px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .opponent-card {
          background: rgba(14, 22, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.2s;
        }

        .opponent-card:hover {
          border-color: rgba(11, 95, 255, 0.4);
          background: rgba(18, 28, 54, 0.85);
          transform: translateY(-1px);
        }

        .opp-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .opp-card-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .opp-tag-pill {
          background: rgba(11, 95, 255, 0.25);
          border: 1px solid rgba(11, 95, 255, 0.45);
          color: #93C5FD;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        .opp-team-name {
          font-size: 0.96rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
        }

        .opp-card-actions {
          display: flex;
          gap: 6px;
        }

        .opp-btn-action {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94A3B8;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .opp-btn-action.edit:hover {
          background: rgba(56, 189, 248, 0.2);
          color: #38BDF8;
          border-color: #38BDF8;
        }

        .opp-btn-action.delete:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #F87171;
          border-color: #EF4444;
        }

        .opp-card-contact {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          color: #CBD5E1;
        }

        .opp-card-players {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .players-sub-lbl {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #94A3B8;
          letter-spacing: 0.04em;
        }

        .opp-players-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .opp-player-pill {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #E2E8F0;
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .opp-card-notes {
          font-size: 0.72rem;
          color: #94A3B8;
          font-style: italic;
          margin: 0;
        }

        .empty-opponents-box {
          padding: 48px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .empty-opponents-box h4 {
          font-size: 1.05rem;
          color: #FFFFFF;
          margin: 0;
        }

        .empty-opponents-box p {
          font-size: 0.82rem;
          color: #94A3B8;
          max-width: 440px;
          margin: 0;
        }

        /* Form Sub-seção */
        .opponent-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .opp-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 10px;
        }

        .opp-form-header h4 {
          font-size: 0.98rem;
          color: #FFFFFF;
          margin: 0;
        }

        .btn-cancel-mini {
          background: none;
          border: none;
          color: #38BDF8;
          font-size: 0.78rem;
          cursor: pointer;
        }

        .players-manager-section {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .players-manager-head {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .players-manager-head label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #F8FAFC;
        }

        .hint-text {
          font-size: 0.68rem;
          color: #94A3B8;
        }

        .add-player-row {
          display: flex;
          gap: 8px;
        }

        .add-player-row input {
          flex: 1;
        }

        .btn-add-p-chip {
          background: rgba(11, 95, 255, 0.15);
          border: 1px solid rgba(11, 95, 255, 0.35);
          color: #93C5FD;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 8px 14px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .btn-add-p-chip:hover {
          background: #0B5FFF;
          color: #FFFFFF;
        }

        .players-chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          min-height: 40px;
          padding: 6px 0;
        }

        .no-players-hint {
          font-size: 0.74rem;
          color: #64748B;
          font-style: italic;
        }

        .player-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 8px;
          padding: 4px 8px;
          font-size: 0.78rem;
        }

        .chip-tag {
          font-size: 0.64rem;
          font-weight: 800;
          color: #93C5FD;
        }

        .chip-name {
          color: #FFFFFF;
          font-weight: 600;
        }

        .chip-remove-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
        }

        .chip-remove-btn:hover {
          color: #EF4444;
        }
      `}</style>
    </div>,
    document.body
  );
};

import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Search, 
  Swords, 
  ClipboardList, 
  Crown, 
  Edit3, 
  Trash2, 
  X, 
  Check,
  GripHorizontal,
  Shield,
  Layers,
  Copy,
  Send,
  Sparkles
} from 'lucide-react';
import type { Role, TeamMember, Lane, PokemonRole, AppUser } from '../../types';
import { POKEMON_ROSTER } from '../../data/pokemonData';
import { dbCreateInvite } from '../../services/supabase';
import { showToast } from '../UI/Toast';

interface RosterManagementProps {
  currentRole: Role;
  currentUser?: AppUser | null;
  members: TeamMember[];
  onAddMember: (member: TeamMember) => void;
  onUpdateMember: (member: TeamMember) => void;
  onDeleteMember: (id: string) => void;
}

export const RosterManagement: React.FC<RosterManagementProps> = ({
  currentRole,
  currentUser,
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Estados do Modal de Convidar Membro
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('Jogador');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<{ code: string; link: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    nickname: '',
    tag: '',
    role: 'Jogador',
    avatar: '',
    discord: '',
    inGameId: '',
    gameRole: 'All-Rounder',
    preferredLane: 'Jungle',
    status: 'Titular',
    mainPokemon: ['ceruledge'],
    coachNotes: ''
  });

  const canEdit = currentRole === 'Dono' || currentRole === 'Manager';

  // Filtragem otimizada com useMemo
  const { starters, reserves, staff } = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = members.filter(m => {
      if (!term) return true;
      return (
        m.name.toLowerCase().includes(term) ||
        m.nickname.toLowerCase().includes(term) ||
        (m.tag && m.tag.toLowerCase().includes(term)) ||
        (m.inGameId && m.inGameId.toLowerCase().includes(term)) ||
        (m.discord && m.discord.toLowerCase().includes(term))
      );
    });

    return {
      starters: filtered.filter(m => m.role === 'Jogador' && m.status !== 'Reserva'),
      reserves: filtered.filter(m => m.role === 'Jogador' && m.status === 'Reserva'),
      staff: filtered.filter(m => m.role !== 'Jogador')
    };
  }, [members, search]);

  const handleCreateInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsCreatingInvite(true);
    try {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `FRB-${randomSuffix}`;

      await dbCreateInvite({
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        role: inviteRole,
        status: 'Pendente',
        invitedBy: currentUser?.id || 'dono',
        invitedByName: currentUser?.name ? `${currentUser.nickname || currentUser.name} (${currentUser.role})` : 'Dono da Equipe',
        inviteCode: code,
      });

      const inviteLink = `${window.location.origin}?code=${code}`;
      setGeneratedInvite({ code, link: inviteLink });
      setInviteEmail('');
      setInviteName('');
      showToast('Convite oficial gerado com sucesso!', 'success');
    } catch (err: any) {
      showToast(`Erro ao gerar convite: ${err.message || 'Tente novamente.'}`, 'error');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInvite) return;
    navigator.clipboard.writeText(generatedInvite.link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!generatedInvite) return;
    navigator.clipboard.writeText(generatedInvite.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleOpenEdit = (m: TeamMember) => {
    setSelectedMember(m);
    setFormData({ ...m });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const nickname = formData.nickname || formData.name.split(' ')[0];
    const initial = formData.name.charAt(0).toUpperCase();

    if (selectedMember) {
      onUpdateMember({
        ...selectedMember,
        ...formData,
        nickname
      } as TeamMember);
    } else {
      onAddMember({
        ...formData,
        id: `player-${Date.now()}`,
        nickname,
        avatar: formData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${initial}&backgroundColor=d61f26&textColor=ffffff`
      } as TeamMember);
    }
    setIsModalOpen(false);
  };

  const getPokemonInfo = (id?: string) => {
    if (!id) return null;
    const clean = id.toLowerCase().trim();
    return POKEMON_ROSTER.find(p => 
      p.id.toLowerCase() === clean || 
      p.name.toLowerCase() === clean || 
      p.rawName?.toLowerCase() === clean
    );
  };

  // Helper para obter cor de fundo do box do Pokémon por Battle Type / Role
  const getPokemonBg = (pokeName?: string, role?: PokemonRole) => {
    if (role === 'All-Rounder') return 'rgba(147, 51, 234, 0.25)';
    if (role === 'Speedster') return 'rgba(2, 132, 199, 0.25)';
    if (role === 'Attacker') return 'rgba(249, 115, 22, 0.25)';
    if (role === 'Supporter') return 'rgba(234, 179, 8, 0.25)';
    if (role === 'Defender') return 'rgba(16, 185, 129, 0.25)';

    const name = pokeName?.toLowerCase() || '';
    if (name.includes('ceruledge')) return 'rgba(147, 51, 234, 0.25)';
    if (name.includes('alcremie') || name.includes('clefable')) return 'rgba(234, 179, 8, 0.25)';
    if (name.includes('snorlax') || name.includes('mamoswine')) return 'rgba(16, 185, 129, 0.25)';
    if (name.includes('mew')) return 'rgba(249, 115, 22, 0.25)';
    return 'rgba(255, 255, 255, 0.05)';
  };

  return (
    <div className="roster-view-container">
      {/* Top Controls Bar */}
      <div className="roster-header-bar">
        <div className="roster-titles">
          <h1>Equipe & Roster Friba</h1>
          <p>Lineup oficial para Pokémon Unite Aeos Cup e campeonatos competitivos</p>
        </div>

        <div className="roster-actions">
          <div className="roster-search-box">
            <Search size={15} className="search-icon" />
            <input 
              type="text"
              placeholder="Buscar jogador, tag, discord, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch('')}>
                <X size={13} />
              </button>
            )}
          </div>

          {canEdit && (
            <button 
              type="button"
              className="add-member-btn" 
              onClick={() => {
                setGeneratedInvite(null);
                setIsInviteModalOpen(true);
              }}
              title="Gerar convite oficial para novo membro se juntar à equipe"
            >
              <UserPlus size={15} /> Convidar Membro
            </button>
          )}
        </div>
      </div>

      {/* SEÇÃO 1: TITULARES */}
      <div className="roster-section">
        <div className="section-title-row">
          <div className="section-icon-box swords-icon">
            <Swords size={18} />
          </div>
          <div className="section-headings">
            <h2>Titulares</h2>
            <span className="section-sub">FIVE FOR THE AEOS CUP</span>
          </div>
          <div className="section-divider-line" />
          <div className="section-count-badge">{starters.length}</div>
        </div>

        {starters.length === 0 ? (
          <div className="empty-roster-state">
            <Swords size={28} color="rgba(255, 255, 255, 0.25)" />
            <p className="empty-roster-text">Nenhum jogador titular cadastrado ainda.</p>
            <span className="empty-roster-sub">
              Os jogadores aparecerão aqui automaticamente após aceitarem o convite da equipe e preencherem suas informações.
            </span>
          </div>
        ) : (
          <div className="roster-cards-grid">
            {starters.map((member) => {
              const displayName = member.name || member.nickname;
              const displayNick = member.nickname || member.name;
              const initial = displayName ? displayName.charAt(0).toUpperCase() : 'F';
              const mainPokeId = member.mainPokemon?.[0];
              const mainPoke = getPokemonInfo(mainPokeId);
              const pokeBg = getPokemonBg(mainPoke?.name || mainPokeId, mainPoke?.role);

            return (
              <div key={member.id} className="player-card">
                {/* Header do Card */}
                <div className="card-top-row">
                  {member.avatar ? (
                    <img 
                      src={member.avatar} 
                      alt={displayName} 
                      className="avatar-initial-box avatar-img-box"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="avatar-initial-box">
                      {initial}
                    </div>
                  )}
                  <div className="player-meta">
                    <h3 className="player-name">{displayName}</h3>
                    <div className="player-tag">@{displayNick}</div>
                  </div>

                  <div className="card-options-area">
                    {canEdit ? (
                      <div className="card-hover-actions">
                        <button 
                          className="action-icon-btn edit" 
                          title="Editar" 
                          onClick={() => handleOpenEdit(member)}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          className="action-icon-btn del" 
                          title="Remover" 
                          onClick={() => onDeleteMember(member.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <GripHorizontal size={14} className="drag-icon-muted" />
                    )}
                  </div>
                </div>

                {/* Badges de Função e Rota */}
                <div className="badges-row">
                  <span className="pill-badge titular">JOGADOR TITULAR</span>
                  <span className="pill-badge lane">
                    {(member.preferredLane || 'TOP').toUpperCase()}
                  </span>
                </div>

                {/* Box do Pokémon Main */}
                <div className="main-pokemon-box">
                  <div className="pokemon-sprite-wrapper" style={{ background: pokeBg }}>
                    {mainPoke ? (
                      <img 
                        src={mainPoke.sprite} 
                        alt={mainPoke.name} 
                        className="pokemon-sprite-img" 
                      />
                    ) : (
                      <Shield size={20} color="#94A3B8" />
                    )}
                  </div>
                  <div className="pokemon-info-text">
                    <span className="main-label">MAIN</span>
                    <span className="main-pokemon-name">{mainPoke?.name || mainPokeId || 'Ceruledge'}</span>
                  </div>
                </div>

                {/* Rodapé com Discord e ID do Jogo */}
                <div className="card-footer-info">
                  <div className="info-line">
                    <span className="info-label">Discord:</span>
                    <span className="info-value">{member.discord || '-'}</span>
                  </div>
                  <div className="info-line">
                    <span className="info-label">ID no jogo:</span>
                    <span className="info-value id-code">{member.inGameId || '-'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* SEÇÃO 2: RESERVAS */}
      <div className="roster-section">
        <div className="section-title-row">
          <div className="section-icon-box clipboard-icon">
            <ClipboardList size={18} />
          </div>
          <div className="section-headings">
            <h2>Reservas</h2>
            <span className="section-sub">BACKUP SQUAD</span>
          </div>
          <div className="section-divider-line" />
          <div className="section-count-badge">{reserves.length}</div>
        </div>

        {reserves.length === 0 ? (
          <div className="empty-roster-state">
            <ClipboardList size={28} color="rgba(255, 255, 255, 0.25)" />
            <p className="empty-roster-text">Nenhum jogador reserva cadastrado no momento.</p>
            <span className="empty-roster-sub">
              Jogadores que forem cadastrados na equipe com status reserva serão exibidos aqui.
            </span>
          </div>
        ) : (
          <div className="roster-cards-grid">
            {reserves.map((member) => {
              const displayName = member.name || member.nickname;
              const displayNick = member.nickname || member.name;
              const initial = displayName ? displayName.charAt(0).toUpperCase() : 'M';
              const mainPokeId = member.mainPokemon?.[0];
              const mainPoke = getPokemonInfo(mainPokeId);
              const pokeBg = getPokemonBg(mainPoke?.name || mainPokeId, mainPoke?.role);

            return (
              <div key={member.id} className="player-card">
                {/* Header do Card */}
                <div className="card-top-row">
                  {member.avatar ? (
                    <img 
                      src={member.avatar} 
                      alt={displayName} 
                      className="avatar-initial-box avatar-img-box"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="avatar-initial-box">
                      {initial}
                    </div>
                  )}
                  <div className="player-meta">
                    <h3 className="player-name">{displayName}</h3>
                    <div className="player-tag">@{displayNick}</div>
                  </div>

                  <div className="card-options-area">
                    {canEdit ? (
                      <div className="card-hover-actions">
                        <button 
                          className="action-icon-btn edit" 
                          title="Editar" 
                          onClick={() => handleOpenEdit(member)}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          className="action-icon-btn del" 
                          title="Remover" 
                          onClick={() => onDeleteMember(member.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <GripHorizontal size={14} className="drag-icon-muted" />
                    )}
                  </div>
                </div>

                {/* Badges de Função e Rota */}
                <div className="badges-row">
                  <span className="pill-badge reserva">RESERVA</span>
                  <span className="pill-badge lane">
                    {(member.preferredLane || 'MID').toUpperCase()}
                  </span>
                </div>

                {/* Box do Pokémon Main */}
                <div className="main-pokemon-box">
                  <div className="pokemon-sprite-wrapper" style={{ background: pokeBg }}>
                    {mainPoke ? (
                      <img 
                        src={mainPoke.sprite} 
                        alt={mainPoke.name} 
                        className="pokemon-sprite-img" 
                      />
                    ) : (
                      <Shield size={20} color="#94A3B8" />
                    )}
                  </div>
                  <div className="pokemon-info-text">
                    <span className="main-label">MAIN</span>
                    <span className="main-pokemon-name">{mainPoke?.name || mainPokeId || 'Clefable'}</span>
                  </div>
                </div>

                {/* Rodapé com Discord e ID do Jogo */}
                <div className="card-footer-info">
                  <div className="info-line">
                    <span className="info-label">Discord:</span>
                    <span className="info-value">{member.discord || '-'}</span>
                  </div>
                  {member.inGameId ? (
                    <div className="info-line">
                      <span className="info-label">ID no jogo:</span>
                      <span className="info-value id-code">{member.inGameId}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* SEÇÃO 3: COMISSÃO TÉCNICA & GESTÃO */}
      {staff.length > 0 && (
        <div className="roster-section staff-section">
          <div className="section-title-row">
            <div className="section-icon-box crown-icon">
              <Crown size={18} />
            </div>
            <div className="section-headings">
              <h2>Comissão & Gestão</h2>
              <span className="section-sub">MANAGEMENT & COACHING</span>
            </div>
            <div className="section-divider-line" />
            <div className="section-count-badge">{staff.length}</div>
          </div>

          <div className="roster-cards-grid">
            {staff.map((member) => {
              const displayName = member.name || member.nickname;
              const displayNick = member.nickname || member.name;
              const initial = displayName ? displayName.charAt(0).toUpperCase() : 'S';

              return (
                <div key={member.id} className="player-card staff-card">
                  <div className="card-top-row">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt={displayName} 
                        className="avatar-initial-box avatar-img-box staff-initial"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="avatar-initial-box staff-initial">
                        {initial}
                      </div>
                    )}
                    <div className="player-meta">
                      <h3 className="player-name">{displayName}</h3>
                      <div className="player-tag">@{displayNick}</div>
                    </div>

                    <div className="card-options-area">
                      {canEdit && (
                        <div className="card-hover-actions">
                          <button 
                            className="action-icon-btn edit" 
                            title="Editar" 
                            onClick={() => handleOpenEdit(member)}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button 
                            className="action-icon-btn del" 
                            title="Remover" 
                            onClick={() => onDeleteMember(member.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="badges-row">
                    <span className="pill-badge staff-role">{member.role.toUpperCase()}</span>
                    <span className="pill-badge lane">
                      {member.specialtyOrTitle?.toUpperCase() || 'DIRETORIA'}
                    </span>
                  </div>

                  <div className="card-footer-info" style={{ marginTop: '16px' }}>
                    <div className="info-line">
                      <span className="info-label">Discord:</span>
                      <span className="info-value">{member.discord || '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL CONVIDAR MEMBRO */}
      {isInviteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
          <div className="modal-content modal-custom-roster" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="m-title-icon">
                <Send size={18} color="#0B5FFF" />
                <h3>Convidar Novo Membro</h3>
              </div>
              <button onClick={() => setIsInviteModalOpen(false)} className="close-btn">
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '8px' }}>
              Envie um convite oficial. Ao aceitar o convite, o integrante preencherá suas informações competitivas (Nickname, UID, Pokémon favorito, Lane) e aparecerá automaticamente no Roster.
            </p>

            {!generatedInvite ? (
              <form onSubmit={handleCreateInviteSubmit} className="custom-roster-form">
                <div className="form-group">
                  <label>E-mail do Membro *</label>
                  <input
                    type="email"
                    required
                    placeholder="ex: jogador@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Nome / Identificação (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Matheus Lima"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cargo Atribuído</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as Role)}
                    >
                      <option value="Jogador">Jogador</option>
                      <option value="Coach">Coach</option>
                      <option value="Manager">Manager</option>
                      <option value="Dono">Dono</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="cancel-btn"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingInvite}
                    className="save-btn"
                    style={{
                      background: 'linear-gradient(135deg, #0B5FFF 0%, #D61F26 100%)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 700,
                      padding: '10px 20px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Send size={15} />
                    {isCreatingInvite ? 'Gerando...' : 'Gerar Convite'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '14px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Sparkles size={20} color="#10B981" />
                  <div>
                    <h4 style={{ color: '#6EE7B7', fontSize: '0.88rem', margin: 0 }}>Convite gerado com sucesso!</h4>
                    <span style={{ color: '#A7F3D0', fontSize: '0.75rem' }}>
                      Envie o link ou código abaixo para o membro completar seu cadastro oficial.
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Link Direto de Cadastro</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      readOnly
                      value={generatedInvite.link}
                      style={{ flex: 1, background: 'rgba(0,0,0,0.3)', color: '#38BDF8', fontSize: '0.82rem' }}
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      style={{
                        background: copiedLink ? '#10B981' : '#0B5FFF',
                        border: 'none',
                        color: 'white',
                        padding: '0 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      {copiedLink ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Código do Convite</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      readOnly
                      value={generatedInvite.code}
                      style={{ flex: 1, background: 'rgba(0,0,0,0.3)', color: '#F59E0B', fontWeight: 700, letterSpacing: '1px' }}
                    />
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      style={{
                        background: copiedCode ? '#10B981' : 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '0 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      {copiedCode ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedInvite(null);
                      setIsInviteModalOpen(false);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    Concluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneratedInvite(null)}
                    style={{
                      background: '#0B5FFF',
                      border: 'none',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                  >
                    Criar Outro Convite
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR / EDITAR MEMBRO */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content modal-custom-roster" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="m-title-icon">
                <Layers size={18} color="#0B5FFF" />
                <h3>{selectedMember ? 'Editar Integrante' : 'Adicionar ao Roster'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="custom-roster-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kauan Constancio"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Nickname / Gamertag *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nkyy!"
                    value={formData.nickname || ''}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Cargo Organizacional</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  >
                    <option value="Jogador">Jogador</option>
                    <option value="Coach">Coach</option>
                    <option value="Manager">Manager</option>
                    <option value="Dono">Dono</option>
                  </select>
                </div>

                {formData.role === 'Jogador' ? (
                  <div className="form-group">
                    <label>Situação na Lineup</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Titular' | 'Reserva' })}
                    >
                      <option value="Titular">Titular (Five for Aeos Cup)</option>
                      <option value="Reserva">Reserva (Backup Squad)</option>
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Função / Especialidade</label>
                    <input
                      type="text"
                      placeholder="Ex: Head Coach, CEO, Scrims"
                      value={formData.specialtyOrTitle || ''}
                      onChange={(e) => setFormData({ ...formData, specialtyOrTitle: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {formData.role === 'Jogador' && (
                <>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Rota (Lane)</label>
                      <select
                        value={formData.preferredLane}
                        onChange={(e) => setFormData({ ...formData, preferredLane: e.target.value as Lane })}
                      >
                        <option value="Jungle">Jungle</option>
                        <option value="Support">Support</option>
                        <option value="Bot Lane">Bot Lane</option>
                        <option value="Top Lane">Top Lane</option>
                        <option value="Mid">Mid</option>
                        <option value="Flex">Flex</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Pokémon Main</label>
                      <select
                        value={formData.mainPokemon?.[0] || 'ceruledge'}
                        onChange={(e) => setFormData({ ...formData, mainPokemon: [e.target.value] })}
                      >
                        {POKEMON_ROSTER.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="form-row-2">
                <div className="form-group">
                  <label>Discord</label>
                  <input
                    type="text"
                    placeholder="Ex: @_nkyyy"
                    value={formData.discord || ''}
                    onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>ID no Jogo (Pokémon Unite)</label>
                  <input
                    type="text"
                    placeholder="Ex: MMRYMA5"
                    value={formData.inGameId || ''}
                    onChange={(e) => setFormData({ ...formData, inGameId: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={15} /> {selectedMember ? 'Salvar Alterações' : 'Adicionar ao Elenco'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESTILOS FIÉIS À REFERÊNCIA DO USUÁRIO */}
      <style>{`
        .roster-view-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 20px 48px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .roster-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding-bottom: 8px;
        }

        .roster-titles h1 {
          font-size: 1.55rem;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.02em;
          margin: 0 0 4px;
        }

        .roster-titles p {
          font-size: 0.84rem;
          color: #94A3B8;
          margin: 0;
        }

        .roster-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .roster-search-box {
          position: relative;
          min-width: 260px;
        }

        .roster-search-box .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748B;
        }

        .roster-search-box input {
          width: 100%;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 8px 32px 8px 36px;
          color: #FFFFFF;
          font-size: 0.82rem;
          outline: none;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25), 0 2px 10px rgba(0, 0, 0, 0.2);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .roster-search-box input:focus {
          border-color: rgba(56, 189, 248, 0.5);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.25);
        }

        .roster-search-box .clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
        }

        .add-member-btn {
          background: linear-gradient(180deg, #1d68ff 0%, #0b5fff 100%);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 9999px;
          padding: 8px 18px;
          font-size: 0.82rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(11, 95, 255, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease;
        }

        .add-member-btn:hover {
          background: linear-gradient(180deg, #2b74ff 0%, #1565ff 100%);
          box-shadow: 0 6px 22px rgba(11, 95, 255, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.4);
          transform: translateY(-1px);
        }

        /* Seção do Roster */
        .roster-section {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .section-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15);
        }

        .section-icon-box.swords-icon {
          color: #38BDF8;
          border-color: rgba(56, 189, 248, 0.3);
        }

        .section-icon-box.clipboard-icon {
          color: #F59E0B;
          border-color: rgba(245, 158, 11, 0.3);
        }

        .section-icon-box.crown-icon {
          color: #EAB308;
          border-color: rgba(234, 179, 8, 0.3);
        }

        .section-headings {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .section-headings h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .section-sub {
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .section-divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 100%);
          margin: 0 8px;
        }

        .section-count-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #94A3B8;
          font-size: 0.72rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* GRID DE CARDS */
        .roster-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 980px) {
          .roster-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .roster-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        /* CARD INDIVIDUAL (ESTILO APPLE GLASS) */
        .player-card {
          background: rgba(12, 18, 34, 0.65);
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.22s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 1.5px rgba(255, 255, 255, 0.18);
        }

        .player-card:hover {
          transform: translateY(-3px);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(56, 189, 248, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.28);
        }

        .card-top-row {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .avatar-initial-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #D61F26;
          color: #FFFFFF;
          font-size: 1.15rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(214, 31, 38, 0.35);
        }

        .avatar-initial-box.staff-initial {
          background: #0B5FFF;
          box-shadow: 0 2px 8px rgba(11, 95, 255, 0.35);
        }

        .avatar-initial-box.avatar-img-box {
          padding: 0;
          object-fit: cover;
          border: 2px solid #D61F26;
          box-shadow: 0 2px 8px rgba(214, 31, 38, 0.35);
        }

        .avatar-initial-box.avatar-img-box.staff-initial {
          border-color: #0B5FFF;
          box-shadow: 0 2px 8px rgba(11, 95, 255, 0.35);
        }

        .player-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .player-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }

        .player-tag {
          font-size: 0.74rem;
          color: #64748B;
          font-weight: 500;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-options-area {
          margin-left: auto;
          display: flex;
          align-items: center;
        }

        .drag-icon-muted {
          color: #334155;
        }

        .card-hover-actions {
          display: flex;
          gap: 4px;
        }

        .action-icon-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94A3B8;
          border-radius: 6px;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .action-icon-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
        }

        .action-icon-btn.del:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #EF4444;
          color: #EF4444;
        }

        /* BADGES ROW */
        .badges-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .pill-badge {
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          border-radius: 9999px;
          padding: 3px 9px;
          text-transform: uppercase;
        }

        .pill-badge.titular {
          background: rgba(214, 31, 38, 0.14);
          border: 1px solid rgba(214, 31, 38, 0.45);
          color: #EF4444;
        }

        .pill-badge.reserva {
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #38BDF8;
        }

        .pill-badge.staff-role {
          background: rgba(11, 95, 255, 0.15);
          border: 1px solid rgba(11, 95, 255, 0.4);
          color: #60A5FA;
        }

        .pill-badge.lane {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94A3B8;
        }

        /* MAIN POKEMON BOX */
        .main-pokemon-box {
          background: #060912;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pokemon-sprite-wrapper {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pokemon-sprite-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
        }

        .pokemon-info-text {
          display: flex;
          flex-direction: column;
        }

        .main-label {
          font-size: 0.62rem;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .main-pokemon-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFFFFF;
          line-height: 1.2;
        }

        /* CARD FOOTER */
        .card-footer-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-line {
          font-size: 0.74rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .info-label {
          color: #64748B;
        }

        .info-value {
          color: #94A3B8;
          font-weight: 500;
        }

        .info-value.id-code {
          color: #38BDF8;
          font-family: monospace;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .empty-roster-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          gap: 8px;
          margin-top: 10px;
        }

        .empty-roster-text {
          font-size: 0.92rem;
          font-weight: 700;
          color: #E2E8F0;
          margin: 0;
        }

        .empty-roster-sub {
          font-size: 0.76rem;
          color: #64748B;
          max-width: 480px;
        }

        /* MODAL STYLES */
        .modal-custom-roster {
          max-width: 520px;
          width: 100%;
        }

        .m-title-icon {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .custom-roster-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 16px;
        }

        .custom-roster-form input,
        .custom-roster-form select {
          width: 100%;
          background: #0B111E;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #F8FAFC;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .custom-roster-form input:focus,
        .custom-roster-form select:focus {
          border-color: #38BDF8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }

        .custom-roster-form select option {
          background-color: #0F172A;
          color: #F8FAFC;
        }

        @media (max-width: 480px) {
          .form-row-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

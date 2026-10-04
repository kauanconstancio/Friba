import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  Gamepad2, 
  Crown, 
  Star, 
  Search, 
  AlertCircle, 
  X, 
  Check, 
  Save, 
  Mail, 
  Lock, 
  Hash, 
  Camera, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  Info
} from 'lucide-react';
import type { AppUser, TeamMember, PokemonRole, Lane } from '../../types';
import { POKEMON_ROSTER } from '../../data/pokemonData';
import { dbCreateOrUpdateUser, dbSaveMember } from '../../services/supabase';

interface ProfilePageProps {
  currentUser: AppUser;
  onUpdateCurrentUser: (updatedUser: AppUser) => void;
  members: TeamMember[];
  onUpdateMember: (updatedMember: TeamMember) => void;
  onNavigate?: (tab: string) => void;
}

interface SelectOption<T = string> {
  value: T;
  label: string;
  badgeColor?: string;
  sublabel?: string;
}

const GAME_ROLE_OPTIONS: SelectOption<PokemonRole>[] = [
  { value: 'All-Rounder', label: 'All-Rounder (Equilibrado)', badgeColor: '#9333EA', sublabel: 'Lutador versátil com alto sustain' },
  { value: 'Attacker', label: 'Attacker (Atacante)', badgeColor: '#F97316', sublabel: 'Dano massivo à distância ou rajada' },
  { value: 'Speedster', label: 'Speedster (Veloz)', badgeColor: '#0284C7', sublabel: 'Alta mobilidade e pick-offs na Jungle' },
  { value: 'Defender', label: 'Defender (Defensor)', badgeColor: '#10B981', sublabel: 'Linha de frente e controle de grupo (CC)' },
  { value: 'Supporter', label: 'Supporter (Suporte)', badgeColor: '#EAB308', sublabel: 'Curas, escudos e utilidade tática' },
];

const LANE_OPTIONS: SelectOption<Lane>[] = [
  { value: 'Top Lane', label: 'Top Lane (Rota Superior)', badgeColor: '#F59E0B' },
  { value: 'Jungle', label: 'Jungle (Selva Central)', badgeColor: '#06B6D4' },
  { value: 'Bot Lane', label: 'Bot Lane (Rota Inferior)', badgeColor: '#8B5CF6' },
  { value: 'Mid', label: 'Mid (Central Flex)', badgeColor: '#EC4899' },
  { value: 'Support', label: 'Support (Rotação/Suporte)', badgeColor: '#10B981' },
];

const STATUS_OPTIONS: SelectOption<'Titular' | 'Reserva'>[] = [
  { value: 'Titular', label: 'Titular Principal', badgeColor: '#10B981', sublabel: 'Escalação principal nas scrims' },
  { value: 'Reserva', label: 'Reserva Estratégico', badgeColor: '#64748B', sublabel: 'Suporte e rotação de elenco' },
];

const AVATAR_PRESETS = [
  { label: 'Trainer Red', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80' },
  { label: 'Gamer Pro 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80' },
  { label: 'Gamer Pro 2', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80' },
  { label: 'Esports Elite', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80' },
  { label: 'Gamer Violet', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80' },
  { label: 'Coach Cyber', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80' },
];

// Helper visual para cor da role de Pokémon
const getRoleColor = (role?: string) => {
  switch (role) {
    case 'Attacker': return '#F97316';
    case 'Speedster': return '#0284C7';
    case 'All-Rounder': return '#9333EA';
    case 'Defender': return '#10B981';
    case 'Supporter': return '#EAB308';
    default: return '#64748B';
  }
};

// Componente CustomSelect Dark Glass
interface CustomSelectProps<T> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (val: T) => void;
  hint?: string;
}

function CustomSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.custom-select-container[data-select="${label}"]`)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen, label]);

  return (
    <div className="custom-select-container" data-select={label}>
      <label className="profile-field-label">{label}</label>
      <div className="custom-select-wrapper">
        <button
          type="button"
          className={`custom-select-trigger ${isOpen ? 'is-open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="selected-value-content">
            {selectedOption?.badgeColor && (
              <span
                className="select-item-dot"
                style={{ backgroundColor: selectedOption.badgeColor, boxShadow: `0 0 8px ${selectedOption.badgeColor}80` }}
              />
            )}
            <span className="selected-value-text">{selectedOption ? selectedOption.label : 'Selecione...'}</span>
          </div>
          <ChevronDown size={15} className={`chevron-indicator ${isOpen ? 'rotate-up' : ''}`} />
        </button>

        {isOpen && (
          <div className="custom-select-dropdown">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={String(opt.value)}
                  className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <div className="option-main-row">
                    {opt.badgeColor && (
                      <span
                        className="select-item-dot"
                        style={{ backgroundColor: opt.badgeColor }}
                      />
                    )}
                    <span className="option-label-text">{opt.label}</span>
                    {isSelected && <Check size={14} className="option-check-icon" />}
                  </div>
                  {opt.sublabel && (
                    <span className="option-sublabel-text">{opt.sublabel}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {hint && <span className="profile-field-hint">{hint}</span>}
    </div>
  );
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onUpdateCurrentUser,
  members,
  onUpdateMember,
  onNavigate,
}) => {
  // Encontrar o TeamMember associado a este usuário
  const linkedMember = useMemo(() => {
    return members.find(m => 
      (m.userId && m.userId === currentUser.id) ||
      (m.email && m.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      m.id === currentUser.id
    );
  }, [members, currentUser]);

  // Estados do Perfil
  const [name, setName] = useState(currentUser.name || linkedMember?.name || '');
  const [nickname, setNickname] = useState(currentUser.nickname || linkedMember?.nickname || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || linkedMember?.avatar || AVATAR_PRESETS[0].url);
  const [discord, setDiscord] = useState(currentUser.discord || linkedMember?.discord || '');
  const [inGameId, setInGameId] = useState(currentUser.inGameId || linkedMember?.inGameId || '');
  const [email] = useState(currentUser.email);
  const [newPassword, setNewPassword] = useState('');
  const [showAvatarPresets, setShowAvatarPresets] = useState(false);

  // Campos específicos de Jogador
  const isPlayerOrOwner = currentUser.role === 'Jogador' || currentUser.role === 'Dono';
  const [gameRole, setGameRole] = useState<PokemonRole>(linkedMember?.gameRole || 'All-Rounder');
  const [preferredLane, setPreferredLane] = useState<Lane>(linkedMember?.preferredLane || 'Jungle');
  const [status, setStatus] = useState<'Titular' | 'Reserva'>(linkedMember?.status || 'Titular');
  const [mainPokemon, setMainPokemon] = useState<string[]>(() => {
    if (linkedMember?.mainPokemon && linkedMember.mainPokemon.length > 0) {
      return linkedMember.mainPokemon;
    }
    return ['ceruledge', 'blaziken', 'zoroark'];
  });

  // Campos específicos de Staff (Coach, Manager, Dono)
  const [specialtyOrTitle, setSpecialtyOrTitle] = useState(linkedMember?.specialtyOrTitle || (currentUser.role === 'Dono' ? 'Dono & Fundador' : ''));
  const [coachNotes, setCoachNotes] = useState(linkedMember?.coachNotes || '');

  // Filtros da seção de Pokémon
  const [pokemonSearch, setPokemonSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('Todos');

  // Estado de feedback
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtragem dos Pokémon
  const filteredPokemon = useMemo(() => {
    return POKEMON_ROSTER.filter(p => {
      const matchRole = selectedRoleFilter === 'Todos' || p.role === selectedRoleFilter;
      const matchSearch = !pokemonSearch.trim() || 
        p.name.toLowerCase().includes(pokemonSearch.toLowerCase()) ||
        p.role.toLowerCase().includes(pokemonSearch.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [selectedRoleFilter, pokemonSearch]);

  const handleTogglePokemon = (pId: string) => {
    setMainPokemon(prev => {
      if (prev.includes(pId)) {
        if (prev.length <= 1) return prev; // manter ao menos 1
        return prev.filter(id => id !== pId);
      } else {
        if (prev.length >= 3) {
          // substitui o último para fluidez
          return [prev[0], prev[1], pId];
        }
        return [...prev, pId];
      }
    });
  };

  const handleRemovePokemon = (pId: string) => {
    setMainPokemon(prev => {
      if (prev.length <= 1) {
        alert('Selecione pelo menos 1 Pokémon principal.');
        return prev;
      }
      return prev.filter(id => id !== pId);
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nickname.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Por favor, informe pelo menos seu Nome e Nickname.' });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      // 1. Atualizar AppUser (Sessão & Tabela users)
      const updatedUser: AppUser = {
        ...currentUser,
        name: name.trim(),
        nickname: nickname.trim(),
        avatar: avatar.trim() || currentUser.avatar,
        discord: discord.trim(),
        inGameId: inGameId.trim(),
        ...(newPassword.trim() ? { password: newPassword.trim() } : {})
      };

      await dbCreateOrUpdateUser(updatedUser);
      onUpdateCurrentUser(updatedUser);

      // 2. Atualizar ou Criar TeamMember (Tabela team_members & Roster da Equipe)
      const memberId = linkedMember ? linkedMember.id : (currentUser.id.startsWith('member-') ? currentUser.id : `member-${Date.now()}`);
      const updatedMember: TeamMember = {
        id: memberId,
        userId: currentUser.id,
        name: name.trim(),
        nickname: nickname.trim(),
        tag: `@${nickname.trim()}`,
        role: currentUser.role,
        avatar: avatar.trim() || currentUser.avatar,
        discord: discord.trim(),
        inGameId: inGameId.trim(),
        email: currentUser.email,
        gameRole: isPlayerOrOwner ? gameRole : undefined,
        preferredLane: isPlayerOrOwner ? preferredLane : undefined,
        mainPokemon: isPlayerOrOwner ? mainPokemon : undefined,
        status: isPlayerOrOwner ? status : undefined,
        specialtyOrTitle: specialtyOrTitle.trim() || undefined,
        coachNotes: coachNotes.trim() || undefined,
      };

      await dbSaveMember(updatedMember);
      onUpdateMember(updatedMember);

      setFeedbackMsg({ 
        type: 'success', 
        text: 'Perfil atualizado com sucesso! Suas alterações já estão visíveis para toda a equipe.' 
      });

      if (newPassword.trim()) {
        setNewPassword('');
      }

      // Rola para o topo suavemente para ver o feedback
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setFeedbackMsg({ 
        type: 'error', 
        text: err.message || 'Falha ao salvar alterações do perfil.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const primaryPokemonData = useMemo(() => {
    const list = mainPokemon && mainPokemon.length > 0 ? mainPokemon : ['ceruledge', 'blaziken', 'zoroark'];
    const targetId = (list[0] || 'ceruledge').toLowerCase();
    return POKEMON_ROSTER.find(p => p.id.toLowerCase() === targetId || p.name.toLowerCase() === targetId) 
      || POKEMON_ROSTER.find(p => p.id === 'ceruledge') 
      || POKEMON_ROSTER[0];
  }, [mainPokemon]);

  return (
    <div className="profile-page-container">
      {/* Header com Banner Heroico */}
      <div className="profile-hero-banner">
        <div className="hero-banner-ambient" />
        <div className="hero-banner-content">
          <div className="hero-avatar-wrapper">
            <img 
              src={avatar} 
              alt={nickname || name} 
              className="hero-avatar-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80';
              }} 
            />
            <button 
              type="button" 
              className="hero-avatar-change-btn" 
              title="Trocar Foto de Perfil"
              onClick={() => setShowAvatarPresets(!showAvatarPresets)}
            >
              <Camera size={14} />
            </button>
          </div>

          <div className="hero-identity-text">
            <div className="hero-badges-row">
              <span className={`hero-role-pill ${currentUser.role === 'Dono' ? 'is-owner' : ''}`}>
                {currentUser.role === 'Dono' && <Crown size={12} />}
                {currentUser.role.toUpperCase()}
              </span>
              <span className="hero-tag-pill">@{nickname || 'gamer'}</span>
              <span className="hero-status-pill">
                <ShieldCheck size={12} color="#10B981" />
                CONTA VERIFICADA
              </span>
            </div>
            <h1 className="hero-name-title">{name || nickname}</h1>
            <p className="hero-subline">
              @{nickname} • Pokémon Unite Roster Oficial • {currentUser.email}
            </p>
          </div>

          <div className="hero-quick-actions">
            {onNavigate && (
              <button 
                type="button" 
                className="btn-outline-back" 
                onClick={() => onNavigate('roster')}
              >
                Ver na Aba Equipe
              </button>
            )}
            <button 
              type="button" 
              className="btn-primary-hero-save"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              <Save size={15} />
              {isSaving ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </div>
        </div>
      </div>

      {/* Popover / Seletor Rápido de Avatar */}
      {showAvatarPresets && (
        <div className="avatar-preset-card">
          <div className="avatar-preset-header">
            <div className="preset-title-row">
              <Camera size={15} color="#38BDF8" />
              <span>Escolha um Avatar Oficial ou Cole a URL da Imagem</span>
            </div>
            <button type="button" onClick={() => setShowAvatarPresets(false)} className="close-mini-btn">
              <X size={14} />
            </button>
          </div>

          <div className="avatar-presets-grid">
            {AVATAR_PRESETS.map((p, idx) => (
              <div 
                key={idx} 
                className={`preset-item ${avatar === p.url ? 'is-active' : ''}`}
                onClick={() => {
                  setAvatar(p.url);
                  setShowAvatarPresets(false);
                }}
              >
                <img src={p.url} alt={p.label} />
                <span>{p.label}</span>
              </div>
            ))}
          </div>

          <div className="avatar-url-input-box">
            <span className="url-label">Ou URL personalizada de imagem:</span>
            <input 
              type="text" 
              placeholder="https://exemplo.com/minha-foto.png" 
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="avatar-custom-input"
            />
          </div>
        </div>
      )}

      {/* Banner de Feedback de Salvo com Sucesso */}
      {feedbackMsg && (
        <div className={`profile-feedback-alert ${feedbackMsg.type}`}>
          {feedbackMsg.type === 'success' ? (
            <ShieldCheck size={18} color="#10B981" />
          ) : (
            <AlertCircle size={18} color="#EF4444" />
          )}
          <span>{feedbackMsg.text}</span>
          <button type="button" onClick={() => setFeedbackMsg(null)} className="alert-close-btn">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Layout Principal: Formulário + Live Preview Card */}
      <div className="profile-layout-grid">
        {/* Coluna Esquerda: Formulários de Configuração */}
        <form onSubmit={handleSaveProfile} className="profile-main-form">
          {/* SEÇÃO 1: DADOS PESSOAIS E IDENTIDADE */}
          <div className="profile-card-section">
            <div className="section-title-line">
              <div className="section-icon-circle blue">
                <User size={16} />
              </div>
              <div>
                <h2 className="section-title-text">Identidade & Contas</h2>
                <p className="section-desc-text">Como você será reconhecido pela equipe e comissão técnica.</p>
              </div>
            </div>

            <div className="profile-fields-grid-2">
              <div className="profile-field-group">
                <label className="profile-field-label">Nome Completo *</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Gabriel Toledo"
                  className="profile-text-input"
                  required
                />
              </div>

              <div className="profile-field-group">
                <label className="profile-field-label">Nickname / Gamertag *</label>
                <input 
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ex: Fallen"
                  className="profile-text-input"
                  required
                />
              </div>

              <div className="profile-field-group">
                <label className="profile-field-label">
                  <Hash size={13} style={{ display: 'inline', marginRight: 4 }} />
                  ID no Pokémon Unite (UID Amizade)
                </label>
                <input 
                  type="text"
                  value={inGameId}
                  onChange={(e) => setInGameId(e.target.value.toUpperCase())}
                  placeholder="Ex: MMRYMA5"
                  className="profile-text-input uppercase"
                />
                <span className="profile-field-hint">Código de 7 dígitos do perfil dentro do Pokémon Unite.</span>
              </div>

              <div className="profile-field-group">
                <label className="profile-field-label">Discord Tag</label>
                <input 
                  type="text"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="Ex: @usuario ou gamer#0001"
                  className="profile-text-input"
                />
              </div>

              <div className="profile-field-group">
                <label className="profile-field-label">
                  <Mail size={13} style={{ display: 'inline', marginRight: 4 }} />
                  E-mail Oficial (Vinculado)
                </label>
                <input 
                  type="email"
                  value={email}
                  disabled
                  className="profile-text-input is-disabled"
                  title="O e-mail é vinculado à sua conta oficial e não pode ser alterado."
                />
                <span className="profile-field-hint">Chave de acesso primária à conta.</span>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: SEGURANÇA E ACESSO */}
          <div className="profile-card-section">
            <div className="section-title-line">
              <div className="section-icon-circle purple">
                <Lock size={16} />
              </div>
              <div>
                <h2 className="section-title-text">Acesso & Senha</h2>
                <p className="section-desc-text">Altere sua senha de login quando desejar.</p>
              </div>
            </div>

            <div className="profile-fields-grid-2">
              <div className="profile-field-group" style={{ gridColumn: 'span 2' }}>
                <label className="profile-field-label">Nova Senha de Acesso</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Deixe em branco para manter a senha atual"
                  className="profile-text-input"
                  autoComplete="new-password"
                />
                <span className="profile-field-hint">Se preenchido, atualizará sua credencial de login no sistema.</span>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: COMPETITIVO POKÉMON UNITE (Para Jogadores e Dono) */}
          {isPlayerOrOwner && (
            <div className="profile-card-section">
              <div className="section-title-line">
                <div className="section-icon-circle red">
                  <Gamepad2 size={16} />
                </div>
                <div>
                  <h2 className="section-title-text">Especialidade Competitiva no Pokémon Unite</h2>
                  <p className="section-desc-text">Defina sua função no mapa, rota preferida e Pokémon mains.</p>
                </div>
              </div>

              <div className="profile-fields-grid-3">
                <CustomSelect
                  label="Função Principal *"
                  value={gameRole}
                  options={GAME_ROLE_OPTIONS}
                  onChange={setGameRole}
                />

                <CustomSelect
                  label="Rota Preferida (Lane) *"
                  value={preferredLane}
                  options={LANE_OPTIONS}
                  onChange={setPreferredLane}
                />

                <CustomSelect
                  label="Status no Elenco *"
                  value={status}
                  options={STATUS_OPTIONS}
                  onChange={setStatus}
                />
              </div>

              {/* SELEÇÃO DOS POKÉMON MAINS COM O NOVO DESIGN */}
              <div className="pokemon-mains-custom-box">
                <div className="pokemon-mains-header">
                  <div>
                    <label className="profile-field-label" style={{ margin: 0, fontSize: '0.92rem' }}>
                      Pokémon Principais / Mains (Até 3)
                    </label>
                    <span className="profile-field-hint">
                      Seus Pokémon de maior domínio exibidos no card da equipe.
                    </span>
                  </div>

                  <div className="mains-counter-pill">
                    <Star size={13} color="#F59E0B" />
                    <span><strong>{mainPokemon.length}</strong> de 3 selecionados</span>
                  </div>
                </div>

                {/* 3 Slots de Destaque */}
                <div className="selected-mains-slots-grid">
                  {[0, 1, 2].map((slotIdx) => {
                    const pokeId = mainPokemon[slotIdx];
                    const poke = pokeId ? POKEMON_ROSTER.find(p => p.id === pokeId) : null;

                    return (
                      <div 
                        key={slotIdx} 
                        className={`main-slot-card ${poke ? 'is-filled' : 'is-empty'} ${slotIdx === 0 && poke ? 'is-primary' : ''}`}
                      >
                        {poke ? (
                          <>
                            <div className="slot-header-tag">
                              {slotIdx === 0 ? '★ MAIN PRINCIPAL' : `#${slotIdx + 1} SECUNDÁRIO`}
                            </div>
                            <div className="slot-card-body">
                              <img src={poke.sprite} alt={poke.name} className="slot-avatar" />
                              <div className="slot-details">
                                <span className="slot-pokemon-name">{poke.name}</span>
                                <span 
                                  className="slot-pokemon-role"
                                  style={{ color: getRoleColor(poke.role), background: `${getRoleColor(poke.role)}20` }}
                                >
                                  {poke.role}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="slot-remove-action"
                              onClick={() => handleRemovePokemon(poke.id)}
                              title={`Remover ${poke.name}`}
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <div className="slot-empty-content">
                            <span className="slot-empty-num">Slot #{slotIdx + 1}</span>
                            <span className="slot-empty-cta">+ Selecionar da lista abaixo</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Barra de Filtros e Pesquisa */}
                <div className="pokemon-filters-bar">
                  <div className="pokemon-role-pills">
                    {['Todos', 'Attacker', 'Speedster', 'All-Rounder', 'Defender', 'Supporter'].map((r) => {
                      const isSelected = selectedRoleFilter === r;
                      const count = r === 'Todos' ? POKEMON_ROSTER.length : POKEMON_ROSTER.filter(p => p.role === r).length;
                      return (
                        <button
                          type="button"
                          key={r}
                          className={`role-pill-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedRoleFilter(r)}
                        >
                          <span>{r}</span>
                          <span className="role-pill-count">{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pokemon-search-field">
                    <Search size={14} className="search-icon-svg" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou classe..."
                      value={pokemonSearch}
                      onChange={(e) => setPokemonSearch(e.target.value)}
                      className="pokemon-search-input"
                    />
                    {pokemonSearch && (
                      <button 
                        type="button" 
                        onClick={() => setPokemonSearch('')} 
                        className="search-clear-btn"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid Completo de Pokémon */}
                <div className="pokemon-roster-select-grid">
                  {filteredPokemon.length === 0 ? (
                    <div className="pokemon-no-results">
                      <AlertCircle size={20} color="#94A3B8" />
                      <span>Nenhum Pokémon encontrado para "{pokemonSearch}".</span>
                    </div>
                  ) : (
                    filteredPokemon.map((p) => {
                      const isMain = mainPokemon.includes(p.id);
                      const isPrimary = mainPokemon[0] === p.id;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => handleTogglePokemon(p.id)}
                          className={`pokemon-pick-btn ${isMain ? 'active-main' : ''} ${isPrimary ? 'primary-pick' : ''}`}
                          title={`${p.name} • ${p.role}`}
                        >
                          <img src={p.sprite} alt={p.name} className="pick-sprite" loading="lazy" />
                          <span className="pick-name">{p.name}</span>
                          <span className="pick-role-dot" style={{ backgroundColor: getRoleColor(p.role) }} />
                          {isMain && (
                            <div className="pick-badge">
                              <Check size={10} color="#FFFFFF" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 4: DADOS DE STAFF (se aplicável) */}
          {(currentUser.role !== 'Jogador' || specialtyOrTitle) && (
            <div className="profile-card-section">
              <div className="section-title-line">
                <div className="section-icon-circle emerald">
                  <Crown size={16} />
                </div>
                <div>
                  <h2 className="section-title-text">Comissão Técnica & Gestão</h2>
                  <p className="section-desc-text">Informações exibidas no card de Staff da organização.</p>
                </div>
              </div>

              <div className="profile-fields-grid-2">
                <div className="profile-field-group">
                  <label className="profile-field-label">Cargo ou Especialidade Oficial</label>
                  <input 
                    type="text"
                    value={specialtyOrTitle}
                    onChange={(e) => setSpecialtyOrTitle(e.target.value)}
                    placeholder="Ex: Head Coach, Analista de Dados, CEO"
                    className="profile-text-input"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-field-label">Notas e Filosofia da Staff</label>
                  <input 
                    type="text"
                    value={coachNotes}
                    onChange={(e) => setCoachNotes(e.target.value)}
                    placeholder="Ex: Foco em macrogame e sincronia"
                    className="profile-text-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BOTÃO DE SALVAR NO RODAPÉ DO FORMULÁRIO */}
          <div className="profile-form-footer">
            <button
              type="submit"
              className="btn-save-full"
              disabled={isSaving}
            >
              <Save size={16} />
              <span>{isSaving ? 'Salvando Alterações...' : 'Salvar Alterações do Meu Perfil'}</span>
            </button>
          </div>
        </form>

        {/* Coluna Direita: Live Preview Card (Card em Tempo Real) */}
        <div className="profile-side-preview">
          <div className="preview-sticky-box">
            <div className="preview-header-label">
              <Sparkles size={14} color="#38BDF8" />
              <span>Pré-visualização do seu Card</span>
            </div>

            {/* Simulação Fiel do Card do Roster */}
            <div className={`player-card preview-card-live ${status === 'Titular' ? 'titular-card' : 'reserva-card'}`}>
              <div className="card-top-row">
                <div className="avatar-wrapper">
                  <img 
                    src={avatar} 
                    alt={nickname || name} 
                    className="player-avatar-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';
                    }} 
                  />
                  <div className="online-indicator" />
                </div>

                <div className="player-meta">
                  <h3 className="player-name">{name || nickname || 'Seu Nome'}</h3>
                  <div className="player-tag">@{nickname || 'nickname'}</div>
                </div>

                <div className="card-status-dot-badge">
                  {currentUser.role === 'Dono' ? (
                    <span className="live-owner-pill">
                      <Crown size={11} color="#F59E0B" />
                      DONO
                    </span>
                  ) : (
                    <span className="live-verified-pill">
                      <ShieldCheck size={11} color="#10B981" />
                      VERIFICADO
                    </span>
                  )}
                </div>
              </div>

              {/* Badges de Função e Rota */}
              <div className="badges-row">
                <span className={`pill-badge ${status.toLowerCase()}`}>
                  {status.toUpperCase()}
                </span>
                <span className="pill-badge lane">
                  {(preferredLane || 'JUNGLE').toUpperCase()}
                </span>
                <span 
                  className="pill-badge role"
                  style={{ 
                    borderColor: getRoleColor(gameRole), 
                    color: getRoleColor(gameRole),
                    background: `${getRoleColor(gameRole)}15` 
                  }}
                >
                  {gameRole.toUpperCase()}
                </span>
              </div>

              {/* Box do Pokémon Main */}
              <div className="main-pokemon-box">
                <div className="pokemon-sprite-wrapper" style={{ background: `${getRoleColor(primaryPokemonData?.role)}20` }}>
                  {primaryPokemonData ? (
                    <img 
                      src={primaryPokemonData.sprite} 
                      alt={primaryPokemonData.name} 
                      className="pokemon-sprite-img" 
                    />
                  ) : (
                    <Gamepad2 size={20} color="#94A3B8" />
                  )}
                </div>
                <div className="pokemon-info-text">
                  <span className="main-label">MAIN PRINCIPAL</span>
                  <span className="main-pokemon-name">{primaryPokemonData?.name || 'Selecione...'}</span>
                </div>
              </div>

              {/* Mains Secundários */}
              {mainPokemon.length > 1 && (
                <div className="secondary-mains-chips">
                  <span className="chips-label">Secundários:</span>
                  <div className="chips-list">
                    {mainPokemon.slice(1).map(pId => {
                      const poke = POKEMON_ROSTER.find(p => p.id === pId);
                      if (!poke) return null;
                      return (
                        <div key={pId} className="mini-poke-chip">
                          <img src={poke.sprite} alt={poke.name} />
                          <span>{poke.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rodapé com Discord e ID do Jogo */}
              <div className="card-footer-info">
                <div className="info-line">
                  <span className="info-label">Discord:</span>
                  <span className="info-value">{discord || '-'}</span>
                </div>
                {inGameId && (
                  <div className="info-line">
                    <span className="info-label">ID no jogo:</span>
                    <span className="info-value id-code">{inGameId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dica Informativa */}
            <div className="preview-tip-box">
              <Info size={14} color="#94A3B8" />
              <span>
                Este card é sincronizado instantaneamente no Supabase e atualizado na aba <strong>Equipe</strong> para todos os seus companheiros de time.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ESTILOS CUSTOMIZADOS PARA A PÁGINA DE PERFIL */}
      <style>{`
        .profile-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 20px 60px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* HERO BANNER */
        .profile-hero-banner {
          position: relative;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 17, 30, 0.98) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 28px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .hero-banner-ambient {
          position: absolute;
          top: -40%;
          right: -10%;
          width: 500px;
          height: 300px;
          background: radial-gradient(circle, rgba(214, 31, 38, 0.15) 0%, rgba(11, 95, 255, 0.12) 50%, transparent 70%);
          filter: blur(50px);
          pointer-events: none;
        }

        .hero-banner-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .hero-avatar-wrapper {
          position: relative;
          width: 90px;
          height: 90px;
          flex-shrink: 0;
        }

        .hero-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #D61F26;
          box-shadow: 0 0 20px rgba(214, 31, 38, 0.35);
        }

        .hero-avatar-change-btn {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0B5FFF;
          color: #FFF;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #0B111E;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hero-avatar-change-btn:hover {
          background: #2563EB;
          transform: scale(1.1);
        }

        .hero-identity-text {
          flex: 1;
          min-width: 250px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hero-badges-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .hero-role-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.08);
          color: #E2E8F0;
        }

        .hero-role-pill.is-owner {
          background: rgba(245, 158, 11, 0.2);
          color: #F59E0B;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .hero-tag-pill {
          font-size: 0.72rem;
          font-weight: 700;
          color: #38BDF8;
          background: rgba(56, 189, 248, 0.1);
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.02em;
        }

        .hero-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          font-weight: 700;
          color: #10B981;
          background: rgba(16, 185, 129, 0.1);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .hero-name-title {
          font-size: 1.7rem;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .hero-subline {
          font-size: 0.82rem;
          color: #94A3B8;
          margin: 0;
        }

        .hero-quick-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-outline-back {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #E2E8F0;
          font-size: 0.82rem;
          font-weight: 600;
          padding: 9px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-outline-back:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-primary-hero-save {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #D61F26 0%, #B91C1C 100%);
          border: none;
          color: #FFFFFF;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 10px 18px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(214, 31, 38, 0.35);
        }

        .btn-primary-hero-save:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(214, 31, 38, 0.5);
        }

        .btn-primary-hero-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* POPOVER DE AVATAR PRESETS */
        .avatar-preset-card {
          background: #0E1626;
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 14px;
          animation: fadeIn 0.2s ease-out;
        }

        .avatar-preset-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preset-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #F8FAFC;
        }

        .close-mini-btn {
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
          padding: 4px;
        }

        .avatar-presets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        }

        .preset-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-item img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
        }

        .preset-item span {
          font-size: 0.72rem;
          color: #94A3B8;
        }

        .preset-item:hover,
        .preset-item.is-active {
          border-color: #38BDF8;
          background: rgba(56, 189, 248, 0.1);
        }

        .avatar-url-input-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .url-label {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .avatar-custom-input {
          background: #080D1A;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #F8FAFC;
          font-size: 0.8rem;
          padding: 8px 12px;
          border-radius: 8px;
          outline: none;
        }

        /* FEEDBACK ALERT */
        .profile-feedback-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          animation: fadeIn 0.2s ease-out;
        }

        .profile-feedback-alert.success {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34D399;
        }

        .profile-feedback-alert.error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #F87171;
        }

        .alert-close-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
        }

        /* LAYOUT PRINCIPAL (DUAS COLUNAS) */
        .profile-layout-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 960px) {
          .profile-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        /* FORMS */
        .profile-main-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .profile-card-section {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          backdrop-filter: blur(12px);
        }

        .section-title-line {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 14px;
        }

        .section-icon-circle {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .section-icon-circle.blue {
          background: rgba(11, 95, 255, 0.15);
          color: #38BDF8;
        }

        .section-icon-circle.purple {
          background: rgba(147, 51, 234, 0.15);
          color: #A855F7;
        }

        .section-icon-circle.red {
          background: rgba(214, 31, 38, 0.15);
          color: #F87171;
        }

        .section-icon-circle.emerald {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
        }

        .section-title-text {
          font-size: 1rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
        }

        .section-desc-text {
          font-size: 0.75rem;
          color: #94A3B8;
          margin: 2px 0 0;
        }

        .profile-fields-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .profile-fields-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 640px) {
          .profile-fields-grid-2,
          .profile-fields-grid-3 {
            grid-template-columns: 1fr;
          }
        }

        .profile-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .profile-field-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #CBD5E1;
          letter-spacing: 0.02em;
        }

        .profile-text-input {
          background: #0B111E;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #F8FAFC;
          font-size: 0.85rem;
          padding: 10px 14px;
          border-radius: 10px;
          outline: none;
          transition: all 0.2s;
        }

        .profile-text-input:focus {
          border-color: #38BDF8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }

        .profile-text-input.is-disabled {
          background: rgba(15, 23, 42, 0.4);
          color: #64748B;
          border-color: rgba(255, 255, 255, 0.05);
          cursor: not-allowed;
        }

        .profile-text-input.uppercase {
          text-transform: uppercase;
          font-family: monospace;
          letter-spacing: 0.05em;
        }

        .profile-field-hint {
          font-size: 0.7rem;
          color: #64748B;
        }

        /* CUSTOM SELECT ESTILO GLASS */
        .custom-select-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
        }

        .custom-select-wrapper {
          position: relative;
        }

        .custom-select-trigger {
          width: 100%;
          background: #0B111E;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #F8FAFC;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .custom-select-trigger:hover,
        .custom-select-trigger.is-open {
          border-color: #38BDF8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }

        .selected-value-content {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
        }

        .select-item-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .selected-value-text {
          font-size: 0.84rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chevron-indicator {
          color: #94A3B8;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .chevron-indicator.rotate-up {
          transform: rotate(180deg);
        }

        .custom-select-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          background: #0E1626;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          z-index: 100;
          max-height: 240px;
          overflow-y: auto;
          animation: dropdownFadeIn 0.15s ease-out;
        }

        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .custom-select-option {
          padding: 10px 14px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 3px;
          transition: background 0.15s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .custom-select-option:last-child {
          border-bottom: none;
        }

        .custom-select-option:hover {
          background: rgba(56, 189, 248, 0.1);
        }

        .custom-select-option.selected {
          background: rgba(214, 31, 38, 0.12);
        }

        .option-main-row {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .option-label-text {
          font-size: 0.83rem;
          font-weight: 600;
          color: #F8FAFC;
          flex: 1;
        }

        .option-check-icon {
          color: #10B981;
          margin-left: auto;
        }

        .option-sublabel-text {
          font-size: 0.7rem;
          color: #94A3B8;
          padding-left: 16px;
        }

        /* SEÇÃO DE POKÉMON MAINS */
        .pokemon-mains-custom-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: rgba(11, 17, 30, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          padding: 18px;
        }

        .pokemon-mains-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .mains-counter-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: #F59E0B;
          font-size: 0.74rem;
          padding: 4px 10px;
          border-radius: 20px;
        }

        /* SLOTS DE DESTAQUE DOS 3 MAINS */
        .selected-mains-slots-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 640px) {
          .selected-mains-slots-grid {
            grid-template-columns: 1fr;
          }
        }

        .main-slot-card {
          position: relative;
          background: #090F1C;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .main-slot-card.is-filled {
          background: linear-gradient(145deg, #0D1527 0%, #080E1B 100%);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .main-slot-card.is-primary {
          border-color: rgba(245, 158, 11, 0.4);
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.1);
        }

        .main-slot-card.is-empty {
          border-style: dashed;
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.01);
          min-height: 80px;
          justify-content: center;
          align-items: center;
        }

        .slot-header-tag {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #F59E0B;
        }

        .slot-card-body {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .slot-avatar {
          width: 44px;
          height: 44px;
          object-fit: contain;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5));
        }

        .slot-details {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .slot-pokemon-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        .slot-pokemon-role {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
        }

        .slot-remove-action {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .slot-remove-action:hover {
          background: #EF4444;
          color: #FFFFFF;
          border-color: #EF4444;
        }

        .slot-empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-align: center;
        }

        .slot-empty-num {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748B;
        }

        .slot-empty-cta {
          font-size: 0.68rem;
          color: #475569;
        }

        /* FILTROS E PESQUISA */
        .pokemon-filters-bar {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pokemon-role-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .role-pill-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .role-pill-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #F8FAFC;
        }

        .role-pill-btn.active {
          background: #D61F26;
          border-color: #D61F26;
          color: #FFFFFF;
        }

        .role-pill-count {
          font-size: 0.65rem;
          opacity: 0.7;
        }

        .pokemon-search-field {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon-svg {
          position: absolute;
          left: 12px;
          color: #64748B;
          pointer-events: none;
        }

        .pokemon-search-input {
          width: 100%;
          background: #090F1C;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 36px 8px 34px;
          font-size: 0.8rem;
          color: #F8FAFC;
          outline: none;
        }

        .pokemon-search-input:focus {
          border-color: #38BDF8;
        }

        .search-clear-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
        }

        /* GRID DE SELEÇÃO DE POKÉMON */
        .pokemon-roster-select-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
          gap: 8px;
          max-height: 280px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .pokemon-pick-btn {
          position: relative;
          background: #090F1C;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 8px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pokemon-pick-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .pokemon-pick-btn.active-main {
          border-color: #D61F26;
          background: rgba(214, 31, 38, 0.1);
          box-shadow: 0 0 10px rgba(214, 31, 38, 0.25);
        }

        .pokemon-pick-btn.primary-pick {
          border-color: #F59E0B;
        }

        .pick-sprite {
          width: 44px;
          height: 44px;
          object-fit: contain;
        }

        .pick-name {
          font-size: 0.72rem;
          font-weight: 600;
          color: #E2E8F0;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        .pick-role-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .pick-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #D61F26;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pokemon-no-results {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px;
          gap: 8px;
          color: #64748B;
          font-size: 0.8rem;
        }

        /* FORM FOOTER */
        .profile-form-footer {
          margin-top: 8px;
        }

        .btn-save-full {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #D61F26 0%, #B91C1C 100%);
          border: none;
          color: #FFFFFF;
          font-size: 0.92rem;
          font-weight: 700;
          padding: 14px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(214, 31, 38, 0.4);
        }

        .btn-save-full:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(214, 31, 38, 0.55);
        }

        .btn-save-full:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* SIDE PREVIEW COLUMN */
        .profile-side-preview {
          display: flex;
          flex-direction: column;
        }

        .preview-sticky-box {
          position: sticky;
          top: 85px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .preview-header-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #CBD5E1;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* PREVIEW CARD STYLING (ESTILO APPLE GLASS / ESPORTS) */
        .preview-card-live {
          width: 100%;
          background: rgba(12, 18, 34, 0.75);
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          box-shadow: 0 14px 35px rgba(0, 0, 0, 0.45), inset 0 1px 1.5px rgba(255, 255, 255, 0.18);
          transition: all 0.22s ease;
        }

        .preview-card-live:hover {
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(56, 189, 248, 0.15);
        }

        .preview-card-live.titular-card {
          border-color: rgba(214, 31, 38, 0.35);
        }

        .preview-card-live.reserva-card {
          border-color: rgba(56, 189, 248, 0.3);
        }

        .preview-card-live .card-top-row {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          width: 100%;
        }

        .preview-card-live .avatar-wrapper {
          position: relative;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
        }

        .preview-card-live .player-avatar-img {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          object-fit: cover;
          border: 2px solid #D61F26;
          box-shadow: 0 2px 8px rgba(214, 31, 38, 0.35);
        }

        .preview-card-live .online-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10B981;
          border: 2px solid #0B111E;
          box-shadow: 0 0 6px #10B981;
        }

        .preview-card-live .player-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
          min-width: 0;
        }

        .preview-card-live .player-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }

        .preview-card-live .player-tag {
          font-size: 0.74rem;
          color: #64748B;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .preview-card-live .card-status-dot-badge {
          margin-left: auto;
          flex-shrink: 0;
        }

        .live-owner-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.04em;
          background: rgba(245, 158, 11, 0.15);
          color: #F59E0B;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .live-verified-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.04em;
          background: rgba(16, 185, 129, 0.15);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        /* BADGES ROW */
        .preview-card-live .badges-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .preview-card-live .pill-badge {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          border-radius: 9999px;
          padding: 3px 9px;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
        }

        .preview-card-live .pill-badge.titular {
          background: rgba(214, 31, 38, 0.15);
          border: 1px solid rgba(214, 31, 38, 0.45);
          color: #EF4444;
        }

        .preview-card-live .pill-badge.reserva {
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #38BDF8;
        }

        .preview-card-live .pill-badge.lane {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #CBD5E1;
        }

        .preview-card-live .pill-badge.role {
          border: 1px solid;
        }

        /* MAIN POKEMON BOX */
        .preview-card-live .main-pokemon-box {
          background: #060912;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .preview-card-live .pokemon-sprite-wrapper {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .preview-card-live .pokemon-sprite-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
        }

        .preview-card-live .pokemon-info-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .preview-card-live .main-label {
          font-size: 0.6rem;
          font-weight: 800;
          color: #64748B;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .preview-card-live .main-pokemon-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFFFFF;
          line-height: 1.2;
        }

        /* CARD FOOTER */
        .preview-card-live .card-footer-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 10px;
        }

        .preview-card-live .info-line {
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .preview-card-live .info-label {
          color: #64748B;
          font-weight: 500;
        }

        .preview-card-live .info-value {
          color: #E2E8F0;
          font-weight: 600;
        }

        .preview-card-live .info-value.id-code {
          color: #38BDF8;
          font-family: monospace;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .secondary-mains-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 8px;
        }

        .chips-label {
          font-size: 0.68rem;
          color: #64748B;
          font-weight: 600;
        }

        .chips-list {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mini-poke-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          padding: 2px 6px;
        }

        .mini-poke-chip img {
          width: 18px;
          height: 18px;
          object-fit: contain;
        }

        .mini-poke-chip span {
          font-size: 0.68rem;
          color: #E2E8F0;
        }

        .preview-tip-box {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.72rem;
          color: #94A3B8;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

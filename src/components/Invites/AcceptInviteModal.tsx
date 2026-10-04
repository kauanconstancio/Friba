import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Crown, 
  Briefcase, 
  GraduationCap, 
  Gamepad2, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  X, 
  AlertCircle, 
  Search, 
  UserCheck,
  ChevronDown,
  Star
} from 'lucide-react';
import type { Role, PokemonRole, Lane, TeamMember, TeamInvite, AppUser } from '../../types';
import { POKEMON_ROSTER } from '../../data/pokemonData';
import { dbFindInviteByCode, dbAcceptInviteAndRegisterPlayer } from '../../services/supabase';

interface DropdownOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
  colorDot?: string;
}

interface CustomSelectProps<T extends string> {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (val: T) => void;
}

function CustomSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="custom-select-wrapper" ref={dropdownRef}>
      <label className="form-label">{label}</label>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="select-val-row">
          {selectedOption.colorDot && (
            <span 
              className="select-color-dot" 
              style={{ backgroundColor: selectedOption.colorDot, boxShadow: `0 0 8px ${selectedOption.colorDot}66` }} 
            />
          )}
          <span className="select-val-label">{selectedOption.label}</span>
          {selectedOption.sublabel && (
            <span className="select-val-sub">({selectedOption.sublabel})</span>
          )}
        </div>
        <ChevronDown 
          size={15} 
          className={`select-chevron ${isOpen ? 'rotate' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="custom-select-menu">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                type="button"
                key={opt.value}
                className={`custom-select-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <div className="select-item-left">
                  {opt.colorDot && (
                    <span 
                      className="select-color-dot" 
                      style={{ backgroundColor: opt.colorDot, boxShadow: `0 0 6px ${opt.colorDot}88` }} 
                    />
                  )}
                  <span className="select-item-title">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="select-item-subtitle">{opt.sublabel}</span>
                  )}
                </div>
                {isSelected && <Check size={14} className="select-check-icon" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const GAME_ROLE_OPTIONS: DropdownOption<PokemonRole>[] = [
  { value: 'All-Rounder', label: 'All-Rounder', sublabel: 'Equilibrado', colorDot: '#9333EA' },
  { value: 'Attacker', label: 'Attacker', sublabel: 'Atacante', colorDot: '#F97316' },
  { value: 'Speedster', label: 'Speedster', sublabel: 'Veloz', colorDot: '#0284C7' },
  { value: 'Defender', label: 'Defender', sublabel: 'Defensor', colorDot: '#10B981' },
  { value: 'Supporter', label: 'Supporter', sublabel: 'Suporte', colorDot: '#EAB308' },
];

const LANE_OPTIONS: DropdownOption<Lane>[] = [
  { value: 'Top Lane', label: 'Top Lane', sublabel: 'Rota Superior', colorDot: '#38BDF8' },
  { value: 'Jungle', label: 'Jungle', sublabel: 'Selva Central', colorDot: '#A855F7' },
  { value: 'Bot Lane', label: 'Bot Lane', sublabel: 'Rota Inferior', colorDot: '#F59E0B' },
  { value: 'Mid', label: 'Mid', sublabel: 'Rota Central', colorDot: '#EC4899' },
  { value: 'Support', label: 'Support', sublabel: 'Roaming / Suporte', colorDot: '#10B981' },
];

const STATUS_OPTIONS: DropdownOption<'Titular' | 'Reserva'>[] = [
  { value: 'Titular', label: 'Titular', sublabel: 'Five Principal', colorDot: '#10B981' },
  { value: 'Reserva', label: 'Reserva', sublabel: 'Suplente / Roster', colorDot: '#94A3B8' },
];

const getRoleColor = (role: PokemonRole): string => {
  switch (role) {
    case 'Attacker': return '#F97316';
    case 'Speedster': return '#0284C7';
    case 'All-Rounder': return '#9333EA';
    case 'Defender': return '#10B981';
    case 'Supporter': return '#EAB308';
    default: return '#94A3B8';
  }
};

interface AcceptInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  onSuccess: (newMember: TeamMember, newUser: AppUser) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export const AcceptInviteModal: React.FC<AcceptInviteModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
  onSuccess,
}) => {
  const [step, setStep] = useState<'validate' | 'form' | 'success'>('validate');
  const [code, setCode] = useState(initialCode);
  const [invite, setInvite] = useState<TeamInvite | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulário do Jogador
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [discord, setDiscord] = useState('');
  const [inGameId, setInGameId] = useState('');
  const [email, setEmail] = useState('');
  
  // Específicos para Jogador
  const [gameRole, setGameRole] = useState<PokemonRole>('All-Rounder');
  const [preferredLane, setPreferredLane] = useState<Lane>('Jungle');
  const [mainPokemon, setMainPokemon] = useState<string[]>(['ceruledge']);
  const [status, setStatus] = useState<'Titular' | 'Reserva'>('Titular');

  // Específicos para Staff
  const [specialtyOrTitle, setSpecialtyOrTitle] = useState('');
  const [coachNotes, setCoachNotes] = useState('');

  const [pokemonSearch, setPokemonSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('Todos');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidateCode = useCallback(async (codeToTest?: string) => {
    const targetCode = (codeToTest || code).trim().toUpperCase();
    if (!targetCode) {
      setErrorMsg('Por favor, informe o código do convite.');
      return;
    }

    setIsValidating(true);
    setErrorMsg(null);

    try {
      let found = await dbFindInviteByCode(targetCode);
      if (!found) {
        // Fallback resiliente: se o código segue o padrão da Friba e possui informações na URL
        const urlParams = new URLSearchParams(window.location.search);
        const urlRole = urlParams.get('role') as Role | null;
        if (targetCode.startsWith('FRIBA-') || targetCode.startsWith('FRB-')) {
          const validRoles: Role[] = ['Dono', 'Manager', 'Coach', 'Jogador'];
          const role: Role = (urlRole && validRoles.includes(urlRole)) ? urlRole : 'Jogador';
          found = {
            id: `inv-${targetCode}`,
            email: '',
            name: '',
            role: role,
            status: 'Pendente',
            invitedBy: 'friba-admin',
            invitedByName: 'Comissão Técnica Friba',
            inviteCode: targetCode,
            createdAt: new Date().toISOString(),
          };
        }
      }

      if (!found) {
        setErrorMsg('Código de convite não encontrado ou inválido.');
        setInvite(null);
        return;
      }

      if (found.status === 'Aceito') {
        setErrorMsg('Este convite já foi utilizado anteriormente.');
        setInvite(null);
        return;
      }

      setInvite(found);
      setEmail(found.email);
      if (found.name) {
        setName(found.name);
        setNickname(found.name);
      }
      setStep('form');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao validar convite.');
    } finally {
      setIsValidating(false);
    }
  }, [code]);

  // Validar código automaticamente se fornecido
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      handleValidateCode(initialCode);
    }
  }, [initialCode, handleValidateCode]);

  const handleRemovePokemon = (pId: string) => {
    setMainPokemon(prev => {
      if (prev.length <= 1) {
        alert('Selecione pelo menos 1 Pokémon principal.');
        return prev;
      }
      return prev.filter(id => id !== pId);
    });
  };

  const handleTogglePokemon = (pId: string) => {
    setMainPokemon(prev => {
      if (prev.includes(pId)) {
        if (prev.length <= 1) return prev; // manter pelo menos 1
        return prev.filter(id => id !== pId);
      } else {
        if (prev.length >= 3) {
          // substituir o último selecionado
          return [prev[0], prev[1], pId];
        }
        return [...prev, pId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;

    if (!name.trim() || !nickname.trim() || !discord.trim() || !inGameId.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios (*)');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeAvatar = customAvatar.trim() || avatar;

      const { member, user } = await dbAcceptInviteAndRegisterPlayer(invite.inviteCode, {
        name: name.trim(),
        nickname: nickname.trim(),
        tag: `@${nickname.trim()}`,
        avatar: activeAvatar,
        discord: discord.trim(),
        inGameId: inGameId.trim(),
        email: email.trim() || invite.email,
        gameRole,
        preferredLane,
        mainPokemon,
        status,
        specialtyOrTitle: specialtyOrTitle.trim() || (invite.role !== 'Jogador' ? invite.role : undefined),
        coachNotes: coachNotes.trim(),
      });

      // Disparar confetes de boas-vindas
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D61F26', '#0B5FFF', '#FFFFFF', '#F59E0B'],
        });
      } catch {
        // Confetti fallback
      }

      setStep('success');
      setTimeout(() => {
        onSuccess(member, user);
        onClose();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Falha ao concluir cadastro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPokemon = useMemo(() => {
    return POKEMON_ROSTER.filter(p => {
      const matchRole = selectedRoleFilter === 'Todos' || p.role === selectedRoleFilter;
      const matchSearch = !pokemonSearch.trim() || 
        p.name.toLowerCase().includes(pokemonSearch.toLowerCase()) ||
        p.role.toLowerCase().includes(pokemonSearch.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [selectedRoleFilter, pokemonSearch]);

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'Dono': return <Crown size={18} color="#D61F26" />;
      case 'Manager': return <Briefcase size={18} color="#0B5FFF" />;
      case 'Coach': return <GraduationCap size={18} color="#34D399" />;
      case 'Jogador': return <Gamepad2 size={18} color="#F87171" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="invite-modal-backdrop" onClick={onClose}>
      <div className="invite-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="invite-modal-header">
          <div className="modal-title-group">
            <div className="brand-pill">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>FRIBA ESPORTS • INGRESSO NA EQUIPE</span>
            </div>
            <h2 className="modal-heading">
              {step === 'validate' && 'Resgatar Convite de Equipe'}
              {step === 'form' && `Bem-vindo(a) à Friba, ${nickname || 'Gamer'}!`}
              {step === 'success' && 'Tudo Pronto! Bem-vindo(a) à Equipe!'}
            </h2>
            <p className="modal-subheading">
              {step === 'validate' && 'Insira o código único recebido da comissão técnica.'}
              {step === 'form' && 'Preencha suas informações oficiais de jogador para exibir na aba de Equipes.'}
              {step === 'success' && 'Seus dados foram sincronizados com o banco de dados oficial.'}
            </p>
          </div>

          <button type="button" onClick={onClose} className="modal-btn-close">
            <X size={18} />
          </button>
        </div>

        {/* ETAPA 1: VALIDAR CÓDIGO */}
        {step === 'validate' && (
          <div className="validate-step-box">
            <div className="form-group">
              <label htmlFor="invite-code-input" className="form-label">
                Código de Convite da Friba *
              </label>
              <input
                id="invite-code-input"
                type="text"
                autoFocus
                placeholder="Ex: FRIBA-78A2"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="form-input code-input"
              />
            </div>

            {errorMsg && (
              <div className="error-alert">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isValidating || !code.trim()}
              onClick={() => handleValidateCode()}
              className="btn-primary-action"
            >
              {isValidating ? 'Validando Convite...' : 'Avançar para Preenchimento'}
            </button>
          </div>
        )}

        {/* ETAPA 2: FORMULÁRIO DO JOGADOR */}
        {step === 'form' && invite && (
          <form onSubmit={handleSubmit} className="player-form-step">
            {/* Banner do Cargo Concedido pelo Dono */}
            <div className="invite-role-granted-banner">
              <div className="role-granted-icon">
                {getRoleIcon(invite.role)}
              </div>
              <div>
                <div className="role-granted-title">
                  Cargo Definido pela Equipe: <strong>{invite.role}</strong>
                </div>
                <div className="role-granted-subtitle">
                  Convidado por: <strong>{invite.invitedByName}</strong> • E-mail: {invite.email}
                </div>
              </div>
            </div>

            <div className="form-scrollable-content">
              {/* Seção 1: Identidade Básica */}
              <div className="form-section-title">
                <Sparkles size={14} color="#0B5FFF" />
                <span>1. Dados Pessoais & Nickname</span>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kauan Constancio"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nickname no Jogo (IGN) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: NKYY!"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid-2-cols">

                <div className="form-group">
                  <label className="form-label">ID no Pokémon Unite *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MMRYMA5"
                    value={inGameId}
                    onChange={(e) => setInGameId(e.target.value.toUpperCase())}
                    className="form-input code-font"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Discord (Usuário) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: @_nkyyy"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Seção 2: Avatar */}
              <div className="form-section-title">
                <Sparkles size={14} color="#34D399" />
                <span>2. Foto de Perfil / Avatar</span>
              </div>

              <div className="avatar-selection-box">
                <div className="avatar-preview-box">
                  <img 
                    src={customAvatar.trim() || avatar} 
                    alt="Preview Avatar" 
                    className="preview-img"
                  />
                </div>
                <div className="avatar-options-box">
                  <span className="text-xs text-dim mb-1">Escolha um avatar padrão:</span>
                  <div className="preset-avatars-grid">
                    {PRESET_AVATARS.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Avatar ${i}`}
                        onClick={() => {
                          setAvatar(url);
                          setCustomAvatar('');
                        }}
                        className={`preset-thumb ${avatar === url && !customAvatar ? 'selected' : ''}`}
                      />
                    ))}
                  </div>
                  <input
                    type="url"
                    placeholder="Ou cole a URL de uma imagem personalizada..."
                    value={customAvatar}
                    onChange={(e) => setCustomAvatar(e.target.value)}
                    className="form-input mt-2"
                  />
                </div>
              </div>

              {/* Seção 3: Informações do Jogo (se for Jogador) */}
              {invite.role === 'Jogador' ? (
                <>
                  <div className="form-section-title">
                    <Gamepad2 size={14} color="#F87171" />
                    <span>3. Especialidade no Pokémon Unite</span>
                  </div>

                  <div className="grid-3-cols">
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

                  {/* Seleção de Pokémon Principais (Mains) */}
                  <div className="pokemon-mains-section">
                    <div className="pokemon-mains-header">
                      <div className="pokemon-mains-title-box">
                        <label className="form-label" style={{ margin: 0 }}>
                          Pokémon Principais / Mains (Até 3) *
                        </label>
                        <span className="pokemon-mains-hint">
                          Escolha até 3 Pokémon para representar suas preferências competitivas.
                        </span>
                      </div>
                      <div className="mains-counter-pill">
                        <Star size={13} color="#F59E0B" />
                        <span><strong>{mainPokemon.length}</strong> de 3 selecionados</span>
                      </div>
                    </div>

                    {/* Slots de Destaque dos 3 Mains */}
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

                    {/* Filtros de Categoria (Pills) & Barra de Pesquisa */}
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
                              <span>{r === 'Todos' ? 'Todos' : r}</span>
                              <span className="role-pill-count">{count}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pokemon-search-field">
                        <Search size={14} className="search-icon-svg" />
                        <input
                          type="text"
                          placeholder="Buscar Pokémon por nome..."
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

                    {/* Grid Completa de Pokémon Selecionáveis */}
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
                </>
              ) : (
                /* Se for Staff (Coach, Manager, Dono) */
                <>
                  <div className="form-section-title">
                    <Crown size={14} color="#D61F26" />
                    <span>3. Dados de Gestão & Staff</span>
                  </div>

                  <div className="grid-2-cols">
                    <div className="form-group">
                      <label className="form-label">Título ou Especialidade *</label>
                      <input
                        type="text"
                        placeholder="Ex: Head Coach, Analista de Dados..."
                        value={specialtyOrTitle}
                        onChange={(e) => setSpecialtyOrTitle(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Filosofia / Notas da Staff</label>
                      <input
                        type="text"
                        placeholder="Ex: Foco em macrogame e sincronia de rotações"
                        value={coachNotes}
                        onChange={(e) => setCoachNotes(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions-footer">
              <button
                type="button"
                onClick={() => setStep('validate')}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Voltar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-submit-player"
              >
                {isSubmitting ? (
                  'Salvando no Banco...'
                ) : (
                  <>
                    <UserCheck size={16} />
                    <span>Concluir Cadastro & Entrar na Equipe</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ETAPA 3: SUCESSO */}
        {step === 'success' && (
          <div className="success-step-box">
            <div className="success-icon-badge">
              <Check size={36} color="#10B981" />
            </div>
            <h3 className="success-title">Bem-vindo(a) à Friba Esports!</h3>
            <p className="success-subtitle">
              Suas informações foram salvas com sucesso no banco de dados e já estão disponíveis na aba de <strong>Equipes</strong>.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .invite-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(4, 7, 14, 0.85);
          backdrop-filter: blur(14px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.25s ease;
        }

        .invite-modal-card {
          background: linear-gradient(135deg, rgba(11, 17, 31, 0.95) 0%, rgba(18, 28, 48, 0.95) 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          width: 100%;
          max-width: 780px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.85), 0 0 40px rgba(11, 95, 255, 0.2);
          overflow: hidden;
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .invite-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px 28px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #34D399;
          background: rgba(52, 211, 153, 0.1);
          border: 1px solid rgba(52, 211, 153, 0.25);
          padding: 3px 10px;
          border-radius: 9999px;
          margin-bottom: 6px;
        }

        .modal-heading {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 900;
          color: #FFFFFF;
          margin: 0 0 4px 0;
        }

        .modal-subheading {
          font-size: 0.82rem;
          color: var(--text-dim);
          margin: 0;
        }

        .modal-btn-close {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-btn-close:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
        }

        /* Etapa 1 */
        .validate-step-box {
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .code-input {
          font-family: monospace;
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-align: center;
          color: #60A5FA;
          padding: 14px;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 10px 14px;
          color: #FCA5A5;
          font-size: 0.82rem;
        }

        .btn-primary-action {
          background: linear-gradient(135deg, var(--friba-blue) 0%, #0045C7 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 14px;
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(11, 95, 255, 0.4);
        }

        .btn-primary-action:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 22px rgba(11, 95, 255, 0.6);
        }

        .btn-primary-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Etapa 2 Form */
        .player-form-step {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }

        .invite-role-granted-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(11, 95, 255, 0.12);
          border-bottom: 1px solid rgba(11, 95, 255, 0.25);
          padding: 14px 28px;
        }

        .role-granted-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .role-granted-title {
          font-size: 0.88rem;
          color: #FFFFFF;
        }

        .role-granted-subtitle {
          font-size: 0.74rem;
          color: var(--text-dim);
          margin-top: 2px;
        }

        .form-scrollable-content {
          padding: 20px 28px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
          max-height: calc(85vh - 200px);
        }

        .form-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 800;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 6px;
          margin-top: 4px;
        }

        .grid-2-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .grid-3-cols {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 650px) {
          .grid-2-cols, .grid-3-cols {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--text-light);
        }

        .form-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 9px 12px;
          color: #FFFFFF;
          font-size: 0.84rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: var(--friba-blue);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 12px rgba(11, 95, 255, 0.3);
        }

        /* Custom Select Styled Components */
        .custom-select-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .custom-select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          padding: 10px 12px;
          color: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: left;
        }

        .custom-select-trigger:hover {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(15, 23, 42, 0.95);
        }

        .custom-select-trigger.active {
          border-color: #38BDF8;
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.25);
        }

        .select-val-row {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
        }

        .select-color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .select-val-label {
          font-size: 0.84rem;
          font-weight: 700;
          color: #FFFFFF;
          white-space: nowrap;
        }

        .select-val-sub {
          font-size: 0.72rem;
          color: #94A3B8;
          white-space: nowrap;
        }

        .select-chevron {
          color: #94A3B8;
          flex-shrink: 0;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .select-chevron.rotate {
          transform: rotate(180deg);
          color: #38BDF8;
        }

        .custom-select-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 999;
          background: rgba(10, 16, 32, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 12px;
          padding: 6px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.75);
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: modalIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .custom-select-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: transparent;
          border: none;
          border-radius: 8px;
          padding: 9px 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
          text-align: left;
        }

        .custom-select-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .custom-select-item.selected {
          background: rgba(56, 189, 248, 0.14);
        }

        .select-item-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .select-item-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        .select-item-subtitle {
          font-size: 0.72rem;
          color: #94A3B8;
        }

        .select-check-icon {
          color: #38BDF8;
          flex-shrink: 0;
        }

        /* Avatar Selection */
        .avatar-selection-box {
          display: flex;
          align-items: center;
          gap: 18px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px;
        }

        .avatar-preview-box {
          flex-shrink: 0;
        }

        .preview-img {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--friba-blue);
          box-shadow: 0 0 12px rgba(11, 95, 255, 0.4);
        }

        .avatar-options-box {
          flex: 1;
        }

        .preset-avatars-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .preset-thumb {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .preset-thumb:hover {
          transform: scale(1.15);
        }

        .preset-thumb.selected {
          border-color: #38BDF8;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
        }

        /* Pokemon Mains Section */
        .pokemon-mains-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 14px;
          padding: 14px;
        }

        .pokemon-mains-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .pokemon-mains-hint {
          font-size: 0.72rem;
          color: var(--text-dim);
          display: block;
          margin-top: 2px;
        }

        .mains-counter-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #FDE68A;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 600;
        }

        /* Selected Mains Showcase 3 Slots */
        .selected-mains-slots-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        @media (max-width: 600px) {
          .selected-mains-slots-grid {
            grid-template-columns: 1fr;
          }
        }

        .main-slot-card {
          position: relative;
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: all 0.25s ease;
        }

        .main-slot-card.is-filled {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        }

        .main-slot-card.is-primary {
          background: linear-gradient(135deg, rgba(214, 31, 38, 0.18), rgba(15, 23, 42, 0.85));
          border-color: rgba(214, 31, 38, 0.45);
          box-shadow: 0 0 16px rgba(214, 31, 38, 0.25);
        }

        .main-slot-card.is-empty {
          background: rgba(255, 255, 255, 0.02);
          border: 1.5px dashed rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80px;
        }

        .slot-header-tag {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #FBBF24;
        }

        .slot-card-body {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .slot-avatar {
          width: 38px;
          height: 38px;
          object-fit: contain;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
        }

        .slot-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .slot-pokemon-name {
          font-size: 0.82rem;
          font-weight: 800;
          color: #FFFFFF;
          white-space: nowrap;
        }

        .slot-pokemon-role {
          font-size: 0.62rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          width: fit-content;
        }

        .slot-remove-action {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #FCA5A5;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .slot-remove-action:hover {
          background: #EF4444;
          color: #FFFFFF;
          transform: scale(1.1);
        }

        .slot-empty-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .slot-empty-num {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-dim);
        }

        .slot-empty-cta {
          font-size: 0.68rem;
          color: #64748B;
        }

        /* Filter Pills & Search */
        .pokemon-filters-bar {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pokemon-role-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .role-pill-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94A3B8;
          padding: 5px 10px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .role-pill-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #FFFFFF;
        }

        .role-pill-btn.active {
          background: rgba(11, 95, 255, 0.25);
          border-color: #38BDF8;
          color: #FFFFFF;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
        }

        .role-pill-count {
          font-size: 0.62rem;
          background: rgba(255, 255, 255, 0.12);
          padding: 1px 5px;
          border-radius: 9999px;
        }

        .pokemon-search-field {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 0 10px;
        }

        .pokemon-search-field:focus-within {
          border-color: #38BDF8;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
        }

        .search-icon-svg {
          color: #64748B;
          margin-right: 8px;
        }

        .search-clear-btn {
          background: transparent;
          border: none;
          color: #64748B;
          cursor: pointer;
          padding: 4px;
        }

        .search-clear-btn:hover {
          color: #FFFFFF;
        }

        .pokemon-roster-select-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          max-height: 220px;
          overflow-y: auto;
          padding: 4px 2px;
        }

        @media (max-width: 650px) {
          .pokemon-roster-select-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .pokemon-no-results {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 30px;
          color: #94A3B8;
          font-size: 0.8rem;
        }

        .pokemon-pick-btn {
          position: relative;
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 4px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pokemon-pick-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.22);
          transform: translateY(-2px);
        }

        .pokemon-pick-btn.active-main {
          background: rgba(214, 31, 38, 0.18) !important;
          border-color: #EF4444 !important;
          box-shadow: 0 0 14px rgba(239, 68, 68, 0.4);
        }

        .pokemon-pick-btn.primary-pick {
          background: linear-gradient(135deg, rgba(214, 31, 38, 0.25), rgba(245, 158, 11, 0.2)) !important;
          border-color: #F59E0B !important;
          box-shadow: 0 0 16px rgba(245, 158, 11, 0.4);
        }

        .pick-sprite {
          width: 38px;
          height: 38px;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }

        .pick-name {
          font-size: 0.68rem;
          font-weight: 700;
          color: #FFFFFF;
          text-transform: capitalize;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pick-role-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .pick-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #EF4444;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
        }

        /* Footer */
        .modal-actions-footer {
          padding: 16px 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(6, 10, 18, 0.6);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-light);
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
        }

        .btn-submit-player {
          background: linear-gradient(135deg, var(--friba-red) 0%, #B91C1C 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-family: var(--font-heading);
          font-size: 0.88rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(214, 31, 38, 0.4);
        }

        .btn-submit-player:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 22px rgba(214, 31, 38, 0.6);
        }

        /* Etapa 3 */
        .success-step-box {
          padding: 48px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
        }

        .success-icon-badge {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.15);
          border: 2px solid #10B981;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 24px rgba(16, 185, 129, 0.4);
          animation: pop 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .success-title {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 900;
          color: #FFFFFF;
          margin: 0;
        }

        .success-subtitle {
          font-size: 0.88rem;
          color: var(--text-dim);
          max-width: 450px;
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

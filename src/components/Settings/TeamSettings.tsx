import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Briefcase, 
  GraduationCap, 
  Gamepad2, 
  UserPlus, 
  Mail, 
  ShieldCheck, 
  Copy, 
  Check, 
  Trash2, 
  AlertCircle,
  RefreshCw,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import type { Role, AppUser, TeamInvite } from '../../types';
import { 
  dbFetchUsers, 
  dbFetchInvites, 
  dbCreateInvite, 
  dbUpdateUserRole, 
  dbDeleteUser,
  dbDeleteInvite
} from '../../services/supabase';

interface TeamSettingsProps {
  currentRole: Role;
  currentUser: AppUser;
  onRoleChanged?: (newRole: Role) => void;
  teamName: string;
}

export const TeamSettings: React.FC<TeamSettingsProps> = ({
  currentRole,
  currentUser,
  teamName,
}) => {
  const isOwner = currentRole === 'Dono' || currentUser.role === 'Dono';

  // Estados de dados
  const [users, setUsers] = useState<AppUser[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Formulário de convite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('Jogador');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Carregar dados iniciais
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedUsers, fetchedInvites] = await Promise.all([
        dbFetchUsers(),
        dbFetchInvites(),
      ]);
      setUsers(fetchedUsers);
      setInvites(fetchedInvites);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Enviar convite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSubmittingInvite(true);
    try {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `FRIBA-${randomSuffix}`;

      const newInvite = await dbCreateInvite({
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        role: inviteRole,
        status: 'Pendente',
        invitedBy: currentUser.id,
        invitedByName: `${currentUser.nickname || currentUser.name} (${currentUser.role})`,
        inviteCode: code,
      });

      const inviteLink = `${window.location.origin}/?code=${code}&role=${inviteRole}`;
      setGeneratedInviteLink(inviteLink);
      setInvites(prev => [newInvite, ...prev]);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('Jogador');
    } catch (err) {
      console.error('Erro ao criar convite:', err);
      alert('Falha ao enviar convite. Tente novamente.');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Alterar cargo de usuário
  const handleChangeUserRole = async (userId: string, newRole: Role) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (targetUser.id === currentUser.id && newRole !== 'Dono') {
      const confirmSelf = window.confirm(
        'Atenção: Você está alterando seu próprio cargo de Dono. Deseja realmente prosseguir?'
      );
      if (!confirmSelf) return;
    }

    try {
      await dbUpdateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole, isOwner: newRole === 'Dono' } : u));
    } catch (err) {
      console.error('Erro ao atualizar cargo:', err);
      alert('Não foi possível atualizar o cargo.');
    }
  };

  // Remover usuário
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      alert('Você não pode remover seu próprio usuário.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover ${userName} da organização?`)) {
      await dbDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  // Cancelar convite
  const handleCancelInvite = async (inviteId: string) => {
    await dbDeleteInvite(inviteId);
    setInvites(prev => prev.filter(i => i.id !== inviteId));
  };

  // Copiar link/código
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'Dono':
        return (
          <span className="role-tag role-tag-dono">
            <Crown size={12} /> Dono
          </span>
        );
      case 'Manager':
        return (
          <span className="role-tag role-tag-manager">
            <Briefcase size={12} /> Manager
          </span>
        );
      case 'Coach':
        return (
          <span className="role-tag role-tag-coach">
            <GraduationCap size={12} /> Coach
          </span>
        );
      case 'Jogador':
        return (
          <span className="role-tag role-tag-player">
            <Gamepad2 size={12} /> Jogador
          </span>
        );
    }
  };

  return (
    <div className="settings-page-container">
      {/* Header da Página */}
      <div className="settings-header-banner">
        <div className="settings-header-info">
          <div className="settings-badge-pill">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Painel Administrativo • {teamName}</span>
          </div>
          <h1 className="settings-title">Configurações & Gestão de Acessos</h1>
          <p className="settings-subtitle">
            Gerencie os usuários da equipe, atribua cargos com diferentes permissões e envie convites exclusivos.
          </p>
        </div>

        <div className="owner-profile-card">
          <div className="owner-avatar-wrapper">
            <img src={currentUser.avatar} alt={currentUser.name} className="owner-avatar-img" />
            <div className="owner-crown-icon">
              <Crown size={12} color="#FFFFFF" />
            </div>
          </div>
          <div>
            <div className="owner-name-row">
              <span className="owner-name">{currentUser.name}</span>
              <span className="owner-nick">"{currentUser.nickname}"</span>
            </div>
            <div className="owner-role-info">
              {getRoleBadge(currentUser.role)}
              <span className="owner-status-text">
                {isOwner ? '👑 Permissão Total (Superadmin)' : 'Permissão Limitada'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!isOwner && (
        <div className="access-denied-warning">
          <AlertCircle size={20} color="#F59E0B" />
          <div>
            <strong>Acesso Restrito:</strong> Apenas o <strong>Dono da Equipe</strong> possui permissão para convidar novos usuários, alterar cargos ou configurar a base de dados.
          </div>
        </div>
      )}

      {/* Card: Convidar Novo Usuário */}
      <div className="settings-card full-width-card invite-card">
        <div className="card-header">
          <div className="card-header-icon-box">
            <UserPlus size={18} color="#0B5FFF" />
          </div>
          <div>
            <h2 className="card-title">Convidar Novo Usuário</h2>
            <p className="card-subtitle">
              Defina o cargo antecipadamente. O convidado receberá um código único de acesso.
            </p>
          </div>
        </div>

        <form onSubmit={handleSendInvite} className="invite-form">
          <div className="invite-inputs-grid">
            <div className="form-group">
              <label htmlFor="invite-email" className="form-label">
                <Mail size={13} /> E-mail do Usuário *
              </label>
              <input
                id="invite-email"
                type="email"
                required
                disabled={!isOwner || isSubmittingInvite}
                placeholder="exemplo@friba.gg ou gmail.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="invite-name" className="form-label">
                Nome ou Nickname (Opcional)
              </label>
              <input
                id="invite-name"
                type="text"
                disabled={!isOwner || isSubmittingInvite}
                placeholder="Ex: Pedro 'Hydra'"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Seletor Visual de Cargo Antes do Convite */}
          <div className="form-group">
            <label className="form-label">
              <Crown size={13} /> Cargo Inicial do Convidado *
            </label>
            <div className="role-options-grid">
              {(['Jogador', 'Coach', 'Manager', 'Dono'] as Role[]).map((r) => {
                const isSelected = inviteRole === r;
                return (
                  <button
                    type="button"
                    key={r}
                    disabled={!isOwner}
                    onClick={() => setInviteRole(r)}
                    className={`role-option-card ${isSelected ? 'role-selected' : ''}`}
                  >
                    <div className="role-option-icon">
                      {r === 'Dono' && <Crown size={16} color="#D61F26" />}
                      {r === 'Manager' && <Briefcase size={16} color="#0B5FFF" />}
                      {r === 'Coach' && <GraduationCap size={16} color="#34D399" />}
                      {r === 'Jogador' && <Gamepad2 size={16} color="#F87171" />}
                    </div>
                    <span className="role-option-title">{r}</span>
                    <span className="role-option-desc">
                      {r === 'Dono' && 'Acesso total irrestrito'}
                      {r === 'Manager' && 'Gestão & agenda'}
                      {r === 'Coach' && 'Táticas & treinos'}
                      {r === 'Jogador' && 'Visualização & jogos'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isOwner || isSubmittingInvite || !inviteEmail.trim()}
            className="btn-send-invite"
          >
            {isSubmittingInvite ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Gerando Convite...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Gerar Convite de Equipe</span>
              </>
            )}
          </button>
        </form>

        {/* Modal / Toast do Link Gerado */}
        {generatedInviteLink && (
          <div className="invite-success-banner">
            <div className="success-banner-header">
              <Check size={16} className="text-emerald-400" />
              <span className="success-banner-title">Convite Gerado com Sucesso!</span>
            </div>
            <p className="success-banner-desc">
              Compartilhe o link direto com o novo membro:
            </p>
            <div className="invite-link-box">
              <input
                type="text"
                readOnly
                value={generatedInviteLink}
                className="invite-link-input"
              />
              <button
                type="button"
                onClick={() => handleCopy(generatedInviteLink, 'current-link')}
                className="btn-copy-link"
              >
                {copiedCode === 'current-link' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedCode === 'current-link' ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Seção 2: Membros Atuais & Mudança Dinâmica de Cargos */}
      <div className="settings-card full-width-card">
        <div className="card-header justify-between">
          <div className="flex items-center gap-3">
            <div className="card-header-icon-box">
              <Crown size={18} color="#D61F26" />
            </div>
            <div>
              <h2 className="card-title">Membros da Organização ({users.length})</h2>
              <p className="card-subtitle">
                O Dono pode alterar o cargo de qualquer usuário a qualquer instante.
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={loadData} 
            disabled={isLoading}
            className="btn-refresh-table"
            title="Recarregar do Banco"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>

        <div className="members-table-wrapper">
          <table className="members-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Discord</th>
                <th>Cargo Atual</th>
                {isOwner && <th style={{ textAlign: 'right' }}>Ação / Alterar Cargo</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isItemOwner = u.role === 'Dono';
                return (
                  <tr key={u.id} className={isItemOwner ? 'owner-row' : ''}>
                    <td>
                      <div className="user-cell">
                        <img src={u.avatar} alt={u.name} className="user-cell-avatar" />
                        <div>
                          <div className="user-cell-name">
                            {u.name}
                            {isItemOwner && <Crown size={12} color="#D61F26" className="inline-icon" />}
                          </div>
                          <div className="user-cell-nick">"{u.nickname}"</div>
                        </div>
                      </div>
                    </td>
                    <td className="email-cell">{u.email}</td>
                    <td className="discord-cell">{u.discord || '—'}</td>
                    <td>{getRoleBadge(u.role)}</td>
                    {isOwner && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="role-change-control">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeUserRole(u.id, e.target.value as Role)}
                            className="role-select-inline"
                            aria-label={`Mudar cargo de ${u.name}`}
                          >
                            <option value="Jogador">Jogador</option>
                            <option value="Coach">Coach</option>
                            <option value="Manager">Manager</option>
                            <option value="Dono">👑 Dono</option>
                          </select>

                          {u.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="btn-delete-member"
                              title="Remover usuário da organização"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seção 3: Convites Pendentes */}
      <div className="settings-card full-width-card">
        <div className="card-header">
          <div className="card-header-icon-box">
            <Mail size={18} color="#38BDF8" />
          </div>
          <div>
            <h2 className="card-title">Convites Enviados ({invites.length})</h2>
            <p className="card-subtitle">
              Acompanhe os links de convite gerados e cancele ou copie os códigos quando necessário.
            </p>
          </div>
        </div>

        {invites.length === 0 ? (
          <div className="empty-invites-state">
            <UserPlus size={28} color="rgba(255, 255, 255, 0.3)" />
            <p>Nenhum convite pendente no momento.</p>
          </div>
        ) : (
          <div className="invites-table-wrapper">
            <table className="members-table">
              <thead>
                <tr>
                  <th>E-mail Convidado</th>
                  <th>Cargo Pré-definido</th>
                  <th>Código de Convite</th>
                  <th>Convidado Por</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div className="invite-email-cell">
                        <span className="font-semibold text-white">{inv.email}</span>
                        {inv.name && <span className="text-xs text-dim">({inv.name})</span>}
                      </div>
                    </td>
                    <td>{getRoleBadge(inv.role)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleCopy(inv.inviteCode, inv.id)}
                        className="btn-code-copy"
                        title="Copiar código do convite"
                      >
                        <code>{inv.inviteCode}</code>
                        {copiedCode === inv.id ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      </button>
                    </td>
                    <td className="text-dim text-xs">{inv.invitedByName}</td>
                    <td>
                      <span className={`status-pill status-pill-${inv.status.toLowerCase()}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const link = `${window.location.origin}/?code=${inv.inviteCode}&role=${inv.role}`;
                            handleCopy(link, `link-${inv.id}`);
                          }}
                          className="btn-action-icon"
                          title="Copiar Link de Convite"
                        >
                          {copiedCode === `link-${inv.id}` ? <Check size={14} color="#10B981" /> : <LinkIcon size={14} />}
                        </button>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleCancelInvite(inv.id)}
                            className="btn-action-icon text-red-400 hover:text-red-300"
                            title="Cancelar Convite"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Estilos Apple Glass para a Página de Configurações */}
      <style>{`
        .settings-page-container {
          max-width: 1300px;
          margin: 0 auto;
          padding: 24px 20px 80px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-header-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          padding: 24px 28px;
          background: linear-gradient(135deg, rgba(11, 17, 31, 0.85) 0%, rgba(18, 28, 48, 0.7) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
        }

        .settings-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #34D399;
          background: rgba(52, 211, 153, 0.1);
          border: 1px solid rgba(52, 211, 153, 0.25);
          padding: 3px 10px;
          border-radius: 9999px;
          margin-bottom: 8px;
        }

        .settings-title {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 900;
          color: #FFFFFF;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .settings-subtitle {
          font-size: 0.88rem;
          color: var(--text-dim);
          max-width: 600px;
          margin: 0;
        }

        .owner-profile-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(214, 31, 38, 0.3);
          border-radius: 12px;
          box-shadow: 0 0 20px rgba(214, 31, 38, 0.15);
        }

        .owner-avatar-wrapper {
          position: relative;
        }

        .owner-avatar-img {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--friba-red);
        }

        .owner-crown-icon {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background: var(--friba-red);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 8px rgba(214, 31, 38, 0.8);
        }

        .owner-name-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .owner-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        .owner-nick {
          font-size: 0.8rem;
          color: var(--friba-blue);
          font-weight: 600;
        }

        .owner-role-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .owner-status-text {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .access-denied-warning {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 10px;
          padding: 12px 18px;
          color: #FDE68A;
          font-size: 0.85rem;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 900px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }

        .settings-card {
          background: rgba(11, 17, 31, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(16px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .full-width-card {
          width: 100%;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .card-header-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(11, 95, 255, 0.15);
          border: 1px solid rgba(11, 95, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }


        .card-title {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0;
        }

        .card-subtitle {
          font-size: 0.78rem;
          color: var(--text-dim);
          margin: 4px 0 0 0;
        }

        .invite-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .invite-inputs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 700px) {
          .invite-inputs-grid {
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
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .form-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 10px 14px;
          color: #FFFFFF;
          font-size: 0.88rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: var(--friba-blue);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 12px rgba(11, 95, 255, 0.3);
        }

        .code-font {
          font-family: monospace;
          font-size: 0.82rem;
        }

        .role-options-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        @media (max-width: 600px) {
          .role-options-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .role-option-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .role-option-card:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .role-selected {
          background: rgba(11, 95, 255, 0.15) !important;
          border-color: var(--friba-blue) !important;
          box-shadow: 0 0 16px rgba(11, 95, 255, 0.3);
        }

        .role-option-icon {
          margin-bottom: 6px;
        }

        .role-option-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        .role-option-desc {
          font-size: 0.65rem;
          color: var(--text-dim);
          margin-top: 2px;
          line-height: 1.1;
        }

        .btn-send-invite {
          margin-top: 6px;
          background: linear-gradient(135deg, var(--friba-red) 0%, #B91C1C 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 12px;
          font-family: var(--font-heading);
          font-size: 0.88rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(214, 31, 38, 0.4);
        }

        .btn-send-invite:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(214, 31, 38, 0.6);
        }

        .btn-send-invite:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .invite-success-banner {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .success-banner-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .success-banner-title {
          font-size: 0.84rem;
          font-weight: 700;
          color: #34D399;
        }

        .success-banner-desc {
          font-size: 0.75rem;
          color: var(--text-dim);
          margin: 0;
        }

        .invite-link-box {
          display: flex;
          gap: 8px;
        }

        .invite-link-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 6px 10px;
          color: #A7F3D0;
          font-family: monospace;
          font-size: 0.75rem;
          outline: none;
        }

        .btn-copy-link {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #34D399;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-copy-link:hover {
          background: rgba(16, 185, 129, 0.35);
        }


        /* Tabelas */
        .btn-refresh-table {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-light);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-refresh-table:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
        }

        .members-table-wrapper, .invites-table-wrapper {
          overflow-x: auto;
          margin-top: -6px;
        }

        .members-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .members-table th {
          text-align: left;
          padding: 10px 14px;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .members-table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          vertical-align: middle;
        }

        .owner-row {
          background: rgba(214, 31, 38, 0.04);
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-cell-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .user-cell-name {
          font-weight: 700;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .user-cell-nick {
          font-size: 0.72rem;
          color: var(--text-dim);
        }

        .email-cell {
          color: var(--text-muted);
          font-family: monospace;
          font-size: 0.8rem;
        }

        .discord-cell {
          color: #818CF8;
          font-size: 0.8rem;
        }

        .role-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 9999px;
          border: 1px solid transparent;
        }

        .role-tag-dono {
          background: rgba(214, 31, 38, 0.15);
          color: #F87171;
          border-color: rgba(214, 31, 38, 0.35);
        }

        .role-tag-manager {
          background: rgba(11, 95, 255, 0.15);
          color: #60A5FA;
          border-color: rgba(11, 95, 255, 0.35);
        }

        .role-tag-coach {
          background: rgba(52, 211, 153, 0.15);
          color: #34D399;
          border-color: rgba(52, 211, 153, 0.35);
        }

        .role-tag-player {
          background: rgba(248, 113, 113, 0.12);
          color: #FCA5A5;
          border-color: rgba(248, 113, 113, 0.25);
        }

        .role-change-control {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .role-select-inline {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          color: #FFFFFF;
          padding: 5px 8px;
          font-size: 0.78rem;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .role-select-inline:focus {
          border-color: var(--friba-blue);
          box-shadow: 0 0 10px rgba(11, 95, 255, 0.3);
        }

        .role-select-inline option {
          background: #0B111F;
          color: #FFFFFF;
        }

        .btn-delete-member {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #F87171;
          border-radius: 6px;
          padding: 5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-delete-member:hover {
          background: rgba(239, 68, 68, 0.25);
          color: #EF4444;
        }

        .btn-code-copy {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 3px 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #93C5FD;
          cursor: pointer;
          font-size: 0.75rem;
        }

        .btn-code-copy:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .status-pill {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 9999px;
        }

        .status-pill-pendente {
          background: rgba(245, 158, 11, 0.15);
          color: #FBBF24;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .status-pill-aceito {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .btn-action-icon {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-light);
          padding: 5px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-action-icon:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
        }

        .empty-invites-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          color: var(--text-dim);
          font-size: 0.85rem;
          gap: 8px;
        }

      `}</style>
    </div>
  );
};

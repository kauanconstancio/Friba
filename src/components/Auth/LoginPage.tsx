import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Crown, 
  AlertCircle,
  Ticket,
  Sparkles
} from 'lucide-react';
import type { AppUser } from '../../types';
import { authLogin, DEFAULT_OWNER_USER } from '../../services/supabase';

interface LoginPageProps {
  onLoginSuccess: (user: AppUser) => void;
  onOpenInviteModal: (code?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onOpenInviteModal,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'invite'>('login');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Invite code state
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authLogin(email.trim(), password.trim());
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillOwner = () => {
    setEmail(DEFAULT_OWNER_USER.email);
    setPassword(DEFAULT_OWNER_USER.password || 'Kmc@130606');
    setErrorMessage(null);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) {
      setErrorMessage('Informe o código de convite da equipe.');
      return;
    }
    onOpenInviteModal(inviteCodeInput.trim().toUpperCase());
  };

  return (
    <div className="login-screen-wrapper">
      {/* Luz ambiente temática */}
      <div className="login-ambient-glow" />

      <div className="login-card-container">
        {/* Cabeçalho da Marca Friba */}
        <div className="login-brand-header">
          <div className="login-logo-wrapper">
            <img src="/friba-logo.png" alt="Friba Esports" className="login-logo-img" />
            <div className="login-logo-pulse" />
          </div>
          <h1 className="login-brand-title">
            FRIBA <span className="brand-red">ESPORTS</span>
          </h1>
          <p className="login-brand-subtitle">
            CENTRAL DE OPERAÇÕES & GESTÃO COMPETITIVA
          </p>
        </div>

        {/* Abas Superiores: Login vs Resgatar Convite */}
        <div className="login-tabs-nav">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
            }}
          >
            <Lock size={15} />
            <span>Acessar Conta</span>
          </button>

          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'invite' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('invite');
              setErrorMessage(null);
            }}
          >
            <Ticket size={15} />
            <span>Resgatar Convite</span>
          </button>
        </div>

        {/* Alerta de Erro */}
        {errorMessage && (
          <div className="login-error-banner">
            <AlertCircle size={18} className="login-error-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulário de Login */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="login-input-group">
              <label htmlFor="login-email">E-mail de Acesso</label>
              <div className="login-input-box">
                <Mail size={18} className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kauanconstancio13@gmail.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <div className="login-input-header-row">
                <label htmlFor="login-password">Senha de Segurança</label>
              </div>
              <div className="login-input-box">
                <Lock size={18} className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-submit-btn"
            >
              {isLoading ? (
                <div className="login-spinner" />
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Cartão de Acesso Rápido do Dono */}
            <div className="login-quick-card">
              <div className="login-quick-header">
                <div className="login-quick-badge">
                  <Crown size={12} color="#F59E0B" />
                  <span>Conta do Dono Registrada</span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFillOwner}
                  className="login-quick-fill-btn"
                >
                  Preencher dados
                </button>
              </div>
              <div className="login-quick-details">
                <span className="login-quick-user">{DEFAULT_OWNER_USER.email}</span>
                <span className="login-quick-role">Cargo: Dono da Equipe</span>
              </div>
            </div>
          </form>
        )}

        {/* Aba: Resgatar Convite */}
        {activeTab === 'invite' && (
          <form onSubmit={handleInviteSubmit} className="login-form">
            <div className="login-invite-info">
              <Sparkles size={18} color="#38BDF8" />
              <p>
                Foi convidado pela gestão da <strong>Friba Esports</strong>? Digite seu código de convite para cadastrar seu perfil oficial.
              </p>
            </div>

            <div className="login-input-group">
              <label htmlFor="invite-code">Código do Convite</label>
              <div className="login-input-box">
                <Ticket size={18} className="login-input-icon" />
                <input
                  id="invite-code"
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  placeholder="EX: FRB-9X4K2P"
                  autoFocus
                />
              </div>
              <span className="login-input-hint">Código de 6 a 12 caracteres gerado pelo Dono.</span>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
            >
              <Ticket size={18} />
              <span>Validar e Cadastrar Perfil</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Rodapé da Tela de Login */}
        <div className="login-card-footer">
          <p>
            Sistema Friba Esports • Pokémon Unite Competitive Suite
          </p>
        </div>
      </div>
    </div>
  );
};

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { 
  AppUser, 
  TeamInvite, 
  Role, 
  TeamMember, 
  ScrimEvent, 
  StrategyPlan, 
  TeamAnnouncement,
  PokemonRole,
  Lane
} from '../types';
import { 
  INITIAL_MEMBERS, 
  INITIAL_SCRIMS, 
  INITIAL_PRESETS, 
  INITIAL_ANNOUNCEMENTS 
} from '../data/initialData';

// Chaves padrão via variáveis de ambiente Vite ou salvas no localStorage
const STORAGE_KEY_URL = 'friba_supabase_url';
const STORAGE_KEY_ANON = 'friba_supabase_anon_key';

export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_ANON) || '';

  return {
    url: localUrl || envUrl || '',
    key: localKey || envKey || '',
  };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (url.trim()) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
  }

  if (key.trim()) {
    localStorage.setItem(STORAGE_KEY_ANON, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_ANON);
  }

  reinitSupabaseClient();
};

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (cachedClient) return cachedClient;

  const { url, key } = getSupabaseConfig();
  if (url && key) {
    try {
      cachedClient = createClient(url, key);
      return cachedClient;
    } catch (err) {
      console.warn('Falha ao inicializar cliente Supabase:', err);
      return null;
    }
  }
  return null;
};

export const reinitSupabaseClient = () => {
  cachedClient = null;
  return getSupabaseClient();
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.includes('supabase.co'));
};

// Teste de conexão
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'URL e Anon Key do Supabase não configuradas no arquivo .env.',
    };
  }

  try {
    const { error } = await client.from('users').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Conectado ao Supabase! (Aviso: execute o script SQL do schema.sql no SQL Editor).',
        };
      }
      return {
        success: false,
        message: `Erro do Supabase: ${error.message}`,
      };
    }
    return {
      success: true,
      message: 'Conexão com o Supabase estabelecida com sucesso!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha na requisição: ${err.message || 'Erro de rede'}`,
    };
  }
};

/* ==========================================================
   USUÁRIO DONO PADRÃO & MOCKS LOCAIS
   ========================================================== */
export const DEFAULT_OWNER_USER: AppUser = {
  id: 'user-owner-friba',
  email: 'kauanconstancio13@gmail.com',
  password: 'Kmc@130606',
  name: 'Kauan Constâncio',
  nickname: 'Kauan',
  role: 'Dono',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  discord: 'kauan#0001',
  isOwner: true,
  createdAt: new Date().toISOString(),
};

const LOCAL_USERS_KEY = 'friba_db_users_v3';
const LOCAL_INVITES_KEY = 'friba_db_invites_v2';
const LOCAL_MEMBERS_KEY = 'friba_team_members_v4';
const LOCAL_SCRIMS_KEY = 'friba_team_scrims_v4';
const LOCAL_PRESETS_KEY = 'friba_team_presets_v4';
const LOCAL_ANNOUNCEMENTS_KEY = 'friba_team_announcements_v4';
export const AUTH_SESSION_KEY = 'friba_auth_user_session';

/* ==========================================================
   0. SISTEMA DE AUTENTICAÇÃO E LOGIN
   ========================================================== */
export const authLogin = async (
  email: string, 
  password: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, error: 'Por favor, informe seu e-mail e senha.' };
  }

  // 1. Verificação prioritária do Dono da equipe
  if (
    cleanEmail === DEFAULT_OWNER_USER.email.toLowerCase() &&
    cleanPass === DEFAULT_OWNER_USER.password
  ) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(DEFAULT_OWNER_USER));
    return { success: true, user: DEFAULT_OWNER_USER };
  }

  // 2. Se o Supabase estiver configurado, verificar na nuvem
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      // 2a. Supabase Auth Oficial (se estiver configurado no projeto)
      const { data: authData, error: authErr } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (!authErr && authData.user) {
        const { data: profile } = await client
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .single();

        const userObj: AppUser = profile ? {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          nickname: profile.nickname,
          role: profile.role as Role,
          avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          discord: profile.discord || '',
          inGameId: profile.in_game_id || '',
          isOwner: profile.is_owner ?? (profile.role === 'Dono'),
          createdAt: profile.created_at || new Date().toISOString(),
        } : {
          id: authData.user.id,
          email: authData.user.email || cleanEmail,
          name: authData.user.user_metadata?.name || cleanEmail.split('@')[0],
          nickname: authData.user.user_metadata?.nickname || cleanEmail.split('@')[0],
          role: 'Jogador',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userObj));
        return { success: true, user: userObj };
      }

      // 2b. Verificação na tabela users
      const { data: dbUser } = await client
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (dbUser && dbUser.password === cleanPass) {
        const userObj: AppUser = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          nickname: dbUser.nickname,
          role: dbUser.role as Role,
          avatar: dbUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          discord: dbUser.discord || '',
          inGameId: dbUser.in_game_id || '',
          isOwner: dbUser.is_owner ?? (dbUser.role === 'Dono'),
          createdAt: dbUser.created_at || new Date().toISOString(),
        };

        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userObj));
        return { success: true, user: userObj };
      }
    } catch (err) {
      console.warn('Erro ao autenticar com Supabase:', err);
    }
  }

  // 3. Fallback no banco local / localStorage
  const users = await dbFetchUsers();
  const matched = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (matched) {
    if (matched.password === cleanPass) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(matched));
      return { success: true, user: matched };
    } else if (!matched.password) {
      // Usuário existente sem senha configurada: registra a senha informada
      matched.password = cleanPass;
      await dbCreateOrUpdateUser(matched);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(matched));
      return { success: true, user: matched };
    }
  }

  return {
    success: false,
    error: 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.'
  };
};

export const authGetSession = (): AppUser | null => {
  const session = localStorage.getItem(AUTH_SESSION_KEY);
  if (session) {
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  }
  return null;
};

export const authLogout = async (): Promise<void> => {
  localStorage.removeItem(AUTH_SESSION_KEY);
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      await client.auth.signOut();
    } catch {
      // Ignore
    }
  }
};

/* ==========================================================
   1. OPERAÇÕES DE USUÁRIOS
   ========================================================== */
export const dbFetchUsers = async (): Promise<AppUser[]> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          email: item.email,
          password: item.password,
          name: item.name || item.email.split('@')[0],
          nickname: item.nickname || item.name || '',
          role: item.role as Role,
          avatar: item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          discord: item.discord || '',
          inGameId: item.in_game_id || '',
          isOwner: item.is_owner ?? (item.role === 'Dono'),
          createdAt: item.created_at || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('Erro ao buscar usuários no Supabase, usando armazenamento local:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_USERS_KEY);
  return local ? JSON.parse(local) : [DEFAULT_OWNER_USER];
};

export const dbCreateOrUpdateUser = async (user: AppUser): Promise<AppUser> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const payload: any = {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        role: user.role,
        avatar: user.avatar,
        discord: user.discord || null,
        in_game_id: user.inGameId || null,
        is_owner: user.isOwner ?? (user.role === 'Dono'),
      };
      if (user.password) {
        payload.password = user.password;
      }

      const { data, error } = await client
        .from('users')
        .upsert(payload)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          password: data.password,
          name: data.name,
          nickname: data.nickname,
          role: data.role as Role,
          avatar: data.avatar,
          discord: data.discord || '',
          inGameId: data.in_game_id || '',
          isOwner: data.is_owner,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn('Erro ao salvar usuário no Supabase:', err);
    }
  }

  const users = await dbFetchUsers();
  const exists = users.some(u => u.id === user.id);
  const updated = exists ? users.map(u => u.id === user.id ? user : u) : [user, ...users];
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
  return user;
};

export const dbUpdateUserRole = async (userId: string, newRole: Role): Promise<void> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      await client
        .from('users')
        .update({ role: newRole, is_owner: newRole === 'Dono' })
        .eq('id', userId);

      // Também sincroniza na tabela de membros se o usuário estiver lá
      await client
        .from('team_members')
        .update({ role: newRole })
        .eq('user_id', userId);

      return;
    } catch (err) {
      console.warn('Erro ao atualizar cargo no Supabase:', err);
    }
  }

  const users = await dbFetchUsers();
  const updated = users.map(u => u.id === userId ? { ...u, role: newRole, isOwner: newRole === 'Dono' } : u);
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
};

export const dbDeleteUser = async (userId: string): Promise<void> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      await client.from('users').delete().eq('id', userId);
      return;
    } catch (err) {
      console.warn('Erro ao deletar usuário no Supabase:', err);
    }
  }

  const users = await dbFetchUsers();
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users.filter(u => u.id !== userId)));
};

/* ==========================================================
   2. OPERAÇÕES DE CONVITES
   ========================================================== */
export const dbFetchInvites = async (): Promise<TeamInvite[]> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('team_invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          id: item.id,
          email: item.email,
          name: item.name || '',
          role: item.role as Role,
          status: item.status,
          invitedBy: item.invited_by,
          invitedByName: item.invited_by_name || 'Dono',
          inviteCode: item.invite_code,
          createdAt: item.created_at,
          expiresAt: item.expires_at,
        }));
      }
    } catch (err) {
      console.warn('Erro ao buscar convites no Supabase:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_INVITES_KEY);
  return local ? JSON.parse(local) : [];
};

export const dbCreateInvite = async (
  inviteData: Omit<TeamInvite, 'id' | 'createdAt'>
): Promise<TeamInvite> => {
  const newInvite: TeamInvite = {
    ...inviteData,
    id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const payload = {
        id: newInvite.id,
        email: newInvite.email,
        name: newInvite.name || null,
        role: newInvite.role,
        status: newInvite.status,
        invited_by: newInvite.invitedBy,
        invited_by_name: newInvite.invitedByName,
        invite_code: newInvite.inviteCode,
      };

      const { data, error } = await client
        .from('team_invites')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          name: data.name || '',
          role: data.role as Role,
          status: data.status,
          invitedBy: data.invited_by,
          invitedByName: data.invited_by_name,
          inviteCode: data.invite_code,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn('Erro ao criar convite no Supabase:', err);
    }
  }

  const invites = await dbFetchInvites();
  const updated = [newInvite, ...invites];
  localStorage.setItem(LOCAL_INVITES_KEY, JSON.stringify(updated));
  return newInvite;
};

export const dbFindInviteByCode = async (code: string): Promise<TeamInvite | null> => {
  const cleanCode = code.trim().toUpperCase();
  const client = getSupabaseClient();

  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('team_invites')
        .select('*')
        .ilike('invite_code', cleanCode)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          name: data.name || '',
          role: data.role as Role,
          status: data.status,
          invitedBy: data.invited_by,
          invitedByName: data.invited_by_name || 'Dono',
          inviteCode: data.invite_code,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn('Erro ao buscar convite no Supabase:', err);
    }
  }

  const invites = await dbFetchInvites();
  return invites.find(i => i.inviteCode.toUpperCase() === cleanCode) || null;
};

export const dbDeleteInvite = async (inviteId: string): Promise<void> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      await client.from('team_invites').delete().eq('id', inviteId);
      return;
    } catch (err) {
      console.warn('Erro ao excluir convite no Supabase:', err);
    }
  }

  const invites = await dbFetchInvites();
  localStorage.setItem(LOCAL_INVITES_KEY, JSON.stringify(invites.filter(i => i.id !== inviteId)));
};

/* ==========================================================
   3. OPERAÇÕES DE MEMBROS DA EQUIPE (Aba "Equipes" / Roster)
   ========================================================== */
export const dbFetchMembers = async (): Promise<TeamMember[]> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          userId: item.user_id || undefined,
          name: item.name,
          nickname: item.nickname,
          tag: item.tag || '',
          role: item.role as Role,
          avatar: item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          discord: item.discord || '',
          inGameId: item.in_game_id || '',
          email: item.email || '',
          gameRole: (item.game_role as PokemonRole) || 'All-Rounder',
          preferredLane: (item.preferred_lane as Lane) || 'Jungle',
          mainPokemon: Array.isArray(item.main_pokemon) ? item.main_pokemon : ['ceruledge'],
          status: (item.status as 'Titular' | 'Reserva') || 'Titular',
          specialtyOrTitle: item.specialty_or_title || '',
          coachNotes: item.coach_notes || '',
        }));
      }
    } catch (err) {
      console.warn('Erro ao buscar membros no Supabase, usando armazenamento local:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_MEMBERS_KEY);
  return local ? JSON.parse(local) : INITIAL_MEMBERS;
};

export const dbSaveMember = async (member: TeamMember): Promise<TeamMember> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const payload = {
        id: member.id,
        user_id: member.userId || null,
        name: member.name,
        nickname: member.nickname,
        tag: member.tag || null,
        role: member.role,
        avatar: member.avatar,
        discord: member.discord || null,
        in_game_id: member.inGameId || null,
        email: member.email || null,
        game_role: member.gameRole || null,
        preferred_lane: member.preferredLane || null,
        main_pokemon: member.mainPokemon || [],
        status: member.status || 'Titular',
        specialty_or_title: member.specialtyOrTitle || null,
        coach_notes: member.coachNotes || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await client
        .from('team_members')
        .upsert(payload)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          nickname: data.nickname,
          tag: data.tag || '',
          role: data.role as Role,
          avatar: data.avatar,
          discord: data.discord || '',
          inGameId: data.in_game_id || '',
          email: data.email || '',
          gameRole: data.game_role as PokemonRole,
          preferredLane: data.preferred_lane as Lane,
          mainPokemon: data.main_pokemon || [],
          status: data.status as 'Titular' | 'Reserva',
          specialtyOrTitle: data.specialty_or_title || '',
          coachNotes: data.coach_notes || '',
        };
      }
    } catch (err) {
      console.warn('Erro ao salvar membro no Supabase:', err);
    }
  }

  const members = await dbFetchMembers();
  const exists = members.some(m => m.id === member.id);
  const updated = exists ? members.map(m => m.id === member.id ? member : m) : [...members, member];
  localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(updated));
  return member;
};

export const dbDeleteMember = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      await client.from('team_members').delete().eq('id', id);
      return;
    } catch (err) {
      console.warn('Erro ao remover membro do Supabase:', err);
    }
  }

  const members = await dbFetchMembers();
  localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(members.filter(m => m.id !== id)));
};

/* ==========================================================
   4. FLUXO CRÍTICO: ACEITAR CONVITE & CADASTRO DO JOGADOR
   Alimenta o banco e o Roster com as informações fornecidas pelo jogador
   ========================================================== */
export interface PlayerRegistrationData {
  name: string;
  nickname: string;
  password?: string;
  tag?: string;
  avatar?: string;
  discord: string;
  inGameId: string;
  email: string;
  role?: Role;
  gameRole?: PokemonRole;
  preferredLane?: Lane;
  mainPokemon?: string[];
  status?: 'Titular' | 'Reserva';
  specialtyOrTitle?: string;
  coachNotes?: string;
}

export const dbAcceptInviteAndRegisterPlayer = async (
  inviteCode: string,
  data: PlayerRegistrationData
): Promise<{ member: TeamMember; user: AppUser }> => {
  const cleanCode = inviteCode.trim().toUpperCase();
  let invite = await dbFindInviteByCode(cleanCode);

  if (!invite) {
    // Fallback resiliente: aceitar código válido da Friba gerado via URL
    if (cleanCode.startsWith('FRIBA-') || cleanCode.startsWith('FRB-')) {
      const validRoles: Role[] = ['Dono', 'Manager', 'Coach', 'Jogador'];
      const assigned = (data.role && validRoles.includes(data.role)) ? data.role : 'Jogador';
      invite = {
        id: `inv-${cleanCode}`,
        email: data.email || '',
        name: data.name || '',
        role: assigned,
        status: 'Pendente',
        invitedBy: 'friba-admin',
        invitedByName: 'Comissão Técnica Friba',
        inviteCode: cleanCode,
        createdAt: new Date().toISOString(),
      };
    } else {
      throw new Error('Código de convite inválido ou expirado.');
    }
  }

  if (invite.status === 'Aceito') {
    throw new Error('Este convite já foi utilizado anteriormente.');
  }

  const userId = `user-${Date.now()}`;
  const memberId = `member-${Date.now()}`;
  const assignedRole = data.role || invite.role || 'Jogador';

  // 1. Criar Objeto de Usuário com a senha definida pelo jogador
  const newUser: AppUser = {
    id: userId,
    email: data.email || invite.email,
    password: data.password || '123456',
    name: data.name,
    nickname: data.nickname,
    role: assignedRole,
    avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    discord: data.discord,
    inGameId: data.inGameId,
    isOwner: assignedRole === 'Dono',
    createdAt: new Date().toISOString(),
  };

  // 2. Criar Objeto de Membro da Equipe (para o Roster)
  const newMember: TeamMember = {
    id: memberId,
    userId: userId,
    name: data.name,
    nickname: data.nickname,
    tag: data.tag || `@DU · ${data.nickname.toUpperCase()}`,
    role: assignedRole,
    avatar: newUser.avatar,
    discord: data.discord,
    inGameId: data.inGameId,
    email: data.email || invite.email,
    gameRole: data.gameRole || 'All-Rounder',
    preferredLane: data.preferredLane || 'Jungle',
    mainPokemon: data.mainPokemon && data.mainPokemon.length > 0 ? data.mainPokemon : ['ceruledge'],
    status: data.status || 'Titular',
    specialtyOrTitle: data.specialtyOrTitle || (assignedRole !== 'Jogador' ? assignedRole : undefined),
    coachNotes: data.coachNotes || 'Entrou via convite oficial.',
  };

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      // 1. Atualizar status do convite para 'Aceito' (ou registrar caso não estivesse na nuvem)
      await client
        .from('team_invites')
        .upsert({
          id: invite.id,
          email: data.email || invite.email,
          name: data.name || invite.name || null,
          role: assignedRole,
          status: 'Aceito',
          invited_by: invite.invitedBy,
          invited_by_name: invite.invitedByName,
          invite_code: cleanCode,
        });

      // 2. Inserir em users (com e-mail e a senha criada)
      await client.from('users').upsert({
        id: newUser.id,
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
        nickname: newUser.nickname,
        role: newUser.role,
        avatar: newUser.avatar,
        discord: newUser.discord,
        in_game_id: newUser.inGameId,
        is_owner: newUser.isOwner,
      });

      // 3. Inserir em team_members
      await client.from('team_members').upsert({
        id: newMember.id,
        user_id: newMember.userId,
        name: newMember.name,
        nickname: newMember.nickname,
        tag: newMember.tag,
        role: newMember.role,
        avatar: newMember.avatar,
        discord: newMember.discord,
        in_game_id: newMember.inGameId,
        email: newMember.email,
        game_role: newMember.gameRole,
        preferred_lane: newMember.preferredLane,
        main_pokemon: newMember.mainPokemon,
        status: newMember.status,
        specialty_or_title: newMember.specialtyOrTitle,
        coach_notes: newMember.coachNotes,
      });
    } catch (err) {
      console.warn('Erro ao registrar jogador no Supabase, salvando localmente:', err);
    }
  }

  // Atualizar cache local
  const currentInvites = await dbFetchInvites();
  const updatedInvites = currentInvites.map(i => i.id === invite.id ? { ...i, status: 'Aceito' as const } : i);
  if (!updatedInvites.some(i => i.id === invite.id)) {
    updatedInvites.unshift({ ...invite, status: 'Aceito' as const });
  }
  localStorage.setItem(LOCAL_INVITES_KEY, JSON.stringify(updatedInvites));

  const currentMembers = await dbFetchMembers();
  localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify([...currentMembers, newMember]));

  const currentUsers = await dbFetchUsers();
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([newUser, ...currentUsers.filter(u => u.id !== newUser.id)]));

  return { member: newMember, user: newUser };
};

/* ==========================================================
   5. OPERAÇÕES DE SCRIMS & AGENDA
   ========================================================== */
export const dbFetchScrims = async (): Promise<ScrimEvent[]> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('scrim_events')
        .select('*')
        .order('date', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          opponentTeam: item.opponent_team,
          opponentTag: item.opponent_tag,
          title: item.title,
          opponentContact: item.opponent_contact,
          date: item.date,
          time: item.time,
          endTime: item.end_time,
          format: item.format,
          status: item.status,
          category: item.category,
          lineup: item.lineup || [],
          score: item.score || { us: 0, them: 0 },
          vodUrl: item.vod_url,
          notes: item.notes,
        }));
      }
    } catch (err) {
      console.warn('Erro ao buscar scrims no Supabase:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_SCRIMS_KEY);
  return local ? JSON.parse(local) : INITIAL_SCRIMS;
};

export const dbSaveScrim = async (scrim: ScrimEvent): Promise<ScrimEvent> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const payload = {
        id: scrim.id,
        opponent_team: scrim.opponentTeam,
        opponent_tag: scrim.opponentTag,
        title: scrim.title || null,
        opponent_contact: scrim.opponentContact || null,
        date: scrim.date,
        time: scrim.time,
        end_time: scrim.endTime || null,
        format: scrim.format,
        status: scrim.status,
        category: scrim.category || 'Treino',
        lineup: scrim.lineup || [],
        score: scrim.score || { us: 0, them: 0 },
        vod_url: scrim.vodUrl || null,
        notes: scrim.notes || null,
      };

      await client.from('scrim_events').upsert(payload);
    } catch (err) {
      console.warn('Erro ao salvar scrim no Supabase:', err);
    }
  }

  const scrims = await dbFetchScrims();
  const exists = scrims.some(s => s.id === scrim.id);
  const updated = exists ? scrims.map(s => s.id === scrim.id ? scrim : s) : [scrim, ...scrims];
  localStorage.setItem(LOCAL_SCRIMS_KEY, JSON.stringify(updated));
  return scrim;
};

export const dbDeleteScrim = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      await client.from('scrim_events').delete().eq('id', id);
    } catch (err) {
      console.warn('Erro ao deletar scrim no Supabase:', err);
    }
  }

  const scrims = await dbFetchScrims();
  localStorage.setItem(LOCAL_SCRIMS_KEY, JSON.stringify(scrims.filter(s => s.id !== id)));
};

/* ==========================================================
   6. OPERAÇÕES DE PRANCHETA TÁTICA / PRESETS
   ========================================================== */
export const dbFetchStrategyPlans = async (): Promise<StrategyPlan[]> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('strategy_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          title: item.title,
          phaseTime: item.phase_time || '',
          description: item.description || '',
          elements: item.elements || [],
        }));
      }
    } catch (err) {
      console.warn('Erro ao buscar táticas no Supabase:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_PRESETS_KEY);
  return local ? JSON.parse(local) : INITIAL_PRESETS;
};

export const dbSaveStrategyPlan = async (plan: StrategyPlan): Promise<StrategyPlan> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const payload = {
        id: plan.id,
        title: plan.title,
        phase_time: plan.phaseTime || null,
        description: plan.description || '',
        elements: plan.elements || [],
        updated_at: new Date().toISOString(),
      };

      await client.from('strategy_plans').upsert(payload);
    } catch (err) {
      console.warn('Erro ao salvar plano no Supabase:', err);
    }
  }

  const plans = await dbFetchStrategyPlans();
  const exists = plans.some(p => p.id === plan.id);
  const updated = exists ? plans.map(p => p.id === plan.id ? plan : p) : [plan, ...plans];
  localStorage.setItem(LOCAL_PRESETS_KEY, JSON.stringify(updated));
  return plan;
};

/* ==========================================================
   7. OPERAÇÕES DE AVISOS / ANNOUNCEMENTS
   ========================================================== */
export const dbFetchAnnouncements = async (): Promise<TeamAnnouncement[]> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('team_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          author: item.author,
          date: item.date,
          priority: item.priority || 'Normal',
        }));
      }
    } catch (err) {
      console.warn('Erro ao buscar avisos no Supabase:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_ANNOUNCEMENTS_KEY);
  return local ? JSON.parse(local) : INITIAL_ANNOUNCEMENTS;
};

export const dbSaveAnnouncement = async (announcement: TeamAnnouncement): Promise<TeamAnnouncement> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const payload = {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        author: announcement.author,
        date: announcement.date,
        priority: announcement.priority || 'Normal',
      };

      await client.from('team_announcements').upsert(payload);
    } catch (err) {
      console.warn('Erro ao salvar aviso no Supabase:', err);
    }
  }

  const items = await dbFetchAnnouncements();
  const updated = [announcement, ...items.filter(a => a.id !== announcement.id)];
  localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(updated));
  return announcement;
};

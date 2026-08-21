import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Key,
  Copy,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Search,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  AlertTriangle,
  Crown,
  FileText,
  Share2,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';
import { AppUser, UserRole, UserAccessDuration, UserStatus, DbState } from '../types';
import {
  calculateExpirationDate,
  extendUserAccess,
  getUserEffectiveStatus,
  formatDurationLabel,
  DEFAULT_MASTER_USER
} from '../services/authService';
import { getNextUniqueId } from '../utils/idGenerator';

// Helper to determine clean base app URL
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}`;
  }
  return 'https://sistema-full-bet-lucianofelixmacedo.vercel.app/';
}

export function getConsultaPortalUrl(): string {
  const base = getAppBaseUrl();
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}mode=consulta`;
}

export function getUserAccessUrl(username: string): string {
  const base = getAppBaseUrl();
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}user=${encodeURIComponent(username)}`;
}

interface UserManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentAuthUser: AppUser | null;
  onSaveUsers: (updatedUsers: AppUser[]) => void;
  onSwitchUser?: (user: AppUser) => void;
}

export const UserManagerModal: React.FC<UserManagerModalProps> = ({
  isOpen,
  onClose,
  users = [],
  currentAuthUser,
  onSaveUsers,
  onSwitchUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'MASTER' | 'CONSULTOR'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'BLOCKED'>('ALL');

  // New / Edit User Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('CONSULTOR');
  const [formDuration, setFormDuration] = useState<UserAccessDuration>('30_DAYS');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Quick Extend Menu state
  const [quickExtendUserId, setQuickExtendUserId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [portalCopyFeedback, setPortalCopyFeedback] = useState(false);

  if (!isOpen) return null;

  // Filter users
  const filteredUsers = users.filter(user => {
    const eff = getUserEffectiveStatus(user);

    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.notes && user.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') matchesStatus = eff.status === 'ACTIVE';
    if (statusFilter === 'EXPIRED') matchesStatus = eff.status === 'EXPIRED';
    if (statusFilter === 'BLOCKED') matchesStatus = eff.status === 'BLOCKED';

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate quick stats
  const totalCount = users.length;
  const activeCount = users.filter(u => getUserEffectiveStatus(u).status === 'ACTIVE').length;
  const expiredCount = users.filter(u => getUserEffectiveStatus(u).status === 'EXPIRED').length;
  const blockedCount = users.filter(u => getUserEffectiveStatus(u).status === 'BLOCKED').length;

  const handleOpenCreateForm = () => {
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormPassword(Math.random().toString(36).substring(2, 8)); // auto-generated friendly password
    setFormRole('CONSULTOR');
    setFormDuration('30_DAYS');
    setFormNotes('');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user: AppUser) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword(user.password || '');
    setFormRole(user.role);
    setFormDuration(user.duration);
    setFormNotes(user.notes || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = formName.trim();
    const trimmedUsername = formUsername.trim().toLowerCase();
    const trimmedPassword = formPassword.trim();

    if (!trimmedName) {
      setFormError('Por favor, informe o nome completo do usuário.');
      return;
    }
    if (!trimmedUsername) {
      setFormError('Por favor, informe um login / e-mail de acesso.');
      return;
    }
    if (!trimmedPassword) {
      setFormError('Por favor, informe uma senha.');
      return;
    }

    // Check duplicate username
    const isDuplicate = users.some(
      u => u.id !== editingUserId && u.username.toLowerCase() === trimmedUsername
    );
    if (isDuplicate) {
      setFormError(`O login "${trimmedUsername}" já está em uso por outro usuário.`);
      return;
    }

    if (editingUserId) {
      // Update existing
      const updated = users.map(u => {
        if (u.id === editingUserId) {
          let newExpiresAt = u.expiresAt;
          if (formRole === 'MASTER' || formDuration === 'LIFETIME') {
            newExpiresAt = null;
          } else if (formDuration !== u.duration) {
            // Recompute duration from today
            newExpiresAt = calculateExpirationDate(formDuration);
          }

          return {
            ...u,
            name: trimmedName,
            username: trimmedUsername,
            password: trimmedPassword,
            role: formRole,
            duration: formDuration,
            expiresAt: newExpiresAt,
            notes: formNotes.trim(),
            status: u.status === 'BLOCKED' ? ('BLOCKED' as UserStatus) : ('ACTIVE' as UserStatus),
          };
        }
        return u;
      });

      onSaveUsers(updated);
    } else {
      // Create new user
      const newId = getNextUniqueId('USER', users.map(u => u.id));
      const expiresAt = formRole === 'MASTER' ? null : calculateExpirationDate(formDuration);

      const newUser: AppUser = {
        id: newId,
        name: trimmedName,
        username: trimmedUsername,
        password: trimmedPassword,
        role: formRole,
        duration: formDuration,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        expiresAt,
        notes: formNotes.trim(),
      };

      onSaveUsers([...users, newUser]);
    }

    setIsFormOpen(false);
  };

  const handleToggleBlockUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (user.role === 'MASTER' && user.id === currentAuthUser?.id) {
      alert('Você não pode bloquear seu próprio perfil Master!');
      return;
    }

    const nextStatus: UserStatus = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    const updated = users.map(u => (u.id === userId ? { ...u, status: nextStatus } : u));
    onSaveUsers(updated);
  };

  const handleQuickExtend = (userId: string, duration: UserAccessDuration) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const { expiresAt, duration: newDur } = extendUserAccess(user, duration);
    const updated = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          expiresAt,
          duration: newDur,
          status: 'ACTIVE' as UserStatus,
        };
      }
      return u;
    });

    onSaveUsers(updated);
    setQuickExtendUserId(null);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentAuthUser?.id) {
      alert('Você não pode excluir o seu próprio perfil atual!');
      return;
    }

    const mastersCount = users.filter(u => u.role === 'MASTER').length;
    const isTargetMaster = users.find(u => u.id === userId)?.role === 'MASTER';
    if (isTargetMaster && mastersCount <= 1) {
      alert('Não é possível excluir o único perfil Master do sistema.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      const updated = users.filter(u => u.id !== userId);
      onSaveUsers(updated);
    }
  };

  const handleCopyAccessCredentials = (user: AppUser) => {
    const eff = getUserEffectiveStatus(user);
    const directLink = getUserAccessUrl(user.username);
    const text = `⚽ *ACESSO AO SISTEMA DE ANÁLISE FULL BET (FUTLFM2)*\n\n👤 *Nome:* ${user.name}\n🔑 *Login:* ${user.username}\n🔒 *Senha:* ${user.password}\n⭐ *Perfil:* ${user.role === 'MASTER' ? 'Administrador Master' : 'Consulta & Análise Esportiva'}\n⏳ *Validade do Acesso:* ${eff.formattedExpiresAt}\n\n🔗 *Link Direto de Acesso:*\n${directLink}\n\n💡 *Como Acessar:*\nBasta clicar no link acima e digitar sua senha para entrar.`;

    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(user.id);
      setTimeout(() => setCopyFeedback(null), 3000);
    });
  };

  const handleCopyDirectLink = (user: AppUser) => {
    const directLink = getUserAccessUrl(user.username);
    navigator.clipboard.writeText(directLink).then(() => {
      setCopyFeedback(`link-${user.id}`);
      setTimeout(() => setCopyFeedback(null), 3000);
    });
  };

  const handleCopyConsultaPortal = () => {
    const portalUrl = getConsultaPortalUrl();
    navigator.clipboard.writeText(portalUrl).then(() => {
      setPortalCopyFeedback(true);
      setTimeout(() => setPortalCopyFeedback(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Gestão de Usuários & Permissões
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-bold">
                  Exclusivo Master
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Controle quem pode acessar o sistema e defina prazos de uso (30d, 90d, 180d, 1 ano ou Vitalício).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateForm}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Usuários</p>
              <p className="text-lg sm:text-xl font-black text-slate-900">{totalCount}</p>
            </div>
            <Users className="w-6 h-6 text-slate-400" />
          </div>

          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Acessos Ativos</p>
              <p className="text-lg sm:text-xl font-black text-emerald-700">{activeCount}</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>

          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Expirados</p>
              <p className="text-lg sm:text-xl font-black text-amber-700">{expiredCount}</p>
            </div>
            <Clock className="w-6 h-6 text-amber-500" />
          </div>

          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-red-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">Bloqueados</p>
              <p className="text-lg sm:text-xl font-black text-red-700">{blockedCount}</p>
            </div>
            <Lock className="w-6 h-6 text-red-500" />
          </div>
        </div>

        {/* Links de Compartilhamento / Portal de Consulta */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                  Link para Usuários de Consulta
                </span>
                <span className="px-1.5 py-0.2 bg-blue-200 text-blue-900 rounded text-[10px] font-bold">
                  Portal Seguro
                </span>
              </div>
              <p className="text-xs text-blue-800/90 mt-0.5">
                Envie este link direto aos clientes/consultores para abrirem o sistema diretamente no modo consulta seguro.
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <code className="bg-white border border-blue-300 text-blue-950 px-2 py-0.5 rounded font-mono font-bold text-[11px] select-all break-all">
                  {getConsultaPortalUrl()}
                </code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={handleCopyConsultaPortal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {portalCopyFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-300" />
                  <span>Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link de Consulta</span>
                </>
              )}
            </button>
            <a
              href={getConsultaPortalUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-xl text-xs font-bold transition-colors"
              title="Abrir Portal de Consulta em Nova Aba"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Testar Link</span>
            </a>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, login, notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* Role Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0 font-medium">
              <button
                onClick={() => setRoleFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  roleFilter === 'ALL' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos Tipos
              </button>
              <button
                onClick={() => setRoleFilter('MASTER')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  roleFilter === 'MASTER' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👑 Master
              </button>
              <button
                onClick={() => setRoleFilter('CONSULTOR')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  roleFilter === 'CONSULTOR' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👁️ Consulta
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0 font-medium">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-800 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Status
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setStatusFilter('EXPIRED')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === 'EXPIRED' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expirados
              </button>
              <button
                onClick={() => setStatusFilter('BLOCKED')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === 'BLOCKED' ? 'bg-red-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bloqueados
              </button>
            </div>
          </div>
        </div>

        {/* Users List Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhum usuário encontrado</p>
              <p className="text-xs text-slate-400 mt-1">Tente ajustar os filtros ou cadastre um novo usuário.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredUsers.map(user => {
                const eff = getUserEffectiveStatus(user);
                const isCurrent = user.id === currentAuthUser?.id;
                const isMasterRole = user.role === 'MASTER';

                return (
                  <div
                    key={user.id}
                    className={`bg-white rounded-xl border transition-all p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
                      eff.status === 'BLOCKED'
                        ? 'border-red-200 bg-red-50/20'
                        : eff.status === 'EXPIRED'
                        ? 'border-amber-200 bg-amber-50/20'
                        : isCurrent
                        ? 'border-blue-400 ring-2 ring-blue-100'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* User Identity & Role */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0 shadow-xs ${
                          isMasterRole
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isMasterRole ? '👑' : '👤'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                            {user.name}
                          </h3>

                          {isCurrent && (
                            <span className="px-2 py-0.2 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                              Você (Sessão Atual)
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                              isMasterRole
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                          >
                            {isMasterRole ? <Crown className="w-3 h-3 text-amber-600" /> : <Eye className="w-3 h-3 text-blue-600" />}
                            {isMasterRole ? 'Master (Admin Total)' : 'Consulta & Análise'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Key className="w-3 h-3 text-slate-400" />
                            Login: <code className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded">{user.username}</code>
                          </span>

                          <span className="flex items-center gap-1">
                            Senha: <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">{user.password || '••••••'}</code>
                          </span>

                          {user.notes && (
                            <span className="text-slate-400 italic truncate max-w-xs" title={user.notes}>
                              "{user.notes}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expiration & Status Info */}
                    <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <div className="flex items-center md:justify-end gap-1.5">
                          {eff.status === 'ACTIVE' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              {eff.statusLabel}
                            </span>
                          )}
                          {eff.status === 'EXPIRED' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Acesso Expirado
                            </span>
                          )}
                          {eff.status === 'BLOCKED' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 text-xs font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-red-600" />
                              Bloqueado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          {eff.formattedExpiresAt}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {/* Quick Extend Access Menu */}
                        {!isMasterRole && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setQuickExtendUserId(quickExtendUserId === user.id ? null : user.id)
                              }
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Renovar ou Estender Prazo de Acesso"
                            >
                              <RefreshCw className="w-3 h-3 text-emerald-600" />
                              <span className="hidden sm:inline">Renovar</span>
                            </button>

                            {/* Dropdown Menu for Duration Extension */}
                            {quickExtendUserId === user.id && (
                              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Adicionar Tempo de Acesso:
                                </div>
                                <button
                                  onClick={() => handleQuickExtend(user.id, '30_DAYS')}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                                >
                                  <span>+ 30 Dias (1 Mês)</span>
                                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                </button>
                                <button
                                  onClick={() => handleQuickExtend(user.id, '90_DAYS')}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                                >
                                  <span>+ 90 Dias (Trimestre)</span>
                                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                </button>
                                <button
                                  onClick={() => handleQuickExtend(user.id, '180_DAYS')}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                                >
                                  <span>+ 180 Dias (Semestre)</span>
                                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                </button>
                                <button
                                  onClick={() => handleQuickExtend(user.id, '1_YEAR')}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                                >
                                  <span>+ 1 Ano (Anual)</span>
                                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                </button>
                                <div className="border-t border-slate-100 my-1"></div>
                                <button
                                  onClick={() => handleQuickExtend(user.id, 'LIFETIME')}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center justify-between"
                                >
                                  <span>Tornar Vitalício</span>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Copy Direct Link */}
                        <button
                          onClick={() => handleCopyDirectLink(user)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative"
                          title="Copiar Link de Acesso Direto deste Usuário"
                        >
                          {copyFeedback === `link-${user.id}` ? (
                            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                          ) : (
                            <LinkIcon className="w-4 h-4" />
                          )}
                        </button>

                        {/* Copy Credentials */}
                        <button
                          onClick={() => handleCopyAccessCredentials(user)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative"
                          title="Copiar mensagem completa de acesso para enviar no WhatsApp"
                        >
                          {copyFeedback === user.id ? (
                            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Edit User */}
                        <button
                          onClick={() => handleOpenEditForm(user)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Usuário"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Block / Unblock User */}
                        {!isMasterRole && (
                          <button
                            onClick={() => handleToggleBlockUser(user.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.status === 'BLOCKED'
                                ? 'text-red-600 hover:bg-red-50 bg-red-100/50'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={user.status === 'BLOCKED' ? 'Desbloquear Acesso' : 'Bloquear Acesso'}
                          >
                            {user.status === 'BLOCKED' ? (
                              <Lock className="w-4 h-4 text-red-600" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* Switch To This User (Quick Testing) */}
                        {onSwitchUser && !isCurrent && (
                          <button
                            onClick={() => onSwitchUser(user)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Entrar temporariamente como este usuário (Modo de teste)"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete User */}
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Perfis de <strong>Consulta</strong> têm todos os botões de cadastro/edição/importação ocultados automaticamente.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>

      {/* User Create / Edit Sub-Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  {editingUserId ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-base text-white">
                  {editingUserId ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva / Analista VIP"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Login & Senha Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Login / Usuário *
                  </label>
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="username"
                    placeholder="Ex: joao.analista"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Senha *
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormPassword(Math.random().toString(36).substring(2, 8))}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Gerar Aleatória
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoComplete="new-password"
                      placeholder="Senha de acesso"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-9 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Perfil / Tipo de Acesso */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipo de Perfil *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole('CONSULTOR')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formRole === 'CONSULTOR'
                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">👁️</span>
                      <span className="font-bold text-xs text-slate-900">Consulta & Análise</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Apenas visualiza dados e estatísticas. Botões de edição e cadastro ficam ocultos.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('MASTER')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formRole === 'MASTER'
                        ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">👑</span>
                      <span className="font-bold text-xs text-slate-900">Master (Admin)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Acesso total. Cadastra, edita, sobe CSV, gerencia usuários e backups.
                    </p>
                  </button>
                </div>
              </div>

              {/* Duração / Validade do Acesso (somente se não for Master) */}
              {formRole === 'CONSULTOR' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Prazo de Validade do Acesso *</span>
                    <span className="text-emerald-600 font-bold text-[11px]">
                      {formatDurationLabel(formDuration)}
                    </span>
                  </label>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: '30_DAYS', label: '30 dias', tag: '1 mês' },
                      { id: '90_DAYS', label: '90 dias', tag: '3 meses' },
                      { id: '180_DAYS', label: '180 dias', tag: '6 meses' },
                      { id: '1_YEAR', label: '1 ano', tag: '12 meses' },
                      { id: 'LIFETIME', label: 'Vitalício', tag: 'Sem limite' },
                    ].map((dur) => (
                      <button
                        key={dur.id}
                        type="button"
                        onClick={() => setFormDuration(dur.id as UserAccessDuration)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          formDuration === dur.id
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <div className="text-xs">{dur.label}</div>
                        <div className={`text-[9px] mt-0.5 ${formDuration === dur.id ? 'text-blue-100' : 'text-slate-400'}`}>
                          {dur.tag}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Perfil <strong>Master</strong> possui acesso vitalício e ilimitado por padrão.</span>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notas / Observações (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Assinatura plano trimestral via Pix"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingUserId ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

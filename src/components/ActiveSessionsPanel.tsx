import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Activity,
  Shield,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Monitor,
  Wifi,
  Users,
  Eye,
  Filter,
  Zap,
  Info,
  Layers,
} from 'lucide-react';
import { AppUser } from '../types';
import {
  ActiveSessionRecord,
  SessionDashboardData,
  fetchAllActiveSessions,
  disconnectSessionRemote,
  disconnectAllUserSessionsRemote,
  getLocalSessionId,
} from '../services/sessionService';

interface ActiveSessionsPanelProps {
  currentAuthUser: AppUser | null;
  users?: AppUser[];
  onRefreshUsers?: () => void;
}

export const ActiveSessionsPanel: React.FC<ActiveSessionsPanelProps> = ({
  currentAuthUser,
  users = [],
}) => {
  const [data, setData] = useState<SessionDashboardData>({
    totalSessions: 0,
    onlineCount: 0,
    idleCount: 0,
    uniqueUsersOnline: 0,
    sessions: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'IDLE' | 'OFFLINE'>('ALL');
  const [deviceFilter, setDeviceFilter] = useState<'ALL' | 'Desktop' | 'Mobile' | 'Tablet'>('ALL');
  const [userFilter, setUserFilter] = useState<string>('ALL');

  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const localSessionId = getLocalSessionId();

  const loadSessions = useCallback(async (showRefreshingSpinner: boolean = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      const result = await fetchAllActiveSessions();
      setData(result);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and periodic auto-refresh every 12 seconds
  useEffect(() => {
    loadSessions(false);
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadSessions(false);
    }, 12000);

    return () => clearInterval(interval);
  }, [loadSessions, autoRefresh]);

  // Handle single session disconnect
  const handleDisconnectSession = async (session: ActiveSessionRecord) => {
    const isCurrent = session.sessionId === localSessionId;
    const confirmMsg = isCurrent
      ? 'Atenção: Você está desconectando esta sessão atual. Deseja continuar?'
      : `Deseja realmente desconectar a sessão do usuário @${session.username} no ${session.deviceType} (${session.browser})?`;

    if (!window.confirm(confirmMsg)) return;

    setDisconnectingId(session.sessionId);
    setActionFeedback(null);

    const success = await disconnectSessionRemote(session.sessionId);
    setDisconnectingId(null);

    if (success) {
      setActionFeedback({
        type: 'success',
        message: `Sessão de @${session.username} (${session.browser}) desconectada com sucesso!`,
      });
      loadSessions(true);
      setTimeout(() => setActionFeedback(null), 4000);
    } else {
      setActionFeedback({
        type: 'error',
        message: 'Erro ao desconectar sessão. Tente novamente.',
      });
    }
  };

  // Handle disconnect all sessions for user
  const handleDisconnectAllUser = async (userId: string, username: string) => {
    if (
      !window.confirm(
        `Deseja desconectar TODOS os aparelhos e sessões ativas do usuário @${username}?`
      )
    ) {
      return;
    }

    setDisconnectingId(`all_${userId}`);
    const success = await disconnectAllUserSessionsRemote(userId, username);
    setDisconnectingId(null);

    if (success) {
      setActionFeedback({
        type: 'success',
        message: `Todas as sessões ativas de @${username} foram desconectadas!`,
      });
      loadSessions(true);
      setTimeout(() => setActionFeedback(null), 4000);
    } else {
      setActionFeedback({
        type: 'error',
        message: 'Erro ao desconectar sessões do usuário.',
      });
    }
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return data.sessions.filter(session => {
      const matchesSearch =
        (session.username && session.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.name && session.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.ip && session.ip.includes(searchTerm)) ||
        (session.browser && session.browser.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.os && session.os.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || session.status === statusFilter;
      const matchesDevice = deviceFilter === 'ALL' || session.deviceType === deviceFilter;
      const matchesUser = userFilter === 'ALL' || session.userId === userFilter || session.username === userFilter;

      return matchesSearch && matchesStatus && matchesDevice && matchesUser;
    });
  }, [data.sessions, searchTerm, statusFilter, deviceFilter, userFilter]);

  // Derived statistics
  const desktopCount = data.sessions.filter(s => s.deviceType === 'Desktop' && s.status !== 'OFFLINE').length;
  const mobileCount = data.sessions.filter(s => (s.deviceType === 'Mobile' || s.deviceType === 'Tablet') && s.status !== 'OFFLINE').length;
  const multiDeviceUsersCount = (Object.values(
    data.sessions.reduce<Record<string, number>>((acc, s) => {
      if (s.status !== 'OFFLINE') {
        const k = s.username || s.userId;
        acc[k] = (acc[k] || 0) + 1;
      }
      return acc;
    }, {})
  ) as number[]).filter(count => count > 1).length;

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'Mobile':
        return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'Tablet':
        return <Tablet className="w-4 h-4 text-purple-600" />;
      case 'Desktop':
      default:
        return <Laptop className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatTimeAgo = (timestampMs?: number) => {
    if (!timestampMs) return 'Recente';
    const seconds = Math.floor((Date.now() - timestampMs) / 1000);
    if (seconds < 10) return 'Agora mesmo (< 10s)';
    if (seconds < 60) return `Há ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `Há ${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Policy Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-500/20 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Globe className="w-6 h-6 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Painel de Acessos & Sessões Conectadas
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Multidispositivo Ativo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                O acesso simultâneo em múltiplos dispositivos está liberado para os usuários de consulta. Acompanhe em tempo real onde cada perfil está conectado e gerencie suas sessões ativas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                autoRefresh
                  ? 'bg-indigo-600/30 border-indigo-400/40 text-indigo-200 hover:bg-indigo-600/50'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
              title={autoRefresh ? 'Auto-atualização ativa (12s)' : 'Auto-atualização pausada'}
            >
              <Activity className={`w-3.5 h-3.5 ${autoRefresh ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{autoRefresh ? 'Auto-Sync ON' : 'Auto-Sync OFF'}</span>
            </button>

            <button
              onClick={() => loadSessions(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Agora'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all animate-in fade-in slide-in-from-top-2 duration-200 border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Online */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              {data.onlineCount}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              Dispositivos Online
            </div>
          </div>
        </div>

        {/* Unique Users Connected */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              {data.uniqueUsersOnline}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              Usuários Conectados
            </div>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Monitor className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-base font-black text-slate-800 tracking-tight leading-none flex items-center gap-2">
              <span>{desktopCount} PC</span>
              <span className="text-slate-300">/</span>
              <span>{mobileCount} Cel</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              Desktop vs Mobile
            </div>
          </div>
        </div>

        {/* Simultaneous Users */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              {multiDeviceUsersCount}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              Perfis em 2+ Aparelhos
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuário, nome, navegador, sistema ou IP..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full md:w-auto px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">Status: Todos</option>
            <option value="ONLINE">🟢 Online Agora</option>
            <option value="IDLE">🟡 Ausente (&gt; 90s)</option>
            <option value="OFFLINE">⚪ Inativo (&gt; 5m)</option>
          </select>

          {/* Device Filter */}
          <select
            value={deviceFilter}
            onChange={e => setDeviceFilter(e.target.value as any)}
            className="w-full md:w-auto px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">Aparelho: Todos</option>
            <option value="Desktop">💻 Computadores</option>
            <option value="Mobile">📱 Celulares</option>
            <option value="Tablet">📲 Tablets</option>
          </select>

          {/* User Select Filter */}
          {users.length > 0 && (
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 max-w-[160px] truncate"
            >
              <option value="ALL">Usuário: Todos</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  @{u.username} ({u.name})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Sessions List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Sessões Conectadas em Tempo Real ({filteredSessions.length})
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">
            Atualizado a cada 12s automaticamente
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-500" />
            <p className="text-xs font-medium">Buscando dispositivos e conexões ativas...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Globe className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Nenhuma sessão encontrada</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Nenhum dispositivo corresponde aos filtros aplicados. Altere os filtros ou aguarde novas conexões.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSessions.map((session, idx) => {
              const isCurrentSession = session.sessionId === localSessionId;
              const isOnline = session.status === 'ONLINE';
              const isIdle = session.status === 'IDLE';
              const isDisconnecting = disconnectingId === session.sessionId;

              return (
                <div
                  key={session.sessionId || idx}
                  className={`p-4 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isCurrentSession
                      ? 'bg-indigo-50/40 hover:bg-indigo-50/70 border-l-4 border-l-indigo-600'
                      : isOnline
                      ? 'hover:bg-slate-50/90'
                      : 'hover:bg-slate-50/50 opacity-75'
                  }`}
                >
                  {/* Left: User & Identity */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-[240px]">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 relative">
                      {getDeviceIcon(session.deviceType)}
                      <span
                        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline
                            ? 'bg-emerald-500 animate-pulse'
                            : isIdle
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                        title={isOnline ? 'Online' : isIdle ? 'Ausente' : 'Inativo'}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          {session.name || 'Usuário'}
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          @{session.username}
                        </span>
                        {session.role === 'MASTER' ? (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                            MASTER
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            CONSULTA
                          </span>
                        )}
                        {isCurrentSession && (
                          <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                            Este Dispositivo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                        {session.simultaneousCountForUser && session.simultaneousCountForUser > 1 && (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                            <Zap className="w-3 h-3 text-amber-600" />
                            {session.simultaneousCountForUser} aparelhos conectados
                          </span>
                        )}
                        <span>Login: {new Date(session.loginTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">ID: {session.sessionId.slice(0, 14)}...</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Hardware, OS, Browser & Screen */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/50">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                        Aparelho & SO
                      </span>
                      <span className="font-bold text-slate-800">
                        {session.deviceModel || session.deviceType}
                      </span>
                      <span className="text-slate-500 text-[11px] block">
                        {session.os}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                        Navegador & Tela
                      </span>
                      <span className="font-bold text-slate-800">
                        {session.browser}
                      </span>
                      <span className="text-slate-500 text-[11px] block font-mono">
                        {session.screenResolution}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                        IP & Fuso Horário
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {session.ip ? session.ip : 'IP Registrado'}
                      </span>
                      <span className="text-slate-500 text-[11px] block truncate max-w-[140px]">
                        {session.timezone || 'America/Sao_Paulo'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Real-time Status & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
                    <div className="text-left lg:text-right">
                      <div className="flex items-center lg:justify-end gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOnline ? 'bg-emerald-500 animate-pulse' : isIdle ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-bold ${
                            isOnline ? 'text-emerald-700' : isIdle ? 'text-amber-700' : 'text-slate-500'
                          }`}
                        >
                          {isOnline ? 'ONLINE' : isIdle ? 'AUSENTE' : 'OFFLINE'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {formatTimeAgo(session.lastHeartbeat)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDisconnectSession(session)}
                        disabled={isDisconnecting}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Desconectar este dispositivo remotamente"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{isDisconnecting ? 'Saindo...' : 'Desconectar'}</span>
                      </button>

                      {session.simultaneousCountForUser && session.simultaneousCountForUser > 1 && (
                        <button
                          onClick={() => handleDisconnectAllUser(session.userId, session.username)}
                          disabled={disconnectingId === `all_${session.userId}`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          title="Desconectar todos os aparelhos deste usuário"
                        >
                          Encerrar Todos ({session.simultaneousCountForUser})
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

      {/* Helpful Guidelines Card */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-800">
            Como funciona o gerenciamento de dispositivos simultâneos:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
            <li>Usuários com perfil <strong>Consulta</strong> podem logar simultaneamente no celular, tablet e computador sem nenhuma trava ou desconexão forçada.</li>
            <li>O painel Master exibe em tempo real quem está conectado, em qual aparelho, navegador e horário de atividade.</li>
            <li>Você pode encerrar qualquer conexão individual ou todas as conexões de um usuário a qualquer momento clicando em <strong>Desconectar</strong>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

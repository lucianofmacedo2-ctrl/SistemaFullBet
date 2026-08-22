import React, { useState, useRef, useEffect } from 'react';
import {
  Trophy,
  Globe,
  Shield,
  Plus,
  Database,
  BarChart3,
  ListOrdered,
  CalendarDays,
  FileSpreadsheet,
  UploadCloud,
  Trash2,
  Image,
  Users,
  Crown,
  Eye,
  LogOut,
  Key,
  Download,
  Zap,
  Sparkles,
  DollarSign,
  ChevronDown,
  Layers,
  Settings,
  Flame
} from 'lucide-react';
import { DbState, AppUser } from '../types';
import { extractYMD, formatDateToYMD } from './DailyMatchesView';
import { isMatchComplete, exportTeamsToExcel } from '../utils/excelHelper';
import { isValidImageUrl } from '../utils/imageHelper';
import { getUserEffectiveStatus } from '../services/authService';

interface NavbarProps {
  dbState: DbState;
  currentUser: AppUser | null;
  activeTab: 'matches' | 'schedule' | 'standings' | 'countries' | 'leagues' | 'teams' | 'stats' | 'analysis' | 'pending_logos';
  setActiveTab: (tab: 'matches' | 'schedule' | 'standings' | 'countries' | 'leagues' | 'teams' | 'stats' | 'analysis' | 'pending_logos') => void;
  onOpenMatchModal: () => void;
  onOpenEntityModal: (type?: 'country' | 'league' | 'team') => void;
  onOpenBulkImportModal?: () => void;
  onOpenBulkMatchImportModal?: () => void;
  onOpenBulkMatchUpdateModal?: () => void;
  onOpenCsvImportModal?: () => void;
  onOpenBackupModal: () => void;
  onOpenSyncModal?: () => void;
  onOpenResetModal?: () => void;
  onOpenUserManagerModal?: () => void;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  onOpenOpportunitiesHub?: () => void;
  onOpenBankrollTracker?: () => void;
  onOpenTeamsReportModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  dbState,
  currentUser,
  activeTab,
  setActiveTab,
  onOpenMatchModal,
  onOpenEntityModal,
  onOpenBulkImportModal,
  onOpenBulkMatchImportModal,
  onOpenBulkMatchUpdateModal,
  onOpenCsvImportModal,
  onOpenBackupModal,
  onOpenSyncModal,
  onOpenResetModal,
  onOpenUserManagerModal,
  onOpenLoginModal,
  onLogout,
  onOpenOpportunitiesHub,
  onOpenBankrollTracker,
  onOpenTeamsReportModal,
}) => {
  const isMaster = currentUser?.role === 'MASTER';
  const effStatus = currentUser ? getUserEffectiveStatus(currentUser) : null;

  // Dropdowns state
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [isEntitiesMenuOpen, setIsEntitiesMenuOpen] = useState(false);

  const importMenuRef = useRef<HTMLDivElement>(null);
  const systemMenuRef = useRef<HTMLDivElement>(null);
  const entitiesMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
        setIsImportMenuOpen(false);
      }
      if (systemMenuRef.current && !systemMenuRef.current.contains(event.target as Node)) {
        setIsSystemMenuOpen(false);
      }
      if (entitiesMenuRef.current && !entitiesMenuRef.current.contains(event.target as Node)) {
        setIsEntitiesMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate matches for today, tomorrow, and after tomorrow
  const today = new Date();
  const todayYMD = formatDateToYMD(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowYMD = formatDateToYMD(tomorrow);
  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(today.getDate() + 2);
  const afterTomorrowYMD = formatDateToYMD(afterTomorrow);

  const nextDaysMatchesCount = dbState.matches.filter(m => {
    const ymd = extractYMD(m.matchDate);
    return ymd === todayYMD || ymd === tomorrowYMD || ymd === afterTomorrowYMD;
  }).length;

  const incompleteMatchesCount = dbState.matches.filter(m => !isMatchComplete(m)).length;

  const pendingLogosCount =
    dbState.teams.filter(t => !isValidImageUrl(t.logoUrl)).length +
    dbState.leagues.filter(l => !isValidImageUrl(l.logoUrl)).length +
    dbState.countries.filter(c => !isValidImageUrl(c.flagUrl)).length;

  const activeUsersCount = dbState.users?.filter(
    u => getUserEffectiveStatus(u).status === 'ACTIVE'
  ).length || 1;

  const isEntityTabActive = ['countries', 'leagues', 'teams', 'stats', 'pending_logos'].includes(activeTab);

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-40 shadow-xs">
      {/* Top Header Bar */}
      <div className="max-w-[1700px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14 gap-2 sm:gap-4">
          {/* Brand & Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-base sm:text-lg shadow-sm shadow-blue-500/20">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight leading-none">
                  <span className="text-slate-900">FUT</span>
                  <span className="text-blue-600">LFM2</span>
                </h1>
                <span className={`text-[9px] sm:text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  isMaster
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isMaster ? 'bg-amber-500' : 'bg-blue-600'} animate-pulse`}></span>
                  {isMaster ? 'Master' : 'Consulta'}
                </span>
              </div>
            </div>
          </div>

          {/* Center Summary Indicator (Desktop) */}
          <div className="hidden 2xl:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full font-medium">
            <span className="font-semibold text-slate-700">{dbState.matches.length}</span> Jogos no Banco •
            <span className="font-semibold text-slate-700">{dbState.countries.length}</span> Países •
            <span className="font-semibold text-slate-700">{dbState.leagues.length}</span> Ligas •
            <span className="font-semibold text-slate-700">{dbState.teams.length}</span> Times
          </div>

          {/* Right Header Actions & Master Control Panel */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* User Session Badge */}
            {currentUser && (
              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                isMaster
                  ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                {isMaster ? (
                  <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
                <span className="font-bold truncate max-w-[110px]">{currentUser.name}</span>
                {!isMaster && effStatus && (
                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                    {effStatus.statusLabel}
                  </span>
                )}
              </div>
            )}

            {/* MASTER-ONLY ACTIONS: Streamlined, Grouped and Overflow-Free */}
            {isMaster ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* 1. Cadastrar Jogo (Botão Principal) */}
                <button
                  onClick={onOpenMatchModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  title="Cadastrar Nova Partida"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span className="hidden xs:inline">Cadastrar Jogo</span>
                </button>

                {/* 2. Menu Dropdown: Importações & Massa */}
                <div className="relative" ref={importMenuRef}>
                  <button
                    onClick={() => {
                      setIsImportMenuOpen(!isImportMenuOpen);
                      setIsSystemMenuOpen(false);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg border transition-all cursor-pointer ${
                      incompleteMatchesCount > 0
                        ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-300 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    title="Menu de Importação e Atualização em Massa"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Importar</span>
                    {incompleteMatchesCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-black rounded-full animate-pulse">
                        {incompleteMatchesCount}
                      </span>
                    )}
                    <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isImportMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu Importações */}
                  {isImportMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        Ferramentas de Carga & Massa
                      </div>

                      {onOpenBulkMatchUpdateModal && (
                        <button
                          onClick={() => {
                            setIsImportMenuOpen(false);
                            onOpenBulkMatchUpdateModal();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <UploadCloud className="w-4 h-4 text-indigo-600 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900">Subir Dados em Massa</div>
                              <div className="text-[10px] text-slate-500">Planilha de jogos pendentes</div>
                            </div>
                          </div>
                          {incompleteMatchesCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                              {incompleteMatchesCount}
                            </span>
                          )}
                        </button>
                      )}

                      {onOpenCsvImportModal && (
                        <button
                          onClick={() => {
                            setIsImportMenuOpen(false);
                            onOpenCsvImportModal();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 transition-colors border-t border-slate-50"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">Subir CSV Consolidado</div>
                            <div className="text-[10px] text-slate-500">Auto-cadastra ligas, times e odds</div>
                          </div>
                        </button>
                      )}

                      {onOpenBulkMatchImportModal && (
                        <button
                          onClick={() => {
                            setIsImportMenuOpen(false);
                            onOpenBulkMatchImportModal();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2 transition-colors border-t border-slate-50"
                        >
                          <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">Importar Jogos Futuros</div>
                            <div className="text-[10px] text-slate-500">Planilha Excel (.xlsx)</div>
                          </div>
                        </button>
                      )}

                      {onOpenBulkImportModal && (
                        <button
                          onClick={() => {
                            setIsImportMenuOpen(false);
                            onOpenBulkImportModal();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors border-t border-slate-50"
                        >
                          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">Importar Equipes</div>
                            <div className="text-[10px] text-slate-500">Lista em lote (.xlsx)</div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Gestão de Usuários */}
                {onOpenUserManagerModal && (
                  <button
                    onClick={onOpenUserManagerModal}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs sm:text-sm rounded-lg transition-all cursor-pointer shadow-2xs"
                    title="Gerenciar Usuários e Permissões"
                  >
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    <span className="hidden sm:inline">Usuários</span>
                    <span className="px-1.5 py-0.2 bg-purple-200 text-purple-900 text-[10px] font-black rounded-full">
                      {activeUsersCount}
                    </span>
                  </button>
                )}

                {/* 4. Menu Dropdown: Configurações & Entidades & Backup */}
                <div className="relative" ref={systemMenuRef}>
                  <button
                    onClick={() => {
                      setIsSystemMenuOpen(!isSystemMenuOpen);
                      setIsImportMenuOpen(false);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm rounded-lg transition-all cursor-pointer"
                    title="Gerenciamento de Entidades, Backups e Configurações"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden lg:inline">Mais</span>
                    <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu Sistema */}
                  {isSystemMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        Entidades & Cadastros
                      </div>

                      <button
                        onClick={() => {
                          setIsSystemMenuOpen(false);
                          onOpenEntityModal();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Cadastrar País / Liga / Time</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsSystemMenuOpen(false);
                          if (onOpenTeamsReportModal) {
                            onOpenTeamsReportModal();
                          } else {
                            exportTeamsToExcel(dbState.teams, dbState.leagues, dbState.countries);
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-teal-600 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">Relatório de Times</div>
                            <div className="text-[10px] text-slate-500">Colunas: País, Liga, Time</div>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-md">
                          {dbState.teams.length}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setIsSystemMenuOpen(false);
                          exportTeamsToExcel(dbState.teams, dbState.leagues, dbState.countries);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 transition-colors border-t border-slate-50"
                      >
                        <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Baixar Planilha (.xlsx)</span>
                      </button>

                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-t border-b border-slate-100 mt-1">
                        Banco de Dados & Backup
                      </div>

                      <button
                        onClick={() => {
                          setIsSystemMenuOpen(false);
                          onOpenBackupModal();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      >
                        <Database className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Backup & Restaurar JSON</span>
                      </button>

                      {onOpenResetModal && (
                        <button
                          onClick={() => {
                            setIsSystemMenuOpen(false);
                            onOpenResetModal();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-slate-100 mt-1"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Resetar Banco de Dados</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Modo Consulta Ativo</span>
                </div>
              </div>
            )}

            {/* Auth Login / Logout */}
            <div className="flex items-center gap-0.5 pl-1 border-l border-slate-200">
              {onOpenLoginModal && (
                <button
                  onClick={onOpenLoginModal}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Trocar de Conta / Login"
                >
                  <Key className="w-4 h-4" />
                </button>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sair da Conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar (Categorized, Clean & Compact - No Overflow) */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 sm:px-5 lg:px-6 py-1.5">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
          {/* Main Navigation Segmented Controls */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            {/* Bloco 1: Jogos & Tabela */}
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
              <button
                onClick={() => setActiveTab('matches')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  activeTab === 'matches'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Todas Partidas</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'matches' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {dbState.matches.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  activeTab === 'schedule'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Hoje/Amanhã</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'schedule' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                }`}>
                  {nextDaysMatchesCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('standings')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  activeTab === 'standings'
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-amber-800 hover:bg-slate-100'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Classificação</span>
              </button>
            </div>

            {/* Separador Visual Discreto */}
            <div className="hidden sm:block w-px h-5 bg-slate-300/80 mx-0.5"></div>

            {/* Bloco 2: Inteligência Esportiva & Apostas (DESTAQUE NOBRE) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={() => setActiveTab('analysis')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-2xs cursor-pointer ${
                  activeTab === 'analysis'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white ring-2 ring-indigo-300 shadow-indigo-500/20'
                    : 'bg-white text-indigo-900 border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                <span>ANÁLISE & POWER RANKING</span>
                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-amber-400 text-slate-950 uppercase">
                  PRO
                </span>
              </button>

              {onOpenOpportunitiesHub && (
                <button
                  type="button"
                  onClick={onOpenOpportunitiesHub}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 shadow-2xs cursor-pointer hover:scale-[1.02]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>OPORTUNIDADES (+EV)</span>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-slate-950 text-amber-300 uppercase">
                    AI
                  </span>
                </button>
              )}

              {onOpenBankrollTracker && (
                <button
                  type="button"
                  onClick={onOpenBankrollTracker}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs cursor-pointer hover:scale-[1.02]"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>BANCA</span>
                </button>
              )}
            </div>

            {/* Separador Visual Discreto */}
            <div className="hidden md:block w-px h-5 bg-slate-300/80 mx-0.5"></div>

            {/* Bloco 3: Cadastros & Entidades (Visual Compacto) */}
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
              <button
                onClick={() => setActiveTab('countries')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'countries'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Países ({dbState.countries.length})
              </button>

              <button
                onClick={() => setActiveTab('leagues')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'leagues'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Ligas ({dbState.leagues.length})
              </button>

              <button
                onClick={() => setActiveTab('teams')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'teams'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Times ({dbState.teams.length})
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'stats'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Estatísticas
              </button>

              {/* Escudos Pendentes (Admin) */}
              {isMaster && (
                <button
                  onClick={() => setActiveTab('pending_logos')}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    activeTab === 'pending_logos'
                      ? 'bg-amber-500 text-slate-950'
                      : pendingLogosCount > 0
                      ? 'text-amber-800 hover:bg-amber-50'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                  title="Escudos e Logos Pendentes"
                >
                  <Image className="w-3 h-3" />
                  <span className="hidden xl:inline">Escudos</span>
                  {pendingLogosCount > 0 && (
                    <span className="px-1 py-0.1 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full">
                      {pendingLogosCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Quick Counter Summary Indicator (Pills no final da barra) */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700">
              {dbState.countries.length} Países
            </span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700">
              {dbState.leagues.length} Ligas
            </span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700">
              {dbState.teams.length} Times
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};



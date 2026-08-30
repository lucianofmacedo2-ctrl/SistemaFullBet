import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  ChevronUp,
  Layers,
  Settings,
  Flame,
  LayoutDashboard,
  Grid,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Scale,
  BookOpen
} from 'lucide-react';
import { DbState, AppUser } from '../types';
import { extractYMD, formatDateToYMD } from './DailyMatchesView';
import {
  getBrasiliaTodayYMD,
  getBrasiliaTomorrowYMD,
  getBrasiliaAfterTomorrowYMD,
} from '../utils/dateTimeUtils';
import { isMatchComplete, exportTeamsToExcel } from '../utils/excelHelper';
import { isValidImageUrl } from '../utils/imageHelper';
import { getUserEffectiveStatus } from '../services/authService';
import { diagnoseDatabaseAnomalies } from '../utils/dbSanitizer';

interface NavbarProps {
  dbState: DbState;
  currentUser: AppUser | null;
  activeTab: 'matches' | 'schedule' | 'standings' | 'countries' | 'leagues' | 'teams' | 'stats' | 'analysis' | 'pending_logos' | 'referees';
  setActiveTab: (tab: 'matches' | 'schedule' | 'standings' | 'countries' | 'leagues' | 'teams' | 'stats' | 'analysis' | 'pending_logos' | 'referees') => void;
  onOpenMatchModal: () => void;
  onOpenEntityModal: (type?: 'country' | 'league' | 'team') => void;
  onOpenBulkImportModal?: () => void;
  onOpenBulkMatchImportModal?: () => void;
  onOpenBulkMatchUpdateModal?: () => void;
  onOpenCsvImportModal?: () => void;
  onOpenBackupModal: () => void;
  onOpenSyncModal?: () => void;
  onOpenResetModal?: () => void;
  onOpenSanitizerModal?: () => void;
  onOpenUserManagerModal?: (tab?: 'USERS' | 'SESSIONS') => void;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  onOpenOpportunitiesHub?: () => void;
  onOpenBankrollTracker?: () => void;
  onOpenHtGoalsScanner?: () => void;
  onOpenTeamsReportModal?: () => void;
  onOpenCloudModal?: () => void;
  onOpenTechDocs?: () => void;
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
  onOpenSanitizerModal,
  onOpenUserManagerModal,
  onOpenLoginModal,
  onLogout,
  onOpenOpportunitiesHub,
  onOpenBankrollTracker,
  onOpenHtGoalsScanner,
  onOpenTeamsReportModal,
  onOpenCloudModal,
  onOpenTechDocs,
}) => {
  const isMaster = currentUser?.role === 'MASTER';
  const effStatus = currentUser ? getUserEffectiveStatus(currentUser) : null;

  // Diagnóstico em tempo real de ligas cruzadas e duplicidades
  const anomalyReport = useMemo(() => {
    return diagnoseDatabaseAnomalies(dbState);
  }, [dbState]);

  // Dropdowns and Master Quick Panel states
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [isMasterPanelOpen, setIsMasterPanelOpen] = useState(false);

  const importMenuRef = useRef<HTMLDivElement>(null);
  const systemMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
        setIsImportMenuOpen(false);
      }
      if (systemMenuRef.current && !systemMenuRef.current.contains(event.target as Node)) {
        setIsSystemMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate matches for today, tomorrow, and after tomorrow in Brasília time
  const todayYMD = getBrasiliaTodayYMD();
  const tomorrowYMD = getBrasiliaTomorrowYMD();
  const afterTomorrowYMD = getBrasiliaAfterTomorrowYMD();

  const allMatches = Array.isArray(dbState.matches) ? dbState.matches : [];
  const allTeams = Array.isArray(dbState.teams) ? dbState.teams : [];
  const allLeagues = Array.isArray(dbState.leagues) ? dbState.leagues : [];
  const allCountries = Array.isArray(dbState.countries) ? dbState.countries : [];

  const nextDaysMatchesCount = allMatches.filter(m => {
    const ymd = extractYMD(m.matchDate);
    return ymd === todayYMD || ymd === tomorrowYMD || ymd === afterTomorrowYMD;
  }).length;

  const incompleteMatchesCount = allMatches.filter(m => !isMatchComplete(m)).length;

  const pendingLogosCount =
    allTeams.filter(t => !isValidImageUrl(t.logoUrl)).length +
    allLeagues.filter(l => !isValidImageUrl(l.logoUrl)).length +
    allCountries.filter(c => !isValidImageUrl(c.flagUrl)).length;

  const activeUsersCount = dbState.users?.filter(
    u => getUserEffectiveStatus(u).status === 'ACTIVE'
  ).length || 1;

  const refereeCount = useMemo(() => {
    const set = new Set<string>();
    dbState.matches.forEach(m => {
      const r = (m.referee || '').trim();
      if (r && r.toLowerCase() !== 'n/a' && r.toLowerCase() !== 'desconhecido') {
        set.add(r.toLowerCase());
      }
    });
    return set.size;
  }, [dbState.matches]);

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
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full font-medium">
            <span className="font-semibold text-slate-700">{dbState.matches.length}</span> Jogos •
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

            {/* Nuvem Firestore (Ao Vivo) Button - Accessible to all roles */}
            {onOpenCloudModal && (
              <button
                onClick={onOpenCloudModal}
                className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title="Central de Controle da Nuvem Firestore (Ao Vivo) - Sincronização Automática"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="hidden sm:inline">Nuvem Firestore</span>
                <span className="sm:hidden">Nuvem</span>
              </button>
            )}

            {/* MASTER-ONLY QUICK ACTIONS (Compact, Accessible, No Overflow) */}
            {isMaster ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* 1. Cadastrar Jogo */}
                <button
                  onClick={onOpenMatchModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  title="Cadastrar Nova Partida"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span className="hidden xs:inline">Cadastrar Jogo</span>
                </button>

                {/* 2. Menu Dropdown: Importações & Cargas */}
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
                    title="Menu de Importações em Massa"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">Importar</span>
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
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              Planilha: Jogos Futuros
                              <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">14 Cols</span>
                            </div>
                            <div className="text-[10px] text-slate-500">Cadastre pré-jogo, estádio, odds e árbitro</div>
                          </div>
                        </button>
                      )}

                      {onOpenBulkMatchUpdateModal && (
                        <button
                          onClick={() => {
                            setIsImportMenuOpen(false);
                            onOpenBulkMatchUpdateModal();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center justify-between transition-colors border-t border-slate-50"
                        >
                          <div className="flex items-center gap-2">
                            <UploadCloud className="w-4 h-4 text-teal-600 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                Planilha: Jogos Finalizados
                                <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">33 Cols</span>
                              </div>
                              <div className="text-[10px] text-slate-500">Resultados, xG, stats e auto-merge no banco</div>
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

                {/* 3. Usuários */}
                {onOpenUserManagerModal && (
                  <button
                    onClick={onOpenUserManagerModal}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs sm:text-sm rounded-lg transition-all cursor-pointer shadow-2xs"
                    title="Gerenciar Usuários e Permissões"
                  >
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    <span className="hidden md:inline">Usuários</span>
                    <span className="px-1.5 py-0.2 bg-purple-200 text-purple-900 text-[10px] font-black rounded-full">
                      {activeUsersCount}
                    </span>
                  </button>
                )}

                {/* 4. Painel Master Completo (Toggle View) */}
                <button
                  onClick={() => setIsMasterPanelOpen(!isMasterPanelOpen)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg border transition-all cursor-pointer ${
                    isMasterPanelOpen
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                  title="Abrir/Fechar Central de Funções Master Completa"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Painel Master</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isMasterPanelOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* 5. Menu Dropdown: Mais Ações */}
                <div className="relative" ref={systemMenuRef}>
                  <button
                    onClick={() => {
                      setIsSystemMenuOpen(!isSystemMenuOpen);
                      setIsImportMenuOpen(false);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm rounded-lg transition-all cursor-pointer"
                    title="Mais Funções e Relatórios"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-600" />
                    <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu Sistema */}
                  {isSystemMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
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
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center justify-between transition-colors border-t border-slate-50"
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
                        <span>Baixar Planilha Excel (.xlsx)</span>
                      </button>

                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-t border-b border-slate-100 mt-1">
                        Banco de Dados & Backup
                      </div>

                      {onOpenSanitizerModal && (
                        <button
                          onClick={() => {
                            setIsSystemMenuOpen(false);
                            onOpenSanitizerModal();
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                            anomalyReport.totalAnomaliesCount > 0
                              ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                              : 'text-indigo-900 hover:bg-indigo-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Zap className={`w-4 h-4 shrink-0 ${anomalyReport.totalAnomaliesCount > 0 ? 'text-amber-600' : 'text-indigo-600'}`} />
                            <span>Corrigir Duplicidades & Ligas</span>
                          </div>
                          {anomalyReport.totalAnomaliesCount > 0 && (
                            <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-md">
                              {anomalyReport.totalAnomaliesCount}
                            </span>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsSystemMenuOpen(false);
                          onOpenBackupModal();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors border-t border-slate-50"
                      >
                        <Database className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Backup & Restaurar JSON</span>
                      </button>

                      {onOpenTechDocs && (
                        <button
                          onClick={() => {
                            setIsSystemMenuOpen(false);
                            onOpenTechDocs();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 transition-colors border-t border-slate-50"
                        >
                          <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">Documentação Técnica</div>
                            <div className="text-[10px] text-slate-500">Salvar em PDF / Manual Completo</div>
                          </div>
                        </button>
                      )}

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
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Trocar de Conta / Login"
                >
                  <Key className="w-4 h-4" />
                </button>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Sair da Conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MASTER EXPANDED DASHBOARD GRID (Visible on toggle - Clean Categorized Layout, No Horizontal Scroll) */}
      {isMaster && isMasterPanelOpen && (
        <div className="bg-gradient-to-b from-amber-50/50 via-slate-50 to-slate-100 border-t border-b border-amber-200/80 px-3 sm:px-5 lg:px-6 py-3.5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-inner">
          <div className="max-w-[1700px] mx-auto">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Central de Funções do Usuário Master
                </h3>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                  Todas as ferramentas reunidas em blocos visuais, sem necessidade de rolagem lateral.
                </span>
              </div>
              <button
                onClick={() => setIsMasterPanelOpen(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer"
              >
                Recolher ✕
              </button>
            </div>

            {/* 4 Categorized Columns in Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Card 1: Cadastros & Gestão */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 pb-1.5 border-b border-slate-100">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Cadastros & Gestão</span>
                </div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setIsMasterPanelOpen(false);
                      onOpenMatchModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>+ Cadastrar Partida</span>
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  <button
                    onClick={() => {
                      setIsMasterPanelOpen(false);
                      onOpenEntityModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>+ País / Liga / Time</span>
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  {onOpenUserManagerModal && (
                    <>
                      <button
                        onClick={() => {
                          setIsMasterPanelOpen(false);
                          onOpenUserManagerModal('USERS');
                        }}
                        className="w-full text-left px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>Gestão de Usuários</span>
                        <span className="px-1.5 py-0.2 bg-purple-200 text-purple-900 text-[10px] font-bold rounded-md">
                          {activeUsersCount} ativos
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMasterPanelOpen(false);
                          onOpenUserManagerModal('SESSIONS');
                        }}
                        className="w-full text-left px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Sessões & Dispositivos</span>
                        </div>
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          Ao Vivo
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Card 2: Importações em Massa */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 pb-1.5 border-b border-slate-100">
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Importações & Planilhas</span>
                </div>
                <div className="space-y-1.5">
                  {onOpenBulkMatchImportModal && (
                    <button
                      onClick={() => {
                        setIsMasterPanelOpen(false);
                        onOpenBulkMatchImportModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                        <span>Planilha Jogos Futuros</span>
                      </div>
                      <span className="text-[9px] bg-blue-200 text-blue-900 font-bold px-1 rounded">14 cols</span>
                    </button>
                  )}
                  {onOpenBulkMatchUpdateModal && (
                    <button
                      onClick={() => {
                        setIsMasterPanelOpen(false);
                        onOpenBulkMatchUpdateModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5 text-teal-600" />
                        <span>Planilha Jogos Finalizados</span>
                      </div>
                      <span className="text-[9px] bg-teal-200 text-teal-900 font-bold px-1 rounded">33 cols</span>
                    </button>
                  )}
                  {onOpenCsvImportModal && (
                    <button
                      onClick={() => {
                        setIsMasterPanelOpen(false);
                        onOpenCsvImportModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Subir CSV Consolidado</span>
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  )}
                  {onOpenBulkImportModal && (
                    <button
                      onClick={() => {
                        setIsMasterPanelOpen(false);
                        onOpenBulkImportModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Importar Equipes (.xlsx)</span>
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card 3: Relatórios & Planilhas */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 pb-1.5 border-b border-slate-100">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                  <span>Relatórios & Exportações</span>
                </div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setIsMasterPanelOpen(false);
                      if (onOpenTeamsReportModal) {
                        onOpenTeamsReportModal();
                      } else {
                        exportTeamsToExcel(dbState.teams, dbState.leagues, dbState.countries);
                      }
                    }}
                    className="w-full text-left px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Relatório de Times Cadastrados</span>
                    <span className="px-1.5 py-0.2 bg-teal-200 text-teal-900 text-[10px] font-bold rounded-md">
                      {dbState.teams.length}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMasterPanelOpen(false);
                      exportTeamsToExcel(dbState.teams, dbState.leagues, dbState.countries);
                    }}
                    className="w-full text-left px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Baixar Planilha (.xlsx)</span>
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    onClick={() => {
                      setIsMasterPanelOpen(false);
                      setActiveTab('pending_logos');
                    }}
                    className="w-full text-left px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Escudos e Logos Pendentes</span>
                    {pendingLogosCount > 0 ? (
                      <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-black rounded-md">
                        {pendingLogosCount}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-bold">100% OK</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Card 4: Sistema & Banco de Dados */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 pb-1.5 border-b border-slate-100">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>Banco & Manutenção</span>
                </div>
                <div className="space-y-1.5">
                  {onOpenCloudModal && (
                    <button
                      onClick={() => {
                        setIsMasterPanelOpen(false);
                        onOpenCloudModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-900 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer border border-blue-200"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Nuvem Firestore (Ao Vivo)</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-black">SYNC</span>
                    </button>
                  )}

                  {onOpenSanitizerModal && (
                    <button
                      onClick={() => {
                        setIsMasterPanelOpen(false);
                        onOpenSanitizerModal();
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        anomalyReport.totalAnomaliesCount > 0
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Zap className={`w-3.5 h-3.5 ${anomalyReport.totalAnomaliesCount > 0 ? 'text-amber-700' : 'text-indigo-600'}`} />
                        <span>Corrigir Duplicidades</span>
                      </div>
                      {anomalyReport.totalAnomaliesCount > 0 ? (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-md">
                          {anomalyReport.totalAnomaliesCount}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold">100% OK</span>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsMasterPanelOpen(false);
                      onOpenBackupModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Backup & Restaurar JSON</span>
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  {onOpenResetModal && (
                    <button
                      onClick={() => {
                        setIsMasterPanelOpen(false);
                        onOpenResetModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Resetar Banco de Dados</span>
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar (Clean, Wrap-Safe, No Horizontal Scroll) */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 sm:px-5 lg:px-6 py-1.5">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
          {/* Main Navigation Segmented Controls */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            {/* Bloco 1: Jogos & Tabela */}
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Jogos do Dia</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'schedule' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                }`}>
                  {nextDaysMatchesCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('standings')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'standings'
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-amber-800 hover:bg-slate-100'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Classificação</span>
              </button>

              <button
                onClick={() => setActiveTab('matches')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'matches'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
                }`}
                title="Banco de dados geral com todas as partidas cadastradas"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Todas Partidas</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'matches' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {dbState.matches.length}
                </span>
              </button>
            </div>

            {/* Separador Visual */}
            <div className="hidden sm:block w-px h-5 bg-slate-300/80 mx-0.5"></div>

            {/* Bloco 2: Inteligência Esportiva & Apostas (DESTAQUE) */}
            <div className="flex items-center flex-wrap gap-1 sm:gap-1.5">
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

              {onOpenHtGoalsScanner && (
                <button
                  type="button"
                  onClick={onOpenHtGoalsScanner}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-2xs cursor-pointer hover:scale-[1.02]"
                  title="Central de Radares Inteligentes: Ambas Marcam (HT/FT), Over 2.5 / 3.5 Gols e Mandante para Vencer"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                  <span>RADARES</span>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-slate-950 text-amber-300 uppercase">
                    5 MODOS
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

            {/* Separador Visual */}
            <div className="hidden md:block w-px h-5 bg-slate-300/80 mx-0.5"></div>

            {/* Bloco 3: Cadastros & Entidades */}
            <div className="flex items-center flex-wrap bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
              <button
                onClick={() => setActiveTab('countries')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'countries'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Países ({dbState.countries.length})
              </button>

              <button
                onClick={() => setActiveTab('leagues')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'leagues'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Ligas ({dbState.leagues.length})
              </button>

              <button
                onClick={() => setActiveTab('teams')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'teams'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Times ({dbState.teams.length})
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'stats'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Estatísticas
              </button>

              {/* Árbitros */}
              <button
                onClick={() => setActiveTab('referees')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'referees'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Estatísticas de Árbitros (Cartões, Faltas e Médias de Gols)"
              >
                <Scale className="w-3.5 h-3.5 text-amber-500" />
                <span>Árbitros</span>
                {refereeCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    activeTab === 'referees' ? 'bg-amber-800 text-amber-200' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {refereeCount}
                  </span>
                )}
              </button>

              {/* Escudos Pendentes (Master) */}
              {isMaster && (
                <button
                  onClick={() => setActiveTab('pending_logos')}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
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
            {refereeCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md text-amber-900 font-bold">
                {refereeCount} Árbitros
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};




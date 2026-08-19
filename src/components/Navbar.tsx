import React from 'react';
import {
  Trophy,
  Globe,
  Shield,
  Plus,
  Database,
  BarChart3,
  ListOrdered,
  CalendarDays,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  TrendingUp,
  UploadCloud,
  FileEdit,
  Trash2,
  Image,
} from 'lucide-react';
import { DbState } from '../types';
import { extractYMD, formatDateToYMD } from './DailyMatchesView';
import { isMatchComplete } from '../utils/excelHelper';

interface NavbarProps {
  dbState: DbState;
  activeTab: 'matches' | 'schedule' | 'countries' | 'leagues' | 'teams' | 'stats' | 'pending_logos';
  setActiveTab: (tab: 'matches' | 'schedule' | 'countries' | 'leagues' | 'teams' | 'stats' | 'pending_logos') => void;
  onOpenMatchModal: () => void;
  onOpenEntityModal: (type?: 'country' | 'league' | 'team') => void;
  onOpenBulkImportModal?: () => void;
  onOpenBulkMatchImportModal?: () => void;
  onOpenBulkMatchUpdateModal?: () => void;
  onOpenCsvImportModal?: () => void;
  onOpenBackupModal: () => void;
  onOpenSyncModal?: () => void;
  onOpenResetModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  dbState,
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
}) => {
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
    dbState.teams.filter(t => !t.logoUrl?.trim()).length +
    dbState.leagues.filter(l => !l.logoUrl?.trim()).length +
    dbState.countries.filter(c => !c.flagUrl?.trim()).length;

  return (
    <header className="bg-white border-b border-blue-200 text-slate-800 sticky top-0 z-40 shadow-sm">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20 border border-blue-400">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight leading-none">
                  <span className="text-black">FUT</span>
                  <span className="text-blue-600">LFM2</span>
                </h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                  Banco Ativo
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block mt-0.5 font-medium">
                Sistema de Cadastro de Jogos & Entidades
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenMatchModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] border border-blue-500"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">Cadastrar</span> Jogo
            </button>

            {onOpenBulkMatchUpdateModal && (
              <button
                onClick={onOpenBulkMatchUpdateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Baixar planilha com jogos incompletos, preencher dados e subir em massa"
              >
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Subir Dados em Massa</span>
                {incompleteMatchesCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full ml-0.5 animate-pulse" title={`${incompleteMatchesCount} jogo(s) incompleto(s)`}>
                    {incompleteMatchesCount}
                  </span>
                )}
              </button>
            )}

            {onOpenCsvImportModal && (
              <button
                onClick={onOpenCsvImportModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Subir arquivo jogos_consolidados.csv manualmente com auto-cadastro"
              >
                <UploadCloud className="w-4 h-4 text-emerald-100" />
                <span>Subir CSV</span>
              </button>
            )}

            {onOpenBulkMatchImportModal && (
              <button
                onClick={onOpenBulkMatchImportModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 font-semibold text-sm rounded-xl transition-all shadow-sm cursor-pointer"
                title="Cadastrar Jogos Futuros em Massa via Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Importar Futuros</span>
              </button>
            )}

            {onOpenBulkImportModal && (
              <button
                onClick={onOpenBulkImportModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-sm rounded-xl transition-all"
                title="Cadastrar Equipes em Massa via Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden md:inline">Importar Times</span>
              </button>
            )}

            <button
              onClick={() => onOpenEntityModal()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-sm rounded-xl transition-all"
              title="Cadastrar País, Liga ou Time individualmente"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">Nova Entidade</span>
            </button>

            <button
              onClick={onOpenBackupModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-sm rounded-xl transition-all"
              title="Gerenciar Dados & Backup JSON"
            >
              <Database className="w-4 h-4 text-blue-600" />
              <span className="hidden lg:inline">Banco & Backup</span>
            </button>

            {onOpenResetModal && (
              <button
                onClick={onOpenResetModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300 font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Resetar banco de dados e limpar tudo (requer senha)"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span className="hidden xl:inline">Resetar Banco</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation & Summary Bar */}
      <div className="bg-blue-50/80 border-t border-blue-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
          {/* Tabs */}
          <nav className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'matches'
                  ? 'bg-blue-600 text-white border border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-100/60'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              Todas Partidas
              <span className={`ml-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'matches' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {dbState.matches.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'schedule'
                  ? 'bg-blue-600 text-white border border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-100/60'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Jogos por Data (Hoje/Amanhã)
              <span className={`ml-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'schedule' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {nextDaysMatchesCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('countries')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'countries'
                  ? 'bg-blue-600 text-white border border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-100/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Países
              <span className={`ml-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'countries' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {dbState.countries.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leagues')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'leagues'
                  ? 'bg-blue-600 text-white border border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-100/60'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Ligas
              <span className={`ml-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'leagues' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {dbState.leagues.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('teams')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'teams'
                  ? 'bg-blue-600 text-white border border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-100/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Times
              <span className={`ml-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'teams' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {dbState.teams.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'stats'
                  ? 'bg-blue-600 text-white border border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-100/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Estatísticas
            </button>

            <button
              onClick={() => setActiveTab('pending_logos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'pending_logos'
                  ? 'bg-amber-500 text-slate-950 border border-amber-500 shadow-sm shadow-amber-500/20'
                  : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100/70'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              Escudos Pendentes
              {pendingLogosCount > 0 && (
                <span className={`ml-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'pending_logos' ? 'bg-slate-950 text-white' : 'bg-amber-500 text-slate-950 animate-pulse'
                }`}>
                  {pendingLogosCount}
                </span>
              )}
            </button>
          </nav>

          {/* Quick summary line */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 font-medium">
            <span>IDs Registrados no Sistema:</span>
            <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-blue-200 text-slate-800 font-bold shadow-xs">
              {dbState.countries.length} Países • {dbState.leagues.length} Ligas • {dbState.teams.length} Times
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

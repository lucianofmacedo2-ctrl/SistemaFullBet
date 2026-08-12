import React from 'react';
import {
  Trophy,
  Globe,
  Shield,
  Plus,
  Database,
  BarChart3,
  ListOrdered,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { DbState } from '../types';

interface NavbarProps {
  dbState: DbState;
  activeTab: 'matches' | 'countries' | 'leagues' | 'teams' | 'stats';
  setActiveTab: (tab: 'matches' | 'countries' | 'leagues' | 'teams' | 'stats') => void;
  onOpenMatchModal: () => void;
  onOpenEntityModal: (type?: 'country' | 'league' | 'team') => void;
  onOpenBulkImportModal?: () => void;
  onOpenBulkMatchImportModal?: () => void;
  onOpenBackupModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  dbState,
  activeTab,
  setActiveTab,
  onOpenMatchModal,
  onOpenEntityModal,
  onOpenBulkImportModal,
  onOpenBulkMatchImportModal,
  onOpenBackupModal,
}) => {
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
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                  FUT<span className="text-blue-600">DB4</span>
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

            {onOpenBulkMatchImportModal && (
              <button
                onClick={onOpenBulkMatchImportModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 font-semibold text-sm rounded-xl transition-all shadow-sm cursor-pointer"
                title="Cadastrar Jogos Futuros em Massa via Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Importar Jogos Excel</span>
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
              Partidas
              <span className={`ml-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'matches' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {dbState.matches.length}
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

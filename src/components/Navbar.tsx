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
  CheckCircle2
} from 'lucide-react';
import { DbState } from '../types';

interface NavbarProps {
  dbState: DbState;
  activeTab: 'matches' | 'countries' | 'leagues' | 'teams' | 'stats';
  setActiveTab: (tab: 'matches' | 'countries' | 'leagues' | 'teams' | 'stats') => void;
  onOpenMatchModal: () => void;
  onOpenEntityModal: (type?: 'country' | 'league' | 'team') => void;
  onOpenBackupModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  dbState,
  activeTab,
  setActiveTab,
  onOpenMatchModal,
  onOpenEntityModal,
  onOpenBackupModal,
}) => {
  return (
    <header className="bg-[#0e0e0e] border-b border-white/10 text-gray-100 sticky top-0 z-40 shadow-xl">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-black font-black text-xl shadow-md shadow-emerald-500/20">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                  FUT<span className="text-emerald-400">DB</span>
                </h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Banco Ativo
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block mt-0.5">
                Sistema de Cadastro de Jogos & Entidades
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenMatchModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">Cadastrar</span> Jogo
            </button>

            <button
              onClick={() => onOpenEntityModal()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-medium text-sm rounded-xl transition-all"
              title="Cadastrar País, Liga ou Time individualmente"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Nova Entidade</span>
            </button>

            <button
              onClick={onOpenBackupModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 font-medium text-sm rounded-xl transition-all"
              title="Gerenciar Dados & Backup JSON"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Banco & Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation & Summary Bar */}
      <div className="bg-[#0c0c0c] border-t border-white/10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
          {/* Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'matches'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              Partidas
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-gray-300">
                {dbState.matches.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('countries')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'countries'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Países
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-gray-300">
                {dbState.countries.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leagues')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'leagues'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Ligas
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-gray-300">
                {dbState.leagues.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('teams')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'teams'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Times
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-gray-300">
                {dbState.teams.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'stats'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Estatísticas
            </button>
          </nav>

          {/* Quick summary line */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-gray-400">
            <span>IDs Registrados no Sistema:</span>
            <span className="font-mono bg-[#111111] px-2 py-0.5 rounded border border-white/10 text-gray-300">
              {dbState.countries.length} Países • {dbState.leagues.length} Ligas • {dbState.teams.length} Times
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

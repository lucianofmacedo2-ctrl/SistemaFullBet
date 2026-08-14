import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Trophy,
  Globe,
  Edit2,
  Trash2,
  Plus,
  Hash,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Activity,
  Target,
  Flag,
  Disc,
  Sparkles,
  TrendingUp,
  DollarSign,
  Zap,
  FileSpreadsheet,
  CheckSquare,
  Square,
  X,
  FileCheck,
  FileWarning
} from 'lucide-react';
import { DbState, Match, MatchStatus } from '../types';

interface MatchListProps {
  dbState: DbState;
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenMatchModal: () => void;
  onOpenStatsModal: (match: Match) => void;
  onOpenQuickScore?: (match: Match) => void;
  onOpenBulkMatchImportModal?: () => void;
}

export interface CompletenessResult {
  isComplete: boolean;
  missingFields: string[];
}

export function checkMatchCompleteness(match: Match): CompletenessResult {
  const missing: string[] = [];
  if (!match.matchDate) missing.push('Data/Hora');
  if (!match.stadium || !match.stadium.trim()) missing.push('Estádio');
  if (!match.round || !match.round.trim()) missing.push('Rodada');
  if (
    !match.odds ||
    match.odds.homeFT == null ||
    match.odds.drawFT == null ||
    match.odds.awayFT == null
  ) {
    missing.push('Odds 1X2 FT');
  }
  return {
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}

export const MatchList: React.FC<MatchListProps> = ({
  dbState,
  onEditMatch,
  onDeleteMatch,
  onOpenMatchModal,
  onOpenStatsModal,
  onOpenQuickScore,
  onOpenBulkMatchImportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountryId, setFilterCountryId] = useState('');
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [futureCompletenessFilter, setFutureCompletenessFilter] = useState<'ALL' | 'COMPLETE' | 'INCOMPLETE'>('ALL');
  const [expandedStatsMatchId, setExpandedStatsMatchId] = useState<string | null>(null);
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false);
  const [leagueSearchTerm, setLeagueSearchTerm] = useState('');

  const leagueDropdownRef = useRef<HTMLDivElement>(null);

  // Close league dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (leagueDropdownRef.current && !leagueDropdownRef.current.contains(e.target as Node)) {
        setIsLeagueDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matches = dbState.matches;

  // Counts
  const totalMatches = matches.length;
  const agendadosMatchesAll = matches.filter(m => m.status === 'AGENDADO');
  const agendadosCount = agendadosMatchesAll.length;
  const agendadosCompletosCount = agendadosMatchesAll.filter(m => checkMatchCompleteness(m).isComplete).length;
  const agendadosIncompletosCount = agendadosMatchesAll.filter(m => !checkMatchCompleteness(m).isComplete).length;
  const finalizadosCount = matches.filter(m => m.status === 'FINALIZADO').length;
  const emAndamentoCount = matches.filter(m => m.status === 'EM_ANDAMENTO').length;

  // Available leagues filtered by country if selected
  const availableLeagues = dbState.leagues.filter(l => {
    if (filterCountryId) return l.countryId === filterCountryId;
    return true;
  });

  // Filter logic
  const filteredMatches = matches.filter(match => {
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      match.id.toLowerCase().includes(searchLower) ||
      match.homeTeamName.toLowerCase().includes(searchLower) ||
      match.awayTeamName.toLowerCase().includes(searchLower) ||
      match.leagueName.toLowerCase().includes(searchLower) ||
      match.countryName.toLowerCase().includes(searchLower) ||
      match.homeTeamId.toLowerCase().includes(searchLower) ||
      match.awayTeamId.toLowerCase().includes(searchLower) ||
      (match.stadium && match.stadium.toLowerCase().includes(searchLower));

    const matchesCountry = filterCountryId ? match.countryId === filterCountryId : true;
    
    // Multi-league logic: if selectedLeagueIds is non-empty, match must be in list
    const matchesLeague =
      selectedLeagueIds.length > 0 ? selectedLeagueIds.includes(match.leagueId) : true;

    const matchesStatus = filterStatus ? match.status === filterStatus : true;

    // Completeness filter for future matches
    let matchesCompleteness = true;
    if (match.status === 'AGENDADO') {
      const completeness = checkMatchCompleteness(match);
      if (futureCompletenessFilter === 'COMPLETE') matchesCompleteness = completeness.isComplete;
      if (futureCompletenessFilter === 'INCOMPLETE') matchesCompleteness = !completeness.isComplete;
    }

    return matchesSearch && matchesCountry && matchesLeague && matchesStatus && matchesCompleteness;
  });

  // Grouped match categories for section separators
  const completeScheduled = filteredMatches.filter(
    m => m.status === 'AGENDADO' && checkMatchCompleteness(m).isComplete
  );
  const incompleteScheduled = filteredMatches.filter(
    m => m.status === 'AGENDADO' && !checkMatchCompleteness(m).isComplete
  );
  const nonScheduledMatches = filteredMatches.filter(m => m.status !== 'AGENDADO');

  const toggleLeagueSelection = (leagueId: string) => {
    setSelectedLeagueIds(prev =>
      prev.includes(leagueId) ? prev.filter(id => id !== leagueId) : [...prev, leagueId]
    );
  };

  const selectAllLeagues = () => {
    setSelectedLeagueIds(availableLeagues.map(l => l.id));
  };

  const clearLeagueSelection = () => {
    setSelectedLeagueIds([]);
  };

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'FINALIZADO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2C3EC4]/20 text-white border border-[#2C3EC4]/40 flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-[#2C3EC4]" />
            Finalizado
          </span>
        );
      case 'EM_ANDAMENTO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
            <Clock className="w-3 h-3" />
            Em Andamento
          </span>
        );
      case 'AGENDADO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Agendado
          </span>
        );
      case 'ADIADO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Adiado
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Controls */}
      <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por time, liga, estádio ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-blue-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Country Filter */}
          <div>
            <select
              value={filterCountryId}
              onChange={(e) => {
                setFilterCountryId(e.target.value);
                setSelectedLeagueIds([]); // Reset selected leagues when country changes
              }}
              className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="">Todos os Países ({dbState.countries.length})</option>
              {dbState.countries.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.id}] {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Multi-League Selector */}
          <div className="relative" ref={leagueDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLeagueDropdownOpen(prev => !prev)}
              className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-left text-slate-800 focus:outline-none focus:border-blue-600 flex items-center justify-between gap-2"
            >
              <span className="truncate">
                {selectedLeagueIds.length === 0 ? (
                  `Todas as Ligas (${availableLeagues.length})`
                ) : (
                  <span className="text-blue-900 font-bold">
                    {selectedLeagueIds.length} liga(s) selecionada(s)
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {selectedLeagueIds.length > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                    {selectedLeagueIds.length}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>

            {/* Dropdown Menu */}
            {isLeagueDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-blue-200 rounded-xl shadow-xl p-2 space-y-2 text-xs text-slate-900 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 gap-2">
                  <span className="font-bold text-slate-700">Escolha as Ligas:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllLeagues}
                      className="text-[11px] text-blue-600 hover:underline font-bold"
                    >
                      Todas
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={clearLeagueSelection}
                      className="text-[11px] text-slate-500 hover:text-slate-800"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {availableLeagues.length > 6 && (
                  <input
                    type="text"
                    placeholder="Filtrar ligas..."
                    value={leagueSearchTerm}
                    onChange={(e) => setLeagueSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                )}

                <div className="space-y-1">
                  {availableLeagues
                    .filter(l => l.name.toLowerCase().includes(leagueSearchTerm.toLowerCase()) || l.id.toLowerCase().includes(leagueSearchTerm.toLowerCase()))
                    .map(league => {
                      const isSelected = selectedLeagueIds.includes(league.id);
                      return (
                        <label
                          key={league.id}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className={isSelected ? 'font-bold text-blue-900' : 'text-slate-700'}>
                              [{league.id}] {league.name}
                            </span>
                          </div>
                          {league.countryName && (
                            <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                              {league.countryName}
                            </span>
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="">Todos os Status</option>
              <option value="AGENDADO">Agendado (Jogos Futuros)</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="ADIADO">Adiado</option>
            </select>
          </div>
        </div>

        {/* Selected Leagues Interactive Pills */}
        {selectedLeagueIds.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              Ligas Filtradas:
            </span>
            {selectedLeagueIds.map(id => {
              const league = dbState.leagues.find(l => l.id === id);
              return (
                <span
                  key={id}
                  className="bg-blue-50 border border-blue-300 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <span>{league ? league.name : id}</span>
                  <button
                    type="button"
                    onClick={() => toggleLeagueSelection(id)}
                    className="hover:text-red-600 transition-colors p-0.5"
                    title="Remover liga"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            <button
              onClick={clearLeagueSelection}
              className="text-xs text-blue-600 hover:underline font-bold ml-1"
            >
              Limpar todas as ligas
            </button>
          </div>
        )}

        {/* Counter Results info & Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100 font-medium gap-2">
          <span>
            Exibindo <strong className="text-blue-600 font-bold">{filteredMatches.length}</strong> de <strong className="text-slate-900">{matches.length}</strong> partidas cadastradas.
          </span>

          <div className="flex items-center gap-3">
            {onOpenBulkMatchImportModal && (
              <button
                onClick={onOpenBulkMatchImportModal}
                className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                Importar Jogos Futuros (Excel)
              </button>
            )}

            {(searchTerm || filterCountryId || selectedLeagueIds.length > 0 || filterStatus || futureCompletenessFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCountryId('');
                  setSelectedLeagueIds([]);
                  setFilterStatus('');
                  setFutureCompletenessFilter('ALL');
                }}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Status Filter Tabs */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setFilterStatus('');
              setFutureCompletenessFilter('ALL');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === ''
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 border border-blue-600'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Todos os Jogos</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-black/10 font-mono">
              {totalMatches}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('AGENDADO')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'AGENDADO'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 border border-blue-600'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Jogos Futuros (Agendados)</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-black/10 font-mono">
              {agendadosCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('FINALIZADO')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'FINALIZADO'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 border border-blue-600'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finalizados</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-black/10 font-mono">
              {finalizadosCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('EM_ANDAMENTO')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'EM_ANDAMENTO'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Ao Vivo</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-black/10 font-mono">
              {emAndamentoCount}
            </span>
          </button>
        </div>

        {/* Future Matches Completeness Sub-Bar (When viewing Agendado or All) */}
        {(filterStatus === 'AGENDADO' || filterStatus === '') && agendadosCount > 0 && (
          <div className="bg-white border border-blue-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Filtro de Preenchimento dos Jogos Futuros:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFutureCompletenessFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  futureCompletenessFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Todos os Futuros</span>
                <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded">
                  {agendadosCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFutureCompletenessFilter('COMPLETE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  futureCompletenessFilter === 'COMPLETE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>🟢 Dados Completos</span>
                <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded text-emerald-800">
                  {agendadosCompletosCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFutureCompletenessFilter('INCOMPLETE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  futureCompletenessFilter === 'INCOMPLETE'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <FileWarning className="w-3.5 h-3.5" />
                <span>⚠️ Faltando Dados</span>
                <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded text-amber-900">
                  {agendadosIncompletosCount}
                </span>
              </button>

              {onOpenQuickScore && incompleteScheduled.length > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenQuickScore(incompleteScheduled[0])}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer border border-blue-500"
                  title="Abre o preenchimento rápido em sequência para os jogos com pendências"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Preencher em Sequência ({incompleteScheduled.length})</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Matches Grid / List */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white border border-blue-200 rounded-2xl p-8 text-center text-slate-600 space-y-3 shadow-xs">
          <p className="text-base font-semibold text-slate-800">Nenhuma partida encontrada para os filtros aplicados.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onOpenMatchModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 border border-blue-500"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Cadastrar Nova Partida
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Jogos Futuros - Dados Completos */}
          {completeScheduled.length > 0 && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border-l-4 border-emerald-500 border-y border-r border-emerald-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <span>🟢 Jogos Futuros - Dados Completos</span>
                  <span className="bg-emerald-200/60 text-emerald-900 font-mono text-xs px-2 py-0.5 rounded-full border border-emerald-300">
                    {completeScheduled.length} partidas
                  </span>
                </div>
                <span className="text-xs text-emerald-700 hidden sm:inline">
                  Partidas agendadas com Estádio, Árbitro, Rodada e Odds preenchidos.
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {completeScheduled.map(match => renderMatchCard(match))}
              </div>
            </div>
          )}

          {/* Section 2: Jogos Futuros - Faltando Informações / Pendentes */}
          {incompleteScheduled.length > 0 && (
            <div className="space-y-3">
              <div className="bg-amber-50 border-l-4 border-amber-500 border-y border-r border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                  <FileWarning className="w-5 h-5 text-amber-600" />
                  <span>⚠️ Jogos Futuros - Faltando Informações (Pendentes)</span>
                  <span className="bg-amber-200/60 text-amber-900 font-mono text-xs px-2 py-0.5 rounded-full border border-amber-300">
                    {incompleteScheduled.length} partidas
                  </span>
                </div>
                <span className="text-xs text-amber-800 hidden sm:inline">
                  Estes jogos possuem dados pendentes (ex: sem estádio, árbitro ou odds).
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {incompleteScheduled.map(match => renderMatchCard(match))}
              </div>
            </div>
          )}

          {/* Section 3: Non-Scheduled Matches (Finalizados / Em Andamento / Adiados) */}
          {nonScheduledMatches.length > 0 && (
            <div className="space-y-3">
              {(completeScheduled.length > 0 || incompleteScheduled.length > 0) && (
                <div className="bg-blue-50 border-l-4 border-blue-600 border-y border-r border-blue-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <span>🏁 Outras Partidas (Finalizados & Ao Vivo)</span>
                    <span className="bg-blue-200/60 text-blue-900 font-mono text-xs px-2 py-0.5 rounded-full border border-blue-300">
                      {nonScheduledMatches.length} partidas
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {nonScheduledMatches.map(match => renderMatchCard(match))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Helper function to render individual match card
  function renderMatchCard(match: Match) {
    const isExpanded = expandedStatsMatchId === match.id;
    const hasStats =
      match.stats &&
      (match.stats.possessionHome !== undefined ||
        match.stats.shotsHome !== undefined ||
        match.stats.scorersHome !== undefined ||
        match.stats.cornersHome !== undefined);

    const completeness = checkMatchCompleteness(match);

    const country = dbState.countries.find(
      c => c.id === match.countryId || c.name.toLowerCase() === match.countryName.toLowerCase()
    );
    const flagUrl = match.countryFlagUrl || country?.flagUrl;

    const league = dbState.leagues.find(
      l => l.id === match.leagueId || l.name.toLowerCase() === match.leagueName.toLowerCase()
    );
    const leagueLogoUrl = match.leagueLogoUrl || league?.logoUrl;

    const homeTeam = dbState.teams.find(
      t => t.id === match.homeTeamId || t.name.toLowerCase() === match.homeTeamName.toLowerCase()
    );
    const homeLogoUrl = match.homeTeamLogoUrl || homeTeam?.logoUrl;

    const awayTeam = dbState.teams.find(
      t => t.id === match.awayTeamId || t.name.toLowerCase() === match.awayTeamName.toLowerCase()
    );
    const awayLogoUrl = match.awayTeamLogoUrl || awayTeam?.logoUrl;

    return (
      <div
        key={match.id}
        className={`bg-white border ${
          match.status === 'AGENDADO'
            ? completeness.isComplete
              ? 'border-emerald-300 hover:border-emerald-500'
              : 'border-amber-300 hover:border-amber-500'
            : 'border-blue-200 hover:border-blue-400'
        } rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 group`}
      >
        {/* Card Top: Match Unique ID + Country + League + Completeness Badge + Status */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Match ID */}
            <span className="font-mono font-bold text-xs bg-blue-600 text-white border border-blue-500 px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
              <Hash className="w-3 h-3 text-white" />
              {match.id}
            </span>

            {/* League + Country */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              {leagueLogoUrl && (
                <img
                  src={leagueLogoUrl}
                  alt={match.leagueName}
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}
              <span className="font-bold text-slate-900">{match.leagueName}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 flex items-center gap-1 font-medium">
                {flagUrl ? (
                  <img
                    src={flagUrl}
                    alt={match.countryName}
                    className="w-4 h-3 object-cover rounded-sm border border-slate-200"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe className="w-3 h-3 text-slate-400" />
                )}
                {match.countryName}
              </span>
              {match.isContinental && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-600" />
                  Intercontinental
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Completeness Badge for AGENDADO matches */}
            {match.status === 'AGENDADO' && (
              completeness.isComplete ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-xs">
                  <FileCheck className="w-3 h-3 text-emerald-600" />
                  Dados Completos
                </span>
              ) : (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs"
                  title={`Faltam os campos: ${completeness.missingFields.join(', ')}`}
                >
                  <FileWarning className="w-3 h-3 text-amber-600" />
                  Falta: {completeness.missingFields.join(', ')}
                </span>
              )
            )}

            <div>{getStatusBadge(match.status)}</div>
          </div>
        </div>

        {/* Future Match Special Banner */}
        {match.status === 'AGENDADO' && (
          <div
            className={`${
              completeness.isComplete
                ? 'bg-emerald-50/80 border-emerald-200'
                : 'bg-amber-50/80 border-amber-200'
            } border rounded-xl p-2.5 flex items-center justify-between gap-2`}
          >
            <div className="flex items-center gap-2 text-xs font-medium">
              <Calendar
                className={`w-4 h-4 ${
                  completeness.isComplete ? 'text-emerald-600' : 'text-amber-600'
                } shrink-0`}
              />
              <span className="text-slate-800 font-medium">
                {completeness.isComplete
                  ? 'Jogo Agendado • Todos os dados preenchidos'
                  : `Jogo Agendado • Faltando: ${completeness.missingFields.join(', ')}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenQuickScore && (
                <button
                  type="button"
                  onClick={() => onOpenQuickScore(match)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  title="Lançar Placar & Odds Rápido"
                >
                  <Zap className="w-3 h-3" />
                  <span>Placar/Odds</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenStatsModal(match)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
              >
                + Stats
              </button>
            </div>
          </div>
        )}

        {/* Scoreboard Body */}
        <div className="grid grid-cols-7 items-center gap-2 my-2">
          {/* Home Team */}
          <div className="col-span-3 flex items-center justify-end gap-2.5 text-right">
            <div className="space-y-0.5 truncate">
              <span className="font-bold text-slate-900 text-base sm:text-lg truncate block leading-tight">
                {match.homeTeamName}
              </span>
              <div className="text-[10px] font-mono text-slate-500 flex items-center justify-end gap-1 font-semibold">
                <span>ID:</span>
                <span className="text-blue-900 bg-blue-100 px-1 rounded border border-blue-200">
                  {match.homeTeamId}
                </span>
              </div>
            </div>
            {homeLogoUrl ? (
              <img
                src={homeLogoUrl}
                alt={match.homeTeamName}
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg bg-slate-50 border border-slate-200 p-1 shrink-0 shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs shrink-0">
                🛡️
              </div>
            )}
          </div>

          {/* Score Pill */}
          <div className="col-span-1 text-center flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => {
                if (onOpenQuickScore) onOpenQuickScore(match);
                else onOpenStatsModal(match);
              }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 hover:border-blue-500 text-blue-950 rounded-xl font-black text-lg sm:text-xl shadow-xs font-mono tracking-wider min-w-[68px] transition-all cursor-pointer hover:scale-105"
              title="Clique para Lançar/Editar Placar & Odds Rápido"
            >
              {match.homeScore !== null && match.awayScore !== null ? (
                `${match.homeScore} - ${match.awayScore}`
              ) : (
                <span className="text-xs text-slate-400 font-sans uppercase">vs</span>
              )}
            </button>
          </div>

          {/* Away Team */}
          <div className="col-span-3 flex items-center justify-start gap-2.5 text-left">
            {awayLogoUrl ? (
              <img
                src={awayLogoUrl}
                alt={match.awayTeamName}
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg bg-slate-50 border border-slate-200 p-1 shrink-0 shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs shrink-0">
                🛡️
              </div>
            )}
            <div className="space-y-0.5 truncate">
              <span className="font-bold text-slate-900 text-base sm:text-lg truncate block leading-tight">
                {match.awayTeamName}
              </span>
              <div className="text-[10px] font-mono text-slate-500 flex items-center justify-start gap-1 font-semibold">
                <span>ID:</span>
                <span className="text-blue-900 bg-blue-100 px-1 rounded border border-blue-200">
                  {match.awayTeamId}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Goalscorers preview if available */}
        {(match.stats?.scorersHome || match.stats?.scorersAway) && (
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-1">
            {match.stats?.scorersHome && (
              <div className="flex items-center gap-1.5">
                <span className="text-blue-600 font-bold">⚽ {match.homeTeamName}:</span>
                <span className="text-slate-900 font-medium">{match.stats.scorersHome}</span>
              </div>
            )}
            {match.stats?.scorersAway && (
              <div className="flex items-center gap-1.5">
                <span className="text-blue-600 font-bold">⚽ {match.awayTeamName}:</span>
                <span className="text-slate-900 font-medium">{match.stats.scorersAway}</span>
              </div>
            )}
          </div>
        )}

        {/* Odds & Cotações Badge Strip */}
        {match.odds &&
          (match.odds.homeFT != null ||
            match.odds.drawFT != null ||
            match.odds.awayFT != null ||
            match.odds.over25FT != null ||
            match.odds.under25FT != null ||
            match.odds.bttsFT != null ||
            match.odds.homeHT != null ||
            match.odds.over05HT != null ||
            match.odds.firstGoalHome?.minute != null ||
            match.odds.firstGoalAway?.minute != null ||
            match.odds.earlyGameGoal?.minute != null) && (
            <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1 text-blue-700 uppercase tracking-wider font-extrabold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Odds / Cotações
                </span>
                {(match.odds.homeFT != null ||
                  match.odds.drawFT != null ||
                  match.odds.awayFT != null) && (
                  <span className="font-mono text-slate-800 text-[11px]">
                    1X2 FT:{' '}
                    <span className="text-blue-700 font-bold">{match.odds.homeFT ?? '-'}</span> |{' '}
                    <span className="text-amber-700 font-bold">{match.odds.drawFT ?? '-'}</span> |{' '}
                    <span className="text-blue-700 font-bold">{match.odds.awayFT ?? '-'}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 text-[11px] font-mono">
                {match.odds.over25FT != null && (
                  <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                    <span className="text-slate-500 font-sans">Over 2,5 FT:</span>
                    <span className="text-blue-700 font-bold">{match.odds.over25FT}</span>
                  </div>
                )}
                {match.odds.under25FT != null && (
                  <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                    <span className="text-slate-500 font-sans">Under 2,5 FT:</span>
                    <span className="text-blue-700 font-bold">{match.odds.under25FT}</span>
                  </div>
                )}
                {match.odds.bttsFT != null && (
                  <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                    <span className="text-slate-500 font-sans">Ambos FT:</span>
                    <span className="text-blue-700 font-bold">{match.odds.bttsFT}</span>
                  </div>
                )}
                {match.odds.homeHT != null && (
                  <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                    <span className="text-slate-500 font-sans">Mandante HT:</span>
                    <span className="text-blue-700 font-bold">{match.odds.homeHT}</span>
                  </div>
                )}
                {match.odds.drawHT != null && (
                  <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                    <span className="text-slate-500 font-sans">Empate HT:</span>
                    <span className="text-amber-700 font-bold">{match.odds.drawHT}</span>
                  </div>
                )}
                {match.odds.awayHT != null && (
                  <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                    <span className="text-slate-500 font-sans">Visitante HT:</span>
                    <span className="text-blue-700 font-bold">{match.odds.awayHT}</span>
                  </div>
                )}
                {match.odds.over05HT != null && (
                  <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                    <span className="text-slate-500 font-sans">Over 0,5 HT:</span>
                    <span className="text-blue-700 font-bold">{match.odds.over05HT}</span>
                  </div>
                )}
                {match.odds.under05HT != null && (
                  <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                    <span className="text-slate-500 font-sans">Under 0,5 HT:</span>
                    <span className="text-blue-700 font-bold">{match.odds.under05HT}</span>
                  </div>
                )}
                {match.odds.bttsHT != null && (
                  <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                    <span className="text-slate-500 font-sans">Ambos HT:</span>
                    <span className="text-blue-700 font-bold">{match.odds.bttsHT}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Expandable Match Stats Section */}
        {isExpanded && match.stats && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200 pb-1.5">
              <span>Estatísticas da Partida (FT & HT)</span>
              {match.stats.halftimeHomeScore !== undefined && match.stats.halftimeHomeScore !== null && (
                <span className="text-blue-900 font-mono font-bold bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                  1º Tempo (HT): {match.stats.halftimeHomeScore} - {match.stats.halftimeAwayScore}
                </span>
              )}
            </div>

            {/* Posse de bola bar */}
            {(match.stats.possessionHomeFT ?? match.stats.possessionHome) != null && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-700 font-medium">
                  <span>{match.stats.possessionHomeFT ?? match.stats.possessionHome}% Posse FT</span>
                  <span className="text-slate-500 font-bold">Posse de Bola</span>
                  <span>{match.stats.possessionAwayFT ?? match.stats.possessionAway}% Posse FT</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-600 h-full transition-all"
                    style={{ width: `${match.stats.possessionHomeFT ?? match.stats.possessionHome}%` }}
                  />
                  <div
                    className="bg-blue-400 h-full transition-all"
                    style={{ width: `${match.stats.possessionAwayFT ?? match.stats.possessionAway}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Entity IDs Footer Banner */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-3 text-slate-600 flex-wrap font-semibold">
            <span className="flex items-center gap-1">
              <span className="text-slate-400">País:</span>
              <span className="text-blue-900 bg-blue-100 px-1 rounded">{match.countryId}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-400">Liga:</span>
              <span className="text-blue-900 bg-blue-100 px-1 rounded">{match.leagueId}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-600 text-[11px] font-sans flex-wrap font-medium">
            {match.round && <span>{match.round}</span>}
            {match.stadium && (
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3 h-3 text-blue-600" />
                {match.stadium}
              </span>
            )}
            {match.referee && (
              <span className="flex items-center gap-1 text-blue-900 font-bold bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                👨‍⚖️ Árbitro: {match.referee}
              </span>
            )}
          </div>
        </div>

        {/* Date & Actions Bar */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-600 border-t border-slate-100 font-medium">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            {formatDate(match.matchDate)}
          </span>

          <div className="flex items-center gap-2">
            {/* Expand stats toggle if stats exist */}
            {hasStats && (
              <button
                onClick={() => setExpandedStatsMatchId(isExpanded ? null : match.id)}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 border border-blue-200 transition-colors"
              >
                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{isExpanded ? 'Ocultar Stats' : 'Ver Stats'}</span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {/* Quick Score button */}
            {onOpenQuickScore && (
              <button
                type="button"
                onClick={() => onOpenQuickScore(match)}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                title="Lançar Placar & Odds Rápido"
              >
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>Placar/Odds</span>
              </button>
            )}

            {/* Stats modal launch button */}
            <button
              onClick={() => onOpenStatsModal(match)}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold border border-blue-500 flex items-center gap-1 transition-all shadow-xs"
              title="Lançar/Editar Placar & Estatísticas"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{match.status === 'AGENDADO' ? 'Lançar Stats' : 'Estatísticas'}</span>
            </button>

            <button
              onClick={() => onEditMatch(match)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
              title="Editar Partida"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                if (
                  confirm(
                    `Tem certeza que deseja excluir o jogo ${match.id} (${match.homeTeamName} x ${match.awayTeamName})?`
                  )
                ) {
                  onDeleteMatch(match.id);
                }
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 transition-colors border border-slate-200"
              title="Excluir Partida"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
};

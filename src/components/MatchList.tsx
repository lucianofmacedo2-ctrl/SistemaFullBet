import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  ChevronRight,
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
  FileWarning,
  LayoutList,
  LayoutGrid,
  Upload,
  ArrowRight
} from 'lucide-react';
import { DbState, Match, MatchStatus, Country, League, Team } from '../types';
import { PressureChartViewer } from './PressureChartViewer';

interface MatchListProps {
  dbState: DbState;
  isMaster?: boolean;
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenMatchModal: () => void;
  onOpenStatsModal: (match: Match) => void;
  onOpenQuickScore?: (match: Match) => void;
  onOpenBulkMatchImportModal?: () => void;
  onOpenBulkMatchUpdateModal?: () => void;
  onOpenPressureChartModal?: (matchId: string) => void;
  onAnalyzeMatch?: (match: Match) => void;
  onNavigateToAnalysis?: () => void;
}

export interface CompletenessResult {
  isComplete: boolean;
  missingFields: string[];
}

export interface MatchFullCompleteness {
  is100PercentComplete: boolean;
  isPreMatchComplete: boolean;
  hasScore: boolean;
  hasStats: boolean;
  hasPressureData: boolean;
  missingFields: string[];
  missingPreMatchFields: string[];
  filledStatsSummary: string[];
}

export function checkMatchFullCompleteness(match: Match): MatchFullCompleteness {
  const missingPreMatch: string[] = [];
  const missingAll: string[] = [];

  // 1. Data/Hora
  if (!match.matchDate) {
    missingPreMatch.push('Data/Hora');
    missingAll.push('Data/Hora');
  }

  // 2. Odds 1X2 FT
  if (
    !match.odds ||
    match.odds.homeFT == null ||
    match.odds.drawFT == null ||
    match.odds.awayFT == null
  ) {
    missingPreMatch.push('Odds 1X2 FT');
    missingAll.push('Odds 1X2 FT');
  }

  const isPreMatchComplete = missingPreMatch.length === 0;

  // 3. Placar Final
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  if (!hasScore) {
    missingAll.push('Placar Final');
  }

  // 4. Estatísticas
  const st = match.stats || {};
  const filledStatsSummary: string[] = [];

  if (st.halftimeHomeScore != null && st.halftimeAwayScore != null) {
    filledStatsSummary.push('Placar HT');
  }
  if (st.cornersHomeFT != null) {
    filledStatsSummary.push('Escanteios');
  }
  if (st.possessionHomeFT != null) {
    filledStatsSummary.push('Posse %');
  }
  if (
    st.shotsHomeFT != null ||
    st.shotsOnTargetHomeFT != null
  ) {
    filledStatsSummary.push('Finalizações');
  }
  if (
    st.yellowCardsHomeFT != null ||
    st.redCardsHomeFT != null
  ) {
    filledStatsSummary.push('Cartões');
  }

  const hasStats = filledStatsSummary.length > 0;
  if (!hasStats) {
    missingAll.push('Estatísticas da Partida');
  }

  const is100PercentComplete = isPreMatchComplete && hasScore && hasStats;
  const hasPressureData = Boolean(
    match.pressureData &&
    ((match.pressureData.timeline && match.pressureData.timeline.length > 0) || match.pressureData.sourceImageUrl)
  );

  return {
    is100PercentComplete,
    isPreMatchComplete,
    hasScore,
    hasStats,
    hasPressureData,
    missingFields: missingAll,
    missingPreMatchFields: missingPreMatch,
    filledStatsSummary,
  };
}

export function checkMatchCompleteness(match: Match): CompletenessResult {
  const full = checkMatchFullCompleteness(match);
  return {
    isComplete: full.isPreMatchComplete,
    missingFields: full.missingPreMatchFields,
  };
}

export const MatchList: React.FC<MatchListProps> = ({
  dbState,
  isMaster = true,
  onEditMatch,
  onDeleteMatch,
  onOpenMatchModal,
  onOpenStatsModal,
  onOpenQuickScore,
  onOpenBulkMatchImportModal,
  onOpenBulkMatchUpdateModal,
  onOpenPressureChartModal,
  onAnalyzeMatch,
  onNavigateToAnalysis,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountryId, setFilterCountryId] = useState('');
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [futureCompletenessFilter, setFutureCompletenessFilter] = useState<'ALL' | '100_PERCENT' | 'PRE_MATCH_COMPLETE' | 'INCOMPLETE'>('ALL');
  const [viewLayout, setViewLayout] = useState<'single' | 'double'>('single');
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});
  const [expandedStatsMatchId, setExpandedStatsMatchId] = useState<string | null>(null);

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const collapseAllSections = () => {
    setCollapsedSections({
      full100: true,
      preMatch: true,
      incomplete: true,
      other: true,
    });
  };

  const expandAllSections = () => {
    setCollapsedSections({
      full100: false,
      preMatch: false,
      incomplete: false,
      other: false,
    });
  };
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

  // Display limits per section to maintain instant 60fps rendering without DOM congestion
  const [displayLimits, setDisplayLimits] = useState<{ [key: string]: number }>({
    full100: 24,
    preMatch: 24,
    incomplete: 24,
    other: 24,
  });

  const handleShowMore = (sectionKey: string, step: number = 24) => {
    setDisplayLimits(prev => ({
      ...prev,
      [sectionKey]: (prev[sectionKey] || 24) + step,
    }));
  };

  const handleShowAll = (sectionKey: string, total: number) => {
    setDisplayLimits(prev => ({
      ...prev,
      [sectionKey]: total,
    }));
  };

  // Fast O(1) Lookup Maps for instant rendering without linear array scans
  const countriesMap = useMemo(() => {
    const map = new Map<string, Country>();
    for (const c of dbState.countries || []) {
      map.set(c.id, c);
      if (c.name) map.set(c.name.toLowerCase(), c);
    }
    return map;
  }, [dbState.countries]);

  const leaguesMap = useMemo(() => {
    const map = new Map<string, League>();
    for (const l of dbState.leagues || []) {
      map.set(l.id, l);
      if (l.name) map.set(l.name.toLowerCase(), l);
    }
    return map;
  }, [dbState.leagues]);

  const teamsMap = useMemo(() => {
    const map = new Map<string, Team>();
    for (const t of dbState.teams || []) {
      map.set(t.id, t);
      if (t.name) map.set(t.name.toLowerCase(), t);
    }
    return map;
  }, [dbState.teams]);

  const matches = dbState.matches || [];

  // Memoized Completeness Map for every match (computed only once per match list change)
  const completenessMap = useMemo(() => {
    const map = new Map<string, MatchFullCompleteness>();
    for (const m of matches) {
      map.set(m.id, checkMatchFullCompleteness(m));
    }
    return map;
  }, [matches]);

  // Counts & Completeness calculations
  const totalMatches = matches.length;
  const { full100MatchesCount, preMatchOnlyCount, incompleteCount, agendadosCount, finalizadosCount, emAndamentoCount } = useMemo(() => {
    let full100 = 0;
    let preOnly = 0;
    let inc = 0;
    let agend = 0;
    let fin = 0;
    let emAnd = 0;

    for (const m of matches) {
      const comp = completenessMap.get(m.id) || checkMatchFullCompleteness(m);
      if (comp.is100PercentComplete) full100++;
      else if (comp.isPreMatchComplete) preOnly++;
      else inc++;

      if (m.status === 'AGENDADO') agend++;
      else if (m.status === 'FINALIZADO') fin++;
      else if (m.status === 'EM_ANDAMENTO') emAnd++;
    }

    return {
      full100MatchesCount: full100,
      preMatchOnlyCount: preOnly,
      incompleteCount: inc,
      agendadosCount: agend,
      finalizadosCount: fin,
      emAndamentoCount: emAnd,
    };
  }, [matches, completenessMap]);

  // Available leagues filtered by country if selected
  const availableLeagues = useMemo(() => {
    return (dbState.leagues || []).filter(l => {
      if (filterCountryId) return l.countryId === filterCountryId;
      return true;
    });
  }, [dbState.leagues, filterCountryId]);

  // Memoized Filter logic
  const filteredMatches = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();

    return matches.filter(match => {
      if (searchLower) {
        const matchesSearch =
          match.id.toLowerCase().includes(searchLower) ||
          match.homeTeamName.toLowerCase().includes(searchLower) ||
          match.awayTeamName.toLowerCase().includes(searchLower) ||
          match.leagueName.toLowerCase().includes(searchLower) ||
          match.countryName.toLowerCase().includes(searchLower) ||
          match.homeTeamId.toLowerCase().includes(searchLower) ||
          match.awayTeamId.toLowerCase().includes(searchLower) ||
          (match.referee && match.referee.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      if (filterCountryId && match.countryId !== filterCountryId) {
        return false;
      }
      
      if (selectedLeagueIds.length > 0 && !selectedLeagueIds.includes(match.leagueId)) {
        return false;
      }

      if (filterStatus && match.status !== filterStatus) {
        return false;
      }

      if (futureCompletenessFilter !== 'ALL') {
        const comp = completenessMap.get(match.id) || checkMatchFullCompleteness(match);
        if (futureCompletenessFilter === '100_PERCENT' && !comp.is100PercentComplete) {
          return false;
        }
        if (futureCompletenessFilter === 'PRE_MATCH_COMPLETE' && (!comp.isPreMatchComplete || comp.is100PercentComplete)) {
          return false;
        }
        if (futureCompletenessFilter === 'INCOMPLETE' && comp.isPreMatchComplete) {
          return false;
        }
      }

      return true;
    });
  }, [matches, searchTerm, filterCountryId, selectedLeagueIds, filterStatus, futureCompletenessFilter, completenessMap]);

  // Memoized Grouped match categories for section separators
  const { full100Group, preMatchScheduled, incompleteScheduled, otherMatches } = useMemo(() => {
    const f100: Match[] = [];
    const preSch: Match[] = [];
    const incSch: Match[] = [];
    const oth: Match[] = [];

    for (const m of filteredMatches) {
      const comp = completenessMap.get(m.id) || checkMatchFullCompleteness(m);
      if (comp.is100PercentComplete) {
        f100.push(m);
      } else if (m.status === 'AGENDADO' && comp.isPreMatchComplete) {
        preSch.push(m);
      } else if (m.status === 'AGENDADO' && !comp.isPreMatchComplete) {
        incSch.push(m);
      } else {
        oth.push(m);
      }
    }

    return {
      full100Group: f100,
      preMatchScheduled: preSch,
      incompleteScheduled: incSch,
      otherMatches: oth,
    };
  }, [filteredMatches, completenessMap]);

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
      {/* Banner de Destaque Visual - Módulo de Análise & Power Ranking */}
      {onNavigateToAnalysis && (
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 rounded-2xl p-4 sm:p-5 text-white shadow-xl shadow-indigo-950/20 border border-indigo-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 font-black shrink-0 shadow-lg shadow-amber-400/20 border border-amber-300">
              <Zap className="w-6 h-6 fill-slate-950 text-slate-950 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Módulo de Análise & Power Ranking
              </h3>
              <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                Compare confrontos com modelo Poisson de placar, índice de força ponderado por Odds, eficiência de xG, médias descritivas (Média, Desvio Padrão, CV%) e indicadores +EV.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToAnalysis}
            className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.98] shrink-0 cursor-pointer border border-amber-300"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Acessar Painel de Análise</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

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

        {/* Filter Sub-Bar */}
        <div className="bg-white border border-blue-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filtro de Preenchimento:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFutureCompletenessFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                futureCompletenessFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Todos os Jogos</span>
              <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded">
                {totalMatches}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFutureCompletenessFilter('100_PERCENT')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                futureCompletenessFilter === '100_PERCENT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>🌟 100% Preenchidos</span>
              <span className="font-mono text-[10px] bg-emerald-200/80 px-1.5 py-0.2 rounded font-black text-emerald-900">
                {full100MatchesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFutureCompletenessFilter('PRE_MATCH_COMPLETE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                futureCompletenessFilter === 'PRE_MATCH_COMPLETE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>📋 Pré-Jogo Pronto</span>
              <span className="font-mono text-[10px] bg-blue-100 px-1.5 py-0.2 rounded text-blue-900">
                {preMatchOnlyCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFutureCompletenessFilter('INCOMPLETE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                futureCompletenessFilter === 'INCOMPLETE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <FileWarning className="w-3.5 h-3.5 text-amber-600" />
              <span>⚠️ Faltando Dados</span>
              <span className="font-mono text-[10px] bg-amber-100 px-1.5 py-0.2 rounded text-amber-900">
                {incompleteCount}
              </span>
            </button>

            {onOpenBulkMatchUpdateModal && (
              <button
                type="button"
                onClick={onOpenBulkMatchUpdateModal}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Baixar planilha de jogos incompletos e subir dados em massa"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                <span>Subir Dados em Massa (Excel)</span>
              </button>
            )}

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
          {/* Top Bar for Results & Layout Selection */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-slate-600 font-medium">
                Exibindo <b>{filteredMatches.length}</b> de <b>{totalMatches}</b> jogos cadastrados •{' '}
                <span className="text-emerald-700 font-bold">🌟 {full100MatchesCount} 100% preenchidos</span>
              </span>

              {/* Quick Actions: Expand/Collapse All */}
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <button
                  type="button"
                  onClick={expandAllSections}
                  className="px-2 py-0.5 rounded text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer flex items-center gap-1"
                  title="Expandir todas as seções"
                >
                  <ChevronDown className="w-3 h-3" />
                  <span>Expandir Todos</span>
                </button>
                <button
                  type="button"
                  onClick={collapseAllSections}
                  className="px-2 py-0.5 rounded text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                  title="Recolher todas as seções"
                >
                  <ChevronUp className="w-3 h-3" />
                  <span>Recolher Todos</span>
                </button>
              </div>
            </div>

            {/* Layout Toggle: 1 Coluna (um embaixo do outro) vs 2 Colunas */}
            <div className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg">
              <button
                type="button"
                onClick={() => setViewLayout('single')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'single'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Visualizar jogos um embaixo do outro (1 Coluna)"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>1 Coluna (Vertical)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('double')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'double'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Visualizar jogos divididos em 2 Colunas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>2 Colunas</span>
              </button>
            </div>
          </div>

          {/* Section 1: 🌟 JOGOS 100% PREENCHIDOS (DADOS, PLACAR & ESTATÍSTICAS) */}
          {full100Group.length > 0 && (
            <div className="space-y-3">
              <div
                onClick={() => toggleSection('full100')}
                className="bg-linear-to-r from-emerald-500 via-teal-600 to-emerald-600 text-white rounded-xl p-3.5 flex items-center justify-between shadow-sm border border-emerald-400 cursor-pointer select-none transition-all hover:brightness-105 group"
                title={collapsedSections['full100'] ? 'Clique para expandir os jogos' : 'Clique para recolher os jogos'}
              >
                <div className="flex items-center gap-2.5 font-black text-sm sm:text-base">
                  <span className="p-1 rounded-lg bg-white/20 text-white group-hover:bg-white/30 transition-all">
                    {collapsedSections['full100'] ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                  <Trophy className="w-5 h-5 text-amber-300 shrink-0" />
                  <span>🌟 JOGOS 100% PREENCHIDOS (DADOS, ODDS, PLACAR & ESTATÍSTICAS)</span>
                  <span className="bg-white/20 text-white font-mono text-xs px-2.5 py-0.5 rounded-full border border-white/30 font-black">
                    {full100Group.length} partidas
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-100 hidden md:inline font-medium">
                    Partidas com 100% das informações cadastradas incluindo estatísticas completas.
                  </span>
                  <span className="text-xs font-bold bg-black/20 hover:bg-black/30 text-emerald-50 px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1">
                    {collapsedSections['full100'] ? 'Expandir ▼' : 'Recolher ▲'}
                  </span>
                </div>
              </div>

              {!collapsedSections['full100'] && (
                <div className="space-y-4">
                  <div className={viewLayout === 'single' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
                    {full100Group.slice(0, displayLimits['full100'] || 24).map((match, idx) => renderMatchCard(match, `full_${idx}`))}
                  </div>
                  {full100Group.length > (displayLimits['full100'] || 24) && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleShowMore('full100', 24)}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-all cursor-pointer shadow-xs"
                      >
                        + Carregar mais 24 partidas (Exibindo {Math.min(displayLimits['full100'] || 24, full100Group.length)} de {full100Group.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShowAll('full100', full100Group.length)}
                        className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
                      >
                        Mostrar todas ({full100Group.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Jogos Pré-Jogo Completos (Aguardando Placar/Stats) */}
          {preMatchScheduled.length > 0 && (
            <div className="space-y-3">
              <div
                onClick={() => toggleSection('preMatch')}
                className="bg-blue-50 hover:bg-blue-100/80 border-l-4 border-blue-500 border-y border-r border-blue-200 rounded-xl p-3 flex items-center justify-between shadow-xs cursor-pointer select-none transition-all group"
                title={collapsedSections['preMatch'] ? 'Clique para expandir os jogos' : 'Clique para recolher os jogos'}
              >
                <div className="flex items-center gap-2.5 text-blue-950 font-bold text-sm">
                  <span className="p-1 rounded-lg bg-blue-200/70 text-blue-800 group-hover:bg-blue-300 transition-all">
                    {collapsedSections['preMatch'] ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                  <FileCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>📋 Jogos Agendados - Pré-Jogo Completo (Aguardando Placar & Estatísticas)</span>
                  <span className="bg-blue-200/60 text-blue-900 font-mono text-xs px-2 py-0.5 rounded-full border border-blue-300">
                    {preMatchScheduled.length} partidas
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-700 hidden sm:inline">
                    Partidas com Data, Estádio, Rodada e Odds 1X2 FT preenchidos.
                  </span>
                  <span className="text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1">
                    {collapsedSections['preMatch'] ? 'Expandir ▼' : 'Recolher ▲'}
                  </span>
                </div>
              </div>

              {!collapsedSections['preMatch'] && (
                <div className="space-y-4">
                  <div className={viewLayout === 'single' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
                    {preMatchScheduled.slice(0, displayLimits['preMatch'] || 24).map((match, idx) => renderMatchCard(match, `pre_${idx}`))}
                  </div>
                  {preMatchScheduled.length > (displayLimits['preMatch'] || 24) && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleShowMore('preMatch', 24)}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl border border-blue-300 transition-all cursor-pointer shadow-xs"
                      >
                        + Carregar mais 24 partidas (Exibindo {Math.min(displayLimits['preMatch'] || 24, preMatchScheduled.length)} de {preMatchScheduled.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShowAll('preMatch', preMatchScheduled.length)}
                        className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
                      >
                        Mostrar todas ({preMatchScheduled.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Jogos com Pendências / Incompletos */}
          {incompleteScheduled.length > 0 && (
            <div className="space-y-3">
              <div
                onClick={() => toggleSection('incomplete')}
                className="bg-amber-50 hover:bg-amber-100/80 border-l-4 border-amber-500 border-y border-r border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-xs cursor-pointer select-none transition-all group"
                title={collapsedSections['incomplete'] ? 'Clique para expandir os jogos' : 'Clique para recolher os jogos'}
              >
                <div className="flex items-center gap-2.5 text-amber-950 font-bold text-sm">
                  <span className="p-1 rounded-lg bg-amber-200/70 text-amber-900 group-hover:bg-amber-300 transition-all">
                    {collapsedSections['incomplete'] ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                  <FileWarning className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>⚠️ Jogos com Pendências de Dados Pré-Jogo</span>
                  <span className="bg-amber-200/60 text-amber-900 font-mono text-xs px-2 py-0.5 rounded-full border border-amber-300">
                    {incompleteScheduled.length} partidas
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-800 hidden sm:inline">
                    Faltando estádio, rodada ou odds 1X2 FT.
                  </span>
                  <span className="text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1">
                    {collapsedSections['incomplete'] ? 'Expandir ▼' : 'Recolher ▲'}
                  </span>
                </div>
              </div>

              {!collapsedSections['incomplete'] && (
                <div className="space-y-4">
                  <div className={viewLayout === 'single' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
                    {incompleteScheduled.slice(0, displayLimits['incomplete'] || 24).map((match, idx) => renderMatchCard(match, `inc_${idx}`))}
                  </div>
                  {incompleteScheduled.length > (displayLimits['incomplete'] || 24) && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleShowMore('incomplete', 24)}
                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition-all cursor-pointer shadow-xs"
                      >
                        + Carregar mais 24 partidas (Exibindo {Math.min(displayLimits['incomplete'] || 24, incompleteScheduled.length)} de {incompleteScheduled.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShowAll('incomplete', incompleteScheduled.length)}
                        className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
                      >
                        Mostrar todas ({incompleteScheduled.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 4: Outras Partidas (Finalizados sem stats 100%, Ao Vivo, etc) */}
          {otherMatches.length > 0 && (
            <div className="space-y-3">
              {(full100Group.length > 0 || preMatchScheduled.length > 0 || incompleteScheduled.length > 0) && (
                <div
                  onClick={() => toggleSection('other')}
                  className="bg-slate-100 hover:bg-slate-200/80 border-l-4 border-slate-600 border-y border-r border-slate-300 rounded-xl p-3 flex items-center justify-between shadow-xs cursor-pointer select-none transition-all group"
                  title={collapsedSections['other'] ? 'Clique para expandir os jogos' : 'Clique para recolher os jogos'}
                >
                  <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                    <span className="p-1 rounded-lg bg-slate-200 text-slate-700 group-hover:bg-slate-300 transition-all">
                      {collapsedSections['other'] ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-slate-600 shrink-0" />
                    <span>🏁 Outras Partidas (Faltando Estatísticas ou Ao Vivo)</span>
                    <span className="bg-slate-200 text-slate-900 font-mono text-xs px-2 py-0.5 rounded-full border border-slate-300">
                      {otherMatches.length} partidas
                    </span>
                  </div>

                  <span className="text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-300 flex items-center gap-1">
                    {collapsedSections['other'] ? 'Expandir ▼' : 'Recolher ▲'}
                  </span>
                </div>
              )}

              {!collapsedSections['other'] && (
                <div className="space-y-4">
                  <div className={viewLayout === 'single' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
                    {otherMatches.slice(0, displayLimits['other'] || 24).map((match, idx) => renderMatchCard(match, `oth_${idx}`))}
                  </div>
                  {otherMatches.length > (displayLimits['other'] || 24) && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleShowMore('other', 24)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer shadow-xs"
                      >
                        + Carregar mais 24 partidas (Exibindo {Math.min(displayLimits['other'] || 24, otherMatches.length)} de {otherMatches.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShowAll('other', otherMatches.length)}
                        className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
                      >
                        Mostrar todas ({otherMatches.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Helper function to render individual match card
  function renderMatchCard(match: Match, keySuffix?: string | number) {
    const isExpanded = expandedStatsMatchId === match.id;
    const fullComp = completenessMap.get(match.id) || checkMatchFullCompleteness(match);
    const hasStats = fullComp.hasStats;

    const country = countriesMap.get(match.countryId) || (match.countryName ? countriesMap.get(match.countryName.toLowerCase()) : undefined);
    const flagUrl = match.countryFlagUrl || country?.flagUrl;

    const league = leaguesMap.get(match.leagueId) || (match.leagueName ? leaguesMap.get(match.leagueName.toLowerCase()) : undefined);
    const leagueLogoUrl = match.leagueLogoUrl || league?.logoUrl;

    const homeTeam = teamsMap.get(match.homeTeamId) || (match.homeTeamName ? teamsMap.get(match.homeTeamName.toLowerCase()) : undefined);
    const homeLogoUrl = match.homeTeamLogoUrl || homeTeam?.logoUrl;

    const awayTeam = teamsMap.get(match.awayTeamId) || (match.awayTeamName ? teamsMap.get(match.awayTeamName.toLowerCase()) : undefined);
    const awayLogoUrl = match.awayTeamLogoUrl || awayTeam?.logoUrl;

    return (
      <div
        key={keySuffix !== undefined ? `${match.id || 'm'}_${keySuffix}` : (match.id || 'match')}
        className={`${
          fullComp.is100PercentComplete
            ? 'bg-linear-to-b from-emerald-50/80 via-white to-teal-50/30 border-2 border-emerald-500 shadow-md ring-4 ring-emerald-500/20 hover:border-emerald-600'
            : match.status === 'AGENDADO'
            ? fullComp.isPreMatchComplete
              ? 'bg-white border border-blue-300 hover:border-blue-400 shadow-sm'
              : 'bg-white border border-amber-300 hover:border-amber-500 shadow-sm'
            : 'bg-white border border-slate-200 hover:border-blue-300 shadow-sm'
        } rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between space-y-4 group`}
      >
        {/* Card Top: Match Unique ID + Country + League + Completeness Badge + Status */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Match ID */}
            <span
              className={`font-mono font-bold text-xs ${
                fullComp.is100PercentComplete
                  ? 'bg-emerald-700 text-white border-emerald-600'
                  : 'bg-blue-600 text-white border-blue-500'
              } border px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs`}
            >
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

          <div className="flex items-center gap-2 flex-wrap">
            {/* Pressure Chart Badge */}
            {match.pressureData && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenPressureChartModal) onOpenPressureChartModal(match.id);
                }}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                title="Clique para abrir o Gráfico de Pressão"
              >
                <TrendingUp className="w-3 h-3 text-amber-600" />
                <span>Pressão ({match.pressureData.homeDominancePct}% x {match.pressureData.awayDominancePct}%)</span>
              </button>
            )}

            {/* Completeness Badge */}
            {fullComp.is100PercentComplete ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white border border-emerald-500 flex items-center gap-1 shadow-xs animate-in fade-in">
                <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                100% PREENCHIDO
              </span>
            ) : match.status === 'AGENDADO' ? (
              fullComp.isPreMatchComplete ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 shadow-xs">
                  <FileCheck className="w-3 h-3 text-blue-600" />
                  Pré-Jogo Pronto
                </span>
              ) : (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs"
                  title={`Faltam os campos: ${fullComp.missingPreMatchFields.join(', ')}`}
                >
                  <FileWarning className="w-3 h-3 text-amber-600" />
                  Falta: {fullComp.missingPreMatchFields.join(', ')}
                </span>
              )
            ) : !fullComp.hasStats ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <FileWarning className="w-3 h-3 text-amber-600" />
                Falta Stats
              </span>
            ) : null}

            <div>{getStatusBadge(match.status)}</div>
          </div>
        </div>

        {/* Dynamic Completeness Banner */}
        {fullComp.is100PercentComplete ? (
          <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border border-emerald-500 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
              <span>🌟 100% Preenchido • Dados, Odds, Placar & Estatísticas</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenQuickScore && (
                <button
                  type="button"
                  onClick={() => onOpenQuickScore(match)}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white border border-white/40 text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  title="Editar Placar & Odds"
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>Placar/Odds</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenStatsModal(match)}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-950 border border-white text-xs font-black rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
              >
                <BarChart2 className="w-3 h-3 text-emerald-700" />
                <span>Ver Stats</span>
              </button>
            </div>
          </div>
        ) : match.status === 'AGENDADO' ? (
          <div
            className={`${
              fullComp.isPreMatchComplete
                ? 'bg-blue-50/90 border-blue-200'
                : 'bg-amber-50/90 border-amber-200'
            } border rounded-xl p-2.5 flex items-center justify-between gap-2`}
          >
            <div className="flex items-center gap-2 text-xs font-medium">
              {fullComp.isPreMatchComplete ? (
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <FileWarning className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="text-slate-800 font-medium">
                {fullComp.isPreMatchComplete
                  ? 'Jogo Agendado • Dados Pré-Jogo Completos (Aguardando Placar & Stats)'
                  : `Jogo Agendado • Faltando: ${fullComp.missingPreMatchFields.join(', ')}`}
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
        ) : !fullComp.hasStats ? (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-900">
              <FileWarning className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Placar registrado, mas <b>estatísticas não foram preenchidas</b>.</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenStatsModal(match)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
            >
              <BarChart2 className="w-3 h-3" />
              <span>Preencher Stats</span>
            </button>
          </div>
        ) : null}

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

          {/* Score Pill & HT */}
          <div className="col-span-1 text-center flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => {
                if (isMaster && onOpenQuickScore) onOpenQuickScore(match);
                else onOpenStatsModal(match);
              }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 hover:border-blue-500 text-blue-950 rounded-xl font-black text-lg sm:text-xl shadow-xs font-mono tracking-wider min-w-[68px] transition-all cursor-pointer hover:scale-105"
              title={isMaster ? "Clique para Lançar/Editar Placar & Odds Rápido" : "Ver Estatísticas"}
            >
              {match.homeScore !== null && match.awayScore !== null ? (
                `${match.homeScore} - ${match.awayScore}`
              ) : (
                <span className="text-xs text-slate-400 font-sans uppercase">vs</span>
              )}
            </button>
            {match.stats?.halftimeHomeScore != null && match.stats?.halftimeAwayScore != null && (
              <span
                className="mt-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-mono text-[10px] font-bold border border-blue-200"
                title="Placar do 1º Tempo (HT)"
              >
                HT: {match.stats.halftimeHomeScore} - {match.stats.halftimeAwayScore}
              </span>
            )}
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

        {/* Odds & Cotações Badge Strip */}
        {match.odds &&
          (match.odds.homeFT != null ||
            match.odds.drawFT != null ||
            match.odds.awayFT != null ||
            match.odds.over25FT != null ||
            match.odds.under25FT != null ||
            match.odds.asianHandicapHomeLine != null ||
            match.odds.asianHandicapAwayLine != null) && (
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
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
                {match.odds.asianHandicapHomeLine != null && (
                  <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                    <span className="text-slate-500 font-sans">HA Mand ({match.odds.asianHandicapHomeLine > 0 ? `+${match.odds.asianHandicapHomeLine}` : match.odds.asianHandicapHomeLine}):</span>
                    <span className="text-blue-700 font-bold">{match.odds.asianHandicapHomeOdd ?? '-'}</span>
                  </div>
                )}
                {match.odds.asianHandicapAwayLine != null && (
                  <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                    <span className="text-slate-500 font-sans">HA Vis ({match.odds.asianHandicapAwayLine > 0 ? `+${match.odds.asianHandicapAwayLine}` : match.odds.asianHandicapAwayLine}):</span>
                    <span className="text-blue-700 font-bold">{match.odds.asianHandicapAwayOdd ?? '-'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Expandable Match Stats Section */}
        {isExpanded && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Pressure Chart if present */}
            {match.pressureData && (
              <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    Gráfico de Pressão & Domínio Extraído (IA)
                  </span>
                  {onOpenPressureChartModal && (
                    <button
                      type="button"
                      onClick={() => onOpenPressureChartModal(match.id)}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Abrir Detalhado
                    </button>
                  )}
                </div>
                <PressureChartViewer
                  pressureData={match.pressureData}
                  homeTeamName={match.homeTeamName}
                  awayTeamName={match.awayTeamName}
                />
              </div>
            )}

            {match.stats && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200 pb-1.5">
                  <span>Estatísticas da Partida (FT & HT)</span>
                  {match.stats.halftimeHomeScore !== undefined && match.stats.halftimeHomeScore !== null && (
                    <span className="text-blue-900 font-mono font-bold bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                      1º Tempo (HT): {match.stats.halftimeHomeScore} - {match.stats.halftimeAwayScore}
                    </span>
                  )}
                </div>

                {/* Posse de bola bar */}
                {match.stats.possessionHomeFT != null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-700 font-medium">
                      <span>{match.stats.possessionHomeFT}% Posse FT</span>
                      <span className="text-slate-500 font-bold">Posse de Bola</span>
                      <span>{match.stats.possessionAwayFT ?? (100 - match.stats.possessionHomeFT)}% Posse FT</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        className="bg-blue-600 h-full transition-all"
                        style={{ width: `${match.stats.possessionHomeFT}%` }}
                      />
                      <div
                        className="bg-blue-400 h-full transition-all"
                        style={{ width: `${match.stats.possessionAwayFT ?? (100 - match.stats.possessionHomeFT)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Métricas Detalhadas da Planilha */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  {/* xG FT */}
                  {(match.stats.xgHomeFT != null || match.stats.xgAwayFT != null) && (
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="block text-[10px] font-bold text-slate-500 font-sans uppercase">xG (Gols Esperados)</span>
                      <span className="text-slate-900 font-bold">
                        <span className="text-blue-600">{match.stats.xgHomeFT ?? '-'}</span> x <span className="text-blue-600">{match.stats.xgAwayFT ?? '-'}</span>
                      </span>
                    </div>
                  )}

                  {/* Finalizações FT */}
                  {(match.stats.shotsHomeFT != null || match.stats.shotsAwayFT != null) && (
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="block text-[10px] font-bold text-slate-500 font-sans uppercase">Finalizações FT</span>
                      <span className="text-slate-900 font-bold">
                        <span className="text-blue-600">{match.stats.shotsHomeFT ?? '-'}</span> x <span className="text-blue-600">{match.stats.shotsAwayFT ?? '-'}</span>
                      </span>
                    </div>
                  )}

                  {/* Chutes no Alvo FT */}
                  {(match.stats.shotsOnTargetHomeFT != null || match.stats.shotsOnTargetAwayFT != null) && (
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="block text-[10px] font-bold text-slate-500 font-sans uppercase">Chutes ao Gol FT</span>
                      <span className="text-slate-900 font-bold">
                        <span className="text-blue-600">{match.stats.shotsOnTargetHomeFT ?? '-'}</span> x <span className="text-blue-600">{match.stats.shotsOnTargetAwayFT ?? '-'}</span>
                      </span>
                    </div>
                  )}

                  {/* Escanteios FT */}
                  {(match.stats.cornersHomeFT != null || match.stats.cornersAwayFT != null) && (
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="block text-[10px] font-bold text-slate-500 font-sans uppercase">🚩 Escanteios FT</span>
                      <span className="text-slate-900 font-bold">
                        <span className="text-blue-600">{match.stats.cornersHomeFT ?? '-'}</span> x <span className="text-blue-600">{match.stats.cornersAwayFT ?? '-'}</span>
                      </span>
                    </div>
                  )}

                  {/* Faltas FT */}
                  {(match.stats.foulsHomeFT != null || match.stats.foulsAwayFT != null) && (
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="block text-[10px] font-bold text-slate-500 font-sans uppercase">Faltas FT</span>
                      <span className="text-slate-900 font-bold">
                        <span className="text-blue-600">{match.stats.foulsHomeFT ?? '-'}</span> x <span className="text-blue-600">{match.stats.foulsAwayFT ?? '-'}</span>
                      </span>
                    </div>
                  )}

                  {/* Cartões Amarelos FT */}
                  {(match.stats.yellowCardsHomeFT != null || match.stats.yellowCardsAwayFT != null) && (
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="block text-[10px] font-bold text-slate-500 font-sans uppercase">🟨 Cartões Amarelos</span>
                      <span className="text-slate-900 font-bold">
                        <span className="text-amber-600">{match.stats.yellowCardsHomeFT ?? '-'}</span> x <span className="text-amber-600">{match.stats.yellowCardsAwayFT ?? '-'}</span>
                      </span>
                    </div>
                  )}

                  {/* Cartões Vermelhos FT */}
                  {(match.stats.redCardsHomeFT != null || match.stats.redCardsAwayFT != null) && (
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="block text-[10px] font-bold text-slate-500 font-sans uppercase">🟥 Cartões Vermelhos</span>
                      <span className="text-slate-900 font-bold">
                        <span className="text-rose-600">{match.stats.redCardsHomeFT ?? '-'}</span> x <span className="text-rose-600">{match.stats.redCardsAwayFT ?? '-'}</span>
                      </span>
                    </div>
                  )}
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
            {/* Expand stats toggle if stats or pressureData exist */}
            {(hasStats || match.pressureData) && (
              <button
                onClick={() => setExpandedStatsMatchId(isExpanded ? null : match.id)}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 border border-blue-200 transition-colors"
              >
                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {/* Pressure Chart button */}
            {onOpenPressureChartModal && (
              <button
                type="button"
                onClick={() => onOpenPressureChartModal(match.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 transition-all shadow-xs cursor-pointer ${
                  match.pressureData
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={match.pressureData ? 'Ver / Editar Gráfico de Pressão' : 'Importar Gráfico de Pressão via IA'}
              >
                <TrendingUp className={`w-3.5 h-3.5 ${match.pressureData ? 'text-amber-600' : 'text-slate-500'}`} />
                <span>{match.pressureData ? 'Gráfico' : 'Gráfico IA'}</span>
              </button>
            )}

            {/* Quick Score button (Master only) */}
            {isMaster && onOpenQuickScore && (
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

            {/* Analysis & Power Ranking button */}
            {onAnalyzeMatch && (
              <button
                type="button"
                onClick={() => onAnalyzeMatch(match)}
                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-black border border-indigo-400/80 flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                title="Abrir Módulo de Análise & Power Ranking para este confronto"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                <span>Análise</span>
              </button>
            )}

            {/* Stats modal launch button */}
            <button
              onClick={() => onOpenStatsModal(match)}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold border border-blue-500 flex items-center gap-1 transition-all shadow-xs"
              title={isMaster ? "Lançar/Editar Placar & Estatísticas" : "Ver Estatísticas da Partida"}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{isMaster ? (match.status === 'AGENDADO' ? 'Lançar Stats' : 'Estatísticas') : 'Ver Estatísticas'}</span>
            </button>

            {isMaster && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
};

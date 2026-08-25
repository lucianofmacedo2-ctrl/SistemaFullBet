import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Flame,
  Award,
  ArrowUpDown,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Calendar,
  Zap,
  BarChart3,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Scale,
  Activity,
  CheckCircle2,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Camera,
  ExternalLink,
  X,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { DbState, Match } from '../types';
import {
  computeRefereeStats,
  RefereeStats,
  RefereeGlobalAverages,
} from '../utils/refereeAnalytics';
import { exportRefereesToExcel, formatIsoToDDMMYYYY } from '../utils/excelHelper';
import { isValidImageUrl, sanitizeImageUrl } from '../utils/imageHelper';

interface RefereeStatsModuleProps {
  dbState: DbState;
  onOpenMatchStats?: (match: Match) => void;
  onSelectMatchAnalysis?: (match: Match) => void;
  onUpdateRefereePhoto?: (refereeName: string, photoUrl: string) => Promise<void> | void;
  initialRefereeName?: string;
}

type SortField =
  | 'totalMatches'
  | 'finishedMatches'
  | 'avgTotalCards'
  | 'avgYellowCards'
  | 'avgRedCards'
  | 'redCardMatchPct'
  | 'avgFouls'
  | 'foulsPerCard'
  | 'avgGoals'
  | 'over25Pct'
  | 'bttsPct'
  | 'homeWinPct';

export const RefereeStatsModule: React.FC<RefereeStatsModuleProps> = ({
  dbState,
  onOpenMatchStats,
  onSelectMatchAnalysis,
  onUpdateRefereePhoto,
  initialRefereeName,
}) => {
  // Navigation views within Referee module
  const [activeSubTab, setActiveSubTab] = useState<'ranking' | 'detail' | 'compare' | 'upcoming'>(
    initialRefereeName ? 'detail' : 'ranking'
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('ALL');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('ALL');
  const [minMatches, setMinMatches] = useState<number>(1);
  const [disciplineFilter, setDisciplineFilter] = useState<string>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('avgTotalCards');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Layout mode
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Selected referee for detailed dossier
  const [selectedRefereeId, setSelectedRefereeId] = useState<string | null>(null);

  // Compare referees state
  const [compareRef1Id, setCompareRef1Id] = useState<string>('');
  const [compareRef2Id, setCompareRef2Id] = useState<string>('');

  // Photo editing modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoModalReferee, setPhotoModalReferee] = useState<RefereeStats | null>(null);
  const [photoInputUrl, setPhotoInputUrl] = useState('');
  const [photoTestError, setPhotoTestError] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const handleOpenPhotoModal = (ref: RefereeStats, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPhotoModalReferee(ref);
    setPhotoInputUrl(ref.photoUrl || '');
    setPhotoTestError(false);
    setIsPhotoModalOpen(true);
  };

  const handleSavePhotoModal = async () => {
    if (!photoModalReferee) return;
    setIsSavingPhoto(true);
    try {
      if (onUpdateRefereePhoto) {
        await onUpdateRefereePhoto(photoModalReferee.name, photoInputUrl);
      }
      setIsPhotoModalOpen(false);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Helper to render avatar/photo for a referee
  const renderRefereeAvatar = (photoUrl?: string, name?: string, size: 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
    const sizeClasses = {
      sm: 'w-7 h-7 text-xs rounded-full',
      md: 'w-9 h-9 text-xs rounded-xl',
      lg: 'w-12 h-12 text-sm rounded-2xl',
      xl: 'w-16 h-16 text-xl rounded-2xl',
    }[size];

    const initials = (name || 'A')
      .split(' ')
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase();

    if (photoUrl && isValidImageUrl(photoUrl)) {
      return (
        <img
          src={photoUrl}
          alt={name || 'Árbitro'}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
          className={`${sizeClasses} object-cover border border-slate-200 shadow-2xs shrink-0 bg-slate-100`}
        />
      );
    }

    return (
      <div
        className={`${sizeClasses} bg-gradient-to-br from-slate-700 to-slate-900 text-amber-400 font-black flex items-center justify-center border border-slate-600/50 shadow-2xs shrink-0`}
      >
        {initials || <Scale className="w-4 h-4" />}
      </div>
    );
  };

  // Compute all referee metrics
  const { referees, globalAverages, upcomingRefereeAssignments } = useMemo(() => {
    return computeRefereeStats(dbState.matches, {
      countryId: selectedCountryId,
      leagueId: selectedLeagueId,
      minMatches,
      searchQuery,
    });
  }, [dbState.matches, selectedCountryId, selectedLeagueId, minMatches, searchQuery]);

  // Set initial referee if provided via props
  React.useEffect(() => {
    if (initialRefereeName && referees.length > 0) {
      const match = referees.find(
        r => r.name.toLowerCase() === initialRefereeName.toLowerCase()
      );
      if (match) {
        setSelectedRefereeId(match.id);
        setActiveSubTab('detail');
      }
    }
  }, [initialRefereeName, referees]);

  // Filter and sort referees for the ranking view
  const processedReferees = useMemo(() => {
    let result = [...referees];

    if (disciplineFilter !== 'ALL') {
      result = result.filter(r => r.disciplineLevel === disciplineFilter);
    }

    result.sort((a, b) => {
      let aVal = a[sortField] as number;
      let bVal = b[sortField] as number;
      if (aVal === undefined) aVal = 0;
      if (bVal === undefined) bVal = 0;

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [referees, disciplineFilter, sortField, sortDirection]);

  // Currently active selected referee object
  const activeReferee = useMemo(() => {
    if (!selectedRefereeId) {
      return referees[0] || null;
    }
    return referees.find(r => r.id === selectedRefereeId) || referees[0] || null;
  }, [referees, selectedRefereeId]);

  // Referees for comparison
  const ref1 = useMemo(() => referees.find(r => r.id === compareRef1Id) || referees[0] || null, [referees, compareRef1Id]);
  const ref2 = useMemo(() => referees.find(r => r.id === compareRef2Id) || referees[1] || referees[0] || null, [referees, compareRef2Id]);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportExcel = () => {
    exportRefereesToExcel(processedReferees);
  };

  // Helper badge color
  const getDisciplineBadge = (level: RefereeStats['disciplineLevel']) => {
    switch (level) {
      case 'VERY_STRICT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            Muito Rigoroso
          </span>
        );
      case 'STRICT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Rigoroso
          </span>
        );
      case 'LENIENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Deixa Jogar
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Moderado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Key KPI Summary */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-700/60">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Scale className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Estatísticas de Árbitros & Disciplina
                  </h1>
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider">
                    PRO ANALYTICS
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Análise profunda de cartões amarelos e vermelhos, volume de faltas, médias de gols e viés de arbitragem.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Planilha (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Global Benchmark KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Árbitros Ativos
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
              {globalAverages.totalReferees}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {globalAverages.totalMatchesEvaluated} jogos avaliados
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2.5 bg-amber-400 rounded-xs inline-block" />
              Média Amarelos
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {globalAverages.avgYellowCards.toFixed(2)}
            </div>
            <div className="text-[10px] text-amber-300/80 mt-0.5">
              por partida geral
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2.5 bg-red-500 rounded-xs inline-block" />
              Média Vermelhos
            </div>
            <div className="text-xl sm:text-2xl font-black text-red-400 mt-0.5">
              {globalAverages.avgRedCards.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {(globalAverages.avgRedCards * 100).toFixed(0)}% taxa expulsão
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Média de Faltas
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {globalAverages.avgFouls.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              faltas por jogo
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Média de Gols
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
              {globalAverages.avgGoals.toFixed(2)}
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">
              {globalAverages.avgOver25Pct.toFixed(0)}% Over 2.5
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Viés Mandante
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-400 mt-0.5">
              {globalAverages.avgHomeWinPct.toFixed(0)}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              vitórias em casa
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs Navigation (Ranking vs Raio-X vs Comparador vs Escalações) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('ranking')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'ranking'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Ranking Completo ({referees.length})</span>
          </button>

          <button
            onClick={() => {
              if (referees.length > 0 && !selectedRefereeId) {
                setSelectedRefereeId(referees[0].id);
              }
              setActiveSubTab('detail');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'detail'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4 text-purple-600" />
            <span>Dossiê do Árbitro</span>
          </button>

          <button
            onClick={() => {
              if (referees.length >= 2) {
                if (!compareRef1Id) setCompareRef1Id(referees[0].id);
                if (!compareRef2Id) setCompareRef2Id(referees[1].id);
              }
              setActiveSubTab('compare');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'compare'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-600" />
            <span>Comparador Lado a Lado</span>
          </button>

          <button
            onClick={() => setActiveSubTab('upcoming')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'upcoming'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Próximas Escalações</span>
            {upcomingRefereeAssignments.filter(u => u.refereeStats).length > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                {upcomingRefereeAssignments.filter(u => u.refereeStats).length}
              </span>
            )}
          </button>
        </div>

        {/* View mode toggle for ranking tab */}
        {activeSubTab === 'ranking' && (
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualização em Tabela"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualização em Cards"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 3. TAB CONTENT: RANKING GERAL */}
      {activeSubTab === 'ranking' && (
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar árbitro ou liga..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Country filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">País:</span>
              <select
                value={selectedCountryId}
                onChange={e => {
                  setSelectedCountryId(e.target.value);
                  setSelectedLeagueId('ALL');
                }}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos os Países</option>
                {dbState.countries.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* League filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Liga:</span>
              <select
                value={selectedLeagueId}
                onChange={e => setSelectedLeagueId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todas as Ligas</option>
                {dbState.leagues
                  .filter(l => selectedCountryId === 'ALL' || l.countryId === selectedCountryId)
                  .map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Discipline profile filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Perfil:</span>
              <select
                value={disciplineFilter}
                onChange={e => setDisciplineFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos os Perfis</option>
                <option value="VERY_STRICT">Muito Rigoroso (Altos Cartões)</option>
                <option value="STRICT">Rigoroso</option>
                <option value="MODERATE">Moderado</option>
                <option value="LENIENT">Deixa Jogar (Poucos Cartões)</option>
              </select>
            </div>

            {/* Min matches filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Mín. Jogos:</span>
              <select
                value={minMatches}
                onChange={e => setMinMatches(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1+ Jogo</option>
                <option value={3}>3+ Jogos</option>
                <option value={5}>5+ Jogos</option>
                <option value={10}>10+ Jogos</option>
              </select>
            </div>
          </div>

          {/* Empty state */}
          {processedReferees.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
              <Scale className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
              <h3 className="text-base font-bold text-slate-800">
                Nenhum árbitro encontrado com os filtros atuais
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tente redefinir os filtros de liga, país ou o termo de busca para visualizar os árbitros cadastrados nas partidas.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCountryId('ALL');
                  setSelectedLeagueId('ALL');
                  setMinMatches(1);
                  setDisciplineFilter('ALL');
                }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          )}

          {/* TABLE VIEW */}
          {processedReferees.length > 0 && viewMode === 'table' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-4">Árbitro / Ligas</th>
                      <th
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                        onClick={() => handleSortToggle('finishedMatches')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Jogos</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                        onClick={() => handleSortToggle('avgTotalCards')}
                      >
                        <div className="flex items-center justify-center gap-1 text-amber-400">
                          <span>Média Cartões</span>
                          <ArrowUpDown className="w-3 h-3 text-amber-400" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                        onClick={() => handleSortToggle('avgYellowCards')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-2 h-2.5 bg-amber-400 rounded-xs inline-block" />
                          <span>Amarelos</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                        onClick={() => handleSortToggle('avgRedCards')}
                      >
                        <div className="flex items-center justify-center gap-1 text-red-400">
                          <span className="w-2 h-2.5 bg-red-500 rounded-xs inline-block" />
                          <span>Vermelhos</span>
                          <ArrowUpDown className="w-3 h-3 text-red-400" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                        onClick={() => handleSortToggle('avgFouls')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Faltas/J</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                        onClick={() => handleSortToggle('foulsPerCard')}
                      >
                        <div className="flex items-center justify-center gap-1" title="Faltas marcadas para cada cartão aplicado">
                          <span>Faltas/Cartão</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                        onClick={() => handleSortToggle('avgGoals')}
                      >
                        <div className="flex items-center justify-center gap-1 text-emerald-400">
                          <span>Média Gols</span>
                          <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                        onClick={() => handleSortToggle('over25Pct')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>% Over 2.5</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                        onClick={() => handleSortToggle('homeWinPct')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>% Casa/Fora</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 text-center">Perfil Disciplinar</th>
                      <th className="py-3 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {processedReferees.map((ref, idx) => {
                      const isHighCards = ref.avgTotalCards >= 5.0;
                      const isHighFouls = ref.avgFouls >= 26;
                      const isOverGoals = ref.avgGoals >= 2.8;

                      return (
                        <tr
                          key={ref.id}
                          className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                          onClick={() => {
                            setSelectedRefereeId(ref.id);
                            setActiveSubTab('detail');
                          }}
                        >
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={(e) => handleOpenPhotoModal(ref, e)}
                                className="relative group/avatar cursor-pointer shrink-0"
                                title="Clique para adicionar ou alterar a foto do árbitro"
                              >
                                {renderRefereeAvatar(ref.photoUrl, ref.name, 'md')}
                                <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-amber-400 transition-opacity">
                                  <Camera className="w-3.5 h-3.5" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-sm group-hover:text-blue-700 flex items-center gap-1.5 flex-wrap">
                                  <span>{ref.name}</span>
                                  {ref.redCardMatchPct >= 25 && (
                                    <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[10px] font-black rounded-sm" title="Expulsa frequentemente">
                                      EXPULSÕES
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                                  {ref.leagues.slice(0, 2).join(', ')}
                                  {ref.leagues.length > 2 ? ` (+${ref.leagues.length - 2})` : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-slate-900">{ref.finishedMatches}</span>
                            {ref.scheduledMatches > 0 && (
                              <span className="text-[10px] text-slate-400 block">
                                +{ref.scheduledMatches} agend.
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                              isHighCards ? 'bg-amber-100 text-amber-900 font-black' : 'text-slate-800'
                            }`}>
                              {ref.avgTotalCards.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {ref.totalCards} no total
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">
                            {ref.avgYellowCards.toFixed(2)}
                            <span className="text-[10px] text-slate-400 block font-normal">
                              {ref.avgYellowCardsHome.toFixed(1)}c / {ref.avgYellowCardsAway.toFixed(1)}f
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-red-600">
                            {ref.avgRedCards > 0 ? ref.avgRedCards.toFixed(2) : '-'}
                            {ref.redCardMatchPct > 0 && (
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {ref.redCardMatchPct.toFixed(0)}% jogos
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`font-bold ${isHighFouls ? 'text-amber-800 font-black' : 'text-slate-800'}`}>
                              {ref.avgFouls > 0 ? ref.avgFouls.toFixed(1) : '-'}
                            </span>
                            {ref.avgFouls > 0 && (
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {ref.avgFoulsHome.toFixed(0)}c / {ref.avgFoulsAway.toFixed(0)}f
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 font-mono text-[11px]" title="Média de faltas que comete antes de aplicar um cartão">
                            {ref.foulsPerCard > 0 ? `${ref.foulsPerCard.toFixed(1)} faltas` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-900">
                            <span className={isOverGoals ? 'text-emerald-700 font-black' : ''}>
                              {ref.avgGoals.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-normal">
                              {ref.avgHomeGoals.toFixed(1)}c / {ref.avgAwayGoals.toFixed(1)}f
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">
                            {ref.over25Pct.toFixed(0)}%
                            <span className="text-[10px] text-slate-400 block font-normal">
                              BTTS: {ref.bttsPct.toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                              <span className="text-blue-700">{ref.homeWinPct.toFixed(0)}% C</span>
                              <span className="text-slate-400">/</span>
                              <span className="text-purple-700">{ref.awayWinPct.toFixed(0)}% F</span>
                            </div>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mt-1 overflow-hidden flex">
                              <div style={{ width: `${ref.homeWinPct}%` }} className="bg-blue-500 h-full" />
                              <div style={{ width: `${ref.drawPct}%` }} className="bg-slate-300 h-full" />
                              <div style={{ width: `${ref.awayWinPct}%` }} className="bg-purple-500 h-full" />
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {getDisciplineBadge(ref.disciplineLevel)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRefereeId(ref.id);
                                setActiveSubTab('detail');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Ver Raio-X</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* GRID VIEW */}
          {processedReferees.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedReferees.map((ref) => (
                <div
                  key={ref.id}
                  onClick={() => {
                    setSelectedRefereeId(ref.id);
                    setActiveSubTab('detail');
                  }}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          onClick={(e) => handleOpenPhotoModal(ref, e)}
                          className="relative group/avatar cursor-pointer shrink-0"
                          title="Clique para adicionar ou alterar a foto do árbitro"
                        >
                          {renderRefereeAvatar(ref.photoUrl, ref.name, 'lg')}
                          <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-amber-400 transition-opacity">
                            <Camera className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-900 hover:text-blue-600 truncate">
                            {ref.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {ref.leagues.join(', ')}
                          </p>
                        </div>
                      </div>
                      {getDisciplineBadge(ref.disciplineLevel)}
                    </div>

                    {/* Stat Pills */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100 text-center">
                        <div className="text-[10px] font-black text-amber-900 uppercase">
                          Cartões/Jogo
                        </div>
                        <div className="text-lg font-black text-amber-700 mt-0.5">
                          {ref.avgTotalCards.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-amber-800">
                          {ref.totalYellowCards}A / {ref.totalRedCards}V
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-center">
                        <div className="text-[10px] font-black text-slate-700 uppercase">
                          Faltas/Jogo
                        </div>
                        <div className="text-lg font-black text-slate-900 mt-0.5">
                          {ref.avgFouls > 0 ? ref.avgFouls.toFixed(1) : '-'}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {ref.foulsPerCard > 0 ? `${ref.foulsPerCard.toFixed(0)} f/cartão` : '-'}
                        </div>
                      </div>

                      <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100 text-center">
                        <div className="text-[10px] font-black text-emerald-900 uppercase">
                          Média Gols
                        </div>
                        <div className="text-lg font-black text-emerald-700 mt-0.5">
                          {ref.avgGoals.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-emerald-800">
                          {ref.over25Pct.toFixed(0)}% Over 2.5
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      <strong className="text-slate-900 font-bold">{ref.finishedMatches}</strong> jogos apitados
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 font-bold">
                      <span>Dossiê Completo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB CONTENT: DOSSIÊ INDIVIDUAL DO ÁRBITRO */}
      {activeSubTab === 'detail' && activeReferee && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Referee Selection Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Selecionar Árbitro:</span>
              <select
                value={activeReferee.id}
                onChange={e => setSelectedRefereeId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {referees.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.finishedMatches} jogos - Média {r.avgTotalCards.toFixed(1)} cartões)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setActiveSubTab('ranking')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              ← Voltar ao Ranking Geral
            </button>
          </div>

          {/* Main Referee Dossier Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    onClick={(e) => handleOpenPhotoModal(activeReferee, e)}
                    className="relative group/dossier-photo cursor-pointer shrink-0"
                    title="Clique para adicionar ou alterar a foto deste árbitro"
                  >
                    {renderRefereeAvatar(activeReferee.photoUrl, activeReferee.name, 'xl')}
                    <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/dossier-photo:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-black transition-opacity border border-amber-400">
                      <Camera className="w-5 h-5 text-amber-400 mb-0.5" />
                      <span>{activeReferee.photoUrl ? 'Alterar Foto' : 'Inserir Foto'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-black tracking-tight text-white">
                        {activeReferee.name}
                      </h2>
                      {getDisciplineBadge(activeReferee.disciplineLevel)}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Atuando em: <strong className="text-white">{activeReferee.leagues.join(' • ')}</strong>
                      {activeReferee.countries.length > 0 && ` (${activeReferee.countries.join(', ')})`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={(e) => handleOpenPhotoModal(activeReferee, e)}
                    className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold border border-amber-400/40 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102"
                    title="Definir ou trocar a URL da foto do árbitro"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>{activeReferee.photoUrl ? 'Editar Foto do Árbitro' : 'Adicionar Foto'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCompareRef1Id(activeReferee.id);
                      setActiveSubTab('compare');
                    }}
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span>Comparar este Árbitro</span>
                  </button>
                </div>
              </div>

              {/* Detailed Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-700/60">
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total de Jogos</div>
                  <div className="text-2xl font-black text-white mt-0.5">{activeReferee.totalMatches}</div>
                  <div className="text-[10px] text-slate-300">{activeReferee.finishedMatches} encerrados</div>
                </div>

                <div className="bg-white/10 rounded-xl p-3 border border-amber-400/30">
                  <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <span className="w-2 h-2.5 bg-amber-400 rounded-xs inline-block" />
                    Média Cartões/J
                  </div>
                  <div className="text-2xl font-black text-amber-300 mt-0.5">
                    {activeReferee.avgTotalCards.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    Benchmark Geral: {globalAverages.avgYellowCards.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3 border border-red-500/30">
                  <div className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1">
                    <span className="w-2 h-2.5 bg-red-500 rounded-xs inline-block" />
                    Cartões Vermelhos
                  </div>
                  <div className="text-2xl font-black text-red-400 mt-0.5">
                    {activeReferee.totalRedCards}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {activeReferee.redCardMatchPct.toFixed(0)}% das partidas
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Faltas por Jogo</div>
                  <div className="text-2xl font-black text-white mt-0.5">
                    {activeReferee.avgFouls > 0 ? activeReferee.avgFouls.toFixed(1) : '-'}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {activeReferee.foulsPerCard > 0 ? `${activeReferee.foulsPerCard.toFixed(1)} faltas/cartão` : '-'}
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Média de Gols</div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    {activeReferee.avgGoals.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {activeReferee.over25Pct.toFixed(0)}% Over 2.5
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Aproveitamento Casa</div>
                  <div className="text-2xl font-black text-blue-400 mt-0.5">
                    {activeReferee.homeWinPct.toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {activeReferee.awayWinPct.toFixed(0)}% vitórias visitante
                  </div>
                </div>
              </div>
            </div>

            {/* Dossier Tactical Cards & Breakdown */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50">
              {/* Disciplina & Cartões Mandante vs Visitante */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-3.5 bg-amber-400 rounded-xs inline-block" />
                    Distribuição de Cartões
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    {activeReferee.totalYellowCards} Amarelos
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Mandante (Casa)</span>
                      <span className="text-blue-700">{activeReferee.avgYellowCardsHome.toFixed(2)} / jogo</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${(activeReferee.yellowCardsHome / (activeReferee.totalYellowCards || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Visitante (Fora)</span>
                      <span className="text-purple-700">{activeReferee.avgYellowCardsAway.toFixed(2)} / jogo</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{
                          width: `${(activeReferee.yellowCardsAway / (activeReferee.totalYellowCards || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Jogos com Cartão Vermelho:</span>
                      <strong className="text-red-600">{activeReferee.matchesWithRedCard} jogos ({activeReferee.redCardMatchPct.toFixed(0)}%)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Partidas com Over 4.5 Cartões:</span>
                      <strong className="text-slate-900">{activeReferee.cardsOver45Pct.toFixed(0)}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Partidas com Over 5.5 Cartões:</span>
                      <strong className="text-slate-900">{activeReferee.cardsOver55Pct.toFixed(0)}%</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faltas & Rigor da Arbitragem */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Faltas & Tolerância
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    {activeReferee.totalFouls} Faltas
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Faltas Mandante</span>
                      <span className="text-slate-900">{activeReferee.avgFoulsHome.toFixed(1)} / jogo</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{
                          width: `${(activeReferee.foulsHome / (activeReferee.totalFouls || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Faltas Visitante</span>
                      <span className="text-slate-900">{activeReferee.avgFoulsAway.toFixed(1)} / jogo</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-700 rounded-full"
                        style={{
                          width: `${(activeReferee.foulsAway / (activeReferee.totalFouls || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Tolerância (Faltas p/ Cartão):</span>
                      <strong className="text-indigo-900 font-black">
                        {activeReferee.foulsPerCard > 0 ? `${activeReferee.foulsPerCard.toFixed(1)} faltas` : 'N/D'}
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-500 italic">
                      {activeReferee.foulsPerCard < 5
                        ? 'Árbitro muito rigoroso: pune faltas táticas rapidamente com cartão.'
                        : activeReferee.foulsPerCard > 8
                        ? 'Árbitro tolerante: conversa bastante antes de aplicar advertências.'
                        : 'Média padrão de tolerância antes de punir com cartões.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tendência de Gols & Mercados */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-600" />
                    Gols & Tendências
                  </h4>
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    {activeReferee.avgGoals.toFixed(2)} gols/jogo
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="font-medium text-slate-600">Over 1.5 Gols:</span>
                    <strong className="text-slate-900">{activeReferee.over15Pct.toFixed(0)}% ({activeReferee.over15Count} jogos)</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="font-medium text-slate-600">Over 2.5 Gols:</span>
                    <strong className="text-emerald-700 font-bold">{activeReferee.over25Pct.toFixed(0)}% ({activeReferee.over25Count} jogos)</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="font-medium text-slate-600">Over 3.5 Gols:</span>
                    <strong className="text-slate-900">{activeReferee.over35Pct.toFixed(0)}% ({activeReferee.over35Count} jogos)</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="font-medium text-slate-600">Ambas Marcam (BTTS):</span>
                    <strong className="text-indigo-700 font-bold">{activeReferee.bttsPct.toFixed(0)}% ({activeReferee.bttsCount} jogos)</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-slate-600">
                    <span>Gols Mandante vs Visitante:</span>
                    <strong>{activeReferee.avgHomeGoals.toFixed(1)} x {activeReferee.avgAwayGoals.toFixed(1)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Match History Table */}
            <div className="p-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Histórico de Partidas Apitadas ({activeReferee.matches.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Jogos apitados por {activeReferee.name} cadastrados no banco de dados.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Liga</th>
                      <th className="py-2.5 px-4 text-right">Mandante</th>
                      <th className="py-2.5 px-3 text-center">Placar</th>
                      <th className="py-2.5 px-4">Visitante</th>
                      <th className="py-2.5 px-3 text-center">Cartões</th>
                      <th className="py-2.5 px-3 text-center">Faltas</th>
                      <th className="py-2.5 px-3 text-center">Odds</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {activeReferee.matches.map(m => {
                      const yh = m.stats?.yellowCardsHomeFT ?? 0;
                      const ya = m.stats?.yellowCardsAwayFT ?? 0;
                      const rh = m.stats?.redCardsHomeFT ?? 0;
                      const ra = m.stats?.redCardsAwayFT ?? 0;
                      const fh = m.stats?.foulsHomeFT ?? 0;
                      const fa = m.stats?.foulsAwayFT ?? 0;
                      const isFinished = m.status === 'FINALIZADO' || (m.homeScore !== null && m.awayScore !== null);

                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {formatIsoToDDMMYYYY(m.matchDate)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                            {m.leagueName}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                            {m.homeTeamName}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isFinished ? (
                              <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono font-bold text-xs">
                                {m.homeScore} - {m.awayScore}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                                AGENDADO
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {m.awayTeamName}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5 font-mono text-xs">
                              <span className="flex items-center gap-0.5 text-amber-700 font-bold">
                                <span className="w-2 h-2.5 bg-amber-400 rounded-2xs inline-block" />
                                {yh + ya}
                              </span>
                              {(rh + ra > 0) && (
                                <span className="flex items-center gap-0.5 text-red-600 font-bold">
                                  <span className="w-2 h-2.5 bg-red-500 rounded-2xs inline-block" />
                                  {rh + ra}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700 font-mono text-xs">
                            {fh + fa > 0 ? `${fh + fa} (${fh}x${fa})` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center text-[11px] text-slate-500 font-mono">
                            {m.odds?.homeFT ? `${m.odds.homeFT.toFixed(2)} / ${m.odds.awayFT?.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {onOpenMatchStats && (
                              <button
                                onClick={() => onOpenMatchStats(m)}
                                className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Detalhes
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: COMPARADOR LADO A LADO */}
      {activeSubTab === 'compare' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Selectors Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Árbitro 1 (Azul)
                </label>
                <select
                  value={ref1?.id || ''}
                  onChange={e => setCompareRef1Id(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {referees.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.finishedMatches} jogos)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Árbitro 2 (Dourado)
                </label>
                <select
                  value={ref2?.id || ''}
                  onChange={e => setCompareRef2Id(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {referees.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.finishedMatches} jogos)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Comparison Cards Side-by-Side */}
          {ref1 && ref2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ref 1 Card */}
              <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={(e) => handleOpenPhotoModal(ref1, e)}
                      className="relative group/ref1 cursor-pointer shrink-0"
                      title="Alterar foto do Árbitro 1"
                    >
                      {renderRefereeAvatar(ref1.photoUrl, ref1.name, 'lg')}
                      <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/ref1:opacity-100 flex items-center justify-center text-amber-400 transition-opacity">
                        <Camera className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full uppercase">
                        ÁRBITRO 1
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-1">{ref1.name}</h3>
                      <p className="text-xs text-slate-500">{ref1.leagues.join(', ')}</p>
                    </div>
                  </div>
                  {getDisciplineBadge(ref1.disciplineLevel)}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">Jogos Avaliados</span>
                    <strong className="text-sm text-slate-900">{ref1.finishedMatches}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 bg-amber-50/50 px-2 rounded-lg">
                    <span className="text-xs font-bold text-amber-900">Média Cartões Totais</span>
                    <strong className="text-sm text-amber-700">{ref1.avgTotalCards.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">Média Amarelos</span>
                    <strong className="text-sm text-slate-900">{ref1.avgYellowCards.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">Taxa Jogos c/ Expulsão</span>
                    <strong className="text-sm text-red-600">{ref1.redCardMatchPct.toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">Média de Faltas</span>
                    <strong className="text-sm text-slate-900">{ref1.avgFouls.toFixed(1)}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">Média de Gols</span>
                    <strong className="text-sm text-emerald-700">{ref1.avgGoals.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">% Over 2.5 Gols</span>
                    <strong className="text-sm text-slate-900">{ref1.over25Pct.toFixed(0)}%</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-xs font-semibold text-slate-600">Vitórias Mandante</span>
                    <strong className="text-sm text-blue-700">{ref1.homeWinPct.toFixed(0)}%</strong>
                  </div>
                </div>
              </div>

              {/* Ref 2 Card */}
              <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={(e) => handleOpenPhotoModal(ref2, e)}
                      className="relative group/ref2 cursor-pointer shrink-0"
                      title="Alterar foto do Árbitro 2"
                    >
                      {renderRefereeAvatar(ref2.photoUrl, ref2.name, 'lg')}
                      <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/ref2:opacity-100 flex items-center justify-center text-amber-400 transition-opacity">
                        <Camera className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full uppercase">
                        ÁRBITRO 2
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-1">{ref2.name}</h3>
                      <p className="text-xs text-slate-500">{ref2.leagues.join(', ')}</p>
                    </div>
                  </div>
                  {getDisciplineBadge(ref2.disciplineLevel)}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">Jogos Avaliados</span>
                    <strong className="text-sm text-slate-900">{ref2.finishedMatches}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 bg-amber-50/50 px-2 rounded-lg">
                    <span className="text-xs font-bold text-amber-900">Média Cartões Totais</span>
                    <strong className="text-sm text-amber-700">{ref2.avgTotalCards.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">Média Amarelos</span>
                    <strong className="text-sm text-slate-900">{ref2.avgYellowCards.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">Taxa Jogos c/ Expulsão</span>
                    <strong className="text-sm text-red-600">{ref2.redCardMatchPct.toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">Média de Faltas</span>
                    <strong className="text-sm text-slate-900">{ref2.avgFouls.toFixed(1)}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">Média de Gols</span>
                    <strong className="text-sm text-emerald-700">{ref2.avgGoals.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">% Over 2.5 Gols</span>
                    <strong className="text-sm text-slate-900">{ref2.over25Pct.toFixed(0)}%</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-xs font-semibold text-slate-600">Vitórias Mandante</span>
                    <strong className="text-sm text-blue-700">{ref2.homeWinPct.toFixed(0)}%</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB CONTENT: PRÓXIMAS ESCALAÇÕES (JOGOS AGENDADOS COM ÁRBITRO) */}
      {activeSubTab === 'upcoming' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Próximas Partidas com Arbitragem Definida
              </h3>
              <p className="text-xs text-slate-500">
                Cruzamento imediato das estatísticas do árbitro escalado para gerar insights pré-jogo.
              </p>
            </div>
          </div>

          {upcomingRefereeAssignments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800">Nenhum jogo futuro cadastrado com árbitro</h4>
              <p className="text-xs text-slate-500">
                Ao cadastrar partidas futuras, preencha o campo de árbitro para visualizar as projeções automáticas aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingRefereeAssignments.map(({ match, refereeStats }) => (
                <div
                  key={match.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-blue-700">{match.leagueName}</span>
                    <span className="text-xs font-mono text-slate-500">
                      {formatIsoToDDMMYYYY(match.matchDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-right flex-1 font-bold text-slate-900 text-sm">
                      {match.homeTeamName}
                    </div>
                    <div className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-700 mx-3">
                      VS
                    </div>
                    <div className="text-left flex-1 font-bold text-slate-900 text-sm">
                      {match.awayTeamName}
                    </div>
                  </div>

                  {/* Referee Card Attachment */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {renderRefereeAvatar(match.refereePhotoUrl || refereeStats?.photoUrl, match.referee, 'sm')}
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {match.referee || 'Árbitro não informado'}
                          </div>
                          {refereeStats && (
                            <div className="text-[10px] text-slate-500">
                              {refereeStats.finishedMatches} jogos na base
                            </div>
                          )}
                        </div>
                      </div>

                      {refereeStats && getDisciplineBadge(refereeStats.disciplineLevel)}
                    </div>

                    {refereeStats && (
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-200/60 text-center text-xs">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">Cartões/J</div>
                          <div className="font-bold text-amber-700">{refereeStats.avgTotalCards.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">Faltas/J</div>
                          <div className="font-bold text-slate-800">{refereeStats.avgFouls > 0 ? refereeStats.avgFouls.toFixed(1) : '-'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">Over 2.5</div>
                          <div className="font-bold text-emerald-700">{refereeStats.over25Pct.toFixed(0)}%</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {refereeStats && (
                      <button
                        onClick={() => {
                          setSelectedRefereeId(refereeStats.id);
                          setActiveSubTab('detail');
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Ver Dossiê do Árbitro →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photo Edit Modal */}
      {isPhotoModalOpen && photoModalReferee && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Foto do Árbitro</h3>
              </div>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Insira a URL direta da imagem (PNG, JPG, WebP) para <strong>{photoModalReferee.name}</strong>.
            </p>

            {/* Live Preview */}
            <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-white/10">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                {photoInputUrl.trim() ? (
                  <img
                    src={photoInputUrl.trim()}
                    alt={photoModalReferee.name}
                    referrerPolicy="no-referrer"
                    onError={() => setPhotoTestError(true)}
                    onLoad={() => setPhotoTestError(false)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Scale className="w-8 h-8 text-amber-400" />
                )}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-black text-white">{photoModalReferee.name}</div>
                <div className="text-[11px] text-slate-400">{photoModalReferee.leagues.join(', ')}</div>
                {photoTestError && (
                  <div className="text-[11px] text-red-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>URL inválida ou imagem inacessível</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">URL da Imagem</label>
              <input
                type="url"
                value={photoInputUrl}
                onChange={(e) => {
                  setPhotoInputUrl(e.target.value);
                  setPhotoTestError(false);
                }}
                placeholder="https://exemplo.com/fotos/juiz.png"
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Google Search Helper with Wikipedia priority */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
              <a
                href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`arbitro "${photoModalReferee.name}" futebol foto wikipedia`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px] transition-colors"
                title="Busca fotos no Google Imagens priorizando Wikipédia e Wikimedia Commons"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buscar foto no Google (Wikipédia)</span>
              </a>

              <a
                href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`(site:wikipedia.org OR site:wikimedia.org) arbitro "${photoModalReferee.name}" futebol`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-slate-200 text-[10px] font-medium underline transition-colors"
                title="Busca fotos exclusivamente dentro da Wikipédia e Wikimedia Commons"
              >
                Só na Wikipédia
              </a>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              {photoModalReferee.photoUrl ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (onUpdateRefereePhoto) {
                      await onUpdateRefereePhoto(photoModalReferee.name, '');
                    }
                    setIsPhotoModalOpen(false);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-bold cursor-pointer"
                >
                  Remover Foto
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePhotoModal}
                  disabled={isSavingPhoto}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isSavingPhoto ? 'Salvando...' : 'Salvar Foto'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

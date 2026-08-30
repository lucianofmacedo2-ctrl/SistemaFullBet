import React, { useState, useMemo } from 'react';
import {
  X,
  Flame,
  Calendar,
  Filter,
  TrendingUp,
  SlidersHorizontal,
  Info,
  ExternalLink,
  Target,
  Trophy,
  ShieldAlert,
  BarChart3,
  CheckCircle2,
  XCircle,
  Award,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Clock,
  History
} from 'lucide-react';
import { DbState, Match, RadarCategory } from '../types';
import { extractYMD, formatDateToYMD } from './DailyMatchesView';
import { isValidImageUrl } from '../utils/imageHelper';
import {
  RadarMatchProjection,
  RADAR_CATEGORIES_CONFIG,
  calculateSingleRadarProjection,
  runRadarBacktest,
  RadarBacktestReport,
  RadarBacktestEntry
} from '../utils/radarEngine';

export interface RadarScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onSelectMatchForAnalysis?: (matchId: string) => void;
  initialCategory?: RadarCategory;
}

export const RadarScannerModal: React.FC<RadarScannerModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onSelectMatchForAnalysis,
  initialCategory = 'BTTS_FT',
}) => {
  // Navigation Mode: 'SCANNER' (Projeções do Dia) or 'BACKTEST' (Desempenho & Histórico Real)
  const [activeModalTab, setActiveModalTab] = useState<'SCANNER' | 'BACKTEST'>('SCANNER');

  // Scanner Filters
  const [selectedCategory, setSelectedCategory] = useState<RadarCategory>(initialCategory);
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateToYMD(new Date()));
  const [minConfidence, setMinConfidence] = useState<number>(35);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'PROB' | 'CONFIDENCE' | 'TIME' | 'EV'>('PROB');

  // Backtest Filters
  const [backtestLeagueId, setBacktestLeagueId] = useState<string>('ALL');
  const [backtestMinConfidence, setBacktestMinConfidence] = useState<number>(35);
  const [backtestCategory, setBacktestCategory] = useState<RadarCategory | 'ALL'>('ALL');
  const [backtestTier, setBacktestTier] = useState<string>('ALL');
  const [backtestOutcomeFilter, setBacktestOutcomeFilter] = useState<'ALL' | 'GREEN' | 'RED'>('ALL');

  // Available match dates in DB
  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();
    for (const m of dbState.matches || []) {
      const ymd = extractYMD(m.matchDate);
      if (ymd) datesSet.add(ymd);
    }
    return Array.from(datesSet).sort();
  }, [dbState.matches]);

  // Daily Radar Projections
  const projections = useMemo(() => {
    if (!isOpen || activeModalTab !== 'SCANNER') return [];

    const matchesOnDate = (dbState.matches || []).filter(m => {
      const ymd = extractYMD(m.matchDate);
      if (ymd !== selectedDate) return false;
      if (selectedLeagueId !== 'ALL' && m.leagueId !== selectedLeagueId) return false;
      return true;
    });

    const results: RadarMatchProjection[] = [];

    for (const match of matchesOnDate) {
      const proj = calculateSingleRadarProjection(
        match,
        dbState.matches || [],
        dbState.teams || [],
        selectedCategory
      );
      if (proj && proj.confidenceScore >= minConfidence) {
        results.push(proj);
      }
    }

    return results.sort((a, b) => {
      if (sortBy === 'PROB') return b.poissonModelProb - a.poissonModelProb;
      if (sortBy === 'CONFIDENCE') return b.confidenceScore - a.confidenceScore;
      if (sortBy === 'EV') return (b.evPercent || -999) - (a.evPercent || -999);
      return a.timeFormatted.localeCompare(b.timeFormatted);
    });
  }, [
    isOpen,
    activeModalTab,
    dbState.matches,
    dbState.teams,
    selectedDate,
    selectedLeagueId,
    selectedCategory,
    minConfidence,
    sortBy,
  ]);

  // Backtest Report calculation
  const backtestReport: RadarBacktestReport = useMemo(() => {
    if (!isOpen) {
      return {
        totalMatchesAnalyzed: 0,
        totalSuggestionsGenerated: 0,
        overallWins: 0,
        overallLosses: 0,
        overallWinRatePct: 0,
        overallProfitUnits: 0,
        overallRoiPct: 0,
        avgOddOverall: 0,
        markets: [],
        entries: [],
        mostProfitableMarket: null,
        highestWinRateMarket: null,
      };
    }

    return runRadarBacktest(dbState.matches || [], dbState.teams || [], {
      leagueId: backtestLeagueId,
      minConfidence: backtestMinConfidence,
      targetCategory: backtestCategory,
      targetTier: backtestTier,
    });
  }, [
    isOpen,
    dbState.matches,
    dbState.teams,
    backtestLeagueId,
    backtestMinConfidence,
    backtestCategory,
    backtestTier,
  ]);

  // Filtered Backtest entries for table display
  const displayedBacktestEntries = useMemo(() => {
    if (backtestOutcomeFilter === 'ALL') return backtestReport.entries;
    return backtestReport.entries.filter(e => e.outcome === backtestOutcomeFilter);
  }, [backtestReport.entries, backtestOutcomeFilter]);

  if (!isOpen) return null;

  const currentCategoryInfo =
    RADAR_CATEGORIES_CONFIG.find(c => c.id === selectedCategory) ||
    RADAR_CATEGORIES_CONFIG[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        id="radar-scanner-modal"
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 bg-gradient-to-r ${
            activeModalTab === 'SCANNER'
              ? currentCategoryInfo.color
              : 'from-slate-900 via-indigo-950 to-slate-900'
          } text-white flex items-center justify-between shadow-md`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs border border-white/20">
              {activeModalTab === 'SCANNER' ? (
                <Flame className="w-6 h-6 text-amber-300 fill-amber-300" />
              ) : (
                <History className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                  CENTRAL DE RADARES INTELIGENTES
                </span>
                {activeModalTab === 'SCANNER' ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                    {currentCategoryInfo.badge}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase">
                    BACKTEST & PERFORMANCE
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                {activeModalTab === 'SCANNER'
                  ? `Radar: ${currentCategoryInfo.title}`
                  : 'Backtest de Resultados & Lucratividade por Mercado'}
              </h2>
              <p className="text-xs text-white/80 font-medium hidden sm:block">
                {activeModalTab === 'SCANNER'
                  ? currentCategoryInfo.description
                  : 'Desempenho histórico real de cada modelo matemático quando os resultados dos jogos são atualizados.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRIMARY VIEW MODE SELECTOR (RADARES DO DIA vs BACKTEST) */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveModalTab('SCANNER')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeModalTab === 'SCANNER'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 scale-[1.02]'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Radares do Dia (Previsões)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab('BACKTEST')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeModalTab === 'BACKTEST'
                  ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/20 scale-[1.02]'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Backtest & Lucratividade Real</span>
              {backtestReport.totalSuggestionsGenerated > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-900 text-emerald-300">
                  {backtestReport.totalSuggestionsGenerated}
                </span>
              )}
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-semibold hidden md:inline">
            {activeModalTab === 'SCANNER'
              ? '5 Modelos com Poisson Bivariado'
              : `Base de ${backtestReport.totalMatchesAnalyzed} jogos finalizados`}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: DAILY SCANNER PROJECTIONS                                         */}
        {/* ========================================================================= */}
        {activeModalTab === 'SCANNER' && (
          <>
            {/* RADAR SELECTOR TABS */}
            <div className="bg-slate-900 p-2.5 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto">
              {RADAR_CATEGORIES_CONFIG.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
                    }`}
                  >
                    <Flame
                      className={`w-3.5 h-3.5 ${
                        isSelected
                          ? 'text-slate-950 fill-slate-950'
                          : 'text-amber-400'
                      }`}
                    />
                    <span>{cat.shortLabel}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected
                          ? 'bg-slate-950 text-amber-300'
                          : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      {cat.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter Controls Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Date Selector */}
              <div>
                <label className="block text-slate-500 font-bold mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Data dos Jogos
                </label>
                <select
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {availableDates.length > 0 ? (
                    availableDates.map(d => (
                      <option key={d} value={d}>
                        {d === formatDateToYMD(new Date()) ? `Hoje (${d})` : d}
                      </option>
                    ))
                  ) : (
                    <option value={selectedDate}>{selectedDate}</option>
                  )}
                </select>
              </div>

              {/* League Filter */}
              <div>
                <label className="block text-slate-500 font-bold mb-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  Campeonato / Liga
                </label>
                <select
                  value={selectedLeagueId}
                  onChange={e => setSelectedLeagueId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="ALL">Todas as Ligas</option>
                  {(dbState.leagues || []).map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.countryName || 'Geral'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Confidence Score */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-500 font-bold flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                    Confiança Mínima:
                  </label>
                  <span className="font-mono font-black text-slate-900">
                    {minConfidence}%
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={80}
                  step={5}
                  value={minConfidence}
                  onChange={e => setMinConfidence(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-slate-500 font-bold mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="PROB">Maior Probabilidade Poisson</option>
                  <option value="CONFIDENCE">Maior Score de Confiança</option>
                  <option value="EV">Maior +EV Estimado</option>
                  <option value="TIME">Horário do Jogo (Brasília)</option>
                </select>
              </div>
            </div>

            {/* Content Body / Projections List */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Oportunidades Encontradas no Radar:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800">
                    {projections.length} jogos filtrados
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Horário Oficial de Brasília (UTC-3)
                </span>
              </div>

              {projections.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="text-base font-bold text-slate-700">
                    Nenhum confronto atende aos critérios do Radar para esta data
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Tente diminuir a barra de Confiança Mínima ou alterar a data selecionada.
                    Certifique-se de que os confrontos possuem partidas finalizadas anteriores para cálculo estatístico.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projections.map((proj, idx) => {
                    const { match } = proj;

                    return (
                      <div
                        key={match.id || idx}
                        className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs hover:shadow-md transition-all hover:border-indigo-200 flex flex-col justify-between"
                      >
                        {/* Top Row: League, Time & Tier Badge */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            {isValidImageUrl(match.leagueLogoUrl) ? (
                              <img
                                src={match.leagueLogoUrl}
                                alt=""
                                className="w-4 h-4 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            ) : null}
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[170px]">
                              {match.leagueName || 'Liga'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              • {proj.timeFormatted}h
                            </span>
                          </div>

                          {/* Tier Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              proj.ratingTier === 'DIAMOND'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : proj.ratingTier === 'GOLD'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : proj.ratingTier === 'SILVER'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            ★ {proj.ratingTier}
                          </span>
                        </div>

                        {/* Teams Matchup */}
                        <div className="space-y-2">
                          {/* Home */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isValidImageUrl(match.homeTeamLogoUrl) ? (
                                <img
                                  src={match.homeTeamLogoUrl}
                                  alt=""
                                  className="w-6 h-6 object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                                  M
                                </div>
                              )}
                              <span className="font-black text-sm text-slate-900 truncate max-w-[190px]">
                                {match.homeTeamName}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-blue-600 font-mono">
                              E5: {proj.homeE5Pct}%
                            </span>
                          </div>

                          {/* Away */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isValidImageUrl(match.awayTeamLogoUrl) ? (
                                <img
                                  src={match.awayTeamLogoUrl}
                                  alt=""
                                  className="w-6 h-6 object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center">
                                  V
                                </div>
                              )}
                              <span className="font-black text-sm text-slate-900 truncate max-w-[190px]">
                                {match.awayTeamName}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-amber-600 font-mono">
                              E5: {proj.awayE5Pct}%
                            </span>
                          </div>
                        </div>

                        {/* Stats Metrics Matrix */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block font-semibold">
                              Prob. Poisson
                            </span>
                            <span className="text-sm font-black text-indigo-700 font-mono">
                              {proj.poissonModelProb}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block font-semibold">
                              Score Confiança
                            </span>
                            <span className="text-sm font-black text-slate-900 font-mono">
                              {proj.confidenceScore}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block font-semibold">
                              Odd Justa
                            </span>
                            <span className="text-sm font-black text-emerald-700 font-mono">
                              @{proj.marketOddJusta.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Highlights */}
                        {proj.highlights.length > 0 && (
                          <div className="space-y-1">
                            {proj.highlights.map((h, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{h}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          {proj.marketOddBookie && (
                            <div className="text-[11px] font-bold text-slate-600">
                              Odd Casa:{' '}
                              <span className="text-slate-900 font-mono">
                                @{proj.marketOddBookie.toFixed(2)}
                              </span>
                              {proj.evPercent && (
                                <span
                                  className={`ml-1 font-black ${
                                    proj.evPercent > 0
                                      ? 'text-emerald-600'
                                      : 'text-rose-600'
                                  }`}
                                >
                                  (
                                  {proj.evPercent > 0
                                    ? `+${proj.evPercent}% EV`
                                    : `${proj.evPercent}% EV`}
                                  )
                                </span>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectMatchForAnalysis && match.id) {
                                onSelectMatchForAnalysis(match.id);
                                onClose();
                              }
                            }}
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer hover:scale-105"
                          >
                            <span>Abrir Análise</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: BACKTEST & REAL PERFORMANCE DASHBOARD                            */}
        {/* ========================================================================= */}
        {activeModalTab === 'BACKTEST' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
            {/* Top Summary Cards (Lucratividade, Ranking e Assertividade) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. Mercado Mais Lucrativo */}
              <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-4 rounded-2xl border border-emerald-500/30 shadow-md relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    #1 Mercado Mais Lucrativo
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                    {backtestReport.mostProfitableMarket ? `${backtestReport.mostProfitableMarket.roiPct}% ROI` : 'N/D'}
                  </span>
                </div>
                <div className="my-2">
                  <h3 className="text-base font-black text-white">
                    {backtestReport.mostProfitableMarket?.title || 'Aguardando Resultados'}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {backtestReport.mostProfitableMarket
                        ? `${backtestReport.mostProfitableMarket.totalProfitUnits >= 0 ? '+' : ''}${backtestReport.mostProfitableMarket.totalProfitUnits.toFixed(2)}u`
                        : '0.00u'}
                    </span>
                    <span className="text-xs text-slate-300">
                      em {backtestReport.mostProfitableMarket?.totalBets || 0} apostas
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-200/70">
                  Taxa de Acerto:{' '}
                  <strong>{backtestReport.mostProfitableMarket?.winRatePct || 0}%</strong> • Odd Média: @
                  {backtestReport.mostProfitableMarket?.avgOdd.toFixed(2) || '0.00'}
                </span>
              </div>

              {/* 2. Maior Taxa de Acerto */}
              <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-4 rounded-2xl border border-blue-500/30 shadow-md relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-blue-400" />
                    Maior Assertividade
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
                    {backtestReport.highestWinRateMarket ? `${backtestReport.highestWinRateMarket.winRatePct}%` : 'N/D'}
                  </span>
                </div>
                <div className="my-2">
                  <h3 className="text-base font-black text-white">
                    {backtestReport.highestWinRateMarket?.shortLabel || 'N/D'}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black font-mono text-blue-400">
                      {backtestReport.highestWinRateMarket?.winRatePct || 0}%
                    </span>
                    <span className="text-xs text-slate-300">
                      ({backtestReport.highestWinRateMarket?.totalWins || 0}G / {backtestReport.highestWinRateMarket?.totalLosses || 0}R)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-blue-200/70">
                  Lucro Líquido:{' '}
                  <strong>
                    {backtestReport.highestWinRateMarket
                      ? `${backtestReport.highestWinRateMarket.totalProfitUnits >= 0 ? '+' : ''}${backtestReport.highestWinRateMarket.totalProfitUnits.toFixed(2)}u`
                      : '0u'}
                  </strong>
                </span>
              </div>

              {/* 3. Lucro Líquido Combinado */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    Lucro Total Combinado
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                      backtestReport.overallProfitUnits >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {backtestReport.overallRoiPct >= 0 ? `+${backtestReport.overallRoiPct}%` : `${backtestReport.overallRoiPct}%`} ROI
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black font-mono text-slate-900">
                    {backtestReport.overallProfitUnits >= 0 ? `+${backtestReport.overallProfitUnits.toFixed(2)}u` : `${backtestReport.overallProfitUnits.toFixed(2)}u`}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {backtestReport.totalSuggestionsGenerated} entradas simuladas (1u stake)
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">
                  {backtestReport.overallWins} Vitórias • {backtestReport.overallLosses} Derrotas
                </span>
              </div>

              {/* 4. Taxa de Acerto Global */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Assertividade Global
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                    Odd Média @{backtestReport.avgOddOverall.toFixed(2)}
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black font-mono text-indigo-600">
                    {backtestReport.overallWinRatePct}%
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Média de acerto entre todos os modelos
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">
                  Jogos Analisados no DB: {backtestReport.totalMatchesAnalyzed}
                </span>
              </div>
            </div>

            {/* Backtest Filter Controls Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Category Filter */}
              <div>
                <label className="block text-slate-500 font-bold mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  Mercado / Radar
                </label>
                <select
                  value={backtestCategory}
                  onChange={e => setBacktestCategory(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="ALL">Todos os 5 Mercados</option>
                  {RADAR_CATEGORIES_CONFIG.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.shortLabel}
                    </option>
                  ))}
                </select>
              </div>

              {/* League Filter */}
              <div>
                <label className="block text-slate-500 font-bold mb-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  Campeonato / Liga
                </label>
                <select
                  value={backtestLeagueId}
                  onChange={e => setBacktestLeagueId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="ALL">Todas as Ligas</option>
                  {(dbState.leagues || []).map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tier Filter */}
              <div>
                <label className="block text-slate-500 font-bold mb-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-purple-600" />
                  Classificação / Tier
                </label>
                <select
                  value={backtestTier}
                  onChange={e => setBacktestTier(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="ALL">Todos os Tiers</option>
                  <option value="DIAMOND">★ Diamond</option>
                  <option value="GOLD">★ Gold</option>
                  <option value="SILVER">★ Silver</option>
                  <option value="BRONZE">★ Bronze</option>
                </select>
              </div>

              {/* Outcome Filter */}
              <div>
                <label className="block text-slate-500 font-bold mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Resultado
                </label>
                <select
                  value={backtestOutcomeFilter}
                  onChange={e => setBacktestOutcomeFilter(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="ALL">Todos (Greens e Reds)</option>
                  <option value="GREEN">Apenas Greens (Vitórias)</option>
                  <option value="RED">Apenas Reds (Derrotas)</option>
                </select>
              </div>

              {/* Min Confidence Score */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-500 font-bold flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    Confiança Mín:
                  </label>
                  <span className="font-mono font-black text-slate-900">
                    {backtestMinConfidence}%
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={80}
                  step={5}
                  value={backtestMinConfidence}
                  onChange={e => setBacktestMinConfidence(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* COMPARATIVE CARDS FOR THE 5 MARKETS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Comparativo de Lucratividade por Mercado
                </h3>
                <span className="text-xs text-slate-500">
                  Ordenado por ROI % e Lucro em Unidades
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[...backtestReport.markets]
                  .sort((a, b) => b.totalProfitUnits - a.totalProfitUnits)
                  .map(market => {
                    const isPositive = market.totalProfitUnits >= 0;

                    return (
                      <div
                        key={market.category}
                        className={`bg-white rounded-2xl border ${
                          isPositive ? 'border-emerald-200 hover:border-emerald-400' : 'border-slate-200'
                        } p-4 space-y-3 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-950 text-amber-300 font-mono font-black text-[10px]">
                              {market.badge}
                            </span>
                            <span className="text-xs font-black text-slate-900 truncate max-w-[160px]">
                              {market.shortLabel}
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                              market.roiPct >= 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {market.roiPct >= 0 ? `+${market.roiPct}%` : `${market.roiPct}%`} ROI
                          </span>
                        </div>

                        {/* Numbers */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center">
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold block">Lucro Líquido</span>
                            <span
                              className={`text-sm font-black font-mono ${
                                isPositive ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {market.totalProfitUnits >= 0
                                ? `+${market.totalProfitUnits.toFixed(2)}u`
                                : `${market.totalProfitUnits.toFixed(2)}u`}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold block">Acerto</span>
                            <span className="text-sm font-black font-mono text-indigo-700">
                              {market.winRatePct}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold block">Entradas</span>
                            <span className="text-sm font-black font-mono text-slate-900">
                              {market.totalBets}
                            </span>
                          </div>
                        </div>

                        {/* Win / Loss counts and Avg Odd */}
                        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                          <span className="flex items-center gap-1">
                            <span className="text-emerald-600 font-bold">{market.totalWins} Greens</span>
                            <span>•</span>
                            <span className="text-rose-600 font-bold">{market.totalLosses} Reds</span>
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            Odd Média @{market.avgOdd.toFixed(2)}
                          </span>
                        </div>

                        {/* Tier breakdown pills */}
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-1 flex-wrap text-[10px]">
                          {market.tierBreakdown.map(tb => (
                            <span
                              key={tb.tier}
                              className={`px-1.5 py-0.5 rounded font-mono ${
                                tb.bets > 0
                                  ? tb.profitUnits >= 0
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-slate-50 text-slate-400'
                              }`}
                              title={`${tb.tier}: ${tb.wins}/${tb.bets} (${tb.winRatePct}%) Lucro: ${tb.profitUnits}u`}
                            >
                              {tb.tier[0]}: {tb.winRatePct}% ({tb.bets})
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* DETAILED BACKTEST LOG TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600" />
                    Histórico Detalhado de Partidas Testadas
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-800 font-mono">
                    {displayedBacktestEntries.length} registros
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Stake plana: 1.0 unidade por sugestão
                </span>
              </div>

              {displayedBacktestEntries.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-600 font-bold">
                    Nenhuma partida finalizada corresponde aos filtros atuais do Backtest.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Insira ou sincronize os resultados dos jogos finalizados (Placar FT e Placar HT) para calcular o histórico.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3">Liga</th>
                        <th className="py-2.5 px-3">Confronto</th>
                        <th className="py-2.5 px-3 text-center">Placar FT (HT)</th>
                        <th className="py-2.5 px-3">Mercado Sugerido</th>
                        <th className="py-2.5 px-3 text-center">Confiança</th>
                        <th className="py-2.5 px-3 text-center">Tier</th>
                        <th className="py-2.5 px-3 text-center">Odd</th>
                        <th className="py-2.5 px-3 text-center">Resultado</th>
                        <th className="py-2.5 px-3 text-right">Retorno</th>
                        <th className="py-2.5 px-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedBacktestEntries.map((entry, idx) => {
                        const isGreen = entry.outcome === 'GREEN';

                        return (
                          <tr key={`${entry.matchId}-${entry.category}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                            {/* Data */}
                            <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                              {entry.matchDate}
                            </td>

                            {/* Liga */}
                            <td className="py-2.5 px-3 text-slate-700 font-semibold truncate max-w-[120px]">
                              {entry.leagueName}
                            </td>

                            {/* Confronto */}
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">
                                {entry.homeTeamName} <span className="text-slate-400 font-normal">vs</span> {entry.awayTeamName}
                              </div>
                            </td>

                            {/* Placar */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                {entry.homeScore} x {entry.awayScore}
                              </span>
                              {entry.homeScoreHT !== undefined && entry.awayScoreHT !== undefined && (
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  ({entry.homeScoreHT}x{entry.awayScoreHT} HT)
                                </span>
                              )}
                            </td>

                            {/* Mercado */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-bold text-slate-800">
                                {entry.categoryLabel}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                                {entry.conditionDescription}
                              </span>
                            </td>

                            {/* Confiança */}
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                              {entry.confidenceScore}%
                            </td>

                            {/* Tier */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                  entry.ratingTier === 'DIAMOND'
                                    ? 'bg-purple-100 text-purple-800'
                                    : entry.ratingTier === 'GOLD'
                                    ? 'bg-amber-100 text-amber-900'
                                    : entry.ratingTier === 'SILVER'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {entry.ratingTier}
                              </span>
                            </td>

                            {/* Odd */}
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                              @{entry.odd.toFixed(2)}
                            </td>

                            {/* Resultado */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                                  isGreen
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {isGreen ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    GREEN
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    RED
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Retorno */}
                            <td
                              className={`py-2.5 px-3 text-right font-mono font-black whitespace-nowrap ${
                                isGreen ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {entry.profitUnits >= 0
                                ? `+${entry.profitUnits.toFixed(2)}u`
                                : `${entry.profitUnits.toFixed(2)}u`}
                            </td>

                            {/* Ação */}
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectMatchForAnalysis && entry.match.id) {
                                    onSelectMatchForAnalysis(entry.match.id);
                                    onClose();
                                  }
                                }}
                                className="p-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors"
                                title="Abrir Análise da Partida"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold flex items-center gap-1">
            <Info className="w-4 h-4 text-slate-400" />
            {activeModalTab === 'SCANNER'
              ? 'Radares calculados com base em Poisson Bivariado, G5, E5 e Ponderação de Força.'
              : 'O Backtest utiliza estritamente o histórico anterior a cada jogo com stake fixa de 1 unidade.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

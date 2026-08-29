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
  Sparkles
} from 'lucide-react';
import { DbState, Match } from '../types';
import { extractYMD, formatDateToYMD } from './DailyMatchesView';
import { extractTeamMatches } from '../utils/analysisEngine';
import { formatMatchTimeBRT } from '../utils/dateTimeUtils';

interface HtGoalsScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onSelectMatchForAnalysis?: (matchId: string) => void;
}

export interface HtMatchProjection {
  match: Match;
  dateFormatted: string;
  timeFormatted: string;
  homeG5Over15HtPct: number;
  homeE5Over15HtPct: number;
  awayG5Over15HtPct: number;
  awayE5Over15HtPct: number;
  avgCombinedOver15HtPct: number;
  homeHtGoalsAvg: number;
  awayHtGoalsAvg: number;
  projectedHtGoals: number;
  poissonOver15HtProb: number;
  confidenceScore: number;
  marketOddJusta: number;
  marketOddBookie?: number;
  evPercent?: number;
  ratingTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE';
  highlights: string[];
}

function calculatePoissonProbability(k: number, lambda: number): number {
  if (lambda <= 0) return 0;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export const HtGoalsScannerModal: React.FC<HtGoalsScannerModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onSelectMatchForAnalysis,
}) => {
  const todayStr = useMemo(() => formatDateToYMD(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return formatDateToYMD(new Date());
  });

  const [minConfidence, setMinConfidence] = useState<number>(40);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'PROB' | 'CONFIDENCE' | 'TIME' | 'EV'>('PROB');

  // List of distinct future match dates available in the database
  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();
    for (const m of dbState.matches || []) {
      const ymd = extractYMD(m.matchDate);
      if (ymd) {
        datesSet.add(ymd);
      }
    }
    const arr = Array.from(datesSet).sort();
    return arr;
  }, [dbState.matches]);

  // Fast maps
  const leaguesMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const l of dbState.leagues || []) {
      map.set(l.id, l);
      if (l.name) map.set(l.name.toLowerCase(), l);
    }
    return map;
  }, [dbState.leagues]);

  const teamsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const t of dbState.teams || []) {
      map.set(t.id, t);
      if (t.name) map.set(t.name.toLowerCase(), t);
    }
    return map;
  }, [dbState.teams]);

  // Scanner calculation engine for Over 1.5 HT
  const projections = useMemo(() => {
    if (!isOpen) return [];

    const matchesOnDate = (dbState.matches || []).filter(m => {
      const ymd = extractYMD(m.matchDate);
      if (ymd !== selectedDate) return false;
      if (selectedLeagueId !== 'ALL' && m.leagueId !== selectedLeagueId) return false;
      return true;
    });

    const results: HtMatchProjection[] = [];

    for (const match of matchesOnDate) {
      const homeTeamId = match.homeTeamId || match.homeTeamName;
      const awayTeamId = match.awayTeamId || match.awayTeamName;

      // Extract past sample matches before this match
      const homeTeamHistory = extractTeamMatches(homeTeamId, dbState.matches || [], { teams: dbState.teams });
      const awayTeamHistory = extractTeamMatches(awayTeamId, dbState.matches || [], { teams: dbState.teams });

      // Exclude current match
      const homeFinished = homeTeamHistory.filter(s => s.match.id !== match.id);
      const awayFinished = awayTeamHistory.filter(s => s.match.id !== match.id);

      // G5 & E5 for Home
      const homeG5 = homeFinished.slice(0, 5);
      const homeE5 = homeFinished.filter(s => s.isHome).slice(0, 5);

      // G5 & E5 for Away
      const awayG5 = awayFinished.slice(0, 5);
      const awayE5 = awayFinished.filter(s => !s.isHome).slice(0, 5);

      // Helper function to count Over 1.5 HT in an array of sample games
      const getHtOver15Count = (list: typeof homeG5) => {
        if (!list.length) return 0;
        let count = 0;
        for (const s of list) {
          const totalHt = s.teamGoalsHT + s.oppGoalsHT;
          if (totalHt >= 2) count++;
        }
        return count;
      };

      const getHtAvgGoals = (list: typeof homeG5) => {
        if (!list.length) return 0;
        let total = 0;
        for (const s of list) {
          total += s.teamGoalsHT + s.oppGoalsHT;
        }
        return total / list.length;
      };

      const homeG5Over15Count = getHtOver15Count(homeG5);
      const homeG5Pct = homeG5.length > 0 ? (homeG5Over15Count / homeG5.length) * 100 : 0;

      const homeE5Over15Count = getHtOver15Count(homeE5);
      const homeE5Pct = homeE5.length > 0 ? (homeE5Over15Count / homeE5.length) * 100 : homeG5Pct;

      const awayG5Over15Count = getHtOver15Count(awayG5);
      const awayG5Pct = awayG5.length > 0 ? (awayG5Over15Count / awayG5.length) * 100 : 0;

      const awayE5Over15Count = getHtOver15Count(awayE5);
      const awayE5Pct = awayE5.length > 0 ? (awayE5Over15Count / awayE5.length) * 100 : awayG5Pct;

      const homeHtGoalsAvg = homeE5.length > 0 ? getHtAvgGoals(homeE5) : getHtAvgGoals(homeG5);
      const awayHtGoalsAvg = awayE5.length > 0 ? getHtAvgGoals(awayE5) : getHtAvgGoals(awayG5);

      // Weighted Over 1.5 HT percentage (presents 60% weight to specific venue E5 and 40% to G5)
      const homeWeighted = homeE5.length > 0 ? (homeE5Pct * 0.6 + homeG5Pct * 0.4) : homeG5Pct;
      const awayWeighted = awayE5.length > 0 ? (awayE5Pct * 0.6 + awayG5Pct * 0.4) : awayG5Pct;
      const avgCombinedOver15HtPct = (homeWeighted + awayWeighted) / 2;

      // Projected Lambda HT
      const projectedHtGoals = (homeHtGoalsAvg + awayHtGoalsAvg) > 0 ? (homeHtGoalsAvg + awayHtGoalsAvg) / 2 : 1.15;

      // Poisson Probability for Over 1.5 HT (1 - P(0) - P(1))
      const p0 = calculatePoissonProbability(0, projectedHtGoals);
      const p1 = calculatePoissonProbability(1, projectedHtGoals);
      const poissonOver15Ht = Math.max(0, Math.min(100, (1 - p0 - p1) * 100));

      // Weighted blended confidence score
      const sampleSizeFactor = Math.min(1, (homeFinished.length + awayFinished.length) / 10);
      const confidenceScore = Math.round((poissonOver15Ht * 0.6 + avgCombinedOver15HtPct * 0.4) * (0.8 + 0.2 * sampleSizeFactor));

      const marketOddJusta = confidenceScore > 0 ? Number((100 / confidenceScore).toFixed(2)) : 5.0;

      // Check for real bookmaker odds if available in match
      const bookieOdd = match.odds?.over25FT ? Number((match.odds.over25FT * 0.65).toFixed(2)) : undefined;
      const evPercent = (bookieOdd && confidenceScore > 0)
        ? Number((((confidenceScore / 100) * bookieOdd - 1) * 100).toFixed(1))
        : undefined;

      // Quality rating tier
      let ratingTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' = 'BRONZE';
      if (confidenceScore >= 60 || (avgCombinedOver15HtPct >= 60 && poissonOver15Ht >= 50)) {
        ratingTier = 'DIAMOND';
      } else if (confidenceScore >= 48 || avgCombinedOver15HtPct >= 45) {
        ratingTier = 'GOLD';
      } else if (confidenceScore >= 35) {
        ratingTier = 'SILVER';
      }

      // Generation of smart tactical highlights
      const highlights: string[] = [];
      if (homeE5Pct >= 60) highlights.push(`Casa com ${homeE5Pct.toFixed(0)}% Over 1.5 HT nos últimos 5 jogos em casa`);
      if (awayE5Pct >= 60) highlights.push(`Visitante com ${awayE5Pct.toFixed(0)}% Over 1.5 HT nos últimos 5 jogos fora`);
      if (projectedHtGoals >= 1.3) highlights.push(`Média conjunta projetada de ${projectedHtGoals.toFixed(2)} gols no 1º tempo`);
      if (evPercent && evPercent > 5) highlights.push(`Valor Esperado Positivo (+${evPercent}% EV)`);

      const timeFormatted = formatMatchTimeBRT(match.matchDate) || '00:00';

      results.push({
        match,
        dateFormatted: selectedDate,
        timeFormatted,
        homeG5Over15HtPct: Math.round(homeG5Pct),
        homeE5Over15HtPct: Math.round(homeE5Pct),
        awayG5Over15HtPct: Math.round(awayG5Pct),
        awayE5Over15HtPct: Math.round(awayE5Pct),
        avgCombinedOver15HtPct: Math.round(avgCombinedOver15HtPct),
        homeHtGoalsAvg: Number(homeHtGoalsAvg.toFixed(2)),
        awayHtGoalsAvg: Number(awayHtGoalsAvg.toFixed(2)),
        projectedHtGoals: Number(projectedHtGoals.toFixed(2)),
        poissonOver15HtProb: Math.round(poissonOver15Ht),
        confidenceScore,
        marketOddJusta,
        marketOddBookie: bookieOdd,
        evPercent,
        ratingTier,
        highlights,
      });
    }

    // Filter by minimum confidence
    const filtered = results.filter(r => r.confidenceScore >= minConfidence);

    // Sort results
    return filtered.sort((a, b) => {
      if (sortBy === 'PROB') return b.poissonOver15HtProb - a.poissonOver15HtProb;
      if (sortBy === 'CONFIDENCE') return b.confidenceScore - a.confidenceScore;
      if (sortBy === 'EV') return (b.evPercent || -999) - (a.evPercent || -999);
      return a.timeFormatted.localeCompare(b.timeFormatted);
    });
  }, [isOpen, dbState.matches, selectedDate, selectedLeagueId, minConfidence, sortBy]);

  if (!isOpen) return null;

  return (
    <div
      id="ht-goals-scanner-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="ht-goals-scanner-modal-container"
        className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <Flame className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">Radar de Gols 1º Tempo (Over 1.5 HT)</h2>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-white text-orange-700 rounded-full shadow-xs">
                  Filtro Automático Diário
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Projeção estatística e Poisson para jogos com alta probabilidade de +1.5 gols no primeiro tempo
              </p>
            </div>
          </div>

          <button
            id="btn-close-ht-scanner"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-slate-700">Data do Jogo:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
            >
              {availableDates.map((date) => {
                const isToday = date === todayStr;
                return (
                  <option key={date} value={date}>
                    {date} {isToday ? '★ (Hoje)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick Filter: Minimum Confidence */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-700">Índice Mínimo:</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-300 bg-white">
              {[
                { label: 'Todos (+25%)', val: 25 },
                { label: 'Padrão (+40%)', val: 40 },
                { label: 'Alto (+50%)', val: 50 },
                { label: 'Top (+60%)', val: 60 },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setMinConfidence(opt.val)}
                  className={`px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    minConfidence === opt.val
                      ? 'bg-orange-600 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-700">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="PROB">Probabilidade Poisson (Maior)</option>
              <option value="CONFIDENCE">Índice de Confiança HT</option>
              <option value="EV">Maior Valor (+EV)</option>
              <option value="TIME">Horário do Jogo</option>
            </select>
          </div>
        </div>

        {/* Results Counter & Info Bar */}
        <div className="px-6 py-2 bg-orange-50 border-b border-orange-200 flex items-center justify-between text-xs text-orange-950 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
            <span>
              Encontradas <strong>{projections.length}</strong> partidas com padrão estatístico para <strong>Over 1.5 HT</strong> em {selectedDate}.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-orange-800">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Diamond (≥60%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Gold (≥48%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Silver (≥35%)
            </span>
          </div>
        </div>

        {/* Matches Grid List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-100">
          {projections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-slate-200 text-slate-500 rounded-2xl mb-3">
                <Filter className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Nenhum jogo atendeu aos critérios na data selecionada</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Tente reduzir o índice mínimo de corte ou selecione outra data com partidas agendadas no calendário.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {projections.map((item) => {
                const match = item.match;
                const league = leaguesMap.get(match.leagueId) || { name: match.leagueName };
                const homeTeam = teamsMap.get(match.homeTeamId) || { logoUrl: match.homeTeamLogoUrl };
                const awayTeam = teamsMap.get(match.awayTeamId) || { logoUrl: match.awayTeamLogoUrl };

                const tierColor =
                  item.ratingTier === 'DIAMOND'
                    ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20'
                    : item.ratingTier === 'GOLD'
                    ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50/20'
                    : 'border-blue-400 bg-white';

                const badgeBg =
                  item.ratingTier === 'DIAMOND'
                    ? 'bg-emerald-600 text-white'
                    : item.ratingTier === 'GOLD'
                    ? 'bg-amber-600 text-white'
                    : 'bg-blue-600 text-white';

                return (
                  <div
                    key={match.id}
                    className={`p-4 rounded-2xl border ${tierColor} shadow-sm hover:shadow-md transition-all flex flex-col justify-between bg-white relative overflow-hidden`}
                  >
                    {/* Top Tier Badge & League */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${badgeBg}`}>
                          {item.ratingTier}
                        </span>
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                          {match.leagueName || league?.name}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-slate-500">
                          {item.timeFormatted}
                        </span>
                      </div>

                      {item.evPercent !== undefined && item.evPercent > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full border border-emerald-300">
                          +{item.evPercent}% EV
                        </span>
                      )}
                    </div>

                    {/* Teams Row */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      {/* Home */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {match.homeTeamLogoUrl || homeTeam?.logoUrl ? (
                            <img
                              src={match.homeTeamLogoUrl || homeTeam?.logoUrl}
                              alt={match.homeTeamName}
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">
                              {match.homeTeamName.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {match.homeTeamName}
                        </span>
                      </div>

                      <div className="px-2 py-1 bg-slate-100 rounded-md text-[11px] font-black text-slate-500">
                        VS
                      </div>

                      {/* Away */}
                      <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate text-right">
                          {match.awayTeamName}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {match.awayTeamLogoUrl || awayTeam?.logoUrl ? (
                            <img
                              src={match.awayTeamLogoUrl || awayTeam?.logoUrl}
                              alt={match.awayTeamName}
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">
                              {match.awayTeamName.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats Matrix Grid */}
                    <div className="grid grid-cols-4 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 mb-3 text-center">
                      <div>
                        <div className="text-[10px] font-semibold text-slate-500">Prob. Poisson</div>
                        <div className="text-sm font-black text-orange-600">{item.poissonOver15HtProb}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-slate-500">Histórico E5</div>
                        <div className="text-sm font-black text-slate-800">
                          {item.homeE5Over15HtPct}% x {item.awayE5Over15HtPct}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-slate-500">Proj. Gols HT</div>
                        <div className="text-sm font-black text-slate-800">{item.projectedHtGoals}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-slate-500">Odd Justa HT</div>
                        <div className="text-sm font-black text-emerald-700">@{item.marketOddJusta.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Highlights Badges */}
                    {item.highlights.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {item.highlights.slice(0, 2).map((h, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Mercado: <strong>Over 1.5 Gols HT</strong>
                      </span>

                      {onSelectMatchForAnalysis && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectMatchForAnalysis(match.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer border border-orange-200"
                        >
                          <span>Ver Análise Completa</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span>
              O cálculo cruza Poisson com a frequência real de Over 1.5 HT nos últimos 5 confrontos gerais (G5) e específicos por mando (E5).
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

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
  Sparkles,
  Zap,
  Target,
  Trophy,
  ShieldAlert,
  BarChart3,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { DbState, Match, RadarCategory } from '../types';
import { extractYMD, formatDateToYMD } from './DailyMatchesView';
import { extractTeamMatches } from '../utils/analysisEngine';
import { formatMatchTimeBRT } from '../utils/dateTimeUtils';
import { isValidImageUrl } from '../utils/imageHelper';

export interface RadarScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onSelectMatchForAnalysis?: (matchId: string) => void;
  initialCategory?: RadarCategory;
}

export interface RadarMatchProjection {
  match: Match;
  category: RadarCategory;
  categoryLabel: string;
  dateFormatted: string;
  timeFormatted: string;
  
  // Historical Percentages
  homeG5Pct: number;
  homeE5Pct: number;
  awayG5Pct: number;
  awayE5Pct: number;
  avgCombinedPct: number;

  // Expected values & Poisson
  expectedMetricHome: number;
  expectedMetricAway: number;
  projectedTotalMetric: number;
  poissonModelProb: number;
  confidenceScore: number;
  
  // Odds & Value
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

export const RADAR_CATEGORIES: {
  id: RadarCategory;
  title: string;
  shortLabel: string;
  badge: string;
  color: string;
  description: string;
}[] = [
  {
    id: 'BTTS_HT',
    title: 'Ambas Marcam HT (1º Tempo)',
    shortLabel: 'Ambas Marcam HT',
    badge: '1ºT',
    color: 'from-amber-600 to-orange-600',
    description: 'Jogos com alta probabilidade de ambas as equipes marcarem gol antes do intervalo.',
  },
  {
    id: 'BTTS_FT',
    title: 'Ambas Marcam FT (Jogo Completo)',
    shortLabel: 'Ambas Marcam FT',
    badge: 'FT',
    color: 'from-blue-600 to-indigo-600',
    description: 'Confrontos com ataques ativos e defesas vulneráveis propícias para BTTS Sim.',
  },
  {
    id: 'OVER_25_FT',
    title: 'Over 2,5 Gols FT',
    shortLabel: 'Over 2.5 FT',
    badge: '+2.5',
    color: 'from-emerald-600 to-teal-600',
    description: 'Partidas com projeção conjunta elevada para 3 ou mais gols no tempo regulamentar.',
  },
  {
    id: 'OVER_35_FT',
    title: 'Over 3,5 Gols FT',
    shortLabel: 'Over 3.5 FT',
    badge: '+3.5',
    color: 'from-purple-600 to-pink-600',
    description: 'Jogos de alta intensidade e volume ofensivo superior projetados para 4+ gols.',
  },
  {
    id: 'HOME_WIN',
    title: 'Mandante para Vencer (1X2)',
    shortLabel: 'Vitória Mandante',
    badge: '1X2',
    color: 'from-rose-600 to-red-700',
    description: 'Mandantes dominantes em casa enfrentando visitantes em momento desfavorável.',
  },
];

export const RadarScannerModal: React.FC<RadarScannerModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onSelectMatchForAnalysis,
  initialCategory = 'BTTS_FT',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RadarCategory>(initialCategory);
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateToYMD(new Date()));
  const [minConfidence, setMinConfidence] = useState<number>(35);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'PROB' | 'CONFIDENCE' | 'TIME' | 'EV'>('PROB');

  // List of distinct match dates available in the database
  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();
    for (const m of dbState.matches || []) {
      const ymd = extractYMD(m.matchDate);
      if (ymd) {
        datesSet.add(ymd);
      }
    }
    return Array.from(datesSet).sort();
  }, [dbState.matches]);

  // Scanner calculation engine supporting all 5 radar categories
  const projections = useMemo(() => {
    if (!isOpen) return [];

    const matchesOnDate = (dbState.matches || []).filter(m => {
      const ymd = extractYMD(m.matchDate);
      if (ymd !== selectedDate) return false;
      if (selectedLeagueId !== 'ALL' && m.leagueId !== selectedLeagueId) return false;
      return true;
    });

    const results: RadarMatchProjection[] = [];

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

      const timeFormatted = formatMatchTimeBRT(match.matchDate) || '00:00';
      const sampleSizeFactor = Math.min(1, (homeFinished.length + awayFinished.length) / 10);

      // -------------------------------------------------------------
      // CATEGORY 1: AMBAS MARCAM HT (BTTS HT)
      // -------------------------------------------------------------
      if (selectedCategory === 'BTTS_HT') {
        const getBttsHtCount = (list: typeof homeG5) => {
          return list.filter(s => s.teamGoalsHT >= 1 && s.oppGoalsHT >= 1).length;
        };

        const getAvgHtFor = (list: typeof homeG5) => {
          if (!list.length) return 0.5;
          return list.reduce((acc, s) => acc + s.teamGoalsHT, 0) / list.length;
        };

        const getAvgHtAgainst = (list: typeof homeG5) => {
          if (!list.length) return 0.5;
          return list.reduce((acc, s) => acc + s.oppGoalsHT, 0) / list.length;
        };

        const homeG5Pct = homeG5.length > 0 ? (getBttsHtCount(homeG5) / homeG5.length) * 100 : 0;
        const homeE5Pct = homeE5.length > 0 ? (getBttsHtCount(homeE5) / homeE5.length) * 100 : homeG5Pct;
        const awayG5Pct = awayG5.length > 0 ? (getBttsHtCount(awayG5) / awayG5.length) * 100 : 0;
        const awayE5Pct = awayE5.length > 0 ? (getBttsHtCount(awayE5) / awayE5.length) * 100 : awayG5Pct;

        const homeWeighted = homeE5.length > 0 ? (homeE5Pct * 0.6 + homeG5Pct * 0.4) : homeG5Pct;
        const awayWeighted = awayE5.length > 0 ? (awayE5Pct * 0.6 + awayG5Pct * 0.4) : awayG5Pct;
        const avgCombinedPct = (homeWeighted + awayWeighted) / 2;

        const homeExpectedScoringHT = homeE5.length > 0 ? getAvgHtFor(homeE5) : getAvgHtFor(homeG5);
        const awayExpectedScoringHT = awayE5.length > 0 ? getAvgHtFor(awayE5) : getAvgHtFor(awayG5);
        const homeExpectedConcedingHT = homeE5.length > 0 ? getAvgHtAgainst(homeE5) : getAvgHtAgainst(homeG5);
        const awayExpectedConcedingHT = awayE5.length > 0 ? getAvgHtAgainst(awayE5) : getAvgHtAgainst(awayG5);

        const lambdaHomeHT = Math.max(0.2, (homeExpectedScoringHT + awayExpectedConcedingHT) / 2);
        const lambdaAwayHT = Math.max(0.2, (awayExpectedScoringHT + homeExpectedConcedingHT) / 2);

        const probHomeScoreHT = 1 - Math.exp(-lambdaHomeHT);
        const probAwayScoreHT = 1 - Math.exp(-lambdaAwayHT);
        const poissonModelProb = Math.max(0, Math.min(100, (probHomeScoreHT * probAwayScoreHT) * 100));

        const confidenceScore = Math.round((poissonModelProb * 0.6 + avgCombinedPct * 0.4) * (0.8 + 0.2 * sampleSizeFactor));
        const marketOddJusta = confidenceScore > 0 ? Number((100 / confidenceScore).toFixed(2)) : 5.0;

        const highlights: string[] = [];
        if (homeE5Pct >= 40) highlights.push(`Mandante com ${homeE5Pct.toFixed(0)}% Ambas Marcam HT em casa`);
        if (awayE5Pct >= 40) highlights.push(`Visitante com ${awayE5Pct.toFixed(0)}% Ambas Marcam HT fora`);
        if (lambdaHomeHT >= 0.7 && lambdaAwayHT >= 0.7) highlights.push(`Média de gols projetada no 1ºT elevada para ambos`);

        let ratingTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' = 'BRONZE';
        if (confidenceScore >= 45 || (avgCombinedPct >= 50 && poissonModelProb >= 40)) ratingTier = 'DIAMOND';
        else if (confidenceScore >= 35) ratingTier = 'GOLD';
        else if (confidenceScore >= 25) ratingTier = 'SILVER';

        results.push({
          match,
          category: 'BTTS_HT',
          categoryLabel: 'Ambas Marcam HT',
          dateFormatted: selectedDate,
          timeFormatted,
          homeG5Pct: Math.round(homeG5Pct),
          homeE5Pct: Math.round(homeE5Pct),
          awayG5Pct: Math.round(awayG5Pct),
          awayE5Pct: Math.round(awayE5Pct),
          avgCombinedPct: Math.round(avgCombinedPct),
          expectedMetricHome: Number(lambdaHomeHT.toFixed(2)),
          expectedMetricAway: Number(lambdaAwayHT.toFixed(2)),
          projectedTotalMetric: Number((lambdaHomeHT + lambdaAwayHT).toFixed(2)),
          poissonModelProb: Math.round(poissonModelProb),
          confidenceScore,
          marketOddJusta,
          ratingTier,
          highlights,
        });
      }

      // -------------------------------------------------------------
      // CATEGORY 2: AMBAS MARCAM FT (BTTS FT)
      // -------------------------------------------------------------
      else if (selectedCategory === 'BTTS_FT') {
        const getBttsCount = (list: typeof homeG5) => {
          return list.filter(s => s.teamGoals >= 1 && s.oppGoals >= 1).length;
        };

        const getAvgGoalsFor = (list: typeof homeG5) => {
          if (!list.length) return 1.2;
          return list.reduce((acc, s) => acc + s.teamGoals, 0) / list.length;
        };

        const getAvgGoalsAgainst = (list: typeof homeG5) => {
          if (!list.length) return 1.2;
          return list.reduce((acc, s) => acc + s.oppGoals, 0) / list.length;
        };

        const homeG5Pct = homeG5.length > 0 ? (getBttsCount(homeG5) / homeG5.length) * 100 : 0;
        const homeE5Pct = homeE5.length > 0 ? (getBttsCount(homeE5) / homeE5.length) * 100 : homeG5Pct;
        const awayG5Pct = awayG5.length > 0 ? (getBttsCount(awayG5) / awayG5.length) * 100 : 0;
        const awayE5Pct = awayE5.length > 0 ? (getBttsCount(awayE5) / awayE5.length) * 100 : awayG5Pct;

        const homeWeighted = homeE5.length > 0 ? (homeE5Pct * 0.6 + homeG5Pct * 0.4) : homeG5Pct;
        const awayWeighted = awayE5.length > 0 ? (awayE5Pct * 0.6 + awayG5Pct * 0.4) : awayG5Pct;
        const avgCombinedPct = (homeWeighted + awayWeighted) / 2;

        const homeScoring = homeE5.length > 0 ? getAvgGoalsFor(homeE5) : getAvgGoalsFor(homeG5);
        const awayScoring = awayE5.length > 0 ? getAvgGoalsFor(awayE5) : getAvgGoalsFor(awayG5);
        const homeConceding = homeE5.length > 0 ? getAvgGoalsAgainst(homeE5) : getAvgGoalsAgainst(homeG5);
        const awayConceding = awayE5.length > 0 ? getAvgGoalsAgainst(awayE5) : getAvgGoalsAgainst(awayG5);

        const lambdaHome = Math.max(0.5, (homeScoring + awayConceding) / 2);
        const lambdaAway = Math.max(0.5, (awayScoring + homeConceding) / 2);

        const probHomeScore = 1 - Math.exp(-lambdaHome);
        const probAwayScore = 1 - Math.exp(-lambdaAway);
        const poissonModelProb = Math.max(0, Math.min(100, (probHomeScore * probAwayScore) * 100));

        const confidenceScore = Math.round((poissonModelProb * 0.55 + avgCombinedPct * 0.45) * (0.85 + 0.15 * sampleSizeFactor));
        const marketOddJusta = confidenceScore > 0 ? Number((100 / confidenceScore).toFixed(2)) : 2.2;

        const highlights: string[] = [];
        if (homeE5Pct >= 60) highlights.push(`Mandante com BTTS em ${homeE5Pct.toFixed(0)}% dos jogos em casa`);
        if (awayE5Pct >= 60) highlights.push(`Visitante com BTTS em ${awayE5Pct.toFixed(0)}% dos jogos fora`);
        if (lambdaHome >= 1.3 && lambdaAway >= 1.2) highlights.push(`Expectativa de gols ativa para ambos (${lambdaHome.toFixed(2)} x ${lambdaAway.toFixed(2)})`);

        let ratingTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' = 'BRONZE';
        if (confidenceScore >= 65 || (avgCombinedPct >= 70 && poissonModelProb >= 60)) ratingTier = 'DIAMOND';
        else if (confidenceScore >= 55) ratingTier = 'GOLD';
        else if (confidenceScore >= 45) ratingTier = 'SILVER';

        results.push({
          match,
          category: 'BTTS_FT',
          categoryLabel: 'Ambas Marcam FT',
          dateFormatted: selectedDate,
          timeFormatted,
          homeG5Pct: Math.round(homeG5Pct),
          homeE5Pct: Math.round(homeE5Pct),
          awayG5Pct: Math.round(awayG5Pct),
          awayE5Pct: Math.round(awayE5Pct),
          avgCombinedPct: Math.round(avgCombinedPct),
          expectedMetricHome: Number(lambdaHome.toFixed(2)),
          expectedMetricAway: Number(lambdaAway.toFixed(2)),
          projectedTotalMetric: Number((lambdaHome + lambdaAway).toFixed(2)),
          poissonModelProb: Math.round(poissonModelProb),
          confidenceScore,
          marketOddJusta,
          ratingTier,
          highlights,
        });
      }

      // -------------------------------------------------------------
      // CATEGORY 3: OVER 2,5 GOLS FT
      // -------------------------------------------------------------
      else if (selectedCategory === 'OVER_25_FT') {
        const getOver25Count = (list: typeof homeG5) => {
          return list.filter(s => (s.teamGoals + s.oppGoals) >= 3).length;
        };

        const getAvgMatchGoals = (list: typeof homeG5) => {
          if (!list.length) return 2.5;
          return list.reduce((acc, s) => acc + s.teamGoals + s.oppGoals, 0) / list.length;
        };

        const homeG5Pct = homeG5.length > 0 ? (getOver25Count(homeG5) / homeG5.length) * 100 : 0;
        const homeE5Pct = homeE5.length > 0 ? (getOver25Count(homeE5) / homeE5.length) * 100 : homeG5Pct;
        const awayG5Pct = awayG5.length > 0 ? (getOver25Count(awayG5) / awayG5.length) * 100 : 0;
        const awayE5Pct = awayE5.length > 0 ? (getOver25Count(awayE5) / awayE5.length) * 100 : awayG5Pct;

        const homeWeighted = homeE5.length > 0 ? (homeE5Pct * 0.6 + homeG5Pct * 0.4) : homeG5Pct;
        const awayWeighted = awayE5.length > 0 ? (awayE5Pct * 0.6 + awayG5Pct * 0.4) : awayG5Pct;
        const avgCombinedPct = (homeWeighted + awayWeighted) / 2;

        const homeGoalsAvg = homeE5.length > 0 ? getAvgMatchGoals(homeE5) : getAvgMatchGoals(homeG5);
        const awayGoalsAvg = awayE5.length > 0 ? getAvgMatchGoals(awayE5) : getAvgMatchGoals(awayG5);
        const projectedTotal = (homeGoalsAvg + awayGoalsAvg) / 2;

        const p0 = calculatePoissonProbability(0, projectedTotal);
        const p1 = calculatePoissonProbability(1, projectedTotal);
        const p2 = calculatePoissonProbability(2, projectedTotal);
        const poissonModelProb = Math.max(0, Math.min(100, (1 - p0 - p1 - p2) * 100));

        const confidenceScore = Math.round((poissonModelProb * 0.55 + avgCombinedPct * 0.45) * (0.85 + 0.15 * sampleSizeFactor));
        const marketOddJusta = confidenceScore > 0 ? Number((100 / confidenceScore).toFixed(2)) : 2.1;

        const bookieOdd = match.odds?.over25FT || undefined;
        const evPercent = (bookieOdd && confidenceScore > 0)
          ? Number((((confidenceScore / 100) * bookieOdd - 1) * 100).toFixed(1))
          : undefined;

        const highlights: string[] = [];
        if (homeE5Pct >= 60) highlights.push(`Mandante com ${homeE5Pct.toFixed(0)}% Over 2.5 nos jogos em casa`);
        if (awayE5Pct >= 60) highlights.push(`Visitante com ${awayE5Pct.toFixed(0)}% Over 2.5 nos jogos fora`);
        if (projectedTotal >= 2.8) highlights.push(`Média de gols projetada de ${projectedTotal.toFixed(2)} gols`);
        if (evPercent && evPercent > 3) highlights.push(`Valor Esperado Positivo (+${evPercent}% EV)`);

        let ratingTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' = 'BRONZE';
        if (confidenceScore >= 62 || (avgCombinedPct >= 65 && poissonModelProb >= 60)) ratingTier = 'DIAMOND';
        else if (confidenceScore >= 52) ratingTier = 'GOLD';
        else if (confidenceScore >= 42) ratingTier = 'SILVER';

        results.push({
          match,
          category: 'OVER_25_FT',
          categoryLabel: 'Over 2.5 Gols FT',
          dateFormatted: selectedDate,
          timeFormatted,
          homeG5Pct: Math.round(homeG5Pct),
          homeE5Pct: Math.round(homeE5Pct),
          awayG5Pct: Math.round(awayG5Pct),
          awayE5Pct: Math.round(awayE5Pct),
          avgCombinedPct: Math.round(avgCombinedPct),
          expectedMetricHome: Number((homeGoalsAvg / 2).toFixed(2)),
          expectedMetricAway: Number((awayGoalsAvg / 2).toFixed(2)),
          projectedTotalMetric: Number(projectedTotal.toFixed(2)),
          poissonModelProb: Math.round(poissonModelProb),
          confidenceScore,
          marketOddJusta,
          marketOddBookie: bookieOdd,
          evPercent,
          ratingTier,
          highlights,
        });
      }

      // -------------------------------------------------------------
      // CATEGORY 4: OVER 3,5 GOLS FT
      // -------------------------------------------------------------
      else if (selectedCategory === 'OVER_35_FT') {
        const getOver35Count = (list: typeof homeG5) => {
          return list.filter(s => (s.teamGoals + s.oppGoals) >= 4).length;
        };

        const getAvgMatchGoals = (list: typeof homeG5) => {
          if (!list.length) return 2.6;
          return list.reduce((acc, s) => acc + s.teamGoals + s.oppGoals, 0) / list.length;
        };

        const homeG5Pct = homeG5.length > 0 ? (getOver35Count(homeG5) / homeG5.length) * 100 : 0;
        const homeE5Pct = homeE5.length > 0 ? (getOver35Count(homeE5) / homeE5.length) * 100 : homeG5Pct;
        const awayG5Pct = awayG5.length > 0 ? (getOver35Count(awayG5) / awayG5.length) * 100 : 0;
        const awayE5Pct = awayE5.length > 0 ? (getOver35Count(awayE5) / awayE5.length) * 100 : awayG5Pct;

        const homeWeighted = homeE5.length > 0 ? (homeE5Pct * 0.6 + homeG5Pct * 0.4) : homeG5Pct;
        const awayWeighted = awayE5.length > 0 ? (awayE5Pct * 0.6 + awayG5Pct * 0.4) : awayG5Pct;
        const avgCombinedPct = (homeWeighted + awayWeighted) / 2;

        const homeGoalsAvg = homeE5.length > 0 ? getAvgMatchGoals(homeE5) : getAvgMatchGoals(homeG5);
        const awayGoalsAvg = awayE5.length > 0 ? getAvgMatchGoals(awayE5) : getAvgMatchGoals(awayG5);
        const projectedTotal = (homeGoalsAvg + awayGoalsAvg) / 2;

        const p0 = calculatePoissonProbability(0, projectedTotal);
        const p1 = calculatePoissonProbability(1, projectedTotal);
        const p2 = calculatePoissonProbability(2, projectedTotal);
        const p3 = calculatePoissonProbability(3, projectedTotal);
        const poissonModelProb = Math.max(0, Math.min(100, (1 - p0 - p1 - p2 - p3) * 100));

        const confidenceScore = Math.round((poissonModelProb * 0.6 + avgCombinedPct * 0.4) * (0.8 + 0.2 * sampleSizeFactor));
        const marketOddJusta = confidenceScore > 0 ? Number((100 / confidenceScore).toFixed(2)) : 3.5;

        const highlights: string[] = [];
        if (homeE5Pct >= 40) highlights.push(`Mandante com ${homeE5Pct.toFixed(0)}% Over 3.5 nos jogos em casa`);
        if (awayE5Pct >= 40) highlights.push(`Visitante com ${awayE5Pct.toFixed(0)}% Over 3.5 nos jogos fora`);
        if (projectedTotal >= 3.3) highlights.push(`Alta média combinada de ${projectedTotal.toFixed(2)} gols por jogo`);

        let ratingTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' = 'BRONZE';
        if (confidenceScore >= 45 || (avgCombinedPct >= 50 && poissonModelProb >= 40)) ratingTier = 'DIAMOND';
        else if (confidenceScore >= 35) ratingTier = 'GOLD';
        else if (confidenceScore >= 25) ratingTier = 'SILVER';

        results.push({
          match,
          category: 'OVER_35_FT',
          categoryLabel: 'Over 3.5 Gols FT',
          dateFormatted: selectedDate,
          timeFormatted,
          homeG5Pct: Math.round(homeG5Pct),
          homeE5Pct: Math.round(homeE5Pct),
          awayG5Pct: Math.round(awayG5Pct),
          awayE5Pct: Math.round(awayE5Pct),
          avgCombinedPct: Math.round(avgCombinedPct),
          expectedMetricHome: Number((homeGoalsAvg / 2).toFixed(2)),
          expectedMetricAway: Number((awayGoalsAvg / 2).toFixed(2)),
          projectedTotalMetric: Number(projectedTotal.toFixed(2)),
          poissonModelProb: Math.round(poissonModelProb),
          confidenceScore,
          marketOddJusta,
          ratingTier,
          highlights,
        });
      }

      // -------------------------------------------------------------
      // CATEGORY 5: MANDANTE PARA VENCER (HOME WIN)
      // -------------------------------------------------------------
      else if (selectedCategory === 'HOME_WIN') {
        const getHomeWinCount = (list: typeof homeG5) => {
          return list.filter(s => s.result === 'W').length;
        };

        const getAwayLossCount = (list: typeof awayG5) => {
          return list.filter(s => s.result === 'L').length;
        };

        const homeG5WinPct = homeG5.length > 0 ? (getHomeWinCount(homeG5) / homeG5.length) * 100 : 0;
        const homeE5WinPct = homeE5.length > 0 ? (getHomeWinCount(homeE5) / homeE5.length) * 100 : homeG5WinPct;

        const awayG5LossPct = awayG5.length > 0 ? (getAwayLossCount(awayG5) / awayG5.length) * 100 : 0;
        const awayE5LossPct = awayE5.length > 0 ? (getAwayLossCount(awayE5) / awayE5.length) * 100 : awayG5LossPct;

        const homeDominance = homeE5.length > 0 ? (homeE5WinPct * 0.65 + homeG5WinPct * 0.35) : homeG5WinPct;
        const awayFragility = awayE5.length > 0 ? (awayE5LossPct * 0.65 + awayG5LossPct * 0.35) : awayG5LossPct;
        const avgCombinedPct = (homeDominance + awayFragility) / 2;

        // Poisson estimation
        const homeGoalsAvg = homeE5.length > 0
          ? homeE5.reduce((acc, s) => acc + s.teamGoals, 0) / homeE5.length
          : (homeG5.reduce((acc, s) => acc + s.teamGoals, 0) / (homeG5.length || 1));

        const awayConcededAvg = awayE5.length > 0
          ? awayE5.reduce((acc, s) => acc + s.oppGoals, 0) / awayE5.length
          : (awayG5.reduce((acc, s) => acc + s.oppGoals, 0) / (awayG5.length || 1));

        const awayGoalsAvg = awayE5.length > 0
          ? awayE5.reduce((acc, s) => acc + s.teamGoals, 0) / awayE5.length
          : (awayG5.reduce((acc, s) => acc + s.teamGoals, 0) / (awayG5.length || 1));

        const homeConcededAvg = homeE5.length > 0
          ? homeE5.reduce((acc, s) => acc + s.oppGoals, 0) / homeE5.length
          : (homeG5.reduce((acc, s) => acc + s.oppGoals, 0) / (homeG5.length || 1));

        const lambdaHome = Math.max(0.6, (homeGoalsAvg + awayConcededAvg) / 2);
        const lambdaAway = Math.max(0.4, (awayGoalsAvg + homeConcededAvg) / 2);

        let probHomeWin = 0;
        for (let i = 1; i <= 6; i++) {
          for (let j = 0; j < i; j++) {
            probHomeWin += calculatePoissonProbability(i, lambdaHome) * calculatePoissonProbability(j, lambdaAway);
          }
        }
        const poissonModelProb = Math.max(0, Math.min(100, probHomeWin * 100));

        const confidenceScore = Math.round((poissonModelProb * 0.55 + avgCombinedPct * 0.45) * (0.85 + 0.15 * sampleSizeFactor));
        const marketOddJusta = confidenceScore > 0 ? Number((100 / confidenceScore).toFixed(2)) : 2.0;

        const bookieOdd = match.odds?.homeFT || undefined;
        const evPercent = (bookieOdd && confidenceScore > 0)
          ? Number((((confidenceScore / 100) * bookieOdd - 1) * 100).toFixed(1))
          : undefined;

        const highlights: string[] = [];
        if (homeE5WinPct >= 60) highlights.push(`Mandante venceu ${homeE5WinPct.toFixed(0)}% dos últimos jogos em casa`);
        if (awayE5LossPct >= 60) highlights.push(`Visitante perdeu ${awayE5LossPct.toFixed(0)}% dos últimos jogos fora`);
        if (lambdaHome >= lambdaAway + 0.6) highlights.push(`Diferencial ofensivo significativo (${lambdaHome.toFixed(2)} x ${lambdaAway.toFixed(2)})`);
        if (evPercent && evPercent > 3) highlights.push(`Valor Esperado Positivo (+${evPercent}% EV)`);

        let ratingTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' = 'BRONZE';
        if (confidenceScore >= 65 || (avgCombinedPct >= 70 && poissonModelProb >= 60)) ratingTier = 'DIAMOND';
        else if (confidenceScore >= 55) ratingTier = 'GOLD';
        else if (confidenceScore >= 45) ratingTier = 'SILVER';

        results.push({
          match,
          category: 'HOME_WIN',
          categoryLabel: 'Mandante para Vencer',
          dateFormatted: selectedDate,
          timeFormatted,
          homeG5Pct: Math.round(homeE5WinPct),
          homeE5Pct: Math.round(homeG5WinPct),
          awayG5Pct: Math.round(awayE5LossPct),
          awayE5Pct: Math.round(awayG5LossPct),
          avgCombinedPct: Math.round(avgCombinedPct),
          expectedMetricHome: Number(lambdaHome.toFixed(2)),
          expectedMetricAway: Number(lambdaAway.toFixed(2)),
          projectedTotalMetric: Number((lambdaHome - lambdaAway).toFixed(2)),
          poissonModelProb: Math.round(poissonModelProb),
          confidenceScore,
          marketOddJusta,
          marketOddBookie: bookieOdd,
          evPercent,
          ratingTier,
          highlights,
        });
      }
    }

    // Filter by minimum confidence
    const filtered = results.filter(r => r.confidenceScore >= minConfidence);

    // Sort results
    return filtered.sort((a, b) => {
      if (sortBy === 'PROB') return b.poissonModelProb - a.poissonModelProb;
      if (sortBy === 'CONFIDENCE') return b.confidenceScore - a.confidenceScore;
      if (sortBy === 'EV') return (b.evPercent || -999) - (a.evPercent || -999);
      return a.timeFormatted.localeCompare(b.timeFormatted);
    });
  }, [isOpen, dbState.matches, selectedDate, selectedLeagueId, selectedCategory, minConfidence, sortBy]);

  if (!isOpen) return null;

  const currentCategoryInfo = RADAR_CATEGORIES.find(c => c.id === selectedCategory) || RADAR_CATEGORIES[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        id="radar-scanner-modal"
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 bg-gradient-to-r ${currentCategoryInfo.color} text-white flex items-center justify-between shadow-md`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs border border-white/20">
              <Flame className="w-6 h-6 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                  CENTRAL DE RADARES INTELIGENTES
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  {currentCategoryInfo.badge}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                Radar: {currentCategoryInfo.title}
              </h2>
              <p className="text-xs text-white/80 font-medium hidden sm:block">
                {currentCategoryInfo.description}
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

        {/* RADAR SELECTOR TABS */}
        <div className="bg-slate-900 p-2.5 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto">
          {RADAR_CATEGORIES.map(cat => {
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
                <Flame className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950 fill-slate-950' : 'text-amber-400'}`} />
                <span>{cat.shortLabel}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-slate-950 text-amber-300' : 'bg-slate-950 text-slate-400'
                }`}>
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
              <span className="font-mono font-black text-slate-900">{minConfidence}%</span>
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
                Tente diminuir a barra de Confiança Mínima ou alterar a data selecionada. Certifique-se de que os jogos possuem histórico recente de partidas finalizadas no banco de dados.
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
                          <img src={match.leagueLogoUrl} alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                        ) : null}
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[170px]">
                          {match.leagueName || 'Liga'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {proj.timeFormatted}h
                        </span>
                      </div>

                      {/* Tier Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        proj.ratingTier === 'DIAMOND'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : proj.ratingTier === 'GOLD'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : proj.ratingTier === 'SILVER'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        ★ {proj.ratingTier}
                      </span>
                    </div>

                    {/* Teams Matchup */}
                    <div className="space-y-2">
                      {/* Home */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isValidImageUrl(match.homeTeamLogoUrl) ? (
                            <img src={match.homeTeamLogoUrl} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
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
                            <img src={match.awayTeamLogoUrl} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
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
                        <span className="text-[10px] text-slate-500 block font-semibold">Prob. Poisson</span>
                        <span className="text-sm font-black text-indigo-700 font-mono">
                          {proj.poissonModelProb}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-semibold">Score Confiança</span>
                        <span className="text-sm font-black text-slate-900 font-mono">
                          {proj.confidenceScore}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-semibold">Odd Justa</span>
                        <span className="text-sm font-black text-emerald-700 font-mono">
                          @{proj.marketOddJusta.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Highlights */}
                    {proj.highlights.length > 0 && (
                      <div className="space-y-1">
                        {proj.highlights.map((h, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Button: Abrir Análise Detalhada */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      {proj.marketOddBookie && (
                        <div className="text-[11px] font-bold text-slate-600">
                          Odd Casa: <span className="text-slate-900 font-mono">@{proj.marketOddBookie.toFixed(2)}</span>
                          {proj.evPercent && (
                            <span className={`ml-1 font-black ${proj.evPercent > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              ({proj.evPercent > 0 ? `+${proj.evPercent}% EV` : `${proj.evPercent}% EV`})
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

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold flex items-center gap-1">
            <Info className="w-4 h-4 text-slate-400" />
            Radares calculados com base em Poisson Bivariado, G5, E5 e Ponderação de Força.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

import { Match, Team, RadarCategory } from '../types';
import { extractTeamMatches } from './analysisEngine';
import { formatMatchTimeBRT } from './dateTimeUtils';

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

export interface RadarBacktestEntry {
  matchId: string;
  match: Match;
  category: RadarCategory;
  categoryLabel: string;
  matchDate: string;
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeScoreHT?: number;
  awayScoreHT?: number;
  confidenceScore: number;
  poissonProb: number;
  ratingTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE';
  odd: number;
  outcome: 'GREEN' | 'RED' | 'VOID';
  profitUnits: number;
  conditionDescription: string;
}

export interface RadarMarketSummary {
  category: RadarCategory;
  title: string;
  shortLabel: string;
  badge: string;
  color: string;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  winRatePct: number;
  avgOdd: number;
  totalProfitUnits: number;
  roiPct: number;
  tierBreakdown: {
    tier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE';
    bets: number;
    wins: number;
    winRatePct: number;
    profitUnits: number;
    roiPct: number;
  }[];
}

export interface RadarBacktestReport {
  totalMatchesAnalyzed: number;
  totalSuggestionsGenerated: number;
  overallWins: number;
  overallLosses: number;
  overallWinRatePct: number;
  overallProfitUnits: number;
  overallRoiPct: number;
  avgOddOverall: number;
  markets: RadarMarketSummary[];
  entries: RadarBacktestEntry[];
  mostProfitableMarket: RadarMarketSummary | null;
  highestWinRateMarket: RadarMarketSummary | null;
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

export const RADAR_CATEGORIES_CONFIG: {
  id: RadarCategory;
  title: string;
  shortLabel: string;
  badge: string;
  color: string;
  description: string;
  defaultMarketOdd: number;
}[] = [
  {
    id: 'BTTS_HT',
    title: 'Ambas Marcam HT (1º Tempo)',
    shortLabel: 'Ambas Marcam HT',
    badge: '1ºT',
    color: 'from-amber-600 to-orange-600',
    description: 'Jogos com alta probabilidade de ambas as equipes marcarem gol antes do intervalo.',
    defaultMarketOdd: 4.20,
  },
  {
    id: 'BTTS_FT',
    title: 'Ambas Marcam FT (Jogo Completo)',
    shortLabel: 'Ambas Marcam FT',
    badge: 'FT',
    color: 'from-blue-600 to-indigo-600',
    description: 'Confrontos com ataques ativos e defesas vulneráveis propícias para BTTS Sim.',
    defaultMarketOdd: 1.85,
  },
  {
    id: 'OVER_25_FT',
    title: 'Over 2,5 Gols FT',
    shortLabel: 'Over 2.5 FT',
    badge: '+2.5',
    color: 'from-emerald-600 to-teal-600',
    description: 'Partidas com projeção conjunta elevada para 3 ou mais gols no tempo regulamentar.',
    defaultMarketOdd: 1.95,
  },
  {
    id: 'OVER_35_FT',
    title: 'Over 3,5 Gols FT',
    shortLabel: 'Over 3.5 FT',
    badge: '+3.5',
    color: 'from-purple-600 to-pink-600',
    description: 'Jogos de alta intensidade e volume ofensivo superior projetados para 4+ gols.',
    defaultMarketOdd: 3.30,
  },
  {
    id: 'HOME_WIN',
    title: 'Mandante para Vencer (1X2)',
    shortLabel: 'Vitória Mandante',
    badge: '1X2',
    color: 'from-rose-600 to-red-700',
    description: 'Mandantes dominantes em casa enfrentando visitantes em momento desfavorável.',
    defaultMarketOdd: 1.80,
  },
];

/**
 * Calculates a single radar projection for a given match and category
 */
export function calculateSingleRadarProjection(
  match: Match,
  allMatches: Match[],
  teams: Team[],
  category: RadarCategory
): RadarMatchProjection | null {
  const homeTeamId = match.homeTeamId || match.homeTeamName;
  const awayTeamId = match.awayTeamId || match.awayTeamName;

  if (!homeTeamId || !awayTeamId) return null;

  // Extract prior matches strictly
  const homeTeamHistory = extractTeamMatches(homeTeamId, allMatches, { teams });
  const awayTeamHistory = extractTeamMatches(awayTeamId, allMatches, { teams });

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
  const dateFormatted = match.matchDate ? match.matchDate.substring(0, 10) : '';

  // 1. BTTS HT
  if (category === 'BTTS_HT') {
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

    return {
      match,
      category: 'BTTS_HT',
      categoryLabel: 'Ambas Marcam HT',
      dateFormatted,
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
    };
  }

  // 2. BTTS FT
  if (category === 'BTTS_FT') {
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

    const bookieOdd = (match.odds as any)?.bttsFT || undefined;
    const evPercent = (bookieOdd && confidenceScore > 0)
      ? Number((((confidenceScore / 100) * bookieOdd - 1) * 100).toFixed(1))
      : undefined;

    const highlights: string[] = [];
    if (homeE5Pct >= 60) highlights.push(`Mandante com BTTS em ${homeE5Pct.toFixed(0)}% dos jogos em casa`);
    if (awayE5Pct >= 60) highlights.push(`Visitante com BTTS em ${awayE5Pct.toFixed(0)}% dos jogos fora`);
    if (lambdaHome >= 1.3 && lambdaAway >= 1.2) highlights.push(`Expectativa de gols ativa para ambos (${lambdaHome.toFixed(2)} x ${lambdaAway.toFixed(2)})`);

    let ratingTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' = 'BRONZE';
    if (confidenceScore >= 65 || (avgCombinedPct >= 70 && poissonModelProb >= 60)) ratingTier = 'DIAMOND';
    else if (confidenceScore >= 55) ratingTier = 'GOLD';
    else if (confidenceScore >= 45) ratingTier = 'SILVER';

    return {
      match,
      category: 'BTTS_FT',
      categoryLabel: 'Ambas Marcam FT',
      dateFormatted,
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
      marketOddBookie: bookieOdd,
      evPercent,
      ratingTier,
      highlights,
    };
  }

  // 3. OVER 2.5 FT
  if (category === 'OVER_25_FT') {
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

    let ratingTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' = 'BRONZE';
    if (confidenceScore >= 62 || (avgCombinedPct >= 65 && poissonModelProb >= 60)) ratingTier = 'DIAMOND';
    else if (confidenceScore >= 52) ratingTier = 'GOLD';
    else if (confidenceScore >= 42) ratingTier = 'SILVER';

    return {
      match,
      category: 'OVER_25_FT',
      categoryLabel: 'Over 2.5 Gols FT',
      dateFormatted,
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
    };
  }

  // 4. OVER 3.5 FT
  if (category === 'OVER_35_FT') {
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

    return {
      match,
      category: 'OVER_35_FT',
      categoryLabel: 'Over 3.5 Gols FT',
      dateFormatted,
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
    };
  }

  // 5. HOME WIN
  if (category === 'HOME_WIN') {
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

    let ratingTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' = 'BRONZE';
    if (confidenceScore >= 65 || (avgCombinedPct >= 70 && poissonModelProb >= 60)) ratingTier = 'DIAMOND';
    else if (confidenceScore >= 55) ratingTier = 'GOLD';
    else if (confidenceScore >= 45) ratingTier = 'SILVER';

    return {
      match,
      category: 'HOME_WIN',
      categoryLabel: 'Mandante para Vencer',
      dateFormatted,
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
    };
  }

  return null;
}

/**
 * Runs a complete Backtest across all finished matches for all 5 radar models
 */
export function runRadarBacktest(
  allMatches: Match[],
  teams: Team[],
  options: {
    leagueId?: string;
    minConfidence?: number;
    targetTier?: string;
    targetCategory?: RadarCategory | 'ALL';
  } = {}
): RadarBacktestReport {
  const minConfidence = options.minConfidence ?? 35;
  const leagueId = options.leagueId ?? 'ALL';
  const targetCategory = options.targetCategory ?? 'ALL';
  const targetTier = options.targetTier ?? 'ALL';

  // Filter finished matches with recorded scores
  const finishedMatches = (allMatches || []).filter(m => {
    const isFinished = m.status === 'FINALIZADO' ||
      (m.homeScore !== undefined && m.awayScore !== undefined && m.homeScore !== null && m.awayScore !== null);
    if (!isFinished) return false;
    if (leagueId !== 'ALL' && m.leagueId !== leagueId) return false;
    return true;
  });

  // Sort matches chronologically to simulate chronological historical testing
  const sortedMatches = [...finishedMatches].sort((a, b) => {
    const da = a.matchDate || '';
    const db = b.matchDate || '';
    return da.localeCompare(db);
  });

  const entries: RadarBacktestEntry[] = [];

  const categoryConfigs = targetCategory === 'ALL'
    ? RADAR_CATEGORIES_CONFIG
    : RADAR_CATEGORIES_CONFIG.filter(c => c.id === targetCategory);

  for (const match of sortedMatches) {
    const hScore = Number(match.homeScore ?? 0);
    const aScore = Number(match.awayScore ?? 0);
    const hScoreHT = match.stats?.halftimeHomeScore !== undefined && match.stats?.halftimeHomeScore !== null
      ? Number(match.stats.halftimeHomeScore)
      : undefined;
    const aScoreHT = match.stats?.halftimeAwayScore !== undefined && match.stats?.halftimeAwayScore !== null
      ? Number(match.stats.halftimeAwayScore)
      : undefined;

    for (const catConfig of categoryConfigs) {
      const proj = calculateSingleRadarProjection(match, allMatches, teams, catConfig.id);
      if (!proj) continue;

      if (proj.confidenceScore < minConfidence) continue;
      if (targetTier !== 'ALL' && proj.ratingTier !== targetTier) continue;

      // Determine outcome and odd
      let isWin = false;
      let conditionText = '';
      let chosenOdd = proj.marketOddBookie || proj.marketOddJusta || catConfig.defaultMarketOdd;

      // Ensure reasonable bounded odd
      if (!chosenOdd || chosenOdd < 1.1) chosenOdd = catConfig.defaultMarketOdd;
      chosenOdd = Math.min(10.0, Math.max(1.15, Number(chosenOdd.toFixed(2))));

      if (catConfig.id === 'BTTS_HT') {
        if (hScoreHT === undefined || aScoreHT === undefined) {
          // If HT score wasn't provided, check if total score can deduce or skip
          continue;
        }
        isWin = hScoreHT >= 1 && aScoreHT >= 1;
        conditionText = `Ambas Marcaram 1ºT (Placar HT: ${hScoreHT}x${aScoreHT})`;
      } else if (catConfig.id === 'BTTS_FT') {
        isWin = hScore >= 1 && aScore >= 1;
        conditionText = `Ambas Marcaram FT (Placar: ${hScore}x${aScore})`;
      } else if (catConfig.id === 'OVER_25_FT') {
        isWin = (hScore + aScore) >= 3;
        conditionText = `Over 2.5 Gols (Total: ${hScore + aScore} gols)`;
      } else if (catConfig.id === 'OVER_35_FT') {
        isWin = (hScore + aScore) >= 4;
        conditionText = `Over 3.5 Gols (Total: ${hScore + aScore} gols)`;
      } else if (catConfig.id === 'HOME_WIN') {
        isWin = hScore > aScore;
        conditionText = `Mandante Venceu (${hScore}x${aScore})`;
      }

      const outcome: 'GREEN' | 'RED' = isWin ? 'GREEN' : 'RED';
      const profitUnits = isWin ? Number((chosenOdd - 1).toFixed(2)) : -1.0;

      entries.push({
        matchId: match.id || `${match.homeTeamName}-${match.awayTeamName}-${match.matchDate}`,
        match,
        category: catConfig.id,
        categoryLabel: catConfig.shortLabel,
        matchDate: (match.matchDate || '').substring(0, 10),
        leagueName: match.leagueName || 'Liga',
        homeTeamName: match.homeTeamName || 'Mandante',
        awayTeamName: match.awayTeamName || 'Visitante',
        homeScore: hScore,
        awayScore: aScore,
        homeScoreHT: hScoreHT,
        awayScoreHT: aScoreHT,
        confidenceScore: proj.confidenceScore,
        poissonProb: proj.poissonModelProb,
        ratingTier: proj.ratingTier,
        odd: chosenOdd,
        outcome,
        profitUnits,
        conditionDescription: conditionText,
      });
    }
  }

  // Reverse chronological for displaying recent results first
  entries.sort((a, b) => b.matchDate.localeCompare(a.matchDate));

  // Compute breakdown per category
  const markets: RadarMarketSummary[] = RADAR_CATEGORIES_CONFIG.map(cat => {
    const marketEntries = entries.filter(e => e.category === cat.id);
    const totalBets = marketEntries.length;
    const totalWins = marketEntries.filter(e => e.outcome === 'GREEN').length;
    const totalLosses = marketEntries.filter(e => e.outcome === 'RED').length;
    const winRatePct = totalBets > 0 ? Number(((totalWins / totalBets) * 100).toFixed(1)) : 0;
    const avgOdd = totalBets > 0
      ? Number((marketEntries.reduce((acc, e) => acc + e.odd, 0) / totalBets).toFixed(2))
      : cat.defaultMarketOdd;
    const totalProfitUnits = Number(marketEntries.reduce((acc, e) => acc + e.profitUnits, 0).toFixed(2));
    const roiPct = totalBets > 0 ? Number(((totalProfitUnits / totalBets) * 100).toFixed(1)) : 0;

    const tiers: ('DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE')[] = ['DIAMOND', 'GOLD', 'SILVER', 'BRONZE'];
    const tierBreakdown = tiers.map(t => {
      const tEntries = marketEntries.filter(e => e.ratingTier === t);
      const tBets = tEntries.length;
      const tWins = tEntries.filter(e => e.outcome === 'GREEN').length;
      const tWinRate = tBets > 0 ? Number(((tWins / tBets) * 100).toFixed(1)) : 0;
      const tProfit = Number(tEntries.reduce((acc, e) => acc + e.profitUnits, 0).toFixed(2));
      const tRoi = tBets > 0 ? Number(((tProfit / tBets) * 100).toFixed(1)) : 0;
      return {
        tier: t,
        bets: tBets,
        wins: tWins,
        winRatePct: tWinRate,
        profitUnits: tProfit,
        roiPct: tRoi,
      };
    });

    return {
      category: cat.id,
      title: cat.title,
      shortLabel: cat.shortLabel,
      badge: cat.badge,
      color: cat.color,
      totalBets,
      totalWins,
      totalLosses,
      winRatePct,
      avgOdd,
      totalProfitUnits,
      roiPct,
      tierBreakdown,
    };
  });

  const totalSuggestionsGenerated = entries.length;
  const overallWins = entries.filter(e => e.outcome === 'GREEN').length;
  const overallLosses = entries.filter(e => e.outcome === 'RED').length;
  const overallWinRatePct = totalSuggestionsGenerated > 0
    ? Number(((overallWins / totalSuggestionsGenerated) * 100).toFixed(1))
    : 0;
  const overallProfitUnits = Number(entries.reduce((acc, e) => acc + e.profitUnits, 0).toFixed(2));
  const overallRoiPct = totalSuggestionsGenerated > 0
    ? Number(((overallProfitUnits / totalSuggestionsGenerated) * 100).toFixed(1))
    : 0;
  const avgOddOverall = totalSuggestionsGenerated > 0
    ? Number((entries.reduce((acc, e) => acc + e.odd, 0) / totalSuggestionsGenerated).toFixed(2))
    : 0;

  // Find most profitable market with at least 1 bet
  const validMarkets = markets.filter(m => m.totalBets > 0);
  const mostProfitableMarket = validMarkets.length > 0
    ? [...validMarkets].sort((a, b) => b.totalProfitUnits - a.totalProfitUnits)[0]
    : null;

  const highestWinRateMarket = validMarkets.length > 0
    ? [...validMarkets].sort((a, b) => b.winRatePct - a.winRatePct)[0]
    : null;

  return {
    totalMatchesAnalyzed: finishedMatches.length,
    totalSuggestionsGenerated,
    overallWins,
    overallLosses,
    overallWinRatePct,
    overallProfitUnits,
    overallRoiPct,
    avgOddOverall,
    markets,
    entries,
    mostProfitableMarket,
    highestWinRateMarket,
  };
}

import { DbState, Match, Team, MatchOdds } from '../types';
import { calculateMean, extractTeamMatches, poissonProbability, runFullMatchAnalysis, MatchAnalysisResult } from './analysisEngine';

// ==========================================
// TIPOS DO MÓDULO DE APOSTAS & OPORTUNIDADES
// ==========================================

export interface ValueScannerOpportunity {
  matchId: string;
  matchDate: string;
  leagueName: string;
  countryName?: string;
  homeTeamName: string;
  homeTeamLogoUrl?: string;
  awayTeamName: string;
  awayTeamLogoUrl?: string;
  market: '1X2 Mandante' | '1X2 Empate' | '1X2 Visitante' | 'Over 2.5 Gols' | 'Under 2.5 Gols' | 'Ambas Marcam Sim' | 'Over 0.5 HT' | 'Over 8.5 Cantos';
  selection: string;
  modelProbPct: number;
  fairOdd: number;
  bookmakerOdd: number;
  evPct: number;
  kellyStakePct: number; // Fração de Kelly sugerida (ex: 2.5%)
  confidenceScore: number; // 1 a 100
  reasoning: string;
}

export interface HtGoalOpportunity {
  matchId: string;
  matchDate: string;
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogoUrl?: string;
  awayTeamLogoUrl?: string;
  probOver05HtPct: number;
  probOver15HtPct: number;
  fairOddOver05Ht: number;
  homeHtScoringPct: number;
  awayHtConcedingPct: number;
  avgHtGoalsSum: number;
  earlyPressureRiskPct: number; // % de pressão nos primeiros 15 min
  recommendation: 'ALTA CONFIANÇA' | 'MODERADA' | 'EVITAR';
}

export interface CornerRadarAnalysis {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  projectedCornersHome: number;
  projectedCornersAway: number;
  totalProjectedCorners: number;
  asianCornerLine: number; // ex: 9.5 ou 10.0
  fairAsianOverOdd: number;
  fairAsianUnderOdd: number;
  probCornerOver85Pct: number;
  probCornerOver95Pct: number;
  probCornerOver105Pct: number;
  cornerAdvantageTeam: 'HOME' | 'AWAY' | 'EQUILIBRADO';
  corner1X2Prob: {
    homeWinCorners: number;
    drawCorners: number;
    awayWinCorners: number;
  };
}

export interface BttsMatrixItem {
  matchId: string;
  matchDate: string;
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogoUrl?: string;
  awayTeamLogoUrl?: string;
  bttsYesProbPct: number;
  fairOddBttsYes: number;
  fairOddBttsNo: number;
  homeScoreRegularityHome: number; // % jogos em casa que marcou
  awayScoreRegularityAway: number; // % jogos fora que marcou
  homeConcedePctHome: number;
  awayConcedePctAway: number;
  bttsScoreIndex: number; // 0..100
  trend: 'FORTE SIM' | 'MODERADO SIM' | 'TENDÊNCIA NÃO';
}

export interface TeamEfficiencyProfile {
  teamId: string;
  teamName: string;
  leagueName: string;
  logoUrl?: string;
  matchesCount: number;
  goalsScored: number;
  xgTotal: number;
  xgDiff: number; // Goals - xG
  goalsConceded: number;
  xgaTotal: number; // xG Concedido
  xgaDiff: number; // Goals Conceded - xGA
  luckIndex: number; // Positivo = Superestimado (sorte), Negativo = Subestimado (azar)
  classification: 'SUPERESTIMADO (ALERTA DE QUEDA)' | 'SUBESTIMADO (ALTO VALOR)' | 'CONSISTENTE COM xG';
  tipAdvice: string;
}

export interface DisciplinarScannerItem {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  refereeName?: string;
  projectedCardsHome: number;
  projectedCardsAway: number;
  totalProjectedCards: number;
  probOver35CardsPct: number;
  probOver45CardsPct: number;
  fairOddOver35Cards: number;
  fairOddOver45Cards: number;
  refereeStrictness: 'RIGOROSO' | 'MÉDIO' | 'PERMISSIVO' | 'DESCONHECIDO';
  recommendation: string;
}

export interface GeneratedBetTicket {
  id: string;
  type: 'CONSERVADOR' | 'VALOR_EV' | 'GOLS_E_CANTOS';
  title: string;
  description: string;
  combinedOdd: number;
  combinedProbPct: number;
  selections: {
    matchId: string;
    teams: string;
    league: string;
    market: string;
    odd: number;
    probPct: number;
  }[];
}

export interface SavedBetRecord {
  id: string;
  date: string;
  matchDescription: string;
  market: string;
  odd: number;
  stake: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID';
  profitOrLoss: number;
  notes?: string;
  evPct?: number;
}

export interface BankrollSummary {
  initialBank: number;
  currentBank: number;
  totalStaked: number;
  totalProfit: number;
  roiPct: number;
  winRatePct: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
}

// ==========================================
// CÁLCULO DE CRITÉRIO DE KELLY & EV
// ==========================================

/**
 * Calcula o critério de Kelly fracionário (Quarter Kelly = 0.25)
 * f* = (b*p - q) / b, onde b = (odd - 1), p = prob, q = 1 - p
 */
export function calculateKellyFraction(probPct: number, bookmakerOdd: number, fraction: number = 0.25): number {
  if (!bookmakerOdd || bookmakerOdd <= 1.0) return 0;
  const p = probPct / 100;
  const q = 1 - p;
  const b = bookmakerOdd - 1;
  const rawKelly = (b * p - q) / b;
  if (rawKelly <= 0) return 0;
  // Limitar stake fracionária entre 0.5% e 5.0% da banca
  const fractionalKelly = rawKelly * fraction * 100;
  return Math.min(5.0, Math.max(0.5, parseFloat(fractionalKelly.toFixed(1))));
}

// ==========================================
// 1. SCANNER GLOBAL +EV (TODAS AS PARTIDAS)
// ==========================================

export function scanAllMatchesForValue(dbState: DbState): ValueScannerOpportunity[] {
  const opportunities: ValueScannerOpportunity[] = [];

  // Filtrar partidas com odds cadastradas
  const matchesWithOdds = (dbState.matches || []).filter(m => {
    return (
      m.odds &&
      (m.odds.homeFT || m.odds.drawFT || m.odds.awayFT || m.odds.over25FT || m.odds.under25FT)
    );
  });

  for (const match of matchesWithOdds) {
    const homeTeam = dbState.teams.find(t => t.id === match.homeTeamId);
    const awayTeam = dbState.teams.find(t => t.id === match.awayTeamId);
    if (!homeTeam || !awayTeam) continue;

    const analysis = runFullMatchAnalysis(homeTeam, awayTeam, dbState, {
      sampleSize: 10,
      venueMode: 'SPECIFIC',
      activeMatch: match,
    });

    const odds = match.odds!;

    // 1X2 Mandante
    if (odds.homeFT && odds.homeFT > 1.0) {
      const prob = analysis.poisson.probHomeWin * 100;
      const fairOdd = analysis.poisson.probHomeWin > 0 ? 1 / analysis.poisson.probHomeWin : 2.0;
      const ev = ((analysis.poisson.probHomeWin * odds.homeFT) - 1) * 100;
      if (ev >= 3.0) {
        opportunities.push({
          matchId: match.id,
          matchDate: match.matchDate,
          leagueName: match.leagueName,
          countryName: match.countryName,
          homeTeamName: homeTeam.name,
          homeTeamLogoUrl: homeTeam.logoUrl,
          awayTeamName: awayTeam.name,
          awayTeamLogoUrl: awayTeam.logoUrl,
          market: '1X2 Mandante',
          selection: `Vitória ${homeTeam.name}`,
          modelProbPct: prob,
          fairOdd,
          bookmakerOdd: odds.homeFT,
          evPct: parseFloat(ev.toFixed(1)),
          kellyStakePct: calculateKellyFraction(prob, odds.homeFT),
          confidenceScore: Math.min(95, Math.round(prob * 0.8 + ev * 1.2)),
          reasoning: `Poisson projeta ${prob.toFixed(1)}% de chance (Odd Justa ${fairOdd.toFixed(2)} vs Casa ${odds.homeFT.toFixed(2)}). Mando e força ofensiva favoráveis.`,
        });
      }
    }

    // 1X2 Visitante
    if (odds.awayFT && odds.awayFT > 1.0) {
      const prob = analysis.poisson.probAwayWin * 100;
      const fairOdd = analysis.poisson.probAwayWin > 0 ? 1 / analysis.poisson.probAwayWin : 2.0;
      const ev = ((analysis.poisson.probAwayWin * odds.awayFT) - 1) * 100;
      if (ev >= 4.0) {
        opportunities.push({
          matchId: match.id,
          matchDate: match.matchDate,
          leagueName: match.leagueName,
          countryName: match.countryName,
          homeTeamName: homeTeam.name,
          homeTeamLogoUrl: homeTeam.logoUrl,
          awayTeamName: awayTeam.name,
          awayTeamLogoUrl: awayTeam.logoUrl,
          market: '1X2 Visitante',
          selection: `Vitória ${awayTeam.name}`,
          modelProbPct: prob,
          fairOdd,
          bookmakerOdd: odds.awayFT,
          evPct: parseFloat(ev.toFixed(1)),
          kellyStakePct: calculateKellyFraction(prob, odds.awayFT),
          confidenceScore: Math.min(95, Math.round(prob * 0.8 + ev * 1.2)),
          reasoning: `Odd de ${odds.awayFT.toFixed(2)} está acima da justa (${fairOdd.toFixed(2)}). Ataque visitante superior à média da liga.`,
        });
      }
    }

    // Over 2.5 Gols
    if (odds.over25FT && odds.over25FT > 1.0) {
      const prob = analysis.poisson.probOver25 * 100;
      const fairOdd = 1 / analysis.poisson.probOver25;
      const ev = ((analysis.poisson.probOver25 * odds.over25FT) - 1) * 100;
      if (ev >= 3.5) {
        opportunities.push({
          matchId: match.id,
          matchDate: match.matchDate,
          leagueName: match.leagueName,
          countryName: match.countryName,
          homeTeamName: homeTeam.name,
          homeTeamLogoUrl: homeTeam.logoUrl,
          awayTeamName: awayTeam.name,
          awayTeamLogoUrl: awayTeam.logoUrl,
          market: 'Over 2.5 Gols',
          selection: 'Mais de 2.5 Gols',
          modelProbPct: prob,
          fairOdd,
          bookmakerOdd: odds.over25FT,
          evPct: parseFloat(ev.toFixed(1)),
          kellyStakePct: calculateKellyFraction(prob, odds.over25FT),
          confidenceScore: Math.min(95, Math.round(prob * 0.75 + ev * 1.3)),
          reasoning: `Expectativa de ${analysis.projections.totalExpectedGoals.toFixed(2)} gols totais. Ambas equipes com média superior a 1.4 gols/jogo.`,
        });
      }
    }

    // Under 2.5 Gols
    if (odds.under25FT && odds.under25FT > 1.0) {
      const prob = analysis.poisson.probUnder25 * 100;
      const fairOdd = 1 / analysis.poisson.probUnder25;
      const ev = ((analysis.poisson.probUnder25 * odds.under25FT) - 1) * 100;
      if (ev >= 3.5) {
        opportunities.push({
          matchId: match.id,
          matchDate: match.matchDate,
          leagueName: match.leagueName,
          countryName: match.countryName,
          homeTeamName: homeTeam.name,
          homeTeamLogoUrl: homeTeam.logoUrl,
          awayTeamName: awayTeam.name,
          awayTeamLogoUrl: awayTeam.logoUrl,
          market: 'Under 2.5 Gols',
          selection: 'Menos de 2.5 Gols',
          modelProbPct: prob,
          fairOdd,
          bookmakerOdd: odds.under25FT,
          evPct: parseFloat(ev.toFixed(1)),
          kellyStakePct: calculateKellyFraction(prob, odds.under25FT),
          confidenceScore: Math.min(95, Math.round(prob * 0.75 + ev * 1.3)),
          reasoning: `Confronto truncado projetando ${analysis.projections.totalExpectedGoals.toFixed(2)} gols totais. Defesas consistentes.`,
        });
      }
    }
  }

  // Ordenar por maior valor esperado (+EV)
  return opportunities.sort((a, b) => b.evPct - a.evPct);
}

// ==========================================
// 2. SCANNER DE GOLS NO 1º TEMPO (HT)
// ==========================================

export function scanFirstHalfGoalOpportunities(dbState: DbState): HtGoalOpportunity[] {
  const results: HtGoalOpportunity[] = [];

  for (const match of dbState.matches) {
    const homeTeam = dbState.teams.find(t => t.id === match.homeTeamId);
    const awayTeam = dbState.teams.find(t => t.id === match.awayTeamId);
    if (!homeTeam || !awayTeam) continue;

    const homeSample = extractTeamMatches(homeTeam.id, dbState.matches, { venueOnly: 'HOME', maxCount: 10 });
    const awaySample = extractTeamMatches(awayTeam.id, dbState.matches, { venueOnly: 'AWAY', maxCount: 10 });

    if (homeSample.length < 2 || awaySample.length < 2) continue;

    // Estatísticas de 1º tempo
    const homeHtScoredCount = homeSample.filter(s => {
      const htHome = s.match.stats?.halftimeHomeScore;
      const isH = s.isHome;
      const goalsInHt = isH ? (htHome ?? 0) : (s.match.stats?.halftimeAwayScore ?? 0);
      return goalsInHt > 0;
    }).length;

    const awayHtConcededCount = awaySample.filter(s => {
      const isH = s.isHome;
      const oppHtGoals = isH ? (s.match.stats?.halftimeAwayScore ?? 0) : (s.match.stats?.halftimeHomeScore ?? 0);
      return oppHtGoals > 0;
    }).length;

    const homeHtScoringPct = (homeHtScoredCount / homeSample.length) * 100;
    const awayHtConcedingPct = (awayHtConcededCount / awaySample.length) * 100;

    // Cálculo da média de gols HT
    const homeAvgHtGoals = calculateMean(homeSample.map(s => {
      const htH = s.match.stats?.halftimeHomeScore ?? 0;
      const htA = s.match.stats?.halftimeAwayScore ?? 0;
      return htH + htA;
    })) || 1.1;

    const awayAvgHtGoals = calculateMean(awaySample.map(s => {
      const htH = s.match.stats?.halftimeHomeScore ?? 0;
      const htA = s.match.stats?.halftimeAwayScore ?? 0;
      return htH + htA;
    })) || 1.0;

    const avgHtGoalsSum = (homeAvgHtGoals + awayAvgHtGoals) / 2;

    // Probabilidade Poisson HT (Lambda HT ~ 45% do total do jogo)
    const lambdaHt = Math.max(0.65, Math.min(2.1, avgHtGoalsSum * 0.95));
    const pZeroHt = Math.exp(-lambdaHt);
    const pOneHt = pZeroHt * lambdaHt;

    const probOver05HtPct = Math.max(10, Math.min(96, (1 - pZeroHt) * 100));
    const probOver15HtPct = Math.max(5, Math.min(75, (1 - (pZeroHt + pOneHt)) * 100));
    const fairOddOver05Ht = 1 / (probOver05HtPct / 100);

    // Pressão inicial nos primeiros 15 minutos (se houver gráfico de pressão)
    let earlyPressureRiskPct = 50;
    if (match.pressureData?.intervals && match.pressureData.intervals.length > 0) {
      const firstQuarter = match.pressureData.intervals[0];
      const vol = (firstQuarter.homeAttackingVolume || 0) + (firstQuarter.awayAttackingVolume || 0);
      earlyPressureRiskPct = Math.min(95, Math.max(20, vol * 10));
    }

    let recommendation: 'ALTA CONFIANÇA' | 'MODERADA' | 'EVITAR' = 'MODERADA';
    if (probOver05HtPct >= 75 && (homeHtScoringPct >= 60 || awayHtConcedingPct >= 60)) {
      recommendation = 'ALTA CONFIANÇA';
    } else if (probOver05HtPct < 55) {
      recommendation = 'EVITAR';
    }

    results.push({
      matchId: match.id,
      matchDate: match.matchDate,
      leagueName: match.leagueName,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      homeTeamLogoUrl: homeTeam.logoUrl,
      awayTeamLogoUrl: awayTeam.logoUrl,
      probOver05HtPct: parseFloat(probOver05HtPct.toFixed(1)),
      probOver15HtPct: parseFloat(probOver15HtPct.toFixed(1)),
      fairOddOver05Ht: parseFloat(fairOddOver05Ht.toFixed(2)),
      homeHtScoringPct: parseFloat(homeHtScoringPct.toFixed(1)),
      awayHtConcedingPct: parseFloat(awayHtConcedingPct.toFixed(1)),
      avgHtGoalsSum: parseFloat(avgHtGoalsSum.toFixed(2)),
      earlyPressureRiskPct,
      recommendation,
    });
  }

  return results.sort((a, b) => b.probOver05HtPct - a.probOver05HtPct);
}

// ==========================================
// 3. RADAR DE ESCANTEIOS ASIÁTICOS
// ==========================================

export function calculateCornerRadar(analysis: MatchAnalysisResult): CornerRadarAnalysis {
  const { homeTeam, awayTeam, projections, activeMatch } = analysis;

  const homeCorners = projections.expectedCornersHome;
  const awayCorners = projections.expectedCornersAway;
  const total = homeCorners + awayCorners;

  // Determinar linha asiática justa (arredondamento para 0.5 mais próximo)
  let asianLine = Math.round(total * 2) / 2;
  if (asianLine % 1 === 0) {
    asianLine += 0.5; // Linha asiática padrão .5
  }

  // Poisson para escanteios
  const lambdaCorners = total;
  let probUnderAsian = 0;
  for (let k = 0; k < asianLine; k++) {
    probUnderAsian += poissonProbability(k, lambdaCorners);
  }
  const probOverAsian = Math.max(0.05, Math.min(0.95, 1 - probUnderAsian));
  probUnderAsian = 1 - probOverAsian;

  // Probabilidades de linhas Over 8.5, Over 9.5, Over 10.5
  let pUnder85 = 0;
  let pUnder95 = 0;
  let pUnder105 = 0;
  for (let k = 0; k <= 8; k++) pUnder85 += poissonProbability(k, lambdaCorners);
  for (let k = 0; k <= 9; k++) pUnder95 += poissonProbability(k, lambdaCorners);
  for (let k = 0; k <= 10; k++) pUnder105 += poissonProbability(k, lambdaCorners);

  // 1X2 de Escanteios (Quem terá mais cantos)
  let homeWinCorners = 0;
  let drawCorners = 0;
  let awayWinCorners = 0;
  for (let h = 0; h <= 15; h++) {
    const pH = poissonProbability(h, homeCorners);
    for (let a = 0; a <= 15; a++) {
      const pA = poissonProbability(a, awayCorners);
      const p = pH * pA;
      if (h > a) homeWinCorners += p;
      else if (h === a) drawCorners += p;
      else awayWinCorners += p;
    }
  }

  let cornerAdvantageTeam: 'HOME' | 'AWAY' | 'EQUILIBRADO' = 'EQUILIBRADO';
  if (homeWinCorners > 0.55) cornerAdvantageTeam = 'HOME';
  else if (awayWinCorners > 0.55) cornerAdvantageTeam = 'AWAY';

  return {
    matchId: activeMatch?.id || 'sim',
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    projectedCornersHome: parseFloat(homeCorners.toFixed(1)),
    projectedCornersAway: parseFloat(awayCorners.toFixed(1)),
    totalProjectedCorners: parseFloat(total.toFixed(1)),
    asianCornerLine: asianLine,
    fairAsianOverOdd: parseFloat((1 / probOverAsian).toFixed(2)),
    fairAsianUnderOdd: parseFloat((1 / probUnderAsian).toFixed(2)),
    probCornerOver85Pct: parseFloat(((1 - pUnder85) * 100).toFixed(1)),
    probCornerOver95Pct: parseFloat(((1 - pUnder95) * 100).toFixed(1)),
    probCornerOver105Pct: parseFloat(((1 - pUnder105) * 100).toFixed(1)),
    cornerAdvantageTeam,
    corner1X2Prob: {
      homeWinCorners: parseFloat((homeWinCorners * 100).toFixed(1)),
      drawCorners: parseFloat((drawCorners * 100).toFixed(1)),
      awayWinCorners: parseFloat((awayWinCorners * 100).toFixed(1)),
    },
  };
}

// ==========================================
// 4. MATRIZ AMBAS MARCAM (BTTS MATRIX)
// ==========================================

export function scanBttsMatrix(dbState: DbState): BttsMatrixItem[] {
  const results: BttsMatrixItem[] = [];

  for (const match of dbState.matches) {
    const homeTeam = dbState.teams.find(t => t.id === match.homeTeamId);
    const awayTeam = dbState.teams.find(t => t.id === match.awayTeamId);
    if (!homeTeam || !awayTeam) continue;

    const homeMatches = extractTeamMatches(homeTeam.id, dbState.matches, { venueOnly: 'HOME', maxCount: 10 });
    const awayMatches = extractTeamMatches(awayTeam.id, dbState.matches, { venueOnly: 'AWAY', maxCount: 10 });

    if (homeMatches.length < 2 || awayMatches.length < 2) continue;

    const homeScored = (homeMatches.filter(m => m.teamGoals > 0).length / homeMatches.length) * 100;
    const awayScored = (awayMatches.filter(m => m.teamGoals > 0).length / awayMatches.length) * 100;
    const homeConceded = (homeMatches.filter(m => m.oppGoals > 0).length / homeMatches.length) * 100;
    const awayConceded = (awayMatches.filter(m => m.oppGoals > 0).length / awayMatches.length) * 100;

    // Cálculo Poisson BTTS
    const analysis = runFullMatchAnalysis(homeTeam, awayTeam, dbState, {
      sampleSize: 10,
      venueMode: 'SPECIFIC',
      activeMatch: match,
    });

    const bttsYesProb = analysis.poisson.probBttsYes * 100;
    const bttsScoreIndex = Math.round((homeScored * 0.25 + awayScored * 0.25 + homeConceded * 0.25 + awayConceded * 0.25) * 0.5 + bttsYesProb * 0.5);

    let trend: 'FORTE SIM' | 'MODERADO SIM' | 'TENDÊNCIA NÃO' = 'MODERADO SIM';
    if (bttsScoreIndex >= 68 && bttsYesProb >= 60) {
      trend = 'FORTE SIM';
    } else if (bttsScoreIndex <= 42 || bttsYesProb <= 40) {
      trend = 'TENDÊNCIA NÃO';
    }

    results.push({
      matchId: match.id,
      matchDate: match.matchDate,
      leagueName: match.leagueName,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      homeTeamLogoUrl: homeTeam.logoUrl,
      awayTeamLogoUrl: awayTeam.logoUrl,
      bttsYesProbPct: parseFloat(bttsYesProb.toFixed(1)),
      fairOddBttsYes: parseFloat((1 / analysis.poisson.probBttsYes).toFixed(2)),
      fairOddBttsNo: parseFloat((1 / analysis.poisson.probBttsNo).toFixed(2)),
      homeScoreRegularityHome: parseFloat(homeScored.toFixed(0)),
      awayScoreRegularityAway: parseFloat(awayScored.toFixed(0)),
      homeConcedePctHome: parseFloat(homeConceded.toFixed(0)),
      awayConcedePctAway: parseFloat(awayConceded.toFixed(0)),
      bttsScoreIndex,
      trend,
    });
  }

  return results.sort((a, b) => b.bttsScoreIndex - a.bttsScoreIndex);
}

// ==========================================
// 5. EFICIÊNCIA DE xG (SUPER/SUBESTIMADOS)
// ==========================================

export function calculateTeamEfficiencies(dbState: DbState): TeamEfficiencyProfile[] {
  const profiles: TeamEfficiencyProfile[] = [];

  for (const team of dbState.teams) {
    const matches = extractTeamMatches(team.id, dbState.matches, { venueOnly: 'ALL', maxCount: 20 });
    if (matches.length < 3) continue;

    let goalsScored = 0;
    let goalsConceded = 0;
    let xgTotal = 0;
    let xgaTotal = 0;
    let validXgMatches = 0;

    matches.forEach(m => {
      goalsScored += m.teamGoals;
      goalsConceded += m.oppGoals;
      if (m.xgFor !== null && m.xgAgainst !== null) {
        xgTotal += m.xgFor;
        xgaTotal += m.xgAgainst;
        validXgMatches++;
      }
    });

    if (validXgMatches === 0) {
      // Usar estimativa proporcional caso xG explícito não esteja presente em todos
      xgTotal = goalsScored * 0.95;
      xgaTotal = goalsConceded * 1.05;
    }

    const xgDiff = goalsScored - xgTotal;
    const xgaDiff = xgaTotal - goalsConceded; // se tomou menos gols que xGA gerado, teve sorte defensiva

    // Luck Index: Positivo = Marcou mais e tomou menos que o xG real gerado
    const luckIndex = parseFloat((xgDiff + xgaDiff).toFixed(2));

    let classification: 'SUPERESTIMADO (ALERTA DE QUEDA)' | 'SUBESTIMADO (ALTO VALOR)' | 'CONSISTENTE COM xG' = 'CONSISTENTE COM xG';
    let tipAdvice = 'Desempenho em linha com as chances criadas. Projeções estáveis.';

    if (luckIndex >= 3.0) {
      classification = 'SUPERESTIMADO (ALERTA DE QUEDA)';
      tipAdvice = 'Marcou mais gols do que o volume ofensivo real justifica. Alto risco em odds de favorito.';
    } else if (luckIndex <= -3.0) {
      classification = 'SUBESTIMADO (ALTO VALOR)';
      tipAdvice = 'Cria muito volume (alto xG) mas tem pecado na finalização. Excelente equipe para buscar valor contra as casas.';
    }

    profiles.push({
      teamId: team.id,
      teamName: team.name,
      leagueName: team.leagueName || 'Liga Principal',
      logoUrl: team.logoUrl,
      matchesCount: matches.length,
      goalsScored,
      xgTotal: parseFloat(xgTotal.toFixed(2)),
      xgDiff: parseFloat(xgDiff.toFixed(2)),
      goalsConceded,
      xgaTotal: parseFloat(xgaTotal.toFixed(2)),
      xgaDiff: parseFloat(xgaDiff.toFixed(2)),
      luckIndex,
      classification,
      tipAdvice,
    });
  }

  return profiles.sort((a, b) => b.luckIndex - a.luckIndex);
}

// ==========================================
// 6. SCANNER DISCIPLINAR (CARTÕES & FALTAS)
// ==========================================

export function scanDisciplinarMarkets(analysis: MatchAnalysisResult): DisciplinarScannerItem {
  const { homeTeam, awayTeam, projections, refereeAnalysis, activeMatch } = analysis;

  const expH = projections.expectedCardsHome;
  const expA = projections.expectedCardsAway;
  const total = projections.totalExpectedCards;

  // Poisson para cartões
  let pUnder35 = 0;
  let pUnder45 = 0;
  for (let k = 0; k <= 3; k++) pUnder35 += poissonProbability(k, total);
  for (let k = 0; k <= 4; k++) pUnder45 += poissonProbability(k, total);

  const probOver35 = Math.max(0.05, Math.min(0.95, 1 - pUnder35));
  const probOver45 = Math.max(0.03, Math.min(0.90, 1 - pUnder45));

  let strictness: 'RIGOROSO' | 'MÉDIO' | 'PERMISSIVO' | 'DESCONHECIDO' = 'MÉDIO';
  if (refereeAnalysis && refereeAnalysis.matchesCount >= 2) {
    const avgCards = refereeAnalysis.avgTotalCardsPoints || (refereeAnalysis.avgYellowCards + refereeAnalysis.avgRedCards);
    if (avgCards >= 5.0) strictness = 'RIGOROSO';
    else if (avgCards <= 3.2) strictness = 'PERMISSIVO';
  }

  let recommendation = 'Linha de cartões em equilíbrio com a média do campeonato.';
  if (probOver35 >= 0.70 || strictness === 'RIGOROSO') {
    recommendation = 'Confronto tenso / Árbitro rigoroso. Valor favorável em Over 3.5 Cartões.';
  } else if (probOver35 <= 0.45 || strictness === 'PERMISSIVO') {
    recommendation = 'Jogo limpo e árbitro comedido. Linha Under 4.5 recomendada.';
  }

  return {
    matchId: activeMatch?.id || 'sim',
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    refereeName: activeMatch?.referee,
    projectedCardsHome: parseFloat(expH.toFixed(1)),
    projectedCardsAway: parseFloat(expA.toFixed(1)),
    totalProjectedCards: parseFloat(total.toFixed(1)),
    probOver35CardsPct: parseFloat((probOver35 * 100).toFixed(1)),
    probOver45CardsPct: parseFloat((probOver45 * 100).toFixed(1)),
    fairOddOver35Cards: parseFloat((1 / probOver35).toFixed(2)),
    fairOddOver45Cards: parseFloat((1 / probOver45).toFixed(2)),
    refereeStrictness: strictness,
    recommendation,
  };
}

// ==========================================
// 7. GERADOR AUTOMÁTICO DE BILHETES DO DIA
// ==========================================

export function generateSmartBetTickets(dbState: DbState): GeneratedBetTicket[] {
  const valueScanner = scanAllMatchesForValue(dbState);
  const htScanner = scanFirstHalfGoalOpportunities(dbState);
  const bttsScanner = scanBttsMatrix(dbState);

  const tickets: GeneratedBetTicket[] = [];

  // Ticket 1: Conservador (Odd ~1.85 a 2.30)
  const conservativeSelections: GeneratedBetTicket['selections'] = [];
  let conservativeCombinedOdd = 1.0;
  let conservativeCombinedProb = 1.0;

  // Busca 2 ou 3 seleções com probabilidade >= 72%
  const highProbOpps = valueScanner.filter(o => o.modelProbPct >= 70).slice(0, 2);
  for (const opp of highProbOpps) {
    conservativeSelections.push({
      matchId: opp.matchId,
      teams: `${opp.homeTeamName} x ${opp.awayTeamName}`,
      league: opp.leagueName,
      market: opp.selection,
      odd: opp.bookmakerOdd || opp.fairOdd,
      probPct: opp.modelProbPct,
    });
    conservativeCombinedOdd *= (opp.bookmakerOdd || opp.fairOdd);
    conservativeCombinedProb *= (opp.modelProbPct / 100);
  }

  if (conservativeSelections.length < 2) {
    const topHt = htScanner.find(h => h.probOver05HtPct >= 80);
    if (topHt) {
      conservativeSelections.push({
        matchId: topHt.matchId,
        teams: `${topHt.homeTeamName} x ${topHt.awayTeamName}`,
        league: topHt.leagueName,
        market: 'Over 0.5 Gols no 1º Tempo (HT)',
        odd: topHt.fairOddOver05Ht > 1.25 ? topHt.fairOddOver05Ht : 1.33,
        probPct: topHt.probOver05HtPct,
      });
      conservativeCombinedOdd *= 1.33;
      conservativeCombinedProb *= (topHt.probOver05HtPct / 100);
    }
  }

  if (conservativeSelections.length > 0) {
    tickets.push({
      id: 'ticket-conservative',
      type: 'CONSERVADOR',
      title: 'Bilhete Conservador (Alta Probabilidade)',
      description: 'Múltipla com seleções de maior probabilidade matemática e segurança estatística.',
      combinedOdd: parseFloat(conservativeCombinedOdd.toFixed(2)),
      combinedProbPct: parseFloat((conservativeCombinedProb * 100).toFixed(1)),
      selections: conservativeSelections,
    });
  }

  // Ticket 2: Múltipla +EV de Alto Valor (Odd ~3.00 a 5.50)
  const evSelections: GeneratedBetTicket['selections'] = [];
  let evCombinedOdd = 1.0;
  let evCombinedProb = 1.0;

  const topEvOpps = valueScanner.filter(o => o.evPct >= 5.0).slice(0, 3);
  for (const opp of topEvOpps) {
    evSelections.push({
      matchId: opp.matchId,
      teams: `${opp.homeTeamName} x ${opp.awayTeamName}`,
      league: opp.leagueName,
      market: opp.selection,
      odd: opp.bookmakerOdd || opp.fairOdd,
      probPct: opp.modelProbPct,
    });
    evCombinedOdd *= (opp.bookmakerOdd || opp.fairOdd);
    evCombinedProb *= (opp.modelProbPct / 100);
  }

  if (evSelections.length > 0) {
    tickets.push({
      id: 'ticket-ev',
      type: 'VALOR_EV',
      title: 'Múltipla +EV de Alto Valor',
      description: 'Combinação das maiores discrepâncias onde a odd da casa paga mais que o modelo.',
      combinedOdd: parseFloat(evCombinedOdd.toFixed(2)),
      combinedProbPct: parseFloat((evCombinedProb * 100).toFixed(1)),
      selections: evSelections,
    });
  }

  // Ticket 3: Bilhete Gols & Ambas Marcam
  const goalsSelections: GeneratedBetTicket['selections'] = [];
  let goalsCombinedOdd = 1.0;
  let goalsCombinedProb = 1.0;

  const topBtts = bttsScanner.find(b => b.trend === 'FORTE SIM');
  if (topBtts) {
    goalsSelections.push({
      matchId: topBtts.matchId,
      teams: `${topBtts.homeTeamName} x ${topBtts.awayTeamName}`,
      league: topBtts.leagueName,
      market: 'Ambas as Equipes Marcam (Sim)',
      odd: topBtts.fairOddBttsYes,
      probPct: topBtts.bttsYesProbPct,
    });
    goalsCombinedOdd *= topBtts.fairOddBttsYes;
    goalsCombinedProb *= (topBtts.bttsYesProbPct / 100);
  }

  const topHtGoal = htScanner.find(h => h.recommendation === 'ALTA CONFIANÇA' && h.matchId !== topBtts?.matchId);
  if (topHtGoal) {
    goalsSelections.push({
      matchId: topHtGoal.matchId,
      teams: `${topHtGoal.homeTeamName} x ${topHtGoal.awayTeamName}`,
      league: topHtGoal.leagueName,
      market: 'Over 0.5 Gols HT (1º Tempo)',
      odd: 1.36,
      probPct: topHtGoal.probOver05HtPct,
    });
    goalsCombinedOdd *= 1.36;
    goalsCombinedProb *= (topHtGoal.probOver05HtPct / 100);
  }

  if (goalsSelections.length > 0) {
    tickets.push({
      id: 'ticket-goals',
      type: 'GOLS_E_CANTOS',
      title: 'Especial Mercado de Gols (BTTS & HT)',
      description: 'Cruzamento dos jogos com maior propensão ofensiva e regularidade de gols.',
      combinedOdd: parseFloat(goalsCombinedOdd.toFixed(2)),
      combinedProbPct: parseFloat((goalsCombinedProb * 100).toFixed(1)),
      selections: goalsSelections,
    });
  }

  return tickets;
}

// ==========================================
// 8. EXPORTAÇÃO WHATSAPP & TELEGRAM
// ==========================================

export function formatMatchReportForSharing(analysis: MatchAnalysisResult): string {
  const { homeTeam, awayTeam, projections, poisson, activeMatch } = analysis;

  const dateFormatted = activeMatch?.matchDate
    ? new Date(activeMatch.matchDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : 'Em breve';

  const probH = (poisson.probHomeWin * 100).toFixed(1);
  const probX = (poisson.probDraw * 100).toFixed(1);
  const probA = (poisson.probAwayWin * 100).toFixed(1);

  const fairHomeOdd = poisson.probHomeWin > 0 ? (1 / poisson.probHomeWin).toFixed(2) : '2.00';
  const fairDrawOdd = poisson.probDraw > 0 ? (1 / poisson.probDraw).toFixed(2) : '3.00';
  const fairAwayOdd = poisson.probAwayWin > 0 ? (1 / poisson.probAwayWin).toFixed(2) : '2.00';

  const topScores = poisson.topExactScores.slice(0, 3).map(s => `${s.score} (${(s.prob * 100).toFixed(1)}%)`).join(' | ');

  const bestTip = poisson.probHomeWin >= 0.60
    ? `🏆 Sugestão: Vitória ${homeTeam.name} (Odd Justa ${fairHomeOdd})`
    : poisson.probOver25 >= 0.60
    ? `⚽ Sugestão: Mais de 2.5 Gols (Odd Justa ${(1 / poisson.probOver25).toFixed(2)})`
    : poisson.probBttsYes >= 0.60
    ? `🔥 Sugestão: Ambas Marcam Sim (Odd Justa ${(1 / poisson.probBttsYes).toFixed(2)})`
    : `🎯 Sugestão: Dupla Chance ou Mercado Alternativo`;

  return `📊 *ANÁLISE ESTATÍSTICA & PROJEÇÃO* 📊
⚽ *${homeTeam.name}* vs *${awayTeam.name}*
🏆 *Competição:* ${activeMatch?.leagueName || 'Campeonato'}
📅 *Data/Hora:* ${dateFormatted}

📈 *PROBABILIDADES POISSON (1X2):*
🟢 Mandante: *${probH}%* (Odd: ${fairHomeOdd})
🟡 Empate: *${probX}%* (Odd: ${fairDrawOdd})
🔴 Visitante: *${probA}%* (Odd: ${fairAwayOdd})

🎯 *EXPECTATIVAS DO CONFRONTO:*
⚽ Gols Esperados: *${projections.totalExpectedGoals.toFixed(2)} gols* (${projections.expectedGoalsHome.toFixed(2)} x ${projections.expectedGoalsAway.toFixed(2)})
⛳ Escanteios Projetados: *${projections.totalExpectedCorners.toFixed(1)} cantos*
🎯 Finalizações: *${projections.totalExpectedShots.toFixed(0)} chutes*
🟨 Cartões Projetados: *${projections.totalExpectedCards.toFixed(1)} pts*

🔥 *MERCADOS DE GOLS:*
Over 1.5 Gols: *${(poisson.probOver15 * 100).toFixed(1)}%*
Over 2.5 Gols: *${(poisson.probOver25 * 100).toFixed(1)}%* | Under 2.5: *${(poisson.probUnder25 * 100).toFixed(1)}%*
Ambas Marcam (BTTS): *${(poisson.probBttsYes * 100).toFixed(1)}%*

🎲 *TOP 3 PLACARES MAIS PROVÁVEIS:*
${topScores}

${bestTip}

_Gerado por FUT LFM2 Analytics Engine_ 🚀`;
}

// ==========================================
// 9. LOCAL STORAGE BET TRACKER (GESTÃO DE BANCA)
// ==========================================

const BANKROLL_STORAGE_KEY = 'fut_lfm2_bankroll_records_v1';
const BANKROLL_CONFIG_KEY = 'fut_lfm2_bankroll_config_v1';

export function loadSavedBets(): SavedBetRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BANKROLL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading saved bets', e);
    return [];
  }
}

export function saveBetRecord(bet: Omit<SavedBetRecord, 'id'>): SavedBetRecord[] {
  const current = loadSavedBets();
  const newBet: SavedBetRecord = {
    ...bet,
    id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  const updated = [newBet, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(BANKROLL_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function updateBetStatus(betId: string, status: SavedBetRecord['status']): SavedBetRecord[] {
  const current = loadSavedBets();
  const updated = current.map(b => {
    if (b.id === betId) {
      let profitOrLoss = 0;
      if (status === 'WON') {
        profitOrLoss = (b.stake * b.odd) - b.stake;
      } else if (status === 'LOST') {
        profitOrLoss = -b.stake;
      } else {
        profitOrLoss = 0;
      }
      return { ...b, status, profitOrLoss };
    }
    return b;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(BANKROLL_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function deleteSavedBet(betId: string): SavedBetRecord[] {
  const current = loadSavedBets();
  const updated = current.filter(b => b.id !== betId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(BANKROLL_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function calculateBankrollSummary(bets: SavedBetRecord[], initialBank: number = 1000): BankrollSummary {
  let totalStaked = 0;
  let totalProfit = 0;
  let wonBets = 0;
  let lostBets = 0;
  let pendingBets = 0;

  bets.forEach(b => {
    totalStaked += b.stake;
    if (b.status === 'WON') {
      wonBets++;
      totalProfit += b.profitOrLoss;
    } else if (b.status === 'LOST') {
      lostBets++;
      totalProfit += b.profitOrLoss;
    } else if (b.status === 'PENDING') {
      pendingBets++;
    }
  });

  const completedBets = wonBets + lostBets;
  const winRatePct = completedBets > 0 ? (wonBets / completedBets) * 100 : 0;
  const roiPct = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  const currentBank = initialBank + totalProfit;

  return {
    initialBank,
    currentBank: parseFloat(currentBank.toFixed(2)),
    totalStaked: parseFloat(totalStaked.toFixed(2)),
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    roiPct: parseFloat(roiPct.toFixed(1)),
    winRatePct: parseFloat(winRatePct.toFixed(1)),
    totalBets: bets.length,
    wonBets,
    lostBets,
    pendingBets,
  };
}

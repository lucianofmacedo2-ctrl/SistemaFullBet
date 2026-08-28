import { Match, MatchStats, MatchOdds, DbState, Team, League, Country } from '../types';

export interface TeamSampleMatch {
  match: Match;
  isHome: boolean;
  teamGoals: number;
  oppGoals: number;
  teamGoalsHT: number;
  oppGoalsHT: number;
  result: 'W' | 'D' | 'L'; // V, E, D
  opponentName: string;
  opponentId: string;
  opponentLogoUrl?: string;
  opponentOdd: number | null;
  matchOdd: number | null;
  
  // Posse e Cartões
  possession: number | null;
  yellowCardsFor: number | null;
  yellowCardsAgainst: number | null;
  redCardsFor: number | null;
  redCardsAgainst: number | null;
  cardPointsFor: number; // yellow * 1 + red * 2
  cardPointsAgainst: number;

  // Finalizações & Gols Esperados
  xgFor: number | null;
  xgAgainst: number | null;
  xgotFor: number | null;
  xgotAgainst: number | null;
  shotsFor: number | null;
  shotsAgainst: number | null;
  shotsOnTargetFor: number | null;
  shotsOnTargetAgainst: number | null;
  shotsOffTargetFor: number | null;
  shotsOffTargetAgainst: number | null;
  shotsBlockedFor: number | null;
  shotsBlockedAgainst: number | null;
  shotsInsideBoxFor: number | null;
  shotsInsideBoxAgainst: number | null;
  shotsOutsideBoxFor: number | null;
  shotsOutsideBoxAgainst: number | null;
  shotsWoodworkFor: number | null;
  shotsWoodworkAgainst: number | null;

  // Ataque e Criação
  bigChancesFor: number | null;
  bigChancesAgainst: number | null;
  cornersFor: number | null;
  cornersAgainst: number | null;
  touchesOppBoxFor: number | null;
  touchesOppBoxAgainst: number | null;
  throughBallsFor: number | null;
  throughBallsAgainst: number | null;
  offsidesFor: number | null;
  offsidesAgainst: number | null;
  foulsDrawnFor: number | null;
  foulsDrawnAgainst: number | null;

  // Passes e Construção
  passesAccurateFor: number | null;
  passesTotalFor: number | null;
  passesPctFor: number | null;
  passesAccurateAgainst: number | null;
  passesTotalAgainst: number | null;
  passesPctAgainst: number | null;
  longPassesAccurateFor: number | null;
  longPassesTotalFor: number | null;
  longPassesPctFor: number | null;
  longPassesAccurateAgainst: number | null;
  longPassesTotalAgainst: number | null;
  longPassesPctAgainst: number | null;
  finalThirdPassesAccurateFor: number | null;
  finalThirdPassesTotalFor: number | null;
  finalThirdPassesPctFor: number | null;
  finalThirdPassesAccurateAgainst: number | null;
  finalThirdPassesTotalAgainst: number | null;
  finalThirdPassesPctAgainst: number | null;
  crossesAccurateFor: number | null;
  crossesTotalFor: number | null;
  crossesPctFor: number | null;
  crossesAccurateAgainst: number | null;
  crossesTotalAgainst: number | null;
  crossesPctAgainst: number | null;
  xaFor: number | null;
  xaAgainst: number | null;
  throwInsFor: number | null;
  throwInsAgainst: number | null;

  // Defesa e Duelos
  foulsFor: number | null;
  foulsAgainst: number | null;
  tacklesAccurateFor: number | null;
  tacklesTotalFor: number | null;
  tacklesPctFor: number | null;
  tacklesAccurateAgainst: number | null;
  tacklesTotalAgainst: number | null;
  tacklesPctAgainst: number | null;
  duelsWonFor: number | null;
  duelsWonAgainst: number | null;
  clearancesFor: number | null;
  clearancesAgainst: number | null;
  interceptionsFor: number | null;
  interceptionsAgainst: number | null;
  errorsLeadToShotFor: number | null;
  errorsLeadToShotAgainst: number | null;
  errorsLeadToGoalFor: number | null;
  errorsLeadToGoalAgainst: number | null;
  goalkeeperDefActionFor: number | null;
  goalkeeperDefActionAgainst: number | null;

  // Goleiro
  savesFor: number | null;
  savesAgainst: number | null;
  xgotFacedFor: number | null;
  xgotFacedAgainst: number | null;
  goalsPreventedFor: number | null;
  goalsPreventedAgainst: number | null;
  goalKicksFor: number | null;
  goalKicksAgainst: number | null;

  // Market checks
  asianHandicapCovered: boolean | null;
  over25Hit: boolean;
  under25Hit: boolean;
  bttsHit: boolean;
  cleanSheet: boolean;
  failedToScore: boolean;
}

export interface DescriptiveMetric {
  name: string;
  category?: 'Geral' | 'Finalizações & xG' | 'Ataque & Criação' | 'Construção & Passes' | 'Defesa & Duelos' | 'Goleiro & Baliza' | 'Mercado';
  unit?: string;
  homeValue: number;
  homeMean: number;
  homeMedian: number;
  homeMode: number;
  homeModeFreq: number;
  homeStdDev: number;
  homeCv: number; // Coefficient of Variation %
  homeConsistency: 'Alta Regularidade' | 'Moderada' | 'Volátil / Disperso';
  awayValue: number;
  awayMean: number;
  awayMedian: number;
  awayMode: number;
  awayModeFreq: number;
  awayStdDev: number;
  awayCv: number;
  awayConsistency: 'Alta Regularidade' | 'Moderada' | 'Volátil / Disperso';
}

export interface PoissonOutcome {
  score: string; // e.g. "2 - 1"
  homeGoals: number;
  awayGoals: number;
  prob: number; // e.g. 0.1245
}

export interface SectoralPowerRankings {
  overall: number; // 0..100
  offensive: number; // 0..100
  midfield: number; // 0..100
  defensive: number; // 0..100
  goalkeeper: number; // 0..100
}

export interface AdvancedSectoralIndices {
  // Box Threat Index (Índice de Ameaça na Área)
  bti: number;
  btiLabel: string;
  // Verticalidade & Progressão
  verticalityIndex: number;
  verticalityPct: number;
  // Gols Evitados (Goleiro)
  goalsPreventedAvg: number;
  goalsPreventedTotal: number;
  savesPct: number;
  // Eficiência Finalizadora
  shotConversionRate: number; // % Gols / Finalizações
  xgOverperformance: number; // Gols - xG
  shotsInsideBoxRatio: number; // % Finalizações dentro da área
  // Solidez Defensiva & Pressão
  defensivePressureScore: number;
  tacklesSuccessPct: number;
  duelsWonAvg: number;
  errorsLeadToShotAvg: number;
  // Construção e Meio-campo
  possessionAvg: number;
  passesAccurateAvg: number;
  passesSuccessPct: number;
  finalThirdPassesAvg: number;
  finalThirdPassesSuccessPct: number;
  crossesSuccessPct: number;
}

export interface MatchAnalysisResult {
  homeTeam: Team;
  awayTeam: Team;
  country?: Country;
  league?: League;
  sampleSize: number; // 5, 10, 15, 20 or All
  venueMode: 'SPECIFIC' | 'GENERAL'; // Specific = Home in Casa, Away Fora; General = Todos jogos

  // Módulo 1: Forma Recente
  homeFormG5: TeamSampleMatch[]; // Últimos 5 geral
  homeFormE5: TeamSampleMatch[]; // Últimos 5 em casa
  awayFormG5: TeamSampleMatch[]; // Últimos 5 geral
  awayFormE5: TeamSampleMatch[]; // Últimos 5 fora

  // Amostras ativas usadas nos cálculos (conforme sampleSize e venueMode)
  homeActiveSample: TeamSampleMatch[];
  awayActiveSample: TeamSampleMatch[];

  // Módulo 2: Power Ranking Ponderado
  homePower: TeamPowerRating;
  awayPower: TeamPowerRating;

  // Power Ranking Setorial Avançado
  homeSectoralPower: SectoralPowerRankings;
  awaySectoralPower: SectoralPowerRankings;

  // Novos Índices Setoriais (BTI, Verticalidade, Gols Evitados, etc.)
  homeAdvancedIndices: AdvancedSectoralIndices;
  awayAdvancedIndices: AdvancedSectoralIndices;

  // Módulo 3: Estatísticas Descritivas
  descriptiveMetrics: DescriptiveMetric[];

  // Módulo 4: Projeções Contínuas e Poisson
  projections: ContinuousProjections;
  poisson: PoissonAnalysis;

  // Complementares
  htFtAnalysis: HtFtDifferential;
  refereeAnalysis?: RefereeCardAnalysis;
  valueBets: ValueBetOpportunity[];
  activeMatch?: Match;
}

export interface TeamPowerRating {
  teamId: string;
  teamName: string;
  pointsRatePct: number; // % Pontos ganhos
  wins: number;
  draws: number;
  losses: number;
  matchesPlayed: number;
  points: number;
  maxPoints: number;
  goalsForAvg: number;
  goalsAgainstAvg: number;
  goalDiffAvg: number;
  goalsForHTAvg: number;
  goalsAgainstHTAvg: number;
  // Dificuldade por Odds do Adversário
  opponentOddsWeightScore: number;
  // Eficiência de xG / Chutes
  xgForAvg: number;
  xgAgainstAvg: number;
  offensiveEfficiency: number; // Gols Feitos / xG (ou Finalizações)
  defensiveEfficiency: number; // Gols Sofridos / xG
  shotsVolumeAvg: number;
  shotsConcededAvg: number;
  shotsOnTargetAvg: number;
  shotsOnTargetConcededAvg: number;
  // Linhas de Mercado
  asianHandicapCoverRatePct: number;
  over25RatePct: number;
  under25RatePct: number;
  bttsRatePct: number;
  cleanSheetRatePct: number;
  failedToScoreRatePct: number;
  // Composite Power Score (0 to 100)
  compositeRating: number;
}

export interface ContinuousProjections {
  expectedGoalsHome: number; // lambda Home
  expectedGoalsAway: number; // lambda Away
  totalExpectedGoals: number;
  expectedCornersHome: number;
  expectedCornersAway: number;
  totalExpectedCorners: number;
  expectedShotsHome: number;
  expectedShotsAway: number;
  totalExpectedShots: number;
  expectedShotsOnTargetHome: number;
  expectedShotsOnTargetAway: number;
  totalExpectedShotsOnTarget: number;
  expectedCardsHome: number;
  expectedCardsAway: number;
  totalExpectedCards: number;
  // League Baselines
  leagueAvgGoalsHome: number;
  leagueAvgGoalsAway: number;
  leagueAvgCornersHome: number;
  leagueAvgCornersAway: number;
}

export interface PoissonAnalysis {
  matrix: number[][]; // [homeGoals 0..5][awayGoals 0..5]
  probHomeWin: number;
  probDraw: number;
  probAwayWin: number;
  probOver05: number;
  probOver15: number;
  probOver25: number;
  probOver35: number;
  probUnder25: number;
  probBttsYes: number;
  probBttsNo: number;
  topExactScores: PoissonOutcome[];
}

export interface HtFtDifferential {
  homeScoredHTPct: number;
  homeScored2HPct: number;
  homeComeQuietoTendency: 'Forte Crescimento 2ºT' | 'Equilibrado' | 'Queda de Ritmo no 2ºT';
  awayScoredHTPct: number;
  awayScored2HPct: number;
  awayComeQuietoTendency: 'Forte Crescimento 2ºT' | 'Equilibrado' | 'Queda de Ritmo no 2ºT';
  homeGoalsHTAvg: number;
  homeGoals2HAvg: number;
  awayGoalsHTAvg: number;
  awayGoals2HAvg: number;
}

export interface RefereeCardAnalysis {
  refereeName: string;
  matchesCount: number;
  avgYellowCards: number;
  avgRedCards: number;
  avgTotalCardsPoints: number;
  combinedExpectation: number;
}

export interface ValueBetOpportunity {
  market: string;
  selection: string;
  modelProbPct: number;
  fairOdd: number;
  bookmakerOdd?: number | null;
  evPct?: number | null; // Expected Value %
  hasValue: boolean;
  status: 'VALOR' | 'JUSTA' | 'SEM_VALOR' | 'SEM_ODD';
}

// ----------------- MATH UTILS -----------------

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function calculateMode(values: number[]): { mode: number; frequency: number } {
  if (values.length === 0) return { mode: 0, frequency: 0 };
  const counts: Record<number, number> = {};
  let maxFreq = 0;
  let modeVal = values[0];

  for (const v of values) {
    // Round to 1 decimal for continuous numbers
    const rounded = Math.round(v * 10) / 10;
    counts[rounded] = (counts[rounded] || 0) + 1;
    if (counts[rounded] > maxFreq) {
      maxFreq = counts[rounded];
      modeVal = rounded;
    }
  }

  return { mode: modeVal, frequency: maxFreq };
}

export function calculateStandardDeviation(values: number[], mean?: number): number {
  if (values.length <= 1) return 0;
  const m = mean ?? calculateMean(values);
  const variance = values.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function calculateCV(stdDev: number, mean: number): number {
  if (mean === 0) return 0;
  return (stdDev / Math.abs(mean)) * 100;
}

export function getConsistencyLabel(cv: number): 'Alta Regularidade' | 'Moderada' | 'Volátil / Disperso' {
  if (cv < 28) return 'Alta Regularidade';
  if (cv <= 50) return 'Moderada';
  return 'Volátil / Disperso';
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export function poissonProbability(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// ----------------- DATA EXTRACTOR -----------------

export function extractTeamMatches(
  teamId: string,
  matches: Match[],
  options?: {
    venueOnly?: 'HOME' | 'AWAY' | 'ALL';
    maxCount?: number;
    leagueId?: string;
    teams?: Team[];
  }
): TeamSampleMatch[] {
  // Defensive check if arguments passed in reversed order
  let safeTeamId = typeof teamId === 'string' ? teamId : '';
  let safeMatches = Array.isArray(matches) ? matches : [];
  if (Array.isArray(teamId) && typeof matches === 'string') {
    safeMatches = teamId as unknown as Match[];
    safeTeamId = matches;
  }
  if (!Array.isArray(safeMatches) || safeMatches.length === 0) {
    return [];
  }

  const venue = options?.venueOnly || 'ALL';
  const leagueId = options?.leagueId;
  const targetTeam = options?.teams?.find(t => t.id === safeTeamId);
  const targetTeamName = (targetTeam?.name || '').toLowerCase().trim();

  // Filter completed matches sorted chronologically descending (newest first)
  const finished = safeMatches
    .filter(m => {
      if (!m) return false;
      // Must have scores or be marked finished
      const hasScores = m.homeScore !== null && m.homeScore !== undefined && m.awayScore !== null && m.awayScore !== undefined;
      const statusUpper = String(m.status || '').toUpperCase();
      const isFinishedStatus = statusUpper === 'FINALIZADO' || statusUpper === 'FT' || statusUpper === 'ENCERRADO';

      if (!hasScores && !isFinishedStatus) return false;
      if (m.homeScore === null || m.awayScore === null) return false;
      if (leagueId && m.leagueId && m.leagueId !== leagueId) return false;

      const normHome = (m.homeTeamName || '').toLowerCase().trim();
      const normAway = (m.awayTeamName || '').toLowerCase().trim();

      const isHome = m.homeTeamId === safeTeamId || (targetTeamName !== '' && normHome === targetTeamName);
      const isAway = m.awayTeamId === safeTeamId || (targetTeamName !== '' && normAway === targetTeamName);

      if (venue === 'HOME') return isHome;
      if (venue === 'AWAY') return isAway;
      return isHome || isAway;
    })
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

  const sliced = options?.maxCount ? finished.slice(0, options.maxCount) : finished;

  return sliced.map(m => {
    const normHome = (m.homeTeamName || '').toLowerCase().trim();
    const isHome = m.homeTeamId === safeTeamId || (targetTeamName !== '' && normHome === targetTeamName);
    const teamGoals = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
    const oppGoals = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);

    const teamGoalsHT = isHome ? (m.stats?.halftimeHomeScore ?? 0) : (m.stats?.halftimeAwayScore ?? 0);
    const oppGoalsHT = isHome ? (m.stats?.halftimeAwayScore ?? 0) : (m.stats?.halftimeHomeScore ?? 0);

    let result: 'W' | 'D' | 'L' = 'D';
    if (teamGoals > oppGoals) result = 'W';
    else if (teamGoals === oppGoals) result = 'D';
    else result = 'L';

    const opponentName = isHome ? m.awayTeamName : m.homeTeamName;
    const opponentId = isHome ? m.awayTeamId : m.homeTeamId;
    const opponentLogoUrl =
      (isHome ? m.awayTeamLogoUrl : m.homeTeamLogoUrl) ||
      options?.teams?.find(t => t.id === opponentId || (opponentName && t.name.toLowerCase().trim() === opponentName.toLowerCase().trim()))?.logoUrl;

    const opponentOdd = isHome ? (m.odds?.awayFT ?? null) : (m.odds?.homeFT ?? null);
    const matchOdd = isHome ? (m.odds?.homeFT ?? null) : (m.odds?.awayFT ?? null);

    const possession = isHome ? (m.stats?.possessionHomeFT ?? null) : (m.stats?.possessionAwayFT ?? null);

    const xgFor = isHome ? (m.stats?.xgHomeFT ?? null) : (m.stats?.xgAwayFT ?? null);
    const xgAgainst = isHome ? (m.stats?.xgAwayFT ?? null) : (m.stats?.xgHomeFT ?? null);
    const xgotFor = isHome ? (m.stats?.xgotHomeFT ?? null) : (m.stats?.xgotAwayFT ?? null);
    const xgotAgainst = isHome ? (m.stats?.xgotAwayFT ?? null) : (m.stats?.xgotHomeFT ?? null);

    const shotsFor = isHome ? (m.stats?.shotsHomeFT ?? null) : (m.stats?.shotsAwayFT ?? null);
    const shotsAgainst = isHome ? (m.stats?.shotsAwayFT ?? null) : (m.stats?.shotsHomeFT ?? null);
    const shotsOnTargetFor = isHome ? (m.stats?.shotsOnTargetHomeFT ?? null) : (m.stats?.shotsOnTargetAwayFT ?? null);
    const shotsOnTargetAgainst = isHome ? (m.stats?.shotsOnTargetAwayFT ?? null) : (m.stats?.shotsOnTargetHomeFT ?? null);
    const shotsOffTargetFor = isHome ? (m.stats?.shotsOffTargetHomeFT ?? null) : (m.stats?.shotsOffTargetAwayFT ?? null);
    const shotsOffTargetAgainst = isHome ? (m.stats?.shotsOffTargetAwayFT ?? null) : (m.stats?.shotsOffTargetHomeFT ?? null);
    const shotsBlockedFor = isHome ? (m.stats?.shotsBlockedHomeFT ?? null) : (m.stats?.shotsBlockedAwayFT ?? null);
    const shotsBlockedAgainst = isHome ? (m.stats?.shotsBlockedAwayFT ?? null) : (m.stats?.shotsBlockedHomeFT ?? null);
    const shotsInsideBoxFor = isHome ? (m.stats?.shotsInsideBoxHomeFT ?? null) : (m.stats?.shotsInsideBoxAwayFT ?? null);
    const shotsInsideBoxAgainst = isHome ? (m.stats?.shotsInsideBoxAwayFT ?? null) : (m.stats?.shotsInsideBoxHomeFT ?? null);
    const shotsOutsideBoxFor = isHome ? (m.stats?.shotsOutsideBoxHomeFT ?? null) : (m.stats?.shotsOutsideBoxAwayFT ?? null);
    const shotsOutsideBoxAgainst = isHome ? (m.stats?.shotsOutsideBoxAwayFT ?? null) : (m.stats?.shotsOutsideBoxHomeFT ?? null);
    const shotsWoodworkFor = isHome ? (m.stats?.shotsWoodworkHomeFT ?? null) : (m.stats?.shotsWoodworkAwayFT ?? null);
    const shotsWoodworkAgainst = isHome ? (m.stats?.shotsWoodworkAwayFT ?? null) : (m.stats?.shotsWoodworkHomeFT ?? null);

    const bigChancesFor = isHome ? (m.stats?.bigChancesHomeFT ?? null) : (m.stats?.bigChancesAwayFT ?? null);
    const bigChancesAgainst = isHome ? (m.stats?.bigChancesAwayFT ?? null) : (m.stats?.bigChancesHomeFT ?? null);
    const cornersFor = isHome ? (m.stats?.cornersHomeFT ?? null) : (m.stats?.cornersAwayFT ?? null);
    const cornersAgainst = isHome ? (m.stats?.cornersAwayFT ?? null) : (m.stats?.cornersHomeFT ?? null);
    const touchesOppBoxFor = isHome ? (m.stats?.touchesOppBoxHomeFT ?? null) : (m.stats?.touchesOppBoxAwayFT ?? null);
    const touchesOppBoxAgainst = isHome ? (m.stats?.touchesOppBoxAwayFT ?? null) : (m.stats?.touchesOppBoxHomeFT ?? null);
    const throughBallsFor = isHome ? (m.stats?.throughBallsHomeFT ?? null) : (m.stats?.throughBallsAwayFT ?? null);
    const throughBallsAgainst = isHome ? (m.stats?.throughBallsAwayFT ?? null) : (m.stats?.throughBallsHomeFT ?? null);
    const offsidesFor = isHome ? (m.stats?.offsidesHomeFT ?? null) : (m.stats?.offsidesAwayFT ?? null);
    const offsidesAgainst = isHome ? (m.stats?.offsidesAwayFT ?? null) : (m.stats?.offsidesHomeFT ?? null);
    const foulsDrawnFor = isHome ? (m.stats?.foulsDrawnHomeFT ?? null) : (m.stats?.foulsDrawnAwayFT ?? null);
    const foulsDrawnAgainst = isHome ? (m.stats?.foulsDrawnAwayFT ?? null) : (m.stats?.foulsDrawnHomeFT ?? null);

    const passesAccurateFor = isHome ? (m.stats?.passesAccurateHomeFT ?? null) : (m.stats?.passesAccurateAwayFT ?? null);
    const passesTotalFor = isHome ? (m.stats?.passesTotalHomeFT ?? null) : (m.stats?.passesTotalAwayFT ?? null);
    const passesPctFor = isHome ? (m.stats?.passesPctHomeFT ?? null) : (m.stats?.passesPctAwayFT ?? null);
    const passesAccurateAgainst = isHome ? (m.stats?.passesAccurateAwayFT ?? null) : (m.stats?.passesAccurateHomeFT ?? null);
    const passesTotalAgainst = isHome ? (m.stats?.passesTotalAwayFT ?? null) : (m.stats?.passesTotalHomeFT ?? null);
    const passesPctAgainst = isHome ? (m.stats?.passesPctAwayFT ?? null) : (m.stats?.passesPctHomeFT ?? null);

    const longPassesAccurateFor = isHome ? (m.stats?.longPassesAccurateHomeFT ?? null) : (m.stats?.longPassesAccurateAwayFT ?? null);
    const longPassesTotalFor = isHome ? (m.stats?.longPassesTotalHomeFT ?? null) : (m.stats?.longPassesTotalAwayFT ?? null);
    const longPassesPctFor = isHome ? (m.stats?.longPassesPctHomeFT ?? null) : (m.stats?.longPassesPctAwayFT ?? null);
    const longPassesAccurateAgainst = isHome ? (m.stats?.longPassesAccurateAwayFT ?? null) : (m.stats?.longPassesAccurateHomeFT ?? null);
    const longPassesTotalAgainst = isHome ? (m.stats?.longPassesTotalAwayFT ?? null) : (m.stats?.longPassesTotalHomeFT ?? null);
    const longPassesPctAgainst = isHome ? (m.stats?.longPassesPctAwayFT ?? null) : (m.stats?.longPassesPctHomeFT ?? null);

    const finalThirdPassesAccurateFor = isHome ? (m.stats?.finalThirdPassesAccurateHomeFT ?? null) : (m.stats?.finalThirdPassesAccurateAwayFT ?? null);
    const finalThirdPassesTotalFor = isHome ? (m.stats?.finalThirdPassesTotalHomeFT ?? null) : (m.stats?.finalThirdPassesTotalAwayFT ?? null);
    const finalThirdPassesPctFor = isHome ? (m.stats?.finalThirdPassesPctHomeFT ?? null) : (m.stats?.finalThirdPassesPctAwayFT ?? null);
    const finalThirdPassesAccurateAgainst = isHome ? (m.stats?.finalThirdPassesAccurateAwayFT ?? null) : (m.stats?.finalThirdPassesAccurateHomeFT ?? null);
    const finalThirdPassesTotalAgainst = isHome ? (m.stats?.finalThirdPassesTotalAwayFT ?? null) : (m.stats?.finalThirdPassesTotalHomeFT ?? null);
    const finalThirdPassesPctAgainst = isHome ? (m.stats?.finalThirdPassesPctAwayFT ?? null) : (m.stats?.finalThirdPassesPctHomeFT ?? null);

    const crossesAccurateFor = isHome ? (m.stats?.crossesAccurateHomeFT ?? null) : (m.stats?.crossesAccurateAwayFT ?? null);
    const crossesTotalFor = isHome ? (m.stats?.crossesTotalHomeFT ?? null) : (m.stats?.crossesTotalAwayFT ?? null);
    const crossesPctFor = isHome ? (m.stats?.crossesPctHomeFT ?? null) : (m.stats?.crossesPctAwayFT ?? null);
    const crossesAccurateAgainst = isHome ? (m.stats?.crossesAccurateAwayFT ?? null) : (m.stats?.crossesAccurateHomeFT ?? null);
    const crossesTotalAgainst = isHome ? (m.stats?.crossesTotalAwayFT ?? null) : (m.stats?.crossesTotalHomeFT ?? null);
    const crossesPctAgainst = isHome ? (m.stats?.crossesPctAwayFT ?? null) : (m.stats?.crossesPctHomeFT ?? null);

    const xaFor = isHome ? (m.stats?.xaHomeFT ?? null) : (m.stats?.xaAwayFT ?? null);
    const xaAgainst = isHome ? (m.stats?.xaAwayFT ?? null) : (m.stats?.xaHomeFT ?? null);
    const throwInsFor = isHome ? (m.stats?.throwInsHomeFT ?? null) : (m.stats?.throwInsAwayFT ?? null);
    const throwInsAgainst = isHome ? (m.stats?.throwInsAwayFT ?? null) : (m.stats?.throwInsHomeFT ?? null);

    const foulsFor = isHome ? (m.stats?.foulsHomeFT ?? null) : (m.stats?.foulsAwayFT ?? null);
    const foulsAgainst = isHome ? (m.stats?.foulsAwayFT ?? null) : (m.stats?.foulsHomeFT ?? null);
    const tacklesAccurateFor = isHome ? (m.stats?.tacklesAccurateHomeFT ?? null) : (m.stats?.tacklesAccurateAwayFT ?? null);
    const tacklesTotalFor = isHome ? (m.stats?.tacklesTotalHomeFT ?? null) : (m.stats?.tacklesTotalAwayFT ?? null);
    const tacklesPctFor = isHome ? (m.stats?.tacklesPctHomeFT ?? null) : (m.stats?.tacklesPctAwayFT ?? null);
    const tacklesAccurateAgainst = isHome ? (m.stats?.tacklesAccurateAwayFT ?? null) : (m.stats?.tacklesAccurateHomeFT ?? null);
    const tacklesTotalAgainst = isHome ? (m.stats?.tacklesTotalAwayFT ?? null) : (m.stats?.tacklesTotalHomeFT ?? null);
    const tacklesPctAgainst = isHome ? (m.stats?.tacklesPctAwayFT ?? null) : (m.stats?.tacklesPctHomeFT ?? null);

    const duelsWonFor = isHome ? (m.stats?.duelsWonHomeFT ?? null) : (m.stats?.duelsWonAwayFT ?? null);
    const duelsWonAgainst = isHome ? (m.stats?.duelsWonAwayFT ?? null) : (m.stats?.duelsWonHomeFT ?? null);
    const clearancesFor = isHome ? (m.stats?.clearancesHomeFT ?? null) : (m.stats?.clearancesAwayFT ?? null);
    const clearancesAgainst = isHome ? (m.stats?.clearancesAwayFT ?? null) : (m.stats?.clearancesHomeFT ?? null);
    const interceptionsFor = isHome ? (m.stats?.interceptionsHomeFT ?? null) : (m.stats?.interceptionsAwayFT ?? null);
    const interceptionsAgainst = isHome ? (m.stats?.interceptionsAwayFT ?? null) : (m.stats?.interceptionsHomeFT ?? null);
    const errorsLeadToShotFor = isHome ? (m.stats?.errorsLeadToShotHomeFT ?? null) : (m.stats?.errorsLeadToShotAwayFT ?? null);
    const errorsLeadToShotAgainst = isHome ? (m.stats?.errorsLeadToShotAwayFT ?? null) : (m.stats?.errorsLeadToShotHomeFT ?? null);
    const errorsLeadToGoalFor = isHome ? (m.stats?.errorsLeadToGoalHomeFT ?? null) : (m.stats?.errorsLeadToGoalAwayFT ?? null);
    const errorsLeadToGoalAgainst = isHome ? (m.stats?.errorsLeadToGoalAwayFT ?? null) : (m.stats?.errorsLeadToGoalHomeFT ?? null);
    const goalkeeperDefActionFor = isHome ? (m.stats?.goalkeeperDefActionHomeFT ?? null) : (m.stats?.goalkeeperDefActionAwayFT ?? null);
    const goalkeeperDefActionAgainst = isHome ? (m.stats?.goalkeeperDefActionAwayFT ?? null) : (m.stats?.goalkeeperDefActionHomeFT ?? null);

    const savesFor = isHome ? (m.stats?.savesHomeFT ?? null) : (m.stats?.savesAwayFT ?? null);
    const savesAgainst = isHome ? (m.stats?.savesAwayFT ?? null) : (m.stats?.savesHomeFT ?? null);
    const xgotFacedFor = isHome ? (m.stats?.xgotFacedHomeFT ?? null) : (m.stats?.xgotFacedAwayFT ?? null);
    const xgotFacedAgainst = isHome ? (m.stats?.xgotFacedAwayFT ?? null) : (m.stats?.xgotFacedHomeFT ?? null);
    const goalsPreventedFor = isHome ? (m.stats?.goalsPreventedHomeFT ?? null) : (m.stats?.goalsPreventedAwayFT ?? null);
    const goalsPreventedAgainst = isHome ? (m.stats?.goalsPreventedAwayFT ?? null) : (m.stats?.goalsPreventedHomeFT ?? null);
    const goalKicksFor = isHome ? (m.stats?.goalKicksHomeFT ?? null) : (m.stats?.goalKicksAwayFT ?? null);
    const goalKicksAgainst = isHome ? (m.stats?.goalKicksAwayFT ?? null) : (m.stats?.goalKicksHomeFT ?? null);

    const yellowCardsFor = isHome ? (m.stats?.yellowCardsHomeFT ?? null) : (m.stats?.yellowCardsAwayFT ?? null);
    const yellowCardsAgainst = isHome ? (m.stats?.yellowCardsAwayFT ?? null) : (m.stats?.yellowCardsHomeFT ?? null);
    const redCardsFor = isHome ? (m.stats?.redCardsHomeFT ?? null) : (m.stats?.redCardsAwayFT ?? null);
    const redCardsAgainst = isHome ? (m.stats?.redCardsAwayFT ?? null) : (m.stats?.redCardsHomeFT ?? null);

    const cardPointsFor = (yellowCardsFor ?? 0) * 1 + (redCardsFor ?? 0) * 2;
    const cardPointsAgainst = (yellowCardsAgainst ?? 0) * 1 + (redCardsAgainst ?? 0) * 2;

    // Asian Handicap evaluation
    let asianHandicapCovered: boolean | null = null;
    const haLine = isHome ? m.odds?.asianHandicapHomeLine : m.odds?.asianHandicapAwayLine;
    if (typeof haLine === 'number') {
      const adjustedGoalDiff = (teamGoals - oppGoals) + haLine;
      if (adjustedGoalDiff > 0.05) asianHandicapCovered = true;
      else if (adjustedGoalDiff < -0.05) asianHandicapCovered = false;
      else asianHandicapCovered = null; // Push / tie
    }

    const totalMatchGoals = teamGoals + oppGoals;
    const over25Hit = totalMatchGoals > 2.5;
    const under25Hit = totalMatchGoals < 2.5;
    const bttsHit = teamGoals > 0 && oppGoals > 0;
    const cleanSheet = oppGoals === 0;
    const failedToScore = teamGoals === 0;

    return {
      match: m,
      isHome,
      teamGoals,
      oppGoals,
      teamGoalsHT,
      oppGoalsHT,
      result,
      opponentName,
      opponentId,
      opponentLogoUrl,
      opponentOdd,
      matchOdd,

      possession,
      yellowCardsFor,
      yellowCardsAgainst,
      redCardsFor,
      redCardsAgainst,
      cardPointsFor,
      cardPointsAgainst,

      xgFor,
      xgAgainst,
      xgotFor,
      xgotAgainst,
      shotsFor,
      shotsAgainst,
      shotsOnTargetFor,
      shotsOnTargetAgainst,
      shotsOffTargetFor,
      shotsOffTargetAgainst,
      shotsBlockedFor,
      shotsBlockedAgainst,
      shotsInsideBoxFor,
      shotsInsideBoxAgainst,
      shotsOutsideBoxFor,
      shotsOutsideBoxAgainst,
      shotsWoodworkFor,
      shotsWoodworkAgainst,

      bigChancesFor,
      bigChancesAgainst,
      cornersFor,
      cornersAgainst,
      touchesOppBoxFor,
      touchesOppBoxAgainst,
      throughBallsFor,
      throughBallsAgainst,
      offsidesFor,
      offsidesAgainst,
      foulsDrawnFor,
      foulsDrawnAgainst,

      passesAccurateFor,
      passesTotalFor,
      passesPctFor,
      passesAccurateAgainst,
      passesTotalAgainst,
      passesPctAgainst,
      longPassesAccurateFor,
      longPassesTotalFor,
      longPassesPctFor,
      longPassesAccurateAgainst,
      longPassesTotalAgainst,
      longPassesPctAgainst,
      finalThirdPassesAccurateFor,
      finalThirdPassesTotalFor,
      finalThirdPassesPctFor,
      finalThirdPassesAccurateAgainst,
      finalThirdPassesTotalAgainst,
      finalThirdPassesPctAgainst,
      crossesAccurateFor,
      crossesTotalFor,
      crossesPctFor,
      crossesAccurateAgainst,
      crossesTotalAgainst,
      crossesPctAgainst,
      xaFor,
      xaAgainst,
      throwInsFor,
      throwInsAgainst,

      foulsFor,
      foulsAgainst,
      tacklesAccurateFor,
      tacklesTotalFor,
      tacklesPctFor,
      tacklesAccurateAgainst,
      tacklesTotalAgainst,
      tacklesPctAgainst,
      duelsWonFor,
      duelsWonAgainst,
      clearancesFor,
      clearancesAgainst,
      interceptionsFor,
      interceptionsAgainst,
      errorsLeadToShotFor,
      errorsLeadToShotAgainst,
      errorsLeadToGoalFor,
      errorsLeadToGoalAgainst,
      goalkeeperDefActionFor,
      goalkeeperDefActionAgainst,

      savesFor,
      savesAgainst,
      xgotFacedFor,
      xgotFacedAgainst,
      goalsPreventedFor,
      goalsPreventedAgainst,
      goalKicksFor,
      goalKicksAgainst,

      asianHandicapCovered,
      over25Hit,
      under25Hit,
      bttsHit,
      cleanSheet,
      failedToScore,
    };
  });
}

// ----------------- SECTORAL POWER RANKINGS & ADVANCED INDICES -----------------

export function calculateSectoralPowerRankings(
  team: Team,
  sampleMatches: TeamSampleMatch[]
): SectoralPowerRankings {
  if (sampleMatches.length === 0) {
    return { overall: 50, offensive: 50, midfield: 50, defensive: 50, goalkeeper: 50 };
  }

  const count = sampleMatches.length;
  let totalGF = 0, totalGA = 0, totalXG = 0, totalXGA = 0;
  let totalShots = 0, totalSOT = 0, totalShotsInsideBox = 0, totalBigChances = 0;
  let totalPossession = 0, totalPassesAccurate = 0, totalFinalThirdAccurate = 0;
  let totalTackles = 0, totalInterceptions = 0, totalDuelsWon = 0, totalErrors = 0;
  let totalSaves = 0, totalGoalsPrevented = 0;

  for (const sm of sampleMatches) {
    totalGF += sm.teamGoals;
    totalGA += sm.oppGoals;
    totalXG += sm.xgFor ?? sm.teamGoals;
    totalXGA += sm.xgAgainst ?? sm.oppGoals;
    totalShots += sm.shotsFor ?? 0;
    totalSOT += sm.shotsOnTargetFor ?? 0;
    totalShotsInsideBox += sm.shotsInsideBoxFor ?? (sm.shotsFor ? Math.round(sm.shotsFor * 0.6) : 0);
    totalBigChances += sm.bigChancesFor ?? 0;
    totalPossession += sm.possession ?? 50;
    totalPassesAccurate += sm.passesAccurateFor ?? 350;
    totalFinalThirdAccurate += sm.finalThirdPassesAccurateFor ?? 50;
    totalTackles += sm.tacklesAccurateFor ?? 12;
    totalInterceptions += sm.interceptionsFor ?? 8;
    totalDuelsWon += sm.duelsWonFor ?? 45;
    totalErrors += (sm.errorsLeadToShotFor ?? 0) + (sm.errorsLeadToGoalFor ?? 0) * 2;
    totalSaves += sm.savesFor ?? 3;
    totalGoalsPrevented += sm.goalsPreventedFor ?? Math.max(-2, Math.min(2, (sm.xgotFacedFor ?? sm.oppGoals) - sm.oppGoals));
  }

  const avgGF = totalGF / count;
  const avgGA = totalGA / count;
  const avgXG = totalXG / count;
  const avgXGA = totalXGA / count;
  const avgShotsInsideBox = totalShotsInsideBox / count;
  const avgBigChances = totalBigChances / count;
  const avgSOT = totalSOT / count;
  const avgPossession = totalPossession / count;
  const avgPasses = totalPassesAccurate / count;
  const avgFinalThird = totalFinalThirdAccurate / count;
  const avgTackles = totalTackles / count;
  const avgDuels = totalDuelsWon / count;
  const avgErrors = totalErrors / count;
  const avgSaves = totalSaves / count;
  const avgGoalsPrevented = totalGoalsPrevented / count;

  // Offensive Score (0-100)
  const offScore = Math.min(99, Math.max(1, Math.round(
    (avgGF / 2.5) * 35 +
    (avgXG / 2.2) * 25 +
    (avgSOT / 6.5) * 15 +
    (avgShotsInsideBox / 8.0) * 15 +
    (avgBigChances / 3.0) * 10
  )));

  // Midfield & Construction Score (0-100)
  const midScore = Math.min(99, Math.max(1, Math.round(
    (avgPossession / 65) * 35 +
    (avgPasses / 480) * 35 +
    (avgFinalThird / 75) * 30
  )));

  // Defensive Score (0-100)
  const gaScore = Math.max(0, 100 - (avgGA / 2.5) * 65);
  const xgaScore = Math.max(0, 100 - (avgXGA / 2.2) * 55);
  const defActionsScore = Math.min(100, ((avgTackles + avgDuels * 0.4) / 35) * 60 + Math.max(0, 40 - avgErrors * 15));
  const defScore = Math.min(99, Math.max(1, Math.round(
    gaScore * 0.45 + xgaScore * 0.35 + defActionsScore * 0.20
  )));

  // Goalkeeper Score (0-100)
  const saveRateScore = Math.min(100, Math.max(0, (avgSaves / 5.0) * 50 + 25));
  const gpScore = Math.min(100, Math.max(0, 50 + avgGoalsPrevented * 40));
  const gkScore = Math.min(99, Math.max(1, Math.round(
    gpScore * 0.60 + saveRateScore * 0.40
  )));

  // Overall Composite
  const overall = Math.min(99, Math.max(1, Math.round(
    offScore * 0.32 +
    defScore * 0.32 +
    midScore * 0.22 +
    gkScore * 0.14
  )));

  return {
    overall,
    offensive: offScore,
    midfield: midScore,
    defensive: defScore,
    goalkeeper: gkScore,
  };
}

export function calculateAdvancedSectoralIndices(
  sampleMatches: TeamSampleMatch[]
): AdvancedSectoralIndices {
  if (sampleMatches.length === 0) {
    return {
      bti: 0,
      btiLabel: 'Baixa Ameaça',
      verticalityIndex: 0,
      verticalityPct: 0,
      goalsPreventedAvg: 0,
      goalsPreventedTotal: 0,
      savesPct: 70,
      shotConversionRate: 0,
      xgOverperformance: 0,
      shotsInsideBoxRatio: 0,
      defensivePressureScore: 50,
      tacklesSuccessPct: 0,
      duelsWonAvg: 0,
      errorsLeadToShotAvg: 0,
      possessionAvg: 50,
      passesAccurateAvg: 0,
      passesSuccessPct: 0,
      finalThirdPassesAvg: 0,
      finalThirdPassesSuccessPct: 0,
      crossesSuccessPct: 0,
    };
  }

  const count = sampleMatches.length;
  let totalGF = 0, totalXG = 0, totalShots = 0, totalShotsInsideBox = 0, totalBigChances = 0, totalTouchesOppBox = 0;
  let totalPoss = 0, totalPassesAcc = 0, totalPassesTot = 0, totalFinalThirdAcc = 0, totalFinalThirdTot = 0;
  let totalThroughBalls = 0, totalLongPassesAcc = 0, totalCrossesAcc = 0, totalCrossesTot = 0;
  let totalTacklesAcc = 0, totalTacklesTot = 0, totalDuelsWon = 0, totalInterceptions = 0;
  let totalErrors = 0, totalSaves = 0, totalSOTConceded = 0, totalGoalsPrevented = 0;

  for (const sm of sampleMatches) {
    totalGF += sm.teamGoals;
    totalXG += sm.xgFor ?? sm.teamGoals;
    totalShots += sm.shotsFor ?? 0;
    totalShotsInsideBox += sm.shotsInsideBoxFor ?? (sm.shotsFor ? Math.round(sm.shotsFor * 0.6) : 0);
    totalBigChances += sm.bigChancesFor ?? 0;
    totalTouchesOppBox += sm.touchesOppBoxFor ?? (sm.shotsInsideBoxFor ? sm.shotsInsideBoxFor * 2.5 : 15);

    totalPoss += sm.possession ?? 50;
    totalPassesAcc += sm.passesAccurateFor ?? 350;
    totalPassesTot += sm.passesTotalFor ?? (sm.passesAccurateFor ? Math.round(sm.passesAccurateFor / 0.82) : 420);
    totalFinalThirdAcc += sm.finalThirdPassesAccurateFor ?? 55;
    totalFinalThirdTot += sm.finalThirdPassesTotalFor ?? 75;
    totalThroughBalls += sm.throughBallsFor ?? 2;
    totalLongPassesAcc += sm.longPassesAccurateFor ?? 25;
    totalCrossesAcc += sm.crossesAccurateFor ?? 4;
    totalCrossesTot += sm.crossesTotalFor ?? 18;

    totalTacklesAcc += sm.tacklesAccurateFor ?? 12;
    totalTacklesTot += sm.tacklesTotalFor ?? 18;
    totalDuelsWon += sm.duelsWonFor ?? 45;
    totalInterceptions += sm.interceptionsFor ?? 9;
    totalErrors += sm.errorsLeadToShotFor ?? 0;

    totalSaves += sm.savesFor ?? 3;
    totalSOTConceded += sm.shotsOnTargetAgainst ?? (sm.savesFor ? sm.savesFor + sm.oppGoals : 4);
    totalGoalsPrevented += sm.goalsPreventedFor ?? Math.max(-2, Math.min(2, (sm.xgotFacedFor ?? sm.oppGoals) - sm.oppGoals));
  }

  const avgGF = totalGF / count;
  const avgXG = totalXG / count;
  const avgShots = totalShots / count;
  const avgShotsInsideBox = totalShotsInsideBox / count;
  const avgBigChances = totalBigChances / count;
  const avgTouchesOppBox = totalTouchesOppBox / count;

  // 1. Box Threat Index (BTI): (TouchesOppBox * 0.45) + (ShotsInsideBox * 1.5) + (BigChances * 3.0)
  const bti = Math.round(((avgTouchesOppBox * 0.45) + (avgShotsInsideBox * 1.5) + (avgBigChances * 3.0)) * 10) / 10;
  const btiLabel = bti >= 28 ? 'Ameaça Extrema (Elite)' : bti >= 20 ? 'Alta Ameaça' : bti >= 13 ? 'Média Ameaça' : 'Baixa Ameaça';

  // 2. Verticalidade & Progressão
  const avgPassesTot = totalPassesTot / count;
  const avgFinalThird = totalFinalThirdAcc / count;
  const avgThrough = totalThroughBalls / count;
  const verticalityPct = avgPassesTot > 0 ? Math.round(((avgFinalThird + avgThrough * 2) / avgPassesTot) * 1000) / 10 : 15;
  const verticalityIndex = Math.round((avgFinalThird * 0.6 + avgThrough * 3 + (totalLongPassesAcc / count) * 0.3) * 10) / 10;

  // 3. Gols Evitados & Defesas
  const goalsPreventedAvg = Math.round((totalGoalsPrevented / count) * 100) / 100;
  const goalsPreventedTotal = Math.round(totalGoalsPrevented * 10) / 10;
  const savesPct = totalSOTConceded > 0 ? Math.round((totalSaves / totalSOTConceded) * 1000) / 10 : 72.0;

  // 4. Eficiência Finalizadora
  const shotConversionRate = avgShots > 0 ? Math.round((avgGF / avgShots) * 1000) / 10 : 0;
  const xgOverperformance = Math.round((avgGF - avgXG) * 100) / 100;
  const shotsInsideBoxRatio = avgShots > 0 ? Math.round((avgShotsInsideBox / avgShots) * 1000) / 10 : 60.0;

  // 5. Solidez & Pressão Defensiva
  const tacklesSuccessPct = totalTacklesTot > 0 ? Math.round((totalTacklesAcc / totalTacklesTot) * 1000) / 10 : 65.0;
  const duelsWonAvg = Math.round((totalDuelsWon / count) * 10) / 10;
  const errorsLeadToShotAvg = Math.round((totalErrors / count) * 100) / 100;
  const defPressureScore = Math.min(99, Math.max(1, Math.round(
    ((totalTacklesAcc / count) / 18) * 35 +
    ((totalInterceptions / count) / 12) * 35 +
    ((totalDuelsWon / count) / 55) * 30
  )));

  // 6. Construção
  const possessionAvg = Math.round((totalPoss / count) * 10) / 10;
  const passesAccurateAvg = Math.round((totalPassesAcc / count) * 10) / 10;
  const passesSuccessPct = totalPassesTot > 0 ? Math.round((totalPassesAcc / totalPassesTot) * 1000) / 10 : 82.0;
  const finalThirdPassesAvg = Math.round(avgFinalThird * 10) / 10;
  const finalThirdPassesSuccessPct = totalFinalThirdTot > 0 ? Math.round((totalFinalThirdAcc / totalFinalThirdTot) * 1000) / 10 : 74.0;
  const crossesSuccessPct = totalCrossesTot > 0 ? Math.round((totalCrossesAcc / totalCrossesTot) * 1000) / 10 : 25.0;

  return {
    bti,
    btiLabel,
    verticalityIndex,
    verticalityPct,
    goalsPreventedAvg,
    goalsPreventedTotal,
    savesPct,
    shotConversionRate,
    xgOverperformance,
    shotsInsideBoxRatio,
    defensivePressureScore: defPressureScore,
    tacklesSuccessPct,
    duelsWonAvg,
    errorsLeadToShotAvg,
    possessionAvg,
    passesAccurateAvg,
    passesSuccessPct,
    finalThirdPassesAvg,
    finalThirdPassesSuccessPct,
    crossesSuccessPct,
  };
}

// ----------------- POWER RATING ENGINE -----------------

export function calculateTeamPowerRating(
  team: Team,
  sampleMatches: TeamSampleMatch[]
): TeamPowerRating {
  const count = sampleMatches.length;
  if (count === 0) {
    return {
      teamId: team.id,
      teamName: team.name,
      pointsRatePct: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      matchesPlayed: 0,
      points: 0,
      maxPoints: 0,
      goalsForAvg: 0,
      goalsAgainstAvg: 0,
      goalDiffAvg: 0,
      goalsForHTAvg: 0,
      goalsAgainstHTAvg: 0,
      opponentOddsWeightScore: 0,
      xgForAvg: 0,
      xgAgainstAvg: 0,
      offensiveEfficiency: 1.0,
      defensiveEfficiency: 1.0,
      shotsVolumeAvg: 0,
      shotsConcededAvg: 0,
      shotsOnTargetAvg: 0,
      shotsOnTargetConcededAvg: 0,
      asianHandicapCoverRatePct: 0,
      over25RatePct: 0,
      under25RatePct: 0,
      bttsRatePct: 0,
      cleanSheetRatePct: 0,
      failedToScoreRatePct: 0,
      compositeRating: 50,
    };
  }

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let points = 0;
  let totalGF = 0;
  let totalGA = 0;
  let totalGFHT = 0;
  let totalGAHT = 0;
  let totalWeightedOppOdd = 0;
  let weightedOppOddCount = 0;

  let totalXGFor = 0;
  let totalXGAgainst = 0;
  let xgMatchCount = 0;

  let totalShotsFor = 0;
  let totalShotsAgainst = 0;
  let totalShotsOnTargetFor = 0;
  let totalShotsOnTargetAgainst = 0;
  let shotsMatchCount = 0;

  let haCoverCount = 0;
  let haValidCount = 0;
  let over25Count = 0;
  let under25Count = 0;
  let bttsCount = 0;
  let cleanSheetCount = 0;
  let failedToScoreCount = 0;

  for (const sm of sampleMatches) {
    if (sm.result === 'W') {
      wins++;
      points += 3;
    } else if (sm.result === 'D') {
      draws++;
      points += 1;
    } else {
      losses++;
    }

    totalGF += sm.teamGoals;
    totalGA += sm.oppGoals;
    totalGFHT += sm.teamGoalsHT;
    totalGAHT += sm.oppGoalsHT;

    // Weight by opponent odds: R * OpponentOdd (R=1 for W, 0.5 for D, 0 for L)
    // Default baseline opponent odd is 2.5 if missing
    const oppOdd = sm.opponentOdd && sm.opponentOdd > 1.0 ? sm.opponentOdd : 2.5;
    const r = sm.result === 'W' ? 1.0 : sm.result === 'D' ? 0.5 : 0.0;
    totalWeightedOppOdd += r * oppOdd;
    weightedOppOddCount++;

    if (sm.xgFor !== null && sm.xgAgainst !== null) {
      totalXGFor += sm.xgFor;
      totalXGAgainst += sm.xgAgainst;
      xgMatchCount++;
    }

    if (sm.shotsFor !== null) {
      totalShotsFor += sm.shotsFor;
      totalShotsAgainst += sm.shotsAgainst ?? 0;
      totalShotsOnTargetFor += sm.shotsOnTargetFor ?? 0;
      totalShotsOnTargetAgainst += sm.shotsOnTargetAgainst ?? 0;
      shotsMatchCount++;
    }

    if (sm.asianHandicapCovered !== null) {
      haValidCount++;
      if (sm.asianHandicapCovered === true) haCoverCount++;
    }

    if (sm.over25Hit) over25Count++;
    if (sm.under25Hit) under25Count++;
    if (sm.bttsHit) bttsCount++;
    if (sm.cleanSheet) cleanSheetCount++;
    if (sm.failedToScore) failedToScoreCount++;
  }

  const maxPoints = count * 3;
  const pointsRatePct = maxPoints > 0 ? (points / maxPoints) * 100 : 0;
  const goalsForAvg = totalGF / count;
  const goalsAgainstAvg = totalGA / count;
  const goalDiffAvg = goalsForAvg - goalsAgainstAvg;
  const goalsForHTAvg = totalGFHT / count;
  const goalsAgainstHTAvg = totalGAHT / count;

  const opponentOddsWeightScore = weightedOppOddCount > 0 ? totalWeightedOppOdd / weightedOppOddCount : 0;

  const xgForAvg = xgMatchCount > 0 ? totalXGFor / xgMatchCount : goalsForAvg;
  const xgAgainstAvg = xgMatchCount > 0 ? totalXGAgainst / xgMatchCount : goalsAgainstAvg;

  // Offensive efficiency: Goals Scored / xG (or default 1.0)
  const offensiveEfficiency = xgForAvg > 0 ? goalsForAvg / xgForAvg : 1.0;
  // Defensive efficiency: Goals Conceded / xG Conceded (lower is better defense, but ratio >= 1 means conceding more than xG)
  const defensiveEfficiency = xgAgainstAvg > 0 ? goalsAgainstAvg / xgAgainstAvg : 1.0;

  const shotsVolumeAvg = shotsMatchCount > 0 ? totalShotsFor / shotsMatchCount : 0;
  const shotsConcededAvg = shotsMatchCount > 0 ? totalShotsAgainst / shotsMatchCount : 0;
  const shotsOnTargetAvg = shotsMatchCount > 0 ? totalShotsOnTargetFor / shotsMatchCount : 0;
  const shotsOnTargetConcededAvg = shotsMatchCount > 0 ? totalShotsOnTargetAgainst / shotsMatchCount : 0;

  const asianHandicapCoverRatePct = haValidCount > 0 ? (haCoverCount / haValidCount) * 100 : pointsRatePct;
  const over25RatePct = (over25Count / count) * 100;
  const under25RatePct = (under25Count / count) * 100;
  const bttsRatePct = (bttsCount / count) * 100;
  const cleanSheetRatePct = (cleanSheetCount / count) * 100;
  const failedToScoreRatePct = (failedToScoreCount / count) * 100;

  // Composite Rating Calculation (0 - 100 score)
  // Components: Points Rate (40%), Goal Diff normalized (25%), Opponent Weight (15%), HA Cover Rate (10%), xG Efficiency (10%)
  const normPoints = pointsRatePct; // 0..100
  const normGoalDiff = Math.max(0, Math.min(100, 50 + goalDiffAvg * 20)); // -2.5 -> 0, 0 -> 50, +2.5 -> 100
  const normOppWeight = Math.max(0, Math.min(100, (opponentOddsWeightScore / 3.5) * 100));
  const normHaCover = asianHandicapCoverRatePct;
  const normXgEff = Math.max(0, Math.min(100, 50 + (offensiveEfficiency - 1.0) * 30 - (defensiveEfficiency - 1.0) * 30));

  const compositeRating = Math.round(
    normPoints * 0.40 +
    normGoalDiff * 0.25 +
    normOppWeight * 0.15 +
    normHaCover * 0.10 +
    normXgEff * 0.10
  );

  return {
    teamId: team.id,
    teamName: team.name,
    pointsRatePct,
    wins,
    draws,
    losses,
    matchesPlayed: count,
    points,
    maxPoints,
    goalsForAvg,
    goalsAgainstAvg,
    goalDiffAvg,
    goalsForHTAvg,
    goalsAgainstHTAvg,
    opponentOddsWeightScore,
    xgForAvg,
    xgAgainstAvg,
    offensiveEfficiency,
    defensiveEfficiency,
    shotsVolumeAvg,
    shotsConcededAvg,
    shotsOnTargetAvg,
    shotsOnTargetConcededAvg,
    asianHandicapCoverRatePct,
    over25RatePct,
    under25RatePct,
    bttsRatePct,
    cleanSheetRatePct,
    failedToScoreRatePct,
    compositeRating: Math.max(1, Math.min(99, compositeRating)),
  };
}

// ----------------- LEAGUE AVERAGES -----------------

export function calculateLeagueBaselines(leagueMatches: Match[]): {
  avgGoalsHome: number;
  avgGoalsAway: number;
  avgCornersHome: number;
  avgCornersAway: number;
  avgShotsHome: number;
  avgShotsAway: number;
  avgShotsOnTargetHome: number;
  avgShotsOnTargetAway: number;
  avgCardsHome: number;
  avgCardsAway: number;
} {
  const safeLeagueMatches = Array.isArray(leagueMatches) ? leagueMatches : [];
  const completed = safeLeagueMatches.filter(m => m && m.status === 'FINALIZADO' && m.homeScore !== null && m.awayScore !== null);
  const count = completed.length;

  if (count === 0) {
    // Default international averages
    return {
      avgGoalsHome: 1.45,
      avgGoalsAway: 1.15,
      avgCornersHome: 5.5,
      avgCornersAway: 4.5,
      avgShotsHome: 12.5,
      avgShotsAway: 10.0,
      avgShotsOnTargetHome: 4.8,
      avgShotsOnTargetAway: 3.8,
      avgCardsHome: 2.1,
      avgCardsAway: 2.4,
    };
  }

  let gHome = 0, gAway = 0;
  let cHome = 0, cAway = 0, cCount = 0;
  let sHome = 0, sAway = 0, sCount = 0;
  let stHome = 0, stAway = 0, stCount = 0;
  let cardHome = 0, cardAway = 0, cardCount = 0;

  for (const m of completed) {
    gHome += m.homeScore ?? 0;
    gAway += m.awayScore ?? 0;

    if (m.stats?.cornersHomeFT !== null && m.stats?.cornersAwayFT !== null && m.stats?.cornersHomeFT !== undefined) {
      cHome += m.stats.cornersHomeFT;
      cAway += m.stats.cornersAwayFT ?? 0;
      cCount++;
    }

    if (m.stats?.shotsHomeFT !== null && m.stats?.shotsAwayFT !== null && m.stats?.shotsHomeFT !== undefined) {
      sHome += m.stats.shotsHomeFT;
      sAway += m.stats.shotsAwayFT ?? 0;
      sCount++;
    }

    if (m.stats?.shotsOnTargetHomeFT !== null && m.stats?.shotsOnTargetAwayFT !== null && m.stats?.shotsOnTargetHomeFT !== undefined) {
      stHome += m.stats.shotsOnTargetHomeFT;
      stAway += m.stats.shotsOnTargetAwayFT ?? 0;
      stCount++;
    }

    if (m.stats?.yellowCardsHomeFT !== null && m.stats?.yellowCardsAwayFT !== null && m.stats?.yellowCardsHomeFT !== undefined) {
      const hPts = (m.stats.yellowCardsHomeFT ?? 0) * 1 + (m.stats.redCardsHomeFT ?? 0) * 2;
      const aPts = (m.stats.yellowCardsAwayFT ?? 0) * 1 + (m.stats.redCardsAwayFT ?? 0) * 2;
      cardHome += hPts;
      cardAway += aPts;
      cardCount++;
    }
  }

  return {
    avgGoalsHome: Math.max(0.8, gHome / count),
    avgGoalsAway: Math.max(0.6, gAway / count),
    avgCornersHome: cCount > 0 ? cHome / cCount : 5.4,
    avgCornersAway: cCount > 0 ? cAway / cCount : 4.4,
    avgShotsHome: sCount > 0 ? sHome / sCount : 12.5,
    avgShotsAway: sCount > 0 ? sAway / sCount : 10.2,
    avgShotsOnTargetHome: stCount > 0 ? stHome / stCount : 4.8,
    avgShotsOnTargetAway: stCount > 0 ? stAway / stCount : 3.8,
    avgCardsHome: cardCount > 0 ? cardHome / cardCount : 2.1,
    avgCardsAway: cardCount > 0 ? cardAway / cardCount : 2.4,
  };
}

// ----------------- DESCRIPTIVE METRICS BUILDER -----------------

function buildDescriptiveMetric(
  name: string,
  unit: string,
  homeValues: number[],
  awayValues: number[],
  category: DescriptiveMetric['category'] = 'Geral'
): DescriptiveMetric {
  const hMean = calculateMean(homeValues);
  const hMedian = calculateMedian(homeValues);
  const hModeData = calculateMode(homeValues);
  const hStdDev = calculateStandardDeviation(homeValues, hMean);
  const hCv = calculateCV(hStdDev, hMean);
  const hConsistency = getConsistencyLabel(hCv);

  const aMean = calculateMean(awayValues);
  const aMedian = calculateMedian(awayValues);
  const aModeData = calculateMode(awayValues);
  const aStdDev = calculateStandardDeviation(awayValues, aMean);
  const aCv = calculateCV(aStdDev, aMean);
  const aConsistency = getConsistencyLabel(aCv);

  return {
    name,
    category,
    unit,
    homeValue: hMean,
    homeMean: hMean,
    homeMedian: hMedian,
    homeMode: hModeData.mode,
    homeModeFreq: hModeData.frequency,
    homeStdDev: hStdDev,
    homeCv: hCv,
    homeConsistency: hConsistency,
    awayValue: aMean,
    awayMean: aMean,
    awayMedian: aMedian,
    awayMode: aModeData.mode,
    awayModeFreq: aModeData.frequency,
    awayStdDev: aStdDev,
    awayCv: aCv,
    awayConsistency: aConsistency,
  };
}

// ----------------- MAIN ANALYSIS PIPELINE -----------------

export function runFullMatchAnalysis(
  homeTeam: Team,
  awayTeam: Team,
  dbState: DbState,
  options?: {
    sampleSize?: number; // 5, 10, 15, 20 or 999 for all
    venueMode?: 'SPECIFIC' | 'GENERAL'; // Specific: Home in Casa, Away Fora; General: All matches
    activeMatch?: Match | null;
  }
): MatchAnalysisResult {
  const sampleSize = options?.sampleSize || 10;
  const venueMode = options?.venueMode || 'SPECIFIC';

  const country = dbState.countries.find(c => c.id === homeTeam.countryId);
  const league = dbState.leagues.find(l => l.id === homeTeam.leagueId || homeTeam.leagueIds?.includes(l.id));

  // Extract Form Trackers (G5 & E5 for both teams)
  const homeFormG5 = extractTeamMatches(homeTeam.id, dbState.matches, { venueOnly: 'ALL', maxCount: 5, teams: dbState.teams });
  const homeFormE5 = extractTeamMatches(homeTeam.id, dbState.matches, { venueOnly: 'HOME', maxCount: 5, teams: dbState.teams });
  const awayFormG5 = extractTeamMatches(awayTeam.id, dbState.matches, { venueOnly: 'ALL', maxCount: 5, teams: dbState.teams });
  const awayFormE5 = extractTeamMatches(awayTeam.id, dbState.matches, { venueOnly: 'AWAY', maxCount: 5, teams: dbState.teams });

  // Extract Active Samples according to configuration
  const homeActiveSample = extractTeamMatches(homeTeam.id, dbState.matches, {
    venueOnly: venueMode === 'SPECIFIC' ? 'HOME' : 'ALL',
    maxCount: sampleSize >= 999 ? undefined : sampleSize,
    teams: dbState.teams,
  });

  const awayActiveSample = extractTeamMatches(awayTeam.id, dbState.matches, {
    venueOnly: venueMode === 'SPECIFIC' ? 'AWAY' : 'ALL',
    maxCount: sampleSize >= 999 ? undefined : sampleSize,
    teams: dbState.teams,
  });

  // Calculate Power Ratings
  const homePower = calculateTeamPowerRating(homeTeam, homeActiveSample);
  const awayPower = calculateTeamPowerRating(awayTeam, awayActiveSample);

  // Calculate Advanced Sectoral Power Rankings & Specific Indices
  const homeSectoralPower = calculateSectoralPowerRankings(homeTeam, homeActiveSample);
  const awaySectoralPower = calculateSectoralPowerRankings(awayTeam, awayActiveSample);

  const homeAdvancedIndices = calculateAdvancedSectoralIndices(homeActiveSample);
  const awayAdvancedIndices = calculateAdvancedSectoralIndices(awayActiveSample);

  // League Baselines
  const allDbMatches = Array.isArray(dbState.matches) ? dbState.matches : [];
  const leagueMatches = league ? allDbMatches.filter(m => m.leagueId === league.id) : allDbMatches;
  const baselines = calculateLeagueBaselines(leagueMatches);

  const homeSampleCount = homeActiveSample.length;
  const awaySampleCount = awayActiveSample.length;
  // Prior weight (pseudo-matches) to smooth small sample sizes towards league baseline
  const PRIOR_MATCHES = 5;

  const baseGoalsHome = baselines.avgGoalsHome > 0 ? baselines.avgGoalsHome : 1.45;
  const baseGoalsAway = baselines.avgGoalsAway > 0 ? baselines.avgGoalsAway : 1.15;

  // Continuous Projections (Attack x Defense Model with Empirical Bayes Shrinkage)
  // Raw ratios
  const rawHomeAtt = (homePower.goalsForAvg > 0 ? homePower.goalsForAvg : baseGoalsHome) / baseGoalsHome;
  const rawAwayDef = (awayPower.goalsAgainstAvg > 0 ? awayPower.goalsAgainstAvg : baseGoalsHome) / baseGoalsHome;

  const rawAwayAtt = (awayPower.goalsForAvg > 0 ? awayPower.goalsForAvg : baseGoalsAway) / baseGoalsAway;
  const rawHomeDef = (homePower.goalsAgainstAvg > 0 ? homePower.goalsAgainstAvg : baseGoalsAway) / baseGoalsAway;

  // Regressed ratios (Shrinkage to 1.0 based on sample size)
  const homeAttRating = (rawHomeAtt * homeSampleCount + 1.0 * PRIOR_MATCHES) / (homeSampleCount + PRIOR_MATCHES);
  const awayDefRating = (rawAwayDef * awaySampleCount + 1.0 * PRIOR_MATCHES) / (awaySampleCount + PRIOR_MATCHES);

  const awayAttRating = (rawAwayAtt * awaySampleCount + 1.0 * PRIOR_MATCHES) / (awaySampleCount + PRIOR_MATCHES);
  const homeDefRating = (rawHomeDef * homeSampleCount + 1.0 * PRIOR_MATCHES) / (homeSampleCount + PRIOR_MATCHES);

  // Model formula with power dampening (exponent 0.72) to prevent quadratic divergence
  let lambdaHome = baseGoalsHome * Math.pow(homeAttRating, 0.72) * Math.pow(awayDefRating, 0.72);
  let lambdaAway = baseGoalsAway * Math.pow(awayAttRating, 0.72) * Math.pow(homeDefRating, 0.72);

  // Realistic football boundaries for single-team expected goals
  lambdaHome = Math.max(0.40, Math.min(3.40, lambdaHome));
  lambdaAway = Math.max(0.30, Math.min(3.10, lambdaAway));

  // Corners Projections with Shrinkage & Dampening
  const baseCornersHome = baselines.avgCornersHome > 0 ? baselines.avgCornersHome : 5.4;
  const baseCornersAway = baselines.avgCornersAway > 0 ? baselines.avgCornersAway : 4.4;

  const rawHomeCornerAtt = (calculateMean(homeActiveSample.map(s => s.cornersFor ?? baseCornersHome)) || baseCornersHome) / baseCornersHome;
  const rawAwayCornerDef = (calculateMean(awayActiveSample.map(s => s.cornersAgainst ?? baseCornersHome)) || baseCornersHome) / baseCornersHome;

  const homeCornerAtt = (rawHomeCornerAtt * homeSampleCount + 1.0 * PRIOR_MATCHES) / (homeSampleCount + PRIOR_MATCHES);
  const awayCornerDef = (rawAwayCornerDef * awaySampleCount + 1.0 * PRIOR_MATCHES) / (awaySampleCount + PRIOR_MATCHES);

  let expCornersHome = baseCornersHome * Math.pow(homeCornerAtt, 0.70) * Math.pow(awayCornerDef, 0.70);
  expCornersHome = Math.max(2.5, Math.min(8.8, expCornersHome));

  const rawAwayCornerAtt = (calculateMean(awayActiveSample.map(s => s.cornersFor ?? baseCornersAway)) || baseCornersAway) / baseCornersAway;
  const rawHomeCornerDef = (calculateMean(homeActiveSample.map(s => s.cornersAgainst ?? baseCornersAway)) || baseCornersAway) / baseCornersAway;

  const awayCornerAtt = (rawAwayCornerAtt * awaySampleCount + 1.0 * PRIOR_MATCHES) / (awaySampleCount + PRIOR_MATCHES);
  const homeCornerDef = (rawHomeCornerDef * homeSampleCount + 1.0 * PRIOR_MATCHES) / (homeSampleCount + PRIOR_MATCHES);

  let expCornersAway = baseCornersAway * Math.pow(awayCornerAtt, 0.70) * Math.pow(homeCornerDef, 0.70);
  expCornersAway = Math.max(2.0, Math.min(7.8, expCornersAway));

  // Shots Projections
  const baseShotsHome = baselines.avgShotsHome > 0 ? baselines.avgShotsHome : 12.5;
  const baseShotsAway = baselines.avgShotsAway > 0 ? baselines.avgShotsAway : 10.2;
  const hShotsFor = (homePower.shotsVolumeAvg * homeSampleCount + baseShotsHome * PRIOR_MATCHES) / (homeSampleCount + PRIOR_MATCHES);
  const aShotsAgainst = (awayPower.shotsConcededAvg * awaySampleCount + baseShotsHome * PRIOR_MATCHES) / (awaySampleCount + PRIOR_MATCHES);
  const expShotsHome = Math.max(7.0, Math.min(21.0, hShotsFor * 0.55 + aShotsAgainst * 0.45));

  const aShotsFor = (awayPower.shotsVolumeAvg * awaySampleCount + baseShotsAway * PRIOR_MATCHES) / (awaySampleCount + PRIOR_MATCHES);
  const hShotsAgainst = (homePower.shotsConcededAvg * homeSampleCount + baseShotsAway * PRIOR_MATCHES) / (homeSampleCount + PRIOR_MATCHES);
  const expShotsAway = Math.max(5.5, Math.min(18.0, aShotsFor * 0.55 + hShotsAgainst * 0.45));

  // Shots on Target
  const baseSTHome = baselines.avgShotsOnTargetHome > 0 ? baselines.avgShotsOnTargetHome : 4.8;
  const baseSTAway = baselines.avgShotsOnTargetAway > 0 ? baselines.avgShotsOnTargetAway : 3.8;
  const hSTFor = (homePower.shotsOnTargetAvg * homeSampleCount + baseSTHome * PRIOR_MATCHES) / (homeSampleCount + PRIOR_MATCHES);
  const aSTAgainst = (awayPower.shotsOnTargetConcededAvg * awaySampleCount + baseSTHome * PRIOR_MATCHES) / (awaySampleCount + PRIOR_MATCHES);
  const expShotsOnTargetHome = Math.max(2.0, Math.min(8.5, hSTFor * 0.55 + aSTAgainst * 0.45));

  const aSTFor = (awayPower.shotsOnTargetAvg * awaySampleCount + baseSTAway * PRIOR_MATCHES) / (awaySampleCount + PRIOR_MATCHES);
  const hSTAgainst = (homePower.shotsOnTargetConcededAvg * homeSampleCount + baseSTAway * PRIOR_MATCHES) / (homeSampleCount + PRIOR_MATCHES);
  const expShotsOnTargetAway = Math.max(1.6, Math.min(7.5, aSTFor * 0.55 + hSTAgainst * 0.45));

  // Cards Projections
  const baseCardsHome = baselines.avgCardsHome > 0 ? baselines.avgCardsHome : 2.1;
  const baseCardsAway = baselines.avgCardsAway > 0 ? baselines.avgCardsAway : 2.4;
  const rawHCard = calculateMean(homeActiveSample.map(s => s.cardPointsFor || baseCardsHome)) || baseCardsHome;
  const rawACard = calculateMean(awayActiveSample.map(s => s.cardPointsFor || baseCardsAway)) || baseCardsAway;
  const expCardsHome = Math.max(1.0, Math.min(4.8, (rawHCard * homeSampleCount + baseCardsHome * PRIOR_MATCHES) / (homeSampleCount + PRIOR_MATCHES)));
  const expCardsAway = Math.max(1.0, Math.min(5.2, (rawACard * awaySampleCount + baseCardsAway * PRIOR_MATCHES) / (awaySampleCount + PRIOR_MATCHES)));

  const projections: ContinuousProjections = {
    expectedGoalsHome: lambdaHome,
    expectedGoalsAway: lambdaAway,
    totalExpectedGoals: lambdaHome + lambdaAway,
    expectedCornersHome: expCornersHome,
    expectedCornersAway: expCornersAway,
    totalExpectedCorners: expCornersHome + expCornersAway,
    expectedShotsHome: expShotsHome,
    expectedShotsAway: expShotsAway,
    totalExpectedShots: expShotsHome + expShotsAway,
    expectedShotsOnTargetHome: expShotsOnTargetHome,
    expectedShotsOnTargetAway: expShotsOnTargetAway,
    totalExpectedShotsOnTarget: expShotsOnTargetHome + expShotsOnTargetAway,
    expectedCardsHome: expCardsHome,
    expectedCardsAway: expCardsAway,
    totalExpectedCards: expCardsHome + expCardsAway,
    leagueAvgGoalsHome: baseGoalsHome,
    leagueAvgGoalsAway: baseGoalsAway,
    leagueAvgCornersHome: baseCornersHome,
    leagueAvgCornersAway: baseCornersAway,
  };

  // Exact Analytical Poisson Probabilities for Over / Under & BTTS
  const lambdaTotal = lambdaHome + lambdaAway;
  const pTotal0 = Math.exp(-lambdaTotal);
  const pTotal1 = pTotal0 * lambdaTotal;
  const pTotal2 = (pTotal1 * lambdaTotal) / 2;
  const pTotal3 = (pTotal2 * lambdaTotal) / 3;

  const probOver05 = Math.max(0.01, Math.min(0.99, 1 - pTotal0));
  const probOver15 = Math.max(0.01, Math.min(0.99, 1 - (pTotal0 + pTotal1)));
  const probOver25 = Math.max(0.01, Math.min(0.99, 1 - (pTotal0 + pTotal1 + pTotal2)));
  const probUnder25 = Math.max(0.01, Math.min(0.99, 1 - probOver25));
  const probOver35 = Math.max(0.01, Math.min(0.99, 1 - (pTotal0 + pTotal1 + pTotal2 + pTotal3)));

  // Exact BTTS Formula: P(Home >= 1) * P(Away >= 1) = (1 - e^-lambdaHome) * (1 - e^-lambdaAway)
  const pHomeZero = Math.exp(-lambdaHome);
  const pAwayZero = Math.exp(-lambdaAway);
  const probBttsYes = Math.max(0.01, Math.min(0.99, (1 - pHomeZero) * (1 - pAwayZero)));
  const probBttsNo = Math.max(0.01, Math.min(0.99, 1 - probBttsYes));

  // Poisson Distribution Matrix (0..5 x 0..5) & 1X2 Probabilities (computed up to 8 goals)
  const matrix: number[][] = [];
  let probHomeWin = 0;
  let probDraw = 0;
  let probAwayWin = 0;
  const exactScores: PoissonOutcome[] = [];

  for (let i = 0; i <= 8; i++) {
    const pHome = poissonProbability(i, lambdaHome);
    for (let j = 0; j <= 8; j++) {
      const pAway = poissonProbability(j, lambdaAway);
      const pExact = pHome * pAway;

      if (i <= 5 && j <= 5) {
        if (!matrix[i]) matrix[i] = [];
        matrix[i][j] = pExact;
      }

      exactScores.push({
        score: `${i} - ${j}`,
        homeGoals: i,
        awayGoals: j,
        prob: pExact,
      });

      if (i > j) probHomeWin += pExact;
      else if (i === j) probDraw += pExact;
      else probAwayWin += pExact;
    }
  }

  // Normalize 1X2 sum to 100%
  const total1X2 = probHomeWin + probDraw + probAwayWin;
  if (total1X2 > 0) {
    probHomeWin /= total1X2;
    probDraw /= total1X2;
    probAwayWin /= total1X2;
  }

  const topExactScores = exactScores.sort((a, b) => b.prob - a.prob).slice(0, 6);

  const poisson: PoissonAnalysis = {
    matrix,
    probHomeWin,
    probDraw,
    probAwayWin,
    probOver05,
    probOver15,
    probOver25,
    probOver35,
    probUnder25,
    probBttsYes,
    probBttsNo,
    topExactScores,
  };

  // Módulo 3: Descriptive Statistics Variables (Categorized side-by-side array)
  const descriptiveMetrics: DescriptiveMetric[] = [
    // GERAL
    buildDescriptiveMetric('Gols Feitos (FT)', 'gols', homeActiveSample.map(s => s.teamGoals), awayActiveSample.map(s => s.teamGoals), 'Geral'),
    buildDescriptiveMetric('Gols Sofridos (FT)', 'gols', homeActiveSample.map(s => s.oppGoals), awayActiveSample.map(s => s.oppGoals), 'Geral'),
    buildDescriptiveMetric('Gols Feitos (HT)', 'gols', homeActiveSample.map(s => s.teamGoalsHT), awayActiveSample.map(s => s.teamGoalsHT), 'Geral'),
    buildDescriptiveMetric('Gols Sofridos (HT)', 'gols', homeActiveSample.map(s => s.oppGoalsHT), awayActiveSample.map(s => s.oppGoalsHT), 'Geral'),
    buildDescriptiveMetric('Posse de Bola (FT)', '%', homeActiveSample.map(s => s.possession ?? 50), awayActiveSample.map(s => s.possession ?? 50), 'Geral'),
    buildDescriptiveMetric('Escanteios Feitos (FT)', 'cantos', homeActiveSample.map(s => s.cornersFor ?? 0), awayActiveSample.map(s => s.cornersFor ?? 0), 'Geral'),
    buildDescriptiveMetric('Escanteios Sofridos (FT)', 'cantos', homeActiveSample.map(s => s.cornersAgainst ?? 0), awayActiveSample.map(s => s.cornersAgainst ?? 0), 'Geral'),
    buildDescriptiveMetric('Pontos Cartões (Amx1 + Vrmx2)', 'pts', homeActiveSample.map(s => s.cardPointsFor), awayActiveSample.map(s => s.cardPointsFor), 'Geral'),

    // FINALIZAÇÕES & xG
    buildDescriptiveMetric('Expected Goals - xG (FT)', 'xG', homeActiveSample.map(s => s.xgFor ?? s.teamGoals), awayActiveSample.map(s => s.xgFor ?? s.teamGoals), 'Finalizações & xG'),
    buildDescriptiveMetric('xG Concedido (FT)', 'xGA', homeActiveSample.map(s => s.xgAgainst ?? s.oppGoals), awayActiveSample.map(s => s.xgAgainst ?? s.oppGoals), 'Finalizações & xG'),
    buildDescriptiveMetric('Post-Shot xG - xGOT (FT)', 'xGOT', homeActiveSample.map(s => s.xgotFor ?? s.xgFor ?? s.teamGoals), awayActiveSample.map(s => s.xgotFor ?? s.xgFor ?? s.teamGoals), 'Finalizações & xG'),
    buildDescriptiveMetric('Finalizações Feitas (FT)', 'chutes', homeActiveSample.map(s => s.shotsFor ?? 0), awayActiveSample.map(s => s.shotsFor ?? 0), 'Finalizações & xG'),
    buildDescriptiveMetric('Finalizações Sofridas (FT)', 'chutes', homeActiveSample.map(s => s.shotsAgainst ?? 0), awayActiveSample.map(s => s.shotsAgainst ?? 0), 'Finalizações & xG'),
    buildDescriptiveMetric('Chutes no Alvo Feitos (FT)', 'ao gol', homeActiveSample.map(s => s.shotsOnTargetFor ?? 0), awayActiveSample.map(s => s.shotsOnTargetFor ?? 0), 'Finalizações & xG'),
    buildDescriptiveMetric('Chutes Dentro da Área (FT)', 'chutes', homeActiveSample.map(s => s.shotsInsideBoxFor ?? (s.shotsFor ? Math.round(s.shotsFor * 0.6) : 0)), awayActiveSample.map(s => s.shotsInsideBoxFor ?? (s.shotsFor ? Math.round(s.shotsFor * 0.6) : 0)), 'Finalizações & xG'),
    buildDescriptiveMetric('Chutes Fora da Área (FT)', 'chutes', homeActiveSample.map(s => s.shotsOutsideBoxFor ?? (s.shotsFor ? Math.round(s.shotsFor * 0.4) : 0)), awayActiveSample.map(s => s.shotsOutsideBoxFor ?? (s.shotsFor ? Math.round(s.shotsFor * 0.4) : 0)), 'Finalizações & xG'),
    buildDescriptiveMetric('Finalizações Bloqueadas (FT)', 'chutes', homeActiveSample.map(s => s.shotsBlockedFor ?? 0), awayActiveSample.map(s => s.shotsBlockedFor ?? 0), 'Finalizações & xG'),

    // ATAQUE & CRIAÇÃO
    buildDescriptiveMetric('Chances Claras de Gol (FT)', 'chances', homeActiveSample.map(s => s.bigChancesFor ?? 0), awayActiveSample.map(s => s.bigChancesFor ?? 0), 'Ataque & Criação'),
    buildDescriptiveMetric('Toques na Área Adversária (FT)', 'toques', homeActiveSample.map(s => s.touchesOppBoxFor ?? 0), awayActiveSample.map(s => s.touchesOppBoxFor ?? 0), 'Ataque & Criação'),
    buildDescriptiveMetric('Passes em Profundidade (FT)', 'passes', homeActiveSample.map(s => s.throughBallsFor ?? 0), awayActiveSample.map(s => s.throughBallsFor ?? 0), 'Ataque & Criação'),
    buildDescriptiveMetric('Impedimentos (FT)', 'imp.', homeActiveSample.map(s => s.offsidesFor ?? 0), awayActiveSample.map(s => s.offsidesFor ?? 0), 'Ataque & Criação'),
    buildDescriptiveMetric('Faltas Sofridas (FT)', 'faltas', homeActiveSample.map(s => s.foulsDrawnFor ?? 0), awayActiveSample.map(s => s.foulsDrawnFor ?? 0), 'Ataque & Criação'),

    // CONSTRUÇÃO & PASSES
    buildDescriptiveMetric('Passes Certos (FT)', 'passes', homeActiveSample.map(s => s.passesAccurateFor ?? 0), awayActiveSample.map(s => s.passesAccurateFor ?? 0), 'Construção & Passes'),
    buildDescriptiveMetric('Precisão nos Passes (FT)', '%', homeActiveSample.map(s => s.passesPctFor ?? 80), awayActiveSample.map(s => s.passesPctFor ?? 80), 'Construção & Passes'),
    buildDescriptiveMetric('Passes no Terço Final Certos (FT)', 'passes', homeActiveSample.map(s => s.finalThirdPassesAccurateFor ?? 0), awayActiveSample.map(s => s.finalThirdPassesAccurateFor ?? 0), 'Construção & Passes'),
    buildDescriptiveMetric('Precisão Passes Terço Final (FT)', '%', homeActiveSample.map(s => s.finalThirdPassesPctFor ?? 70), awayActiveSample.map(s => s.finalThirdPassesPctFor ?? 70), 'Construção & Passes'),
    buildDescriptiveMetric('Passes Longos Certos (FT)', 'passes', homeActiveSample.map(s => s.longPassesAccurateFor ?? 0), awayActiveSample.map(s => s.longPassesAccurateFor ?? 0), 'Construção & Passes'),
    buildDescriptiveMetric('Cruzamentos Certos (FT)', 'cruz.', homeActiveSample.map(s => s.crossesAccurateFor ?? 0), awayActiveSample.map(s => s.crossesAccurateFor ?? 0), 'Construção & Passes'),
    buildDescriptiveMetric('Expected Assists - xA (FT)', 'xA', homeActiveSample.map(s => s.xaFor ?? 0), awayActiveSample.map(s => s.xaFor ?? 0), 'Construção & Passes'),

    // DEFESA & DUELOS
    buildDescriptiveMetric('Desarmes Certos (FT)', 'desarmes', homeActiveSample.map(s => s.tacklesAccurateFor ?? 0), awayActiveSample.map(s => s.tacklesAccurateFor ?? 0), 'Defesa & Duelos'),
    buildDescriptiveMetric('Eficiência nos Desarmes (FT)', '%', homeActiveSample.map(s => s.tacklesPctFor ?? 65), awayActiveSample.map(s => s.tacklesPctFor ?? 65), 'Defesa & Duelos'),
    buildDescriptiveMetric('Duelos Vencidos (FT)', 'duelos', homeActiveSample.map(s => s.duelsWonFor ?? 0), awayActiveSample.map(s => s.duelsWonFor ?? 0), 'Defesa & Duelos'),
    buildDescriptiveMetric('Cortes / Afastamentos (FT)', 'cortes', homeActiveSample.map(s => s.clearancesFor ?? 0), awayActiveSample.map(s => s.clearancesFor ?? 0), 'Defesa & Duelos'),
    buildDescriptiveMetric('Interceptações (FT)', 'interc.', homeActiveSample.map(s => s.interceptionsFor ?? 0), awayActiveSample.map(s => s.interceptionsFor ?? 0), 'Defesa & Duelos'),
    buildDescriptiveMetric('Faltas Cometidas (FT)', 'faltas', homeActiveSample.map(s => s.foulsFor ?? 0), awayActiveSample.map(s => s.foulsFor ?? 0), 'Defesa & Duelos'),
    buildDescriptiveMetric('Erros que Geraram Finalização', 'erros', homeActiveSample.map(s => s.errorsLeadToShotFor ?? 0), awayActiveSample.map(s => s.errorsLeadToShotFor ?? 0), 'Defesa & Duelos'),

    // GOLEIRO & BALIZA
    buildDescriptiveMetric('Defesas do Goleiro (FT)', 'defesas', homeActiveSample.map(s => s.savesFor ?? 0), awayActiveSample.map(s => s.savesFor ?? 0), 'Goleiro & Baliza'),
    buildDescriptiveMetric('xGOT Sofrido / Enfrentado (FT)', 'xGOT', homeActiveSample.map(s => s.xgotFacedFor ?? s.oppGoals), awayActiveSample.map(s => s.xgotFacedFor ?? s.oppGoals), 'Goleiro & Baliza'),
    buildDescriptiveMetric('Gols Evitados pelo Goleiro (FT)', 'gols', homeActiveSample.map(s => s.goalsPreventedFor ?? 0), awayActiveSample.map(s => s.goalsPreventedFor ?? 0), 'Goleiro & Baliza'),
  ];

  // Complementary: HT vs FT Differentials ("Come-Quieto" detection)
  const homeTotalGF = homeActiveSample.reduce((acc, s) => acc + s.teamGoals, 0);
  const homeHTGF = homeActiveSample.reduce((acc, s) => acc + s.teamGoalsHT, 0);
  const home2HGF = Math.max(0, homeTotalGF - homeHTGF);

  const awayTotalGF = awayActiveSample.reduce((acc, s) => acc + s.teamGoals, 0);
  const awayHTGF = awayActiveSample.reduce((acc, s) => acc + s.teamGoalsHT, 0);
  const away2HGF = Math.max(0, awayTotalGF - awayHTGF);

  const homeScoredHTPct = homeTotalGF > 0 ? (homeHTGF / homeTotalGF) * 100 : 50;
  const homeScored2HPct = homeTotalGF > 0 ? (home2HGF / homeTotalGF) * 100 : 50;
  const awayScoredHTPct = awayTotalGF > 0 ? (awayHTGF / awayTotalGF) * 100 : 50;
  const awayScored2HPct = awayTotalGF > 0 ? (away2HGF / awayTotalGF) * 100 : 50;

  const homeComeQuieto = homeScored2HPct >= 65 ? 'Forte Crescimento 2ºT' : homeScored2HPct <= 35 ? 'Queda de Ritmo no 2ºT' : 'Equilibrado';
  const awayComeQuieto = awayScored2HPct >= 65 ? 'Forte Crescimento 2ºT' : awayScored2HPct <= 35 ? 'Queda de Ritmo no 2ºT' : 'Equilibrado';

  const htFtAnalysis: HtFtDifferential = {
    homeScoredHTPct,
    homeScored2HPct,
    homeComeQuietoTendency: homeComeQuieto,
    awayScoredHTPct,
    awayScored2HPct,
    awayComeQuietoTendency: awayComeQuieto,
    homeGoalsHTAvg: homeActiveSample.length > 0 ? homeHTGF / homeActiveSample.length : 0,
    homeGoals2HAvg: homeActiveSample.length > 0 ? home2HGF / homeActiveSample.length : 0,
    awayGoalsHTAvg: awayActiveSample.length > 0 ? awayHTGF / awayActiveSample.length : 0,
    awayGoals2HAvg: awayActiveSample.length > 0 ? away2HGF / awayActiveSample.length : 0,
  };

  // Referee Analysis (if active match has referee)
  let refereeAnalysis: RefereeCardAnalysis | undefined;
  const refereeName = options?.activeMatch?.referee?.trim();
  if (refereeName) {
    const refMatches = (dbState.matches || []).filter(
      m => m.referee?.trim().toLowerCase() === refereeName.toLowerCase() && m.status === 'FINALIZADO'
    );
    if (refMatches.length > 0) {
      let rYellows = 0;
      let rReds = 0;
      let rValid = 0;
      for (const rm of refMatches) {
        if (rm.stats?.yellowCardsHomeFT !== null && rm.stats?.yellowCardsHomeFT !== undefined) {
          rYellows += (rm.stats.yellowCardsHomeFT || 0) + (rm.stats.yellowCardsAwayFT || 0);
          rReds += (rm.stats.redCardsHomeFT || 0) + (rm.stats.redCardsAwayFT || 0);
          rValid++;
        }
      }
      if (rValid > 0) {
        const avgY = rYellows / rValid;
        const avgR = rReds / rValid;
        const avgTotalPts = avgY * 1 + avgR * 2;
        const combined = (expCardsHome + expCardsAway) * 0.5 + avgTotalPts * 0.5;
        refereeAnalysis = {
          refereeName,
          matchesCount: rValid,
          avgYellowCards: avgY,
          avgRedCards: avgR,
          avgTotalCardsPoints: avgTotalPts,
          combinedExpectation: combined,
        };
      }
    }
  }

  // +EV Scanner (Value Bet Analysis)
  const activeOdds = options?.activeMatch?.odds;
  const valueBets: ValueBetOpportunity[] = [];

  // Helper to evaluate value
  function evaluateValue(
    market: string,
    selection: string,
    prob: number,
    bookieOdd?: number | null
  ): ValueBetOpportunity {
    const fairOdd = prob > 0.005 ? 1 / prob : 99.0;
    const modelProbPct = prob * 100;
    if (!bookieOdd || bookieOdd <= 1.0) {
      return {
        market,
        selection,
        modelProbPct,
        fairOdd,
        bookmakerOdd: null,
        evPct: null,
        hasValue: false,
        status: 'SEM_ODD',
      };
    }

    // EV % = (prob * odd - 1) * 100
    const evPct = ((prob * bookieOdd) - 1) * 100;
    const hasValue = evPct >= 3.0; // At least +3% EV
    const isFair = evPct >= -3.0 && evPct < 3.0;

    return {
      market,
      selection,
      modelProbPct,
      fairOdd,
      bookmakerOdd: bookieOdd,
      evPct,
      hasValue,
      status: hasValue ? 'VALOR' : isFair ? 'JUSTA' : 'SEM_VALOR',
    };
  }

  valueBets.push(evaluateValue('Resultado Final 1X2', `Vitória ${homeTeam.name}`, poisson.probHomeWin, activeOdds?.homeFT));
  valueBets.push(evaluateValue('Resultado Final 1X2', 'Empate (X)', poisson.probDraw, activeOdds?.drawFT));
  valueBets.push(evaluateValue('Resultado Final 1X2', `Vitória ${awayTeam.name}`, poisson.probAwayWin, activeOdds?.awayFT));
  valueBets.push(evaluateValue('Gols FT', 'Over 2.5 Gols', poisson.probOver25, activeOdds?.over25FT));
  valueBets.push(evaluateValue('Gols FT', 'Under 2.5 Gols', poisson.probUnder25, activeOdds?.under25FT));
  valueBets.push(evaluateValue('Gols FT', 'Over 1.5 Gols', poisson.probOver15, null));
  valueBets.push(evaluateValue('Ambas Marcam', 'Ambas Marcam: SIM', poisson.probBttsYes, null));
  valueBets.push(evaluateValue('Ambas Marcam', 'Ambas Marcam: NÃO', poisson.probBttsNo, null));

  return {
    homeTeam,
    awayTeam,
    country,
    league,
    sampleSize,
    venueMode,
    homeFormG5,
    homeFormE5,
    awayFormG5,
    awayFormE5,
    homeActiveSample,
    awayActiveSample,
    homePower,
    awayPower,
    homeSectoralPower,
    awaySectoralPower,
    homeAdvancedIndices,
    awayAdvancedIndices,
    descriptiveMetrics,
    projections,
    poisson,
    htFtAnalysis,
    refereeAnalysis,
    valueBets,
    activeMatch: options?.activeMatch,
  };
}

import { Match, MatchStats } from '../types';
import { extractTeamMatches, TeamSampleMatch } from './analysisEngine';

export interface MinuteBin {
  key: string;
  label: string;
  startMin: number;
  endMin: number;
  half: '1T' | '2T';
}

export const MINUTE_BINS: MinuteBin[] = [
  { key: '0_15', label: '0 - 15 min', startMin: 0, endMin: 15, half: '1T' },
  { key: '16_30', label: '16 - 30 min', startMin: 16, endMin: 30, half: '1T' },
  { key: '31_45', label: '31 - 45+ min', startMin: 31, endMin: 45, half: '1T' },
  { key: '46_60', label: '46 - 60 min', startMin: 46, endMin: 60, half: '2T' },
  { key: '61_75', label: '61 - 75 min', startMin: 61, endMin: 75, half: '2T' },
  { key: '76_90', label: '76 - 90+ min', startMin: 76, endMin: 90, half: '2T' },
];

/**
 * Parses minute string into an array of integer numbers.
 * Supports patterns like "9,19,43,74", "9, 19, 43, 74", "45+2, 90+3", "9; 19; 43", or numbers.
 */
export function parseGoalMinutes(val: string | number | null | undefined): number[] {
  if (val === null || val === undefined) return [];
  if (typeof val === 'number') {
    return isNaN(val) || val < 0 ? [] : [Math.round(val)];
  }

  const str = String(val).trim();
  if (!str) return [];

  const rawParts = str.split(/[,;\/\s]+/).filter(Boolean);
  const result: number[] = [];

  for (const part of rawParts) {
    const cleaned = part.trim();
    if (!cleaned) continue;

    // Handle stoppage time notation, e.g. "45+2" -> 45 + 2 = 47, or "90+4" -> 94
    if (cleaned.includes('+')) {
      const subParts = cleaned.split('+').map(p => parseInt(p.trim(), 10));
      if (subParts.length === 2 && !isNaN(subParts[0]) && !isNaN(subParts[1])) {
        result.push(subParts[0] + subParts[1]);
        continue;
      }
    }

    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num >= 0) {
      result.push(num);
    }
  }

  return result.sort((a, b) => a - b);
}

/**
 * Identifies which bin a specific minute belongs to.
 * 0-15: <= 15
 * 16-30: 16 to 30
 * 31-45+: 31 to 45 (also catches 45+1 to 45+9, or any minute between 31 and 45)
 * 46-60: 46 to 60
 * 61-75: 61 to 75
 * 76-90+: >= 76 (includes 90+ stoppage time)
 */
export function getBinForMinute(minute: number): MinuteBin {
  if (minute <= 15) return MINUTE_BINS[0];
  if (minute <= 30) return MINUTE_BINS[1];
  if (minute <= 45) return MINUTE_BINS[2];
  // If minute is 45+ (e.g. 46-49 from 1T added time, usually classified into 31-45+)
  if (minute < 46) return MINUTE_BINS[2];
  if (minute <= 60) return MINUTE_BINS[3];
  if (minute <= 75) return MINUTE_BINS[4];
  return MINUTE_BINS[5]; // 76-90+
}

export interface BinGoalStat {
  bin: MinuteBin;
  goalsScored: number;
  goalsScoredPct: number;
  goalsConceded: number;
  goalsConcededPct: number;
  firstGoalScoredCount: number;
  firstGoalScoredPct: number;
  firstGoalConcededCount: number;
  firstGoalConcededPct: number;
}

export interface FirstGoalMetrics {
  totalGamesWithGoal: number;
  avgMinute: number | null;
  earliestMinute: number | null;
  latestMinute: number | null;
  scoredInFirst15Pct: number;
  scoredInFirst30Pct: number;
  scoredInFirstHalfPct: number;
  scoredInSecondHalfPct: number;
}

export interface TeamGoalTimingSummary {
  teamId: string;
  teamName: string;
  sampleCount: number;
  totalGoalsScoredWithTiming: number;
  totalGoalsConcededWithTiming: number;
  hasTimingData: boolean;
  bins: BinGoalStat[];
  firstGoalScored: FirstGoalMetrics;
  firstGoalConceded: FirstGoalMetrics;
  goalsScored1TCount: number;
  goalsScored1TPct: number;
  goalsScored2TCount: number;
  goalsScored2TPct: number;
  goalsConceded1TCount: number;
  goalsConceded1TPct: number;
  goalsConceded2TCount: number;
  goalsConceded2TPct: number;
  mostDangerousScoringBin: MinuteBin;
  mostVulnerableConcedingBin: MinuteBin;
}

export interface HeadToHeadTimingInsight {
  homePeakScoringBin: MinuteBin;
  awayPeakConcedingBin: MinuteBin;
  awayPeakScoringBin: MinuteBin;
  homePeakConcedingBin: MinuteBin;
  hotZones: {
    periodLabel: string;
    description: string;
    intensity: 'HIGH' | 'MEDIUM' | 'NORMAL';
  }[];
}

/**
 * Computes minute timing statistics for a team given their sample matches.
 */
export function calculateTeamGoalTiming(
  teamIdOrName: string,
  sampleMatches: TeamSampleMatch[],
  teamNameDisplay?: string
): TeamGoalTimingSummary {
  const normTeam = (teamIdOrName || '').toLowerCase().trim();

  // Initialize bin counters
  const binMap: Record<string, {
    scored: number;
    conceded: number;
    firstScored: number;
    firstConceded: number;
  }> = {};

  for (const b of MINUTE_BINS) {
    binMap[b.key] = { scored: 0, conceded: 0, firstScored: 0, firstConceded: 0 };
  }

  let totalScored = 0;
  let totalConceded = 0;
  let timingGamesCount = 0;

  const firstGoalScoredMinutes: number[] = [];
  const firstGoalConcededMinutes: number[] = [];

  for (const sm of sampleMatches) {
    const st = sm.match.stats || {};
    const isHome = sm.isHome;

    // Goals scored by this team in this match
    const scoredMinutesStr = isHome ? st.goalMinutesHomeFT : st.goalMinutesAwayFT;
    // Goals conceded by this team in this match
    const concededMinutesStr = isHome ? st.goalMinutesAwayFT : st.goalMinutesHomeFT;

    const scoredMins = parseGoalMinutes(scoredMinutesStr);
    const concededMins = parseGoalMinutes(concededMinutesStr);

    if (scoredMins.length > 0 || concededMins.length > 0) {
      timingGamesCount++;
    }

    // Process scored goals
    if (scoredMins.length > 0) {
      const minFirst = scoredMins[0]; // already sorted
      firstGoalScoredMinutes.push(minFirst);
      const firstBin = getBinForMinute(minFirst);
      if (binMap[firstBin.key]) {
        binMap[firstBin.key].firstScored++;
      }

      for (const m of scoredMins) {
        totalScored++;
        const b = getBinForMinute(m);
        if (binMap[b.key]) {
          binMap[b.key].scored++;
        }
      }
    }

    // Process conceded goals
    if (concededMins.length > 0) {
      const minFirst = concededMins[0];
      firstGoalConcededMinutes.push(minFirst);
      const firstBin = getBinForMinute(minFirst);
      if (binMap[firstBin.key]) {
        binMap[firstBin.key].firstConceded++;
      }

      for (const m of concededMins) {
        totalConceded++;
        const b = getBinForMinute(m);
        if (binMap[b.key]) {
          binMap[b.key].conceded++;
        }
      }
    }
  }

  // Calculate percentages and metrics
  const bins: BinGoalStat[] = MINUTE_BINS.map(b => {
    const counts = binMap[b.key] || { scored: 0, conceded: 0, firstScored: 0, firstConceded: 0 };
    return {
      bin: b,
      goalsScored: counts.scored,
      goalsScoredPct: totalScored > 0 ? Number(((counts.scored / totalScored) * 100).toFixed(1)) : 0,
      goalsConceded: counts.conceded,
      goalsConcededPct: totalConceded > 0 ? Number(((counts.conceded / totalConceded) * 100).toFixed(1)) : 0,
      firstGoalScoredCount: counts.firstScored,
      firstGoalScoredPct: firstGoalScoredMinutes.length > 0
        ? Number(((counts.firstScored / firstGoalScoredMinutes.length) * 100).toFixed(1))
        : 0,
      firstGoalConcededCount: counts.firstConceded,
      firstGoalConcededPct: firstGoalConcededMinutes.length > 0
        ? Number(((counts.firstConceded / firstGoalConcededMinutes.length) * 100).toFixed(1))
        : 0,
    };
  });

  // Calculate First Goal Scored stats
  const calcFirstGoalMetrics = (mins: number[]): FirstGoalMetrics => {
    if (mins.length === 0) {
      return {
        totalGamesWithGoal: 0,
        avgMinute: null,
        earliestMinute: null,
        latestMinute: null,
        scoredInFirst15Pct: 0,
        scoredInFirst30Pct: 0,
        scoredInFirstHalfPct: 0,
        scoredInSecondHalfPct: 0,
      };
    }
    const sum = mins.reduce((acc, v) => acc + v, 0);
    const avg = Number((sum / mins.length).toFixed(1));
    const earliest = Math.min(...mins);
    const latest = Math.max(...mins);
    const in15 = mins.filter(m => m <= 15).length;
    const in30 = mins.filter(m => m <= 30).length;
    const in1T = mins.filter(m => m <= 45).length;
    const in2T = mins.filter(m => m > 45).length;

    return {
      totalGamesWithGoal: mins.length,
      avgMinute: avg,
      earliestMinute: earliest,
      latestMinute: latest,
      scoredInFirst15Pct: Number(((in15 / mins.length) * 100).toFixed(1)),
      scoredInFirst30Pct: Number(((in30 / mins.length) * 100).toFixed(1)),
      scoredInFirstHalfPct: Number(((in1T / mins.length) * 100).toFixed(1)),
      scoredInSecondHalfPct: Number(((in2T / mins.length) * 100).toFixed(1)),
    };
  };

  const firstGoalScored = calcFirstGoalMetrics(firstGoalScoredMinutes);
  const firstGoalConceded = calcFirstGoalMetrics(firstGoalConcededMinutes);

  // 1T vs 2T summary
  const scored1T = bins.filter(b => b.bin.half === '1T').reduce((acc, b) => acc + b.goalsScored, 0);
  const scored2T = bins.filter(b => b.bin.half === '2T').reduce((acc, b) => acc + b.goalsScored, 0);
  const conceded1T = bins.filter(b => b.bin.half === '1T').reduce((acc, b) => acc + b.goalsConceded, 0);
  const conceded2T = bins.filter(b => b.bin.half === '2T').reduce((acc, b) => acc + b.goalsConceded, 0);

  // Peak bins
  let mostDangerousScoringBin = MINUTE_BINS[0];
  let maxScored = -1;
  let mostVulnerableConcedingBin = MINUTE_BINS[0];
  let maxConceded = -1;

  for (const b of bins) {
    if (b.goalsScored > maxScored) {
      maxScored = b.goalsScored;
      mostDangerousScoringBin = b.bin;
    }
    if (b.goalsConceded > maxConceded) {
      maxConceded = b.goalsConceded;
      mostVulnerableConcedingBin = b.bin;
    }
  }

  return {
    teamId: teamIdOrName,
    teamName: teamNameDisplay || teamIdOrName,
    sampleCount: sampleMatches.length,
    totalGoalsScoredWithTiming: totalScored,
    totalGoalsConcededWithTiming: totalConceded,
    hasTimingData: totalScored > 0 || totalConceded > 0,
    bins,
    firstGoalScored,
    firstGoalConceded,
    goalsScored1TCount: scored1T,
    goalsScored1TPct: totalScored > 0 ? Number(((scored1T / totalScored) * 100).toFixed(1)) : 0,
    goalsScored2TCount: scored2T,
    goalsScored2TPct: totalScored > 0 ? Number(((scored2T / totalScored) * 100).toFixed(1)) : 0,
    goalsConceded1TCount: conceded1T,
    goalsConceded1TPct: totalConceded > 0 ? Number(((conceded1T / totalConceded) * 100).toFixed(1)) : 0,
    goalsConceded2TCount: conceded2T,
    goalsConceded2TPct: totalConceded > 0 ? Number(((conceded2T / totalConceded) * 100).toFixed(1)) : 0,
    mostDangerousScoringBin,
    mostVulnerableConcedingBin,
  };
}

/**
 * Cross-analyzes home and away timing profiles to detect match hot zones.
 */
export function generateHeadToHeadTimingInsights(
  homeTiming: TeamGoalTimingSummary,
  awayTiming: TeamGoalTimingSummary
): HeadToHeadTimingInsight {
  const hotZones: HeadToHeadTimingInsight['hotZones'] = [];

  // Check 1: 0-15 min fast start
  const homeFastStart = homeTiming.firstGoalScored.scoredInFirst15Pct >= 35 || (homeTiming.bins[0]?.goalsScoredPct || 0) >= 30;
  const awayEarlyConcede = awayTiming.firstGoalConceded.scoredInFirst15Pct >= 35 || (awayTiming.bins[0]?.goalsConcededPct || 0) >= 30;

  if (homeFastStart && awayEarlyConcede) {
    hotZones.push({
      periodLabel: '0 - 15 min',
      description: `Zona de Alta Pressão Inicial: ${homeTiming.teamName} costuma marcar cedo (${homeTiming.firstGoalScored.scoredInFirst15Pct}% dos 1º gols) e ${awayTiming.teamName} frequentemente sofre gols nos primeiros 15 minutos (${awayTiming.firstGoalConceded.scoredInFirst15Pct}%).`,
      intensity: 'HIGH',
    });
  } else if (homeFastStart || awayEarlyConcede) {
    hotZones.push({
      periodLabel: '0 - 15 min',
      description: `Tendência de início ativo nos primeiros 15 minutos de jogo.`,
      intensity: 'MEDIUM',
    });
  }

  // Check 2: 31-45 min final of 1st half
  const homeEnd1TScored = (homeTiming.bins[2]?.goalsScoredPct || 0) >= 25;
  const awayEnd1TConceded = (awayTiming.bins[2]?.goalsConcededPct || 0) >= 25;
  if (homeEnd1TScored || awayEnd1TConceded) {
    hotZones.push({
      periodLabel: '31 - 45+ min',
      description: `Pico de Gols no Final do 1º Tempo: Momento de alta concentração de oportunidades antes do intervalo.`,
      intensity: homeEnd1TScored && awayEnd1TConceded ? 'HIGH' : 'MEDIUM',
    });
  }

  // Check 3: 76-90 min final of match
  const homeEnd2TScored = (homeTiming.bins[5]?.goalsScoredPct || 0) >= 25;
  const awayEnd2TConceded = (awayTiming.bins[5]?.goalsConcededPct || 0) >= 25;
  if (homeEnd2TScored || awayEnd2TConceded) {
    hotZones.push({
      periodLabel: '76 - 90+ min',
      description: `Reta Final Decisiva (76-90+ min): Alta incidência de gols no encerramento da partida.`,
      intensity: homeEnd2TScored && awayEnd2TConceded ? 'HIGH' : 'MEDIUM',
    });
  }

  return {
    homePeakScoringBin: homeTiming.mostDangerousScoringBin,
    awayPeakConcedingBin: awayTiming.mostVulnerableConcedingBin,
    awayPeakScoringBin: awayTiming.mostDangerousScoringBin,
    homePeakConcedingBin: homeTiming.mostVulnerableConcedingBin,
    hotZones,
  };
}

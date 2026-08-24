import { Match, DbState } from '../types';

export interface RefereeStats {
  id: string; // Slugified name
  name: string;
  photoUrl?: string;
  totalMatches: number;
  finishedMatches: number;
  scheduledMatches: number;
  
  // Gols
  totalGoals: number;
  avgGoals: number;
  homeGoals: number;
  awayGoals: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  over15Count: number;
  over15Pct: number;
  over25Count: number;
  over25Pct: number;
  over35Count: number;
  over35Pct: number;
  bttsCount: number;
  bttsPct: number;

  // Cartões
  matchesWithCardStats: number;
  totalYellowCards: number;
  avgYellowCards: number;
  yellowCardsHome: number;
  yellowCardsAway: number;
  avgYellowCardsHome: number;
  avgYellowCardsAway: number;
  totalRedCards: number;
  avgRedCards: number;
  redCardsHome: number;
  redCardsAway: number;
  matchesWithRedCard: number;
  redCardMatchPct: number;
  totalCards: number; // Yellows + Reds
  avgTotalCards: number;
  cardsOver35Pct: number;
  cardsOver45Pct: number;
  cardsOver55Pct: number;

  // Faltas
  matchesWithFoulStats: number;
  totalFouls: number;
  avgFouls: number;
  foulsHome: number;
  foulsAway: number;
  avgFoulsHome: number;
  avgFoulsAway: number;
  foulsPerCard: number; // Quantas faltas o árbitro marca até aplicar um cartão

  // Resultados
  homeWins: number;
  draws: number;
  awayWins: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;

  // Contexto
  leagues: string[];
  leagueIds: string[];
  countries: string[];
  countryIds: string[];
  firstMatchDate?: string;
  lastMatchDate?: string;
  
  // Tendências e Classificação
  disciplineLevel: 'VERY_STRICT' | 'STRICT' | 'MODERATE' | 'LENIENT';
  goalTendency: 'OVER' | 'BALANCED' | 'UNDER';
  homeAdvantageBias: 'HOME_BIASED' | 'BALANCED' | 'AWAY_BIASED';
  
  matches: Match[];
}

export interface RefereeGlobalAverages {
  totalReferees: number;
  totalMatchesEvaluated: number;
  avgGoals: number;
  avgYellowCards: number;
  avgRedCards: number;
  avgFouls: number;
  avgOver25Pct: number;
  avgBttsPct: number;
  avgHomeWinPct: number;
}

/**
 * Normaliza o nome do árbitro para agrupamento consistente
 */
export function normalizeRefereeName(name?: string | null): string {
  if (!name) return '';
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[-\s,]+|[-\s,]+$/g, '');
}

/**
 * Extrai e consolida estatísticas completas de todos os árbitros presentes no banco de dados.
 */
export function computeRefereeStats(
  matches: Match[],
  options?: {
    countryId?: string;
    leagueId?: string;
    minMatches?: number;
    searchQuery?: string;
  }
): {
  referees: RefereeStats[];
  globalAverages: RefereeGlobalAverages;
  upcomingRefereeAssignments: { match: Match; refereeStats?: RefereeStats }[];
} {
  const refereeMap = new Map<string, { name: string; matches: Match[] }>();

  // Agrupa partidas por árbitro
  matches.forEach(match => {
    const rawRef = match.referee;
    const cleanRef = normalizeRefereeName(rawRef);
    if (!cleanRef || cleanRef.toLowerCase() === 'n/a' || cleanRef.toLowerCase() === 'desconhecido') {
      return;
    }

    const key = cleanRef.toLowerCase();
    const existing = refereeMap.get(key);
    if (existing) {
      existing.matches.push(match);
      // Mantém a melhor capitalização
      if (cleanRef.length > existing.name.length || /[A-Z]/.test(cleanRef)) {
        existing.name = cleanRef;
      }
    } else {
      refereeMap.set(key, { name: cleanRef, matches: [match] });
    }
  });

  const list: RefereeStats[] = [];

  refereeMap.forEach(({ name, matches: refMatches }) => {
    // Ordena partidas da mais recente para mais antiga
    const sortedMatches = [...refMatches].sort(
      (a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
    );

    const totalMatches = sortedMatches.length;
    const finishedMatchesList = sortedMatches.filter(
      m => m.status === 'FINALIZADO' || (m.homeScore !== null && m.awayScore !== null)
    );
    const scheduledMatchesList = sortedMatches.filter(
      m => m.status === 'AGENDADO' && m.homeScore === null && m.awayScore === null
    );

    const finishedCount = finishedMatchesList.length;

    let totalGoals = 0;
    let homeGoals = 0;
    let awayGoals = 0;
    let over15Count = 0;
    let over25Count = 0;
    let over35Count = 0;
    let bttsCount = 0;

    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;

    let matchesWithCardStats = 0;
    let yellowCardsHome = 0;
    let yellowCardsAway = 0;
    let redCardsHome = 0;
    let redCardsAway = 0;
    let matchesWithRedCard = 0;
    let cardsOver35Count = 0;
    let cardsOver45Count = 0;
    let cardsOver55Count = 0;

    let matchesWithFoulStats = 0;
    let foulsHome = 0;
    let foulsAway = 0;

    const leaguesSet = new Set<string>();
    const leagueIdsSet = new Set<string>();
    const countriesSet = new Set<string>();
    const countryIdsSet = new Set<string>();

    sortedMatches.forEach(m => {
      if (m.leagueName) leaguesSet.add(m.leagueName);
      if (m.leagueId) leagueIdsSet.add(m.leagueId);
      if (m.countryName) countriesSet.add(m.countryName);
      if (m.countryId) countryIdsSet.add(m.countryId);
    });

    finishedMatchesList.forEach(m => {
      const hScore = m.homeScore ?? 0;
      const aScore = m.awayScore ?? 0;
      const matchGoals = hScore + aScore;

      totalGoals += matchGoals;
      homeGoals += hScore;
      awayGoals += aScore;

      if (matchGoals > 1.5) over15Count++;
      if (matchGoals > 2.5) over25Count++;
      if (matchGoals > 3.5) over35Count++;
      if (hScore > 0 && aScore > 0) bttsCount++;

      if (hScore > aScore) homeWins++;
      else if (hScore === aScore) draws++;
      else awayWins++;

      // Estatísticas de cartões
      const yHome = m.stats?.yellowCardsHomeFT;
      const yAway = m.stats?.yellowCardsAwayFT;
      const rHome = m.stats?.redCardsHomeFT;
      const rAway = m.stats?.redCardsAwayFT;

      if (yHome !== undefined && yHome !== null || yAway !== undefined && yAway !== null) {
        matchesWithCardStats++;
        const yh = yHome || 0;
        const ya = yAway || 0;
        const rh = rHome || 0;
        const ra = rAway || 0;

        yellowCardsHome += yh;
        yellowCardsAway += ya;
        redCardsHome += rh;
        redCardsAway += ra;

        const matchCards = yh + ya + rh + ra;
        if (rh + ra > 0) matchesWithRedCard++;
        if (matchCards > 3.5) cardsOver35Count++;
        if (matchCards > 4.5) cardsOver45Count++;
        if (matchCards > 5.5) cardsOver55Count++;
      }

      // Estatísticas de faltas
      const fHome = m.stats?.foulsHomeFT;
      const fAway = m.stats?.foulsAwayFT;

      if (fHome !== undefined && fHome !== null || fAway !== undefined && fAway !== null) {
        matchesWithFoulStats++;
        foulsHome += fHome || 0;
        foulsAway += fAway || 0;
      }
    });

    const safeFinished = finishedCount > 0 ? finishedCount : 1;
    const safeCardMatches = matchesWithCardStats > 0 ? matchesWithCardStats : 1;
    const safeFoulMatches = matchesWithFoulStats > 0 ? matchesWithFoulStats : 1;

    const avgGoals = finishedCount > 0 ? totalGoals / safeFinished : 0;
    const avgHomeGoals = finishedCount > 0 ? homeGoals / safeFinished : 0;
    const avgAwayGoals = finishedCount > 0 ? awayGoals / safeFinished : 0;

    const totalYellowCards = yellowCardsHome + yellowCardsAway;
    const avgYellowCards = matchesWithCardStats > 0 ? totalYellowCards / safeCardMatches : 0;
    const avgYellowCardsHome = matchesWithCardStats > 0 ? yellowCardsHome / safeCardMatches : 0;
    const avgYellowCardsAway = matchesWithCardStats > 0 ? yellowCardsAway / safeCardMatches : 0;

    const totalRedCards = redCardsHome + redCardsAway;
    const avgRedCards = matchesWithCardStats > 0 ? totalRedCards / safeCardMatches : 0;
    const redCardMatchPct = matchesWithCardStats > 0 ? (matchesWithRedCard / safeCardMatches) * 100 : 0;

    const totalCards = totalYellowCards + totalRedCards;
    const avgTotalCards = matchesWithCardStats > 0 ? totalCards / safeCardMatches : 0;

    const totalFouls = foulsHome + foulsAway;
    const avgFouls = matchesWithFoulStats > 0 ? totalFouls / safeFoulMatches : 0;
    const avgFoulsHome = matchesWithFoulStats > 0 ? foulsHome / safeFoulMatches : 0;
    const avgFoulsAway = matchesWithFoulStats > 0 ? foulsAway / safeFoulMatches : 0;

    const foulsPerCard = totalCards > 0 && totalFouls > 0 ? totalFouls / totalCards : 0;

    const homeWinPct = finishedCount > 0 ? (homeWins / safeFinished) * 100 : 0;
    const drawPct = finishedCount > 0 ? (draws / safeFinished) * 100 : 0;
    const awayWinPct = finishedCount > 0 ? (awayWins / safeFinished) * 100 : 0;

    const over15Pct = finishedCount > 0 ? (over15Count / safeFinished) * 100 : 0;
    const over25Pct = finishedCount > 0 ? (over25Count / safeFinished) * 100 : 0;
    const over35Pct = finishedCount > 0 ? (over35Count / safeFinished) * 100 : 0;
    const bttsPct = finishedCount > 0 ? (bttsCount / safeFinished) * 100 : 0;

    const cardsOver35Pct = matchesWithCardStats > 0 ? (cardsOver35Count / safeCardMatches) * 100 : 0;
    const cardsOver45Pct = matchesWithCardStats > 0 ? (cardsOver45Count / safeCardMatches) * 100 : 0;
    const cardsOver55Pct = matchesWithCardStats > 0 ? (cardsOver55Count / safeCardMatches) * 100 : 0;

    // Determina perfil de disciplina
    let disciplineLevel: 'VERY_STRICT' | 'STRICT' | 'MODERATE' | 'LENIENT' = 'MODERATE';
    if (avgTotalCards >= 5.2 || (avgFouls >= 28 && avgTotalCards >= 4.5) || redCardMatchPct >= 30) {
      disciplineLevel = 'VERY_STRICT';
    } else if (avgTotalCards >= 4.2 || avgFouls >= 24) {
      disciplineLevel = 'STRICT';
    } else if (avgTotalCards < 3.2 && (avgFouls === 0 || avgFouls < 20)) {
      disciplineLevel = 'LENIENT';
    }

    // Determina tendência de gols
    let goalTendency: 'OVER' | 'BALANCED' | 'UNDER' = 'BALANCED';
    if (avgGoals >= 2.9 || over25Pct >= 60) {
      goalTendency = 'OVER';
    } else if (avgGoals <= 2.1 || over25Pct <= 40) {
      goalTendency = 'UNDER';
    }

    // Viés de mando
    let homeAdvantageBias: 'HOME_BIASED' | 'BALANCED' | 'AWAY_BIASED' = 'BALANCED';
    if (homeWinPct >= 55 || (avgYellowCardsAway - avgYellowCardsHome >= 1.2 && matchesWithCardStats >= 3)) {
      homeAdvantageBias = 'HOME_BIASED';
    } else if (awayWinPct >= 45 || (avgYellowCardsHome - avgYellowCardsAway >= 1.0 && matchesWithCardStats >= 3)) {
      homeAdvantageBias = 'AWAY_BIASED';
    }

    const firstMatch = sortedMatches[sortedMatches.length - 1];
    const lastMatch = sortedMatches[0];
    const photoUrl = sortedMatches.find(m => m.refereePhotoUrl && m.refereePhotoUrl.trim() !== '')?.refereePhotoUrl;

    list.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      photoUrl,
      totalMatches,
      finishedMatches: finishedCount,
      scheduledMatches: scheduledMatchesList.length,
      totalGoals,
      avgGoals,
      homeGoals,
      awayGoals,
      avgHomeGoals,
      avgAwayGoals,
      over15Count,
      over15Pct,
      over25Count,
      over25Pct,
      over35Count,
      over35Pct,
      bttsCount,
      bttsPct,
      matchesWithCardStats,
      totalYellowCards,
      avgYellowCards,
      yellowCardsHome,
      yellowCardsAway,
      avgYellowCardsHome,
      avgYellowCardsAway,
      totalRedCards,
      avgRedCards,
      redCardsHome,
      redCardsAway,
      matchesWithRedCard,
      redCardMatchPct,
      totalCards,
      avgTotalCards,
      cardsOver35Pct,
      cardsOver45Pct,
      cardsOver55Pct,
      matchesWithFoulStats,
      totalFouls,
      avgFouls,
      foulsHome,
      foulsAway,
      avgFoulsHome,
      avgFoulsAway,
      foulsPerCard,
      homeWins,
      draws,
      awayWins,
      homeWinPct,
      drawPct,
      awayWinPct,
      leagues: Array.from(leaguesSet),
      leagueIds: Array.from(leagueIdsSet),
      countries: Array.from(countriesSet),
      countryIds: Array.from(countryIdsSet),
      firstMatchDate: firstMatch?.matchDate,
      lastMatchDate: lastMatch?.matchDate,
      disciplineLevel,
      goalTendency,
      homeAdvantageBias,
      matches: sortedMatches,
    });
  });

  // Calcula médias globais para benchmark
  let sumGoals = 0;
  let sumFinishedMatches = 0;
  let sumYellowCards = 0;
  let sumRedCards = 0;
  let sumCardMatches = 0;
  let sumFouls = 0;
  let sumFoulMatches = 0;
  let sumOver25 = 0;
  let sumBtts = 0;
  let sumHomeWins = 0;

  list.forEach(ref => {
    sumGoals += ref.totalGoals;
    sumFinishedMatches += ref.finishedMatches;
    sumYellowCards += ref.totalYellowCards;
    sumRedCards += ref.totalRedCards;
    sumCardMatches += ref.matchesWithCardStats;
    sumFouls += ref.totalFouls;
    sumFoulMatches += ref.matchesWithFoulStats;
    sumOver25 += ref.over25Count;
    sumBtts += ref.bttsCount;
    sumHomeWins += ref.homeWins;
  });

  const globalAverages: RefereeGlobalAverages = {
    totalReferees: list.length,
    totalMatchesEvaluated: sumFinishedMatches,
    avgGoals: sumFinishedMatches > 0 ? sumGoals / sumFinishedMatches : 2.6,
    avgYellowCards: sumCardMatches > 0 ? sumYellowCards / sumCardMatches : 4.0,
    avgRedCards: sumCardMatches > 0 ? sumRedCards / sumCardMatches : 0.18,
    avgFouls: sumFoulMatches > 0 ? sumFouls / sumFoulMatches : 24.5,
    avgOver25Pct: sumFinishedMatches > 0 ? (sumOver25 / sumFinishedMatches) * 100 : 50,
    avgBttsPct: sumFinishedMatches > 0 ? (sumBtts / sumFinishedMatches) * 100 : 50,
    avgHomeWinPct: sumFinishedMatches > 0 ? (sumHomeWins / sumFinishedMatches) * 100 : 45,
  };

  // Mapeia árbitros para partidas agendadas (Upcoming Assignments)
  const refereeLookupMap = new Map(list.map(r => [r.name.toLowerCase(), r]));
  const upcomingMatches = matches.filter(
    m => m.status === 'AGENDADO' || (m.homeScore === null && m.awayScore === null)
  );

  const upcomingRefereeAssignments = upcomingMatches.map(match => {
    const refKey = (match.referee || '').trim().toLowerCase();
    const stats = refKey ? refereeLookupMap.get(refKey) : undefined;
    return { match, refereeStats: stats };
  });

  // Aplica filtros se especificados
  let filteredList = list;

  if (options?.countryId && options.countryId !== 'ALL') {
    filteredList = filteredList.filter(r => r.countryIds.includes(options.countryId!));
  }

  if (options?.leagueId && options.leagueId !== 'ALL') {
    filteredList = filteredList.filter(r => r.leagueIds.includes(options.leagueId!));
  }

  if (options?.minMatches !== undefined && options.minMatches > 0) {
    filteredList = filteredList.filter(r => r.totalMatches >= options.minMatches!);
  }

  if (options?.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.toLowerCase().trim();
    filteredList = filteredList.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.leagues.some(l => l.toLowerCase().includes(q)) ||
        r.countries.some(c => c.toLowerCase().includes(q))
    );
  }

  return {
    referees: filteredList,
    globalAverages,
    upcomingRefereeAssignments,
  };
}

/**
 * Obtém todos os nomes de árbitros conhecidos na base para auto-completar
 */
export function getAllRefereeNames(matches: Match[]): string[] {
  const set = new Set<string>();
  matches.forEach(m => {
    const clean = normalizeRefereeName(m.referee);
    if (clean && clean.toLowerCase() !== 'n/a') {
      set.add(clean);
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

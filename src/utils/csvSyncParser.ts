import { DbState, Country, League, Team, Match } from '../types';

export interface ClientSyncResult {
  success: boolean;
  message: string;
  totalCountries: number;
  totalLeagues: number;
  totalTeams: number;
  totalMatches: number;
  newCountriesCount: number;
  newLeaguesCount: number;
  newTeamsCount: number;
  newMatchesCount: number;
}

export const DIV_MAP: Record<string, { countryCode: string; leagueName: string }> = {
  E0: { countryCode: 'ING', leagueName: 'Premier League' },
  E1: { countryCode: 'ING', leagueName: 'Championship' },
  E2: { countryCode: 'ING', leagueName: 'League 1' },
  E3: { countryCode: 'ING', leagueName: 'League 2' },
  SC0: { countryCode: 'ESC', leagueName: 'Premiere League' },
  SC1: { countryCode: 'ESC', leagueName: 'Division 1' },
  SC2: { countryCode: 'ESC', leagueName: 'Division 2' },
  SC3: { countryCode: 'ESC', leagueName: 'Division 3' },
  D1: { countryCode: 'ALE', leagueName: 'Bundesliga 1' },
  D2: { countryCode: 'ALE', leagueName: 'Bundesliga 2' },
  I1: { countryCode: 'ITA', leagueName: 'Serie A' },
  I2: { countryCode: 'ITA', leagueName: 'Serie B' },
  SP1: { countryCode: 'ESP', leagueName: 'La Liga 1' },
  SP2: { countryCode: 'ESP', leagueName: 'La Liga 2' },
  F1: { countryCode: 'FRA', leagueName: 'Le Championnat' },
  F2: { countryCode: 'FRA', leagueName: 'Division 2' },
  N1: { countryCode: 'HOL', leagueName: 'Eredivisie' },
  B1: { countryCode: 'BEL', leagueName: 'Jupiler League' },
  P1: { countryCode: 'POR', leagueName: 'Liga I' },
  T1: { countryCode: 'TUR', leagueName: 'Futbol Ligi 1' },
  G1: { countryCode: 'GRE', leagueName: 'Ethniki Katigoria' },
};

export const COUNTRY_NAMES: Record<string, string> = {
  ING: 'Inglaterra',
  ESC: 'Escócia',
  ALE: 'Alemanha',
  ITA: 'Itália',
  ESP: 'Espanha',
  FRA: 'França',
  HOL: 'Holanda',
  BEL: 'Bélgica',
  POR: 'Portugal',
  TUR: 'Turquia',
  GRE: 'Grécia',
};

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

function parseCsvLines(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvRow(lines[0]);
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    if (row.length === 0 || row.every(cell => !cell.trim())) continue;
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j] !== undefined ? row[j] : '';
    }
    results.push(obj);
  }
  return results;
}

function parseDate(dateStr?: string, timeStr?: string): string {
  if (!dateStr || !dateStr.trim()) return new Date().toISOString();
  const rawDate = dateStr.trim();
  const parts = rawDate.split(/[\/\-]/);
  let year = new Date().getFullYear();
  let month = 1;
  let day = 1;

  if (parts.length === 3) {
    day = parseInt(parts[0], 10) || 1;
    month = parseInt(parts[1], 10) || 1;
    let y = parseInt(parts[2], 10);
    if (y < 100) y += 2000;
    year = y;
  }

  let hours = 0;
  let mins = 0;
  if (timeStr && timeStr.trim()) {
    const tParts = timeStr.trim().split(':');
    if (tParts.length >= 2) {
      hours = parseInt(tParts[0], 10) || 0;
      mins = parseInt(tParts[1], 10) || 0;
    }
  }

  const d = new Date(year, month - 1, day, hours, mins, 0);
  return d.toISOString();
}

function safeNum(val: any): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? undefined : num;
}

export function parseAndSyncCsvLocally(
  csvText: string,
  currentDb: DbState
): { updatedDb: DbState; result: ClientSyncResult } {
  const parsedRows = parseCsvLines(csvText);

  const countries = [...(currentDb.countries || [])];
  const leagues = [...(currentDb.leagues || [])];
  const teams = [...(currentDb.teams || [])];
  const matches = [...(currentDb.matches || [])];

  const countriesMap = new Map<string, Country>();
  countries.forEach(c => {
    if (c.code) countriesMap.set(c.code.toUpperCase(), c);
    if (c.name) countriesMap.set(c.name.toUpperCase(), c);
    countriesMap.set(c.id, c);
  });

  const leaguesMap = new Map<string, League>();
  leagues.forEach(l => {
    leaguesMap.set(`${l.countryId}_${l.name.toUpperCase()}`, l);
    leaguesMap.set(l.name.toUpperCase(), l);
  });

  const teamsMap = new Map<string, Team>();
  teams.forEach(t => {
    teamsMap.set(`${t.countryId}_${t.name.toUpperCase()}`, t);
    teamsMap.set(t.name.toUpperCase(), t);
  });

  const matchesMap = new Map<string, Match>();
  matches.forEach(m => {
    const dateKey = m.date ? m.date.substring(0, 10) : '';
    matchesMap.set(`${dateKey}_${m.homeTeamId}_${m.awayTeamId}`, m);
    matchesMap.set(`${m.homeTeamId}_${m.awayTeamId}`, m);
  });

  let newCountriesCount = 0;
  let newLeaguesCount = 0;
  let newTeamsCount = 0;
  let newMatchesCount = 0;

  for (const r of parsedRows) {
    const homeName = (r['HomeTeam'] || r['Home'] || r['MANDANTE'] || r['Mandante'] || '').trim();
    const awayName = (r['AwayTeam'] || r['Away'] || r['VISITANTE'] || r['Visitante'] || '').trim();

    if (!homeName || !awayName) continue;

    let countryCode = (r['PAIS'] || r['Pais'] || r['Country'] || r['COUNTRY'] || '').trim();
    let leagueName = (r['LIGA'] || r['Liga'] || r['League'] || r['LEAGUE'] || '').trim();

    // Check Div code mapping (e.g. E0, SP1, D1)
    const div = (r['Div'] || r['DIV'] || '').trim();
    if (div && DIV_MAP[div]) {
      if (!countryCode) countryCode = DIV_MAP[div].countryCode;
      if (!leagueName) leagueName = DIV_MAP[div].leagueName;
    }

    if (!countryCode) countryCode = 'INT';
    if (!leagueName) leagueName = 'Liga Principal';

    // 1. Ensure Country
    const cKey = countryCode.toUpperCase();
    let country = countriesMap.get(cKey) || countriesMap.get((COUNTRY_NAMES[countryCode] || countryCode).toUpperCase());
    if (!country) {
      const nextNum = countries.length + 1;
      const id = `PAIS-${String(nextNum).padStart(3, '0')}`;
      country = {
        id,
        name: COUNTRY_NAMES[countryCode] || countryCode,
        code: countryCode,
        createdAt: new Date().toISOString(),
      };
      countries.push(country);
      countriesMap.set(cKey, country);
      countriesMap.set(country.name.toUpperCase(), country);
      newCountriesCount++;
    }

    // 2. Ensure League
    const lKey = `${country.id}_${leagueName.toUpperCase()}`;
    let league = leaguesMap.get(lKey) || leaguesMap.get(leagueName.toUpperCase());
    if (!league) {
      const nextNum = leagues.length + 1;
      const id = `LIGA-${String(nextNum).padStart(3, '0')}`;
      league = {
        id,
        name: leagueName,
        countryId: country.id,
        countryName: country.name,
        createdAt: new Date().toISOString(),
      };
      leagues.push(league);
      leaguesMap.set(lKey, league);
      newLeaguesCount++;
    }

    // 3. Ensure Home Team
    const htKey = `${country.id}_${homeName.toUpperCase()}`;
    let homeTeam = teamsMap.get(htKey) || teamsMap.get(homeName.toUpperCase());
    if (!homeTeam) {
      const nextNum = teams.length + 1;
      const id = `TIME-${String(nextNum).padStart(3, '0')}`;
      homeTeam = {
        id,
        name: homeName,
        countryId: country.id,
        countryName: country.name,
        leagueId: league.id,
        leagueName: league.name,
        createdAt: new Date().toISOString(),
      };
      teams.push(homeTeam);
      teamsMap.set(htKey, homeTeam);
      teamsMap.set(homeName.toUpperCase(), homeTeam);
      newTeamsCount++;
    }

    // 4. Ensure Away Team
    const atKey = `${country.id}_${awayName.toUpperCase()}`;
    let awayTeam = teamsMap.get(atKey) || teamsMap.get(awayName.toUpperCase());
    if (!awayTeam) {
      const nextNum = teams.length + 1;
      const id = `TIME-${String(nextNum).padStart(3, '0')}`;
      awayTeam = {
        id,
        name: awayName,
        countryId: country.id,
        countryName: country.name,
        leagueId: league.id,
        leagueName: league.name,
        createdAt: new Date().toISOString(),
      };
      teams.push(awayTeam);
      teamsMap.set(atKey, awayTeam);
      teamsMap.set(awayName.toUpperCase(), awayTeam);
      newTeamsCount++;
    }

    // 5. Process Match
    const dateStr = r['Date'] || r['DATE'] || r['DATA'] || r['Data'] || '';
    const timeStr = r['Time'] || r['TIME'] || r['HORA'] || r['Hora'] || '';
    const isoDate = parseDate(dateStr, timeStr);
    const dateKey = isoDate.substring(0, 10);
    const mKey = `${dateKey}_${homeTeam.id}_${awayTeam.id}`;

    const fthg = safeNum(r['FTHG'] ?? r['HG'] ?? r['GOLS_MANDANTE'] ?? r['PlacarCasa']);
    const ftag = safeNum(r['FTAG'] ?? r['AG'] ?? r['GOLS_VISITANTE'] ?? r['PlacarFora']);
    const hthg = safeNum(r['HTHG']);
    const htag = safeNum(r['HTAG']);

    const isFinished = fthg !== undefined && ftag !== undefined;
    const status = isFinished ? 'FINISHED' : 'SCHEDULED';

    const hs = safeNum(r['HS'] ?? r['CHUTES_MANDANTE']);
    const as = safeNum(r['AS'] ?? r['CHUTES_VISITANTE']);
    const hst = safeNum(r['HST'] ?? r['CHUTES_GOL_MANDANTE']);
    const ast = safeNum(r['AST'] ?? r['CHUTES_GOL_VISITANTE']);
    const hc = safeNum(r['HC'] ?? r['ESCANTEIOS_MANDANTE']);
    const ac = safeNum(r['AC'] ?? r['ESCANTEIOS_VISITANTE']);
    const hy = safeNum(r['HY'] ?? r['AMARELOS_MANDANTE']);
    const ay = safeNum(r['AY'] ?? r['AMARELOS_VISITANTE']);
    const hr = safeNum(r['HR'] ?? r['VERMELHOS_MANDANTE']);
    const ar = safeNum(r['AR'] ?? r['VERMELHOS_VISITANTE']);
    const hf = safeNum(r['HF'] ?? r['FALTAS_MANDANTE']);
    const af = safeNum(r['AF'] ?? r['FALTAS_VISITANTE']);

    const statsObj = {
      shotsHome: hs,
      shotsAway: as,
      shotsOnTargetHome: hst,
      shotsOnTargetAway: ast,
      cornersHome: hc,
      cornersAway: ac,
      yellowCardsHome: hy,
      yellowCardsAway: ay,
      redCardsHome: hr,
      redCardsAway: ar,
      foulsHome: hf,
      foulsAway: af,
    };

    const b365H = safeNum(r['B365H'] ?? r['ODD_H']);
    const b365D = safeNum(r['B365D'] ?? r['ODD_D']);
    const b365A = safeNum(r['B365A'] ?? r['ODD_A']);
    const over25 = safeNum(r['B365>2.5'] ?? r['BbAv>2.5'] ?? r['ODD_OVER25']);
    const under25 = safeNum(r['B365<2.5'] ?? r['BbAv<2.5'] ?? r['ODD_UNDER25']);

    const oddsObj = {
      homeWin: b365H,
      draw: b365D,
      awayWin: b365A,
      over25,
      under25,
    };

    let existingMatch = matchesMap.get(mKey);
    if (existingMatch) {
      existingMatch.date = isoDate;
      existingMatch.status = status;
      if (fthg !== undefined) existingMatch.homeScore = fthg;
      if (ftag !== undefined) existingMatch.awayScore = ftag;
      if (hthg !== undefined) existingMatch.halftimeHomeScore = hthg;
      if (htag !== undefined) existingMatch.halftimeAwayScore = htag;
      existingMatch.stats = { ...(existingMatch.stats || {}), ...statsObj };
      existingMatch.odds = { ...(existingMatch.odds || {}), ...oddsObj };
    } else {
      const nextNum = matches.length + 1;
      const matchId = `JOGO-${String(nextNum).padStart(3, '0')}`;
      const newMatch: Match = {
        id: matchId,
        date: isoDate,
        status,
        countryId: country.id,
        countryName: country.name,
        leagueId: league.id,
        leagueName: league.name,
        homeTeamId: homeTeam.id,
        homeTeamName: homeTeam.name,
        homeTeamLogoUrl: homeTeam.logoUrl || undefined,
        awayTeamId: awayTeam.id,
        awayTeamName: awayTeam.name,
        awayTeamLogoUrl: awayTeam.logoUrl || undefined,
        homeScore: fthg,
        awayScore: ftag,
        halftimeHomeScore: hthg,
        halftimeAwayScore: htag,
        stats: statsObj,
        odds: oddsObj,
        createdAt: new Date().toISOString(),
      };
      matches.push(newMatch);
      matchesMap.set(mKey, newMatch);
      newMatchesCount++;
    }
  }

  const updatedDb: DbState = {
    countries,
    leagues,
    teams,
    matches,
  };

  const result: ClientSyncResult = {
    success: parsedRows.length > 0,
    message: `Importação concluída com sucesso: +${newTeamsCount} novos times, +${newLeaguesCount} novas ligas, +${newCountriesCount} novos países e +${newMatchesCount} novas partidas cadastradas!`,
    totalCountries: countries.length,
    totalLeagues: leagues.length,
    totalTeams: teams.length,
    totalMatches: matches.length,
    newCountriesCount,
    newLeaguesCount,
    newTeamsCount,
    newMatchesCount,
  };

  return { updatedDb, result };
}

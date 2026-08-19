import fs from 'fs';
import path from 'path';

export interface SyncResult {
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
  errors?: string[];
}

export const LIGAS_INFO = [
  { countryCode: 'ING', leagueName: 'Premier League', url: 'https://www.football-data.co.uk/mmz4281/2627/E0.csv' },
  { countryCode: 'ING', leagueName: 'Championship', url: 'https://www.football-data.co.uk/mmz4281/2627/E1.csv' },
  { countryCode: 'ING', leagueName: 'League 1', url: 'https://www.football-data.co.uk/mmz4281/2627/E2.csv' },
  { countryCode: 'ING', leagueName: 'League 2', url: 'https://www.football-data.co.uk/mmz4281/2627/E3.csv' },
  { countryCode: 'ESC', leagueName: 'Premiere League', url: 'https://www.football-data.co.uk/mmz4281/2627/SC0.csv' },
  { countryCode: 'ESC', leagueName: 'Division 1', url: 'https://www.football-data.co.uk/mmz4281/2627/SC1.csv' },
  { countryCode: 'ESC', leagueName: 'Division 2', url: 'https://www.football-data.co.uk/mmz4281/2627/SC2.csv' },
  { countryCode: 'ESC', leagueName: 'Division 3', url: 'https://www.football-data.co.uk/mmz4281/2627/SC3.csv' },
  { countryCode: 'ALE', leagueName: 'Bundesliga 1', url: 'https://www.football-data.co.uk/mmz4281/2627/D1.csv' },
  { countryCode: 'ALE', leagueName: 'Bundesliga 2', url: 'https://www.football-data.co.uk/mmz4281/2627/D2.csv' },
  { countryCode: 'ITA', leagueName: 'Serie A', url: 'https://www.football-data.co.uk/mmz4281/2627/I1.csv' },
  { countryCode: 'ITA', leagueName: 'Serie B', url: 'https://www.football-data.co.uk/mmz4281/2627/I2.csv' },
  { countryCode: 'ESP', leagueName: 'La Liga 1', url: 'https://www.football-data.co.uk/mmz4281/2627/SP1.csv' },
  { countryCode: 'ESP', leagueName: 'La Liga 2', url: 'https://www.football-data.co.uk/mmz4281/2627/SP2.csv' },
  { countryCode: 'FRA', leagueName: 'Le Championnat', url: 'https://www.football-data.co.uk/mmz4281/2627/F1.csv' },
  { countryCode: 'FRA', leagueName: 'Division 2', url: 'https://www.football-data.co.uk/mmz4281/2627/F2.csv' },
  { countryCode: 'HOL', leagueName: 'Eredivisie', url: 'https://www.football-data.co.uk/mmz4281/2627/N1.csv' },
  { countryCode: 'BEL', leagueName: 'Jupiler League', url: 'https://www.football-data.co.uk/mmz4281/2627/B1.csv' },
  { countryCode: 'POR', leagueName: 'Liga I', url: 'https://www.football-data.co.uk/mmz4281/2627/P1.csv' },
  { countryCode: 'TUR', leagueName: 'Futbol Ligi 1', url: 'https://www.football-data.co.uk/mmz4281/2627/T1.csv' },
  { countryCode: 'GRE', leagueName: 'Ethniki Katigoria', url: 'https://www.football-data.co.uk/mmz4281/2526/G1.csv' },
];

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

function parseCsvLines(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Simple robust CSV parser for football-data format
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

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function safeNum(val: any): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? undefined : num;
}

export function processMatchRows(
  rows: Array<{
    countryCode: string;
    leagueName: string;
    row: Record<string, string>;
  }>,
  currentDb: any
): { updatedDb: any; stats: { newCountries: number; newLeagues: number; newTeams: number; newMatches: number } } {
  const countries = [...(currentDb.countries || [])];
  const leagues = [...(currentDb.leagues || [])];
  const teams = [...(currentDb.teams || [])];
  const matches = [...(currentDb.matches || [])];

  const countriesMap = new Map<string, any>();
  countries.forEach(c => {
    countriesMap.set(c.code?.toUpperCase() || c.name?.toUpperCase(), c);
    countriesMap.set(c.name?.toUpperCase(), c);
  });

  const leaguesMap = new Map<string, any>();
  leagues.forEach(l => {
    leaguesMap.set(`${l.countryId}_${l.name?.toUpperCase()}`, l);
  });

  const teamsMap = new Map<string, any>();
  teams.forEach(t => {
    teamsMap.set(`${t.countryId}_${t.name?.toUpperCase()}`, t);
  });

  const matchesMap = new Map<string, any>();
  matches.forEach(m => {
    const dateKey = m.date ? m.date.substring(0, 10) : '';
    matchesMap.set(`${dateKey}_${m.homeTeamId}_${m.awayTeamId}`, m);
  });

  let newCountries = 0;
  let newLeagues = 0;
  let newTeams = 0;
  let newMatches = 0;

  for (const item of rows) {
    const { countryCode, leagueName, row } = item;
    const homeName = (row['HomeTeam'] || row['Home'] || row['MANDANTE'] || '').trim();
    const awayName = (row['AwayTeam'] || row['Away'] || row['VISITANTE'] || '').trim();

    if (!homeName || !awayName) continue;

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
      newCountries++;
    }

    // 2. Ensure League
    const lKey = `${country.id}_${leagueName.toUpperCase()}`;
    let league = leaguesMap.get(lKey);
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
      newLeagues++;
    }

    // 3. Ensure Home Team
    const htKey = `${country.id}_${homeName.toUpperCase()}`;
    let homeTeam = teamsMap.get(htKey);
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
      newTeams++;
    }

    // 4. Ensure Away Team
    const atKey = `${country.id}_${awayName.toUpperCase()}`;
    let awayTeam = teamsMap.get(atKey);
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
      newTeams++;
    }

    // 5. Match Processing
    const dateStr = row['Date'] || row['DATE'] || row['DATA'] || '';
    const timeStr = row['Time'] || row['TIME'] || row['HORA'] || '';
    const isoDate = parseDate(dateStr, timeStr);
    const dateKey = isoDate.substring(0, 10);
    const mKey = `${dateKey}_${homeTeam.id}_${awayTeam.id}`;

    const fthg = safeNum(row['FTHG'] ?? row['HG'] ?? row['GOLS_MANDANTE']);
    const ftag = safeNum(row['FTAG'] ?? row['AG'] ?? row['GOLS_VISITANTE']);
    const hthg = safeNum(row['HTHG']);
    const htag = safeNum(row['HTAG']);

    const isFinished = fthg !== undefined && ftag !== undefined;
    const status = isFinished ? 'FINISHED' : 'SCHEDULED';

    const hs = safeNum(row['HS'] ?? row['CHUTES_MANDANTE']);
    const as = safeNum(row['AS'] ?? row['CHUTES_VISITANTE']);
    const hst = safeNum(row['HST'] ?? row['CHUTES_GOL_MANDANTE']);
    const ast = safeNum(row['AST'] ?? row['CHUTES_GOL_VISITANTE']);
    const hc = safeNum(row['HC'] ?? row['ESCANTEIOS_MANDANTE']);
    const ac = safeNum(row['AC'] ?? row['ESCANTEIOS_VISITANTE']);
    const hy = safeNum(row['HY'] ?? row['AMARELOS_MANDANTE']);
    const ay = safeNum(row['AY'] ?? row['AMARELOS_VISITANTE']);
    const hr = safeNum(row['HR'] ?? row['VERMELHOS_MANDANTE']);
    const ar = safeNum(row['AR'] ?? row['VERMELHOS_VISITANTE']);
    const hf = safeNum(row['HF'] ?? row['FALTAS_MANDANTE']);
    const af = safeNum(row['AF'] ?? row['FALTAS_VISITANTE']);

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

    const b365H = safeNum(row['B365H'] ?? row['ODD_H']);
    const b365D = safeNum(row['B365D'] ?? row['ODD_D']);
    const b365A = safeNum(row['B365A'] ?? row['ODD_A']);
    const over25 = safeNum(row['B365>2.5'] ?? row['BbAv>2.5'] ?? row['ODD_OVER25']);
    const under25 = safeNum(row['B365<2.5'] ?? row['BbAv<2.5'] ?? row['ODD_UNDER25']);

    const oddsObj = {
      homeWin: b365H,
      draw: b365D,
      awayWin: b365A,
      over25,
      under25,
    };

    let existingMatch = matchesMap.get(mKey);
    if (existingMatch) {
      // Update existing match
      existingMatch.date = isoDate;
      existingMatch.status = status;
      if (fthg !== undefined) existingMatch.homeScore = fthg;
      if (ftag !== undefined) existingMatch.awayScore = ftag;
      if (hthg !== undefined) existingMatch.halftimeHomeScore = hthg;
      if (htag !== undefined) existingMatch.halftimeAwayScore = htag;
      existingMatch.stats = { ...(existingMatch.stats || {}), ...statsObj };
      existingMatch.odds = { ...(existingMatch.odds || {}), ...oddsObj };
    } else {
      // Create new match
      const nextNum = matches.length + 1;
      const matchId = `JOGO-${String(nextNum).padStart(3, '0')}`;
      const newMatch = {
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
      newMatches++;
    }
  }

  return {
    updatedDb: {
      countries,
      leagues,
      teams,
      matches,
    },
    stats: {
      newCountries,
      newLeagues,
      newTeams,
      newMatches,
    },
  };
}

export async function syncOnlineFootballData(currentDb: any): Promise<{ updatedDb: any; result: SyncResult }> {
  const allRows: Array<{ countryCode: string; leagueName: string; row: Record<string, string> }> = [];
  const errors: string[] = [];

  for (const league of LIGAS_INFO) {
    try {
      const response = await fetch(league.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!response.ok) {
        errors.push(`Falha ao baixar ${league.leagueName} (${league.countryCode}): HTTP ${response.status}`);
        continue;
      }
      const csvText = await response.text();
      const parsed = parseCsvLines(csvText);
      for (const r of parsed) {
        allRows.push({
          countryCode: league.countryCode,
          leagueName: league.leagueName,
          row: r,
        });
      }
    } catch (err: any) {
      errors.push(`Erro em ${league.leagueName}: ${err.message || String(err)}`);
    }
  }

  const { updatedDb, stats } = processMatchRows(allRows, currentDb);

  const result: SyncResult = {
    success: allRows.length > 0,
    message: `Sincronização concluída: ${stats.newTeams} novos times, ${stats.newLeagues} novas ligas, ${stats.newCountries} novos países e ${stats.newMatches} novas partidas cadastradas!`,
    totalCountries: updatedDb.countries.length,
    totalLeagues: updatedDb.leagues.length,
    totalTeams: updatedDb.teams.length,
    totalMatches: updatedDb.matches.length,
    newCountriesCount: stats.newCountries,
    newLeaguesCount: stats.newLeagues,
    newTeamsCount: stats.newTeams,
    newMatchesCount: stats.newMatches,
    errors: errors.length > 0 ? errors : undefined,
  };

  return { updatedDb, result };
}

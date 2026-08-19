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
  { countryCode: 'ING', leagueName: 'Premier League ING', url: 'https://www.football-data.co.uk/mmz4281/2627/E0.csv' },
  { countryCode: 'ING', leagueName: 'Championship ING', url: 'https://www.football-data.co.uk/mmz4281/2627/E1.csv' },
  { countryCode: 'ING', leagueName: 'League 1 ING', url: 'https://www.football-data.co.uk/mmz4281/2627/E2.csv' },
  { countryCode: 'ING', leagueName: 'League 2 ING', url: 'https://www.football-data.co.uk/mmz4281/2627/E3.csv' },
  { countryCode: 'ESC', leagueName: 'Premiere League ESC', url: 'https://www.football-data.co.uk/mmz4281/2627/SC0.csv' },
  { countryCode: 'ESC', leagueName: 'Division 1 ESC', url: 'https://www.football-data.co.uk/mmz4281/2627/SC1.csv' },
  { countryCode: 'ESC', leagueName: 'Division 2 ESC', url: 'https://www.football-data.co.uk/mmz4281/2627/SC2.csv' },
  { countryCode: 'ESC', leagueName: 'Division 3 ESC', url: 'https://www.football-data.co.uk/mmz4281/2627/SC3.csv' },
  { countryCode: 'ALE', leagueName: 'Bundesliga 1 ALE', url: 'https://www.football-data.co.uk/mmz4281/2627/D1.csv' },
  { countryCode: 'ALE', leagueName: 'Bundesliga 2 ALE', url: 'https://www.football-data.co.uk/mmz4281/2627/D2.csv' },
  { countryCode: 'ITA', leagueName: 'Serie A ITA', url: 'https://www.football-data.co.uk/mmz4281/2627/I1.csv' },
  { countryCode: 'ITA', leagueName: 'Serie B ITA', url: 'https://www.football-data.co.uk/mmz4281/2627/I2.csv' },
  { countryCode: 'ESP', leagueName: 'La Liga 1 ESP', url: 'https://www.football-data.co.uk/mmz4281/2627/SP1.csv' },
  { countryCode: 'ESP', leagueName: 'La Liga 2 ESP', url: 'https://www.football-data.co.uk/mmz4281/2627/SP2.csv' },
  { countryCode: 'FRA', leagueName: 'Le Championnat FRA', url: 'https://www.football-data.co.uk/mmz4281/2627/F1.csv' },
  { countryCode: 'FRA', leagueName: 'Division 2 FRA', url: 'https://www.football-data.co.uk/mmz4281/2627/F2.csv' },
  { countryCode: 'HOL', leagueName: 'Eredivisie HOL', url: 'https://www.football-data.co.uk/mmz4281/2627/N1.csv' },
  { countryCode: 'BEL', leagueName: 'Jupiler League BEL', url: 'https://www.football-data.co.uk/mmz4281/2627/B1.csv' },
  { countryCode: 'POR', leagueName: 'Liga I POR', url: 'https://www.football-data.co.uk/mmz4281/2627/P1.csv' },
  { countryCode: 'TUR', leagueName: 'Futbol Ligi 1 TUR', url: 'https://www.football-data.co.uk/mmz4281/2627/T1.csv' },
  { countryCode: 'GRE', leagueName: 'Ethniki Katigoria GRE', url: 'https://www.football-data.co.uk/mmz4281/2627/G1.csv' },
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

export const DIV_MAP: Record<string, { countryCode: string; leagueName: string }> = {
  E0: { countryCode: 'ING', leagueName: 'Premier League ING' },
  E1: { countryCode: 'ING', leagueName: 'Championship ING' },
  E2: { countryCode: 'ING', leagueName: 'League 1 ING' },
  E3: { countryCode: 'ING', leagueName: 'League 2 ING' },
  SC0: { countryCode: 'ESC', leagueName: 'Premiere League ESC' },
  SC1: { countryCode: 'ESC', leagueName: 'Division 1 ESC' },
  SC2: { countryCode: 'ESC', leagueName: 'Division 2 ESC' },
  SC3: { countryCode: 'ESC', leagueName: 'Division 3 ESC' },
  D1: { countryCode: 'ALE', leagueName: 'Bundesliga 1 ALE' },
  D2: { countryCode: 'ALE', leagueName: 'Bundesliga 2 ALE' },
  I1: { countryCode: 'ITA', leagueName: 'Serie A ITA' },
  I2: { countryCode: 'ITA', leagueName: 'Serie B ITA' },
  SP1: { countryCode: 'ESP', leagueName: 'La Liga 1 ESP' },
  SP2: { countryCode: 'ESP', leagueName: 'La Liga 2 ESP' },
  F1: { countryCode: 'FRA', leagueName: 'Le Championnat FRA' },
  F2: { countryCode: 'FRA', leagueName: 'Division 2 FRA' },
  N1: { countryCode: 'HOL', leagueName: 'Eredivisie HOL' },
  B1: { countryCode: 'BEL', leagueName: 'Jupiler League BEL' },
  P1: { countryCode: 'POR', leagueName: 'Liga I POR' },
  T1: { countryCode: 'TUR', leagueName: 'Futbol Ligi 1 TUR' },
  G1: { countryCode: 'GRE', leagueName: 'Ethniki Katigoria GRE' },
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

function safeNum(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? null : num;
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
    if (c.code) countriesMap.set(c.code.toUpperCase(), c);
    if (c.name) countriesMap.set(c.name.toUpperCase(), c);
    countriesMap.set(c.id, c);
  });

  const leaguesMap = new Map<string, any>();
  leagues.forEach(l => {
    leaguesMap.set(`${l.countryId}_${l.name.toUpperCase()}`, l);
    leaguesMap.set(l.name.toUpperCase(), l);
  });

  const teamsMap = new Map<string, any>();
  teams.forEach(t => {
    teamsMap.set(`${t.countryId}_${t.name.toUpperCase()}`, t);
    teamsMap.set(t.name.toUpperCase(), t);
  });

  const matchesMap = new Map<string, any>();
  matches.forEach(m => {
    const dateKey = m.matchDate ? m.matchDate.substring(0, 10) : '';
    matchesMap.set(`${dateKey}_${m.homeTeamId}_${m.awayTeamId}`, m);
    matchesMap.set(`${m.homeTeamId}_${m.awayTeamId}`, m);
    matchesMap.set(m.id, m);
  });

  let newCountries = 0;
  let newLeagues = 0;
  let newTeams = 0;
  let newMatches = 0;

  for (const { countryCode, leagueName: defaultLeagueName, row } of rows) {
    const homeName = (row['Mandante'] || row['HomeTeam'] || row['Home'] || row['MANDANTE'] || '').trim();
    const awayName = (row['Visitante'] || row['AwayTeam'] || row['Away'] || row['VISITANTE'] || '').trim();

    if (!homeName || !awayName) continue;

    let cCode = (row['Pais'] || row['PAIS'] || countryCode || '').trim();
    let lName = (row['Liga'] || row['LIGA'] || defaultLeagueName || '').trim();

    const div = (row['Div'] || row['DIV'] || row['ï»¿Div'] || '').trim();
    if (div && DIV_MAP[div]) {
      if (!cCode) cCode = DIV_MAP[div].countryCode;
      if (!lName) lName = DIV_MAP[div].leagueName;
    }

    if (!cCode) cCode = 'INT';
    const friendlyCountryName = COUNTRY_NAMES[cCode.toUpperCase()] || cCode;
    if (!lName) lName = `Liga Principal ${cCode}`;

    // 1. Ensure Country
    const cKey = cCode.toUpperCase();
    let country = countriesMap.get(cKey) || countriesMap.get(friendlyCountryName.toUpperCase());
    if (!country) {
      const nextNum = countries.length + 1;
      const id = `PAIS-${String(nextNum).padStart(3, '0')}`;
      country = {
        id,
        name: friendlyCountryName,
        code: cCode.length <= 3 ? cCode.toUpperCase() : undefined,
        createdAt: new Date().toISOString(),
      };
      countries.push(country);
      countriesMap.set(cKey, country);
      countriesMap.set(country.name.toUpperCase(), country);
      newCountries++;
    }

    // 2. Ensure League
    const lKey = `${country.id}_${lName.toUpperCase()}`;
    let league = leaguesMap.get(lKey) || leaguesMap.get(lName.toUpperCase());
    if (!league) {
      const nextNum = leagues.length + 1;
      const id = `LIGA-${String(nextNum).padStart(3, '0')}`;
      league = {
        id,
        name: lName,
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
      newTeams++;
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
      newTeams++;
    }

    // 5. Match details
    const dateStr = row['Data'] || row['Date'] || row['DATE'] || row['DATA'] || '';
    const timeStr = row['Hora'] || row['Time'] || row['TIME'] || row['HORA'] || '';
    const isoDate = parseDate(dateStr, timeStr);
    const dateKey = isoDate.substring(0, 10);
    const mKey = `${dateKey}_${homeTeam.id}_${awayTeam.id}`;

    const fthg = safeNum(row['Placar_Mandante_FT'] ?? row['FTHG'] ?? row['HG']);
    const ftag = safeNum(row['Placar_Visitante_FT'] ?? row['FTAG'] ?? row['AG']);
    const hthg = safeNum(row['Placar_Mandante_HT'] ?? row['HTHG']);
    const htag = safeNum(row['Placar_Visitante_HT'] ?? row['HTAG']);
    const referee = (row['Arbitro'] || row['Referee'] || '').trim() || undefined;

    const isFinished = fthg !== null && ftag !== null;
    const status = isFinished ? 'FINALIZADO' : 'AGENDADO';

    // Stats
    const statsObj = {
      halftimeHomeScore: hthg,
      halftimeAwayScore: htag,
      xgHomeFT: safeNum(row['xG_Mandante_FT'] ?? row['HxG']),
      xgAwayFT: safeNum(row['xG_Visitante_FT'] ?? row['AxG']),
      shotsHomeFT: safeNum(row['Finalizacoes_Mandante_FT'] ?? row['HS']),
      shotsAwayFT: safeNum(row['Finalizacoes_Visitante_FT'] ?? row['AS']),
      shotsOnTargetHomeFT: safeNum(row['Chutes_Gol_Mandante_FT'] ?? row['HST']),
      shotsOnTargetAwayFT: safeNum(row['Chutes_Gol_Visitante_FT'] ?? row['AST']),
      foulsHomeFT: safeNum(row['Faltas_Mandante_FT'] ?? row['HF']),
      foulsAwayFT: safeNum(row['Faltas_Visitante_FT'] ?? row['AF']),
      cornersHomeFT: safeNum(row['Escanteios_Mandante_FT'] ?? row['HC']),
      cornersAwayFT: safeNum(row['Escanteios_Visitante_FT'] ?? row['AC']),
      yellowCardsHomeFT: safeNum(row['Cartao_Amarelo_Mandante_FT'] ?? row['HY']),
      yellowCardsAwayFT: safeNum(row['Cartao_Amarelo_Visitante_FT'] ?? row['AY']),
      redCardsHomeFT: safeNum(row['Cartao_Vermelho_Mandante_FT'] ?? row['HR']),
      redCardsAwayFT: safeNum(row['Cartao_Vermelho_Visitante_FT'] ?? row['AR']),
    };

    // Odds & Asian Handicap
    const ahHomeLine = safeNum(row['Linha_Handicap_Asiático_Mandante_FT'] ?? row['AHh']);
    const ahHomeOdd = safeNum(row['Odd_Handicap_Asiático_Mandante_FT'] ?? row['B365AHH']);
    let ahAwayLine = safeNum(row['Linha_Handicap_Asiático_Visitante_FT'] ?? row['AHa']);
    if (ahAwayLine === null && ahHomeLine !== null) {
      ahAwayLine = -ahHomeLine;
    }
    const ahAwayOdd = safeNum(row['Odd_Handicap_Asiático_Visitante_FT'] ?? row['B365AHA']);

    const oddsObj = {
      homeFT: safeNum(row['Odd_Home_FT'] ?? row['B365H']),
      drawFT: safeNum(row['Odd_Draw_FT'] ?? row['B365D']),
      awayFT: safeNum(row['Odd_Away_FT'] ?? row['B365A']),
      over25FT: safeNum(row['Odd_Over25_FT'] ?? row['B365>2.5']),
      under25FT: safeNum(row['Odd_Under25_FT'] ?? row['B365<2.5']),
      asianHandicapHomeLine: ahHomeLine,
      asianHandicapHomeOdd: ahHomeOdd,
      asianHandicapAwayLine: ahAwayLine,
      asianHandicapAwayOdd: ahAwayOdd,
    };

    let existingMatch = matchesMap.get(mKey);
    if (existingMatch) {
      existingMatch.matchDate = isoDate;
      existingMatch.status = status;
      if (fthg !== null) existingMatch.homeScore = fthg;
      if (ftag !== null) existingMatch.awayScore = ftag;
      if (referee) existingMatch.referee = referee;
      existingMatch.stats = { ...(existingMatch.stats || {}), ...statsObj };
      existingMatch.odds = { ...(existingMatch.odds || {}), ...oddsObj };
    } else {
      const nextNum = matches.length + 1;
      const matchId = `JOGO-${String(nextNum).padStart(3, '0')}`;
      const newMatch = {
        id: matchId,
        matchDate: isoDate,
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
        referee,
        stats: statsObj,
        odds: oddsObj,
        createdAt: new Date().toISOString(),
      };
      matches.push(newMatch);
      matchesMap.set(mKey, newMatch);
      newMatches++;
    }
  }

  const updatedDb = {
    countries,
    leagues,
    teams,
    matches,
  };

  return {
    updatedDb,
    stats: {
      newCountries,
      newLeagues,
      newTeams,
      newMatches,
    },
  };
}

export function importCustomCsvText(csvText: string, currentDb: any): { updatedDb: any; result: SyncResult } {
  const parsedRows = parseCsvLines(csvText);
  const rowsToProcess = parsedRows.map(row => ({
    countryCode: row['Pais'] || row['PAIS'] || row['Country'] || '',
    leagueName: row['Liga'] || row['LIGA'] || row['League'] || '',
    row,
  }));

  const { updatedDb, stats } = processMatchRows(rowsToProcess, currentDb);

  const result: SyncResult = {
    success: parsedRows.length > 0,
    message: `Importação manual concluída: +${stats.newTeams} times, +${stats.newLeagues} ligas, +${stats.newCountries} países e +${stats.newMatches} jogos consolidados!`,
    totalCountries: updatedDb.countries.length,
    totalLeagues: updatedDb.leagues.length,
    totalTeams: updatedDb.teams.length,
    totalMatches: updatedDb.matches.length,
    newCountriesCount: stats.newCountries,
    newLeaguesCount: stats.newLeagues,
    newTeamsCount: stats.newTeams,
    newMatchesCount: stats.newMatches,
  };

  return { updatedDb, result };
}

export async function syncOnlineFootballData(currentDb: any): Promise<{ updatedDb: any; result: SyncResult }> {
  const allRows: Array<{ countryCode: string; leagueName: string; row: Record<string, string> }> = [];
  const errors: string[] = [];

  for (const item of LIGAS_INFO) {
    try {
      const resp = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      if (!resp.ok) {
        errors.push(`${item.countryCode} - ${item.leagueName}: HTTP ${resp.status}`);
        continue;
      }

      const csvText = await resp.text();
      const parsed = parseCsvLines(csvText);

      parsed.forEach(row => {
        allRows.push({
          countryCode: item.countryCode,
          leagueName: item.leagueName,
          row,
        });
      });
    } catch (err: any) {
      errors.push(`${item.countryCode} - ${item.leagueName}: ${err.message || String(err)}`);
    }
  }

  const { updatedDb, stats } = processMatchRows(allRows, currentDb);

  const result: SyncResult = {
    success: allRows.length > 0,
    message: `Sincronização concluída: +${stats.newTeams} times, +${stats.newLeagues} ligas, +${stats.newCountries} países e +${stats.newMatches} jogos consolidados!`,
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

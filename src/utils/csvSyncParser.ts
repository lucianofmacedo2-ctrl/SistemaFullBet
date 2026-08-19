import { DbState, Country, League, Team, Match, MatchStats, MatchOdds } from '../types';

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

function safeNum(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? null : num;
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
    const dateKey = m.matchDate ? m.matchDate.substring(0, 10) : '';
    matchesMap.set(`${dateKey}_${m.homeTeamId}_${m.awayTeamId}`, m);
    matchesMap.set(`${m.homeTeamId}_${m.awayTeamId}`, m);
    matchesMap.set(m.id, m);
  });

  let newCountriesCount = 0;
  let newLeaguesCount = 0;
  let newTeamsCount = 0;
  let newMatchesCount = 0;

  for (const r of parsedRows) {
    const homeName = (r['Mandante'] || r['HomeTeam'] || r['Home'] || r['MANDANTE'] || '').trim();
    const awayName = (r['Visitante'] || r['AwayTeam'] || r['Away'] || r['VISITANTE'] || '').trim();

    if (!homeName || !awayName) continue;

    let countryCodeOrName = (r['Pais'] || r['PAIS'] || r['Country'] || r['COUNTRY'] || '').trim();
    let leagueName = (r['Liga'] || r['LIGA'] || r['League'] || r['LEAGUE'] || '').trim();

    // Check Div code mapping (e.g. E0, SP1, D1)
    const div = (r['Div'] || r['DIV'] || r['ï»¿Div'] || '').trim();
    if (div && DIV_MAP[div]) {
      if (!countryCodeOrName) countryCodeOrName = DIV_MAP[div].countryCode;
      if (!leagueName) leagueName = DIV_MAP[div].leagueName;
    }

    if (!countryCodeOrName) countryCodeOrName = 'INT';
    const friendlyCountryName = COUNTRY_NAMES[countryCodeOrName.toUpperCase()] || countryCodeOrName;
    if (!leagueName) leagueName = `Liga Principal ${countryCodeOrName}`;

    // 1. Ensure Country
    const cKey = countryCodeOrName.toUpperCase();
    let country = countriesMap.get(cKey) || countriesMap.get(friendlyCountryName.toUpperCase());
    if (!country) {
      const nextNum = countries.length + 1;
      const id = `PAIS-${String(nextNum).padStart(3, '0')}`;
      country = {
        id,
        name: friendlyCountryName,
        code: countryCodeOrName.length <= 3 ? countryCodeOrName.toUpperCase() : undefined,
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

    // 5. Process Match Info
    const dateStr = r['Data'] || r['Date'] || r['DATE'] || r['DATA'] || '';
    const timeStr = r['Hora'] || r['Time'] || r['TIME'] || r['HORA'] || '';
    const isoDate = parseDate(dateStr, timeStr);
    const dateKey = isoDate.substring(0, 10);
    const mKey = `${dateKey}_${homeTeam.id}_${awayTeam.id}`;

    const fthg = safeNum(r['Placar_Mandante_FT'] ?? r['FTHG'] ?? r['HG'] ?? r['GOLS_MANDANTE']);
    const ftag = safeNum(r['Placar_Visitante_FT'] ?? r['FTAG'] ?? r['AG'] ?? r['GOLS_VISITANTE']);
    const hthg = safeNum(r['Placar_Mandante_HT'] ?? r['HTHG']);
    const htag = safeNum(r['Placar_Visitante_HT'] ?? r['HTAG']);
    const referee = (r['Arbitro'] || r['Referee'] || r['ARBITRO'] || '').trim() || undefined;

    const isFinished = fthg !== null && ftag !== null;
    const status = isFinished ? 'FINALIZADO' : 'AGENDADO';

    // Exact Stats matching user's columns
    const xgHome = safeNum(r['xG_Mandante_FT'] ?? r['HxG']);
    const xgAway = safeNum(r['xG_Visitante_FT'] ?? r['AxG']);
    const shotsHome = safeNum(r['Finalizacoes_Mandante_FT'] ?? r['HS'] ?? r['CHUTES_MANDANTE']);
    const shotsAway = safeNum(r['Finalizacoes_Visitante_FT'] ?? r['AS'] ?? r['CHUTES_VISITANTE']);
    const shotsOnTargetHome = safeNum(r['Chutes_Gol_Mandante_FT'] ?? r['HST'] ?? r['CHUTES_GOL_MANDANTE']);
    const shotsOnTargetAway = safeNum(r['Chutes_Gol_Visitante_FT'] ?? r['AST'] ?? r['CHUTES_GOL_VISITANTE']);
    const foulsHome = safeNum(r['Faltas_Mandante_FT'] ?? r['HF'] ?? r['FALTAS_MANDANTE']);
    const foulsAway = safeNum(r['Faltas_Visitante_FT'] ?? r['AF'] ?? r['FALTAS_VISITANTE']);
    const cornersHome = safeNum(r['Escanteios_Mandante_FT'] ?? r['HC'] ?? r['ESCANTEIOS_MANDANTE']);
    const cornersAway = safeNum(r['Escanteios_Visitante_FT'] ?? r['AC'] ?? r['ESCANTEIOS_VISITANTE']);
    const yellowHome = safeNum(r['Cartao_Amarelo_Mandante_FT'] ?? r['HY'] ?? r['AMARELOS_MANDANTE']);
    const yellowAway = safeNum(r['Cartao_Amarelo_Visitante_FT'] ?? r['AY'] ?? r['AMARELOS_VISITANTE']);
    const redHome = safeNum(r['Cartao_Vermelho_Mandante_FT'] ?? r['HR'] ?? r['VERMELHOS_MANDANTE']);
    const redAway = safeNum(r['Cartao_Vermelho_Visitante_FT'] ?? r['AR'] ?? r['VERMELHOS_VISITANTE']);

    const statsObj: MatchStats = {
      halftimeHomeScore: hthg,
      halftimeAwayScore: htag,
      xgHomeFT: xgHome,
      xgAwayFT: xgAway,
      shotsHomeFT: shotsHome,
      shotsAwayFT: shotsAway,
      shotsOnTargetHomeFT: shotsOnTargetHome,
      shotsOnTargetAwayFT: shotsOnTargetAway,
      foulsHomeFT: foulsHome,
      foulsAwayFT: foulsAway,
      cornersHomeFT: cornersHome,
      cornersAwayFT: cornersAway,
      yellowCardsHomeFT: yellowHome,
      yellowCardsAwayFT: yellowAway,
      redCardsHomeFT: redHome,
      redCardsAwayFT: redAway,
    };

    // Exact Odds matching user's columns
    const oddHome = safeNum(r['Odd_Home_FT'] ?? r['B365H']);
    const oddDraw = safeNum(r['Odd_Draw_FT'] ?? r['B365D']);
    const oddAway = safeNum(r['Odd_Away_FT'] ?? r['B365A']);
    const oddOver25 = safeNum(r['Odd_Over25_FT'] ?? r['B365>2.5']);
    const oddUnder25 = safeNum(r['Odd_Under25_FT'] ?? r['B365<2.5']);

    // Asian Handicap
    const ahHomeLine = safeNum(r['Linha_Handicap_Asiático_Mandante_FT'] ?? r['AHh']);
    const ahHomeOdd = safeNum(r['Odd_Handicap_Asiático_Mandante_FT'] ?? r['B365AHH']);
    let ahAwayLine = safeNum(r['Linha_Handicap_Asiático_Visitante_FT'] ?? r['AHa']);
    if (ahAwayLine === null && ahHomeLine !== null) {
      ahAwayLine = -ahHomeLine;
    }
    const ahAwayOdd = safeNum(r['Odd_Handicap_Asiático_Visitante_FT'] ?? r['B365AHA']);

    const oddsObj: MatchOdds = {
      homeFT: oddHome,
      drawFT: oddDraw,
      awayFT: oddAway,
      over25FT: oddOver25,
      under25FT: oddUnder25,
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
      const newMatch: Match = {
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
    message: `Processamento concluído com sucesso: +${newTeamsCount} times, +${newLeaguesCount} ligas, +${newCountriesCount} países e +${newMatchesCount} jogos consolidados!`,
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

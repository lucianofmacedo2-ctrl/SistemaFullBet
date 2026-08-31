import { DbState, Country, League, Team, Match, MatchStats, MatchOdds } from '../types';

import { sanitizeAndCleanDb, lookupCanonicalTeam } from './dbSanitizer';

export interface ClientSyncResult {
  success: boolean;
  message: string;
  totalCountries: number;
  totalLeagues: number;
  totalTeams: number;
  totalMatches: number;
  finishedMatchesCount?: number;
  futureMatchesCount?: number;
  newCountriesCount: number;
  newLeaguesCount: number;
  newTeamsCount: number;
  newMatchesCount: number;
}

export const DIV_MAP: Record<string, { countryCode: string; leagueName: string }> = {
  // Holanda (Netherlands)
  N1: { countryCode: 'HOL', leagueName: 'Eredivisie HOL' },
  N2: { countryCode: 'HOL', leagueName: 'Eerste Divisie HOL' },
  // Inglaterra (England)
  E0: { countryCode: 'ING', leagueName: 'Premier League ING' },
  E1: { countryCode: 'ING', leagueName: 'Championship ING' },
  E2: { countryCode: 'ING', leagueName: 'League 1 ING' },
  E3: { countryCode: 'ING', leagueName: 'League 2 ING' },
  EC: { countryCode: 'ING', leagueName: 'National League ING' },
  // Escócia (Scotland)
  SC0: { countryCode: 'ESC', leagueName: 'Premiere League ESC' },
  SC1: { countryCode: 'ESC', leagueName: 'Division 1 ESC' },
  SC2: { countryCode: 'ESC', leagueName: 'Division 2 ESC' },
  SC3: { countryCode: 'ESC', leagueName: 'Division 3 ESC' },
  // Alemanha (Germany)
  D1: { countryCode: 'ALE', leagueName: 'Bundesliga 1 ALE' },
  D2: { countryCode: 'ALE', leagueName: 'Bundesliga 2 ALE' },
  // Itália (Italy)
  I1: { countryCode: 'ITA', leagueName: 'Serie A ITA' },
  I2: { countryCode: 'ITA', leagueName: 'Serie B ITA' },
  // Espanha (Spain)
  SP1: { countryCode: 'ESP', leagueName: 'La Liga 1 ESP' },
  SP2: { countryCode: 'ESP', leagueName: 'La Liga 2 ESP' },
  // França (France)
  F1: { countryCode: 'FRA', leagueName: 'Le Championnat FRA' },
  F2: { countryCode: 'FRA', leagueName: 'Division 2 FRA' },
  // Bélgica (Belgium)
  B1: { countryCode: 'BEL', leagueName: 'Jupiler League BEL' },
  // Portugal
  P1: { countryCode: 'POR', leagueName: 'Liga I POR' },
  P2: { countryCode: 'POR', leagueName: 'Liga Portugal 2 POR' },
  // Turquia (Turkey)
  T1: { countryCode: 'TUR', leagueName: 'Futbol Ligi 1 TUR' },
  // Grécia (Greece)
  G1: { countryCode: 'GRE', leagueName: 'Ethniki Katigoria GRE' },
  // Brasil
  BRA1: { countryCode: 'BRA', leagueName: 'Brasileirão Série A' },
  BRA2: { countryCode: 'BRA', leagueName: 'Brasileirão Série B' },
  BR1: { countryCode: 'BRA', leagueName: 'Brasileirão Série A' },
  BSA: { countryCode: 'BRA', leagueName: 'Brasileirão Série A' },
  BSB: { countryCode: 'BRA', leagueName: 'Brasileirão Série B' },
  // Argentina
  ARG1: { countryCode: 'ARG', leagueName: 'Liga Profesional' },
  ARG: { countryCode: 'ARG', leagueName: 'Liga Profesional' },
  // Outros
  AUT1: { countryCode: 'AUT', leagueName: 'Austrian Bundesliga' },
  SUI1: { countryCode: 'SUI', leagueName: 'Swiss Super League' },
  DEN1: { countryCode: 'DEN', leagueName: 'Danish Superliga' },
  NOR1: { countryCode: 'NOR', leagueName: 'Eliteserien' },
  SWE1: { countryCode: 'SWE', leagueName: 'Allsvenskan' },
  MLS: { countryCode: 'USA', leagueName: 'Major League Soccer' },
  USA1: { countryCode: 'USA', leagueName: 'Major League Soccer' },
  MEX1: { countryCode: 'MEX', leagueName: 'Liga MX' },
};

export const COUNTRY_NAMES: Record<string, string> = {
  // Holanda
  HOL: 'Holanda',
  NED: 'Holanda',
  NLD: 'Holanda',
  HOLLAND: 'Holanda',
  NETHERLANDS: 'Holanda',
  PAISES_BAIXOS: 'Holanda',
  'PAÍSES BAIXOS': 'Holanda',
  'PAISES BAIXOS': 'Holanda',
  // Inglaterra
  ING: 'Inglaterra',
  ENG: 'Inglaterra',
  ENGLAND: 'Inglaterra',
  UK: 'Inglaterra',
  // Escócia
  ESC: 'Escócia',
  SCO: 'Escócia',
  SCOTLAND: 'Escócia',
  // Alemanha
  ALE: 'Alemanha',
  GER: 'Alemanha',
  GERMANY: 'Alemanha',
  DEU: 'Alemanha',
  DEUTSCHLAND: 'Alemanha',
  // Itália
  ITA: 'Itália',
  ITALY: 'Itália',
  ITALIA: 'Itália',
  // Espanha
  ESP: 'Espanha',
  SPA: 'Espanha',
  SPAIN: 'Espanha',
  ESPANA: 'Espanha',
  ESPAÑA: 'Espanha',
  // França
  FRA: 'França',
  FRANCE: 'França',
  FRANCA: 'França',
  // Bélgica
  BEL: 'Bélgica',
  BELGIUM: 'Bélgica',
  BELGICA: 'Bélgica',
  // Portugal
  POR: 'Portugal',
  PRT: 'Portugal',
  PORTUGAL: 'Portugal',
  // Turquia
  TUR: 'Turquia',
  TURKEY: 'Turquia',
  TURKIYE: 'Turquia',
  TÜRKIYE: 'Turquia',
  // Grécia
  GRE: 'Grécia',
  GRC: 'Grécia',
  GREECE: 'Grécia',
  GRECIA: 'Grécia',
  // Brasil
  BRA: 'Brasil',
  BRAZIL: 'Brasil',
  BRASIL: 'Brasil',
  // Argentina
  ARG: 'Argentina',
  ARGENTINA: 'Argentina',
  // Áustria
  AUT: 'Áustria',
  AUSTRIA: 'Áustria',
  // Suíça
  SUI: 'Suíça',
  SWI: 'Suíça',
  SWITZERLAND: 'Suíça',
  SUICA: 'Suíça',
  // Dinamarca
  DEN: 'Dinamarca',
  DNK: 'Dinamarca',
  DENMARK: 'Dinamarca',
  // Noruega
  NOR: 'Noruega',
  NORWAY: 'Noruega',
  // Suécia
  SWE: 'Suécia',
  SWEDEN: 'Suécia',
  SUECIA: 'Suécia',
  // EUA
  USA: 'Estados Unidos',
  EUA: 'Estados Unidos',
  'UNITED STATES': 'Estados Unidos',
  // México
  MEX: 'México',
  MEXICO: 'México',
};

/**
 * Detects the most appropriate delimiter (, ; \t |) based on the first few lines of CSV
 */
function detectDelimiter(text: string): string {
  const firstLines = text.split(/\r?\n/).slice(0, 5).join('\n');
  const counts: Record<string, number> = {
    ',': (firstLines.match(/,/g) || []).length,
    ';': (firstLines.match(/;/g) || []).length,
    '\t': (firstLines.match(/\t/g) || []).length,
    '|': (firstLines.match(/\|/g) || []).length,
  };

  let bestDelimiter = ',';
  let maxCount = 0;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delim;
    }
  }
  return bestDelimiter;
}

/**
 * Parses a single CSV line with quote preservation
 */
function parseCsvRow(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

/**
 * Normalizes string key for flexible header matching
 */
function normalizeHeaderKey(key: string): string {
  return key
    .replace(/^[\uFEFF\uFFFE]/, '') // Strip BOM
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents (á -> a)
    .replace(/[^a-z0-9]/g, ''); // remove spaces, underscores, dashes, quotes
}

/**
 * Parses full CSV text into array of row objects with normalized header lookup
 */
export function parseCsvLines(csvText: string): Record<string, string>[] {
  const cleanText = csvText.replace(/^[\uFEFF\uFFFE]/, '').trim();
  if (!cleanText) return [];

  const delimiter = detectDelimiter(cleanText);
  const lines = cleanText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const rawHeaders = parseCsvRow(lines[0], delimiter);
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i], delimiter);
    if (row.length === 0 || row.every(cell => !cell.trim())) continue;
    const obj: Record<string, string> = {};
    for (let j = 0; j < rawHeaders.length; j++) {
      const header = rawHeaders[j];
      const val = row[j] !== undefined ? row[j].trim() : '';
      if (header) {
        obj[header] = val;
        // Also map normalized key for resilient lookup
        const norm = normalizeHeaderKey(header);
        if (norm && !obj[norm]) {
          obj[norm] = val;
        }
      }
    }
    results.push(obj);
  }
  return results;
}

/**
 * Extracts a value from a row using multiple alias keys (case and accent insensitive)
 */
function getRowValue(row: Record<string, string>, aliases: string[]): string {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== '') {
      return row[alias].trim();
    }
    const norm = normalizeHeaderKey(alias);
    if (row[norm] !== undefined && row[norm] !== '') {
      return row[norm].trim();
    }
  }
  return '';
}

function parseDate(dateStr?: string, timeStr?: string): string {
  let year = new Date().getFullYear();
  let month = 1;
  let day = 1;

  if (dateStr && dateStr.trim()) {
    const rawDate = dateStr.trim();
    const parts = rawDate.split(/[\/\-\.]/);

    if (parts.length === 3) {
      // Check if ISO format YYYY-MM-DD
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10) || year;
        month = parseInt(parts[1], 10) || 1;
        day = parseInt(parts[2], 10) || 1;
      } else {
        // DD/MM/YYYY or DD/MM/YY
        day = parseInt(parts[0], 10) || 1;
        month = parseInt(parts[1], 10) || 1;
        let y = parseInt(parts[2], 10);
        if (y < 100) y += 2000;
        year = y || year;
      }
    }
  }

  let hours = 16;
  let mins = 0;
  if (timeStr && timeStr.trim()) {
    const tParts = timeStr.trim().split(':');
    if (tParts.length >= 2) {
      hours = parseInt(tParts[0], 10) || 0;
      mins = parseInt(tParts[1], 10) || 0;
    }
  }

  const yStr = String(year);
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  const hStr = String(hours).padStart(2, '0');
  const minStr = String(mins).padStart(2, '0');

  return `${yStr}-${mStr}-${dStr}T${hStr}:${minStr}:00`;
}

function safeNum(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(String(val).replace(',', '.').trim());
  return isNaN(num) ? null : num;
}

/**
 * Finds the highest numeric suffix in existing IDs (e.g. TIME-045 -> 45)
 */
function getHighestIdNumber(prefix: string, items: { id?: string }[]): number {
  let max = 0;
  const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  for (const item of items) {
    if (!item?.id) continue;
    const match = String(item.id).match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > max) {
        max = num;
      }
    }
  }
  return max;
}

export function parseAndSyncCsvLocally(
  csvText: string,
  currentDb: DbState,
  options?: { replaceEntireDb?: boolean }
): { updatedDb: DbState; result: ClientSyncResult } {
  const replace = options?.replaceEntireDb ?? true;
  const parsedRows = parseCsvLines(csvText);

  const countries = replace ? [] : [...(currentDb.countries || [])];
  const leagues = replace ? [] : [...(currentDb.leagues || [])];
  const teams = replace ? [] : [...(currentDb.teams || [])];
  const matches = replace ? [] : [...(currentDb.matches || [])];

  // Track highest ID numbers to ensure unique sequential IDs
  let nextCountryNum = replace ? 0 : Math.max(countries.length, getHighestIdNumber('PAIS', countries));
  let nextLeagueNum = replace ? 0 : Math.max(leagues.length, getHighestIdNumber('LIGA', leagues));
  let nextTeamNum = replace ? 0 : Math.max(teams.length, getHighestIdNumber('TIME', teams));
  let nextMatchNum = replace ? 0 : Math.max(matches.length, getHighestIdNumber('JOGO', matches));

  // Multi-index Maps for ultra-fast and resilient lookups
  const countriesMap = new Map<string, Country>();
  countries.forEach(c => {
    if (c.code) countriesMap.set(c.code.toUpperCase(), c);
    if (c.name) {
      countriesMap.set(c.name.toUpperCase(), c);
      countriesMap.set(normalizeHeaderKey(c.name), c);
    }
    countriesMap.set(c.id, c);
  });

  const leaguesMap = new Map<string, League>();
  leagues.forEach(l => {
    if (l.countryId) {
      leaguesMap.set(`${l.countryId}_${l.name.toUpperCase()}`, l);
      leaguesMap.set(`${l.countryId}_${normalizeHeaderKey(l.name)}`, l);
    }
    leaguesMap.set(l.name.toUpperCase(), l);
    leaguesMap.set(normalizeHeaderKey(l.name), l);
    leaguesMap.set(l.id, l);
  });

  const teamsMap = new Map<string, Team>();
  teams.forEach(t => {
    if (t.countryId) {
      teamsMap.set(`${t.countryId}_${t.name.toUpperCase()}`, t);
      teamsMap.set(`${t.countryId}_${normalizeHeaderKey(t.name)}`, t);
    }
    teamsMap.set(t.name.toUpperCase(), t);
    teamsMap.set(normalizeHeaderKey(t.name), t);
    teamsMap.set(t.id, t);
  });

  const matchesMap = new Map<string, Match>();
  matches.forEach(m => {
    const dateKey = m.matchDate ? m.matchDate.substring(0, 10) : '';
    if (m.homeTeamId && m.awayTeamId) {
      matchesMap.set(`${dateKey}_${m.homeTeamId}_${m.awayTeamId}`, m);
    }
    if (m.homeTeamName && m.awayTeamName) {
      matchesMap.set(`${dateKey}_${normalizeHeaderKey(m.homeTeamName)}_${normalizeHeaderKey(m.awayTeamName)}`, m);
    }
    matchesMap.set(m.id, m);
  });

  let newCountriesCount = 0;
  let newLeaguesCount = 0;
  let newTeamsCount = 0;
  let newMatchesCount = 0;

  for (const r of parsedRows) {
    // Extract Home and Away team names using comprehensive aliases
    const homeName = getRowValue(r, [
      'Mandante', 'HomeTeam', 'Home', 'MANDANTE', 'HOMETEAM', 'HOME',
      'Time_Mandante', 'Time Mandante', 'Equipe_Mandante', 'Equipe Mandante',
      'Clube_Mandante', 'Clube Mandante', 'Casa', 'Time Casa', 'Time_Casa',
      'Team 1', 'Team1', 'Team_1', 'HT', 'TimeMandante', 'EquipeMandante'
    ]);

    const awayName = getRowValue(r, [
      'Visitante', 'AwayTeam', 'Away', 'VISITANTE', 'AWAYTEAM', 'AWAY',
      'Time_Visitante', 'Time Visitante', 'Equipe_Visitante', 'Equipe Visitante',
      'Clube_Visitante', 'Clube Visitante', 'Fora', 'Time Fora', 'Time_Fora',
      'Team 2', 'Team2', 'Team_2', 'AT', 'TimeVisitante', 'EquipeVisitante'
    ]);

    if (!homeName || !awayName) continue;

    // Extract Country and League
    let countryCodeOrName = getRowValue(r, [
      'Pais', 'País', 'PAIS', 'PAÍS', 'Country', 'COUNTRY', 'CountryName',
      'Nação', 'Nacao', 'Nation', 'Pais_Nome', 'Nome_Pais'
    ]);

    let leagueName = getRowValue(r, [
      'Liga', 'LIGA', 'League', 'LEAGUE', 'LeagueName', 'Divisao', 'Divisão',
      'DIVISAO', 'DIVISÃO', 'Competition', 'COMPETITION', 'Campeonato', 'CAMPEONATO',
      'Torneio', 'TORNEIO', 'Nome_Liga'
    ]);

    // Check Div code mapping (e.g. N1, E0, SP1, D1, BRA1)
    const div = getRowValue(r, ['Div', 'DIV', 'Division', 'Divisao', 'Divisão', 'DivCode']);
    if (div && DIV_MAP[div.toUpperCase()]) {
      const mapped = DIV_MAP[div.toUpperCase()];
      if (!countryCodeOrName) countryCodeOrName = mapped.countryCode;
      if (!leagueName) leagueName = mapped.leagueName;
    }

    // Auto-detect canonical country and league from team names if missing or generic
    const htCanonical = lookupCanonicalTeam(homeName);
    const atCanonical = lookupCanonicalTeam(awayName);
    if (htCanonical && (!countryCodeOrName || countryCodeOrName === 'INT' || countryCodeOrName === 'Outro')) {
      countryCodeOrName = htCanonical.countryCode;
    } else if (atCanonical && (!countryCodeOrName || countryCodeOrName === 'INT' || countryCodeOrName === 'Outro')) {
      countryCodeOrName = atCanonical.countryCode;
    }

    if (!countryCodeOrName) countryCodeOrName = 'INT';
    const friendlyCountryName = COUNTRY_NAMES[countryCodeOrName.toUpperCase()] ||
      COUNTRY_NAMES[normalizeHeaderKey(countryCodeOrName).toUpperCase()] ||
      countryCodeOrName;

    if (!leagueName) {
      if (htCanonical && htCanonical.countryCode === countryCodeOrName) {
        leagueName = htCanonical.defaultLeaguePattern;
      } else if (atCanonical && atCanonical.countryCode === countryCodeOrName) {
        leagueName = atCanonical.defaultLeaguePattern;
      } else {
        leagueName = `Liga Principal ${countryCodeOrName}`;
      }
    }

    // 1. Ensure Country
    const cKeyUpper = countryCodeOrName.toUpperCase();
    const cKeyFriendly = friendlyCountryName.toUpperCase();
    const cKeyNorm = normalizeHeaderKey(friendlyCountryName);

    let country = countriesMap.get(cKeyUpper) ||
      countriesMap.get(cKeyFriendly) ||
      countriesMap.get(cKeyNorm);

    if (!country) {
      nextCountryNum++;
      const id = `PAIS-${String(nextCountryNum).padStart(3, '0')}`;
      const code = countryCodeOrName.length <= 3
        ? countryCodeOrName.toUpperCase()
        : friendlyCountryName.substring(0, 3).toUpperCase();

      country = {
        id,
        name: friendlyCountryName,
        code,
        createdAt: new Date().toISOString(),
      };
      countries.push(country);
      countriesMap.set(cKeyUpper, country);
      countriesMap.set(cKeyFriendly, country);
      countriesMap.set(cKeyNorm, country);
      countriesMap.set(code, country);
      countriesMap.set(id, country);
      newCountriesCount++;
    }

    // 2. Ensure League (estritamente dentro do país)
    const lKeyUpper = leagueName.toUpperCase();
    const lKeyNorm = normalizeHeaderKey(leagueName);
    const countryLeagueKey = `${country.id}_${lKeyUpper}`;
    const countryLeagueNorm = `${country.id}_${lKeyNorm}`;

    let league = leaguesMap.get(countryLeagueKey) ||
      leaguesMap.get(countryLeagueNorm) ||
      leagues.find(l => l.countryId === country.id && (l.name.toUpperCase() === lKeyUpper || normalizeHeaderKey(l.name) === lKeyNorm));

    if (!league) {
      nextLeagueNum++;
      const id = `LIGA-${String(nextLeagueNum).padStart(3, '0')}`;
      league = {
        id,
        name: leagueName,
        countryId: country.id,
        countryName: country.name,
        type: 'Pontos Corridos',
        createdAt: new Date().toISOString(),
      };
      leagues.push(league);
      leaguesMap.set(countryLeagueKey, league);
      leaguesMap.set(countryLeagueNorm, league);
      leaguesMap.set(id, league);
      newLeaguesCount++;
    } else if (!league.countryId) {
      league.countryId = country.id;
      league.countryName = country.name;
    }

    // 3. Ensure Home Team (estritamente dentro do país)
    const htUpper = homeName.toUpperCase();
    const htNorm = normalizeHeaderKey(homeName);
    const countryHtKey = `${country.id}_${htUpper}`;
    const countryHtNorm = `${country.id}_${htNorm}`;

    let homeTeam = teamsMap.get(countryHtKey) ||
      teamsMap.get(countryHtNorm) ||
      teams.find(t => t.countryId === country.id && (t.name.toUpperCase() === htUpper || normalizeHeaderKey(t.name) === htNorm));

    if (!homeTeam) {
      nextTeamNum++;
      const id = `TIME-${String(nextTeamNum).padStart(3, '0')}`;
      homeTeam = {
        id,
        name: homeName,
        countryId: country.id,
        countryName: country.name,
        leagueId: league.id,
        leagueName: league.name,
        leagueIds: [league.id],
        createdAt: new Date().toISOString(),
      };
      teams.push(homeTeam);
      teamsMap.set(countryHtKey, homeTeam);
      teamsMap.set(countryHtNorm, homeTeam);
      teamsMap.set(id, homeTeam);
      newTeamsCount++;
    } else {
      // Update team's league association within its country
      let updated = false;
      if (!homeTeam.countryId) {
        homeTeam.countryId = country.id;
        homeTeam.countryName = country.name;
        updated = true;
      }
      if (!homeTeam.leagueId && league.countryId === homeTeam.countryId) {
        homeTeam.leagueId = league.id;
        homeTeam.leagueName = league.name;
        updated = true;
      }
      // NUNCA adicionar ligas de outro país
      if (league.countryId === homeTeam.countryId) {
        const existingLeagueIds = homeTeam.leagueIds ? [...homeTeam.leagueIds] : (homeTeam.leagueId ? [homeTeam.leagueId] : []);
        if (!existingLeagueIds.includes(league.id)) {
          existingLeagueIds.push(league.id);
          homeTeam.leagueIds = existingLeagueIds;
          updated = true;
        }
      }
      if (updated) {
        teamsMap.set(`${homeTeam.countryId}_${htUpper}`, homeTeam);
      }
    }

    // 4. Ensure Away Team (estritamente dentro do país)
    const atUpper = awayName.toUpperCase();
    const atNorm = normalizeHeaderKey(awayName);
    const countryAtKey = `${country.id}_${atUpper}`;
    const countryAtNorm = `${country.id}_${atNorm}`;

    let awayTeam = teamsMap.get(countryAtKey) ||
      teamsMap.get(countryAtNorm) ||
      teams.find(t => t.countryId === country.id && (t.name.toUpperCase() === atUpper || normalizeHeaderKey(t.name) === atNorm));

    if (!awayTeam) {
      nextTeamNum++;
      const id = `TIME-${String(nextTeamNum).padStart(3, '0')}`;
      awayTeam = {
        id,
        name: awayName,
        countryId: country.id,
        countryName: country.name,
        leagueId: league.id,
        leagueName: league.name,
        leagueIds: [league.id],
        createdAt: new Date().toISOString(),
      };
      teams.push(awayTeam);
      teamsMap.set(countryAtKey, awayTeam);
      teamsMap.set(countryAtNorm, awayTeam);
      teamsMap.set(id, awayTeam);
      newTeamsCount++;
    } else {
      // Update team's league association within its country
      let updated = false;
      if (!awayTeam.countryId) {
        awayTeam.countryId = country.id;
        awayTeam.countryName = country.name;
        updated = true;
      }
      if (!awayTeam.leagueId && league.countryId === awayTeam.countryId) {
        awayTeam.leagueId = league.id;
        awayTeam.leagueName = league.name;
        updated = true;
      }
      // NUNCA adicionar ligas de outro país
      if (league.countryId === awayTeam.countryId) {
        const existingLeagueIds = awayTeam.leagueIds ? [...awayTeam.leagueIds] : (awayTeam.leagueId ? [awayTeam.leagueId] : []);
        if (!existingLeagueIds.includes(league.id)) {
          existingLeagueIds.push(league.id);
          awayTeam.leagueIds = existingLeagueIds;
          updated = true;
        }
      }
      if (updated) {
        teamsMap.set(`${awayTeam.countryId}_${atUpper}`, awayTeam);
      }
    }

    // 5. Process Match Info
    const dateStr = getRowValue(r, ['Data', 'Date', 'DATE', 'DATA', 'MatchDate', 'Data_Jogo', 'DataJogo']);
    const timeStr = getRowValue(r, ['Hora', 'Time', 'TIME', 'HORA', 'MatchTime', 'Horario', 'Horário', 'Hora_Jogo']);
    const isoDate = parseDate(dateStr, timeStr);
    const dateKey = isoDate.substring(0, 10);
    const mKey = `${dateKey}_${homeTeam.id}_${awayTeam.id}`;

    const fthg = safeNum(getRowValue(r, [
      'Placar_Mandante_FT', 'FTHG', 'HG', 'Gols_Mandante', 'GOLS_MANDANTE',
      'HomeScore', 'FullTimeHomeGoals', 'GolsMandante', 'PlacarMandanteFT'
    ]));

    const ftag = safeNum(getRowValue(r, [
      'Placar_Visitante_FT', 'FTAG', 'AG', 'Gols_Visitante', 'GOLS_VISITANTE',
      'AwayScore', 'FullTimeAwayGoals', 'GolsVisitante', 'PlacarVisitanteFT'
    ]));

    const hthg = safeNum(getRowValue(r, [
      'Placar_Mandante_HT', 'HTHG', 'HalftimeHomeGoals', 'PlacarMandanteHT'
    ]));

    const htag = safeNum(getRowValue(r, [
      'Placar_Visitante_HT', 'HTAG', 'HalftimeAwayGoals', 'PlacarVisitanteHT'
    ]));

    const referee = getRowValue(r, ['Arbitro', 'Árbitro', 'Referee', 'ARBITRO', 'Juiz']) || undefined;

    const isFinished = fthg !== null && ftag !== null;
    const status = isFinished ? 'FINALIZADO' : 'AGENDADO';

    // Exact Stats matching columns
    const xgHome = safeNum(getRowValue(r, ['xG_Mandante_FT', 'HxG', 'xG_Home', 'xG_Mandante', 'finalizacoes_xg_mandante_ft', 'xg_mandante']));
    const xgAway = safeNum(getRowValue(r, ['xG_Visitante_FT', 'AxG', 'xG_Away', 'xG_Visitante', 'finalizacoes_xg_visitante_ft', 'xg_visitante']));
    const xgotHome = safeNum(getRowValue(r, ['finalizacoes_xgot_mandante_ft', 'xgot_mandante_ft', 'xgot_mandante', 'xgot_home_ft', 'xgot_home', 'hxgot']));
    const xgotAway = safeNum(getRowValue(r, ['finalizacoes_xgot_visitante_ft', 'xgot_visitante_ft', 'xgot_visitante', 'xgot_away_ft', 'xgot_away', 'axgot']));

    const shotsHome = safeNum(getRowValue(r, ['Finalizacoes_Mandante_FT', 'HS', 'Finalizacoes_Mandante', 'Chutes_Mandante', 'finalizacoes_totais_mandante_ft']));
    const shotsAway = safeNum(getRowValue(r, ['Finalizacoes_Visitante_FT', 'AS', 'Finalizacoes_Visitante', 'Chutes_Visitante', 'finalizacoes_totais_visitante_ft']));
    const shotsOnTargetHome = safeNum(getRowValue(r, ['Chutes_Gol_Mandante_FT', 'HST', 'Chutes_Gol_Mandante', 'ChutesNoAlvo_Mandante', 'finalizacoes_no_alvo_mandante_ft']));
    const shotsOnTargetAway = safeNum(getRowValue(r, ['Chutes_Gol_Visitante_FT', 'AST', 'Chutes_Gol_Visitante', 'ChutesNoAlvo_Visitante', 'finalizacoes_no_alvo_visitante_ft']));
    const shotsOffTargetHome = safeNum(getRowValue(r, ['finalizacoes_para_fora_mandante_ft', 'shots_off_target_home', 'chutes_fora_mandante']));
    const shotsOffTargetAway = safeNum(getRowValue(r, ['finalizacoes_para_fora_visitante_ft', 'shots_off_target_away', 'chutes_fora_visitante']));
    const shotsBlockedHome = safeNum(getRowValue(r, ['finalizacoes_bloqueadas_mandante_ft', 'shots_blocked_home', 'chutes_bloqueados_mandante']));
    const shotsBlockedAway = safeNum(getRowValue(r, ['finalizacoes_bloqueadas_visitante_ft', 'shots_blocked_away', 'chutes_bloqueados_visitante']));
    const shotsInsideBoxHome = safeNum(getRowValue(r, ['finalizacoes_dentro_area_mandante_ft', 'shots_inside_box_home', 'chutes_dentro_area_mandante']));
    const shotsInsideBoxAway = safeNum(getRowValue(r, ['finalizacoes_dentro_area_visitante_ft', 'shots_inside_box_away', 'chutes_dentro_area_visitante']));
    const shotsOutsideBoxHome = safeNum(getRowValue(r, ['finalizacoes_fora_area_mandante_ft', 'shots_outside_box_home', 'chutes_fora_area_mandante']));
    const shotsOutsideBoxAway = safeNum(getRowValue(r, ['finalizacoes_fora_area_visitante_ft', 'shots_outside_box_away', 'chutes_fora_area_visitante']));
    const shotsWoodworkHome = safeNum(getRowValue(r, ['finalizacoes_trave_mandante_ft', 'shots_woodwork_home', 'bolas_trave_mandante']));
    const shotsWoodworkAway = safeNum(getRowValue(r, ['finalizacoes_trave_visitante_ft', 'shots_woodwork_away', 'bolas_trave_visitante']));

    // Ataque
    const bigChancesHome = safeNum(getRowValue(r, ['ataque_chances_claras_mandante_ft', 'big_chances_home', 'chances_claras_mandante']));
    const bigChancesAway = safeNum(getRowValue(r, ['ataque_chances_claras_visitante_ft', 'big_chances_away', 'chances_claras_visitante']));
    const cornersHome = safeNum(getRowValue(r, ['Escanteios_Mandante_FT', 'HC', 'Escanteios_Mandante', 'Cantos_Mandante', 'ataque_escanteios_mandante_ft']));
    const cornersAway = safeNum(getRowValue(r, ['Escanteios_Visitante_FT', 'AC', 'Escanteios_Visitante', 'Cantos_Visitante', 'ataque_escanteios_visitante_ft']));
    const touchesOppBoxHome = safeNum(getRowValue(r, ['ataque_toques_area_adv_mandante_ft', 'touches_opp_box_home', 'toques_area_adv_mandante']));
    const touchesOppBoxAway = safeNum(getRowValue(r, ['ataque_toques_area_adv_visitante_ft', 'touches_opp_box_away', 'toques_area_adv_visitante']));
    const throughBallsHome = safeNum(getRowValue(r, ['ataque_passes_profundidade_certos_mandante_ft', 'through_balls_home', 'passes_profundidade_mandante']));
    const throughBallsAway = safeNum(getRowValue(r, ['ataque_passes_profundidade_certos_visitante_ft', 'through_balls_away', 'passes_profundidade_visitante']));
    const offsidesHome = safeNum(getRowValue(r, ['ataque_impedimentos_mandante_ft', 'offsides_home', 'impedimentos_mandante']));
    const offsidesAway = safeNum(getRowValue(r, ['ataque_impedimentos_visitante_ft', 'offsides_away', 'impedimentos_visitante']));
    const foulsDrawnHome = safeNum(getRowValue(r, ['ataque_faltas_cobradas_mandante_ft', 'fouls_drawn_home', 'faltas_sofridas_mandante']));
    const foulsDrawnAway = safeNum(getRowValue(r, ['ataque_faltas_cobradas_visitante_ft', 'fouls_drawn_away', 'faltas_sofridas_visitante']));

    // Passes
    const passesAccurateHome = safeNum(getRowValue(r, ['passes_certos_mandante_ft', 'passes_accurate_home']));
    const passesTotalHome = safeNum(getRowValue(r, ['passes_totais_mandante_ft', 'passes_total_home']));
    const passesPctHome = safeNum(getRowValue(r, ['passes_precisao_pct_mandante_ft', 'passes_pct_home']));
    const passesAccurateAway = safeNum(getRowValue(r, ['passes_certos_visitante_ft', 'passes_accurate_away']));
    const passesTotalAway = safeNum(getRowValue(r, ['passes_totais_visitante_ft', 'passes_total_away']));
    const passesPctAway = safeNum(getRowValue(r, ['passes_precisao_pct_visitante_ft', 'passes_pct_away']));

    const longPassesAccurateHome = safeNum(getRowValue(r, ['passes_longos_certos_mandante_ft', 'long_passes_accurate_home']));
    const longPassesTotalHome = safeNum(getRowValue(r, ['passes_longos_totais_mandante_ft', 'long_passes_total_home']));
    const longPassesPctHome = safeNum(getRowValue(r, ['passes_longos_pct_mandante_ft', 'long_passes_pct_home']));
    const longPassesAccurateAway = safeNum(getRowValue(r, ['passes_longos_certos_visitante_ft', 'long_passes_accurate_away']));
    const longPassesTotalAway = safeNum(getRowValue(r, ['passes_longos_totais_visitante_ft', 'long_passes_total_away']));
    const longPassesPctAway = safeNum(getRowValue(r, ['passes_longos_pct_visitante_ft', 'long_passes_pct_away']));

    const finalThirdPassesAccurateHome = safeNum(getRowValue(r, ['passes_terco_final_certos_mandante_ft', 'final_third_passes_accurate_home']));
    const finalThirdPassesTotalHome = safeNum(getRowValue(r, ['passes_terco_final_totais_mandante_ft', 'final_third_passes_total_home']));
    const finalThirdPassesPctHome = safeNum(getRowValue(r, ['passes_terco_final_pct_mandante_ft', 'final_third_passes_pct_home']));
    const finalThirdPassesAccurateAway = safeNum(getRowValue(r, ['passes_terco_final_certos_visitante_ft', 'final_third_passes_accurate_away']));
    const finalThirdPassesTotalAway = safeNum(getRowValue(r, ['passes_terco_final_totais_visitante_ft', 'final_third_passes_total_away']));
    const finalThirdPassesPctAway = safeNum(getRowValue(r, ['passes_terco_final_pct_visitante_ft', 'final_third_passes_pct_away']));

    const crossesAccurateHome = safeNum(getRowValue(r, ['passes_cruzamentos_certos_mandante_ft', 'crosses_accurate_home']));
    const crossesTotalHome = safeNum(getRowValue(r, ['passes_cruzamentos_totais_mandante_ft', 'crosses_total_home']));
    const crossesPctHome = safeNum(getRowValue(r, ['passes_cruzamentos_pct_mandante_ft', 'crosses_pct_home']));
    const crossesAccurateAway = safeNum(getRowValue(r, ['passes_cruzamentos_certos_visitante_ft', 'crosses_accurate_away']));
    const crossesTotalAway = safeNum(getRowValue(r, ['passes_cruzamentos_totais_visitante_ft', 'crosses_total_away']));
    const crossesPctAway = safeNum(getRowValue(r, ['passes_cruzamentos_pct_visitante_ft', 'crosses_pct_away']));

    const xaHome = safeNum(getRowValue(r, ['passes_xa_mandante_ft', 'xa_home']));
    const xaAway = safeNum(getRowValue(r, ['passes_xa_visitante_ft', 'xa_away']));
    const throwInsHome = safeNum(getRowValue(r, ['passes_laterais_cobrados_mandante_ft', 'throw_ins_home', 'laterais_mandante']));
    const throwInsAway = safeNum(getRowValue(r, ['passes_laterais_cobrados_visitante_ft', 'throw_ins_away', 'laterais_visitante']));

    // Defesa & Faltas
    const foulsHome = safeNum(getRowValue(r, ['Faltas_Mandante_FT', 'HF', 'Faltas_Mandante', 'defesa_faltas_mandante_ft']));
    const foulsAway = safeNum(getRowValue(r, ['Faltas_Visitante_FT', 'AF', 'Faltas_Visitante', 'defesa_faltas_visitante_ft']));
    const tacklesAccurateHome = safeNum(getRowValue(r, ['defesa_desarmes_certos_mandante_ft', 'tackles_accurate_home']));
    const tacklesTotalHome = safeNum(getRowValue(r, ['defesa_desarmes_totais_mandante_ft', 'tackles_total_home']));
    const tacklesPctHome = safeNum(getRowValue(r, ['defesa_desarmes_pct_mandante_ft', 'tackles_pct_home']));
    const tacklesAccurateAway = safeNum(getRowValue(r, ['defesa_desarmes_certos_visitante_ft', 'tackles_accurate_away']));
    const tacklesTotalAway = safeNum(getRowValue(r, ['defesa_desarmes_totais_visitante_ft', 'tackles_total_away']));
    const tacklesPctAway = safeNum(getRowValue(r, ['defesa_desarmes_pct_visitante_ft', 'tackles_pct_away']));

    const duelsWonHome = safeNum(getRowValue(r, ['defesa_duelos_ganhos_mandante_ft', 'duels_won_home']));
    const duelsWonAway = safeNum(getRowValue(r, ['defesa_duelos_ganhos_visitante_ft', 'duels_won_away']));
    const clearancesHome = safeNum(getRowValue(r, ['defesa_rebatidas_mandante_ft', 'clearances_home', 'rebatidas_mandante']));
    const clearancesAway = safeNum(getRowValue(r, ['defesa_rebatidas_visitante_ft', 'clearances_away', 'rebatidas_visitante']));
    const interceptionsHome = safeNum(getRowValue(r, ['defesa_interceptacoes_mandante_ft', 'interceptions_home', 'interceptacoes_mandante']));
    const interceptionsAway = safeNum(getRowValue(r, ['defesa_interceptacoes_visitante_ft', 'interceptions_away', 'interceptacoes_visitante']));
    const errorsLeadToShotHome = safeNum(getRowValue(r, ['defesa_erros_resultaram_finalizacao_mandante_ft', 'errors_lead_to_shot_home']));
    const errorsLeadToShotAway = safeNum(getRowValue(r, ['defesa_erros_resultaram_finalizacao_visitante_ft', 'errors_lead_to_shot_away']));
    const errorsLeadToGoalHome = safeNum(getRowValue(r, ['defesa_erros_resultaram_gol_mandante_ft', 'errors_lead_to_goal_home']));
    const errorsLeadToGoalAway = safeNum(getRowValue(r, ['defesa_erros_resultaram_gol_visitante_ft', 'errors_lead_to_goal_away']));
    const goalkeeperDefActionHome = safeNum(getRowValue(r, ['defesa_goleiro_mandante_ft', 'goalkeeper_def_action_home']));
    const goalkeeperDefActionAway = safeNum(getRowValue(r, ['defesa_goleiro_visitante_ft', 'goalkeeper_def_action_away']));

    // Goleiro
    const savesHome = safeNum(getRowValue(r, ['goleiro_defesas_mandante_ft', 'saves_home', 'defesas_goleiro_mandante']));
    const savesAway = safeNum(getRowValue(r, ['goleiro_defesas_visitante_ft', 'saves_away', 'defesas_goleiro_visitante']));
    const xgotFacedHome = safeNum(getRowValue(r, ['goleiro_xgot_enfrentado_mandante_ft', 'xgot_faced_home']));
    const xgotFacedAway = safeNum(getRowValue(r, ['goleiro_xgot_enfrentado_visitante_ft', 'xgot_faced_away']));
    const goalsPreventedHome = safeNum(getRowValue(r, ['goleiro_gols_evitados_mandante_ft', 'goals_prevented_home']));
    const goalsPreventedAway = safeNum(getRowValue(r, ['goleiro_gols_evitados_visitante_ft', 'goals_prevented_away']));
    const goalKicksHome = safeNum(getRowValue(r, ['goleiro_tiros_de_meta_mandante_ft', 'goal_kicks_home', 'tiros_meta_mandante']));
    const goalKicksAway = safeNum(getRowValue(r, ['goleiro_tiros_de_meta_visitante_ft', 'goal_kicks_away', 'tiros_meta_visitante']));

    // Disciplina
    const yellowHome = safeNum(getRowValue(r, ['Cartao_Amarelo_Mandante_FT', 'HY', 'Amarelos_Mandante', 'Cartoes_Amarelos_Mandante', 'cartao_amarelo_mandante_ft']));
    const yellowAway = safeNum(getRowValue(r, ['Cartao_Amarelo_Visitante_FT', 'AY', 'Amarelos_Visitante', 'Cartoes_Amarelos_Visitante', 'cartao_amarelo_visitante_ft']));
    const redHome = safeNum(getRowValue(r, ['Cartao_Vermelho_Mandante_FT', 'HR', 'Vermelhos_Mandante', 'Cartoes_Vermelhos_Mandante', 'cartao_vermelho_mandante_ft']));
    const redAway = safeNum(getRowValue(r, ['Cartao_Vermelho_Visitante_FT', 'AR', 'Vermelhos_Visitante', 'Cartoes_Vermelhos_Visitante', 'cartao_vermelho_visitante_ft']));

    const possHome = safeNum(getRowValue(r, ['posse_bola_mandante_ft', 'Posse_Mandante', 'Posse_Mandante_FT', 'Possession_Home', 'Posse_Casa']));
    const possAway = safeNum(getRowValue(r, ['posse_bola_visitante_ft', 'Posse_Visitante', 'Posse_Visitante_FT', 'Possession_Away', 'Posse_Fora']));

    // Minutagem dos Gols
    const rawGoalMinHome = getRowValue(r, [
      'minutos_gols_mandante_ft', 'Minutos_Gols_Mandante_FT', 'minutos_gols_mandante', 'Minutos_Gols_Mandante',
      'minutos_gol_mandante_ft', 'minutos_gol_mandante', 'minutos_mandante_ft', 'minutos_mandante',
      'minutos_gols_casa', 'minutos_casa', 'gols_minutos_mandante', 'gols_minutos_casa',
      'goal_minutes_home_ft', 'goal_minutes_home', 'home_goal_minutes', 'home_goals_minutes',
      'minutosgolsmandanteft', 'minutosgolsmandante', 'minuto_gols_mandante', 'minuto_mandante',
      'tempo_gols_mandante', 'horario_gols_mandante', 'minutos_hg', 'hg_min', 'min_hg'
    ]);
    const goalMinutesHome = rawGoalMinHome && String(rawGoalMinHome).trim() !== '' ? String(rawGoalMinHome).trim() : null;

    const rawGoalMinAway = getRowValue(r, [
      'minutos_gols_visitante_ft', 'Minutos_Gols_Visitante_FT', 'minutos_gols_visitante', 'Minutos_Gols_Visitante',
      'minutos_gol_visitante_ft', 'minutos_gol_visitante', 'minutos_visitante_ft', 'minutos_visitante',
      'minutos_gols_fora', 'minutos_fora', 'gols_minutos_visitante', 'gols_minutos_fora',
      'goal_minutes_away_ft', 'goal_minutes_away', 'away_goal_minutes', 'away_goals_minutes',
      'minutosgolsvisitanteft', 'minutosgolsvisitante', 'minuto_gols_visitante', 'minuto_visitante',
      'tempo_gols_visitante', 'horario_gols_visitante', 'minutos_ag', 'ag_min', 'min_ag'
    ]);
    const goalMinutesAway = rawGoalMinAway && String(rawGoalMinAway).trim() !== '' ? String(rawGoalMinAway).trim() : null;

    const stadium = getRowValue(r, ['Estadio', 'Estádio', 'Stadium', 'Local', 'Arena']) || undefined;
    const attendance = safeNum(getRowValue(r, ['Publico', 'Público', 'Attendance', 'Espectadores']));
    const capacity = safeNum(getRowValue(r, ['Capacidade', 'Capacity', 'Capacidade_Estadio']));

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
      possessionHomeFT: possHome,
      possessionAwayFT: possAway,
      goalMinutesHomeFT: goalMinutesHome,
      goalMinutesAwayFT: goalMinutesAway,
      stadium: stadium || undefined,
      attendance: attendance ?? null,
      stadiumCapacity: capacity ?? null,
    };

    // Exact Odds matching columns
    const oddHome = safeNum(getRowValue(r, ['Odd_Home_FT', 'B365H', 'Odd_Mandante', 'Odd_Casa', 'Odd_1']));
    const oddDraw = safeNum(getRowValue(r, ['Odd_Draw_FT', 'B365D', 'Odd_Empate', 'Odd_X']));
    const oddAway = safeNum(getRowValue(r, ['Odd_Away_FT', 'B365A', 'Odd_Visitante', 'Odd_Fora', 'Odd_2']));
    const oddOver25 = safeNum(getRowValue(r, ['Odd_Over25_FT', 'B365>2.5', 'Odd_Over_2_5', 'Odd_Mais_2_5', 'Over25']));
    const oddUnder25 = safeNum(getRowValue(r, ['Odd_Under25_FT', 'B365<2.5', 'Odd_Under_2_5', 'Odd_Menos_2_5', 'Under25']));

    // Asian Handicap
    const ahHomeLine = safeNum(getRowValue(r, ['Linha_Handicap_Asiático_Mandante_FT', 'Linha_Handicap_Asiatico_Mandante_FT', 'AHh', 'AH_Home_Line']));
    const ahHomeOdd = safeNum(getRowValue(r, ['Odd_Handicap_Asiático_Mandante_FT', 'Odd_Handicap_Asiatico_Mandante_FT', 'B365AHH', 'AH_Home_Odd']));
    let ahAwayLine = safeNum(getRowValue(r, ['Linha_Handicap_Asiático_Visitante_FT', 'Linha_Handicap_Asiatico_Visitante_FT', 'AHa', 'AH_Away_Line']));
    if (ahAwayLine === null && ahHomeLine !== null) {
      ahAwayLine = -ahHomeLine;
    }
    const ahAwayOdd = safeNum(getRowValue(r, ['Odd_Handicap_Asiático_Visitante_FT', 'Odd_Handicap_Asiatico_Visitante_FT', 'B365AHA', 'AH_Away_Odd']));

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

    const mKeyByName = `${dateKey}_${normalizeHeaderKey(homeTeam.name)}_${normalizeHeaderKey(awayTeam.name)}`;
    let existingMatch = matchesMap.get(mKey) || matchesMap.get(mKeyByName);
    if (existingMatch) {
      existingMatch.matchDate = isoDate;
      existingMatch.status = status;
      if (fthg !== null) existingMatch.homeScore = fthg;
      if (ftag !== null) existingMatch.awayScore = ftag;
      if (referee) existingMatch.referee = referee;

      const mergedStats: MatchStats = { ...(existingMatch.stats || {}) };
      (Object.keys(statsObj) as (keyof MatchStats)[]).forEach((k) => {
        const val = statsObj[k];
        if (val !== null && val !== undefined && val !== '') {
          (mergedStats as any)[k] = val;
        }
      });
      existingMatch.stats = mergedStats;

      const mergedOdds: MatchOdds = { ...(existingMatch.odds || {}) };
      (Object.keys(oddsObj) as (keyof MatchOdds)[]).forEach((k) => {
        const val = oddsObj[k];
        if (val !== null && val !== undefined) {
          (mergedOdds as any)[k] = val;
        }
      });
      existingMatch.odds = mergedOdds;
    } else {
      nextMatchNum++;
      const matchId = `JOGO-${String(nextMatchNum).padStart(3, '0')}`;
      const newMatch: Match = {
        id: matchId,
        matchDate: isoDate,
        status,
        countryId: country.id,
        countryName: country.name,
        countryFlagUrl: country.flagUrl,
        leagueId: league.id,
        leagueName: league.name,
        leagueLogoUrl: league.logoUrl,
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
      matchesMap.set(mKeyByName, newMatch);
      matchesMap.set(matchId, newMatch);
      newMatchesCount++;
    }
  }

  const rawUpdatedDb: DbState = {
    ...currentDb,
    countries,
    leagues,
    teams,
    matches,
  };

  const { cleanedDb } = sanitizeAndCleanDb(rawUpdatedDb);

  const finishedMatchesCount = cleanedDb.matches.filter(m => m.status === 'FINALIZADO').length;
  const futureMatchesCount = cleanedDb.matches.filter(m => m.status === 'AGENDADO').length;

  const result: ClientSyncResult = {
    success: parsedRows.length > 0,
    message: replace
      ? `Base sincronizada com sucesso: ${cleanedDb.countries.length} país(es), ${cleanedDb.leagues.length} liga(s), ${cleanedDb.teams.length} times e ${cleanedDb.matches.length} jogos (${finishedMatchesCount} finalizados e ${futureMatchesCount} futuros)!`
      : `Processamento concluído: +${newTeamsCount} times, +${newLeaguesCount} ligas, +${newCountriesCount} países e +${newMatchesCount} jogos adicionados/atualizados!`,
    totalCountries: cleanedDb.countries.length,
    totalLeagues: cleanedDb.leagues.length,
    totalTeams: cleanedDb.teams.length,
    totalMatches: cleanedDb.matches.length,
    finishedMatchesCount,
    futureMatchesCount,
    newCountriesCount,
    newLeaguesCount,
    newTeamsCount,
    newMatchesCount,
  };

  return { updatedDb: cleanedDb, result };
}


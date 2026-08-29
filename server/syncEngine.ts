import fs from 'fs';
import path from 'path';
import { sanitizeAndCleanDb } from '../src/utils/dbSanitizer';

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
  D2: { countryCode: 'ALE', leagueName: '2. Bundesliga ALE' },
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

function parseDate(dateStr?: string, timeStr?: string): string {
  if (!dateStr || !dateStr.trim()) return new Date().toISOString();
  const rawDate = dateStr.trim();
  const parts = rawDate.split(/[\/\-\.]/);
  let year = new Date().getFullYear();
  let month = 1;
  let day = 1;

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10) || year;
      month = parseInt(parts[1], 10) || 1;
      day = parseInt(parts[2], 10) || 1;
    } else {
      day = parseInt(parts[0], 10) || 1;
      month = parseInt(parts[1], 10) || 1;
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      year = y || year;
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

  const d = new Date(Date.UTC(year, month - 1, day, hours, mins, 0));
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

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

function normalizeHeaderKey(key: string): string {
  return key
    .replace(/^[\uFEFF\uFFFE]/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

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

function safeNum(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(String(val).replace(',', '.').trim());
  return isNaN(num) ? null : num;
}

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

  let nextCountryNum = Math.max(countries.length, getHighestIdNumber('PAIS', countries));
  let nextLeagueNum = Math.max(leagues.length, getHighestIdNumber('LIGA', leagues));
  let nextTeamNum = Math.max(teams.length, getHighestIdNumber('TIME', teams));
  let nextMatchNum = Math.max(matches.length, getHighestIdNumber('JOGO', matches));

  const countriesMap = new Map<string, any>();
  countries.forEach(c => {
    if (c.code) countriesMap.set(c.code.toUpperCase(), c);
    if (c.name) {
      countriesMap.set(c.name.toUpperCase(), c);
      countriesMap.set(normalizeHeaderKey(c.name), c);
    }
    countriesMap.set(c.id, c);
  });

  const leaguesMap = new Map<string, any>();
  leagues.forEach(l => {
    if (l.countryId) {
      leaguesMap.set(`${l.countryId}_${l.name.toUpperCase()}`, l);
      leaguesMap.set(`${l.countryId}_${normalizeHeaderKey(l.name)}`, l);
    }
    leaguesMap.set(l.name.toUpperCase(), l);
    leaguesMap.set(normalizeHeaderKey(l.name), l);
    leaguesMap.set(l.id, l);
  });

  const teamsMap = new Map<string, any>();
  teams.forEach(t => {
    if (t.countryId) {
      teamsMap.set(`${t.countryId}_${t.name.toUpperCase()}`, t);
      teamsMap.set(`${t.countryId}_${normalizeHeaderKey(t.name)}`, t);
    }
    teamsMap.set(t.name.toUpperCase(), t);
    teamsMap.set(normalizeHeaderKey(t.name), t);
    teamsMap.set(t.id, t);
  });

  const matchesMap = new Map<string, any>();
  matches.forEach(m => {
    const dateKey = m.matchDate ? m.matchDate.substring(0, 10) : '';
    if (m.homeTeamId && m.awayTeamId) {
      matchesMap.set(`${dateKey}_${m.homeTeamId}_${m.awayTeamId}`, m);
      matchesMap.set(`${m.homeTeamId}_${m.awayTeamId}`, m);
    }
    matchesMap.set(m.id, m);
  });

  let newCountries = 0;
  let newLeagues = 0;
  let newTeams = 0;
  let newMatches = 0;

  for (const { countryCode, leagueName: defaultLeagueName, row } of rows) {
    const homeName = getRowValue(row, [
      'Mandante', 'HomeTeam', 'Home', 'MANDANTE', 'HOMETEAM', 'HOME',
      'Time_Mandante', 'Time Mandante', 'Equipe_Mandante', 'Equipe Mandante',
      'Clube_Mandante', 'Clube Mandante', 'Casa', 'Time Casa', 'Time_Casa',
      'Team 1', 'Team1', 'Team_1', 'HT', 'TimeMandante', 'EquipeMandante'
    ]);

    const awayName = getRowValue(row, [
      'Visitante', 'AwayTeam', 'Away', 'VISITANTE', 'AWAYTEAM', 'AWAY',
      'Time_Visitante', 'Time Visitante', 'Equipe_Visitante', 'Equipe Visitante',
      'Clube_Visitante', 'Clube Visitante', 'Fora', 'Time Fora', 'Time_Fora',
      'Team 2', 'Team2', 'Team_2', 'AT', 'TimeVisitante', 'EquipeVisitante'
    ]);

    if (!homeName || !awayName) continue;

    let cCode = getRowValue(row, [
      'Pais', 'País', 'PAIS', 'PAÍS', 'Country', 'COUNTRY', 'CountryName',
      'Nação', 'Nacao', 'Nation', 'Pais_Nome', 'Nome_Pais'
    ]) || countryCode;

    let lName = getRowValue(row, [
      'Liga', 'LIGA', 'League', 'LEAGUE', 'LeagueName', 'Divisao', 'Divisão',
      'DIVISAO', 'DIVISÃO', 'Competition', 'COMPETITION', 'Campeonato', 'CAMPEONATO',
      'Torneio', 'TORNEIO', 'Nome_Liga'
    ]) || defaultLeagueName;

    const div = getRowValue(row, ['Div', 'DIV', 'Division', 'Divisao', 'Divisão', 'DivCode', 'ï»¿Div']);
    if (div && DIV_MAP[div.toUpperCase()]) {
      const mapped = DIV_MAP[div.toUpperCase()];
      if (!cCode) cCode = mapped.countryCode;
      if (!lName) lName = mapped.leagueName;
    }

    if (!cCode) cCode = 'INT';
    const friendlyCountryName = COUNTRY_NAMES[cCode.toUpperCase()] ||
      COUNTRY_NAMES[normalizeHeaderKey(cCode).toUpperCase()] ||
      cCode;

    if (!lName) lName = `Liga Principal ${cCode}`;

    // 1. Ensure Country
    const cKeyUpper = cCode.toUpperCase();
    const cKeyFriendly = friendlyCountryName.toUpperCase();
    const cKeyNorm = normalizeHeaderKey(friendlyCountryName);

    let country = countriesMap.get(cKeyUpper) ||
      countriesMap.get(cKeyFriendly) ||
      countriesMap.get(cKeyNorm);

    if (!country) {
      nextCountryNum++;
      const id = `PAIS-${String(nextCountryNum).padStart(3, '0')}`;
      const code = cCode.length <= 3 ? cCode.toUpperCase() : friendlyCountryName.substring(0, 3).toUpperCase();
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
      newCountries++;
    }

    // 2. Ensure League (estritamente dentro do país)
    const lKeyUpper = lName.toUpperCase();
    const lKeyNorm = normalizeHeaderKey(lName);
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
        name: lName,
        countryId: country.id,
        countryName: country.name,
        type: 'Pontos Corridos',
        createdAt: new Date().toISOString(),
      };
      leagues.push(league);
      leaguesMap.set(countryLeagueKey, league);
      leaguesMap.set(countryLeagueNorm, league);
      leaguesMap.set(id, league);
      newLeagues++;
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
      newTeams++;
    } else {
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
      newTeams++;
    } else {
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

    // 5. Match details
    const dateStr = getRowValue(row, ['Data', 'Date', 'DATE', 'DATA', 'MatchDate', 'Data_Jogo', 'DataJogo']);
    const timeStr = getRowValue(row, ['Hora', 'Time', 'TIME', 'HORA', 'MatchTime', 'Horario', 'Horário', 'Hora_Jogo']);
    const isoDate = parseDate(dateStr, timeStr);
    const dateKey = isoDate.substring(0, 10);
    const mKey = `${dateKey}_${homeTeam.id}_${awayTeam.id}`;

    const fthg = safeNum(getRowValue(row, [
      'Placar_Mandante_FT', 'FTHG', 'HG', 'Gols_Mandante', 'GOLS_MANDANTE',
      'HomeScore', 'FullTimeHomeGoals', 'GolsMandante', 'PlacarMandanteFT'
    ]));

    const ftag = safeNum(getRowValue(row, [
      'Placar_Visitante_FT', 'FTAG', 'AG', 'Gols_Visitante', 'GOLS_VISITANTE',
      'AwayScore', 'FullTimeAwayGoals', 'GolsVisitante', 'PlacarVisitanteFT'
    ]));

    const hthg = safeNum(getRowValue(row, [
      'Placar_Mandante_HT', 'HTHG', 'HalftimeHomeGoals', 'PlacarMandanteHT'
    ]));

    const htag = safeNum(getRowValue(row, [
      'Placar_Visitante_HT', 'HTAG', 'HalftimeAwayGoals', 'PlacarVisitanteHT'
    ]));

    const referee = getRowValue(row, ['Arbitro', 'Árbitro', 'Referee', 'ARBITRO', 'Juiz']) || undefined;

    const isFinished = fthg !== null && ftag !== null;
    const status = isFinished ? 'FINALIZADO' : 'AGENDADO';

    // Stats
    const statsObj = {
      halftimeHomeScore: hthg,
      halftimeAwayScore: htag,
      xgHomeFT: safeNum(getRowValue(row, ['xG_Mandante_FT', 'HxG', 'xG_Home', 'xG_Mandante'])),
      xgAwayFT: safeNum(getRowValue(row, ['xG_Visitante_FT', 'AxG', 'xG_Away', 'xG_Visitante'])),
      shotsHomeFT: safeNum(getRowValue(row, ['Finalizacoes_Mandante_FT', 'HS', 'Finalizacoes_Mandante', 'Chutes_Mandante'])),
      shotsAwayFT: safeNum(getRowValue(row, ['Finalizacoes_Visitante_FT', 'AS', 'Finalizacoes_Visitante', 'Chutes_Visitante'])),
      shotsOnTargetHomeFT: safeNum(getRowValue(row, ['Chutes_Gol_Mandante_FT', 'HST', 'Chutes_Gol_Mandante', 'ChutesNoAlvo_Mandante'])),
      shotsOnTargetAwayFT: safeNum(getRowValue(row, ['Chutes_Gol_Visitante_FT', 'AST', 'Chutes_Gol_Visitante', 'ChutesNoAlvo_Visitante'])),
      foulsHomeFT: safeNum(getRowValue(row, ['Faltas_Mandante_FT', 'HF', 'Faltas_Mandante'])),
      foulsAwayFT: safeNum(getRowValue(row, ['Faltas_Visitante_FT', 'AF', 'Faltas_Visitante'])),
      cornersHomeFT: safeNum(getRowValue(row, ['Escanteios_Mandante_FT', 'HC', 'Escanteios_Mandante', 'Cantos_Mandante'])),
      cornersAwayFT: safeNum(getRowValue(row, ['Escanteios_Visitante_FT', 'AC', 'Escanteios_Visitante', 'Cantos_Visitante'])),
      yellowCardsHomeFT: safeNum(getRowValue(row, ['Cartao_Amarelo_Mandante_FT', 'HY', 'Amarelos_Mandante', 'Cartoes_Amarelos_Mandante'])),
      yellowCardsAwayFT: safeNum(getRowValue(row, ['Cartao_Amarelo_Visitante_FT', 'AY', 'Amarelos_Visitante', 'Cartoes_Amarelos_Visitante'])),
      redCardsHomeFT: safeNum(getRowValue(row, ['Cartao_Vermelho_Mandante_FT', 'HR', 'Vermelhos_Mandante', 'Cartoes_Vermelhos_Mandante'])),
      redCardsAwayFT: safeNum(getRowValue(row, ['Cartao_Vermelho_Visitante_FT', 'AR', 'Vermelhos_Visitante', 'Cartoes_Vermelhos_Visitante'])),
    };

    // Odds & Asian Handicap
    const ahHomeLine = safeNum(getRowValue(row, ['Linha_Handicap_Asiático_Mandante_FT', 'Linha_Handicap_Asiatico_Mandante_FT', 'AHh', 'AH_Home_Line']));
    const ahHomeOdd = safeNum(getRowValue(row, ['Odd_Handicap_Asiático_Mandante_FT', 'Odd_Handicap_Asiatico_Mandante_FT', 'B365AHH', 'AH_Home_Odd']));
    let ahAwayLine = safeNum(getRowValue(row, ['Linha_Handicap_Asiático_Visitante_FT', 'Linha_Handicap_Asiatico_Visitante_FT', 'AHa', 'AH_Away_Line']));
    if (ahAwayLine === null && ahHomeLine !== null) {
      ahAwayLine = -ahHomeLine;
    }
    const ahAwayOdd = safeNum(getRowValue(row, ['Odd_Handicap_Asiático_Visitante_FT', 'Odd_Handicap_Asiatico_Visitante_FT', 'B365AHA', 'AH_Away_Odd']));

    const oddsObj = {
      homeFT: safeNum(getRowValue(row, ['Odd_Home_FT', 'B365H', 'Odd_Mandante', 'Odd_Casa', 'Odd_1'])),
      drawFT: safeNum(getRowValue(row, ['Odd_Draw_FT', 'B365D', 'Odd_Empate', 'Odd_X'])),
      awayFT: safeNum(getRowValue(row, ['Odd_Away_FT', 'B365A', 'Odd_Visitante', 'Odd_Fora', 'Odd_2'])),
      over25FT: safeNum(getRowValue(row, ['Odd_Over25_FT', 'B365>2.5', 'Odd_Over_2_5', 'Odd_Mais_2_5', 'Over25'])),
      under25FT: safeNum(getRowValue(row, ['Odd_Under25_FT', 'B365<2.5', 'Odd_Under_2_5', 'Odd_Menos_2_5', 'Under25'])),
      asianHandicapHomeLine: ahHomeLine,
      asianHandicapHomeOdd: ahHomeOdd,
      asianHandicapAwayLine: ahAwayLine,
      asianHandicapAwayOdd: ahAwayOdd,
    };

    let existingMatch = matchesMap.get(mKey) || matchesMap.get(`${homeTeam.id}_${awayTeam.id}`);
    if (existingMatch) {
      existingMatch.matchDate = isoDate;
      existingMatch.status = status;
      if (fthg !== null) existingMatch.homeScore = fthg;
      if (ftag !== null) existingMatch.awayScore = ftag;
      if (referee) existingMatch.referee = referee;
      existingMatch.stats = { ...(existingMatch.stats || {}), ...statsObj };
      existingMatch.odds = { ...(existingMatch.odds || {}), ...oddsObj };
    } else {
      nextMatchNum++;
      const matchId = `JOGO-${String(nextMatchNum).padStart(3, '0')}`;
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
      matchesMap.set(matchId, newMatch);
      newMatches++;
    }
  }

  const rawUpdatedDb = {
    ...currentDb,
    countries,
    leagues,
    teams,
    matches,
  };

  const { cleanedDb } = sanitizeAndCleanDb(rawUpdatedDb);

  return {
    updatedDb: cleanedDb,
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

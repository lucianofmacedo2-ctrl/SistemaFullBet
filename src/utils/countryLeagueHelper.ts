import { DbState, Country, League, Team, Match } from '../types';

/**
 * Normalizes text for accent-insensitive, case-insensitive and punctuation-free comparison
 */
export function normalizeText(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Canonical metadata for known football countries, standard leagues and popular teams
 */
export interface CanonicalCountryDef {
  code: string;
  name: string;
  flag: string;
  leagues: Array<{
    name: string;
    type?: string;
    teams: string[];
  }>;
}

export const CANONICAL_COUNTRIES: CanonicalCountryDef[] = [
  {
    code: 'ISL',
    name: 'Islândia',
    flag: '🇮🇸',
    leagues: [
      {
        name: 'Besta deild karla',
        type: 'Pontos Corridos',
        teams: [
          'Víkingur Reykjavík',
          'Breiðablik',
          'Valur',
          'KR Reykjavík',
          'Stjarnan',
          'FH Hafnarfjörður',
          'KA Akureyri',
          'ÍA Akranes',
          'HK Kópavogur',
          'Fylkir',
          'Fram Reykjavík',
          'ÍBV Vestmannaeyjar',
        ],
      },
      {
        name: '1. deild karla',
        type: 'Pontos Corridos',
        teams: [
          'Afturelding',
          'Keflavík',
          'Grindavík',
          'Fjölnir',
          'Þór Akureyri',
          'Leiknir Reykjavík',
          'Njarðvík',
          'Grótta',
        ],
      },
    ],
  },
  {
    code: 'NOR',
    name: 'Noruega',
    flag: '🇳🇴',
    leagues: [
      {
        name: 'Eliteserien',
        type: 'Pontos Corridos',
        teams: [
          'Bodø/Glimt',
          'Molde',
          'Brann',
          'Rosenborg',
          'Viking',
          'Lillestrøm',
          'Tromsø',
          'Vålerenga',
          'Sarpsborg 08',
          'Strømsgodset',
          'Haugesund',
          'Odd',
          'Sandefjord',
          'HamKam',
          'Fredrikstad',
          'KFUM Oslo',
        ],
      },
      {
        name: 'OBOS-ligaen',
        type: 'Pontos Corridos',
        teams: [
          'Aalesund',
          'Sogndal',
          'Kongsvinger',
          'Moss',
          'Ranheim',
          'Start',
          'Bryne',
          'Raufoss',
          'Lyn',
          'Egersund',
        ],
      },
    ],
  },
  {
    code: 'DEN',
    name: 'Dinamarca',
    flag: '🇩🇰',
    leagues: [
      {
        name: 'Superligaen',
        type: 'Pontos Corridos',
        teams: [
          'FC Copenhagen',
          'FC Midtjylland',
          'Brøndby IF',
          'AGF Aarhus',
          'FC Nordsjælland',
          'Silkeborg IF',
          'Randers FC',
          'Viborg FF',
          'Lyngby BK',
          'Vejle BK',
          'AaB Aalborg',
          'Sønderjyske',
        ],
      },
      {
        name: '1. Division',
        type: 'Pontos Corridos',
        teams: ['Odense Boldklub', 'Horsens', 'Hvidovre', 'Esbjerg', 'Hobro', 'Fredericia'],
      },
    ],
  },
  {
    code: 'SWE',
    name: 'Suécia',
    flag: '🇸🇪',
    leagues: [
      {
        name: 'Allsvenskan',
        type: 'Pontos Corridos',
        teams: [
          'Malmö FF',
          'AIK',
          'Djurgårdens IF',
          'Hammarby IF',
          'IFK Göteborg',
          'BK Häcken',
          'IF Elfsborg',
          'IFK Norrköping',
          'Kalmar FF',
          'IK Sirius',
          'Halmstads BK',
          'Mjällby AIF',
          'GAIS',
          'Västerås SK',
          'IFK Värnamo',
          'Brommapojkarna',
        ],
      },
      {
        name: 'Superettan',
        type: 'Pontos Corridos',
        teams: ['Degerfors IF', 'Östers IF', 'Landskrona BoIS', 'Sandvikens IF', 'Helsingborgs IF', 'IK Brage'],
      },
    ],
  },
  {
    code: 'FIN',
    name: 'Finlândia',
    flag: '🇫🇮',
    leagues: [
      {
        name: 'Veikkausliiga',
        type: 'Pontos Corridos',
        teams: [
          'HJK Helsinki',
          'KuPS',
          'Ilves',
          'SJK Seinäjoki',
          'FC Inter Turku',
          'VPS Vaasa',
          'IFK Mariehamn',
          'FC Haka',
          'AC Oulu',
          'Ekenäs IF',
          'IF Gnistan',
          'FC Lahti',
        ],
      },
    ],
  },
  {
    code: 'BRA',
    name: 'Brasil',
    flag: '🇧🇷',
    leagues: [
      {
        name: 'Brasileirão Série A',
        type: 'Pontos Corridos',
        teams: [
          'Flamengo',
          'Palmeiras',
          'São Paulo',
          'Corinthians',
          'Santos',
          'Grêmio',
          'Internacional',
          'Atlético Mineiro',
          'Cruzeiro',
          'Fluminense',
          'Botafogo',
          'Vasco da Gama',
          'Athletico-PR',
          'Bahia',
          'Fortaleza',
          'Red Bull Bragantino',
          'Vitória',
          'Criciúma',
          'Juventude',
          'Cuiabá',
        ],
      },
      {
        name: 'Brasileirão Série B',
        type: 'Pontos Corridos',
        teams: [
          'Sport Recife',
          'Ceará',
          'Goiás',
          'Coritiba',
          'América-MG',
          'Novorizontino',
          'Mirassol',
          'Vila Nova',
          'Avaí',
          'Operário-PR',
          'Ponte Preta',
          'Chapecoense',
          'CRB',
          'Paysandu',
          'Guarani',
          'Ituano',
        ],
      },
    ],
  },
  {
    code: 'ARG',
    name: 'Argentina',
    flag: '🇦🇷',
    leagues: [
      {
        name: 'Liga Profesional',
        type: 'Pontos Corridos',
        teams: [
          'River Plate',
          'Boca Juniors',
          'Racing Club',
          'Independiente',
          'San Lorenzo',
          'Vélez Sarsfield',
          'Estudiantes LP',
          'Rosario Central',
          'Newell\'s Old Boys',
          'Lanús',
          'Talleres de Córdoba',
          'Defensa y Justicia',
          'Argentinos Juniors',
          'Huracán',
          'Belgrano',
          'Godoy Cruz',
          'Gimnasia LP',
          'Platense',
        ],
      },
    ],
  },
  {
    code: 'AUT',
    name: 'Áustria',
    flag: '🇦🇹',
    leagues: [
      {
        name: 'Austrian Bundesliga',
        type: 'Pontos Corridos',
        teams: [
          'Red Bull Salzburg',
          'Sturm Graz',
          'LASK',
          'Rapid Wien',
          'Austria Wien',
          'Wolfsberger AC',
          'TSV Hartberg',
          'SCR Altach',
          'Austria Klagenfurt',
          'Blau-Weiß Linz',
          'WSG Tirol',
          'Grazer AK',
        ],
      },
    ],
  },
  {
    code: 'SUI',
    name: 'Suíça',
    flag: '🇨🇭',
    leagues: [
      {
        name: 'Swiss Super League',
        type: 'Pontos Corridos',
        teams: [
          'BSC Young Boys',
          'FC Basel',
          'FC Zürich',
          'Servette FC',
          'FC Lugano',
          'FC St. Gallen',
          'FC Luzern',
          'Grasshopper Club',
          'FC Winterthur',
          'FC Lausanne-Sport',
          'Yverdon Sport',
          'FC Sion',
        ],
      },
    ],
  },
  {
    code: 'USA',
    name: 'Estados Unidos',
    flag: '🇺🇸',
    leagues: [
      {
        name: 'Major League Soccer',
        type: 'Pontos Corridos',
        teams: [
          'Inter Miami',
          'Los Angeles FC',
          'LA Galaxy',
          'Columbus Crew',
          'FC Cincinnati',
          'Seattle Sounders',
          'Atlanta United',
          'New York Red Bulls',
          'Philadelphia Union',
          'Orlando City',
          'Houston Dynamo',
          'Real Salt Lake',
          'Portland Timbers',
          'Minnesota United',
        ],
      },
    ],
  },
  {
    code: 'MEX',
    name: 'México',
    flag: '🇲🇽',
    leagues: [
      {
        name: 'Liga MX',
        type: 'Pontos Corridos',
        teams: [
          'Club América',
          'Guadalajara',
          'Tigres UANL',
          'Monterrey',
          'Cruz Azul',
          'Pumas UNAM',
          'Toluca',
          'Pachuca',
          'Santos Laguna',
          'Club León',
          'Atlas',
          'Tijuana',
        ],
      },
    ],
  },
];

/**
 * Maps any country name or code variation to standard friendly name
 */
export function getCanonicalCountryName(query: string): string {
  const norm = normalizeText(query);
  if (!norm) return query;

  for (const c of CANONICAL_COUNTRIES) {
    if (
      normalizeText(c.name) === norm ||
      normalizeText(c.code) === norm ||
      norm.includes(normalizeText(c.name)) ||
      normalizeText(c.name).includes(norm)
    ) {
      return c.name;
    }
  }

  // Common country aliases
  const aliasMap: Record<string, string> = {
    islandia: 'Islândia',
    iceland: 'Islândia',
    noruega: 'Noruega',
    norway: 'Noruega',
    dinamarca: 'Dinamarca',
    denmark: 'Dinamarca',
    suecia: 'Suécia',
    sweden: 'Suécia',
    finlandia: 'Finlândia',
    finland: 'Finlândia',
    brasil: 'Brasil',
    brazil: 'Brasil',
    argentina: 'Argentina',
    austria: 'Áustria',
    suica: 'Suíça',
    switzerland: 'Suíça',
    estadosunidos: 'Estados Unidos',
    usa: 'Estados Unidos',
    mexico: 'México',
    inglaterra: 'Inglaterra',
    england: 'Inglaterra',
    escocia: 'Escócia',
    scotland: 'Escócia',
    alemanha: 'Alemanha',
    germany: 'Alemanha',
    espanha: 'Espanha',
    spain: 'Espanha',
    franca: 'França',
    france: 'França',
    belgica: 'Bélgica',
    belgium: 'Bélgica',
    portugal: 'Portugal',
    italia: 'Itália',
    italy: 'Itália',
    turquia: 'Turquia',
    turkey: 'Turquia',
    grecia: 'Grécia',
    greece: 'Grécia',
    holanda: 'Holanda',
    netherlands: 'Holanda',
  };

  const cleanKey = norm.replace(/\s+/g, '');
  if (aliasMap[cleanKey]) return aliasMap[cleanKey];

  return query;
}

/**
 * Checks if a league belongs to a country using resilient multi-tier matching
 */
export function isLeagueInCountry(
  league: League,
  countryIdOrObj?: string | Country | null,
  countriesList: Country[] = []
): boolean {
  if (!countryIdOrObj || countryIdOrObj === 'ALL' || countryIdOrObj === '') return true;

  const targetCountry: Country | undefined =
    typeof countryIdOrObj === 'object'
      ? countryIdOrObj
      : countriesList.find(c => c.id === countryIdOrObj || c.name === countryIdOrObj || c.code === countryIdOrObj);

  const targetId = typeof countryIdOrObj === 'string' ? countryIdOrObj : countryIdOrObj?.id;
  const targetName = targetCountry?.name || (typeof countryIdOrObj === 'string' ? countryIdOrObj : '');
  const targetCode = targetCountry?.code || '';

  const normTargetName = normalizeText(targetName);
  const normTargetId = normalizeText(targetId);
  const normLeagueCountryName = normalizeText(league.countryName);
  const normLeagueCountryId = normalizeText(league.countryId);
  const normLeagueName = normalizeText(league.name);

  // 1. Direct ID match
  if (targetId && (league.countryId === targetId || normLeagueCountryId === normTargetId)) {
    return true;
  }

  // 2. Direct Code match (e.g. NOR, ISL, BRA, ENG)
  if (targetCode) {
    const ucCode = targetCode.toUpperCase();
    if (
      league.countryId?.toUpperCase() === ucCode ||
      league.countryName?.toUpperCase() === ucCode ||
      league.name?.toUpperCase().includes(` ${ucCode}`) ||
      league.name?.toUpperCase().endsWith(`(${ucCode})`)
    ) {
      return true;
    }
  }

  // 3. Country Name match
  if (normTargetName) {
    if (normLeagueCountryName && normLeagueCountryName === normTargetName) return true;
    if (normLeagueCountryId && normLeagueCountryId === normTargetName) return true;
  }

  // 4. Check canonical country database definition (ONLY for the target country)
  const canonicalDef = CANONICAL_COUNTRIES.find(
    c =>
      normalizeText(c.name) === normTargetName ||
      (targetCode && c.code.toUpperCase() === targetCode.toUpperCase())
  );

  if (canonicalDef) {
    const isCanonicalLeague = canonicalDef.leagues.some(
      cl =>
        normalizeText(cl.name) === normLeagueName ||
        normLeagueName.includes(normalizeText(cl.name)) ||
        normalizeText(cl.name).includes(normLeagueName)
    );
    if (isCanonicalLeague) return true;
  }

  return false;
}

/**
 * Resiliently finds and returns all available leagues for a given country,
 * combining dbState.leagues, matches distinct leagues, and canonical league definitions.
 */
export function getLeaguesForCountry(dbState: DbState, selectedCountryId?: string): League[] {
  let leaguesList: League[] = [];

  if (!selectedCountryId || selectedCountryId === 'ALL') {
    leaguesList = dbState.leagues || [];
  } else {
    const country = (dbState.countries || []).find(
      c => c.id === selectedCountryId || c.name === selectedCountryId || c.code === selectedCountryId
    );

    const directLeagues = (dbState.leagues || []).filter(l =>
      isLeagueInCountry(l, country || selectedCountryId, dbState.countries || [])
    );

    const leaguesMap = new Map<string, League>();
    directLeagues.forEach(l => {
      const norm = normalizeText(l.name);
      if (!leaguesMap.has(norm)) {
        leaguesMap.set(norm, l);
      }
    });

    // Also check matches in case there are leagues linked to this country in matches
    const normCountryName = normalizeText(country?.name || selectedCountryId);
    const countryMatches = (dbState.matches || []).filter(m => {
      if (m.countryId === selectedCountryId) return true;
      if (m.countryName && normalizeText(m.countryName) === normCountryName) return true;
      if (country?.code && m.countryId?.toUpperCase() === country.code.toUpperCase()) return true;
      return false;
    });

    for (const m of countryMatches) {
      if (m.leagueName) {
        const norm = normalizeText(m.leagueName);
        if (!leaguesMap.has(norm)) {
          const lid = m.leagueId || `LIGA-EXTRA-${norm.replace(/\s+/g, '-')}`;
          const syntheticLeague: League = {
            id: lid,
            name: m.leagueName,
            countryId: country?.id || selectedCountryId,
            countryName: country?.name || m.countryName || 'País',
            type: 'Pontos Corridos',
            createdAt: new Date().toISOString(),
          };
          leaguesMap.set(norm, syntheticLeague);
        }
      }
    }

    // If still empty, check canonical database definition (e.g. Islândia, Noruega, Dinamarca, Brasil, etc.)
    if (leaguesMap.size === 0 && country) {
      const canonicalDef = CANONICAL_COUNTRIES.find(
        c =>
          normalizeText(c.name) === normCountryName ||
          (country.code && c.code.toUpperCase() === country.code.toUpperCase()) ||
          c.name.toLowerCase() === country.name.toLowerCase()
      );

      if (canonicalDef) {
        canonicalDef.leagues.forEach((cl, idx) => {
          const norm = normalizeText(cl.name);
          if (!leaguesMap.has(norm)) {
            const generatedId = `LIGA-${canonicalDef.code}-${String(idx + 1).padStart(3, '0')}`;
            const canonicalLeague: League = {
              id: generatedId,
              name: cl.name,
              countryId: country.id,
              countryName: country.name,
              type: cl.type || 'Pontos Corridos',
              createdAt: new Date().toISOString(),
            };
            leaguesMap.set(norm, canonicalLeague);
          }
        });
      } else {
        // Generic fallback for any user-created country
        const fallbackId = `LIGA-${normalizeText(country.name).toUpperCase().substring(0, 3)}-001`;
        const fallbackLeague: League = {
          id: fallbackId,
          name: `Liga Principal ${country.name}`,
          countryId: country.id,
          countryName: country.name,
          type: 'Pontos Corridos',
          createdAt: new Date().toISOString(),
        };
        leaguesMap.set(normalizeText(fallbackLeague.name), fallbackLeague);
      }
    }

    leaguesList = Array.from(leaguesMap.values());
  }

  // Deduplicate leagues by normalized name
  const deduplicated = new Map<string, League>();
  for (const l of leaguesList) {
    if (!l || !l.name) continue;
    const norm = normalizeText(l.name);
    if (!norm) continue;
    if (!deduplicated.has(norm)) {
      deduplicated.set(norm, l);
    }
  }

  return Array.from(deduplicated.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/**
 * Resiliently finds all available teams for a given league and/or country
 */
export function getTeamsForLeagueOrCountry(
  dbState: DbState,
  selectedLeagueId?: string,
  selectedCountryId?: string
): Team[] {
  const teams = dbState.teams || [];
  const matches = dbState.matches || [];

  const country = (dbState.countries || []).find(
    c => c.id === selectedCountryId || c.name === selectedCountryId || c.code === selectedCountryId
  );
  const league = (dbState.leagues || []).find(l => l.id === selectedLeagueId);

  const normCountryName = normalizeText(country?.name || selectedCountryId);
  const normLeagueName = normalizeText(league?.name || selectedLeagueId);

  const matchedTeamsMap = new Map<string, Team>();

  // If league is selected:
  if (selectedLeagueId && selectedLeagueId !== '' && selectedLeagueId !== 'ALL') {
    // 1. Teams with matching leagueId or in leagueIds
    teams.forEach(t => {
      if (t.leagueId === selectedLeagueId || t.leagueIds?.includes(selectedLeagueId)) {
        matchedTeamsMap.set(t.id, t);
      } else if (normLeagueName && t.leagueName && normalizeText(t.leagueName) === normLeagueName) {
        matchedTeamsMap.set(t.id, t);
      }
    });

    // 2. Teams from matches of this league
    matches.forEach(m => {
      if (m.leagueId === selectedLeagueId || (normLeagueName && m.leagueName && normalizeText(m.leagueName) === normLeagueName)) {
        if (m.homeTeamId && !matchedTeamsMap.has(m.homeTeamId)) {
          const t = teams.find(team => team.id === m.homeTeamId);
          if (t) matchedTeamsMap.set(t.id, t);
          else if (m.homeTeamName) {
            matchedTeamsMap.set(m.homeTeamId, {
              id: m.homeTeamId,
              name: m.homeTeamName,
              countryId: country?.id || m.countryId || '',
              countryName: country?.name || m.countryName || '',
              leagueId: selectedLeagueId,
              leagueName: league?.name || m.leagueName,
              createdAt: new Date().toISOString(),
            });
          }
        }
        if (m.awayTeamId && !matchedTeamsMap.has(m.awayTeamId)) {
          const t = teams.find(team => team.id === m.awayTeamId);
          if (t) matchedTeamsMap.set(t.id, t);
          else if (m.awayTeamName) {
            matchedTeamsMap.set(m.awayTeamId, {
              id: m.awayTeamId,
              name: m.awayTeamName,
              countryId: country?.id || m.countryId || '',
              countryName: country?.name || m.countryName || '',
              leagueId: selectedLeagueId,
              leagueName: league?.name || m.leagueName,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    });

    // 3. If still empty, check canonical database for this league
    if (matchedTeamsMap.size === 0) {
      for (const cDef of CANONICAL_COUNTRIES) {
        for (const lDef of cDef.leagues) {
          if (
            normalizeText(lDef.name) === normLeagueName ||
            normLeagueName.includes(normalizeText(lDef.name)) ||
            normalizeText(lDef.name).includes(normLeagueName)
          ) {
            lDef.teams.forEach((tName, idx) => {
              const tid = `TIME-${cDef.code}-${String(idx + 1).padStart(3, '0')}`;
              matchedTeamsMap.set(tid, {
                id: tid,
                name: tName,
                countryId: country?.id || `PAIS-${cDef.code}`,
                countryName: country?.name || cDef.name,
                leagueId: selectedLeagueId,
                leagueName: league?.name || lDef.name,
                createdAt: new Date().toISOString(),
              });
            });
            break;
          }
        }
        if (matchedTeamsMap.size > 0) break;
      }
    }
  }

  // If no league selected or league has no teams, filter by country
  if (matchedTeamsMap.size === 0 && selectedCountryId && selectedCountryId !== 'ALL') {
    teams.forEach(t => {
      if (t.countryId === selectedCountryId) {
        matchedTeamsMap.set(t.id, t);
      } else if (normCountryName && t.countryName && normalizeText(t.countryName) === normCountryName) {
        matchedTeamsMap.set(t.id, t);
      } else if (country?.code && t.countryId?.toUpperCase() === country.code.toUpperCase()) {
        matchedTeamsMap.set(t.id, t);
      }
    });

    // Also check matches of this country
    matches.forEach(m => {
      const isCountryMatch =
        m.countryId === selectedCountryId ||
        (m.countryName && normalizeText(m.countryName) === normCountryName) ||
        (country?.code && m.countryId?.toUpperCase() === country.code.toUpperCase());

      if (isCountryMatch) {
        if (m.homeTeamId && !matchedTeamsMap.has(m.homeTeamId)) {
          const t = teams.find(team => team.id === m.homeTeamId);
          if (t) matchedTeamsMap.set(t.id, t);
          else if (m.homeTeamName) {
            matchedTeamsMap.set(m.homeTeamId, {
              id: m.homeTeamId,
              name: m.homeTeamName,
              countryId: country?.id || m.countryId || '',
              countryName: country?.name || m.countryName || '',
              leagueId: m.leagueId,
              leagueName: m.leagueName,
              createdAt: new Date().toISOString(),
            });
          }
        }
        if (m.awayTeamId && !matchedTeamsMap.has(m.awayTeamId)) {
          const t = teams.find(team => team.id === m.awayTeamId);
          if (t) matchedTeamsMap.set(t.id, t);
          else if (m.awayTeamName) {
            matchedTeamsMap.set(m.awayTeamId, {
              id: m.awayTeamId,
              name: m.awayTeamName,
              countryId: country?.id || m.countryId || '',
              countryName: country?.name || m.countryName || '',
              leagueId: m.leagueId,
              leagueName: m.leagueName,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    });

    // Check canonical country teams
    if (matchedTeamsMap.size === 0 && country) {
      const canonicalDef = CANONICAL_COUNTRIES.find(
        c =>
          normalizeText(c.name) === normCountryName ||
          (country.code && c.code.toUpperCase() === country.code.toUpperCase())
      );
      if (canonicalDef) {
        canonicalDef.leagues.forEach(lDef => {
          lDef.teams.forEach((tName, idx) => {
            const tid = `TIME-${canonicalDef.code}-${String(idx + 1).padStart(3, '0')}`;
            if (!matchedTeamsMap.has(tid)) {
              matchedTeamsMap.set(tid, {
                id: tid,
                name: tName,
                countryId: country.id,
                countryName: country.name,
                leagueId: selectedLeagueId || undefined,
                leagueName: league?.name || lDef.name,
                createdAt: new Date().toISOString(),
              });
            }
          });
        });
      }
    }
  }

  // If completely unfiltered and nothing found, return all teams
  if (matchedTeamsMap.size === 0 && (!selectedCountryId || selectedCountryId === 'ALL') && (!selectedLeagueId || selectedLeagueId === '' || selectedLeagueId === 'ALL')) {
    teams.forEach(t => matchedTeamsMap.set(t.id, t));
  }

  // Deduplicate teams by normalized name
  const deduplicated = new Map<string, Team>();
  for (const t of matchedTeamsMap.values()) {
    if (!t || !t.name) continue;
    const norm = normalizeText(t.name);
    if (!norm) continue;
    if (!deduplicated.has(norm)) {
      deduplicated.set(norm, t);
    }
  }

  return Array.from(deduplicated.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/**
 * Enriches and heals the DbState so all canonical countries, leagues and teams are integrated
 * and properly cross-linked with consistent IDs.
 */
export function ensureCanonicalCountriesAndLeagues(dbState: DbState): DbState {
  if (!dbState) return dbState;

  const countries = [...(dbState.countries || [])];
  const leagues = [...(dbState.leagues || [])];
  const teams = [...(dbState.teams || [])];
  const matches = [...(dbState.matches || [])];
  const users = [...(dbState.users || [])];

  const countryById = new Map<string, Country>();
  const countryByNorm = new Map<string, Country>();

  // Map existing countries
  countries.forEach(c => {
    countryById.set(c.id, c);
    countryByNorm.set(normalizeText(c.name), c);
    if (c.code) countryByNorm.set(c.code.toUpperCase(), c);
  });

  // Calculate highest IDs
  let maxCountryNum = 0;
  countries.forEach(c => {
    const m = c.id?.match(/PAIS[-_]?(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxCountryNum) maxCountryNum = n;
    }
  });

  let maxLeagueNum = 0;
  leagues.forEach(l => {
    const m = l.id?.match(/LIGA[-_]?(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxLeagueNum) maxLeagueNum = n;
    }
  });

  let maxTeamNum = 0;
  teams.forEach(t => {
    const m = t.id?.match(/TIME[-_]?(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxTeamNum) maxTeamNum = n;
    }
  });

  // 1. Enrich existing countries with standard code & flag if available
  for (const country of countries) {
    const canon = CANONICAL_COUNTRIES.find(
      c => normalizeText(c.name) === normalizeText(country.name) || c.code.toUpperCase() === country.code?.toUpperCase()
    );
    if (canon) {
      if (!country.code) country.code = canon.code;
      if (!country.flagUrl) country.flagUrl = canon.flag;
    }
  }

  // 2. Heal existing leagues and matches with proper countryIds
  leagues.forEach(l => {
    if (!l.countryId || !countryById.has(l.countryId)) {
      const matchCountry =
        countryByNorm.get(normalizeText(l.countryName)) ||
        (l.countryId ? countryByNorm.get(normalizeText(l.countryId)) : null) ||
        (l.countryId ? countryByNorm.get(l.countryId.toUpperCase()) : null);
      if (matchCountry) {
        l.countryId = matchCountry.id;
        l.countryName = matchCountry.name;
      }
    }
  });

  return {
    ...dbState,
    countries,
    leagues,
    teams,
    matches,
    users,
  };
}

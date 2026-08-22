import { DbState, Country, League, Team, Match } from '../types';

export interface SanitizeStats {
  foreignLeaguesRemoved: number;
  teamsCleaned: number;
  duplicatesRemoved: number;
  matchesFixed: number;
  details: string[];
}

/**
 * Base de conhecimento canônica de clubes conhecidos para desambiguação automática
 * e garantia de vínculo correto de País e Liga principal.
 */
const CANONICAL_CLUBS: Record<string, { countryCode: string; defaultLeaguePattern: string }> = {
  // Holanda (NLD / HOL)
  ajax: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'psv eindhoven': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  psv: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  feyenoord: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'az alkmaar': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  az: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  utrecht: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  twente: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  heerenveen: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  zwolle: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  groningen: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'sparta rotterdam': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'den haag': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'for sittard': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'fortuna sittard': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'willem ii': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'go ahead eagles': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  telstar: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  nijmegen: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  nec: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  excelsior: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  cambuur: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  vitesse: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  volendam: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  breda: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'nac breda': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'almere city': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  heracles: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  waalwijk: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },

  // Bélgica (BEL)
  'raal la louviere': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'la louviere': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'club brugge': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  kortrijk: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  standard: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'standard liege': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'cercle brugge': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'st truiden': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'lommel sk': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  lommel: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  westerlo: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'st. gilloise': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'union st. gilloise': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  gent: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  mechelen: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  charleroi: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'oud-heverlee leuven': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'oh leuven': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  waregem: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'zulte waregem': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  genk: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  anderlecht: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  antwerp: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  eupen: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  beerschot: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  dender: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },

  // Escócia (ESC / SCO)
  dunfermline: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  ayr: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  'ayr united': { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  arbroath: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  'inverness c': { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  livingston: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  'queens park': { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  morton: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  partick: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  'raith rvs': { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  'raith rovers': { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  stenhousemuir: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  alloa: { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'east fife': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'cove rangers': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'airdrie utd': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'east kilbride': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'queen of sth': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  montrose: { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  hamilton: { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  peterhead: { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'ross county': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'annan athletic': { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  spartans: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  clyde: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  stranraer: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  'edinburgh city': { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  elgin: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  forfar: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  'kelty hearts': { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  stirling: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  dumbarton: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  'dundee united': { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  rangers: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  falkirk: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  'st mirren': { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  aberdeen: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  hearts: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  'st johnstone': { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  kilmarnock: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  hibernian: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  motherwell: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  celtic: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  dundee: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },

  // Inglaterra (ING)
  wolves: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  blackburn: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  bolton: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  preston: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'bristol city': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  millwall: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  charlton: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  derby: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  middlesbrough: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  lincoln: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  norwich: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'west brom': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  portsmouth: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  qpr: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  stoke: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  swansea: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'sheffield united': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  birmingham: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  watford: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  southampton: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  burnley: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'west ham': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  cardiff: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  wrexham: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
};

/**
 * Sanitiza e repara o banco de dados contra inconsistências:
 * 1. Remove ligas estrangeiras indevidas de `team.leagueIds` (ex: tira Championship ING de times da Holanda, Escócia, Bélgica, etc.).
 * 2. Restaura o país e a liga corretos para times conhecidos.
 * 3. Remove duplicidades de times com mesmo nome e país.
 * 4. Garante sincronia 100% perfeita entre países, ligas, times e partidas.
 */
export function sanitizeAndCleanDb(dbState: DbState): { cleanedDb: DbState; stats: SanitizeStats } {
  const stats: SanitizeStats = {
    foreignLeaguesRemoved: 0,
    teamsCleaned: 0,
    duplicatesRemoved: 0,
    matchesFixed: 0,
    details: [],
  };

  if (!dbState) {
    return { cleanedDb: { countries: [], leagues: [], teams: [], matches: [], users: [] }, stats };
  }

  const countries = [...(dbState.countries || [])];
  const leagues = [...(dbState.leagues || [])];
  const teams = [...(dbState.teams || [])];
  const matches = [...(dbState.matches || [])];
  const users = [...(dbState.users || [])];

  // Mapas auxiliares rápidos
  const countryById = new Map<string, Country>();
  const countryByCode = new Map<string, Country>();
  countries.forEach(c => {
    countryById.set(c.id, c);
    if (c.code) countryByCode.set(c.code.toUpperCase(), c);
    countryByCode.set(c.name.toUpperCase(), c);
  });

  const leagueById = new Map<string, League>();
  leagues.forEach(l => {
    leagueById.set(l.id, l);
    // Garantir que a liga tenha countryName correto
    if (l.countryId && !l.countryName) {
      const c = countryById.get(l.countryId);
      if (c) l.countryName = c.name;
    }
  });

  // 1. Sanitizar e corrigir cada time
  const cleanedTeams: Team[] = [];
  const teamNameToId = new Map<string, string>(); // `countryId_normalizedTeamName` -> teamId

  for (const team of teams) {
    let modified = false;
    const cloned: Team = { ...team };
    const normName = (cloned.name || '').trim().toLowerCase();

    // A. Verificar se é clube canônico conhecido
    const canonical = CANONICAL_CLUBS[normName];
    if (canonical) {
      const targetCountry = countryByCode.get(canonical.countryCode) ||
        countries.find(c => c.name.toUpperCase().includes(canonical.countryCode) || (c.code && c.code.toUpperCase() === canonical.countryCode));

      if (targetCountry && cloned.countryId !== targetCountry.id) {
        cloned.countryId = targetCountry.id;
        cloned.countryName = targetCountry.name;
        modified = true;
        stats.details.push(`Time "${cloned.name}" corrigido para o país ${targetCountry.name}.`);
      }

      // Procurar liga correta no país alvo
      if (targetCountry) {
        const matchingLeague = leagues.find(
          l => l.countryId === targetCountry.id && l.name.toLowerCase().includes(canonical.defaultLeaguePattern.toLowerCase())
        );
        if (matchingLeague && cloned.leagueId !== matchingLeague.id) {
          cloned.leagueId = matchingLeague.id;
          cloned.leagueName = matchingLeague.name;
          modified = true;
        }
      }
    }

    // B. Garantir que o país do time exista
    if (!cloned.countryId && cloned.leagueId) {
      const l = leagueById.get(cloned.leagueId);
      if (l && l.countryId) {
        cloned.countryId = l.countryId;
        cloned.countryName = l.countryName || countryById.get(l.countryId)?.name || '';
        modified = true;
      }
    }

    if (cloned.countryId && !cloned.countryName) {
      const c = countryById.get(cloned.countryId);
      if (c) {
        cloned.countryName = c.name;
        modified = true;
      }
    }

    // C. Limpar `leagueIds` - NUNCA permitir ligas de outro país!
    const rawLeagueIds = cloned.leagueIds ? [...cloned.leagueIds] : (cloned.leagueId ? [cloned.leagueId] : []);
    const validLeagueIds: string[] = [];

    for (const lid of rawLeagueIds) {
      const l = leagueById.get(lid);
      if (!l) continue; // Liga não existe mais

      // Se a liga pertencer a um país diferente do país do time, É LIGA CRUZADA INVÁLIDA!
      if (cloned.countryId && l.countryId && l.countryId !== cloned.countryId) {
        stats.foreignLeaguesRemoved++;
        modified = true;
        stats.details.push(`Removida liga indevida "${l.name}" do time "${cloned.name}" (${cloned.countryName || 'País'}).`);
        continue;
      }

      if (!validLeagueIds.includes(lid)) {
        validLeagueIds.push(lid);
      }
    }

    // Se o time tem uma liga principal válida dentro de seu país
    if (cloned.leagueId) {
      const primLeague = leagueById.get(cloned.leagueId);
      if (primLeague && primLeague.countryId && cloned.countryId && primLeague.countryId !== cloned.countryId) {
        // A liga principal apontava para outro país! Corrigir
        const validLocalLeague = leagues.find(l => l.countryId === cloned.countryId);
        if (validLocalLeague) {
          cloned.leagueId = validLocalLeague.id;
          cloned.leagueName = validLocalLeague.name;
          modified = true;
        } else {
          cloned.leagueId = undefined;
          cloned.leagueName = undefined;
          modified = true;
        }
      } else if (primLeague) {
        cloned.leagueName = primLeague.name;
      }
    }

    // Se validLeagueIds ficou vazio mas o time tem liga no país
    if (validLeagueIds.length === 0 && cloned.leagueId) {
      validLeagueIds.push(cloned.leagueId);
      modified = true;
    } else if (validLeagueIds.length > 0 && !cloned.leagueId) {
      cloned.leagueId = validLeagueIds[0];
      const l = leagueById.get(cloned.leagueId);
      cloned.leagueName = l?.name;
      modified = true;
    }

    cloned.leagueIds = validLeagueIds;

    if (modified) {
      stats.teamsCleaned++;
    }

    // D. Deduplicação de times duplicados dentro do mesmo país
    const lookupKey = `${cloned.countryId || 'NO_COUNTRY'}_${normName}`;
    const existingTeamId = teamNameToId.get(lookupKey);

    if (existingTeamId) {
      // Já temos esse time registrado no mesmo país! Vamos mesclar escudos e ligas
      const existingTeam = cleanedTeams.find(t => t.id === existingTeamId);
      if (existingTeam) {
        if (!existingTeam.logoUrl && cloned.logoUrl) {
          existingTeam.logoUrl = cloned.logoUrl;
        }
        if (cloned.leagueIds) {
          cloned.leagueIds.forEach(lid => {
            if (!existingTeam.leagueIds?.includes(lid)) {
              existingTeam.leagueIds = [...(existingTeam.leagueIds || []), lid];
            }
          });
        }
        stats.duplicatesRemoved++;
        stats.details.push(`Duplicidade mesclada: Time "${cloned.name}" (ID ${cloned.id} incorporado ao ${existingTeam.id}).`);
        continue;
      }
    }

    teamNameToId.set(lookupKey, cloned.id);
    cleanedTeams.push(cloned);
  }

  // 2. Corrigir referências nas partidas
  const teamById = new Map<string, Team>(cleanedTeams.map(t => [t.id, t]));
  const teamByCountryAndName = new Map<string, Team>();
  cleanedTeams.forEach(t => {
    teamByCountryAndName.set(`${t.countryId}_${t.name.trim().toLowerCase()}`, t);
    teamByCountryAndName.set(t.name.trim().toLowerCase(), t);
  });

  const cleanedMatches = matches.map(m => {
    let matchModified = false;
    const match = { ...m };

    // Se o time mandante ou visitante foi mesclado/atualizado
    if (match.homeTeamId && teamById.has(match.homeTeamId)) {
      const ht = teamById.get(match.homeTeamId)!;
      if (match.homeTeamName !== ht.name) {
        match.homeTeamName = ht.name;
        matchModified = true;
      }
      if (ht.logoUrl && !match.homeTeamLogoUrl) {
        match.homeTeamLogoUrl = ht.logoUrl;
        matchModified = true;
      }
    }

    if (match.awayTeamId && teamById.has(match.awayTeamId)) {
      const at = teamById.get(match.awayTeamId)!;
      if (match.awayTeamName !== at.name) {
        match.awayTeamName = at.name;
        matchModified = true;
      }
      if (at.logoUrl && !match.awayTeamLogoUrl) {
        match.awayTeamLogoUrl = at.logoUrl;
        matchModified = true;
      }
    }

    // Garantir que a liga e o país do jogo estejam preenchidos
    if (match.leagueId && leagueById.has(match.leagueId)) {
      const l = leagueById.get(match.leagueId)!;
      if (match.leagueName !== l.name) {
        match.leagueName = l.name;
        matchModified = true;
      }
      if (l.countryId && match.countryId !== l.countryId) {
        match.countryId = l.countryId;
        match.countryName = l.countryName || countryById.get(l.countryId)?.name || match.countryName;
        matchModified = true;
      }
    }

    if (matchModified) {
      stats.matchesFixed++;
    }

    return match;
  });

  return {
    cleanedDb: {
      countries,
      leagues,
      teams: cleanedTeams,
      matches: cleanedMatches,
      users,
    },
    stats,
  };
}

import { Country, League, Team, Match } from '../types';

export function getNextUniqueId(prefix: 'PAIS' | 'LIGA' | 'TIME' | 'JOGO', existingIds: (string | { id?: string } | any)[]): string {
  let maxNum = 0;
  const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');

  for (const item of existingIds) {
    if (!item) continue;
    const strId = typeof item === 'string' ? item : (typeof item === 'object' && item.id ? String(item.id) : String(item));
    if (typeof strId === 'string' && typeof strId.match === 'function') {
      const match = strId.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  // Format as PAIS-001, PAIS-002, PAIS-010, PAIS-100, etc.
  const padded = nextNum.toString().padStart(3, '0');
  return `${prefix}-${padded}`;
}

export function findOrCreateCountry(
  name: string,
  countries: Country[],
  code?: string,
  flagUrl?: string
): { country: Country; isNew: boolean; updatedCountries: Country[] } {
  const trimmedName = name.trim();
  const existing = countries.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());

  if (existing) {
    if (flagUrl && !existing.flagUrl) {
      existing.flagUrl = flagUrl;
    }
    return { country: existing, isNew: false, updatedCountries: countries };
  }

  const newId = getNextUniqueId('PAIS', countries.map(c => c.id));
  const newCountry: Country = {
    id: newId,
    name: trimmedName,
    code: code || trimmedName.substring(0, 3).toUpperCase(),
    flagUrl: flagUrl || undefined,
    createdAt: new Date().toISOString(),
  };

  return {
    country: newCountry,
    isNew: true,
    updatedCountries: [...countries, newCountry],
  };
}

export function findOrCreateLeague(
  leagueName: string,
  countryId: string,
  countryName: string,
  leagues: League[],
  type?: string,
  logoUrl?: string
): { league: League; isNew: boolean; updatedLeagues: League[] } {
  const trimmedName = leagueName.trim();
  const existing = leagues.find(
    l => l.name.toLowerCase() === trimmedName.toLowerCase() && l.countryId === countryId
  );

  if (existing) {
    if (logoUrl && !existing.logoUrl) {
      existing.logoUrl = logoUrl;
    }
    return { league: existing, isNew: false, updatedLeagues: leagues };
  }

  const newId = getNextUniqueId('LIGA', leagues.map(l => l.id));
  const newLeague: League = {
    id: newId,
    name: trimmedName,
    countryId,
    countryName,
    type: type || 'Pontos Corridos',
    logoUrl: logoUrl || undefined,
    createdAt: new Date().toISOString(),
  };

  return {
    league: newLeague,
    isNew: true,
    updatedLeagues: [...leagues, newLeague],
  };
}

export function findOrCreateTeam(
  teamName: string,
  countryId: string,
  countryName: string,
  teams: Team[],
  stadiumUnused?: string,
  logoUrl?: string,
  leagueId?: string,
  leagueName?: string
): { team: Team; isNew: boolean; updatedTeams: Team[] } {
  const trimmedName = teamName.trim();
  const existing = teams.find(
    t => t.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (existing) {
    let updated = false;
    const cloned: Team = { ...existing };
    if (logoUrl && !cloned.logoUrl) {
      cloned.logoUrl = logoUrl;
      updated = true;
    }
    if (leagueId) {
      if (!cloned.leagueId) {
        cloned.leagueId = leagueId;
        cloned.leagueName = leagueName;
        updated = true;
      }
      const ids = cloned.leagueIds ? [...cloned.leagueIds] : (cloned.leagueId ? [cloned.leagueId] : []);
      if (!ids.includes(leagueId)) {
        ids.push(leagueId);
        cloned.leagueIds = ids;
        updated = true;
      }
    }
    if (updated) {
      const updatedTeams = teams.map(t => t.id === cloned.id ? cloned : t);
      return { team: cloned, isNew: false, updatedTeams };
    }
    return { team: existing, isNew: false, updatedTeams: teams };
  }

  const newId = getNextUniqueId('TIME', teams.map(t => t.id));
  const newTeam: Team = {
    id: newId,
    name: trimmedName,
    countryId,
    countryName,
    leagueId: leagueId || undefined,
    leagueName: leagueName || undefined,
    leagueIds: leagueId ? [leagueId] : [],
    logoUrl: logoUrl || undefined,
    createdAt: new Date().toISOString(),
  };

  return {
    team: newTeam,
    isNew: true,
    updatedTeams: [...teams, newTeam],
  };
}

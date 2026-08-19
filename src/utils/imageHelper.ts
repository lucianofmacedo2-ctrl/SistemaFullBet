/**
 * Image helper utility for validating, sanitizing, and managing entity logos and flags.
 */

/**
 * Checks if a given string is a valid, non-placeholder image URL
 */
export function isValidImageUrl(url?: any): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();

  // Filter out dummy / placeholder values
  const invalidPlaceholders = [
    'undefined',
    'null',
    'n/a',
    'na',
    '-',
    '--',
    '---',
    'none',
    'sem',
    'sem logo',
    'sem escudo',
    'sem bandeira',
    'no logo',
    'no image',
    'undefined/undefined',
    '[object object]',
    'http://',
    'https://',
    '#',
    'false',
    '0',
  ];

  if (invalidPlaceholders.includes(lower)) {
    return false;
  }

  // Must have a valid web protocol or relative path
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('data:image/') ||
    lower.startsWith('//') ||
    lower.startsWith('/') ||
    lower.startsWith('./')
  ) {
    // Avoid truncated or empty protocol string
    return trimmed.length > 7;
  }

  return false;
}

/**
 * Sanitizes an image URL, returning undefined if it is empty, dummy, or invalid
 */
export function sanitizeImageUrl(url?: any): string | undefined {
  if (!isValidImageUrl(url)) return undefined;
  return (url as string).trim();
}

/**
 * Cleans all entity logo and flag URLs in a DbState object
 */
export function sanitizeDbImages<T extends {
  countries: any[];
  leagues: any[];
  teams: any[];
  matches: any[];
}>(dbState: T): T {
  return {
    ...dbState,
    countries: dbState.countries.map(c => ({
      ...c,
      flagUrl: sanitizeImageUrl(c.flagUrl),
    })),
    leagues: dbState.leagues.map(l => ({
      ...l,
      logoUrl: sanitizeImageUrl(l.logoUrl),
    })),
    teams: dbState.teams.map(t => ({
      ...t,
      logoUrl: sanitizeImageUrl(t.logoUrl),
    })),
    matches: dbState.matches.map(m => ({
      ...m,
      countryFlagUrl: sanitizeImageUrl(m.countryFlagUrl),
      leagueLogoUrl: sanitizeImageUrl(m.leagueLogoUrl),
      homeTeamLogoUrl: sanitizeImageUrl(m.homeTeamLogoUrl),
      awayTeamLogoUrl: sanitizeImageUrl(m.awayTeamLogoUrl),
    })),
  };
}

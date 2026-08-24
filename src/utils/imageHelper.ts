/**
 * Image helper utility for validating, sanitizing, and managing entity logos and flags.
 */

/**
 * Checks if a given string is a valid, well-formed web image URL (e.g. starting with https://, http://, data:image/).
 * Strictly rejects plain text, placeholders, team names, or invalid non-URL strings.
 */
export function isValidImageUrl(url?: any): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Strip surrounding quotes or whitespace
  let trimmed = url.replace(/^['"\s]+|['"\s]+$/g, '').trim();
  if (!trimmed || trimmed.length < 8) return false;

  const lower = trimmed.toLowerCase();

  // Filter out known placeholder words and plain text labels
  const invalidPlaceholders = [
    'undefined',
    'null',
    'n/a',
    'na',
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
    'http',
    'https',
    '#',
    'false',
    'true',
    '0',
    '-',
    '--',
    '---',
    'nenhum',
    'texto',
    'estadio',
    'time',
    'logo',
    'escudo',
  ];

  if (invalidPlaceholders.includes(lower)) {
    return false;
  }

  // Base64 image support
  if (lower.startsWith('data:image/')) {
    return trimmed.length > 20 && trimmed.includes(';base64,');
  }

  // Auto-prepend https: for protocol-relative URLs
  let urlToTest = trimmed;
  if (lower.startsWith('//')) {
    urlToTest = `https:${trimmed}`;
  } else if (lower.startsWith('www.')) {
    urlToTest = `https://${trimmed}`;
  }

  // Must start with https:// or http://
  const testLower = urlToTest.toLowerCase();
  if (!testLower.startsWith('http://') && !testLower.startsWith('https://')) {
    return false;
  }

  // Replace any spaces inside URL path safely
  if (/\s/.test(urlToTest)) {
    urlToTest = encodeURI(urlToTest.replace(/\s+/g, '%20'));
  }

  // Parse as real URL
  try {
    const parsed = new URL(urlToTest);

    // Protocol must be http or https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // Hostname must be valid
    const hostname = parsed.hostname;
    if (!hostname || hostname.length < 3) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a user input URL and returns detailed error message if invalid.
 * Empty input is considered valid (as logos/flags are usually optional).
 */
export function validateImageUrlInput(url?: any): {
  isValid: boolean;
  errorMessage?: string;
  formattedUrl?: string;
} {
  if (url === undefined || url === null) {
    return { isValid: true, formattedUrl: '' };
  }

  const raw = String(url).replace(/^['"\s]+|['"\s]+$/g, '').trim();
  if (!raw) {
    return { isValid: true, formattedUrl: '' };
  }

  // Check if user typed plain text with spaces
  if (/\s/.test(raw)) {
    return {
      isValid: false,
      errorMessage: 'A URL não pode conter espaços. Digite um link válido da web.',
      formattedUrl: raw,
    };
  }

  const lower = raw.toLowerCase();

  // Check if user typed plain text without protocol
  if (!lower.startsWith('http://') && !lower.startsWith('https://') && !lower.startsWith('data:image/')) {
    if (lower.startsWith('www.')) {
      // Suggest or auto-prepend https://
      const withHttps = `https://${raw}`;
      if (isValidImageUrl(withHttps)) {
        return { isValid: true, formattedUrl: withHttps };
      }
    }
    return {
      isValid: false,
      errorMessage: 'A URL deve começar obrigatoriamente com "https://" (ex: https://dominio.com/escudo.png). Textos simples não são aceitos.',
      formattedUrl: raw,
    };
  }

  if (lower === 'https://' || lower === 'http://' || lower === 'https' || lower === 'http') {
    return {
      isValid: false,
      errorMessage: 'A URL está incompleta. Informe o domínio e caminho completo da imagem.',
      formattedUrl: raw,
    };
  }

  if (!isValidImageUrl(raw)) {
    return {
      isValid: false,
      errorMessage: 'Endereço de URL inválido. Verifique o formato (ex: https://exemplo.com/imagem.png).',
      formattedUrl: raw,
    };
  }

  return { isValid: true, formattedUrl: raw };
}

/**
 * Sanitizes an image URL, returning undefined if it is empty, dummy, or invalid
 */
export function sanitizeImageUrl(url?: any): string | undefined {
  if (!url) return undefined;
  const raw = String(url).replace(/^['"\s]+|['"\s]+$/g, '').trim();
  if (!raw) return undefined;

  // If user pasted www.domain.com/image.png, attempt prefix
  if (raw.toLowerCase().startsWith('www.')) {
    const withHttps = `https://${raw}`;
    if (isValidImageUrl(withHttps)) return withHttps;
  }

  if (!isValidImageUrl(raw)) return undefined;
  return raw;
}

/**
 * Cleans all entity logo and flag URLs in a DbState object, removing any non-URL texts
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

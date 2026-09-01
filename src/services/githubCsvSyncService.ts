import { DbState } from '../types';
import { parseAndSyncCsvLocally, ClientSyncResult } from '../utils/csvSyncParser';

export const GITHUB_REPO_FINALIZADOS_DATA_URL = 'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/data/jogos_finalizados.csv';
export const GITHUB_REPO_FUTUROS_DATA_URL = 'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/data/jogos_futuros.csv';
export const GITHUB_REPO_BASE_URL = 'https://github.com/lucianofmacedo2-ctrl/SistemaFullBet';

// Legacy fallback URLs
export const GITHUB_REPO_DATA_URL = GITHUB_REPO_FINALIZADOS_DATA_URL;
export const GITHUB_REPO_URL = 'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/jogos_finalizados.csv';
export const GITHUB_REPO_DADOS_URL = 'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/dados/jogos_finalizados.csv';

export type GitHubSyncTarget = 'both' | 'finalizados' | 'futuros';

/**
 * Downloads a single CSV file trying all candidate branch and directory permutations.
 */
async function fetchFileWithCandidates(candidateUrls: string[]): Promise<string> {
  let lastError: Error | null = null;

  for (const url of candidateUrls) {
    try {
      const response = await fetch(`${url}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Accept': 'text/plain, text/csv, application/octet-stream',
        },
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 20) {
          return text;
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw new Error(
    `Não foi possível encontrar ou baixar o arquivo (${lastError?.message || 'Arquivo não encontrado no GitHub'}). Verifique o repositório público.`
  );
}

/**
 * Fetches the finalized matches CSV (jogos_finalizados.csv) from GitHub
 */
export async function fetchFinalizadosCsv(customUrl?: string): Promise<string> {
  const candidates = customUrl
    ? [customUrl]
    : [
        GITHUB_REPO_FINALIZADOS_DATA_URL,
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/data/jogos_finalizados.csv',
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/dados/jogos_finalizados.csv',
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/dados/jogos_finalizados.csv',
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/jogos_finalizados.csv',
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/jogos_finalizados.csv',
        // Legacy fallback
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/data/jogos_consolidados.csv',
      ];

  return await fetchFileWithCandidates(candidates);
}

/**
 * Fetches the upcoming/future matches CSV (jogos_futuros.csv) from GitHub
 */
export async function fetchFuturosCsv(customUrl?: string): Promise<string> {
  const candidates = customUrl
    ? [customUrl]
    : [
        GITHUB_REPO_FUTUROS_DATA_URL,
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/data/jogos_futuros.csv',
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/dados/jogos_futuros.csv',
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/dados/jogos_futuros.csv',
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/jogos_futuros.csv',
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/jogos_futuros.csv',
      ];

  return await fetchFileWithCandidates(candidates);
}

/**
 * Legacy single-file fetcher for backwards compatibility
 */
export async function fetchCsvFromGitHub(customUrl?: string): Promise<string> {
  if (customUrl) {
    return await fetchFileWithCandidates([customUrl]);
  }
  try {
    return await fetchFinalizadosCsv();
  } catch {
    return await fetchFuturosCsv();
  }
}

export interface SyncGitHubOptions {
  target?: GitHubSyncTarget;
  customUrl?: string;
  customFuturosUrl?: string;
}

/**
 * Synchronizes the application database with GitHub.
 * By default, loads both `jogos_finalizados.csv` and `jogos_futuros.csv` seamlessly in sequence.
 */
export async function syncDatabaseWithGitHub(
  currentDb: DbState,
  replaceEntireDb: boolean = true,
  options?: GitHubSyncTarget | string | SyncGitHubOptions
): Promise<{
  updatedDb: DbState;
  result: ClientSyncResult;
  csvText: string;
  details?: {
    finalizadosCount: number;
    futurosCount: number;
  };
}> {
  // Normalize parameters
  let target: GitHubSyncTarget = 'both';
  let customUrl: string | undefined = undefined;
  let customFuturosUrl: string | undefined = undefined;

  if (typeof options === 'string') {
    if (options === 'both' || options === 'finalizados' || options === 'futuros') {
      target = options;
    } else {
      // It's a custom URL
      customUrl = options;
      target = 'finalizados';
    }
  } else if (options && typeof options === 'object') {
    if (options.target) target = options.target;
    if (options.customUrl) customUrl = options.customUrl;
    if (options.customFuturosUrl) customFuturosUrl = options.customFuturosUrl;
  }

  // 1. Target: Apenas Jogos Finalizados
  if (target === 'finalizados') {
    const csvText = await fetchFinalizadosCsv(customUrl);
    const { updatedDb, result } = parseAndSyncCsvLocally(csvText, currentDb, { replaceEntireDb });
    return { updatedDb, result, csvText };
  }

  // 2. Target: Apenas Jogos Futuros
  if (target === 'futuros') {
    const csvText = await fetchFuturosCsv(customFuturosUrl || customUrl);
    // When syncing only future games, we merge them on top of existing database (replacing any outdated AGENDADO matches)
    const { updatedDb, result } = parseAndSyncCsvLocally(csvText, currentDb, { replaceEntireDb: false });
    return { updatedDb, result, csvText };
  }

  // 3. Target: Ambos (Finalizados + Futuros) - Padrão e Recomendado
  let finalizadosText = '';
  let futurosText = '';
  let finalizadosError: Error | null = null;
  let futurosError: Error | null = null;

  // Fetch both in parallel
  const [finRes, futRes] = await Promise.allSettled([
    fetchFinalizadosCsv(customUrl),
    fetchFuturosCsv(customFuturosUrl),
  ]);

  if (finRes.status === 'fulfilled') {
    finalizadosText = finRes.value;
  } else {
    finalizadosError = finRes.reason;
  }

  if (futRes.status === 'fulfilled') {
    futurosText = futRes.value;
  } else {
    futurosError = futRes.reason;
  }

  // If neither could be fetched, report clear error
  if (!finalizadosText && !futurosText) {
    throw new Error(
      `Não foi possível baixar os arquivos CSV do GitHub. Erro em finalizados: ${
        finalizadosError?.message || 'não encontrado'
      }. Erro em futuros: ${futurosError?.message || 'não encontrado'}.`
    );
  }

  let runningDb = replaceEntireDb
    ? { countries: [], leagues: [], teams: [], matches: [], users: currentDb.users || [] }
    : currentDb;

  let totalFinMatches = 0;
  let totalFutMatches = 0;

  // Step 1: Process Finalizados first (establishes historical stats, teams, and leagues)
  if (finalizadosText) {
    const { updatedDb, result } = parseAndSyncCsvLocally(finalizadosText, runningDb, {
      replaceEntireDb: false,
    });
    runningDb = updatedDb;
    totalFinMatches = result.finishedMatchesCount || 0;
  }

  // Step 2: Merge Futuros on top (adds scheduled matches and upcoming odds)
  if (futurosText) {
    const { updatedDb, result } = parseAndSyncCsvLocally(futurosText, runningDb, {
      replaceEntireDb: false,
    });
    runningDb = updatedDb;
    totalFutMatches = result.futureMatchesCount || 0;
  }

  const finishedMatchesCount = runningDb.matches.filter((m) => m.status === 'FINALIZADO').length;
  const futureMatchesCount = runningDb.matches.filter((m) => m.status === 'AGENDADO').length;

  const combinedResult: ClientSyncResult = {
    success: runningDb.matches.length > 0,
    message: `Base sincronizada com sucesso do GitHub: ${runningDb.countries.length} países, ${runningDb.leagues.length} ligas, ${runningDb.teams.length} times e ${runningDb.matches.length} jogos (${finishedMatchesCount} finalizados + ${futureMatchesCount} futuros/agendados)!`,
    totalCountries: runningDb.countries.length,
    totalLeagues: runningDb.leagues.length,
    totalTeams: runningDb.teams.length,
    totalMatches: runningDb.matches.length,
    finishedMatchesCount,
    futureMatchesCount,
    newCountriesCount: runningDb.countries.length,
    newLeaguesCount: runningDb.leagues.length,
    newTeamsCount: runningDb.teams.length,
    newMatchesCount: runningDb.matches.length,
  };

  const previewCsv = finalizadosText || futurosText;

  return {
    updatedDb: runningDb,
    result: combinedResult,
    csvText: previewCsv,
    details: {
      finalizadosCount: finishedMatchesCount,
      futurosCount: futureMatchesCount,
    },
  };
}

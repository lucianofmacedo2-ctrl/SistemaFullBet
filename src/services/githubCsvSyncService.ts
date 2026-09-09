import { DbState } from '../types';
import { parseAndSyncCsvLocally, ClientSyncResult } from '../utils/csvSyncParser';
import { extractAndSaveAllLogos, reapplyLogosToDatabase } from '../utils/logoRegistry';

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

  extractAndSaveAllLogos(currentDb);

  let runningDb = replaceEntireDb
    ? {
        countries: currentDb.countries || [],
        leagues: currentDb.leagues || [],
        teams: currentDb.teams || [],
        matches: [],
        users: currentDb.users || [],
        referees: currentDb.referees || [],
      }
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

  const finalDbWithLogos = reapplyLogosToDatabase(runningDb);
  extractAndSaveAllLogos(finalDbWithLogos);

  const finishedMatchesCount = finalDbWithLogos.matches.filter((m) => m.status === 'FINALIZADO').length;
  const futureMatchesCount = finalDbWithLogos.matches.filter((m) => m.status === 'AGENDADO').length;

  const combinedResult: ClientSyncResult = {
    success: finalDbWithLogos.matches.length > 0,
    message: `Base sincronizada com sucesso do GitHub: ${finalDbWithLogos.countries.length} países, ${finalDbWithLogos.leagues.length} ligas, ${finalDbWithLogos.teams.length} times e ${finalDbWithLogos.matches.length} jogos (${finishedMatchesCount} finalizados + ${futureMatchesCount} futuros/agendados)!`,
    totalCountries: finalDbWithLogos.countries.length,
    totalLeagues: finalDbWithLogos.leagues.length,
    totalTeams: finalDbWithLogos.teams.length,
    totalMatches: finalDbWithLogos.matches.length,
    finishedMatchesCount,
    futureMatchesCount,
    newCountriesCount: finalDbWithLogos.countries.length,
    newLeaguesCount: finalDbWithLogos.leagues.length,
    newTeamsCount: finalDbWithLogos.teams.length,
    newMatchesCount: finalDbWithLogos.matches.length,
  };

  const previewCsv = finalizadosText || futurosText;

  return {
    updatedDb: finalDbWithLogos,
    result: combinedResult,
    csvText: previewCsv,
    details: {
      finalizadosCount: finishedMatchesCount,
      futurosCount: futureMatchesCount,
    },
  };
}

export const GITHUB_LAST_SYNC_KEY = 'football_github_last_sync_timestamp';

export function getLastGitHubSyncTime(): number {
  try {
    const raw = localStorage.getItem(GITHUB_LAST_SYNC_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function setLastGitHubSyncTime(time: number = Date.now()): void {
  try {
    localStorage.setItem(GITHUB_LAST_SYNC_KEY, String(time));
  } catch {
    // ignore
  }
}

/**
 * Automatically synchronizes the database with GitHub if needed or periodically.
 * Pulls both finished and future matches, merges cleanly and persists to local storage.
 */
export async function autoSyncDatabaseWithGitHub(
  currentDb: DbState,
  force: boolean = false
): Promise<{
  updatedDb: DbState;
  hasUpdates: boolean;
  result?: ClientSyncResult;
  error?: string;
}> {
  const lastSync = getLastGitHubSyncTime();
  const now = Date.now();
  const MIN_SYNC_INTERVAL = 3 * 60 * 1000; // 3 minutes

  // Skip if synced very recently and currentDb already has games, unless forced
  if (!force && now - lastSync < MIN_SYNC_INTERVAL && (currentDb.matches?.length || 0) > 100) {
    return { updatedDb: currentDb, hasUpdates: false };
  }

  // Ensure current logos are securely backed up in persistent store
  extractAndSaveAllLogos(currentDb);

  try {
    // Try syncing via backend server API first if available (faster & pre-cached)
    try {
      const serverResp = await fetch('/api/sync/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (serverResp.ok) {
        const json = await serverResp.json();
        if (json.success && json.db && Array.isArray(json.db.matches) && json.db.matches.length > 0) {
          setLastGitHubSyncTime(now);
          const finalDb = reapplyLogosToDatabase(json.db);
          extractAndSaveAllLogos(finalDb);

          return {
            updatedDb: finalDb,
            hasUpdates: finalDb.matches.length !== currentDb.matches.length,
            result: {
              success: true,
              message: json.stats?.message || 'Sincronizado automaticamente com o GitHub.',
              totalCountries: finalDb.countries?.length || 0,
              totalLeagues: finalDb.leagues?.length || 0,
              totalTeams: finalDb.teams?.length || 0,
              totalMatches: finalDb.matches?.length || 0,
              finishedMatchesCount: json.stats?.finishedMatches,
              futureMatchesCount: json.stats?.futureMatches,
              newCountriesCount: 0,
              newLeaguesCount: 0,
              newTeamsCount: 0,
              newMatchesCount: 0,
            },
          };
        }
      }
    } catch {
      // Fall through to direct client-side GitHub fetch
    }

    // Direct client fetch from GitHub raw URLs
    const syncRes = await syncDatabaseWithGitHub(currentDb, false, { target: 'both' });
    setLastGitHubSyncTime(now);

    const hasUpdates =
      syncRes.updatedDb.matches.length !== currentDb.matches.length ||
      syncRes.updatedDb.teams.length !== currentDb.teams.length;

    return {
      updatedDb: syncRes.updatedDb,
      hasUpdates: true,
      result: syncRes.result,
    };
  } catch (err: any) {
    console.warn('[GitHub Auto-Sync Client Warning]:', err?.message);
    return {
      updatedDb: currentDb,
      hasUpdates: false,
      error: err?.message || 'Falha na sincronização com o GitHub',
    };
  }
}


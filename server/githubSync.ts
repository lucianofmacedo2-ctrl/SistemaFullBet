import fs from 'fs';
import path from 'path';
import { parseAndSyncCsvLocally } from '../src/utils/csvSyncParser';
import { ensureCanonicalCountriesAndLeagues } from '../src/utils/countryLeagueHelper';
import { DbState } from '../src/types';

export const GITHUB_REPO_FINALIZADOS_DATA_URL =
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/data/jogos_finalizados.csv';
export const GITHUB_REPO_FUTUROS_DATA_URL =
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/data/jogos_futuros.csv';

const FINALIZADOS_CANDIDATES = [
  GITHUB_REPO_FINALIZADOS_DATA_URL,
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/data/jogos_finalizados.csv',
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/dados/jogos_finalizados.csv',
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/dados/jogos_finalizados.csv',
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/jogos_finalizados.csv',
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/jogos_finalizados.csv',
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/data/jogos_consolidados.csv',
];

const FUTUROS_CANDIDATES = [
  GITHUB_REPO_FUTUROS_DATA_URL,
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/data/jogos_futuros.csv',
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/dados/jogos_futuros.csv',
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/dados/jogos_futuros.csv',
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/jogos_futuros.csv',
  'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/jogos_futuros.csv',
];

async function fetchCsvWithCandidates(urls: string[]): Promise<string> {
  let lastErr: any = null;
  for (const url of urls) {
    try {
      const resp = await fetch(`${url}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Accept': 'text/plain, text/csv, application/octet-stream' },
      });
      if (resp.ok) {
        const txt = await resp.text();
        if (txt && txt.trim().length > 20) {
          return txt;
        }
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`Falha ao obter CSV do GitHub: ${lastErr?.message || 'Arquivo indisponível'}`);
}

export interface ServerSyncStats {
  lastSyncTime: string | null;
  success: boolean;
  totalMatches: number;
  finishedMatches: number;
  futureMatches: number;
  countriesCount: number;
  leaguesCount: number;
  teamsCount: number;
  message: string;
}

let lastServerSyncStats: ServerSyncStats = {
  lastSyncTime: null,
  success: false,
  totalMatches: 0,
  finishedMatches: 0,
  futureMatches: 0,
  countriesCount: 0,
  leaguesCount: 0,
  teamsCount: 0,
  message: 'Nenhuma sincronização executada ainda.',
};

export function getServerSyncStats(): ServerSyncStats {
  return lastServerSyncStats;
}

/**
 * Syncs the server database directly with GitHub CSVs (both finalizados and futuros).
 * Automatically heals canonical countries and leagues and saves to disk.
 */
export async function runServerGitHubSync(currentDb: DbState): Promise<{ updatedDb: DbState; stats: ServerSyncStats }> {
  console.log('[GitHub Auto-Sync] Iniciando sincronização automática com o GitHub...');

  let finalizadosText = '';
  let futurosText = '';

  const [finRes, futRes] = await Promise.allSettled([
    fetchCsvWithCandidates(FINALIZADOS_CANDIDATES),
    fetchCsvWithCandidates(FUTUROS_CANDIDATES),
  ]);

  if (finRes.status === 'fulfilled') {
    finalizadosText = finRes.value;
  } else {
    console.warn('[GitHub Auto-Sync] Aviso ao buscar finalizados:', finRes.reason?.message);
  }

  if (futRes.status === 'fulfilled') {
    futurosText = futRes.value;
  } else {
    console.warn('[GitHub Auto-Sync] Aviso ao buscar futuros:', futRes.reason?.message);
  }

  if (!finalizadosText && !futurosText) {
    throw new Error('Não foi possível baixar nenhum dos arquivos CSV (finalizados ou futuros) do GitHub.');
  }

  let runningDb: DbState = {
    countries: [],
    leagues: [],
    teams: [],
    matches: [],
    users: currentDb.users || [],
  };

  // 1. Process finalized games first
  if (finalizadosText) {
    const { updatedDb } = parseAndSyncCsvLocally(finalizadosText, runningDb, { replaceEntireDb: false });
    runningDb = updatedDb;
  }

  // 2. Merge future games on top
  if (futurosText) {
    const { updatedDb } = parseAndSyncCsvLocally(futurosText, runningDb, { replaceEntireDb: false });
    runningDb = updatedDb;
  }

  const canonicalDb = ensureCanonicalCountriesAndLeagues(runningDb);
  canonicalDb.users = currentDb.users || [];

  const finishedCount = canonicalDb.matches.filter(m => m.status === 'FINALIZADO').length;
  const futureCount = canonicalDb.matches.filter(m => m.status === 'AGENDADO').length;

  const stats: ServerSyncStats = {
    lastSyncTime: new Date().toISOString(),
    success: canonicalDb.matches.length > 0,
    totalMatches: canonicalDb.matches.length,
    finishedMatches: finishedCount,
    futureMatches: futureCount,
    countriesCount: canonicalDb.countries.length,
    leaguesCount: canonicalDb.leagues.length,
    teamsCount: canonicalDb.teams.length,
    message: `Sincronização automática do GitHub concluída com sucesso: ${canonicalDb.matches.length} jogos (${finishedCount} finalizados + ${futureCount} futuros), ${canonicalDb.countries.length} países e ${canonicalDb.teams.length} clubes!`,
  };

  lastServerSyncStats = stats;

  // Persist to disk files
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const jsonStr = JSON.stringify(canonicalDb, null, 2);
    fs.writeFileSync(path.join(dataDir, 'football_db.json'), jsonStr, 'utf8');

    const publicDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'football_db.json'), jsonStr, 'utf8');

    console.log(`[GitHub Auto-Sync] ${stats.message}`);
  } catch (err: any) {
    console.warn('[GitHub Auto-Sync] Erro ao gravar arquivos no disco:', err?.message);
  }

  return { updatedDb: canonicalDb, stats };
}

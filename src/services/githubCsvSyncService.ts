import { DbState } from '../types';
import { parseAndSyncCsvLocally } from '../utils/csvSyncParser';

export const GITHUB_REPO_DATA_URL = 'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/data/jogos_consolidados.csv';
export const GITHUB_REPO_URL = 'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/jogos_consolidados.csv';
export const GITHUB_REPO_DADOS_URL = 'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/main/dados/jogos_consolidados.csv';

export async function fetchCsvFromGitHub(customUrl?: string): Promise<string> {
  const candidateUrls = customUrl
    ? [customUrl]
    : [
        GITHUB_REPO_DATA_URL,
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/data/jogos_consolidados.csv',
        GITHUB_REPO_DADOS_URL,
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/dados/jogos_consolidados.csv',
        GITHUB_REPO_URL,
        'https://raw.githubusercontent.com/lucianofmacedo2-ctrl/SistemaFullBet/master/jogos_consolidados.csv',
      ];

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
    `Não foi possível baixar o arquivo CSV do GitHub (${lastError?.message || 'Arquivo não encontrado'}). Verifique o repositório público e a rota 'data/jogos_consolidados.csv'.`
  );
}

export async function syncDatabaseWithGitHub(
  currentDb: DbState,
  replaceEntireDb: boolean = true,
  customUrl?: string
): Promise<{
  updatedDb: DbState;
  result: any;
  csvText: string;
}> {
  const csvText = await fetchCsvFromGitHub(customUrl);
  const { updatedDb, result } = parseAndSyncCsvLocally(csvText, currentDb, { replaceEntireDb });
  return { updatedDb, result, csvText };
}

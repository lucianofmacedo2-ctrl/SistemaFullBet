import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  FileText,
  RefreshCw,
  Sparkles,
  Github,
  Globe,
  ExternalLink,
  Info,
  Trash2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DbState } from '../types';
import { parseAndSyncCsvLocally } from '../utils/csvSyncParser';
import { saveDatabaseState, syncDatabaseFromServer } from '../services/dbService';
import {
  syncDatabaseWithGitHub,
  GITHUB_REPO_FINALIZADOS_DATA_URL,
  GITHUB_REPO_FUTUROS_DATA_URL,
  GITHUB_REPO_BASE_URL,
  GitHubSyncTarget,
} from '../services/githubCsvSyncService';

interface CsvImportSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onImportSuccess: (newState: DbState, message: string) => void;
}

export const CsvImportSyncModal: React.FC<CsvImportSyncModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'upload' | 'paste' | 'server'>('github');
  const [syncMode, setSyncMode] = useState<'replace' | 'merge'>('replace');
  
  // Custom URLs state
  const [showAdvancedUrls, setShowAdvancedUrls] = useState<boolean>(false);
  const [customFinalizadosUrl, setCustomFinalizadosUrl] = useState<string>(GITHUB_REPO_FINALIZADOS_DATA_URL);
  const [customFuturosUrl, setCustomFuturosUrl] = useState<string>(GITHUB_REPO_FUTUROS_DATA_URL);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [csvContent, setCsvContent] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingTarget, setLoadingTarget] = useState<string>('');

  const [previewStats, setPreviewStats] = useState<{
    totalLines: number;
    headers: string[];
    sampleRows: string[][];
  } | null>(null);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    stats?: any;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesChange = (filesList: FileList | File[]) => {
    const files = Array.from(filesList).filter(
      (f) => f.name.toLowerCase().endsWith('.csv') || f.type.includes('csv') || f.type.includes('text')
    );

    if (files.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor, selecione arquivos válidos no formato .csv (ex: jogos_finalizados.csv e/ou jogos_futuros.csv).',
      });
      return;
    }

    setSelectedFiles(files);
    setStatusMessage(null);

    // Read files
    if (files.length === 1) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvContent(text);
        generatePreview(text);
      };
      reader.readAsText(files[0], 'UTF-8');
    } else {
      // Multiple files preview
      setPreviewStats(null);
    }
  };

  const handlePasteChange = (text: string) => {
    setCsvContent(text);
    setStatusMessage(null);
    if (text.trim()) {
      generatePreview(text);
    } else {
      setPreviewStats(null);
    }
  };

  const generatePreview = (rawText: string) => {
    try {
      const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        setPreviewStats(null);
        return;
      }
      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(separator).map((h) => h.replace(/^["']|["']$/g, '').trim());
      const sampleRows = lines.slice(1, 6).map((line) =>
        line.split(separator).map((cell) => cell.replace(/^["']|["']$/g, '').trim())
      );
      setPreviewStats({
        totalLines: lines.length - 1,
        headers,
        sampleRows,
      });
    } catch {
      setPreviewStats(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesChange(e.dataTransfer.files);
    }
  };

  const handleSyncWithGitHub = async (
    target: GitHubSyncTarget = 'both',
    forceClean: boolean = false
  ) => {
    setIsLoading(true);
    setLoadingTarget(target);
    setStatusMessage(null);

    try {
      const isReplace = forceClean || (target === 'both' && syncMode === 'replace') || (target === 'finalizados' && syncMode === 'replace');
      const baseState = forceClean
        ? { countries: [], leagues: [], teams: [], matches: [], users: dbState.users || [] }
        : dbState;

      const { updatedDb, result, csvText } = await syncDatabaseWithGitHub(baseState, isReplace, {
        target,
        customUrl: customFinalizadosUrl.trim() || undefined,
        customFuturosUrl: customFuturosUrl.trim() || undefined,
      });

      if (!result.success) {
        throw new Error('Nenhum jogo válido foi encontrado nos arquivos CSV do GitHub.');
      }

      if (csvText) {
        setCsvContent(csvText);
        generatePreview(csvText);
      }

      await saveDatabaseState(updatedDb, true);

      setStatusMessage({
        type: 'success',
        text: `Sincronização com GitHub concluída com sucesso! ${result.message}`,
        stats: result,
      });

      onImportSuccess(
        updatedDb,
        `Dados atualizados do GitHub: ${result.totalMatches} jogos cadastrados (${result.finishedMatchesCount || 0} finalizados, ${result.futureMatchesCount || 0} futuros).`
      );
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Erro na sincronização com GitHub: ${err.message || String(err)}`,
      });
    } finally {
      setIsLoading(false);
      setLoadingTarget('');
    }
  };

  const handleProcessImportLocalFiles = async () => {
    if (selectedFiles.length === 0 && !csvContent.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Nenhum arquivo ou texto CSV foi fornecido.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      let currentWorkingDb = syncMode === 'replace'
        ? { countries: [], leagues: [], teams: [], matches: [], users: dbState.users || [] }
        : dbState;

      if (selectedFiles.length > 0) {
        // Read and process each selected file
        for (const file of selectedFiles) {
          const text = await file.text();
          if (text.trim()) {
            const { updatedDb } = parseAndSyncCsvLocally(text, currentWorkingDb, { replaceEntireDb: false });
            currentWorkingDb = updatedDb;
          }
        }
      } else if (csvContent.trim()) {
        const { updatedDb } = parseAndSyncCsvLocally(csvContent, currentWorkingDb, { replaceEntireDb: false });
        currentWorkingDb = updatedDb;
      }

      await saveDatabaseState(currentWorkingDb, true);

      const finCount = currentWorkingDb.matches.filter((m) => m.status === 'FINALIZADO').length;
      const futCount = currentWorkingDb.matches.filter((m) => m.status === 'AGENDADO').length;

      const successStats = {
        totalCountries: currentWorkingDb.countries.length,
        totalLeagues: currentWorkingDb.leagues.length,
        totalTeams: currentWorkingDb.teams.length,
        totalMatches: currentWorkingDb.matches.length,
        finishedMatchesCount: finCount,
        futureMatchesCount: futCount,
      };

      setStatusMessage({
        type: 'success',
        text: `Importação concluída com sucesso! Total de ${currentWorkingDb.matches.length} jogos carregados (${finCount} finalizados + ${futCount} futuros).`,
        stats: successStats,
      });

      onImportSuccess(
        currentWorkingDb,
        `Importação local concluída: ${currentWorkingDb.matches.length} jogos carregados na base!`
      );
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Falha na importação: ${err.message || String(err)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadServerFile = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const freshDb = await syncDatabaseFromServer();

      onImportSuccess(
        freshDb,
        `Banco carregado com sucesso: ${freshDb.teams.length} times, ${freshDb.leagues.length} ligas, ${freshDb.countries.length} países e ${freshDb.matches.length} jogos.`
      );

      setStatusMessage({
        type: 'success',
        text: `Dados do servidor carregados com sucesso! Total: ${freshDb.teams.length} times e ${freshDb.matches.length} partidas.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Erro ao carregar do servidor: ${err.message || String(err)}.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Sincronizar Base de Jogos (.csv)
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                  Dual CSV (Finalizados + Futuros)
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Sincronização automática com GitHub e suporte a arquivos separados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'github'
                ? 'bg-white text-emerald-700 border-slate-200 border-b-transparent shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Github className="w-4 h-4 text-emerald-600" />
            Puxar do GitHub (Recomendado)
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-white text-blue-700 border-slate-200 border-b-transparent shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            Arquivos .CSV Locais
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'paste'
                ? 'bg-white text-blue-700 border-slate-200 border-b-transparent shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            Colar Texto CSV
          </button>
          <button
            onClick={() => setActiveTab('server')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'server'
                ? 'bg-white text-blue-700 border-slate-200 border-b-transparent shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-slate-600" />
            Servidor
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Mode Selector */}
          {activeTab !== 'server' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Modo de Sincronização:</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {syncMode === 'replace' ? 'Substituição Completa' : 'Mesclagem'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSyncMode('replace')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    syncMode === 'replace'
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Substituir Base (Recomendado)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    Limpa dados antigos e sincroniza exatamente com os CSVs do GitHub.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncMode('merge')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    syncMode === 'merge'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-950 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5 text-blue-900">
                    <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    Mesclar / Incrementar
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    Mantém os times e jogos já salvos e acrescenta/atualiza novos.
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Tab 0: GitHub Dual CSV Sync */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <Github className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        lucianofmacedo2-ctrl / SistemaFullBet
                      </h4>
                      <p className="text-xs text-slate-300">
                        Repositório oficial configurado com estrutura de dois arquivos CSV
                      </p>
                    </div>
                  </div>
                  <a
                    href={GITHUB_REPO_BASE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 transition-colors"
                  >
                    Abrir Repo <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Detected GitHub CSV Files */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 bg-slate-950/70 border border-slate-700/80 rounded-xl flex items-start gap-2.5">
                    <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-200">Jogos Finalizados</div>
                      <div className="text-[11px] font-mono text-emerald-400 truncate">data/jogos_finalizados.csv</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Histórico, placares e estatísticas detalhadas</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/70 border border-slate-700/80 rounded-xl flex items-start gap-2.5">
                    <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-200">Jogos Futuros</div>
                      <div className="text-[11px] font-mono text-purple-400 truncate">data/jogos_futuros.csv</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Grade de jogos agendados e odds</div>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button: Sincronizar Tudo */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => handleSyncWithGitHub('both', false)}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading && loadingTarget === 'both' ? 'animate-spin' : ''}`} />
                    {isLoading && loadingTarget === 'both'
                      ? 'Baixando e Sincronizando Ambos os Arquivos...'
                      : 'Sincronizar Tudo (Finalizados + Futuros)'}
                  </button>

                  {/* Secondary Granular Sync Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSyncWithGitHub('finalizados', false)}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 disabled:opacity-50 text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      {isLoading && loadingTarget === 'finalizados' ? 'Baixando...' : 'Apenas Jogos Finalizados'}
                    </button>

                    <button
                      onClick={() => handleSyncWithGitHub('futuros', false)}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 disabled:opacity-50 text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      {isLoading && loadingTarget === 'futuros' ? 'Baixando...' : 'Apenas Jogos Futuros (Grade)'}
                    </button>
                  </div>

                  <button
                    onClick={() => handleSyncWithGitHub('both', true)}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 disabled:opacity-50 text-rose-200 font-semibold text-xs rounded-xl transition-all cursor-pointer mt-1"
                    title="Apaga os dados pré-carregados e substitui exclusivamente pelos CSVs do GitHub"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    Zerar Antigos e Recarregar Tudo do GitHub
                  </button>
                </div>

                {/* Advanced Custom URLs toggle */}
                <div className="pt-2 border-t border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedUrls(!showAdvancedUrls)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {showAdvancedUrls ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showAdvancedUrls ? 'Ocultar links diretos personalizados' : 'Editar URLs personalizadas do GitHub (Avançado)'}
                  </button>

                  {showAdvancedUrls && (
                    <div className="mt-3 space-y-3 p-3 bg-slate-950/80 rounded-xl border border-slate-700 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          URL do CSV de Jogos Finalizados:
                        </label>
                        <input
                          type="text"
                          value={customFinalizadosUrl}
                          onChange={(e) => setCustomFinalizadosUrl(e.target.value)}
                          className="w-full font-mono text-[11px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          URL do CSV de Jogos Futuros:
                        </label>
                        <input
                          type="text"
                          value={customFuturosUrl}
                          onChange={(e) => setCustomFuturosUrl(e.target.value)}
                          className="w-full font-mono text-[11px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Rotina de Atualização:</strong> O sistema lê automaticamente os dois arquivos do seu repositório: <code>data/jogos_finalizados.csv</code> e <code>data/jogos_futuros.csv</code>, cadastrando os times, ligas e jogos de forma unificada e organizada.
                </span>
              </div>
            </div>
          )}

          {/* Tab 1: Upload de Arquivos Locais */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesChange(e.target.files);
                  }
                }}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-blue-600 bg-blue-50/80 scale-[1.01]'
                    : selectedFiles.length > 0
                    ? 'border-emerald-500 bg-emerald-50/40'
                    : 'border-slate-300 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-400'
                }`}
              >
                <div
                  className={`p-4 rounded-2xl mb-3 ${
                    selectedFiles.length > 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {selectedFiles.length > 0 ? (
                    <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-blue-600" />
                  )}
                </div>

                {selectedFiles.length > 0 ? (
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900 block">
                      {selectedFiles.length} arquivo(s) selecionado(s):
                    </span>
                    <div className="flex flex-wrap gap-1.5 justify-center max-w-md">
                      {selectedFiles.map((f, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-white border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-md font-mono"
                        >
                          {f.name} ({(f.size / 1024).toFixed(1)} KB)
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 block pt-1">
                      Clique para trocar ou adicionar mais arquivos
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-bold text-slate-800 block mb-1">
                      Arraste e solte <code className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">jogos_finalizados.csv</code> e/ou <code className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">jogos_futuros.csv</code> aqui
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Você pode selecionar os dois arquivos de uma só vez do seu computador
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Colar Texto CSV */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Cole as linhas do arquivo CSV (com cabeçalhos):
              </label>
              <textarea
                value={csvContent}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={`Pais,Liga,Data,Hora,Mandante,Visitante,Placar_Mandante_FT,Placar_Visitante_FT,Odd_Home_FT,Odd_Draw_FT,Odd_Away_FT\nInglaterra,Premier League,2026-08-20,16:00,Arsenal,Chelsea,2,1,1.85,3.60,4.20...`}
                rows={7}
                className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-3.5 rounded-2xl border border-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Tab 3: Carregar do Servidor */}
          {activeTab === 'server' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl text-blue-700 mt-0.5">
                  <Database className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Sincronizar com a Base Salva (<code className="text-blue-700">football_db.json</code>)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Recarrega os dados já salvos no cache do servidor web.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleLoadServerFile}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Puxando do Servidor...' : 'Carregar Dados do Servidor Agora'}
                </button>
              </div>
            </div>
          )}

          {/* CSV Preview Section */}
          {previewStats && activeTab !== 'server' && (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Prévia dos Dados ({previewStats.totalLines} partidas identificadas)
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {previewStats.headers.length} colunas detectadas
                </span>
              </div>

              {/* Sample Rows Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white max-h-36 scrollbar-thin">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      {previewStats.headers.slice(0, 8).map((h, idx) => (
                        <th key={idx} className="p-2 font-bold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                      {previewStats.headers.length > 8 && (
                        <th className="p-2 font-bold text-slate-400">+{previewStats.headers.length - 8} mais</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewStats.sampleRows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50 font-mono">
                        {row.slice(0, 8).map((cell, cIdx) => (
                          <td key={cIdx} className="p-2 whitespace-nowrap text-slate-700">
                            {cell || '-'}
                          </td>
                        ))}
                        {row.length > 8 && <td className="p-2 text-slate-400">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Feedback Status */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-2 flex-1">
                <span className="block">{statusMessage.text}</span>
                {statusMessage.stats && (
                  <div className="grid grid-cols-4 gap-2 pt-1 text-center text-[11px]">
                    <div className="bg-white/90 p-2 rounded-xl border border-emerald-300 shadow-xs">
                      <span className="font-bold block text-sm text-emerald-900">
                        {statusMessage.stats.totalCountries ?? statusMessage.stats.newCountriesCount ?? 0}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700">Países</span>
                    </div>
                    <div className="bg-white/90 p-2 rounded-xl border border-emerald-300 shadow-xs">
                      <span className="font-bold block text-sm text-emerald-900">
                        {statusMessage.stats.totalLeagues ?? statusMessage.stats.newLeaguesCount ?? 0}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700">Ligas</span>
                    </div>
                    <div className="bg-white/90 p-2 rounded-xl border border-emerald-300 shadow-xs">
                      <span className="font-bold block text-sm text-emerald-900">
                        {statusMessage.stats.totalTeams ?? statusMessage.stats.newTeamsCount ?? 0}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700">Times</span>
                    </div>
                    <div className="bg-white/90 p-2 rounded-xl border border-emerald-300 shadow-xs">
                      <span className="font-bold block text-sm text-emerald-900">
                        {statusMessage.stats.totalMatches ?? statusMessage.stats.newMatchesCount ?? 0}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700">
                        Jogos Totais
                      </span>
                      {(statusMessage.stats.finishedMatchesCount !== undefined ||
                        statusMessage.stats.futureMatchesCount !== undefined) && (
                        <span className="block text-[9px] text-slate-500 mt-0.5">
                          {statusMessage.stats.finishedMatchesCount || 0} finalizados / {statusMessage.stats.futureMatchesCount || 0} futuros
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>

          {activeTab !== 'server' && activeTab !== 'github' && (
            <button
              onClick={handleProcessImportLocalFiles}
              disabled={isLoading || (selectedFiles.length === 0 && !csvContent.trim())}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Processando e Cadastrando...' : 'Importar & Cadastrar Automaticamente'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

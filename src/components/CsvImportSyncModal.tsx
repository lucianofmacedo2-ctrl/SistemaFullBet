import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  ArrowRight,
  Shield,
  Trophy,
  Globe,
  ListOrdered,
  FileText,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { DbState } from '../types';
import { parseAndSyncCsvLocally } from '../utils/csvSyncParser';
import { saveDatabaseState } from '../services/dbService';

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
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'server'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  const handleFileChange = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor, selecione um arquivo de formato .csv válido.',
      });
      return;
    }

    setSelectedFile(file);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      generatePreview(text);
    };
    reader.readAsText(file, 'UTF-8');
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
      const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
      const sampleRows = lines.slice(1, 6).map((line) =>
        line.split(',').map((cell) => cell.replace(/^["']|["']$/g, '').trim())
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
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleProcessImport = async () => {
    if (!csvContent.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Nenhum conteúdo CSV foi fornecido. Selecione um arquivo ou cole o texto do CSV.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      // 1. Process local CSV parsing and auto-creation of countries, leagues, teams, matches
      const { updatedDb, result } = parseAndSyncCsvLocally(csvContent, dbState);

      if (!result.success) {
        throw new Error('Nenhuma linha de jogo válida foi encontrada no arquivo CSV.');
      }

      // 2. Persist to server and local storage
      await saveDatabaseState(updatedDb);

      setStatusMessage({
        type: 'success',
        text: result.message,
        stats: result,
      });

      onImportSuccess(updatedDb, result.message);
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
      const response = await fetch('/api/db', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const freshDb = await response.json();

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
        text: `Erro ao carregar do servidor: ${err.message || String(err)}`,
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
                Subir jogos_consolidados.csv
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                  Auto-Cadastro
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Cadastra automaticamente países, ligas e times que ainda não existirem no sistema
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
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-blue-700 border-slate-200 border-b-transparent shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            Arquivo .CSV (Upload / Arrastar)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === 'server'
                ? 'bg-white text-blue-700 border-slate-200 border-b-transparent shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            Arquivo Salvo no Servidor
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Tab 1: Upload de Arquivo */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
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
                    : selectedFile
                    ? 'border-emerald-500 bg-emerald-50/40'
                    : 'border-slate-300 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-400'
                }`}
              >
                <div
                  className={`p-4 rounded-2xl mb-3 ${
                    selectedFile
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {selectedFile ? (
                    <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-blue-600" />
                  )}
                </div>

                {selectedFile ? (
                  <div>
                    <span className="text-sm font-bold text-slate-900 block mb-1">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Clique para trocar de arquivo
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-bold text-slate-800 block mb-1">
                      Arraste e solte o arquivo <code className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">jogos_consolidados.csv</code> aqui
                    </span>
                    <span className="text-xs text-slate-500 block">
                      ou clique para selecionar do seu computador
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
                placeholder={`PAIS,LIGA,HomeTeam,AwayTeam,Date,FTHG,FTAG,HS,AS,HST,AST,HC,AC,B365H,B365D,B365A\nING,Premier League,Arsenal,Chelsea,2026-08-20,2,1,14,9,6,3,7,4,1.85,3.60,4.20...`}
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
                    Se o script automatizado do GitHub Actions ou de rotina já rodou e salvou os dados no servidor, você pode puxar todos os clubes, ligas e jogos consolidados diretamente para a sua tela com um clique.
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
                  Prévia do Arquivo ({previewStats.totalLines} partidas identificadas)
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
              <div className="space-y-1">
                <span>{statusMessage.text}</span>
                {statusMessage.stats && (
                  <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[11px]">
                    <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-300">
                      <span className="font-bold block text-emerald-800">
                        +{statusMessage.stats.newTeamsCount || 0}
                      </span>
                      <span className="text-[10px] text-emerald-600">Novos Times</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-300">
                      <span className="font-bold block text-emerald-800">
                        +{statusMessage.stats.newLeaguesCount || 0}
                      </span>
                      <span className="text-[10px] text-emerald-600">Novas Ligas</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-300">
                      <span className="font-bold block text-emerald-800">
                        +{statusMessage.stats.newCountriesCount || 0}
                      </span>
                      <span className="text-[10px] text-emerald-600">Novos Países</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-300">
                      <span className="font-bold block text-emerald-800">
                        {statusMessage.stats.totalMatches || 0}
                      </span>
                      <span className="text-[10px] text-emerald-600">Total Jogos</span>
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

          {activeTab !== 'server' && (
            <button
              onClick={handleProcessImport}
              disabled={isLoading || !csvContent.trim()}
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

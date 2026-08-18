import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Calendar,
  Sparkles,
  Save,
  Loader2,
  HelpCircle,
  Filter,
  CheckSquare,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { DbState, Match } from '../types';
import {
  ParsedMatchUpdateRow,
  parseMatchUpdateExcelOrCsvFile,
  downloadIncompleteMatchesTemplate,
  isMatchComplete
} from '../utils/excelHelper';
import { checkMatchFullCompleteness } from './MatchList';

interface BulkMatchUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onBulkUpdateMatches: (rows: ParsedMatchUpdateRow[]) => void;
}

export const BulkMatchUpdateModal: React.FC<BulkMatchUpdateModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onBulkUpdateMatches,
}) => {
  const [rows, setRows] = useState<ParsedMatchUpdateRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [downloadMode, setDownloadMode] = useState<'incomplete' | 'all'>('incomplete');

  if (!isOpen) return null;

  // Compute completeness stats from dbState
  const totalMatches = dbState.matches.length;
  const incompleteMatches = dbState.matches.filter(m => !isMatchComplete(m));
  const completeMatchesCount = totalMatches - incompleteMatches.length;

  const handleDownloadTemplate = () => {
    downloadIncompleteMatchesTemplate(dbState.matches, downloadMode === 'incomplete');
  };

  const handleFileProcess = async (file: File) => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const parsedRows = await parseMatchUpdateExcelOrCsvFile(file, dbState.matches);
      if (parsedRows.length === 0) {
        setErrorMsg('Nenhuma linha de jogo válida encontrada no arquivo selecionado. Verifique o modelo.');
      } else {
        setRows(parsedRows);
        const updatedCount = parsedRows.filter(r => !r.isNewMatch).length;
        const newCount = parsedRows.filter(r => r.isNewMatch).length;
        setSuccessMsg(
          `Arquivo processado com sucesso! ${parsedRows.length} jogo(s) encontrado(s) (${updatedCount} para atualizar, ${newCount} novos).`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar o arquivo Excel/CSV.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemoveRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const validRows = rows.filter(r => r.isValid);
  const validRowsCount = validRows.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (validRows.length === 0) {
      setErrorMsg('Nenhuma alteração ou jogo válido para atualizar. Verifique os dados da planilha.');
      return;
    }

    onBulkUpdateMatches(validRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Subir & Completar Dados de Jogos em Massa
                </h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded-full font-bold border border-blue-200">
                  Excel XLSX / CSV
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Baixe a planilha com os jogos incompletos já preenchidos, complete os dados faltantes e envie a planilha de volta.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Status summary banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Total no Banco</span>
                <span className="text-sm font-bold text-slate-900">{totalMatches} partida(s)</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-amber-700 font-medium block">Jogos Incompletos</span>
                <span className="text-sm font-bold text-amber-900">{incompleteMatches.length} partida(s)</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-emerald-700 font-medium block">100% Completos</span>
                <span className="text-sm font-bold text-emerald-900">{completeMatchesCount} partida(s)</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step 1: Download pre-filled Excel */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 shadow-sm">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">PASSO 1</span>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Baixar Planilha com os Dados Já Preenchidos
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    O arquivo virá com os jogos existentes e todas as informações já cadastradas (ID, times, data, etc.). Basta preencher as colunas vazias (placar, escanteios, posse, chutes, odds).
                  </p>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setDownloadMode('incomplete');
                    downloadIncompleteMatchesTemplate(dbState.matches, true);
                  }}
                  disabled={incompleteMatches.length === 0}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                    incompleteMatches.length > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 hover:shadow'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  }`}
                  title={incompleteMatches.length > 0 ? 'Baixar planilha com jogos incompletos' : 'Não há jogos incompletos'}
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar {incompleteMatches.length} Jogo(s) Incompleto(s)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDownloadMode('all');
                    downloadIncompleteMatchesTemplate(dbState.matches, false);
                  }}
                  disabled={totalMatches === 0}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    totalMatches > 0
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                  }`}
                  title="Baixar todas as partidas cadastradas no banco de dados"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  <span>Baixar Todos ({totalMatches})</span>
                </button>
              </div>
            </div>

            {/* Hint bar */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-800">Dica:</strong> Não altere a coluna <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-bold">ID_Jogo</code>, pois ela garante que o sistema atualize a partida correta sem criar duplicatas!
              </span>
            </div>
          </div>

          {/* Step 2: Upload modified Excel */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">PASSO 2</span>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Enviar a Planilha Preenchida para Atualizar
              </h4>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-blue-600 bg-blue-50 scale-[1.01]'
                  : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30'
              }`}
            >
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileInputChange}
                className="hidden"
                id="bulk-update-excel-file-input"
              />
              <label
                htmlFor="bulk-update-excel-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2.5"
              >
                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-full border border-blue-200 shadow-sm">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  ) : (
                    <Upload className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    Clique aqui para selecionar ou arraste sua planilha Excel preenchida
                  </span>
                  <span className="text-xs text-slate-500 block mt-1 font-medium">
                    Suporta arquivos .XLSX, .XLS e .CSV
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Step 3: Parsed Matches Preview & Confirmation */}
          {rows.length > 0 && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Jogos Reconhecidos na Planilha ({rows.length})
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-bold border border-emerald-200">
                    {validRowsCount} Válidos
                  </span>
                  {rows.length - validRowsCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-800 rounded-full font-bold border border-red-200">
                      {rows.length - validRowsCount} com Erro
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">
                  Revise as alterações antes de salvar no banco de dados
                </span>
              </div>

              <div className="overflow-x-auto max-h-72 rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-2.5">ID / #</th>
                      <th className="p-2.5">Partida</th>
                      <th className="p-2.5">Data / Liga</th>
                      <th className="p-2.5">Placar</th>
                      <th className="p-2.5">Dados Atualizados</th>
                      <th className="p-2.5 text-center">Tipo</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 transition-colors ${
                          !row.isValid ? 'bg-red-50/60' : ''
                        }`}
                      >
                        <td className="p-2.5 font-mono text-slate-500 font-bold">
                          {row.matchId || `#${row.rowIndex}`}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                          <span className="text-blue-700">{row.homeTeamName}</span> x{' '}
                          <span className="text-slate-800">{row.awayTeamName}</span>
                        </td>
                        <td className="p-2.5 text-slate-600 whitespace-nowrap text-[11px]">
                          <div>{row.matchDate || 'Sem data'}</div>
                          <div className="text-slate-400">{row.leagueName} ({row.countryName})</div>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          {row.homeScore !== null && row.awayScore !== null ? (
                            <div className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                              FT {row.homeScore} x {row.awayScore}
                              {row.halftimeHomeScore !== null && row.halftimeAwayScore !== null && (
                                <span className="text-[10px] text-slate-500 ml-1 font-normal">
                                  (HT {row.halftimeHomeScore}x{row.halftimeAwayScore})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Sem placar</span>
                          )}
                        </td>
                        <td className="p-2.5 text-[11px]">
                          {row.changedFields && row.changedFields.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {row.changedFields.slice(0, 3).map((f, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-[10px] font-medium"
                                >
                                  {f}
                                </span>
                              ))}
                              {row.changedFields.length > 3 && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                                  +{row.changedFields.length - 3} mais
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Nenhum dado novo</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          {row.matchedMatch ? (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                              Atualização
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                              Novo Jogo
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pronto
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 font-bold"
                              title={row.validationError}
                            >
                              <AlertCircle className="w-3 h-3 text-red-600" /> Erro
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover linha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              {validRowsCount > 0 && (
                <span>
                  Pronto para atualizar <strong className="text-slate-800">{validRowsCount}</strong> partida(s) no banco.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={validRowsCount === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                  validRowsCount > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:scale-[1.01]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Salvar {validRowsCount} Partida(s) no Banco</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  Plus,
  Loader2
} from 'lucide-react';
import { DbState } from '../types';
import {
  ParsedMatchRow,
  parseMatchExcelOrCsvFile,
  downloadMatchImportTemplate
} from '../utils/excelHelper';

interface BulkMatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onBulkImportMatches: (rows: ParsedMatchRow[]) => void;
}

export const BulkMatchImportModal: React.FC<BulkMatchImportModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onBulkImportMatches,
}) => {
  const [rows, setRows] = useState<ParsedMatchRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const parsedRows = await parseMatchExcelOrCsvFile(file);
      if (parsedRows.length === 0) {
        setErrorMsg('Nenhuma partida encontrada no arquivo selecionado. Verifique o modelo Excel.');
      } else {
        setRows(parsedRows);
        setSuccessMsg(`Arquivo processado! ${parsedRows.length} partida(s) encontrada(s).`);
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

  const handleDownloadTemplate = () => {
    downloadMatchImportTemplate();
  };

  const validRowsCount = rows.filter(r => r.isValid).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const validRows = rows.filter(r => r.isValid);

    if (validRows.length === 0) {
      setErrorMsg('Nenhuma partida válida para importar. Verifique se os nomes do País, Liga, Mandante e Visitante estão preenchidos.');
      return;
    }

    onBulkImportMatches(validRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Cadastrar Jogos Futuros em Massa (Excel)
                <span className="text-[10px] bg-blue-600 text-white font-mono px-2 py-0.5 rounded-full">
                  FUTDB4 XLSX
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Baixe a planilha modelo, preencha os jogos futuros e importe todos de uma só vez.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Template Download Banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5 border border-blue-100">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Passo 1: Baixar Planilha Modelo (.XLSX)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  A planilha contém todas as colunas necessárias para jogos futuros (País, Liga, Mandante, Visitante, Estádio, Árbitro e Odds FT/HT).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Modelo Excel
            </button>
          </div>

          {/* Section 2: Upload Drop Zone */}
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
                : 'border-slate-200 bg-slate-50 hover:border-blue-300'
            }`}
          >
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileInputChange}
              className="hidden"
              id="match-excel-file-input"
            />
            <label
              htmlFor="match-excel-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                ) : (
                  <Upload className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Clique para selecionar ou arraste o arquivo Excel/CSV aqui
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  Suporta arquivos .XLSX, .XLS e .CSV com jogos futuros
                </span>
              </div>
            </label>
          </div>

          {/* Section 3: Parsed Matches Preview Table */}
          {rows.length > 0 && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Jogos Detectados ({rows.length})
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-bold">
                    {validRowsCount} Válidos
                  </span>
                  {rows.length - validRowsCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-800 rounded-full font-bold">
                      {rows.length - validRowsCount} com Erro
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto max-h-60 rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Data/Hora</th>
                      <th className="p-2.5">País</th>
                      <th className="p-2.5">Liga</th>
                      <th className="p-2.5">Partida (Mandante x Visitante)</th>
                      <th className="p-2.5">Estádio / Árbitro</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 transition-colors ${
                          !row.isValid ? 'bg-red-50/50' : ''
                        }`}
                      >
                        <td className="p-2.5 font-mono text-slate-400">{row.rowIndex}</td>
                        <td className="p-2.5 font-medium text-slate-900 whitespace-nowrap">
                          {row.matchDate || 'A definir'}
                        </td>
                        <td className="p-2.5 text-slate-700">{row.countryName}</td>
                        <td className="p-2.5 text-slate-700">{row.leagueName}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          <span className="text-blue-600">{row.homeTeamName}</span> x{' '}
                          <span className="text-slate-700">{row.awayTeamName}</span>
                        </td>
                        <td className="p-2.5 text-slate-500 text-[11px]">
                          {row.stadium && <div>🏟️ {row.stadium}</div>}
                          {row.referee && <div>🧑‍⚖️ {row.referee}</div>}
                          {!row.stadium && !row.referee && '-'}
                        </td>
                        <td className="p-2.5 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 font-bold" title={row.validationError}>
                              <AlertCircle className="w-3 h-3 text-red-600" /> {row.validationError || 'Inválido'}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover jogo"
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

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
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
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                validRowsCount > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              Cadastrar {validRowsCount} Jogo(s) Futuro(s)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

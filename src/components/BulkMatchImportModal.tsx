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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#0f1325] border border-[#2C3EC4]/40 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2C3EC4]/30 bg-[#0b0e1b]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#2C3EC4]/20 border border-[#2C3EC4]/40 text-[#2C3EC4]">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Cadastrar Jogos Futuros em Massa (Excel)
                <span className="text-[10px] bg-[#2C3EC4] text-white font-mono px-2 py-0.5 rounded-full border border-blue-400">
                  FUTDB4 XLSX
                </span>
              </h3>
              <p className="text-xs text-gray-300">
                Baixe a planilha modelo, preencha os jogos futuros e importe todos de uma só vez.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Template Download Banner */}
          <div className="bg-[#0b0e1b] p-4 rounded-xl border border-[#2C3EC4]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#2C3EC4]/20 text-[#2C3EC4] rounded-lg shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Passo 1: Baixar Planilha Modelo (.XLSX)
                </h4>
                <p className="text-xs text-gray-300 mt-0.5">
                  A planilha contém todas as colunas necessárias para jogos futuros (País, Liga, Mandante, Visitante, Estádio, Árbitro e Odds FT/HT).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-[#2C3EC4] hover:bg-[#2C3EC4]/80 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-[#2C3EC4]/30 transition-all shrink-0 cursor-pointer"
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
                ? 'border-[#2C3EC4] bg-[#2C3EC4]/10 scale-[1.01]'
                : 'border-white/10 bg-[#0b0e1b] hover:border-[#2C3EC4]/50'
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
              <div className="p-3 bg-[#2C3EC4]/20 text-[#2C3EC4] rounded-full border border-[#2C3EC4]/40">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <Upload className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  Clique para selecionar ou arraste o arquivo Excel/CSV aqui
                </span>
                <span className="text-xs text-gray-400 block mt-1">
                  Suporta arquivos .XLSX, .XLS e .CSV com jogos futuros
                </span>
              </div>
            </label>
          </div>

          {/* Section 3: Parsed Matches Preview Table */}
          {rows.length > 0 && (
            <div className="space-y-3 bg-[#0b0e1b] p-4 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#2C3EC4]" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Jogos Detectados ({rows.length})
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-full font-bold">
                    {validRowsCount} Válidos
                  </span>
                  {rows.length - validRowsCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded-full font-bold">
                      {rows.length - validRowsCount} com Erro
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto max-h-60 rounded-lg border border-white/10">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#12162a] text-gray-200 font-bold border-b border-white/10 sticky top-0">
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
                  <tbody className="divide-y divide-white/5 bg-[#0b0e1b]">
                    {rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-white/5 transition-colors ${
                          !row.isValid ? 'bg-red-500/10' : ''
                        }`}
                      >
                        <td className="p-2.5 font-mono text-gray-400">{row.rowIndex}</td>
                        <td className="p-2.5 font-medium text-white whitespace-nowrap">
                          {row.matchDate || 'A definir'}
                        </td>
                        <td className="p-2.5 text-gray-200">{row.countryName}</td>
                        <td className="p-2.5 text-gray-200">{row.leagueName}</td>
                        <td className="p-2.5 font-bold text-white">
                          <span className="text-[#2C3EC4]">{row.homeTeamName}</span> x{' '}
                          <span className="text-gray-200">{row.awayTeamName}</span>
                        </td>
                        <td className="p-2.5 text-gray-400 text-[11px]">
                          {row.stadium && <div>🏟️ {row.stadium}</div>}
                          {row.referee && <div>🧑‍⚖️ {row.referee}</div>}
                          {!row.stadium && !row.referee && '-'}
                        </td>
                        <td className="p-2.5 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Válido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 font-bold" title={row.validationError}>
                              <AlertCircle className="w-3 h-3" /> {row.validationError || 'Inválido'}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={validRowsCount === 0}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                validRowsCount > 0
                  ? 'bg-[#2C3EC4] hover:bg-[#2C3EC4]/80 text-white shadow-[#2C3EC4]/30'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
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

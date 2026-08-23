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
  Loader2,
  ClipboardPaste,
  FileText,
  MapPin,
  Users
} from 'lucide-react';
import { DbState } from '../types';
import {
  ParsedMatchRow,
  parseMatchExcelOrCsvFile,
  parseFutureMatchesText,
  downloadFutureMatchesTemplate,
  FUTURE_MATCHES_COLUMNS,
  formatIsoToDDMMYYYY
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
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
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
        setErrorMsg('Nenhuma linha de jogo válida encontrada no arquivo. Verifique o modelo de colunas.');
      } else {
        setRows(parsedRows);
        setSuccessMsg(`Arquivo processado com sucesso! ${parsedRows.length} jogo(s) futuro(s) encontrado(s).`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar o arquivo Excel/CSV.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPastedText = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!pastedText.trim()) {
      setErrorMsg('Cole o conteúdo da planilha ou CSV na caixa de texto.');
      return;
    }

    try {
      const parsedRows = parseFutureMatchesText(pastedText);
      if (parsedRows.length === 0) {
        setErrorMsg('Nenhum jogo reconhecido no texto colado. Verifique os cabeçalhos das colunas.');
      } else {
        setRows(parsedRows);
        setSuccessMsg(`${parsedRows.length} jogo(s) futuro(s) identificado(s) a partir do texto.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar os dados colados.');
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
      setErrorMsg('Nenhum jogo válido para cadastrar. Verifique os campos Mandante e Visitante.');
      return;
    }

    onBulkImportMatches(validRows);
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
                  Planilha de Cadastro de Jogos Futuros (Pré-Jogo)
                </h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded-full font-bold border border-blue-200">
                  14 Colunas
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cadastre partidas agendadas com odds, árbitro, estádio e capacidade em massa.
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
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Template Download Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 p-4 rounded-xl border border-blue-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Colunas Oficiais da Planilha de Jogos Futuros
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Baixe o modelo pré-formatado com as 14 colunas prontas para preenchimento.
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {FUTURE_MATCHES_COLUMNS.map((col, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-white text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-mono"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => downloadFutureMatchesTemplate('xlsx')}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => downloadFutureMatchesTemplate('csv')}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                Baixar CSV (.csv)
              </button>
            </div>
          </div>

          {/* Section 2: Input Mode Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Enviar Arquivo (.xlsx / .csv)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Colar Dados Copiados da Planilha
            </button>
          </div>

          {activeTab === 'upload' ? (
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
                  : 'border-slate-200 bg-slate-50/70 hover:border-blue-300'
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
                <div className="p-3 bg-blue-100/70 text-blue-600 rounded-full border border-blue-200">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  ) : (
                    <Upload className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    Clique para selecionar ou arraste sua planilha de Jogos Futuros
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Formatos suportados: Excel (.xlsx, .xls) e Arquivos de Texto (.csv)
                  </span>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Cole as linhas copiadas do Excel / Google Sheets ou CSV:</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Inclua a linha de cabeçalho
                </span>
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Pais	Liga	Data	Hora	Mandante	Visitante	Odd_Home_FT	Odd_Draw_FT	Odd_Away_FT	Odd_Over25_FT	Odd_Under25_FT	Arbitro	Estadio	Capacidade&#10;Inglaterra	Premier League ING	29/08/2026	16:00	Arsenal	Chelsea	2.10	3.40	3.50	1.85	1.95	Michael Oliver	Emirates Stadium	60704"
                rows={5}
                className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
              />
              <button
                type="button"
                onClick={handleProcessPastedText}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ClipboardPaste className="w-4 h-4" />
                Processar Dados Colados
              </button>
            </div>
          )}

          {/* Section 3: Parsed Matches Preview Table */}
          {rows.length > 0 && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Jogos Futuros Detectados ({rows.length})
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-bold border border-emerald-200">
                    {validRowsCount} Válidos para Cadastro
                  </span>
                  {rows.length - validRowsCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-800 rounded-full font-bold border border-red-200">
                      {rows.length - validRowsCount} Incompletos
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto max-h-64 rounded-xl border border-slate-200 bg-white shadow-inner">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Data & Hora</th>
                      <th className="p-2.5">País / Liga</th>
                      <th className="p-2.5">Partida (Mandante x Visitante)</th>
                      <th className="p-2.5">Odds FT (1 / X / 2)</th>
                      <th className="p-2.5">Odds O/U 2.5</th>
                      <th className="p-2.5">Estádio & Capacidade</th>
                      <th className="p-2.5">Árbitro</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, idx) => (
                      <tr
                        key={`${row.rowIndex}_${idx}`}
                        className={`hover:bg-slate-50 transition-colors ${
                          !row.isValid ? 'bg-red-50/40' : ''
                        }`}
                      >
                        <td className="p-2.5 font-mono text-slate-400">{row.rowIndex}</td>
                        <td className="p-2.5 font-medium text-slate-900 whitespace-nowrap">
                          {row.matchDate ? formatIsoToDDMMYYYY(row.matchDate) : 'A definir'}
                        </td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-900">{row.leagueName}</div>
                          <div className="text-[11px] text-slate-500">{row.countryName}</div>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          <span className="text-blue-600">{row.homeTeamName}</span>
                          <span className="text-slate-400 mx-1.5 font-normal">vs</span>
                          <span className="text-slate-800">{row.awayTeamName}</span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap font-mono text-[11px]">
                          {row.oddHomeFT || row.oddDrawFT || row.oddAwayFT ? (
                            <div className="flex gap-1.5">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold" title="Home">
                                {row.oddHomeFT?.toFixed(2) || '-'}
                              </span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700" title="Draw">
                                {row.oddDrawFT?.toFixed(2) || '-'}
                              </span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold" title="Away">
                                {row.oddAwayFT?.toFixed(2) || '-'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 whitespace-nowrap font-mono text-[11px]">
                          {row.oddOver25FT || row.oddUnder25FT ? (
                            <div className="flex gap-1.5">
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 font-bold" title="Over 2.5">
                                +{row.oddOver25FT?.toFixed(2) || '-'}
                              </span>
                              <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 font-bold" title="Under 2.5">
                                -{row.oddUnder25FT?.toFixed(2) || '-'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600 text-[11px]">
                          {row.stadium ? (
                            <div className="flex items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{row.stadium}</span>
                              {row.stadiumCapacity ? (
                                <span className="text-slate-400">({row.stadiumCapacity.toLocaleString('pt-BR')})</span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600 text-[11px]">
                          {row.referee ? <span>{row.referee}</span> : <span className="text-slate-400">-</span>}
                        </td>
                        <td className="p-2.5 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Agendado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 font-bold" title={row.validationError}>
                              <AlertCircle className="w-3 h-3 text-red-600" /> Incompleto
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

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              {validRowsCount > 0
                ? `${validRowsCount} jogo(s) futuro(s) pronto(s) para cadastro no sistema.`
                : 'Selecione uma planilha ou cole os dados para visualizar a prévia.'}
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
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                Salvar & Cadastrar {validRowsCount} Jogo(s) Futuro(s)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

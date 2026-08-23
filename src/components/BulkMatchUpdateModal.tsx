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
  ClipboardPaste,
  FileText,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  MapPin,
  Users
} from 'lucide-react';
import { DbState, Match } from '../types';
import {
  ParsedMatchUpdateRow,
  parseMatchUpdateExcelOrCsvFile,
  parseFinishedMatchesText,
  downloadFinishedMatchesTemplate,
  FINISHED_MATCHES_COLUMNS,
  formatIsoToDDMMYYYY
} from '../utils/excelHelper';

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
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const [rows, setRows] = useState<ParsedMatchUpdateRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [templateExportMode, setTemplateExportMode] = useState<'future_only' | 'empty_samples'>('future_only');

  if (!isOpen) return null;

  const futureMatchesCount = dbState.matches.filter(
    m => m.status === 'AGENDADO' || m.homeScore === null || m.awayScore === null
  ).length;

  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    downloadFinishedMatchesTemplate(dbState.matches, format, templateExportMode);
  };

  const handleFileProcess = async (file: File) => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const parsedRows = await parseMatchUpdateExcelOrCsvFile(file, dbState.matches);
      if (parsedRows.length === 0) {
        setErrorMsg('Nenhuma linha de jogo válida encontrada no arquivo selecionado. Verifique os cabeçalhos das colunas.');
      } else {
        setRows(parsedRows);
        const updatedCount = parsedRows.filter(r => !r.isNewMatch).length;
        const newCount = parsedRows.filter(r => r.isNewMatch).length;
        setSuccessMsg(
          `Arquivo processado com sucesso! ${parsedRows.length} jogo(s) encontrado(s): ${updatedCount} atualizarão jogos futuros existentes e ${newCount} serão cadastrados como novos.`
        );
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
      const parsedRows = parseFinishedMatchesText(pastedText, dbState.matches);
      if (parsedRows.length === 0) {
        setErrorMsg('Nenhum jogo reconhecido no texto colado. Verifique os cabeçalhos das colunas.');
      } else {
        setRows(parsedRows);
        const updatedCount = parsedRows.filter(r => !r.isNewMatch).length;
        const newCount = parsedRows.filter(r => r.isNewMatch).length;
        setSuccessMsg(
          `${parsedRows.length} jogo(s) identificado(s): ${updatedCount} atualizarão jogos futuros e ${newCount} novos.`
        );
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
  const willUpdateFutureCount = validRows.filter(r => !r.isNewMatch).length;
  const willCreateNewCount = validRows.filter(r => r.isNewMatch).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (validRows.length === 0) {
      setErrorMsg('Nenhuma linha de jogo válida para atualizar ou cadastrar.');
      return;
    }

    onBulkUpdateMatches(validRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Planilha de Jogos Finalizados (Resultados & Estatísticas)
                </h3>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-mono px-2 py-0.5 rounded-full font-bold border border-teal-200">
                  33 Colunas
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-600" /> Auto-Merge & Cloud Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Se o jogo foi cadastrado anteriormente como futuro, o sistema atualiza seus dados automaticamente no banco de dados e sincroniza na nuvem para todos os usuários.
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
          <div className="bg-gradient-to-r from-teal-50 via-emerald-50/40 to-slate-50 p-4 rounded-xl border border-teal-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Baixar Planilha Modelo de Jogos Finalizados
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Planilha completa com todas as 33 colunas (Placares FT/HT, xG, Finalizações, Chutes a Gol, Faltas, Escanteios, Cartões, Estádio, Público, Capacidade e Odds).
              </p>

              {/* Template Mode Selection */}
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="templateMode"
                    checked={templateExportMode === 'future_only'}
                    onChange={() => setTemplateExportMode('future_only')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    Pré-preencher com Jogos Futuros do Sistema{' '}
                    <strong className="text-teal-700">({futureMatchesCount} agendados)</strong>
                  </span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="templateMode"
                    checked={templateExportMode === 'empty_samples'}
                    onChange={() => setTemplateExportMode('empty_samples')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>Planilha Vazia com Linhas de Exemplo</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadTemplate('xlsx')}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => handleDownloadTemplate('csv')}
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
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Enviar Planilha (.xlsx / .csv)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-teal-600 text-white shadow-sm'
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
                  ? 'border-teal-600 bg-teal-50 scale-[1.01]'
                  : 'border-slate-200 bg-slate-50/70 hover:border-teal-300'
              }`}
            >
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileInputChange}
                className="hidden"
                id="match-update-excel-file-input"
              />
              <label
                htmlFor="match-update-excel-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="p-3 bg-teal-100/70 text-teal-600 rounded-full border border-teal-200">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                  ) : (
                    <Upload className="w-6 h-6 text-teal-600" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    Clique para selecionar ou arraste a planilha de Jogos Finalizados
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
                placeholder="Pais	Liga	Data	Hora	Mandante	Visitante	Placar_Mandante_FT	Placar_Visitante_FT	Placar_Mandante_HT	Placar_Visitante_HT	Arbitro	Estadio	Publico	Capacidade	xG_Mandante_FT	xG_Visitante_FT	Finalizacoes_Mandante_FT	Finalizacoes_Visitante_FT	Chutes_Gol_Mandante_FT	Chutes_Gol_Visitante_FT	Faltas_Mandante_FT	Faltas_Visitante_FT	Escanteios_Mandante_FT	Escanteios_Visitante_FT	Cartao_Amarelo_Mandante_FT	Cartao_Amarelo_Visitante_FT	Cartao_Vermelho_Mandante_FT	Cartao_Vermelho_Visitante_FT	Odd_Home_FT	Odd_Draw_FT	Odd_Away_FT	Odd_Over25_FT	Odd_Under25_FT&#10;Inglaterra	Premier League ING	23/08/2026	16:00	Arsenal	Chelsea	2	1	1	0	Michael Oliver	Emirates Stadium	60214	60704	2.15	1.08	15	9	6	3	11	14	7	4	2	3	0	0	2.10	3.40	3.50	1.85	1.95"
                rows={5}
                className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50"
              />
              <button
                type="button"
                onClick={handleProcessPastedText}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ClipboardPaste className="w-4 h-4" />
                Processar Dados Colados
              </button>
            </div>
          )}

          {/* Section 3: Parsed Matches Preview Table */}
          {rows.length > 0 && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Jogos Detectados ({rows.length})
                  </h4>

                  {willUpdateFutureCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-emerald-600" />
                      {willUpdateFutureCount} Atualizarão Jogos Futuros
                    </span>
                  )}

                  {willCreateNewCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-800 rounded-full font-bold border border-blue-200">
                      {willCreateNewCount} Novos Jogos Finalizados
                    </span>
                  )}

                  {rows.length - validRowsCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-800 rounded-full font-bold border border-red-200">
                      {rows.length - validRowsCount} com Erro
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto max-h-72 rounded-xl border border-slate-200 bg-white shadow-inner">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Ação no Banco</th>
                      <th className="p-2.5">Data & Liga</th>
                      <th className="p-2.5">Partida</th>
                      <th className="p-2.5 text-center">Placar FT</th>
                      <th className="p-2.5 text-center">Placar HT</th>
                      <th className="p-2.5 text-center">xG</th>
                      <th className="p-2.5 text-center">Finaliz. (Gol)</th>
                      <th className="p-2.5 text-center">Escant. / Faltas</th>
                      <th className="p-2.5 text-center">Cartões (🟨 / 🟥)</th>
                      <th className="p-2.5">Estádio & Público</th>
                      <th className="p-2.5">Árbitro</th>
                      <th className="p-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, idx) => (
                      <tr
                        key={`${row.rowIndex}_${idx}`}
                        className={`hover:bg-slate-50 transition-colors ${
                          !row.isValid ? 'bg-red-50/40' : !row.isNewMatch ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <td className="p-2.5 font-mono text-slate-400">{row.rowIndex}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          {!row.isNewMatch ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                              <RefreshCw className="w-3 h-3 text-emerald-600" />
                              Atualiza {row.matchId || row.matchedMatch?.id || 'Agendado'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                              Novo Jogo
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{row.leagueName}</div>
                          <div className="text-[11px] text-slate-500">
                            {row.matchDate ? formatIsoToDDMMYYYY(row.matchDate) : ''}
                          </div>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                          <span className="text-teal-700">{row.homeTeamName}</span>
                          <span className="text-slate-400 mx-1.5 font-normal">x</span>
                          <span className="text-slate-800">{row.awayTeamName}</span>
                        </td>
                        <td className="p-2.5 text-center font-bold font-mono text-sm whitespace-nowrap">
                          {row.homeScore !== null && row.awayScore !== null ? (
                            <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-mono">
                              {row.homeScore} - {row.awayScore}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center text-[11px] font-mono text-slate-600 whitespace-nowrap">
                          {row.halftimeHomeScore !== null && row.halftimeAwayScore !== null ? (
                            <span>
                              {row.halftimeHomeScore} - {row.halftimeAwayScore}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center text-[11px] font-mono text-teal-700 whitespace-nowrap font-semibold">
                          {row.xgHomeFT !== null && row.xgAwayFT !== null ? (
                            <span>
                              {row.xgHomeFT?.toFixed(2)} x {row.xgAwayFT?.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center text-[11px] whitespace-nowrap font-mono text-slate-700">
                          {row.shotsHomeFT !== null || row.shotsAwayFT !== null ? (
                            <span>
                              {row.shotsHomeFT ?? '-'} ({row.shotsOnTargetHomeFT ?? '-'}) x {row.shotsAwayFT ?? '-'} ({row.shotsOnTargetAwayFT ?? '-'})
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center text-[11px] whitespace-nowrap text-slate-600">
                          {row.cornersHomeFT !== null || row.foulsHomeFT !== null ? (
                            <div className="text-[10px]">
                              <div>Esc: {row.cornersHomeFT ?? 0} x {row.cornersAwayFT ?? 0}</div>
                              <div>Faltas: {row.foulsHomeFT ?? 0} x {row.foulsAwayFT ?? 0}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center text-[11px] whitespace-nowrap text-slate-700">
                          {row.yellowCardsHomeFT !== null || row.redCardsHomeFT !== null ? (
                            <div className="flex items-center justify-center gap-2 text-[10px]">
                              <span>🟨 {row.yellowCardsHomeFT ?? 0}x{row.yellowCardsAwayFT ?? 0}</span>
                              {(row.redCardsHomeFT || row.redCardsAwayFT) ? (
                                <span className="text-red-600 font-bold">🟥 {row.redCardsHomeFT ?? 0}x{row.redCardsAwayFT ?? 0}</span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-600">
                          {row.stadium ? (
                            <div>
                              <div className="font-medium text-slate-800">{row.stadium}</div>
                              {row.attendance ? (
                                <div className="text-[10px] text-slate-500">
                                  Público: {row.attendance.toLocaleString('pt-BR')}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-600">
                          {row.referee ? <span>{row.referee}</span> : <span className="text-slate-400">-</span>}
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              {validRowsCount > 0 ? (
                <span>
                  <strong>{validRowsCount}</strong> jogo(s) prontos para inclusão no banco ({willUpdateFutureCount} atualizarão jogos futuros, {willCreateNewCount} novos).
                </span>
              ) : (
                'Envie a planilha de jogos finalizados ou cole os dados para visualizar a prévia.'
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
                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                Salvar & Sincronizar na Nuvem para Todos os Usuários
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

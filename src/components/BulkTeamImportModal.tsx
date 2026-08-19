import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Globe,
  Trophy,
  Calendar,
  Sparkles,
  Loader2,
  FileCheck,
  Building2,
  Shield,
  Image as ImageIcon
} from 'lucide-react';
import { DbState, Country, League } from '../types';
import { parseExcelOrCsvFile, downloadTeamImportTemplate, ParsedTeamRow } from '../utils/excelHelper';
import { findOrCreateCountry, findOrCreateLeague } from '../utils/idGenerator';
import { sanitizeImageUrl } from '../utils/imageHelper';

interface BulkTeamImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onBulkImportTeams: (importData: {
    countryId: string;
    countryName: string;
    leagueId: string;
    leagueName: string;
    season: string;
    teams: { name: string; stadium: string; logoUrl: string }[];
  }) => void;
  onOpenEntityModal?: (type: 'country' | 'league') => void;
}

export const BulkTeamImportModal: React.FC<BulkTeamImportModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onBulkImportTeams,
  onOpenEntityModal,
}) => {
  // Form Selections
  const [countryId, setCountryId] = useState<string>('');
  const [leagueId, setLeagueId] = useState<string>('');
  const [season, setSeason] = useState<string>('2526');

  // File & Rows
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedTeamRow[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filtered leagues for chosen country
  const availableLeagues = countryId
    ? dbState.leagues.filter(l => l.countryId === countryId)
    : dbState.leagues;

  const handleCountryChange = (newCountryId: string) => {
    setCountryId(newCountryId);
    // Auto-select first league of country if available
    const firstLeague = dbState.leagues.find(l => l.countryId === newCountryId);
    if (firstLeague) {
      setLeagueId(firstLeague.id);
    } else {
      setLeagueId('');
    }
  };

  // Process uploaded file
  const handleFileProcess = async (selectedFile: File) => {
    setErrorMsg('');
    setFile(selectedFile);
    setIsParsing(true);

    try {
      const parsedRows = await parseExcelOrCsvFile(selectedFile);
      if (parsedRows.length === 0) {
        setErrorMsg('O arquivo não contém linhas de dados válidas.');
        setRows([]);
      } else {
        setRows(parsedRows);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao ler a planilha. Verifique o formato do arquivo.');
      setRows([]);
    } finally {
      setIsParsing(false);
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

  const handleUpdateRowField = (index: number, field: 'time' | 'estadio' | 'urlEscudo', value: string) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        isValid: field === 'time' ? value.trim().length >= 2 : updated[index].isValid,
      };
      return updated;
    });
  };

  const handleAddEmptyRow = () => {
    setRows(prev => [
      ...prev,
      {
        rowIndex: prev.length + 1,
        time: '',
        estadio: '',
        urlEscudo: '',
        isValid: false,
      },
    ]);
  };

  const handleDownloadTemplate = () => {
    const selectedLeague = dbState.leagues.find(l => l.id === leagueId);
    downloadTeamImportTemplate(selectedLeague?.name || 'Campeonato', season || '2026');
  };

  const validRowsCount = rows.filter(r => r.isValid && r.time.trim().length > 0).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!countryId) {
      setErrorMsg('Por favor, selecione um País.');
      return;
    }
    if (!leagueId) {
      setErrorMsg('Por favor, selecione uma Liga / Campeonato.');
      return;
    }
    if (!season.trim()) {
      setErrorMsg('Por favor, informe a Temporada (ex: 2526, 2627, 2026).');
      return;
    }

    const validTeams = rows
      .filter(r => r.isValid && r.time.trim().length > 0)
      .map(r => ({
        name: r.time.trim(),
        stadium: r.estadio.trim(),
        logoUrl: sanitizeImageUrl(r.urlEscudo) || '',
      }));

    if (validTeams.length === 0) {
      setErrorMsg('Carregue um arquivo Excel com pelo menos uma equipe válida.');
      return;
    }

    const selectedCountry = dbState.countries.find(c => c.id === countryId);
    const selectedLeague = dbState.leagues.find(l => l.id === leagueId);

    onBulkImportTeams({
      countryId,
      countryName: selectedCountry?.name || '',
      leagueId,
      leagueName: selectedLeague?.name || '',
      season: season.trim(),
      teams: validTeams,
    });

    onClose();
  };

  const quickSeasons = ['2526', '2627', '2026', '2025/2026'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#080808]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Cadastrar Equipes em Massa (Excel)
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Importador XLSX
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Selecione País, Liga e Temporada e envie a planilha com a lista dos times.
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
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Selection Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#080808] p-3.5 rounded-xl border border-white/5">
            {/* Country Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  1. País *
                </span>
                {onOpenEntityModal && (
                  <button
                    type="button"
                    onClick={() => onOpenEntityModal('country')}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Novo
                  </button>
                )}
              </label>
              <select
                required
                value={countryId}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Selecione o País --</option>
                {dbState.countries.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            {/* League Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                  2. Liga / Campeonato *
                </span>
                {onOpenEntityModal && (
                  <button
                    type="button"
                    onClick={() => onOpenEntityModal('league')}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Nova
                  </button>
                )}
              </label>
              <select
                required
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Selecione a Liga --</option>
                {availableLeagues.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.countryName})
                  </option>
                ))}
              </select>
            </div>

            {/* Season Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                3. Temporada *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 2526, 2627, 2026"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              {/* Quick Season Buttons */}
              <div className="flex items-center gap-1 mt-1.5 overflow-x-auto">
                <span className="text-[10px] text-gray-500 shrink-0">Opções:</span>
                {quickSeasons.map(qs => (
                  <button
                    key={qs}
                    type="button"
                    onClick={() => setSeason(qs)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      season === qs
                        ? 'bg-emerald-500 text-black font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    {qs}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Download Template Banner */}
          <div className="flex items-center justify-between p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  Estrutura da Planilha Excel (.xlsx)
                </p>
                <p className="text-[11px] text-gray-300">
                  Colunas requeridas: <code className="text-emerald-400 font-mono font-bold">Times</code> | <code className="text-emerald-400 font-mono font-bold">Estadio</code> | <code className="text-emerald-400 font-mono font-bold">URL_escudo</code>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              Baixar Modelo Excel
            </button>
          </div>

          {/* Section 2: Drag & Drop File Upload Area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : file
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : 'border-white/15 hover:border-emerald-500/40 bg-[#121212]'
              }`}
            >
              {isParsing ? (
                <div className="flex flex-col items-center justify-center py-2 space-y-2">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs text-gray-300 font-medium">Processando planilha Excel...</p>
                </div>
              ) : file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white truncate max-w-xs">{file.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB • {rows.length} linhas encontradas ({validRowsCount} válidas)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setRows([]);
                    }}
                    className="ml-4 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs border border-red-500/20"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <UploadCloud className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-white">
                    Clique aqui ou arraste seu arquivo Excel (<code className="text-emerald-400">.xlsx, .xls, .csv</code>)
                  </p>
                  <p className="text-[11px] text-gray-400">
                    O sistema lerá automaticamente as colunas <span className="text-gray-200">Times</span>, <span className="text-gray-200">Estadio</span> e <span className="text-gray-200">URL_escudo</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Parsed Table Preview */}
          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Conferência das Equipes ({validRowsCount} Válidas)
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={handleAddEmptyRow}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Linha Manual
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto border border-white/10 rounded-xl bg-[#090909] divide-y divide-white/5 scrollbar-thin">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111111] text-gray-400 sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center font-mono">#</th>
                      <th className="py-2 px-3">Escudo</th>
                      <th className="py-2 px-3">Nome do Time (Times) *</th>
                      <th className="py-2 px-3">Estádio (Estadio)</th>
                      <th className="py-2 px-3">Link URL Escudo</th>
                      <th className="py-2 px-3 w-10 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-white/5 transition-colors ${
                          !r.isValid ? 'bg-red-950/20' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-gray-500">
                          {idx + 1}
                        </td>

                        {/* Logo Preview */}
                        <td className="py-2 px-3">
                          <div className="w-7 h-7 bg-[#141414] border border-white/10 rounded flex items-center justify-center overflow-hidden shrink-0">
                            {r.urlEscudo ? (
                              <img
                                src={r.urlEscudo}
                                alt="Escudo"
                                className="w-full h-full object-contain p-0.5"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-gray-600" />
                            )}
                          </div>
                        </td>

                        {/* Team Name */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.time}
                            onChange={(e) => handleUpdateRowField(idx, 'time', e.target.value)}
                            placeholder="Nome do Time..."
                            className="w-full bg-[#181818] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </td>

                        {/* Stadium */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.estadio}
                            onChange={(e) => handleUpdateRowField(idx, 'estadio', e.target.value)}
                            placeholder="Estádio..."
                            className="w-full bg-[#181818] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </td>

                        {/* Logo URL */}
                        <td className="py-2 px-3">
                          <input
                            type="url"
                            value={r.urlEscudo}
                            onChange={(e) => handleUpdateRowField(idx, 'urlEscudo', e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-[#181818] border border-white/10 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                          />
                        </td>

                        {/* Remove Action */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-xs text-gray-400">
              {validRowsCount > 0
                ? `${validRowsCount} equipe(s) pronta(s) para cadastro.`
                : 'Selecione uma planilha válida com equipes.'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={validRowsCount === 0 || !countryId || !leagueId}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                Cadastrar {validRowsCount} Equipes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

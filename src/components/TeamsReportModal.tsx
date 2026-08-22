import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  X,
  Check,
  Copy,
  Globe,
  Trophy,
  Shield,
  Loader2,
  Table,
  FileText
} from 'lucide-react';
import { DbState, Team } from '../types';
import { exportTeamsToExcel, exportTeamsToCsv } from '../utils/excelHelper';
import { isValidImageUrl } from '../utils/imageHelper';

interface TeamsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
}

export const TeamsReportModal: React.FC<TeamsReportModalProps> = ({
  isOpen,
  onClose,
  dbState,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Quick lookup maps
  const countryMap = useMemo(() => new Map(dbState.countries.map(c => [c.id, c.name])), [dbState.countries]);
  const leagueMap = useMemo(() => new Map(dbState.leagues.map(l => [l.id, l.name])), [dbState.leagues]);

  // Filtered & Sorted Teams (País -> Liga -> Time)
  const filteredTeams = useMemo(() => {
    return [...dbState.teams]
      .filter(t => {
        const countryName = t.countryName || countryMap.get(t.countryId) || '';
        const leagueName = t.leagueName || leagueMap.get(t.leagueId) || '';

        const matchesSearch =
          !searchTerm ||
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leagueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCountry = !selectedCountry || t.countryId === selectedCountry;
        const matchesLeague =
          !selectedLeague ||
          t.leagueId === selectedLeague ||
          (t.leagueIds && t.leagueIds.includes(selectedLeague));

        return matchesSearch && matchesCountry && matchesLeague;
      })
      .sort((a, b) => {
        const cA = a.countryName || countryMap.get(a.countryId) || '';
        const cB = b.countryName || countryMap.get(b.countryId) || '';
        const compCountry = cA.localeCompare(cB, 'pt-BR', { sensitivity: 'base' });
        if (compCountry !== 0) return compCountry;

        const lA = a.leagueName || leagueMap.get(a.leagueId) || '';
        const lB = b.leagueName || leagueMap.get(b.leagueId) || '';
        const compLeague = lA.localeCompare(lB, 'pt-BR', { sensitivity: 'base' });
        if (compLeague !== 0) return compLeague;

        return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
      });
  }, [dbState.teams, searchTerm, selectedCountry, selectedLeague, countryMap, leagueMap]);

  // Overall database stats
  const totalTeams = dbState.teams.length;
  const totalCountries = dbState.countries.length;
  const totalLeagues = dbState.leagues.length;
  const teamsWithLogo = dbState.teams.filter(t => isValidImageUrl(t.logoUrl)).length;

  const handleDownloadExcel = async (onlyFiltered: boolean = false) => {
    try {
      setIsExportingExcel(true);
      const targetList = onlyFiltered ? filteredTeams : dbState.teams;
      const fileNameSuffix = onlyFiltered && (selectedCountry || selectedLeague || searchTerm)
        ? `relatorio_times_filtrados_${new Date().toISOString().slice(0, 10)}.xlsx`
        : `relatorio_todos_times_${new Date().toISOString().slice(0, 10)}.xlsx`;

      await exportTeamsToExcel(targetList, dbState.leagues, dbState.countries, fileNameSuffix);
    } catch (err) {
      console.error('Erro ao exportar relatório de times para Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadCsv = (onlyFiltered: boolean = false) => {
    try {
      setIsExportingCsv(true);
      const targetList = onlyFiltered ? filteredTeams : dbState.teams;
      const fileNameSuffix = onlyFiltered && (selectedCountry || selectedLeague || searchTerm)
        ? `relatorio_times_filtrados_${new Date().toISOString().slice(0, 10)}.csv`
        : `relatorio_todos_times_${new Date().toISOString().slice(0, 10)}.csv`;

      exportTeamsToCsv(targetList, dbState.leagues, dbState.countries, fileNameSuffix);
    } catch (err) {
      console.error('Erro ao exportar relatório de times para CSV:', err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleCopyFormattedText = () => {
    const lines = filteredTeams.map((t, idx) => {
      const countryName = t.countryName || countryMap.get(t.countryId) || '-';
      const leagueName = t.leagueName || leagueMap.get(t.leagueId) || '-';
      return `${idx + 1}. [${countryName} | ${leagueName}] ${t.name}`;
    });

    const header = `📋 RELATÓRIO DE TIMES CADASTRADOS (${filteredTeams.length} times)\n` +
      `Total: ${filteredTeams.length} times | ${totalCountries} Países | ${totalLeagues} Ligas\n` +
      `--------------------------------------------------\n`;

    const fullText = header + lines.join('\n');
    navigator.clipboard.writeText(fullText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-200 border border-white/20 shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Relatório de Times Cadastrados
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30">
                  Colunas: País • Liga • Time
                </span>
              </h2>
              <p className="text-xs text-teal-200/90 font-medium">
                Consulte e baixe a planilha completa de todos os clubes, países e ligas do sistema.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar Relatório"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-2xs">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Total de Times</div>
              <div className="text-sm font-black text-slate-900">{totalTeams} clubes</div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-2xs">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Total de Países</div>
              <div className="text-sm font-black text-slate-900">{totalCountries} países</div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-2xs">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Total de Ligas</div>
              <div className="text-sm font-black text-slate-900">{totalLeagues} ligas</div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-2xs">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Com Escudo</div>
              <div className="text-sm font-black text-slate-900">
                {teamsWithLogo} <span className="text-xs font-normal text-slate-500">({totalTeams > 0 ? ((teamsWithLogo/totalTeams)*100).toFixed(0) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Action Bar */}
        <div className="p-3.5 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por time, país ou liga..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Country */}
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedLeague('');
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="">Todos os Países ({dbState.countries.length})</option>
              {dbState.countries.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Filter League */}
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="">Todas as Ligas ({dbState.leagues.length})</option>
              {dbState.leagues
                .filter(l => !selectedCountry || l.countryId === selectedCountry)
                .map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>

            {(searchTerm || selectedCountry || selectedLeague) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCountry('');
                  setSelectedLeague('');
                }}
                className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                title="Limpar todos os filtros"
              >
                <X className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Download Excel */}
            <button
              onClick={() => handleDownloadExcel(Boolean(searchTerm || selectedCountry || selectedLeague))}
              disabled={isExportingExcel || filteredTeams.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              title="Baixar planilha formatada em Excel (.xlsx) com colunas de País, Liga e Time"
            >
              {isExportingExcel ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Baixar Excel (.xlsx)</span>
            </button>

            {/* Download CSV */}
            <button
              onClick={() => handleDownloadCsv(Boolean(searchTerm || selectedCountry || selectedLeague))}
              disabled={isExportingCsv || filteredTeams.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              title="Baixar arquivo compatível (.csv com UTF-8 BOM)"
            >
              {isExportingCsv ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>Baixar CSV</span>
            </button>

            {/* Copy list */}
            <button
              onClick={handleCopyFormattedText}
              disabled={filteredTeams.length === 0}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border font-bold text-xs rounded-xl transition-all cursor-pointer ${
                copiedSuccess
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Copiar lista de times para colar no WhatsApp ou Bloco de Notas"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Copiar Lista</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Teams Table Preview */}
        <div className="flex-1 overflow-y-auto min-h-[300px] p-4 bg-slate-100/50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>
                Visualizando <span className="font-bold text-slate-900">{filteredTeams.length}</span> de{' '}
                <span className="font-bold text-slate-900">{totalTeams}</span> times cadastrados
              </span>
              <span className="text-[11px] text-slate-400">
                Ordenado alfabeticamente por País ➔ Liga ➔ Time
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-teal-900 text-white font-bold border-b border-teal-800">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-44">País</th>
                  <th className="py-2.5 px-3 w-56">Liga / Campeonato</th>
                  <th className="py-2.5 px-3">Nome do Time</th>
                  <th className="py-2.5 px-3 w-28 text-center">ID Time</th>
                  <th className="py-2.5 px-3 w-20 text-center">Escudo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      Nenhum time encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team, idx) => {
                    const countryName = team.countryName || countryMap.get(team.countryId) || '-';
                    const leagueName = team.leagueName || leagueMap.get(team.leagueId) || '-';
                    const hasLogo = isValidImageUrl(team.logoUrl);

                    return (
                      <tr
                        key={team.id}
                        className={`hover:bg-teal-50/50 transition-colors ${
                          idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                        }`}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{countryName}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate max-w-[200px]" title={leagueName}>
                              {leagueName}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            {hasLogo ? (
                              <img
                                src={team.logoUrl}
                                alt={team.name}
                                className="w-5 h-5 object-contain shrink-0"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-5 h-5 rounded bg-slate-200 text-[9px] font-bold text-slate-600 flex items-center justify-center shrink-0">
                                {team.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="text-slate-900 font-bold">{team.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">
                          {team.id}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {hasLogo ? (
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Escudo cadastrado"></span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Sem URL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 text-xs text-slate-500">
          <div>
            💡 <span className="font-medium text-slate-700">Dica:</span> A planilha exportada contém filtros automáticos e linhas zebradas para facilitar a busca no Excel e Google Sheets.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadExcel(false)}
              className="px-3 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
            >
              Baixar Todos os {totalTeams} Times (.xlsx)
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

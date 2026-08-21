import React, { useState } from 'react';
import { Shield, Plus, Search, Trash2, Globe, MapPin, Link2, Check, X, Edit2, FileSpreadsheet, Trophy, Filter, AlertTriangle, AlertCircle, Download, Loader2 } from 'lucide-react';
import { DbState, Team } from '../types';
import { isValidImageUrl, validateImageUrlInput, sanitizeImageUrl } from '../utils/imageHelper';
import { exportTeamsToExcel } from '../utils/excelHelper';

interface TeamManagerProps {
  dbState: DbState;
  isMaster?: boolean;
  onOpenEntityModal: (type?: 'country' | 'league' | 'team') => void;
  onOpenBulkImportModal?: () => void;
  onDeleteTeam: (id: string) => void;
  onUpdateTeamLogo?: (teamId: string, logoUrl: string) => void;
  onUpdateTeamLeague?: (teamId: string, leagueId: string) => void;
  onEditTeam?: (team: Team) => void;
}

export const TeamManager: React.FC<TeamManagerProps> = ({
  dbState,
  isMaster = true,
  onOpenEntityModal,
  onOpenBulkImportModal,
  onDeleteTeam,
  onUpdateTeamLogo,
  onUpdateTeamLeague,
  onEditTeam,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState('');
  const [onlyWithoutLogo, setOnlyWithoutLogo] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [savedSuccessTeamId, setSavedSuccessTeamId] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);

  const teams = dbState.teams.filter(t => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.leagueName && t.leagueName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCountry = !selectedCountryFilter || t.countryId === selectedCountryFilter;
    const matchesLeague = !selectedLeagueFilter || t.leagueId === selectedLeagueFilter || (t.leagueIds && t.leagueIds.includes(selectedLeagueFilter));
    const matchesLogo = !onlyWithoutLogo || !isValidImageUrl(t.logoUrl);

    return matchesSearch && matchesCountry && matchesLeague && matchesLogo;
  });

  const handleExportTeams = async () => {
    try {
      setIsExporting(true);
      const targetTeams = (searchTerm || selectedCountryFilter || selectedLeagueFilter || onlyWithoutLogo)
        ? teams
        : dbState.teams;
      await exportTeamsToExcel(targetTeams, dbState.leagues, dbState.countries);
    } catch (err) {
      console.error('Erro ao exportar times para Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleStartEdit = (teamId: string, currentUrl?: string) => {
    setEditingTeamId(teamId);
    setEditUrl(currentUrl || '');
    setUrlError(null);
  };

  const handleSaveUrl = (teamId: string) => {
    if (editUrl.trim()) {
      const validation = validateImageUrlInput(editUrl);
      if (!validation.isValid) {
        setUrlError(validation.errorMessage || 'URL de escudo inválida. Deve começar com https:// ou http://');
        return;
      }
    }
    if (onUpdateTeamLogo) {
      const cleanUrl = sanitizeImageUrl(editUrl) || '';
      onUpdateTeamLogo(teamId, cleanUrl);
    }
    setEditingTeamId(null);
    setUrlError(null);
  };

  const handleLeagueChange = (teamId: string, newLeagueId: string) => {
    if (newLeagueId === '__NEW_LEAGUE__') {
      onOpenEntityModal('league');
      return;
    }
    if (onUpdateTeamLeague) {
      onUpdateTeamLeague(teamId, newLeagueId);
      setSavedSuccessTeamId(teamId);
      setTimeout(() => {
        setSavedSuccessTeamId((current) => (current === teamId ? null : current));
      }, 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0e0e0e] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Times de Futebol Cadastrados
          </h3>
          <p className="text-xs text-gray-400">
            Gerencie equipes, vincule ligas diretamente na tabela e adicione escudos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar time, país, liga ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-56"
            />
          </div>

          {/* Filter by Country */}
          {dbState.countries.length > 0 && (
            <select
              value={selectedCountryFilter}
              onChange={(e) => {
                setSelectedCountryFilter(e.target.value);
                setSelectedLeagueFilter('');
              }}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Todos os Países</option>
              {dbState.countries.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Filter by League */}
          {dbState.leagues.length > 0 && (
            <select
              value={selectedLeagueFilter}
              onChange={(e) => setSelectedLeagueFilter(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Todas as Ligas</option>
              {dbState.leagues
                .filter(l => !selectedCountryFilter || l.countryId === selectedCountryFilter)
                .map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
          )}

          {/* Toggle only without logo */}
          <button
            onClick={() => setOnlyWithoutLogo(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              onlyWithoutLogo
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-[#1a1a1a] text-gray-300 hover:text-white border-white/10'
            }`}
            title="Exibir apenas clubes sem URL de escudo"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Sem Escudo</span>
          </button>

          {/* Export Teams to Excel (.xlsx) */}
          {isMaster && (
            <button
              onClick={handleExportTeams}
              disabled={isExporting || dbState.teams.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] cursor-pointer"
              title="Baixar planilha Excel (.xlsx) com todos os times, países e ligas cadastrados"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-emerald-100" />
              )}
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="px-1.5 py-0.2 bg-emerald-800 text-emerald-100 text-[10px] font-bold rounded-md ml-0.5">
                {teams.length}
              </span>
            </button>
          )}

          {isMaster && onOpenBulkImportModal && (
            <button
              onClick={onOpenBulkImportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 transition-all hover:scale-[1.02]"
              title="Importar lista de equipes em massa via arquivo Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Importar Excel</span>
            </button>
          )}

          {isMaster && (
            <button
              onClick={() => onOpenEntityModal('team')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Novo Time
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {teams.length === 0 ? (
        <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-8 text-center text-gray-400">
          Nenhum time encontrado para os filtros selecionados. Cadastre um novo time ou ajuste a busca!
        </div>
      ) : (
        <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#080808] text-gray-400 uppercase font-bold text-[10px] border-b border-white/10 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Escudo</th>
                  <th className="py-3 px-4">ID Único</th>
                  <th className="py-3 px-4">Nome do Time</th>
                  <th className="py-3 px-4">País (ID)</th>
                  <th className="py-3 px-4">Liga Vinculada (Vincular Direto)</th>
                  <th className="py-3 px-4">Jogos (M/V)</th>
                  {isMaster && <th className="py-3 px-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {teams.map(t => {
                  const homeCount = dbState.matches.filter(m => m.homeTeamId === t.id).length;
                  const awayCount = dbState.matches.filter(m => m.awayTeamId === t.id).length;
                  const totalMatches = homeCount + awayCount;
                  const isEditing = editingTeamId === t.id;
                  const isJustSaved = savedSuccessTeamId === t.id;
                  const hasLogo = isValidImageUrl(t.logoUrl);
                  const isBroken = brokenImages[t.id];

                  // Find current linked league object
                  const linkedLeague = t.leagueId
                    ? dbState.leagues.find(l => l.id === t.leagueId)
                    : undefined;

                  const countryLeagues = dbState.leagues.filter(l => l.countryId === t.countryId);
                  const otherLeagues = dbState.leagues.filter(l => l.countryId !== t.countryId);

                  return (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Escudo */}
                      <td className="py-3 px-4">
                        {hasLogo && !isBroken ? (
                          <img
                            src={t.logoUrl}
                            alt={t.name}
                            className="w-7 h-7 object-contain rounded bg-black/40 border border-white/10 p-0.5 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => handleStartEdit(t.id, t.logoUrl)}
                            title="Clique para editar a URL do escudo"
                            onError={() => {
                              setBrokenImages(prev => ({ ...prev, [t.id]: true }));
                            }}
                          />
                        ) : isBroken ? (
                          <button
                            onClick={() => handleStartEdit(t.id, t.logoUrl)}
                            className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-400 text-[10px] font-bold flex items-center gap-1 hover:bg-red-900 transition-colors"
                            title="URL de imagem corrompida ou inacessível. Clique para corrigir."
                          >
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            <span>Quebrado</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(t.id, '')}
                            className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 hover:bg-amber-900 transition-colors"
                            title="Time sem escudo cadastrado. Clique para adicionar."
                          >
                            <span>🛡️</span>
                            <span>Sem Escudo</span>
                          </button>
                        )}
                      </td>

                      {/* ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                          {t.id}
                        </span>
                      </td>

                      {/* Nome do Time */}
                      <td className="py-3 px-4 font-bold text-white text-sm">
                        {t.name}
                      </td>

                      {/* País */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-gray-200">
                          <Globe className="w-3 h-3 text-gray-400" />
                          <span>{t.countryName}</span>
                          <span className="font-mono text-[10px] text-emerald-400 font-bold bg-[#060606] px-1 py-0.2 rounded border border-white/10">
                            {t.countryId}
                          </span>
                        </div>
                      </td>

                      {/* LIGA VINCULADA COM VINCULAÇÃO DIRETA */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 min-w-[200px]">
                          {linkedLeague?.logoUrl ? (
                            <img
                              src={linkedLeague.logoUrl}
                              alt={linkedLeague.name}
                              className="w-4 h-4 object-contain shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Trophy
                              className={`w-3.5 h-3.5 shrink-0 ${
                                t.leagueId ? 'text-amber-400' : 'text-gray-500'
                              }`}
                            />
                          )}

                          <div className="relative flex-1">
                            <select
                              value={t.leagueId || ''}
                              onChange={(e) => handleLeagueChange(t.id, e.target.value)}
                              className={`w-full text-xs rounded-lg px-2.5 py-1.5 appearance-none focus:outline-none transition-all cursor-pointer font-medium pr-7 ${
                                isJustSaved
                                  ? 'bg-emerald-950 border border-emerald-400 text-emerald-300 ring-1 ring-emerald-400 shadow-md shadow-emerald-500/20'
                                  : t.leagueId
                                  ? 'bg-[#151515] hover:bg-[#1f1f1f] border border-amber-500/30 hover:border-amber-400 text-amber-200 shadow-xs'
                                  : 'bg-[#141414] hover:bg-[#1c1c1c] border border-dashed border-gray-600 hover:border-emerald-500 text-gray-400 hover:text-emerald-300'
                              }`}
                              title="Clique para vincular ou trocar a liga diretamente"
                            >
                              <option value="" className="bg-[#121212] text-gray-400">
                                -- Sem Liga Vinculada --
                              </option>

                              {countryLeagues.length > 0 && (
                                <optgroup
                                  label={`Ligas de ${t.countryName}`}
                                  className="bg-[#121212] text-emerald-400 font-bold"
                                >
                                  {countryLeagues.map(l => (
                                    <option
                                      key={l.id}
                                      value={l.id}
                                      className="bg-[#1a1a1a] text-white font-normal"
                                    >
                                      🏆 {l.name} [{l.id}]
                                    </option>
                                  ))}
                                </optgroup>
                              )}

                              {otherLeagues.length > 0 && (
                                <optgroup
                                  label="Outras Ligas Cadastradas"
                                  className="bg-[#121212] text-gray-400 font-bold"
                                >
                                  {otherLeagues.map(l => (
                                    <option
                                      key={l.id}
                                      value={l.id}
                                      className="bg-[#1a1a1a] text-gray-300 font-normal"
                                    >
                                      🏆 {l.name} ({l.countryName}) [{l.id}]
                                    </option>
                                  ))}
                                </optgroup>
                              )}

                              <option
                                value="__NEW_LEAGUE__"
                                className="bg-[#162a1a] text-emerald-300 font-bold"
                              >
                                + Cadastrar Nova Liga...
                              </option>
                            </select>

                            {/* Dropdown Indicator or Saved Checkmark */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                              {isJustSaved ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse stroke-[3]" />
                              ) : (
                                <span className="text-[9px] text-gray-400 opacity-60">▼</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Jogos */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold">
                          {totalMatches} jogos ({homeCount}M / {awayCount}V)
                        </span>
                      </td>

                      {/* Ações */}
                      {isMaster && (
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center justify-end gap-1.5">
                                {editUrl.trim() && isValidImageUrl(editUrl.trim()) && (
                                  <div className="w-7 h-7 bg-[#121212] border border-emerald-500/50 rounded flex items-center justify-center overflow-hidden shrink-0 shadow-sm" title="Pré-visualização da imagem">
                                    <img
                                      src={editUrl.trim()}
                                      alt="Preview"
                                      className="w-full h-full object-contain p-0.5"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                <input
                                  type="url"
                                  placeholder="https://..."
                                  value={editUrl}
                                  onChange={(e) => {
                                    setEditUrl(e.target.value);
                                    if (urlError) setUrlError(null);
                                  }}
                                  className={`bg-[#1a1a1a] border rounded px-2 py-1 text-xs text-white focus:outline-none w-48 font-mono ${
                                    urlError ? 'border-rose-500' : 'border-emerald-500/50'
                                  }`}
                                />
                                <button
                                  onClick={() => handleSaveUrl(t.id)}
                                  className="p-1 bg-emerald-500 text-black rounded hover:bg-emerald-400"
                                  title="Salvar Escudo"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingTeamId(null);
                                    setUrlError(null);
                                  }}
                                  className="p-1 bg-white/10 text-gray-300 rounded hover:bg-white/20"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {urlError && (
                                <span className="text-[10px] text-rose-400 flex items-center gap-1 font-sans">
                                  <AlertCircle className="w-3 h-3" /> {urlError}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {onEditTeam && (
                                <button
                                  onClick={() => onEditTeam(t)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 text-[11px] transition-colors"
                                  title="Editar Time Completo"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Editar</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleStartEdit(t.id, t.logoUrl)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 transition-colors border border-white/5 flex items-center gap-1 text-[11px]"
                                title="Editar Escudo do Time"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Escudo</span>
                              </button>
                              <button
                                onClick={() => {
                                  const homeMatches = dbState.matches.filter(m => m.homeTeamId === t.id).length;
                                  const awayMatches = dbState.matches.filter(m => m.awayTeamId === t.id).length;
                                  const total = homeMatches + awayMatches;
                                  let msg = `Excluir o time "${t.name}" (${t.id})?`;
                                  if (total > 0) {
                                    msg += `\n\nAtenção: Isso também excluirá ${total} jogo(s) em que este time participa!`;
                                  }
                                  if (confirm(msg)) {
                                    onDeleteTeam(t.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors border border-white/5"
                                title="Excluir Time"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


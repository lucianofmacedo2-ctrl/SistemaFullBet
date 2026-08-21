import React, { useState, useMemo } from 'react';
import { Trophy, Plus, Search, Trash2, Globe, Link2, Check, X, Edit2, AlertCircle } from 'lucide-react';
import { DbState, League } from '../types';
import { isValidImageUrl, validateImageUrlInput, sanitizeImageUrl } from '../utils/imageHelper';

interface LeagueManagerProps {
  dbState: DbState;
  isMaster?: boolean;
  onOpenEntityModal: (type?: 'country' | 'league' | 'team') => void;
  onDeleteLeague: (id: string) => void;
  onUpdateLeagueLogo?: (leagueId: string, logoUrl: string) => void;
  onEditLeague?: (league: League) => void;
}

export const LeagueManager: React.FC<LeagueManagerProps> = ({
  dbState,
  isMaster = false,
  onOpenEntityModal,
  onDeleteLeague,
  onUpdateLeagueLogo,
  onEditLeague,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Ordenação prioritária por ordem alfabética de País (countryName), com desempate por Nome da Liga (name)
  const leagues = useMemo(() => {
    return [...dbState.leagues]
      .sort((a, b) => {
        const countryA = a.countryName || '';
        const countryB = b.countryName || '';
        const countryComp = countryA.localeCompare(countryB, 'pt-BR', { sensitivity: 'base' });
        if (countryComp !== 0) return countryComp;
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
      })
      .filter(l =>
        l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.countryName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [dbState.leagues, searchTerm]);

  const handleStartEdit = (leagueId: string, currentUrl?: string) => {
    setEditingLeagueId(leagueId);
    setEditUrl(currentUrl || '');
    setUrlError(null);
  };

  const handleSaveUrl = (leagueId: string) => {
    if (editUrl.trim()) {
      const validation = validateImageUrlInput(editUrl);
      if (!validation.isValid) {
        setUrlError(validation.errorMessage || 'URL de logo inválida. Deve começar com https:// ou http://');
        return;
      }
    }
    if (onUpdateLeagueLogo) {
      const cleaned = sanitizeImageUrl(editUrl) || '';
      onUpdateLeagueLogo(leagueId, cleaned);
    }
    setEditingLeagueId(null);
    setUrlError(null);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e0e0e] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            Ligas / Campeonatos Cadastrados
          </h3>
          <p className="text-xs text-gray-400">
            Adicione o logo de cada liga para visualizá-lo nos cards de partidas e estatísticas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar liga, país ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {isMaster && (
            <button
              onClick={() => onOpenEntityModal('league')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Nova Liga
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {leagues.length === 0 ? (
        <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-8 text-center text-gray-400">
          Nenhuma liga cadastrada ainda. Cadastre a primeira liga ou crie-a diretamente ao registrar um jogo!
        </div>
      ) : (
        <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#080808] text-gray-400 uppercase font-bold text-[10px] border-b border-white/10 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Logo</th>
                  <th className="py-3 px-4">ID Único</th>
                  <th className="py-3 px-4">Nome da Liga</th>
                  <th className="py-3 px-4">País (ID)</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Partidas</th>
                  {isMaster && <th className="py-3 px-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {leagues.map(l => {
                  const matchesCount = dbState.matches.filter(m => m.leagueId === l.id).length;
                  const isEditing = editingLeagueId === l.id;

                  return (
                    <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        {isValidImageUrl(l.logoUrl) ? (
                          <img
                            src={l.logoUrl}
                            alt={l.name}
                            className="w-7 h-7 object-contain rounded bg-black/40 border border-white/10 p-0.5 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs text-emerald-400">
                            🏆
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                          {l.id}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white text-sm">
                        {l.name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-gray-200">
                          <Globe className="w-3 h-3 text-gray-400" />
                          <span>{l.countryName}</span>
                          <span className="font-mono text-[10px] text-emerald-400 font-bold bg-[#060606] px-1 py-0.2 rounded border border-white/10">
                            {l.countryId}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {l.type || 'Pontos Corridos'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold">
                          {matchesCount} partidas
                        </span>
                      </td>
                      {isMaster && (
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center justify-end gap-1.5">
                                {editUrl.trim() && isValidImageUrl(editUrl.trim()) && (
                                  <div className="w-7 h-7 bg-[#121212] border border-emerald-500/50 rounded flex items-center justify-center overflow-hidden shrink-0 shadow-sm" title="Pré-visualização do logo">
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
                                  onClick={() => handleSaveUrl(l.id)}
                                  className="p-1 bg-emerald-500 text-black rounded hover:bg-emerald-400"
                                  title="Salvar Logo"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingLeagueId(null);
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
                              {onEditLeague && (
                                <button
                                  onClick={() => onEditLeague(l)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 text-[11px] transition-colors"
                                  title="Editar Liga Completa"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Editar</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleStartEdit(l.id, l.logoUrl)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 transition-colors border border-white/5 flex items-center gap-1 text-[11px]"
                                title="Editar Logo da Liga"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Logo</span>
                              </button>
                              <button
                                onClick={() => {
                                  const matches = dbState.matches.filter(m => m.leagueId === l.id).length;
                                  let msg = `Excluir a liga "${l.name}" (${l.id})?`;
                                  if (matches > 0) {
                                    msg += `\n\nAtenção: Isso também excluirá ${matches} jogo(s) vinculados a esta liga!`;
                                  }
                                  if (confirm(msg)) {
                                    onDeleteLeague(l.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors border border-white/5"
                                title="Excluir Liga"
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


import React, { useState } from 'react';
import { Globe, Plus, Search, Trash2, Link2, Check, X, Edit2, AlertCircle } from 'lucide-react';
import { DbState, Country } from '../types';
import { isValidImageUrl, validateImageUrlInput, sanitizeImageUrl } from '../utils/imageHelper';

interface CountryManagerProps {
  dbState: DbState;
  isMaster?: boolean;
  onOpenEntityModal: (type?: 'country' | 'league' | 'team') => void;
  onDeleteCountry: (id: string) => void;
  onUpdateCountryFlag?: (countryId: string, flagUrl: string) => void;
  onEditCountry?: (country: Country) => void;
}

export const CountryManager: React.FC<CountryManagerProps> = ({
  dbState,
  isMaster = true,
  onOpenEntityModal,
  onDeleteCountry,
  onUpdateCountryFlag,
  onEditCountry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCountryId, setEditingCountryId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const countries = dbState.countries.filter(c =>
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEdit = (countryId: string, currentUrl?: string) => {
    setEditingCountryId(countryId);
    setEditUrl(currentUrl || '');
    setUrlError(null);
  };

  const handleSaveUrl = (countryId: string) => {
    if (editUrl.trim()) {
      const validation = validateImageUrlInput(editUrl);
      if (!validation.isValid) {
        setUrlError(validation.errorMessage || 'URL de imagem inválida. Deve começar com https:// ou http://');
        return;
      }
    }
    if (onUpdateCountryFlag) {
      const cleaned = sanitizeImageUrl(editUrl) || '';
      onUpdateCountryFlag(countryId, cleaned);
    }
    setEditingCountryId(null);
    setUrlError(null);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e0e0e] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Países Cadastrados no Banco
          </h3>
          <p className="text-xs text-gray-400">
            Você pode cadastrar o link da bandeira de cada país para exibição no sistema.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar país ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {isMaster && (
            <button
              onClick={() => onOpenEntityModal('country')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Novo País
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {countries.length === 0 ? (
        <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-8 text-center text-gray-400">
          Nenhum país cadastrado ainda. Cadastre o primeiro país ou registre um jogo diretamente!
        </div>
      ) : (
        <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#080808] text-gray-400 uppercase font-bold text-[10px] border-b border-white/10 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Bandeira</th>
                  <th className="py-3 px-4">ID Único</th>
                  <th className="py-3 px-4">Nome do País</th>
                  <th className="py-3 px-4">Sigla / Código</th>
                  <th className="py-3 px-4">Ligas</th>
                  <th className="py-3 px-4">Jogos</th>
                  {isMaster && <th className="py-3 px-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {countries.map(c => {
                  const leaguesCount = dbState.leagues.filter(l => l.countryId === c.id).length;
                  const matchesCount = dbState.matches.filter(m => m.countryId === c.id).length;
                  const isEditing = editingCountryId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        {isValidImageUrl(c.flagUrl) ? (
                          <img
                            src={c.flagUrl}
                            alt={c.name}
                            className="w-7 h-5 object-cover rounded border border-white/10 bg-black/40 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-7 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-gray-500">
                            🌐
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                          {c.id}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white text-sm">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {c.code || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold">
                          {leaguesCount} ligas
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold">
                          {matchesCount} jogos
                        </span>
                      </td>
                      {isMaster && (
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center justify-end gap-1.5">
                                {editUrl.trim() && isValidImageUrl(editUrl.trim()) && (
                                  <div className="w-7 h-5 bg-[#121212] border border-emerald-500/50 rounded flex items-center justify-center overflow-hidden shrink-0 shadow-sm" title="Pré-visualização da bandeira">
                                    <img
                                      src={editUrl.trim()}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
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
                                  onClick={() => handleSaveUrl(c.id)}
                                  className="p-1 bg-emerald-500 text-black rounded hover:bg-emerald-400"
                                  title="Salvar Bandeira"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCountryId(null);
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
                              {onEditCountry && (
                                <button
                                  onClick={() => onEditCountry(c)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 text-[11px] transition-colors"
                                  title="Editar País Completo"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Editar</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleStartEdit(c.id, c.flagUrl)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 transition-colors border border-white/5 flex items-center gap-1 text-[11px]"
                                title="Editar URL da Bandeira"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Bandeira</span>
                              </button>
                              <button
                                onClick={() => {
                                  const leagues = dbState.leagues.filter(l => l.countryId === c.id).length;
                                  const matches = dbState.matches.filter(m => m.countryId === c.id).length;
                                  let msg = `Excluir o país "${c.name}" (${c.id})?`;
                                  if (leagues > 0 || matches > 0) {
                                    msg += `\n\nAtenção: Isso também excluirá ${leagues} liga(s) e ${matches} jogo(s) vinculados a este país!`;
                                  }
                                  if (confirm(msg)) {
                                    onDeleteCountry(c.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors border border-white/5"
                                title="Excluir País"
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

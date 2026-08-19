import React, { useState } from 'react';
import {
  Image,
  Shield,
  Trophy,
  Globe,
  Search,
  ExternalLink,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  Filter
} from 'lucide-react';
import { DbState, Team, League, Country } from '../types';

interface PendingLogosManagerProps {
  dbState: DbState;
  onUpdateTeamLogo: (teamId: string, logoUrl: string) => void;
  onUpdateLeagueLogo: (leagueId: string, logoUrl: string) => void;
  onUpdateCountryFlag: (countryId: string, flagUrl: string) => void;
}

export const PendingLogosManager: React.FC<PendingLogosManagerProps> = ({
  dbState,
  onUpdateTeamLogo,
  onUpdateLeagueLogo,
  onUpdateCountryFlag,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'teams' | 'leagues' | 'countries'>('teams');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState('');

  // Local state for URL inputs per item { [id]: urlString }
  const [inputUrls, setInputUrls] = useState<Record<string, string>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  // Filter items that DO NOT have a valid logo/flag URL
  const pendingTeams = dbState.teams.filter(t => !t.logoUrl || !t.logoUrl.trim());
  const pendingLeagues = dbState.leagues.filter(l => !l.logoUrl || !l.logoUrl.trim());
  const pendingCountries = dbState.countries.filter(c => !c.flagUrl || !c.flagUrl.trim());

  // Filtered lists based on search and country/league filters
  const filteredTeams = pendingTeams.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.leagueName && t.leagueName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCountry = !selectedCountryFilter || t.countryId === selectedCountryFilter;
    const matchesLeague =
      !selectedLeagueFilter ||
      t.leagueId === selectedLeagueFilter ||
      (t.leagueIds && t.leagueIds.includes(selectedLeagueFilter));

    return matchesSearch && matchesCountry && matchesLeague;
  });

  const filteredLeagues = pendingLeagues.filter(l => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.countryName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCountry = !selectedCountryFilter || l.countryId === selectedCountryFilter;
    return matchesSearch && matchesCountry;
  });

  const filteredCountries = pendingCountries.filter(c => {
    return (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleUrlChange = (id: string, url: string) => {
    setInputUrls(prev => ({ ...prev, [id]: url }));
  };

  const handleSaveTeamLogo = (teamId: string) => {
    const url = inputUrls[teamId]?.trim();
    if (!url) return;

    onUpdateTeamLogo(teamId, url);
    setSavedStatus(prev => ({ ...prev, [teamId]: true }));
    setTimeout(() => {
      setSavedStatus(prev => ({ ...prev, [teamId]: false }));
    }, 1500);
  };

  const handleSaveLeagueLogo = (leagueId: string) => {
    const url = inputUrls[leagueId]?.trim();
    if (!url) return;

    onUpdateLeagueLogo(leagueId, url);
    setSavedStatus(prev => ({ ...prev, [leagueId]: true }));
    setTimeout(() => {
      setSavedStatus(prev => ({ ...prev, [leagueId]: false }));
    }, 1500);
  };

  const handleSaveCountryFlag = (countryId: string) => {
    const url = inputUrls[countryId]?.trim();
    if (!url) return;

    onUpdateCountryFlag(countryId, url);
    setSavedStatus(prev => ({ ...prev, [countryId]: true }));
    setTimeout(() => {
      setSavedStatus(prev => ({ ...prev, [countryId]: false }));
    }, 1500);
  };

  const getGoogleSearchUrl = (query: string) => {
    return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query + ' logo png')}`;
  };

  const totalPending = pendingTeams.length + pendingLeagues.length + pendingCountries.length;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 border border-blue-700/40 rounded-2xl p-5 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
                <Image className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold">Central de Escudos & Bandeiras Pendentes</h2>
              {totalPending > 0 && (
                <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 text-xs font-black rounded-full shadow-sm animate-pulse">
                  {totalPending} pendentes
                </span>
              )}
            </div>
            <p className="text-xs text-blue-200/80 max-w-2xl">
              Insira as URLs dos escudos de clubes, ligas e bandeiras de países que ainda não possuem imagens cadastradas. Conforme você salva, os itens saem automaticamente desta lista.
            </p>
          </div>

          {/* Quick Counter Chips */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('teams')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'teams'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-blue-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Clubes ({pendingTeams.length})
            </button>

            <button
              onClick={() => setActiveSubTab('leagues')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'leagues'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-blue-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Ligas ({pendingLeagues.length})
            </button>

            <button
              onClick={() => setActiveSubTab('countries')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'countries'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-blue-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Países ({pendingCountries.length})
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Buscar ${activeSubTab === 'teams' ? 'clube' : activeSubTab === 'leagues' ? 'liga' : 'país'} pendente...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          {activeSubTab === 'teams' && dbState.countries.length > 0 && (
            <select
              value={selectedCountryFilter}
              onChange={(e) => setSelectedCountryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Países</option>
              {dbState.countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {activeSubTab === 'teams' && dbState.leagues.length > 0 && (
            <select
              value={selectedLeagueFilter}
              onChange={(e) => setSelectedLeagueFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Ligas</option>
              {dbState.leagues.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.countryName})</option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
          Exibindo{' '}
          <strong className="text-slate-900 font-bold">
            {activeSubTab === 'teams' ? filteredTeams.length : activeSubTab === 'leagues' ? filteredLeagues.length : filteredCountries.length}
          </strong>{' '}
          item(s) sem URL
        </div>
      </div>

      {/* Main Content: Teams SubTab */}
      {activeSubTab === 'teams' && (
        <>
          {filteredTeams.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {searchTerm || selectedCountryFilter || selectedLeagueFilter
                  ? 'Nenhum clube pendente encontrado para os filtros selecionados.'
                  : 'Excelente! Todos os clubes cadastrados possuem escudo.'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Todos os times do sistema já possuem URLs de escudo associadas. Novos times adicionados via sincronização aparecerão aqui automaticamente se estiverem sem escudo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTeams.map(team => {
                const currentInput = inputUrls[team.id] || '';
                const isSaved = savedStatus[team.id];

                return (
                  <div
                    key={team.id}
                    className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Escudo Preview ou Placeholder */}
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative group">
                          {currentInput.trim() ? (
                            <img
                              src={currentInput.trim()}
                              alt={team.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Shield className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900 truncate" title={team.name}>
                              {team.name}
                            </h4>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {team.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {team.leagueName ? `${team.leagueName} • ` : ''}{team.countryName}
                          </p>
                        </div>
                      </div>

                      {/* Botão de Busca no Google Imagens */}
                      <a
                        href={getGoogleSearchUrl(`${team.name} ${team.countryName}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition-colors shrink-0"
                        title="Buscar escudo deste time no Google Imagens"
                      >
                        <Search className="w-3 h-3 text-blue-600" />
                        <span className="hidden sm:inline">Google</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </div>

                    {/* Input de URL e Botão Salvar */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="url"
                          placeholder="Cole a URL do escudo (ex: https://.../escudo.png)"
                          value={currentInput}
                          onChange={(e) => handleUrlChange(team.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveTeamLogo(team.id);
                            }
                          }}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                        />
                      </div>

                      <button
                        onClick={() => handleSaveTeamLogo(team.id)}
                        disabled={!currentInput.trim()}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm ${
                          isSaved
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Salvo!
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Salvar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SubTab: Leagues */}
      {activeSubTab === 'leagues' && (
        <>
          {filteredLeagues.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {searchTerm || selectedCountryFilter
                  ? 'Nenhuma liga pendente encontrada.'
                  : 'Excelente! Todas as ligas cadastradas possuem logo.'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Todas as ligas do sistema já possuem imagem associada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredLeagues.map(league => {
                const currentInput = inputUrls[league.id] || '';
                const isSaved = savedStatus[league.id];

                return (
                  <div
                    key={league.id}
                    className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {currentInput.trim() ? (
                            <img
                              src={currentInput.trim()}
                              alt={league.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Trophy className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {league.name}
                            </h4>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {league.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{league.countryName}</p>
                        </div>
                      </div>

                      <a
                        href={getGoogleSearchUrl(`${league.name} ${league.countryName} logo`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition-colors shrink-0"
                      >
                        <Search className="w-3 h-3 text-blue-600" />
                        <span className="hidden sm:inline">Google</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="url"
                          placeholder="Cole a URL do logo da liga..."
                          value={currentInput}
                          onChange={(e) => handleUrlChange(league.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveLeagueLogo(league.id);
                            }
                          }}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                        />
                      </div>

                      <button
                        onClick={() => handleSaveLeagueLogo(league.id)}
                        disabled={!currentInput.trim()}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm ${
                          isSaved
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Salvo!
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Salvar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SubTab: Countries */}
      {activeSubTab === 'countries' && (
        <>
          {filteredCountries.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {searchTerm
                  ? 'Nenhum país pendente encontrado.'
                  : 'Excelente! Todos os países cadastrados possuem bandeira.'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Todos os países cadastrados já possuem URLs de bandeira associadas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCountries.map(country => {
                const currentInput = inputUrls[country.id] || '';
                const isSaved = savedStatus[country.id];

                return (
                  <div
                    key={country.id}
                    className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {currentInput.trim() ? (
                            <img
                              src={currentInput.trim()}
                              alt={country.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Globe className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {country.name}
                            </h4>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {country.id}
                            </span>
                            {country.code && (
                              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                                {country.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <a
                        href={getGoogleSearchUrl(`${country.name} flag png icon`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition-colors shrink-0"
                      >
                        <Search className="w-3 h-3 text-blue-600" />
                        <span className="hidden sm:inline">Google</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="url"
                          placeholder="Cole a URL da bandeira..."
                          value={currentInput}
                          onChange={(e) => handleUrlChange(country.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveCountryFlag(country.id);
                            }
                          }}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                        />
                      </div>

                      <button
                        onClick={() => handleSaveCountryFlag(country.id)}
                        disabled={!currentInput.trim()}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm ${
                          isSaved
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Salvo!
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Salvar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

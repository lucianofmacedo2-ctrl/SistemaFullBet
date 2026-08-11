import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Trophy,
  Globe,
  Edit2,
  Trash2,
  Plus,
  Hash,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Activity,
  Target,
  Flag,
  Disc,
  Sparkles
} from 'lucide-react';
import { DbState, Match, MatchStatus } from '../types';

interface MatchListProps {
  dbState: DbState;
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenMatchModal: () => void;
  onOpenStatsModal: (match: Match) => void;
}

export const MatchList: React.FC<MatchListProps> = ({
  dbState,
  onEditMatch,
  onDeleteMatch,
  onOpenMatchModal,
  onOpenStatsModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountryId, setFilterCountryId] = useState('');
  const [filterLeagueId, setFilterLeagueId] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [expandedStatsMatchId, setExpandedStatsMatchId] = useState<string | null>(null);

  const matches = dbState.matches;

  // Counts
  const totalMatches = matches.length;
  const agendadosCount = matches.filter(m => m.status === 'AGENDADO').length;
  const finalizadosCount = matches.filter(m => m.status === 'FINALIZADO').length;
  const emAndamentoCount = matches.filter(m => m.status === 'EM_ANDAMENTO').length;

  // Filter logic
  const filteredMatches = matches.filter(match => {
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      match.id.toLowerCase().includes(searchLower) ||
      match.homeTeamName.toLowerCase().includes(searchLower) ||
      match.awayTeamName.toLowerCase().includes(searchLower) ||
      match.leagueName.toLowerCase().includes(searchLower) ||
      match.countryName.toLowerCase().includes(searchLower) ||
      match.homeTeamId.toLowerCase().includes(searchLower) ||
      match.awayTeamId.toLowerCase().includes(searchLower) ||
      (match.stadium && match.stadium.toLowerCase().includes(searchLower));

    const matchesCountry = filterCountryId ? match.countryId === filterCountryId : true;
    const matchesLeague = filterLeagueId ? match.leagueId === filterLeagueId : true;
    const matchesStatus = filterStatus ? match.status === filterStatus : true;

    return matchesSearch && matchesCountry && matchesLeague && matchesStatus;
  });

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'FINALIZADO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Finalizado
          </span>
        );
      case 'EM_ANDAMENTO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
            <Clock className="w-3 h-3" />
            Em Andamento
          </span>
        );
      case 'AGENDADO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Agendado
          </span>
        );
      case 'ADIADO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Adiado
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Controls */}
      <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por time, liga, estádio ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Country Filter */}
          <div>
            <select
              value={filterCountryId}
              onChange={(e) => setFilterCountryId(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Todos os Países ({dbState.countries.length})</option>
              {dbState.countries.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.id}] {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* League Filter */}
          <div>
            <select
              value={filterLeagueId}
              onChange={(e) => setFilterLeagueId(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Todas as Ligas ({dbState.leagues.length})</option>
              {dbState.leagues.map(l => (
                <option key={l.id} value={l.id}>
                  [{l.id}] {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Todos os Status</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="AGENDADO">Agendado</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="ADIADO">Adiado</option>
            </select>
          </div>
        </div>

        {/* Counter Results info */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-white/10">
          <span>
            Exibindo <strong className="text-emerald-400">{filteredMatches.length}</strong> de <strong className="text-white">{matches.length}</strong> partidas cadastradas.
          </span>

          {(searchTerm || filterCountryId || filterLeagueId || filterStatus) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCountryId('');
                setFilterLeagueId('');
                setFilterStatus('');
              }}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Quick Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filterStatus === ''
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10'
              : 'bg-[#0e0e0e] border border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <span>Todos os Jogos</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-black/20 font-mono">
            {totalMatches}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('AGENDADO')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filterStatus === 'AGENDADO'
              ? 'bg-blue-500 text-black shadow-lg shadow-blue-500/10'
              : 'bg-[#0e0e0e] border border-white/10 text-blue-400 hover:text-blue-300'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Jogos Futuros (Agendados)</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-black/20 font-mono">
            {agendadosCount}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('FINALIZADO')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filterStatus === 'FINALIZADO'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10'
              : 'bg-[#0e0e0e] border border-white/10 text-emerald-400 hover:text-emerald-300'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Finalizados</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-black/20 font-mono">
            {finalizadosCount}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('EM_ANDAMENTO')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filterStatus === 'EM_ANDAMENTO'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
              : 'bg-[#0e0e0e] border border-white/10 text-amber-400 hover:text-amber-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Ao Vivo</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-black/20 font-mono">
            {emAndamentoCount}
          </span>
        </button>
      </div>

      {/* Matches Grid / List */}
      {filteredMatches.length === 0 ? (
        <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-8 text-center text-gray-400">
          <p className="text-base font-semibold text-gray-300">Nenhuma partida encontrada para os filtros aplicados.</p>
          <button
            onClick={onOpenMatchModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-xs font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Cadastrar Nova Partida
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatches.map(match => {
            const isExpanded = expandedStatsMatchId === match.id;
            const hasStats = match.stats && (
              match.stats.possessionHome !== undefined ||
              match.stats.shotsHome !== undefined ||
              match.stats.scorersHome !== undefined ||
              match.stats.cornersHome !== undefined
            );

            return (
              <div
                key={match.id}
                className="bg-[#0e0e0e] border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                {(() => {
                  const country = dbState.countries.find(c => c.id === match.countryId || c.name.toLowerCase() === match.countryName.toLowerCase());
                  const flagUrl = match.countryFlagUrl || country?.flagUrl;

                  const league = dbState.leagues.find(l => l.id === match.leagueId || l.name.toLowerCase() === match.leagueName.toLowerCase());
                  const leagueLogoUrl = match.leagueLogoUrl || league?.logoUrl;

                  const homeTeam = dbState.teams.find(t => t.id === match.homeTeamId || t.name.toLowerCase() === match.homeTeamName.toLowerCase());
                  const homeLogoUrl = match.homeTeamLogoUrl || homeTeam?.logoUrl;

                  const awayTeam = dbState.teams.find(t => t.id === match.awayTeamId || t.name.toLowerCase() === match.awayTeamName.toLowerCase());
                  const awayLogoUrl = match.awayTeamLogoUrl || awayTeam?.logoUrl;

                  return (
                    <>
                      {/* Card Top: Match Unique ID + Country + League + Status */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Match ID */}
                          <span className="font-mono font-bold text-xs bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Hash className="w-3 h-3 text-emerald-500" />
                            {match.id}
                          </span>

                          {/* League + Country */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-300">
                            {leagueLogoUrl && (
                              <img
                                src={leagueLogoUrl}
                                alt={match.leagueName}
                                className="w-4 h-4 object-contain"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            )}
                            <span className="font-semibold text-white">{match.leagueName}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 flex items-center gap-1">
                              {flagUrl ? (
                                <img
                                  src={flagUrl}
                                  alt={match.countryName}
                                  className="w-4 h-3 object-cover rounded-sm border border-white/10"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              ) : (
                                <Globe className="w-3 h-3 text-gray-500" />
                              )}
                              {match.countryName}
                            </span>
                          </div>
                        </div>

                        <div>{getStatusBadge(match.status)}</div>
                      </div>

                      {/* Future Match Special Banner */}
                      {match.status === 'AGENDADO' && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-blue-300 font-medium">
                            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                            <span>Jogo Agendado • Aguardando Resultado</span>
                          </div>
                          <button
                            onClick={() => onOpenStatsModal(match)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-all shadow hover:scale-[1.02] shrink-0"
                          >
                            + Lançar Placar & Stats
                          </button>
                        </div>
                      )}

                      {/* Scoreboard Body */}
                      <div className="grid grid-cols-7 items-center gap-2 my-2">
                        {/* Home Team */}
                        <div className="col-span-3 flex items-center justify-end gap-2.5 text-right">
                          <div className="space-y-0.5 truncate">
                            <span className="font-bold text-white text-base sm:text-lg truncate block leading-tight">
                              {match.homeTeamName}
                            </span>
                            <div className="text-[10px] font-mono text-gray-500 flex items-center justify-end gap-1">
                              <span>ID:</span>
                              <span className="text-emerald-400 font-bold">{match.homeTeamId}</span>
                            </div>
                          </div>
                          {homeLogoUrl ? (
                            <img
                              src={homeLogoUrl}
                              alt={match.homeTeamName}
                              className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg bg-black/40 border border-white/10 p-1 shrink-0 shadow-sm"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs shrink-0">
                              🛡️
                            </div>
                          )}
                        </div>

                        {/* Score Pill */}
                        <div className="col-span-1 text-center flex flex-col items-center justify-center">
                          <div className="px-3 py-1.5 bg-[#060606] border border-white/10 text-white rounded-xl font-black text-lg sm:text-xl shadow-inner font-mono tracking-wider min-w-[68px]">
                            {match.homeScore !== null && match.awayScore !== null ? (
                              `${match.homeScore} - ${match.awayScore}`
                            ) : (
                              <span className="text-xs text-gray-500 font-sans uppercase">vs</span>
                            )}
                          </div>
                        </div>

                        {/* Away Team */}
                        <div className="col-span-3 flex items-center justify-start gap-2.5 text-left">
                          {awayLogoUrl ? (
                            <img
                              src={awayLogoUrl}
                              alt={match.awayTeamName}
                              className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg bg-black/40 border border-white/10 p-1 shrink-0 shadow-sm"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs shrink-0">
                              🛡️
                            </div>
                          )}
                          <div className="space-y-0.5 truncate">
                            <span className="font-bold text-white text-base sm:text-lg truncate block leading-tight">
                              {match.awayTeamName}
                            </span>
                            <div className="text-[10px] font-mono text-gray-500 flex items-center justify-start gap-1">
                              <span>ID:</span>
                              <span className="text-emerald-400 font-bold">{match.awayTeamId}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Goalscorers preview if available */}
                {(match.stats?.scorersHome || match.stats?.scorersAway) && (
                  <div className="bg-[#060606] p-2 rounded-xl border border-white/5 text-[11px] text-gray-400 space-y-1">
                    {match.stats?.scorersHome && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">⚽ {match.homeTeamName}:</span>
                        <span className="text-gray-300">{match.stats.scorersHome}</span>
                      </div>
                    )}
                    {match.stats?.scorersAway && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">⚽ {match.awayTeamName}:</span>
                        <span className="text-gray-300">{match.stats.scorersAway}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Expandable Match Stats Section */}
                {isExpanded && match.stats && (
                  <div className="bg-[#060606] p-3 rounded-xl border border-white/10 space-y-3 text-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-gray-400 font-bold text-[11px] uppercase border-b border-white/10 pb-1.5">
                      <span>Estatísticas da Partida</span>
                      {match.stats.halftimeHomeScore !== undefined && match.stats.halftimeHomeScore !== null && (
                        <span className="text-emerald-400 font-mono">
                          1º Tempo: {match.stats.halftimeHomeScore} - {match.stats.halftimeAwayScore}
                        </span>
                      )}
                    </div>

                    {/* Posse de bola bar */}
                    {match.stats.possessionHome !== undefined && match.stats.possessionHome !== null && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-300 font-medium">
                          <span>{match.stats.possessionHome}% Posse</span>
                          <span className="text-gray-500 font-bold">Posse de Bola</span>
                          <span>{match.stats.possessionAway}% Posse</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full transition-all"
                            style={{ width: `${match.stats.possessionHome}%` }}
                          />
                          <div
                            className="bg-blue-500 h-full transition-all"
                            style={{ width: `${match.stats.possessionAway}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stats metrics grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {match.stats.shotsHome !== undefined && match.stats.shotsHome !== null && (
                        <div className="flex justify-between bg-[#111111] p-1.5 rounded border border-white/5">
                          <span className="font-bold text-white">{match.stats.shotsHome}</span>
                          <span className="text-gray-400">Chutes Totais</span>
                          <span className="font-bold text-white">{match.stats.shotsAway}</span>
                        </div>
                      )}

                      {match.stats.shotsOnTargetHome !== undefined && match.stats.shotsOnTargetHome !== null && (
                        <div className="flex justify-between bg-[#111111] p-1.5 rounded border border-white/5">
                          <span className="font-bold text-emerald-400">{match.stats.shotsOnTargetHome}</span>
                          <span className="text-gray-400">No Gol</span>
                          <span className="font-bold text-emerald-400">{match.stats.shotsOnTargetAway}</span>
                        </div>
                      )}

                      {match.stats.cornersHome !== undefined && match.stats.cornersHome !== null && (
                        <div className="flex justify-between bg-[#111111] p-1.5 rounded border border-white/5">
                          <span className="font-bold text-white">{match.stats.cornersHome}</span>
                          <span className="text-gray-400">Escanteios</span>
                          <span className="font-bold text-white">{match.stats.cornersAway}</span>
                        </div>
                      )}

                      {match.stats.yellowCardsHome !== undefined && match.stats.yellowCardsHome !== null && (
                        <div className="flex justify-between bg-[#111111] p-1.5 rounded border border-white/5">
                          <span className="font-bold text-amber-400">{match.stats.yellowCardsHome}🟨</span>
                          <span className="text-gray-400">Amarelos</span>
                          <span className="font-bold text-amber-400">🟨{match.stats.yellowCardsAway}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Entity IDs Footer Banner */}
                <div className="bg-[#060606] p-2.5 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-3 text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="text-gray-500">País:</span>
                      <span className="text-emerald-400 font-bold">{match.countryId}</span>
                    </span>
                    <span className="text-gray-700">|</span>
                    <span className="flex items-center gap-1">
                      <span className="text-gray-500">Liga:</span>
                      <span className="text-emerald-400 font-bold">{match.leagueId}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-400 text-[11px] font-sans">
                    {match.round && <span>{match.round}</span>}
                    {match.stadium && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        {match.stadium}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date & Actions Bar */}
                <div className="flex items-center justify-between pt-2 text-xs text-gray-400 border-t border-white/10">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {formatDate(match.matchDate)}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Expand stats toggle if stats exist */}
                    {hasStats && (
                      <button
                        onClick={() => setExpandedStatsMatchId(isExpanded ? null : match.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 text-xs font-semibold flex items-center gap-1 border border-emerald-500/20"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Ocultar Stats' : 'Ver Stats'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}

                    {/* Stats modal launch button */}
                    <button
                      onClick={() => onOpenStatsModal(match)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 transition-all"
                      title="Lançar/Editar Placar & Estatísticas"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>{match.status === 'AGENDADO' ? 'Lançar Stats' : 'Estatísticas'}</span>
                    </button>

                    <button
                      onClick={() => onEditMatch(match)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/5"
                      title="Editar Partida"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o jogo ${match.id} (${match.homeTeamName} x ${match.awayTeamName})?`)) {
                          onDeleteMatch(match.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors border border-white/5"
                      title="Excluir Partida"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

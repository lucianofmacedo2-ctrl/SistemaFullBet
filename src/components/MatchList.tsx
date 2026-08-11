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
  Sparkles,
  TrendingUp,
  DollarSign,
  Zap
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
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2C3EC4]/20 text-white border border-[#2C3EC4]/40 flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-[#2C3EC4]" />
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
      <div className="bg-[#0f1325] border border-[#2C3EC4]/30 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por time, liga, estádio ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b0e1b] border border-[#2C3EC4]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#2C3EC4]"
            />
          </div>

          {/* Country Filter */}
          <div>
            <select
              value={filterCountryId}
              onChange={(e) => setFilterCountryId(e.target.value)}
              className="w-full bg-[#0b0e1b] border border-[#2C3EC4]/30 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#2C3EC4]"
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
              className="w-full bg-[#0b0e1b] border border-[#2C3EC4]/30 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#2C3EC4]"
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
              className="w-full bg-[#0b0e1b] border border-[#2C3EC4]/30 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#2C3EC4]"
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
        <div className="flex items-center justify-between text-xs text-gray-300 pt-1 border-t border-white/10 font-medium">
          <span>
            Exibindo <strong className="text-[#2C3EC4] font-bold">{filteredMatches.length}</strong> de <strong className="text-white">{matches.length}</strong> partidas cadastradas.
          </span>

          {(searchTerm || filterCountryId || filterLeagueId || filterStatus) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCountryId('');
                setFilterLeagueId('');
                setFilterStatus('');
              }}
              className="text-xs text-[#2C3EC4] hover:underline font-bold"
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
              ? 'bg-[#2C3EC4] text-white shadow-lg shadow-[#2C3EC4]/30 border border-white/20'
              : 'bg-[#0f1325] border border-white/10 text-gray-300 hover:text-white'
          }`}
        >
          <span>Todos os Jogos</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-black/30 font-mono text-white">
            {totalMatches}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('AGENDADO')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filterStatus === 'AGENDADO'
              ? 'bg-[#2C3EC4] text-white shadow-lg shadow-[#2C3EC4]/30 border border-white/20'
              : 'bg-[#0f1325] border border-white/10 text-gray-300 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-[#2C3EC4]" />
          <span>Jogos Futuros (Agendados)</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-black/30 font-mono text-white">
            {agendadosCount}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('FINALIZADO')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filterStatus === 'FINALIZADO'
              ? 'bg-[#2C3EC4] text-white shadow-lg shadow-[#2C3EC4]/30 border border-white/20'
              : 'bg-[#0f1325] border border-white/10 text-gray-300 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2C3EC4]" />
          <span>Finalizados</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-black/30 font-mono text-white">
            {finalizadosCount}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('EM_ANDAMENTO')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filterStatus === 'EM_ANDAMENTO'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
              : 'bg-[#0f1325] border border-white/10 text-amber-400 hover:text-amber-300'
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
        <div className="bg-[#0f1325] border border-[#2C3EC4]/30 rounded-2xl p-8 text-center text-gray-300">
          <p className="text-base font-semibold text-white">Nenhuma partida encontrada para os filtros aplicados.</p>
          <button
            onClick={onOpenMatchModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#2C3EC4] hover:bg-[#2231A8] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-[#2C3EC4]/30 border border-white/10"
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
                className="bg-[#0f1325] border border-[#2C3EC4]/25 hover:border-[#2C3EC4]/50 rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4 group"
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
                          <span className="font-mono font-bold text-xs bg-[#2C3EC4] text-white border border-white/20 px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                            <Hash className="w-3 h-3 text-white" />
                            {match.id}
                          </span>

                          {/* League + Country */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-200">
                            {leagueLogoUrl && (
                              <img
                                src={leagueLogoUrl}
                                alt={match.leagueName}
                                className="w-4 h-4 object-contain"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            )}
                            <span className="font-bold text-white">{match.leagueName}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-300 flex items-center gap-1 font-medium">
                              {flagUrl ? (
                                <img
                                  src={flagUrl}
                                  alt={match.countryName}
                                  className="w-4 h-3 object-cover rounded-sm border border-white/10"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              ) : (
                                <Globe className="w-3 h-3 text-gray-400" />
                              )}
                              {match.countryName}
                            </span>
                          </div>
                        </div>

                        <div>{getStatusBadge(match.status)}</div>
                      </div>

                      {/* Future Match Special Banner */}
                      {match.status === 'AGENDADO' && (
                        <div className="bg-[#2C3EC4]/15 border border-[#2C3EC4]/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-white font-medium">
                            <Calendar className="w-4 h-4 text-[#2C3EC4] shrink-0" />
                            <span>Jogo Agendado • Aguardando Resultado</span>
                          </div>
                          <button
                            onClick={() => onOpenStatsModal(match)}
                            className="px-3 py-1 bg-[#2C3EC4] hover:bg-[#2231A8] text-white text-xs font-bold rounded-lg transition-all shadow hover:scale-[1.02] shrink-0 border border-white/10"
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
                            <div className="text-[10px] font-mono text-gray-400 flex items-center justify-end gap-1 font-semibold">
                              <span>ID:</span>
                              <span className="text-white bg-[#2C3EC4]/40 px-1 rounded border border-[#2C3EC4]/50">{match.homeTeamId}</span>
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
                          <div className="px-3 py-1.5 bg-[#0b0e1b] border border-[#2C3EC4]/40 text-white rounded-xl font-black text-lg sm:text-xl shadow-md font-mono tracking-wider min-w-[68px]">
                            {match.homeScore !== null && match.awayScore !== null ? (
                              `${match.homeScore} - ${match.awayScore}`
                            ) : (
                              <span className="text-xs text-gray-400 font-sans uppercase">vs</span>
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
                            <div className="text-[10px] font-mono text-gray-400 flex items-center justify-start gap-1 font-semibold">
                              <span>ID:</span>
                              <span className="text-white bg-[#2C3EC4]/40 px-1 rounded border border-[#2C3EC4]/50">{match.awayTeamId}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Goalscorers preview if available */}
                {(match.stats?.scorersHome || match.stats?.scorersAway) && (
                  <div className="bg-[#0b0e1b] p-2 rounded-xl border border-white/10 text-[11px] text-gray-300 space-y-1">
                    {match.stats?.scorersHome && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#2C3EC4] font-bold">⚽ {match.homeTeamName}:</span>
                        <span className="text-white font-medium">{match.stats.scorersHome}</span>
                      </div>
                    )}
                    {match.stats?.scorersAway && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#2C3EC4] font-bold">⚽ {match.awayTeamName}:</span>
                        <span className="text-white font-medium">{match.stats.scorersAway}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Odds & Cotações Badge Strip */}
                {match.odds && (match.odds.homeFT != null || match.odds.drawFT != null || match.odds.awayFT != null || match.odds.over25FT != null || match.odds.under25FT != null || match.odds.bttsFT != null || match.odds.homeHT != null || match.odds.over05HT != null || match.odds.firstGoalHome?.minute != null || match.odds.firstGoalAway?.minute != null || match.odds.earlyGameGoal?.minute != null) && (
                  <div className="bg-[#0b0e1b] p-2.5 rounded-xl border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-300">
                      <span className="flex items-center gap-1 text-[#2C3EC4] uppercase tracking-wider font-extrabold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Odds / Cotações
                      </span>
                      {(match.odds.homeFT != null || match.odds.drawFT != null || match.odds.awayFT != null) && (
                        <span className="font-mono text-gray-200 text-[11px]">
                          1X2 FT: <span className="text-[#2C3EC4] font-bold">{match.odds.homeFT ?? '-'}</span> | <span className="text-amber-400 font-bold">{match.odds.drawFT ?? '-'}</span> | <span className="text-[#2C3EC4] font-bold">{match.odds.awayFT ?? '-'}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 text-[11px] font-mono">
                      {match.odds.over25FT != null && (
                        <div className="bg-[#12162a] p-1 rounded border border-white/10 flex justify-between">
                          <span className="text-gray-300 font-sans">Over 2,5 FT:</span>
                          <span className="text-[#2C3EC4] font-bold">{match.odds.over25FT}</span>
                        </div>
                      )}
                      {match.odds.under25FT != null && (
                        <div className="bg-[#12162a] p-1 rounded border border-white/10 flex justify-between">
                          <span className="text-gray-300 font-sans">Under 2,5 FT:</span>
                          <span className="text-[#2C3EC4] font-bold">{match.odds.under25FT}</span>
                        </div>
                      )}
                      {match.odds.bttsFT != null && (
                        <div className="bg-[#12162a] p-1 rounded border border-white/10 flex justify-between">
                          <span className="text-gray-300 font-sans">Ambos FT:</span>
                          <span className="text-[#2C3EC4] font-bold">{match.odds.bttsFT}</span>
                        </div>
                      )}
                      {match.odds.homeHT != null && (
                        <div className="bg-[#12162a] p-1 rounded border border-white/10 flex justify-between">
                          <span className="text-gray-300 font-sans">Mandante HT:</span>
                          <span className="text-[#2C3EC4] font-bold">{match.odds.homeHT}</span>
                        </div>
                      )}
                      {match.odds.drawHT != null && (
                        <div className="bg-[#12162a] p-1 rounded border border-white/10 flex justify-between">
                          <span className="text-gray-300 font-sans">Empate HT:</span>
                          <span className="text-amber-400 font-bold">{match.odds.drawHT}</span>
                        </div>
                      )}
                      {match.odds.awayHT != null && (
                        <div className="bg-[#12162a] p-1 rounded border border-white/10 flex justify-between">
                          <span className="text-gray-300 font-sans">Visitante HT:</span>
                          <span className="text-[#2C3EC4] font-bold">{match.odds.awayHT}</span>
                        </div>
                      )}
                      {match.odds.over05HT != null && (
                        <div className="bg-[#12162a] p-1 rounded border border-white/10 flex justify-between">
                          <span className="text-gray-300 font-sans">Over 0,5 HT:</span>
                          <span className="text-[#2C3EC4] font-bold">{match.odds.over05HT}</span>
                        </div>
                      )}
                      {match.odds.under05HT != null && (
                        <div className="bg-[#12162a] p-1 rounded border border-white/10 flex justify-between">
                          <span className="text-gray-300 font-sans">Under 0,5 HT:</span>
                          <span className="text-[#2C3EC4] font-bold">{match.odds.under05HT}</span>
                        </div>
                      )}
                      {match.odds.bttsHT != null && (
                        <div className="bg-[#12162a] p-1 rounded border border-white/10 flex justify-between">
                          <span className="text-gray-300 font-sans">Ambos HT:</span>
                          <span className="text-[#2C3EC4] font-bold">{match.odds.bttsHT}</span>
                        </div>
                      )}
                      {match.odds.firstGoalHome?.minute != null && (
                        <div className="bg-[#12162a] p-1 rounded border border-white/10 flex justify-between col-span-2 sm:col-span-1">
                          <span className="text-gray-300 font-sans">1º Gol Mand:</span>
                          <span className="text-[#2C3EC4] font-bold">{match.odds.firstGoalHome.minute}' {match.odds.firstGoalHome.odd != null ? `(Odd ${match.odds.firstGoalHome.odd})` : ''}</span>
                        </div>
                      )}
                      {match.odds.firstGoalAway?.minute != null && (
                        <div className="bg-[#12162a] p-1 rounded border border-white/10 flex justify-between col-span-2 sm:col-span-1">
                          <span className="text-gray-300 font-sans">1º Gol Visit:</span>
                          <span className="text-[#2C3EC4] font-bold">{match.odds.firstGoalAway.minute}' {match.odds.firstGoalAway.odd != null ? `(Odd ${match.odds.firstGoalAway.odd})` : ''}</span>
                        </div>
                      )}
                      {match.odds.earlyGameGoal?.minute != null && (
                        <div className="bg-[#12162a] p-1 rounded border border-white/10 flex justify-between col-span-2 sm:col-span-1">
                          <span className="text-gray-300 font-sans">Gol Início:</span>
                          <span className="text-[#2C3EC4] font-bold">{match.odds.earlyGameGoal.minute}' {match.odds.earlyGameGoal.odd != null ? `(Odd ${match.odds.earlyGameGoal.odd})` : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Expandable Match Stats Section */}
                {isExpanded && match.stats && (
                  <div className="bg-[#0b0e1b] p-3 rounded-xl border border-white/10 space-y-3 text-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-gray-300 font-bold text-[11px] uppercase border-b border-white/10 pb-1.5">
                      <span>Estatísticas da Partida (FT & HT)</span>
                      {match.stats.halftimeHomeScore !== undefined && match.stats.halftimeHomeScore !== null && (
                        <span className="text-white font-mono font-bold bg-[#2C3EC4]/30 px-2 py-0.5 rounded border border-[#2C3EC4]/40">
                          1º Tempo (HT): {match.stats.halftimeHomeScore} - {match.stats.halftimeAwayScore}
                        </span>
                      )}
                    </div>

                    {/* Moments of goals strip */}
                    {(match.stats.firstGoalMinuteMatch != null || match.stats.firstGoalMinuteHome != null || match.stats.firstGoalMinuteAway != null) && (
                      <div className="flex flex-wrap gap-2 text-[11px] font-mono bg-[#12162a] p-2 rounded-lg border border-white/10">
                        {match.stats.firstGoalMinuteMatch != null && (
                          <span className="text-white font-bold">
                            ⚡ 1º Gol Jogo: <span className="text-[#2C3EC4] font-extrabold">{match.stats.firstGoalMinuteMatch}'</span>
                          </span>
                        )}
                        {match.stats.firstGoalMinuteHome != null && (
                          <span className="text-blue-300 font-bold">
                            ⚽ 1º Gol {match.homeTeamName}: <span className="text-white">{match.stats.firstGoalMinuteHome}'</span>
                          </span>
                        )}
                        {match.stats.firstGoalMinuteAway != null && (
                          <span className="text-amber-300 font-bold">
                            ⚽ 1º Gol {match.awayTeamName}: <span className="text-white">{match.stats.firstGoalMinuteAway}'</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Posse de bola bar */}
                    {(match.stats.possessionHomeFT ?? match.stats.possessionHome) != null && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-200 font-medium">
                          <span>{match.stats.possessionHomeFT ?? match.stats.possessionHome}% Posse FT</span>
                          <span className="text-gray-400 font-bold">Posse de Bola</span>
                          <span>{match.stats.possessionAwayFT ?? match.stats.possessionAway}% Posse FT</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
                          <div
                            className="bg-[#2C3EC4] h-full transition-all"
                            style={{ width: `${match.stats.possessionHomeFT ?? match.stats.possessionHome}%` }}
                          />
                          <div
                            className="bg-blue-400 h-full transition-all"
                            style={{ width: `${match.stats.possessionAwayFT ?? match.stats.possessionAway}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stats metrics grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {/* Cantos / Escanteios FT & HT */}
                      {((match.stats.cornersHomeFT ?? match.stats.cornersHome) != null || match.stats.cornersHomeHT != null) && (
                        <div className="bg-[#12162a] p-2 rounded border border-white/10 space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-white">{match.stats.cornersHomeFT ?? match.stats.cornersHome ?? 0}</span>
                            <span className="text-gray-300">Escanteios (FT)</span>
                            <span className="text-white">{match.stats.cornersAwayFT ?? match.stats.cornersAway ?? 0}</span>
                          </div>
                          {(match.stats.cornersHomeHT != null || match.stats.cornersAwayHT != null) && (
                            <div className="flex justify-between text-[10px] text-blue-200 border-t border-white/10 pt-1">
                              <span>HT: {match.stats.cornersHomeHT ?? 0}</span>
                              <span className="text-gray-400">1º Tempo</span>
                              <span>HT: {match.stats.cornersAwayHT ?? 0}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Chutes no Gol FT & HT */}
                      {((match.stats.shotsOnTargetHomeFT ?? match.stats.shotsOnTargetHome) != null || match.stats.shotsOnTargetHomeHT != null) && (
                        <div className="bg-[#12162a] p-2 rounded border border-white/10 space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-white">{match.stats.shotsOnTargetHomeFT ?? match.stats.shotsOnTargetHome ?? 0}</span>
                            <span className="text-gray-300">Chutes no Gol (FT)</span>
                            <span className="text-white">{match.stats.shotsOnTargetAwayFT ?? match.stats.shotsOnTargetAway ?? 0}</span>
                          </div>
                          {(match.stats.shotsOnTargetHomeHT != null || match.stats.shotsOnTargetAwayHT != null) && (
                            <div className="flex justify-between text-[10px] text-blue-200 border-t border-white/10 pt-1">
                              <span>HT: {match.stats.shotsOnTargetHomeHT ?? 0}</span>
                              <span className="text-gray-400">1º Tempo</span>
                              <span>HT: {match.stats.shotsOnTargetAwayHT ?? 0}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Finalizações / Chutes Totais FT & HT */}
                      {((match.stats.shotsHomeFT ?? match.stats.shotsHome) != null || match.stats.shotsHomeHT != null) && (
                        <div className="bg-[#12162a] p-2 rounded border border-white/10 space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-white">{match.stats.shotsHomeFT ?? match.stats.shotsHome ?? 0}</span>
                            <span className="text-gray-300">Finalizações (FT)</span>
                            <span className="text-white">{match.stats.shotsAwayFT ?? match.stats.shotsAway ?? 0}</span>
                          </div>
                          {(match.stats.shotsHomeHT != null || match.stats.shotsAwayHT != null) && (
                            <div className="flex justify-between text-[10px] text-blue-200 border-t border-white/10 pt-1">
                              <span>HT: {match.stats.shotsHomeHT ?? 0}</span>
                              <span className="text-gray-400">1º Tempo</span>
                              <span>HT: {match.stats.shotsAwayHT ?? 0}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cartões Amarelos & Vermelhos */}
                      {((match.stats.yellowCardsHomeFT ?? match.stats.yellowCardsHome) != null || (match.stats.redCardsHomeFT ?? match.stats.redCardsHome) != null) && (
                        <div className="bg-[#12162a] p-2 rounded border border-white/10 space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-amber-300">
                              🟨{match.stats.yellowCardsHomeFT ?? match.stats.yellowCardsHome ?? 0} {(match.stats.redCardsHomeFT ?? match.stats.redCardsHome) ? `🟥${match.stats.redCardsHomeFT ?? match.stats.redCardsHome}` : ''}
                            </span>
                            <span className="text-gray-300">Cartões (FT)</span>
                            <span className="text-amber-300">
                              🟨{match.stats.yellowCardsAwayFT ?? match.stats.yellowCardsAway ?? 0} {(match.stats.redCardsAwayFT ?? match.stats.redCardsAway) ? `🟥${match.stats.redCardsAwayFT ?? match.stats.redCardsAway}` : ''}
                            </span>
                          </div>
                          {(match.stats.yellowCardsHomeHT != null || match.stats.redCardsHomeHT != null) && (
                            <div className="flex justify-between text-[10px] text-blue-200 border-t border-white/10 pt-1">
                              <span>HT: 🟨{match.stats.yellowCardsHomeHT ?? 0}</span>
                              <span className="text-gray-400">1º Tempo</span>
                              <span>HT: 🟨{match.stats.yellowCardsAwayHT ?? 0}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Entity IDs Footer Banner */}
                <div className="bg-[#0b0e1b] p-2.5 rounded-xl border border-[#2C3EC4]/20 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-3 text-gray-300 flex-wrap font-semibold">
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">País:</span>
                      <span className="text-white bg-[#2C3EC4]/30 px-1 rounded">{match.countryId}</span>
                    </span>
                    <span className="text-gray-600">|</span>
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">Liga:</span>
                      <span className="text-white bg-[#2C3EC4]/30 px-1 rounded">{match.leagueId}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-300 text-[11px] font-sans flex-wrap font-medium">
                    {match.round && <span>{match.round}</span>}
                    {match.stadium && (
                      <span className="flex items-center gap-1 text-gray-300">
                        <MapPin className="w-3 h-3 text-[#2C3EC4]" />
                        {match.stadium}
                      </span>
                    )}
                    {match.referee && (
                      <span className="flex items-center gap-1 text-white font-bold bg-[#2C3EC4]/20 px-2 py-0.5 rounded border border-[#2C3EC4]/40">
                        👨‍⚖️ Árbitro: {match.referee}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date & Actions Bar */}
                <div className="flex items-center justify-between pt-2 text-xs text-gray-300 border-t border-white/10 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#2C3EC4]" />
                    {formatDate(match.matchDate)}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Expand stats toggle if stats exist */}
                    {hasStats && (
                      <button
                        onClick={() => setExpandedStatsMatchId(isExpanded ? null : match.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#2C3EC4]/20 hover:bg-[#2C3EC4]/30 text-white text-xs font-bold flex items-center gap-1 border border-[#2C3EC4]/40 transition-colors"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-[#2C3EC4]" />
                        <span>{isExpanded ? 'Ocultar Stats' : 'Ver Stats'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}

                    {/* Stats modal launch button */}
                    <button
                      onClick={() => onOpenStatsModal(match)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#2C3EC4] hover:bg-[#2231A8] text-white text-xs font-bold border border-white/10 flex items-center gap-1 transition-all shadow-sm"
                      title="Lançar/Editar Placar & Estatísticas"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>{match.status === 'AGENDADO' ? 'Lançar Stats' : 'Estatísticas'}</span>
                    </button>

                    <button
                      onClick={() => onEditMatch(match)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
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
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/30 text-gray-300 hover:text-white transition-colors border border-white/10"
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

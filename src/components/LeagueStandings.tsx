import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Shield, 
  Filter, 
  Award, 
  Target, 
  Flame, 
  TrendingUp, 
  TrendingDown,
  Info, 
  Calendar, 
  Swords, 
  Scale, 
  Sparkles, 
  Activity, 
  BarChart2, 
  Flag, 
  CheckCircle2, 
  ChevronRight, 
  Layers, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap,
  Whistle as WhistleIcon, // if available, or scale
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { DbState, League, Match, Team, Country } from '../types';
import { 
  calculateDynamicStandings, 
  calculateMatchContextProjection,
  getCompetitionRegulation,
  DynamicStandingRow, 
  CompetitionRegulation,
  LeagueOverallMetrics,
  RefereeStat
} from '../utils/competitionRulesEngine';

interface LeagueStandingsProps {
  dbState: DbState;
  initialLeagueId?: string;
  initialHomeTeamId?: string;
  initialAwayTeamId?: string;
  onSelectMatchAnalysis?: (match: Match) => void;
}

export const LeagueStandings: React.FC<LeagueStandingsProps> = ({ 
  dbState,
  initialLeagueId,
  initialHomeTeamId,
  initialAwayTeamId,
  onSelectMatchAnalysis
}) => {
  const { leagues, matches, teams, countries } = dbState;

  // Filtro de País
  const [selectedCountryId, setSelectedCountryId] = useState<string>('ALL');

  // Ligas ordenadas alfabeticamente por País -> Liga
  const sortedLeagues = useMemo(() => {
    return [...leagues].sort((a, b) => {
      const countryComp = (a.countryName || '').localeCompare(b.countryName || '', 'pt-BR', { sensitivity: 'base' });
      if (countryComp !== 0) return countryComp;
      return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
    });
  }, [leagues]);

  // Ligas filtradas pelo país selecionado
  const filteredLeagues = useMemo(() => {
    if (selectedCountryId === 'ALL') return sortedLeagues;
    return sortedLeagues.filter(l => l.countryId === selectedCountryId);
  }, [sortedLeagues, selectedCountryId]);

  // Liga Ativa
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(() => {
    if (initialLeagueId && leagues.some(l => l.id === initialLeagueId)) {
      return initialLeagueId;
    }
    return sortedLeagues.length > 0 ? sortedLeagues[0].id : 'ALL';
  });

  // Visão de Mando: 'ALL' (Geral) | 'HOME' (Casa) | 'AWAY' (Fora)
  const [venueFilter, setVenueFilter] = useState<'ALL' | 'HOME' | 'AWAY'>('ALL');

  // Sub-módulos Analíticos da Competição
  const [activeAnalysisView, setActiveAnalysisView] = useState<'STANDINGS' | 'XP_TABLE' | 'GOAL_VOLATILITY' | 'HOME_ADVANTAGE' | 'REFEREES'>('STANDINGS');

  // Confronto Selecionado para Destaque / Simulação
  const [highlightHomeTeamId, setHighlightHomeTeamId] = useState<string>(initialHomeTeamId || '');
  const [highlightAwayTeamId, setHighlightAwayTeamId] = useState<string>(initialAwayTeamId || '');
  const [showMatchSimulator, setShowMatchSimulator] = useState<boolean>(Boolean(initialHomeTeamId && initialAwayTeamId));

  // Ajustar liga quando países mudam
  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId);
    if (countryId !== 'ALL') {
      const firstInCountry = sortedLeagues.find(l => l.countryId === countryId);
      if (firstInCountry) {
        setSelectedLeagueId(firstInCountry.id);
      }
    }
  };

  // Se a liga atual não existir mais na lista filtrada, ajusta
  const effectiveLeagueId = useMemo(() => {
    if (selectedLeagueId === 'ALL') return 'ALL';
    if (filteredLeagues.some(l => l.id === selectedLeagueId)) return selectedLeagueId;
    return filteredLeagues.length > 0 ? filteredLeagues[0].id : 'ALL';
  }, [selectedLeagueId, filteredLeagues]);

  const currentLeague = leagues.find(l => l.id === effectiveLeagueId);

  // Cálculo da Tabela e Métricas com Motor Regulamentar Oficial
  const { rows, regulation, leagueMetrics, refereeStats } = useMemo(() => {
    return calculateDynamicStandings(dbState, effectiveLeagueId, venueFilter);
  }, [dbState, effectiveLeagueId, venueFilter]);

  // Lista de times presentes na classificação para o simulador
  const availableTeams = useMemo(() => {
    return rows.map(r => ({ id: r.teamId, name: r.teamName, logoUrl: r.logoUrl }));
  }, [rows]);

  // Projeção do confronto selecionado
  const matchProjection = useMemo(() => {
    if (!highlightHomeTeamId || !highlightAwayTeamId || highlightHomeTeamId === highlightAwayTeamId) {
      return null;
    }
    return calculateMatchContextProjection(rows, highlightHomeTeamId, highlightAwayTeamId, regulation);
  }, [rows, highlightHomeTeamId, highlightAwayTeamId, regulation]);

  // Destaques rápidos
  const leader = rows.length > 0 ? rows[0] : null;
  const bestAttack = [...rows].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const bestDefense = [...rows].filter(s => s.played > 0).sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];

  return (
    <div className="space-y-6">
      {/* CABEÇALHO E SELETORES DE PAÍS / LIGA */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 pb-6 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-500/20 text-white">
                <Trophy className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Classificação Dinâmica da Competição
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Regulamentos Oficiais
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Tabela calculada em tempo real com critérios de desempate automatizados por liga (Saldo Geral, Confronto Direto ou Vitórias), zonas de vagas europeias/acesso e rebaixamento.
            </p>
          </div>

          {/* Seletores de País e Liga */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Seletor de País */}
            <div className="flex-1 sm:flex-initial flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3.5 py-2">
              <Flag className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">País:</span>
                <select
                  value={selectedCountryId}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer pr-4"
                >
                  <option value="ALL" className="bg-slate-900 text-white">Todos os Países</option>
                  {[...countries]
                    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))
                    .map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Seletor de Liga */}
            <div className="flex-1 sm:flex-initial flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3.5 py-2 min-w-[200px]">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col w-full">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Liga / Competição:</span>
                <select
                  value={effectiveLeagueId}
                  onChange={(e) => setSelectedLeagueId(e.target.value)}
                  className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer pr-4 w-full truncate"
                >
                  <option value="ALL" className="bg-slate-900 text-white">Todas as Ligas Integradas</option>
                  {filteredLeagues.map(l => (
                    <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                      {l.countryName} - {l.name} [{l.id}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* BANNER DA LIGA ATIVA & CRITÉRIOS DE DESEMPATE */}
        {currentLeague && (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="lg:col-span-6 flex items-center gap-3.5">
              {currentLeague.logoUrl ? (
                <img
                  src={currentLeague.logoUrl}
                  alt={currentLeague.name}
                  className="w-12 h-12 object-contain rounded-xl bg-slate-800 p-1.5 border border-slate-700 shadow-md shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Trophy className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-black text-white">{currentLeague.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {currentLeague.countryName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {currentLeague.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Partidas finalizadas na base: <b className="text-white">{leagueMetrics.totalMatchesFinished}</b> • Gols marcados: <b className="text-white">{leagueMetrics.totalGoals}</b> ({leagueMetrics.avgGoalsPerMatch.toFixed(2)} / jogo)
                </p>
              </div>
            </div>

            {/* Caixa Informativa do Regulamento */}
            <div className="lg:col-span-6 bg-slate-950/80 border border-indigo-900/40 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-indigo-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Scale className="w-3.5 h-3.5 text-indigo-400" />
                  Regulamento & Desempate ({regulation.tiebreakerModel === 'GOAL_DIFFERENCE' ? 'Saldo Geral' : regulation.tiebreakerModel === 'HEAD_TO_HEAD' ? 'Confronto Direto' : 'Número de Vitórias'}):
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {regulation.rulesSequence.length} critérios mapeados
                </span>
              </div>
              <p className="text-slate-300 font-medium text-[11px] leading-relaxed">
                {regulation.tiebreakerDescription}
              </p>
              {regulation.specialNotes && (
                <p className="text-amber-400/90 text-[10px] font-semibold flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {regulation.specialNotes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* NAVEGAÇÃO DE SUB-MÓDULOS E ABAS DE MANDO */}
        <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-slate-800">
          {/* Sub-módulos Analíticos */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-bold w-full md:w-auto">
            <button
              onClick={() => setActiveAnalysisView('STANDINGS')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeAnalysisView === 'STANDINGS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Tabela Oficial & Regulamento</span>
            </button>

            <button
              onClick={() => setActiveAnalysisView('XP_TABLE')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeAnalysisView === 'XP_TABLE'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tabela Esperada (xP & xG)</span>
            </button>

            <button
              onClick={() => setActiveAnalysisView('GOAL_VOLATILITY')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeAnalysisView === 'GOAL_VOLATILITY'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-purple-300" />
              <span>Linhas de Gols & BTTS</span>
            </button>

            <button
              onClick={() => setActiveAnalysisView('HOME_ADVANTAGE')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeAnalysisView === 'HOME_ADVANTAGE'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Fator Mando de Campo</span>
            </button>

            <button
              onClick={() => setActiveAnalysisView('REFEREES')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeAnalysisView === 'REFEREES'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-amber-300" />
              <span>Impacto do Árbitro</span>
            </button>
          </div>

          {/* Abas de Mando: Geral / Casa / Fora */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline uppercase tracking-wider">
              Vista:
            </span>
            <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-700/80 text-xs font-bold">
              <button
                onClick={() => setVenueFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  venueFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Geral (Casa + Fora)
              </button>
              <button
                onClick={() => setVenueFilter('HOME')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  venueFilter === 'HOME'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Casa (Home)
              </button>
              <button
                onClick={() => setVenueFilter('AWAY')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  venueFilter === 'AWAY'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fora (Away)
              </button>
            </div>

            {/* Toggle Simulador de Confronto */}
            <button
              onClick={() => setShowMatchSimulator(!showMatchSimulator)}
              className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
                showMatchSimulator
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Destacar confronto direto e calcular distância para objetivos"
            >
              <Swords className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Destaque Confronto</span>
            </button>
          </div>
        </div>
      </div>

      {/* PAINEL DO SIMULADOR DE CONFRONTO MANDANTE VS VISITANTE */}
      {showMatchSimulator && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 border border-amber-500/30 rounded-3xl p-5 shadow-xl text-white space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400 animate-pulse" />
              <h4 className="text-sm font-black uppercase tracking-wider text-amber-300">
                Simulador & Contexto de Confronto Direto
              </h4>
              <span className="text-xs text-slate-400">
                (Destaca as equipes na tabela e projeta impacto nos objetivos)
              </span>
            </div>
            <button
              onClick={() => {
                setHighlightHomeTeamId('');
                setHighlightAwayTeamId('');
              }}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Limpar Seleção
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            {/* Seletor Mandante */}
            <div className="lg:col-span-5 bg-slate-950/90 border border-blue-500/30 rounded-2xl p-3.5 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <span>🏠</span> Equipe Mandante (Casa):
              </label>
              <select
                value={highlightHomeTeamId}
                onChange={(e) => setHighlightHomeTeamId(e.target.value)}
                className="w-full bg-slate-900 text-white font-bold text-xs rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">-- Selecione o Mandante --</option>
                {availableTeams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 text-center text-xs font-black text-amber-400 uppercase tracking-widest hidden lg:block">
              VS
            </div>

            {/* Seletor Visitante */}
            <div className="lg:col-span-5 bg-slate-950/90 border border-purple-500/30 rounded-2xl p-3.5 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <span>✈️</span> Equipe Visitante (Fora):
              </label>
              <select
                value={highlightAwayTeamId}
                onChange={(e) => setHighlightAwayTeamId(e.target.value)}
                className="w-full bg-slate-900 text-white font-bold text-xs rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="">-- Selecione o Visitante --</option>
                {availableTeams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards de Análise de Distância para Objetivos */}
          {matchProjection && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {/* Card Mandante */}
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-300 flex items-center gap-1.5">
                    <span>🏠</span> {matchProjection.homeTeam.teamName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                    {matchProjection.homeTeam.position}º Lugar ({matchProjection.homeTeam.points} pts)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">Dist. Líder</span>
                    <span className="font-black text-amber-400 text-xs">
                      {matchProjection.distanceHomeToLeader === 0 ? '👑 Líder' : `-${matchProjection.distanceHomeToLeader} pts`}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">Dist. Vaga Top</span>
                    <span className="font-black text-emerald-400 text-xs">
                      {matchProjection.distanceHomeToTopZone === 0 ? 'Na Zona' : `-${matchProjection.distanceHomeToTopZone} pts`}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">Margem Z-Reb</span>
                    <span className={`font-black text-xs ${matchProjection.distanceHomeToRelegation <= 3 ? 'text-red-400' : 'text-slate-200'}`}>
                      +{matchProjection.distanceHomeToRelegation} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Visitante */}
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                    <span>✈️</span> {matchProjection.awayTeam.teamName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white">
                    {matchProjection.awayTeam.position}º Lugar ({matchProjection.awayTeam.points} pts)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">Dist. Líder</span>
                    <span className="font-black text-amber-400 text-xs">
                      {matchProjection.distanceAwayToLeader === 0 ? '👑 Líder' : `-${matchProjection.distanceAwayToLeader} pts`}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">Dist. Vaga Top</span>
                    <span className="font-black text-emerald-400 text-xs">
                      {matchProjection.distanceAwayToTopZone === 0 ? 'Na Zona' : `-${matchProjection.distanceAwayToTopZone} pts`}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">Margem Z-Reb</span>
                    <span className={`font-black text-xs ${matchProjection.distanceAwayToRelegation <= 3 ? 'text-red-400' : 'text-slate-200'}`}>
                      +{matchProjection.distanceAwayToRelegation} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Cenários de Pontuação do Confronto */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2 md:col-span-2 lg:col-span-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
                  Projeção de Pontos do Jogo:
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-blue-400 font-bold">Vitória Mandante:</span>
                    <span className="font-mono text-slate-200 font-bold">
                      {matchProjection.homeTeam.teamName} vai a <b>{matchProjection.homeWinOutcome.homeProjectedPoints}</b> pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold">Empate:</span>
                    <span className="font-mono text-slate-200 font-bold">
                      {matchProjection.drawOutcome.homeProjectedPoints} pts / {matchProjection.drawOutcome.awayProjectedPoints} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-purple-400 font-bold">Vitória Visitante:</span>
                    <span className="font-mono text-slate-200 font-bold">
                      {matchProjection.awayTeam.teamName} vai a <b>{matchProjection.awayWinOutcome.awayProjectedPoints}</b> pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISTA 1: TABELA OFICIAL & REGULAMENTO DA COMPETIÇÃO */}
      {activeAnalysisView === 'STANDINGS' && (
        <div className="space-y-4">
          {/* CARDS DE DESTAQUE (LÍDER, MELHOR ATAQUE, MELHOR DEFESA) */}
          {rows.length > 0 && leader && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Líder */}
              <div className="bg-gradient-to-br from-blue-950/60 to-indigo-950/60 p-4 rounded-2xl border border-blue-800/40 flex items-center justify-between shadow-lg text-white">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    👑 1º Lugar (Líder da Competição)
                  </span>
                  <span className="text-base font-black text-white block truncate mt-0.5">
                    {leader.teamName}
                  </span>
                  <span className="text-xs font-bold text-blue-300">
                    {leader.points} pts • {leader.pointsPercentage.toFixed(1)}% aproveitamento ({leader.wins}V - {leader.draws}E - {leader.losses}D)
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-md">
                  {leader.logoUrl ? (
                    <img src={leader.logoUrl} alt={leader.teamName} className="w-8 h-8 object-contain" />
                  ) : (
                    <Award className="w-6 h-6 text-amber-400" />
                  )}
                </div>
              </div>

              {/* Melhor Ataque */}
              {bestAttack && (
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-lg text-white">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      ⚽ Melhor Ataque da Liga
                    </span>
                    <span className="text-base font-bold text-white block truncate mt-0.5">
                      {bestAttack.teamName}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {bestAttack.goalsFor} gols marcados ({bestAttack.played > 0 ? (bestAttack.goalsFor / bestAttack.played).toFixed(2) : '0'} / jogo)
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-blue-400">
                    <Target className="w-6 h-6" />
                  </div>
                </div>
              )}

              {/* Melhor Defesa */}
              {bestDefense && (
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-lg text-white">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      🛡️ Melhor Defesa da Liga
                    </span>
                    <span className="text-base font-bold text-white block truncate mt-0.5">
                      {bestDefense.teamName}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {bestDefense.goalsAgainst} gols sofridos ({bestDefense.played > 0 ? (bestDefense.goalsAgainst / bestDefense.played).toFixed(2) : '0'} / jogo)
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-emerald-400">
                    <Shield className="w-6 h-6" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TABELA DE CLASSIFICAÇÃO */}
          {rows.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                Nenhuma partida finalizada para calcular a classificação nesta visão.
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Cadastre ou importe jogos da liga com placar finalizado para gerar a tabela automatizada em tempo real!
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 text-center w-14">POS</th>
                      <th className="p-3.5">EQUIPE</th>
                      <th className="p-3.5 text-center font-black text-amber-400 bg-slate-950 border-x border-slate-800 text-sm">
                        P
                      </th>
                      <th className="p-3.5 text-center" title="Jogos Disputados">J</th>
                      <th className="p-3.5 text-center text-emerald-400" title="Vitórias">V</th>
                      <th className="p-3.5 text-center text-amber-300" title="Empates">E</th>
                      <th className="p-3.5 text-center text-red-400" title="Derrotas">D</th>
                      <th className="p-3.5 text-center" title="Gols Pró / Marcados">GP</th>
                      <th className="p-3.5 text-center" title="Gols Contra / Sofridos">GC</th>
                      <th className="p-3.5 text-center font-black" title="Saldo de Gols (GP - GC)">SG</th>
                      <th className="p-3.5 text-center font-black bg-blue-950 text-blue-300 border-x border-blue-900" title="Percentual de Aproveitamento dos Pontos">
                        %
                      </th>
                      <th className="p-3.5 text-center w-40" title="Sequência nos Últimos 5 Jogos">
                        FORMA (ÚLT. 5)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((row) => {
                      const isHighlightedHome = row.teamId === highlightHomeTeamId;
                      const isHighlightedAway = row.teamId === highlightAwayTeamId;
                      const zone = row.zone;

                      return (
                        <tr
                          key={row.teamId}
                          className={`transition-colors relative group ${
                            isHighlightedHome
                              ? 'bg-blue-100/90 font-bold ring-2 ring-blue-500 ring-inset'
                              : isHighlightedAway
                              ? 'bg-purple-100/90 font-bold ring-2 ring-purple-500 ring-inset'
                              : zone
                              ? zone.rowHighlight
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* POSIÇÃO COM BADGE DE ZONA */}
                          <td className="p-3.5 text-center font-mono font-black">
                            <div className="flex items-center justify-center gap-1">
                              {zone ? (
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black shadow-xs ${zone.badgeBg} ${zone.badgeText}`}
                                  title={zone.label}
                                >
                                  {row.position}
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs">
                                  {row.position}º
                                </span>
                              )}
                            </div>
                          </td>

                          {/* EQUIPE (ESCUDO + NOME + BADGE MANDANTE/VISITANTE) */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                {row.logoUrl ? (
                                  <img src={row.logoUrl} alt={row.teamName} className="w-5 h-5 object-contain" />
                                ) : (
                                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">
                                  {row.teamName}
                                </span>
                                {isHighlightedHome && (
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-blue-600 text-white uppercase tracking-wider shadow-xs">
                                    🏠 Mandante
                                  </span>
                                )}
                                {isHighlightedAway && (
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-purple-600 text-white uppercase tracking-wider shadow-xs">
                                    ✈️ Visitante
                                  </span>
                                )}
                                {zone && (
                                  <span
                                    className="hidden xl:inline text-[10px] font-bold text-slate-500 opacity-80"
                                    title={zone.label}
                                  >
                                    • {zone.shortLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* PONTOS (P) */}
                          <td className="p-3.5 text-center font-mono font-black text-slate-950 text-base bg-slate-50/80 border-x border-slate-200">
                            {row.points}
                          </td>

                          {/* JOGOS (J) */}
                          <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                            {row.played}
                          </td>

                          {/* VITÓRIAS (V) */}
                          <td className="p-3.5 text-center font-mono font-bold text-emerald-700">
                            {row.wins}
                          </td>

                          {/* EMPATES (E) */}
                          <td className="p-3.5 text-center font-mono font-bold text-amber-700">
                            {row.draws}
                          </td>

                          {/* DERROTAS (D) */}
                          <td className="p-3.5 text-center font-mono font-bold text-red-700">
                            {row.losses}
                          </td>

                          {/* GOLS PRÓ (GP) */}
                          <td className="p-3.5 text-center font-mono text-slate-700 font-semibold">
                            {row.goalsFor}
                          </td>

                          {/* GOLS CONTRA (GC) */}
                          <td className="p-3.5 text-center font-mono text-slate-700 font-semibold">
                            {row.goalsAgainst}
                          </td>

                          {/* SALDO DE GOLS (SG) */}
                          <td className="p-3.5 text-center font-mono font-black text-sm">
                            <span
                              className={
                                row.goalDifference > 0
                                  ? 'text-emerald-700 font-black'
                                  : row.goalDifference < 0
                                  ? 'text-red-700 font-black'
                                  : 'text-slate-500'
                              }
                            >
                              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                            </span>
                          </td>

                          {/* APROVEITAMENTO (%) */}
                          <td className="p-3.5 text-center font-mono font-black text-blue-900 bg-blue-50/60 border-x border-blue-100">
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-100/90 text-blue-900 border border-blue-200">
                              {row.pointsPercentage.toFixed(1)}%
                            </span>
                          </td>

                          {/* FORMA (ÚLTIMOS 5 JOGOS COM TOOLTIP) */}
                          <td className="p-3.5 text-center">
                            {row.recentForm.length === 0 ? (
                              <span className="text-[10px] text-slate-400 font-mono">-</span>
                            ) : (
                              <div className="flex items-center justify-center gap-1 font-mono">
                                {row.recentForm.map((match, i) => {
                                  const isWin = match.outcome === 'V';
                                  const isDraw = match.outcome === 'E';
                                  return (
                                    <div key={i} className="relative group/form">
                                      <span
                                        className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shadow-xs cursor-help transition-transform hover:scale-125 ${
                                          isWin
                                            ? 'bg-emerald-500 text-white'
                                            : isDraw
                                            ? 'bg-amber-400 text-slate-950'
                                            : 'bg-red-500 text-white'
                                        }`}
                                      >
                                        {match.outcome}
                                      </span>

                                      {/* Tooltip com detalhes do jogo */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/form:flex flex-col items-center z-50 pointer-events-none">
                                        <div className="bg-slate-900 text-white text-[10px] rounded-xl px-2.5 py-1.5 whitespace-nowrap shadow-xl border border-slate-700 space-y-0.5">
                                          <p className="font-bold text-amber-300">
                                            {match.isHome ? '🏠 Em Casa' : '✈️ Fora'} vs {match.opponent}
                                          </p>
                                          <p className="font-mono text-slate-300">
                                            Placar: <b className="text-white">{match.score}</b> ({isWin ? 'Vitória' : isDraw ? 'Empate' : 'Derrota'})
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* LEGENDA DE OBJETIVOS E ZONAS DA TABELA */}
              <div className="p-4 bg-slate-900 text-white border-t border-slate-800 text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-black text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Zonas de Classificação & Regulamento da Competição:
                  </span>
                  <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> <b>V</b> = Vitória (3pts)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> <b>E</b> = Empate (1pt)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> <b>D</b> = Derrota (0pt)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  {regulation.zones.map((zone, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <span className={`w-3 h-3 rounded-md shrink-0 ${zone.badgeBg}`}></span>
                      <span className="font-bold text-slate-200">{zone.shortLabel}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({zone.minPos}º ao {zone.maxPos}º)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: TABELA ESPERADA (xP & xG MODEL) */}
      {activeAnalysisView === 'XP_TABLE' && (
        <div className="space-y-4">
          <div className="bg-[#0f172a] border border-indigo-900/50 rounded-3xl p-5 text-white space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-base font-black text-white">
                Tabela de Pontos Esperados ($xP$ Table) & Balanço de $xG$
              </h3>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              O modelo de $xP$ recalcula os resultados simulando probabilidades de Poisson a partir da qualidade das chances geradas ($xG$) em cada jogo. Revela equipes que estão superformando por sorte/eficiência ou times subfaturados que jogam bem mas não convertem.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 text-center">POS REAL</th>
                    <th className="p-3.5 text-center text-amber-400 bg-slate-950">POS xP</th>
                    <th className="p-3.5">EQUIPE</th>
                    <th className="p-3.5 text-center font-bold">PTS REAIS</th>
                    <th className="p-3.5 text-center font-black text-indigo-700 bg-indigo-50 border-x border-indigo-100 text-sm">
                      xP (PONTOS ESPERADOS)
                    </th>
                    <th className="p-3.5 text-center font-black" title="Diferença entre Pontos Reais e xP">
                      DELTA xP
                    </th>
                    <th className="p-3.5 text-center" title="Gols Esperados Marcados">xG PRÓ</th>
                    <th className="p-3.5 text-center" title="Gols Esperados Sofridos">xG CONTRA</th>
                    <th className="p-3.5 text-center font-bold" title="Saldo de xG">SALDO xG</th>
                    <th className="p-3.5 text-center">DIAGNÓSTICO DO MODELO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {[...rows].sort((a, b) => b.xPoints - a.xPoints).map((row, idx) => {
                    const xRank = idx + 1;
                    const deltaRank = row.position - xRank; // positivo = xP melhor que real (azarado/subfaturado)
                    const isOverperforming = row.xPointsDiff > 2.5;
                    const isUnderperforming = row.xPointsDiff < -2.5;

                    return (
                      <tr key={row.teamId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 text-center font-mono font-bold text-slate-600">
                          {row.position}º
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-amber-500 bg-slate-50 text-sm">
                          {xRank}º
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            {row.logoUrl ? (
                              <img src={row.logoUrl} alt={row.teamName} className="w-5 h-5 object-contain" />
                            ) : (
                              <Shield className="w-4 h-4 text-slate-400" />
                            )}
                            <span>{row.teamName}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-900">
                          {row.points}
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-indigo-700 bg-indigo-50/60 border-x border-indigo-100 text-sm">
                          {row.xPoints.toFixed(1)}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                              row.xPointsDiff > 1
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.xPointsDiff < -1
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {row.xPointsDiff > 0 ? `+${row.xPointsDiff.toFixed(1)}` : row.xPointsDiff.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-700">
                          {row.xGoalsFor.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-700">
                          {row.xGoalsAgainst.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          <span className={row.xGoalDifference >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                            {row.xGoalDifference >= 0 ? `+${row.xGoalDifference.toFixed(2)}` : row.xGoalDifference.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {isOverperforming ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                              <TrendingUp className="w-3 h-3 text-amber-600" /> Superformando (Sorte/Eficiência)
                            </span>
                          ) : isUnderperforming ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                              <TrendingDown className="w-3 h-3 text-purple-600" /> Subfaturado (Potencial Oculto)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              <CheckCircle2 className="w-3 h-3 text-slate-500" /> Em linha com xG
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: VOLATILIDADE DE GOLS & MERCADOS (OVER/UNDER & BTTS) */}
      {activeAnalysisView === 'GOAL_VOLATILITY' && (
        <div className="space-y-4">
          {/* Métricas Consolidadas da Competição */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Média Gols / Jogo</span>
              <span className="text-xl font-black text-amber-400 font-mono mt-0.5 block">
                {leagueMetrics.avgGoalsPerMatch.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Over 1.5 FT</span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
                {leagueMetrics.over15Pct.toFixed(1)}%
              </span>
            </div>
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Over 2.5 FT</span>
              <span className="text-xl font-black text-sky-400 font-mono mt-0.5 block">
                {leagueMetrics.over25Pct.toFixed(1)}%
              </span>
            </div>
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Over 0.5 HT</span>
              <span className="text-xl font-black text-indigo-400 font-mono mt-0.5 block">
                {leagueMetrics.over05HTPct.toFixed(1)}%
              </span>
            </div>
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ambas Marcam (BTTS)</span>
              <span className="text-xl font-black text-purple-400 font-mono mt-0.5 block">
                {leagueMetrics.bttsPct.toFixed(1)}%
              </span>
            </div>
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Média Gols HT</span>
              <span className="text-xl font-black text-amber-300 font-mono mt-0.5 block">
                {leagueMetrics.avgGoalsHT.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Tabela de Linhas de Mercado por Equipe */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 text-center">POS</th>
                    <th className="p-3.5">EQUIPE</th>
                    <th className="p-3.5 text-center font-bold">J</th>
                    <th className="p-3.5 text-center font-bold text-emerald-700 bg-emerald-50">OVER 1.5 (%)</th>
                    <th className="p-3.5 text-center font-black text-sky-700 bg-sky-50">OVER 2.5 (%)</th>
                    <th className="p-3.5 text-center font-bold text-purple-700 bg-purple-50">OVER 3.5 (%)</th>
                    <th className="p-3.5 text-center font-bold">OVER 0.5 HT (%)</th>
                    <th className="p-3.5 text-center font-bold text-amber-800 bg-amber-50">AMBAS MARCAM (BTTS)</th>
                    <th className="p-3.5 text-center font-bold">CLEAN SHEET (SG=0)</th>
                    <th className="p-3.5 text-center font-bold">FALHOU EM MARCAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.map((row) => (
                    <tr key={row.teamId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 text-center font-mono font-bold text-slate-600">
                        {row.position}º
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          {row.logoUrl ? (
                            <img src={row.logoUrl} alt={row.teamName} className="w-5 h-5 object-contain" />
                          ) : (
                            <Shield className="w-4 h-4 text-slate-400" />
                          )}
                          <span>{row.teamName}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                        {row.played}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold bg-emerald-50/50 text-emerald-900">
                        {row.over15Pct.toFixed(0)}%
                      </td>
                      <td className="p-3.5 text-center font-mono font-black bg-sky-50/50 text-sky-900">
                        {row.over25Pct.toFixed(0)}%
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold bg-purple-50/50 text-purple-900">
                        {row.over35Pct.toFixed(0)}%
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                        {row.over05HTPct.toFixed(0)}%
                      </td>
                      <td className="p-3.5 text-center font-mono font-black bg-amber-50/50 text-amber-900">
                        {row.bttsPct.toFixed(0)}%
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-700">
                        {row.cleanSheets} ({row.cleanSheetPct.toFixed(0)}%)
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-700">
                        {row.failedToScore} ({row.failedToScorePct.toFixed(0)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 4: FATOR MANDO DE CAMPO (HOME ADVANTAGE FACTOR) */}
      {activeAnalysisView === 'HOME_ADVANTAGE' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Índice Global da Liga em Casa
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-400 font-mono">
                  {leagueMetrics.homeWinPct.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">vitórias mandante</span>
              </div>
              <p className="text-xs text-slate-400">
                Empates: <b className="text-white">{leagueMetrics.drawPct.toFixed(1)}%</b> • Vitórias Fora: <b className="text-white">{leagueMetrics.awayWinPct.toFixed(1)}%</b>
              </p>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Média de Gols Mandante vs Visitante
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {leagueMetrics.homeGoalsAvg.toFixed(2)} vs {leagueMetrics.awayGoalsAvg.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Vantagem média de <b className="text-emerald-300">+{(leagueMetrics.homeGoalsAvg - leagueMetrics.awayGoalsAvg).toFixed(2)}</b> gols por jogo do mandante
              </p>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Dominância Absoluta da Competição
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400 font-mono">
                  +{leagueMetrics.homeAdvantageIndex.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Diferença líquida (% vitórias mandante - % vitórias visitante)
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 text-center">POS</th>
                    <th className="p-3.5">EQUIPE</th>
                    <th className="p-3.5 text-center font-bold bg-blue-950 text-blue-300">J CASA</th>
                    <th className="p-3.5 text-center font-bold bg-blue-950 text-blue-300">V-E-D (CASA)</th>
                    <th className="p-3.5 text-center font-black bg-blue-900 text-white">APROV. CASA (%)</th>
                    <th className="p-3.5 text-center font-bold bg-purple-950 text-purple-300">J FORA</th>
                    <th className="p-3.5 text-center font-bold bg-purple-950 text-purple-300">V-E-D (FORA)</th>
                    <th className="p-3.5 text-center font-black bg-purple-900 text-white">APROV. FORA (%)</th>
                    <th className="p-3.5 text-center font-black text-amber-800 bg-amber-50" title="Diferença de Aproveitamento Casa vs Fora">
                      FATOR CASA (DELTA %)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {[...rows].sort((a, b) => b.homeDominanceFactor - a.homeDominanceFactor).map((row) => (
                    <tr key={row.teamId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 text-center font-mono font-bold text-slate-600">
                        {row.position}º
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          {row.logoUrl ? (
                            <img src={row.logoUrl} alt={row.teamName} className="w-5 h-5 object-contain" />
                          ) : (
                            <Shield className="w-4 h-4 text-slate-400" />
                          )}
                          <span>{row.teamName}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-700 bg-blue-50/30">
                        {row.homeRecord.played}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-800 bg-blue-50/30">
                        {row.homeRecord.wins}V - {row.homeRecord.draws}E - {row.homeRecord.losses}D
                      </td>
                      <td className="p-3.5 text-center font-mono font-black text-blue-900 bg-blue-100/50">
                        {row.homeRecord.pct.toFixed(1)}%
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-700 bg-purple-50/30">
                        {row.awayRecord.played}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-800 bg-purple-50/30">
                        {row.awayRecord.wins}V - {row.awayRecord.draws}E - {row.awayRecord.losses}D
                      </td>
                      <td className="p-3.5 text-center font-mono font-black text-purple-900 bg-purple-100/50">
                        {row.awayRecord.pct.toFixed(1)}%
                      </td>
                      <td className="p-3.5 text-center font-mono font-black bg-amber-50/80">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                            row.homeDominanceFactor > 20
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : row.homeDominanceFactor < -5
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {row.homeDominanceFactor > 0 ? `+${row.homeDominanceFactor.toFixed(1)}%` : `${row.homeDominanceFactor.toFixed(1)}%`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 5: IMPACTO DO ÁRBITRO NA COMPETIÇÃO (REFEREE ANALYTICS) */}
      {activeAnalysisView === 'REFEREES' && (
        <div className="space-y-4">
          <div className="bg-[#0f172a] border border-amber-900/50 rounded-3xl p-5 text-white space-y-2">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black text-white">
                Quadro de Árbitros da Liga & Médias Disciplinares
              </h3>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Estatísticas detalhadas de cada juiz escalado nos jogos cadastrados: médias de faltas, cartões amarelos e vermelhos por partida e tendência de vitórias Mandante vs Visitante com sua arbitragem.
            </p>
          </div>

          {refereeStats.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-2">
              <Scale className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">
                Nenhum árbitro registrado com partidas nesta liga.
              </p>
              <p className="text-xs text-slate-400">
                Preencha o campo "Árbitro" no cadastro de partidas ou importação para visualizar as médias disciplinares.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">ÁRBITRO</th>
                      <th className="p-3.5 text-center">JOGOS APITADOS</th>
                      <th className="p-3.5 text-center font-bold text-amber-400 bg-slate-950">MÉDIA AMARELOS</th>
                      <th className="p-3.5 text-center font-bold text-red-400 bg-slate-950">MÉDIA VERMELHOS</th>
                      <th className="p-3.5 text-center font-bold">MÉDIA FALTAS</th>
                      <th className="p-3.5 text-center font-bold text-blue-400 bg-slate-950">% VIT. MANDANTE</th>
                      <th className="p-3.5 text-center font-bold text-slate-400 bg-slate-950">% EMPATES</th>
                      <th className="p-3.5 text-center font-bold text-purple-400 bg-slate-950">% VIT. VISITANTE</th>
                      <th className="p-3.5 text-center">PERFIL DE RIGOR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {refereeStats.map((ref, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          {ref.name}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                          {ref.matchesCount}
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-amber-700 bg-amber-50/50">
                          {ref.yellowCardsAvg.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-red-700 bg-red-50/50">
                          {ref.redCardsAvg.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                          {ref.foulsAvg > 0 ? ref.foulsAvg.toFixed(1) : '-'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-blue-900 bg-blue-50/50">
                          {ref.homeWinPct.toFixed(1)}%
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-700">
                          {ref.drawPct.toFixed(1)}%
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-purple-900 bg-purple-50/50">
                          {ref.awayWinPct.toFixed(1)}%
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              ref.rigorLevel === 'Alto Rigor'
                                ? 'bg-red-100 text-red-900 border border-red-300'
                                : ref.rigorLevel === 'Brando'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {ref.rigorLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

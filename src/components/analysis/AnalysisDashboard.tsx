import React, { useState, useMemo, useEffect } from 'react';
import {
  Globe,
  Trophy,
  Shield,
  ArrowRightLeft,
  Filter,
  Sliders,
  Calendar,
  Layers,
  Flame,
  Zap,
  BarChart3,
  Cpu,
  DollarSign,
  Search,
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';
import { DbState, Match, Team } from '../../types';
import { runFullMatchAnalysis, MatchAnalysisResult } from '../../utils/analysisEngine';
import { isValidImageUrl } from '../../utils/imageHelper';
import { FormTrackerSection } from './FormTrackerSection';
import { PowerRankingSection } from './PowerRankingSection';
import { DescriptiveStatsSection } from './DescriptiveStatsSection';
import { ProjectionsPoissonSection } from './ProjectionsPoissonSection';
import { ValueAndTacticalSection } from './ValueAndTacticalSection';
import { LeagueStandings } from '../LeagueStandings';

interface AnalysisDashboardProps {
  dbState: DbState;
  initialMatchId?: string | null;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ dbState, initialMatchId }) => {
  // Cascading Selection State
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedHomeTeamId, setSelectedHomeTeamId] = useState<string>('');
  const [selectedAwayTeamId, setSelectedAwayTeamId] = useState<string>('');

  // General Settings / Cut Parameters
  const [sampleSize, setSampleSize] = useState<number>(10); // 5, 10, 15, 20, 999
  const [venueMode, setVenueMode] = useState<'SPECIFIC' | 'GENERAL'>('SPECIFIC'); // SPECIFIC = Casa x Fora; GENERAL = Geral
  const [activeModuleTab, setActiveModuleTab] = useState<'ALL' | 'FORM' | 'POWER' | 'DESCRIPTIVE' | 'PROJECTIONS' | 'VALUE' | 'STANDINGS'>('ALL');

  // Quick match selection search
  const [matchSearchQuery, setMatchSearchQuery] = useState('');
  const [isQuickMatchPickerOpen, setIsQuickMatchPickerOpen] = useState(false);

  // Auto-select initial state or match if provided
  useEffect(() => {
    if (initialMatchId) {
      const match = dbState.matches.find(m => m.id === initialMatchId);
      if (match) {
        setSelectedCountryId(match.countryId || '');
        setSelectedLeagueId(match.leagueId || '');
        setSelectedHomeTeamId(match.homeTeamId || '');
        setSelectedAwayTeamId(match.awayTeamId || '');
        return;
      }
    }

    // Default initialization if nothing selected
    if (!selectedCountryId && dbState.countries.length > 0) {
      const firstCountry = dbState.countries[0];
      setSelectedCountryId(firstCountry.id);

      const countryLeagues = dbState.leagues.filter(l => l.countryId === firstCountry.id);
      if (countryLeagues.length > 0) {
        const firstLeague = countryLeagues[0];
        setSelectedLeagueId(firstLeague.id);

        const leagueTeams = dbState.teams.filter(
          t => t.leagueId === firstLeague.id || t.leagueIds?.includes(firstLeague.id)
        );
        if (leagueTeams.length >= 2) {
          setSelectedHomeTeamId(leagueTeams[0].id);
          setSelectedAwayTeamId(leagueTeams[1].id);
        } else if (dbState.teams.length >= 2) {
          setSelectedHomeTeamId(dbState.teams[0].id);
          setSelectedAwayTeamId(dbState.teams[1].id);
        }
      }
    }
  }, [dbState, initialMatchId]);

  // 1. Available Leagues filtered by Country
  const availableLeagues = useMemo(() => {
    if (!selectedCountryId) return dbState.leagues;
    return dbState.leagues.filter(l => l.countryId === selectedCountryId);
  }, [dbState.leagues, selectedCountryId]);

  // 2. Available Teams filtered by League
  const availableTeams = useMemo(() => {
    if (!selectedLeagueId) {
      if (!selectedCountryId) return dbState.teams;
      return dbState.teams.filter(t => t.countryId === selectedCountryId);
    }
    return dbState.teams.filter(
      t => t.leagueId === selectedLeagueId || t.leagueIds?.includes(selectedLeagueId)
    );
  }, [dbState.teams, selectedLeagueId, selectedCountryId]);

  // Handle Country change
  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId);
    const filteredLeagues = dbState.leagues.filter(l => l.countryId === countryId);
    if (filteredLeagues.length > 0) {
      const newLeague = filteredLeagues[0];
      setSelectedLeagueId(newLeague.id);
      const filteredTeams = dbState.teams.filter(
        t => t.leagueId === newLeague.id || t.leagueIds?.includes(newLeague.id)
      );
      if (filteredTeams.length >= 2) {
        setSelectedHomeTeamId(filteredTeams[0].id);
        setSelectedAwayTeamId(filteredTeams[1].id);
      } else {
        setSelectedHomeTeamId(filteredTeams[0]?.id || '');
        setSelectedAwayTeamId('');
      }
    } else {
      setSelectedLeagueId('');
      setSelectedHomeTeamId('');
      setSelectedAwayTeamId('');
    }
  };

  // Handle League change
  const handleLeagueChange = (leagueId: string) => {
    setSelectedLeagueId(leagueId);
    const filteredTeams = dbState.teams.filter(
      t => t.leagueId === leagueId || t.leagueIds?.includes(leagueId)
    );
    if (filteredTeams.length >= 2) {
      setSelectedHomeTeamId(filteredTeams[0].id);
      setSelectedAwayTeamId(filteredTeams[1].id);
    } else if (filteredTeams.length === 1) {
      setSelectedHomeTeamId(filteredTeams[0].id);
      setSelectedAwayTeamId('');
    }
  };

  // Swap Teams (Inverter Mandante e Visitante)
  const handleSwapTeams = () => {
    const temp = selectedHomeTeamId;
    setSelectedHomeTeamId(selectedAwayTeamId);
    setSelectedAwayTeamId(temp);
  };

  // Quick Select from existing scheduled or finished match
  const handleSelectFromMatch = (match: Match) => {
    setSelectedCountryId(match.countryId || '');
    setSelectedLeagueId(match.leagueId || '');
    setSelectedHomeTeamId(match.homeTeamId);
    setSelectedAwayTeamId(match.awayTeamId);
    setIsQuickMatchPickerOpen(false);
  };

  // Find active teams
  const homeTeam = useMemo(
    () => dbState.teams.find(t => t.id === selectedHomeTeamId),
    [dbState.teams, selectedHomeTeamId]
  );
  const awayTeam = useMemo(
    () => dbState.teams.find(t => t.id === selectedAwayTeamId),
    [dbState.teams, selectedAwayTeamId]
  );

  // Active match if existing between these two teams
  const activeMatch = useMemo(() => {
    if (!selectedHomeTeamId || !selectedAwayTeamId) return null;
    return dbState.matches.find(
      m => m.homeTeamId === selectedHomeTeamId && m.awayTeamId === selectedAwayTeamId
    ) || null;
  }, [dbState.matches, selectedHomeTeamId, selectedAwayTeamId]);

  // Run full analysis pipeline when inputs are ready
  const analysisResult = useMemo<MatchAnalysisResult | null>(() => {
    if (!homeTeam || !awayTeam || homeTeam.id === awayTeam.id) return null;

    return runFullMatchAnalysis(homeTeam, awayTeam, dbState, {
      sampleSize,
      venueMode,
      activeMatch,
    });
  }, [homeTeam, awayTeam, dbState, sampleSize, venueMode, activeMatch]);

  // Recent/Scheduled matches for quick picker
  const filteredMatchesForPicker = useMemo(() => {
    const q = matchSearchQuery.toLowerCase().trim();
    const sorted = [...dbState.matches].sort(
      (a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
    );
    if (!q) return sorted.slice(0, 15);
    return sorted.filter(
      m =>
        m.homeTeamName.toLowerCase().includes(q) ||
        m.awayTeamName.toLowerCase().includes(q) ||
        m.leagueName.toLowerCase().includes(q) ||
        m.countryName.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [dbState.matches, matchSearchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & CASCADING FILTERS BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        {/* Title and Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Módulo de Análise Estatística & Power Ranking
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Modelagem matemática de força, projeções de Poisson, métricas descritivas e scanner +EV
              </p>
            </div>
          </div>

          {/* Quick Match Picker Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsQuickMatchPickerOpen(!isQuickMatchPickerOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Carregar de Jogo Cadastrado</span>
            </button>
          </div>
        </div>

        {/* Quick Match Picker Collapsible Drawer */}
        {isQuickMatchPickerOpen && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                Selecione uma Partida para Análise Imediata:
              </span>
              <button
                type="button"
                onClick={() => setIsQuickMatchPickerOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold"
              >
                Fechar ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por time, liga ou país..."
                value={matchSearchQuery}
                onChange={e => setMatchSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {filteredMatchesForPicker.map(m => (
                <div
                  key={m.id}
                  onClick={() => handleSelectFromMatch(m)}
                  className="flex items-center justify-between p-2.5 bg-white hover:bg-blue-50/80 rounded-xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {m.matchDate ? new Date(m.matchDate).toLocaleDateString('pt-BR') : ''}
                    </span>
                    <span className="font-bold text-slate-900">{m.homeTeamName}</span>
                    <span className="text-slate-400">x</span>
                    <span className="font-bold text-slate-900">{m.awayTeamName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {m.leagueName}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      m.status === 'FINALIZADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {m.status === 'FINALIZADO' ? `${m.homeScore}-${m.awayScore}` : 'Agendado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 Cascading Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Selector 1: Country */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              1. País
            </label>
            <select
              value={selectedCountryId}
              onChange={e => handleCountryChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">Todos os Países</option>
              {dbState.countries.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector 2: League */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              2. Liga / Campeonato
            </label>
            <select
              value={selectedLeagueId}
              onChange={e => handleLeagueChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">Todas as Ligas</option>
              {availableLeagues.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector 3: Home Team */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              3. Time Mandante (Casa)
            </label>
            <select
              value={selectedHomeTeamId}
              onChange={e => setSelectedHomeTeamId(e.target.value)}
              className="w-full px-3 py-2 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">Selecione o Mandante...</option>
              {availableTeams.map(t => (
                <option key={t.id} value={t.id} disabled={t.id === selectedAwayTeamId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector 4: Away Team */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                4. Time Visitante (Fora)
              </label>
              <button
                type="button"
                onClick={handleSwapTeams}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                title="Inverter mando de campo (Home x Away)"
              >
                <ArrowRightLeft className="w-3 h-3" /> Inverter
              </button>
            </div>
            <select
              value={selectedAwayTeamId}
              onChange={e => setSelectedAwayTeamId(e.target.value)}
              className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">Selecione o Visitante...</option>
              {availableTeams.map(t => (
                <option key={t.id} value={t.id} disabled={t.id === selectedHomeTeamId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cut Parameters / General Settings */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Sample size & Venue Mode controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sample size */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-600" /> Amostra:
              </span>
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                {[5, 10, 15, 20, 999].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSampleSize(n)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                      sampleSize === n
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {n === 999 ? 'Todos' : `${n} Jogos`}
                  </button>
                ))}
              </div>
            </div>

            {/* Venue Weighting */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-blue-600" /> Ponderação:
              </span>
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setVenueMode('SPECIFIC')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    venueMode === 'SPECIFIC'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Mandante atuando em Casa vs Visitante atuando Fora"
                >
                  Mando Específico (Casa x Fora)
                </button>
                <button
                  type="button"
                  onClick={() => setVenueMode('GENERAL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    venueMode === 'GENERAL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Últimos jogos de ambas equipes independente do mando"
                >
                  Mando Geral (Todos Jogos)
                </button>
              </div>
            </div>
          </div>

          {/* Active Teams Banner Indicator */}
          {homeTeam && awayTeam && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-800">
              <span>{homeTeam.name}</span>
              <span className="text-slate-400">vs</span>
              <span>{awayTeam.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS BY MODULE */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveModuleTab('ALL')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeModuleTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Visão Completa (Todos Módulos)
        </button>

        <button
          type="button"
          onClick={() => setActiveModuleTab('FORM')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeModuleTab === 'FORM'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          Módulo 1: Forma Recente
        </button>

        <button
          type="button"
          onClick={() => setActiveModuleTab('POWER')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeModuleTab === 'POWER'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-indigo-500" />
          Módulo 2: Power Ranking
        </button>

        <button
          type="button"
          onClick={() => setActiveModuleTab('DESCRIPTIVE')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeModuleTab === 'DESCRIPTIVE'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
          Módulo 3: Estatísticas Descritivas
        </button>

        <button
          type="button"
          onClick={() => setActiveModuleTab('PROJECTIONS')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeModuleTab === 'PROJECTIONS'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-purple-500" />
          Módulo 4: Projeção & Poisson
        </button>

        <button
          type="button"
          onClick={() => setActiveModuleTab('VALUE')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeModuleTab === 'VALUE'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          Módulo 5: +EV & Tático
        </button>

        <button
          type="button"
          onClick={() => setActiveModuleTab('STANDINGS')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeModuleTab === 'STANDINGS'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20 ring-2 ring-amber-300'
              : 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          Módulo 6: Tabela & Classificação
        </button>
      </div>

      {/* 3. ANALYSIS RENDERER */}
      {activeModuleTab === 'STANDINGS' ? (
        <div className="space-y-4">
          <LeagueStandings
            dbState={dbState}
            initialLeagueId={selectedLeagueId}
            initialHomeTeamId={selectedHomeTeamId}
            initialAwayTeamId={selectedAwayTeamId}
          />
        </div>
      ) : !analysisResult ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <Shield className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Selecione duas equipes distintas para iniciar a análise</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Utilize os seletores em cascata acima (País → Liga → Mandante → Visitante) ou clique em "Carregar de Jogo Cadastrado" para gerar o relatório completo.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveModuleTab('STANDINGS')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all hover:scale-105"
            >
              <Trophy className="w-4 h-4 fill-slate-950" />
              Ver Tabela de Classificação da Liga Selecionada
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* MÓDULO 1: Forma Recente */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'FORM') && (
            <FormTrackerSection analysis={analysisResult} />
          )}

          {/* MÓDULO 2: Power Ranking Ponderado */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'POWER') && (
            <PowerRankingSection analysis={analysisResult} />
          )}

          {/* MÓDULO 3: Estatísticas Descritivas */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'DESCRIPTIVE') && (
            <DescriptiveStatsSection analysis={analysisResult} />
          )}

          {/* MÓDULO 4: Projeções Contínuas & Matriz de Poisson */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'PROJECTIONS') && (
            <ProjectionsPoissonSection analysis={analysisResult} />
          )}

          {/* MÓDULO 5: Indicador +EV, Diferencial HT/FT & Árbitro */}
          {(activeModuleTab === 'ALL' || activeModuleTab === 'VALUE') && (
            <ValueAndTacticalSection analysis={analysisResult} />
          )}

          {/* MÓDULO 6: Tabela & Classificação Dinâmica da Competição */}
          {activeModuleTab === 'ALL' && (
            <div className="space-y-4 pt-4 border-t-2 border-slate-200">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" />
                    Módulo 6: Tabela e Classificação Oficial da Liga
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Acompanhe o impacto do confronto na pontuação, saldo de gols e critérios de desempate da competição.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModuleTab('STANDINGS')}
                  className="px-3 py-1.5 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  Expandir Tabela
                </button>
              </div>
              <LeagueStandings
                dbState={dbState}
                initialLeagueId={selectedLeagueId}
                initialHomeTeamId={selectedHomeTeamId}
                initialAwayTeamId={selectedAwayTeamId}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

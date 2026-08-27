import React from 'react';
import { BarChart3, Trophy, Shield, Activity, Target, Zap, ArrowRight } from 'lucide-react';
import { DbState } from '../types';
import { LeagueStandings } from './LeagueStandings';

interface StatsDashboardProps {
  dbState: DbState;
  onNavigateToAnalysis?: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ dbState, onNavigateToAnalysis }) => {
  const matches = Array.isArray(dbState.matches) ? dbState.matches : [];
  const teams = Array.isArray(dbState.teams) ? dbState.teams : [];
  const leagues = Array.isArray(dbState.leagues) ? dbState.leagues : [];

  const totalMatches = matches.length;
  const finishedMatches = matches.filter(m => m.status === 'FINALIZADO');
  const scheduledMatches = matches.filter(m => m.status === 'AGENDADO');
  const liveMatches = matches.filter(m => m.status === 'EM_ANDAMENTO');

  let totalGoals = 0;
  finishedMatches.forEach(m => {
    totalGoals += (m.homeScore || 0) + (m.awayScore || 0);
  });

  const avgGoals = finishedMatches.length > 0 ? (totalGoals / finishedMatches.length).toFixed(2) : '0.00';

  // Team Goals & Wins calculation
  const teamStatsMap: Record<string, { name: string; goals: string; matches: number; wins: number; logoUrl?: string }> = {};

  teams.forEach(t => {
    teamStatsMap[t.id] = { name: t.name, goals: '0', matches: 0, wins: 0, logoUrl: t.logoUrl };
  });

  finishedMatches.forEach(m => {
    const hScore = m.homeScore || 0;
    const aScore = m.awayScore || 0;

    if (teamStatsMap[m.homeTeamId]) {
      teamStatsMap[m.homeTeamId].matches += 1;
      teamStatsMap[m.homeTeamId].goals = String(parseInt(teamStatsMap[m.homeTeamId].goals, 10) + hScore);
      if (hScore > aScore) teamStatsMap[m.homeTeamId].wins += 1;
    }

    if (teamStatsMap[m.awayTeamId]) {
      teamStatsMap[m.awayTeamId].matches += 1;
      teamStatsMap[m.awayTeamId].goals = String(parseInt(teamStatsMap[m.awayTeamId].goals, 10) + aScore);
      if (aScore > hScore) teamStatsMap[m.awayTeamId].wins += 1;
    }
  });

  const sortedTeams = Object.values(teamStatsMap)
    .filter(t => t.matches > 0)
    .sort((a, b) => parseInt(b.goals, 10) - parseInt(a.goals, 10))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Banner de Acesso Rápido ao Módulo de Análise & Power Ranking */}
      {onNavigateToAnalysis && (
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 rounded-2xl p-4 sm:p-5 text-white shadow-xl shadow-indigo-950/20 border border-indigo-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 font-black shrink-0 shadow-lg shadow-amber-400/20 border border-amber-300">
              <Zap className="w-6 h-6 fill-slate-950 text-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  Módulo de Análise Estatística & Power Ranking
                </h3>
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow-xs">
                  Avançado
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                Acesse o modelo preditivo de Poisson, Power Ranking com ponderação de mando, dispersão estatística e radar de confrontos direto.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToAnalysis}
            className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.98] shrink-0 cursor-pointer border border-amber-300"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Abrir Painel de Análise</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* 1. Main League Standings Section (Ranked by % Aproveitamento) */}
      <LeagueStandings dbState={dbState} />

      {/* 2. Global Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Jogos</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{totalMatches}</span>
            <span className="text-xs text-slate-500 block mt-1">partidas cadastradas no banco</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Gols</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{totalGoals}</span>
            <span className="text-xs text-slate-500 block mt-1">gols marcados em {finishedMatches.length} jogos</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Média de Gols/Jogo</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{avgGoals}</span>
            <span className="text-xs text-slate-500 block mt-1">por partida finalizada</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status das Partidas</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold">
            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              {finishedMatches.length} Fim
            </span>
            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {scheduledMatches.length} Agend
            </span>
            <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
              {liveMatches.length} Ao Vivo
            </span>
          </div>
        </div>
      </div>

      {/* 3. Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Scoring Teams */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Times Mais Goleadores (Geral)
          </h4>

          {sortedTeams.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Nenhuma partida finalizada para calcular artilharia.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedTeams.map((team, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-800">{team.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{team.matches} jogos • {team.wins} vitórias</span>
                    <span className="font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                      {team.goals} Gols
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Matches Per League */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-blue-600" />
            Partidas Cadastradas por Liga
          </h4>

          {leagues.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Nenhuma liga cadastrada.
            </p>
          ) : (
            <div className="space-y-2">
              {leagues.map(league => {
                const count = matches.filter(m => m.leagueId === league.id).length;
                return (
                  <div
                    key={league.id}
                    className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{league.name}</span>
                      <span className="text-slate-500 text-[10px] block">{league.countryName}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {league.id}
                      </span>
                      <span className="text-slate-700 font-bold">{count} partidas</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

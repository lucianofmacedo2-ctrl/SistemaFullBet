import React from 'react';
import { BarChart3, Trophy, Shield, Activity, Target } from 'lucide-react';
import { DbState } from '../types';
import { LeagueStandings } from './LeagueStandings';

interface StatsDashboardProps {
  dbState: DbState;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ dbState }) => {
  const matches = dbState.matches;

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

  dbState.teams.forEach(t => {
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

          {dbState.leagues.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Nenhuma liga cadastrada.
            </p>
          ) : (
            <div className="space-y-2">
              {dbState.leagues.map(league => {
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

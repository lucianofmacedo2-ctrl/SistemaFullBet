import React from 'react';
import { BarChart3, Trophy, Globe, Shield, Activity, Target } from 'lucide-react';
import { DbState } from '../types';

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
  const teamStatsMap: Record<string, { name: string; goals: string; matches: number; wins: number }> = {};

  dbState.teams.forEach(t => {
    teamStatsMap[t.id] = { name: t.name, goals: '0', matches: 0, wins: 0 };
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
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e0e0e] border border-white/10 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total de Jogos</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white">{totalMatches}</span>
            <span className="text-xs text-gray-400 block mt-1">partidas cadastradas no banco</span>
          </div>
        </div>

        <div className="bg-[#0e0e0e] border border-white/10 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total de Gols</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white">{totalGoals}</span>
            <span className="text-xs text-gray-400 block mt-1">gols marcados em {finishedMatches.length} jogos</span>
          </div>
        </div>

        <div className="bg-[#0e0e0e] border border-white/10 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Média de Gols/Jogo</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white">{avgGoals}</span>
            <span className="text-xs text-gray-400 block mt-1">por partida finalizada</span>
          </div>
        </div>

        <div className="bg-[#0e0e0e] border border-white/10 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status das Partidas</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold">
            <span className="px-2 py-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
              {finishedMatches.length} Fim
            </span>
            <span className="px-2 py-1 rounded bg-blue-950/80 text-blue-400 border border-blue-500/30">
              {scheduledMatches.length} Agend
            </span>
            <span className="px-2 py-1 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30">
              {liveMatches.length} Ao Vivo
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Scoring Teams */}
        <div className="bg-[#0e0e0e] border border-white/10 p-5 rounded-2xl shadow-xl space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Times Mais Goleadores
          </h4>

          {sortedTeams.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">
              Nenhuma partida finalizada para calcular artilharia.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedTeams.map((team, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-[#060606] p-3 rounded-xl border border-white/10 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-gray-200">{team.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">{team.matches} jogos • {team.wins} vitórias</span>
                    <span className="font-mono font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/30">
                      {team.goals} Gols
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Matches Per League */}
        <div className="bg-[#0e0e0e] border border-white/10 p-5 rounded-2xl shadow-xl space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            Jogos por Liga
          </h4>

          {dbState.leagues.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">
              Nenhuma liga cadastrada.
            </p>
          ) : (
            <div className="space-y-2">
              {dbState.leagues.map(league => {
                const count = matches.filter(m => m.leagueId === league.id).length;
                return (
                  <div
                    key={league.id}
                    className="flex items-center justify-between bg-[#060606] p-3 rounded-xl border border-white/10 text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-200">{league.name}</span>
                      <span className="text-gray-500 text-[10px] block">{league.countryName}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        {league.id}
                      </span>
                      <span className="text-gray-300 font-bold">{count} partidas</span>
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

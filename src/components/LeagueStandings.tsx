import React, { useState, useMemo } from 'react';
import { Trophy, Shield, Filter, Award, Target, Flame, TrendingUp, Info } from 'lucide-react';
import { DbState, League, Match, Team } from '../types';

interface LeagueStandingsProps {
  dbState: DbState;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  logoUrl?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  maxPossiblePoints: number;
  pointsPercentage: number; // Aproveitamento (%)
  recentForm: Array<'V' | 'E' | 'D'>;
}

export const LeagueStandings: React.FC<LeagueStandingsProps> = ({ dbState }) => {
  const { leagues, matches, teams } = dbState;

  // Selected league state (default to first league or 'ALL' if empty)
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(() => {
    return leagues.length > 0 ? leagues[0].id : 'ALL';
  });

  // Filter venue: 'ALL' | 'HOME' | 'AWAY'
  const [venueFilter, setVenueFilter] = useState<'ALL' | 'HOME' | 'AWAY'>('ALL');

  // If selectedLeagueId is invalid/deleted, default to first available
  const currentLeague = leagues.find(l => l.id === selectedLeagueId);

  // Compute standings for the selected league
  const standings = useMemo(() => {
    // 1. Filter matches by league and status
    const finishedMatches = matches.filter(m => {
      if (m.status !== 'FINALIZADO') return false;
      if (selectedLeagueId !== 'ALL' && m.leagueId !== selectedLeagueId) return false;
      return true;
    });

    // 2. Identify all teams involved in this league (from team list or match records)
    const teamMap: Record<string, TeamStanding> = {};

    // First populate teams registered under this league (if selectedLeagueId !== 'ALL')
    teams.forEach(t => {
      // Include team if selectedLeagueId is ALL or if team played in filtered matches
      teamMap[t.id] = {
        teamId: t.id,
        teamName: t.name,
        logoUrl: t.logoUrl,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        maxPossiblePoints: 0,
        pointsPercentage: 0,
        recentForm: [],
      };
    });

    // Sort matches chronologically to calculate form correctly
    const sortedMatches = [...finishedMatches].sort(
      (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
    );

    // Track matches per team for form
    const teamMatchResults: Record<string, Array<{ outcome: 'V' | 'E' | 'D'; date: string }>> = {};

    sortedMatches.forEach(m => {
      const hScore = m.homeScore ?? 0;
      const aScore = m.awayScore ?? 0;

      // Ensure home & away teams exist in map
      if (!teamMap[m.homeTeamId]) {
        teamMap[m.homeTeamId] = {
          teamId: m.homeTeamId,
          teamName: m.homeTeamName,
          logoUrl: m.homeTeamLogoUrl,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          maxPossiblePoints: 0,
          pointsPercentage: 0,
          recentForm: [],
        };
      }

      if (!teamMap[m.awayTeamId]) {
        teamMap[m.awayTeamId] = {
          teamId: m.awayTeamId,
          teamName: m.awayTeamName,
          logoUrl: m.awayTeamLogoUrl,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          maxPossiblePoints: 0,
          pointsPercentage: 0,
          recentForm: [],
        };
      }

      if (!teamMatchResults[m.homeTeamId]) teamMatchResults[m.homeTeamId] = [];
      if (!teamMatchResults[m.awayTeamId]) teamMatchResults[m.awayTeamId] = [];

      // HOME TEAM calculations
      if (venueFilter === 'ALL' || venueFilter === 'HOME') {
        const hStanding = teamMap[m.homeTeamId];
        hStanding.played += 1;
        hStanding.goalsFor += hScore;
        hStanding.goalsAgainst += aScore;

        if (hScore > aScore) {
          hStanding.wins += 1;
          hStanding.points += 3;
          teamMatchResults[m.homeTeamId].push({ outcome: 'V', date: m.matchDate });
        } else if (hScore === aScore) {
          hStanding.draws += 1;
          hStanding.points += 1;
          teamMatchResults[m.homeTeamId].push({ outcome: 'E', date: m.matchDate });
        } else {
          hStanding.losses += 1;
          teamMatchResults[m.homeTeamId].push({ outcome: 'D', date: m.matchDate });
        }
      }

      // AWAY TEAM calculations
      if (venueFilter === 'ALL' || venueFilter === 'AWAY') {
        const aStanding = teamMap[m.awayTeamId];
        aStanding.played += 1;
        aStanding.goalsFor += aScore;
        aStanding.goalsAgainst += hScore;

        if (aScore > hScore) {
          aStanding.wins += 1;
          aStanding.points += 3;
          teamMatchResults[m.awayTeamId].push({ outcome: 'V', date: m.matchDate });
        } else if (aScore === hScore) {
          aStanding.draws += 1;
          aStanding.points += 1;
          teamMatchResults[m.awayTeamId].push({ outcome: 'E', date: m.matchDate });
        } else {
          aStanding.losses += 1;
          teamMatchResults[m.awayTeamId].push({ outcome: 'D', date: m.matchDate });
        }
      }
    });

    // 3. Finalize calculations (% aproveitamento, goal difference, recent form)
    const resultList: TeamStanding[] = [];

    Object.values(teamMap).forEach(s => {
      // Only show teams that played at least 1 match if selected league is 'ALL',
      // or if specific league selected, show teams that belong to that league or have played
      if (s.played === 0 && selectedLeagueId === 'ALL') return;

      s.goalDifference = s.goalsFor - s.goalsAgainst;
      s.maxPossiblePoints = s.played * 3;
      s.pointsPercentage = s.played > 0 ? (s.points / s.maxPossiblePoints) * 100 : 0;

      // Last 5 games form
      const history = teamMatchResults[s.teamId] || [];
      s.recentForm = history.slice(-5).map(h => h.outcome);

      resultList.push(s);
    });

    // 4. Sort by APROVEITAMENTO (%) PRIMARY, then Tie-breakers
    resultList.sort((a, b) => {
      // Primary criterion: Points Percentage (%)
      if (Math.abs(b.pointsPercentage - a.pointsPercentage) > 0.001) {
        return b.pointsPercentage - a.pointsPercentage;
      }
      // 2nd: Points
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // 3rd: Wins
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      // 4th: Goal Difference
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      // 5th: Goals For
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      // 6th: Goals Against (fewer is better)
      if (a.goalsAgainst !== b.goalsAgainst) {
        return a.goalsAgainst - b.goalsAgainst;
      }
      // 7th: Alphabetical
      return a.teamName.localeCompare(b.teamName);
    });

    return resultList;
  }, [matches, teams, selectedLeagueId, venueFilter]);

  // Highlight stats
  const leader = standings.length > 0 && standings[0].played > 0 ? standings[0] : null;
  const bestAttack = [...standings].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const bestDefense = [...standings].filter(s => s.played > 0).sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            Classificação por Aproveitamento (%)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tabela do campeonato ordenada prioritariamente pelo percentual de aproveitamento dos pontos disputados.
          </p>
        </div>

        {/* League Selector Dropdown */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full md:w-auto">
            <Filter className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Liga:</span>
            <select
              value={selectedLeagueId}
              onChange={(e) => setSelectedLeagueId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer w-full"
            >
              <option value="ALL">Todas as Ligas Integradas</option>
              {leagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name} ({league.countryName})
                </option>
              ))}
            </select>
          </div>

          {/* Venue Toggle Buttons (Geral / Mandante / Visitante) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setVenueFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                venueFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Geral
            </button>
            <button
              onClick={() => setVenueFilter('HOME')}
              className={`px-3 py-1 rounded-lg transition-all ${
                venueFilter === 'HOME'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Em Casa
            </button>
            <button
              onClick={() => setVenueFilter('AWAY')}
              className={`px-3 py-1 rounded-lg transition-all ${
                venueFilter === 'AWAY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fora
            </button>
          </div>
        </div>
      </div>

      {/* Selected League Banner Info */}
      {currentLeague && (
        <div className="flex items-center justify-between p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
          <div className="flex items-center gap-3">
            {currentLeague.logoUrl ? (
              <img
                src={currentLeague.logoUrl}
                alt={currentLeague.name}
                className="w-9 h-9 object-contain rounded-md bg-white p-1 border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Trophy className="w-5 h-5" />
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {currentLeague.name}
                <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                  {currentLeague.countryName}
                </span>
              </h4>
              <p className="text-xs text-slate-500">
                Formato: {currentLeague.type || 'Pontos Corridos'} • Jogos concluídos na liga:{' '}
                <span className="font-bold text-slate-800">
                  {matches.filter(m => m.leagueId === currentLeague.id && m.status === 'FINALIZADO').length}
                </span>
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Rank por % de Pontos
            </span>
          </div>
        </div>
      )}

      {/* Highlights Mini Cards */}
      {standings.length > 0 && leader && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Leader Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-3.5 rounded-xl border border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                👑 1º Lugar (Líder em Aproveitamento)
              </span>
              <span className="text-sm font-black text-slate-900 block truncate mt-0.5">
                {leader.teamName}
              </span>
              <span className="text-xs font-bold text-blue-600">
                {leader.pointsPercentage.toFixed(1)}% ({leader.points} pts / {leader.played} J)
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
              {leader.logoUrl ? (
                <img src={leader.logoUrl} alt={leader.teamName} className="w-7 h-7 object-contain" />
              ) : (
                <Award className="w-5 h-5 text-amber-500" />
              )}
            </div>
          </div>

          {/* Best Attack */}
          {bestAttack && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  ⚽ Melhor Ataque
                </span>
                <span className="text-sm font-bold text-slate-900 block truncate mt-0.5">
                  {bestAttack.teamName}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {bestAttack.goalsFor} gols marcados
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          )}

          {/* Best Defense */}
          {bestDefense && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  🛡️ Melhor Defesa
                </span>
                <span className="text-sm font-bold text-slate-900 block truncate mt-0.5">
                  {bestDefense.teamName}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {bestDefense.goalsAgainst} gols sofridos
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Classification Table */}
      {standings.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            Nenhuma partida finalizada para calcular a classificação desta liga.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cadastre jogos e atualize o placar final para gerar a tabela de aproveitamento em tempo real!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3">TIME</th>
                <th className="p-3 text-center bg-blue-50/80 text-blue-700 border-x border-blue-100 font-black" title="Aproveitamento dos Pontos disputados">
                  APROV. (%)
                </th>
                <th className="p-3 text-center font-black text-slate-900">PTS</th>
                <th className="p-3 text-center">J</th>
                <th className="p-3 text-center text-emerald-700">V</th>
                <th className="p-3 text-center text-amber-700">E</th>
                <th className="p-3 text-center text-red-700">D</th>
                <th className="p-3 text-center">GP</th>
                <th className="p-3 text-center">GC</th>
                <th className="p-3 text-center font-bold">SG</th>
                <th className="p-3 text-center w-32">ÚLTIMOS JOGOS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {standings.map((item, index) => {
                const rank = index + 1;
                const isLeader = rank === 1;
                const isTop3 = rank <= 3;

                return (
                  <tr
                    key={item.teamId}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isLeader ? 'bg-blue-50/30 font-semibold' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="p-3 text-center font-mono font-bold">
                      {isLeader ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-900 text-[11px] font-black shadow-xs">
                          1º
                        </span>
                      ) : isTop3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-[11px] font-bold">
                          {rank}º
                        </span>
                      ) : (
                        <span className="text-slate-500">{rank}º</span>
                      )}
                    </td>

                    {/* Team Name & Logo */}
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {item.logoUrl ? (
                            <img src={item.logoUrl} alt={item.teamName} className="w-5 h-5 object-contain" />
                          ) : (
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <span className={`text-slate-900 ${isLeader ? 'font-black text-sm' : 'font-bold'}`}>
                          {item.teamName}
                        </span>
                      </div>
                    </td>

                    {/* Aproveitamento (%) - HIGHLIGHTED */}
                    <td className="p-3 text-center bg-blue-50/50 border-x border-blue-100 font-mono font-black text-blue-700 text-xs">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {item.pointsPercentage.toFixed(1)}%
                      </span>
                    </td>

                    {/* Points */}
                    <td className="p-3 text-center font-mono font-black text-slate-900 text-sm">
                      {item.points}
                    </td>

                    {/* Played */}
                    <td className="p-3 text-center font-mono font-bold text-slate-700">
                      {item.played}
                    </td>

                    {/* Wins */}
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">
                      {item.wins}
                    </td>

                    {/* Draws */}
                    <td className="p-3 text-center font-mono font-bold text-amber-600">
                      {item.draws}
                    </td>

                    {/* Losses */}
                    <td className="p-3 text-center font-mono font-bold text-red-600">
                      {item.losses}
                    </td>

                    {/* Goals For */}
                    <td className="p-3 text-center font-mono text-slate-600">
                      {item.goalsFor}
                    </td>

                    {/* Goals Against */}
                    <td className="p-3 text-center font-mono text-slate-600">
                      {item.goalsAgainst}
                    </td>

                    {/* Goal Difference */}
                    <td className="p-3 text-center font-mono font-bold">
                      <span
                        className={
                          item.goalDifference > 0
                            ? 'text-emerald-600'
                            : item.goalDifference < 0
                            ? 'text-red-600'
                            : 'text-slate-500'
                        }
                      >
                        {item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}
                      </span>
                    </td>

                    {/* Recent Form (Last 5 matches) */}
                    <td className="p-3 text-center">
                      {item.recentForm.length === 0 ? (
                        <span className="text-[10px] text-slate-400 font-mono">-</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1 font-mono">
                          {item.recentForm.map((res, i) => (
                            <span
                              key={i}
                              title={res === 'V' ? 'Vitória' : res === 'E' ? 'Empate' : 'Derrota'}
                              className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                                res === 'V'
                                  ? 'bg-emerald-500 text-white'
                                  : res === 'E'
                                  ? 'bg-amber-400 text-slate-900'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {res}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Info Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            <b>Fórmula de Aproveitamento (%):</b> (Pontos Ganhos ÷ Pontos Possíveis) × 100.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> V = Vitória (3pts)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> E = Empate (1pt)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> D = Derrota (0pt)
          </span>
        </div>
      </div>
    </div>
  );
};

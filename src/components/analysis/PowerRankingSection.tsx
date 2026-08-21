import React from 'react';
import { Award, Zap, TrendingUp, ShieldAlert, Target, DollarSign, Percent, BarChart2 } from 'lucide-react';
import { MatchAnalysisResult, TeamPowerRating } from '../../utils/analysisEngine';
import { isValidImageUrl } from '../../utils/imageHelper';

interface PowerRankingSectionProps {
  analysis: MatchAnalysisResult;
}

export const PowerRankingSection: React.FC<PowerRankingSectionProps> = ({ analysis }) => {
  const { homeTeam, awayTeam, homePower, awayPower, sampleSize, venueMode } = analysis;

  const renderTeamPowerCard = (
    power: TeamPowerRating,
    teamName: string,
    logoUrl?: string,
    role: 'home' | 'away' = 'home'
  ) => {
    const isHome = role === 'home';
    const accentColor = isHome ? 'blue' : 'amber';
    const ringColor = isHome ? 'border-blue-500' : 'border-amber-500';

    return (
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 space-y-5 shadow-xs">
        {/* Header with Composite Rating Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {isValidImageUrl(logoUrl) ? (
              <img
                src={logoUrl}
                alt={teamName}
                className="w-9 h-9 object-contain rounded-lg bg-white p-1 border border-slate-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-9 h-9 rounded-lg font-bold flex items-center justify-center text-sm ${
                isHome ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {teamName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isHome ? 'text-blue-600' : 'text-amber-600'}`}>
                {isHome ? 'Mandante' : 'Visitante'} ({venueMode === 'SPECIFIC' ? (isHome ? 'Em Casa' : 'Fora') : 'Geral'})
              </span>
              <h4 className="text-base font-black text-slate-900 leading-tight">{teamName}</h4>
            </div>
          </div>

          {/* Composite Score Circle */}
          <div className="text-right">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-white font-black text-sm shadow-xs ${
              power.compositeRating >= 70
                ? 'bg-emerald-600'
                : power.compositeRating >= 50
                ? 'bg-blue-600'
                : 'bg-amber-600'
            }`}>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{power.compositeRating}</span>
              <span className="text-[10px] opacity-80">/100</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-bold">Power Index</span>
          </div>
        </div>

        {/* 1. Base Performance Metrics */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            1. Desempenho Base ({power.matchesPlayed} jogos)
          </span>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Aproveitamento</span>
              <span className="text-sm font-black text-slate-900">
                {power.pointsRatePct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                {power.points}/{power.maxPoints} pts
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Gols Feitos (FT)</span>
              <span className="text-sm font-black text-emerald-700">
                {power.goalsForAvg.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                HT: {power.goalsForHTAvg.toFixed(2)}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Gols Sofridos (FT)</span>
              <span className="text-sm font-black text-rose-700">
                {power.goalsAgainstAvg.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                HT: {power.goalsAgainstHTAvg.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold px-2 py-1 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-600">Registro na Amostra:</span>
            <span className="font-mono font-bold text-slate-800">
              {power.wins}V - {power.draws}E - {power.losses}D (Saldo: {power.goalDiffAvg >= 0 ? `+${power.goalDiffAvg.toFixed(2)}` : power.goalDiffAvg.toFixed(2)}/jogo)
            </span>
          </div>
        </div>

        {/* 2. Weighting by Odds (Dificuldade do Oponente) */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            2. Ponderação por Dificuldade de Oponente (Odds)
          </span>

          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-800">
                Peso Médio de Resultado: <span className="font-mono text-blue-700">{power.opponentOddsWeightScore.toFixed(2)} pts</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Calculado como R × Odd do Adversário (W=1, D=0.5, L=0). Vitórias contra favoritos somam maior peso.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Efficiency & Expected Metrics (xG / Shots) */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-600" />
            3. Eficiência & Métricas Esperadas
          </span>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block">Eficiência Ofensiva (GF / xG)</span>
              <span className={`text-sm font-black ${power.offensiveEfficiency >= 1.05 ? 'text-emerald-700' : power.offensiveEfficiency >= 0.95 ? 'text-slate-800' : 'text-amber-700'}`}>
                {power.offensiveEfficiency.toFixed(2)}x
              </span>
              <span className="text-[10px] text-slate-400 block">
                {power.offensiveEfficiency >= 1.1 ? 'Letal / Finalizador Preciso' : power.offensiveEfficiency < 0.9 ? 'Desperdiça Oportunidades' : 'Conversão Equilibrada'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block">Eficiência Defensiva (GS / xG)</span>
              <span className={`text-sm font-black ${power.defensiveEfficiency <= 0.95 ? 'text-emerald-700' : power.defensiveEfficiency <= 1.1 ? 'text-slate-800' : 'text-rose-700'}`}>
                {power.defensiveEfficiency.toFixed(2)}x
              </span>
              <span className="text-[10px] text-slate-400 block">
                {power.defensiveEfficiency <= 0.9 ? 'Defesa Sólida / Goleiro Seguro' : power.defensiveEfficiency > 1.15 ? 'Cede Gols Evitáveis' : 'Defesa Normal'}
              </span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-semibold">Volume de Finalizações:</span>
            <span className="font-mono font-bold text-slate-800">
              {power.shotsVolumeAvg.toFixed(1)} chutes ({power.shotsOnTargetAvg.toFixed(1)} no gol) vs {power.shotsConcededAvg.toFixed(1)} cedidos
            </span>
          </div>
        </div>

        {/* 4. Betting Lines Performance */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            4. Cobertura de Linhas de Mercado
          </span>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-bold">HA Cover %</span>
              <span className="text-xs font-black text-indigo-700 font-mono">
                {power.asianHandicapCoverRatePct.toFixed(0)}%
              </span>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-bold">Over 2.5 %</span>
              <span className="text-xs font-black text-emerald-700 font-mono">
                {power.over25RatePct.toFixed(0)}%
              </span>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-bold">Ambas Marcam %</span>
              <span className="text-xs font-black text-blue-700 font-mono">
                {power.bttsRatePct.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 pt-1 font-semibold">
            <span>Clean Sheet (Sem levar gol): <strong>{power.cleanSheetRatePct.toFixed(0)}%</strong></span>
            <span>Sem Marcar Gol: <strong>{power.failedToScoreRatePct.toFixed(0)}%</strong></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            Módulo 2: Índice de Força das Equipes (Power Ranking Ponderado)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Rating dinâmico ponderando aproveitamento real, dificuldade de oponentes (Odds), eficiência esperada (xG) e desempenho em linhas de mercado
          </p>
        </div>

        {/* Global comparison bar */}
        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold block leading-none">Comparativo</span>
            <span className="text-xs font-bold text-slate-800">
              {homePower.compositeRating > awayPower.compositeRating
                ? `${homeTeam.name} +${homePower.compositeRating - awayPower.compositeRating} pts`
                : awayPower.compositeRating > homePower.compositeRating
                ? `${awayTeam.name} +${awayPower.compositeRating - homePower.compositeRating} pts`
                : 'Índices Equilibrados'}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Team Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTeamPowerCard(homePower, homeTeam.name, homeTeam.logoUrl, 'home')}
        {renderTeamPowerCard(awayPower, awayTeam.name, awayTeam.logoUrl, 'away')}
      </div>
    </div>
  );
};

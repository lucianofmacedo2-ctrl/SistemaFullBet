import React, { useState } from 'react';
import { Cpu, Target, Flag, Activity, Trophy, Percent, HelpCircle, Layers, Grid } from 'lucide-react';
import { MatchAnalysisResult } from '../../utils/analysisEngine';
import { isValidImageUrl } from '../../utils/imageHelper';

interface ProjectionsPoissonSectionProps {
  analysis: MatchAnalysisResult;
}

export const ProjectionsPoissonSection: React.FC<ProjectionsPoissonSectionProps> = ({ analysis }) => {
  const { homeTeam, awayTeam, projections, poisson } = analysis;
  const [selectedCell, setSelectedCell] = useState<{ home: number; away: number; prob: number } | null>(null);

  // Maximum probability in matrix for heatmap scaling
  let maxCellProb = 0.001;
  poisson.matrix.forEach(row => {
    row.forEach(p => {
      if (p > maxCellProb) maxCellProb = p;
    });
  });

  const getHeatmapColor = (prob: number) => {
    const intensity = Math.min(1, prob / maxCellProb);
    if (intensity > 0.7) return 'bg-blue-600 text-white font-black';
    if (intensity > 0.45) return 'bg-blue-400 text-white font-bold';
    if (intensity > 0.25) return 'bg-blue-200 text-blue-900 font-semibold';
    if (intensity > 0.1) return 'bg-blue-50 text-blue-900';
    return 'bg-slate-50 text-slate-400';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            Módulo 4: Algoritmo de Projeção & Matriz de Poisson
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Expectativa estatística pelo modelo Força de Ataque × Força de Defesa ponderado pelas médias da liga e Distribuição de Poisson
          </p>
        </div>
      </div>

      {/* 1. Continuous Metrics Projection Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Gols Esperados (xG Model) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Gols Esperados (xG λ)
          </span>
          <div className="flex items-center justify-center gap-1.5 font-mono">
            <span className="text-base font-black text-blue-700">{projections.expectedGoalsHome.toFixed(2)}</span>
            <span className="text-xs text-slate-400">x</span>
            <span className="text-base font-black text-amber-700">{projections.expectedGoalsAway.toFixed(2)}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-600 block">
            Total: {projections.totalExpectedGoals.toFixed(2)} gols
          </span>
        </div>

        {/* Escanteios Esperados */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Escanteios Esperados
          </span>
          <div className="flex items-center justify-center gap-1.5 font-mono">
            <span className="text-base font-black text-blue-700">{projections.expectedCornersHome.toFixed(1)}</span>
            <span className="text-xs text-slate-400">x</span>
            <span className="text-base font-black text-amber-700">{projections.expectedCornersAway.toFixed(1)}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-600 block">
            Total: {projections.totalExpectedCorners.toFixed(1)} cantos
          </span>
        </div>

        {/* Finalizações */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Finalizações Esperadas
          </span>
          <div className="flex items-center justify-center gap-1.5 font-mono">
            <span className="text-base font-black text-blue-700">{projections.expectedShotsHome.toFixed(1)}</span>
            <span className="text-xs text-slate-400">x</span>
            <span className="text-base font-black text-amber-700">{projections.expectedShotsAway.toFixed(1)}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-600 block">
            Total: {projections.totalExpectedShots.toFixed(1)} chutes
          </span>
        </div>

        {/* Chutes no Gol */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Chutes no Alvo
          </span>
          <div className="flex items-center justify-center gap-1.5 font-mono">
            <span className="text-base font-black text-blue-700">{projections.expectedShotsOnTargetHome.toFixed(1)}</span>
            <span className="text-xs text-slate-400">x</span>
            <span className="text-base font-black text-amber-700">{projections.expectedShotsOnTargetAway.toFixed(1)}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-600 block">
            Total: {projections.totalExpectedShotsOnTarget.toFixed(1)} no gol
          </span>
        </div>

        {/* Cartões */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Pontos de Cartões
          </span>
          <div className="flex items-center justify-center gap-1.5 font-mono">
            <span className="text-base font-black text-blue-700">{projections.expectedCardsHome.toFixed(1)}</span>
            <span className="text-xs text-slate-400">x</span>
            <span className="text-base font-black text-amber-700">{projections.expectedCardsAway.toFixed(1)}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-600 block">
            Total: {projections.totalExpectedCards.toFixed(1)} pts
          </span>
        </div>
      </div>

      {/* 2. Main Probabilities Row (1X2, Over/Under, BTTS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1X2 Probabilities & Fair Odds */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center justify-between">
            <span>Probabilidades 1X2 (Poisson)</span>
            <Trophy className="w-3.5 h-3.5 text-blue-600" />
          </span>

          <div className="space-y-2 text-xs">
            {/* Home Win */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                <span className="font-bold text-slate-800 truncate max-w-[120px]">{homeTeam.name}</span>
              </div>
              <div className="text-right">
                <span className="font-black text-blue-700 font-mono">{(poisson.probHomeWin * 100).toFixed(1)}%</span>
                <span className="text-[10px] text-slate-400 block">Odd Justa: {(1 / poisson.probHomeWin).toFixed(2)}</span>
              </div>
            </div>

            {/* Draw */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-600 text-white font-bold text-[10px] flex items-center justify-center">X</span>
                <span className="font-bold text-slate-800">Empate</span>
              </div>
              <div className="text-right">
                <span className="font-black text-slate-700 font-mono">{(poisson.probDraw * 100).toFixed(1)}%</span>
                <span className="text-[10px] text-slate-400 block">Odd Justa: {(1 / poisson.probDraw).toFixed(2)}</span>
              </div>
            </div>

            {/* Away Win */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center">2</span>
                <span className="font-bold text-slate-800 truncate max-w-[120px]">{awayTeam.name}</span>
              </div>
              <div className="text-right">
                <span className="font-black text-amber-700 font-mono">{(poisson.probAwayWin * 100).toFixed(1)}%</span>
                <span className="text-[10px] text-slate-400 block">Odd Justa: {(1 / poisson.probAwayWin).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Over / Under Goals Probabilities */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center justify-between">
            <span>Linhas de Gols (Over / Under)</span>
            <Target className="w-3.5 h-3.5 text-emerald-600" />
          </span>

          <div className="space-y-2 text-xs">
            {/* Over 1.5 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-800">Over 1.5 Gols</span>
              <div className="text-right">
                <span className="font-black text-emerald-700 font-mono">{(poisson.probOver15 * 100).toFixed(1)}%</span>
                <span className="text-[10px] text-slate-400 block">Odd: {(1 / poisson.probOver15).toFixed(2)}</span>
              </div>
            </div>

            {/* Over / Under 2.5 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
              <div className="font-bold text-slate-800">
                <span>Over 2.5: <strong className="text-emerald-700 font-mono">{(poisson.probOver25 * 100).toFixed(1)}%</strong></span>
              </div>
              <div className="font-bold text-slate-800">
                <span>Under 2.5: <strong className="text-blue-700 font-mono">{(poisson.probUnder25 * 100).toFixed(1)}%</strong></span>
              </div>
            </div>

            {/* Over 3.5 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-800">Over 3.5 Gols</span>
              <div className="text-right">
                <span className="font-black text-indigo-700 font-mono">{(poisson.probOver35 * 100).toFixed(1)}%</span>
                <span className="text-[10px] text-slate-400 block">Odd: {(1 / poisson.probOver35).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BTTS (Ambas Marcam) & Top Exact Scores */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center justify-between">
            <span>Ambas Marcam & Top Placares</span>
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
          </span>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block">BTTS: SIM</span>
              <span className="text-sm font-black text-emerald-700 font-mono">{(poisson.probBttsYes * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-400 block">Odd: {(1 / poisson.probBttsYes).toFixed(2)}</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block">BTTS: NÃO</span>
              <span className="text-sm font-black text-slate-700 font-mono">{(poisson.probBttsNo * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-400 block">Odd: {(1 / poisson.probBttsNo).toFixed(2)}</span>
            </div>
          </div>

          {/* Top 3 Scores */}
          <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Top 3 Placares Mais Prováveis:</span>
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              {poisson.topExactScores.slice(0, 3).map((item, idx) => (
                <div key={idx} className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-center">
                  <span>{item.score}</span>
                  <span className="text-[10px] block opacity-80">{(item.prob * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Poisson Matrix Grid (0..5 x 0..5 Heatmap) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Grid className="w-4 h-4 text-blue-600" />
            Matriz de Poisson (0 a 5 Gols) — Clique em uma célula para detalhar
          </span>
          {selectedCell && (
            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-blue-600 text-white animate-fade-in">
              Placar {selectedCell.home} - {selectedCell.away} • Probabilidade: {(selectedCell.prob * 100).toFixed(2)}% (Odd Justa: {(1 / selectedCell.prob).toFixed(2)})
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-2 border border-slate-200 bg-slate-200 text-slate-600 font-bold">
                  {homeTeam.name.substring(0, 4)} \ {awayTeam.name.substring(0, 4)}
                </th>
                {[0, 1, 2, 3, 4, 5].map(g => (
                  <th key={g} className="p-2 border border-slate-200 bg-amber-50 text-amber-900 font-bold">
                    {g} {g === 1 ? 'gol' : 'gols'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4, 5].map(hGoals => (
                <tr key={hGoals}>
                  <th className="p-2 border border-slate-200 bg-blue-50 text-blue-900 font-bold">
                    {hGoals} {hGoals === 1 ? 'gol' : 'gols'}
                  </th>
                  {[0, 1, 2, 3, 4, 5].map(aGoals => {
                    const prob = poisson.matrix[hGoals]?.[aGoals] ?? 0;
                    const isSelected = selectedCell?.home === hGoals && selectedCell?.away === aGoals;

                    return (
                      <td
                        key={aGoals}
                        onClick={() => setSelectedCell({ home: hGoals, away: aGoals, prob })}
                        className={`p-2 border border-slate-200 transition-transform cursor-pointer font-mono ${getHeatmapColor(prob)} ${
                          isSelected ? 'ring-2 ring-blue-700 scale-105 z-10' : 'hover:scale-105'
                        }`}
                        title={`Placar ${hGoals} - ${aGoals}: ${(prob * 100).toFixed(2)}%`}
                      >
                        {(prob * 100).toFixed(1)}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { DollarSign, Clock, ShieldAlert, Sparkles, TrendingUp, CheckCircle, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';
import { MatchAnalysisResult, ValueBetOpportunity } from '../../utils/analysisEngine';

interface ValueAndTacticalSectionProps {
  analysis: MatchAnalysisResult;
}

export const ValueAndTacticalSection: React.FC<ValueAndTacticalSectionProps> = ({ analysis }) => {
  const { homeTeam, awayTeam, htFtAnalysis, refereeAnalysis, valueBets, poisson } = analysis;

  // Custom Odds Simulator state for +EV calculator
  const [customHomeOdd, setCustomHomeOdd] = useState<string>('');
  const [customDrawOdd, setCustomDrawOdd] = useState<string>('');
  const [customAwayOdd, setCustomAwayOdd] = useState<string>('');
  const [customOverOdd, setCustomOverOdd] = useState<string>('');

  const calculateCustomEv = (prob: number, oddStr: string) => {
    const odd = parseFloat(oddStr);
    if (isNaN(odd) || odd <= 1.0) return null;
    const ev = ((prob * odd) - 1) * 100;
    return { odd, ev, hasValue: ev >= 3.0 };
  };

  const simHome = calculateCustomEv(poisson.probHomeWin, customHomeOdd);
  const simDraw = calculateCustomEv(poisson.probDraw, customDrawOdd);
  const simAway = calculateCustomEv(poisson.probAwayWin, customAwayOdd);
  const simOver = calculateCustomEv(poisson.probOver25, customOverOdd);

  return (
    <div className="space-y-6">
      {/* 1. Indicador de Valor Esperado (+EV) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Indicador de Valor Esperado (+EV) & Comparativo de Odds
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparação entre a Odd Justa Calculada (1 / Probabilidade Poisson) e as Odds de Mercado para identificar apostas de valor positivo
            </p>
          </div>
        </div>

        {/* Value Bet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {valueBets.map((vb, idx) => {
            const hasValue = vb.status === 'VALOR';
            const isFair = vb.status === 'JUSTA';

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all text-xs space-y-2 ${
                  hasValue
                    ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400'
                    : isFair
                    ? 'bg-blue-50/60 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{vb.market}</span>
                  {hasValue && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> +EV Valor
                    </span>
                  )}
                </div>

                <div className="font-black text-slate-900 text-sm truncate">{vb.selection}</div>

                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Probabilidade</span>
                    <span className="font-bold text-slate-800 font-mono">{vb.modelProbPct.toFixed(1)}%</span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Odd Justa</span>
                    <span className="font-black text-blue-700 font-mono">{vb.fairOdd.toFixed(2)}</span>
                  </div>
                </div>

                {vb.bookmakerOdd ? (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-semibold text-[11px]">
                    <span className="text-slate-600">Odd Casa: <strong>{vb.bookmakerOdd.toFixed(2)}</strong></span>
                    <span className={`font-mono font-black ${vb.evPct && vb.evPct > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                      EV: {vb.evPct ? `${vb.evPct > 0 ? '+' : ''}${vb.evPct.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 text-center italic pt-1">
                    Sem odd de casa cadastrada
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Odds Interactive Simulator */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Simulador de Odds da sua Casa de Apostas (Teste +EV em Tempo Real)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Sim 1: Home */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                Odd Mandante ({homeTeam.name.substring(0, 10)})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 1.95"
                value={customHomeOdd}
                onChange={e => setCustomHomeOdd(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
              />
              {simHome && (
                <div className={`p-1.5 rounded text-center font-bold text-[11px] ${
                  simHome.hasValue ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  EV: {simHome.ev > 0 ? '+' : ''}{simHome.ev.toFixed(1)}% {simHome.hasValue ? '(+EV Valor!)' : '(Sem valor)'}
                </div>
              )}
            </div>

            {/* Sim 2: Draw */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">Odd Empate (X)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 3.40"
                value={customDrawOdd}
                onChange={e => setCustomDrawOdd(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
              />
              {simDraw && (
                <div className={`p-1.5 rounded text-center font-bold text-[11px] ${
                  simDraw.hasValue ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  EV: {simDraw.ev > 0 ? '+' : ''}{simDraw.ev.toFixed(1)}% {simDraw.hasValue ? '(+EV Valor!)' : '(Sem valor)'}
                </div>
              )}
            </div>

            {/* Sim 3: Away */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                Odd Visitante ({awayTeam.name.substring(0, 10)})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 4.20"
                value={customAwayOdd}
                onChange={e => setCustomAwayOdd(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
              />
              {simAway && (
                <div className={`p-1.5 rounded text-center font-bold text-[11px] ${
                  simAway.hasValue ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  EV: {simAway.ev > 0 ? '+' : ''}{simAway.ev.toFixed(1)}% {simAway.hasValue ? '(+EV Valor!)' : '(Sem valor)'}
                </div>
              )}
            </div>

            {/* Sim 4: Over 2.5 */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">Odd Over 2.5 Gols</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 2.05"
                value={customOverOdd}
                onChange={e => setCustomOverOdd(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
              />
              {simOver && (
                <div className={`p-1.5 rounded text-center font-bold text-[11px] ${
                  simOver.hasValue ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  EV: {simOver.ev > 0 ? '+' : ''}{simOver.ev.toFixed(1)}% {simOver.hasValue ? '(+EV Valor!)' : '(Sem valor)'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tactical Differentials: HT vs FT & Árbitro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HT vs FT Differential ("Come-Quieto" Behavior) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Diferencial de Performance HT vs. FT (Tendência de 2º Tempo)
          </h4>
          <p className="text-xs text-slate-500">
            Identifica equipes de aceleração tardia ("come-quieto") com maior volume e gols no 2º tempo para estratégias In-Play/Live.
          </p>

          <div className="space-y-3 text-xs">
            {/* Home HT vs FT */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>{homeTeam.name} (Mandante)</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${
                  htFtAnalysis.homeComeQuietoTendency === 'Forte Crescimento 2ºT'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {htFtAnalysis.homeComeQuietoTendency}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">1º Tempo (HT)</span>
                  <span className="font-black text-slate-900 font-mono">{htFtAnalysis.homeScoredHTPct.toFixed(0)}% dos gols</span>
                  <span className="text-[10px] text-slate-400 block">Média: {htFtAnalysis.homeGoalsHTAvg.toFixed(2)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">2º Tempo (2H)</span>
                  <span className="font-black text-emerald-700 font-mono">{htFtAnalysis.homeScored2HPct.toFixed(0)}% dos gols</span>
                  <span className="text-[10px] text-slate-400 block">Média: {htFtAnalysis.homeGoals2HAvg.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Away HT vs FT */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>{awayTeam.name} (Visitante)</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${
                  htFtAnalysis.awayComeQuietoTendency === 'Forte Crescimento 2ºT'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {htFtAnalysis.awayComeQuietoTendency}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">1º Tempo (HT)</span>
                  <span className="font-black text-slate-900 font-mono">{htFtAnalysis.awayScoredHTPct.toFixed(0)}% dos gols</span>
                  <span className="text-[10px] text-slate-400 block">Média: {htFtAnalysis.awayGoalsHTAvg.toFixed(2)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">2º Tempo (2H)</span>
                  <span className="font-black text-amber-700 font-mono">{htFtAnalysis.awayScored2HPct.toFixed(0)}% dos gols</span>
                  <span className="text-[10px] text-slate-400 block">Média: {htFtAnalysis.awayGoals2HAvg.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Árbitro & Índice de Cartões */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Índice de Agressividade & Análise do Árbitro
          </h4>

          {refereeAnalysis ? (
            <div className="space-y-3 text-xs">
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-700" />
                    Árbitro: {refereeAnalysis.refereeName}
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                    {refereeAnalysis.matchesCount} jogos apitados
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Média do Árbitro: <strong>{refereeAnalysis.avgYellowCards.toFixed(2)}</strong> amarelos e <strong>{refereeAnalysis.avgRedCards.toFixed(2)}</strong> vermelhos por jogo.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">Expectativa Combinada (Times + Árbitro)</span>
                  <span className="text-sm font-black text-slate-900">
                    {refereeAnalysis.combinedExpectation.toFixed(2)} pontos de cartão
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-1 rounded bg-blue-100 text-blue-800 font-bold">
                    {refereeAnalysis.combinedExpectation > 5.0 ? 'Tendência Over Cartões' : 'Tendência Equilibrada / Under'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500 space-y-1">
              <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700">Árbitro não cadastrado para esta partida</p>
              <p className="text-[11px]">
                A projeção de cartões deste confronto baseia-se na média histórica de faltas e cartões das duas equipes ({analysis.projections.totalExpectedCards.toFixed(1)} pts esperados).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

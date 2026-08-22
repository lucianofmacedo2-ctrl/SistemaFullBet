import React, { useState } from 'react';
import {
  DollarSign,
  Clock,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Share2,
  Copy,
  CheckCircle2,
  Wallet,
  CornerDownRight,
  Flame,
  Activity
} from 'lucide-react';
import { MatchAnalysisResult, ValueBetOpportunity } from '../../utils/analysisEngine';
import {
  formatMatchReportForSharing,
  calculateCornerRadar,
  scanDisciplinarMarkets,
} from '../../utils/bettingEngine';

interface ValueAndTacticalSectionProps {
  analysis: MatchAnalysisResult;
  onRegisterBetToBankroll?: (prefill: {
    matchDescription: string;
    market: string;
    odd: number;
    evPct?: number;
  }) => void;
}

export const ValueAndTacticalSection: React.FC<ValueAndTacticalSectionProps> = ({
  analysis,
  onRegisterBetToBankroll,
}) => {
  const { homeTeam, awayTeam, htFtAnalysis, refereeAnalysis, valueBets, poisson, activeMatch } = analysis;

  // State para exportação WhatsApp / Telegram
  const [copiedShareReport, setCopiedShareReport] = useState(false);

  // Radar de Cantos e Cartões
  const cornerRadar = calculateCornerRadar(analysis);
  const disciplinarScan = scanDisciplinarMarkets(analysis);

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

  const handleCopyShareReport = () => {
    const text = formatMatchReportForSharing(analysis);
    navigator.clipboard.writeText(text);
    setCopiedShareReport(true);
    setTimeout(() => setCopiedShareReport(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Indicador de Valor Esperado (+EV) & Exportador Social */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Indicador de Valor Esperado (+EV) & Comparativo de Odds
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparação entre a Odd Justa Calculada (1 / Probabilidade Poisson) e as Odds de Mercado para identificar apostas de valor positivo
            </p>
          </div>

          {/* Botão Exportar WhatsApp / Telegram */}
          <button
            type="button"
            onClick={handleCopyShareReport}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              copiedShareReport
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-900 border border-emerald-300'
            }`}
          >
            {copiedShareReport ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-emerald-700" />
                <span>Exportar Tip (WhatsApp / Telegram)</span>
              </>
            )}
          </button>
        </div>

        {/* Value Bet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {valueBets.map((vb, idx) => {
            const hasValue = vb.status === 'VALOR';
            const isFair = vb.status === 'JUSTA';

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all text-xs space-y-2.5 flex flex-col justify-between ${
                  hasValue
                    ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400'
                    : isFair
                    ? 'bg-blue-50/60 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-1.5">
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

                {/* Botão Salvar na Banca */}
                {onRegisterBetToBankroll && (
                  <button
                    type="button"
                    onClick={() => {
                      onRegisterBetToBankroll({
                        matchDescription: `${homeTeam.name} x ${awayTeam.name}`,
                        market: vb.selection,
                        odd: vb.bookmakerOdd || vb.fairOdd,
                        evPct: vb.evPct || 0,
                      });
                    }}
                    className="w-full py-1 px-2 rounded-lg bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-800 border border-slate-200 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Wallet className="w-3 h-3 text-emerald-600" />
                    <span>Registrar na Banca</span>
                  </button>
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

      {/* 2. Radar de Linhas Asiáticas de Escanteios & Scanner Disciplinar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar de Escanteios Asiáticos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CornerDownRight className="w-4 h-4 text-indigo-600" />
              Radar de Linhas Asiáticas de Escanteios (Corners)
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
              Projeção: {cornerRadar.totalProjectedCorners} cantos
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200 space-y-1">
              <span className="text-[10px] text-indigo-800 uppercase font-bold block">Linha Asiática Justa</span>
              <div className="text-lg font-black text-indigo-950 font-mono">
                {cornerRadar.asianCornerLine} Cantos
              </div>
              <div className="text-[10px] text-indigo-700">
                Over: <strong>{cornerRadar.fairAsianOverOdd.toFixed(2)}</strong> | Under: <strong>{cornerRadar.fairAsianUnderOdd.toFixed(2)}</strong>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">1X2 Escanteios (Quem terá mais)</span>
              <div className="text-xs font-black text-slate-800 pt-1">
                {homeTeam.name.substring(0, 8)}: <strong>{cornerRadar.corner1X2Prob.homeWinCorners}%</strong>
              </div>
              <div className="text-xs font-bold text-slate-600">
                {awayTeam.name.substring(0, 8)}: <strong>{cornerRadar.corner1X2Prob.awayWinCorners}%</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Over 8.5 Cantos</span>
              <span className="font-black text-slate-900 text-sm">{cornerRadar.probCornerOver85Pct}%</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Over 9.5 Cantos</span>
              <span className="font-black text-slate-900 text-sm">{cornerRadar.probCornerOver95Pct}%</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Over 10.5 Cantos</span>
              <span className="font-black text-slate-900 text-sm">{cornerRadar.probCornerOver105Pct}%</span>
            </div>
          </div>
        </div>

        {/* Scanner Disciplinar de Cartões & Faltas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Scanner Disciplinar (Cartões & Faltas)
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
              Projeção: {disciplinarScan.totalProjectedCards} pts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 space-y-1">
              <span className="text-[10px] text-amber-800 uppercase font-bold block">Over 3.5 Cartões</span>
              <div className="text-lg font-black text-amber-950 font-mono">
                {disciplinarScan.probOver35CardsPct}%
              </div>
              <div className="text-[10px] text-amber-700">
                Odd Justa: <strong>{disciplinarScan.fairOddOver35Cards.toFixed(2)}</strong>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Over 4.5 Cartões</span>
              <div className="text-lg font-black text-slate-900 font-mono">
                {disciplinarScan.probOver45CardsPct}%
              </div>
              <div className="text-[10px] text-slate-500">
                Odd Justa: <strong>{disciplinarScan.fairOddOver45Cards.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 italic">
            ⚖️ <strong>Árbitro / Disciplina:</strong> {disciplinarScan.recommendation}
          </p>
        </div>
      </div>

      {/* 3. Tactical Differentials: HT vs FT & Padrão de Pressão */}
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

        {/* Detector de Padrões de Pressão & Árbitro */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600" />
            Detector de Padrões de Pressão Temporal (15 em 15 min)
          </h4>

          {activeMatch?.pressureData?.intervals && activeMatch.pressureData.intervals.length > 0 ? (
            <div className="space-y-3 text-xs">
              <p className="text-xs text-slate-500">
                Histórico de dominância tática mapeado por quartos de jogo:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {activeMatch.pressureData.intervals.map((inv, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{inv.interval}</span>
                    <div className="font-black text-xs text-slate-900 truncate">
                      {inv.dominantTeam === 'home' ? homeTeam.name : inv.dominantTeam === 'away' ? awayTeam.name : 'Equilibrado'}
                    </div>
                    <span className="text-[9px] text-slate-400 block">
                      Vol: {(inv.homeAttackingVolume || 0)} x {(inv.awayAttackingVolume || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-xs text-slate-500 space-y-1.5">
              <Activity className="w-7 h-7 text-purple-400 mx-auto" />
              <p className="font-bold text-slate-700">Gráfico de Pressão não importado para este jogo</p>
              <p className="text-[11px] text-slate-400">
                Importe gráficos de pressão pela listagem de jogos para visualizar a dominância de 15 em 15 minutos e picos de ataque.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

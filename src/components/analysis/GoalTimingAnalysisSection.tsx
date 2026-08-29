import React, { useState } from 'react';
import {
  Clock,
  Zap,
  ShieldAlert,
  Flame,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { MatchAnalysisResult } from '../../utils/analysisEngine';
import { isValidImageUrl } from '../../utils/imageHelper';
import { MINUTE_BINS } from '../../utils/goalTimingAnalysis';

interface GoalTimingAnalysisSectionProps {
  analysis: MatchAnalysisResult;
}

export const GoalTimingAnalysisSection: React.FC<GoalTimingAnalysisSectionProps> = ({ analysis }) => {
  const {
    homeTeam,
    awayTeam,
    homeGoalTiming,
    awayGoalTiming,
    timingInsights,
    sampleSize,
    venueMode,
  } = analysis;

  const [activeTab, setActiveTab] = useState<'TABLE' | 'FIRST_GOAL' | 'HALVES'>('TABLE');

  const hasAnyData = homeGoalTiming.hasTimingData || awayGoalTiming.hasTimingData;

  const renderIntensityBadge = (pct: number) => {
    if (pct >= 30) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200">
          🔥 {pct}%
        </span>
      );
    }
    if (pct >= 20) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          ⚡ {pct}%
        </span>
      );
    }
    if (pct > 0) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700 bg-slate-100">
          {pct}%
        </span>
      );
    }
    return <span className="text-[11px] text-slate-400 font-medium">0%</span>;
  };

  return (
    <div id="goal-timing-analysis-section" className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl text-white shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                Análise de Minutagem dos Gols por Faixa de Tempo
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  0-90+ min
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribuição percentual de gols marcados e sofridos por intervalo de 15 minutos e métricas de 1º gol.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            id="btn-tab-timing-table"
            onClick={() => setActiveTab('TABLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'TABLE'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Faixa de Minutos
          </button>
          <button
            type="button"
            id="btn-tab-first-goal"
            onClick={() => setActiveTab('FIRST_GOAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'FIRST_GOAL'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            1º Gol (Feito / Sofrido)
          </button>
          <button
            type="button"
            id="btn-tab-halves"
            onClick={() => setActiveTab('HALVES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'HALVES'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            1ºT vs 2ºT
          </button>
        </div>
      </div>

      {!hasAnyData && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">Dados de minutagem ainda não preenchidos para esta amostra</p>
            <p className="text-amber-700">
              Para visualizar os dados reais, preencha as colunas <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">minutos_gols_mandante_ft</code> e <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">minutos_gols_visitante_ft</code> (ex: <span className="font-mono font-semibold">9,19,43,74</span>) na planilha de importação de jogos ou edite os jogos cadastrados.
            </p>
          </div>
        </div>
      )}

      {/* HOT ZONES & INSIGHTS */}
      {timingInsights.hotZones.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-500" />
            Zonas de Alerta e Momentos Críticos do Confronto
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {timingInsights.hotZones.map((zone, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  zone.intensity === 'HIGH'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${zone.intensity === 'HIGH' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs uppercase tracking-wide">{zone.periodLabel}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/70">
                      {zone.intensity === 'HIGH' ? 'Alta Pressão' : 'Atenção'}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed opacity-90">{zone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: TABELA COMPLETA POR FAIXA DE MINUTOS */}
      {activeTab === 'TABLE' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50/80 text-slate-700">
                  <th className="py-3 px-3 font-bold rounded-tl-xl">Faixa de Minutos</th>
                  <th className="py-3 px-3 font-bold text-center border-l border-slate-200 bg-blue-50/50 text-blue-950">
                    <div className="flex items-center justify-center gap-1.5">
                      {isValidImageUrl(homeTeam.logoUrl) && (
                        <img src={homeTeam.logoUrl} alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                      )}
                      <span>{homeTeam.name} (Gols Feitos %)</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 font-bold text-center bg-blue-50/30 text-blue-900">
                    <span>{homeTeam.name} (Gols Sofridos %)</span>
                  </th>
                  <th className="py-3 px-3 font-bold text-center border-l border-slate-200 bg-amber-50/50 text-amber-950">
                    <div className="flex items-center justify-center gap-1.5">
                      {isValidImageUrl(awayTeam.logoUrl) && (
                        <img src={awayTeam.logoUrl} alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                      )}
                      <span>{awayTeam.name} (Gols Feitos %)</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 font-bold text-center bg-amber-50/30 text-amber-900 rounded-tr-xl">
                    <span>{awayTeam.name} (Gols Sofridos %)</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {MINUTE_BINS.map((bin, idx) => {
                  const homeBin = homeGoalTiming.bins[idx];
                  const awayBin = awayGoalTiming.bins[idx];

                  const homeScoredPct = homeBin?.goalsScoredPct || 0;
                  const homeConcededPct = homeBin?.goalsConcededPct || 0;
                  const awayScoredPct = awayBin?.goalsScoredPct || 0;
                  const awayConcededPct = awayBin?.goalsConcededPct || 0;

                  const homeScoredCount = homeBin?.goalsScored || 0;
                  const homeConcededCount = homeBin?.goalsConceded || 0;
                  const awayScoredCount = awayBin?.goalsScored || 0;
                  const awayConcededCount = awayBin?.goalsConceded || 0;

                  return (
                    <tr key={bin.key} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-black text-slate-900 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${bin.half === '1T' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                        <span>{bin.label}</span>
                        <span className="text-[10px] font-bold text-slate-400">({bin.half})</span>
                      </td>

                      {/* Home Scored */}
                      <td className="py-3 px-3 text-center border-l border-slate-200 bg-blue-50/20">
                        <div className="flex flex-col items-center gap-1">
                          {renderIntensityBadge(homeScoredPct)}
                          <span className="text-[10px] text-slate-500">
                            {homeScoredCount} {homeScoredCount === 1 ? 'gol' : 'gols'}
                          </span>
                        </div>
                      </td>

                      {/* Home Conceded */}
                      <td className="py-3 px-3 text-center bg-blue-50/10">
                        <div className="flex flex-col items-center gap-1">
                          {renderIntensityBadge(homeConcededPct)}
                          <span className="text-[10px] text-slate-500">
                            {homeConcededCount} {homeConcededCount === 1 ? 'gol' : 'gols'}
                          </span>
                        </div>
                      </td>

                      {/* Away Scored */}
                      <td className="py-3 px-3 text-center border-l border-slate-200 bg-amber-50/20">
                        <div className="flex flex-col items-center gap-1">
                          {renderIntensityBadge(awayScoredPct)}
                          <span className="text-[10px] text-slate-500">
                            {awayScoredCount} {awayScoredCount === 1 ? 'gol' : 'gols'}
                          </span>
                        </div>
                      </td>

                      {/* Away Conceded */}
                      <td className="py-3 px-3 text-center bg-amber-50/10">
                        <div className="flex flex-col items-center gap-1">
                          {renderIntensityBadge(awayConcededPct)}
                          <span className="text-[10px] text-slate-500">
                            {awayConcededCount} {awayConcededCount === 1 ? 'gol' : 'gols'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Resumo Visual em Barras Comparativas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
            {/* Mandante Distribuição */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  {homeTeam.name}: Faixa Mais Perigosa
                </span>
                <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  {homeGoalTiming.mostDangerousScoringBin.label} ({homeGoalTiming.bins.find(b => b.bin.key === homeGoalTiming.mostDangerousScoringBin.key)?.goalsScoredPct || 0}%)
                </span>
              </div>
              <div className="space-y-1.5">
                {MINUTE_BINS.map((b, idx) => {
                  const pct = homeGoalTiming.bins[idx]?.goalsScoredPct || 0;
                  return (
                    <div key={b.key} className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                        <span>{b.label}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visitante Distribuição */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-600" />
                  {awayTeam.name}: Faixa Mais Perigosa
                </span>
                <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  {awayGoalTiming.mostDangerousScoringBin.label} ({awayGoalTiming.bins.find(b => b.bin.key === awayGoalTiming.mostDangerousScoringBin.key)?.goalsScoredPct || 0}%)
                </span>
              </div>
              <div className="space-y-1.5">
                {MINUTE_BINS.map((b, idx) => {
                  const pct = awayGoalTiming.bins[idx]?.goalsScoredPct || 0;
                  return (
                    <div key={b.key} className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                        <span>{b.label}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MINUTO DO PRIMEIRO GOL FEITO E SOFRIDO */}
      {activeTab === 'FIRST_GOAL' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MANDANTE 1º GOL */}
            <div className="bg-blue-50/40 border border-blue-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-blue-200">
                <div className="flex items-center gap-2">
                  {isValidImageUrl(homeTeam.logoUrl) ? (
                    <img src={homeTeam.logoUrl} alt="" className="w-7 h-7 object-contain bg-white rounded p-0.5 border" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      M
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Mandante</span>
                    <h4 className="font-black text-sm text-slate-900">{homeTeam.name}</h4>
                  </div>
                </div>
              </div>

              {/* 1º Gol Feito */}
              <div className="p-3.5 bg-white rounded-xl border border-blue-100 space-y-2.5 shadow-2xs">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Minuto do 1º Gol Marcado
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Minuto Médio</span>
                    <span className="text-sm font-black text-slate-900">
                      {homeGoalTiming.firstGoalScored.avgMinute !== null ? `${homeGoalTiming.firstGoalScored.avgMinute}'` : 'N/D'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Mais Cedo / Mais Tarde</span>
                    <span className="text-xs font-bold text-slate-800">
                      {homeGoalTiming.firstGoalScored.earliestMinute !== null ? `${homeGoalTiming.firstGoalScored.earliestMinute}'` : '-'} / {homeGoalTiming.firstGoalScored.latestMinute !== null ? `${homeGoalTiming.firstGoalScored.latestMinute}'` : '-'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold">
                  <div className="p-1.5 bg-emerald-50 text-emerald-900 rounded border border-emerald-200">
                    <span className="block font-black text-xs">{homeGoalTiming.firstGoalScored.scoredInFirst15Pct}%</span>
                    <span>0-15 min</span>
                  </div>
                  <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                    <span className="block font-black text-xs">{homeGoalTiming.firstGoalScored.scoredInFirstHalfPct}%</span>
                    <span>1º Tempo</span>
                  </div>
                  <div className="p-1.5 bg-slate-100 text-slate-800 rounded">
                    <span className="block font-black text-xs">{homeGoalTiming.firstGoalScored.scoredInSecondHalfPct}%</span>
                    <span>2º Tempo</span>
                  </div>
                </div>
              </div>

              {/* 1º Gol Sofrido */}
              <div className="p-3.5 bg-white rounded-xl border border-rose-100 space-y-2.5 shadow-2xs">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Minuto do 1º Gol Sofrido
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Minuto Médio Sofrido</span>
                    <span className="text-sm font-black text-slate-900">
                      {homeGoalTiming.firstGoalConceded.avgMinute !== null ? `${homeGoalTiming.firstGoalConceded.avgMinute}'` : 'N/D'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Mais Cedo / Mais Tarde</span>
                    <span className="text-xs font-bold text-slate-800">
                      {homeGoalTiming.firstGoalConceded.earliestMinute !== null ? `${homeGoalTiming.firstGoalConceded.earliestMinute}'` : '-'} / {homeGoalTiming.firstGoalConceded.latestMinute !== null ? `${homeGoalTiming.firstGoalConceded.latestMinute}'` : '-'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold">
                  <div className="p-1.5 bg-rose-50 text-rose-900 rounded border border-rose-200">
                    <span className="block font-black text-xs">{homeGoalTiming.firstGoalConceded.scoredInFirst15Pct}%</span>
                    <span>0-15 min</span>
                  </div>
                  <div className="p-1.5 bg-amber-50 text-amber-900 rounded border border-amber-200">
                    <span className="block font-black text-xs">{homeGoalTiming.firstGoalConceded.scoredInFirstHalfPct}%</span>
                    <span>1º Tempo</span>
                  </div>
                  <div className="p-1.5 bg-slate-100 text-slate-800 rounded">
                    <span className="block font-black text-xs">{homeGoalTiming.firstGoalConceded.scoredInSecondHalfPct}%</span>
                    <span>2º Tempo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* VISITANTE 1º GOL */}
            <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  {isValidImageUrl(awayTeam.logoUrl) ? (
                    <img src={awayTeam.logoUrl} alt="" className="w-7 h-7 object-contain bg-white rounded p-0.5 border" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                      V
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Visitante</span>
                    <h4 className="font-black text-sm text-slate-900">{awayTeam.name}</h4>
                  </div>
                </div>
              </div>

              {/* 1º Gol Feito */}
              <div className="p-3.5 bg-white rounded-xl border border-amber-100 space-y-2.5 shadow-2xs">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Minuto do 1º Gol Marcado
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Minuto Médio</span>
                    <span className="text-sm font-black text-slate-900">
                      {awayGoalTiming.firstGoalScored.avgMinute !== null ? `${awayGoalTiming.firstGoalScored.avgMinute}'` : 'N/D'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Mais Cedo / Mais Tarde</span>
                    <span className="text-xs font-bold text-slate-800">
                      {awayGoalTiming.firstGoalScored.earliestMinute !== null ? `${awayGoalTiming.firstGoalScored.earliestMinute}'` : '-'} / {awayGoalTiming.firstGoalScored.latestMinute !== null ? `${awayGoalTiming.firstGoalScored.latestMinute}'` : '-'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold">
                  <div className="p-1.5 bg-emerald-50 text-emerald-900 rounded border border-emerald-200">
                    <span className="block font-black text-xs">{awayGoalTiming.firstGoalScored.scoredInFirst15Pct}%</span>
                    <span>0-15 min</span>
                  </div>
                  <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                    <span className="block font-black text-xs">{awayGoalTiming.firstGoalScored.scoredInFirstHalfPct}%</span>
                    <span>1º Tempo</span>
                  </div>
                  <div className="p-1.5 bg-slate-100 text-slate-800 rounded">
                    <span className="block font-black text-xs">{awayGoalTiming.firstGoalScored.scoredInSecondHalfPct}%</span>
                    <span>2º Tempo</span>
                  </div>
                </div>
              </div>

              {/* 1º Gol Sofrido */}
              <div className="p-3.5 bg-white rounded-xl border border-rose-100 space-y-2.5 shadow-2xs">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Minuto do 1º Gol Sofrido
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Minuto Médio Sofrido</span>
                    <span className="text-sm font-black text-slate-900">
                      {awayGoalTiming.firstGoalConceded.avgMinute !== null ? `${awayGoalTiming.firstGoalConceded.avgMinute}'` : 'N/D'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Mais Cedo / Mais Tarde</span>
                    <span className="text-xs font-bold text-slate-800">
                      {awayGoalTiming.firstGoalConceded.earliestMinute !== null ? `${awayGoalTiming.firstGoalConceded.earliestMinute}'` : '-'} / {awayGoalTiming.firstGoalConceded.latestMinute !== null ? `${awayGoalTiming.firstGoalConceded.latestMinute}'` : '-'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold">
                  <div className="p-1.5 bg-rose-50 text-rose-900 rounded border border-rose-200">
                    <span className="block font-black text-xs">{awayGoalTiming.firstGoalConceded.scoredInFirst15Pct}%</span>
                    <span>0-15 min</span>
                  </div>
                  <div className="p-1.5 bg-amber-50 text-amber-900 rounded border border-amber-200">
                    <span className="block font-black text-xs">{awayGoalTiming.firstGoalConceded.scoredInFirstHalfPct}%</span>
                    <span>1º Tempo</span>
                  </div>
                  <div className="p-1.5 bg-slate-100 text-slate-800 rounded">
                    <span className="block font-black text-xs">{awayGoalTiming.firstGoalConceded.scoredInSecondHalfPct}%</span>
                    <span>2º Tempo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 1º TEMPO vs 2º TEMPO */}
      {activeTab === 'HALVES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600" />
              {homeTeam.name}: Concentração de Gols por Tempo
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Gols Marcados no 1º Tempo</span>
                  <span className="text-[10px] text-slate-500">{homeGoalTiming.goalsScored1TCount} gols</span>
                </div>
                <span className="text-base font-black text-indigo-700">{homeGoalTiming.goalsScored1TPct}%</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Gols Marcados no 2º Tempo</span>
                  <span className="text-[10px] text-slate-500">{homeGoalTiming.goalsScored2TCount} gols</span>
                </div>
                <span className="text-base font-black text-indigo-700">{homeGoalTiming.goalsScored2TPct}%</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-600" />
              {awayTeam.name}: Concentração de Gols por Tempo
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Gols Marcados no 1º Tempo</span>
                  <span className="text-[10px] text-slate-500">{awayGoalTiming.goalsScored1TCount} gols</span>
                </div>
                <span className="text-base font-black text-amber-700">{awayGoalTiming.goalsScored1TPct}%</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Gols Marcados no 2º Tempo</span>
                  <span className="text-[10px] text-slate-500">{awayGoalTiming.goalsScored2TCount} gols</span>
                </div>
                <span className="text-base font-black text-amber-700">{awayGoalTiming.goalsScored2TPct}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

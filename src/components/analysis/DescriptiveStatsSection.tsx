import React, { useState } from 'react';
import { BarChart3, HelpCircle, ArrowUpDown, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { MatchAnalysisResult, DescriptiveMetric } from '../../utils/analysisEngine';
import { isValidImageUrl } from '../../utils/imageHelper';

interface DescriptiveStatsSectionProps {
  analysis: MatchAnalysisResult;
}

export const DescriptiveStatsSection: React.FC<DescriptiveStatsSectionProps> = ({ analysis }) => {
  const { homeTeam, awayTeam, descriptiveMetrics, venueMode, sampleSize } = analysis;
  const [filterCategory, setFilterCategory] = useState<
    'ALL' | 'Geral' | 'Finalizações & xG' | 'Ataque & Criação' | 'Construção & Passes' | 'Defesa & Duelos' | 'Goleiro & Baliza'
  >('ALL');
  const [showExplanation, setShowExplanation] = useState(false);

  const filteredMetrics = descriptiveMetrics.filter(m => {
    if (filterCategory === 'ALL') return true;
    return m.category === filterCategory;
  });

  const getConsistencyBadge = (consistency: 'Alta Regularidade' | 'Moderada' | 'Volátil / Disperso', cv: number) => {
    if (consistency === 'Alta Regularidade') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {cv.toFixed(0)}% (Regular)
        </span>
      );
    }
    if (consistency === 'Moderada') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
          {cv.toFixed(0)}% (Moderado)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
        <AlertCircle className="w-3 h-3 text-amber-600" />
        {cv.toFixed(0)}% (Volátil)
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Módulo 3: Métricas Estatísticas Descritivas (Lado a Lado)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Análise aprofundada de Média (μ), Mediana, Moda, Desvio Padrão (σ) e Coeficiente de Variação (CV%)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>{showExplanation ? 'Ocultar Explicações' : 'O que significam as métricas?'}</span>
          </button>
        </div>
      </div>

      {/* Explanatory Box (Collapsible) */}
      {showExplanation && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
          <div className="font-bold text-blue-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Guia de Interpretação das Métricas Matemáticas:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="font-bold text-slate-900 block">Média (μ)</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Tendência central aritmética da variável na amostra de jogos.</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="font-bold text-slate-900 block">Mediana</span>
              <p className="text-[11px] text-slate-600 mt-0.5">Valor do meio; elimina distorções causadas por goleadas ou jogos atípicos.</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="font-bold text-slate-900 block">Moda</span>
              <p className="text-[11px] text-slate-600 mt-0.5">O resultado ou valor mais frequente e recorrente registrado.</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="font-bold text-slate-900 block">Desvio Padrão (σ)</span>
              <p className="text-[11px] text-slate-600 mt-0.5">O grau de dispersão dos dados em relação à média da equipe.</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="font-bold text-slate-900 block">Coeficiente de Variação (CV%)</span>
              <p className="text-[11px] text-slate-600 mt-0.5">(σ / μ) × 100. Mede a regularidade: quanto menor o CV, mais previsível.</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs by Sector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        {[
          { id: 'ALL', label: 'Todas as Métricas', count: descriptiveMetrics.length },
          { id: 'Geral', label: 'Geral & Gols', count: descriptiveMetrics.filter(m => m.category === 'Geral').length },
          { id: 'Finalizações & xG', label: 'Finalizações & xG', count: descriptiveMetrics.filter(m => m.category === 'Finalizações & xG').length },
          { id: 'Ataque & Criação', label: 'Ataque & Criação', count: descriptiveMetrics.filter(m => m.category === 'Ataque & Criação').length },
          { id: 'Construção & Passes', label: 'Construção & Passes', count: descriptiveMetrics.filter(m => m.category === 'Construção & Passes').length },
          { id: 'Defesa & Duelos', label: 'Defesa & Duelos', count: descriptiveMetrics.filter(m => m.category === 'Defesa & Duelos').length },
          { id: 'Goleiro & Baliza', label: 'Goleiro & Baliza', count: descriptiveMetrics.filter(m => m.category === 'Goleiro & Baliza').length },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterCategory(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Header Super-Row */}
            <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
              <th className="p-3 w-1/4">Variável Estatística</th>
              <th colSpan={4} className="p-3 text-center bg-blue-50/70 border-x border-blue-200 text-blue-900">
                <div className="flex items-center justify-center gap-2">
                  {isValidImageUrl(homeTeam.logoUrl) && (
                    <img src={homeTeam.logoUrl} alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                  )}
                  <span>{homeTeam.name} (Mandante {venueMode === 'SPECIFIC' ? 'Casa' : 'Geral'})</span>
                </div>
              </th>
              <th colSpan={4} className="p-3 text-center bg-amber-50/70 text-amber-900">
                <div className="flex items-center justify-center gap-2">
                  {isValidImageUrl(awayTeam.logoUrl) && (
                    <img src={awayTeam.logoUrl} alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                  )}
                  <span>{awayTeam.name} (Visitante {venueMode === 'SPECIFIC' ? 'Fora' : 'Geral'})</span>
                </div>
              </th>
            </tr>
            {/* Sub-Header Row */}
            <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
              <th className="px-3 py-2">Métrica</th>
              {/* Home */}
              <th className="px-2 py-2 text-center bg-blue-50/30">Média (μ)</th>
              <th className="px-2 py-2 text-center bg-blue-50/30">Mediana</th>
              <th className="px-2 py-2 text-center bg-blue-50/30">Moda</th>
              <th className="px-2 py-2 text-center bg-blue-50/30 border-r border-blue-200">Regularidade (CV%)</th>
              {/* Away */}
              <th className="px-2 py-2 text-center bg-amber-50/30">Média (μ)</th>
              <th className="px-2 py-2 text-center bg-amber-50/30">Mediana</th>
              <th className="px-2 py-2 text-center bg-amber-50/30">Moda</th>
              <th className="px-2 py-2 text-center bg-amber-50/30">Regularidade (CV%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium">
            {filteredMetrics.map((metric, idx) => (
              <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                {/* Metric Name & Category Pill */}
                <td className="p-3 font-bold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    <span>{metric.name}</span>
                  </div>
                  {metric.category && metric.category !== 'Geral' && (
                    <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 text-slate-500 bg-slate-100 rounded font-normal">
                      {metric.category}
                    </span>
                  )}
                </td>

                {/* Home Stats */}
                <td className="p-2.5 text-center font-mono font-bold text-slate-900 bg-blue-50/10">
                  {metric.homeMean.toFixed(2)}
                </td>
                <td className="p-2.5 text-center font-mono text-slate-700 bg-blue-50/10">
                  {metric.homeMedian.toFixed(1)}
                </td>
                <td className="p-2.5 text-center font-mono text-slate-700 bg-blue-50/10" title={`Ocorrência em ${metric.homeModeFreq} partidas`}>
                  {metric.homeMode.toFixed(1)}
                </td>
                <td className="p-2.5 text-center bg-blue-50/10 border-r border-blue-200">
                  {getConsistencyBadge(metric.homeConsistency, metric.homeCv)}
                </td>

                {/* Away Stats */}
                <td className="p-2.5 text-center font-mono font-bold text-slate-900 bg-amber-50/10">
                  {metric.awayMean.toFixed(2)}
                </td>
                <td className="p-2.5 text-center font-mono text-slate-700 bg-amber-50/10">
                  {metric.awayMedian.toFixed(1)}
                </td>
                <td className="p-2.5 text-center font-mono text-slate-700 bg-amber-50/10" title={`Ocorrência em ${metric.awayModeFreq} partidas`}>
                  {metric.awayMode.toFixed(1)}
                </td>
                <td className="p-2.5 text-center bg-amber-50/10">
                  {getConsistencyBadge(metric.awayConsistency, metric.awayCv)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Shield, Flame, MapPin, Calendar, Info, Trophy } from 'lucide-react';
import { MatchAnalysisResult, TeamSampleMatch } from '../../utils/analysisEngine';
import { isValidImageUrl } from '../../utils/imageHelper';

interface FormTrackerSectionProps {
  analysis: MatchAnalysisResult;
}

export const FormTrackerSection: React.FC<FormTrackerSectionProps> = ({ analysis }) => {
  const { homeTeam, awayTeam, homeFormG5, homeFormE5, awayFormG5, awayFormE5 } = analysis;

  const [activeTooltip, setActiveTooltip] = useState<{
    id: string;
    item: TeamSampleMatch;
  } | null>(null);

  const renderBadge = (item: TeamSampleMatch, prefix: string, idx: number) => {
    const key = `${prefix}-${item.match.id}-${idx}`;
    let bgColor = 'bg-rose-500 text-white border-rose-600';
    let label = 'D';

    if (item.result === 'W') {
      bgColor = 'bg-emerald-500 text-white border-emerald-600';
      label = 'V';
    } else if (item.result === 'D') {
      bgColor = 'bg-amber-400 text-slate-900 border-amber-500 font-bold';
      label = 'E';
    }

    const formattedDate = item.match.matchDate
      ? new Date(item.match.matchDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      : '';

    return (
      <div key={key} className="relative group">
        <button
          type="button"
          onMouseEnter={() => setActiveTooltip({ id: key, item })}
          onMouseLeave={() => setActiveTooltip(null)}
          onClick={() => setActiveTooltip(activeTooltip?.id === key ? null : { id: key, item })}
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex flex-col items-center justify-center font-black text-xs sm:text-sm shadow-xs transition-transform hover:scale-110 cursor-pointer ${bgColor}`}
        >
          {label}
        </button>

        {/* Floating Tooltip */}
        {activeTooltip?.id === key && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-52 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 pointer-events-none">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
              <span>{formattedDate}</span>
              <span className="font-semibold text-slate-300">
                {item.isHome ? 'Em Casa' : 'Fora de Casa'}
              </span>
            </div>
            <div className="font-bold flex items-center justify-between">
              <span className="truncate pr-1">{item.opponentName}</span>
              <span className="font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                {item.teamGoals} - {item.oppGoals}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
              <span>Gols HT: {item.teamGoalsHT}-{item.oppGoalsHT}</span>
              {item.cornersFor !== null && <span>Esc: {item.cornersFor}</span>}
              {item.opponentOdd && <span>Odd Adv: {item.opponentOdd.toFixed(2)}</span>}
            </div>
          </div>
        )}
      </div>
    );
  };

  const calculateFormSummary = (matches: TeamSampleMatch[]) => {
    let pts = 0;
    let gf = 0;
    let ga = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;

    matches.forEach(m => {
      gf += m.teamGoals;
      ga += m.oppGoals;
      if (m.result === 'W') {
        pts += 3;
        wins++;
      } else if (m.result === 'D') {
        pts += 1;
        draws++;
      } else {
        losses++;
      }
    });

    const maxPts = matches.length * 3;
    const pct = maxPts > 0 ? ((pts / maxPts) * 100).toFixed(0) : '0';

    return { pts, maxPts, pct, gf, ga, diff: gf - ga, wins, draws, losses };
  };

  const homeG5Stats = calculateFormSummary(homeFormG5);
  const homeE5Stats = calculateFormSummary(homeFormE5);
  const awayG5Stats = calculateFormSummary(awayFormG5);
  const awayE5Stats = calculateFormSummary(awayFormE5);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Módulo 1: Análise de Forma Recente (Form Tracker)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhamento dos últimos 5 jogos gerais (G5) e específicos por mando (E5) com detalhes de cada confronto
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs font-bold self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> V (Vitória)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> E (Empate)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> D (Derrota)
          </span>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MANDANTE (HOME) */}
        <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              {isValidImageUrl(homeTeam.logoUrl) ? (
                <img
                  src={homeTeam.logoUrl}
                  alt={homeTeam.name}
                  className="w-7 h-7 object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 bg-blue-100 text-blue-700 font-bold rounded flex items-center justify-center text-xs">
                  {homeTeam.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block text-[10px]">
                  Mandante (Casa)
                </span>
                <h4 className="text-sm font-black text-slate-900 leading-tight">{homeTeam.name}</h4>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100/80 text-blue-800 border border-blue-200">
              Amostra Home
            </span>
          </div>

          {/* G5 Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-slate-500" />
                Forma Geral (G5):
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {homeG5Stats.pts}/{homeG5Stats.maxPts} pts ({homeG5Stats.pct}%) • GM: {homeG5Stats.gf} GS: {homeG5Stats.ga}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {homeFormG5.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Nenhum jogo anterior registrado</span>
              ) : (
                homeFormG5.map((item, idx) => renderBadge(item, 'home-g5', idx))
              )}
            </div>
          </div>

          {/* E5 Row (Em Casa) */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Forma Específica (E5 - Em Casa):
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {homeE5Stats.pts}/{homeE5Stats.maxPts} pts ({homeE5Stats.pct}%) • GM: {homeE5Stats.gf} GS: {homeE5Stats.ga}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {homeFormE5.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Nenhum jogo como mandante registrado</span>
              ) : (
                homeFormE5.map((item, idx) => renderBadge(item, 'home-e5', idx))
              )}
            </div>
          </div>
        </div>

        {/* VISITANTE (AWAY) */}
        <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              {isValidImageUrl(awayTeam.logoUrl) ? (
                <img
                  src={awayTeam.logoUrl}
                  alt={awayTeam.name}
                  className="w-7 h-7 object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 bg-amber-100 text-amber-700 font-bold rounded flex items-center justify-center text-xs">
                  {awayTeam.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block text-[10px]">
                  Visitante (Fora)
                </span>
                <h4 className="text-sm font-black text-slate-900 leading-tight">{awayTeam.name}</h4>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100/80 text-amber-800 border border-amber-200">
              Amostra Away
            </span>
          </div>

          {/* G5 Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-slate-500" />
                Forma Geral (G5):
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {awayG5Stats.pts}/{awayG5Stats.maxPts} pts ({awayG5Stats.pct}%) • GM: {awayG5Stats.gf} GS: {awayG5Stats.ga}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {awayFormG5.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Nenhum jogo anterior registrado</span>
              ) : (
                awayFormG5.map((item, idx) => renderBadge(item, 'away-g5', idx))
              )}
            </div>
          </div>

          {/* E5 Row (Fora de Casa) */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                Forma Específica (E5 - Fora de Casa):
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {awayE5Stats.pts}/{awayE5Stats.maxPts} pts ({awayE5Stats.pct}%) • GM: {awayE5Stats.gf} GS: {awayE5Stats.ga}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {awayFormE5.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Nenhum jogo como visitante registrado</span>
              ) : (
                awayFormE5.map((item, idx) => renderBadge(item, 'away-e5', idx))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { MatchPressureData, PressureTimelinePoint, Match } from '../types';
import { Flame, Trophy, TrendingUp, Activity, ShieldAlert, Award, Clock, Sparkles, ChevronDown, ChevronUp, BarChart3, Info } from 'lucide-react';

interface PressureChartViewerProps {
  pressureData: MatchPressureData;
  match?: Match | null;
  homeTeamName?: string;
  awayTeamName?: string;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  onEdit?: () => void;
}

export const PressureChartViewer: React.FC<PressureChartViewerProps> = ({
  pressureData,
  match,
  homeTeamName = match?.homeTeamName || 'Mandante',
  awayTeamName = match?.awayTeamName || 'Visitante',
  homeLogoUrl = match?.homeTeamLogoUrl,
  awayLogoUrl = match?.awayTeamLogoUrl,
  onEdit,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<PressureTimelinePoint | null>(null);
  const [showIntervals, setShowIntervals] = useState<boolean>(true);

  const homeCode = pressureData.extractedTeams?.homeCode || homeTeamName.substring(0, 3).toUpperCase();
  const awayCode = pressureData.extractedTeams?.awayCode || awayTeamName.substring(0, 3).toUpperCase();

  const timeline = pressureData.timeline || [];
  const maxMinute = pressureData.totalMinutes || Math.max(90, ...timeline.map((p) => p.minute));
  const sortedTimeline = [...timeline].sort((a, b) => a.minute - b.minute);

  // Time markers for the X-axis
  const timeMarkers = [15, 30, 45, 60, 75, 90];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header with Dominance Summary */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Termômetro de Pressão & Momentos da Partida
              </h3>
              <p className="text-xs text-slate-400">
                Visualização do volume ofensivo e picos de intensidade minuto a minuto
              </p>
            </div>
          </div>

          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs font-semibold px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10"
            >
              Reanalisar / Editar
            </button>
          )}
        </div>

        {/* Dominance Bar Comparison */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <div className="flex items-center gap-2">
              {homeLogoUrl && <img src={homeLogoUrl} alt={homeTeamName} className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />}
              <span className="text-slate-100">{homeTeamName} ({homeCode})</span>
              <span className="px-2 py-0.5 bg-blue-500 text-white rounded-md text-xs font-mono font-bold">
                {pressureData.homeDominancePct}%
              </span>
            </div>

            <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              Domínio da Partida
            </span>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-500 text-white rounded-md text-xs font-mono font-bold">
                {pressureData.awayDominancePct}%
              </span>
              <span className="text-slate-100">{awayTeamName} ({awayCode})</span>
              {awayLogoUrl && <img src={awayLogoUrl} alt={awayTeamName} className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />}
            </div>
          </div>

          {/* Comparative Progress Bar */}
          <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden flex p-0.5 gap-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-l-full transition-all duration-500"
              style={{ width: `${pressureData.homeDominancePct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-slate-400 to-slate-300 rounded-r-full transition-all duration-500"
              style={{ width: `${pressureData.awayDominancePct}%` }}
            />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-700/40 text-center text-xs">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/30">
              <span className="text-[10px] text-slate-400 block font-medium">Picos Críticos (Mandante)</span>
              <span className="text-sm font-black text-blue-400 font-mono flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-blue-400" />
                {pressureData.homePeakCount}
              </span>
            </div>

            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/30">
              <span className="text-[10px] text-slate-400 block font-medium">Picos Críticos (Visitante)</span>
              <span className="text-sm font-black text-slate-300 font-mono flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-slate-400" />
                {pressureData.awayPeakCount}
              </span>
            </div>

            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/30">
              <span className="text-[10px] text-slate-400 block font-medium">Total de Gols Detectados</span>
              <span className="text-sm font-black text-emerald-400 font-mono flex items-center justify-center gap-1">
                ⚽ {pressureData.events?.filter((e) => e.type === 'goal').length || 0}
              </span>
            </div>

            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/30">
              <span className="text-[10px] text-slate-400 block font-medium">Minutos Monitorados</span>
              <span className="text-sm font-black text-amber-400 font-mono flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {maxMinute}'
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Pressure Graph Canvas / Chart Area */}
      <div className="p-5 space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-3 h-3 bg-slate-900 rounded-sm inline-block" />
              <span>{homeCode} (Mandante - Cima)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-3 h-3 bg-slate-400 rounded-sm inline-block" />
              <span>{awayCode} (Visitante - Baixo)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 font-medium">
              <span className="w-3 h-0.5 border-b-2 border-dashed border-rose-400 inline-block" />
              <span>Limiar de Ataque Crítico</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Passe o mouse sobre as barras para detalhes do minuto
          </div>
        </div>

        {/* Visual Momentum Chart Box */}
        <div className="relative bg-slate-50 rounded-xl border border-slate-200 p-4 select-none">
          {/* Top Label (Home Team) */}
          <div className="absolute top-2 left-4 text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[10px] font-mono">{homeCode}</span>
            <span>Ataque / Pressão do Mandante</span>
          </div>

          {/* Bottom Label (Away Team) */}
          <div className="absolute bottom-2 left-4 text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-slate-400 text-slate-900 rounded text-[10px] font-mono">{awayCode}</span>
            <span>Ataque / Pressão do Visitante</span>
          </div>

          {/* The Chart SVG / Container */}
          <div className="relative h-64 w-full my-6 flex items-center">
            {/* Upper Danger Threshold Line (70% home pressure) */}
            <div className="absolute top-[20%] left-0 right-0 border-b border-dashed border-rose-300 pointer-events-none flex items-center justify-end pr-2">
              <span className="text-[9px] font-mono text-rose-500 bg-rose-50 px-1 rounded">Zona Crítica (+70)</span>
            </div>

            {/* Zero Axis / Center Line */}
            <div className="absolute top-1/2 left-0 right-0 border-b-2 border-slate-300 pointer-events-none z-10" />

            {/* Halftime Divider (at 45') */}
            <div className="absolute top-0 bottom-0 left-[50%] border-r border-dashed border-slate-400 pointer-events-none z-10 flex flex-col justify-between py-1">
              <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-200/80 px-1 rounded -translate-x-1/2">HT (Intervalo)</span>
              <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-200/80 px-1 rounded -translate-x-1/2">45'</span>
            </div>

            {/* Lower Danger Threshold Line (70% away pressure) */}
            <div className="absolute bottom-[20%] left-0 right-0 border-b border-dashed border-rose-300 pointer-events-none flex items-center justify-end pr-2">
              <span className="text-[9px] font-mono text-rose-500 bg-rose-50 px-1 rounded">Zona Crítica (-70)</span>
            </div>

            {/* Bars rendering across the match width */}
            <div className="relative w-full h-full flex items-center gap-[2px] z-20">
              {sortedTimeline.map((pt, idx) => {
                const isHome = pt.value > 0 || pt.team === 'home';
                const isAway = pt.value < 0 || pt.team === 'away';
                const absVal = Math.min(100, Math.abs(pt.value));
                const heightPct = (absVal / 100) * 45; // Max 45% height in half

                const isGoal = pt.event === 'goal_home' || pt.event === 'goal_away';
                const isPeak = pt.isPeak || absVal >= 65;

                return (
                  <div
                    key={`${pt.minute}-${idx}`}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="relative flex-1 h-full flex items-center justify-center group cursor-pointer"
                  >
                    {/* Goal Marker Indicator if present */}
                    {isGoal && (
                      <div
                        className={`absolute z-30 flex flex-col items-center pointer-events-none ${
                          isHome ? 'top-1' : 'bottom-1'
                        }`}
                      >
                        <div className="animate-bounce p-0.5 bg-white rounded-full shadow-md border border-slate-300 text-xs">
                          ⚽
                        </div>
                        <span className="text-[9px] font-black font-mono text-slate-900 bg-amber-300 px-1 rounded shadow-sm whitespace-nowrap">
                          {pt.minute}' GOL!
                        </span>
                      </div>
                    )}

                    {/* Bar Component */}
                    {isHome && (
                      <div
                        className={`w-full rounded-t-sm transition-all duration-150 ${
                          isPeak
                            ? 'bg-slate-900 group-hover:bg-blue-600'
                            : 'bg-slate-800 group-hover:bg-blue-500'
                        }`}
                        style={{
                          height: `${Math.max(4, heightPct)}%`,
                          marginBottom: 'auto',
                          marginTop: `${50 - heightPct}%`,
                        }}
                      />
                    )}

                    {isAway && (
                      <div
                        className={`w-full rounded-b-sm transition-all duration-150 ${
                          isPeak
                            ? 'bg-slate-400 group-hover:bg-indigo-400'
                            : 'bg-slate-400/80 group-hover:bg-indigo-300'
                        }`}
                        style={{
                          height: `${Math.max(4, heightPct)}%`,
                          marginTop: 'auto',
                          marginBottom: `${50 - heightPct}%`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time markers axis at bottom */}
          <div className="flex justify-between text-[11px] font-mono text-slate-500 font-bold px-2 pt-2 border-t border-slate-200">
            <span>0'</span>
            <span>15'</span>
            <span>30'</span>
            <span className="text-slate-700 font-black">45' (HT)</span>
            <span>60'</span>
            <span>75'</span>
            <span>90'+</span>
          </div>

          {/* Tooltip Overlay */}
          {hoveredPoint && (
            <div className="absolute top-3 right-4 z-40 bg-slate-900 text-white px-3 py-2 rounded-xl shadow-xl text-xs space-y-0.5 border border-slate-700 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-amber-400 font-mono">Minuto {hoveredPoint.minute}'</span>
                <span className="text-slate-400">•</span>
                <span>
                  {hoveredPoint.team === 'home'
                    ? `${homeTeamName} (${homeCode})`
                    : hoveredPoint.team === 'away'
                    ? `${awayTeamName} (${awayCode})`
                    : 'Disputa Neutra'}
                </span>
              </div>
              <div className="text-slate-300 text-[11px] flex items-center gap-2">
                <span>Intensidade: <strong className="font-mono text-white">{Math.abs(hoveredPoint.value)}%</strong></span>
                {hoveredPoint.isPeak && (
                  <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[10px] font-bold">
                    Pico Crítico
                  </span>
                )}
              </div>
              {hoveredPoint.eventDescription && (
                <div className="text-emerald-400 font-bold text-[11px] pt-1 border-t border-slate-700">
                  ⚽ {hoveredPoint.eventDescription}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tactical Summary Note */}
        {pressureData.tacticalSummary && (
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-800 block mb-0.5">Leitura Tática da Partida:</span>
              <p className="leading-relaxed text-slate-700">{pressureData.tacticalSummary}</p>
            </div>
          </div>
        )}

        {/* 15-Minute Intervals Breakdown Section */}
        {pressureData.intervals && pressureData.intervals.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowIntervals(!showIntervals)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Domínio por Intervalo de 15 Minutos ({pressureData.intervals.length} Períodos)
              </span>
              {showIntervals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showIntervals && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3">
                {pressureData.intervals.map((it, i) => {
                  const isHomeDominant = it.dominantTeam === 'home' || it.homeAvg > it.awayAvg;
                  const isAwayDominant = it.dominantTeam === 'away' || it.awayAvg > it.homeAvg;

                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs text-center space-y-1.5 transition-all ${
                        isHomeDominant
                          ? 'bg-slate-900 text-white border-slate-800 shadow-sm'
                          : isAwayDominant
                          ? 'bg-slate-100 text-slate-900 border-slate-300'
                          : 'bg-white text-slate-800 border-slate-200'
                      }`}
                    >
                      <span className="block font-mono font-black text-[11px] opacity-80">
                        {it.interval}
                      </span>

                      <div className="text-xs font-black">
                        {isHomeDominant ? (
                          <span className="text-blue-400">Domínio {homeCode}</span>
                        ) : isAwayDominant ? (
                          <span className="text-indigo-600 font-bold">Domínio {awayCode}</span>
                        ) : (
                          <span className="text-slate-500">Equilibrado</span>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-1 font-mono text-[10px] opacity-90 pt-1 border-t border-current/10">
                        <span>{homeCode}: <strong>{Math.round(it.homeAvg)}%</strong></span>
                        <span>•</span>
                        <span>{awayCode}: <strong>{Math.round(it.awayAvg)}%</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

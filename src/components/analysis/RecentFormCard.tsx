import React, { useState } from 'react';
import { Shield, MapPin, Calendar, Trophy, ChevronRight, Activity } from 'lucide-react';
import { TeamSampleMatch } from '../../utils/analysisEngine';
import { isValidImageUrl } from '../../utils/imageHelper';

export interface RecentFormCardProps {
  title?: string;
  teamName: string;
  teamLogoUrl?: string;
  isHomePerspective?: boolean;
  matches: TeamSampleMatch[];
  subtitle?: string;
  summaryStats?: {
    pts: number;
    maxPts: number;
    pct: string;
    gf: number;
    ga: number;
  };
}

import { formatBrasiliaDotDate, formatBrasiliaDate } from '../../utils/dateTimeUtils';

/**
 * Formata a data no formato exato "DD.MM." (ex: "09.05.", "14.08.") conforme o padrão solicitado em Horário de Brasília
 */
export function formatFormDateDot(dateStr?: string): string {
  return formatBrasiliaDotDate(dateStr);
}

export const RecentFormCard: React.FC<RecentFormCardProps> = ({
  title = 'Forma recente',
  teamName,
  teamLogoUrl,
  isHomePerspective,
  matches,
  subtitle,
  summaryStats,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<{
    id: string;
    item: TeamSampleMatch;
  } | null>(null);

  // Ordenar cronologicamente do mais antigo para o mais recente (esquerda para a direita)
  // exatamente como no exemplo: 09.05. -> 14.05. -> 01.08. -> 14.08. -> 18.08.
  const chronologicalMatches = React.useMemo(() => {
    return [...matches].reverse();
  }, [matches]);

  return (
    <div className="bg-[#111827] text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-4">
      {/* Cabeçalho do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {isValidImageUrl(teamLogoUrl) ? (
            <img
              src={teamLogoUrl}
              alt={teamName}
              className="w-7 h-7 object-contain rounded"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 bg-slate-800 text-slate-200 border border-slate-700 font-black rounded flex items-center justify-center text-xs">
              {teamName ? teamName.substring(0, 2).toUpperCase() : '??'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold tracking-tight text-white">{title}</h4>
              {isHomePerspective !== undefined && (
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isHomePerspective
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {isHomePerspective ? 'Mandante' : 'Visitante'}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {summaryStats && (
          <div className="text-left sm:text-right text-xs font-mono text-slate-300 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700/80 self-start sm:self-auto">
            <span className="text-amber-400 font-bold">{summaryStats.pts}</span>/{summaryStats.maxPts} pts{' '}
            <span className="text-slate-400">({summaryStats.pct}%)</span> •{' '}
            <span className="text-emerald-400 font-semibold">GM: {summaryStats.gf}</span>{' '}
            <span className="text-rose-400 font-semibold">GS: {summaryStats.ga}</span>
          </div>
        )}
      </div>

      {/* Grid Horizontal dos Últimos Jogos no Padrão Solicitado */}
      {chronologicalMatches.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 italic bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
          Nenhuma partida anterior registrada no período
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2 sm:gap-3.5 pt-1">
          {chronologicalMatches.map((item, idx) => {
            const key = `form-${item.match.id}-${idx}`;
            const isWin = item.result === 'W';
            const isDraw = item.result === 'D';
            const isLoss = item.result === 'L';

            // Cores do Pill conforme o resultado
            let pillBg = 'bg-[#ef4444] hover:bg-[#dc2626] text-white'; // Derrota
            if (isWin) {
              pillBg = 'bg-[#22c55e] hover:bg-[#16a34a] text-white'; // Vitória
            } else if (isDraw) {
              pillBg = 'bg-[#eab308] hover:bg-[#ca8a04] text-slate-950'; // Empate
            }

            const formattedDate = formatFormDateDot(item.match.matchDate);
            const homeScore = item.match.homeScore ?? (item.isHome ? item.teamGoals : item.oppGoals);
            const awayScore = item.match.awayScore ?? (item.isHome ? item.oppGoals : item.teamGoals);
            const scoreDisplay = `${homeScore} - ${awayScore}`;

            return (
              <div key={key} className="relative flex flex-col items-center group">
                {/* 1. DATA NO FORMATO DD.MM. */}
                <span className="text-[11px] sm:text-xs font-semibold text-slate-300 font-mono tracking-tight mb-2">
                  {formattedDate}
                </span>

                {/* 2. ESCUDO DO ADVERSÁRIO */}
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 group-hover:border-slate-600 transition-colors mb-2.5 shadow-inner"
                  title={item.opponentName}
                >
                  {isValidImageUrl(item.opponentLogoUrl) ? (
                    <img
                      src={item.opponentLogoUrl}
                      alt={item.opponentName}
                      className="w-full h-full object-contain filter drop-shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[10px] font-black text-slate-400 bg-slate-800 rounded">
                      <Shield className="w-4 h-4 text-slate-400 mb-0.5" />
                      <span className="leading-none text-[8px] truncate max-w-[32px]">
                        {item.opponentName ? item.opponentName.substring(0, 3).toUpperCase() : 'ADV'}
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. BOTÃO/PILL COM O PLACAR E COR DO RESULTADO */}
                <button
                  type="button"
                  onMouseEnter={() => setActiveTooltip({ id: key, item })}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setActiveTooltip(activeTooltip?.id === key ? null : { id: key, item })}
                  className={`w-full max-w-[72px] sm:max-w-[80px] py-1 sm:py-1.5 px-1 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm font-mono tracking-wider shadow-md transition-all transform group-hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center ${pillBg}`}
                >
                  {scoreDisplay}
                </button>

                {/* 4. TOOLTIP COMPLETO COM DETALHES DO JOGO */}
                {activeTooltip?.id === key && (
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 w-56 sm:w-64 p-3.5 bg-slate-950 text-white rounded-2xl shadow-2xl text-xs space-y-2 border border-slate-700 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                      <span className="font-semibold text-slate-300">
                        {formatBrasiliaDate(item.match.matchDate)}
                      </span>
                      <span
                        className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${
                          isWin
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isDraw
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {isWin ? 'Vitória' : isDraw ? 'Empate' : 'Derrota'} ({item.isHome ? 'Em Casa' : 'Fora'})
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-black text-sm">
                      <span className="truncate pr-2 text-slate-200">
                        {item.isHome ? teamName : item.opponentName}
                      </span>
                      <span className="font-mono px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 shrink-0">
                        {item.match.homeScore ?? 0} - {item.match.awayScore ?? 0}
                      </span>
                      <span className="truncate pl-2 text-slate-200 text-right">
                        {item.isHome ? item.opponentName : teamName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 bg-slate-900/90 p-2 rounded-xl border border-slate-800/80 font-mono">
                      <div>
                        HT: <span className="text-slate-200 font-bold">{item.match.stats?.halftimeHomeScore ?? 0}-{item.match.stats?.halftimeAwayScore ?? 0}</span>
                      </div>
                      {item.xgFor !== null && (
                        <div>
                          xG: <span className="text-slate-200 font-bold">{item.xgFor.toFixed(2)}</span>
                        </div>
                      )}
                      {item.cornersFor !== null && (
                        <div>
                          Escanteios: <span className="text-slate-200 font-bold">{item.cornersFor}</span>
                        </div>
                      )}
                      {item.opponentOdd && (
                        <div>
                          Odd Adv: <span className="text-amber-300 font-bold">{item.opponentOdd.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Flame, MapPin, Trophy, Shield } from 'lucide-react';
import { MatchAnalysisResult, TeamSampleMatch } from '../../utils/analysisEngine';
import { RecentFormCard } from './RecentFormCard';

interface FormTrackerSectionProps {
  analysis: MatchAnalysisResult;
}

export const FormTrackerSection: React.FC<FormTrackerSectionProps> = ({ analysis }) => {
  const { homeTeam, awayTeam, homeFormG5, homeFormE5, awayFormG5, awayFormE5 } = analysis;

  // Visualizador selecionado: 'ALL' (Geral + Específico) | 'G5' (Geral) | 'E5' (Mando)
  const [formMode, setFormMode] = useState<'ALL' | 'G5' | 'E5'>('ALL');

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
      {/* Header com Filtro de Visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Módulo 1: Forma Recente das Equipes
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhamento detalhado dos últimos 5 jogos com datas, escudos dos adversários e placares coloridos por resultado
          </p>
        </div>

        {/* Seletor de Modo G5 / E5 / Ambos */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto border border-slate-200/80">
          <button
            type="button"
            onClick={() => setFormMode('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              formMode === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visão Completa
          </button>
          <button
            type="button"
            onClick={() => setFormMode('G5')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              formMode === 'G5'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3 h-3 text-slate-500" />
            Geral (G5)
          </button>
          <button
            type="button"
            onClick={() => setFormMode('E5')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              formMode === 'E5'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3 h-3 text-blue-600" />
            Por Mando (E5)
          </button>
        </div>
      </div>

      {/* Grid de Cards de Forma Recente no Novo Padrão */}
      <div className="space-y-6">
        {/* SESSÃO 1: FORMA GERAL (G5) */}
        {(formMode === 'ALL' || formMode === 'G5') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                Forma Geral (Últimos 5 Jogos Gerais - G5)
              </h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Mandante G5 */}
              <RecentFormCard
                title={`Forma recente • ${homeTeam.name}`}
                teamName={homeTeam.name}
                teamLogoUrl={homeTeam.logoUrl}
                isHomePerspective={true}
                matches={homeFormG5}
                subtitle="Últimos 5 jogos gerais disputados"
                summaryStats={homeG5Stats}
              />

              {/* Visitante G5 */}
              <RecentFormCard
                title={`Forma recente • ${awayTeam.name}`}
                teamName={awayTeam.name}
                teamLogoUrl={awayTeam.logoUrl}
                isHomePerspective={false}
                matches={awayFormG5}
                subtitle="Últimos 5 jogos gerais disputados"
                summaryStats={awayG5Stats}
              />
            </div>
          </div>
        )}

        {/* SESSÃO 2: FORMA ESPECÍFICA NO MANDO (E5) */}
        {(formMode === 'ALL' || formMode === 'E5') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                Forma Específica por Mando de Campo (E5)
              </h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Mandante Jogando em Casa */}
              <RecentFormCard
                title={`Forma recente em Casa • ${homeTeam.name}`}
                teamName={homeTeam.name}
                teamLogoUrl={homeTeam.logoUrl}
                isHomePerspective={true}
                matches={homeFormE5}
                subtitle="Últimos 5 jogos disputados no seu estádio (Em Casa)"
                summaryStats={homeE5Stats}
              />

              {/* Visitante Jogando Fora */}
              <RecentFormCard
                title={`Forma recente Fora • ${awayTeam.name}`}
                teamName={awayTeam.name}
                teamLogoUrl={awayTeam.logoUrl}
                isHomePerspective={false}
                matches={awayFormE5}
                subtitle="Últimos 5 jogos disputados como visitante (Fora de Casa)"
                summaryStats={awayE5Stats}
              />
            </div>
          </div>
        )}
      </div>

      {/* Legenda Explicativa */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-3 h-3 rounded bg-[#22c55e]"></span> Vitória (V)
          </span>
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-3 h-3 rounded bg-[#eab308]"></span> Empate (E)
          </span>
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-3 h-3 rounded bg-[#ef4444]"></span> Derrota (D)
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          *Passe o mouse ou toque sobre o placar de cada jogo para abrir o resumo completo com HT, escanteios e estatísticas.
        </p>
      </div>
    </div>
  );
};

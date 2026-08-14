import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Match, MatchStatus, MatchOdds, DbState } from '../types';

interface QuickScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  allMatches?: Match[];
  onSaveQuickData: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    status: MatchStatus,
    odds: MatchOdds,
    htHomeScore?: number | null,
    htAwayScore?: number | null
  ) => void;
  onSelectNextMatch?: (nextMatch: Match) => void;
}

export const QuickScoreModal: React.FC<QuickScoreModalProps> = ({
  isOpen,
  onClose,
  match,
  allMatches = [],
  onSaveQuickData,
  onSelectNextMatch,
}) => {
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [htHomeScore, setHtHomeScore] = useState<string>('');
  const [htAwayScore, setHtAwayScore] = useState<string>('');
  const [status, setStatus] = useState<MatchStatus>('FINALIZADO');

  // Odds FT
  const [oddHomeFT, setOddHomeFT] = useState<string>('');
  const [oddDrawFT, setOddDrawFT] = useState<string>('');
  const [oddAwayFT, setOddAwayFT] = useState<string>('');
  const [oddOver25FT, setOddOver25FT] = useState<string>('');
  const [oddUnder25FT, setOddUnder25FT] = useState<string>('');
  const [oddBttsFT, setOddBttsFT] = useState<string>('');

  // Odds HT
  const [oddOver05HT, setOddOver05HT] = useState<string>('');

  useEffect(() => {
    if (match) {
      setHomeScore(match.homeScore !== null ? String(match.homeScore) : '');
      setAwayScore(match.awayScore !== null ? String(match.awayScore) : '');
      setStatus(
        match.status === 'AGENDADO' && (match.homeScore !== null || match.awayScore !== null)
          ? 'FINALIZADO'
          : match.status
      );

      const st = match.stats || {};
      setHtHomeScore(
        st.halftimeHomeScore !== undefined && st.halftimeHomeScore !== null
          ? String(st.halftimeHomeScore)
          : ''
      );
      setHtAwayScore(
        st.halftimeAwayScore !== undefined && st.halftimeAwayScore !== null
          ? String(st.halftimeAwayScore)
          : ''
      );

      const o = match.odds || {};
      setOddHomeFT(o.homeFT != null ? String(o.homeFT) : '');
      setOddDrawFT(o.drawFT != null ? String(o.drawFT) : '');
      setOddAwayFT(o.awayFT != null ? String(o.awayFT) : '');
      setOddOver25FT(o.over25FT != null ? String(o.over25FT) : '');
      setOddUnder25FT(o.under25FT != null ? String(o.under25FT) : '');
      setOddBttsFT(o.bttsFT != null ? String(o.bttsFT) : '');
      setOddOver05HT(o.over05HT != null ? String(o.over05HT) : '');
    }
  }, [match, isOpen]);

  if (!isOpen || !match) return null;

  // Find next pending match in list to allow fast sequence filling
  const pendingMatches = allMatches.filter(
    m => m.id !== match.id && (m.status === 'AGENDADO' || m.homeScore === null || !m.odds?.homeFT)
  );
  const nextPendingMatch = pendingMatches[0] || null;

  const handleSave = (saveAndNext = false) => {
    const finalHomeScore = homeScore.trim() === '' ? null : parseInt(homeScore, 10);
    const finalAwayScore = awayScore.trim() === '' ? null : parseInt(awayScore, 10);
    const finalHtHome = htHomeScore.trim() === '' ? null : parseInt(htHomeScore, 10);
    const finalHtAway = htAwayScore.trim() === '' ? null : parseInt(htAwayScore, 10);

    const updatedOdds: MatchOdds = {
      ...(match.odds || {}),
      homeFT: oddHomeFT.trim() !== '' ? parseFloat(oddHomeFT) : null,
      drawFT: oddDrawFT.trim() !== '' ? parseFloat(oddDrawFT) : null,
      awayFT: oddAwayFT.trim() !== '' ? parseFloat(oddAwayFT) : null,
      over25FT: oddOver25FT.trim() !== '' ? parseFloat(oddOver25FT) : null,
      under25FT: oddUnder25FT.trim() !== '' ? parseFloat(oddUnder25FT) : null,
      bttsFT: oddBttsFT.trim() !== '' ? parseFloat(oddBttsFT) : null,
      over05HT: oddOver05HT.trim() !== '' ? parseFloat(oddOver05HT) : null,
    };

    onSaveQuickData(
      match.id,
      finalHomeScore,
      finalAwayScore,
      status,
      updatedOdds,
      finalHtHome,
      finalHtAway
    );

    if (saveAndNext && nextPendingMatch && onSelectNextMatch) {
      onSelectNextMatch(nextPendingMatch);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
                {match.countryName} • {match.leagueName}
              </span>
              <span className="text-xs text-blue-100 font-mono">{match.round || 'Rodada'}</span>
            </div>
            <h2 className="text-base font-extrabold mt-1">
              ⚡ Preenchimento Rápido: Placar & Odds
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Match Score Block */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-4">
            <div className="flex items-center justify-center gap-4 sm:gap-8">
              {/* Home Team */}
              <div className="flex-1 text-right">
                <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                  {match.homeTeamName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">🏠 Mandante</div>
              </div>

              {/* Score Inputs */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={homeScore}
                  onChange={(e) => {
                    setHomeScore(e.target.value);
                    if (e.target.value !== '' && status === 'AGENDADO') setStatus('FINALIZADO');
                  }}
                  className="w-14 h-14 bg-white border-2 border-blue-400 focus:border-blue-600 rounded-xl text-center text-2xl font-black text-slate-900 shadow-sm focus:outline-none"
                />
                <span className="text-slate-400 font-black text-xl">x</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={awayScore}
                  onChange={(e) => {
                    setAwayScore(e.target.value);
                    if (e.target.value !== '' && status === 'AGENDADO') setStatus('FINALIZADO');
                  }}
                  className="w-14 h-14 bg-white border-2 border-blue-400 focus:border-blue-600 rounded-xl text-center text-2xl font-black text-slate-900 shadow-sm focus:outline-none"
                />
              </div>

              {/* Away Team */}
              <div className="flex-1 text-left">
                <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                  {match.awayTeamName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">✈️ Visitante</div>
              </div>
            </div>

            {/* Sub-scores (HT) & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              {/* Status */}
              <div className="text-left">
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Status do Jogo
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MatchStatus)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="FINALIZADO">✅ Finalizado</option>
                  <option value="AGENDADO">⏳ Agendado (A Realizar)</option>
                  <option value="EM_ANDAMENTO">🔴 Em Andamento (Ao Vivo)</option>
                  <option value="ADIADO">⚠️ Adiado / Cancelado</option>
                </select>
              </div>

              {/* Halftime score */}
              <div className="text-left">
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Placar 1º Tempo (HT)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={htHomeScore}
                    onChange={(e) => setHtHomeScore(e.target.value)}
                    className="w-1/2 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-400">x</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={htAwayScore}
                    onChange={(e) => setHtAwayScore(e.target.value)}
                    className="w-1/2 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Odds FT Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span>Odds Principais do Jogo (1X2 & Gols)</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* 1 */}
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                  Mandante (1)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ex: 1.85"
                  value={oddHomeFT}
                  onChange={(e) => setOddHomeFT(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-900 focus:border-blue-500 text-center"
                />
              </div>

              {/* X */}
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                  Empate (X)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ex: 3.40"
                  value={oddDrawFT}
                  onChange={(e) => setOddDrawFT(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-900 focus:border-blue-500 text-center"
                />
              </div>

              {/* 2 */}
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                  Visitante (2)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ex: 4.20"
                  value={oddAwayFT}
                  onChange={(e) => setOddAwayFT(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-900 focus:border-blue-500 text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {/* Over 2.5 */}
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                  Over 2.5 FT
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ex: 1.95"
                  value={oddOver25FT}
                  onChange={(e) => setOddOver25FT(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-900 focus:border-blue-500 text-center"
                />
              </div>

              {/* Under 2.5 */}
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                  Under 2.5 FT
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ex: 1.80"
                  value={oddUnder25FT}
                  onChange={(e) => setOddUnder25FT(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-900 focus:border-blue-500 text-center"
                />
              </div>

              {/* BTTS */}
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                  Ambas Marcam
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ex: 1.75"
                  value={oddBttsFT}
                  onChange={(e) => setOddBttsFT(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-900 focus:border-blue-500 text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {nextPendingMatch && onSelectNextMatch && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition-colors"
                title="Salvar este e abrir o próximo jogo pendente de dados"
              >
                <span>Salvar & Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>Salvar Dados</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

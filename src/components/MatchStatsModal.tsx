import React, { useState, useEffect } from 'react';
import { X, BarChart2, Check, Trophy, Shield, Activity, Target, Flag, AlertTriangle, Disc } from 'lucide-react';
import { Match, MatchStats, MatchStatus } from '../types';

interface MatchStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onSaveStats: (matchId: string, homeScore: number | null, awayScore: number | null, status: MatchStatus, stats: MatchStats) => void;
}

export const MatchStatsModal: React.FC<MatchStatsModalProps> = ({
  isOpen,
  onClose,
  match,
  onSaveStats,
}) => {
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [status, setStatus] = useState<MatchStatus>('FINALIZADO');

  // Stats fields
  const [htHome, setHtHome] = useState<string>('');
  const [htAway, setHtAway] = useState<string>('');
  const [possHome, setPossHome] = useState<string>('');
  const [possAway, setPossAway] = useState<string>('');
  const [shotsHome, setShotsHome] = useState<string>('');
  const [shotsAway, setShotsAway] = useState<string>('');
  const [shotsTargetHome, setShotsTargetHome] = useState<string>('');
  const [shotsTargetAway, setShotsTargetAway] = useState<string>('');
  const [cornersHome, setCornersHome] = useState<string>('');
  const [cornersAway, setCornersAway] = useState<string>('');
  const [foulsHome, setFoulsHome] = useState<string>('');
  const [foulsAway, setFoulsAway] = useState<string>('');
  const [yellowHome, setYellowHome] = useState<string>('');
  const [yellowAway, setYellowAway] = useState<string>('');
  const [redHome, setRedHome] = useState<string>('');
  const [redAway, setRedAway] = useState<string>('');
  const [offsidesHome, setOffsidesHome] = useState<string>('');
  const [offsidesAway, setOffsidesAway] = useState<string>('');
  const [scorersHome, setScorersHome] = useState<string>('');
  const [scorersAway, setScorersAway] = useState<string>('');

  useEffect(() => {
    if (match) {
      setHomeScore(match.homeScore !== null ? String(match.homeScore) : '');
      setAwayScore(match.awayScore !== null ? String(match.awayScore) : '');
      setStatus(match.status === 'AGENDADO' && (match.homeScore !== null || match.awayScore !== null) ? 'FINALIZADO' : match.status);

      const st = match.stats || {};
      setHtHome(st.halftimeHomeScore !== undefined && st.halftimeHomeScore !== null ? String(st.halftimeHomeScore) : '');
      setHtAway(st.halftimeAwayScore !== undefined && st.halftimeAwayScore !== null ? String(st.halftimeAwayScore) : '');
      setPossHome(st.possessionHome !== undefined && st.possessionHome !== null ? String(st.possessionHome) : '');
      setPossAway(st.possessionAway !== undefined && st.possessionAway !== null ? String(st.possessionAway) : '');
      setShotsHome(st.shotsHome !== undefined && st.shotsHome !== null ? String(st.shotsHome) : '');
      setShotsAway(st.shotsAway !== undefined && st.shotsAway !== null ? String(st.shotsAway) : '');
      setShotsTargetHome(st.shotsOnTargetHome !== undefined && st.shotsOnTargetHome !== null ? String(st.shotsOnTargetHome) : '');
      setShotsTargetAway(st.shotsOnTargetAway !== undefined && st.shotsOnTargetAway !== null ? String(st.shotsOnTargetAway) : '');
      setCornersHome(st.cornersHome !== undefined && st.cornersHome !== null ? String(st.cornersHome) : '');
      setCornersAway(st.cornersAway !== undefined && st.cornersAway !== null ? String(st.cornersAway) : '');
      setFoulsHome(st.foulsHome !== undefined && st.foulsHome !== null ? String(st.foulsHome) : '');
      setFoulsAway(st.foulsAway !== undefined && st.foulsAway !== null ? String(st.foulsAway) : '');
      setYellowHome(st.yellowCardsHome !== undefined && st.yellowCardsHome !== null ? String(st.yellowCardsHome) : '');
      setYellowAway(st.yellowCardsAway !== undefined && st.yellowCardsAway !== null ? String(st.yellowCardsAway) : '');
      setRedHome(st.redCardsHome !== undefined && st.redCardsHome !== null ? String(st.redCardsHome) : '');
      setRedAway(st.redCardsAway !== undefined && st.redCardsAway !== null ? String(st.redCardsAway) : '');
      setOffsidesHome(st.offsidesHome !== undefined && st.offsidesHome !== null ? String(st.offsidesHome) : '');
      setOffsidesAway(st.offsidesAway !== undefined && st.offsidesAway !== null ? String(st.offsidesAway) : '');
      setScorersHome(st.scorersHome || '');
      setScorersAway(st.scorersAway || '');
    }
  }, [match, isOpen]);

  if (!isOpen || !match) return null;

  const handlePossessionHomeChange = (val: string) => {
    setPossHome(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setPossAway(String(100 - num));
    }
  };

  const handleScoreChange = (type: 'home' | 'away', val: string) => {
    if (type === 'home') setHomeScore(val);
    else setAwayScore(val);

    // Auto switch status to FINALIZADO if it was AGENDADO
    if (status === 'AGENDADO' && val !== '') {
      setStatus('FINALIZADO');
    }
  };

  const parseNum = (val: string): number | null => {
    if (val === '' || val === null || val === undefined) return null;
    const n = parseInt(val, 10);
    return isNaN(n) ? null : n;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const statsObj: MatchStats = {
      halftimeHomeScore: parseNum(htHome),
      halftimeAwayScore: parseNum(htAway),
      possessionHome: parseNum(possHome),
      possessionAway: parseNum(possAway),
      shotsHome: parseNum(shotsHome),
      shotsAway: parseNum(shotsAway),
      shotsOnTargetHome: parseNum(shotsTargetHome),
      shotsOnTargetAway: parseNum(shotsTargetAway),
      cornersHome: parseNum(cornersHome),
      cornersAway: parseNum(cornersAway),
      foulsHome: parseNum(foulsHome),
      foulsAway: parseNum(foulsAway),
      yellowCardsHome: parseNum(yellowHome),
      yellowCardsAway: parseNum(yellowAway),
      redCardsHome: parseNum(redHome),
      redCardsAway: parseNum(redAway),
      offsidesHome: parseNum(offsidesHome),
      offsidesAway: parseNum(offsidesAway),
      scorersHome: scorersHome.trim() || undefined,
      scorersAway: scorersAway.trim() || undefined,
    };

    const finalHomeScore = parseNum(homeScore);
    const finalAwayScore = parseNum(awayScore);

    onSaveStats(match.id, finalHomeScore, finalAwayScore, status, statsObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0e0e0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#080808] border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Estatísticas Detalhadas
              </h2>
              <p className="text-xs text-gray-400">
                {match.homeTeamName} x {match.awayTeamName} • ID: <span className="text-emerald-400 font-mono font-bold">{match.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Placar & Status Section */}
          <div className="bg-[#080808] p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Placar Final & Status da Partida
              </span>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MatchStatus)}
                className="bg-[#1a1a1a] border border-white/10 text-xs text-white rounded-lg px-2.5 py-1 focus:border-emerald-500 font-semibold"
              >
                <option value="FINALIZADO">Finalizado</option>
                <option value="AGENDADO">Agendado</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="ADIADO">Adiado</option>
              </select>
            </div>

            {/* Scoreboard Input */}
            <div className="grid grid-cols-7 items-center gap-2 py-3 bg-[#0e0e0e] rounded-xl border border-white/10 text-center">
              <div className="col-span-3 px-2">
                <span className="text-xs font-bold text-white block truncate mb-1.5">
                  {match.homeTeamName}
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={homeScore}
                  onChange={(e) => handleScoreChange('home', e.target.value)}
                  className="w-16 h-12 text-center text-2xl font-black bg-[#060606] border border-white/10 rounded-xl text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono mx-auto block"
                />
              </div>

              <div className="col-span-1 text-gray-500 font-black text-xl">
                VS
              </div>

              <div className="col-span-3 px-2">
                <span className="text-xs font-bold text-white block truncate mb-1.5">
                  {match.awayTeamName}
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={awayScore}
                  onChange={(e) => handleScoreChange('away', e.target.value)}
                  className="w-16 h-12 text-center text-2xl font-black bg-[#060606] border border-white/10 rounded-xl text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono mx-auto block"
                />
              </div>
            </div>

            {/* Halftime score */}
            <div className="flex items-center justify-between bg-[#0e0e0e] p-3 rounded-xl border border-white/10 text-xs">
              <span className="text-gray-400 font-medium">Placar do 1º Tempo (Intervalo):</span>
              <div className="flex items-center gap-2 font-mono">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={htHome}
                  onChange={(e) => setHtHome(e.target.value)}
                  className="w-10 h-8 text-center bg-[#1a1a1a] border border-white/10 rounded text-white text-xs"
                />
                <span className="text-gray-500 font-bold">-</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={htAway}
                  onChange={(e) => setHtAway(e.target.value)}
                  className="w-10 h-8 text-center bg-[#1a1a1a] border border-white/10 rounded text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Detailed Match Stats Table */}
          <div className="bg-[#080808] p-4 rounded-xl border border-white/10 space-y-4">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              Estatísticas da Partida (Mandante vs Visitante)
            </span>

            <div className="space-y-3 text-xs">
              {/* Posse de Bola */}
              <div className="bg-[#0e0e0e] p-3 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between font-bold text-gray-300">
                  <span>Mandante</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> Posse de Bola (%)
                  </span>
                  <span>Visitante</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="50"
                      value={possHome}
                      onChange={(e) => handlePossessionHomeChange(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2 text-center text-sm font-mono font-bold text-emerald-400"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="50"
                      value={possAway}
                      onChange={(e) => setPossAway(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2 text-center text-sm font-mono font-bold text-emerald-400"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
              </div>

              {/* Grid 2 Columns for Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Chutes Totais */}
                <div className="bg-[#0e0e0e] p-2.5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-400 text-center block">Chutes Totais</span>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={shotsHome}
                      onChange={(e) => setShotsHome(e.target.value)}
                      className="w-14 h-8 text-center bg-[#1a1a1a] border border-white/10 rounded text-xs font-bold text-white font-mono"
                    />
                    <span className="text-gray-500 font-bold text-[10px]">VS</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={shotsAway}
                      onChange={(e) => setShotsAway(e.target.value)}
                      className="w-14 h-8 text-center bg-[#1a1a1a] border border-white/10 rounded text-xs font-bold text-white font-mono"
                    />
                  </div>
                </div>

                {/* Chutes no Gol */}
                <div className="bg-[#0e0e0e] p-2.5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-400 text-center block flex items-center justify-center gap-1">
                    <Target className="w-3 h-3 text-emerald-400" /> Chutes no Gol
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={shotsTargetHome}
                      onChange={(e) => setShotsTargetHome(e.target.value)}
                      className="w-14 h-8 text-center bg-[#1a1a1a] border border-white/10 rounded text-xs font-bold text-emerald-400 font-mono"
                    />
                    <span className="text-gray-500 font-bold text-[10px]">VS</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={shotsTargetAway}
                      onChange={(e) => setShotsTargetAway(e.target.value)}
                      className="w-14 h-8 text-center bg-[#1a1a1a] border border-white/10 rounded text-xs font-bold text-emerald-400 font-mono"
                    />
                  </div>
                </div>

                {/* Escanteios */}
                <div className="bg-[#0e0e0e] p-2.5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-400 text-center block flex items-center justify-center gap-1">
                    <Flag className="w-3 h-3 text-emerald-400" /> Escanteios
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={cornersHome}
                      onChange={(e) => setCornersHome(e.target.value)}
                      className="w-14 h-8 text-center bg-[#1a1a1a] border border-white/10 rounded text-xs font-bold text-white font-mono"
                    />
                    <span className="text-gray-500 font-bold text-[10px]">VS</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={cornersAway}
                      onChange={(e) => setCornersAway(e.target.value)}
                      className="w-14 h-8 text-center bg-[#1a1a1a] border border-white/10 rounded text-xs font-bold text-white font-mono"
                    />
                  </div>
                </div>

                {/* Faltas */}
                <div className="bg-[#0e0e0e] p-2.5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[11px] font-semibold text-gray-400 text-center block">Faltas Cometidas</span>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={foulsHome}
                      onChange={(e) => setFoulsHome(e.target.value)}
                      className="w-14 h-8 text-center bg-[#1a1a1a] border border-white/10 rounded text-xs font-bold text-white font-mono"
                    />
                    <span className="text-gray-500 font-bold text-[10px]">VS</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={foulsAway}
                      onChange={(e) => setFoulsAway(e.target.value)}
                      className="w-14 h-8 text-center bg-[#1a1a1a] border border-white/10 rounded text-xs font-bold text-white font-mono"
                    />
                  </div>
                </div>

                {/* Cartões Amarelos */}
                <div className="bg-[#0e0e0e] p-2.5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[11px] font-semibold text-amber-400 text-center block flex items-center justify-center gap-1">
                    🟨 Cartões Amarelos
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={yellowHome}
                      onChange={(e) => setYellowHome(e.target.value)}
                      className="w-14 h-8 text-center bg-[#1a1a1a] border border-amber-500/20 rounded text-xs font-bold text-amber-400 font-mono"
                    />
                    <span className="text-gray-500 font-bold text-[10px]">VS</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={yellowAway}
                      onChange={(e) => setYellowAway(e.target.value)}
                      className="w-14 h-8 text-center bg-[#1a1a1a] border border-amber-500/20 rounded text-xs font-bold text-amber-400 font-mono"
                    />
                  </div>
                </div>

                {/* Cartões Vermelhos */}
                <div className="bg-[#0e0e0e] p-2.5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[11px] font-semibold text-red-400 text-center block flex items-center justify-center gap-1">
                    🟥 Cartões Vermelhos
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={redHome}
                      onChange={(e) => setRedHome(e.target.value)}
                      className="w-14 h-8 text-center bg-[#1a1a1a] border border-red-500/20 rounded text-xs font-bold text-red-400 font-mono"
                    />
                    <span className="text-gray-500 font-bold text-[10px]">VS</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={redAway}
                      onChange={(e) => setRedAway(e.target.value)}
                      className="w-14 h-8 text-center bg-[#1a1a1a] border border-red-500/20 rounded text-xs font-bold text-red-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Goleadores & Eventos */}
          <div className="bg-[#080808] p-4 rounded-xl border border-white/10 space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5" />
              Goleadores & Autores dos Gols
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">
                  Goleadores {match.homeTeamName}
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pedro (23', 45'), Gabigol (80')"
                  value={scorersHome}
                  onChange={(e) => setScorersHome(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">
                  Goleadores {match.awayTeamName}
                </label>
                <input
                  type="text"
                  placeholder="Ex: Veiga (12')"
                  value={scorersAway}
                  onChange={(e) => setScorersAway(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500 placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-sm font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Salvar Estatísticas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

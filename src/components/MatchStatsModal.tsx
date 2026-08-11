import React, { useState, useEffect } from 'react';
import { X, BarChart2, Check, Trophy, Shield, Activity, Target, Flag, Disc, Clock, Zap } from 'lucide-react';
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

  // Gols & Minutos
  const [htHome, setHtHome] = useState<string>('');
  const [htAway, setHtAway] = useState<string>('');
  const [goalMinutesHome, setGoalMinutesHome] = useState<string>('');
  const [goalMinutesAway, setGoalMinutesAway] = useState<string>('');
  const [firstGoalMinHome, setFirstGoalMinHome] = useState<string>('');
  const [firstGoalMinAway, setFirstGoalMinAway] = useState<string>('');
  const [firstGoalMinMatch, setFirstGoalMinMatch] = useState<string>('');

  // Cantos (Escanteios)
  const [cornersHomeFT, setCornersHomeFT] = useState<string>('');
  const [cornersAwayFT, setCornersAwayFT] = useState<string>('');
  const [cornersHomeHT, setCornersHomeHT] = useState<string>('');
  const [cornersAwayHT, setCornersAwayHT] = useState<string>('');

  // Posse de Bola
  const [possHomeFT, setPossHomeFT] = useState<string>('');
  const [possAwayFT, setPossAwayFT] = useState<string>('');
  const [possHomeHT, setPossHomeHT] = useState<string>('');
  const [possAwayHT, setPossAwayHT] = useState<string>('');

  // Cartões Amarelos
  const [yellowHomeFT, setYellowHomeFT] = useState<string>('');
  const [yellowAwayFT, setYellowAwayFT] = useState<string>('');
  const [yellowHomeHT, setYellowHomeHT] = useState<string>('');
  const [yellowAwayHT, setYellowAwayHT] = useState<string>('');

  // Cartões Vermelhos
  const [redHomeFT, setRedHomeFT] = useState<string>('');
  const [redAwayFT, setRedAwayFT] = useState<string>('');
  const [redHomeHT, setRedHomeHT] = useState<string>('');
  const [redAwayHT, setRedAwayHT] = useState<string>('');

  // Chutes ao Gol (On Target)
  const [shotsTargetHomeFT, setShotsTargetHomeFT] = useState<string>('');
  const [shotsTargetAwayFT, setShotsTargetAwayFT] = useState<string>('');
  const [shotsTargetHomeHT, setShotsTargetHomeHT] = useState<string>('');
  const [shotsTargetAwayHT, setShotsTargetAwayHT] = useState<string>('');

  // Finalizações (Chutes Totais)
  const [shotsHomeFT, setShotsHomeFT] = useState<string>('');
  const [shotsAwayFT, setShotsAwayFT] = useState<string>('');
  const [shotsHomeHT, setShotsHomeHT] = useState<string>('');
  const [shotsAwayHT, setShotsAwayHT] = useState<string>('');

  useEffect(() => {
    if (match) {
      setHomeScore(match.homeScore !== null ? String(match.homeScore) : '');
      setAwayScore(match.awayScore !== null ? String(match.awayScore) : '');
      setStatus(match.status === 'AGENDADO' && (match.homeScore !== null || match.awayScore !== null) ? 'FINALIZADO' : match.status);

      const st = match.stats || {};
      setHtHome(st.halftimeHomeScore !== undefined && st.halftimeHomeScore !== null ? String(st.halftimeHomeScore) : '');
      setHtAway(st.halftimeAwayScore !== undefined && st.halftimeAwayScore !== null ? String(st.halftimeAwayScore) : '');

      setGoalMinutesHome(st.goalMinutesHome || st.scorersHome || '');
      setGoalMinutesAway(st.goalMinutesAway || st.scorersAway || '');
      setFirstGoalMinHome(st.firstGoalMinuteHome !== undefined && st.firstGoalMinuteHome !== null ? String(st.firstGoalMinuteHome) : '');
      setFirstGoalMinAway(st.firstGoalMinuteAway !== undefined && st.firstGoalMinuteAway !== null ? String(st.firstGoalMinuteAway) : '');
      setFirstGoalMinMatch(st.firstGoalMinuteMatch !== undefined && st.firstGoalMinuteMatch !== null ? String(st.firstGoalMinuteMatch) : '');

      setCornersHomeFT(st.cornersHomeFT != null ? String(st.cornersHomeFT) : (st.cornersHome != null ? String(st.cornersHome) : ''));
      setCornersAwayFT(st.cornersAwayFT != null ? String(st.cornersAwayFT) : (st.cornersAway != null ? String(st.cornersAway) : ''));
      setCornersHomeHT(st.cornersHomeHT != null ? String(st.cornersHomeHT) : '');
      setCornersAwayHT(st.cornersAwayHT != null ? String(st.cornersAwayHT) : '');

      setPossHomeFT(st.possessionHomeFT != null ? String(st.possessionHomeFT) : (st.possessionHome != null ? String(st.possessionHome) : ''));
      setPossAwayFT(st.possessionAwayFT != null ? String(st.possessionAwayFT) : (st.possessionAway != null ? String(st.possessionAway) : ''));
      setPossHomeHT(st.possessionHomeHT != null ? String(st.possessionHomeHT) : '');
      setPossAwayHT(st.possessionAwayHT != null ? String(st.possessionAwayHT) : '');

      setYellowHomeFT(st.yellowCardsHomeFT != null ? String(st.yellowCardsHomeFT) : (st.yellowCardsHome != null ? String(st.yellowCardsHome) : ''));
      setYellowAwayFT(st.yellowCardsAwayFT != null ? String(st.yellowCardsAwayFT) : (st.yellowCardsAway != null ? String(st.yellowCardsAway) : ''));
      setYellowHomeHT(st.yellowCardsHomeHT != null ? String(st.yellowCardsHomeHT) : '');
      setYellowAwayHT(st.yellowCardsAwayHT != null ? String(st.yellowCardsAwayHT) : '');

      setRedHomeFT(st.redCardsHomeFT != null ? String(st.redCardsHomeFT) : (st.redCardsHome != null ? String(st.redCardsHome) : ''));
      setRedAwayFT(st.redCardsAwayFT != null ? String(st.redCardsAwayFT) : (st.redCardsAway != null ? String(st.redCardsAway) : ''));
      setRedHomeHT(st.redCardsHomeHT != null ? String(st.redCardsHomeHT) : '');
      setRedAwayHT(st.redCardsAwayHT != null ? String(st.redCardsAwayHT) : '');

      setShotsTargetHomeFT(st.shotsOnTargetHomeFT != null ? String(st.shotsOnTargetHomeFT) : (st.shotsOnTargetHome != null ? String(st.shotsOnTargetHome) : ''));
      setShotsTargetAwayFT(st.shotsOnTargetAwayFT != null ? String(st.shotsOnTargetAwayFT) : (st.shotsOnTargetAway != null ? String(st.shotsOnTargetAway) : ''));
      setShotsTargetHomeHT(st.shotsOnTargetHomeHT != null ? String(st.shotsOnTargetHomeHT) : '');
      setShotsTargetAwayHT(st.shotsOnTargetAwayHT != null ? String(st.shotsOnTargetAwayHT) : '');

      setShotsHomeFT(st.shotsHomeFT != null ? String(st.shotsHomeFT) : (st.shotsHome != null ? String(st.shotsHome) : ''));
      setShotsAwayFT(st.shotsAwayFT != null ? String(st.shotsAwayFT) : (st.shotsAway != null ? String(st.shotsAway) : ''));
      setShotsHomeHT(st.shotsHomeHT != null ? String(st.shotsHomeHT) : '');
      setShotsAwayHT(st.shotsAwayHT != null ? String(st.shotsAwayHT) : '');
    }
  }, [match, isOpen]);

  if (!isOpen || !match) return null;

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

  const parsedHomeScore = parseNum(homeScore);
  const parsedAwayScore = parseNum(awayScore);

  const showHomeFirstGoalField = parsedHomeScore !== null && parsedHomeScore !== 0;
  const showAwayFirstGoalField = parsedAwayScore !== null && parsedAwayScore !== 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const statsObj: MatchStats = {
      halftimeHomeScore: parseNum(htHome),
      halftimeAwayScore: parseNum(htAway),
      goalMinutesHome: goalMinutesHome.trim() || undefined,
      goalMinutesAway: goalMinutesAway.trim() || undefined,
      firstGoalMinuteHome: parseNum(firstGoalMinHome),
      firstGoalMinuteAway: parseNum(firstGoalMinAway),
      firstGoalMinuteMatch: parseNum(firstGoalMinMatch),

      cornersHomeFT: parseNum(cornersHomeFT),
      cornersAwayFT: parseNum(cornersAwayFT),
      cornersHomeHT: parseNum(cornersHomeHT),
      cornersAwayHT: parseNum(cornersAwayHT),

      possessionHomeFT: parseNum(possHomeFT),
      possessionAwayFT: parseNum(possAwayFT),
      possessionHomeHT: parseNum(possHomeHT),
      possessionAwayHT: parseNum(possAwayHT),

      yellowCardsHomeFT: parseNum(yellowHomeFT),
      yellowCardsAwayFT: parseNum(yellowAwayFT),
      yellowCardsHomeHT: parseNum(yellowHomeHT),
      yellowCardsAwayHT: parseNum(yellowAwayHT),

      redCardsHomeFT: parseNum(redHomeFT),
      redCardsAwayFT: parseNum(redAwayFT),
      redCardsHomeHT: parseNum(redHomeHT),
      redCardsAwayHT: parseNum(redAwayHT),

      shotsOnTargetHomeFT: parseNum(shotsTargetHomeFT),
      shotsOnTargetAwayFT: parseNum(shotsTargetAwayFT),
      shotsOnTargetHomeHT: parseNum(shotsTargetHomeHT),
      shotsOnTargetAwayHT: parseNum(shotsTargetAwayHT),

      shotsHomeFT: parseNum(shotsHomeFT),
      shotsAwayFT: parseNum(shotsAwayFT),
      shotsHomeHT: parseNum(shotsHomeHT),
      shotsAwayHT: parseNum(shotsAwayHT),

      // Legacy fallback fields
      cornersHome: parseNum(cornersHomeFT),
      cornersAway: parseNum(cornersAwayFT),
      possessionHome: parseNum(possHomeFT),
      possessionAway: parseNum(possAwayFT),
      yellowCardsHome: parseNum(yellowHomeFT),
      yellowCardsAway: parseNum(yellowAwayFT),
      redCardsHome: parseNum(redHomeFT),
      redCardsAway: parseNum(redAwayFT),
      shotsOnTargetHome: parseNum(shotsTargetHomeFT),
      shotsOnTargetAway: parseNum(shotsTargetAwayFT),
      shotsHome: parseNum(shotsHomeFT),
      shotsAway: parseNum(shotsAwayFT),
      scorersHome: goalMinutesHome.trim() || undefined,
      scorersAway: goalMinutesAway.trim() || undefined,
    };

    onSaveStats(match.id, parsedHomeScore, parsedAwayScore, status, statsObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0f1325] border border-[#2C3EC4]/30 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0b0e1b] border-b border-[#2C3EC4]/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2C3EC4]/20 text-[#2C3EC4] rounded-lg border border-[#2C3EC4]/30">
              <BarChart2 className="w-5 h-5 text-[#2C3EC4]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Estatísticas do Pós-Jogo
              </h2>
              <p className="text-xs text-gray-300">
                {match.homeTeamName} x {match.awayTeamName} • ID: <span className="text-[#2C3EC4] font-mono font-bold">{match.id}</span>
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
          <div className="bg-[#0b0e1b] p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2C3EC4] uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                1. Placar Final (FT) & Placar do 1º Tempo (HT)
              </span>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MatchStatus)}
                className="bg-[#12162a] border border-white/10 text-xs text-white rounded-lg px-2.5 py-1 focus:border-[#2C3EC4] font-semibold"
              >
                <option value="FINALIZADO">Finalizado</option>
                <option value="AGENDADO">Agendado</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="ADIADO">Adiado</option>
              </select>
            </div>

            {/* Scoreboard Input */}
            <div className="grid grid-cols-7 items-center gap-2 py-3 bg-[#12162a] rounded-xl border border-white/10 text-center">
              <div className="col-span-3 px-2">
                <span className="text-xs font-bold text-white block truncate mb-1.5">
                  Mandante FT ({match.homeTeamName})
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={homeScore}
                  onChange={(e) => handleScoreChange('home', e.target.value)}
                  className="w-16 h-12 text-center text-2xl font-black bg-[#0b0e1b] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#2C3EC4] font-mono mx-auto block shadow-inner"
                />
              </div>

              <div className="col-span-1 text-gray-400 font-black text-xl">
                VS
              </div>

              <div className="col-span-3 px-2">
                <span className="text-xs font-bold text-white block truncate mb-1.5">
                  Visitante FT ({match.awayTeamName})
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={awayScore}
                  onChange={(e) => handleScoreChange('away', e.target.value)}
                  className="w-16 h-12 text-center text-2xl font-black bg-[#0b0e1b] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#2C3EC4] font-mono mx-auto block shadow-inner"
                />
              </div>
            </div>

            {/* Halftime score */}
            <div className="flex items-center justify-between bg-[#12162a] p-3 rounded-xl border border-white/10 text-xs">
              <span className="text-gray-300 font-medium">Placar do 1º Tempo (HT - Intervalo):</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-gray-300">Mandante HT:</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={htHome}
                  onChange={(e) => setHtHome(e.target.value)}
                  className="w-12 h-8 text-center bg-[#0b0e1b] border border-white/10 rounded text-white text-xs font-bold"
                />
                <span className="text-gray-500 font-bold">-</span>
                <span className="text-gray-300">Visitante HT:</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={htAway}
                  onChange={(e) => setHtAway(e.target.value)}
                  className="w-12 h-8 text-center bg-[#0b0e1b] border border-white/10 rounded text-white text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Minutos dos Gols e Momentos dos Primeiros Gols */}
          <div className="bg-[#0b0e1b] p-4 rounded-xl border border-white/10 space-y-3">
            <span className="text-xs font-bold text-[#2C3EC4] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2C3EC4]" />
              2. Minutos dos Gols & Momentos dos Primeiros Gols
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">
                  Minutos dos Gols do Mandante
                </label>
                <input
                  type="text"
                  placeholder="Ex: 14', 38', 85'"
                  value={goalMinutesHome}
                  onChange={(e) => setGoalMinutesHome(e.target.value)}
                  className="w-full bg-[#12162a] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-[#2C3EC4] placeholder-gray-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">
                  Minutos dos Gols do Visitante
                </label>
                <input
                  type="text"
                  placeholder="Ex: 52', 90+2'"
                  value={goalMinutesAway}
                  onChange={(e) => setGoalMinutesAway(e.target.value)}
                  className="w-full bg-[#12162a] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-[#2C3EC4] placeholder-gray-400 font-mono"
                />
              </div>
            </div>

            {/* Momentos Específicos dos Gols */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Momento do 1º Gol do Jogo */}
              <div className="bg-[#12162a] p-2.5 rounded-xl border border-white/10">
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  ⚡ Momento do 1º Gol do Jogo
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Minuto (ex: 18)"
                    value={firstGoalMinMatch}
                    onChange={(e) => setFirstGoalMinMatch(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                  />
                  <span className="text-xs text-gray-400 font-bold">'</span>
                </div>
              </div>

              {/* Momento do 1º Gol Mandante (Aparece apenas se Gol Mandante FT != 0) */}
              {showHomeFirstGoalField && (
                <div className="bg-[#12162a] p-2.5 rounded-xl border border-[#2C3EC4]/30 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-bold text-[#2C3EC4] mb-1">
                    ⚽ 1º Gol Mandante ({match.homeTeamName})
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="Minuto (ex: 23)"
                      value={firstGoalMinHome}
                      onChange={(e) => setFirstGoalMinHome(e.target.value)}
                      className="w-full bg-[#0b0e1b] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                    <span className="text-xs text-gray-400 font-bold">'</span>
                  </div>
                </div>
              )}

              {/* Momento do 1º Gol Visitante (Aparece apenas se Gol Visitante FT != 0) */}
              {showAwayFirstGoalField && (
                <div className="bg-[#12162a] p-2.5 rounded-xl border border-[#2C3EC4]/30 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-bold text-[#2C3EC4] mb-1">
                    ⚽ 1º Gol Visitante ({match.awayTeamName})
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="Minuto (ex: 67)"
                      value={firstGoalMinAway}
                      onChange={(e) => setFirstGoalMinAway(e.target.value)}
                      className="w-full bg-[#0b0e1b] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                    <span className="text-xs text-gray-400 font-bold">'</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Estatísticas de Jogo (Mandante x Visitante em FT e HT) */}
          <div className="bg-[#0b0e1b] p-4 rounded-xl border border-white/10 space-y-4">
            <span className="text-xs font-bold text-[#2C3EC4] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#2C3EC4]" />
              3. Estatísticas Detalhadas (FT: Tempo Total | HT: 1º Tempo)
            </span>

            <div className="space-y-3 text-xs">
              {/* Header Label Row */}
              <div className="grid grid-cols-5 text-center text-[11px] font-bold text-gray-300 pb-1 border-b border-white/10">
                <span className="text-left col-span-2">MÉTRICA DA PARTIDA</span>
                <span className="text-[#2C3EC4]">TEMPO TOTAL (FT)</span>
                <span className="text-blue-300">1º TEMPO (HT)</span>
              </div>

              {/* Row 1: Cantos (Escanteios) */}
              <div className="bg-[#12162a] p-3 rounded-xl border border-white/10 space-y-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-[#2C3EC4]" />
                  Escanteios / Cantos (Mandante vs Visitante)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-gray-300 mb-1 font-semibold">FT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={cornersHomeFT}
                        onChange={(e) => setCornersHomeFT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-white"
                      />
                      <span className="text-gray-500 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={cornersAwayFT}
                        onChange={(e) => setCornersAwayFT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-gray-300 mb-1 font-semibold">HT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={cornersHomeHT}
                        onChange={(e) => setCornersHomeHT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-blue-300"
                      />
                      <span className="text-gray-500 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={cornersAwayHT}
                        onChange={(e) => setCornersAwayHT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-blue-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Posse de Bola */}
              <div className="bg-[#12162a] p-3 rounded-xl border border-white/10 space-y-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#2C3EC4]" />
                  Posse de Bola % (Mandante vs Visitante)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-gray-300 mb-1 font-semibold">FT (% Mandante x % Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50%"
                        value={possHomeFT}
                        onChange={(e) => setPossHomeFT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-white"
                      />
                      <span className="text-gray-500 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50%"
                        value={possAwayFT}
                        onChange={(e) => setPossAwayFT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-gray-300 mb-1 font-semibold">HT (% Mandante x % Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50%"
                        value={possHomeHT}
                        onChange={(e) => setPossHomeHT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-blue-300"
                      />
                      <span className="text-gray-500 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50%"
                        value={possAwayHT}
                        onChange={(e) => setPossAwayHT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-blue-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Cartões Amarelos */}
              <div className="bg-[#12162a] p-3 rounded-xl border border-white/10 space-y-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  🟨 Cartões Amarelos (Mandante vs Visitante)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-gray-300 mb-1 font-semibold">FT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={yellowHomeFT}
                        onChange={(e) => setYellowHomeFT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-amber-500/20 rounded-lg p-1.5 text-center font-mono font-bold text-amber-400"
                      />
                      <span className="text-gray-500 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={yellowAwayFT}
                        onChange={(e) => setYellowAwayFT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-amber-500/20 rounded-lg p-1.5 text-center font-mono font-bold text-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-gray-300 mb-1 font-semibold">HT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={yellowHomeHT}
                        onChange={(e) => setYellowHomeHT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-amber-500/20 rounded-lg p-1.5 text-center font-mono font-bold text-amber-300"
                      />
                      <span className="text-gray-500 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={yellowAwayHT}
                        onChange={(e) => setYellowAwayHT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-amber-500/20 rounded-lg p-1.5 text-center font-mono font-bold text-amber-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Cartões Vermelhos */}
              <div className="bg-[#12162a] p-3 rounded-xl border border-white/10 space-y-2">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  🟥 Cartões Vermelhos (Mandante vs Visitante)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-gray-300 mb-1 font-semibold">FT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={redHomeFT}
                        onChange={(e) => setRedHomeFT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-red-500/20 rounded-lg p-1.5 text-center font-mono font-bold text-red-400"
                      />
                      <span className="text-gray-500 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={redAwayFT}
                        onChange={(e) => setRedAwayFT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-red-500/20 rounded-lg p-1.5 text-center font-mono font-bold text-red-400"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-gray-300 mb-1 font-semibold">HT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={redHomeHT}
                        onChange={(e) => setRedHomeHT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-red-500/20 rounded-lg p-1.5 text-center font-mono font-bold text-red-300"
                      />
                      <span className="text-gray-500 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={redAwayHT}
                        onChange={(e) => setRedAwayHT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-red-500/20 rounded-lg p-1.5 text-center font-mono font-bold text-red-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 5: Chutes ao Gol (On Target) */}
              <div className="bg-[#12162a] p-3 rounded-xl border border-white/10 space-y-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#2C3EC4]" />
                  Chutes no Gol / No Alvo (Mandante vs Visitante)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-gray-300 mb-1 font-semibold">FT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsTargetHomeFT}
                        onChange={(e) => setShotsTargetHomeFT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-white"
                      />
                      <span className="text-gray-500 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsTargetAwayFT}
                        onChange={(e) => setShotsTargetAwayFT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-gray-300 mb-1 font-semibold">HT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsTargetHomeHT}
                        onChange={(e) => setShotsTargetHomeHT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-blue-300"
                      />
                      <span className="text-gray-500 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsTargetAwayHT}
                        onChange={(e) => setShotsTargetAwayHT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-blue-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 6: Finalizações (Chutes Totais) */}
              <div className="bg-[#12162a] p-3 rounded-xl border border-white/10 space-y-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-[#2C3EC4]" />
                  Finalizações / Chutes Totais (Mandante vs Visitante)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-gray-300 mb-1 font-semibold">FT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsHomeFT}
                        onChange={(e) => setShotsHomeFT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-white"
                      />
                      <span className="text-gray-500 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsAwayFT}
                        onChange={(e) => setShotsAwayFT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-gray-300 mb-1 font-semibold">HT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsHomeHT}
                        onChange={(e) => setShotsHomeHT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-blue-300"
                      />
                      <span className="text-gray-500 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsAwayHT}
                        onChange={(e) => setShotsAwayHT(e.target.value)}
                        className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg p-1.5 text-center font-mono font-bold text-blue-300"
                      />
                    </div>
                  </div>
                </div>
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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2C3EC4] hover:bg-[#2231A8] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#2C3EC4]/30 transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10"
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

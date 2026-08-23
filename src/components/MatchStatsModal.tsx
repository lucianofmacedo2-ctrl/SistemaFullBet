import React, { useState, useEffect } from 'react';
import {
  X,
  BarChart2,
  Check,
  Trophy,
  Shield,
  Activity,
  Target,
  Flag,
  Disc,
  Clock,
  Zap,
  TrendingUp,
  Sparkles,
  ClipboardPaste,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Match, MatchStats, MatchStatus, MatchPressureData } from '../types';
import { parsePressureCsvText } from '../utils/pressureParser';

interface MatchStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  isMaster?: boolean;
  onSaveStats: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    status: MatchStatus,
    stats: MatchStats,
    pressureData?: MatchPressureData | null
  ) => void;
  onOpenPressureChartModal?: (matchId: string) => void;
}

export const MatchStatsModal: React.FC<MatchStatsModalProps> = ({
  isOpen,
  onClose,
  match,
  isMaster = true,
  onSaveStats,
  onOpenPressureChartModal,
}) => {
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [status, setStatus] = useState<MatchStatus>('FINALIZADO');

  // Gols HT (Único mercado HT mantido)
  const [htHome, setHtHome] = useState<string>('');
  const [htAway, setHtAway] = useState<string>('');

  // Estatísticas FT (Tempo Total)
  const [xgHomeFT, setXgHomeFT] = useState<string>('');
  const [xgAwayFT, setXgAwayFT] = useState<string>('');

  const [shotsHomeFT, setShotsHomeFT] = useState<string>('');
  const [shotsAwayFT, setShotsAwayFT] = useState<string>('');

  const [shotsTargetHomeFT, setShotsTargetHomeFT] = useState<string>('');
  const [shotsTargetAwayFT, setShotsTargetAwayFT] = useState<string>('');

  const [foulsHomeFT, setFoulsHomeFT] = useState<string>('');
  const [foulsAwayFT, setFoulsAwayFT] = useState<string>('');

  const [cornersHomeFT, setCornersHomeFT] = useState<string>('');
  const [cornersAwayFT, setCornersAwayFT] = useState<string>('');

  const [yellowHomeFT, setYellowHomeFT] = useState<string>('');
  const [yellowAwayFT, setYellowAwayFT] = useState<string>('');

  const [redHomeFT, setRedHomeFT] = useState<string>('');
  const [redAwayFT, setRedAwayFT] = useState<string>('');

  const [possHomeFT, setPossHomeFT] = useState<string>('');
  const [possAwayFT, setPossAwayFT] = useState<string>('');

  // Tabela de Pressão & Índice Líquido
  const [pressureCsvText, setPressureCsvText] = useState<string>('');
  const [parsedPressureData, setParsedPressureData] = useState<MatchPressureData | null>(null);
  const [pressureParseError, setPressureParseError] = useState<string | null>(null);
  const [pressureSuccessMsg, setPressureSuccessMsg] = useState<string | null>(null);
  const [isPressureSectionOpen, setIsPressureSectionOpen] = useState<boolean>(true);
  const [showPressureTable, setShowPressureTable] = useState<boolean>(true);

  useEffect(() => {
    if (match) {
      setHomeScore(match.homeScore !== null ? String(match.homeScore) : '');
      setAwayScore(match.awayScore !== null ? String(match.awayScore) : '');
      setStatus(match.status === 'AGENDADO' && (match.homeScore !== null || match.awayScore !== null) ? 'FINALIZADO' : match.status);

      const st = match.stats || {};
      setHtHome(st.halftimeHomeScore !== undefined && st.halftimeHomeScore !== null ? String(st.halftimeHomeScore) : '');
      setHtAway(st.halftimeAwayScore !== undefined && st.halftimeAwayScore !== null ? String(st.halftimeAwayScore) : '');

      setXgHomeFT(st.xgHomeFT != null ? String(st.xgHomeFT) : '');
      setXgAwayFT(st.xgAwayFT != null ? String(st.xgAwayFT) : '');

      setShotsHomeFT(st.shotsHomeFT != null ? String(st.shotsHomeFT) : '');
      setShotsAwayFT(st.shotsAwayFT != null ? String(st.shotsAwayFT) : '');

      setShotsTargetHomeFT(st.shotsOnTargetHomeFT != null ? String(st.shotsOnTargetHomeFT) : '');
      setShotsTargetAwayFT(st.shotsOnTargetAwayFT != null ? String(st.shotsOnTargetAwayFT) : '');

      setFoulsHomeFT(st.foulsHomeFT != null ? String(st.foulsHomeFT) : '');
      setFoulsAwayFT(st.foulsAwayFT != null ? String(st.foulsAwayFT) : '');

      setCornersHomeFT(st.cornersHomeFT != null ? String(st.cornersHomeFT) : '');
      setCornersAwayFT(st.cornersAwayFT != null ? String(st.cornersAwayFT) : '');

      setYellowHomeFT(st.yellowCardsHomeFT != null ? String(st.yellowCardsHomeFT) : '');
      setYellowAwayFT(st.yellowCardsAwayFT != null ? String(st.yellowCardsAwayFT) : '');

      setRedHomeFT(st.redCardsHomeFT != null ? String(st.redCardsHomeFT) : '');
      setRedAwayFT(st.redCardsAwayFT != null ? String(st.redCardsAwayFT) : '');

      setPossHomeFT(st.possessionHomeFT != null ? String(st.possessionHomeFT) : '');
      setPossAwayFT(st.possessionAwayFT != null ? String(st.possessionAwayFT) : '');

      if (match.pressureData) {
        setParsedPressureData(match.pressureData);
        setPressureCsvText(match.pressureData.rawCsvText || '');
      } else {
        setParsedPressureData(null);
        setPressureCsvText('');
      }
      setPressureParseError(null);
      setPressureSuccessMsg(null);
    }
  }, [match, isOpen]);

  if (!isOpen || !match) return null;

  const handleParsePressureCsv = () => {
    setPressureParseError(null);
    setPressureSuccessMsg(null);

    if (!pressureCsvText.trim()) {
      setPressureParseError('Cole os dados da planilha de pressão no campo acima.');
      return;
    }

    try {
      const parsed = parsePressureCsvText(pressureCsvText);
      if (!parsed || parsed.intervals.length === 0) {
        setPressureParseError('Não foi possível extrair os intervalos de pressão. Verifique a formatação do texto colado.');
        return;
      }

      setParsedPressureData(parsed);
      setPressureSuccessMsg(`✅ Sucesso: ${parsed.intervals.length} intervalos de pressão importados com precisão!`);

      if (parsed.goalsSummary) {
        if (parsed.goalsSummary.homeFT !== undefined && homeScore === '') {
          setHomeScore(String(parsed.goalsSummary.homeFT));
        }
        if (parsed.goalsSummary.awayFT !== undefined && awayScore === '') {
          setAwayScore(String(parsed.goalsSummary.awayFT));
        }
        if (parsed.goalsSummary.homeHT !== undefined && htHome === '') {
          setHtHome(String(parsed.goalsSummary.homeHT));
        }
        if (parsed.goalsSummary.awayHT !== undefined && htAway === '') {
          setHtAway(String(parsed.goalsSummary.awayHT));
        }
      }

      if (parsed.cornersSummary) {
        if (cornersHomeFT === '') setCornersHomeFT(String(parsed.cornersSummary.homeFT));
        if (cornersAwayFT === '') setCornersAwayFT(String(parsed.cornersSummary.awayFT));
      }

      if (parsed.cardsSummary) {
        if (yellowHomeFT === '') setYellowHomeFT(String(parsed.cardsSummary.yellowHomeFT));
        if (yellowAwayFT === '') setYellowAwayFT(String(parsed.cardsSummary.yellowAwayFT));
        if (redHomeFT === '') setRedHomeFT(String(parsed.cardsSummary.redHomeFT));
        if (redAwayFT === '') setRedAwayFT(String(parsed.cardsSummary.redAwayFT));
      }
    } catch (err: any) {
      setPressureParseError(`Erro ao processar: ${err?.message || 'Formato inválido'}`);
    }
  };

  const handleClearPressureData = () => {
    setParsedPressureData(null);
    setPressureCsvText('');
    setPressureParseError(null);
    setPressureSuccessMsg(null);
  };

  const parseNumOrNull = (val: string): number | null => {
    if (val === '' || val === null || val === undefined) return null;
    const n = parseFloat(val.replace(',', '.'));
    return isNaN(n) ? null : n;
  };

  const parseIntOrNull = (val: string): number | null => {
    if (val === '' || val === null || val === undefined) return null;
    const n = parseInt(val, 10);
    return isNaN(n) ? null : n;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalHomeScore = parseIntOrNull(homeScore);
    const finalAwayScore = parseIntOrNull(awayScore);

    const statsToSave: MatchStats = {
      // Placar HT
      halftimeHomeScore: parseIntOrNull(htHome),
      halftimeAwayScore: parseIntOrNull(htAway),

      // Métricas FT
      xgHomeFT: parseNumOrNull(xgHomeFT),
      xgAwayFT: parseNumOrNull(xgAwayFT),
      shotsHomeFT: parseIntOrNull(shotsHomeFT),
      shotsAwayFT: parseIntOrNull(shotsAwayFT),
      shotsOnTargetHomeFT: parseIntOrNull(shotsTargetHomeFT),
      shotsOnTargetAwayFT: parseIntOrNull(shotsTargetAwayFT),
      foulsHomeFT: parseIntOrNull(foulsHomeFT),
      foulsAwayFT: parseIntOrNull(foulsAwayFT),
      cornersHomeFT: parseIntOrNull(cornersHomeFT),
      cornersAwayFT: parseIntOrNull(cornersAwayFT),
      yellowCardsHomeFT: parseIntOrNull(yellowHomeFT),
      yellowCardsAwayFT: parseIntOrNull(yellowAwayFT),
      redCardsHomeFT: parseIntOrNull(redHomeFT),
      redCardsAwayFT: parseIntOrNull(redAwayFT),

      // Posse FT opcional
      possessionHomeFT: parseIntOrNull(possHomeFT),
      possessionAwayFT: parseIntOrNull(possAwayFT),

      // Estádio, Público e Capacidade
      stadium: match.stadium || match.stats?.stadium || '',
      stadiumCapacity: match.stadiumCapacity ?? match.stats?.stadiumCapacity ?? null,
      attendance: match.attendance ?? match.stats?.attendance ?? null,
    };

    onSaveStats(
      match.id,
      finalHomeScore,
      finalAwayScore,
      status,
      statsToSave,
      parsedPressureData
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-linear-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                  {match.id}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {match.leagueName} • {match.countryName}
                </span>
                {!isMaster && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                    Modo Consulta (Somente Leitura)
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {match.homeTeamName} vs {match.awayTeamName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(92vh-100px)]">
          <fieldset disabled={!isMaster} className="space-y-4">
          {/* Card 1: Placar Final FT & Placar do Intervalo HT */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> 1. Placar FT & Placar HT (Intervalo)
              </span>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-700 font-medium">Status:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MatchStatus)}
                  className="bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2 py-1 focus:border-blue-500 font-semibold shadow-xs"
                >
                  <option value="FINALIZADO">Finalizado</option>
                  <option value="AGENDADO">Agendado</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="ADIADO">Adiado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Placar FT */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Placar Final (Tempo Total - FT)
                </span>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 block truncate max-w-[90px]">{match.homeTeamName}</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="w-14 h-11 text-center text-lg font-black bg-blue-50/50 border border-blue-200 rounded-xl text-blue-950 focus:border-blue-500 font-mono shadow-inner"
                    />
                  </div>
                  <span className="text-lg font-bold text-slate-400 mt-3">X</span>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 block truncate max-w-[90px]">{match.awayTeamName}</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="w-14 h-11 text-center text-lg font-black bg-blue-50/50 border border-blue-200 rounded-xl text-blue-950 focus:border-blue-500 font-mono shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Placar HT */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Placar do Intervalo (1º Tempo - HT)
                </span>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 block truncate max-w-[90px]">{match.homeTeamName}</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={htHome}
                      onChange={(e) => setHtHome(e.target.value)}
                      className="w-14 h-11 text-center text-lg font-black bg-blue-50/50 border border-blue-200 rounded-xl text-blue-950 focus:border-blue-500 font-mono shadow-inner"
                    />
                  </div>
                  <span className="text-lg font-bold text-slate-400 mt-3">X</span>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 block truncate max-w-[90px]">{match.awayTeamName}</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={htAway}
                      onChange={(e) => setHtAway(e.target.value)}
                      className="w-14 h-11 text-center text-lg font-black bg-blue-50/50 border border-blue-200 rounded-xl text-blue-950 focus:border-blue-500 font-mono shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Estatísticas Detalhadas FT */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> 2. Estatísticas do Jogo (Tempo Total - FT)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* xG FT */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  🎯 xG (Gols Esperados) FT
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Mandante</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 1.45"
                      value={xgHomeFT}
                      onChange={(e) => setXgHomeFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Visitante</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 0.82"
                      value={xgAwayFT}
                      onChange={(e) => setXgAwayFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Finalizações FT */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  ⚽ Finalizações FT
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Mandante</label>
                    <input
                      type="number"
                      placeholder="ex: 14"
                      value={shotsHomeFT}
                      onChange={(e) => setShotsHomeFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Visitante</label>
                    <input
                      type="number"
                      placeholder="ex: 8"
                      value={shotsAwayFT}
                      onChange={(e) => setShotsAwayFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Chutes no Alvo FT */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  🎯 Chutes a Gol FT
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Mandante</label>
                    <input
                      type="number"
                      placeholder="ex: 6"
                      value={shotsTargetHomeFT}
                      onChange={(e) => setShotsTargetHomeFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Visitante</label>
                    <input
                      type="number"
                      placeholder="ex: 3"
                      value={shotsTargetAwayFT}
                      onChange={(e) => setShotsTargetAwayFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Faltas FT */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  🛑 Faltas Cometidas FT
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Mandante</label>
                    <input
                      type="number"
                      placeholder="ex: 11"
                      value={foulsHomeFT}
                      onChange={(e) => setFoulsHomeFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Visitante</label>
                    <input
                      type="number"
                      placeholder="ex: 13"
                      value={foulsAwayFT}
                      onChange={(e) => setFoulsAwayFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Escanteios FT */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  🚩 Escanteios FT
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Mandante</label>
                    <input
                      type="number"
                      placeholder="ex: 7"
                      value={cornersHomeFT}
                      onChange={(e) => setCornersHomeFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Visitante</label>
                    <input
                      type="number"
                      placeholder="ex: 4"
                      value={cornersAwayFT}
                      onChange={(e) => setCornersAwayFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Cartões Amarelos FT */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  🟨 Cartões Amarelos FT
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Mandante</label>
                    <input
                      type="number"
                      placeholder="ex: 2"
                      value={yellowHomeFT}
                      onChange={(e) => setYellowHomeFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Visitante</label>
                    <input
                      type="number"
                      placeholder="ex: 3"
                      value={yellowAwayFT}
                      onChange={(e) => setYellowAwayFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Cartões Vermelhos FT */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  🟥 Cartões Vermelhos FT
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Mandante</label>
                    <input
                      type="number"
                      placeholder="ex: 0"
                      value={redHomeFT}
                      onChange={(e) => setRedHomeFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Visitante</label>
                    <input
                      type="number"
                      placeholder="ex: 0"
                      value={redAwayFT}
                      onChange={(e) => setRedAwayFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Posse de Bola FT */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  📊 Posse de Bola FT (%)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Mandante (%)</label>
                    <input
                      type="number"
                      placeholder="ex: 55"
                      value={possHomeFT}
                      onChange={(e) => setPossHomeFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block truncate">Visitante (%)</label>
                    <input
                      type="number"
                      placeholder="ex: 45"
                      value={possAwayFT}
                      onChange={(e) => setPossAwayFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Gráfico / Tabela de Pressão & Ataques Perigosos */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setIsPressureSectionOpen(!isPressureSectionOpen)}
            >
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> 3. Gráfico / Tabela de Pressão Tática (5 em 5 min)
              </span>
              <button
                type="button"
                className="text-xs text-slate-500 flex items-center gap-1 font-semibold"
              >
                {isPressureSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isPressureSectionOpen && (
              <div className="space-y-3 pt-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      📋 Colar Dados de Pressão da Planilha
                    </label>
                    {parsedPressureData && (
                      <button
                        type="button"
                        onClick={handleClearPressureData}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Limpar Dados
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={4}
                    value={pressureCsvText}
                    onChange={(e) => setPressureCsvText(e.target.value)}
                    placeholder="Cole aqui o texto da tabela de pressão copiado do Excel/CSV..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleParsePressureCsv}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Processar Texto de Pressão
                    </button>

                    {parsedPressureData && onOpenPressureChartModal && (
                      <button
                        type="button"
                        onClick={() => onOpenPressureChartModal(match.id)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Abrir no Visualizador
                      </button>
                    )}
                  </div>

                  {pressureParseError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {pressureParseError}
                    </div>
                  )}

                  {pressureSuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> {pressureSuccessMsg}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          </fieldset>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {isMaster ? 'Cancelar' : 'Fechar'}
            </button>
            {isMaster && (
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all border border-blue-500 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Salvar Estatísticas
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

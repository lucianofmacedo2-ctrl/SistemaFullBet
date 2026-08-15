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
  onSaveStats,
  onOpenPressureChartModal,
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

  // Tabela de Pressão & Índice Líquido (5 em 5 minutos)
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

      // Load existing pressure data if present
      if (match.pressureData) {
        setParsedPressureData(match.pressureData);
        setPressureCsvText(match.pressureData.rawCsvText || '');
        setPressureParseError(null);
        setPressureSuccessMsg(null);
      } else {
        setParsedPressureData(null);
        setPressureCsvText('');
        setPressureParseError(null);
        setPressureSuccessMsg(null);
      }
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

  const handleParsePressureText = () => {
    setPressureParseError(null);
    setPressureSuccessMsg(null);

    if (!pressureCsvText.trim()) {
      setPressureParseError('Por favor, cole os dados no campo de texto antes de processar.');
      return;
    }

    try {
      const parsed = parsePressureCsvText(pressureCsvText, match.homeTeamName, match.awayTeamName);
      setParsedPressureData(parsed);

      const itemsUpdated: string[] = [];

      // 1. Escanteios (Corners)
      if (parsed.cornersSummary && parsed.cornersSummary.total > 0) {
        setCornersHomeFT(String(parsed.cornersSummary.homeFT));
        setCornersAwayFT(String(parsed.cornersSummary.awayFT));
        setCornersHomeHT(String(parsed.cornersSummary.homeHT));
        setCornersAwayHT(String(parsed.cornersSummary.awayHT));
        itemsUpdated.push(`🚩 Escanteios: ${parsed.cornersSummary.homeFT}x${parsed.cornersSummary.awayFT} (HT: ${parsed.cornersSummary.homeHT}x${parsed.cornersSummary.awayHT})`);
      }

      // 2. Cartões (Cards)
      if (parsed.cardsSummary && parsed.cardsSummary.total > 0) {
        setYellowHomeFT(String(parsed.cardsSummary.yellowHomeFT));
        setYellowAwayFT(String(parsed.cardsSummary.yellowAwayFT));
        setYellowHomeHT(String(parsed.cardsSummary.yellowHomeHT));
        setYellowAwayHT(String(parsed.cardsSummary.yellowAwayHT));
        setRedHomeFT(String(parsed.cardsSummary.redHomeFT));
        setRedAwayFT(String(parsed.cardsSummary.redAwayFT));
        itemsUpdated.push(`🟨🟥 Cartões: ${parsed.cardsSummary.yellowHomeFT + parsed.cardsSummary.redHomeFT}x${parsed.cardsSummary.yellowAwayFT + parsed.cardsSummary.redAwayFT}`);
      }

      // 3. Gols, Placar e Minutos dos Primeiros Gols
      if (parsed.goalsSummary) {
        const gs = parsed.goalsSummary;
        setHomeScore(String(gs.homeFT));
        setAwayScore(String(gs.awayFT));
        setHtHome(String(gs.homeHT));
        setHtAway(String(gs.awayHT));

        setGoalMinutesHome(gs.goalMinutesHome.join(', '));
        setGoalMinutesAway(gs.goalMinutesAway.join(', '));

        setFirstGoalMinHome(gs.firstGoalMinHome !== null ? String(gs.firstGoalMinHome) : '');
        setFirstGoalMinAway(gs.firstGoalMinAway !== null ? String(gs.firstGoalMinAway) : '');
        setFirstGoalMinMatch(gs.firstGoalMinMatch !== null ? String(gs.firstGoalMinMatch) : '');

        if (status === 'AGENDADO') {
          setStatus('FINALIZADO');
        }

        itemsUpdated.push(`⚽ Placar: ${gs.homeFT}x${gs.awayFT} (HT: ${gs.homeHT}x${gs.awayHT})`);
        if (gs.firstGoalMinMatch) {
          itemsUpdated.push(`⏱️ 1º Gol: ${gs.firstGoalMinMatch}'`);
        }
      }

      let msg = `✅ ${parsed.intervals.length} intervalos processados! Domínio: ${match.homeTeamName} (${parsed.homeDominancePct}%) x ${match.awayTeamName} (${parsed.awayDominancePct}%).`;
      if (itemsUpdated.length > 0) {
        msg += ` Preenchimento automático: ${itemsUpdated.join(' | ')}.`;
      }

      setPressureSuccessMsg(msg);
    } catch (err: any) {
      setPressureParseError(err.message || 'Erro ao processar o texto da pressão. Verifique o formato das colunas.');
    }
  };

  const handleLoadExampleData = () => {
    const homeCode = match.homeTeamName.substring(0, 3).toUpperCase();
    const awayCode = match.awayTeamName.substring(0, 3).toUpperCase();

    const sample = `Intervalo,Pressão ${homeCode} (0-100),Pressão ${awayCode} (0-100),Índice Líquido,Dominância,Escanteios & Cartões,Gols & Destaques
01' - 05',25,10,+15,${homeCode},-,Estudo de jogo inicial
06' - 10',15,15,0,Equilibrado,🚩 Escanteio ${homeCode} (~10'),Início equilibrado
11' - 15',65,5,+60,${homeCode},🚩 Escanteio ${homeCode} (~14'),${homeCode} assume o controle do meio
16' - 20',80,0,+80,${homeCode},🚩 Escanteio ${homeCode} (~17'),Maior volume ofensivo do ${homeCode} no 1º tempo
21' - 25',30,20,+10,${homeCode},-,⚽ Gol Anulado / Variável ${homeCode} (~22')
26' - 30',0,80,-80,${awayCode},🟨 Cartão Amarelo ${awayCode} (~29'),⚽ GOL do ${awayCode} (~27')
31' - 35',10,50,-40,${awayCode},-,${awayCode} controla após o primeiro gol
36' - 40',75,25,+50,${homeCode},🚩 Escanteio ${homeCode} (~36'),⚽ GOL do ${homeCode} (~38')
41' - 45',55,20,+35,${homeCode},-,${homeCode} em busca do segundo gol
45'+ (HT),10,70,-60,${awayCode},🟨 Cartão Amarelo ${awayCode} (~45'+),⚽ GOL do ${awayCode} (~47') nos acréscimos
46' - 50',0,65,-65,${awayCode},🟨 Cartão Amarelo ${awayCode} (~51'),${awayCode} volta superior
51' - 55',0,40,-40,${awayCode},-,Controle de jogo do ${awayCode}
56' - 60',20,55,-35,${awayCode},🟨 Cartão Amarelo ${awayCode} (~61'),⚽ GOL do ${awayCode} (~56')
61' - 65',80,10,+70,${homeCode},🚩 Escanteio ${awayCode} (~65'),${homeCode} pressiona forte em resposta ao gol
66' - 70',35,10,+25,${homeCode},-,${homeCode} mantém posse ofensiva
71' - 75',10,85,-75,${awayCode},🚩 Escanteio ${awayCode} (~73')🟨 Cartão Amarelo ${awayCode} (~76'),⚽ GOL do ${awayCode} (~74') no contra-ataque
76' - 80',70,15,+55,${homeCode},🚩 Escanteio ${awayCode} (~81'),${homeCode} se lança ao ataque
81' - 85',35,5,+30,${homeCode},-,Pressão do ${homeCode} na reta final
86' - 90'+,100,10,+90,${homeCode},🟨 Cartão Amarelo ${homeCode} (~86')🚩 Escanteio ${homeCode} (~90'+),Pressão total do ${homeCode} no abafa final`;

    setPressureCsvText(sample);
    try {
      const parsed = parsePressureCsvText(sample, match.homeTeamName, match.awayTeamName);
      setParsedPressureData(parsed);
      setPressureParseError(null);
      setPressureSuccessMsg(`Exemplo com 7 colunas (Escanteios, Cartões e Gols) carregado com ${parsed.intervals.length} intervalos!`);
    } catch (e: any) {
      setPressureParseError(e.message);
    }
  };

  const handleClearPressureData = () => {
    setPressureCsvText('');
    setParsedPressureData(null);
    setPressureParseError(null);
    setPressureSuccessMsg(null);
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

    onSaveStats(match.id, parsedHomeScore, parsedAwayScore, status, statsObj, parsedPressureData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <BarChart2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Estatísticas do Pós-Jogo
              </h2>
              <p className="text-xs text-slate-500">
                {match.homeTeamName} x {match.awayTeamName} • ID: <span className="text-blue-600 font-mono font-bold">{match.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Section: Tabela de Pressão & Índice Líquido (Campo de Texto / CSV) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-xl border border-slate-700 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    📊 Lançar Tabela de Pressão & Índice Líquido (-100 a +100)
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Cole os dados formatados em texto ou tabela de 5 em 5 minutos para estudos táticos futuros.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {parsedPressureData && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {parsedPressureData.intervals?.length || 0} Intervalos Carregados
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsPressureSectionOpen(!isPressureSectionOpen)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  {isPressureSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isPressureSectionOpen && (
              <div className="space-y-3 pt-2 border-t border-slate-700/60">
                {/* Textarea for pasting data */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="font-semibold flex items-center gap-1">
                      <ClipboardPaste className="w-3.5 h-3.5 text-blue-400" />
                      Cole o texto da planilha (CSV ou Tabulado):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLoadExampleData}
                        className="text-[10px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                      >
                        Carregar Modelo Exemplo
                      </button>
                      {pressureCsvText && (
                        <button
                          type="button"
                          onClick={handleClearPressureData}
                          className="text-[10px] font-bold text-slate-400 hover:text-rose-300 underline cursor-pointer"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={6}
                    value={pressureCsvText}
                    onChange={(e) => setPressureCsvText(e.target.value)}
                    placeholder={`Intervalo,Pressão Mandante,Pressão Visitante,Índice Líquido,Time Dominante,Evento / Contexto Destacado\n01' - 05',25,10,+15,Mandante,Estudo de jogo\n06' - 10',15,15,0,Equilibrado,Jogo truncado\n11' - 15',65,5,+60,Mandante,Pressão Mandante...`}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder:text-slate-600 leading-relaxed resize-y"
                  />
                </div>

                {/* Feedback messages */}
                {pressureParseError && (
                  <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{pressureParseError}</span>
                  </div>
                )}
                {pressureSuccessMsg && (
                  <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{pressureSuccessMsg}</span>
                  </div>
                )}

                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleParsePressureText}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Processar Texto da Tabela</span>
                  </button>

                  {parsedPressureData && parsedPressureData.intervals && (
                    <button
                      type="button"
                      onClick={() => setShowPressureTable(!showPressureTable)}
                      className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
                    >
                      <span>{showPressureTable ? 'Ocultar Prévia da Tabela' : 'Ver Prévia da Tabela'}</span>
                      {showPressureTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Parsed Table Live Preview */}
                {parsedPressureData && parsedPressureData.intervals && showPressureTable && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                      <span>Prévia Estruturada: {parsedPressureData.intervals.length} Intervalos de 5 Minutos</span>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">{match.homeTeamName}: {parsedPressureData.homeDominancePct}%</span>
                        <span>•</span>
                        <span className="text-amber-400">{match.awayTeamName}: {parsedPressureData.awayDominancePct}%</span>
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/90">
                      <table className="w-full text-left text-[11px] border-collapse font-sans">
                        <thead className="bg-slate-900 text-slate-300 font-mono text-[10px] uppercase sticky top-0 border-b border-slate-800">
                          <tr>
                            <th className="p-2 font-bold">Intervalo</th>
                            <th className="p-2 text-center text-blue-400 font-bold">Mandante</th>
                            <th className="p-2 text-center text-amber-400 font-bold">Visitante</th>
                            <th className="p-2 text-center font-bold">Índice Líquido</th>
                            <th className="p-2 text-center font-bold">Dominância</th>
                            <th className="p-2 font-bold text-emerald-400">🚩 Escanteios & Cartões</th>
                            <th className="p-2 font-bold text-amber-300">⚽ Gols & Destaques</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-slate-200">
                          {parsedPressureData.intervals.map((it, idx) => {
                            const net = it.netIndex !== undefined ? it.netIndex : ((it.homePressure || 0) - (it.awayPressure || 0));
                            const cornersCardsText = it.cornersAndCards || (it.contextHighlight && /🚩|escanteio|🟨|amarelo|🟥|vermelho/i.test(it.contextHighlight) ? it.contextHighlight : '');
                            const goalsHighlightsText = it.goalsAndHighlights || (it.contextHighlight && !it.cornersAndCards ? it.contextHighlight : '');
                            const isGoal = goalsHighlightsText && /gol|goal|⚽/i.test(goalsHighlightsText) && !/anulado/i.test(goalsHighlightsText);

                            return (
                              <tr key={idx} className={isGoal ? 'bg-amber-500/10' : idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/40'}>
                                <td className="p-2 font-mono font-bold text-slate-300 whitespace-nowrap">{it.interval}</td>
                                <td className="p-2 text-center font-mono font-bold text-blue-300">{it.homePressure}</td>
                                <td className="p-2 text-center font-mono font-bold text-amber-300">{it.awayPressure}</td>
                                <td className="p-2 text-center font-mono font-bold">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                                      net > 0
                                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                                        : net < 0
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                        : 'bg-slate-700 text-slate-300'
                                    }`}
                                  >
                                    {net > 0 ? `+${net}` : net}
                                  </span>
                                </td>
                                <td className="p-2 text-center whitespace-nowrap">
                                  <span className="text-[10px] font-bold text-slate-300">
                                    {it.dominantTeam}
                                  </span>
                                </td>
                                <td className="p-2 text-emerald-300 text-[10px]">
                                  {cornersCardsText && cornersCardsText !== '-' ? (
                                    <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                                      {cornersCardsText}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">-</span>
                                  )}
                                </td>
                                <td className="p-2 text-slate-300 text-[10px]">
                                  {goalsHighlightsText && goalsHighlightsText !== '-' ? (
                                    <span className={isGoal ? 'text-amber-300 font-bold' : 'text-slate-300'}>
                                      {goalsHighlightsText}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Placar & Status Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                1. Placar Final (FT) & Placar do 1º Tempo (HT)
              </span>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MatchStatus)}
                className="bg-white border border-slate-200 text-xs text-slate-900 rounded-lg px-2.5 py-1 focus:border-blue-500 font-semibold"
              >
                <option value="FINALIZADO">Finalizado</option>
                <option value="AGENDADO">Agendado</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="ADIADO">Adiado</option>
              </select>
            </div>

            {/* Scoreboard Input */}
            <div className="grid grid-cols-7 items-center gap-2 py-3 bg-white rounded-xl border border-slate-200 text-center">
              <div className="col-span-3 px-2">
                <span className="text-xs font-bold text-slate-800 block truncate mb-1.5">
                  Mandante FT ({match.homeTeamName})
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={homeScore}
                  onChange={(e) => handleScoreChange('home', e.target.value)}
                  className="w-16 h-12 text-center text-2xl font-black bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono mx-auto block shadow-inner"
                />
              </div>

              <div className="col-span-1 text-slate-400 font-black text-xl">
                VS
              </div>

              <div className="col-span-3 px-2">
                <span className="text-xs font-bold text-slate-800 block truncate mb-1.5">
                  Visitante FT ({match.awayTeamName})
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={awayScore}
                  onChange={(e) => handleScoreChange('away', e.target.value)}
                  className="w-16 h-12 text-center text-2xl font-black bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono mx-auto block shadow-inner"
                />
              </div>
            </div>

            {/* Halftime score */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">Placar do 1º Tempo (HT - Intervalo):</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-600">Mandante HT:</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={htHome}
                  onChange={(e) => setHtHome(e.target.value)}
                  className="w-12 h-8 text-center bg-slate-50 border border-slate-200 rounded text-slate-900 text-xs font-bold"
                />
                <span className="text-slate-400 font-bold">-</span>
                <span className="text-slate-600">Visitante HT:</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={htAway}
                  onChange={(e) => setHtAway(e.target.value)}
                  className="w-12 h-8 text-center bg-slate-50 border border-slate-200 rounded text-slate-900 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Minutos dos Gols e Momentos dos Primeiros Gols */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              2. Minutos dos Gols & Momentos dos Primeiros Gols
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Minutos dos Gols do Mandante
                </label>
                <input
                  type="text"
                  placeholder="Ex: 14', 38', 85'"
                  value={goalMinutesHome}
                  onChange={(e) => setGoalMinutesHome(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-500 placeholder-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Minutos dos Gols do Visitante
                </label>
                <input
                  type="text"
                  placeholder="Ex: 52', 90+2'"
                  value={goalMinutesAway}
                  onChange={(e) => setGoalMinutesAway(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-500 placeholder-slate-400 font-mono"
                />
              </div>
            </div>

            {/* Momentos Específicos dos Gols */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Momento do 1º Gol do Jogo */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                  />
                  <span className="text-xs text-slate-500 font-bold">'</span>
                </div>
              </div>

              {/* Momento do 1º Gol Mandante (Aparece apenas se Gol Mandante FT != 0) */}
              {showHomeFirstGoalField && (
                <div className="bg-white p-2.5 rounded-xl border border-blue-200 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-bold text-blue-700 mb-1">
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
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                    />
                    <span className="text-xs text-slate-500 font-bold">'</span>
                  </div>
                </div>
              )}

              {/* Momento do 1º Gol Visitante (Aparece apenas se Gol Visitante FT != 0) */}
              {showAwayFirstGoalField && (
                <div className="bg-white p-2.5 rounded-xl border border-blue-200 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-bold text-blue-700 mb-1">
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
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                    />
                    <span className="text-xs text-slate-500 font-bold">'</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Estatísticas de Jogo (Mandante x Visitante em FT e HT) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              3. Estatísticas Detalhadas (FT: Tempo Total | HT: 1º Tempo)
            </span>

            <div className="space-y-3 text-xs">
              {/* Header Label Row */}
              <div className="grid grid-cols-5 text-center text-[11px] font-bold text-slate-600 pb-1 border-b border-slate-200">
                <span className="text-left col-span-2">MÉTRICA DA PARTIDA</span>
                <span className="text-blue-700">TEMPO TOTAL (FT)</span>
                <span className="text-blue-600">1º TEMPO (HT)</span>
              </div>

              {/* Row 1: Cantos (Escanteios) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-blue-600" />
                  Escanteios / Cantos (Mandante vs Visitante)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-semibold">FT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={cornersHomeFT}
                        onChange={(e) => setCornersHomeFT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-slate-900"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={cornersAwayFT}
                        onChange={(e) => setCornersAwayFT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-semibold">HT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={cornersHomeHT}
                        onChange={(e) => setCornersHomeHT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-blue-600"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={cornersAwayHT}
                        onChange={(e) => setCornersAwayHT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Posse de Bola */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Posse de Bola % (Mandante vs Visitante)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-semibold">FT (% Mandante x % Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50%"
                        value={possHomeFT}
                        onChange={(e) => setPossHomeFT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-slate-900"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50%"
                        value={possAwayFT}
                        onChange={(e) => setPossAwayFT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-semibold">HT (% Mandante x % Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50%"
                        value={possHomeHT}
                        onChange={(e) => setPossHomeHT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-blue-600"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50%"
                        value={possAwayHT}
                        onChange={(e) => setPossAwayHT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Cartões Amarelos */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                  🟨 Cartões Amarelos (Mandante vs Visitante)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-semibold">FT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={yellowHomeFT}
                        onChange={(e) => setYellowHomeFT(e.target.value)}
                        className="w-full bg-slate-50 border border-amber-300 rounded-lg p-1.5 text-center font-mono font-bold text-amber-700"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={yellowAwayFT}
                        onChange={(e) => setYellowAwayFT(e.target.value)}
                        className="w-full bg-slate-50 border border-amber-300 rounded-lg p-1.5 text-center font-mono font-bold text-amber-700"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-semibold">HT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={yellowHomeHT}
                        onChange={(e) => setYellowHomeHT(e.target.value)}
                        className="w-full bg-slate-50 border border-amber-300 rounded-lg p-1.5 text-center font-mono font-bold text-amber-600"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={yellowAwayHT}
                        onChange={(e) => setYellowAwayHT(e.target.value)}
                        className="w-full bg-slate-50 border border-amber-300 rounded-lg p-1.5 text-center font-mono font-bold text-amber-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Cartões Vermelhos */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                  🟥 Cartões Vermelhos (Mandante vs Visitante)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-semibold">FT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={redHomeFT}
                        onChange={(e) => setRedHomeFT(e.target.value)}
                        className="w-full bg-slate-50 border border-red-200 rounded-lg p-1.5 text-center font-mono font-bold text-red-600"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={redAwayFT}
                        onChange={(e) => setRedAwayFT(e.target.value)}
                        className="w-full bg-slate-50 border border-red-200 rounded-lg p-1.5 text-center font-mono font-bold text-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-semibold">HT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={redHomeHT}
                        onChange={(e) => setRedHomeHT(e.target.value)}
                        className="w-full bg-slate-50 border border-red-200 rounded-lg p-1.5 text-center font-mono font-bold text-red-600"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={redAwayHT}
                        onChange={(e) => setRedAwayHT(e.target.value)}
                        className="w-full bg-slate-50 border border-red-200 rounded-lg p-1.5 text-center font-mono font-bold text-red-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 5: Chutes ao Gol (On Target) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  Chutes no Gol / No Alvo (Mandante vs Visitante)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-semibold">FT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsTargetHomeFT}
                        onChange={(e) => setShotsTargetHomeFT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-slate-900"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsTargetAwayFT}
                        onChange={(e) => setShotsTargetAwayFT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-semibold">HT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsTargetHomeHT}
                        onChange={(e) => setShotsTargetHomeHT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-blue-600"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsTargetAwayHT}
                        onChange={(e) => setShotsTargetAwayHT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 6: Finalizações (Chutes Totais) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                  Finalizações / Chutes Totais (Mandante vs Visitante)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-semibold">FT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsHomeFT}
                        onChange={(e) => setShotsHomeFT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-slate-900"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsAwayFT}
                        onChange={(e) => setShotsAwayFT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1 font-semibold">HT (Mandante x Visitante)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsHomeHT}
                        onChange={(e) => setShotsHomeHT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-blue-600"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shotsAwayHT}
                        onChange={(e) => setShotsAwayHT(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
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

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Zap,
  TrendingUp,
  DollarSign,
  Clock,
  Trophy,
  Shield,
  Layers,
  Flame,
  CheckCircle2,
  Copy,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  ExternalLink,
  Wallet,
  Share2,
  Calendar
} from 'lucide-react';
import { DbState, Match } from '../../types';
import {
  scanAllMatchesForValue,
  scanFirstHalfGoalOpportunities,
  scanBttsMatrix,
  calculateTeamEfficiencies,
  generateSmartBetTickets,
  ValueScannerOpportunity,
  HtGoalOpportunity,
  BttsMatrixItem,
  TeamEfficiencyProfile,
  GeneratedBetTicket,
} from '../../utils/bettingEngine';
import { isValidImageUrl } from '../../utils/imageHelper';

interface OpportunitiesHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onSelectMatchAnalysis: (matchId: string) => void;
  onRegisterBetToBankroll: (prefill: {
    matchDescription: string;
    market: string;
    odd: number;
    evPct?: number;
  }) => void;
}

export const OpportunitiesHubModal: React.FC<OpportunitiesHubModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onSelectMatchAnalysis,
  onRegisterBetToBankroll,
}) => {
  const [activeTab, setActiveTab] = useState<'VALUE_EV' | 'HT_GOALS' | 'BTTS_MATRIX' | 'XG_EFFICIENCY' | 'TICKETS'>('VALUE_EV');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);

  // Computar dados de cada scanner
  const valueOpportunities = useMemo(() => scanAllMatchesForValue(dbState), [dbState]);
  const htOpportunities = useMemo(() => scanFirstHalfGoalOpportunities(dbState), [dbState]);
  const bttsOpportunities = useMemo(() => scanBttsMatrix(dbState), [dbState]);
  const teamEfficiencies = useMemo(() => calculateTeamEfficiencies(dbState), [dbState]);
  const tickets = useMemo(() => generateSmartBetTickets(dbState), [dbState]);

  if (!isOpen) return null;

  const handleCopyTicket = (ticket: GeneratedBetTicket) => {
    const text = `🎟️ *${ticket.title.toUpperCase()}* 🎟️
${ticket.description}
📊 *Odd Combinada:* ${ticket.combinedOdd.toFixed(2)} | *Probabilidade:* ${ticket.combinedProbPct.toFixed(1)}%

📌 *SELEÇÕES:*
${ticket.selections.map((s, idx) => `${idx + 1}. ⚽ ${s.teams} (${s.league})\n   👉 *${s.market}* @ ${s.odd.toFixed(2)} (${s.probPct.toFixed(0)}%)`).join('\n\n')}

_Gerado por FUT LFM2 Analytics Engine_ 🚀`;

    navigator.clipboard.writeText(text);
    setCopiedTicketId(ticket.id);
    setTimeout(() => setCopiedTicketId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-950">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Central de Oportunidades & Scanner de Apostas
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                  PRO AI
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Inteligência preditiva, detecção de valor esperado (+EV), radar HT, matriz BTTS e bilhetes prontos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('VALUE_EV')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'VALUE_EV'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Scanner +EV ({valueOpportunities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HT_GOALS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'HT_GOALS'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Radar HT Gols ({htOpportunities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BTTS_MATRIX')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'BTTS_MATRIX'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Matriz Ambas Marcam</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('XG_EFFICIENCY')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'XG_EFFICIENCY'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Equipes Super/Subestimadas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TICKETS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'TICKETS'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                : 'text-amber-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Bilhetes Prontos ({tickets.length})</span>
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-4">
          {/* ========================================================= */}
          {/* ABA 1: SCANNER +EV (DESAJUSTES DE ODDS & CRITÉRIO DE KELLY) */}
          {/* ========================================================= */}
          {activeTab === 'VALUE_EV' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                <div>
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Oportunidades de Valor Esperado Positivo (+EV)
                  </h4>
                  <p className="text-xs text-emerald-800/80 mt-0.5">
                    Partidas onde a Odd oferecida pela Casa de Apostas é superior à Odd Justa calculada pelo modelo estatístico.
                  </p>
                </div>
                <div className="text-xs font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs self-start sm:self-auto">
                  Critério de Kelly: <strong>Fração Segura (Quarter Kelly)</strong>
                </div>
              </div>

              {valueOpportunities.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
                  <DollarSign className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700 text-sm">Nenhum desajuste de odd cadastrado no momento.</p>
                  <p className="text-xs text-slate-400">
                    Cadastre as odds dos jogos para que o algoritmo identifique automaticamente apostas de valor (+EV).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {valueOpportunities.map((opp, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-emerald-200/90 shadow-sm p-4 sm:p-5 space-y-3 relative hover:border-emerald-400 transition-all group"
                    >
                      <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5">
                        <span className="font-bold text-slate-500 truncate max-w-[200px]">
                          {opp.leagueName} {opp.countryName ? `• ${opp.countryName}` : ''}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          +EV: {opp.evPct > 0 ? `+${opp.evPct}%` : `${opp.evPct}%`}
                        </span>
                      </div>

                      {/* Times */}
                      <div className="flex items-center justify-between font-black text-slate-900 text-sm">
                        <div className="flex items-center gap-2 truncate">
                          {isValidImageUrl(opp.homeTeamLogoUrl) ? (
                            <img src={opp.homeTeamLogoUrl} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-[9px] flex items-center justify-center font-bold">M</span>
                          )}
                          <span className="truncate">{opp.homeTeamName}</span>
                        </div>
                        <span className="text-xs text-slate-400 px-2 font-normal">x</span>
                        <div className="flex items-center gap-2 truncate justify-end">
                          <span className="truncate">{opp.awayTeamName}</span>
                          {isValidImageUrl(opp.awayTeamLogoUrl) ? (
                            <img src={opp.awayTeamLogoUrl} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="w-5 h-5 rounded bg-amber-100 text-amber-700 text-[9px] flex items-center justify-center font-bold">V</span>
                          )}
                        </div>
                      </div>

                      {/* Seleção e Comparativo de Odds */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-slate-800">{opp.selection}</span>
                          <span className="font-bold text-blue-600">{opp.modelProbPct.toFixed(1)}% prob.</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 border-t border-slate-200/60">
                          <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">Odd Justa</span>
                            <span className="font-mono font-bold text-slate-700">{opp.fairOdd.toFixed(2)}</span>
                          </div>
                          <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                            <span className="text-[9px] text-emerald-600 block uppercase font-bold">Odd Casa</span>
                            <span className="font-mono font-black text-emerald-800 text-xs">{opp.bookmakerOdd.toFixed(2)}</span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">Kelly Stake</span>
                            <span className="font-mono font-bold text-blue-700">{opp.kellyStakePct}% banca</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 italic leading-relaxed">
                        💡 {opp.reasoning}
                      </p>

                      {/* Botões de Ação */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            onRegisterBetToBankroll({
                              matchDescription: `${opp.homeTeamName} x ${opp.awayTeamName}`,
                              market: opp.selection,
                              odd: opp.bookmakerOdd,
                              evPct: opp.evPct,
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                        >
                          <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Salvar na Banca</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectMatchAnalysis(opp.matchId);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          <span>Abrir Análise</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 2: RADAR DE GOLS NO 1º TEMPO (HT & OVER 0.5 HT) */}
          {/* ========================================================= */}
          {activeTab === 'HT_GOALS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                <div>
                  <h4 className="text-sm font-black text-blue-950 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Radar de Gols no 1º Tempo (HT)
                  </h4>
                  <p className="text-xs text-blue-800/80 mt-0.5">
                    Mapeamento das partidas com maior propensão de gol antes do intervalo (Over 0.5 HT & 1.5 HT).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {htOpportunities.map((ht, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-500 truncate">{ht.leagueName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          ht.recommendation === 'ALTA CONFIANÇA'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : ht.recommendation === 'EVITAR'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ht.recommendation}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-black text-slate-900 text-sm">
                      <span>{ht.homeTeamName}</span>
                      <span className="text-xs text-slate-400 font-normal">x</span>
                      <span>{ht.awayTeamName}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-blue-50 p-2 rounded-xl border border-blue-200">
                        <span className="text-[9px] text-blue-700 uppercase font-bold block">Over 0.5 HT</span>
                        <span className="font-black text-blue-900 text-sm">{ht.probOver05HtPct}%</span>
                        <span className="text-[9px] text-blue-600 block">Odd: {ht.fairOddOver05Ht.toFixed(2)}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Over 1.5 HT</span>
                        <span className="font-bold text-slate-800 text-sm">{ht.probOver15HtPct}%</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Média Gols HT</span>
                        <span className="font-bold text-slate-800 text-sm">{ht.avgHtGoalsSum}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="flex justify-between">
                        <span>Mandante marcou no HT em casa:</span>
                        <strong className="text-slate-900">{ht.homeHtScoringPct}% dos jogos</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Visitante sofreu gol no HT fora:</span>
                        <strong className="text-slate-900">{ht.awayHtConcedingPct}% dos jogos</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          onRegisterBetToBankroll({
                            matchDescription: `${ht.homeTeamName} x ${ht.awayTeamName}`,
                            market: 'Over 0.5 Gols HT',
                            odd: ht.fairOddOver05Ht,
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                      >
                        + Salvar na Banca
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectMatchAnalysis(ht.matchId);
                          onClose();
                        }}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                      >
                        Ver Jogo →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 3: MATRIZ AMBAS MARCAM (BTTS MATRIX) */}
          {/* ========================================================= */}
          {activeTab === 'BTTS_MATRIX' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                <div>
                  <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-600" />
                    Matriz de Tendência: Ambas as Equipes Marcam (BTTS)
                  </h4>
                  <p className="text-xs text-amber-900/80 mt-0.5">
                    Cruzamento de regularidade ofensiva do mandante em casa vs fragilidade defensiva do visitante fora.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bttsOpportunities.map((btts, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3 hover:border-amber-300 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-500 truncate">{btts.leagueName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          btts.trend === 'FORTE SIM'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : btts.trend === 'TENDÊNCIA NÃO'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {btts.trend}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-black text-slate-900 text-sm">
                      <span>{btts.homeTeamName}</span>
                      <span className="text-xs text-slate-400 font-normal">x</span>
                      <span>{btts.awayTeamName}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                        <span className="text-[9px] text-amber-800 uppercase font-bold block">BTTS Score</span>
                        <span className="font-black text-amber-950 text-sm">{btts.bttsScoreIndex}/100</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Prob. Sim</span>
                        <span className="font-bold text-slate-800 text-sm">{btts.bttsYesProbPct}%</span>
                        <span className="text-[9px] text-slate-400 block">Odd: {btts.fairOddBttsYes}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Prob. Não</span>
                        <span className="font-bold text-slate-800 text-sm">{(100 - btts.bttsYesProbPct).toFixed(1)}%</span>
                        <span className="text-[9px] text-slate-400 block">Odd: {btts.fairOddBttsNo}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div>
                        Mandante marca em casa: <strong>{btts.homeScoreRegularityHome}%</strong>
                      </div>
                      <div>
                        Visitante marca fora: <strong>{btts.awayScoreRegularityAway}%</strong>
                      </div>
                      <div>
                        Mandante sofre em casa: <strong>{btts.homeConcedePctHome}%</strong>
                      </div>
                      <div>
                        Visitante sofre fora: <strong>{btts.awayConcedePctAway}%</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          onRegisterBetToBankroll({
                            matchDescription: `${btts.homeTeamName} x ${btts.awayTeamName}`,
                            market: 'Ambas Marcam Sim',
                            odd: btts.fairOddBttsYes,
                          });
                        }}
                        className="text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
                      >
                        + Salvar na Banca
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectMatchAnalysis(btts.matchId);
                          onClose();
                        }}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                      >
                        Ver Jogo →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 4: EQUIPES SUPERESTIMADAS VS SUBESTIMADAS (xG EFFECT) */}
          {/* ========================================================= */}
          {activeTab === 'XG_EFFICIENCY' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-50 border border-purple-200 p-4 rounded-2xl">
                <div>
                  <h4 className="text-sm font-black text-purple-950 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Radar de Eficiência xG (Equipes Super & Subestimadas)
                  </h4>
                  <p className="text-xs text-purple-900/80 mt-0.5">
                    Identifica equipes com discrepâncias entre gols reais e expectativa xG (candidatas à regressão à média).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamEfficiencies.map((t, idx) => {
                  const isOver = t.classification.includes('SUPERESTIMADO');
                  const isUnder = t.classification.includes('SUBESTIMADO');

                  return (
                    <div
                      key={idx}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                        isOver
                          ? 'bg-rose-50/50 border-rose-200'
                          : isUnder
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isValidImageUrl(t.logoUrl) ? (
                            <img src={t.logoUrl} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                              {t.teamName.substring(0, 2)}
                            </div>
                          )}
                          <div>
                            <h5 className="font-black text-slate-900 text-sm">{t.teamName}</h5>
                            <span className="text-[10px] text-slate-500">{t.leagueName} ({t.matchesCount} jogos)</span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isOver
                              ? 'bg-rose-200 text-rose-900'
                              : isUnder
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isOver ? 'Superestimado' : isUnder ? 'Subestimado' : 'Consistente'}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Gols Feitos</span>
                          <span className="font-bold text-slate-900">{t.goalsScored}</span>
                          <span className="text-[9px] text-slate-500 block">xG: {t.xgTotal}</span>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Gols Sofridos</span>
                          <span className="font-bold text-slate-900">{t.goalsConceded}</span>
                          <span className="text-[9px] text-slate-500 block">xGA: {t.xgaTotal}</span>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Saldo xG</span>
                          <span className={`font-bold ${t.xgDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {t.xgDiff > 0 ? `+${t.xgDiff}` : t.xgDiff}
                          </span>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Índice Sorte</span>
                          <span className="font-bold font-mono text-purple-700">
                            {t.luckIndex > 0 ? `+${t.luckIndex}` : t.luckIndex}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-200/80 italic">
                        💡 {t.tipAdvice}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 5: BILHETES PRONTOS GERADOS AUTOMATICAMENTE */}
          {/* ========================================================= */}
          {activeTab === 'TICKETS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl">
                <div>
                  <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    Bilhetes Prontos do Dia (Múltiplas Inteligentes)
                  </h4>
                  <p className="text-xs text-amber-900/80 mt-0.5">
                    Sugestões de bilhetes fundamentados nas maiores probabilidades matemáticas e discrepâncias de valor.
                  </p>
                </div>
              </div>

              {tickets.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
                  <Trophy className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700 text-sm">Sem jogos suficientes para montar bilhetes múltiplos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {tickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                            {ticket.type}
                          </span>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Odd Total</span>
                            <span className="font-mono font-black text-emerald-700 text-base sm:text-lg">
                              {ticket.combinedOdd.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-black text-slate-900 text-sm">{ticket.title}</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">{ticket.description}</p>
                        </div>

                        {/* Seleções do Bilhete */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          {ticket.selections.map((sel, sIdx) => (
                            <div key={sIdx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs space-y-1">
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span className="truncate pr-2">{sel.teams}</span>
                                <span className="font-mono text-emerald-700 shrink-0">@{sel.odd.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span className="font-semibold text-blue-700">{sel.market}</span>
                                <span>{sel.probPct.toFixed(0)}% prob</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Botões do Bilhete */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleCopyTicket(ticket)}
                          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            copiedTicketId === ticket.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {copiedTicketId === ticket.id ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copiar Bilhete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 text-slate-400 border-t border-slate-800 flex items-center justify-between text-xs">
          <span>Modelos calibrados por Dixon-Coles, Maher e Distribuição de Poisson.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
          >
            Fechar Scanner
          </button>
        </div>
      </div>
    </div>
  );
};

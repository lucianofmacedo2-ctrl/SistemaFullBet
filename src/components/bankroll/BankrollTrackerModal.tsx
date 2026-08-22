import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Upload,
  RefreshCw,
  Wallet,
  PieChart
} from 'lucide-react';
import {
  SavedBetRecord,
  BankrollSummary,
  loadSavedBets,
  saveBetRecord,
  updateBetStatus,
  deleteSavedBet,
  calculateBankrollSummary,
} from '../../utils/bettingEngine';

interface BankrollTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillBet?: {
    matchDescription: string;
    market: string;
    odd: number;
    evPct?: number;
  } | null;
}

export const BankrollTrackerModal: React.FC<BankrollTrackerModalProps> = ({
  isOpen,
  onClose,
  prefillBet,
}) => {
  const [bets, setBets] = useState<SavedBetRecord[]>([]);
  const [initialBank, setInitialBank] = useState<number>(1000);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'WON' | 'LOST'>('ALL');

  // Form states
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [matchDescription, setMatchDescription] = useState('');
  const [market, setMarket] = useState('');
  const [odd, setOdd] = useState('1.90');
  const [stake, setStake] = useState('50');
  const [notes, setNotes] = useState('');

  // Load initial bets
  useEffect(() => {
    if (isOpen) {
      const saved = loadSavedBets();
      setBets(saved);

      const savedBank = localStorage.getItem('fut_lfm2_initial_bank');
      if (savedBank) {
        setInitialBank(parseFloat(savedBank) || 1000);
      }

      if (prefillBet) {
        setMatchDescription(prefillBet.matchDescription);
        setMarket(prefillBet.market);
        setOdd(prefillBet.odd.toFixed(2));
        setIsAddingNew(true);
      }
    }
  }, [isOpen, prefillBet]);

  if (!isOpen) return null;

  const summary = calculateBankrollSummary(bets, initialBank);

  const handleUpdateBank = (val: number) => {
    setInitialBank(val);
    localStorage.setItem('fut_lfm2_initial_bank', String(val));
  };

  const handleSaveNewBet = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedOdd = parseFloat(odd);
    const parsedStake = parseFloat(stake);

    if (isNaN(parsedOdd) || parsedOdd <= 1.0 || isNaN(parsedStake) || parsedStake <= 0) {
      alert('Por favor informe uma Odd e uma Stake válidas.');
      return;
    }

    const updated = saveBetRecord({
      date: new Date().toISOString(),
      matchDescription: matchDescription || 'Aposta Personalizada',
      market: market || 'Mercado Geral',
      odd: parsedOdd,
      stake: parsedStake,
      status: 'PENDING',
      profitOrLoss: 0,
      notes,
    });

    setBets(updated);
    setIsAddingNew(false);
    setMatchDescription('');
    setMarket('');
    setNotes('');
  };

  const handleStatusChange = (betId: string, status: SavedBetRecord['status']) => {
    const updated = updateBetStatus(betId, status);
    setBets(updated);
  };

  const handleDelete = (betId: string) => {
    if (confirm('Deseja excluir este registro de aposta?')) {
      const updated = deleteSavedBet(betId);
      setBets(updated);
    }
  };

  const filteredBets = bets.filter(b => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Gestão de Banca & Histórico de Apostas
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Auto-ROI Tracker
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Controle financeiro, cálculo de retorno sobre investimento (ROI) e gestão de risco
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Dashboard Financial Metric Cards */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Saldo Atual */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Saldo Atual
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
              R$ {summary.currentBank.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400">
              Banca Inicial: R$ {summary.initialBank.toFixed(0)}
            </div>
          </div>

          {/* Card 2: Lucro / Prejuízo */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Lucro / Prejuízo
            </span>
            <div
              className={`text-lg sm:text-xl font-black font-mono flex items-center gap-1 ${
                summary.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {summary.totalProfit >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              R$ {summary.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400">
              Total Apostado: R$ {summary.totalStaked.toFixed(0)}
            </div>
          </div>

          {/* Card 3: ROI (%) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              ROI (Retorno %)
            </span>
            <div
              className={`text-lg sm:text-xl font-black font-mono ${
                summary.roiPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {summary.roiPct > 0 ? '+' : ''}{summary.roiPct.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400">
              Eficiência por real investido
            </div>
          </div>

          {/* Card 4: Taxa de Acerto (Win Rate) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Win Rate %
            </span>
            <div className="text-lg sm:text-xl font-black text-blue-600 font-mono">
              {summary.winRatePct.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400">
              🟢 {summary.wonBets}V • 🔴 {summary.lostBets}D • ⏳ {summary.pendingBets}
            </div>
          </div>
        </div>

        {/* Action Controls & New Bet Form Toggle */}
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingNew ? 'Fechar Formulário' : 'Nova Entrada'}</span>
            </button>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              {(['ALL', 'PENDING', 'WON', 'LOST'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Pendentes' : f === 'WON' ? 'Ganhas' : 'Perdidas'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Banca Inicial: R$</span>
            <input
              type="number"
              value={initialBank}
              onChange={e => handleUpdateBank(parseFloat(e.target.value) || 0)}
              className="w-24 px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-bold"
            />
          </div>
        </div>

        {/* Collapsible Form for New Bet */}
        {isAddingNew && (
          <form onSubmit={handleSaveNewBet} className="p-4 sm:p-5 bg-blue-50/50 border-b border-blue-100 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              Registrar Aposta na Banca
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Partida / Confronto</label>
                <input
                  type="text"
                  placeholder="Ex: Real Madrid x Barcelona"
                  value={matchDescription}
                  onChange={e => setMatchDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mercado / Seleção</label>
                <input
                  type="text"
                  placeholder="Ex: Mais de 2.5 Gols"
                  value={market}
                  onChange={e => setMarket(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Odd Decimal</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1.95"
                  value={odd}
                  onChange={e => setOdd(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Stake (Valor em R$)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="Ex: 50"
                  value={stake}
                  onChange={e => setStake(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Salvar Entrada
              </button>
            </div>
          </form>
        )}

        {/* Bets List Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {filteredBets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Wallet className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">Nenhuma aposta encontrada no filtro selecionado.</p>
              <p className="text-xs text-slate-400">Clique em "Nova Entrada" ou registre oportunidades diretamente das análises.</p>
            </div>
          ) : (
            filteredBets.map(bet => {
              const isWon = bet.status === 'WON';
              const isLost = bet.status === 'LOST';
              const isPending = bet.status === 'PENDING';

              return (
                <div
                  key={bet.id}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    isWon
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : isLost
                      ? 'bg-rose-50/70 border-rose-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(bet.date).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="font-black text-slate-900 text-sm">{bet.matchDescription}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-bold text-[11px]">
                        {bet.market}
                      </span>
                      <span>Odd: <strong className="font-mono text-slate-900">{bet.odd.toFixed(2)}</strong></span>
                      <span>Stake: <strong className="font-mono text-slate-900">R$ {bet.stake.toFixed(2)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Resultado</span>
                      <span
                        className={`font-mono font-black text-sm ${
                          isWon ? 'text-emerald-700' : isLost ? 'text-rose-700' : 'text-amber-600'
                        }`}
                      >
                        {isWon
                          ? `+R$ ${bet.profitOrLoss.toFixed(2)}`
                          : isLost
                          ? `-R$ ${Math.abs(bet.profitOrLoss).toFixed(2)}`
                          : 'Pendente'}
                      </span>
                    </div>

                    {/* Status Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(bet.id, 'WON')}
                        title="Marcar como Ganha (Green)"
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isWon
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-emerald-600 border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(bet.id, 'LOST')}
                        title="Marcar como Perdida (Red)"
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isLost
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-rose-600 border-slate-200 hover:bg-rose-50'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(bet.id, 'PENDING')}
                        title="Marcar como Pendente"
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isPending
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-amber-600 border-slate-200 hover:bg-amber-50'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(bet.id)}
                        title="Excluir Aposta"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Total de {bets.length} apostas gerenciadas localmente.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
          >
            Fechar Gerenciador
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Trophy,
  Globe,
  MapPin,
  Shield,
  CheckCircle2,
  AlertCircle,
  Hash,
  TrendingUp,
  FileCheck,
  FileWarning,
  Edit2,
  Trash2,
  FileSpreadsheet,
  CalendarDays,
  Sparkles,
  BarChart2,
  Eye,
  Info,
  Zap,
  LayoutList,
  LayoutGrid
} from 'lucide-react';
import { DbState, Match, MatchStatus } from '../types';
import { checkMatchCompleteness } from './MatchList';

interface DailyMatchesViewProps {
  dbState: DbState;
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenMatchModal: () => void;
  onOpenStatsModal: (match: Match) => void;
  onOpenQuickScore?: (match: Match) => void;
  onOpenBulkMatchImportModal?: () => void;
}

export type DaySelectionMode = 'TODAY' | 'TOMORROW' | 'AFTER_TOMORROW' | 'THREE_DAYS' | 'CUSTOM';

// Helper to format Date object into YYYY-MM-DD in local time
export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper to extract YYYY-MM-DD from any matchDate string format
export function extractYMD(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const str = dateStr.trim();

  // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
  }

  // DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  }

  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return formatDateToYMD(parsed);
    }
  } catch {}

  return null;
}

// Helper to format date in Portuguese display e.g. "Sexta-feira, 14/08"
export function formatFriendlyDate(ymd: string): { title: string; subtitle: string; fullDate: string } {
  try {
    const [y, m, d] = ymd.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    const formattedShort = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const fullDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return {
      title: capitalizedDay,
      subtitle: formattedShort,
      fullDate,
    };
  } catch {
    return { title: ymd, subtitle: '', fullDate: ymd };
  }
}

// Helper to extract time (HH:mm) from matchDate
export function extractTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    // Check if ISO with time
    const timeMatch = dateStr.match(/[T\s](\d{2}):(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1]}:${timeMatch[2]}`;
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
  } catch {}
  return '';
}

export const DailyMatchesView: React.FC<DailyMatchesViewProps> = ({
  dbState,
  onEditMatch,
  onDeleteMatch,
  onOpenMatchModal,
  onOpenStatsModal,
  onOpenQuickScore,
  onOpenBulkMatchImportModal,
}) => {
  // Base reference date (today)
  const today = useMemo(() => new Date(), []);
  
  const todayYMD = useMemo(() => formatDateToYMD(today), [today]);
  
  const tomorrowYMD = useMemo(() => {
    const t = new Date(today);
    t.setDate(today.getDate() + 1);
    return formatDateToYMD(t);
  }, [today]);

  const afterTomorrowYMD = useMemo(() => {
    const at = new Date(today);
    at.setDate(today.getDate() + 2);
    return formatDateToYMD(at);
  }, [today]);

  // View mode and selected custom date
  const [dayMode, setDayMode] = useState<DaySelectionMode>('TODAY');
  const [customDateYMD, setCustomDateYMD] = useState<string>(todayYMD);

  // View layout: 'single' (1 coluna - um embaixo do outro) or 'double' (2 colunas)
  const [viewLayout, setViewLayout] = useState<'single' | 'double'>('single');

  // Search and sub-filters within selected day
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Expandable odds/stats per card
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Calculate matches counts per key dates
  const matchesByDateMap = useMemo(() => {
    const map: Record<string, Match[]> = {};
    dbState.matches.forEach(m => {
      const ymd = extractYMD(m.matchDate);
      if (ymd) {
        if (!map[ymd]) map[ymd] = [];
        map[ymd].push(m);
      }
    });
    return map;
  }, [dbState.matches]);

  const todayCount = (matchesByDateMap[todayYMD] || []).length;
  const tomorrowCount = (matchesByDateMap[tomorrowYMD] || []).length;
  const afterTomorrowCount = (matchesByDateMap[afterTomorrowYMD] || []).length;
  const threeDaysCount = todayCount + tomorrowCount + afterTomorrowCount;

  // Active dates to filter
  const targetDates = useMemo<string[]>(() => {
    switch (dayMode) {
      case 'TODAY':
        return [todayYMD];
      case 'TOMORROW':
        return [tomorrowYMD];
      case 'AFTER_TOMORROW':
        return [afterTomorrowYMD];
      case 'THREE_DAYS':
        return [todayYMD, tomorrowYMD, afterTomorrowYMD];
      case 'CUSTOM':
        return customDateYMD ? [customDateYMD] : [todayYMD];
      default:
        return [todayYMD];
    }
  }, [dayMode, todayYMD, tomorrowYMD, afterTomorrowYMD, customDateYMD]);

  // Filter matches matching the target dates
  const dailyMatches = useMemo(() => {
    return dbState.matches.filter(m => {
      const ymd = extractYMD(m.matchDate);
      if (!ymd || !targetDates.includes(ymd)) return false;

      // Search term filter
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const matchesSearch =
          m.id.toLowerCase().includes(s) ||
          m.homeTeamName.toLowerCase().includes(s) ||
          m.awayTeamName.toLowerCase().includes(s) ||
          m.leagueName.toLowerCase().includes(s) ||
          m.countryName.toLowerCase().includes(s) ||
          (m.stadium && m.stadium.toLowerCase().includes(s));
        if (!matchesSearch) return false;
      }

      // League filter
      if (selectedLeagueId !== 'ALL' && m.leagueId !== selectedLeagueId) {
        return false;
      }

      // Status filter
      if (selectedStatus && m.status !== selectedStatus) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort chronologically by date/time
      const timeA = new Date(a.matchDate).getTime() || 0;
      const timeB = new Date(b.matchDate).getTime() || 0;
      return timeA - timeB;
    });
  }, [dbState.matches, targetDates, searchTerm, selectedLeagueId, selectedStatus]);

  // Metrics for filtered daily matches
  const totalInView = dailyMatches.length;
  const scheduledCount = dailyMatches.filter(m => m.status === 'AGENDADO').length;
  const liveCount = dailyMatches.filter(m => m.status === 'EM_ANDAMENTO').length;
  const finishedCount = dailyMatches.filter(m => m.status === 'FINALIZADO').length;
  const completeCount = dailyMatches.filter(m => m.status === 'AGENDADO' && checkMatchCompleteness(m).isComplete).length;
  const incompleteCount = dailyMatches.filter(m => m.status === 'AGENDADO' && !checkMatchCompleteness(m).isComplete).length;

  // Navigation handlers for custom date
  const handlePrevDay = () => {
    const current = customDateYMD ? new Date(customDateYMD + 'T12:00:00') : new Date();
    current.setDate(current.getDate() - 1);
    const newYmd = formatDateToYMD(current);
    setCustomDateYMD(newYmd);
    setDayMode('CUSTOM');
  };

  const handleNextDay = () => {
    const current = customDateYMD ? new Date(customDateYMD + 'T12:00:00') : new Date();
    current.setDate(current.getDate() + 1);
    const newYmd = formatDateToYMD(current);
    setCustomDateYMD(newYmd);
    setDayMode('CUSTOM');
  };

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'FINALIZADO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 shadow-xs">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Finalizado
          </span>
        );
      case 'EM_ANDAMENTO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1 animate-pulse shadow-xs">
            <Clock className="w-3 h-3 text-amber-600" />
            Ao Vivo
          </span>
        );
      case 'AGENDADO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1 shadow-xs">
            <Calendar className="w-3 h-3 text-blue-600" />
            Agendado
          </span>
        );
      case 'ADIADO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1 shadow-xs">
            <AlertCircle className="w-3 h-3 text-red-600" />
            Adiado
          </span>
        );
    }
  };

  const getActiveTabTitle = () => {
    switch (dayMode) {
      case 'TODAY':
        return {
          label: 'Jogos de Hoje',
          detail: `${formatFriendlyDate(todayYMD).title}, ${formatFriendlyDate(todayYMD).fullDate}`,
        };
      case 'TOMORROW':
        return {
          label: 'Jogos de Amanhã',
          detail: `${formatFriendlyDate(tomorrowYMD).title}, ${formatFriendlyDate(tomorrowYMD).fullDate}`,
        };
      case 'AFTER_TOMORROW':
        return {
          label: 'Jogos de Depois de Amanhã',
          detail: `${formatFriendlyDate(afterTomorrowYMD).title}, ${formatFriendlyDate(afterTomorrowYMD).fullDate}`,
        };
      case 'THREE_DAYS':
        return {
          label: 'Próximos 3 Dias (Hoje, Amanhã e Depois)',
          detail: `${formatFriendlyDate(todayYMD).subtitle} até ${formatFriendlyDate(afterTomorrowYMD).subtitle}`,
        };
      case 'CUSTOM':
        return {
          label: `Jogos de ${formatFriendlyDate(customDateYMD).title}`,
          detail: formatFriendlyDate(customDateYMD).fullDate,
        };
    }
  };

  const activeHeaderInfo = getActiveTabTitle();

  return (
    <div className="space-y-6">
      {/* 1. Primary Date Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  {activeHeaderInfo.label}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-mono">
                    {totalInView} {totalInView === 1 ? 'partida' : 'partidas'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {activeHeaderInfo.detail}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Date Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Button Hoje */}
            <button
              type="button"
              onClick={() => setDayMode('TODAY')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                dayMode === 'TODAY'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 border border-blue-600 scale-[1.02]'
                  : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <div className="text-left">
                <span className="block leading-none">Hoje</span>
                <span className={`text-[10px] font-mono block mt-0.5 ${dayMode === 'TODAY' ? 'text-blue-100' : 'text-slate-500'}`}>
                  {formatFriendlyDate(todayYMD).subtitle}
                </span>
              </div>
              <span className={`ml-1 text-[11px] font-mono px-2 py-0.5 rounded-full font-black ${
                dayMode === 'TODAY' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {todayCount}
              </span>
            </button>

            {/* Button Amanhã */}
            <button
              type="button"
              onClick={() => setDayMode('TOMORROW')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                dayMode === 'TOMORROW'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 border border-blue-600 scale-[1.02]'
                  : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <div className="text-left">
                <span className="block leading-none">Amanhã</span>
                <span className={`text-[10px] font-mono block mt-0.5 ${dayMode === 'TOMORROW' ? 'text-blue-100' : 'text-slate-500'}`}>
                  {formatFriendlyDate(tomorrowYMD).subtitle}
                </span>
              </div>
              <span className={`ml-1 text-[11px] font-mono px-2 py-0.5 rounded-full font-black ${
                dayMode === 'TOMORROW' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {tomorrowCount}
              </span>
            </button>

            {/* Button Depois de Amanhã */}
            <button
              type="button"
              onClick={() => setDayMode('AFTER_TOMORROW')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                dayMode === 'AFTER_TOMORROW'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 border border-blue-600 scale-[1.02]'
                  : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <div className="text-left">
                <span className="block leading-none">Depois de Amanhã</span>
                <span className={`text-[10px] font-mono block mt-0.5 ${dayMode === 'AFTER_TOMORROW' ? 'text-blue-100' : 'text-slate-500'}`}>
                  {formatFriendlyDate(afterTomorrowYMD).subtitle}
                </span>
              </div>
              <span className={`ml-1 text-[11px] font-mono px-2 py-0.5 rounded-full font-black ${
                dayMode === 'AFTER_TOMORROW' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {afterTomorrowCount}
              </span>
            </button>

            {/* Button Próximos 3 Dias Juntos */}
            <button
              type="button"
              onClick={() => setDayMode('THREE_DAYS')}
              className={`flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                dayMode === 'THREE_DAYS'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 border border-blue-600 scale-[1.02]'
                  : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200'
              }`}
              title="Visualizar jogos de Hoje, Amanhã e Depois juntos"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3 Dias</span>
              <span className={`ml-1 text-[11px] font-mono px-2 py-0.5 rounded-full font-black ${
                dayMode === 'THREE_DAYS' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {threeDaysCount}
              </span>
            </button>
          </div>
        </div>

        {/* Date Navigation Strip & Custom Date Picker */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Custom Date Navigator */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Dia Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={customDateYMD}
              onChange={(e) => {
                setCustomDateYMD(e.target.value);
                setDayMode('CUSTOM');
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
            />

            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Próximo Dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {dayMode === 'CUSTOM' && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 ml-1">
                Data Customizada
              </span>
            )}
          </div>

          {/* Search and Filters inside Date View */}
          <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar time, liga ou estádio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* League Dropdown */}
            <select
              value={selectedLeagueId}
              onChange={(e) => setSelectedLeagueId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">Todas as Ligas ({dbState.leagues.length})</option>
              {dbState.leagues.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.countryName})
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="">Todos os Status</option>
              <option value="AGENDADO">Agendado</option>
              <option value="EM_ANDAMENTO">Ao Vivo</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="ADIADO">Adiado</option>
            </select>

            {/* Clear Filters if active */}
            {(searchTerm || selectedLeagueId !== 'ALL' || selectedStatus) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLeagueId('ALL');
                  setSelectedStatus('');
                }}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Mini Summary Metrics Bar for Selected Day */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Jogos na Data
            </span>
            <span className="text-xl font-black text-slate-900 block mt-0.5">{totalInView}</span>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Agendados (Futuros)
            </span>
            <span className="text-xl font-black text-blue-600 block mt-0.5">{scheduledCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Finalizados
            </span>
            <span className="text-xl font-black text-emerald-600 block mt-0.5">{finishedCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Dados Completos
            </span>
            <span className="text-xl font-black text-slate-900 block mt-0.5">
              {completeCount} <span className="text-xs text-slate-400 font-normal">/ {scheduledCount}</span>
            </span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <FileCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Daily Match Cards List */}
      {dailyMatches.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Nenhuma partida cadastrada para {activeHeaderInfo.label.toLowerCase()}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Não encontramos jogos para {activeHeaderInfo.detail}. Você pode cadastrar um jogo agora ou importar partidas em lote.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenMatchModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 border border-blue-500 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Cadastrar Jogo Nesta Data
            </button>

            {onOpenBulkMatchImportModal && (
              <button
                onClick={onOpenBulkMatchImportModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Importar Jogos (.xlsx)
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium px-1">
            <div className="flex items-center gap-3">
              <span>
                Ordenados por horário • Total: <b>{dailyMatches.length} jogos</b>
              </span>
              
              {/* Layout Switcher: 1 Coluna (um embaixo do outro) vs 2 Colunas */}
              <div className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewLayout('single')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    viewLayout === 'single'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Visualizar jogos um embaixo do outro (1 Coluna)"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>1 Coluna (Vertical)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('double')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    viewLayout === 'double'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Visualizar jogos divididos em 2 Colunas"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>2 Colunas</span>
                </button>
              </div>
            </div>

            <span className="flex items-center gap-1 text-blue-600 font-bold">
              <Info className="w-3.5 h-3.5" /> Clique no placar para editar
            </span>
          </div>

          <div className={viewLayout === 'single' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
            {dailyMatches.map(match => {
              const completeness = checkMatchCompleteness(match);
              const isExpanded = expandedMatchId === match.id;
              const matchTime = extractTime(match.matchDate);
              const matchYmd = extractYMD(match.matchDate) || '';
              const dateInfo = formatFriendlyDate(matchYmd);

              const country = dbState.countries.find(
                c => c.id === match.countryId || c.name.toLowerCase() === match.countryName.toLowerCase()
              );
              const flagUrl = match.countryFlagUrl || country?.flagUrl;

              const league = dbState.leagues.find(
                l => l.id === match.leagueId || l.name.toLowerCase() === match.leagueName.toLowerCase()
              );
              const leagueLogoUrl = match.leagueLogoUrl || league?.logoUrl;

              const homeTeam = dbState.teams.find(
                t => t.id === match.homeTeamId || t.name.toLowerCase() === match.homeTeamName.toLowerCase()
              );
              const homeLogoUrl = match.homeTeamLogoUrl || homeTeam?.logoUrl;

              const awayTeam = dbState.teams.find(
                t => t.id === match.awayTeamId || t.name.toLowerCase() === match.awayTeamName.toLowerCase()
              );
              const awayLogoUrl = match.awayTeamLogoUrl || awayTeam?.logoUrl;

              return (
                <div
                  key={match.id}
                  className={`bg-white border ${
                    match.status === 'AGENDADO'
                      ? completeness.isComplete
                        ? 'border-emerald-300 hover:border-emerald-400'
                        : 'border-amber-300 hover:border-amber-400'
                      : 'border-slate-200 hover:border-blue-300'
                  } rounded-2xl p-4 sm:p-5 shadow-sm transition-all flex flex-col justify-between space-y-3.5 group`}
                >
                  {/* Top Bar of Match Card: Time + League + ID + Status */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Time Badge */}
                      <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                        <Clock className="w-3 h-3 text-blue-600" />
                        {matchTime ? `${matchTime}h` : 'A definir'}
                      </span>

                      {/* Date Pill if multi-day view */}
                      {dayMode === 'THREE_DAYS' && (
                        <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          📅 {dateInfo.subtitle}
                        </span>
                      )}

                      {/* Unique Match ID */}
                      <span className="font-mono font-bold text-xs bg-blue-600 text-white border border-blue-500 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                        <Hash className="w-3 h-3" />
                        {match.id}
                      </span>

                      {/* League & Country */}
                      <div className="flex items-center gap-1 text-xs text-slate-700">
                        {leagueLogoUrl && (
                          <img
                            src={leagueLogoUrl}
                            alt={match.leagueName}
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span className="font-bold text-slate-900">{match.leagueName}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 flex items-center gap-1 font-medium">
                          {flagUrl ? (
                            <img
                              src={flagUrl}
                              alt={match.countryName}
                              className="w-3.5 h-2.5 object-cover rounded-2xs border border-slate-200"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Globe className="w-3 h-3 text-slate-400" />
                          )}
                          {match.countryName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Completeness Badge for AGENDADO */}
                      {match.status === 'AGENDADO' && (
                        completeness.isComplete ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            Completo
                          </span>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1"
                            title={`Faltando: ${completeness.missingFields.join(', ')}`}
                          >
                            <FileWarning className="w-3 h-3 text-amber-600" />
                            Pendente
                          </span>
                        )
                      )}

                      <div>{getStatusBadge(match.status)}</div>
                    </div>
                  </div>

                  {/* Match Scoreboard / Teams */}
                  <div className="grid grid-cols-7 items-center gap-2 my-1">
                    {/* Home Team */}
                    <div className="col-span-3 flex items-center justify-end gap-2 text-right">
                      <div className="space-y-0.5 truncate">
                        <span className="font-bold text-slate-900 text-sm sm:text-base truncate block leading-tight">
                          {match.homeTeamName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-100 px-1 rounded">
                          {match.homeTeamId}
                        </span>
                      </div>
                      {homeLogoUrl ? (
                        <img
                          src={homeLogoUrl}
                          alt={match.homeTeamName}
                          className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg bg-slate-50 border border-slate-200 p-1 shrink-0 shadow-2xs"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs shrink-0">
                          🛡️
                        </div>
                      )}
                    </div>

                    {/* Score / VS Pill */}
                    <div className="col-span-1 text-center flex flex-col items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenQuickScore) onOpenQuickScore(match);
                          else onOpenStatsModal(match);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-400 text-slate-900 rounded-xl font-black text-base sm:text-lg font-mono min-w-[56px] shadow-2xs transition-all cursor-pointer hover:scale-105"
                        title="Clique para Lançar/Editar Placar & Odds Rápido"
                      >
                        {match.homeScore !== null && match.awayScore !== null ? (
                          `${match.homeScore} - ${match.awayScore}`
                        ) : (
                          <span className="text-xs text-slate-400 font-sans uppercase">vs</span>
                        )}
                      </button>
                    </div>

                    {/* Away Team */}
                    <div className="col-span-3 flex items-center justify-start gap-2 text-left">
                      {awayLogoUrl ? (
                        <img
                          src={awayLogoUrl}
                          alt={match.awayTeamName}
                          className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg bg-slate-50 border border-slate-200 p-1 shrink-0 shadow-2xs"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs shrink-0">
                          🛡️
                        </div>
                      )}
                      <div className="space-y-0.5 truncate">
                        <span className="font-bold text-slate-900 text-sm sm:text-base truncate block leading-tight">
                          {match.awayTeamName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-100 px-1 rounded">
                          {match.awayTeamId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Match Location, Round & Referee Info */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      {match.round && (
                        <span className="font-semibold text-slate-800">
                          🏆 {match.round}
                        </span>
                      )}
                      {match.stadium && (
                        <span className="flex items-center gap-1 truncate text-slate-700">
                          <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                          {match.stadium}
                        </span>
                      )}
                      {match.referee && (
                        <span className="text-slate-600">
                          🧑‍⚖️ {match.referee}
                        </span>
                      )}
                    </div>

                    {/* 1X2 Odds FT quick pill */}
                    {match.odds && (match.odds.homeFT != null || match.odds.drawFT != null || match.odds.awayFT != null) && (
                      <div className="font-mono text-xs text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-bold flex items-center gap-1.5 shadow-2xs">
                        <TrendingUp className="w-3 h-3 text-blue-600" />
                        <span>1: <b className="text-blue-700">{match.odds.homeFT ?? '-'}</b></span>
                        <span className="text-slate-300">|</span>
                        <span>X: <b className="text-amber-700">{match.odds.drawFT ?? '-'}</b></span>
                        <span className="text-slate-300">|</span>
                        <span>2: <b className="text-blue-700">{match.odds.awayFT ?? '-'}</b></span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {onOpenQuickScore && (
                        <button
                          type="button"
                          onClick={() => onOpenQuickScore(match)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition-all shadow-xs cursor-pointer"
                          title="Lançar Placar & Odds Rápido"
                        >
                          <Zap className="w-3.5 h-3.5 text-blue-600" />
                          <span>Placar/Odds</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenStatsModal(match)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>{match.status === 'FINALIZADO' ? 'Stats Completas' : 'Lançar Stats'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isExpanded ? 'Ocultar Detalhes' : 'Odds & Detalhes'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditMatch(match)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar Partida"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteMatch(match.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Partida"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Odds & Half-time details */}
                  {isExpanded && (
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-2 text-xs animate-in fade-in duration-150">
                      <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                        Cotações & Marcadores Detalhados
                      </span>

                      {/* Scorers */}
                      {(match.stats?.scorersHome || match.stats?.scorersAway) && (
                        <div className="bg-white p-2 rounded-lg border border-blue-100 space-y-1 text-[11px]">
                          {match.stats.scorersHome && (
                            <div>
                              <span className="font-bold text-blue-700">⚽ {match.homeTeamName}:</span>{' '}
                              <span className="text-slate-800">{match.stats.scorersHome}</span>
                            </div>
                          )}
                          {match.stats.scorersAway && (
                            <div>
                              <span className="font-bold text-blue-700">⚽ {match.awayTeamName}:</span>{' '}
                              <span className="text-slate-800">{match.stats.scorersAway}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Extended Odds Grid */}
                      {match.odds ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
                          {match.odds.over25FT != null && (
                            <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                              <span className="text-slate-500 font-sans">Over 2.5:</span>
                              <span className="font-bold text-blue-700">{match.odds.over25FT}</span>
                            </div>
                          )}
                          {match.odds.under25FT != null && (
                            <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                              <span className="text-slate-500 font-sans">Under 2.5:</span>
                              <span className="font-bold text-blue-700">{match.odds.under25FT}</span>
                            </div>
                          )}
                          {match.odds.bttsFT != null && (
                            <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                              <span className="text-slate-500 font-sans">Ambos Marcam:</span>
                              <span className="font-bold text-blue-700">{match.odds.bttsFT}</span>
                            </div>
                          )}
                          {match.odds.over05HT != null && (
                            <div className="bg-white p-1 rounded border border-blue-100 flex justify-between">
                              <span className="text-slate-500 font-sans">Over 0.5 HT:</span>
                              <span className="font-bold text-blue-700">{match.odds.over05HT}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Nenhuma odd adicional cadastrada.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useMemo } from 'react';
import {
  Image,
  Shield,
  Trophy,
  Globe,
  Search,
  ExternalLink,
  Check,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Filter,
  Download,
  Upload,
  Copy,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  FileSpreadsheet,
  X,
  ArrowRight,
  Info,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
} from 'lucide-react';
import { DbState, Team, League, Country } from '../types';
import {
  exportPendingLogosToExcel,
  parsePendingLogosExcelFile,
  PendingLogoItem,
} from '../utils/excelHelper';
import { isValidImageUrl, sanitizeImageUrl } from '../utils/imageHelper';

interface PendingLogosManagerProps {
  dbState: DbState;
  onUpdateTeamLogo: (teamId: string, logoUrl: string) => void;
  onUpdateLeagueLogo: (leagueId: string, logoUrl: string) => void;
  onUpdateCountryFlag: (countryId: string, flagUrl: string) => void;
  onBulkUpdateLogos?: (updates: {
    countryUpdates?: Record<string, string>;
    leagueUpdates?: Record<string, string>;
    teamUpdates?: Record<string, string>;
  }) => Promise<void>;
}

type TabType = 'all' | 'teams' | 'leagues' | 'countries';
type StatusFilterType = 'PENDING' | 'REGISTERED' | 'ALL';
type ViewMode = 'grid' | 'table';

export const PendingLogosManager: React.FC<PendingLogosManagerProps> = ({
  dbState,
  onUpdateTeamLogo,
  onUpdateLeagueLogo,
  onUpdateCountryFlag,
  onBulkUpdateLogos,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('PENDING');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState('');

  // Local state for URL inputs per item { [id]: urlString }
  const [inputUrls, setInputUrls] = useState<Record<string, string>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});

  // Modals / Tools
  const [isBulkPasteOpen, setIsBulkPasteOpen] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [bulkPasteFeedback, setBulkPasteFeedback] = useState<string | null>(null);

  const [isExcelUploading, setIsExcelUploading] = useState(false);
  const [excelFeedback, setExcelFeedback] = useState<{ success?: string; error?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copyToast, setCopyToast] = useState(false);
  const [batchSaveToast, setBatchSaveToast] = useState<string | null>(null);

  // Unified item representation
  type UnifiedItem = {
    type: 'TEAM' | 'LEAGUE' | 'COUNTRY';
    id: string;
    name: string;
    currentUrl?: string;
    hasValidUrl: boolean;
    context: string;
    subContext?: string;
    countryId?: string;
    leagueId?: string;
  };

  // Reconcile and build full item list
  const allItems: UnifiedItem[] = useMemo(() => {
    const teamsList: UnifiedItem[] = dbState.teams.map(t => ({
      type: 'TEAM',
      id: t.id,
      name: t.name,
      currentUrl: t.logoUrl,
      hasValidUrl: isValidImageUrl(t.logoUrl),
      context: t.countryName,
      subContext: t.leagueName,
      countryId: t.countryId,
      leagueId: t.leagueId,
    }));

    const leaguesList: UnifiedItem[] = dbState.leagues.map(l => ({
      type: 'LEAGUE',
      id: l.id,
      name: l.name,
      currentUrl: l.logoUrl,
      hasValidUrl: isValidImageUrl(l.logoUrl),
      context: l.countryName,
      countryId: l.countryId,
    }));

    const countriesList: UnifiedItem[] = dbState.countries.map(c => ({
      type: 'COUNTRY',
      id: c.id,
      name: c.name,
      currentUrl: c.flagUrl,
      hasValidUrl: isValidImageUrl(c.flagUrl),
      context: c.code ? `Código: ${c.code}` : 'País',
    }));

    return [...teamsList, ...leaguesList, ...countriesList];
  }, [dbState]);

  // Statistics
  const stats = useMemo(() => {
    const totalTeams = dbState.teams.length;
    const teamsWithLogo = dbState.teams.filter(t => isValidImageUrl(t.logoUrl)).length;
    const teamsPending = totalTeams - teamsWithLogo;

    const totalLeagues = dbState.leagues.length;
    const leaguesWithLogo = dbState.leagues.filter(l => isValidImageUrl(l.logoUrl)).length;
    const leaguesPending = totalLeagues - leaguesWithLogo;

    const totalCountries = dbState.countries.length;
    const countriesWithFlag = dbState.countries.filter(c => isValidImageUrl(c.flagUrl)).length;
    const countriesPending = totalCountries - countriesWithFlag;

    const totalPending = teamsPending + leaguesPending + countriesPending;
    const totalRegistered = teamsWithLogo + leaguesWithLogo + countriesWithFlag;
    const totalEntities = totalTeams + totalLeagues + totalCountries;

    return {
      totalTeams,
      teamsWithLogo,
      teamsPending,
      totalLeagues,
      leaguesWithLogo,
      leaguesPending,
      totalCountries,
      countriesWithFlag,
      countriesPending,
      totalPending,
      totalRegistered,
      totalEntities,
    };
  }, [dbState]);

  // Filter items by Tab & Status
  const itemsByTabAndStatus = useMemo(() => {
    return allItems.filter(item => {
      // 1. Tab filter
      if (activeTab === 'teams' && item.type !== 'TEAM') return false;
      if (activeTab === 'leagues' && item.type !== 'LEAGUE') return false;
      if (activeTab === 'countries' && item.type !== 'COUNTRY') return false;

      // 2. Status filter
      if (statusFilter === 'PENDING' && item.hasValidUrl) return false;
      if (statusFilter === 'REGISTERED' && !item.hasValidUrl) return false;

      return true;
    });
  }, [allItems, activeTab, statusFilter]);

  // Filtered by Search & Country / League select
  const displayedItems = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
    return itemsByTabAndStatus.filter(item => {
      const matchesSearch =
        !s ||
        item.name.toLowerCase().includes(s) ||
        item.id.toLowerCase().includes(s) ||
        item.context.toLowerCase().includes(s) ||
        (item.subContext && item.subContext.toLowerCase().includes(s));

      const matchesCountry = !selectedCountryFilter || item.countryId === selectedCountryFilter;
      const matchesLeague = !selectedLeagueFilter || item.leagueId === selectedLeagueFilter;

      return matchesSearch && matchesCountry && matchesLeague;
    });
  }, [itemsByTabAndStatus, searchTerm, selectedCountryFilter, selectedLeagueFilter]);

  // Count how many inputs currently have a non-empty, new URL filled
  const filledInputsCount = useMemo(() => {
    return Object.entries(inputUrls).filter(([id, url]) => {
      if (typeof url !== 'string' || !url.trim()) return false;
      const item = allItems.find(i => i.id === id);
      return item && url.trim() !== (item.currentUrl || '');
    }).length;
  }, [inputUrls, allItems]);

  const handleUrlChange = (id: string, url: string) => {
    setInputUrls(prev => ({ ...prev, [id]: url }));
    // Clear any previous image load error when typing a new URL
    if (imageLoadErrors[id]) {
      setImageLoadErrors(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSaveSingle = async (item: UnifiedItem) => {
    const rawUrl = inputUrls[item.id] !== undefined ? inputUrls[item.id] : (item.currentUrl || '');
    const cleanUrl = sanitizeImageUrl(rawUrl) || '';

    if (item.type === 'TEAM') {
      onUpdateTeamLogo(item.id, cleanUrl);
    } else if (item.type === 'LEAGUE') {
      onUpdateLeagueLogo(item.id, cleanUrl);
    } else if (item.type === 'COUNTRY') {
      onUpdateCountryFlag(item.id, cleanUrl);
    }

    setSavedStatus(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setSavedStatus(prev => ({ ...prev, [item.id]: false }));
    }, 1500);
  };

  const handleSaveAllFilled = async () => {
    const countryUpdates: Record<string, string> = {};
    const leagueUpdates: Record<string, string> = {};
    const teamUpdates: Record<string, string> = {};
    let count = 0;

    Object.entries(inputUrls).forEach(([id, rawUrl]) => {
      const item = allItems.find(i => i.id === id);
      if (!item) return;

      const cleanUrl = sanitizeImageUrl(rawUrl);
      if (cleanUrl !== undefined && cleanUrl !== (item.currentUrl || '')) {
        if (item.type === 'TEAM') {
          teamUpdates[item.id] = cleanUrl;
          count++;
        } else if (item.type === 'LEAGUE') {
          leagueUpdates[item.id] = cleanUrl;
          count++;
        } else if (item.type === 'COUNTRY') {
          countryUpdates[item.id] = cleanUrl;
          count++;
        }
      }
    });

    if (count === 0) return;

    if (onBulkUpdateLogos) {
      await onBulkUpdateLogos({ countryUpdates, leagueUpdates, teamUpdates });
    } else {
      Object.entries(countryUpdates).forEach(([id, url]) => onUpdateCountryFlag(id, url));
      Object.entries(leagueUpdates).forEach(([id, url]) => onUpdateLeagueLogo(id, url));
      Object.entries(teamUpdates).forEach(([id, url]) => onUpdateTeamLogo(id, url));
    }

    setBatchSaveToast(`${count} URL(s) salvas com sucesso no banco de dados!`);
    setTimeout(() => setBatchSaveToast(null), 3500);
  };

  const handleExportExcel = async () => {
    const itemsToExport: PendingLogoItem[] = displayedItems.map(item => ({
      type: item.type,
      id: item.id,
      name: item.name,
      context: item.subContext ? `${item.context} - ${item.subContext}` : item.context,
      url: inputUrls[item.id] !== undefined ? inputUrls[item.id] : (item.currentUrl || ''),
    }));

    await exportPendingLogosToExcel(itemsToExport, `lista_escudos_${activeTab}_${statusFilter.toLowerCase()}`);
  };

  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExcelUploading(true);
    setExcelFeedback(null);

    try {
      const rows = await parsePendingLogosExcelFile(file);
      if (rows.length === 0) {
        setExcelFeedback({ error: 'Nenhuma URL de imagem válida encontrada no arquivo.' });
        return;
      }

      const countryUpdates: Record<string, string> = {};
      const leagueUpdates: Record<string, string> = {};
      const teamUpdates: Record<string, string> = {};
      let matchedCount = 0;

      rows.forEach(row => {
        const cleanUrl = sanitizeImageUrl(row.url);
        if (!cleanUrl) return;

        // Match by ID
        if (row.id) {
          const t = dbState.teams.find(team => team.id.toLowerCase() === row.id!.toLowerCase());
          if (t) {
            teamUpdates[t.id] = cleanUrl;
            matchedCount++;
            return;
          }
          const l = dbState.leagues.find(league => league.id.toLowerCase() === row.id!.toLowerCase());
          if (l) {
            leagueUpdates[l.id] = cleanUrl;
            matchedCount++;
            return;
          }
          const c = dbState.countries.find(country => country.id.toLowerCase() === row.id!.toLowerCase());
          if (c) {
            countryUpdates[c.id] = cleanUrl;
            matchedCount++;
            return;
          }
        }

        // Match by Name
        if (row.name) {
          const nameLower = row.name.toLowerCase().trim();
          const t = dbState.teams.find(team => team.name.toLowerCase().trim() === nameLower);
          if (t) {
            teamUpdates[t.id] = cleanUrl;
            matchedCount++;
            return;
          }
          const l = dbState.leagues.find(league => league.name.toLowerCase().trim() === nameLower);
          if (l) {
            leagueUpdates[l.id] = cleanUrl;
            matchedCount++;
            return;
          }
          const c = dbState.countries.find(country => country.name.toLowerCase().trim() === nameLower);
          if (c) {
            countryUpdates[c.id] = cleanUrl;
            matchedCount++;
            return;
          }
        }
      });

      if (matchedCount === 0) {
        setExcelFeedback({ error: 'Nenhum time, liga ou país correspondente aos IDs/Nomes do arquivo foi encontrado.' });
      } else {
        if (onBulkUpdateLogos) {
          await onBulkUpdateLogos({ countryUpdates, leagueUpdates, teamUpdates });
        } else {
          Object.entries(countryUpdates).forEach(([id, url]) => onUpdateCountryFlag(id, url));
          Object.entries(leagueUpdates).forEach(([id, url]) => onUpdateLeagueLogo(id, url));
          Object.entries(teamUpdates).forEach(([id, url]) => onUpdateTeamLogo(id, url));
        }
        setExcelFeedback({ success: `${matchedCount} imagem(ns) importada(s) e atualizada(s) com sucesso!` });
      }
    } catch (err: any) {
      setExcelFeedback({ error: err.message || 'Erro ao processar planilha Excel.' });
    } finally {
      setIsExcelUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBulkPasteSubmit = async () => {
    if (!bulkPasteText.trim()) return;

    const lines = bulkPasteText.split('\n').map(l => l.trim()).filter(Boolean);
    const countryUpdates: Record<string, string> = {};
    const leagueUpdates: Record<string, string> = {};
    const teamUpdates: Record<string, string> = {};
    let matchedCount = 0;

    lines.forEach(line => {
      let parts = line.split('\t');
      if (parts.length < 2) parts = line.split(';');
      if (parts.length < 2) parts = line.split(',');

      if (parts.length >= 2) {
        const key = parts[0].trim();
        const rawUrl = parts.slice(1).join(',').trim();
        const cleanUrl = sanitizeImageUrl(rawUrl);

        if (key && cleanUrl) {
          // Check by ID
          const teamById = dbState.teams.find(t => t.id.toLowerCase() === key.toLowerCase());
          if (teamById) {
            teamUpdates[teamById.id] = cleanUrl;
            matchedCount++;
            return;
          }

          const leagueById = dbState.leagues.find(l => l.id.toLowerCase() === key.toLowerCase());
          if (leagueById) {
            leagueUpdates[leagueById.id] = cleanUrl;
            matchedCount++;
            return;
          }

          const countryById = dbState.countries.find(c => c.id.toLowerCase() === key.toLowerCase());
          if (countryById) {
            countryUpdates[countryById.id] = cleanUrl;
            matchedCount++;
            return;
          }

          // Check by Name
          const keyLower = key.toLowerCase().trim();
          const teamByName = dbState.teams.find(t => t.name.toLowerCase().trim() === keyLower);
          if (teamByName) {
            teamUpdates[teamByName.id] = cleanUrl;
            matchedCount++;
            return;
          }

          const leagueByName = dbState.leagues.find(l => l.name.toLowerCase().trim() === keyLower);
          if (leagueByName) {
            leagueUpdates[leagueByName.id] = cleanUrl;
            matchedCount++;
            return;
          }

          const countryByName = dbState.countries.find(c => c.name.toLowerCase().trim() === keyLower);
          if (countryByName) {
            countryUpdates[countryByName.id] = cleanUrl;
            matchedCount++;
            return;
          }
        }
      }
    });

    if (matchedCount === 0) {
      setBulkPasteFeedback('Nenhum registro correspondente foi encontrado para as linhas coladas. Verifique o formato: Nome;URL ou ID;URL.');
    } else {
      if (onBulkUpdateLogos) {
        await onBulkUpdateLogos({ countryUpdates, leagueUpdates, teamUpdates });
      } else {
        Object.entries(countryUpdates).forEach(([id, url]) => onUpdateCountryFlag(id, url));
        Object.entries(leagueUpdates).forEach(([id, url]) => onUpdateLeagueLogo(id, url));
        Object.entries(teamUpdates).forEach(([id, url]) => onUpdateTeamLogo(id, url));
      }
      setBulkPasteFeedback(`${matchedCount} URL(s) aplicada(s) com sucesso!`);
      setTimeout(() => {
        setIsBulkPasteOpen(false);
        setBulkPasteText('');
        setBulkPasteFeedback(null);
      }, 1500);
    }
  };

  const handleCopyNames = () => {
    const text = displayedItems.map(i => `${i.name} (${i.context})`).join('\n');
    navigator.clipboard.writeText(text);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const getGoogleSearchUrl = (item: UnifiedItem) => {
    if (item.type === 'TEAM') {
      return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${item.name} ${item.context} escudo logo png`)}`;
    }
    if (item.type === 'LEAGUE') {
      return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${item.name} ${item.context} logo png`)}`;
    }
    return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${item.name} flag png icon`)}`;
  };

  return (
    <div className="space-y-5" id="pending-logos-section">
      {/* Toast Notification for Batch Save */}
      {batchSaveToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{batchSaveToast}</span>
        </div>
      )}

      {/* Header Banner with Real-Time Counters */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border border-blue-800/40 rounded-3xl p-6 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
                <Image className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Central de Escudos, Logos & Bandeiras</h2>
                <p className="text-xs text-blue-200/80 mt-0.5 max-w-2xl leading-relaxed">
                  Gerencie, envie URLs em massa, importe planilhas e visualize em tempo real quais clubes, ligas e países possuem ou não imagens cadastradas.
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="bg-slate-950/60 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-300">Times:</span>
                <span className="font-bold text-white">{stats.totalTeams}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-bold">{stats.teamsWithLogo} c/ logo</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 font-bold">{stats.teamsPending} pendentes</span>
              </div>

              <div className="bg-slate-950/60 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                <Trophy className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-slate-300">Ligas:</span>
                <span className="font-bold text-white">{stats.totalLeagues}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-bold">{stats.leaguesWithLogo} c/ logo</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 font-bold">{stats.leaguesPending} pendentes</span>
              </div>

              <div className="bg-slate-950/60 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">Países:</span>
                <span className="font-bold text-white">{stats.totalCountries}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-bold">{stats.countriesWithFlag} c/ bandeira</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 font-bold">{stats.countriesPending} pendentes</span>
              </div>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {filledInputsCount > 0 && (
              <button
                id="btn-save-all-filled-logos"
                onClick={handleSaveAllFilled}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                title="Salvar todas as URLs preenchidas de uma só vez"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Salvar {filledInputsCount} Alteração(ões)</span>
              </button>
            )}

            <button
              onClick={() => setIsBulkPasteOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
              title="Colar lista de URLs em massa (copiada do Excel/Notepad)"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Colar em Massa</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
              title="Exportar itens exibidos para planilha Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Exportar Excel</span>
            </button>

            <label className="px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isExcelUploading ? 'Importando...' : 'Importar Excel'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelFileSelect}
                disabled={isExcelUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Bulk Paste Modal */}
      {isBulkPasteOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-2xl w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Colar URLs em Massa</h3>
              </div>
              <button
                onClick={() => {
                  setIsBulkPasteOpen(false);
                  setBulkPasteFeedback(null);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Cole linhas no formato: <code className="bg-black/50 px-1.5 py-0.5 rounded text-blue-300">Nome ou ID;URL</code> ou separadas por Tabulação (copiado direto do Excel).
            </p>

            <div className="bg-black/30 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-slate-400 space-y-1">
              <p className="text-slate-500 font-bold uppercase text-[10px]">Exemplo de preenchimento:</p>
              <p>Arsenal;https://exemplo.com/logos/arsenal.png</p>
              <p>TIME-002;https://exemplo.com/logos/chelsea.png</p>
              <p>Premier League;https://exemplo.com/logos/premier.png</p>
              <p>Brasil;https://exemplo.com/flags/br.png</p>
            </div>

            <textarea
              rows={8}
              value={bulkPasteText}
              onChange={(e) => setBulkPasteText(e.target.value)}
              placeholder="Cole aqui suas linhas..."
              className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />

            {bulkPasteFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                bulkPasteFeedback.includes('sucesso')
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                <Info className="w-4 h-4 shrink-0" />
                <span>{bulkPasteFeedback}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkPasteOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBulkPasteSubmit}
                disabled={!bulkPasteText.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Processar e Atualizar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Feedback Message */}
      {excelFeedback && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
          excelFeedback.success
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm'
            : 'bg-red-50 text-red-800 border-red-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2">
            {excelFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{excelFeedback.success || excelFeedback.error}</span>
          </div>
          <button
            onClick={() => setExcelFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main Filter & Navigation Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Entity Scope Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({allItems.length})
            </button>

            <button
              onClick={() => setActiveTab('teams')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'teams'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Times ({stats.totalTeams})</span>
            </button>

            <button
              onClick={() => setActiveTab('leagues')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'leagues'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-purple-600" />
              <span>Ligas ({stats.totalLeagues})</span>
            </button>

            <button
              onClick={() => setActiveTab('countries')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'countries'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Países ({stats.totalCountries})</span>
            </button>
          </div>

          {/* Status Sub-Filters (Pending / Registered / All) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mostrar apenas itens que NÃO possuem imagem cadastrada"
              >
                Apenas Sem Imagem ({stats.totalPending})
              </button>

              <button
                onClick={() => setStatusFilter('REGISTERED')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'REGISTERED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mostrar itens com imagens cadastradas para conferência ou troca de URL"
              >
                Com Imagem ({stats.totalRegistered})
              </button>

              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mostrar todos os itens do banco"
              >
                Todos ({stats.totalEntities})
              </button>
            </div>

            {/* View Mode Toggle (Grid / Table) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Modo Cards Visuais"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Modo Tabela / Planilha"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter / Search Inputs */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, ID ou país..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          {(activeTab === 'all' || activeTab === 'teams' || activeTab === 'leagues') && dbState.countries.length > 0 && (
            <select
              value={selectedCountryFilter}
              onChange={(e) => {
                setSelectedCountryFilter(e.target.value);
                setSelectedLeagueFilter('');
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Países</option>
              {dbState.countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {(activeTab === 'all' || activeTab === 'teams') && dbState.leagues.length > 0 && (
            <select
              value={selectedLeagueFilter}
              onChange={(e) => setSelectedLeagueFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Ligas</option>
              {dbState.leagues
                .filter(l => !selectedCountryFilter || l.countryId === selectedCountryFilter)
                .map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
            </select>
          )}

          {(searchTerm || selectedCountryFilter || selectedLeagueFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCountryFilter('');
                setSelectedLeagueFilter('');
              }}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Limpar Filtros
            </button>
          )}

          <div className="text-xs text-slate-500 font-medium ml-auto">
            Exibindo <strong className="text-slate-900 font-bold">{displayedItems.length}</strong> itens
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {displayedItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {statusFilter === 'PENDING'
              ? 'Nenhum item pendente de imagem para os filtros selecionados!'
              : 'Nenhum item encontrado para os filtros selecionados.'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {statusFilter === 'PENDING'
              ? 'Todas as entidades neste filtro já possuem URLs válidas. Para visualizar ou alterar escudos existentes, selecione o filtro "Com Imagem" ou "Todos".'
              : 'Ajuste os filtros de busca ou país/liga acima.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (CARDS) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedItems.map(item => {
            const inputVal = inputUrls[item.id] !== undefined ? inputUrls[item.id] : (item.currentUrl || '');
            const isSaved = savedStatus[item.id];
            const hasError = imageLoadErrors[item.id];
            const isFilled = Boolean(inputVal.trim());
            const hasValidFormat = isValidImageUrl(inputVal);

            return (
              <div
                key={item.id}
                id={`pending-card-${item.id}`}
                className={`bg-white border ${
                  item.hasValidUrl
                    ? 'border-slate-200 hover:border-emerald-300'
                    : 'border-amber-200 hover:border-amber-400'
                } rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3.5 group`}
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Icon Preview & Name */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Live Image Box */}
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
                        {isFilled && !hasError ? (
                          <img
                            src={inputVal.trim()}
                            alt={item.name}
                            className="w-full h-full object-contain p-1"
                            onError={() => {
                              setImageLoadErrors(prev => ({ ...prev, [item.id]: true }));
                            }}
                          />
                        ) : item.type === 'TEAM' ? (
                          <Shield className="w-5 h-5 text-slate-400" />
                        ) : item.type === 'LEAGUE' ? (
                          <Trophy className="w-5 h-5 text-slate-400" />
                        ) : (
                          <Globe className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {/* Name and Tags */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            item.type === 'TEAM'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : item.type === 'LEAGUE'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.type === 'TEAM' ? 'Time' : item.type === 'LEAGUE' ? 'Liga' : 'País'}
                          </span>

                          <span className="text-[10px] font-mono text-slate-400 font-semibold">
                            {item.id}
                          </span>

                          {item.hasValidUrl ? (
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                              Cadastrado
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                              Sem Escudo
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm truncate mt-1" title={item.name}>
                          {item.name}
                        </h4>

                        <p className="text-[11px] text-slate-500 truncate" title={`${item.context} ${item.subContext ? `• ${item.subContext}` : ''}`}>
                          {item.subContext ? `${item.subContext} • ` : ''}{item.context}
                        </p>
                      </div>
                    </div>

                    {/* Google Search Shortcut Button */}
                    <a
                      href={getGoogleSearchUrl(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                      title="Pesquisar imagem no Google Imagens (nova aba)"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Broken image error notice */}
                  {hasError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-[10px] text-red-700 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>URL inacessível ou imagem corrompida. Cole uma nova URL válida.</span>
                    </div>
                  )}
                </div>

                {/* Bottom URL input and save button */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="url"
                      placeholder="Cole a URL da imagem (https://...)"
                      value={inputVal}
                      onChange={(e) => handleUrlChange(item.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveSingle(item);
                        }
                      }}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                    />
                  </div>

                  <button
                    onClick={() => handleSaveSingle(item)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-xs ${
                      isSaved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Salvo!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (COMPACT SHEET) */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-3 py-3">ID</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Contexto (País / Liga)</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-center">Preview</th>
                  <th className="px-4 py-3">URL da Imagem</th>
                  <th className="px-3 py-3 text-center">Buscar</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedItems.map(item => {
                  const inputVal = inputUrls[item.id] !== undefined ? inputUrls[item.id] : (item.currentUrl || '');
                  const isSaved = savedStatus[item.id];
                  const hasError = imageLoadErrors[item.id];

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          item.type === 'TEAM'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : item.type === 'LEAGUE'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {item.type === 'TEAM' ? 'Time' : item.type === 'LEAGUE' ? 'Liga' : 'País'}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {item.id}
                      </td>

                      <td className="px-4 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                        {item.name}
                      </td>

                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                        {item.subContext ? `${item.subContext} • ` : ''}{item.context}
                      </td>

                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        {item.hasValidUrl ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            OK
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <div className="w-7 h-7 mx-auto rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                          {inputVal.trim() && !hasError ? (
                            <img
                              src={inputVal.trim()}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={() => {
                                setImageLoadErrors(prev => ({ ...prev, [item.id]: true }));
                              }}
                            />
                          ) : (
                            <span className="text-[10px] text-slate-300">-</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-2.5 min-w-[280px]">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={inputVal}
                          onChange={(e) => handleUrlChange(item.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveSingle(item);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                        />
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <a
                          href={getGoogleSearchUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-blue-600 inline-block"
                          title="Buscar imagem no Google"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>

                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleSaveSingle(item)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            isSaved
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isSaved ? 'Salvo!' : 'Salvar'}
                        </button>
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
  );
};

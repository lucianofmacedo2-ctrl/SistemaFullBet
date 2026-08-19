import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { DbState, Team, League, Country } from '../types';
import {
  exportPendingLogosToExcel,
  parsePendingLogosExcelFile,
  PendingLogoItem,
} from '../utils/excelHelper';

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
type ViewMode = 'grid' | 'table';

export const PendingLogosManager: React.FC<PendingLogosManagerProps> = ({
  dbState,
  onUpdateTeamLogo,
  onUpdateLeagueLogo,
  onUpdateCountryFlag,
  onBulkUpdateLogos,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState('');

  // Local state for URL inputs per item { [id]: urlString }
  const [inputUrls, setInputUrls] = useState<Record<string, string>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  // Modals / Tools
  const [isBulkPasteOpen, setIsBulkPasteOpen] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [bulkPasteFeedback, setBulkPasteFeedback] = useState<string | null>(null);

  const [isExcelUploading, setIsExcelUploading] = useState(false);
  const [excelFeedback, setExcelFeedback] = useState<{ success?: string; error?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copyToast, setCopyToast] = useState(false);
  const [batchSaveToast, setBatchSaveToast] = useState<string | null>(null);

  // Filter items that DO NOT have a valid logo/flag URL
  const pendingTeams = dbState.teams.filter(t => !t.logoUrl || !t.logoUrl.trim());
  const pendingLeagues = dbState.leagues.filter(l => !l.logoUrl || !l.logoUrl.trim());
  const pendingCountries = dbState.countries.filter(c => !c.flagUrl || !c.flagUrl.trim());

  // Unified items list
  type UnifiedItem = {
    type: 'TEAM' | 'LEAGUE' | 'COUNTRY';
    id: string;
    name: string;
    context: string;
    subContext?: string;
    countryId?: string;
    leagueId?: string;
  };

  const allPendingItems: UnifiedItem[] = [
    ...pendingTeams.map(t => ({
      type: 'TEAM' as const,
      id: t.id,
      name: t.name,
      context: t.countryName,
      subContext: t.leagueName,
      countryId: t.countryId,
      leagueId: t.leagueId,
    })),
    ...pendingLeagues.map(l => ({
      type: 'LEAGUE' as const,
      id: l.id,
      name: l.name,
      context: l.countryName,
      countryId: l.countryId,
    })),
    ...pendingCountries.map(c => ({
      type: 'COUNTRY' as const,
      id: c.id,
      name: c.name,
      context: c.code ? `Código: ${c.code}` : 'País',
    })),
  ];

  // Filtered by tab
  const itemsByTab = allPendingItems.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'teams') return item.type === 'TEAM';
    if (activeTab === 'leagues') return item.type === 'LEAGUE';
    if (activeTab === 'countries') return item.type === 'COUNTRY';
    return true;
  });

  // Filtered by search & dropdowns
  const displayedItems = itemsByTab.filter(item => {
    const s = searchTerm.toLowerCase().trim();
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

  // Count how many inputs currently have a non-empty URL filled
  const filledInputsCount = Object.entries(inputUrls).filter(
    ([id, url]) => typeof url === 'string' && url.trim().length > 0 && allPendingItems.some(i => i.id === id)
  ).length;

  const handleUrlChange = (id: string, url: string) => {
    setInputUrls(prev => ({ ...prev, [id]: url }));
  };

  const handleSaveSingle = async (item: UnifiedItem) => {
    const url = inputUrls[item.id]?.trim();
    if (!url) return;

    if (item.type === 'TEAM') {
      onUpdateTeamLogo(item.id, url);
    } else if (item.type === 'LEAGUE') {
      onUpdateLeagueLogo(item.id, url);
    } else if (item.type === 'COUNTRY') {
      onUpdateCountryFlag(item.id, url);
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

    allPendingItems.forEach(item => {
      const url = inputUrls[item.id]?.trim();
      if (url) {
        if (item.type === 'TEAM') {
          teamUpdates[item.id] = url;
          count++;
        } else if (item.type === 'LEAGUE') {
          leagueUpdates[item.id] = url;
          count++;
        } else if (item.type === 'COUNTRY') {
          countryUpdates[item.id] = url;
          count++;
        }
      }
    });

    if (count === 0) return;

    if (onBulkUpdateLogos) {
      await onBulkUpdateLogos({ countryUpdates, leagueUpdates, teamUpdates });
    } else {
      // Fallback to sequential updates
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
      url: inputUrls[item.id] || '',
    }));

    await exportPendingLogosToExcel(itemsToExport, `pendencias_imagens_${activeTab}`);
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
        const url = row.url.trim();
        if (!url) return;

        // Try match by ID
        if (row.id) {
          const t = dbState.teams.find(team => team.id.toLowerCase() === row.id!.toLowerCase());
          if (t) {
            teamUpdates[t.id] = url;
            matchedCount++;
            return;
          }
          const l = dbState.leagues.find(league => league.id.toLowerCase() === row.id!.toLowerCase());
          if (l) {
            leagueUpdates[l.id] = url;
            matchedCount++;
            return;
          }
          const c = dbState.countries.find(country => country.id.toLowerCase() === row.id!.toLowerCase());
          if (c) {
            countryUpdates[c.id] = url;
            matchedCount++;
            return;
          }
        }

        // Try match by Name
        if (row.name) {
          const tName = row.name.toLowerCase();
          const t = dbState.teams.find(team => team.name.toLowerCase() === tName);
          if (t) {
            teamUpdates[t.id] = url;
            matchedCount++;
            return;
          }
          const l = dbState.leagues.find(league => league.name.toLowerCase() === tName);
          if (l) {
            leagueUpdates[l.id] = url;
            matchedCount++;
            return;
          }
          const c = dbState.countries.find(country => country.name.toLowerCase() === tName);
          if (c) {
            countryUpdates[c.id] = url;
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
      // Split by tab, semicolon, or comma
      let parts = line.split('\t');
      if (parts.length < 2) parts = line.split(';');
      if (parts.length < 2) parts = line.split(',');

      if (parts.length >= 2) {
        const key = parts[0].trim();
        const url = parts.slice(1).join(',').trim();

        if (key && url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
          // Check by ID
          const teamById = dbState.teams.find(t => t.id.toLowerCase() === key.toLowerCase());
          if (teamById) {
            teamUpdates[teamById.id] = url;
            matchedCount++;
            return;
          }

          const leagueById = dbState.leagues.find(l => l.id.toLowerCase() === key.toLowerCase());
          if (leagueById) {
            leagueUpdates[leagueById.id] = url;
            matchedCount++;
            return;
          }

          const countryById = dbState.countries.find(c => c.id.toLowerCase() === key.toLowerCase());
          if (countryById) {
            countryUpdates[countryById.id] = url;
            matchedCount++;
            return;
          }

          // Check by Name
          const keyLower = key.toLowerCase();
          const teamByName = dbState.teams.find(t => t.name.toLowerCase() === keyLower);
          if (teamByName) {
            teamUpdates[teamByName.id] = url;
            matchedCount++;
            return;
          }

          const leagueByName = dbState.leagues.find(l => l.name.toLowerCase() === keyLower);
          if (leagueByName) {
            leagueUpdates[leagueByName.id] = url;
            matchedCount++;
            return;
          }

          const countryByName = dbState.countries.find(c => c.name.toLowerCase() === keyLower);
          if (countryByName) {
            countryUpdates[countryByName.id] = url;
            matchedCount++;
            return;
          }
        }
      }
    });

    if (matchedCount === 0) {
      setBulkPasteFeedback('Nenhum item correspondente encontrado no texto. Formato esperado: Nome;URL ou ID;URL (uma linha por item).');
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

  const handleCopyPendingNames = () => {
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

  const totalPending = allPendingItems.length;

  return (
    <div className="space-y-5" id="pending-logos-section">
      {/* Toast Notification for Batch Save */}
      {batchSaveToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{batchSaveToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border border-blue-800/40 rounded-3xl p-6 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
                <Image className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black tracking-tight">Central de Escudos & Bandeiras Pendentes</h2>
                  {totalPending > 0 ? (
                    <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 text-xs font-black rounded-full shadow-sm">
                      {totalPending} sem imagem
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-sm">
                      100% Completo
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-200/80 mt-1 max-w-2xl leading-relaxed">
                  Cadastre e envie as URLs dos escudos de times, logos de ligas e bandeiras de países que ainda não possuem imagem. Conforme você salva, os itens saem automaticamente desta lista.
                </p>
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
                <span>Salvar Tudo Preenchido ({filledInputsCount})</span>
              </button>
            )}

            <button
              id="btn-open-bulk-paste-modal"
              onClick={() => setIsBulkPasteOpen(true)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
              title="Colar texto com Nome;URL ou ID;URL em massa"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Colar em Massa</span>
            </button>

            <button
              id="btn-export-pending-excel"
              onClick={handleExportExcel}
              disabled={displayedItems.length === 0}
              className="px-3 py-2 bg-blue-600/60 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-blue-400/30 disabled:opacity-40"
              title="Baixar planilha Excel com todos os itens pendentes"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Excel</span>
            </button>

            <label
              htmlFor="excel-upload-input"
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-400/40 shadow-sm"
              title="Subir planilha Excel preenchida com URLs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isExcelUploading ? 'Importando...' : 'Subir Excel'}</span>
            </label>
            <input
              id="excel-upload-input"
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Excel Feedback message */}
        {excelFeedback && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            excelFeedback.success ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-red-500/20 text-red-200 border border-red-400/30'
          }`}>
            <span>{excelFeedback.success || excelFeedback.error}</span>
            <button onClick={() => setExcelFeedback(null)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs & View Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Subtabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              id="tab-all-pending"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Todos Pendentes ({totalPending})
            </button>

            <button
              id="tab-teams-pending"
              onClick={() => setActiveTab('teams')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'teams'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Times ({pendingTeams.length})
            </button>

            <button
              id="tab-leagues-pending"
              onClick={() => setActiveTab('leagues')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'leagues'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Ligas ({pendingLeagues.length})
            </button>

            <button
              id="tab-countries-pending"
              onClick={() => setActiveTab('countries')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'countries'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Países ({pendingCountries.length})
            </button>
          </div>

          {/* View Mode & Helper Buttons */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={handleCopyPendingNames}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Copiar nomes dos itens pendentes para a área de transferência"
            >
              <Copy className="w-3 h-3 text-slate-500" />
              <span>{copyToast ? 'Copiado!' : 'Copiar Nomes'}</span>
            </button>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Modo Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
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
              placeholder="Buscar por nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          {(activeTab === 'all' || activeTab === 'teams' || activeTab === 'leagues') && dbState.countries.length > 0 && (
            <select
              value={selectedCountryFilter}
              onChange={(e) => setSelectedCountryFilter(e.target.value)}
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
              {dbState.leagues.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}

          <div className="text-xs text-slate-500 font-medium ml-auto">
            Exibindo <strong className="text-slate-900 font-bold">{displayedItems.length}</strong> de {allPendingItems.length} pendentes
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
            {searchTerm || selectedCountryFilter || selectedLeagueFilter
              ? 'Nenhum item pendente encontrado para os filtros selecionados.'
              : 'Tudo pronto! Todas as entidades possuem imagens cadastradas.'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Novos times, ligas ou países adicionados via importação ou CSV sem URL aparecerão aqui automaticamente.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (CARDS) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedItems.map(item => {
            const currentInput = inputUrls[item.id] || '';
            const isSaved = savedStatus[item.id];

            return (
              <div
                key={item.id}
                id={`pending-card-${item.id}`}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3.5 group"
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Icon Preview & Name */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Live Image Box */}
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
                        {currentInput.trim() ? (
                          <img
                            src={currentInput.trim()}
                            alt={item.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
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

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900 truncate" title={item.name}>
                            {item.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            item.type === 'TEAM'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : item.type === 'LEAGUE'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.type === 'TEAM' ? 'Time' : item.type === 'LEAGUE' ? 'Liga' : 'País'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 truncate">
                            {item.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {item.subContext ? `${item.subContext} • ` : ''}{item.context}
                        </p>
                      </div>
                    </div>

                    {/* Google Image Shortcut */}
                    <a
                      href={getGoogleSearchUrl(item)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl border border-slate-200 transition-colors shrink-0 flex items-center gap-1 text-[11px] font-semibold"
                      title="Buscar no Google Imagens"
                    >
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  </div>
                </div>

                {/* Bottom URL Input & Save Button */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="url"
                      placeholder="Cole a URL da imagem (https://...)"
                      value={currentInput}
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
                    disabled={!currentInput.trim()}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-xs ${
                      isSaved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
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
                  <th className="px-3 py-3 text-center">Preview</th>
                  <th className="px-4 py-3">URL da Imagem</th>
                  <th className="px-3 py-3 text-center">Buscar</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedItems.map(item => {
                  const currentInput = inputUrls[item.id] || '';
                  const isSaved = savedStatus[item.id];

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

                      <td className="px-3 py-2.5 text-center">
                        <div className="w-7 h-7 mx-auto rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                          {currentInput.trim() ? (
                            <img
                              src={currentInput.trim()}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
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
                          value={currentInput}
                          onChange={(e) => handleUrlChange(item.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveSingle(item);
                            }
                          }}
                          className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                        />
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <a
                          href={getGoogleSearchUrl(item)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg inline-flex items-center"
                          title="Buscar imagem no Google"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </a>
                      </td>

                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleSaveSingle(item)}
                          disabled={!currentInput.trim()}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            isSaved
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
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

      {/* Bulk Paste Modal */}
      {isBulkPasteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Colar URLs de Imagens em Massa</h3>
                  <p className="text-xs text-slate-500">Cole linhas de texto ou dados copiados de planilhas</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsBulkPasteOpen(false);
                  setBulkPasteFeedback(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Formatos suportados (uma linha por time/liga/país):</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500 font-mono text-[11px]">
                <li>Nome;URL (ex: Flamengo;https://.../flamengo.png)</li>
                <li>ID;URL (ex: TIME-001;https://.../escudo.png)</li>
                <li>Nome \t URL (colado diretamente do Excel ou Google Sheets)</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Cole aqui sua lista:</label>
              <textarea
                rows={8}
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder={"Flamengo;https://url-do-escudo.png\nPalmeiras;https://url-do-escudo.png\nPremier League;https://url-logo.png\nBrasil;https://url-bandeira.png"}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {bulkPasteFeedback && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                bulkPasteFeedback.includes('sucesso')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {bulkPasteFeedback}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsBulkPasteOpen(false);
                  setBulkPasteFeedback(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBulkPasteSubmit}
                disabled={!bulkPasteText.trim()}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40"
              >
                Processar e Salvar URLs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

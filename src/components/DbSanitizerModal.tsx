import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Shield,
  Layers,
  Globe,
  ArrowRight,
  RefreshCw,
  X,
  Database,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { DbState } from '../types';
import { diagnoseDatabaseAnomalies, sanitizeAndCleanDb, SanitizeStats, AnomalyReport } from '../utils/dbSanitizer';

interface DbSanitizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onApplyCleanedDb: (cleanedDb: DbState) => Promise<void>;
}

export const DbSanitizerModal: React.FC<DbSanitizerModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onApplyCleanedDb,
}) => {
  const [isFixing, setIsFixing] = useState(false);
  const [lastResultStats, setLastResultStats] = useState<SanitizeStats | null>(null);

  // Diagnóstico em tempo real
  const report: AnomalyReport = useMemo(() => {
    return diagnoseDatabaseAnomalies(dbState);
  }, [dbState]);

  if (!isOpen) return null;

  const handleExecuteFix = async () => {
    try {
      setIsFixing(true);
      const { cleanedDb, stats } = sanitizeAndCleanDb(dbState);
      await onApplyCleanedDb(cleanedDb);
      setLastResultStats(stats);
    } catch (err) {
      console.error('Erro ao sanitizar banco de dados:', err);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                Diagnóstico & Correção Automática de Times
              </h2>
              <p className="text-xs text-slate-300">
                Limpeza de ligas cruzadas, desduplicação de times e restauração de integridade
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">

          {/* Success Banner if fix was just applied */}
          {lastResultStats && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Correção Automática Concluída com Sucesso!</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold pt-1">
                <div className="bg-white p-2 rounded-lg border border-emerald-200">
                  <span className="text-slate-500 block text-[10px]">Ligas Cruzadas Removidas</span>
                  <span className="text-emerald-700 text-base font-black">+{lastResultStats.foreignLeaguesRemoved}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-200">
                  <span className="text-slate-500 block text-[10px]">Times Reparados</span>
                  <span className="text-emerald-700 text-base font-black">+{lastResultStats.teamsCleaned}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-200">
                  <span className="text-slate-500 block text-[10px]">Duplicidades Mescladas</span>
                  <span className="text-emerald-700 text-base font-black">+{lastResultStats.duplicatesRemoved}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-200">
                  <span className="text-slate-500 block text-[10px]">Jogos Sincronizados</span>
                  <span className="text-emerald-700 text-base font-black">+{lastResultStats.matchesFixed}</span>
                </div>
              </div>
            </div>
          )}

          {/* Diagnosis Status Box */}
          <div className="p-4 rounded-xl border transition-all">
            {report.totalAnomaliesCount > 0 ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-700 font-black text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>
                      {report.totalAnomaliesCount} Anomalia(s) Detectada(s) no Banco de Dados
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-xs font-black rounded-full">
                    Ação Necessária
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Foram identificados clubes com ligas de países diferentes vinculadas (por exemplo, times da Holanda, Escócia ou Bélgica listados na Championship da Inglaterra) ou times duplicados.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-emerald-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-black">Banco de Dados 100% Saudável e Consistente</h4>
                  <p className="text-xs text-slate-600">
                    Nenhum time duplicado, sem país ou com vínculo de liga estrangeira foi encontrado.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Lists of Anomalies */}
          {report.crossCountryTeams.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Times com Ligas Estrangeiras Incorretas ({report.crossCountryTeams.length})</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Serão removidas as ligas que não pertencem ao país do time
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {report.crossCountryTeams.map((item) => (
                  <div key={item.teamId} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{item.teamName}</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[11px] font-bold">
                          País Real: {item.countryName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {item.teamId}</span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-red-700 bg-red-50/80 px-2 py-1 rounded border border-red-200">
                        <X className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className="font-semibold">Ligas Indevidas a Remover:</span>
                        <span className="font-bold">
                          {item.invalidLeagues.map(l => `${l.name} (${l.countryName})`).join(', ')}
                        </span>
                      </div>
                      {item.validLeagues.length > 0 && (
                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded border border-emerald-200">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold">Ligas Válidas Mantidas:</span>
                          <span className="font-bold">{item.validLeagues.map(l => l.name).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate Leagues List */}
          {report.duplicateLeagues && report.duplicateLeagues.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Ligas Duplicadas ou Sinônimos Detectados ({report.duplicateLeagues.length})</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Serão mescladas em 1 única liga com todos os jogos unificados
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {report.duplicateLeagues.map((dup, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{dup.canonicalName}</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold">
                          {dup.countryName}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 font-bold text-xs rounded-full">
                        Total consolidado: {dup.totalMatches} partidas
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="font-semibold text-slate-700">Variações encontradas:</span>
                      {dup.leagueNames.map((nameStr, nIdx) => (
                        <span key={nIdx} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[11px] font-bold text-slate-800">
                          {nameStr}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicates List */}
          {report.duplicateTeams.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Times com Nomes Duplicados no Mesmo País ({report.duplicateTeams.length})</span>
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {report.duplicateTeams.map((dup, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{dup.name}</span>
                      <span className="text-slate-500 ml-2 font-medium">({dup.countryName})</span>
                    </div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-900 rounded font-bold text-[11px]">
                      {dup.count} registros → será mesclado em 1
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Card on how the automation works */}
          <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-xs text-indigo-950">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Como a correção automática funciona:</span>
              <ul className="list-disc list-inside space-y-0.5 text-indigo-900/90 text-[11px]">
                <li>Remove instantaneamente qualquer liga estrangeira do cadastro do time.</li>
                <li>Preserva 100% dos jogos, gols, estatísticas e datas já registradas.</li>
                <li>Mescla escudos e referências duplicadas sem deixar times órfãos.</li>
                <li>Salva as correções imediatamente na nuvem/servidor e no navegador.</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <button
            onClick={handleExecuteFix}
            disabled={isFixing}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              report.totalAnomaliesCount > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            } disabled:opacity-50`}
          >
            {isFixing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Corrigindo e Salvando...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Executar Correção Automática em 1 Clique</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

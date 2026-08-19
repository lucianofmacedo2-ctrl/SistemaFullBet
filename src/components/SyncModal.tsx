import React, { useState } from 'react';
import {
  RefreshCw,
  CloudDownload,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Globe,
  Shield,
  Trophy,
  ListOrdered,
  ArrowRight,
} from 'lucide-react';
import { DbState } from '../types';
import { fetchDatabaseState, saveDatabaseState } from '../services/dbService';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onSyncComplete: (newState: DbState, message: string) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onSyncComplete,
}) => {
  const [isLoadingServer, setIsLoadingServer] = useState(false);
  const [isLoadingOnline, setIsLoadingOnline] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // 1. Recarrega dados salvos no data/football_db.json do servidor
  const handleReloadServerDb = async () => {
    setIsLoadingServer(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/db', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error(`Erro do servidor: HTTP ${response.status}`);
      const freshDb = await response.json();
      
      onSyncComplete(
        freshDb,
        `Banco carregado com sucesso! ${freshDb.teams.length} times, ${freshDb.leagues.length} ligas, ${freshDb.countries.length} países e ${freshDb.matches.length} jogos carregados.`
      );
      setStatusMessage({
        type: 'success',
        text: `Carregado com sucesso: ${freshDb.teams.length} times, ${freshDb.leagues.length} ligas, ${freshDb.countries.length} países e ${freshDb.matches.length} partidas!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Erro ao carregar dados do servidor: ${err.message || String(err)}`,
      });
    } finally {
      setIsLoadingServer(false);
    }
  };

  // 2. Dispara sincronização online com o football-data.co.uk pelo backend Node.js
  const handleRunOnlineSync = async () => {
    setIsLoadingOnline(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/sync/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao sincronizar dados online.');
      }
      
      const freshDb = resData.db;
      onSyncComplete(freshDb, resData.result?.message || 'Sincronização online concluída!');
      setStatusMessage({
        type: 'success',
        text: resData.result?.message || 'Sincronização online concluída com sucesso!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Erro ao sincronizar online: ${err.message || String(err)}`,
      });
    } finally {
      setIsLoadingOnline(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <RefreshCw className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sincronização Automática de Dados</h2>
              <p className="text-xs text-blue-200">
                Atualize o banco com os arquivos do servidor ou sincronize direto do Football-Data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current State Indicator */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Estado Atual na Tela
            </span>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xl font-black text-blue-600 block">{dbState.matches.length}</span>
                <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-1">
                  <ListOrdered className="w-3 h-3 text-blue-500" /> Jogos
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xl font-black text-emerald-600 block">{dbState.teams.length}</span>
                <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-500" /> Times
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xl font-black text-amber-600 block">{dbState.leagues.length}</span>
                <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-500" /> Ligas
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xl font-black text-indigo-600 block">{dbState.countries.length}</span>
                <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-1">
                  <Globe className="w-3 h-3 text-indigo-500" /> Países
                </span>
              </div>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-3">
            {/* Option 1: Carregar do disco data/football_db.json */}
            <div className="border border-blue-200 bg-blue-50/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-blue-950">
                  <Database className="w-4 h-4 text-blue-600" />
                  Carregar Banco do Servidor (data/football_db.json)
                </div>
                <p className="text-xs text-blue-800">
                  Puxa imediatamente todos os clubes, ligas, países e partidas consolidadas salvos no arquivo do sistema.
                </p>
              </div>
              <button
                onClick={handleReloadServerDb}
                disabled={isLoadingServer || isLoadingOnline}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingServer ? 'animate-spin' : ''}`} />
                {isLoadingServer ? 'Carregando...' : 'Carregar Agora'}
              </button>
            </div>

            {/* Option 2: Sincronizar ao vivo com Football-Data.co.uk */}
            <div className="border border-indigo-200 bg-indigo-50/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-950">
                  <CloudDownload className="w-4 h-4 text-indigo-600" />
                  Sincronizar Online (21 Ligas Europeias)
                </div>
                <p className="text-xs text-indigo-800">
                  O servidor baixa os CSVs mais recentes do football-data.co.uk e cadastra times e partidas automaticamente.
                </p>
              </div>
              <button
                onClick={handleRunOnlineSync}
                disabled={isLoadingServer || isLoadingOnline}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOnline ? 'animate-spin' : ''}`} />
                {isLoadingOnline ? 'Baixando...' : 'Sincronizar Online'}
              </button>
            </div>
          </div>

          {/* Feedback Status */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

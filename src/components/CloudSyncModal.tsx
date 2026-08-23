import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Users,
  Trophy,
  Globe,
  Shield,
  Image,
  Layers,
  Clock,
  X,
  Radio,
  Zap,
} from 'lucide-react';
import { DbState } from '../types';
import {
  saveDbToFirestore,
  fetchDbFromFirestore,
  computeCloudStats,
  CloudSyncStats,
} from '../services/firebaseDbService';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onApplyDbState?: (newState: DbState) => void;
  onApplyCloudDb?: (newState: DbState) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onApplyDbState,
  onApplyCloudDb,
}) => {
  const [stats, setStats] = useState<CloudSyncStats>(() => computeCloudStats(dbState));
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStats(computeCloudStats(dbState));
      setStatusMessage(null);
    }
  }, [isOpen, dbState]);

  if (!isOpen) return null;

  const handleUploadToFirestore = async () => {
    setIsUploading(true);
    setStatusMessage({ type: 'info', text: 'Enviando todos os dados para a Nuvem Firestore...' });
    try {
      const ok = await saveDbToFirestore(dbState);
      if (ok) {
        setStats(computeCloudStats(dbState));
        setStatusMessage({
          type: 'success',
          text: 'Banco de dados enviado e sincronizado com sucesso no Firestore! Todos os celulares e computadores agora têm acesso aos mesmos dados em tempo real.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Erro ao enviar dados para o Firestore. Verifique a conexão com a internet.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Falha no upload: ${err?.message || 'Erro desconhecido'}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadFromFirestore = async () => {
    setIsDownloading(true);
    setStatusMessage({ type: 'info', text: 'Buscando dados mais recentes da Nuvem Firestore...' });
    try {
      const cloudData = await fetchDbFromFirestore();
      if (cloudData && (cloudData.matches?.length > 0 || cloudData.countries?.length > 0)) {
        if (onApplyCloudDb) onApplyCloudDb(cloudData);
        if (onApplyDbState) onApplyDbState(cloudData);
        setStats(computeCloudStats(cloudData));
        setStatusMessage({
          type: 'success',
          text: `Download concluído com sucesso! ${cloudData.matches?.length || 0} partidas e ${cloudData.teams?.length || 0} times carregados da nuvem.`,
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: 'Nenhum dado encontrado na nuvem para download ou nuvem vazia. Envie seus dados locais clicando em "Enviar Dados para a Nuvem".',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Falha ao baixar da nuvem: ${err?.message || 'Erro desconhecido'}`,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const teamsPercent = stats.teamsCount > 0 ? Math.round((stats.teamsWithLogo / stats.teamsCount) * 100) : 0;
  const leaguesPercent = stats.leaguesCount > 0 ? Math.round((stats.leaguesWithLogo / stats.leaguesCount) * 100) : 0;
  const countriesPercent = stats.countriesCount > 0 ? Math.round((stats.countriesWithFlag / stats.countriesCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Central de Controle da Nuvem Firestore
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Ao Vivo (Real-Time)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sincronização instantânea e replicação contínua entre computadores, celulares e Vercel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/30 border-rose-800 text-rose-200'
                  : 'bg-blue-950/30 border-blue-800 text-blue-200'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-5 h-5 text-blue-400 animate-spin shrink-0 mt-0.5" />}
              <p className="text-sm">{statusMessage.text}</p>
            </div>
          )}

          {/* Real-time Status Card */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Escuta Bi-direcional Ativa (onSnapshot)</p>
                <p className="text-xs text-slate-400">
                  Novos jogos, alterações de odds e cadastros são sincronizados automaticamente em todos os dispositivos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleUploadToFirestore}
                disabled={isUploading || isDownloading}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <CloudUpload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                {isUploading ? 'Enviando...' : 'Enviar Dados para a Nuvem'}
              </button>

              <button
                onClick={handleDownloadFromFirestore}
                disabled={isUploading || isDownloading}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-50 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer"
              >
                <CloudDownload className={`w-4 h-4 ${isDownloading ? 'animate-spin' : ''}`} />
                {isDownloading ? 'Baixando...' : 'Baixar da Nuvem'}
              </button>
            </div>
          </div>

          {/* Grade Completa de Entidades */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              Grade de Entidades Sincronizadas
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Partidas */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">Partidas</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{stats.matchesCount}</div>
                <span className="text-[11px] text-slate-400 mt-1">Jogos cadastrados</span>
              </div>

              {/* Clubes */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">Clubes / Times</span>
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{stats.teamsCount}</div>
                <span className="text-[11px] text-slate-400 mt-1">Times ativos</span>
              </div>

              {/* Ligas */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">Ligas / Ligas</span>
                  <Trophy className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{stats.leaguesCount}</div>
                <span className="text-[11px] text-slate-400 mt-1">Campeonatos</span>
              </div>

              {/* Países */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">Países</span>
                  <Globe className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{stats.countriesCount}</div>
                <span className="text-[11px] text-slate-400 mt-1">Federações</span>
              </div>

              {/* Usuários */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">Usuários</span>
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{stats.usersCount}</div>
                <span className="text-[11px] text-slate-400 mt-1">Perfis cadastrados</span>
              </div>
            </div>
          </div>

          {/* Quadro Exclusivo de URLs de Escudos e Bandeiras */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Image className="w-4 h-4 text-indigo-400" />
                Quadro de URLs de Escudos e Bandeiras
              </h3>
              <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                Total de Imagens: <strong className="text-indigo-300">{stats.totalImagesCount}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Escudos de Clubes */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Escudos de Clubes
                  </span>
                  <span className="font-bold text-emerald-400">{stats.teamsWithLogo} / {stats.teamsCount} ({teamsPercent}%)</span>
                </div>
                <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${teamsPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">Escudos oficiais vinculados para exibição em tabelas e confrontos.</p>
              </div>

              {/* Logos de Ligas */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                    Logos de Ligas
                  </span>
                  <span className="font-bold text-indigo-400">{stats.leaguesWithLogo} / {stats.leaguesCount} ({leaguesPercent}%)</span>
                </div>
                <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${leaguesPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">Emblemas de campeonatos para cabeçalhos e relatórios.</p>
              </div>

              {/* Bandeiras de Países */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    Bandeiras de Países
                  </span>
                  <span className="font-bold text-cyan-400">{stats.countriesWithFlag} / {stats.countriesCount} ({countriesPercent}%)</span>
                </div>
                <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${countriesPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">Bandeiras e brasões nacionais para filtros geográficos.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Última sincronização: {new Date().toLocaleTimeString('pt-BR')}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

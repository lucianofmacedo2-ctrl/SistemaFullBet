import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Database,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { DbState } from '../types';

interface ResetDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onConfirmReset: () => Promise<void> | void;
}

const REQUIRED_PASSWORD = 'Otavio@2010';

export const ResetDatabaseModal: React.FC<ResetDatabaseModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onConfirmReset,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const totalMatches = dbState.matches.length;
  const totalTeams = dbState.teams.length;
  const totalLeagues = dbState.leagues.length;
  const totalCountries = dbState.countries.length;
  const totalEntities = totalMatches + totalTeams + totalLeagues + totalCountries;

  const handleClose = () => {
    setPassword('');
    setErrorMsg('');
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password) {
      setErrorMsg('Por favor, digite a senha de segurança para confirmar.');
      return;
    }

    if (password !== REQUIRED_PASSWORD) {
      setErrorMsg('Senha incorreta! Ação de reset não autorizada.');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirmReset();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao resetar o banco de dados. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-red-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-6">
        {/* Header com destaque de alerta */}
        <div className="flex items-center justify-between p-4.5 border-b border-red-100 bg-red-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-md shadow-red-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Resetar Banco de Dados
                <span className="text-[10px] bg-red-600 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                  PERIGO
                </span>
              </h3>
              <p className="text-xs text-slate-600">
                Limpeza completa e restauração do banco de dados
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Summary of what will be erased */}
          <div className="p-4 bg-red-50/60 border border-red-200 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>Esta ação apagará permanentemente todos os dados:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 bg-white rounded-lg border border-red-100 text-center">
                <span className="text-[10px] text-slate-500 block font-medium">Partidas</span>
                <span className="text-sm font-bold text-red-600">{totalMatches}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-red-100 text-center">
                <span className="text-[10px] text-slate-500 block font-medium">Times</span>
                <span className="text-sm font-bold text-red-600">{totalTeams}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-red-100 text-center">
                <span className="text-[10px] text-slate-500 block font-medium">Ligas</span>
                <span className="text-sm font-bold text-red-600">{totalLeagues}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-red-100 text-center">
                <span className="text-[10px] text-slate-500 block font-medium">Países</span>
                <span className="text-sm font-bold text-red-600">{totalCountries}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic text-center pt-1">
              Total de {totalEntities} registro(s) serão removidos do armazenamento. O sistema voltará ao estado 100% limpo (0 itens).
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Password Prompt */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Senha de Segurança para Resetar
              </span>
              <span className="text-[11px] font-normal text-slate-500 lowercase">
                confirmação obrigatória
              </span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Digite a senha de segurança..."
                autoFocus
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono transition-all text-slate-900 placeholder:text-slate-400 placeholder:font-sans"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Digite a senha definida pelo administrador (<span className="font-mono font-bold text-slate-700">Otavio@2010</span>) para autorizar a limpeza.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Limpando Banco...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Confirmar & Limpar Tudo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

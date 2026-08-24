import React from 'react';
import { ShieldAlert, Laptop, LogIn, RefreshCw } from 'lucide-react';
import { AppUser } from '../types';
import { ActiveSessionRecord } from '../services/sessionService';

interface ConcurrentSessionOverlayProps {
  isOpen: boolean;
  user: AppUser | null;
  remoteInfo?: ActiveSessionRecord | null;
  onReconnectHere: () => void;
  onSwitchAccount: () => void;
}

export const ConcurrentSessionOverlay: React.FC<ConcurrentSessionOverlayProps> = ({
  isOpen,
  user,
  remoteInfo,
  onReconnectHere,
  onSwitchAccount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-red-200 overflow-hidden text-center animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Ribbon */}
        <div className="bg-linear-to-r from-red-600 to-rose-700 p-6 text-white flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3 shadow-inner ring-4 ring-white/10 animate-pulse">
            <ShieldAlert className="w-9 h-9 text-white" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest bg-red-900/50 px-3 py-0.5 rounded-full mb-1.5 text-red-100 border border-red-400/30">
            Acesso Simultâneo Não Permitido
          </span>
          <h2 className="text-xl font-black tracking-tight">
            Sessão Desconectada
          </h2>
          <p className="text-xs text-red-100 mt-1 max-w-sm">
            Este usuário foi conectado em outro computador, celular ou navegador.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-left">
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
            <Laptop className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 leading-relaxed">
              <p className="font-bold text-amber-900 mb-0.5">
                Usuário: <span className="font-mono text-slate-900 font-black">@{user?.username || 'consulta'}</span> ({user?.name || 'Consulta'})
              </p>
              <p className="text-amber-800">
                Por política de segurança do sistema, <strong>não é permitido utilizar o mesmo usuário e senha em dois locais ao mesmo tempo</strong>.
              </p>
              {remoteInfo?.clientInfo && (
                <p className="mt-1 text-[11px] text-amber-700 font-mono bg-white/60 px-2 py-0.5 rounded border border-amber-200/60 inline-block">
                  Última conexão: {remoteInfo.clientInfo} às{' '}
                  {new Date(remoteInfo.lastHeartbeat || Date.now()).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1.5">
            <p className="font-semibold text-slate-800">O que você pode fazer:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
              <li>Se foi você quem abriu em outra aba ou aparelho, clique em <strong>Reconectar Aqui</strong> para trazer o acesso de volta a esta tela.</li>
              <li>Se outra pessoa estiver usando este login, entre com suas próprias credenciais ou solicite um usuário individual ao administrador.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={onReconnectHere}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reconectar Neste Dispositivo</span>
            </button>

            <button
              onClick={onSwitchAccount}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-300 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Trocar de Conta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Lock, Clock, AlertTriangle, LogOut, ShieldAlert, Key } from 'lucide-react';
import { AppUser } from '../types';
import { getUserEffectiveStatus } from '../services/authService';

interface AccessExpiredOverlayProps {
  currentUser: AppUser;
  onLogout: () => void;
  onOpenLoginModal: () => void;
}

export const AccessExpiredOverlay: React.FC<AccessExpiredOverlayProps> = ({
  currentUser,
  onLogout,
  onOpenLoginModal,
}) => {
  const eff = getUserEffectiveStatus(currentUser);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          eff.isBlocked ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
        }`}>
          {eff.isBlocked ? <ShieldAlert className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
          {eff.isBlocked ? 'Acesso Bloqueado' : 'Período de Acesso Expirado'}
        </h2>

        <p className="text-sm text-slate-600 mb-6">
          {eff.isBlocked ? (
            'Seu perfil de consulta foi temporariamente suspenso pelo administrador master.'
          ) : (
            <>
              Seu período de consulta e análise esportiva expirou em{' '}
              <strong className="text-slate-800 font-bold">{eff.formattedExpiresAt}</strong>.
            </>
          )}
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2 mb-6 text-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Usuário:</span>
            <span className="font-bold text-slate-900">{currentUser.name} ({currentUser.username})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status da Conta:</span>
            <span className={`font-bold ${eff.isBlocked ? 'text-red-600' : 'text-amber-600'}`}>
              {eff.statusLabel}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500 italic">
            Para renovar seu acesso (30, 90, 180 dias ou 1 ano), entre em contato com o administrador master do sistema.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onOpenLoginModal}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Key className="w-4 h-4" />
            <span>Trocar de Conta / Entrar como Master</span>
          </button>

          <button
            onClick={onLogout}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
};
